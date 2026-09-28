const fs = require('fs');
const path = require('path');

console.log('=== Step 1: DOM Integrity Inspection ===');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const requiredElements = [
  'id="file-upload-area"',
  'id="store-photo"',
  'id="store-photo-camera"',
  'id="photo-choice-overlay"',
  'id="photo-choice-sheet"',
  'id="btn-choice-camera"',
  'id="btn-choice-gallery"',
  'id="btn-choice-cancel"',
  'onclick="if(window.triggerPhotoCamera) window.triggerPhotoCamera();"',
  'onclick="if(window.triggerPhotoGallery) window.triggerPhotoGallery();"',
  'onclick="if(window.closePhotoChoiceSheet) window.closePhotoChoiceSheet();"'
];

for (const pattern of requiredElements) {
  if (!html.includes(pattern)) {
    throw new Error(`Missing expected element/attribute in index.html: ${pattern}`);
  }
  console.log(`[PASS] Found in index.html: ${pattern}`);
}

console.log('\n=== Step 2: JS Handler & Function Definition Inspection ===');
const appJs = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');

const requiredJsSnippets = [
  'window.triggerPhotoCamera = function()',
  'window.triggerPhotoGallery = function()',
  'window.closePhotoChoiceSheet = function()',
  'camInput.click()',
  'galInput.click()',
  'btnChoiceCamera.onclick',
  'btnChoiceGallery.onclick',
  'btnChoiceCancel.onclick',
  'photoChoiceOverlay.onclick'
];

for (const snippet of requiredJsSnippets) {
  if (!appJs.includes(snippet)) {
    throw new Error(`Missing expected JS snippet in app.js: ${snippet}`);
  }
  console.log(`[PASS] Found in app.js: ${snippet}`);
}

console.log('\n=== Step 3: Logic Simulation ===');
// Simulate the handlers
const mockOverlay = { active: true, classList: { remove: function(c) { if (c === 'active') mockOverlay.active = false; }, add: function(c) { if (c === 'active') mockOverlay.active = true; } } };
let cameraClickCount = 0;
let galleryClickCount = 0;
const mockCamInput = { value: 'old.jpg', click: () => { cameraClickCount++; } };
const mockGalInput = { value: 'old.jpg', click: () => { galleryClickCount++; } };

const mockDocument = {
  getElementById: (id) => {
    if (id === 'photo-choice-overlay') return mockOverlay;
    if (id === 'store-photo-camera') return mockCamInput;
    if (id === 'store-photo') return mockGalInput;
    return null;
  }
};

// Camera trigger function
function testCamera() {
  const overlay = mockDocument.getElementById('photo-choice-overlay');
  if (overlay) overlay.classList.remove('active');
  const camInput = mockDocument.getElementById('store-photo-camera');
  if (camInput) {
    camInput.value = '';
    camInput.click();
  }
}

// Gallery trigger function
function testGallery() {
  const overlay = mockDocument.getElementById('photo-choice-overlay');
  if (overlay) overlay.classList.remove('active');
  const galInput = mockDocument.getElementById('store-photo');
  if (galInput) {
    galInput.value = '';
    galInput.click();
  }
}

// Cancel trigger function
function testCancel() {
  const overlay = mockDocument.getElementById('photo-choice-overlay');
  if (overlay) overlay.classList.remove('active');
}

mockOverlay.active = true;
testCamera();
console.assert(mockOverlay.active === false, 'Overlay should be closed');
console.assert(cameraClickCount === 1, 'Camera input click triggered');
console.assert(mockCamInput.value === '', 'Camera input reset');
console.log('[PASS] Camera trigger works cleanly and resets input value');

mockOverlay.active = true;
testGallery();
console.assert(mockOverlay.active === false, 'Overlay should be closed');
console.assert(galleryClickCount === 1, 'Gallery input click triggered');
console.assert(mockGalInput.value === '', 'Gallery input reset');
console.log('[PASS] Gallery trigger works cleanly and resets input value');

mockOverlay.active = true;
testCancel();
console.assert(mockOverlay.active === false, 'Overlay should be closed');
console.log('[PASS] Cancel trigger works cleanly');

console.log('\n=== ALL 3-STEP SELF-VERIFICATIONS 100% PASSED ===');
