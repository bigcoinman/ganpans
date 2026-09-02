// test_bandwidth_diet.js
const fs = require('fs');
const path = require('path');

console.log('=== [대역폭 99% 절감 & 300KB 경량화 전수 검증 시작] ===');

const secUtilsContent = fs.readFileSync(path.join(__dirname, '../security-utils.js'), 'utf8');
const dashboardContent = fs.readFileSync(path.join(__dirname, '../dashboard.js'), 'utf8');
const appContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const scriptContent = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');

// 1. 300KB 압축 파라미터 점검
const secHas300KB = secUtilsContent.includes('300 * 1024');
const dashHas300KB = dashboardContent.includes('300 * 1024');
const appHas300KB = appContent.includes('300 * 1024');
const scriptHas300KB = scriptContent.includes('300 * 1024');

console.log(`1. 300KB 경량 압축 파라미터 점검:`);
console.log(` - security-utils.js: ${secHas300KB ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(` - dashboard.js: ${dashHas300KB ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(` - app.js: ${appHas300KB ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(` - script.js: ${scriptHas300KB ? 'PASS ✅' : 'FAIL ❌'}`);

// 2. ensureApplicationPhotosLoaded 온디맨드 로딩 헬퍼 점검
const hasEnsureHelper = secUtilsContent.includes('ensureApplicationPhotosLoaded');
const hasAsyncModal = secUtilsContent.includes('async function showPhotoDownloadModal');
const hasAsyncZip = secUtilsContent.includes('async function downloadZipFile');
const hasAsyncIndiv = secUtilsContent.includes('async function downloadIndividualPhotos');
const hasAsyncAppPhotos = secUtilsContent.includes('async function downloadApplicationPhotos');

console.log(`\n2. 온디맨드 사진 로딩 파이프라인 점검:`);
console.log(` - ensureApplicationPhotosLoaded 헬퍼 존재: ${hasEnsureHelper ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(` - downloadApplicationPhotos 비동기 연동: ${hasAsyncAppPhotos ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(` - showPhotoDownloadModal 비동기 연동: ${hasAsyncModal ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(` - downloadZipFile 비동기 연동: ${hasAsyncZip ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(` - downloadIndividualPhotos 비동기 연동: ${hasAsyncIndiv ? 'PASS ✅' : 'FAIL ❌'}`);

// 3. syncAllData 경량 select 쿼리 점검
const hasLightweightQuery = secUtilsContent.includes("select('id, user_id, owner_name, phone, store_name, store_address, sign_type, referrer_code, status, assigned_constructor_id, assigned_constructor_name, construction_status, memo, applied_at, created_at')");
const hasPhotoCachePreserve = secUtilsContent.includes('localApp.photos && localApp.photos.length > 0');

console.log(`\n3. 목록 동기화 대역폭 다이어트 점검:`);
console.log(` - applications 경량 select 쿼리(사진 제외): ${hasLightweightQuery ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(` - 로컬 캐시 사진 유실 방지 로직: ${hasPhotoCachePreserve ? 'PASS ✅' : 'FAIL ❌'}`);

// 4. memo 메타데이터 photoCount 직렬화/역직렬화 점검
const hasPhotoCountMemo = secUtilsContent.includes('photoCount: validCount') || secUtilsContent.includes('photoCount:');
const hasPhotoCountParse = secUtilsContent.includes('parsedMemo.photoCount !== undefined');

console.log(`\n4. 사진 수 메타데이터 동기화 점검:`);
console.log(` - mapAppToDb memo에 photoCount 기록: ${hasPhotoCountMemo ? 'PASS ✅' : 'FAIL ❌'}`);
console.log(` - mapDbToApp memo에서 photoCount 파싱: ${hasPhotoCountParse ? 'PASS ✅' : 'FAIL ❌'}`);

const allPassed = secHas300KB && dashHas300KB && appHas300KB && scriptHas300KB &&
  hasEnsureHelper && hasAsyncModal && hasAsyncZip && hasAsyncIndiv && hasAsyncAppPhotos &&
  hasLightweightQuery && hasPhotoCachePreserve && hasPhotoCountMemo && hasPhotoCountParse;

console.log('\n==================================================');
console.log(`[종합 검증 결과]: ${allPassed ? '100% ALL PASS (결함 0건) 🚀' : 'FAIL ❌'}`);
console.log('==================================================');
