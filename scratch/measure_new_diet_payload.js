const fs = require('fs');
const config = fs.readFileSync('supabase-config.js', 'utf8');
const url = config.match(/SUPABASE_URL\s*=\s*["']([^"']+)["']/)[1];
const key = config.match(/SUPABASE_ANON_KEY\s*=\s*["']([^"']+)["']/)[1];
const headers = { apikey: key, Authorization: 'Bearer ' + key };

async function measure() {
  const fields = 'id, name, email, phone, address, role, biz_code, const_code, conversion_status, pending_business_name, pending_license_number, password_hash, items, created_at';
  const res = await fetch(url + '/rest/v1/users?select=' + encodeURIComponent(fields), { headers });
  const text = await res.text();
  console.log('✅ New Users select size:', (Buffer.byteLength(text)/1024).toFixed(2), 'KB');
}
measure().catch(console.error);
