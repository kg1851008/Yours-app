// YOURS service worker: offline app shell. The AI endpoint is never cached.
const CACHE = 'yours-v17';
const SHELL = ['/', '/index.html', '/styles.css', '/config.js', '/cloud.js', '/data.js', '/logic.js', '/app.js', '/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png', '/img/logo.png', '/fonts/fonts.css', '/fonts/anton.woff2', '/fonts/archivo-expanded-black.woff2', '/fonts/dm-mono-400.woff2', '/fonts/dm-mono-500.woff2', '/fonts/instrument-serif.woff2', '/fonts/instrument-serif-italic.woff2', '/fonts/inter.woff2', '/fonts/script.woff2'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;
  if (e.request.mode === 'navigate') {
    e.respondWith(fetch(e.request).catch(() => caches.match('/index.html')));
    return;
  }
  // App code, styles and settings: network first, so a new deploy shows on the next open. The cache is the offline fallback.
  if (/\.(js|css|webmanifest)$/.test(url.pathname) && !url.pathname.startsWith('/vendor/')) {
    e.respondWith(fetch(e.request).then((res) => { if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); } return res; }).catch(() => caches.match(e.request)));
    return;
  }
  // Fonts, images and vendored libraries rarely change: cache first, refreshed in the background.
  e.respondWith(caches.open(CACHE).then(async (cache) => {
    const cached = await cache.match(e.request);
    const fresh = fetch(e.request).then((res) => { if (res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => cached);
    return cached || fresh;
  }));
});
