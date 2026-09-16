const https = require('https');

https.get('https://ganpans.com/dashboard', (res) => {
  console.log('Status code:', res.statusCode);
  console.log('Headers:', res.headers);
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const lines = d.split('\n').filter(l => l.includes('<script src='));
    console.log('=== ganpans.com/dashboard SCRIPTS ===');
    console.log(lines.join('\n'));
  });
});
