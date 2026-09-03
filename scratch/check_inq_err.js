const url = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const key = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

async function checkInq() {
  const inqRes = await fetch(`${url}/rest/v1/inquiries`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      id: 'test_err_' + Date.now(),
      name: '홍길동',
      phone: '010-1234-5678',
      region: '서울',
      category: 'LED',
      type: '신규',
      message: '문의',
      status: 'pending'
    })
  });
  console.log('Status:', inqRes.status);
  const text = await inqRes.text();
  console.log('Response body:', text);
}

checkInq();
