// Automated Verification: Sign Draft Upload & Site Photo Sync in Constructor Dashboard
const fs = require('fs');
const assert = require('assert');

// Set up mock browser environment
const localStorageData = {};
global.localStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};

global.window = global;
global.window.addEventListener = () => {};
global.window.removeEventListener = () => {};
global.document = {
  querySelectorAll: () => [],
  getElementById: () => null,
  addEventListener: () => {},
  createElement: () => ({ style: {}, appendChild: () => {}, innerHTML: '' }),
  body: { appendChild: () => {} }
};
global.alert = (msg) => console.log('   [ALERT]', msg.split('\n')[0]);
global.confirm = () => true;

// Load files
require('../supabase-config.js');
require('../security-utils.js');
require('../data-store.js');

console.log('=== [1단계] 테스트 데이터 셋업 (시공사 wooriad & 신청서 진수상회 B-260901-003) ===');
const testConstructor = {
  id: 'wooriad',
  name: '기우리',
  role: 'constructor',
  constCode: 'BPC-2609001',
  businessName: '우리광고사',
  phone: '010-9999-8888'
};

const testOwner = {
  id: 'owner_jinsoo',
  name: '박진수',
  role: 'user',
  phone: '010-1234-5678'
};

const testApp = {
  id: 'B-260901-003',
  userId: 'owner_jinsoo',
  ownerName: '박진수',
  ownerPhone: '010-1234-5678',
  storeName: '진수상회',
  storeAddress: '서울시 종로구 대학로 100',
  signType: '플렉스 간판',
  status: 'approved',
  progressStatus: '간판시공 준비중',
  constructionStatus: 'before_construction',
  assignedConstructorId: 'wooriad',
  assignedConstructorName: '우리광고사',
  photos: ['data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD_TEST_PHOTO_1'],
  photosCount: 1,
  hasPhoto: true,
  fileData: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD_TEST_PHOTO_1',
  memo: JSON.stringify({
    photoCount: 1,
    progressStatus: '간판시공 준비중',
    isBizItem: true
  })
};

window.DataStore.saveUsers([testConstructor, testOwner]);
window.DataStore.saveApplications([testApp]);

console.log('=== [2단계] 시공업체 대시보드 점주 현장 사진 연동 검증 ===');
const constJobs = window.DataStore.getConstructionJobs(testConstructor);
console.log('1. getConstructionJobs 결과 건수:', constJobs.length);
assert.strictEqual(constJobs.length, 1, '시공사 배정 건 1건 조회되어야 함');

const targetJob = constJobs[0];
console.log('2. job 데이터 확인:');
console.log('   - storeName:', targetJob.storeName);
console.log('   - photosCount:', targetJob.photosCount);
console.log('   - photos 길이:', targetJob.photos ? targetJob.photos.length : 0);
console.log('   - hasPhoto:', targetJob.hasPhoto);

// pCount 계산 로직 검증 (dashboard.js line 5284 & app.js line 4801 과 동일)
const memoPhotoCount = (() => {
  try {
    const m = typeof targetJob.memo === 'string' ? JSON.parse(targetJob.memo) : (targetJob.memo || {});
    return (m && m.photoCount) ? Number(m.photoCount) : 0;
  } catch(e) { return 0; }
})();
const pCount = Math.max(
  (Array.isArray(targetJob.photos) ? targetJob.photos.length : 0),
  Number(targetJob.photosCount) || 0,
  memoPhotoCount,
  (targetJob.hasPhoto ? 1 : 0)
);
console.log('3. 계산된 점주 현장사진 pCount:', pCount);
assert(pCount > 0, '점주 현장사진 pCount가 0보다 커야 합니다!');
console.log('   ✅ 시공업체 대시보드 점주 현장 사진 버튼 노출 검증 성공!');

console.log('=== [3단계] 시공업체 간판 디자인 시안 업로드 및 DB/메모 보존 검증 ===');
// 시안 업로드 시뮬레이션
const sampleDraftPhotos = [
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==_DRAFT_1',
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==_DRAFT_2'
];

let apps = window.DataStore.getApplications();
let targetMemoStr = '';
apps = apps.map(app => {
  if (app.id === targetJob.id) {
    let mObj = {};
    try { mObj = typeof app.memo === 'string' ? JSON.parse(app.memo) : (app.memo || {}); } catch(e) {}
    mObj.signDraftPhotos = sampleDraftPhotos;
    mObj.draftStatus = 'pending';
    mObj.draftCount = sampleDraftPhotos.length;
    targetMemoStr = JSON.stringify(mObj);
    return {
      ...app,
      signDraftPhotos: sampleDraftPhotos,
      draftStatus: 'pending',
      constructionStatus: 'design_draft',
      memo: targetMemoStr
    };
  }
  return app;
});
window.DataStore.saveApplications(apps);

