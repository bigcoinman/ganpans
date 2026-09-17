/**
 * 5대 에이전트 합동 종합 감사 v2
 * 목표: app.js / data-store.js / security-utils.js / index.html / CSS 파일 대상
 * - 유령 함수 (정의만 있고 호출 없음)
 * - 중복 함수 (같은 이름 2회 이상 정의)
 * - 땜빵 console.log/warn/error (대량 남아있는 것)
 * - 사용 안 되는 window.* 노출
 * - index.html에서만 호출되는데 app.js에 없는 함수
 * - 중복 CSS 클래스 (style.css vs app.css 동일 선택자)
 */

const fs = require('fs');

const appJs = fs.readFileSync('app.js', 'utf8');
const dsJs = fs.readFileSync('data-store.js', 'utf8');
const secJs = fs.readFileSync('security-utils.js', 'utf8');
const html = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('style.css', 'utf8');
const appCss = fs.readFileSync('app.css', 'utf8');

// ──────────────────────────────────────────────────────
// 1. app.js 중복 함수 정의 탐색
// ──────────────────────────────────────────────────────
console.log('\n=== [A1] app.js 중복 함수 정의 ===');
const appFnPattern = /^(?:async\s+)?function\s+(\w+)\s*\(/gm;
const appFns = {};
let m;
while ((m = appFnPattern.exec(appJs)) !== null) {
  const name = m[1];
  const line = appJs.substring(0, m.index).split('\n').length;
  if (!appFns[name]) appFns[name] = [];
  appFns[name].push(line);
}
const dupFns = Object.entries(appFns).filter(([, lines]) => lines.length > 1);
if (dupFns.length === 0) {
  console.log('  ✅ 중복 없음');
} else {
  dupFns.forEach(([name, lines]) => {
    console.log(`  ❌ 중복: ${name} → 라인 ${lines.join(', ')}`);
  });
}

// ──────────────────────────────────────────────────────
// 2. data-store.js 중복 함수 정의
// ──────────────────────────────────────────────────────
console.log('\n=== [A2] data-store.js 중복 함수 정의 ===');
const dsFnPattern = /^(?:async\s+)?function\s+(\w+)\s*\(/gm;
const dsFns = {};
while ((m = dsFnPattern.exec(dsJs)) !== null) {
  const name = m[1];
  const line = dsJs.substring(0, m.index).split('\n').length;
  if (!dsFns[name]) dsFns[name] = [];
  dsFns[name].push(line);
}
const dsDupFns = Object.entries(dsFns).filter(([, lines]) => lines.length > 1);
if (dsDupFns.length === 0) {
  console.log('  ✅ 중복 없음');
} else {
  dsDupFns.forEach(([name, lines]) => {
    console.log(`  ❌ 중복: ${name} → 라인 ${lines.join(', ')}`);
  });
}

// ──────────────────────────────────────────────────────
// 3. security-utils.js 중복 함수
// ──────────────────────────────────────────────────────
console.log('\n=== [A3] security-utils.js 중복 함수 정의 ===');
const secFnPattern = /^(?:async\s+)?function\s+(\w+)\s*\(/gm;
const secFns = {};
while ((m = secFnPattern.exec(secJs)) !== null) {
  const name = m[1];
  const line = secJs.substring(0, m.index).split('\n').length;
  if (!secFns[name]) secFns[name] = [];
  secFns[name].push(line);
}
const secDupFns = Object.entries(secFns).filter(([, lines]) => lines.length > 1);
if (secDupFns.length === 0) {
  console.log('  ✅ 중복 없음');
} else {
  secDupFns.forEach(([name, lines]) => {
    console.log(`  ❌ 중복: ${name} → 라인 ${lines.join(', ')}`);
  });
}

// ──────────────────────────────────────────────────────
// 4. window.* 노출 함수 중 HTML/JS에서 실제 사용 여부
// ──────────────────────────────────────────────────────
console.log('\n=== [A4] window.* 노출 함수 미사용 탐색 ===');
const windowExposedPattern = /window\.(\w+)\s*=/g;
const allSources = appJs + dsJs + secJs;
const windowExposed = new Set();
while ((m = windowExposedPattern.exec(allSources)) !== null) {
  windowExposed.add(m[1]);
}

const htmlAndJs = html + appJs + dsJs + secJs;
const unusedWindow = [];
for (const fn of windowExposed) {
  // window.fn( 또는 onclick="fn(" 형태로 호출되는지
  const callPattern = new RegExp(`(?:window\\.${fn}\\s*\\(|(?<!window\\.)\\b${fn}\\s*\\(|["']${fn}\\s*\\()`, 'g');
  const matches = [...htmlAndJs.matchAll(callPattern)];
  // 정의 제외 (= 뒤 function 패턴)
  const defPattern = new RegExp(`window\\.${fn}\\s*=`, 'g');
  const defs = [...allSources.matchAll(defPattern)].length;
  const calls = matches.length - defs;
  if (calls <= 0) {
    unusedWindow.push(fn);
  }
}
if (unusedWindow.length === 0) {
  console.log('  ✅ 미사용 window 노출 없음');
} else {
  console.log(`  ⚠️  미사용 가능성 window.* 함수 (${unusedWindow.length}개):`);
  unusedWindow.slice(0, 30).forEach(fn => console.log(`     - window.${fn}`));
  if (unusedWindow.length > 30) console.log(`     ... 외 ${unusedWindow.length - 30}개`);
}

// ──────────────────────────────────────────────────────
// 5. console.log 남은 수량 (대량 debug log 점검)
// ──────────────────────────────────────────────────────
console.log('\n=== [A5] console.log/warn/error 잔존 수 ===');
const countLogs = (src, label) => {
  const logs = (src.match(/console\.(log|warn|error|debug)\s*\(/g) || []).length;
  console.log(`  ${label}: ${logs}개`);
};
countLogs(appJs, 'app.js');
countLogs(dsJs, 'data-store.js');
countLogs(secJs, 'security-utils.js');

// ──────────────────────────────────────────────────────
// 6. index.html onclick 호출 함수가 app.js에 없는지
// ──────────────────────────────────────────────────────
console.log('\n=== [A6] index.html 이벤트에서 호출하는 함수가 app.js/data-store.js에 없는 경우 ===');
const onEventCalls = [...html.matchAll(/on(?:click|change|submit|input|keyup|focus|blur)="([^"]+)"/g)].map(m => m[1]);
const missingFns = new Set();
for (const call of onEventCalls) {
  // 함수명 추출 (예: "doSomething(this)" -> "doSomething")
  const fnMatch = call.match(/^(\w+)\s*\(/);
  if (!fnMatch) continue;
  const fn = fnMatch[1];
  // app.js 또는 data-store.js 또는 security-utils.js에 정의되어 있는지
  const defined =
    new RegExp(`(function\\s+${fn}\\b|window\\.${fn}\\s*=)`).test(appJs + dsJs + secJs);
  if (!defined) missingFns.add(fn);
}
if (missingFns.size === 0) {
  console.log('  ✅ 모든 이벤트 핸들러 함수 정의 확인됨');
} else {
  console.log(`  ❌ 미정의 이벤트 핸들러 (${missingFns.size}개):`);
  [...missingFns].forEach(fn => console.log(`     - ${fn}`));
}

// ──────────────────────────────────────────────────────
// 7. CSS 중복 선택자 (style.css vs app.css)
// ──────────────────────────────────────────────────────
console.log('\n=== [A7] style.css vs app.css 중복 선택자 ===');
const extractSelectors = (css) => {
  const selectors = new Set();
  const pattern = /^([.#][\w-]+(?:\s*,\s*[.#][\w-]+)*)\s*\{/gm;
  let sm;
  while ((sm = pattern.exec(css)) !== null) {
    sm[1].split(',').map(s => s.trim()).forEach(s => selectors.add(s));
  }
  return selectors;
};
const styleSelectors = extractSelectors(styleCss);
const appSelectors = extractSelectors(appCss);
const dupSelectors = [...styleSelectors].filter(s => appSelectors.has(s));
if (dupSelectors.length === 0) {
  console.log('  ✅ CSS 중복 선택자 없음');
} else {
  console.log(`  ⚠️  양쪽 파일에 동일 선택자 (${dupSelectors.length}개):`);
  dupSelectors.slice(0, 20).forEach(s => console.log(`     - ${s}`));
  if (dupSelectors.length > 20) console.log(`     ... 외 ${dupSelectors.length - 20}개`);
}

// ──────────────────────────────────────────────────────
// 8. 복잡하게 작성된 if/else 체인 탐색 (단순화 후보)
// ──────────────────────────────────────────────────────
console.log('\n=== [A8] 과도한 if-else 체인 (8단계 이상) 탐색 ===');
const longIfElse = [];
const lines = appJs.split('\n');
let depth = 0, maxDepth = 0, startLine = 0;
for (let i = 0; i < lines.length; i++) {
  const l = lines[i];
  if (/\bif\s*\(/.test(l) || /\} else \{/.test(l) || /\} else if\s*\(/.test(l)) {
    depth++;
    if (depth > maxDepth) { maxDepth = depth; startLine = i + 1; }
  }
  if (/^\s*\}/.test(l)) depth = Math.max(0, depth - 1);
}
console.log(`  app.js 최대 if-else 중첩 깊이: ${maxDepth} (시작 라인 근처: ${startLine})`);

// ──────────────────────────────────────────────────────
// 9. TODO/FIXME/HACK 주석 잔존
// ──────────────────────────────────────────────────────
console.log('\n=== [A9] TODO/FIXME/HACK 주석 잔존 ===');
const countTodo = (src, label) => {
  const items = [...src.matchAll(/\/\/\s*(TODO|FIXME|HACK|XXX|BUG)[:.\s]/gi)];
  if (items.length > 0) {
    console.log(`  ⚠️  ${label}: ${items.length}개`);
    items.slice(0, 5).forEach(m => {
      const ln = src.substring(0, m.index).split('\n').length;
      console.log(`     L${ln}: ${m[0].trim()}`);
    });
  } else {
    console.log(`  ✅ ${label}: 없음`);
  }
};
countTodo(appJs, 'app.js');
countTodo(dsJs, 'data-store.js');
countTodo(secJs, 'security-utils.js');

// ──────────────────────────────────────────────────────
// 10. 동일 기능 유틸리티 함수 중복 정의 탐색
// ──────────────────────────────────────────────────────
console.log('\n=== [A10] 유틸 함수 교차 중복 (app.js / data-store.js / security-utils.js) ===');
const getAllFnNames = (src) => {
  const pat = /^(?:async\s+)?function\s+(\w+)\s*\(/gm;
  const names = new Set();
  let mm;
  while ((mm = pat.exec(src)) !== null) names.add(mm[1]);
  return names;
};
const appFnNames = getAllFnNames(appJs);
const dsFnNames = getAllFnNames(dsJs);
const secFnNames = getAllFnNames(secJs);

const crossDups = [];
for (const fn of appFnNames) {
  if (dsFnNames.has(fn)) crossDups.push(`${fn} (app.js & data-store.js)`);
  if (secFnNames.has(fn)) crossDups.push(`${fn} (app.js & security-utils.js)`);
}
for (const fn of dsFnNames) {
  if (secFnNames.has(fn)) crossDups.push(`${fn} (data-store.js & security-utils.js)`);
}
if (crossDups.length === 0) {
  console.log('  ✅ 파일 간 교차 중복 없음');
} else {
  console.log(`  ❌ 파일 간 동일 함수명 (${crossDups.length}개):`);
  crossDups.forEach(fn => console.log(`     - ${fn}`));
}

console.log('\n=== ✅ 감사 완료 ===\n');
