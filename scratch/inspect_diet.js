const fs = require('fs');
let raw = fs.readFileSync('scratch/diet_applications.json', 'utf8');
if (raw.charCodeAt(0) === 0xFEFF) {
  raw = raw.slice(1);
}
const apps = JSON.parse(raw);

let totalImg = 0;
let totalCp = 0;

apps.forEach((app, idx) => {
  const imgLen = app.image_url ? Buffer.byteLength(String(app.image_url), 'utf8') : 0;
  const cpLen = app.construction_photos ? Buffer.byteLength(JSON.stringify(app.construction_photos), 'utf8') : 0;
  totalImg += imgLen;
  totalCp += cpLen;
  console.log(`[#${idx} ${app.id} (${app.store_name})]: image_url=${(imgLen/1024).toFixed(1)}KB | const_photos=${(cpLen/1024).toFixed(1)}KB`);
});

console.log(`Total image_url: ${(totalImg/1024).toFixed(1)}KB`);
console.log(`Total const_photos: ${(totalCp/1024).toFixed(1)}KB`);
console.log(`Total Photos: ${((totalImg + totalCp)/1024/1024).toFixed(2)}MB`);
