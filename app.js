// app.js - Mobile App Shell & Interactive State Synchronizer

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let activeUser = getActiveUser() || null;
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
    if (menuTrigger) {
        menuTrigger.addEventListener('click', openDrawer);
    }
    if (drawerClose) {
        drawerClose.addEventListener('click', closeDrawer);
    }
    if (drawerOverlay) {
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
        activeUser = getActiveUser() || null;
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
            } else if (activeUser.role === 'constructor') {
                drawerUserRole.textContent = `시공사 (${activeUser.constCode})`;
                drawerUserRole.style.background = 'var(--accent-success)';
                drawerUserRole.style.color = '#fff';
            } else {
                drawerUserRole.textContent = '일반 회원';
                drawerUserRole.style.background = 'var(--accent-primary)';
                drawerUserRole.style.color = '#fff';
            }
            drawerAuthLinks.style.display = 'none';
            drawerLogoutLinks.style.display = 'block';

            // 전환 신청 상태 갱신 로직 추가
            const conversionLinks = document.getElementById('drawer-conversion-links');
            if (conversionLinks) {
                conversionLinks.style.display = 'flex';
                
                const btnConv = document.getElementById('drawer-btn-conversion');
                const btnConst = document.getElementById('drawer-btn-constructor');
                
                if (activeUser.conversionStatus === 'pending') {
                    if (btnConv) {
                        btnConv.innerHTML = '<i class="fa-solid fa-clock"></i> 영업자 승인 대기 중';
                        btnConv.style.opacity = '0.7';
                        btnConv.style.pointerEvents = 'none';
                    }
                    if (btnConst) {
                        btnConst.style.opacity = '0.5';
                        btnConst.style.pointerEvents = 'none';
                    }
                } else if (activeUser.conversionStatus === 'pending_constructor') {
                    if (btnConv) {
                        btnConv.style.opacity = '0.5';
                        btnConv.style.pointerEvents = 'none';
                    }
                    if (btnConst) {
                        btnConst.innerHTML = '<i class="fa-solid fa-clock"></i> 시공업체 승인 대기 중';
                        btnConst.style.opacity = '0.7';
                        btnConst.style.pointerEvents = 'none';
                    }
                } else {
                    if (btnConv) {
                        btnConv.innerHTML = '<i class="fa-solid fa-arrows-spin"></i> 영업자 회원으로 전환 신청';
                        btnConv.style.opacity = '1';
                        btnConv.style.pointerEvents = 'auto';
                    }
                    if (btnConst) {
                        btnConst.innerHTML = '<i class="fa-solid fa-screwdriver-wrench"></i> 시공업체 회원으로 전환 신청';
                        btnConst.style.opacity = '1';
                        btnConst.style.pointerEvents = 'auto';
                    }
                }
            }
        } else {
            drawerUserName.textContent = '게스트님';
            drawerUserRole.textContent = '비회원';
            drawerUserRole.style.background = 'var(--text-muted)';
            drawerAuthLinks.style.display = 'block';
            drawerLogoutLinks.style.display = 'none';
            const conversionLinks = document.getElementById('drawer-conversion-links');
            if (conversionLinks) conversionLinks.style.display = 'none';
        }
    }

    function updateHeaderAuthButton() {
        const appHeaderAuthBtn = document.getElementById('app-header-auth-btn');
        const appHeaderAuthText = document.getElementById('app-header-auth-text');
        if (!appHeaderAuthBtn || !appHeaderAuthText) return;

        const user = getActiveUser() || null;
        if (user) {
            appHeaderAuthText.textContent = '마이페이지';
        } else {
            appHeaderAuthText.textContent = '로그인';
        }
    }

    // Initialize Header Auth Button
    updateHeaderAuthButton();

    // Click Listener for Header Auth Button
    const appHeaderAuthBtn = document.getElementById('app-header-auth-btn');
    if (appHeaderAuthBtn) {
        appHeaderAuthBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const user = getActiveUser() || null;
            if (user) {
                openDrawer();
            } else {
                openAuthModal();
            }
        });
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

    // --- Mobile Auth Modal Close Interceptor (Supports Touch & Click) ---
    const authCloseBtn = document.getElementById('auth-close-btn');
    if (authCloseBtn) {
        const handleCloseAuth = (e) => {
            e.preventDefault();
            e.stopPropagation();
            const authModal = document.getElementById('auth-modal');
            if (authModal) {
                authModal.classList.remove('active');
            }
        };
        authCloseBtn.addEventListener('click', handleCloseAuth);
        authCloseBtn.addEventListener('touchend', handleCloseAuth);
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
            updateHeaderAuthButton();
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
            
            // Core Session Clean First
            clearActiveUser();
            alert('로그아웃 되었습니다.');
            
            // Trigger hidden PC logout button for legacy compatibility
            const pcLogoutBtn = document.getElementById('logout-btn');
            if (pcLogoutBtn) {
                pcLogoutBtn.click();
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
                    activeUser = getActiveUser() || null;
                    if (activeUser) {
                        users = users.filter(u => u.id !== activeUser.id);
                        localStorage.setItem('users', JSON.stringify(users));
                        clearActiveUser();
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
        activeUser = getActiveUser() || null;
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
        const constructorContainer = document.getElementById('status-constructor-container');
        
        if (normalContainer) normalContainer.style.display = 'none';
        if (businessContainer) businessContainer.style.display = 'none';
        if (adminContainer) adminContainer.style.display = 'none';
        if (constructorContainer) constructorContainer.style.display = 'none';

        if (activeUser.role === 'admin') {
            roleBadge.textContent = '최고관리자';
            roleBadge.style.background = 'var(--grad-primary)';
            if (adminContainer) adminContainer.style.display = 'block';
            renderAdminDashboardMob();
        } else if (activeUser.role === 'business') {
            roleBadge.textContent = `영업자 코드: ${activeUser.bizCode}`;
            roleBadge.style.background = 'var(--accent-secondary)';
            if (businessContainer) businessContainer.style.display = 'block';
            renderBusinessDashboardMob();
        } else if (activeUser.role === 'constructor') {
            roleBadge.textContent = `시공사 코드: ${activeUser.constCode}`;
            roleBadge.style.background = 'var(--accent-success)';
            if (constructorContainer) constructorContainer.style.display = 'block';
            renderConstructorDashboardMob();
        } else {
            roleBadge.textContent = '일반 회원';
            roleBadge.style.background = 'var(--accent-primary)';
            if (normalContainer) normalContainer.style.display = 'block';
            renderNormalDashboardMob();
        }
    }

    // --- Client Dashboard ---
    function renderNormalDashboardMob() {
        const myAppsList = document.getElementById('my-apps-list-mobile');
        const conversionPendingMsg = document.getElementById('conversion-pending-msg-mob');
        const conversionConstructorPendingMsg = document.getElementById('conversion-constructor-pending-msg-mob');
        const btnRequestConversion = document.getElementById('btn-request-conversion-mob');
        const btnRequestConstructor = document.getElementById('btn-request-constructor-mob');
        const constructorFormCard = document.getElementById('mobile-constructor-form-card');

        if (constructorFormCard) constructorFormCard.style.display = 'none';

        if (activeUser.conversionStatus === 'pending') {
            if (btnRequestConversion) btnRequestConversion.style.display = 'none';
            if (btnRequestConstructor) btnRequestConstructor.style.display = 'none';
            if (conversionPendingMsg) conversionPendingMsg.style.display = 'block';
            if (conversionConstructorPendingMsg) conversionConstructorPendingMsg.style.display = 'none';
        } else if (activeUser.conversionStatus === 'pending_constructor') {
            if (btnRequestConversion) btnRequestConversion.style.display = 'none';
            if (btnRequestConstructor) btnRequestConstructor.style.display = 'none';
            if (conversionPendingMsg) conversionPendingMsg.style.display = 'none';
            if (conversionConstructorPendingMsg) conversionConstructorPendingMsg.style.display = 'block';
        } else {
            if (btnRequestConversion) btnRequestConversion.style.display = 'block';
            if (btnRequestConstructor) btnRequestConstructor.style.display = 'block';
            if (conversionPendingMsg) conversionPendingMsg.style.display = 'none';
            if (conversionConstructorPendingMsg) conversionConstructorPendingMsg.style.display = 'none';
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

    // Constructor transition request
    const btnRequestConstructorMob = document.getElementById('btn-request-constructor-mob');
    const btnCancelConstructorMob = document.getElementById('btn-cancel-constructor-mob');
    const constructorFormCard = document.getElementById('mobile-constructor-form-card');
    const constructorRequestFormMob = document.getElementById('constructor-request-form-mob');
    const constBusinessNameMob = document.getElementById('const-business-name-mob');
    const constLicenseNumberMob = document.getElementById('const-license-number-mob');

    if (btnRequestConstructorMob && constructorFormCard) {
        btnRequestConstructorMob.addEventListener('click', () => {
            constructorFormCard.style.display = 'block';
            btnRequestConstructorMob.style.display = 'none';
            const btnRequestConversion = document.getElementById('btn-request-conversion-mob');
            if (btnRequestConversion) btnRequestConversion.style.display = 'none';
        });
    }

    if (btnCancelConstructorMob && constructorFormCard) {
        btnCancelConstructorMob.addEventListener('click', () => {
            constructorFormCard.style.display = 'none';
            const btnRequestConversion = document.getElementById('btn-request-conversion-mob');
            if (btnRequestConversion) btnRequestConversion.style.display = 'block';
            if (btnRequestConstructorMob) btnRequestConstructorMob.style.display = 'block';
        });
    }

    if (constructorRequestFormMob) {
        constructorRequestFormMob.addEventListener('submit', (e) => {
            e.preventDefault();
            const bName = constBusinessNameMob.value.trim();
            const lNum = constLicenseNumberMob.value.trim();
            if (!bName || !lNum) {
                alert('업체 상호명과 사업자등록번호를 입력해 주세요.');
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

            alert('시공업체 가입 신청이 정상 완료되었습니다.\n최고관리자 승인 시 정식 코드가 부여됩니다.');
            renderStatusTab();
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
    const mobCameraInputMob = document.getElementById('mob-camera-input-mob');
    const mobPhotoPreviewsMob = document.getElementById('mob-photo-previews-mob');
    const mobPhotoCountMob = document.getElementById('mob-photo-count-mob');
    const photoChoiceOverlay = document.getElementById('photo-choice-overlay');
    const btnChoiceCamera = document.getElementById('btn-choice-camera');
    const btnChoiceGallery = document.getElementById('btn-choice-gallery');
    const btnChoiceCancel = document.getElementById('btn-choice-cancel');
    let selectedPhotosMob = [];

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

    const handleMobilePhotosSelectMob = async (files) => {
        if (!files.length) return;

        if (selectedPhotosMob.length + files.length > 20) {
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
            selectedPhotosMob.push(processedFile);
        }
        renderMobilePhotoPreviewsMob();
    };

    if (mobFileZoneMob) {
        mobFileZoneMob.addEventListener('click', () => {
            if (photoChoiceOverlay) {
                photoChoiceOverlay.classList.add('active');
            } else if (mobPhotosInputMob) {
                mobPhotosInputMob.click();
            }
        });
    }

    if (photoChoiceOverlay) {
        // Close bottom sheet when clicking overlay background
        photoChoiceOverlay.addEventListener('click', (e) => {
            if (e.target === photoChoiceOverlay) {
                photoChoiceOverlay.classList.remove('active');
            }
        });

        // Close button
        if (btnChoiceCancel) {
            btnChoiceCancel.addEventListener('click', () => {
                photoChoiceOverlay.classList.remove('active');
            });
        }

        // Camera option
        if (btnChoiceCamera && mobCameraInputMob) {
            btnChoiceCamera.addEventListener('click', () => {
                photoChoiceOverlay.classList.remove('active');
                mobCameraInputMob.click();
            });
        }

        // Gallery option
        if (btnChoiceGallery && mobPhotosInputMob) {
            btnChoiceGallery.addEventListener('click', () => {
                photoChoiceOverlay.classList.remove('active');
                mobPhotosInputMob.click();
            });
        }
    }

    if (mobPhotosInputMob) {
        mobPhotosInputMob.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                await handleMobilePhotosSelectMob(files);
                mobPhotosInputMob.value = ''; // Reset value to trigger change on same file if needed
            }
        });
    }

    if (mobCameraInputMob) {
        mobCameraInputMob.addEventListener('change', async (e) => {
            if (e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                await handleMobilePhotosSelectMob(files);
                mobCameraInputMob.value = ''; // Reset value to trigger change on next capture
            }
        });
    }

    function renderMobilePhotoPreviewsMob() {
        if (!mobPhotoPreviewsMob || !mobPhotoCountMob) return;
        mobPhotoPreviewsMob.innerHTML = '';
        
        selectedPhotosMob.forEach((file, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'mob-preview-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.margin = '4px';
            
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            img.style.width = '70px';
            img.style.height = '70px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';
            img.style.display = 'block';
            
            const delBtn = document.createElement('button');
            delBtn.className = 'mob-preview-del';
            delBtn.innerHTML = '&times;';
            delBtn.style.position = 'absolute';
            delBtn.style.top = '-6px';
            delBtn.style.right = '-6px';
            delBtn.style.width = '20px';
            delBtn.style.height = '20px';
            delBtn.style.borderRadius = '50%';
            delBtn.style.backgroundColor = '#ef4444';
            delBtn.style.color = '#ffffff';
            delBtn.style.border = 'none';
            delBtn.style.display = 'flex';
            delBtn.style.alignItems = 'center';
            delBtn.style.justifyContent = 'center';
            delBtn.style.fontSize = '12px';
            delBtn.style.fontWeight = 'bold';
            delBtn.style.cursor = 'pointer';
            delBtn.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
            delBtn.style.zIndex = '10';
            
            delBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedPhotosMob.splice(index, 1);
                renderMobilePhotoPreviewsMob();
            });
            
            wrapper.appendChild(img);
            wrapper.appendChild(delBtn);
            mobPhotoPreviewsMob.appendChild(wrapper);
        });

        mobPhotoCountMob.textContent = `선택된 사진: ${selectedPhotosMob.length} / 20장`;
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

        const panels = {
            requests: document.getElementById('admin-panel-requests-mob'),
            constructors: document.getElementById('admin-panel-constructors-mob'),
            apps: document.getElementById('admin-panel-apps-mob'),
            items: document.getElementById('admin-panel-items-mob'),
            popups: document.getElementById('admin-panel-popups-mob')
        };

        Object.keys(panels).forEach(key => {
            if (panels[key]) {
                panels[key].style.display = (key === tabName) ? 'block' : 'none';
            }
        });

        renderAdminDashboardMob();
    };

    function renderAdminDashboardMob() {
        const totalStat = document.getElementById('admin-stat-total-mob');
        const visitorsStat = document.getElementById('admin-stat-visitors-mob');
        
        // Reload global variables to ensure data sync
        applications = JSON.parse(localStorage.getItem('applications')) || [];
        users = JSON.parse(localStorage.getItem('users')) || [];
        
        if (totalStat) totalStat.textContent = `${applications.length}건`;
        if (visitorsStat) visitorsStat.textContent = `${localStorage.getItem('visitor_today') || '34'}명`;

        // 1) Render Salesperson Requests (conversionStatus === 'pending')
        const requestsList = document.getElementById('admin-requests-list-mob');
        if (requestsList) {
            const pendingUsers = users.filter(u => u.conversionStatus === 'pending');
            if (pendingUsers.length === 0) {
                requestsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 15px; font-size: 0.75rem;">승인 대기 중인 영업자 회원 신청건이 없습니다.</p>';
            } else {
                requestsList.innerHTML = '';
                pendingUsers.forEach(u => {
                    const card = document.createElement('div');
                    card.className = 'admin-req-card-mob';
                    card.style.marginBottom = '10px';
                    card.style.background = '#f8fafc';
                    card.style.padding = '12px';
                    card.style.borderRadius = '8px';
                    card.style.border = '1px solid var(--border-color)';
                    card.innerHTML = `
                        <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 4px;">아이디: ${u.id} (${u.name})</div>
                        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 8px;">연락처: ${u.phone} / 주소: ${u.address}</div>
                        <div class="admin-action-row-mob" style="display:flex; gap: 8px; justify-content: flex-end;">
                            <button class="btn btn-secondary btn-sm btn-reject-user-mob" data-uid="${u.id}" style="padding: 4px 8px; font-size: 0.65rem;"><i class="fa-solid fa-xmark"></i> 반려</button>
                            <button class="btn btn-primary btn-sm btn-approve-user-mob" data-uid="${u.id}" style="padding: 4px 8px; font-size: 0.65rem; background: var(--accent-success); border: none; color: white;"><i class="fa-solid fa-check"></i> 승인</button>
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

        // 2) Render Constructor Requests (conversionStatus === 'pending_constructor')
        const constructorsList = document.getElementById('admin-constructors-list-mob');
        if (constructorsList) {
            const pendingConst = users.filter(u => u.conversionStatus === 'pending_constructor');
            if (pendingConst.length === 0) {
                constructorsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 15px; font-size: 0.75rem;">승인 대기 중인 시공업체 회원 신청건이 없습니다.</p>';
            } else {
                constructorsList.innerHTML = '';
                pendingConst.forEach(u => {
                    const card = document.createElement('div');
                    card.className = 'admin-req-card-mob';
                    card.style.marginBottom = '10px';
                    card.style.background = '#f8fafc';
                    card.style.padding = '12px';
                    card.style.borderRadius = '8px';
                    card.style.border = '1px solid var(--border-color)';
                    card.innerHTML = `
                        <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 4px;">아이디: ${u.id} (${u.name})</div>
                        <div style="font-size: 0.7rem; color: var(--text-secondary);">업체명: ${escapeHtml(u.pendingBusinessName)}</div>
                        <div style="font-size: 0.7rem; color: var(--text-secondary);">등록번호: ${escapeHtml(u.pendingLicenseNumber)}</div>
                        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 8px;">연락처: ${u.phone} / 주소: ${u.address}</div>
                        <div class="admin-action-row-mob" style="display:flex; gap: 8px; justify-content: flex-end;">
                            <button class="btn btn-secondary btn-sm btn-reject-const-mob" data-uid="${u.id}" style="padding: 4px 8px; font-size: 0.65rem;"><i class="fa-solid fa-xmark"></i> 반려</button>
                            <button class="btn btn-primary btn-sm btn-approve-const-mob" data-uid="${u.id}" style="padding: 4px 8px; font-size: 0.65rem; background: var(--accent-success); border: none; color: white;"><i class="fa-solid fa-check"></i> 승인</button>
                        </div>
                    `;
                    constructorsList.appendChild(card);
                });

                constructorsList.querySelectorAll('.btn-approve-const-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const uid = e.target.closest('button').dataset.uid;
                        approveConstructorConversionMob(uid);
                    });
                });
                constructorsList.querySelectorAll('.btn-reject-const-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const uid = e.target.closest('button').dataset.uid;
                        rejectUserConversionMob(uid);
                    });
                });
            }
        }

        // 3) Render Applications list
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
                    card.style.background = '#ffffff';
                    card.style.padding = '12px';
                    card.style.borderRadius = '8px';
                    card.style.border = '1px solid var(--border-color)';
                    card.style.marginBottom = '10px';
                    
                    let statusBadge = '<span class="badge-status pending">대기 중</span>';
                    if (app.status === 'approved') statusBadge = '<span class="badge-status approved">승인됨</span>';
                    else if (app.status === 'rejected') statusBadge = '<span class="badge-status rejected">반려됨</span>';

                    let actionsHtml = '';
                    if (app.status === 'pending') {
                        actionsHtml = `
                            <div class="admin-action-row-mob" style="display:flex; gap: 8px; justify-content: flex-end; margin-top: 10px;">
                                <button class="btn btn-secondary btn-sm btn-reject-app-mob" data-id="${app.id}" style="padding: 4px 8px; font-size: 0.65rem;"><i class="fa-solid fa-xmark"></i> 반려</button>
                                <button class="btn btn-primary btn-sm btn-approve-app-mob" data-id="${app.id}" style="padding: 4px 8px; font-size: 0.65rem; background: var(--accent-success); border: none; color: white;"><i class="fa-solid fa-check"></i> 승인</button>
                            </div>
                        `;
                    } else if (app.status === 'approved') {
                        if (app.assignedConstructorId) {
                            let constStatusText = '시공 전';
                            if (app.constructionStatus === 'in_construction') constStatusText = '시공 진행 중';
                            else if (app.constructionStatus === 'after_construction') constStatusText = '시공 완료 보고됨';
                            else if (app.constructionStatus === 'completed') constStatusText = '정산 종결';

                            actionsHtml = `
                                <div style="margin-top: 8px; border-top: 1px dashed var(--border-color); padding-top: 8px; text-align: left;">
                                    <div style="font-size: 0.72rem; font-weight: bold; color: var(--accent-success);"><i class="fa-solid fa-screwdriver-wrench"></i> 배정 시공사: ${escapeHtml(app.assignedConstructorName)}</div>
                                    <div style="font-size: 0.7rem; color: var(--text-secondary); margin-top: 2px;">시공 현황: <strong>${constStatusText}</strong></div>
                                </div>
                            `;

                            if (app.constructionStatus === 'after_construction') {
                                actionsHtml += `
                                    <div style="display: flex; gap: 8px; margin-top: 8px; justify-content: flex-end;">
                                        <button class="btn btn-primary btn-sm btn-approve-settlement-mob" data-id="${app.id}" style="padding: 5px 10px; font-size: 0.68rem; background: var(--accent-primary); border: none; color: white;"><i class="fa-solid fa-file-invoice-dollar"></i> 증빙확인/정산완료</button>
                                    </div>
                                `;
                            }
                        } else {
                            // Assign Constructor Dropdown
                            const constructors = users.filter(u => u.role === 'constructor');
                            let optionsHtml = '<option value="">시공사 선택...</option>';
                            constructors.forEach(c => {
                                optionsHtml += `<option value="${c.id}">${escapeHtml(c.businessName)}</option>`;
                            });
                            
                            actionsHtml = `
                                <div style="margin-top: 8px; border-top: 1px dashed var(--border-color); padding-top: 8px; display: flex; flex-direction: column; gap: 6px; text-align: left;">
                                    <label style="font-size: 0.7rem; font-weight: bold;">시공사 미배정 - 배정 진행</label>
                                    <div style="display: flex; gap: 6px;">
                                        <select class="status-select-mob select-constructor-assign-mob" data-id="${app.id}" style="flex: 1; padding: 4px; font-size: 0.7rem; height: auto; min-height: auto; width: auto; background: white; border: 1px solid var(--border-color); border-radius: 4px;">
                                            ${optionsHtml}
                                        </select>
                                        <button class="btn btn-primary btn-sm btn-assign-constructor-mob" data-id="${app.id}" style="padding: 4px 8px; font-size: 0.65rem; background: var(--accent-success); border: none; color: white;"><i class="fa-solid fa-link"></i> 배정</button>
                                    </div>
                                </div>
                            `;
                        }
                    }

                    // Add Delete application button (always shown in management)
                    actionsHtml += `
                        <div style="display: flex; justify-content: flex-start; margin-top: 8px;">
                            <button class="btn btn-secondary btn-sm btn-delete-app-mob" data-id="${app.id}" style="padding: 4px 8px; font-size: 0.65rem; border-color: rgba(239, 68, 68, 0.3); color: rgba(239, 68, 68, 0.8); background: transparent;"><i class="fa-solid fa-trash-can"></i> 삭제</button>
                        </div>
                    `;

                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                            <strong style="font-size: 0.85rem;">${escapeHtml(app.shopName || app.storeName)}</strong>
                            ${statusBadge}
                        </div>
                        <div style="font-size: 0.7rem; color: var(--text-secondary); line-height: 1.4; text-align: left;">
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
                appsList.querySelectorAll('.btn-delete-app-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.closest('button').dataset.id;
                        deleteApplicationMob(id);
                    });
                });
                appsList.querySelectorAll('.btn-assign-constructor-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.closest('button').dataset.id;
                        const container = e.target.closest('div');
                        const select = container.querySelector('.select-constructor-assign-mob');
                        const constId = select.value;
                        if (!constId) {
                            alert('배정할 시공사를 선택해 주세요.');
                            return;
                        }
                        assignConstructorMob(id, constId);
                    });
                });
                appsList.querySelectorAll('.btn-approve-settlement-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.closest('button').dataset.id;
                        approveSettlementMob(id);
                    });
                });
            }
        }

        // 4) Render Items list (Sales objects)
        const itemsList = document.getElementById('admin-items-list-mob');
        if (itemsList) {
            itemsList.innerHTML = '';
            let hasItems = false;
            users.forEach(u => {
                if (u.role === 'business' && u.items && u.items.length > 0) {
                    u.items.forEach(item => {
                        hasItems = true;
                        const card = document.createElement('div');
                        card.className = 'admin-req-card-mob';
                        card.style.background = '#f8fafc';
                        card.style.padding = '12px';
                        card.style.borderRadius = '8px';
                        card.style.border = '1px solid var(--border-color)';
                        card.style.marginBottom = '8px';
                        card.style.textAlign = 'left';
                        
                        card.innerHTML = `
                            <div style="font-size: 0.8rem; font-weight: bold; margin-bottom: 4px;">${escapeHtml(item.name)} (${u.name} 영업자)</div>
                            <div style="font-size: 0.7rem; color: var(--text-secondary);">주소: ${escapeHtml(item.address)}</div>
                            ${item.phone ? `<div style="font-size: 0.7rem; color: var(--text-secondary);">연락처: ${escapeHtml(item.phone)}</div>` : ''}
                            
                            <div style="margin-top: 8px; display: flex; flex-direction: column; gap: 6px;">
                                <div style="display:flex; align-items:center; gap: 4px;">
                                    <span style="font-size: 0.7rem; font-weight: 700; width: 45px;">접수:</span>
                                    <select class="status-select-mob select-receipt-mob" data-uid="${u.id}" data-itemid="${item.id}" style="padding: 4px; font-size: 0.7rem; border-radius: 4px; border: 1px solid var(--border-color); background: white; flex: 1;">
                                        <option value="접수 대기" ${item.receiptStatus === '접수 대기' ? 'selected' : ''}>접수 대기</option>
                                        <option value="접수 완료 (경기도시장상권진흥원)" ${item.receiptStatus === '접수 완료 (경기도시장상권진흥원)' ? 'selected' : ''}>접수 완료</option>
                                    </select>
                                </div>
                                <div style="display:flex; align-items:center; gap: 4px;">
                                    <span style="font-size: 0.7rem; font-weight: 700; width: 45px;">진행:</span>
                                    <select class="status-select-mob select-progress-mob" data-uid="${u.id}" data-itemid="${item.id}" style="padding: 4px; font-size: 0.7rem; border-radius: 4px; border: 1px solid var(--border-color); background: white; flex: 1;">
                                        <option value="심사 대기" ${item.progressStatus === '심사 대기' ? 'selected' : ''}>심사 대기</option>
                                        <option value="서류 보완 필요" ${item.progressStatus === '서류 보완 필요' ? 'selected' : ''}>서류 보완 필요</option>
                                        <option value="서류 심사 통과" ${item.progressStatus === '서류 심사 통과' ? 'selected' : ''}>서류 심사 통과</option>
                                        <option value="현장 실사 중" ${item.progressStatus === '현장 실사 중' ? 'selected' : ''}>현장 실사 중</option>
                                        <option value="지원금 최종 승인" ${item.progressStatus === '지원금 최종 승인' ? 'selected' : ''}>지원금 최종 승인</option>
                                        <option value="간판 시공 중" ${item.progressStatus === '간판 시공 중' ? 'selected' : ''}>간판 시공 중</option>
                                        <option value="시공 완료" ${item.progressStatus === '시공 완료' ? 'selected' : ''}>시공 완료</option>
                                    </select>
                                </div>
                            </div>
                        `;
                        itemsList.appendChild(card);
                    });
                }
            });

            if (!hasItems) {
                itemsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 15px; font-size: 0.75rem;">등록된 영업물건이 없습니다.</p>';
            } else {
                itemsList.querySelectorAll('.select-receipt-mob').forEach(select => {
                    select.addEventListener('change', (e) => {
                        const uid = e.target.dataset.uid;
                        const itemId = parseInt(e.target.dataset.itemid);
                        const val = e.target.value;
                        updateItemStatusMob(uid, itemId, 'receipt', val);
                    });
                });
                itemsList.querySelectorAll('.select-progress-mob').forEach(select => {
                    select.addEventListener('change', (e) => {
                        const uid = e.target.dataset.uid;
                        const itemId = parseInt(e.target.dataset.itemid);
                        const val = e.target.value;
                        updateItemStatusMob(uid, itemId, 'progress', val);
                    });
                });
            }
        }

        // 5) Render Popups list
        const popupsList = document.getElementById('admin-popups-list-mob');
        if (popupsList) {
            const popups = JSON.parse(localStorage.getItem('popups')) || [];
            popupsList.innerHTML = '';
            if (popups.length === 0) {
                popupsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 15px; font-size: 0.75rem;">등록된 팝업창이 없습니다.</p>';
            } else {
                popups.forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'admin-req-card-mob';
                    card.style.background = '#f8fafc';
                    card.style.padding = '12px';
                    card.style.borderRadius = '8px';
                    card.style.border = '1px solid var(--border-color)';
                    card.style.marginBottom = '8px';
                    card.style.textAlign = 'left';

                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                            <strong style="font-size: 0.8rem;">${escapeHtml(p.title)}</strong>
                            <span style="font-size: 0.65rem; padding: 2px 6px; border-radius: 50px; background: ${p.isActive ? 'var(--accent-primary)' : '#64748b'}; color: white;">
                                ${p.isActive ? '활성화' : '비활성'}
                            </span>
                        </div>
                        <div style="font-size: 0.7rem; color: var(--text-secondary); margin-bottom: 8px;">
                            기간: ${p.startDate} ~ ${p.endDate}
                        </div>
                        <div class="admin-action-row-mob" style="display:flex; gap: 6px; justify-content: flex-end;">
                            <button class="btn btn-secondary btn-sm btn-toggle-popup-mob" data-id="${p.id}" style="padding: 4px 6px; font-size: 0.65rem;">토글</button>
                            <button class="btn btn-secondary btn-sm btn-edit-popup-mob" data-id="${p.id}" style="padding: 4px 6px; font-size: 0.65rem; color: var(--accent-primary); border-color: rgba(0,102,255,0.2);"><i class="fa-solid fa-pen"></i> 수정</button>
                            <button class="btn btn-secondary btn-sm btn-delete-popup-mob" data-id="${p.id}" style="padding: 4px 6px; font-size: 0.65rem; color: rgba(239, 68, 68, 0.8); border-color: rgba(239, 68, 68, 0.2);"><i class="fa-solid fa-trash-can"></i> 삭제</button>
                        </div>
                    `;
                    popupsList.appendChild(card);
                });

                popupsList.querySelectorAll('.btn-toggle-popup-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const pid = parseInt(e.target.closest('button').dataset.id);
                        togglePopupActiveMob(pid);
                    });
                });
                popupsList.querySelectorAll('.btn-edit-popup-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const pid = parseInt(e.target.closest('button').dataset.id);
                        editPopupMob(pid);
                    });
                });
                popupsList.querySelectorAll('.btn-delete-popup-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const pid = parseInt(e.target.closest('button').dataset.id);
                        deletePopupMob(pid);
                    });
                });
            }
        }
    }

    // --- Sub handlers for Admin Mob ---
    function approveConstructorConversionMob(uid) {
        const code = `CO-2026-${Math.floor(1000 + Math.random() * 9000)}`;
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
        alert(`시공업체 회원 승인이 정상 완료되었습니다! (발급된 시공코드: ${code})`);
        renderStatusTab();
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
                const cleanUser = { ...u, conversionStatus: 'none' };
                if ('pendingBusinessName' in cleanUser) delete cleanUser.pendingBusinessName;
                if ('pendingLicenseNumber' in cleanUser) delete cleanUser.pendingLicenseNumber;
                return cleanUser;
            }
            return u;
        });
        localStorage.setItem('users', JSON.stringify(users));
        alert('신청이 반려되었습니다.');
        renderStatusTab();
    }

    function assignConstructorMob(appId, constructorId) {
        const constUser = users.find(u => u.id === constructorId);
        if (!constUser) return;

        applications = applications.map(app => {
            if (app.id === appId) {
                return {
                    ...app,
                    assignedConstructorId: constructorId,
                    assignedConstructorName: constUser.businessName,
                    constructionStatus: 'before_construction'
                };
            }
            return app;
        });

        localStorage.setItem('applications', JSON.stringify(applications));
        alert(`시공업체 [${constUser.businessName}]가 성공적으로 배정되었습니다.`);
        renderStatusTab();
    }

    function approveSettlementMob(id) {
        const app = applications.find(a => a.id === id);
        if (!app) return;

        let proofText = `[시공 완료 보고 증빙 검수 (모바일)]\n\n`;
        proofText += `상호명: ${app.storeName}\n`;
        proofText += `시공사: ${app.assignedConstructorName}\n`;
        proofText += `업로드된 시공 사진 수: ${app.constructionPhotos ? app.constructionPhotos.length : 0}장\n`;
        proofText += `업로드된 세금계산서 수: ${app.invoicePhotos ? app.invoicePhotos.length : 0}장\n\n`;
        proofText += `해당 시공 증빙을 검수하고 최종 정산을 종결하시겠습니까?`;

        if (confirm(proofText)) {
            applications = applications.map(a => {
                if (a.id === id) {
                    return { ...a, constructionStatus: 'completed' };
                }
                return a;
            });
            localStorage.setItem('applications', JSON.stringify(applications));
            alert('공사 증빙 검수가 통과되어 최종 정산 종결 처리되었습니다.');
            renderStatusTab();
        }
    }

    function deleteApplicationMob(id) {
        if (!confirm('정말로 이 지원 신청 접수 건을 삭제하시겠습니까?')) return;
        applications = applications.filter(app => app.id !== id);
        localStorage.setItem('applications', JSON.stringify(applications));
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

    function updateItemStatusMob(uid, itemId, type, value) {
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
        renderStatusTab();
    }

    // Popup management helpers for Mob
    const mobPopupForm = document.getElementById('mob-popup-form');
    if (mobPopupForm) {
        mobPopupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const pid = document.getElementById('mob-popup-id').value;
            const titleVal = document.getElementById('mob-popup-title').value.trim();
            const contentVal = document.getElementById('mob-popup-content').value.trim();
            const imageVal = document.getElementById('mob-popup-image').value.trim() || 'https://picsum.photos/id/101/400/200';
            const linkVal = document.getElementById('mob-popup-link').value.trim() || '#apply-section';
            const startVal = document.getElementById('mob-popup-start').value;
            const endVal = document.getElementById('mob-popup-end').value;
            const widthVal = parseInt(document.getElementById('mob-popup-width').value) || 380;
            const heightVal = parseInt(document.getElementById('mob-popup-height').value) || 480;
            const topVal = parseInt(document.getElementById('mob-popup-top').value) || 120;
            const leftVal = parseInt(document.getElementById('mob-popup-left').value) || 100;
            const activeVal = document.getElementById('mob-popup-active').checked;

            let popups = JSON.parse(localStorage.getItem('popups')) || [];

            if (pid) {
                // Update
                popups = popups.map(p => {
                    if (p.id === parseInt(pid)) {
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
                alert('팝업창 정보가 수정되었습니다.');
            } else {
                // Insert
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
            resetMobPopupForm();
            renderStatusTab();
        });
    }

    const btnMobPopupReset = document.getElementById('btn-mob-popup-reset');
    if (btnMobPopupReset) {
        btnMobPopupReset.addEventListener('click', () => {
            resetMobPopupForm();
        });
    }

    function resetMobPopupForm() {
        if (mobPopupForm) mobPopupForm.reset();
        document.getElementById('mob-popup-id').value = '';
        const titleText = document.getElementById('mob-popup-form-title');
        if (titleText) titleText.innerHTML = '<i class="fa-solid fa-plus"></i> 신규 팝업창 등록';
    }

    function editPopupMob(pid) {
        const popups = JSON.parse(localStorage.getItem('popups')) || [];
        const p = popups.find(item => item.id === pid);
        if (!p) return;

        document.getElementById('mob-popup-id').value = p.id;
        document.getElementById('mob-popup-title').value = p.title;
        document.getElementById('mob-popup-content').value = p.content;
        document.getElementById('mob-popup-image').value = p.imageUrl || '';
        document.getElementById('mob-popup-link').value = p.linkUrl || '';
        document.getElementById('mob-popup-start').value = p.startDate || '2026-07-01';
        document.getElementById('mob-popup-end').value = p.endDate || '2026-08-31';
        document.getElementById('mob-popup-width').value = p.width || 380;
        document.getElementById('mob-popup-height').value = p.height || 480;
        document.getElementById('mob-popup-top').value = p.positionTop || 120;
        document.getElementById('mob-popup-left').value = p.positionLeft || 100;
        document.getElementById('mob-popup-active').checked = p.isActive;

        const titleText = document.getElementById('mob-popup-form-title');
        if (titleText) titleText.innerHTML = '<i class="fa-solid fa-pen"></i> 팝업창 수정 모드';
        
        // Scroll to form
        const formTitle = document.getElementById('mob-popup-form-title');
        if (formTitle) formTitle.scrollIntoView({ behavior: 'smooth' });
    }

    function togglePopupActiveMob(pid) {
        let popups = JSON.parse(localStorage.getItem('popups')) || [];
        popups = popups.map(p => {
            if (p.id === pid) {
                return { ...p, isActive: !p.isActive };
            }
            return p;
        });
        localStorage.setItem('popups', JSON.stringify(popups));
        renderStatusTab();
    }

    function deletePopupMob(pid) {
        if (!confirm('정말로 이 팝업창을 삭제하시겠습니까?')) return;
        let popups = JSON.parse(localStorage.getItem('popups')) || [];
        popups = popups.filter(p => p.id !== pid);
        localStorage.setItem('popups', JSON.stringify(popups));
        
        const currentEditId = document.getElementById('mob-popup-id').value;
        if (currentEditId && parseInt(currentEditId) === pid) {
            resetMobPopupForm();
        }
        
        renderStatusTab();
    }

    // --- Constructor Dashboard ---
    function renderConstructorDashboardMob() {
        const jobsList = document.getElementById('constructor-jobs-list-mobile');
        if (!jobsList) return;

        const apps = JSON.parse(localStorage.getItem('applications')) || [];
        const myJobs = apps.filter(job => job.assignedConstructorId === activeUser.id && job.status === 'approved');

        if (myJobs.length === 0) {
            jobsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.8rem;">배정된 시공 물건이 없습니다.</p>';
            return;
        }

        jobsList.innerHTML = '';
        myJobs.forEach(job => {
            const card = document.createElement('div');
            card.className = 'app-card-mob';
            card.style.borderLeft = '4px solid var(--accent-success)';

            let statusLabel = '시공 전';
            let statusClass = 'pending';
            if (job.constructionStatus === 'in_construction') {
                statusLabel = '시공 진행 중';
                statusClass = 'warning';
            } else if (job.constructionStatus === 'after_construction') {
                statusLabel = '시공 완료 보고됨';
                statusClass = 'approved';
            } else if (job.constructionStatus === 'completed') {
                statusLabel = '정산 종결';
                statusClass = 'info';
            }

            let uploadSectionHtml = '';
            if (job.constructionStatus !== 'completed') {
                uploadSectionHtml = `
                    <div style="border-top: 1px dashed var(--border-color); padding-top: 10px; margin-top: 10px; text-align: left;">
                        <div class="phone-form-group" style="margin-bottom: 8px;">
                            <label style="font-size: 0.7rem; font-weight: 700; display: block; margin-bottom: 2px;">시공 현장 사진 (${job.constructionPhotos ? job.constructionPhotos.length : 0}/20)</label>
                            <input type="file" class="const-photo-input-mob" data-id="${job.id}" accept="image/*" multiple style="font-size: 0.7rem; width: 100%;">
                        </div>
                        <div class="phone-form-group" style="margin-bottom: 10px;">
                            <label style="font-size: 0.7rem; font-weight: 700; display: block; margin-bottom: 2px;">정산용 세금계산서/증빙</label>
                            <input type="file" class="const-invoice-input-mob" data-id="${job.id}" accept="image/*,application/pdf" style="font-size: 0.7rem; width: 100%;">
                        </div>
                        
                        <div style="display: flex; gap: 8px; align-items: center; justify-content: flex-end;">
                            <select class="status-select-mob select-const-status-mob" data-id="${job.id}" style="padding: 4px; font-size: 0.7rem; border-radius: 4px; border: 1px solid var(--border-color); background: white; height: auto; min-height: auto; width: auto;">
                                <option value="before_construction" ${job.constructionStatus === 'before_construction' ? 'selected' : ''}>시공 전</option>
                                <option value="in_construction" ${job.constructionStatus === 'in_construction' ? 'selected' : ''}>시공 중</option>
                            </select>
                            <button class="btn btn-primary btn-sm btn-report-job-complete-mob" data-id="${job.id}" style="padding: 5px 8px; font-size: 0.7rem; background: var(--accent-success); border: none; height: auto; line-height: 1;">완료보고</button>
                        </div>
                    </div>
                `;
            } else {
                uploadSectionHtml = `
                    <div style="border-top: 1px dashed var(--border-color); padding-top: 8px; margin-top: 8px; font-size: 0.75rem; color: var(--text-secondary); text-align: left;">
                        <i class="fa-solid fa-circle-check" style="color: var(--accent-success);"></i> 공사 검수가 완료되어 최종 정산 처리가 종료되었습니다.
                    </div>
                `;
            }

            card.innerHTML = `
                <div class="app-card-header">
                    <span class="app-card-title">${escapeHtml(job.storeName)}</span>
                    <span class="app-card-date" style="font-size: 0.7rem;"><i class="fa-solid fa-phone"></i> ${escapeHtml(job.ownerPhone)}</span>
                </div>
                <div class="app-card-body-row">설치주소: ${escapeHtml(job.storeAddress)}</div>
                <div class="app-card-body-row">간판종류: <strong>${escapeHtml(job.signType === 'NEON' || job.signType === 'neon' || !job.signType ? '플렉스' : job.signType)}</strong></div>
                <div class="app-card-footer" style="flex-direction: column; align-items: stretch; gap: 8px; margin-top: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="badge-status ${statusClass}" style="padding: 3px 8px; font-size: 0.7rem;">${statusLabel}</span>
                    </div>
                    ${uploadSectionHtml}
                </div>
            `;
            jobsList.appendChild(card);
        });

        // Event listeners
        jobsList.querySelectorAll('.select-const-status-mob').forEach(select => {
            select.addEventListener('change', (e) => {
                const id = parseInt(e.target.dataset.id);
                const val = e.target.value;
                updateJobConstructionStatusMob(id, val);
            });
        });

        jobsList.querySelectorAll('.btn-report-job-complete-mob').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('button').dataset.id);
                reportJobCompletionMob(id);
            });
        });

        jobsList.querySelectorAll('.const-photo-input-mob').forEach(input => {
            input.addEventListener('change', async (e) => {
                const id = parseInt(e.target.dataset.id);
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    await handleJobPhotoUploadMob(id, files);
                }
            });
        });

        jobsList.querySelectorAll('.const-invoice-input-mob').forEach(input => {
            input.addEventListener('change', async (e) => {
                const id = parseInt(e.target.dataset.id);
                const file = e.target.files[0];
                if (file) {
                    await handleJobInvoiceUploadMob(id, file);
                }
            });
        });
    }

    function updateJobConstructionStatusMob(id, val) {
        let apps = JSON.parse(localStorage.getItem('applications')) || [];
        apps = apps.map(app => {
            if (app.id === id) {
                return { ...app, constructionStatus: val };
            }
            return app;
        });
        localStorage.setItem('applications', JSON.stringify(apps));
        renderConstructorDashboardMob();
    }

    async function handleJobPhotoUploadMob(id, files) {
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
        alert('시공 현장 사진이 모바일에 업로드되었습니다.');
        renderConstructorDashboardMob();
    }

    async function handleJobInvoiceUploadMob(id, file) {
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
        alert('정산 증빙서류가 업로드되었습니다.');
        renderConstructorDashboardMob();
    }

    function reportJobCompletionMob(id) {
        let apps = JSON.parse(localStorage.getItem('applications')) || [];
        const app = apps.find(a => a.id === id);

        if (!app.constructionPhotos || app.constructionPhotos.length === 0) {
            alert('최소 1장 이상의 시공 현장 사진을 등록해 주세요.');
            return;
        }
        if (!app.invoicePhotos || app.invoicePhotos.length === 0) {
            alert('세금계산서 또는 지출 증빙 서류를 등록해 주세요.');
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
        alert('시공 완료 보고와 정산 청구가 정상 접수되었습니다!\n최고 관리자 최종 승인 시 정산이 종결됩니다.');
        renderConstructorDashboardMob();
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

    // --- Realtime synchronization via storage event ---
    window.addEventListener('storage', (e) => {
        if (['applications', 'users', 'popups', 'activeUser'].includes(e.key)) {
            applications = JSON.parse(localStorage.getItem('applications')) || [];
            users = JSON.parse(localStorage.getItem('users')) || [];
            activeUser = getActiveUser();
            
            updateDrawerProfile();
            if (typeof renderStatusTab === 'function') renderStatusTab();
        }
    });

    // --- Initialize AI Assistant ---
    initAIAssistant();

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
    }

    // Drawer transition request handlers
    const drawerBtnConversion = document.getElementById('drawer-btn-conversion');
    if (drawerBtnConversion) {
        drawerBtnConversion.addEventListener('click', (e) => {
            e.preventDefault();
            closeDrawer();
            switchTab('status');
            setTimeout(() => {
                const pcBtn = document.getElementById('btn-request-conversion-mob');
                if (pcBtn && pcBtn.style.display !== 'none' && document.getElementById('status-normal-container').style.display !== 'none') {
                    pcBtn.click();
                } else {
                    if (confirm('영업자 회원으로 전환을 신청하시겠습니까? 신청 후 최고관리자 승인을 통해 영업코드가 발급됩니다.')) {
                        activeUser.conversionStatus = 'pending';
                        users = users.map(u => u.id === activeUser.id ? { ...u, conversionStatus: 'pending' } : u);
                        localStorage.setItem('users', JSON.stringify(users));
                        localStorage.setItem('activeUser', JSON.stringify(activeUser));
                        
                        alert('회원 전환 신청이 접수되었습니다. 최고관리자(admin) 계정 로그인 승인 후 영업코드가 정상 발급됩니다.');
                        renderStatusTab();
                        updateDrawerProfile();
                    }
                }
            }, 150);
        });
    }

    const drawerBtnConstructor = document.getElementById('drawer-btn-constructor');
    if (drawerBtnConstructor) {
        drawerBtnConstructor.addEventListener('click', (e) => {
            e.preventDefault();
            closeDrawer();
            switchTab('status');
            setTimeout(() => {
                const pcBtn = document.getElementById('btn-request-constructor-mob');
                const formCard = document.getElementById('mobile-constructor-form-card');
                if (pcBtn && pcBtn.style.display !== 'none' && document.getElementById('status-normal-container').style.display !== 'none') {
                    pcBtn.click();
                } else {
                    const bName = prompt('시공업체 상호명을 입력해 주세요:');
                    if (!bName) return;
                    const lNum = prompt('사업자등록번호를 입력해 주세요:');
                    if (!lNum) return;
                    
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

                    alert('시공업체 가입 신청이 정상 완료되었습니다.\n최고관리자 승인 시 정식 코드가 부여됩니다.');
                    renderStatusTab();
                    updateDrawerProfile();
                }
            }, 150);
        });
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

    if (inquiryForm) {
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

    const mobFooterInquiryBtn = document.getElementById('mob-footer-btn-inquiry');
    if (mobFooterInquiryBtn) {
        mobFooterInquiryBtn.addEventListener('click', (e) => {
            e.preventDefault();
            window.openInquiryModal();
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
1. 회사는 회원에게 간판 디자인 시뮬레이션 및 간편 간판교체 대행 신청 서비스를 제공합니다.
2. 회사는 설비 점검, 통신 장애 또는 천재지변 발생 시 서비스의 전부 또는 일부를 일시 중지할 수 있습니다.

제6조 (회원의 의무 및 면책)
1. 회원은 타인의 명의를 도용하거나 허위 사실을 기재하여 서비스를 이용하여서는 안 됩니다.
2. 회사는 시뮬레이터를 통해 시각화된 시안과 실제 시공 결과물 간의 물리적 오차 및 시공 과정에서의 분쟁에 대해 책임을 지지 않습니다.`,

        privacy: `주식회사 가야애드(이하 "회사")는 경기도 소상공인 간판지원단 플랫폼을 운영함에 있어 정보주체의 개인정보를 보호하고 이와 관련된 고충을 신속하게 처리할 수 있도록 다음과 같이 개인정보 처리방침을 수립·공개합니다.

제1조 (개인정보의 수집 및 이용 목적)
회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
1. 회원 가입 및 관리: 회원 식별, 가입 의사 확인, 회원자격 유지·관리, 부정이용 방지
2. 서비스 제공 및 민원 처리: 간판 디자인 시뮬레이터 이용, 비회원 3초 간편 접수 상담 서비스 제공, 경영환경개선사업 대행 접수, 각종 고충 처리

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
   - 환경개선 지원사업 신청 안내
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

});
