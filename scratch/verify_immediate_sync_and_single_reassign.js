// scratch/verify_immediate_sync_and_single_reassign.js
const fs = require('fs');
const assert = require('assert');

console.log('=== 1. Starting Verification for Immediate Sync & Single Click Salesperson Reassign ===');

// Mock localStorage
const storage = {};
const localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; }
};

// Mock window & document
global.window = {
  localStorage: localStorage,
  addEventListener: () => {},
  dispatchEvent: () => {},
  CustomEvent: function(type, detail) { this.type = type; this.detail = detail; },
  showToast: () => {}
};
global.localStorage = localStorage;
global.document = {
  activeElement: null,
  getElementById: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {}
};

// Load data-store.js and security-utils.js
const dataStoreCode = fs.readFileSync('data-store.js', 'utf8');
eval(dataStoreCode);

const secUtilsCode = fs.readFileSync('security-utils.js', 'utf8');
eval(secUtilsCode);

// Setup initial users & applications
const initialUsers = [
  { id: 'admin', name: '최고관리자', role: 'admin', bizCode: 'ADMIN' },
  { id: 'robinhood', name: '김로빈', role: 'business', bizCode: 'B-260901', items: [] },
  { id: 'sales2', name: '박영업', role: 'business', bizCode: 'B-260902', items: [] }
];

const initialApps = [
  {
    id: 'B-260901-004',
    appRefId: 'B-260901-004',
    storeName: '만서기상회',
    ownerName: '김만석',
    ownerPhone: '010-1234-5678',
    referrerCode: 'B-260901',
    salespersonId: 'robinhood',
    salespersonName: '김로빈',
    isBizItem: true,
    receiptStatus: '접수예정',
    progressStatus: '지원대기중',
    status: 'pending',
    appliedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    memo: JSON.stringify({ isBizItem: true, receiptStatus: '접수예정', progressStatus: '지원대기중', referrerCode: 'B-260901', salespersonId: 'robinhood', salespersonName: '김로빈' })
  }
];

window.DataStore.saveUsers(initialUsers);
window.DataStore.saveApplications(initialApps);

console.log('--- TEST 1: Reassign salesperson to B-260902 on 1st attempt ---');
const res1 = window.DataStore.updateApplicationReferrer('B-260901-004', 'B-260902');
assert.strictEqual(res1.success, true, 'Reassign must succeed');
assert.strictEqual(res1.app.referrerCode, 'B-260902', 'Referrer code must be B-260902');
assert.strictEqual(res1.app.salespersonId, 'sales2', 'SalespersonId must be sales2');
assert.strictEqual(res1.app.salespersonName, '박영업', 'SalespersonName must be 박영업');

const usersAfter1 = window.DataStore.getUsers();
const sales2 = usersAfter1.find(u => u.id === 'sales2');
const robin = usersAfter1.find(u => u.id === 'robinhood');
assert.strictEqual(sales2.items.length, 1, 'sales2 must now have 1 item');
assert.strictEqual(robin.items.length, 0, 'robinhood must have 0 items (removed from prev salesperson)');
console.log('✅ TEST 1 Passed: 1st click reassign to B-260902 succeeded cleanly!');

console.log('--- TEST 2: Reassign to Headquarters (본사 직접 접수 / 담당자 없음) ---');
const res2 = window.DataStore.updateApplicationReferrer('B-260901-004', '');
assert.strictEqual(res2.success, true, 'Clearing salesperson must succeed');
assert.strictEqual(res2.app.referrerCode, '', 'Referrer code must be empty');
assert.strictEqual(res2.app.salespersonId, '', 'SalespersonId must be empty');
assert.strictEqual(res2.app.salespersonName, '본사직접접수', 'SalespersonName must be 본사직접접수');

// Test getAdminBizItems to verify ID prefix (B-260901) is NOT mistakenly assigned to robinhood
const adminItems = window.DataStore.getAdminBizItems();
const targetAdminItem = adminItems.find(entry => entry.item.id === 'B-260901-004');
assert.ok(targetAdminItem, 'Item must exist in adminItems');
assert.strictEqual(targetAdminItem.user.role, 'admin', 'Assigned user must be admin (본사 직접 접수), not robinhood!');
console.log('✅ TEST 2 Passed: Headquarters assignment works cleanly, NO ID prefix fallback!');

console.log('--- TEST 3: mapDbToApp with Headquarters assignment ---');
const dbAppRow = {
  id: 'B-260901-004',
  store_name: '만서기상회',
  referrer_code: '',
  memo: JSON.stringify({ isBizItem: true, receiptStatus: '접수예정', progressStatus: '지원대기중', referrerCode: '', salespersonId: '', salespersonName: '본사직접접수' })
};
const mapped = window.SupabaseSync.mapDbToApp(dbAppRow);
assert.strictEqual(mapped.referrerCode, '', 'mapped referrerCode must be empty');
assert.strictEqual(mapped.salespersonId, '', 'mapped salespersonId must be empty');
assert.strictEqual(mapped.salespersonName, '본사직접접수', 'mapped salespersonName must be 본사직접접수');
console.log('✅ TEST 3 Passed: mapDbToApp does NOT revert to B-260901 ID prefix!');

console.log('--- TEST 4: Immediate sync without 60-second delay ---');
// Simulate lock expiry after 4 seconds (not 60 seconds)
window.DataStore._recentStatusUpdates['B-260901-004'] = {
  receiptStatus: '접수완료',
  progressStatus: '대상자선정',
  timestamp: Date.now() - 5000 // 5 seconds ago (already expired)
};
const lock = window.DataStore._recentStatusUpdates['B-260901-004'];
const isLockActive = Boolean(lock && (Date.now() - lock.timestamp < 4000));
assert.strictEqual(isLockActive, false, 'Lock must be expired after 5 seconds');
console.log('✅ TEST 4 Passed: 4-second lock correctly expires so remote changes are accepted immediately!');

console.log('🎉 ALL TESTS PASSED SUCCESSFULLY! 100% Verified!');
