const fs = require('fs');

const supabaseUrl = "https://bscgxtolcqyvrqtshtbc.supabase.co";
const supabaseKey = "sb_publishable_ZP1DPYvqNYsDY4WLrq2xww_-0i7FwtC";

async function backup() {
  const headers = { 'apikey': supabaseKey, 'Authorization': `Bearer ${supabaseKey}` };
  const res = await fetch(`${supabaseUrl}/rest/v1/applications?select=*`, { headers });
  const apps = await res.json();
  console.log(`Supabase에서 ${apps.length}건 신청서 백업 다운로드 완료`);
  fs.writeFileSync('scratch/backup_live_applications.json', JSON.stringify(apps, null, 2), 'utf8');
  console.log('scratch/backup_live_applications.json 저장 완료!');
}

backup();
