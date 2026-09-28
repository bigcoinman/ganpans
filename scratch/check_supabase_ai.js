const fs = require('fs');

const configContent = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = configContent.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = configContent.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);

const supabaseUrl = urlMatch[1];
const apiKey = keyMatch[1];

async function checkTable(table) {
    try {
        const res = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=1`, {
            headers: {
                'apikey': apiKey,
                'Authorization': `Bearer ${apiKey}`
            }
        });
        if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
                const cols = Object.keys(data[0]);
                const aiCols = cols.filter(c => c.toLowerCase().includes('ai'));
                console.log(`- Table [${table}]: Exists (${cols.length} cols), AI-related cols: [${aiCols.join(', ')}]`);
            } else {
                console.log(`- Table [${table}]: Exists (0 rows)`);
            }
        } else {
            console.log(`- Table [${table}]: Status ${res.status} (${res.statusText})`);
        }
    } catch (e) {
        console.log(`- Table [${table}]: Error ${e.message}`);
    }
}

async function run() {
    console.log('--- Checking Supabase Tables for AI columns or tables ---');
    const tables = ['applications', 'users', 'inquiries', 'inquiry_3sec', 'popups', 'site_settings', 'notices', 'reviews', 'ai_chat', 'ai_assistant', 'chat_logs'];
    for (const t of tables) {
        await checkTable(t);
    }
}
run();
