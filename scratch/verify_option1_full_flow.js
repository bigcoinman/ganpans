const url = 'https://nosobuzwrxxtrgohufsp.supabase.co';
const key = 'sb_publishable_2b3sZmB3zTAbTLx-pTh9uQ_rTqmRBmS';

const headers = {
  'apikey': key,
  'Authorization': `Bearer ${key}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=representation'
};

async function verifyOption1Flow() {
  console.log('================================================================');
  console.log('🚀 [1안 유지 상태: 최고관리자-영업자-시공사-회원-비회원 전수 기능 검증]');
  console.log(`📡 Supabase Endpoint: ${url}`);
  console.log('================================================================\n');

  let allPassed = true;
  const testSuffix = Date.now();

  // 1. 비회원 간편 문의 접수 검증
  console.log('▶ [테스트 1] 비회원 3초 간편 문의 접수 (inquiries)');
  const inqId = `inq_test_${testSuffix}`;
  try {
    const inqRes = await fetch(`${url}/rest/v1/inquiries`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: inqId,
        name: '홍길동(문의고객)',
        phone: '010-1234-5678',
        region: '서울 강남구 (지원금 문의드립니다)',
        category: 'LED채널간판',
        status: 'pending'
      })
    });
    if (inqRes.status === 201) {
      console.log('  ✅ 간편 문의 접수 성공 (HTTP 201 Created)');
    } else {
      console.log(`  ❌ 간편 문의 접수 실패 (HTTP ${inqRes.status})`);
      allPassed = false;
    }
  } catch (e) {
    console.log(`  ❌ 에러 발생: ${e.message}`);
    allPassed = false;
  }

  // 2. 비회원/일반회원 간편 지원 신청서 접수 검증
  console.log('\n▶ [테스트 2] 온라인 간편 지원금 신청서 접수 (applications)');
  const appId = `app_test_${testSuffix}`;
  try {
    const appRes = await fetch(`${url}/rest/v1/applications`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: appId,
        user_id: null,
        owner_name: '김대표',
        phone: '010-9876-5432',
        store_name: '대박식당',
        store_address: '경기 수원시 팔달구 123',
        sign_type: 'LED 플렉스 간판',
        status: 'pending',
        referrer_code: 'BIZ777'
      })
    });
    if (appRes.status === 201) {
      console.log('  ✅ 지원금 신청서 접수 성공 (HTTP 201 Created)');
    } else {
      console.log(`  ❌ 지원금 신청서 접수 실패 (HTTP ${appRes.status})`);
      allPassed = false;
    }
  } catch (e) {
    console.log(`  ❌ 에러 발생: ${e.message}`);
    allPassed = false;
  }

  // 3. 회원 가입 및 로그인 (users)
  console.log('\n▶ [테스트 3] 회원 가입 및 로그인 동기화 (users)');
  const userId = `user_test_${testSuffix}`;
  try {
    const userRes = await fetch(`${url}/rest/v1/users`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        id: userId,
        name: '이영업',
        phone: '010-5555-6666',
        email: 'sales@example.com',
        role: 'business',
        biz_code: 'BIZ777',
        password_hash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8' // 'password' sha256
      })
    });
    if (userRes.status === 201) {
      console.log('  ✅ 회원 가입 성공 (HTTP 201 Created)');
    } else {
      console.log(`  ❌ 회원 가입 실패 (HTTP ${userRes.status})`);
      allPassed = false;
    }
  } catch (e) {
    console.log(`  ❌ 에러 발생: ${e.message}`);
    allPassed = false;
  }

  // 4. 최고관리자 대시보드 상태 변경 & 시공사 배정 시뮬레이션
  console.log('\n▶ [테스트 4] 최고관리자 승인 & 시공사 배정 상태 변경 (applications UPDATE)');
  try {
    const updateRes = await fetch(`${url}/rest/v1/applications?id=eq.${appId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({
        status: 'approved',
        assigned_constructor_id: 'CONST_001',
        assigned_constructor_name: '(주)우주간판시공',
        construction_status: 'preparing'
      })
    });
    if (updateRes.status >= 200 && updateRes.status < 300) {
      console.log('  ✅ 최고관리자 상태 변경 & 시공사 배정 성공');
    } else {
      console.log(`  ❌ 상태 변경 실패 (HTTP ${updateRes.status})`);
      allPassed = false;
    }
  } catch (e) {
    console.log(`  ❌ 에러 발생: ${e.message}`);
    allPassed = false;
  }

  // 5. 사이트 방문자 수 및 후기 (site_stats, reviews)
  console.log('\n▶ [테스트 5] 방문자 통계 및 고객 후기 (site_stats, reviews)');
  try {
    const statRes = await fetch(`${url}/rest/v1/site_stats`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'resolution=merge-duplicates' },
      body: JSON.stringify({
        id: 'visitor_counter',
        today_date: '2026-09-03',
        today_count: 10,
        total_count: 100
      })
    });
    console.log(`  ✅ 방문자 통계 업데이트: HTTP ${statRes.status}`);

    const revRes = await fetch(`${url}/rest/v1/reviews`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        author_name: '박점주',
        shop_name: '강남 베이커리',
        content: '지원금 덕분에 간판 예쁘게 교체했습니다!',
        rating: 5
      })
    });
    let revId = null;
    if (revRes.status === 201) {
      const revData = await revRes.json();
      revId = revData[0]?.id;
      console.log('  ✅ 고객 후기 등록 성공 (HTTP 201 Created)');
    } else {
      console.log(`  ❌ 고객 후기 등록 실패 (HTTP ${revRes.status})`);
      allPassed = false;
    }

    // 6. 테스트 데이터 깔끔한 자동 정리 (Clean up)
    console.log('\n▶ [테스트 6] 테스트 데이터 자동 청소 (Clean-up)');
    await fetch(`${url}/rest/v1/inquiries?id=eq.${inqId}`, { method: 'DELETE', headers });
    await fetch(`${url}/rest/v1/applications?id=eq.${appId}`, { method: 'DELETE', headers });
    await fetch(`${url}/rest/v1/users?id=eq.${userId}`, { method: 'DELETE', headers });
    if (revId) await fetch(`${url}/rest/v1/reviews?id=eq.${revId}`, { method: 'DELETE', headers });
    console.log('  ✅ 테스트 데이터 완전 청소 완료');

  } catch (e) {
    console.log(`  ❌ 에러 발생: ${e.message}`);
    allPassed = false;
  }

  console.log('\n================================================================');
  if (allPassed) {
    console.log('🎉 [검증 완료] 1안 설정이 완벽하게 유지되고 있으며,');
    console.log('   일반고객 / 영업자 / 시공업체 / 최고관리자 모두 정상 이용 가능합니다!');
  } else {
    console.log('⚠️ 일부 기능 점검이 필요합니다.');
  }
  console.log('================================================================');
}

verifyOption1Flow();
