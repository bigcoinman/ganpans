const fs = require('fs');
const envFile = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = envFile.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = envFile.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const SUPABASE_URL = urlMatch[1];
const SUPABASE_KEY = keyMatch[1];

async function check() {
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };
  const res = await fetch(SUPABASE_URL + '/rest/v1/applications?select=id,construction_photos,construction_invoice,memo&limit=5', { headers });
  const data = await res.json();
  console.log('Applications sample rows:');
  data.forEach(d => {
    console.log({
      id: d.id,
      construction_photos: typeof d.construction_photos,
      isConstPhotosArr: Array.isArray(d.construction_photos),
      construction_invoice: typeof d.construction_invoice,
      memo: d.memo ? d.memo.slice(0, 100) : null
    });
  });
}
check().catch(console.error);
