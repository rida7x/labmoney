// Service Worker for Alhaytham Lab PWA
const CACHE_VERSION = 'alhaytham-v1';
const SHELL_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/styles.css',
  './js/db.js',
  './js/utils.js',
  './js/auth.js',
  './js/dashboard.js',
  './js/revenues.js',
  './js/expenses.js',
  './js/debts.js',
  './js/labtolab.js',
  './js/employees.js',
  './js/reports.js',
  './js/settings.js',
  './js/app.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => {
      return cache.addAll(SHELL_ASSETS).catch(err => {
        console.warn('SW cache addAll failed for some assets:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_VERSION).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Only handle GET
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // For navigation, try network first then cache
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // For everything else, cache-first
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        // Optionally cache CDN responses (Google Fonts, Font Awesome, Chart.js)
        if (response.ok && (url.origin === location.origin || url.host.includes('cdnjs') || url.host.includes('googleapis') || url.host.includes('gstatic') || url.host.includes('jsdelivr'))) {
          const clone = response.clone();
          caches.open(CACHE_VERSION).then(c => c.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback for assets if offline
        return new Response('', { status: 503 });
      });
    })
  );
});
