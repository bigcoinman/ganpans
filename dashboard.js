// dashboard.js - My Page & Business Dashboard Logic

document.addEventListener('DOMContentLoaded', () => {
  // Load State from LocalStorage
  let users = JSON.parse(localStorage.getItem('users')) || [];
  let activeUser = JSON.parse(localStorage.getItem('activeUser')) || null;

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

  const bizItemsList = document.getElementById('biz-items-list');

  // Mobile Simulator Elements
  const mobileFileZone = document.getElementById('mobile-file-zone');
  const mobPhotosInput = document.getElementById('mob-photos-input');
  const mobPhotoPreviews = document.getElementById('mob-photo-previews');
  const mobPhotoCount = document.getElementById('mob-photo-count');
  const mobileUploadForm = document.getElementById('mobile-upload-form');
  const mobItemName = document.getElementById('mob-item-name');
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

    // Header info update
    let roleText = '일반';
    if (activeUser.role === 'business') {
      roleText = '영업자';
    } else if (activeUser.role === 'admin') {
      roleText = '관리자';
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
      
      if (dashboardTitle) dashboardTitle.textContent = '관리자 대시보드';
      if (dashboardSubtitle) dashboardSubtitle.textContent = '관리자 모드입니다';
      
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
            headerTitle.innerHTML = `<i class="fa-solid fa-user-shield"></i> 간판지원단 관리자 대시보드 콘솔`;
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
    renderManagerPanel();
    renderPopupManager();
    renderApplicationsList();
    if (activeUser.role === 'admin') {
      if (adminStatsContainer) adminStatsContainer.style.display = 'grid';
      renderAdminStats();
    } else {
      if (adminStatsContainer) adminStatsContainer.style.display = 'none';
    }
    if (activeUser.role !== 'admin') {
      renderUserApplicationsList();
    }
  };

  // --- Logout ---
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('activeUser');
      alert('로그아웃 되었습니다.');
      window.location.href = 'index.html';
    });
  }

  // --- Render Dashboard Views ---
  const renderDashboard = () => {
    dashboardUserName.textContent = `${activeUser.name}님 (${activeUser.id})`;

    if (activeUser.role === 'business') {
      dashboardUserRole.textContent = `영업자 코드 (${activeUser.bizCode})`;
      dashboardUserRole.style.background = 'var(--accent-secondary)';
      dashboardNormalView.style.display = 'none';
      dashboardBusinessView.style.display = 'block';

      renderBusinessDashboard();
    } else if (activeUser.role === 'admin') {
      dashboardUserRole.textContent = '최고관리자';
      dashboardUserRole.style.background = 'var(--grad-sunset)';
      dashboardNormalView.style.display = 'none';
      dashboardBusinessView.style.display = 'none';
    } else {
      dashboardUserRole.textContent = '일반 회원';
      dashboardUserRole.style.background = 'var(--accent-primary)';
      dashboardNormalView.style.display = 'block';
      dashboardBusinessView.style.display = 'none';

      // Conversion status
      if (activeUser.isSNS) {
        btnRequestConversion.style.display = 'none';
        conversionRestrictedMsg.style.display = 'block';
        conversionPendingMsg.style.display = 'none';
      } else if (activeUser.conversionStatus === 'pending') {
        btnRequestConversion.style.display = 'none';
        conversionRestrictedMsg.style.display = 'none';
        conversionPendingMsg.style.display = 'block';
      } else {
        btnRequestConversion.style.display = 'inline-flex';
        conversionRestrictedMsg.style.display = 'none';
        conversionPendingMsg.style.display = 'none';
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

        alert('영업자 회원 전환 신청이 접수되었습니다. 하단 [매니저 승인 콘솔]에서 즉시 승인 테스트를 하실 수 있습니다.');
        updateSessionUI();
      }
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
      // GP-로 시작하는 신청건인 경우, applications의 최신 심사 결과를 반영
      if (typeof item.id === 'string' && item.id.startsWith('GP-')) {
        const matchingApp = apps.find(app => app.id === item.id);
        if (matchingApp) {
          let updatedProgress = item.progressStatus;
          if (matchingApp.status === 'approved') {
            updatedProgress = '승인 완료';
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
            <h4 class="biz-item-name">${escapeHtml(item.name)}</h4>
            <p class="biz-item-addr"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(item.address)}</p>
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

      // Check if format is valid (GP-YYYYMMDD-XXXX)
      const idPattern = /^GP-\d{8}-\d{4}$/;
      if (!idPattern.test(appId)) {
        alert('올바른 신청번호 형식이 아닙니다.\n형식: GP-YYYYMMDD-XXXX (예: GP-20260731-1234)');
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

  // --- Image Resize & Compression (3MB Limit Guarantee) ---
  const resizeImageToLimit = (file, maxSizeBytes = 3 * 1024 * 1024) => {
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

    if (selectedPhotos.length + files.length > 10) {
      alert('영업 물건 현장 사진은 최대 10장 까지만 업로드 할 수 있습니다.');
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

    mobPhotoCount.textContent = `선택된 사진: ${selectedPhotos.length} / 10장`;
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

      if (selectedPhotos.length >= 10) {
        alert('현장 사진은 최대 10장 까지만 등록할 수 있습니다.');
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
      const addrVal = mobItemAddress.value.trim();

      if (!nameVal || !addrVal) {
        alert('상호명과 설치 주소를 모두 입력해 주세요.');
        return;
      }

      const photoUrls = selectedPhotos.map(file => URL.createObjectURL(file));

      const newItem = {
        id: Date.now(),
        name: nameVal,
        address: addrVal,
        photosCount: selectedPhotos.length,
        receiptStatus: '접수 완료 (경기도시장상권진흥원)',
        progressStatus: '심사 대기',
        photos: photoUrls
      };

      activeUser.items = activeUser.items || [];
      activeUser.items.push(newItem);

      users = users.map(u => u.id === activeUser.id ? { ...u, items: activeUser.items } : u);
      localStorage.setItem('users', JSON.stringify(users));
      localStorage.setItem('activeUser', JSON.stringify(activeUser));

      alert(`영업물건 [${nameVal}] 등록이 성공적으로 완료되었습니다!\n(경기도시장상권진흥원 접수 상태가 '접수 완료'로 반영되었습니다.)`);

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

  const renderManagerPanel = () => {
    if (activeUser.role !== 'admin') return;
    if (!managerRequestsList || !managerItemsList) return;

    // 1. Render Requests
    managerRequestsList.innerHTML = '';
    const pendingUsers = users.filter(u => u.conversionStatus === 'pending');

    if (pendingUsers.length === 0) {
      managerRequestsList.innerHTML = `<p class="text-muted" style="text-align: center; padding: 30px 0;">대기 중인 승인 신청이 없습니다.</p>`;
    } else {
      pendingUsers.forEach(u => {
        const row = document.createElement('div');
        row.className = 'request-item';
        row.innerHTML = `
          <div class="request-item-details">
            <div><strong>신청자 ID:</strong> ${u.id}</div>
            <div><strong>성명:</strong> ${u.name}</div>
            <div><strong>연락처:</strong> ${u.phone}</div>
            <div><strong>주소:</strong> ${u.address}</div>
          </div>
          <div class="request-item-actions">
            <button class="btn btn-secondary btn-sm btn-reject-conversion" data-uid="${u.id}"><i class="fa-solid fa-xmark"></i> 반려</button>
            <button class="btn btn-primary btn-sm btn-approve-conversion" data-uid="${u.id}" style="background: var(--accent-success); border: none;"><i class="fa-solid fa-check"></i> 승인</button>
          </div>
        `;
        managerRequestsList.appendChild(row);
      });

      document.querySelectorAll('.btn-approve-conversion').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const uid = e.target.closest('button').dataset.uid;
          approveUserConversion(uid);
        });
      });

      document.querySelectorAll('.btn-reject-conversion').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const uid = e.target.closest('button').dataset.uid;
          rejectUserConversion(uid);
        });
      });
    }

    // 2. Render Business Items
    managerItemsList.innerHTML = '';
    let hasItems = false;

    users.forEach(u => {
      if (u.role === 'business' && u.items && u.items.length > 0) {
        u.items.forEach(item => {
          hasItems = true;
          const row = document.createElement('div');
          row.className = 'manager-item-row';
          row.innerHTML = `
            <div class="manager-item-row-title">${item.name} (${u.name} 영업자)</div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); text-align: left;">주소: ${item.address}</div>
            
            <div class="status-select-wrapper">
              <label style="font-size: 0.75rem; font-weight: 700;">접수:</label>
              <select class="status-select select-receipt-status" data-uid="${u.id}" data-itemid="${item.id}">
                <option value="접수 대기" ${item.receiptStatus === '접수 대기' ? 'selected' : ''}>접수 대기</option>
                <option value="접수 완료 (경기도시장상권진흥원)" ${item.receiptStatus === '접수 완료 (경기도시장상권진흥원)' ? 'selected' : ''}>접수 완료</option>
              </select>
              
              <label style="font-size: 0.75rem; font-weight: 700; margin-left: 10px;">진행:</label>
              <select class="status-select select-progress-status" data-uid="${u.id}" data-itemid="${item.id}">
                <option value="심사 대기" ${item.progressStatus === '심사 대기' ? 'selected' : ''}>심사 대기</option>
                <option value="서류 보완 필요" ${item.progressStatus === '서류 보완 필요' ? 'selected' : ''}>서류 보완 필요</option>
                <option value="서류 심사 통과" ${item.progressStatus === '서류 심사 통과' ? 'selected' : ''}>서류 심사 통과</option>
                <option value="현장 실사 중" ${item.progressStatus === '현장 실사 중' ? 'selected' : ''}>현장 실사 중</option>
                <option value="지원금 최종 승인" ${item.progressStatus === '지원금 최종 승인' ? 'selected' : ''}>지원금 최종 승인</option>
                <option value="간판 시공 중" ${item.progressStatus === '간판 시공 중' ? 'selected' : ''}>간판 시공 중</option>
                <option value="시공 완료" ${item.progressStatus === '시공 완료' ? 'selected' : ''}>시공 완료</option>
              </select>
            </div>
          `;
          managerItemsList.appendChild(row);
        });
      }
    });

    if (!hasItems) {
      managerItemsList.innerHTML = `<p class="text-muted" style="text-align: center; padding: 30px 0;">등록된 영업물건이 없습니다.</p>`;
    } else {
      document.querySelectorAll('.select-receipt-status').forEach(select => {
        select.addEventListener('change', (e) => {
          const uid = e.target.dataset.uid;
          const itemId = parseInt(e.target.dataset.itemid);
          const val = e.target.value;
          updateItemStatus(uid, itemId, 'receipt', val);
        });
      });

      document.querySelectorAll('.select-progress-status').forEach(select => {
        select.addEventListener('change', (e) => {
          const uid = e.target.dataset.uid;
          const itemId = parseInt(e.target.dataset.itemid);
          const val = e.target.value;
          updateItemStatus(uid, itemId, 'progress', val);
        });
      });
    }
  };

  const approveUserConversion = (uid) => {
    if (activeUser.role !== 'admin') return;
    const code = `BIZ-2026-${Math.floor(1000 + Math.random() * 9000)}`;

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
    alert(`영업자 전환 신청이 승인되었습니다.\n\n발급된 영업자 코드: [${code}]`);
    updateSessionUI();
  };

  const rejectUserConversion = (uid) => {
    if (activeUser.role !== 'admin') return;
    users = users.map(u => {
      if (u.id === uid) {
        return { ...u, conversionStatus: 'none' };
      }
      return u;
    });

    localStorage.setItem('users', JSON.stringify(users));
    alert('영업자 신청이 반려되었습니다.');
    updateSessionUI();
  };

  const updateItemStatus = (uid, itemId, type, value) => {
    if (activeUser.role !== 'admin') return;
    users = users.map(u => {
      if (u.id === uid) {
        const updatedItems = u.items.map(item => {
          if (item.id === itemId) {
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
    updateSessionUI();
  };

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
      localStorage.removeItem('activeUser');

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

    if (apps.length === 0) {
      applicationsTableBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-muted" style="text-align: center; padding: 40px 0;">접수된 온라인 간편 지원 신청이 없습니다.</td>
        </tr>
      `;
      return;
    }

    applicationsTableBody.innerHTML = '';
    
    // Sort applications by applied date descending (latest first)
    const sortedApps = [...apps].sort((a, b) => b.id - a.id);

    sortedApps.forEach(app => {
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
        statusBadge = `<span style="background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.75rem;"><i class="fa-solid fa-circle-check"></i> 승인 완료</span>`;
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

  // Initial Sync
  updateSessionUI();
  resetPopupForm();
});

// ==========================================
// PWA & Mobile App Installation Logic
// ==========================================
function initPWA() {
  // Service Worker Registration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then((reg) => console.log('Service Worker registered successfully:', reg.scope))
      .catch((err) => console.warn('Service Worker registration failed:', err));
  }

  // UI Elements
  const installModal = document.getElementById('install-modal');
  const btnClose = document.getElementById('install-modal-close');
  const btnNav = document.getElementById('nav-install-app');
  const qrImg = document.getElementById('install-qr-img');
  const qrSection = document.getElementById('install-qr-section');
  const btnTabAndroid = document.getElementById('btn-tab-android');
  const btnTabIos = document.getElementById('btn-tab-ios');
  const guideAndroid = document.getElementById('install-guide-android');
  const guideIos = document.getElementById('install-guide-ios');
  const pwaInstallBtn = document.getElementById('pwa-install-btn');
  const pwaShareBtn = document.getElementById('pwa-share-btn');

  if (!installModal) return;

  // Open Modal Logic
  const openModal = (e) => {
    e.preventDefault();
    
    // Set QR code URL dynamically based on the current domain/IP
    if (qrImg) {
      // For dashboard.html, let's point the QR code to the main index page index.html
      const currentUrl = window.location.href.replace('dashboard.html', 'index.html');
      qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}`;
    }

    // Hide QR section on mobile devices
    if (qrSection) {
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        qrSection.style.display = 'none';
      } else {
        qrSection.style.display = 'flex';
      }
    }

    installModal.classList.add('active');
  };

  if (btnNav) btnNav.addEventListener('click', openModal);

  // Close Modal Logic
  const closeModal = () => {
    installModal.classList.remove('active');
  };

  if (btnClose) btnClose.addEventListener('click', closeModal);
  installModal.addEventListener('click', (e) => {
    if (e.target === installModal) closeModal();
  });

  // Tab Switching Logic
  if (btnTabAndroid && btnTabIos && guideAndroid && guideIos) {
    btnTabAndroid.addEventListener('click', () => {
      btnTabAndroid.classList.add('active');
      btnTabIos.classList.remove('active');
      guideAndroid.classList.add('active');
      guideIos.classList.remove('active');
    });

    btnTabIos.addEventListener('click', () => {
      btnTabIos.classList.add('active');
      btnTabAndroid.classList.remove('active');
      guideIos.classList.add('active');
      guideAndroid.classList.remove('active');
    });
  }

  // PWA Install Prompt handling
  let deferredPrompt;
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (pwaInstallBtn) {
      pwaInstallBtn.style.display = 'flex';
    }
  });

  if (pwaInstallBtn) {
    pwaInstallBtn.addEventListener('click', () => {
      if (!deferredPrompt) return;
      pwaInstallBtn.disabled = true;
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('PWA installation accepted by user');
        } else {
          console.log('PWA installation dismissed by user');
        }
        deferredPrompt = null;
        pwaInstallBtn.style.display = 'none';
        pwaInstallBtn.disabled = false;
      });
    });
  }

  // PWA Share handling
  if (pwaShareBtn) {
    pwaShareBtn.addEventListener('click', () => {
      const shareData = {
        title: '간판지원단 모바일 앱',
        text: '경기도 소상공인 경영환경개선사업 간판지원단 모바일 앱 설치 링크입니다. 스마트폰에 홈 화면 앱으로 설치해 간편하게 이용하세요!',
        url: window.location.origin + '/index.html' // Point dashboard sharing directly to index page
      };

      if (navigator.share) {
        navigator.share(shareData)
          .then(() => console.log('PWA link shared successfully'))
          .catch((err) => console.log('Error sharing PWA link:', err));
      } else {
        // Fallback: Copy to clipboard
        const shareUrl = shareData.url;
        navigator.clipboard.writeText(shareUrl)
          .then(() => {
            alert('모바일 앱 설치 링크가 클립보드에 복사되었습니다.\n카카오톡이나 문자메시지 등에 붙여넣어 공유해보세요!');
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

