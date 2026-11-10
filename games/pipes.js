/* Pipes (Rohrleitung): rotate the pipe pieces so that water from the source reaches every piece. */
(function () {
  const F = Funkloch;
  const N = 1, E = 2, S = 4, W = 8;
  const DIRS = [[N, 0, -1], [E, 1, 0], [S, 0, 1], [W, -1, 0]];
  const opp = (d) => ((d << 2) | (d >> 2)) & 15;
  const rot = (m) => ((m << 1) | (m >> 3)) & 15;
  const rotN = (m, k) => { for (let i = 0; i < ((k % 4) + 4) % 4; i++) m = rot(m); return m; };

  // Random spanning tree over an n×n grid (randomised depth-first), result: bitmask per cell.
  function make(r, n) {
    const mask = new Array(n * n).fill(0), seen = new Array(n * n).fill(false);
    const act = [r.int(0, n * n - 1)];
    seen[act[0]] = true;
    for (let guard = 0; act.length && guard < n * n * 40; guard++) {
      const ai = r.chance(0.7) ? act.length - 1 : r.int(0, act.length - 1), c = act[ai];
      const cx = c % n, cy = Math.floor(c / n);
      const opts = DIRS.filter(([, dx, dy]) => {
        const x = cx + dx, y = cy + dy;
        return x >= 0 && y >= 0 && x < n && y < n && !seen[y * n + x];
      });
      if (!opts.length) { act.splice(ai, 1); continue; }
      const [d, dx, dy] = r.pick(opts), o = (cy + dy) * n + cx + dx;
      mask[c] |= d; mask[o] |= opp(d); seen[o] = true; act.push(o);
    }
    return mask;
  }

  function lit(mask, n, src) {
    const on = new Array(n * n).fill(false), q = [src];
    on[src] = true;
    while (q.length) {
      const c = q.pop(), cx = c % n, cy = Math.floor(c / n);
      for (const [d, dx, dy] of DIRS) {
        const x = cx + dx, y = cy + dy;
        if (!(mask[c] & d) || x < 0 || y < 0 || x >= n || y >= n) continue;
        const o = y * n + x;
        if (!on[o] && (mask[o] & opp(d))) { on[o] = true; q.push(o); }
      }
    }
    return on;
  }

  function puzzle(r, n) {
    const target = make(r, n), src = (n >> 1) * n + (n >> 1);
    let rots = target.map(() => r.int(0, 3));
    const cur = () => target.map((m, i) => rotN(m, rots[i]));
    for (let t = 0; t < 20 && lit(cur(), n, src).every(Boolean); t++) rots = target.map(() => r.int(0, 3));
    if (lit(cur(), n, src).every(Boolean)) { // bounded fallback: turn one asymmetric piece
      const i = target.findIndex((m) => m !== 15 && m !== 0);
      rots[i] = (rots[i] + 1) % 4;
      if (lit(cur(), n, src).every(Boolean)) rots[i] = (rots[i] + 1) % 4;
    }
    // fewest taps needed to reach the generated solution
    let best = 0;
    target.forEach((m, i) => {
      for (let t = 0; t < 4; t++) if (rotN(m, rots[i] + t) === m) { best += t; break; }
    });
    return { target, rots, src, best, key: target.join(',') + '|' + rots.join('') };
  }

  const pieceSVG = (m, isSrc) => {
    const seg = DIRS.filter(([d]) => m & d).map(([d]) => {
      const x = d === E ? 50 : d === W ? -50 : 0, y = d === S ? 50 : d === N ? -50 : 0;
      return `<path d="M0,0 L${x},${y}" />`;
    }).join('');
    return `<svg viewBox="-50 -50 100 100" style="width:100%;height:100%;display:block;overflow:visible"><g class="pp" fill="none" stroke="currentColor" stroke-width="22" stroke-linecap="butt">${seg}</g><circle r="17" fill="currentColor"/>${isSrc ? '<circle r="9" fill="var(--card)"/><circle r="4" fill="currentColor"/>' : ''}</svg>`;
  };

  F.registerGame({
    id: 'pipes', skill: 'spatial', added: '2026-11-10', glyph: '🚰',
    name: { de: 'Rohrleitung', en: 'Pipes' },
    desc: {
      de: 'Tippe auf ein Rohrstück, um es zu drehen. Das Wasser fliesst aus der Quelle in der Mitte. Verbinde alle Rohre, so dass jedes Stück Wasser bekommt (farbig leuchtet). Löse 3 Rätsel, weniger Tipps geben mehr Punkte.',
      en: 'Tap a pipe piece to turn it. Water flows out of the source in the middle. Connect all the pipes so that every piece gets water (it lights up in colour). Solve 3 puzzles, fewer taps earn more points.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 3;
      const n = ctx.level >= 6 ? 6 : ctx.level >= 3 ? 5 : 4;
      let round = 0, points = 0, extra = 0, over = false;
      ctx.onCleanup(() => { over = true; });
      function next() {
        if (over) return;
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points); ctx.setInfo(`${round} / ${ROUNDS}`);
        const q = ctx.fresh(() => puzzle(r, n), (x) => x.key);
        const rots = q.rots.slice(), spin = q.rots.slice();
        let taps = 0, locked = false;
        ctx.el.innerHTML = '';
        const msg = F.h(`<div class="info-line" style="text-align:center;min-height:26px"></div>`);
        const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${n},minmax(0,1fr));gap:3px;max-width:${n * 62}px;margin:10px auto;padding:4px;border:3px solid var(--ink);border-radius:12px;background:var(--ink-faint);box-shadow:var(--shadow);user-select:none;-webkit-user-select:none"></div>`);
        ctx.el.appendChild(msg); ctx.el.appendChild(board);
        const cells = q.target.map((m, i) => {
          const b = F.h(`<button style="aspect-ratio:1;min-width:0;padding:6px;border:0;border-radius:8px;background:var(--card);cursor:pointer;touch-action:manipulation">${pieceSVG(m, i === q.src)}</button>`);
          b.firstElementChild.style.transition = 'transform .18s';
          b.firstElementChild.style.transform = `rotate(${spin[i] * 90}deg)`;
          b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(i); });
          board.appendChild(b);
          return b;
        });
        function paint() {
          const on = lit(q.target.map((m, i) => rotN(m, rots[i])), n, q.src);
          cells.forEach((b, i) => { b.style.color = on[i] ? 'var(--accent)' : 'var(--ink-soft)'; b.style.background = on[i] ? 'var(--paper-2)' : 'var(--card)'; });
          const cnt = on.filter(Boolean).length;
          msg.textContent = F.tt({ de: `Mit Wasser: ${cnt} von ${n * n}`, en: `With water: ${cnt} of ${n * n}` });
          return cnt === n * n;
        }
        async function tap(i) {
          if (locked || over) return;
          rots[i] = (rots[i] + 1) % 4; spin[i]++; taps++;
          cells[i].firstElementChild.style.transform = `rotate(${spin[i] * 90}deg)`;
          ctx.sfx('tick');
          if (paint()) {
            locked = true;
            const over_ = Math.max(0, taps - q.best);
            extra += over_;
            points += Math.max(8, 40 - over_ * 2);
            ctx.setScore(points);
            ctx.sfx('good');
            msg.textContent = F.tt({ de: 'Alles verbunden!', en: 'All connected!' });
            await ctx.wait(1000);
            next();
          }
        }
        paint();
      }
      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${extra} Tipps zu viel`, en: `${extra} taps too many` }),
          levelDelta: extra <= 6 ? 1 : extra >= 30 ? -1 : 0,
          quality: Math.max(0.3, 1 - extra / 40), ink: 8 + Math.max(0, 12 - Math.floor(extra / 3)),
        });
      }
      next();
    },
  });
})();
