const https = require('https');

const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

function apiRequest(path, method = 'GET', body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}${path}`);
    const headers = {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    };
    if (method === 'PATCH' || method === 'POST') {
      headers['Prefer'] = 'return=representation';
    }
    const req = https.request(url, { method, headers }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          resolve(data);
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
}

async function fixAllDbPhotoCounts() {
  console.log('=== [1단계] Supabase applications 테이블 전체 조회 및 photoCount 점검 ===');
  const apps = await apiRequest('/rest/v1/applications?select=id,store_name,owner_name,memo,image_url');
  if (!Array.isArray(apps)) {
    console.error('Failed to fetch applications:', apps);
    return;
  }

  for (const app of apps) {
    let actualPhotos = 0;
    if (app.image_url) {
      const trimmed = String(app.image_url).trim();
      if (trimmed.startsWith('[')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) actualPhotos = parsed.length;
        } catch (e) {}
      } else if (trimmed.startsWith('data:') || trimmed.startsWith('http') || trimmed.startsWith('blob:') || trimmed.length > 100) {
        actualPhotos = 1;
      }
    }

    let memoObj = {};
    try {
      memoObj = typeof app.memo === 'string' ? JSON.parse(app.memo) : (app.memo || {});
    } catch (e) {
      memoObj = {};
    }

    const currentMemoCount = memoObj.photoCount !== undefined ? Number(memoObj.photoCount) : null;

    if (actualPhotos > 0 && currentMemoCount !== actualPhotos) {
      console.log(`[보정 대상 발견] ${app.id} (${app.store_name}): 실제사진 ${actualPhotos}장 vs memo.photoCount ${currentMemoCount}장 -> ${actualPhotos}장으로 복원 중...`);
      memoObj.photoCount = actualPhotos;
      const patched = await apiRequest(`/rest/v1/applications?id=eq.${encodeURIComponent(app.id)}`, 'PATCH', {
        memo: JSON.stringify(memoObj)
      });
      console.log(` -> ${app.id} 복원 완료:`, patched && patched[0] ? patched[0].memo : 'OK');
    } else {
      console.log(`[정상 상태] ${app.id} (${app.store_name}): 실제사진 ${actualPhotos}장 == memo.photoCount ${currentMemoCount}장`);
    }
  }
  console.log('=== 전체 DB photoCount 복원 작업 완료 ===\n');
}

fixAllDbPhotoCounts().catch(err => console.error(err));
