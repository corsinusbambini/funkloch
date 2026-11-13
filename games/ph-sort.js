/* pH Lab: work out the pH of generated acid/base solutions, and sort solutions from acidic to basic. */
(function () {
  const F = Funkloch;
  const round1 = (x) => Math.round(x * 10) / 10;
  // acid: [formula, H+ per formula unit]; base: [formula, OH- per formula unit]
  const ACIDS = [['HCl', 1], ['HNO₃', 1], ['HBr', 1], ['H₂SO₄', 2]];
  const BASES = [['NaOH', 1], ['KOH', 1], ['Ca(OH)₂', 2]];
  const MANT = [[1, 0], [2, 0.3], [5, 0.7]]; // mantissa and -log10(mantissa)

  // One solution: concentration m·10^-k mol/L of a strong acid or base (full dissociation).
  function makeSolution(r, lvl, allowNeutral) {
    if (allowNeutral && r.chance(0.12)) return { text: F.tt({ de: 'reines Wasser (25 °C)', en: 'pure water (25 °C)' }), pH: 7, kind: 'neutral' };
    const acid = r.chance(0.5);
    const [f, n] = r.pick(lvl >= 4 ? (acid ? ACIDS : BASES) : (acid ? ACIDS : BASES).filter((x) => x[1] === 1));
    let mant, k;
    if (n === 2) { // doubled ions: pick c so that n·c is a clean value
      const half = r.chance(0.5);
      k = r.int(2, 4);
      mant = half ? 5 : 1; // 5·10^-k doubles to 10^-(k-1); 1·10^-k doubles to 2·10^-k
      const conc = half ? k - 1 : k;
      const frac = half ? 0 : 0.3; // 1e-k·2 = 2e-k -> -log = k - 0.3
      const p = round1(conc - frac);
      return { text: `${mant === 5 ? '0.' + '0'.repeat(k - 1) + '5' : '0.' + '0'.repeat(k - 1) + '1'} M ${f}`, pH: acid ? p : round1(14 - p), kind: acid ? 'acid' : 'base' };
    }
    const m = lvl >= 3 ? r.pick(MANT) : MANT[0];
    k = r.int(1, lvl >= 2 ? 4 : 3);
    const p = round1(k - m[1]);
    const digits = m[0] + '';
    const text = `${'0.' + '0'.repeat(k - 1) + digits} M ${f}`;
    return { text, pH: acid ? p : round1(14 - p), kind: acid ? 'acid' : 'base' };
  }

  // Hand-drawn beaker with a pH meter probe and a dropping pipette. Decoration only: the liquid colour never depends on the answer.
  const beaker = (i, h) => {
    const bx = [0, 18, 34, 10][i % 4];
    return `<svg class="motif" viewBox="0 0 320 140" width="${Math.round(h * 320 / 140)}" height="${h}" aria-hidden="true" style="margin:14px auto 16px;transform:rotate(${i % 2 ? 1.3 : -1.5}deg);stroke:var(--ink);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;fill:none">
    <path d="M20 134 C100 131 220 137 300 132"/>
    <path d="M104 64 C108 82 106 110 112 126 C140 130 176 130 206 126 C212 108 210 82 214 64 Z" style="fill:var(--c-focus)"/>
    <path d="M98 24 L104 30 L112 126 C140 130 176 130 206 126 L214 30 L222 26" style="stroke-width:3"/>
    <path d="M104 64 C130 60 150 68 176 63 C192 60 204 64 214 64" style="stroke-width:2.2"/>
    <path d="M196 44 L196 104 M190 54 L196 54 M190 74 L196 74 M190 94 L196 94" style="stroke-width:2"/>
    <path d="M122 46 L120 110" style="stroke:#fff;opacity:.7;stroke-width:3"/>
    <circle cx="${140 + bx}" cy="104" r="4" style="fill:var(--card)"/><circle cx="${152 + bx / 2}" cy="88" r="3" style="fill:var(--card)"/><circle cx="${134 + bx}" cy="80" r="2.5" style="fill:var(--card)"/>
    <path d="M168 6 L168 112 C168 118 178 118 178 112 L178 6" style="fill:var(--paper-2)"/>
    <path d="M168 100 C171 104 175 104 178 100"/>
    <path d="M236 18 L296 18 L296 66 L236 66 Z" style="fill:var(--card)"/>
    <path d="M244 26 L288 26 L288 44 L244 44 Z" style="fill:var(--c-chem)"/>
    <path d="M252 35 L258 35 M266 35 L272 35 M278 35 L282 35" style="stroke-width:3"/>
    <circle cx="252" cy="55" r="4" style="fill:var(--accent)"/><circle cx="268" cy="55" r="4" style="fill:var(--card)"/>
    <path d="M236 30 C212 24 196 10 178 8" style="stroke-width:2"/>
    <path d="M52 10 C46 10 44 18 48 22 L60 22 C64 18 62 10 56 10 Z" style="fill:var(--c-fun)"/>
    <path d="M50 22 L52 68 L56 74 L58 68 L58 22 Z" style="fill:var(--card)"/>
    <path d="M55 84 C51 90 51 94 55 95 C59 94 59 90 55 84 Z" style="fill:var(--c-focus)"/>
    <path d="M70 50 L76 46 M72 64 L80 64" style="stroke-width:2"/>
  </svg>`;
  };

  function makeQuestion(r, lvl) {
    const s = makeSolution(r, lvl, lvl >= 2);
    const ans = s.pH;
    const wrongs = [14 - ans, ans + 1, ans - 1, ans + 2, ans - 2, round1(ans / 2), ans + 3, ans - 3, ans + 0.3, ans - 0.3].map(round1);
    return { s, ans, wrongs, key: s.text };
  }

  function makeSort(r, lvl) {
    for (let t = 0; t < 30; t++) {
      const list = [];
      for (let i = 0; i < 4; i++) list.push(makeSolution(r, lvl, true));
      const seen = new Set(list.map((x) => x.pH));
      if (seen.size === 4) {
        const texts = new Set(list.map((x) => x.text));
        if (texts.size === 4) return { list, key: list.map((x) => x.text).sort().join('|') };
      }
    }
    // bounded fallback: fixed distinct solutions
    return { list: [{ text: '0.1 M HCl', pH: 1 }, { text: '0.001 M HCl', pH: 3 }, { text: '0.001 M NaOH', pH: 11 }, { text: '0.1 M NaOH', pH: 13 }], key: 'fallback' };
  }

  F.registerGame({
    id: 'ph-sort', skill: 'chem', added: '2026-11-06', glyph: 'pH',
    name: { de: 'pH-Labor', en: 'pH Lab' },
    desc: {
      de: 'Starke Säuren und Laugen sind vollständig dissoziiert. Rechne den pH-Wert aus (pH = −log[H⁺], pH + pOH = 14) und tippe die richtige Zahl. Manchmal sortierst du Lösungen von sauer zu basisch. 10 Runden, je schneller desto mehr Punkte.',
      en: 'Strong acids and bases are fully dissociated. Work out the pH (pH = −log[H⁺], pH + pOH = 14) and tap the right number. Sometimes you sort solutions from acidic to basic. 10 rounds, the faster the more points.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 10, TIME = 30000;
      let round = 0, correct = 0, points = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        ctx.el.innerHTML = '';
        if (round % 3 === 0) return sortRound();
        const q = ctx.fresh(() => makeQuestion(r, ctx.level), (x) => x.key);
        const seen = new Set([q.ans]), opts = [q.ans];
        r.shuffle(q.wrongs).forEach((w) => { if (opts.length < 4 && w >= 0 && w <= 14 && !seen.has(w)) { seen.add(w); opts.push(w); } });
        for (let k = 1; opts.length < 4 && k < 30; k++) { // bounded fallback
          const c = round1(q.ans + k * 0.5);
          if (c >= 0 && c <= 14 && !seen.has(c)) { seen.add(c); opts.push(c); }
        }
        const sh = r.shuffle(opts), ci = sh.indexOf(q.ans);
        ctx.el.appendChild(F.h(`<div class="card sketch big-display pop-in" style="font-size:36px;flex-direction:column;gap:8px;text-align:center;word-break:normal;letter-spacing:1px;min-height:180px;padding:18px 10px"><span>${q.s.text}</span><span style="font-size:18px;color:var(--ink-soft);letter-spacing:0">${F.tt({ de: 'Welchen pH-Wert hat die Lösung?', en: 'What is the pH of the solution?' })}</span></div>`));
        let answered = false;
        const tb = ctx.timer(ctx.el, TIME, () => pick(-1, null, optEl));
        ctx.el.appendChild(F.h(beaker(round, 140)));
        const optEl = F.options(sh.map((v) => `pH ${v % 1 ? v.toFixed(1) : v}`), (i, b, wrap) => pick(i, b, wrap), 'tall');
        async function pick(i, b, wrap) {
          if (answered) return;
          answered = true;
          const ms = tb.stop(), ok = i === ci;
          if (b) b.classList.add(ok ? 'right' : 'wrong', ok ? 'tap-pop' : 'flash-bad');
          wrap.children[ci].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          if (ok) { correct++; points += 5 + Math.ceil((TIME - ms) / 3000); if (round < ROUNDS) F.cheer(8); }
          await ctx.wait(ok ? 600 : 1700);
          next();
        }
        ctx.el.appendChild(optEl);
      }
      function sortRound() {
        const puz = ctx.fresh(() => makeSort(r, ctx.level), (x) => x.key);
        const order = r.shuffle(puz.list);
        const target = puz.list.slice().sort((a, b) => a.pH - b.pH);
        let step = 0, mistakes = 0, locked = false;
        ctx.el.appendChild(F.h(`<div class="card sketch big-display pop-in" style="font-size:28px;flex-direction:column;gap:6px;text-align:center;word-break:normal;letter-spacing:0;min-height:0;padding:16px 10px"><span>${F.tt({ de: 'Sortiere: sauer → basisch', en: 'Sort: acidic → basic' })}</span><span style="font-size:18px;color:var(--ink-soft)">${F.tt({ de: 'Tippe zuerst die sauerste Lösung (kleinster pH).', en: 'Tap the most acidic one first (lowest pH).' })}</span></div>`));
        ctx.el.appendChild(F.h(beaker(round, 104)));
        const wrap = F.h(`<div style="display:flex;flex-direction:column;gap:12px;max-width:340px;margin:0 auto"></div>`);
        order.forEach((s) => {
          const b = F.h(`<button class="opt" style="min-height:70px;font-size:24px"><span class="num" style="display:inline-block;min-width:30px"></span>${s.text}</button>`);
          b.onclick = async () => {
            if (locked || b.dataset.done) return;
            if (s.pH === target[step].pH) {
              b.dataset.done = '1'; step++;
              b.classList.add('right', 'tap-pop');
              b.querySelector('.num').textContent = step + '.';
              b.disabled = true;
              ctx.sfx('tick');
              if (step === 4) {
                locked = true;
                const ok = mistakes === 0;
                if (ok) correct++;
                points += Math.max(3, 14 - mistakes * 4);
                ctx.sfx(ok ? 'good' : 'bad');
                if (ok && round < ROUNDS) F.cheer(8);
                await ctx.wait(1000);
                next();
              }
            } else {
              mistakes++; ctx.sfx('bad');
              b.classList.add('wrong', 'flash-bad');
              await ctx.wait(500);
              b.classList.remove('wrong', 'flash-bad');
            }
          };
          wrap.appendChild(b);
        });
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
