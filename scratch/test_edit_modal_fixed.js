const fs = require('fs');

// DOM Mock
global.window = global;
global.window.addEventListener = function() {};
global.document = {
  elements: {},
  body: {
    appendChild: function(el) {
      global.document.elements[el.id] = el;
      return el;
    }
  },
  getElementById: function(id) {
    return global.document.elements[id] || null;
  },
  createElement: function(tag) {
    return {
      tagName: tag,
      id: '',
      className: '',
      style: {
        cssText: '',
        display: '',
        setProperty: function(k, v, imp) { this[k] = v; }
      },
      classList: {
        remove: function() {}
      },
      innerHTML: ''
    };
  },
  addEventListener: function() {}
};

global.localStorage = {
  store: {
    applications: JSON.stringify([
      {
        id: 'B-260903-001',
        storeName: '맛있는 식당',
        ownerName: '홍길동',
        ownerPhone: '010-1234-5678',
        storeAddress: '서울시 강남구 테헤란로 123',
        status: 'pending',
        signType: 'LED 채널',
        referrerCode: 'B-260903'
      }
    ])
  },
  getItem: function(k) { return this.store[k] || null; },
  setItem: function(k, v) { this.store[k] = v; }
};

global.alert = function(msg) { console.log('[Alert]:', msg); };

// Load and evaluate dashboard logic
const dashboardCode = fs.readFileSync('dashboard.js', 'utf8');

// Test if openEditApplicationModal exists
console.log('--- Testing Edit Modal Logic ---');
eval(dashboardCode);

if (typeof window.openEditApplicationModal === 'function') {
  console.log('✓ window.openEditApplicationModal is properly exported');
  
  // Open modal
  window.openEditApplicationModal('B-260903-001');
  const modal = global.document.getElementById('modal-edit-application');
  if (modal) {
    console.log('✓ Modal created successfully');
    console.log('Modal className:', modal.className);
    console.log('Modal style cssText contains !important:', modal.style.cssText.includes('!important'));
    console.log('Modal contains form:', modal.innerHTML.includes('id="form-edit-application"'));
    console.log('Modal contains storeName input:', modal.innerHTML.includes('id="edit-app-store-name"'));
  } else {
    console.error('✗ Modal was not created in DOM');
  }
} else {
  console.error('✗ window.openEditApplicationModal not found');
}
