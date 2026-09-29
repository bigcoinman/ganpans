/**
 * scratch/test_user_delete_4step_pipeline.js
 * 회원정보관리 회원 삭제 4중 방어 파이프라인 전수 검증
 */

const assert = require('assert');

// 가상 브라우저 환경 모킹
const storage = {
  users: JSON.stringify([
    { id: 'admin', name: '최고관리자', role: 'admin', phone: '010-0000-0000' },
    { id: 'custom_owner_1', name: '정회원점주', role: 'normal', phone: '010-1111-2222' },
    { id: '01033334444', name: '단순비회원', role: 'normal', phone: '010-3333-4444' },
    { id: '01055556666', name: '시공진행비회원', role: 'normal', phone: '010-5555-6666' }
  ]),
  applications: JSON.stringify([
    {
      id: 'APP-CUSTOM-1',
      userId: 'custom_owner_1',
      ownerName: '정회원점주',
      ownerPhone: '010-1111-2222',
      storeName: '정회원가게',
      status: 'pending',
      isBizItem: false
    },
    {
      id: 'APP-SIMPLE-1',
      userId: '01033334444',
      ownerName: '단순비회원',
      ownerPhone: '010-3333-4444',
      storeName: '단순비회원가게',
      status: 'pending',
      isBizItem: false
    },
    {
      id: 'APP-BUSY-1',
      userId: '01055556666',
      ownerName: '시공진행비회원',
      ownerPhone: '010-5555-6666',
      storeName: '시공중인가게',
      status: 'approved',
      isBizItem: true,
      assignedConstructorId: 'CONST-1',
      constructionStatus: 'preparing'
    }
  ])
};

global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

global.alert = (msg) => { console.log('  [Alert 출력]:', msg.split('\n')[0]); };
global.confirm = () => true; // 모의 확인 승인

let supaDeleteCalls = [];
global.window = {
  localStorage: global.localStorage,
  alert: global.alert,
  confirm: global.confirm,
  SupabaseSync: {
    deleteUser: async (uid, phone, deleteApps) => {
      supaDeleteCalls.push({ uid, phone, deleteApps });
      return true;
    },
    deleteApplication: async (appId) => {
      return true;
    }
  },
  renderAdminDashboardMob: () => {},
  renderAllUsersList: () => {}
};

// data-store 로드
const fs = require('fs');
const path = require('path');
const dsCode = fs.readFileSync(path.join(__dirname, '../data-store.js'), 'utf8');

// data-store 평가
eval(dsCode);

async function runTests() {
  console.log('========================================================');
  console.log('🧪 [검증 1] 최고관리자(admin) 계정 영구 삭제 차단 검증');
  console.log('========================================================');
  const resAdmin = await window.DataStore.deleteUser('admin', null, true);
  assert.strictEqual(resAdmin.success, false, '최고관리자 삭제 실패 반환');
  assert.strictEqual(resAdmin.blocked, true, '최고관리자 차단 플래그 반환');
  let users = window.DataStore.getUsers();
  assert(users.some(u => u.id === 'admin'), 'admin 계정 보존 확인');
  console.log('✅ 통과: 최고관리자(admin) 영구 삭제 차단 완벽');

  console.log('\n========================================================');
  console.log('🧪 [검증 2] 진행 중인 영업물건/시공 물건 연결 비회원 삭제 차단 검증');
  console.log('========================================================');
  const resBusy = await window.DataStore.deleteUser('01055556666', null, true);
  assert.strictEqual(resBusy.success, false, '진행물건 비회원 삭제 실패 반환');
  assert.strictEqual(resBusy.blocked, true, '진행물건 비회원 차단 플래그 반환');
  users = window.DataStore.getUsers();
  assert(users.some(u => u.id === '01055556666'), '진행물건 비회원 보존 확인');
  let apps = window.DataStore.getApplications();
  assert(apps.some(a => a.id === 'APP-BUSY-1'), '시공진행 물건 보존 확인');
  console.log('✅ 통과: 진행 중인 물건이 있는 비회원 삭제 차단 완벽');

  console.log('\n========================================================');
  console.log('🧪 [검증 3] 정회원 점주 삭제 검증 (회원 삭제 + 신청서 보존)');
  console.log('========================================================');
  supaDeleteCalls = [];
  const resCustom = await window.DataStore.deleteUser('custom_owner_1', null, true);
  assert.strictEqual(resCustom.success, true, '정회원 점주 삭제 성공 반환');
  users = window.DataStore.getUsers();
  assert(!users.some(u => u.id === 'custom_owner_1'), 'users에서 정회원 제거 확인');
  apps = window.DataStore.getApplications();
  assert(apps.some(a => a.id === 'APP-CUSTOM-1'), '정회원의 신청서 APP-CUSTOM-1은 안전 보존 확인');
  assert.strictEqual(supaDeleteCalls[0].deleteApps, false, 'Supabase 호출 시 deleteApps=false 전달 확인');
  console.log('✅ 통과: 정회원 점주 삭제 시 물건 보존 및 회원 단독 분리 삭제 완벽');

  console.log('\n========================================================');
  console.log('🧪 [검증 4] 단순 비회원 삭제 검증 (회원과 신청서 한몸 동시 소각)');
  console.log('========================================================');
  supaDeleteCalls = [];
  const resSimple = await window.DataStore.deleteUser('01033334444', null, true);
  assert.strictEqual(resSimple.success, true, '단순 비회원 삭제 성공 반환');
  users = window.DataStore.getUsers();
  assert(!users.some(u => u.id === '01033334444'), 'users에서 비회원 계정 소각 확인');
  apps = window.DataStore.getApplications();
  assert(!apps.some(a => a.id === 'APP-SIMPLE-1'), 'applications에서 비회원 신청서 동시 소각 확인');
  assert.strictEqual(supaDeleteCalls[0].deleteApps, true, 'Supabase 호출 시 deleteApps=true 전달 확인');
  console.log('✅ 통과: 단순 비회원 점주 삭제 시 계정과 신청서 한몸 동시 소각 완벽');

  console.log('\n========================================================');
  console.log('🧪 [검증 5] 삭제 후 동일 정보로 재신청 시뮬레이션');
  console.log('========================================================');
  // 동일한 번호로 재신청 시 기존 계정이 없으므로 신규 비회원으로 정상 생성
  const newPhone = '01033334444';
  const existing = window.DataStore.getUsers().find(u => u.id === newPhone || u.phone === '010-3333-4444');
  assert.strictEqual(existing, undefined, '기존 계정 부존재(소각 상태) 확인');
  const reAppliedUser = { id: newPhone, name: '단순비회원', phone: '010-3333-4444', role: 'normal' };
  window.DataStore.saveUsers([...window.DataStore.getUsers(), reAppliedUser]);
  const reAppliedApp = { id: 'APP-SIMPLE-NEW', userId: newPhone, ownerPhone: '010-3333-4444', storeName: '새가게' };
  window.DataStore.saveApplications([...window.DataStore.getApplications(), reAppliedApp]);
  assert(window.DataStore.getUsers().some(u => u.id === newPhone), '재신청 계정 정상 등록 확인');
  assert(window.DataStore.getApplications().some(a => a.id === 'APP-SIMPLE-NEW'), '재신청 물건 정상 등록 확인');
  console.log('✅ 통과: 동일 정보 재신청 시 결함 0건 정상 생성 완벽');

  console.log('\n🎉 [전수 검증 완료] 모든 테스트 100% 통과!');
}

runTests().catch(err => {
  console.error('❌ 테스트 실패:', err);
  process.exit(1);
});
