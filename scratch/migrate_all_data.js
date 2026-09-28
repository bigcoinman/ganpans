const OLD_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const OLD_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

const NEW_URL = 'https://bscgxtolcqyvrqtshtbc.supabase.co';
const NEW_KEY = 'sb_publishable_ZP1DPYvqNYsDY4WLrq2xww_-0i7FwtC';

async function runMigration() {
  console.log('==================================================');
  console.log('🚀 간판지원단 Supabase DB 전수 마이그레이션 시작');
  console.log(`- 구 DB: ${OLD_URL}`);
  console.log(`- 신 DB: ${NEW_URL}`);
  console.log('==================================================\n');

  const tables = ['users', 'applications', 'inquiries', 'site_stats'];

  for (const table of tables) {
    console.log(`[1/2] ${table} 테이블 데이터 추출 중...`);
    try {
      const getRes = await fetch(`${OLD_URL}/rest/v1/${table}?select=*`, {
        headers: {
          apikey: OLD_KEY,
          Authorization: `Bearer ${OLD_KEY}`
        }
      });
      if (!getRes.ok) {
        console.error(`❌ ${table} 조회 실패: ${getRes.status} ${getRes.statusText}`);
        continue;
      }
      const rows = await getRes.json();
      console.log(` -> 총 ${rows.length}건 데이터 추출 완료.`);

      if (rows.length === 0) {
        console.log(` -> 이전할 데이터가 없어 ${table} 건너뜀.\n`);
        continue;
      }

      console.log(`[2/2] ${table} 테이블 신규 DB로 입력(UPSERT) 중...`);
      // Batch insert in chunks of 50
      const CHUNK_SIZE = 50;
      let insertedCount = 0;
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        const postRes = await fetch(`${NEW_URL}/rest/v1/${table}`, {
          method: 'POST',
          headers: {
            apikey: NEW_KEY,
            Authorization: `Bearer ${NEW_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'resolution=merge-duplicates'
          },
          body: JSON.stringify(chunk)
        });

        if (!postRes.ok) {
          const errText = await postRes.text();
          console.error(`❌ ${table} chunk (${i}~${i + chunk.length}) 입력 실패:`, postRes.status, errText);
        } else {
          insertedCount += chunk.length;
          console.log(` -> ${insertedCount} / ${rows.length} 건 이전 완료`);
        }
      }
      console.log(`✅ ${table} 테이블 이전 완료! (${insertedCount}건)\n`);
    } catch (err) {
      console.error(`❌ ${table} 처리 중 예외 발생:`, err.message);
    }
  }

  console.log('==================================================');
  console.log('🎉 마이그레이션 완료 검증 진행...');
  for (const table of tables) {
    const checkRes = await fetch(`${NEW_URL}/rest/v1/${table}?select=count`, {
      headers: {
        apikey: NEW_KEY,
        Authorization: `Bearer ${NEW_KEY}`,
        Range: '0-0'
      }
    });
    console.log(`- ${table}: HTTP ${checkRes.status}, Content-Range: ${checkRes.headers.get('content-range')}`);
  }
  console.log('==================================================');
}

runMigration();
