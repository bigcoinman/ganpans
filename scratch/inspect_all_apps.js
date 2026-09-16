const https = require('https');
const url = 'https://nosobuzwrxxtrgohufsp.supabase.co/rest/v1/applications?select=id,store_name,owner_name,memo,image_url';
const opts = { headers: { apikey: 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS', Authorization: 'Bearer sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS' } };
https.get(url, opts, res => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => {
    const arr = JSON.parse(d);
    arr.forEach(a => {
      let m = {};
      try { m = JSON.parse(a.memo); } catch(e) {}
      let pCount = 0;
      if (a.image_url) {
        if (a.image_url.startsWith('[')) {
          try { pCount = JSON.parse(a.image_url).length; } catch(e) {}
        } else if (a.image_url.startsWith('data:') || a.image_url.startsWith('http')) {
          pCount = 1;
        }
      }
      console.log(`[${a.id}] ${a.store_name} | actualPhotos: ${pCount} | memo.photoCount: ${m.photoCount}`);
    });
  });
});
