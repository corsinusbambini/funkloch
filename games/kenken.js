/* KenKen: fill the grid with 1..N, no repeats in rows or columns, and make every cage hit its target. */
(function () {
  const F = Funkloch;

  function make(r, n, hard) {
    // Latin square from a shifted row pattern, then shuffled rows, columns and symbols
    const base = r.shuffle([...Array(n).keys()].map((i) => i + 1));
    let sq = [];
    for (let y = 0; y < n; y++) sq.push([...Array(n).keys()].map((x) => base[(x + y) % n]));
    sq = r.shuffle(sq);
    const cols = r.shuffle([...Array(n).keys()]);
    sq = sq.map((row) => cols.map((c) => row[c]));
    // cages: grow connected groups of 1-3 cells
    const cage = Array.from({ length: n }, () => new Array(n).fill(-1));
    const cages = [];
    for (const idx of r.shuffle([...Array(n * n).keys()])) {
      const sx = idx % n, sy = Math.floor(idx / n);
      if (cage[sy][sx] >= 0) continue;
      const roll = r.int(0, 9);
      const want = roll < 1 ? 1 : roll < 6 ? 2 : 3;
      const cells = [[sx, sy]];
      cage[sy][sx] = cages.length;
      for (let tries = 0; cells.length < want && tries < 12; tries++) {
        const [cx, cy] = cells[r.int(0, cells.length - 1)];
        const d = [[1, 0], [-1, 0], [0, 1], [0, -1]][r.int(0, 3)];
        const nx = cx + d[0], ny = cy + d[1];
        if (nx < 0 || ny < 0 || nx >= n || ny >= n || cage[ny][nx] >= 0) continue;
        cage[ny][nx] = cages.length; cells.push([nx, ny]);
      }
      cages.push({ cells });
    }
    for (const c of cages) {
      const vals = c.cells.map(([x, y]) => sq[y][x]);
      if (vals.length === 1) { c.op = '='; c.target = vals[0]; continue; }
      const mx = Math.max(...vals), mn = Math.min(...vals);
      const opts = ['+', '×'];
      if (vals.length === 2 && hard) { opts.push('−'); if (mx % mn === 0) opts.push('÷'); }
      c.op = opts[r.int(0, opts.length - 1)];
      c.target = c.op === '+' ? vals.reduce((a, b) => a + b, 0) : c.op === '×' ? vals.reduce((a, b) => a * b, 1) : c.op === '−' ? mx - mn : mx / mn;
    }
    return { n, cage, cages };
  }

  function cageOk(c, vals) {
    if (vals.some((v) => !v)) return null; // not complete
    if (c.op === '=') return vals[0] === c.target;
    if (c.op === '+') return vals.reduce((a, b) => a + b, 0) === c.target;
    if (c.op === '×') return vals.reduce((a, b) => a * b, 1) === c.target;
    const mx = Math.max(...vals), mn = Math.min(...vals);
    return c.op === '−' ? mx - mn === c.target : mx / mn === c.target;
  }

  F.registerGame({
    id: 'kenken', skill: 'math', added: '2026-11-04', glyph: '3×+',
    name: { de: 'KenKen', en: 'KenKen' },
    desc: {
      de: 'Fülle das Gitter mit den Zahlen von 1 bis N: keine Zahl doppelt in einer Zeile oder Spalte. Die Zahl in einem umrandeten Block ist das Ziel: Die Zahlen darin müssen es mit + − × ÷ ergeben. Löse 2 Rätsel.',
      en: 'Fill the grid with the numbers 1 to N: no repeats in any row or column. The small number in each outlined block is its target: the numbers inside must reach it with + − × ÷. Solve 2 puzzles.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 2;
      const n = ctx.level >= 3 ? 4 : 3, hard = ctx.level >= 2;
      let round = 0, solved = 0, errors = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(solved * 10); ctx.setInfo(`${round} / ${ROUNDS}`);
        const q = ctx.fresh(() => make(r, n, hard), (x) => JSON.stringify(x.cage) + x.cages.map((c) => c.op + c.target).join());
        const v = Array.from({ length: n }, () => new Array(n).fill(0));
        let sel = null, done = false;
        ctx.el.innerHTML = '';
        const msg = F.h('<div class="info-line" style="text-align:center;min-height:26px">' + F.tt({ de: 'Tippe ein Feld, dann eine Zahl.', en: 'Tap a cell, then a number.' }) + '</div>');
        const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${n},minmax(0,1fr));gap:0;max-width:${n * 84}px;margin:10px auto;border:3px solid var(--ink);border-radius:10px;overflow:hidden;box-shadow:var(--shadow)"></div>`);
        const pad = F.h(`<div style="display:grid;grid-template-columns:repeat(${n + 1},minmax(0,1fr));gap:8px;max-width:${(n + 1) * 70}px;margin:10px auto"></div>`);
        ctx.el.appendChild(msg); ctx.el.appendChild(board); ctx.el.appendChild(pad);
        const same = (x, y, dx, dy) => { const a = x + dx, b = y + dy; return a >= 0 && b >= 0 && a < n && b < n && q.cage[b][a] === q.cage[y][x]; };

        function conflicts() {
          const bad = new Set();
          for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            if (!v[y][x]) continue;
            for (let k = 0; k < n; k++) {
              if (k !== x && v[y][k] === v[y][x]) { bad.add(y * n + x); bad.add(y * n + k); }
              if (k !== y && v[k][x] === v[y][x]) { bad.add(y * n + x); bad.add(k * n + x); }
            }
          }
          return bad;
        }
        function render() {
          const bad = conflicts();
          board.innerHTML = '';
          for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            const ci = q.cage[y][x], c = q.cages[ci];
            const first = c.cells[0][0] === x && c.cells[0][1] === y;
            const bw = (dx, dy) => (same(x, y, dx, dy) ? '1px dotted var(--ink-faint)' : '3px solid var(--ink)');
            const isSel = sel && sel[0] === x && sel[1] === y;
            const b = F.h(`<button style="position:relative;min-width:0;padding:0;aspect-ratio:1;font-size:30px;font-family:inherit;cursor:pointer;color:${bad.has(y * n + x) ? 'var(--bad)' : 'var(--ink)'};background:${isSel ? 'var(--accent)' : 'var(--card)'};border-top:${bw(0, -1)};border-bottom:${bw(0, 1)};border-left:${bw(-1, 0)};border-right:${bw(1, 0)};border-radius:0">${first ? `<span style="position:absolute;top:2px;left:4px;font-size:14px;line-height:1;color:var(--ink)">${c.target}${c.op === '=' ? '' : c.op}</span>` : ''}${v[y][x] || ''}</button>`);
            b.onclick = () => { if (done) return; sel = [x, y]; ctx.sfx('tap'); render(); };
            board.appendChild(b);
          }
        }
        for (let k = 1; k <= n + 1; k++) {
          const label = k <= n ? String(k) : '⌫';
          const b = F.h(`<button style="min-width:0;padding:0;min-height:56px;font-size:26px;font-family:inherit;border:3px solid var(--ink);border-radius:14px;background:var(--c-math);color:var(--ink);cursor:pointer;box-shadow:var(--shadow)">${label}</button>`);
          b.onclick = () => {
            if (done) return;
            if (!sel) { msg.textContent = F.tt({ de: 'Tippe zuerst ein Feld.', en: 'Tap a cell first.' }); return; }
            v[sel[1]][sel[0]] = k <= n ? k : 0;
            ctx.sfx('tap'); render(); check();
          };
          pad.appendChild(b);
        }
        async function check() {
          if (v.some((row) => row.some((x) => !x))) return;
          const rowsOk = v.every((row) => new Set(row).size === n);
          const colsOk = [...Array(n).keys()].every((x) => new Set(v.map((row) => row[x])).size === n);
          const bad = q.cages.map((c) => cageOk(c, c.cells.map(([x, y]) => v[y][x])) === false);
          if (rowsOk && colsOk && !bad.some(Boolean)) {
            done = true; solved++; ctx.sfx('good');
            msg.textContent = F.tt({ de: 'Gelöst!', en: 'Solved!' }); sel = null; render();
            await ctx.wait(1000); next();
          } else {
            errors++; ctx.sfx('bad');
            const nb = bad.filter(Boolean).length;
            msg.textContent = nb ? F.tt({ de: `${nb} Block stimmt nicht.`, en: `${nb} block is off.` }) : F.tt({ de: 'Eine Zahl kommt doppelt vor.', en: 'A number repeats in a row or column.' });
          }
        }
        render();
      }
      function end() {
        const pts = Math.max(0, solved * 10 - Math.min(errors, 5));
        ctx.finish({
          score: pts, detail: F.tt({ de: `${solved}/${ROUNDS} gelöst`, en: `${solved}/${ROUNDS} solved` }),
          levelDelta: solved === ROUNDS && errors < 3 ? 1 : solved < ROUNDS ? -1 : 0,
          quality: solved / ROUNDS, ink: 3 + solved * 4,
        });
      }
      next();
    },
  });
})();
