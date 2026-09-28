// Comprehensive Regression & Blast Radius Verification Suite
// Tests all 8 Blueprint modules and all main interactive components after AI Assistant fix

const fs = require('fs');
const appJs = fs.readFileSync('app.js', 'utf8');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const styleCss = fs.readFileSync('style.css', 'utf8');
const appCss = fs.readFileSync('app.css', 'utf8');

console.log('================================================================');
console.log('🔬 [5대 에이전트 합동] 전수 영향도 분석 및 2차 부작용 검증 시작');
console.log('================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(desc, condition, details = '') {
    if (condition) {
        console.log(`✅ [PASS] ${desc}`);
        passCount++;
    } else {
        console.error(`❌ [FAIL] ${desc} ${details ? '(' + details + ')' : ''}`);
        failCount++;
    }
}

// --- 1. DOM 및 HTML 무결성 검증 ---
console.log('--- 1. DOM 구조 및 무결성 검사 ---');
const openDivs = (indexHtml.match(/<div\b/gi) || []).length;
const closeDivs = (indexHtml.match(/<\/div>/gi) || []).length;
assert('HTML <div> 태그 열림/닫힘 대칭 일치', openDivs === closeDivs, `open: ${openDivs}, close: ${closeDivs}`);

const openButtons = (indexHtml.match(/<button\b/gi) || []).length;
const closeButtons = (indexHtml.match(/<\/button>/gi) || []).length;
assert('HTML <button> 태그 열림/닫힘 대칭 일치', openButtons === closeButtons, `open: ${openButtons}, close: ${closeButtons}`);

// Check if any transparent overlay blocks screen
assert('투명 전체 오버레이 차단 찌꺼기 부존재', !indexHtml.includes('pointer-events: all; position: fixed; inset: 0; opacity: 0; z-index: 99999'));

// --- 2. CSS 스타일 충돌 및 찌꺼기 검증 ---
console.log('\n--- 2. CSS 충돌 및 스타일 찌꺼기 검사 ---');
// Ensure style.css does NOT contain duplicate .ai-trigger-bubble or .ai-chat-container
assert('style.css 내 AI 어시스턴트 중복 선언 완전 제거 확인', !styleCss.includes('.ai-trigger-bubble {') && !styleCss.includes('.ai-chat-container {'));
// Ensure app.css contains the single SSOT for AI styles
assert('app.css 내 AI 어시스턴트 단일 SSOT 정상 보존 확인', appCss.includes('.ai-trigger-bubble') && appCss.includes('.ai-chat-container'));

// Check other core styles in style.css are intact (e.g. pc-footer, header, sign cards, etc.)
assert('style.css 내 PC 푸터 및 기본 레이아웃 스타일 100% 정상 보존', styleCss.includes('.pc-footer') && styleCss.includes('.hero-section'));

// --- 3. 8대 공식 설계도 핵심 함수 보존 검증 ---
console.log('\n--- 3. 8대 공식 설계도 핵심 함수 보존 검사 ---');
const coreFunctions = [
    'switchTab',
    'handleAppHashRouting',
    'renderStatusTab',
    'viewDraftModal',
    'downloadApplicationPhotos',
    'handleAppShare',
    'handleAppShortcut',
    'switchAuthTab',
    'executeFindId',
    'executeFindPw',
    'executeResetPw',
    'openDrawer',
    'closeDrawer',
    'updateDrawerProfile',
    'initBuildingGallery',
    'initSimulator',
    'initFAQ',
    'initReviews',
    'initWizard',
    'initChecklist',
    'initPopups',
    'initAIAssistant'
];

const secUtilsJs = fs.readFileSync('security-utils.js', 'utf8');

coreFunctions.forEach(fn => {
    const exists = appJs.includes(fn) || secUtilsJs.includes(fn);
    assert(`핵심 함수 [${fn}] 정상 선언 및 보존 확인`, exists);
});

