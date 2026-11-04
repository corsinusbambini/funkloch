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
      const status = F.h('<div class="info-line" style="text-align:center;font-size:22px;min-height:30px"></div>');
      const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${n},minmax(0,1fr));gap:8px;max-width:340px;margin:14px auto;touch-action:manipulation"></div>`);
      const cells = [];
      for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
        const b = F.h('<button style="min-width:0;padding:0;aspect-ratio:1;min-height:48px;border:3px solid var(--ink);border-radius:14px;background:var(--card);color:var(--ink);font-size:22px;font-family:inherit;cursor:pointer;box-shadow:var(--shadow);transition:background .08s"></button>');
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(x, y); });
        board.appendChild(b); cells.push(b);
      }
      ctx.el.appendChild(status); ctx.el.appendChild(board);
      const cell = (x, y) => cells[y * n + x];
      const paint = (x, y, bg, txt) => { const c = cell(x, y); c.style.background = bg; c.textContent = txt || ''; };
      const clear = () => cells.forEach((c) => { c.style.background = 'var(--card)'; c.textContent = ''; });

      function hearts() { ctx.setInfo('❤️'.repeat(lives)); ctx.setScore(best); }
      async function show(fresh) {
        listening = false; pos = 0; clear(); hearts();
        if (fresh) path = makePath(r, n, len);
        status.textContent = F.tt({ de: 'Schau genau …', en: 'Watch closely …' });
        await ctx.wait(700);
        for (let i = 0; i < path.length; i++) {
          paint(path[i][0], path[i][1], 'var(--accent)', i === 0 ? '▶' : '');
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
          paint(x, y, 'var(--bad)', '✗');
          hearts();
          await ctx.wait(1300);
          if (lives <= 0) { over = true; return end(); }
          return show(false);
        }
        paint(x, y, 'var(--good)', pos + 1);
        ctx.sfx('tap');
        pos++;
        if (pos === path.length) {
          listening = false; best = len; ctx.sfx('good'); hearts();
          status.textContent = F.tt({ de: 'Richtig!', en: 'Correct!' });
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
