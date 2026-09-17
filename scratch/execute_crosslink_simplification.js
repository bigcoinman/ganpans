const fs = require('fs');
const path = require('path');

console.log('=== [5대 에이전트 합동 연동 최적화 및 유령/복잡/땜빵 코드 전수 정리] ===');

const appPath = path.resolve('app.js');
let appRaw = fs.readFileSync(appPath, 'utf8');
const isCRLF = appRaw.includes('\r\n');
let appJs = appRaw.replace(/\r\n/g, '\n');

let changesCount = 0;

function safeReplace(target, replacement, desc) {
    const t = target.replace(/\r\n/g, '\n');
    const r = replacement.replace(/\r\n/g, '\n');
    if (appJs.includes(t)) {
        appJs = appJs.replace(t, r);
        console.log(`✅ [성공] ${desc}`);
        changesCount++;
        return true;
    } else {
        console.error(`❌ [실패] ${desc}`);
        return false;
    }
}

// 1. 공통 헬퍼 함수 3종 추가 (상위 스코프: formatDateOnly 위쪽에 배치)
const targetCommonHelpersAnchor = `    // --- Salesperson Dashboard & Common Utilities ---
    function formatDateOnly(dateString, sep = '.') {`;

const replacementCommonHelpers = `    // --- SSOT Storage Helpers (간단하고 안전한 단일 저장) ---
    function saveUsersSSOT(usersList) {
        if (window.DataStore && typeof window.DataStore.saveUsers === 'function') {
            return window.DataStore.saveUsers(usersList);
        }
        localStorage.setItem('users', JSON.stringify(usersList));
    }

    function saveApplicationsSSOT(appsList) {
        if (window.DataStore && typeof window.DataStore.saveApplications === 'function') {
            return window.DataStore.saveApplications(appsList);
        }
        localStorage.setItem('applications', JSON.stringify(appsList));
    }

    function saveInquiriesSSOT(inquiriesList) {
        if (window.DataStore && typeof window.DataStore.saveInquiries === 'function') {
            return window.DataStore.saveInquiries(inquiriesList);
        }
        localStorage.setItem('inquiries', JSON.stringify(inquiriesList));
    }

    // --- Salesperson Dashboard & Common Utilities ---
    function formatDateOnly(dateString, sep = '.') {`;

safeReplace(targetCommonHelpersAnchor, replacementCommonHelpers, '1. SSOT 저장 공통 헬퍼 3종 선언');

