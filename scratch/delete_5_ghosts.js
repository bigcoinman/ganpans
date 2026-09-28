const key = 'sb_publishable_ZP1DPYvqNYsDY4WLrq2xww_-0i7FwtC';
const base = 'https://bscgxtolcqyvrqtshtbc.supabase.co/rest/v1';

const targetIds = ['B-260905-003', 'P-260919-001', 'B-260905-002', 'B-260905-001', 'P-260905-002'];

async function run() {
  for (const id of targetIds) {
    const url = base + '/applications?id=eq.' + encodeURIComponent(id);
    const res = await fetch(url, {
      method: 'DELETE',
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Prefer': 'return=representation'
      }
    });
    const d = await res.json();
    console.log('Deleted app ' + id + ':', res.status, d);

    try {
      await fetch(base + '/business_items?id=eq.' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: {
          'apikey': key,
          'Authorization': 'Bearer ' + key
        }
      });
    } catch(e) {}
  }

  // users.items 에서 정리
  try {
    const uRes = await fetch(base + '/users?select=id,items', {
      headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key
      }
    });
    const users = await uRes.json();
    for (const u of users) {
      if (u.items && Array.isArray(u.items)) {
        const filtered = u.items.filter(it => !targetIds.includes(it.id) && !targetIds.includes(it.appRefId));
        if (filtered.length !== u.items.length) {
          console.log('Cleaned items for user ' + u.id);
          await fetch(base + '/users?id=eq.' + encodeURIComponent(u.id), {
            method: 'PATCH',
            headers: {
              'apikey': key,
              'Authorization': 'Bearer ' + key,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ items: filtered })
          });
        }
      }
    }
  } catch(eUsers) {
    console.warn('users cleanup warning:', eUsers);
  }

  // 남은 건 확인
  const verifyRes = await fetch(base + '/applications?select=id,store_name,owner_name,referrer_code,status', {
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key
    }
  });
  const remaining = await verifyRes.json();
  console.log('\n=== Supabase 남은 정상 신청서 (' + remaining.length + '건) ===');
  remaining.forEach((r, i) => console.log((i + 1) + '. [' + r.id + '] ' + r.store_name + ' (' + r.owner_name + ')'));
}

run();
