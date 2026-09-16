const fs = require('fs');

function checkAutoAdmin(filename) {
  const content = fs.readFileSync(filename, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    if (l.includes('localStorage.setItem') && (l.includes('admin') || l.includes('activeUser'))) {
      console.log(`${filename}:${i+1}: ${l.trim()}`);
    }
    if (l.includes('sessionStorage.setItem') && (l.includes('admin') || l.includes('activeUser'))) {
      console.log(`${filename}:${i+1}: ${l.trim()}`);
    }
  });
}

checkAutoAdmin('app.js');
checkAutoAdmin('dashboard.js');
checkAutoAdmin('data-store.js');
checkAutoAdmin('security-utils.js');
checkAutoAdmin('script.js');
checkAutoAdmin('index.html');
