// scratch/cleanup_ghost_users.js
const https = require('https');

const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

function supabaseRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
    const options = {
      method: method,
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
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function cleanup() {
  console.log('1. Checking current users in DB...');
  const { data: users } = await supabaseRequest('users?select=*', 'GET');
  console.log('Current DB users:', users.map(u => ({ id: u.id, name: u.name, phone: u.phone, role: u.role })));

  // 전화번호로만 된 자동생성/임시 더미 계정 중 사용자가 관리자에서 삭제하고자 하는 계정들 정리
  const ghostIds = ['01042573152', '01078553685', '01043219870', '01099867135'];

  for (const ghostId of ghostIds) {
    console.log(`\nPurging ghost user: ${ghostId}`);
    // 1) application user_id unbind
    await supabaseRequest(`applications?user_id=eq.${ghostId}`, 'PATCH', { user_id: null });
    // 2) inquiries user_id unbind
    await supabaseRequest(`inquiries?user_id=eq.${ghostId}`, 'PATCH', { user_id: null });
    // 3) delete user
    const delRes = await supabaseRequest(`users?id=eq.${ghostId}`, 'DELETE');
    console.log(`Delete response for ${ghostId}:`, delRes.status);
  }

  const { data: afterUsers } = await supabaseRequest('users?select=*', 'GET');
  console.log('\nCleaned DB users:', afterUsers.map(u => ({ id: u.id, name: u.name, phone: u.phone, role: u.role })));
}

cleanup();
