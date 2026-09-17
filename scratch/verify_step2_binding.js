const fs = require('fs');

console.log('=== [2단계: 함수 및 바인딩 무결성 검증] ===');

const appJs = fs.readFileSync('app.js', 'utf8');

// 1. window.openEditApplicationModal, window.closeEditApplicationModal, window.submitEditApplicationModal 이 정상 선언되어 있는지
const requiredGlobals = [
    'openEditApplicationModal',
    'closeEditApplicationModal',
    'submitEditApplicationModal',
    'saveUsersSSOT',
    'saveApplicationsSSOT',
    'saveInquiriesSSOT'
];

requiredGlobals.forEach(fn => {
    const hasDef = appJs.includes(`function ${fn}`) || appJs.includes(`const ${fn}`) || appJs.includes(`window.${fn}`);
    console.log(` - ${fn} 정의 여부: ${hasDef ? '✅ 정상 정의됨' : '❌ 누락!'}`);
});

// 2. 삭제된 유령 함수 및 ID에 대한 미해결 호출 검색
const deletedGhosts = [
    'clearBizUploadFormMob',
    'mobile-upload-form-mob',
    'mob-photos-input-mob',
    'mob-camera-input-mob',
    'selectedPhotosMob',
    'renderMobilePhotoPreviewsMob',
    'fileToCompressedDataUrl',
    'pc-footer-btn-inquiry',
    'owner-sms-auth-group'
];

deletedGhosts.forEach(g => {
    const occurrences = (appJs.match(new RegExp(g, 'g')) || []).length;
    console.log(` - 삭제된 찌꺼기 [${g}] 잔존 횟수: ${occurrences}회 ${occurrences === 0 ? '✅ 완전 박멸' : '⚠️ 잔재 있음'}`);
});

console.log('\n2단계 바인딩 무결성 검증 완료');
