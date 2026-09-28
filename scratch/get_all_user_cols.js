const fs = require('fs');

async function main() {
  const cfg = fs.readFileSync('supabase-config.js', 'utf8');
  const url = cfg.match(/SUPABASE_URL\s*=\s*"([^"]+)"/)[1];
  const key = cfg.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/)[1];

  const res = await fetch(`${url}/rest/v1/users?limit=1`, {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const row = (await res.json())[0];
  console.log('Valid users columns in Supabase:');
  console.log(Object.keys(row));
}

main().catch(console.error);
