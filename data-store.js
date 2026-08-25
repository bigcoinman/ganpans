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
        const deletedAppIds = this.getDeletedAppIds();
        return apps.filter(a => a && a.id && !deletedAppIds.includes(String(a.id)));
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
        const users = JSON.parse(localStorage.getItem('users')) || [];
        const deletedUserIds = this.getDeletedUserIds();
        return users.filter(u => {
          if (!u || !u.id) return false;
          const uId = String(u.id);
          const uDigits = uId.replace(/[^0-9]/g, '');
          const uPhoneDigits = String(u.phone || '').replace(/[^0-9]/g, '');
          if (deletedUserIds.includes(uId)) return false;
          if (uDigits && deletedUserIds.includes(uDigits)) return false;
          if (uPhoneDigits && deletedUserIds.includes(uPhoneDigits)) return false;
          return true;
        });
      } catch (e) {
        console.error('[DataStore] getUsers error:', e);
        return [];
      }
    },

    saveUsers: function (users) {
      try {
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

    // --- 2. 영업물건 전용 데이터 조회 (최고관리자 대시보드 절대 SSOT 기반) ---
    getBizItemsForUser: function (targetUser) {
      const user = targetUser || this.getActiveUser();
      if (!user) return [];

      const apps = this.getApplications();
      const deletedBizIds = this.getDeletedBizItemIds();
      const bizList = [];

      const isPurged = (it) => {
        if (!it) return false;
        const itId = String(it.id || '').trim();
        const itRef = String(it.appRefId || '').trim();
        return deletedBizIds.includes(itId) || deletedBizIds.includes(itRef);
      };

      const myBizCode = String(user.bizCode || '').trim().toLowerCase();
      const myUserId = String(user.id || '').trim().toLowerCase();
      const myUserName = String(user.name || '').trim().toLowerCase();
      const myPhone = String(user.phone || '').replace(/[^0-9]/g, '');

      // 오직 applications 중 최고관리자가 isBizItem: true 로 승인한 실존 건만 수집 (부존재 일치 100%)
      apps.forEach(app => {
        if (isPurged(app)) return;
        const isApprovedBizItem = Boolean(app.isBizItem === true || String(app.isBizItem) === 'true');
        if (!isApprovedBizItem) return;

        const refCode = String(app.referrerCode || '').trim().toLowerCase();
        const appUser = String(app.userId || '').trim().toLowerCase();
        const appOwner = String(app.ownerName || '').trim().toLowerCase();
        const appPhone = String(app.ownerPhone || '').replace(/[^0-9]/g, '');

        const isMyReferrer = (myBizCode && refCode === myBizCode) || (myUserId && refCode === myUserId) || (myUserName && refCode === myUserName);
        const isMyUser = (myUserId && appUser === myUserId);
        const isMyPhone = (myPhone && appPhone && myPhone === appPhone);
        const isMyName = (myUserName && appOwner && myUserName === appOwner);

        // 최고관리자는 전체 조회, 영업자는 오직 본인 귀속 건만 조회
        if (this.isAdmin(user) || isMyReferrer || isMyUser || isMyPhone || isMyName) {
          if (!bizList.some(b => String(b.id) === String(app.id))) {
            let matchedItem = null;
            const allUsers = this.getUsers();
            for (const u of allUsers) {
              if (u.items && Array.isArray(u.items)) {
                const found = u.items.find(it => String(it.id) === String(app.id) || String(it.appRefId) === String(app.id));
                if (found) {
                  matchedItem = found;
                  break;
                }
              }
            }

            const rStatus = (matchedItem && matchedItem.receiptStatus) || app.receiptStatus || '접수예정';
            const pStatus = (matchedItem && matchedItem.progressStatus) || app.progressStatus || (app.constructionStatus && app.constructionStatus !== 'none' ? app.constructionStatus : null) || '지원대기중';

            bizList.push({
              id: app.id,
              date: app.appliedAt || app.createdAt || new Date().toISOString(),
              ownerName: app.ownerName || app.name || '-',
              ownerPhone: app.ownerPhone || app.phone || '',
              storeName: app.storeName || app.shopName || app.name || '-',
              storeAddress: app.storeAddress || app.address || '',
              statusObj: app,
              receiptStatus: rStatus,
              progressStatus: pStatus
            });
          }
        }
      });

      return bizList;
    },

    // --- 최고관리자 전용 전체 영업물건 진행상황 목록 (isBizItem: false 건은 100% 완전 제외) ---
    getAdminBizItems: function () {
      const apps = this.getApplications();
      const users = this.getUsers();
      const deletedBizIds = this.getDeletedBizItemIds();
      const allItems = [];

      const isPurged = (it) => {
        if (!it) return false;
        const itId = String(it.id || '').trim();
        const itRef = String(it.appRefId || '').trim();
        return deletedBizIds.includes(itId) || deletedBizIds.includes(itRef);
      };

      // 1) applications 중 isBizItem: true 인 건 수집
      apps.forEach(app => {
        if (isPurged(app)) return;
        const isApprovedBizItem = Boolean(app.isBizItem === true || String(app.isBizItem) === 'true');
        if (!isApprovedBizItem) return; // 비활성화 건은 절대 제외!

        // 담당 영업자 찾기
        let assignedUser = null;
        const refCode = String(app.referrerCode || '').trim().toLowerCase();
        const appUser = String(app.userId || '').trim().toLowerCase();
        if (refCode) {
          assignedUser = users.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            ((u.bizCode && String(u.bizCode).trim().toLowerCase() === refCode) ||
              (u.id && String(u.id).trim().toLowerCase() === refCode) ||
              (u.name && String(u.name).trim().toLowerCase() === refCode))
          );
        }
        if (!assignedUser && appUser) {
          assignedUser = users.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            (u.id && String(u.id).trim().toLowerCase() === appUser)
          );
        }

        let matchedItem = null;
        for (const u of users) {
          if (u.items && Array.isArray(u.items)) {
            const found = u.items.find(it => String(it.id) === String(app.id) || String(it.appRefId) === String(app.id));
            if (found) {
              matchedItem = found;
              break;
            }
          }
        }

        const rStatus = (matchedItem && matchedItem.receiptStatus) || app.receiptStatus || '접수예정';
        const pStatus = (matchedItem && matchedItem.progressStatus) || app.progressStatus || (app.constructionStatus && app.constructionStatus !== 'none' ? app.constructionStatus : null) || '지원대기중';

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
          assignedConstructorId: app.assignedConstructorId || (matchedItem && matchedItem.assignedConstructorId) || '',
          assignedConstructorName: app.assignedConstructorName || (matchedItem && matchedItem.assignedConstructorName) || ''
        };

        allItems.push({
          user: assignedUser || { id: 'admin', name: '최고관리자', role: 'admin', bizCode: 'ADMIN' },
          item: itemObj
        });
      });

      // 2) users.items 중에서도 applications와 대조하여 isBizItem === false 인 건은 100% 제외
      users.forEach(u => {
        if (u.role === 'business' && u.items && u.items.length > 0) {
          u.items.forEach(item => {
            if (isPurged(item)) return;
            const matchingApp = apps.find(a => String(a.id) === String(item.id) || String(a.id) === String(item.appRefId));
            if (matchingApp && (matchingApp.isBizItem === false || String(matchingApp.isBizItem) === 'false')) {
              return; // 관리자가 해제한 건은 절대 표시하지 않음!
            }
            if (!allItems.some(entry => String(entry.item.id) === String(item.id) || (item.appRefId && String(entry.item.id) === String(item.appRefId)))) {
              allItems.push({
                user: u,
                item: item
              });
            }
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

    // --- 시공업체 진행현황 실존 목록 단일 진실의 원천(SSOT) 수집 함수 ---
    getConstructionJobs: function () {
      const apps = this.getApplications();
      const curUsers = this.getUsers();
      const allConstJobs = [];

      // 1) From users' items (영업물건)
      curUsers.forEach(u => {
        if (u.items && Array.isArray(u.items)) {
          u.items.forEach(item => {
            const matchingApp = apps.find(a => String(a.id) === String(item.id) || (item.appRefId && String(a.id) === String(item.appRefId)));
            const pStatus = String(item.progressStatus || (matchingApp && (matchingApp.progressStatus || matchingApp.constructionStatus)) || '').trim();
            const cStatus = String(item.constructionStatus || (matchingApp && matchingApp.constructionStatus)) || '').trim();

            // 오직 '대상자선정', '간판시공 준비중', '간판시공완료' 또는 시공 진행/완료인 건만 허용
            const isEligible = (
              pStatus === '대상자선정' || pStatus === '간판시공 준비중' || pStatus === '간판시공완료' ||
              cStatus === 'in_construction' || cStatus === 'completed' || cStatus === '간판시공 준비중' || cStatus === '간판시공완료'
            ) && (
              pStatus !== '지원대기중' && pStatus !== '심사대기' && pStatus !== '서류제출 & 접수예정' &&
              pStatus !== '서류 보완 필요' && pStatus !== '반려됨' && pStatus !== '지원사업 포기' && pStatus !== '지원사업 탈락'
            );

            if (isEligible) {
              let cName = item.assignedConstructorName || '';
              let cCode = '';
              let cPhone = '';
              if (item.assignedConstructorId) {
                const cu = curUsers.find(x => x.id === item.assignedConstructorId || x.constCode === item.assignedConstructorId);
                if (cu) {
                  cName = cu.businessName || cu.pendingBusinessName || cu.name || cu.id;
                  cCode = cu.constCode || '';
                  cPhone = cu.phone || '';
                } else {
                  cName = item.assignedConstructorName || item.assignedConstructorId;
                }
              }
              allConstJobs.push({
                id: item.id,
                isBizItemJob: true,
                bizItemOwnerId: u.id,
                bizOwnerName: u.name,
                storeName: item.name || (matchingApp && matchingApp.storeName) || '-',
                ownerName: `${u.name} (영업자)`,
                ownerPhone: item.phone || (matchingApp && (matchingApp.ownerPhone || matchingApp.phone)) || u.phone || '-',
                storeAddress: item.address || (matchingApp && matchingApp.storeAddress) || '-',
                signType: item.signType || (matchingApp && matchingApp.signType) || '플렉스 간판',
                assignedConstructorId: item.assignedConstructorId || '',
                assignedConstructorName: cName || '미배정',
                assignedConstructorCode: cCode,
                assignedConstructorPhone: cPhone,
                progressStatus: pStatus,
                constructionStatus: item.constructionStatus || (matchingApp && matchingApp.constructionStatus) || (pStatus === '간판시공완료' ? 'completed' : (pStatus === '간판시공 준비중' ? 'in_construction' : (pStatus === '간판 디자인 시안 및 교정 중' ? 'design_draft' : 'before_construction'))),
                signDraftPhotos: item.signDraftPhotos || (matchingApp && matchingApp.signDraftPhotos) || (item.designPhotos || (matchingApp && matchingApp.designPhotos) || []),
                draftStatus: item.draftStatus || (matchingApp && matchingApp.draftStatus) || 'pending',
                draftApprovedAt: item.draftApprovedAt || (matchingApp && matchingApp.draftApprovedAt) || null,
                constructionPhotos: item.constructionPhotos || (matchingApp && matchingApp.constructionPhotos) || (item.afterPhotos || (matchingApp && matchingApp.afterPhotos) || []),
                createdAt: item.assignedAt || item.createdAt || new Date().toISOString()
              });
            }
          });
        }
      });

      // 2) From applications (온라인 신청서)
      apps.forEach(app => {
        const pStatus = String(app.progressStatus || app.constructionStatus || '').trim();
        const cStatus = String(app.constructionStatus || '').trim();

        const isEligible = (
          pStatus === '대상자선정' || pStatus === '간판시공 준비중' || pStatus === '간판시공완료' ||
          cStatus === 'in_construction' || cStatus === 'completed' || cStatus === '간판시공 준비중' || cStatus === '간판시공완료'
        ) && (
          pStatus !== '지원대기중' && pStatus !== '심사대기' && pStatus !== '서류제출 & 접수예정' &&
          pStatus !== '서류 보완 필요' && pStatus !== '반려됨' && pStatus !== '지원사업 포기' && pStatus !== '지원사업 탈락'
        );

        if (isEligible) {
          if (!allConstJobs.some(j => String(j.id) === String(app.id))) {
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
            allConstJobs.push({
              id: app.id,
              isBizItemJob: false,
              bizItemOwnerId: null,
              bizOwnerName: app.referrerCode || '본사접수',
              storeName: app.storeName || '-',
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
            });
          }
        }
      });

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
        const refCode = String(app.referrerCode || '').trim().toLowerCase();
        const appUser = String(app.userId || '').trim().toLowerCase();

        if (refCode) {
          targetUser = curUsers.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            ((u.bizCode && String(u.bizCode).trim().toLowerCase() === refCode) ||
              (u.id && String(u.id).trim().toLowerCase() === refCode) ||
              (u.name && String(u.name).trim().toLowerCase() === refCode))
          );
        }
        if (!targetUser && appUser) {
          targetUser = curUsers.find(u =>
            (u.role === 'business' || u.role === 'admin') &&
            (u.id && String(u.id).trim().toLowerCase() === appUser)
          );
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

    // --- 4. 온라인 간편 지원 신청서 영구 삭제 ---
    deleteApplication: function (appId, btnEl) {
      if (!appId) return { success: false };
      const targetId = String(appId);

      if (!confirm('[주의] 지원 신청 접수 건 [' + targetId + ']을(를) 정말로 영구 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.')) {
        return { success: false, cancelled: true };
      }

      // 1) 0초 즉각 DOM 요소 제거 (낙관적 UI)
      if (btnEl) {
        const card = btnEl.closest('tr') || btnEl.closest('.admin-app-card') || btnEl.closest('div[style*="border"]');
        if (card) card.remove();
      }

      // 2) deleted_application_ids 등록
      let deletedAppIds = this.getDeletedAppIds();
      if (!deletedAppIds.includes(targetId)) {
        deletedAppIds.push(targetId);
        localStorage.setItem('deleted_application_ids', JSON.stringify(deletedAppIds));
      }

      // 3) applications 배열에서 영구 제거
      let apps = this.getApplications();
      apps = apps.filter(a => String(a.id) !== targetId);
      this.saveApplications(apps);

      // 4) users.items 에서도 연계 물건 영구 제거
      let users = this.getUsers();
      users = users.map(u => {
        if (u.items && u.items.length > 0) {
          const cleanedItems = u.items.filter(it => String(it.id) !== targetId && String(it.appRefId) !== targetId);
          if (cleanedItems.length !== u.items.length) {
            if (window.SupabaseSync) window.SupabaseSync.updateUser(u.id, { items: cleanedItems });
          }
          return { ...u, items: cleanedItems };
        }
        return u;
      });
      this.saveUsers(users);

      // 5) Supabase DB 영구 삭제
      if (window.SupabaseSync) {
        window.SupabaseSync.deleteApplication(targetId);
      }

      alert('지원 신청 접수 건 [' + targetId + ']이(가) 정상적으로 영구 삭제되었습니다.');
      this.notifyAll();
      return { success: true };
    },

    // --- 5. 회원 영구 탈퇴/삭제 ---
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
        if (row) row.remove();
      }

      // 대상 회원의 전화번호 등 추가 식별자 확보
      let rawUsers = JSON.parse(localStorage.getItem('users')) || [];
      const targetUser = rawUsers.find(u => 
        String(u.id).toLowerCase() === targetLower
      );
      const targetPhone = targetUser ? String(targetUser.phone || '').trim() : '';
      const cleanPhoneDigits = (targetPhone.length >= 9) ? targetPhone.replace(/[^0-9]/g, '') : '';
      const cleanTargetDigits = (targetId.startsWith('01') && targetId.replace(/[^0-9]/g, '').length >= 9) ? targetId.replace(/[^0-9]/g, '') : '';

      // 2) deleted_user_ids 등록 (대소문자 모두 등록)
      let deletedUserIds = this.getDeletedUserIds();
      [targetId, targetLower, cleanTargetDigits, targetPhone, cleanPhoneDigits].filter(Boolean).forEach(id => {
        if (!deletedUserIds.includes(String(id))) {
          deletedUserIds.push(String(id));
        }
      });
      localStorage.setItem('deleted_user_ids', JSON.stringify(deletedUserIds));

      // 3) users 배열에서 완전 제거
      rawUsers = rawUsers.filter(u => {
        if (!u || !u.id) return false;
        const uId = String(u.id);
        const uIdLower = uId.toLowerCase();
        const uPhone = String(u.phone || '');
        const uPhoneDigits = (uPhone.length >= 9) ? uPhone.replace(/[^0-9]/g, '') : '';
        if (uIdLower === targetLower) return false;
        if (cleanTargetDigits && uId === cleanTargetDigits) return false;
        if (cleanPhoneDigits && uPhoneDigits === cleanPhoneDigits) return false;
        if (deletedUserIds.includes(uId) || deletedUserIds.includes(uIdLower)) return false;
        return true;
      });
      this.saveUsers(rawUsers);

      // 3.5) 현재 로그인 세션이 삭제된 회원이면 즉시 세션 파기
      const active = this.getActiveUser();
      if (active) {
        const actId = String(active.id || '').toLowerCase();
        if (actId === targetLower || deletedUserIds.includes(actId)) {
          this.setActiveUser(null);
          if (typeof clearActiveUser === 'function') clearActiveUser();
        }
      }

      // 4) Supabase DB 영구 삭제 (비밀번호 파기 및 DB 삭제)
      if (window.SupabaseSync) {
        window.SupabaseSync.deleteUser(targetId, targetPhone);
      }

      alert('회원 [' + targetId + ']이(가) 정상적으로 탈퇴/삭제되었습니다.');
      this.notifyAll();
      return { success: true };
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
      this.notifyAll();
      return { success: true };
    },

    // --- 8. 전체 대시보드 화면 동기화 브로드캐스트 (0초 반응) ---
    notifyAll: function () {
      try {
        if (typeof window.renderApplicationsList === 'function') window.renderApplicationsList();
        if (typeof window.renderManagerPanel === 'function') window.renderManagerPanel();
        if (typeof window.renderBizRegisteredTable === 'function') window.renderBizRegisteredTable();
        if (typeof window.renderBusinessDashboard === 'function') window.renderBusinessDashboard();
        if (typeof window.renderAllUsersList === 'function') window.renderAllUsersList();
        if (typeof window.renderInquiriesList === 'function') window.renderInquiriesList();
        if (typeof window.renderAdminDashboardMob === 'function') window.renderAdminDashboardMob(true);
        if (typeof window.renderBusinessDashboardMob === 'function') window.renderBusinessDashboardMob();
        if (typeof window.renderBizRegisteredItemsMob === 'function') window.renderBizRegisteredItemsMob();
        if (typeof window.renderUserApplicationsList === 'function') window.renderUserApplicationsList();
        if (typeof window.renderUserApplicationsMob === 'function') window.renderUserApplicationsMob();
        if (typeof window.updateSessionUI === 'function') window.updateSessionUI();

        window.dispatchEvent(new Event('supabase-data-synced'));
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
  window.deleteApplicationAdmin = function (appId, btnEl) {
    return window.DataStore.deleteApplication(appId, btnEl);
  };
  window.deleteApplicationAdminMob = function (appId, btnEl) {
    return window.DataStore.deleteApplication(appId, btnEl);
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
})();
