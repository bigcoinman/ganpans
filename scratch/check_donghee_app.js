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
  console.log('B-260901-001 in applications table:');
  console.log(JSON.stringify(data[0], null, 2));
}

main().catch(err => console.error(err));
