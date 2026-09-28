const https = require('https');
const fs = require('fs');
const path = require('path');

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
  console.log('Fetching applications from Supabase for backup...');
  const apps = await querySupabase('applications?select=*');
  if (!Array.isArray(apps)) {
    console.error('Backup failed! Could not fetch applications:', apps);
    process.exit(1);
  }
  const backupPath = path.join(__dirname, 'backup_applications_before_diet.json');
  fs.writeFileSync(backupPath, JSON.stringify(apps, null, 2), 'utf8');
  console.log(`Backup completed successfully! Saved ${apps.length} applications to ${backupPath}`);
  console.log(`Total backup size: ${(fs.statSync(backupPath).size / 1024 / 1024).toFixed(2)} MB`);
}

run();
