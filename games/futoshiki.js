/* Futoshiki (inequality puzzle): fill the grid so no number repeats in a row or column and every < > sign is true. */
(function () {
  const F = Funkloch;
  const PUZZLES = 3;

  // Count solutions (stops at 2). cons: [{a, b}] meaning value[a] < value[b].
  function countSolutions(N, givens, cons) {
    const v = new Array(N * N).fill(0);
    const byCell = Array.from({ length: N * N }, () => []);
    cons.forEach((c) => { byCell[c.a].push(c); byCell[c.b].push(c); });
    let found = 0, steps = 0;
    function go(i) {
      if (found > 1 || steps++ > 60000) return;
      if (i === N * N) { found++; return; }
      const row = Math.floor(i / N), col = i % N;
      for (let d = 1; d <= N; d++) {
        if (givens[i] && givens[i] !== d) continue;
        let ok = true;
        for (let k = 0; k < col && ok; k++) if (v[row * N + k] === d) ok = false;
        for (let k = 0; k < row && ok; k++) if (v[k * N + col] === d) ok = false;
        if (!ok) continue;
        v[i] = d;
        for (const c of byCell[i]) {
          const x = v[c.a], y = v[c.b];
          if (x && y && x >= y) { ok = false; break; }
        }
        if (ok) go(i + 1);
        v[i] = 0;
      }
    }
    go(0);
    return found;
  }

  function makePuzzle(r, N, lvl) {
    const rows = r.shuffle([...Array(N).keys()]), cols = r.shuffle([...Array(N).keys()]);
    const sym = r.shuffle(Array.from({ length: N }, (_, i) => i + 1));
    const sol = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) sol.push(sym[(rows[i] + cols[j]) % N]);
    const pairs = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
      if (j < N - 1) pairs.push([i * N + j, i * N + j + 1]);
      if (i < N - 1) pairs.push([i * N + j, (i + 1) * N + j]);
    }
    const mk = ([p, q]) => (sol[p] < sol[q] ? { a: p, b: q } : { a: q, b: p });
    const shuffled = r.shuffle(pairs);
    let nCons = Math.round(pairs.length * (lvl >= 5 ? 0.3 : 0.4));
    const cons = shuffled.slice(0, nCons).map(mk);
    const givens = new Array(N * N).fill(0);
    r.shuffle([...Array(N * N).keys()]).slice(0, N === 4 ? 1 : 2).forEach((i) => { givens[i] = sol[i]; });
    let rest = shuffled.slice(nCons), cells = r.shuffle([...Array(N * N).keys()]);
    for (let t = 0; t < 80 && countSolutions(N, givens, cons) > 1; t++) {
      if (t % 3 === 2 && cells.length) { const i = cells.pop(); givens[i] = sol[i]; }
      else if (rest.length) cons.push(mk(rest.pop()));
      else if (cells.length) { const i = cells.pop(); givens[i] = sol[i]; }
    }
    return { N, sol, givens, cons };
  }

  // doodle sign between two cells: dir 'lt' (left < right), 'gt', 'up' (top < bottom), 'dn'
  const SIGN = {
    lt: 'M14,3 L6,11 L14,19', gt: 'M6,3 L14,11 L6,19',
    up: 'M3,14 L11,6 L19,14', dn: 'M3,6 L11,14 L19,6',
  };

  F.registerGame({
    id: 'futoshiki', skill: 'logic', added: '2026-11-15', glyph: '1<2',
    name: { de: 'Ungleichung', en: 'Futoshiki' },
    desc: {
      de: 'Fülle das Gitter mit Zahlen: In jeder Zeile und jeder Spalte kommt jede Zahl genau einmal vor. Die Zeichen < und > zwischen den Feldern zeigen, welche Zahl kleiner ist (die Spitze zeigt auf die kleinere). Tippe ein Feld, dann eine Zahl. Löse 3 Rätsel, möglichst ohne Fehler.',
      en: 'Fill the grid with numbers: every number appears exactly once in each row and each column. The signs < and > between cells tell which number is smaller (the point faces the smaller one). Tap a cell, then a number. Solve 3 puzzles, with as few mistakes as you can.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = ctx.level || 0;
      let round = 0, points = 0, mistakes = 0, solved = 0;
      const t0 = Date.now();

      function next() {
        if (round >= PUZZLES) return end();
        round++;
        const N = lvl >= 3 && round >= 2 ? 5 : 4;
        const pz = ctx.fresh(() => makePuzzle(r, N, lvl), (p) => p.sol.join('') + p.cons.length);
        const val = pz.givens.slice();
        let sel = -1, done = false, roundMistakes = 0;
        ctx.setScore(points); ctx.setInfo(`${round} / ${PUZZLES}`);
        ctx.el.innerHTML = '';

        const SZ = N === 4 ? 24 : 20;
        const cols = Array.from({ length: N }, () => `minmax(0,1fr)`).join(` ${SZ}px `);
        const rowsT = Array.from({ length: N }, () => 'auto').join(` ${SZ}px `);
        const grid = F.h(`<div style="display:grid;grid-template-columns:${cols};grid-template-rows:${rowsT};align-items:center;justify-items:center"></div>`);
        const board = F.h(`<div class="sketch pop-in" style="padding:16px 12px 18px;margin:8px 0 16px;background:var(--card);box-shadow:var(--shadow);transform:rotate(-0.5deg);position:relative"></div>`);
        board.appendChild(F.h(`<svg class="motif" viewBox="0 0 120 20" width="120" height="20" aria-hidden="true" style="margin:-8px auto 6px;color:var(--ink)"><path d="M6,12 q10,-9 20,0 t20,0 t20,0 t20,0 t20,0" fill="none" stroke="var(--ink-soft)" stroke-width="2.4" stroke-linecap="round"/><path d="M100,4 l10,10 l-2,3 l-10,-9 z" style="fill:var(--c-logic);stroke:var(--ink)" stroke-width="1.8" stroke-linejoin="round"/></svg>`));
        board.appendChild(grid);
        const cellEls = [], signEls = [];
        for (let i = 0; i < N; i++) {
          for (let j = 0; j < N; j++) {
            const idx = i * N + j;
            const b = F.h(`<button style="width:100%;min-width:0;padding:0;aspect-ratio:1;font-size:${N === 4 ? 34 : 30}px;line-height:1;border:2.5px solid var(--ink);border-radius:10px 14px 10px 12px;cursor:pointer;color:var(--ink)"></button>`);
            b.addEventListener('pointerdown', (e) => {
              e.preventDefault();
              if (done) return;
              ctx.sfx('tap');
              if (pz.givens[idx]) return;
              sel = idx; b.classList.remove('tap-pop'); void b.offsetWidth; b.classList.add('tap-pop');
              paint();
            });
            cellEls.push(b);
            grid.appendChild(b);
            if (j < N - 1) {
              const c = pz.cons.find((k) => (k.a === idx && k.b === idx + 1) || (k.a === idx + 1 && k.b === idx));
              const s = F.h(`<span style="display:block;width:${SZ}px;height:${SZ}px"></span>`);
              if (c) { s.innerHTML = `<svg viewBox="0 0 22 22" width="${SZ}" height="${SZ}" fill="none" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"><path d="${SIGN[c.a === idx ? 'lt' : 'gt']}" style="stroke:currentColor"/></svg>`; signEls.push({ s, c }); }
              grid.appendChild(s);
            }
          }
          if (i < N - 1) {
            for (let j = 0; j < N; j++) {
              const idx = i * N + j;
              const c = pz.cons.find((k) => (k.a === idx && k.b === idx + N) || (k.a === idx + N && k.b === idx));
              const s = F.h(`<span style="display:block;width:${SZ}px;height:${SZ}px"></span>`);
              if (c) { s.innerHTML = `<svg viewBox="0 0 22 22" width="${SZ}" height="${SZ}" fill="none" stroke-width="3.8" stroke-linecap="round" stroke-linejoin="round"><path d="${SIGN[c.a === idx ? 'up' : 'dn']}" style="stroke:currentColor"/></svg>`; signEls.push({ s, c }); }
              grid.appendChild(s);
              if (j < N - 1) grid.appendChild(F.h('<span></span>'));
            }
          }
        }

        function conflicts() {
          const bad = new Set(), badCons = new Set();
          for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) {
            const x = i * N + j; if (!val[x]) continue;
            for (let k = j + 1; k < N; k++) if (val[i * N + k] === val[x]) { bad.add(x); bad.add(i * N + k); }
            for (let k = i + 1; k < N; k++) if (val[k * N + j] === val[x]) { bad.add(x); bad.add(k * N + j); }
          }
          pz.cons.forEach((c) => { if (val[c.a] && val[c.b] && val[c.a] >= val[c.b]) { bad.add(c.a); bad.add(c.b); badCons.add(c); } });
          return { bad, badCons };
        }
        function paint() {
          const { bad, badCons } = conflicts();
          cellEls.forEach((b, i) => {
            b.textContent = val[i] || '';
            const g = pz.givens[i];
            b.style.background = i === sel ? 'var(--accent)' : bad.has(i) ? 'var(--bad)' : g ? 'var(--paper-2)' : 'var(--card)';
            b.style.fontWeight = g ? '700' : '400';
            b.style.color = bad.has(i) && i !== sel ? '#2a1f1f' : i === sel ? '#1b1b1b' : 'var(--ink)';
          });
          signEls.forEach(({ s, c }) => { s.style.color = badCons.has(c) ? 'var(--bad)' : 'var(--ink)'; });
        }

        const pad = F.h(`<div style="display:grid;grid-template-columns:repeat(${N + 1},minmax(0,1fr));gap:8px"></div>`);
        const msg = F.h('<div class="info-line" style="text-align:center;min-height:26px;margin-top:16px"></div>');
        function press(n) {
          if (done || sel < 0) { ctx.sfx('tick'); return; }
          const before = conflicts().bad.size;
          val[sel] = n;
          const { bad } = conflicts();
          if (n && bad.has(sel)) { mistakes++; roundMistakes++; ctx.sfx('bad'); cellEls[sel].classList.remove('flash-bad'); void cellEls[sel].offsetWidth; cellEls[sel].classList.add('flash-bad'); }
          else ctx.sfx('tap');
          paint();
          if (val.every((x) => x) && bad.size === 0) win();
        }
        for (let n = 1; n <= N; n++) {
          const b = F.h(`<button class="opt" style="min-width:0;padding:0;min-height:78px;font-size:30px">${n}</button>`);
          b.addEventListener('pointerdown', (e) => { e.preventDefault(); press(n); b.classList.remove('tap-pop'); void b.offsetWidth; b.classList.add('tap-pop'); });
          pad.appendChild(b);
        }
        const er = F.h(`<button class="opt" aria-label="erase" style="min-width:0;padding:0;min-height:78px;font-size:28px">⌫</button>`);
        er.addEventListener('pointerdown', (e) => { e.preventDefault(); press(0); });
        pad.appendChild(er);
        ctx.el.append(board, pad, msg);
        msg.textContent = F.tt({ de: 'Tippe ein Feld, dann eine Zahl', en: 'Tap a cell, then a number' });
        // select first empty cell to start
        sel = val.findIndex((x) => !x);
        paint();

        async function win() {
          done = true; solved++; sel = -1; paint();
          points += 15 + Math.max(0, 10 - roundMistakes * 3);
          ctx.setScore(points); ctx.sfx('win');
          board.classList.add('flash-ok');
          msg.textContent = F.tt({ de: 'Gelöst!', en: 'Solved!' });
          if (round < PUZZLES) F.cheer(8);
          await ctx.wait(1000);
          next();
        }
      }

      function end() {
        const secs = Math.round((Date.now() - t0) / 1000);
        const bonus = Math.max(0, 15 - Math.floor(secs / 20));
        const score = points + bonus;
        ctx.finish({
          score,
          detail: F.tt({ de: `${solved} Rätsel, ${mistakes} Fehler, ${secs} s`, en: `${solved} puzzles, ${mistakes} mistakes, ${secs} s` }),
          levelDelta: mistakes <= 2 ? 1 : mistakes > 8 ? -1 : 0,
          quality: Math.max(0.2, 1 - mistakes * 0.08), ink: 6 + Math.round(score / 5),
        });
      }
      next();
    },
  });
})();
