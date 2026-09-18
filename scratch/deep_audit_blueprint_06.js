// scratch/deep_audit_blueprint_06.js
// 5대 에이전트 합동 심층 점검 스크립트: [설계도-06] BP-APP-SHARE-INSTALL 전수 감사

const fs = require('fs');
const path = require('path');

const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
const manifestJson = fs.readFileSync(path.join(__dirname, '..', 'manifest.json'), 'utf8');
const blueprint = fs.readFileSync(path.join(__dirname, '..', 'SYSTEM_BLUEPRINT.md'), 'utf8');

console.log('========================================================================');
console.log('🔍 [5대 에이전트 합동 점검] [설계도-06] BP-APP-SHARE-INSTALL 심층 전수 감사');
console.log('========================================================================\n');

let totalTests = 0;
let passedTests = 0;

function assertTest(name, condition, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✅ [PASS] ${name}`);
  } else {
    console.error(`❌ [FAIL] ${name}`);
    if (details) console.error(`   👉 사유: ${details}`);
  }
}

// -------------------------------------------------------------
// [에이전트 1] SSOT 동기화 가디언 검증 (단일 도메인 및 원천 일원화)
// -------------------------------------------------------------
console.log('--- [에이전트 1: SSOT 동기화 가디언] 도메인 및 주소 단일성 검증 ---');

assertTest(
  '공유 주소 단일 표준 도메인(https://ganpans.com) 사용 여부',
  appJs.includes("url: 'https://ganpans.com'") &&
  !appJs.includes("url: 'https://ganpans.com/app'"),
  '공유 URL이 단일 표준 도메인 https://ganpans.com 이어야 합니다.'
);

assertTest(
  'QR 코드 이미지 생성 주소 단일화 검증',
  indexHtml.includes('data=https%3A%2F%2Fganpans.com') &&
  !indexHtml.includes('data=https%3A%2F%2Fganpans.com%2Fapp'),
  'QR 코드 주소에 구형 /app 경로가 포함되지 않아야 합니다.'
);

const manifest = JSON.parse(manifestJson);
assertTest(
  'manifest.json 시작 URL 단일화 검증',
  manifest.start_url === '/',
  `start_url이 '/' 이어야 합니다. 현재값: ${manifest.start_url}`
);

// -------------------------------------------------------------
// [에이전트 2] QA 무결성 감사관 검증 (코드 무결성 및 찌꺼기 박멸)
// -------------------------------------------------------------
console.log('\n--- [에이전트 2: QA 무결성 감사관] 코드/이벤트 무결성 및 잔재 검증 ---');

assertTest(
  'sw.js 내 self.registration.unregister 구형 자폭 잔재 0건 확인',
  !swJs.includes('unregister()'),
  '서비스워커에 자폭 코드가 남아있으면 안 됩니다.'
);

assertTest(
  'index.html 상단 서비스워커 강제 삭제 루프 부존재 확인',
  !indexHtml.includes('r.unregister()') && !indexHtml.includes('caches.delete(n)'),
  'index.html에 서비스워커 강제 해제 루프가 없어야 합니다.'
);

assertTest(
  '이벤트 단일 바인딩 준수 (app.js 내 중복 addEventListener 부존재)',
  !appCodeIncludesDuplicateListeners(appJs),
  'Rule #4 위반: 중복 이벤트 리스너가 발견되었습니다.'
);

function appCodeIncludesDuplicateListeners(code) {
  return code.includes("pwaShareBtn.addEventListener('click'") ||
         code.includes("pwaShortcutBtn.addEventListener('click'");
}

// -------------------------------------------------------------
// [에이전트 3] UI/UX 플로우 전문가 검증 (원클릭 설치 및 모바일 분기)
// -------------------------------------------------------------
console.log('\n--- [에이전트 3: UI/UX 플로우 전문가] 원클릭 설치 및 브라우저 분기 검증 ---');

assertTest(
  '설치 프롬프트 호출 시 모달 오버레이 자동 닫기 처리',
  appJs.includes("mobileInstallModal.classList.remove('active')"),
  '시스템 설치창 호출 전 백그라운드 모달이 닫혀야 시스템 창이 깨끗이 노출됩니다.'
);

assertTest(
  '이미 홈 화면에 추가된 기기(isStandalone) 감지 및 친절 안내',
  appJs.includes('isStandalone') && appJs.includes('이미 간판지원단 앱이 홈 화면에'),
  '기설치된 기기에서는 중복 설치 대신 안내가 나와야 합니다.'
);

assertTest(
  '아이폰(iOS) 사파리 전용 1줄 친절 가이드 분기 장착',
  appJs.includes('isIOS') && appJs.includes('홈 화면에 추가 (+)'),
  '아이폰 전용 안내 가이드가 장착되어 있어야 합니다.'
);

assertTest(
  '카카오톡 인앱 브라우저 차단 방어 분기 장착',
  appJs.includes('isKakao'),
  '카카오톡 인앱 브라우저 전환 가이드가 장착되어 있어야 합니다.'
);

// -------------------------------------------------------------
// [에이전트 4] Supabase DB 전문가 검증 (무캐시 통과형 엔진)
// -------------------------------------------------------------
console.log('\n--- [에이전트 4: Supabase DB 전문가] 트래픽 및 캐시 꼬임 방어 검증 ---');

assertTest(
  'sw.js 제로-캐시(Zero-Cache) 실시간 네트워크 패스스루 준수',
  swJs.includes('event.respondWith(fetch(event.request))'),
  'sw.js는 캐시 없이 모든 요청을 네트워크로 즉시 전달해야 합니다.'
);

assertTest(
  'sw.js 내 오프라인 강제 캐시(caches.open) 잔재 0건 확인',
  !swJs.includes('caches.open'),
  'sw.js에 불필요한 파일 캐시 쓰기가 없어야 합니다.'
);

// -------------------------------------------------------------
// [에이전트 5] 설계도 검문소 가디언 검증
// -------------------------------------------------------------
console.log('\n--- [에이전트 5: 설계도 검문소 가디언] SYSTEM_BLUEPRINT.md 준수 검증 ---');

assertTest(
  'SYSTEM_BLUEPRINT.md에 [설계도-06] BP-APP-SHARE-INSTALL 정식 수록',
  blueprint.includes('[설계도-06] BP-APP-SHARE-INSTALL') &&
  blueprint.includes('모바일 앱 공유') &&
  blueprint.includes('원클릭 홈 화면 바로가기'),
  'SYSTEM_BLUEPRINT.md에 정식 설계도로 수록되어 있어야 합니다.'
);

const { execSync } = require('child_process');
let verifyPassed = false;
try {
  const verifyOut = execSync('node scripts/verify-blueprint.js', { encoding: 'utf8' });
  verifyPassed = verifyOut.includes('6대 공식 설계도 보존 법칙 검사를 100% 통과했습니다');
} catch (e) {
  verifyPassed = false;
}

assertTest(
  '자동 검문소(scripts/verify-blueprint.js) 6대 설계도 100% 통과',
  verifyPassed,
  'verify-blueprint.js 검문소를 100% 통과해야 합니다.'
);

console.log('\n========================================================================');
console.log(`📊 [점검 결과 요약] 총 ${totalTests}개 항목 중 ${passedTests}개 PASS! (${((passedTests/totalTests)*100).toFixed(1)}%)`);
console.log('========================================================================\n');

if (totalTests === passedTests) {
  process.exit(0);
} else {
  process.exit(1);
}
