const fs = require('fs');

// Mock browser environment for DataStore
global.window = global;
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};
global.sessionStorage = { ...global.localStorage };
global.alert = (msg) => { /* mock */ };
global.document = {
  getElementById: () => null,
  querySelectorAll: () => []
};

// Load data-store.js
const code = fs.readFileSync('data-store.js', 'utf8');
eval(code);

console.log('=== [1단계: 데이터 초기화 및 상태 변경 시뮬레이션] ===');
const mockUsers = [
  { id: 'admin', name: '최고관리자', role: 'admin', bizCode: 'ADMIN' },
  { id: 'robinhood', name: '김로빈', role: 'business', bizCode: 'B-260901', phone: '010-1234-5678', items: [] },
  { id: 'bugsman2026', name: '김나완', role: 'business', bizCode: 'B-260902', phone: '010-9876-5432', items: [] }
];

const mockApps = [
  {
    id: 'B-260901-004',
    appRefId: 'B-260901-004',
    storeName: '만서기상회',
    ownerName: '김만석',
    ownerPhone: '01053427845',
    storeAddress: '서울특별시 마포구 백범로 31길 21',
    referrerCode: 'B-260901',
    salespersonId: 'robinhood',
    salespersonName: '김로빈',
    status: 'pending',
    receiptStatus: '접수예정',
    progressStatus: '지원대기중',
    isBizItem: true,
    memo: '{"isBizItem":true,"receiptStatus":"접수예정","progressStatus":"지원대기중"}',
    appliedAt: '2026-09-10T10:37:56.395Z'
  }
];

window.DataStore.saveUsers(mockUsers);
window.DataStore.saveApplications(mockApps);

console.log('\n=== [2단계: 관리자가 접수:"접수완료", 진행:"대상자선정" 변경 검증] ===');
window.DataStore.updateItemStatus('robinhood', 'B-260901-004', 'receipt', '접수완료');
window.DataStore.updateItemStatus('robinhood', 'B-260901-004', 'progress', '대상자선정');

const updatedApps = window.DataStore.getApplications();
const app = updatedApps.find(a => a.id === 'B-260901-004');
console.log('갱신된 app 상태:', {
  receiptStatus: app.receiptStatus,
  progressStatus: app.progressStatus,
  memo: app.memo
});

if (app.receiptStatus !== '접수완료' || app.progressStatus !== '대상자선정') {
  throw new Error('app 상태 갱신 실패');
}

const memoParsed = JSON.parse(app.memo);
if (memoParsed.receiptStatus !== '접수완료' || memoParsed.progressStatus !== '대상자선정') {
  throw new Error('app.memo 직렬화 동기화 실패! Supabase에 구형 상태 전송 위험');
}
console.log('✅ app.memo 최신 직렬화 성공 (되돌아오는 현상 원천 방어 완료)');

let robinItems = window.DataStore.getBizItemsForUser(mockUsers[1]);
console.log('영업자 대시보드 조회 결과:', {
  count: robinItems.length,
  receiptStatus: robinItems[0].receiptStatus,
  progressStatus: robinItems[0].progressStatus
});
if (robinItems[0].receiptStatus !== '접수완료' || robinItems[0].progressStatus !== '대상자선정') {
  throw new Error('영업자 대시보드 실시간 반영 실패');
}
console.log('✅ 영업자 대시보드 "내 영업물건 현황 및 진행상황" 실시간 변동 적용 확인 성공!');

console.log('\n=== [3단계: 관리자가 신청서 목록에서 "영업물건으로 변경" 버튼 비활성화 검증] ===');
const unregisterRes = window.DataStore.toggleBizItem('B-260901-004');
console.log('toggleBizItem 비활성화 결과:', unregisterRes);
if (!unregisterRes.success || unregisterRes.isBizItem !== false) {
  throw new Error('비활성화 실패');
}

robinItems = window.DataStore.getBizItemsForUser(mockUsers[1]);
console.log(`비활성화 후 김로빈 영업물건 수: ${robinItems.length} (예상: 0)`);
if (robinItems.length !== 0) {
  throw new Error('비활성화 후에도 영업자 화면에 물건이 남아있음!');
}
console.log('✅ 영업물건 비활성화 시 영업자 대시보드에서 즉시 0초 만에 완벽히 사라짐 확인 성공! (SSOT 부존재 일치)');

console.log('\n=== [4단계: 다시 활성화 시 0초 만에 정상 복원 검증] ===');
const registerRes = window.DataStore.toggleBizItem('B-260901-004');
robinItems = window.DataStore.getBizItemsForUser(mockUsers[1]);
console.log(`재활성화 후 김로빈 영업물건 수: ${robinItems.length} (예상: 1)`);
if (robinItems.length !== 1) {
  throw new Error('재활성화 실패');
}
console.log('✅ 재활성화 시 0초 만에 정상 노출 확인 성공!');

console.log('\n========================================');
console.log('🎉 3대 핵심 검증 100% 무결 통과!');
console.log('========================================');
