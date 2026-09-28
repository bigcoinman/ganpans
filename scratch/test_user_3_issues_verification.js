const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environment
global.window = global;
global.localStorage = {
  _data: {},
  getItem: function (k) { return this._data[k] || null; },
  setItem: function (k, v) { this._data[k] = String(v); },
  removeItem: function (k) { delete this._data[k]; },
  clear: function () { this._data = {}; }
};
let confirmCallCount = 0;
let lastConfirmMsg = '';
global.alert = function (msg) {};
global.confirm = function (msg) {
  confirmCallCount++;
  lastConfirmMsg = msg;
  return true;
};
global.CustomEvent = class { constructor(type, detail) { this.type = type; this.detail = detail; } };
global.dispatchEvent = function (ev) {};
global.document = {
  getElementById: function (id) {
    return {
      style: {},
      querySelector: () => null,
      querySelectorAll: () => [],
      addEventListener: () => {},
      focus: () => {}
    };
  },
  querySelectorAll: function (sel) { return []; },
  createElement: function (tag) {
    return {
      style: {},
      classList: { contains: () => false, add: () => {}, remove: () => {} },
      appendChild: () => {},
      insertAdjacentElement: () => {}
    };
  },
  body: { appendChild: () => {} }
};

// Supabase mock
global.SupabaseSync = {
  updateApplication: async function (id, payload) { return { data: payload }; },
  upsertApplication: async function (app) { return { data: app }; },
  updateUser: async function (id, payload) { return { data: payload }; },
  upsertUser: async function (u) { return { data: u }; }
};
global.supabaseClient = {
  from: function (tbl) {
    return {
      update: function (p) { return { eq: function () { return Promise.resolve({ error: null }); } }; },
      select: function () { return Promise.resolve({ data: [], error: null }); }
    };
  }
};

// Load data-store.js and app.js
const dataStoreCode = fs.readFileSync(path.join(__dirname, '../data-store.js'), 'utf8');
eval(dataStoreCode);

console.log('========================================================');
console.log('🧪 [사용자 3대 요구사항 정밀 검증 스크립트]');
console.log('========================================================\n');

// 1. 신청서 최초 접수 데이터 규격 검증 (문제 3)
console.log('▶ [검증 1] 신규 신청서 접수 시 기본 상태값 검증');
const salesperson = { id: 'sales_kim', name: '김만석', role: 'business', bizCode: 'B-260905', items: [] };
const constructor = { id: 'const_mido', name: '미도시공', role: 'constructor', businessName: '미도시공업체', items: [] };
const admin = { id: 'admin', name: '최고관리자', role: 'admin', items: [] };

window.localStorage.clear();
window.DataStore.saveUsers([salesperson, constructor, admin]);

const testApp = {
  id: 'B-260905-005',
  userId: 'user_01099543241',
  ownerName: '유민상',
  ownerPhone: '01099543241',
  storeName: '민상기업',
  storeAddress: '경기도 동두천시 생연동 12874',
  referrerCode: 'B-260905',
  salespersonId: 'sales_kim',
  salespersonName: '김만석',
  status: '서류준비 & 접수대기',
  isBizItem: false,
  receiptStatus: '접수예정',
  progressStatus: '지원대기중',
  constructionStatus: 'before_construction',
  appliedAt: new Date().toISOString()
};
window.DataStore.saveApplications([testApp]);

let loaded = window.DataStore.getApplications().find(a => a.id === testApp.id);
assert.strictEqual(loaded.receiptStatus, '접수예정', '초기 receiptStatus는 접수예정이어야 합니다.');
assert.strictEqual(loaded.progressStatus, '지원대기중', '초기 progressStatus는 지원대기중이어야 합니다.');
console.log('  ✅ [통과] 신규 신청서 초기 상태: receiptStatus=접수예정, progressStatus=지원대기중');

// 2. 최고관리자 영업물건 승격 활성화 (문제 3)
console.log('\n▶ [검증 2] 영업물건 승격(toggleBizItem) 시 기본 UI 상태값 검증');
window.DataStore.toggleBizItem(testApp.id);
loaded = window.DataStore.getApplications().find(a => a.id === testApp.id);
assert.strictEqual(loaded.isBizItem, true, 'isBizItem이 true로 승격되어야 합니다.');
assert.strictEqual(loaded.receiptStatus, '접수예정', '승격 후 receiptStatus는 접수예정이어야 합니다.');
assert.strictEqual(loaded.progressStatus, '지원대기중', '승격 후 progressStatus는 지원대기중이어야 합니다.');

const adminBizItems = window.DataStore.getAdminBizItems();
assert.strictEqual(adminBizItems.length, 1, '영업물건 진행상황 목록에 1건 등록되어야 합니다.');
assert.strictEqual(adminBizItems[0].item.receiptStatus, '접수예정', '영업물건 진행상황의 접수 상태는 접수예정이어야 합니다.');
assert.strictEqual(adminBizItems[0].item.progressStatus, '지원대기중', '영업물건 진행상황의 진행 상태는 지원대기중이어야 합니다.');
console.log('  ✅ [통과] 영업물건 진행상황 목록 표출: 접수=접수예정, 진행=지원대기중 정상 확인');

// 3. 시공사 미배정 상태에서 영업물건 등록 비활성화 (문제 2)
console.log('\n▶ [검증 3] 시공사 미배정 상태에서 영업물건 해제 시 오발화 팝업 부존재 검증');
confirmCallCount = 0;
lastConfirmMsg = '';
window.DataStore.toggleBizItem(testApp.id);
loaded = window.DataStore.getApplications().find(a => a.id === testApp.id);
assert.strictEqual(loaded.isBizItem, false, 'isBizItem이 false로 정상 해제되어야 합니다.');
assert.strictEqual(confirmCallCount, 0, '시공사가 배정되지 않았으므로 confirm 팝업이 일체 호출되지 않아야 합니다.');
console.log('  ✅ [통과] 시공사 미배정 물건 해제 시 confirm 팝업 호출 0회 (거짓 팝업 완전 박멸 확인)');

// 4. 시공사 실제 배정 후 영업물건 등록 비활성화 시 정상 팝업 발화 및 Clean Slate 검증
console.log('\n▶ [검증 4] 실제 시공사 배정 후 해제 시 정상 팝업 및 Clean Slate 검증');
window.DataStore.toggleBizItem(testApp.id); // 다시 활성화
window.DataStore.assignConstructorToBizItem('sales_kim', testApp.id, 'const_mido');
loaded = window.DataStore.getApplications().find(a => a.id === testApp.id);
assert.strictEqual(loaded.assignedConstructorId, 'const_mido', '시공사 배정 완료');

confirmCallCount = 0;
window.DataStore.toggleBizItem(testApp.id); // 해제 시도
assert.strictEqual(confirmCallCount, 1, '실제 시공사가 배정되어 있으므로 confirm 팝업이 1회 호출되어야 합니다.');
assert.strictEqual(lastConfirmMsg.includes('미도시공'), true, '팝업에 실제 배정된 시공사명이 표기되어야 합니다.');

loaded = window.DataStore.getApplications().find(a => a.id === testApp.id);
assert.strictEqual(loaded.isBizItem, false, '관리자 확인 후 해제 완료');
assert.strictEqual(loaded.assignedConstructorId, null, '배정된 시공사 ID Clean Slate 초기화');
console.log('  ✅ [통과] 실제 시공사 배정 건은 정상 팝업 발화 및 Clean Slate 초기화 완벽 확인');

console.log('\n========================================================');
console.log('🎉 3대 문제점 전수 검증 100% 통과 완료!');
console.log('========================================================\n');
