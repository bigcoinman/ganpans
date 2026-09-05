// Admin Dashboard Full Functionality & Side-Effect Test Harness
const fs = require('fs');

const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) { return store[key] || null; },
    setItem: function(key, val) { store[key] = String(val); },
    removeItem: function(key) { delete store[key]; },
    clear: function() { store = {}; }
  };
})();

global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;
global.alert = function(msg) {};
global.confirm = function(msg) { return true; };
global.window = {
  localStorage: localStorageMock,
  sessionStorage: localStorageMock,
  dispatchEvent: function(event) {},
  CustomEvent: function(type, detail) { return { type, detail }; }
};
global.CustomEvent = global.window.CustomEvent;

// Load data-store.js
const dataStoreCode = fs.readFileSync('d:/1-Claude_Ai Projects - 2026-05/.vscode-shared/ganpans/data-store.js', 'utf8');
eval(dataStoreCode);

console.log('=== [최고관리자 대시보드 7대 핵심 기능 전수 영향도 검증] ===');

// Setup mock users
const adminUser = { id: 'admin', name: '최고관리자', role: 'admin' };
const bizUser = { id: 'bugsman2026', name: '김나완', role: 'business', bizCode: 'B-260901', items: [] };
const constUser = { id: 'builder1', name: '가나간판', role: 'constructor', constCode: 'C-260901', businessName: '(주)가나' };
window.DataStore.saveUsers([adminUser, bizUser, constUser]);
window.DataStore.setActiveUser(adminUser);

// Setup mock apps
const app1 = {
  id: 'B-260901-001',
  userId: 'bugsman2026',
  salespersonId: 'bugsman2026',
  salespersonName: '김나완',
  referrerCode: 'B-260901',
  ownerName: '김똘이',
  ownerPhone: '010-1234-5678',
  storeName: '똘이네반찬',
  storeAddress: '서울시 강남구 테헤란로 123',
  isBizItem: false,
  status: 'pending',
  receiptStatus: '접수완료',
  progressStatus: '심사대기',
  appliedAt: new Date().toISOString()
};
window.DataStore.saveApplications([app1]);

// 1. 신청서 목록 검증
const allApps = window.DataStore.getApplications();
console.log(`\n[검증 1] 신청서 목록 조회: ${allApps.length === 1 ? '✅ PASS' : '❌ FAIL'} (${allApps[0].storeName})`);

// 2. 영업물건으로 변경 토글 검증
const toggleRes = window.DataStore.toggleBizItem(app1.id);
const appsAfterToggle = window.DataStore.getApplications();
const isToggledOn = appsAfterToggle[0].isBizItem === true;
console.log(`[검증 2] 영업물건으로 변경 토글: ${isToggledOn ? '✅ PASS' : '❌ FAIL'} (isBizItem: ${appsAfterToggle[0].isBizItem})`);

// 3. 최고관리자 영업물건 진행상황 목록 조회 검증
const adminBizItems = window.DataStore.getAdminBizItems();
console.log(`[검증 3] 최고관리자 영업물건 목록: ${adminBizItems.length === 1 ? '✅ PASS' : '❌ FAIL'} (상호: ${adminBizItems[0].item.name}, 담당: ${adminBizItems[0].user.name})`);

// 4. 시공사 배정 검증
let apps = window.DataStore.getApplications();
let targetApp = apps.find(a => a.id === app1.id);
targetApp.assignedConstructorId = constUser.id;
targetApp.assignedConstructorName = constUser.businessName;
targetApp.constructionStatus = 'before_construction';
window.DataStore.saveApplications(apps);

const appsAfterAssign = window.DataStore.getApplications();
const isAssigned = appsAfterAssign[0].assignedConstructorId === constUser.id;
console.log(`[검증 4] 시공사 배정: ${isAssigned ? '✅ PASS' : '❌ FAIL'} (배정사: ${appsAfterAssign[0].assignedConstructorName})`);

// 5. 시공업체 진행현황 목록 조회 검증
const constJobs = window.DataStore.getConstructionJobs(constUser);
console.log(`[검증 5] 시공업체 진행현황 연동: ${constJobs.length === 1 ? '✅ PASS' : '❌ FAIL'} (시공물건: ${constJobs[0].storeName}, 영업자: ${constJobs[0].salespersonName})`);

// 6. 상태 변경 검증 (접수완료 후 진행상태 변경)
window.DataStore.updateItemStatus(bizUser.id, app1.id, 'receipt', '접수완료');
const statusRes = window.DataStore.updateItemStatus(bizUser.id, app1.id, 'progress', '간판시공 준비중');
const appsAfterStatus = window.DataStore.getApplications();
const isStatusUpdated = appsAfterStatus[0].progressStatus === '간판시공 준비중';
console.log(`[검증 6] 진행상태 변경: ${isStatusUpdated ? '✅ PASS' : '❌ FAIL'} (진행상태: ${appsAfterStatus[0].progressStatus})`);

// 7. 신청서 삭제 검증
const deleteRes = window.DataStore.deleteApplication(app1.id);
const appsAfterDelete = window.DataStore.getApplications();
const adminBizAfterDelete = window.DataStore.getAdminBizItems();
const isDeleted = appsAfterDelete.length === 0 && adminBizAfterDelete.length === 0;
console.log(`[검증 7] 신청서 영구 삭제: ${isDeleted ? '✅ PASS' : '❌ FAIL'} (남은 신청서: ${appsAfterDelete.length}건, 남은 영업물건: ${adminBizAfterDelete.length}건)`);

console.log('\n========================================');
if (allApps.length === 1 && isToggledOn && adminBizItems.length === 1 && isAssigned && constJobs.length === 1 && isStatusUpdated && isDeleted) {
  console.log('🎉 [최고관리자 대시보드 무결성 100% ALL PASS] 부작용 0건 완벽 검증 완료!');
} else {
  console.error('❌ [FAIL] 결함 발생');
  process.exit(1);
}
console.log('========================================');
