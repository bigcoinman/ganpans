const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

async function main() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/applications?select=*&order=applied_at.desc&limit=100', {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
  });
  const data = await res.json();
  data.forEach((app, idx) => {
    console.log(`\n--- App #${idx + 1} ---`);
    console.log(`ID: ${app.id}`);
    console.log(`user_id: ${app.user_id}`);
    console.log(`owner_name: ${app.owner_name}`);
    console.log(`phone: ${app.phone}`);
    console.log(`store_name: ${app.store_name}`);
    console.log(`store_address: ${app.store_address}`);
    console.log(`sign_type: ${app.sign_type}`);
    console.log(`referrer_code: ${app.referrer_code}`);
    console.log(`status: ${app.status}`);
    console.log(`assigned_constructor_id: ${app.assigned_constructor_id}`);
    console.log(`assigned_constructor_name: ${app.assigned_constructor_name}`);
    console.log(`applied_at: ${app.applied_at}`);
    console.log(`created_at: ${app.created_at}`);
    console.log(`memo: ${app.memo}`);
  });
}
main().catch(console.error);