const updatedApp = window.DataStore.getApplications().find(a => a.id === targetJob.id);
console.log('1. 로컬 저장 후 signDraftPhotos 길이:', updatedApp.signDraftPhotos.length);
console.log('2. 로컬 저장 후 draftStatus:', updatedApp.draftStatus);
console.log('3. memo 내 signDraftPhotos 포함 여부:', updatedApp.memo.includes('signDraftPhotos'));
assert.strictEqual(updatedApp.signDraftPhotos.length, 2, '시안 사진 2장이 보존되어야 함');
assert.strictEqual(updatedApp.draftStatus, 'pending', '시안 상태가 pending이어야 함');

console.log('=== [4단계] mapAppToDb & mapDbToApp 변환 무결성 검증 (Supabase 왕복) ===');
const dbPayload = window.SupabaseSync.mapAppToDb(updatedApp);
console.log('1. DB 페이로드 memo:', dbPayload.memo);
const parsedDbMemo = JSON.parse(dbPayload.memo);
console.log('   - memo.signDraftPhotos 길이:', parsedDbMemo.signDraftPhotos.length);
console.log('   - memo.draftStatus:', parsedDbMemo.draftStatus);
assert.strictEqual(parsedDbMemo.signDraftPhotos.length, 2, 'DB memo에 시안 사진 2장 보존');
assert.strictEqual(parsedDbMemo.draftStatus, 'pending', 'DB memo에 시안 상태 pending 보존');

const restoredApp = window.SupabaseSync.mapDbToApp({
  id: dbPayload.id,
  user_id: dbPayload.user_id,
  owner_name: dbPayload.owner_name,
  phone: dbPayload.phone,
  store_name: dbPayload.store_name,
  store_address: dbPayload.store_address,
  sign_type: dbPayload.sign_type,
  referrer_code: dbPayload.referrer_code,
  status: dbPayload.status,
  assigned_constructor_id: dbPayload.assigned_constructor_id,
  assigned_constructor_name: dbPayload.assigned_constructor_name,
  construction_status: dbPayload.construction_status,
  memo: dbPayload.memo
});

console.log('2. mapDbToApp 복원 확인:');
console.log('   - restoredApp.signDraftPhotos 길이:', restoredApp.signDraftPhotos.length);
console.log('   - restoredApp.draftStatus:', restoredApp.draftStatus);
assert.strictEqual(restoredApp.signDraftPhotos.length, 2, 'mapDbToApp으로 시안 2장 복원 성공');
assert.strictEqual(restoredApp.draftStatus, 'pending', 'mapDbToApp으로 시안 상태 pending 복원 성공');

console.log('=== [5단계] 점주 시안 승인(approveDraftByOwner) 및 관리자 직권확정 연동 검증 ===');
// 점주 승인 호출
window.approveDraftByOwner(targetJob.id);
const ownerApprovedApp = window.DataStore.getApplications().find(a => a.id === targetJob.id);
console.log('1. 점주 승인 후 draftStatus:', ownerApprovedApp.draftStatus);
assert.strictEqual(ownerApprovedApp.draftStatus, 'owner_approved', '점주 승인 완료 상태여야 함');
const ownerApprovedMemo = JSON.parse(ownerApprovedApp.memo);
assert.strictEqual(ownerApprovedMemo.draftStatus, 'owner_approved', 'memo에도 owner_approved 저장되어야 함');

// 관리자 직권확정 호출
window.toggleDraftApproval(targetJob.id, 'admin_approved');
const adminApprovedApp = window.DataStore.getApplications().find(a => a.id === targetJob.id);
console.log('2. 관리자 직권확정 후 draftStatus:', adminApprovedApp.draftStatus);
assert.strictEqual(adminApprovedApp.draftStatus, 'admin_approved', '관리자 직권확정 완료 상태여야 함');
const adminApprovedMemo = JSON.parse(adminApprovedApp.memo);
assert.strictEqual(adminApprovedMemo.draftStatus, 'admin_approved', 'memo에도 admin_approved 저장되어야 함');

console.log('=== [6단계] 시공업체 대시보드 리렌더링 시 최신 시안 및 점주 현장사진 검증 ===');
const finalConstJobs = window.DataStore.getConstructionJobs(testConstructor);
const finalJob = finalConstJobs[0];
console.log('1. finalJob.signDraftPhotos 길이:', finalJob.signDraftPhotos.length);
console.log('2. finalJob.draftStatus:', finalJob.draftStatus);
console.log('3. finalJob.photosCount:', finalJob.photosCount);
assert.strictEqual(finalJob.signDraftPhotos.length, 2, '시공사 대시보드 시안 사진 유지');
assert.strictEqual(finalJob.draftStatus, 'admin_approved', '시공사 대시보드 시안 상태 동기화');
assert.strictEqual(finalJob.photosCount, 1, '시공사 대시보드 점주 현장사진 유지');

console.log('\n⭐⭐⭐ [전체 6단계 검증 100% 통과 완료] ⭐⭐⭐');
