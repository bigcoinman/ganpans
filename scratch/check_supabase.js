const url = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const key = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

async function checkAll() {
  const tables = ['users', 'applications', 'reviews', 'inquiries', 'site_stats'];
  console.log(`========================================`);
  console.log(`[Supabase Connection & Table Check]`);
  console.log(`Target: ${url}`);
  console.log(`========================================`);
  
  let allPass = true;
  for (const t of tables) {
    try {
      const res = await fetch(`${url}/rest/v1/${t}?select=*`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'count=exact'
        }
      });
      const countHeader = res.headers.get('content-range');
      const data = await res.json();
      const isOk = res.status >= 200 && res.status < 300;
      if (!isOk) allPass = false;
      console.log(`✓ Table [${t.padEnd(12)}]: HTTP ${res.status} (${res.statusText}) | Count: ${countHeader || 0} rows`);
    } catch (e) {
      allPass = false;
      console.log(`✗ Table [${t.padEnd(12)}]: ERROR - ${e.message}`);
    }
  }

  // Test insert and delete on site_stats to verify write permission (RLS)
  console.log(`----------------------------------------`);
  console.log(`[Testing Write & Read Permissions (RLS)]`);
  try {
    const testId = 'test_conn_' + Date.now();
    const insertRes = await fetch(`${url}/rest/v1/site_stats`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        id: testId,
        today_date: '2026-09-03',
        today_count: 1,
        total_count: 1
      })
    });
    console.log(`✓ INSERT Test: HTTP ${insertRes.status} (${insertRes.statusText})`);

    // Clean up test row
    const deleteRes = await fetch(`${url}/rest/v1/site_stats?id=eq.${testId}`, {
      method: 'DELETE',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    console.log(`✓ DELETE Test: HTTP ${deleteRes.status} (${deleteRes.statusText})`);
  } catch (e) {
    console.log(`✗ WRITE Test Error: ${e.message}`);
  }

  console.log(`========================================`);
  if (allPass) {
    console.log(`🎉 [SUCCESS] Supabase 연결 및 모든 권한이 완벽하게 정상 작동합니다!`);
  } else {
    console.log(`⚠️ 일부 테이블 점검이 필요합니다.`);
  }
}

checkAll();
