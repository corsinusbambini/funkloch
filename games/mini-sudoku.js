/* Mini Sudoku: fill the 4×4 grid so every row, column and 2×2 box holds 1–4 exactly once. */
(function () {
  const F = Funkloch;

  function solvedGrid(r) {
    const band = r.shuffle([0, 1]), stack = r.shuffle([0, 1]);
    const rows = band.flatMap((b) => r.shuffle([0, 1]).map((x) => b * 2 + x));
    const cols = stack.flatMap((b) => r.shuffle([0, 1]).map((x) => b * 2 + x));
    const dig = r.shuffle([1, 2, 3, 4]);
    return rows.flatMap((ro) => cols.map((co) => dig[((ro % 2) * 2 + Math.floor(ro / 2) + co) % 4]));
  }

  const ok = (g, i, v) => {
    const y = Math.floor(i / 4), x = i % 4;
    for (let k = 0; k < 4; k++) if (g[y * 4 + k] === v || g[k * 4 + x] === v) return false;
    const by = y - (y % 2), bx = x - (x % 2);
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) if (g[(by + a) * 4 + bx + b] === v) return false;
    return true;
  };
  function countSolutions(g, limit) {
    const i = g.indexOf(0);
    if (i < 0) return 1;
    let n = 0;
    for (let v = 1; v <= 4 && n < limit; v++) if (ok(g, i, v)) { g[i] = v; n += countSolutions(g, limit - n); g[i] = 0; }
    return n;
  }

  // Returns { puzzle, solution } with a unique solution and about `blanks` empty cells.
  function makePuzzle(r, blanks) {
    const sol = solvedGrid(r), p = sol.slice();
    let removed = 0;
    for (const i of r.shuffle(Array.from({ length: 16 }, (_, k) => k))) {
      if (removed >= blanks) break;
      const keep = p[i]; p[i] = 0;
      if (countSolutions(p.slice(), 2) === 1) removed++; else p[i] = keep;
    }
    return { puzzle: p, solution: sol };
  }

  F.registerGame({
    id: 'mini-sudoku', skill: 'logic', added: '2026-10-21', glyph: '4️⃣',
    name: { de: 'Mini-Sudoku', en: 'Mini Sudoku' },
    desc: { de: 'Fülle das 4×4-Gitter: In jeder Zeile, Spalte und jedem 2×2-Kästchen steht jede Zahl 1–4 genau einmal. Tipp ein Feld, dann eine Zahl. Falsche Zahlen kosten Punkte. 4 Rätsel.', en: 'Fill the 4×4 grid: every row, column and 2×2 box holds each of 1–4 exactly once. Tap a cell, then a number. Wrong numbers cost points. 4 puzzles.' },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 4;
      let round = 0, points = 0, solved = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const blanks = Math.min(11, 5 + Math.floor(ctx.level / 2) + round);
        const pz = ctx.fresh(() => makePuzzle(r, blanks), (p) => p.puzzle.join(''));
        const g = pz.puzzle.slice(), given = pz.puzzle.map((v) => v !== 0);
        let sel = g.findIndex((v) => !v), mistakes = 0, done = false;
        ctx.el.innerHTML = '';
        // Status: two drawn counters, empty cells left (the goal is 0) and mistakes.
        const info = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:4px 0 10px"></div>');
        const box = (label) => {
          const el = F.h(`<div class="card sketch" style="padding:8px 10px;text-align:center;line-height:1.15"><div style="font-size:17px;color:var(--ink-soft)">${F.tt(label)}</div><b style="font-size:36px;font-weight:normal">0</b></div>`);
          info.appendChild(el);
          return el.querySelector('b');
        };
        const leftEl = box({ de: 'Leere Felder', en: 'Empty cells' }), badEl = box({ de: 'Fehler', en: 'Mistakes' });
        // The board: a drawn frame, the four 2×2 boxes split by wider gaps.
        const board = F.h('<div class="sketch" style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;padding:12px;background:var(--paper-2)"></div>');
        const btns = g.map((_, i) => {
          const b = F.h(`<button style="aspect-ratio:1;min-width:0;padding:0;border:2.5px solid var(--ink);border-radius:${12 + (i % 3) * 2}px ${16 - (i % 2) * 3}px ${13 + (i % 4)}px ${15 - (i % 3)}px;font-size:38px;line-height:1;cursor:pointer;color:var(--ink)"></button>`);
          const y = Math.floor(i / 4), x = i % 4;
          if (x === 1) b.style.marginRight = '8px';
          if (y === 1) b.style.marginBottom = '8px';
          b.onclick = () => { if (!done && !given[i]) { sel = i; ctx.sfx('tap'); draw(); } };
          board.appendChild(b);
          return b;
        });
        const pad = F.h('<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;width:100%;margin-top:14px"></div>');
        const padBtns = [1, 2, 3, 4].map((v) => {
          const b = F.h(`<button class="opt" style="min-width:0;min-height:76px;font-size:36px;padding:0">${v}</button>`);
          b.onclick = () => put(v, b);
          pad.appendChild(b);
          return b;
        });
        const pop = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
        function draw() {
          btns.forEach((b, i) => {
            b.textContent = g[i] || '';
            b.style.background = i === sel ? 'var(--c-logic)' : given[i] ? 'var(--dot)' : 'var(--card)';
            b.style.boxShadow = given[i] ? 'none' : 'var(--shadow)';
            b.style.fontWeight = given[i] ? '700' : '400';
            b.style.outline = i === sel ? '3px dashed var(--accent)' : '';
            b.style.outlineOffset = i === sel ? '2px' : '';
          });
          // A number that is already placed 4 times can't go anywhere else: grey its button out (it stays in place, so the row stays centred).
          padBtns.forEach((b, k) => { const full = g.filter((c) => c === k + 1).length >= 4; b.disabled = full; b.style.opacity = full ? '0.3' : ''; });
          leftEl.textContent = g.filter((c) => !c).length;
          badEl.textContent = mistakes;
          badEl.style.color = mistakes ? 'var(--bad)' : '';
        }
        async function put(v, btn) {
          if (done || sel < 0 || given[sel]) return;
          if (g[sel] === pz.solution[sel]) return;
          if (pz.solution[sel] !== v) {
            mistakes++; ctx.sfx('bad');
            btn.classList.add('wrong'); ctx.wait(400).then(() => btn.classList.remove('wrong'));
            pop(btns[sel], 'flash-bad');
            draw(); return;
          }
          g[sel] = v; ctx.sfx('tick');
          pop(btns[sel], 'tap-pop');
          const nx = g.findIndex((c, i) => !c && i !== sel);
          sel = nx;
          draw();
          if (g.some((c) => !c)) return;
          done = true; solved++;
          points += Math.max(2, 10 - mistakes * 2);
          ctx.setScore(points);
          ctx.sfx('good');
          board.classList.add('flash-ok');
          if (round < ROUNDS) F.cheer(8);
          await ctx.wait(900);
          next();
        }
        ctx.el.appendChild(info);
        ctx.el.appendChild(board);
        ctx.el.appendChild(pad);
        draw();
      }
      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${solved}/${ROUNDS} gelöst`, en: `${solved}/${ROUNDS} solved` }),
          levelDelta: points >= 32 ? 1 : points < 20 ? -1 : 0,
          quality: Math.min(1, points / 40), ink: 3 + Math.round(points / 3),
        });
      }
      next();
    },
  });
})();
