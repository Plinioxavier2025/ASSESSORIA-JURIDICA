const CACHE_NAME = 'as-prazos-cache-v1';
const ASSETS_TO_CACHE = [
  './index.html',
  './src/style.css',
  './src/main.js',
  './src/db.js',
  './src/auth.js',
  './src/reports.js',
  './src/law_office_bg.png',
  './app_icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retorna o cache local, mas tenta atualizar em segundo plano se houver conexão
        fetch(event.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* ignora falhas de rede offline */});
        
        return cachedResponse;
      }
      return fetch(event.request);
    })
  );
});
