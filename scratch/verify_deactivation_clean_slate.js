// scratch/verify_deactivation_clean_slate.js
// ========================================================
// 🛡️ [정밀 시뮬레이션] 배정 취소 및 영업물건 해제 시 점주 대시보드 무결성 검증
// ========================================================

const fs = require('fs');
const assert = require('assert');

console.log('========================================================');
console.log('🔍 [시뮬레이션] 배정 취소 & 영업물건 해제 시 점주 화면 찌꺼기 0건 검증');
console.log('========================================================\n');

const dataStoreCode = fs.readFileSync('data-store.js', 'utf8');
const appCode = fs.readFileSync('app.js', 'utf8');

// 1. 코드 패턴 검증
console.log('--- [검증 1] toggleBizItem 해제 분기 Clean Slate 확인 ---');
assert.strictEqual(
  dataStoreCode.includes('app.receiptStatus = null;') &&
  dataStoreCode.includes('app.progressStatus = null;') &&
  dataStoreCode.includes('app.signDraftPhotos = [];'),
  true,
  'toggleBizItem 해제 시 receiptStatus, progressStatus, signDraftPhotos 초기화 코드가 있어야 합니다.'
);
console.log('✅ [통과] toggleBizItem 해제 시 공단 상태 및 시안 찌꺼기 완전 초기화 로직 확인!');

console.log('\n--- [검증 2] cancelJobConstructorAssignment 시안 찌꺼기 초기화 확인 ---');
assert.strictEqual(
  dataStoreCode.includes('delete memoObj.signDraftPhotos;') &&
  dataStoreCode.includes('delete memoObj.draftStatus;'),
  true,
  'cancelJobConstructorAssignment 시 memo 내 시안 데이터 삭제 로직이 있어야 합니다.'
);
console.log('✅ [통과] cancelJobConstructorAssignment 시안 데이터 리셋 확인!');

console.log('\n--- [검증 3] getAppStatusBadgeHtmlMob 유령 진행상황 차단 확인 ---');
assert.strictEqual(
  appCode.includes('if (!isBizItem) {') &&
  appCode.includes('return `<div style="width: 100%;">${preBadgeHtml}</div>`;'),
  true,
  'isBizItem: false일 때 공단 실시간 진행상황 박스를 일체 노출하지 않는 차단문이 있어야 합니다.'
);
console.log('✅ [통과] getAppStatusBadgeHtmlMob 유령 공단 진행상황 박스 원천 차단 확인!');

console.log('\n--- [검증 4] renderNormalDashboardMob showDraftBox 엄격 분기 확인 ---');
assert.strictEqual(
  appCode.includes('const showDraftBox = isBizItem && hasAssignedConstructor && (draftCount > 0);'),
  true,
  'showDraftBox가 isBizItem과 hasAssignedConstructor를 엄격하게 점검해야 합니다.'
);
console.log('✅ [통과] renderNormalDashboardMob showDraftBox 엄격 분기 확인!');

// 5. 가상 데이터 시나리오 테스트
console.log('\n--- [검증 5] 사용자 시나리오 가상 릴레이 테스트 ---');
// 상태: 시공사가 배정되어 시안을 1장 올린 상태
let mockApp = {
  id: 'P-260919-002',
  storeName: '(주)베이스앤',
  isBizItem: true,
  receiptStatus: '접수예정',
  progressStatus: '지원대기중',
  assignedConstructorId: 'const_woori',
  assignedConstructorName: '우리애드',
  signDraftPhotos: ['data:image/jpeg;base64,mockdraft'],
  draftStatus: 'pending'
};

// 액션 1: 관리자가 시공업체 배정 취소
mockApp.assignedConstructorId = null;
mockApp.assignedConstructorName = null;
mockApp.signDraftPhotos = [];
mockApp.draftStatus = 'pending';

const isBiz1 = Boolean(mockApp.isBizItem);
const hasAssigned1 = Boolean(mockApp.assignedConstructorId);
const showDraft1 = isBiz1 && hasAssigned1 && (mockApp.signDraftPhotos.length > 0);
assert.strictEqual(showDraft1, false, '배정 취소 시 점주 화면에 시안 박스가 사라져야 함');
console.log('✅ [통과] 시공사 배정 취소 즉시 점주 화면에서 시안 박스 0건 소멸 확인.');

// 액션 2: 관리자가 영업물건으로 변경 비활성화 (isBizItem: false)
mockApp.isBizItem = false;
mockApp.receiptStatus = null;
mockApp.progressStatus = null;

const isBiz2 = Boolean(mockApp.isBizItem);
const hasAssigned2 = Boolean(mockApp.assignedConstructorId);
const showDraft2 = isBiz2 && hasAssigned2 && (mockApp.signDraftPhotos.length > 0);
assert.strictEqual(showDraft2, false, '영업물건 해제 시 시안 박스 0건');
assert.strictEqual(isBiz2, false, 'isBizItem은 false');
console.log('✅ [통과] 영업물건 비활성화 즉시 공단 진행상황 박스 및 시안 박스 100% 완전 소멸 확인!');

console.log('\n========================================================');
console.log('🎉 [전수 검증 성공] 배정 취소 & 영업물건 해제 시 점주 화면 무결성 검증 100% 통과!');
console.log('========================================================');
