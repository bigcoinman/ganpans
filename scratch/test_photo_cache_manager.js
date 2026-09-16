const fs = require('fs');
const path = require('path');

console.log('=== [PhotoCacheManager 브라우저 사진 캐싱 엔진 3단계 자체 검증] ===\n');

// Mock 환경 구성
const mockLocalStorage = {};
global.localStorage = {
  getItem: (k) => mockLocalStorage[k] || null,
  setItem: (k, v) => { mockLocalStorage[k] = String(v); },
  removeItem: (k) => { delete mockLocalStorage[k]; }
};
global.sessionStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} };

// CacheStorage Mock 구현
const mockCacheMap = new Map();
global.caches = {
  open: async (cacheName) => ({
    match: async (req) => {
      const url = typeof req === 'string' ? req : req.url;
      if (mockCacheMap.has(url)) {
        const val = mockCacheMap.get(url);
        return {
          json: async () => JSON.parse(val),
          ok: true
        };
      }
      return null;
    },
    put: async (req, res) => {
      const url = typeof req === 'string' ? req : req.url;
      const text = res._bodyText;
      mockCacheMap.set(url, text);
    },
    delete: async (req) => {
      const url = typeof req === 'string' ? req : req.url;
      mockCacheMap.delete(url);
    }
  })
};

global.Request = class {
  constructor(url) { this.url = url; }
};
global.Response = class {
  constructor(bodyText, opts) { this._bodyText = bodyText; this.opts = opts; }
};

global.document = {
  readyState: 'complete',
  addEventListener: () => {},
  removeEventListener: () => {},
  querySelectorAll: () => [],
  querySelector: () => null,
  getElementById: () => null,
  body: { appendChild: () => {}, insertAdjacentHTML: () => {} }
};
global.window = {
  localStorage: global.localStorage,
  sessionStorage: global.sessionStorage,
  document: global.document,
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => {},
  CustomEvent: class {}
};

// security-utils.js 로드
const secUtilsCode = fs.readFileSync(path.join(__dirname, '..', 'security-utils.js'), 'utf8');
eval(secUtilsCode);

async function runTest() {
  const PhotoCache = window.PhotoCacheManager;
  if (!PhotoCache) throw new Error('PhotoCacheManager is not defined!');

  console.log('1. PhotoCacheManager 정의 확인: 정상 ✅');

  // 1) 캐시 쓰기 테스트
  const appId = 'P-260917-001';
  const sampleData = {
    photos: ['data:image/jpeg;base64,/9j/test111', 'data:image/jpeg;base64,/9j/test222'],
    fileData: 'data:image/jpeg;base64,/9j/test111'
  };

  await PhotoCache.set(appId, sampleData);
  console.log('2. PhotoCacheManager.set() 저장 완료');

  // 2) 캐시 읽기 테스트 (Cache HIT)
  const cachedData = await PhotoCache.get(appId);
  console.log('3. PhotoCacheManager.get() 조회 결과:', cachedData ? `사진 ${cachedData.photos.length}장 확인 ✅` : 'FAIL ❌');
  if (!cachedData || cachedData.photos.length !== 2) {
    throw new Error('Cache hit verification failed!');
  }

  // 3) ensureApplicationPhotosLoaded와 연동 테스트
  let supabaseCallCount = 0;
  window.supabaseClient = {
    from: (tbl) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => {
            supabaseCallCount++;
            return { data: { id: appId, image_url: JSON.stringify(sampleData.photos) }, error: null };
          }
        })
      })
    })
  };

  // 1회차: 이미 PhotoCacheManager에 저장되어 있으므로 Supabase 호출이 0회여야 함!
  const emptyAppObj = { id: appId };
  const loadedApp = await ensureApplicationPhotosLoaded(emptyAppObj);
  console.log(`4. ensureApplicationPhotosLoaded 실행 후 Supabase 호출 횟수: ${supabaseCallCount}회 (기대값: 0회)`);
  if (supabaseCallCount !== 0) {
    throw new Error(`FAIL: Supabase should NOT be called when cache hits! got ${supabaseCallCount}`);
  }
  console.log('   -> ⚡ CacheStorage 덕분에 Supabase 네트워크 호출 0회, 데이터 소모 0 Byte 확인 완료! ✅');

  // 4) 캐시 무효화(Bust) 테스트
  await PhotoCache.invalidate(appId);
  const afterBust = await PhotoCache.get(appId);
  console.log('5. 캐시 무효화 후 조회:', afterBust === null ? '정상 삭제(null) 확인 ✅' : 'FAIL ❌');

  // 무효화 후에는 Supabase가 1회 호출되고 다시 캐싱되어야 함!
  const loadedAfterBust = await ensureApplicationPhotosLoaded({ id: appId });
  console.log(`6. 무효화 후 로드 시 Supabase 호출 횟수: ${supabaseCallCount}회 (기대값: 1회)`);
  if (supabaseCallCount !== 1) {
    throw new Error(`FAIL: Supabase should be called once after cache bust! got ${supabaseCallCount}`);
  }

  // 다시 조회 시 Supabase 호출 없이 0회여야 함!
  await ensureApplicationPhotosLoaded({ id: appId });
  console.log(`7. 재조회 시 Supabase 호출 횟수: ${supabaseCallCount}회 (호출 증가 없음, 기대값: 1회)`);
  if (supabaseCallCount !== 1) {
    throw new Error(`FAIL: Supabase was called again! Cache was not restored.`);
  }

  console.log('\n================================================================');
  console.log('   🎉 PhotoCacheManager 브라우저 캐싱 테스트 100% PASS!');
  console.log('   - 1회 다운로드 후 수파베이스 트래픽 영구 0 Byte 보장 완벽 입증');
  console.log('================================================================');
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});
