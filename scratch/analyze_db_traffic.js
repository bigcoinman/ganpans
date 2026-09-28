const https = require('https');

const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

function querySupabase(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
    const options = {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    };
    https.get(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch(e) {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  console.log('=== 1. APPLICATIONS TABLE ANALYSIS ===');
  const apps = await querySupabase('applications?select=*');
  if (!Array.isArray(apps)) {
    console.log('Error fetching applications:', apps);
  } else {
    console.log(`Total Applications: ${apps.length}`);
    let totalSize = 0;
    let totalImageSize = 0;
    let totalConstPhotosSize = 0;
    let totalConstInvoiceSize = 0;

    apps.forEach((app, idx) => {
      const appStr = JSON.stringify(app);
      const appBytes = Buffer.byteLength(appStr, 'utf8');
      totalSize += appBytes;

      const imgLen = app.image_url ? Buffer.byteLength(String(app.image_url), 'utf8') : 0;
      const cpLen = app.construction_photos ? Buffer.byteLength(JSON.stringify(app.construction_photos), 'utf8') : 0;
      const ciLen = app.construction_invoice ? Buffer.byteLength(JSON.stringify(app.construction_invoice), 'utf8') : 0;

      totalImageSize += imgLen;
      totalConstPhotosSize += cpLen;
      totalConstInvoiceSize += ciLen;

      if (imgLen > 50000 || cpLen > 50000 || ciLen > 50000) {
        console.log(`[App #${idx} ${app.id} (${app.store_name})]: Total=${(appBytes/1024).toFixed(1)}KB | image_url=${(imgLen/1024).toFixed(1)}KB | const_photos=${(cpLen/1024).toFixed(1)}KB | invoice=${(ciLen/1024).toFixed(1)}KB`);
      }
    });

    console.log(`\nApplications Row Summary:`);
    console.log(`- Entire Table JSON Size: ${(totalSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- image_url Size: ${(totalImageSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- construction_photos Size: ${(totalConstPhotosSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- construction_invoice Size: ${(totalConstInvoiceSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`- Text metadata only Size: ${((totalSize - totalImageSize - totalConstPhotosSize - totalConstInvoiceSize) / 1024).toFixed(2)} KB`);
  }

  console.log('\n=== 2. USERS TABLE ANALYSIS ===');
  const users = await querySupabase('users?select=*');
  if (!Array.isArray(users)) {
    console.log('Error fetching users:', users);
  } else {
    console.log(`Total Users: ${users.length}`);
    let totalSize = 0;
    let totalItemsSize = 0;
    users.forEach((u, idx) => {
      const uStr = JSON.stringify(u);
      const uBytes = Buffer.byteLength(uStr, 'utf8');
      totalSize += uBytes;
      const itLen = u.items ? Buffer.byteLength(JSON.stringify(u.items), 'utf8') : 0;
      totalItemsSize += itLen;
      if (itLen > 10000) {
        console.log(`[User #${idx} ${u.id} (${u.name})]: Total=${(uBytes/1024).toFixed(1)}KB | items=${(itLen/1024).toFixed(1)}KB`);
      }
    });
    console.log(`Users Row Summary:`);
    console.log(`- Entire Table JSON Size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`- items Size: ${(totalItemsSize / 1024).toFixed(2)} KB`);
  }
}

run();
