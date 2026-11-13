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

  // slightly wobbly circle (hand-drawn look); the wobble comes from k, never from randomness
  const wob = (cx, cy, rr, k) => {
    let d = '';
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI * 2, j = 1 + 0.035 * Math.sin(a * 3 + k);
      d += (i ? 'L' : 'M') + (cx + rr * j * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * j * Math.sin(a)).toFixed(1);
    }
    return d + 'Z';
  };
  // doodle: a dartboard with the target number in the bull's eye and a dart stuck in the ring
  function targetMotif(target, k) {
    const lab = F.tt({ de: 'Ziel', en: 'Target' });
    return `<svg class="motif" viewBox="0 0 300 128" width="324" height="138" style="transform:rotate(${k % 2 ? -2 : 2}deg);stroke:currentColor;stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round" aria-hidden="true">
      <path d="${wob(150, 64, 60, k)}" style="fill:var(--c-math)"/>
      <path d="${wob(150, 64, 47, k + 2)}" style="fill:var(--card)"/>
      <path d="${wob(150, 64, 36, k + 4)}" style="fill:var(--c-math)"/>
      <path d="${wob(150, 64, 27, k + 1)}" style="fill:var(--card)"/>
      <path d="M112 30 q14 -14 32 -16" style="fill:none;stroke:#fff;stroke-opacity:.6;stroke-width:3"/>
      <text x="150" y="78" text-anchor="middle" style="font-size:${target > 99 ? 28 : 38}px;fill:var(--ink);stroke:none">${target}</text>
      <path d="M196 38 L250 14" style="fill:none;stroke-width:3"/>
      <path d="M250 14 l14 -10 l-2 12 l12 2 l-12 8 Z" style="fill:var(--accent)"/>
      <text x="58" y="70" text-anchor="middle" style="font-size:22px;fill:var(--ink-soft);stroke:none">${lab}</text>
    </svg>`;
  }

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
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const start = performance.now();
        let vals = p.nums.map((n) => fr(n)), alive = p.nums.map(() => true), sel = -1, op = null;
        const history = [];
        let busy = false;
        ctx.el.innerHTML = '';
        const goal = F.h(`<div class="pop-in" style="margin-top:6px">${targetMotif(p.target, round)}</div>`);
        // 4 numbers: 2 × 2; 3 numbers: a triangle (two on top, one centred below)
        const grid = F.h('<div class="m24-nums" style="grid-template-columns:repeat(4,minmax(0,1fr));margin:10px 0 18px"></div>');
        const ops = F.h('<div class="m24-ops" style="gap:12px"></div>');
        const tools = F.h(`<div class="row" style="margin-top:28px"><button class="btn grow" id="undo">↶ ${F.tt({ de: 'Zurück', en: 'Undo' })}</button><button class="btn grow" id="skip">${F.tt({ de: 'Lösung', en: 'Solution' })}</button></div>`);
        const draw = () => {
          grid.innerHTML = '';
          vals.forEach((v, i) => {
            const col = vals.length === 3 && i === 2 ? '2 / span 2' : 'span 2';
            const b = F.h(`<button class="opt ${i === sel ? 'sel' : ''}" style="grid-column:${col};min-width:0;min-height:112px;font-size:38px;${i === sel ? 'color:var(--ink);' : ''}${alive[i] ? '' : 'visibility:hidden'}">${show(v)}</button>`);
            b.onclick = () => tapNum(i);
            grid.appendChild(b);
          });
          ops.innerHTML = '';
          Object.keys(OPS).forEach((o) => {
            const b = F.h(`<button class="opt ${o === op ? 'sel' : ''}" style="width:74px;min-height:70px;font-size:32px;${o === op ? 'color:var(--ink)' : ''}">${o}</button>`);
            b.onclick = () => { if (sel < 0 || busy) return; ctx.sfx('tap'); op = o === op ? null : o; draw(); };
            ops.appendChild(b);
          });
        };
        async function tapNum(i) {
          if (busy) return;
          ctx.sfx('tap');
          if (sel < 0 || op == null || i === sel) { sel = i === sel ? -1 : i; op = null; draw(); if (sel >= 0) grid.children[sel].classList.add('tap-pop'); return; }
          const v = OPS[op](vals[sel], vals[i]);
          if (!v) { ctx.sfx('bad'); F.toast('÷ 0 ✗'); return; }
          history.push({ vals: vals.slice(), alive: alive.slice() });
          vals[i] = v; alive[sel] = false; sel = -1; op = null;
          draw();
          grid.children[i].classList.add('pop-in');
          if (alive.filter(Boolean).length === 1) {
            busy = true;
            const last = vals[alive.indexOf(true)];
            if (last.d === 1 && last.n === p.target) {
              const secs = (performance.now() - start) / 1000;
              solved++; points += Math.max(3, Math.round(15 - secs / 8));
              ctx.sfx('win'); grid.classList.add('flash-ok'); if (round < ROUNDS) F.cheer(8);
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
        ctx.el.append(goal, grid, ops, tools);
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
