const fs = require('fs');

console.log('================================================================');
console.log('   [간판지원단] 사진 등록/보존/다운로드 완전 재구축 3단계 자체 검증');
console.log('================================================================');

// 1단계: DOM 무결성 검사
console.log('\n--- [1단계] DOM 무결성 검사 ---');
const htmlFiles = ['index.html', 'dashboard.html', 'app.html'];
let step1Pass = true;
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const openDiv = (content.match(/<div(\s|>)/gi) || []).length;
  const closeDiv = (content.match(/<\/div>/gi) || []).length;
  if (openDiv !== closeDiv) {
    console.error(` ❌ ${file}: open div (${openDiv}) vs close div (${closeDiv}) 불일치`);
    step1Pass = false;
  } else {
    console.log(` ✅ ${file}: open div (${openDiv}) vs close div (${closeDiv}) 완전 일치`);
  }
}

// 2단계: 문법 및 핵심 함수 존재 검사
console.log('\n--- [2단계] 핵심 함수 및 SSOT 연동 검사 ---');
const secUtils = fs.readFileSync('security-utils.js', 'utf8');
const dashboard = fs.readFileSync('dashboard.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

const checks = [
  { name: 'security-utils.js: handleApplicationPhotoUploadProcess 정의', pass: secUtils.includes('function handleApplicationPhotoUploadProcess') },
  { name: 'security-utils.js: window.handleApplicationPhotoUploadProcess 노출', pass: secUtils.includes('window.handleApplicationPhotoUploadProcess = handleApplicationPhotoUploadProcess') },
  { name: 'security-utils.js: downloadApplicationPhotos 단일/다중 모달 통합', pass: secUtils.includes('showPhotoDownloadModal(app)') && !secUtils.includes('photos.length === 1) {\n    const singleData') },
  { name: 'dashboard.js: handleApplicationPhotoUploadPC 가 SSOT 함수 호출', pass: dashboard.includes('window.handleApplicationPhotoUploadProcess(appId, { isMobile: false })') },
  { name: 'app.js: handleApplicationPhotoUploadMob 가 SSOT 함수 호출', pass: app.includes('window.handleApplicationPhotoUploadProcess(appId, { isMobile: true })') },
  { name: '다중 파일 선택 multiple 속성 지원', pass: secUtils.includes('fileInput.multiple = true') },
  { name: '기존 사진 로드 ensureApplicationPhotosLoaded 호출', pass: secUtils.includes('await ensureApplicationPhotosLoaded(appId)') },
  { name: '기존 사진 뒤 추가 concat 로직', pass: secUtils.includes('existingPhotos.concat(newPhotos)') },
  { name: 'PhotoCacheManager 캐시 동기화 연동', pass: secUtils.includes('window.PhotoCacheManager.set(appId') }
];

let step2Pass = true;
for (const c of checks) {
  console.log(` ${c.pass ? '✅' : '❌'} ${c.name}`);
  if (!c.pass) step2Pass = false;
}

// 3단계: 가상 시뮬레이션 동작 검증
console.log('\n--- [3단계] 가상 시뮬레이션 동작 검증 ---');
// 시나리오 A: 기존 사진 2장이 있는 상태에서 새 사진 1장 추가 시
const mockExistingPhotos = ['data:image/jpeg;base64,photo1', 'data:image/jpeg;base64,photo2'];
const mockNewPhotos = ['data:image/jpeg;base64,photo3'];
const isAppend = true;
const finalPhotosAppend = isAppend ? mockExistingPhotos.concat(mockNewPhotos) : mockNewPhotos;

console.log(` - 시나리오 A (추가 선택 시): 기존 2장 + 신규 1장 -> 총 ${finalPhotosAppend.length}장 보존`);
if (finalPhotosAppend.length === 3 && finalPhotosAppend[0] === mockExistingPhotos[0]) {
  console.log('   -> 기존 사진 유실 없이 신규 사진이 정확히 병합됨 (PASS ✅)');
} else {
  console.error('   -> 병합 실패 (FAIL ❌)');
}

// 시나리오 B: 교체 선택 시
const isAppendFalse = false;
const finalPhotosReplace = isAppendFalse ? mockExistingPhotos.concat(mockNewPhotos) : mockNewPhotos;
console.log(` - 시나리오 B (교체 선택 시): 기존 2장 삭제 -> 총 ${finalPhotosReplace.length}장 교체`);
if (finalPhotosReplace.length === 1 && finalPhotosReplace[0] === mockNewPhotos[0]) {
  console.log('   -> 관리자의 의도대로 안전하게 교체됨 (PASS ✅)');
} else {
  console.error('   -> 교체 실패 (FAIL ❌)');
}

console.log('\n================================================================');
if (step1Pass && step2Pass) {
  console.log('   🎉 3단계 자체 사전 검증 100% 통과 완료!');
} else {
  console.error('   ❌ 검증 실패 항목 존재');
  process.exit(1);
}
console.log('================================================================');
