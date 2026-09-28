// Scan DOMContentLoaded block in app.js for elements queried by getElementById/querySelector
// and check if they exist in index.html!
const fs = require('fs');

const appJs = fs.readFileSync('app.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

// Find DOMContentLoaded handler
const startMarker = "document.addEventListener('DOMContentLoaded', () => {";
const startIndex = appJs.indexOf(startMarker);
const initMarker = "initAIAssistant();";
const initIndex = appJs.indexOf(initMarker);

const block = appJs.slice(startIndex, initIndex);

console.log(`Block length: ${block.length} characters`);

// Find all document.getElementById('...')
const getElemRegex = /document\.getElementById\(['"]([^'"]+)['"]\)/g;
let match;
const missingIds = new Set();
const existingIds = new Set();

while ((match = getElemRegex.exec(block)) !== null) {
    const id = match[1];
    if (indexHtml.includes(`id="${id}"`) || indexHtml.includes(`id='${id}'`)) {
        existingIds.add(id);
    } else {
        missingIds.add(id);
    }
}

console.log(`Checked ${existingIds.size} existing IDs.`);
console.log(`Found ${missingIds.size} missing IDs queried in DOMContentLoaded before initAIAssistant:`);
missingIds.forEach(id => {
    // Check if this id has .addEventListener attached without null check!
    const directListenerRegex = new RegExp(`document\\.getElementById\\(['"]${id}['"]\\)\\.addEventListener`, 'g');
    const hasDirectListener = directListenerRegex.test(block);
    
    // Also check: const varName = document.getElementById('id'); ... varName.addEventListener
    const varAssignRegex = new RegExp(`const\\s+([a-zA-Z0-9_$]+)\\s*=\\s*document\\.getElementById\\(['"]${id}['"]\\);`, 'g');
    let vMatch;
    let unsafeVar = false;
    while ((vMatch = varAssignRegex.exec(block)) !== null) {
        const vName = vMatch[1];
        // see if vName.addEventListener is called without `if (${vName})`
        const usageRegex = new RegExp(`${vName}\\.addEventListener`, 'g');
        if (usageRegex.test(block)) {
            // Check if there is an `if (${vName})` or `if (!${vName})` guard
            const guardRegex = new RegExp(`if\\s*\\([!]*${vName}\\)`, 'g');
            if (!guardRegex.test(block)) {
                unsafeVar = true;
            }
        }
    }

    console.log(`  - #${id} ${hasDirectListener ? '--> CRITICAL: Direct .addEventListener call!' : (unsafeVar ? '--> CRITICAL: Unsafe var listener!' : '(safely guarded or other)')}`);
});
