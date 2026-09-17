const fs = require('fs');

const dataStoreJs = fs.readFileSync('data-store.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');

const regex = /window\.([a-zA-Z0-9_$]+)\s*=/g;
let m;
const dataStoreGlobals = new Set();
while ((m = regex.exec(dataStoreJs)) !== null) {
  dataStoreGlobals.add(m[1]);
}

console.log('=== [data-store.js window 전역 등록 항목 전수 검사 (총 ' + dataStoreGlobals.size + '개)] ===');
const unusedGlobals = [];
for (const g of dataStoreGlobals) {
  if (g === 'DataStore') continue;
  // index.html 또는 app.js 에서 쓰이는지 확인
  const usedInHtml = indexHtml.includes(g);
  const usedInApp = appJs.includes(g);
  if (!usedInHtml && !usedInApp) {
    unusedGlobals.push(g);
  }
}
console.log('index.html 및 app.js 어디에서도 참조되지 않는 data-store.js 전역 함수/변수:', unusedGlobals.length, '개');
unusedGlobals.forEach(ug => console.log(' - 미사용 글로벌:', ug));
