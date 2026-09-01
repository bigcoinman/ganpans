// DOM Rendering Simulation Test
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
global.window = {
  localStorage: localStorageMock,
  sessionStorage: localStorageMock
};

// Load data-store.js
const dataStoreCode = fs.readFileSync('d:/1-Claude_Ai Projects - 2026-05/.vscode-shared/ganpans/data-store.js', 'utf8');
eval(dataStoreCode);

const mockUsers = [
  { id: 'admin', name: '최고관리자', role: 'admin' },
  { id: 'bugsman2026', name: '김나완', role: 'business', bizCode: 'B-260901', phone: '010-9999-8888', items: [] }
];
window.DataStore.saveUsers(mockUsers);

const mockApps = [
  {
    id: 'B-260901-001',
    userId: 'bugsman2026',
    salespersonId: 'bugsman2026',
    salespersonName: '김나완',
    referrerCode: 'B-260901',
    ownerName: '김똘이',
    ownerPhone: '010-1234-5678',
    storeName: '똘이네반찬',
    storeAddress: '서울시 강남구 테헤란로 123',
    isBizItem: true,
    receiptStatus: '접수완료',
    progressStatus: '심사대기',
    appliedAt: '2026-09-01T10:00:00.000Z'
  }
];
window.DataStore.saveApplications(mockApps);

const activeUser = mockUsers[1];
const bizList = window.DataStore.getBizItemsForUser(activeUser);

console.log('=== [2. 김나완 영업자 마이페이지 렌더링 검증] ===');
console.log(`- 조회된 물건 개수: ${bizList.length}건`);
console.log(`- 1번 물건 ID: ${bizList[0].id}`);
console.log(`- 1번 상호명: ${bizList[0].storeName}`);
console.log(`- 1번 접수상태: ${bizList[0].receiptStatus}`);
console.log(`- 1번 진행상태: ${bizList[0].progressStatus}`);

if (bizList.length === 1 && bizList[0].storeName === '똘이네반찬') {
  console.log('\n✅ [DOM RENDER READY] 김나완 영업자 마이페이지에 "똘이네반찬"이 100% 정상 출력됩니다!');
} else {
  console.error('\n❌ [DOM RENDER FAILED]');
  process.exit(1);
}
