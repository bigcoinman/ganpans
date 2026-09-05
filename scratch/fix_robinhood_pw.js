// scratch/fix_robinhood_pw.js
const https = require('https');
const crypto = require('crypto');

const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

const bizHash = crypto.createHash('sha256').update('biz1234!').digest('hex'); // 8a093c7195aba1fe3777e36d64e199771f7028e0462068301e95c932a31c6ac8

function patchUser(id, payload) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/users?id=eq.${id}`);
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
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    req.write(JSON.stringify(payload));
    req.end();
  });
}

async function run() {
  console.log('Patching robinhood password_hash in Supabase...');
  const res = await patchUser('robinhood', {
    password_hash: bizHash,
    biz_code: 'B-260901',
    role: 'business',
    conversion_status: 'approved'
  });
  console.log('Patch result:', res);
}

run();
