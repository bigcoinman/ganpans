const fs = require('fs');
const assert = require('assert');

// Setup mock browser environment
const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) { return store[key] !== undefined ? store[key] : null; },
    setItem: function(key, val) { store[key] = String(val); },
    removeItem: function(key) { delete store[key]; },
    clear: function() { store = {}; },
    _dump: function() { return store; }
  };
})();

global.localStorage = localStorageMock;
global.sessionStorage = localStorageMock;
global.alert = function(msg) {};
global.confirm = function(msg) { return true; };
global.window = {
  localStorage: localStorageMock,
  sessionStorage: localStorageMock,
  addEventListener: function() {},
  removeEventListener: function() {},
  dispatchEvent: function() {},
  CustomEvent: function(type, detail) { return { type, detail }; },
  supabaseClient: {
    from: function(table) {
      return {
        delete: function() {
          return {
            eq: async function(col, val) {
              console.log(`  [Mock Supabase DB] DELETE from ${table} where ${col} = ${val}`);
              return { error: null };
            }
          };
        }
      };
    }
  }
};
global.document = {
  readyState: 'complete',
  addEventListener: function() {},
  querySelector: function() { return null; },
  querySelectorAll: function() { return []; },
  getElementById: function() { return null; },
  createElement: function() {
    return {
      appendChild: function() {},
      style: {},
      setAttribute: function() {},
      classList: { add: function() {}, remove: function() {} }
    };
  },
  body: { appendChild: function() {} }
};
global.requestAnimationFrame = function(cb) { return setTimeout(cb, 0); };
global.window.requestAnimationFrame = global.requestAnimationFrame;
global.window.document = global.document;

// Seed 5 ghost items in localStorage
const ghostApps = [
  { id: 'APP-GHOST-1', storeName: '진수건어물', ownerName: '김진수' },
  { id: 'APP-GHOST-2', storeName: '성기네식당', ownerName: '박성기' },
  { id: 'APP-GHOST-3', storeName: '홍미용실', ownerName: '홍미용' },
  { id: 'APP-GHOST-4', storeName: '기수정육점', ownerName: '이기수' },
  { id: 'APP-GHOST-5', storeName: '진수건업', ownerName: '김진수' },
  { id: 'APP-NORMAL-1', storeName: '정상식당', ownerName: '정상인' }
];
localStorage.setItem('applications', JSON.stringify(ghostApps));

const testUsers = [
  {
    id: 'user_sales',
    name: '김영업',
    role: 'business',
    items: [
      { id: 'APP-GHOST-1', name: '진수건어물' },
      { id: 'APP-NORMAL-1', name: '정상식당' }
    ]
  },
  {
    id: 'user_delete_target',
    name: '탈퇴회원',
    role: 'normal',
    phone: '010-9999-8888',
    items: []
  }
];
localStorage.setItem('users', JSON.stringify(testUsers));

const testInquiries = [
  { id: 'INQ-1', name: '홍길동', phone: '010-1234-5678', content: '간판 문의' },
  { id: 'INQ-DEL', name: '삭제문의', phone: '010-9999-1111', content: '삭제될 문의' }
];
localStorage.setItem('inquiries', JSON.stringify(testInquiries));

// Load data-store.js and security-utils.js
const secUtilsCode = fs.readFileSync('security-utils.js', 'utf8');
eval(secUtilsCode);
window.SupabaseSync = window.SecurityUtils || window.SupabaseSync;

const dataStoreCode = fs.readFileSync('data-store.js', 'utf8');
eval(dataStoreCode);

console.log('========================================================');
console.log('🧪 [4대 완전 삭제 & 부활 영구 방어 종합 검증]');
console.log('========================================================\n');

// 1. 5대 유령 데이터 자동 청소 검증
console.log('--- [검증 1] 5대 유령 데이터 자동 청소 및 영구 블랙리스트 등록 ---');
const appsAfterCleanse = window.DataStore.getApplications();
console.log('청소 후 남은 신청서 개수:', appsAfterCleanse.length);
assert.strictEqual(appsAfterCleanse.length, 1, '정상식당 1건만 남아야 함');
assert.strictEqual(appsAfterCleanse[0].storeName, '정상식당', '정상식당만 남아야 함');

const deletedAppIds = JSON.parse(localStorage.getItem('deleted_app_ids') || '[]');
console.log('블랙리스트에 등록된 유령 ID 개수:', deletedAppIds.length);
assert(deletedAppIds.includes('APP-GHOST-1'), '진수건어물 블랙리스트 등록 확인');
assert(deletedAppIds.includes('APP-GHOST-5'), '진수건업 블랙리스트 등록 확인');

const usersAfterCleanse = window.DataStore.getUsers();
const salesUser = usersAfterCleanse.find(u => u.id === 'user_sales');
assert.strictEqual(salesUser.items.length, 1, '영업자 items에서도 유령건 0건 삭제 확인');
assert.strictEqual(salesUser.items[0].name, '정상식당', '정상식당만 남아야 함');
console.log('✅ [통과] 5대 유령 데이터 및 연계 물건 100% 완전 소멸 & 블랙리스트 차단 확인\n');

