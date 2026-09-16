const fs = require('fs');

function searchFile(filename) {
  console.log(`=== Searching in ${filename} ===`);
  const content = fs.readFileSync(filename, 'utf8');
  const lines = content.split('\n');
  lines.forEach((l, i) => {
    const lower = l.toLowerCase();
    if (
      lower.includes('autologin') ||
      lower.includes('defaultuser') ||
      lower.includes('role === \'admin\'') ||
      lower.includes('role = \'admin\'') ||
      lower.includes('activeuser =') ||
      lower.includes('setitem(\'activeuser\'') ||
      lower.includes('setitem("activeuser"') ||
      lower.includes('currentuser =') ||
      lower.includes('admin') && lower.includes('session')
    ) {
      console.log(`Line ${i + 1}: ${l.trim().slice(0, 120)}`);
    }
  });
}

searchFile('app.js');
searchFile('data-store.js');
searchFile('security-utils.js');
searchFile('index.html');
