// Versión del service worker. Ya NO hace falta subirla en cada cambio de la app:
// la app se pide siempre primero a internet y la copia guardada solo se usa si no hay conexión.
const CACHE_NAME = 'pedidos-produccion-auto-v1';
const ARCHIVOS_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(ARCHIVOS_CACHE.map((url) => cache.add(url).catch(() => {})))
    )
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
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Solo archivos propios de la app; CDN, Firebase y Firestore los maneja el navegador directo.
  if (url.origin !== self.location.origin) return;

  // Red primero (siempre la versión más nueva); si no hay internet, se usa la copia guardada.
  event.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((resp) => {
        if (resp && resp.ok) {
          const copia = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, copia)).catch(() => {});
        }
        return resp;
      })
      .catch(() => caches.match(req).then((c) => c || caches.match('./index.html')))
  );
});
