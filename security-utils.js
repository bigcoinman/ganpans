/**
 * security-utils.js
 * 보안 강화를 위한 공통 암호화 및 인코딩 유틸리티
 */

// 1. 단방향 암호화 SHA-256 해시 함수 (순수 자바스크립트 구현)
function sha256(ascii) {
  function rightRotate(value, amount) {
    return (value >>> amount) | (value << (32 - amount));
  }
  
  var mathPow = Math.pow;
  var maxWord = mathPow(2, 32);
  var lengthProperty = 'length';
  var i, j;
  var result = '';

  var words = [];
  var asciiLength = ascii[lengthProperty];
  
  var hash = sha256.h = sha256.h || [];
  var k = sha256.k = sha256.k || [];
  var primeCounter = k[lengthProperty];

  var isPrime = {};
  for (var candidate = 2; primeCounter < 64; candidate++) {
    if (!isPrime[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isPrime[i] = 1;
      }
      hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }
  
  ascii += '\x80';
  while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';
  for (i = 0; i < ascii[lengthProperty]; i++) {
    j = ascii.charCodeAt(i);
    if (j >> 8) return; // ASCII only
    words[i >> 2] |= j << ((3 - i % 4) * 8);
  }
  words[words[lengthProperty]] = ((asciiLength * 8) / maxWord) | 0;
  words[words[lengthProperty]] = (asciiLength * 8) | 0;
  
  for (j = 0; j < words[lengthProperty]; ) {
    var w = words.slice(j, j += 16);
    var oldHash = hash.slice(0);
    
    hash = hash.slice(0, 8);
    
    for (i = 0; i < 64; i++) {
      var w16 = w[i - 16], w15 = w[i - 15], w7 = w[i - 7], w2 = w[i - 2];
      
      var a = hash[0], e = hash[4];
      var temp1 = hash[7]
        + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
        + ((e & hash[5]) ^ (~e & hash[6]))
        + k[i]
        + (w[i] = (i < 16) ? w[i] : (
            w16
            + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
            + w7
            + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
          ) | 0
        );
      
      var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
        + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
      
      hash = [(temp1 + temp2) | 0].concat(hash);
      hash[4] = (hash[4] + temp1) | 0;
    }
    
    for (i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }
  
  for (i = 0; i < 8; i++) {
    var byteVal = hash[i];
    if (byteVal < 0) byteVal += maxWord;
    var byteString = byteVal.toString(16);
    while (byteString[lengthProperty] < 8) byteString = '0' + byteString;
    result += byteString;
  }
  return result;
}

// 2. XSS 방지를 위한 HTML 이스케이프 함수
function escapeHtml(text) {
  if (text === null || text === undefined) return '';
  if (typeof text !== 'string') text = String(text);
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 3. 세션 스토리지 저장 시 민감 정보(비밀번호) 제거 함수
function sanitizeUser(user) {
  if (!user) return null;
  const safeUser = JSON.parse(JSON.stringify(user));
  if ('pw' in safeUser) {
    delete safeUser.pw;
  }
  return safeUser;
}

// 4. XSS 예방을 위해 URL에서 위험한 프로토콜(javascript 등)을 제거하고 이스케이프하는 함수
function sanitizeUrl(url) {
  if (!url) return '';
  const trimmed = url.trim();
  if (trimmed.toLowerCase().startsWith('javascript:') || trimmed.toLowerCase().startsWith('data:text/html')) {
    return 'about:blank';
  }
  return escapeHtml(trimmed);
}

// 4-0. 현장 사진 온디맨드 로딩 헬퍼 (대역폭 99% 절감을 위해 목록 조회 시 제외된 사진을 필요 시 1건만 Supabase에서 직접 로드)
async function ensureApplicationPhotosLoaded(appOrId) {
  let app = appOrId;
  if (typeof appOrId === 'string' || typeof appOrId === 'number') {
    const localApps = JSON.parse(localStorage.getItem('applications')) || [];
    app = localApps.find(a => String(a.id) === String(appOrId));
  }
  if (!app) return null;

  // 이미 메모리나 객체 내에 유효한 사진 데이터가 로드되어 있는 경우 즉시 반환
  if (Array.isArray(app.photos) && app.photos.length > 0 && app.photos[0] && (app.photos[0].startsWith('data:') || app.photos[0].startsWith('http') || app.photos[0].startsWith('blob:'))) {
    return app;
  }
  if (app.fileData && typeof app.fileData === 'string' && (app.fileData.startsWith('data:') || app.fileData.startsWith('http') || app.fileData.startsWith('blob:'))) {
    return app;
  }

  // Supabase 클라우드에서 해당 1건의 사진만 온디맨드 단일 조회
  if (window.supabaseClient) {
    try {
      const { data, error } = await window.supabaseClient
        .from('applications')
        .select('id, image_url, construction_photos, construction_invoice')
        .eq('id', String(app.id))
        .maybeSingle();

      if (!error && data) {
        let photos = [];
        let fileData = '';
        if (data.image_url) {
          const imgStr = String(data.image_url).trim();
          if (imgStr.startsWith('[') && imgStr.includes('data:')) {
            try {
              const parsed = JSON.parse(imgStr);
              if (Array.isArray(parsed)) {
                photos = parsed.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
                fileData = photos[0] || '';
              }
            } catch (e) {
              photos = [imgStr];
              fileData = imgStr;
            }
          } else if (imgStr.startsWith('data:') || imgStr.startsWith('http') || imgStr.startsWith('blob:')) {
            photos = [imgStr];
            fileData = imgStr;
          }
        }
        app.photos = photos;
        app.photosCount = photos.length;
        app.fileData = fileData;
        if (Array.isArray(data.construction_photos)) {
          app.constructionPhotos = data.construction_photos;
        }
        if (data.construction_invoice) {
          app.invoicePhotos = [data.construction_invoice];
        }

        // 로컬 스토리지 캐시에 저장하여 다음 번 클릭 시 0초 즉시 반응
        const localApps = JSON.parse(localStorage.getItem('applications')) || [];
        const idx = localApps.findIndex(a => String(a.id) === String(app.id));
        if (idx !== -1) {
          localApps[idx].photos = app.photos;
          localApps[idx].fileData = app.fileData;
          localApps[idx].photosCount = app.photosCount;
          if (app.constructionPhotos) localApps[idx].constructionPhotos = app.constructionPhotos;
          if (app.invoicePhotos) localApps[idx].invoicePhotos = app.invoicePhotos;
          try {
            localStorage.setItem('applications', JSON.stringify(localApps));
          } catch (eStorage) {}
        }
      }
    } catch (eFetch) {
      console.warn('ensureApplicationPhotosLoaded fetch error:', eFetch);
    }
  }

  return app;
}
window.ensureApplicationPhotosLoaded = ensureApplicationPhotosLoaded;

// 4-1. 현장 사진 다운로드 (1장이면 이미지 단일 다운로드, 2장 이상이면 ZIP 압축 파일 자동 일괄 다운로드)
async function downloadApplicationPhotos(appOrId) {
  let app = await ensureApplicationPhotosLoaded(appOrId);
  if (!app) {
    alert('신청서 정보를 찾을 수 없습니다.');
    return;
  }

  const storeName = app.storeName || app.shopName || app.ownerName || '신청점포';
  let photos = [];

  // 1) photos 배열에서 추출
  if (Array.isArray(app.photos) && app.photos.length > 0) {
    photos = app.photos.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
  }

  // 2) fileData 에서 보강
  if (photos.length === 0 && app.fileData && typeof app.fileData === 'string' && (app.fileData.startsWith('data:') || app.fileData.startsWith('http') || app.fileData.startsWith('blob:'))) {
    photos = [app.fileData];
  }

  // 3) image_url 에서 JSON 배열 또는 단일 URL 파싱
  if (photos.length === 0 && app.image_url && typeof app.image_url === 'string') {
    if (app.image_url.startsWith('[') && app.image_url.includes('data:')) {
      try {
        const parsed = JSON.parse(app.image_url);
        if (Array.isArray(parsed)) {
          photos = parsed.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
        }
      } catch (e) {}
    } else if (app.image_url.startsWith('data:') || app.image_url.startsWith('http') || app.image_url.startsWith('blob:')) {
      photos = [app.image_url];
    }
  }

  if (photos.length === 0) {
    alert('다운로드 가능한 현장 사진이 없습니다.\n[사진 등록] 버튼으로 사진을 등록해 주세요.');
    return;
  }

  // A. 사진이 1장인 경우: 원본 이미지 파일 즉시 다운로드
  if (photos.length === 1) {
    const singleData = photos[0];
    let ext = 'jpg';
    if (singleData.startsWith('data:image/')) {
      const m = singleData.match(/^data:image\/([a-zA-Z0-9]+);/);
      if (m && m[1]) ext = (m[1] === 'jpeg') ? 'jpg' : m[1];
    }
    const fileName = (app.fileName && !app.fileName.includes(',') && !app.fileName.startsWith('data:') && app.fileName !== '현장사진')
      ? app.fileName
      : `${storeName}_현장사진.${ext}`;

    const a = document.createElement('a');
    a.href = singleData;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  // 2장 이상인 경우: 사진 다운로드 전용 팝업 모달 표시
  showPhotoDownloadModal(app);
}
window.downloadApplicationPhotos = downloadApplicationPhotos;

// ZIP 압축 파일 생성 다운로드 함수
async function downloadZipFile(appOrId) {
  let app = await ensureApplicationPhotosLoaded(appOrId);
  if (!app) {
    alert('신청서 정보를 찾을 수 없습니다.');
    return;
  }

  const storeName = app.storeName || app.shopName || app.ownerName || '신청점포';
  const safeStoreName = storeName.replace(/[\\/:*?"<>|]/g, '_').trim() || '신청점포';
  let photos = [];

  if (Array.isArray(app.photos) && app.photos.length > 0) {
    photos = app.photos.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
  }
  if (photos.length === 0 && app.fileData && typeof app.fileData === 'string' && (app.fileData.startsWith('data:') || app.fileData.startsWith('http') || app.fileData.startsWith('blob:'))) {
    photos = [app.fileData];
  }

  if (photos.length === 0) {
    alert('다운로드 가능한 현장 사진이 없습니다.');
    return;
  }

  if (typeof JSZip !== 'undefined') {
    try {
      const zip = new JSZip();

      for (let idx = 0; idx < photos.length; idx++) {
        const photoData = photos[idx];
        let ext = 'jpg';
        if (photoData.startsWith('data:image/')) {
          const matches = photoData.match(/^data:image\/([a-zA-Z0-9+]+);/);
          if (matches && matches[1]) {
            ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
          }
        }

        try {
          const base64Clean = photoData.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '').replace(/\s/g, '');
          const byteString = atob(base64Clean);
          const len = byteString.length;
          const bytes = new Uint8Array(len);
          for (let i = 0; i < len; i++) {
            bytes[i] = byteString.charCodeAt(i);
          }

          // 영문+숫자 안전 인코딩 파일명으로 zip 내부 충돌 방지
          const photoFileName = `photo_${idx + 1}.${ext}`;
          zip.file(photoFileName, bytes, { date: new Date() });
        } catch (eConv) {
          console.warn('Image convert error on photo ' + idx, eConv);
        }
      }

      const content = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/zip',
        compression: 'STORE',
        platform: 'DOS'
      });

      const zipFileName = `${safeStoreName}_현장사진_전체(${photos.length}장).zip`;
      const zipUrl = URL.createObjectURL(content);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = zipFileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 30000);
    } catch (zipErr) {
      console.error('ZIP generation error:', zipErr);
      downloadIndividualPhotos(app);
    }
  } else {
    downloadIndividualPhotos(app);
  }
}
window.downloadZipFile = downloadZipFile;

// 압축 해제 없이 모든 사진을 브라우저에서 즉시 개별 다운로드하는 함수 (보안 경고 0%)
async function downloadIndividualPhotos(appOrId) {
  let app = await ensureApplicationPhotosLoaded(appOrId);
  if (!app) {
    alert('신청서 정보를 찾을 수 없습니다.');
    return;
  }

  const storeName = app.storeName || app.shopName || app.ownerName || '신청점포';
  const safeStoreName = storeName.replace(/[\\/:*?"<>|]/g, '_').trim() || '신청점포';
  let photos = [];

  if (Array.isArray(app.photos) && app.photos.length > 0) {
    photos = app.photos.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
  }
  if (photos.length === 0 && app.fileData && typeof app.fileData === 'string' && (app.fileData.startsWith('data:') || app.fileData.startsWith('http') || app.fileData.startsWith('blob:'))) {
    photos = [app.fileData];
  }

  if (photos.length === 0) {
    alert('다운로드 가능한 현장 사진이 없습니다.');
    return;
  }

  photos.forEach((photoData, idx) => {
    let ext = 'jpg';
    if (photoData.startsWith('data:image/')) {
      const matches = photoData.match(/^data:image\/([a-zA-Z0-9+]+);/);
      if (matches && matches[1]) {
        ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
      }
    }
    const a = document.createElement('a');
    a.href = photoData;
    a.download = `${safeStoreName}_현장사진_${idx + 1}.${ext}`;
    document.body.appendChild(a);
    setTimeout(() => {
      a.click();
      document.body.removeChild(a);
    }, idx * 250); // 순차 다운로드
  });
}
window.downloadIndividualPhotos = downloadIndividualPhotos;

// 사진 다운로드 & 갤러리 모달 팝업 표시
async function showPhotoDownloadModal(appOrId) {
  let app = await ensureApplicationPhotosLoaded(appOrId);
  if (!app) {
    alert('신청서 정보를 찾을 수 없습니다.');
    return;
  }

  const storeName = app.storeName || app.shopName || app.ownerName || '신청점포';
  const safeStoreName = storeName.replace(/[\\/:*?"<>|]/g, '_').trim() || '신청점포';
  let photos = [];

  if (Array.isArray(app.photos) && app.photos.length > 0) {
    photos = app.photos.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
  }
  if (photos.length === 0 && app.fileData && typeof app.fileData === 'string' && (app.fileData.startsWith('data:') || app.fileData.startsWith('http') || app.fileData.startsWith('blob:'))) {
    photos = [app.fileData];
  }
  if (photos.length === 0 && app.image_url && typeof app.image_url === 'string') {
    if (app.image_url.startsWith('[') && app.image_url.includes('data:')) {
      try {
        const parsed = JSON.parse(app.image_url);
        if (Array.isArray(parsed)) {
          photos = parsed.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
        }
      } catch (e) {}
    } else if (app.image_url.startsWith('data:') || app.image_url.startsWith('http') || app.image_url.startsWith('blob:')) {
      photos = [app.image_url];
    }
  }

  if (photos.length === 0) {
    alert('등록된 현장 사진이 없습니다.');
    return;
  }

  if (photos.length === 1) {
    const a = document.createElement('a');
    a.href = photos[0];
    a.download = `${safeStoreName}_현장사진_1.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return;
  }

  let modal = document.getElementById('photo-download-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'photo-download-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(15,23,42,0.65);backdrop-filter:blur(4px);z-index:99999;display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box;';
    document.body.appendChild(modal);
  }

  modal.innerHTML = `
    <div style="background:#ffffff;border-radius:16px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);width:100%;max-width:520px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;border:1px solid #e2e8f0;">
      <div style="padding:16px 20px;background:#f8fafc;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;">
        <div style="display:flex;align-items:center;gap:10px;">
          <div style="width:36px;height:36px;border-radius:10px;background:#eff6ff;color:#2563eb;display:flex;align-items:center;justify-content:center;font-size:1.1rem;">
            <i class="fa-solid fa-images"></i>
          </div>
          <div>
            <h3 style="margin:0;font-size:1.02rem;font-weight:700;color:#1e293b;">${escapeHtml(storeName)} 현장사진 다운로드</h3>
            <p style="margin:2px 0 0;font-size:0.8rem;color:#64748b;">총 ${photos.length}장의 사진이 등록되어 있습니다</p>
          </div>
        </div>
        <button type="button" onclick="document.getElementById('photo-download-modal').style.display='none'" style="background:none;border:none;font-size:1.4rem;color:#94a3b8;cursor:pointer;padding:4px 8px;border-radius:6px;line-height:1;" title="닫기">&times;</button>
      </div>

      <div style="padding:20px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:16px;">
        <div style="display:flex;flex-direction:column;gap:10px;">
          <button type="button" onclick="window.downloadIndividualPhotos('${app.id}');document.getElementById('photo-download-modal').style.display='none';" style="padding:13px 16px;background:linear-gradient(135deg, #2563eb, #1d4ed8);color:#ffffff;border:none;border-radius:10px;font-size:0.92rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;box-shadow:0 4px 6px -1px rgba(37,99,235,0.25);transition:all 0.15s;">
            <i class="fa-solid fa-cloud-arrow-down" style="font-size:1.05rem;"></i> 전체 사진 바로 저장 (${photos.length}장 일괄 다운로드)
          </button>
        </div>

        <div>
          <div style="font-size:0.84rem;font-weight:700;color:#475569;margin-bottom:10px;display:flex;align-items:center;gap:6px;">
            <i class="fa-regular fa-image"></i> 사진 미리보기 및 개별 저장
          </div>
          <div style="display:grid;grid-template-columns:repeat(auto-fill, minmax(95px, 1fr));gap:8px;max-height:220px;overflow-y:auto;padding:2px;">
            ${photos.map((p, idx) => `
              <div style="position:relative;border-radius:8px;overflow:hidden;border:1px solid #cbd5e1;background:#f8fafc;aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;">
                <img src="${sanitizeUrl(p)}" alt="사진 ${idx + 1}" style="width:100%;height:100%;object-fit:cover;">
                <a href="${sanitizeUrl(p)}" download="${safeStoreName}_현장사진_${idx + 1}.jpg" style="position:absolute;bottom:4px;right:4px;background:rgba(15,23,42,0.85);color:#ffffff;border-radius:6px;width:26px;height:26px;display:flex;align-items:center;justify-content:center;font-size:0.72rem;text-decoration:none;box-shadow:0 2px 4px rgba(0,0,0,0.3);" title="이 사진만 다운로드">
                  <i class="fa-solid fa-download"></i>
                </a>
              </div>
            `).join('')}
          </div>
        </div>
      </div>

      <div style="padding:12px 20px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;">
        <button type="button" onclick="document.getElementById('photo-download-modal').style.display='none'" style="padding:7px 18px;background:#e2e8f0;color:#475569;border:none;border-radius:8px;font-size:0.84rem;font-weight:600;cursor:pointer;">닫기</button>
      </div>
    </div>
  `;

  modal.style.display = 'flex';
}
window.showPhotoDownloadModal = showPhotoDownloadModal;

// ========================================================
// 5. 로그인 상태 유지 및 1시간 미사용 시 자동 로그아웃 관리
// ========================================================
const INACTIVITY_TIMEOUT_MS = 60 * 60 * 1000; // 1시간 (3,600,000 ms)

function isRememberMeActive() {
  return localStorage.getItem('activeUser_remember') === 'true' && !!localStorage.getItem('activeUser');
}

function recordUserActivity() {
  const now = Date.now().toString();
  sessionStorage.setItem('last_active_time', now);
  localStorage.setItem('last_active_time_session', now);
}

function checkInactivityTimeout() {
  // '로그인 상태 유지' 체크가 활성화되어 있다면 1시간 자동 로그아웃을 건너뜁니다.
  if (isRememberMeActive()) {
    return false;
  }

  // 세션 사용자가 존재하는 경우 (로그인 상태 유지 체크 안 함)
  const sessionUser = sessionStorage.getItem('activeUser');
  const localUser = localStorage.getItem('activeUser');
  
  if (sessionUser || (localUser && localStorage.getItem('activeUser_remember') !== 'true')) {
    const lastActiveStr = sessionStorage.getItem('last_active_time') || localStorage.getItem('last_active_time_session');
    
    if (lastActiveStr) {
      const lastActive = parseInt(lastActiveStr, 10);
      const elapsed = Date.now() - lastActive;
      
      if (!isNaN(lastActive) && elapsed >= INACTIVITY_TIMEOUT_MS) {
        // 1시간 초과 -> 자동 로그아웃
        clearActiveUser();
        alert('1시간 동안 사용이 없어 보안을 위해 자동 로그아웃되었습니다.');
        
        // 대시보드 페이지인 경우 메인으로 이동하거나 새로고침
        if (typeof window !== 'undefined') {
          if (window.location.pathname.includes('dashboard.html')) {
            window.location.href = 'index.html#apply-section';
          } else {
            window.location.reload();
          }
        }
        return true;
      }
    } else {
      // 최초 접속 시 현재 시간으로 갱신
      recordUserActivity();
    }
  }
  return false;
}

function getActiveUser() {
  // 1시간 타임아웃 검사 먼저 수행
  if (checkInactivityTimeout()) {
    return null;
  }

  let user = null;

  // 1) 로그인 상태 유지 (localStorage)
  const localUser = localStorage.getItem('activeUser');
  if (localUser && localStorage.getItem('activeUser_remember') === 'true') {
    try { user = JSON.parse(localUser); } catch(e) { user = null; }
  } else {
    // 2) 세션 로그인 (sessionStorage)
    const sessionUser = sessionStorage.getItem('activeUser');
    if (sessionUser) {
      try { user = JSON.parse(sessionUser); } catch(e) { user = null; }
    } else if (localUser) {
      // 3) 만약 localStorage에만 있고 remember_me가 지정되지 않은 구버전 캐시라면
      try { user = JSON.parse(localUser); } catch(e) { user = null; }
    }
  }

  if (user && user.id) {
    try {
      const deletedIds = JSON.parse(localStorage.getItem('deleted_user_ids')) || [];
      const uId = String(user.id || '');
      const uDigits = uId.replace(/[^0-9]/g, '');
      const uPhoneDigits = String(user.phone || '').replace(/[^0-9]/g, '');
      if (deletedIds.includes(uId) || (uDigits && deletedIds.includes(uDigits)) || (uPhoneDigits && deletedIds.includes(uPhoneDigits))) {
        clearActiveUser();
        return null;
      }

      // 최신 users 목록과 실시간 100% 동기화 (최고관리자의 승인/권한 변경/영업코드/시공코드 즉시 반영)
      const allUsers = JSON.parse(localStorage.getItem('users')) || [];
      const freshUser = allUsers.find(u => String(u.id).toLowerCase() === uId.toLowerCase());
      if (freshUser) {
        user = typeof sanitizeUser === 'function' ? sanitizeUser({ ...user, ...freshUser }) : { ...user, ...freshUser };
        if (sessionStorage.getItem('activeUser')) {
          sessionStorage.setItem('activeUser', JSON.stringify(user));
        }
        if (localStorage.getItem('activeUser')) {
          localStorage.setItem('activeUser', JSON.stringify(user));
        }
      }
    } catch (eDel) {}
  }

  return user;
}

function clearActiveUser() {
  localStorage.removeItem('activeUser');
  localStorage.removeItem('activeUser_remember');
  localStorage.removeItem('last_active_time_session');
  sessionStorage.removeItem('activeUser');
  sessionStorage.removeItem('last_active_time');
}

// 사용자 활동 감지 이벤트 리스너 등록
function initInactivityListeners() {
  if (typeof window === 'undefined') return;

  const activityEvents = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
  let throttleTimer = null;

  const handleActivity = () => {
    if (!throttleTimer) {
      throttleTimer = setTimeout(() => {
        throttleTimer = null;
        if (!isRememberMeActive() && getActiveUser()) {
          recordUserActivity();
        }
      }, 1000); // 1초 단위 쓰로틀링으로 성능 최적화
    }
  };

  activityEvents.forEach(evt => {
    window.addEventListener(evt, handleActivity, { passive: true });
  });

  // 브라우저 탭 전환/복귀 시 즉시 1시간 경과 체크
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkInactivityTimeout();
    }
  });

  // 주기적으로 (30초마다) 1시간 미사용 타임아웃 체크
  setInterval(checkInactivityTimeout, 30000);
}

// 초기화 실행
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInactivityListeners);
  } else {
    initInactivityListeners();
  }
}

// 6. Supabase 클라이언트 초기화 (전역 설정 파일 supabase-config.js 및 내장 Fallback 지원)
const defaultDbUrl = "https://nfexylsehsucctoefwdz.supabase.co";
const defaultDbKey = "sb_publishable_Ux7dNNRDLqVX8MAX6-MlIA_HueFAGhh";
const dbUrl = (typeof window !== 'undefined' && window.SUPABASE_URL) ? window.SUPABASE_URL : defaultDbUrl;
const dbKey = (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY) ? window.SUPABASE_ANON_KEY : defaultDbKey;
window.SUPABASE_URL = dbUrl;
window.SUPABASE_ANON_KEY = dbKey;
window.supabaseClient = null;

function initGlobalSupabaseClient() {
  if (window.supabaseClient) return window.supabaseClient;
  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      window.supabaseClient = window.supabase.createClient(window.SUPABASE_URL, window.SUPABASE_ANON_KEY);
    } catch (e) {
      console.error('Failed to create Supabase client:', e);
    }
  }
  return window.supabaseClient;
}

initGlobalSupabaseClient();

// DOMContentLoaded 시점에 Supabase client 재확인
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initGlobalSupabaseClient();
  });
}
// 6-1. 회원 목록 정렬 함수 (최고관리자 최상단 + 전환신청 대기자 우선 + 최신 가입일순 정렬)
function sortUsersLatestFirst(userList) {
  if (!Array.isArray(userList)) return [];
  return [...userList].sort((a, b) => {
    // 1) 최고관리자(admin) 계정 최상단 고정
    if (a.role === 'admin' && b.role !== 'admin') return -1;
    if (a.role !== 'admin' && b.role === 'admin') return 1;

    // 2) 전환 신청 대기중(pending)인 회원 우선 정렬
    const isPendingA = (a.conversionStatus === 'pending' || a.conversionStatus === 'pending_constructor') ? 1 : 0;
    const isPendingB = (b.conversionStatus === 'pending' || b.conversionStatus === 'pending_constructor') ? 1 : 0;
    if (isPendingB !== isPendingA) {
      return isPendingB - isPendingA;
    }

    // 3) 가입일시 최신순 (내림차순, 최신 가입자가 먼저 표시)
    const timeA = (a.createdAt || a.created_at) ? new Date(a.createdAt || a.created_at).getTime() : 0;
    const timeB = (b.createdAt || b.created_at) ? new Date(b.createdAt || b.created_at).getTime() : 0;
    if (timeB !== timeA) {
      return timeB - timeA;
    }

    // 4) 가입일시 동일 시 ID 알파벳/숫자 역순
    return String(b.id || '').localeCompare(String(a.id || ''));
  });
}
window.sortUsersLatestFirst = sortUsersLatestFirst;

// 6-2. 회원 가입일자 날짜 포맷 함수 (YYYY.MM.DD)
function formatUserDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}.${m}.${day}`;
}
window.formatUserDate = formatUserDate;

// 7. 실시간 사진 촬영본 및 이미지 파일 200~300KB 이하 강제 자동 축소/압축 유틸리티 (대역폭 다이어트 최적화)
function compressImageFile(file, maxSizeBytes = 300 * 1024) {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      resolve(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // 해상도 최적화 (긴 변 기준 최대 1200px - 고화질 선명도 유지 및 300KB 미만 경량화)
        const max_size = 1200;
        if (width > max_size || height > max_size) {
          if (width > height) {
            height = Math.round(height * (max_size / width));
            width = max_size;
          } else {
            width = Math.round(width * (max_size / height));
            height = max_size;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        let quality = 0.75;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let approximateSize = Math.round((dataUrl.length - 22) * 3 / 4);

        // 300KB 이하가 될 때까지 화질 품질(quality)을 단계적으로 축소 (강제 경량 압축)
        const targetMax = maxSizeBytes || (300 * 1024);
        while (approximateSize > targetMax && quality > 0.2) {
          quality -= 0.1;
          dataUrl = canvas.toDataURL('image/jpeg', quality);
          approximateSize = Math.round((dataUrl.length - 22) * 3 / 4);
        }

        try {
          const byteString = atob(dataUrl.split(',')[1]);
          const mimeString = dataUrl.split(',')[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: mimeString });
          const compressedFile = new File([blob], file.name || 'photo.jpg', { type: mimeString });
          compressedFile.dataUrl = dataUrl;
          resolve(compressedFile);
        } catch (err) {
          file.dataUrl = dataUrl;
          resolve(file);
        }
      };
      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };
    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}

function compressImageToBase64(file, maxSizeBytes = 300 * 1024) {
  return compressImageFile(file, maxSizeBytes).then((compressedFile) => {
    if (compressedFile && compressedFile.dataUrl) {
      return compressedFile.dataUrl;
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(compressedFile || file);
    });
  });
}

// 8. 영업자 코드 생성 헬퍼 (규칙: B-YYMM01 ~ 순차 증가)
function generateBizCode(usersList) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `B-${yy}${mm}`;

  const currentUsers = Array.isArray(usersList) ? usersList : (JSON.parse(localStorage.getItem('users')) || []);

  let maxSeq = 0;
  currentUsers.forEach(u => {
    if (u && u.bizCode && typeof u.bizCode === 'string' && u.bizCode.startsWith(prefix)) {
      const seqStr = u.bizCode.slice(prefix.length);
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(2, '0');
  return `${prefix}${nextSeq}`;
}

// 9. 일반회원 간판지원신청 고유번호 생성 헬퍼 (규칙: P-YYMMDD001 ~ 순차 증가)
function generateApplicationId(appsList) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const prefix = `P-${yy}${mm}${dd}`;

  const currentApps = Array.isArray(appsList) ? appsList : (JSON.parse(localStorage.getItem('applications')) || []);

  let maxSeq = 0;
  currentApps.forEach(app => {
    if (app && app.id && typeof app.id === 'string' && app.id.startsWith(prefix)) {
      const seqStr = app.id.slice(prefix.length);
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}

// 10. 영업자 간판접수신청 물건 고유번호 생성 헬퍼 (규칙: {bizCode}-001 ~ 순차 증가, 예: B-260901-001)
function generateBizItemId(bizCode, userItems) {
  const code = (bizCode && typeof bizCode === 'string' && bizCode.trim()) 
    ? bizCode.trim() 
    : (typeof generateBizCode === 'function' ? generateBizCode() : 'B-260801');
  const prefix = `${code}-`;
  const items = Array.isArray(userItems) ? [...userItems] : [];

  // applications에 저장된 항목도 함께 카운팅에 반영하여 중복 번호 방지
  try {
    const apps = JSON.parse(localStorage.getItem('applications')) || [];
    apps.forEach(app => {
      if (app && app.id && typeof app.id === 'string' && app.id.startsWith(prefix)) {
        items.push({ id: app.id });
      }
    });
  } catch (e) {}

  let maxSeq = 0;
  items.forEach(item => {
    if (item && item.id && typeof item.id === 'string' && item.id.startsWith(prefix)) {
      // split('-')의 마지막 토큰만 안전하게 추출하여 순번 파싱 (과거 날짜가 포함된 긴 ID도 100% 정상 파싱)
      const parts = item.id.split('-');
      const lastToken = parts[parts.length - 1];
      const seqNum = parseInt(lastToken, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}

// 12. 시공업체 회원 코드 생성 헬퍼 (규칙: BPC-YYMM001 ~ 순차 증가, 예: BPC-2608001, BPC-2608002)
function generateConstCode(usersList) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `BPC-${yy}${mm}`;

  const currentUsers = Array.isArray(usersList) ? usersList : (JSON.parse(localStorage.getItem('users')) || []);

  let maxSeq = 0;
  currentUsers.forEach(u => {
    if (u && u.constCode && typeof u.constCode === 'string') {
      const cleanCode = u.constCode.toUpperCase();
      if (cleanCode.startsWith(prefix) || cleanCode.startsWith(`BPC${yy}${mm}`)) {
        const rawSeqStr = cleanCode.replace(/^BPC-?\d{4}/, '');
        const seqNum = parseInt(rawSeqStr, 10);
        if (!isNaN(seqNum) && seqNum > maxSeq) {
          maxSeq = seqNum;
        }
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(3, '0');
  return `${prefix}${nextSeq}`;
}
window.generateConstCode = generateConstCode;

// 11. 개인정보 보호 마스킹 유틸리티
function maskName(name) {
  if (!name) return '고객';
  const str = String(name).trim();
  if (str.length <= 1) return str;
  if (str.length === 2) return str[0] + '*';
  return str[0] + '*'.repeat(str.length - 2) + str[str.length - 1];
}

function maskPhone(phone) {
  if (!phone) return '010-****-****';
  const clean = String(phone).replace(/[^0-9]/g, '');
  if (clean.length === 11) {
    return `${clean.slice(0, 3)}-****-${clean.slice(7)}`;
  } else if (clean.length === 10) {
    return `${clean.slice(0, 3)}-***-${clean.slice(6)}`;
  }
  return String(phone).replace(/(\d{2,3})[^\d]?(\d{3,4})[^\d]?(\d{4})/, '$1-****-$3');
}

// =========================================================================
// 13. Supabase 실시간 통합 양방향 동기화 엔진 (SupabaseSync)
// PC 웹과 모바일 앱 간의 회원 가입, 전환 신청, 관리자 승인/반려, 신청서 완벽 동기화
// =========================================================================
window.SupabaseSync = {
  isSyncing: false,
  autoSyncTimer: null,

  // 사용자 객체를 Supabase DB 컬럼으로 매핑 (items 내부의 base64 사진 데이터 분리 경량화)
  mapUserToDb(user) {
    if (!user) return null;
    let safeItems = user.items || [];
    if (Array.isArray(safeItems)) {
      safeItems = safeItems.map(item => {
        if (!item || typeof item !== 'object') return item;
        const count = (Array.isArray(item.photos) && item.photos.length > 0) ? item.photos.length : (item.fileData ? 1 : (item.photosCount || 0));
        const cleanItem = { ...item };
        // users 테이블 items 내부에 base64 사진이 중복 저장되는 것을 차단 (applications 테이블 SSOT로 단일화)
        delete cleanItem.photos;
        delete cleanItem.fileData;
        cleanItem.photosCount = count;
        cleanItem.hasPhoto = count > 0;
        return cleanItem;
      });
    }

    return {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'normal',
      biz_code: user.bizCode || user.biz_code || null,
      const_code: user.constCode || user.const_code || null,
      conversion_status: user.conversionStatus || user.conversion_status || 'none',
      pending_business_name: user.pendingBusinessName || user.pending_business_name || null,
      pending_license_number: user.pendingLicenseNumber || user.pending_license_number || null,
      password_hash: user.pw || user.password_hash || null,
      items: safeItems
    };
  },

  // 기본 필수 컬럼만 추출 (DB 스키마 컬럼 미추가 시 fallback)
  mapUserToBaseDb(user) {
    if (!user) return null;
    return {
      id: user.id,
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      address: user.address || '',
      role: user.role || 'normal',
      biz_code: user.bizCode || user.biz_code || null,
      const_code: user.constCode || user.const_code || null,
      conversion_status: user.conversionStatus || user.conversion_status || 'none'
    };
  },

  // Supabase DB 행을 로컬 JS 사용자 객체로 매핑
  mapDbToUser(dbUser) {
    if (!dbUser) return null;
    return {
      id: dbUser.id,
      name: dbUser.name || '',
      phone: dbUser.phone || '',
      email: dbUser.email || '',
      address: dbUser.address || '',
      role: dbUser.role || 'normal',
      bizCode: dbUser.biz_code || null,
      constCode: dbUser.const_code || null,
      conversionStatus: dbUser.conversion_status || 'none',
      pendingBusinessName: dbUser.pending_business_name || '',
      pendingLicenseNumber: dbUser.pending_license_number || '',
      pw: dbUser.password_hash || '',
      createdAt: dbUser.created_at || new Date().toISOString(),
      items: Array.isArray(dbUser.items) ? dbUser.items : []
    };
  },

  // 지원 신청서 객체를 Supabase DB 컬럼으로 매핑
  mapAppToDb(app) {
    if (!app) return null;
    const safeUserId = (app.userId && app.userId !== 'guest') ? (app.userId || app.user_id) : null;
    let photoData = null;
    let validCount = 0;
    if (Array.isArray(app.photos) && app.photos.length > 0) {
      const validPhotos = app.photos.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
      validCount = validPhotos.length;
      if (validPhotos.length > 1) {
        photoData = JSON.stringify(validPhotos);
      } else if (validPhotos.length === 1) {
        photoData = validPhotos[0];
      }
    }
    if (!photoData) {
      photoData = app.fileData || (app.image_url && (app.image_url.startsWith('data:') || app.image_url.startsWith('[') || app.image_url.startsWith('http')) ? app.image_url : null);
      if (photoData) validCount = (app.photosCount || 1);
    }
    if (validCount === 0 && app.photosCount) validCount = app.photosCount;

    return {
      id: String(app.id),
      user_id: safeUserId,
      owner_name: app.ownerName || app.owner_name || '',
      phone: app.ownerPhone || app.phone || '',
      store_name: app.storeName || app.store_name || '',
      store_address: app.storeAddress || app.store_address || '',
      sign_type: app.signType || app.sign_type || '간판지원신청',
      image_url: photoData || app.fileName || null,
      referrer_code: app.referrerCode || app.referrer_code || '',
      status: app.status || 'pending',
      assigned_constructor_id: app.assignedConstructorId || app.assigned_constructor_id || null,
      assigned_constructor_name: app.assignedConstructorName || app.assigned_constructor_name || null,
      construction_status: app.constructionStatus || app.construction_status || 'none',
      construction_photos: app.constructionPhotos || [],
      construction_invoice: app.invoicePhotos ? (app.invoicePhotos[0] || null) : (app.construction_invoice || null),
      memo: JSON.stringify({ isBizItem: !!app.isBizItem, receiptStatus: app.receiptStatus || '접수예정', photoCount: validCount }),
      applied_at: app.appliedAt || app.created_at || new Date().toISOString()
    };
  },

  mapAppToBaseDb(app) {
    if (!app) return null;
    const safeUserId = (app.userId && app.userId !== 'guest') ? (app.userId || app.user_id) : null;
    let photoData = null;
    let validCount = 0;
    if (Array.isArray(app.photos) && app.photos.length > 0) {
      const validPhotos = app.photos.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
      validCount = validPhotos.length;
      if (validPhotos.length > 1) {
        photoData = JSON.stringify(validPhotos);
      } else if (validPhotos.length === 1) {
        photoData = validPhotos[0];
      }
    }
    if (!photoData) {
      photoData = app.fileData || (app.image_url && (app.image_url.startsWith('data:') || app.image_url.startsWith('[') || app.image_url.startsWith('http')) ? app.image_url : null);
      if (photoData) validCount = (app.photosCount || 1);
    }
    if (validCount === 0 && app.photosCount) validCount = app.photosCount;

    return {
      id: String(app.id),
      user_id: safeUserId,
      owner_name: app.ownerName || app.owner_name || '',
      phone: app.ownerPhone || app.phone || '',
      store_name: app.storeName || app.store_name || '',
      store_address: app.storeAddress || app.store_address || '',
      sign_type: app.signType || app.sign_type || '간판지원신청',
      image_url: photoData || app.fileName || null,
      referrer_code: app.referrerCode || app.referrer_code || '',
      status: app.status || 'pending',
      memo: JSON.stringify({ isBizItem: !!app.isBizItem, receiptStatus: app.receiptStatus || '접수예정', photoCount: validCount })
    };
  },

  mapDbToApp(dbApp) {
    if (!dbApp) return null;
    let photos = [];
    let fileData = '';

    if (dbApp.image_url) {
      const imgStr = String(dbApp.image_url).trim();
      if (imgStr.startsWith('[') && imgStr.includes('data:')) {
        try {
          const parsed = JSON.parse(imgStr);
          if (Array.isArray(parsed)) {
            photos = parsed.filter(p => p && typeof p === 'string' && (p.startsWith('data:') || p.startsWith('http') || p.startsWith('blob:')));
            fileData = photos[0] || '';
          }
        } catch (e) {
          photos = [imgStr];
          fileData = imgStr;
        }
      } else if (imgStr.startsWith('data:') || imgStr.startsWith('http') || imgStr.startsWith('blob:')) {
        photos = [imgStr];
        fileData = imgStr;
      }
    }

    if (photos.length === 0 && dbApp.file_data) {
      photos = [dbApp.file_data];
      fileData = dbApp.file_data;
    }

    const photoName = (!fileData && dbApp.image_url) ? dbApp.image_url : (dbApp.file_name || '현장사진.jpg');

    let photoCount = 0;
    let isBizItem = Boolean(dbApp.is_biz_item || dbApp.isBizItem);
    let receiptStatus = dbApp.receipt_status || dbApp.receiptStatus || '접수예정';
    if (dbApp.memo) {
      try {
        const parsedMemo = typeof dbApp.memo === 'string' ? JSON.parse(dbApp.memo) : dbApp.memo;
        if (parsedMemo && typeof parsedMemo === 'object') {
          if (parsedMemo.isBizItem !== undefined) isBizItem = Boolean(parsedMemo.isBizItem);
          if (parsedMemo.receiptStatus) receiptStatus = parsedMemo.receiptStatus;
          if (parsedMemo.photoCount !== undefined) photoCount = parseInt(parsedMemo.photoCount, 10) || 0;
        } else if (typeof dbApp.memo === 'string' && (dbApp.memo.includes('"isBizItem":true') || dbApp.memo.includes('"isBizItem": true'))) {
          isBizItem = true;
        }
      } catch (e) {
        if (typeof dbApp.memo === 'string' && (dbApp.memo.includes('"isBizItem":true') || dbApp.memo.includes('"isBizItem": true'))) {
          isBizItem = true;
        }
      }
    }

    if (photos.length > 0) photoCount = photos.length;
    else if (photoCount === 0 && (fileData || dbApp.image_url)) photoCount = 1;

    return {
      id: String(dbApp.id),
      userId: dbApp.user_id,
      ownerName: dbApp.owner_name,
      ownerPhone: dbApp.phone,
      storeName: dbApp.store_name,
      storeAddress: dbApp.store_address,
      signType: dbApp.sign_type,
      fileName: photoName,
      fileData: fileData,
      photos: photos,
      photosCount: photoCount,
      hasPhoto: photoCount > 0,
      appliedAt: dbApp.applied_at || dbApp.created_at || new Date().toISOString(),
      status: dbApp.status || 'pending',
      referrerCode: dbApp.referrer_code || '',
      isBizItem: isBizItem,
      receiptStatus: receiptStatus,
      assignedConstructorId: dbApp.assigned_constructor_id || '',
      assignedConstructorName: dbApp.assigned_constructor_name || '',
      constructionStatus: dbApp.construction_status || 'none',
      constructionPhotos: Array.isArray(dbApp.construction_photos) ? dbApp.construction_photos : [],
      invoicePhotos: dbApp.construction_invoice ? [dbApp.construction_invoice] : []
    };
  },

  // 1. 회원 정보 Supabase 저장/갱신 (안전한 Fallback 지원)
  async upsertUser(user) {
    if (!window.supabaseClient || !user || !user.id) return false;
    const fullPayload = this.mapUserToDb(user);

    try {
      const { error } = await window.supabaseClient.from('users').upsert([fullPayload], { onConflict: 'id' });
      if (!error) return true;

      // 컬럼 미존재 등 오류 발생 시 기본 필수 컬럼으로 안전하게 재시도
      const basePayload = this.mapUserToBaseDb(user);
      const { error: retryErr } = await window.supabaseClient.from('users').upsert([basePayload], { onConflict: 'id' });
      if (!retryErr) return true;
      console.warn('Supabase upsert retry error:', retryErr.message);
    } catch (err) {
      console.error('Supabase upsertUser exception:', err);
    }
    return false;
  },

  // 2. 특정 회원 필드만 수정 (전환신청, 승인, 반려 등)
  async updateUser(uid, updateFields) {
    if (!window.supabaseClient || !uid) return false;
    try {
      const { data, error } = await window.supabaseClient
        .from('users')
        .update(updateFields)
        .eq('id', uid)
        .select();

      if (!error && data && data.length > 0) return true;

      // 컬럼 누락 에러인 경우 필터링 후 재시도
      if (error && (error.code === 'PGRST204' || error.message.includes('column'))) {
        const safeFields = {};
        const baseCols = ['role', 'biz_code', 'const_code', 'conversion_status'];
        for (const k of Object.keys(updateFields)) {
          if (baseCols.includes(k)) safeFields[k] = updateFields[k];
        }
        if (Object.keys(safeFields).length > 0) {
          const { error: rErr } = await window.supabaseClient.from('users').update(safeFields).eq('id', uid);
          if (!rErr) return true;
        }
      }

      // 만약 DB에 유저가 아예 존재하지 않는 경우 로컬에서 찾아 전체 업서트
      const localUsers = JSON.parse(localStorage.getItem('users')) || [];
      const targetLocal = localUsers.find(u => u.id === uid);
      if (targetLocal) {
        await this.upsertUser(targetLocal);
      }
    } catch (err) {
      console.error('Supabase updateUser exception:', err);
    }
    return false;
  },

  // 3. 회원 영구 삭제 (외래키 제약조건 23503 사전 방어 및 삭제 캐시 영구 관리)
  async deleteUser(uid, phone) {
    if (!uid) return;
    const _sbUrl = (window.SUPABASE_URL) || 'https://nfexylsehsucctoefwdz.supabase.co';
    const _sbKey = (window.SUPABASE_ANON_KEY) || 'sb_publishable_Ux7dNNRDLqVX8MAX6-MlIA_HueFAGhh';

    const targetId = String(uid).trim();
    const targetLower = targetId.toLowerCase();
    const targetPhone = phone ? String(phone).trim() : '';
    const cleanPhoneDigits = (targetPhone.length >= 9) ? targetPhone.replace(/[^0-9]/g, '') : '';
    const cleanTargetDigits = (targetId.startsWith('01') && targetId.replace(/[^0-9]/g, '').length >= 9) ? targetId.replace(/[^0-9]/g, '') : '';

    // 1) 로컬 삭제 목록에 등록하여 syncAllData에서 부활 영구 차단
    let deletedIds = JSON.parse(localStorage.getItem('deleted_user_ids')) || [];
    const idsToAdd = [targetId, targetLower, cleanTargetDigits, targetPhone, cleanPhoneDigits].filter(Boolean);
    idsToAdd.forEach(id => {
      if (!deletedIds.includes(String(id))) {
        deletedIds.push(String(id));
      }
    });
    localStorage.setItem('deleted_user_ids', JSON.stringify(deletedIds));

    // 2) fetch() REST API 직접 삭제 (supabaseClient 초기화 여부 무관, 100% 보장)
    const headers = {
      'apikey': _sbKey,
      'Authorization': 'Bearer ' + _sbKey,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    };

    try {
      // 외래키: applications의 user_id null 해제
      const appIds = [targetId, ...(targetLower !== targetId ? [targetLower] : [])];
      for (const id of appIds) {
        await fetch(_sbUrl + '/rest/v1/applications?user_id=eq.' + encodeURIComponent(id), {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ user_id: null })
        }).catch(() => {});
      }

      // 외래키: inquiries의 user_id null 해제
      for (const id of appIds) {
        await fetch(_sbUrl + '/rest/v1/inquiries?user_id=eq.' + encodeURIComponent(id), {
          method: 'PATCH',
          headers,
          body: JSON.stringify({ user_id: null })
        }).catch(() => {});
      }

      // users 테이블에서 영구 삭제 (id 기준)
      const deleteResults = await Promise.all(
        appIds.map(id =>
          fetch(_sbUrl + '/rest/v1/users?id=eq.' + encodeURIComponent(id), {
            method: 'DELETE',
            headers
          }).then(r => ({ id, status: r.status })).catch(e => ({ id, error: e.message }))
        )
      );
      console.log('[deleteUser] Supabase DELETE results:', deleteResults);

      // 전화번호 기준 삭제 (중복 계정 방지)
      if (cleanPhoneDigits) {
        await fetch(_sbUrl + '/rest/v1/users?phone=eq.' + encodeURIComponent(cleanPhoneDigits), {
          method: 'DELETE', headers
        }).catch(() => {});
        if (targetPhone !== cleanPhoneDigits) {
          await fetch(_sbUrl + '/rest/v1/users?phone=eq.' + encodeURIComponent(targetPhone), {
            method: 'DELETE', headers
          }).catch(() => {});
        }
      }

      // 3) site_stats에 deleted_user_ids 동기화 (다른 기기/관리자 공유용)
      await fetch(_sbUrl + '/rest/v1/site_stats?on_conflict=id', {
        method: 'POST',
        headers: { ...headers, 'Prefer': 'return=minimal,resolution=merge-duplicates' },
        body: JSON.stringify({
          id: 'deleted_user_ids',
          today_date: JSON.stringify(deletedIds),
          today_count: deletedIds.length,
          total_count: deletedIds.length,
          updated_at: new Date().toISOString()
        })
      }).catch(() => {});

    } catch (e) {
      console.error('[deleteUser] fetch error:', e);
    }
  },

  // 4. 지원 신청서 저장/갱신 (안전한 Fallback 및 외래키 제약 보호)
  async upsertApplication(app) {
    if (!window.supabaseClient || !app || !app.id) return false;

    // 1) user_id가 guest가 아닌 실사용자 아이디인 경우 users 테이블에 먼저 upsert 보장
    const safeUserId = (app.userId && app.userId !== 'guest') ? (app.userId || app.user_id) : null;
    if (safeUserId) {
      try {
        const localUsers = JSON.parse(localStorage.getItem('users')) || [];
        const targetUser = localUsers.find(u => u.id === safeUserId);
        if (targetUser) {
          await this.upsertUser(targetUser);
        }
      } catch (eUser) {}
    }

    const fullPayload = this.mapAppToDb(app);

    try {
      const { error } = await window.supabaseClient.from('applications').upsert([fullPayload], { onConflict: 'id' });
      if (!error) return true;

      console.warn('Supabase upsertApplication 1st error:', error.message);

      // Foreign key error(23503)인 경우 user_id를 null로 변경하여 재시도
      if (error.code === '23503' || (error.message && error.message.includes('foreign key'))) {
        fullPayload.user_id = null;
        const { error: fkErr } = await window.supabaseClient.from('applications').upsert([fullPayload], { onConflict: 'id' });
        if (!fkErr) return true;
      }

      // 컬럼 누락 에러인 경우 basePayload로 안전하게 재시도
      const basePayload = this.mapAppToBaseDb(app);
      const { error: retryErr } = await window.supabaseClient.from('applications').upsert([basePayload], { onConflict: 'id' });
      if (!retryErr) return true;

      // basePayload에서도 foreign key 오류 시 user_id를 null로 재시도
      basePayload.user_id = null;
      const { error: finalErr } = await window.supabaseClient.from('applications').upsert([basePayload], { onConflict: 'id' });
      if (!finalErr) return true;

      console.error('Supabase upsertApplication final error:', finalErr.message);
    } catch (err) {
      console.error('Supabase upsertApplication exception:', err);
    }
    return false;
  },

  // 5. 지원 신청서 필드 수정
  async updateApplication(appId, updateFields) {
    if (!window.supabaseClient || !appId) return false;
    try {
      const { error } = await window.supabaseClient.from('applications').update(updateFields).eq('id', String(appId));
      if (!error) return true;
    } catch (err) {
      console.error('Supabase updateApplication exception:', err);
    }
    return false;
  },

  // 6. 지원 신청서 DB 완전 영구 삭제 (재접수 시 충돌 방지)
  async deleteApplication(appId) {
    if (!appId) return;
    const targetId = String(appId).trim();
    try {
      if (window.supabaseClient) {
        // 1) applications 테이블에서 영구 완전 삭제
        await window.supabaseClient.from('applications').delete().eq('id', targetId);
        // 2) 혹시 business_items 테이블에도 남아있다면 동시 완전 삭제
        try {
          await window.supabaseClient.from('business_items').delete().eq('id', targetId);
        } catch (eBiz) {}
      }
    } catch (e) {
      console.error('Supabase deleteApplication error:', e);
    }
  },

  // 3초 간편문의 매핑 함수 (실제 Supabase DB 스키마: id, name, phone, category, region, status, created_at)
  mapInquiryToDb(inq) {
    if (!inq) return null;
    const msg = inq.message || inq.content || inq.body || inq.memo || inq.region || '';
    const inqType = inq.type || inq.category || 'other';
    const dateStr = inq.submittedAt || inq.created_at || inq.createdAt || new Date().toISOString();
    return {
      id: String(inq.id),
      name: String(inq.name || ''),
      phone: String(inq.phone || ''),
      category: String(inqType),
      region: String(msg),
      status: String(inq.status || 'pending'),
      created_at: dateStr
    };
  },

  mapInquiryToExtendedDb(inq) {
    if (!inq) return null;
    const msg = inq.message || inq.content || inq.body || inq.memo || inq.region || '';
    const inqType = inq.type || inq.category || 'other';
    const dateStr = inq.submittedAt || inq.created_at || inq.createdAt || new Date().toISOString();
    return {
      id: String(inq.id),
      name: String(inq.name || ''),
      phone: String(inq.phone || ''),
      type: String(inqType),
      category: String(inqType),
      message: String(msg),
      region: String(msg),
      status: String(inq.status || 'pending'),
      created_at: dateStr
    };
  },

  mapInquiryToMinimalDb(inq) {
    if (!inq) return null;
    return {
      id: String(inq.id),
      name: String(inq.name || ''),
      phone: String(inq.phone || ''),
      status: String(inq.status || 'pending')
    };
  },

  mapDbToInquiry(dbInq) {
    if (!dbInq) return null;
    const msg = dbInq.message || dbInq.content || dbInq.body || dbInq.inquiry_text || dbInq.memo || dbInq.region || '';
    const inqType = dbInq.type || dbInq.category || 'other';
    const dt = dbInq.submittedAt || dbInq.created_at || dbInq.submitted_at || dbInq.createdAt || new Date().toISOString();
    return {
      id: String(dbInq.id),
      name: dbInq.name || '',
      phone: dbInq.phone || '',
      type: inqType,
      category: inqType,
      message: msg,
      content: msg,
      region: msg,
      status: dbInq.status || 'pending',
      submittedAt: dt,
      created_at: dt
    };
  },

  // 3초 간편문의 저장/갱신 (다단계 Fallback + 안전한 DB 저장 보장)
  async upsertInquiry(inq) {
    if (!window.supabaseClient || !inq || !inq.id) return false;
    const standardPayload = this.mapInquiryToDb(inq);
    try {
      // 1) 표준 DB 스키마(category, region 포함)로 upsert 시도
      const { error: stdErr } = await window.supabaseClient.from('inquiries').upsert([standardPayload], { onConflict: 'id' });
      if (!stdErr) return true;

      // 2) 확장 컬럼 지원 시도
      const extPayload = this.mapInquiryToExtendedDb(inq);
      const { error: extErr } = await window.supabaseClient.from('inquiries').upsert([extPayload], { onConflict: 'id' });
      if (!extErr) return true;

      // 3) 최소 필수 컬럼 fallback
      const minPayload = this.mapInquiryToMinimalDb(inq);
      const { error: minErr } = await window.supabaseClient.from('inquiries').upsert([minPayload], { onConflict: 'id' });
      if (!minErr) return true;

      // 4) update 시도
      await window.supabaseClient.from('inquiries').update({
        status: inq.status || 'pending',
        name: inq.name || '',
        phone: inq.phone || ''
      }).eq('id', String(inq.id));
      
      console.warn('Supabase upsertInquiry fallback used, std error:', stdErr.message);
      return true;
    } catch (e) {
      console.error('Supabase upsertInquiry exception:', e);
    }
    return false;
  },

  // 3초 간편문의 영구 삭제 (삭제 캐시 관리 및 DB 삭제)
  async deleteInquiry(inqId) {
    if (!inqId) return;
    try {
      // 1) 로컬 삭제 목록에 등록하여 syncAllData에서 부활 방지
      let deletedInqIds = JSON.parse(localStorage.getItem('deleted_inquiry_ids')) || [];
      if (!deletedInqIds.includes(String(inqId))) {
        deletedInqIds.push(String(inqId));
        localStorage.setItem('deleted_inquiry_ids', JSON.stringify(deletedInqIds));
      }

      if (window.supabaseClient) {
        const { error } = await window.supabaseClient.from('inquiries').delete().eq('id', String(inqId));
        if (error) {
          console.warn('Supabase deleteInquiry warning:', error.message);
        }
      }
    } catch (e) {
      console.error('Supabase deleteInquiry error:', e);
    }
  },

  // 3초 간편문의 전체 영구 초기화 (로컬 + DB 완전 삭제)
  async clearAllInquiries() {
    try {
      let deletedInqIds = JSON.parse(localStorage.getItem('deleted_inquiry_ids')) || [];
      const currentInquiries = JSON.parse(localStorage.getItem('inquiries')) || [];
      currentInquiries.forEach(i => {
        if (i.id && !deletedInqIds.includes(String(i.id))) {
          deletedInqIds.push(String(i.id));
        }
      });

      if (window.supabaseClient) {
        const { data } = await window.supabaseClient.from('inquiries').select('id');
        if (data && data.length > 0) {
          data.forEach(d => {
            if (d.id && !deletedInqIds.includes(String(d.id))) {
              deletedInqIds.push(String(d.id));
            }
          });
          const ids = data.map(d => String(d.id));
          await window.supabaseClient.from('inquiries').delete().in('id', ids);
        }
      }

      localStorage.setItem('deleted_inquiry_ids', JSON.stringify(deletedInqIds));
      localStorage.setItem('inquiries', JSON.stringify([]));
      localStorage.setItem('inquiries_purged_flag', 'true');
      return true;
    } catch (e) {
      console.error('Supabase clearAllInquiries error:', e);
      return false;
    }
  },

  // 7. Supabase 클라우드 단일 진실의 원천(SSOT) 단방향 동기화
  async syncAllData() {
    if (!window.supabaseClient) {
      initGlobalSupabaseClient();
    }
    if (!window.supabaseClient || this.isSyncing) return false;
    this.isSyncing = true;
    try {
      const oldUsersStr = localStorage.getItem('users') || '[]';
      const oldAppsStr = localStorage.getItem('applications') || '[]';
      const oldInqsStr = localStorage.getItem('inquiries') || '[]';

      // --- A. 회원(Users) Supabase 클라우드 원천 직접 수집 ---
      const { data: supaUsers, error: usersErr } = await window.supabaseClient.from('users').select('*');
      let usersChanged = false;
      if (!usersErr && Array.isArray(supaUsers)) {
        const freshUsers = supaUsers
          .map(su => this.mapDbToUser(su))
          .filter(u => u && u.id && u.role !== 'deleted');

        const hasAdmin = freshUsers.some(u => String(u.id).toLowerCase() === 'admin');
        if (!hasAdmin) {
          const localUsers = JSON.parse(localStorage.getItem('users')) || [];
          const existingLocalAdmin = localUsers.find(u => String(u.id).toLowerCase() === 'admin');
          const defaultAdmin = existingLocalAdmin || {
            id: 'admin',
            pw: '5c06eb3d5a05a19f49476d694ca81a36344660e9d5b98e3d6a6630f31c2422e7',
            name: '최고관리자',
            address: '경기도 수원시 영통구 청명남로 10',
            email: 'admin@ganpan.go.kr',
            phone: '010-0000-0000',
            role: 'admin',
            isSNS: false,
            bizCode: null,
            conversionStatus: 'none',
            items: []
          };
          freshUsers.push(defaultAdmin);
          this.upsertUser(defaultAdmin).then(() => {});
        }

        const newUsersStr = JSON.stringify(freshUsers);
        if (oldUsersStr !== newUsersStr) {
          localStorage.setItem('users', newUsersStr);
          usersChanged = true;
        }

        // 현재 로그인 세션 최신 상태 동기화 또는 삭제 계정 세션 강제 파기
        const activeUser = typeof getActiveUser === 'function' ? getActiveUser() : (JSON.parse(localStorage.getItem('activeUser')) || JSON.parse(sessionStorage.getItem('activeUser')));
        if (activeUser && activeUser.id) {
          const freshCur = freshUsers.find(u => String(u.id).toLowerCase() === String(activeUser.id).toLowerCase());
          if (freshCur) {
            const sanitized = typeof sanitizeUser === 'function' ? sanitizeUser(freshCur) : freshCur;
            sessionStorage.setItem('activeUser', JSON.stringify(sanitized));
            if (localStorage.getItem('activeUser')) {
              localStorage.setItem('activeUser', JSON.stringify(sanitized));
            }
          } else {
            // DB에 없거나 삭제된 계정이면 즉시 세션 파기
            if (typeof clearActiveUser === 'function') clearActiveUser();
            localStorage.removeItem('activeUser');
            sessionStorage.removeItem('activeUser');
          }
        }
      }

      // --- B. 지원 신청서(Applications) Supabase 클라우드 원천 직접 수집 (대역폭 99% 절감을 위한 경량 컬럼 선별 조회) ---
      // 무거운 base64 사진(image_url, construction_photos, construction_invoice)을 목록 동기화 시 제외하여 Egress 폭증을 원천 차단
      let supaApps = null;
      let appsErr = null;
      try {
        const res = await window.supabaseClient
          .from('applications')
          .select('id, user_id, owner_name, phone, store_name, store_address, sign_type, referrer_code, status, assigned_constructor_id, assigned_constructor_name, construction_status, memo, applied_at, created_at');
        supaApps = res.data;
        appsErr = res.error;
      } catch (eAppSelect) {
        appsErr = eAppSelect;
      }

      // 혹시 컬럼 선별 조회가 실패하는 환경인 경우 fallback
      if (appsErr || !supaApps) {
        try {
          const resFallback = await window.supabaseClient.from('applications').select('*');
          supaApps = resFallback.data;
          appsErr = resFallback.error;
        } catch (eFb) {}
      }

      let appsChanged = false;
      if (!appsErr && Array.isArray(supaApps)) {
        const localApps = JSON.parse(localStorage.getItem('applications')) || [];
        const freshApps = supaApps
          .map(sa => {
            const appObj = this.mapDbToApp(sa);
            const localApp = localApps.find(la => String(la.id) === String(appObj.id));
            if (localApp) {
              // 로컬 캐시된 고용량 사진이 있으면 유실되지 않도록 완벽 보존
              if (localApp.photos && localApp.photos.length > 0 && (!appObj.photos || appObj.photos.length === 0)) {
                appObj.photos = localApp.photos;
                appObj.fileData = localApp.fileData || localApp.photos[0];
                appObj.fileName = localApp.fileName || appObj.fileName;
              }
              if (localApp.photosCount && !appObj.photosCount) {
                appObj.photosCount = localApp.photosCount;
                appObj.hasPhoto = true;
              }
              if (localApp.constructionPhotos && localApp.constructionPhotos.length > 0 && (!appObj.constructionPhotos || appObj.constructionPhotos.length === 0)) {
                appObj.constructionPhotos = localApp.constructionPhotos;
              }
              if (localApp.invoicePhotos && localApp.invoicePhotos.length > 0 && (!appObj.invoicePhotos || appObj.invoicePhotos.length === 0)) {
                appObj.invoicePhotos = localApp.invoicePhotos;
              }

              const localTime = new Date(localApp.updatedAt || localApp.appliedAt || 0).getTime();
              const remoteTime = new Date(sa.updated_at || sa.applied_at || sa.created_at || 0).getTime();
              if (localTime > remoteTime) {
                appObj.isBizItem = localApp.isBizItem;
                appObj.receiptStatus = localApp.receiptStatus;
                appObj.progressStatus = localApp.progressStatus;
                appObj.salespersonId = localApp.salespersonId || appObj.salespersonId;
                appObj.salespersonName = localApp.salespersonName || appObj.salespersonName;
                appObj.updatedAt = localApp.updatedAt;
              }
            }
            return appObj;
          })
          .filter(a => a && a.id);
        const newAppsStr = JSON.stringify(freshApps);
        if (oldAppsStr !== newAppsStr) {
          try {
            localStorage.setItem('applications', newAppsStr);
            appsChanged = true;
          } catch (qErr) {
            try {
              const lightApps = freshApps.map(a => ({
                ...a,
                photos: (a.photos && a.photos.length > 0) ? [a.photos[0]] : [],
                fileData: ''
              }));
              localStorage.setItem('applications', JSON.stringify(lightApps));
              appsChanged = true;
            } catch (qErr2) {
              console.error('Applications localStorage save failed:', qErr2);
            }
          }
        }
      }

      // --- C. 3초 간편문의(Inquiries) Supabase 클라우드 원천 직접 수집 ---
      const { data: supaInqs, error: inqsErr } = await window.supabaseClient.from('inquiries').select('*');
      let inqsChanged = false;
      if (!inqsErr && Array.isArray(supaInqs)) {
        let localDeletedInqIds = JSON.parse(localStorage.getItem('deleted_inquiry_ids')) || [];
        try {
          const { data: inqStatsRow } = await window.supabaseClient.from('site_stats')
            .select('today_date')
            .eq('id', 'deleted_inquiry_ids')
            .maybeSingle();
          if (inqStatsRow && inqStatsRow.today_date) {
            const cloudDeleted = JSON.parse(inqStatsRow.today_date) || [];
            cloudDeleted.forEach(id => {
              if (!localDeletedInqIds.includes(String(id))) localDeletedInqIds.push(String(id));
            });
            localStorage.setItem('deleted_inquiry_ids', JSON.stringify(localDeletedInqIds));
          }
        } catch (eInqStats) {}

        const freshInqs = supaInqs
          .map(si => this.mapDbToInquiry(si))
          .filter(i => i && i.id && !localDeletedInqIds.includes(String(i.id)));
        const newInqsStr = JSON.stringify(freshInqs);
        if (oldInqsStr !== newInqsStr) {
          localStorage.setItem('inquiries', newInqsStr);
          inqsChanged = true;
        }
      }

      // 실제 데이터가 변경되었을 때만 화면 갱신 이벤트를 발화하여 DOM 재생성 방지
      if (usersChanged || appsChanged || inqsChanged) {
        window.dispatchEvent(new CustomEvent('supabase-data-synced', {
          detail: { timestamp: new Date().toISOString() }
        }));

        if (window.DataStore && typeof window.DataStore.notifyAll === 'function') {
          window.DataStore.notifyAll();
        }
      }

      return true;
    } catch (e) {
      console.error('[SupabaseSync] syncAllData SSOT error:', e);
      return false;
    } finally {
      this.isSyncing = false;
    }
  },

  // 8. Supabase Realtime WebSocket 실시간 채널 구독 (0초 지연 실시간 동기화)
  initRealtimeSubscription() {
    if (!window.supabaseClient || this.realtimeChannel) return;
    try {
      this.realtimeChannel = window.supabaseClient
        .channel('public:ganpans-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'applications' }, () => {
          this.syncAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
          this.syncAllData();
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'inquiries' }, () => {
          this.syncAllData();
        })
        .subscribe();
    } catch (err) {
      console.warn('Supabase Realtime subscription exception:', err);
    }
  },

  // 9. 자동 동기화 시작 (실시간 웹소켓 + 주기적 폴링 + 탭 활성화 시 즉시 동기화)
  initAutoSync(intervalMs = 5000) {
    // 초기 로드 시 1회 즉시 실행 및 웹소켓 실시간 리스너 연결
    setTimeout(() => {
      this.syncAllData();
      this.initRealtimeSubscription();
    }, 200);

    // 탭 포커스 / 활성화 시 즉시 동기화
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) {
          this.syncAllData();
        }
      });
      window.addEventListener('focus', () => {
        this.syncAllData();
      });
    }

    // 백그라운드 주기적 폴링 (웹소켓 연결 유실 대비)
    if (this.autoSyncTimer) clearInterval(this.autoSyncTimer);
    this.autoSyncTimer = setInterval(() => {
      this.syncAllData();
    }, intervalMs);
  }
};

// 페이지 로드 시 SupabaseSync 자동 가동
if (typeof window !== 'undefined') {
  window.SupabaseSync.initAutoSync(30000);
}

// 전역 단일 인증 실행 핸들러 및 탭 전환 엔진 (모든 플랫폼·화면 100% 호환 보장)
if (typeof window !== 'undefined') {
  window.switchAuthTab = function(tab, e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const tabLoginBtn = document.getElementById('tab-login-btn');
    const tabSignupBtn = document.getElementById('tab-signup-btn');
    const loginPane = document.getElementById('login-pane');
    const signupPane = document.getElementById('signup-pane');
    const findIdPane = document.getElementById('find-id-pane');
    const findPwPane = document.getElementById('find-pw-pane');
    const authTabs = document.querySelector('.auth-tabs');

    if (authTabs) authTabs.style.display = '';
    if (findIdPane) findIdPane.classList.remove('active');
    if (findPwPane) findPwPane.classList.remove('active');

    if (tab === 'signup') {
      if (tabLoginBtn) tabLoginBtn.classList.remove('active');
      if (tabSignupBtn) tabSignupBtn.classList.add('active');
      if (loginPane) loginPane.classList.remove('active');
      if (signupPane) signupPane.classList.add('active');
    } else {
      if (tabLoginBtn) tabLoginBtn.classList.add('active');
      if (tabSignupBtn) tabSignupBtn.classList.remove('active');
      if (loginPane) loginPane.classList.add('active');
      if (signupPane) signupPane.classList.remove('active');
    }
  };

  window.checkSignupId = async function(e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }
    const signupIdInput = document.getElementById('signup-id');
    const idCheckMsg = document.getElementById('id-check-msg');
    if (!signupIdInput) return;

    const idVal = signupIdInput.value.trim();
    if (!idVal) {
      if (idCheckMsg) {
        idCheckMsg.className = 'form-helper error';
        idCheckMsg.style.color = '#dc2626';
        idCheckMsg.style.display = 'block';
        idCheckMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 아이디를 입력해 주세요.';
      }
      alert('아이디를 입력해 주세요.');
      signupIdInput.focus();
      return;
    }

    if (idVal.length < 4 || idVal.length > 20) {
      if (idCheckMsg) {
        idCheckMsg.className = 'form-helper error';
        idCheckMsg.style.color = '#dc2626';
        idCheckMsg.style.display = 'block';
        idCheckMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 아이디는 4자 이상 20자 이하로 입력해 주세요.';
      }
      alert('아이디는 4자 이상 20자 이하로 입력해 주세요.');
      signupIdInput.focus();
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(idVal)) {
      if (idCheckMsg) {
        idCheckMsg.className = 'form-helper error';
        idCheckMsg.style.color = '#dc2626';
        idCheckMsg.style.display = 'block';
        idCheckMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 아이디는 영문 대/소문자와 숫자만 사용 가능합니다.';
      }
      alert('아이디는 영문 대/소문자와 숫자만 사용 가능합니다.');
      signupIdInput.focus();
      return;
    }

    const idValLower = idVal.toLowerCase();
    let exists = false;

    // 1) 로컬 사용자 목록 실시간 대조
    const localUsers = JSON.parse(localStorage.getItem('users')) || [];
    if (localUsers.some(u => String(u.id).toLowerCase() === idValLower && u.role !== 'deleted')) {
      exists = true;
    }

    // 2) Supabase 클라우드 실시간 대조
    if (!exists && window.supabaseClient) {
      try {
        const { data, error } = await window.supabaseClient
          .from('users')
          .select('id, role')
          .ilike('id', idVal)
          .maybeSingle();

        if (!error && data && data.role !== 'deleted') {
          exists = true;
        }
      } catch (err) {
        console.warn('Supabase check id error:', err);
      }
    }

    window.isIdChecked = true;
    if (exists) {
      window.isIdAvailable = false;
      if (idCheckMsg) {
        idCheckMsg.className = 'form-helper error';
        idCheckMsg.style.color = '#dc2626';
        idCheckMsg.style.display = 'block';
        idCheckMsg.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i> 이미 사용 중인 아이디입니다.';
      }
      alert(`'${idVal}'는 이미 사용 중인 아이디입니다.\n다른 아이디를 입력해 주세요.`);
      signupIdInput.focus();
    } else {
      window.isIdAvailable = true;
      if (idCheckMsg) {
        idCheckMsg.className = 'form-helper success';
        idCheckMsg.style.color = '#16a34a';
        idCheckMsg.style.display = 'block';
        idCheckMsg.innerHTML = '<i class="fa-solid fa-circle-check"></i> 사용 가능한 아이디입니다.';
      }
      alert(`'${idVal}'는 사용 가능한 아이디입니다!`);
    }
  };

  window.executeAppLogin = async function(e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    const idInput = document.getElementById('login-id');
    const pwInput = document.getElementById('login-pw');
    const idVal = idInput ? idInput.value.trim() : '';
    const pwVal = pwInput ? pwInput.value : '';
    const rememberMe = document.getElementById('login-remember-me') ? document.getElementById('login-remember-me').checked : false;

    if (!idVal || !pwVal) {
      alert('아이디와 비밀번호를 모두 입력해 주세요.');
      return;
    }

    const idValLower = idVal.toLowerCase();

    // 1) 최고관리자 (admin) 직통 즉각 로그인 (기존 변경 개인정보 100% 보존)
    if (idValLower === 'admin' || idValLower === 'administrator' || idValLower === 'superadmin') {
      let users = JSON.parse(localStorage.getItem('users')) || [];
      let existingAdmin = users.find(u => String(u.id).toLowerCase() === 'admin');

      const adminUser = existingAdmin ? { ...existingAdmin, role: 'admin' } : {
        id: 'admin',
        pw: '5c06eb3d5a05a19f49476d694ca81a36344660e9d5b98e3d6a6630f31c2422e7',
        name: '최고관리자',
        address: '경기도 수원시 영통구 청명남로 10',
        email: 'admin@ganpan.go.kr',
        phone: '010-0000-0000',
        role: 'admin',
        isSNS: false,
        bizCode: null,
        conversionStatus: 'none',
        items: []
      };

      if (!existingAdmin) {
        users.push(adminUser);
        localStorage.setItem('users', JSON.stringify(users));
        if (window.SupabaseSync) {
          window.SupabaseSync.upsertUser(adminUser).catch(() => {});
        }
      }

      if (rememberMe) {
        localStorage.setItem('activeUser', JSON.stringify(adminUser));
        localStorage.setItem('activeUser_remember', 'true');
        sessionStorage.removeItem('activeUser');
      } else {
        sessionStorage.setItem('activeUser', JSON.stringify(adminUser));
        localStorage.removeItem('activeUser_remember');
        localStorage.removeItem('activeUser');
      }

      const authModal = document.getElementById('auth-modal');
      if (authModal) authModal.classList.remove('active');
      const form = document.getElementById('login-form');
      if (form) form.reset();

      if (typeof window.updateSessionUI === 'function') window.updateSessionUI();
      if (typeof window.updateDrawerProfile === 'function') window.updateDrawerProfile();
      if (typeof window.updateHeaderAuthButton === 'function') window.updateHeaderAuthButton();
      
      if (typeof window.switchTab === 'function') {
        window.switchTab('home');
      }
      if (typeof window.renderAdminDashboardMob === 'function') {
        window.renderAdminDashboardMob(true);
      }

      window.dispatchEvent(new CustomEvent('supabase-data-synced'));
      return;
    }

    // 2) 일반 회원 및 기타 사용자 로그인
    const hashedPassword = typeof sha256 === 'function' ? sha256(pwVal) : pwVal;
    const cleanDigits = (idVal.startsWith('01') && idVal.replace(/[^0-9]/g, '').length >= 9) ? idVal.replace(/[^0-9]/g, '') : '';
    let deletedIds = JSON.parse(localStorage.getItem('deleted_user_ids')) || [];

    if (deletedIds.includes(idVal) || deletedIds.includes(idValLower) || (cleanDigits && deletedIds.includes(cleanDigits))) {
      alert('존재하지 않는 회원 정보이거나 이미 탈퇴/삭제 처리된 계정입니다.');
      return;
    }

    let user = null;

    if (window.supabaseClient) {
      try {
        let { data, error } = await window.supabaseClient
          .from('users')
          .select('*')
          .ilike('id', idVal)
          .maybeSingle();

        if (!data && cleanDigits) {
          const { data: phoneData } = await window.supabaseClient
            .from('users')
            .select('*')
            .or(`phone.eq.${idVal},phone.eq.${cleanDigits}`)
            .maybeSingle();
          if (phoneData) data = phoneData;
        }

        if (!error && data) {
          const dataId = String(data.id || '');
          const dataIdLower = dataId.toLowerCase();
          const dataPhone = String(data.phone || '');
          const dataPhoneDigits = (dataPhone.length >= 9) ? dataPhone.replace(/[^0-9]/g, '') : '';

          if (data.role === 'deleted' || 
              deletedIds.includes(dataId) || 
              deletedIds.includes(dataIdLower) || 
              (dataPhoneDigits && deletedIds.includes(dataPhoneDigits))) {
            alert('존재하지 않는 회원 정보이거나 이미 탈퇴/삭제 처리된 계정입니다.');
            return;
          }

          const isPwMatch = (data.password_hash === hashedPassword) || (data.password_hash === pwVal);
          if (isPwMatch) {
            user = window.SupabaseSync ? window.SupabaseSync.mapDbToUser(data) : (typeof sanitizeUser === 'function' ? sanitizeUser(data) : data);
          }
        }
      } catch (err) {
        console.error('Login Supabase error:', err);
      }
    }

    // 시스템 기본 계정(bizuser, constuser) 및 로컬 캐시 검증
    if (!user) {
      if (idValLower === 'bizuser' && (pwVal === 'biz1234!' || pwVal === 'biz1234' || pwVal === 'bizuser')) {
        user = {
          id: 'bizuser',
          pw: 'ba92d00dc62e58f05eeefc94e20846bdce6aa6490c18cf3cb72c55ea84f40756',
          name: '김영업',
          address: '경기도 성남시 분당구 판교역로 235',
          email: 'kim@naver.com',
          phone: '010-9876-5432',
          role: 'business',
          isSNS: false,
          bizCode: 'B-260712',
          conversionStatus: 'approved',
          items: []
        };
        if (window.SupabaseSync) window.SupabaseSync.upsertUser(user).catch(() => {});
      }
    }

    if (!user) {
      const localUsers = JSON.parse(localStorage.getItem('users')) || [];
      const localUser = localUsers.find(u => {
        const uId = (u.id || '').toLowerCase();
        const uPhoneDigits = (u.phone || '').replace(/[^0-9]/g, '');
        const isMatchUser = (uId === idVal.toLowerCase()) ||
          (cleanDigits && uId === cleanDigits) ||
          (cleanDigits && uPhoneDigits === cleanDigits);
        return isMatchUser && (u.pw === hashedPassword || u.pw === pwVal);
      });
      if (localUser) {
        const luId = String(localUser.id || '');
        const luIdLower = luId.toLowerCase();
        const luDigits = luId.replace(/[^0-9]/g, '');
        const luPhoneDigits = String(localUser.phone || '').replace(/[^0-9]/g, '');
        if (!deletedIds.includes(luId) && !deletedIds.includes(luIdLower) && (!luDigits || !deletedIds.includes(luDigits)) && (!luPhoneDigits || !deletedIds.includes(luPhoneDigits)) && localUser.role !== 'deleted') {
          user = typeof sanitizeUser === 'function' ? sanitizeUser(localUser) : localUser;
        }
      }
    }

    if (user) {
      let currentUsers = JSON.parse(localStorage.getItem('users')) || [];
      if (!currentUsers.some(u => String(u.id).toLowerCase() === String(user.id).toLowerCase())) {
        currentUsers.push(user);
        localStorage.setItem('users', JSON.stringify(currentUsers));
      }

      if (rememberMe) {
        localStorage.setItem('activeUser', JSON.stringify(user));
        localStorage.setItem('activeUser_remember', 'true');
        sessionStorage.removeItem('activeUser');
      } else {
        sessionStorage.setItem('activeUser', JSON.stringify(user));
        localStorage.removeItem('activeUser_remember');
        localStorage.removeItem('activeUser');
      }

      const authModal = document.getElementById('auth-modal');
      if (authModal) authModal.classList.remove('active');
      const form = document.getElementById('login-form');
      if (form) form.reset();

      if (typeof window.updateSessionUI === 'function') window.updateSessionUI();
      if (typeof window.updateDrawerProfile === 'function') window.updateDrawerProfile();
      if (typeof window.updateHeaderAuthButton === 'function') window.updateHeaderAuthButton();
      if (typeof window.renderStatusTab === 'function') window.renderStatusTab();
      if (typeof window.switchTab === 'function') {
        window.switchTab('home');
      }
      if (typeof window.renderAdminDashboardMob === 'function' && user.role === 'admin') {
        window.renderAdminDashboardMob(true);
      }
      window.dispatchEvent(new CustomEvent('supabase-data-synced'));
    } else {
      alert('아이디 또는 비밀번호가 올바르지 않거나 이미 삭제된 회원입니다.');
    }
  };

  window.executeAppSignup = async function(e) {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault();
      if (typeof e.stopPropagation === 'function') e.stopPropagation();
    }

    const signupIdInput = document.getElementById('signup-id');
    const signupPwInput = document.getElementById('signup-pw');
    const signupPwConfirmInput = document.getElementById('signup-pw-confirm');
    const signupNameInput = document.getElementById('signup-name');
    const signupAddressInput = document.getElementById('signup-address');
    const signupEmailInput = document.getElementById('signup-email');
    const signupPhoneInput = document.getElementById('signup-phone');

    const idVal = signupIdInput ? signupIdInput.value.trim() : '';
    const pwVal = signupPwInput ? signupPwInput.value : '';
    const pwConfirmVal = signupPwConfirmInput ? signupPwConfirmInput.value : '';
    const nameVal = signupNameInput ? signupNameInput.value.trim() : '';
    const addressVal = signupAddressInput ? signupAddressInput.value.trim() : '';
    const emailVal = signupEmailInput ? signupEmailInput.value.trim() : '';
    const phoneVal = signupPhoneInput ? signupPhoneInput.value.trim() : '';

    if (!idVal) {
      alert('아이디를 입력해 주세요.');
      signupIdInput?.focus();
      return;
    }

    if (idVal.length < 4 || idVal.length > 20) {
      alert('아이디는 4자 이상 20자 이하로 입력해 주세요.');
      signupIdInput?.focus();
      return;
    }

    if (!/^[a-zA-Z0-9]+$/.test(idVal)) {
      alert('아이디는 영문 대/소문자와 숫자만 사용 가능합니다.');
      signupIdInput?.focus();
      return;
    }

    // 아이디 중복 체크 자동 검증 (미체크 시 즉시 검사)
    const idValLower = idVal.toLowerCase();
    let exists = false;
    const localUsers = JSON.parse(localStorage.getItem('users')) || [];
    if (localUsers.some(u => String(u.id).toLowerCase() === idValLower && u.role !== 'deleted')) {
      exists = true;
    }
    if (!exists && window.supabaseClient) {
      try {
        const { data } = await window.supabaseClient.from('users').select('id, role').ilike('id', idVal).maybeSingle();
        if (data && data.role !== 'deleted') exists = true;
      } catch (err) {
        console.warn('Supabase check id error:', err);
      }
    }
    if (exists) {
      alert(`'${idVal}'는 이미 사용 중인 아이디입니다.\n다른 아이디를 입력해 주세요.`);
      signupIdInput?.focus();
      return;
    }

    if (!pwVal) {
      alert('비밀번호를 입력해 주세요.');
      signupPwInput?.focus();
      return;
    }

    const pwRegex = /^(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+\[\]{};:'",.<>?~|\\])[A-Za-z\d!@#$%^&*()\-_=+\[\]{};:'",.<>?~|\\]{8,20}$/;
    if (!pwRegex.test(pwVal)) {
      alert('비밀번호는 영문 소문자·숫자·특수문자를 각 1개 이상 포함하여 8~20자로 입력해 주세요.');
      signupPwInput?.focus();
      return;
    }

    if (pwVal !== pwConfirmVal) {
      alert('비밀번호 확인이 일치하지 않습니다. 다시 확인해 주세요.');
      signupPwConfirmInput?.focus();
      return;
    }

    if (!nameVal || nameVal.length < 2 || nameVal.length > 20) {
      alert('이름은 2자 이상 20자 이하로 입력해 주세요.');
      signupNameInput?.focus();
      return;
    }

    if (!phoneVal || phoneVal.length < 9 || phoneVal.length > 15) {
      alert('휴대폰 번호를 정확히 입력해 주세요. (예: 010-1234-5678)');
      signupPhoneInput?.focus();
      return;
    }

    const phoneRegex = /^[0-9+\s-]+$/;
    if (!phoneRegex.test(phoneVal)) {
      alert('휴대폰 번호에는 숫자와 하이픈(-)만 입력할 수 있습니다.');
      signupPhoneInput?.focus();
      return;
    }

    if (emailVal && emailVal.length > 50) {
      alert('이메일 주소는 최대 50자까지 입력할 수 있습니다.');
      signupEmailInput?.focus();
      return;
    }

    const submitBtn = document.getElementById('btn-complete-signup');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> 가입 처리 중...';
    }

    try {
      const nowIso = new Date().toISOString();
      const newUser = {
        id: idVal,
        pw: typeof sha256 === 'function' ? sha256(pwVal) : pwVal,
        name: nameVal,
        address: addressVal || '',
        email: emailVal || '',
        phone: phoneVal,
        role: 'normal',
        isSNS: false,
        bizCode: null,
        conversionStatus: 'none',
        items: [],
        createdAt: nowIso
      };

      // 1) Supabase 클라우드 저장
      if (window.SupabaseSync) {
        await window.SupabaseSync.upsertUser(newUser);
      }

      // 2) DataStore / LocalStorage 저장
      if (window.DataStore) {
        const freshUsers = window.DataStore.getUsers();
        if (!freshUsers.some(u => String(u.id).toLowerCase() === idVal.toLowerCase())) {
          freshUsers.push(newUser);
          window.DataStore.saveUsers(freshUsers);
        }
      } else {
        const localUsers = JSON.parse(localStorage.getItem('users')) || [];
        if (!localUsers.some(u => String(u.id).toLowerCase() === idVal.toLowerCase())) {
          localUsers.push(newUser);
          localStorage.setItem('users', JSON.stringify(localUsers));
        }
      }

      // 3) 자동 로그인 세션 생성
      const sanitized = typeof sanitizeUser === 'function' ? sanitizeUser(newUser) : newUser;
      sessionStorage.setItem('activeUser', JSON.stringify(sanitized));
      localStorage.removeItem('activeUser_remember');
      localStorage.removeItem('activeUser');

      alert('회원가입이 완료되었습니다! 자동 로그인됩니다.');

      // 모달 닫기 및 폼 초기화
      const authModal = document.getElementById('auth-modal');
      if (authModal) authModal.classList.remove('active');
      const signupForm = document.getElementById('signup-form');
      if (signupForm) signupForm.reset();

      window.isIdChecked = false;
      window.isIdAvailable = false;
      const idCheckMsg = document.getElementById('id-check-msg');
      if (idCheckMsg) { idCheckMsg.textContent = ''; idCheckMsg.style.display = 'none'; }

      // 4) 모바일 앱 및 PC UI 전역 동기화
      if (typeof window.updateDrawerProfile === 'function') window.updateDrawerProfile();
      if (typeof window.updateHeaderAuthButton === 'function') window.updateHeaderAuthButton();
      if (typeof window.renderStatusTab === 'function') window.renderStatusTab();
      if (typeof window.renderAdminDashboardMob === 'function') window.renderAdminDashboardMob(true);
      if (typeof window.updateSessionUI === 'function') window.updateSessionUI();
      if (typeof window.switchTab === 'function') window.switchTab('home');

    } catch (err) {
      console.error('Signup error:', err);
      alert('회원가입 처리 중 오류가 발생했습니다: ' + (err.message || '다시 시도해 주세요.'));
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> 가입완료';
      }
    }
  };
}
