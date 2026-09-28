const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function main() {
  const resApps = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=id,store_name,owner_name`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const apps = await resApps.json();
  console.log('Response:', JSON.stringify(apps, null, 2));
}

main().catch(err => console.error(err));
