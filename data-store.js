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
        return users.filter(u => u && u.id && !deletedUserIds.includes(String(u.id)));
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
            bizList.push({
              id: app.id,
              date: app.appliedAt || app.createdAt || new Date().toISOString(),
              ownerName: app.ownerName || app.name || '-',
              ownerPhone: app.ownerPhone || app.phone || '',
              storeName: app.storeName || app.shopName || app.name || '-',
              storeAddress: app.storeAddress || app.address || '',
              statusObj: app
            });
          }
        }
      });

      return bizList;
    },

    // --- 최고관리자 전용 전체 영업물건 진행사항 목록 (isBizItem: false 건은 100% 완전 제외) ---
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

        const photosList = (app.photos && app.photos.length > 0) ? app.photos : (app.fileData ? [app.fileData] : []);
        const itemObj = {
          id: String(app.id),
          appRefId: String(app.id),
          name: app.storeName || app.shopName || app.ownerName || '영업물건',
          phone: app.ownerPhone || app.phone || '',
          address: app.storeAddress || app.address || '',
          photosCount: photosList.length,
          receiptStatus: app.receiptStatus || '접수예정',
          progressStatus: (app.status === 'approved' ? '승인 완료' : (app.status === 'rejected' ? '반려됨' : (app.status === 'giveup' ? '지원사업 포기' : '지원대기중'))),
          photos: photosList,
          registeredAt: app.appliedAt || app.createdAt || new Date().toISOString(),
          assignedConstructorId: app.assignedConstructorId || '',
          assignedConstructorName: app.assignedConstructorName || ''
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
        alert('[' + storeLabel + '] 건의 영업물건 등록이 해제되었습니다.\n영업물건 진행사항 및 영업자 대시보드에서 즉시 제외됩니다.');
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
      const targetId = String(userId);

      if (!confirm('[주의] 회원 ID [' + targetId + ']을(를) 정말로 강제 탈퇴/삭제 처리하시겠습니까?\n삭제 후 복구할 수 없습니다.')) {
        return { success: false, cancelled: true };
      }

      // 1) 0초 즉각 DOM 제거
      if (btnEl) {
        const row = btnEl.closest('tr') || btnEl.closest('.user-card-mob');
        if (row) row.remove();
      }

      // 2) deleted_user_ids 등록
      let deletedUserIds = this.getDeletedUserIds();
      if (!deletedUserIds.includes(targetId)) {
        deletedUserIds.push(targetId);
        localStorage.setItem('deleted_user_ids', JSON.stringify(deletedUserIds));
      }

      // 3) users 배열에서 제거
      let users = this.getUsers();
      users = users.filter(u => String(u.id) !== targetId);
      this.saveUsers(users);

      // 3.5) 현재 로그인 세션이 삭제된 회원이면 즉시 세션 파기
      const active = this.getActiveUser();
      if (active && String(active.id) === targetId) {
        this.setActiveUser(null);
      }

      // 4) Supabase DB 영구 삭제
      if (window.SupabaseSync) {
        window.SupabaseSync.deleteUser(targetId);
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

    // --- 7. 전체 대시보드 화면 동기화 브로드캐스트 (0초 반응) ---
    notifyAll: function () {
      try {
        if (typeof window.renderApplicationsList === 'function') window.renderApplicationsList();
        if (typeof window.renderManagerPanel === 'function') window.renderManagerPanel();
        if (typeof window.renderBizRegisteredTable === 'function') window.renderBizRegisteredTable();
        if (typeof window.renderBusinessDashboard === 'function') window.renderBusinessDashboard();
        if (typeof window.renderAllUsersList === 'function') window.renderAllUsersList();
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
})();
