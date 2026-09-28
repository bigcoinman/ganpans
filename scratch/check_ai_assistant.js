// Check AI Assistant code and possible runtime errors in DOMContentLoaded
const fs = require('fs');

const appJs = fs.readFileSync('app.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

console.log('=== 1. Check HTML elements ===');
const ids = ['ai-assistant-trigger', 'ai-chat-window', 'ai-chat-close', 'ai-chat-send', 'ai-chat-input', 'ai-chat-messages'];
ids.forEach(id => {
    const found = indexHtml.includes(`id="${id}"`);
    console.log(`- Element #${id}: ${found ? 'EXISTS' : 'MISSING'}`);
});

console.log('\n=== 2. Check quick reply buttons in index.html ===');
const btnMatches = indexHtml.match(/<button[^>]*class="[^"]*quick-reply-btn[^"]*"[^>]*>[\s\S]*?<\/button>/g);
if (btnMatches) {
    btnMatches.forEach(b => console.log('  ', b.trim()));
} else {
    console.log('  None found!');
}

console.log('\n=== 3. Check FAQ keys in app.js vs index.html ===');
const faqDbMatch = appJs.match(/const faqDatabase = \{([\s\S]*?)\n\s*\};/);
if (faqDbMatch) {
    console.log('FAQ DB content:\n', faqDbMatch[0].split('\n').map(l => l.slice(0, 80)).join('\n'));
}

console.log('\n=== 4. Check DOMContentLoaded execution flow up to initAIAssistant ===');
const dclIndex = appJs.indexOf("document.addEventListener('DOMContentLoaded'");
const initIndex = appJs.indexOf("initAIAssistant()");
console.log(`DOMContentLoaded index: ${dclIndex}`);
console.log(`initAIAssistant() index: ${initIndex}`);

// Check if any code before initAIAssistant throws errors on null
console.log('Done preliminary check.');
