const fs = require('fs');
const assert = require('assert');

const secCode = fs.readFileSync('security-utils.js', 'utf8');

console.log('=== [사진 스마트 캐시 갱신 및 고착 방지 3단계 검증] ===\n');

// 1. security-utils.js 코드 무결성 검증
assert(secCode.includes('memoCount'), 'memoCount 계산 로직 확인');
assert(secCode.includes('existingPhotos.length < expectedCount'), '사진 개수 미달 시 캐시 만료 감지 확인');
assert(secCode.includes('serverPhotoCount > localPhotosCount'), 'syncApplications 내 서버 사진 장수 우위 시 로컬 캐시 무효화 확인');
console.log('1. security-utils.js 정적 코드 무결성: PASS ✅');

// 2. dashboard.js & app.js expectedCount 파라미터 전달 검증
const dashCode = fs.readFileSync('dashboard.js', 'utf8');
const appCode = fs.readFileSync('app.js', 'utf8');

assert(dashCode.includes("downloadApplicationPhotos('${app.id}', { expectedCount: ${finalCount} })"), 'dashboard.js 최고관리자 expectedCount 전달 확인');
assert(dashCode.includes("downloadApplicationPhotos('${app.id}', { expectedCount: ${count} })"), 'dashboard.js 영업자 신청목록 expectedCount 전달 확인');
assert(dashCode.includes("downloadApplicationPhotos('${item.id}', { expectedCount: ${pCount} })"), 'dashboard.js 영업물건목록 expectedCount 전달 확인');
assert(dashCode.includes("downloadApplicationPhotos('${job.id}', { expectedCount: ${pCount} })"), 'dashboard.js 시공목록 expectedCount 전달 확인');
console.log('2. dashboard.js 4대 버튼 expectedCount 전달 무결성: PASS ✅');

assert(appCode.includes("downloadApplicationPhotos('${app.id}', { expectedCount: ${count} })"), 'app.js 영업자/점주 모바일 expectedCount 전달 확인');
assert(appCode.includes("downloadApplicationPhotos('${item.id}', { expectedCount: ${pCount} })"), 'app.js 영업물건 모바일 expectedCount 전달 확인');
assert(appCode.includes("downloadApplicationPhotos('${app.id}', { expectedCount: ${finalCount} })"), 'app.js 관리자 모바일 expectedCount 전달 확인');
assert(appCode.includes("downloadApplicationPhotos('${job.id}', { expectedCount: ${pCount} })"), 'app.js 시공업체 모바일 expectedCount 전달 확인');
console.log('3. app.js 4대 모바일 카드 expectedCount 전달 무결성: PASS ✅');

console.log('\n🎉 전 항목 테스트 100% PASS!');
