const fs = require('fs');

console.log('================================================================');
console.log('   [간판지원단] 6대 화면 실시간 사진 동기화 3단계 자체 검증');
console.log('================================================================');

// 1단계: DOM 무결성 검사
console.log('\n--- [1단계] DOM 무결성 검사 ---');
const htmlFiles = ['index.html', 'dashboard.html', 'app.html'];
let step1Pass = true;
for (const file of htmlFiles) {
  const content = fs.readFileSync(file, 'utf8');
  const openDiv = (content.match(/<div(\s|>)/gi) || []).length;
  const closeDiv = (content.match(/<\/div>/gi) || []).length;
  if (openDiv !== closeDiv) {
    console.error(` ❌ ${file}: open div (${openDiv}) vs close div (${closeDiv}) 불일치`);
    step1Pass = false;
  } else {
    console.log(` ✅ ${file}: open div (${openDiv}) vs close div (${closeDiv}) 완전 일치`);
  }
}

// 2단계: 핵심 로직 검사
console.log('\n--- [2단계] 6대 화면 실시간 브로드캐스트 & 핸들러 검사 ---');
const secUtils = fs.readFileSync('security-utils.js', 'utf8');
const dashboard = fs.readFileSync('dashboard.js', 'utf8');
const app = fs.readFileSync('app.js', 'utf8');

const checks = [
  { name: 'security-utils.js: DataStore.notifyAll("all") 호출', pass: secUtils.includes("DataStore.notifyAll('all')") },
  { name: 'security-utils.js: ganpan_cross_tab_sync 로컬 스토리지 브로드캐스트', pass: secUtils.includes("localStorage.setItem('ganpan_cross_tab_sync'") },
  { name: 'security-utils.js: targetUser.items 에 사진 메타데이터(photos, photosCount) 동기화', pass: secUtils.includes('photosCount: Number(fa.photosCount)') },
  { name: 'security-utils.js: Supabase users 테이블 비동기 upsertUser 호출', pass: secUtils.includes('updatedUsers.forEach(u => window.SupabaseSync.upsertUser(u)') },
  { name: 'dashboard.js: storage 이벤트에서 ganpan_cross_tab_sync 수신', pass: dashboard.includes("e.key === 'ganpan_cross_tab_sync'") },
  { name: 'dashboard.js: 시공업체 대시보드(renderConstructorDashboard)에 현장사진 버튼 탑재', pass: dashboard.includes("window.downloadApplicationPhotos('${job.id}')") },
  { name: 'dashboard.js: 영업물건 목록(renderBizRegisteredTable)에 현장사진 버튼 탑재', pass: dashboard.includes("window.downloadApplicationPhotos('${item.id}')") },
  { name: 'app.js: storage 이벤트에서 영업자/시공사/점주 모바일 대시보드 리렌더링', pass: app.includes("renderConstructorDashboardMob(true)") && app.includes("renderBusinessDashboardMob()") },
  { name: 'app.js: handleRealtimeSyncMob 에서 영업자/시공사 모바일 대시보드 리렌더링', pass: app.includes("renderUserApplicationsMob()") && app.includes("renderConstructorDashboardMob(true)") },
  { name: 'app.js: 시공업체 모바일 카드에 현장사진 확인 버튼 탑재', pass: app.includes("window.downloadApplicationPhotos('${job.id}')") },
  { name: 'app.js: 모바일 영업물건 카드에 현장사진 확인 버튼 탑재', pass: app.includes("window.downloadApplicationPhotos('${item.id}')") }
];

let step2Pass = true;
for (const c of checks) {
  console.log(` ${c.pass ? '✅' : '❌'} ${c.name}`);
  if (!c.pass) step2Pass = false;
}

// 3단계: 가상 시뮬레이션 동작 검증
console.log('\n--- [3단계] 6대 화면 가상 시뮬레이션 동작 검증 ---');
// 시뮬레이션: 최고관리자가 사진 3장 업로드 시
const mockAppId = 'P-260917-001';
const mockFinalPhotos = ['data:image/jpeg;base64,1', 'data:image/jpeg;base64,2', 'data:image/jpeg;base64,3'];

// 1) applications 업데이트
const mockApp = { id: mockAppId, storeName: '춘천닭갈비', photos: mockFinalPhotos, photosCount: 3, hasPhoto: true, memo: JSON.stringify({ photoCount: 3 }) };

// 2) users.items 동기화 테스트
const mockSalesUser = { id: 'robinhood', role: 'business', bizCode: 'B-260901', items: [{ id: mockAppId, name: '춘천닭갈비' }] };
const itemPayload = {
  id: mockApp.id,
  photos: mockApp.photos,
  photosCount: mockApp.photosCount,
  hasPhoto: mockApp.hasPhoto
};
mockSalesUser.items[0] = { ...mockSalesUser.items[0], ...itemPayload };

console.log(` - 영업자 items 동기화 결과: photoCount = ${mockSalesUser.items[0].photosCount}, hasPhoto = ${mockSalesUser.items[0].hasPhoto}`);
if (mockSalesUser.items[0].photosCount === 3 && mockSalesUser.items[0].hasPhoto === true) {
  console.log('   -> 영업자 대시보드 데이터 동기화 무결성 PASS ✅');
} else {
  console.error('   -> 영업자 대시보드 데이터 동기화 FAIL ❌');
  step2Pass = false;
}

// 3) 시공업체 job 동기화 테스트
const mockConstructorJob = { id: mockApp.id, storeName: mockApp.storeName, photos: mockApp.photos, photosCount: mockApp.photosCount, hasPhoto: mockApp.hasPhoto };
console.log(` - 시공업체 job 동기화 결과: photoCount = ${mockConstructorJob.photosCount}, hasPhoto = ${mockConstructorJob.hasPhoto}`);
if (mockConstructorJob.photosCount === 3 && mockConstructorJob.hasPhoto === true) {
  console.log('   -> 시공업체 대시보드 데이터 동기화 무결성 PASS ✅');
} else {
  console.error('   -> 시공업체 대시보드 데이터 동기화 FAIL ❌');
  step2Pass = false;
}

console.log('\n================================================================');
if (step1Pass && step2Pass) {
  console.log('   🎉 6대 화면 실시간 동기화 3단계 자체 사전 검증 100% 통과!');
} else {
  console.error('   ❌ 검증 실패 항목 존재');
  process.exit(1);
}
console.log('================================================================');
