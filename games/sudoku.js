/* Sudoku: the classic 9×9. Every row, column and 3×3 box holds 1–9 exactly once. */
(function () {
  const F = Funkloch;

  function solvedGrid(r) {
    const grp = () => r.shuffle([0, 1, 2]).flatMap((b) => r.shuffle([0, 1, 2]).map((x) => b * 3 + x));
    const rows = grp(), cols = grp(), dig = r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    return rows.flatMap((ro) => cols.map((co) => dig[(3 * (ro % 3) + Math.floor(ro / 3) + co) % 9]));
  }

  // Counts solutions (stops at `limit`), always filling the cell with the fewest candidates first.
  function countSolutions(g, limit) {
    let best = -1, bestMask = 0, bestN = 10;
    for (let i = 0; i < 81; i++) {
      if (g[i]) continue;
      const y = Math.floor(i / 9), x = i % 9, by = y - (y % 3), bx = x - (x % 3);
      let used = 0;
      for (let k = 0; k < 9; k++) {
        used |= 1 << g[y * 9 + k]; used |= 1 << g[k * 9 + x];
        used |= 1 << g[(by + Math.floor(k / 3)) * 9 + bx + (k % 3)];
      }
      let n = 0;
      for (let v = 1; v <= 9; v++) if (!(used & (1 << v))) n++;
      if (n < bestN) { bestN = n; best = i; bestMask = used; if (n === 0) return 0; }
    }
    if (best < 0) return 1;
    let total = 0;
    for (let v = 1; v <= 9 && total < limit; v++) {
      if (bestMask & (1 << v)) continue;
      g[best] = v; total += countSolutions(g, limit - total); g[best] = 0;
    }
    return total;
  }

  // Returns { puzzle, solution } with exactly one solution and up to `blanks` empty cells.
  function makePuzzle(r, blanks) {
    const sol = solvedGrid(r), p = sol.slice();
    let removed = 0;
    for (const i of r.shuffle(Array.from({ length: 81 }, (_, k) => k))) {
      if (removed >= blanks) break;
      const keep = p[i]; p[i] = 0;
      if (countSolutions(p.slice(), 2) === 1) removed++; else p[i] = keep;
    }
    return { puzzle: p, solution: sol };
  }

  F.registerGame({
    id: 'sudoku', skill: 'logic', added: '2026-11-09', glyph: '9️⃣',
    name: { de: 'Sudoku', en: 'Sudoku' },
    desc: {
      de: 'Das Klassiker-Rätsel: In jeder Zeile, Spalte und jedem 3×3-Kästchen steht jede Zahl 1–9 genau einmal. Tipp ein Feld, dann eine Zahl. Falsche Zahlen kosten Punkte. Löse das Gitter, um zu gewinnen.',
      en: 'The classic puzzle: every row, column and 3×3 box holds each of 1–9 exactly once. Tap a cell, then a number. Wrong numbers cost points. Fill the whole grid to win.',
    },
    start(ctx) {
      const r = ctx.rng;
      const blanks = Math.min(52, 36 + Math.max(0, ctx.level) * 2);
      const pz = ctx.fresh(() => makePuzzle(r, blanks), (p) => p.puzzle.join(''));
      const g = pz.puzzle.slice(), given = pz.puzzle.map((v) => v !== 0);
      let sel = g.findIndex((v) => !v), mistakes = 0, done = false;
      ctx.setScore(0);
      ctx.el.innerHTML = '';
      // Status: two drawn counters, empty cells left and mistakes.
      const info = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:0 0 8px"></div>');
      const box = (label) => {
        const el = F.h(`<div class="card sketch" style="padding:4px 10px;display:flex;align-items:baseline;justify-content:center;gap:10px"><span style="font-size:17px;color:var(--ink-soft)">${F.tt(label)}</span><b style="font-size:30px;font-weight:normal;line-height:1.15">0</b></div>`);
        info.appendChild(el);
        return el.querySelector('b');
      };
      const leftEl = box({ de: 'Leer', en: 'Empty' }), badEl = box({ de: 'Fehler', en: 'Mistakes' });
      const board = F.h('<div style="display:grid;grid-template-columns:repeat(9,minmax(0,1fr));max-width:360px;margin:0 auto;border:3.5px solid var(--ink);border-radius:12px 6px 14px 8px;overflow:hidden;background:var(--ink);box-shadow:var(--shadow)"></div>');
      const btns = g.map((_, i) => {
        const y = Math.floor(i / 9), x = i % 9;
        const b = F.h('<button style="aspect-ratio:1;min-width:0;padding:0;border:0;border-radius:0;font-size:24px;line-height:1;cursor:pointer;color:var(--ink);background:var(--card)"></button>');
        b.style.marginRight = x === 8 ? '0' : x % 3 === 2 ? '2.5px' : '1px';
        b.style.marginBottom = y === 8 ? '0' : y % 3 === 2 ? '2.5px' : '1px';
        b.onclick = () => { if (!done) { sel = i; ctx.sfx('tap'); draw(); } };
        board.appendChild(b);
        return b;
      });
      // Number pad 3×3 like a phone keypad, so no lonely last row.
      const pad = F.h('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:12px"></div>');
      const padBtns = [1, 2, 3, 4, 5, 6, 7, 8, 9].map((v) => {
        const b = F.h(`<button class="opt" style="min-height:52px;min-width:0;padding:0;font-size:30px">${v}</button>`);
        b.onclick = () => put(v, b);
        pad.appendChild(b);
        return b;
      });
      const pop = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
      function draw() {
        const sy = sel >= 0 ? Math.floor(sel / 9) : -1, sx = sel >= 0 ? sel % 9 : -1, sv = sel >= 0 ? g[sel] : 0;
        btns.forEach((b, i) => {
          const y = Math.floor(i / 9), x = i % 9;
          b.textContent = g[i] || '';
          const same = sv && g[i] === sv;
          const peer = sel >= 0 && (y === sy || x === sx || (Math.floor(y / 3) === Math.floor(sy / 3) && Math.floor(x / 3) === Math.floor(sx / 3)));
          b.style.background = i === sel ? 'var(--c-logic, var(--c-math))' : same ? 'var(--c-fun)' : peer ? 'var(--paper-2, var(--card))' : 'var(--card)';
          b.style.fontWeight = given[i] ? '800' : '400';
          b.style.color = given[i] ? 'var(--ink)' : 'var(--ink-soft)';
        });
        padBtns.forEach((b, k) => { const full = g.filter((c) => c === k + 1).length >= 9; b.disabled = full; b.style.opacity = full ? '0.3' : ''; });
        leftEl.textContent = g.filter((c) => !c).length;
        badEl.textContent = mistakes;
        badEl.style.color = mistakes ? 'var(--bad)' : '';
      }
      function nextEmpty(from) {
        for (let k = 1; k <= 81; k++) { const i = (from + k) % 81; if (!g[i]) return i; }
        return -1;
      }
      async function put(v, btn) {
        if (done || sel < 0 || given[sel] || g[sel]) return;
        if (pz.solution[sel] !== v) {
          mistakes++; ctx.sfx('bad');
          btn.classList.add('wrong'); ctx.wait(400).then(() => btn.classList.remove('wrong'));
          pop(btns[sel], 'flash-bad');
          draw(); return;
        }
        g[sel] = v; ctx.sfx('tick');
        pop(btns[sel], 'tap-pop');
        sel = nextEmpty(sel);
        draw();
        if (g.some((c) => !c)) return;
        done = true;
        const pts = Math.max(10, 100 - mistakes * 10);
        ctx.setScore(pts);
        ctx.sfx('good');
        board.style.borderColor = 'var(--good)'; board.style.background = 'var(--good)';
        await ctx.wait(800);
        ctx.finish({
          score: pts, detail: F.tt({ de: `${mistakes} Fehler`, en: `${mistakes} mistakes` }),
          levelDelta: mistakes <= 1 ? 1 : mistakes >= 5 ? -1 : 0,
          quality: Math.max(0.3, 1 - mistakes * 0.12), ink: 8 + Math.round(pts / 10),
        });
      }
      ctx.el.append(info, board, pad);
      draw();
    },
  });
})();
