const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function checkUsers() {
  console.log('--- Checking users in Supabase ---');
  const res = await fetch(`${SUPABASE_URL}/rest/v1/users?select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  const users = await res.json();
  console.log(`Total users in DB: ${users.length}`);

  users.forEach((u, idx) => {
    const s = JSON.stringify(u);
    if (s.includes('희동') || s.includes('상사')) {
      console.log(`Matched user [${idx}]: id=${u.id}, name=${u.name}, role=${u.role}`);
      console.log(JSON.stringify(u, null, 2));
    }
  });

  // Also check items inside all users
  users.forEach(u => {
    if (u.items && Array.isArray(u.items)) {
      u.items.forEach(it => {
        const str = JSON.stringify(it);
        if (str.includes('희동') || str.includes('상사')) {
          console.log(`Matched item inside user ${u.id}:`, JSON.stringify(it, null, 2));
        }
      });
    }
  });
}

checkUsers().catch(console.error);
