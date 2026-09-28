// Run app.js DOMContentLoaded in a simulated browser DOM environment to find runtime errors!
const fs = require('fs');
const indexHtml = fs.readFileSync('index.html', 'utf8');
const appJs = fs.readFileSync('app.js', 'utf8');

// Extract all IDs from indexHtml
const idRegex = /id=["']([^"']+)["']/g;
const allIds = new Set();
let match;
while ((match = idRegex.exec(indexHtml)) !== null) {
    allIds.add(match[1]);
}

// Minimal DOM mock
class MockElement {
    constructor(id = '', tag = 'div') {
        this.id = id;
        this.tagName = tag.toUpperCase();
        this.classList = {
            add: () => {},
            remove: () => {},
            contains: () => false,
            toggle: () => {}
        };
        this.style = {};
        this.children = [];
        this.innerHTML = '';
        this.innerText = '';
        this.value = '';
        this.listeners = {};
    }
    addEventListener(evt, cb) {
        if (!this.listeners[evt]) this.listeners[evt] = [];
        this.listeners[evt].push(cb);
    }
    removeEventListener() {}
    querySelector() { return new MockElement(); }
    querySelectorAll() { return [new MockElement()]; }
    appendChild(child) { this.children.push(child); return child; }
    removeChild() {}
    remove() {}
    focus() {}
    blur() {}
    setAttribute() {}
    getAttribute() { return ''; }
    closest() { return new MockElement(); }
    scrollIntoView() {}
}

const elementCache = {};
allIds.forEach(id => {
    elementCache[id] = new MockElement(id);
});

global.window = global;
global.window.addEventListener = (evt, cb) => {
    if (evt === 'DOMContentLoaded') {
        global._dclCallbacks.push(cb);
    }
};
global.window.removeEventListener = () => {};
global.document = {
    getElementById: (id) => {
        if (elementCache[id]) return elementCache[id];
        if (allIds.has(id)) {
            elementCache[id] = new MockElement(id);
            return elementCache[id];
        }
        return null;
    },
    querySelector: (sel) => {
        if (sel.startsWith('#')) {
            const id = sel.slice(1);
            return global.document.getElementById(id);
        }
        return new MockElement();
    },
    querySelectorAll: (sel) => {
        return [new MockElement()];
    },
    createElement: (tag) => new MockElement('', tag),
    body: new MockElement('body', 'body'),
    addEventListener: (evt, cb) => {
        if (evt === 'DOMContentLoaded') {
            global._dclCallbacks.push(cb);
        }
    },
    removeEventListener: () => {}
};
global._dclCallbacks = [];

global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};
global.sessionStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {}
};
global.navigator = { userAgent: 'Node' };
global.location = { hash: '', reload: () => {}, search: '' };
global.history = { replaceState: () => {}, pushState: () => {} };

// Mock global dependencies
global.DataStore = {
    getActiveUser: () => null,
    getApplications: () => [],
    getItems: () => [],
    syncFromSupabase: async () => {},
    notifyAll: () => {},
    subscribe: () => {}
};
global.SecurityUtils = {
    sanitizeInput: s => s,
    escapeHtml: s => s
};

console.log('--- Loading app.js ---');
try {
    eval(appJs);
    console.log('app.js evaluated successfully without syntax/top-level error.');
    console.log(`Registered DOMContentLoaded callbacks: ${global._dclCallbacks.length}`);
    
    // Now execute DOMContentLoaded callbacks!
    global._dclCallbacks.forEach((cb, i) => {
        console.log(`Executing DOMContentLoaded callback #${i+1}...`);
        try {
            cb();
            console.log(`DOMContentLoaded callback #${i+1} EXECUTED CLEANLY!`);
        } catch (e) {
            console.error(`ERROR in DOMContentLoaded callback #${i+1}:`, e);
        }
    });

} catch (err) {
    console.error('Fatal error loading app.js:', err);
}
