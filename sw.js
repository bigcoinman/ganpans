const CACHE_NAME = 'ganpan-support-v50-purge';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './dashboard.html',
  './app.html',
  './app',
  './style.css',
  './app.css',
  './script.js',
  './dashboard.js',
  './app.js',
  './manifest.json',
  './ganpan-app-qr.png',
  './ganpan-favicon-v30.ico',
  './ganpan-favicon-v30.png',
  './ganpan-icon-192-v30.png',
  './ganpan-icon-512-v30.png',
  './ganpan-apple-icon-v30.png',
  './favicon.ico',
  './favicon.png',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png',
  './app-icon.png',
  './간판지원단 로고-3.png',
  './간판지원단 로고-2.png',
  './소상공인_고민해결_이미지.png'
];

// Install Service Worker and skip waiting
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching core assets');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// Activate Service Worker and FORCE PURGE ALL OLD CACHES
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[Service Worker] Forcibly purging old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event: Network-First for HTML navigation, Stale-While-Revalidate for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Network-First strategy for HTML documents (always get fresh HTML from server)
  if (event.request.mode === 'navigate' || event.request.headers.get('accept')?.includes('text/html') || url.pathname.endsWith('.html') || url.pathname === '/app') {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
          }
          return networkResponse;
        })
        .catch(() => {
          // If offline, serve cached HTML
          return caches.match(event.request).then((cached) => cached || caches.match('./app.html'));
        })
    );
    return;
  }

  // Stale-While-Revalidate for static assets (images, css, js)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse.clone()));
          }
          return networkResponse;
        })
        .catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});
