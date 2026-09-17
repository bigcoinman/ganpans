const fs = require('fs');
const envFile = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = envFile.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = envFile.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const SUPABASE_URL = urlMatch[1];
const SUPABASE_KEY = keyMatch[1];

async function testMemo() {
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY, 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
  
  // Check memo on B-260901-003
  const getRes = await fetch(SUPABASE_URL + '/rest/v1/applications?select=id,memo&id=eq.B-260901-003', { headers });
  const row = (await getRes.json())[0];
  console.log('Current memo:', row.memo);
  
  const cleanMemo = {
    isBizItem: true,
    receiptStatus: '접수완료',
    progressStatus: '간판시공 준비중',
    salespersonId: 'robinhood',
    salespersonName: '김로빈',
    photoCount: 2,
    referrerCode: 'B-260901'
  };
  const updateRes = await fetch(SUPABASE_URL + '/rest/v1/applications?id=eq.B-260901-003', {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ memo: JSON.stringify(cleanMemo) })
  });
  console.log('Reverted memo status:', updateRes.status);
}
testMemo().catch(console.error);
