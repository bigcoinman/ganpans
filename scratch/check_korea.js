const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

async function run() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.B-260902-001`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  const data = await res.json();
  console.log('Record B-260902-001 in DB:', JSON.stringify(data, null, 2));

  const res2 = await fetch(`${SUPABASE_URL}/rest/v1/applications?or=(store_name.ilike.*한국*,owner_name.ilike.*한국*)`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  const data2 = await res2.json();
  console.log('Matching 한국 records:', data2.map(d => ({ id: d.id, store_name: d.store_name, status: d.status, memo: d.memo })));
}
run();
