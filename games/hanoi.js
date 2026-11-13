/* Tower of Hanoi: move all disks to the flagged peg. Only the top disk moves, never a big one onto a small one. */
(function () {
  const F = Funkloch;

  // state[d] = peg (0..2) of disk d; disk 0 is the smallest.
  function legalMoves(st) {
    const out = [];
    for (let d = 0; d < st.length; d++) {
      const from = st[d];
      if (st.slice(0, d).some((p) => p === from)) continue; // a smaller disk sits on top
      for (let to = 0; to < 3; to++) {
        if (to === from || st.slice(0, d).some((p) => p === to)) continue;
        out.push([d, to]);
      }
    }
    return out;
  }
  const key = (st) => st.join('');
  // Shortest number of moves from st to goal (BFS over at most 3^n states).
  function distance(st, goal) {
    const g = key(goal);
    const seen = new Set([key(st)]);
    let front = [st], dist = 0;
    while (front.length) {
      if (front.some((s) => key(s) === g)) return dist;
      const nxt = [];
      front.forEach((s) => legalMoves(s).forEach(([d, to]) => {
        const t = s.slice(); t[d] = to;
        const k = key(t);
        if (!seen.has(k)) { seen.add(k); nxt.push(t); }
      }));
      front = nxt; dist++;
    }
    return -1;
  }

  function makePuzzle(r, n, scramble) {
    let best = null;
    for (let t = 0; t < 12; t++) {
      let st = Array(n).fill(r.int(0, 2));
      if (scramble) {
        for (let k = 0; k < 8 + n * 4; k++) {
          const mv = r.pick(legalMoves(st));
          st = st.slice(); st[mv[0]] = mv[1];
        }
      }
      const goalPeg = r.int(0, 2);
      const goal = Array(n).fill(goalPeg);
      const par = distance(st, goal);
      if (par < 2) continue;
      if (!best || (scramble ? par > best.par : false)) best = { start: st, goalPeg, par };
      if (!scramble || par >= n + 2) break;
    }
    if (!best) {
      const st = Array(n).fill(0);
      best = { start: st, goalPeg: 2, par: distance(st, Array(n).fill(2)) };
    }
    return best;
  }

  F.registerGame({
    id: 'hanoi', skill: 'logic', added: '2026-11-06', glyph: '🗼',
    name: { de: 'Türme von Hanoi', en: 'Tower of Hanoi' },
    desc: {
      de: 'Bringe alle Scheiben auf den Stab mit der Fahne 🏁. Tippe einen Stab, dann den Zielstab: Es zieht immer die oberste Scheibe, und nie eine grosse auf eine kleine. Je weniger Züge, desto mehr Punkte. 3 Rätsel.',
      en: 'Move all disks to the peg with the flag 🏁. Tap a peg, then the target peg: the top disk moves, and a big disk never goes on a small one. Fewer moves means more points. 3 puzzles.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 3;
      let round = 0, points = 0, solved = 0;
      const COLS = ['--c-memory', '--c-math', '--c-logic', '--c-spatial', '--c-focus', '--c-fun'];
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const n = ctx.level >= 6 ? 5 : ctx.level >= 3 ? 4 : 3;
        const puz = ctx.fresh(() => makePuzzle(r, n, round > 1), (p) => key(p.start) + p.goalPeg);
        const st = puz.start.slice();
        const history = [];
        let sel = -1, moves = 0, done = false, moved = -1;
        ctx.el.innerHTML = '';
        // Status: two drawn counters, moves so far and the best possible.
        const stat = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:4px 0 10px"></div>');
        const box = (label) => {
          const el = F.h(`<div class="card sketch" style="padding:6px 10px;display:flex;align-items:baseline;justify-content:center;gap:10px"><span style="font-size:18px;color:var(--ink-soft)">${F.tt(label)}</span><b style="font-size:34px;font-weight:normal;line-height:1.1">0</b></div>`);
          stat.appendChild(el);
          return el.querySelector('b');
        };
        const movesEl = box({ de: 'Züge', en: 'Moves' }), parEl = box({ de: 'Bestwert', en: 'Best' });
        parEl.textContent = puz.par;
        // The board: one wooden plank, three sticks; each third is one tap target.
        const board = F.h(`<div class="sketch" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:0;padding:6px 4px 2px;background:var(--paper-2);transform:rotate(-0.5deg)"></div>`);
        const H = 412, dh = Math.min(52, Math.floor(280 / n));
        const pegs = [0, 1, 2].map((p) => {
          const b = F.h('<button style="min-width:0;padding:0;border:0;background:transparent;color:var(--ink);cursor:pointer;display:block"></button>');
          b.onclick = () => tap(p);
          board.appendChild(b);
          return b;
        });
        const undo = F.h(`<button class="btn block" style="min-height:56px;margin-top:12px">↩ ${F.tt({ de: 'Zurück', en: 'Undo' })}</button>`);
        undo.onclick = () => {
          if (done || !history.length) return;
          const [d, from] = history.pop();
          st[d] = from; sel = -1; moves++; moved = d;
          ctx.sfx('tick'); draw();
        };
        const ink = 'stroke:var(--ink)';
        function pegSvg(p) {
          const y0 = H - 34; // top of the plank
          let s = `<svg viewBox="0 0 120 ${H}" style="width:100%;height:auto;display:block" stroke-linecap="round" stroke-linejoin="round">`;
          if (p === sel) s += `<rect x="6" y="8" width="108" height="${y0 - 6}" rx="16" style="fill:none;stroke:var(--accent)" stroke-width="3.5" stroke-dasharray="9 7"/>`;
          // plank
          s += `<path d="${p === 0 ? `M10,${y0} L120,${y0 + 1} L120,${H - 8} L10,${H - 8} C4,${H - 12} 4,${y0 + 6} 10,${y0} Z` : p === 2 ? `M0,${y0 + 1} L110,${y0} C116,${y0 + 6} 116,${H - 12} 110,${H - 8} L0,${H - 8} Z` : `M0,${y0 + 1} L120,${y0} L120,${H - 8} L0,${H - 8} Z`}" style="fill:var(--c-memory);stroke:none"/>`;
          s += `<path d="M${p === 0 ? 10 : 0},${y0 + (p % 2)} L${p === 2 ? 110 : 120},${y0 + ((p + 1) % 2)} M${p === 0 ? 10 : 0},${H - 8} L${p === 2 ? 110 : 120},${H - 8}" style="${ink};fill:none" stroke-width="2.5"/>`;
          if (p === 0) s += `<path d="M10,${y0} C4,${y0 + 6} 4,${H - 12} 10,${H - 8}" style="${ink};fill:none" stroke-width="2.5"/>`;
          if (p === 2) s += `<path d="M110,${y0} C116,${y0 + 6} 116,${H - 12} 110,${H - 8}" style="${ink};fill:none" stroke-width="2.5"/>`;
          s += `<path d="M${14 + p * 9},${y0 + 10} l${30 - p * 4},1 M${70 - p * 6},${y0 + 18} l26,-1" style="stroke:var(--ink-soft);fill:none" stroke-width="1.5"/>`;
          // stick
          s += `<path d="M56,${y0 + 1} L56.5,58 C57,52 63,52 63.5,58 L64,${y0 + 1} Z" style="fill:var(--c-memory);${ink}" stroke-width="2.5"/>`;
          if (p === puz.goalPeg) {
            s += `<path d="M60,54 L60,20" style="${ink}" stroke-width="2.5"/><path d="M61,20 L92,23 L90,40 L61,38 Z" style="fill:var(--card);${ink}" stroke-width="2.5"/>`;
            s += `<path d="M61,20 L69,21 L69,29 L61,29 Z M77,22 L85,22.5 L84,31 L76,30 Z M69,29 L77,30 L76,39 L69,38.5 Z M84,31 L90.5,31.5 L90,40 L83,39.5 Z" style="fill:var(--ink)"/>`;
          }
          // valid target hint while a disk is lifted
          if (sel >= 0 && p !== sel) {
            const top = st.findIndex((q) => q === sel);
            if (top >= 0 && !st.slice(0, top).some((q) => q === p)) s += `<path d="M48,${p === puz.goalPeg ? 6 : 26} L72,${p === puz.goalPeg ? 6 : 26} L60,${p === puz.goalPeg ? 18 : 40} Z" style="fill:var(--accent);${ink}" stroke-width="2"/>`;
          }
          const disks = st.map((q, d) => (q === p ? d : -1)).filter((d) => d >= 0).sort((a, c) => c - a); // big first = bottom
          disks.forEach((d, k) => {
            const w = 40 + (d * 72) / Math.max(1, n - 1);
            const lift = p === sel && k === disks.length - 1 ? 26 : 0;
            const y = y0 - (k + 1) * dh - lift, x = 60 - w / 2;
            s += `<g class="${d === moved ? 'tap-pop' : ''}" style="transform-box:fill-box;transform-origin:center">`;
            s += `<rect x="${x}" y="${y + 1}" width="${w}" height="${dh - 2}" rx="${Math.min(14, dh / 2.4)}" style="fill:var(${COLS[d % COLS.length]});${ink}" stroke-width="2.5"/>`;
            s += `<path d="M${x + 9},${y + 8} L${x + Math.min(w * 0.45, 40)},${y + 7}" style="stroke:#FFFFFF;fill:none;opacity:.7" stroke-width="3"/></g>`;
          });
          return s + '</svg>';
        }
        function draw() {
          pegs.forEach((b, p) => { b.innerHTML = pegSvg(p); });
          movesEl.textContent = moves;
          movesEl.style.color = moves > puz.par ? 'var(--ink-soft)' : '';
          undo.disabled = done || !history.length;
          moved = -1;
        }
        const shake = (b) => { b.classList.remove('flash-bad'); void b.offsetWidth; b.classList.add('flash-bad'); };
        async function tap(p) {
          if (done) return;
          if (sel < 0) {
            if (!st.includes(p)) { ctx.sfx('bad'); shake(pegs[p]); return; }
            sel = p; ctx.sfx('tick'); draw(); return;
          }
          if (sel === p) { sel = -1; draw(); return; }
          const top = st.findIndex((q) => q === sel); // smallest disk on the source peg
          const blocked = st.slice(0, top).some((q) => q === p);
          if (top < 0 || blocked) { ctx.sfx('bad'); shake(pegs[p]); sel = -1; draw(); return; }
          history.push([top, sel]);
          st[top] = p; sel = -1; moves++; moved = top;
          ctx.sfx('tick');
          draw();
          if (!st.every((q) => q === puz.goalPeg)) return;
          done = true; solved++;
          points += Math.max(2, 10 - Math.max(0, moves - puz.par));
          ctx.setScore(points);
          ctx.sfx('good');
          board.classList.add('flash-ok');
          if (round < ROUNDS) F.cheer(8);
          await ctx.wait(1000);
          next();
        }
        ctx.el.appendChild(stat);
        ctx.el.appendChild(board);
        ctx.el.appendChild(undo);
        draw();
      }
      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${solved}/${ROUNDS} gelöst`, en: `${solved}/${ROUNDS} solved` }),
          levelDelta: points >= 24 ? 1 : points < 14 ? -1 : 0,
          quality: Math.min(1, points / 30), ink: 3 + Math.round(points / 3),
        });
      }
      next();
    },
  });
})();
