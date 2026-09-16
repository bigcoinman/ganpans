const fs = require('fs');

const files = ['app.js', 'dashboard.js', 'data-store.js', 'security-utils.js', 'script.js', 'supabase-config.js'];

files.forEach(file => {
  const content = fs.readFileSync(file, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    // search for admin assignments or default user
    if (
      line.includes("id: 'admin'") ||
      line.includes('id: "admin"') ||
      line.includes("role: 'admin'") ||
      line.includes('role: "admin"') ||
      line.includes('autoLogin') ||
      line.includes('auto_login') ||
      line.includes('mockUser') ||
      line.includes('testUser') ||
      line.includes('defaultUser')
    ) {
      // filter out harmless checks like if (role === 'admin')
      if (!line.includes('===') && !line.includes('!==') && !line.includes('role !==')) {
        console.log(`${file}:${idx + 1}: ${line.trim().slice(0, 140)}`);
      }
    }
  });
});
