// test_dropdown_investigation.js
const fs = require('fs');
const path = require('path');

// Mock localStorage and window
const localStorageMock = (function () {
  let store = {};
  return {
    getItem: function (key) {
      return store[key] || null;
    },
    setItem: function (key, value) {
      store[key] = value.toString();
    },
    removeItem: function (key) {
      delete store[key];
    },
    clear: function () {
      store = {};
    }
  };
})();

global.localStorage = localStorageMock;
global.window = {
  localStorage: localStorageMock,
  dispatchEvent: () => {},
  addEventListener: () => {},
  CustomEvent: class {}
};
global.document = {
  activeElement: null,
  addEventListener: () => {},
  removeEventListener: () => {}
};

// Load security-utils & data-store
require('../security-utils.js');
const dataStoreCode = fs.readFileSync(path.join(__dirname, '../data-store.js'), 'utf8');
eval(dataStoreCode);

// 1. Initial State Setup
console.log('--- 1. Initial Setup ---');
const adminUser = { id: 'admin', name: '최고관리자', role: 'admin', bizCode: 'ADMIN' };
const bizUser = { id: 'biz1', name: '김영업', role: 'business', bizCode: 'B-260901', items: [] };
const constUser = { id: 'const1', name: '대박시공', role: 'constructor', constructorBizName: '대박기획', phone: '010-9999-8888' };

const testApp = {
  id: 'B-260901-001',
  appRefId: 'B-260901-001',
  userId: 'guest_test',
  ownerName: '홍길동',
  ownerPhone: '010-1234-5678',
  storeName: '길동식당',
  storeAddress: '서울시 강남구',
  referrerCode: 'B-260901',
  isBizItem: true,
  receiptStatus: '접수예정',
  progressStatus: '지원대기중',
  status: 'pending',
  constructionStatus: 'none',
  appliedAt: '2026-09-05T00:00:00.000Z'
};

window.DataStore.saveUsers([adminUser, bizUser, constUser]);
window.DataStore.saveApplications([testApp]);

console.log('초기 getAdminBizItems:', window.DataStore.getAdminBizItems());

// 2. Test Receipt Dropdown Change to '접수완료'
console.log('\n--- 2. Change Receipt to 접수완료 ---');
const resReceipt = window.DataStore.updateItemStatus(bizUser.id, testApp.id, 'receipt', '접수완료');
console.log('updateItemStatus(receipt, 접수완료) 결과:', resReceipt);

let adminItems = window.DataStore.getAdminBizItems();
console.log('결과 adminItems[0].item:', adminItems[0].item);
if (adminItems[0].item.receiptStatus !== '접수완료') {
  console.error('❌ receiptStatus 변경 실패!');
} else {
  console.log('✅ receiptStatus 변경 성공!');
}

// 3. Test Progress Dropdown Change to '대상자선정'
console.log('\n--- 3. Change Progress to 대상자선정 ---');
const resProgress = window.DataStore.updateItemStatus(bizUser.id, testApp.id, 'progress', '대상자선정');
console.log('updateItemStatus(progress, 대상자선정) 결과:', resProgress);

adminItems = window.DataStore.getAdminBizItems();
console.log('결과 adminItems[0].item:', adminItems[0].item);
if (adminItems[0].item.progressStatus !== '대상자선정') {
  console.error('❌ progressStatus 변경 실패!');
} else {
  console.log('✅ progressStatus 변경 성공!');
}

// 4. Test Construction Jobs Listing
console.log('\n--- 4. getConstructionJobs() Verification ---');
const constJobs = window.DataStore.getConstructionJobs();
console.log('시공업체 진행현황 총 건수:', constJobs.length);
if (constJobs.length === 1 && constJobs[0].item.id === testApp.id) {
  console.log('✅ 시공업체 진행현황에 정상 노출됨!');
} else {
  console.error('❌ 시공업체 진행현황 누락!');
}
