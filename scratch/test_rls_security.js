const url = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const key = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

async function testRLSSecurity() {
  console.log('====================================================');
  console.log('🔍 [Supabase RLS & 데이터 보안 전수 점검 테스트]');
  console.log(`URL: ${url}`);
  console.log(`Key Type: anon / publishable public key (로그아웃/외부자 상태)`);
  console.log('====================================================\n');

  const tables = ['users', 'applications', 'reviews', 'inquiries', 'site_stats', 'business_items'];
  const results = {};

  for (const table of tables) {
    console.log(`----------------------------------------------------`);
    console.log(`[테이블: public.${table}] 점검 중...`);

    // 1. SELECT (조회) 테스트
    let selectStatus = 'UNKNOWN';
    let rowCount = 0;
    let sampleCols = [];
    let leakDetails = '';
    try {
      const res = await fetch(`${url}/rest/v1/${table}?select=*&limit=5`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`
        }
      });
      selectStatus = `HTTP ${res.status}`;
      if (res.ok) {
        const data = await res.json();
        rowCount = data.length;
        if (data.length > 0) {
          sampleCols = Object.keys(data[0]);
          // 민감 정보 컬럼 노출 여부 체크
          const sensitiveFields = ['password_hash', 'phone', 'address', 'email', 'items', 'store_address', 'message'];
          const foundSensitive = sensitiveFields.filter(f => sampleCols.includes(f));
          leakDetails = `데이터 노출 위험! (조회된 행: ${data.length}개, 포함 컬럼: [${foundSensitive.join(', ')}])`;
        } else {
          leakDetails = '테이블 비어있음 (조회는 허용됨)';
        }
      } else {
        const err = await res.text();
        leakDetails = `조회 차단됨 (${err})`;
      }
    } catch (e) {
      selectStatus = 'ERR';
      leakDetails = e.message;
    }

    // 2. INSERT (임의 삽입) 테스트
    let insertStatus = 'UNKNOWN';
    let insertAllowed = false;
    const dummyId = `sec_test_${Date.now()}`;
    try {
      let bodyData = {};
      if (table === 'site_stats') bodyData = { id: dummyId, today_date: '2026-09-03', today_count: 0, total_count: 0 };
      else if (table === 'users') bodyData = { id: dummyId, name: 'Hacker', phone: '010-0000-0000' };
      else if (table === 'applications') bodyData = { id: dummyId, owner_name: 'Hacker', phone: '010-0000-0000', store_name: 'Test', store_address: 'Test', sign_type: 'Test' };
      else if (table === 'inquiries') bodyData = { id: dummyId, name: 'Hacker', phone: '010-0000-0000' };
      else if (table === 'reviews') bodyData = { author_name: 'Hacker', shop_name: 'Test', content: 'Test' };
      else bodyData = { id: dummyId };

      const res = await fetch(`${url}/rest/v1/${table}`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        },
        body: JSON.stringify(bodyData)
      });
      insertStatus = `HTTP ${res.status}`;
      if (res.ok) {
        insertAllowed = true;
        // 생성된 테스트 데이터 즉시 삭제
        if (table === 'reviews') {
          const created = await res.json();
          if (created[0] && created[0].id) {
            await fetch(`${url}/rest/v1/${table}?id=eq.${created[0].id}`, {
              method: 'DELETE',
              headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
            });
          }
        } else {
          await fetch(`${url}/rest/v1/${table}?id=eq.${dummyId}`, {
            method: 'DELETE',
            headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
          });
        }
      }
    } catch (e) {
      insertStatus = `ERR: ${e.message}`;
    }

    console.log(`  - SELECT 조회 상태 : ${selectStatus} -> ${leakDetails}`);
    console.log(`  - INSERT 쓰기 상태 : ${insertStatus} -> ${insertAllowed ? '⚠️ 임의 쓰기 허용됨 (공개 상태)' : '안전 또는 거부됨'}`);

    results[table] = { selectStatus, rowCount, leakDetails, insertAllowed };
  }

  console.log('\n====================================================');
  console.log('📊 [보안 상태 종합 진단 요약]');
  console.log('====================================================');
  for (const [t, r] of Object.entries(results)) {
    console.log(`• ${t.padEnd(14)} : SELECT=${r.selectStatus} | INSERT=${r.insertAllowed ? 'ALLOWED' : 'DENIED'} | ${r.leakDetails}`);
  }
}

testRLSSecurity();
