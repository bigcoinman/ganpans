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
const blueprintPath = path.join(__dirname, 'GP_SYSTEM_BLUEPRINT.md');
const skillPath = path.join(__dirname, '..', '.agents', 'skills', 'plan-generator-discipline', 'SKILL.md');

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

assertCheck(
  'GP_SYSTEM_BLUEPRINT.md 독립 단일 절대 설계도 존재 확인',
  fs.existsSync(blueprintPath),
  'GP_SYSTEM_BLUEPRINT.md 단일 절대 설계도 파일이 존재하지 않습니다!'
);

assertCheck(
  'plan-generator-discipline 공식 에이전트 스킬 존재 확인',
  fs.existsSync(skillPath),
  '.agents/skills/plan-generator-discipline/SKILL.md 스킬 파일이 존재하지 않습니다!'
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
  '[원칙 3] 4개 파트 온전 보존 및 4. 기대효과 영구 사수 엔진 검증',
  planGenCode.includes('4. 기대효과가 어떠한 경우에도 누락되지 않도록 영구 사수') && planGenCode.includes('compactPart'),
  '4. 기대효과 영구 사수 및 파트별 균형 압축 엔진이 누락되었습니다!'
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

// 6. [원칙 7, 8] 파트당 2문장(총 8문장) 규격, enforceMin400Chars 및 sanitizePlanText 검증
assertCheck(
  '[원칙 7] 파트당 2문장(총 8문장) 규격 프롬프트 명시 검증',
  planGenCode.includes('정확히 2개의 긴 완성형 문장(총 8문장 체계)'),
  '파트당 2문장(총 8문장) 규격화 프롬프트 지침이 누락되었습니다!'
);

assertCheck(
  '[원칙 7] 결정론적 400~500자 강제 보강 엔진(enforceMin400Chars) 함수 장착 검증',
  planGenCode.includes('function enforceMin400Chars'),
  'enforceMin400Chars 결정론적 강제 보강 엔진이 누락되었습니다!'
);

assertCheck(
  '[원칙 8] 구걸 표현 정제 및 매출 상승 효과 보장 필터(sanitizePlanText) 장착 검증',
  planGenCode.includes('function sanitizePlanText') && planGenCode.includes('매출 상승 효과'),
  'sanitizePlanText 금지어 정제 및 매출 상승 효과 보장 필터가 누락되었습니다!'
);

assertCheck(
  '[원칙 8] 프롬프트 내 금지어 헌법 명시 검증',
  planGenCode.includes('\'마중물\' 단어 사용 100% 영구 금지') &&
  planGenCode.includes('\'영업 마비\' 단어 사용 100% 영구 금지') &&
  planGenCode.includes('매출 상승 효과'),
  '프롬프트 내 금지어 배제 및 매출 상승 효과 필수 명시 지침이 누락되었습니다!'
);

// [신규 검증] 샘플 데이터(loadSampleData) 내 금지어 0건 및 매출 상승 효과 장착 검증
const sampleDataMatch = planGenCode.match(/function loadSampleData[\s\S]*?\n    \}/);
const sampleDataCode = sampleDataMatch ? sampleDataMatch[0] : '';
assertCheck(
  '[원칙 8] 우진자동차공업사 샘플 데이터 내 금지어 0건 검증',
  !sampleDataCode.includes('마중물') &&
  !sampleDataCode.includes('영업 마비') &&
  !sampleDataCode.includes('절실'),
  'loadSampleData 내에 구형 금지어 잔재가 남아있습니다!'
);

assertCheck(
  '[원칙 8] 우진자동차공업사 샘플 데이터 내 "매출 상승 효과" 명시 검증',
  sampleDataCode.includes('매출 상승 효과'),
  'loadSampleData 4. 기대효과에 "매출 상승 효과"가 누락되었습니다!'
);

// [신규 검증] applyGeneratedResults 내 유령 DOM ID 부존재 검증
assertCheck(
  '[SSOT 검증] applyGeneratedResults 내 유령 DOM ID(bizPeriod, bizCategory) 부존재 검증',
  !planGenCode.includes("getElementById('bizPeriod')") &&
  !planGenCode.includes("getElementById('bizCategory')"),
  'applyGeneratedResults 내에 존재하지 않는 유령 DOM ID가 참조되고 있습니다!'
);

// 7. [원칙 7, 8 시뮬레이션] 금지어가 포함된 과거 330자 텍스트 입력 시 445~485자 확장 및 금지어 0건, 매출 상승 효과 보장 검증
const sample330TextWithBannedWords = {
  part1: '1. 온누리공인중개사사무소은(는) 2016년 개업하여 11년차 동안 지역 주민과 함께 호흡해 온 생활밀착형 부동산 중개업소입니다.',
  part2: '2. 개선사항 : 오랜 기간 방치되어 탈색과 오염이 심각한 노후 간판을 전면 철거하고, 시인성이 뛰어난 고효율 LED 플렉스 간판으로 교체하고자 합니다.',
  part3: '3. 개선 필요성 : 간판 노후화로 영업 마비 상태에 처해 신규 고객 유입이 단절된 상황에서, 절박한 처지에서 공단 보조금 지원이 절실합니다.',
  part4: '4. 기대효과 : 본 지원을 마중물 삼아 점포 경쟁력을 높이고 경영을 정상화하여 지역 골목상권 활성화에 적극 기여하겠습니다.'
};

// plan-generator.html 내의 extractOperationYears, enforceMin400Chars 및 sanitizePlanText 함수 추출
const yearsMatch = planGenCode.match(/function extractOperationYears[\s\S]*?\n    \}/);
const sanitizeMatch = planGenCode.match(/function sanitizePlanText[\s\S]*?\n    \}/);
const funcMatch = planGenCode.match(/function enforceMin400Chars[\s\S]*?\n    \}/);

