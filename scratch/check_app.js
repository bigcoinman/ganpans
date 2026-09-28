const fs = require('fs');
const supaJs = fs.readFileSync('supabase-client.js', 'utf8');
const urlMatch = supaJs.match(/SUPABASE_URL\s*=\s*['"]([^'"]+)['"]/);
const keyMatch = supaJs.match(/SUPABASE_ANON_KEY\s*=\s*['"]([^'"]+)['"]/);
const url = urlMatch ? urlMatch[1] : '';
const key = keyMatch ? keyMatch[1] : '';

async function run() {
  const res = await fetch(url + '/rest/v1/applications?id=eq.P-260928-001', {
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key
    }
  });
  const data = await res.json();
  console.log('App record in Supabase:');
  console.log(JSON.stringify(data, null, 2));

  // Also check all applications count and top 5 recent
  const resAll = await fetch(url + '/rest/v1/applications?select=id,store_name,applied_at,created_at&order=applied_at.desc&limit=5', {
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key
    }
  });
  const dataAll = await resAll.json();
  console.log('\nTop 5 recent applications by applied_at.desc:');
  console.log(JSON.stringify(dataAll, null, 2));
}

run().catch(console.error);
