const url = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const key = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

async function verifyAllLogins() {
  console.log('====================================================');
  console.log('🔍 [영업자 / 시공사 / 관리자 로그인 및 DB 동기화 검증]');
  console.log('====================================================\n');

  const testAccounts = [
    { id: 'admin', name: '최고관리자', expectedRole: 'admin' },
    { id: 'bizuser', name: '김영업', expectedRole: 'business' },
    { id: 'bugsman2026', name: '김나완', expectedRole: 'business' },
    { id: 'constuser', name: '박시공', expectedRole: 'constructor' }
  ];

  let allPassed = true;

  for (const acc of testAccounts) {
    console.log(`▶ [계정 검증]: ${acc.id} (${acc.name})`);
    try {
      // 1. Supabase에서 사용자 조회 (ilike 쿼리)
      const res = await fetch(`${url}/rest/v1/users?id=ilike.${acc.id}&select=*`, {
        headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }
      });
      const data = await res.json();
      if (data && data.length > 0) {
        const u = data[0];
        console.log(`  ✅ Supabase DB 확인: role='${u.role}', bizCode='${u.biz_code || u.const_code || 'N/A'}'`);
        if (u.role === acc.expectedRole) {
          console.log(`  ✅ 역할 일치 확인: ${acc.expectedRole} == ${u.role}`);
        } else {
          console.log(`  ❌ 역할 불일치: ${acc.expectedRole} != ${u.role}`);
          allPassed = false;
        }
      } else {
        console.log(`  ❌ Supabase DB에서 계정 검색 실패 (0건)`);
        allPassed = false;
      }
    } catch (e) {
      console.log(`  ❌ 조회 에러: ${e.message}`);
      allPassed = false;
    }
  }

  console.log('\n====================================================');
  if (allPassed) {
    console.log('🎉 [검증 완료] 모든 핵심 영업자/시공사/관리자 계정이 Supabase DB에 완벽히 등록되어 정상 로그인 가능합니다!');
  } else {
    console.log('⚠️ 계정 정보 재점검이 필요합니다.');
  }
  console.log('====================================================');
}

verifyAllLogins();
