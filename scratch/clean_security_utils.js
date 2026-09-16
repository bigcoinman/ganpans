const fs = require('fs');

function cleanSecurityUtils() {
  let code = fs.readFileSync('security-utils.js', 'utf8');

  // Line 312
  code = code.replace(
    /try\s*\{\s*localStorage\.setItem\('applications',\s*JSON\.stringify\(localApps\)\);\s*\}\s*catch\s*\(eStorage\)\s*\{\}/g,
    `if (window.DataStore && typeof window.DataStore.saveApplications === 'function') { window.DataStore.saveApplications(localApps); }`
  );

  // Line 1637
  code = code.replace(
    /localStorage\.setItem\('inquiries',\s*JSON\.stringify\(\[\]\)\);/g,
    `if (window.DataStore && typeof window.DataStore.saveInquiries === 'function') { window.DataStore.saveInquiries([]); } else { localStorage.setItem('inquiries', JSON.stringify([])); }`
  );

  // Line 1696
  code = code.replace(
    /localStorage\.setItem\('users',\s*newUsersStr\);/g,
    `if (window.DataStore && typeof window.DataStore.saveUsers === 'function') { window.DataStore.saveUsers(freshUsers); } else { localStorage.setItem('users', newUsersStr); }`
  );

  // Line 1804 & 1813
  code = code.replace(
    /localStorage\.setItem\('applications',\s*newAppsStr\);/g,
    `if (window.DataStore && typeof window.DataStore.saveApplications === 'function') { window.DataStore.saveApplications(freshApps); } else { localStorage.setItem('applications', newAppsStr); }`
  );
  code = code.replace(
    /localStorage\.setItem\('applications',\s*JSON\.stringify\(lightApps\)\);/g,
    `if (window.DataStore && typeof window.DataStore.saveApplications === 'function') { window.DataStore.saveApplications(lightApps); } else { localStorage.setItem('applications', JSON.stringify(lightApps)); }`
  );

  // Line 1897
  code = code.replace(
    /localStorage\.setItem\('users',\s*JSON\.stringify\(curUsers\)\);/g,
    `if (window.DataStore && typeof window.DataStore.saveUsers === 'function') { window.DataStore.saveUsers(curUsers); } else { localStorage.setItem('users', JSON.stringify(curUsers)); }`
  );

  // Line 1917
  code = code.replace(
    /localStorage\.setItem\('inquiries',\s*newInqsStr\);/g,
    `if (window.DataStore && typeof window.DataStore.saveInquiries === 'function') { window.DataStore.saveInquiries(freshInqs); } else { localStorage.setItem('inquiries', newInqsStr); }`
  );

  // Line 2169
  code = code.replace(
    /localStorage\.setItem\('users',\s*JSON\.stringify\(users\)\);/g,
    `if (window.DataStore && typeof window.DataStore.saveUsers === 'function') { window.DataStore.saveUsers(users); } else { localStorage.setItem('users', JSON.stringify(users)); }`
  );

  // Line 2398 & 2415
  code = code.replace(
    /localStorage\.setItem\('users',\s*JSON\.stringify\(currentUsers\)\);/g,
    `if (window.DataStore && typeof window.DataStore.saveUsers === 'function') { window.DataStore.saveUsers(currentUsers); } else { localStorage.setItem('users', JSON.stringify(currentUsers)); }`
  );

  // Line 2613
  code = code.replace(
    /localStorage\.setItem\('users',\s*JSON\.stringify\(localUsers\)\);/g,
    `if (window.DataStore && typeof window.DataStore.saveUsers === 'function') { window.DataStore.saveUsers(localUsers); } else { localStorage.setItem('users', JSON.stringify(localUsers)); }`
  );

  fs.writeFileSync('security-utils.js', code, 'utf8');
  console.log('security-utils.js updated');
}

cleanSecurityUtils();
