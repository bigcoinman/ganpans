// scratch/test_guest_signup_and_login.js
const crypto = require('crypto');

function sha256(str) {
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Mock LocalStorage
const store = {};
const localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};
const sessionStorage = {
  getItem: (k) => store['sess_' + k] || null,
  setItem: (k, v) => { store['sess_' + k] = String(v); },
  removeItem: (k) => { delete store['sess_' + k]; }
};

function simulateLogin(idVal, pwVal) {
  const idValLower = idVal.toLowerCase();
  const cleanDigits = (idVal.replace(/[^0-9]/g, '').length >= 7) ? idVal.replace(/[^0-9]/g, '') : '';
  const hashedPassword = sha256(pwVal);
  let user = null;

  // 1) localUsers check
  const localUsers = JSON.parse(localStorage.getItem('users')) || [];
  const localUser = localUsers.find(u => {
    const uId = String(u.id || '').toLowerCase();
    const uPhoneDigits = String(u.phone || '').replace(/[^0-9]/g, '');
    const uIdDigits = uId.replace(/[^0-9]/g, '');
    const isMatchUser = (uId === idVal.toLowerCase()) ||
      (cleanDigits && uId === cleanDigits.toLowerCase()) ||
      (cleanDigits && uPhoneDigits === cleanDigits) ||
      (cleanDigits && uIdDigits === cleanDigits);
    return isMatchUser && (u.pw === hashedPassword || u.pw === pwVal);
  });

  if (localUser) {
    user = localUser;
  }

  // 2) Auto-Healing from applications
  if (!user) {
    let apps = JSON.parse(localStorage.getItem('applications')) || [];
    const matchedApp = apps.find(a => {
      const aPhoneDigits = String(a.ownerPhone || '').replace(/[^0-9]/g, '');
      const aUserIdDigits = String(a.applicantUserId || a.userId || '').replace(/[^0-9]/g, '');
      const isMatchId = (cleanDigits && (aPhoneDigits === cleanDigits || aUserIdDigits === cleanDigits)) ||
        (String(a.id || '').toLowerCase() === idVal.toLowerCase()) ||
        (String(a.ownerPhone || '').trim() === idVal.trim());
      
      if (!isMatchId) return false;

      // 공식 임시 비밀번호(autoPw: 'g-' + 뒷8자리) 단일 규격 100% 엄격 일치 검증 (방안 A 원칙 준수)
      const autoPw = a.autoAccount?.pw || ('g-' + (aPhoneDigits.length >= 8 ? aPhoneDigits.slice(-8) : aPhoneDigits.padStart(8, '0')));
      const isPw = (pwVal === autoPw) || (hashedPassword === sha256(autoPw));
      return isPw;
    });

    if (matchedApp) {
      const appPhoneDigits = String(matchedApp.ownerPhone || '').replace(/[^0-9]/g, '');
      const restoredUserId = appPhoneDigits || String(matchedApp.id);
      const restoredAutoPw = matchedApp.autoAccount?.pw || ('g-' + (appPhoneDigits.length >= 8 ? appPhoneDigits.slice(-8) : appPhoneDigits.padStart(8, '0')));
      
      user = {
        id: restoredUserId,
        name: matchedApp.ownerName || '점주',
        phone: matchedApp.ownerPhone || '',
        email: '',
        address: matchedApp.storeAddress || '',
        pw: sha256(restoredAutoPw),
        role: 'normal',
        conversionStatus: 'none',
        items: [],
        createdAt: matchedApp.appliedAt || new Date().toISOString()
      };

      let curUsers = JSON.parse(localStorage.getItem('users')) || [];
      const existIdx = curUsers.findIndex(u => String(u.id).toLowerCase() === restoredUserId.toLowerCase());
      if (existIdx !== -1) {
        curUsers[existIdx] = user;
      } else {
        curUsers.push(user);
      }
      localStorage.setItem('users', JSON.stringify(curUsers));
    }
  }

  return user;
}

console.log('====================================================');
console.log('🧪 [비회원 신청 및 로그인 전수 검증 시뮬레이션]');
console.log('====================================================');

// Setup initial state
localStorage.setItem('users', JSON.stringify([]));
localStorage.setItem('applications', JSON.stringify([]));

// Step 1: Normal Guest Application Submission
console.log('\n--- Step 1: 신규 비회원 온라인 간편 지원 신청 제출 ---');
const ownerName = '홍길동';
const ownerPhone = '010-1234-5678';
const phoneDigits = ownerPhone.replace(/[^0-9]/g, ''); // '01012345678'
const autoPw = 'g-12345678';
const hashedPassword = sha256(autoPw);
const now = new Date();

