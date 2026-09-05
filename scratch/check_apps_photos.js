// scratch/check_apps_photos.js
const https = require('https');

const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

function fetchApps() {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/applications?select=id,store_name,owner_name,phone,image_url,memo,created_at`);
    const options = {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const apps = await fetchApps();
  console.log('=== Applications in Supabase DB ===');
  for (const a of apps) {
    const imgLen = a.image_url ? a.image_url.length : 0;
    const isArray = a.image_url && a.image_url.startsWith('[');
    console.log(`[${a.id}] ${a.store_name} (${a.owner_name}) | imgLen: ${imgLen}, isArray: ${isArray}, preview: ${a.image_url ? a.image_url.slice(0, 60) : 'null'}`);
  }
}

run();
