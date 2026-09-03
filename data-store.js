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
        if (Array.isArray(users) && users.length > 0) {
          let deletedUserIds = this.getDeletedUserIds();
          if (deletedUserIds.length > 0) {
            const activeIds = users.map(u => String(u.id || '').toLowerCase()).filter(Boolean);
            const activePhones = users.map(u => String(u.phone || '').replace(/[^0-9]/g, '')).filter(Boolean);
            const cleaned = deletedUserIds.filter(id => {
              const sid = String(id).toLowerCase();
              const sDigits = sid.replace(/[^0-9]/g, '');
              if (activeIds.includes(sid)) return false;
              if (sDigits && activePhones.includes(sDigits)) return false;
              return true;
            });
            if (cleaned.length !== deletedUserIds.length) {
              localStorage.setItem('deleted_user_ids', JSON.stringify(cleaned));
            }
          }
        }
        localStorage.setItem('users', JSON.stringify(users));
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
      try {
        return JSON.parse(localStorage.getItem('deleted_application_ids')) || [];
      } catch (e) {
        return [];
      }
    },

    getDeletedUserIds: function () {
      try {
        return JSON.parse(localStorage.getItem('deleted_user_ids')) || [];
      } catch (e) {
        return [];
      }
    },

    getDeletedBizItemIds: function () {
      try {
        return JSON.parse(localStorage.getItem('deleted_biz_item_ids')) || [];
      } catch (e) {
        return [];
      }
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
        // 4) applications의 원본 건에서 내가 신청/추천했는지 직접 전수 대조
        const rawApp = apps.find(a => String(a.id).toLowerCase() === itId || String(a.appRefId).toLowerCase() === itId);
        let isRawAppMatch = false;
        if (rawApp) {
          const rawRef = String(rawApp.referrerCode || rawApp.referrer_code || '').trim().toLowerCase();
          const rawUser = String(rawApp.userId || rawApp.registeredBy || rawApp.submitterId || rawApp.salespersonId || '').trim().toLowerCase();
          const rawPhone = String(rawApp.ownerPhone || '').replace(/[^0-9]/g, '');
          const rawOwner = String(rawApp.ownerName || '').trim().toLowerCase();
          isRawAppMatch = (myBizCode && (rawRef === myBizCode || itId.startsWith(myBizCode + '-'))) ||
                          (myUserId && (rawUser === myUserId || rawRef === myUserId)) ||
                          (myUserName && (rawOwner === myUserName || rawRef === myUserName)) ||
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

        // 담당 영업자 찾기 (6중 다각도 정밀 매칭)
        let assignedUser = null;
        const refCode = String(app.referrerCode || app.referrer_code || '').trim().toLowerCase();
        const appUser = String(app.userId || app.registeredBy || app.submitterId || app.salespersonId || '').trim().toLowerCase();
        const appId = String(app.id || '').trim().toLowerCase();
        const appPhone = String(app.ownerPhone || '').replace(/[^0-9]/g, '');
        const appOwner = String(app.ownerName || '').trim().toLowerCase();

        // 1. referrerCode로 탐색 (코드, ID, 이름)
        if (refCode) {
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
        const pStatus = app.progressStatus || (app.constructionStatus && app.constructionStatus !== 'none' ? app.constructionStatus : null) || '지원대기중';

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
            signType: app.signType || '플렉스 간판',
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

    // --- 3. 영업물건 토글 (최고관리자 전용 & 담당 영업자 1명만 단독 귀속) ---
    // --- 3. 영업물건 토글 (최고관리자 전용 & 0초 즉각 반응 & 백그라운드 비동기 DB 동기화) ---
    toggleBizItem: function (appId, btnEl) {
      const active = this.getActiveUser();
      if (!this.isAdmin(active)) {
        alert('최고관리자만 영업물건으로 변경/해제할 수 있습니다.');
        return { success: false, message: '권한 없음' };
      }

      let apps = this.getApplications();
      const appIndex = apps.findIndex(a => String(a.id) === String(appId));
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
        // 영업물건 등록: 담당 영업자 1명 특정
        let targetUser = null;
        const refCode = String(app.referrerCode || app.referrer_code || '').trim().toLowerCase();
        const appUser = String(app.userId || '').trim().toLowerCase();
        const appId = String(app.id || '').trim().toLowerCase();

        if (refCode) {
          targetUser = curUsers.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            ((u.bizCode && String(u.bizCode).trim().toLowerCase() === refCode) ||
              (u.id && String(u.id).trim().toLowerCase() === refCode) ||
              (u.name && String(u.name).trim().toLowerCase() === refCode))
          );
        }
        if (!targetUser && appId) {
          targetUser = curUsers.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            u.bizCode && appId.startsWith(String(u.bizCode).trim().toLowerCase() + '-')
          );
        }
        if (!targetUser && appUser) {
          targetUser = curUsers.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            (u.id && String(u.id).trim().toLowerCase() === appUser)
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
        const bizItem = {
          id: String(app.id),
          name: app.storeName || app.shopName || app.ownerName || '영업물건',
          phone: app.ownerPhone || app.phone || '',
          address: app.storeAddress || app.address || '',
          photosCount: photosList.length,
          receiptStatus: app.receiptStatus || '접수예정',
          progressStatus: (app.status === 'approved' ? '승인 완료' : (app.status === 'rejected' ? '반려됨' : (app.status === 'giveup' ? '지원사업 포기' : '지원대기중'))),
          photos: photosList,
          appRefId: String(app.id)
        };

        curUsers = curUsers.map(u => {
          const isTarget = targetUser && u.id === targetUser.id;
          const isAdmin = u.role === 'admin';
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
        // 영업물건 해제
        const targetStore = (app.storeName || app.shopName || app.name || '').trim().toLowerCase();
        const targetOwner = (app.ownerName || '').trim().toLowerCase();
        const targetPhone = (app.ownerPhone || app.phone || '').replace(/[^0-9]/g, '');

        curUsers = curUsers.map(u => {
          if (u.items && u.items.length > 0) {
            const filteredItems = u.items.filter(it => {
              const matchId = String(it.id) === String(app.id);
              const matchAppRef = String(it.appRefId) === String(app.id);
              const itName = (it.name || it.storeName || '').trim().toLowerCase();
              const matchStore = targetStore && itName && (itName === targetStore || itName.includes(targetStore) || targetStore.includes(itName));
              const matchOwner = targetOwner && it.ownerName && it.ownerName.trim().toLowerCase() === targetOwner;
              const itPhone = (it.phone || it.ownerPhone || '').replace(/[^0-9]/g, '');
              const matchPhone = targetPhone && itPhone && (itPhone === targetPhone || targetPhone.includes(itPhone) || itPhone.includes(targetPhone));

              const isMatch = matchId || matchAppRef || (matchStore && (matchOwner || matchPhone));
              return !isMatch;
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

      // 3) 전체 대시보드 화면 0초 즉각 브로드캐스트 (알림 전 UI 먼저 갱신)
      this.notifyAll();

      // 4) Supabase DB 완전 비동기 백그라운드 저장 (Non-blocking)
      (async () => {
        try {
          if (window.supabaseClient) {
            await window.supabaseClient.from('applications').update({
              memo: JSON.stringify({ isBizItem: isNowBizItem, receiptStatus: app.receiptStatus || '접수예정' }),
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
      if (isNowBizItem) {
        alert('[' + storeLabel + '] 건이 영업물건으로 변경되었습니다.\n공단/진흥원 접수 및 담당 영업자 대시보드로 실시간 연동됩니다.');
      } else {
        alert('[' + storeLabel + '] 건의 영업물건 등록이 해제되었습니다.\n영업물건 진행상황 및 영업자 대시보드에서 즉시 제외됩니다.');
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

      // 1) users.items 내 모든 매칭 항목 갱신 (uid 불일치 시에도 itemId/appRefId로 전수 탐색)
      users = users.map(u => {
        if (u.items && Array.isArray(u.items)) {
          let userItemModified = false;
          const updatedItems = u.items.map(item => {
            const isMatch = String(item.id) === targetIdStr || 
                            (item.appRefId && String(item.appRefId) === targetIdStr) || 
                            (uid && String(u.id) === String(uid) && String(item.id) === targetIdStr);
            if (isMatch) {
              userItemModified = true;
              if (type === 'receipt') {
                targetItem = { ...item, receiptStatus: cleanVal };
              } else {
                targetItem = { ...item, progressStatus: cleanVal };
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

      // 2) applications 내 매칭 항목 갱신
      apps = apps.map(app => {
        const isMatch = String(app.id) === targetIdStr || 
                        (targetItem && targetItem.appRefId && String(app.id) === String(targetItem.appRefId));
        if (isMatch) {
          if (type === 'receipt') {
            app.receiptStatus = cleanVal;
          } else {
            app.progressStatus = cleanVal;
            if (cleanVal === '대상자선정' || cleanVal === '간판시공 준비중' || cleanVal === '간판시공완료') {
              app.status = 'approved';
              app.constructionStatus = (cleanVal === '간판시공완료' ? 'completed' : (cleanVal === '간판시공 준비중' ? 'in_construction' : 'before_construction'));
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
          targetApp = app;
        }
        return app;
      });

      // 3) 만약 users.items에 아직 없었지만 영업자가 지정된 신청서인 경우, 영업자의 items에도 자동 생성/갱신
      if (targetApp && updatedUserIds.length === 0) {
        const refCode = String(targetApp.referrerCode || '').trim().toLowerCase();
        const appUser = String(targetApp.userId || '').trim().toLowerCase();
        let assignedUser = users.find(u =>
          (u.role === 'business' || u.role === 'admin') &&
          ((u.bizCode && String(u.bizCode).trim().toLowerCase() === refCode) ||
            (u.id && String(u.id).trim().toLowerCase() === refCode) ||
            (u.name && String(u.name).trim().toLowerCase() === refCode) ||
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
            assignedUser.items.push(newItemData);
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
            if (targetApp) {
              await window.SupabaseSync.upsertApplication(targetApp);
            }
            for (const uId of updatedUserIds) {
              const uObj = users.find(u => u.id === uId);
              if (uObj) {
                await window.SupabaseSync.updateUser(uId, { items: uObj.items || [] });
              }
            }
          }
        } catch (err) {
          console.warn('[DataStore] updateItemStatus sync notice:', err);
        }
      })();

      // 5) 모든 대시보드 화면 0초 즉시 동기화
      this.notifyAll();
      return { success: true };
    },

    // --- 3-3. 신청서 담당 영업자 지정 / 변경 (최고관리자 권한) ---
    updateApplicationReferrer: function (appId, newBizCode) {
      if (!appId) return { success: false, error: '유효하지 않은 신청서입니다.' };
      const targetId = String(appId).trim();
      const codeVal = newBizCode ? String(newBizCode).trim() : '';

      let apps = this.getApplications();
      const targetApp = apps.find(a => String(a.id) === targetId);
      if (!targetApp) return { success: false, error: '해당 신청서를 찾을 수 없습니다.' };

      // 1) 신청서 referrerCode 갱신 및 영업자 정보 동기화
      targetApp.referrerCode = codeVal;
      targetApp.referrer_code = codeVal;
      if (codeVal) {
        const users = this.getUsers();
        const salesUser = users.find(u =>
          (u.role === 'business' || u.role === 'admin') &&
          ((u.bizCode && String(u.bizCode).trim().toLowerCase() === codeVal.toLowerCase()) ||
            (u.id && String(u.id).trim().toLowerCase() === codeVal.toLowerCase()))
        );
        if (salesUser) {
          targetApp.salespersonId = salesUser.id;
          targetApp.salespersonName = salesUser.name;
        }
      }
      targetApp.updatedAt = new Date().toISOString();

      this.saveApplications(apps);

      // 2) Supabase 비동기 클라우드 DB 저장 (Non-blocking)
      if (window.SupabaseSync && typeof window.SupabaseSync.upsertApplication === 'function') {
        window.SupabaseSync.upsertApplication(targetApp).catch(() => {});
      }

      // 3) 6개 화면 실시간 동기화
      this.notifyAll();
      return { success: true, app: targetApp };
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
        if (card) card.remove();
      }

      // 2) deleted_application_ids 등록 및 로컬/클라우드 영구 동기화
      let deletedAppIds = this.getDeletedAppIds();
      if (!deletedAppIds.includes(targetId)) {
        deletedAppIds.push(targetId);
        localStorage.setItem('deleted_application_ids', JSON.stringify(deletedAppIds));
      }

      // 3) applications 배열에서 영구 제거
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

      // 2) users 배열에서 직접 제거
      let rawUsers = JSON.parse(localStorage.getItem('users')) || [];
      const targetUser = rawUsers.find(u => String(u.id).toLowerCase() === targetLower);
      const targetPhone = targetUser ? String(targetUser.phone || '').trim() : '';

      rawUsers = rawUsers.filter(u => u && u.id && String(u.id).toLowerCase() !== targetLower);
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

    // --- 6. 신청서 상태 변경 ---
    updateApplicationStatus: function (appId, newStatus) {
      let apps = this.getApplications();
      const appIndex = apps.findIndex(a => String(a.id) === String(appId));
      if (appIndex === -1) return { success: false };

      const app = apps[appIndex];
      app.status = newStatus;
      apps[appIndex] = app;
      this.saveApplications(apps);

      if (window.SupabaseSync) {
        window.SupabaseSync.upsertApplication(app);
      }

      this.notifyAll();
      return { success: true, status: newStatus };
    },

    // --- 7. 3초 간편문의 (Inquiries) 통합 관리 엔진 ---
    getDeletedInquiryIds: function () {
      try {
        return JSON.parse(localStorage.getItem('deleted_inquiry_ids')) || [];
      } catch (e) {
        return [];
      }
    },

    getInquiries: function () {
      try {
        const inqs = JSON.parse(localStorage.getItem('inquiries')) || [];
        const deletedIds = this.getDeletedInquiryIds();
        return inqs.filter(i => i && i.id && !deletedIds.includes(String(i.id)));
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
      let deletedIds = this.getDeletedInquiryIds();
      if (!deletedIds.includes(String(targetId))) {
        deletedIds.push(String(targetId));
        localStorage.setItem('deleted_inquiry_ids', JSON.stringify(deletedIds));
      }

      inqs = inqs.filter(i => String(i.id) !== String(targetId));
      this.saveInquiries(inqs);

      if (window.SupabaseSync && typeof window.SupabaseSync.deleteInquiry === 'function') {
        window.SupabaseSync.deleteInquiry(targetId);
      }

      this.notifyAll();
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

    // --- 8. 전체 대시보드 화면 동기화 브로드캐스트 (0초 반응) ---
    notifyAll: function (force = false) {
      try {
        // 사용자가 드롭다운(SELECT)이나 텍스트입력(INPUT)을 조작 중일 때는 전체 DOM 재생성을 스킵하여 드롭다운 닫힘 방지 (force인 경우 강제 실행)
        if (!force) {
          const activeEl = typeof document !== 'undefined' ? document.activeElement : null;
          const isFormActive = window.isInteractingWithForm || (activeEl && (activeEl.tagName === 'SELECT' || (activeEl.tagName === 'INPUT' && activeEl.type !== 'submit') || activeEl.tagName === 'TEXTAREA'));
          if (isFormActive) {
            return;
          }
        }

        if (typeof window.renderApplicationsList === 'function') window.renderApplicationsList();
        if (typeof window.renderManagerPanel === 'function') window.renderManagerPanel();
        if (typeof window.renderBizRegisteredTable === 'function') window.renderBizRegisteredTable();
        if (typeof window.renderBusinessDashboard === 'function') window.renderBusinessDashboard();
        if (typeof window.renderAllUsersList === 'function') window.renderAllUsersList();
        if (typeof window.renderInquiriesList === 'function') window.renderInquiriesList();
        if (typeof window.renderManagerConstProgress === 'function') window.renderManagerConstProgress();
        if (typeof window.renderConstructorDashboard === 'function') window.renderConstructorDashboard();
        if (typeof window.renderAdminDashboardMob === 'function') window.renderAdminDashboardMob(true);
        if (typeof window.renderConstructorDashboardMob === 'function') window.renderConstructorDashboardMob(true);
        if (typeof window.renderBusinessDashboardMob === 'function') window.renderBusinessDashboardMob();
        if (typeof window.renderBizRegisteredItemsMob === 'function') window.renderBizRegisteredItemsMob();
        if (typeof window.renderUserApplicationsList === 'function') window.renderUserApplicationsList();
        if (typeof window.renderUserApplicationsMob === 'function') window.renderUserApplicationsMob();

        // 전역 실시간 브로드캐스트 발화
        window.dispatchEvent(new CustomEvent('supabase-data-synced'));
      } catch (e) {
        console.error('[DataStore] notifyAll error:', e);
      }
    }
  };

  // 전역 노출
  window.DataStore = DataStore;

  // 레거시 전역 핸들러 브릿지 (기존 onclick 속성 호환 100% 보장)
  window.toggleBizItem = function (appId, btnEl) {
    return window.DataStore.toggleBizItem(appId);
  };
  window.toggleBizItemMob = function (appId, btnEl) {
    return window.DataStore.toggleBizItem(appId);
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
    const deletedIds = (window.DataStore ? window.DataStore.getDeletedUserIds() : (JSON.parse(localStorage.getItem('deleted_user_ids')) || []));
    
    // 승인된 영업자 목록 추출 (시공사 전용 회원은 배제하고, 영업자 코드 보유자 및 영업자만 정밀 추출)
    const bizUsers = allUsers.filter(u => {
      if (!u || !u.id) return false;
      if (deletedIds.includes(String(u.id))) return false;
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
              <button type="button" id="btn-confirm-assign-bizuser" style="flex: 2; padding: 12px; font-size: 0.95rem; font-weight: 700; background: #2563eb; color: #ffffff; border: none; border-radius: 8px; cursor: pointer; box-shadow: 0 4px 12px rgba(37,99,235,0.3);">저장 및 배정 완료</button>
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

    const confirmBtn = document.getElementById('btn-confirm-assign-bizuser');
    if (confirmBtn) {
      confirmBtn.addEventListener('click', () => {
        const selectEl = document.getElementById('modal-select-bizuser');
        const selectedCode = selectEl ? selectEl.value : '';
        const selectedText = selectEl ? selectEl.options[selectEl.selectedIndex].text : '';

        if (window.DataStore && typeof window.DataStore.updateApplicationReferrer === 'function') {
          window.DataStore.updateApplicationReferrer(targetId, selectedCode);
        } else {
          // Fallback
          const curApps = JSON.parse(localStorage.getItem('applications')) || [];
          const t = curApps.find(a => String(a.id) === targetId);
          if (t) {
            t.referrerCode = selectedCode;
            t.referrer_code = selectedCode;
            localStorage.setItem('applications', JSON.stringify(curApps));
            if (window.SupabaseSync) window.SupabaseSync.upsertApplication(t);
          }
        }

        const modalEl = document.getElementById('assign-bizuser-modal');
        if (modalEl) modalEl.remove();

        alert(`[${app.shopName || app.storeName || targetId}]의 담당 영업자가 '${selectedText}'(으)로 변경되었습니다.\n영업자 및 시공업체 화면에 실시간 동시 반영됩니다.`);

        // Re-render
        if (typeof window.renderApplicationsList === 'function') window.renderApplicationsList();
        if (typeof window.renderAdminDashboard === 'function') window.renderAdminDashboard();
        if (typeof window.renderAdminDashboardMob === 'function') window.renderAdminDashboardMob();
        if (typeof window.renderStatusTab === 'function') window.renderStatusTab();
      });
    }
  };
  window.openAssignBizUserModalMob = window.openAssignBizUserModal;

  // --- 공통 간판 종류 변경 핸들러 (PC웹 & 모바일 공용) ---
  window.updateJobSignType = function (id, signType) {
    const trimmed = String(signType || '').trim();
    if (!trimmed) return;

    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    let curUsers = JSON.parse(localStorage.getItem('users')) || [];
    let updatedUid = null;

    apps = apps.map(a => {
      if (String(a.id) === String(id)) {
        return { ...a, signType: trimmed };
      }
      return a;
    });
    localStorage.setItem('applications', JSON.stringify(apps));

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
    localStorage.setItem('users', JSON.stringify(curUsers));

    if (window.SupabaseSync) {
      const app = apps.find(a => String(a.id) === String(id));
      if (app) window.SupabaseSync.upsertApplication(app);
      if (updatedUid) {
        const u = curUsers.find(usr => usr.id === updatedUid);
        if (u) window.SupabaseSync.updateUser(updatedUid, { items: u.items || [] });
      }
    }
    if (window.DataStore) window.DataStore.notifyAll();
  };

  // --- 공통 간판 디자인 시안 확정 토글 핸들러 (PC웹 & 모바일 공용) ---
  window.toggleDraftApproval = function (id, newDraftStatus) {
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    let curUsers = JSON.parse(localStorage.getItem('users')) || [];
    let updatedUid = null;
    const approvedTime = (newDraftStatus === 'admin_approved' || newDraftStatus === 'owner_approved') ? new Date().toISOString() : null;

    apps = apps.map(a => {
      if (String(a.id) === String(id)) {
        return { ...a, draftStatus: newDraftStatus, draftApprovedAt: approvedTime };
      }
      return a;
    });
    localStorage.setItem('applications', JSON.stringify(apps));

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
    localStorage.setItem('users', JSON.stringify(curUsers));

    if (window.SupabaseSync) {
      const app = apps.find(a => String(a.id) === String(id));
      if (app) window.SupabaseSync.upsertApplication(app);
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

    if (window.DataStore) window.DataStore.notifyAll();
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
