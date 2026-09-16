const https = require('https');

https.get('https://ganpans.com/dashboard?t=20260916_01', (res) => {
  console.log('Status code:', res.statusCode);
  console.log('CF Cache Status:', res.headers['cf-cache-status']);
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const lines = d.split('\n').filter(l => l.includes('<script src='));
    console.log('=== ganpans.com/dashboard?t=... SCRIPTS ===');
    console.log(lines.join('\n'));
  });
});
