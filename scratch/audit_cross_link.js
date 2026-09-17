const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');
const styleCss = fs.readFileSync('style.css', 'utf8');
const appCss = fs.readFileSync('app.css', 'utf8');

console.log('====================================================');
console.log('🔍 [1. index.html 내 CSS & JS 로드 태그 분석]');
console.log('====================================================');
const cssLinks = indexHtml.match(/<link[^>]*rel=[\"']stylesheet[\"'][^>]*>/gi) || [];
cssLinks.forEach(l => console.log(' CSS:', l.trim()));
const scripts = indexHtml.match(/<script[^>]*src=[\"'][^\"']+[\"'][^>]*>/gi) || [];
scripts.forEach(s => console.log(' JS :', s.trim()));

console.log('\n====================================================');
console.log('🔍 [2. app.js 내 getElementById 참조 vs index.html 전수 대조]');
console.log('====================================================');
const getElemRegex = /getElementById\(['\"]([^'\"]+)['\"]\)/g;
const jsIds = new Set();
let m;
while ((m = getElemRegex.exec(appJs)) !== null) {
  jsIds.add(m[1]);
}
console.log('app.js 에서 getElementById 로 참조하는 고유 ID 수:', jsIds.size);

const missingInHtml = [];
const dynamicInJs = [];
for (const id of jsIds) {
  const pattern = new RegExp('id=[\"\\\']' + id + '[\"\\\']');
  if (!pattern.test(indexHtml)) {
    // 혹시 app.js 내에서 동적으로 생성되는 innerHTML 내의 ID인지 확인
    if (appJs.includes(`id="${id}"`) || appJs.includes(`id='${id}'`)) {
      dynamicInJs.push(id);
    } else {
      missingInHtml.push(id);
    }
  }
}
console.log(' - index.html 에도 없고 app.js 동적 HTML에도 없는 완전 유령 ID 참조:', missingInHtml.length, '개');
missingInHtml.forEach(id => console.log('   ⚠️ 유령 ID 참조:', id));
console.log(' - app.js 동적 템플릿에서 생성되는 ID:', dynamicInJs.length, '개');

console.log('\n====================================================');
console.log('🔍 [3. style.css vs app.css 중복 셀렉터 분석]');
console.log('====================================================');
function getSelectors(css) {
  const lines = css.split('\n');
  const selectors = new Set();
  lines.forEach(l => {
    const trimmed = l.trim();
    if (trimmed.endsWith('{') && !trimmed.startsWith('@') && !trimmed.startsWith('/*')) {
      const sel = trimmed.slice(0, -1).trim();
      selectors.add(sel);
    }
  });
  return selectors;
}
const styleSelectors = getSelectors(styleCss);
const appSelectors = getSelectors(appCss);
console.log('style.css 고유 셀렉터 수:', styleSelectors.size);
console.log('app.css 고유 셀렉터 수:', appSelectors.size);

const commonSelectors = [];
for (const s of appSelectors) {
  if (styleSelectors.has(s)) {
    commonSelectors.push(s);
  }
}
console.log('두 파일에 모두 존재하는 중복/충돌 셀렉터 수:', commonSelectors.length, '개');
if (commonSelectors.length > 0) {
  console.log(' - 상위 15개 중복 셀렉터:', commonSelectors.slice(0, 15));
}

console.log('\n====================================================');
console.log('🔍 [4. app.js 내 땜빵/복잡 로직 및 과거 잔재 패턴 검색]');
console.log('====================================================');
const complexPatterns = [
  { name: '다중 중첩 삼항연산자 (3단계 이상)', regex: /\?[^:\n]+\?[^:\n]+\?[^:\n]+:/g },
  { name: 'localStorage와 DataStore 이중 땜빵 폴백', regex: /\(typeof DataStore !== 'undefined'[^\)]+\)/g },
  { name: '구형 activeUser / currentSession 혼용 땜빵', regex: /curAct\s*=\s*\([^)]+\)\s*\|\|\s*activeUser/g },
  { name: '빈 catch 블록 (침묵 예외)', regex: /catch\s*\([^\)]*\)\s*\{\s*\}/g },
  { name: 'TODO / FIXME / 임시 주석', regex: /(?:\/\/|\/\*)[^\n]*(?:TODO|FIXME|임시|땜빵|레거시|legacy)/gi }
];

complexPatterns.forEach(p => {
  const matches = appJs.match(p.regex) || [];
  console.log(` - ${p.name}: ${matches.length}개 발견`);
});

fs.writeFileSync('scratch/audit_cross_link_result.json', JSON.stringify({
  missingInHtml,
  dynamicInJs,
  commonSelectors
}, null, 2));
console.log('\n결과가 scratch/audit_cross_link_result.json 에 저장되었습니다.');
