const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function patchStatus() {
  const appId = "B-260901-004";
  const memoObj = {
    isBizItem: true,
    receiptStatus: "접수완료",
    progressStatus: "대상자선정",
    salespersonId: "robinhood",
    salespersonName: "김로빈",
    referrerCode: "B-260901",
    photoCount: 0
  };

  const payload = {
    referrer_code: "B-260901",
    status: "approved",
    memo: JSON.stringify(memoObj)
  };

  console.log(`Patching ${appId} in Supabase applications table...`);
  const res = await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.${appId}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const txt = await res.text();
    console.error('PATCH failed:', res.status, txt);
    return;
  }

  const data = await res.json();
  console.log('PATCH success! Updated application:', data);
}

patchStatus().catch(err => console.error(err));
