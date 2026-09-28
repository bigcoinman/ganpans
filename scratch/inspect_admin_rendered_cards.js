const fs = require('fs');

// Fetch Supabase applications
const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

async function test() {
  const res = await fetch(SUPABASE_URL + '/rest/v1/applications?select=*&order=applied_at.desc&limit=100', {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
  });
  const data = await res.json();
  
  const resUsers = await fetch(SUPABASE_URL + '/rest/v1/users?select=*', {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': 'Bearer ' + SUPABASE_ANON_KEY }
  });
  const users = await resUsers.json();

  console.log('=== CURRENT APPLICATIONS AS RENDERED IN ADMIN LIST ===');
  data.forEach((app, i) => {
    // Determine bizUserName exactly as in app.js lines 3086-3109
    let bizUserName = '';
    let memoObj = {};
    try { memoObj = JSON.parse(app.memo || '{}'); } catch(e){}
    const salespersonName = memoObj.salespersonName || app.salesperson_name || '';
    const referrerCode = app.referrer_code || memoObj.referrerCode || '';

    if (salespersonName === '본사직접접수' || salespersonName === '본사 직접 접수' || (!referrerCode && !salespersonName)) {
      bizUserName = '';
    } else if (salespersonName) {
      bizUserName = salespersonName;
    } else if (referrerCode) {
      const matchedUser = users.find(u => 
        (u.biz_code && u.biz_code.toLowerCase() === referrerCode.toLowerCase()) ||
        (u.id && u.id.toLowerCase() === referrerCode.toLowerCase()) ||
        (u.name && u.name.toLowerCase() === referrerCode.toLowerCase())
      );
      bizUserName = matchedUser ? matchedUser.name : referrerCode;
    }

    const isBizItem = memoObj.isBizItem === true || String(memoObj.isBizItem) === 'true';

    console.log(`\n[Card #${i+1}]`);
    console.log(`  상호명: ${app.store_name || app.shop_name}`);
    console.log(`  신청일: ${app.applied_at ? app.applied_at.substring(0,10) : '-'}`);
    console.log(`  신청번호: ${app.id}`);
    console.log(`  대표자: ${app.owner_name} (${app.phone})`);
    console.log(`  주소: ${app.store_address}`);
    console.log(`  담당자: ${bizUserName ? bizUserName : '본사직접접수'}`);
    console.log(`  심사상태: ${app.status}`);
    console.log(`  영업물건버튼: ${isBizItem ? '영업물건 등록됨 (ON)' : '영업물건으로 변경 (OFF)'}`);
    console.log(`  사진: photoCount in memo = ${memoObj.photoCount || 0}`);
  });
}
test();
