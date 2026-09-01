// Test simulation for 김나완 (bugsman2026) and 똘이네반찬
const fs = require('fs');

// Mock localStorage
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

console.log('=== [1. 영업자 김나완(bugsman2026) & 똘이네반찬 3대 시나리오 전수 검증] ===');

// Setup users
const mockUsers = [
  {
    id: 'admin',
    name: '최고관리자',
    role: 'admin'
  },
  {
    id: 'bugsman2026',
    name: '김나완',
    role: 'business',
    bizCode: 'B-260901',
    phone: '010-9999-8888',
    items: []
  },
  {
    id: 'owner_user',
    name: '김똘이',
    role: 'normal',
    phone: '010-1234-5678'
  }
];
window.DataStore.saveUsers(mockUsers);

// Test Case 1: 영업자 김나완이 직접 신청한 똘이네반찬
const mockApps = [
  {
    id: 'B-260901-001',
    userId: 'bugsman2026',
    salespersonId: 'bugsman2026',
    salespersonName: '김나완',
    referrerCode: 'B-260901',
    ownerName: '김똘이',
    ownerPhone: '010-1234-5678',
    storeName: '똘이네반찬 (케이스1: 영업자 직접접수)',
    storeAddress: '서울시 강남구 테헤란로 123',
    isBizItem: true,
    receiptStatus: '접수완료',
    progressStatus: '심사대기',
    appliedAt: '2026-09-01T10:00:00.000Z'
  },
  {
    id: 'P-260901002',
    userId: '01055554444',
    referrerCode: 'B-260901',
    ownerName: '박점주',
    ownerPhone: '010-5555-4444',
    storeName: '똘이네반찬 2호점 (케이스2: 비회원 추천인접수)',
    storeAddress: '서울시 서초구 서초대로 456',
    isBizItem: true,
    receiptStatus: '접수예정',
    progressStatus: '지원대기중',
    appliedAt: '2026-09-01T11:00:00.000Z'
  },
  {
    id: 'P-260901003',
    userId: 'owner_user',
    referrerCode: 'bugsman2026',
    ownerName: '김똘이',
    ownerPhone: '010-1234-5678',
    storeName: '똘이네반찬 3호점 (케이스3: 업주회원 추천인접수)',
    storeAddress: '서울시 송파구 올림픽로 789',
    isBizItem: true,
    receiptStatus: '접수완료',
    progressStatus: '간판시공 준비중',
    appliedAt: '2026-09-01T12:00:00.000Z'
  },
  {
    id: 'P-260901999',
    userId: 'other_user',
    referrerCode: '',
    ownerName: '타인점주',
    ownerPhone: '010-0000-0000',
    storeName: '남의가게 (타인 건 - 노출되면 안됨)',
    storeAddress: '부산시 해운대구',
    isBizItem: true,
    receiptStatus: '접수완료',
    progressStatus: '지원대기중',
    appliedAt: '2026-09-01T09:00:00.000Z'
  }
];
window.DataStore.saveApplications(mockApps);

// Test DataStore.getAdminBizItems()
const adminBizItems = window.DataStore.getAdminBizItems();
console.log(`\n[1] 최고관리자 getAdminBizItems() 총 건수: ${adminBizItems.length}건 (예상: 4건)`);
adminBizItems.forEach((entry, idx) => {
  console.log(`  ${idx+1}. [${entry.item.id}] ${entry.item.name} -> 담당영업자: ${entry.user.name} (${entry.user.id} / ${entry.user.bizCode})`);
});

// Test DataStore.getBizItemsForUser(bugsmanUser)
const bugsmanUser = mockUsers[1];
const userBizItems = window.DataStore.getBizItemsForUser(bugsmanUser);
console.log(`\n[2] 김나완(bugsman2026) getBizItemsForUser() 결과: 총 ${userBizItems.length}건 (예상: 똘이네반찬 3건)`);
userBizItems.forEach((item, idx) => {
  console.log(`  ${idx+1}. [${item.id}] ${item.storeName} (접수상태: ${item.receiptStatus}, 진행상태: ${item.progressStatus})`);
});

// Assertions
const isCase1Found = userBizItems.some(i => i.id === 'B-260901-001');
const isCase2Found = userBizItems.some(i => i.id === 'P-260901002');
const isCase3Found = userBizItems.some(i => i.id === 'P-260901003');
const isOtherHidden = !userBizItems.some(i => i.id === 'P-260901999');

console.log('\n=== [최종 시뮬레이션 판정] ===');
console.log(`- 케이스 1 (영업자 직접 접수 똘이네반찬): ${isCase1Found ? '✅ 정상 노출 성공' : '❌ 실패'}`);
console.log(`- 케이스 2 (비회원 추천코드 접수 똘이네반찬): ${isCase2Found ? '✅ 정상 노출 성공' : '❌ 실패'}`);
console.log(`- 케이스 3 (업주회원 추천코드 접수 똘이네반찬): ${isCase3Found ? '✅ 정상 노출 성공' : '❌ 실패'}`);
console.log(`- 타인 물건 차단 격리: ${isOtherHidden ? '✅ 완벽 격리 성공' : '❌ 실패'}`);

if (isCase1Found && isCase2Found && isCase3Found && isOtherHidden) {
  console.log('\n🎉 [100% ALL PASS] 김나완 영업자의 똘이네반찬 3대 경로 모두 완벽하게 노출됩니다!');
} else {
  console.error('\n❌ [FAIL] 테스트 실패');
  process.exit(1);
}
