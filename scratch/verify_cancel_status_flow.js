// scratch/verify_cancel_status_flow.js
// ========================================================
// 🛡️ [간판지원단] 지원 신청 취소 (canceled) 6대 상태 무결성 전수 시뮬레이션
// ========================================================

const fs = require('fs');
const assert = require('assert');

console.log('========================================================');
console.log('🔍 [시뮬레이션 검증] "지원 신청 취소" 6대 상태 연동 전수 테스트');
console.log('========================================================\n');

const appJs = fs.readFileSync('app.js', 'utf8');
const dataStoreJs = fs.readFileSync('data-store.js', 'utf8');
const blueprintMd = fs.readFileSync('SYSTEM_BLUEPRINT.md', 'utf8');

let passCount = 0;
let failCount = 0;

function testAssert(name, condition, detail) {
    if (condition) {
        console.log(`✅ [통과] ${name}`);
        passCount++;
    } else {
        console.error(`❌ [실패] ${name}`);
        if (detail) console.error(`   👉 상세: ${detail}`);
        failCount++;
    }
}

// ----------------------------------------------------
// 1. isPending 및 isCanceled 논리식 무결성 검증
// ----------------------------------------------------
console.log('--- 1. 논리식 판정 시뮬레이션 (롤백 버그 차단 검증) ---');

function evaluateStatusBooleans(status) {
    const curStatus = status || 'pending';
    const isApproved = (curStatus === 'approved' || curStatus === '서류준비 & 접수대기' || curStatus === '서류제출 & 접수예정' || curStatus === '승인 완료');
    const isUnqualified = (curStatus === 'unqualified' || curStatus === '신청요건 미달업체' || curStatus === '미달');
    const isCanceled = (curStatus === 'canceled' || curStatus === 'cancelled' || curStatus === '지원 신청 취소' || curStatus === '지원신청취소' || curStatus === '지원 사업 취소' || curStatus === '지원사업취소' || curStatus === '신청취소');
    const isRejected = (curStatus === 'rejected' || curStatus === '지원사업 탈락' || curStatus === '반려됨');
    const isGiveup = (curStatus === 'giveup' || curStatus === '지원사업 포기');
    const isPending = !isApproved && !isUnqualified && !isCanceled && !isRejected && !isGiveup;
    return { isApproved, isUnqualified, isCanceled, isRejected, isGiveup, isPending };
}

const canceledEval = evaluateStatusBooleans('canceled');
testAssert(
    'status: "canceled" 시 isCanceled는 true이고 isPending은 false여야 함',
    canceledEval.isCanceled === true && canceledEval.isPending === false,
    `isCanceled: ${canceledEval.isCanceled}, isPending: ${canceledEval.isPending}`
);

const koreanEval = evaluateStatusBooleans('지원 신청 취소');
testAssert(
    '한글 status: "지원 신청 취소" 시 isCanceled는 true이고 isPending은 false여야 함',
    koreanEval.isCanceled === true && koreanEval.isPending === false
);

const pendingEval = evaluateStatusBooleans('pending');
testAssert(
    'status: "pending" 시 isPending은 true이고 isCanceled는 false여야 함',
    pendingEval.isPending === true && pendingEval.isCanceled === false
);

// ----------------------------------------------------
// 2. app.js 코드 내 드롭다운 6개 순서 무결성 검증
// ----------------------------------------------------
console.log('\n--- 2. 드롭다운 6개 순서 무결성 검증 (목록 카드 & 수정 모달) ---');

const expectedOrderRegex = /⏳\s*사업시행 전 사전등록업체[\s\S]*?📑\s*서류준비 & 접수대기[\s\S]*?⚠️\s*신청요건 미달업체[\s\S]*?🗑️\s*지원 신청 취소[\s\S]*?❌\s*지원사업 탈락[\s\S]*?🚫\s*지원사업 포기/;

