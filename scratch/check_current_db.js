const supabaseUrl = "https://bscgxtolcqyvrqtshtbc.supabase.co";
const supabaseKey = "sb_publishable_ZP1DPYvqNYsDY4WLrq2xww_-0i7FwtC";

async function check() {
  const headers = {
    'apikey': supabaseKey,
    'Authorization': `Bearer ${supabaseKey}`
  };

  const appRes = await fetch(`${supabaseUrl}/rest/v1/applications?select=id,store_name,owner_name,referrer_code,memo,status,user_id`, { headers });
  const apps = await appRes.json();
  console.log('Total applications in Supabase:', apps.length);
  apps.forEach(d => {
    let memo = {};
    try { memo = typeof d.memo === 'string' ? JSON.parse(d.memo) : (d.memo || {}); } catch(e) {}
    console.log(`- ID: ${d.id} | Store: ${d.store_name} | Owner: ${d.owner_name} | Ref: ${d.referrer_code} | SalesId: ${memo.salespersonId || '-'} | SalesName: ${memo.salespersonName || '-'} | isBizItem: ${memo.isBizItem}`);
  });

  const userRes = await fetch(`${supabaseUrl}/rest/v1/users?select=id,name,role,biz_code`, { headers });
  const users = await userRes.json();
  console.log('\nTotal users in Supabase:', users ? users.length : 0);
  if (users && Array.isArray(users)) {
    users.filter(u => u.role === 'business' || u.biz_code).forEach(u => {
      console.log(`- Biz User: ${u.id} (${u.name}) | BizCode: ${u.biz_code} | Role: ${u.role}`);
    });
  }
}

check();
