const fs = require('fs');

const appJs = fs.readFileSync('app.js', 'utf8');
const lines = appJs.split('\n');

console.log('=== [DataStore vs localStorage 3중 삼항연산자 땜빵 위치 검색] ===');
const pattern = /\(typeof DataStore !== 'undefined'/g;
let count = 0;
lines.forEach((l, idx) => {
  if (l.includes("typeof DataStore !== 'undefined'")) {
    count++;
    console.log(`라인 ${idx + 1}: ${l.trim().slice(0, 100)}`);
  }
});
console.log(`총 ${count}개 땜빵 구문 발견`);
