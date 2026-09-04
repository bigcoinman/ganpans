// scratch/test_progress_status_change.js
const fs = require('fs');
const path = require('path');

// Mock localStorage and window
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};
global.sessionStorage = {
  getItem: (k) => store['sess_' + k] || null,
  setItem: (k, v) => { store['sess_' + k] = String(v); },
  removeItem: (k) => { delete store['sess_' + k]; }
};
global.window = global;
global.document = {
  activeElement: null,
  dispatchEvent: () => {},
  addEventListener: () => {}
};
global.CustomEvent = class { constructor(type, detail) { this.type = type; this.detail = detail; } };

// Load data-store.js
eval(fs.readFileSync(path.join(__dirname, '../data-store.js'), 'utf8'));

console.log('===============================================================');
console.log('🧪 [영업물건 진행상황 "대상자선정" 변경 및 시공업체 연동 전수 검증]');
console.log('===============================================================');

// 1. Setup Admin, BizUser, ConstUser, and App
const adminUser = { id: 'admin', name: '최고관리자', role: 'admin' };
const bizUser = {
  id: 'bugsman2026',
  name: '김나완',
  bizCode: 'B-260901',
  role: 'business',
  items: [{
    id: 'B-260901-001',
    appRefId: 'B-260901-001',
    name: '나완베이커리',
    phone: '010-9999-8888',
    address: '서울시 송파구',
    receiptStatus: '접수예정',
    progressStatus: '지원대기중'
  }]
};
const constUser = {
  id: 'constuser',
  name: '박시공',
  constCode: 'C-260801',
  businessName: '(주)우주간판시공',
  role: 'constructor',
  items: []
};
const appItem = {
  id: 'B-260901-001',
  userId: 'bugsman2026',
  referrerCode: 'B-260901',
  ownerName: '김나완',
  ownerPhone: '010-9999-8888',
  storeName: '나완베이커리',
  storeAddress: '서울시 송파구',
  isBizItem: true,
  receiptStatus: '접수예정',
  progressStatus: '지원대기중',
  status: 'pending'
};

window.DataStore.saveUsers([adminUser, bizUser, constUser]);
window.DataStore.saveApplications([appItem]);

console.log('1. 초기 상태:');
console.log('   - 신청서 progressStatus:', window.DataStore.getApplications()[0].progressStatus);
console.log('   - 시공업체 전체 목록 건수 (변경 전):', window.DataStore.getConstructionJobs(adminUser).length);

// 2. Change status to "대상자선정"
console.log('\n2. "대상자선정" 상태로 드롭다운 변경 실행...');
const updateRes = window.DataStore.updateItemStatus(bizUser.id, 'B-260901-001', 'progress', '대상자선정');
console.log('   - updateItemStatus 결과:', updateRes);

if (!updateRes || !updateRes.success) {
  console.error('❌ [FAIL] updateItemStatus 실행 실패!');
  process.exit(1);
}

// 3. Verify Applications & Users.items updated
const updatedApps = window.DataStore.getApplications();
const targetApp = updatedApps.find(a => a.id === 'B-260901-001');
console.log('   - 변경 후 신청서 progressStatus:', targetApp.progressStatus);
console.log('   - 변경 후 신청서 status:', targetApp.status);
console.log('   - 변경 후 신청서 constructionStatus:', targetApp.constructionStatus);

const updatedUsers = window.DataStore.getUsers();
const updatedBiz = updatedUsers.find(u => u.id === 'bugsman2026');
console.log('   - 영업자 items[0] progressStatus:', updatedBiz.items[0].progressStatus);

if (targetApp.progressStatus === '대상자선정' && updatedBiz.items[0].progressStatus === '대상자선정') {
  console.log('✅ [PASS] 신청서 및 영업자 items 모두 "대상자선정"으로 정상 동기화 완료!');
} else {
  console.error('❌ [FAIL] 상태 동기화 불일치!');
  process.exit(1);
}

// 4. Verify constructor dashboard jobs
console.log('\n3. 최고관리자 "시공업체 진행현황 (전체 시공 배정건)" 실시간 목록 확인:');
const adminConstJobs = window.DataStore.getConstructionJobs(adminUser);
console.log('   - 시공 목록 건수:', adminConstJobs.length);
if (adminConstJobs.length === 1 && adminConstJobs[0].storeName === '나완베이커리') {
  console.log('✅ [PASS] "대상자선정" 변경 즉시 최고관리자 시공업체 진행현황 목록에 100% 정상 노출!');
} else {
  console.error('❌ [FAIL] 시공업체 진행현황 목록 누락!');
  process.exit(1);
}

// 5. Assign Constructor and verify constructor partner view
console.log('\n4. 시공사 배정 실행 (constuser 배정)...');
window.DataStore.assignConstructorToBizItem('bugsman2026', 'B-260901-001', 'constuser');
const constPartnerJobs = window.DataStore.getConstructionJobs(constUser);
console.log('   - 시공사(constuser) 파트너 뷰 목록 건수:', constPartnerJobs.length);
if (constPartnerJobs.length === 1 && constPartnerJobs[0].assignedConstructorId === 'constuser') {
  console.log('✅ [PASS] 시공사 전용 대시보드에도 실시간 100% 정상 연동 확인!');
} else {
  console.error('❌ [FAIL] 시공사 전용 뷰 연동 실패!');
  process.exit(1);
}

console.log('\n===============================================================');
console.log('🎉 [전수 검증 완료] 최고관리자 진행상황 및 시공업체 진행현황 100% 정상 동작 확인!');
console.log('===============================================================');
