const fs = require('fs');
const sc = fs.readFileSync('supabase-config.js', 'utf8');
const url = sc.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)[1];
const key = sc.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/)[1];

async function checkAll() {
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };
  const res = await fetch(`${url}/rest/v1/applications?select=id,store_name,applied_at,created_at,status,referrer_code`, { headers });
  const data = await res.json();
  console.log('All 9 applications:');
  console.log(data);
}

checkAll().catch(console.error);
