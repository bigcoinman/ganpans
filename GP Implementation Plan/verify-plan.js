/**
 * GP Implementation Plan 독립 검문소
 * 경기도시장상권진흥원 점포 환경개선 추진계획서 AI 자동작성기 전용 검증 스크립트
 * 
 * 실행: node "GP Implementation Plan/verify-plan.js" 또는 npm run verify:plan
 */

const fs = require('fs');
const path = require('path');

console.log('========================================================');
console.log('🔍 [GP Implementation Plan] 추진계획서 전용 독립 검문소 가동');
console.log('   (간판지원단 메인 포털과 분리된 독립 강제 원칙 검증)');
console.log('========================================================\n');

const planGenPath = path.join(__dirname, 'plan-generator.html');
const rulesPath = path.join(__dirname, 'PLAN_RULES.md');

let totalChecks = 0;
let passedChecks = 0;

function assertCheck(name, condition, errorMsg) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`✅ [통과] ${name}`);
  } else {
    console.error(`❌ [위반] ${name}`);
    console.error(`   👉 사유: ${errorMsg}`);
    process.exit(1);
  }
}

// 1. 파일 존재 여부 검사
assertCheck(
  'plan-generator.html 파일 존재 확인',
  fs.existsSync(planGenPath),
  'plan-generator.html 파일이 존재하지 않습니다!'
);

assertCheck(
  'PLAN_RULES.md 독립 강제 원칙 문서 존재 확인',
  fs.existsSync(rulesPath),
  'PLAN_RULES.md 독립 강제 원칙 문서가 존재하지 않습니다!'
);

const planGenCode = fs.readFileSync(planGenPath, 'utf8');

// [제0원칙] 간판지원단 본체와의 상호 완전 분리 및 혼입 0% 검증
assertCheck(
  '[제0원칙] 간판지원단 본체(Supabase/DataStore/App) 의존성 0% 단독 완결성 검증',
  !planGenCode.includes('supabase-config.js') &&
  !planGenCode.includes('data-store.js') &&
  !planGenCode.includes('app.js'),
  'plan-generator.html 내 간판지원단 본체 라이브러리가 혼입되었습니다! 100% 독립성을 유지하십시오.'
);

// 2. [원칙 4] 기타 입력(bizExtraNotes) 폼 장착 검사
assertCheck(
  '[원칙 4] 기타 입력(bizExtraNotes) textarea 폼 장착 검증',
  planGenCode.includes('id="bizExtraNotes"'),
  'plan-generator.html 내 기타 입력(bizExtraNotes) 폼이 누락되었습니다!'
);

assertCheck(
  '[원칙 4] 기타 입력(bizExtraNotes) 프롬프트 연동 검증',
  planGenCode.includes('bizExtraNotes') && planGenCode.includes('extraNotes') && planGenCode.includes('[필수 반영] 업종/점포 보충 설명 (기타 입력)'),
  '기타 입력 내용이 AI 프롬프트에 연동되지 않았습니다!'
);

// 3. [원칙 1, 2] 400자 미달 시 자동 확장 엔진 탑재 검사
assertCheck(
  '[원칙 1, 2] 400자 미달 감지 조건(initialPlan.length < 400) 검증',
  planGenCode.includes('initialPlan.length < 400'),
  '400자 미달 시 자동 감지 조건문이 누락되었습니다!'
);

assertCheck(
  '[원칙 2] 2차 자동 확장 프롬프트(expansionPrompt) 발동 엔진 검증',
  planGenCode.includes('expansionPrompt') && planGenCode.includes('445자 이상 485자'),
  '400자 미달 시 발동하는 expansionPrompt 자동 확장 엔진이 누락되었습니다!'
);

// 4. [원칙 3] 500자 초과 방어 및 마침표 종결 검사
assertCheck(
  '[원칙 3] 400자 이상 마침표 종결 클리핑(lastPeriod >= 400) 검증',
  planGenCode.includes('lastPeriod >= 400'),
  '500자 초과 방어 및 최소 400자 마침표 완결 클리핑 로직이 누락되었습니다!'
);

assertCheck(
  '[원칙 3] 4. 기대효과 종결 보장 프롬프트 검증',
  planGenCode.includes('4. 기대효과 :') && (planGenCode.includes('마침표(.)로 명확하게 마쳐야') || planGenCode.includes('마침표 완결 필수')),
  '4. 기대효과 종결 및 마침표 완결 프롬프트 지침이 누락되었습니다!'
);

// 5. [원칙 5, 6] 사진 팩트 기반 진실성 및 글자수 카운터
assertCheck(
  '[원칙 5] 노후 간판 사진 3장 육안 사실 팩트 기반 프롬프트 검증',
  planGenCode.includes('사진 시각 팩트') && planGenCode.includes('허위'),
  '사진 시각 팩트 기반 진실성 프롬프트가 누락되었습니다!'
);

assertCheck(
  '[원칙 6] 실시간 글자수 카운터(planCharCount) 장착 검증',
  planGenCode.includes('id="planCharCount"'),
  '실시간 글자수 카운터 표시기가 누락되었습니다!'
);

console.log('\n========================================================');
console.log(`🎉 [검증 완료] 총 ${passedChecks}/${totalChecks}개 전용 원칙 검사를 100% 통과했습니다!`);
console.log('   GP Implementation Plan의 독립 무결성이 완벽하게 증명되었습니다.');
console.log('========================================================\n');
