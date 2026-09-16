const fs = require('fs');

const files = ['dashboard.js', 'app.js', 'security-utils.js', 'script.js'];
files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  console.log('=== ' + file + ' ===');
  let count = 0;
  lines.forEach((line, idx) => {
    if (/localStorage\.setItem\(['"](users|applications|inquiries)['"]/.test(line)) {
      console.log((idx + 1) + ': ' + line.trim());
      count++;
    }
  });
  console.log('Total matches in ' + file + ': ' + count);
});
