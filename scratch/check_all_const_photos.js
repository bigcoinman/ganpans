const fs = require('fs');
const envFile = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = envFile.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = envFile.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const SUPABASE_URL = urlMatch[1];
const SUPABASE_KEY = keyMatch[1];

async function check() {
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };
  const res = await fetch(SUPABASE_URL + '/rest/v1/applications?select=id,store_name,construction_photos,construction_invoice,memo', { headers });
  const data = await res.json();
  console.log('All applications construction_photos & invoice:');
  data.forEach(d => {
    const cp = d.construction_photos;
    const inv = d.construction_invoice;
    console.log(d.id, d.store_name, {
      cpType: typeof cp,
      cpLen: Array.isArray(cp) ? cp.length : (cp ? 'not-array' : 'empty'),
      inv: inv ? String(inv).slice(0, 30) : 'null'
    });
  });
}
check().catch(console.error);
