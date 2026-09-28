const fs = require('fs');

async function testHeeDongPhotos() {
  const cfg = fs.readFileSync('supabase-config.js', 'utf8');
  const urlMatch = cfg.match(/SUPABASE_URL\s*=\s*['"`]([^'"`]+)['"`]/);
  const keyMatch = cfg.match(/SUPABASE_ANON_KEY\s*=\s*['"`]([^'"`]+)['"`]/);

  const SUPABASE_URL = urlMatch[1];
  const SUPABASE_ANON_KEY = keyMatch[1];

  console.log('--- 1. Fetching 희동상사 (P-260926-001) from Supabase ---');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.P-260926-001`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  const [app] = await res.json();
  if (!app) {
    console.error('Application not found!');
    return;
  }

  console.log('App Details:');
  console.log('  id:', app.id);
  console.log('  store_name:', app.store_name);
  console.log('  owner_name:', app.owner_name);
  console.log('  user_id:', app.user_id);
  console.log('  memo:', app.memo);
  console.log('  image_url length:', app.image_url ? app.image_url.length : 0);
  console.log('  image_url start:', app.image_url ? app.image_url.substring(0, 80) : null);
  console.log('  construction_photos:', app.construction_photos);

  // Now simulate extractValidPhotos from security-utils.js
  function extractValidPhotos(app) {
    if (!app) return [];
    let photos = [];
    if (Array.isArray(app.photos) && app.photos.length > 0) {
      photos = app.photos.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:') || p.length > 100));
    } else if (typeof app.photos === 'string' && app.photos.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(app.photos.trim());
        if (Array.isArray(parsed)) {
          photos = parsed.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:') || p.length > 100));
        }
      } catch (e) {}
    } else if (typeof app.photos === 'string' && (app.photos.startsWith('data:') || app.photos.startsWith('http') || app.photos.startsWith('blob:') || app.photos.length > 100)) {
      photos = [app.photos];
    }

    if (photos.length === 0 && app.fileData && typeof app.fileData === 'string' && (app.fileData.startsWith('data:') || app.fileData.startsWith('http') || app.fileData.startsWith('blob:') || app.fileData.length > 100)) {
      photos = [app.fileData];
    }
    if (photos.length === 0 && app.image_url && typeof app.image_url === 'string') {
      const trimmed = app.image_url.trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            photos = parsed.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:') || p.length > 100));
          }
        } catch (e) {
          photos = [trimmed];
        }
      } else if (trimmed.startsWith('data:') || trimmed.startsWith('http') || trimmed.startsWith('blob:') || trimmed.length > 100) {
        photos = [trimmed];
      }
    }
    // raw base64 접두어 누락 시 자동 보정
    return photos.map(p => {
      if (typeof p === 'string' && !p.startsWith('data:') && !p.startsWith('http') && !p.startsWith('blob:')) {
        if (p.startsWith('/9j/')) return `data:image/jpeg;base64,${p}`;
        if (p.startsWith('iVBORw0KGgo')) return `data:image/png;base64,${p}`;
      }
      return p;
    });
  }

  const extracted = extractValidPhotos(app);
  console.log('\n--- 2. extractValidPhotos result ---');
  console.log('Extracted photos count:', extracted.length);
  if (extracted.length > 0) {
    console.log('Photo 1 length:', extracted[0].length, 'prefix:', extracted[0].substring(0, 40));
  }

  // Now check how ensureApplicationPhotosLoaded handles it when called with id 'P-260926-001'
  console.log('\n--- 3. Checking DataStore and localStorage mapping ---');
  // When an admin clicks the button in the admin dashboard:
  // onclick="window.downloadApplicationPhotos('P-260926-001', { expectedCount: ... })"
}

testHeeDongPhotos().catch(console.error);
