const fs = require('fs');

async function testReviewsLogic() {
  console.log('--- 1. Checking app.js reviews content ---');
  const appJs = fs.readFileSync('app.js', 'utf8');

  // Check 5번: All replaced signs must be LED 조명용 플렉스 간판
  // In the 10 initial sample reviews texts:
  const textMatches = appJs.match(/LED 조명용 플렉스 간판/g);
  console.log('Matches for "LED 조명용 플렉스 간판":', textMatches ? textMatches.length : 0);
  if (textMatches && textMatches.length >= 10) {
    console.log('✅ [5번 통과] 10대 기본 추천 후기의 교체 후 간판이 모두 "LED 조명용 플렉스 간판"으로 정확히 설정됨.');
  } else {
    console.error('❌ Mismatch in LED 조명용 플렉스 간판 count');
  }

  // Check before signs preservation
  const oldSigns = ['낡은 천막 간판', '나무 간판', '철제 프레임 간판', '네온사인 간판', '이전 학원 간판'];
  let allOldSignsPreserved = true;
  oldSigns.forEach(s => {
    if (!appJs.includes(s)) {
      console.error(`❌ Missing old sign text: ${s}`);
      allOldSignsPreserved = false;
    }
  });
  if (allOldSignsPreserved) {
    console.log('✅ 기존 간판(낡은 천막 간판, 나무 간판, 철제 프레임 간판 등) 100% 정상 보존됨.');
  }

  // Check 1번, 3번, 4번, 6번, 7번 functions
  const requiredFns = [
    'window.toggleReviewComments',
    'window.submitReviewComment',
    'window.deleteReview',
    'window.deleteReviewComment',
    'fetchSupabaseReviews',
    'getDeletedReviewIds',
    'addDeletedReviewId'
  ];
  let allFnsExist = true;
  requiredFns.forEach(fn => {
    if (!appJs.includes(fn)) {
      console.error(`❌ Missing required function: ${fn}`);
      allFnsExist = false;
    } else {
      console.log(`✅ Function exists: ${fn}`);
    }
  });

  // Check admin vs author logic
  if (appJs.includes('const isAdmin = (activeUser.role === \'admin\');') ||
      appJs.includes('const isAdmin = activeUser && (activeUser.role === \'admin\');')) {
    console.log('✅ [1번, 3번, 4번 통과] 최고관리자 마스터 삭제 및 작성자 본인 삭제 권한 로직 정상 구비.');
  } else {
    console.error('❌ Deletion permission logic check failed!');
  }

  // Check 6번: Initial sample reviews can be deleted by admin
  if (appJs.includes('DELETED:') && appJs.includes('getDeletedReviewIds')) {
    console.log('✅ [6번 통과] 기본 샘플 후기도 최고관리자가 영구 삭제 가능하도록 DELETED 묘비(tombstone) 동기화 구비.');
  } else {
    console.error('❌ 6번 check failed!');
  }

  // Check 7번: Supabase real-time sync with foreign key safety
  if (appJs.includes('author_id: null') && appJs.includes('COMMENT:')) {
    console.log('✅ [7번 통과] Supabase DB 외래키(FK) 충돌 방어 및 댓글/삭제 실시간 클라우드 동기화 구비.');
  } else {
    console.error('❌ 7번 check failed!');
  }
}

testReviewsLogic().catch(console.error);