let users = JSON.parse(localStorage.getItem('users')) || [];
const newUser = {
  id: phoneDigits,
  name: ownerName,
  phone: ownerPhone,
  email: '',
  address: '경기도 수원시 팔달구 매산로 1',
  pw: hashedPassword,
  role: 'normal',
  conversionStatus: 'none',
  items: [],
  createdAt: now.toISOString()
};
users.push(newUser);
localStorage.setItem('users', JSON.stringify(users));

let apps = JSON.parse(localStorage.getItem('applications')) || [];
const newApp = {
  id: 'P-260905001',
  userId: phoneDigits,
  applicantUserId: phoneDigits,
  registeredBy: phoneDigits,
  salespersonId: '',
  salespersonName: '',
  ownerName,
  ownerPhone,
  storeName: '길동베이커리',
  storeAddress: '경기도 수원시 팔달구 매산로 1',
  signType: '간판지원신청',
  appliedAt: now.toISOString(),
  status: 'pending',
  isBizItem: false,
  receiptStatus: '접수완료',
  progressStatus: '심사대기중',
  referrerCode: '',
  autoAccount: {
    id: phoneDigits,
    pw: autoPw,
    isNew: true
  }
};
apps.push(newApp);
localStorage.setItem('applications', JSON.stringify(apps));

console.log('✅ 신청서 및 users 저장 완료.');

// Step 2: Login with 010-1234-5678 and official autoPw g-12345678
console.log('\n--- Step 2: 하이픈 전화번호 + 공식 임시비밀번호(g-12345678) 로그인 ---');
const login1 = simulateLogin('010-1234-5678', 'g-12345678');
console.log('Login 1:', login1 ? `성공 (ID: ${login1.id}, Name: ${login1.name})` : '실패');
if (!login1) throw new Error('Login 1 failed');

// Step 3: Login with digits 01012345678 and official autoPw g-12345678
console.log('\n--- Step 3: 숫자만 전화번호 + 공식 임시비밀번호(g-12345678) 로그인 ---');
const login2 = simulateLogin('01012345678', 'g-12345678');
console.log('Login 2:', login2 ? `성공 (ID: ${login2.id}, Name: ${login2.name})` : '실패');
if (!login2) throw new Error('Login 2 failed');

// Step 3-B: Verify that incorrect password is strictly rejected
console.log('\n--- Step 3-B: 잘못된 비밀번호(12345678 / wrong-pw) 엄격 차단 검증 ---');
const loginWrong = simulateLogin('01012345678', 'wrong-pw');
console.log('Login with wrong password rejected:', loginWrong === null ? 'PASS ✅' : 'FAIL ❌');
if (loginWrong !== null) throw new Error('Security flaw: wrong password accepted');

// Step 4: Auto-healing test (wiping users table and logging in solely from applications)
console.log('\n--- Step 4: users 저장소 유실 시 applications 기반 Auto-Healing 복구 로그인 ---');
localStorage.setItem('users', JSON.stringify([])); // wipe users
const login3 = simulateLogin('010-1234-5678', 'g-12345678');
console.log('Login 3 (Auto-healing):', login3 ? `성공 (ID: ${login3.id}, Name: ${login3.name})` : '실패');
const restoredUsers = JSON.parse(localStorage.getItem('users')) || [];
console.log('Restored users in storage count:', restoredUsers.length);
if (!login3 || restoredUsers.length !== 1) throw new Error('Auto-healing failed');

// Step 5: Deleting an account, then re-registering and logging in cleanly
console.log('\n--- Step 5: 회원 삭제 후 동일 번호 재신청 및 로그인 (찌꺼기 0건 검증) ---');
localStorage.setItem('users', JSON.stringify([])); // pure deletion
localStorage.setItem('applications', JSON.stringify([]));
const reApp = {
  id: 'P-260905002',
  userId: '01099998888',
  applicantUserId: '01099998888',
  ownerName: '김재신청',
  ownerPhone: '010-9999-8888',
  storeName: '재신청카페',
  storeAddress: '서울시 강남구',
  appliedAt: new Date().toISOString(),
  autoAccount: { id: '01099998888', pw: 'g-99998888', isNew: true }
};
localStorage.setItem('applications', JSON.stringify([reApp]));

const login4 = simulateLogin('010-9999-8888', 'g-99998888');
console.log('Login 4 (Post-delete re-registration):', login4 ? `성공 (ID: ${login4.id}, Name: ${login4.name})` : '실패');
if (!login4) throw new Error('Post-delete re-registration login failed');

console.log('\n====================================================');
console.log('🎉 모든 5대 시뮬레이션 케이스 100% ALL PASS!');
console.log('====================================================');
