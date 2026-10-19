/* Dilution Lab: C1·V1 = C2·V2 and m = c·V·M with freshly generated lab tasks. */
(function () {
  const F = Funkloch;
  const SUBST = [['NaCl', 58.44], ['KCl', 74.55], ['NaOH', 40.0], ['HCl', 36.46], ['CuSO₄', 159.61], ['C₆H₁₂O₆', 180.16],
    ['KNO₃', 101.1], ['NH₄Cl', 53.49], ['MgSO₄', 120.37], ['Na₂CO₃', 105.99], ['KMnO₄', 158.03], ['CaCl₂', 110.98], ['AgNO₃', 169.87]];
  const fmt = (x) => { const s = Number(x.toPrecision(4)); return String(s); };
  const C1S = [0.5, 1, 2, 2.5, 4, 5, 10];
  const FACT = [2, 4, 5, 8, 10, 20, 25, 40, 50, 100];
  const V2S = [50, 100, 200, 250, 500, 1000];

  function task(r, level) {
    const [sub, M] = r.pick(SUBST);
    const types = level >= 2 ? ['v1', 'c2', 'water', 'v2', 'mass', 'percent'] : ['v1', 'c2', 'water', 'v2'];
    const type = r.pick(types);
    const C1 = r.pick(C1S), f = r.pick(FACT), V2 = r.pick(V2S);
    const C2 = C1 / f, V1 = V2 / f;
    const u = 'mol/L';
    switch (type) {
      case 'v1': return { q: { de: `Du brauchst <b>${V2} mL</b> ${sub} mit <b>${fmt(C2)} ${u}</b>. Die Stammlösung hat <b>${C1} ${u}</b>. Wie viel Stammlösung nimmst du?`, en: `You need <b>${V2} mL</b> of ${sub} at <b>${fmt(C2)} ${u}</b>. The stock is <b>${C1} ${u}</b>. How much stock do you take?` }, a: V1, unit: 'mL' };
      case 'c2': return { q: { de: `<b>${fmt(V1)} mL</b> ${sub} (${C1} ${u}) werden auf <b>${V2} mL</b> aufgefüllt. Welche Konzentration hat die neue Lösung?`, en: `<b>${fmt(V1)} mL</b> of ${sub} (${C1} ${u}) are topped up to <b>${V2} mL</b>. What is the new concentration?` }, a: C2, unit: u };
      case 'water': return { q: { de: `Aus ${sub} mit <b>${C1} ${u}</b> sollen <b>${V2} mL</b> mit <b>${fmt(C2)} ${u}</b> werden. Wie viel Wasser gibst du dazu?`, en: `From ${sub} at <b>${C1} ${u}</b> you want <b>${V2} mL</b> at <b>${fmt(C2)} ${u}</b>. How much water do you add?` }, a: V2 - V1, unit: 'mL' };
      case 'v2': return { q: { de: `Du hast <b>${fmt(V1)} mL</b> ${sub} mit <b>${C1} ${u}</b> und willst <b>${fmt(C2)} ${u}</b>. Auf welches Endvolumen füllst du auf?`, en: `You have <b>${fmt(V1)} mL</b> of ${sub} at <b>${C1} ${u}</b> and want <b>${fmt(C2)} ${u}</b>. What final volume do you fill to?` }, a: V2, unit: 'mL' };
      case 'mass': {
        const c = r.pick([0.01, 0.05, 0.1, 0.2, 0.25, 0.5, 1]), V = r.pick([50, 100, 250, 500, 1000]);
        return { q: { de: `Wie viel <b>${sub}</b> (M = ${M} g/mol) wiegst du ein für <b>${V} mL</b> mit <b>${c} ${u}</b>?`, en: `How much <b>${sub}</b> (M = ${M} g/mol) do you weigh out for <b>${V} mL</b> at <b>${c} ${u}</b>?` }, a: c * (V / 1000) * M, unit: 'g' };
      }
      default: {
        const p1 = r.pick([96, 70, 50, 40, 30, 20, 10]), p2 = p1 / r.pick([2, 4, 5, 10]);
        return { q: { de: `Ethanol <b>${p1} %</b> soll zu <b>${V2} mL</b> mit <b>${fmt(p2)} %</b> verdünnt werden. Wie viel ${p1}-%-Ethanol brauchst du?`, en: `Dilute ethanol <b>${p1} %</b> to <b>${V2} mL</b> at <b>${fmt(p2)} %</b>. How much ${p1} % ethanol do you need?` }, a: (p2 * V2) / p1, unit: 'mL' };
      }
    }
  }

  F.registerGame({
    id: 'dilution', skill: 'chem', glyph: 'C₁V₁',
    name: { de: 'Verdünnungslabor', en: 'Dilution Lab' },
    desc: {
      de: 'Echte Laborrechnungen: Verdünnen (C₁·V₁ = C₂·V₂), Wasser zugeben, Einwaage (m = c·V·M). Jedes Mal neue Werte. 6 Aufgaben, Abweichung bis 1 % zählt als richtig.',
      en: 'Real lab maths: dilutions (C₁·V₁ = C₂·V₂), adding water, weighing out (m = c·V·M). New values every time. 6 tasks, within 1 % counts as right.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 6;
      let round = 0, correct = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(correct);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const t = ctx.fresh(() => task(r, ctx.level), (x) => x.q.en);
        let typed = '', locked = false;
        ctx.el.innerHTML = '';
        const q = F.h(`<div class="card sketch" style="font-size:20px">${F.tt(t.q)}</div>`);
        const line = F.h('<div class="answer-line"></div>');
        const draw = () => { line.innerHTML = (typed || '&nbsp;') + ` <small class="muted">${t.unit}</small>`; };
        draw();
        const pad = F.keypad(async (k) => {
          if (locked) return;
          if (k === '⌫') typed = typed.slice(0, -1);
          else if (k === '.') { if (!typed.includes('.')) typed += typed ? '.' : '0.'; }
          else if (k === 'ok') {
            if (!typed) return;
            locked = true;
            const v = parseFloat(typed), ok = Math.abs(v - t.a) <= Math.abs(t.a) * 0.01 + 1e-9;
            ctx.sfx(ok ? 'good' : 'bad');
            if (ok) { correct++; line.classList.add('flash-ok'); }
            else { line.classList.add('flash-bad'); line.innerHTML = `<span style="color:var(--bad)">${typed}</span> → ${fmt(t.a)} <small>${t.unit}</small>`; }
            await ctx.wait(ok ? 800 : 2400);
            return next();
          } else if (typed.length < 9) typed += k;
          draw();
        }, { dot: true });
        ctx.el.append(q, line, pad);
      }
      function end() {
        ctx.finish({
          score: correct, display: `${correct} / ${ROUNDS}`,
          levelDelta: correct >= 5 ? 1 : correct <= 2 ? -1 : 0,
          quality: correct / ROUNDS, ink: 5 + correct * 3,
        });
      }
      next();
    },
  });
})();
