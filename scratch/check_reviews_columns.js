const fs = require('fs');

const cfg = fs.readFileSync('supabase-config.js', 'utf8');
const url = cfg.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/)[1];
const key = cfg.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/)[1];

async function check() {
    // Try sending various column names to see which error with 'column does not exist'
    const candidateColumns = [
        'comments',
        'replies',
        'memo',
        'is_deleted',
        'deleted_at',
        'parent_id',
        'review_id',
        'type'
    ];

    for (const col of candidateColumns) {
        const res = await fetch(`${url}/rest/v1/reviews?select=${col}&limit=1`, {
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
        });
        const json = await res.json();
        console.log(`Column [${col}]: status ${res.status}`, json.message ? json.message : 'EXISTS!');
    }
}

check();
