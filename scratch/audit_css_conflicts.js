/**
 * CSS 중복 선택자 심층 분석
 * style.css vs app.css에서 동일 선택자의 속성이 충돌하는지, 
 * 아니면 단순히 동일 선택자에 다른 속성을 추가하는 보완 관계인지 분류
 */

const fs = require('fs');

const styleCss = fs.readFileSync('style.css', 'utf8');
const appCss = fs.readFileSync('app.css', 'utf8');

// 선택자별 규칙 블록 파싱 (단순 단일 선택자 기준)
function parseBlocks(css) {
  const blocks = new Map();
  // 단순 선택자 { ... } 매칭 (중첩 없음 기준)
  const pattern = /([.#][\w-]+)\s*\{([^}]*)\}/g;
  let m;
  while ((m = pattern.exec(css)) !== null) {
    const sel = m[1].trim();
    const props = m[2].trim();
    if (!blocks.has(sel)) blocks.set(sel, []);
    blocks.get(sel).push(props);
  }
  return blocks;
}

const styleBlocks = parseBlocks(styleCss);
const appBlocks = parseBlocks(appCss);

// 공통 선택자 찾기
const commonSelectors = [...styleBlocks.keys()].filter(s => appBlocks.has(s));

console.log(`\n공통 선택자 총 ${commonSelectors.length}개\n`);

const conflicts = [];    // 동일 속성이 다른 값
const complements = [];  // 다른 속성만 있음 (보완)
const exactDups = [];    // 완전 중복

for (const sel of commonSelectors) {
  const stylePropsList = styleBlocks.get(sel);
  const appPropsList = appBlocks.get(sel);
  
  // 각 파일에서 해당 선택자의 모든 속성 합치기
  const parseProps = (propsList) => {
    const props = {};
    for (const propsStr of propsList) {
      for (const line of propsStr.split(';')) {
        const [key, ...vals] = line.split(':');
        if (key && key.trim()) {
          props[key.trim()] = vals.join(':').trim();
        }
      }
    }
    return props;
  };
  
  const styleProps = parseProps(stylePropsList);
  const appProps = parseProps(appPropsList);
  
  const conflictingProps = [];
  const onlyInStyle = [];
  const onlyInApp = [];
  const same = [];
  
  const allKeys = new Set([...Object.keys(styleProps), ...Object.keys(appProps)]);
  for (const key of allKeys) {
    if (!key) continue;
    if (styleProps[key] !== undefined && appProps[key] !== undefined) {
      if (styleProps[key] === appProps[key]) {
        same.push(key);
      } else {
        conflictingProps.push(`${key}: style.css="${styleProps[key]}" vs app.css="${appProps[key]}"`);
      }
    } else if (styleProps[key] !== undefined) {
      onlyInStyle.push(key);
    } else {
      onlyInApp.push(key);
    }
  }
  
  if (conflictingProps.length > 0) {
    conflicts.push({ sel, conflictingProps, onlyInStyle, onlyInApp, same });
  } else if (same.length > 0 && onlyInStyle.length === 0 && onlyInApp.length === 0) {
    exactDups.push({ sel, same });
  } else {
    complements.push({ sel, onlyInStyle, onlyInApp, same });
  }
}

console.log(`=== 충돌 (다른 값) - 삭제/통합 필요: ${conflicts.length}개 ===`);
conflicts.slice(0, 15).forEach(({ sel, conflictingProps }) => {
  console.log(`\n  ❌ ${sel}`);
  conflictingProps.slice(0, 3).forEach(p => console.log(`     ${p}`));
});

console.log(`\n=== 완전 중복 (동일 속성 동일 값) - 한쪽 삭제 가능: ${exactDups.length}개 ===`);
exactDups.slice(0, 15).forEach(({ sel, same }) => {
  console.log(`  🗑️  ${sel} (${same.length}개 속성)`);
});

console.log(`\n=== 보완 관계 (속성이 다름) - 주의 필요: ${complements.length}개 ===`);
complements.slice(0, 10).forEach(({ sel, onlyInStyle, onlyInApp }) => {
  console.log(`  ℹ️  ${sel}: style전용=${onlyInStyle.length}개, app전용=${onlyInApp.length}개`);
});
