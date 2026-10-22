/* Lights Out: tapping a lamp flips it and its four neighbours. Switch all lamps off. */
(function () {
  const F = Funkloch;

  function press(g, size, x, y) {
    [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
      const a = x + dx, b = y + dy;
      if (a >= 0 && a < size && b >= 0 && b < size) g[b * size + a] ^= 1;
    });
  }

  // Scramble by pressing distinct cells from the solved board, so it is always solvable.
  function makePuzzle(r, size, presses) {
    for (let t = 0; t < 30; t++) {
      const g = Array(size * size).fill(0);
      const cells = r.shuffle(Array.from({ length: size * size }, (_, i) => i)).slice(0, presses);
      cells.forEach((c) => press(g, size, c % size, Math.floor(c / size)));
      if (g.some(Boolean)) return { grid: g, par: presses, cells };
    }
    const g = Array(size * size).fill(0); press(g, size, 0, 0);
    return { grid: g, par: 1, cells: [0] };
  }

  F.registerGame({
    id: 'lights-out', skill: 'logic', added: '2026-10-20', glyph: '💡',
    name: { de: 'Lichter aus', en: 'Lights Out' },
    desc: { de: 'Ein Tipp schaltet die Lampe und ihre vier Nachbarn um. Mach alle Lampen aus – mit möglichst wenigen Tipps. Steckst du fest, zeigt dir 🔍 ein Feld (kostet 2 Punkte). 5 Rätsel.', en: 'A tap flips the lamp and its four neighbours. Turn every lamp off using as few taps as you can. Stuck? 🔍 shows you a lamp to tap (costs 2 points). 5 puzzles.' },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 5;
      let round = 0, points = 0, solved = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const size = ctx.level >= 6 ? 5 : ctx.level >= 3 ? 4 : 3;
        const presses = Math.min(size * size - 2, 2 + Math.floor(ctx.level / 2) + round);
        const puz = ctx.fresh(() => makePuzzle(r, size, presses), (p) => p.grid.join(''));
        const grid = puz.grid.slice();
        // need[i] = 1 if lamp i still has to be tapped (an odd number of times) to clear the board.
        const need = Array(size * size).fill(0);
        puz.cells.forEach((c) => { need[c] = 1; });
        let moves = 0, hints = 0, hinted = -1, done = false;
        ctx.el.innerHTML = '';
        const info = F.h(`<div class="info-line"></div>`);
        const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${size},1fr);gap:8px;max-width:340px;margin:12px auto"></div>`);
        const btns = grid.map((_, i) => {
          const b = F.h(`<button style="aspect-ratio:1;min-height:56px;border:2.5px solid var(--ink);border-radius:14px;font-size:26px;cursor:pointer;box-shadow:var(--shadow);color:var(--ink)"></button>`);
          b.onclick = () => tap(i);
          board.appendChild(b);
          return b;
        });
        const hintBtn = F.h(`<button class="btn small" style="display:block;margin:4px auto">🔍 ${F.tt({ de: 'Hinweis (−2)', en: 'Hint (−2)' })}</button>`);
        hintBtn.onclick = () => {
          if (done || hinted >= 0) return;
          const todo = need.map((v, i) => (v ? i : -1)).filter((i) => i >= 0);
          if (!todo.length) return;
          hinted = r.pick(todo);
          hints++;
          ctx.sfx('tick');
          draw();
        };
        function draw() {
          btns.forEach((b, i) => {
            b.style.background = grid[i] ? 'var(--c-math)' : 'var(--card)';
            b.textContent = grid[i] ? '💡' : '';
            b.style.outline = i === hinted ? '4px dashed var(--accent)' : '';
            b.style.outlineOffset = i === hinted ? '3px' : '';
          });
          info.textContent = F.tt({ de: `Tipps: ${moves}`, en: `Taps: ${moves}` }) + (hints ? F.tt({ de: ` · Hinweise: ${hints}`, en: ` · Hints: ${hints}` }) : '');
          hintBtn.disabled = done || hinted >= 0;
        }
        async function tap(i) {
          if (done) return;
          moves++;
          need[i] ^= 1;
          if (i === hinted) hinted = -1;
          press(grid, size, i % size, Math.floor(i / size));
          ctx.sfx('tick');
          draw();
          if (grid.some(Boolean)) return;
          done = true; solved++;
          draw();
          points += Math.max(2, 10 - Math.max(0, moves - puz.par) - hints * 2);
          ctx.setScore(points);
          ctx.sfx('good');
          await ctx.wait(900);
          next();
        }
        ctx.el.appendChild(info);
        ctx.el.appendChild(board);
        ctx.el.appendChild(hintBtn);
        draw();
      }
      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${solved}/${ROUNDS} gelöst`, en: `${solved}/${ROUNDS} solved` }),
          levelDelta: points >= 40 ? 1 : points < 25 ? -1 : 0,
          quality: Math.min(1, points / 50), ink: 3 + Math.round(points / 3),
        });
      }
      next();
    },
  });
})();
