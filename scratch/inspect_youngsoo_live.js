// inspect_youngsoo_live.js
const fs = require('fs');

const configCode = fs.readFileSync('./supabase-config.js', 'utf8');
const window = {};
eval(configCode);

const SUPABASE_URL = window.SUPABASE_URL;
const SUPABASE_KEY = window.SUPABASE_ANON_KEY;

async function fetchSupabase(path) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`
    }
  });
  return res.json();
}

async function inspect() {
  console.log('=== [1] Supabase applications 테이블 전체 조회 ===');
  const apps = await fetchSupabase('applications?select=id,store_name,owner_name,status,construction_status,referrer_code,memo&order=id.desc&limit=10');
  console.log('최근 신청서 목록:');
  apps.forEach(a => {
    console.log(`- ID: ${a.id}, 상호: ${a.store_name}, 대표: ${a.owner_name}, 상태: ${a.status}, 시공상태: ${a.construction_status}, 코드: ${a.referrer_code}`);
    console.log(`  메모: ${a.memo}`);
  });

  console.log('\n=== [2] Supabase users 테이블 items 조회 ===');
  const users = await fetchSupabase('users?select=id,name,biz_code,role,items');
  users.forEach(u => {
    if (u.items && Array.isArray(u.items) && u.items.length > 0) {
      console.log(`- 유저: ${u.name}(${u.id}, ${u.biz_code}) 의 items (${u.items.length}건):`);
      u.items.forEach(it => {
        console.log(`   [${it.id}] ${it.name || it.storeName} (접수: ${it.receiptStatus}, 진행: ${it.progressStatus})`);
      });
    }
  });
}

inspect();
