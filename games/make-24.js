/* Make 24: combine four numbers with + − × ÷ to reach the target. Uses exact fractions. */
(function () {
  const F = Funkloch;
  const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a));
  const fr = (n, d = 1) => { if (d < 0) { n = -n; d = -d; } const g = gcd(n, d) || 1; return { n: n / g, d: d / g }; };
  const OPS = {
    '+': (a, b) => fr(a.n * b.d + b.n * a.d, a.d * b.d),
    '−': (a, b) => fr(a.n * b.d - b.n * a.d, a.d * b.d),
    '×': (a, b) => fr(a.n * b.n, a.d * b.d),
    '÷': (a, b) => (b.n === 0 ? null : fr(a.n * b.d, a.d * b.n)),
  };
  const show = (x) => (x.d === 1 ? String(x.n) : `${x.n}/${x.d}`);

  // All reachable results; returns map value-string -> expression.
  function solveAll(items, out = new Map()) {
    if (items.length === 1) { const k = show(items[0].v); if (!out.has(k)) out.set(k, items[0].e); return out; }
    for (let i = 0; i < items.length; i++) for (let j = 0; j < items.length; j++) {
      if (i === j) continue;
      const rest = items.filter((_, k) => k !== i && k !== j);
      for (const [op, fn] of Object.entries(OPS)) {
        if ((op === '+' || op === '×') && i > j) continue;
        const v = fn(items[i].v, items[j].v);
        if (!v) continue;
        solveAll(rest.concat([{ v, e: `(${items[i].e} ${op} ${items[j].e})` }]), out);
      }
    }
    return out;
  }

  F.registerGame({
    id: 'make-24', skill: 'math', glyph: '24',
    name: { de: 'Mach 24', en: 'Make 24' },
    desc: {
      de: 'Verbinde die Zahlen mit + − × ÷, bis nur noch die Zielzahl übrig ist. Tipp Zahl, Rechenzeichen, Zahl. Jede Zahl genau einmal. 5 Rätsel.',
      en: 'Combine the numbers with + − × ÷ until only the target is left. Tap number, operator, number. Use each number exactly once. 5 puzzles.',
    },
    modes: [
      { id: 'easy', name: { de: 'Leicht', en: 'Easy' }, desc: { de: '3 Zahlen, kleines Ziel', en: '3 numbers, small target' } },
      { id: 'medium', name: { de: 'Mittel', en: 'Medium' }, desc: { de: '4 Zahlen bis 9, Ziel 24', en: '4 numbers up to 9, target 24' } },
      { id: 'hard', name: { de: 'Schwer', en: 'Hard' }, desc: { de: '4 Zahlen bis 13, wechselndes Ziel', en: '4 numbers up to 13, changing target' } },
    ],
    start(ctx) {
      const r = ctx.rng, ROUNDS = 5;
      let round = 0, solved = 0, points = 0;
      const MODES = { easy: { count: 3, maxN: 9, lo: 5, hi: 20 }, medium: { count: 4, maxN: 9 }, hard: { count: 4, maxN: 13, lo: 10, hi: 60 } };
      const mode = MODES[ctx.mode] || MODES.medium;
      function puzzle() {
        while (true) {
          const nums = Array.from({ length: mode.count }, () => r.int(1, mode.maxN));
          const all = solveAll(nums.map((n) => ({ v: fr(n), e: String(n) })));
          let target = 24;
          if (mode.lo) {
            const cand = [...all.keys()].filter((k) => !k.includes('/') && +k >= mode.lo && +k <= mode.hi && !nums.includes(+k));
            if (!cand.length) continue;
            target = +r.pick(cand);
          }
          if (all.has(String(target))) return { nums, target, sol: all.get(String(target)).replace(/^\((.*)\)$/, '$1') };
        }
      }
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        const p = ctx.fresh(puzzle, (x) => x.nums.slice().sort().join(',') + '>' + x.target);
        ctx.setInfo(`${round} / ${ROUNDS} &nbsp; ${F.tt({ de: 'Ziel', en: 'Target' })}: <b style="font-size:26px;color:var(--ink)">${p.target}</b>`);
        const start = performance.now();
        let vals = p.nums.map((n) => fr(n)), alive = p.nums.map(() => true), sel = -1, op = null;
        const history = [];
        let busy = false;
        ctx.el.innerHTML = '';
        const grid = F.h('<div class="m24-nums"></div>');
        const ops = F.h('<div class="m24-ops"></div>');
        const tools = F.h(`<div class="row" style="margin-top:16px"><button class="btn grow" id="undo">↶ ${F.tt({ de: 'Zurück', en: 'Undo' })}</button><button class="btn grow" id="skip">${F.tt({ de: 'Lösung', en: 'Solution' })}</button></div>`);
        const draw = () => {
          grid.innerHTML = '';
          vals.forEach((v, i) => {
            const b = F.h(`<button class="opt ${i === sel ? 'sel' : ''}" style="${alive[i] ? '' : 'visibility:hidden'}">${show(v)}</button>`);
            b.onclick = () => tapNum(i);
            grid.appendChild(b);
          });
          ops.innerHTML = '';
          Object.keys(OPS).forEach((o) => {
            const b = F.h(`<button class="opt ${o === op ? 'sel' : ''}">${o}</button>`);
            b.onclick = () => { if (sel < 0 || busy) return; ctx.sfx('tap'); op = o === op ? null : o; draw(); };
            ops.appendChild(b);
          });
        };
        async function tapNum(i) {
          if (busy) return;
          ctx.sfx('tap');
          if (sel < 0 || op == null || i === sel) { sel = i === sel ? -1 : i; op = null; return draw(); }
          const v = OPS[op](vals[sel], vals[i]);
          if (!v) { ctx.sfx('bad'); F.toast('÷ 0 ✗'); return; }
          history.push({ vals: vals.slice(), alive: alive.slice() });
          vals[i] = v; alive[sel] = false; sel = -1; op = null;
          draw();
          if (alive.filter(Boolean).length === 1) {
            busy = true;
            const last = vals[alive.indexOf(true)];
            if (last.d === 1 && last.n === p.target) {
              const secs = (performance.now() - start) / 1000;
              solved++; points += Math.max(3, Math.round(15 - secs / 8));
              ctx.sfx('win'); grid.classList.add('flash-ok');
              await ctx.wait(900); next();
            } else {
              ctx.sfx('bad'); grid.classList.add('flash-bad');
              await ctx.wait(500); grid.classList.remove('flash-bad');
              undo(); busy = false;
            }
          }
        }
        function undo() {
          const h = history.pop(); if (!h) return;
          vals = h.vals; alive = h.alive; sel = -1; op = null; draw();
        }
        tools.querySelector('#undo').onclick = () => { if (!busy) undo(); };
        tools.querySelector('#skip').onclick = async () => {
          if (busy) return; busy = true;
          ctx.setInfo(`<b style="font-size:24px;color:var(--ink)">${p.sol} = ${p.target}</b>`);
          ctx.sfx('bad');
          await ctx.wait(3200); next();
        };
        draw();
        ctx.el.append(grid, ops, tools);
      }
      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${solved}/${ROUNDS} gelöst`, en: `${solved}/${ROUNDS} solved` }),
          quality: solved / ROUNDS, ink: 4 + solved * 4,
        });
      }
      next();
    },
  });
})();
