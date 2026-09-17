const fs = require('fs');
const envFile = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = envFile.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = envFile.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const SUPABASE_URL = urlMatch[1];
const SUPABASE_KEY = keyMatch[1];

async function check() {
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };
  const res = await fetch(SUPABASE_URL + '/rest/v1/applications?select=id,store_name,image_url,construction_photos,memo&id=eq.P-260916-001', { headers });
  const data = await res.json();
  const app = data[0];
  console.log('App:', app.id, app.store_name);
  console.log('Memo:', app.memo);
  const imgs = JSON.parse(app.image_url || '[]');
  console.log('Total images in DB:', imgs.length);
  imgs.forEach((img, i) => {
    console.log(`Image ${i + 1}: len=${img.length}, mime=${img.slice(0, 30)}`);
  });
}
check().catch(console.error);
