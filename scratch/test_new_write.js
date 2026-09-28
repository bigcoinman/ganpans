const OLD_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const OLD_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

const NEW_URL = 'https://bscgxtolcqyvrqtshtbc.supabase.co';
const NEW_KEY = 'sb_publishable_ZP1DPYvqNYsDY4WLrq2xww_-0i7FwtC';

async function testWriteAndCompare() {
  console.log('=== Checking Column Differences and Write Permission ===');
  
  // 1. Fetch sample from OLD
  const oldUsersRes = await fetch(`${OLD_URL}/rest/v1/users?limit=1`, {
    headers: { apikey: OLD_KEY, Authorization: `Bearer ${OLD_KEY}` }
  });
  const oldUsers = await oldUsersRes.json();
  const oldUserCols = oldUsers.length > 0 ? Object.keys(oldUsers[0]) : [];
  console.log('OLD users cols:', oldUserCols);

  const oldAppsRes = await fetch(`${OLD_URL}/rest/v1/applications?limit=1`, {
    headers: { apikey: OLD_KEY, Authorization: `Bearer ${OLD_KEY}` }
  });
  const oldApps = await oldAppsRes.json();
  const oldAppCols = oldApps.length > 0 ? Object.keys(oldApps[0]) : [];
  console.log('OLD apps cols:', oldAppCols);

  // 2. Test INSERT on NEW users (test row)
  const testUser = {
    id: 'test_migration_ping',
    name: '테스트',
    phone: '01000000000',
    role: 'user'
  };
  const insertUserRes = await fetch(`${NEW_URL}/rest/v1/users`, {
    method: 'POST',
    headers: {
      apikey: NEW_KEY,
      Authorization: `Bearer ${NEW_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(testUser)
  });
  console.log('NEW users test insert status:', insertUserRes.status);
  const insertUserBody = await insertUserRes.text();
  console.log('NEW users test insert response:', insertUserBody);

  // If success, clean up test row
  if (insertUserRes.status === 201) {
    await fetch(`${NEW_URL}/rest/v1/users?id=eq.test_migration_ping`, {
      method: 'DELETE',
      headers: { apikey: NEW_KEY, Authorization: `Bearer ${NEW_KEY}` }
    });
    console.log('NEW users test row cleaned up.');
  }

  // 3. Test INSERT on NEW applications (test row)
  const testApp = {
    id: 'TEST-APP-001',
    owner_name: '테스트점주',
    phone: '01000000000'
  };
  const insertAppRes = await fetch(`${NEW_URL}/rest/v1/applications`, {
    method: 'POST',
    headers: {
      apikey: NEW_KEY,
      Authorization: `Bearer ${NEW_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(testApp)
  });
  console.log('NEW apps test insert status:', insertAppRes.status);
  const insertAppBody = await insertAppRes.text();
  console.log('NEW apps test insert response:', insertAppBody);

  if (insertAppRes.status === 201) {
    await fetch(`${NEW_URL}/rest/v1/applications?id=eq.TEST-APP-001`, {
      method: 'DELETE',
      headers: { apikey: NEW_KEY, Authorization: `Bearer ${NEW_KEY}` }
    });
    console.log('NEW apps test row cleaned up.');
  }
}

testWriteAndCompare();
