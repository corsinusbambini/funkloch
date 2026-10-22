/* Offline support: cache every file of the app on first visit, then serve from cache. */
const VERSION = 'funkloch-v8';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/core.js', 'js/i18n.js', 'js/companion.js', 'js/party.js', 'js/app.js',
  'games/chaos.js', 'games/number-flash.js', 'games/pi-runner.js', 'games/fold-punch.js', 'games/block-count.js',
  'games/dilution-lab.js', 'games/element-duel.js', 'games/make-24.js', 'games/pattern-next.js',
  'games/focus-tunnel.js', 'games/bubble-wrap.js', 'games/split-duel.js',
  'games/tap-race.js', 'games/quick-draw.js', 'games/stop-bar.js', 'games/brain-race.js', 'games/tug-of-war.js', 'games/pong.js', 'games/hot-potato.js', 'games/code-breaker.js', 'games/color-grab.js', 'games/balloon-pump.js', 'games/odd-race.js', 'games/lights-out.js', 'games/count-them.js', 'games/mini-sudoku.js',
  'icons/icon.svg', 'icons/icon-180.png', 'icons/icon-192.png', 'icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Cache first; anything new (e.g. the handwriting font) is stored the first time it loads online.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(e.request, copy));
        }
        return res;
      }).catch(() => caches.match('index.html'));
    })
  );
});
