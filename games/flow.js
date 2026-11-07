/* Flow: connect each pair of same-coloured dots with a line. Lines may not cross and the whole grid must be filled. */
(function () {
  const F = Funkloch;
  const COLORS = ['#E8574F', '#4A90D9', '#4FB36B', '#F2B84B', '#A06BD6', '#F28C6B', '#35B3B0', '#E26FA6', '#8A6A4A', '#7A8A9A'];
  const LETTERS = 'ABCDEFGHIJ';
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

  // Build a solved grid: split it into paths that cover every cell (each path has >= 2 cells).
  function make(r, n) {
    for (let t = 0; t < 80; t++) {
      const own = Array.from({ length: n }, () => new Array(n).fill(-1));
      const paths = [];
      const nb = (x, y) => DIRS.map((d) => [x + d[0], y + d[1]]).filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n);
      for (const idx of r.shuffle([...Array(n * n).keys()])) {
        const sx = idx % n, sy = Math.floor(idx / n);
        if (own[sy][sx] >= 0) continue;
        const want = r.int(3, n + 3), path = [[sx, sy]];
        own[sy][sx] = paths.length;
        while (path.length < want) {
          const [cx, cy] = path[path.length - 1];
          const opts = nb(cx, cy).filter(([a, b]) => own[b][a] < 0);
          if (!opts.length) break;
          const [a, b] = opts[r.int(0, opts.length - 1)];
          own[b][a] = paths.length; path.push([a, b]);
        }
        paths.push(path);
      }
      // attach one-cell paths to a neighbouring path end, or pair them up
      let ok = true;
      for (let pass = 0; pass < 6; pass++) {
        for (let i = 0; i < paths.length; i++) {
          if (!paths[i] || paths[i].length !== 1) continue;
          const [x, y] = paths[i][0];
          let done = false;
          for (const [a, b] of r.shuffle(nb(x, y))) {
            const j = own[b][a], pj = paths[j];
            if (j === i || !pj) continue;
            const head = pj[0], tail = pj[pj.length - 1];
            if (pj.length === 1) { pj.push([x, y]); own[y][x] = j; paths[i] = null; done = true; break; }
            if (head[0] === a && head[1] === b) { pj.unshift([x, y]); own[y][x] = j; paths[i] = null; done = true; break; }
            if (tail[0] === a && tail[1] === b) { pj.push([x, y]); own[y][x] = j; paths[i] = null; done = true; break; }
          }
          if (!done && pass === 5) ok = false;
        }
      }
      const real = paths.filter(Boolean);
      if (!ok || real.some((p) => p.length < 2) || real.length < n - 1 || real.length > COLORS.length) continue;
      return { n, paths: real };
    }
    // fallback: every row is one path
    const paths = [];
    for (let y = 0; y < n; y++) paths.push([...Array(n).keys()].map((x) => [x, y]));
    return { n, paths };
  }

  F.registerGame({
    id: 'flow', skill: 'spatial', added: '2026-11-07', glyph: '〰️',
    name: { de: 'Verbinde die Punkte', en: 'Flow' },
    desc: {
      de: 'Verbinde jedes Paar gleichfarbiger Punkte mit einer Linie. Ziehe mit dem Finger von einem Punkt zum anderen. Linien dürfen sich nicht kreuzen, und am Ende muss jedes Feld gefüllt sein. Löse 2 Rätsel.',
      en: 'Connect every pair of same-coloured dots with a line. Drag your finger from one dot to its partner. Lines may not cross, and in the end every square must be filled. Solve 2 puzzles.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 2;
      const n = ctx.level >= 6 ? 7 : ctx.level >= 3 ? 6 : 5;
      let round = 0, solved = 0, over = false;
      function next() {
        if (over) return;
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(solved * 10); ctx.setInfo(`${round} / ${ROUNDS}`);
        const q = ctx.fresh(() => make(r, n), (x) => JSON.stringify(x.paths));
        const ends = q.paths.map((p) => [p[0], p[p.length - 1]]);
        const owner = Array.from({ length: n }, () => new Array(n).fill(-1)); // colour drawn on a cell
        const endAt = Array.from({ length: n }, () => new Array(n).fill(-1)); // colour whose dot sits on a cell
        ends.forEach((e, c) => e.forEach(([x, y]) => { endAt[y][x] = c; owner[y][x] = c; }));
        const lines = ends.map(() => []); // drawn cells per colour
        let cur = -1, done = false;
        ctx.el.innerHTML = '';
        const msg = F.h('<div class="info-line" style="text-align:center;min-height:26px"></div>');
        const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${n},minmax(0,1fr));gap:3px;max-width:${n * 58}px;margin:10px auto;padding:4px;border:3px solid var(--ink);border-radius:12px;background:var(--ink-faint);box-shadow:var(--shadow);touch-action:none;user-select:none;-webkit-user-select:none"></div>`);
        const reset = F.h(`<button style="display:block;margin:6px auto;min-height:48px;padding:0 22px;font-size:20px;font-family:inherit;border:3px solid var(--ink);border-radius:14px;background:var(--card);color:var(--ink);cursor:pointer;box-shadow:var(--shadow)">${F.tt({ de: 'Neu starten', en: 'Restart' })}</button>`);
        ctx.el.appendChild(msg); ctx.el.appendChild(board); ctx.el.appendChild(reset);
        const cells = [];
        for (let i = 0; i < n * n; i++) {
          const d = F.h('<div style="position:relative;aspect-ratio:1;min-width:0;border-radius:8px;background:var(--card);overflow:hidden"></div>');
          board.appendChild(d); cells.push(d);
        }
        msg.textContent = F.tt({ de: 'Zieh von einem Punkt zum gleichfarbigen.', en: 'Drag from a dot to the matching one.' });

        const complete = (c) => {
          const l = lines[c];
          if (l.length < 2) return false;
          const a = l[0], b = l[l.length - 1];
          return endAt[a[1]][a[0]] === c && endAt[b[1]][b[0]] === c && (a[0] !== b[0] || a[1] !== b[1]);
        };
        function render() {
          for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
            const c = owner[y][x], e = endAt[y][x];
            const d = cells[y * n + x];
            d.innerHTML = (c >= 0 ? `<div style="position:absolute;inset:${e >= 0 ? 0 : 0}px;background:${COLORS[c]};opacity:${e >= 0 ? 0.35 : 0.8}"></div>` : '')
              + (e >= 0 ? `<div style="position:absolute;inset:16%;border-radius:50%;background:${COLORS[e]};border:2px solid var(--ink);display:flex;align-items:center;justify-content:center;font-size:14px;color:#fff;text-shadow:0 0 2px #000">${LETTERS[e]}</div>` : '');
          }
        }
        function cut(c, idx) { // keep the first idx cells of colour c
          const l = lines[c];
          while (l.length > idx) { const [x, y] = l.pop(); if (endAt[y][x] < 0) owner[y][x] = -1; }
        }
        function cellAt(e) {
          const rc = board.getBoundingClientRect();
          if (!rc.width) return null;
          const x = Math.floor((e.clientX - rc.left) / rc.width * n), y = Math.floor((e.clientY - rc.top) / rc.height * n);
          return x < 0 || y < 0 || x >= n || y >= n ? null : [x, y];
        }
        function press([x, y]) {
          const e = endAt[y][x];
          if (e >= 0) { cut(e, 0); lines[e].push([x, y]); cur = e; }
          else if (owner[y][x] >= 0) {
            const c = owner[y][x], i = lines[c].findIndex((p) => p[0] === x && p[1] === y);
            if (i < 0) return;
            cut(c, i + 1); cur = c;
          } else return;
          ctx.sfx('tap'); render();
        }
        function stepTo([x, y]) {
          if (cur < 0) return;
          const l = lines[cur], [lx, ly] = l[l.length - 1];
          if (Math.abs(lx - x) + Math.abs(ly - y) !== 1) return;
          const i = l.findIndex((p) => p[0] === x && p[1] === y);
          if (i >= 0) { cut(cur, i + 1); return; }
          if (complete(cur)) return; // already finished: only backing up is allowed
          const e = endAt[y][x];
          if (e >= 0 && e !== cur) return; // other colour's dot blocks
          if (e === cur && l.length < 2) return;
          const o = owner[y][x];
          if (o >= 0 && o !== cur) {
            const j = lines[o].findIndex((p) => p[0] === x && p[1] === y);
            if (j >= 0) cut(o, j);
          }
          l.push([x, y]); owner[y][x] = cur;
        }
        function move(e) {
          if (done || cur < 0) return;
          const target = cellAt(e);
          if (!target) return;
          for (let k = 0; k < 2 * n; k++) {
            const l = lines[cur], [lx, ly] = l[l.length - 1];
            if (lx === target[0] && ly === target[1]) break;
            const dx = target[0] - lx, dy = target[1] - ly;
            const horiz = Math.abs(dx) >= Math.abs(dy);
            stepTo(horiz ? [lx + Math.sign(dx), ly] : [lx, ly + Math.sign(dy)]);
            const nl = lines[cur][lines[cur].length - 1];
            if (nl[0] === lx && nl[1] === ly) break; // blocked: stay put
          }
          render();
        }
        async function release() {
          if (cur < 0) return;
          cur = -1;
          const all = owner.every((row) => row.every((v) => v >= 0)) && lines.every((_, c) => complete(c));
          const nDone = lines.filter((_, c) => complete(c)).length;
          if (all && !done) {
            done = true; solved++; ctx.sfx('good');
            msg.textContent = F.tt({ de: 'Gelöst!', en: 'Solved!' });
            await ctx.wait(1000); next();
          } else msg.textContent = F.tt({ de: `${nDone} von ${ends.length} verbunden`, en: `${nDone} of ${ends.length} connected` });
        }
        board.addEventListener('pointerdown', (e) => {
          if (done) return;
          e.preventDefault();
          try { board.setPointerCapture(e.pointerId); } catch (err) {}
          const c = cellAt(e); if (c) press(c);
        });
        board.addEventListener('pointermove', (e) => { if (cur >= 0) { e.preventDefault(); move(e); } });
        board.addEventListener('pointerup', release);
        board.addEventListener('pointercancel', release);
        reset.onclick = () => {
          if (done) return;
          cur = -1;
          lines.forEach((l, c) => cut(c, 0));
          ctx.sfx('tap'); render();
        };
        render();
      }
      function end() {
        ctx.finish({
          score: solved * 10, detail: F.tt({ de: `${solved}/${ROUNDS} gelöst`, en: `${solved}/${ROUNDS} solved` }),
          levelDelta: solved === ROUNDS ? 1 : -1,
          quality: solved / ROUNDS, ink: 3 + solved * 4,
        });
      }
      ctx.onCleanup(() => { over = true; });
      next();
    },
  });
})();
