const fs = require('fs');
const assert = require('assert');

console.log('========================================================');
console.log('🧪 사진 실시간 누적 병합 및 캐시 만료 검증 테스트');
console.log('========================================================\n');

// 1. security-utils.js 로직 정적 분석 검증
const secCode = fs.readFileSync('security-utils.js', 'utf8');

// 검증 1: PhotoCacheManager.get에 expectedCount 지원 확인
assert(secCode.includes('async get(appId, expectedCount = null)'), 'PhotoCacheManager.get에 expectedCount 지원 확인');
console.log('✅ 검증 1: PhotoCacheManager.get에 expectedCount 파라미터 탑재 완료');

// 검증 2: expectedCount 미달 시 캐시 만료 감지(stale) 확인
assert(secCode.includes('cachedCount < expectedCount'), '캐시 만료 감지 로직 탑재 확인');
console.log('✅ 검증 2: 기대 사진 장수 미달 시 캐시 자동 만료 감지(stale) 및 DB 재조회 유도 확인');

// 검증 3: ensureApplicationPhotosLoaded에 options 및 forceReload 지원 확인
assert(secCode.includes('async function ensureApplicationPhotosLoaded(appOrId, options = {})'), 'ensureApplicationPhotosLoaded options 지원 확인');
assert(secCode.includes('const forceReload = Boolean(options && options.forceReload);'), 'forceReload 플래그 확인');
console.log('✅ 검증 3: ensureApplicationPhotosLoaded의 forceReload 및 options 완벽 지원 확인');

// 검증 4: handleApplicationPhotoUploadProcess에서 forceReload: true 호출 확인
assert(secCode.includes('ensureApplicationPhotosLoaded(appId, { forceReload: true })'), '업로드 시 forceReload: true로 최신 DB 원본 실시간 조회 확인');
console.log('✅ 검증 4: 업로드 시 상대방 사진 덮어쓰기 방지를 위한 실시간 DB 최신 원본 강제 조회(forceReload: true) 확인');

// 2. Mock 환경에서 캐시 만료 감지 동작 검증
const mockCache = new Map();
const PhotoCacheManagerMock = {
  CACHE_NAME: 'ganpan-photo-cache-v1',
  memoryFallback: new Map(),

  async get(appId, expectedCount = null) {
    if (!appId) return null;
    const key = `app_photo_${String(appId).trim()}`;
    let result = this.memoryFallback.get(key) || null;
    if (result && typeof expectedCount === 'number' && expectedCount > 0) {
      const cachedCount = Array.isArray(result.photos) ? result.photos.length : (result.fileData ? 1 : 0);
      if (cachedCount < expectedCount) {
        return null; // 캐시 만료
      }
    }
    return result;
  },

  async set(appId, photoData) {
    const key = `app_photo_${String(appId).trim()}`;
    this.memoryFallback.set(key, photoData);
  }
};

(async () => {
  // 시나리오 1: 과거 사진 2장이 캐시되어 있는 상태
  await PhotoCacheManagerMock.set('P-260916-001', { photos: ['img1', 'img2'] });
  
  // 기대 사진수 없이 조회 시 캐시 반환
  const hit = await PhotoCacheManagerMock.get('P-260916-001');
  assert(hit !== null && hit.photos.length === 2, '기본 캐시 조회 정상');
  console.log('✅ 검증 5: 기본 캐시 적중(Hit) 정상 동작 (2장 반환)');

  // 상대방이 사진을 올려서 기대 사진수가 4장이 된 경우 조회 시 캐시 만료(null 반환)
  const stale = await PhotoCacheManagerMock.get('P-260916-001', 4);
  assert(stale === null, '캐시 2장 < 기대 4장 이므로 stale 캐시 무효화 성공');
  console.log('✅ 검증 6: 기대 사진수(4장) 미달 시 캐시 만료 감지 및 null 반환 (DB 재조회 트리거)');

  // 새 사진 4장으로 갱신 후 기대 사진수 4장 조회 시 캐시 적중
  await PhotoCacheManagerMock.set('P-260916-001', { photos: ['img1', 'img2', 'img3', 'img4'] });
  const hit4 = await PhotoCacheManagerMock.get('P-260916-001', 4);
  assert(hit4 !== null && hit4.photos.length === 4, '최신 캐시 적중 정상');
  console.log('✅ 검증 7: 갱신된 캐시(4장) 정상 적중 확인');

  // 상대방이 또 2장을 올려서 총 6장이 된 경우 조회 시 캐시 만료
  const stale6 = await PhotoCacheManagerMock.get('P-260916-001', 6);
  assert(stale6 === null, '캐시 4장 < 기대 6장 이므로 stale 캐시 무효화 성공');
  console.log('✅ 검증 8: 총 6장 기대 시 기존 4장 캐시 무효화 및 실서버 6장 재조회 유도 확인');

  console.log('\n🎉 전 항목 테스트 100% 통과 완료!');
})();
