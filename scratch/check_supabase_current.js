// scratch/check_supabase_current.js
const https = require('https');

const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

function fetchTable(tableName) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${tableName}?select=*`);
    const options = {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== USERS ===');
  const users = await fetchTable('users');
  console.log(Array.isArray(users) ? users.map(u => ({ id: u.id, name: u.name, phone: u.phone, email: u.email, role: u.role })) : users);

  console.log('\n=== APPLICATIONS ===');
  const apps = await fetchTable('applications');
  console.log(Array.isArray(apps) ? apps.map(a => ({ id: a.id, user_id: a.user_id, owner_name: a.owner_name, phone: a.phone, store_name: a.store_name })) : apps);
}

run();
