const fs = require('fs');

const envFile = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = envFile.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = envFile.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const SUPABASE_URL = urlMatch[1];
const SUPABASE_KEY = keyMatch[1];

async function simulate() {
  console.log('--- Simulating ensureApplicationPhotosLoaded for Cheongpung ---');
  // Suppose client has localApp with only 2 photos
  const localApp = {
    id: 'P-260916-001',
    storeName: '청풍',
    photos: ['old_photo_1', 'old_photo_2'],
    photosCount: 2,
    memo: JSON.stringify({ photoCount: 4 })
  };

  const expectedCount = 4; // passed from button or computed from memo
  let existingPhotos = localApp.photos;

  console.log(`Current local photos: ${existingPhotos.length}장`);
  console.log(`Expected photos from server: ${expectedCount}장`);

  if (expectedCount > 0 && existingPhotos.length < expectedCount) {
    console.log('-> Mismatch detected! Invalidating local stale photos and fetching from Supabase...');
    existingPhotos = [];
    localApp.photos = [];
    
    // Fetch directly from Supabase
    const headers = { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + SUPABASE_KEY };
    const res = await fetch(SUPABASE_URL + '/rest/v1/applications?select=id,image_url,memo&id=eq.P-260916-001', { headers });
    const rows = await res.json();
    const serverApp = rows[0];
    const serverPhotos = JSON.parse(serverApp.image_url || '[]');
    console.log(`-> Fetched from Supabase: ${serverPhotos.length} images!`);
    localApp.photos = serverPhotos;
    localApp.photosCount = serverPhotos.length;
  }

  console.log(`Final local photos count: ${localApp.photos.length}장 (Expected: 4장)`);
  if (localApp.photos.length === 4) {
    console.log('✅ Cheongpung photo sync simulation 100% SUCCESS!');
  } else {
    throw new Error('Simulation failed');
  }
}

simulate().catch(console.error);
