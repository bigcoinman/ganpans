const https = require('https');

https.get('https://bigcoinman.github.io/ganpans/dashboard.html', {
  headers: { 'User-Agent': 'NodeJS' }
}, (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers);
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const lines = d.split('\n').filter(l => l.includes('<script src='));
    console.log('=== bigcoinman.github.io/ganpans/dashboard.html SCRIPTS ===');
    console.log(lines.join('\n'));
  });
});
