const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function main() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=id,store_name,owner_name,user_id,referrer_code`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const text = await res.text();
  const apps = JSON.parse(text);
  console.log('=== ALL APPLICATIONS: user_id vs referrer_code ===');
  apps.forEach(a => {
    console.log(`[${a.id}] ${a.store_name} (대표: ${a.owner_name}) ➔ user_id: "${a.user_id}", ref: "${a.referrer_code}"`);
  });
}

main().catch(err => console.error(err));
