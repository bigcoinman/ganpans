const fs = require('fs');
const envFile = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = envFile.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = envFile.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const SUPABASE_URL = urlMatch[1];
const SUPABASE_KEY = keyMatch[1];

async function check() {
  const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };
  
  // 1. applications
  const appRes = await fetch(SUPABASE_URL + '/rest/v1/applications?select=*&limit=1', { headers });
  const sample = await appRes.json();
  console.log('Sample app columns:', sample && sample[0] ? Object.keys(sample[0]) : sample);
  
  const allAppRes = await fetch(SUPABASE_URL + '/rest/v1/applications?select=*', { headers });
  const apps = await allAppRes.json();
  if (!Array.isArray(apps)) {
    console.log('apps is not array:', apps);
    return;
  }
  const cheongpungApp = apps.filter(a => (a.store_name && a.store_name.includes('청풍')) || (a.owner_name && a.owner_name.includes('청풍')));
  console.log('=== APPLICATIONS (청풍) ===');
  cheongpungApp.forEach(a => {
    console.log({
      id: a.id,
      store_name: a.store_name,
      photo_count: a.photo_count,
      photosLen: Array.isArray(a.construction_photos) ? a.construction_photos.length : 0,
      referrer_code: a.referrer_code,
      biz_code: a.biz_code,
      user_id: a.user_id,
      status: a.status
    });
  });

  // 2. users
  const uRes = await fetch(SUPABASE_URL + '/rest/v1/users?select=id,name,role,biz_code,items', { headers });
  const users = await uRes.json();
  console.log('=== USERS items containing 청풍 ===');
  users.forEach(u => {
    if (Array.isArray(u.items)) {
      const matched = u.items.filter(it => (it.storeName && it.storeName.includes('청풍')) || (it.name && it.name.includes('청풍')) || (it.id && cheongpungApp.some(ca => ca.id === it.id)));
      if (matched.length > 0) {
        console.log('User:', u.id, u.name, u.role, u.biz_code);
        matched.forEach(m => {
          console.log('  Item in user:', {
            id: m.id,
            name: m.name || m.storeName,
            photosCount: m.photosCount,
            photosLen: Array.isArray(m.photos) ? m.photos.length : 0,
            bizCode: m.bizCode
          });
        });
      }
    }
  });

  const salesUser = users.find(u => u.biz_code === 'B-260901' || u.bizCode === 'B-260901');
  console.log('=== SALES USER FOR B-260901 ===', salesUser ? { id: salesUser.id, name: salesUser.name, biz_code: salesUser.biz_code, itemsCount: salesUser.items ? salesUser.items.length : 0, items: salesUser.items } : 'NOT FOUND');

  const cpApp = apps.find(a => a.id === 'P-260916-001');
  if (cpApp) {
    console.log('=== CHEONGPUNG APP image_url inspection ===');
    console.log('image_url starts with:', cpApp.image_url ? cpApp.image_url.slice(0, 100) : 'null');
    let parsedImgs = [];
    try {
      parsedImgs = JSON.parse(cpApp.image_url);
      console.log('image_url is valid JSON array?', Array.isArray(parsedImgs), 'Length:', parsedImgs.length);
      if (Array.isArray(parsedImgs)) {
        parsedImgs.forEach((img, idx) => {
          console.log(`  img[${idx}] length: ${img.length}, prefix: ${img.slice(0, 30)}`);
        });
      }
    } catch (e) {
      console.log('image_url is not JSON, raw length:', cpApp.image_url ? cpApp.image_url.length : 0);
    }
  }
}
check().catch(console.error);
