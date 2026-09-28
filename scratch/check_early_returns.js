// Check for top-level returns or unhandled exceptions in DOMContentLoaded in app.js
const fs = require('fs');

const appJs = fs.readFileSync('app.js', 'utf8');

// Find start of DOMContentLoaded and where initAIAssistant is called
const start = appJs.indexOf("document.addEventListener('DOMContentLoaded', () => {");
const end = appJs.indexOf("initAIAssistant();");

const slice = appJs.slice(start, end);
console.log('Slice length:', slice.length);

// Check returns that are NOT inside functions
const lines = slice.split('\n');
let depth = 0;
let functionDepth = 0;

lines.forEach((line, idx) => {
    // simple check for curly braces
    const openBraces = (line.match(/\{/g) || []).length;
    const closeBraces = (line.match(/\}/g) || []).length;
    
    // check if function declaration/arrow function
    if (/function\s*\(|function\s+[a-zA-Z0-9_$]+\s*\(|=>\s*\{/.test(line)) {
        // function started
    }

    if (line.trim().startsWith('return') && depth === 1) {
        console.log(`POTENTIAL EARLY RETURN at line ${idx + 629}:`, line.trim());
    }
    
    depth += (openBraces - closeBraces);
});

console.log('Final depth before initAIAssistant:', depth);
