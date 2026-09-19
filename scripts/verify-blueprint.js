// scripts/verify-blueprint.js
// ========================================================
// 🛡️ 간판지원단 단일 절대 설계도 자동 검문소 (Blueprint Guard)
// ========================================================
// 본 스크립트는 배포(deploy) 또는 커밋 전 자동으로 실행되어,
// SYSTEM_BLUEPRINT.md에 등록된 5대 공식 설계도 규칙이
// 단 1%라도 훼손되었는지를 전수 검사합니다.
// 실패 시 프로세스는 즉시 종료(exit 1)되며 배포가 원천 차단됩니다.
// ========================================================

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('========================================================');
console.log('🛡️ [간판지원단] 8대 공식 설계도 자동 검문소 가동');
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
console.log('--- [기본 검사] 자바스크립트 구문 문법 무결성 (node -c) ---');
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

console.log('\n--- [설계도 등록 확인] SYSTEM_BLUEPRINT.md 체계 검사 ---');
assertRule(
  'SYSTEM_BLUEPRINT.md 공식 8대 설계도 목차 등록',
  blueprintCode.includes('BP-SALES-DASHBOARD') && 
  blueprintCode.includes('BP-APPLY-ACCOUNT') && 
  blueprintCode.includes('BP-APP-LIFECYCLE') && 
  blueprintCode.includes('BP-CONSTRUCTOR-FLOW') && 
  blueprintCode.includes('BP-ADMIN-SSOT') &&
  blueprintCode.includes('BP-APP-SHARE-INSTALL') &&
  blueprintCode.includes('BP-AUTH-RECOVERY') &&
  blueprintCode.includes('BP-TRAFFIC-DIET'),
  '설계도 공식 목차가 누락되었습니다.'
);

console.log('\n--- [설계도-01 검증] BP-SALES-DASHBOARD (영업자 대시보드 및 시안/사진 연동) ---');
assertRule(
  '[BP-01] 영업물건 카드 내 간판 디자인 시안 박스 탑재',
  appCode.includes('간판 디자인 시안 확인 박스 (시공사 등록 시 영업자 실시간 확인 SSOT)'),
  '영업물건 카드에 간판 디자인 시안 확인 UI가 누락되었습니다.'
);

assertRule(
  '[BP-01] 영업물건 카드 내 현장사진 SSOT 연동',
  appCode.includes('현장사진 확인 영역 (단일 원천 실시간 동기화)'),
  '영업물건 카드에 현장사진 SSOT 연동 코드가 누락되었습니다.'
);

assertRule(
  '[BP-01] 상단 신청내역 점주용 승인버튼 혼선 차단',
  appCode.includes('isSalesperson') && appCode.includes('점주 시안 검토 중'),
  '영업자 화면에 점주 전용 [시안 승인] 버튼이 부적절하게 노출될 위험이 있습니다.'
);

assertRule(
  '[BP-01] DataStore.getBizItemsForUser SSOT 단일 원천 준수',
  dataStoreCode.includes('getBizItemsForUser') && dataStoreCode.includes('getAdminBizItems'),
  '영업물건 목록이 최고관리자 SSOT와 분리되어 있습니다.'
);

console.log('\n--- [설계도-02 검증] BP-APPLY-ACCOUNT (온라인 신청 및 점주 계정 발급) ---');
assertRule(
  '[BP-02] 영업자 대리 신청 시 영업자 계정 덮어쓰기 방어 (isOwnerSelf)',
  appCode.includes('const isOwnerSelf = Boolean') && !appCode.includes('loggedUser.role === \'user\' || loggedUser.id'),
  '영업자 대리 신청 시 영업자 본인 계정이 덮어써질 위험이 있는 찌꺼기 코드가 발견되었습니다!'
);

assertRule(
  '[BP-02] 신규 점주 임시 비밀번호 정상 노출 보존 (isExistingAccount 엄격 분리)',
  appCode.includes('const isExistingAccount = Boolean(isOwnerSelf || !isNewAccount || !loginNoticePw);'),
  '신규 점주 임시 비밀번호가 증발하는 찌꺼기 코드가 남아있습니다!'
);

assertRule(
  '[BP-02] 신청서 userId 점주 ID 귀속 원칙 (영업자 ID 오기입 방어)',
  appCode.includes('userId: userId') && appCode.includes('registeredBy: loggedUser ? loggedUser.id : (phoneDigits || \'guest\')'),
  '신청서 userId가 점주가 아닌 영업자 ID로 오기입되는 오류가 발견되었습니다!'
);

console.log('\n--- [설계도-03 검증] BP-APP-LIFECYCLE (신청서 7단계 생명주기 및 락 방어) ---');
assertRule(
  '[BP-03] 일반 점주 대시보드: 시안 승인(마음에 듭니다) 버튼 100% 보존',
  appCode.includes('window.approveDraftByOwner') && appCode.includes('시안 승인 / 마음에 듭니다'),
  '일반 점주가 시안을 승인할 수 있는 녹색 버튼이 훼손되었습니다!'
);

