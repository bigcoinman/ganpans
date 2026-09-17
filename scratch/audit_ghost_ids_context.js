const fs = require('fs');

const appJs = fs.readFileSync('app.js', 'utf8');
const lines = appJs.split('\n');

const ghostIds = [
  'modal-edit-application',
  'app-menu-trigger',
  'mobile-upload-form-mob',
  'mob-photo-previews-mob',
  'mob-photo-count-mob',
  'mob-photos-input-mob',
  'mob-camera-input-mob',
  'mobile-file-zone-mob',
  'btn-submit-biz-item-mob',
  'mob-item-name-mob',
  'mob-item-phone-mob',
  'mob-item-address-mob',
  'pc-footer-btn-inquiry',
  'nav-search-btn',
  'm-nav-search',
  'mobile-header-refresh-btn',
  'biz-auto-badge',
  'owner-sms-auth-group',
  'btn-owner-sms-auth',
  'owner-phone-check-msg'
];

console.log('=== [유령 ID가 사용된 라인 및 맥락 분석] ===');
ghostIds.forEach(id => {
  console.log(`\n🔍 [ID: ${id}]`);
  lines.forEach((l, idx) => {
    if (l.includes(`'${id}'`) || l.includes(`"${id}"`)) {
      console.log(`  라인 ${idx + 1}: ${l.trim().slice(0, 120)}`);
    }
  });
});
