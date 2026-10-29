/* Peg Solitaire: jump a peg over a neighbour into an empty hole and remove the jumped peg. Leave only one. */
(function () {
  const F = Funkloch;
  const N = 7;
  const inCross = (x, y) => x >= 0 && y >= 0 && x < N && y < N && (x >= 2 && x <= 4 || y >= 2 && y <= 4);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  const idx = (x, y) => y * N + x;

  // Build a puzzle backwards from one peg, so it is always solvable.
  function makePuzzle(r, steps) {
    const cells = [];
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (inCross(x, y)) cells.push([x, y]);
    const g = Array(N * N).fill(0);
    const [sx, sy] = r.pick(cells);
    g[idx(sx, sy)] = 1;
    let done = 0;
    for (let t = 0; t < 200 && done < steps; t++) {
      const opts = [];
      cells.forEach(([x, y]) => {
        if (!g[idx(x, y)]) return;
        DIRS.forEach(([dx, dy]) => {
          const bx = x + dx, by = y + dy, ax = x + 2 * dx, ay = y + 2 * dy;
          if (inCross(ax, ay) && !g[idx(bx, by)] && !g[idx(ax, ay)]) opts.push([x, y, bx, by, ax, ay]);
        });
      });
      if (!opts.length) break;
      const [x, y, bx, by, ax, ay] = r.pick(opts);
      g[idx(x, y)] = 0; g[idx(bx, by)] = 1; g[idx(ax, ay)] = 1;
      done++;
    }
    return { grid: g, pegs: g.reduce((a, b) => a + b, 0) };
  }

  F.registerGame({
    id: 'peg-solitaire', skill: 'spatial', added: '2026-10-29', glyph: '⚫',
    name: { de: 'Steckhalma', en: 'Peg Solitaire' },
    desc: {
      de: 'Tippe einen Stein und dann ein leeres Loch direkt dahinter: Der Stein springt über seinen Nachbarn, und der übersprungene Stein verschwindet. Lass am Ende nur einen Stein übrig. Jedes Rätsel ist neu und lösbar. 3 Rätsel.',
      en: 'Tap a peg, then an empty hole right behind its neighbour: the peg jumps over it and the jumped peg is removed. End up with just one peg. Every puzzle is new and solvable. 3 puzzles.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 3;
      let round = 0, points = 0, solved = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const steps = Math.min(16, 5 + ctx.level + round * 2);
        const puz = ctx.fresh(() => makePuzzle(r, steps), (p) => p.grid.join(''));
        const start = puz.grid.slice();
        let grid = start.slice(), sel = -1, done = false, resets = 0;
        const hist = [];
        ctx.el.innerHTML = '';
        const info = F.h('<div class="info-line" style="text-align:center;min-height:26px"></div>');
        const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${N},minmax(0,1fr));gap:3px;max-width:343px;margin:8px auto;touch-action:manipulation"></div>`);
        const btns = [];
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          if (!inCross(x, y)) { board.appendChild(F.h('<div></div>')); btns.push(null); continue; }
          const b = F.h('<button style="aspect-ratio:1;min-width:0;padding:0;min-height:40px;border:2.5px solid var(--ink-faint);border-radius:50%;cursor:pointer;background:var(--paper-2);color:var(--ink)"></button>');
          b.onclick = () => tap(idx(x, y));
          board.appendChild(b); btns.push(b);
        }
        const bar = F.h('<div style="display:flex;gap:8px;justify-content:center;flex-wrap:wrap;margin-top:4px"></div>');
        const mk = (label, fn) => { const b = F.h(`<button class="btn small">${label}</button>`); b.onclick = fn; bar.appendChild(b); return b; };
        const undoBtn = mk('↩ ' + F.tt({ de: 'Zurück', en: 'Undo' }), () => { if (done || !hist.length) return; grid = hist.pop(); sel = -1; ctx.sfx('tick'); draw(); });
        mk('⟲ ' + F.tt({ de: 'Neu starten', en: 'Restart' }), () => { if (done) return; grid = start.slice(); hist.length = 0; sel = -1; resets++; draw(); });
        const skipBtn = mk('⏭ ' + F.tt({ de: 'Aufgeben', en: 'Give up' }), () => finishRound(false));
        const pegsLeft = () => grid.reduce((a, b) => a + b, 0);
        const targets = (i) => {
          const x = i % N, y = Math.floor(i / N), out = [];
          DIRS.forEach(([dx, dy]) => {
            const bx = x + dx, by = y + dy, ax = x + 2 * dx, ay = y + 2 * dy;
            if (inCross(ax, ay) && grid[idx(bx, by)] && !grid[idx(ax, ay)]) out.push({ to: idx(ax, ay), over: idx(bx, by) });
          });
          return out;
        };
        const anyMove = () => grid.some((v, i) => v && targets(i).length);
        function draw() {
          const tg = sel >= 0 ? targets(sel).map((t) => t.to) : [];
          btns.forEach((b, i) => {
            if (!b) return;
            b.style.background = grid[i] ? (i === sel ? 'var(--accent)' : 'var(--c-spatial)') : 'var(--paper-2)';
            b.style.borderColor = grid[i] ? 'var(--ink)' : tg.includes(i) ? 'var(--accent)' : 'var(--ink-faint)';
            b.style.borderStyle = grid[i] ? 'solid' : 'dashed';
            b.style.boxShadow = grid[i] ? 'var(--shadow)' : tg.includes(i) ? '0 0 0 4px var(--accent)' : 'none';
            b.setAttribute('aria-label', grid[i] ? 'peg' : 'hole');
          });
          const left = pegsLeft();
          info.textContent = F.tt({ de: `Steine: ${left}`, en: `Pegs: ${left}` }) + (!done && left > 1 && !anyMove() ? F.tt({ de: ' · Keine Züge mehr – Zurück oder Neu starten', en: ' · No moves left – Undo or Restart' }) : '');
          undoBtn.disabled = done || !hist.length;
        }
        function tap(i) {
          if (done) return;
          if (grid[i]) { sel = sel === i ? -1 : i; ctx.sfx('tick'); draw(); return; }
          const t = sel >= 0 && targets(sel).find((m) => m.to === i);
          if (!t) { sel = -1; draw(); return; }
          hist.push(grid.slice());
          grid[sel] = 0; grid[t.over] = 0; grid[i] = 1;
          sel = -1;
          ctx.sfx('tick');
          draw();
          if (pegsLeft() === 1) finishRound(true);
        }
        async function finishRound(win) {
          if (done) return;
          done = true;
          draw();
          if (win) {
            solved++;
            points += resets ? 7 : 10;
            ctx.sfx('good');
            info.textContent = F.tt({ de: 'Geschafft! 🎉', en: 'Solved! 🎉' });
          } else {
            points += Math.round(3 * (puz.pegs - pegsLeft()) / Math.max(1, puz.pegs - 1));
            ctx.sfx('bad');
            info.textContent = F.tt({ de: 'Weiter zum nächsten Rätsel', en: 'On to the next puzzle' });
          }
          ctx.setScore(points);
          await ctx.wait(1100);
          next();
        }
        ctx.el.appendChild(info);
        ctx.el.appendChild(board);
        ctx.el.appendChild(bar);
        draw();
      }
      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${solved}/${ROUNDS} gelöst`, en: `${solved}/${ROUNDS} solved` }),
          levelDelta: solved === ROUNDS ? 1 : solved === 0 ? -1 : 0,
          quality: Math.min(1, points / 30), ink: 3 + Math.round(points / 3),
        });
      }
      next();
    },
  });
})();
