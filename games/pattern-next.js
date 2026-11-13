/* Pattern Next: what comes next in the row? Number and symbol patterns, generated fresh each time. */
(function () {
  const F = Funkloch;
  const SYMBOLS = ['★', '●', '▲', '■', '♥', '◆', '☀', '☁', '✿', '☂'];
  const ARROWS = ['↑', '↗', '→', '↘', '↓', '↙', '←', '↖'];

  // Each generator returns { items: [...shown], answer, wrong: [...candidates] }.
  const NUM = {
    add(r) { const a = r.int(1, 30), d = r.pick([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, -2, -3, -4, -5]); const s = [0, 1, 2, 3, 4].map((i) => a + 50 * (d < 0) + i * d); return { items: s.slice(0, 4), answer: s[4], wrong: [s[4] + 1, s[4] - 1, s[4] + d, s[3] - d] }; },
    times(r) { const a = r.int(1, 5), k = r.pick([2, 2, 3]); const s = [0, 1, 2, 3, 4].map((i) => a * k ** i); return { items: s.slice(0, 4), answer: s[4], wrong: [s[3] + s[3] - s[2], s[4] + k, s[4] - a, s[3] * (k + 1)] }; },
    alternate(r) { const a = r.int(1, 20), p = r.int(2, 9), q = r.pick([-1, -2, -3, 1, 10]); const s = [a]; for (let i = 1; i < 6; i++) s.push(s[i - 1] + (i % 2 ? p : q)); return { items: s.slice(0, 5), answer: s[5], wrong: [s[4] + q, s[5] + 1, s[5] - p, s[4] + p + q] }; },
    growing(r) { const a = r.int(1, 15), d = r.int(1, 3); const s = [a]; for (let i = 1; i < 5; i++) s.push(s[i - 1] + d * i); return { items: s.slice(0, 4), answer: s[4], wrong: [s[3] + 3 * d, s[4] + 1, s[4] - 1, s[4] + d] }; },
    squares(r) { const o = r.int(1, 6); const s = [0, 1, 2, 3, 4].map((i) => (i + o) ** 2); return { items: s.slice(0, 4), answer: s[4], wrong: [s[4] + 1, s[4] - 2, s[3] + (s[3] - s[2]), (o + 4) * (o + 3)] }; },
    fib(r) { const s = [r.int(1, 5), r.int(1, 6)]; for (let i = 2; i < 6; i++) s.push(s[i - 1] + s[i - 2]); return { items: s.slice(0, 5), answer: s[5], wrong: [s[5] + 1, s[5] - 1, s[4] * 2, s[4] + s[2]] }; },
  };
  const SYM = {
    cycle(r) { const k = r.int(2, 3), set = r.shuffle(SYMBOLS).slice(0, k); const s = [0, 1, 2, 3, 4, 5, 6].map((i) => set[i % k]); return { items: s.slice(0, 6), answer: s[6], wrong: SYMBOLS.filter((x) => x !== s[6]) }; },
    mirror(r) { const [a, b] = r.shuffle(SYMBOLS); const s = [a, a, b, a, a, b, a]; return { items: s.slice(0, 6), answer: s[6], wrong: [b].concat(SYMBOLS.filter((x) => x !== a && x !== b)) }; },
    arrows(r) { const st = r.pick([1, 2, -1, -2, 3]), o = r.int(0, 7); const s = [0, 1, 2, 3, 4].map((i) => ARROWS[(((o + i * st) % 8) + 8) % 8]); return { items: s.slice(0, 4), answer: s[4], wrong: ARROWS.filter((x) => x !== s[4]) }; },
    count(r) { const sym = r.pick(SYMBOLS), a = r.int(1, 2); const s = [0, 1, 2, 3].map((i) => sym.repeat(a + i)); return { items: s.slice(0, 3), answer: s[3], wrong: [sym.repeat(a + 2), sym.repeat(a + 4), sym.repeat(a + 5), r.pick(SYMBOLS.filter((x) => x !== sym)).repeat(a + 3)] }; },
  };
  // Hand-drawn thinking doodle: a notepad with scribbles and a glowing light bulb. Decoration only.
  const TINTS = ['var(--c-logic)', 'var(--c-math)', 'var(--c-focus)', 'var(--c-fun)'];
  const doodle = (i) => `<svg class="motif" viewBox="0 0 320 130" width="340" height="138" aria-hidden="true" style="margin:16px auto 18px;transform:rotate(${i % 2 ? 1.5 : -1.5}deg);stroke:var(--ink);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;fill:none">
    <path d="M40 22 L176 16 L182 118 L44 124 Z" style="fill:var(--card)"/>
    <path d="M56 20 L56 12 M80 19 L80 11 M104 18 L104 10 M128 17 L128 9 M152 16 L152 8" style="stroke-width:3"/>
    <path d="M58 44 C80 41 100 46 122 42 M58 64 C76 61 92 66 110 62 M58 84 C82 81 104 86 140 82 M58 104 C70 102 84 105 96 102" style="stroke:var(--ink-soft);stroke-width:2.2"/>
    <circle cx="152" cy="62" r="7" style="fill:${TINTS[i % 4]}"/><circle cx="132" cy="62" r="5" style="fill:${TINTS[(i + 1) % 4]}"/>
    <path d="M150 100 C152 92 162 92 162 100 C162 108 150 108 150 100" style="stroke-dasharray:4 4"/>
    <path d="M238 92 C220 82 214 58 226 42 C238 26 266 26 278 42 C290 58 284 82 266 92 Z" style="fill:${TINTS[(i + 2) % 4]}"/>
    <path d="M238 92 L266 92 L264 108 L240 108 Z" style="fill:var(--paper-2)"/><path d="M241 99 L263 99"/>
    <path d="M246 108 C248 116 256 116 258 108" style="fill:var(--ink)"/>
    <path d="M246 88 C244 74 250 66 252 60 C254 66 260 74 258 88" style="stroke-width:2"/>
    <path d="M232 52 C236 44 242 40 250 39" style="stroke:#fff;opacity:.75;stroke-width:3"/>
    <path d="M252 18 L252 8 M222 26 L214 18 M282 26 L290 18 M206 52 L196 50 M298 52 L308 50" style="stroke:var(--accent);stroke-width:3"/>
  </svg>`;
  const byLevel = (lvl) => {
    const g = [SYM.cycle, SYM.arrows, NUM.add, SYM.count];
    if (lvl >= 2) g.push(NUM.times, SYM.mirror);
    if (lvl >= 3) g.push(NUM.alternate, NUM.growing);
    if (lvl >= 5) g.push(NUM.squares, NUM.fib);
    return g;
  };

  F.registerGame({
    id: 'pattern-next', skill: 'logic', glyph: '1·2·?',
    name: { de: 'Was kommt dann?', en: 'What’s Next?' },
    desc: {
      de: 'Eine Reihe aus Zahlen oder Zeichen folgt einer Regel. Finde heraus, was als Nächstes kommt. Je schneller, desto mehr Punkte. 10 Runden.',
      en: 'A row of numbers or symbols follows a rule. Work out what comes next. The faster, the more points. 10 rounds.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 10, TIME = 20000;
      let round = 0, correct = 0, points = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const gen = r.pick(byLevel(ctx.level));
        const q = ctx.fresh(() => gen(r), (x) => x.items.join(','));
        const seen = new Set([String(q.answer)]), opts = [q.answer];
        r.shuffle(q.wrong).forEach((w) => { if (opts.length < 4 && !seen.has(String(w)) && (typeof w !== 'number' || w >= 0)) { seen.add(String(w)); opts.push(w); } });
        while (opts.length < 4) { const w = typeof q.answer === 'number' ? q.answer + r.int(2, 12) : r.pick(SYMBOLS); if (!seen.has(String(w))) { seen.add(String(w)); opts.push(w); } }
        const sh = r.shuffle(opts), ci = sh.indexOf(q.answer);
        ctx.el.innerHTML = '';
        ctx.el.appendChild(F.h(`<div class="card sketch big-display pop-in" style="font-size:${q.items.join('').length > 18 ? 30 : 40}px;letter-spacing:1px;flex-wrap:wrap;gap:4px 16px;min-height:180px;word-break:normal">${q.items.map((x) => `<span>${x}</span>`).join('')}<span style="color:var(--accent)">?</span></div>`));
        let answered = false;
        const tb = ctx.timer(ctx.el, TIME, () => pick(-1, null, optEl));
        ctx.el.appendChild(F.h(doodle(round)));
        const optEl = F.options(sh.map((x) => `<span style="font-size:${String(x).length > 4 ? 26 : 34}px">${x}</span>`), (i, b, wrap) => pick(i, b, wrap), 'tall');
        async function pick(i, b, wrap) {
          if (answered) return;
          answered = true;
          const ms = tb.stop(), ok = i === ci;
          if (b) b.classList.add(ok ? 'right' : 'wrong', ok ? 'tap-pop' : 'flash-bad');
          wrap.children[ci].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          if (ok) { correct++; points += 5 + Math.ceil((TIME - ms) / 2000); if (round < ROUNDS) F.cheer(8); }
          await ctx.wait(ok ? 600 : 1500);
          next();
        }
        ctx.el.appendChild(optEl);
      }
      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${correct}/${ROUNDS} richtig`, en: `${correct}/${ROUNDS} right` }),
          levelDelta: correct >= 9 ? 1 : correct <= 5 ? -1 : 0,
          quality: correct / ROUNDS, ink: 3 + correct * 2,
        });
      }
      next();
    },
  });
})();
