const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function main() {
  const resApps = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const apps = await resApps.json();

  console.log('=== APPLICATION FOR 동희네 반찬가게 ===');
  const dongheeApp = apps.find(a => JSON.stringify(a).includes('동희네'));
  if (dongheeApp) {
    console.log(JSON.stringify(dongheeApp, null, 2));
  } else {
    console.log('NO APP FOUND WITH 동희네 in applications table!');
  }

  const resUsers = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.robinhood`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const robinUsers = await resUsers.json();
  console.log('\n=== ROBINHOOD USER ===');
  console.log(JSON.stringify(robinUsers[0], null, 2));
}

main().catch(err => console.error(err));
