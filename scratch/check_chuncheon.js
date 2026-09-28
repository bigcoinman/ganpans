const fs = require('fs');

async function main() {
  const cfg = fs.readFileSync('supabase-config.js', 'utf8');
  const urlMatch = cfg.match(/SUPABASE_URL\s*=\s*"([^"]+)"/);
  const keyMatch = cfg.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/);
  const url = urlMatch[1];
  const key = keyMatch[1];

  const res = await fetch(`${url}/rest/v1/applications?select=id,store_name,memo,image_url`, {
    headers: { 'apikey': key, 'Authorization': 'Bearer ' + key }
  });
  const data = await res.json();
  console.log('Response status:', res.status);
  console.log('Total apps:', data.length);
  for (const a of data) {
    if (a.store_name && a.store_name.includes('춘천')) {
      console.log('\n>>> Chuncheon Application <<<');
      console.log('ID:', a.id);
      console.log('Store:', a.store_name);
      console.log('Memo:', a.memo);
      console.log('image_url length:', a.image_url ? a.image_url.length : 0);
      if (a.image_url && a.image_url.startsWith('[')) {
        try {
          const parsed = JSON.parse(a.image_url);
          console.log('Photos array length in DB:', parsed.length);
        } catch(e) {}
      }
    }
  }
}

main().catch(console.error);
