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

  console.log('=== APPS MATCHING 동희 or 반찬 or 김로빈 ===');
  apps.forEach(a => {
    const str = JSON.stringify(a);
    if (str.includes('동희') || str.includes('반찬') || str.includes('김로빈') || str.includes('robin')) {
      console.log(JSON.stringify(a, null, 2));
    }
  });

  const resUsers = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const users = await resUsers.json();
  console.log('\n=== USERS MATCHING 동희 or 반찬 or 김로빈 ===');
  users.forEach(u => {
    const str = JSON.stringify(u);
    if (str.includes('동희') || str.includes('반찬') || str.includes('김로빈') || str.includes('robin')) {
      console.log(JSON.stringify(u, null, 2));
    }
  });
}

main().catch(err => console.error(err));
