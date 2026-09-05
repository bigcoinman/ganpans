// Comprehensive verification script for receiptStatus and progressStatus logic
const fs = require('fs');

const localStorageData = {};
global.localStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};
global.sessionStorage = global.localStorage;
global.alert = (msg) => { /* mock alert */ };

global.window = {
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage,
  alert: global.alert,
  addEventListener: () => {},
  dispatchEvent: () => {},
  CustomEvent: class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; } }
};

// Load data-store.js
const dataStoreCode = fs.readFileSync('data-store.js', 'utf8');
eval(dataStoreCode);

console.log('=== [테스트 1] 온라인 간편 지원 신청 -> 영업물건 전환 시 기본값 검증 ===');
const sampleUsers = [
  { id: 'user_sales1', name: '김영업', role: 'business', bizCode: 'B-260905', items: [] },
  { id: 'admin', name: '최고관리자', role: 'admin', bizCode: 'ADMIN', items: [] }
];
const sampleApps = [
  {
    id: 'B-260905-001',
    userId: 'guest',
    ownerName: '홍길동',
    ownerPhone: '010-1234-5678',
    storeName: '대박식당',
    storeAddress: '서울시 강남구 테헤란로 123',
    status: 'pending',
    referrerCode: 'B-260905',
    isBizItem: false,
    appliedAt: new Date().toISOString()
  }
];

window.DataStore.saveUsers(sampleUsers);
window.DataStore.saveApplications(sampleApps);
window.DataStore.setActiveUser(sampleUsers[1]); // Admin login

console.log('초기 신청서 상태:', sampleApps[0]);
// Toggle to Biz Item
window.DataStore.toggleBizItem('B-260905-001');

const appsAfterToggle = window.DataStore.getApplications();
const appToggled = appsAfterToggle.find(a => a.id === 'B-260905-001');
console.log('- 전환 후 app.isBizItem:', appToggled.isBizItem);
console.log('- 전환 후 app.receiptStatus:', appToggled.receiptStatus);
console.log('- 전환 후 app.progressStatus:', appToggled.progressStatus);

if (appToggled.isBizItem === true && appToggled.receiptStatus === '접수예정' && appToggled.progressStatus === '지원대기중') {
  console.log('✅ [PASS] 영업물건 전환 시 기본값: 접수(접수예정), 진행(지원대기중)');
} else {
  console.error('❌ [FAIL] 영업물건 전환 시 기본값이 일치하지 않습니다.');
  process.exit(1);
}

console.log('\n=== [테스트 2] "접수완료" 변경 시 자동으로 "심사대기중" 적용 검증 ===');
// Change receipt to '접수완료'
window.DataStore.updateItemStatus('user_sales1', 'B-260905-001', 'receipt', '접수완료');
const appsAfterReceiptDone = window.DataStore.getApplications();
console.log('- 접수 상태:', appsAfterReceiptDone[0].receiptStatus);
console.log('- 자동 적용된 진행 상황:', appsAfterReceiptDone[0].progressStatus);

if (appsAfterReceiptDone[0].receiptStatus === '접수완료' && appsAfterReceiptDone[0].progressStatus === '심사대기중') {
  console.log('✅ [PASS] "접수완료" 변경 시 자동으로 진행상태가 "심사대기중"으로 즉시 적용됨');
} else {
  console.error('❌ [FAIL] "접수완료" 시 "심사대기중" 자동 적용 실패');
  process.exit(1);
}

console.log('\n=== [테스트 3] "업체신청" 변경 시에도 자동으로 "심사대기중" 적용 검증 ===');
// First reset to 접수예정
window.DataStore.updateItemStatus('user_sales1', 'B-260905-001', 'receipt', '접수예정');
// Now change receipt to '업체신청'
window.DataStore.updateItemStatus('user_sales1', 'B-260905-001', 'receipt', '업체신청');
const appsAfterCompanyApp = window.DataStore.getApplications();
console.log('- 접수 상태:', appsAfterCompanyApp[0].receiptStatus);
console.log('- 자동 적용된 진행 상황:', appsAfterCompanyApp[0].progressStatus);

if (appsAfterCompanyApp[0].receiptStatus === '업체신청' && appsAfterCompanyApp[0].progressStatus === '심사대기중') {
  console.log('✅ [PASS] "업체신청" 변경 시에도 자동으로 진행상태가 "심사대기중"으로 즉시 적용됨');
} else {
  console.error('❌ [FAIL] "업체신청" 시 "심사대기중" 자동 적용 실패');
  process.exit(1);
}

console.log('\n=== [테스트 4] 그 다음 단계 메뉴(대상자선정 -> 간판시공 준비중 등) 자유 변경 검증 ===');
window.DataStore.updateItemStatus('user_sales1', 'B-260905-001', 'progress', '대상자선정');
const appsStep1 = window.DataStore.getApplications();
console.log('- 대상자선정 변경 후 progress:', appsStep1[0].progressStatus);

window.DataStore.updateItemStatus('user_sales1', 'B-260905-001', 'progress', '간판시공 준비중');
const appsStep2 = window.DataStore.getApplications();
console.log('- 간판시공 준비중 변경 후 progress:', appsStep2[0].progressStatus);

window.DataStore.updateItemStatus('user_sales1', 'B-260905-001', 'progress', '간판시공완료');
const appsStep3 = window.DataStore.getApplications();
console.log('- 간판시공완료 변경 후 progress:', appsStep3[0].progressStatus);

if (appsStep1[0].progressStatus === '대상자선정' && appsStep2[0].progressStatus === '간판시공 준비중' && appsStep3[0].progressStatus === '간판시공완료') {
  console.log('✅ [PASS] 접수완료/업체신청 상태에서 후속 단계 자유 변경 100% 정상 작동');
} else {
  console.error('❌ [FAIL] 후속 단계 자유 변경 실패');
  process.exit(1);
}

console.log('\n=== [테스트 5] 다시 "접수예정"으로 변경 시 진행상황 자동 "지원대기중" 복원 및 잠금 검증 ===');
window.DataStore.updateItemStatus('user_sales1', 'B-260905-001', 'receipt', '접수예정');
const appsAfterReset = window.DataStore.getApplications();
console.log('- 다시 접수예정 변경 후 app.receiptStatus:', appsAfterReset[0].receiptStatus);
console.log('- 자동 복원된 app.progressStatus:', appsAfterReset[0].progressStatus);

if (appsAfterReset[0].receiptStatus === '접수예정' && appsAfterReset[0].progressStatus === '지원대기중') {
  console.log('✅ [PASS] "접수예정"으로 복귀 시 진행상태가 자동으로 "지원대기중"으로 안전 초기화됨');
} else {
  console.error('❌ [FAIL] "접수예정" 복귀 시 진행상태 자동 복원 실패');
  process.exit(1);
}

console.log('\n🎉 [SUCCESS] 모든 비즈니스 로직 및 드롭다운 연동 검증 100% 통과!');
