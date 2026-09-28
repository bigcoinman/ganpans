const fs = require('fs');
const sc = fs.readFileSync('supabase-config.js', 'utf8');
const url = sc.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)[1];
const key = sc.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/)[1];

async function testFetch() {
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  };
  const appColumns = 'id, user_id, owner_name, phone, store_name, store_address, sign_type, referrer_code, status, assigned_constructor_id, assigned_constructor_name, construction_status, memo, applied_at, created_at';
  const res = await fetch(`${url}/rest/v1/applications?select=${encodeURIComponent(appColumns)}`, { headers });
  const supaApps = await res.json();
  console.log('Total supaApps fetched:', supaApps.length);

  const target = supaApps.find(a => a.id === 'P-260928-001' || (a.store_name && a.store_name.includes('시진핑')));
  console.log('Target app found in Supabase:', target);
}

testFetch().catch(console.error);
