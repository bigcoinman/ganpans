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

  const appColumns = 'id,user_id,owner_name,phone,store_name,store_address,sign_type,referrer_code,status,assigned_constructor_id,assigned_constructor_name,construction_status,memo,applied_at,created_at';
  const resp = await fetch(`${url}/rest/v1/applications?select=${appColumns}&order=created_at.desc&limit=10`, { headers });
  const data = await resp.json();
  console.log('Query result length:', data.length);
  console.log('All IDs returned:');
  data.forEach((app, idx) => {
    console.log(`${idx + 1}: ${app.id} | ${app.store_name} | status: ${app.status} | memo: ${app.memo}`);
  });
}

check().catch(console.error);
