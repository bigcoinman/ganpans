const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function main() {
  const resUsers = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.robinhood`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const users = await resUsers.json();
  const robin = users[0];
  console.log('Robin items count:', robin.items ? robin.items.length : 0);
  robin.items.forEach(it => console.log(` - ID: ${it.id}, Name: ${it.name}`));
}

main().catch(err => console.error(err));
