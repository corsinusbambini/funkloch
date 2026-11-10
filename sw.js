/* Offline support: cache every file of the app on first visit, then serve from cache. */
const VERSION = 'funkloch-v34';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'css/style.css',
  'js/core.js', 'js/i18n.js', 'js/companion.js', 'js/party.js', 'js/badges.js', 'js/app.js',
  'games/chaos.js', 'games/number-flash.js', 'games/pi-runner.js', 'games/fold-punch.js', 'games/block-count.js',
  'games/dilution-lab.js', 'games/element-duel.js', 'games/make-24.js', 'games/pattern-next.js', 'games/snake.js', 'games/falling-blocks.js', 'games/paper-plane.js', 'games/peg-solitaire.js', 'games/molar-mass-rush.js', 'games/chain-calc.js', 'games/breakout.js', 'games/magic-square.js',
  'games/focus-tunnel.js', 'games/bubble-wrap.js', 'games/split-duel.js',
  'games/tap-race.js', 'games/quick-draw.js', 'games/stop-bar.js', 'games/brain-race.js', 'games/tug-of-war.js', 'games/pong.js', 'games/hot-potato.js', 'games/code-breaker.js', 'games/color-grab.js', 'games/balloon-pump.js', 'games/odd-race.js', 'games/lights-out.js', 'games/count-them.js', 'games/mini-sudoku.js', 'games/game-2048.js', 'games/connect-four.js', 'games/minesweeper.js', 'games/dots-boxes.js', 'games/slide-puzzle.js', 'games/snakes-ladders.js', 'games/pairs.js', 'games/simon.js', 'games/rock-paper-scissors.js', 'games/tic-tac-toe.js', 'games/stack-tower.js', 'games/balance-it.js', 'games/yahtzee.js', 'games/battleship.js', 'games/hazard-swipe.js', 'games/stroop.js', 'games/kenken.js', 'games/path-memory.js', 'games/frogger.js', 'games/pancake-flip.js', 'games/hanoi.js', 'games/ph-sort.js', 'games/flow.js', 'games/percent-shop.js', 'games/match-three.js', 'games/what-changed.js', 'games/sudoku.js', 'games/mandala.js', 'games/pipes.js', 'games/ion-builder.js',
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
