const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

const headers = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal'
};

async function cleanSupabaseWaste() {
  console.log('=== [1] Supabase users.items 내 Base64 사진 데이터 정리 시작 ===');
  
  const resUsers = await fetch(`${SUPABASE_URL}/rest/v1/users?select=id,items`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  const users = await resUsers.json();
  
  for (const u of users) {
    if (u.items && Array.isArray(u.items) && u.items.length > 0) {
      let modified = false;
      const cleanedItems = u.items.map(it => {
        const itemCopy = { ...it };
        if (itemCopy.photos) {
          console.log(`- 유저 [${u.id}] item [${it.id || it.name}] 대용량 photos (${JSON.stringify(itemCopy.photos).length} 글자) 제거`);
          delete itemCopy.photos;
          modified = true;
        }
        if (itemCopy.fileData) {
          console.log(`- 유저 [${u.id}] item [${it.id || it.name}] 대용량 fileData (${JSON.stringify(itemCopy.fileData).length} 글자) 제거`);
          delete itemCopy.fileData;
          modified = true;
        }
        return itemCopy;
      });
      
      if (modified) {
        console.log(`>> 유저 [${u.id}] 정돈된 items Supabase 업데이트 실행...`);
        const patchRes = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${encodeURIComponent(u.id)}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ items: cleanedItems })
        });
        console.log(`>> 유저 [${u.id}] 업데이트 완료 (HTTP ${patchRes.status})`);
      }
    }
  }
  
  console.log('\n=== [2] Supabase applications.memo 내 Base64 signDraftPhotos 정리 시작 ===');
  const resApps = await fetch(`${SUPABASE_URL}/rest/v1/applications?select=id,memo`, {
    headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
  });
  const apps = await resApps.json();
  
  for (const a of apps) {
    if (a.memo) {
      try {
        const m = JSON.parse(a.memo);
        if (m.signDraftPhotos && Array.isArray(m.signDraftPhotos) && m.signDraftPhotos.length > 0) {
          console.log(`- 신청서 [${a.id}] memo 내 signDraftPhotos (${JSON.stringify(m.signDraftPhotos).length} 글자) 제거`);
          m.draftCount = m.signDraftPhotos.length;
          m.signDraftPhotos = []; // 사진 데이터는 실제 construction_photos 에 존재하거나 온디맨드로 관리
          
          const patchAppRes = await fetch(`${SUPABASE_URL}/rest/v1/applications?id=eq.${encodeURIComponent(a.id)}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({ memo: JSON.stringify(m) })
          });
          console.log(`>> 신청서 [${a.id}] memo 업데이트 완료 (HTTP ${patchAppRes.status})`);
        }
      } catch(e) {}
    }
  }
  
  console.log('\n=== [3] 데이터 정리 완료! 실시간 대역폭 측정 재검증 ===');
}

cleanSupabaseWaste().catch(e => console.error(e));
