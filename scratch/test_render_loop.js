const fs = require('fs');

const targetApp = {
  id: 'P-260928-001',
  userId: '01088884485',
  ownerName: '시진핑',
  ownerPhone: '01088884485',
  storeName: '시진핑반점',
  storeAddress: '경기도 여주시 여주읍 2674',
  signType: '간판지원신청',
  fileName: '업로드 파일 없음',
  fileData: '',
  photos: [],
  photosCount: 1,
  hasPhoto: true,
  appliedAt: '2026-09-28T10:27:04.835+00:00',
  status: 'pending',
  referrerCode: '',
  salespersonId: '',
  salespersonName: '',
  isBizItem: false,
  receiptStatus: '접수예정',
  progressStatus: '지원대기중',
  memo: '{"isBizItem":false,"receiptStatus":"접수예정","progressStatus":"지원대기중","constructionStatus":"before_construction","salespersonId":"","salespersonName":"","referrerCode":"","photoCount":1}'
};

// Check getAppPhotoInfo
function getAppPhotoInfo(app) {
  let count = 0;
  if (Array.isArray(app.photos)) {
    count = app.photos.length;
  }
  if (count === 0 && app.photosCount) {
    count = Number(app.photosCount) || 0;
  }
  if (count === 0 && app.memo) {
    try {
      const m = typeof app.memo === 'string' ? JSON.parse(app.memo) : app.memo;
      if (m && m.photoCount) count = Number(m.photoCount) || 0;
    } catch (e) {}
  }
  const has = count > 0 || Boolean(app.fileData || app.hasPhoto);
  return { count, hasPhoto: has };
}

console.log('Photo info:', getAppPhotoInfo(targetApp));
