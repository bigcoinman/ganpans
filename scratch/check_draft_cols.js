const fs = require('fs');
const envFile = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = envFile.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = envFile.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const SUPABASE_URL = urlMatch[1];
const SUPABASE_KEY = keyMatch[1];

async function check() {
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };
  const res = await fetch(SUPABASE_URL + '/rest/v1/applications?select=sign_draft_photos&limit=1', { headers });
  const data = await res.json();
  console.log('Result for sign_draft_photos column:', data);
  
  const res2 = await fetch(SUPABASE_URL + '/rest/v1/applications?select=draft_status&limit=1', { headers });
  const data2 = await res2.json();
  console.log('Result for draft_status column:', data2);
}
check().catch(console.error);
