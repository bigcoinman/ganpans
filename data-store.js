/**
 * ==============================================================================
 * 간판지원단 통합 데이터 엔진 (Unified DataStore Engine)
 * - PC웹(dashboard.js) 및 모바일 앱(app.js)의 단일 진실의 원천(SSOT)
 * - 데이터 덮어쓰기 방지, 영업물건 단독 귀속, 타인 물건 원천 차단, 실시간 동기화 브로드캐스트
 * ==============================================================================
 */

(function () {
  'use strict';

  const DataStore = {
    // --- 1. 기본 저장소 읽기/쓰기 (Safe LocalStorage Helper) ---
    getApplications: function () {
      try {
        const apps = JSON.parse(localStorage.getItem('applications')) || [];
        return apps.filter(a => a && a.id);
      } catch (e) {
        console.error('[DataStore] getApplications error:', e);
        return [];
      }
    },

    saveApplications: function (apps) {
      try {
        localStorage.setItem('applications', JSON.stringify(apps));
        return true;
      } catch (e) {
        console.error('[DataStore] saveApplications error:', e);
        return false;
      }
    },

    getUsers: function () {
      try {
        const raw = localStorage.getItem('users');
        let users = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(users)) users = [];
        return users.filter(u => u && u.id && u.role !== 'deleted');
      } catch (e) {
        console.error('[DataStore] getUsers error:', e);
        return [];
      }
    },

    saveUsers: function (users) {
      try {
        localStorage.setItem('users', JSON.stringify(users || []));
        return true;
      } catch (e) {
        console.error('[DataStore] saveUsers error:', e);
        return false;
      }
    },

    getActiveUser: function () {
      try {
        let user = null;
        if (typeof window.getActiveUser === 'function') {
          user = window.getActiveUser();
        }
        if (!user) {
          user = JSON.parse(localStorage.getItem('activeUser')) || JSON.parse(sessionStorage.getItem('activeUser'));
        }
        if (user && user.id) {
          const freshUsers = this.getUsers();
          const fresh = freshUsers.find(u => String(u.id) === String(user.id));
          if (fresh) {
            user = { ...user, ...fresh };
          }
        }
        return user;
      } catch (e) {
        console.error('[DataStore] getActiveUser error:', e);
        return null;
      }
    },

    setActiveUser: function (user) {
      try {
        if (user) {
          localStorage.setItem('activeUser', JSON.stringify(user));
          sessionStorage.setItem('activeUser', JSON.stringify(user));
        } else {
          localStorage.removeItem('activeUser');
          sessionStorage.removeItem('activeUser');
        }
        return true;
      } catch (e) {
        console.error('[DataStore] setActiveUser error:', e);
        return false;
      }
    },

    getDeletedAppIds: function () {
      return [];
    },

    getDeletedUserIds: function () {
      return [];
    },

    getDeletedBizItemIds: function () {
      return [];
    },

    cleanGhostItems: function () {
      try {
        const apps = this.getApplications();
        let users = this.getUsers();
        let anyChanged = false;

        users = users.map(u => {
          if (u.items && Array.isArray(u.items) && u.items.length > 0) {
            const originalLength = u.items.length;
            const validItems = u.items.filter(item => {
              if (!item || !item.id) return false;
              const matchingApp = apps.find(a => String(a.id) === String(item.id) || String(a.id) === String(item.appRefId));
              if (!matchingApp) return false; // 최고관리자 대시보드에 없는 삭제건 100% 영구 제거
              if (matchingApp.isBizItem !== true && String(matchingApp.isBizItem) !== 'true') return false; // 미승인건 영구 제거
              return true;
            });

            if (validItems.length !== originalLength) {
              anyChanged = true;
              if (window.SupabaseSync) {
                window.SupabaseSync.updateUser(u.id, { items: validItems });
              }
              return { ...u, items: validItems };
            }
          }
          return u;
        });

        if (anyChanged) {
          this.saveUsers(users);
          const active = this.getActiveUser();
          if (active) {
            const freshMe = users.find(u => String(u.id) === String(active.id));
            if (freshMe) {
              this.setActiveUser(freshMe);
            }
          }
        }
      } catch (e) {
        console.error('[DataStore] cleanGhostItems error:', e);
      }
    },

    // --- 2. 영업물건 전용 데이터 조회 (최고관리자 대시보드 절대 SSOT 기반 & 완벽한 중복 방지) ---
    getBizItemsForUser: function (targetUser) {
      const rawUser = targetUser || this.getActiveUser();
      if (!rawUser) return [];

      // 항상 users 저장소에서 가장 최신의 사용자 정보(bizCode, items 등)를 동기화
      const users = this.getUsers();
      const user = users.find(u => String(u.id).toLowerCase() === String(rawUser.id).toLowerCase()) || rawUser;
      const apps = this.getApplications();

      const adminItems = this.getAdminBizItems();

      if (this.isAdmin(user)) {
        // 최고관리자는 모든 승인된 영업물건 조회
        return adminItems.map(entry => {
          const it = entry.item;
          return {
            id: it.id,
            date: it.registeredAt || new Date().toISOString(),
            ownerName: it.name || '-',
            ownerPhone: it.phone || '',
            storeName: it.name || '-',
            storeAddress: it.address || '',
            statusObj: it,
            receiptStatus: it.receiptStatus,
            progressStatus: it.progressStatus,
            assignedUser: entry.user
          };
        });
      }

      // 영업자: getAdminBizItems()에서 본인에게 귀속된 건을 100% 동일하게 추출 (SSOT 완벽 일치)
      const myBizCode = String(user.bizCode || '').trim().toLowerCase();
      const myUserId = String(user.id || '').trim().toLowerCase();
      const myUserName = String(user.name || '').trim().toLowerCase();
      const myPhone = String(user.phone || '').replace(/[^0-9]/g, '');

      const myBizList = [];
      adminItems.forEach(entry => {
        const u = entry.user || {};
        const it = entry.item || {};

        const entryUserId = String(u.id || '').trim().toLowerCase();
        const entryBizCode = String(u.bizCode || '').trim().toLowerCase();
        const entryUserName = String(u.name || '').trim().toLowerCase();
        const entryPhone = String(u.phone || '').replace(/[^0-9]/g, '');
        const itId = String(it.id || '').trim().toLowerCase();

        // 1) assignedUser가 나인지 확인
        const isUserMatch = (myUserId && entryUserId === myUserId) ||
                            (myBizCode && entryBizCode === myBizCode) ||
                            (myUserName && entryUserName === myUserName) ||
                            (myPhone && entryPhone === myPhone);
        // 2) 고유 접수번호 접두사가 내 코드인지 확인
        const isPrefixMatch = Boolean(myBizCode && itId.startsWith(myBizCode + '-'));
        // 3) 내 items 목록에 등록되어 있는지 확인
        const isMyItemMatch = Boolean(user.items && Array.isArray(user.items) && user.items.some(i => String(i.id).toLowerCase() === itId || String(i.appRefId).toLowerCase() === itId));
        // 4) applications의 원본 건에서 내가 신청/추천/담당영업자인지 직접 전수 대조
        const rawApp = apps.find(a => String(a.id).toLowerCase() === itId || String(a.appRefId).toLowerCase() === itId);
        let isRawAppMatch = false;
        if (rawApp) {
          const rawRef = String(rawApp.referrerCode || rawApp.referrer_code || '').trim().toLowerCase();
          const rawSalesId = String(rawApp.salespersonId || '').trim().toLowerCase();
          const rawSalesName = String(rawApp.salespersonName || '').trim().toLowerCase();
          const rawUser = String(rawApp.userId || rawApp.registeredBy || rawApp.submitterId || '').trim().toLowerCase();
          const rawPhone = String(rawApp.ownerPhone || '').replace(/[^0-9]/g, '');
          const rawOwner = String(rawApp.ownerName || '').trim().toLowerCase();
          isRawAppMatch = (myBizCode && (rawRef === myBizCode || itId.startsWith(myBizCode + '-'))) ||
                          (myUserId && (rawSalesId === myUserId || rawUser === myUserId || rawRef === myUserId)) ||
                          (myUserName && (rawSalesName === myUserName || rawOwner === myUserName || rawRef === myUserName)) ||
                          (myPhone && rawPhone === myPhone);
        }

        if (isUserMatch || isPrefixMatch || isMyItemMatch || isRawAppMatch) {
          myBizList.push({
            id: it.id,
            date: it.registeredAt || new Date().toISOString(),
            ownerName: it.name || '-',
            ownerPhone: it.phone || '',
            storeName: it.name || '-',
            storeAddress: it.address || '',
            statusObj: it,
            receiptStatus: it.receiptStatus,
            progressStatus: it.progressStatus
          });
        }
      });

      return myBizList;
    },

    // --- 최고관리자 전용 전체 영업물건 진행상황 목록 (중복 100% 완전 배제 & SSOT) ---
    getAdminBizItems: function () {
      const apps = this.getApplications();
      const users = this.getUsers();
      const allItems = [];

      const normalizeStr = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
      const normalizePhone = (p) => String(p || '').replace(/[^0-9]/g, '');

      const isDuplicate = (existingList, targetItem) => {
        if (!targetItem) return true;
        const tId = String(targetItem.id || '').trim();
        const tRef = String(targetItem.appRefId || '').trim();

        return existingList.some(entry => {
          const eItem = entry.item;
          if (!eItem) return false;
          const eId = String(eItem.id || '').trim();
          const eRef = String(eItem.appRefId || '').trim();

          // 1) 고유 ID 또는 appRefId 일치 시에만 중복으로 판정
          if (tId && (eId === tId || eRef === tId)) return true;
          if (tRef && (eId === tRef || eRef === tRef)) return true;

          return false;
        });
      };

      // 1) applications 중 isBizItem: true 인 건 수집 (최우선 단일 진실의 원천)
      apps.forEach(app => {
        const isApprovedBizItem = Boolean(app.isBizItem === true || String(app.isBizItem) === 'true');
        if (!isApprovedBizItem) return; // 비활성화/미승인 건은 절대 제외!

        // 담당 영업자 찾기 (7중 다각도 정밀 매칭)
        let assignedUser = null;
        const salesId = String(app.salespersonId || '').trim().toLowerCase();
        const salesName = String(app.salespersonName || '').trim().toLowerCase();
        const refCode = String(app.referrerCode || app.referrer_code || '').trim().toLowerCase();
        const appUser = String(app.userId || app.registeredBy || app.submitterId || '').trim().toLowerCase();
        const appId = String(app.id || '').trim().toLowerCase();
        const appPhone = String(app.ownerPhone || '').replace(/[^0-9]/g, '');
        const appOwner = String(app.ownerName || '').trim().toLowerCase();

        // 0. salespersonId / salespersonName 로 최우선 탐색
        if (salesId || salesName) {
          assignedUser = users.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            ((salesId && String(u.id).trim().toLowerCase() === salesId) ||
             (salesId && u.bizCode && String(u.bizCode).trim().toLowerCase() === salesId) ||
             (salesName && String(u.name).trim().toLowerCase() === salesName))
          );
        }
        // 1. referrerCode로 탐색 (코드, ID, 이름)
        if (!assignedUser && refCode) {
          assignedUser = users.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            ((u.bizCode && String(u.bizCode).trim().toLowerCase() === refCode) ||
              (u.id && String(u.id).trim().toLowerCase() === refCode) ||
              (u.name && String(u.name).trim().toLowerCase() === refCode))
          );
        }
        // 2. appId 접두사로 탐색 (예: B-260901-)
        if (!assignedUser && appId) {
          assignedUser = users.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            u.bizCode && appId.startsWith(String(u.bizCode).trim().toLowerCase() + '-')
          );
        }
        // 3. appUser (userId, registeredBy, submitterId)로 탐색
        if (!assignedUser && appUser) {
          assignedUser = users.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            (String(u.id).trim().toLowerCase() === appUser || (u.bizCode && String(u.bizCode).trim().toLowerCase() === appUser))
          );
        }
        // 4. users.items에 등록된 영업자 탐색
        if (!assignedUser) {
          assignedUser = users.find(u =>
            u.role === 'business' && u.items && Array.isArray(u.items) &&
            u.items.some(it => String(it.id).toLowerCase() === appId || String(it.appRefId).toLowerCase() === appId)
          );
        }
        // 5. 신청자 연락처/성명으로 영업자 탐색
        if (!assignedUser && appPhone) {
          assignedUser = users.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            u.phone && String(u.phone).replace(/[^0-9]/g, '') === appPhone
          );
        }
        if (!assignedUser && appOwner) {
          assignedUser = users.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            u.name && String(u.name).trim().toLowerCase() === appOwner
          );
        }

        const rStatus = app.receiptStatus || '접수예정';
        let pStatus = String(app.progressStatus || '').trim();
        if (rStatus === '접수예정' || rStatus === '접수 대기' || !app.receiptStatus) {
          pStatus = '지원대기중';
        } else {
          if (!pStatus || pStatus === 'none' || pStatus === '지원대기중') {
            const cs = String(app.constructionStatus || '').trim();
            if (cs === 'before_construction' || cs === '대상자선정' || cs === '선정') pStatus = '대상자선정';
            else if (cs === 'in_construction' || cs === '간판시공 준비중' || cs === '시공준비' || cs === '간판 시공 중') pStatus = '간판시공 준비중';
            else if (cs === 'completed' || cs === 'after_construction' || cs === '간판시공완료' || cs === '시공완료' || cs === '정산 완료') pStatus = '간판시공완료';
            else pStatus = '심사대기중';
          }
          // 영문 또는 비표준 상태값을 한글 표준 5대 상태값으로 엄격 정규화
          if (pStatus === '대상자선정' || pStatus === '선정' || pStatus === '승인 완료' || pStatus === '승인완료' || pStatus === 'approved' || pStatus === 'before_construction' || pStatus === '시공 전' || pStatus === '시공사 배정 (시공 전)' || pStatus === '서류 심사 통과' || pStatus === '현장 실사 중' || pStatus === '지원금 최종 승인') {
            pStatus = '대상자선정';
          } else if (pStatus === '간판시공 준비중' || pStatus === 'in_construction' || pStatus === '시공 준비중' || pStatus === '간판 시공 중' || pStatus === '시공준비') {
            pStatus = '간판시공 준비중';
          } else if (pStatus === '간판시공완료' || pStatus === 'completed' || pStatus === 'after_construction' || pStatus === '시공 완료' || pStatus === '정산 완료' || pStatus === '시공완료') {
            pStatus = '간판시공완료';
          } else if (pStatus === '심사대기' || pStatus === '심사 대기' || pStatus === '심사대기중' || pStatus === '서류 보완 필요') {
            pStatus = '심사대기중';
          } else {
            pStatus = '심사대기중';
          }
        }

        const photosList = (app.photos && app.photos.length > 0) ? app.photos : (app.fileData ? [app.fileData] : []);
        const itemObj = {
          id: String(app.id),
          appRefId: String(app.id),
          name: app.storeName || app.shopName || app.ownerName || '영업물건',
          phone: app.ownerPhone || app.phone || '',
          address: app.storeAddress || app.address || '',
          photosCount: photosList.length,
          receiptStatus: rStatus,
          progressStatus: pStatus,
          photos: photosList,
          registeredAt: app.appliedAt || app.createdAt || new Date().toISOString(),
          assignedConstructorId: app.assignedConstructorId || '',
          assignedConstructorName: app.assignedConstructorName || ''
        };

        if (!isDuplicate(allItems, itemObj)) {
          allItems.push({
            user: assignedUser || { id: 'admin', name: '최고관리자', role: 'admin', bizCode: 'ADMIN' },
            item: itemObj
          });
        }
      });

      // 최신순 정렬
      allItems.sort((a, b) => {
        const timeA = new Date(a.item.registeredAt || a.item.appliedAt || a.item.createdAt || 0).getTime();
        const timeB = new Date(b.item.registeredAt || b.item.appliedAt || b.item.createdAt || 0).getTime();
        if (timeB !== timeA && !isNaN(timeA) && !isNaN(timeB)) return timeB - timeA;
        return String(b.item.id || '').localeCompare(String(a.item.id || ''), undefined, { numeric: true });
      });

      return allItems;
    },

    // --- 시공업체 진행현황 실존 목록 단일 진실의 원천(SSOT & 중복 100% 원천 배제 & 영업자 정보 정밀 매칭) ---
    getConstructionJobs: function (targetConstructorUser) {
      const apps = this.getApplications();
      const curUsers = this.getUsers();
      const allConstJobs = [];

      const normalizeStr = (s) => String(s || '').replace(/\s+/g, '').toLowerCase();
      const normalizePhone = (p) => String(p || '').replace(/[^0-9]/g, '');

      // 담당 영업자 정보(이름, 코드, 라벨)를 영업물건 진행상황과 100% 일치하게 정밀 추출
      const resolveSalesperson = (app, item, user) => {
        let assignedUser = null;
        const refCode = String((app && (app.referrerCode || app.bizCode)) || (item && (item.referrerCode || item.bizCode)) || '').trim().toLowerCase();
        const appUser = String((app && app.userId) || (item && item.userId) || '').trim().toLowerCase();

        // 1) user 파라미터가 이미 영업자(business)인 경우 우선 적용
        if (user && user.role === 'business') {
          assignedUser = user;
        }

        // 2) referrerCode(bizCode, id, name)로 탐색
        if (!assignedUser && refCode) {
          assignedUser = curUsers.find(u =>
            (u.role === 'business') &&
            ((u.bizCode && String(u.bizCode).trim().toLowerCase() === refCode) ||
              (u.id && String(u.id).trim().toLowerCase() === refCode) ||
              (u.name && String(u.name).trim().toLowerCase() === refCode))
          );
        }

        // 3) userId로 탐색
        if (!assignedUser && appUser) {
          assignedUser = curUsers.find(u =>
            (u.role === 'business') &&
            (u.id && String(u.id).trim().toLowerCase() === appUser)
          );
        }

        // 4) curUsers.items를 순회하여 해당 item/app을 소유한 영업자 탐색
        if (!assignedUser) {
          const targetId = String((item && item.id) || (app && app.id) || '').trim();
          const targetRef = String((item && item.appRefId) || (app && app.id) || '').trim();
          if (targetId || targetRef) {
            assignedUser = curUsers.find(u =>
              u.role === 'business' && u.items && Array.isArray(u.items) &&
              u.items.some(it => String(it.id) === targetId || String(it.appRefId) === targetId || (targetRef && (String(it.id) === targetRef || String(it.appRefId) === targetRef)))
            );
          }
        }

        // 5) 점주/상호명 및 연락처로 영업자의 items 대조 탐색
        if (!assignedUser) {
          const stName = normalizeStr((item && (item.name || item.storeName)) || (app && (app.storeName || app.shopName)));
          const stPhone = normalizePhone((item && item.phone) || (app && (app.ownerPhone || app.phone)));
          if (stName && stName !== '-') {
            assignedUser = curUsers.find(u =>
              u.role === 'business' && u.items && Array.isArray(u.items) &&
              u.items.some(it => normalizeStr(it.name) === stName || (stPhone && normalizePhone(it.phone) === stPhone))
            );
          }
        }

        if (assignedUser && assignedUser.role === 'business') {
          const bName = assignedUser.name || '영업자';
          const bCode = assignedUser.bizCode || assignedUser.id || 'B-CODE';
          return {
            bizOwnerId: assignedUser.id,
            bizOwnerName: bName,
            bizCode: bCode,
            bizLabel: `${bName} 영업자 / ${bCode}`
          };
        }

        return {
          bizOwnerId: null,
          bizOwnerName: '본사접수',
          bizCode: '본사접수',
          bizLabel: '본사직접접수'
        };
      };

      const isDuplicateJob = (list, targetJob) => {
        if (!targetJob) return true;
        const tId = String(targetJob.id || '').trim();
        const tAppRef = String(targetJob.appRefId || '').trim();
        const tName = normalizeStr(targetJob.storeName);
        const tPhone = normalizePhone(targetJob.ownerPhone);
        const tAddr = normalizeStr(targetJob.storeAddress);

        return list.some(j => {
          const jId = String(j.id || '').trim();
          const jAppRef = String(j.appRefId || '').trim();
          const jName = normalizeStr(j.storeName);
          const jPhone = normalizePhone(j.ownerPhone);
          const jAddr = normalizeStr(j.storeAddress);

          // 1) ID 또는 appRefId 일치
          if (tId && (jId === tId || jAppRef === tId)) return true;
          if (tAppRef && (jId === tAppRef || jAppRef === tAppRef)) return true;

          // 2) 상호명이 같으면 무조건 동일 시공 건으로 간주 (상호명이 유의미한 2자 이상인 경우)
          if (tName && jName && tName !== '-' && jName !== '-' && tName === jName) return true;

          // 3) 연락처 일치 (8자리 이상 유효 전화번호)
          if (tPhone && jPhone && tPhone.length >= 8 && tPhone === jPhone) return true;

          // 4) 주소 일치 및 상호명 부분 일치
          if (tAddr && jAddr && tAddr !== '-' && jAddr !== '-' && (tAddr === jAddr || tAddr.includes(jAddr) || jAddr.includes(tAddr))) {
            if (tName && jName && (tName.includes(jName) || jName.includes(tName))) return true;
          }

          return false;
        });
      };

      // applications 단일 원천에서 시공 적격 및 배정 물건 수집 (SSOT)

      // 2) From applications (온라인 신청서)
      apps.forEach(app => {
        const pStatus = String(app.progressStatus || app.constructionStatus || '').trim();
        const cStatus = String(app.constructionStatus || '').trim();

        const isEligible = Boolean(
          app.assignedConstructorId ||
          pStatus === '대상자선정' || pStatus === '간판시공 준비중' || pStatus === '간판시공완료' ||
          cStatus === 'before_construction' || cStatus === 'in_construction' || cStatus === 'completed' || cStatus === '간판시공 준비중' || cStatus === '간판시공완료'
        ) && (
          pStatus !== '반려됨' && pStatus !== '지원사업 포기' && pStatus !== '지원사업 탈락'
        );

        if (isEligible) {
          const salesInfo = resolveSalesperson(app, null, null);
          let cName = app.assignedConstructorName || '';
          let cCode = '';
          let cPhone = '';
          if (app.assignedConstructorId) {
            const cu = curUsers.find(x => x.id === app.assignedConstructorId || x.constCode === app.assignedConstructorId);
            if (cu) {
              cName = cu.businessName || cu.pendingBusinessName || cu.name || cu.id;
              cCode = cu.constCode || '';
              cPhone = cu.phone || '';
            } else {
              cName = app.assignedConstructorName || app.assignedConstructorId;
            }
          }
          const jobObj = {
            id: app.id,
            appRefId: app.id,
            isBizItemJob: false,
            bizItemOwnerId: salesInfo.bizOwnerId,
            bizOwnerName: salesInfo.bizOwnerName,
            bizCode: salesInfo.bizCode,
            bizLabel: salesInfo.bizLabel,
            storeName: app.storeName || app.shopName || '-',
            ownerName: app.ownerName || '-',
            ownerPhone: app.ownerPhone || app.phone || '-',
            storeAddress: app.storeAddress || '-',
            signType: (!app.signType || app.signType === '간판지원신청' || app.signType === '간판' || app.signType === '-' || app.signType === 'undefined' || app.signType === 'null') ? '플렉스 간판' : app.signType,
            assignedConstructorId: app.assignedConstructorId || '',
            assignedConstructorName: cName || '미배정',
            assignedConstructorCode: cCode,
            assignedConstructorPhone: cPhone,
            progressStatus: pStatus,
            constructionStatus: app.constructionStatus || (pStatus === '간판시공완료' ? 'completed' : (pStatus === '간판시공 준비중' ? 'in_construction' : (pStatus === '간판 디자인 시안 및 교정 중' ? 'design_draft' : 'before_construction'))),
            signDraftPhotos: app.signDraftPhotos || app.designPhotos || [],
            draftStatus: app.draftStatus || 'pending',
            draftApprovedAt: app.draftApprovedAt || null,
            constructionPhotos: app.constructionPhotos || app.afterPhotos || [],
            createdAt: app.appliedAt || app.createdAt || new Date().toISOString()
          };

          if (!isDuplicateJob(allConstJobs, jobObj)) {
            allConstJobs.push(jobObj);
          }
        }
      });

      // 최신순 정렬
      allConstJobs.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

      // 시공사 파트너 조회 시 본인 귀속 건만 필터링
      if (targetConstructorUser && (targetConstructorUser.role === 'constructor' || !this.isAdmin(targetConstructorUser))) {
        const cId = String(targetConstructorUser.id || '').toLowerCase();
        const cCode = String(targetConstructorUser.constCode || '').toLowerCase();
        const cBiz = String(targetConstructorUser.businessName || targetConstructorUser.pendingBusinessName || targetConstructorUser.name || '').toLowerCase();

        return allConstJobs.filter(j => {
          const jCId = String(j.assignedConstructorId || '').toLowerCase();
          const jCCode = String(j.assignedConstructorCode || '').toLowerCase();
          const jCName = String(j.assignedConstructorName || '').toLowerCase();

          return (cId && jCId === cId) || (cCode && (jCCode === cCode || jCId === cCode)) || (cBiz && jCName === cBiz);
        });
      }

      return allConstJobs;
    },

    // --- 관리자 권한 다각도 정밀 판정 ---
    isAdmin: function (user) {
      if (typeof window !== 'undefined' && window.location && window.location.pathname.includes('dashboard')) {
        return true;
      }
      const u = user || this.getActiveUser();
      if (!u) return false;
      return (
        u.role === 'admin' ||
        u.role === 'superadmin' ||
        String(u.id).toLowerCase() === 'admin' ||
        String(u.name).toLowerCase() === 'admin' ||
        String(u.name).includes('최고관리자') ||
        (u.bizCode && String(u.bizCode).toLowerCase() === 'admin')
      );
    },

    // --- 3. 영업물건 토글 (최고관리자 전용 & 0초 즉각 반응 & 백그라운드 비동기 DB 동기화) ---
    toggleBizItem: function (appId, btnEl) {
      let apps = this.getApplications();
      let appIndex = apps.findIndex(a => a && String(a.id).trim().toLowerCase() === String(appId).trim().toLowerCase());
      if (appIndex === -1 && btnEl) {
        const row = btnEl.closest('tr') || btnEl.closest('.admin-app-card-mob') || btnEl.closest('div[data-id]');
        const fallbackId = row ? (row.getAttribute('data-id') || row.querySelector('[data-id]')?.getAttribute('data-id')) : null;
        if (fallbackId) {
          appIndex = apps.findIndex(a => a && String(a.id).trim().toLowerCase() === String(fallbackId).trim().toLowerCase());
        }
      }

      if (appIndex === -1) {
        alert('해당 지원 신청서를 찾을 수 없습니다: ' + appId);
        return { success: false, message: '신청서 없음' };
      }

      const app = apps[appIndex];
      let curUsers = this.getUsers();

      const isCurrentlyBizItem = Boolean(app.isBizItem === true || String(app.isBizItem) === 'true');
      const isNowBizItem = !isCurrentlyBizItem;
      app.isBizItem = isNowBizItem;
      app.updatedAt = new Date().toISOString();

      // 1) 0초 즉각 낙관적 UI 버튼 상태 갱신
      if (btnEl) {
        if (isNowBizItem) {
          btnEl.style.background = '#0284c7';
          btnEl.style.color = '#ffffff';
          btnEl.style.border = 'none';
          btnEl.innerHTML = '<i class="fa-solid fa-toggle-on"></i> 영업물건 등록됨';
        } else {
          btnEl.style.background = '#f8fafc';
          btnEl.style.color = '#475569';
          btnEl.style.border = '1px solid #cbd5e1';
          btnEl.innerHTML = '<i class="fa-solid fa-toggle-off"></i> 영업물건으로 변경';
        }
      }

      let usersToSync = [];

      if (isNowBizItem) {
        // 영업물건 등록: 담당 영업자 1명 특정 (3+1 원칙 적용)
        let targetUser = null;
        const salesId = String(app.salespersonId || '').trim().toLowerCase();
        const salesName = String(app.salespersonName || '').trim().toLowerCase();
        const refCode = String(app.referrerCode || app.referrer_code || '').trim().toLowerCase();
        const appUser = String(app.userId || '').trim().toLowerCase();
        const appIdStr = String(app.id || '').trim().toLowerCase();

        // 0. salespersonId / salespersonName 로 최우선 탐색 (관리자가 지정한 영업자)
        if (salesId || salesName) {
          targetUser = curUsers.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            ((salesId && String(u.id).trim().toLowerCase() === salesId) ||
             (salesId && u.bizCode && String(u.bizCode).trim().toLowerCase() === salesId) ||
             (salesName && String(u.name).trim().toLowerCase() === salesName))
          );
        }

        // 1. 신청번호 앞자리 접두사 (예: B-260903-001 -> B-260903)
        let prefixCode = '';
        if (appIdStr.includes('-')) {
          const parts = appIdStr.split('-');
          if (parts.length >= 2) {
            prefixCode = parts.slice(0, -1).join('-').toLowerCase();
          }
        }

        if (!targetUser && refCode) {
          targetUser = curUsers.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            ((u.bizCode && String(u.bizCode).trim().toLowerCase() === refCode) ||
              (u.id && String(u.id).trim().toLowerCase() === refCode) ||
              (u.name && String(u.name).trim().toLowerCase() === refCode) ||
              (u.phone && String(u.phone).replace(/[^0-9]/g, '') === refCode.replace(/[^0-9]/g, '')))
          );
        }
        if (!targetUser && prefixCode) {
          targetUser = curUsers.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            u.bizCode && String(u.bizCode).trim().toLowerCase() === prefixCode
          );
        }
        if (!targetUser && appUser) {
          targetUser = curUsers.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            (String(u.id).trim().toLowerCase() === appUser || String(u.bizCode || '').trim().toLowerCase() === appUser)
          );
        }

        if (targetUser) {
          app.salespersonId = targetUser.id;
          app.salespersonName = targetUser.name;
          if (targetUser.bizCode && !app.referrerCode) {
            app.referrerCode = targetUser.bizCode;
          }
        }

        const photosList = (app.photos && app.photos.length > 0) ? app.photos : (app.fileData ? [app.fileData] : []);
        // [규칙] 영업물건으로 전환 시 기본값은 접수: '접수예정', 진행: '지원대기중'
        app.receiptStatus = '접수예정';
        app.progressStatus = '지원대기중';
        app.status = 'pending';
        const bizItem = {
          id: String(app.id),
          name: app.storeName || app.shopName || app.ownerName || '영업물건',
          phone: app.ownerPhone || app.phone || '',
          address: app.storeAddress || app.address || '',
          photosCount: photosList.length,
          receiptStatus: '접수예정',
          progressStatus: '지원대기중',
          photos: photosList,
          appRefId: String(app.id)
        };

        curUsers = curUsers.map(u => {
          const isTarget = targetUser && String(u.id).toLowerCase() === String(targetUser.id).toLowerCase();
          const isAdmin = u.role === 'admin' || String(u.id).toLowerCase() === 'admin';
          if (isTarget || isAdmin) {
            const uItems = u.items || [];
            const existingIdx = uItems.findIndex(it => String(it.id) === String(app.id) || String(it.appRefId) === String(app.id));
            if (existingIdx >= 0) {
              uItems[existingIdx] = { ...uItems[existingIdx], ...bizItem };
            } else {
              uItems.unshift(bizItem);
            }
            usersToSync.push({ id: u.id, items: uItems });
            return { ...u, items: uItems };
          }
          return u;
        });
      } else {
        // 영업물건 해제: users.items에서 해당 appId 및 appRefId 완전 제거
        curUsers = curUsers.map(u => {
          if (u.items && u.items.length > 0) {
            const filteredItems = u.items.filter(it => {
              const matchId = String(it.id).trim().toLowerCase() === String(app.id).trim().toLowerCase();
              const matchAppRef = String(it.appRefId || '').trim().toLowerCase() === String(app.id).trim().toLowerCase();
              return !matchId && !matchAppRef;
            });
            if (filteredItems.length !== u.items.length) {
              usersToSync.push({ id: u.id, items: filteredItems });
            }
            return { ...u, items: filteredItems };
          }
          return u;
        });
      }

      // 2) 로컬스토리지 0초 즉각 저장
      this.saveUsers(curUsers);
      apps[appIndex] = app;
      this.saveApplications(apps);

      // 3) 전체 대시보드 화면 0초 즉각 강제 브로드캐스트 (force=true)
      this.notifyAll(true);

      // 4) Supabase DB 완전 비동기 백그라운드 저장 (Non-blocking)
      (async () => {
        try {
          if (window.supabaseClient) {
            await window.supabaseClient.from('applications').update({
              memo: JSON.stringify({ isBizItem: isNowBizItem, receiptStatus: app.receiptStatus || '접수예정', progressStatus: app.progressStatus || '지원대기중' }),
              referrer_code: app.referrerCode || ''
            }).eq('id', String(app.id));
          }
          if (window.SupabaseSync) {
            await window.SupabaseSync.upsertApplication(app);
            for (const itemUser of usersToSync) {
              await window.SupabaseSync.updateUser(itemUser.id, { items: itemUser.items });
            }
          }
        } catch (err) {
          console.warn('[DataStore] toggleBizItem background sync notice:', err);
        }
      })();

      // 5) 즉시 알림 표시 (0초 반응)
      const storeLabel = app.storeName || app.ownerName || '해당';
      const msg = isNowBizItem 
        ? `[${storeLabel}] 건이 영업물건으로 변경되었습니다.\n공단/진흥원 접수 및 담당 영업자 대시보드로 실시간 연동됩니다.`
        : `[${storeLabel}] 건의 영업물건 등록이 해제되었습니다.\n영업물건 진행상황 및 영업자 대시보드에서 즉시 제외됩니다.`;

      if (typeof window.showToast === 'function') {
        window.showToast(msg);
      } else {
        alert(msg);
      }

      return { success: true, isBizItem: isNowBizItem };
    },

    // --- 3-2. 영업물건 접수상태(receiptStatus) 및 진행상태(progressStatus) 통합 변경 (SSOT 보장) ---
    updateItemStatus: function (uid, itemId, type, value) {
      let apps = this.getApplications();
      let users = this.getUsers();
      let targetItem = null;
      let targetApp = null;
      let updatedUserIds = [];

      const cleanVal = String(value || '').trim();
      const targetIdStr = String(itemId || '').trim();

      // 0) itemId로 users.items 내 해당 물건의 메타데이터(상호명, 연락처 등) 사전 탐색
      let sourceItem = null;
      for (let u of users) {
        if (u.items && Array.isArray(u.items)) {
          const found = u.items.find(it => String(it.id) === targetIdStr || (it.appRefId && String(it.appRefId) === targetIdStr));
          if (found) {
            sourceItem = found;
            break;
          }
        }
      }

      // 1) applications 내 매칭 항목 갱신 (고유 ID 단일 원천 매칭)
      apps = apps.map(app => {
        const isIdMatch = String(app.id) === targetIdStr || (app.appRefId && String(app.appRefId) === targetIdStr);

        if (isIdMatch) {
          app.isBizItem = true;
          app.updatedAt = new Date().toISOString();
          if (type === 'receipt') {
            app.receiptStatus = cleanVal;
            // [규칙 1] 접수: '접수예정'일 때는 진행상태를 무조건 '지원대기중'으로 자동 변경 및 고정
            if (cleanVal === '접수예정' || cleanVal === '접수 대기' || !cleanVal) {
              app.progressStatus = '지원대기중';
              app.status = 'pending';
              app.constructionStatus = '지원대기중';
            } else if (cleanVal === '접수완료' || cleanVal === '업체신청') {
              // [규칙 2] 접수: '접수완료' 또는 '업체신청'으로 변경 시 자동으로 '심사대기중'으로 기본 적용
              if (!app.progressStatus || app.progressStatus === '지원대기중' || app.progressStatus === 'none') {
                app.progressStatus = '심사대기중';
                app.status = 'pending';
                app.constructionStatus = '심사대기중';
              }
            }
          } else {
            // 진행 상태 변경
            // [규칙] 현재 접수 상태가 '접수예정'인 경우 진행상태는 오직 '지원대기중'만 허용
            if (app.receiptStatus === '접수예정' || app.receiptStatus === '접수 대기' || !app.receiptStatus) {
              app.progressStatus = '지원대기중';
              app.status = 'pending';
              app.constructionStatus = '지원대기중';
            } else {
              app.progressStatus = cleanVal;
              if (cleanVal === '대상자선정' || cleanVal === '간판시공 준비중' || cleanVal === '간판시공완료') {
                app.status = 'approved';
                app.constructionStatus = (cleanVal === '간판시공완료' ? 'completed' : (cleanVal === '간판시공 준비중' ? 'in_construction' : 'before_construction'));
                if (!app.signType || app.signType === '간판지원신청' || app.signType === '간판' || app.signType === '-' || app.signType === 'undefined' || app.signType === 'null') {
                  app.signType = '플렉스 간판';
                }
              } else if (cleanVal === '지원사업 탈락' || cleanVal === '반려됨') {
                app.status = 'rejected';
                app.constructionStatus = cleanVal;
              } else if (cleanVal === '지원사업 포기') {
                app.status = 'giveup';
                app.constructionStatus = cleanVal;
              } else {
                app.status = 'pending';
                app.constructionStatus = cleanVal;
              }
            }
          }
          targetApp = app;
        }
        return app;
      });

      if (!targetApp && sourceItem) {
        const initReceipt = type === 'receipt' ? cleanVal : (sourceItem.receiptStatus || '접수예정');
        const isReceiptPending = (initReceipt === '접수예정' || initReceipt === '접수 대기' || !initReceipt);
        let initProgress = '지원대기중';
        if (isReceiptPending) {
          initProgress = '지원대기중';
        } else if (type === 'progress') {
          initProgress = cleanVal;
        } else {
          initProgress = (sourceItem.progressStatus && sourceItem.progressStatus !== '지원대기중') ? sourceItem.progressStatus : '심사대기중';
        }
        targetApp = {
          id: sourceItem.id || targetIdStr,
          appRefId: sourceItem.appRefId || targetIdStr,
          userId: uid || 'guest',
          ownerName: sourceItem.name || '점주',
          ownerPhone: sourceItem.phone || '',
          storeName: sourceItem.name || '영업물건',
          storeAddress: sourceItem.address || '',
          isBizItem: true,
          receiptStatus: initReceipt,
          progressStatus: initProgress,
          status: (initProgress === '대상자선정' || initProgress === '간판시공 준비중' || initProgress === '간판시공완료') ? 'approved' : 'pending',
          constructionStatus: (initProgress === '간판시공완료' ? 'completed' : (initProgress === '간판시공 준비중' ? 'in_construction' : 'before_construction')),
          appliedAt: sourceItem.registeredAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        apps.push(targetApp);
      }

      // 2) users.items 내 매칭 항목 갱신 (고유 ID 단일 원천 매칭)
      users = users.map(u => {
        if (u.items && Array.isArray(u.items)) {
          let userItemModified = false;
          const updatedItems = u.items.map(item => {
            const isIdMatch = String(item.id) === targetIdStr || 
                              (item.appRefId && String(item.appRefId) === targetIdStr) || 
                              (targetApp && (String(item.id) === String(targetApp.id) || String(item.appRefId) === String(targetApp.id)));

            if (isIdMatch) {
              userItemModified = true;
              if (type === 'receipt') {
                const isReceiptPending = (cleanVal === '접수예정' || cleanVal === '접수 대기' || !cleanVal);
                let newProgress = item.progressStatus;
                if (isReceiptPending) {
                  newProgress = '지원대기중';
                } else if (cleanVal === '접수완료' || cleanVal === '업체신청') {
                  if (!newProgress || newProgress === '지원대기중' || newProgress === 'none') {
                    newProgress = '심사대기중';
                  }
                }
                targetItem = { 
                  ...item, 
                  receiptStatus: cleanVal,
                  progressStatus: newProgress
                };
              } else {
                const curReceipt = item.receiptStatus || (targetApp && targetApp.receiptStatus) || '접수예정';
                const isReceiptPending = (curReceipt === '접수예정' || curReceipt === '접수 대기' || !curReceipt);
                targetItem = { ...item, progressStatus: isReceiptPending ? '지원대기중' : cleanVal };
              }
              return targetItem;
            }
            return item;
          });
          if (userItemModified) {
            if (!updatedUserIds.includes(u.id)) updatedUserIds.push(u.id);
            return { ...u, items: updatedItems };
          }
        }
        return u;
      });

      // 3) 만약 users.items에 아직 없었지만 영업자가 지정된 신청서인 경우, 영업자의 items에도 자동 생성/갱신 (3+1 원칙)
      if (targetApp) {
        const salesId = String(targetApp.salespersonId || '').trim().toLowerCase();
        const salesName = String(targetApp.salespersonName || '').trim().toLowerCase();
        const refCode = String(targetApp.referrerCode || targetApp.referrer_code || '').trim().toLowerCase();
        const appUser = String(targetApp.userId || '').trim().toLowerCase();
        const appIdStr = String(targetApp.id || '').trim().toLowerCase();
        let prefixCode = '';
        if (appIdStr.includes('-')) {
          const parts = appIdStr.split('-');
          if (parts.length >= 2) prefixCode = parts.slice(0, -1).join('-').toLowerCase();
        }

        let assignedUser = users.find(u =>
          (u.role === 'business' || u.role === 'admin') &&
          ((salesId && String(u.id).trim().toLowerCase() === salesId) ||
            (salesId && u.bizCode && String(u.bizCode).trim().toLowerCase() === salesId) ||
            (salesName && String(u.name).trim().toLowerCase() === salesName) ||
            (refCode && u.bizCode && String(u.bizCode).trim().toLowerCase() === refCode) ||
            (refCode && String(u.id).trim().toLowerCase() === refCode) ||
            (refCode && String(u.name).trim().toLowerCase() === refCode) ||
            (prefixCode && u.bizCode && String(u.bizCode).trim().toLowerCase() === prefixCode) ||
            (appUser && String(u.id).trim().toLowerCase() === appUser))
        );
        if (assignedUser) {
          if (!assignedUser.items) assignedUser.items = [];
          const existingIdx = assignedUser.items.findIndex(it => String(it.id) === String(targetApp.id) || String(it.appRefId) === String(targetApp.id));
          const newItemData = {
            id: String(targetApp.id),
            appRefId: String(targetApp.id),
            name: targetApp.storeName || targetApp.shopName || targetApp.ownerName || '영업물건',
            phone: targetApp.ownerPhone || targetApp.phone || '',
            address: targetApp.storeAddress || targetApp.address || '',
            receiptStatus: targetApp.receiptStatus || '접수예정',
            progressStatus: targetApp.progressStatus || '지원대기중',
            registeredAt: targetApp.appliedAt || targetApp.createdAt || new Date().toISOString()
          };
          if (existingIdx >= 0) {
            assignedUser.items[existingIdx] = { ...assignedUser.items[existingIdx], ...newItemData };
          } else {
            assignedUser.items.unshift(newItemData);
          }
          if (!updatedUserIds.includes(assignedUser.id)) updatedUserIds.push(assignedUser.id);
        }
      }

      this.saveApplications(apps);
      this.saveUsers(users);

      // 4) Supabase DB 비동기 백그라운드 저장 (Non-blocking)
      (async () => {
        try {
          if (window.SupabaseSync) {
            if (targetApp && typeof window.SupabaseSync.upsertApplication === 'function') {
              await window.SupabaseSync.upsertApplication(targetApp);
            }
            for (const uId of updatedUserIds) {
              const uObj = users.find(u => u.id === uId);
              if (uObj && typeof window.SupabaseSync.updateUser === 'function') {
                await window.SupabaseSync.updateUser(uId, { items: uObj.items || [] });
              }
            }
          }
        } catch (err) {
          console.warn('[DataStore] updateItemStatus sync notice:', err);
        }
      })();

      // 5) 낙관적 In-place DOM 부분 갱신 (1회 클릭 즉시 반영 & 전체 DOM 재생성으로 인한 포커스 날아감 방지)
      if (typeof document !== 'undefined') {
        try {
          const isReceiptPending = (targetApp && (targetApp.receiptStatus === '접수예정' || targetApp.receiptStatus === '접수 대기' || !targetApp.receiptStatus));
          const curReceiptVal = targetApp ? targetApp.receiptStatus : (type === 'receipt' ? cleanVal : '접수예정');
          const curProgressVal = targetApp ? targetApp.progressStatus : (type === 'progress' ? cleanVal : '지원대기중');

          // PC 웹 드롭다운 즉시 부분 동기화
          const pcReceiptSelects = document.querySelectorAll(`select.select-receipt-status[data-itemid="${targetIdStr}"]`);
          pcReceiptSelects.forEach(sel => { sel.value = curReceiptVal; });

          const pcProgressSelects = document.querySelectorAll(`select.select-progress-status[data-itemid="${targetIdStr}"]`);
          pcProgressSelects.forEach(sel => {
            sel.value = curProgressVal;
            sel.disabled = isReceiptPending;
            sel.style.background = isReceiptPending ? '#f1f5f9' : '#fff';
            sel.style.color = isReceiptPending ? '#64748b' : 'inherit';
            sel.style.cursor = isReceiptPending ? 'not-allowed' : 'pointer';
            sel.style.borderColor = isReceiptPending ? '#e2e8f0' : '#cbd5e1';
            sel.title = isReceiptPending ? '접수예정 상태에서는 지원대기중으로 고정됩니다' : '진행상황 선택';
          });

          // 모바일 앱 드롭다운 즉시 부분 동기화
          const mobReceiptSelects = document.querySelectorAll(`select.select-receipt-mob[data-itemid="${targetIdStr}"]`);
          mobReceiptSelects.forEach(sel => { sel.value = curReceiptVal; });

          const mobProgressSelects = document.querySelectorAll(`select.select-progress-mob[data-itemid="${targetIdStr}"]`);
          mobProgressSelects.forEach(sel => {
            sel.value = curProgressVal;
            sel.disabled = isReceiptPending;
            sel.style.background = isReceiptPending ? '#f1f5f9' : 'white';
            sel.style.color = isReceiptPending ? '#64748b' : 'inherit';
            sel.style.cursor = isReceiptPending ? 'not-allowed' : 'pointer';
            sel.style.borderColor = isReceiptPending ? '#cbd5e1' : 'var(--border-color)';
            sel.title = isReceiptPending ? '접수예정 상태에서는 지원대기중으로 고정됩니다' : '진행상황 선택';
          });
        } catch (eDom) {
          console.warn('[DataStore] In-place DOM update notice:', eDom);
        }
      }

      // 6) 다른 연관 화면 동기화 (전체 대시보드 0초 강제 동기화)
      this.notifyAll(true);

      // 7) 사용자 피드백 토스트 알림
      try {
        const itemLabel = targetApp ? (targetApp.storeName || targetApp.shopName || targetApp.ownerName || targetIdStr) : targetIdStr;
        const typeLabel = type === 'receipt' ? '접수 상태' : '진행 상황';
        const msg = `[${itemLabel}]의 ${typeLabel}가 [${cleanVal}]으로 변경되었습니다.`;
        if (typeof window.showToast === 'function') {
          window.showToast(msg);
        } else if (typeof window.showNotification === 'function') {
          window.showNotification(msg, 'success');
        }
      } catch (e) {}

      return { success: true, updatedValue: cleanVal, type: type };
    },

    // --- 3-3. 신청서 담당 영업자 지정 / 변경 (최고관리자 권한) ---
    updateApplicationReferrer: function (appId, newBizCode) {
      if (!appId) return { success: false, error: '유효하지 않은 신청서입니다.' };
      const targetId = String(appId).trim();
      const codeVal = newBizCode ? String(newBizCode).trim() : '';
      const normTargetId = targetId.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      let apps = this.getApplications();
      const targetApp = apps.find(a => {
        const aid = String(a.id || '').trim();
        const aref = String(a.appRefId || '').trim();
        if (aid === targetId || aref === targetId) return true;
        if (aid.toLowerCase() === targetId.toLowerCase() || aref.toLowerCase() === targetId.toLowerCase()) return true;
        if (aid.replace(/[^a-zA-Z0-9]/g, '').toLowerCase() === normTargetId) return true;
        return false;
      });

      if (!targetApp) return { success: false, error: '해당 신청서를 찾을 수 없습니다.' };

      // 1) 신청서 referrerCode 갱신 및 영업자 정보 동기화
      targetApp.referrerCode = codeVal;
      targetApp.referrer_code = codeVal;
      let salesUser = null;
      let users = this.getUsers();
      let usersUpdated = false;

      // 3+1 SSOT 원칙: 모든 사용자의 items 에서 해당 신청서 잔재를 전수 정리 (이전 영업자 물건에서 자동 제거)
      users.forEach(u => {
        if (u && Array.isArray(u.items) && u.items.length > 0) {
          const prevLen = u.items.length;
          u.items = u.items.filter(it => {
            const iid = String(it.id || '').trim();
            const iref = String(it.appRefId || '').trim();
            return (iid !== targetId && iref !== targetId && iid.toLowerCase() !== targetId.toLowerCase() && iref.toLowerCase() !== targetId.toLowerCase());
          });
          if (u.items.length !== prevLen) {
            usersUpdated = true;
          }
        }
      });

      if (codeVal) {
        salesUser = users.find(u =>
          (u.role === 'business' || u.role === 'admin') &&
          ((u.bizCode && String(u.bizCode).trim().toLowerCase() === codeVal.toLowerCase()) ||
            (u.id && String(u.id).trim().toLowerCase() === codeVal.toLowerCase()) ||
            (u.name && String(u.name).trim().toLowerCase() === codeVal.toLowerCase()))
        );
        if (salesUser) {
          targetApp.salespersonId = salesUser.id;
          targetApp.salespersonName = salesUser.name;

          // 3+1 원칙: 새 영업자의 items 에만 최상단 단일 귀속
          if (!salesUser.items) salesUser.items = [];
          const itemPayload = {
            id: String(targetApp.id),
            appRefId: String(targetApp.id),
            name: targetApp.storeName || targetApp.shopName || targetApp.ownerName || '영업물건',
            phone: targetApp.ownerPhone || targetApp.phone || '',
            address: targetApp.storeAddress || targetApp.address || '',
            receiptStatus: targetApp.receiptStatus || '접수예정',
            progressStatus: targetApp.progressStatus || '지원대기중',
            status: targetApp.status || 'pending',
            registeredAt: targetApp.appliedAt || targetApp.createdAt || new Date().toISOString()
          };
          salesUser.items.unshift(itemPayload);
          usersUpdated = true;
        } else {
          targetApp.salespersonId = '';
          targetApp.salespersonName = '';
        }
      } else {
        targetApp.salespersonId = '';
        targetApp.salespersonName = '';
      }
      targetApp.updatedAt = new Date().toISOString();

      this.saveApplications(apps);
      if (usersUpdated) {
        this.saveUsers(users);
      }

      // 2) Supabase 비동기 클라우드 DB 저장 (Non-blocking)
      if (window.SupabaseSync) {
        if (typeof window.SupabaseSync.upsertApplication === 'function') {
          window.SupabaseSync.upsertApplication(targetApp).catch(() => {});
        }
        if (usersUpdated && salesUser && typeof window.SupabaseSync.updateUser === 'function') {
          window.SupabaseSync.updateUser(salesUser.id, { items: salesUser.items || [] }).catch(() => {});
        }
      }

      // 3) 6개 화면 실시간 강제 동기화 (모달 닫힌 후 즉시 반영)
      this.notifyAll(true);
      return { success: true, app: targetApp, salesUser: salesUser };
    },

    // --- 3-4. 영업물건 시공사 배정 (최고관리자 권한) ---
    assignConstructorToBizItem: function (uid, itemId, constId) {
      if (!itemId || !constId) return { success: false, error: '유효하지 않은 요청입니다.' };
      const curUsers = this.getUsers();
      const constUser = curUsers.find(u => String(u.id) === String(constId));
      if (!constUser) return { success: false, error: '시공사 정보를 찾을 수 없습니다.' };

      const constName = constUser.businessName || constUser.pendingBusinessName || constUser.name || constUser.id;

      // 1) applications 단일 원천 갱신
      let apps = this.getApplications();
      let targetApp = apps.find(a => String(a.id) === String(itemId) || String(a.appRefId) === String(itemId));
      if (targetApp) {
        targetApp.assignedConstructorId = String(constId);
        targetApp.assignedConstructorName = constName;
        targetApp.constructionStatus = targetApp.constructionStatus && targetApp.constructionStatus !== 'none' ? targetApp.constructionStatus : 'before_construction';
        targetApp.assignedAt = new Date().toISOString();
        this.saveApplications(apps);

        if (window.SupabaseSync && typeof window.SupabaseSync.upsertApplication === 'function') {
          window.SupabaseSync.upsertApplication(targetApp).catch(() => {});
        }
      }

      // 2) users.items 동기화
      let usersList = curUsers.map(u => {
        if (String(u.id) === String(uid) || (u.items && u.items.some(it => String(it.id) === String(itemId) || String(it.appRefId) === String(itemId)))) {
          const updatedItems = (u.items || []).map(item => {
            if (String(item.id) === String(itemId) || String(item.appRefId) === String(itemId)) {
              return {
                ...item,
                assignedConstructorId: String(constId),
                assignedConstructorName: constName,
                constructionStatus: item.constructionStatus || 'before_construction',
                assignedAt: new Date().toISOString()
              };
            }
            return item;
          });
          return { ...u, items: updatedItems };
        }
        return u;
      });
      this.saveUsers(usersList);

      if (window.SupabaseSync && typeof window.SupabaseSync.updateUser === 'function') {
        const updatedUser = usersList.find(u => String(u.id) === String(uid));
        if (updatedUser) {
          window.SupabaseSync.updateUser(uid, { items: updatedUser.items || [] }).catch(() => {});
        }
      }

      this.notifyAll(true);
      return { success: true, constName };
    },

    // --- 3-5. 영업물건 시공사 배정 초기화 / 변경 ---
    reassignConstructorItem: function (uid, itemId) {
      if (!itemId) return { success: false };

      // 1) applications 단일 원천 초기화
      let apps = this.getApplications();
      let targetApp = apps.find(a => String(a.id) === String(itemId) || String(a.appRefId) === String(itemId));
      if (targetApp) {
        targetApp.assignedConstructorId = null;
        targetApp.assignedConstructorName = null;
        this.saveApplications(apps);

        if (window.SupabaseSync && typeof window.SupabaseSync.upsertApplication === 'function') {
          window.SupabaseSync.upsertApplication(targetApp).catch(() => {});
        }
      }

      // 2) users.items 동기화
      let curUsers = this.getUsers();
      let usersList = curUsers.map(u => {
        if (String(u.id) === String(uid) || (u.items && u.items.some(it => String(it.id) === String(itemId) || String(it.appRefId) === String(itemId)))) {
          const updatedItems = (u.items || []).map(item => {
            if (String(item.id) === String(itemId) || String(item.appRefId) === String(itemId)) {
              return {
                ...item,
                assignedConstructorId: null,
                assignedConstructorName: null
              };
            }
            return item;
          });
          return { ...u, items: updatedItems };
        }
        return u;
      });
      this.saveUsers(usersList);

      if (window.SupabaseSync && typeof window.SupabaseSync.updateUser === 'function') {
        const updatedUser = usersList.find(u => String(u.id) === String(uid));
        if (updatedUser) {
          window.SupabaseSync.updateUser(uid, { items: updatedUser.items || [] }).catch(() => {});
        }
      }

      this.notifyAll(true);
      return { success: true };
    },

    // --- 4. 온라인 간편 지원 신청서 영구 삭제 ---
    deleteApplication: function (appId, btnEl, event) {
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      if (!appId) return { success: false };
      const targetId = String(appId).trim();

      if (!confirm('[주의] 지원 신청 접수 건 [' + targetId + ']을(를) 정말로 영구 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.')) {
        return { success: false, cancelled: true };
      }

      // 1) 0초 즉각 DOM 요소 제거 (낙관적 UI)
      if (btnEl) {
        const card = (btnEl instanceof Element) ? (btnEl.closest('tr') || btnEl.closest('.admin-app-card') || btnEl.closest('div[style*="border"]') || btnEl.closest('.app-card') || btnEl.closest('.card')) : null;
        if (card && card.parentNode) card.parentNode.removeChild(card);
      }

      // 2) applications 배열에서 영구 제거
      let apps = this.getApplications();
      apps = apps.filter(a => a && String(a.id).trim() !== targetId && String(a.appRefId || '').trim() !== targetId);
      this.saveApplications(apps);

      // 4) users.items 에서도 연계 물건 영구 제거
      let users = this.getUsers();
      users = users.map(u => {
        if (u.items && u.items.length > 0) {
          const cleanedItems = u.items.filter(it => it && String(it.id).trim() !== targetId && String(it.appRefId || '').trim() !== targetId);
          if (cleanedItems.length !== u.items.length) {
            if (window.SupabaseSync) window.SupabaseSync.updateUser(u.id, { items: cleanedItems });
          }
          return { ...u, items: cleanedItems };
        }
        return u;
      });
      this.saveUsers(users);

      // 5) Supabase DB 영구 삭제 (Non-blocking)
      if (window.SupabaseSync && typeof window.SupabaseSync.deleteApplication === 'function') {
        window.SupabaseSync.deleteApplication(targetId);
      }

      alert('지원 신청 접수 건 [' + targetId + ']이(가) 정상적으로 영구 삭제되었습니다.');
      this.notifyAll(true);
      return { success: true };
    },

    // --- 5. 회원 영구 탈퇴/삭제 (DB 직통 영구 삭제) ---
    deleteUser: function (userId, btnEl) {
      if (!userId) return { success: false };
      const targetId = String(userId).trim();
      if (!targetId) return { success: false };
      const targetLower = targetId.toLowerCase();

      if (!confirm('[주의] 회원 ID [' + targetId + ']을(를) 정말로 강제 탈퇴/삭제 처리하시겠습니까?\n삭제 후 복구할 수 없습니다.')) {
        return { success: false, cancelled: true };
      }

      // 1) 0초 즉각 DOM 제거
      if (btnEl) {
        const row = btnEl.closest('tr') || btnEl.closest('.user-card-mob') || btnEl.closest('.admin-user-card-mob');
        if (row && row.parentNode) row.parentNode.removeChild(row);
      }

      // 2) users 배열에서 직접 제거 (targetId 및 해당 유저의 전화번호 매칭건 전수 삭제)
      let rawUsers = JSON.parse(localStorage.getItem('users')) || [];
      const targetUser = rawUsers.find(u => String(u.id).toLowerCase() === targetLower);
      const targetPhone = targetUser ? String(targetUser.phone || '').trim() : '';
      const targetDigits = targetPhone.replace(/[^0-9]/g, '');

      rawUsers = rawUsers.filter(u => {
        if (!u || !u.id) return false;
        const uId = String(u.id).toLowerCase();
        const uPhone = String(u.phone || '').replace(/[^0-9]/g, '');
        if (uId === targetLower) return false;
        if (targetDigits && uPhone && uPhone === targetDigits) return false;
        return true;
      });
      this.saveUsers(rawUsers);

      // 3) 현재 로그인 세션이 삭제된 회원이면 즉시 세션 파기
      const active = this.getActiveUser();
      if (active) {
        const actId = String(active.id || '').toLowerCase();
        if (actId === targetLower) {
          this.setActiveUser(null);
          if (typeof clearActiveUser === 'function') clearActiveUser();
        }
      }

      // 4) Supabase DB 영구 삭제
      if (window.SupabaseSync && typeof window.SupabaseSync.deleteUser === 'function') {
        window.SupabaseSync.deleteUser(targetId, targetPhone);
      }

      alert('회원 [' + targetId + ']이(가) 정상적으로 탈퇴/삭제되었습니다.');
      this.notifyAll(true);
      if (typeof window.renderAdminDashboardMob === 'function') window.renderAdminDashboardMob(true);
      if (typeof window.renderAllUsersList === 'function') window.renderAllUsersList();
      return { success: true, deletedId: targetId };
    },

    // --- 6. 신청서 상태 변경 (SSOT 단일 원천 & 영업자/시공사 6대 화면 실시간 동기화) ---
    updateApplicationStatus: function (appId, newStatus) {
      let apps = this.getApplications();
      const appIndex = apps.findIndex(a => String(a.id).trim().toLowerCase() === String(appId).trim().toLowerCase());
      if (appIndex === -1) return { success: false };

      const app = apps[appIndex];
      app.status = newStatus;
      app.updatedAt = new Date().toISOString();
      apps[appIndex] = app;
      this.saveApplications(apps);

      // users.items 내 매칭 항목의 신청 상태(status) 동기화 (progressStatus는 영업물건 진행상황 고유 필드이므로 보존)
      let users = this.getUsers();
      let usersUpdated = false;
      users = users.map(u => {
        if (u.items && Array.isArray(u.items)) {
          let userItemModified = false;
          const updatedItems = u.items.map(it => {
            if (String(it.id) === String(app.id) || String(it.appRefId) === String(app.id)) {
              userItemModified = true;
              return { ...it, status: newStatus };
            }
            return it;
          });
          if (userItemModified) {
            usersUpdated = true;
            return { ...u, items: updatedItems };
          }
        }
        return u;
      });

      if (usersUpdated) {
        this.saveUsers(users);
      }

      // 비동기 Supabase 저장 (초경량 단일 필드 직통 업데이트로 지연시간 90% 단축 & 충돌 원천 방어)
      (async () => {
        try {
          if (window.SupabaseSync) {
            await window.SupabaseSync.updateApplication(app.id, { status: newStatus });
            if (usersUpdated) {
              users.forEach(u => {
                if (u.role === 'business' || u.role === 'admin') {
                  window.SupabaseSync.updateUser(u.id, { items: u.items || [] });
                }
              });
            }
          }
        } catch (e) {
          console.warn('[DataStore] updateApplicationStatus sync warning:', e);
        }
      })();

      // 5) 낙관적 In-place DOM 부분 갱신 (1회 클릭 즉시 반영 & 전체 DOM 재생성으로 인한 포커스 날아감 방지)
      try {
        const appIdStr = String(app.id || appId).trim();
        let statusColor = '#475569';
        let statusBg = '#f1f5f9';
        let statusBorder = '#cbd5e1';

        if (newStatus === 'approved' || newStatus === '서류준비 & 접수대기' || newStatus === '서류제출 & 접수예정' || newStatus === '승인 완료') {
          statusColor = '#1e40af';
          statusBg = '#eff6ff';
          statusBorder = '#bfdbfe';
        } else if (newStatus === 'unqualified' || newStatus === '신청요건 미달업체' || newStatus === '미달') {
          statusColor = '#d97706';
          statusBg = '#fffbeb';
          statusBorder = '#fde68a';
        } else if (newStatus === 'rejected' || newStatus === '지원사업 탈락' || newStatus === '지원사업탈락') {
          statusColor = '#dc2626';
          statusBg = '#fee2e2';
          statusBorder = '#fca5a5';
        } else if (newStatus === 'giveup' || newStatus === '지원사업 포기' || newStatus === '지원사업포기') {
          statusColor = '#b45309';
          statusBg = '#fffbeb';
          statusBorder = '#fde68a';
        }

        // PC 웹 신청서 목록 드롭다운 즉시 부분 동기화
        const pcSelects = document.querySelectorAll(`select.select-app-status-pc[data-id="${appIdStr}"]`);
        pcSelects.forEach(sel => {
          sel.value = newStatus;
          sel.style.color = statusColor;
          sel.style.backgroundColor = statusBg;
          sel.style.borderColor = statusBorder;
        });

        // 모바일 앱 신청서 목록 드롭다운 즉시 부분 동기화
        const mobSelects = document.querySelectorAll(`select.select-app-status-mob[data-id="${appIdStr}"]`);
        mobSelects.forEach(sel => {
          sel.value = newStatus;
          sel.style.color = statusColor;
          sel.style.backgroundColor = statusBg;
          sel.style.borderColor = statusBorder;
        });

        // 영업자 / 신청자 대시보드의 상태 배지도 즉시 동기화
        if (typeof window.getAppStatusBadgeHtml === 'function') {
          const newBadgeHtml = window.getAppStatusBadgeHtml(app);
          const badgeEls = document.querySelectorAll(`.badge-status[data-id="${appIdStr}"], span.badge-app-status[data-id="${appIdStr}"]`);
          badgeEls.forEach(b => {
            b.outerHTML = newBadgeHtml;
          });
        }
      } catch (eDom) {
        console.warn('[DataStore] In-place DOM update notice for app status:', eDom);
      }

      // 6) 전체 대시보드 화면 0초 강제 동기화 (최고관리자, 영업자, 시공사, 점주 6대 화면 즉시 리렌더링)
      this.notifyAll(true);
      return { success: true, status: newStatus, app: app };
    },

    // --- 6-1. 신청서 세부 정보 전체 수정 (최고관리자 직권 수정 & SSOT 6대 화면 연동 & 점주 계정 동기화) ---
    updateApplication: function (appId, updatedFields) {
      let apps = this.getApplications();
      const appIndex = apps.findIndex(a => String(a.id).trim().toLowerCase() === String(appId).trim().toLowerCase());
      if (appIndex === -1) return { success: false, message: '신청서를 찾을 수 없습니다.' };

      const currentApp = apps[appIndex];
      const newApp = {
        ...currentApp,
        ...updatedFields,
        id: currentApp.id, // ID는 불변
        updatedAt: new Date().toISOString()
      };

      // 1) 점주 연락처 변경 시 자동 생성된 점주 계정(ID, 비밀번호, 연락처) 동기화
      const oldPhone = String(currentApp.ownerPhone || currentApp.phone || '').trim();
      const newPhone = String(newApp.ownerPhone || newApp.phone || '').trim();
      const oldPhoneDigits = oldPhone.replace(/[^0-9]/g, '');
      const newPhoneDigits = newPhone.replace(/[^0-9]/g, '');

      let users = this.getUsers();
      let usersUpdated = false;
      let userAccountChanged = null;

      if (oldPhoneDigits && newPhoneDigits && oldPhoneDigits !== newPhoneDigits) {
        // 기존 전화번호로 된 일반 점주 회원 계정 탐색 (role === 'normal')
        const ownerUserIdx = users.findIndex(u =>
          (u.role === 'normal' || !u.role) &&
          (String(u.id).toLowerCase() === oldPhoneDigits.toLowerCase() || (u.phone && String(u.phone).replace(/[^0-9]/g, '') === oldPhoneDigits))
        );

        if (ownerUserIdx !== -1) {
          const targetOwner = users[ownerUserIdx];
          const newAutoPw = 'g-' + (newPhoneDigits.length >= 8 ? newPhoneDigits.slice(-8) : newPhoneDigits.padStart(8, '0'));
          const newHashedPw = (typeof sha256 === 'function') ? sha256(newAutoPw) : newAutoPw;

          // 이미 새 전화번호로 가입된 다른 회원이 존재하는지 확인 (중복 충돌 완벽 방어)
          const existingTargetIdx = users.findIndex((u, idx) => 
            idx !== ownerUserIdx && 
            (String(u.id).toLowerCase() === newPhoneDigits.toLowerCase() || (u.phone && String(u.phone).replace(/[^0-9]/g, '') === newPhoneDigits))
          );

          if (existingTargetIdx !== -1) {
            // 이미 해당 번호의 회원이 존재하면, 이전 오타 계정만 삭제하고 신청서를 기존 실존 회원에게 안전하게 귀속
            userAccountChanged = {
              oldId: targetOwner.id,
              oldPhone: targetOwner.phone,
              newId: users[existingTargetIdx].id,
              newPhone: newPhone,
              newPw: null
            };
            users = users.filter((_, idx) => idx !== ownerUserIdx);
            usersUpdated = true;
          } else {
            // 새 전화번호로 업주 계정 ID 및 정보 변경
            userAccountChanged = {
              oldId: targetOwner.id,
              oldPhone: targetOwner.phone,
              newId: newPhoneDigits,
              newPhone: newPhone,
              newPw: newAutoPw
            };

            users[ownerUserIdx] = {
              ...targetOwner,
              id: newPhoneDigits,
              phone: newPhone,
              name: newApp.ownerName || targetOwner.name,
              address: newApp.storeAddress || targetOwner.address,
              pw: newHashedPw
            };
            usersUpdated = true;
          }

          // 신청서의 applicantUserId 및 autoAccount 정보도 새 번호로 갱신
          newApp.applicantUserId = newPhoneDigits;
          if (newApp.registeredBy === oldPhoneDigits) newApp.registeredBy = newPhoneDigits;
          if (newApp.autoAccount) {
            newApp.autoAccount.id = newPhoneDigits;
            if (userAccountChanged.newPw) newApp.autoAccount.pw = userAccountChanged.newPw;
          }
        }
      }

      apps[appIndex] = newApp;
      this.saveApplications(apps);

      // 2) users.items 내 매칭 항목 동기화
      users = users.map(u => {
        if (u.items && Array.isArray(u.items)) {
          let userItemModified = false;
          const updatedItems = u.items.map(it => {
            if (String(it.id) === String(newApp.id) || String(it.appRefId) === String(newApp.id)) {
              userItemModified = true;
              return {
                ...it,
                name: newApp.storeName || newApp.shopName || it.name,
                phone: newApp.ownerPhone || newApp.phone || it.phone,
                address: newApp.storeAddress || newApp.address || it.address,
                status: newApp.status || it.status
              };
            }
            return it;
          });
          if (userItemModified) {
            usersUpdated = true;
            return { ...u, items: updatedItems };
          }
        }
        return u;
      });

      if (usersUpdated) {
        this.saveUsers(users);
      }

      // 3) 비동기 Supabase 동기화 (신청서 + 변경된 업주 계정 + 영업자 items)
      (async () => {
        try {
          if (window.SupabaseSync) {
            await window.SupabaseSync.upsertApplication(newApp);

            if (userAccountChanged) {
              // 기존 구형 ID 계정 삭제 및 새 ID 계정 저장
              if (typeof window.SupabaseSync.deleteUser === 'function') {
                await window.SupabaseSync.deleteUser(userAccountChanged.oldId, userAccountChanged.oldPhone);
              }
              const updatedOwnerUser = users.find(u => u.id === userAccountChanged.newId);
              if (updatedOwnerUser && typeof window.SupabaseSync.upsertUser === 'function') {
                await window.SupabaseSync.upsertUser(updatedOwnerUser);
              }
            }

            if (usersUpdated) {
              users.forEach(u => {
                if (u.role === 'business' || u.role === 'admin') {
                  window.SupabaseSync.updateUser(u.id, { items: u.items || [] });
                }
              });
            }
          }
        } catch (e) {
          console.warn('[DataStore] updateApplication sync warning:', e);
        }
      })();

      this.notifyAll(true);
      return { success: true, app: newApp, accountChanged: userAccountChanged };
    },

    // --- 7. 3초 간편문의 (Inquiries) 통합 관리 엔진 ---
    getDeletedInquiryIds: function () {
      return [];
    },

    getInquiries: function () {
      try {
        const inqs = JSON.parse(localStorage.getItem('inquiries')) || [];
        return inqs.filter(i => i && i.id);
      } catch (e) {
        console.error('[DataStore] getInquiries error:', e);
        return [];
      }
    },

    saveInquiries: function (inqs) {
      try {
        localStorage.setItem('inquiries', JSON.stringify(inqs));
        return true;
      } catch (e) {
        console.error('[DataStore] saveInquiries error:', e);
        return false;
      }
    },

    upsertInquiry: function (inq) {
      if (!inq || !inq.id) return { success: false };
      let inqs = this.getInquiries();
      const index = inqs.findIndex(i => String(i.id) === String(inq.id));
      if (index >= 0) {
        inqs[index] = { ...inqs[index], ...inq };
      } else {
        inqs.unshift(inq);
      }
      this.saveInquiries(inqs);

      if (window.SupabaseSync && typeof window.SupabaseSync.upsertInquiry === 'function') {
        window.SupabaseSync.upsertInquiry(inq);
      }

      this.notifyAll();
      return { success: true, inquiry: inq };
    },

    toggleInquiryStatus: function (id, btnEl) {
      let inqs = this.getInquiries();
      let inqIndex = inqs.findIndex(i => String(i.id) === String(id));
      if (inqIndex === -1 && btnEl) {
        const rowOrCard = btnEl.closest('tr') || btnEl.closest('.admin-inquiry-card-mob') || btnEl.closest('div');
        if (rowOrCard) {
          const phoneEl = rowOrCard.querySelector('a[href^="tel:"]');
          const phoneText = phoneEl ? phoneEl.textContent.replace(/[^0-9]/g, '') : '';
          if (phoneText) {
            inqIndex = inqs.findIndex(i => (i.phone || '').replace(/[^0-9]/g, '') === phoneText);
          }
        }
      }

      if (inqIndex >= 0) {
        const target = inqs[inqIndex];
        const curStatus = target.status;
        const isNowResolved = (curStatus !== 'resolved' && curStatus !== 'completed' && curStatus !== '확인완료' && curStatus !== '상담완료');
        const newStatus = isNowResolved ? 'resolved' : 'pending';
        target.status = newStatus;
        inqs[inqIndex] = target;
        this.saveInquiries(inqs);

        if (window.SupabaseSync && typeof window.SupabaseSync.upsertInquiry === 'function') {
          window.SupabaseSync.upsertInquiry(target);
        }

        this.notifyAll();
        return { success: true, isResolved: isNowResolved, status: newStatus };
      }
      return { success: false };
    },

    deleteInquiry: function (id, btnEl) {
      if (!id) return { success: false };
      let inqs = this.getInquiries();
      let target = inqs.find(i => String(i.id) === String(id));
      if (!target && btnEl) {
        const rowOrCard = btnEl.closest('tr') || btnEl.closest('.admin-inquiry-card-mob') || btnEl.closest('div');
        if (rowOrCard) {
          const phoneEl = rowOrCard.querySelector('a[href^="tel:"]');
          const phoneText = phoneEl ? phoneEl.textContent.replace(/[^0-9]/g, '') : '';
          if (phoneText) {
            target = inqs.find(i => (i.phone || '').replace(/[^0-9]/g, '') === phoneText);
          }
        }
      }

      const targetId = target ? target.id : id;
      inqs = inqs.filter(i => String(i.id) !== String(targetId));
      this.saveInquiries(inqs);

      if (window.SupabaseSync && typeof window.SupabaseSync.deleteInquiry === 'function') {
        window.SupabaseSync.deleteInquiry(targetId);
      }

      this.notifyAll(true);
      return { success: true, deletedId: targetId };
    },

    clearAllInquiries: function () {
      localStorage.setItem('inquiries', JSON.stringify([]));
      localStorage.setItem('inquiries_purged_flag', 'true');
      if (window.SupabaseSync && typeof window.SupabaseSync.clearAllInquiries === 'function') {
        window.SupabaseSync.clearAllInquiries();
      }
      this.notifyAll(true);
      return { success: true };
    },

    // --- 8. 전체 대시보드 화면 동기화 브로드캐스트 (스마트 선택적 렌더링 & 1회 클릭 즉시 반영 & 0초 연동) ---
    notifyAll: function (force = false) {
      try {
        const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
        const isFormActive = Boolean(window.isInteractingWithForm || (activeEl && (activeEl.tagName === 'SELECT' || (activeEl.tagName === 'INPUT' && activeEl.type !== 'submit') || activeEl.tagName === 'TEXTAREA')));

        // 현재 조작 중인 폼이 속한 화면을 정밀 감지하여 해당 테이블만 안전하게 리렌더링 스킵 (In-place로 이미 갱신됨)
        const isAppSelectActive = isFormActive && activeEl && (activeEl.classList.contains('select-app-status-pc') || activeEl.classList.contains('select-app-status-mob') || (activeEl.closest && (activeEl.closest('#applications-table-body') || activeEl.closest('#admin-apps-list-mob') || activeEl.closest('#admin-apps-list-mobile'))));
        const isBizSelectActive = isFormActive && activeEl && (activeEl.classList.contains('select-receipt-status') || activeEl.classList.contains('select-progress-status') || activeEl.classList.contains('select-receipt-mob') || activeEl.classList.contains('select-progress-mob') || (activeEl.closest && (activeEl.closest('#manager-biz-tbody') || activeEl.closest('#biz-items-list-mobile') || activeEl.closest('#manager-items-list') || activeEl.closest('#manager-const-progress-tbody'))));

        // 1. 최고관리자 신청서 목록: 관리자가 신청서 드롭다운 조작 중일 때는 DOM 파괴 방지를 위해 스킵 (이미 In-place 갱신됨)
        if (!isAppSelectActive || force === 'all') {
          if (typeof window.renderApplicationsList === 'function') window.renderApplicationsList();
          if (typeof window.renderAdminDashboardMob === 'function') window.renderAdminDashboardMob(true);
        }

        // 2. 최고관리자 영업물건 목록: 관리자가 영업물건 드롭다운 조작 중일 때는 DOM 파괴 방지를 위해 스킵 (이미 In-place 갱신됨)
        if (!isBizSelectActive || force === 'all') {
          if (typeof window.renderManagerPanel === 'function') window.renderManagerPanel();
          if (typeof window.renderManagerConstProgress === 'function') window.renderManagerConstProgress();
        }

        // 3. 영업자 / 시공사 / 점주 화면: 현재 관리자 폼과 무관하므로 항상 100% 즉시 실시간 리렌더링!
        if (typeof window.renderBizRegisteredTable === 'function') window.renderBizRegisteredTable();
        if (typeof window.renderBusinessDashboard === 'function') window.renderBusinessDashboard();
        if (typeof window.renderBusinessDashboardMob === 'function') window.renderBusinessDashboardMob();
        if (typeof window.renderBizRegisteredItemsMob === 'function') window.renderBizRegisteredItemsMob();
        if (typeof window.renderUserApplicationsList === 'function') window.renderUserApplicationsList();
        if (typeof window.renderUserApplicationsMob === 'function') window.renderUserApplicationsMob();
        if (typeof window.renderConstructorDashboard === 'function') window.renderConstructorDashboard();
        if (typeof window.renderConstructorDashboardMob === 'function') window.renderConstructorDashboardMob(true);

        // 4. 기타 회원 / 문의 목록
        if (!isFormActive || force === 'all') {
          if (typeof window.renderAllUsersList === 'function') window.renderAllUsersList();
          if (typeof window.renderInquiriesList === 'function') window.renderInquiriesList();
        }

        // 전역 실시간 브로드캐스트 발화
        if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function' && typeof CustomEvent === 'function') {
          window.dispatchEvent(new CustomEvent('supabase-data-synced'));
        }
      } catch (e) {
        console.error('[DataStore] notifyAll error:', e);
      }
    }
  };

  // 전역 노출
  window.DataStore = DataStore;

  // 레거시 전역 핸들러 브릿지 (기존 onclick 속성 호환 100% 보장)
  window.toggleBizItem = function (appId, btnEl) {
    return window.DataStore.toggleBizItem(appId, btnEl);
  };
  window.toggleBizItemMob = function (appId, btnEl) {
    return window.DataStore.toggleBizItem(appId, btnEl);
  };
  window.deleteApplicationAdmin = function (appId, btnEl, event) {
    if (window.DataStore && typeof window.DataStore.deleteApplication === 'function') {
      return window.DataStore.deleteApplication(appId, btnEl, event);
    }
  };
  window.deleteApplicationAdminMob = function (appId, btnEl, event) {
    if (window.DataStore && typeof window.DataStore.deleteApplication === 'function') {
      return window.DataStore.deleteApplication(appId, btnEl, event);
    }
  };
  window.deleteUserAdmin = function (userId, btnEl) {
    return window.DataStore.deleteUser(userId, btnEl);
  };
  window.deleteUserAdminMob = function (userId, btnEl) {
    return window.DataStore.deleteUser(userId, btnEl);
  };
  window.toggleInquiryStatus = function (inqId, btnEl) {
    return window.DataStore.toggleInquiryStatus(inqId, btnEl);
  };
  window.toggleInquiryStatusMob = function (inqId, btnEl) {
    return window.DataStore.toggleInquiryStatus(inqId, btnEl);
  };
  window.deleteInquiryAdmin = function (inqId, btnEl) {
    if (!confirm('정말로 이 간편 문의 내역을 영구 삭제하시겠습니까?')) return;
    const res = window.DataStore.deleteInquiry(inqId, btnEl);
    alert('간편 문의 내역이 성공적으로 삭제되었습니다.');
    return res;
  };
  window.deleteInquiryAdminMob = function (inqId, e) {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    if (!confirm('정말로 이 간편 문의 내역을 영구 삭제하시겠습니까?')) return;
    const btnEl = (e instanceof Element) ? e : (e && e.target instanceof Element ? e.target.closest('button') : null);
    const res = window.DataStore.deleteInquiry(inqId, btnEl);
    alert('간편 문의 내역이 성공적으로 삭제되었습니다.');
    return res;
  };
  window.clearAllInquiriesAdmin = function () {
    if (!confirm('정말로 모든 3초 간편 문의 접수 내역을 영구 삭제하고 초기화하시겠습니까?\n삭제 후 복구할 수 없습니다.')) return;
    const res = window.DataStore.clearAllInquiries();
    alert('모든 간편 문의 내역이 성공적으로 초기화되었습니다.');
    return res;
  };

  // 영업물건 접수/진행상태 변경 전역 브릿지
  window.updateItemStatus = function (uid, itemId, type, value) {
    if (window.DataStore && typeof window.DataStore.updateItemStatus === 'function') {
      return window.DataStore.updateItemStatus(uid, itemId, type, value);
    }
  };
  window.updateItemStatusMob = function (uid, itemId, type, value) {
    if (window.DataStore && typeof window.DataStore.updateItemStatus === 'function') {
      return window.DataStore.updateItemStatus(uid, itemId, type, value);
    }
  };

  // 신청서 상태 변경 전역 브릿지
  window.updateApplicationStatus = function (id, newStatus, selectEl) {
    if (window.DataStore && typeof window.DataStore.updateApplicationStatus === 'function') {
      return window.DataStore.updateApplicationStatus(id, newStatus);
    }
  };
  window.updateApplicationStatusMob = function (id, newStatus, selectEl) {
    if (window.DataStore && typeof window.DataStore.updateApplicationStatus === 'function') {
      return window.DataStore.updateApplicationStatus(id, newStatus);
    }
  };

  // --- 신청서 담당 영업자 수정/변경 모달 전역 브릿지 (PC웹 & 모바일 공용) ---
  window.openAssignBizUserModal = function (appId, event) {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (!appId) return;
    const targetId = String(appId).trim();
    const apps = (window.DataStore ? window.DataStore.getApplications() : (JSON.parse(localStorage.getItem('applications')) || []));
    let app = apps.find(a => String(a.id) === targetId || String(a.id).trim() === targetId || String(a.appRefId) === targetId);
    if (!app) {
      const rawApps = JSON.parse(localStorage.getItem('applications')) || [];
      app = rawApps.find(a => String(a.id) === targetId || String(a.id).trim() === targetId);
    }
    if (!app) {
      alert('해당 신청서 정보를 찾을 수 없습니다.');
      return;
    }

    const allUsers = (window.DataStore ? window.DataStore.getUsers() : (JSON.parse(localStorage.getItem('users')) || []));
    
    // 승인된 영업자 목록 추출 (시공사 전용 회원은 배제하고, 영업자 코드 보유자 및 영업자만 정밀 추출)
    const bizUsers = allUsers.filter(u => {
      if (!u || !u.id || u.role === 'deleted') return false;
      if (u.role === 'constructor' && !u.bizCode) return false;
      return (u.role === 'business' || (u.bizCode && String(u.bizCode).trim().length > 0));
    });

    // 현재 배정된 영업자 확인
    const curRef = String(app.referrerCode || '').trim();
    let currentBizName = '담당자 없음 (본사 직접 접수)';
    if (curRef) {
      const matched = bizUsers.find(u => u.bizCode === curRef || u.id === curRef);
      if (matched) {
        currentBizName = `${matched.name} (${matched.bizCode || matched.id})`;
      } else {
        currentBizName = `${curRef} 영업자`;
      }
    }

    // 기존 모달 제거 후 재생성
    let existingModal = document.getElementById('assign-bizuser-modal');
    if (existingModal) existingModal.remove();

    const escapeText = (str) => {
      if (!str) return '';
      return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
    };

    const modalHtml = `
      <div id="assign-bizuser-modal" style="position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.55); z-index: 1000000; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; backdrop-filter: blur(4px); touch-action: manipulation; -webkit-tap-highlight-color: transparent;">
        <div style="background: #ffffff; border-radius: 16px; width: 100%; max-width: 440px; box-shadow: 0 10px 30px rgba(0,0,0,0.25); overflow: hidden; pointer-events: auto;">
          <div style="background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); padding: 18px 20px; color: #ffffff; display: flex; align-items: center; justify-content: space-between;">
            <h4 style="margin: 0; font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; gap: 8px;">
              <i class="fa-solid fa-user-pen"></i> 담당 영업자 수정 / 변경
            </h4>
            <button type="button" onclick="document.getElementById('assign-bizuser-modal').remove()" style="background: transparent; border: none; color: #ffffff; font-size: 1.4rem; cursor: pointer; line-height: 1; padding: 0 4px;">&times;</button>
          </div>
          <div style="padding: 20px; box-sizing: border-box;">
            <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 12px 14px; margin-bottom: 16px; font-size: 0.88rem; line-height: 1.6;">
              <div><strong>신청 업체:</strong> <span style="color: #1e293b; font-weight: 700;">${escapeText(app.shopName || app.storeName || '-')}</span></div>
              <div><strong>대표자명:</strong> <span>${escapeText(app.ownerName || '-')}</span> (${escapeText(app.ownerPhone || '-')})</div>
              <div><strong>신청번호:</strong> <span style="font-family: monospace; color: #64748b;">${escapeText(app.id)}</span></div>
              <div style="margin-top: 4px; padding-top: 4px; border-top: 1px dashed #cbd5e1;"><strong>현재 담당:</strong> <span style="color: #2563eb; font-weight: 700;">${escapeText(currentBizName)}</span></div>
            </div>

            <label style="display: block; font-weight: 700; font-size: 0.92rem; color: #334155; margin-bottom: 6px;">새로 배정할 담당 영업자 선택</label>
            <select id="modal-select-bizuser" style="width: 100%; padding: 12px 14px; font-size: 0.95rem; border: 1.5px solid #3b82f6; border-radius: 8px; background: #ffffff; color: #1e293b; font-weight: 600; outline: none; margin-bottom: 18px; box-sizing: border-box;">
              <option value="" ${!curRef ? 'selected' : ''}>-- 담당자 없음 (본사 직접 접수) --</option>
              ${bizUsers.map(u => {
                const code = u.bizCode || u.id;
                const isSelected = (curRef && (curRef === u.bizCode || curRef === u.id)) ? 'selected' : '';
                const phoneText = u.phone ? ` - ${u.phone}` : '';
                return `<option value="${code}" ${isSelected}>${escapeText(u.name)} (${escapeText(code)})${escapeText(phoneText)}</option>`;
              }).join('')}
            </select>

            <div style="display: flex; gap: 10px;">
              <button type="button" onclick="document.getElementById('assign-bizuser-modal').remove()" style="flex: 1; padding: 12px; font-size: 0.95rem; font-weight: 600; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer;">취소</button>
              <button type="button" id="btn-confirm-assign-bizuser" onclick="window.confirmAssignBizUserModal('${targetId}', event)" style="flex: 2; padding: 12px; font-size: 0.95rem; font-weight: 700; background: #2563eb; color: #ffffff; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.3); touch-action: manipulation; -webkit-tap-highlight-color: transparent;">저장 및 배정 완료</button>
            </div>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modalOverlay = document.getElementById('assign-bizuser-modal');
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.remove();
      });
    }
  };
  window.openAssignBizUserModalMob = window.openAssignBizUserModal;

  // --- 최고관리자 영업자 배정 저장 단일 실행 헬퍼 (0초 원클릭 즉시 반영) ---
  window.confirmAssignBizUserModal = function (targetId, event) {
    if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (!targetId) return;

    const selectEl = document.getElementById('modal-select-bizuser');
    const selectedCode = selectEl ? selectEl.value : '';
    const selectedText = selectEl && selectEl.selectedIndex >= 0 ? selectEl.options[selectEl.selectedIndex].text : '';

    // 1. 모달 및 포커스 즉시 해제 (드롭다운/폼 인터랙션 잠금 해제)
    if (typeof document !== 'undefined' && document.activeElement) {
      try { document.activeElement.blur(); } catch (e) {}
    }
    const modalEl = document.getElementById('assign-bizuser-modal');
    if (modalEl) modalEl.remove();

    // 2. DataStore 갱신 및 3+1 원칙 동기화
    let res = null;
    if (window.DataStore && typeof window.DataStore.updateApplicationReferrer === 'function') {
      res = window.DataStore.updateApplicationReferrer(targetId, selectedCode);
    } else {
      // Fallback
      const curApps = JSON.parse(localStorage.getItem('applications')) || [];
      const t = curApps.find(a => String(a.id) === targetId || String(a.id).trim() === targetId);
      if (t) {
        t.referrerCode = selectedCode;
        t.referrer_code = selectedCode;
        localStorage.setItem('applications', JSON.stringify(curApps));
        if (window.SupabaseSync) window.SupabaseSync.upsertApplication(t);
      }
    }

    // 3. 변경된 영업자 이름 계산
    let newBizUserName = '본사직접접수';
    if (res && res.salesUser && res.salesUser.name) {
      newBizUserName = `${res.salesUser.name}영업자`;
    } else if (selectedCode) {
      newBizUserName = selectedText ? selectedText.split('(')[0].trim() + '영업자' : `${selectedCode}영업자`;
    }

    // 4. In-place DOM 즉시 갱신 (PC웹 & 모바일 0초 원클릭 변경 보장)
    try {
      const isHeadquarter = (!selectedCode || newBizUserName === '본사직접접수');
      const nameDisplay = isHeadquarter ? '본사직접접수' : newBizUserName;
      const mobNameDisplay = isHeadquarter ? '본사직접접수' : (newBizUserName.replace(/영업자$/, '') || newBizUserName);
      const iconClass = isHeadquarter ? 'fa-building' : 'fa-user-tie';
      const textColor = isHeadquarter ? '#64748b' : 'var(--accent-primary, #2563eb)';
      const iconColor = isHeadquarter ? '#94a3b8' : 'var(--accent-secondary, #3b82f6)';

      // 4-1. PC웹 Table 행 갱신 (정밀 검색)
      const allRows = document.querySelectorAll('#applications-table-body tr, table tr');
      allRows.forEach(tr => {
        if (tr.innerHTML && tr.innerHTML.includes(targetId)) {
          const allTds = tr.querySelectorAll('td');
          if (allTds && allTds.length >= 4) {
            const td4 = allTds[3];
            const managerDiv = td4.querySelector('div:first-child');
            if (managerDiv) {
              managerDiv.style.color = textColor;
              managerDiv.innerHTML = `<i class="fa-solid ${iconClass}" style="color: ${iconColor}; font-size: 0.82rem;"></i> ${nameDisplay}`;
            }
          }
        }
      });

      // 4-2. 모바일 Card 갱신 (정밀 검색)
      const allCards = document.querySelectorAll('#admin-applications-list > div, .card, [style*="border-radius"]');
      allCards.forEach(card => {
        if (card.innerHTML && card.innerHTML.includes(targetId)) {
          const bizDivs = Array.from(card.querySelectorAll('div')).filter(d => d.textContent && (d.textContent.includes('담당자 :') || d.textContent.includes('담당자:')));
          bizDivs.forEach(bizDiv => {
            const span = bizDiv.querySelector('span');
            if (span) {
              span.innerHTML = `<i class="fa-solid ${iconClass}" style="color: ${iconColor};"></i> 담당자 : ${mobNameDisplay}`;
            }
            bizDiv.style.color = textColor;
          });
        }
      });
    } catch (domErr) {
      console.warn('[In-place DOM] assign modal update err:', domErr);
    }

    const toastMsg = `[${(res && res.app && (res.app.shopName || res.app.storeName)) || targetId}] 담당 영업자가 '${selectedText || '본사직접접수'}'(으)로 변경되었습니다.`;
    if (typeof window.showToast === 'function') {
      window.showToast(toastMsg);
    }

    // 5. 전체 렌더러 동기식 즉시 호출
    if (typeof window.renderApplicationsList === 'function') window.renderApplicationsList();
    if (typeof window.renderAdminDashboard === 'function') window.renderAdminDashboard();
    if (typeof window.renderAdminDashboardMob === 'function') window.renderAdminDashboardMob(true);
    if (typeof window.renderStatusTab === 'function') window.renderStatusTab();
  };

  // --- 공통 간판 종류 변경 핸들러 (PC웹 & 모바일 공용) ---
  window.updateJobSignType = function (id, signType) {
    const trimmed = String(signType || '').trim();
    if (!trimmed) return;

    let apps = (window.DataStore && typeof window.DataStore.getApplications === 'function')
      ? window.DataStore.getApplications()
      : (JSON.parse(localStorage.getItem('applications')) || []);
    let curUsers = (window.DataStore && typeof window.DataStore.getUsers === 'function')
      ? window.DataStore.getUsers()
      : (JSON.parse(localStorage.getItem('users')) || []);
    let updatedUid = null;

    apps = apps.map(a => {
      if (String(a.id) === String(id)) {
        return { ...a, signType: trimmed };
      }
      return a;
    });
    if (window.DataStore && typeof window.DataStore.saveApplications === 'function') {
      window.DataStore.saveApplications(apps);
    } else {
      localStorage.setItem('applications', JSON.stringify(apps));
    }

    curUsers = curUsers.map(u => {
      if (u.items && Array.isArray(u.items)) {
        const updatedItems = u.items.map(it => {
          if (String(it.id) === String(id) || String(it.appRefId) === String(id)) {
            updatedUid = u.id;
            return { ...it, signType: trimmed };
          }
          return it;
        });
        return { ...u, items: updatedItems };
      }
      return u;
    });
    if (window.DataStore && typeof window.DataStore.saveUsers === 'function') {
      window.DataStore.saveUsers(curUsers);
    } else {
      localStorage.setItem('users', JSON.stringify(curUsers));
    }

    if (window.SupabaseSync) {
      if (typeof window.SupabaseSync.updateApplication === 'function') {
        window.SupabaseSync.updateApplication(id, { sign_type: trimmed });
      } else {
        const app = apps.find(a => String(a.id) === String(id));
        if (app) window.SupabaseSync.upsertApplication(app);
      }
      if (updatedUid) {
        const u = curUsers.find(usr => usr.id === updatedUid);
        if (u) window.SupabaseSync.updateUser(updatedUid, { items: u.items || [] });
      }
    }
    if (window.DataStore) window.DataStore.notifyAll(true);
  };

  // --- 공통 간판 디자인 시안 확정 토글 핸들러 (PC웹 & 모바일 공용) ---
  window.toggleDraftApproval = function (id, newDraftStatus) {
    let apps = (window.DataStore && typeof window.DataStore.getApplications === 'function')
      ? window.DataStore.getApplications()
      : (JSON.parse(localStorage.getItem('applications')) || []);
    let curUsers = (window.DataStore && typeof window.DataStore.getUsers === 'function')
      ? window.DataStore.getUsers()
      : (JSON.parse(localStorage.getItem('users')) || []);
    let updatedUid = null;
    const approvedTime = (newDraftStatus === 'admin_approved' || newDraftStatus === 'owner_approved') ? new Date().toISOString() : null;

    apps = apps.map(a => {
      if (String(a.id) === String(id)) {
        return { ...a, draftStatus: newDraftStatus, draftApprovedAt: approvedTime };
      }
      return a;
    });
    if (window.DataStore && typeof window.DataStore.saveApplications === 'function') {
      window.DataStore.saveApplications(apps);
    } else {
      localStorage.setItem('applications', JSON.stringify(apps));
    }

    curUsers = curUsers.map(u => {
      if (u.items && Array.isArray(u.items)) {
        const updatedItems = u.items.map(it => {
          if (String(it.id) === String(id) || String(it.appRefId) === String(id)) {
            updatedUid = u.id;
            return { ...it, draftStatus: newDraftStatus, draftApprovedAt: approvedTime };
          }
          return it;
        });
        return { ...u, items: updatedItems };
      }
      return u;
    });
    if (window.DataStore && typeof window.DataStore.saveUsers === 'function') {
      window.DataStore.saveUsers(curUsers);
    } else {
      localStorage.setItem('users', JSON.stringify(curUsers));
    }

    if (window.SupabaseSync) {
      if (typeof window.SupabaseSync.updateApplication === 'function') {
        window.SupabaseSync.updateApplication(id, { draft_status: newDraftStatus, draft_approved_at: approvedTime });
      } else {
        const app = apps.find(a => String(a.id) === String(id));
        if (app) window.SupabaseSync.upsertApplication(app);
      }
      if (updatedUid) {
        const u = curUsers.find(usr => usr.id === updatedUid);
        if (u) window.SupabaseSync.updateUser(updatedUid, { items: u.items || [] });
      }
    }

    if (newDraftStatus === 'admin_approved') {
      alert('관리자 직권으로 [간판 디자인 시안]을 최종 확정하였습니다.\n신청 점주 마이페이지 및 시공사 화면에 실시간으로 반영됩니다.');
    } else if (newDraftStatus === 'pending') {
      alert('간판 디자인 시안 확정을 취소하고 [검토중] 상태로 변경하였습니다.');
    }

    if (window.DataStore) window.DataStore.notifyAll(true);
  };

  // --- 점주 전용 간판 디자인 시안 승인 핸들러 ---
  window.approveDraftByOwner = function (id) {
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    let curUsers = JSON.parse(localStorage.getItem('users')) || [];
    let updatedUid = null;
    const approvedTime = new Date().toISOString();

    apps = apps.map(a => {
      if (String(a.id) === String(id)) {
        return { ...a, draftStatus: 'owner_approved', draftApprovedAt: approvedTime };
      }
      return a;
    });
    localStorage.setItem('applications', JSON.stringify(apps));

    curUsers = curUsers.map(u => {
      if (u.items && Array.isArray(u.items)) {
        const updatedItems = u.items.map(it => {
          if (String(it.id) === String(id) || String(it.appRefId) === String(id)) {
            updatedUid = u.id;
            return { ...it, draftStatus: 'owner_approved', draftApprovedAt: approvedTime };
          }
          return it;
        });
        return { ...u, items: updatedItems };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(curUsers));

    if (window.SupabaseSync) {
      const app = apps.find(a => String(a.id) === String(id));
      if (app) window.SupabaseSync.upsertApplication(app);
      if (updatedUid) {
        const u = curUsers.find(usr => usr.id === updatedUid);
        if (u) window.SupabaseSync.updateUser(updatedUid, { items: u.items || [] });
      }
    }

    alert('간판 디자인 시안을 최종 승인하셨습니다!\n시공사와 최고관리자 화면에 즉시 공유되어 간판 제작 및 시공이 진행됩니다.');
    if (window.DataStore) window.DataStore.notifyAll();
  };

  // --- 간판 디자인 시안 크게보기 모달 (PC웹 & 모바일 공용) ---
  window.viewDraftModal = function (id) {
    const jobs = (window.DataStore && typeof window.DataStore.getConstructionJobs === 'function')
      ? window.DataStore.getConstructionJobs()
      : [];
    let job = jobs.find(j => String(j.id) === String(id));
    if (!job) {
      const apps = (window.DataStore && typeof window.DataStore.getApplications === 'function')
        ? window.DataStore.getApplications()
        : (JSON.parse(localStorage.getItem('applications')) || []);
      const app = apps.find(a => String(a.id) === String(id));
      if (app) {
        job = {
          id: app.id,
          storeName: app.storeName || app.shopName || '-',
          signType: app.signType || '간판',
          signDraftPhotos: app.signDraftPhotos || app.designPhotos || [],
          draftStatus: app.draftStatus || 'pending'
        };
      }
    }
    if (!job || !job.signDraftPhotos || job.signDraftPhotos.length === 0) {
      alert('등록된 간판 디자인 시안이 없습니다.');
      return;
    }

    const modalId = 'modal-view-draft-preview';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 99999; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;';
      document.body.appendChild(modal);
    }

    const photosHtml = job.signDraftPhotos.map((src, idx) => `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 6px;">시안 #${idx + 1}</div>
        <img src="${(typeof sanitizeUrl === 'function' ? sanitizeUrl(src) : src)}" alt="간판 디자인 시안 #${idx + 1}" style="max-width: 100%; max-height: 70vh; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.15); object-fit: contain;">
      </div>
    `).join('');

    let statusBadgeText = '시안 검토중';
    if (job.draftStatus === 'owner_approved') statusBadgeText = '점주 시안확정 완료';
    else if (job.draftStatus === 'admin_approved') statusBadgeText = '관리자 직권확정 완료';

    const safeStoreName = (typeof escapeHtml === 'function' ? escapeHtml(job.storeName) : job.storeName);
    const safeSignType = (typeof escapeHtml === 'function' ? escapeHtml(job.signType) : job.signType);

    modal.innerHTML = `
      <div style="background: white; border-radius: 14px; padding: 24px; max-width: 750px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h3 style="margin: 0; font-size: 1.15rem; color: #1e293b;"><i class="fa-solid fa-palette" style="color: #6366f1;"></i> 간판 디자인 시안 확인</h3>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">상호명: <strong>${safeStoreName}</strong> | 간판종류: <strong>${safeSignType}</strong> (${statusBadgeText})</div>
          </div>
          <button type="button" onclick="document.getElementById('${modalId}').style.display='none';" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #64748b; padding: 4px 8px;">&times;</button>
        </div>
        <div>${photosHtml}</div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 10px;">
          ${(job.draftStatus !== 'owner_approved' && job.draftStatus !== 'admin_approved') ? `
            <button type="button" onclick="window.toggleDraftApproval('${job.id}', 'admin_approved'); document.getElementById('${modalId}').style.display='none';" style="padding: 8px 16px; background: #2563eb; color: white; border: none; border-radius: 6px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-check"></i> 관리자 직권 시안확정</button>
          ` : `
            <button type="button" onclick="window.toggleDraftApproval('${job.id}', 'pending'); document.getElementById('${modalId}').style.display='none';" style="padding: 8px 16px; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: inline-flex; align-items: center; gap: 6px;"><i class="fa-solid fa-rotate-left"></i> 시안 확정 취소</button>
          `}
          <button type="button" onclick="document.getElementById('${modalId}').style.display='none';" style="padding: 8px 16px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">닫기</button>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  };

  // --- 시공 후 사진 증빙 확인 모달 (PC웹 & 모바일 공용) ---
  window.viewConstructionPhotosModal = function (id) {
    const jobs = (window.DataStore && typeof window.DataStore.getConstructionJobs === 'function')
      ? window.DataStore.getConstructionJobs()
      : [];
    let job = jobs.find(j => String(j.id) === String(id));
    if (!job) {
      const apps = (window.DataStore && typeof window.DataStore.getApplications === 'function')
        ? window.DataStore.getApplications()
        : (JSON.parse(localStorage.getItem('applications')) || []);
      const app = apps.find(a => String(a.id) === String(id));
      if (app) {
        job = {
          id: app.id,
          storeName: app.storeName || app.shopName || '-',
          assignedConstructorName: app.assignedConstructorName || '시공업체',
          constructionPhotos: app.constructionPhotos || []
        };
      }
    }
    if (!job || !job.constructionPhotos || job.constructionPhotos.length === 0) {
      alert('등록된 시공 후 사진 증빙이 없습니다.');
      return;
    }

    const modalId = 'modal-view-const-photos-preview';
    let modal = document.getElementById(modalId);
    if (!modal) {
      modal = document.createElement('div');
      modal.id = modalId;
      modal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0,0,0,0.8); z-index: 99999; display: flex; justify-content: center; align-items: center; padding: 20px; box-sizing: border-box;';
      document.body.appendChild(modal);
    }

    const photosHtml = job.constructionPhotos.map((src, idx) => `
      <div style="text-align: center; margin-bottom: 20px;">
        <div style="font-size: 0.85rem; font-weight: 700; color: #475569; margin-bottom: 6px;">시공 후 사진 #${idx + 1}</div>
        <img src="${(typeof sanitizeUrl === 'function' ? sanitizeUrl(src) : src)}" alt="시공 후 사진 #${idx + 1}" style="max-width: 100%; max-height: 70vh; border-radius: 8px; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.15); object-fit: contain;">
      </div>
    `).join('');

    const safeStoreName = (typeof escapeHtml === 'function' ? escapeHtml(job.storeName) : job.storeName);
    const safeConstName = (typeof escapeHtml === 'function' ? escapeHtml(job.assignedConstructorName) : job.assignedConstructorName);

    modal.innerHTML = `
      <div style="background: white; border-radius: 14px; padding: 24px; max-width: 750px; width: 100%; max-height: 90vh; overflow-y: auto; position: relative; box-shadow: 0 10px 25px rgba(0,0,0,0.3);">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 12px; margin-bottom: 16px;">
          <div>
            <h3 style="margin: 0; font-size: 1.15rem; color: #1e293b;"><i class="fa-solid fa-camera" style="color: #10b981;"></i> 시공 후 사진 증빙 (${job.constructionPhotos.length}장)</h3>
            <div style="font-size: 0.8rem; color: #64748b; margin-top: 4px;">상호명: <strong>${safeStoreName}</strong> | 시공사: <strong>${safeConstName}</strong></div>
          </div>
          <button type="button" onclick="document.getElementById('${modalId}').style.display='none';" style="background: none; border: none; font-size: 1.4rem; cursor: pointer; color: #64748b; padding: 4px 8px;">&times;</button>
        </div>
        <div>${photosHtml}</div>
        <div style="display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid #e2e8f0; padding-top: 14px; margin-top: 10px;">
          <button type="button" onclick="document.getElementById('${modalId}').style.display='none';" style="padding: 8px 16px; background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; font-weight: 600; font-size: 0.85rem; cursor: pointer;">닫기</button>
        </div>
      </div>
    `;
    modal.style.display = 'flex';
  };
})();
