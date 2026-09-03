const url = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const key = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

async function checkInqCols() {
  // Let's insert minimal to see what columns exist
  const res = await fetch(`${url}/rest/v1/inquiries`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      id: 'test_cols_' + Date.now(),
      name: '홍길동',
      phone: '010-1234-5678'
    })
  });
  console.log('Insert Minimal Status:', res.status);
  const data = await res.json();
  console.log('Returned row cols:', data);

  if (data[0] && data[0].id) {
    await fetch(`${url}/rest/v1/inquiries?id=eq.${data[0].id}`, {
      method: 'DELETE',
      headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
    });
    console.log('Cleaned up test row.');
  }
}

checkInqCols();
