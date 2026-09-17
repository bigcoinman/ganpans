const fs = require('fs');

const files = ['index.html', 'app.js', 'data-store.js', 'security-utils.js', 'kakao-notify.js', 'style.css', 'app.css'];
console.log('=== [전체 파일 찌꺼기/중복/레거시 심층 전수 스캔] ===\n');

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  
  // 1. 주석 처리된 구형 레거시 코드 블록
  const commentedBlocks = (content.match(/\/\*[\s\S]*?\*\//g) || []).filter(b => b.includes('function') || b.includes('document.') || b.includes('localStorage') || b.includes('alert('));
  
  // 2. window 글로벌 등록
  const windowAssignments = (content.match(/window\.([a-zA-Z0-9_$]+)\s*=/g) || []).map(w => w.replace(/window\.|\s*=/g, ''));
  
  // 3. localStorage 직접 조작 구문
  const directLocalStorage = lines.filter(l => l.includes('localStorage.') && !l.includes('saveUsersSSOT') && !l.includes('saveApplicationsSSOT') && !l.includes('saveInquiriesSSOT') && !l.startsWith('//'));

  console.log(`📄 [${file}] - 총 ${lines.length}줄`);
  console.log(` - 주석 처리된 죽은 코드 블록: ${commentedBlocks.length}개`);
  console.log(` - window 글로벌 등록 수: ${windowAssignments.length}개`);
  console.log(` - 직접 localStorage 조작 구문: ${directLocalStorage.length}개`);
});
