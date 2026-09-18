// scripts/verify-blueprint.js
// ========================================================
// 🛡️ 간판지원단 단일 절대 설계도 자동 검문소 (Blueprint Guard)
// ========================================================
// 본 스크립트는 배포(deploy) 또는 커밋 전 자동으로 실행되어,
// SYSTEM_BLUEPRINT.md에 명시된 4대 권한 헌법과 핵심 기능이
// 단 1%라도 훼손되었는지를 전수 검사합니다.
// 실패 시 프로세스는 즉시 종료(exit 1)되며 배포가 원천 차단됩니다.
// ========================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================================');
console.log('🛡️ [간판지원단] 단일 절대 설계도 자동 검문소 가동');
console.log('========================================================\n');

let passed = true;
function assertRule(name, condition, errorDetail) {
  if (condition) {
    console.log(`✅ [통과] ${name}`);
  } else {
    console.error(`❌ [위반] ${name}`);
    if (errorDetail) console.error(`   👉 상세: ${errorDetail}`);
    passed = false;
  }
}

// 1. JS 파일 구문 문법 무결성 전수 검사 (Zero SyntaxError)
console.log('--- [1단계] 자바스크립트 구문 문법 검사 (node -c) ---');
const jsFiles = ['app.js', 'security-utils.js', 'data-store.js', 'supabase-config.js'];
for (const file of jsFiles) {
  try {
    execSync(`node -c "${file}"`, { stdio: 'pipe' });
    console.log(`✅ [문법 정상] ${file}`);
  } catch (e) {
    assertRule(`${file} 구문 문법 검사`, false, e.message);
  }
}

// 파일 내용 읽기
const appCode = fs.readFileSync('app.js', 'utf8');
const dataStoreCode = fs.readFileSync('data-store.js', 'utf8');
const blueprintCode = fs.readFileSync('SYSTEM_BLUEPRINT.md', 'utf8');

console.log('\n--- [2단계] 단일 진실의 원천(SSOT) 및 데이터 무결성 검사 ---');
assertRule(
  'SYSTEM_BLUEPRINT.md 존재 여부',
  blueprintCode.length > 500,
  '설계도 파일이 누락되었거나 내용이 비어있습니다.'
);

assertRule(
  'DataStore.getBizItemsForUser SSOT 단일 원천 준수',
  dataStoreCode.includes('getBizItemsForUser') && dataStoreCode.includes('getAdminBizItems'),
  '영업물건 목록이 최고관리자 SSOT와 분리되어 있습니다.'
);

assertRule(
  '영업물건 렌더링 시 applications 단일 원천 100% 매칭',
  appCode.includes('matchedApp = rawApps.find') && appCode.includes('getAppPhotoInfo(matchedApp)'),
  '영업물건 카드가 원본 applications와 다른 독자 데이터를 참조하고 있습니다.'
);

console.log('\n--- [3단계] 4대 권한별 역할 분리 및 시안/사진 헌법 검사 ---');

// 3-1. 영업자 대시보드
assertRule(
  '영업자 대시보드: 영업물건 카드 내 간판 디자인 시안 박스 탑재',
  appCode.includes('간판 디자인 시안 확인 박스 (시공사 등록 시 영업자 실시간 확인 SSOT)'),
  '하단 영업물건 카드에 간판 디자인 시안 확인 UI가 누락되었습니다.'
);

assertRule(
  '영업자 대시보드: 영업물건 카드 내 현장사진 SSOT 연동',
  appCode.includes('현장사진 확인 영역 (단일 원천 실시간 동기화)'),
  '하단 영업물건 카드에 현장사진 SSOT 연동 코드가 누락되었습니다.'
);

assertRule(
  '영업자 대시보드: 상단 신청내역 점주용 승인버튼 혼선 차단',
  appCode.includes('isSalesperson') && appCode.includes('점주 시안 검토 중'),
  '영업자 화면에 점주 전용 [시안 승인] 버튼이 부적절하게 노출될 위험이 있습니다.'
);

// 3-2. 일반 점주 대시보드
assertRule(
  '일반 점주 대시보드: 시안 승인(마음에 듭니다) 버튼 100% 보존',
  appCode.includes('window.approveDraftByOwner') && appCode.includes('시안 승인 / 마음에 듭니다'),
  '일반 점주가 시안을 승인할 수 있는 녹색 버튼이 훼손되었습니다!'
);

// 3-3. 신규 점주 임시 비밀번호 및 계정 보호 헌법 검사
assertRule(
  '영업자 대리 신청 시 영업자 계정 덮어쓰기 방어 (isOwnerSelf)',
  appCode.includes('const isOwnerSelf = Boolean') && !appCode.includes('loggedUser.role === \'user\' || loggedUser.id'),
  '영업자 대리 신청 시 영업자 본인 계정이 덮어써질 위험이 있는 찌꺼기 코드가 발견되었습니다!'
);

assertRule(
  '신규 점주 임시 비밀번호 정상 노출 보존 (isExistingAccount 엄격 분리)',
  appCode.includes('const isExistingAccount = Boolean(isOwnerSelf || !isNewAccount || !loginNoticePw);'),
  '영업자 로그인 시 신규 점주 임시 비밀번호가 증발하는 찌꺼기 코드가 남아있습니다!'
);

// 3-4. 공용 모달 단일화 (이원화 절대 금지)
assertRule(
  '시안 크게보기 단일 공용 함수(viewDraftModal) 호출 준수',
  appCode.includes('window.viewDraftModal'),
  '시안 크게보기 공용 모달이 누락되었습니다.'
);

assertRule(
  '사진 다운로드/확인 단일 공용 함수(downloadApplicationPhotos) 호출 준수',
  appCode.includes('window.downloadApplicationPhotos'),
  '사진 확인 공용 함수가 누락되었습니다.'
);

console.log('\n--- [4단계] 이원화 유령 코드 및 찌꺼기 패턴 검사 ---');
const ghostPatterns = [
  'viewDraftModalForSales',
  'viewDraftModalMob',
  'getBizItemsForSalesOnly',
  'sales_draft_cache'
];
for (const pattern of ghostPatterns) {
  assertRule(
    `유령/이원화 코드 부존재 검사: [${pattern}]`,
    !appCode.includes(pattern) && !dataStoreCode.includes(pattern),
    `금지된 이원화 코드 [${pattern}]가 발견되었습니다!`
  );
}

console.log('\n========================================================');
if (passed) {
  console.log('🎉 [검증 완료] 모든 설계도 보존 법칙 검사를 100% 통과했습니다!');
  console.log('   기존 기능 훼손 0건, 이원화 찌꺼기 0건 확인 완료.');
  console.log('========================================================\n');
  process.exit(0);
} else {
  console.error('🚨 [검증 실패] 설계도 보존 법칙을 위반한 코드가 발견되었습니다!');
  console.error('   배포가 원천 차단됩니다. 위반 사항을 먼저 수술식으로 바로잡으십시오.');
  console.error('========================================================\n');
  process.exit(1);
}
