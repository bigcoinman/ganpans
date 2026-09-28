const fs = require('fs');

async function main() {
  const cfg = fs.readFileSync('supabase-config.js', 'utf8');
  const url = cfg.match(/SUPABASE_URL\s*=\s*"([^"]+)"/)[1];
  const key = cfg.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/)[1];

  // Try updating with file_name on P-260917-001 (춘천닭갈비) to see if file_name causes error
  const testPayload = {
    file_name: 'test.jpg'
  };

  const res = await fetch(`${url}/rest/v1/applications?id=eq.P-260917-001`, {
    method: 'PATCH',
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(testPayload)
  });

  const resJson = await res.json();
  console.log('Update status:', res.status);
  console.log('Update result:', resJson);
}

main().catch(console.error);
