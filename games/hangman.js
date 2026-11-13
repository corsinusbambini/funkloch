/* Hangman: guess a made-up word letter by letter before the doodle is finished. Words are generated from syllables. */
(function () {
  const F = Funkloch;
  const ONSET = ['b', 'd', 'f', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'z', 'br', 'tr', 'kl', 'sp', 'st', 'fl', 'gr', 'pl'];
  const VOW = ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'o'];
  const CODA = ['', '', '', 'n', 'l', 'r', 's', 't', 'm'];
  const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const PER_ROW = 7; // 26 keys -> rows of 7, 7, 7 and a centred 5

  function makeWord(r, lvl) {
    const syl = lvl >= 5 ? 4 : lvl >= 2 ? 3 : 2;
    let w = '';
    for (let i = 0; i < syl; i++) {
      w += r.pick(ONSET) + r.pick(VOW) + (i === syl - 1 || r.chance(0.3) ? r.pick(CODA) : '');
    }
    return w.toUpperCase();
  }

  // Hand-drawn scene: grassy hill, wooden gallows with grain, the doodle grows one part per mistake,
  // and six hearts on the right show the mistakes left. `lost` gives the doodle cross eyes.
  function figure(wrong, max, lost, fresh) {
    const ink = 'stroke:var(--ink)';
    const p = [
      `<circle cx="132" cy="62" r="15" style="fill:var(--card);${ink}"/>` +
        (lost ? '<path d="M125,57 l5,5 m0,-5 l-5,5 M134,57 l5,5 m0,-5 l-5,5" stroke-width="2.5"/>'
          : '<circle cx="127" cy="60" r="1.8" style="fill:var(--ink)"/><circle cx="137" cy="60" r="1.8" style="fill:var(--ink)"/><path d="M127,68 q5,3 10,0" stroke-width="2.5"/>'),
      `<path d="M131,77 C134,90 129,100 132,112" stroke-width="5"/><path d="M128,82 l7,0" style="stroke:var(--c-focus)" stroke-width="6"/>`,
      '<path d="M131,84 C124,92 118,96 112,103"/>',
      '<path d="M132,84 C139,91 145,96 152,102"/>',
      '<path d="M132,112 C127,124 122,133 117,141"/>',
      '<path d="M132,112 C137,123 142,133 148,141"/>',
    ];
    const parts = p.slice(0, wrong).map((s, i) => `<g class="${fresh && i === wrong - 1 ? 'tap-pop' : ''}" style="transform-box:fill-box;transform-origin:center">${s}</g>`).join('');
    const hearts = Array.from({ length: max }, (_, i) => {
      const y = 22 + i * 24, full = i >= wrong;
      return `<path d="M205,${y + 7} C196,${y} 197,${y - 7} 205,${y - 3} C213,${y - 7} 214,${y} 205,${y + 7} Z" style="fill:${full ? 'var(--bad)' : 'none'};stroke:${full ? 'var(--ink)' : 'var(--ink-faint)'}" stroke-width="2" ${full ? '' : 'stroke-dasharray="3 3"'}/>`;
    }).join('');
    return `<svg class="motif" viewBox="0 0 224 172" style="width:100%;max-width:262px;transform:rotate(-1.5deg)" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6,166 C40,150 92,148 120,152 C160,156 190,150 218,164 Z" style="fill:var(--c-spatial);${ink}" stroke-width="2.5"/>
      <path d="M20,158 l3,-6 l2,6 M176,156 l3,-7 l2,7 M98,153 l2,-5 l3,5" stroke-width="2"/>
      <path d="M48,154 L47,20 L59,19 L60,153 Z" style="fill:var(--c-memory);${ink}" stroke-width="2.5"/>
      <path d="M40,22 L138,19 L139,30 L41,32 Z" style="fill:var(--c-memory);${ink}" stroke-width="2.5"/>
      <path d="M52,38 l1,30 M55,80 l0,26 M52,118 l1,22 M70,24 l26,-1 M104,26 l20,-1" style="stroke:var(--ink-soft)" stroke-width="1.5"/>
      <path d="M58,62 L86,31" style="stroke:var(--ink)" stroke-width="5"/>
      <path d="M132,30 C130,36 134,40 132,47" style="stroke:var(--ink-soft)" stroke-width="3"/>
      <path d="M38,156 l30,-1" stroke-width="5"/>
      ${parts}${hearts}</svg>`;
  }

  F.registerGame({
    id: 'hangman', skill: 'logic', added: '2026-11-12', glyph: '_A_',
    name: { de: 'Galgenmännchen', en: 'Hangman' },
    desc: {
      de: 'Ein erfundenes Wort versteckt sich hinter Strichen. Tippe Buchstaben: Richtige erscheinen im Wort, bei falschen wächst das Männchen. Nach 6 Fehlern ist die Runde verloren. Errate 3 Wörter, möglichst mit wenig Fehlern. Tipp: Die Wörter bestehen aus Silben wie "ba-ko".',
      en: 'A made-up word hides behind dashes. Tap letters: right ones appear in the word, wrong ones add to the doodle. Six mistakes and the round is lost. Guess 3 words, with as few mistakes as you can. Tip: the words are built from syllables like "ba-ko".',
    },
    start(ctx) {
      const r = ctx.rng, WORDS = 3, MAX = 6;
      let round = 0, solved = 0, points = 0, mistakes = 0;

      function next() {
        if (round >= WORDS) return end();
        round++;
        ctx.setScore(points); ctx.setInfo(`${round} / ${WORDS}`);
        const word = ctx.fresh(() => makeWord(r, ctx.level), (w) => w);
        const got = new Set();
        let wrong = 0, over = false;
        ctx.el.innerHTML = '';
        const fig = F.h('<div style="text-align:center;margin-top:2px;min-height:150px"></div>');
        const shown = F.h('<div class="card sketch pop-in" style="display:flex;justify-content:center;flex-wrap:nowrap;padding:14px 8px 12px;margin:6px 0 8px;min-height:68px"></div>');
        const msg = F.h('<div class="info-line" style="text-align:center;min-height:26px"></div>');
        const gap = 8, kw = `calc((100% - ${(PER_ROW - 1) * gap}px) / ${PER_ROW})`;
        const pad = F.h(`<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:${gap}px;margin-top:6px"></div>`);
        const btns = {};
        const letters = word.split('');
        // Letter tiles on drawn lines; they shrink a little for long words so nothing wraps.
        const cw = Math.max(17, Math.min(30, Math.floor(318 / letters.length) - 4));
        const tiles = letters.map(() => {
          const s = F.h(`<span style="display:inline-block;width:${cw}px;margin:0 2px;text-align:center;font-size:${Math.max(18, Math.round(cw * 1.15))}px;line-height:1.15;border-bottom:3px solid var(--ink);border-radius:0 0 3px 2px"></span>`);
          shown.appendChild(s);
          return s;
        });
        const lastShown = letters.map(() => false);
        function render(fresh) {
          fig.innerHTML = figure(wrong, MAX, over && wrong >= MAX, fresh);
          const solvedNow = letters.every((c) => got.has(c));
          tiles.forEach((s, i) => {
            const c = letters[i], vis = got.has(c) || over;
            s.textContent = vis ? c : ' ';
            s.style.color = vis && !got.has(c) ? 'var(--bad)' : '';
            if (vis && !lastShown[i]) { s.classList.remove('tap-pop'); void s.offsetWidth; s.classList.add('tap-pop'); }
            lastShown[i] = vis;
          });
          if (!over) msg.textContent = F.tt({ de: `Fehler: ${wrong} / ${MAX}`, en: `Mistakes: ${wrong} / ${MAX}` });
          shown.style.background = over && solvedNow ? 'var(--c-spatial)' : '';
        }
        KEYS.forEach((k) => {
          const b = F.h(`<button style="flex:0 0 ${kw};min-width:0;padding:0;min-height:54px;font-size:24px;background:var(--card);color:var(--ink);border:2.5px solid var(--ink);border-radius:12px 16px 12px 14px;box-shadow:var(--shadow);cursor:pointer">${k}</button>`);
          btns[k] = b;
          b.addEventListener('pointerdown', async (e) => {
            e.preventDefault();
            if (over || b.disabled) return;
            b.disabled = true;
            b.style.boxShadow = 'none'; b.style.transform = 'translate(2px,2px)';
            const hit = word.includes(k);
            if (hit) {
              got.add(k); b.style.background = 'var(--good)'; b.style.color = '#1f2a22'; ctx.sfx('good');
            } else {
              wrong++; mistakes++; b.style.background = 'var(--bad)'; b.style.color = '#2a1f1f'; b.style.opacity = '.6'; b.style.textDecoration = 'line-through'; ctx.sfx('bad');
            }
            const win = word.split('').every((c) => got.has(c));
            if (win || wrong >= MAX) {
              over = true;
              if (win) { solved++; points += 10 + (MAX - wrong) * 3; ctx.sfx('win'); if (round < WORDS) F.cheer(8); }
              render(!hit);
              msg.textContent = win ? F.tt({ de: 'Geschafft!', en: 'Solved!' }) : F.tt({ de: `Das Wort war: ${word}`, en: `The word was: ${word}` });
              shown.classList.add(win ? 'flash-ok' : 'flash-bad');
              await ctx.wait(win ? 900 : 1800);
              next();
            } else render(!hit);
          });
          pad.appendChild(b);
        });
        ctx.el.appendChild(fig); ctx.el.appendChild(shown); ctx.el.appendChild(msg); ctx.el.appendChild(pad);
        render(false);
      }

      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${solved}/${WORDS} Wörter, ${mistakes} Fehler`, en: `${solved}/${WORDS} words, ${mistakes} mistakes` }),
          levelDelta: solved === WORDS && mistakes <= 6 ? 1 : solved <= 1 ? -1 : 0,
          quality: solved / WORDS, ink: 3 + solved * 4,
        });
      }
      next();
    },
  });
})();
