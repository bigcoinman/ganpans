const fs = require('fs');
const content = fs.readFileSync('app.js', 'utf8');
const isCRLF = content.includes('\r\n');
const lines = content.split(/\r?\n/);

const startIdx = lines.findIndex(l => l.includes('function assignConstructorToBizItemMob('));
const endIdx = lines.findIndex((l, idx) => idx > startIdx && l.includes('window.assignConstructorToBizItemMob = assignConstructorToBizItemMob;'));

console.log('startIdx:', startIdx + 1, 'endIdx:', endIdx + 1);

const replacementLines = [
  '    // 모바일 영업 물건에 시공사 배정 (DataStore SSOT 단일 원천 호출)',
  '    function assignConstructorToBizItemMob(uid, itemId, btnEl) {',
  '        const container = btnEl.closest("div");',
  '        const select = container ? container.querySelector(".select-constructor-bizitem-mob") : null;',
  '        const constId = select ? select.value : "";',
  '        if (!constId) {',
  '            alert("배정할 시공사를 선택해 주세요.");',
  '            return;',
  '        }',
  '',
  '        if (window.DataStore && typeof window.DataStore.assignConstructorToBizItem === "function") {',
  '            const res = window.DataStore.assignConstructorToBizItem(uid, itemId, constId);',
  '            if (res && res.success) {',
  '                const constName = res.constName || "시공사";',
  '                const msg = `영업 물건에 시공사 [${constName}]가 성공적으로 배정되었습니다.`;',
  '                if (typeof window.showToast === "function") {',
  '                    window.showToast(msg);',
  '                } else {',
  '                    alert(msg);',
  '                }',
  '                renderAdminDashboardMob(true);',
  '                return;',
  '            } else if (res && res.error) {',
  '                alert(res.error);',
  '                return;',
  '            }',
  '        }',
  '    }',
  '    window.assignConstructorToBizItemMob = assignConstructorToBizItemMob;'
];

// Replace from startIdx - 1 (the comment) to endIdx
const commentIdx = startIdx - 1;
lines.splice(commentIdx, (endIdx - commentIdx) + 1, ...replacementLines);

const newContent = lines.join(isCRLF ? '\r\n' : '\n');
fs.writeFileSync('app.js', newContent, 'utf8');
console.log('SUCCESS: Line-based replacement completed!');
