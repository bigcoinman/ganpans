const https = require('https');

https.get('https://ganpans.com', (res) => {
  console.log('Status code:', res.statusCode);
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    const lines = d.split('\n').filter(l => l.includes('<script src='));
    console.log('=== ganpans.com (Main/Mobile) SCRIPTS ===');
    console.log(lines.join('\n'));
  });
});
