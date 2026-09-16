const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

async function updateRobinItems() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/users?id=eq.robinhood&select=id,name,items', {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
  });
  const data = await res.json();
  let items = (data && data[0] && data[0].items) || [];
  
  const newItem = {
    id: 'B-260901-004',
    name: '만서기상회',
    phone: '01053427845',
    address: '서울특별시 마포구 백범로 31길 21',
    appRefId: 'B-260901-004',
    receiptStatus: '접수예정',
    progressStatus: '지원대기중',
    status: 'pending',
    registeredAt: '2026-09-10T10:37:56.395+00:00'
  };
  
  items = items.filter(it => it.id !== 'B-260901-004' && it.appRefId !== 'B-260901-004');
  items.unshift(newItem);
  
  const patchRes = await fetch(SUPABASE_URL + '/rest/v1/users?id=eq.robinhood', {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': 'Bearer ' + SUPABASE_ANON_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ items: items })
  });
  console.log('Robinhood items patched, status:', patchRes.status);
}

updateRobinItems().catch(err => console.error(err));
