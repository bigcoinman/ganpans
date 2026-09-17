const fs = require('fs');

const dataStoreJs = fs.readFileSync('data-store.js', 'utf8');
const lines = dataStoreJs.split('\n');

const unusedList = [
  'renderManagerConstProgress',
  'showNotification',
  'renderAllUsersList',
  'renderApplicationsList',
  'renderBizRegisteredTable',
  'renderUserApplicationsList',
  'renderInquiriesList',
  'clearAllInquiriesAdmin',
  'openAssignBizUserModalMob',
  'confirmAssignBizUserModal',
  'updateJobDraftUIInPlace',
  'deleteJobDraftPhoto',
  'deleteJobDraftAll',
  'updateJobPhotoUIInPlace',
  'deleteJobConstructionPhoto'
];

console.log('=== [data-store.js 15개 미사용 항목 위치 및 내용 분석] ===');

unusedList.forEach(fnName => {
  console.log(`\n🔍 [항목: ${fnName}]`);
  lines.forEach((l, idx) => {
    if (l.includes(fnName)) {
      console.log(`  라인 ${idx + 1}: ${l.trim().slice(0, 120)}`);
    }
  });
});