// 2. 신청서 상세 수정 모달 중복 함수 세트 168줄 전수 삭제 (라인 4131 ~ 4305)
const targetDupModal = `    // --- 신청서 세부 정보 직접 수정 모달 (최고관리자 모바일 & PC 공통) ---
    const safeHtml = (s) => (s === null || s === undefined ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'));

    const openEditApplicationModal = (appId) => {
        let apps = (window.DataStore && typeof window.DataStore.getApplications === 'function')
            ? window.DataStore.getApplications()
            : (JSON.parse(localStorage.getItem('applications')) || []);
        
        const cleanAppId = String(appId || '').trim().toLowerCase();
        const app = apps.find(a => {
            const aId = String(a.id || a.appId || a.application_id || '').trim().toLowerCase();
            if (aId && cleanAppId && aId === cleanAppId) return true;
            if (a.storeName && cleanAppId && String(a.storeName).trim().toLowerCase() === cleanAppId) return true;
            if (a.ownerPhone && cleanAppId && String(a.ownerPhone).replace(/[^0-9]/g, '') === cleanAppId.replace(/[^0-9]/g, '')) return true;
            return false;
        });

        if (!app) {
            alert('해당 신청서를 찾을 수 없습니다.');
            return;
        }

        let modal = document.getElementById('modal-edit-application');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'modal-edit-application';
            document.body.appendChild(modal);
        }

        modal.className = 'inquiry-modal-overlay active modal-edit-app-overlay';
        modal.style.cssText = 'position: fixed !important; top: 0 !important; left: 0 !important; width: 100vw !important; height: 100vh !important; background: rgba(15, 23, 42, 0.75) !important; z-index: 9999999 !important; display: flex !important; opacity: 1 !important; pointer-events: auto !important; align-items: center !important; justify-content: center !important; backdrop-filter: blur(4px) !important; padding: 16px !important; box-sizing: border-box !important;';

        const curStatus = app.status || 'pending';
        const isApproved = (curStatus === 'approved' || curStatus === '서류준비 & 접수대기' || curStatus === '서류제출 & 접수예정' || curStatus === '승인 완료');
        const isUnqualified = (curStatus === 'unqualified' || curStatus === '신청요건 미달업체' || curStatus === '미달');
        const isRejected = (curStatus === 'rejected' || curStatus === '지원사업 탈락' || curStatus === '반려됨');
        const isGiveup = (curStatus === 'giveup' || curStatus === '지원사업 포기');
        const isPending = !isApproved && !isUnqualified && !isRejected && !isGiveup;

        modal.innerHTML = \`
            <div style="background: #ffffff; width: 100%; max-width: 540px; max-height: 90vh; overflow-y: auto; border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.35); border: 1px solid #cbd5e1; padding: 20px; box-sizing: border-box; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; position: relative; z-index: 10000000;">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 12px; margin-bottom: 16px;">
                    <h3 style="font-size: 1.15rem; font-weight: 800; color: #0f172a; margin: 0; display: flex; align-items: center; gap: 8px;">
                        <i class="fa-solid fa-pen-to-square" style="color: #2563eb;"></i> 신청서 상세 정보 수정
                    </h3>
                    <button type="button" onclick="window.closeEditApplicationModal()" style="background: none; border: none; font-size: 1.6rem; color: #64748b; cursor: pointer; line-height: 1; padding: 4px;">&times;</button>
                </div>

                <form id="form-edit-application" onsubmit="window.submitEditApplicationModal('\${app.id}', event)" style="display: flex; flex-direction: column; gap: 12px;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 4px;">상호명 *</label>
                            <input type="text" id="edit-app-store-name" value="\${safeHtml(app.storeName || app.shopName || '')}" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 4px;">대표자명 *</label>
                            <input type="text" id="edit-app-owner-name" value="\${safeHtml(app.ownerName || app.name || '')}" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;">
                        </div>
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 4px;">연락처 *</label>
                            <input type="text" id="edit-app-owner-phone" value="\${safeHtml(app.ownerPhone || app.phone || '')}" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 4px;">간판 종류</label>
                            <input type="text" id="edit-app-sign-type" value="\${safeHtml(app.signType || '')}" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;">
                        </div>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 4px;">설치 주소 *</label>
                        <input type="text" id="edit-app-store-address" value="\${safeHtml(app.storeAddress || app.address || '')}" required style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;">
                    </div>

                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 4px;">추천인/영업코드</label>
                            <input type="text" id="edit-app-referrer-code" value="\${safeHtml(app.referrerCode || '')}" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box;">
                        </div>
                        <div>
                            <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 4px;">심사 상태</label>
                            <select id="edit-app-status" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; background: #fff; box-sizing: border-box;">
                                <option value="pending" \${isPending ? 'selected' : ''}>사업시행 전 사전등록업체</option>
                                <option value="approved" \${isApproved ? 'selected' : ''}>서류준비 & 접수대기</option>
                                <option value="unqualified" \${isUnqualified ? 'selected' : ''}>신청요건 미달업체</option>
                                <option value="rejected" \${isRejected ? 'selected' : ''}>지원사업 탈락</option>
                                <option value="giveup" \${isGiveup ? 'selected' : ''}>지원사업 포기</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label style="display: block; font-size: 0.8rem; font-weight: 700; color: #475569; margin-bottom: 4px;">관리자 메모</label>
                        <textarea id="edit-app-memo" rows="2" style="width: 100%; padding: 8px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; box-sizing: border-box; resize: vertical;">\${safeHtml(app.memo || app.notes || '')}</textarea>
                    </div>

                    <div style="display: flex; justify-content: flex-end; gap: 8px; margin-top: 10px; border-top: 1.5px solid #f1f5f9; padding-top: 12px;">
                        <button type="button" onclick="window.closeEditApplicationModal()" style="padding: 8px 16px; border: 1px solid #cbd5e1; background: #f8fafc; color: #475569; border-radius: 6px; font-weight: 600; cursor: pointer;">취소</button>
                        <button type="submit" style="padding: 8px 20px; border: none; background: #2563eb; color: #ffffff; border-radius: 6px; font-weight: 700; cursor: pointer;">수정 저장</button>
                    </div>
                </form>
            </div>
        \`;

        modal.onclick = (e) => {
            if (e.target === modal) window.closeEditApplicationModal();
        };
    };

    const closeEditApplicationModal = () => {
        const modal = document.getElementById('modal-edit-application');
        if (modal) {
            modal.className = 'inquiry-modal-overlay modal-edit-app-overlay';
            modal.style.setProperty('display', 'none', 'important');
            modal.classList.remove('active');
        }
    };

    const submitEditApplicationModal = (appId, event) => {
        if (event) event.preventDefault();
        const storeName = document.getElementById('edit-app-store-name').value.trim();
        const ownerName = document.getElementById('edit-app-owner-name').value.trim();
        const ownerPhone = document.getElementById('edit-app-owner-phone').value.trim();
        const storeAddress = document.getElementById('edit-app-store-address').value.trim();
        const signType = document.getElementById('edit-app-sign-type').value.trim();
        const referrerCode = document.getElementById('edit-app-referrer-code').value.trim();
        const status = document.getElementById('edit-app-status').value;
        const memo = document.getElementById('edit-app-memo').value.trim();

        if (!storeName || !ownerName || !ownerPhone || !storeAddress) {
            alert('상호명, 대표자명, 연락처, 주소는 필수 입력 항목입니다.');
            return;
        }

        if (window.DataStore && typeof window.DataStore.updateApplication === 'function') {
            const res = window.DataStore.updateApplication(appId, {
                storeName: storeName,
                shopName: storeName,
                ownerName: ownerName,
                name: ownerName,
                ownerPhone: ownerPhone,
                phone: ownerPhone,
                storeAddress: storeAddress,
                address: storeAddress,
                signType: signType,
                referrerCode: referrerCode,
                status: status,
                memo: memo,
                notes: memo
            });

            if (res && res.success) {
                if (typeof window.showToast === 'function') {
                    window.showToast(\`[\${storeName}] 신청서 정보가 성공적으로 수정되었습니다.\`);
                } else {
                    alert(\`[\${storeName}] 신청서 정보가 성공적으로 수정되었습니다.\`);
                }
                closeEditApplicationModal();
            } else {
                alert('수정 중 오류가 발생했습니다: ' + (res ? res.message : ''));
            }
        }
    };

    window.openEditApplicationModal = openEditApplicationModal;
    window.closeEditApplicationModal = closeEditApplicationModal;
    window.submitEditApplicationModal = submitEditApplicationModal;`;

