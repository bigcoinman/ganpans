const fs = require('fs');

const files = ['dashboard.js', 'app.js', 'data-store.js', 'security-utils.js', 'script.js'];

files.forEach(file => {
  if (!fs.existsSync(file)) return;
  const code = fs.readFileSync(file, 'utf8');
  const lines = code.split('\n');
  lines.forEach((line, idx) => {
    const l = line.trim();
    if (l.includes('if (!activeUser') || l.includes('if (!curAct') || l.includes('role !== \'admin\'') || l.includes('role !== "admin"')) {
      console.log(`${file}:${idx + 1} -> ${l}`);
    }
  });
});
