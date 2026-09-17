const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function testUpdate() {
  const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.admin`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      phone: '010-1234-5678'
    })
  });
  console.log('PATCH Status:', patchRes.status);
  const data = await patchRes.text();
  console.log('PATCH Response:', data);
}

testUpdate().catch(console.error);
