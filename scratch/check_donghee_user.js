const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function main() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.B-260901-001`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const data = await res.json();
  const app = data[0];
  console.log('App user_id:', app.user_id);
  console.log('App owner_name:', app.owner_name);
  console.log('App owner_phone:', app.owner_phone);
  console.log('App registered_by:', app.registered_by);
}

main().catch(err => console.error(err));