safeReplace(targetDupModal, '', '2. 신청서 상세 수정 모달 중복 함수 세트 168줄 전수 삭제');

// 3. 구형 모바일 현장 접수 폼 유령 코드 355줄 전수 삭제 (라인 2059 ~ 2415)
// 먼저 시작점과 끝점 문자열 추출
const targetGhostFormStart = `    // Photo uploads inside representative dashboard
    const mobFileZoneMob = document.getElementById('mobile-file-zone-mob');`;

const targetGhostFormEnd = `                if (btnSubmitBizItemMob) {
                    btnSubmitBizItemMob.disabled = false;
                    btnSubmitBizItemMob.textContent = '현장 물건으로 등록';
                }
            }
        });
    }`;

const idxStart = appJs.indexOf(targetGhostFormStart);
const idxEnd = appJs.indexOf(targetGhostFormEnd);
if (idxStart !== -1 && idxEnd !== -1) {
    const fullGhostForm = appJs.substring(idxStart, idxEnd + targetGhostFormEnd.length);
    appJs = appJs.replace(fullGhostForm, '');
    console.log(`✅ [성공] 3. 구형 모바일 접수 폼 유령 코드 355줄 전수 삭제 (글로벌 바텀시트 충돌 원천 제거)`);
    changesCount++;
} else {
    console.error(`❌ [실패] 3. 구형 모바일 접수 폼 위치 탐색 실패 (idxStart=${idxStart}, idxEnd=${idxEnd})`);
}

