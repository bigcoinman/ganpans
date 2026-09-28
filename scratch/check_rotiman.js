const supabaseUrl = "https://bscgxtolcqyvrqtshtbc.supabase.co";
const supabaseKey = "sb_publishable_ZP1DPYvqNYsDY4WLrq2xww_-0i7FwtC";

async function check() {
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };
  const res = await fetch(`${supabaseUrl}/rest/v1/users?id=eq.rotiman26&select=id,name,role,biz_code,items`, { headers });
  const data = await res.json();
  console.log('rotiman26 items count:', data[0].items ? data[0].items.length : 0);
  console.log('rotiman26 items:', JSON.stringify(data[0].items, null, 2));
}

check();
