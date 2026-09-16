const https = require('https');

https.get('https://api.github.com/repos/bigcoinman/ganpans/actions/runs?per_page=3', {
  headers: { 'User-Agent': 'NodeJS' }
}, (res) => {
  let d = '';
  res.on('data', c => d += c);
  res.on('end', () => {
    try {
      const data = JSON.parse(d);
      (data.workflow_runs || []).forEach(r => {
        console.log(`Run ${r.id}: status=${r.status}, conclusion=${r.conclusion}, head_commit=${r.head_commit?.id?.slice(0, 7)}, message=${r.head_commit?.message?.split('\n')[0]}`);
      });
    } catch(e) {
      console.log('Parse err:', e);
    }
  });
});
