// scratch/restore_all_users.js
const https = require('https');

const SUPABASE_URL = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

function supabaseRequest(path, method, body = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
    const options = {
      method: method,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      }
    };
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch(e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function run() {
  const usersToRestore = [
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
      password_hash: '5c06eb3d5a05a19f49476d694ca81a36344660e9d5b98e3d6a6630f31c2422e7',
      items: []
    },
    {
      id: 'robinhood',
      name: '김로빈',
      email: '',
      phone: '010-9084-3778',
      address: '경기도 수원시 권선구 효원로 266',
      role: 'business',
      biz_code: 'B-260901',
      const_code: null,
      conversion_status: 'approved',
      password_hash: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756',
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
      password_hash: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756',
      items: []
    },
    {
      id: '01043219870',
      name: '박동희',
      email: '',
      phone: '010-4321-9870',
      address: '경기도 안양시 만안구 안양로 112',
      role: 'normal',
      conversion_status: 'none',
      password_hash: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756',
      items: []
    },
    {
      id: '01042573152',
      name: '유안나',
      email: '',
      phone: '010-4257-3152',
      address: '경기도 고양시 일산동구 중앙로 1275',
      role: 'normal',
      conversion_status: 'none',
      password_hash: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756',
      items: []
    },
    {
      id: '01078553685',
      name: '오영일',
      email: '',
      phone: '010-7855-3685',
      address: '경기도 성남시 중원구 둔촌대로 150',
      role: 'normal',
      conversion_status: 'none',
      password_hash: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756',
      items: []
    },
    {
      id: '01099867135',
      name: '김진수',
      email: '',
      phone: '010-9986-7135',
      address: '경기도 용인시 처인구 백옥대로 1104',
      role: 'normal',
      conversion_status: 'none',
      password_hash: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756',
      items: []
    }
  ];

  for (const u of usersToRestore) {
    const res = await supabaseRequest('users', 'POST', u);
    console.log(`Restored user: ${u.id} (${u.name}) -> HTTP ${res.status}`);
  }

  const { data: allUsers } = await supabaseRequest('users?select=id,name,phone,role', 'GET');
  console.log('\nAll users in DB now:', allUsers);
}

run();
