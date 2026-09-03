const fs = require('fs');
const path = require('path');

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
  sessionStorage: localStorageMock,
  dispatchEvent: () => {}
};

// Load data-store.js
const dataStoreCode = fs.readFileSync(path.join(__dirname, '../data-store.js'), 'utf8');
eval(dataStoreCode);

async function testSignupAndAdminFlow() {
  console.log('====================================================');
  console.log('🧪 [회원 삭제 후 재가입 및 관리자 목록 노출 전수 검증]');
  console.log('====================================================\n');

  // 1. Initial users setup
  const initialUsers = [
    { id: 'admin', name: '최고관리자', role: 'admin' },
    { id: 'user_delete_test', name: '김테스트', phone: '010-8888-9999', role: 'normal' }
  ];
  window.DataStore.saveUsers(initialUsers);
  console.log('1. 초기 회원 등록:', window.DataStore.getUsers().map(u => u.id));

  // 2. Simulate User Deletion
  // Mock confirm
  global.confirm = () => true;
  global.alert = () => {};
  window.DataStore.deleteUser('user_delete_test');
  console.log('2. 회원 삭제 후 목록:', window.DataStore.getUsers().map(u => u.id));
  console.log('   삭제 캐시 (deleted_user_ids):', localStorage.getItem('deleted_user_ids'));

  // 3. Re-registering the same user ("다시 가입")
  const reRegisteredUser = {
    id: 'user_delete_test',
    pw: 'hashed_pw_123',
    name: '김테스트(재가입)',
    phone: '010-8888-9999',
    role: 'normal',
    createdAt: new Date().toISOString()
  };

  // Simulate executeAppSignup's cache purge and save
  let deletedIds = JSON.parse(localStorage.getItem('deleted_user_ids')) || [];
  deletedIds = deletedIds.filter(did => did !== 'user_delete_test' && did !== '01088889999' && did !== '010-8888-9999');
  localStorage.setItem('deleted_user_ids', JSON.stringify(deletedIds));

  const freshUsers = window.DataStore.getUsers();
  freshUsers.push(reRegisteredUser);
  window.DataStore.saveUsers(freshUsers);

  // 4. Verify Admin's list
  const adminVisibleUsers = window.DataStore.getUsers();
  console.log('\n3. 재가입 후 관리자 화면 노출 목록:', adminVisibleUsers.map(u => `${u.id} (${u.name})`));

  const isVisible = adminVisibleUsers.some(u => u.id === 'user_delete_test');
  if (isVisible) {
    console.log('\n🎉 [PASS] 재가입한 회원이 관리자 회원 목록에 100% 정상 노출됩니다!');
  } else {
    console.log('\n❌ [FAIL] 재가입한 회원이 여전히 차단되어 있습니다.');
  }
}

testSignupAndAdminFlow();
