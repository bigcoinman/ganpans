const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function main() {
  console.log('=== 1. Checking applications table via REST API ===');
  const resApps = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=*`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  const apps = await resApps.json();
  console.log(`Total apps in Supabase: ${apps.length}`);
  apps.forEach(a => {
    console.log(`[APP] ID: ${a.id}, Store: ${a.store_name || a.shop_name}, Owner: ${a.owner_name}, Phone: ${a.owner_phone}, RefCode: "${a.referrer_code}", SalesId: "${a.salesperson_id}", SalesName: "${a.salesperson_name}", UserID: "${a.user_id}"`);
    if (a.memo) {
      console.log(`   Memo: ${a.memo}`);
    }
  });

  console.log('\n=== 2. Checking users table via REST API ===');
  const resUsers = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,name,role,biz_code,phone,items`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });

  const users = await resUsers.json();
  console.log(`Total users in Supabase: ${users.length}`);
  users.forEach(u => {
    console.log(`[USER] ID: ${u.id}, Name: ${u.name}, Role: ${u.role}, BizCode: ${u.biz_code}, Phone: ${u.phone}`);
    if (u.items) {
      console.log(`   Items: ${JSON.stringify(u.items)}`);
    }
  });
}

main().catch(err => console.error(err));
