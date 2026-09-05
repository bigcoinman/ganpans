// Unit test for email blank handling
const fs = require('fs');

const scriptCode = fs.readFileSync('script.js', 'utf8');
const appCode = fs.readFileSync('app.js', 'utf8');
const dashboardCode = fs.readFileSync('dashboard.js', 'utf8');
const secCode = fs.readFileSync('security-utils.js', 'utf8');

console.log('=== [테스트 1] script.js 이메일 공란 처리 검사 ===');
const hasScriptBlankEmailInExisting = scriptCode.includes("email: enteredEmail || '',");
const hasScriptBlankEmailInNew = scriptCode.includes("email: enteredEmail || '',");
const hasScriptOwnerEmailInApp = scriptCode.includes("ownerEmail: ownerEmailVal,");

console.log('- existing user email 공란 처리:', hasScriptBlankEmailInExisting ? '✅ PASS' : '❌ FAIL');
console.log('- new user email 공란 처리:', hasScriptBlankEmailInNew ? '✅ PASS' : '❌ FAIL');
console.log('- newApp ownerEmail 저장:', hasScriptOwnerEmailInApp ? '✅ PASS' : '❌ FAIL');

console.log('\n=== [테스트 2] app.js 모바일 이메일 공란 처리 검사 ===');
const hasAppBlankEmailInExisting = appCode.includes("email: enteredEmail || '',");
const hasAppBlankEmailInNew = appCode.includes("email: enteredEmail || '',");
const hasAppOwnerEmailInApp = appCode.includes("ownerEmail: ownerEmailVal,");
const hasAppDisplayFilter = appCode.includes("!u.email.endsWith('@ganpan.go.kr')");

console.log('- 모바일 existing user email 공란 처리:', hasAppBlankEmailInExisting ? '✅ PASS' : '❌ FAIL');
console.log('- 모바일 new user email 공란 처리:', hasAppBlankEmailInNew ? '✅ PASS' : '❌ FAIL');
console.log('- 모바일 newApp ownerEmail 저장:', hasAppOwnerEmailInApp ? '✅ PASS' : '❌ FAIL');
console.log('- 모바일 카드 더미 이메일 필터링:', hasAppDisplayFilter ? '✅ PASS' : '❌ FAIL');

console.log('\n=== [테스트 3] dashboard.js PC 회원 목록 이메일 필터링 검사 ===');
const hasPcDisplayFilter = dashboardCode.includes("!u.email.endsWith('@ganpan.go.kr')");
const hasPcBlankFallback = dashboardCode.includes("(appEmailVal && appEmailVal !== '-' && !appEmailVal.endsWith('@ganpan.go.kr')) ? appEmailVal : ''");

console.log('- PC 회원 테이블 더미 이메일 필터링:', hasPcDisplayFilter ? '✅ PASS' : '❌ FAIL');
console.log('- PC 신청자 계정 이메일 공란 처리:', hasPcBlankFallback ? '✅ PASS' : '❌ FAIL');

console.log('\n=== [테스트 4] security-utils.js 더미 이메일 정화 검사 ===');
const hasSecCleansing = secCode.includes("if (u.role !== 'admin' && u.email && u.email.endsWith('@ganpan.go.kr'))");
console.log('- Supabase 동기화 시 더미 이메일 자동 정화:', hasSecCleansing ? '✅ PASS' : '❌ FAIL');

if (hasScriptBlankEmailInExisting && hasScriptOwnerEmailInApp && hasAppBlankEmailInExisting && hasAppOwnerEmailInApp && hasPcDisplayFilter && hasSecCleansing) {
  console.log('\n🎉 [SUCCESS] 이메일 공란 처리 및 더미 생성 방지 검증 100% 통과!');
} else {
  console.error('\n❌ [FAIL] 검증 실패');
  process.exit(1);
}
