// dashboard.js - My Page & Business Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
  // Load State from LocalStorage
  let users = JSON.parse(localStorage.getItem('users')) || [];
  let activeUser = getActiveUser() || null;

  // 상태 표준화 자동 마이그레이션 (접수 3개, 진행 5개 표준값 매핑)
  let needUsersSave = false;
  users = users.map(u => {
    if (u.items && Array.isArray(u.items)) {
      const updatedItems = u.items.map(item => {
        let r = item.receiptStatus;
        let p = item.progressStatus;
        let changed = false;

        if (!r || r === '접수 대기' || r.includes('대기')) {
          r = '접수예정';
          changed = true;
        } else if (r.includes('완료') && r !== '접수완료') {
          r = '접수완료';
          changed = true;
        }

        if (!p || p === '심사 대기' || p === '대기') {
          p = '지원대기중';
          changed = true;
        } else if (p === '서류 보완 필요') {
          p = '심사대기';
          changed = true;
        } else if (p === '서류 심사 통과' || p === '현장 실사 중' || p === '지원금 최종 승인') {
          p = '대상자선정';
          changed = true;
        } else if (p === '간판 시공 중') {
          p = '간판시공 준비중';
          changed = true;
        } else if (p === '시공 완료') {
          p = '간판시공완료';
          changed = true;
        }

        if (changed) {
          needUsersSave = true;
          return { ...item, receiptStatus: r, progressStatus: p };
        }
        return item;
      });
      return { ...u, items: updatedItems };
    }
    return u;
  });

  if (needUsersSave) {
    localStorage.setItem('users', JSON.stringify(users));
  }

  // 1. Guard for unauthorized access
  if (!activeUser) {
    alert('로그인이 필요한 페이지입니다. 홈으로 이동합니다.');
    window.location.href = 'index.html';
    return;
  }

  // DOM Elements
  const headerUserName = document.getElementById('header-user-name');
  const logoutBtn = document.getElementById('logout-btn');

  const dashboardUserName = document.getElementById('dashboard-user-name');
  const dashboardUserRole = document.getElementById('dashboard-user-role');
  const dashboardNormalView = document.getElementById('dashboard-normal-view');
  const dashboardBusinessView = document.getElementById('dashboard-business-view');
  const dashboardTitle = document.getElementById('dashboard-title');
  const dashboardSubtitle = document.getElementById('dashboard-subtitle');

  const btnRequestConversion = document.getElementById('btn-request-conversion');
  const conversionRestrictedMsg = document.getElementById('conversion-restricted-msg');
  const conversionPendingMsg = document.getElementById('conversion-pending-msg');
  const btnRequestConstructor = document.getElementById('btn-request-constructor');
  const conversionConstructorPendingMsg = document.getElementById('conversion-constructor-pending-msg');
  const dashboardConstructorView = document.getElementById('dashboard-constructor-view');
  const constructorJobsTableBody = document.getElementById('constructor-jobs-table-body');
  const constructorModal = document.getElementById('constructor-modal');
  const constructorModalClose = document.getElementById('constructor-modal-close');
  const constructorRequestForm = document.getElementById('constructor-request-form');
  const constBusinessNameInput = document.getElementById('const-business-name');
  const constLicenseNumberInput = document.getElementById('const-license-number');

  const bizItemsList = document.getElementById('biz-items-list');

  // Mobile Simulator Elements
  const mobileFileZone = document.getElementById('mobile-file-zone');
  const mobPhotosInput = document.getElementById('mob-photos-input');
  const mobPhotoPreviews = document.getElementById('mob-photo-previews');
  const mobPhotoCount = document.getElementById('mob-photo-count');
  const mobileUploadForm = document.getElementById('mobile-upload-form');
  const mobItemName = document.getElementById('mob-item-name');
  const mobItemPhone = document.getElementById('mob-item-phone');
  const mobItemAddress = document.getElementById('mob-item-address');

  // Manager Panel Elements
  const managerPanelToggle = document.getElementById('manager-panel-toggle');
  const managerPanelContent = document.getElementById('manager-panel-content');
  const managerToggleIcon = document.getElementById('manager-toggle-icon');
  const managerRequestsList = document.getElementById('manager-requests-list');
  const managerItemsList = document.getElementById('manager-items-list');
  const applicationsTableBody = document.getElementById('applications-table-body');
  const userApplicationsSection = document.getElementById('user-applications-section');
  const userApplicationsTableBody = document.getElementById('user-applications-table-body');
  const adminStatsContainer = document.getElementById('admin-stats-container');

  let selectedPhotos = [];

  // Popup Manager Elements
  let popups = JSON.parse(localStorage.getItem('popups')) || [
    {
      id: 1718000000000,
      title: "2026 경기도 노후간판 교체사업 2차 모집 공고",
      content: "경기도 소상공인 여러분!\n2026년도 노후 간판 교체 및 정비 지원 사업 2차 모집이 시작되었습니다.\n\n■ 지원 대상: 경기도 내 소상공인\n■ 지원 내용: 노후 간판 철거 및 교체 비용 최대 200만원 지원\n■ 신청 기간: ~ 2026. 08. 31까지\n\n자세한 안내는 아래 '간편 신청하기' 또는 FAQ를 참고해 주세요.",
      imageUrl: "https://picsum.photos/id/101/400/200",
      linkUrl: "#apply-section",
      startDate: "2026-07-01",
      endDate: "2026-08-31",
      width: 380,
      height: 480,
      positionTop: 120,
      positionLeft: 100,
      isActive: true
    }
  ];
  if (!localStorage.getItem('popups')) {
    localStorage.setItem('popups', JSON.stringify(popups));
  }

  // Ensure default dates exist in loaded popups
  popups = popups.map(p => {
    if (!p.startDate) p.startDate = "2026-07-01";
    if (!p.endDate) p.endDate = "2026-08-31";
    return p;
  });

  const managerPopupsList = document.getElementById('manager-popups-list');
  const managerPopupForm = document.getElementById('manager-popup-form');
  const popupIdInput = document.getElementById('popup-id');
  const popupTitleInput = document.getElementById('popup-title-input');
  const popupContentInput = document.getElementById('popup-content-input');
  const popupImageInput = document.getElementById('popup-image-input');
  const popupLinkInput = document.getElementById('popup-link-input');
  const popupStartDateInput = document.getElementById('popup-start-date-input');
  const popupEndDateInput = document.getElementById('popup-end-date-input');
  const popupWidthInput = document.getElementById('popup-width-input');
  const popupHeightInput = document.getElementById('popup-height-input');
  const popupTopInput = document.getElementById('popup-top-input');
  const popupLeftInput = document.getElementById('popup-left-input');
  const popupActiveInput = document.getElementById('popup-active-input');
  const btnPopupReset = document.getElementById('btn-popup-reset');
  const popupFormTitle = document.getElementById('popup-form-title');

  // --- Session & UI Sync ---
  const updateSessionUI = () => {
    // Reload active user details from local storage to keep DB state in sync
    const currentDbUser = users.find(u => u.id === activeUser.id);
    if (currentDbUser) {
      activeUser = sanitizeUser(currentDbUser);
      localStorage.setItem('activeUser', JSON.stringify(activeUser));
    }

    let roleText = '일반';
    if (activeUser.role === 'business') {
      roleText = '영업자';
    } else if (activeUser.role === 'constructor') {
      roleText = '시공업체';
    } else if (activeUser.role === 'admin') {
      roleText = '최고관리자';
    }
    headerUserName.textContent = `${activeUser.name}님 (${activeUser.id}) (${roleText})`;

    // Check Role and adjust UI visibility
    const dashboardGrid = document.querySelector('.dashboard-grid');
    const managerAdminPanel = document.querySelector('.manager-admin-panel');
    const conversionArea = document.getElementById('conversion-area');

    if (activeUser.role === 'admin') {
      // 1. Admin Mode
      if (dashboardGrid) dashboardGrid.style.display = 'none';
      if (conversionArea) conversionArea.style.display = 'none';
      if (userApplicationsSection) userApplicationsSection.style.display = 'none';
      
      if (dashboardTitle) dashboardTitle.textContent = '최고관리자 대시보드';
      if (dashboardSubtitle) dashboardSubtitle.textContent = '최고관리자 모드입니다';
      
      if (managerAdminPanel) {
        managerAdminPanel.style.display = 'block';
        managerAdminPanel.style.border = '1px solid var(--border-color)';
        managerAdminPanel.style.background = 'var(--bg-card)';
        
        // Auto-expand content
        if (managerPanelContent) {
          managerPanelContent.classList.add('active');
        }
        
        // Adjust Header styling for admin (no toggle cursor, custom text)
        if (managerPanelToggle) {
          managerPanelToggle.style.cursor = 'default';
          const headerTitle = managerPanelToggle.querySelector('h3');
          if (headerTitle) {
            headerTitle.innerHTML = `<i class="fa-solid fa-user-shield"></i> 간판지원단 최고관리자 대시보드`;
            headerTitle.style.color = 'var(--accent-primary)';
          }
        }
        if (managerToggleIcon) {
          managerToggleIcon.style.display = 'none';
        }
      }
    } else {
      // 2. Normal/Business User Mode
      if (dashboardGrid) dashboardGrid.style.display = '';
      if (conversionArea) conversionArea.style.display = '';
      if (userApplicationsSection) userApplicationsSection.style.display = 'block';
      
      if (dashboardTitle) dashboardTitle.textContent = '마이페이지 및 영업자 대시보드';
      if (dashboardSubtitle) dashboardSubtitle.textContent = '회원님의 상태를 확인하고 영업물건 등록 및 진행 현황을 실시간으로 관리하세요.';
      
      // Completely hide manager admin panel for non-admins
      if (managerAdminPanel) {
        managerAdminPanel.style.display = 'none';
      }
    }

    // Render Dashboard & Manager Control Panel
    renderDashboard();
    renderAllUsersList();
    renderManagerPanel();
    renderPopupManager();
    renderApplicationsList();
    renderInquiriesList();
    if (activeUser.role === 'admin') {
      if (adminStatsContainer) adminStatsContainer.style.display = 'grid';
      renderAdminStats();
    } else {
      if (adminStatsContainer) adminStatsContainer.style.display = 'none';
    }
    if (activeUser.role !== 'admin') {
      renderUserApplicationsList();
    }

    // Supabase 실시간 데이터 백그라운드 동기화
    if (window.SupabaseSync) {
      window.SupabaseSync.syncAllData();
    }
  };

  // --- Supabase 실시간 양방향 데이터 동기화 리스너 ---
  window.addEventListener('supabase-data-synced', (e) => {
    users = JSON.parse(localStorage.getItem('users')) || [];
    applications = JSON.parse(localStorage.getItem('applications')) || [];
    
    // 현재 세션 유저 정보 갱신
    if (activeUser) {
      const refreshedActive = users.find(u => u.id === activeUser.id);
      if (refreshedActive) {
        activeUser = sanitizeUser(refreshedActive);
        if (localStorage.getItem('activeUser')) {
          localStorage.setItem('activeUser', JSON.stringify(activeUser));
        } else if (sessionStorage.getItem('activeUser')) {
          sessionStorage.setItem('activeUser', JSON.stringify(activeUser));
        }
      }
    }

    if (activeUser && activeUser.role === 'admin') {
      renderAllUsersList();
      renderManagerPanel();
      renderAdminStats();
      renderApplicationsList();
      renderInquiriesList();
    } else if (activeUser && activeUser.role === 'business') {
      renderBusinessDashboard();
    } else if (activeUser && activeUser.role === 'constructor') {
      renderConstructorDashboard();
    } else if (activeUser) {
      renderUserApplicationsList();
    }
  });

  const syncAdminDataFromSupabase = async () => {
    if (window.SupabaseSync) {
      await window.SupabaseSync.syncAllData();
    }
  };

  // --- Logout ---
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      clearActiveUser();
      alert('로그아웃 되었습니다.');
      window.location.href = 'index.html';
    });
  }

  // --- Render Dashboard Views ---
  const renderDashboard = () => {
    dashboardUserName.textContent = `${activeUser.name}님 (${activeUser.id})`;

    if (dashboardNormalView) dashboardNormalView.style.display = 'none';
    if (dashboardBusinessView) dashboardBusinessView.style.display = 'none';
    if (dashboardConstructorView) dashboardConstructorView.style.display = 'none';

    if (activeUser.role === 'business') {
      dashboardUserRole.textContent = `영업자 코드 (${activeUser.bizCode})`;
      dashboardUserRole.style.background = 'var(--accent-secondary)';
      if (dashboardBusinessView) dashboardBusinessView.style.display = 'block';
      renderBusinessDashboard();
    } else if (activeUser.role === 'constructor') {
      dashboardUserRole.textContent = `시공업체 코드 (${activeUser.constCode})`;
      dashboardUserRole.style.background = 'var(--accent-success)';
      if (dashboardConstructorView) dashboardConstructorView.style.display = 'block';
      renderConstructorDashboard();
    } else if (activeUser.role === 'admin') {
      dashboardUserRole.textContent = '최고관리자';
      dashboardUserRole.style.background = 'var(--grad-sunset)';
    } else {
      dashboardUserRole.textContent = '일반 회원';
      dashboardUserRole.style.background = 'var(--accent-primary)';
      if (dashboardNormalView) dashboardNormalView.style.display = 'block';

      // Conversion status
      if (activeUser.isSNS) {
        if (btnRequestConversion) btnRequestConversion.style.display = 'none';
        if (btnRequestConstructor) btnRequestConstructor.style.display = 'none';
        if (conversionRestrictedMsg) conversionRestrictedMsg.style.display = 'block';
        if (conversionPendingMsg) conversionPendingMsg.style.display = 'none';
        if (conversionConstructorPendingMsg) conversionConstructorPendingMsg.style.display = 'none';
      } else if (activeUser.conversionStatus === 'pending') {
        if (btnRequestConversion) btnRequestConversion.style.display = 'none';
        if (btnRequestConstructor) btnRequestConstructor.style.display = 'none';
        if (conversionRestrictedMsg) conversionRestrictedMsg.style.display = 'none';
        if (conversionPendingMsg) conversionPendingMsg.style.display = 'block';
        if (conversionConstructorPendingMsg) conversionConstructorPendingMsg.style.display = 'none';
      } else if (activeUser.conversionStatus === 'pending_constructor') {
        if (btnRequestConversion) btnRequestConversion.style.display = 'none';
        if (btnRequestConstructor) btnRequestConstructor.style.display = 'none';
        if (conversionRestrictedMsg) conversionRestrictedMsg.style.display = 'none';
        if (conversionPendingMsg) conversionPendingMsg.style.display = 'none';
        if (conversionConstructorPendingMsg) conversionConstructorPendingMsg.style.display = 'block';
      } else {
        if (btnRequestConversion) btnRequestConversion.style.display = 'inline-flex';
        if (btnRequestConstructor) btnRequestConstructor.style.display = 'inline-flex';
        if (conversionRestrictedMsg) conversionRestrictedMsg.style.display = 'none';
        if (conversionPendingMsg) conversionPendingMsg.style.display = 'none';
        if (conversionConstructorPendingMsg) conversionConstructorPendingMsg.style.display = 'none';
      }
    }
  };

  // --- Request Conversion to Business ---
  if (btnRequestConversion) {
    btnRequestConversion.addEventListener('click', () => {
      if (activeUser.isSNS) {
        alert('SNS 로그인 사용자는 영업자 회원으로 전환할 수 없습니다. ID/PW 회원가입을 이용해 주세요.');
        return;
      }

      if (confirm('영업자 회원으로 전환을 신청하시겠습니까? 신청 후 매니저 승인 단계를 통해 코드가 부여됩니다.')) {
        activeUser.conversionStatus = 'pending';
        users = users.map(u => u.id === activeUser.id ? { ...u, conversionStatus: 'pending' } : u);
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('activeUser', JSON.stringify(activeUser));

        // Supabase Sync
        if (window.SupabaseSync) {
          window.SupabaseSync.updateUser(activeUser.id, {
            conversion_status: 'pending'
          });
        }

        // 카카오톡 관리자 실시간 알림 발송
        if (window.KakaoNotifier && typeof window.KakaoNotifier.notifyBusinessConversion === 'function') {
          window.KakaoNotifier.notifyBusinessConversion(activeUser);
        }

        alert('영업자 회원 전환 신청이 접수되었습니다. 하단 [매니저 승인 콘솔]에서 즉시 승인 테스트를 하실 수 있습니다.');
        updateSessionUI();
      }
    });
  }

  // --- Request Conversion to Constructor ---
  if (btnRequestConstructor && constructorModal) {
    btnRequestConstructor.addEventListener('click', () => {
      if (activeUser.isSNS) {
        alert('SNS 로그인 사용자는 시공업체 회원으로 전환할 수 없습니다. ID/PW 회원가입을 이용해 주세요.');
        return;
      }
      constructorModal.style.display = 'flex';
    });
  }

  if (constructorModalClose && constructorModal) {
    constructorModalClose.addEventListener('click', () => {
      constructorModal.style.display = 'none';
    });
  }

  if (constructorRequestForm && constructorModal) {
    constructorRequestForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const bName = constBusinessNameInput.value.trim();
      const lNum = constLicenseNumberInput.value.trim();

      if (!bName || !lNum) {
        alert('업체 상호명과 사업자등록번호를 모두 입력해 주세요.');
        return;
      }

      activeUser.conversionStatus = 'pending_constructor';
      activeUser.pendingBusinessName = bName;
      activeUser.pendingLicenseNumber = lNum;

      users = users.map(u => u.id === activeUser.id ? { 
        ...u, 
        conversionStatus: 'pending_constructor',
        pendingBusinessName: bName,
        pendingLicenseNumber: lNum
      } : u);

      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('activeUser', JSON.stringify(activeUser));

      // Supabase Sync
      if (window.SupabaseSync) {
        window.SupabaseSync.updateUser(activeUser.id, {
          conversion_status: 'pending_constructor',
          pending_business_name: bName,
          pending_license_number: lNum
        });
      }

      // 카카오톡 관리자 실시간 알림 발송
      if (window.KakaoNotifier && typeof window.KakaoNotifier.notifyConstructorConversion === 'function') {
        window.KakaoNotifier.notifyConstructorConversion(activeUser);
      }

      constructorModal.style.display = 'none';
      alert('시공업체 회원 전환 신청이 접수되었습니다. 하단 [매니저 승인 콘솔]에서 즉시 승인 테스트를 하실 수 있습니다.');
      updateSessionUI();
    });
  }

  // --- Render Business Items list ---
  const renderBusinessDashboard = () => {
    if (!bizItemsList) return;
    bizItemsList.innerHTML = '';
    
    // 동기화: 신청서(applications) 데이터와 영업자의 items 매핑 상태 업데이트
    let items = activeUser.items || [];
    const apps = JSON.parse(localStorage.getItem('applications')) || [];
    let itemsUpdated = false;

    items = items.map(item => {
      // GP- 또는 P-로 시작하는 신청건인 경우, applications의 최신 심사 결과를 반영
      if (typeof item.id === 'string' && (item.id.startsWith('GP-') || item.id.startsWith('P-'))) {
        const matchingApp = apps.find(app => app.id === item.id);
        if (matchingApp) {
          let updatedProgress = item.progressStatus;
          if (matchingApp.status === 'approved') {
            if (matchingApp.constructionStatus === 'before_construction') {
              updatedProgress = '시공사 배정 (시공 전)';
            } else if (matchingApp.constructionStatus === 'in_construction') {
              updatedProgress = '시공 진행 중';
            } else if (matchingApp.constructionStatus === 'after_construction') {
              updatedProgress = '시공 완료 (검수 중)';
            } else if (matchingApp.constructionStatus === 'completed') {
              updatedProgress = '정산 종결 (최종 완료)';
            } else {
              updatedProgress = '승인 완료';
            }
          } else if (matchingApp.status === 'rejected') {
            updatedProgress = '반려됨';
          } else {
            updatedProgress = '심사 대기';
          }

          if (item.progressStatus !== updatedProgress) {
            item.progressStatus = updatedProgress;
            itemsUpdated = true;
          }
        }
      }
      return item;
    });

    if (itemsUpdated) {
      activeUser.items = items;
      users = users.map(u => u.id === activeUser.id ? { ...u, items } : u);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('activeUser', JSON.stringify(activeUser));
    }

    if (items.length === 0) {
      bizItemsList.innerHTML = `
        <div class="empty-list-msg">
          <i class="fa-solid fa-folder-open" style="font-size: 2.5rem; margin-bottom: 15px; opacity: 0.5;"></i>
          <p>등록된 영업물건이 없습니다. 우측 모바일 업로드기에서 첫 물건을 등록해 보세요.</p>
        </div>
      `;
      return;
    }

    items.forEach(item => {
      const card = document.createElement('div');
      card.className = 'biz-item-card';

      let photosHtml = '';
      if (item.photos && item.photos.length > 0) {
        photosHtml = `<div class="biz-item-photos">`;
        item.photos.forEach(photoSrc => {
          photosHtml += `<img src="${sanitizeUrl(photoSrc)}" alt="현장사진" class="biz-item-thumb" onerror="this.src='간판지원단 로고-2.png'">`;
        });
        photosHtml += `</div>`;
      }

      card.innerHTML = `
        <div class="biz-item-header">
          <div>
            <h4 class="biz-item-name">${escapeHtml(item.name)} ${item.id ? `<span style="font-size: 0.72rem; font-weight: 500; color: var(--accent-primary); background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); padding: 1px 6px; border-radius: 4px; margin-left: 6px;">${escapeHtml(String(item.id))}</span>` : ''}</h4>
            <p class="biz-item-addr"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(item.address)}</p>
            ${item.phone ? `<p class="biz-item-phone" style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-phone" style="color: var(--accent-primary);"></i> ${escapeHtml(item.phone)}</p>` : ''}
          </div>
          <div class="biz-item-badges">
            <span class="badge-receipt">${escapeHtml(item.receiptStatus)}</span>
            <span class="badge-progress">${escapeHtml(item.progressStatus)}</span>
          </div>
        </div>
        ${photosHtml}
      `;
      bizItemsList.appendChild(card);
    });
  };

  // --- Manual Application Linking (방안 B) ---
  const initManualAppLinking = () => {
    const btnLinkApp = document.getElementById('btn-link-app');
    const linkAppIdInput = document.getElementById('link-app-id');

    if (!btnLinkApp || !linkAppIdInput) return;

    btnLinkApp.addEventListener('click', () => {
      const appId = linkAppIdInput.value.trim();
      if (!appId) {
        alert('연동할 고객의 간판 신청 고유 접수 번호를 입력해 주세요.');
        return;
      }

      // Check if format is valid (P-YYMMDDNNN 또는 GP-YYYYMMDD-XXXX)
      const idPattern = /^(P-\d{6}\d{3}|GP-\d{8}-\d{4})$/;
      if (!idPattern.test(appId)) {
        alert('올바른 신청번호 형식이 아닙니다.\n형식: P-YYMMDDNNN (예: P-260816001) 또는 GP-YYYYMMDD-XXXX');
        return;
      }

      // Fetch applications from localStorage
      const apps = JSON.parse(localStorage.getItem('applications')) || [];
      const targetApp = apps.find(app => app.id === appId);

      if (!targetApp) {
        alert('입력하신 신청번호에 해당하는 간판 지원 신청 내역을 찾을 수 없습니다.');
        return;
      }

      // Check if already linked
      activeUser.items = activeUser.items || [];
      if (activeUser.items.some(item => item.id === appId)) {
        alert('이미 연동되어 내 영업물건 목록에 등록된 신청 건입니다.');
        return;
      }

      // Create new business item object mapped to the application
      const newLinkedItem = {
        id: targetApp.id, // Keep the same ID for synchronization
        name: targetApp.storeName,
        address: targetApp.storeAddress,
        photosCount: targetApp.fileName && targetApp.fileName !== '업로드 파일 없음' ? 1 : 0,
        receiptStatus: '접수 완료 (간판지원단)',
        progressStatus: targetApp.status === 'approved' ? '승인 완료' : (targetApp.status === 'rejected' ? '반려됨' : '심사 대기'),
        photos: targetApp.fileData ? [targetApp.fileData] : []
      };

      // Push to business items list
      activeUser.items.push(newLinkedItem);

      // Update in users array
      users = users.map(u => u.id === activeUser.id ? { ...u, items: activeUser.items } : u);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('activeUser', JSON.stringify(activeUser));

      // Also update the application with this business user's ID and referrerCode if not set
      const updatedApps = apps.map(app => {
        if (app.id === appId) {
          return {
            ...app,
            referrerCode: activeUser.bizCode
          };
        }
        return app;
      });
      localStorage.setItem('applications', JSON.stringify(updatedApps));

      alert(`성공적으로 고객 신청서 [${targetApp.storeName}] 건을 내 영업물건으로 연동하였습니다!`);
      linkAppIdInput.value = '';
      updateSessionUI();
    });
  };

  // Call manual app linking initialization
  initManualAppLinking();

  // --- Mobile Upload Simulator ---
  if (mobileFileZone) {
    mobileFileZone.addEventListener('click', () => {
      mobPhotosInput.click();
    });

    mobileFileZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      mobileFileZone.style.borderColor = 'var(--accent-primary)';
      mobileFileZone.style.background = '#f1f5f9';
    });

    mobileFileZone.addEventListener('dragleave', () => {
      mobileFileZone.style.borderColor = '#94a3b8';
      mobileFileZone.style.background = '#f8fafc';
    });

    mobileFileZone.addEventListener('drop', (e) => {
      e.preventDefault();
      mobileFileZone.style.borderColor = '#94a3b8';
      mobileFileZone.style.background = '#f8fafc';
      const files = e.dataTransfer.files;
      handleMobilePhotosSelect(files);
    });
  }

  if (mobPhotosInput) {
    mobPhotosInput.addEventListener('change', (e) => {
      const files = e.target.files;
      handleMobilePhotosSelect(files);
    });
  }

  // --- Image Resize & Compression (2MB Limit Guarantee) ---
  const resizeImageToLimit = (file, maxSizeBytes = 2 * 1024 * 1024) => {
    return new Promise((resolve) => {
      if (file.size <= maxSizeBytes) {
        resolve(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize long edge to max 1600px
          const max_size = 1600;
          if (width > max_size || height > max_size) {
            if (width > height) {
              height *= max_size / width;
              width = max_size;
            } else {
              width *= max_size / height;
              height = max_size;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          let quality = 0.9;
          let dataUrl = canvas.toDataURL('image/jpeg', quality);
          let size = Math.round((dataUrl.length - 22) * 3 / 4);

          while (size > maxSizeBytes && quality > 0.1) {
            quality -= 0.1;
            dataUrl = canvas.toDataURL('image/jpeg', quality);
            size = Math.round((dataUrl.length - 22) * 3 / 4);
          }

          try {
            const byteString = atob(dataUrl.split(',')[1]);
            const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
              ia[i] = byteString.charCodeAt(i);
            }
            const blob = new Blob([ab], {type: mimeString});
            const resizedFile = new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {type: 'image/jpeg', lastModified: Date.now()});
            resolve(resizedFile);
          } catch (err) {
            resolve(file);
          }
        };
        img.onerror = () => resolve(file);
        img.src = e.target.result;
      };
      reader.onerror = () => resolve(file);
      reader.readAsDataURL(file);
    });
  };

  const handleMobilePhotosSelect = async (files) => {
    if (!files.length) return;

    if (selectedPhotos.length + files.length > 20) {
      alert('영업 물건 현장 사진은 최대 20장 까지만 업로드 할 수 있습니다.');
      return;
    }

    const limit = 3 * 1024 * 1024; // 3MB Limit
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let processedFile = file;

      if (file.size > limit) {
        processedFile = await resizeImageToLimit(file, limit);
        if (processedFile.size > limit) {
          alert(`용량 제한 초과: [${file.name}]의 용량이 압축 후에도 3MB를 초과하여 제외되었습니다.`);
          continue;
        } else {
          console.log(`[압축 완료] ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(processedFile.size / 1024 / 1024).toFixed(2)}MB`);
        }
      }
      selectedPhotos.push(processedFile);
    }
    renderMobilePhotoPreviews();
  };

  const renderMobilePhotoPreviews = () => {
    if (!mobPhotoPreviews) return;
    mobPhotoPreviews.innerHTML = '';
    selectedPhotos.forEach((file, index) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'mob-preview-wrapper';

      const img = document.createElement('img');
      img.className = 'mob-preview-img';
      img.src = URL.createObjectURL(file);

      const delBtn = document.createElement('button');
      delBtn.className = 'mob-preview-del';
      delBtn.innerHTML = '&times;';
      delBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        selectedPhotos.splice(index, 1);
        renderMobilePhotoPreviews();
      });

      wrapper.appendChild(img);
      wrapper.appendChild(delBtn);
      mobPhotoPreviews.appendChild(wrapper);
    });

    mobPhotoCount.textContent = `선택된 사진: ${selectedPhotos.length} / 20장`;
  };

  // --- Live Camera Capture Feature ---
  const btnToggleCamera = document.getElementById('btn-toggle-camera');
  const cameraContainer = document.getElementById('camera-container');
  const cameraStream = document.getElementById('camera-stream');
  const btnCapturePhoto = document.getElementById('btn-capture-photo');
  const btnCloseCamera = document.getElementById('btn-close-camera');
  let localStream = null;

  if (btnToggleCamera) {
    btnToggleCamera.addEventListener('click', async () => {
      if (localStream) {
        stopCamera();
        return;
      }

      try {
        const constraints = {
          video: {
            facingMode: 'environment', // Rear-facing camera
            width: { ideal: 1280 },
            height: { ideal: 720 }
          },
          audio: false
        };
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        cameraStream.srcObject = localStream;
        cameraContainer.style.display = 'block';
        btnToggleCamera.innerHTML = '<i class="fa-solid fa-camera-rotate"></i> 실시간 카메라 끄기';
      } catch (err) {
        console.error('카메라 권한 획득 실패:', err);
        alert('카메라 스트림을 열 수 없습니다. 권한 승인 상태 혹은 디바이스 연결을 확인해 주세요.');
      }
    });
  }

  const stopCamera = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      localStream = null;
    }
    if (cameraStream) {
      cameraStream.srcObject = null;
    }
    if (cameraContainer) {
      cameraContainer.style.display = 'none';
    }
    if (btnToggleCamera) {
      btnToggleCamera.innerHTML = '<i class="fa-solid fa-camera"></i> 실시간 카메라 촬영 켜기';
    }
  };

  if (btnCloseCamera) {
    btnCloseCamera.addEventListener('click', () => {
      stopCamera();
    });
  }

  if (btnCapturePhoto) {
    btnCapturePhoto.addEventListener('click', async () => {
      if (!localStream) {
        alert('카메라가 활성화되어 있지 않습니다.');
        return;
      }

      if (selectedPhotos.length >= 20) {
        alert('현장 사진은 최대 20장 까지만 등록할 수 있습니다.');
        return;
      }

      const canvas = document.createElement('canvas');
      canvas.width = cameraStream.videoWidth || 640;
      canvas.height = cameraStream.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(cameraStream, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) {
          alert('캡처에 실패했습니다.');
          return;
        }

        const fileName = `camera_capture_${Date.now()}.jpg`;
        let file = new File([blob], fileName, { type: 'image/jpeg', lastModified: Date.now() });

        const limit = 3 * 1024 * 1024; // 3MB
        if (file.size > limit) {
          file = await resizeImageToLimit(file, limit);
        }

        selectedPhotos.push(file);
        renderMobilePhotoPreviews();
        alert('사진이 성공적으로 캡처되어 업로드 목록에 추가되었습니다.');
      }, 'image/jpeg', 0.85);
    });
  }

  if (mobileUploadForm) {
    mobileUploadForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!activeUser || activeUser.role !== 'business') return;

      const nameVal = mobItemName.value.trim();
      const phoneVal = mobItemPhone ? mobItemPhone.value.trim() : '';
      const addrVal = mobItemAddress.value.trim();

      if (!nameVal || !phoneVal || !addrVal) {
        alert('상호명, 전화번호, 설치 주소를 모두 입력해 주세요.');
        return;
      }

      const photoUrls = selectedPhotos.map(file => URL.createObjectURL(file));

      activeUser.items = activeUser.items || [];
      const itemId = typeof generateBizItemId === 'function' ? generateBizItemId(activeUser.bizCode, activeUser.items) : `${activeUser.bizCode || 'B-260801'}-0001`;

      const newItem = {
        id: itemId,
        name: nameVal,
        phone: phoneVal,
        address: addrVal,
        photosCount: selectedPhotos.length,
        receiptStatus: '접수예정',
        progressStatus: '지원대기중',
        photos: photoUrls
      };

      activeUser.items.push(newItem);

      users = users.map(u => u.id === activeUser.id ? { ...u, items: activeUser.items } : u);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('activeUser', JSON.stringify(activeUser));

      alert(`영업물건 [${nameVal}] 등록이 성공적으로 완료되었습니다!\n고유번호: [${itemId}]\n(경기도시장상권진흥원 접수 상태가 '접수 완료'로 반영되었습니다.)`);

      mobileUploadForm.reset();
      selectedPhotos = [];
      renderMobilePhotoPreviews();
      stopCamera();
      updateSessionUI();
    });
  }

  // --- Manager Panel Simulation ---
  if (managerPanelToggle) {
    managerPanelToggle.addEventListener('click', () => {
      // Prevent collapse for admin users
      if (activeUser && activeUser.role === 'admin') return;

      const isActive = managerPanelContent.classList.contains('active');
      if (isActive) {
        managerPanelContent.classList.remove('active');
        managerToggleIcon.innerHTML = '<i class="fa-solid fa-chevron-down"></i>';
      } else {
        managerPanelContent.classList.add('active');
        managerToggleIcon.innerHTML = '<i class="fa-solid fa-chevron-up"></i>';
      }
    });
  }

  // --- Admin Section Pagination States (10 items per page) ---
  let allUsersCurrentPage = 1;
  const allUsersPerPage = 10;
  let allUsersSearchQuery = '';

  let reqCurrentPage = 1;
  const reqPerPage = 10;

  let itemsCurrentPage = 1;
  const itemsPerPage = 10;

  let appsCurrentPage = 1;
  const appsPerPage = 10;

  let inquiriesCurrentPage = 1;
  const inquiriesPerPage = 10;

  function renderPaginationControls(totalCount, perPage, currentPage, callbackFnName) {
    if (totalCount <= perPage) return '';
    const totalPages = Math.ceil(totalCount / perPage);
    let html = '';

    if (currentPage > 1) {
      html += `<button type="button" onclick="${callbackFnName}(${currentPage - 1}); return false;" style="padding: 4px 10px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; font-size: 0.75rem; cursor: pointer; color: #475569; font-weight: 600; transition: all 0.2s;">&lt; 이전</button>`;
    } else {
      html += `<button type="button" disabled style="padding: 4px 10px; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 6px; font-size: 0.75rem; color: #cbd5e1; cursor: not-allowed;">&lt; 이전</button>`;
    }

    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + 4);
    if (endPage - startPage < 4) {
      startPage = Math.max(1, endPage - 4);
    }

    for (let i = startPage; i <= endPage; i++) {
      if (i === currentPage) {
        html += `<button type="button" style="padding: 4px 10px; border: 1px solid var(--accent-primary); background: var(--accent-primary); color: #fff; border-radius: 6px; font-size: 0.75rem; font-weight: 700; cursor: pointer;">${i}</button>`;
      } else {
        html += `<button type="button" onclick="${callbackFnName}(${i}); return false;" style="padding: 4px 10px; border: 1px solid #cbd5e1; background: #fff; color: #475569; border-radius: 6px; font-size: 0.75rem; cursor: pointer; font-weight: 600; transition: all 0.2s;">${i}</button>`;
      }
    }

    if (currentPage < totalPages) {
      html += `<button type="button" onclick="${callbackFnName}(${currentPage + 1}); return false;" style="padding: 4px 10px; border: 1px solid #cbd5e1; background: #fff; border-radius: 6px; font-size: 0.75rem; cursor: pointer; color: #475569; font-weight: 600; transition: all 0.2s;">다음 &gt;</button>`;
    } else {
      html += `<button type="button" disabled style="padding: 4px 10px; border: 1px solid #e2e8f0; background: #f8fafc; border-radius: 6px; font-size: 0.75rem; color: #cbd5e1; cursor: not-allowed;">다음 &gt;</button>`;
    }

    return html;
  }

  window.changeAllUsersPage = (p) => {
    allUsersCurrentPage = p;
    renderAllUsersList();
  };
  window.changeReqPage = (p) => {
    reqCurrentPage = p;
    renderManagerPanel();
  };
  window.changeItemsPage = (p) => {
    itemsCurrentPage = p;
    renderManagerPanel();
  };
  window.changeAppsPage = (p) => {
    appsCurrentPage = p;
    renderApplicationsList();
  };
  window.changeInquiriesPage = (p) => {
    inquiriesCurrentPage = p;
    renderInquiriesList();
  };

  // --- Render All Users List (전체 회원 정보 관리) ---
  const renderAllUsersList = () => {
    if (activeUser.role !== 'admin') return;
    const allUsersTableBody = document.getElementById('all-users-table-body');
    const allUsersCountEl = document.getElementById('all-users-count');
    const paginationContainer = document.getElementById('pagination-manager-all-users');
    if (!allUsersTableBody) return;

    let currentUsers = JSON.parse(localStorage.getItem('users')) || [];

    // 검색 필터링
    if (allUsersSearchQuery && allUsersSearchQuery.trim()) {
      const q = allUsersSearchQuery.trim().toLowerCase();
      currentUsers = currentUsers.filter(u => 
        (u.id && u.id.toLowerCase().includes(q)) ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.address && u.address.toLowerCase().includes(q))
      );
    }

    if (allUsersCountEl) {
      allUsersCountEl.textContent = currentUsers.length;
    }

    if (currentUsers.length === 0) {
      allUsersTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-muted" style="text-align: center; padding: 30px 0;">검색/등록된 가입 회원이 없습니다.</td>
        </tr>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    allUsersTableBody.innerHTML = '';

    const totalCount = currentUsers.length;
    const totalPages = Math.ceil(totalCount / allUsersPerPage);
    if (allUsersCurrentPage > totalPages) allUsersCurrentPage = totalPages;
    if (allUsersCurrentPage < 1) allUsersCurrentPage = 1;

    const startIndex = (allUsersCurrentPage - 1) * allUsersPerPage;
    const paginatedUsers = currentUsers.slice(startIndex, startIndex + allUsersPerPage);

    paginatedUsers.forEach(u => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-color)';

      let roleBadge = '<span style="background: #e2e8f0; color: #475569; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;">일반회원</span>';
      if (u.role === 'admin') {
        roleBadge = '<span style="background: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;">최고관리자</span>';
      } else if (u.role === 'business') {
        roleBadge = '<span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;">영업자</span>';
      } else if (u.role === 'constructor') {
        roleBadge = '<span style="background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 4px; font-size: 0.72rem; font-weight: 700;">시공사</span>';
      }

      let codeText = '-';
      if (u.role === 'business' && u.bizCode) {
        codeText = `<strong style="color: var(--accent-secondary);">${escapeHtml(u.bizCode)}</strong>`;
      } else if (u.role === 'constructor' && u.constCode) {
        codeText = `<strong style="color: var(--accent-success);">${escapeHtml(u.constCode)}</strong>`;
      }

      const deleteBtn = u.role === 'admin' 
        ? '<span style="color:#cbd5e1; font-size:0.75rem;">-</span>'
        : `<button class="btn btn-sm btn-delete-user-admin" data-uid="${u.id}" style="padding: 4px 8px; font-size: 0.72rem; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-trash-can"></i> 삭제</button>`;

      tr.innerHTML = `
        <td style="padding: 12px 14px; font-weight: 700; color: var(--text-primary); font-family: monospace;">${escapeHtml(u.id)}</td>
        <td style="padding: 12px 14px; font-weight: 600; color: var(--text-primary);">${escapeHtml(u.name || '-')}</td>
        <td style="padding: 12px 14px; font-size: 0.8rem; color: var(--text-secondary);">
          <div><a href="tel:${escapeHtml(u.phone || '')}" style="color: var(--accent-primary); text-decoration: none;"><i class="fa-solid fa-phone"></i> ${escapeHtml(u.phone || '-')}</a></div>
          ${u.email ? `<div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">${escapeHtml(u.email)}</div>` : ''}
        </td>
        <td style="padding: 12px 14px; font-size: 0.8rem; color: var(--text-secondary); max-width: 220px;">${escapeHtml(u.address || '-')}</td>
        <td style="padding: 12px 14px; text-align: center; white-space: nowrap;">${roleBadge}</td>
        <td style="padding: 12px 14px; text-align: center; white-space: nowrap;">${codeText}</td>
        <td style="padding: 12px 14px; text-align: center; white-space: nowrap;">${deleteBtn}</td>
      `;
      allUsersTableBody.appendChild(tr);
    });

    if (paginationContainer) {
      paginationContainer.innerHTML = renderPaginationControls(totalCount, allUsersPerPage, allUsersCurrentPage, 'window.changeAllUsersPage');
    }

    // Delete user listener
    allUsersTableBody.querySelectorAll('.btn-delete-user-admin').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const uid = e.target.closest('button').dataset.uid;
        if (!confirm(`[주의] 회원 ID [${uid}]을(를) 정말로 강제 탈퇴/삭제 처리하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) return;

        let curUsers = JSON.parse(localStorage.getItem('users')) || [];
        curUsers = curUsers.filter(u => u.id !== uid);
        localStorage.setItem('users', JSON.stringify(curUsers));

        if (window.SupabaseSync) {
          window.SupabaseSync.deleteUser(uid);
        }

        alert(`회원 [${uid}]이(가) 정상적으로 탈퇴/삭제되었습니다.`);
        renderAllUsersList();
        renderManagerPanel();
      });
    });
  };

  // 회원 검색 이벤트 바인딩
  const searchAllUsersInput = document.getElementById('search-all-users-input');
  if (searchAllUsersInput) {
    searchAllUsersInput.addEventListener('input', (e) => {
      allUsersSearchQuery = e.target.value;
      allUsersCurrentPage = 1;
      renderAllUsersList();
    });
  }

  const renderManagerPanel = () => {
    if (activeUser.role !== 'admin') return;
    if (!managerRequestsList || !managerItemsList) return;

    // 1. Render Requests (with pagination)
    managerRequestsList.innerHTML = '';
    const pendingUsers = users.filter(u => u.conversionStatus === 'pending' || u.conversionStatus === 'pending_constructor');
    const paginationRequestsContainer = document.getElementById('pagination-manager-requests');

    if (pendingUsers.length === 0) {
      managerRequestsList.innerHTML = `<p class="text-muted" style="text-align: center; padding: 30px 0;">대기 중인 승인 신청이 없습니다.</p>`;
      if (paginationRequestsContainer) paginationRequestsContainer.innerHTML = '';
    } else {
      const totalReq = pendingUsers.length;
      const totalReqPages = Math.ceil(totalReq / reqPerPage);
      if (reqCurrentPage > totalReqPages) reqCurrentPage = totalReqPages;
      if (reqCurrentPage < 1) reqCurrentPage = 1;

      const startIndex = (reqCurrentPage - 1) * reqPerPage;
      const paginatedRequests = pendingUsers.slice(startIndex, startIndex + reqPerPage);

      paginatedRequests.forEach(u => {
        const isConstructor = u.conversionStatus === 'pending_constructor';
        const typeText = isConstructor ? '시공업체' : '영업자';
        const typeBadgeColor = isConstructor ? 'var(--accent-success)' : 'var(--accent-secondary)';
        
        let detailsHtml = '';
        if (isConstructor) {
          detailsHtml = `
            <div style="margin-top: 4px; border-top: 1px dashed rgba(0,0,0,0.1); padding-top: 4px;">
              <div><strong>업체 상호명:</strong> ${escapeHtml(u.pendingBusinessName)}</div>
              <div><strong>사업자등록번호:</strong> ${escapeHtml(u.pendingLicenseNumber)}</div>
            </div>
          `;
        }

        const row = document.createElement('div');
        row.className = 'request-item';
        row.style.borderLeft = `5px solid ${typeBadgeColor}`;
        row.style.background = '#ffffff';
        row.style.padding = '14px 16px';
        row.style.borderRadius = '8px';
        row.style.border = '1px solid #e2e8f0';
        row.style.borderLeft = `5px solid ${typeBadgeColor}`;
        row.style.marginBottom = '12px';

        row.innerHTML = `
          <div class="request-item-details" style="text-align: left; font-size: 0.82rem; line-height: 1.6;">
            <div style="margin-bottom: 8px;">
              <span style="background: ${typeBadgeColor}; color: white; padding: 3px 10px; border-radius: 4px; font-size: 0.75rem; font-weight: 700;">
                <i class="fa-solid ${isConstructor ? 'fa-screwdriver-wrench' : 'fa-user-tie'}"></i> ${typeText} 전환 신청
              </span>
            </div>
            <div><strong>신청자 ID:</strong> <span style="color: var(--accent-primary); font-weight: 600;">${escapeHtml(u.id)}</span></div>
            <div><strong>성명:</strong> ${escapeHtml(u.name)}</div>
            <div><strong>연락처:</strong> ${escapeHtml(u.phone || '미등록')}</div>
            <div><strong>주소:</strong> ${escapeHtml(u.address || '미등록')}</div>
            ${detailsHtml}
          </div>
          <div class="request-item-actions" style="margin-top: 10px; display: flex; gap: 8px; justify-content: flex-end;">
            <button type="button" class="btn btn-secondary btn-sm" onclick="window.rejectUserConversion('${u.id}'); return false;" style="padding: 5px 12px; font-size: 0.78rem;"><i class="fa-solid fa-xmark"></i> 반려</button>
            <button type="button" class="btn btn-primary btn-sm" onclick="window.approveUserConversion('${u.id}'); return false;" style="background: var(--accent-success); border: none; padding: 5px 14px; font-size: 0.78rem; font-weight: 700;"><i class="fa-solid fa-check"></i> 승인</button>
          </div>
        `;
        managerRequestsList.appendChild(row);
      });

      if (paginationRequestsContainer) {
        paginationRequestsContainer.innerHTML = renderPaginationControls(totalReq, reqPerPage, reqCurrentPage, 'window.changeReqPage');
      }
    }

    // 2. Render Business Items (with pagination)
    managerItemsList.innerHTML = '';
    const allBusinessItems = [];

    users.forEach(u => {
      if (u.role === 'business' && u.items && u.items.length > 0) {
        u.items.forEach(item => {
          allBusinessItems.push({
            user: u,
            item: item
          });
        });
      }
    });

    const paginationItemsContainer = document.getElementById('pagination-manager-items');

    if (allBusinessItems.length === 0) {
      managerItemsList.innerHTML = `<p class="text-muted" style="text-align: center; padding: 30px 0;">등록된 영업물건이 없습니다.</p>`;
      if (paginationItemsContainer) paginationItemsContainer.innerHTML = '';
    } else {
      const totalItemsCount = allBusinessItems.length;
      const totalItemsPages = Math.ceil(totalItemsCount / itemsPerPage);
      if (itemsCurrentPage > totalItemsPages) itemsCurrentPage = totalItemsPages;
      if (itemsCurrentPage < 1) itemsCurrentPage = 1;

      const startIndex = (itemsCurrentPage - 1) * itemsPerPage;
      const paginatedItems = allBusinessItems.slice(startIndex, startIndex + itemsPerPage);

      paginatedItems.forEach(({ user: u, item }) => {
        const row = document.createElement('div');
        row.className = 'manager-item-row';
        row.style.display = 'flex';
        row.style.flexDirection = 'column';
        row.style.gap = '8px';
        row.style.background = '#ffffff';
        row.style.padding = '14px 18px';
        row.style.borderRadius = '10px';
        row.style.border = '1px solid #e2e8f0';
        row.style.marginBottom = '10px';

        row.innerHTML = `
          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
            <div class="manager-item-row-title" style="font-weight: 700; font-size: 0.98rem; color: var(--text-primary);">
              ${escapeHtml(item.name)} 
              <span style="font-size: 0.78rem; font-weight: normal; color: var(--text-secondary); margin-left: 4px;">(${escapeHtml(u.name)} 영업자 / <span style="color: var(--accent-primary); font-weight: 600;">${escapeHtml(String(item.id))}</span>)</span>
            </div>
            <button type="button" class="btn-delete-manager-item" onclick="window.deleteManagerItem('${u.id}', '${item.id}'); return false;" title="영업 물건 삭제" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 5px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 5px; transition: all 0.2s ease;">
              <i class="fa-solid fa-trash-can"></i> 삭제
            </button>
          </div>
          
          <div style="font-size: 0.82rem; color: var(--text-secondary); text-align: left;">
            <div><i class="fa-solid fa-location-dot" style="width: 14px; color: var(--accent-primary);"></i> 주소: ${escapeHtml(item.address)}</div>
            ${item.phone ? `<div style="margin-top: 2px;"><i class="fa-solid fa-phone" style="width: 14px; color: #64748b;"></i> 연락처: ${escapeHtml(item.phone)}</div>` : ''}
          </div>
          
          <div class="status-select-wrapper" style="display: flex; align-items: center; flex-wrap: wrap; gap: 10px; margin-top: 6px; padding-top: 8px; border-top: 1px dashed #f1f5f9;">
            <div style="display: flex; align-items: center; gap: 6px;">
              <label style="font-size: 0.75rem; font-weight: 700; color: #475569;">접수:</label>
              <select class="status-select select-receipt-status" data-uid="${u.id}" data-itemid="${item.id}" onchange="window.updateItemStatus('${u.id}', '${item.id}', 'receipt', this.value)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem; font-weight: 600; background: #fff;">
                <option value="업체신청" ${(item.receiptStatus === '업체신청') ? 'selected' : ''}>업체신청</option>
                <option value="접수예정" ${(item.receiptStatus === '접수예정' || !item.receiptStatus || item.receiptStatus === '접수 대기') ? 'selected' : ''}>접수예정</option>
                <option value="접수완료" ${(item.receiptStatus === '접수완료' || item.receiptStatus === '접수 완료' || item.receiptStatus.includes('접수 완료')) ? 'selected' : ''}>접수완료</option>
              </select>
            </div>
            
            <div style="display: flex; align-items: center; gap: 6px;">
              <label style="font-size: 0.75rem; font-weight: 700; color: #475569;">진행:</label>
              <select class="status-select select-progress-status" data-uid="${u.id}" data-itemid="${item.id}" onchange="window.updateItemStatus('${u.id}', '${item.id}', 'progress', this.value)" style="padding: 4px 8px; border-radius: 6px; border: 1px solid #cbd5e1; font-size: 0.78rem; font-weight: 600; background: #fff;">
                <option value="지원대기중" ${(item.progressStatus === '지원대기중' || !item.progressStatus || item.progressStatus === '심사 대기') ? 'selected' : ''}>지원대기중</option>
                <option value="심사대기" ${(item.progressStatus === '심사대기' || item.progressStatus === '서류 보완 필요') ? 'selected' : ''}>심사대기</option>
                <option value="대상자선정" ${(item.progressStatus === '대상자선정' || item.progressStatus === '서류 심사 통과' || item.progressStatus === '현장 실사 중' || item.progressStatus === '지원금 최종 승인') ? 'selected' : ''}>대상자선정</option>
                <option value="간판시공 준비중" ${(item.progressStatus === '간판시공 준비중' || item.progressStatus === '간판 시공 중') ? 'selected' : ''}>간판시공 준비중</option>
                <option value="간판시공완료" ${(item.progressStatus === '간판시공완료' || item.progressStatus === '시공 완료') ? 'selected' : ''}>간판시공완료</option>
              </select>
            </div>
          </div>
        `;
        managerItemsList.appendChild(row);
      });

      if (paginationItemsContainer) {
        paginationItemsContainer.innerHTML = renderPaginationControls(totalItemsCount, itemsPerPage, itemsCurrentPage, 'window.changeItemsPage');
      }
    }
  };

  const deleteManagerItem = (uid, itemId) => {
    if (!activeUser || activeUser.role !== 'admin') {
      alert('최고 관리자만 영업 물건을 삭제할 수 있습니다.');
      return;
    }

    let targetItemName = '해당 영업 물건';
    const targetUser = users.find(u => String(u.id) === String(uid));
    if (targetUser && targetUser.items) {
      const found = targetUser.items.find(it => String(it.id) === String(itemId));
      if (found && found.name) targetItemName = found.name;
    }

    const ok = confirm(`정말 [${targetItemName}] 영업 물건을 영구 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 등록된 현장 사진 및 진행 상태 정보가 모두 삭제됩니다.`);
    if (!ok) return;

    users = users.map(u => {
      if (String(u.id) === String(uid)) {
        const remainingItems = (u.items || []).filter(item => String(item.id) !== String(itemId));
        return { ...u, items: remainingItems };
      }
      return u;
    });

    localStorage.setItem('users', JSON.stringify(users));

    // Supabase DB Sync
    if (window.supabaseClient) {
      const updatedUser = users.find(u => String(u.id) === String(uid));
      if (updatedUser) {
        window.supabaseClient.from('users').update({
          items: updatedUser.items || []
        }).eq('id', uid).then(({ error }) => {
          if (error) console.error('Supabase item deletion error:', error.message);
        });
      }
      window.supabaseClient.from('applications').delete().eq('id', itemId).then(({ error }) => {
        if (error) console.log('Notice: Item not in applications table');
      });
    }

    alert(`[${targetItemName}] 영업 물건이 안전하게 삭제되었습니다.`);
    updateSessionUI();
  };
  window.deleteManagerItem = deleteManagerItem;

  const approveUserConversion = (uid) => {
    if (activeUser.role !== 'admin') return;
    
    const targetUser = users.find(u => u.id === uid);
    if (!targetUser) return;
    
    if (targetUser.conversionStatus === 'pending_constructor') {
      const code = generateConstCode(users);
      users = users.map(u => {
        if (u.id === uid) {
          return {
            ...u,
            role: 'constructor',
            constCode: code,
            businessName: u.pendingBusinessName || '(주)새로운시공',
            licenseNumber: u.pendingLicenseNumber || '000-00-00000',
            conversionStatus: 'approved'
          };
        }
        return u;
      });
      localStorage.setItem('users', JSON.stringify(users));

      // Supabase Sync
      if (window.SupabaseSync) {
        window.SupabaseSync.updateUser(uid, {
          role: 'constructor',
          const_code: code,
          pending_business_name: targetUser.pendingBusinessName || '(주)새로운시공',
          pending_license_number: targetUser.pendingLicenseNumber || '000-00-00000',
          conversion_status: 'approved'
        });
      }

      alert(`시공업체 전환 신청이 승인되었습니다.\n\n발급된 시공업체 코드: [${code}]`);
    } else {
      const code = generateBizCode(users);
      users = users.map(u => {
        if (u.id === uid) {
          return {
            ...u,
            role: 'business',
            bizCode: code,
            conversionStatus: 'approved'
          };
        }
        return u;
      });
      localStorage.setItem('users', JSON.stringify(users));

      // Supabase Sync
      if (window.SupabaseSync) {
        window.SupabaseSync.updateUser(uid, {
          role: 'business',
          biz_code: code,
          conversion_status: 'approved'
        });
      }

      alert(`영업자 전환 신청이 승인되었습니다.\n\n발급된 영업자 코드: [${code}]`);
    }
    updateSessionUI();
  };
  window.approveUserConversion = approveUserConversion;

  const rejectUserConversion = (uid) => {
    if (activeUser.role !== 'admin') return;
    users = users.map(u => {
      if (u.id === uid) {
        const cleanUser = { ...u, conversionStatus: 'none' };
        if ('pendingBusinessName' in cleanUser) delete cleanUser.pendingBusinessName;
        if ('pendingLicenseNumber' in cleanUser) delete cleanUser.pendingLicenseNumber;
        return cleanUser;
      }
      return u;
    });

    localStorage.setItem('users', JSON.stringify(users));

    if (window.SupabaseSync) {
      window.SupabaseSync.updateUser(uid, {
        conversion_status: 'none'
      });
    }

    alert('전환 신청이 반려되었습니다.');
    updateSessionUI();
  };
  window.rejectUserConversion = rejectUserConversion;

  const updateItemStatus = (uid, itemId, type, value) => {
    if (!activeUser || activeUser.role !== 'admin') return;
    users = users.map(u => {
      if (String(u.id) === String(uid)) {
        const updatedItems = (u.items || []).map(item => {
          if (String(item.id) === String(itemId)) {
            if (type === 'receipt') {
              return { ...item, receiptStatus: value };
            } else {
              return { ...item, progressStatus: value };
            }
          }
          return item;
        });
        return { ...u, items: updatedItems };
      }
      return u;
    });

    localStorage.setItem('users', JSON.stringify(users));

    // Supabase DB Sync
    if (window.SupabaseSync) {
      const updatedUser = users.find(u => String(u.id) === String(uid));
      if (updatedUser) {
        window.SupabaseSync.updateUser(uid, {
          items: updatedUser.items || []
        });
      }
    }

    updateSessionUI();
  };
  window.updateItemStatus = updateItemStatus;

  // --- Collapsible Sections Toggle for PC Admin Dashboard ---
  const toggleAdminSection = (containerId, headerEl) => {
    const container = document.getElementById(containerId);
    if (!container) return;

    const isHidden = container.style.display === 'none';
    const toggleBtn = headerEl ? headerEl.querySelector('.btn-toggle-admin') : null;
    const textSpan = toggleBtn ? toggleBtn.querySelector('.toggle-text') : null;
    const iconEl = toggleBtn ? toggleBtn.querySelector('.toggle-icon') : null;

    if (isHidden) {
      container.style.display = 'block';
      if (textSpan) textSpan.textContent = '접기';
      if (iconEl) {
        iconEl.className = 'fa-solid fa-chevron-up toggle-icon';
      }
    } else {
      container.style.display = 'none';
      if (textSpan) textSpan.textContent = '펼치기';
      if (iconEl) {
        iconEl.className = 'fa-solid fa-chevron-down toggle-icon';
      }
    }
  };
  window.toggleAdminSection = toggleAdminSection;

  // --- Account Deletion (회원탈퇴) ---
  const btnDeleteAccount = document.getElementById('btn-delete-account');
  if (btnDeleteAccount) {
    btnDeleteAccount.addEventListener('click', () => {
      const confirmFirst = confirm('정말로 회원탈퇴를 진행하시겠습니까?\n등록된 모든 영업물건과 정보가 영구 삭제되며, 이 작업은 되돌릴 수 없습니다.');
      if (!confirmFirst) return;

      const confirmSecond = confirm('최종 확인: 정말 탈퇴하시겠습니까?');
      if (!confirmSecond) return;

      // Filter out this user from DB
      users = users.filter(u => u.id !== activeUser.id);
      localStorage.setItem('users', JSON.stringify(users));

      // Clear Session
      clearActiveUser();

      alert('회원탈퇴가 성공적으로 완료되었습니다. 이용해 주셔서 감사합니다.');
      window.location.href = 'index.html';
    });
  }

  // ==========================================
  // Popup Management Logic
  // ==========================================
  const escapeHtml = (text) => {
    if (!text) return '';
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  const renderPopupManager = () => {
    if (activeUser.role !== 'admin') return;
    if (!managerPopupsList) return;
    
    // Reload popups from local storage to keep DB state in sync
    popups = JSON.parse(localStorage.getItem('popups')) || [];
    
    managerPopupsList.innerHTML = '';
    
    if (popups.length === 0) {
      managerPopupsList.innerHTML = '<p class="text-muted" style="text-align: center; padding: 30px 0;">등록된 팝업창이 없습니다.</p>';
      return;
    }
    
    popups.forEach(popup => {
      const card = document.createElement('div');
      card.className = 'popup-item-card';
      card.innerHTML = `
        <div class="popup-item-header">
          <span class="popup-item-title">${escapeHtml(popup.title)}</span>
          <span class="badge" style="background: ${popup.isActive ? 'var(--accent-primary)' : '#64748b'}; color: white; border-radius: 50px; padding: 2px 8px; font-size: 0.72rem; font-weight: 600;">
            ${popup.isActive ? '활성화' : '비활성화'}
          </span>
        </div>
        <div class="popup-item-details">
          <div><strong>크기:</strong> ${popup.width}x${popup.height}px | <strong>위치:</strong> Top ${popup.positionTop}px, Left ${popup.positionLeft}px</div>
          <div style="margin-top: 4px; font-size: 0.78rem; color: var(--accent-secondary); font-weight: 600;">
            <i class="fa-solid fa-calendar-days"></i> 게시 기간: ${popup.startDate || '미지정'} ~ ${popup.endDate || '미지정'}
          </div>
          <div style="margin-top: 4px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; font-size: 0.8rem; color: var(--text-muted); line-height: 1.4;">
            ${escapeHtml(popup.content)}
          </div>
        </div>
        <div class="popup-item-actions">
          <button class="btn btn-secondary btn-sm btn-toggle-popup-active" data-pid="${popup.id}">
            <i class="fa-solid ${popup.isActive ? 'fa-eye-slash' : 'fa-eye'}"></i> ${popup.isActive ? '비활성화' : '활성화'}
          </button>
          <button class="btn btn-secondary btn-sm btn-edit-popup" data-pid="${popup.id}" style="border-color: rgba(6, 182, 212, 0.4); color: var(--accent-primary);">
            <i class="fa-solid fa-pen-to-square"></i> 수정
          </button>
          <button class="btn btn-secondary btn-sm btn-delete-popup" data-pid="${popup.id}" style="border-color: rgba(239, 68, 68, 0.4); color: #ef4444;">
            <i class="fa-solid fa-trash"></i> 삭제
          </button>
        </div>
      `;
      managerPopupsList.appendChild(card);
    });
    
    // Register actions
    document.querySelectorAll('.btn-toggle-popup-active').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pid = parseInt(e.target.closest('button').dataset.pid);
        togglePopupActive(pid);
      });
    });
    
    document.querySelectorAll('.btn-edit-popup').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pid = parseInt(e.target.closest('button').dataset.pid);
        loadPopupToForm(pid);
      });
    });
    
    document.querySelectorAll('.btn-delete-popup').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pid = parseInt(e.target.closest('button').dataset.pid);
        deletePopup(pid);
      });
    });
  };

  // Load popup to form for editing
  const loadPopupToForm = (pid) => {
    const popup = popups.find(p => p.id === pid);
    if (!popup) return;
    
    popupIdInput.value = popup.id;
    popupTitleInput.value = popup.title;
    popupContentInput.value = popup.content;
    popupImageInput.value = popup.imageUrl || '';
    popupLinkInput.value = popup.linkUrl || '';
    popupWidthInput.value = popup.width;
    popupHeightInput.value = popup.height;
    popupTopInput.value = popup.positionTop;
    popupLeftInput.value = popup.positionLeft;
    popupActiveInput.checked = popup.isActive;
    popupStartDateInput.value = popup.startDate || '';
    popupEndDateInput.value = popup.endDate || '';
    
    popupFormTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> 팝업창 정보 수정 (ID: ${popup.id})`;
    popupFormTitle.style.color = 'var(--accent-secondary)';
    
    // Scroll to form
    managerPopupForm.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Reset form
  const resetPopupForm = () => {
    if (!managerPopupForm) return;
    popupIdInput.value = '';
    managerPopupForm.reset();
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    const nextWeekDate = new Date();
    nextWeekDate.setDate(nextWeekDate.getDate() + 7);
    const nextWeek = nextWeekDate.toISOString().split('T')[0];
    
    if (popupStartDateInput) popupStartDateInput.value = today;
    if (popupEndDateInput) popupEndDateInput.value = nextWeek;
    
    popupFormTitle.innerHTML = `<i class="fa-solid fa-plus-circle"></i> 신규 팝업창 등록`;
    popupFormTitle.style.color = 'var(--accent-primary)';
  };
  
  if (btnPopupReset) {
    btnPopupReset.addEventListener('click', resetPopupForm);
  }

  // Save popup (Create or Update)
  if (managerPopupForm) {
    managerPopupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (activeUser.role !== 'admin') {
        alert('권한이 없습니다.');
        return;
      }
      
      const idVal = popupIdInput.value;
      const titleVal = popupTitleInput.value.trim();
      const contentVal = popupContentInput.value;
      const imageVal = popupImageInput.value.trim();
      const linkVal = popupLinkInput.value.trim();
      const startVal = popupStartDateInput.value;
      const endVal = popupEndDateInput.value;
      const widthVal = parseInt(popupWidthInput.value) || 380;
      const heightVal = parseInt(popupHeightInput.value) || 450;
      const topVal = parseInt(popupTopInput.value) || 120;
      const leftVal = parseInt(popupLeftInput.value) || 100;
      const activeVal = popupActiveInput.checked;
      
      if (startVal && endVal && startVal > endVal) {
        alert('게시 시작일은 게시 종료일보다 빨라야 합니다.');
        return;
      }
      
      if (idVal) {
        // Update
        const pid = parseInt(idVal);
        popups = popups.map(p => {
          if (p.id === pid) {
            return {
              ...p,
              title: titleVal,
              content: contentVal,
              imageUrl: imageVal,
              linkUrl: linkVal,
              startDate: startVal,
              endDate: endVal,
              width: widthVal,
              height: heightVal,
              positionTop: topVal,
              positionLeft: leftVal,
              isActive: activeVal
            };
          }
          return p;
        });
        alert('팝업창이 성공적으로 수정되었습니다.');
      } else {
        // Create
        const newPopup = {
          id: Date.now(),
          title: titleVal,
          content: contentVal,
          imageUrl: imageVal,
          linkUrl: linkVal,
          startDate: startVal,
          endDate: endVal,
          width: widthVal,
          height: heightVal,
          positionTop: topVal,
          positionLeft: leftVal,
          isActive: activeVal
        };
        popups.push(newPopup);
        alert('신규 팝업창이 등록되었습니다.');
      }
      
      localStorage.setItem('popups', JSON.stringify(popups));
      resetPopupForm();
      updateSessionUI();
    });
  }
  
  // Toggle Active
  const togglePopupActive = (pid) => {
    if (activeUser.role !== 'admin') return;
    popups = popups.map(p => {
      if (p.id === pid) {
        return { ...p, isActive: !p.isActive };
      }
      return p;
    });
    localStorage.setItem('popups', JSON.stringify(popups));
    updateSessionUI();
  };
  
  // Delete Popup
  const deletePopup = (pid) => {
    if (activeUser.role !== 'admin') return;
    if (!confirm('정말로 이 팝업창을 삭제하시겠습니까?')) return;
    popups = popups.filter(p => p.id !== pid);
    localStorage.setItem('popups', JSON.stringify(popups));
    
    // If the deleted popup was being edited, reset form
    if (popupIdInput.value && parseInt(popupIdInput.value) === pid) {
      resetPopupForm();
    }
    
    updateSessionUI();
  };

  // --- Render Online Applications List ---
  const renderApplicationsList = () => {
    if (activeUser.role !== 'admin') return;
    if (!applicationsTableBody) return;

    const apps = JSON.parse(localStorage.getItem('applications')) || [];
    const paginationAppsContainer = document.getElementById('pagination-manager-apps');

    if (apps.length === 0) {
      applicationsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-muted" style="text-align: center; padding: 40px 0;">접수된 온라인 간편 지원 신청이 없습니다.</td>
        </tr>
      `;
      if (paginationAppsContainer) paginationAppsContainer.innerHTML = '';
      return;
    }

    applicationsTableBody.innerHTML = '';
    
    // Sort applications by applied date descending (latest first)
    const sortedApps = [...apps].sort((a, b) => b.id - a.id);

    const totalAppsCount = sortedApps.length;
    const totalAppsPages = Math.ceil(totalAppsCount / appsPerPage);
    if (appsCurrentPage > totalAppsPages) appsCurrentPage = totalAppsPages;
    if (appsCurrentPage < 1) appsCurrentPage = 1;

    const startIndex = (appsCurrentPage - 1) * appsPerPage;
    const paginatedApps = sortedApps.slice(startIndex, startIndex + appsPerPage);

    paginatedApps.forEach(app => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-color)';
      tr.style.transition = 'background 0.2s ease';
      
      // Formatting date
      const padZero = (n) => String(n).padStart(2, '0');
      const d = new Date(app.appliedAt);
      const dateText = `${d.getFullYear()}.${padZero(d.getMonth() + 1)}.${padZero(d.getDate())} ${padZero(d.getHours())}:${padZero(d.getMinutes())}`;

      // Status badge
      let statusBadge = '';
      if (app.status === 'approved') {
        statusBadge = `<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> 승인 완료</span>`;
      } else if (app.status === 'rejected') {
        statusBadge = `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-xmark"></i> 반려됨</span>`;
      } else {
        statusBadge = `<span style="background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-clock"></i> 심사 대기</span>`;
      }

      // Actions buttons
      let actionButtons = '';
      if (app.status === 'pending') {
        actionButtons = `
          <button class="btn btn-primary btn-sm btn-approve-app" data-id="${app.id}" style="padding: 6px 12px; font-size: 0.75rem; background: var(--accent-success); border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-check"></i> 승인</button>
          <button class="btn btn-secondary btn-sm btn-reject-app" data-id="${app.id}" style="padding: 6px 12px; font-size: 0.75rem; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; margin-left: 4px;"><i class="fa-solid fa-xmark"></i> 반려</button>
        `;
      } else if (app.status === 'approved') {
        if (app.assignedConstructorId) {
          actionButtons = `
            <div style="font-size: 0.8rem; color: var(--accent-success); font-weight: 700; margin-bottom: 4px;">
              <i class="fa-solid fa-screwdriver-wrench"></i> 배정: ${escapeHtml(app.assignedConstructorName)}
            </div>
            <div style="font-size: 0.75rem; color: var(--text-secondary); margin-bottom: 6px;">
              상태: ${app.constructionStatus === 'before_construction' ? '시공 전' : (app.constructionStatus === 'in_construction' ? '시공 중' : (app.constructionStatus === 'after_construction' ? '시공 완료 보고됨' : '정산 종결'))}
            </div>
          `;
          if (app.constructionStatus === 'after_construction') {
            actionButtons += `
              <button class="btn btn-primary btn-sm btn-approve-settlement" data-id="${app.id}" style="padding: 6px 12px; font-size: 0.75rem; background: var(--accent-primary); border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; width: auto;"><i class="fa-solid fa-file-invoice-dollar"></i> 증빙확인/정산완료</button>
            `;
          }
        } else {
          // Constructor selection dropdown
          const constructors = users.filter(u => u.role === 'constructor');
          let optionsHtml = '<option value="">시공사 선택...</option>';
          constructors.forEach(c => {
            optionsHtml += `<option value="${c.id}">${c.businessName} (${c.constCode})</option>`;
          });
          actionButtons = `
            <div style="display: flex; gap: 4px; flex-direction: column; margin-bottom: 6px; width: 140px;">
              <select class="status-select select-constructor-assign" data-id="${app.id}" style="padding: 4px; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--border-color); background: white;">
                ${optionsHtml}
              </select>
              <button class="btn btn-primary btn-sm btn-assign-constructor" data-id="${app.id}" style="padding: 4px 8px; font-size: 0.72rem; background: var(--accent-success); border: none; border-radius: 4px; cursor: pointer; text-align: center;"><i class="fa-solid fa-link"></i> 시공사 배정</button>
            </div>
          `;
        }
      } else {
        actionButtons = `<span style="font-size: 0.8rem; color: var(--text-secondary);">처리 완료</span>`;
      }
      
      // Delete button (always visible for management)
      actionButtons += `
        <button class="btn btn-secondary btn-sm btn-delete-app" data-id="${app.id}" style="padding: 6px 10px; font-size: 0.75rem; border-color: rgba(239, 68, 68, 0.2); color: rgba(239, 68, 68, 0.8); background: transparent; border-radius: 6px; cursor: pointer; margin-left: 8px; transition: all 0.2s;" onmouseover="this.style.background='#fee2e2'; this.style.borderColor='rgba(239,68,68,0.4)';" onmouseout="this.style.background='transparent'; this.style.borderColor='rgba(239,68,68,0.2)';"><i class="fa-solid fa-trash-can"></i> 삭제</button>
      `;

      tr.innerHTML = `
        <td style="padding: 14px 16px; color: var(--text-secondary); font-family: monospace; white-space: nowrap;">${dateText}</td>
        <td style="padding: 14px 16px; font-weight: 600; color: var(--text-primary);">
          ${escapeHtml(app.ownerName)}
          <div style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary); margin-top: 2px;">${escapeHtml(app.ownerPhone)}</div>
        </td>
        <td style="padding: 14px 16px; font-weight: 600; color: var(--text-primary);">
          ${escapeHtml(app.storeName)}
          <div style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary); margin-top: 2px;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(app.storeAddress)}</div>
        </td>
        <td style="padding: 14px 16px; white-space: nowrap;"><span style="font-weight: 700; color: var(--accent-primary); border: 1px solid var(--border-color); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">${escapeHtml(app.signType === 'NEON' || app.signType === 'neon' || !app.signType ? '플렉스' : app.signType)}</span></td>
        <td style="padding: 14px 16px; color: var(--text-secondary); max-width: 130px; word-break: break-all;">
          <a href="${sanitizeUrl(app.fileData) || './초원식당 간판.png'}" download="${escapeHtml(app.fileName) || '첨부이미지.png'}" style="color: var(--accent-primary); font-weight: 600; text-decoration: underline; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;" title="클릭하여 다운로드">
            <i class="fa-solid fa-download"></i> ${escapeHtml(app.fileName) || '첨부이미지.png'}
          </a>
        </td>
        <td style="padding: 14px 16px; white-space: nowrap;">${statusBadge}</td>
        <td style="padding: 14px 16px; text-align: center; white-space: nowrap;">${actionButtons}</td>
      `;
      applicationsTableBody.appendChild(tr);
    });

    if (paginationAppsContainer) {
      paginationAppsContainer.innerHTML = renderPaginationControls(totalAppsCount, appsPerPage, appsCurrentPage, 'window.changeAppsPage');
    }

    // Add event listeners to the action buttons
    document.querySelectorAll('.btn-approve-app').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('button').dataset.id);
        updateApplicationStatus(id, 'approved');
      });
    });

    document.querySelectorAll('.btn-reject-app').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('button').dataset.id);
        updateApplicationStatus(id, 'rejected');
      });
    });

    document.querySelectorAll('.btn-delete-app').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('button').dataset.id);
        deleteApplication(id);
      });
    });

    document.querySelectorAll('.btn-assign-constructor').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('button').dataset.id);
        const tr = e.target.closest('tr');
        const select = tr.querySelector('.select-constructor-assign');
        const constId = select.value;
        if (!constId) {
          alert('배정할 시공업체를 선택해 주세요.');
          return;
        }
        const constUser = users.find(u => u.id === constId);
        if (!constUser) return;

        let apps = JSON.parse(localStorage.getItem('applications')) || [];
        apps = apps.map(app => {
          if (app.id === id) {
            return {
              ...app,
              assignedConstructorId: constId,
              assignedConstructorName: constUser.businessName,
              constructionStatus: 'before_construction'
            };
          }
          return app;
        });
        localStorage.setItem('applications', JSON.stringify(apps));
        alert(`시공업체 [${constUser.businessName}]가 성공적으로 배정되었습니다.`);
        updateSessionUI();
      });
    });

    document.querySelectorAll('.btn-approve-settlement').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('button').dataset.id);
        const apps = JSON.parse(localStorage.getItem('applications')) || [];
        const app = apps.find(a => a.id === id);
        
        let proofText = `[시공 완료 보고 증빙 검수]\n\n`;
        proofText += `상호명: ${app.storeName}\n`;
        proofText += `시공사: ${app.assignedConstructorName}\n`;
        proofText += `업로드된 시공 사진 수: ${app.constructionPhotos ? app.constructionPhotos.length : 0}장\n`;
        proofText += `업로드된 세금계산서 수: ${app.invoicePhotos ? app.invoicePhotos.length : 0}장\n\n`;
        proofText += `해당 시공 증빙을 검수하고 최종 정산을 종결하시겠습니까?`;

        if (confirm(proofText)) {
          let updatedApps = apps.map(a => {
            if (a.id === id) {
              return { ...a, constructionStatus: 'completed' };
            }
            return a;
          });
          localStorage.setItem('applications', JSON.stringify(updatedApps));
          alert('공사 증빙 검수가 통과되어 최종 정산 종결 처리되었습니다.');
          updateSessionUI();
        }
      });
    });
  };

  // --- Render Inquiries List (3초 간편 문의 접수 목록) ---
  const renderInquiriesList = () => {
    if (activeUser.role !== 'admin') return;
    const inquiriesTableBody = document.getElementById('inquiries-table-body');
    if (!inquiriesTableBody) return;

    const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
    const paginationInquiriesContainer = document.getElementById('pagination-manager-inquiries');

    if (inquiries.length === 0) {
      inquiriesTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-muted" style="text-align: center; padding: 40px 0;">접수된 간편 문의 내역이 없습니다.</td>
        </tr>
      `;
      if (paginationInquiriesContainer) paginationInquiriesContainer.innerHTML = '';
      return;
    }

    inquiriesTableBody.innerHTML = '';
    
    // Sort inquiries descending (latest first)
    const sortedInquiries = [...inquiries].sort((a, b) => {
      const timeA = new Date(a.submittedAt || 0).getTime();
      const timeB = new Date(b.submittedAt || 0).getTime();
      return timeB - timeA;
    });

    const totalInqCount = sortedInquiries.length;
    const totalInqPages = Math.ceil(totalInqCount / inquiriesPerPage);
    if (inquiriesCurrentPage > totalInqPages) inquiriesCurrentPage = totalInqPages;
    if (inquiriesCurrentPage < 1) inquiriesCurrentPage = 1;

    const startIndex = (inquiriesCurrentPage - 1) * inquiriesPerPage;
    const paginatedInquiries = sortedInquiries.slice(startIndex, startIndex + inquiriesPerPage);

    const typeMap = {
      'eligibility': '지원 대상/자격',
      'documents': '제출 서류/신청',
      'simulator': '시뮬레이터 사용법',
      'constructor': '시공업체 제휴',
      'other': '기타 일반 문의'
    };

    paginatedInquiries.forEach(inq => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-color)';
      tr.style.transition = 'background 0.2s ease';
      
      const padZero = (n) => String(n).padStart(2, '0');
      const d = new Date(inq.submittedAt || Date.now());
      const dateText = `${d.getFullYear()}.${padZero(d.getMonth() + 1)}.${padZero(d.getDate())} ${padZero(d.getHours())}:${padZero(d.getMinutes())}`;

      const typeLabel = typeMap[inq.type] || inq.type || '일반 문의';
      const isResolved = inq.status === 'resolved';

      const statusBadge = isResolved
        ? `<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> 상담 완료</span>`
        : `<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-clock"></i> 확인 대기</span>`;

      const actionButtons = `
        <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
          <button class="btn btn-sm btn-toggle-inquiry-status" data-id="${inq.id}" style="padding: 5px 10px; font-size: 0.75rem; background: ${isResolved ? '#f1f5f9' : 'var(--accent-success)'}; color: ${isResolved ? '#475569' : '#fff'}; border: 1px solid ${isResolved ? '#cbd5e1' : 'transparent'}; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
            <i class="fa-solid ${isResolved ? 'fa-rotate-left' : 'fa-check'}"></i> ${isResolved ? '대기로 변경' : '상담 완료'}
          </button>
          <button class="btn btn-sm btn-delete-inquiry" data-id="${inq.id}" style="padding: 5px 9px; font-size: 0.75rem; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 3px;">
            <i class="fa-solid fa-trash-can"></i> 삭제
          </button>
        </div>
      `;

      tr.innerHTML = `
        <td style="padding: 14px 16px; color: var(--text-secondary); font-family: monospace; white-space: nowrap;">${dateText}</td>
        <td style="padding: 14px 16px; font-weight: 600; color: var(--text-primary);">
          ${escapeHtml(inq.name)}
          <div style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary); margin-top: 2px;">
            <a href="tel:${escapeHtml(inq.phone)}" style="color: var(--accent-primary); text-decoration: none;"><i class="fa-solid fa-phone"></i> ${escapeHtml(inq.phone)}</a>
          </div>
        </td>
        <td style="padding: 14px 16px; white-space: nowrap;">
          <span style="background: rgba(99, 102, 241, 0.1); color: var(--accent-primary); border: 1px solid rgba(99, 102, 241, 0.2); padding: 3px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">${escapeHtml(typeLabel)}</span>
        </td>
        <td style="padding: 14px 16px; color: var(--text-primary); max-width: 320px; line-height: 1.4; word-break: break-word;">
          ${escapeHtml(inq.message)}
        </td>
        <td style="padding: 14px 16px; text-align: center; white-space: nowrap;">${statusBadge}</td>
        <td style="padding: 14px 16px; text-align: center; white-space: nowrap;">${actionButtons}</td>
      `;
      inquiriesTableBody.appendChild(tr);
    });

    if (paginationInquiriesContainer) {
      paginationInquiriesContainer.innerHTML = renderPaginationControls(totalInqCount, inquiriesPerPage, inquiriesCurrentPage, 'window.changeInquiriesPage');
    }

    // Event listeners
    document.querySelectorAll('.btn-toggle-inquiry-status').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        const currentInquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
        const target = currentInquiries.find(i => String(i.id) === String(id));
        if (target) {
          target.status = target.status === 'resolved' ? 'pending' : 'resolved';
          localStorage.setItem('inquiries', JSON.stringify(currentInquiries));
          if (window.SupabaseSync) {
            window.SupabaseSync.upsertInquiry(target);
          }
          renderInquiriesList();
        }
      });
    });

    document.querySelectorAll('.btn-delete-inquiry').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        if (!confirm('정말로 이 간편 문의 내역을 삭제하시겠습니까?')) return;
        let currentInquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
        currentInquiries = currentInquiries.filter(i => String(i.id) !== String(id));
        localStorage.setItem('inquiries', JSON.stringify(currentInquiries));
        if (window.SupabaseSync) {
          window.SupabaseSync.deleteInquiry(id);
        }
        renderInquiriesList();
      });
    });
  };

  const updateApplicationStatus = (id, newStatus) => {
    if (activeUser.role !== 'admin') return;
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    apps = apps.map(app => {
      if (app.id === id) {
        return { ...app, status: newStatus };
      }
      return app;
    });

    localStorage.setItem('applications', JSON.stringify(apps));
    alert(`지원 신청 상태가 [${newStatus === 'approved' ? '승인 완료' : '반려됨'}] 상태로 변경되었습니다.`);
    updateSessionUI();
  };

  const deleteApplication = (id) => {
    if (activeUser.role !== 'admin') return;
    if (!confirm('정말로 이 지원 신청 접수 건을 삭제하시겠습니까?')) return;
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    apps = apps.filter(app => app.id !== id);
    localStorage.setItem('applications', JSON.stringify(apps));
    updateSessionUI();
  };

  const deleteOwnApplication = (id) => {
    if (!confirm('정말로 이 지원 신청을 취소하고 신청 내역을 삭제하시겠습니까?')) return;
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    apps = apps.filter(app => app.id !== id);
    localStorage.setItem('applications', JSON.stringify(apps));
    alert('신청이 취소되고 신청 내역이 삭제되었습니다.');
    updateSessionUI();
  };

  // --- Render User's Own Online Applications List ---
  const renderUserApplicationsList = () => {
    if (!userApplicationsTableBody) return;

    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    let updated = false;

    // Migrate/update applications without userId or with 'guest' userId if they match the current user's phone or name
    apps = apps.map(app => {
      const isGuestOrMissing = !app.userId || app.userId === 'guest';
      if (isGuestOrMissing) {
        const appPhone = app.ownerPhone || '';
        const userPhone = activeUser.phone || '';
        const cleanAppPhone = appPhone.replace(/[^0-9]/g, '');
        const cleanUserPhone = userPhone.replace(/[^0-9]/g, '');
        
        const isPhoneMatch = cleanAppPhone && cleanAppPhone === cleanUserPhone;
        const isNameMatch = app.ownerName && app.ownerName === activeUser.name;
        
        if (isPhoneMatch || isNameMatch) {
          app.userId = activeUser.id;
          updated = true;
        }
      }
      return app;
    });

    if (updated) {
      localStorage.setItem('applications', JSON.stringify(apps));
    }

    // Filter by the active user's ID
    const myApps = apps.filter(app => app.userId === activeUser.id);

    if (myApps.length === 0) {
      userApplicationsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-muted" style="text-align: center; padding: 30px 0;">내가 접수한 온라인 간편 지원 신청 내역이 없습니다.</td>
        </tr>
      `;
      return;
    }

    userApplicationsTableBody.innerHTML = '';
    
    // Sort my applications by applied date descending (latest first)
    const sortedMyApps = [...myApps].sort((a, b) => b.id - a.id);

    sortedMyApps.forEach(app => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-color)';
      tr.style.transition = 'background 0.2s ease';
      
      // Formatting date
      const dateText = new Date(app.appliedAt).toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });

      // Status badge
      let statusBadge = '';
      if (app.status === 'approved') {
        if (app.constructionStatus === 'before_construction') {
          statusBadge = `<span style="background: #e2e8f0; color: #475569; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-link"></i> 시공사 배정 (시공 전)</span>`;
        } else if (app.constructionStatus === 'in_construction') {
          statusBadge = `<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-screwdriver-wrench"></i> 시공 진행 중</span>`;
        } else if (app.constructionStatus === 'after_construction') {
          statusBadge = `<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-spinner fa-spin"></i> 시공 완료 (검수 중)</span>`;
        } else if (app.constructionStatus === 'completed') {
          statusBadge = `<span style="background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-file-invoice-dollar"></i> 정산 종결 (최종 완료)</span>`;
        } else {
          statusBadge = `<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> 승인 완료</span>`;
        }
      } else if (app.status === 'rejected') {
        statusBadge = `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-xmark"></i> 반려됨</span>`;
      } else {
        statusBadge = `<span style="background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-clock"></i> 심사 대기</span>`;
      }

      tr.innerHTML = `
        <td style="padding: 12px 16px; color: var(--text-secondary); font-family: monospace;">${dateText}</td>
        <td style="padding: 12px 16px; font-weight: 600; color: var(--text-primary);">${escapeHtml(app.ownerName)}</td>
        <td style="padding: 12px 16px; font-weight: 600; color: var(--text-primary);">
          ${escapeHtml(app.storeName)}
          <div style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary); margin-top: 2px;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(app.storeAddress)}</div>
        </td>
        <td style="padding: 12px 16px;"><span style="font-weight: 700; color: var(--accent-primary); border: 1px solid var(--border-color); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">${escapeHtml(app.signType === 'NEON' || app.signType === 'neon' || !app.signType ? '플렉스' : app.signType)}</span></td>
        <td style="padding: 12px 16px; color: var(--text-secondary); max-width: 130px; word-break: break-all;">
          <a href="${sanitizeUrl(app.fileData) || './초원식당 간판.png'}" download="${escapeHtml(app.fileName) || '첨부이미지.png'}" style="color: var(--accent-primary); font-weight: 600; text-decoration: underline; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;" title="클릭하여 다운로드">
            <i class="fa-solid fa-download"></i> ${escapeHtml(app.fileName) || '첨부이미지.png'}
          </a>
        </td>
        <td style="padding: 12px 16px;">${statusBadge}</td>
        <td style="padding: 12px 16px; text-align: center;">
          <button class="btn btn-secondary btn-sm btn-cancel-own-app" data-id="${app.id}" style="padding: 5px 10px; font-size: 0.72rem; border-color: rgba(239, 68, 68, 0.3); color: rgba(239, 68, 68, 0.7); background: transparent; border-radius: 6px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#fee2e2'; this.style.borderColor='rgba(239,68,68,0.5)';" onmouseout="this.style.background='transparent'; this.style.borderColor='rgba(239,68,68,0.3)';"><i class="fa-solid fa-trash-can"></i> 취소</button>
        </td>
      `;
      userApplicationsTableBody.appendChild(tr);
    });

    // Add click listeners to cancel buttons
    document.querySelectorAll('.btn-cancel-own-app').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('button').dataset.id);
        deleteOwnApplication(id);
      });
    });
  };

  // --- Visitor Tracking Logic ---
  const trackVisitor = () => {
    // Initialize defaults if they don't exist
    if (localStorage.getItem('visitor_total') === null) {
      localStorage.setItem('visitor_total', '1420');
    }
    if (localStorage.getItem('visitor_today') === null) {
      localStorage.setItem('visitor_today', '34');
    }
    if (localStorage.getItem('visitor_last_date') === null) {
      localStorage.setItem('visitor_last_date', new Date().toISOString().split('T')[0]);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let totalCount = parseInt(localStorage.getItem('visitor_total')) || 1420;
    let todayCount = parseInt(localStorage.getItem('visitor_today')) || 34;
    const lastDate = localStorage.getItem('visitor_last_date');

    // Count session-based
    if (!sessionStorage.getItem('visitor_session_counted')) {
      sessionStorage.setItem('visitor_session_counted', 'true');
      totalCount++;
      if (lastDate === todayStr) {
        todayCount++;
      } else {
        todayCount = 1;
        localStorage.setItem('visitor_last_date', todayStr);
      }
      localStorage.setItem('visitor_total', totalCount.toString());
      localStorage.setItem('visitor_today', todayCount.toString());
    }
  };

  // --- Render Admin Dashboard Metrics ---
  const renderAdminStats = () => {
    if (activeUser.role !== 'admin') return;
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('visitor_last_date');
    let todayCount = localStorage.getItem('visitor_today') || '34';
    
    // Reset today's count on new day
    if (lastDate !== todayStr) {
      todayCount = '0';
      localStorage.setItem('visitor_today', '0');
      localStorage.setItem('visitor_last_date', todayStr);
    }
    
    const totalCount = localStorage.getItem('visitor_total') || '1420';
    const apps = JSON.parse(localStorage.getItem('applications')) || [];

    const statToday = document.getElementById('stat-today-visitors');
    const statTotal = document.getElementById('stat-total-visitors');
    const statApps = document.getElementById('stat-total-applications');

    if (statToday) statToday.textContent = parseInt(todayCount).toLocaleString() + '명';
    if (statTotal) statTotal.textContent = parseInt(totalCount).toLocaleString() + '명';
    if (statApps) statApps.textContent = apps.length + '건';
  };

  // Track current visit on page load
  trackVisitor();

  // --- Constructor Dashboard & Jobs Management ---
  const renderConstructorDashboard = () => {
    if (!constructorJobsTableBody) return;
    constructorJobsTableBody.innerHTML = '';

    const apps = JSON.parse(localStorage.getItem('applications')) || [];
    const myJobs = apps.filter(app => app.assignedConstructorId === activeUser.id && app.status === 'approved');

    if (myJobs.length === 0) {
      constructorJobsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-muted" style="text-align: center; padding: 40px 0;">배정된 시공 물건이 없습니다.</td>
        </tr>
      `;
      return;
    }

    myJobs.forEach(job => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid #cbd5e1';

      const dateText = job.createdAt ? new Date(job.createdAt).toLocaleString('ko-KR', { hour12: false }) : '-';
      
      let statusBadge = '';
      if (job.constructionStatus === 'before_construction') {
        statusBadge = '<span style="background: #e2e8f0; color: #475569; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">시공 전</span>';
      } else if (job.constructionStatus === 'in_construction') {
        statusBadge = '<span style="background: #fef3c7; color: #92400e; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">시공 진행 중</span>';
      } else if (job.constructionStatus === 'after_construction') {
        statusBadge = '<span style="background: #dcfce7; color: #166534; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">완료 보고됨</span>';
      } else if (job.constructionStatus === 'completed') {
        statusBadge = '<span style="background: #dbeafe; color: #1e40af; padding: 4px 8px; border-radius: 4px; font-weight: 700; font-size: 0.75rem;">정산 종결</span>';
      }

      // Upload/Report actions column
      let actionsHtml = '';
      if (job.constructionStatus === 'completed') {
        actionsHtml = '<span style="color: var(--text-muted); font-size: 0.8rem;">정산 완료 및 검수 종결</span>';
      } else {
        actionsHtml = `
          <div style="display: flex; flex-direction: column; gap: 8px; align-items: center; padding: 8px;">
            <div style="display: flex; gap: 8px; width: 100%;">
              <div style="flex: 1; text-align: left;">
                <label style="font-size: 0.7rem; font-weight: 700; display: block; margin-bottom: 2px;">시공 사진 (${job.constructionPhotos ? job.constructionPhotos.length : 0}/20)</label>
                <input type="file" class="const-photo-input" data-id="${job.id}" accept="image/*" multiple style="font-size: 0.7rem; width: 100%;">
              </div>
              <div style="flex: 1; text-align: left;">
                <label style="font-size: 0.7rem; font-weight: 700; display: block; margin-bottom: 2px;">정산서/계산서</label>
                <input type="file" class="const-invoice-input" data-id="${job.id}" accept="image/*,application/pdf" style="font-size: 0.7rem; width: 100%;">
              </div>
            </div>
            
            <div style="display: flex; gap: 8px; width: 100%; justify-content: flex-end; margin-top: 4px;">
              <select class="status-select select-const-status" data-id="${job.id}" style="padding: 4px; font-size: 0.75rem; border-radius: 4px; border: 1px solid var(--border-color); background: white;">
                <option value="before_construction" ${job.constructionStatus === 'before_construction' ? 'selected' : ''}>시공 전</option>
                <option value="in_construction" ${job.constructionStatus === 'in_construction' ? 'selected' : ''}>시공 중</option>
              </select>
              <button class="btn btn-primary btn-sm btn-report-job-complete" data-id="${job.id}" style="padding: 4px 8px; font-size: 0.72rem; background: var(--accent-success); border: none; border-radius: 4px; cursor: pointer; color: white;"><i class="fa-solid fa-paper-plane"></i> 시공 완료 보고</button>
            </div>
          </div>
        `;
      }

      tr.innerHTML = `
        <td style="padding: 12px 16px; color: var(--text-secondary); font-family: monospace;">${dateText}</td>
        <td style="padding: 12px 16px; font-weight: 600;">
          ${escapeHtml(job.storeName)}
          <div style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary); margin-top: 2px;"><i class="fa-solid fa-phone"></i> ${escapeHtml(job.ownerPhone)}</div>
        </td>
        <td style="padding: 12px 16px; color: var(--text-secondary);">${escapeHtml(job.storeAddress)}</td>
        <td style="padding: 12px 16px;"><span style="font-weight: 700; color: var(--accent-primary); border: 1px solid var(--border-color); padding: 2px 6px; border-radius: 4px; font-size: 0.75rem;">${escapeHtml(job.signType === 'NEON' || job.signType === 'neon' || !job.signType ? '플렉스' : job.signType)}</span></td>
        <td style="padding: 12px 16px; text-align: center;">${statusBadge}</td>
        <td style="padding: 12px 16px; text-align: center;">${actionsHtml}</td>
      `;
      constructorJobsTableBody.appendChild(tr);
    });

    // Add listeners
    document.querySelectorAll('.select-const-status').forEach(select => {
      select.addEventListener('change', (e) => {
        const id = parseInt(e.target.dataset.id);
        const val = e.target.value;
        updateJobConstructionStatus(id, val);
      });
    });

    document.querySelectorAll('.btn-report-job-complete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = parseInt(e.target.closest('button').dataset.id);
        reportJobCompletion(id);
      });
    });

    document.querySelectorAll('.const-photo-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const id = parseInt(e.target.dataset.id);
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          await handleJobPhotoUpload(id, files);
        }
      });
    });

    document.querySelectorAll('.const-invoice-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const id = parseInt(e.target.dataset.id);
        const file = e.target.files[0];
        if (file) {
          await handleJobInvoiceUpload(id, file);
        }
      });
    });
  };

  const updateJobConstructionStatus = (id, val) => {
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    apps = apps.map(app => {
      if (app.id === id) {
        return { ...app, constructionStatus: val };
      }
      return app;
    });
    localStorage.setItem('applications', JSON.stringify(apps));
    renderConstructorDashboard();
  };

  const handleJobPhotoUpload = async (id, files) => {
    const limit = 3 * 1024 * 1024;
    const uploadedUrls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      let processedFile = file;
      if (file.size > limit) {
        processedFile = await resizeImageToLimit(file, limit);
      }
      uploadedUrls.push(URL.createObjectURL(processedFile));
    }

    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    apps = apps.map(app => {
      if (app.id === id) {
        const existing = app.constructionPhotos || [];
        const merged = existing.concat(uploadedUrls).slice(0, 20);
        return { ...app, constructionPhotos: merged };
      }
      return app;
    });
    localStorage.setItem('applications', JSON.stringify(apps));
    alert('시공 현장 사진이 업로드되었습니다.');
    renderConstructorDashboard();
  };

  const handleJobInvoiceUpload = async (id, file) => {
    const limit = 3 * 1024 * 1024;
    let processedFile = file;
    if (file.size > limit) {
      processedFile = await resizeImageToLimit(file, limit);
    }
    const url = URL.createObjectURL(processedFile);

    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    apps = apps.map(app => {
      if (app.id === id) {
        const existing = app.invoicePhotos || [];
        existing.push(url);
        return { ...app, invoicePhotos: existing };
      }
      return app;
    });
    localStorage.setItem('applications', JSON.stringify(apps));
    alert('정산용 세금계산서/증빙서류가 업로드되었습니다.');
    renderConstructorDashboard();
  };

  const reportJobCompletion = (id) => {
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    const app = apps.find(a => a.id === id);

    if (!app.constructionPhotos || app.constructionPhotos.length === 0) {
      alert('최소 1장 이상의 시공 현장 사진을 등록해 주세요.');
      return;
    }
    if (!app.invoicePhotos || app.invoicePhotos.length === 0) {
      alert('세금계산서 또는 지출 영수증 증빙 서류를 등록해 주세요.');
      return;
    }

    apps = apps.map(a => {
      if (a.id === id) {
        return { 
          ...a, 
          constructionStatus: 'after_construction',
          constructionCompletedAt: Date.now()
        };
      }
      return a;
    });
    localStorage.setItem('applications', JSON.stringify(apps));
    alert('시공 완료 보고서와 증빙 제출이 정상 접수되었습니다!\n최고 관리자 검수 완료 시 정산 종결 처리됩니다.');
    renderConstructorDashboard();
  };

  // Initial Sync
  updateSessionUI();
  resetPopupForm();
});

// ==========================================
// PWA & Mobile App Installation Logic
// ==========================================
let globalDashDeferredPrompt = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    globalDashDeferredPrompt = e;
    const pwaInstallBtn = document.getElementById('pwa-install-btn');
    if (pwaInstallBtn) {
      pwaInstallBtn.style.display = 'flex';
    }
  });
}

function initPWA() {
  // Service Worker Registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => {
        reg.update();
        console.log('Service Worker registered and updated:', reg.scope);
      })
      .catch((err) => console.warn('Service Worker registration failed:', err));
  }

  // UI Elements
  const installModal = document.getElementById('install-modal');
  const btnClose = document.getElementById('install-modal-close');
  const btnNav = document.getElementById('nav-install-app');
  const qrImg = document.getElementById('install-qr-img');
  const qrSection = document.getElementById('install-qr-section');
  const pwaInstallBtn = document.getElementById('pwa-install-btn');
  const pwaShareBtn = document.getElementById('pwa-share-btn');
  const pwaShortcutBtn = document.getElementById('pwa-shortcut-btn');

  if (globalDashDeferredPrompt && pwaInstallBtn) {
    pwaInstallBtn.style.display = 'flex';
  }

  if (!installModal) return;

  // Open Modal Logic (Website Custom Modal)
  const openModal = (e) => {
    if (e) e.preventDefault();
    
    if (qrImg) {
      qrImg.onerror = () => {
        qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Fganpans.com%2Fapp';
      };
      qrImg.src = './ganpan-app-qr.png?v=20260817';
    }
    if (qrSection) {
      qrSection.style.display = 'flex';
    }

    installModal.classList.add('active');
  };

  if (btnNav) btnNav.addEventListener('click', openModal);

  const closeModal = () => {
    installModal.classList.remove('active');
  };

  if (btnClose) btnClose.addEventListener('click', closeModal);
  installModal.addEventListener('click', (e) => {
    if (e.target === installModal) closeModal();
  });

  if (pwaShortcutBtn) {
    pwaShortcutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      
      if (globalDashDeferredPrompt) {
        globalDashDeferredPrompt.prompt();
        globalDashDeferredPrompt.userChoice.then((choiceResult) => {
          if (choiceResult.outcome === 'accepted') {
            alert('🎉 간판지원단 홈 화면 바로가기 버튼이 바탕화면에 추가되었습니다!');
          }
          globalDashDeferredPrompt = null;
        });
      } else {
        const userAgent = navigator.userAgent || '';
        const isKakao = /KAKAOTALK/i.test(userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;

        if (isKakao) {
          location.href = 'intent://ganpans.com/app#Intent;scheme=https;package=com.android.chrome;end';
          return;
        }

        if (isIOS) {
          alert("📲 [아이폰 홈 화면 버튼 생성 방법]\n\n하단 중앙 '공유' 버튼(네모+화살표) ➡️ '홈 화면에 추가 (+)' ➡️ 오른쪽 위 [추가]를 누르시면 바탕화면에 바로 버튼이 만들어집니다!");
        } else {
          alert("📲 [스마트폰 홈 화면 버튼 생성 방법]\n\n화면 오른쪽 위 점3개(⋮) 메뉴 ➡️ '홈 화면에 추가' 또는 '앱 설치' ➡️ [추가]를 누르시면 바탕화면에 바로 버튼이 만들어집니다!");
        }
      }
    });
  }

  if (pwaInstallBtn) {
    pwaInstallBtn.addEventListener('click', () => {
      if (!globalDashDeferredPrompt) return;
      pwaInstallBtn.disabled = true;
      globalDashDeferredPrompt.prompt();
      globalDashDeferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA installation accepted by user');
        }
        globalDashDeferredPrompt = null;
        pwaInstallBtn.style.display = 'none';
        pwaInstallBtn.disabled = false;
      });
    });
  }

  if (pwaShareBtn) {
    pwaShareBtn.addEventListener('click', () => {
      const shareData = {
        title: '간판지원단 - 경기도 소상공인 지원사업 앱',
        text: '스마트폰 앱으로 언제 어디서든 편리하게 간판 시뮬레이터와 간편 지원금 신청을 이용해 보세요.',
        url: 'https://ganpans.com/app'
      };

      if (navigator.share) {
        navigator.share(shareData)
          .then(() => console.log('PWA link shared successfully'))
          .catch((err) => console.log('Error sharing PWA link:', err));
      } else {
        const shareUrl = 'https://ganpans.com/app';
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            alert('간판지원단 모바일 앱 공유 링크(https://ganpans.com/app)가 복사되었습니다.\n카카오톡이나 문자메시지로 붙여넣어 전송해 보세요!');
          })
          .catch((err) => {
            console.error('Failed to copy share link:', err);
            alert('공유 링크: ' + shareUrl);
          });
      }
    });
  }
}

document.addEventListener('DOMContentLoaded', initPWA);

// --- Realtime synchronization via storage event ---
window.addEventListener('storage', (e) => {
  if (['applications', 'users', 'popups', 'activeUser'].includes(e.key)) {
    if (typeof updateSessionUI === 'function') updateSessionUI();
    if (typeof renderDashboard === 'function') renderDashboard();
  }
});

// --- Initialize AI Assistant ---
document.addEventListener('DOMContentLoaded', initAIAssistant);

function initAIAssistant() {
  const trigger = document.getElementById('ai-assistant-trigger');
  const chatWindow = document.getElementById('ai-chat-window');
  const closeBtn = document.getElementById('ai-chat-close');
  const sendBtn = document.getElementById('ai-chat-send');
  const chatInput = document.getElementById('ai-chat-input');
  const chatMessages = document.getElementById('ai-chat-messages');

  if (!trigger || !chatWindow) return;

  // Toggle Chat Window
  trigger.addEventListener('click', () => {
    chatWindow.classList.add('active');
    trigger.style.display = 'none';
    chatInput.focus();
  });

  closeBtn.addEventListener('click', () => {
    chatWindow.classList.remove('active');
    trigger.style.display = 'flex';
  });

  // Handle Quick Reply Clicks
  chatMessages.addEventListener('click', (e) => {
    const btn = e.target.closest('.quick-reply-btn');
    if (btn) {
      const faqType = btn.getAttribute('data-faq');
      const question = btn.innerText;
      handleUserMessage(question, faqType);
    }
  });

  // Send Message
  function sendMessage() {
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    handleUserMessage(text);
  }

  sendBtn.addEventListener('click', sendMessage);
  chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  });

  const faqDatabase = {
    target: "💡 <strong>지원 대상 및 자격 기준</strong><br><br>" +
        "• <strong>대상자</strong>: 공고일 현재 경기도 내에 사업장을 두고 영업 중인 <strong>창업 3년 이상</strong>(사업자등록 기준) 소상공인 사업자입니다.<br>" +
        "• <strong>소상공인 상시 근로자 기준</strong>:<br>" +
        "  - 도소매업, 음식점, 숙박업, 서비스업: 5인 미만<br>" +
        "  - 광업, 제조업, 건설업, 운수업: 10인 미만<br>" +
        "• <strong>지원 제외 대상</strong>: 대기업 프랜차이즈 직영점, 사치향락 업종(유흥주점 등), 무등록/휴폐업자, 지방세 체납자, 최근 3년 이내 경기도 및 시·군 유사 지원사업 수혜자는 신청할 수 없습니다.",
    amount: "💰 <strong>지원 금액 및 품목 안내</strong><br><br>" +
        "• <strong>지원 한도</strong>: 업체당 <strong>최대 200만원 한도</strong> (공급가의 100% 지원, 부가세 10% 및 200만원 초과 금액은 본인 부담)<br>" +
        "  * 예: 견적서 공급가액이 220만원인 경우, 지원금 200만원 + 본인부담 20만원 + 부가세 별도 납부<br>" +
        "• <strong>지원 품목</strong>: 간판(불법 간판 제외), 썬팅, 투광기 중 <strong>최대 2개 품목 이하</strong> 선택 가능<br>" +
        "• <strong>시공 주의사항</strong>: 반드시 <strong>선정 후 견적서 승인</strong>을 먼저 받은 다음 시공을 진행해야 합니다. 승인 전 <strong>사전 시공 시 지원 대상에서 제외(선정 취소)</strong>되므로 절대 주의 바랍니다.",
    documents: "📄 <strong>제출 서류 안내</strong><br><br>" +
        "• <strong>필수 기본 서류</strong>:<br>" +
        "  1. 신청서 및 추진계획서 (점포 사진 첨부 필수)<br>" +
        "  2. 개인신용정보 제공 동의서<br>" +
        "  3. 시공계획서<br>" +
        "• <strong>증빙 서류 (※ 경기바로 공공마이데이터 간편 신청 동의 시 제출 생략 가능)</strong>:<br>" +
        "  4. 사업자등록증 사본 1부<br>" +
        "  5. 최근 2개년 부가세 과세표준증명원(또는 면세사업자 수입금액증명원)<br>" +
        "  6. 소득금액증명원 (직전년도 기준)<br>" +
        "• <strong>가점 증빙 (해당자만 제출)</strong>: 표창장(도지사 등), 자영업아카데미 수료증, 취약계층 증명서 등",
    schedule: "📅 <strong>접수 일정 및 방법 안내</strong><br><br>" +
        "• <strong>접수 기간</strong>: <strong>2026. 3. 31(화) ~ 4. 13(월) 18:00까지</strong> (공고는 3. 18 발표)<br>" +
        "• <strong>신청 방법</strong>:<br>" +
        "  - <strong>온라인 신청</strong>: 경기바로 홈페이지(www.ggbaro.kr)에서 공공마이데이터 연동 접수<br>" +
        "  - <strong>방문 신청</strong>: 경기도시장상권진흥원(경상원) 각 지역센터 영업시간 내 방문 접수 (제출 서류 상담 가능)<br>" +
        "  - <strong>※ 주의</strong>: 우편 신청 및 온/오프라인 중복 신청은 불가능합니다. 1인 1건만 신청 가능합니다.",
    contact: "📞 <strong>문의처 및 접수 지역센터</strong><br><br>" +
        "• <strong>경상원 종합상담 콜센터</strong>: <strong>☎ 1600-8001</strong> (평일 09:00 ~ 18:00)<br>" +
        "• <strong>지역센터별 관할 구역</strong>:<br>" +
        "  - 남부센터(수원 소재): 수원, 용인, 군포, 의왕, 과천<br>" +
        "  - 남부센터(화성 소재): 화성, 오산, 평택, 안성<br>" +
        "  - 남동센터(광주 소재): 광주, 성남, 여주, 이천<br>" +
        "  - 남서센터(시흥 소재): 시흥, 안양, 안산, 광명, 부천<br>" +
        "  - 북부센터(남양주 소재): 남양주, 의정부, 포천, 구리, 가평, 하남, 양평<br>" +
        "  - 북서센터(파주 소재): 파주, 고양, 양주, 동두천, 연천, 김포"
  };

  function handleUserMessage(messageText, faqType = null) {
    // 1. Add User Message
    appendMessage(messageText, 'user');

    // Remove quick replies section if present to avoid screen cluttering
    const quickReplies = chatMessages.querySelector('.ai-quick-replies');
    if (quickReplies) {
      quickReplies.remove();
    }

    // 2. Add Loading Indicator
    const loadingId = appendLoading();

    // 3. Simulate Thinking & Respond
    setTimeout(() => {
      removeLoading(loadingId);
      
      let response = "";
      if (faqType && faqDatabase[faqType]) {
        response = faqDatabase[faqType];
      } else {
        // Keyword match logic
        const cleaned = messageText.toLowerCase().replace(/\s+/g, '');
        if (cleaned.includes('대상') || cleaned.includes('조건') || cleaned.includes('자격') || cleaned.includes('제한') || cleaned.includes('제외') || cleaned.includes('누가') || cleaned.includes('기준')) {
          response = faqDatabase.target;
        } else if (cleaned.includes('금액') || cleaned.includes('한도') || cleaned.includes('비용') || cleaned.includes('얼마') || cleaned.includes('지원금') || cleaned.includes('썬팅') || cleaned.includes('투광기') || cleaned.includes('인테리어')) {
          response = faqDatabase.amount;
        } else if (cleaned.includes('서류') || cleaned.includes('준비') || cleaned.includes('제출') || cleaned.includes('증명원') || cleaned.includes('동의서')) {
          response = faqDatabase.documents;
        } else if (cleaned.includes('일정') || cleaned.includes('기간') || cleaned.includes('날짜') || cleaned.includes('언제') || cleaned.includes('방법') || cleaned.includes('접수') || cleaned.includes('신청')) {
          response = faqDatabase.schedule;
        } else if (cleaned.includes('센터') || cleaned.includes('전화') || cleaned.includes('콜센터') || cleaned.includes('번호') || cleaned.includes('문의') || cleaned.includes('주소') || cleaned.includes('경상원')) {
          response = faqDatabase.contact;
        } else if (cleaned.includes('안녕')) {
          response = "안녕하세요! 경기도 소상공인 경영환경개선사업 AI비서입니다. 😊 무엇이든 물어보세요.<br><br>💡 <strong>예시 질문 키워드</strong>:<br>• '지원 자격', '제외 대상'<br>• '지원 금액', '신청 비용'<br>• '필수 서류', '공공마이데이터'<br>• '신청 일정', '접수 방법'<br>• '고객센터', '지역센터 전화번호'";
        } else {
          response = "죄송합니다. 질문하신 내용에 대한 정확한 정보를 찾지 못했습니다. 😢<br><br>아래 주요 지원사업 키워드를 참고하여 간략히 질문해 주시면 상세히 답변해 드릴 수 있습니다!<br><br>• <strong>'지원 자격'</strong> (창업 3년 이상 소상공인 여부)<br>• <strong>'지원 금액'</strong> (최대 200만원 한도 및 품목)<br>• <strong>'필수 서류'</strong> (제출 생략 가능 서류 등)<br>• <strong>'신청 일정'</strong> (3월 31일 ~ 4월 13일 일정)<br>• <strong>'고객센터'</strong> (대표번호 1600-8001 및 지역센터)";
        }
      }

      appendMessage(response, 'bot');
      
      // Re-append quick replies at the bottom so user can click other options
      appendQuickReplies();
      
    }, 800);
  }

  function appendMessage(text, sender) {
    const bubble = document.createElement('div');
    bubble.className = `chat-bubble ${sender}-message`;
    bubble.innerHTML = text;
    chatMessages.appendChild(bubble);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function appendLoading() {
    const loading = document.createElement('div');
    const id = 'loading-' + Date.now();
    loading.id = id;
    loading.className = 'chat-bubble bot-message chat-loading';
    loading.innerHTML = '<span></span><span></span><span></span>';
    chatMessages.appendChild(loading);
    chatMessages.scrollTop = chatMessages.scrollHeight;
    return id;
  }

  function removeLoading(id) {
    const elem = document.getElementById(id);
    if (elem) elem.remove();
  }

  function appendQuickReplies() {
    const div = document.createElement('div');
    div.className = 'ai-quick-replies';
    div.innerHTML = `
      <button class="quick-reply-btn" data-faq="target">💡 지원 자격 및 대상</button>
      <button class="quick-reply-btn" data-faq="amount">💰 지원 금액 및 품목</button>
      <button class="quick-reply-btn" data-faq="documents">📄 필수 제출 서류</button>
      <button class="quick-reply-btn" data-faq="schedule">📅 신청 일정 및 방법</button>
      <button class="quick-reply-btn" data-faq="contact">📞 고객센터 및 문의처</button>
    `;
    chatMessages.appendChild(div);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // --- 비회원 간편 문의 모달 연동 ---
  const inquiryModal = document.getElementById('inquiry-modal');
  const inquiryModalClose = document.getElementById('inquiry-modal-close');
  const inquiryForm = document.getElementById('inquiry-form');

  function closeInquiryModal() {
    if (inquiryModal) {
      inquiryModal.classList.remove('active');
      if (inquiryForm) inquiryForm.reset();
      const cnt = document.getElementById('inquiry-char-count');
      if (cnt) cnt.textContent = '0';
    }
  }

  window.openInquiryModal = function(e) {
    if (e) e.preventDefault();
    if (inquiryModal) {
      inquiryModal.classList.add('active');
    }
  };

  if (inquiryModalClose) {
    inquiryModalClose.addEventListener('click', closeInquiryModal);
  }

  // 하단 닫기 단추들도 클릭 핸들러 연동
  const extraInquiryCloseBtns = document.querySelectorAll('.inquiry-close-x-btn');
  extraInquiryCloseBtns.forEach(btn => {
    btn.addEventListener('click', closeInquiryModal);
  });

  if (inquiryModal) {
    inquiryModal.addEventListener('click', (e) => {
      if (e.target === inquiryModal) {
        closeInquiryModal();
      }
    });
  }

  if (inquiryForm && !inquiryForm.dataset.inquiryBound) {
    inquiryForm.dataset.inquiryBound = 'true';
    inquiryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = escapeHtml(document.getElementById('inquiry-name').value.trim());
      const phone = escapeHtml(document.getElementById('inquiry-phone').value.trim());
      const type = document.getElementById('inquiry-type').value;
      const message = escapeHtml(document.getElementById('inquiry-message').value.trim());

      if (!name || !phone || !type || !message) {
        alert('필수 입력 항목을 모두 작성해 주세요.');
        return;
      }

      // 성함 유효성 검사 (최소 2자 ~ 최대 20자)
      if (name.length < 2 || name.length > 20) {
        alert('성함은 최소 2자에서 최대 20자까지 입력해 주세요.');
        return;
      }

      // 연락처 유효성 검사 (최소 9자 ~ 최대 15자)
      if (phone.length < 9 || phone.length > 15) {
        alert('연락처는 최소 9자에서 최대 15자까지 입력해 주세요.');
        return;
      }

      // 연락처 형식 정규식 검증
      const phoneRegex = /^[0-9+\s-]+$/;
      if (!phoneRegex.test(phone)) {
        alert('연락처에는 숫자, 대시(-), 플러스(+) 및 공백만 입력할 수 있습니다.');
        return;
      }

      // 문의내용 글자수 유효성 검사 (최대 300자)
      if (message.length > 300) {
        alert('문의 내용은 최대 300자까지 입력해 주세요.');
        return;
      }

      const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
      const newInquiry = {
        id: 'INQ-' + Date.now(),
        name,
        phone,
        type,
        message,
        submittedAt: new Date().toISOString()
      };
      inquiries.push(newInquiry);
      localStorage.setItem('inquiries', JSON.stringify(inquiries));

      alert('간편 문의 접수가 정상 완료되었습니다.\n담당자가 확인 후 연락처로 신속히 연락드리겠습니다.');
      closeInquiryModal();
    });
  }

  // 실시간 글자수 계산 및 동적 카운터 업데이트
  const inquiryMessage = document.getElementById('inquiry-message');
  const inquiryCharCount = document.getElementById('inquiry-char-count');
  if (inquiryMessage && inquiryCharCount) {
    inquiryMessage.addEventListener('input', function() {
      const len = this.value.length;
      inquiryCharCount.textContent = len;
      if (len >= 300) {
        inquiryCharCount.style.color = '#ef4444';
      } else {
        inquiryCharCount.style.color = '#64748b';
      }
    });
  }

  // --- 약관 전문 데이터 정의 및 모달 제어 ---
  const LEGAL_POLICIES = {
    terms: `제1조 (목적)
본 약관은 주식회사 가야애드(이하 "회사")가 제공하는 온라인 서비스(이하 "서비스")의 이용조건, 절차 및 회원과 회사 간의 권리와 의무 등 필요한 사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
1. "서비스"란 회사가 자체 웹/앱 플랫폼을 통해 제공하는 간판 디자인 시뮬레이터 툴, 경영환경개선 간판지원사업의 접수 시스템 및 관련 부가 서비스를 의미합니다.
2. "회원"이란 본 약관에 동의하고 서비스에 회원등록을 완료하여 계정을 부여받은 자를 뜻하며, 이용 권한에 따라 '일반고객 회원', '영업자 회원', '시공업체 회원', '관리자'로 구분됩니다.

제3조 (약관의 효력 및 개정)
1. 본 약관은 서비스를 이용하고자 하는 모든 회원에 대하여 효력을 발생합니다.
2. 회사는 관계법령을 위배하지 않는 범위 내에서 본 약관을 개정할 수 있으며, 개정 시 서비스 화면에 최소 7일 전부터 공지합니다.

제4조 (회원가입 및 회원등급 승인)
1. 이용자는 회사가 제시한 가입 양식에 실명 정보를 기입하고 본 약관에 동의함으로써 회원가입을 신청합니다.
2. '영업자 회원' 및 '시공업체 회원' 등 특수 등급은 가입 후 마이페이지를 통해 사업자등록증 등 증빙 서류를 제출하여 관리자의 검토 및 승인을 거쳐 최종 전환 완료됩니다.

제5조 (서비스의 제공 및 제한)
1. 회사는 회원에게 간판 디자인 시뮬레이션 및 간편 간판교체 신청 서비스를 제공합니다.
2. 회사는 설비 점검, 통신 장애 또는 천재지변 발생 시 서비스의 전부 또는 일부를 일시 중지할 수 있습니다.

제6조 (회원의 의무 및 면책)
1. 회원은 타인의 명의를 도용하거나 허위 사실을 기재하여 서비스를 이용하여서는 안 됩니다.
2. 회사는 시뮬레이터를 통해 시각화된 시안과 실제 시공 결과물 간의 물리적 오차 및 시공 과정에서의 분쟁에 대해 책임을 지지 않습니다.`,

    privacy: `주식회사 가야애드(이하 "회사")는 경기도 소상공인 간판지원단 플랫폼을 운영함에 있어 정보주체의 개인정보를 보호하고 이와 관련된 고충을 신속하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.

제1조 (개인정보의 수집 및 이용 목적)
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
1. 회원 가입 및 관리: 회원 식별, 가입 의사 확인, 회원자격 유지·관리, 부정이용 방지
2. 서비스 제공 및 민원 처리: 간판 디자인 시뮬레이터 이용, 비회원 3초 간편 접수 상담 서비스 제공, 경영환경개선사업 접수, 각종 고충 처리

제2조 (수집하는 개인정보의 항목)
회사는 서비스 제공을 위해 아래와 같은 필수 개인정보를 수집하고 있습니다.
1. 회원가입 시: 아이디, 비밀번호, 성명, 주소, 이메일, 휴대폰 번호, (영업자/시공사 전환 신청 시) 상호명, 사업자등록번호
2. 비회원 간편 문의 시: 성명, 연락처, 문의 유형, 문의 내용

제3조 (개인정보의 보유 및 이용 기간)
1. 회사는 회원 탈퇴 시 혹은 동의 철회 시까지 정보주체의 개인정보를 보유 및 이용합니다.
2. 단, 관계 법령(전자상거래 등에서의 소비자보호에 관한 법령 등)의 규정에 의하여 보존할 필요가 있는 경우, 해당 법령에서 정한 일정 기간(예: 소비자의 불만 또는 분쟁처리에 관한 기록 3년) 동안 보존합니다.

제4조 (개인정보의 파기절차 및 방법)
회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다. 전자적 파일 형태는 기록을 재생할 수 없는 기술적 방법을 사용하며, 종이 문서는 분쇄기로 분쇄하여 파기합니다.

제5조 (개인정보 보호책임자 및 고충 처리)
* 개인정보 보호책임자: 주식회사 가야애드 대표이사
* 연락처: 010-7266-2499 / nubine22@naver.com`,

    consent: `주식회사 가야애드(이하 "회사")는 경기도 소상공인 간판지원단 플랫폼의 비회원 간편 문의 및 서비스 회원가입 단계에서 개인정보보호법에 의거하여 다음과 같이 개인정보를 수집·이용하고자 합니다.

1. 개인정보를 수집하는 자: 주식회사 가야애드
2. 수집 및 이용 목적:
   - 비회원 3초 간편 문의 서비스 접수 및 본인 확인
   - 문의 사항에 대한 상담 및 답변(해피콜 연락) 제공
   - 경영환경개선 간판지원사업 신청 안내
3. 수집하는 개인정보의 항목:
   - 필수 항목: 성명(성함/이름), 연락처(휴대폰 번호/전화번호)
4. 개인정보의 보유 및 이용 기간:
   - 문의 접수 및 상담 처리가 완료된 날로부터 1년 보관 후 파기 (정보주체의 파기 요청 시 지체 없이 파기)
5. 동의 거부 권리 및 불이익 고지:
   - 귀하는 개인정보 수집 및 이용 동의를 거부할 권리가 있습니다.
   - 단, 필수 항목 동의를 거부하실 경우 3초 간편 문의 접수 서비스 이용이 제한됩니다.`
  };

  const policyModal = document.getElementById('policy-modal');
  const policyModalClose = document.getElementById('policy-modal-close');
  const btnPolicyConfirm = document.getElementById('btn-policy-confirm');
  const policyModalTitle = document.getElementById('policy-modal-title');
  const policyModalBody = document.getElementById('policy-modal-body');

  function closePolicyModal() {
    if (policyModal) {
      policyModal.classList.remove('active');
    }
  }

  window.openPolicyModal = function(type) {
    if (!policyModal || !policyModalTitle || !policyModalBody) return;
    
    let title = '';
    let content = '';

    if (type === 'privacy') {
      title = '개인정보 처리방침';
      content = LEGAL_POLICIES.privacy;
    } else if (type === 'terms') {
      title = '서비스 이용약관';
      content = LEGAL_POLICIES.terms;
    } else if (type === 'consent') {
      title = '개인정보 수집 및 이용 동의';
      content = LEGAL_POLICIES.consent;
    }

    policyModalTitle.innerHTML = `<i class="fa-solid fa-file-shield"></i> ${title}`;
    policyModalBody.textContent = content;
    policyModal.classList.add('active');
  };

  if (policyModalClose) {
    policyModalClose.addEventListener('click', closePolicyModal);
  }
  if (btnPolicyConfirm) {
    btnPolicyConfirm.addEventListener('click', closePolicyModal);
  }
  if (policyModal) {
    policyModal.addEventListener('click', (e) => {
      if (e.target === policyModal) {
        closePolicyModal();
      }
    });
  }

  // --- 개인정보변경 모달 연동 ---
  const profileEditModal = document.getElementById('profile-edit-modal');
  const profileEditModalClose = document.getElementById('profile-edit-modal-close');
  const profileEditForm = document.getElementById('profile-edit-form');
  const btnProfileEdit = document.getElementById('btn-profile-edit');

  function openProfileEditModal() {
    if (!profileEditModal) return;
    const user = getActiveUser();
    if (!user) { alert('로그인이 필요합니다.'); return; }
    // 기존 정보 자동 채움
    document.getElementById('profile-edit-name').value = user.name || '';
    document.getElementById('profile-edit-email').value = user.email || '';
    document.getElementById('profile-edit-phone').value = user.phone || '';
    document.getElementById('profile-edit-address').value = user.address || '';
    document.getElementById('profile-edit-pw').value = '';
    document.getElementById('profile-edit-pw-confirm').value = '';
    profileEditModal.classList.add('active');
  }

  function closeProfileEditModal() {
    if (profileEditModal) {
      profileEditModal.classList.remove('active');
      if (profileEditForm) profileEditForm.reset();
    }
  }

  if (btnProfileEdit) {
    btnProfileEdit.addEventListener('click', (e) => {
      e.preventDefault();
      openProfileEditModal();
    });
  }

  if (profileEditModalClose) {
    profileEditModalClose.addEventListener('click', closeProfileEditModal);
  }
  document.querySelectorAll('.profile-edit-close-btn').forEach(btn => {
    btn.addEventListener('click', closeProfileEditModal);
  });
  if (profileEditModal) {
    profileEditModal.addEventListener('click', (e) => {
      if (e.target === profileEditModal) closeProfileEditModal();
    });
  }

  if (profileEditForm) {
    profileEditForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const user = getActiveUser();
      if (!user) { alert('세션이 만료되었습니다. 다시 로그인해 주세요.'); return; }

      const nameVal = escapeHtml(document.getElementById('profile-edit-name')?.value.trim() || '');
      const emailVal = escapeHtml(document.getElementById('profile-edit-email')?.value.trim() || '');
      const phoneVal = escapeHtml(document.getElementById('profile-edit-phone')?.value.trim() || '');
      const addressVal = escapeHtml(document.getElementById('profile-edit-address')?.value.trim() || '');
      const newPw = document.getElementById('profile-edit-pw')?.value || '';
      const newPwConf = document.getElementById('profile-edit-pw-confirm')?.value || '';

      // 글자수 유효성 검사
      if (nameVal.length > 0 && nameVal.length < 2) {
        alert('이름은 최소 2자 이상 입력해 주세요.'); return;
      }
      if (nameVal.length > 20) {
        alert('이름은 최대 20자까지 입력 가능합니다.'); return;
      }
      if (emailVal.length > 30) {
        alert('이메일은 최대 30자까지 입력 가능합니다.'); return;
      }
      if (phoneVal.length > 20) {
        alert('휴대폰 번호는 최대 20자까지 입력 가능합니다.'); return;
      }
      if (addressVal.length > 35) {
        alert('주소는 최대 35자까지 입력 가능합니다.'); return;
      }

      // 비밀번호 변경 시 확인
      if (newPw || newPwConf) {
        if (newPw.length < 6) { alert('비밀번호는 최소 6자 이상이어야 합니다.'); return; }
        if (newPw.length > 25) { alert('비밀번호는 최대 25자까지 입력 가능합니다.'); return; }
        if (newPw !== newPwConf) { alert('새 비밀번호가 일치하지 않습니다.'); return; }
      }

      // Local users update
      users = JSON.parse(localStorage.getItem('users')) || [];
      const idx = users.findIndex(u => u.id === user.id);

      if (idx !== -1) {
        if (nameVal) users[idx].name = nameVal;
        if (emailVal) users[idx].email = emailVal;
        if (phoneVal) users[idx].phone = phoneVal;
        if (addressVal !== undefined) users[idx].address = addressVal;
        if (newPw) users[idx].pw = sha256(newPw);
        localStorage.setItem('users', JSON.stringify(users));

        const updatedUser = users[idx];
        const storage = localStorage.getItem('activeUser') ? localStorage : sessionStorage;
        storage.setItem('activeUser', JSON.stringify(sanitizeUser ? sanitizeUser(updatedUser) : updatedUser));

        activeUser = getActiveUser();

        // Supabase Sync
        if (window.supabaseClient) {
          const updatePayload = {
            name: nameVal || users[idx].name,
            email: emailVal !== undefined ? emailVal : users[idx].email,
            phone: phoneVal || users[idx].phone
          };
          if (newPw) {
            updatePayload.password_hash = sha256(newPw);
          }
          window.supabaseClient.from('users').update(updatePayload).eq('id', user.id).then(({ error }) => {
            if (error) console.error('Supabase Profile Update Error:', error.message);
          });
        }
      }

      alert('개인정보가 성공적으로 변경되었습니다.');
      closeProfileEditModal();
      updateSessionUI();
    });
  }

  // --- Kakao Notification Admin Settings ---
  const kakaoTokenInput = document.getElementById('kakao-token-input');
  const btnSaveKakaoToken = document.getElementById('btn-save-kakao-token');
  const btnTestKakaoToken = document.getElementById('btn-test-kakao-token');

  if (kakaoTokenInput && window.KakaoNotifier) {
    const s = window.KakaoNotifier.getSettings();
    kakaoTokenInput.value = s.accessToken || '';
  }

  if (btnSaveKakaoToken && kakaoTokenInput && window.KakaoNotifier) {
    btnSaveKakaoToken.addEventListener('click', () => {
      const token = kakaoTokenInput.value.trim();
      const current = window.KakaoNotifier.getSettings();
      current.accessToken = token;
      window.KakaoNotifier.saveSettings(current);
      alert(token ? '카카오 토큰이 안전하게 저장되었습니다.\n이제부터 신규 접수 시 실시간 알림이 발송됩니다.' : '카카오 토큰이 초기화되었습니다.');
    });
  }

  if (btnTestKakaoToken && window.KakaoNotifier) {
    btnTestKakaoToken.addEventListener('click', async () => {
      const token = kakaoTokenInput ? kakaoTokenInput.value.trim() : '';
      if (!token) {
        alert('먼저 카카오 Access Token을 입력하고 저장해 주세요.');
        return;
      }
      btnTestKakaoToken.disabled = true;
      btnTestKakaoToken.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 전송 중...';

      const res = await window.KakaoNotifier.sendToMe(
        '🔔 카카오톡 알림 연동 테스트',
        '간판지원단 시스템과 대표님의 카카오톡이 정상적으로 연동되었습니다! 🎉\n고객 신청 및 접수가 발생하면 이와 같이 실시간 알림이 발송됩니다.'
      );

      btnTestKakaoToken.disabled = false;
      btnTestKakaoToken.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 🔔 카톡 테스트 전송';

      if (res.success) {
        alert('✅ 카카오톡으로 테스트 알림이 성공적으로 전송되었습니다!\n스마트폰 카카오톡을 확인해 보세요.');
      } else {
        alert(`❌ 전송 실패: ${res.reason || '토큰이 만료되었거나 권한이 부족합니다.'}\n카카오 디벨로퍼스에서 talk_message 권한 및 토큰을 다시 확인해 주세요.`);
      }
    });
  }
}

