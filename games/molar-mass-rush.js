/* Molar Mass Rush: add up the atomic masses of a generated formula and pick the molar mass in g/mol. */
(function () {
  const F = Funkloch;
  const MASS = { H: 1.0, C: 12.0, N: 14.0, O: 16.0, Na: 23.0, Mg: 24.3, Al: 27.0, P: 31.0, S: 32.1, Cl: 35.5, K: 39.1, Ca: 40.1, Fe: 55.8, Cu: 63.5, Zn: 65.4, Br: 79.9, Ag: 107.9 };
  // ion = { f: parts of the formula, charge, poly }
  const mono = (s, c) => ({ f: { [s]: 1 }, charge: c, poly: false, label: s });
  const polyIon = (label, f, c) => ({ f, charge: c, poly: true, label });
  const CATIONS = [
    [mono('Na', 1), mono('K', 1), mono('Ag', 1), mono('Mg', 2), mono('Ca', 2), mono('Zn', 2)],
    [polyIon('NH4', { N: 1, H: 4 }, 1), mono('Cu', 2), mono('Fe', 2), mono('Al', 3), mono('Fe', 3)],
  ];
  const ANIONS = [
    [mono('Cl', 1), mono('O', 2), mono('S', 2), mono('Br', 1)],
    [polyIon('OH', { O: 1, H: 1 }, 1), polyIon('NO3', { N: 1, O: 3 }, 1), polyIon('SO4', { S: 1, O: 4 }, 2), polyIon('CO3', { C: 1, O: 3 }, 2), polyIon('PO4', { P: 1, O: 4 }, 3)],
  ];
  const SUB = '₀₁₂₃₄₅₆₇₈₉';
  const sub = (n) => (n === 1 ? '' : String(n).split('').map((d) => SUB[+d]).join(''));
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);

  function part(ion, n) {
    if (ion.poly) return n > 1 ? `(${ion.label.replace(/\d/g, (d) => SUB[+d])})${sub(n)}` : ion.label.replace(/\d/g, (d) => SUB[+d]);
    return ion.label + sub(n);
  }
  // mass of "n copies of ion", optionally with a deliberate mistake (wrong = 'skipCount' | 'skipInner')
  function ionMass(ion, n, wrong) {
    let m = 0;
    Object.keys(ion.f).forEach((s) => { m += MASS[s] * ion.f[s]; });
    if (wrong === 'skipInner' && ion.poly) {
      const first = Object.keys(ion.f)[Object.keys(ion.f).length - 1];
      m -= MASS[first] * ion.f[first] - MASS[first];
    }
    return wrong === 'skipCount' ? m : m * n;
  }
  const round1 = (x) => Math.round(x * 10) / 10;

  function makeQuestion(r, lvl) {
    const tier = lvl >= 4 ? 1 : 0;
    const cats = CATIONS[0].concat(tier ? CATIONS[1] : lvl >= 2 ? CATIONS[1].slice(1, 2) : []);
    const ans = ANIONS[0].concat(lvl >= 2 ? ANIONS[1].slice(0, lvl >= 3 ? 5 : 2) : []);
    const cat = r.pick(cats), an = r.pick(ans);
    const g = gcd(cat.charge, an.charge);
    const nc = an.charge / g, na = cat.charge / g;
    const text = part(cat, nc) + part(an, na);
    const used = new Set();
    [cat, an].forEach((i) => Object.keys(i.f).forEach((s) => used.add(s)));
    const answer = round1(ionMass(cat, nc) + ionMass(an, na));
    const wrongs = [
      ionMass(cat, nc, 'skipCount') + ionMass(an, na),
      ionMass(cat, nc) + ionMass(an, na, 'skipCount'),
      ionMass(cat, nc) + ionMass(an, na, 'skipInner'),
      ionMass(cat, nc, 'skipCount') + ionMass(an, na, 'skipCount'),
      answer + r.pick([-16, 16, 1, -1, 2, 18, -18]),
      answer + r.pick([-12, 12, 14, -14, 32, -32]),
    ].map(round1);
    return { text, answer, wrongs, used: Array.from(used), key: text };
  }

  F.registerGame({
    id: 'molar-mass-rush', skill: 'chem', added: '2026-10-29', glyph: 'g/mol',
    name: { de: 'Molmassen-Rennen', en: 'Molar Mass Rush' },
    desc: {
      de: 'Eine Formel erscheint (z. B. Ca(OH)₂). Zähle die Atommassen zusammen und tippe die richtige Molmasse in g/mol. Die verwendeten Atommassen stehen dabei. Je schneller, desto mehr Punkte. 10 Runden.',
      en: 'A formula appears (e.g. Ca(OH)₂). Add up the atomic masses and tap the correct molar mass in g/mol. The atomic masses used are shown. The faster, the more points. 10 rounds.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 10, TIME = 30000;
      let round = 0, correct = 0, points = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const q = ctx.fresh(() => makeQuestion(r, ctx.level), (x) => x.key);
        const seen = new Set([q.answer]), opts = [q.answer];
        r.shuffle(q.wrongs).forEach((w) => { if (opts.length < 4 && w > 0 && !seen.has(w)) { seen.add(w); opts.push(w); } });
        for (let k = 3; opts.length < 4; k++) if (!seen.has(round1(q.answer + k))) { seen.add(round1(q.answer + k)); opts.push(round1(q.answer + k)); } // bounded fallback
        const sh = r.shuffle(opts), ci = sh.indexOf(q.answer);
        ctx.el.innerHTML = '';
        const masses = q.used.sort().map((s) => `${s} = ${MASS[s].toFixed(1)}`).join('  ·  ');
        ctx.el.appendChild(F.h(`<div class="card sketch big-display pop-in" style="font-size:38px;flex-direction:column;gap:6px"><span>${q.text}</span><span style="font-size:17px;color:var(--ink-soft)">${masses} g/mol</span></div>`));
        let answered = false;
        const tb = ctx.timer(ctx.el, TIME, () => pick(-1, null, optEl));
        const optEl = F.options(sh.map((v) => `${v.toFixed(1)} g/mol`), (i, b, wrap) => pick(i, b, wrap));
        async function pick(i, b, wrap) {
          if (answered) return;
          answered = true;
          const ms = tb.stop(), ok = i === ci;
          if (b) b.classList.add(ok ? 'right' : 'wrong');
          wrap.children[ci].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          if (ok) { correct++; points += 5 + Math.ceil((TIME - ms) / 3000); }
          await ctx.wait(ok ? 600 : 1700);
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
