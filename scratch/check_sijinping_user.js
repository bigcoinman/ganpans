const fs = require('fs');
const sc = fs.readFileSync('supabase-config.js', 'utf8');
const url = sc.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)[1];
const key = sc.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/)[1];

async function checkUser() {
  const headers = { 'apikey': key, 'Authorization': `Bearer ${key}` };
  const res = await fetch(`${url}/rest/v1/users?or=(id.ilike.*01088884485*,phone.ilike.*01088884485*,name.ilike.*시진핑*)`, { headers });
  const data = await res.json();
  console.log('User in Supabase:');
  console.log(data);
}

checkUser().catch(console.error);
