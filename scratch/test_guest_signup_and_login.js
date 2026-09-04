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

// Setup initial state
localStorage.setItem('users', JSON.stringify([]));
localStorage.setItem('applications', JSON.stringify([]));

console.log('--- Step 1: Simulate Guest Submitting Application ---');
const ownerName = '홍길동';
const ownerPhone = '010-1234-5678';
const phoneDigits = ownerPhone.replace(/[^0-9]/g, ''); // '01012345678'
const storeName = '길동베이커리';
const storeAddress = '서울시 강남구 테헤란로 123';
const autoPw = 'g-98765432';
const hashedPassword = sha256(autoPw);
const now = new Date();

let users = JSON.parse(localStorage.getItem('users')) || [];
let apps = JSON.parse(localStorage.getItem('applications')) || [];

let userId = phoneDigits;
let loginNoticeId = phoneDigits;
let loginNoticePw = autoPw;
let isNewAccount = false;

const existingIdx = users.findIndex(u => {
  const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
  return (uPhoneDigits && uPhoneDigits === phoneDigits) || (u.id && String(u.id).toLowerCase() === phoneDigits.toLowerCase());
});

if (existingIdx !== -1) {
  const existing = users[existingIdx];
  userId = existing.id;
  loginNoticeId = existing.id;
  loginNoticePw = autoPw;
  if (existing.role === 'normal' || !existing.role) {
    users[existingIdx] = {
      ...existing,
      name: ownerName || existing.name,
      phone: ownerPhone,
      address: storeAddress || existing.address,
      pw: hashedPassword
    };
    localStorage.setItem('users', JSON.stringify(users));
  }
} else {
  userId = phoneDigits;
  loginNoticeId = phoneDigits;
  loginNoticePw = autoPw;
  isNewAccount = true;

  const newUser = {
    id: phoneDigits,
    name: ownerName,
    phone: ownerPhone,
    email: '',
    address: storeAddress,
    pw: hashedPassword,
    role: 'normal',
    conversionStatus: 'none',
    items: [],
    createdAt: now.toISOString()
  };

  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
}

const customId = 'P-260905001';
const newApp = {
  id: customId,
  userId: userId,
  applicantUserId: userId,
  registeredBy: phoneDigits,
  salespersonId: '',
  salespersonName: '',
  ownerName,
  ownerPhone,
  storeName,
  storeAddress,
  signType: '간판지원신청',
  appliedAt: now.toISOString(),
  status: 'pending',
  isBizItem: false,
  receiptStatus: '접수완료',
  progressStatus: '심사대기중',
  referrerCode: '',
  autoAccount: {
    id: loginNoticeId,
    pw: loginNoticePw,
    isNew: isNewAccount
  }
};
apps.push(newApp);
localStorage.setItem('applications', JSON.stringify(apps));

const savedUsers = JSON.parse(localStorage.getItem('users'));
console.log('Saved users count:', savedUsers.length);
console.log('Saved user data:', savedUsers[0]);
if (savedUsers.length === 1 && savedUsers[0].id === '01012345678' && savedUsers[0].pw === hashedPassword) {
  console.log('PASS: User successfully created in users storage!');
} else {
  console.error('FAIL: User creation failed!');
  process.exit(1);
}

console.log('\n--- Step 2: Simulate Login with Hyphenated Phone Number (010-1234-5678) ---');
function simulateLogin(idVal, pwVal) {
  const idValLower = idVal.toLowerCase();
  const cleanDigits = (idVal.replace(/[^0-9]/g, '').length >= 7) ? idVal.replace(/[^0-9]/g, '') : '';
  const hashed = sha256(pwVal);
  const localUsers = JSON.parse(localStorage.getItem('users')) || [];
  const deletedIds = [];

  let user = null;
  const localUser = localUsers.find(u => {
    const uId = String(u.id || '').toLowerCase();
    const uPhoneDigits = String(u.phone || '').replace(/[^0-9]/g, '');
    const uIdDigits = uId.replace(/[^0-9]/g, '');
    const isMatchUser = (uId === idVal.toLowerCase()) ||
      (cleanDigits && uId === cleanDigits.toLowerCase()) ||
      (cleanDigits && uPhoneDigits === cleanDigits) ||
      (cleanDigits && uIdDigits === cleanDigits);
    return isMatchUser && (u.pw === hashed || u.pw === pwVal);
  });

  if (localUser) {
    user = localUser;
  }
  return user;
}

const loginResult1 = simulateLogin('010-1234-5678', autoPw);
console.log('Login result (hyphenated):', loginResult1 ? `Success! Name: ${loginResult1.name}, ID: ${loginResult1.id}` : 'Failed');
if (!loginResult1) {
  console.error('FAIL: Hyphenated phone login failed!');
  process.exit(1);
}

console.log('\n--- Step 3: Simulate Login with Digits Phone Number (01012345678) ---');
const loginResult2 = simulateLogin('01012345678', autoPw);
console.log('Login result (digits only):', loginResult2 ? `Success! Name: ${loginResult2.name}, ID: ${loginResult2.id}` : 'Failed');
if (!loginResult2) {
  console.error('FAIL: Digits phone login failed!');
  process.exit(1);
}

console.log('\n--- Step 4: Verify Normal User Dashboard Application Retrieval ---');
const loggedInUser = loginResult1;
const allApps = JSON.parse(localStorage.getItem('applications')) || [];
const userPhoneDigits = (loggedInUser.phone || '').replace(/[^0-9]/g, '');
const userNormalApps = allApps.filter(app => {
  const appApplicantId = String(app.applicantUserId || '').toLowerCase();
  const appUserId = String(app.userId || '').toLowerCase();
  const appPhoneDigits = String(app.ownerPhone || '').replace(/[^0-9]/g, '');
  const appRegisteredBy = String(app.registeredBy || '').toLowerCase();

  return (appApplicantId === loggedInUser.id.toLowerCase()) ||
         (appUserId === loggedInUser.id.toLowerCase()) ||
         (userPhoneDigits && appPhoneDigits === userPhoneDigits) ||
         (appRegisteredBy === loggedInUser.id.toLowerCase());
});

console.log('User normal apps found:', userNormalApps.length);
if (userNormalApps.length === 1 && userNormalApps[0].storeName === '길동베이커리') {
  console.log('PASS: Normal user successfully views their application on dashboard!');
} else {
  console.error('FAIL: Dashboard app retrieval failed!');
  process.exit(1);
}

console.log('\nALL TESTS PASSED 100%!');
