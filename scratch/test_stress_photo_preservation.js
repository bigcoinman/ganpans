const fs = require('fs');

async function testStressPhotoPreservation() {
  console.log('--- 1. Testing photo preservation in DataStore.toggleBizItem 5 cycles ---');
  
  // Create simulated browser environment
  const mockStorage = {};
  global.localStorage = {
    getItem: (k) => mockStorage[k] || null,
    setItem: (k, v) => { mockStorage[k] = String(v); },
    removeItem: (k) => { delete mockStorage[k]; }
  };
  global.window = global;
  global.alert = () => {};
  global.confirm = () => true;
  global.document = {
    getElementById: () => null,
    createElement: () => ({ style: {}, appendChild: () => {}, setAttribute: () => {} }),
    body: { appendChild: () => {} }
  };

  // Mock initial application (희동상사)
  const initialApp = {
    id: 'P-260926-001',
    storeName: '희동상사',
    ownerName: '고희동',
    ownerPhone: '01033788423',
    userId: '01033788423',
    isBizItem: false,
    status: 'pending',
    photosCount: 1,
    hasPhoto: true,
    memo: JSON.stringify({
      isBizItem: false,
      salespersonId: 'rotiman26',
      salespersonName: '김만석',
      referrerCode: 'B-260905',
      photoCount: 1
    }),
    photos: [] // Empty in lightweight list view!
  };

  const initialUsers = [
    {
      id: 'admin',
      name: '최고관리자',
      role: 'admin',
      items: []
    },
    {
      id: 'rotiman26',
      name: '김만석',
      role: 'business',
      bizCode: 'B-260905',
      items: []
    }
  ];

  localStorage.setItem('applications', JSON.stringify([initialApp]));
  localStorage.setItem('users', JSON.stringify(initialUsers));

  // Load data-store.js
  eval(fs.readFileSync('data-store.js', 'utf8'));

  for (let cycle = 1; cycle <= 5; cycle++) {
    console.log(`\n▶ [Cycle ${cycle}] Testing toggleBizItem (on/off)...`);
    
    // Toggle ON (영업물건으로 등록)
    window.DataStore.toggleBizItem('P-260926-001');
    let apps = JSON.parse(localStorage.getItem('applications'));
    let app = apps.find(a => a.id === 'P-260926-001');
    let memo = JSON.parse(app.memo);

    if (memo.photoCount !== 1) {
      throw new Error(`❌ Cycle ${cycle} ON failed: memo.photoCount is ${memo.photoCount}, expected 1!`);
    }
    if (app.photosCount !== 1) {
      throw new Error(`❌ Cycle ${cycle} ON failed: app.photosCount is ${app.photosCount}, expected 1!`);
    }
    console.log(`  ✅ Toggle ON: isBizItem=${memo.isBizItem}, memo.photoCount=${memo.photoCount}, app.photosCount=${app.photosCount}`);

    // Toggle OFF (영업물건 해제)
    window.DataStore.toggleBizItem('P-260926-001');
    apps = JSON.parse(localStorage.getItem('applications'));
    app = apps.find(a => a.id === 'P-260926-001');
    memo = JSON.parse(app.memo);

    if (memo.photoCount !== 1) {
      throw new Error(`❌ Cycle ${cycle} OFF failed: memo.photoCount is ${memo.photoCount}, expected 1!`);
    }
    if (app.photosCount !== 1) {
      throw new Error(`❌ Cycle ${cycle} OFF failed: app.photosCount is ${app.photosCount}, expected 1!`);
    }
    console.log(`  ✅ Toggle OFF: isBizItem=${memo.isBizItem}, memo.photoCount=${memo.photoCount}, app.photosCount=${app.photosCount}`);
  }

  console.log('\n--- 2. Verifying Real Supabase On-demand Photo Load ---');
  const cfg = fs.readFileSync('supabase-config.js', 'utf8');
  const url = cfg.match(/SUPABASE_URL\s*=\s*['"`]([^'"`]+)['"`]/)[1];
  const key = cfg.match(/SUPABASE_ANON_KEY\s*=\s*['"`]([^'"`]+)['"`]/);

  const res = await fetch(`${url}/rest/v1/applications?id=eq.P-260926-001&select=id,store_name,image_url,memo`, {
    headers: { apikey: key[1], Authorization: `Bearer ${key[1]}` }
  });
  const [liveApp] = await res.json();
  const liveMemo = JSON.parse(liveApp.memo);
  console.log('Live App DB Status:');
  console.log('  id:', liveApp.id);
  console.log('  store_name:', liveApp.store_name);
  console.log('  memo.photoCount:', liveMemo.photoCount);
  console.log('  image_url length:', liveApp.image_url ? liveApp.image_url.length : 0);

  if (liveMemo.photoCount === 1 && liveApp.image_url && liveApp.image_url.length > 50) {
    console.log('🎉 [검증 완료] 희동상사 실서버 DB photoCount: 1 및 image_url 정상 확인!');
  } else {
    throw new Error('❌ Live DB verification failed!');
  }
}

testStressPhotoPreservation().catch(err => {
  console.error(err);
  process.exit(1);
});
