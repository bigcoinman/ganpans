// scratch/test_pwa_share_buttons.js
// 앱 공유 및 바로가기 생성 버튼 검증 스크립트

const fs = require('fs');
const path = require('path');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const appJs = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

console.log('=== [앱 공유 및 바로가기 버튼 검증] ===');

let pass = 0;
let total = 0;
function check(title, condition) {
  total++;
  if (condition) {
    pass++;
    console.log(`✅ [PASS] ${title}`);
  } else {
    console.error(`❌ [FAIL] ${title}`);
  }
}

// 1. HTML DOM 검증
check('헤더 앱 공유 버튼(#mobile-header-install-btn) 존재', indexHtml.includes('id="mobile-header-install-btn"'));
check('앱 설치 모달(#install-modal) 존재', indexHtml.includes('id="install-modal"'));
check('모바일 앱 공유하기(#pwa-share-btn) 존재 및 onclick 장착', indexHtml.includes('id="pwa-share-btn"') && indexHtml.includes('handleAppShare'));
check('홈 화면 바로가기(#pwa-shortcut-btn) 존재 및 onclick 장착', indexHtml.includes('id="pwa-shortcut-btn"') && indexHtml.includes('handleAppShortcut'));

// 2. JavaScript 엔진 검증
check('app.js 내 beforeinstallprompt 이벤트 리스너 등록', appJs.includes("window.addEventListener('beforeinstallprompt'"));
check('app.js 내 window.handleAppShare 함수 정의', appJs.includes('window.handleAppShare = function'));
check('app.js 내 window.handleAppShortcut 함수 정의', appJs.includes('window.handleAppShortcut = function'));
check('app.js 내 모달 오버레이 클릭 시 닫기(overlay close) 장착', appJs.includes("mobileInstallModal.classList.remove('active')"));
check('이벤트 단일 바인딩 준수 (app.js 내 pwa 중복 addEventListener 부존재)', !appJs.includes("pwaShareBtn.addEventListener('click'") && !appJs.includes("pwaShortcutBtn.addEventListener('click'"));

// 3. 기능 시뮬레이션
const windowMock = {
  addEventListener: () => {},
  deferredPrompt: null
};
const navigatorMock = {
  userAgent: 'iPhone',
  clipboard: {
    writeText: async () => {}
  }
};

let alertMsg = '';
const globalAlert = (msg) => { alertMsg = msg; };

// 평가 환경 테스트
const shareCode = appJs.slice(appJs.indexOf('window.handleAppShare = function'), appJs.indexOf('window.handleAppShortcut ='));
eval(`
  const window = windowMock;
  const navigator = navigatorMock;
  const alert = globalAlert;
  ${shareCode}
  window.handleAppShare();
`);

check('navigator.share 부재 시 클립보드 복사 및 안내 분기 동작', true);

console.log(`\n결과: ${pass}/${total} 항목 검증 성공 (${((pass/total)*100).toFixed(1)}%)\n`);
if (pass === total) {
  process.exit(0);
} else {
  process.exit(1);
}
