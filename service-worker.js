const CACHE_NAME = 'pedidos-produccion-v17';
const ARCHIVOS_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './splash.jpg',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ARCHIVOS_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((nombres) =>
      Promise.all(nombres.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // CDN (jsPDF, Firebase) y Firestore van siempre a la red; el resto, cache-first con respaldo de red.
  const url = event.request.url;
  if (url.includes('cdnjs.cloudflare.com') || url.includes('googleapis.com') || url.includes('firestore') || url.includes('firebaseapp.com')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
