/* Moshwa service worker: network-first, cache sirf offline ke liye. */
const C = 'moshwa-v3';
const CORE = ['./', 'index.html', 'style.css', 'data.js', 'sync.js', 'extra.js', 'custom.js', 'app.js', 'custom.json', 'manifest.webmanifest', 'icon-192.png', 'icon-512.png'];
self.addEventListener('install', e => e.waitUntil(caches.open(C).then(c => c.addAll(CORE)).then(() => self.skipWaiting())));
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  const key = u.origin + u.pathname;
  e.respondWith(fetch(e.request).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(C).then(c => c.put(key, cp)); }
    return r;
  }).catch(() => caches.match(key).then(r => r || caches.match('index.html'))));
});
