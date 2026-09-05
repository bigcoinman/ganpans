const fs = require('fs');

global.window = global;
global.window.addEventListener = function() {};
global.document = { addEventListener: function() {} };

const testApps = [
  // 1. 사전등록만 된 건
  {
    id: 'B-260903-001',
    ownerName: '홍점주',
    ownerPhone: '010-1234-5678',
    storeName: '홍이네식당',
    status: 'pending',
    isBizItem: false
  },
  // 2. 공단 접수 & 대상자 선정된 건
  {
    id: 'B-260903-002',
    ownerName: '박점주',
    ownerPhone: '010-8888-9999',
    storeName: '박가네베이커리',
    status: 'approved',
    isBizItem: true,
    receiptStatus: '접수완료',
    progressStatus: '대상자선정',
    assignedConstructorName: '(주)한빛사인'
  }
];

// Load dashboard logic
const dashboardCode = fs.readFileSync('dashboard.js', 'utf8');
eval(dashboardCode);

console.log('--- 일반회원 듀얼 상태 뱃지 렌더링 테스트 ---');

// Test App 1
const badge1 = window.getAppStatusBadgeHtml(testApps[0]);
console.log('\n[App 1 (사전등록건)] HTML:\n', badge1);

// Test App 2
const badge2 = window.getAppStatusBadgeHtml(testApps[1]);
console.log('\n[App 2 (공단접수 & 대상자선정건)] HTML:\n', badge2);

const pass1 = badge1.includes('사업시행 전 사전등록업체') && badge1.includes('공단 사업공고 대기중');
const pass2 = badge2.includes('서류준비 & 접수대기') && badge2.includes('공단 접수완료') && badge2.includes('대상자선정') && badge2.includes('(주)한빛사인');

if (pass1 && pass2) {
  console.log('\n✅ 일반회원 듀얼 상태 연동 렌더링 100% 검증 통과!');
} else {
  console.error('\n❌ 검증 실패 항목 있음', { pass1, pass2 });
}
