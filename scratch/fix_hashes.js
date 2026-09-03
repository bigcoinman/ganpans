const url = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const key = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';
const crypto = require('crypto');

const bizHash = crypto.createHash('sha256').update('biz1234!').digest('hex'); // 8a093c7195aba1fe3777e36d64e199771f7028e0462068301e95c932a31c6ac8
const constHash = crypto.createHash('sha256').update('const1234!').digest('hex'); // 14ec7a6f2a875a6c3f6834b620b7596a77d1cefb1e0ea28b49e35999015c9071
const adminHash = crypto.createHash('sha256').update('admin1234!').digest('hex'); // b0d107a1cb94cd60c513a8636f99b8d700154887e2a96f0310a1b5f3e60a6ddd

async function fixHashes() {
  console.log('=== [Supabase users DB password_hash 동기화] ===');
  
  await fetch(`${url}/rest/v1/users?id=eq.bizuser`, {
    method: 'PATCH',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password_hash: bizHash })
  });
  console.log('✓ bizuser password_hash 갱신 완료 (biz1234!)');

  await fetch(`${url}/rest/v1/users?id=eq.bugsman2026`, {
    method: 'PATCH',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password_hash: bizHash })
  });
  console.log('✓ bugsman2026 password_hash 갱신 완료 (biz1234!)');

  await fetch(`${url}/rest/v1/users?id=eq.constuser`, {
    method: 'PATCH',
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ password_hash: constHash })
  });
  console.log('✓ constuser password_hash 갱신 완료 (const1234!)');

  // Verify
  const res = await fetch(`${url}/rest/v1/users?select=id,name,role,password_hash`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data = await res.json();
  console.log('\n[갱신 후 users 데이터]:', data);
}

fixHashes();
