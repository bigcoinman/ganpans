// scratch/verify_status_reassign_5_cycles.js
const assert = require('assert');

console.log('🧪 [영업물건 접수/진행 상태 및 시공사 배정 5회 사이클 전수 검증 시작]');

// LocalStorage mock
const store = {};
global.localStorage = {
  getItem: (k) => store[k] || null,
  setItem: (k, v) => { store[k] = String(v); },
  removeItem: (k) => { delete store[k]; }
};
global.sessionStorage = {
  getItem: (k) => null,
  setItem: () => {},
  removeItem: () => {}
};
global.document = {
  querySelectorAll: () => [],
  getElementById: () => null,
  activeElement: null
};
global.window = global;
global.CustomEvent = class CustomEvent { constructor(type) { this.type = type; } };
global.dispatchEvent = () => {};

// Load data-store.js
require('../data-store.js');

const initialApps = [{
  id: 'P-260929-001',
  storeName: '정은마켓',
  ownerName: '정은지',
  ownerPhone: '01038479175',
  storeAddress: '경기도 하남시 하남리 741',
  signType: '플렉스 간판',
  referrerCode: 'B-260905',
  salespersonId: 'rotiman26',
  salespersonName: '김만석',
  status: 'approved',
  isBizItem: true,
  receiptStatus: '접수예정',
  progressStatus: '지원대기중',
  memo: JSON.stringify({ isBizItem: true, receiptStatus: '접수예정', progressStatus: '지원대기중' })
}];

const initialUsers = [
  { id: 'admin', name: '최고관리자', role: 'admin' },
  { id: 'rotiman26', name: '김만석', role: 'business', bizCode: 'B-260905', items: [] },
  { id: 'wooriad', name: '우리애드', role: 'constructor', businessName: '우리애드' }
];

window.DataStore.saveApplications(initialApps);
window.DataStore.saveUsers(initialUsers);

for (let cycle = 1; cycle <= 5; cycle++) {
  console.log(`\n--- [Cycle ${cycle}] ---`);
  
  // 1. 접수: 접수완료 변경
  window.DataStore.updateItemStatus('rotiman26', 'P-260929-001', 'receipt', '접수완료');
  let apps = window.DataStore.getApplications();
  let app = apps.find(a => a.id === 'P-260929-001');
  assert.strictEqual(app.receiptStatus, '접수완료', '접수완료여야 함');
  console.log(`  1) 접수완료 변경: receipt=${app.receiptStatus}, progress=${app.progressStatus}`);
  
  // 2. 진행: 대상자선정 변경
  window.DataStore.updateItemStatus('rotiman26', 'P-260929-001', 'progress', '대상자선정');
  apps = window.DataStore.getApplications();
  app = apps.find(a => a.id === 'P-260929-001');
  assert.strictEqual(app.progressStatus, '대상자선정', '진행은 대상자선정이어야 함');
  console.log(`  2) 대상자선정 변경: receipt=${app.receiptStatus}, progress=${app.progressStatus}`);
  
  // 3. 시공사 배정 (우리애드)
  const assignRes = window.DataStore.assignConstructorToBizItem('rotiman26', 'P-260929-001', 'wooriad');
  assert.strictEqual(assignRes.success, true, '배정 성공이어야 함');
  apps = window.DataStore.getApplications();
  app = apps.find(a => a.id === 'P-260929-001');
  const memoObj = JSON.parse(app.memo);
  console.log(`  3) 시공사 배정 완료: const=${app.assignedConstructorName}, receipt=${app.receiptStatus}, progress=${app.progressStatus}, memo.progress=${memoObj.progressStatus}`);
  assert.strictEqual(app.progressStatus, '대상자선정', '시공사 배정 후 진행은 대상자선정 유지');
  assert.strictEqual(memoObj.progressStatus, '대상자선정', 'memo.progressStatus는 대상자선정이어야 함');
  assert.strictEqual(app.assignedConstructorId, 'wooriad', '배정 시공사는 wooriad여야 함');
  
  // 4. getAdminBizItems 조회 확인
  const bizItems = window.DataStore.getAdminBizItems();
  const targetItem = bizItems.find(b => b.item.id === 'P-260929-001');
  console.log(`  4) 영업물건 진행상황 목록 표출: receipt=${targetItem.item.receiptStatus}, progress=${targetItem.item.progressStatus}, const=${targetItem.item.assignedConstructorName}`);
  assert.strictEqual(targetItem.item.progressStatus, '대상자선정', '목록 표출 진행상태는 대상자선정');
  assert.strictEqual(targetItem.item.assignedConstructorName, '우리애드', '목록 표출 시공사는 우리애드');
}

console.log('\n🎉 [검증 성공] 5회 사이클 전수 검증 100% 통과!\n');