// 4. clearBizUploadFormMob 유령 함수 삭제 (라인 923 ~ 944)
const targetClearBizUpload = `    // 로그아웃 / 세션 전환 시 현장 접수 폼 완전 초기화
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
    window.clearBizUploadFormMob = clearBizUploadFormMob;`;

safeReplace(targetClearBizUpload, '', '4. clearBizUploadFormMob 유령 함수 삭제');

// 5. 가짜 ID 리스너 6종 삭제
// 5-1. app-menu-trigger
const targetMenuTrigger = `    const menuTrigger = document.getElementById('app-menu-trigger');
    const drawerOverlay = document.getElementById('app-drawer-overlay');`;
safeReplace(targetMenuTrigger, `    const drawerOverlay = document.getElementById('app-drawer-overlay');`, '5-1. app-menu-trigger 유령 ID 참조 삭제');

const targetMenuTriggerListener = `    if (menuTrigger) {
        menuTrigger.addEventListener('click', openDrawer);
    }`;
safeReplace(targetMenuTriggerListener, '', '5-2. app-menu-trigger 유령 리스너 삭제');

// 5-3. pc-footer-btn-inquiry
const targetPcFooterInquiry = `    const pcFooterBtnInquiry = document.getElementById('pc-footer-btn-inquiry');
    if (pcFooterBtnInquiry) {
        pcFooterBtnInquiry.addEventListener('click', window.openInquiryModal);
    }`;
safeReplace(targetPcFooterInquiry, '', '5-3. pc-footer-btn-inquiry 유령 리스너 삭제');

// 5-4. nav-search-btn & m-nav-search
const targetNavSearch = `    const navSearchBtn = document.getElementById('nav-search-btn');
    if (navSearchBtn) navSearchBtn.addEventListener('click', (e) => { e.preventDefault(); openGlobalSearchModal(); });
    const mNavSearch = document.getElementById('m-nav-search');
    if (mNavSearch) mNavSearch.addEventListener('click', (e) => { e.preventDefault(); openGlobalSearchModal(); });`;
safeReplace(targetNavSearch, '', '5-4. nav-search-btn & m-nav-search 유령 리스너 삭제');

// 5-5. owner-sms-auth-group 등
const targetOwnerSms = `    // 미선언 변수 방어 처리 (Element 안전 참조)
    const ownerSmsAuthGroup = document.getElementById('owner-sms-auth-group');
    const btnOwnerSmsAuth = document.getElementById('btn-owner-sms-auth');
    const ownerPhoneCheckMsg = document.getElementById('owner-phone-check-msg');

    if (typeof ownerSmsTimerInterval !== 'undefined' && ownerSmsTimerInterval) {
      clearInterval(ownerSmsTimerInterval);
    }
    if (ownerSmsAuthGroup) ownerSmsAuthGroup.style.display = 'none';
    if (btnOwnerSmsAuth) btnOwnerSmsAuth.disabled = false;
    if (ownerPhoneCheckMsg) {
      ownerPhoneCheckMsg.textContent = '';
      ownerPhoneCheckMsg.className = 'form-helper';
    }`;
safeReplace(targetOwnerSms, '', '5-5. owner-sms-auth-group 등 구형 SMS 잔재 찌꺼기 삭제');

