/* Element Duel: symbols, names, atomic numbers and groups. Elements you miss come back more often. */
(function () {
  const F = Funkloch;
  // [Z, symbol, German, English, group]
  const RAW = `1 H Wasserstoff Hydrogen nonmetal|2 He Helium Helium noble|3 Li Lithium Lithium alkali|4 Be Beryllium Beryllium alkaline|5 B Bor Boron metalloid|6 C Kohlenstoff Carbon nonmetal|7 N Stickstoff Nitrogen nonmetal|8 O Sauerstoff Oxygen nonmetal|9 F Fluor Fluorine halogen|10 Ne Neon Neon noble|11 Na Natrium Sodium alkali|12 Mg Magnesium Magnesium alkaline|13 Al Aluminium Aluminium post|14 Si Silicium Silicon metalloid|15 P Phosphor Phosphorus nonmetal|16 S Schwefel Sulfur nonmetal|17 Cl Chlor Chlorine halogen|18 Ar Argon Argon noble|19 K Kalium Potassium alkali|20 Ca Calcium Calcium alkaline|21 Sc Scandium Scandium transition|22 Ti Titan Titanium transition|23 V Vanadium Vanadium transition|24 Cr Chrom Chromium transition|25 Mn Mangan Manganese transition|26 Fe Eisen Iron transition|27 Co Cobalt Cobalt transition|28 Ni Nickel Nickel transition|29 Cu Kupfer Copper transition|30 Zn Zink Zinc transition|31 Ga Gallium Gallium post|32 Ge Germanium Germanium metalloid|33 As Arsen Arsenic metalloid|34 Se Selen Selenium nonmetal|35 Br Brom Bromine halogen|36 Kr Krypton Krypton noble|37 Rb Rubidium Rubidium alkali|38 Sr Strontium Strontium alkaline|39 Y Yttrium Yttrium transition|40 Zr Zirconium Zirconium transition|41 Nb Niob Niobium transition|42 Mo Molybdän Molybdenum transition|43 Tc Technetium Technetium transition|44 Ru Ruthenium Ruthenium transition|45 Rh Rhodium Rhodium transition|46 Pd Palladium Palladium transition|47 Ag Silber Silver transition|48 Cd Cadmium Cadmium transition|49 In Indium Indium post|50 Sn Zinn Tin post|51 Sb Antimon Antimony metalloid|52 Te Tellur Tellurium metalloid|53 I Iod Iodine halogen|54 Xe Xenon Xenon noble|55 Cs Caesium Caesium alkali|56 Ba Barium Barium alkaline|78 Pt Platin Platinum transition|79 Au Gold Gold transition|80 Hg Quecksilber Mercury transition|82 Pb Blei Lead post|86 Rn Radon Radon noble|92 U Uran Uranium actinide`;
  const EL = RAW.split('|').map((s) => { const [z, sym, de, en, grp] = s.split(' '); return { z: +z, sym, de, en, grp }; });
  F.ELEMENTS = EL;
  const GROUPS = {
    noble: { de: 'ein Edelgas', en: 'a noble gas' }, alkali: { de: 'ein Alkalimetall', en: 'an alkali metal' },
    halogen: { de: 'ein Halogen', en: 'a halogen' }, alkaline: { de: 'ein Erdalkalimetall', en: 'an alkaline earth metal' },
    metalloid: { de: 'ein Halbmetall', en: 'a metalloid' },
  };
  const nm = (e) => F.tt({ de: e.de, en: e.en });

  F.registerGame({
    id: 'element-duel', skill: 'chem', glyph: 'Na',
    name: { de: 'Element-Duell', en: 'Element Duel' },
    desc: {
      de: 'Symbol ↔ Name, Ordnungszahl, Gruppen. Schnell antworten gibt mehr Punkte. Elemente, die du verwechselst, kommen öfter. 12 Fragen.',
      en: 'Symbol ↔ name, atomic number, groups. Faster answers score more. Elements you mix up come back more often. 12 questions.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 12, TIME = 8000;
      const gd = F.gameData('element-duel');
      gd.weak = gd.weak || {};
      const maxZ = ctx.level <= 1 ? 20 : ctx.level <= 2 ? 36 : 100;
      const pool = EL.filter((e) => e.z <= maxZ);
      let round = 0, correct = 0, points = 0;
      const weighted = () => {
        const tot = pool.reduce((a, e) => a + 1 + (gd.weak[e.sym] || 0) * 2, 0);
        let x = r() * tot;
        for (const e of pool) { x -= 1 + (gd.weak[e.sym] || 0) * 2; if (x <= 0) return e; }
        return pool[0];
      };
      const others = (e, n, filter = () => true) => r.shuffle(pool.filter((o) => o !== e && filter(o))).slice(0, n);

      function question() {
        const types = ['sym2name', 'name2sym', 'z2sym', 'group', 'highest'];
        const type = r.pick(types);
        const e = weighted();
        if (type === 'group') {
          const g = r.pick(Object.keys(GROUPS));
          const right = r.pick(pool.filter((o) => o.grp === g));
          if (!right) return question();
          const opts = r.shuffle([right].concat(others(right, 3, (o) => o.grp !== g)));
          return { q: F.tt({ de: 'Welches ist ' + GROUPS[g].de + '?', en: 'Which is ' + GROUPS[g].en + '?' }), labels: opts.map((o) => `${o.sym} · ${nm(o)}`), ci: opts.indexOf(right), el: right };
        }
        if (type === 'highest') {
          const opts = r.shuffle([e].concat(others(e, 3)));
          const right = opts.reduce((a, b) => (b.z > a.z ? b : a));
          return { q: F.tt({ de: 'Welches hat die grösste Ordnungszahl?', en: 'Which has the highest atomic number?' }), labels: opts.map((o) => o.sym), ci: opts.indexOf(right), el: right };
        }
        const opts = r.shuffle([e].concat(others(e, 3)));
        const ci = opts.indexOf(e);
        if (type === 'sym2name') return { q: `<span style="font-size:56px">${e.sym}</span>`, labels: opts.map(nm), ci, el: e };
        if (type === 'name2sym') return { q: nm(e), labels: opts.map((o) => o.sym), ci, el: e };
        return { q: F.tt({ de: 'Ordnungszahl ', en: 'Atomic number ' }) + `<b>${e.z}</b>`, labels: opts.map((o) => o.sym), ci, el: e };
      }

      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const q = ctx.fresh(question, (x) => x.q + x.el.sym, 6);
        ctx.el.innerHTML = '';
        const qEl = F.h(`<div class="card sketch big-display pop-in" style="font-size:30px;letter-spacing:0">${q.q}</div>`);
        ctx.el.appendChild(qEl);
        let answered = false;
        const tb = ctx.timer(ctx.el, TIME, () => pick(-1, null, optEl));
        const optEl = F.options(q.labels, (i, b, wrap) => pick(i, b, wrap));
        async function pick(i, b, wrap) {
          if (answered) return;
          answered = true;
          const ms = tb.stop();
          const ok = i === q.ci;
          if (b) b.classList.add(ok ? 'right' : 'wrong');
          wrap.children[q.ci].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          const s = q.el.sym;
          if (ok) { correct++; points += 5 + Math.ceil((TIME - ms) / 1000); gd.weak[s] = Math.max(0, (gd.weak[s] || 0) - 1); }
          else gd.weak[s] = Math.min(5, (gd.weak[s] || 0) + 2);
          await ctx.wait(ok ? 600 : 1600);
          next();
        }
        ctx.el.appendChild(optEl);
      }
      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${correct}/${ROUNDS} richtig`, en: `${correct}/${ROUNDS} right` }),
          levelDelta: correct >= 11 ? 1 : correct <= 6 ? -1 : 0,
          quality: correct / ROUNDS, ink: 3 + correct * 2,
        });
      }
      next();
    },
  });
})();
