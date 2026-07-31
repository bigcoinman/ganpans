// app.js - Mobile App Interactive Logic & State Management

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let activeUser = JSON.parse(localStorage.getItem('activeUser')) || null;
    let applications = JSON.parse(localStorage.getItem('applications')) || [];
    
    // --- Drawer Menu Selectors ---
    const menuTrigger = document.getElementById('app-menu-trigger');
    const drawerOverlay = document.getElementById('app-drawer-overlay');
    const drawer = document.getElementById('app-drawer');
    const drawerClose = document.getElementById('app-drawer-close');
    const drawerUserName = document.getElementById('drawer-user-name');
    const drawerUserRole = document.getElementById('drawer-user-role');
    const drawerAuthLinks = document.getElementById('drawer-auth-links');
    const drawerLogoutLinks = document.getElementById('drawer-logout-links');

    // --- Tab Selectors ---
    const tabs = document.querySelectorAll('.app-view');
    const navItems = document.querySelectorAll('.nav-item');

    // --- Initialize Drawer Event Listeners ---
    if (menuTrigger && drawer && drawerOverlay) {
        menuTrigger.addEventListener('click', openDrawer);
        drawerClose.addEventListener('click', closeDrawer);
        drawerOverlay.addEventListener('click', closeDrawer);
    }

    function openDrawer() {
        drawer.classList.add('active');
        drawerOverlay.classList.add('active');
        updateDrawerProfile();
    }

    window.closeDrawer = function() {
        drawer.classList.remove('active');
        drawerOverlay.classList.remove('active');
    };

    function updateDrawerProfile() {
        if (activeUser) {
            drawerUserName.textContent = `${activeUser.name}님`;
            if (activeUser.role === 'admin') {
                drawerUserRole.textContent = '최고관리자';
                drawerUserRole.style.background = 'var(--grad-primary)';
                drawerUserRole.style.color = '#fff';
            } else if (activeUser.role === 'business') {
                drawerUserRole.textContent = `영업자 (${activeUser.bizCode})`;
                drawerUserRole.style.background = 'var(--accent-secondary)';
                drawerUserRole.style.color = '#fff';
            } else {
                drawerUserRole.textContent = '일반 회원';
                drawerUserRole.style.background = 'var(--accent-primary)';
                drawerUserRole.style.color = '#fff';
            }
            drawerAuthLinks.style.display = 'none';
            drawerLogoutLinks.style.display = 'block';
        } else {
            drawerUserName.textContent = '게스트님';
            drawerUserRole.textContent = '비회원';
            drawerUserRole.style.background = 'var(--text-muted)';
            drawerAuthLinks.style.display = 'block';
            drawerLogoutLinks.style.display = 'none';
        }
    }

    // --- Tab Switching Logic ---
    window.switchTab = function(tabId) {
        tabs.forEach(tab => {
            if (tab.id === `view-${tabId}`) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        navItems.forEach(btn => {
            if (btn.id === `tab-btn-${tabId}`) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Trigger Tab-Specific Renderings
        if (tabId === 'status') {
            renderStatusTab();
        } else if (tabId === 'apply') {
            initMobileWizard();
        }
        
        // Auto scroll to top on tab switch
        const activeTab = document.getElementById(`view-${tabId}`);
        if (activeTab) {
            activeTab.scrollTop = 0;
        }
    };

    // --- Home View: Eligibility Checklist ---
    window.toggleCheckCard = function(card) {
        card.classList.toggle('checked');
        const checkedCards = document.querySelectorAll('#view-home .check-card.checked');
        const statusBox = document.getElementById('eligibility-status');
        
        if (!statusBox) return;

        if (checkedCards.length === 3) {
            statusBox.innerHTML = '자가진단 결과: <span class="status-badge eligible">적격 (모든 자격을 만족합니다!)</span>';
        } else if (checkedCards.length === 0) {
            statusBox.innerHTML = '자가진단 결과: <span class="status-badge checking">확인 중...</span>';
        } else {
            statusBox.innerHTML = '자가진단 결과: <span class="status-badge ineligible">부적격 (일부 자격 미달)</span>';
        }
    };

    // --- Home View: Mini Simulator Day/Night Toggle ---
    let isNightMode = false;
    window.toggleDayNightSim = function() {
        isNightMode = !isNightMode;
        
        const toggles = document.querySelectorAll('.day-night-toggle');
        toggles.forEach(toggle => {
            const dayTab = toggle.querySelector('.day');
            const nightTab = toggle.querySelector('.night');
            
            if (isNightMode) {
                dayTab.classList.remove('active');
                nightTab.classList.add('active');
            } else {
                dayTab.classList.add('active');
                nightTab.classList.remove('active');
            }
        });

        const canvases = [document.getElementById('sim-canvas'), document.getElementById('full-sim-canvas')];
        canvases.forEach(canvas => {
            if (!canvas) return;
            if (isNightMode) {
                canvas.classList.remove('day-mode');
                canvas.classList.add('night-mode');
            } else {
                canvas.classList.add('day-mode');
                canvas.classList.remove('night-mode');
            }
        });
    };

    // Sync Home Widget input with preview
    const simInputText = document.getElementById('sim-input-text');
    const simTextDisplay = document.getElementById('sim-text-display');
    if (simInputText && simTextDisplay) {
        simInputText.addEventListener('input', (e) => {
            const val = e.target.value.trim() || '우리 매장 이름';
            simTextDisplay.textContent = val;
            
            // Sync with full simulator tab too
            const fullInput = document.getElementById('full-sim-input-text');
            const fullDisplay = document.getElementById('full-sim-text-display');
            if (fullInput) fullInput.value = val;
            if (fullDisplay) fullDisplay.textContent = val;
        });
    }

    // --- Full Simulator Tab Interactivity ---
    const fullSimInputText = document.getElementById('full-sim-input-text');
    const fullSimTextDisplay = document.getElementById('full-sim-text-display');
    const fullSimSignboard = document.getElementById('full-sim-signboard');
    
    const simFontSize = document.getElementById('sim-font-size');
    const simStyleSelect = document.getElementById('sim-style-select');
    const simFontSelect = document.getElementById('sim-font-select');
    const colorDots = document.querySelectorAll('.color-dot');

    if (fullSimInputText && fullSimTextDisplay) {
        fullSimInputText.addEventListener('input', (e) => {
            const val = e.target.value.trim() || '우리 매장 이름';
            fullSimTextDisplay.textContent = val;
            
            // Sync back to home widget
            if (simInputText) simInputText.value = val;
            if (simTextDisplay) simTextDisplay.textContent = val;
        });
    }

    if (simFontSize && fullSimTextDisplay) {
        simFontSize.addEventListener('input', (e) => {
            fullSimTextDisplay.style.fontSize = `${e.target.value / 20}rem`;
        });
    }

    if (simStyleSelect && fullSimSignboard) {
        simStyleSelect.addEventListener('change', (e) => {
            const style = e.target.value;
            // Reset styles
            fullSimSignboard.style.border = '1px solid #ddd';
            fullSimSignboard.style.background = '#ffffff';
            fullSimSignboard.style.borderRadius = '4px';
            fullSimSignboard.style.boxShadow = 'var(--shadow-sm)';
            
            if (style === 'led-channel') {
                fullSimSignboard.style.background = 'transparent';
                fullSimSignboard.style.border = 'none';
                fullSimSignboard.style.boxShadow = 'none';
            } else if (style === 'titanium-backlight') {
                fullSimSignboard.style.background = '#27272a'; // dark titanium frame
                fullSimSignboard.style.border = '1px solid #3f3f46';
                fullSimSignboard.style.borderRadius = '6px';
            } else if (style === 'acrylic-box') {
                fullSimSignboard.style.background = 'rgba(255,255,255,0.9)';
                fullSimSignboard.style.border = '2px solid var(--accent-primary)';
                fullSimSignboard.style.borderRadius = '0';
            }
        });
    }

    if (simFontSelect && fullSimTextDisplay) {
        simFontSelect.addEventListener('change', (e) => {
            fullSimTextDisplay.style.fontFamily = e.target.value;
        });
    }

    colorDots.forEach(dot => {
        dot.addEventListener('click', (e) => {
            colorDots.forEach(d => d.classList.remove('active'));
            dot.classList.add('active');
            
            const color = dot.dataset.color;
            if (fullSimTextDisplay) {
                fullSimTextDisplay.style.color = color;
            }
        });
    });

    window.applySimToWizard = function() {
        const textVal = fullSimInputText?.value.trim() || '우리 매장 이름';
        const signStyleName = simStyleSelect ? simStyleSelect.options[simStyleSelect.selectedIndex].text : '플렉스(기본형)';
        
        // Switch tab to Apply
        switchTab('apply');
        
        // Prefill Wizard Step 2 inputs
        setTimeout(() => {
            const shopNameInput = document.getElementById('app-shop-name-mob');
            const signTypeInput = document.getElementById('app-sign-type-mob');
            if (shopNameInput && textVal !== '우리 매장 이름') {
                shopNameInput.value = textVal;
            }
            if (signTypeInput) {
                signTypeInput.value = signStyleName;
            }
        }, 100);
    };

    // --- 4. Simple Application Wizard (Apply Tab) ---
    let wizardStep = 1;
    let uploadedFileBase64 = '';
    const wizardPanes = document.querySelectorAll('.mob-step-pane');
    const wizardNodes = document.querySelectorAll('.mob-node');
    const wizardProgressBar = document.getElementById('mob-wizard-progress-bar');
    const prevBtn = document.getElementById('prev-step-mob');
    const nextBtn = document.getElementById('next-step-mob');

    const fileUploadArea = document.getElementById('file-upload-area-mob');
    const storePhotoInput = document.getElementById('store-photo-mob');
    const fileNameDisplay = document.getElementById('uploaded-file-name-mob');

    function initMobileWizard() {
        wizardStep = 1;
        uploadedFileBase64 = '';
        if (fileNameDisplay) fileNameDisplay.style.display = 'none';
        
        // Pre-populate referrer code from URL if present
        const urlParams = new URLSearchParams(window.location.search);
        const refCode = urlParams.get('ref');
        const refInput = document.getElementById('referrer-code-mob');
        if (refCode && refInput) {
            refInput.value = refCode.trim();
        }

        // Set Sign style if empty
        const signTypeInput = document.getElementById('app-sign-type-mob');
        if (signTypeInput && !signTypeInput.value) {
            signTypeInput.value = '플렉스 플랫 간판 (기본형)';
        }

        renderWizard();
    }

    if (fileUploadArea && storePhotoInput) {
        fileUploadArea.addEventListener('click', () => {
            storePhotoInput.click();
        });

        storePhotoInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const file = e.target.files[0];
                if (fileNameDisplay) {
                    fileNameDisplay.textContent = `✓ 업로드됨: ${file.name}`;
                    fileNameDisplay.style.display = 'block';
                }

                // Read base64
                const reader = new FileReader();
                reader.onload = (event) => {
                    uploadedFileBase64 = event.target.result;
                };
                reader.readAsDataURL(file);
            }
        });
    }

    function renderWizard() {
        wizardPanes.forEach((pane, idx) => {
            if (idx + 1 === wizardStep) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });

        wizardNodes.forEach((node, idx) => {
            if (idx + 1 < wizardStep) {
                node.className = 'mob-node complete';
                node.innerHTML = '<i class="fas fa-check"></i>';
            } else if (idx + 1 === wizardStep) {
                node.className = 'mob-node active';
                node.textContent = idx + 1;
            } else {
                node.className = 'mob-node';
                node.textContent = idx + 1;
            }
        });

        const percent = ((wizardStep - 1) / 2) * 100;
        if (wizardProgressBar) {
            wizardProgressBar.style.width = `${percent}%`;
        }

        if (wizardStep === 1) {
            prevBtn.style.visibility = 'hidden';
        } else {
            prevBtn.style.visibility = 'visible';
        }

        if (wizardStep === 3) {
            nextBtn.textContent = '신청서 접수';
            nextBtn.className = 'btn btn-primary btn-success';
            compileSummaryMob();
        } else {
            nextBtn.textContent = '다음 단계';
            nextBtn.className = 'btn btn-primary';
        }
    }

    function compileSummaryMob() {
        document.getElementById('sum-owner-name-mob').textContent = document.getElementById('owner-name-mob')?.value.trim() || '-';
        document.getElementById('sum-owner-phone-mob').textContent = document.getElementById('owner-phone-mob')?.value.trim() || '-';
        document.getElementById('sum-store-name-mob').textContent = document.getElementById('app-shop-name-mob')?.value.trim() || '-';
        document.getElementById('sum-store-address-mob').textContent = document.getElementById('store-address-mob')?.value.trim() || '-';
        document.getElementById('sum-sign-type-mob').textContent = document.getElementById('app-sign-type-mob')?.value || '-';
        
        const photoInput = document.getElementById('store-photo-mob');
        document.getElementById('sum-file-name-mob').textContent = photoInput && photoInput.files.length > 0 ? photoInput.files[0].name : '업로드 파일 없음';
        
        const refVal = document.getElementById('referrer-code-mob')?.value.trim() || '-';
        document.getElementById('sum-referrer-code-mob').textContent = refVal;
    }

    function validateStep(step) {
        if (step === 1) {
            const name = document.getElementById('owner-name-mob')?.value.trim();
            const phone = document.getElementById('owner-phone-mob')?.value.trim();
            if (!name || !phone) {
                alert('대표자 성명과 휴대폰 번호를 모두 기입해 주세요.');
                return false;
            }
        } else if (step === 2) {
            const storeName = document.getElementById('app-shop-name-mob')?.value.trim();
            const address = document.getElementById('store-address-mob')?.value.trim();
            if (!storeName || !address) {
                alert('상호명과 설치 예정지 주소를 모두 기입해 주세요.');
                return false;
            }
        }
        return true;
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            if (wizardStep > 1) {
                wizardStep--;
                renderWizard();
            }
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            if (wizardStep === 3) {
                submitApplicationMob();
                return;
            }

            if (validateStep(wizardStep)) {
                wizardStep++;
                renderWizard();
            }
        });
    }

    function submitApplicationMob() {
        const ownerName = document.getElementById('owner-name-mob')?.value.trim() || '';
        const ownerPhone = document.getElementById('owner-phone-mob')?.value.trim() || '';
        const storeName = document.getElementById('app-shop-name-mob')?.value.trim() || '';
        const storeAddress = document.getElementById('store-address-mob')?.value.trim() || '';
        const signType = document.getElementById('app-sign-type-mob')?.value || '';
        const photoInput = document.getElementById('store-photo-mob');
        const fileName = photoInput && photoInput.files.length > 0 ? photoInput.files[0].name : '업로드 파일 없음';
        const referrerCode = document.getElementById('referrer-code-mob')?.value.trim() || '';

        const userId = activeUser ? activeUser.id : 'guest';

        // GP-ID Generation
        const padZero = (n) => String(n).padStart(2, '0');
        const now = new Date();
        const dateStr = `${now.getFullYear()}${padZero(now.getMonth() + 1)}${padZero(now.getDate())}`;
        const randVal = Math.floor(1000 + Math.random() * 9000);
        const customId = `GP-${dateStr}-${randVal}`;

        const newApp = {
            id: customId,
            userId,
            ownerName,
            ownerPhone,
            storeName,
            storeAddress,
            signType,
            fileName,
            fileData: uploadedFileBase64,
            appliedAt: now.toISOString(),
            status: 'pending',
            referrerCode
        };

        // Save
        const apps = JSON.parse(localStorage.getItem('applications')) || [];
        apps.push(newApp);
        localStorage.setItem('applications', JSON.stringify(apps));

        // Auto refer link (방안 A)
        if (referrerCode) {
            let dbUsers = JSON.parse(localStorage.getItem('users')) || [];
            let bizFound = false;

            const newBizItem = {
                id: customId,
                name: storeName,
                address: storeAddress,
                photosCount: uploadedFileBase64 ? 1 : 0,
                receiptStatus: '접수 완료 (간판지원단)',
                progressStatus: '심사 대기',
                photos: uploadedFileBase64 ? [uploadedFileBase64] : []
            };

            dbUsers = dbUsers.map(u => {
                if (u.role === 'business' && u.bizCode === referrerCode) {
                    u.items = u.items || [];
                    if (!u.items.some(item => item.id === customId)) {
                        u.items.push(newBizItem);
                        bizFound = true;
                    }
                }
                return u;
            });

            if (bizFound) {
                localStorage.setItem('users', JSON.stringify(dbUsers));
                // Reload list if active
                if (activeUser && activeUser.role === 'business' && activeUser.bizCode === referrerCode) {
                    activeUser.items = activeUser.items || [];
                    activeUser.items.push(newBizItem);
                    localStorage.setItem('activeUser', JSON.stringify(activeUser));
                }
            }
        }

        // Show Success Modal
        const successModal = document.getElementById('success-modal-mob');
        const successIdContainer = document.getElementById('success-app-id-container-mob');
        if (successIdContainer) {
            successIdContainer.textContent = customId;
        }
        if (successModal) {
            successModal.classList.add('active');
        }
    }

    const successConfirmBtn = document.getElementById('success-confirm-mob');
    if (successConfirmBtn) {
        successConfirmBtn.addEventListener('click', () => {
            const successModal = document.getElementById('success-modal-mob');
            if (successModal) {
                successModal.classList.remove('active');
            }

            // Reset Wizard Inputs
            document.getElementById('owner-name-mob').value = '';
            document.getElementById('owner-phone-mob').value = '';
            document.getElementById('owner-email-mob').value = '';
            document.getElementById('referrer-code-mob').value = '';
            document.getElementById('app-shop-name-mob').value = '';
            document.getElementById('store-address-mob').value = '';
            const fileInput = document.getElementById('store-photo-mob');
            if (fileInput) fileInput.value = '';
            uploadedFileBase64 = '';

            switchTab('home');
        });
    }

    // --- 5. Status & Dashboard View Render Logic ---
    function renderStatusTab() {
        users = JSON.parse(localStorage.getItem('users')) || [];
        activeUser = JSON.parse(localStorage.getItem('activeUser')) || null;
        applications = JSON.parse(localStorage.getItem('applications')) || [];

        const statusLoggedOut = document.getElementById('status-logged-out');
        const statusLoggedIn = document.getElementById('status-logged-in');

        if (!activeUser) {
            statusLoggedOut.style.display = 'flex';
            statusLoggedIn.style.display = 'none';
            return;
        }

        statusLoggedOut.style.display = 'none';
        statusLoggedIn.style.display = 'block';

        // Render User Header Profile
        document.getElementById('status-user-name').textContent = `${activeUser.name}님 (${activeUser.id})`;
        const roleBadge = document.getElementById('status-user-role-badge');
        
        // Hide all containers first
        const normalContainer = document.getElementById('status-normal-container');
        const businessContainer = document.getElementById('status-business-container');
        const adminContainer = document.getElementById('status-admin-container');
        
        normalContainer.style.display = 'none';
        businessContainer.style.display = 'none';
        adminContainer.style.display = 'none';

        if (activeUser.role === 'admin') {
            roleBadge.textContent = '최고관리자';
            roleBadge.style.background = 'var(--grad-primary)';
            adminContainer.style.display = 'block';
            renderAdminDashboardMob();
        } else if (activeUser.role === 'business') {
            roleBadge.textContent = `영업자 코드: ${activeUser.bizCode}`;
            roleBadge.style.background = 'var(--accent-secondary)';
            businessContainer.style.display = 'block';
            renderBusinessDashboardMob();
        } else {
            roleBadge.textContent = '일반 회원';
            roleBadge.style.background = 'var(--accent-primary)';
            normalContainer.style.display = 'block';
            renderNormalDashboardMob();
        }
    }

    // --- 5.1. Normal User Dashboard Rendering ---
    function renderNormalDashboardMob() {
        const myAppsList = document.getElementById('my-apps-list-mobile');
        const conversionPanel = document.getElementById('mobile-conversion-panel');
        const conversionPendingMsg = document.getElementById('conversion-pending-msg-mob');
        const btnRequestConversion = document.getElementById('btn-request-conversion-mob');

        // Apply converter state
        if (activeUser.conversionStatus === 'pending') {
            btnRequestConversion.style.display = 'none';
            conversionPendingMsg.style.display = 'block';
        } else {
            btnRequestConversion.style.display = 'block';
            conversionPendingMsg.style.display = 'none';
        }

        const myApps = applications.filter(app => app.userId === activeUser.id);
        if (!myAppsList) return;

        if (myApps.length === 0) {
            myAppsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.8rem;">신청한 간판 교체 지원 이력이 없습니다.</p>';
            return;
        }

        myAppsList.innerHTML = '';
        myApps.forEach(app => {
            const card = document.createElement('div');
            card.className = 'app-card-mob';
            
            let statusLabel = '심사 대기';
            let statusClass = 'pending';
            if (app.status === 'approved') {
                statusLabel = '승인 완료';
                statusClass = 'approved';
            } else if (app.status === 'rejected') {
                statusLabel = '반려됨';
                statusClass = 'rejected';
            }

            card.innerHTML = `
                <div class="app-card-header">
                    <span class="app-card-title">${escapeHtml(app.storeName)}</span>
                    <span class="app-card-date">${app.appliedAt ? app.appliedAt.split('T')[0] : ''}</span>
                </div>
                <div class="app-card-body-row">주소: ${escapeHtml(app.storeAddress)}</div>
                <div class="app-card-body-row">접수번호: <strong>${app.id}</strong></div>
                <div class="app-card-footer">
                    <span class="badge-status ${statusClass}">${statusLabel}</span>
                    <button class="btn btn-secondary btn-sm btn-delete-app-mob" data-id="${app.id}" style="padding: 4px 10px; font-size: 0.65rem;">신청취소</button>
                </div>
            `;
            myAppsList.appendChild(card);
        });

        // Add Delete application listener
        myAppsList.querySelectorAll('.btn-delete-app-mob').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const appId = e.target.dataset.id;
                if (confirm('정말로 이 신청을 취소하고 내역을 삭제하시겠습니까?')) {
                    let apps = JSON.parse(localStorage.getItem('applications')) || [];
                    apps = apps.filter(app => app.id !== appId);
                    localStorage.setItem('applications', JSON.stringify(apps));
                    renderStatusTab();
                }
            });
        });
    }

    // Normal converter request
    const btnRequestConversionMob = document.getElementById('btn-request-conversion-mob');
    if (btnRequestConversionMob) {
        btnRequestConversionMob.addEventListener('click', () => {
            if (confirm('영업자 회원으로 전환을 신청하시겠습니까? 신청 후 최고관리자 승인을 통해 영업코드가 발급됩니다.')) {
                activeUser.conversionStatus = 'pending';
                users = users.map(u => u.id === activeUser.id ? { ...u, conversionStatus: 'pending' } : u);
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem('activeUser', JSON.stringify(activeUser));
                
                alert('회원 전환 신청이 임시 접수되었습니다. 현황 탭 상단 최고관리자 계정(admin)으로 로그인하여 승인 처리가 가능합니다.');
                renderStatusTab();
            }
        });
    }

    // --- 5.2. Business Rep Dashboard Rendering ---
    function renderBusinessDashboardMob() {
        const bizItemsList = document.getElementById('biz-items-list-mobile');
        if (!bizItemsList) return;

        // Synchronize state with applications DB
        let items = activeUser.items || [];
        const apps = JSON.parse(localStorage.getItem('applications')) || [];
        let itemsUpdated = false;

        items = items.map(item => {
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
            bizItemsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.8rem;">등록된 영업물건이 없습니다. 아래 현장 등록 폼을 채워 신규 추가해 보세요.</p>';
            return;
        }

        bizItemsList.innerHTML = '';
        items.forEach(item => {
            const card = document.createElement('div');
            card.className = 'biz-card-mob';

            let photosHtml = '';
            if (item.photos && item.photos.length > 0) {
                photosHtml = `<div class="biz-card-photos">`;
                item.photos.forEach(src => {
                    photosHtml += `<img src="${src}" alt="사진" class="biz-thumb-mob" onerror="this.src='간판지원단 로고-2.png'">`;
                });
                photosHtml += `</div>`;
            }

            let progressClass = '';
            if (item.progressStatus === '승인 완료') progressClass = 'approved';
            else if (item.progressStatus === '반려됨') progressClass = 'rejected';

            card.innerHTML = `
                <div class="biz-card-title-row">
                    <span class="biz-card-title">${escapeHtml(item.name)}</span>
                    <div class="biz-card-badges">
                        <span class="biz-card-badge receipt">접수 완료</span>
                        <span class="biz-card-badge progress ${progressClass}">${escapeHtml(item.progressStatus)}</span>
                    </div>
                </div>
                <div class="biz-card-addr"><i class="fa-solid fa-location-dot"></i> ${escapeHtml(item.address)}</div>
                ${photosHtml}
            `;
            bizItemsList.appendChild(card);
        });
    }

    // Manual App Linking button click (방안 B)
    const btnLinkAppMob = document.getElementById('btn-link-app-mob');
    const linkAppIdInputMob = document.getElementById('link-app-id-mob');
    if (btnLinkAppMob && linkAppIdInputMob) {
        btnLinkAppMob.addEventListener('click', () => {
            const appId = linkAppIdInputMob.value.trim();
            if (!appId) {
                alert('연동할 고객의 신청번호를 입력해 주세요.');
                return;
            }

            const idPattern = /^GP-\d{8}-\d{4}$/;
            if (!idPattern.test(appId)) {
                alert('신청번호 형식이 올바르지 않습니다. (예: GP-20260731-1234)');
                return;
            }

            const apps = JSON.parse(localStorage.getItem('applications')) || [];
            const targetApp = apps.find(app => app.id === appId);

            if (!targetApp) {
                alert('해당 신청번호로 등록된 간판 신청 건이 존재하지 않습니다.');
                return;
            }

            activeUser.items = activeUser.items || [];
            if (activeUser.items.some(item => item.id === appId)) {
                alert('이미 대시보드에 등록된 신청번호입니다.');
                return;
            }

            const newBizItem = {
                id: targetApp.id,
                name: targetApp.storeName,
                address: targetApp.storeAddress,
                photosCount: targetApp.fileData ? 1 : 0,
                receiptStatus: '접수 완료 (간판지원단)',
                progressStatus: targetApp.status === 'approved' ? '승인 완료' : (targetApp.status === 'rejected' ? '반려됨' : '심사 대기'),
                photos: targetApp.fileData ? [targetApp.fileData] : []
            };

            activeUser.items.push(newBizItem);
            users = users.map(u => u.id === activeUser.id ? { ...u, items: activeUser.items } : u);
            localStorage.setItem('users', JSON.stringify(users));
            localStorage.setItem('activeUser', JSON.stringify(activeUser));

            // Sync referrer code inside applications list
            const updatedApps = apps.map(app => {
                if (app.id === appId) {
                    return { ...app, referrerCode: activeUser.bizCode };
                }
                return app;
            });
            localStorage.setItem('applications', JSON.stringify(updatedApps));

            alert(`고객 신청서 [${targetApp.storeName}] 연동이 완료되었습니다!`);
            linkAppIdInputMob.value = '';
            renderStatusTab();
        });
    }

    // Business Mobile upload file selector
    const mobFileZoneMob = document.getElementById('mobile-file-zone-mob');
    const mobPhotosInputMob = document.getElementById('mob-photos-input-mob');
    const mobPhotoPreviewsMob = document.getElementById('mob-photo-previews-mob');
    const mobPhotoCountMob = document.getElementById('mob-photo-count-mob');
    let selectedPhotosMob = [];

    if (mobFileZoneMob && mobPhotosInputMob) {
        mobFileZoneMob.addEventListener('click', () => {
            mobPhotosInputMob.click();
        });

        mobPhotosInputMob.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                selectedPhotosMob = selectedPhotosMob.concat(files).slice(0, 10);
                renderMobilePhotoPreviewsMob();
            }
        });
    }

    function renderMobilePhotoPreviewsMob() {
        if (!mobPhotoPreviewsMob || !mobPhotoCountMob) return;
        mobPhotoPreviewsMob.innerHTML = '';
        
        selectedPhotosMob.forEach(file => {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            mobPhotoPreviewsMob.appendChild(img);
        });

        mobPhotoCountMob.textContent = `선택된 사진: ${selectedPhotosMob.length} / 10장`;
    }

    const formBizUploadMob = document.getElementById('mobile-upload-form-mob');
    if (formBizUploadMob) {
        formBizUploadMob.addEventListener('submit', (e) => {
            e.preventDefault();
            const nameVal = document.getElementById('mob-item-name-mob')?.value.trim();
            const addressVal = document.getElementById('mob-item-address-mob')?.value.trim();

            if (!nameVal || !addressVal) {
                alert('상호명과 설치 주소를 모두 입력해 주세요.');
                return;
            }

            // Read first photo as base64 or object URL
            const processRegistration = (base64Photo) => {
                const newItem = {
                    id: Date.now(),
                    name: nameVal,
                    address: addressVal,
                    photosCount: selectedPhotosMob.length,
                    receiptStatus: '접수 완료 (간판지원단)',
                    progressStatus: '심사 대기',
                    photos: base64Photo ? [base64Photo] : []
                };

                activeUser.items = activeUser.items || [];
                activeUser.items.push(newItem);

                users = users.map(u => u.id === activeUser.id ? { ...u, items: activeUser.items } : u);
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem('activeUser', JSON.stringify(activeUser));

                alert(`영업물건 [${nameVal}] 등록이 완료되었습니다.`);
                formBizUploadMob.reset();
                selectedPhotosMob = [];
                renderMobilePhotoPreviewsMob();
                renderStatusTab();
            };

            if (selectedPhotosMob.length > 0) {
                const reader = new FileReader();
                reader.onload = (event) => {
                    processRegistration(event.target.result);
                };
                reader.readAsDataURL(selectedPhotosMob[0]);
            } else {
                processRegistration('');
            }
        });
    }

    // --- 5.3. Admin Control Console Rendering ---
    let adminActiveTab = 'requests';
    window.switchAdminTab = function(tabName) {
        adminActiveTab = tabName;
        const btns = document.querySelectorAll('.admin-tab-btn-mob');
        btns.forEach(btn => {
            if (btn.getAttribute('onclick').includes(tabName)) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        const reqPanel = document.getElementById('admin-panel-requests-mob');
        const appsPanel = document.getElementById('admin-panel-apps-mob');

        if (tabName === 'requests') {
            reqPanel.style.display = 'block';
            appsPanel.style.display = 'none';
        } else {
            reqPanel.style.display = 'none';
            appsPanel.style.display = 'block';
        }
    };

    function renderAdminDashboardMob() {
        const totalStat = document.getElementById('admin-stat-total-mob');
        const visitorsStat = document.getElementById('admin-stat-visitors-mob');
        
        if (totalStat) totalStat.textContent = `${applications.length}건`;
        if (visitorsStat) visitorsStat.textContent = `${localStorage.getItem('visitor_today') || '34'}명`;

        // 1) Render Requests (영업자 신청 대기 목록)
        const requestsList = document.getElementById('admin-requests-list-mob');
        if (requestsList) {
            const pendingUsers = users.filter(u => u.conversionStatus === 'pending');
            if (pendingUsers.length === 0) {
                requestsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 15px; font-size: 0.75rem;">승인 대기 중인 회원 전환 신청건이 없습니다.</p>';
            } else {
                requestsList.innerHTML = '';
                pendingUsers.forEach(u => {
                    const card = document.createElement('div');
                    card.className = 'admin-req-card-mob';
                    card.style.marginBottom = '10px';
                    card.innerHTML = `
                        <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 4px;">아이디: ${u.id} (${u.name})</div>
                        <div style="font-size: 0.7rem; color: var(--text-secondary);">연락처: ${u.phone}</div>
                        <div class="admin-action-row-mob">
                            <button class="btn btn-primary btn-sm btn-approve-user-mob" data-uid="${u.id}" style="padding: 4px 8px; font-size: 0.65rem; background: var(--accent-success);"><i class="fa-solid fa-check"></i> 승인</button>
                            <button class="btn btn-secondary btn-sm btn-reject-user-mob" data-uid="${u.id}" style="padding: 4px 8px; font-size: 0.65rem;"><i class="fa-solid fa-xmark"></i> 반려</button>
                        </div>
                    `;
                    requestsList.appendChild(card);
                });

                // Attach actions
                requestsList.querySelectorAll('.btn-approve-user-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const uid = e.target.closest('button').dataset.uid;
                        approveUserConversionMob(uid);
                    });
                });
                requestsList.querySelectorAll('.btn-reject-user-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const uid = e.target.closest('button').dataset.uid;
                        rejectUserConversionMob(uid);
                    });
                });
            }
        }

        // 2) Render Online Applications list
        const appsList = document.getElementById('admin-apps-list-mob');
        if (appsList) {
            if (applications.length === 0) {
                appsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 15px; font-size: 0.75rem;">접수된 온라인 신청서가 없습니다.</p>';
            } else {
                appsList.innerHTML = '';
                // Latest first
                const sortedApps = [...applications].sort((a, b) => b.id - a.id || b.appliedAt.localeCompare(a.appliedAt));
                sortedApps.forEach(app => {
                    const card = document.createElement('div');
                    card.className = 'admin-app-card-mob';
                    
                    let statusBadge = '<span class="badge-status pending">대기 중</span>';
                    if (app.status === 'approved') statusBadge = '<span class="badge-status approved">승인됨</span>';
                    else if (app.status === 'rejected') statusBadge = '<span class="badge-status rejected">반려됨</span>';

                    let actionsHtml = '';
                    if (app.status === 'pending') {
                        actionsHtml = `
                            <div class="admin-action-row-mob">
                                <button class="btn btn-primary btn-sm btn-approve-app-mob" data-id="${app.id}" style="padding: 4px 8px; font-size: 0.65rem; background: var(--accent-success);"><i class="fa-solid fa-check"></i> 승인</button>
                                <button class="btn btn-secondary btn-sm btn-reject-app-mob" data-id="${app.id}" style="padding: 4px 8px; font-size: 0.65rem;"><i class="fa-solid fa-xmark"></i> 반려</button>
                            </div>
                        `;
                    }

                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                            <strong style="font-size: 0.85rem;">${escapeHtml(app.storeName)}</strong>
                            ${statusBadge}
                        </div>
                        <div style="font-size: 0.7rem; color: var(--text-secondary); line-height: 1.4;">
                            <div>신청번호: ${app.id}</div>
                            <div>대표자: ${app.ownerName} (${app.ownerPhone})</div>
                            <div>주소: ${app.storeAddress}</div>
                            <div>소재: ${app.signType}</div>
                            ${app.referrerCode ? `<div style="color: var(--accent-primary); font-weight: bold;">영업 연동 코드: ${app.referrerCode}</div>` : ''}
                        </div>
                        ${actionsHtml}
                    `;
                    appsList.appendChild(card);
                });

                appsList.querySelectorAll('.btn-approve-app-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.closest('button').dataset.id;
                        updateApplicationStatusMob(id, 'approved');
                    });
                });
                appsList.querySelectorAll('.btn-reject-app-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.closest('button').dataset.id;
                        updateApplicationStatusMob(id, 'rejected');
                    });
                });
            }
        }
    }

    function approveUserConversionMob(uid) {
        const code = `BIZ-2026-${Math.floor(1000 + Math.random() * 9000)}`;
        users = users.map(u => {
            if (u.id === uid) {
                return { ...u, role: 'business', bizCode: code, conversionStatus: 'approved' };
            }
            return u;
        });
        localStorage.setItem('users', JSON.stringify(users));
        alert(`계정이 성공적으로 영업자 회원으로 승인되었습니다!\n(발급된 코드: ${code})`);
        renderStatusTab();
    }

    function rejectUserConversionMob(uid) {
        users = users.map(u => {
            if (u.id === uid) {
                return { ...u, conversionStatus: 'none' };
            }
            return u;
        });
        localStorage.setItem('users', JSON.stringify(users));
        alert('신청이 반려 처리되었습니다.');
        renderStatusTab();
    }

    function updateApplicationStatusMob(id, newStatus) {
        applications = applications.map(app => {
            if (app.id === id) {
                return { ...app, status: newStatus };
            }
            return app;
        });
        localStorage.setItem('applications', JSON.stringify(applications));
        alert(`신청서가 [${newStatus === 'approved' ? '승인' : '반려'}] 처리되었습니다.`);
        renderStatusTab();
    }

    // --- Auth Overlay Popups UI ---
    window.showAuthModal = function(type) {
        const overlay = document.getElementById('auth-modal-overlay');
        const loginCard = document.getElementById('auth-card-login');
        const regCard = document.getElementById('auth-card-register');

        if (!overlay) return;
        overlay.classList.add('active');

        if (type === 'login') {
            loginCard.style.display = 'block';
            regCard.style.display = 'none';
        } else {
            loginCard.style.display = 'none';
            regCard.style.display = 'block';
        }
    };

    window.closeAuthModal = function() {
        const overlay = document.getElementById('auth-modal-overlay');
        if (overlay) {
            overlay.classList.remove('active');
        }
    };

    // Form handlers
    const loginForm = document.getElementById('login-form-mob');
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('login-id-mob')?.value.trim();
            const pw = document.getElementById('login-pw-mob')?.value;

            const matched = users.find(u => u.id === id && u.pw === sha256(pw));
            if (matched) {
                activeUser = sanitizeUser(matched);
                localStorage.setItem('activeUser', JSON.stringify(activeUser));
                
                alert(`반갑습니다, ${activeUser.name}님! 로그인 되었습니다.`);
                closeAuthModal();
                updateDrawerProfile();
                renderStatusTab();
            } else {
                alert('아이디 또는 비밀번호를 다시 확인해 주세요.');
            }
        });
    }

    const regForm = document.getElementById('register-form-mob');
    if (regForm) {
        regForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('reg-id-mob')?.value.trim();
            const name = document.getElementById('reg-name-mob')?.value.trim();
            const phone = document.getElementById('reg-phone-mob')?.value.trim();
            const pw = document.getElementById('reg-pw-mob')?.value;

            if (users.some(u => u.id === id)) {
                alert('이미 등록된 아이디입니다.');
                return;
            }

            const newUser = {
                id,
                name,
                phone,
                pw: sha256(pw),
                role: 'user',
                conversionStatus: 'none',
                items: []
            };

            users.push(newUser);
            localStorage.setItem('users', JSON.stringify(users));

            alert('회원가입이 완료되었습니다. 로그인해 주세요.');
            showAuthModal('login');
        });
    }

    // Logout drawer trigger
    const logoutBtn = document.getElementById('drawer-logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('activeUser');
            activeUser = null;
            
            alert('로그아웃 되었습니다.');
            closeDrawer();
            updateDrawerProfile();
            renderStatusTab();
        });
    }

    // Delete account drawer trigger
    const deleteAccountBtn = document.getElementById('drawer-delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('정말로 계정을 탈퇴하시겠습니까?\n등록된 모든 영업물건과 이력이 완전 소멸하며 복구할 수 없습니다.')) {
                if (confirm('탈퇴 동의 최종 확인')) {
                    users = users.filter(u => u.id !== activeUser.id);
                    localStorage.setItem('users', JSON.stringify(users));
                    localStorage.removeItem('activeUser');
                    activeUser = null;
                    
                    alert('회원 탈퇴 완료되었습니다. 초기 화면으로 이동합니다.');
                    closeDrawer();
                    updateDrawerProfile();
                    renderStatusTab();
                }
            }
        });
    }

    // --- Side Drawer trigger settings ---
    const sideMenuTrigger = document.getElementById('app-menu-trigger');
    const sideMenuClose = document.getElementById('app-drawer-close');
    const sideOverlay = document.getElementById('app-drawer-overlay');

    if (sideMenuTrigger) {
        sideMenuTrigger.addEventListener('click', () => {
            openDrawer();
        });
    }

    // --- Initialize default setups ---
    updateDrawerProfile();
});
