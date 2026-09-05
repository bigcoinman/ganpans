// scratch/test_dropdown_complete_verification.js
const fs = require('fs');
const path = require('path');

// Mock browser globals
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = String(val); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

global.localStorage = localStorageMock;
global.window = {
  localStorage: localStorageMock,
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  CustomEvent: class {}
};
global.document = {
  activeElement: null,
  addEventListener: () => {},
  removeEventListener: () => {}
};

// Load security-utils and data-store
require('../security-utils.js');
const dsCode = fs.readFileSync(path.join(__dirname, '../data-store.js'), 'utf8');
eval(dsCode);

console.log('🧪 [영업물건 진행상황 드롭다운 및 시공업체 연동 100% 전수 검증 시작]');

// 1. Initial Data Setup
const adminUser = { id: 'admin', name: '최고관리자', role: 'admin', bizCode: 'ADMIN' };
const bizUser = { id: 'biz_hong', name: '홍영업', role: 'business', bizCode: 'B-260905', items: [] };
const constUser = { id: 'const_master', name: '마스터간판', role: 'constructor', constCode: 'C-260901', businessName: '마스터간판기획', phone: '010-8888-7777' };

const appItem = {
  id: 'B-260905-001',
  appRefId: 'B-260905-001',
  userId: 'guest_user_1',
  ownerName: '박점주',
  ownerPhone: '010-3333-4444',
  storeName: '대박삼겹살',
  storeAddress: '서울시 강남구 테헤란로 123',
  referrerCode: 'B-260905',
  isBizItem: true,
  receiptStatus: '접수예정',
  progressStatus: '지원대기중',
  status: 'pending',
  constructionStatus: 'none',
  appliedAt: '2026-09-05T01:00:00.000Z'
};

window.DataStore.saveUsers([adminUser, bizUser, constUser]);
window.DataStore.saveApplications([appItem]);

console.log('\n[1단계] 초기 영업물건 목록 확인');
const initialAdminItems = window.DataStore.getAdminBizItems();
console.log(`- 영업물건 건수: ${initialAdminItems.length}건`);
console.log(`- 초기 접수: ${initialAdminItems[0].item.receiptStatus}, 진행: ${initialAdminItems[0].item.progressStatus}`);

// 2. Change Receipt Status -> '접수완료' via global window.updateItemStatus
console.log('\n[2단계] 접수 드롭다운 -> "접수완료" 변경');
const res1 = window.updateItemStatus(bizUser.id, appItem.id, 'receipt', '접수완료');
console.log('- updateItemStatus 결과:', res1);

const adminItemsAfterReceipt = window.DataStore.getAdminBizItems();
console.log(`- 변경 후 접수상태: ${adminItemsAfterReceipt[0].item.receiptStatus}`);
if (adminItemsAfterReceipt[0].item.receiptStatus !== '접수완료') {
  console.error('❌ [FAIL] 접수상태 변경 실패!');
  process.exit(1);
} else {
  console.log('✅ [PASS] 접수상태 "접수완료" 반영 성공');
}

// 3. Change Progress Status -> '대상자선정' via global window.updateItemStatus
console.log('\n[3단계] 진행 드롭다운 -> "대상자선정" 변경');
const res2 = window.updateItemStatus(bizUser.id, appItem.id, 'progress', '대상자선정');
console.log('- updateItemStatus 결과:', res2);

const adminItemsAfterProgress = window.DataStore.getAdminBizItems();
console.log(`- 변경 후 진행상황: ${adminItemsAfterProgress[0].item.progressStatus}`);
if (adminItemsAfterProgress[0].item.progressStatus !== '대상자선정') {
  console.error('❌ [FAIL] 진행상황 변경 실패!');
  process.exit(1);
} else {
  console.log('✅ [PASS] 진행상황 "대상자선정" 반영 성공');
}

// 4. Verify Construction Jobs Listing
console.log('\n[4단계] 시공업체 진행현황(getConstructionJobs) 실시간 노출 검증');
const constJobs = window.DataStore.getConstructionJobs();
console.log(`- 시공업체 진행현황 총 건수: ${constJobs.length}건`);
if (constJobs.length !== 1 || constJobs[0].id !== appItem.id) {
  console.error('❌ [FAIL] 시공업체 진행현황 목록에 물건이 나타나지 않음!');
  process.exit(1);
} else {
  console.log(`✅ [PASS] 시공업체 진행현황에 [${constJobs[0].storeName}] (${constJobs[0].id}) 정상 노출됨!`);
  console.log(`  - 시공 상태: ${constJobs[0].constructionStatus}`);
}

// 5. Change Progress Status -> '간판시공 준비중'
console.log('\n[5단계] 진행 드롭다운 -> "간판시공 준비중" 변경');
const res3 = window.updateItemStatus(bizUser.id, appItem.id, 'progress', '간판시공 준비중');
const constJobs2 = window.DataStore.getConstructionJobs();
console.log(`- 시공상태 확인: ${constJobs2[0].constructionStatus}`);
if (constJobs2[0].constructionStatus !== 'in_construction') {
  console.error('❌ [FAIL] 시공상태 in_construction 동기화 실패!');
  process.exit(1);
} else {
  console.log('✅ [PASS] 시공상태 in_construction 정상 동기화!');
}

// 6. Verify Salesperson Dashboard Sync (SSOT)
console.log('\n[6단계] 영업자 마이페이지(getBizItemsForUser) SSOT 실시간 동기화 검증');
const bizItems = window.DataStore.getBizItemsForUser(bizUser);
console.log(`- 영업자 목록 건수: ${bizItems.length}건`);
console.log(`- 영업자 화면 접수상태: ${bizItems[0].receiptStatus}, 진행상황: ${bizItems[0].progressStatus}`);
if (bizItems[0].receiptStatus !== '접수완료' || bizItems[0].progressStatus !== '간판시공 준비중') {
  console.error('❌ [FAIL] 영업자 마이페이지 동기화 불일치!');
  process.exit(1);
} else {
  console.log('✅ [PASS] 영업자 마이페이지 100% 실시간 일치 검증 성공!');
}

console.log('\n🎉 [모든 검증 100% 통과! 영구 해결 완료]');
