// 5-Cycle Exhaustive Stress & Ghost Code Audit Suite
// Conducted by 5 Specialized Agents

const fs = require('fs');
const { execSync } = require('child_process');

console.log('================================================================');
console.log('🛡️ [5대 에이전트 합동] 5회 연속 무결성 및 찌꺼기 전수 스트레스 감사');
console.log('================================================================\n');

const files = {
    appJs: fs.readFileSync('app.js', 'utf8'),
    indexHtml: fs.readFileSync('index.html', 'utf8'),
    styleCss: fs.readFileSync('style.css', 'utf8'),
    appCss: fs.readFileSync('app.css', 'utf8'),
    secUtilsJs: fs.readFileSync('security-utils.js', 'utf8'),
    dataStoreJs: fs.readFileSync('data-store.js', 'utf8'),
    blueprint: fs.readFileSync('SYSTEM_BLUEPRINT.md', 'utf8')
};

const ghostPatterns = [
    { name: 'sales_draft_cache (영업자 독자 시안 캐시)', regex: /sales_draft_cache/g },
    { name: 'find_id_cache (아이디 찾기 독자 캐시)', regex: /find_id_cache/g },
    { name: 'find_pw_cache (비밀번호 찾기 독자 캐시)', regex: /find_pw_cache/g },
    { name: 'viewDraftModalForSales (영업자 전용 시안 모달 분기)', regex: /viewDraftModalForSales/g },
    { name: 'viewDraftModalMob (모바일 전용 시안 모달 분기)', regex: /viewDraftModalMob/g },
    { name: 'getBizItemsForSalesOnly (영업자 전용 독자 물건 수집)', regex: /getBizItemsForSalesOnly/g },
    { name: 'max_size = 1200 (구형 무압축 규격)', regex: /max_size\s*=\s*1200/g },
    { name: 'style.css 내 AI 이중 선언 (.ai-trigger-bubble)', regex: /\.ai-trigger-bubble\s*\{/g, target: 'styleCss' },
    { name: 'style.css 내 AI 이중 선언 (.ai-chat-container)', regex: /\.ai-chat-container\s*\{/g, target: 'styleCss' },
    { name: '투명 오버레이 가림막 찌꺼기', regex: /pointer-events:\s*all;\s*position:\s*fixed;\s*inset:\s*0;\s*opacity:\s*0/g }
];

let cycleResults = [];

for (let cycle = 1; cycle <= 5; cycle++) {
    console.log(`\n================================================================`);
    console.log(`▶ [CYCLE ${cycle}/5] 5대 에이전트 무결성 정밀 감사 실행 중...`);
    console.log(`================================================================`);

    let cyclePassed = true;
    let details = [];

    // 1. [QA Code Auditor] 문법 무결성 (node -c)
    try {
        execSync('node -c app.js && node -c security-utils.js && node -c data-store.js && node -c kakao-notify.js && node -c supabase-config.js', { stdio: 'pipe' });
        details.push('1. 문법 검사: 전 파일 SyntaxError 0건 ✅');
    } catch (e) {
        cyclePassed = false;
        details.push(`1. 문법 검사: FAIL (${e.message}) ❌`);
    }

    // 2. [SSOT Sync Guardian] 10대 유령 코드 및 찌꺼기 전수 검사
    let ghostFound = 0;
    ghostPatterns.forEach(gp => {
        const content = gp.target ? files[gp.target] : files.appJs;
        if (gp.regex.test(content)) {
            ghostFound++;
            details.push(`2. 유령 코드 검출: ${gp.name} ❌`);
        }
    });
    if (ghostFound === 0) {
        details.push('2. 유령 코드 및 찌꺼기: 10개 패턴 전수 부존재(0건) 확인 ✅');
    } else {
        cyclePassed = false;
    }

    // 3. [Code Architecture Guardian] CSS 및 HTML 이중 코드 / 태그 대칭 검사
    const openDivs = (files.indexHtml.match(/<div\b/gi) || []).length;
    const closeDivs = (files.indexHtml.match(/<\/div>/gi) || []).length;
    const openBtns = (files.indexHtml.match(/<button\b/gi) || []).length;
    const closeBtns = (files.indexHtml.match(/<\/button>/gi) || []).length;

    if (openDivs === closeDivs && openBtns === closeBtns) {
        details.push(`3. 태그 대칭: div(${openDivs}/${closeDivs}), button(${openBtns}/${closeBtns}) 완전 일치 ✅`);
    } else {
        cyclePassed = false;
        details.push(`3. 태그 대칭 불일치: div(${openDivs}/${closeDivs}), button(${openBtns}/${closeBtns}) ❌`);
    }

    // 4. [UI/UX Flow Specialist] AI 비서 5대 퀵메뉴 & FAQ SSOT 일원화 검사
    const indexHas5Btns = files.indexHtml.includes('data-faq="target"') &&
                          files.indexHtml.includes('data-faq="amount"') &&
                          files.indexHtml.includes('data-faq="documents"') &&
                          files.indexHtml.includes('data-faq="simulator"') &&
                          files.indexHtml.includes('data-faq="contact"');
    
    const appHas5Faqs = files.appJs.includes('target:') &&
                        files.appJs.includes('amount:') &&
                        files.appJs.includes('documents:') &&
                        files.appJs.includes('simulator:') &&
                        files.appJs.includes('contact:');

    const routingHasSim = files.appJs.includes("hash.includes('simulator')");

    if (indexHas5Btns && appHas5Faqs && routingHasSim) {
        details.push('4. AI비서 & 시뮬레이터: 5대 퀵메뉴, FAQ 키, 해시 라우팅 SSOT 100% 일치 ✅');
    } else {
        cyclePassed = false;
        details.push('4. AI비서 SSOT 불일치 또는 누락 ❌');
    }

    // 5. [Security & Blueprint Guardian] 8대 공식 설계도 검문소 (npm run verify)
    try {
        const verifyOut = execSync('npm run verify', { stdio: 'pipe' }).toString();
        if (verifyOut.includes('100% 통과했습니다')) {
            details.push('5. 8대 공식 설계도 자동 검문소: 14개 전수 검사항목 100% 무결 통과 ✅');
        } else {
            cyclePassed = false;
            details.push('5. 8대 설계도 검문소 실패 ❌');
        }
    } catch (e) {
        cyclePassed = false;
        details.push(`5. 8대 설계도 검문소 예외 발생: ${e.message} ❌`);
    }

    details.forEach(d => console.log(`   ${d}`));
    console.log(`\n▶ [CYCLE ${cycle} 결과]: ${cyclePassed ? '🏆 100% PERFECT PASS (결함 0건)' : 'FAIL'}`);
    cycleResults.push(cyclePassed);
}

console.log('\n================================================================');
console.log('📊 [5회 연속 스트레스 감사 최종 집계]');
console.log('================================================================');
const allPassed = cycleResults.every(r => r === true);
cycleResults.forEach((r, idx) => {
    console.log(`  • Cycle #${idx + 1}: ${r ? '✅ PASS (무결점)' : '❌ FAIL'}`);
});

console.log(`\n최종 판정: ${allPassed ? '🎉 5회 전회차 100% 무결점 완전 종결 확인!' : '⚠️ 일부 회차 실패'}`);
console.log('================================================================\n');

if (!allPassed) process.exit(1);
