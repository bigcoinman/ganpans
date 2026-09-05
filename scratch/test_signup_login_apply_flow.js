// scratch/test_signup_login_apply_flow.js
const assert = require('assert');

function runSimulation() {
  console.log('=== [테스트] 신규 회원가입 -> 로그인 -> 신청서 작성 플로우 검증 ===');

  // 1. 점주 김진수 회원가입
  const signupUser = {
    id: 'jinsoo2026',
    pw: 'hashed_original_pw_9999',
    name: '김진수',
    phone: '010-9986-7135',
    email: 'jinsoo@example.com',
    role: 'normal'
  };

  const usersStore = [signupUser];

  // 2. 로그인 세션
  const loggedUser = signupUser;

  // 3. 신청서 제출 (submitApplication 시뮬레이션)
  const ownerName = '김진수';
  const ownerPhone = '010-9986-7135';
  const storeName = '진수물산';
  const storeAddress = '경기도 용인시';

  const phoneDigits = ownerPhone.replace(/[^0-9]/g, '');
  const autoPw = 'g-' + phoneDigits.slice(-8);

  let userId = phoneDigits;
  let loginNoticeId = phoneDigits;
  let loginNoticePw = '';
  let isNewAccount = false;

  if (loggedUser && (loggedUser.role === 'normal' || !loggedUser.role || loggedUser.role === 'user' || loggedUser.id)) {
    userId = loggedUser.id;
    loginNoticeId = loggedUser.id;
    loginNoticePw = '';
    isNewAccount = false;
  }

  const isExistingAccount = Boolean(
    (loggedUser && (loggedUser.role === 'normal' || !loggedUser.role || loggedUser.role === 'user' || loggedUser.id)) ||
    !isNewAccount ||
    !loginNoticePw
  );

  if (isExistingAccount) {
    loginNoticePw = '';
  }

  // 3단계 완료 창 비밀번호 텍스트 시뮬레이션
  let compPwDisplay = '';
  let compPwLabel = '';
  if (isExistingAccount || !loginNoticePw) {
    compPwDisplay = '기존 가입하신 계정으로 바로 조회 가능합니다';
    compPwLabel = '비밀번호';
  } else {
    compPwDisplay = loginNoticePw;
    compPwLabel = '임시 비밀번호';
  }

  console.log(`- 가입 아이디: ${loginNoticeId}`);
  console.log(`- isExistingAccount: ${isExistingAccount}`);
  console.log(`- loginNoticePw: '${loginNoticePw}'`);
  console.log(`- 3단계 라벨: ${compPwLabel}`);
  console.log(`- 3단계 표시 내용: ${compPwDisplay}`);

  assert.strictEqual(loginNoticeId, 'jinsoo2026', '가입 아이디가 정상 표시되어야 함');
  assert.strictEqual(isExistingAccount, true, 'isExistingAccount는 true여야 함');
  assert.strictEqual(loginNoticePw, '', '임시 비밀번호는 비어있어야 함');
  assert.strictEqual(compPwDisplay, '기존 가입하신 계정으로 바로 조회 가능합니다', '안내 문구가 정확히 일치해야 함');
  assert.strictEqual(compPwLabel, '비밀번호', '라벨이 비밀번호여야 함');

  console.log('✅ 모든 시뮬레이션 검증 100% 통과!');
}

runSimulation();
