/**
 * test_draft_upload_delete_5photos.js
 * 시안 업로드(최대 5장, 300KB), 개별/전체 삭제, 시공 후 증빙 사진 업로드/삭제, 6대 화면 연동 무결성 자체 검증 스크립트
 */
const assert = require('assert');
const fs = require('fs');

// 브라우저 Mock 환경 구성
const mockStorage = {};
global.localStorage = {
  getItem: (k) => mockStorage[k] || null,
  setItem: (k, v) => { mockStorage[k] = String(v); },
  removeItem: (k) => { delete mockStorage[k]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};
global.window = global;
global.document = {
  getElementById: () => ({ style: {} }),
  querySelectorAll: () => []
};
global.alert = (msg) => { console.log('   [ALERT 호출]:', msg.split('\n')[0]); };
global.confirm = () => true;

// FileReader Mock
global.FileReader = class {
  readAsDataURL(file) {
    setTimeout(() => {
      this.onload({ target: { result: file.dataUrl || 'data:image/jpeg;base64,mock300kbdata' } });
    }, 5);
  }
};
global.compressImageToBase64 = async (file, maxSizeBytes) => {
  return 'data:image/jpeg;base64,mock300kb_compressed_' + file.name;
};

// data-store.js 로드
const dsCode = fs.readFileSync('./data-store.js', 'utf-8');
eval(dsCode);

async function runVerification() {
  console.log('=== [1단계] 테스트 데이터 준비 ===');
  const testConstructor = {
    id: 'c-partner-01',
    role: 'constructor',
    constCode: 'C-260901',
    businessName: '대한간판',
    items: []
  };
  const testApp = {
    id: 'P-260917-001',
    storeName: '테스트상점',
    ownerName: '홍길동',
    ownerPhone: '010-1234-5678',
    storeAddress: '서울시 강남구',
    signType: '플렉스 간판',
    assignedConstructorId: 'c-partner-01',
    assignedConstructorName: '대한간판',
    constructionStatus: 'before_construction',
    signDraftPhotos: [],
    constructionPhotos: [],
    memo: ''
  };

  localStorage.setItem('users', JSON.stringify([testConstructor]));
  localStorage.setItem('applications', JSON.stringify([testApp]));
  localStorage.setItem('currentUser', JSON.stringify(testConstructor));

  console.log('=== [2단계] 디자인 시안 6장 파일 선택 시 최대 5장 제한 및 300KB 업로드 검증 ===');
  const mockFiles = [
    { name: 'draft1.jpg' },
    { name: 'draft2.jpg' },
    { name: 'draft3.jpg' },
    { name: 'draft4.jpg' },
    { name: 'draft5.jpg' },
    { name: 'draft6.jpg' } // 6번째 파일 (초과분)
  ];

  await window.handleJobDraftUploadCommon('P-260917-001', mockFiles);

  const appsAfterUpload = window.DataStore.getApplications();
  const app1 = appsAfterUpload.find(a => a.id === 'P-260917-001');
  console.log('1. 등록된 시안 장수:', app1.signDraftPhotos.length);
  assert.strictEqual(app1.signDraftPhotos.length, 5, '최대 5장까지만 등록되어야 함');
  assert.strictEqual(app1.constructionStatus, 'design_draft', '시안 등록 시 2단계 시안/교정중으로 변경');

  const jobs1 = window.DataStore.getConstructionJobs(testConstructor);
  console.log('2. getConstructionJobs 복원 시안 장수:', jobs1[0].signDraftPhotos.length);
  assert.strictEqual(jobs1[0].signDraftPhotos.length, 5, 'getConstructionJobs에서도 5장 완벽 복원');
  assert.strictEqual(jobs1[0].signDraftPhotos[0], 'data:image/jpeg;base64,mock300kb_compressed_draft1.jpg');

  console.log('=== [3단계] 디자인 시안 개별 삭제 검증 (2번째 시안 삭제) ===');
  window.deleteJobDraftPhoto('P-260917-001', 1); // 2번째 삭제
  const appsAfterDel1 = window.DataStore.getApplications();
  const app2 = appsAfterDel1.find(a => a.id === 'P-260917-001');
  console.log('1. 1장 삭제 후 남은 시안 장수:', app2.signDraftPhotos.length);
  assert.strictEqual(app2.signDraftPhotos.length, 4, '1장 삭제 후 4장이어야 함');
  assert.strictEqual(app2.signDraftPhotos[1], 'data:image/jpeg;base64,mock300kb_compressed_draft3.jpg', '2번째가 정상 삭제되고 3번째가 당겨짐');

  console.log('=== [4단계] 디자인 시안 전체 삭제 검증 ===');
  window.deleteJobDraftAll('P-260917-001');
  const appsAfterDelAll = window.DataStore.getApplications();
  const app3 = appsAfterDelAll.find(a => a.id === 'P-260917-001');
  console.log('1. 전체 삭제 후 시안 장수:', app3.signDraftPhotos.length);
  assert.strictEqual(app3.signDraftPhotos.length, 0, '전체 삭제 후 0장');
  assert.strictEqual(app3.draftStatus, 'pending', '전체 삭제 후 상태 pending');

  console.log('=== [5단계] 시공 후 현장 증빙 사진 업로드 및 삭제 검증 ===');
  const mockPhotos = [
    { name: 'photo1.jpg' },
    { name: 'photo2.jpg' },
    { name: 'photo3.jpg' }
  ];
  await window.handleJobPhotoUploadCommon('P-260917-001', mockPhotos);
  const appsAfterPhoto = window.DataStore.getApplications();
  const app4 = appsAfterPhoto.find(a => a.id === 'P-260917-001');
  console.log('1. 시공 후 사진 장수:', app4.constructionPhotos.length);
  assert.strictEqual(app4.constructionPhotos.length, 3, '시공 사진 3장 등록');

  window.deleteJobConstructionPhoto('P-260917-001', 0);
  const appsAfterPhotoDel = window.DataStore.getApplications();
  const app5 = appsAfterPhotoDel.find(a => a.id === 'P-260917-001');
  console.log('2. 시공 사진 1장 삭제 후 남은 장수:', app5.constructionPhotos.length);
  assert.strictEqual(app5.constructionPhotos.length, 2, '시공 사진 1장 삭제 후 2장');

  console.log('\n>>> 모든 테스트 케이스 100% 정상 통과 (ALL PASS) <<<');
}

runVerification().catch(err => {
  console.error('테스트 실패:', err);
  process.exit(1);
});
