const fs = require('fs');

async function fixAllSupabasePhotoCounts() {
  const cfg = fs.readFileSync('supabase-config.js', 'utf8');
  const urlMatch = cfg.match(/SUPABASE_URL\s*=\s*['"`]([^'"`]+)['"`]/);
  const keyMatch = cfg.match(/SUPABASE_ANON_KEY\s*=\s*['"`]([^'"`]+)['"`]/);

  const SUPABASE_URL = urlMatch[1];
  const SUPABASE_ANON_KEY = keyMatch[1];

  console.log('Fetching all applications from Supabase...');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=id,store_name,owner_name,image_url,memo,construction_photos`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  const apps = await res.json();
  console.log(`Checking ${apps.length} applications...`);

  for (const app of apps) {
    const hasImage = Boolean(app.image_url && app.image_url.length > 50);
    let memoObj = {};
    try {
      memoObj = typeof app.memo === 'string' ? JSON.parse(app.memo) : (app.memo || {});
    } catch (e) {
      memoObj = {};
    }

    const currentCount = Number(memoObj.photoCount) || 0;

    if (hasImage && currentCount === 0) {
      console.log(`[FIXING] ${app.id} (${app.store_name}): hasImage=true but photoCount=0 -> Updating photoCount to 1`);
      memoObj.photoCount = 1;

      const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.${encodeURIComponent(app.id)}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify({
          memo: JSON.stringify(memoObj)
        })
      });

      if (patchRes.ok) {
        console.log(`  -> SUCCESS: ${app.id} updated!`);
      } else {
        console.error(`  -> FAILED: ${app.id}, status: ${patchRes.status}`);
      }
    } else {
      console.log(`[OK] ${app.id} (${app.store_name}): photoCount=${currentCount}, hasImage=${hasImage}`);
    }
  }

  // Also verify user items
  const resUsers = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,items`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const users = await resUsers.json();
  for (const u of users) {
    if (u.items && Array.isArray(u.items)) {
      let changed = false;
      const updatedItems = u.items.map(it => {
        if (String(it.id) === 'P-260926-001' || String(it.appRefId) === 'P-260926-001') {
          if (!it.photosCount || it.photosCount === 0) {
            console.log(`[USER ITEM FIX] User ${u.id} item P-260926-001 photosCount updated to 1`);
            changed = true;
            return { ...it, photosCount: 1 };
          }
        }
        return it;
      });
      if (changed) {
        await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(u.id)}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ items: updatedItems })
        });
        console.log(`  -> User ${u.id} items updated!`);
      }
    }
  }

  console.log('--- All DB photo counts verified and fixed! ---');
}

fixAllSupabasePhotoCounts().catch(console.error);
