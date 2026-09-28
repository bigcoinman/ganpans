// Deep browser simulation: trace exact execution of DOMContentLoaded in app.js
const fs = require('fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');
const dataStoreJs = fs.readFileSync('data-store.js', 'utf8');
const secUtilsJs = fs.readFileSync('security-utils.js', 'utf8');

// Build real DOM tree using basic mocks
const idRegex = /id=["']([^"']+)["']/g;
const allIds = new Set();
let match;
while ((match = idRegex.exec(indexHtml)) !== null) {
    allIds.add(match[1]);
}

class MockElement {
    constructor(id = '', tag = 'div') {
        this.id = id;
        this.tagName = tag.toUpperCase();
        this.classList = {
            _classes: new Set(),
            add(c) { this._classes.add(c); },
            remove(c) { this._classes.delete(c); },
            contains(c) { return this._classes.has(c); },
            toggle(c) { if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c); }
        };
        this.style = {};
        this.children = [];
        this.innerHTML = '';
        this.innerText = '';
        this.value = '';
        this.checked = false;
        this.listeners = {};
    }
    addEventListener(evt, cb) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(cb);
    }
    removeEventListener(evt, cb) {}
    querySelector(sel) {
        if (sel.startsWith('#')) return global.document.getElementById(sel.slice(1));
        return new MockElement();
    }
    querySelectorAll(sel) { return [new MockElement()]; }
    appendChild(child) { this.children.push(child); return child; }
    insertBefore(newEl, refEl) { this.children.push(newEl); return newEl; }
    removeChild(child) {}
    remove() {}
    focus() {}
    blur() {}
    setAttribute(k, v) { this[k] = v; }
    getAttribute(k) { return this[k] || ''; }
    closest(sel) { return this; }
    scrollIntoView() {}
    reset() {}
}

const elements = {};
allIds.forEach(id => {
    elements[id] = new MockElement(id);
});

global.window = global;
global.window.addEventListener = (evt, cb) => {
    if (evt === 'DOMContentLoaded') global._dclCallbacks.push(cb);
};
global.window.removeEventListener = () => {};
global.document = {
    getElementById: (id) => {
        if (!elements[id]) elements[id] = new MockElement(id);
        return elements[id];
    },
    querySelector: (sel) => {
        if (sel.startsWith('#')) return global.document.getElementById(sel.slice(1));
        return new MockElement();
    },
    querySelectorAll: (sel) => [new MockElement()],
    createElement: (tag) => new MockElement('', tag),
    body: new MockElement('body', 'body'),
    addEventListener: (evt, cb) => {
        if (evt === 'DOMContentLoaded') global._dclCallbacks.push(cb);
    },
    removeEventListener: () => {}
};
global._dclCallbacks = [];
global.localStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};
global.sessionStorage = {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; }
};
global.navigator = { userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)' };
global.location = { hash: '', reload: () => {}, search: '', href: 'https://ganpans.com' };
global.history = { replaceState: () => {}, pushState: () => {} };

// Evaluate scripts in order
try {
    eval(secUtilsJs);
    console.log('1. security-utils.js loaded.');
    eval(dataStoreJs);
    console.log('2. data-store.js loaded.');
    eval(appJs);
    console.log('3. app.js loaded.');

    console.log(`Registered DOMContentLoaded callbacks: ${global._dclCallbacks.length}`);
    global._dclCallbacks.forEach((cb, idx) => {
        console.log(`Running DOMContentLoaded #${idx + 1}...`);
        cb();
        console.log(`DOMContentLoaded #${idx + 1} completed!`);
    });

    // Now verify if AI assistant trigger and quick reply buttons have listeners!
    const trigger = elements['ai-assistant-trigger'];
    console.log('Trigger listeners:', Object.keys(trigger.listeners));
    const chatMessages = elements['ai-chat-messages'];
    console.log('ChatMessages listeners:', Object.keys(chatMessages.listeners));

} catch (e) {
    console.error('FATAL RUNTIME ERROR during script evaluation:', e);
}
