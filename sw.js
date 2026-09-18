// 간판지원단 PWA Pass-Through Service Worker (캐시 0, 100% 네트워크 직접 호출)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // 캐시 없이 100% 실시간 네트워크 직접 전송 (캐시 충돌 영구 방지 및 PWA 원클릭 설치 지원)
  event.respondWith(fetch(event.request));
});
