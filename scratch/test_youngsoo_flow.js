// test_youngsoo_flow.js
const fs = require('fs');

// Mock browser environment
const localStorageData = {};
global.localStorage = {
  getItem: (k) => localStorageData[k] || null,
  setItem: (k, v) => { localStorageData[k] = String(v); },
  removeItem: (k) => { delete localStorageData[k]; },
  clear: () => { Object.keys(localStorageData).forEach(k => delete localStorageData[k]); }
};
global.alert = () => {};
global.window = {
  localStorage: global.localStorage,
  CustomEvent: function(name, opts) { this.name = name; this.detail = opts ? opts.detail : {}; },
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  alert: () => {}
};
global.document = {
  getElementById: () => null,
  body: { appendChild: () => {} },
  dispatchEvent: () => {},
  addEventListener: () => {},
  removeEventListener: () => {}
};

// Load modules
const securityUtilsCode = fs.readFileSync('./security-utils.js', 'utf8');
const dataStoreCode = fs.readFileSync('./data-store.js', 'utf8');

eval(securityUtilsCode);
eval(dataStoreCode);

console.log('=== [1] 테스트 데이터 초기화 ===');
const bizUser = {
  id: 'sales_user_1',
  name: '김영업',
  bizCode: 'B-260903',
  role: 'business',
  phone: '010-1234-5678',
  items: []
};
const adminUser = {
  id: 'admin',
  name: '최고관리자',
  role: 'admin',
  bizCode: 'ADMIN'
};

window.DataStore.saveUsers([adminUser, bizUser]);

// 1) 비회원이 영업자코드 'B-260903'으로 온라인 간편 지원 신청 제출
const guestApp = {
  id: 'B-260903-001',
  userId: 'guest',
  ownerName: '영수대표',
  ownerPhone: '010-9999-8888',
  storeName: '영수철물',
  storeAddress: '서울시 중구 을지로 123',
  referrerCode: 'B-260903',
  status: 'pending',
  isBizItem: false,
  appliedAt: new Date().toISOString()
};

window.DataStore.saveApplications([guestApp]);
console.log('비회원 신청서 생성 완료:', guestApp.id, guestApp.storeName);

// 2) 최고관리자가 "영업물건으로 변경" (isBizItem: true)
console.log('\n=== [2] 관리자가 영업물건으로 변경 ===');
window.DataStore.toggleBizItem('B-260903-001');

// 3) 최고관리자가 "접수" -> "접수완료", "진행" -> "대상자선정" 으로 변경
console.log('\n=== [3] 관리자가 접수: 접수완료, 진행: 대상자선정으로 변경 ===');
window.DataStore.updateItemStatus(bizUser.id, 'B-260903-001', 'receipt', '접수완료');
window.DataStore.updateItemStatus(bizUser.id, 'B-260903-001', 'progress', '대상자선정');

// 4) Supabase DB 저장/복원 시뮬레이션
console.log('\n=== [4] Supabase DB mapAppToDb & mapDbToApp 검증 ===');
const currentApps = window.DataStore.getApplications();
const appInStore = currentApps.find(a => a.id === 'B-260903-001');
const dbPayload = window.SupabaseSync.mapAppToDb(appInStore);
console.log('DB 저장 payload memo:', dbPayload.memo);
const restoredFromDb = window.SupabaseSync.mapDbToApp(dbPayload);
console.log('DB에서 복원된 app progressStatus:', restoredFromDb.progressStatus);
console.log('DB에서 복원된 app receiptStatus:', restoredFromDb.receiptStatus);

// 5) 영업자 대시보드에서 getBizItemsForUser 조회
console.log('\n=== [5] 영업자 대시보드 getBizItemsForUser(bizUser) 조회 검증 ===');
const bizItems = window.DataStore.getBizItemsForUser(bizUser);
console.log('영업자 물건 개수:', bizItems.length);
if (bizItems.length > 0) {
  const item = bizItems[0];
  console.log(`물건명: ${item.storeName}`);
  console.log(`접수상태: ${item.receiptStatus}`);
  console.log(`진행상태: ${item.progressStatus}`);

  const receiptOk = item.receiptStatus === '접수완료';
  const progressOk = item.progressStatus === '대상자선정';

  if (receiptOk && progressOk) {
    console.log('\n🎉 [최종 검증 성공] 영수철물 건의 접수(접수완료) 및 진행(대상자선정)이 100% 정상 일치합니다!');
    process.exit(0);
  } else {
    console.error('\n❌ [검증 실패] 일치하지 않는 상태가 있습니다!');
    process.exit(1);
  }
} else {
  console.error('\n❌ [검증 실패] 영업물건 목록이 비어있습니다!');
  process.exit(1);
}
