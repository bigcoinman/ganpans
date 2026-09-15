// scratch/verify_5_cycles_zero_residue_sweep.js
// 5대 에이전트 협업 레거시 찌꺼기/유령코드/세션누출 전수 박멸 5회 연속 무결성 검증

const fs = require('fs');
const path = require('path');

// Mock browser environment
class MockStorage {
  constructor() { this.store = {}; }
  getItem(k) { return this.store[k] !== undefined ? this.store[k] : null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
}

const mockLocalStorage = new MockStorage();
const mockSessionStorage = new MockStorage();

global.localStorage = mockLocalStorage;
global.sessionStorage = mockSessionStorage;
global.window = {
  localStorage: mockLocalStorage,
  sessionStorage: mockSessionStorage,
  dispatchEvent: () => {},
  addEventListener: () => {}
};
global.document = {
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};
global.CustomEvent = class { constructor(t) { this.type = t; } };

// Load security-utils.js & data-store.js
const secCode = fs.readFileSync(path.join(__dirname, '../security-utils.js'), 'utf8');
const dataStoreCode = fs.readFileSync(path.join(__dirname, '../data-store.js'), 'utf8');

eval(secCode);
eval(dataStoreCode);

console.log('========================================================================');
console.log('   5대 에이전트 협업: 레거시 찌꺼기/유령코드/세션누출 전수 박멸 5회 연속 검증');
console.log('========================================================================\n');

let allPassed = true;

for (let cycle = 1; cycle <= 5; cycle++) {
  console.log(`\n------------------------- [CYCLE ${cycle} / 5 시작] -------------------------`);
  mockLocalStorage.clear();
  mockSessionStorage.clear();

  const mockUsers = [
    { id: 'admin', name: '최고관리자', role: 'admin', bizCode: 'ADMIN' },
    { id: 'user_manseok', name: '이만석', role: 'business', bizCode: 'B-260903', phone: '010-1111-2222', items: [] },
    { id: 'user_suri', name: '홍수리', role: 'business', bizCode: 'B-260901', phone: '010-3333-4444', items: [] }
  ];
  window.DataStore.saveUsers(mockUsers);

  // --- Pillar 1: 영업자 변경 및 배정 해제 시 부존재 일치 검증 ---
  let app1 = {
    id: 'B-260903-001',
    ownerName: '테스트점포',
    ownerPhone: '010-9999-8888',
    isBizItem: true,
    salespersonId: 'user_manseok',
    salespersonName: '이만석',
    referrerCode: 'B-260903',
    receiptStatus: '접수예정',
    progressStatus: '지원대기중'
  };
  window.DataStore.saveApplications([app1]);

  let manseokItems = window.DataStore.getBizItemsForUser(mockUsers[1]);
  if (manseokItems.length !== 1) {
    console.error(`[FAIL Cycle ${cycle}] Pillar 1: Initial assignment failed! Length: ${manseokItems.length}`);
    allPassed = false;
  }

  // Admin unassigns salesperson (본사직접접수)
  app1.salespersonId = '';
  app1.salespersonName = '본사직접접수';
  app1.referrerCode = '';
  window.DataStore.saveApplications([app1]);

  let adminItems = window.DataStore.getAdminBizItems();
  let manseokItemsAfterUnassign = window.DataStore.getBizItemsForUser(mockUsers[1]);
  let suriItemsAfterUnassign = window.DataStore.getBizItemsForUser(mockUsers[2]);

  const p1Check1 = adminItems.length === 1 && adminItems[0].user.name === '최고관리자';
  const p1Check2 = manseokItemsAfterUnassign.length === 0;
  const p1Check3 = suriItemsAfterUnassign.length === 0;

  if (p1Check1 && p1Check2 && p1Check3) {
    console.log(`[PASS Cycle ${cycle}] Pillar 1: 영업자 배정 해제 시 이만석 화면 0건 완벽 부존재 일치 ✅`);
  } else {
    console.error(`[FAIL Cycle ${cycle}] Pillar 1: Unassign failed! p1Check1=${p1Check1}, p1Check2=${p1Check2}, p1Check3=${p1Check3}`);
    allPassed = false;
  }

  // --- Pillar 2: 접두사 분리 역추측(Prefix Splitting Guessing) 0% 완벽 박멸 검증 ---
  // A Supabase app with ID containing 'B-260903-001' but referrer_code is empty and salespersonName is '본사직접접수'
  const mockDbApp = {
    id: 'B-260903-001',
    owner_name: '테스트점포',
    referrer_code: '',
    memo: JSON.stringify({ isBizItem: true, salespersonId: '', salespersonName: '본사직접접수' })
  };
  const localApp = window.SupabaseSync.mapDbToApp(mockDbApp);

  const p2Check1 = localApp.referrerCode === '';
  const p2Check2 = localApp.salespersonId === '';
  const p2Check3 = localApp.salespersonName === '본사직접접수';

  if (p2Check1 && p2Check2 && p2Check3) {
    console.log(`[PASS Cycle ${cycle}] Pillar 2: 신청번호 접두사(B-260903) 역추측 찌꺼기 0건 완벽 박멸 ✅`);
  } else {
    console.error(`[FAIL Cycle ${cycle}] Pillar 2: Prefix splitting revived! p2Check1=${p2Check1}, p2Check2=${p2Check2}, p2Check3=${p2Check3}`);
    allPassed = false;
  }

  // --- Pillar 3: 세션 격리 & RememberMe 누출 방지 검증 ---
  // User logs in WITHOUT rememberMe
  window.DataStore.setActiveUser(mockUsers[1], false);
  const p3Check1 = mockSessionStorage.getItem('activeUser') !== null;
  const p3Check2 = mockLocalStorage.getItem('activeUser') === null;
  const p3Check3 = mockLocalStorage.getItem('activeUser_remember') === null;

  // Simulate dashboard/app calling DataStore.setActiveUser(activeUser) repeatedly
  const curActive = window.DataStore.getActiveUser();
  window.DataStore.setActiveUser(curActive);
  const p3Check4 = mockLocalStorage.getItem('activeUser') === null;

  if (p3Check1 && p3Check2 && p3Check3 && p3Check4) {
    console.log(`[PASS Cycle ${cycle}] Pillar 3: 로그인 유지 미선택 시 localStorage 오염 0건 격리 성공 ✅`);
  } else {
    console.error(`[FAIL Cycle ${cycle}] Pillar 3: Session leaked to localStorage!`);
    allPassed = false;
  }

  // --- Pillar 4: 1시간 미조작 세션 만료 검증 ---
  const ONE_HOUR_MS = 60 * 60 * 1000;
  // Case A: Session-only user 61 min ago
  mockSessionStorage.setItem('activeUser', JSON.stringify(mockUsers[1]));
  mockSessionStorage.setItem('last_active_time', (Date.now() - ONE_HOUR_MS - 60000).toString());
  const p4Check1 = checkInactivityTimeout() === true;

  // Case B: Remember-me user 61 min ago
  mockLocalStorage.setItem('activeUser', JSON.stringify(mockUsers[1]));
  mockLocalStorage.setItem('activeUser_remember', 'true');
  mockLocalStorage.setItem('last_active_time', (Date.now() - ONE_HOUR_MS - 60000).toString());
  mockSessionStorage.removeItem('last_active_time');
  mockSessionStorage.removeItem('activeUser');
  const p4Check2 = checkInactivityTimeout() === true;

  // Case C: Admin user 61 min ago
  mockLocalStorage.setItem('activeUser', JSON.stringify(mockUsers[0]));
  mockLocalStorage.setItem('activeUser_remember', 'true');
  mockLocalStorage.setItem('last_active_time', (Date.now() - ONE_HOUR_MS - 60000).toString());
  const p4Check3 = checkInactivityTimeout() === true;

  // Case D: Recent activity 10 min ago
  mockLocalStorage.setItem('activeUser', JSON.stringify(mockUsers[1]));
  mockLocalStorage.setItem('activeUser_remember', 'true');
  mockLocalStorage.setItem('last_active_time', (Date.now() - 10 * 60 * 1000).toString());
  const p4Check4 = checkInactivityTimeout() === false;

  if (p4Check1 && p4Check2 && p4Check3 && p4Check4) {
    console.log(`[PASS Cycle ${cycle}] Pillar 4: 1시간 미조작 시 예외 없는 100% 세션 만료 및 자동 로그아웃 ✅`);
  } else {
    console.error(`[FAIL Cycle ${cycle}] Pillar 4: Inactivity timeout failed! p4Check1=${p4Check1}, p4Check2=${p4Check2}, p4Check3=${p4Check3}, p4Check4=${p4Check4}`);
    allPassed = false;
  }

  // --- Pillar 5: 이중 기록(Dual-Write) 및 유령 잔재 0건 검증 ---
  // When an app has isBizItem = false, neither admin nor salesperson must see it
  app1.isBizItem = false;
  window.DataStore.saveApplications([app1]);
  const adminBizItemsAfterDeactivate = window.DataStore.getAdminBizItems();
  const manseokBizItemsAfterDeactivate = window.DataStore.getBizItemsForUser(mockUsers[1]);

  const p5Check1 = adminBizItemsAfterDeactivate.length === 0;
  const p5Check2 = manseokBizItemsAfterDeactivate.length === 0;

  if (p5Check1 && p5Check2) {
    console.log(`[PASS Cycle ${cycle}] Pillar 5: 물건 비활성화/해제 시 관리자/영업자 화면 잔재 0건 완전 박멸 ✅`);
  } else {
    console.error(`[FAIL Cycle ${cycle}] Pillar 5: Residue remains after deactivation!`);
    allPassed = false;
  }
}

console.log('\n========================================================================');
if (allPassed) {
  console.log('   🎉 5회 연속 전수 시뮬레이션 검증 100% ALL PASS (완전 박멸 종결 성공!) 🎉');
} else {
  console.error('   ❌ 일부 사이클에서 오류가 발생했습니다.');
  process.exit(1);
}
console.log('========================================================================\n');
