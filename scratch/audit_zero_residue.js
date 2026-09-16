const fs = require('fs');

const files = ['data-store.js', 'security-utils.js', 'dashboard.js', 'app.js'];

console.log('=== [5대 에이전트 전수 잔재 코드 감사] ===');

const suspiciousPatterns = [
  { name: '신청번호 접두사 분리 추측(prefixCode/parts.split)', regex: /parts\.slice\(0,\s*-1\)\.join\(|prefixCode/g },
  { name: 'rememberMe 없이 localStorage 세션 복원(Zombie)', regex: /else\s+if\s*\(\s*localUser\s*\)/g },
  { name: '비표준 activeUser 강제 쓰기', regex: /localStorage\.setItem\(['"]activeUser['"],/g },
  { name: 'users.items 이중 쓰기 잔재', regex: /targetUser\.items\.(push|unshift)/g },
  { name: '불필요한 Mock/Dummy 데이터 주입', regex: /demoUser|mockItem|sampleUser/g }
];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  console.log(`\n--- File: ${file} (Total: ${lines.length} lines) ---`);
  
  suspiciousPatterns.forEach(pat => {
    let matches = [];
    lines.forEach((line, idx) => {
      if (pat.regex.test(line)) {
        matches.push({ lineNum: idx + 1, text: line.trim() });
      }
    });
    if (matches.length > 0) {
      console.log(`[!] Pattern Found: ${pat.name} (${matches.length} matches)`);
      matches.slice(0, 5).forEach(m => console.log(`    L${m.lineNum}: ${m.text.slice(0, 110)}`));
    } else {
      console.log(`[OK] Pattern Clean: ${pat.name}`);
    }
  });
});
