// app.js - Mobile App Shell & Interactive State Synchronizer

// --- 모바일 전역 3초 간편문의 상태 변경 및 삭제 핸들러 (최상단 즉시 정의) ---
window.toggleInquiryStatusMob = function (id, e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const btnEl = (e instanceof Element) ? e : (e && e.currentTarget instanceof Element ? e.currentTarget : (e && e.target instanceof Element ? e.target.closest('button') : null));

    let currentInquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
    let inqIndex = currentInquiries.findIndex(i => String(i.id) === String(id));
    if (inqIndex === -1 && btnEl) {
        const card = btnEl.closest('.admin-inquiry-card-mob') || btnEl.closest('.admin-inquiry-card') || btnEl.closest('div');
        if (card) {
            const phoneEl = card.querySelector('a[href^="tel:"]');
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

        if (btnEl && btnEl.style) {
            btnEl.style.background = isNowResolved ? '#f1f5f9' : '#15803d';
            btnEl.style.color = isNowResolved ? '#475569' : '#ffffff';
            btnEl.innerHTML = `<i class="fa-solid ${isNowResolved ? 'fa-rotate-left' : 'fa-check'}" style="pointer-events: none;"></i> ${isNowResolved ? '대기로 변경' : '상담 완료'}`;
        }

        const targetId = target.id || id;
        if (window.supabaseClient && targetId) {
            window.supabaseClient.from('inquiries').update({ status: newStatus }).eq('id', String(targetId)).then(() => { });
        }
        if (window.SupabaseSync) {
            window.SupabaseSync.upsertInquiry(target);
        }
        if (typeof window.renderAdminDashboardMob === 'function') {
            window.renderAdminDashboardMob(true);
        }
    }
};

window.deleteInquiryAdminMob = function (id, e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    if (!id) return;
    if (!confirm('정말로 이 간편 문의 내역을 영구 삭제하시겠습니까?')) return;
    let currentInquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
    currentInquiries = currentInquiries.filter(i => String(i.id) !== String(id));
    localStorage.setItem('inquiries', JSON.stringify(currentInquiries));
    if (window.SupabaseSync) {
        window.SupabaseSync.deleteInquiry(id);
    }
    alert('간편 문의 내역이 성공적으로 삭제되었습니다.');
    if (typeof window.renderAdminDashboardMob === 'function') {
        window.renderAdminDashboardMob(true);
    }
};

// --- 모바일 통합 DataStore 브릿지 핸들러 ---
window.deleteUserAdminMob = function (uid, btnEl) {
    if (window.DataStore) return window.DataStore.deleteUser(uid, btnEl);
};

window.toggleBizItemMob = function (appId, btnEl) {
    if (window.DataStore) {
        const res = window.DataStore.toggleBizItem(appId);
        if (typeof window.renderAdminDashboardMob === 'function') {
            window.renderAdminDashboardMob(true);
        }
        return res;
    }
};

// --- 모바일 전역 네비게이션 및 모달 핸들러 (최상단 즉시 선언 - Fail-Safe Early Definition) ---
window.switchTab = function (tabId) {
    try {
        if (tabId === 'dashboard' || tabId === 'tab-dashboard') {
            tabId = 'status';
        }
        const tabs = document.querySelectorAll('.app-view');
        const navItems = document.querySelectorAll('.nav-item');

        if (tabId === 'apply') {
            navItems.forEach(btn => {
                if (btn.id === 'tab-btn-home' || btn.id === 'tab-btn-apply') {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });
            tabs.forEach(tab => {
                if (tab.id === 'view-home') {
                    tab.classList.add('active');
                } else {
                    tab.classList.remove('active');
                }
            });
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

        if (tabId === 'status' && typeof window.renderStatusTab === 'function') {
            window.renderStatusTab();
        }

        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const activeTab = document.getElementById(`view-${tabId}`);
        if (activeTab) {
            activeTab.scrollTop = 0;
        }
        if (typeof window.updateHeaderAuthButton === 'function') {
            window.updateHeaderAuthButton();
        }
    } catch (err) {
        console.error('[switchTab Error]', err);
    }
};

window.openInstallModalMob = function (e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const mobileInstallModal = document.getElementById('install-modal');
    if (mobileInstallModal) {
        const qrImg = document.getElementById('install-qr-img');
        if (qrImg) {
            qrImg.onerror = () => {
                qrImg.src = 'https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https%3A%2F%2Fganpans.com%2Fapp';
            };
            qrImg.src = './ganpan-app-qr.png?v=20260817';
        }
        const qrSection = document.getElementById('install-qr-section');
        if (qrSection) qrSection.style.display = 'flex';
        mobileInstallModal.classList.add('active');
    }
};

window.openAuthModal = function (initialTab = 'login') {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.classList.add('active');
        if (typeof window.switchAuthTab === 'function') {
            window.switchAuthTab(initialTab);
        }
    }
};

window.handleHeaderAuthClickMob = function (e) {
    if (e) {
        if (typeof e.preventDefault === 'function') e.preventDefault();
        if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const user = (typeof getActiveUser === 'function') ? (getActiveUser() || null) : null;
    if (user) {
        if (typeof window.openDrawer === 'function') {
            window.openDrawer();
        } else {
            const drawer = document.getElementById('app-drawer');
            const drawerOverlay = document.getElementById('app-drawer-overlay');
            if (drawer) drawer.classList.add('active');
            if (drawerOverlay) drawerOverlay.classList.add('active');
            if (typeof window.updateDrawerProfile === 'function') window.updateDrawerProfile();
        }
    } else {
        window.openAuthModal();
    }
};

window.openGlobalSearchModal = function () {
    const globalSearchModal = document.getElementById('global-search-modal');
    if (!globalSearchModal) return;
    const user = typeof getActiveUser === 'function' ? getActiveUser() : null;
    const searchAuthBlock = document.getElementById('search-auth-block');
    const searchContentArea = document.getElementById('search-content-area');
    const globalSearchInput = document.getElementById('global-search-input');
    const searchResultsArea = document.getElementById('search-results-area');

    if (!user) {
        if (searchAuthBlock) searchAuthBlock.style.display = 'block';
        if (searchContentArea) searchContentArea.style.display = 'none';
    } else {
        if (searchAuthBlock) searchAuthBlock.style.display = 'none';
        if (searchContentArea) searchContentArea.style.display = 'block';
        if (typeof window.setSearchModeMob === 'function') window.setSearchModeMob('name');
        if (globalSearchInput) globalSearchInput.value = '';
        if (searchResultsArea) searchResultsArea.innerHTML = '';
        setTimeout(() => { if (globalSearchInput) globalSearchInput.focus(); }, 150);
    }
    globalSearchModal.classList.add('active');
};

document.addEventListener('DOMContentLoaded', () => {
    // --- State Variables ---

    // 회원가입 아이디: 영문 대/소문자, 숫자만 허용 (실시간 필터링)
    const signupIdInput = document.getElementById('signup-id');
    if (signupIdInput) {
        signupIdInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^a-zA-Z0-9]/g, '');
        });
    }


    // 영업물건 기존 3건 및 오류 데이터 강력 영구 완전 삭제 및 초기화 (대원감자탕, 우리나라곰탕 등 박멸)
    if (!localStorage.getItem('biz_items_purged_20260820_03')) {
        const defaultPurgedBizItemIds = [
            'B-260802-0001',
            '대원감자탕',
            '대원 감자탕',

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

        let activeU = getActiveUser() || null;
        if (activeU && activeU.items) {
            activeU.items = activeU.items.filter(it => !isMatchPurge(it));
            localStorage.setItem('activeUser', JSON.stringify(activeU));
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

    // --- Visitor Tracking (Mobile) ---
    const trackVisitorMob = async () => {
        const RESET_KEY = 'visitor_reset_flag_20260817';
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

        if (lastDate !== todayStr) {
            todayCount = 0;
            localStorage.setItem('visitor_last_date', todayStr);
            localStorage.setItem('visitor_today', '0');
        }

        if (!sessionStorage.getItem('visitor_session_counted_v2')) {
            sessionStorage.setItem('visitor_session_counted_v2', 'true');
            totalCount += 1;
            todayCount += 1;
            localStorage.setItem('visitor_total', totalCount.toString());
            localStorage.setItem('visitor_today', todayCount.toString());
            localStorage.setItem('visitor_last_date', todayStr);

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
                    console.warn('Supabase visitor tracking notice:', err.message);
                }
            }
        }
    };
    trackVisitorMob();

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
                if (activeUser.conversionStatus === 'pending') {
                    drawerUserRole.textContent = '영업자 승인 대기중';
                    drawerUserRole.style.background = '#f59e0b';
                    drawerUserRole.style.color = '#fff';
                } else if (activeUser.conversionStatus === 'pending_constructor') {
                    drawerUserRole.textContent = '시공업체 승인 대기중';
                    drawerUserRole.style.background = '#f59e0b';
                    drawerUserRole.style.color = '#fff';
                } else {
                    drawerUserRole.textContent = '일반 회원';
                    drawerUserRole.style.background = 'var(--accent-primary)';
                    drawerUserRole.style.color = '#fff';
                }
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
        if (tabId === 'dashboard' || tabId === 'tab-dashboard') {
            tabId = 'status';
        }
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
        window.scrollTo(0, 0);
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const activeTab = document.getElementById(`view-${tabId}`);
        if (activeTab) {
            activeTab.scrollTop = 0;
        }
        updateHeaderAuthButton();
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

    function openAuthModal(initialTab = 'login') {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.add('active');
            if (typeof window.switchAuthTab === 'function') {
                window.switchAuthTab(initialTab);
            }
        }
    }
    window.openAuthModal = openAuthModal;

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

    // 로그아웃 / 세션 전환 시 현장 접수 폼 완전 초기화
    const clearBizUploadFormMob = () => {
        const form = document.getElementById('mobile-upload-form-mob');
        if (form) form.reset();

        // 사진 미리보기 & 카운터 초기화
        const previews = document.getElementById('mob-photo-previews-mob');
        if (previews) previews.innerHTML = '';
        const counter = document.getElementById('mob-photo-count-mob');
        if (counter) counter.textContent = '선택된 사진: 0 / 20장';

        // file input 값 초기화
        const photosInput = document.getElementById('mob-photos-input-mob');
        if (photosInput) photosInput.value = '';
        const cameraInput = document.getElementById('mob-camera-input-mob');
        if (cameraInput) cameraInput.value = '';

        // 전역 선택 사진 배열 비우기 (selectedPhotosMob은 이 스코프 아래 선언되어 있으므로 직접 접근 가능)
        // — 아래 selectedPhotosMob 선언 이후 실제 초기화가 이루어지도록 flag 방식 사용
        window._clearBizPhotosMob = true;
    };
    window.clearBizUploadFormMob = clearBizUploadFormMob;

    if (loginForm) loginForm.addEventListener('submit', handleSessionRefresh);
    if (signupForm) signupForm.addEventListener('submit', handleSessionRefresh);

    // --- Intercept Drawer Logout Click ---
    const drawerLogoutBtn = document.getElementById('drawer-logout-btn');
    if (drawerLogoutBtn) {
        drawerLogoutBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // 현장 접수 폼 즉시 초기화 (로그아웃 전 데이터 잔류 방지)
            clearBizUploadFormMob();

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
                        const deletedUid = String(activeUser.id);

                        // 1) deleted_user_ids 등록
                        let deletedIds = JSON.parse(localStorage.getItem('deleted_user_ids')) || [];
                        if (!deletedIds.includes(deletedUid)) {
                            deletedIds.push(deletedUid);
                            localStorage.setItem('deleted_user_ids', JSON.stringify(deletedIds));
                        }

                        // 2) 로컬 users 제거
                        users = users.filter(u => String(u.id) !== deletedUid);
                        localStorage.setItem('users', JSON.stringify(users));

                        // 3) Supabase DB 영구 삭제
                        if (window.SupabaseSync) {
                            window.SupabaseSync.deleteUser(deletedUid);
                        }

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

        // 최신 users 목록과 100% 동기화 (최고관리자 승인 즉시 권한 승격 반영)
        if (activeUser && users.length > 0) {
            const fresh = users.find(u => String(u.id).toLowerCase() === String(activeUser.id).toLowerCase());
            if (fresh) {
                activeUser = { ...activeUser, ...fresh };
            }
        }

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
            if (activeUser.conversionStatus === 'pending') {
                roleBadge.textContent = '영업자 승인 대기중';
                roleBadge.style.background = '#f59e0b';
            } else if (activeUser.conversionStatus === 'pending_constructor') {
                roleBadge.textContent = '시공업체 승인 대기중';
                roleBadge.style.background = '#f59e0b';
            } else {
                roleBadge.textContent = '일반 회원';
                roleBadge.style.background = 'var(--accent-primary)';
            }
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
                sessionStorage.setItem('activeUser', JSON.stringify(activeUser));

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

                alert('영업자 회원 전환 신청이 완료되었습니다.\n최고관리자 승인 후 영업자 코드가 발급되며 영업물건을 등록할 수 있습니다.');
                renderStatusTab();
                updateDrawerProfile();
                updateHeaderAuthButton();
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
            sessionStorage.setItem('activeUser', JSON.stringify(activeUser));

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
            updateDrawerProfile();
            updateHeaderAuthButton();
        });
    }

    // --- Salesperson Dashboard ---
    function formatDateOnly(dateString) {
        if (!dateString) return '-';
        try {
            const d = new Date(dateString);
            if (isNaN(d.getTime())) return String(dateString).split('T')[0] || '-';
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}.${m}.${day}`;
        } catch (e) {
            return String(dateString).split('T')[0] || '-';
        }
    }

    function getAppStatusBadgeHtmlMob(statusObj) {
        let status = '';
        let constStatus = '';
        if (typeof statusObj === 'string') {
            status = statusObj;
        } else if (statusObj) {
            status = statusObj.status || statusObj.receiptStatus || '';
            constStatus = statusObj.constructionStatus || statusObj.progressStatus || '';
        }

        if (constStatus === '간판시공완료' || constStatus === '시공 완료' || constStatus === '정산 완료') {
            return '<span style="background: #fdf4ff; color: #a855f7; border: 1px solid #f0abfc; padding: 3px 8px; border-radius: 4px; font-size: 0.95rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-screwdriver-wrench"></i> 시공 완료</span>';
        }
        if (constStatus === '대상자선정' || constStatus === '간판시공 준비중') {
            return '<span style="background: #ecfdf5; color: #10b981; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; font-size: 0.95rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> 대상자선정</span>';
        }
        if (status === 'approved' || status === '서류제출 & 접수예정' || status === '승인 완료') {
            return '<span style="background: #ecfdf5; color: #059669; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; font-size: 0.95rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> 승인 완료</span>';
        }
        if (status === 'rejected' || status === '지원사업 탈락' || status === '반려됨') {
            return '<span style="background: #fef2f2; color: #ef4444; border: 1px solid #fecaca; padding: 3px 8px; border-radius: 4px; font-size: 0.95rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-xmark"></i> 탈락</span>';
        }
        if (status === 'giveup' || status === '지원사업 포기' || status === '지원사업포기') {
            return '<span style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 3px 8px; border-radius: 4px; font-size: 0.95rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-ban"></i> 포기</span>';
        }
        return '<span style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 4px; font-size: 0.95rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-regular fa-clock"></i> 심사 대기</span>';
    }

    function getReceiptStatusBadgeHtmlMob(status) {
        const s = String(status || '').trim();
        if (s === '접수완료' || s.includes('접수완료') || s === '접수 완료') {
            return '<span style="background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; padding: 3px 8px; border-radius: 4px; font-size: 0.88rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-check-double"></i> 접수완료</span>';
        }
        if (s === '업체신청') {
            return '<span style="background: #f8fafc; color: #64748b; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 4px; font-size: 0.88rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-building"></i> 업체신청</span>';
        }
        return '<span style="background: #fffbeb; color: #d97706; border: 1px solid #fde68a; padding: 3px 8px; border-radius: 4px; font-size: 0.88rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-clock"></i> 접수예정</span>';
    }

    function getProgressStatusBadgeHtmlMob(status) {
        const s = String(status || '').trim();
        if (s === '간판시공완료' || s === '시공 완료' || s === '정산 완료') {
            return '<span style="background: #fdf4ff; color: #a855f7; border: 1px solid #f0abfc; padding: 3px 8px; border-radius: 4px; font-size: 0.88rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-screwdriver-wrench"></i> 간판시공완료</span>';
        }
        if (s === '간판시공 준비중' || s === '시공 준비중') {
            return '<span style="background: #f0f9ff; color: #0284c7; border: 1px solid #bae6fd; padding: 3px 8px; border-radius: 4px; font-size: 0.88rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-paint-roller"></i> 간판시공 준비중</span>';
        }
        if (s === '대상자선정' || s === '선정') {
            return '<span style="background: #ecfdf5; color: #10b981; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 4px; font-size: 0.88rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-circle-check"></i> 대상자선정</span>';
        }
        if (s === '심사대기' || s === '심사 대기' || s === '서류 보완 필요') {
            return '<span style="background: #fff7ed; color: #ea580c; border: 1px solid #fed7aa; padding: 3px 8px; border-radius: 4px; font-size: 0.88rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-hourglass-half"></i> 심사대기</span>';
        }
        return '<span style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; padding: 3px 8px; border-radius: 4px; font-size: 0.88rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-regular fa-clock"></i> 지원대기중</span>';
    }

    // Mobile Business Dashboard Toggle States
    let userAppsMobExpanded = false; // false: 최근 3건 요약, true: 전체 확장
    let bizItemsMobExpanded = false; // false: 최근 3건 요약, true: 전체 확장

    function handleApplicationPhotoUploadMob(appId) {
        if (!activeUser) return;
        let fileInput = document.getElementById('mob-app-photo-upload-input');
        if (!fileInput) {
            fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.id = 'mob-app-photo-upload-input';
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
                    base64Data = await compressImageToBase64(file, 1 * 1024 * 1024);
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
                    localStorage.setItem('applications', JSON.stringify(curApps));
                }

                // 2) users items 업데이트
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

                // 3) Supabase DB 동기화
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
                        console.warn('Supabase photo sync warning:', dbErr);
                    }
                }

                alert(`📷 [${targetApp ? (targetApp.storeName || targetApp.shopName || targetApp.ownerName) : appId}] 현장사진이 성공적으로 등록되었습니다.`);
                renderBusinessDashboardMob();
                if (typeof renderAdminDashboardMob === 'function') renderAdminDashboardMob();
                if (typeof renderStatusTab === 'function') renderStatusTab();
            } catch (err) {
                console.error('Mobile photo upload error:', err);
                alert('사진 처리 중 오류가 발생했습니다: ' + err.message);
            } finally {
                fileInput.value = '';
            }
        };

        fileInput.click();
    }

    // 1. 내 온라인 간편 지원 신청 내역 (모바일 카드)
    function renderUserApplicationsMob() {
        const userAppsContainer = document.getElementById('user-apps-list-mobile');
        if (!userAppsContainer) return;

        let apps = window.DataStore ? window.DataStore.getApplications() : (JSON.parse(localStorage.getItem('applications')) || []);
        if (!activeUser) return;

        const myApps = apps.filter(app => {
            const isMyId = app.userId === activeUser.id;
            const isMyPhone = activeUser.phone && app.ownerPhone && app.ownerPhone.replace(/[^0-9]/g, '') === activeUser.phone.replace(/[^0-9]/g, '');
            const isMyName = activeUser.name && app.ownerName === activeUser.name;
            const isMyBizCode = activeUser.bizCode && app.referrerCode && (app.referrerCode === activeUser.bizCode || app.referrerCode === activeUser.id || app.referrerCode === activeUser.name);
            return isMyId || isMyPhone || isMyName || isMyBizCode;
        });

        // Search filtering
        const searchInput = document.getElementById('search-user-apps-mob');
        const q = (searchInput ? searchInput.value.trim().toLowerCase() : '').slice(0, 30);

        let filtered = myApps;
        if (q) {
            filtered = myApps.filter(app => {
                const id = String(app.id || '').toLowerCase();
                const owner = String(app.ownerName || '').toLowerCase();
                const phone = String(app.ownerPhone || '').toLowerCase();
                const store = String(app.storeName || '').toLowerCase();
                const addr = String(app.storeAddress || '').toLowerCase();
                return id.includes(q) || owner.includes(q) || phone.includes(q) || store.includes(q) || addr.includes(q);
            });
        }

        const totalCount = filtered.length;
        const toggleBadge = document.getElementById('user-apps-mob-toggle-badge');
        if (toggleBadge) {
            toggleBadge.style.background = userAppsMobExpanded ? 'rgba(99, 102, 241, 0.2)' : 'rgba(99, 102, 241, 0.12)';
            toggleBadge.style.color = '#4f46e5';
            toggleBadge.style.border = '1px solid rgba(99, 102, 241, 0.3)';
            toggleBadge.style.fontSize = '0.78rem';
            toggleBadge.style.padding = '3px 10px';
            toggleBadge.style.borderRadius = '9999px';
            toggleBadge.style.display = 'inline-flex';
            toggleBadge.style.alignItems = 'center';
            toggleBadge.style.gap = '4px';
            toggleBadge.style.cursor = 'pointer';
            if (userAppsMobExpanded) {
                toggleBadge.innerHTML = '<i class="fa-solid fa-chevron-up"></i> 기본 3건만 접기';
            } else {
                toggleBadge.innerHTML = `<i class="fa-solid fa-chevron-down"></i> 전체 펼치기${totalCount > 3 ? ` (${totalCount}건)` : ''}`;
            }
        }

        if (filtered.length === 0) {
            const emptyMsg = q ? `검색어 [${escapeHtml(q)}] 에 일치하는 신청 내역이 없습니다.` : '접수한 온라인 간편 지원 신청 내역이 없습니다.';
            userAppsContainer.innerHTML = `<p class="text-muted" style="text-align:center; padding: 15px; font-size: 0.88rem; background: #f8fafc; border-radius: 8px;">${emptyMsg}</p>`;
            return;
        }

        const sortedApps = [...filtered].sort((a, b) => new Date(b.appliedAt || 0).getTime() - new Date(a.appliedAt || 0).getTime());
        const displayApps = userAppsMobExpanded ? sortedApps : sortedApps.slice(0, 3);

        userAppsContainer.innerHTML = '';
        displayApps.forEach(app => {
            const statusBadge = getAppStatusBadgeHtmlMob(app);
            let photoList = [];
            if (Array.isArray(app.photos) && app.photos.length > 0) {
                photoList = app.photos.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
            }
            if (photoList.length === 0 && app.fileData && typeof app.fileData === 'string' && (app.fileData.startsWith('data:') || app.fileData.startsWith('http') || app.fileData.startsWith('blob:'))) {
                photoList = [app.fileData];
            }
            if (photoList.length === 0 && app.image_url && typeof app.image_url === 'string') {
                if (app.image_url.startsWith('[') && app.image_url.includes('data:')) {
                    try {
                        const parsed = JSON.parse(app.image_url);
                        if (Array.isArray(parsed)) {
                            photoList = parsed.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
                        }
                    } catch (e) {}
                } else if (app.image_url.startsWith('data:') || app.image_url.startsWith('http') || app.image_url.startsWith('blob:')) {
                    photoList = [app.image_url];
                }
            }
            const count = photoList.length;
            const hasPhoto = count > 0;

            const downloadBtn = hasPhoto
                ? `<button type="button" onclick="window.downloadApplicationPhotos('${app.id}'); return false;" style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 12px; font-size: 0.8rem; font-weight: 700; color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; cursor: pointer; height: 32px; box-sizing: border-box;" title="${count > 1 ? `현장사진 ${count}장 다운로드` : '현장사진 다운로드'}">
                    <i class="fa-solid ${count > 1 ? 'fa-file-zipper' : 'fa-download'}" style="font-size: 0.76rem; color: #2563eb;"></i> ${count > 1 ? `다운 (${count}장)` : '다운로드'}
                </button>`
                : `<button type="button" disabled style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 6px 12px; font-size: 0.8rem; font-weight: 500; color: #94a3b8; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: not-allowed; height: 32px; box-sizing: border-box;" title="등록된 사진 없음">
                    <i class="fa-solid fa-download" style="font-size: 0.76rem;"></i> 다운로드
                </button>`;

            const card = document.createElement('div');
            card.className = 'biz-card-mob';
            card.style.cssText = 'background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <h5 style="font-size: 1.31rem; font-weight: 700; color: var(--text-primary); margin: 0;">${escapeHtml(app.storeName || app.shopName || '-')}</h5>
                    <div>${statusBadge}</div>
                </div>
                <p style="font-size: 1.03rem; color: var(--text-secondary); margin: 0 0 5px 0;">
                    <strong style="color: #475569;">신청일시:</strong> <span style="font-family: monospace; color: var(--text-primary); font-weight: 600;">${formatDateOnly(app.appliedAt)}</span>
                </p>
                <p style="font-size: 1.03rem; color: var(--text-secondary); margin: 0 0 5px 0;">
                    <strong style="color: #475569;">신청번호:</strong> <span style="font-family: monospace; font-weight: 600; color: var(--accent-primary);">${escapeHtml(String(app.id))}</span>
                </p>
                <p style="font-size: 1.03rem; color: var(--text-secondary); margin: 0 0 5px 0;">
                    <strong style="color: #475569;">대표자:</strong> <span style="color: var(--text-primary); font-weight: 700;">${escapeHtml(app.ownerName || '-')}</span> <span style="color: var(--text-secondary); font-size: 0.98rem;">(${escapeHtml(app.ownerPhone || '-')})</span>
                </p>
                <p style="font-size: 1.03rem; color: var(--text-secondary); margin: 0 0 12px 0; line-height: 1.4;">
                    <strong style="color: #475569;">주소:</strong> ${escapeHtml(app.storeAddress || '-')}
                </p>

                <!-- 1. 현장사진 박스 -->
                <div style="background: #fefce8; border: 1px dashed #fde047; border-radius: 8px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; margin-bottom: 8px;">
                    <span style="font-size: 0.92rem; font-weight: 700; color: #a16207;">현장사진</span>
                    <div style="display: flex; gap: 8px; align-items: center;">
                        <button type="button" class="btn-upload-mob-app-photo" data-id="${app.id}" style="padding: 6px 12px; font-size: 0.8rem; font-weight: 700; background: #10b981; color: #ffffff; border: none; border-radius: 6px; cursor: pointer; display: flex; align-items: center; gap: 4px; box-shadow: 0 1px 2px rgba(16,185,129,0.2);">
                            <i class="fa-solid fa-camera"></i> 사진 촬영/등록
                        </button>
                        ${downloadBtn}
                    </div>
                </div>

                <!-- 2. 간판 디자인 시안 확인 박스 (시공사 등록 시 점주 실시간 확인/승인) -->
                ${(() => {
                    const draftPhotos = app.signDraftPhotos || app.designPhotos || [];
                    const draftCount = draftPhotos.length;
                    if (draftCount === 0) return '';
                    
                    const isApproved = app.draftStatus === 'owner_approved' || app.draftStatus === 'admin_approved';
                    const approvedLabel = app.draftStatus === 'owner_approved' ? '점주 시안 확정 완료' : '관리자 시안 확정 완료';
                    
                    return `
                        <div style="background: #fdf4ff; border: 1px solid #f5d0fe; border-radius: 8px; padding: 10px 12px; text-align: left; margin-bottom: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <span style="font-size: 0.92rem; font-weight: 700; color: #86198f;"><i class="fa-solid fa-palette"></i> 간판 디자인 시안 (${draftCount}장)</span>
                                <button type="button" onclick="window.viewDraftModal('${app.id}')" style="padding: 4px 10px; font-size: 0.76rem; font-weight: 700; background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; border-radius: 6px; cursor: pointer;">시안 크게보기</button>
                            </div>
                            ${isApproved ? `
                                <div style="font-size: 0.82rem; color: #166534; font-weight: 700; background: #dcfce7; border: 1px solid #86efac; border-radius: 6px; padding: 6px 10px; display: flex; align-items: center; gap: 4px;">
                                    <i class="fa-solid fa-circle-check"></i> ${approvedLabel}
                                </div>
                            ` : `
                                <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px; margin-top: 4px;">
                                    <span style="font-size: 0.76rem; color: #92400e; font-weight: 600;"><i class="fa-solid fa-clock"></i> 시안 검토 후 승인해주세요</span>
                                    <button type="button" onclick="window.approveDraftByOwner('${app.id}')" style="padding: 6px 12px; font-size: 0.8rem; font-weight: 700; background: #16a34a; color: white; border: none; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; box-shadow: 0 1px 2px rgba(22,163,74,0.3);">
                                        <i class="fa-solid fa-check"></i> 시안 승인 / 마음에 듭니다
                                    </button>
                                </div>
                            `}
                        </div>
                    `;
                })()}
            `;
            userAppsContainer.appendChild(card);
        });

        // Add upload photo listeners
        userAppsContainer.querySelectorAll('.btn-upload-mob-app-photo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                handleApplicationPhotoUploadMob(id);
            });
        });
    }

    // 3. 내 영업물건 현황 및 진행상황 (모바일 카드)
    // 3. 내 영업물건 현황 및 진행상황 (모바일 카드)
    // [엄격 규칙] 최고관리자 대시보드에서 '영업물건으로 변경' 버튼(isBizItem: true)이 체크된 물건만 표시
    function renderBizRegisteredItemsMob() {
        const bizListContainer = document.getElementById('biz-items-list-mobile');
        if (!bizListContainer) return;
        if (!activeUser || activeUser.role !== 'business') return;

        // DataStore로부터 단일 격리된 본인 영업물건 가져오기 (타인 물건 100% 차단)
        const bizList = window.DataStore ? window.DataStore.getBizItemsForUser(activeUser) : [];

        // Search filtering
        const searchInput = document.getElementById('search-biz-items-mob');
        const q = (searchInput ? searchInput.value.trim().toLowerCase() : '').slice(0, 30);

        let filtered = bizList;
        if (q) {
            filtered = bizList.filter(b => {
                const id = String(b.id || '').toLowerCase();
                const owner = String(b.ownerName || '').toLowerCase();
                const phone = String(b.ownerPhone || '').toLowerCase();
                const store = String(b.storeName || '').toLowerCase();
                const addr = String(b.storeAddress || '').toLowerCase();
                return id.includes(q) || owner.includes(q) || phone.includes(q) || store.includes(q) || addr.includes(q);
            });
        }

        const totalCount = filtered.length;
        const toggleBadge = document.getElementById('biz-items-mob-toggle-badge');
        if (toggleBadge) {
            toggleBadge.style.background = bizItemsMobExpanded ? 'rgba(217, 119, 6, 0.2)' : 'rgba(217, 119, 6, 0.12)';
            toggleBadge.style.color = '#d97706';
            toggleBadge.style.border = '1px solid rgba(217, 119, 6, 0.3)';
            toggleBadge.style.fontSize = '0.78rem';
            toggleBadge.style.padding = '3px 10px';
            toggleBadge.style.borderRadius = '9999px';
            toggleBadge.style.display = 'inline-flex';
            toggleBadge.style.alignItems = 'center';
            toggleBadge.style.gap = '4px';
            toggleBadge.style.cursor = 'pointer';
            if (bizItemsMobExpanded) {
                toggleBadge.innerHTML = '<i class="fa-solid fa-chevron-up"></i> 기본 3건만 접기';
            } else {
                toggleBadge.innerHTML = `<i class="fa-solid fa-chevron-down"></i> 전체 펼치기${totalCount > 3 ? ` (${totalCount}건)` : ''}`;
            }
        }

        if (filtered.length === 0) {
            const emptyMsg = q ? `검색어 [${escapeHtml(q)}] 에 일치하는 영업물건이 없습니다.` : '등록된 영업물건이 없습니다.<br><span style="font-size: 0.76rem; color: #94a3b8;">(최고관리자가 승인/영업물건으로 등록한 물건만 표시됩니다)</span>';
            bizListContainer.innerHTML = `<p class="text-muted" style="text-align:center; padding: 15px; font-size: 0.88rem; background: #f8fafc; border-radius: 8px; line-height: 1.5;">${emptyMsg}</p>`;
            return;
        }

        const sortedBiz = [...filtered].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());
        const displayBiz = bizItemsMobExpanded ? sortedBiz : sortedBiz.slice(0, 3);

        bizListContainer.innerHTML = '';
        displayBiz.forEach(item => {
            const receiptBadge = getReceiptStatusBadgeHtmlMob(item.receiptStatus);
            const progressBadge = getProgressStatusBadgeHtmlMob(item.progressStatus);

            const card = document.createElement('div');
            card.className = 'biz-card-mob';
            card.style.cssText = 'background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 14px; box-shadow: 0 2px 6px rgba(0,0,0,0.03);';
            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                    <h5 style="font-size: 1.31rem; font-weight: 700; color: var(--text-primary); margin: 0;">${escapeHtml(item.storeName || '-')}</h5>
                    <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap; justify-content: flex-end;">
                        ${receiptBadge}
                        ${progressBadge}
                    </div>
                </div>
                <p style="font-size: 1.03rem; color: var(--text-secondary); margin: 0 0 5px 0;">
                    <strong style="color: #475569;">신청일시:</strong> <span style="font-family: monospace; color: var(--text-primary); font-weight: 600;">${formatDateOnly(item.date)}</span>
                </p>
                <p style="font-size: 1.03rem; color: var(--text-secondary); margin: 0 0 5px 0;">
                    <strong style="color: #475569;">신청번호:</strong> <span style="font-family: monospace; font-weight: 600; color: var(--accent-secondary);">${escapeHtml(String(item.id))}</span>
                </p>
                <p style="font-size: 1.03rem; color: var(--text-secondary); margin: 0 0 5px 0;">
                    <strong style="color: #475569;">대표자:</strong> <span style="color: var(--text-primary); font-weight: 700;">${escapeHtml(item.ownerName || '-')}</span> <span style="color: var(--text-secondary); font-size: 0.98rem;">(${escapeHtml(item.ownerPhone || '-')})</span>
                </p>
                <p style="font-size: 1.03rem; color: var(--text-secondary); margin: 0 0 10px 0; line-height: 1.4;">
                    <strong style="color: #475569;">주소:</strong> ${escapeHtml(item.storeAddress || '-')}
                </p>
                <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
                    <span style="font-size: 0.9rem; font-weight: 700; color: #475569;"><i class="fa-solid fa-signal" style="color: #2563eb;"></i> 실시간 진행상황</span>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <span style="font-size: 0.84rem; color: #64748b;">접수:</span> ${receiptBadge}
                        <span style="font-size: 0.84rem; color: #64748b; margin-left: 4px;">진행:</span> ${progressBadge}
                    </div>
                </div>
            `;
            bizListContainer.appendChild(card);
        });
    }

    function renderBusinessDashboardMob() {
        if (!activeUser || activeUser.role !== 'business') return;
        if (window.DataStore && typeof window.DataStore.cleanGhostItems === 'function') {
            window.DataStore.cleanGhostItems();
        }

        renderUserApplicationsMob();
        renderBizRegisteredItemsMob();
    }

    // 모바일 영업자 대시보드 [전체 펼치기 / 기본 3건만 접기] 글로벌 핸들러
    window.toggleBizItemsMob = function () {
        bizItemsMobExpanded = !bizItemsMobExpanded;
        renderBizRegisteredItemsMob();
    };

    window.toggleUserAppsMob = function () {
        userAppsMobExpanded = !userAppsMobExpanded;
        renderUserApplicationsMob();
    };

    window.renderBusinessDashboardMob = renderBusinessDashboardMob;
    window.renderBizRegisteredItemsMob = renderBizRegisteredItemsMob;
    window.renderUserApplicationsMob = renderUserApplicationsMob;

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
                progressStatus: (targetApp.status === 'approved' || targetApp.status === '서류제출 & 접수예정') ? '승인 완료' : ((targetApp.status === 'rejected' || targetApp.status === '지원사업 탈락' || targetApp.status === '지원사업탈락') ? '반려됨' : ((targetApp.status === 'giveup' || targetApp.status === '지원사업 포기' || targetApp.status === '지원사업포기') ? '지원사업 포기' : '심사 대기')),
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
    let selectedPhotosMob = []; // Array of { name: string, dataUrl: string }

    // 로그아웃 시 clearBizUploadFormMob()가 설정한 flag를 체크하여 배열 즉시 비우기
    if (window._clearBizPhotosMob) {
        selectedPhotosMob = [];
        window._clearBizPhotosMob = false;
    }

    // clearBizUploadFormMob 함수가 배열도 비울 수 있도록 wrapper를 재정의
    window.clearBizUploadFormMob = () => {
        const form = document.getElementById('mobile-upload-form-mob');
        if (form) form.reset();

        const previews = document.getElementById('mob-photo-previews-mob');
        if (previews) previews.innerHTML = '';
        const counter = document.getElementById('mob-photo-count-mob');
        if (counter) counter.textContent = '선택된 사진: 0 / 20장';

        const photosInput = document.getElementById('mob-photos-input-mob');
        if (photosInput) photosInput.value = '';
        const cameraInput = document.getElementById('mob-camera-input-mob');
        if (cameraInput) cameraInput.value = '';

        // 클로저 스코프의 selectedPhotosMob 직접 초기화
        selectedPhotosMob = [];
    };

    // 고화질 모바일 사진을 안전하고 가볍게(최대 1200px, 80% 품질) DataURL로 압축하는 유틸리티
    const fileToCompressedDataUrl = (file, maxDimension = 1200, quality = 0.8) => {
        return new Promise((resolve) => {
            if (!file) {
                resolve('');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                const rawUrl = e.target.result;
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        let width = img.width;
                        let height = img.height;

                        if (width > maxDimension || height > maxDimension) {
                            if (width > height) {
                                height = Math.round(height * (maxDimension / width));
                                width = maxDimension;
                            } else {
                                width = Math.round(width * (maxDimension / height));
                                height = maxDimension;
                            }
                        }

                        canvas.width = width;
                        canvas.height = height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0, width, height);
                        const compressedUrl = canvas.toDataURL('image/jpeg', quality);
                        resolve(compressedUrl || rawUrl);
                    } catch (err) {
                        console.warn('[사진 압축 Fallback] 원본 DataURL 사용', err);
                        resolve(rawUrl);
                    }
                };
                img.onerror = () => resolve(rawUrl);
                img.src = rawUrl;
            };
            reader.onerror = () => resolve('');
            reader.readAsDataURL(file);
        });
    };

    const handleMobilePhotosSelectMob = async (files) => {
        if (!files || !files.length) return;

        if (selectedPhotosMob.length + files.length > 20) {
            alert('영업 물건 현장 사진은 최대 20장 까지만 업로드 할 수 있습니다.');
            return;
        }

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const dataUrl = await fileToCompressedDataUrl(file, 1200, 0.8);
            if (dataUrl) {
                selectedPhotosMob.push({
                    name: file.name || `현장사진_${selectedPhotosMob.length + 1}.jpg`,
                    dataUrl: dataUrl
                });
            }
        }
        renderMobilePhotoPreviewsMob();
    };

    if (mobFileZoneMob) {
        mobFileZoneMob.addEventListener('click', () => {
            window.currentPhotoTarget = 'biz';
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
        if (btnChoiceCamera) {
            btnChoiceCamera.addEventListener('click', () => {
                photoChoiceOverlay.classList.remove('active');
                if (window.currentPhotoTarget === 'apply') {
                    const storeCamera = document.getElementById('store-photo-camera');
                    if (storeCamera) storeCamera.click();
                    else if (mobCameraInputMob) mobCameraInputMob.click();
                } else if (mobCameraInputMob) {
                    mobCameraInputMob.click();
                }
            });
        }

        // Gallery option
        if (btnChoiceGallery) {
            btnChoiceGallery.addEventListener('click', () => {
                photoChoiceOverlay.classList.remove('active');
                if (window.currentPhotoTarget === 'apply') {
                    const storeGallery = document.getElementById('store-photo');
                    if (storeGallery) storeGallery.click();
                    else if (mobPhotosInputMob) mobPhotosInputMob.click();
                } else if (mobPhotosInputMob) {
                    mobPhotosInputMob.click();
                }
            });
        }
    }

    if (mobPhotosInputMob) {
        mobPhotosInputMob.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                await handleMobilePhotosSelectMob(files);
                mobPhotosInputMob.value = ''; // Reset value to trigger change on same file if needed
            }
        });
    }

    if (mobCameraInputMob) {
        mobCameraInputMob.addEventListener('change', async (e) => {
            if (e.target.files && e.target.files.length > 0) {
                const files = Array.from(e.target.files);
                await handleMobilePhotosSelectMob(files);
                mobCameraInputMob.value = ''; // Reset value to trigger change on next capture
            }
        });
    }

    function renderMobilePhotoPreviewsMob() {
        if (!mobPhotoPreviewsMob || !mobPhotoCountMob) return;
        mobPhotoPreviewsMob.innerHTML = '';

        selectedPhotosMob.forEach((photoItem, index) => {
            const wrapper = document.createElement('div');
            wrapper.className = 'mob-preview-wrapper';
            wrapper.style.position = 'relative';
            wrapper.style.display = 'inline-block';
            wrapper.style.margin = '4px';

            const img = document.createElement('img');
            img.src = sanitizeUrl(photoItem.dataUrl);
            img.style.width = '70px';
            img.style.height = '70px';
            img.style.objectFit = 'cover';
            img.style.borderRadius = '8px';
            img.style.display = 'block';
            img.style.border = '1px solid #cbd5e1';

            const delBtn = document.createElement('button');
            delBtn.className = 'mob-preview-del';
            delBtn.innerHTML = '&times;';
            delBtn.style.position = 'absolute';
            delBtn.style.top = '-6px';
            delBtn.style.right = '-6px';
            delBtn.style.width = '22px';
            delBtn.style.height = '22px';
            delBtn.style.borderRadius = '50%';
            delBtn.style.backgroundColor = '#ef4444';
            delBtn.style.color = '#ffffff';
            delBtn.style.border = 'none';
            delBtn.style.display = 'flex';
            delBtn.style.alignItems = 'center';
            delBtn.style.justifyContent = 'center';
            delBtn.style.fontSize = '14px';
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
    const btnSubmitBizItemMob = document.getElementById('btn-submit-biz-item-mob');
    if (formBizUploadMob) {
        formBizUploadMob.addEventListener('submit', async (e) => {
            e.preventDefault();

            // activeUser 세션 체크
            activeUser = getActiveUser() || null;
            if (!activeUser) {
                alert('로그인이 필요합니다. 다시 로그인해 주세요.');
                return;
            }

            const nameVal = document.getElementById('mob-item-name-mob')?.value.trim();
            const phoneVal = document.getElementById('mob-item-phone-mob')?.value.trim() || '';
            const addressVal = document.getElementById('mob-item-address-mob')?.value.trim();

            if (!nameVal || !phoneVal || !addressVal) {
                alert('상호명, 전화번호, 설치 주소를 모두 입력해 주세요.');
                return;
            }

            // 사진 처리 완료 대기 중 체크
            if (btnSubmitBizItemMob) {
                if (btnSubmitBizItemMob.disabled) return; // 중복 제출 방지
                btnSubmitBizItemMob.disabled = true;
                btnSubmitBizItemMob.textContent = '등록 중...';
            }

            try {
                const base64PhotosList = selectedPhotosMob.map(p => p.dataUrl).filter(Boolean);
                const mainPhoto = base64PhotosList.length > 0 ? base64PhotosList[0] : '';
                const firstFileName = selectedPhotosMob.length > 0 ? selectedPhotosMob[0].name : '현장촬영사진.jpg';

                let apps = JSON.parse(localStorage.getItem('applications')) || [];
                const itemId = typeof generateBizItemId === 'function'
                    ? generateBizItemId(activeUser.bizCode, apps)
                    : `${activeUser.bizCode || 'B-260801'}-${String(apps.length + 1).padStart(4, '0')}`;

                // 1. 최고관리자 [신청서 목록(applications)]에 등록 (사진 데이터 포함)
                const newApp = {
                    id: itemId,
                    userId: activeUser.id,
                    ownerName: nameVal,
                    ownerPhone: phoneVal,
                    storeName: nameVal,
                    shopName: nameVal,
                    storeAddress: addressVal,
                    signType: '현장 카메라 접수',
                    fileName: firstFileName,
                    fileData: mainPhoto,
                    photos: base64PhotosList,
                    photosCount: base64PhotosList.length,
                    appliedAt: new Date().toISOString(),
                    status: 'pending',
                    isBizItem: false,
                    referrerCode: activeUser.bizCode || ''
                };

                if (!apps.some(a => a.id === itemId)) {
                    apps.unshift(newApp);
                } else {
                    apps = apps.map(a => a.id === itemId ? newApp : a);
                }

                // localStorage 저장 (QuotaExceededError 안전 처리)
                try {
                    localStorage.setItem('applications', JSON.stringify(apps));
                } catch (quotaErr) {
                    // 사진이 너무 많아 용량 초과 시 사진 없이 메타데이터만 저장
                    console.warn('[저장 용량 초과] 사진 데이터를 제외하고 기본 정보만 저장합니다.', quotaErr);
                    const appsLite = apps.map(a => a.id === itemId
                        ? { ...a, photos: [], fileData: '', photosCount: 0 }
                        : a
                    );
                    try {
                        localStorage.setItem('applications', JSON.stringify(appsLite));
                        alert('저장 공간이 부족하여 사진은 제외하고 기본 정보만 등록되었습니다.\n관리자에게 문의하거나 이전 데이터를 정리해 주세요.');
                    } catch (e2) {
                        alert('저장 공간이 부족합니다. 이전 데이터를 정리 후 다시 시도해 주세요.');
                        return;
                    }
                }

                // 2. 영업자 items에는 사진 메타데이터만 저장 (용량 절약)
                const newItem = {
                    id: itemId,
                    name: nameVal,
                    phone: phoneVal,
                    address: addressVal,
                    photos: base64PhotosList.slice(0, 3), // 미리보기용 최대 3장만
                    photosCount: base64PhotosList.length,
                    receiptStatus: '접수예정',
                    progressStatus: '지원대기중',
                    createdAt: new Date().toISOString()
                };

                if (!activeUser.items) activeUser.items = [];
                const existingIdx = activeUser.items.findIndex(it => it.id === itemId);
                if (existingIdx >= 0) {
                    activeUser.items[existingIdx] = newItem;
                } else {
                    activeUser.items.unshift(newItem);
                }

                users = users.map(u => u.id === activeUser.id ? { ...u, items: activeUser.items } : u);
                try {
                    localStorage.setItem('users', JSON.stringify(users));
                    localStorage.setItem('activeUser', JSON.stringify(activeUser));
                } catch (quotaErr2) {
                    // users 저장 실패 시 사진 없이 저장
                    const usersLite = users.map(u => {
                        if (u.id !== activeUser.id) return u;
                        const itemsLite = (u.items || []).map(it =>
                            it.id === itemId ? { ...it, photos: [], photosCount: base64PhotosList.length } : it
                        );
                        return { ...u, items: itemsLite };
                    });
                    try {
                        localStorage.setItem('users', JSON.stringify(usersLite));
                        localStorage.setItem('activeUser', JSON.stringify({ ...activeUser, items: usersLite.find(u => u.id === activeUser.id)?.items || [] }));
                    } catch (e3) {
                        console.warn('[users 저장 실패]', e3);
                    }
                }

                // 3. Supabase 클라우드 DB 실시간 양방향 동기화
                if (window.SupabaseSync) {
                    try {
                        window.SupabaseSync.upsertApplication(newApp);
                        if (typeof window.SupabaseSync.updateUser === 'function') {
                            window.SupabaseSync.updateUser(activeUser.id, { items: activeUser.items });
                        }
                    } catch (syncErr) {
                        console.warn('[Supabase 동기화 오류]', syncErr);
                    }
                }

                // 4. 카카오톡 관리자 실시간 알림 발송
                if (window.KakaoNotifier && typeof window.KakaoNotifier.notifyApplication === 'function') {
                    try { window.KakaoNotifier.notifyApplication(newApp); } catch (kakaoErr) { }
                }

                alert(`현장 간판 신청 물건 [${nameVal}] 등록이 완료되었습니다!\n신청번호: [${itemId}]\n(현장 사진이 최고관리자 대시보드 및 영업물건 현황에 즉시 자동 업로드되었습니다.)`);
                formBizUploadMob.reset();
                selectedPhotosMob = [];
                renderMobilePhotoPreviewsMob();
                renderBusinessDashboardMob();
                renderStatusTab();
                window.scrollTo(0, 0);
                document.documentElement.scrollTop = 0;
                document.body.scrollTop = 0;
                updateHeaderAuthButton();

            } catch (err) {
                console.error('[현장 물건 등록 오류]', err);
                alert(`등록 중 오류가 발생했습니다.\n오류 내용: ${err.message || err}\n\n잠시 후 다시 시도해 주세요.`);
            } finally {
                if (btnSubmitBizItemMob) {
                    btnSubmitBizItemMob.disabled = false;
                    btnSubmitBizItemMob.textContent = '현장 물건으로 등록';
                }
            }
        });
    }

    // Mobile Business Dashboard Search & Toggle Event Listeners
    window.toggleUserAppsMob = function () {
        userAppsMobExpanded = !userAppsMobExpanded;
        renderUserApplicationsMob();
    };

    window.toggleBizItemsMob = function () {
        bizItemsMobExpanded = !bizItemsMobExpanded;
        renderBizRegisteredItemsMob();
    };

    const searchUserAppsMobInput = document.getElementById('search-user-apps-mob');
    if (searchUserAppsMobInput) {
        searchUserAppsMobInput.addEventListener('input', () => {
            renderUserApplicationsMob();
        });
    }

    const toggleUserAppsMobHeader = document.getElementById('toggle-user-apps-mob-header');
    if (toggleUserAppsMobHeader) {
        toggleUserAppsMobHeader.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.toggleUserAppsMob === 'function') {
                window.toggleUserAppsMob();
            }
        });
    }

    const toggleBizItemsMobHeader = document.getElementById('toggle-biz-items-mob-header');
    if (toggleBizItemsMobHeader) {
        toggleBizItemsMobHeader.addEventListener('click', (e) => {
            e.preventDefault();
            if (typeof window.toggleBizItemsMob === 'function') {
                window.toggleBizItemsMob();
            }
        });
    }

    const searchBizItemsMobInput = document.getElementById('search-biz-items-mob');
    if (searchBizItemsMobInput) {
        searchBizItemsMobInput.addEventListener('input', () => {
            renderBizRegisteredItemsMob();
        });
    }

    const btnExportBizItemsMob = document.getElementById('btn-export-biz-items-mob');
    if (btnExportBizItemsMob) {
        btnExportBizItemsMob.addEventListener('click', (e) => {
            e.stopPropagation();
            exportBizRegisteredItemsMobToExcel();
        });
    }

    // 모바일 영업자 전용: 내 영업물건 목록 엑셀(CSV) 다운로드
    function exportBizRegisteredItemsMobToExcel() {
        if (!activeUser || (activeUser.role !== 'business' && activeUser.role !== 'admin')) {
            alert('영업 관리자만 데이터를 다운로드할 수 있습니다.');
            return;
        }

        let apps = JSON.parse(localStorage.getItem('applications')) || [];
        let myItems = activeUser.items || [];
        let bizList = [];

        apps.forEach(app => {
            if (app.isBizItem !== true) return; // 관리자 미체크 건은 엑셀 목록에서도 제외

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
    }

    // --- Admin Dashboard ---
    let adminActiveTab = 'requests';
    window.switchAdminTab = function (tabName) {
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
    window.isInteractingWithForm = false;
    window.addEventListener('supabase-data-synced', (e) => {
        users = JSON.parse(localStorage.getItem('users')) || [];
        applications = JSON.parse(localStorage.getItem('applications')) || [];
        activeUser = getActiveUser() || null;
        updateDrawerProfile();
        updateHeaderAuthButton();

        // 사용자가 드롭다운(SELECT)이나 텍스트입력(INPUT)을 조작 중일 때는 전체 DOM 재생성을 스킵하여 깜빡임/닫힘 완벽 방지
        const activeEl = document.activeElement;
        const isFormActive = window.isInteractingWithForm || (activeEl && (activeEl.tagName === 'SELECT' || activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA'));
        if (isFormActive) {
            return;
        }

        renderStatusTab();

        // 역할별 모바일 대시보드 화면 실시간 즉시 갱신
        if (activeUser && activeUser.role === 'admin') {
            renderAdminDashboardMob(true);
        } else if (activeUser && activeUser.role === 'business') {
            if (typeof renderBusinessDashboardMob === 'function') renderBusinessDashboardMob();
            if (typeof renderUserApplicationsMob === 'function') renderUserApplicationsMob();
            if (typeof renderBizRegisteredItemsMob === 'function') renderBizRegisteredItemsMob();
        } else if (activeUser && activeUser.role === 'constructor') {
            if (typeof renderConstructorDashboardMob === 'function') renderConstructorDashboardMob(true);
        }
    });

    // 다른 탭/창에서 데이터 변경 시 모바일 화면 0초 즉각 갱신
    window.addEventListener('storage', (e) => {
        if (e.key === 'applications' || e.key === 'users' || e.key === 'inquiries') {
            users = JSON.parse(localStorage.getItem('users')) || [];
            applications = JSON.parse(localStorage.getItem('applications')) || [];
            if (activeUser && activeUser.role === 'admin') {
                renderAdminDashboardMob(true);
            }
        }
    });

    async function syncAdminDataFromSupabaseMob() {
        if (window.SupabaseSync) {
            await window.SupabaseSync.syncAllData();
            // 사용자가 드롭다운(SELECT)이나 텍스트입력(INPUT) 조작 중일 때는 DOM 재생성으로 인한 닫힘 방지
            const activeEl = document.activeElement;
            const isFormActive = window.isInteractingWithForm || (activeEl && (activeEl.tagName === 'SELECT' || activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA'));
            if (isFormActive) {
                return;
            }
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

    // 모바일 신청서 목록 검색창 이벤트 (아이디 / 이름 / 코드 / 상호명)
    const searchAppsInputMob = document.getElementById('search-apps-input-mob');
    if (searchAppsInputMob) {
        searchAppsInputMob.addEventListener('input', () => {
            renderAdminDashboardMob(true);
        });
    }

    // 모바일 영업물건 진행상황 검색창 이벤트 (아이디 / 이름 / 코드 / 상호명)
    const searchItemsInputMob = document.getElementById('search-items-input-mob');
    if (searchItemsInputMob) {
        searchItemsInputMob.addEventListener('input', () => {
            renderAdminDashboardMob(true);
        });
    }

    // 모바일 관리자 시공업체 진행현황 검색창 이벤트 (시공사 / 상호명 / 주소 / 코드)
    const searchAdminConstInputMob = document.getElementById('search-admin-const-input-mob');
    if (searchAdminConstInputMob) {
        searchAdminConstInputMob.addEventListener('input', () => {
            renderAdminDashboardMob(true);
        });
    }

    // 모바일 시공업체 내 배정 물건 검색창 이벤트 (상호명 / 주소 / 간판종류)
    const searchConstructorJobsInputMob = document.getElementById('search-constructor-jobs-input-mob');
    if (searchConstructorJobsInputMob) {
        searchConstructorJobsInputMob.addEventListener('input', () => {
            renderConstructorDashboardMob();
        });
    }

    async function renderAdminDashboardMob(skipSync = false) {
        const totalStat = document.getElementById('admin-stat-total-mob');
        const visitorsStat = document.getElementById('admin-stat-visitors-mob');
        const totalVisitorsStat = document.getElementById('admin-stat-total-visitors-mob');

        // Reload global variables to ensure data sync
        applications = JSON.parse(localStorage.getItem('applications')) || [];
        users = JSON.parse(localStorage.getItem('users')) || [];

        const todayStr = new Date().toISOString().split('T')[0];
        const lastDate = localStorage.getItem('visitor_last_date');
        let todayCount = parseInt(localStorage.getItem('visitor_today') || '0', 10);
        let totalCount = parseInt(localStorage.getItem('visitor_total') || '0', 10);

        if (lastDate !== todayStr) {
            todayCount = 0;
            localStorage.setItem('visitor_today', '0');
            localStorage.setItem('visitor_last_date', todayStr);
        }

        if (totalStat) totalStat.textContent = `${applications.length}건`;
        if (visitorsStat) visitorsStat.textContent = `${todayCount}명`;
        if (totalVisitorsStat) totalVisitorsStat.textContent = `${totalCount}명`;

        // 신규 통계 집계 (시공업체 진행현황 실존 목록 기반 SSOT)
        const allUsers = JSON.parse(localStorage.getItem('users')) || [];
        const constJobs = (window.DataStore && typeof window.DataStore.getConstructionJobs === 'function')
            ? window.DataStore.getConstructionJobs()
            : [];

        const approvedCount = constJobs.length; // 총 대상자 선정 건수 = 시공업체 진행현황 목록에 실존하는 건수
        const inConstCount = constJobs.filter(j =>
            j.constructionStatus === 'in_construction' || j.constructionStatus === 'after_construction' || j.progressStatus === '간판시공 준비중'
        ).length;
        const completedCount = constJobs.filter(j =>
            j.constructionStatus === 'completed' || j.progressStatus === '간판시공완료'
        ).length;
        const bizMembers = allUsers.filter(u => u.role === 'business').length;
        const constMembers = allUsers.filter(u => u.role === 'constructor').length;

        // 파이프라인 집계 (시공 진행현황 실존 건 기준)
        const pipeBefore = constJobs.filter(j =>
            (!j.constructionStatus || j.constructionStatus === 'before_construction' || j.progressStatus === '대상자선정') &&
            j.constructionStatus !== 'in_construction' && j.constructionStatus !== 'after_construction' && j.constructionStatus !== 'completed' &&
            j.progressStatus !== '간판시공 준비중' && j.progressStatus !== '간판시공완료'
        ).length;
        const pipeIn = constJobs.filter(j => j.constructionStatus === 'in_construction' || j.progressStatus === '간판시공 준비중').length;
        const pipeAfter = constJobs.filter(j => j.constructionStatus === 'after_construction').length;
        const pipeCompleted = constJobs.filter(j => j.constructionStatus === 'completed' || j.progressStatus === '간판시공완료').length;

        // 신규 stat 카드 업데이트
        const approvedStat = document.getElementById('admin-stat-approved-mob');
        const inConstStat = document.getElementById('admin-stat-in-const-mob');
        const completedStat = document.getElementById('admin-stat-completed-mob');
        const membersStat = document.getElementById('admin-stat-members-mob');
        const bizStat = document.getElementById('admin-stat-biz-mob');
        const constStat = document.getElementById('admin-stat-const-mob');
        if (approvedStat) approvedStat.textContent = `${approvedCount}건`;
        if (inConstStat) inConstStat.textContent = `${inConstCount}건`;
        if (completedStat) completedStat.textContent = `${completedCount}건`;
        if (membersStat) membersStat.textContent = `${allUsers.length}명`;
        if (bizStat) bizStat.textContent = `${bizMembers}명`;
        if (constStat) constStat.textContent = `${constMembers}개`;

        // 파이프라인 바 업데이트
        const pBeforeEl = document.getElementById('mob-pipe-before');
        const pInEl = document.getElementById('mob-pipe-in');
        const pAfterEl = document.getElementById('mob-pipe-after');
        const pCompletedEl = document.getElementById('mob-pipe-completed');
        if (pBeforeEl) pBeforeEl.textContent = pipeBefore;
        if (pInEl) pInEl.textContent = pipeIn;
        if (pAfterEl) pAfterEl.textContent = pipeAfter;
        if (pCompletedEl) pCompletedEl.textContent = pipeCompleted;


        // Supabase에서 최신 방문자 통계 동기화 (가능한 경우)
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
                        if (visitorsStat) visitorsStat.textContent = `${todayCount}명`;
                    }
                    if (data.total_count > totalCount) {
                        totalCount = data.total_count;
                        localStorage.setItem('visitor_total', totalCount.toString());
                        if (totalVisitorsStat) totalVisitorsStat.textContent = `${totalCount}명`;
                    }
                }
            } catch (e) {
                // Fallback to localStorage
            }
        }

        if (!skipSync) {
            syncAdminDataFromSupabaseMob();
        }

        // 0) Render All Users list (회원정보관리)
        const allUsersListMob = document.getElementById('admin-all-users-list-mob');
        if (allUsersListMob) {
            let curUsers = window.DataStore ? window.DataStore.getUsers() : (JSON.parse(localStorage.getItem('users')) || []);
            const deletedIds = JSON.parse(localStorage.getItem('deleted_user_ids')) || [];
            curUsers = curUsers.filter(u => {
                if (!u || !u.id) return false;
                const uId = String(u.id);
                const uDigits = uId.replace(/[^0-9]/g, '');
                const uPhoneDigits = String(u.phone || '').replace(/[^0-9]/g, '');
                return !deletedIds.includes(uId) && (!uDigits || !deletedIds.includes(uDigits)) && (!uPhoneDigits || !deletedIds.includes(uPhoneDigits));
            });
            curUsers = typeof sortUsersLatestFirst === 'function' ? sortUsersLatestFirst(curUsers) : curUsers;
            const searchInput = document.getElementById('search-all-users-input-mob');
            const q = searchInput && searchInput.value ? searchInput.value.trim().slice(0, 30).toLowerCase() : '';

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
                        const targetBtn = e.target.closest('button');
                        const uid = targetBtn ? targetBtn.dataset.uid : null;
                        if (!uid) return;
                        if (window.deleteUserAdminMob) {
                            window.deleteUserAdminMob(uid, targetBtn);
                        } else if (window.DataStore) {
                            window.DataStore.deleteUser(uid, targetBtn);
                        }
                        if (typeof renderAdminDashboardMob === 'function') {
                            renderAdminDashboardMob(true);
                        }
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

        // 3) Render Applications list (신청서목록)
        const appsList = document.getElementById('admin-apps-list-mob');
        if (appsList) {
            const searchAppsInput = document.getElementById('search-apps-input-mob');
            const qApps = searchAppsInput && searchAppsInput.value ? searchAppsInput.value.trim().slice(0, 30).toLowerCase() : '';

            // Sort applications by applied date descending (latest first)
            let sortedApps = [...applications].sort((a, b) => {
                const timeA = new Date(a.appliedAt || a.createdAt || a.created_at || 0).getTime();
                const timeB = new Date(b.appliedAt || b.createdAt || b.created_at || 0).getTime();
                if (timeB !== timeA && !isNaN(timeA) && !isNaN(timeB)) {
                    return timeB - timeA;
                }
                return String(b.id || '').localeCompare(String(a.id || ''), undefined, { numeric: true, sensitivity: 'base' });
            });

            if (qApps) {
                sortedApps = sortedApps.filter(app => {
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

                    return appId.includes(qApps) ||
                        ownerName.includes(qApps) ||
                        userId.includes(qApps) ||
                        rawPhone.includes(qApps) ||
                        cleanPhone.includes(qApps.replace(/[^0-9]/g, '')) ||
                        storeName.includes(qApps) ||
                        storeAddr.includes(qApps) ||
                        refCode.includes(qApps) ||
                        signType.includes(qApps) ||
                        constName.includes(qApps);
                });
            }

            if (sortedApps.length === 0) {
                const emptyMsg = qApps ? `검색어 [${escapeHtml(qApps)}] 에 일치하는 신청서가 없습니다.` : '접수된 온라인 신청서가 없습니다.';
                appsList.innerHTML = `<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.95rem;">${emptyMsg}</p>`;
            } else {
                appsList.innerHTML = '';
                sortedApps.forEach(app => {
                    const card = document.createElement('div');
                    card.className = 'admin-app-card-mob';
                    card.style.background = '#ffffff';
                    card.style.padding = '14px';
                    card.style.borderRadius = '10px';
                    card.style.border = '1px solid var(--border-color)';
                    card.style.marginBottom = '12px';

                    // Status mapping
                    const isApproved = (app.status === 'approved' || app.status === '서류제출 & 접수예정');
                    const isRejected = (app.status === 'rejected' || app.status === '지원사업 탈락' || app.status === '지원사업탈락');
                    const isGiveup = (app.status === 'giveup' || app.status === '지원사업 포기' || app.status === '지원사업포기');
                    const isPending = !isApproved && !isRejected && !isGiveup;

                    let statusBadge = '<span class="badge-status pending" style="font-size: 0.85rem; padding: 3px 8px;">심사 대기</span>';
                    if (isApproved) statusBadge = '<span class="badge-status approved" style="font-size: 0.85rem; padding: 3px 8px; background: #dcfce7; color: #166534; font-weight: 700;">서류제출 & 접수예정</span>';
                    else if (isRejected) statusBadge = '<span class="badge-status rejected" style="font-size: 0.85rem; padding: 3px 8px; background: #fee2e2; color: #991b1b; font-weight: 700;">지원사업 탈락</span>';
                    else if (isGiveup) statusBadge = '<span class="badge-status giveup" style="font-size: 0.85rem; padding: 3px 8px; background: #fffbeb; color: #b45309; font-weight: 700;">지원사업 포기</span>';

                    // Status select styling for mobile
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

                    let actionsHtml = `
                        <div class="admin-action-row-mob" style="display:flex; gap: 6px; justify-content: flex-end; align-items: center; flex-wrap: wrap; margin-top: 12px;">
                            <div style="position: relative; display: inline-flex; align-items: center;">
                                <select class="status-select-mob select-app-status-mob" data-id="${app.id}" onfocus="window.isInteractingWithForm = true;" onblur="setTimeout(() => { window.isInteractingWithForm = false; }, 1000);" onclick="event.stopPropagation(); window.isInteractingWithForm = true;" ontouchstart="event.stopPropagation(); window.isInteractingWithForm = true;" onchange="window.isInteractingWithForm = false; window.updateApplicationStatusMob && window.updateApplicationStatusMob('${app.id}', this.value);" style="padding: 6px 28px 6px 10px; font-size: 0.88rem; font-weight: 700; border-radius: 6px; border: 1.5px solid ${statusBorder}; color: ${statusColor}; background: url('data:image/svg+xml;utf8,<svg fill=&quot;%2364748b&quot; height=&quot;18&quot; viewBox=&quot;0 0 24 24&quot; width=&quot;18&quot; xmlns=&quot;http://www.w3.org/2000/svg&quot;><path d=&quot;M7 10l5 5 5-5z&quot;/></svg>') no-repeat right 6px center / 16px 16px ${statusBg}; appearance: none; -webkit-appearance: none; cursor: pointer; height: 36px; line-height: 1.2; position: relative; z-index: 10; touch-action: manipulation; -webkit-tap-highlight-color: transparent;">
                                    <option value="pending" ${isPending ? 'selected' : ''}>⏳ 심사 대기</option>
                                    <option value="approved" ${isApproved ? 'selected' : ''}>✅ 서류제출 & 접수예정</option>
                                    <option value="rejected" ${isRejected ? 'selected' : ''}>❌ 지원사업 탈락</option>
                                    <option value="giveup" ${isGiveup ? 'selected' : ''}>🚫 지원사업 포기</option>
                                </select>
                            </div>
                            <button type="button" class="btn btn-sm btn-toggle-bizitem-mob" data-id="${app.id}" onclick="window.toggleBizItemMob('${app.id}', this); return false;" style="padding: 6px 12px; font-size: 0.85rem; border-radius: 6px; font-weight: 700; height: 36px; ${(app.isBizItem === true || String(app.isBizItem) === 'true') ? 'background: #0284c7; color: white; border: none;' : 'background: #f8fafc; color: #475569; border: 1px solid #cbd5e1;'}">
                                <i class="fa-solid ${(app.isBizItem === true || String(app.isBizItem) === 'true') ? 'fa-toggle-on' : 'fa-toggle-off'}"></i> ${(app.isBizItem === true || String(app.isBizItem) === 'true') ? '영업물건 등록됨' : '영업물건으로 변경'}
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm btn-delete-app-mob" data-id="${app.id}" onclick="window.deleteApplicationAdminMob('${app.id}', this)" style="padding: 6px 10px; font-size: 0.85rem; border: 1px solid #fecaca; color: #dc2626; background: #fee2e2; border-radius: 6px; height: 36px;"><i class="fa-solid fa-trash-can"></i> 삭제</button>
                        </div>
                    `;

                    // 현장사진 UI (PC 대시보드와 동일한 상하/좌우 2단 버튼 구조)
                    let fileAttachmentHtml = '';
                    const photosArr = (Array.isArray(app.photos) && app.photos.length > 0) ? app.photos.filter(p => p && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:'))) : [];
                    const photoSrc = (photosArr.length > 0) ? photosArr[0] : (app.fileData || (app.image_url && (app.image_url.startsWith('data:') || app.image_url.startsWith('[') || app.image_url.startsWith('http') || app.image_url.startsWith('blob:')) ? app.image_url : ''));
                    const hasPhoto = Boolean((photosArr.length > 0) || (photoSrc && photoSrc !== '업로드 파일 없음' && (photoSrc.startsWith('data:') || photoSrc.startsWith('[') || photoSrc.startsWith('http') || photoSrc.startsWith('blob:'))));
                    const count = photosArr.length > 0 ? photosArr.length : (hasPhoto ? 1 : 0);

                    fileAttachmentHtml = `
                        <div style="margin-top: 10px; padding: 10px 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <div style="font-size: 0.88rem; font-weight: 700; color: #334155; display: flex; align-items: center; gap: 6px;">
                                <i class="fa-solid fa-camera" style="color: var(--accent-primary);"></i> 현장사진: 
                                <span style="font-weight: 700; font-size: 0.82rem; color: ${hasPhoto ? '#16a34a' : '#94a3b8'};">${hasPhoto ? `등록됨 (${count}장)` : '미등록'}</span>
                            </div>
                            <div style="display: flex; gap: 6px; align-items: center;">
                                <button type="button" class="btn btn-sm btn-upload-app-photo-mob" data-id="${app.id}" style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 5px 12px; font-size: 0.82rem; font-weight: 700; color: #16a34a; background: #ffffff; border: 1.5px solid #22c55e; border-radius: 6px; cursor: pointer; height: 32px; box-sizing: border-box;" title="${hasPhoto ? '현장사진 변경/재등록' : '현장사진 등록'}">
                                    <i class="fa-solid fa-camera" style="font-size: 0.8rem;"></i> 사진 등록
                                </button>
                                ${hasPhoto ? `
                                    <button type="button" onclick="window.downloadApplicationPhotos('${app.id}'); return false;" style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 5px 12px; font-size: 0.82rem; font-weight: 700; color: #1e40af; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; cursor: pointer; height: 32px; box-sizing: border-box;" title="${count > 1 ? `현장사진 ${count}장 ZIP 압축 다운로드` : '현장사진 다운로드'}">
                                        <i class="fa-solid ${count > 1 ? 'fa-file-zipper' : 'fa-download'}" style="font-size: 0.76rem; color: #2563eb;"></i> ${count > 1 ? `다운 (${count}장)` : '다운로드'}
                                    </button>
                                ` : `
                                    <button type="button" disabled style="display: inline-flex; align-items: center; justify-content: center; gap: 4px; padding: 5px 12px; font-size: 0.82rem; font-weight: 500; color: #94a3b8; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; cursor: not-allowed; height: 32px; box-sizing: border-box;" title="등록된 사진 없음">
                                        <i class="fa-solid fa-download" style="font-size: 0.76rem;"></i> 다운로드
                                    </button>
                                `}
                            </div>
                        </div>
                    `;

                    // 영업자 이름 매칭 (예: 담당자 : 김만석)
                    let bizUserName = '';
                    const curUsersList = JSON.parse(localStorage.getItem('users')) || users || [];
                    if (app.referrerCode) {
                        const matchedUser = curUsersList.find(u => u.bizCode === app.referrerCode || u.id === app.referrerCode);
                        if (matchedUser && matchedUser.name) {
                            bizUserName = matchedUser.name;
                        }
                    }
                    if (!bizUserName && app.userId) {
                        const matchedUser = curUsersList.find(u => u.id === app.userId && (u.role === 'business' || u.bizCode));
                        if (matchedUser && matchedUser.name) {
                            bizUserName = matchedUser.name;
                        }
                    }
                    const rawAppDate = app.appliedAt || app.createdAt || '';
                    let appDateText = '-';
                    if (rawAppDate) {
                        const d = new Date(rawAppDate);
                        if (!isNaN(d.getTime())) {
                            const padZero = (n) => String(n).padStart(2, '0');
                            appDateText = `${d.getFullYear()}-${padZero(d.getMonth() + 1)}-${padZero(d.getDate())}`;
                        } else {
                            appDateText = String(rawAppDate).slice(0, 10).replace(/\./g, '-');
                        }
                    }

                    card.innerHTML = `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
                            <strong style="font-size: 1.1rem; color: var(--text-primary);">${escapeHtml(app.shopName || app.storeName)}</strong>
                            ${statusBadge}
                        </div>
                        <div style="font-size: 0.92rem; color: var(--text-secondary); line-height: 1.5; text-align: left;">
                            <div style="margin-bottom: 2px;"><i class="fa-solid fa-calendar-days" style="color: #64748b; width: 14px;"></i> 신청일: <strong style="color: #1e293b; font-family: monospace;">${appDateText}</strong></div>
                            <div>신청번호: <span style="font-family: monospace; font-weight: 600; color: #475569;">${app.id}</span></div>
                            <div>대표자: <strong style="color: var(--text-primary);">${app.ownerName}</strong> (${app.ownerPhone})</div>
                            <div>주소: <span style="color: #475569;">${app.storeAddress}</span></div>
                            ${bizUserName ? `<div style="color: var(--accent-primary); font-weight: 700; margin-top: 6px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px; padding-top: 4px; border-top: 1px dashed #e2e8f0;">
                                <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-user-tie" style="color: var(--accent-secondary);"></i> 담당자 : ${escapeHtml(bizUserName)}</span>
                                <button type="button" onclick="window.openAssignBizUserModal('${app.id}'); return false;" style="padding: 4px 10px; font-size: 0.78rem; font-weight: 700; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-user-pen"></i> 영업자 수정/변경</button>
                            </div>` : `<div style="color: #64748b; font-weight: 600; margin-top: 6px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 4px; padding-top: 4px; border-top: 1px dashed #e2e8f0;">
                                <span style="display: flex; align-items: center; gap: 4px;"><i class="fa-solid fa-building" style="color: #94a3b8;"></i> 담당자 : 본사직접접수</span>
                                <button type="button" onclick="window.openAssignBizUserModal('${app.id}'); return false;" style="padding: 4px 10px; font-size: 0.78rem; font-weight: 700; color: #2563eb; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;"><i class="fa-solid fa-user-pen"></i> 영업자 수정/변경</button>
                            </div>`}
                        </div>
                        ${fileAttachmentHtml}
                        ${actionsHtml}
                    `;
                    appsList.appendChild(card);
                });

                appsList.querySelectorAll('.btn-upload-app-photo-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.closest('button').dataset.id;
                        handleApplicationPhotoUploadMob(id);
                    });
                });
                // Action buttons are handled directly by inline onclick/onchange for instant single response
                appsList.querySelectorAll('.btn-approve-settlement-mob').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const id = e.target.closest('button').dataset.id;
                        approveSettlementMob(id);
                    });
                });
            }
        }

        // 4) Render Items list (영업물건 진행상황)
        const itemsList = document.getElementById('admin-items-list-mob');
        if (itemsList) {
            itemsList.innerHTML = '';
            const searchItemsInput = document.getElementById('search-items-input-mob');
            const qItems = searchItemsInput && searchItemsInput.value ? searchItemsInput.value.trim().slice(0, 30).toLowerCase() : '';

            // DataStore로부터 영업물건으로 등록된 정제 목록 단일 조회 (비활성화 건 100% 완전 제외!)
            const allBusinessItemsMob = window.DataStore ? window.DataStore.getAdminBizItems() : [];

            let filteredItemsMob = allBusinessItemsMob;
            if (qItems) {
                filteredItemsMob = allBusinessItemsMob.filter(({ user: u, item }) => {
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

                    return uId.includes(qItems) ||
                        uName.includes(qItems) ||
                        uBizCode.includes(qItems) ||
                        itemId.includes(qItems) ||
                        appRefId.includes(qItems) ||
                        itemName.includes(qItems) ||
                        rawPhone.includes(qItems) ||
                        cleanPhone.includes(qItems.replace(/[^0-9]/g, '')) ||
                        itemAddr.includes(qItems) ||
                        constName.includes(qItems) ||
                        constId.includes(qItems);
                });
            }

            if (filteredItemsMob.length === 0) {
                const emptyMsg = qItems ? `검색어 [${escapeHtml(qItems)}] 에 일치하는 영업물건이 없습니다.` : '등록된 영업물건이 없습니다.';
                itemsList.innerHTML = `<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.92rem;">${emptyMsg}</p>`;
            } else {
                filteredItemsMob.forEach(({ user: u, item }) => {
                    const card = document.createElement('div');
                    card.className = 'admin-req-card-mob';
                    card.style.background = '#f8fafc';
                    card.style.padding = '14px';
                    card.style.borderRadius = '10px';
                    card.style.border = '1px solid var(--border-color)';
                    card.style.marginBottom = '12px';
                    card.style.textAlign = 'left';

                    const isSelectedOrBeyond = (item.progressStatus === '대상자선정' || item.progressStatus === '간판시공 준비중' || item.progressStatus === '간판시공완료' || item.progressStatus === '서류 심사 통과' || item.progressStatus === '현장 실사 중' || item.progressStatus === '지원금 최종 승인' || item.progressStatus === '간판 시공 중' || item.progressStatus === '시공 완료');

                    let constructorAssignHtml = '';
                    if (isSelectedOrBeyond) {
                        if (item.assignedConstructorId) {
                            constructorAssignHtml = `
                                <div style="display: flex; justify-content: space-between; align-items: center; background: #f0fdf4; padding: 8px 10px; border-radius: 6px; border: 1px solid #bbf7d0; margin-top: 4px;">
                                    <span style="font-size: 0.88rem; font-weight: 700; color: #15803d; display: inline-flex; align-items: center; gap: 6px;">
                                        <i class="fa-solid fa-screwdriver-wrench"></i> 배정: ${escapeHtml(item.assignedConstructorName || item.assignedConstructorId)}
                                    </span>
                                    <button type="button" class="btn btn-secondary btn-sm" onclick="window.reassignConstructorItemMob('${u.id}', '${item.id}')" style="padding: 4px 8px; font-size: 0.78rem; border-radius: 4px; border: 1px solid #cbd5e1; background: #fff; color: #64748b; cursor: pointer;">변경</button>
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
                                <div style="display: flex; gap: 8px; margin-top: 4px; align-items: center;">
                                    <select class="status-select-mob select-constructor-bizitem-mob" data-uid="${u.id}" data-itemid="${item.id}" style="flex: 1; padding: 6px 8px; font-size: 0.9rem; border-radius: 6px; border: 1.5px solid #86efac; background: white; font-weight: 600; color: #1e293b; height: auto;">
                                        ${constOptions}
                                    </select>
                                    <button type="button" class="btn btn-primary btn-sm" onclick="window.assignConstructorToBizItemMob('${u.id}', '${item.id}', this)" style="padding: 6px 14px; font-size: 0.85rem; background: var(--accent-success); border: none; color: white; border-radius: 6px; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;">
                                        <i class="fa-solid fa-link"></i> 배정
                                    </button>
                                </div>
                            `;
                        }
                    }

                    const appsMob = JSON.parse(localStorage.getItem('applications')) || [];
                    const matchingApp = appsMob.find(a => String(a.id) === String(item.id) || (item.appRefId && String(a.id) === String(item.appRefId)));
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
                        <div style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 3px;"><i class="fa-solid fa-calendar-days" style="color: #64748b;"></i> 신청일: <strong style="color: #1e293b; font-family: monospace;">${itemDateText}</strong></div>
                        <div style="font-size: 0.88rem; color: var(--text-secondary); line-height: 1.4; margin-top: 2px;"><i class="fa-solid fa-location-dot" style="color: var(--accent-primary);"></i> 주소: <span style="color: #475569;">${escapeHtml(item.address)}</span></div>
                        ${item.phone ? `<div style="font-size: 0.88rem; color: var(--text-secondary); margin-top: 2px;"><i class="fa-solid fa-phone" style="color: #64748b;"></i> 연락처: <strong style="color: var(--accent-primary);">${escapeHtml(item.phone)}</strong></div>` : ''}
                        
                        <div style="margin-top: 10px; display: flex; flex-direction: column; gap: 8px; padding-top: 8px; border-top: 1px dashed #e2e8f0;">
                            <div style="display:flex; align-items:center; gap: 6px;">
                                <span style="font-size: 0.88rem; font-weight: 700; width: 50px; color: #475569;">접수:</span>
                                <select class="status-select-mob select-receipt-mob" data-uid="${u.id}" data-itemid="${item.id}" onchange="window.updateItemStatusMob('${u.id}', '${item.id}', 'receipt', this.value)" style="padding: 6px 8px; font-size: 0.9rem; border-radius: 6px; border: 1px solid var(--border-color); background: white; flex: 1; font-weight: 600;">
                                    <option value="업체신청" ${(String(item.receiptStatus || '').trim() === '업체신청') ? 'selected' : ''}>업체신청</option>
                                    <option value="접수예정" ${(String(item.receiptStatus || '').trim() === '접수예정' || String(item.receiptStatus || '').trim() === '접수 대기' || !item.receiptStatus) ? 'selected' : ''}>접수예정</option>
                                    <option value="접수완료" ${(String(item.receiptStatus || '').trim() === '접수완료' || String(item.receiptStatus || '').trim() === '접수 완료' || String(item.receiptStatus || '').includes('접수 완료')) ? 'selected' : ''}>접수완료</option>
                                </select>
                            </div>
                            <div style="display:flex; align-items:center; gap: 6px;">
                                <span style="font-size: 0.88rem; font-weight: 700; width: 50px; color: #475569;">진행:</span>
                                <select class="status-select-mob select-progress-mob" data-uid="${u.id}" data-itemid="${item.id}" onchange="window.updateItemStatusMob('${u.id}', '${item.id}', 'progress', this.value)" style="padding: 6px 8px; font-size: 0.9rem; border-radius: 6px; border: 1px solid var(--border-color); background: white; flex: 1; font-weight: 600;">
                                    <option value="지원대기중" ${(String(item.progressStatus || '').trim() === '지원대기중' || String(item.progressStatus || '').trim() === '심사 대기' || !item.progressStatus) ? 'selected' : ''}>지원대기중</option>
                                    <option value="심사대기" ${(String(item.progressStatus || '').trim() === '심사대기' || String(item.progressStatus || '').trim() === '서류 보완 필요') ? 'selected' : ''}>심사대기</option>
                                    <option value="대상자선정" ${(String(item.progressStatus || '').trim() === '대상자선정' || String(item.progressStatus || '').trim() === '서류 심사 통과' || String(item.progressStatus || '').trim() === '현장 실사 중' || String(item.progressStatus || '').trim() === '지원금 최종 승인') ? 'selected' : ''}>대상자선정</option>
                                    <option value="간판시공 준비중" ${(String(item.progressStatus || '').trim() === '간판시공 준비중' || String(item.progressStatus || '').trim() === '간판 시공 중') ? 'selected' : ''}>간판시공 준비중</option>
                                    <option value="간판시공완료" ${(String(item.progressStatus || '').trim() === '간판시공완료' || String(item.progressStatus || '').trim() === '시공 완료') ? 'selected' : ''}>간판시공완료</option>
                                </select>
                            </div>

                            ${constructorAssignHtml}
                        </div>
                    `;
                    itemsList.appendChild(card);
                });
            }
        }

        // 5) Render Inquiries list (3초 간편문의 접수건)
        const inquiriesList = document.getElementById('admin-inquiries-list-mob');
        if (inquiriesList) {
            const inquiries = (window.DataStore && typeof window.DataStore.getInquiries === 'function')
                ? window.DataStore.getInquiries()
                : (JSON.parse(localStorage.getItem('inquiries')) || []);
            inquiriesList.innerHTML = '';
            if (inquiries.length === 0) {
                inquiriesList.innerHTML = '<p class="text-muted" style="text-align:center; padding: 20px; font-size: 0.92rem;">접수된 3초 간편 문의 내역이 없습니다.</p>';
            } else {
                const sortedInquiries = [...inquiries].sort((a, b) => {
                    const timeA = new Date(a.submittedAt || a.created_at || a.createdAt || 0).getTime();
                    const timeB = new Date(b.submittedAt || b.created_at || b.createdAt || 0).getTime();
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

                    const isResolved = (inq.status === 'resolved' || inq.status === 'completed' || inq.status === '확인완료' || inq.status === '상담완료');
                    const statusBadge = isResolved
                        ? `<span style="background: #dcfce7; color: #166534; padding: 3px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.85rem;"><i class="fa-solid fa-circle-check"></i> 확인 완료</span>`
                        : `<span style="background: #fef3c7; color: #92400e; padding: 3px 10px; border-radius: 9999px; font-weight: 700; font-size: 0.85rem;"><i class="fa-solid fa-clock"></i> 확인 대기</span>`;

                    const typeLabel = typeMap[inq.type] || inq.type || '일반 문의';

                    const msgContent = inq.message || inq.content || inq.body || inq.region || '';
                    const displayMsg = msgContent.trim() ? escapeHtml(msgContent) : '<span style="color: #94a3b8; font-style: italic;">(등록된 세부 문의 내용이 없습니다)</span>';

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
                            ${displayMsg}
                        </div>
                        <div class="admin-action-row-mob" style="display:flex; gap: 8px; justify-content: flex-end; margin-top: 10px;">
                            <button type="button" class="btn btn-secondary btn-sm btn-toggle-inquiry-mob" onpointerdown="event.stopPropagation()" onclick="window.toggleInquiryStatusMob('${inq.id}', event); return false;" style="padding: 6px 12px; font-size: 0.82rem; border-radius: 6px; background: ${isResolved ? '#f1f5f9' : '#15803d'}; color: ${isResolved ? '#475569' : '#ffffff'}; border: 1px solid ${isResolved ? '#cbd5e1' : '#166534'}; font-weight: 600; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent;">
                                <i class="fa-solid ${isResolved ? 'fa-rotate-left' : 'fa-check'}" style="pointer-events: none;"></i> ${isResolved ? '대기로 변경' : '상담 완료'}
                            </button>
                            <button type="button" class="btn btn-secondary btn-sm btn-delete-inquiry-mob" onpointerdown="event.stopPropagation()" onclick="window.deleteInquiryAdminMob('${inq.id}', event); return false;" style="padding: 6px 12px; font-size: 0.82rem; border-radius: 6px; color: #dc2626; border-color: rgba(239,68,68,0.3); background: #fee2e2; font-weight: 600; cursor: pointer; touch-action: manipulation; -webkit-tap-highlight-color: transparent;">
                                <i class="fa-solid fa-trash-can" style="pointer-events: none;"></i> 삭제
                            </button>
                        </div>
                    `;
                    inquiriesList.appendChild(card);
                });
            }
        }

        // 5.5) Render Constructor Progress list (시공업체 진행현황 모바일 탭)
        const constProgressListMob = document.getElementById('admin-const-progress-list-mob');
        if (constProgressListMob) {
            constProgressListMob.innerHTML = '';
            const allConstJobs = (window.DataStore && typeof window.DataStore.getConstructionJobs === 'function')
                ? window.DataStore.getConstructionJobs()
                : [];

            // Search filtering (아이디 / 시공사 / 상호명 / 주소 / 코드 / 연락처)
            const searchAdminConstInputMob = document.getElementById('search-admin-const-input-mob');
            const qConst = (searchAdminConstInputMob ? searchAdminConstInputMob.value.trim().toLowerCase() : '').slice(0, 30);

            let filteredConstJobs = allConstJobs;
            if (qConst) {
                filteredConstJobs = allConstJobs.filter(job => {
                    const cName = String(job.assignedConstructorName || '').toLowerCase();
                    const cId = String(job.assignedConstructorId || '').toLowerCase();
                    const cCode = String(job.assignedConstructorCode || '').toLowerCase();
                    const sName = String(job.storeName || '').toLowerCase();
                    const sAddr = String(job.storeAddress || '').toLowerCase();
                    const oName = String(job.ownerName || '').toLowerCase();
                    const oPhone = String(job.ownerPhone || '').toLowerCase();
                    const sType = String(job.signType || '').toLowerCase();
                    const jId = String(job.id || '').toLowerCase();

                    return cName.includes(qConst) ||
                        cId.includes(qConst) ||
                        cCode.includes(qConst) ||
                        sName.includes(qConst) ||
                        sAddr.includes(qConst) ||
                        oName.includes(qConst) ||
                        oPhone.includes(qConst) ||
                        sType.includes(qConst) ||
                        jId.includes(qConst);
                });
            }

            if (filteredConstJobs.length === 0) {
                const emptyMsg = qConst ? `검색어 [${escapeHtml(qConst)}] 에 일치하는 시공 진행건이 없습니다.` : '배정된 시공업체 진행현황이 없습니다.';
                constProgressListMob.innerHTML = `<p class="text-muted" style="text-align:center; padding: 25px 0; font-size: 0.92rem;">${emptyMsg}</p>`;
            } else {
                filteredConstJobs.forEach(job => {
                    const card = document.createElement('div');
                    card.className = 'admin-req-card-mob';
                    card.style.background = '#ffffff';
                    card.style.padding = '14px';
                    card.style.borderRadius = '10px';
                    card.style.border = '1px solid #cbd5e1';
                    card.style.borderLeft = '4px solid #14b8a6';
                    card.style.marginBottom = '10px';
                    card.style.textAlign = 'left';

                    const st = job.constructionStatus || 'before_construction';
                    let statusLabel = '1. 시공 전';
                    let statusBg = '#f1f5f9';
                    let statusColor = '#475569';
                    if (st === 'design_draft') {
                        statusLabel = '2. 간판 디자인 시안/교정 중';
                        statusBg = '#fdf4ff';
                        statusColor = '#86198f';
                    } else if (st === 'in_construction') {
                        statusLabel = '3. 시공 진행 중';
                        statusBg = '#fef3c7';
                        statusColor = '#92400e';
                    } else if (st === 'after_construction') {
                        statusLabel = '4. 완료 보고됨';
                        statusBg = '#dcfce7';
                        statusColor = '#166534';
                    } else if (st === 'completed') {
                        statusLabel = '5. 정산 종결';
                        statusBg = '#dbeafe';
                        statusColor = '#1e40af';
                    }

                    // 간판 종류 설정 (플렉스, LED 채널, 돌출, 그외 기타)
                    const currentSignType = String(job.signType || '플렉스 간판').trim();
                    const standardSignTypes = ['플렉스 간판', 'LED 채널 간판', '돌출 간판'];
                    const isCustomSignType = !standardSignTypes.includes(currentSignType) && currentSignType !== '';
                    const selectedDropdownVal = isCustomSignType ? 'custom' : (currentSignType || '플렉스 간판');

                    // 간판 디자인 시안 확인
                    const draftPhotos = job.signDraftPhotos || [];
                    const draftCount = draftPhotos.length;
                    let draftStatusText = '시안 미등록';
                    if (job.draftStatus === 'owner_approved') draftStatusText = '점주 시안확정';
                    else if (job.draftStatus === 'admin_approved') draftStatusText = '관리자 직권확정';
                    else if (draftCount > 0) draftStatusText = '시안 검토중';

                    // 시공 후 사진 확인
                    const pCount = job.constructionPhotos ? job.constructionPhotos.length : 0;
                    let proofHtml = '';
                    if (pCount > 0) {
                        proofHtml = `
                            <button type="button" onclick="window.viewConstructionPhotosModal('${job.id}')" style="font-size: 0.76rem; background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 4px 8px; border-radius: 4px; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                                <i class="fa-solid fa-camera"></i> 시공 후 사진 (${pCount}장)
                            </button>
                        `;
                    } else {
                        proofHtml = `<span style="font-size: 0.75rem; color: #94a3b8;">증빙 미등록</span>`;
                    }

                    card.innerHTML = `
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 6px;">
                            <div>
                                <strong style="font-size: 1.02rem; color: var(--text-primary);">${escapeHtml(job.storeName)}</strong>
                                <span style="font-size: 0.84rem; font-weight: normal; color: var(--text-secondary); margin-left: 4px;">(${escapeHtml(job.bizLabel || (job.bizOwnerName ? `${job.bizOwnerName} 영업자 / ${job.bizCode}` : '본사접수'))})</span>
                            </div>
                            <span style="font-size: 0.78rem; font-weight: 700; padding: 3px 8px; border-radius: 4px; background: ${statusBg}; color: ${statusColor};">${statusLabel}</span>
                        </div>
                        <div style="font-size: 0.82rem; color: var(--text-secondary); margin-bottom: 4px;">
                            <i class="fa-solid fa-user"></i> 대표자: <strong style="color: #334155;">${escapeHtml(job.ownerName || '-')}</strong> ${job.ownerPhone ? `(${escapeHtml(job.ownerPhone)})` : ''}
                        </div>
                        <div style="font-size: 0.88rem; color: #0f766e; font-weight: 700; margin-bottom: 4px;">
                            <i class="fa-solid fa-trowel-bricks" style="color: #14b8a6;"></i> 시공사: ${escapeHtml(job.assignedConstructorName)} ${job.assignedConstructorPhone ? `(${escapeHtml(job.assignedConstructorPhone)})` : ''}
                        </div>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); line-height: 1.4;">
                            <i class="fa-solid fa-location-dot" style="color: var(--accent-primary);"></i> ${escapeHtml(job.storeAddress)}
                        </div>
                        
                        <!-- 간판 종류 -->
                        <div style="margin-top: 6px; font-size: 0.82rem; display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                            <span style="color: #475569; font-weight: 600;">간판종류:</span>
                            <select class="select-job-signtype-mob" data-id="${job.id}" style="padding: 3px 6px; font-size: 0.74rem; font-weight: 700; border-radius: 4px; border: 1px solid #93c5fd; color: #1e40af; background: #eff6ff;">
                                <option value="플렉스 간판" ${selectedDropdownVal === '플렉스 간판' ? 'selected' : ''}>1. 플렉스 간판</option>
                                <option value="LED 채널 간판" ${selectedDropdownVal === 'LED 채널 간판' ? 'selected' : ''}>2. LED 채널 간판</option>
                                <option value="돌출 간판" ${selectedDropdownVal === '돌출 간판' ? 'selected' : ''}>3. 돌출 간판</option>
                                <option value="custom" ${selectedDropdownVal === 'custom' ? 'selected' : ''}>4. 그외 기타 (직접입력)</option>
                            </select>
                        </div>
                        <div id="custom-signtype-wrap-mob-${job.id}" style="display: ${selectedDropdownVal === 'custom' ? 'flex' : 'none'}; margin-top: 4px; gap: 4px;">
                            <input type="text" value="${isCustomSignType ? escapeHtml(currentSignType) : ''}" placeholder="기타 간판종류 입력" style="padding: 3px 6px; font-size: 0.74rem; border-radius: 4px; border: 1px solid #cbd5e1; width: 130px;" onchange="window.updateJobSignType('${job.id}', this.value)">
                        </div>

                        <!-- 간판 디자인 시안 확인 & 시공 후 증빙 -->
                        <div style="margin-top: 8px; padding: 8px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; display: flex; flex-direction: column; gap: 6px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px;">
                                <span style="font-size: 0.78rem; font-weight: 700; color: #7c3aed;"><i class="fa-solid fa-palette"></i> 디자인 시안 (${draftCount}장):</span>
                                ${draftCount > 0 ? `
                                    <div style="display: flex; gap: 4px; align-items: center;">
                                        <button type="button" onclick="window.viewDraftModal('${job.id}')" style="padding: 3px 8px; font-size: 0.72rem; font-weight: 700; background: #f5f3ff; color: #7c3aed; border: 1px solid #ddd6fe; border-radius: 4px; cursor: pointer;">시안 보기</button>
                                        ${(job.draftStatus !== 'owner_approved' && job.draftStatus !== 'admin_approved') ? `
                                            <button type="button" onclick="window.toggleDraftApproval('${job.id}', 'admin_approved')" style="padding: 3px 6px; font-size: 0.7rem; font-weight: 700; background: #2563eb; color: white; border: none; border-radius: 4px; cursor: pointer;">직권확정</button>
                                        ` : `
                                            <span style="font-size: 0.72rem; color: #166534; font-weight: 700;">(${draftStatusText})</span>
                                        `}
                                    </div>
                                ` : `<span style="font-size: 0.72rem; color: #94a3b8;">시안 미등록</span>`}
                            </div>
                            <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 4px;">
                                <span style="font-size: 0.78rem; font-weight: 700; color: #047857;"><i class="fa-solid fa-camera"></i> 시공 후 증빙:</span>
                                ${proofHtml}
                            </div>
                        </div>

                        <!-- 5단계 상태 변경 -->
                        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 8px; flex-wrap: wrap;">
                            <span style="font-size: 0.82rem; font-weight: 700; color: #475569;">시공 진행 상태:</span>
                            <select class="status-select-mob select-admin-const-status-mob" data-id="${job.id}" style="padding: 5px 8px; font-size: 0.8rem; font-weight: 700; border-radius: 6px; border: 1px solid var(--border-color); background: white; flex: 1; max-width: 180px; height: auto;">
                                <option value="before_construction" ${st === 'before_construction' ? 'selected' : ''}>1. 시공 전</option>
                                <option value="design_draft" ${st === 'design_draft' ? 'selected' : ''}>2. 시안/교정 중</option>
                                <option value="in_construction" ${st === 'in_construction' ? 'selected' : ''}>3. 시공 진행 중</option>
                                <option value="after_construction" ${st === 'after_construction' ? 'selected' : ''}>4. 완료 보고됨</option>
                                <option value="completed" ${st === 'completed' ? 'selected' : ''}>5. 정산 종결</option>
                            </select>
                        </div>
                    `;
                    constProgressListMob.appendChild(card);
                });

                constProgressListMob.querySelectorAll('.select-admin-const-status-mob').forEach(sel => {
                    sel.addEventListener('change', (e) => {
                        const id = e.target.dataset.id;
                        const val = e.target.value;
                        updateJobConstructionStatusMob(id, val);
                        renderAdminDashboardMob(true);
                    });
                });

                constProgressListMob.querySelectorAll('.select-job-signtype-mob').forEach(sel => {
                    sel.addEventListener('change', (e) => {
                        const id = e.target.dataset.id;
                        const val = e.target.value;
                        const customWrap = document.getElementById(`custom-signtype-wrap-mob-${id}`);
                        if (val === 'custom') {
                            if (customWrap) {
                                customWrap.style.display = 'flex';
                                const input = customWrap.querySelector('input');
                                if (input) input.focus();
                            }
                        } else {
                            if (customWrap) customWrap.style.display = 'none';
                            window.updateJobSignType(id, val);
                        }
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
    window.renderAdminDashboardMob = renderAdminDashboardMob;

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

        if (activeUser && String(activeUser.id).toLowerCase() === String(uid).toLowerCase()) {
            activeUser.role = 'constructor';
            activeUser.constCode = code;
            activeUser.conversionStatus = 'approved';
            sessionStorage.setItem('activeUser', JSON.stringify(activeUser));
            if (localStorage.getItem('activeUser')) {
                localStorage.setItem('activeUser', JSON.stringify(activeUser));
            }
        }

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
        updateDrawerProfile();
        updateHeaderAuthButton();
        window.dispatchEvent(new CustomEvent('supabase-data-synced'));
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

        if (activeUser && String(activeUser.id).toLowerCase() === String(uid).toLowerCase()) {
            activeUser.role = 'business';
            activeUser.bizCode = code;
            activeUser.conversionStatus = 'approved';
            sessionStorage.setItem('activeUser', JSON.stringify(activeUser));
            if (localStorage.getItem('activeUser')) {
                localStorage.setItem('activeUser', JSON.stringify(activeUser));
            }
        }

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
        updateDrawerProfile();
        updateHeaderAuthButton();
        window.dispatchEvent(new CustomEvent('supabase-data-synced'));
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

    window.renderAdminDashboardMob = renderAdminDashboardMob;
    window.renderStatusTab = renderStatusTab;



    function deleteApplicationMob(id) {
        if (!id) return;
        if (!confirm(`[주의] 지원 신청 접수 건 [${id}]을(를) 정말로 삭제하시겠습니까?\n삭제 후 복구할 수 없습니다.`)) return;

        let deletedAppIds = JSON.parse(localStorage.getItem('deleted_application_ids')) || [];
        if (!deletedAppIds.includes(String(id))) {
            deletedAppIds.push(String(id));
            localStorage.setItem('deleted_application_ids', JSON.stringify(deletedAppIds));
        }

        applications = applications.filter(app => String(app.id) !== String(id));
        localStorage.setItem('applications', JSON.stringify(applications));

        if (window.SupabaseSync) {
            window.SupabaseSync.deleteApplication(id);
        }

        alert(`지원 신청 접수 건 [${id}]이(가) 정상적으로 삭제되었습니다.`);
        renderStatusTab();
    }

    const updateApplicationStatusMob = (id, newStatus) => {
        const curAct=(typeof getActiveUser==='function'?getActiveUser():null)||activeUser||JSON.parse(localStorage.getItem('activeUser'))||JSON.parse(sessionStorage.getItem('activeUser')); if(!curAct||curAct.role!=='admin') return;
        let targetApp = null;
        applications = applications.map(app => {
            if (String(app.id) === String(id)) {
                let progStatus = '심사대기';
                if (newStatus === 'approved' || newStatus === '서류제출 & 접수예정') progStatus = '서류제출 & 접수예정';
                else if (newStatus === 'rejected' || newStatus === '지원사업 탈락' || newStatus === '지원사업탈락') progStatus = '지원사업 탈락';
                else if (newStatus === 'giveup' || newStatus === '지원사업 포기' || newStatus === '지원사업포기') progStatus = '지원사업 포기';
                targetApp = { ...app, status: newStatus, progressStatus: progStatus, constructionStatus: progStatus };
                return targetApp;
            }
            return app;
        });
        localStorage.setItem('applications', JSON.stringify(applications));

        // 1) 영업자 마이페이지 및 PC 대시보드 실시간 동시 연동: users 목록 내 items 상태 동기화
        let curUsers = JSON.parse(localStorage.getItem('users')) || [];
        let usersUpdated = false;
        if (targetApp) {
            curUsers = curUsers.map(u => {
                if (u.items && Array.isArray(u.items)) {
                    let itemMatched = false;
                    u.items = u.items.map(it => {
                        if (String(it.id) === String(targetApp.id) || String(it.appRefId) === String(targetApp.id)) {
                            let updatedProgress = '지원대기중';
                            if (newStatus === 'approved' || newStatus === '서류제출 & 접수예정') updatedProgress = '서류제출 & 접수예정';
                            else if (newStatus === 'rejected' || newStatus === '지원사업 탈락' || newStatus === '지원사업탈락') updatedProgress = '지원사업 탈락';
                            else if (newStatus === 'giveup' || newStatus === '지원사업 포기' || newStatus === '지원사업포기') updatedProgress = '지원사업 포기';
                            else updatedProgress = '심사대기';

                            it.progressStatus = updatedProgress;
                            it.constructionStatus = updatedProgress;
                            itemMatched = true;
                            usersUpdated = true;
                        }
                        return it;
                    });
                }
                return u;
            });

            if (usersUpdated) {
                users = curUsers;
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
        alert(`[${targetApp ? (targetApp.storeName || targetApp.shopName || targetApp.ownerName) : id}] 신청 건의 상태가 [${statusLabel}] (으)로 변경되었습니다.`);
        renderStatusTab();

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
                    console.warn('Supabase mobile background update status sync warning:', syncErr);
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
    window.updateApplicationStatusMob = updateApplicationStatusMob;

    

    function updateItemStatusMob(uid, itemId, type, value) {
        if (!activeUser || activeUser.role !== 'admin') return;
        if (window.DataStore && typeof window.DataStore.updateItemStatus === 'function') {
            return window.DataStore.updateItemStatus(uid, itemId, type, value);
        }
    }
    window.updateItemStatusMob = updateItemStatusMob;

    function deleteManagerItemMob(uid, itemId) {
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

        // 1) deleted_biz_item_ids 등록
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
        let activeU = getActiveUser() || activeUser;
        if (activeU && activeU.items) {
            activeU.items = activeU.items.filter(it => !isMatchTarget(it));
            localStorage.setItem('activeUser', JSON.stringify(activeU));
            activeUser = activeU;
        }

        // 4) applications 에서도 isBizItem 해제
        let curApps = JSON.parse(localStorage.getItem('applications')) || [];
        curApps = curApps.map(app => {
            if (isMatchTarget(app)) {
                return { ...app, isBizItem: false };
            }
            return app;
        });
        applications = curApps;
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
        renderStatusTab();
    }
    window.deleteManagerItemMob = deleteManagerItemMob;

    // 모바일 영업 물건에 시공사 배정
    function assignConstructorToBizItemMob(uid, itemId, btnEl) {
        if (!activeUser || activeUser.role !== 'admin') return;
        const container = btnEl.closest('div');
        const select = container.querySelector('.select-constructor-bizitem-mob');
        const constId = select ? select.value : '';
        if (!constId) {
            alert('배정할 시공사를 선택해 주세요.');
            return;
        }

        let curUsers = JSON.parse(localStorage.getItem('users')) || [];
        const constUser = curUsers.find(u => String(u.id) === String(constId));
        if (!constUser) {
            alert('선택된 시공사 정보를 찾을 수 없습니다.');
            return;
        }

        const constName = constUser.businessName || constUser.pendingBusinessName || constUser.name || constUser.id;
        let targetItemName = '영업 물건';

        curUsers = curUsers.map(u => {
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

        localStorage.setItem('users', JSON.stringify(curUsers));

        if (window.SupabaseSync) {
            const updatedUser = curUsers.find(u => String(u.id) === String(uid));
            if (updatedUser) {
                window.SupabaseSync.updateUser(uid, {
                    items: updatedUser.items || []
                });
            }
        }

        alert(`[${targetItemName}] 영업 물건에 시공사 [${constName}]가 성공적으로 배정되었습니다.`);
        renderStatusTab();
    }
    window.assignConstructorToBizItemMob = assignConstructorToBizItemMob;

    // 모바일 배정 시공사 변경 (초기화)
    function reassignConstructorItemMob(uid, itemId) {
        if (!activeUser || activeUser.role !== 'admin') return;
        let curUsers = JSON.parse(localStorage.getItem('users')) || [];
        curUsers = curUsers.map(u => {
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

        localStorage.setItem('users', JSON.stringify(curUsers));
        if (window.SupabaseSync) {
            const updatedUser = curUsers.find(u => String(u.id) === String(uid));
            if (updatedUser) {
                window.SupabaseSync.updateUser(uid, {
                    items: updatedUser.items || []
                });
            }
        }
        renderStatusTab();
    }
    window.reassignConstructorItemMob = reassignConstructorItemMob;

    // Popup management helpers for Mob
    const mobPopupForm = document.getElementById('mob-popup-form');
    if (mobPopupForm) {
        mobPopupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('mob-popup-id').value;
            const title = document.getElementById('mob-popup-title').value.trim();
            const content = document.getElementById('mob-popup-content').value.trim();
            const imageUrl = document.getElementById('mob-popup-image').value.trim();
            const linkUrl = document.getElementById('mob-popup-link').value.trim();
            const startDate = document.getElementById('mob-popup-start').value;
            const endDate = document.getElementById('mob-popup-end').value;
            const width = parseInt(document.getElementById('mob-popup-width').value) || 380;
            const height = parseInt(document.getElementById('mob-popup-height').value) || 480;
            const positionTop = parseInt(document.getElementById('mob-popup-top').value) || 120;
            const positionLeft = parseInt(document.getElementById('mob-popup-left').value) || 100;
            const isActive = document.getElementById('mob-popup-active').checked;

            if (!title) {
                alert('팝업 제목을 입력해 주세요.');
                return;
            }

            let popups = JSON.parse(localStorage.getItem('popups')) || [];
            if (id) {
                // Update
                popups = popups.map(p => {
                    if (p.id === parseInt(id)) {
                        return {
                            ...p,
                            title, content, imageUrl, linkUrl,
                            startDate, endDate, width, height,
                            positionTop, positionLeft, isActive,
                            updatedAt: new Date().toISOString()
                        };
                    }
                    return p;
                });
                alert('팝업창 정보가 수정되었습니다.');
            } else {
                // Create
                const newPopup = {
                    id: Date.now(),
                    title, content, imageUrl, linkUrl,
                    startDate, endDate, width, height,
                    positionTop, positionLeft, isActive,
                    createdAt: new Date().toISOString()
                };
                popups.unshift(newPopup);
                alert('새 팝업창이 등록되었습니다.');
            }

            localStorage.setItem('popups', JSON.stringify(popups));
            resetMobPopupForm();
            renderStatusTab();
        });
    }

    function resetMobPopupForm() {
        if (!mobPopupForm) return;
        mobPopupForm.reset();
        document.getElementById('mob-popup-id').value = '';
        document.getElementById('mob-popup-start').value = '2026-07-01';
        document.getElementById('mob-popup-end').value = '2026-08-31';
        document.getElementById('mob-popup-width').value = 380;
        document.getElementById('mob-popup-height').value = 480;
        document.getElementById('mob-popup-top').value = 120;
        document.getElementById('mob-popup-left').value = 100;
        document.getElementById('mob-popup-active').checked = true;

        const titleText = document.getElementById('mob-popup-form-title');
        if (titleText) titleText.innerHTML = '<i class="fa-solid fa-plus-circle"></i> 새 팝업 등록';
    }
    window.resetMobPopupForm = resetMobPopupForm;

    function editPopupMob(pid) {
        const popups = JSON.parse(localStorage.getItem('popups')) || [];
        const p = popups.find(item => item.id === pid);
        if (!p) return;

        document.getElementById('mob-popup-id').value = p.id;
        document.getElementById('mob-popup-title').value = p.title || '';
        document.getElementById('mob-popup-content').value = p.content || '';
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

        const myJobs = (window.DataStore && typeof window.DataStore.getConstructionJobs === 'function')
            ? window.DataStore.getConstructionJobs(activeUser)
            : [];

        // Search filtering for constructor jobs (모바일)
        const searchInputMob = document.getElementById('search-constructor-jobs-input-mob');
        const qMob = (searchInputMob ? searchInputMob.value.trim().toLowerCase() : '').slice(0, 30);

        let filteredJobs = myJobs;
        if (qMob) {
            filteredJobs = myJobs.filter(j => {
                const sName = String(j.storeName || '').toLowerCase();
                const sAddr = String(j.storeAddress || '').toLowerCase();
                const sType = String(j.signType || '').toLowerCase();
                const oName = String(j.ownerName || '').toLowerCase();
                const oPhone = String(j.ownerPhone || '').toLowerCase();
                const jId = String(j.id || '').toLowerCase();
                return sName.includes(qMob) || sAddr.includes(qMob) || sType.includes(qMob) || oName.includes(qMob) || oPhone.includes(qMob) || jId.includes(qMob);
            });
        }

        if (filteredJobs.length === 0) {
            const emptyMsg = qMob ? `검색어 [${escapeHtml(qMob)}] 에 일치하는 시공 물건이 없습니다.` : '배정된 시공 물건이 없습니다.';
            jobsList.innerHTML = `<p class="text-muted" style="text-align:center; padding: 25px 0; font-size: 0.88rem;">${emptyMsg}</p>`;
            return;
        }

        jobsList.innerHTML = '';
        filteredJobs.forEach(job => {
            const card = document.createElement('div');
            card.className = 'app-card-mob';
            card.style.borderLeft = '4px solid var(--accent-success)';

            let statusLabel = '1. 시공 전';
            let statusClass = 'pending';
            if (job.constructionStatus === 'design_draft') {
                statusLabel = '2. 간판 디자인 시안 및 교정 중';
                statusClass = 'warning';
            } else if (job.constructionStatus === 'in_construction') {
                statusLabel = '3. 시공 진행 중';
                statusClass = 'warning';
            } else if (job.constructionStatus === 'after_construction') {
                statusLabel = '4. 완료 보고됨';
                statusClass = 'approved';
            } else if (job.constructionStatus === 'completed') {
                statusLabel = '5. 정산 종결';
                statusClass = 'info';
            }

            const draftPhotos = job.signDraftPhotos || [];
            const afterPhotos = job.constructionPhotos || [];

            let draftStatusBadge = '';
            if (job.draftStatus === 'owner_approved') {
                draftStatusBadge = '<span style="color: #166534; font-weight: 700; font-size: 0.72rem;"><i class="fa-solid fa-circle-check"></i> 점주 시안확정</span>';
            } else if (job.draftStatus === 'admin_approved') {
                draftStatusBadge = '<span style="color: #1e40af; font-weight: 700; font-size: 0.72rem;"><i class="fa-solid fa-user-shield"></i> 관리자 직권확정</span>';
            } else if (draftPhotos.length > 0) {
                draftStatusBadge = '<span style="color: #92400e; font-weight: 700; font-size: 0.72rem;"><i class="fa-solid fa-clock"></i> 시안 검토중</span>';
            } else {
                draftStatusBadge = '<span style="color: #94a3b8; font-size: 0.72rem;">시안 미등록</span>';
            }

            let uploadSectionHtml = '';
            if (job.constructionStatus !== 'completed') {
                uploadSectionHtml = `
                    <div style="border-top: 1px dashed var(--border-color); padding-top: 10px; margin-top: 10px; text-align: left;">
                        <!-- 1. 간판 디자인 시안 업로드 (2MB 자동 압축) -->
                        <div class="phone-form-group" style="margin-bottom: 8px; background: #faf5ff; border: 1px solid #e9d5ff; border-radius: 6px; padding: 8px;">
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
                                <label style="font-size: 0.75rem; font-weight: 700; color: #7e22ce;"><i class="fa-solid fa-palette"></i> 간판 디자인 시안 (${draftPhotos.length}장)</label>
                                ${draftStatusBadge}
                            </div>
                            <input type="file" class="const-draft-input-mob" data-id="${job.id}" accept="image/*" multiple style="font-size: 0.7rem; width: 100%;">
                            ${draftPhotos.length > 0 ? `<button type="button" onclick="window.viewDraftModal('${job.id}')" style="margin-top: 4px; padding: 3px 8px; font-size: 0.72rem; background: #ede9fe; color: #6d28d9; border: 1px solid #c4b5fd; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-eye"></i> 등록된 시안 확인</button>` : ''}
                        </div>

                        <!-- 2. 시공 후 사진 업로드 (2MB 자동 압축, 3~5컷) -->
                        <div class="phone-form-group" style="margin-bottom: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 8px;">
                            <label style="font-size: 0.75rem; font-weight: 700; color: #15803d; display: block; margin-bottom: 4px;"><i class="fa-solid fa-camera"></i> 시공 후 사진 증빙 (3~5컷, 현재 ${afterPhotos.length}장)</label>
                            <input type="file" class="const-photo-input-mob" data-id="${job.id}" accept="image/*" multiple style="font-size: 0.7rem; width: 100%;">
                            ${afterPhotos.length > 0 ? `<button type="button" onclick="window.viewConstructionPhotosModal('${job.id}')" style="margin-top: 4px; padding: 3px 8px; font-size: 0.72rem; background: #dcfce7; color: #15803d; border: 1px solid #86efac; border-radius: 4px; cursor: pointer;"><i class="fa-solid fa-eye"></i> 시공 후 사진 확인</button>` : ''}
                        </div>
                        
                        <div style="display: flex; gap: 8px; align-items: center; justify-content: space-between; flex-wrap: wrap;">
                            <select class="status-select-mob select-const-status-mob" data-id="${job.id}" style="padding: 5px; font-size: 0.74rem; font-weight: 700; border-radius: 4px; border: 1px solid var(--border-color); background: white; height: auto; min-height: auto; width: auto;">
                                <option value="before_construction" ${job.constructionStatus === 'before_construction' ? 'selected' : ''}>1. 시공 전</option>
                                <option value="design_draft" ${job.constructionStatus === 'design_draft' ? 'selected' : ''}>2. 시안/교정 중</option>
                                <option value="in_construction" ${job.constructionStatus === 'in_construction' ? 'selected' : ''}>3. 시공 중</option>
                                <option value="after_construction" ${job.constructionStatus === 'after_construction' ? 'selected' : ''}>4. 완료 보고</option>
                            </select>
                            <button class="btn btn-primary btn-sm btn-report-job-complete-mob" data-id="${job.id}" style="padding: 6px 12px; font-size: 0.75rem; font-weight: 700; background: var(--accent-success); border: none; border-radius: 6px; cursor: pointer; color: white;"><i class="fa-solid fa-paper-plane"></i> 최종 시공 완료 보고</button>
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
                <div class="app-card-body-row">간판종류: <strong>${escapeHtml(job.signType || '플렉스 간판')}</strong></div>
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
                const id = e.target.dataset.id;
                const val = e.target.value;
                updateJobConstructionStatusMob(id, val);
            });
        });

        jobsList.querySelectorAll('.btn-report-job-complete-mob').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.closest('button').dataset.id;
                reportJobCompletionMob(id);
            });
        });

        jobsList.querySelectorAll('.const-draft-input-mob').forEach(input => {
            input.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    await handleJobDraftUploadMob(id, files);
                }
            });
        });

        jobsList.querySelectorAll('.const-photo-input-mob').forEach(input => {
            input.addEventListener('change', async (e) => {
                const id = e.target.dataset.id;
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    await handleJobPhotoUploadMob(id, files);
                }
            });
        });
    }

    function updateJobConstructionStatusMob(id, val) {
        // 1) applications
        let apps = JSON.parse(localStorage.getItem('applications')) || [];
        apps = apps.map(app => {
            if (String(app.id) === String(id)) {
                return { ...app, constructionStatus: val };
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

        renderConstructorDashboardMob();
    }

    // 모바일 시공사 간판 디자인 시안 1MB 압축 업로드
    async function handleJobDraftUploadMob(id, files) {
        const uploadedBase64List = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            let base64 = null;
            if (typeof compressImageToBase64 === 'function') {
                base64 = await compressImageToBase64(file, 1 * 1024 * 1024);
            } else {
                base64 = await new Promise((res) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => res(ev.target.result);
                    reader.readAsDataURL(file);
                });
            }
            if (base64) uploadedBase64List.push(base64);
        }

        if (uploadedBase64List.length === 0) return;

        let apps = JSON.parse(localStorage.getItem('applications')) || [];
        apps = apps.map(app => {
            if (String(app.id) === String(id)) {
                const existing = app.signDraftPhotos || [];
                const merged = existing.concat(uploadedBase64List).slice(0, 10);
                return {
                    ...app,
                    signDraftPhotos: merged,
                    constructionStatus: app.constructionStatus === 'before_construction' ? 'design_draft' : app.constructionStatus
                };
            }
            return app;
        });
        localStorage.setItem('applications', JSON.stringify(apps));

        let curUsers = JSON.parse(localStorage.getItem('users')) || [];
        let updatedUid = null;
        curUsers = curUsers.map(u => {
            if (u.items && Array.isArray(u.items)) {
                const updatedItems = u.items.map(item => {
                    if (String(item.id) === String(id)) {
                        updatedUid = u.id;
                        const existing = item.signDraftPhotos || [];
                        const merged = existing.concat(uploadedBase64List).slice(0, 10);
                        return {
                            ...item,
                            signDraftPhotos: merged,
                            constructionStatus: item.constructionStatus === 'before_construction' ? 'design_draft' : item.constructionStatus
                        };
                    }
                    return item;
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

        alert('간판 디자인 시안이 1MB 이하로 자동 압축되어 업로드되었습니다.\n신청 점주 및 관리자 화면에 즉시 공유됩니다.');
        renderConstructorDashboardMob();
    }

    // 모바일 시공사 시공 후 사진 1MB 압축 업로드 (3~5컷)
    async function handleJobPhotoUploadMob(id, files) {
        const uploadedBase64List = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            let base64 = null;
            if (typeof compressImageToBase64 === 'function') {
                base64 = await compressImageToBase64(file, 1 * 1024 * 1024);
            } else {
                base64 = await new Promise((res) => {
                    const reader = new FileReader();
                    reader.onload = (ev) => res(ev.target.result);
                    reader.readAsDataURL(file);
                });
            }
            if (base64) uploadedBase64List.push(base64);
        }

        if (uploadedBase64List.length === 0) return;

        let apps = JSON.parse(localStorage.getItem('applications')) || [];
        apps = apps.map(app => {
            if (String(app.id) === String(id)) {
                const existing = app.constructionPhotos || [];
                const merged = existing.concat(uploadedBase64List).slice(0, 5);
                return { ...app, constructionPhotos: merged };
            }
            return app;
        });
        localStorage.setItem('applications', JSON.stringify(apps));

        let curUsers = JSON.parse(localStorage.getItem('users')) || [];
        let updatedUid = null;
        curUsers = curUsers.map(u => {
            if (u.items && Array.isArray(u.items)) {
                const updatedItems = u.items.map(item => {
                    if (String(item.id) === String(id)) {
                        updatedUid = u.id;
                        const existing = item.constructionPhotos || [];
                        const merged = existing.concat(uploadedBase64List).slice(0, 5);
                        return { ...item, constructionPhotos: merged };
                    }
                    return item;
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

        alert('시공 후 현장 사진이 2MB 이하로 자동 압축되어 업로드되었습니다.');
        renderConstructorDashboardMob();
    }

    function reportJobCompletionMob(id) {
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

        const photos = targetJob.constructionPhotos || [];
        if (photos.length === 0) {
            alert('최소 1장 이상의 시공 후 현장 사진을 등록해 주세요. (권장: 3~5컷)');
            return;
        }

        apps = apps.map(a => {
            if (String(a.id) === String(id)) {
                return {
                    ...a,
                    constructionStatus: 'after_construction',
                    constructionCompletedAt: new Date().toISOString()
                };
            }
            return a;
        });
        localStorage.setItem('applications', JSON.stringify(apps));

        let updatedUid = null;
        curUsers = curUsers.map(u => {
            if (u.items && Array.isArray(u.items)) {
                const updatedItems = u.items.map(item => {
                    if (String(item.id) === String(id)) {
                        updatedUid = u.id;
                        return {
                            ...item,
                            constructionStatus: 'after_construction',
                            constructionCompletedAt: new Date().toISOString()
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
            const app = apps.find(a => String(a.id) === String(id));
            if (app) window.SupabaseSync.upsertApplication(app);
        }

        alert('시공 완료 보고가 정상 접수되었습니다!\n최고관리자의 최종 시공 사진 검수 후 정산 종결 처리가 진행됩니다.');
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

    window.openInquiryModal = function (e) {
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

            const newInquiry = {
                id: 'INQ-' + Date.now(),
                name,
                phone,
                type,
                message,
                status: 'pending',
                submittedAt: new Date().toISOString()
            };

            // 1) 로컬 DataStore에 즉시 저장 (낙관적 UI)
            if (window.DataStore && typeof window.DataStore.upsertInquiry === 'function') {
                window.DataStore.upsertInquiry(newInquiry);
            } else {
                const inquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
                inquiries.unshift(newInquiry);
                localStorage.setItem('inquiries', JSON.stringify(inquiries));
            }

            // 2) Supabase REST API로 직접 저장 (supabaseClient 초기화 여부 무관, 100% 보장)
            const _sbUrl = (window.SUPABASE_URL) || 'https://nfexylsehsucctoefwdz.supabase.co';
            const _sbKey = (window.SUPABASE_ANON_KEY) || 'sb_publishable_Ux7dNNRDLqVX8MAX6-MlIA_HueFAGhh';
            const _dbPayload = {
                id: newInquiry.id,
                name: newInquiry.name,
                phone: newInquiry.phone,
                category: newInquiry.type || 'other',
                region: newInquiry.message,
                status: 'pending',
                created_at: newInquiry.submittedAt
            };
            fetch(_sbUrl + '/rest/v1/inquiries?on_conflict=id', {
                method: 'POST',
                headers: {
                    'apikey': _sbKey,
                    'Authorization': 'Bearer ' + _sbKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal,resolution=merge-duplicates'
                },
                body: JSON.stringify(_dbPayload)
            }).then(res => {
                if (!res.ok) {
                    res.text().then(t => console.warn('[Inquiry] Supabase save failed:', res.status, t));
                } else {
                    console.log('[Inquiry] Supabase save OK:', newInquiry.id);
                    window.dispatchEvent(new CustomEvent('supabase-data-synced'));
                    if (typeof window.renderAdminDashboardMob === 'function') {
                        window.renderAdminDashboardMob(true);
                    }
                }
            }).catch(err => console.error('[Inquiry] Supabase fetch error:', err));

            // 3) 카카오톡 관리자 실시간 알림 발송
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
        inquiryMessage.addEventListener('input', function () {
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

    window.openPolicyModal = function (type) {
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
        document.getElementById('profile-edit-name').value = user.name || '';
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

            // users 배열에서 찾아 수정
            const users = JSON.parse(localStorage.getItem('users')) || [];
            const idx = users.findIndex(u => u.id === user.id);

            if (idx !== -1) {
                if (nameVal) users[idx].name = nameVal;
                if (emailVal) users[idx].email = emailVal;
                if (phoneVal) users[idx].phone = phoneVal;
                if (addressVal !== undefined) users[idx].address = addressVal;
                if (newPw) users[idx].pw = sha256(newPw);
                localStorage.setItem('users', JSON.stringify(users));

                // activeUser 세션 갱신
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
            updateDrawerProfile();
            updateHeaderAuthButton();
            if (typeof handleSessionRefresh === 'function') {
                handleSessionRefresh();
            }
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
                globalSearchInput.maxLength = 30;
                globalSearchInput.placeholder = '상호명을 입력해 주세요 (최대 30자, 예: 초원식당)';
            }
            if (searchGuideText) {
                searchGuideText.innerHTML = '조회하고자 하는 매장의 <strong>상호명(업체명, 최대 30자)</strong>을 입력해 주세요.';
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
                globalSearchInput.maxLength = 30;
                globalSearchInput.placeholder = '고유번호를 입력해 주세요 (최대 30자, 예: P-260816001)';
            }
            if (searchGuideText) {
                searchGuideText.innerHTML = '발급받으신 <strong>고유 접수번호(최대 30자)</strong>(예: P-260816001, B-260801-0001)를 입력해 주세요.';
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

    // --- 앱 최신 데이터 새로고침 및 동기화 기능 (PWA Standalone 지원) ---
    let isRefreshing = false;
    let lastRefreshTime = 0;

    function showRefreshToast(msg = '최신 데이터로 동기화되었습니다.') {
        const toast = document.getElementById('app-refresh-toast');
        const toastText = document.getElementById('app-refresh-toast-text');
        if (!toast) return;
        if (toastText) toastText.textContent = msg;
        toast.classList.add('show');
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2200);
    }
    window.showRefreshToast = showRefreshToast;

    async function triggerAppRefresh(isSilent = false) {
        if (isRefreshing) return;
        isRefreshing = true;

        const refreshBtn = document.getElementById('tab-btn-refresh') || document.getElementById('mobile-header-refresh-btn');
        if (refreshBtn && !isSilent) {
            refreshBtn.classList.add('spinning');
        }

        try {
            // 1. Supabase 클라우드 최신 DB 전체 동기화
            if (window.SupabaseSync && typeof window.SupabaseSync.syncAllData === 'function') {
                await window.SupabaseSync.syncAllData();
            }

            // 2. 로컬 스토리지 최신 데이터 재로딩
            users = JSON.parse(localStorage.getItem('users')) || [];
            applications = JSON.parse(localStorage.getItem('applications')) || [];
            activeUser = getActiveUser() || null;

            // 3. UI 컴포넌트 실시간 갱신
            updateDrawerProfile();
            updateHeaderAuthButton();
            renderStatusTab();

            // 역할별 대시보드 뷰 갱신
            if (activeUser) {
                if (activeUser.role === 'admin') {
                    renderAdminDashboardMob(true);
                } else if (activeUser.role === 'business') {
                    if (typeof renderBusinessDashboardMob === 'function') renderBusinessDashboardMob();
                } else if (activeUser.role === 'constructor') {
                    if (typeof renderConstructorDashboardMob === 'function') renderConstructorDashboardMob(true);
                }
            }

            lastRefreshTime = Date.now();
            if (!isSilent) {
                showRefreshToast('최신 데이터로 새로고침되었습니다.');
            }
        } catch (err) {
            console.warn('[새로고침 동기화 오류]', err);
            if (!isSilent) {
                showRefreshToast('데이터 갱신 완료 (로컬 동기화)');
            }
        } finally {
            if (refreshBtn && !isSilent) {
                setTimeout(() => {
                    refreshBtn.classList.remove('spinning');
                    isRefreshing = false;
                }, 500);
            } else {
                isRefreshing = false;
            }
        }
    }
    window.triggerAppRefresh = triggerAppRefresh;

    // 하단 탭 바 새로고침 버튼 이벤트 바인딩
    const tabBtnRefresh = document.getElementById('tab-btn-refresh');
    if (tabBtnRefresh) {
        tabBtnRefresh.addEventListener('click', (e) => {
            e.preventDefault();
            triggerAppRefresh(false);
        });
    }

    // 홈 화면에서 앱으로 다시 복귀했을 때 (visibility / focus) 백그라운드 자동 동기화
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const elapsed = Date.now() - lastRefreshTime;
            // 복귀 시 마지막 갱신 후 10초 이상 지났으면 조용히 최신 데이터 갱신
            if (elapsed > 10000) {
                triggerAppRefresh(true);
            }
        }
    });

    window.addEventListener('focus', () => {
        const elapsed = Date.now() - lastRefreshTime;
        if (elapsed > 15000) {
            triggerAppRefresh(true);
        }
    });

    // 초기 로드 시 Supabase 최신 데이터 즉시 동기화 실행
    syncAdminDataFromSupabaseMob();

});

