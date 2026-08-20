// dashboard.js - My Page & Business Dashboard Logic

// --- 3초 간편문의 상태 변경 및 삭제 글로벌 핸들러 (최상단 즉시 정의) ---
window.toggleInquiryStatus = function(id, btnEl) {
  let currentInquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
  let inqIndex = currentInquiries.findIndex(i => String(i.id) === String(id));
  
  // id 매칭 실패 시 전화번호/이름으로 2차 매칭
  if (inqIndex === -1 && btnEl) {
    const row = btnEl.closest('tr');
    if (row) {
      const phoneEl = row.querySelector('a[href^="tel:"]');
      const phoneText = phoneEl ? phoneEl.textContent.replace(/[^0-9]/g, '') : '';
      if (phoneText) {
        inqIndex = currentInquiries.findIndex(i => (i.phone || '').replace(/[^0-9]/g, '') === phoneText);
      }
    }
  }

  if (inqIndex >= 0) {
    const target = currentInquiries[inqIndex];
    const curStatus = target.status;
    const isNowResolved = (curStatus !== 'resolved' && curStatus !== 'completed' && curStatus !== '확인완료' && curStatus !== '상담완료');
    const newStatus = isNowResolved ? 'resolved' : 'pending';
    target.status = newStatus;
    localStorage.setItem('inquiries', JSON.stringify(currentInquiries));

    // 0초 낙관적 DOM 즉시 갱신 (사용자 클릭 즉각 반응)
    if (btnEl) {
      const row = btnEl.closest('tr');
      if (row) {
        const statusCell = row.querySelector('.inq-status-cell');
        if (statusCell) {
          statusCell.innerHTML = isNowResolved
            ? `<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> 확인 완료</span>`
            : `<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-clock"></i> 확인 대기</span>`;
        }
        btnEl.style.background = isNowResolved ? '#f1f5f9' : '#15803d';
        btnEl.style.color = isNowResolved ? '#475569' : '#ffffff';
        btnEl.style.borderColor = isNowResolved ? '#cbd5e1' : '#166534';
        btnEl.innerHTML = `<i class="fa-solid ${isNowResolved ? 'fa-rotate-left' : 'fa-check'}"></i> ${isNowResolved ? '대기로 변경' : '상담 완료'}`;
      }
    }

    // 백그라운드 DB 동기화 (직접 update + upsert 병행)
    const targetId = target.id || id;
    if (window.supabaseClient && targetId) {
      window.supabaseClient.from('inquiries').update({ status: newStatus }).eq('id', String(targetId)).then(() => {});
    }
    if (window.SupabaseSync) {
      window.SupabaseSync.upsertInquiry(target);
    }
  }
};

window.deleteInquiryAdmin = function(id, btnEl) {
  if (!confirm('정말로 이 간편 문의 내역을 영구 삭제하시겠습니까?')) return;

  let currentInquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
  let inqToDelete = currentInquiries.find(i => String(i.id) === String(id));
  
  if (!inqToDelete && btnEl) {
    const row = btnEl.closest('tr');
    if (row) {
      const phoneEl = row.querySelector('a[href^="tel:"]');
      const phoneText = phoneEl ? phoneEl.textContent.replace(/[^0-9]/g, '') : '';
      if (phoneText) {
        inqToDelete = currentInquiries.find(i => (i.phone || '').replace(/[^0-9]/g, '') === phoneText);
      }
    }
  }

  const deleteTargetId = inqToDelete ? inqToDelete.id : id;
  currentInquiries = currentInquiries.filter(i => String(i.id) !== String(deleteTargetId));
  localStorage.setItem('inquiries', JSON.stringify(currentInquiries));

  if (btnEl) {
    const row = btnEl.closest('tr');
    if (row) row.remove();
  }

  if (window.SupabaseSync && deleteTargetId) {
    window.SupabaseSync.deleteInquiry(deleteTargetId);
  }

  alert('간편 문의 내역이 성공적으로 삭제되었습니다.');
  if (typeof window.renderInquiriesList === 'function') {
    window.renderInquiriesList();
  }
};

// --- 3초 간편문의 전체 초기화 글로벌 핸들러 ---
window.clearAllInquiriesAdmin = function() {
  if (!confirm('정말로 모든 3초 간편 문의 접수 내역을 영구 삭제하고 초기화하시겠습니까?\n삭제 후 복구할 수 없습니다.')) return;
  localStorage.setItem('inquiries', JSON.stringify([]));
  localStorage.setItem('deleted_inquiry_ids', JSON.stringify([]));
  localStorage.setItem('inquiries_purged_flag', 'true');

  const inquiriesTableBody = document.getElementById('inquiries-table-body');
  if (inquiriesTableBody) {
    inquiriesTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="text-muted" style="text-align: center; padding: 40px 0;">접수된 간편 문의 내역이 없습니다.</td>
      </tr>
    `;
  }
  const pag = document.getElementById('pagination-manager-inquiries');
  if (pag) pag.innerHTML = '';

  if (window.SupabaseSync) {
    window.SupabaseSync.clearAllInquiries();
  }
  alert('모든 간편 문의 내역이 성공적으로 초기화되었습니다.');
};

// --- 회원 강제 탈퇴/삭제 글로벌 핸들러 ---
window.deleteUserAdmin = function(uid, btnEl) {
  if (!uid) return;
  if (!confirm(`[주의] 회원 ID [${uid}]을(를) 정말로 강제 탈퇴/삭제 처리하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) return;

  let curUsers = JSON.parse(localStorage.getItem('users')) || [];
  curUsers = curUsers.filter(u => String(u.id) !== String(uid));
  localStorage.setItem('users', JSON.stringify(curUsers));

  if (btnEl) {
    const row = btnEl.closest('tr');
    if (row) row.remove();
  }

  if (window.SupabaseSync) {
    window.SupabaseSync.deleteUser(uid);
  }

  alert(`회원 [${uid}]이(가) 정상적으로 탈퇴/삭제되었습니다.`);
  if (typeof window.renderAllUsersList === 'function') {
    window.renderAllUsersList();
  }
  if (typeof window.renderManagerPanel === 'function') {
    window.renderManagerPanel();
  }
};

