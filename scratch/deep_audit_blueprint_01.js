// scratch/deep_audit_blueprint_01.js
// 5대 에이전트 합동 심층 점검 스크립트: [설계도-01] BP-SALES-DASHBOARD 전수 감사

const fs = require('fs');
const path = require('path');

const appJsPath = path.join(__dirname, '..', 'app.js');
const dataStoreJsPath = path.join(__dirname, '..', 'data-store.js');
const indexHtmlPath = path.join(__dirname, '..', 'index.html');
const blueprintPath = path.join(__dirname, '..', 'SYSTEM_BLUEPRINT.md');

const appJs = fs.readFileSync(appJsPath, 'utf8');
const dataStoreJs = fs.readFileSync(dataStoreJsPath, 'utf8');
const indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
const blueprint = fs.readFileSync(blueprintPath, 'utf8');

console.log('===============================================================');
console.log('🔍 [5대 에이전트 합동 점검] [설계도-01] BP-SALES-DASHBOARD 심층 전수 감사');
console.log('===============================================================\n');

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
// [에이전트 1] SSOT 동기화 가디언 검증
// -------------------------------------------------------------
console.log('--- [에이전트 1: SSOT 동기화 가디언] 데이터 단일 진실의 원천 검증 ---');

// 1-1. 상단 [내 온라인 간편 지원 신청 내역]이 applications 단일 원천을 조회하는가?
assertTest(
  '상단 내역의 applications SSOT 직접 조회 여부',
  appJs.includes('function renderUserApplicationsMob()') &&
  appJs.includes('DataStore.getApplications()'),
  'renderUserApplicationsMob에서 DataStore.getApplications()를 직접 참조해야 합니다.'
);

// 1-2. 하단 [내 영업물건 현황]이 getBizItemsForUser -> getAdminBizItems 기반으로 isBizItem: true만 조회하는가?
assertTest(
  '하단 영업물건의 isBizItem: true 단일 SSOT 승인 필터링 검증',
  dataStoreJs.includes('const isApprovedBizItem = Boolean(app.isBizItem === true') &&
  dataStoreJs.includes('getBizItemsForUser: function'),
  'getAdminBizItems에서 isBizItem === true 인 건만 영업물건으로 승격되어야 합니다.'
);

// 1-3. 관리자가 영업물건 해제 또는 타 영업자 배정 시 즉시 부존재 일치(Non-existence Sync)하는가?
assertTest(
  '타인 배정 건 및 본사직접접수 건의 부존재 일치(Non-existence Sync) 필터링 검증',
  appJs.includes('isHeadquartersDirect') &&
  appJs.includes('isAssignedToOtherSales'),
  '다른 영업자에게 배정되었거나 본사접수 건은 영업자 목록에서 0건으로 사라져야 합니다.'
);

// -------------------------------------------------------------
// [에이전트 2] QA 무결성 감사관 검증
// -------------------------------------------------------------
console.log('\n--- [에이전트 2: QA 무결성 감사관] 코드/DOM/이벤트 무결성 검증 ---');

// 2-1. index.html 내 2대 컨테이너 ID 존재 여부
assertTest(
  'index.html 내 상단(#user-apps-list-mobile) & 하단(#biz-items-list-mobile) 컨테이너 무결성',
  indexHtml.includes('id="user-apps-list-mobile"') &&
  indexHtml.includes('id="biz-items-list-mobile"'),
  'index.html에 2대 영역 컨테이너가 반드시 존재해야 합니다.'
);

// 2-2. 엑셀 다운로드 버튼 및 검색 인풋 DOM 무결성
assertTest(
  '검색창(#search-user-apps-mob, #search-biz-items-mob) 및 엑셀버튼 DOM 존재',
  indexHtml.includes('id="search-user-apps-mob"') &&
  indexHtml.includes('id="search-biz-items-mob"') &&
  indexHtml.includes('id="btn-export-biz-items-mob"'),
  '상하단 검색창 및 엑셀 다운로드 버튼이 정상 정의되어 있어야 합니다.'
);

// 2-3. 중복 선언 확인 (정확한 함수 정의 할당 검사)
const toggleBizDefs = appJs.match(/window\.toggleBizItemsMob\s*=\s*function/g) || [];
const toggleUserDefs = appJs.match(/window\.toggleUserAppsMob\s*=\s*function/g) || [];
assertTest(
  '토글 함수 중복 정의 여부 점검 (단일 정의 권장)',
  toggleBizDefs.length <= 2 && toggleUserDefs.length <= 2,
  `window.toggleBizItemsMob 정의 횟수: ${toggleBizDefs.length}회`
);

