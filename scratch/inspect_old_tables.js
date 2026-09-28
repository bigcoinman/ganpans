const OLD_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const OLD_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

async function inspectOldDb() {
  console.log('=== Checking Old Supabase DB ===');
  const candidateTables = ['users', 'applications', 'consults', 'popups', 'inquiries', 'system_logs', 'site_stats', 'announcements'];
  for (const table of candidateTables) {
    try {
      const res = await fetch(`${OLD_URL}/rest/v1/${table}?select=*&limit=1`, {
        headers: {
          'apikey': OLD_KEY,
          'Authorization': `Bearer ${OLD_KEY}`
        }
      });
      const body = await res.text();
      console.log(`[${table}] status: ${res.status} ${res.statusText}`);
      if (res.status === 200) {
        console.log(`   sample: ${body.slice(0, 200)}`);
      }
    } catch (e) {
      console.error(`[${table}] Error:`, e.message);
    }
  }
}

inspectOldDb();