// --- 온라인 간편 지원 신청서 강제 삭제 글로벌 핸들러 ---
window.deleteApplicationAdmin = function(appId, btnEl) {
  if (!appId) return;
  if (!confirm(`[주의] 지원 신청 접수 건 [${appId}]을(를) 정말로 영구 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) return;

  // 1) 0초 즉각 DOM 행 제거
  if (btnEl) {
    const row = btnEl.closest('tr');
    if (row) row.remove();
  }

  // 2) deleted_application_ids 등록
  let deletedAppIds = JSON.parse(localStorage.getItem('deleted_application_ids')) || [];
  if (!deletedAppIds.includes(String(appId))) {
    deletedAppIds.push(String(appId));
    localStorage.setItem('deleted_application_ids', JSON.stringify(deletedAppIds));
  }

  // 3) 로컬 applications에서 제거
  let apps = JSON.parse(localStorage.getItem('applications')) || [];
  apps = apps.filter(a => String(a.id) !== String(appId));
  localStorage.setItem('applications', JSON.stringify(apps));

  // 4) Supabase DB 영구 삭제
  if (window.SupabaseSync) {
    window.SupabaseSync.deleteApplication(appId);
  }

  alert(`지원 신청 접수 건 [${appId}]이(가) 정상적으로 영구 삭제되었습니다.`);
  if (typeof window.renderApplicationsList === 'function') {
    window.renderApplicationsList();
  }
};

// --- Collapsible Sections Toggle for PC Admin Dashboard (Global Definition) ---
function toggleAdminSection(containerId, headerEl, event) {
  if (event) {
    const target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.tagName === 'A' || target.tagName === 'SELECT' || target.closest('input') || target.closest('button:not(.btn-toggle-admin)') || target.closest('a') || target.closest('select'))) {
      return;
    }
  }
  const container = document.getElementById(containerId);
  if (!container) return;

  const currentDisplay = window.getComputedStyle(container).display;
  const isHidden = (currentDisplay === 'none' || container.style.display === 'none');
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
}
window.toggleAdminSection = toggleAdminSection;

document.addEventListener('DOMContentLoaded', () => {
  // 3초 간편문의 기존 5건 및 오류 데이터 1회 영구 삭제 및 완전 초기화 (사용자 요청)
  if (!localStorage.getItem('inquiries_cleared_20260820_02')) {
    const defaultIdsToPurge = [
      'INQ-20260817-001',
      'INQ-1786920993324',
      'INQ-1786871032835',
      'INQ-1786920450983',
      'INQ-1786920628397'
    ];
    let deletedInqIds = JSON.parse(localStorage.getItem('deleted_inquiry_ids')) || [];
    defaultIdsToPurge.forEach(id => {
      if (!deletedInqIds.includes(id)) deletedInqIds.push(id);
    });
    localStorage.setItem('deleted_inquiry_ids', JSON.stringify(deletedInqIds));
    localStorage.setItem('inquiries', JSON.stringify([]));
    localStorage.setItem('inquiries_purged_flag', 'true');
    localStorage.setItem('inquiries_cleared_20260820_02', 'true');
    if (window.SupabaseSync) {
      window.SupabaseSync.clearAllInquiries();
    }
  }

  // 영업물건 기존 3건 및 오류 데이터 강력 영구 완전 삭제 및 초기화 (대원감자탕, 우리나라곰탕 등 박멸)
  if (!localStorage.getItem('biz_items_purged_20260820_03')) {
    const defaultPurgedBizItemIds = [
      'B-260802-0001',
      'B-260802-0002',
      'B-260802-0003',
      '우리나라 곰탕',
      '우리나라곰탕',
      '대원감자탕',
      '대원 감자탕',
      '대박치킨',
      '대박 치킨'
    ];
    let deletedBizItemIds = JSON.parse(localStorage.getItem('deleted_biz_item_ids')) || [];
    defaultPurgedBizItemIds.forEach(id => {
      if (!deletedBizItemIds.includes(id)) deletedBizItemIds.push(id);
    });
    localStorage.setItem('deleted_biz_item_ids', JSON.stringify(deletedBizItemIds));

    const isMatchPurge = (it) => {
      if (!it) return false;
      const itId = String(it.id || '').trim();
      const itRef = String(it.appRefId || '').trim();
      const itName = String(it.name || it.storeName || it.shopName || '').replace(/\s+/g, '').toLowerCase();
      return deletedBizItemIds.some(del => {
        const cleanDel = String(del).replace(/\s+/g, '').toLowerCase();
        return itId === del || itRef === del || (itName && cleanDel && (itName === cleanDel || itName.includes(cleanDel) || cleanDel.includes(itName)));
      });
    };

    let curUsers = JSON.parse(localStorage.getItem('users')) || [];
    curUsers = curUsers.map(u => {
      if (u.items && Array.isArray(u.items)) {
        return {
          ...u,
          items: u.items.filter(it => !isMatchPurge(it))
        };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(curUsers));

    let activeU = typeof getActiveUser === 'function' ? getActiveUser() : (JSON.parse(localStorage.getItem('activeUser')) || JSON.parse(sessionStorage.getItem('activeUser')));
    if (activeU && activeU.items) {
      activeU.items = activeU.items.filter(it => !isMatchPurge(it));
      if (localStorage.getItem('activeUser')) localStorage.setItem('activeUser', JSON.stringify(activeU));
      if (sessionStorage.getItem('activeUser')) sessionStorage.setItem('activeUser', JSON.stringify(activeU));
    }

    // applications 에서도 isBizItem 해제
    let curApps = JSON.parse(localStorage.getItem('applications')) || [];
    curApps = curApps.map(app => {
      if (isMatchPurge(app)) {
        return { ...app, isBizItem: false };
      }
      return app;
    });
    localStorage.setItem('applications', JSON.stringify(curApps));

    localStorage.setItem('biz_items_purged_20260820_03', 'true');
  }

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
      // 2. Normal/Business/Constructor User Mode
      if (dashboardGrid) dashboardGrid.style.display = '';
      if (conversionArea) {
        conversionArea.style.display = (activeUser.role === 'business' || activeUser.role === 'constructor' || activeUser.role === 'admin' || activeUser.bizCode || activeUser.constCode) ? 'none' : 'block';
      }
      if (userApplicationsSection) userApplicationsSection.style.display = 'block';
      
      if (activeUser.role === 'business') {
        if (dashboardTitle) dashboardTitle.textContent = '영업자 전용 대시보드';
        if (dashboardSubtitle) dashboardSubtitle.textContent = '회원님의 상태를 확인하고 영업물건 등록 및 진행 현황을 실시간으로 관리하세요.';
      } else if (activeUser.role === 'constructor') {
        if (dashboardTitle) dashboardTitle.textContent = '시공업체 전용 대시보드';
        if (dashboardSubtitle) dashboardSubtitle.textContent = '배정된 시공 물건 관리 및 완료 보고를 실시간으로 진행하세요.';
      } else {
        if (dashboardTitle) dashboardTitle.textContent = '마이페이지 및 영업자 대시보드';
        if (dashboardSubtitle) dashboardSubtitle.textContent = '회원님의 상태를 확인하고 영업물건 등록 및 진행 현황을 실시간으로 관리하세요.';
      }
      
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
      if (adminStatsContainer) adminStatsContainer.style.display = 'flex';
      const pipeline = document.getElementById('admin-construction-pipeline');
      if (pipeline) pipeline.style.display = 'block';
      renderAdminStats();
    } else {
      if (adminStatsContainer) adminStatsContainer.style.display = 'none';
      const pipeline = document.getElementById('admin-construction-pipeline');
      if (pipeline) pipeline.style.display = 'none';
    }
    const userAppsSec = document.getElementById('user-applications-section');
    if (activeUser.role !== 'admin') {
      if (userAppsSec) userAppsSec.style.display = 'block';
      renderUserApplicationsList();
    } else {
      if (userAppsSec) userAppsSec.style.display = 'none';
    }

    const bizRegSec = document.getElementById('biz-registered-items-section');
    if (activeUser.role === 'business') {
      if (bizRegSec) bizRegSec.style.display = 'block';
      renderBizRegisteredTable();
    } else {
      if (bizRegSec) bizRegSec.style.display = 'none';
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
      renderManagerConstProgress();
      renderInquiriesList();
    } else if (activeUser && activeUser.role === 'business') {
      renderBusinessDashboard();
      renderUserApplicationsList();
      renderBizRegisteredTable();
    } else if (activeUser && activeUser.role === 'constructor') {
      renderConstructorDashboard();
      renderUserApplicationsList();
    } else if (activeUser) {
      renderUserApplicationsList();
    }
  });

  // 다른 탭/창에서 데이터 변경 시 0초 즉각 갱신
  window.addEventListener('storage', (e) => {
    if (e.key === 'applications' || e.key === 'users') {
      users = JSON.parse(localStorage.getItem('users')) || [];
      applications = JSON.parse(localStorage.getItem('applications')) || [];
      if (activeUser && activeUser.role === 'admin') {
        renderApplicationsList();
        renderManagerPanel();
        renderAdminStats();
      } else if (activeUser && activeUser.role === 'business') {
        renderBusinessDashboard();
        renderUserApplicationsList();
        renderBizRegisteredTable();
      }
    }
  });

  const syncAdminDataFromSupabase = async () => {
    if (window.SupabaseSync) {
      await window.SupabaseSync.syncAllData();
      users = JSON.parse(localStorage.getItem('users')) || [];
      applications = JSON.parse(localStorage.getItem('applications')) || [];
      if (activeUser && activeUser.role === 'admin') {
        renderAllUsersList();
        renderManagerPanel();
        renderAdminStats();
        renderApplicationsList();
        renderManagerConstProgress();
        renderInquiriesList();
      }
    }
  };

  // 초기 즉시 Supabase 클라우드 동기화 실행
  syncAdminDataFromSupabase();

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

    // 전환 신청 버튼 영역 제어 (영업자/시공사/관리자는 무조건 숨김)
    const conversionArea = document.getElementById('conversion-area');
    if (activeUser.role === 'business' || activeUser.bizCode || activeUser.role === 'constructor' || activeUser.constCode || activeUser.role === 'admin') {
      if (conversionArea) conversionArea.style.display = 'none';
    }

    if (activeUser.role === 'business') {
      dashboardUserRole.textContent = `영업자 코드 (${activeUser.bizCode || '코드발급'})`;
      dashboardUserRole.style.background = 'var(--accent-secondary)';
      if (dashboardBusinessView) dashboardBusinessView.style.display = 'block';
      if (conversionArea) conversionArea.style.display = 'none';
      renderBusinessDashboard();
    } else if (activeUser.role === 'constructor') {
      dashboardUserRole.textContent = `시공업체 코드 (${activeUser.constCode || '시공사'})`;
      dashboardUserRole.style.background = 'var(--accent-success)';
      if (dashboardConstructorView) dashboardConstructorView.style.display = 'block';
      if (conversionArea) conversionArea.style.display = 'none';
      renderConstructorDashboard();
    } else if (activeUser.role === 'admin') {
      dashboardUserRole.textContent = '최고관리자';
      dashboardUserRole.style.background = 'var(--grad-sunset)';
      if (conversionArea) conversionArea.style.display = 'none';
    } else {
      dashboardUserRole.textContent = '일반 회원';
      dashboardUserRole.style.background = 'var(--accent-primary)';
      if (dashboardNormalView) dashboardNormalView.style.display = 'block';
      if (conversionArea) conversionArea.style.display = 'block';

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
          } else if (matchingApp.status === 'rejected' || matchingApp.status === '지원사업 탈락' || matchingApp.status === '지원사업탈락') {
            updatedProgress = '반려됨';
          } else if (matchingApp.status === 'giveup' || matchingApp.status === '지원사업 포기' || matchingApp.status === '지원사업포기') {
            updatedProgress = '지원사업 포기';
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

    // 만약 관리자가 applications에서 isBizItem을 해제(false)했다면 items 목록에서도 자동 제거
    const cleanedItems = items.filter(item => {
      const matchingApp = apps.find(app => String(app.id) === String(item.id));
      if (matchingApp && matchingApp.isBizItem === false) {
        itemsUpdated = true;
        return false;
      }
      return true;
    });
    items = cleanedItems;

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
          <p>등록된 최근 신청 업체가 없습니다. 우측 모바일 업로드기에서 첫 물건을 등록해 보세요.</p>
        </div>
      `;
      return;
    }

    // 최근 신청한 업체: 최신 2개 업체만 표시
    const recentItems = [...items].slice(-2).reverse();

    recentItems.forEach(item => {
      const card = document.createElement('div');
      card.className = 'biz-item-card';

      // Match application data for more detailed fields if available
      const matchingApp = apps.find(app => String(app.id) === String(item.id) || String(app.id) === String(item.appRefId));
      const storeName = item.name || (matchingApp ? (matchingApp.storeName || matchingApp.shopName) : '') || '-';
      const storeAddress = item.address || (matchingApp ? matchingApp.storeAddress : '') || '-';
      const applyDate = formatDateOnly(item.registeredAt || item.appliedAt || (matchingApp ? matchingApp.appliedAt : '') || new Date());
      const ownerName = (matchingApp ? matchingApp.ownerName : '') || item.ownerName || item.name || '-';
      const ownerPhone = item.phone || (matchingApp ? matchingApp.ownerPhone : '') || '-';

      // Photos collection (up to 20 photos)
      let photoList = [];
      if (item.photos && Array.isArray(item.photos)) {
        photoList = photoList.concat(item.photos);
      }
      if (matchingApp) {
        if (matchingApp.fileData && !photoList.includes(matchingApp.fileData)) {
          photoList.unshift(matchingApp.fileData);
        }
        if (matchingApp.photos && Array.isArray(matchingApp.photos)) {
          matchingApp.photos.forEach(p => {
            if (p && !photoList.includes(p)) photoList.push(p);
          });
        }
      }
      photoList = photoList.filter(Boolean).slice(0, 20);

      let photosHtml = '';
      if (photoList.length > 0) {
        photosHtml = `<div class="biz-item-photos" style="display: flex; flex-wrap: wrap; gap: 6px; margin-top: 14px; padding-top: 10px; border-top: 1px solid rgba(0,0,0,0.06);">`;
        photoList.forEach(photoSrc => {
          photosHtml += `
            <a href="${sanitizeUrl(photoSrc)}" target="_blank" style="display: block; width: 38px; height: 38px; border-radius: 6px; overflow: hidden; border: 1px solid #cbd5e1; flex-shrink: 0; background: #f8fafc;" title="현장사진 크게보기">
              <img src="${sanitizeUrl(photoSrc)}" alt="현장사진" class="biz-item-thumb" style="width: 100%; height: 100%; object-fit: cover;" onerror="this.src='간판지원단 로고-2.png'">
            </a>
          `;
        });
        photosHtml += `</div>`;
      }

      card.innerHTML = `
        <div class="biz-item-header" style="align-items: flex-start;">
          <div style="flex: 1;">
            <h4 class="biz-item-name" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 6px; font-size: 1.05rem;">
              ${escapeHtml(storeName)}
              ${item.id ? `<span style="font-size: 0.72rem; font-weight: 600; color: var(--accent-primary); background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); padding: 2px 8px; border-radius: 4px; font-family: monospace;">${escapeHtml(String(item.id))}</span>` : ''}
            </h4>
            <p class="biz-item-addr" style="margin-bottom: 5px; font-size: 0.82rem; color: var(--text-secondary); display: flex; align-items: center; gap: 4px;">
              <i class="fa-solid fa-location-dot" style="color: var(--accent-primary);"></i> ${escapeHtml(storeAddress)}
            </p>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 4px;">
              <strong style="color: #475569;">신청일시:</strong> <span style="font-family: monospace; color: var(--text-primary); font-weight: 500;">${escapeHtml(applyDate)}</span>
            </p>
            <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0;">
              <strong style="color: #475569;">대표자:</strong> <span style="color: var(--text-primary); font-weight: 600;">${escapeHtml(ownerName)}</span> <span style="color: var(--text-secondary); font-size: 0.78rem;">(${escapeHtml(ownerPhone)})</span>
            </p>
          </div>
          <div class="biz-item-badges" style="display: flex; gap: 6px; flex-shrink: 0; margin-left: 10px;">
            <span class="badge-receipt">${escapeHtml(item.receiptStatus || '접수예정')}</span>
            <span class="badge-progress">${escapeHtml(item.progressStatus || '지원대기중')}</span>
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
        progressStatus: (targetApp.status === 'approved' || targetApp.status === '서류제출 & 접수예정') ? '승인 완료' : ((targetApp.status === 'rejected' || targetApp.status === '지원사업 탈락' || targetApp.status === '지원사업탈락') ? '반려됨' : ((targetApp.status === 'giveup' || targetApp.status === '지원사업 포기' || targetApp.status === '지원사업포기') ? '지원사업 포기' : '심사 대기')),
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
    mobileUploadForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!activeUser || activeUser.role !== 'business') return;

      const nameVal = mobItemName.value.trim();
      const phoneVal = mobItemPhone ? mobItemPhone.value.trim() : '';
      const addrVal = mobItemAddress.value.trim();

      if (!nameVal || !phoneVal || !addrVal) {
        alert('상호명, 전화번호, 설치 주소를 모두 입력해 주세요.');
        return;
      }

      let base64Photo = '';
      if (selectedPhotos.length > 0) {
        try {
          base64Photo = await compressImageToBase64(selectedPhotos[0], 2 * 1024 * 1024);
        } catch (err) {
          console.warn('Image compression warning:', err);
        }
      }

      let apps = JSON.parse(localStorage.getItem('applications')) || [];
      const itemId = typeof generateBizItemId === 'function' ? generateBizItemId(activeUser.bizCode, apps) : `${activeUser.bizCode || 'B-260801'}-${String(apps.length + 1).padStart(4, '0')}`;

      const newApp = {
        id: itemId,
        userId: activeUser.id,
        ownerName: nameVal,
        ownerPhone: phoneVal,
        storeName: nameVal,
        shopName: nameVal,
        storeAddress: addrVal,
        signType: '현장 카메라 접수',
        fileName: selectedPhotos.length > 0 ? (selectedPhotos[0].name || '현장촬영사진.jpg') : '현장촬영사진.jpg',
        fileData: base64Photo || '',
        appliedAt: new Date().toISOString(),
        status: 'pending',
        isBizItem: false,
        referrerCode: activeUser.bizCode || ''
      };

      if (!apps.some(a => a.id === itemId)) {
        apps.push(newApp);
      } else {
        apps = apps.map(a => a.id === itemId ? newApp : a);
      }
      try {
        localStorage.setItem('applications', JSON.stringify(apps));
      } catch (quotaErr) {
        console.warn('[저장 용량 초과] 사진 데이터를 제외하고 기본 정보만 저장합니다.', quotaErr);
        const appsLite = apps.map(a => a.id === itemId ? { ...a, fileData: '', photos: [], photosCount: 0 } : a);
        try {
          localStorage.setItem('applications', JSON.stringify(appsLite));
          alert('저장 공간이 부족하여 사진은 제외하고 기본 정보만 등록되었습니다.\n관리자에게 문의하거나 이전 데이터를 정리해 주세요.');
        } catch (e2) {
          alert('저장 공간이 부족합니다. 이전 데이터를 정리 후 다시 시도해 주세요.');
          return;
        }
      }

      // 영업자 본인의 items 에도 등록 (실제 촬영 사진 base64 포함)
      const newItem = {
        id: itemId,
        name: nameVal,
        phone: phoneVal,
        address: addrVal,
        receiptStatus: '접수예정',
        progressStatus: '지원대기중',
        photos: base64Photo ? [base64Photo] : []
      };
      activeUser.items = activeUser.items || [];
      if (!activeUser.items.some(i => i.id === itemId)) {
        activeUser.items.push(newItem);
      } else {
        activeUser.items = activeUser.items.map(i => i.id === itemId ? newItem : i);
      }
      users = users.map(u => u.id === activeUser.id ? { ...u, items: activeUser.items } : u);
      try {
        localStorage.setItem('users', JSON.stringify(users));
        localStorage.setItem('activeUser', JSON.stringify(activeUser));
      } catch (quotaErr2) {
        console.warn('[users 저장 실패]', quotaErr2);
        const usersLite = users.map(u => {
          if (u.id !== activeUser.id) return u;
          const itemsLite = (u.items || []).map(it => it.id === itemId ? { ...it, photos: [] } : it);
          return { ...u, items: itemsLite };
        });
        try {
          localStorage.setItem('users', JSON.stringify(usersLite));
          localStorage.setItem('activeUser', JSON.stringify({ ...activeUser, items: usersLite.find(u => u.id === activeUser.id)?.items || [] }));
        } catch (e3) { console.warn('[users 저장 실패]', e3); }
      }

      // Supabase 클라우드 DB 실시간 양방향 동기화
      if (window.SupabaseSync) {
        try {
          window.SupabaseSync.upsertApplication(newApp);
          window.SupabaseSync.updateUser(activeUser.id, { items: activeUser.items });
        } catch (syncErr) { console.warn('[Supabase 동기화 오류]', syncErr); }
      }

      // 카카오톡 관리자 실시간 알림 발송
      if (window.KakaoNotifier && typeof window.KakaoNotifier.notifyApplication === 'function') {
        try { window.KakaoNotifier.notifyApplication(newApp); } catch (kakaoErr) {}
      }

      alert(`현장 간판 신청 물건 [${nameVal}] 등록이 성공적으로 접수되었습니다!\n신청번호: [${itemId}]\n(대시보드에 안전하게 등록되었습니다.)`);

      mobileUploadForm.reset();
      selectedPhotos = [];
      renderMobilePhotoPreviews();
      stopCamera();
      renderDashboard();
      renderBusinessDashboard();
      renderBizRegisteredTable();
      renderUserApplicationsList();
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

  // --- Smart Toggle States for User Applications & Business Items ---
  let userAppsExpanded = false; // false: 최근 3개 요약 노출, true: 10개씩 페이징 노출
  let userAppsCurrentPage = 1;

  let bizTableExpanded = false; // false: 최근 3개 요약 노출, true: 10개씩 페이징 노출
  let bizTableCurrentPage = 1;

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
  window.changeUserAppsPage = (p) => {
    userAppsCurrentPage = p;
    renderUserApplicationsList();
  };
  window.changeBizTablePage = (p) => {
    bizTableCurrentPage = p;
    renderBizRegisteredTable();
  };
  window.changeInquiriesPage = (p) => {
    inquiriesCurrentPage = p;
    renderInquiriesList();
  };

  // --- PC 영업자 전용 대시보드 [전체 펼치기 / 기본 3건만 접기] 글로벌 핸들러 ---
  window.toggleBizTablePC = function() {
    bizTableExpanded = !bizTableExpanded;
    bizTableCurrentPage = 1;
    if (typeof renderBizRegisteredTable === 'function') {
      renderBizRegisteredTable();
    }
  };

  window.toggleUserAppsPC = function() {
    userAppsExpanded = !userAppsExpanded;
    userAppsCurrentPage = 1;
    if (typeof renderUserApplicationsList === 'function') {
      renderUserApplicationsList();
    }
  };

  // --- Render All Users List (전체 회원 정보 관리) ---
  const renderAllUsersList = () => {
    if (activeUser.role !== 'admin') return;
    const allUsersTableBody = document.getElementById('all-users-table-body');
    const allUsersCountEl = document.getElementById('all-users-count');
    const paginationContainer = document.getElementById('pagination-manager-all-users');
    if (!allUsersTableBody) return;

    let currentUsers = JSON.parse(localStorage.getItem('users')) || [];
    currentUsers = typeof sortUsersLatestFirst === 'function' ? sortUsersLatestFirst(currentUsers) : currentUsers;

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
        : `<button type="button" class="btn btn-sm btn-delete-user-admin" onclick="window.deleteUserAdmin('${escapeHtml(u.id)}', this)" style="padding: 4px 8px; font-size: 0.72rem; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; cursor: pointer;"><i class="fa-solid fa-trash-can"></i> 삭제</button>`;

      const userJoinDate = typeof formatUserDate === 'function' ? formatUserDate(u.createdAt || u.created_at) : (u.createdAt || u.created_at || '-');

      tr.innerHTML = `
        <td style="padding: 12px 14px; font-weight: 700; color: var(--text-primary);">
          <div style="font-family: monospace; font-size: 0.9rem;">${escapeHtml(u.id)}</div>
          <div style="font-size: 0.72rem; font-weight: normal; color: #64748b; margin-top: 3px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">(${escapeHtml(userJoinDate)})</div>
        </td>
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
  };
  window.renderAllUsersList = renderAllUsersList;

  // 회원 검색 이벤트 바인딩
  const searchAllUsersInput = document.getElementById('search-all-users-input');
  if (searchAllUsersInput) {
    searchAllUsersInput.addEventListener('input', (e) => {
      allUsersSearchQuery = (e.target.value || '').slice(0, 30);
      allUsersCurrentPage = 1;
      renderAllUsersList();
    });
  }

  // 영업 물건 검색 이벤트 바인딩 (아이디/이름/코드검색)
  const searchManagerItemsInput = document.getElementById('search-manager-items-input');
  if (searchManagerItemsInput) {
    searchManagerItemsInput.addEventListener('input', () => {
      itemsCurrentPage = 1;
      renderManagerPanel();
    });
  }

  // 영업 물건 엑셀 다운로드 이벤트 바인딩
  const btnExportManagerItemsExcel = document.getElementById('btn-export-manager-items-excel');
  if (btnExportManagerItemsExcel) {
    btnExportManagerItemsExcel.addEventListener('click', (e) => {
      e.stopPropagation();
      exportManagerItemsToExcel();
    });
  }

  // 온라인 간편 지원 신청 목록 검색 이벤트 바인딩 (아이디/이름/코드검색)
  const searchManagerAppsInput = document.getElementById('search-manager-apps-input');
  if (searchManagerAppsInput) {
    searchManagerAppsInput.addEventListener('input', () => {
      appsCurrentPage = 1;
      renderApplicationsList();
    });
  }

  // 관리자 시공업체 진행현황 검색 이벤트 바인딩 (시공사/상호명/주소/코드검색)
  const searchManagerConstInput = document.getElementById('search-manager-const-input');
  if (searchManagerConstInput) {
    searchManagerConstInput.addEventListener('input', () => {
      constProgressCurrentPage = 1;
      renderManagerConstProgress();
    });
  }

  // 시공업체 내 배정 물건 검색 이벤트 바인딩 (상호명/주소/간판종류 검색)
  const searchConstructorJobsInput = document.getElementById('search-constructor-jobs-input');
  if (searchConstructorJobsInput) {
    searchConstructorJobsInput.addEventListener('input', () => {
      renderConstructorDashboard();
    });
  }

  // 온라인 간편 지원 신청 내역 검색 이벤트
  const searchUserAppsInput = document.getElementById('search-user-apps-input');
  if (searchUserAppsInput) {
    searchUserAppsInput.addEventListener('input', () => {
      userAppsCurrentPage = 1;
      renderUserApplicationsList();
    });
  }

  // 온라인 간편 지원 신청 내역 엑셀 다운로드 이벤트
  const btnExportUserAppsExcel = document.getElementById('btn-export-user-apps-excel');
  if (btnExportUserAppsExcel) {
    btnExportUserAppsExcel.addEventListener('click', (e) => {
      e.stopPropagation();
      exportUserApplicationsToExcel();
    });
  }

  // 영업물건 현황 테이블 검색 이벤트
  const searchBizTableInput = document.getElementById('search-biz-table-input');
  if (searchBizTableInput) {
    searchBizTableInput.addEventListener('input', () => {
      bizTableCurrentPage = 1;
      renderBizRegisteredTable();
    });
  }

  // 영업물건 엑셀 다운로드 이벤트
  const btnExportBizItemsExcel = document.getElementById('btn-export-biz-items-excel');
  if (btnExportBizItemsExcel) {
    btnExportBizItemsExcel.addEventListener('click', (e) => {
      e.stopPropagation();
      exportBizRegisteredItemsToExcel();
    });
  }



  // 온라인 간편 지원 신청 내역: 최근 3건 요약 <-> 10건 페이징 전체 펼치기 토글
  const toggleUserAppsHeader = document.getElementById('toggle-user-apps-header');
  if (toggleUserAppsHeader) {
    toggleUserAppsHeader.addEventListener('click', () => {
      userAppsExpanded = !userAppsExpanded;
      userAppsCurrentPage = 1;
      renderUserApplicationsList();
    });
  }

  // 내 영업물건 현황: 최근 3건 요약 <-> 10건 페이징 전체 펼치기 토글
  const toggleBizItemsHeader = document.getElementById('toggle-biz-items-header');
  if (toggleBizItemsHeader) {
    toggleBizItemsHeader.addEventListener('click', () => {
      bizTableExpanded = !bizTableExpanded;
      bizTableCurrentPage = 1;
      renderBizRegisteredTable();
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

    // 2. Render Business Items (with pagination & search)
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

    // 최근 신청 / 등록된 업체 최상단 정렬 (최신순 내림차순)
    allBusinessItems.sort((a, b) => {
      const timeA = new Date(a.item.registeredAt || a.item.appliedAt || a.item.createdAt || a.item.created_at || a.user.createdAt || 0).getTime();
      const timeB = new Date(b.item.registeredAt || b.item.appliedAt || b.item.createdAt || b.item.created_at || b.user.createdAt || 0).getTime();
      if (timeB !== timeA && !isNaN(timeA) && !isNaN(timeB)) {
        return timeB - timeA;
      }
      return String(b.item.id || '').localeCompare(String(a.item.id || ''), undefined, { numeric: true, sensitivity: 'base' });
    });

    // 검색어 필터링 (아이디/이름/코드검색, 최대 30자)
    const searchManagerItemsInput = document.getElementById('search-manager-items-input');
    const searchItemKeyword = searchManagerItemsInput ? searchManagerItemsInput.value.trim().slice(0, 30).toLowerCase() : '';
    
    let filteredBusinessItems = allBusinessItems;
    if (searchItemKeyword) {
      filteredBusinessItems = allBusinessItems.filter(({ user: u, item }) => {
        const uId = String(u.id || '').toLowerCase();
        const uName = String(u.name || '').toLowerCase();
        const uBizCode = String(u.bizCode || '').toLowerCase();
        const itemId = String(item.id || '').toLowerCase();
        const appRefId = String(item.appRefId || '').toLowerCase();
        const itemName = String(item.name || '').toLowerCase();
        const rawPhone = String(item.phone || '').toLowerCase();
        const cleanPhone = String(item.phone || '').replace(/[^0-9]/g, '');
        const itemAddr = String(item.address || '').toLowerCase();
        const constName = String(item.assignedConstructorName || '').toLowerCase();
        const constId = String(item.assignedConstructorId || '').toLowerCase();

        return uId.includes(searchItemKeyword) ||
               uName.includes(searchItemKeyword) ||
               uBizCode.includes(searchItemKeyword) ||
               itemId.includes(searchItemKeyword) ||
               appRefId.includes(searchItemKeyword) ||
               itemName.includes(searchItemKeyword) ||
               rawPhone.includes(searchItemKeyword) ||
               cleanPhone.includes(searchItemKeyword.replace(/[^0-9]/g, '')) ||
               itemAddr.includes(searchItemKeyword) ||
               constName.includes(searchItemKeyword) ||
               constId.includes(searchItemKeyword);
      });
    }

    const paginationItemsContainer = document.getElementById('pagination-manager-items');

    if (filteredBusinessItems.length === 0) {
      const emptyMsg = searchItemKeyword ? `검색어 [${escapeHtml(searchItemKeyword)}] 에 일치하는 영업물건이 없습니다.` : '등록된 영업물건이 없습니다.';
      managerItemsList.innerHTML = `<p class="text-muted" style="text-align: center; padding: 30px 0;">${emptyMsg}</p>`;
      if (paginationItemsContainer) paginationItemsContainer.innerHTML = '';
    } else {
      const totalItemsCount = filteredBusinessItems.length;
      const totalItemsPages = Math.ceil(totalItemsCount / itemsPerPage);
      if (itemsCurrentPage > totalItemsPages) itemsCurrentPage = totalItemsPages;
      if (itemsCurrentPage < 1) itemsCurrentPage = 1;

      const startIndex = (itemsCurrentPage - 1) * itemsPerPage;
      const paginatedItems = filteredBusinessItems.slice(startIndex, startIndex + itemsPerPage);

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

        const isSelectedOrBeyond = (item.progressStatus === '대상자선정' || item.progressStatus === '간판시공 준비중' || item.progressStatus === '간판시공완료' || item.progressStatus === '서류 심사 통과' || item.progressStatus === '현장 실사 중' || item.progressStatus === '지원금 최종 승인' || item.progressStatus === '간판 시공 중' || item.progressStatus === '시공 완료');

        let constructorAssignHtml = '';
        if (isSelectedOrBeyond) {
          if (item.assignedConstructorId) {
            constructorAssignHtml = `
              <div style="display: flex; align-items: center; gap: 6px; background: #f0fdf4; padding: 2px 8px; border-radius: 6px; border: 1px solid #bbf7d0;">
                <span style="font-size: 0.76rem; font-weight: 700; color: #15803d; display: inline-flex; align-items: center; gap: 4px;">
                  <i class="fa-solid fa-screwdriver-wrench"></i> 배정: ${escapeHtml(item.assignedConstructorName || item.assignedConstructorId)}
                </span>
                <button type="button" class="btn btn-secondary btn-sm" onclick="window.reassignConstructorItem('${u.id}', '${item.id}')" style="padding: 2px 6px; font-size: 0.72rem; border-radius: 4px; border: 1px solid #cbd5e1; background: #fff; color: #64748b; cursor: pointer;" title="시공사 다시 선택">변경</button>
              </div>
            `;
          } else {
            const constructors = users.filter(usr => usr.role === 'constructor');
            let constOptions = '<option value="">시공사 선택...</option>';
            constructors.forEach(c => {
              const constName = c.businessName || c.pendingBusinessName || c.name || c.id;
              constOptions += `<option value="${c.id}">${escapeHtml(constName)}</option>`;
            });

            constructorAssignHtml = `
              <div style="display: flex; align-items: center; gap: 6px;">
                <select class="status-select select-constructor-bizitem" data-uid="${u.id}" data-itemid="${item.id}" style="padding: 4px 8px; border-radius: 6px; border: 1.5px solid #86efac; font-size: 0.78rem; font-weight: 600; background: #fff; color: #1e293b;">
                  ${constOptions}
                </select>
                <button type="button" class="btn btn-primary btn-sm btn-assign-bizitem-constructor" onclick="window.assignConstructorToBizItem('${u.id}', '${item.id}', this)" style="padding: 4px 10px; font-size: 0.76rem; background: var(--accent-success); border: none; border-radius: 6px; color: #fff; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                  <i class="fa-solid fa-link"></i> 배정
                </button>
              </div>
            `;
          }
        }

        const apps = JSON.parse(localStorage.getItem('applications')) || [];
        const matchingApp = apps.find(a => String(a.id) === String(item.id) || (item.appRefId && String(a.id) === String(item.appRefId)));
        const rawDate = item.createdAt || item.registeredAt || item.appliedAt || item.date || (matchingApp ? (matchingApp.appliedAt || matchingApp.createdAt) : '') || '';
        let itemDateText = '-';
        if (rawDate) {
          const d = new Date(rawDate);
          if (!isNaN(d.getTime())) {
            const padZero = (n) => String(n).padStart(2, '0');
            itemDateText = `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
          } else {
            itemDateText = String(rawDate).slice(0, 10).replace(/\./g, '-');
          }
        }

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
          
          <div style="font-size: 0.82rem; color: var(--text-secondary); text-align: left; display: flex; flex-direction: column; gap: 3px;">
            <div><i class="fa-solid fa-calendar-days" style="width: 14px; color: #64748b;"></i> 신청일: <strong style="color: #1e293b; font-family: monospace;">${itemDateText}</strong></div>
            <div><i class="fa-solid fa-location-dot" style="width: 14px; color: var(--accent-primary);"></i> 주소: <span style="color: #475569;">${escapeHtml(item.address)}</span></div>
            ${item.phone ? `<div><i class="fa-solid fa-phone" style="width: 14px; color: #64748b;"></i> 연락처: <strong style="color: var(--accent-primary);">${escapeHtml(item.phone)}</strong></div>` : ''}
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

            ${constructorAssignHtml}
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
    let targetAppRefId = '';
    let curUsers = JSON.parse(localStorage.getItem('users')) || users || [];
    curUsers.forEach(u => {
      if (u.items && Array.isArray(u.items)) {
        const found = u.items.find(it => String(it.id) === String(itemId) || String(it.appRefId) === String(itemId));
        if (found) {
          if (found.name) targetItemName = found.name;
          if (found.appRefId) targetAppRefId = found.appRefId;
        }
      }
    });

    const ok = confirm(`정말 [${targetItemName}] 영업 물건을 영구 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 모든 영업자 및 관리자 화면에서 즉시 영구 제거됩니다.`);
    if (!ok) return;

    // 1) deleted_biz_item_ids에 등록하여 syncAllData에서 부활 영구 차단
    let deletedBizItemIds = JSON.parse(localStorage.getItem('deleted_biz_item_ids')) || [];
    if (!deletedBizItemIds.includes(String(itemId))) deletedBizItemIds.push(String(itemId));
    if (targetAppRefId && !deletedBizItemIds.includes(String(targetAppRefId))) deletedBizItemIds.push(String(targetAppRefId));
    if (targetItemName && targetItemName !== '해당 영업 물건' && !deletedBizItemIds.includes(targetItemName.trim())) {
      deletedBizItemIds.push(targetItemName.trim());
    }
    localStorage.setItem('deleted_biz_item_ids', JSON.stringify(deletedBizItemIds));

    const isMatchTarget = (it) => {
      if (!it) return false;
      const itId = String(it.id || '').trim();
      const itRef = String(it.appRefId || '').trim();
      const itName = String(it.name || it.storeName || it.shopName || '').replace(/\s+/g, '').toLowerCase();
      const targetClean = String(targetItemName).replace(/\s+/g, '').toLowerCase();
      return itId === String(itemId) || 
             (targetAppRefId && itId === String(targetAppRefId)) ||
             itRef === String(itemId) || 
             (targetAppRefId && itRef === String(targetAppRefId)) ||
             (targetClean && itName && (itName === targetClean || itName.includes(targetClean) || targetClean.includes(itName)));
    };

    // 2) 모든 유저의 items에서 해당 물건 완전 제거
    curUsers = curUsers.map(u => {
      if (u.items && Array.isArray(u.items)) {
        return {
          ...u,
          items: u.items.filter(it => !isMatchTarget(it))
        };
      }
      return u;
    });
    users = curUsers;
    localStorage.setItem('users', JSON.stringify(curUsers));

    // 3) activeUser 세션 갱신
    let activeU = typeof getActiveUser === 'function' ? getActiveUser() : (JSON.parse(localStorage.getItem('activeUser')) || JSON.parse(sessionStorage.getItem('activeUser')));
    if (activeU && activeU.items) {
      activeU.items = activeU.items.filter(it => !isMatchTarget(it));
      if (localStorage.getItem('activeUser')) localStorage.setItem('activeUser', JSON.stringify(activeU));
      if (sessionStorage.getItem('activeUser')) sessionStorage.setItem('activeUser', JSON.stringify(activeU));
    }

    // 4) applications 에서도 isBizItem 해제
    let curApps = JSON.parse(localStorage.getItem('applications')) || [];
    curApps = curApps.map(app => {
      if (isMatchTarget(app)) {
        return { ...app, isBizItem: false };
      }
      return app;
    });
    localStorage.setItem('applications', JSON.stringify(curApps));

    // 5) Supabase DB Sync
    if (window.SupabaseSync) {
      curUsers.forEach(u => {
        if (u.role === 'business' || u.role === 'admin') {
          window.SupabaseSync.updateUser(u.id, { items: u.items || [] });
        }
      });
      window.SupabaseSync.deleteApplication(itemId);
      if (targetAppRefId) {
        window.SupabaseSync.deleteApplication(targetAppRefId);
      }
    }

    alert(`[${targetItemName}] 영업 물건이 안전하게 영구 삭제되었습니다.`);
    if (typeof renderManagerPanel === 'function') {
      renderManagerPanel();
    }
    updateSessionUI();
  };
  window.deleteManagerItem = deleteManagerItem;

  // --- 영업 물건 목록 엑셀(CSV) 다운로드 기능 ---
  const exportManagerItemsToExcel = () => {
    if (!activeUser || activeUser.role !== 'admin') {
      alert('최고 관리자만 데이터를 다운로드할 수 있습니다.');
      return;
    }

    const curUsers = JSON.parse(localStorage.getItem('users')) || users || [];
    const curApps = JSON.parse(localStorage.getItem('applications')) || [];

    let allBusinessItems = [];
    curUsers.forEach(u => {
      if (u.items && Array.isArray(u.items)) {
        u.items.forEach(item => {
          allBusinessItems.push({
            user: u,
            item: item
          });
        });
      }
    });

    allBusinessItems.sort((a, b) => {
      const timeA = new Date(a.item.registeredAt || a.item.appliedAt || a.item.createdAt || a.item.created_at || a.user.createdAt || 0).getTime();
      const timeB = new Date(b.item.registeredAt || b.item.appliedAt || b.item.createdAt || b.item.created_at || b.user.createdAt || 0).getTime();
      if (timeB !== timeA && !isNaN(timeA) && !isNaN(timeB)) {
        return timeB - timeA;
      }
      return String(b.item.id || '').localeCompare(String(a.item.id || ''), undefined, { numeric: true, sensitivity: 'base' });
    });

    if (allBusinessItems.length === 0) {
      alert('다운로드할 영업 물건 데이터가 없습니다.');
      return;
    }

    // CSV Headers
    const headers = [
      '신청일자',
      '물건번호(ID)',
      '상호명',
      '설치주소',
      '연락처',
      '담당영업자',
      '영업자코드/아이디',
      '접수상태',
      '진행상태',
      '배정시공사',
      '현장사진유무'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = allBusinessItems.map(({ user: u, item }) => {
      const matchingApp = curApps.find(a => String(a.id) === String(item.id) || (item.appRefId && String(a.id) === String(item.appRefId)));
      const rawDate = item.createdAt || item.registeredAt || item.appliedAt || item.date || (matchingApp ? (matchingApp.appliedAt || matchingApp.createdAt) : '') || '';
      let dateText = '-';
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          const padZero = (n) => String(n).padStart(2, '0');
          dateText = `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
        } else {
          dateText = String(rawDate).slice(0, 10).replace(/\./g, '-');
        }
      }

      const itemId = String(item.id || item.appRefId || '-');
      const itemName = item.name || (matchingApp ? matchingApp.storeName : '') || '-';
      const itemAddr = item.address || (matchingApp ? matchingApp.storeAddress : '') || '-';
      const itemPhone = item.phone || (matchingApp ? (matchingApp.ownerPhone || '') : '') || '-';
      const userName = u.name || '-';
      const userCode = u.bizCode || u.id || '-';
      const receiptStatus = item.receiptStatus || '접수예정';
      const progressStatus = item.progressStatus || '지원대기중';
      const constructorName = item.assignedConstructorName || (item.assignedConstructorId ? item.assignedConstructorId : '-');
      const hasPhoto = (item.photos && item.photos.length > 0) || item.fileData || (matchingApp && (matchingApp.fileData || (matchingApp.photos && matchingApp.photos.length > 0))) ? '등록됨' : '미등록';

      return [
        escapeCsv(dateText),
        escapeCsv(itemId),
        escapeCsv(itemName),
        escapeCsv(itemAddr),
        escapeCsv(itemPhone),
        escapeCsv(userName),
        escapeCsv(userCode),
        escapeCsv(receiptStatus),
        escapeCsv(progressStatus),
        escapeCsv(constructorName),
        escapeCsv(hasPhoto)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const ymd = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

    link.setAttribute('href', url);
    link.setAttribute('download', `간판지원단_영업물건_진행목록_${ymd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  window.exportManagerItemsToExcel = exportManagerItemsToExcel;

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
    let targetItem = null;
    users = users.map(u => {
      if (String(u.id) === String(uid)) {
        const updatedItems = (u.items || []).map(item => {
          if (String(item.id) === String(itemId)) {
            if (type === 'receipt') {
              targetItem = { ...item, receiptStatus: value };
            } else {
              targetItem = { ...item, progressStatus: value };
            }
            return targetItem;
          }
          return item;
        });
        return { ...u, items: updatedItems };
      }
      return u;
    });

    localStorage.setItem('users', JSON.stringify(users));

    // applications 테이블에도 해당 ID의 신청서가 있다면 상태 양방향 동기화
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    let appMatched = false;
    let targetApp = null;
    apps = apps.map(app => {
      if (String(app.id) === String(itemId) || (targetItem && targetItem.appRefId && String(app.id) === String(targetItem.appRefId))) {
        if (type === 'receipt') {
          app.receiptStatus = value;
        } else {
          app.constructionStatus = value;
          if (value === '지원대기중') app.status = 'pending';
          else if (value === '승인 완료' || value === '대상자선정' || value === '간판시공 준비중' || value === '간판시공완료') app.status = 'approved';
          else if (value === '반려됨') app.status = 'rejected';
          else if (value === '지원사업 포기') app.status = 'giveup';
        }
        targetApp = app;
        appMatched = true;
      }
      return app;
    });

    if (appMatched) {
      localStorage.setItem('applications', JSON.stringify(apps));
    }

    // Supabase DB 비동기 백그라운드 완전 동기화 (Non-blocking)
    (async () => {
      if (window.SupabaseSync) {
        try {
          const updatedUser = users.find(u => String(u.id) === String(uid));
          if (updatedUser) {
            await window.SupabaseSync.updateUser(uid, { items: updatedUser.items || [] });
          }
          if (targetApp) {
            await window.SupabaseSync.upsertApplication(targetApp);
          }
        } catch (err) {
          console.warn('Supabase updateItemStatus sync notice:', err);
        }
      }
    })();

    updateSessionUI();
  };
  window.updateItemStatus = updateItemStatus;

  // 영업 물건에 시공사 배정
  const assignConstructorToBizItem = (uid, itemId, btnEl) => {
    if (!activeUser || activeUser.role !== 'admin') return;
    const container = btnEl.closest('div');
    const select = container.querySelector('.select-constructor-bizitem');
    const constId = select ? select.value : '';
    if (!constId) {
      alert('배정할 시공사를 선택해 주세요.');
      return;
    }
    const constUser = users.find(u => String(u.id) === String(constId));
    if (!constUser) {
      alert('선택된 시공사 정보를 찾을 수 없습니다.');
      return;
    }

    const constName = constUser.businessName || constUser.pendingBusinessName || constUser.name || constUser.id;
    let targetItemName = '영업 물건';

    users = users.map(u => {
      if (String(u.id) === String(uid)) {
        const updatedItems = (u.items || []).map(item => {
          if (String(item.id) === String(itemId)) {
            targetItemName = item.name || targetItemName;
            return {
              ...item,
              assignedConstructorId: constId,
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

    localStorage.setItem('users', JSON.stringify(users));

    if (window.SupabaseSync) {
      const updatedUser = users.find(u => String(u.id) === String(uid));
      if (updatedUser) {
        window.SupabaseSync.updateUser(uid, {
          items: updatedUser.items || []
        });
      }
    }

    alert(`[${targetItemName}] 영업 물건에 시공사 [${constName}]가 성공적으로 배정되었습니다.`);
    updateSessionUI();
  };
  window.assignConstructorToBizItem = assignConstructorToBizItem;

  // 배정된 시공사 변경 (초기화)
  const reassignConstructorItem = (uid, itemId) => {
    if (!activeUser || activeUser.role !== 'admin') return;
    users = users.map(u => {
      if (String(u.id) === String(uid)) {
        const updatedItems = (u.items || []).map(item => {
          if (String(item.id) === String(itemId)) {
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

    localStorage.setItem('users', JSON.stringify(users));
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
  window.reassignConstructorItem = reassignConstructorItem;

  // --- Account Deletion (회원탈퇴) ---
  const btnDeleteAccount = document.getElementById('btn-delete-account');
  if (btnDeleteAccount) {
    btnDeleteAccount.addEventListener('click', () => {
      const confirmFirst = confirm('정말로 회원탈퇴를 진행하시겠습니까?\n등록된 모든 영업물건과 정보가 영구 삭제되며, 이 작업은 되돌릴 수 없습니다.');
      if (!confirmFirst) return;

      const confirmSecond = confirm('최종 확인: 정말 탈퇴하시겠습니까?');
      if (!confirmSecond) return;

      const currentActive = getActiveUser() || activeUser;
      if (!currentActive) return;

      const deletedUid = String(currentActive.id);

      // 1) deleted_user_ids에 영구 등록하여 동기화 부활 완전 차단
      let deletedIds = JSON.parse(localStorage.getItem('deleted_user_ids')) || [];
      if (!deletedIds.includes(deletedUid)) {
        deletedIds.push(deletedUid);
        localStorage.setItem('deleted_user_ids', JSON.stringify(deletedIds));
      }

      // 2) 로컬 users에서 제거
      users = users.filter(u => String(u.id) !== deletedUid);
      localStorage.setItem('users', JSON.stringify(users));

      // 3) Supabase DB에서 영구 삭제
      if (window.SupabaseSync) {
        window.SupabaseSync.deleteUser(deletedUid);
      }

      // 4) 세션 종료
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
        const pid = e.target.closest('button').dataset.pid;
        togglePopupActive(pid);
      });
    });
    
    document.querySelectorAll('.btn-edit-popup').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pid = e.target.closest('button').dataset.pid;
        loadPopupToForm(pid);
      });
    });
    
    document.querySelectorAll('.btn-delete-popup').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const pid = e.target.closest('button').dataset.pid;
        deletePopup(pid);
      });
    });
  };

  // Load popup to form for editing
  const loadPopupToForm = (pid) => {
    const popup = popups.find(p => String(p.id) === String(pid));
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
        popups = popups.map(p => {
          if (String(p.id) === String(idVal)) {
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
      if (String(p.id) === String(pid)) {
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
    popups = popups.filter(p => String(p.id) !== String(pid));
    localStorage.setItem('popups', JSON.stringify(popups));
    
    // If the deleted popup was being edited, reset form
    if (popupIdInput.value && String(popupIdInput.value) === String(pid)) {
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

    // 검색어 필터링 (아이디/이름/코드검색, 최대 30자)
    const searchManagerAppsInput = document.getElementById('search-manager-apps-input');
    const searchAppKeyword = searchManagerAppsInput ? searchManagerAppsInput.value.trim().slice(0, 30).toLowerCase() : '';

    // Sort applications by applied date descending (latest first)
    const sortedApps = [...apps].sort((a, b) => {
      const timeA = new Date(a.appliedAt || a.createdAt || a.created_at || 0).getTime();
      const timeB = new Date(b.appliedAt || b.createdAt || b.created_at || 0).getTime();
      if (timeB !== timeA && !isNaN(timeA) && !isNaN(timeB)) {
        return timeB - timeA;
      }
      return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true, sensitivity: 'base' });
    });

    let filteredApps = sortedApps;
    if (searchAppKeyword) {
      filteredApps = sortedApps.filter(app => {
        const appId = String(app.id || '').toLowerCase();
        const ownerName = String(app.ownerName || '').toLowerCase();
        const userId = String(app.userId || '').toLowerCase();
        const rawPhone = String(app.ownerPhone || '').toLowerCase();
        const cleanPhone = String(app.ownerPhone || '').replace(/[^0-9]/g, '');
        const storeName = String(app.storeName || app.shopName || '').toLowerCase();
        const storeAddr = String(app.storeAddress || '').toLowerCase();
        const refCode = String(app.referrerCode || app.bizCode || '').toLowerCase();
        const signType = String(app.signType || '').toLowerCase();
        const constName = String(app.assignedConstructorName || '').toLowerCase();

        return appId.includes(searchAppKeyword) ||
               ownerName.includes(searchAppKeyword) ||
               userId.includes(searchAppKeyword) ||
               rawPhone.includes(searchAppKeyword) ||
               cleanPhone.includes(searchAppKeyword.replace(/[^0-9]/g, '')) ||
               storeName.includes(searchAppKeyword) ||
               storeAddr.includes(searchAppKeyword) ||
               refCode.includes(searchAppKeyword) ||
               signType.includes(searchAppKeyword) ||
               constName.includes(searchAppKeyword);
      });
    }

    if (filteredApps.length === 0) {
      const emptyMsg = searchAppKeyword ? `검색어 [${escapeHtml(searchAppKeyword)}] 에 일치하는 온라인 간편 지원 신청이 없습니다.` : '접수된 온라인 간편 지원 신청이 없습니다.';
      applicationsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-muted" style="text-align: center; padding: 40px 0;">${emptyMsg}</td>
        </tr>
      `;
      if (paginationAppsContainer) paginationAppsContainer.innerHTML = '';
      return;
    }

    applicationsTableBody.innerHTML = '';

    const totalAppsCount = filteredApps.length;
    const totalAppsPages = Math.ceil(totalAppsCount / appsPerPage);
    if (appsCurrentPage > totalAppsPages) appsCurrentPage = totalAppsPages;
    if (appsCurrentPage < 1) appsCurrentPage = 1;

    const startIndex = (appsCurrentPage - 1) * appsPerPage;
    const paginatedApps = filteredApps.slice(startIndex, startIndex + appsPerPage);

    paginatedApps.forEach(app => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-color)';
      tr.style.transition = 'background 0.2s ease';
      
      // Formatting date (YYYY.MM.DD 형식만 표시, 시간대 제외)
      const padZero = (n) => String(n).padStart(2, '0');
      const d = new Date(app.appliedAt);
      const dateText = !isNaN(d.getTime()) ? `${d.getFullYear()}.${padZero(d.getMonth() + 1)}.${padZero(d.getDate())}` : (String(app.appliedAt).split('T')[0] || '-');

      // Status mapping
      const isApproved = (app.status === 'approved' || app.status === '서류제출 & 접수예정');
      const isRejected = (app.status === 'rejected' || app.status === '지원사업 탈락' || app.status === '지원사업탈락');
      const isGiveup = (app.status === 'giveup' || app.status === '지원사업 포기' || app.status === '지원사업포기');
      const isPending = !isApproved && !isRejected && !isGiveup;

      // Status select styling
      let statusColor = '#475569';
      let statusBg = '#ffffff';
      let statusBorder = '#cbd5e1';
      if (isApproved) {
        statusColor = '#15803d';
        statusBg = '#f0fdf4';
        statusBorder = '#86efac';
      } else if (isRejected) {
        statusColor = '#b91c1c';
        statusBg = '#fef2f2';
        statusBorder = '#fca5a5';
      } else if (isGiveup) {
        statusColor = '#b45309';
        statusBg = '#fffbeb';
        statusBorder = '#fde68a';
      }

      // Actions buttons: 상태 변경 캐럿 드롭다운, 영업물건으로 변경(토글), 삭제
      let actionButtons = '<div style="display: flex; gap: 6px; align-items: center; justify-content: center; flex-wrap: wrap;">';

      // 1. 상태 변경 셀렉트 (캐럿 아이콘 포함)
      actionButtons += `
        <div style="position: relative; display: inline-flex; align-items: center;">
          <select class="status-select select-app-status-pc" data-id="${app.id}" onchange="window.updateApplicationStatus('${app.id}', this.value)" style="padding: 5px 26px 5px 8px; font-size: 0.76rem; font-weight: 700; border-radius: 6px; border: 1.5px solid ${statusBorder}; color: ${statusColor}; background: url('data:image/svg+xml;utf8,<svg fill=&quot;%2364748b&quot; height=&quot;18&quot; viewBox=&quot;0 0 24 24&quot; width=&quot;18&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><path d=&quot;M7 10l5 5 5-5z&quot;/></svg>') no-repeat right 4px center / 16px 16px ${statusBg}; appearance: none; -webkit-appearance: none; cursor: pointer; height: 30px; line-height: 1.2; position: relative; z-index: 5;">
            <option value="pending" ${isPending ? 'selected' : ''}>⏳ 심사 대기</option>
            <option value="approved" ${isApproved ? 'selected' : ''}>✅ 서류제출 & 접수예정</option>
            <option value="rejected" ${isRejected ? 'selected' : ''}>❌ 지원사업 탈락</option>
            <option value="giveup" ${isGiveup ? 'selected' : ''}>🚫 지원사업 포기</option>
          </select>
        </div>
      `;

      // 영업물건(진흥원 접수 건) 등록 여부 정밀 확인: app.isBizItem 이거나 users.items에 이미 존재하는 경우
      const isAlreadyInBizItems = Boolean(
        app.isBizItem ||
        curUsersList.some(u => (u.items || []).some(it => 
          String(it.id) === String(app.id) || 
          String(it.appRefId) === String(app.id) ||
          (it.name && (String(it.name).trim() === String(app.storeName || '').trim() || String(it.name).trim() === String(app.shopName || '').trim()))
        ))
      );

      // 2. [영업물건으로 변경] 토글 버튼 (진흥원 접수 건으로 이동/분리)
      if (isAlreadyInBizItems) {
        actionButtons += `
          <button type="button" class="btn btn-sm btn-toggle-bizitem" data-id="${app.id}" onclick="window.toggleBizItem('${app.id}'); return false;" style="padding: 5px 10px; font-size: 0.75rem; background: #0284c7; color: white; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-weight: 700; height: 30px;" title="영업물건(진흥원 접수) 등록 상태 - 클릭 시 해제"><i class="fa-solid fa-toggle-on"></i> 영업물건 등록됨</button>
        `;
      } else {
        actionButtons += `
          <button type="button" class="btn btn-sm btn-toggle-bizitem" data-id="${app.id}" onclick="window.toggleBizItem('${app.id}'); return false;" style="padding: 5px 10px; font-size: 0.75rem; background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-weight: 600; height: 30px;" title="클릭 시 영업물건(진흥원 접수)으로 이동/등록"><i class="fa-solid fa-toggle-off"></i> 영업물건으로 변경</button>
        `;
      }
      
      // 3. 삭제 버튼 (항상 노출 - 최고관리자 영구 삭제)
      actionButtons += `
        <button type="button" class="btn btn-secondary btn-sm btn-delete-app" data-id="${app.id}" onclick="window.deleteApplicationAdmin('${app.id}', this)" style="padding: 5px 8px; font-size: 0.75rem; border: 1px solid #fecaca; color: #dc2626; background: #fee2e2; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-weight: 600; height: 30px;" title="신청서 영구 삭제"><i class="fa-solid fa-trash-can"></i> 삭제</button>
      </div>`;

      // 영업담당자 이름 매칭 (예: 김만석영업자)
      let bizUserName = '';
      const curUsersList = JSON.parse(localStorage.getItem('users')) || users || [];
      if (app.referrerCode) {
        const matchedUser = curUsersList.find(u => u.bizCode === app.referrerCode || u.id === app.referrerCode);
        if (matchedUser && matchedUser.name) {
          bizUserName = `${matchedUser.name}영업자`;
        }
      }
      if (!bizUserName && app.userId) {
        const matchedUser = curUsersList.find(u => u.id === app.userId && (u.role === 'business' || u.bizCode));
        if (matchedUser && matchedUser.name) {
          bizUserName = `${matchedUser.name}영업자`;
        }
      }
      if (!bizUserName && app.referrerCode) {
        bizUserName = `${app.referrerCode}영업자`;
      }
      if (!bizUserName) {
        bizUserName = '본사직접접수';
      }

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
        <td style="padding: 14px 16px; white-space: nowrap;">
          <div style="font-weight: 700; color: ${bizUserName === '본사직접접수' ? '#64748b' : 'var(--accent-primary)'}; font-size: 0.85rem; display: flex; align-items: center; gap: 4px;">
            <i class="fa-solid ${bizUserName === '본사직접접수' ? 'fa-building' : 'fa-user-tie'}" style="color: ${bizUserName === '본사직접접수' ? '#94a3b8' : 'var(--accent-secondary)'}; font-size: 0.82rem;"></i> ${escapeHtml(bizUserName)}
          </div>
          <div style="font-family: monospace; font-size: 0.76rem; font-weight: 600; color: #475569; margin-top: 3px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; display: inline-block; border: 1px solid #e2e8f0;">
            ${escapeHtml(String(app.id || ''))}
          </div>
        </td>
        <td style="padding: 14px 16px; text-align: center; white-space: nowrap;">
          ${(() => {
            const photosArr = (Array.isArray(app.photos) && app.photos.length > 0) ? app.photos.filter(p => p && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:'))) : [];
            const photoSrc = (photosArr.length > 0) ? photosArr[0] : (app.fileData || (app.image_url && (app.image_url.startsWith('data:') || app.image_url.startsWith('[') || app.image_url.startsWith('http') || app.image_url.startsWith('blob:')) ? app.image_url : ''));
            const hasPhoto = Boolean((photosArr.length > 0) || (photoSrc && photoSrc !== '업로드 파일 없음' && (photoSrc.startsWith('data:') || photoSrc.startsWith('[') || photoSrc.startsWith('http') || photoSrc.startsWith('blob:'))));
            const count = photosArr.length > 0 ? photosArr.length : (hasPhoto ? 1 : 0);
            return `
              <div style="display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 5px;">
                <button type="button" class="btn btn-sm btn-upload-app-photo-pc" data-id="${app.id}" style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 4px 10px; font-size: 0.76rem; font-weight: 700; color: #16a34a; background: #ffffff; border: 1.5px solid #22c55e; border-radius: 6px; cursor: pointer; width: 92px; height: 28px; box-sizing: border-box; transition: all 0.2s ease;" title="${hasPhoto ? '현장사진 변경/재등록' : '현장사진 등록'}">
                  <i class="fa-solid fa-camera" style="font-size: 0.76rem;"></i> 사진 등록
                </button>
                ${hasPhoto ? `
                  <button type="button" onclick="window.downloadApplicationPhotos('${app.id}'); return false;" style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 4px 10px; font-size: 0.74rem; font-weight: 700; color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; cursor: pointer; width: 92px; height: 28px; box-sizing: border-box; transition: all 0.2s ease;" title="${count > 1 ? `현장사진 ${count}장 ZIP 압축 다운로드` : '현장사진 다운로드'}">
                    <i class="fa-solid ${count > 1 ? 'fa-file-zipper' : 'fa-download'}" style="font-size: 0.72rem; color: #2563eb;"></i> ${count > 1 ? `다운 (${count}장)` : '다운로드'}
                  </button>
                ` : `
                  <button type="button" disabled style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 4px 10px; font-size: 0.74rem; font-weight: 500; color: #94a3b8; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: not-allowed; width: 92px; height: 28px; box-sizing: border-box;" title="등록된 사진 없음">
                    <i class="fa-solid fa-download" style="font-size: 0.72rem;"></i> 다운로드
                  </button>
                `}
              </div>
            `;
          })()}
        </td>
        <td style="padding: 14px 16px; text-align: center;">${actionButtons}</td>
      `;
      applicationsTableBody.appendChild(tr);
    });

    if (paginationAppsContainer) {
      paginationAppsContainer.innerHTML = renderPaginationControls(totalAppsCount, appsPerPage, appsCurrentPage, 'window.changeAppsPage');
    }

    // Add event listeners for photo upload in PC dashboard
    document.querySelectorAll('.btn-upload-app-photo-pc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        handleApplicationPhotoUploadPC(id);
      });
    });

    // Action buttons (Status change, Toggle Biz Item, Delete) are handled directly by inline onclick/onchange for instant single response

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
    const inquiriesTableBody = document.getElementById('inquiries-table-body');
    if (!inquiriesTableBody) return;

    const currentAdmin = (activeUser && activeUser.role === 'admin') ||
      (() => {
        const u = JSON.parse(localStorage.getItem('activeUser')) || JSON.parse(sessionStorage.getItem('activeUser'));
        return u && u.role === 'admin';
      })();
    if (!currentAdmin) return;

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
      const isResolved = (inq.status === 'resolved' || inq.status === 'completed' || inq.status === '확인완료' || inq.status === '상담완료');

      const statusBadge = isResolved
        ? `<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> 확인 완료</span>`
        : `<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-clock"></i> 확인 대기</span>`;

      const actionButtons = `
        <div style="display: flex; gap: 6px; justify-content: center; align-items: center;">
          <button type="button" class="btn btn-sm btn-toggle-inquiry-status" onclick="window.toggleInquiryStatus('${inq.id}', this)" style="padding: 5px 10px; font-size: 0.75rem; background: ${isResolved ? '#f1f5f9' : '#15803d'}; color: ${isResolved ? '#475569' : '#ffffff'}; border: 1px solid ${isResolved ? '#cbd5e1' : '#166534'}; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-weight: 600;">
            <i class="fa-solid ${isResolved ? 'fa-rotate-left' : 'fa-check'}"></i> ${isResolved ? '대기로 변경' : '상담 완료'}
          </button>
          <button type="button" class="btn btn-sm btn-delete-inquiry" onclick="window.deleteInquiryAdmin('${inq.id}', this)" style="padding: 5px 9px; font-size: 0.75rem; background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 3px; font-weight: 600;">
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
        <td class="inq-status-cell" style="padding: 14px 16px; text-align: center; white-space: nowrap;">${statusBadge}</td>
        <td style="padding: 14px 16px; text-align: center; white-space: nowrap;">${actionButtons}</td>
      `;
      inquiriesTableBody.appendChild(tr);
    });

    if (paginationInquiriesContainer) {
      paginationInquiriesContainer.innerHTML = renderPaginationControls(totalInqCount, inquiriesPerPage, inquiriesCurrentPage, 'window.changeInquiriesPage');
    }
  };
  window.renderInquiriesList = renderInquiriesList;

  // --- Render Manager Constructor Progress (시공업체 진행현황 관리자 뷰) ---
  let constProgressCurrentPage = 1;
  const constProgressPerPage = 10;

  window.changeConstProgressPage = (page) => {
    constProgressCurrentPage = page;
    renderManagerConstProgress();
  };

  const renderManagerConstProgress = () => {
    if (activeUser.role !== 'admin') return;
    const constTableBody = document.getElementById('manager-const-progress-table-body');
    if (!constTableBody) return;

    const apps = JSON.parse(localStorage.getItem('applications')) || [];
    const curUsers = JSON.parse(localStorage.getItem('users')) || [];
    const paginationContainer = document.getElementById('pagination-manager-const-progress');

    let allConstJobs = [];

    // 1) From users' items (영업물건 중 시공사가 배정되었거나 시공상태가 존재하는 건)
    curUsers.forEach(u => {
      if (u.items && Array.isArray(u.items)) {
        u.items.forEach(item => {
          if (item.assignedConstructorId || (item.constructionStatus && item.constructionStatus !== 'none') || item.progressStatus === '간판시공 준비중' || item.progressStatus === '간판시공완료' || item.progressStatus === '간판 시공 중' || item.progressStatus === '시공 완료') {
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
              storeName: item.name || '-',
              ownerName: `${u.name} (영업자)`,
              ownerPhone: item.phone || u.phone || '-',
              storeAddress: item.address || '-',
              signType: item.signType || 'LED 채널/플렉스',
              assignedConstructorId: item.assignedConstructorId || '',
              assignedConstructorName: cName || '미배정',
              assignedConstructorCode: cCode,
              assignedConstructorPhone: cPhone,
              constructionStatus: item.constructionStatus || 'before_construction',
              constructionPhotos: item.constructionPhotos || [],
              invoicePhotos: item.invoicePhotos || [],
              createdAt: item.assignedAt || item.createdAt || new Date().toISOString()
            });
          }
        });
      }
    });

    // 2) From applications (온라인 신청서 중 시공사가 배정되었거나 승인된 건)
    apps.forEach(app => {
      if (app.assignedConstructorId || (app.constructionStatus && app.constructionStatus !== 'none')) {
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
            signType: app.signType || '간판',
            assignedConstructorId: app.assignedConstructorId || '',
            assignedConstructorName: cName || '미배정',
            assignedConstructorCode: cCode,
            assignedConstructorPhone: cPhone,
            constructionStatus: app.constructionStatus || 'before_construction',
            constructionPhotos: app.constructionPhotos || [],
            invoicePhotos: app.invoicePhotos || [],
            createdAt: app.appliedAt || app.createdAt || new Date().toISOString()
          });
        }
      }
    });

    // Sort descending by date
    allConstJobs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Search filter (시공사 / 상호명 / 주소 / 코드 / 전화번호 / 간판종류)
    const searchInput = document.getElementById('search-manager-const-input');
    const searchKeyword = (searchInput ? searchInput.value.trim().toLowerCase() : '').slice(0, 30);

    let filteredJobs = allConstJobs;
    if (searchKeyword) {
      filteredJobs = allConstJobs.filter(job => {
        const cName = String(job.assignedConstructorName || '').toLowerCase();
        const cId = String(job.assignedConstructorId || '').toLowerCase();
        const cCode = String(job.assignedConstructorCode || '').toLowerCase();
        const sName = String(job.storeName || '').toLowerCase();
        const sAddr = String(job.storeAddress || '').toLowerCase();
        const oName = String(job.ownerName || '').toLowerCase();
        const oPhone = String(job.ownerPhone || '').toLowerCase();
        const sType = String(job.signType || '').toLowerCase();
        const jId = String(job.id || '').toLowerCase();

        return cName.includes(searchKeyword) ||
               cId.includes(searchKeyword) ||
               cCode.includes(searchKeyword) ||
               sName.includes(searchKeyword) ||
               sAddr.includes(searchKeyword) ||
               oName.includes(searchKeyword) ||
               oPhone.includes(searchKeyword) ||
               sType.includes(searchKeyword) ||
               jId.includes(searchKeyword);
      });
    }

    if (filteredJobs.length === 0) {
      const emptyMsg = searchKeyword ? `검색어 [${escapeHtml(searchKeyword)}] 에 일치하는 시공 진행건이 없습니다.` : '배정된 시공 진행 물건이 없습니다.';
      constTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-muted" style="text-align: center; padding: 40px 0;">${emptyMsg}</td>
        </tr>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    constTableBody.innerHTML = '';
    const totalCount = filteredJobs.length;
    const totalPages = Math.ceil(totalCount / constProgressPerPage);
    if (constProgressCurrentPage > totalPages) constProgressCurrentPage = totalPages;
    if (constProgressCurrentPage < 1) constProgressCurrentPage = 1;

    const startIndex = (constProgressCurrentPage - 1) * constProgressPerPage;
    const paginatedJobs = filteredJobs.slice(startIndex, startIndex + constProgressPerPage);

    paginatedJobs.forEach(job => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-color)';
      tr.style.transition = 'background 0.2s ease';

      const padZero = (n) => String(n).padStart(2, '0');
      const d = new Date(job.createdAt);
      const dateText = !isNaN(d.getTime()) ? `${d.getFullYear()}.${padZero(d.getMonth() + 1)}.${padZero(d.getDate())}` : '-';

      const st = job.constructionStatus || 'before_construction';
      let statusColor = '#475569';
      let statusBg = '#ffffff';
      let statusBorder = '#cbd5e1';

      if (st === 'in_construction') {
        statusColor = '#92400e';
        statusBg = '#fef3c7';
        statusBorder = '#fde68a';
      } else if (st === 'after_construction') {
        statusColor = '#166534';
        statusBg = '#dcfce7';
        statusBorder = '#86efac';
      } else if (st === 'completed') {
        statusColor = '#1e40af';
        statusBg = '#dbeafe';
        statusBorder = '#93c5fd';
      }

      const pCount = job.constructionPhotos ? job.constructionPhotos.length : 0;
      const iCount = job.invoicePhotos ? job.invoicePhotos.length : 0;
      let proofBadge = '';
      if (pCount > 0 || iCount > 0) {
        let photosLinks = '';
        if (pCount > 0) {
          const firstPhoto = job.constructionPhotos[0];
          photosLinks += `
            <a href="${sanitizeUrl(firstPhoto)}" target="_blank" style="font-size: 0.73rem; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="시공 사진 보기">
              <i class="fa-solid fa-camera"></i> 사진 ${pCount}장
            </a>
          `;
        }
        if (iCount > 0) {
          const firstInvoice = job.invoicePhotos[0];
          photosLinks += `
            <a href="${sanitizeUrl(firstInvoice)}" target="_blank" style="font-size: 0.73rem; background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 4px; font-weight: 700; text-decoration: none; display: inline-flex; align-items: center; gap: 4px;" title="세금계산서/증빙 보기">
              <i class="fa-solid fa-file-invoice-dollar"></i> 계산서 ${iCount}장
            </a>
          `;
        }
        proofBadge = `<div style="display: flex; gap: 5px; align-items: center; justify-content: center; flex-wrap: wrap;">${photosLinks}</div>`;
      } else {
        proofBadge = '<span style="color: #94a3b8; font-size: 0.75rem;">증빙 미등록</span>';
      }

      tr.innerHTML = `
        <td style="padding: 14px 16px; color: var(--text-secondary); font-family: monospace; white-space: nowrap;">${dateText}</td>
        <td style="padding: 14px 16px; white-space: nowrap;">
          <div style="font-weight: 700; color: #0f766e; font-size: 0.86rem; display: flex; align-items: center; gap: 5px;">
            <i class="fa-solid fa-trowel-bricks" style="color: #14b8a6;"></i> ${escapeHtml(job.assignedConstructorName)}
          </div>
          ${job.assignedConstructorPhone ? `<div style="font-size: 0.74rem; color: #64748b; margin-top: 2px;"><i class="fa-solid fa-phone"></i> ${escapeHtml(job.assignedConstructorPhone)}</div>` : ''}
          ${job.assignedConstructorCode ? `<div style="font-size: 0.72rem; color: #0f766e; font-family: monospace;">코드: ${escapeHtml(job.assignedConstructorCode)}</div>` : ''}
        </td>
        <td style="padding: 14px 16px; font-weight: 600; color: var(--text-primary);">
          ${escapeHtml(job.storeName)}
          <div style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary); margin-top: 2px;">
            <i class="fa-solid fa-user"></i> ${escapeHtml(job.ownerName)} (${escapeHtml(job.ownerPhone)})
          </div>
        </td>
        <td style="padding: 14px 16px;">
          <div style="font-size: 0.82rem; color: #334155;"><i class="fa-solid fa-location-dot" style="color: var(--accent-primary);"></i> ${escapeHtml(job.storeAddress)}</div>
          <div style="font-size: 0.75rem; color: #64748b; margin-top: 2px;">간판: <strong style="color: var(--accent-primary);">${escapeHtml(job.signType)}</strong></div>
        </td>
        <td style="padding: 14px 16px; text-align: center; white-space: nowrap;">
          <select class="status-select select-admin-const-status" data-id="${job.id}" style="padding: 5px 8px; font-size: 0.76rem; font-weight: 700; border-radius: 6px; border: 1.5px solid ${statusBorder}; color: ${statusColor}; background: ${statusBg}; cursor: pointer;">
            <option value="before_construction" ${st === 'before_construction' ? 'selected' : ''}>시공 전</option>
            <option value="in_construction" ${st === 'in_construction' ? 'selected' : ''}>시공 진행 중</option>
            <option value="after_construction" ${st === 'after_construction' ? 'selected' : ''}>완료 보고됨</option>
            <option value="completed" ${st === 'completed' ? 'selected' : ''}>정산 종결</option>
          </select>
        </td>
        <td style="padding: 14px 16px; text-align: center;">${proofBadge}</td>
      `;
      constTableBody.appendChild(tr);
    });

    if (paginationContainer) {
      paginationContainer.innerHTML = renderPaginationControls(totalCount, constProgressPerPage, constProgressCurrentPage, 'window.changeConstProgressPage');
    }

    // Attach status update listener
    constTableBody.querySelectorAll('.select-admin-const-status').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const val = e.target.value;
        updateJobConstructionStatus(id, val);
        renderManagerConstProgress();
      });
    });
  };

  // PC 신청서 현장사진 파일 선택/업로드 핸들러
  const handleApplicationPhotoUploadPC = (appId) => {
    if (!activeUser) return;

    let fileInput = document.getElementById('pc-app-photo-upload-input');
    if (!fileInput) {
      fileInput = document.createElement('input');
      fileInput.type = 'file';
      fileInput.id = 'pc-app-photo-upload-input';
      fileInput.accept = 'image/*';
      fileInput.style.display = 'none';
      document.body.appendChild(fileInput);
    }

    fileInput.onchange = async (e) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      const file = files[0];

      try {
        let base64Data = '';
        if (typeof compressImageToBase64 === 'function') {
          base64Data = await compressImageToBase64(file, 2 * 1024 * 1024);
        } else {
          base64Data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target.result);
            reader.readAsDataURL(file);
          });
        }

        const fileName = file.name || `현장사진_${appId}.jpg`;

        // 1) localStorage applications 업데이트
        let curApps = JSON.parse(localStorage.getItem('applications')) || [];
        const targetApp = curApps.find(a => String(a.id) === String(appId));
        if (targetApp) {
          targetApp.fileData = base64Data;
          targetApp.fileName = fileName;
          if (!Array.isArray(targetApp.photos)) {
            targetApp.photos = [];
          }
          targetApp.photos.push(base64Data);
          targetApp.photosCount = targetApp.photos.length;
          localStorage.setItem('applications', JSON.stringify(curApps));
        }

        // 2) 연동된 users items 영업물건에도 사진 자동 반영
        let usersList = JSON.parse(localStorage.getItem('users')) || [];
        let itemUpdated = false;
        usersList.forEach(u => {
          if (u.items && Array.isArray(u.items)) {
            u.items.forEach(item => {
              if (String(item.id) === String(appId) || String(item.appRefId) === String(appId)) {
                item.photos = [base64Data];
                item.photosCount = 1;
                itemUpdated = true;
              }
            });
          }
        });
        if (itemUpdated) {
          localStorage.setItem('users', JSON.stringify(usersList));
        }

        // 3) Supabase DB 실시간 동기화
        if (window.supabaseClient) {
          try {
            await window.supabaseClient
              .from('applications')
              .update({
                image_url: base64Data,
                file_data: base64Data,
                file_name: fileName,
                updated_at: new Date().toISOString()
              })
              .eq('id', appId);

            if (itemUpdated) {
              await window.supabaseClient
                .from('business_items')
                .update({
                  photos: [base64Data],
                  updated_at: new Date().toISOString()
                })
                .eq('id', appId);
            }
          } catch (dbErr) {
            console.warn('Supabase application photo sync warning:', dbErr);
          }
        }

        alert(`📷 [${targetApp ? (targetApp.storeName || targetApp.shopName || targetApp.ownerName) : appId}] 현장사진이 성공적으로 업로드되었습니다.`);
        updateSessionUI();
      } catch (err) {
        console.error('Photo upload error:', err);
        alert('사진 처리 중 오류가 발생했습니다: ' + err.message);
      } finally {
        fileInput.value = '';
      }
    };

    fileInput.click();
  };

  const updateApplicationStatus = (id, newStatus) => {
    if (!activeUser || activeUser.role !== 'admin') return;
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    let targetApp = null;
    apps = apps.map(app => {
      if (String(app.id) === String(id)) {
        targetApp = { ...app, status: newStatus };
        return targetApp;
      }
      return app;
    });

    localStorage.setItem('applications', JSON.stringify(apps));

    // 1) 영업자 대시보드(PC/모바일 공통) 실시간 동시 연동: users 목록 내 items 상태 동기화
    let curUsers = JSON.parse(localStorage.getItem('users')) || [];
    let usersUpdated = false;
    if (targetApp) {
      curUsers = curUsers.map(u => {
        if (u.items && Array.isArray(u.items)) {
          let itemMatched = false;
          u.items = u.items.map(it => {
            if (String(it.id) === String(targetApp.id) || String(it.appRefId) === String(targetApp.id)) {
              let updatedProgress = '지원대기중';
              if (newStatus === 'approved' || newStatus === '서류제출 & 접수예정') updatedProgress = '승인 완료';
              else if (newStatus === 'rejected' || newStatus === '지원사업 탈락' || newStatus === '지원사업탈락') updatedProgress = '반려됨';
              else if (newStatus === 'giveup' || newStatus === '지원사업 포기' || newStatus === '지원사업포기') updatedProgress = '지원사업 포기';

              it.progressStatus = updatedProgress;
              itemMatched = true;
              usersUpdated = true;
            }
            return it;
          });
        }
        return u;
      });

      if (usersUpdated) {
        localStorage.setItem('users', JSON.stringify(curUsers));
        if (activeUser && activeUser.role === 'business') {
          const freshMe = curUsers.find(u => u.id === activeUser.id);
          if (freshMe) {
            activeUser.items = freshMe.items;
            localStorage.setItem('activeUser', JSON.stringify(activeUser));
          }
        }
      }
    }

    let statusLabel = '심사 대기';
    if (newStatus === 'approved' || newStatus === '서류제출 & 접수예정') statusLabel = '서류제출 & 접수예정';
    else if (newStatus === 'rejected' || newStatus === '지원사업 탈락' || newStatus === '지원사업탈락') statusLabel = '지원사업 탈락';
    else if (newStatus === 'giveup' || newStatus === '지원사업 포기' || newStatus === '지원사업포기') statusLabel = '지원사업 포기';

    // 2) 즉각 UI 갱신 및 완료 알림 (0초 지연)
    alert(`[${targetApp ? (targetApp.storeName || targetApp.ownerName) : id}] 신청 건의 상태가 [${statusLabel}] (으)로 변경되었습니다.`);
    updateSessionUI();

    // 3) Supabase DB 백그라운드 비동기 영구 저장 (Non-blocking)
    (async () => {
      if (window.SupabaseSync) {
        try {
          await window.SupabaseSync.updateApplication(id, { status: newStatus });
          if (targetApp) {
            await window.SupabaseSync.upsertApplication(targetApp);
          }
          if (usersUpdated) {
            curUsers.forEach(u => {
              if (u.role === 'business' || u.role === 'admin') {
                window.SupabaseSync.updateUser(u.id, { items: u.items || [] });
              }
            });
          }
        } catch (syncErr) {
          console.warn('Supabase background update status sync warning:', syncErr);
        }
      } else if (window.supabaseClient) {
        try {
          await window.supabaseClient
            .from('applications')
            .update({
              status: newStatus,
              updated_at: new Date().toISOString()
            })
            .eq('id', String(id));
        } catch (err) {
          console.warn('Supabase application status update notice:', err);
        }
      }
    })();
  };
  window.updateApplicationStatus = updateApplicationStatus;

  const toggleBizItem = (appId) => {
    if (activeUser.role !== 'admin') return;

    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    const appIndex = apps.findIndex(a => String(a.id) === String(appId));
    if (appIndex === -1) return;

    const app = apps[appIndex];
    let curUsers = JSON.parse(localStorage.getItem('users')) || users || [];

    // 현재 영업물건 등록 여부 정밀 확인 (app.isBizItem 플래그 또는 users.items에 이미 존재하는지 여부)
    const isCurrentlyBizItem = Boolean(
      app.isBizItem ||
      curUsers.some(u => (u.items || []).some(it => 
        String(it.id) === String(app.id) || 
        String(it.appRefId) === String(app.id) ||
        (it.name && (String(it.name).trim() === String(app.storeName || '').trim() || String(it.name).trim() === String(app.shopName || '').trim()))
      ))
    );

    const isNowBizItem = !isCurrentlyBizItem;
    app.isBizItem = isNowBizItem;
    apps[appIndex] = app;
    applications = apps;
    localStorage.setItem('applications', JSON.stringify(apps));

    if (isNowBizItem) {
      // 영업물건으로 등록/이동: 대상 영업자 찾기 (bizCode, id, name, userId 등 정밀 탐색)
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
      if (!targetUser) {
        targetUser = curUsers.find(u => u.role === 'business') || curUsers.find(u => u.role === 'admin');
      }

      if (targetUser) {
        targetUser.items = targetUser.items || [];
        const existingItemIdx = targetUser.items.findIndex(it => 
          String(it.id) === String(app.id) || 
          String(it.appRefId) === String(app.id) ||
          (it.name && (String(it.name).trim() === String(app.storeName || '').trim() || String(it.name).trim() === String(app.shopName || '').trim()))
        );
        const photosList = (app.photos && app.photos.length > 0) ? app.photos : (app.fileData ? [app.fileData] : []);
        const bizItem = {
          id: app.id,
          name: app.storeName || app.shopName || app.ownerName || '영업물건',
          phone: app.ownerPhone || '',
          address: app.storeAddress || '',
          photosCount: photosList.length,
          receiptStatus: app.receiptStatus || '접수예정',
          progressStatus: (app.status === 'approved' ? '승인 완료' : (app.status === 'rejected' ? '반려됨' : (app.status === 'giveup' ? '지원사업 포기' : '지원대기중'))),
          photos: photosList,
          appRefId: app.id
        };

        if (existingItemIdx >= 0) {
          targetUser.items[existingItemIdx] = { ...targetUser.items[existingItemIdx], ...bizItem };
        } else {
          targetUser.items.unshift(bizItem);
        }

        curUsers = curUsers.map(u => u.id === targetUser.id ? targetUser : u);
        users = curUsers;
        localStorage.setItem('users', JSON.stringify(curUsers));

        if (activeUser && activeUser.id === targetUser.id) {
          activeUser.items = targetUser.items;
          localStorage.setItem('activeUser', JSON.stringify(activeUser));
        }

        if (window.SupabaseSync) {
          window.SupabaseSync.updateUser(targetUser.id, { items: targetUser.items });
        }
      }

      alert(`[${app.storeName || app.ownerName}] 건이 '영업물건'으로 변경되었습니다.\n진흥원 접수 및 영업물건 진행상황 관리 메뉴로 연동됩니다.`);
    } else {
      // 영업물건에서 해제/철회: 모든 사용자의 items에서 완벽 제거 (ID, appRefId, 상호명, 주소 정밀 매칭)
      curUsers = curUsers.map(u => {
        if (u.items && u.items.length > 0) {
          const filteredItems = u.items.filter(it => {
            const matchId = String(it.id) === String(app.id);
            const matchAppRef = String(it.appRefId) === String(app.id);
            const matchName = (it.name && (String(it.name).trim() === String(app.storeName || '').trim() || String(it.name).trim() === String(app.shopName || '').trim()));
            const matchAddr = (it.address && app.storeAddress && String(it.address).trim() === String(app.storeAddress).trim());
            return !matchId && !matchAppRef && !matchName && !matchAddr;
          });
          return { ...u, items: filteredItems };
        }
        return u;
      });
      users = curUsers;
      localStorage.setItem('users', JSON.stringify(curUsers));

      if (activeUser && (activeUser.role === 'business' || activeUser.role === 'admin')) {
        const myUser = curUsers.find(u => u.id === activeUser.id);
        if (myUser) {
          activeUser.items = myUser.items || [];
          localStorage.setItem('activeUser', JSON.stringify(activeUser));
        }
      }

      if (window.SupabaseSync) {
        curUsers.forEach(u => {
          if (u.role === 'business' || u.role === 'admin') {
            window.SupabaseSync.updateUser(u.id, { items: u.items || [] });
          }
        });
      }

      alert(`[${app.storeName || app.ownerName}] 건의 '영업물건' 등록이 해제/철회되었습니다.\n영업물건 수동조작 목록에서 즉시 제거되었습니다.`);
    }

    if (window.SupabaseSync) {
      window.SupabaseSync.upsertApplication(app);
    }

    if (typeof renderManagerPanel === 'function') {
      renderManagerPanel();
    }
    if (typeof renderApplicationsList === 'function') {
      renderApplicationsList();
    }
    if (typeof renderBizRegisteredTable === 'function') {
      renderBizRegisteredTable();
    }
    updateSessionUI();
  };
  window.toggleBizItem = toggleBizItem;

  const deleteApplication = (id) => {
    if (activeUser.role !== 'admin') return;
    if (!confirm('정말로 이 지원 신청 접수 건을 삭제하시겠습니까?')) return;
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    apps = apps.filter(app => String(app.id) !== String(id));
    localStorage.setItem('applications', JSON.stringify(apps));
    if (window.SupabaseSync) {
      window.SupabaseSync.deleteApplication(id);
    }
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

  // 날짜 포맷 함수 (YYYY.MM.DD)
  const formatDateOnly = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr).slice(0, 10);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  };

  // 신청 상태 뱃지 헬퍼
  const getAppStatusBadgeHtml = (app) => {
    if (app.status === 'approved') {
      if (app.constructionStatus === 'before_construction') {
        return `<span style="background: #e2e8f0; color: #475569; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-link"></i> 시공사 배정 (시공 전)</span>`;
      } else if (app.constructionStatus === 'in_construction') {
        return `<span style="background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-screwdriver-wrench"></i> 시공 진행 중</span>`;
      } else if (app.constructionStatus === 'after_construction') {
        return `<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-spinner fa-spin"></i> 시공 완료 (검수 중)</span>`;
      } else if (app.constructionStatus === 'completed') {
        return `<span style="background: #dbeafe; color: #1e40af; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-file-invoice-dollar"></i> 정산 종결 (최종 완료)</span>`;
      } else {
        return `<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> 승인 완료</span>`;
      }
    } else if (app.status === 'rejected' || app.status === '지원사업 탈락' || app.status === '지원사업탈락') {
      return `<span style="background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-xmark"></i> 지원사업 탈락</span>`;
    } else if (app.status === 'giveup' || app.status === '지원사업 포기' || app.status === '지원사업포기') {
      return `<span style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-ban"></i> 지원사업 포기</span>`;
    } else {
      return `<span style="background: #f1f5f9; color: #475569; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-clock"></i> 심사 대기</span>`;
    }
  };

  // --- 1. 내 온라인 간편 지원 신청 내역 테이블 렌더링 ---
  const renderUserApplicationsList = () => {
    const userApplicationsTableBody = document.getElementById('user-applications-table-body');
    const paginationContainer = document.getElementById('pagination-user-apps');
    if (!userApplicationsTableBody) return;

    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    let updated = false;

    // Migrate/update applications without userId or with 'guest' userId
    apps = apps.map(app => {
      const isGuestOrMissing = !app.userId || app.userId === 'guest';
      if (isGuestOrMissing && activeUser) {
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

    if (!activeUser) return;
    const myApps = apps.filter(app => app.userId === activeUser.id);

    // 검색 필터링 및 엑셀 버튼 동적 보장
    const searchInput = document.getElementById('search-user-apps-input');
    if (searchInput) {
      const parent = searchInput.parentElement;
      let btnExport = document.getElementById('btn-export-user-apps-excel');
      if (!btnExport && parent) {
        btnExport = document.createElement('button');
        btnExport.type = 'button';
        btnExport.id = 'btn-export-user-apps-excel';
        btnExport.style.cssText = 'background: #15803d !important; color: #ffffff !important; border: 1.5px solid #166534 !important; padding: 7px 14px !important; border-radius: 8px !important; font-size: 0.82rem !important; font-weight: 700 !important; cursor: pointer !important; display: inline-flex !important; align-items: center !important; gap: 6px !important; white-space: nowrap !important; box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important; height: 35px !important; flex-shrink: 0 !important; margin-left: 8px;';
        btnExport.innerHTML = '<i class="fa-solid fa-file-excel"></i> 엑셀 다운로드';
        btnExport.addEventListener('click', (e) => {
          e.stopPropagation();
          exportUserApplicationsToExcel();
        });
        parent.style.display = 'flex';
        parent.style.alignItems = 'center';
        parent.style.justifyContent = 'flex-end';
        parent.style.flexShrink = '0';
        searchInput.style.width = '230px';
        searchInput.style.maxWidth = '230px';
        parent.appendChild(btnExport);
      }
    }
    const q = (searchInput ? searchInput.value.trim().toLowerCase() : '').slice(0, 30);

    let filteredApps = myApps;
    if (q) {
      filteredApps = myApps.filter(app => {
        const id = String(app.id || '').toLowerCase();
        const owner = String(app.ownerName || '').toLowerCase();
        const phone = String(app.ownerPhone || '').toLowerCase();
        const store = String(app.storeName || '').toLowerCase();
        const addr = String(app.storeAddress || '').toLowerCase();
        return id.includes(q) || owner.includes(q) || phone.includes(q) || store.includes(q) || addr.includes(q);
      });
    }

    if (filteredApps.length === 0) {
      const emptyMsg = q ? `검색어 [${escapeHtml(q)}] 에 일치하는 신청 내역이 없습니다.` : '내가 접수한 온라인 간편 지원 신청 내역이 없습니다.';
      userApplicationsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-muted" style="text-align: center; padding: 30px 0;">${emptyMsg}</td>
        </tr>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    userApplicationsTableBody.innerHTML = '';
    
    // Sort my applications by applied date descending
    const sortedMyApps = [...filteredApps].sort((a, b) => {
      const timeA = new Date(a.appliedAt || 0).getTime();
      const timeB = new Date(b.appliedAt || 0).getTime();
      return timeB - timeA;
    });

    const totalCount = sortedMyApps.length;
    const perPage = userAppsExpanded ? 10 : 3;
    const totalPages = Math.ceil(totalCount / perPage);
    if (userAppsCurrentPage > totalPages) userAppsCurrentPage = totalPages;
    if (userAppsCurrentPage < 1) userAppsCurrentPage = 1;

    const startIndex = (userAppsCurrentPage - 1) * perPage;
    const paginatedApps = sortedMyApps.slice(startIndex, startIndex + perPage);

    paginatedApps.forEach(app => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-color)';
      tr.style.transition = 'background 0.2s ease';
      
      const dateOnly = formatDateOnly(app.appliedAt);
      const statusBadge = getAppStatusBadgeHtml(app);

      tr.innerHTML = `
        <td style="padding: 12px 16px; color: var(--text-secondary); font-family: monospace; white-space: nowrap;">${dateOnly}</td>
        <td style="padding: 12px 16px; white-space: nowrap;">
          <span style="font-family: monospace; font-weight: 700; color: var(--accent-primary); font-size: 0.88rem;">${escapeHtml(String(app.id))}</span>
        </td>
        <td style="padding: 12px 16px;">
          <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(app.ownerName || '-')}</div>
          ${app.ownerPhone ? `<div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 2px;"><i class="fa-solid fa-phone" style="color: var(--accent-primary);"></i> ${escapeHtml(app.ownerPhone)}</div>` : ''}
        </td>
        <td style="padding: 12px 16px;">
          <div style="font-weight: 600; color: var(--text-primary); font-size: 0.88rem;">${escapeHtml(app.storeName || '-')}</div>
          ${app.storeAddress ? `<div style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary); margin-top: 2px;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(app.storeAddress)}</div>` : ''}
        </td>
        <td style="padding: 12px 16px; width: 110px; white-space: nowrap;">
          ${(() => {
            const photoSrc = app.fileData || (app.photos && app.photos.length > 0 ? app.photos[0] : '');
            const downloadBtn = photoSrc
              ? `<a href="${sanitizeUrl(photoSrc)}" download="${escapeHtml(app.fileName) || '현장사진.jpg'}" style="padding: 4px 8px; font-size: 0.74rem; background: #2563eb; color: #ffffff; border: 1px solid #1d4ed8; border-radius: 6px; text-decoration: none; display: flex; align-items: center; justify-content: center; gap: 4px; font-weight: 700; width: 100%; box-sizing: border-box; text-align: center; box-shadow: 0 1px 2px rgba(37,99,235,0.2); transition: background 0.15s;" title="현장사진 다운로드"><i class="fa-solid fa-download"></i> 다운로드</a>`
              : `<button type="button" disabled style="padding: 4px 8px; font-size: 0.74rem; background: #e2e8f0; color: #94a3b8; border: 1px solid #cbd5e1; border-radius: 6px; display: flex; align-items: center; justify-content: center; gap: 4px; width: 100%; box-sizing: border-box; cursor: not-allowed;"><i class="fa-solid fa-download"></i> 다운로드</button>`;

            return `
              <div style="display: flex; flex-direction: column; gap: 6px; width: 96px;">
                <button type="button" class="btn btn-sm btn-upload-app-photo-pc" data-id="${app.id}" style="padding: 4px 8px; font-size: 0.74rem; background: #ffffff; color: #166534; border: 1.5px solid #22c55e; border-radius: 6px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 4px; font-weight: 700; width: 100%; box-sizing: border-box; box-shadow: 0 1px 2px rgba(0,0,0,0.04);" title="현장사진 등록/변경">
                  <i class="fa-solid fa-camera" style="color: #16a34a;"></i> 사진 등록
                </button>
                ${downloadBtn}
              </div>
            `;
          })()}
        </td>
        <td style="padding: 12px 16px; white-space: nowrap;">${statusBadge}</td>
        <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">
          <button class="btn btn-secondary btn-sm btn-cancel-own-app" data-id="${app.id}" style="padding: 5px 10px; font-size: 0.72rem; border-color: rgba(239, 68, 68, 0.3); color: rgba(239, 68, 68, 0.7); background: transparent; border-radius: 6px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#fee2e2'; this.style.borderColor='rgba(239,68,68,0.5)';" onmouseout="this.style.background='transparent'; this.style.borderColor='rgba(239,68,68,0.3)';"><i class="fa-solid fa-trash-can"></i> 취소</button>
        </td>
      `;
      userApplicationsTableBody.appendChild(tr);
    });

    // Toggle badge 업데이트
    const userAppsToggleBadge = document.getElementById('user-apps-toggle-badge');
    if (userAppsToggleBadge) {
      userAppsToggleBadge.style.background = '#0f172a';
      userAppsToggleBadge.style.color = '#ffffff';
      userAppsToggleBadge.style.border = '1px solid #1e293b';
      if (userAppsExpanded) {
        userAppsToggleBadge.innerHTML = '<i class="fa-solid fa-chevron-up"></i> 기본 3건만 접기';
      } else {
        userAppsToggleBadge.innerHTML = `<i class="fa-solid fa-chevron-down"></i> 전체 펼치기${totalCount > 3 ? ` (${totalCount}건)` : ''}`;
      }
    }

    if (paginationContainer) {
      if (userAppsExpanded && totalCount > 10) {
        paginationContainer.innerHTML = renderPaginationControls(totalCount, 10, userAppsCurrentPage, 'window.changeUserAppsPage');
      } else {
        paginationContainer.innerHTML = '';
      }
    }

    // Add photo upload listeners
    userApplicationsTableBody.querySelectorAll('.btn-upload-app-photo-pc').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        handleApplicationPhotoUploadPC(id);
      });
    });

    // Add click listeners to cancel buttons
    userApplicationsTableBody.querySelectorAll('.btn-cancel-own-app').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        deleteOwnApplication(id);
      });
    });
  };

  // --- 2. 내 영업물건 현황 및 진행상황 테이블 렌더링 (영업자 전용) ---
  const renderBizRegisteredTable = () => {
    const bizRegisteredTableBody = document.getElementById('biz-registered-table-body');
    const paginationContainer = document.getElementById('pagination-biz-table');
    if (!bizRegisteredTableBody) return;
    if (!activeUser) return;

    // 0) 최신 users 데이터에서 activeUser 갱신하여 items 누락 방지
    const curUsersList = JSON.parse(localStorage.getItem('users')) || [];
    const freshUser = curUsersList.find(u => u.id === activeUser.id);
    if (freshUser) {
      activeUser = { ...activeUser, ...freshUser };
      localStorage.setItem('activeUser', JSON.stringify(activeUser));
    }

    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    let myItems = activeUser.items || [];
    let bizList = [];

    const deletedBizItemIds = JSON.parse(localStorage.getItem('deleted_biz_item_ids')) || [];
    const isPurgedItem = (it) => {
      if (!it) return false;
      const itId = String(it.id || '').trim();
      const itRef = String(it.appRefId || '').trim();
      const itName = String(it.name || it.storeName || it.shopName || '').replace(/\s+/g, '').toLowerCase();
      return deletedBizItemIds.some(del => {
        const cleanDel = String(del).replace(/\s+/g, '').toLowerCase();
        return itId === del || itRef === del || (itName && cleanDel && (itName === cleanDel || itName.includes(cleanDel) || cleanDel.includes(itName)));
      });
    };

    const myBizCode = String(activeUser.bizCode || '').trim().toLowerCase();
    const myUserId = String(activeUser.id || '').trim().toLowerCase();
    const myUserName = String(activeUser.name || '').trim().toLowerCase();

    // 1) applications 중 최고관리자가 '영업물건으로 변경'(isBizItem: true)을 체크한 건 수집
    apps.forEach(app => {
      if (isPurgedItem(app)) return; // 삭제/정화된 물건 제외
      const isApprovedBizItem = (app.isBizItem === true || String(app.isBizItem) === 'true');
      if (!isApprovedBizItem) return; // 관리자 미체크 건은 제외

      const refCode = String(app.referrerCode || '').trim().toLowerCase();
      const appUser = String(app.userId || '').trim().toLowerCase();

      const isMyReferrer = (myBizCode && refCode === myBizCode) || (myUserId && refCode === myUserId) || (myUserName && refCode === myUserName);
      const isMyUser = (myUserId && appUser === myUserId);
      const isMyItem = myItems.some(i => String(i.id) === String(app.id) || String(i.appRefId) === String(app.id));

      if (isMyReferrer || isMyUser || isMyItem || activeUser.role === 'admin') {
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
    });

    // 2) myItems 중에서도 applications에 매칭되는 건이 있다면 isBizItem === false 인 경우만 제외하고 모두 허용
    myItems.forEach(item => {
      if (isPurgedItem(item)) return; // 삭제/정화된 물건 제외
      const matchingApp = apps.find(a => String(a.id) === String(item.id) || String(a.id) === String(item.appRefId));
      if (matchingApp && (matchingApp.isBizItem === false || String(matchingApp.isBizItem) === 'false')) return; // 관리자가 명시적으로 해제한 건만 제외

      if (!bizList.some(b => String(b.id) === String(item.id))) {
        bizList.push({
          id: item.id,
          date: item.registeredAt || item.createdAt || new Date().toISOString(),
          ownerName: item.name || item.ownerName || '-',
          ownerPhone: item.phone || item.ownerPhone || '',
          storeName: item.name || item.storeName || '-',
          storeAddress: item.address || item.storeAddress || '',
          statusObj: matchingApp || {
            status: item.receiptStatus === '승인완료' ? 'approved' : 'pending',
            constructionStatus: item.progressStatus || '지원대기중'
          }
        });
      }
    });

    // 검색 필터링 및 엑셀 버튼 동적 보장
    const searchInput = document.getElementById('search-biz-table-input');
    if (searchInput) {
      const parent = searchInput.parentElement;
      let btnExport = document.getElementById('btn-export-biz-items-excel');
      if (!btnExport && parent) {
        btnExport = document.createElement('button');
        btnExport.type = 'button';
        btnExport.id = 'btn-export-biz-items-excel';
        btnExport.style.cssText = 'background: #15803d !important; color: #ffffff !important; border: 1.5px solid #166534 !important; padding: 7px 14px !important; border-radius: 8px !important; font-size: 0.82rem !important; font-weight: 700 !important; cursor: pointer !important; display: inline-flex !important; align-items: center !important; gap: 6px !important; white-space: nowrap !important; box-shadow: 0 1px 3px rgba(0,0,0,0.08) !important; height: 35px !important; flex-shrink: 0 !important; margin-left: 8px;';
        btnExport.innerHTML = '<i class="fa-solid fa-file-excel"></i> 엑셀 다운로드';
        btnExport.addEventListener('click', (e) => {
          e.stopPropagation();
          exportBizRegisteredItemsToExcel();
        });
        parent.style.display = 'flex';
        parent.style.alignItems = 'center';
        parent.style.justifyContent = 'flex-end';
        parent.style.flexShrink = '0';
        searchInput.style.width = '230px';
        searchInput.style.maxWidth = '230px';
        parent.appendChild(btnExport);
      }
    }
    const q = (searchInput ? searchInput.value.trim().toLowerCase() : '').slice(0, 30);

    let filteredList = bizList;
    if (q) {
      filteredList = bizList.filter(b => {
        const id = String(b.id || '').toLowerCase();
        const owner = String(b.ownerName || '').toLowerCase();
        const phone = String(b.ownerPhone || '').toLowerCase();
        const store = String(b.storeName || '').toLowerCase();
        const addr = String(b.storeAddress || '').toLowerCase();
        return id.includes(q) || owner.includes(q) || phone.includes(q) || store.includes(q) || addr.includes(q);
      });
    }

    const totalCount = filteredList.length;

    // Toggle badge UI 동적 갱신
    const bizItemsToggleBadge = document.getElementById('biz-items-toggle-badge');
    if (bizItemsToggleBadge) {
      bizItemsToggleBadge.style.transition = 'all 0.2s ease';
      bizItemsToggleBadge.style.cursor = 'pointer';
      if (bizTableExpanded) {
        bizItemsToggleBadge.style.background = 'rgba(217, 119, 6, 0.18)';
        bizItemsToggleBadge.style.color = '#d97706';
        bizItemsToggleBadge.style.border = '1px solid rgba(217, 119, 6, 0.35)';
        bizItemsToggleBadge.innerHTML = '<i class="fa-solid fa-chevron-up"></i> 기본 3건만 접기';
      } else {
        bizItemsToggleBadge.style.background = '#0f172a';
        bizItemsToggleBadge.style.color = '#ffffff';
        bizItemsToggleBadge.style.border = '1px solid #1e293b';
        bizItemsToggleBadge.innerHTML = `<i class="fa-solid fa-chevron-down"></i> 전체 펼치기${totalCount > 3 ? ` (${totalCount}건)` : ''}`;
      }
    }

    if (filteredList.length === 0) {
      const emptyMsg = q ? `검색어 [${escapeHtml(q)}] 에 일치하는 영업물건이 없습니다.` : '등록된 영업물건이 없습니다.<br><span style="font-size: 0.76rem; color: #94a3b8;">(최고관리자가 승인/영업물건으로 등록한 물건만 표시됩니다)</span>';
      bizRegisteredTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-muted" style="text-align: center; padding: 30px 0; line-height: 1.6;">${emptyMsg}</td>
        </tr>
      `;
      if (paginationContainer) paginationContainer.innerHTML = '';
      return;
    }

    bizRegisteredTableBody.innerHTML = '';

    // 최신 등록순 정렬
    filteredList.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    // 전체 펼치기 시 모든 항목 노출, 접혔을 시 기본 3건 노출
    const displayList = bizTableExpanded ? filteredList : filteredList.slice(0, 3);

    displayList.forEach(item => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid var(--border-color)';
      tr.style.transition = 'background 0.2s ease';

      const dateOnly = formatDateOnly(item.date);
      const statusBadge = getAppStatusBadgeHtml(item.statusObj);

      tr.innerHTML = `
        <td style="padding: 12px 16px; color: var(--text-secondary); font-family: monospace; white-space: nowrap;">${dateOnly}</td>
        <td style="padding: 12px 16px; white-space: nowrap;">
          <span style="font-family: monospace; font-weight: 700; color: var(--accent-secondary); font-size: 0.88rem;">${escapeHtml(String(item.id))}</span>
        </td>
        <td style="padding: 12px 16px;">
          <div style="font-weight: 600; color: var(--text-primary);">${escapeHtml(item.ownerName || '-')}</div>
          ${item.ownerPhone ? `<div style="font-size: 0.74rem; color: var(--text-secondary); margin-top: 2px;"><i class="fa-solid fa-phone" style="color: var(--accent-primary);"></i> ${escapeHtml(item.ownerPhone)}</div>` : ''}
        </td>
        <td style="padding: 12px 16px;">
          <div style="font-weight: 600; color: var(--text-primary); font-size: 0.88rem;">${escapeHtml(item.storeName || '-')}</div>
          ${item.storeAddress ? `<div style="font-size: 0.75rem; font-weight: 400; color: var(--text-secondary); margin-top: 2px;"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(item.storeAddress)}</div>` : ''}
        </td>
        <td style="padding: 12px 16px; white-space: nowrap;">${statusBadge}</td>
        <td style="padding: 12px 16px; text-align: center; white-space: nowrap;">
          <button class="btn btn-secondary btn-sm btn-cancel-biz-item" data-id="${item.id}" style="padding: 5px 10px; font-size: 0.72rem; border-color: rgba(239, 68, 68, 0.3); color: rgba(239, 68, 68, 0.7); background: transparent; border-radius: 6px; cursor: pointer; transition: all 0.2s;" onmouseover="this.style.background='#fee2e2'; this.style.borderColor='rgba(239,68,68,0.5)';" onmouseout="this.style.background='transparent'; this.style.borderColor='rgba(239,68,68,0.3)';"><i class="fa-solid fa-trash-can"></i> 취소</button>
        </td>
      `;
      bizRegisteredTableBody.appendChild(tr);
    });

    if (paginationContainer) {
      paginationContainer.innerHTML = '';
    }

    // Add click listeners to cancel buttons
    bizRegisteredTableBody.querySelectorAll('.btn-cancel-biz-item').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        deleteOwnApplication(id);
        renderBizRegisteredTable();
        renderBusinessDashboard();
      });
    });
  };
  window.renderBizRegisteredTable = renderBizRegisteredTable;

  // --- 영업자 전용: 내 영업물건 목록 엑셀(CSV) 다운로드 ---
  const exportBizRegisteredItemsToExcel = () => {
    if (!activeUser || (activeUser.role !== 'business' && activeUser.role !== 'admin')) {
      alert('영업 관리자만 데이터를 다운로드할 수 있습니다.');
      return;
    }

    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    let myItems = activeUser.items || [];

    let bizList = [];

    // 1) applications 중 최고관리자가 '영업물건으로 변경'(isBizItem: true)을 체크한 건만 수집
    apps.forEach(app => {
      if (app.isBizItem !== true) return;

      const isMyReferrer = activeUser.bizCode && app.referrerCode === activeUser.bizCode;
      const isMyItem = myItems.some(i => String(i.id) === String(app.id));
      const isMyUser = app.userId && app.userId === activeUser.id;
      if (isMyReferrer || isMyItem || isMyUser) {
        bizList.push({
          id: app.id,
          date: app.appliedAt || new Date().toISOString(),
          ownerName: app.ownerName || app.name || '-',
          ownerPhone: app.ownerPhone || app.phone || '',
          storeName: app.storeName || app.shopName || app.name || '-',
          storeAddress: app.storeAddress || app.address || '',
          statusObj: app
        });
      }
    });

    // 2) myItems 중에서도 applications에 매칭되는 건이 있다면 isBizItem === true 인 경우만 허용
    myItems.forEach(item => {
      const matchingApp = apps.find(a => String(a.id) === String(item.id));
      if (matchingApp && matchingApp.isBizItem !== true) return;

      if (!bizList.some(b => String(b.id) === String(item.id))) {
        bizList.push({
          id: item.id,
          date: item.registeredAt || new Date().toISOString(),
          ownerName: item.name || '-',
          ownerPhone: item.phone || '',
          storeName: item.name || '-',
          storeAddress: item.address || '',
          statusObj: {
            status: item.receiptStatus === '승인완료' ? 'approved' : 'pending',
            constructionStatus: item.progressStatus
          }
        });
      }
    });

    if (bizList.length === 0) {
      alert('다운로드할 내 영업 물건 데이터가 없습니다.');
      return;
    }

    // 최신순 정렬
    bizList.sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    const headers = [
      '신청일자',
      '접수신청코드(ID)',
      '신청자명',
      '연락처',
      '상호명',
      '설치주소',
      '진행상태'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const getProgressStatusLabel = (statusObj) => {
      if (!statusObj) return '심사 대기';
      const status = statusObj.status || statusObj.receiptStatus || '';
      const constStatus = statusObj.constructionStatus || statusObj.progressStatus || '';
      if (constStatus === '간판시공완료' || constStatus === '시공 완료' || constStatus === '정산 완료' || constStatus === 'completed') return '정산 종결 (최종 완료)';
      if (constStatus === '간판시공 준비중' || constStatus === 'in_construction') return '시공 진행 중';
      if (constStatus === '대상자선정' || constStatus === 'before_construction') return '시공사 배정 (시공 전)';
      if (status === 'approved' || status === '서류제출 & 접수예정' || status === '승인 완료') return '승인 완료';
      if (status === 'rejected' || status === '지원사업 탈락' || status === '반려됨' || status === '지원사업탈락') return '지원사업 탈락';
      if (status === 'giveup' || status === '지원사업 포기' || status === '지원사업포기') return '지원사업 포기';
      return '심사 대기';
    };

    const rows = bizList.map(item => {
      const dateOnly = formatDateOnly(item.date);
      const itemId = String(item.id || '-');
      const ownerName = item.ownerName || '-';
      const ownerPhone = item.ownerPhone || '-';
      const storeName = item.storeName || '-';
      const storeAddress = item.storeAddress || '-';
      const progressLabel = getProgressStatusLabel(item.statusObj);

      return [
        escapeCsv(dateOnly),
        escapeCsv(itemId),
        escapeCsv(ownerName),
        escapeCsv(ownerPhone),
        escapeCsv(storeName),
        escapeCsv(storeAddress),
        escapeCsv(progressLabel)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const ymd = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

    link.setAttribute('href', url);
    link.setAttribute('download', `간판지원단_내영업물건_진행목록_${ymd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  window.exportBizRegisteredItemsToExcel = exportBizRegisteredItemsToExcel;

  // --- 일반/영업자 회원: 내 온라인 간편 신청 내역 엑셀 다운로드 ---
  const exportUserApplicationsToExcel = () => {
    if (!activeUser) {
      alert('로그인이 필요합니다.');
      return;
    }

    const curApps = JSON.parse(localStorage.getItem('applications')) || [];
    let myApps = [];
    if (activeUser.role === 'admin') {
      myApps = curApps;
    } else {
      myApps = curApps.filter(app => {
        const isOwner = (app.userId && app.userId === activeUser.id) || (app.ownerPhone && app.ownerPhone === activeUser.phone);
        const isReferrer = activeUser.bizCode && app.referrerCode === activeUser.bizCode;
        return isOwner || isReferrer;
      });
    }

    if (myApps.length === 0) {
      alert('다운로드할 신청 내역 데이터가 없습니다.');
      return;
    }

    myApps.sort((a, b) => new Date(b.appliedAt || b.createdAt || 0).getTime() - new Date(a.appliedAt || a.createdAt || 0).getTime());

    const headers = [
      '신청일자',
      '접수신청코드(ID)',
      '신청자명',
      '연락처',
      '상호명',
      '설치주소',
      '진행상태'
    ];

    const escapeCsv = (str) => {
      if (str === null || str === undefined) return '""';
      const s = String(str).replace(/"/g, '""');
      return `"${s}"`;
    };

    const getStatusText = (app) => {
      if (app.status === 'approved' || app.status === '서류제출 & 접수예정' || app.status === '승인 완료') return '승인 완료';
      if (app.status === 'rejected' || app.status === '지원사업 탈락' || app.status === '반려됨' || app.status === '지원사업탈락') return '지원사업 탈락';
      if (app.status === 'giveup' || app.status === '지원사업 포기' || app.status === '지원사업포기') return '지원사업 포기';
      return '심사 대기';
    };

    const rows = myApps.map(app => {
      const dateOnly = formatDateOnly(app.appliedAt || app.createdAt || new Date().toISOString());
      const appId = String(app.id || '-');
      const ownerName = app.ownerName || app.name || '-';
      const ownerPhone = app.ownerPhone || app.phone || '-';
      const storeName = app.storeName || app.shopName || app.name || '-';
      const storeAddress = app.storeAddress || app.address || '-';
      const statusText = getStatusText(app);

      return [
        escapeCsv(dateOnly),
        escapeCsv(appId),
        escapeCsv(ownerName),
        escapeCsv(ownerPhone),
        escapeCsv(storeName),
        escapeCsv(storeAddress),
        escapeCsv(statusText)
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    const now = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const ymd = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;

    link.setAttribute('href', url);
    link.setAttribute('download', `간판지원단_온라인신청내역_${ymd}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  window.exportUserApplicationsToExcel = exportUserApplicationsToExcel;

  // --- Visitor Tracking Logic (실제 접속자 기준 통계) ---
  const trackVisitor = async () => {
    const RESET_KEY = 'visitor_reset_flag_20260817';

    // 기존 하드코딩 가짜 수치(1420, 34 등) 초기화
    if (localStorage.getItem(RESET_KEY) !== 'done') {
      localStorage.removeItem('visitor_total');
      localStorage.removeItem('visitor_today');
      localStorage.removeItem('visitor_last_date');
      localStorage.setItem(RESET_KEY, 'done');
    }

    const todayStr = new Date().toISOString().split('T')[0];
    let totalCount = parseInt(localStorage.getItem('visitor_total') || '0', 10);
    let todayCount = parseInt(localStorage.getItem('visitor_today') || '0', 10);
    const lastDate = localStorage.getItem('visitor_last_date');

    // 날짜가 바뀌었으면 오늘의 방문자 수 리셋
    if (lastDate !== todayStr) {
      todayCount = 0;
      localStorage.setItem('visitor_last_date', todayStr);
      localStorage.setItem('visitor_today', '0');
    }

    // 세션 단위 중복 카운트 방지 (브라우저 접속 시 1회 카운트)
    if (!sessionStorage.getItem('visitor_session_counted_v2')) {
      sessionStorage.setItem('visitor_session_counted_v2', 'true');
      totalCount += 1;
      todayCount += 1;
      localStorage.setItem('visitor_total', totalCount.toString());
      localStorage.setItem('visitor_today', todayCount.toString());
      localStorage.setItem('visitor_last_date', todayStr);

      // Supabase 실시간 동기화
      if (window.supabaseClient) {
        try {
          await window.supabaseClient.from('site_stats').upsert({
            id: 'visitor_counter',
            today_date: todayStr,
            today_count: todayCount,
            total_count: totalCount,
            updated_at: new Date().toISOString()
          });
        } catch (err) {
          console.warn('Supabase visitor sync notice:', err.message);
        }
      }
    }
  };

  // --- Render Admin Dashboard Metrics ---
  const renderAdminStats = async () => {
    if (activeUser.role !== 'admin') return;
    const todayStr = new Date().toISOString().split('T')[0];
    const lastDate = localStorage.getItem('visitor_last_date');
    let todayCount = parseInt(localStorage.getItem('visitor_today') || '0', 10);
    let totalCount = parseInt(localStorage.getItem('visitor_total') || '0', 10);
    
    // Reset today's count on new day
    if (lastDate !== todayStr) {
      todayCount = 0;
      localStorage.setItem('visitor_today', '0');
      localStorage.setItem('visitor_last_date', todayStr);
    }

    // Supabase 최신 방문자 통계 데이터 조회 (가능한 경우)
    if (window.supabaseClient) {
      try {
        const { data } = await window.supabaseClient
          .from('site_stats')
          .select('*')
          .eq('id', 'visitor_counter')
          .single();
        if (data) {
          if (data.today_date === todayStr && data.today_count > todayCount) {
            todayCount = data.today_count;
            localStorage.setItem('visitor_today', todayCount.toString());
          }
          if (data.total_count > totalCount) {
            totalCount = data.total_count;
            localStorage.setItem('visitor_total', totalCount.toString());
          }
        }
      } catch (e) {
        // Fallback to localStorage
      }
    }
    
    const apps = JSON.parse(localStorage.getItem('applications')) || [];
    const allUsers = JSON.parse(localStorage.getItem('users')) || [];

    // --- 신청 건수 집계 ---
    const approvedApps = apps.filter(a => a.status === 'approved');
    const inConstructionApps = approvedApps.filter(a =>
      a.constructionStatus === 'in_construction' || a.constructionStatus === 'after_construction'
    );
    const completedApps = apps.filter(a => a.constructionStatus === 'completed');

    // --- 시공 파이프라인 단계별 집계 (승인된 건만) ---
    const pipeBefore = approvedApps.filter(a => !a.constructionStatus || a.constructionStatus === 'before_construction').length;
    const pipeIn = approvedApps.filter(a => a.constructionStatus === 'in_construction').length;
    const pipeAfter = approvedApps.filter(a => a.constructionStatus === 'after_construction').length;
    const pipeCompleted = approvedApps.filter(a => a.constructionStatus === 'completed').length;

    // --- 회원 집계 ---
    const bizMembers = allUsers.filter(u => u.role === 'business').length;
    const constMembers = allUsers.filter(u => u.role === 'constructor').length;

    // --- DOM 업데이트 ---
    const statToday = document.getElementById('stat-today-visitors');
    const statTotal = document.getElementById('stat-total-visitors');
    const statApps = document.getElementById('stat-total-applications');
    const statApproved = document.getElementById('stat-approved-applications');
    const statInConst = document.getElementById('stat-in-construction');
    const statCompleted = document.getElementById('stat-completed');
    const statTotalMembers = document.getElementById('stat-total-members');
    const statBizMembers = document.getElementById('stat-business-members');
    const statConstMembers = document.getElementById('stat-constructor-members');

    if (statToday) statToday.textContent = todayCount.toLocaleString() + '명';
    if (statTotal) statTotal.textContent = totalCount.toLocaleString() + '명';
    if (statApps) statApps.textContent = apps.length + '건';
    if (statApproved) statApproved.textContent = approvedApps.length + '건';
    if (statInConst) statInConst.textContent = inConstructionApps.length + '건';
    if (statCompleted) statCompleted.textContent = completedApps.length + '건';
    if (statTotalMembers) statTotalMembers.textContent = allUsers.length + '명';
    if (statBizMembers) statBizMembers.textContent = bizMembers + '명';
    if (statConstMembers) statConstMembers.textContent = constMembers + '개';

    // --- 파이프라인 바 업데이트 ---
    const pipeBeforeEl = document.getElementById('pipe-before');
    const pipeInEl = document.getElementById('pipe-in');
    const pipeAfterEl = document.getElementById('pipe-after');
    const pipeCompletedEl = document.getElementById('pipe-completed');
    if (pipeBeforeEl) pipeBeforeEl.textContent = pipeBefore;
    if (pipeInEl) pipeInEl.textContent = pipeIn;
    if (pipeAfterEl) pipeAfterEl.textContent = pipeAfter;
    if (pipeCompletedEl) pipeCompletedEl.textContent = pipeCompleted;
  };

  // Track current visit on page load
  trackVisitor();

  // --- Constructor Dashboard & Jobs Management ---
  const renderConstructorDashboard = () => {
    if (!constructorJobsTableBody) return;
    constructorJobsTableBody.innerHTML = '';

    const apps = JSON.parse(localStorage.getItem('applications')) || [];
    const curUsers = JSON.parse(localStorage.getItem('users')) || [];
    
    let myJobs = [];
    // 1) 영업물건 중 본인에게 배정된 건
    curUsers.forEach(u => {
      if (u.items && Array.isArray(u.items)) {
        u.items.forEach(item => {
          if (String(item.assignedConstructorId) === String(activeUser.id)) {
            myJobs.push({
              id: item.id,
              isBizItemJob: true,
              bizItemOwnerId: u.id,
              storeName: item.name,
              ownerName: `${u.name} (영업자)`,
              ownerPhone: item.phone || u.phone || '-',
              storeAddress: item.address,
              signType: item.signType || 'LED 채널/플렉스',
              constructionStatus: item.constructionStatus || 'before_construction',
              constructionPhotos: item.constructionPhotos || [],
              invoicePhotos: item.invoicePhotos || [],
              createdAt: item.assignedAt || item.createdAt || new Date().toISOString()
            });
          }
        });
      }
    });

    // 2) 기존 applications 중 본인에게 배정된 건 병합
    apps.forEach(app => {
      if (String(app.assignedConstructorId) === String(activeUser.id) && !myJobs.some(j => String(j.id) === String(app.id))) {
        myJobs.push(app);
      }
    });

    // Search filter for constructor partner view
    const searchConstructorJobsInput = document.getElementById('search-constructor-jobs-input');
    const qJobs = (searchConstructorJobsInput ? searchConstructorJobsInput.value.trim().toLowerCase() : '').slice(0, 30);

    let filteredJobs = myJobs;
    if (qJobs) {
      filteredJobs = myJobs.filter(j => {
        const sName = String(j.storeName || '').toLowerCase();
        const sAddr = String(j.storeAddress || '').toLowerCase();
        const sType = String(j.signType || '').toLowerCase();
        const oName = String(j.ownerName || '').toLowerCase();
        const oPhone = String(j.ownerPhone || '').toLowerCase();
        const jId = String(j.id || '').toLowerCase();
        return sName.includes(qJobs) || sAddr.includes(qJobs) || sType.includes(qJobs) || oName.includes(qJobs) || oPhone.includes(qJobs) || jId.includes(qJobs);
      });
    }

    if (filteredJobs.length === 0) {
      const emptyMsg = qJobs ? `검색어 [${escapeHtml(qJobs)}] 에 일치하는 시공 물건이 없습니다.` : '배정된 시공 물건이 없습니다.';
      constructorJobsTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-muted" style="text-align: center; padding: 40px 0;">${emptyMsg}</td>
        </tr>
      `;
      return;
    }

    filteredJobs.forEach(job => {
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
        const id = e.target.dataset.id;
        const val = e.target.value;
        updateJobConstructionStatus(id, val);
      });
    });

    document.querySelectorAll('.btn-report-job-complete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('button').dataset.id;
        reportJobCompletion(id);
      });
    });

    document.querySelectorAll('.const-photo-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const files = Array.from(e.target.files);
        if (files.length > 0) {
          await handleJobPhotoUpload(id, files);
        }
      });
    });

    document.querySelectorAll('.const-invoice-input').forEach(input => {
      input.addEventListener('change', async (e) => {
        const id = e.target.dataset.id;
        const file = e.target.files[0];
        if (file) {
          await handleJobInvoiceUpload(id, file);
        }
      });
    });
  };

  const updateJobConstructionStatus = (id, val) => {
    // 1) Update applications
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    apps = apps.map(app => {
      if (String(app.id) === String(id)) {
        return { ...app, constructionStatus: val };
      }
      return app;
    });
    localStorage.setItem('applications', JSON.stringify(apps));

    // 2) Update users.items
    let curUsers = JSON.parse(localStorage.getItem('users')) || [];
    let updatedUid = null;
    curUsers = curUsers.map(u => {
      if (u.items && Array.isArray(u.items)) {
        const updatedItems = u.items.map(item => {
          if (String(item.id) === String(id)) {
            updatedUid = u.id;
            return { ...item, constructionStatus: val };
          }
          return item;
        });
        return { ...u, items: updatedItems };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(curUsers));
    if (updatedUid && window.SupabaseSync) {
      const u = curUsers.find(usr => usr.id === updatedUid);
      if (u) window.SupabaseSync.updateUser(updatedUid, { items: u.items || [] });
    }

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

    // 1) applications
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    apps = apps.map(app => {
      if (String(app.id) === String(id)) {
        const existing = app.constructionPhotos || [];
        const merged = existing.concat(uploadedUrls).slice(0, 20);
        return { ...app, constructionPhotos: merged };
      }
      return app;
    });
    localStorage.setItem('applications', JSON.stringify(apps));

    // 2) users.items
    let curUsers = JSON.parse(localStorage.getItem('users')) || [];
    let updatedUid = null;
    curUsers = curUsers.map(u => {
      if (u.items && Array.isArray(u.items)) {
        const updatedItems = u.items.map(item => {
          if (String(item.id) === String(id)) {
            updatedUid = u.id;
            const existing = item.constructionPhotos || [];
            const merged = existing.concat(uploadedUrls).slice(0, 20);
            return { ...item, constructionPhotos: merged };
          }
          return item;
        });
        return { ...u, items: updatedItems };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(curUsers));
    if (updatedUid && window.SupabaseSync) {
      const u = curUsers.find(usr => usr.id === updatedUid);
      if (u) window.SupabaseSync.updateUser(updatedUid, { items: u.items || [] });
    }

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

    // 1) applications
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    apps = apps.map(app => {
      if (String(app.id) === String(id)) {
        const existing = app.invoicePhotos || [];
        existing.push(url);
        return { ...app, invoicePhotos: existing };
      }
      return app;
    });
    localStorage.setItem('applications', JSON.stringify(apps));

    // 2) users.items
    let curUsers = JSON.parse(localStorage.getItem('users')) || [];
    let updatedUid = null;
    curUsers = curUsers.map(u => {
      if (u.items && Array.isArray(u.items)) {
        const updatedItems = u.items.map(item => {
          if (String(item.id) === String(id)) {
            updatedUid = u.id;
            const existing = item.invoicePhotos || [];
            existing.push(url);
            return { ...item, invoicePhotos: existing };
          }
          return item;
        });
        return { ...u, items: updatedItems };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(curUsers));
    if (updatedUid && window.SupabaseSync) {
      const u = curUsers.find(usr => usr.id === updatedUid);
      if (u) window.SupabaseSync.updateUser(updatedUid, { items: u.items || [] });
    }

    alert('정산용 세금계산서/증빙서류가 업로드되었습니다.');
    renderConstructorDashboard();
  };

  const reportJobCompletion = (id) => {
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    let curUsers = JSON.parse(localStorage.getItem('users')) || [];
    
    let targetJob = apps.find(a => String(a.id) === String(id));
    if (!targetJob) {
      curUsers.forEach(u => {
        if (u.items) {
          const found = u.items.find(it => String(it.id) === String(id));
          if (found) targetJob = found;
        }
      });
    }

    if (!targetJob) return;

    if (!targetJob.constructionPhotos || targetJob.constructionPhotos.length === 0) {
      alert('최소 1장 이상의 시공 현장 사진을 등록해 주세요.');
      return;
    }
    if (!targetJob.invoicePhotos || targetJob.invoicePhotos.length === 0) {
      alert('세금계산서 또는 지출 영수증 증빙 서류를 등록해 주세요.');
      return;
    }

    // 1) applications update
    apps = apps.map(a => {
      if (String(a.id) === String(id)) {
        return { 
          ...a, 
          constructionStatus: 'after_construction',
          constructionCompletedAt: Date.now()
        };
      }
      return a;
    });
    localStorage.setItem('applications', JSON.stringify(apps));

    // 2) users.items update
    let updatedUid = null;
    curUsers = curUsers.map(u => {
      if (u.items && Array.isArray(u.items)) {
        const updatedItems = u.items.map(item => {
          if (String(item.id) === String(id)) {
            updatedUid = u.id;
            return { 
              ...item, 
              constructionStatus: 'after_construction',
              constructionCompletedAt: Date.now()
            };
          }
          return item;
        });
        return { ...u, items: updatedItems };
      }
      return u;
    });
    localStorage.setItem('users', JSON.stringify(curUsers));
    if (updatedUid && window.SupabaseSync) {
      const u = curUsers.find(usr => usr.id === updatedUid);
      if (u) window.SupabaseSync.updateUser(updatedUid, { items: u.items || [] });
    }

    alert('시공 완료 보고 및 증빙 제출이 완료되었습니다.\n관리자 검수 및 정산이 진행됩니다.');
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
      if (addressVal.length > 100) {
        alert('주소는 최대 100자까지 입력 가능합니다.'); return;
      }

      // 비밀번호 변경 시 확인
      if (newPw || newPwConf) {
        const pwRegex = /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",./<>?~|\\])[A-Za-z\d!@#$%^&*()\-_=+\[\]{};:'",./<>?~|\\]{8,20}$/;
        if (!pwRegex.test(newPw)) { alert('비밀번호는 영문 소문자·숫자·특수문자를 각 1개 이상 포함하여 8~20자로 입력해 주세요.'); return; }
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
        storage.setItem('activeUser', JSON.stringify(typeof sanitizeUser === 'function' ? sanitizeUser(updatedUser) : updatedUser));

        activeUser = getActiveUser();

        // Supabase Sync (주소 및 모든 변경 필드 포함)
        if (window.supabaseClient) {
          const updatePayload = {
            name: nameVal || users[idx].name,
            email: emailVal !== undefined ? emailVal : users[idx].email,
            phone: phoneVal || users[idx].phone,
            address: addressVal !== undefined ? addressVal : (users[idx].address || '')
          };
          if (newPw) {
            updatePayload.password_hash = sha256(newPw);
          }
          window.supabaseClient.from('users').update(updatePayload).eq('id', user.id).then(({ error }) => {
            if (error) {
              console.error('Supabase Profile Update Error:', error.message);
            } else {
              if (window.SupabaseSync && typeof window.SupabaseSync.syncAllData === 'function') {
                window.SupabaseSync.syncAllData();
              }
            }
          });
        }
      }

      alert('개인정보가 성공적으로 변경되었습니다.');
      closeProfileEditModal();
      updateSessionUI();
    });
  }

  // --- Password Visibility Toggle (Profile Edit & General) ---
  document.querySelectorAll('.pw-toggle-btn').forEach(btn => {
    if (btn.dataset.pwToggleInit === 'true') return;
    btn.dataset.pwToggleInit = 'true';
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const targetId = btn.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = btn.querySelector('i');
      if (!input) return;
      if (input.type === 'password') {
        input.type = 'text';
        if (icon) {
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
        btn.setAttribute('aria-pressed', 'true');
      } else {
        input.type = 'password';
        if (icon) {
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        }
        btn.setAttribute('aria-pressed', 'false');
      }
    });
  });

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

