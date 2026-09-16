const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function run() {
  const url = `${SUPABASE_URL}/rest/v1/applications?id=eq.P-260917-001&select=*`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await res.json();
  if (data && data.length > 0) {
    const row = data[0];
    let memo = {};
    try {
      memo = typeof row.memo === 'string' ? JSON.parse(row.memo) : (row.memo || {});
    } catch (e) {}

    let actualCount = 1;
    try {
      const parsed = JSON.parse(row.image_url);
      if (Array.isArray(parsed)) actualCount = parsed.length;
    } catch(e) {}

    memo.photoCount = actualCount;

    const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.P-260917-001`, {
      method: 'PATCH',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ memo: JSON.stringify(memo) })
    });
    const patched = await patchRes.json();
    console.log('Patched P-260917-001 memo:', patched[0]?.memo);
  }
}

run();
