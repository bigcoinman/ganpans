const fs = require('fs');

const cfg = fs.readFileSync('supabase-config.js', 'utf8');
const url = cfg.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)[1];
const key = cfg.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/)[1];

async function check() {
    const res = await fetch(`${url}/rest/v1/reviews?select=id,comments&limit=1`, {
        headers: {
            'apikey': key,
            'Authorization': `Bearer ${key}`
        }
    });
    console.log('select comments status:', res.status);
    const data = await res.json();
    console.log('select comments data:', data);
}

check();
