const fs = require('fs');
const jsCode = fs.readFileSync('dashboard.js', 'utf8');

global.window = {
  safeHtmlForEditApp: (s) => s
};
let localStorageMap = {};
global.localStorage = {
  getItem: (k) => localStorageMap[k] || null,
  setItem: (k, v) => { localStorageMap[k] = v; }
};

const fnCode = jsCode.substring(
  jsCode.indexOf('window.getAppStatusBadgeHtml = function'),
  jsCode.indexOf('window.toggleInquiryStatus = function')
);

eval(fnCode);

// Mock users with an item modified in Admin Dashboard
localStorageMap['users'] = JSON.stringify([
  {
    id: 'biz01',
    role: 'business',
    bizCode: 'B-260903',
    items: [
      {
        id: 'item-999',
        name: '영수네치킨',
        phone: '010-1234-5678',
        receiptStatus: '접수완료',
        progressStatus: '대상자선정',
        assignedConstructorName: '대한간판'
      }
    ]
  }
]);

// Sample application that only has basic application info (no receiptStatus directly on app)
const sampleApp = {
  id: 'B-260903-001',
  storeName: '영수네치킨',
  ownerPhone: '010-1234-5678',
  status: '서류준비 & 접수대기'
};

// 1. Business user test (Should be clean single badge)
localStorageMap['activeUser'] = JSON.stringify({ id: 'biz01', role: 'business' });
const bizHtml = global.window.getAppStatusBadgeHtml(sampleApp);
console.log('1. Business User Badge - Is Single Badge?:', !bizHtml.includes('공단 실시간 진행상황'));

// 2. Normal user test (Should automatically fall back to users.items matching and show dual card)
localStorageMap['activeUser'] = JSON.stringify({ id: '01012345678', role: 'user', name: '김영수' });
const userHtml = global.window.getAppStatusBadgeHtml(sampleApp);
console.log('2. Normal User Badge - Has Real-time Dual Card?:', 
  userHtml.includes('공단 실시간 진행상황') && 
  userHtml.includes('공단 접수완료') && 
  userHtml.includes('대상자선정') && 
  userHtml.includes('대한간판')
);
console.log('\nGenerated HTML for Normal User:');
console.log(userHtml);
