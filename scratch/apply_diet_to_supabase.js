const https = require('https');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

function updateRow(id, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/applications?id=eq.${encodeURIComponent(id)}`);
    const dataStr = JSON.stringify(payload);
    const options = {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on('error', reject);
    req.write(dataStr);
    req.end();
  });
}

async function run() {
  const dietPath = path.join(__dirname, 'diet_applications.json');
  let raw = fs.readFileSync(dietPath, 'utf8');
  if (raw.charCodeAt(0) === 0xFEFF) {
    raw = raw.slice(1);
  }
  const dietApps = JSON.parse(raw);

  console.log(`Starting Supabase DB Diet Update for ${dietApps.length} applications...`);

  for (let i = 0; i < dietApps.length; i++) {
    const app = dietApps[i];
    console.log(`Updating [${app.id}] (${app.store_name})...`);

    const payload = {};
    if (app.image_url !== undefined) payload.image_url = app.image_url;
    if (app.construction_photos !== undefined) payload.construction_photos = app.construction_photos;
    if (app.construction_invoice !== undefined) payload.construction_invoice = app.construction_invoice;

    const res = await updateRow(app.id, payload);
    if (res.status === 200 || res.status === 204) {
      console.log(`  -> SUCCESS: ${app.id}`);
    } else {
      console.error(`  -> ERROR ${res.status}:`, res.body);
    }
  }

  console.log('\nAll application photo fields updated successfully!');
}

run();
