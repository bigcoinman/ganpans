const fs = require('fs');

const html = fs.readFileSync('app.html', 'utf8');

class MockElement {
    constructor(tagName, id = '', className = '') {
        this.tagName = tagName.toUpperCase();
        this.id = id;
        this.className = className;
        this.classList = {
            _classes: new Set(className.split(' ').filter(Boolean)),
            add: (c) => this.classList._classes.add(c),
            remove: (c) => this.classList._classes.delete(c),
            contains: (c) => this.classList._classes.has(c),
            toggle: (c) => this.classList.contains(c) ? this.classList.remove(c) : this.classList.add(c)
        };
        this.style = {};
        this.children = [];
        this.parentElement = null;
        this._listeners = {};
        this.value = '';
        this.textContent = '';
        this.innerHTML = '';
        this.dataset = {};
    }
    addEventListener(evt, fn) {
        if (!this._listeners[evt]) this._listeners[evt] = [];
        this._listeners[evt].push(fn);
    }
    dispatchEvent(evt) {
        const fns = this._listeners[evt.type] || [];
        fns.forEach(fn => fn(evt));
    }
    querySelector() { return null; }
    querySelectorAll() { return []; }
    closest() { return null; }
    appendChild(c) { this.children.push(c); c.parentElement = this; return c; }
    insertBefore(c) { this.children.unshift(c); c.parentElement = this; return c; }
    removeChild(c) { this.children = this.children.filter(x => x !== c); return c; }
    reset() {}
    focus() {}
    blur() {}
    scrollTo() {}
}

const elementsById = {};
const idRegex = /id=["']([^"']+)["']/g;
let m;
while ((m = idRegex.exec(html)) !== null) {
    elementsById[m[1]] = new MockElement('div', m[1]);
}

global.window = global;
global.window.addEventListener = (evt, fn) => {};
global.window.removeEventListener = (evt, fn) => {};
global.document = {
    getElementById: (id) => elementsById[id] || null,
    querySelector: (sel) => {
        if (sel && sel.startsWith('#')) return elementsById[sel.slice(1)] || null;
        return new MockElement('div');
    },
    querySelectorAll: (sel) => {
        if (sel === '.app-view') {
            return [
                elementsById['view-home'] || new MockElement('section', 'view-home'),
                elementsById['view-status'] || new MockElement('section', 'view-status'),
                elementsById['view-simulator'] || new MockElement('section', 'view-simulator'),
                elementsById['view-apply'] || new MockElement('section', 'view-apply')
            ];
        }
        if (sel === '.nav-item') {
            return [
                elementsById['tab-btn-home'] || new MockElement('button', 'tab-btn-home'),
                elementsById['tab-btn-status'] || new MockElement('button', 'tab-btn-status'),
                elementsById['tab-btn-search'] || new MockElement('button', 'tab-btn-search'),
                elementsById['tab-btn-apply'] || new MockElement('button', 'tab-btn-apply'),
                elementsById['tab-btn-refresh'] || new MockElement('button', 'tab-btn-refresh')
            ];
        }
        return [new MockElement('div')];
    },
    createElement: (tag) => new MockElement(tag),
    addEventListener: () => {},
    removeEventListener: () => {},
    documentElement: new MockElement('html'),
    body: new MockElement('body'),
    dispatchEvent: () => {},
    createEvent: () => ({ initEvent: () => {} })
};
global.localStorage = {
    _d: {},
    getItem: (k) => global.localStorage._d[k] || null,
    setItem: (k, v) => { global.localStorage._d[k] = String(v); },
    removeItem: (k) => { delete global.localStorage._d[k]; }
};
global.sessionStorage = {
    _d: {},
    getItem: (k) => global.sessionStorage._d[k] || null,
    setItem: (k, v) => { global.sessionStorage._d[k] = String(v); },
    removeItem: (k) => { delete global.sessionStorage._d[k]; }
};
global.navigator = { userAgent: 'Mozilla/5.0 Node' };
global.location = { href: 'http://localhost/app.html', hash: '#dashboard', pathname: '/app.html', search: '' };
global.CustomEvent = class { constructor(type, init) { this.type = type; this.detail = init ? init.detail : undefined; } };
global.alert = (msg) => console.log('[MOCK ALERT]:', msg);
global.confirm = () => true;

// Load scripts
try {
    eval(fs.readFileSync('supabase-config.js', 'utf8'));
    eval(fs.readFileSync('security-utils.js', 'utf8'));
    eval(fs.readFileSync('data-store.js', 'utf8'));
    eval(fs.readFileSync('kakao-notify.js', 'utf8'));
    eval(fs.readFileSync('script.js', 'utf8'));
    eval(fs.readFileSync('app.js', 'utf8'));
    console.log('✅ All 6 scripts evaluated successfully with 0 errors!');

    // Test tab switching
    console.log('\nTesting switchTab(status):');
    window.switchTab('status');
    console.log('view-status classList:', elementsById['view-status'].classList._classes);
    console.log('tab-btn-status classList:', elementsById['tab-btn-status'].classList._classes);

    console.log('\nTesting switchTab(home):');
    window.switchTab('home');
    console.log('view-home classList:', elementsById['view-home'].classList._classes);
    console.log('tab-btn-home classList:', elementsById['tab-btn-home'].classList._classes);

    console.log('\nTesting switchTab(apply):');
    window.switchTab('apply');
    console.log('view-home (with apply scroll) classList:', elementsById['view-home'].classList._classes);

} catch (e) {
    console.error('❌ CRITICAL SCRIPT ERROR:', e);
}
