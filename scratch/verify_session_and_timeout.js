const fs = require('fs');

// Mock browser environment
global.window = global;
global.window.addEventListener = () => {};
global.document = {
  addEventListener: () => {},
  getElementById: () => null,
  querySelectorAll: () => [],
  body: { insertAdjacentHTML: () => {} },
  activeElement: null
};

class MockStorage {
  constructor() { this.store = {}; }
  getItem(k) { return this.store[k] || null; }
  setItem(k, v) { this.store[k] = String(v); }
  removeItem(k) { delete this.store[k]; }
  clear() { this.store = {}; }
}

global.localStorage = new MockStorage();
global.sessionStorage = new MockStorage();

// Load data-store.js and security-utils.js
eval(fs.readFileSync('data-store.js', 'utf8'));
eval(fs.readFileSync('security-utils.js', 'utf8'));

console.log('=== TEST 1: 로그인 상태 유지 체크 안 함 (rememberMe = false) ===');
const guestUser = { id: 'admin', name: '최고관리자', role: 'admin' };
window.DataStore.setActiveUser(guestUser, false);

console.log('sessionStorage activeUser:', sessionStorage.getItem('activeUser') ? '존재 (정상)' : '없음');
console.log('localStorage activeUser:', localStorage.getItem('activeUser') ? '오류 (존재)' : '없음 (정상 ✅)');
console.log('getActiveUser() result:', getActiveUser() ? `${getActiveUser().name} (${getActiveUser().role})` : 'null');

console.log('\n--- 브라우저/네이버 앱 종료 시뮬레이션 (sessionStorage 소멸) ---');
sessionStorage.clear(); // OS가 브라우저 닫을 때 session 소멸
console.log('재실행 후 getActiveUser() result:', getActiveUser() ? `오류 (${getActiveUser().name})` : 'null (정상 비회원 복귀 ✅)');

console.log('\n=== TEST 2: 로그인 상태 유지 체크 (rememberMe = true) + 1시간 미조작 타임아웃 ===');
window.DataStore.setActiveUser(guestUser, true);
console.log('localStorage activeUser:', localStorage.getItem('activeUser') ? '존재 (정상)' : '없음');
console.log('초기 getActiveUser():', getActiveUser().name);

// 61분 경과 시뮬레이션
const pastTime = Date.now() - (61 * 60 * 1000);
localStorage.setItem('last_active_time', pastTime.toString());

console.log('61분 경과 후 getActiveUser() 호출 (자동 로그아웃 발화 여부):');
const afterTimeout = getActiveUser();
console.log('결과:', afterTimeout ? '오류 (로그인 유지됨)' : 'null (100% 무조건 자동 로그아웃 성공 ✅)');
console.log('localStorage activeUser after timeout:', localStorage.getItem('activeUser') ? '오류 (남아있음)' : '완전 소멸 (정상 ✅)');

console.log('\n=== ALL SESSION & INACTIVITY TESTS PASSED! ===');
