/* Lab Units: convert between lab units (L, mL, µL, g, mg, µg, mol, mmol ...). Generated numbers, 4 answers. */
(function () {
  const F = Funkloch;
  const ROUNDS = 10;
  // exp = power of ten relative to the base unit of that quantity.
  const CATS = {
    vol: { base: 'L', units: [['L', 0], ['dL', -1], ['mL', -3], ['µL', -6]], hard: [['dm³', 0], ['cm³', -3], ['m³', 3], ['mm³', -6]] },
    mass: { base: 'g', units: [['kg', 3], ['g', 0], ['mg', -3], ['µg', -6]], hard: [] },
    mol: { base: 'mol', units: [['mol', 0], ['mmol', -3], ['µmol', -6], ['kmol', 3]], hard: [] },
  };
  const MANT = [1, 2, 3, 4, 5, 6, 8, 12, 15, 25, 35, 45, 50, 75, 120, 250, 350, 450];

  // Number m * 10^k as a plain decimal string (no exponent notation).
  function fmt(m, k) {
    if (k >= 0) return String(m) + '0'.repeat(k);
    let s = String(m);
    const places = -k;
    if (s.length <= places) s = '0'.repeat(places - s.length + 1) + s;
    const out = s.slice(0, s.length - places) + '.' + s.slice(s.length - places);
    return out.replace(/0+$/, '').replace(/\.$/, '');
  }
  const motif = (cat) => ({
    vol: '<svg viewBox="0 0 60 80" width="58" height="78"><path d="M22,6 h16 M24,6 v22 L8,64 q-3,10 8,10 h28 q11,0 8,-10 L36,28 V6" style="fill:var(--card);stroke:var(--ink)" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/><path d="M13,54 q17,-8 34,0 l4,10 q2,6 -6,6 h-30 q-8,0 -6,-6 Z" style="fill:var(--c-chem);stroke:var(--ink)" stroke-width="2.4" stroke-linejoin="round"/><circle cx="26" cy="60" r="2.4" style="fill:var(--card)"/><circle cx="36" cy="64" r="1.8" style="fill:var(--card)"/></svg>',
    mass: '<svg viewBox="0 0 70 70" width="66" height="66"><path d="M10,60 h50 M35,60 V16" style="fill:none;stroke:var(--ink)" stroke-width="3.2" stroke-linecap="round"/><path d="M8,24 L62,24 M8,24 L2,40 h14 Z M62,24 L56,40 h14 Z" style="fill:var(--card);stroke:var(--ink)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/><circle cx="35" cy="14" r="5" style="fill:var(--c-chem);stroke:var(--ink)" stroke-width="2.6"/></svg>',
    mol: '<svg viewBox="0 0 70 70" width="66" height="66"><path d="M14,14 v40 q0,10 10,10 h22 q10,0 10,-10 V14" style="fill:var(--card);stroke:var(--ink)" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round"/><path d="M14,36 h42 v18 q0,10 -10,10 h-22 q-10,0 -10,-10 Z" style="fill:var(--c-chem);stroke:var(--ink)" stroke-width="2.4" stroke-linejoin="round"/>' + [[24, 48], [34, 54], [44, 46], [30, 42], [42, 57]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" style="fill:var(--card);stroke:var(--ink)" stroke-width="1.6"/>`).join('') + '</svg>',
  }[cat]);

  F.registerGame({
    id: 'lab-units', skill: 'chem', added: '2026-11-14', glyph: '⚗️',
    name: { de: 'Labor-Einheiten', en: 'Lab Units' },
    desc: {
      de: 'Rechne Laborgrössen um, zum Beispiel 350 mL in L oder 2.5 mg in µg. Tippe die richtige Zahl an. Zehn Aufgaben, mit der Zeit kommen kleinere und grössere Einheiten dazu. Mit 7 richtigen Antworten hast du gewonnen.',
      en: 'Convert lab quantities, for example 350 mL to L or 2.5 mg to µg. Tap the correct number. Ten questions, with smaller and bigger units coming in as you improve. Get 7 right to win.',
    },
    start(ctx) {
      const r = ctx.rng, level = Math.max(0, ctx.level || 0);
      const marks = [];
      let round = 0, right = 0, streak = 0, score = 0, over = false, locked = false;
      ctx.onCleanup(() => { over = true; });
      const cats = level < 2 ? ['vol'] : level < 4 ? ['vol', 'mass'] : ['vol', 'mass', 'mol'];
      const maxD = level < 2 ? 3 : level < 5 ? 6 : 9;

      ctx.el.innerHTML = '';
      const card = F.h(`<div class="sketch" style="padding:16px 12px;margin:6px 0 0;background:var(--card);box-shadow:var(--shadow);transform:rotate(-0.5deg);display:flex;align-items:center;justify-content:center;gap:14px;min-height:220px"><span class="lu-m" style="flex:none"></span><div style="min-width:0;text-align:center"><div class="lu-q" style="font-size:48px;line-height:1.15;word-break:keep-all"></div><div class="lu-s" style="font-size:18px;color:var(--ink-soft);margin-top:4px"></div></div></div>`);
      const opts = F.h('<div class="options tall" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:16px"></div>');
      const dots = F.h('<div class="lu-dots" style="display:flex;justify-content:center;gap:8px;margin-top:20px"></div>');
      ctx.el.append(card, opts, dots);
      const mEl = card.querySelector('.lu-m'), qEl = card.querySelector('.lu-q'), sEl = card.querySelector('.lu-s');

      function next() {
        const cat = r.pick(cats), C = CATS[cat];
        const pool = C.units.concat(level >= 6 ? C.hard : []);
        let a, b, d = 0;
        for (let g = 0; g < 40; g++) {
          a = r.pick(pool); b = r.pick(pool); d = a[1] - b[1];
          if (a[0] !== b[0] && d !== 0 && Math.abs(d) <= maxD) break;
          a = null;
        }
        if (!a) { a = pool[0]; b = pool[2]; d = a[1] - b[1]; }
        const m = r.pick(MANT), e = r.pick([-1, 0, 0, 1]);
        const k = e + d;
        if (k > 8 || k < -7) return next();
        const ans = fmt(m, k);
        // Distractors: classic slips (power of ten off, or the conversion turned the wrong way round).
        const wrong = new Set();
        [k - 1, k + 1, e - d, k + 2, k - 2, k + 3, k - 3].forEach((kk) => { const s = fmt(m, kk); if (s !== ans && kk <= 9 && kk >= -9) wrong.add(s); });
        const w = [...wrong];
        const picks = [];
        // Prefer the near misses and the flipped direction first.
        const prefer = [fmt(m, k - 1), fmt(m, k + 1), fmt(m, e - d)].filter((s) => s !== ans && w.includes(s));
        [...new Set(prefer)].forEach((s) => { if (picks.length < 3) picks.push(s); });
        for (const s of w) if (picks.length < 3 && !picks.includes(s)) picks.push(s);
        const all = [ans, ...picks];
        for (let i = all.length - 1; i > 0; i--) { const j = r.int(0, i); [all[i], all[j]] = [all[j], all[i]]; }
        mEl.innerHTML = motif(cat);
        qEl.innerHTML = `${F.esc(fmt(m, e))} <b>${a[0]}</b><br>= ? <b>${b[0]}</b>`;
        sEl.textContent = F.tt({ de: `Frage ${round + 1} von ${ROUNDS}`, en: `Question ${round + 1} of ${ROUNDS}` });
        card.classList.remove('pop-in'); void card.offsetWidth; card.classList.add('pop-in');
        opts.innerHTML = '';
        all.forEach((s) => {
          const bt = F.h(`<button class="btn" style="min-height:118px;font-size:34px;min-width:0;padding:6px;word-break:keep-all">${F.esc(s)}</button>`);
          bt.onclick = () => answer(bt, s === ans, all, ans);
          opts.appendChild(bt);
        });
        dots.innerHTML = Array.from({ length: ROUNDS }, (_, i) => `<svg viewBox="0 0 20 20" width="22" height="22"><circle cx="10" cy="10" r="7" style="fill:${i < round ? (marks[i] ? 'var(--good)' : 'var(--bad)') : i === round ? 'var(--accent)' : 'none'};stroke:var(--ink)" stroke-width="2.2"/></svg>`).join('');
        locked = false;
      }
      async function answer(bt, ok, all, ans) {
        if (over || locked) return;
        locked = true;
        marks[round] = ok;
        if (ok) {
          right++; streak++; score += 10 + Math.min(streak, 5) * 2;
          bt.classList.add('flash-ok'); bt.style.background = 'var(--good)'; ctx.sfx('good');
        } else {
          streak = 0; bt.classList.add('flash-bad'); bt.style.background = 'var(--bad)'; ctx.sfx('bad');
          [...opts.children].forEach((c) => { if (c.textContent === ans) c.style.background = 'var(--good)'; });
        }
        ctx.setScore(score);
        await ctx.wait(ok ? 650 : 1300);
        if (over) return;
        round++;
        if (round >= ROUNDS) return end();
        next();
      }
      function end() {
        over = true;
        const win = right >= 7;
        ctx.sfx(win ? 'win' : 'bad');
        ctx.finish({
          score,
          detail: F.tt({ de: `${right} von ${ROUNDS} richtig`, en: `${right} of ${ROUNDS} correct` }),
          levelDelta: right >= 9 ? 1 : right <= 4 ? -1 : 0,
          quality: right / ROUNDS, ink: 3 + right,
        });
      }
      next();
    },
  });
})();
