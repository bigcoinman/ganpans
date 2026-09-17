const fs = require('fs');

const indexHtml = fs.readFileSync('./index.html', 'utf8');
const appHtml = fs.readFileSync('./app.html', 'utf8');
const appJs = fs.readFileSync('./app.js', 'utf8');
const dashboardJs = fs.existsSync('./dashboard.js') ? fs.readFileSync('./dashboard.js', 'utf8') : '';

// Find all document.getElementById calls in appJs and dashboardJs
const regex = /document\.getElementById\(['"]([a-zA-Z0-9_-]+)['"]\)/g;
let match;
const queriedIds = new Set();

while ((match = regex.exec(appJs)) !== null) {
    queriedIds.add(match[1]);
}
if (dashboardJs) {
    while ((match = regex.exec(dashboardJs)) !== null) {
        queriedIds.add(match[1]);
    }
}

const missingInIndex = [];
const dynamicInJs = [];

queriedIds.forEach(id => {
    const inIndex = indexHtml.includes(`id="${id}"`) || indexHtml.includes(`id='${id}'`);
    const inJsDynamic = appJs.includes(`id="${id}"`) || appJs.includes(`id='${id}'`) || 
                        (dashboardJs && (dashboardJs.includes(`id="${id}"`) || dashboardJs.includes(`id='${id}'`)));
    
    if (!inIndex) {
        if (inJsDynamic) {
            dynamicInJs.push(id);
        } else {
            missingInIndex.push(id);
        }
    }
});

console.log(`전체 참조된 ID 개수: ${queriedIds.size}개`);
console.log(`동적 생성 ID 개수: ${dynamicInJs.length}개`);
console.log(`HTML 미존재 ID 개수: ${missingInIndex.length}개`);
console.log('미존재 ID 목록:', missingInIndex);
