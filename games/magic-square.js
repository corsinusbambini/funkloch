/* Magic Square: fill the empty cells so every row, column and diagonal adds up to the magic sum. */
(function () {
  const F = Funkloch;
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];
  const LOSHU = [2, 7, 6, 9, 5, 1, 4, 3, 8];

  // the missing cells must be deducible line by line, so the puzzle has one solution
  function solvable(vals, blank, sum) {
    const known = vals.map((v, i) => (blank.has(i) ? null : v));
    let progress = true;
    while (progress) {
      progress = false;
      for (const L of LINES) {
        const unk = L.filter((i) => known[i] === null);
        if (unk.length === 1) { known[unk[0]] = sum - L.reduce((a, i) => a + (known[i] || 0), 0); progress = true; }
      }
    }
    return known.every((v) => v !== null);
  }

  function make(r, lvl) {
    const mul = lvl >= 4 ? r.int(1, 3) : 1, add = r.int(0, Math.min(40, 2 + lvl * 4));
    const t = r.int(0, 7);
    let sq = LOSHU.slice();
    for (let k = 0; k < t % 4; k++) sq = [6, 3, 0, 7, 4, 1, 8, 5, 2].map((i) => sq[i]); // rotate
    if (t >= 4) sq = [2, 1, 0, 5, 4, 3, 8, 7, 6].map((i) => sq[i]); // mirror
    const vals = sq.map((v) => v * mul + add);
    const sum = 15 * mul + 3 * add;
    const want = Math.min(6, 3 + Math.floor(lvl / 2));
    for (let tries = 0; tries < 60; tries++) {
      const blank = new Set(r.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]).slice(0, want));
      if (solvable(vals, blank, sum)) return { vals, sum, blank: [...blank] };
    }
    return { vals, sum, blank: [0, 1, 3] }; // fallback: 0 via the diagonal, then 1 and 3 via row/column
  }

  F.registerGame({
    id: 'magic-square', skill: 'math', added: '2026-10-30', glyph: '▦15',
    name: { de: 'Magisches Quadrat', en: 'Magic Square' },
    desc: {
      de: 'In einem 3×3-Quadrat fehlen einige Zahlen. Tippe ein leeres Feld und dann eine Zahl aus dem Vorrat. Gewonnen, wenn jede Zeile, Spalte und beide Diagonalen die magische Summe ergeben. 5 Quadrate.',
      en: 'Some numbers are missing from a 3×3 square. Tap an empty cell, then a number from the pool. You win a square when every row, column and both diagonals add up to the magic sum. 5 squares.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 5;
      let round = 0, solved = 0, points = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points); ctx.setInfo(`${round} / ${ROUNDS}`);
        const q = ctx.fresh(() => make(r, ctx.level), (x) => x.vals.join(','));
        const blank = new Set(q.blank);
        const put = new Array(9).fill(null);   // value placed in each blank cell
        const used = new Array(q.blank.length).fill(false); // pool chips used
        const poolVals = r.shuffle(q.blank.map((i) => q.vals[i]));
        let sel = -1, done = false, mistakes = 0;
        ctx.el.innerHTML = '';
        const sumEl = F.h(`<div class="card sketch big-display pop-in" style="font-size:26px">${F.tt({ de: 'Magische Summe', en: 'Magic sum' })}: <b style="color:var(--accent)">${q.sum}</b></div>`);
        const board = F.h('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-width:300px;margin:12px auto"></div>');
        const poolEl = F.h('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-width:300px;margin:8px auto"></div>');
        const msg = F.h('<div class="info-line" style="text-align:center;min-height:26px"></div>');
        ctx.el.appendChild(sumEl); ctx.el.appendChild(board); ctx.el.appendChild(msg); ctx.el.appendChild(poolEl);
        const cellStyle = 'min-width:0;padding:0;aspect-ratio:1;font-size:26px;border:3px solid var(--ink);border-radius:14px;color:var(--ink);box-shadow:var(--shadow);cursor:pointer;font-family:inherit';

        function render() {
          board.innerHTML = ''; poolEl.innerHTML = '';
          for (let i = 0; i < 9; i++) {
            const isBlank = blank.has(i);
            const v = isBlank ? put[i] : q.vals[i];
            const b = F.h(`<button style="${cellStyle};background:${isBlank ? (sel === i ? 'var(--accent)' : 'var(--card)') : 'var(--paper-2)'};${isBlank && v === null ? 'border-style:dashed;' : ''}">${v === null ? '' : v}</button>`);
            if (isBlank && !done) b.onclick = () => {
              if (put[i] !== null) { const k = poolIndexOf(put[i]); if (k >= 0) used[k] = false; put[i] = null; sel = i; }
              else sel = sel === i ? -1 : i;
              msg.textContent = ''; ctx.sfx('tap'); render();
            };
            board.appendChild(b);
          }
          poolVals.forEach((v, k) => {
            const b = F.h(`<button style="${cellStyle};aspect-ratio:auto;min-height:56px;font-size:24px;background:var(--c-math);${used[k] ? 'opacity:.25;' : ''}">${v}</button>`);
            b.onclick = () => {
              if (used[k] || done) return;
              if (sel < 0) { const free = q.blank.find((i) => put[i] === null); if (free === undefined) return; sel = free; }
              put[sel] = v; used[k] = true;
              const nextFree = q.blank.find((i) => put[i] === null);
              sel = nextFree === undefined ? -1 : nextFree;
              ctx.sfx('tap'); render(); check();
            };
            poolEl.appendChild(b);
          });
        }
        // chips can share a value, so look up the first used chip with that value
        function poolIndexOf(v) { return poolVals.findIndex((p, k) => p === v && used[k]); }
        async function check() {
          if (q.blank.some((i) => put[i] === null)) return;
          const full = q.vals.map((v, i) => (blank.has(i) ? put[i] : v));
          const ok = LINES.every((L) => L.reduce((a, i) => a + full[i], 0) === q.sum);
          if (ok) {
            done = true; solved++; points += Math.max(4, 10 - mistakes * 3);
            ctx.sfx('good'); msg.textContent = F.tt({ de: 'Magisch!', en: 'Magical!' }); render();
            await ctx.wait(900); next();
          } else {
            mistakes++; ctx.sfx('bad');
            msg.textContent = F.tt({ de: 'Nicht ganz – tippe ein Feld, um es zu ändern.', en: 'Not quite – tap a cell to change it.' });
          }
        }
        render();
      }
      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${solved}/${ROUNDS} gelöst`, en: `${solved}/${ROUNDS} solved` }),
          levelDelta: points >= 40 ? 1 : points < 20 ? -1 : 0,
          quality: Math.min(1, points / 50), ink: 3 + Math.round(points / 2),
        });
      }
      next();
    },
  });
})();
