// C3: Service Worker for PWA offline support
const CACHE_NAME = 'pbw-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip cross-origin requests or non-GET requests if needed, but for our API proxy it's fine
  if (request.method !== 'GET') return;

  // Global Network-First strategy for both API and static assets
  // This prevents the PWA from getting stuck on an old index.html forever
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache the latest successful response
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache if offline
        return caches.match(request);
      })
  );
});
