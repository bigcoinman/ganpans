const fs = require('fs');

const sc = fs.readFileSync('supabase-config.js', 'utf8');
const url = sc.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)[1];
const key = sc.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/)[1];

async function check() {
  const headers = {
    'apikey': key,
    'Authorization': `Bearer ${key}`,
    'Content-Type': 'application/json'
  };

  console.log('--- Checking users ---');
  const uResp = await fetch(`${url}/rest/v1/users?order=created_at.desc&limit=5`, { headers });
  const users = await uResp.json();
  console.log('Recent 5 users:');
  console.log(users.map(u => ({ id: u.id, name: u.name, phone: u.phone, role: u.role, created_at: u.created_at })));

  console.log('\n--- Checking applications for 시진핑 ---');
  const aResp = await fetch(`${url}/rest/v1/applications?store_name=ilike.*시진핑*`, { headers });
  const apps = await aResp.json();
  console.log('Apps found for 시진핑:');
  console.log(apps);

  console.log('\n--- Recent 5 applications ---');
  const rResp = await fetch(`${url}/rest/v1/applications?select=id,store_name,owner_name,phone,status,is_biz_item,applied_at,memo&order=applied_at.desc&limit=5`, { headers });
  const rApps = await rResp.json();
  console.log('Recent 5 apps:');
  console.log(rApps);
}

check().catch(console.error);
