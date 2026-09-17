const fs = require('fs');

const styleCss = fs.readFileSync('style.css', 'utf8');
const appCss = fs.readFileSync('app.css', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');

console.log('=== [CSS 중복 및 역할 분석] ===');

// style.css 상단 30줄
console.log('--- style.css 헤더 ---');
console.log(styleCss.split('\n').slice(0, 25).join('\n'));

console.log('\n--- app.css 헤더 ---');
console.log(appCss.split('\n').slice(0, 25).join('\n'));

// :root 변수 비교
const getVars = (css) => {
  const m = css.match(/:root\s*\{([^}]+)\}/);
  if (!m) return {};
  const vars = {};
  m[1].split(';').forEach(l => {
    const parts = l.split(':');
    if (parts.length === 2) {
      vars[parts[0].trim()] = parts[1].trim();
    }
  });
  return vars;
};

const styleVars = getVars(styleCss);
const appVars = getVars(appCss);
console.log(`\n:root CSS 변수 수: style.css(${Object.keys(styleVars).length}개) vs app.css(${Object.keys(appVars).length}개)`);

const dupVars = [];
for (const [k, v] of Object.entries(appVars)) {
  if (styleVars[k]) {
    dupVars.push({ name: k, styleVal: styleVars[k], appVal: v });
  }
}
console.log('중복 정의된 :root 변수:', dupVars.length, '개');
dupVars.slice(0, 10).forEach(dv => {
  console.log(` - ${dv.name}: style="${dv.styleVal}" vs app="${dv.appVal}"`);
});
