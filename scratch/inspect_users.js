const url = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const key = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

async function inspectDbUsers() {
  console.log('=== [Supabase users 테이블 전수 조회] ===');
  const res = await fetch(`${url}/rest/v1/users?select=*`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const users = await res.json();
  console.log('Users count:', users.length);
  console.log('Users data:', JSON.stringify(users, null, 2));

  console.log('\n=== [Supabase site_stats 테이블 전수 조회] ===');
  const statsRes = await fetch(`${url}/rest/v1/site_stats?select=*`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const stats = await statsRes.json();
  console.log('Stats count:', stats.length);
  console.log('Stats data:', JSON.stringify(stats, null, 2));
}

inspectDbUsers();
