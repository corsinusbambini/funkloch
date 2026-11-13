/* Chain Calc: start with a number, apply each step in order, pick the number you end up with. */
(function () {
  const F = Funkloch;
  const OPS = { '+': (a, b) => a + b, '−': (a, b) => a - b, '×': (a, b) => a * b };

  // slightly wobbly closed outline (hand-drawn look); the wobble comes from k, never from randomness
  const wob = (cx, cy, rx, ry, k) => {
    let d = '';
    for (let i = 0; i <= 28; i++) {
      const a = (i / 28) * Math.PI * 2, j = 1 + 0.045 * Math.sin(a * 3 + k);
      d += (i ? 'L' : 'M') + (cx + rx * j * Math.cos(a)).toFixed(1) + ' ' + (cy + ry * j * Math.sin(a)).toFixed(1);
    }
    return d + 'Z';
  };
  // doodle: a chain of links, one link per step, the last one still open
  function chainMotif(k) {
    let s = '';
    for (let i = 0; i < 5; i++) {
      const x = 36 + i * 50, flat = i % 2 === 0;
      const rx = flat ? 32 : 26, ry = flat ? 20 : 11;
      s += `<path d="${wob(x, 48, rx, ry, k + i)}" style="fill:${flat ? 'var(--c-math)' : 'var(--card)'}"/>`;
      s += `<path d="${wob(x, 48, rx - 11, Math.max(3, ry - 9), k + i + 1)}" style="fill:var(--paper)"/>`;
      if (flat) s += `<path d="M${x - 21} ${40} q8 -8 19 -7" style="fill:none;stroke:#fff;stroke-opacity:.6;stroke-width:2.5"/>`;
    }
    s += `<path d="M272 28 q11 20 0 40" style="fill:none;stroke-dasharray:5 6"/><text x="286" y="60" style="font-size:30px;fill:var(--accent);stroke:none">?</text>`;
    return `<svg class="motif" viewBox="0 0 316 96" width="316" height="96" style="transform:rotate(-2deg);stroke:currentColor;stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round" aria-hidden="true">${s}</svg>`;
  }

  function chain(r, lvl) {
    const steps = Math.min(5, 2 + Math.floor(lvl / 3) + r.int(0, 1));
    const big = Math.min(20, 9 + lvl);
    let v = r.int(2, big), start = v;
    const ops = [];
    for (let i = 0; i < steps; i++) {
      const choices = ['+', '−'];
      if (lvl >= 2 && Math.abs(v) <= 60) choices.push('×');
      const op = r.pick(choices);
      const n = op === '×' ? r.int(2, lvl >= 6 ? 5 : 3) : r.int(2, big);
      v = OPS[op](v, n);
      ops.push({ op, n });
    }
    return { start, ops, answer: v };
  }

  F.registerGame({
    id: 'chain-calc', skill: 'math', added: '2026-10-28', glyph: '5→+3→?',
    name: { de: 'Rechenkette', en: 'Chain Calc' },
    desc: {
      de: 'Du bekommst eine Startzahl und eine Kette von Rechenschritten. Rechne alles der Reihe nach im Kopf durch und tippe das Ergebnis. Je schneller, desto mehr Punkte. 10 Runden.',
      en: 'You get a start number and a chain of steps. Work through them in order in your head and tap the result. The faster, the more points. 10 rounds.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 10, TIME = 25000;
      let round = 0, correct = 0, points = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const q = ctx.fresh(() => chain(r, ctx.level), (x) => x.start + x.ops.map((o) => o.op + o.n).join(''));
        const cand = [q.answer + 1, q.answer - 1, q.answer + 10, q.answer - 10, q.answer + 2, q.answer - 2, q.answer + r.int(3, 9), q.answer - r.int(3, 9)];
        const seen = new Set([q.answer]), opts = [q.answer];
        r.shuffle(cand).forEach((w) => { if (opts.length < 4 && !seen.has(w)) { seen.add(w); opts.push(w); } });
        for (let k = 11; opts.length < 4; k++) if (!seen.has(q.answer + k)) { seen.add(q.answer + k); opts.push(q.answer + k); } // bounded fallback
        const sh = r.shuffle(opts), ci = sh.indexOf(q.answer);
        ctx.el.innerHTML = '';
        const parts = [`<span>${q.start}</span>`].concat(q.ops.map((o) => `<span>${o.op}${o.n}</span>`));
        ctx.el.appendChild(F.h(chainMotif(round)));
        ctx.el.appendChild(F.h(`<div class="card sketch big-display pop-in" style="font-size:34px;letter-spacing:1px;flex-wrap:wrap;gap:6px 12px;min-height:214px;margin-top:6px">${parts.join('<span style="color:var(--ink-soft)">→</span>')}<span style="color:var(--accent)">→ ?</span></div>`));
        let answered = false;
        const tb = ctx.timer(ctx.el, TIME, () => pick(-1, null, optEl));
        const optEl = F.options(sh.map(String), (i, b, wrap) => pick(i, b, wrap), 'tall');
        optEl.style.marginTop = '26px';
        async function pick(i, b, wrap) {
          if (answered) return;
          answered = true;
          const ms = tb.stop(), ok = i === ci;
          if (b) b.classList.add(ok ? 'right' : 'wrong', 'tap-pop');
          wrap.children[ci].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          if (ok) { correct++; points += 5 + Math.ceil((TIME - ms) / 2500); if (round < ROUNDS) F.cheer(8); }
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
