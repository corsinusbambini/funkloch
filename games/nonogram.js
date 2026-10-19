/* Nonogram: fill cells so every row and column matches its number clues. Freshly generated each time. */
(function () {
  const F = Funkloch;
  const clues = (line) => { const out = []; let run = 0; line.forEach((v) => { if (v) run++; else if (run) { out.push(run); run = 0; } }); if (run) out.push(run); return out.length ? out : [0]; };
  const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);

  F.registerGame({
    id: 'nonogram', skill: 'logic', glyph: '▦',
    name: { de: 'Nonogramm', en: 'Nonogram' },
    desc: {
      de: 'Die Zahlen sagen, wie viele Felder nacheinander ausgemalt sind, z.B. „2 1“ = zwei, Lücke, eins. Tippen oder wischen zum Ausmalen. Mit ✕ markierst du sichere Lücken.',
      en: 'The numbers tell how many cells in a row are filled, e.g. “2 1” = two, gap, one. Tap or swipe to fill. Use ✕ to mark cells you know are empty.',
    },
    start(ctx) {
      const r = ctx.rng;
      const n = ctx.level <= 2 ? 5 : ctx.level <= 5 ? 6 : ctx.level <= 8 ? 7 : 8;
      const sol = ctx.fresh(() => {
        let g;
        do { g = Array.from({ length: n }, () => Array.from({ length: n }, () => (r() < 0.58 ? 1 : 0))); }
        while (g.flat().filter(Boolean).length < n * n * 0.4);
        return g;
      }, (g) => g.flat().join(''));
      const rowC = sol.map(clues);
      const colC = sol[0].map((_, x) => clues(sol.map((row) => row[x])));
      const grid = sol.map((row) => row.map(() => 0)); // 0 empty, 1 filled, 2 crossed
      const start = performance.now();
      let mode = 1, painting = null, won = false;
      const maxRow = Math.max(...rowC.map((c) => c.length));
      const maxCol = Math.max(...colC.map((c) => c.length));
      ctx.setInfo(F.tt({ de: `${n}×${n}`, en: `${n}×${n}` }));
      const timer = setInterval(() => { const s = Math.floor((performance.now() - start) / 1000); ctx.setScore(`${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`); }, 500);
      ctx.onCleanup(() => clearInterval(timer));

      const board = F.h(`<div class="nono card sketch" style="grid-template-columns:${maxRow * 0.55 + 0.6}fr repeat(${n},1fr);padding:10px"></div>`);
      const cells = [];
      const render = () => {
        board.innerHTML = '';
        board.appendChild(F.h('<div></div>'));
        colC.forEach((c, x) => {
          const done = same(clues(grid.map((row) => row[x] === 1)), c);
          board.appendChild(F.h(`<div class="clue ${done ? 'done' : ''}" style="min-height:${maxCol * 17}px;flex-direction:column">${c.map((v) => `<span>${v}</span>`).join('')}</div>`));
        });
        grid.forEach((row, y) => {
          const done = same(clues(row.map((v) => v === 1)), rowC[y]);
          board.appendChild(F.h(`<div class="clue row ${done ? 'done' : ''}">${rowC[y].join(' ')}</div>`));
          row.forEach((v, x) => {
            const c = F.h(`<div class="cell ${v === 1 ? 'on' : ''} ${x % 5 === 4 && x < n - 1 ? 'b-r' : ''} ${y % 5 === 4 && y < n - 1 ? 'b-b' : ''}" data-x="${x}" data-y="${y}">${v === 2 ? '✕' : ''}</div>`);
            board.appendChild(c);
            cells.push(c);
          });
        });
      };
      const apply = (x, y) => {
        if (painting == null) painting = grid[y][x] === mode ? 0 : mode;
        if (grid[y][x] === painting) return;
        grid[y][x] = painting;
        ctx.sfx('tap');
        render();
        check();
      };
      const cellAt = (e) => { const el = document.elementFromPoint(e.clientX, e.clientY); return el && el.closest && el.closest('.cell'); };
      board.addEventListener('pointerdown', (e) => { if (won) return; const c = cellAt(e); if (!c) return; e.preventDefault(); if (e.target.releasePointerCapture) e.target.releasePointerCapture(e.pointerId); painting = null; apply(+c.dataset.x, +c.dataset.y); });
      board.addEventListener('pointermove', (e) => { if (won || painting == null || e.buttons === 0 && e.pointerType === 'mouse') return; const c = cellAt(e); if (c) apply(+c.dataset.x, +c.dataset.y); });
      const stop = () => { painting = null; };
      window.addEventListener('pointerup', stop);
      ctx.onCleanup(() => window.removeEventListener('pointerup', stop));

      async function check() {
        const ok = grid.every((row, y) => same(clues(row.map((v) => v === 1)), rowC[y])) &&
          colC.every((c, x) => same(clues(grid.map((row) => row[x] === 1)), c));
        if (!ok) return;
        won = true;
        clearInterval(timer);
        const secs = Math.round((performance.now() - start) / 1000);
        ctx.sfx('win');
        board.classList.add('flash-ok');
        await ctx.wait(900);
        const target = n * n * 4;
        ctx.finish({
          score: Math.max(5, Math.round(n * n * 3 - secs / 2)),
          detail: F.tt({ de: `${n}×${n} in ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}`, en: `${n}×${n} in ${Math.floor(secs / 60)}:${String(secs % 60).padStart(2, '0')}` }),
          levelDelta: secs < target ? 1 : 0,
          quality: Math.min(1, target / Math.max(1, secs)), ink: 6 + n * 2,
        });
      }

      const modeBar = F.h(`<div class="seg" style="justify-content:center;margin-top:14px"><button data-m="1" class="on">■ ${F.tt({ de: 'Ausmalen', en: 'Fill' })}</button><button data-m="2">✕ ${F.tt({ de: 'Lücke', en: 'Gap' })}</button></div>`);
      modeBar.addEventListener('click', (e) => { const b = e.target.closest('[data-m]'); if (!b) return; mode = +b.dataset.m; modeBar.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b)); });
      render();
      ctx.el.append(board, modeBar);
    },
  });
})();
