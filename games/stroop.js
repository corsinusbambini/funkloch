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
      const wordEl = F.h('<div class="card sketch pop-in" style="font-size:64px;text-align:center;padding:30px 8px;margin:12px 0;font-weight:bold;min-height:120px"></div>');
      const btns = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px"></div>');
      const msg = F.h('<div class="info-line" style="text-align:center;min-height:24px"></div>');
      ctx.el.append(wordEl, msg, btns);
      const order = r.shuffle(pool.slice()); // fixed button order so muscle memory helps
      order.forEach((c) => {
        const b = F.h(`<button style="min-width:0;min-height:64px;font-size:22px;border:3px solid var(--ink);border-radius:14px;background:var(--card);color:var(--ink);box-shadow:var(--shadow);font-family:inherit;cursor:pointer">${F.tt(c)}</button>`);
        b.onclick = () => answer(c);
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