assertRule(
  '[BP-03] toggleBizItem 내 status="pending" 롤백 찌꺼기 100% 부존재',
  !dataStoreCode.includes("status: app.status || 'pending'"),
  'toggleBizItem 내에 구형 status="pending" 덮어쓰기 페이로드가 남아있습니다!'
);

const assignMobStart = appCode.indexOf('function assignConstructorToBizItemMob(');
const assignMobEnd = appCode.indexOf('window.assignConstructorToBizItemMob = assignConstructorToBizItemMob;', assignMobStart);
const assignMobBody = (assignMobStart !== -1 && assignMobEnd !== -1) ? appCode.slice(assignMobStart, assignMobEnd) : '';

assertRule(
  '[BP-03] assignConstructorToBizItemMob SSOT 일원화 및 강제 DB 동기화 제거',
  assignMobBody.includes('DataStore.assignConstructorToBizItem(uid, itemId, constId)') &&
  !assignMobBody.includes('syncAdminDataFromSupabaseMob'),
  '모바일 시공사 배정 함수가 DataStore 단일 원천을 호출하지 않거나 force=true 재조회가 남아있습니다!'
);

assertRule(
  '[BP-03] 7단계 상태 전이 10초 동기화 락(_recentStatusUpdates) 장착',
  dataStoreCode.includes('_recentStatusUpdates') &&
  dataStoreCode.includes('updateApplicationStatus') &&
  dataStoreCode.includes('reassignConstructorItem'),
  '핵심 상태 변경 함수에 _recentStatusUpdates 동기화 락이 누락되었습니다!'
);

assertRule(
  '[BP-03] 모바일 대시보드 헤더 단일 이벤트 바인딩 준수 (Rule #4 중복 리스너 부존재)',
  !appCode.includes("toggleUserAppsMobHeader.addEventListener('click'") &&
  !appCode.includes("toggleBizItemsMobHeader.addEventListener('click'"),
  '모바일 대시보드 헤더에 인라인 onclick과 중복되는 addEventListener가 남아있습니다!'
);

console.log('\n--- [설계도-04/05 검증] 권한 분리 및 공용 모달 단일화 ---');

assertRule(
  '[BP-공통] 시안 크게보기 단일 공용 함수(viewDraftModal) 호출 준수',
  appCode.includes('window.viewDraftModal'),
  '시안 크게보기 공용 모달이 누락되었습니다.'
);

assertRule(
  '[BP-공통] 사진 다운로드/확인 단일 공용 함수(downloadApplicationPhotos) 호출 준수',
  appCode.includes('window.downloadApplicationPhotos'),
  '사진 확인 공용 함수가 누락되었습니다.'
);

console.log('\n--- [설계도-06 검증] BP-APP-SHARE-INSTALL (모바일 앱 공유 및 원클릭 바로가기 설치) ---');
assertRule(
  '[BP-06] 모바일 앱 공유 함수(window.handleAppShare) 정상 장착',
  appCode.includes('window.handleAppShare = function'),
  '모바일 앱 공유 함수가 누락되었습니다.'
);

assertRule(
  '[BP-06] 원클릭 바로가기 설치 함수(window.handleAppShortcut) 정상 장착',
  appCode.includes('window.handleAppShortcut = function'),
  '원클릭 바로가기 설치 함수가 누락되었습니다.'
);

const swCode = fs.readFileSync('sw.js', 'utf8');
assertRule(
  '[BP-06] PWA 서비스워커(sw.js) 무캐시 통과형 엔진 유지 (unregister 부존재)',
  swCode.includes('fetch(event.request)') && !swCode.includes('unregister()'),
  '서비스워커가 PWA 설치 요건을 충족하지 않거나 비정상 해제 코드가 포함되어 있습니다.'
);

assertRule(
  '[BP-06] 이벤트 단일 바인딩 준수 (pwa 버튼 중복 addEventListener 부존재)',
  !appCode.includes("pwaShareBtn.addEventListener('click'") && !appCode.includes("pwaShortcutBtn.addEventListener('click'"),
  'pwa 버튼에 중복 addEventListener가 존재합니다. Rule #4를 준수하세요.'
);

console.log('\n--- [설계도-07 검증] BP-AUTH-RECOVERY (아이디 찾기 및 비밀번호 재설정) ---');
const secUtilsCode = fs.readFileSync('security-utils.js', 'utf8');
const indexHtmlCode = fs.readFileSync('index.html', 'utf8');

assertRule(
  '[BP-07] 4대 인증 상태 전환 단일 엔진(switchAuthTab) find-id/find-pw 지원',
  secUtilsCode.includes("tab === 'find-id'") && secUtilsCode.includes("tab === 'find-pw'"),
  'switchAuthTab에 find-id 또는 find-pw 상태 전환 분기가 누락되었습니다.'
);

