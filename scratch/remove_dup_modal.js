const fs = require('fs');
const path = require('path');

const appPath = path.resolve('app.js');
let raw = fs.readFileSync(appPath, 'utf8');
const isCRLF = raw.includes('\r\n');
let appJs = raw.replace(/\r\n/g, '\n');

const startStr = `    // --- 신청서 세부 정보 직접 수정 모달 (최고관리자 모바일 & PC 공통) ---`;
const endToken = `window.submitEditApplicationModal = submitEditApplicationModal;`;

const sIdx = appJs.indexOf(startStr);
const eIdx = appJs.indexOf(endToken, sIdx);

console.log('sIdx:', sIdx, 'eIdx:', eIdx);

if (sIdx !== -1 && eIdx !== -1) {
    const endTotal = eIdx + endToken.length;
    const toDelete = appJs.substring(sIdx, endTotal);
    console.log(`삭제할 코드 줄 수: ${toDelete.split('\n').length}줄`);
    appJs = appJs.substring(0, sIdx) + appJs.substring(endTotal);
    if (isCRLF) appJs = appJs.replace(/\n/g, '\r\n');
    fs.writeFileSync(appPath, appJs, 'utf8');
    console.log('✅ 신청서 세부 정보 직접 수정 모달 중복 코드 전수 삭제 완료!');
} else {
    console.error('❌ 시작점 또는 끝점을 찾지 못했습니다.');
}
