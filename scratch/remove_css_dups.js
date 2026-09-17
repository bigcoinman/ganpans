/**
 * app.css에서 style.css와 완전 중복된 21개 선택자 블록 삭제
 * 충돌 89개는 app.css가 모바일 !important 오버라이드 목적이므로 건드리지 않음
 */

const fs = require('fs');

let appCss = fs.readFileSync('app.css', 'utf8');
const originalLen = appCss.length;

// 완전 중복 목록 (21개) - app.css에서 삭제
const dupSelectors = [
  '.bottom-sheet-handle',
  '.bottom-sheet-header',
  '.bottom-sheet-options',
  '.sheet-option-btn',
  '.camera-bg',
  '.gallery-bg',
  '.option-info',
  '.uploaded-photos-preview',
  '.uploaded-photo-item',
  '.pw-wrapper',
  '.pw-toggle-btn',
  '.install-title-area',
  '.install-actions',
  '.floating-night-toggle',
  '.admin-tab-controls-mob'
];

let removed = 0;

for (const sel of dupSelectors) {
  // 선택자명을 이스케이프 (. 등)
  const escapedSel = sel.replace(/\./g, '\\.').replace(/-/g, '\\-');
  // 해당 선택자 블록 전체 매칭 (중첩 없음 기준)
  const pattern = new RegExp(
    `(?:^|\\n)\\s*${escapedSel}\\s*\\{[^}]*\\}`,
    'g'
  );
  const before = appCss.length;
  appCss = appCss.replace(pattern, '');
  const after = appCss.length;
  if (before !== after) {
    console.log(`  ✅ 삭제: ${sel} (${before - after}bytes)`);
    removed++;
  } else {
    console.log(`  ⚠️  미발견 (이미 없거나 구조가 다름): ${sel}`);
  }
}

// 연속 빈줄 정리 (3줄 이상 → 2줄)
appCss = appCss.replace(/\n{4,}/g, '\n\n\n');

fs.writeFileSync('app.css', appCss, 'utf8');
console.log(`\n완료: ${removed}개 선택자 삭제`);
console.log(`app.css: ${originalLen}bytes → ${appCss.length}bytes (-${originalLen - appCss.length}bytes)`);
