const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function inspectSupabase() {
  console.log('Fetching applications from Supabase...');
  const resApps = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=id,user_id,owner_name,store_name,referrer_code,status,memo,applied_at&order=applied_at.desc&limit=15`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const apps = await resApps.json();
  console.log('\n=== Recent 15 Applications in Supabase ===');
  apps.forEach(a => {
    console.log(`ID: ${a.id} | Store: ${a.store_name} | Owner: ${a.owner_name} | Ref: ${a.referrer_code} | Memo: ${a.memo}`);
  });

  console.log('\nFetching business users from Supabase...');
  const resUsers = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,name,role,biz_code,phone,items&role=eq.business`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    }
  });
  const users = await resUsers.json();
  console.log('\n=== Business Users in Supabase ===');
  users.forEach(u => {
    console.log(`ID: ${u.id} | Name: ${u.name} | BizCode: ${u.biz_code} | ItemsCount: ${u.items ? u.items.length : 0}`);
    if (u.items && u.items.length > 0) {
      u.items.forEach(it => console.log(`   -> Item: id=${it.id}, name=${it.name}, receipt=${it.receiptStatus}, progress=${it.progressStatus}`));
    }
  });
}

inspectSupabase().catch(err => console.error(err));
