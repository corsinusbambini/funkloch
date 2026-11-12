/* Ion Builder: combine ions into salt formulas (lowest whole-number ratio) and spot impossible formulas. */
(function () {
  const F = Funkloch;
  const SUB = '₀₁₂₃₄₅₆₇₈₉';
  const sub = (n) => String(n).split('').map((d) => SUB[+d]).join('');
  const SUP = { 1: '', 2: '²', 3: '³' };
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  // cations: sym, charge, de/en name (roman: charge shown in the name)
  const CAT = [
    { s: 'Na', c: 1, de: 'Natrium', en: 'sodium' }, { s: 'K', c: 1, de: 'Kalium', en: 'potassium' },
    { s: 'Li', c: 1, de: 'Lithium', en: 'lithium' }, { s: 'Ag', c: 1, de: 'Silber', en: 'silver' },
    { s: 'Mg', c: 2, de: 'Magnesium', en: 'magnesium' }, { s: 'Ca', c: 2, de: 'Calcium', en: 'calcium' },
    { s: 'Ba', c: 2, de: 'Barium', en: 'barium' }, { s: 'Zn', c: 2, de: 'Zink', en: 'zinc' },
    { s: 'Cu', c: 2, de: 'Kupfer(II)-', en: 'copper(II)' }, { s: 'Fe', c: 2, de: 'Eisen(II)-', en: 'iron(II)' },
    { s: 'Al', c: 3, de: 'Aluminium', en: 'aluminium' }, { s: 'Fe', c: 3, de: 'Eisen(III)-', en: 'iron(III)' },
    { s: 'NH₄', c: 1, poly: true, de: 'Ammonium', en: 'ammonium' },
  ];
  const ANI = [
    { s: 'Cl', c: 1, de: 'chlorid', en: 'chloride' }, { s: 'Br', c: 1, de: 'bromid', en: 'bromide' },
    { s: 'F', c: 1, de: 'fluorid', en: 'fluoride' }, { s: 'I', c: 1, de: 'iodid', en: 'iodide' },
    { s: 'OH', c: 1, poly: true, de: 'hydroxid', en: 'hydroxide' }, { s: 'NO₃', c: 1, poly: true, de: 'nitrat', en: 'nitrate' },
    { s: 'O', c: 2, de: 'oxid', en: 'oxide' }, { s: 'S', c: 2, de: 'sulfid', en: 'sulfide' },
    { s: 'SO₄', c: 2, poly: true, de: 'sulfat', en: 'sulfate' }, { s: 'CO₃', c: 2, poly: true, de: 'carbonat', en: 'carbonate' },
    { s: 'PO₄', c: 3, poly: true, de: 'phosphat', en: 'phosphate' },
  ];
  const part = (ion, n) => (n === 1 ? ion.s : ion.poly ? `(${ion.s})${sub(n)}` : ion.s + sub(n));
  const formula = (cat, ani, nc, na) => part(cat, nc) + part(ani, na);
  const ratio = (cat, ani) => { const g = gcd(cat.c, ani.c); return [ani.c / g, cat.c / g]; };
  const ionTxt = (i, plus) => `${i.s}${SUP[i.c]}${plus ? '⁺' : '⁻'}`;
  const name = (cat, ani) => ({
    de: cat.de + ani.de,
    en: `${cat.en} ${ani.en}`,
  });
  // every correct formula string (so a "wrong" option can never accidentally be correct)
  const VALID = new Set();
  CAT.forEach((c) => ANI.forEach((a) => { const [nc, na] = ratio(c, a); VALID.add(formula(c, a, nc, na)); }));

  function pool(lvl) {
    return {
      cats: CAT.filter((c) => (lvl >= 4 ? true : lvl >= 2 ? c.c <= 2 : c.c <= 2 && !c.poly)),
      anis: ANI.filter((a) => (lvl >= 4 ? true : lvl >= 2 ? a.c <= 2 : a.c <= 2 && !a.poly)),
    };
  }
  // wrong ratios for a pair, most "tempting" first
  function wrongs(cat, ani, r) {
    const [nc, na] = ratio(cat, ani), seen = new Set([formula(cat, ani, nc, na)]), out = [];
    const add = (a, b) => {
      if (a < 1 || b < 1 || a > 4 || b > 4) return;
      const f = formula(cat, ani, a, b);
      if (!seen.has(f) && !VALID.has(f)) { seen.add(f); out.push(f); }
    };
    add(na, nc); add(1, 1); add(cat.c === ani.c ? 2 : cat.c, cat.c === ani.c ? 2 : ani.c); add(nc + 1, na); add(nc, na + 1);
    r.shuffle([[1, 2], [2, 1], [2, 3], [3, 2], [1, 3], [3, 1], [3, 3], [2, 2], [4, 1], [1, 4]]).forEach(([a, b]) => add(a, b));
    return out;
  }

  function make(r, lvl) {
    const { cats, anis } = pool(lvl);
    const kind = r.chance(0.65) ? 'build' : 'odd';
    if (kind === 'build') {
      const cat = r.pick(cats), ani = r.pick(anis), [nc, na] = ratio(cat, ani);
      const right = formula(cat, ani, nc, na), w = wrongs(cat, ani, r).slice(0, 3);
      return { kind, cat, ani, right, opts: [right].concat(w), key: 'b' + right };
    }
    // odd one out: three correct salts plus one impossible formula
    for (let t = 0; t < 40; t++) {
      const salts = [];
      const used = new Set();
      for (let i = 0; i < 4; i++) {
        const cat = r.pick(cats), ani = r.pick(anis), [nc, na] = ratio(cat, ani), f = formula(cat, ani, nc, na);
        if (used.has(f)) continue;
        used.add(f); salts.push({ cat, ani, f });
      }
      if (salts.length < 4) continue;
      const bad = salts[0], w = wrongs(bad.cat, bad.ani, r)[0];
      if (!w || used.has(w)) continue;
      const opts = salts.slice(1).map((s) => ({ f: s.f, nm: name(s.cat, s.ani) }));
      opts.push({ f: w, nm: name(bad.cat, bad.ani), bad: true });
      return { kind, bad, right: bad.f, opts, key: 'o' + opts.map((o) => o.f).sort().join('|') };
    }
    const cat = cats[0], ani = anis[0], [nc, na] = ratio(cat, ani), right = formula(cat, ani, nc, na);
    return { kind: 'build', cat, ani, right, opts: [right].concat(wrongs(cat, ani, r).slice(0, 3)), key: 'bfallback' };
  }

  F.registerGame({
    id: 'ion-builder', skill: 'chem', added: '2026-11-10', glyph: 'Na⁺',
    name: { de: 'Ionen-Baukasten', en: 'Ion Builder' },
    desc: {
      de: 'Salze sind elektrisch neutral: Die Ladungen der Ionen müssen sich ausgleichen (Verhältnis so klein wie möglich, z.B. Al₂(SO₄)₃). Baue die richtige Formel aus zwei Ionen, oder finde die Formel, die nicht stimmt. 10 Runden, je schneller desto mehr Punkte.',
      en: 'Salts are electrically neutral: the ion charges must cancel out (smallest possible ratio, e.g. Al₂(SO₄)₃). Build the right formula from two ions, or find the formula that is wrong. 10 rounds, the faster the more points.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 10, TIME = 25000;
      let round = 0, correct = 0, points = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points); ctx.setInfo(`${round} / ${ROUNDS}`);
        ctx.el.innerHTML = '';
        const q = ctx.fresh(() => make(r, ctx.level), (x) => x.key);
        let labels, ci, head, expl;
        if (q.kind === 'build') {
          const order = r.shuffle(q.opts);
          labels = order; ci = order.indexOf(q.right);
          const nm = name(q.cat, q.ani);
          head = `<span>${ionTxt(q.cat, true)} + ${ionTxt(q.ani, false)}</span><span style="font-size:17px;color:var(--ink-soft)">${F.tt({ de: 'Welche Formel hat das Salz?', en: 'Which formula does the salt have?' })}</span>`;
          expl = `${F.tt(nm)} = ${q.right}`;
        } else {
          const order = r.shuffle(q.opts);
          labels = order.map((o) => `<span style="display:block">${o.f}</span><span style="display:block;font-size:14px;color:var(--ink-soft)">${F.tt(o.nm)}</span>`);
          ci = order.findIndex((o) => o.bad);
          const bad = order[ci];
          head = `<span>${F.tt({ de: 'Welche Formel ist falsch?', en: 'Which formula is wrong?' })}</span><span style="font-size:17px;color:var(--ink-soft)">${F.tt({ de: 'Drei Salze stimmen, eins nicht.', en: 'Three salts are right, one is not.' })}</span>`;
          expl = `${F.tt(bad.nm)} = ${q.right}`;
        }
        ctx.el.appendChild(F.h(`<div class="card sketch big-display pop-in" style="font-size:26px;letter-spacing:0;overflow-wrap:anywhere;flex-direction:column;gap:6px;text-align:center">${head}</div>`));
        let answered = false;
        const tb = ctx.timer(ctx.el, TIME, () => pick(-1, null, optEl));
        const optEl = F.options(labels, (i, b, wrap) => pick(i, b, wrap));
        async function pick(i, b, wrap) {
          if (answered) return;
          answered = true;
          const ms = tb.stop(), ok = i === ci;
          if (b) b.classList.add(ok ? 'right' : 'wrong');
          wrap.children[ci].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          if (ok) { correct++; points += 5 + Math.ceil((TIME - ms) / 3000); }
          else ctx.el.appendChild(F.h(`<div class="info-line" style="text-align:center;margin-top:8px">${expl}</div>`));
          await ctx.wait(ok ? 600 : 2000);
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
