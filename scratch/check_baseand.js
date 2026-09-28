const supabaseUrl = "https://bscgxtolcqyvrqtshtbc.supabase.co";
const supabaseKey = "sb_publishable_ZP1DPYvqNYsDY4WLrq2xww_-0i7FwtC";

async function check() {
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };
  const res = await fetch(`${supabaseUrl}/rest/v1/applications?id=eq.P-260919-002`, { headers });
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

check();
