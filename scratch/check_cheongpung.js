const fs = require('fs');

const envFile = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = envFile.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = envFile.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);

const SUPABASE_URL = urlMatch[1];
const SUPABASE_KEY = keyMatch[1];

async function run() {
  const uRes = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const uData = await uRes.json();
  const robin = uData.find(u => (u.id === 'robinhood' || u.user_id === 'robinhood' || u.username === 'robinhood' || u.name === '김로빈'));
  console.log('Robin user:', robin ? { id: robin.id, name: robin.name, role: robin.role, itemsLen: robin.items ? robin.items.length : 0 } : 'not found');
  if (robin && Array.isArray(robin.items)) {
    robin.items.forEach(it => {
      console.log('  Item:', it.id, it.storeName, 'photos:', it.photos ? it.photos.length : 0);
      if (it.photos) {
        it.photos.forEach((p, i) => console.log(`    p[${i}]: len=${p.length}`));
      }
    });
  }
}

run();
