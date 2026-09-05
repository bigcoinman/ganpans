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
    updateUser: async function(uid, fields) { return true; }
  }
};
global.CustomEvent = global.window.CustomEvent;

// Load data-store.js
const dataStoreCode = fs.readFileSync('d:/1-Claude_Ai Projects - 2026-05/.vscode-shared/ganpans/data-store.js', 'utf8');
eval(dataStoreCode);

console.log('=== [대상자 선정 시 간판종류: 1. 플렉스 간판 기본 UI 표시 검증] ===');

const adminUser = { id: 'admin', name: '최고관리자', role: 'admin' };
const bizUser = { id: 'sales1', name: '김영업', role: 'business', bizCode: 'B-260901', items: [] };
const constUser = { id: 'builder1', name: '가나간판', role: 'constructor', constCode: 'C-260901', businessName: '(주)가나' };
window.DataStore.saveUsers([adminUser, bizUser, constUser]);
window.DataStore.setActiveUser(adminUser);

// Create app with default generic signType '간판지원신청'
const testApp = {
  id: 'B-260901-005',
  userId: 'sales1',
  salespersonId: 'sales1',
  salespersonName: '김영업',
  referrerCode: 'B-260901',
  ownerName: '홍길동',
  ownerPhone: '010-3333-4444',
  storeName: '길동상회',
  storeAddress: '서울시 종로구',
  isBizItem: true,
  status: 'pending',
  receiptStatus: '접수완료',
  progressStatus: '심사대기중',
  assignedConstructorId: 'builder1',
  assignedConstructorName: '(주)가나',
  signType: '간판지원신청'
};

window.DataStore.saveApplications([testApp]);

// Step 1: 최고관리자가 '대상자선정'으로 변경
window.DataStore.updateItemStatus('sales1', 'B-260901-005', 'progress', '대상자선정');

const apps = window.DataStore.getApplications();
const updatedApp = apps.find(a => a.id === 'B-260901-005');
console.log(`1. 대상자선정 변경 후 app.signType: [${updatedApp.signType}] -> ${updatedApp.signType === '플렉스 간판' ? '✅ PASS (플렉스 간판으로 자동 설정됨)' : '❌ FAIL'}`);

// Step 2: getConstructionJobs 호출 시 signType 검증
const constJobs = window.DataStore.getConstructionJobs();
const targetJob = constJobs.find(j => j.id === 'B-260901-005');
console.log(`2. getConstructionJobs의 job.signType: [${targetJob.signType}] -> ${targetJob.signType === '플렉스 간판' ? '✅ PASS' : '❌ FAIL'}`);

// Step 3: UI 드롭다운 기본 선택값 계산 시뮬레이션
const standardSignTypes = ['플렉스 간판', 'LED 채널 간판', '돌출 간판'];
let currentSignType = String(targetJob.signType || '').trim();
if (!currentSignType || currentSignType === '간판지원신청' || currentSignType === '간판' || currentSignType === '-' || currentSignType === 'undefined' || currentSignType === 'null') {
  currentSignType = '플렉스 간판';
}
const isCustomSignType = !standardSignTypes.includes(currentSignType) && currentSignType !== '';
const selectedDropdownVal = isCustomSignType ? 'custom' : currentSignType;

console.log(`3. 시공업체 진행현황 UI 드롭다운 선택값: [${selectedDropdownVal}] -> ${selectedDropdownVal === '플렉스 간판' ? '✅ PASS (1. 플렉스 간판이 기본 선택됨)' : '❌ FAIL'}`);
