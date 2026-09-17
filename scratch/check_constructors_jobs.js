const fs = require('fs');
const envFile = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = envFile.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = envFile.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const SUPABASE_URL = urlMatch[1];
const SUPABASE_KEY = keyMatch[1];

async function checkConstructors() {
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };
  const res = await fetch(SUPABASE_URL + '/rest/v1/users?select=id,name,role,const_code,created_at&order=created_at.desc', { headers });
  const users = await res.json();
  console.log('Constructors and recent users:');
  users.forEach(u => {
    if (u.role === 'constructor' || u.const_code) {
      console.log('Constructor:', u.id, u.name, u.role, u.const_code, u.created_at);
    }
  });

  // Also check recent applications assigned to constructors
  const appRes = await fetch(SUPABASE_URL + '/rest/v1/applications?select=id,store_name,assigned_constructor_id,assigned_constructor_name,construction_status,memo&order=created_at.desc', { headers });
  const apps = await appRes.json();
  console.log('\nApplications with assigned constructor:');
  apps.forEach(a => {
    if (a.assigned_constructor_id || a.assigned_constructor_name) {
      console.log('App:', a.id, a.store_name, {
        cId: a.assigned_constructor_id,
        cName: a.assigned_constructor_name,
        cStatus: a.construction_status,
        memo: a.memo ? a.memo.slice(0, 80) : null
      });
    }
  });
}
checkConstructors().catch(console.error);
