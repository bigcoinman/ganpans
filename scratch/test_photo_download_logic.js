const fs = require('fs');

const testCases = [
  {
    name: "수리왕갈비 (Lightweight payload: photosCount=2, fileName='IMG_01.jpg, IMG_02.jpg', photos=[])",
    app: {
      id: "app-suri-1",
      storeName: "수리왕갈비",
      fileName: "IMG_01.jpg, IMG_02.jpg",
      photos: [],
      photosCount: 2,
      hasPhoto: true
    },
    expectedHasPhoto: true,
    expectedCount: 2
  },
  {
    name: "Legacy payload with base64 in photos array (2 photos)",
    app: {
      id: "app-legacy-2",
      storeName: "테스트식당",
      photos: ["data:image/jpeg;base64,...1", "data:image/jpeg;base64,...2"],
      fileName: "IMG_01.jpg, IMG_02.jpg"
    },
    expectedHasPhoto: true,
    expectedCount: 2
  },
  {
    name: "Single photo via image_url",
    app: {
      id: "app-single-3",
      storeName: "한양정육",
      image_url: "data:image/jpeg;base64,...",
      fileName: "한양_간판.jpg"
    },
    expectedHasPhoto: true,
    expectedCount: 1
  },
  {
    name: "No photo (미등록)",
    app: {
      id: "app-none-4",
      storeName: "무사진업체",
      photos: [],
      fileName: "업로드 파일 없음",
      photosCount: 0,
      hasPhoto: false
    },
    expectedHasPhoto: false,
    expectedCount: 0
  }
];

function evaluateDashboardPc(app) {
  const photosArr = (Array.isArray(app.photos) && app.photos.length > 0) ? app.photos.filter(p => p && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:'))) : [];
  const photoSrc = (photosArr.length > 0) ? photosArr[0] : (app.fileData || (app.image_url && (app.image_url.startsWith('data:') || app.image_url.startsWith('[') || app.image_url.startsWith('http') || app.image_url.startsWith('blob:')) ? app.image_url : ''));
  const hasPhoto = Boolean(
    (photosArr.length > 0) ||
    (photoSrc && photoSrc !== '업로드 파일 없음' && (photoSrc.startsWith('data:') || photoSrc.startsWith('[') || photoSrc.startsWith('http') || photoSrc.startsWith('blob:'))) ||
    (app.photosCount && app.photosCount > 0) ||
    (app.photos_count && app.photos_count > 0) ||
    app.hasPhoto ||
    (app.fileName && app.fileName !== '업로드 파일 없음' && String(app.fileName).trim() !== '') ||
    (app.file_name && app.file_name !== '업로드 파일 없음' && String(app.file_name).trim() !== '')
  );
  const count = photosArr.length > 0 ? photosArr.length : (app.photosCount || app.photos_count || (hasPhoto ? 1 : 0));
  return { hasPhoto, count };
}

function evaluateDashboardMob(app) {
  let photoList = [];
  if (Array.isArray(app.photos) && app.photos.length > 0) {
    photoList = app.photos.filter(p => p && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
  } else if (app.fileData && (app.fileData.startsWith('data:') || app.fileData.startsWith('http') || app.fileData.startsWith('blob:'))) {
    photoList = [app.fileData];
  } else if (app.image_url && (app.image_url.startsWith('data:') || app.image_url.startsWith('[') || app.image_url.startsWith('http') || app.image_url.startsWith('blob:'))) {
    if (app.image_url.startsWith('[')) {
      try {
        const parsed = JSON.parse(app.image_url);
        if (Array.isArray(parsed)) photoList = parsed;
      } catch (e) { photoList = [app.image_url]; }
    } else {
      photoList = [app.image_url];
    }
  }
  let count = photoList.length;
  let hasPhoto = count > 0 || Boolean(
    app.hasPhoto || 
    (app.photosCount > 0) || 
    (app.photos_count > 0) || 
    (app.fileName && app.fileName !== '업로드 파일 없음' && String(app.fileName).trim() !== '') ||
    (app.file_name && app.file_name !== '업로드 파일 없음' && String(app.file_name).trim() !== '')
  );
  if (!count && hasPhoto) count = app.photosCount || app.photos_count || 1;
  return { hasPhoto, count };
}

function evaluateAppUserApplications(app) {
  const photosArr = (Array.isArray(app.photos) && app.photos.length > 0) ? app.photos.filter(p => p && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:'))) : [];
  const photoSrc = (photosArr.length > 0) ? photosArr[0] : (app.fileData || (app.image_url && (app.image_url.startsWith('data:') || app.image_url.startsWith('[') || app.image_url.startsWith('http') || app.image_url.startsWith('blob:')) ? app.image_url : ''));
  const hasPhoto = Boolean(
    (photosArr.length > 0) ||
    (photoSrc && photoSrc !== '업로드 파일 없음' && (photoSrc.startsWith('data:') || photoSrc.startsWith('[') || photoSrc.startsWith('http') || photoSrc.startsWith('blob:'))) ||
    (app.photosCount && app.photosCount > 0) ||
    (app.photos_count && app.photos_count > 0) ||
    app.hasPhoto ||
    (app.fileName && app.fileName !== '업로드 파일 없음' && String(app.fileName).trim() !== '') ||
    (app.file_name && app.file_name !== '업로드 파일 없음' && String(app.file_name).trim() !== '')
  );
  const count = photosArr.length > 0 ? photosArr.length : (app.photosCount || app.photos_count || (hasPhoto ? 1 : 0));
  return { hasPhoto, count };
}

console.log("=== PHOTO DOWNLOAD BUTTON EVALUATION TEST ===");
let allPassed = true;

testCases.forEach((tc, idx) => {
  console.log(`\n[Test Case ${idx + 1}] ${tc.name}`);
  
  const resPc = evaluateDashboardPc(tc.app);
  const resMob = evaluateDashboardMob(tc.app);
  const resApp = evaluateAppUserApplications(tc.app);
  
  const pcPass = resPc.hasPhoto === tc.expectedHasPhoto && (tc.expectedHasPhoto ? resPc.count === tc.expectedCount : true);
  const mobPass = resMob.hasPhoto === tc.expectedHasPhoto && (tc.expectedHasPhoto ? resMob.count === tc.expectedCount : true);
  const appPass = resApp.hasPhoto === tc.expectedHasPhoto && (tc.expectedHasPhoto ? resApp.count === tc.expectedCount : true);
  
  console.log(` - Dashboard PC : hasPhoto=${resPc.hasPhoto}, count=${resPc.count} -> ${pcPass ? 'PASS' : 'FAIL'}`);
  console.log(` - Dashboard Mob: hasPhoto=${resMob.hasPhoto}, count=${resMob.count} -> ${mobPass ? 'PASS' : 'FAIL'}`);
  console.log(` - App User View: hasPhoto=${resApp.hasPhoto}, count=${resApp.count} -> ${appPass ? 'PASS' : 'FAIL'}`);
  
  if (!pcPass || !mobPass || !appPass) {
    allPassed = false;
  }
});

console.log(`\n>>> OVERALL PHOTO DOWNLOAD TEST RESULT: ${allPassed ? 'ALL TESTS PASSED PERFECTLY!' : 'FAILURES DETECTED'}`);
process.exit(allPassed ? 0 : 1);
