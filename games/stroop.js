/* Stroop: a colour word is written in another colour. Tap the button of the INK colour, not the word. */
(function () {
  const F = Funkloch;
  const COLS = [
    { id: 'red', hex: '#E53935', de: 'Rot', en: 'Red' },
    { id: 'blue', hex: '#1E88E5', de: 'Blau', en: 'Blue' },
    { id: 'green', hex: '#2E9E44', de: 'Grün', en: 'Green' },
    { id: 'yellow', hex: '#E5A800', de: 'Gelb', en: 'Yellow' },
    { id: 'purple', hex: '#9C3FBF', de: 'Violett', en: 'Purple' },
  ];
  F.registerGame({
    id: 'stroop', skill: 'focus', added: '2026-11-01', glyph: 'Rot',
    name: { de: 'Farbe oder Wort?', en: 'Colour or Word?' },
    desc: {
      de: 'Ein Farbwort ist in einer anderen Farbe geschrieben. Tippe die Farbe, in der es geschrieben ist – nicht, was es sagt! 40 Sekunden, jeder Fehler kostet einen Punkt.',
      en: 'A colour word is written in a different colour. Tap the colour of the ink – not what the word says! 40 seconds, every mistake costs a point.',
    },
    start(ctx) {
      const r = ctx.rng, DUR = 40000;
      const nCols = Math.min(5, 3 + Math.floor(ctx.level / 4));
      const pool = COLS.slice(0, nCols);
      const pIncong = Math.min(0.9, 0.6 + ctx.level * 0.03);
      let good = 0, bad = 0, over = false, cur = null, locked = false;
      const wordEl = F.h('<div class="card sketch pop-in" style="font-size:72px;line-height:1.1;text-align:center;padding:30px 8px;margin:12px 0;font-weight:bold;min-height:190px;display:flex;align-items:center;justify-content:center"></div>');
      // 3 colours: one row of 3. 4: two rows of 2. 5: 3 on top, 2 centred below (6-column grid, each button spans 2).
      const btns = F.h(`<div style="display:grid;grid-template-columns:repeat(${nCols === 4 ? 2 : nCols === 3 ? 3 : 6},minmax(0,1fr));gap:12px"></div>`);
      const msg = F.h('<div class="info-line" style="text-align:center;min-height:26px;margin-bottom:6px"></div>');
      // Hand-drawn inkwell with a quill and a few splashes, kept colourless so it never competes with the ink colours.
      const pot = F.h(`<svg class="motif" viewBox="0 0 320 130" width="${nCols === 3 ? 358 : 320}" height="${nCols === 3 ? 145 : 130}" aria-hidden="true" style="margin:4px auto 10px;transform:rotate(-1.5deg);stroke:var(--ink);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;fill:none">
        <path d="M20 122 C100 119 220 125 300 120"/>
        <path d="M112 62 C96 70 92 84 94 100 C96 112 104 118 116 118 L190 118 C202 118 210 112 212 100 C214 84 208 70 192 62 Z" style="fill:var(--paper-2)"/>
        <path d="M128 62 L130 48 L176 48 L178 62" style="fill:var(--card)"/><path d="M126 48 C140 44 166 44 180 48" />
        <path d="M108 84 C110 76 116 70 124 68" style="stroke:#fff;opacity:.7;stroke-width:3"/>
        <path d="M118 96 C140 92 166 100 188 94" style="stroke:var(--ink-soft);stroke-width:2;stroke-dasharray:6 5"/>
        <path d="M152 50 L214 8" style="stroke-width:2.4"/>
        <path d="M214 8 C232 0 262 6 274 14 C254 16 236 22 222 30 C214 34 206 32 204 26 C202 18 206 12 214 8 Z" style="fill:var(--card)"/>
        <path d="M214 18 C232 12 250 12 266 14" style="stroke:var(--ink-faint);stroke-width:2"/>
        <path d="M46 104 C42 96 50 90 56 96 C62 90 70 98 64 104 C68 110 58 116 54 110 C48 114 40 110 46 104 Z" style="fill:var(--ink-faint)"/>
        <circle cx="74" cy="92" r="3.5" style="fill:var(--ink-faint)"/><circle cx="32" cy="88" r="2.5" style="fill:var(--ink-faint)"/>
        <path d="M246 108 C244 100 254 96 258 102 C264 98 272 106 266 110 C262 116 250 114 246 108 Z" style="fill:var(--ink-faint)"/>
        <circle cx="280" cy="98" r="3" style="fill:var(--ink-faint)"/>
      </svg>`);
      ctx.el.append(wordEl, pot, msg, btns);
      const flash = (el, cls) => { el.classList.remove('tap-pop', 'flash-bad'); void el.offsetWidth; el.classList.add(cls); };
      const order = r.shuffle(pool.slice()); // fixed button order so muscle memory helps
      order.forEach((c, k) => {
        const span = nCols === 5 ? (k === 3 ? 'grid-column:2 / span 2;' : k === 4 ? 'grid-column:4 / span 2;' : 'grid-column:span 2;') : '';
        const b = F.h(`<button style="${span}min-width:0;min-height:${nCols === 3 ? 120 : 84}px;padding:4px;font-size:24px;border:3px solid var(--ink);border-radius:14px;background:var(--card);color:var(--ink);box-shadow:var(--shadow);font-family:inherit;cursor:pointer">${F.tt(c)}</button>`);
        b.onclick = () => { if (!over && !locked && cur) flash(b, c === cur.ink ? 'tap-pop' : 'flash-bad'); answer(c); };
        btns.appendChild(b);
      });
      function next() {
        const ink = r.pick(pool);
        const word = r.chance(pIncong) ? r.pick(pool.filter((c) => c !== ink)) : ink;
        cur = { ink, word };
        wordEl.textContent = F.tt(word);
        wordEl.style.color = ink.hex;
        locked = false;
      }
      function answer(c) {
        if (over || locked || !cur) return;
        if (c === cur.ink) { good++; ctx.sfx('good'); msg.textContent = ''; }
        else { bad++; ctx.sfx('bad'); msg.textContent = F.tt({ de: 'Falsch – zähl die Tintenfarbe!', en: 'Wrong – go by the ink colour!' }); }
        ctx.setScore(Math.max(0, good - bad));
        next();
      }
      function end() {
        over = true;
        const s = Math.max(0, good - bad);
        ctx.finish({
          score: s, detail: F.tt({ de: `${good} richtig, ${bad} falsch`, en: `${good} right, ${bad} wrong` }),
          levelDelta: s >= 25 ? 1 : s < 12 ? -1 : 0,
          quality: Math.min(1, s / 35), ink: 3 + Math.round(s / 3),
        });
      }
      ctx.setScore(0);
      ctx.timer(ctx.el, DUR, end);
      next();
    },
  });
})();
