const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

async function cleanResidue() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/applications?select=id,store_name,assigned_constructor_id,memo', {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
    }
  });
  const data = await res.json();
  let cleanedCount = 0;
  for (const app of data) {
    if (!app.assigned_constructor_id) {
      let memoObj = {};
      try { memoObj = typeof app.memo === 'string' ? JSON.parse(app.memo) : (app.memo || {}); } catch(e) {}
      if (memoObj.signDraftPhotos && memoObj.signDraftPhotos.length > 0) {
        console.log('Cleaning residue for:', app.id, app.store_name);
        delete memoObj.signDraftPhotos;
        delete memoObj.draftStatus;
        delete memoObj.draftApprovedAt;
        const newMemo = JSON.stringify(memoObj);
        const patchRes = await fetch(SUPABASE_URL + '/rest/v1/applications?id=eq.' + encodeURIComponent(app.id), {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
          },
          body: JSON.stringify({ memo: newMemo })
        });
        console.log('Cleaned status:', patchRes.status);
        cleanedCount++;
      }
    }
  }
  console.log(`Finished. Cleaned ${cleanedCount} records.`);
}
cleanResidue();
