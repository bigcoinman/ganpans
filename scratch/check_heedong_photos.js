const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function checkHeeDong() {
  console.log('--- 1. Querying applications for "희동" or "상사" ---');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  const apps = await res.json();
  console.log(`Total applications in DB: ${apps.length}`);

  const matched = apps.filter(a => {
    const s = JSON.stringify(a);
    return s.includes('희동') || s.includes('상사');
  });

  console.log(`Matched applications: ${matched.length}`);
  matched.forEach((app, idx) => {
    console.log(`\n[App ${idx + 1}]`);
    console.log(`  id: ${app.id}`);
    console.log(`  store_name: ${app.store_name}`);
    console.log(`  owner_name: ${app.owner_name}`);
    console.log(`  owner_phone: ${app.owner_phone}`);
    console.log(`  user_id: ${app.user_id}`);
    console.log(`  created_at: ${app.created_at}`);
    console.log(`  status: ${app.status}`);
    console.log(`  is_biz_item: ${app.is_biz_item}`);
    console.log(`  image_url: ${app.image_url ? (app.image_url.startsWith('data:') ? `Base64 (${app.image_url.length} chars, starts with ${app.image_url.substring(0, 30)})` : app.image_url) : 'NULL/EMPTY'}`);
    console.log(`  construction_photos: ${app.construction_photos ? (Array.isArray(app.construction_photos) ? `Array[${app.construction_photos.length}]` : typeof app.construction_photos) : 'NULL/EMPTY'}`);
    if (Array.isArray(app.construction_photos)) {
      app.construction_photos.forEach((p, pIdx) => {
        console.log(`    photo[${pIdx}]: ${typeof p === 'string' ? (p.startsWith('data:') ? `Base64 (${p.length} chars)` : p) : JSON.stringify(p)}`);
      });
    }
    console.log(`  construction_invoice: ${app.construction_invoice ? 'EXISTS' : 'NULL'}`);
    console.log(`  draft_image: ${app.draft_image ? 'EXISTS' : 'NULL'}`);
  });

  console.log('\n--- 2. Checking all applications sorted by created_at DESC (last 10) ---');
  const sorted = [...apps].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
  sorted.slice(0, 10).forEach(a => {
    console.log(`  ID: ${a.id}, Store: ${a.store_name}, Owner: ${a.owner_name}, Phone: ${a.owner_phone}, Created: ${a.created_at}, HasImageUrl: ${!!a.image_url}, HasPhotos: ${!!(a.construction_photos && a.construction_photos.length)}`);
  });
}

checkHeeDong().catch(console.error);
