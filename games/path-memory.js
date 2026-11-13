/* Path Memory: a path lights up on the grid. Remember it, then tap the same cells in the same order. */
(function () {
  const F = Funkloch;

  function makePath(r, n, len) {
    for (let t = 0; t < 40; t++) {
      let cur = [r.int(0, n - 1), r.int(0, n - 1)];
      const path = [cur], seen = new Set([cur.join()]);
      while (path.length < len) {
        const opts = [[1, 0], [-1, 0], [0, 1], [0, -1]].map((d) => [cur[0] + d[0], cur[1] + d[1]])
          .filter(([x, y]) => x >= 0 && y >= 0 && x < n && y < n && !seen.has(x + ',' + y));
        if (!opts.length) break;
        cur = opts[r.int(0, opts.length - 1)];
        path.push(cur); seen.add(cur.join());
      }
      if (path.length === len) return path;
    }
    // fallback: snake through the rows (always long enough)
    const path = [];
    for (let y = 0; y < n && path.length < len; y++) for (let k = 0; k < n && path.length < len; k++) path.push([y % 2 ? n - 1 - k : k, y]);
    return path;
  }

  F.registerGame({
    id: 'path-memory', skill: 'memory', added: '2026-11-04', glyph: '👣',
    name: { de: 'Pfad-Gedächtnis', en: 'Path Memory' },
    desc: {
      de: 'Ein Pfad leuchtet Feld für Feld auf dem Gitter auf. Merk ihn dir und tippe danach dieselben Felder in derselben Reihenfolge. Jeder geschaffte Pfad wird ein Feld länger. Du hast 3 Leben.',
      en: 'A path lights up cell by cell on the grid. Remember it, then tap the same cells in the same order. Every path you get right grows by one cell. You have 3 lives.',
    },
    start(ctx) {
      const r = ctx.rng, n = ctx.level >= 5 ? 5 : 4, MAXLEN = n * n - 2;
      const step = Math.max(300, 520 - ctx.level * 16);
      let len = 3, lives = 3, best = 2, listening = false, pos = 0, over = false, path = null;
      ctx.el.innerHTML = '';
      // drawn motif: footprints walking along a dotted trail to a flag
      const MOTIF = `<svg class="motif" viewBox="0 -6 320 82" width="340" height="88" aria-hidden="true" style="transform:rotate(1deg)">
        <g stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M14 56 C70 66 90 20 150 30 S240 60 272 34" fill="none" stroke="var(--ink-soft)" stroke-width="2" stroke-dasharray="2 7"/>
          ${[[44, 52, -20], [80, 40, -40], [118, 30, -60], [156, 34, 80], [194, 44, 70], [232, 46, 40]].map(([x, y, r], k) => `<g transform="translate(${x} ${y + (k % 2 ? -7 : 7)}) rotate(${r + 90})"><path d="M-6 0 C-6 -9 6 -9 6 0 C6 7 3 10 0 10 C-3 10 -6 7 -6 0 Z" fill="var(--c-memory)"/><circle cx="-5" cy="-11" r="1.8" fill="var(--ink)"/><circle cx="0" cy="-13" r="1.8" fill="var(--ink)"/><circle cx="5" cy="-11" r="1.8" fill="var(--ink)"/></g>`).join('')}
          <path d="M276 60 L278 10" fill="none"/><path d="M278 10 L306 18 L277 28 Z" fill="var(--accent)"/>
        </g></svg>`;
      const card = F.h('<div class="sketch" style="background:var(--card);box-shadow:var(--shadow);margin:8px 6px 26px;padding:12px;display:flex;align-items:center;justify-content:space-between;gap:10px;transform:rotate(-.6deg)"></div>');
      const status = F.h('<div style="font-size:21px;line-height:1.2;min-height:26px;flex:1;min-width:0"></div>');
      const heartBox = F.h('<div style="display:flex;gap:3px;flex:none"></div>');
      card.append(status, heartBox);
      const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${n},minmax(0,1fr));gap:${n > 4 ? 7 : 9}px;padding:2px 3px;touch-action:manipulation"></div>`);
      const cells = [];
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const k = y * n + x;
        const b = F.h(`<button style="min-width:0;padding:0;aspect-ratio:1;min-height:48px;border:2.5px solid var(--ink);border-radius:${k % 2 ? '16px 11px 15px 10px' : '11px 16px 10px 15px'};background:var(--card);color:var(--ink);font-size:26px;font-family:inherit;cursor:pointer;box-shadow:var(--shadow);transition:background .08s;display:flex;align-items:center;justify-content:center;line-height:1"></button>`);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(x, y); });
        board.appendChild(b); cells.push(b);
      }
      ctx.el.append(F.h(MOTIF), card, board);
      const cell = (x, y) => cells[y * n + x];
      const FOOT = '<svg viewBox="0 0 40 40" style="width:58%;height:58%;display:block"><g stroke="#2B2522" stroke-width="2.4" stroke-linejoin="round"><path d="M13 22 C13 12 27 12 27 22 C27 30 24 35 20 35 C16 35 13 30 13 22 Z" fill="var(--card)"/><circle cx="13" cy="9" r="3" fill="var(--card)"/><circle cx="20" cy="6" r="3" fill="var(--card)"/><circle cx="27" cy="9" r="3" fill="var(--card)"/></g></svg>';
      const START = '<svg viewBox="0 0 40 40" style="width:58%;height:58%;display:block"><path d="M12 8 L32 20 L12 32 Z" fill="var(--card)" stroke="#2B2522" stroke-width="3" stroke-linejoin="round"/></svg>';
      const pop = (c) => { c.classList.remove('tap-pop'); void c.offsetWidth; c.classList.add('tap-pop'); };
      const paint = (x, y, bg, txt, dark) => {
        const c = cell(x, y); c.style.background = bg; c.style.color = dark ? '#2B2522' : 'var(--ink)';
        if (txt === FOOT || txt === START) c.innerHTML = txt; else c.textContent = txt || '';
        if (bg !== 'var(--card)') pop(c);
      };
      const clear = () => cells.forEach((c) => { c.style.background = 'var(--card)'; c.textContent = ''; c.classList.remove('flash-bad', 'tap-pop'); });

      const heart = (on) => `<svg viewBox="0 0 26 24" width="28" height="26" style="display:block;opacity:${on ? 1 : 0.35}"><path d="M13 21 C4 15 1 10 3 6 C5 2 10 2 13 7 C16 2 21 2 23 6 C25 10 22 15 13 21 Z" fill="${on ? 'var(--bad)' : 'none'}" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round"/>${on ? '<path d="M6 8 Q7 5 10 5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>' : ''}</svg>`;
      function hearts() {
        heartBox.innerHTML = [0, 1, 2].map((k) => heart(k < lives)).join('');
        ctx.setInfo(F.tt({ de: `Pfad: ${len} Felder`, en: `Path: ${len} cells` })); ctx.setScore(best);
      }
      async function show(fresh) {
        listening = false; pos = 0; clear(); hearts();
        if (fresh) path = makePath(r, n, len);
        status.textContent = F.tt({ de: 'Schau genau …', en: 'Watch closely …' });
        await ctx.wait(700);
        for (let i = 0; i < path.length; i++) {
          paint(path[i][0], path[i][1], 'var(--accent)', i === 0 ? START : FOOT);
          ctx.sfx('tap');
          await ctx.wait(step);
          paint(path[i][0], path[i][1], 'var(--card)', '');
          await ctx.wait(100);
        }
        status.textContent = F.tt({ de: 'Du bist dran! Start: das erste Feld.', en: 'Your turn! Start with the first cell.' });
        listening = true;
      }
      async function tap(x, y) {
        if (!listening || over) return;
        const want = path[pos];
        if (x !== want[0] || y !== want[1]) {
          listening = false; lives--; ctx.sfx('bad');
          paint(want[0], want[1], 'var(--c-fun)', '✓');
          paint(x, y, 'var(--bad)', '✗', true);
          cell(x, y).classList.remove('tap-pop'); cell(x, y).classList.add('flash-bad');
          hearts();
          await ctx.wait(1300);
          if (lives <= 0) { over = true; return end(); }
          return show(false);
        }
        paint(x, y, 'var(--good)', pos + 1, true);
        ctx.sfx('tap');
        pos++;
        if (pos === path.length) {
          listening = false; best = len; ctx.sfx('good'); hearts();
          status.textContent = F.tt({ de: 'Richtig!', en: 'Correct!' });
          if (len < MAXLEN) F.cheer(8);
          await ctx.wait(800);
          if (len >= MAXLEN) { over = true; return end(); }
          len++;
          show(true);
        }
      }
      function end() {
        ctx.finish({
          score: best, detail: F.tt({ de: `Pfad mit ${best} Feldern`, en: `Path of ${best} cells` }),
          levelDelta: best >= 9 ? 1 : best < 5 ? -1 : 0,
          quality: Math.min(1, best / 10), ink: 2 + best,
        });
      }
      ctx.onCleanup(() => { over = true; listening = false; });
      show(true);
    },
  });
})();
