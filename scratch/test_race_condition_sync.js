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
  addEventListener: function() {},
  CustomEvent: function(type, detail) { return { type, detail }; }
};
global.document = {
  readyState: 'complete',
  addEventListener: function() {},
  activeElement: null,
  querySelectorAll: function() { return []; },
  getElementById: function() { return null; }
};
global.CustomEvent = global.window.CustomEvent;

// Load security-utils.js and data-store.js
const secCode = fs.readFileSync('d:/1-Claude_Ai Projects - 2026-05/.vscode-shared/ganpans/security-utils.js', 'utf8');
const dataStoreCode = fs.readFileSync('d:/1-Claude_Ai Projects - 2026-05/.vscode-shared/ganpans/data-store.js', 'utf8');
eval(secCode);
eval(dataStoreCode);

console.log('=== [새로고침 직후 드롭다운 변경 시 Supabase 백그라운드 동기화 레이스 컨디션 검증] ===');

const adminUser = { id: 'admin', name: '최고관리자', role: 'admin' };
const bizUser = { id: 'sales1', name: '김영업', role: 'business', bizCode: 'B-260901', items: [] };
window.DataStore.saveUsers([adminUser, bizUser]);
window.DataStore.setActiveUser(adminUser);

// Initial application in localStorage & Supabase
const initialApp = {
  id: 'B-260901-001',
  userId: 'sales1',
  salespersonId: 'sales1',
  salespersonName: '김영업',
  referrerCode: 'B-260901',
  ownerName: '박대박',
  ownerPhone: '010-1111-2222',
  storeName: '대박치킨',
  storeAddress: '서울시 강남구',
  isBizItem: true,
  status: 'pending',
  receiptStatus: '접수예정',
  progressStatus: '지원대기중',
  appliedAt: new Date().toISOString()
};

window.DataStore.saveApplications([initialApp]);

// Step 1: User refreshes page & changes dropdown immediately (within 0.5s)
console.log('\n1. 새로고침 직후 관리자가 [접수: 접수완료], [진행: 대상자선정] 으로 즉각 변경 실행');
window.DataStore.updateItemStatus('sales1', 'B-260901-001', 'receipt', '접수완료');
window.DataStore.updateItemStatus('sales1', 'B-260901-001', 'progress', '대상자선정');

let appsBeforeSync = window.DataStore.getApplications();
let appNow = appsBeforeSync.find(a => a.id === 'B-260901-001');
console.log(`- 변경 직후 로컬 상태: 접수=[${appNow.receiptStatus}], 진행=[${appNow.progressStatus}], status=[${appNow.status}], updatedAt=[${appNow.updatedAt}]`);

// Step 2: Supabase in-flight fetch returns with STALE data (from before the user clicked)
console.log('\n2. 페이지 로드 시 백그라운드에서 발화된 Supabase 이전 데이터 수신 시뮬레이션');
const staleSupabaseApp = {
  id: 'B-260901-001',
  user_id: 'sales1',
  owner_name: '박대박',
  phone: '010-1111-2222',
  store_name: '대박치킨',
  store_address: '서울시 강남구',
  sign_type: '간판지원신청',
  referrer_code: 'B-260901',
  status: 'pending',
  memo: JSON.stringify({
    isBizItem: true,
    receiptStatus: '접수예정',
    progressStatus: '지원대기중',
    salespersonId: 'sales1',
    salespersonName: '김영업'
  }),
  applied_at: initialApp.appliedAt
};

// Mock supabaseClient to return stale data
window.supabaseClient = {
  from: function(table) {
    return {
      select: async function() {
        if (table === 'users') return { data: [adminUser, bizUser], error: null };
        if (table === 'applications') return { data: [staleSupabaseApp], error: null };
        if (table === 'inquiries') return { data: [], error: null };
        return { data: [], error: null };
      }
    };
  }
};

// Step 3: Run syncAllData
(async () => {
  await window.SupabaseSync.syncAllData();
  
  const appsAfterSync = window.DataStore.getApplications();
  const targetAppAfterSync = appsAfterSync.find(a => a.id === 'B-260901-001');
  
  console.log('\n3. Supabase 동기화 완료 후 최종 상태 검증');
  console.log(`- 접수 상태: [${targetAppAfterSync.receiptStatus}] -> ${targetAppAfterSync.receiptStatus === '접수완료' ? '✅ PASS (로컬 최신 변경값 보존 성공)' : '❌ FAIL (구형 데이터로 롤백됨)'}`);
  console.log(`- 진행 상황: [${targetAppAfterSync.progressStatus}] -> ${targetAppAfterSync.progressStatus === '대상자선정' ? '✅ PASS (로컬 최신 변경값 보존 성공)' : '❌ FAIL (구형 데이터로 롤백됨)'}`);
  console.log(`- 승인 상태: [${targetAppAfterSync.status}] -> ${targetAppAfterSync.status === 'approved' ? '✅ PASS' : '❌ FAIL'}`);
})();
