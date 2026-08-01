const CACHE_NAME = 'ganpan-support-v10';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './dashboard.html',
  './app.html',
  './style.css',
  './app.css',
  './script.js',
  './dashboard.js',
  './app.js',
  './manifest.json',
  './간판지원단 로고-3.png',
  './간판지원단 로고-2.png',
  './소상공인_고민해결_이미지.png'
];

// Install Service Worker and cache core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching core offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Service Worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Serve cached assets when offline, otherwise fetch and cache dynamically
self.addEventListener('fetch', (event) => {
  // Only handle GET requests and local assets (or public CDN files)
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Exclude third-party APIs (like QR server or fonts if desired, or handle them gracefully)
  if (url.origin !== self.location.origin && !url.href.includes('cdnjs.cloudflare.com') && !url.href.includes('fonts.googleapis.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Stale-while-revalidate for local static assets
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
            }
          })
          .catch(() => {/* Ignore network errors during background sync */ });

        return cachedResponse;
      }

      // Fetch from network if not in cache, and cache it dynamically
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return networkResponse;
        })
        .catch(() => {
          // If offline and request is for an HTML page, return index.html or dashboard.html
          if (event.request.mode === 'navigate') {
            if (event.request.url.includes('dashboard.html')) {
              return caches.match('./dashboard.html');
            }
            return caches.match('./index.html');
          }
        });
    })
  );
});
