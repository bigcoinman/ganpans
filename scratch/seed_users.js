const url = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const key = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

const headers = {
  'apikey': key,
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function seedCoreAccounts() {
  console.log('=== [Supabase 핵심 기본 계정 Seeding 시작] ===');

  const defaultUsers = [
    {
      id: 'admin',
      name: '최고관리자',
      email: 'admin@ganpan.go.kr',
      phone: '010-0000-0000',
      address: '경기도 수원시 영통구 청명남로 10',
      role: 'admin',
      biz_code: null,
      const_code: null,
      conversion_status: 'none',
      password_hash: '5c06eb3d5a05a19f49476d694ca81a36344660e9d5b98e3d6a6630f31c2422e7', // admin1234!
      items: []
    },
    {
      id: 'bizuser',
      name: '김영업',
      email: 'kim@naver.com',
      phone: '010-9876-5432',
      address: '경기도 성남시 분당구 판교역로 235',
      role: 'business',
      biz_code: 'B-260712',
      const_code: null,
      conversion_status: 'approved',
      password_hash: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756', // biz1234!
      items: []
    },
    {
      id: 'bugsman2026',
      name: '김나완',
      email: 'bugsman@naver.com',
      phone: '010-9999-8888',
      address: '서울특별시 송파구 올림픽로 300',
      role: 'business',
      biz_code: 'B-260901',
      const_code: null,
      conversion_status: 'approved',
      password_hash: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756', // biz1234! / 1234
      items: []
    },
    {
      id: 'constuser',
      name: '박시공',
      email: 'const@naver.com',
      phone: '010-3333-4444',
      address: '인천광역시 부평구 부평대로 50',
      role: 'constructor',
      biz_code: null,
      const_code: 'C-260801',
      conversion_status: 'approved',
      pending_business_name: '(주)우주간판시공',
      pending_license_number: '123-45-67890',
      password_hash: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756', // const1234!
      items: []
    }
  ];

  for (const user of defaultUsers) {
    const res = await fetch(`${url}/rest/v1/users`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify(user)
    });
    console.log(`✓ Seed user [${user.id.padEnd(12)} (${user.name})]: HTTP ${res.status}`);
  }

  // Check Supabase users again
  const checkRes = await fetch(`${url}/rest/v1/users?select=id,name,role,biz_code,const_code`, {
    headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
  });
  const data = await checkRes.json();
  console.log('\n[현재 Supabase DB users 목록]:', data);
}

seedCoreAccounts();
