/* 15-Puzzle: slide the numbered tiles into order. The board is shuffled with legal moves only, so it is always solvable. */
(function () {
  const F = Funkloch;
  const SIZES = { easy: 3, normal: 4 };

  F.registerGame({
    id: 'slide-puzzle', skill: 'logic', added: '2026-10-24', glyph: '🔢',
    name: { de: '15er-Puzzle', en: '15-Puzzle' },
    desc: { de: 'Schiebe die Kacheln in die leere Lücke, bis die Zahlen der Reihe nach stehen (1 oben links, Lücke unten rechts). Tippe auf eine Kachel in der Reihe der Lücke, dann rutschen alle bis zur Lücke mit. Weniger Züge = mehr Punkte.', en: 'Slide the tiles into the gap until the numbers are in order (1 at the top left, gap at the bottom right). Tap a tile in the gap\'s row or column and all tiles up to the gap slide along. Fewer moves = more points.' },
    modes: [
      { id: 'easy', name: { de: 'Leicht', en: 'Easy' }, desc: { de: '3×3, Zahlen 1–8', en: '3×3, numbers 1–8' } },
      { id: 'normal', name: { de: 'Klassisch', en: 'Classic' }, desc: { de: '4×4, Zahlen 1–15', en: '4×4, numbers 1–15' } },
    ],
    start(ctx) {
      const r = ctx.rng;
      const S = SIZES[ctx.mode] || 3, N = S * S;
      const t = Array.from({ length: N }, (_, i) => (i + 1) % N); // 0 = gap, solved state
      let gap = N - 1, moves = 0, done = false, last = -1;
      // Random walk of legal moves from the solved board: always solvable.
      const steps = S === 3 ? 60 : 160;
      for (let k = 0; k < steps; k++) {
        const x = gap % S, y = Math.floor(gap / S), opts = [];
        if (x > 0) opts.push(gap - 1);
        if (x < S - 1) opts.push(gap + 1);
        if (y > 0) opts.push(gap - S);
        if (y < S - 1) opts.push(gap + S);
        const cand = opts.filter((o) => o !== last);
        const to = r.pick(cand);
        t[gap] = t[to]; t[to] = 0; last = gap; gap = to;
      }
      const solved = () => t.every((v, i) => v === (i + 1) % N);
      if (solved()) { t[gap] = t[gap - 1]; t[gap - 1] = 0; gap -= 1; }

      ctx.el.innerHTML = '';
      const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${S},minmax(0,1fr));gap:6px;max-width:340px;margin:12px auto;padding:8px;border:2.5px solid var(--ink);border-radius:14px;background:var(--paper-2);touch-action:manipulation"></div>`);
      const btns = [];
      for (let i = 0; i < N; i++) {
        const b = F.h('<button style="aspect-ratio:1;min-width:0;padding:0;min-height:48px;border:2.5px solid var(--ink);border-radius:12px;font-size:28px;line-height:1;cursor:pointer;color:var(--ink);font-family:inherit"></button>');
        b.onclick = () => tap(i);
        board.appendChild(b); btns.push(b);
      }
      ctx.el.appendChild(board);

      function draw() {
        ctx.setInfo(F.tt({ de: `Züge: ${moves}`, en: `Moves: ${moves}` }));
        btns.forEach((b, i) => {
          const v = t[i];
          b.textContent = v || '';
          b.style.visibility = v ? 'visible' : 'hidden';
          b.style.background = v === (i + 1) % N ? 'var(--c-logic)' : 'var(--card)';
        });
      }
      function tap(i) {
        if (done) return;
        const gx = gap % S, gy = Math.floor(gap / S), x = i % S, y = Math.floor(i / S);
        if (i === gap || (x !== gx && y !== gy)) { ctx.sfx('bad'); return; }
        const dir = x === gx ? (y > gy ? S : -S) : (x > gx ? 1 : -1);
        while (gap !== i) { t[gap] = t[gap + dir]; gap += dir; }
        t[gap] = 0; moves++;
        ctx.sfx('tap'); draw();
        if (solved()) {
          done = true; ctx.sfx('good');
          const par = S === 3 ? 22 : 80;
          const score = Math.max(1, Math.round(60 - Math.max(0, moves - par) * (S === 3 ? 0.8 : 0.3)) + (S === 4 ? 20 : 0));
          ctx.wait(700).then(() => ctx.finish({ score, display: F.tt({ de: `${moves} Züge`, en: `${moves} moves` }), quality: Math.min(1, par / Math.max(par, moves)) }));
        }
      }
      draw();
    },
  });
})();
