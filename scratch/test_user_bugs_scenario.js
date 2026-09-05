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
  CustomEvent: function(type, detail) { return { type, detail }; },
  SupabaseSync: {
    updateApplication: async function(id, fields) { return true; },
    updateUser: async function(uid, fields) { return true; },
    upsertApplication: async function(app) { return true; }
  }
};
global.CustomEvent = global.window.CustomEvent;

// Load data-store.js
const dataStoreCode = fs.readFileSync('d:/1-Claude_Ai Projects - 2026-05/.vscode-shared/ganpans/data-store.js', 'utf8');
eval(dataStoreCode);

console.log('=== [사용자 제보 2대 현상 정밀 시뮬레이션 및 검증] ===');

// Setup mock users
const adminUser = { id: 'admin', name: '최고관리자', role: 'admin' };
const bizUser = { id: 'sales1', name: '김영업', role: 'business', bizCode: 'B-260901', items: [] };
const constUser = { id: 'builder1', name: '가나간판', role: 'constructor', constCode: 'C-260901', businessName: '(주)가나' };
window.DataStore.saveUsers([adminUser, bizUser, constUser]);
window.DataStore.setActiveUser(adminUser);

// Create 3 items:
// Item 1: 진수상회 (김진수, 010-9986-7135, B-260901-003)
// Item 2: 진수건업 (김진수, 010-9986-7135, P-260905-002) -> 같은 점주/연락처
// Item 3: 대박치킨 (박대박, 010-1111-2222, B-260901-001)
const app1 = {
  id: 'B-260901-003',
  userId: 'sales1',
  salespersonId: 'sales1',
  salespersonName: '김영업',
  referrerCode: 'B-260901',
  ownerName: '김진수',
  ownerPhone: '010-9986-7135',
  storeName: '진수상회',
  isBizItem: true,
  status: 'approved',
  receiptStatus: '접수예정',
  progressStatus: '지원대기중',
  assignedConstructorId: 'builder1',
  assignedConstructorName: '(주)가나',
  signType: 'LED 채널간판'
};

const app2 = {
  id: 'P-260905-002',
  userId: 'sales1',
  salespersonId: 'sales1',
  salespersonName: '김영업',
  referrerCode: 'B-260901',
  ownerName: '김진수',
  ownerPhone: '010-9986-7135',
  storeName: '진수건업',
  isBizItem: true,
  status: 'approved',
  receiptStatus: '접수예정',
  progressStatus: '지원대기중',
  assignedConstructorId: '',
  assignedConstructorName: '',
  signType: '돌출간판'
};

const app3 = {
  id: 'B-260901-001',
  userId: 'sales1',
  salespersonId: 'sales1',
  salespersonName: '김영업',
  referrerCode: 'B-260901',
  ownerName: '박대박',
  ownerPhone: '010-1111-2222',
  storeName: '대박치킨',
  isBizItem: true,
  status: 'approved',
  receiptStatus: '접수예정',
  progressStatus: '지원대기중',
  assignedConstructorId: '',
  assignedConstructorName: '',
  signType: '플렉스간판'
};

window.DataStore.saveApplications([app1, app2, app3]);

// [현상 1 검증]: "진수상회"의 "접수" 상태를 '접수완료'로 변경, "진행" 상태를 '심사대기'로 변경
console.log('\n--- [현상 1 검증]: 진수상회 상태 변경 시 타 업체(진수건업, 대박치킨) 오염 여부 ---');
window.DataStore.updateItemStatus('sales1', 'B-260901-003', 'receipt', '접수완료');
window.DataStore.updateItemStatus('sales1', 'B-260901-003', 'progress', '심사대기');

let apps = window.DataStore.getApplications();
let jinsuStore = apps.find(a => a.id === 'B-260901-003');
let jinsuConst = apps.find(a => a.id === 'P-260905-002');
let daebak = apps.find(a => a.id === 'B-260901-001');

console.log(`진수상회(목표): 접수=${jinsuStore.receiptStatus}, 진행=${jinsuStore.progressStatus} -> ${jinsuStore.receiptStatus === '접수완료' && jinsuStore.progressStatus === '심사대기' ? '✅ 정상' : '❌ 오류'}`);
console.log(`진수건업(동일연락처): 접수=${jinsuConst.receiptStatus}, 진행=${jinsuConst.progressStatus} -> ${jinsuConst.receiptStatus === '접수예정' && jinsuConst.progressStatus === '지원대기중' ? '✅ 독립 유지 (PASS)' : '❌ 오염됨 (FAIL)'}`);
console.log(`대박치킨(타업체): 접수=${daebak.receiptStatus}, 진행=${daebak.progressStatus} -> ${daebak.receiptStatus === '접수예정' && daebak.progressStatus === '지원대기중' ? '✅ 독립 유지 (PASS)' : '❌ 오염됨 (FAIL)'}`);

// [현상 2 검증]:
// 1) 1개 업체를 "대상자선정"으로 변경
// 2) "시공업체 진행현황"에서 간판종류 변경 (updateJobSignType)
// 3) 최고관리자가 "접수 & 진행" 메뉴 선택 변경 시도
console.log('\n--- [현상 2 검증]: 대상자선정 -> 간판종류 변경 -> 최고관리자 접수/진행 변경 연계 동작 ---');
window.DataStore.updateItemStatus('sales1', 'B-260901-003', 'progress', '대상자선정');
apps = window.DataStore.getApplications();
jinsuStore = apps.find(a => a.id === 'B-260901-003');
console.log(`Step 1. 대상자선정 변경: 진행=${jinsuStore.progressStatus} -> ${jinsuStore.progressStatus === '대상자선정' ? '✅ PASS' : '❌ FAIL'}`);

// Step 2. 시공업체 화면에서 간판종류 변경
window.updateJobSignType('B-260901-003', 'LED 채널간판 + 경관조명 특수시공');
apps = window.DataStore.getApplications();
jinsuStore = apps.find(a => a.id === 'B-260901-003');
console.log(`Step 2. 시공업체 간판종류 변경: signType=${jinsuStore.signType}, 진행상태 유지=${jinsuStore.progressStatus} -> ${jinsuStore.signType === 'LED 채널간판 + 경관조명 특수시공' && jinsuStore.progressStatus === '대상자선정' ? '✅ PASS' : '❌ FAIL'}`);

// Step 3. 최고관리자가 "간판시공 준비중"으로 후속 변경
window.DataStore.updateItemStatus('sales1', 'B-260901-003', 'progress', '간판시공 준비중');
apps = window.DataStore.getApplications();
jinsuStore = apps.find(a => a.id === 'B-260901-003');
console.log(`Step 3. 최고관리자 후속 상태변경: 진행=${jinsuStore.progressStatus} -> ${jinsuStore.progressStatus === '간판시공 준비중' ? '✅ 정상 변경 성공 (PASS)' : '❌ 먹통/실패 (FAIL)'}`);
