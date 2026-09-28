const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function main() {
  console.log('=== Cleaning up residual items in Supabase users table ===');
  
  // 1. Fetch apps (select only valid columns in applications table)
  const resApps = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=id,referrer_code,memo`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  const apps = await resApps.json();
  if (!Array.isArray(apps)) {
    console.error('Apps query failed:', apps);
    return;
  }
  console.log(`Fetched ${apps.length} applications.`);

  // 2. Fetch users
  const resUsers = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,name,role,biz_code,items`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  const users = await resUsers.json();
  if (!Array.isArray(users)) {
    console.error('Users query failed:', users);
    return;
  }
  console.log(`Fetched ${users.length} users.`);

  for (const u of users) {
    if (u.items && Array.isArray(u.items) && u.items.length > 0) {
      const origLen = u.items.length;
      const uBiz = String(u.biz_code || '').trim().toLowerCase();
      const uId = String(u.id || '').trim().toLowerCase();
      const uName = String(u.name || '').trim().toLowerCase();

      const newItems = u.items.filter(it => {
        const matched = apps.find(a => String(a.id) === String(it.id) || String(a.id) === String(it.appRefId));
        if (!matched) {
          console.log(`[REMOVED NOT FOUND] Item ${it.id} (${it.name}) from user ${u.name} (${u.id})`);
          return false;
        }

        let memoObj = {};
        try { memoObj = typeof matched.memo === 'string' ? JSON.parse(matched.memo) : (matched.memo || {}); } catch(e) {}

        const sId = String(memoObj.salespersonId || '').trim().toLowerCase();
        const rCode = String(matched.referrer_code || memoObj.referrerCode || '').trim().toLowerCase();
        const sName = String(memoObj.salespersonName || '').trim();

        // 본사직접접수이면 영업자 items에서 완전 제거
        const isHQ = (!sId && !rCode) || (sName === '본사직접접수' || sName === '본사 직접 접수');
        if (isHQ && !rCode) {
          console.log(`[REMOVED HQ] Item ${it.id} (${it.name}) from user ${u.name} (${u.id})`);
          return false;
        }

        // 다른 영업자에게 배정되었으면 제거
        const isOther = Boolean(
          (sId && sId !== uId && sId !== uBiz) ||
          (rCode && rCode !== uBiz && rCode !== uId && rCode !== uName)
        );
        if (isOther) {
          console.log(`[REMOVED OTHER] Item ${it.id} (${it.name}) from user ${u.name} (${u.id})`);
          return false;
        }

        return true;
      });

      if (newItems.length !== origLen) {
        console.log(`Updating user [${u.id}] (${u.name}): items count ${origLen} ➔ ${newItems.length}`);
        const updateRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${u.id}`, {
          method: 'PATCH',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({ items: newItems })
        });
        console.log(`Update user [${u.id}] status:`, updateRes.status);
      }
    }
  }

  console.log('=== Residual cleanup completed ===');
}

main().catch(err => console.error(err));
