const fs = require('fs');

// Read security-utils.js
const secUtils = fs.readFileSync('security-utils.js', 'utf8');

// Check ensureApplicationPhotosLoaded implementation
console.log('Checking ensureApplicationPhotosLoaded logic...');
const ensureStart = secUtils.indexOf('async function ensureApplicationPhotosLoaded');
const ensureEnd = secUtils.indexOf('window.ensureApplicationPhotosLoaded =', ensureStart);
console.log(secUtils.slice(ensureStart, ensureStart + 1200));
