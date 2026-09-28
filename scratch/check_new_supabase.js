const OLD_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const OLD_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

const NEW_URL = 'https://bscgxtolcqyvrqtshtbc.supabase.co';
const NEW_KEY = 'sb_publishable_ZP1DPYvqNYsDY4WLrq2xww_-0i7FwtC';

async function checkNewDb() {
  console.log('=== Checking New Supabase DB ===');
  const tables = ['users', 'applications', 'consults', 'popups', 'system_logs'];
  for (const table of tables) {
    try {
      const res = await fetch(`${NEW_URL}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'apikey': NEW_KEY,
          'Authorization': `Bearer ${NEW_KEY}`
        }
      });
      const body = await res.text();
      console.log(`[${table}] status: ${res.status} ${res.statusText}`);
      console.log(`   body: ${body.slice(0, 150)}`);
    } catch (e) {
      console.error(`[${table}] Error:`, e.message);
    }
  }
}

checkNewDb();
