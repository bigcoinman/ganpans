// scratch/test_pw_preservation_flow.js
const assert = require('assert');

// Mock DOM / Storage environment
const mockLocalStorage = {};
global.localStorage = {
  getItem: (k) => mockLocalStorage[k] || null,
  setItem: (k, v) => { mockLocalStorage[k] = v; }
};
global.sessionStorage = {
  getItem: () => null
};

// Simulation test
function testExistingMemberApplication() {
  console.log('--- Test 1: Logged-in Existing Normal Member ---');
  const originalPwHash = 'my_secure_existing_password_hash_1234';
  const initialUsers = [
    {
      id: 'owner_user_01',
      name: '홍길동',
      phone: '010-1234-5678',
      email: 'owner@example.com',
      pw: originalPwHash,
      role: 'normal'
    }
  ];
  mockLocalStorage['users'] = JSON.stringify(initialUsers);

  const loggedUser = initialUsers[0];
  const ownerPhone = '010-1234-5678';
  const ownerName = '홍길동';
  const phoneDigits = ownerPhone.replace(/[^0-9]/g, '');
  const autoPw = 'g-' + phoneDigits.slice(-8);

  let userId = phoneDigits;
  let loginNoticeId = phoneDigits;
  let loginNoticePw = '';
  let isNewAccount = false;

  let users = JSON.parse(mockLocalStorage['users']);

  if (loggedUser && (loggedUser.role === 'normal' || !loggedUser.role || loggedUser.role === 'user')) {
    userId = loggedUser.id;
    loginNoticeId = loggedUser.id;
    loginNoticePw = ''; // 기존 비밀번호 유지
    isNewAccount = false;

    const curUserIdx = users.findIndex(u => String(u.id).toLowerCase() === String(loggedUser.id).toLowerCase());
    if (curUserIdx !== -1) {
      users[curUserIdx] = {
        ...users[curUserIdx],
        name: ownerName || users[curUserIdx].name,
        phone: ownerPhone || users[curUserIdx].phone
      };
      mockLocalStorage['users'] = JSON.stringify(users);
    }
  }

  const isExistingAccount = !isNewAccount || !loginNoticePw;
  const updatedUsers = JSON.parse(mockLocalStorage['users']);
  
  assert.strictEqual(updatedUsers[0].pw, originalPwHash, '비밀번호가 기존 비밀번호 그대로 보존되어야 함');
  assert.strictEqual(isExistingAccount, true, 'isExistingAccount가 true여야 함');
  assert.strictEqual(loginNoticePw, '', '임시 비번이 빈 문자열이어야 함');
  console.log('✔ Test 1 Passed: Existing member password is safe and intact, isExistingAccount=true');
}

function testPureGuestApplication() {
  console.log('--- Test 2: Pure Guest Application ---');
  mockLocalStorage['users'] = JSON.stringify([]);
  
  const loggedUser = null;
  const ownerPhone = '010-9876-5432';
  const ownerName = '김철수';
  const phoneDigits = ownerPhone.replace(/[^0-9]/g, '');
  const autoPw = 'g-' + phoneDigits.slice(-8);
  const hashedPassword = 'sha256_' + autoPw;

  let userId = phoneDigits;
  let loginNoticeId = phoneDigits;
  let loginNoticePw = '';
  let isNewAccount = false;

  let users = JSON.parse(mockLocalStorage['users']);

  const existingIdx = users.findIndex(u => {
    const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
    return (uPhoneDigits && uPhoneDigits === phoneDigits);
  });

  if (existingIdx !== -1) {
    // ...
  } else {
    userId = phoneDigits;
    loginNoticeId = phoneDigits;
    loginNoticePw = autoPw;
    isNewAccount = true;
    const newUser = {
      id: phoneDigits,
      name: ownerName,
      phone: ownerPhone,
      pw: hashedPassword,
      role: 'normal'
    };
    users.push(newUser);
    mockLocalStorage['users'] = JSON.stringify(users);
  }

  const isExistingAccount = !isNewAccount || !loginNoticePw;
  const updatedUsers = JSON.parse(mockLocalStorage['users']);

  assert.strictEqual(updatedUsers[0].pw, hashedPassword, '신규 게스트는 임시 비밀번호 해시 저장');
  assert.strictEqual(isExistingAccount, false, '신규 게스트는 isExistingAccount가 false여야 함');
  assert.strictEqual(loginNoticePw, autoPw, '임시 비밀번호가 autoPw여야 함');
  console.log('✔ Test 2 Passed: Pure guest receives autoPw and isExistingAccount=false');
}

testExistingMemberApplication();
testPureGuestApplication();
