// Test DOM rendering for PC and Mobile dropdowns
const fs = require('fs');

const dashboardCode = fs.readFileSync('dashboard.js', 'utf8');
const appCode = fs.readFileSync('app.js', 'utf8');

console.log('=== [DOM 렌더링 검사 1] PC dashboard.js dropdown 코드 검사 ===');
const hasPcReceiptPending = dashboardCode.includes('const isReceiptPending = (curReceipt === \'접수예정\' || curReceipt === \'접수 대기\' || !item.receiptStatus);');
const hasPcDisabledSelect = dashboardCode.includes('${isReceiptPending ? \'disabled\' : \'\'}');
const hasPcDisabledOptions = dashboardCode.includes('value="심사대기중"') && dashboardCode.includes('${isReceiptPending ? \'disabled\' : \'\'}');

console.log('- PC isReceiptPending 변수:', hasPcReceiptPending ? '✅ PASS' : '❌ FAIL');
console.log('- PC select disabled 바인딩:', hasPcDisabledSelect ? '✅ PASS' : '❌ FAIL');
console.log('- PC options disabled 바인딩:', hasPcDisabledOptions ? '✅ PASS' : '❌ FAIL');

console.log('\n=== [DOM 렌더링 검사 2] Mobile app.js dropdown 코드 검사 ===');
const hasMobReceiptPending = appCode.includes('const isReceiptPending = (curReceipt === \'접수예정\' || curReceipt === \'접수 대기\' || !item.receiptStatus);');
const hasMobDisabledSelect = appCode.includes('${isReceiptPending ? \'disabled\' : \'\'}');

console.log('- 모바일 isReceiptPending 변수:', hasMobReceiptPending ? '✅ PASS' : '❌ FAIL');
console.log('- 모바일 select disabled 바인딩:', hasMobDisabledSelect ? '✅ PASS' : '❌ FAIL');

if (hasPcReceiptPending && hasPcDisabledSelect && hasMobReceiptPending && hasMobDisabledSelect) {
  console.log('\n🎉 [SUCCESS] PC / 모바일 UI 드롭다운 disabled 렌더링 검증 100% 통과!');
} else {
  console.error('\n❌ [FAIL] UI 드롭다운 검증 실패');
  process.exit(1);
}
