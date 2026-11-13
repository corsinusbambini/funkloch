/* Calcudoku (Rechen-Gitter): fill the grid with 1..N, no repeats in rows or columns, and make every cage hit its target. */
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

  // Doodle above the board: four tilted chips with the operations, drawn as strokes, plus a pencil.
  function motif() {
    const ink = 'stroke="var(--ink)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
    const chip = (x, rot, fill, sym) => `<g transform="translate(${x} 28) rotate(${rot})">
      <path d="M-19 -17 Q0 -19.5 19 -17 Q21 0 19 17 Q0 19.5 -19 17 Q-21 0 -19 -17Z" fill="var(${fill})" ${ink}/>
      <path d="M-13 -11 Q-8 -14 -2 -13.5" fill="none" stroke="var(--card)" stroke-width="2.5" stroke-linecap="round" opacity=".8"/>
      ${sym}</g>`;
    const plus = `<path d="M-8 0H8M0 -8V8" fill="none" ${ink}/>`;
    const minus = `<path d="M-8 0H8" fill="none" ${ink}/>`;
    const times = `<path d="M-6.5 -6.5L6.5 6.5M6.5 -6.5L-6.5 6.5" fill="none" ${ink}/>`;
    const div = `<path d="M-8 0H8" fill="none" ${ink}/><circle cx="0" cy="-7" r="2.2" fill="var(--ink)"/><circle cx="0" cy="7" r="2.2" fill="var(--ink)"/>`;
    return F.h(`<svg class="motif" viewBox="0 0 300 58" width="320" height="62" aria-hidden="true" style="margin:0 auto 6px">
      ${chip(40, -6, '--c-math', plus)}${chip(92, 4, '--c-fun', minus)}${chip(144, -3, '--c-focus', times)}${chip(196, 5, '--c-spatial', div)}
      <g transform="translate(252 30) rotate(-32)">
        <path d="M-30 -6 L18 -6 L30 0 L18 6 L-30 6 Z" fill="var(--c-math)" ${ink}/>
        <path d="M18 -6 L18 6 M-22 -6 L-22 6" fill="none" ${ink}/>
        <path d="M30 0 L25 -2.4 L25 2.4Z" fill="var(--ink)"/>
      </g></svg>`);
  }

  F.registerGame({
    id: 'kenken', skill: 'math', added: '2026-11-04', glyph: '3×+',
    name: { de: 'Rechen-Gitter', en: 'Calcudoku' },
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
        const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${n},minmax(0,1fr));gap:0;max-width:340px;margin:8px auto 16px;border:3.5px solid var(--ink);border-radius:12px;overflow:hidden;box-shadow:var(--shadow)"></div>`);
        const pad = F.h(`<div style="display:grid;grid-template-columns:repeat(${n + 1},minmax(0,1fr));gap:10px;max-width:340px;margin:0 auto"></div>`);
        ctx.el.appendChild(motif()); ctx.el.appendChild(msg); ctx.el.appendChild(board); ctx.el.appendChild(pad);
        let popAt = -1;
        const shake = () => { board.classList.remove('flash-bad'); void board.offsetWidth; board.classList.add('flash-bad'); };
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
            const b = F.h(`<button style="position:relative;min-width:0;padding:0;aspect-ratio:1;font-size:${n === 3 ? 44 : 38}px;font-family:inherit;cursor:pointer;color:${bad.has(y * n + x) ? 'var(--bad)' : 'var(--ink)'};background:${isSel ? 'var(--c-focus)' : 'var(--card)'};${isSel ? 'box-shadow:inset 0 0 0 3px var(--accent);' : ''}border-top:${bw(0, -1)};border-bottom:${bw(0, 1)};border-left:${bw(-1, 0)};border-right:${bw(1, 0)};border-radius:0"><span style="display:inline-block;padding-top:12px">${v[y][x] || ''}</span>${first ? `<span style="position:absolute;top:3px;left:5px;font-size:18px;line-height:1;color:var(--ink);white-space:nowrap">${c.target}${c.op === '=' ? '' : c.op}</span>` : ''}</button>`);
            b.onclick = () => { if (done) return; sel = [x, y]; ctx.sfx('tap'); render(); };
            board.appendChild(b);
            if (popAt === y * n + x && v[y][x]) b.firstElementChild.classList.add('tap-pop');
          }
          popAt = -1;
        }
        for (let k = 1; k <= n + 1; k++) {
          const label = k <= n ? String(k) : '⌫';
          const b = F.h(`<button class="btn" style="min-width:0;padding:0;min-height:82px;font-size:34px;background:var(--c-math);color:var(--ink)">${label}</button>`);
          b.onclick = () => {
            if (done) return;
            if (!sel) { msg.textContent = F.tt({ de: 'Tippe zuerst ein Feld.', en: 'Tap a cell first.' }); return; }
            v[sel[1]][sel[0]] = k <= n ? k : 0;
            popAt = sel[1] * n + sel[0];
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
            if (round < ROUNDS) F.cheer(8);
            await ctx.wait(1000); next();
          } else {
            errors++; ctx.sfx('bad'); shake();
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
