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
global.alert = (msg) => { console.log('Mock Alert:', msg); };
global.document = {
  getElementById: () => null,
  querySelectorAll: () => []
};

// Load data-store.js
const code = fs.readFileSync('data-store.js', 'utf8');
eval(code);

console.log('=== [1단계: 데이터 초기화] ===');
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
    isBizItem: false,
    appliedAt: '2026-09-10T10:37:56.395Z'
  },
  {
    id: 'B-260902-001',
    appRefId: 'B-260902-001',
    storeName: '나완치킨',
    ownerName: '김나완',
    ownerPhone: '01098765432',
    storeAddress: '경기도 수원시',
    referrerCode: 'B-260902',
    salespersonId: 'bugsman2026',
    salespersonName: '김나완',
    status: 'pending',
    isBizItem: true,
    appliedAt: '2026-09-11T10:00:00.000Z'
  }
];

window.DataStore.saveUsers(mockUsers);
window.DataStore.saveApplications(mockApps);

console.log('초기 영업물건 조회 (B-260901-004 미등록 상태):');
let robinItems = window.DataStore.getBizItemsForUser(mockUsers[1]);
console.log(`김로빈 영업물건 수: ${robinItems.length} (예상: 0)`);
if (robinItems.length !== 0) throw new Error('초기 상태 실패');

console.log('\n=== [2단계: 관리자가 신청서 목록에서 "영업물건으로 변경" 버튼 클릭] ===');
const toggleRes = window.DataStore.toggleBizItem('B-260901-004');
console.log('toggleBizItem 결과:', toggleRes);
if (!toggleRes.success || !toggleRes.isBizItem) throw new Error('토글 실패');

robinItems = window.DataStore.getBizItemsForUser(mockUsers[1]);
console.log(`토글 후 김로빈 영업물건 수: ${robinItems.length} (예상: 1)`);
if (robinItems.length !== 1 || robinItems[0].id !== 'B-260901-004') {
  throw new Error(`김로빈 영업물건 등록 실패! 실제 수: ${robinItems.length}`);
}
console.log('✅ 김로빈 대시보드 "내 영업물건 현황" 노출 확인: 성공! (만서기상회 정상 노출)');

console.log('\n=== [3단계: 타 영업자 격리 검증 (김나완 대시보드)] ===');
let nawanItems = window.DataStore.getBizItemsForUser(mockUsers[2]);
console.log(`김나완 영업물건 수: ${nawanItems.length} (예상: 1 - 나완치킨만 존재해야 함)`);
const hasLeak = nawanItems.some(it => it.id === 'B-260901-004');
if (hasLeak) throw new Error('타인 물건 유출 버그 발생!');
console.log('✅ 타 영업자 대시보드 침범 0건 격리 확인: 성공!');

console.log('\n=== [4단계: 영업자 코드 정규화 폴백 검증 (B 없는 번호 260901-004 테스트)] ===');
const testAppWithoutB = {
  id: '260901-005',
  appRefId: '260901-005',
  storeName: '테스트상회',
  ownerName: '홍길동',
  referrerCode: '260901', // B 없음
  isBizItem: false
};
const curApps = window.DataStore.getApplications();
curApps.push(testAppWithoutB);
window.DataStore.saveApplications(curApps);

window.DataStore.toggleBizItem('260901-005');
robinItems = window.DataStore.getBizItemsForUser(mockUsers[1]);
console.log(`B 접두사 없는 건 토글 후 김로빈 영업물건 수: ${robinItems.length} (예상: 2)`);
if (robinItems.length !== 2) throw new Error('B 접두사 없는 건 매칭 실패!');
console.log('✅ B 접두사 유무 무관 정규화 매칭 확인: 성공!');

console.log('\n=== [5단계: 영업물건 해제 시 즉시 0초 제외 검증 (SSOT 부존재 일치 의무)] ===');
window.DataStore.toggleBizItem('B-260901-004');
robinItems = window.DataStore.getBizItemsForUser(mockUsers[1]);
console.log(`B-260901-004 해제 후 김로빈 영업물건 수: ${robinItems.length} (예상: 1)`);
const stillExists = robinItems.some(it => it.id === 'B-260901-004');
if (stillExists) throw new Error('해제 후 잔재 남아있음!');
console.log('✅ 영업물건 해제 시 즉시 제외 확인: 성공!');

console.log('\n========================================');
console.log('🎉 모든 3단계 자체 검증 100% 통과 완료!');
console.log('========================================');
