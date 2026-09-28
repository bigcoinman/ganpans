const https = require('https');

const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

function querySupabase(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
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
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  const cols = 'id,user_id,owner_name,phone,store_name,store_address,sign_type,referrer_code,status,assigned_constructor_id,assigned_constructor_name,construction_status,memo,applied_at,created_at';
  console.log('Testing column selection query...');
  const res = await querySupabase(`applications?select=${cols}`);
  console.log('Status code:', res.status);
  if (res.status !== 200) {
    console.error('ERROR RESPONSE:', res.body);
  } else {
    console.log('Success! Rows returned:', res.body.length);
  }

  // applications 테이블의 실제 컬럼 목록 확인
  const oneRow = await querySupabase('applications?limit=1');
  if (oneRow.body && oneRow.body[0]) {
    console.log('\nActual columns in applications table:');
    console.log(Object.keys(oneRow.body[0]));
  }
}

run();