testAssert(
    'openEditApplicationModal 내 6개 드롭다운 순서 일치',
    expectedOrderRegex.test(appJs.slice(appJs.indexOf('id="edit-app-status"'), appJs.indexOf('id="edit-app-status"') + 1500)),
    '수정 모달 드롭다운 순서가 대표님 지시와 다릅니다.'
);

testAssert(
    'renderAdminDashboardMob 내 6개 드롭다운 순서 일치',
    expectedOrderRegex.test(appJs.slice(appJs.indexOf('select-app-status-mob'), appJs.indexOf('select-app-status-mob') + 1500)),
    '목록 카드 드롭다운 순서가 대표님 지시와 다릅니다.'
);

// ----------------------------------------------------
// 3. 점주 및 영업자 마이페이지 뱃지 렌더러 시뮬레이션
// ----------------------------------------------------
console.log('\n--- 3. getAppStatusBadgeHtmlMob 뱃지 렌더러 검증 ---');

testAssert(
    'getAppStatusBadgeHtmlMob 내 지원 신청 취소 뱃지 코드 장착',
    appJs.includes("preBadgeHtml = '<span style=\"background: #f5f3ff; color: #7c3aed; border: 1.5px solid #c4b5fd; padding: 4px 10px; border-radius: 9999px; font-size: 0.88rem; font-weight: 700; display: inline-flex; align-items: center; gap: 4px;\"><i class=\"fa-solid fa-trash-can\"></i> 지원 신청 취소</span>';")
);

// ----------------------------------------------------
// 4. 엑셀(CSV) 다운로드 2개 함수 연동 검증
// ----------------------------------------------------
console.log('\n--- 4. 엑셀(CSV) 매퍼 연동 검증 ---');

testAssert(
    'getProgressStatusLabel 내 canceled 매핑 코드 장착',
    appJs.includes("if (status === 'canceled' || status === 'cancelled' || status === '지원 신청 취소' || status === '지원신청취소' || status === '지원 사업 취소' || status === '지원사업취소' || status === '신청취소') return '지원 신청 취소';")
);

testAssert(
    'sortedApps.map 내 canceled 매핑 코드 장착',
    appJs.includes("else if (a.status === 'canceled' || a.status === 'cancelled' || a.status === '지원 신청 취소' || a.status === '지원신청취소' || a.status === '지원 사업 취소' || a.status === '지원사업취소' || a.status === '신청취소') statusText = '지원 신청 취소';")
);

// ----------------------------------------------------
// 5. DataStore 및 updateApplicationStatusMob 상태 매핑 검증
// ----------------------------------------------------
console.log('\n--- 5. DataStore 및 알림 토스트 연동 검증 ---');

testAssert(
    'data-store.js updateApplicationStatus 내 canceled 색상 매핑 장착',
    dataStoreJs.includes("newStatus === 'canceled' || newStatus === 'cancelled' || newStatus === '지원 신청 취소'")
);

testAssert(
    'app.js updateApplicationStatusMob 내 canceled 토스트 라벨 장착',
    appJs.includes("statusLabel = '지원 신청 취소';")
);

// ----------------------------------------------------
// 6. SYSTEM_BLUEPRINT.md 헌법 개정 검증
// ----------------------------------------------------
console.log('\n--- 6. SYSTEM_BLUEPRINT.md 설계도 헌법 개정 검증 ---');

testAssert(
    'SYSTEM_BLUEPRINT.md BP-03 심사 상태 6대 상태 등재',
    blueprintMd.includes("app.status`: `pending`, `approved`, `unqualified`, `canceled`, `rejected`, `giveup`")
);

testAssert(
    'SYSTEM_BLUEPRINT.md BP-05 표준 메뉴 3번 6대 심사 상태 개정',
    blueprintMd.includes("온라인 간편 지원 접수건 6대 심사 상태 관리")
);

console.log('\n========================================================');
console.log(`🎉 전수 검증 결과: 통과 ${passCount}건, 실패 ${failCount}건`);
console.log('========================================================');

if (failCount > 0) {
    process.exit(1);
} else {
    process.exit(0);
}
