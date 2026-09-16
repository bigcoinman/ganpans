const fs = require('fs');
const path = require('path');

const storage = {};
const localStorageMock = {
  getItem: (k) => (storage[k] !== undefined ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;
global.window = {
  localStorage: localStorageMock,
  sessionStorage: localStorageMock,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  CustomEvent: function(type, detail) { return { type, detail }; }
};
global.CustomEvent = global.window.CustomEvent;

const dataStoreCode = fs.readFileSync(path.join(__dirname, '../data-store.js'), 'utf8');
eval(dataStoreCode);
const DataStore = global.window.DataStore;

// 1. 김로빈 영업자 (bizCode: B-260902)
const robin = {
  id: 'robin',
  name: '김로빈',
  role: 'business',
  bizCode: 'B-260902',
  items: []
};
DataStore.saveUsers([robin]);

// 2. 안나플라워 신청서 (초기: 김로빈 담당)
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

console.log('=== [초기 상태: 김로빈 배정 시] ===');
let robinItems = DataStore.getBizItemsForUser(robin);
console.log('김로빈 영업물건 건수:', robinItems.length); // 1 이어야 함

console.log('\n=== [최고관리자가 본사직접접수로 변경 시] ===');
DataStore.updateApplicationReferrer('B-260902-001', '');

robinItems = DataStore.getBizItemsForUser(robin);
console.log('본사직접접수 변경 후 김로빈 영업물건 건수:', robinItems.length); // 0 이어야 함!
if (robinItems.length === 0) {
  console.log('✅ PASS: 즉시 0건으로 사라짐!');
} else {
  console.log('❌ FAIL: 여전히 잔류함! 건수:', robinItems.length);
}
