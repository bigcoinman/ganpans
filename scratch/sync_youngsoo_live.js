// sync_youngsoo_live.js
const fs = require('fs');

const configCode = fs.readFileSync('./supabase-config.js', 'utf8');
const window = {};
eval(configCode);

const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_KEY = window.SUPABASE_ANON_KEY;

async function fetchSupabase(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
      ...(options.headers || {})
    }
  });
  return res.json();
}

async function fix() {
  console.log('=== [1] Supabase applications 영수철물 건 상태 업데이트 ===');
  const appUpdateRes = await fetchSupabase('applications?id=eq.B-260901-002', {
    method: 'PATCH',
    body: JSON.stringify({
      status: 'approved',
      construction_status: 'before_construction',
      memo: JSON.stringify({ isBizItem: true, receiptStatus: '접수완료', progressStatus: '대상자선정', photoCount: 2 })
    })
  });
  console.log('applications 갱신 결과:', appUpdateRes);

  console.log('\n=== [2] Supabase users 영수철물 items 상태 업데이트 ===');
  const users = await fetchSupabase('users?select=id,name,items');
  for (const u of users) {
    if (u.items && Array.isArray(u.items)) {
      let modified = false;
      const updatedItems = u.items.map(it => {
        if (it.id === 'B-260901-002' || (it.name && it.name.includes('영수'))) {
          modified = true;
          return { ...it, receiptStatus: '접수완료', progressStatus: '대상자선정' };
        }
        return it;
      });
      if (modified) {
        const uUpdateRes = await fetchSupabase(`users?id=eq.${u.id}`, {
          method: 'PATCH',
          body: JSON.stringify({ items: updatedItems })
        });
        console.log(`유저 [${u.name}(${u.id})] items 갱신 결과:`, uUpdateRes);
      }
    }
  }

  console.log('\n🎉 [완료] Supabase 클라우드 DB의 영수철물 건이 [접수: 접수완료, 진행: 대상자선정] 으로 완벽히 갱신되었습니다!');
}

fix();