// 2. 신청서목록의 신청업체 완전 삭제 (deleteApplication)
console.log('--- [검증 2] 신청서목록의 신청업체 완전 삭제 (deleteApplication) ---');
const delAppRes = window.DataStore.deleteApplication('APP-NORMAL-1');
assert.strictEqual(delAppRes.success, true, '신청서 삭제 성공 확인');
const appsAfterDel = window.DataStore.getApplications();
assert.strictEqual(appsAfterDel.length, 0, '신청서 목록 0건 확인');
const salesAfterDel = window.DataStore.getUsers().find(u => u.id === 'user_sales');
assert.strictEqual(salesAfterDel.items.length, 0, '영업자 items에서도 0건 완전 소멸');
const deletedAppIdsFinal = JSON.parse(localStorage.getItem('deleted_app_ids') || '[]');
assert(deletedAppIdsFinal.includes('APP-NORMAL-1'), 'APP-NORMAL-1 블랙리스트 등록 확인');
console.log('✅ [통과] 신청업체 삭제 시 applications 0건, users.items 0건, 블랙리스트 완벽 등록 확인\n');

// 3. 회원정보관리의 회원 완전 삭제 (deleteUser)
console.log('--- [검증 3] 회원정보관리의 회원 완전 삭제 (deleteUser) ---');
const delUserRes = window.DataStore.deleteUser('user_delete_target');
assert.strictEqual(delUserRes.success, true, '회원 삭제 성공 확인');
const usersAfterDel = window.DataStore.getUsers();
const foundDeletedUser = usersAfterDel.find(u => u.id === 'user_delete_target');
assert.strictEqual(foundDeletedUser, undefined, '회원 목록에서 완벽 소멸');
const deletedUserIds = JSON.parse(localStorage.getItem('deleted_user_ids') || '[]');
assert(deletedUserIds.includes('user_delete_target'), 'deleted_user_ids 블랙리스트 등록 확인');
console.log('✅ [통과] 회원 삭제 시 users 0건 완벽 소멸 & 블랙리스트 등록 확인\n');

// 4. 시공업체 진행현황의 배정취소 (cancelJobConstructorAssignment)
console.log('--- [검증 4] 시공업체 진행현황의 배정취소 (cancelJobConstructorAssignment) ---');
const appWithConst = {
  id: 'APP-JOB-1',
  storeName: '배정업체',
  assignedConstructorId: 'const_1',
  assignedConstructorName: '한국간판',
  constructionStatus: 'in_construction',
  signDraftPhotos: ['draft1.jpg'],
  draftStatus: 'owner_approved'
};
localStorage.setItem('applications', JSON.stringify([appWithConst]));
localStorage.setItem('users', JSON.stringify([{
  id: 'sales_boss',
  role: 'business',
  items: [{ id: 'APP-JOB-1', assignedConstructorId: 'const_1', signDraftPhotos: ['draft1.jpg'] }]
}]));

window.cancelJobConstructorAssignment('APP-JOB-1');
const appsAfterCancel = window.DataStore.getApplications();
const jobApp = appsAfterCancel.find(a => a.id === 'APP-JOB-1');
assert.strictEqual(jobApp.assignedConstructorId, null, '시공사 ID null 확인');
assert.strictEqual(jobApp.assignedConstructorName, null, '시공사 Name null 확인');
assert.strictEqual(jobApp.constructionStatus, 'before_construction', '시공상태 초기화 확인');
assert.deepStrictEqual(jobApp.signDraftPhotos, [], '시안 사진 0장 완전 소멸 확인');
assert.strictEqual(jobApp.draftStatus, 'pending', '시안 상태 pending 초기화 확인');

const bossUser = window.DataStore.getUsers().find(u => u.id === 'sales_boss');
const bossItem = bossUser.items.find(i => i.id === 'APP-JOB-1');
assert.strictEqual(bossItem.assignedConstructorId, null, '영업자 아이템 시공사 ID null 확인');
assert.deepStrictEqual(bossItem.signDraftPhotos, [], '영업자 아이템 시안 사진 0장 확인');
console.log('✅ [통과] 시공사 배정취소 시 시공사 정보/시안 찌꺼기 100% 초기화 및 영업자 화면 동기화 확인\n');

// 5. 3초 간편문의 내용 완전 삭제 (deleteInquiry)
console.log('--- [검증 5] 3초 간편문의 내용 완전 삭제 (deleteInquiry) ---');
const delInqRes = window.DataStore.deleteInquiry('INQ-DEL');
assert.strictEqual(delInqRes.success, true, '문의 삭제 성공 확인');
const inqsAfterDel = window.DataStore.getInquiries();
assert.strictEqual(inqsAfterDel.length, 1, '남은 문의 1건 확인');
assert.strictEqual(inqsAfterDel[0].id, 'INQ-1', 'INQ-1만 남아야 함');
const deletedInqIds = JSON.parse(localStorage.getItem('deleted_inquiry_ids') || '[]');
assert(deletedInqIds.includes('INQ-DEL'), 'INQ-DEL 블랙리스트 등록 확인');
console.log('✅ [통과] 3초 간편문의 삭제 시 inquiries 0건 소멸 & 블랙리스트 등록 확인\n');

console.log('========================================================');
console.log('🎉 [전수 검증 성공] 4대 삭제 도메인 완전 영구 삭제 & 부활 방어 100% 통과!');
console.log('========================================================');
