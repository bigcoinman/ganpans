const fs = require('fs');

async function checkCols() {
  const cfg = fs.readFileSync('supabase-config.js', 'utf8');
  const urlMatch = cfg.match(/SUPABASE_URL\s*=\s*['"`]([^'"`]+)['"`]/);
  const keyMatch = cfg.match(/SUPABASE_ANON_KEY\s*=\s*['"`]([^'"`]+)['"`]/);

  const SUPABASE_URL = urlMatch[1];
  const SUPABASE_ANON_KEY = keyMatch[1];

  const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?limit=1`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  const [d] = await res.json();
  console.log('Columns in applications table:');
  console.log(Object.keys(d));
}

checkCols().catch(console.error);
