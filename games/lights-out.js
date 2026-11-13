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
        // Status: two drawn counters, lamps still on (the goal is 0) and taps used.
        const info = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:4px 0 10px"></div>');
        const box = (label) => {
          const el = F.h(`<div class="card sketch" style="padding:8px 10px;text-align:center;line-height:1.15"><div style="font-size:17px;color:var(--ink-soft)">${F.tt(label)}</div><b style="font-size:36px;font-weight:normal">0</b></div>`);
          info.appendChild(el);
          return el.querySelector('b');
        };
        const onEl = box({ de: '💡 noch an', en: '💡 still on' }), tapsEl = box({ de: 'Tipps', en: 'Taps' });
        const board = F.h(`<div class="sketch" style="display:grid;grid-template-columns:repeat(${size},minmax(0,1fr));gap:10px;padding:14px;background:var(--paper-2)"></div>`);
        const btns = grid.map((_, i) => {
          const b = F.h(`<button style="aspect-ratio:1;min-width:0;padding:0;min-height:56px;border:2.5px solid var(--ink);border-radius:${14 + (i % 3)}px ${18 - (i % 4)}px ${13 + (i % 2) * 3}px ${17 - (i % 3)}px;cursor:pointer;box-shadow:var(--shadow);color:var(--ink);display:flex;align-items:center;justify-content:center"></button>`);
          b.onclick = () => tap(i);
          board.appendChild(b);
          return b;
        });
        // A doodled light bulb: lit with rays, or dark and faint.
        const bulb = (on) => `<svg viewBox="0 0 48 48" style="width:72%;height:72%;display:block" stroke-linecap="round" stroke-linejoin="round">
          ${on ? '<path d="M24,3 L24,7 M9,10 L12,13 M39,10 L36,13 M4,24 L8,24 M44,24 L40,24" style="stroke:var(--ink);fill:none" stroke-width="2.5"/>' : ''}
          <path d="M24,9 C14,9 10,17 12,24 C13,29 17,31 18,35 L30,35 C31,31 35,29 36,24 C38,17 34,9 24,9 Z" style="fill:${on ? '#FFF4B8' : 'var(--paper-2)'};stroke:${on ? '#2B2522' : 'var(--ink-faint)'}" stroke-width="2.5"/>
          ${on ? '<path d="M17,19 C18,15 20,14 22,13" style="stroke:#FFFFFF;fill:none" stroke-width="3"/><path d="M20,27 L22,23 L24,27 L26,23 L28,27" style="stroke:#E8742F;fill:none" stroke-width="2"/>' : ''}
          <path d="M18,37 L30,37 M19,41 L29,41 M21,45 L27,45" style="stroke:${on ? 'var(--ink)' : 'var(--ink-faint)'};fill:none" stroke-width="2.5"/></svg>`;
        const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };
        const hintBtn = F.h(`<button class="btn block" style="min-height:62px;margin-top:16px">🔍 ${F.tt({ de: 'Hinweis (−2)', en: 'Hint (−2)' })}</button>`);
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
            b.innerHTML = bulb(grid[i]);
            b.style.outline = i === hinted ? '4px dashed var(--accent)' : '';
            b.style.outlineOffset = i === hinted ? '3px' : '';
          });
          onEl.textContent = grid.reduce((a, v) => a + v, 0);
          tapsEl.textContent = moves + (hints ? ` · 🔍${hints}` : '');
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
          const x = i % size, y = Math.floor(i / size);
          [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
            const a = x + dx, c = y + dy;
            if (a >= 0 && a < size && c >= 0 && c < size) pop(btns[c * size + a]);
          });
          if (grid.some(Boolean)) return;
          done = true; solved++;
          draw();
          points += Math.max(2, 10 - Math.max(0, moves - puz.par) - hints * 2);
          ctx.setScore(points);
          ctx.sfx('good');
          board.classList.add('flash-ok');
          if (round < ROUNDS) F.cheer(8);
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
