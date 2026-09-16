const fs = require('fs');

function cleanFile(filePath) {
  let code = fs.readFileSync(filePath, 'utf8');

  // Replace inquiries
  // localStorage.setItem('inquiries', JSON.stringify(...))
  code = code.replace(/localStorage\.setItem\('inquiries',\s*JSON\.stringify\((.*?)\)\);/g, (match, p1) => {
    return `(typeof DataStore !== 'undefined' && DataStore.saveInquiries ? DataStore.saveInquiries(${p1}) : localStorage.setItem('inquiries', JSON.stringify(${p1})));`;
  });

  // Replace applications
  // localStorage.setItem('applications', JSON.stringify(...))
  code = code.replace(/localStorage\.setItem\('applications',\s*JSON\.stringify\((.*?)\)\);/g, (match, p1) => {
    return `(typeof DataStore !== 'undefined' && DataStore.saveApplications ? DataStore.saveApplications(${p1}) : localStorage.setItem('applications', JSON.stringify(${p1})));`;
  });

  // Replace users
  // localStorage.setItem('users', JSON.stringify(...))
  code = code.replace(/localStorage\.setItem\('users',\s*JSON\.stringify\((.*?)\)\);/g, (match, p1) => {
    return `(typeof DataStore !== 'undefined' && DataStore.saveUsers ? DataStore.saveUsers(${p1}) : localStorage.setItem('users', JSON.stringify(${p1})));`;
  });

  fs.writeFileSync(filePath, code, 'utf8');
  console.log(`${filePath} cleaned`);
}

['dashboard.js', 'app.js', 'script.js'].forEach(file => {
  if (fs.existsSync(file)) {
    cleanFile(file);
  }
});
