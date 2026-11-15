/* Fraction Pizza: see fractions as pizza slices. Pick the matching pizza, the bigger one, or the sum of two pieces. */
(function () {
  const F = Funkloch;
  const QUESTIONS = 10;
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const red = (n, d) => { const g = gcd(n, d); return [n / g, d / g]; };
  const frac = (n, d, big) => `<span style="display:inline-flex;flex-direction:column;align-items:center;line-height:1.05;font-size:${big ? 34 : 28}px;vertical-align:middle"><span>${n}</span><span style="display:block;width:1.3em;border-top:3px solid currentColor;border-radius:2px;margin:1px 0"></span><span>${d}</span></span>`;

  // hand-drawn pizza: d slices, n of them topped (the rest are bare dough)
  function pizza(n, d, size, tag) {
    const R = 46, C = 50;
    const pt = (i) => { const a = (i / d) * Math.PI * 2 - Math.PI / 2; return [C + R * Math.cos(a), C + R * Math.sin(a)]; };
    let s = `<svg viewBox="0 0 100 100" width="${size}" height="${size}" style="display:block;overflow:visible" aria-hidden="true">
      <circle cx="${C}" cy="${C}" r="${R}" style="fill:var(--paper-2);stroke:var(--ink)" stroke-width="3.4"/>`;
    for (let i = 0; i < d; i++) {
      const [x1, y1] = pt(i), [x2, y2] = pt(i + 1);
      if (i < n) {
        s += `<path d="M${C},${C} L${x1.toFixed(1)},${y1.toFixed(1)} A${R},${R} 0 0 1 ${x2.toFixed(1)},${y2.toFixed(1)} Z" style="fill:#F2B84B;stroke:none"/>`;
        const am = ((i + 0.5) / d) * Math.PI * 2 - Math.PI / 2, pr = d <= 2 ? 22 : 28;
        s += `<circle cx="${(C + pr * Math.cos(am)).toFixed(1)}" cy="${(C + pr * Math.sin(am)).toFixed(1)}" r="${d <= 3 ? 6 : 5}" style="fill:#E8574F;stroke:var(--ink)" stroke-width="1.6"/>`;
      }
    }
    s += `<circle cx="${C}" cy="${C}" r="${R - 6}" fill="none" style="stroke:var(--ink)" stroke-width="1.4" stroke-dasharray="3 5" opacity=".45"/>`;
    if (d > 1) for (let i = 0; i < d; i++) { const [x, y] = pt(i); s += `<path d="M${C},${C} L${x.toFixed(1)},${y.toFixed(1)}" style="stroke:var(--ink)" stroke-width="2.4" stroke-linecap="round"/>`; }
    s += `<circle cx="${C}" cy="${C}" r="${R}" fill="none" style="stroke:var(--ink)" stroke-width="3.4"/></svg>`;
    return s;
  }

  F.registerGame({
    id: 'fraction-pizza', skill: 'math', added: '2026-11-15', glyph: '🍕',
    name: { de: 'Bruchpizza', en: 'Fraction Pizza' },
    desc: {
      de: 'Brüche als Pizzastücke! Mal suchst du die Pizza, die zum Bruch passt, mal die grössere von zwei Pizzen, mal die Summe von zwei Stücken. Es gibt 10 Fragen. Mit möglichst vielen richtigen Antworten gewinnst du.',
      en: 'Fractions as pizza slices! Sometimes you find the pizza that matches the fraction, sometimes the bigger of two pizzas, sometimes the sum of two portions. There are 10 questions. Get as many right as you can to win.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = ctx.level || 0;
      const DENS = lvl < 3 ? [2, 4, 8] : lvl < 7 ? [2, 3, 4, 6] : [2, 3, 4, 6, 8];
      let qi = 0, right = 0, streak = 0;

      const randFrac = () => { const d = r.pick(DENS); return [r.int(1, d - 1), d]; };
      const val = (f) => f[0] / f[1];

      function build() {
        const kind = qi % 3 === 0 ? 'show' : qi % 3 === 1 ? 'bigger' : 'sum';
        if (kind === 'show') {
          const t = randFrac(), tv = red(t[0], t[1]);
          const opts = [{ f: (() => { const ds = DENS.filter((d) => d % tv[1] === 0); const d = r.pick(ds); return [tv[0] * d / tv[1], d]; })(), ok: true }];
          for (let g = 0; g < 80 && opts.length < 4; g++) {
            const f = randFrac();
            if (f[0] * tv[1] === tv[0] * f[1]) continue;
            if (opts.some((o) => o.f[0] * f[1] === f[0] * o.f[1])) continue;
            opts.push({ f, ok: false });
          }
          return { kind, q: { de: 'Welche Pizza zeigt', en: 'Which pizza shows' }, clue: frac(t[0], t[1], true), opts: r.shuffle(opts), pizzaOpts: true };
        }
        if (kind === 'bigger') {
          let a, b;
          for (let g = 0; g < 80; g++) { a = randFrac(); b = randFrac(); if (a[0] * b[1] !== b[0] * a[1]) break; }
          if (a[0] * b[1] === b[0] * a[1]) b = [Math.min(a[1] - 1, a[0] + 1) || 1, a[1]];
          return { kind, q: { de: 'Welche Pizza ist grösser?', en: 'Which pizza is bigger?' }, clue: '', opts: [{ f: a, ok: val(a) > val(b) }, { f: b, ok: val(b) > val(a) }], pizzaOpts: true, label: true };
        }
        // sum of two fractions with a result below 1
        for (let g = 0; g < 200; g++) {
          const a = randFrac(), b = randFrac();
          const L = a[1] * b[1] / gcd(a[1], b[1]);
          const n = a[0] * (L / a[1]) + b[0] * (L / b[1]);
          if (n >= L || L > 12) continue;
          const ans = red(n, L), key = (f) => f[0] + '/' + f[1];
          const set = [ans], seen = new Set([key(ans)]);
          const cand = [red(a[0] + b[0], a[1] + b[1]), red(Math.max(1, n - 1), L), red(Math.min(L - 1, n + 1), L), red(n, L + 2), red(Math.min(L - 1, n + 2), L), red(Math.max(1, n - 2), L)];
          r.shuffle(cand).forEach((f) => { if (set.length < 4 && !seen.has(key(f)) && f[0] < f[1]) { seen.add(key(f)); set.push(f); } });
          if (set.length < 4) continue;
          return { kind: 'sum', q: { de: 'Wie viel Pizza ist das zusammen?', en: 'How much pizza is that together?' }, clue: `<span style="display:inline-flex;align-items:center;gap:8px">${pizza(a[0], a[1], 54)}${frac(a[0], a[1])}<b style="font-size:30px">+</b>${pizza(b[0], b[1], 54)}${frac(b[0], b[1])}</span>`, opts: r.shuffle(set.map((f, i) => ({ f, ok: i === 0 }))), pizzaOpts: false, wide: true };
        }
        const f = randFrac();
        return { kind: 'show', q: { de: 'Welche Pizza zeigt', en: 'Which pizza shows' }, clue: frac(f[0], f[1], true), opts: [{ f, ok: true }, { f: [f[1] - f[0] === f[0] ? 1 : f[1] - f[0], f[1]], ok: false }], pizzaOpts: true };
      }

      function next() {
        if (qi >= QUESTIONS) return end();
        const q = build();
        qi++;
        ctx.setInfo(`${qi} / ${QUESTIONS}`); ctx.setScore(right * 10);
        ctx.el.innerHTML = '';
        const head = F.h(`<div class="card sketch pop-in" style="margin:6px 0 14px;padding:14px 12px;display:flex;align-items:center;justify-content:center;gap:12px;flex-wrap:wrap;min-height:84px;transform:rotate(-0.5deg);background:var(--c-math)">
          <span style="font-size:23px">${F.esc(F.tt(q.q))}</span>${q.clue}</div>`);
        const cols = q.opts.length === 2 ? 2 : 2;
        const box = F.h(`<div class="options" style="grid-template-columns:repeat(${cols},minmax(0,1fr));gap:14px"></div>`);
        let locked = false;
        q.opts.forEach((o) => {
          const body = q.pizzaOpts ? `${pizza(o.f[0], o.f[1], q.opts.length === 2 ? 140 : 128)}${q.label ? `<span style="margin-top:6px">${frac(o.f[0], o.f[1])}</span>` : ''}` : frac(o.f[0], o.f[1], true);
          const b = F.h(`<button class="opt" style="min-width:0;padding:8px;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:${q.pizzaOpts ? 172 : 120}px">${body}</button>`);
          b.addEventListener('pointerdown', async (e) => {
            e.preventDefault();
            if (locked) return; locked = true;
            b.classList.add(o.ok ? 'flash-ok' : 'flash-bad');
            ctx.sfx(o.ok ? 'good' : 'bad');
            if (o.ok) { right++; streak++; ctx.setScore(right * 10); } else { streak = 0; [...box.children].forEach((x, i) => { if (q.opts[i].ok) x.classList.add('flash-ok'); }); }
            await ctx.wait(o.ok ? 600 : 1200);
            next();
          });
          box.appendChild(b);
        });
        ctx.el.append(head, box);
      }

      function end() {
        if (right >= 8) { ctx.sfx('win'); F.cheer(10); }
        ctx.finish({
          score: right * 10, detail: F.tt({ de: `${right} von ${QUESTIONS} richtig`, en: `${right} of ${QUESTIONS} right` }),
          levelDelta: right >= 9 ? 1 : right <= 4 ? -1 : 0, quality: right / QUESTIONS, ink: 3 + right * 2,
        });
      }
      next();
    },
  });
})();
