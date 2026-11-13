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
        // Status: pegs left (the goal is 1), drawn as a big counter with a peg.
        const stat = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:2px 0 6px"></div>');
        const peg = (fill, cls = '') => `<svg viewBox="0 0 40 40" class="${cls}" style="width:78%;height:78%;display:block;transform-origin:center"><circle cx="21" cy="23" r="14" style="fill:var(--ink);opacity:.3"/><circle cx="20" cy="20" r="14" style="fill:${fill};stroke:var(--ink)" stroke-width="2.5"/><path d="M12,17 C13,12 16,10 20,9.5" style="fill:none;stroke:#FFFFFF;opacity:.75" stroke-width="3" stroke-linecap="round"/></svg>`;
        const leftCard = F.h(`<div class="card sketch" style="padding:4px 10px;display:flex;align-items:center;justify-content:center;gap:10px"><span style="width:40px;height:40px;display:flex;align-items:center;justify-content:center">${peg('var(--c-spatial)')}</span><span style="font-size:17px;color:var(--ink-soft)">${F.tt({ de: 'Steine', en: 'Pegs' })}</span><b style="font-size:34px;font-weight:normal;line-height:1.15">0</b></div>`);
        const goalCard = F.h(`<div class="card sketch alt" style="padding:4px 10px;display:flex;align-items:center;justify-content:center;gap:10px"><span style="font-size:17px;color:var(--ink-soft)">${F.tt({ de: 'Ziel', en: 'Goal' })}</span><b style="font-size:34px;font-weight:normal;line-height:1.15">1</b></div>`);
        stat.append(leftCard, goalCard);
        const leftEl = leftCard.querySelector('b');
        const info = F.h('<div class="info-line" style="text-align:center;min-height:26px"></div>');
        // Cross-shaped wooden board: cells touch, only the outer edge gets an ink line.
        const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${N},minmax(0,1fr));gap:0;margin:4px 0 0;touch-action:manipulation"></div>`);
        const btns = [];
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          if (!inCross(x, y)) { board.appendChild(F.h('<div></div>')); btns.push(null); continue; }
          const b = F.h('<button style="aspect-ratio:1;min-width:0;padding:0;border:0 solid var(--ink);border-radius:0;cursor:pointer;background:var(--c-memory);color:var(--ink);display:flex;align-items:center;justify-content:center"></button>');
          const t = !inCross(x, y - 1), bt = !inCross(x, y + 1), l = !inCross(x - 1, y), rr = !inCross(x + 1, y);
          b.style.borderWidth = `${t ? 3 : 0}px ${rr ? 3 : 0}px ${bt ? 3 : 0}px ${l ? 3 : 0}px`;
          b.style.borderRadius = `${t && l ? 14 : 0}px ${t && rr ? 16 : 0}px ${bt && rr ? 13 : 0}px ${bt && l ? 15 : 0}px`;
          b.onclick = () => tap(idx(x, y));
          board.appendChild(b); btns.push(b);
        }
        const bar = F.h('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px"></div>');
        const mk = (label, fn) => { const b = F.h(`<button class="btn" style="min-height:56px;padding:4px 6px;font-size:18px;line-height:1.1">${label}</button>`); b.onclick = fn; bar.appendChild(b); return b; };
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
        const holeSvg = (target) => `<svg viewBox="0 0 40 40" style="width:62%;height:62%;display:block">${target ? '<circle cx="20" cy="20" r="17" style="fill:none;stroke:var(--accent)" stroke-width="4" stroke-dasharray="6 4"/>' : ''}<ellipse cx="20" cy="20" rx="9" ry="8.5" style="fill:var(--paper-2);stroke:var(--ink)" stroke-width="2.2"/><path d="M13,18 C14,14 17,13 21,12.5" style="fill:none;stroke:var(--ink);opacity:.35" stroke-width="2.5" stroke-linecap="round"/></svg>`;
        let landed = -1;
        function draw() {
          const tg = sel >= 0 ? targets(sel).map((t) => t.to) : [];
          btns.forEach((b, i) => {
            if (!b) return;
            b.innerHTML = grid[i] ? peg(i === sel ? 'var(--accent)' : 'var(--c-spatial)', i === sel || i === landed ? 'tap-pop' : '') : holeSvg(tg.includes(i));
            b.setAttribute('aria-label', grid[i] ? 'peg' : 'hole');
          });
          landed = -1;
          const left = pegsLeft();
          leftEl.textContent = left;
          info.textContent = !done && left > 1 && !anyMove() ? F.tt({ de: 'Keine Züge mehr – Zurück oder Neu starten', en: 'No moves left – Undo or Restart' }) : '';
          undoBtn.disabled = done || !hist.length;
        }
        function tap(i) {
          if (done) return;
          if (grid[i]) { sel = sel === i ? -1 : i; ctx.sfx('tick'); draw(); return; }
          const t = sel >= 0 && targets(sel).find((m) => m.to === i);
          if (!t) { sel = -1; draw(); return; }
          hist.push(grid.slice());
          grid[sel] = 0; grid[t.over] = 0; grid[i] = 1; landed = i;
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
            if (round < ROUNDS) F.cheer(8);
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
        ctx.el.appendChild(stat);
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
