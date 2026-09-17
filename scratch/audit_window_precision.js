/**
 * A4 심층 감사: window.* 미사용 함수 정밀 검증
 * - 오탐(false positive) 필터링 포함
 * - HTML onclick, JS 직접 호출, data-* 속성 등 포함
 */

const fs = require('fs');

const appJs = fs.readFileSync('app.js', 'utf8');
const dsJs = fs.readFileSync('data-store.js', 'utf8');
const secJs = fs.readFileSync('security-utils.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');

const allSrc = appJs + '\n' + dsJs + '\n' + secJs + '\n' + html;

// window.* 정의 추출 (정의가 있는 파일, 라인 포함)
const windowDefs = new Map();
for (const [src, label] of [[appJs, 'app.js'], [dsJs, 'data-store.js'], [secJs, 'security-utils.js']]) {
  const pat = /window\.(\w+)\s*=/g;
  let m;
  while ((m = pat.exec(src)) !== null) {
    const name = m[1];
    const line = src.substring(0, m.index).split('\n').length;
    if (!windowDefs.has(name)) windowDefs.set(name, []);
    windowDefs.get(name).push({ label, line });
  }
}

const results = { used: [], unused: [], multiDefined: [] };

for (const [fn, defs] of windowDefs.entries()) {
  if (defs.length > 1) {
    results.multiDefined.push({ fn, defs });
  }
  
  // 호출 패턴: 아래 중 하나라도 있으면 사용 중
  const callPatterns = [
    new RegExp(`\\b${fn}\\s*\\(`, 'g'),                   // fn(
    new RegExp(`window\\.${fn}\\s*\\(`, 'g'),              // window.fn(
    new RegExp(`["']${fn}["']`, 'g'),                      // 문자열로 전달
    new RegExp(`=${fn}\\b`, 'g'),                          // =fn 할당
    new RegExp(`\\bwindow\\[["']${fn}["']\\]`, 'g'),       // window['fn']
  ];
  
  let totalCalls = 0;
  let defCount = (allSrc.match(new RegExp(`window\\.${fn}\\s*=`, 'g')) || []).length;
  
  for (const pat of callPatterns) {
    const matches = (allSrc.match(pat) || []).length;
    totalCalls += matches;
  }
  // 정의 횟수를 빼서 순수 호출 횟수 계산
  const netCalls = totalCalls - defCount;
  
  if (netCalls > 0) {
    results.used.push(fn);
  } else {
    results.unused.push({ fn, defs });
  }
}

console.log(`\n=== window.* 정의 총 ${windowDefs.size}개 ===`);
console.log(`  사용 확인: ${results.used.length}개`);
console.log(`  미사용 의심: ${results.unused.length}개`);
console.log(`  중복 정의: ${results.multiDefined.length}개`);

if (results.multiDefined.length > 0) {
  console.log('\n--- 중복 정의된 window.* ---');
  results.multiDefined.forEach(({ fn, defs }) => {
    console.log(`  ❌ window.${fn} - ${defs.map(d => `${d.label}:L${d.line}`).join(', ')}`);
  });
}

if (results.unused.length > 0) {
  console.log('\n--- 미사용 의심 window.* (정밀 검증 필요) ---');
  results.unused.forEach(({ fn, defs }) => {
    const defInfo = defs.map(d => `${d.label}:L${d.line}`).join(', ');
    console.log(`  ⚠️  window.${fn} (정의: ${defInfo})`);
  });
}
