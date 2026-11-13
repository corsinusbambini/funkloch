/* 15-Puzzle: slide the numbered tiles into order. The board is shuffled with legal moves only, so it is always solvable. */
(function () {
  const F = Funkloch;
  const SIZES = { easy: 3, normal: 4 };

  F.registerGame({
    id: 'slide-puzzle', skill: 'logic', added: '2026-10-24', glyph: '15',
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
      ctx.setInfo(F.tt({ de: 'Ziel: 1 oben links, Lücke unten rechts', en: 'Goal: 1 top left, gap bottom right' }));
      // Wooden tray with drawn tiles; a tile in its right place turns lilac.
      const board = F.h(`<div class="sketch" style="display:grid;grid-template-columns:repeat(${S},minmax(0,1fr));gap:4px;margin:4px 0 0;padding:10px;background:var(--c-memory);box-shadow:var(--shadow);touch-action:manipulation"></div>`);
      const btns = [];
      for (let i = 0; i < N; i++) {
        const b = F.h('<button style="aspect-ratio:1;min-width:0;padding:0;border:0;background:transparent;cursor:pointer;color:var(--ink);font-family:inherit;display:block"></button>');
        b.onclick = () => tap(i);
        board.appendChild(b); btns.push(b);
      }
      const fs = S === 3 ? 46 : 42;
      const tile = (v, ok, k, cls) => `<svg viewBox="0 0 100 100" class="${cls}" style="width:100%;height:100%;display:block">
        <path d="M5,${5 + (k % 3)} L${94 - (k % 2) * 2},4 L96,${95 - (k % 3)} L${4 + (k % 2) * 2},96 Z" style="fill:${ok ? 'var(--c-logic)' : 'var(--card)'};stroke:var(--ink)" stroke-linejoin="round" stroke-width="5"/>
        <path d="M14,24 C15,17 19,13 28,12" style="fill:none;stroke:${ok ? '#FFFFFF' : 'var(--dot)'};opacity:.8" stroke-width="5" stroke-linecap="round"/>
        <text x="50" y="${50 + fs * 0.36}" text-anchor="middle" style="fill:var(--ink);font-size:${fs}px;font-family:inherit">${v}</text></svg>`;
      const hole = '<svg viewBox="0 0 100 100" style="width:100%;height:100%;display:block"><rect x="8" y="8" width="84" height="84" rx="14" style="fill:var(--paper-2);stroke:var(--ink-soft)" stroke-width="3" stroke-dasharray="8 7"/></svg>';
      // Status below the board: moves, tiles in place, and a small picture of the goal.
      const stat = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px"></div>');
      const nums = F.h('<div style="display:flex;flex-direction:column;gap:10px"></div>');
      const box = (label) => {
        const el = F.h(`<div class="card sketch" style="padding:10px 10px;display:flex;align-items:baseline;justify-content:space-between;gap:8px"><span style="font-size:17px;color:var(--ink-soft)">${F.tt(label)}</span><b style="font-size:32px;font-weight:normal;line-height:1.15">0</b></div>`);
        nums.appendChild(el);
        return el.querySelector('b');
      };
      const movesEl = box({ de: 'Züge', en: 'Moves' }), okEl = box({ de: 'Am Platz', en: 'In place' });
      const m = 100 / S;
      let goal = '';
      for (let i = 0; i < N - 1; i++) goal += `<rect x="${(i % S) * m + 2}" y="${Math.floor(i / S) * m + 2}" width="${m - 4}" height="${m - 4}" rx="5" style="fill:var(--c-logic);stroke:var(--ink)" stroke-width="1.8"/><text x="${(i % S) * m + m / 2}" y="${Math.floor(i / S) * m + m / 2 + (S === 3 ? 7 : 5.5)}" text-anchor="middle" style="fill:var(--ink);font-size:${S === 3 ? 20 : 15}px;font-family:inherit">${i + 1}</text>`;
      const goalCard = F.h(`<div class="card sketch alt" style="padding:6px 10px;display:flex;align-items:center;justify-content:center;gap:8px"><span style="font-size:17px;color:var(--ink-soft)">${F.tt({ de: 'Ziel', en: 'Goal' })}</span><svg viewBox="0 0 100 100" style="width:112px;height:112px;display:block;transform:rotate(2deg)">${goal}</svg></div>`);
      stat.append(nums, goalCard);
      ctx.el.append(board, stat);

      let prev = t.slice();
      function draw() {
        btns.forEach((b, i) => {
          const v = t[i];
          b.innerHTML = v ? tile(v, v === (i + 1) % N, i, prev[i] !== v ? 'tap-pop' : '') : hole;
        });
        prev = t.slice();
        movesEl.textContent = moves;
        okEl.textContent = `${t.filter((v, i) => v && v === (i + 1) % N).length}/${N - 1}`;
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
          board.classList.add('flash-ok');
          const par = S === 3 ? 22 : 80;
          const score = Math.max(1, Math.round(60 - Math.max(0, moves - par) * (S === 3 ? 0.8 : 0.3)) + (S === 4 ? 20 : 0));
          ctx.wait(700).then(() => ctx.finish({ score, display: F.tt({ de: `${moves} Züge`, en: `${moves} moves` }), quality: Math.min(1, par / Math.max(par, moves)) }));
        }
      }
      draw();
    },
  });
})();