// --- 4. 가상 환경 실행을 통한 런타임 에러 전수 검사 ---
console.log('\n--- 4. 런타임 인터랙션 및 라우팅 가상 시뮬레이션 ---');
class MockElement {
    constructor(id = '', tag = 'div') {
        this.id = id;
        this.tagName = tag.toUpperCase();
        this.classList = {
            _c: new Set(),
            add(c) { this._c.add(c); },
            remove(c) { this._c.delete(c); },
            contains(c) { return this._c.has(c); }
        };
        this.style = {};
        this.children = [];
        this.innerHTML = '';
        this.innerText = '';
        this.value = '';
        this.listeners = {};
        this._attrs = {};
        this.dataset = {};
    }
    set className(val) {
        this._className = val;
        val.split(/\s+/).filter(Boolean).forEach(c => this.classList.add(c));
    }
    get className() { return this._className || ''; }
    addEventListener(evt, cb) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(cb);
    }
    querySelector(sel) {
        if (sel === '.ai-quick-replies') {
            return this.children.find(c => c.classList.contains('ai-quick-replies')) || null;
        }
        return new MockElement();
    }
    querySelectorAll(sel) {
        if (sel === '.app-view') {
            return ['view-home', 'view-status', 'view-simulator'].map(id => elements[id]).filter(Boolean);
        }
        return [new MockElement()];
    }
    appendChild(child) { this.children.push(child); return child; }
    remove() {}
    focus() {}
    setAttribute(k, v) { this._attrs[k] = v; }
    getAttribute(k) { return this._attrs[k] || ''; }
    closest() { return this; }
    scrollIntoView() {}
}

const idRegex = /id=["']([^"']+)["']/g;
const elements = {};
let match;
while ((match = idRegex.exec(indexHtml)) !== null) {
    elements[match[1]] = new MockElement(match[1]);
}
['view-home', 'view-status', 'view-simulator'].forEach(id => {
    if (!elements[id]) elements[id] = new MockElement(id);
});

global.window = global;
global.window.addEventListener = (evt, cb) => {
    if (evt === 'DOMContentLoaded') global._dcls.push(cb);
};
global.window.removeEventListener = () => {};
global.document = {
    getElementById: (id) => elements[id] || null,
    querySelector: (sel) => {
        if (sel.startsWith('#')) return elements[sel.slice(1)] || null;
        return new MockElement();
    },
    querySelectorAll: (sel) => {
        if (sel === '.app-view') {
            return ['view-home', 'view-status', 'view-simulator'].map(id => elements[id]);
        }
        return [new MockElement()];
    },
    createElement: (tag) => new MockElement('', tag),
    body: new MockElement('body', 'body'),
    documentElement: new MockElement('html', 'html'),
    addEventListener: (evt, cb) => {
        if (evt === 'DOMContentLoaded') global._dcls.push(cb);
    },
    removeEventListener: () => {}
};
global._dcls = [];
global.localStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };
global.location = { hash: '', href: 'https://ganpans.com' };

eval(secUtilsJs);
eval(appJs);

// DOMContentLoaded 실행
let dclErrors = 0;
global._dcls.forEach(cb => {
    try {
        cb();
    } catch (err) {
        console.error('DCL execution error:', err);
        dclErrors++;
    }
});
assert('DOMContentLoaded 전체 초기화 에러 0건 확인', dclErrors === 0);

// --- 5. 탭 전환 회귀 테스트 (home, status, apply, simulator) ---
console.log('\n--- 5. 탭 전환 기능 회귀 테스트 ---');
const tabsToTest = ['home', 'status', 'apply', 'simulator'];
tabsToTest.forEach(t => {
    window.switchTab(t);
    const targetId = (t === 'apply') ? 'view-home' : `view-${t}`;
    const viewEl = elements[targetId];
    const isAct = viewEl && viewEl.classList.contains('active');
    assert(`탭 전환 [${t}] -> #${targetId} 활성화 확인`, isAct);
});

// --- 6. 드로어 메뉴 인터랙션 회귀 테스트 ---
console.log('\n--- 6. 사이드 드로어 메뉴 회귀 테스트 ---');
window.openDrawer();
const drawer = elements['app-drawer'];
assert('사이드 드로어 openDrawer() 활성화 확인', drawer && drawer.classList.contains('active'));

window.closeDrawer();
assert('사이드 드로어 closeDrawer() 비활성화 확인', drawer && !drawer.classList.contains('active'));

// --- 7. 유령 코드 및 잔재 검사 ---
console.log('\n--- 7. 유령 코드 및 미사용 잔재 검사 ---');
const ghostPatterns = [
    'sales_draft_cache',
    'find_id_cache',
    'find_pw_cache',
    'viewDraftModalForSales',
    'viewDraftModalMob',
    'getBizItemsForSalesOnly'
];

ghostPatterns.forEach(g => {
    const foundInApp = appJs.includes(g);
    assert(`유령 코드 [${g}] 100% 부존재 확인`, !foundInApp);
});

console.log('\n================================================================');
console.log(`📊 [최종 종합 결과] 총 ${passCount + failCount}개 검사 중: PASS: ${passCount}건, FAIL: ${failCount}건`);
console.log('================================================================\n');

if (failCount > 0) {
    process.exit(1);
}
