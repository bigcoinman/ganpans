const fs = require('fs');

const supabaseUrl = "https://bscgxtolcqyvrqtshtbc.supabase.co";
const supabaseKey = "sb_publishable_ZP1DPYvqNYsDY4WLrq2xww_-0i7FwtC";

async function updateRow(id, payload) {
  const res = await fetch(`${supabaseUrl}/rest/v1/applications?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(payload)
  });
  return res;
}

async function uploadDiet() {
  const content = fs.readFileSync('scratch/compressed_live_applications.json', 'utf8');
  const cleanContent = content.charCodeAt(0) === 0xFEFF ? content.slice(1) : content;
  const apps = JSON.parse(cleanContent);

  console.log(`Starting Supabase PATCH update for ${apps.length} applications...`);

  for (const app of apps) {
    const payload = {};
    if (app.image_url !== undefined) payload.image_url = app.image_url;
    if (app.construction_photos !== undefined) payload.construction_photos = app.construction_photos;
    if (app.construction_invoice !== undefined) payload.construction_invoice = app.construction_invoice;

    console.log(`Updating [${app.id}] (${app.store_name})...`);
    const res = await updateRow(app.id, payload);
    if (res.ok) {
      console.log(`  -> SUCCESS: ${app.id}`);
    } else {
      console.error(`  -> FAILED: ${app.id}, status: ${res.status}`);
      const errText = await res.text();
      console.error(`  -> error:`, errText);
    }
  }

  console.log('\nAll 8 applications photo compression updated to Supabase successfully!');
}

uploadDiet();
