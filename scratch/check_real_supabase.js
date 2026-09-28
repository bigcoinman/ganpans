const fs = require('fs');

async function checkRealSupabase() {
  const content = fs.readFileSync('supabase-config.js', 'utf8');
  const urlMatch = content.match(/SUPABASE_URL\s*=\s*['"`]([^'"`]+)['"`]/);
  const keyMatch = content.match(/SUPABASE_ANON_KEY\s*=\s*['"`]([^'"`]+)['"`]/);

  const SUPABASE_URL = urlMatch[1];
  const SUPABASE_ANON_KEY = keyMatch[1];

  console.log('Real Supabase URL:', SUPABASE_URL);

  const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  const apps = await res.json();
  console.log(`Total applications in real DB: ${apps.length}`);

  apps.forEach((a, idx) => {
    console.log(`\n[App ${idx + 1}] ID: ${a.id}`);
    console.log(`  store_name: ${a.store_name}`);
    console.log(`  owner_name: ${a.owner_name}`);
    console.log(`  owner_phone: ${a.owner_phone}`);
    console.log(`  user_id: ${a.user_id}`);
    console.log(`  created_at: ${a.created_at}`);
    console.log(`  image_url: ${a.image_url ? (a.image_url.startsWith('data:') ? `Base64 (${a.image_url.length} chars, starts with ${a.image_url.substring(0, 30)})` : a.image_url) : 'NULL/EMPTY'}`);
    console.log(`  construction_photos: ${a.construction_photos ? (Array.isArray(a.construction_photos) ? `Array[${a.construction_photos.length}]` : typeof a.construction_photos) : 'NULL/EMPTY'}`);
    if (Array.isArray(a.construction_photos)) {
      a.construction_photos.forEach((p, pIdx) => {
        console.log(`    photo[${pIdx}]: ${typeof p === 'string' ? (p.startsWith('data:') ? `Base64 (${p.length} chars)` : p) : JSON.stringify(p)}`);
      });
    }
  });

  console.log('\n--- Searching for 희동 or 동희 in real DB ---');
  apps.forEach(a => {
    const s = JSON.stringify(a);
    if (s.includes('희동') || s.includes('동희') || s.includes('상사')) {
      console.log('MATCHED:', a.id, a.store_name, a.owner_name);
    }
  });
}

checkRealSupabase().catch(console.error);
