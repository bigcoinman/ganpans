const fs = require('fs');

async function main() {
  const cfg = fs.readFileSync('supabase-config.js', 'utf8');
  const url = cfg.match(/SUPABASE_URL\s*=\s*"([^"]+)"/)[1];
  const key = cfg.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/)[1];

  const res = await fetch(`${url}/rest/v1/applications?id=eq.P-260917-001&select=id,store_name,memo,image_url`, {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const data = (await res.json())[0];
  console.log('ID:', data.id);
  console.log('Store:', data.store_name);
  console.log('Memo:', data.memo);
  const photos = JSON.parse(data.image_url);
  console.log('Photos count:', photos.length);
  photos.forEach((p, idx) => {
    console.log(` Photo ${idx + 1} length: ${p.length}, prefix: ${p.slice(0, 30)}`);
  });
}

main().catch(console.error);
