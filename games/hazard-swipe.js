/* Hazard Swipe: match GHS hazard pictograms (drawn in SVG) with their meaning and with typical lab substances. */
(function () {
  const F = Funkloch;
  const S = 'fill="none" stroke="#111" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  // Each symbol is drawn on a 100×100 white diamond with red border.
  const SYM = {
    flame: '<path d="M50,78 C34,78 30,62 40,50 C42,58 46,58 47,52 C46,40 54,32 56,24 C66,36 72,50 66,64 C64,72 58,78 50,78 Z" fill="#111"/>',
    oxidiser: '<circle cx="50" cy="62" r="13" ' + S + '/><path d="M50,49 C40,49 36,38 44,32 C45,38 48,38 48,34 C48,28 54,24 55,20 C62,28 64,40 56,47" fill="#111"/>',
    explosive: '<circle cx="50" cy="56" r="14" fill="#111"/><path d="M50,34 L50,24 M30,42 L22,36 M70,42 L78,36 M24,58 L14,58 M76,58 L86,58 M32,74 L24,80 M68,74 L76,80" ' + S + '/>',
    gas: '<rect x="41" y="34" width="18" height="44" rx="8" fill="#111"/><rect x="46" y="26" width="8" height="10" fill="#111"/><path d="M60,28 L68,28" ' + S + '/>',
    corrosive: '<path d="M24,24 L42,20 L45,36 L27,40 Z M58,20 L76,24 L73,40 L55,36 Z" ' + S + '/><path d="M34,48 q-5,8 0,11 q5,-3 0,-11 M66,48 q-5,8 0,11 q5,-3 0,-11 M50,52 q-4,7 0,10 q4,-3 0,-10" fill="#111"/><path d="M20,78 L80,78" ' + S + '/><path d="M30,78 C34,66 46,66 50,78 M56,78 C60,70 68,70 72,78" fill="#111"/>',
    toxic: '<path d="M50,26 C36,26 32,38 36,48 L38,56 L62,56 L64,48 C68,38 64,26 50,26 Z M42,62 L58,76 M58,62 L42,76" ' + S + '/><circle cx="44" cy="42" r="4" fill="#111"/><circle cx="56" cy="42" r="4" fill="#111"/>',
    irritant: '<path d="M50,24 L50,56" stroke="#111" stroke-width="10" stroke-linecap="round"/><circle cx="50" cy="73" r="6" fill="#111"/>',
    health: '<circle cx="50" cy="34" r="6" fill="#111"/><path d="M50,42 L50,60 M50,46 L36,38 M50,46 L64,38 M50,60 L40,76 M50,60 L60,76" stroke="#111" stroke-width="6" stroke-linecap="round" fill="none"/><path d="M50,48 L46,54 L54,54 Z" fill="#fff"/>',
    environment: '<path d="M30,76 L70,76 M36,66 C28,48 40,36 50,28 C60,36 72,48 64,66 Z" ' + S + '/><path d="M40,50 L60,50 M44,58 L58,58" ' + S + '/>',
  };
  // Drawn simpler where needed: fish for environment (replaces the tree-like path above).
  SYM.environment = '<path d="M20,66 L80,66" ' + S + '/><path d="M34,50 C44,36 62,38 68,50 C62,62 44,64 34,50 Z M68,50 L78,40 L78,60 Z" fill="#111"/><circle cx="42" cy="47" r="2.4" fill="#fff"/><path d="M30,24 C36,28 36,34 30,38 M44,22 C50,26 50,30 44,34" ' + S + ' opacity=".8"/>';

  const HAZ = [
    { id: 'flame', name: { de: 'Entzündbar', en: 'Flammable' }, ex: { de: ['Ethanol', 'Aceton', 'Benzin', 'Diethylether', 'Methanol'], en: ['Ethanol', 'Acetone', 'Petrol', 'Diethyl ether', 'Methanol'] } },
    { id: 'oxidiser', name: { de: 'Brandfördernd', en: 'Oxidising' }, ex: { de: ['Kaliumchlorat', 'Kaliumnitrat', 'Kaliumpermanganat', 'Natriumnitrat'], en: ['Potassium chlorate', 'Potassium nitrate', 'Potassium permanganate', 'Sodium nitrate'] } },
    { id: 'explosive', name: { de: 'Explosiv', en: 'Explosive' }, ex: { de: ['Pikrinsäure', 'Nitroglycerin', 'Schwarzpulver', 'Feuerwerkssatz'], en: ['Picric acid', 'Nitroglycerin', 'Black powder', 'Firework charge'] } },
    { id: 'gas', name: { de: 'Gas unter Druck', en: 'Gas under pressure' }, ex: { de: ['Stickstoff-Flasche', 'Argon-Flasche', 'Druckgas-Kartusche', 'Sauerstoff-Flasche'], en: ['Nitrogen cylinder', 'Argon cylinder', 'Pressurised gas cartridge', 'Oxygen cylinder'] } },
    { id: 'corrosive', name: { de: 'Ätzend', en: 'Corrosive' }, ex: { de: ['Salzsäure konz.', 'Natronlauge', 'Schwefelsäure konz.', 'Kalilauge'], en: ['Conc. hydrochloric acid', 'Sodium hydroxide solution', 'Conc. sulfuric acid', 'Potassium hydroxide solution'] } },
    { id: 'toxic', name: { de: 'Giftig', en: 'Toxic' }, ex: { de: ['Natriumcyanid', 'Kaliumcyanid', 'Arsentrioxid', 'Nikotin'], en: ['Sodium cyanide', 'Potassium cyanide', 'Arsenic trioxide', 'Nicotine'] } },
    { id: 'irritant', name: { de: 'Reizend / Gesundheitsschädlich', en: 'Irritant / Harmful' }, ex: { de: ['Natriumcarbonat', 'Calciumchlorid', 'Ammoniumchlorid', 'Kaliumcarbonat'], en: ['Sodium carbonate', 'Calcium chloride', 'Ammonium chloride', 'Potassium carbonate'] } },
    { id: 'health', name: { de: 'Langzeit-Gesundheitsgefahr', en: 'Serious health hazard' }, ex: { de: ['Formaldehyd', 'Asbest', 'Kaliumdichromat', 'Trichlorethylen'], en: ['Formaldehyde', 'Asbestos', 'Potassium dichromate', 'Trichloroethylene'] } },
    { id: 'environment', name: { de: 'Umweltgefährlich', en: 'Hazardous to environment' }, ex: { de: ['Kupfersulfat', 'Tributylzinn', 'Pflanzenschutzmittel', 'Kupfer(II)-oxid'], en: ['Copper sulfate', 'Tributyltin', 'Pesticide', 'Copper(II) oxide'] } },
  ];
  const label = (o) => F.tt(o);

  function pictoSVG(id, size) {
    return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" style="display:block"><path d="M50,4 L96,50 L50,96 L4,50 Z" fill="#fff" stroke="#D8232A" stroke-width="9" stroke-linejoin="round"/><g transform="translate(0,2)">${SYM[id]}</g></svg>`;
  }

  F.registerGame({
    id: 'hazard-swipe', skill: 'chem', added: '2026-11-03', glyph: '☠️',
    name: { de: 'Gefahrensymbole', en: 'Hazard Symbols' },
    desc: {
      de: 'Im Labor zählt jedes Warnzeichen. Mal siehst du ein GHS-Symbol und wählst seine Bedeutung, mal einen Stoff und wählst das passende Symbol. 10 Runden, schnell richtig gibt mehr Punkte.',
      en: 'In the lab every warning sign counts. Sometimes you see a GHS symbol and pick its meaning, sometimes a substance and you pick the matching symbol. 10 rounds, quick and right earns more points.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 10, TIME = 20000;
      let round = 0, correct = 0, points = 0;
          function make() {
        const h = r.pick(HAZ);
        const kind = r() < 0.35 ? 'sym2name' : r() < 0.5 ? 'sub2sym' : 'name2sym';
        const sub = Math.floor(r() * h.ex.de.length);
        const others = r.shuffle(HAZ.filter((x) => x.id !== h.id)).slice(0, 3);
        return { h, kind, sub, others, key: kind + h.id + sub };
      }
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const q = ctx.fresh(make, (x) => x.key);
        const choices = r.shuffle([q.h].concat(q.others)), ci = choices.indexOf(q.h);
        ctx.el.innerHTML = '';
        const pictoOpts = q.kind !== 'sym2name';
        let prompt;
        if (q.kind === 'sym2name') prompt = `<div style="display:flex;flex-direction:column;align-items:center;gap:6px">${pictoSVG(q.h.id, 150)}<div class="info-line">${F.tt({ de: 'Was bedeutet dieses Symbol?', en: 'What does this symbol mean?' })}</div></div>`;
        else if (q.kind === 'sub2sym') prompt = `<div style="font-size:28px;text-align:center;overflow-wrap:anywhere">🧪 ${label({ de: q.h.ex.de[q.sub], en: q.h.ex.en[q.sub] })}<div class="info-line" style="font-size:17px">${F.tt({ de: 'Welches Symbol ist das typische Warnzeichen?', en: 'Which symbol is the typical warning?' })}</div></div>`;
        else prompt = `<div style="font-size:28px;text-align:center;overflow-wrap:anywhere">⚠️ ${label(q.h.name)}<div class="info-line" style="font-size:17px">${F.tt({ de: 'Welches Symbol passt dazu?', en: 'Which symbol matches?' })}</div></div>`;
        ctx.el.appendChild(F.h(`<div class="card sketch pop-in" style="padding:14px;display:flex;justify-content:center;margin-bottom:10px">${prompt}</div>`));
        let answered = false;
        const tb = ctx.timer(ctx.el, TIME, () => pick(-1, null, wrap));
        const wrap = F.h(`<div style="display:grid;grid-template-columns:repeat(${pictoOpts ? 2 : 1},minmax(0,1fr));gap:10px;max-width:340px;margin:0 auto"></div>`);
        const bs = choices.map((c, i) => {
          const b = F.h(`<button class="opt" style="min-height:${pictoOpts ? 110 : 56}px;min-width:0;display:flex;align-items:center;justify-content:center;padding:6px;font-size:18px;overflow-wrap:anywhere">${pictoOpts ? pictoSVG(c.id, 92) : label(c.name)}</button>`);
          b.onclick = () => pick(i, b, wrap);
          wrap.appendChild(b);
          return b;
        });
        async function pick(i, b) {
          if (answered) return;
          answered = true;
          const ms = tb.stop(), ok = i === ci;
          if (b) b.classList.add(ok ? 'right' : 'wrong');
          bs[ci].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          if (ok) { correct++; points += 5 + Math.ceil((TIME - ms) / 4000); }
          await ctx.wait(ok ? 600 : 1600);
          next();
        }
        ctx.el.appendChild(wrap);
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
