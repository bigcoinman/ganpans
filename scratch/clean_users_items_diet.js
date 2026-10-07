const fs = require('fs');

const config = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = config.match(/SUPABASE_URL\s*=\s*["']([^"']+)["']/);
const keyMatch = config.match(/SUPABASE_ANON_KEY\s*=\s*["']([^"']+)["']/);

const url = urlMatch[1];
const key = keyMatch[1];
const headers = {
  'apikey': key,
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

async function cleanUsersItemsDiet() {
  console.log('=== [Supabase users.items 트래픽 다이어트 정화 시작] ===');
  console.log('Target URL:', url);

  const res = await fetch(`${url}/rest/v1/users?select=id,name,items`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const users = await res.json();
  console.log(`총 유저 수: ${users.length}명\n`);

  let totalBeforeBytes = 0;
  let totalAfterBytes = 0;

  for (const u of users) {
    const rawBefore = JSON.stringify(u.items || []);
    const beforeBytes = Buffer.byteLength(rawBefore, 'utf8');
    totalBeforeBytes += beforeBytes;

    if (!u.items || !Array.isArray(u.items) || u.items.length === 0) {
      console.log(`- 유저 [${u.id}] (${u.name}): items 0건 (정상)`);
      totalAfterBytes += beforeBytes;
      continue;
    }

    console.log(`- 유저 [${u.id}] (${u.name}): items ${u.items.length}건, 정화 전 용량: ${(beforeBytes / 1024).toFixed(2)} KB`);

    let modified = false;
    const cleanedItems = u.items.map(it => {
      if (!it || typeof it !== 'object') return it;
      const copy = { ...it };

      // 사진 배열 및 Base64 필드 전수 소각
      if (copy.photos) { delete copy.photos; modified = true; }
      if (copy.fileData) { delete copy.fileData; modified = true; }
      if (copy.image_url) { delete copy.image_url; modified = true; }
      if (copy.signDraftPhotos) { delete copy.signDraftPhotos; modified = true; }
      if (copy.constructionPhotos) { delete copy.constructionPhotos; modified = true; }
      if (copy._clearPhotos !== undefined) { delete copy._clearPhotos; modified = true; }

      // memo 내부에 Base64 사진 배열이 직렬화되어 들어간 경우 정화
      if (copy.memo && typeof copy.memo === 'string') {
        try {
          const m = JSON.parse(copy.memo);
          let mChanged = false;
          if (m.signDraftPhotos) { delete m.signDraftPhotos; mChanged = true; }
          if (m.constructionPhotos) { delete m.constructionPhotos; mChanged = true; }
          if (m.photos) { delete m.photos; mChanged = true; }
          if (m.image_url) { delete m.image_url; mChanged = true; }
          if (mChanged) {
            copy.memo = JSON.stringify(m);
            modified = true;
          }
        } catch (e) {}
      }

      return copy;
    });

    const rawAfter = JSON.stringify(cleanedItems);
    const afterBytes = Buffer.byteLength(rawAfter, 'utf8');
    totalAfterBytes += afterBytes;

    if (modified) {
      console.log(`  -> 정화 후 items 용량: ${(afterBytes / 1024).toFixed(2)} KB (${((1 - afterBytes / beforeBytes) * 100).toFixed(1)}% 다이어트)`);
      const patchRes = await fetch(`${url}/rest/v1/users?id=eq.${encodeURIComponent(u.id)}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ items: cleanedItems })
      });
      console.log(`  -> Supabase DB 업데이트 상태: HTTP ${patchRes.status}`);
    } else {
      console.log(`  -> 이미 정화된 상태 (${(afterBytes / 1024).toFixed(2)} KB)`);
    }
  }

  console.log('\n=== [정화 결과 요약] ===');
  console.log(`- 전체 items 정화 전 총량: ${(totalBeforeBytes / 1024).toFixed(2)} KB`);
  console.log(`- 전체 items 정화 후 총량: ${(totalAfterBytes / 1024).toFixed(2)} KB`);
  console.log(`- 절감율: ${((1 - totalAfterBytes / Math.max(totalBeforeBytes, 1)) * 100).toFixed(1)}% 절감`);
}

cleanUsersItemsDiet().catch(console.error);
