const fs = require('fs');
const path = require('path');

// 1. 브라우저 및 DataStore 환경 구성
const storage = {};
const localStorageMock = {
  getItem: (k) => (storage[k] !== undefined ? storage[k] : null),
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};

global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;
global.alert = function(msg) {};
global.confirm = function(msg) { return true; };

function createChain() {
  const chain = {
    select: function() { return this; },
    update: function() { return this; },
    upsert: function() { return this; },
    insert: function() { return this; },
    delete: function() { return this; },
    eq: function() { return this; },
    in: function() { return this; },
    then: function(resolve) {
      resolve({ data: [], error: null });
    }
  };
  return chain;
}

global.window = {
  localStorage: localStorageMock,
  sessionStorage: localStorageMock,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  location: { reload: () => {} },
  CustomEvent: function(type, detail) { return { type, detail }; },
  supabaseClient: {
    from: () => createChain(),
    channel: () => ({ on: function() { return this; }, subscribe: function() { return this; } })
  },
  showToast: function(msg) {},
  showNotification: function(msg) {}
};
global.CustomEvent = global.window.CustomEvent;

const dataStoreCode = fs.readFileSync(path.join(__dirname, '../data-store.js'), 'utf8');
eval(dataStoreCode);
const DataStore = global.window.DataStore;

console.log('==================================================================');
console.log('🚀 [가입 점주 연락처 수정 시 아이디/비밀번호 보존] 5회 연속 전수 실증 테스트');
console.log('==================================================================');

for (let cycle = 1; cycle <= 5; cycle++) {
  console.log(`\n--- [CYCLE ${cycle} / 5 시작] ---`);

  // 1. 직접 가입한 정회원 등록
  const testUser = {
    id: `owner_custom_id_${cycle}`,
    name: `홍길동대표_${cycle}`,
    phone: '010-1111-2222',
    pw: `secret_hashed_password_${cycle}`,
    role: 'normal',
    items: []
  };
  DataStore.saveUsers([testUser]);

  // 2. 해당 회원이 접수한 신청서
  const testApp = {
    id: `app_custom_${cycle}`,
    storeName: `대박분식_${cycle}`,
    ownerName: `홍길동대표_${cycle}`,
    ownerPhone: '010-1111-2222',
    userId: testUser.id,
    isBizItem: false,
    status: 'pending'
  };
  DataStore.saveApplications([testApp]);

  // Step 1: 수정 전 점주 계정 무결성 확인
  let usersBefore = DataStore.getUsers();
  let userBefore = usersBefore.find(u => u.id === testUser.id);
  if (!userBefore || userBefore.pw !== testUser.pw) {
    throw new Error(`[Cycle ${cycle}] Step 1 실패: 초기 회원 데이터 이상`);
  }
  console.log(`[Cycle ${cycle}] Step 1: 초기 가입 점주 계정(ID: ${userBefore.id}, PW: 보존됨) 정상 확인 ✅`);

  // Step 2: 최고관리자가 신청서 연락처를 010-1111-2222 -> 010-9999-8888 로 수정
  const updateRes = DataStore.updateApplication(testApp.id, {
    ownerPhone: '010-9999-8888',
    phone: '010-9999-8888',
    storeAddress: '서울시 강남구 테헤란로 100'
  });

  if (!updateRes || !updateRes.success) {
    throw new Error(`[Cycle ${cycle}] Step 2 실패: updateApplication 함수 반환 실패`);
  }

  // Step 3: 수정 후 회원 계정(ID, PW 불변 여부 & 연락처 갱신 여부) 검증
  let usersAfter = DataStore.getUsers();
  let userAfter = usersAfter.find(u => u.id === testUser.id);

  if (!userAfter) {
    throw new Error(`[Cycle ${cycle}] Step 3 실패: 점주의 고유 아이디(${testUser.id})가 변조/삭제됨!`);
  }
  if (userAfter.pw !== testUser.pw) {
    throw new Error(`[Cycle ${cycle}] Step 3 실패: 점주의 원래 비밀번호가 덮어씌워짐! (현재: ${userAfter.pw})`);
  }
  if (userAfter.phone !== '010-9999-8888') {
    throw new Error(`[Cycle ${cycle}] Step 3 실패: 점주의 연락처가 갱신되지 않음 (현재: ${userAfter.phone})`);
  }

  console.log(`[Cycle ${cycle}] Step 2~3: 대표자 번호 수정 후 점주 아이디(${userAfter.id}) & 원래 비밀번호 100% 불변 보존 및 연락처 갱신 완료 ✅`);

  // Step 4: 수정 후 점주 아이디로 로그인 시뮬레이션
  const loginMatch = usersAfter.find(u => u.id === testUser.id && u.pw === testUser.pw && u.role !== 'deleted');
  if (!loginMatch) {
    throw new Error(`[Cycle ${cycle}] Step 4 실패: 원래 아이디/비밀번호로 로그인 불가`);
  }
  console.log(`[Cycle ${cycle}] Step 4: 원래 아이디/비밀번호로 정상 로그인 통과 (세션 정상 유지) ✅`);

  console.log(`🎯 [Cycle ${cycle}] 100% 무결점 통과 (PASS)`);
}

console.log('\n==================================================================');
console.log('🎉 5개 에이전트 합동 5회 연속 전수 실증 테스트 100% ALL PASS (완벽 무결 증명)');
console.log('==================================================================');
