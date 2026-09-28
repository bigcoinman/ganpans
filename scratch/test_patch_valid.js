const fs = require('fs');

async function main() {
  const cfg = fs.readFileSync('supabase-config.js', 'utf8');
  const url = cfg.match(/SUPABASE_URL\s*=\s*"([^"]+)"/)[1];
  const key = cfg.match(/SUPABASE_ANON_KEY\s*=\s*"([^"]+)"/)[1];

  // Test PATCH with ONLY valid columns: image_url and memo
  const res = await fetch(`${url}/rest/v1/applications?id=eq.P-260917-001`, {
    method: 'PATCH',
    headers: {
      'apikey': key,
      'Authorization': 'Bearer ' + key,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      memo: JSON.stringify({
        isBizItem: false,
        salespersonId: "",
        salespersonName: "본사직접접수",
        photoCount: 5,
        referrerCode: "",
        draftCount: 4,
        constPhotoCount: 3
      })
    })
  });

  const resJson = await res.json();
  console.log('Update status:', res.status);
  console.log('Updated rows:', resJson.length);
}

main().catch(console.error);
