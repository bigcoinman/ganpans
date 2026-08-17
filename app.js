// app.js - Mobile App Shell & Interactive State Synchronizer

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---
    let users = JSON.parse(localStorage.getItem('users')) || [];
    let activeUser = getActiveUser() || null;
    let applications = JSON.parse(localStorage.getItem('applications')) || [];

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

        // 메뉴 요소 참조
        const itemHome = document.getElementById('drawer-item-home');
        const itemStatus = document.getElementById('drawer-item-status');
        const itemDirectBiz = document.getElementById('drawer-item-direct-biz');
        const itemApply = document.getElementById('drawer-item-apply');
        const dividerMain = document.getElementById('drawer-divider-main');
        const conversionLinks = document.getElementById('drawer-conversion-links');
        const btnConv = document.getElementById('drawer-btn-conversion');
        const btnConst = document.getElementById('drawer-btn-constructor');

        if (activeUser) {
            drawerUserName.textContent = `${activeUser.name}님`;
            
            if (activeUser.role === 'admin') {
                drawerUserRole.textContent = '최고관리자';
                drawerUserRole.style.background = 'var(--grad-primary)';
                drawerUserRole.style.color = '#fff';
            } else if (activeUser.role === 'business') {
                drawerUserRole.textContent = `영업자 (${activeUser.bizCode || 'B-260801'})`;
                drawerUserRole.style.background = 'var(--accent-secondary)';
                drawerUserRole.style.color = '#fff';
            } else if (activeUser.role === 'constructor') {
                drawerUserRole.textContent = `시공사 (${activeUser.constCode || 'BPC260801'})`;
                drawerUserRole.style.background = 'var(--accent-success)';
                drawerUserRole.style.color = '#fff';
            } else {
                drawerUserRole.textContent = '일반 회원';
                drawerUserRole.style.background = 'var(--accent-primary)';
                drawerUserRole.style.color = '#fff';
            }

            drawerAuthLinks.style.display = 'none';
            drawerLogoutLinks.style.display = 'block';

            // --- 회원 유형별 드로어 메뉴 분기 ---
            if (activeUser.role === 'admin') {
                // 1. 최고 관리자: 홈 화면, 신청/영업 현황 노출 / 지원신청 및 전환신청 숨김
                if (itemHome) itemHome.style.display = 'flex';
                if (itemStatus) itemStatus.style.display = 'flex';
                if (itemDirectBiz) itemDirectBiz.style.display = 'none';
                if (itemApply) itemApply.style.display = 'none';
                if (dividerMain) dividerMain.style.display = 'block';
                if (conversionLinks) conversionLinks.style.display = 'none';
            } else if (activeUser.role === 'business') {
                // 2. 영업자 회원: 홈 화면, 신청/영업 현황, 간판바로 접수하기 노출 / 지원신청 숨김 / 시공업체 전환 노출
                if (itemHome) itemHome.style.display = 'flex';
                if (itemStatus) itemStatus.style.display = 'flex';
                if (itemDirectBiz) itemDirectBiz.style.display = 'flex';
                if (itemApply) itemApply.style.display = 'none';
                if (dividerMain) dividerMain.style.display = 'none';

                if (conversionLinks) conversionLinks.style.display = 'flex';
                if (btnConv) btnConv.style.display = 'none'; // 이미 영업자이므로 숨김
                if (btnConst) {
                    btnConst.style.display = 'flex';
                    if (activeUser.conversionStatus === 'pending_constructor') {
                        btnConst.innerHTML = '<i class="fa-solid fa-clock"></i> 시공업체 승인 대기 중';
                        btnConst.style.opacity = '0.7';
                        btnConst.style.pointerEvents = 'none';
                    } else {
                        btnConst.innerHTML = '<i class="fa-solid fa-screwdriver-wrench"></i> 시공업체 회원으로 전환 신청';
                        btnConst.style.opacity = '1';
                        btnConst.style.pointerEvents = 'auto';
                    }
                }
            } else if (activeUser.role === 'constructor') {
                // 3. 시공업체 회원: 홈 화면, 신청/영업 현황, 영업자 전환 노출 / 지원신청, 간판접수, 시공업체전환 숨김
                if (itemHome) itemHome.style.display = 'flex';
                if (itemStatus) itemStatus.style.display = 'flex';
                if (itemDirectBiz) itemDirectBiz.style.display = 'none';
                if (itemApply) itemApply.style.display = 'none';
                if (dividerMain) dividerMain.style.display = 'block';

                if (conversionLinks) conversionLinks.style.display = 'flex';
                if (btnConst) btnConst.style.display = 'none'; // 이미 시공업체이므로 숨김
                if (btnConv) {
                    btnConv.style.display = 'flex';
                    if (activeUser.conversionStatus === 'pending') {
                        btnConv.innerHTML = '<i class="fa-solid fa-clock"></i> 영업자 승인 대기 중';
                        btnConv.style.opacity = '0.7';
                        btnConv.style.pointerEvents = 'none';
                    } else {
                        btnConv.innerHTML = '<i class="fa-solid fa-arrows-spin"></i> 영업자 회원으로 전환 신청';
                        btnConv.style.opacity = '1';
                        btnConv.style.pointerEvents = 'auto';
                    }
                }
            } else {
                // 4. 일반 회원: 홈 화면, 신청/영업 현황, 간편 신청, 전환신청 2종 노출
                if (itemHome) itemHome.style.display = 'flex';
                if (itemStatus) itemStatus.style.display = 'flex';
                if (itemDirectBiz) itemDirectBiz.style.display = 'none';
                if (itemApply) itemApply.style.display = 'flex';
                if (dividerMain) dividerMain.style.display = 'block';

                if (conversionLinks) {
                    conversionLinks.style.display = 'flex';
                    if (btnConv) btnConv.style.display = 'flex';
                    if (btnConst) btnConst.style.display = 'flex';

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
            }
        } else {
            // 5. 비회원 게스트
            drawerUserName.textContent = '게스트님';
            drawerUserRole.textContent = '비회원';
            drawerUserRole.style.background = 'var(--text-muted)';
            drawerAuthLinks.style.display = 'block';
            drawerLogoutLinks.style.display = 'none';

            if (itemHome) itemHome.style.display = 'flex';
            if (itemStatus) itemStatus.style.display = 'flex';
            if (itemDirectBiz) itemDirectBiz.style.display = 'none';
            if (itemApply) itemApply.style.display = 'flex';
            if (dividerMain) dividerMain.style.display = 'block';
            if (conversionLinks) conversionLinks.style.display = 'none';
        }
    }

    // 영업자 전용 간판바로 접수하기 원터치 이동
    function openDirectBizApplyMob() {
        closeDrawer();
        switchTab('status');
        setTimeout(() => {
            const uploadForm = document.getElementById('mobile-upload-form-mob') || document.querySelector('.biz-mobile-upload-box') || document.getElementById('view-status');
            if (uploadForm) {
                uploadForm.scrollIntoView({ behavior: 'smooth' });
                if (uploadForm.id === 'mobile-upload-form-mob' || uploadForm.classList.contains('biz-mobile-upload-box')) {
                    uploadForm.style.transition = 'box-shadow 0.3s ease';
                    uploadForm.style.boxShadow = '0 0 0 3px #ca8a04';
                    setTimeout(() => { uploadForm.style.boxShadow = ''; }, 1500);
                }
            }
        }, 120);
    }
    window.openDirectBizApplyMob = openDirectBizApplyMob;

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

    // --- Sync Auth submissions to mobile status page ---
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    const handleSessionRefresh = () => {
        setTimeout(() => {
            renderStatusTab();
            updateDrawerProfile();
            updateHeaderAuthButton();
        }, 150);
    };

    if (loginForm) loginForm.addEventListener('submit', handleSessionRefresh);
    if (signupForm) signupForm.addEventListener('submit', handleSessionRefresh);

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

            const qrImg = document.getElementById('install-qr-img');
            if (qrImg) {
                qrImg.onerror = () => {
                    qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Fganpans.com%2Fapp';
                };
                qrImg.src = './ganpan-app-qr.png?v=20260817';
            }

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
            if (typeof item.id === 'string' && (item.id.startsWith('GP-') || item.id.startsWith('P-'))) {
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
            bizItemsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.95rem;">등록된 영업물건이 없습니다. 아래 현장 등록 폼을 통해 새로 추가해 보세요.</p>';
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

            let progressClass = 'review';
            const receiptText = item.receiptStatus || '접수예정';
            const progressText = item.progressStatus || '지원대기중';
            if (progressText === '간판시공완료' || progressText === '승인 완료' || progressText === '시공 완료') progressClass = 'approved';
            else if (progressText === '대상자선정' || progressText === '간판시공 준비중') progressClass = 'approved';
            else if (progressText === '반려됨') progressClass = 'rejected';

            card.innerHTML = `
                <div class="biz-card-title-row">
                    <span class="biz-card-title">${escapeHtml(item.name)} ${item.id ? `<span style="font-size: 0.84rem; font-weight: 600; color: var(--accent-primary); background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); padding: 2px 6px; border-radius: 4px; margin-left: 4px;">${escapeHtml(String(item.id))}</span>` : ''}</span>
                    <div class="biz-card-badges">
                        <span class="biz-card-badge receipt">${escapeHtml(receiptText)}</span>
                        <span class="biz-card-badge progress ${progressClass}">${escapeHtml(progressText)}</span>
                    </div>
                </div>
                <div class="biz-card-addr"><i class="fa-solid fa-location-dot" style="color: var(--accent-primary);"></i> ${escapeHtml(item.address)}</div>
                ${item.phone ? `<div class="biz-card-phone" style="font-size: 0.9rem; color: var(--text-secondary); margin-top: 4px; margin-bottom: 8px; display: flex; align-items: center; gap: 6px;"><i class="fa-solid fa-phone" style="color: var(--accent-primary);"></i> <strong style="color: var(--accent-primary);">${escapeHtml(item.phone)}</strong></div>` : ''}
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

            const idPattern = /^(P-\d{6}\d{3}|GP-\d{8}-\d{4})$/;
            if (!idPattern.test(appId)) {
                alert('신청번호 형식이 올바르지 않습니다. (예: P-260816001 또는 GP-20260731-1234)');
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
                let apps = JSON.parse(localStorage.getItem('applications')) || [];
                const itemId = typeof generateBizItemId === 'function' ? generateBizItemId(activeUser.bizCode, apps) : `${activeUser.bizCode || 'B-260801'}-${String(apps.length + 1).padStart(4, '0')}`;

                // 모든 신청물건은 1차적으로 [신청서 목록(applications)]에만 저장
                // (최고관리자가 진흥원 접수 확인 후 [영업물건으로 변경] 토글을 켜면 영업물건 목록으로 연동됨)
                const newApp = {
                    id: itemId,
                    userId: activeUser.id,
                    ownerName: nameVal,
                    ownerPhone: phoneVal,
                    storeName: nameVal,
                    shopName: nameVal,
                    storeAddress: addressVal,
                    signType: '현장 카메라 접수',
                    fileName: selectedPhotosMob.length > 0 ? (selectedPhotosMob[0].name || '현장촬영사진.jpg') : '현장촬영사진.jpg',
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
                localStorage.setItem('applications', JSON.stringify(apps));

                // Supabase 클라우드 DB 실시간 양방향 동기화
                if (window.SupabaseSync) {
                    window.SupabaseSync.upsertApplication(newApp);
                }

                // 카카오톡 관리자 실시간 알림 발송
                if (window.KakaoNotifier && typeof window.KakaoNotifier.notifyApplication === 'function') {
                    window.KakaoNotifier.notifyApplication(newApp);
                }

                alert(`현장 간판 신청 물건 [${nameVal}] 등록이 완료되었습니다!\n신청번호: [${itemId}]\n(최고관리자 대시보드 [신청서 목록]에 안전하게 등록되었습니다.)`);
                formBizUploadMob.reset();
                selectedPhotosMob = [];
                renderMobilePhotoPreviewsMob();
                renderStatusTab();
            };

            if (selectedPhotosMob.length > 0) {
                compressImageToBase64(selectedPhotosMob[0], 2 * 1024 * 1024).then(base64 => {
                    processRegistration(base64);
                });
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
            users: document.getElementById('admin-panel-users-mob'),
            requests: document.getElementById('admin-panel-requests-mob'),
            constructors: document.getElementById('admin-panel-constructors-mob'),
            apps: document.getElementById('admin-panel-apps-mob'),
            items: document.getElementById('admin-panel-items-mob'),
            inquiries: document.getElementById('admin-panel-inquiries-mob'),
            'const-progress': document.getElementById('admin-panel-const-progress-mob'),
            kakao: document.getElementById('admin-panel-kakao-mob'),
            popups: document.getElementById('admin-panel-popups-mob')
        };

        Object.keys(panels).forEach(key => {
            if (panels[key]) {
                panels[key].style.display = (key === tabName) ? 'block' : 'none';
            }
        });

        renderAdminDashboardMob();
    };

    // --- Supabase 실시간 양방향 데이터 동기화 리스너 (모바일) ---
    window.addEventListener('supabase-data-synced', (e) => {
        users = JSON.parse(localStorage.getItem('users')) || [];
        applications = JSON.parse(localStorage.getItem('applications')) || [];
        activeUser = getActiveUser() || null;
        updateDrawerProfile();
        updateHeaderAuthButton();
        renderStatusTab();
    });

    async function syncAdminDataFromSupabaseMob() {
        if (window.SupabaseSync) {
            await window.SupabaseSync.syncAllData();
            renderAdminDashboardMob(true);
        }
    }

    function renderAdminSubPanels() {
        renderAdminDashboardMob(true);
    }

    // 모바일 회원 검색창 이벤트
    const searchAllUsersInputMob = document.getElementById('search-all-users-input-mob');
    if (searchAllUsersInputMob) {
        searchAllUsersInputMob.addEventListener('input', () => {
            renderAdminDashboardMob(true);
        });
    }

    function renderAdminDashboardMob(skipSync = false) {
        const totalStat = document.getElementById('admin-stat-total-mob');
        const visitorsStat = document.getElementById('admin-stat-visitors-mob');
        
        // Reload global variables to ensure data sync
        applications = JSON.parse(localStorage.getItem('applications')) || [];
        users = JSON.parse(localStorage.getItem('users')) || [];
        
        if (totalStat) totalStat.textContent = `${applications.length}건`;
        if (visitorsStat) visitorsStat.textContent = `${localStorage.getItem('visitor_today') || '34'}명`;

        if (!skipSync) {
            syncAdminDataFromSupabaseMob();
        }

        // 0) Render All Users list (회원정보관리)
        const allUsersListMob = document.getElementById('admin-all-users-list-mob');
        if (allUsersListMob) {
            let curUsers = JSON.parse(localStorage.getItem('users')) || [];
            curUsers = typeof sortUsersLatestFirst === 'function' ? sortUsersLatestFirst(curUsers) : curUsers;
            const searchInput = document.getElementById('search-all-users-input-mob');
            const q = searchInput && searchInput.value ? searchInput.value.trim().toLowerCase() : '';

            if (q) {
                curUsers = curUsers.filter(u => 
                    (u.id && u.id.toLowerCase().includes(q)) ||
                    (u.name && u.name.toLowerCase().includes(q)) ||
                    (u.phone && u.phone.includes(q)) ||
                    (u.email && u.email.toLowerCase().includes(q)) ||
                    (u.address && u.address.toLowerCase().includes(q))
                );
            }

            allUsersListMob.innerHTML = '';
            if (curUsers.length === 0) {
                allUsersListMob.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.95rem;">등록/검색된 회원이 없습니다.</p>';
            } else {
                curUsers.forEach(u => {
                    const card = document.createElement('div');
                    card.className = 'admin-user-card-mob';
                    card.style.background = '#ffffff';
                    card.style.padding = '14px';
                    card.style.borderRadius = '10px';
                    card.style.border = '1px solid var(--border-color)';
                    card.style.marginBottom = '12px';

                    let roleBadge = '<span style="background: #e2e8f0; color: #475569; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 600;">일반</span>';
                    if (u.role === 'admin') roleBadge = '<span style="background: #fee2e2; color: #b91c1c; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 700;">최고관리자</span>';
                    else if (u.role === 'business') roleBadge = `<span style="background: #e0f2fe; color: #0369a1; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 700;">영업자 (${u.bizCode || '-'})</span>`;
                    else if (u.role === 'constructor') roleBadge = `<span style="background: #dcfce7; color: #15803d; padding: 3px 8px; border-radius: 4px; font-size: 0.85rem; font-weight: 700;">시공사 (${u.constCode || '-'})</span>`;

                    const deleteBtn = u.role === 'admin' ? '' : `
                        <button class="btn btn-secondary btn-sm btn-delete-user-mob" data-uid="${u.id}" style="padding: 5px 12px; font-size: 0.85rem; color: #dc2626; border-color: rgba(239,68,68,0.3); background: #fee2e2; border-radius: 6px;">
                            <i class="fa-solid fa-trash-can"></i> 삭제
                        </button>
                    `;

                    const userJoinDate = typeof formatUserDate === 'function' ? formatUserDate(u.createdAt || u.created_at) : (u.createdAt || u.created_at || '-');

                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                            <div style="display:flex; align-items:center; gap: 8px; flex-wrap: wrap;">
                                <strong style="font-size: 1.1rem; color: var(--text-primary); font-family: monospace;">${escapeHtml(u.id)}</strong>
                                <span style="font-size: 0.9rem; color: #64748b; font-weight: normal;">(${escapeHtml(userJoinDate)})</span>
                            </div>
                            ${roleBadge}
                        </div>
                        <div style="font-size: 0.95rem; color: var(--text-secondary); line-height: 1.5; text-align: left;">
                            <div>성명: <strong style="color: var(--text-primary);">${escapeHtml(u.name || '-')}</strong></div>
                            <div>연락처: <a href="tel:${escapeHtml(u.phone || '')}" style="color: var(--accent-primary); text-decoration: none; font-weight: 600;">${escapeHtml(u.phone || '-')}</a></div>
                            ${u.email ? `<div>이메일: <span style="color: #475569;">${escapeHtml(u.email)}</span></div>` : ''}
                            ${u.address ? `<div>주소: <span style="color: #475569;">${escapeHtml(u.address)}</span></div>` : ''}
                        </div>
                        ${deleteBtn ? `<div style="display:flex; justify-content:flex-end; margin-top: 10px;">${deleteBtn}</div>` : ''}
                    `;
                    allUsersListMob.appendChild(card);
                });

                allUsersListMob.querySelectorAll('.btn-delete-user-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const uid = e.target.closest('button').dataset.uid;
                        if (!confirm(`[주의] 회원 ID [${uid}]을(를) 강제 탈퇴/삭제하시겠습니까?`)) return;

                        let currentUsers = JSON.parse(localStorage.getItem('users')) || [];
                        currentUsers = currentUsers.filter(u => u.id !== uid);
                        localStorage.setItem('users', JSON.stringify(currentUsers));

                        if (window.supabaseClient) {
                            window.supabaseClient.from('users').delete().eq('id', uid).then(({ error }) => {
                                if (error) console.error('Supabase user delete error:', error.message);
                            });
                        }

                        alert(`회원 [${uid}]이(가) 정상적으로 삭제되었습니다.`);
                        renderAdminDashboardMob(true);
                    });
                });
            }
        }

        // 1) Render Salesperson Requests (conversionStatus === 'pending')
        const requestsList = document.getElementById('admin-requests-list-mob');
        if (requestsList) {
            const pendingUsers = users.filter(u => u.conversionStatus === 'pending');
            if (pendingUsers.length === 0) {
                requestsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.95rem;">승인 대기 중인 영업자 회원 신청건이 없습니다.</p>';
            } else {
                requestsList.innerHTML = '';
                pendingUsers.forEach(u => {
                    const card = document.createElement('div');
                    card.className = 'admin-req-card-mob';
                    card.style.marginBottom = '12px';
                    card.style.background = '#f8fafc';
                    card.style.padding = '14px';
                    card.style.borderRadius = '10px';
                    card.style.border = '1px solid var(--border-color)';
                    card.innerHTML = `
                        <div style="font-size: 1.05rem; font-weight: bold; margin-bottom: 6px; color: var(--text-primary);">아이디: ${u.id} (${u.name})</div>
                        <div style="font-size: 0.92rem; color: var(--text-secondary); margin-bottom: 10px; line-height: 1.4;">연락처: <strong style="color: var(--accent-primary);">${u.phone}</strong> / 주소: ${u.address}</div>
                        <div class="admin-action-row-mob" style="display:flex; gap: 8px; justify-content: flex-end;">
                            <button class="btn btn-secondary btn-sm btn-reject-user-mob" data-uid="${u.id}" style="padding: 6px 14px; font-size: 0.85rem; border-radius: 6px;"><i class="fa-solid fa-xmark"></i> 반려</button>
                            <button class="btn btn-primary btn-sm btn-approve-user-mob" data-uid="${u.id}" style="padding: 6px 14px; font-size: 0.85rem; background: var(--accent-success); border: none; color: white; border-radius: 6px;"><i class="fa-solid fa-check"></i> 승인</button>
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
                constructorsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.95rem;">승인 대기 중인 시공업체 회원 신청건이 없습니다.</p>';
            } else {
                constructorsList.innerHTML = '';
                pendingConst.forEach(u => {
                    const card = document.createElement('div');
                    card.className = 'admin-req-card-mob';
                    card.style.marginBottom = '12px';
                    card.style.background = '#f8fafc';
                    card.style.padding = '14px';
                    card.style.borderRadius = '10px';
                    card.style.border = '1px solid var(--border-color)';
                    card.innerHTML = `
                        <div style="font-size: 1.05rem; font-weight: bold; margin-bottom: 6px; color: var(--text-primary);">아이디: ${u.id} (${u.name})</div>
                        <div style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.4;">업체명: <strong style="color: var(--text-primary);">${escapeHtml(u.pendingBusinessName)}</strong></div>
                        <div style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.4;">등록번호: <strong style="color: var(--text-primary);">${escapeHtml(u.pendingLicenseNumber)}</strong></div>
                        <div style="font-size: 0.92rem; color: var(--text-secondary); margin-bottom: 10px; line-height: 1.4;">연락처: <strong style="color: var(--accent-primary);">${u.phone}</strong> / 주소: ${u.address}</div>
                        <div class="admin-action-row-mob" style="display:flex; gap: 8px; justify-content: flex-end;">
                            <button class="btn btn-secondary btn-sm btn-reject-const-mob" data-uid="${u.id}" style="padding: 6px 14px; font-size: 0.85rem; border-radius: 6px;"><i class="fa-solid fa-xmark"></i> 반려</button>
                            <button class="btn btn-primary btn-sm btn-approve-const-mob" data-uid="${u.id}" style="padding: 6px 14px; font-size: 0.85rem; background: var(--accent-success); border: none; color: white; border-radius: 6px;"><i class="fa-solid fa-check"></i> 승인</button>
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
                appsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.95rem;">접수된 온라인 신청서가 없습니다.</p>';
            } else {
                appsList.innerHTML = '';
                const sortedApps = [...applications].sort((a, b) => b.id.localeCompare(a.id) || b.appliedAt.localeCompare(a.appliedAt));
                sortedApps.forEach(app => {
                    const card = document.createElement('div');
                    card.className = 'admin-app-card-mob';
                    card.style.background = '#ffffff';
                    card.style.padding = '14px';
                    card.style.borderRadius = '10px';
                    card.style.border = '1px solid var(--border-color)';
                    card.style.marginBottom = '12px';
                    
                    let statusBadge = '<span class="badge-status pending" style="font-size: 0.85rem; padding: 3px 8px;">대기 중</span>';
                    if (app.status === 'approved') statusBadge = '<span class="badge-status approved" style="font-size: 0.85rem; padding: 3px 8px;">승인됨</span>';
                    else if (app.status === 'rejected') statusBadge = '<span class="badge-status rejected" style="font-size: 0.85rem; padding: 3px 8px;">반려됨</span>';

                    let actionsHtml = `
                        <div class="admin-action-row-mob" style="display:flex; gap: 6px; justify-content: flex-end; align-items: center; flex-wrap: wrap; margin-top: 12px;">
                            ${app.status === 'pending' ? `
                                <button class="btn btn-secondary btn-sm btn-reject-app-mob" data-id="${app.id}" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 6px;"><i class="fa-solid fa-xmark"></i> 반려</button>
                                <button class="btn btn-primary btn-sm btn-approve-app-mob" data-id="${app.id}" style="padding: 6px 12px; font-size: 0.85rem; background: var(--accent-success); border: none; color: white; border-radius: 6px;"><i class="fa-solid fa-check"></i> 승인</button>
                            ` : ''}
                            <button class="btn btn-sm btn-toggle-bizitem-mob" data-id="${app.id}" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 6px; font-weight: 700; ${app.isBizItem ? 'background: #0284c7; color: white; border: none;' : 'background: #f8fafc; color: #475569; border: 1px solid #cbd5e1;'}">
                                <i class="fa-solid ${app.isBizItem ? 'fa-toggle-on' : 'fa-toggle-off'}"></i> ${app.isBizItem ? '영업물건 등록됨' : '영업물건으로 변경'}
                            </button>
                            <button class="btn btn-secondary btn-sm btn-delete-app-mob" data-id="${app.id}" style="padding: 6px 10px; font-size: 0.85rem; border-color: rgba(239, 68, 68, 0.3); color: #dc2626; background: #fee2e2; border-radius: 6px;"><i class="fa-solid fa-trash-can"></i> 삭제</button>
                        </div>
                    `;

                    if (app.status === 'approved') {
                        if (app.assignedConstructorId) {
                            let constStatusText = '시공 전';
                            if (app.constructionStatus === 'in_construction') constStatusText = '시공 진행 중';
                            else if (app.constructionStatus === 'after_construction') constStatusText = '시공 완료 보고됨';
                            else if (app.constructionStatus === 'completed') constStatusText = '정산 종결';

                            actionsHtml += `
                                <div style="margin-top: 10px; border-top: 1px dashed var(--border-color); padding-top: 10px; text-align: left;">
                                    <div style="font-size: 0.95rem; font-weight: bold; color: var(--accent-success);"><i class="fa-solid fa-screwdriver-wrench"></i> 배정 시공사: ${escapeHtml(app.assignedConstructorName)}</div>
                                    <div style="font-size: 0.92rem; color: var(--text-secondary); margin-top: 3px;">시공 현황: <strong>${constStatusText}</strong></div>
                                </div>
                            `;

                            if (app.constructionStatus === 'after_construction') {
                                actionsHtml += `
                                    <div style="display: flex; gap: 8px; margin-top: 10px; justify-content: flex-end;">
                                        <button class="btn btn-primary btn-sm btn-approve-settlement-mob" data-id="${app.id}" style="padding: 6px 14px; font-size: 0.85rem; background: var(--accent-primary); border: none; color: white; border-radius: 6px;"><i class="fa-solid fa-file-invoice-dollar"></i> 증빙확인/정산완료</button>
                                    </div>
                                `;
                            }
                        } else {
                            // Assign Constructor Dropdown
                            const constructors = users.filter(u => u.role === 'constructor');
                            let optionsHtml = '<option value="">시공사 선택...</option>';
                            constructors.forEach(c => {
                                optionsHtml += `<option value="${c.id}">${escapeHtml(c.businessName || c.pendingBusinessName || c.name || c.id)}</option>`;
                            });
                            
                            actionsHtml += `
                                <div style="margin-top: 10px; border-top: 1px dashed var(--border-color); padding-top: 10px; display: flex; flex-direction: column; gap: 8px; text-align: left;">
                                    <label style="font-size: 0.92rem; font-weight: bold; color: var(--text-primary);">시공사 미배정 - 배정 진행</label>
                                    <div style="display: flex; gap: 8px;">
                                        <select class="status-select-mob select-constructor-assign-mob" data-id="${app.id}" style="flex: 1; padding: 6px 8px; font-size: 0.92rem; height: auto; min-height: auto; width: auto; background: white; border: 1px solid var(--border-color); border-radius: 6px;">
                                            ${optionsHtml}
                                        </select>
                                        <button class="btn btn-primary btn-sm btn-assign-constructor-mob" data-id="${app.id}" style="padding: 6px 14px; font-size: 0.85rem; background: var(--accent-success); border: none; color: white; border-radius: 6px;"><i class="fa-solid fa-link"></i> 배정</button>
                                    </div>
                                </div>
                            `;
                        }
                    }

                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                            <strong style="font-size: 1.1rem; color: var(--text-primary);">${escapeHtml(app.shopName || app.storeName)}</strong>
                            ${statusBadge}
                        </div>
                        <div style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.5; text-align: left;">
                            <div>신청번호: <span style="font-family: monospace; font-weight: 600; color: #475569;">${app.id}</span></div>
                            <div>대표자: <strong style="color: var(--text-primary);">${app.ownerName}</strong> (${app.ownerPhone})</div>
                            <div>주소: <span style="color: #475569;">${app.storeAddress}</span></div>
                            <div>소재: <span style="color: #475569;">${app.signType}</span></div>
                            ${app.referrerCode ? `<div style="color: var(--accent-primary); font-weight: bold; margin-top: 2px;">영업 연동 코드: ${app.referrerCode}</div>` : ''}
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
                appsList.querySelectorAll('.btn-toggle-bizitem-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.closest('button').dataset.id;
                        toggleBizItemMob(id);
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
                        card.style.padding = '14px';
                        card.style.borderRadius = '10px';
                        card.style.border = '1px solid var(--border-color)';
                        card.style.marginBottom = '12px';
                        card.style.textAlign = 'left';
                        
                        card.innerHTML = `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <div style="font-size: 1.02rem; font-weight: bold; color: var(--text-primary);">
                                    ${escapeHtml(item.name)} 
                                    <span style="font-size: 0.86rem; font-weight: normal; color: var(--text-secondary);">(${escapeHtml(u.name)} 영업자 / ${escapeHtml(String(item.id))})</span>
                                </div>
                                <button type="button" onclick="window.deleteManagerItemMob('${u.id}', '${item.id}'); return false;" style="background: #fee2e2; color: #dc2626; border: 1px solid #fca5a5; padding: 4px 10px; border-radius: 6px; font-size: 0.84rem; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                                    <i class="fa-solid fa-trash-can"></i> 삭제
                                </button>
                            </div>
                            <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.4;"><i class="fa-solid fa-location-dot" style="color: var(--accent-primary);"></i> 주소: <span style="color: #475569;">${escapeHtml(item.address)}</span></div>
                            ${item.phone ? `<div style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 3px;"><i class="fa-solid fa-phone" style="color: #64748b;"></i> 연락처: <strong style="color: var(--accent-primary);">${escapeHtml(item.phone)}</strong></div>` : ''}
                            
                            <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                                <div style="display:flex; align-items:center; gap: 6px;">
                                    <span style="font-size: 0.88rem; font-weight: 700; width: 50px; color: #475569;">접수:</span>
                                    <select class="status-select-mob select-receipt-mob" data-uid="${u.id}" data-itemid="${item.id}" onchange="window.updateItemStatusMob('${u.id}', '${item.id}', 'receipt', this.value)" style="padding: 6px 8px; font-size: 0.9rem; border-radius: 6px; border: 1px solid var(--border-color); background: white; flex: 1; font-weight: 600;">
                                        <option value="업체신청" ${(item.receiptStatus === '업체신청') ? 'selected' : ''}>업체신청</option>
                                        <option value="접수예정" ${(item.receiptStatus === '접수예정' || !item.receiptStatus || item.receiptStatus === '접수 대기') ? 'selected' : ''}>접수예정</option>
                                        <option value="접수완료" ${(item.receiptStatus === '접수완료' || item.receiptStatus === '접수 완료' || item.receiptStatus.includes('접수 완료')) ? 'selected' : ''}>접수완료</option>
                                    </select>
                                </div>
                                <div style="display:flex; align-items:center; gap: 6px;">
                                    <span style="font-size: 0.88rem; font-weight: 700; width: 50px; color: #475569;">진행:</span>
                                    <select class="status-select-mob select-progress-mob" data-uid="${u.id}" data-itemid="${item.id}" onchange="window.updateItemStatusMob('${u.id}', '${item.id}', 'progress', this.value)" style="padding: 6px 8px; font-size: 0.9rem; border-radius: 6px; border: 1px solid var(--border-color); background: white; flex: 1; font-weight: 600;">
                                        <option value="지원대기중" ${(item.progressStatus === '지원대기중' || !item.progressStatus || item.progressStatus === '심사 대기') ? 'selected' : ''}>지원대기중</option>
                                        <option value="심사대기" ${(item.progressStatus === '심사대기' || item.progressStatus === '서류 보완 필요') ? 'selected' : ''}>심사대기</option>
                                        <option value="대상자선정" ${(item.progressStatus === '대상자선정' || item.progressStatus === '서류 심사 통과' || item.progressStatus === '현장 실사 중' || item.progressStatus === '지원금 최종 승인') ? 'selected' : ''}>대상자선정</option>
                                        <option value="간판시공 준비중" ${(item.progressStatus === '간판시공 준비중' || item.progressStatus === '간판 시공 중') ? 'selected' : ''}>간판시공 준비중</option>
                                        <option value="간판시공완료" ${(item.progressStatus === '간판시공완료' || item.progressStatus === '시공 완료') ? 'selected' : ''}>간판시공완료</option>
                                    </select>
                                </div>
                            </div>
                        `;
                        itemsList.appendChild(card);
                    });
                }
            });

            if (!hasItems) {
                itemsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.92rem;">등록된 영업물건이 없습니다.</p>';
            }
        }

        // 5) Render Inquiries list (3초 간편문의 접수건)
        const inquiriesList = document.getElementById('admin-inquiries-list-mob');
        if (inquiriesList) {
            const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
            inquiriesList.innerHTML = '';
            if (inquiries.length === 0) {
                inquiriesList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.92rem;">접수된 3초 간편 문의 내역이 없습니다.</p>';
            } else {
                const sortedInquiries = [...inquiries].sort((a, b) => {
                    const timeA = new Date(a.submittedAt || 0).getTime();
                    const timeB = new Date(b.submittedAt || 0).getTime();
                    return timeB - timeA;
                });

                const typeMap = {
                    'eligibility': '지원 대상/자격',
                    'documents': '제출 서류/신청',
                    'simulator': '시뮬레이터 사용법',
                    'constructor': '시공업체 제휴',
                    'other': '기타 일반 문의'
                };

                sortedInquiries.forEach(inq => {
                    const card = document.createElement('div');
                    card.className = 'admin-inquiry-card-mob';
                    card.style.background = '#ffffff';
                    card.style.padding = '14px';
                    card.style.borderRadius = '10px';
                    card.style.border = '1px solid var(--border-color)';
                    card.style.marginBottom = '12px';

                    const isResolved = inq.status === 'resolved';
                    const statusBadge = isResolved
                        ? `<span style="background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.85rem;"><i class="fa-solid fa-circle-check"></i> 상담 완료</span>`
                        : `<span style="background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.85rem;"><i class="fa-solid fa-clock"></i> 확인 대기</span>`;

                    const typeLabel = typeMap[inq.type] || inq.type || '일반 문의';

                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                            <strong style="font-size: 1.05rem; color: var(--text-primary);">${escapeHtml(inq.name)}</strong>
                            ${statusBadge}
                        </div>
                        <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 6px;">
                            <a href="tel:${escapeHtml(inq.phone)}" style="color: var(--accent-primary); text-decoration: none; font-weight: 600;"><i class="fa-solid fa-phone"></i> ${escapeHtml(inq.phone)}</a>
                            <span style="margin-left: 8px; background: rgba(99,102,241,0.1); color: var(--accent-primary); padding: 2px 8px; border-radius: 4px; font-size: 0.82rem; font-weight: 600;">${escapeHtml(typeLabel)}</span>
                        </div>
                        <div style="font-size: 0.92rem; color: var(--text-primary); line-height: 1.5; margin-top: 8px; padding: 10px 12px; background: #f8fafc; border-radius: 8px; border: 1px solid #f1f5f9; word-break: break-word;">
                            ${escapeHtml(inq.message)}
                        </div>
                        <div class="admin-action-row-mob" style="display:flex; gap: 8px; justify-content: flex-end; margin-top: 10px;">
                            <button class="btn btn-secondary btn-sm btn-toggle-inquiry-mob" data-id="${inq.id}" style="padding: 6px 12px; font-size: 0.82rem; border-radius: 6px; background: ${isResolved ? '#f1f5f9' : 'var(--accent-success)'}; color: ${isResolved ? '#475569' : '#fff'}; border: 1px solid ${isResolved ? '#cbd5e1' : 'transparent'};">
                                <i class="fa-solid ${isResolved ? 'fa-rotate-left' : 'fa-check'}"></i> ${isResolved ? '대기로 변경' : '상담 완료'}
                            </button>
                            <button class="btn btn-secondary btn-sm btn-delete-inquiry-mob" data-id="${inq.id}" style="padding: 6px 12px; font-size: 0.82rem; border-radius: 6px; color: #dc2626; border-color: rgba(239,68,68,0.3); background: #fee2e2;">
                                <i class="fa-solid fa-trash-can"></i> 삭제
                            </button>
                        </div>
                    `;
                    inquiriesList.appendChild(card);
                });

                inquiriesList.querySelectorAll('.btn-toggle-inquiry-mob').forEach(btn => {
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
                            renderAdminDashboardMob(true);
                        }
                    });
                });

                inquiriesList.querySelectorAll('.btn-delete-inquiry-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.closest('button').dataset.id;
                        if (!confirm('정말로 이 간편 문의 내역을 삭제하시겠습니까?')) return;
                        let currentInquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
                        currentInquiries = currentInquiries.filter(i => String(i.id) !== String(id));
                        localStorage.setItem('inquiries', JSON.stringify(currentInquiries));
                        if (window.SupabaseSync) {
                            window.SupabaseSync.deleteInquiry(id);
                        }
                        renderAdminDashboardMob(true);
                    });
                });
            }
        }

        // 6) Render Popups list
        const popupsList = document.getElementById('admin-popups-list-mob');
        if (popupsList) {
            const popups = JSON.parse(localStorage.getItem('popups')) || [];
            popupsList.innerHTML = '';
            if (popups.length === 0) {
                popupsList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.92rem;">등록된 팝업창이 없습니다.</p>';
            } else {
                popups.forEach(p => {
                    const card = document.createElement('div');
                    card.className = 'admin-req-card-mob';
                    card.style.background = '#f8fafc';
                    card.style.padding = '14px';
                    card.style.borderRadius = '10px';
                    card.style.border = '1px solid var(--border-color)';
                    card.style.marginBottom = '10px';
                    card.style.textAlign = 'left';

                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 8px;">
                            <strong style="font-size: 1.0rem; color: var(--text-primary);">${escapeHtml(p.title)}</strong>
                            <span style="font-size: 0.82rem; padding: 3px 8px; border-radius: 50px; background: ${p.isActive ? 'var(--accent-primary)' : '#64748b'}; color: white; font-weight: 700;">
                                ${p.isActive ? '활성화' : '비활성'}
                            </span>
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 10px;">
                            기간: <strong style="color: #475569;">${p.startDate} ~ ${p.endDate}</strong>
                        </div>
                        <div class="admin-action-row-mob" style="display:flex; gap: 8px; justify-content: flex-end;">
                            <button class="btn btn-secondary btn-sm btn-toggle-popup-mob" data-id="${p.id}" style="padding: 5px 10px; font-size: 0.82rem; border-radius: 6px;">상태변경</button>
                            <button class="btn btn-secondary btn-sm btn-edit-popup-mob" data-id="${p.id}" style="padding: 5px 10px; font-size: 0.82rem; border-radius: 6px; color: var(--accent-primary); border-color: rgba(0,102,255,0.2);"><i class="fa-solid fa-pen"></i> 수정</button>
                            <button class="btn btn-secondary btn-sm btn-delete-popup-mob" data-id="${p.id}" style="padding: 5px 10px; font-size: 0.82rem; border-radius: 6px; color: rgba(239, 68, 68, 0.8); border-color: rgba(239, 68, 68, 0.2);"><i class="fa-solid fa-trash-can"></i> 삭제</button>
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

        // 7) Initialize Mobile Kakao Notification Settings
        const mobKakaoToken = document.getElementById('mob-kakao-token');
        const btnMobSaveKakao = document.getElementById('btn-mob-save-kakao');
        const btnMobTestKakao = document.getElementById('btn-mob-test-kakao');

        if (mobKakaoToken && window.KakaoNotifier) {
            const s = window.KakaoNotifier.getSettings();
            mobKakaoToken.value = s.accessToken || '';
        }

        if (btnMobSaveKakao && mobKakaoToken && window.KakaoNotifier) {
            btnMobSaveKakao.onclick = () => {
                const token = mobKakaoToken.value.trim();
                const current = window.KakaoNotifier.getSettings();
                current.accessToken = token;
                window.KakaoNotifier.saveSettings(current);
                alert(token ? '카카오 토큰이 안전하게 저장되었습니다.\n이제부터 신규 접수 시 실시간 알림이 발송됩니다.' : '카카오 토큰이 초기화되었습니다.');
            };
        }

        if (btnMobTestKakao && window.KakaoNotifier) {
            btnMobTestKakao.onclick = async () => {
                const token = mobKakaoToken ? mobKakaoToken.value.trim() : '';
                if (!token) {
                    alert('먼저 카카오 Access Token을 입력하고 저장해 주세요.');
                    return;
                }
                btnMobTestKakao.disabled = true;
                btnMobTestKakao.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 전송 중...';

                const res = await window.KakaoNotifier.sendToMe(
                    '🔔 모바일 앱 카톡 알림 연동 테스트',
                    '간판지원단 모바일 앱과 대표님의 카카오톡이 정상적으로 연동되었습니다! 🎉\n고객 신청 및 접수가 발생하면 이와 같이 실시간 알림이 발송됩니다.'
                );

                btnMobTestKakao.disabled = false;
                btnMobTestKakao.innerHTML = '<i class="fa-solid fa-paper-plane"></i> 카톡 테스트';

                if (res.success) {
                    alert('✅ 카카오톡으로 테스트 알림이 성공적으로 전송되었습니다!\n스마트폰 카카오톡을 확인해 보세요.');
                } else {
                    alert(`❌ 전송 실패: ${res.reason || '토큰이 만료되었거나 권한이 부족합니다.'}\n카카오 디벨로퍼스에서 talk_message 권한 및 토큰을 다시 확인해 주세요.`);
                }
            };
        }
    }

    function approveConstructorConversionMob(uid) {
        const targetUser = users.find(u => u.id === uid);
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
                pending_business_name: targetUser?.pendingBusinessName || '(주)새로운시공',
                pending_license_number: targetUser?.pendingLicenseNumber || '000-00-00000',
                conversion_status: 'approved'
            });
        }

        alert(`시공업체 회원 승인이 정상 완료되었습니다! (발급된 시공코드: [${code}])`);
        renderStatusTab();
    }

    function approveUserConversionMob(uid) {
        const code = generateBizCode(users);
        users = users.map(u => {
            if (u.id === uid) {
                return { ...u, role: 'business', bizCode: code, conversionStatus: 'approved' };
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

        if (window.SupabaseSync) {
            window.SupabaseSync.updateUser(uid, {
                conversion_status: 'none'
            });
        }

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

        if (window.SupabaseSync) {
            window.SupabaseSync.updateApplication(appId, {
                assigned_constructor_id: constructorId,
                assigned_constructor_name: constUser.businessName,
                construction_status: 'before_construction'
            });
        }

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

            if (window.SupabaseSync) {
                window.SupabaseSync.updateApplication(id, {
                    construction_status: 'completed'
                });
            }

            alert('공사 증빙 검수가 통과되어 최종 정산 종결 처리되었습니다.');
            renderStatusTab();
        }
    }

    function deleteApplicationMob(id) {
        if (!confirm('정말로 이 지원 신청 접수 건을 삭제하시겠습니까?')) return;
        applications = applications.filter(app => app.id !== id);
        localStorage.setItem('applications', JSON.stringify(applications));

        if (window.SupabaseSync) {
            window.SupabaseSync.deleteApplication(id);
        }

        renderStatusTab();
    }

    function updateApplicationStatusMob(id, newStatus) {
        applications = applications.map(app => {
            if (String(app.id) === String(id)) {
                return { ...app, status: newStatus };
            }
            return app;
        });
        localStorage.setItem('applications', JSON.stringify(applications));

        if (window.SupabaseSync) {
            window.SupabaseSync.updateApplication(id, {
                status: newStatus
            });
        }

        alert(`신청 건이 [${newStatus === 'approved' ? '승인' : '반려'}] 처리되었습니다.`);
        renderStatusTab();
    }

    function toggleBizItemMob(appId) {
        if (!activeUser || activeUser.role !== 'admin') return;

        applications = JSON.parse(localStorage.getItem('applications')) || [];
        const appIndex = applications.findIndex(a => String(a.id) === String(appId));
        if (appIndex === -1) return;

        const app = applications[appIndex];
        const isNowBizItem = !app.isBizItem;
        app.isBizItem = isNowBizItem;
        applications[appIndex] = app;
        localStorage.setItem('applications', JSON.stringify(applications));

        let curUsers = JSON.parse(localStorage.getItem('users')) || [];

        if (isNowBizItem) {
            // 영업물건으로 등록/이동: 대상 영업자 찾기
            let targetUser = null;
            if (app.referrerCode) {
                targetUser = curUsers.find(u => u.role === 'business' && u.bizCode === app.referrerCode);
            }
            if (!targetUser && app.userId) {
                targetUser = curUsers.find(u => u.id === app.userId && u.role === 'business');
            }
            if (!targetUser) {
                targetUser = curUsers.find(u => u.role === 'business') || curUsers.find(u => u.role === 'admin');
            }

            if (targetUser) {
                targetUser.items = targetUser.items || [];
                const existingItemIdx = targetUser.items.findIndex(it => String(it.id) === String(app.id) || String(it.appRefId) === String(app.id));
                const bizItem = {
                    id: app.id,
                    name: app.storeName || app.shopName || app.ownerName,
                    phone: app.ownerPhone || '',
                    address: app.storeAddress || '',
                    photosCount: app.fileData ? 1 : 0,
                    receiptStatus: '접수예정',
                    progressStatus: '지원대기중',
                    photos: app.fileData ? [app.fileData] : [],
                    appRefId: app.id
                };

                if (existingItemIdx >= 0) {
                    targetUser.items[existingItemIdx] = { ...targetUser.items[existingItemIdx], ...bizItem };
                } else {
                    targetUser.items.push(bizItem);
                }

                curUsers = curUsers.map(u => u.id === targetUser.id ? targetUser : u);
                localStorage.setItem('users', JSON.stringify(curUsers));

                if (window.SupabaseSync) {
                    window.SupabaseSync.updateUser(targetUser.id, { items: targetUser.items });
                }
            }

            alert(`[${app.storeName || app.ownerName}] 건이 '영업물건'으로 변경되었습니다.\n진흥원 접수 및 모바일 영업물건 진행사항 메뉴로 연동됩니다.`);
        } else {
            // 영업물건에서 해제/제거
            curUsers = curUsers.map(u => {
                if (u.items && u.items.length > 0) {
                    const filteredItems = u.items.filter(it => String(it.id) !== String(app.id) && String(it.appRefId) !== String(app.id));
                    return { ...u, items: filteredItems };
                }
                return u;
            });
            localStorage.setItem('users', JSON.stringify(curUsers));

            if (window.SupabaseSync) {
                curUsers.forEach(u => {
                    if (u.role === 'business' || u.role === 'admin') {
                        window.SupabaseSync.updateUser(u.id, { items: u.items || [] });
                    }
                });
            }

            alert(`[${app.storeName || app.ownerName}] 건의 '영업물건' 등록이 해제되었습니다.`);
        }

        if (window.SupabaseSync) {
            window.SupabaseSync.upsertApplication(app);
        }

        renderStatusTab();
    }
    window.toggleBizItemMob = toggleBizItemMob;

    function updateItemStatusMob(uid, itemId, type, value) {
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

        renderStatusTab();
    }
    window.updateItemStatusMob = updateItemStatusMob;

    function deleteManagerItemMob(uid, itemId) {
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
        if (window.SupabaseSync) {
            const updatedUser = users.find(u => String(u.id) === String(uid));
            if (updatedUser) {
                window.SupabaseSync.updateUser(uid, {
                    items: updatedUser.items || []
                });
            }
            window.SupabaseSync.deleteApplication(itemId);
        }

        alert(`[${targetItemName}] 영업 물건이 안전하게 삭제되었습니다.`);
        renderStatusTab();
    }
    window.deleteManagerItemMob = deleteManagerItemMob;

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
                        
                        if (window.SupabaseSync) {
                            window.SupabaseSync.updateUser(activeUser.id, {
                                conversion_status: 'pending'
                            });
                        }

                        if (window.KakaoNotifier && typeof window.KakaoNotifier.notifyBusinessConversion === 'function') {
                            window.KakaoNotifier.notifyBusinessConversion(activeUser);
                        }

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

                    if (window.SupabaseSync) {
                        window.SupabaseSync.updateUser(activeUser.id, {
                            conversion_status: 'pending_constructor',
                            pending_business_name: bName,
                            pending_license_number: lNum
                        });
                    }

                    if (window.KakaoNotifier && typeof window.KakaoNotifier.notifyConstructorConversion === 'function') {
                        window.KakaoNotifier.notifyConstructorConversion(activeUser);
                    }

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
                status: 'pending',
                submittedAt: new Date().toISOString()
            };
            inquiries.push(newInquiry);
            localStorage.setItem('inquiries', JSON.stringify(inquiries));

            // Supabase Sync
            if (window.SupabaseSync) {
                window.SupabaseSync.upsertInquiry(newInquiry);
            }

            // 카카오톡 관리자 실시간 알림 발송
            if (window.KakaoNotifier && typeof window.KakaoNotifier.notifyInquiry === 'function') {
                window.KakaoNotifier.notifyInquiry(newInquiry);
            }

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

    // --- 개인정보변경 모달 ---
    const profileEditModal = document.getElementById('profile-edit-modal');
    const profileEditModalClose = document.getElementById('profile-edit-modal-close');
    const profileEditForm = document.getElementById('profile-edit-form');

    function openProfileEditModal() {
        if (!profileEditModal) return;
        const user = getActiveUser();
        if (!user) { alert('로그인이 필요합니다.'); return; }
        // 현재 정보 자동 채움
        document.getElementById('profile-edit-name').value  = user.name  || '';
        document.getElementById('profile-edit-email').value = user.email || '';
        document.getElementById('profile-edit-phone').value = user.phone || '';
        document.getElementById('profile-edit-address').value = user.address || '';
        document.getElementById('profile-edit-pw').value = '';
        document.getElementById('profile-edit-pw-confirm').value = '';
        profileEditModal.classList.add('active');
        closeDrawer();
    }

    function closeProfileEditModal() {
        if (profileEditModal) {
            profileEditModal.classList.remove('active');
            if (profileEditForm) profileEditForm.reset();
        }
    }

    // 드로어 버튼 → 모달 오픈
    const profileEditBtn = document.getElementById('drawer-profile-edit-btn');
    if (profileEditBtn) {
        profileEditBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openProfileEditModal();
        });
    }

    // 닫기 버튼
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

    // 저장
    if (profileEditForm) {
        profileEditForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = getActiveUser();
            if (!user) { alert('세션이 만료되었습니다. 다시 로그인해 주세요.'); return; }

            const nameVal    = escapeHtml(document.getElementById('profile-edit-name')?.value.trim() || '');
            const emailVal   = escapeHtml(document.getElementById('profile-edit-email')?.value.trim() || '');
            const phoneVal   = escapeHtml(document.getElementById('profile-edit-phone')?.value.trim() || '');
            const addressVal = escapeHtml(document.getElementById('profile-edit-address')?.value.trim() || '');
            const newPw      = document.getElementById('profile-edit-pw')?.value || '';
            const newPwConf  = document.getElementById('profile-edit-pw-confirm')?.value || '';

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

            // users 배열에서 찾아 수정
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const idx = users.findIndex(u => u.id === user.id);

            if (idx !== -1) {
                if (nameVal)    users[idx].name    = nameVal;
                if (emailVal)   users[idx].email   = emailVal;
                if (phoneVal)   users[idx].phone   = phoneVal;
                if (addressVal !== undefined) users[idx].address = addressVal;
                if (newPw)      users[idx].pw      = sha256(newPw);
                localStorage.setItem('users', JSON.stringify(users));

                // activeUser 세션 갱신
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
            updateDrawerProfile();
            updateHeaderAuthButton();
            if (typeof handleSessionRefresh === 'function') {
                handleSessionRefresh();
            }
        });
    }

    // --- 17. Mobile App Global Search Modal Logic ---
    const globalSearchModal = document.getElementById('global-search-modal');
    const searchModalClose = document.getElementById('search-modal-close');
    const searchTabName = document.getElementById('search-tab-name');
    const searchTabCode = document.getElementById('search-tab-code');
    const globalSearchForm = document.getElementById('global-search-form');
    const globalSearchInput = document.getElementById('global-search-input');
    const searchGuideText = document.getElementById('search-guide-text');
    const searchAuthBlock = document.getElementById('search-auth-block');
    const searchContentArea = document.getElementById('search-content-area');
    const searchResultsArea = document.getElementById('search-results-area');

    let currentSearchMode = 'name';

    function openGlobalSearchModal() {
        if (!globalSearchModal) return;
        const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
        
        if (!user) {
            if (searchAuthBlock) searchAuthBlock.style.display = 'block';
            if (searchContentArea) searchContentArea.style.display = 'none';
        } else {
            if (searchAuthBlock) searchAuthBlock.style.display = 'none';
            if (searchContentArea) searchContentArea.style.display = 'block';
            setSearchMode('name');
            if (globalSearchInput) globalSearchInput.value = '';
            if (searchResultsArea) searchResultsArea.innerHTML = '';
            setTimeout(() => { if (globalSearchInput) globalSearchInput.focus(); }, 150);
        }

        globalSearchModal.classList.add('active');
    }
    window.openGlobalSearchModal = openGlobalSearchModal;

    function closeGlobalSearchModal() {
        if (globalSearchModal) {
            globalSearchModal.classList.remove('active');
            if (globalSearchInput) globalSearchInput.value = '';
            if (searchResultsArea) searchResultsArea.innerHTML = '';
        }
    }
    window.closeGlobalSearchModal = closeGlobalSearchModal;

    function setSearchMode(mode) {
        currentSearchMode = mode;
        if (mode === 'name') {
            if (searchTabName) {
                searchTabName.className = 'btn btn-primary';
                searchTabName.style.background = 'var(--grad-primary)';
                searchTabName.style.color = '#fff';
            }
            if (searchTabCode) {
                searchTabCode.className = 'btn btn-secondary';
                searchTabCode.style.background = 'transparent';
                searchTabCode.style.color = 'var(--text-secondary)';
            }
            if (globalSearchInput) {
                globalSearchInput.maxLength = 25;
                globalSearchInput.placeholder = '상호명을 입력해 주세요 (최대 25자, 예: 초원식당)';
            }
            if (searchGuideText) {
                searchGuideText.innerHTML = '조회하고자 하는 매장의 <strong>상호명(업체명, 최대 25자)</strong>을 입력해 주세요.';
            }
        } else {
            if (searchTabCode) {
                searchTabCode.className = 'btn btn-primary';
                searchTabCode.style.background = 'var(--grad-primary)';
                searchTabCode.style.color = '#fff';
            }
            if (searchTabName) {
                searchTabName.className = 'btn btn-secondary';
                searchTabName.style.background = 'transparent';
                searchTabName.style.color = 'var(--text-secondary)';
            }
            if (globalSearchInput) {
                globalSearchInput.maxLength = 15;
                globalSearchInput.placeholder = '고유번호를 입력해 주세요 (최대 15자, 예: P-260816001)';
            }
            if (searchGuideText) {
                searchGuideText.innerHTML = '발급받으신 <strong>고유 접수번호(최대 15자)</strong>(예: P-260816001, B-260801-0001)를 입력해 주세요.';
            }
        }
        if (globalSearchInput) globalSearchInput.focus();
    }

    if (searchTabName) {
        searchTabName.addEventListener('click', () => setSearchMode('name'));
    }
    if (searchTabCode) {
        searchTabCode.addEventListener('click', () => setSearchMode('code'));
    }

    if (searchModalClose) {
        searchModalClose.addEventListener('click', closeGlobalSearchModal);
    }
    document.querySelectorAll('.search-modal-close-btn').forEach(btn => {
        btn.addEventListener('click', closeGlobalSearchModal);
    });
    if (globalSearchModal) {
        globalSearchModal.addEventListener('click', (e) => {
            if (e.target === globalSearchModal) closeGlobalSearchModal();
        });
    }

    document.querySelectorAll('.btn-search-go-auth').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            closeGlobalSearchModal();
            const authBtn = document.getElementById('drawer-login-link') || document.getElementById('app-header-auth-btn');
            if (authBtn) {
                authBtn.click();
            } else {
                const authModal = document.getElementById('auth-modal');
                if (authModal) authModal.classList.add('active');
            }
        });
    });

    if (globalSearchForm) {
        globalSearchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
            if (!user) {
                alert('검색 기능을 이용하시려면 먼저 회원가입 또는 로그인이 필요합니다.');
                return;
            }

            const rawQuery = globalSearchInput ? globalSearchInput.value.trim() : '';
            if (!rawQuery) {
                alert('검색어를 입력해 주세요.');
                return;
            }

            if (currentSearchMode === 'name' && rawQuery.length > 25) {
                alert('상호명 검색은 최대 25자까지 입력 가능합니다.');
                return;
            }
            if (currentSearchMode === 'code' && rawQuery.length > 15) {
                alert('번호 검색은 최대 15자까지 입력 가능합니다.');
                return;
            }

            const query = rawQuery.toLowerCase();
            const apps = JSON.parse(localStorage.getItem('applications')) || [];
            const users = JSON.parse(localStorage.getItem('users')) || [];

            const allRecords = [];

            apps.forEach(app => {
                allRecords.push({
                    id: app.id,
                    storeName: app.storeName || '상호명 미등록',
                    ownerName: app.ownerName || '신청자',
                    ownerPhone: app.phone || app.ownerPhone || '',
                    storeAddress: app.storeAddress || '주소 미등록',
                    signType: app.signType || '플렉스',
                    status: app.status || 'pending',
                    type: '일반신청'
                });
            });

            users.forEach(u => {
                if (u.items && Array.isArray(u.items)) {
                    u.items.forEach(item => {
                        if (!allRecords.some(r => r.id === item.id)) {
                            allRecords.push({
                                id: item.id,
                                storeName: item.name || '상호명 미등록',
                                ownerName: u.name || '영업자',
                                ownerPhone: item.phone || u.phone || '',
                                storeAddress: item.address || '주소 미등록',
                                signType: '현장 실측 간판',
                                status: item.progressStatus || '심사 대기',
                                type: '영업물건'
                            });
                        }
                    });
                }
            });

            const matched = allRecords.filter(r => {
                if (currentSearchMode === 'name') {
                    return r.storeName.toLowerCase().includes(query);
                } else {
                    return String(r.id).toLowerCase().includes(query);
                }
            });

            if (!searchResultsArea) return;
            searchResultsArea.innerHTML = '';

            if (matched.length === 0) {
                searchResultsArea.innerHTML = `
                    <div style="text-align: center; padding: 25px 15px; color: var(--text-muted); font-size: 0.85rem;">
                        <i class="fa-solid fa-triangle-exclamation" style="font-size: 1.6rem; margin-bottom: 8px; color: #f59e0b; display: block;"></i>
                        검색 결과가 없습니다.<br>
                        <span style="font-size: 0.76rem; color: #94a3b8;">입력하신 ${currentSearchMode === 'name' ? '상호명' : '고유번호'}을(를) 다시 한번 확인해 주세요.</span>
                    </div>
                `;
                return;
            }

            matched.forEach(item => {
                let statusBadge = '<span style="background: #e2e8f0; color: #475569; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;">심사 대기</span>';
                if (item.status === 'approved' || item.status === '승인 완료') {
                    statusBadge = '<span style="background: #dcfce7; color: #166534; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;"><i class="fa-solid fa-check"></i> 승인 완료</span>';
                } else if (item.status === 'rejected' || item.status === '반려됨') {
                    statusBadge = '<span style="background: #fee2e2; color: #991b1b; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;"><i class="fa-solid fa-xmark"></i> 반려됨</span>';
                } else if (item.status) {
                    statusBadge = `<span style="background: #e0e7ff; color: #3730a3; padding: 2px 7px; border-radius: 4px; font-size: 0.72rem; font-weight: 600;">${escapeHtml(item.status)}</span>`;
                }

                const card = document.createElement('div');
                card.style.background = '#f8fafc';
                card.style.border = '1px solid var(--border-color)';
                card.style.borderRadius = '8px';
                card.style.padding = '12px 14px';
                card.style.textAlign = 'left';

                const maskedName = typeof maskName === 'function' ? maskName(item.ownerName) : item.ownerName;
                const maskedPhone = typeof maskPhone === 'function' ? maskPhone(item.ownerPhone) : item.ownerPhone;

                card.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-bottom: 6px;">
                        <div style="font-weight: 700; font-size: 0.95rem; color: var(--text-primary);">
                            ${escapeHtml(item.storeName)}
                            <span style="font-size: 0.7rem; font-weight: 600; color: var(--accent-primary); background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); padding: 1px 6px; border-radius: 4px; margin-left: 4px;">${escapeHtml(String(item.id))}</span>
                        </div>
                        <div>${statusBadge}</div>
                    </div>
                    <div style="font-size: 0.78rem; color: var(--text-secondary); line-height: 1.5;">
                        <div><i class="fa-solid fa-location-dot" style="width: 14px; color: var(--accent-primary);"></i> ${escapeHtml(item.storeAddress)}</div>
                        <div style="display: flex; gap: 12px; margin-top: 3px; font-size: 0.74rem; color: #64748b;">
                            <span><i class="fa-solid fa-user-shield"></i> 신청인: ${escapeHtml(maskedName)}</span>
                            ${maskedPhone ? `<span><i class="fa-solid fa-phone"></i> ${escapeHtml(maskedPhone)}</span>` : ''}
                        </div>
                    </div>
                `;
                searchResultsArea.appendChild(card);
            });
        });
    }

    // 초기 로드 시 Supabase 최신 데이터 즉시 동기화 실행
    syncAdminDataFromSupabaseMob();

});

