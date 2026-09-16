const fs = require('fs');

const content = fs.readFileSync('app.js', 'utf8');
const lines = content.split('\n');
lines.forEach((l, i) => {
  if (l.includes('updateHeaderAuthButton') || l.includes('updateSessionUI')) {
    console.log(`Line ${i + 1}: ${l.trim().slice(0, 120)}`);
  }
});
