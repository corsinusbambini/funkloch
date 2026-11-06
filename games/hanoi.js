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
        let sel = -1, moves = 0, done = false;
        ctx.el.innerHTML = '';
        const info = F.h(`<div class="info-line"></div>`);
        const board = F.h(`<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-width:340px;margin:12px auto"></div>`);
        const pegs = [0, 1, 2].map((p) => {
          const b = F.h(`<button style="min-width:0;padding:6px 2px;height:${n * 30 + 70}px;border:2.5px solid var(--ink);border-radius:14px;background:var(--card);color:var(--ink);cursor:pointer;box-shadow:var(--shadow);display:flex;flex-direction:column;justify-content:flex-end;align-items:center;gap:3px;position:relative"></button>`);
          b.onclick = () => tap(p);
          board.appendChild(b);
          return b;
        });
        const undo = F.h(`<button class="btn small" style="display:block;margin:4px auto">↩ ${F.tt({ de: 'Zurück', en: 'Undo' })}</button>`);
        undo.onclick = () => {
          if (done || !history.length) return;
          const [d, from] = history.pop();
          st[d] = from; sel = -1; moves++;
          ctx.sfx('tick'); draw();
        };
        function draw() {
          pegs.forEach((b, p) => {
            let h = `<div style="font-size:20px;line-height:1;height:22px">${p === puz.goalPeg ? '🏁' : ''}</div><div style="flex:1;width:6px;border-radius:3px;background:var(--ink-faint);position:absolute;top:30px;bottom:6px;left:calc(50% - 3px);z-index:0"></div>`;
            const disks = st.map((q, d) => (q === p ? d : -1)).filter((d) => d >= 0).sort((a, c) => c - a); // big first = bottom
            // bottom disk is last in the flex column, so list top first
            disks.slice().reverse().forEach((d) => {
              const w = 34 + (d * 58) / Math.max(1, n - 1);
              h += `<div style="width:${w}%;height:26px;border:2.5px solid var(--ink);border-radius:9px;background:var(${COLS[d % COLS.length]});position:relative;z-index:1"></div>`;
            });
            b.innerHTML = h;
            b.style.outline = p === sel ? '4px dashed var(--accent)' : '';
            b.style.outlineOffset = p === sel ? '2px' : '';
          });
          info.textContent = F.tt({ de: `Züge: ${moves} · Bestwert: ${puz.par}`, en: `Moves: ${moves} · Best: ${puz.par}` });
          undo.disabled = done || !history.length;
        }
        async function tap(p) {
          if (done) return;
          if (sel < 0) {
            if (!st.includes(p)) { ctx.sfx('bad'); return; }
            sel = p; ctx.sfx('tick'); draw(); return;
          }
          if (sel === p) { sel = -1; draw(); return; }
          const top = st.findIndex((q) => q === sel); // smallest disk on the source peg
          const blocked = st.slice(0, top).some((q) => q === p);
          if (top < 0 || blocked) { ctx.sfx('bad'); sel = -1; draw(); return; }
          history.push([top, sel]);
          st[top] = p; sel = -1; moves++;
          ctx.sfx('tick');
          draw();
          if (!st.every((q) => q === puz.goalPeg)) return;
          done = true; solved++;
          points += Math.max(2, 10 - Math.max(0, moves - puz.par));
          ctx.setScore(points);
          ctx.sfx('good');
          await ctx.wait(1000);
          next();
        }
        ctx.el.appendChild(info);
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
