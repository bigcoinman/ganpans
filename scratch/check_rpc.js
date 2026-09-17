const fs = require('fs');
const envFile = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = envFile.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = envFile.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const SUPABASE_URL = urlMatch[1];
const SUPABASE_KEY = keyMatch[1];

async function checkRpc() {
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json' };
  const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/exec_sql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query: 'SELECT 1' })
  });
  console.log('exec_sql status:', res.status);
  const data = await res.text();
  console.log('exec_sql response:', data);
}
checkRpc().catch(console.error);
