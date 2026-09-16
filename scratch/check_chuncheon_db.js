const SUPABASE_URL = "https://nosobuzwrxxtrgohufsp.supabase.co";
const SUPABASE_KEY = "sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS";

async function run() {
  const url = `${SUPABASE_URL}/rest/v1/applications?select=id,store_name,owner_name,memo,image_url`;
  const res = await fetch(url, {
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`
    }
  });
  const data = await res.json();
  if (!Array.isArray(data)) {
    console.error('Response is not array:', data);
    return;
  }
  const filtered = data.filter(d => (d.store_name && d.store_name.includes('춘천')) || (d.owner_name && d.owner_name.includes('춘천')));
  console.log('Total applications:', data.length, '| Chuncheon matching:', filtered.length);
  for (const row of filtered) {
    console.log('--- Record ---');
    console.log('ID:', row.id);
    console.log('Store:', row.store_name);
    console.log('Owner:', row.owner_name);
    console.log('Memo:', row.memo);
    console.log('image_url length:', (row.image_url || '').length);
    if (row.image_url) {
      try {
        const parsed = JSON.parse(row.image_url);
        if (Array.isArray(parsed)) {
          console.log('image_url is Array of count:', parsed.length);
          parsed.forEach((p, idx) => {
            console.log(`  [Photo ${idx+1}] length: ${p.length}, starts: ${p.slice(0, 30)}`);
          });
        } else {
          console.log('image_url is JSON object');
        }
      } catch (e) {
        console.log('image_url is raw string, starts with:', row.image_url.slice(0, 30));
      }
    }
  }
}

run();