// 6. DataStore vs localStorage 3중 삼항연산자 땜빵 21곳 단순화
const patchyReplacements = [
    {
        from: `(typeof DataStore !== 'undefined' && DataStore.saveInquiries ? DataStore.saveInquiries(currentInquiries) : localStorage.setItem('inquiries', JSON.stringify(currentInquiries)));`,
        to: `saveInquiriesSSOT(currentInquiries);`
    },
    {
        from: `(typeof DataStore !== 'undefined' && DataStore.saveInquiries ? DataStore.saveInquiries(inquiries) : localStorage.setItem('inquiries', JSON.stringify(inquiries)));`,
        to: `saveInquiriesSSOT(inquiries);`
    },
    {
        from: `(typeof DataStore !== 'undefined' && DataStore.saveUsers ? DataStore.saveUsers(users) : localStorage.setItem('users', JSON.stringify(users)));`,
        to: `saveUsersSSOT(users);`
    },
    {
        from: `(typeof DataStore !== 'undefined' && DataStore.saveUsers ? DataStore.saveUsers(curUsers) : localStorage.setItem('users', JSON.stringify(curUsers)));`,
        to: `saveUsersSSOT(curUsers);`
    },
    {
        from: `(typeof DataStore !== 'undefined' && DataStore.saveApplications ? DataStore.saveApplications(apps) : localStorage.setItem('applications', JSON.stringify(apps)));`,
        to: `saveApplicationsSSOT(apps);`
    },
    {
        from: `(typeof DataStore !== 'undefined' && DataStore.saveApplications ? DataStore.saveApplications(curApps) : localStorage.setItem('applications', JSON.stringify(curApps)));`,
        to: `saveApplicationsSSOT(curApps);`
    },
    {
        from: `if (window.DataStore && typeof window.DataStore.saveUsers === 'function') {
                window.DataStore.saveUsers(users);
            } else {
                (typeof DataStore !== 'undefined' && DataStore.saveUsers ? DataStore.saveUsers(users) : localStorage.setItem('users', JSON.stringify(users)));
            }`,
        to: `saveUsersSSOT(users);`
    },
    {
        from: `if (window.DataStore && typeof window.DataStore.saveApplications === 'function') {
            window.DataStore.saveApplications(apps);
        } else {
            (typeof DataStore !== 'undefined' && DataStore.saveApplications ? DataStore.saveApplications(apps) : localStorage.setItem('applications', JSON.stringify(apps)));
        }`,
        to: `saveApplicationsSSOT(apps);`
    }
];

let patchySuccess = 0;
patchyReplacements.forEach((pr, i) => {
    while (appJs.includes(pr.from)) {
        appJs = appJs.replace(pr.from, pr.to);
        patchySuccess++;
    }
});
console.log(`✅ [성공] 6. 3중 삼항연산자 땜빵 구문 총 ${patchySuccess}개 단순화 단일화 완료!`);
changesCount += patchySuccess;

if (isCRLF) {
    appJs = appJs.replace(/\n/g, '\r\n');
}
fs.writeFileSync(appPath, appJs, 'utf8');

// 7. app.css 내 중복 Google Fonts @import 정리
const appCssPath = path.resolve('app.css');
let appCss = fs.readFileSync(appCssPath, 'utf8');
const dupImport = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Noto+Sans+KR:wght@300;400;500;700;900&family=Black+Han+Sans&family=Do+Hyeon&family=Jua&family=Nanum+Pen+Script&family=Gowun+Batang&display=swap');`;
if (appCss.includes(dupImport)) {
    appCss = appCss.replace(dupImport, '/* Google Fonts loaded centrally from style.css */');
    fs.writeFileSync(appCssPath, appCss, 'utf8');
    console.log(`✅ [성공] 7. app.css 내 중복 Google Fonts @import 최적화 완료 (style.css 단일 로드로 네트워크 절감)`);
    changesCount++;
}

console.log(`\n🎉 총 ${changesCount}개 최적화 및 유령/중복/땜빵 코드 완전 정리 성공!`);
