const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

async function check() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/applications?select=id,store_name,owner_name,status,memo,applied_at&order=applied_at.desc&limit=100', {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
  });
  const data = await res.json();
  console.log('Total applications in Supabase:', data.length);
  const targets = ['진수건어물', '성기네', '홍미용실', '기수정육점', '진수건업'];
  data.forEach((a, idx) => {
    const isTarget = targets.some(t => (a.store_name && a.store_name.includes(t)) || (a.owner_name && a.owner_name.includes(t)));
    const mark = isTarget ? ' >>> [TARGET]' : '';
    console.log(`${idx+1}. ID: ${a.id} | Store: ${a.store_name} | Owner: ${a.owner_name} | Status: ${a.status} | Memo: ${a.memo ? a.memo.substring(0, 30) : ''}${mark}`);
  });
}
check().catch(console.error);
