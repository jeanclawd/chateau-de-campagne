// Offline support: precache the app shell, then go network-first so every
// load gets one consistent release (cache-first mixed an old game.js with a
// new index.html after an update). The cache is only a fallback for offline.
const VERSION = 'cdc-v3';
const SHELL = [
  './', 'index.html', 'css/style.css', 'manifest.webmanifest',
  'js/game.js', 'js/i18n.js', 'js/world.js', 'js/data.js', 'js/pix.js',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const cacheable = url.origin === location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(url.hostname);
  if (!cacheable) return;
  e.respondWith(caches.open(VERSION).then(cache =>
    // navigations can't be re-initialised; everything else revalidates with the server
    fetch(req.mode === 'navigate' ? req : new Request(req, { cache: 'no-cache' })).then(res => {
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
      return res;
    }).catch(() => cache.match(req, { ignoreSearch: url.origin === location.origin }))
  ));
});
