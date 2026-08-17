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

// 5. 로그인 상태 유지를 연동한 세션 조회 및 삭제 헬퍼 함수
function getActiveUser() {
  const localUser = localStorage.getItem('activeUser');
  if (localUser) {
    try { return JSON.parse(localUser); } catch(e) { return null; }
  }
  const sessionUser = sessionStorage.getItem('activeUser');
  if (sessionUser) {
    try { return JSON.parse(sessionUser); } catch(e) { return null; }
  }
  return null;
}

function clearActiveUser() {
  localStorage.removeItem('activeUser');
  sessionStorage.removeItem('activeUser');
}

// 6. Supabase 클라이언트 초기화 (전역 설정 파일 supabase-config.js 를 참조합니다)
const dbUrl = typeof window.SUPABASE_URL !== 'undefined' ? window.SUPABASE_URL : '';
const dbKey = typeof window.SUPABASE_ANON_KEY !== 'undefined' ? window.SUPABASE_ANON_KEY : '';
window.supabaseClient = null;

if (dbUrl && dbKey && typeof window !== 'undefined' && window.supabase) {
  window.supabaseClient = window.supabase.createClient(dbUrl, dbKey);
}

// 7. 실시간 사진 촬영본 및 이미지 파일 2MB 이하 강제 자동 축소/압축 유틸리티
function compressImageFile(file, maxSizeBytes = 2 * 1024 * 1024) {
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

        // 해상도 최적화 (긴 변 기준 최대 1600px)
        const max_size = 1600;
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

        let quality = 0.85;
        let dataUrl = canvas.toDataURL('image/jpeg', quality);
        let approximateSize = Math.round((dataUrl.length - 22) * 3 / 4);

        // 2MB 이하가 될 때까지 화질 품질(quality)을 단계적으로 축소
        while (approximateSize > maxSizeBytes && quality > 0.1) {
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

function compressImageToBase64(file, maxSizeBytes = 2 * 1024 * 1024) {
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

// 10. 영업자 간판접수신청 물건 고유번호 생성 헬퍼 (규칙: {bizCode}-0001 ~ 순차 증가)
function generateBizItemId(bizCode, userItems) {
  const code = (bizCode && typeof bizCode === 'string') ? bizCode : (typeof generateBizCode === 'function' ? generateBizCode() : 'B-260801');
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
      const seqStr = item.id.slice(prefix.length);
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(4, '0');
  return `${prefix}${nextSeq}`;
}

// 12. 시공업체 회원 코드 생성 헬퍼 (규칙: BPCYYMM01 ~ 순차 증가, 예: BPC260801, BPC260803)
function generateConstCode(usersList) {
  const now = new Date();
  const yy = String(now.getFullYear()).slice(-2);
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const prefix = `BPC${yy}${mm}`;

  const currentUsers = Array.isArray(usersList) ? usersList : (JSON.parse(localStorage.getItem('users')) || []);

  let maxSeq = 0;
  currentUsers.forEach(u => {
    if (u && u.constCode && typeof u.constCode === 'string' && u.constCode.startsWith(prefix)) {
      const seqStr = u.constCode.slice(prefix.length);
      const seqNum = parseInt(seqStr, 10);
      if (!isNaN(seqNum) && seqNum > maxSeq) {
        maxSeq = seqNum;
      }
    }
  });

  const nextSeq = String(maxSeq + 1).padStart(2, '0');
  return `${prefix}${nextSeq}`;
}

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

  // 사용자 객체를 Supabase DB 컬럼으로 매핑
  mapUserToDb(user) {
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
      conversion_status: user.conversionStatus || user.conversion_status || 'none',
      pending_business_name: user.pendingBusinessName || user.pending_business_name || null,
      pending_license_number: user.pendingLicenseNumber || user.pending_license_number || null,
      password_hash: user.pw || user.password_hash || null,
      items: user.items || []
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
      items: Array.isArray(dbUser.items) ? dbUser.items : []
    };
  },

  // 지원 신청서 객체를 Supabase DB 컬럼으로 매핑
  mapAppToDb(app) {
    if (!app) return null;
    return {
      id: String(app.id),
      user_id: app.userId || app.user_id || null,
      owner_name: app.ownerName || app.owner_name || '',
      phone: app.ownerPhone || app.phone || '',
      store_name: app.storeName || app.store_name || '',
      store_address: app.storeAddress || app.store_address || '',
      sign_type: app.signType || app.sign_type || '',
      image_url: app.fileName || app.image_url || null,
      referrer_code: app.referrerCode || app.referrer_code || '',
      status: app.status || 'pending',
      assigned_constructor_id: app.assignedConstructorId || app.assigned_constructor_id || null,
      assigned_constructor_name: app.assignedConstructorName || app.assigned_constructor_name || null,
      construction_status: app.constructionStatus || app.construction_status || 'none',
      construction_photos: app.constructionPhotos || [],
      construction_invoice: app.invoicePhotos ? (app.invoicePhotos[0] || null) : (app.construction_invoice || null),
      applied_at: app.appliedAt || app.created_at || new Date().toISOString()
    };
  },

  mapAppToBaseDb(app) {
    if (!app) return null;
    return {
      id: String(app.id),
      user_id: app.userId || app.user_id || null,
      owner_name: app.ownerName || app.owner_name || '',
      phone: app.ownerPhone || app.phone || '',
      store_name: app.storeName || app.store_name || '',
      store_address: app.storeAddress || app.store_address || '',
      sign_type: app.signType || app.sign_type || '',
      image_url: app.fileName || app.image_url || null,
      referrer_code: app.referrerCode || app.referrer_code || '',
      status: app.status || 'pending'
    };
  },

  mapDbToApp(dbApp) {
    if (!dbApp) return null;
    return {
      id: String(dbApp.id),
      userId: dbApp.user_id,
      ownerName: dbApp.owner_name,
      ownerPhone: dbApp.phone,
      storeName: dbApp.store_name,
      storeAddress: dbApp.store_address,
      signType: dbApp.sign_type,
      fileName: dbApp.image_url || '현장사진',
      appliedAt: dbApp.applied_at || dbApp.created_at || new Date().toISOString(),
      status: dbApp.status || 'pending',
      referrerCode: dbApp.referrer_code || '',
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

  // 3. 회원 삭제
  async deleteUser(uid) {
    if (!window.supabaseClient || !uid) return;
    try {
      await window.supabaseClient.from('users').delete().eq('id', uid);
    } catch (e) {
      console.error('Supabase deleteUser error:', e);
    }
  },

  // 4. 지원 신청서 저장/갱신
  async upsertApplication(app) {
    if (!window.supabaseClient || !app || !app.id) return false;
    const fullPayload = this.mapAppToDb(app);

    try {
      const { error } = await window.supabaseClient.from('applications').upsert([fullPayload], { onConflict: 'id' });
      if (!error) return true;

      if (error.code === 'PGRST204' || (error.message && error.message.includes('column'))) {
        const basePayload = this.mapAppToBaseDb(app);
        const { error: retryErr } = await window.supabaseClient.from('applications').upsert([basePayload], { onConflict: 'id' });
        if (!retryErr) return true;
      }
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

  // 6. 지원 신청서 삭제
  async deleteApplication(appId) {
    if (!window.supabaseClient || !appId) return;
    try {
      await window.supabaseClient.from('applications').delete().eq('id', String(appId));
    } catch (e) {
      console.error('Supabase deleteApplication error:', e);
    }
  },

  // 7. 전체 양방향 동기화 (Supabase <-> LocalStorage)
  async syncAllData() {
    if (!window.supabaseClient || this.isSyncing) return false;
    this.isSyncing = true;

    let usersChanged = false;
    let appsChanged = false;

    try {
      // --- A. 회원(Users) 동기화 ---
      let localUsers = JSON.parse(localStorage.getItem('users')) || [];
      const { data: supaUsers, error: usersErr } = await window.supabaseClient.from('users').select('*');

      if (!usersErr && Array.isArray(supaUsers)) {
        // 1) Supabase에 있는 회원 데이터를 로컬스토리지에 반영/병합
        supaUsers.forEach(su => {
          const mapped = this.mapDbToUser(su);
          const idx = localUsers.findIndex(u => u.id === mapped.id);

          if (idx === -1) {
            localUsers.push(mapped);
            usersChanged = true;
          } else {
            const cur = localUsers[idx];
            // DB 값이 최신 변경사항(전환상태, 권한, 승인코드 등)을 포함할 때 병합
            let needsUpdate = false;
            if (mapped.conversionStatus !== 'none' && cur.conversionStatus !== mapped.conversionStatus) {
              cur.conversionStatus = mapped.conversionStatus;
              needsUpdate = true;
            }
            if (mapped.role !== 'normal' && cur.role !== mapped.role) {
              cur.role = mapped.role;
              needsUpdate = true;
            }
            if (mapped.bizCode && cur.bizCode !== mapped.bizCode) {
              cur.bizCode = mapped.bizCode;
              needsUpdate = true;
            }
            if (mapped.constCode && cur.constCode !== mapped.constCode) {
              cur.constCode = mapped.constCode;
              needsUpdate = true;
            }
            if (mapped.pendingBusinessName && cur.pendingBusinessName !== mapped.pendingBusinessName) {
              cur.pendingBusinessName = mapped.pendingBusinessName;
              needsUpdate = true;
            }
            if (mapped.pendingLicenseNumber && cur.pendingLicenseNumber !== mapped.pendingLicenseNumber) {
              cur.pendingLicenseNumber = mapped.pendingLicenseNumber;
              needsUpdate = true;
            }
            if (mapped.address && !cur.address) {
              cur.address = mapped.address;
              needsUpdate = true;
            }
            if (mapped.phone && !cur.phone) {
              cur.phone = mapped.phone;
              needsUpdate = true;
            }
            if (Array.isArray(mapped.items) && mapped.items.length > (cur.items || []).length) {
              cur.items = mapped.items;
              needsUpdate = true;
            }

            if (needsUpdate) {
              localUsers[idx] = cur;
              usersChanged = true;
            }
          }
        });

        // 2) 로컬에만 있는 회원(모바일 등 로컬 가입자)을 Supabase로 업로드
        for (const lu of localUsers) {
          const inSupa = supaUsers.find(su => su.id === lu.id);
          if (!inSupa && lu.id !== 'admin' && lu.id !== 'constuser' && lu.id !== 'bizuser') {
            await this.upsertUser(lu);
          } else if (inSupa && lu.conversionStatus !== 'none' && inSupa.conversion_status === 'none') {
            // 로컬에서 전환 신청했으나 Supabase에 아직 안 올라간 경우 동기화
            await this.updateUser(lu.id, {
              conversion_status: lu.conversionStatus,
              pending_business_name: lu.pendingBusinessName || null,
              pending_license_number: lu.pendingLicenseNumber || null
            });
          }
        }

        if (usersChanged) {
          localStorage.setItem('users', JSON.stringify(localUsers));
        }
      }

      // --- B. 지원 신청서(Applications) 동기화 ---
      let localApps = JSON.parse(localStorage.getItem('applications')) || [];
      const { data: supaApps, error: appsErr } = await window.supabaseClient.from('applications').select('*');

      if (!appsErr && Array.isArray(supaApps)) {
        supaApps.forEach(sa => {
          const mapped = this.mapDbToApp(sa);
          const idx = localApps.findIndex(a => String(a.id) === String(mapped.id));

          if (idx === -1) {
            localApps.push(mapped);
            appsChanged = true;
          } else {
            const cur = localApps[idx];
            if (cur.status !== mapped.status || 
                cur.constructionStatus !== mapped.constructionStatus ||
                cur.assignedConstructorId !== mapped.assignedConstructorId) {
              localApps[idx] = { ...cur, ...mapped };
              appsChanged = true;
            }
          }
        });

        // 로컬에만 있는 신청서를 Supabase로 업로드
        for (const la of localApps) {
          const inSupa = supaApps.find(sa => String(sa.id) === String(la.id));
          if (!inSupa) {
            await this.upsertApplication(la);
          }
        }

        if (appsChanged) {
          localStorage.setItem('applications', JSON.stringify(localApps));
        }
      }

      // --- C. 변경 사항 발생 시 전역 이벤트 통보 ---
      if (usersChanged || appsChanged) {
        window.dispatchEvent(new CustomEvent('supabase-data-synced', {
          detail: { usersChanged, appsChanged, users: localUsers, applications: localApps }
        }));
      }

    } catch (e) {
      console.error('Supabase syncAllData error:', e);
    } finally {
      this.isSyncing = false;
    }

    return { usersChanged, appsChanged };
  },

  // 8. 자동 동기화 시작 (주기적 폴링 + 탭 활성화 시 즉시 동기화)
  initAutoSync(intervalMs = 8000) {
    // 초기 로드 시 1회 즉시 실행
    setTimeout(() => this.syncAllData(), 300);

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

    // 백그라운드 주기적 폴링
    if (this.autoSyncTimer) clearInterval(this.autoSyncTimer);
    this.autoSyncTimer = setInterval(() => {
      this.syncAllData();
    }, intervalMs);
  }
};

// 페이지 로드 시 SupabaseSync 자동 가동
if (typeof window !== 'undefined') {
  window.SupabaseSync.initAutoSync(8000);
}
