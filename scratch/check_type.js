const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function main() {
  const resApps = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=id,referrer_code`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  const data = await resApps.json();
  console.log('Type of data:', typeof data, Array.isArray(data));
}

main().catch(err => console.error(err));
