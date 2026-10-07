const fs = require('fs');

const config = fs.readFileSync('supabase-config.js', 'utf8');
const urlMatch = config.match(/SUPABASE_URL\s*=\s*["']([^"']+)["']/);
const keyMatch = config.match(/SUPABASE_ANON_KEY\s*=\s*["']([^"']+)["']/);

const url = urlMatch[1];
const key = keyMatch[1];

async function audit() {
  const res = await fetch(`${url}/rest/v1/applications?select=id,store_name,image_url,construction_photos,construction_invoice,memo`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const apps = await res.json();
  console.log('Total applications in DB:', apps.length);
  let totalPhotoBytes = 0;
  apps.forEach(a => {
    let imgSize = a.image_url ? Buffer.byteLength(String(a.image_url), 'utf8') : 0;
    let constSize = a.construction_photos ? Buffer.byteLength(JSON.stringify(a.construction_photos), 'utf8') : 0;
    let invSize = a.construction_invoice ? Buffer.byteLength(JSON.stringify(a.construction_invoice), 'utf8') : 0;
    
    // signDraftPhotos inside memo?
    let draftSize = 0;
    if (a.memo) {
      try {
        const m = JSON.parse(a.memo);
        if (m.signDraftPhotos) draftSize += Buffer.byteLength(JSON.stringify(m.signDraftPhotos), 'utf8');
        if (m.photos) draftSize += Buffer.byteLength(JSON.stringify(m.photos), 'utf8');
      } catch (e) {}
    }

    totalPhotoBytes += imgSize + constSize + invSize + draftSize;
    console.log(`- [${a.id}] ${a.store_name}: 점주사진=${(imgSize/1024).toFixed(1)}KB, 시공사진=${(constSize/1024).toFixed(1)}KB, 시안/메모사진=${(draftSize/1024).toFixed(1)}KB, 증빙=${(invSize/1024).toFixed(1)}KB`);
  });
  console.log(`\n>>> Total photo storage in applications: ${(totalPhotoBytes/1024).toFixed(1)}KB (${(totalPhotoBytes/1024/1024).toFixed(2)}MB)`);
}
audit();
