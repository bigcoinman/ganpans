// app.js - Mobile App Shell & Interactive State Synchronizer

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

    function closeDrawer() {
        if (drawer && drawerOverlay) {
            drawer.classList.remove('active');
            drawerOverlay.classList.remove('active');
        }
    }
    window.closeDrawer = closeDrawer;

    function updateDrawerProfile() {
        activeUser = JSON.parse(localStorage.getItem('activeUser')) || null;
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
    function switchTab(tabId) {
        if (tabId === 'apply') {
            // Highlight the home navigation button
            navItems.forEach(btn => {
                if (btn.id === 'tab-btn-home') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            // Switch view class to home view
            tabs.forEach(tab => {
                if (tab.id === 'view-home') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
            // Scroll to the apply section inside home view
            setTimeout(() => {
                const appSection = document.getElementById('apply-section');
                const homeView = document.getElementById('view-home');
                if (appSection && homeView) {
                    homeView.scrollTo({
                        top: appSection.offsetTop - 10,
                        behavior: 'smooth'
                    });
                }
            }, 50);
            return;
        }

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
        }
        
        // Auto scroll to top on tab switch
        const activeTab = document.getElementById(`view-${tabId}`);
        if (activeTab) {
            activeTab.scrollTop = 0;
        }
    }
    window.switchTab = switchTab;

    // Link "로그인 / 회원가입" links in drawer and status tab to PC Auth Modal
    const loginLink = document.getElementById('drawer-login-link');
    const redirectLoginBtn = document.getElementById('btn-login-mob-redirect');

    if (loginLink) {
        loginLink.addEventListener('click', (e) => {
            e.preventDefault();
            closeDrawer();
            openAuthModal();
        });
    }

    if (redirectLoginBtn) {
        redirectLoginBtn.addEventListener('click', () => {
            openAuthModal();
        });
    }

    function openAuthModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.add('active');
        }
    }

    // --- Sync PC Auth submissions to mobile status page ---
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');
    const snsGoogleBtn = document.getElementById('btn-google-login');
    const snsKakaoBtn = document.getElementById('btn-kakao-login');

    const handleSessionRefresh = () => {
        setTimeout(() => {
            renderStatusTab();
            updateDrawerProfile();
        }, 150);
    };

    if (loginForm) loginForm.addEventListener('submit', handleSessionRefresh);
    if (signupForm) signupForm.addEventListener('submit', handleSessionRefresh);
    if (snsGoogleBtn) snsGoogleBtn.addEventListener('click', handleSessionRefresh);
    if (snsKakaoBtn) snsKakaoBtn.addEventListener('click', handleSessionRefresh);

    // --- Intercept Drawer Logout Click ---
    const drawerLogoutBtn = document.getElementById('drawer-logout-btn');
    if (drawerLogoutBtn) {
        drawerLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            // Trigger hidden PC logout button
            const pcLogoutBtn = document.getElementById('logout-btn');
            if (pcLogoutBtn) {
                pcLogoutBtn.click();
            } else {
                // Fallback clean
                localStorage.removeItem('activeUser');
            }
            closeDrawer();
            handleSessionRefresh();
        });
    }

    // Account deletion
    const deleteAccountBtn = document.getElementById('drawer-delete-account-btn');
    if (deleteAccountBtn) {
        deleteAccountBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('정말로 계정을 탈퇴하시겠습니까?\n등록된 모든 영업물건과 이력이 완전 소멸하며 복구할 수 없습니다.')) {
                if (confirm('탈퇴 동의 최종 확인')) {
                    users = JSON.parse(localStorage.getItem('users')) || [];
                    activeUser = JSON.parse(localStorage.getItem('activeUser')) || null;
                    if (activeUser) {
                        users = users.filter(u => u.id !== activeUser.id);
                        localStorage.setItem('users', JSON.stringify(users));
                        localStorage.removeItem('activeUser');
                        activeUser = null;
                        
                        alert('회원 탈퇴 완료되었습니다. 초기 화면으로 이동합니다.');
                        closeDrawer();
                        handleSessionRefresh();
                        switchTab('home');
                    }
                }
            }
        });
    }

    // --- Simulator Apply Design Intercept ---
    const applyDesignBtn = document.getElementById('apply-design-btn');
    if (applyDesignBtn) {
        applyDesignBtn.addEventListener('click', () => {
            // Wait slightly for script.js fields assignment
            setTimeout(() => {
                switchTab('apply');
            }, 100);
        });
    }

    // --- PC Hero Section Buttons Mobile Intercept ---
    const heroSimBtn = document.querySelector('#view-home .hero-buttons .btn-primary');
    const heroCheckBtn = document.querySelector('#view-home .hero-buttons .btn-secondary');

    if (heroSimBtn) {
        heroSimBtn.addEventListener('click', (e) => {
            e.preventDefault();
            switchTab('simulator');
        });
    }

    if (heroCheckBtn) {
        heroCheckBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const checkSection = document.getElementById('check');
            if (checkSection) {
                // In mobile scroll view, we scroll the app-view viewport instead of window!
                const homeView = document.getElementById('view-home');
                if (homeView) {
                    homeView.scrollTo({
                        top: checkSection.offsetTop - 20,
                        behavior: 'smooth'
                    });
                } else {
                    checkSection.scrollIntoView({ behavior: 'smooth' });
                }
            }
        });
    }

    // --- Mobile Header App Install Trigger ---
    const mobileHeaderInstallBtn = document.getElementById('mobile-header-install-btn');
    const mobileInstallModal = document.getElementById('install-modal');
    if (mobileHeaderInstallBtn && mobileInstallModal) {
        mobileHeaderInstallBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            // Set QR code URL dynamically
            const qrImg = document.getElementById('install-qr-img');
            if (qrImg) {
                const currentUrl = window.location.href;
                qrImg.src = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(currentUrl)}`;
            }

            // Always show QR section in mobile app modal so users can scan it on PC/devices
            const qrSection = document.getElementById('install-qr-section');
            if (qrSection) {
                qrSection.style.display = 'flex';
            }

            mobileInstallModal.classList.add('active');
        });
    }

    // --- Gallery Arrow Buttons Injector ---
    const wrapper = document.querySelector('#view-home .building-gallery-wrapper');
    const viewport = document.querySelector('#view-home .building-scroll-viewport');
    
    if (wrapper && viewport) {
        // Create a relative container for the viewport to align arrows perfectly
        const container = document.createElement('div');
        container.className = 'building-scroll-container';
        container.style.position = 'relative';
        container.style.width = '100%';

        // Insert container and nest viewport inside it
        viewport.parentNode.insertBefore(container, viewport);
        container.appendChild(viewport);

        // Create left arrow button
        const prevBtn = document.createElement('button');
        prevBtn.className = 'gallery-floating-arrow prev-arrow';
        prevBtn.id = 'gallery-prev-btn';
        prevBtn.innerHTML = '<i class="fa-solid fa-chevron-left"></i>';
        prevBtn.setAttribute('title', '이전 간판');

        // Create right arrow button
        const nextBtn = document.createElement('button');
        nextBtn.className = 'gallery-floating-arrow next-arrow';
        nextBtn.id = 'gallery-next-btn';
        nextBtn.innerHTML = '<i class="fa-solid fa-chevron-right"></i>';
        nextBtn.setAttribute('title', '다음 간판');

        // Append buttons to the container (not wrapper) so they align to the viewport only
        container.appendChild(prevBtn);
        container.appendChild(nextBtn);

        // Bind events
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const itemWidth = viewport.clientWidth;
            viewport.scrollBy({ left: -itemWidth, behavior: 'smooth' });
        });

        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const itemWidth = viewport.clientWidth;
            viewport.scrollBy({ left: itemWidth, behavior: 'smooth' });
        });
    }

    // --- Dashboard Status Render Logic ---
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

    // --- Client Dashboard ---
    function renderNormalDashboardMob() {
        const myAppsList = document.getElementById('my-apps-list-mobile');
        const conversionPendingMsg = document.getElementById('conversion-pending-msg-mob');
        const btnRequestConversion = document.getElementById('btn-request-conversion-mob');

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
                    <span class="app-card-title">${escapeHtml(app.shopName || app.storeName)}</span>
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

    // Normal client conversion request
    const btnRequestConversionMob = document.getElementById('btn-request-conversion-mob');
    if (btnRequestConversionMob) {
        btnRequestConversionMob.addEventListener('click', () => {
            if (confirm('영업자 회원으로 전환을 신청하시겠습니까? 신청 후 최고관리자 승인을 통해 영업코드가 발급됩니다.')) {
                activeUser.conversionStatus = 'pending';
                users = users.map(u => u.id === activeUser.id ? { ...u, conversionStatus: 'pending' } : u);
                localStorage.setItem('users', JSON.stringify(users));
                localStorage.setItem('activeUser', JSON.stringify(activeUser));
                
                alert('회원 전환 신청이 접수되었습니다. 최고관리자(admin) 계정 로그인 승인 후 영업코드가 정상 발급됩니다.');
                renderStatusTab();
            }
        });
    }

    // --- Salesperson Dashboard ---
    function renderBusinessDashboardMob() {
        const bizItemsList = document.getElementById('biz-items-list-mobile');
        if (!bizItemsList) return;

        // Sync items status with main applications
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
            bizItemsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.8rem;">등록된 영업물건이 없습니다. 아래 현장 등록 폼을 통해 새로 추가해 보세요.</p>';
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
                ${item.phone ? `<div class="biz-card-phone" style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 4px; display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-phone" style="color: var(--accent-primary);"></i> ${escapeHtml(item.phone)}</div>` : ''}
                ${photosHtml}
            `;
            bizItemsList.appendChild(card);
        });
    }

    // Sales representative manual link (방안 B)
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
                name: targetApp.shopName || targetApp.storeName,
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

            alert(`고객 신청서 [${targetApp.shopName || targetApp.storeName}] 수동 연동 완료되었습니다!`);
            linkAppIdInputMob.value = '';
            renderStatusTab();
        });
    }

    // Photo uploads inside representative dashboard
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
            const phoneVal = document.getElementById('mob-item-phone-mob')?.value.trim() || '';
            const addressVal = document.getElementById('mob-item-address-mob')?.value.trim();

            if (!nameVal || !phoneVal || !addressVal) {
                alert('상호명, 전화번호, 설치 주소를 모두 입력해 주세요.');
                return;
            }

            const processRegistration = (base64Photo) => {
                const newItem = {
                    id: Date.now(),
                    name: nameVal,
                    phone: phoneVal,
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

                alert(`영업 현장 물건 [${nameVal}] 등록이 완료되었습니다.`);
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

    // --- Admin Dashboard ---
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

        // 1) Render Salesperson Requests
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
                            <button class="btn btn-primary btn-sm btn-approve-user-mob" data-uid="${u.id}" style="padding: 4px 8px; font-size: 0.65rem; background: var(--accent-success); border: none; color: white;"><i class="fa-solid fa-check"></i> 승인</button>
                            <button class="btn btn-secondary btn-sm btn-reject-user-mob" data-uid="${u.id}" style="padding: 4px 8px; font-size: 0.65rem;"><i class="fa-solid fa-xmark"></i> 반려</button>
                        </div>
                    `;
                    requestsList.appendChild(card);
                });

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

        // 2) Render Applications list
        const appsList = document.getElementById('admin-apps-list-mob');
        if (appsList) {
            if (applications.length === 0) {
                appsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 15px; font-size: 0.75rem;">접수된 온라인 신청서가 없습니다.</p>';
            } else {
                appsList.innerHTML = '';
                const sortedApps = [...applications].sort((a, b) => b.id.localeCompare(a.id) || b.appliedAt.localeCompare(a.appliedAt));
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
                                <button class="btn btn-primary btn-sm btn-approve-app-mob" data-id="${app.id}" style="padding: 4px 8px; font-size: 0.65rem; background: var(--accent-success); border: none; color: white;"><i class="fa-solid fa-check"></i> 승인</button>
                                <button class="btn btn-secondary btn-sm btn-reject-app-mob" data-id="${app.id}" style="padding: 4px 8px; font-size: 0.65rem;"><i class="fa-solid fa-xmark"></i> 반려</button>
                            </div>
                        `;
                    }

                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                            <strong style="font-size: 0.85rem;">${escapeHtml(app.shopName || app.storeName)}</strong>
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
        alert(`영업자 회원 승인이 정상 완료되었습니다! (발급된 영업코드: ${code})`);
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
        alert('신청이 반려되었습니다.');
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
        alert(`신청 건이 [${newStatus === 'approved' ? '승인' : '반려'}] 처리되었습니다.`);
        renderStatusTab();
    }

    // --- Helper Utilities ---
    function escapeHtml(str) {
        if (!str) return '';
        return str
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Initialize display states
    updateDrawerProfile();
});
