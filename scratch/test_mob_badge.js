const fs = require('fs');
const appCode = fs.readFileSync('app.js', 'utf8');

global.window = {
  escapeHtml: (s) => s
};
let localStorageMap = {};
global.localStorage = {
  getItem: (k) => localStorageMap[k] || null,
  setItem: (k, v) => { localStorageMap[k] = v; }
};

const fnCode = appCode.substring(
  appCode.indexOf('function getAppStatusBadgeHtmlMob(statusObj)'),
  appCode.indexOf('function getReceiptStatusBadgeHtmlMob(status)')
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

const sampleApp = {
  id: 'B-260903-001',
  storeName: '영수네치킨',
  ownerPhone: '010-1234-5678',
  status: '서류준비 & 접수대기'
};

// 1. Business user test (Should be single preBadge)
localStorageMap['activeUser'] = JSON.stringify({ id: 'biz01', role: 'business' });
const bizHtml = getAppStatusBadgeHtmlMob(sampleApp);
console.log('1. Mobile Business User Badge - Is Single Badge?:', !bizHtml.includes('공단 실시간 진행상황'));

// 2. Normal user test (Should show real-time dual status card)
localStorageMap['activeUser'] = JSON.stringify({ id: '01012345678', role: 'user', name: '김영수' });
const userHtml = getAppStatusBadgeHtmlMob(sampleApp);
console.log('2. Mobile Normal User Badge - Has Real-time Dual Card?:', 
  userHtml.includes('공단 실시간 진행상황') && 
  userHtml.includes('공단 접수완료') && 
  userHtml.includes('대상자선정') && 
  userHtml.includes('대한간판')
);
console.log('\nGenerated Mobile HTML for Normal User:');
console.log(userHtml);
