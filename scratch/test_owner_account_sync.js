const fs = require('fs');

global.window = global;
global.window.addEventListener = function() {};
global.document = { addEventListener: function() {} };

const testUsers = [
  {
    id: '01011112222',
    name: '김점주',
    phone: '010-1111-2222',
    pw: 'old_pw_hash',
    role: 'normal',
    items: []
  },
  {
    id: 'B-260903',
    name: '최영업',
    phone: '010-9999-8888',
    bizCode: 'B-260903',
    role: 'business',
    items: [
      {
        id: 'B-260903-001',
        name: '대박식당',
        phone: '010-1111-2222',
        status: 'pending'
      }
    ]
  }
];

const testApps = [
  {
    id: 'B-260903-001',
    applicantUserId: '01011112222',
    registeredBy: '01011112222',
    ownerName: '김점주',
    ownerPhone: '010-1111-2222',
    storeName: '대박식당',
    storeAddress: '서울시 서초구',
    referrerCode: 'B-260903',
    status: 'pending',
    autoAccount: {
      id: '01011112222',
      pw: 'g-11112222'
    }
  }
];

global.localStorage = {
  store: {
    users: JSON.stringify(testUsers),
    applications: JSON.stringify(testApps)
  },
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = v; }
};

const dataStoreCode = fs.readFileSync('data-store.js', 'utf8');
eval(dataStoreCode);

console.log('--- 점주 연락처 변경 및 계정 ID 동기화 테스트 시작 ---');

// 점주 연락처를 010-1111-2222 -> 010-7777-8888 로 수정
const res = window.DataStore.updateApplication('B-260903-001', {
  ownerPhone: '010-7777-8888',
  phone: '010-7777-8888',
  storeName: '대박식당 (수정)'
});

console.log('결과 success:', res.success);
console.log('계정 변경 정보:', res.accountChanged);

const updatedUsers = JSON.parse(localStorage.getItem('users'));
const updatedApps = JSON.parse(localStorage.getItem('applications'));

console.log('\n[수정 후 Users 목록]');
updatedUsers.forEach(u => console.log(`- Role: ${u.role}, ID: ${u.id}, Name: ${u.name}, Phone: ${u.phone}`));

console.log('\n[수정 후 Applications]');
const updatedApp = updatedApps.find(a => a.id === 'B-260903-001');
console.log(`- App ID: ${updatedApp.id}, Store: ${updatedApp.storeName}, OwnerPhone: ${updatedApp.ownerPhone}, ApplicantUserId: ${updatedApp.applicantUserId}`);
console.log(`- AutoAccount:`, updatedApp.autoAccount);

console.log('\n[수정 후 영업자 items]');
const salesUser = updatedUsers.find(u => u.bizCode === 'B-260903');
console.log('- 영업자 items:', salesUser.items);

if (
  updatedUsers.some(u => u.id === '01077778888' && u.phone === '010-7777-8888') &&
  !updatedUsers.some(u => u.id === '01011112222') &&
  updatedApp.ownerPhone === '010-7777-8888' &&
  updatedApp.applicantUserId === '01077778888' &&
  updatedApp.autoAccount.id === '01077778888' &&
  updatedApp.autoAccount.pw === 'g-77778888' &&
  salesUser.items[0].phone === '010-7777-8888'
) {
  console.log('\n✅ 점주 계정 ID / 비밀번호 / 신청서 / 영업자 items 100% 완벽 동기화 검증 성공!');
} else {
  console.error('\n❌ 동기화 실패 항목 있음');
}
