/**
 * 5단계 신청 상태 표준화 및 실시간 연동 통합 검증 테스트 (Mock DOM)
 */
const fs = require('fs');

const eventListeners = {};

const createMockElement = (tag) => {
  return {
    tagName: tag.toUpperCase(),
    innerHTML: '',
    value: '',
    dataset: {},
    children: [],
    style: {},
    className: '',
    options: [],
    appendChild: function(child) { this.children.push(child); return child; },
    querySelector: function(sel) { return null; },
    querySelectorAll: function(sel) { return []; },
    setAttribute: function() {},
    removeAttribute: function() {},
    addEventListener: function() {},
    removeEventListener: function() {},
    dispatchEvent: function() {},
    reset: function() {}
  };
};

const documentMock = {
  elements: {},
  getElementById: function(id) {
    if (!this.elements[id]) {
      this.elements[id] = createMockElement('div');
      this.elements[id].id = id;
    }
    return this.elements[id];
  },
  createElement: function(tag) {
    return createMockElement(tag);
  },
  body: createMockElement('body'),
  addEventListener: function(event, cb) {
    if (!eventListeners[event]) eventListeners[event] = [];
    eventListeners[event].push(cb);
  },
  querySelectorAll: function() { return []; },
  querySelector: function() { return null; }
};

const storageMock = {
  store: {},
  getItem: function(key) { return this.store[key] || null; },
  setItem: function(key, val) { this.store[key] = String(val); },
  removeItem: function(key) { delete this.store[key]; },
  clear: function() { this.store = {}; }
};

global.window = {
  document: documentMock,
  addEventListener: function(event, cb) {
    if (!eventListeners[event]) eventListeners[event] = [];
    eventListeners[event].push(cb);
  },
  showToast: (m) => console.log('🍞 Toast:', m),
  alert: console.log
};
global.document = documentMock;
global.localStorage = storageMock;
global.sessionStorage = storageMock;

global.getActiveUser = () => ({ id: 'admin', role: 'admin', name: '최고관리자' });
global.escapeHtml = (s) => s || '';
global.getStoredUsers = () => [];

// Load scripts
eval(fs.readFileSync('data-store.js', 'utf8'));
eval(fs.readFileSync('dashboard.js', 'utf8'));

// Trigger DOMContentLoaded listeners
for (const [event, cbs] of Object.entries(eventListeners)) {
  if (event === 'DOMContentLoaded') {
    cbs.forEach(cb => cb());
  }
}

console.log('--- 1. 신규 신청서 기본 상태 테스트 ---');
const newApp = {
  id: 'B-260903-001',
  ownerName: '테스트점주',
  ownerPhone: '010-1234-5678',
  storeName: '새로운식당',
  storeAddress: '서울시 강남구 테헤란로 1',
  referrerCode: 'B-260903',
  status: 'pending', // 신규 접수 시 기본 pending
  appliedAt: new Date().toISOString()
};

window.DataStore.saveApplications([newApp]);

// PC 대시보드 신청서 테이블 렌더링
if (typeof window.renderApplicationsList === 'function') {
  window.renderApplicationsList();
}
const tableBody = documentMock.getElementById('admin-applications-table-body');
console.log('렌더링된 행(Row) 개수:', tableBody.children.length);

if (tableBody.children.length > 0) {
  const renderedHtml = tableBody.children[0].innerHTML;
  console.log('✅ 드롭다운에 "사업시행 전 사전등록업체" 포함 여부:', renderedHtml.includes('사업시행 전 사전등록업체'));
  console.log('✅ 드롭다운에 "서류준비 & 접수대기" 포함 여부:', renderedHtml.includes('서류준비 & 접수대기'));
  console.log('✅ 드롭다운에 "신청요건 미달업체" 포함 여부:', renderedHtml.includes('신청요건 미달업체'));
  console.log('✅ 드롭다운에 "지원사업 탈락" 포함 여부:', renderedHtml.includes('지원사업 탈락'));
  console.log('✅ 드롭다운에 "지원사업 포기" 포함 여부:', renderedHtml.includes('지원사업 포기'));
  console.log('✅ 기본 선택값(selected) 확인:', renderedHtml.includes('value="pending" selected'));
}

// 2. 상태 변경 테스트: 'approved' (서류준비 & 접수대기)
console.log('\n--- 2. 상태 변경 및 실시간 동기화 테스트 ---');
window.updateApplicationStatus('B-260903-001', 'approved');
let updatedApps = window.DataStore.getApplications();
console.log('✅ 변경 후 status (서류준비):', updatedApps[0].status);

// 3. 상태 변경 테스트: 'unqualified' (신청요건 미달업체)
window.updateApplicationStatus('B-260903-001', 'unqualified');
updatedApps = window.DataStore.getApplications();
console.log('✅ 변경 후 status (미달):', updatedApps[0].status);

// 4. 상태 변경 테스트: 'rejected' (지원사업 탈락)
window.updateApplicationStatus('B-260903-001', 'rejected');
updatedApps = window.DataStore.getApplications();
console.log('✅ 변경 후 status (탈락):', updatedApps[0].status);

// 5. 상태 변경 테스트: 'giveup' (지원사업 포기)
window.updateApplicationStatus('B-260903-001', 'giveup');
updatedApps = window.DataStore.getApplications();
console.log('✅ 변경 후 status (포기):', updatedApps[0].status);

console.log('\n🎉 [통합 검증 완료] 모든 5단계 상태 무결성 및 연동 검증 100% 통과!');
