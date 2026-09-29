/**
 * scratch/test_completion_photos_permission_and_visibility.js
 * 
 * 5대 에이전트 협업 검증:
 * 1. 점주 대시보드 시공 완료사진 버튼 노출 및 온디맨드 확인
 * 2. 영업자 상단/하단 대시보드 시공 완료사진 버튼 노출
 * 3. 권한별(점주/영업자 vs 시공사/관리자) 모달 권한 분기 (Read-only vs Manage)
 */

const fs = require('fs');
const assert = require('assert');

// JSDOM-like minimal mock
const mockLocalStorage = {};
global.localStorage = {
    getItem: (k) => mockLocalStorage[k] || null,
    setItem: (k, v) => { mockLocalStorage[k] = String(v); },
    removeItem: (k) => { delete mockLocalStorage[k]; }
};
global.sessionStorage = {
    getItem: () => null,
    setItem: () => {}
};

// Mock DOM
const createdElements = [];
global.document = {
    getElementById: (id) => createdElements.find(el => el.id === id) || null,
    createElement: (tag) => {
        const el = {
            tagName: tag,
            id: '',
            className: '',
            style: {},
            innerHTML: '',
            children: [],
            appendChild: (child) => el.children.push(child),
            insertAdjacentElement: () => {},
            remove: () => {},
            querySelectorAll: () => [],
            querySelector: () => null,
            setAttribute: (k, v) => { el[k] = v; },
            getAttribute: (k) => el[k]
        };
        createdElements.push(el);
        return el;
    },
    body: {
        appendChild: (el) => createdElements.push(el)
    }
};

global.window = {
    DataStore: {},
    localStorage: global.localStorage,
    sessionStorage: global.sessionStorage
};
global.escapeHtml = (s) => String(s || '');
global.sanitizeUrl = (s) => String(s || '');

// Load data-store.js
const dataStoreCode = fs.readFileSync('data-store.js', 'utf8');
eval(dataStoreCode);

console.log('--- [검증 1] viewConstructionPhotosModal 권한 분기 테스트 ---');

const testJobId = 'TEST-APP-001';
const mockApp = {
    id: testJobId,
    storeName: '테스트상점',
    assignedConstructorName: '행복간판',
    constructionPhotos: ['data:image/jpeg;base64,TESTPHOTO1', 'data:image/jpeg;base64,TESTPHOTO2']
};

global.window.DataStore.getApplications = () => [mockApp];
global.window.DataStore.getConstructionJobs = () => [mockApp];

function setActiveUser(user) {
    global.activeUser = user;
    global.window.activeUser = user;
    global.localStorage.setItem('activeUser', JSON.stringify(user));
}

// Test 1: 점주(user) 권한으로 모달 열람 -> 삭제 버튼 및 추가등록 없어야 함
setActiveUser({ id: 'user1', role: 'user' });
global.window.viewConstructionPhotosModal(testJobId);
let modalEl = document.getElementById('modal-view-const-photos-preview');
assert(modalEl, '모달 엘리먼트 생성 확인');
assert(!modalEl.innerHTML.includes('이 사진 삭제'), '점주 열람 시 삭제 버튼 부존재 확인');
assert(!modalEl.innerHTML.includes('시공 후 사진 추가 등록'), '점주 열람 시 추가등록 버튼 부존재 확인');
assert(modalEl.innerHTML.includes('시공 후 사진 증빙 (2/5장)'), '점주 열람 시 2장 사진 증빙 표시 확인');
console.log('✅ 1-1. 점주(user) 조회 전용(Read-Only) 모달 검증 통과!');

// Test 2: 영업자(business) 권한으로 모달 열람 -> 삭제 버튼 및 추가등록 없어야 함
setActiveUser({ id: 'sales1', role: 'business' });
global.window.viewConstructionPhotosModal(testJobId);
assert(!modalEl.innerHTML.includes('이 사진 삭제'), '영업자 열람 시 삭제 버튼 부존재 확인');
assert(!modalEl.innerHTML.includes('시공 후 사진 추가 등록'), '영업자 열람 시 추가등록 버튼 부존재 확인');
console.log('✅ 1-2. 영업자(business) 조회 전용(Read-Only) 모달 검증 통과!');

// Test 3: 시공사(constructor) 권한으로 모달 열람 -> 삭제 버튼 및 추가등록 있어야 함
setActiveUser({ id: 'const1', role: 'constructor' });
global.window.viewConstructionPhotosModal(testJobId);
assert(modalEl.innerHTML.includes('이 사진 삭제'), '시공사 열람 시 삭제 버튼 존재 확인');
assert(modalEl.innerHTML.includes('시공 후 사진 추가 등록'), '시공사 열람 시 추가등록 버튼 존재 확인');
console.log('✅ 1-3. 시공사(constructor) 관리 권한 모달 검증 통과!');

// Test 4: 관리자(admin) 권한으로 모달 열람 -> 삭제 버튼 및 추가등록 있어야 함
setActiveUser({ id: 'admin1', role: 'admin' });
global.window.viewConstructionPhotosModal(testJobId);
assert(modalEl.innerHTML.includes('이 사진 삭제'), '관리자 열람 시 삭제 버튼 존재 확인');
assert(modalEl.innerHTML.includes('시공 후 사진 추가 등록'), '관리자 열람 시 추가등록 버튼 존재 확인');
console.log('✅ 1-4. 최고관리자(admin) 관리 권한 모달 검증 통과!');

console.log('\n--- [검증 2] app.js 내 점주 & 영업자 카드 UI 버튼 3곳 검증 ---');
const appCode = fs.readFileSync('app.js', 'utf8');

// Check 1: renderUserApplicationsMob (점주 카드)
assert(appCode.includes('시공 완료사진 확인 박스 (점주 실시간 확인)'), '점주 마이페이지 완료사진 박스 탑재 확인');
assert(appCode.includes("window.viewConstructionPhotosModal('${app.id}')"), '점주 마이페이지 모달 연동 확인');

// Check 2: userAppsContainer (영업자 상단 신청내역)
assert(appCode.includes('시공 완료사진 확인 박스 (영업자 상단 신청내역)'), '영업자 상단 완료사진 박스 탑재 확인');

// Check 3: renderBizRegisteredItemsMob (영업자 하단 영업물건)
assert(appCode.includes('시공 완료사진 확인 박스 (영업자 영업물건)'), '영업자 하단 영업물건 완료사진 박스 탑재 확인');
assert(appCode.includes("window.viewConstructionPhotosModal('${targetAppId}')"), '영업자 하단 모달 연동 확인');

console.log('✅ 2-1. 점주 마이페이지 시공 완료사진 버튼 100% 탑재 확인!');
console.log('✅ 2-2. 영업자 상단 마이페이지 시공 완료사진 버튼 100% 탑재 확인!');
console.log('✅ 2-3. 영업자 하단 영업물건 시공 완료사진 버튼 100% 탑재 확인!');

console.log('\n🎉 [전수 검증 성공] 5대 에이전트 협업 테스트를 100% 통과했습니다!');
