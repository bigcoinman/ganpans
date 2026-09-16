const fs = require('fs');
const path = require('path');

// 브라우저 모킹
const storage = {};
const localStorageMock = {
  getItem: (k) => (storage[k] !== undefined ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;
global.alert = function(msg) {};
global.confirm = function(msg) { return true; };

function createChain() {
  const chain = {
    select: function() { return this; },
    update: function() { return this; },
    upsert: function() { return this; },
    insert: function() { return this; },
    delete: function() { return this; },
    eq: function() { return this; },
    in: function() { return this; },
    then: function(resolve) {
      resolve({ data: [], error: null });
    }
  };
  return chain;
}

global.window = {
  localStorage: localStorageMock,
  sessionStorage: localStorageMock,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  location: { reload: () => {} },
  CustomEvent: function(type, detail) { return { type, detail }; },
  supabaseClient: {
    from: () => createChain(),
    channel: () => ({ on: function() { return this; }, subscribe: function() { return this; } })
  },
  showToast: function(msg) {},
  showNotification: function(msg) {}
};
global.CustomEvent = global.window.CustomEvent;

const dataStoreCode = fs.readFileSync(path.join(__dirname, '../data-store.js'), 'utf8');
eval(dataStoreCode);
const DataStore = global.window.DataStore;

console.log('==================================================================');
console.log('🚀 [영업자 변경/본사직접접수 즉시 반영] 5회 연속 전수 실증 테스트');
console.log('==================================================================');

for (let i = 1; i <= 5; i++) {
  console.log(`\n--- [CYCLE ${i} / 5 시작] ---`);

  // 1) 사용자 생성: 김로빈(B-260902), 김나완(B-260903)
  const robin = { id: 'robin', name: '김로빈', role: 'business', bizCode: 'B-260902', items: [] };
  const nawan = { id: 'nawan', name: '김나완', role: 'business', bizCode: 'B-260903', items: [] };
  DataStore.saveUsers([robin, nawan]);

  // 2) 신청서 생성: 안나플라워 (초기 김로빈 배정)
  const app = {
    id: 'B-260902-001',
    storeName: '안나플라워',
    ownerName: '안나',
    ownerPhone: '010-1234-5678',
    referrerCode: 'B-260902',
    salespersonId: 'robin',
    salespersonName: '김로빈',
    isBizItem: true,
    receiptStatus: '접수완료',
    progressStatus: '대상자선정'
  };
  DataStore.saveApplications([app]);

  // Step 1: 초기 김로빈 대시보드 확인
  let robinItems = DataStore.getBizItemsForUser(robin);
  if (robinItems.length !== 1) throw new Error(`[Cycle ${i}] Step 1 실패: 초기 김로빈 영업물건 1건이어야 함 (실제: ${robinItems.length})`);
  console.log(`[Cycle ${i}] Step 1: 김로빈 영업물건 정상 표시 (1건) ✅`);

  // Step 2: 최고관리자가 [본사직접접수]로 변경
  DataStore.updateApplicationReferrer('B-260902-001', '');
  robinItems = DataStore.getBizItemsForUser(robin);
  let nawanItems = DataStore.getBizItemsForUser(nawan);
  if (robinItems.length !== 0) throw new Error(`[Cycle ${i}] Step 2 실패: 본사직접접수 변경 후 김로빈 목록에서 사라지지 않음 (실제: ${robinItems.length})`);
  if (nawanItems.length !== 0) throw new Error(`[Cycle ${i}] Step 2 실패: 김나완에게도 0건이어야 함`);
  console.log(`[Cycle ${i}] Step 2: [본사직접접수] 변경 즉시 김로빈 목록에서 0건으로 실시간 제거 완료 ✅`);

  // Step 3: 최고관리자가 [김나완]으로 재배정
  DataStore.updateApplicationReferrer('B-260902-001', 'B-260903');
  robinItems = DataStore.getBizItemsForUser(robin);
  nawanItems = DataStore.getBizItemsForUser(nawan);
  if (robinItems.length !== 0) throw new Error(`[Cycle ${i}] Step 3 실패: 김로빈은 여전히 0건이어야 함`);
  if (nawanItems.length !== 1) throw new Error(`[Cycle ${i}] Step 3 실패: 김나완에게 1건으로 즉시 귀속되어야 함 (실제: ${nawanItems.length})`);
  console.log(`[Cycle ${i}] Step 3: [김나완] 변경 즉시 김나완 목록에 1건 실시간 귀속 완료 ✅`);

  // Step 4: 최고관리자가 다시 [본사직접접수]로 변경
  DataStore.updateApplicationReferrer('B-260902-001', '');
  robinItems = DataStore.getBizItemsForUser(robin);
  nawanItems = DataStore.getBizItemsForUser(nawan);
  if (robinItems.length !== 0 || nawanItems.length !== 0) throw new Error(`[Cycle ${i}] Step 4 실패: 둘 다 0건이어야 함`);
  console.log(`[Cycle ${i}] Step 4: [본사직접접수] 재변경 시 김나완 목록에서도 즉시 0건 제거 완료 ✅`);

  console.log(`🎯 [Cycle ${i}] 100% 무결점 통과 (PASS)`);
}

console.log('\n==================================================================');
console.log('🎉 5회 연속 전수 실증 테스트 100% ALL PASS (완벽 검증 완료)');
console.log('==================================================================');