if (funcMatch && sanitizeMatch && yearsMatch) {
  try {
    const fn = new Function('data', 'context', `
      ${yearsMatch[0]}
      ${sanitizeMatch[0]}
      ${funcMatch[0]}
      return enforceMin400Chars(data, context);
    `);
    const simResult = fn(sample330TextWithBannedWords, {
      bizName: '온누리공인중개사사무소',
      openYear: '2016년 개업 (11년차)',
      industryDetail: '부동산 중개업소',
      extraNotes: '골목상권 밀착 중개'
    });
    const len = simResult.plan.length;

    assertCheck(
      '[원칙 7, 8 시뮬레이션] 330자 ➔ 440~500자 완벽 보강 검증',
      len >= 440 && len <= 500 && simResult.plan.endsWith('.'),
      `시뮬레이션 글자수(${len}자)가 기준을 벗어났습니다!`
    );

    assertCheck(
      '[원칙 8 시뮬레이션] 4. 기대효과 내 "매출 상승 효과" 명시 포함 검증',
      simResult.plan.includes('매출 상승 효과'),
      '4. 기대효과에 "매출 상승 효과"가 포함되지 않았습니다!'
    );

    assertCheck(
      '[원칙 8 시뮬레이션] 금지어(마중물, 영업 마비, 절박, 절실) 0건 영구 배제 검증',
      !simResult.plan.includes('마중물') &&
      !simResult.plan.includes('영업 마비') &&
      !simResult.plan.includes('절박') &&
      !simResult.plan.includes('절실'),
      '결과 텍스트 내에 금지어가 남아있습니다!'
    );

    // [신규 핵심 시뮬레이션] 8년 이상 점포(11년차) part1 내 "11년간" 기간 필수 명시 검증
    assertCheck(
      '[원칙 9 시뮬레이션] 8년 이상 점포(11년차) part1 내 "11년간" 운영 기간 필수 명시 검증',
      simResult.part1.includes('11년간'),
      'part1에 "11년간" 기간이 명시되지 않았습니다!'
    );

    // [신규 핵심 시뮬레이션] 530자 초과 긴 텍스트 입력 시 4. 기대효과 100% 보존 검증 (스크린샷 버그 재발 방지)
    const longTextOver530 = {
      part1: '1. 온누리공인중개사사무소은(는) 2016년에 개업하여 11년차를 맞이한 전문 공인중개사 사무소로, 지역 주민과 밀착하여 신뢰를 쌓아온 생활밀착형 서비스업 점포입니다. 한자리에서 성실히 일터를 지켜왔으나, 최근 장기화된 경기 침체와 물가 상승으로 인해 영세한 점포 운영에 적지 않은 경제적 부담을 겪고 있습니다.',
      part2: '2. 개선사항 : 노후화로 인해 색이 바래고 오염된 기존 간판을 안전하게 철거하고, 시인성이 뛰어난 고효율 LED 플렉스 간판으로 전면 교체 시공할 계획입니다. 이를 통해 주야간 원거리에서도 상호 식별이 용이하도록 조도를 대폭 개선하고, 쾌적한 점포 외관을 조성하여 고객 신뢰를 회복하고자 합니다.',
      part3: '3. 개선 필요성 : 간판의 심각한 노후화로 인해 상호와 연락처 식별이 어려워져 신규 고객 유입이 정체되는 등 점포 운영에 실질적인 어려움이 가중되고 있습니다. 자력 교체 부담이 큰 영세 사업장 여건에서 공단의 이번 시설 지원은 경영 정상화에 큰 힘이 됩니다.',
      part4: '4. 기대효과 : 본 공공 지원을 발판 삼아 점포 인지도를 높이고 고객 접근성을 강화하여 가시적인 매출 상승 효과를 거두고, 지역 골목상권 활성화에 적극 기여하겠습니다.'
    };

    const simLongResult = fn(longTextOver530, {
      bizName: '온누리공인중개사사무소',
      openYear: '2016년 개업 (11년차)',
      industryDetail: '부동산 중개업소'
    });

    assertCheck(
      '[핵심 버그 재발 방지] 530자 초과 텍스트에서도 "4. 기대효과" 100% 완전 보존 검증',
      simLongResult.plan.includes('4. 기대효과') && simLongResult.plan.includes('매출 상승 효과'),
      '500자 초과 시 4. 기대효과가 잘려나갔습니다!'
    );

    assertCheck(
      '[핵심 버그 재발 방지] 530자 초과 텍스트 균형 압축 후 글자수(440~500자) 사수 검증',
      simLongResult.plan.length >= 440 && simLongResult.plan.length <= 500 && simLongResult.plan.endsWith('.'),
      `압축 후 글자수(${simLongResult.plan.length}자)가 440~500자 범위를 벗어났습니다!`
    );

    assertCheck(
      '[원칙 9 시뮬레이션] 530자 초과 텍스트에서도 part1 "11년간" 기간 보존 검증',
      simLongResult.part1.includes('11년간'),
      '530자 텍스트에서 part1의 "11년간" 기간이 누락되었습니다!'
    );

  } catch(e) {
    assertCheck('[원칙 7, 8 시뮬레이션] 함수 실행 테스트', false, e.message);
  }
} else {
  assertCheck('[원칙 7, 8 시뮬레이션] 함수 추출', false, '함수를 파싱할 수 없습니다.');
}

console.log('\n========================================================');
console.log(`🎉 [검증 완료] 총 ${passedChecks}/${totalChecks}개 전용 원칙 검사를 100% 통과했습니다!`);
console.log('   GP Implementation Plan의 독립 무결성과 4개 파트 완전 보존 원칙이 완벽하게 증명되었습니다.');
console.log('========================================================\n');

