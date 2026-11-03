// Network first, for everything: an update always reaches the screen. The cache is the offline copy.
const CACHE = 'refua-v9';
const ASSETS = ['./', 'index.html', 'css/app.css', 'js/app.js', 'js/data.js', 'js/body.js', 'js/match.js', 'js/circulation.js', 'js/body3d.js', 'js/history.js', 'js/map-data.js', 'img/vesalius-fabrica.jpg', 'img/harvey-veins.jpg', 'img/snow-cholera-map.jpg', 'icons/icon.svg', 'manifest.webmanifest'];
self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS))); self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(fetch(req).then((r) => {
    if (r.ok) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return r;
  }).catch(() => caches.match(req).then((r) => r || (req.mode === 'navigate' ? caches.match('index.html') : Response.error()))));
});
