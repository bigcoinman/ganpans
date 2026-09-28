const fs = require('fs');

const cfg = fs.readFileSync('supabase-config.js', 'utf8');
const url = cfg.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)[1];
const key = cfg.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/)[1];

async function checkTables() {
    const candidateTables = [
        'users',
        'applications',
        'reviews',
        'review_comments',
        'comments',
        'quick_inquiries',
        'popups',
        'app_settings',
        'site_settings'
    ];

    for (const t of candidateTables) {
        const res = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        console.log(`Table [${t}]: status ${res.status}`);
    }
}

checkTables();