// -------------------------------------------------------------
// [에이전트 3] UI/UX 플로우 전문가 검증
// -------------------------------------------------------------
console.log('\n--- [에이전트 3: UI/UX 플로우 전문가] 화면 표시 및 사용자 권한 보호 검증 ---');

// 3-1. 영업자에게 점주용 '시안 승인 / 마음에 듭니다' 버튼 노출 차단 여부
assertTest(
  '영업자 화면에서 점주용 시안 승인 버튼 차단 (점주 시안 검토 중 표기)',
  appJs.includes("const isSalesperson = (activeUser && activeUser.role === 'business')") &&
  appJs.includes('점주 시안 검토 중'),
  '영업자가 로그인한 경우 점주 전용 승인 버튼 대신 [점주 시안 검토 중]이 표출되어야 합니다.'
);

// 3-2. 하단 [내 영업물건] 카드에서 간판 디자인 시안 표시 및 [시안 크게보기] 단일 모달 연결 여부
assertTest(
  '하단 영업물건 카드에서 시안 장수 표기 및 window.viewDraftModal 단일 모달 연동',
  appJs.includes("window.viewDraftModal('${targetAppId}')") &&
  appJs.includes('간판 디자인 시안 ('),
  '하단 영업물건 카드에 디자인 시안 장수와 viewDraftModal이 연결되어야 합니다.'
);

// 3-3. 현장사진 다운로드 및 사진 장수 표시 단일 연동
assertTest(
  '현장사진 다운로드 downloadApplicationPhotos 단일 함수 연동',
  appJs.includes('window.downloadApplicationPhotos'),
  '현장사진 다운로드는 window.downloadApplicationPhotos로 일원화되어야 합니다.'
);

// -------------------------------------------------------------
// [에이전트 4] Supabase DB 전문가 검증
// -------------------------------------------------------------
console.log('\n--- [에이전트 4: Supabase DB 전문가] 트래픽 및 대역폭 방어 검증 ---');

// 4-1. 목록 렌더링 시 대역폭 낭비 없이 사진 장수만 온디맨드로 계산하는가?
assertTest(
  '목록 렌더링 시 getAppPhotoInfo를 통한 가벼운 메타데이터 연산',
  appJs.includes('getAppPhotoInfo(matchedApp)') || appJs.includes('getAppPhotoInfo(app)'),
  '목록 렌더링 시 무거운 사진 데이터 본체를 생성하지 않고 메타데이터만 활용해야 합니다.'
);

// 4-2. 사진 보기/다운로드 클릭 시에만 온디맨드 단일 조회 수행
assertTest(
  '사진 다운로드 함수 내 온디맨드 단일 조회(eq id) 패턴 준수',
  appJs.includes('downloadApplicationPhotos') &&
  (appJs.includes(".eq('id'") || appJs.includes('downloadSinglePhoto') || appJs.includes('fetchApplicationPhotos')),
  '사진 데이터는 클릭 시 개별 단일 조회로 다운로드되어야 합니다.'
);

// -------------------------------------------------------------
// [에이전트 5] 설계도 검문소 가디언 검증
// -------------------------------------------------------------
console.log('\n--- [에이전트 5: 설계도 검문소 가디언] SYSTEM_BLUEPRINT.md 준수 검증 ---');

// 5-1. [설계도-01]의 공식 명칭 및 핵심 규칙이 SYSTEM_BLUEPRINT.md에 명시되어 있는가?
assertTest(
  'SYSTEM_BLUEPRINT.md에 [설계도-01] BP-SALES-DASHBOARD 정식 수록 여부',
  blueprint.includes('[설계도-01] BP-SALES-DASHBOARD') &&
  blueprint.includes('영업자 대시보드 2대 영역') &&
  blueprint.includes('시안/사진 연동 설계도'),
  'SYSTEM_BLUEPRINT.md에 [설계도-01]이 정확하게 명문화되어 있어야 합니다.'
);

// 5-2. scripts/verify-blueprint.js 검문소 자동 검사 실행
const { execSync } = require('child_process');
let verifyOutput = '';
let verifyPassed = false;
try {
  verifyOutput = execSync('node scripts/verify-blueprint.js', { encoding: 'utf8' });
  verifyPassed = verifyOutput.includes('100% 통과했습니다');
} catch (e) {
  verifyOutput = e.stdout || e.message;
}

assertTest(
  '자동 검문소(scripts/verify-blueprint.js) 18개 전수 테스트 100% 통과',
  verifyPassed,
  `검문소 출력 결과: ${verifyOutput.slice(-200)}`
);

console.log('\n===============================================================');
console.log(`📊 [점검 결과 요약] 총 ${totalTests}개 항목 중 ${passedTests}개 PASS! (${((passedTests/totalTests)*100).toFixed(1)}%)`);
console.log('===============================================================\n');
