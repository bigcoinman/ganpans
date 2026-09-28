const fs = require('fs');

async function checkAllPhotoMismatches() {
  const cfg = fs.readFileSync('supabase-config.js', 'utf8');
  const urlMatch = cfg.match(/SUPABASE_URL\s*=\s*['"`]([^'"`]+)['"`]/);
  const keyMatch = cfg.match(/SUPABASE_ANON_KEY\s*=\s*['"`]([^'"`]+)['"`]/);

  const SUPABASE_URL = urlMatch[1];
  const SUPABASE_ANON_KEY = keyMatch[1];

  const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=id,store_name,owner_name,image_url,memo,construction_photos`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  const apps = await res.json();
  console.log(`Checking ${apps.length} applications in real DB:`);

  apps.forEach(a => {
    const hasImg = Boolean(a.image_url && a.image_url.length > 50);
    let mCount = 0;
    try {
      const m = JSON.parse(a.memo || '{}');
      mCount = Number(m.photoCount) || 0;
    } catch (e) {}

    const isMismatch = (hasImg && mCount === 0);
    console.log(`[${a.id}] ${a.store_name} (${a.owner_name}) -> hasImgInDB: ${hasImg}, memo.photoCount: ${mCount} ${isMismatch ? '🚨 [사진 있는데 0장으로 표기됨!]' : '✅ [정상]'}`);
  });
}

checkAllPhotoMismatches().catch(console.error);