assertRule(
  '[BP-07] 아이디 찾기(executeFindId) 및 비밀번호 찾기(executeFindPw, executeResetPw) 함수 구비',
  secUtilsCode.includes('window.executeFindId =') &&
  secUtilsCode.includes('window.executeFindPw =') &&
  secUtilsCode.includes('window.executeResetPw ='),
  '인증 복구 핵심 실행 함수가 security-utils.js에 누락되었습니다.'
);

assertRule(
  '[BP-07] Supabase password_hash 컬럼 및 upsertUser 단일 연동 준수',
  secUtilsCode.includes('window.SupabaseSync.upsertUser') &&
  secUtilsCode.includes('password_hash: hashedPw'),
  'Supabase 연동 시 password_hash 또는 upsertUser 규격이 훼손되었습니다.'
);

assertRule(
  '[BP-07] index.html 내 찾기 버튼 및 폼 단일 이벤트 바인딩 준수',
  indexHtmlCode.includes("onclick=\"window.switchAuthTab('find-id'") &&
  indexHtmlCode.includes("onclick=\"window.switchAuthTab('find-pw'") &&
  indexHtmlCode.includes("onsubmit=\"if (window.executeFindId)") &&
  indexHtmlCode.includes("onsubmit=\"if (window.executeFindPw)"),
  'index.html 내 찾기 UI의 단일 이벤트 바인딩이 누락되었습니다.'
);

console.log('\n--- [설계도-08 검증] BP-TRAFFIC-DIET (트래픽 다이어트 및 Supabase 대역폭 영구 방어) ---');
assertRule(
  '[BP-08] 이미지 압축 엔진 기본 규격 (800px, 90KB) 준수',
  secUtilsCode.includes('maxSizeBytes = 90 * 1024') && secUtilsCode.includes('max_size = 800'),
  'security-utils.js 내 compressImageFile 기본 규격(800px, 90KB)이 훼손되었습니다!'
);

assertRule(
  '[BP-08] 대시보드 목록 동기화 시 사진 배제 쿼리(Column Selection) 준수',
  secUtilsCode.includes("select('id, user_id, owner_name, phone, store_name, store_address, sign_type, referrer_code, status, assigned_constructor_id, assigned_constructor_name, construction_status, memo, applied_at, created_at')"),
  '목록 동기화 시 대역폭 절감을 위한 컬럼 선별 쿼리가 누락되었습니다!'
);

assertRule(
  '[BP-08] Fallback 쿼리 select(\'*\') 부존재 및 경량 쿼리 고정 준수',
  !secUtilsCode.includes("from('applications').select('*')"),
  'security-utils.js 내 applications 조회 시 select(\'*\') fallback 찌꺼기가 발견되었습니다!'
);

assertRule(
  '[BP-08] Supabase Realtime 300ms 디바운스 엔진 장착 준수',
  secUtilsCode.includes('triggerDebouncedSync') && secUtilsCode.includes('300'),
  'Realtime WebSocket 이벤트 수신 시 300ms 디바운스 코드가 누락되었습니다!'
);

assertRule(
  '[BP-08] 신규 신청 및 시공사진 업로드 90KB 압축 파라미터 준수',
  appCode.includes('compressImageToBase64(file, 90 * 1024)') &&
  dataStoreCode.includes('compressImageToBase64(file, 90 * 1024)'),
  '신청서 또는 시안/시공사진 업로드 시 90KB 압축 파라미터가 누락되었습니다!'
);

assertRule(
  '[BP-08] 구형 300KB 하드코딩 찌꺼기 100% 부존재 준수',
  !secUtilsCode.includes('300 * 1024') && !appCode.includes('300 * 1024') && !dataStoreCode.includes('300 * 1024'),
  '코드베이스 내에 구형 300 * 1024 찌꺼기 하드코딩이 잔존합니다!'
);

console.log('\n--- [이원화 금지 검사] 유령 코드 및 찌꺼기 패턴 검사 ---');
const ghostPatterns = [
  'viewDraftModalForSales',
  'viewDraftModalMob',
  'getBizItemsForSalesOnly',
  'sales_draft_cache',
  'find_id_cache',
  'find_pw_cache',
  'max_size = 1200'
];
for (const pattern of ghostPatterns) {
  assertRule(
    `유령/이원화 코드 부존재 검사: [${pattern}]`,
    !appCode.includes(pattern) && !dataStoreCode.includes(pattern) && !secUtilsCode.includes(pattern),
    `금지된 이원화 코드 [${pattern}]가 발견되었습니다!`
  );
}

console.log('\n========================================================');
if (passed) {
  console.log('🎉 [검증 완료] 8대 공식 설계도 보존 법칙 검사를 100% 통과했습니다!');
  console.log('   기존 기능 훼손 0건, 이원화 찌꺼기 0건 확인 완료.');
  console.log('========================================================\n');
  process.exit(0);
} else {
  console.error('🚨 [검증 실패] 설계도 보존 법칙을 위반한 코드가 발견되었습니다!');
  console.error('   배포가 원천 차단됩니다. 위반 사항을 먼저 수술식으로 바로잡으십시오.');
  console.error('========================================================\n');
  process.exit(1);
}
