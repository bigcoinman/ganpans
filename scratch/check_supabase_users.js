const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function check() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,name,phone,email,address,role`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const data = await res.json();
  console.log('Status:', res.status);
  console.log('Users in Supabase (' + (Array.isArray(data) ? data.length : 0) + ' rows):\n', JSON.stringify(data, null, 2));
}

check().catch(console.error);
