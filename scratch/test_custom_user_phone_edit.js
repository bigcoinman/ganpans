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

// 1. 일반 가입 회원: id: 'custom_owner_123', phone: '010-1111-2222', pw: 'hashed_my_own_secret_pw'
const customUser = {
  id: 'custom_owner_123',
  name: '홍길동점주',
  phone: '010-1111-2222',
  pw: 'hashed_my_own_secret_pw',
  role: 'normal',
  items: []
};
DataStore.saveUsers([customUser]);

// 2. 신청서 생성
const app = {
  id: 'app-custom-001',
  storeName: '길동분식',
  ownerName: '홍길동점주',
  ownerPhone: '010-1111-2222',
  userId: 'custom_owner_123',
  isBizItem: false
};
DataStore.saveApplications([app]);

console.log('=== [관리자가 신청서 연락처를 010-1111-2222 -> 010-9999-8888 로 수정하기 전] ===');
let users = DataStore.getUsers();
console.log('가입회원 ID:', users[0].id, 'PW:', users[0].pw, '연락처:', users[0].phone);

console.log('\n=== [관리자가 신청서 연락처를 010-9999-8888 로 수정] ===');
DataStore.updateApplication('app-custom-001', {
  ownerPhone: '010-9999-8888',
  phone: '010-9999-8888'
});

users = DataStore.getUsers();
const updatedUser = users.find(u => u.id === 'custom_owner_123');

if (!updatedUser) {
  console.log('❌ FAIL: 가입회원 ID가 사라지거나 변조됨! 현재 회원 목록:', users);
} else if (updatedUser.pw !== 'hashed_my_own_secret_pw') {
  console.log('❌ FAIL: 비밀번호가 강제로 변경됨! 현재 PW:', updatedUser.pw);
} else if (updatedUser.phone !== '010-9999-8888') {
  console.log('❌ FAIL: 전화번호가 갱신되지 않음!');
} else {
  console.log('✅ PASS: 가입회원 ID(custom_owner_123) 및 원래 비밀번호가 100% 안전하게 유지되고 전화번호만 갱신됨!');
}
