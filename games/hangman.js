/* Hangman: guess a made-up word letter by letter before the doodle is finished. Words are generated from syllables. */
(function () {
  const F = Funkloch;
  const ONSET = ['b', 'd', 'f', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'z', 'br', 'tr', 'kl', 'sp', 'st', 'fl', 'gr', 'pl'];
  const VOW = ['a', 'e', 'i', 'o', 'u', 'a', 'e', 'o'];
  const CODA = ['', '', '', 'n', 'l', 'r', 's', 't', 'm'];
  const KEYS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const ROWS = 6; // 26 keys -> 5 rows of 6

  function makeWord(r, lvl) {
    const syl = lvl >= 5 ? 4 : lvl >= 2 ? 3 : 2;
    let w = '';
    for (let i = 0; i < syl; i++) {
      w += r.pick(ONSET) + r.pick(VOW) + (i === syl - 1 || r.chance(0.3) ? r.pick(CODA) : '');
    }
    return w.toUpperCase();
  }

  function figure(wrong) {
    const p = [
      '<circle cx="90" cy="44" r="14"/>', '<path d="M90,58 L90,100"/>', '<path d="M90,68 L70,88"/>',
      '<path d="M90,68 L110,88"/>', '<path d="M90,100 L74,128"/>', '<path d="M90,100 L106,128"/>',
    ];
    return `<svg viewBox="0 0 160 150" style="width:150px;height:140px;color:var(--ink)" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20,140 L140,140 M40,140 L40,12 L90,12 L90,30" opacity=".8"/>${p.slice(0, wrong).join('')}</svg>`;
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
        const fig = F.h('<div style="text-align:center;margin-top:4px"></div>');
        const shown = F.h('<div class="card sketch pop-in" style="font-size:30px;letter-spacing:2px;text-align:center;padding:14px 6px;margin:6px 0 10px;overflow-wrap:anywhere;min-height:60px"></div>');
        const msg = F.h('<div class="info-line" style="text-align:center;min-height:26px"></div>');
        const pad = F.h(`<div style="display:grid;grid-template-columns:repeat(${ROWS}, minmax(0, 1fr));gap:8px;margin-top:6px"></div>`);
        const btns = {};
        function render() {
          fig.innerHTML = figure(wrong);
          shown.textContent = word.split('').map((c) => (got.has(c) || over ? c : '_')).join(' ');
          if (over && !word.split('').every((c) => got.has(c))) shown.style.color = 'var(--bad)'; else shown.style.color = '';
          msg.textContent = over ? '' : F.tt({ de: `Fehler: ${wrong} / ${MAX}`, en: `Mistakes: ${wrong} / ${MAX}` });
        }
        KEYS.forEach((k) => {
          const b = F.h(`<button style="min-width:0;padding:0;min-height:50px;font-size:22px;background:var(--card);color:var(--ink);border:2.5px solid var(--ink);border-radius:12px 16px 12px 14px;box-shadow:var(--shadow);cursor:pointer">${k}</button>`);
          btns[k] = b;
          b.addEventListener('pointerdown', async (e) => {
            e.preventDefault();
            if (over || b.disabled) return;
            b.disabled = true; b.style.opacity = '.35';
            if (word.includes(k)) {
              got.add(k); b.style.background = 'var(--good)'; b.style.color = '#1f2a22'; ctx.sfx('good');
            } else {
              wrong++; mistakes++; b.style.background = 'var(--bad)'; b.style.color = '#2a1f1f'; ctx.sfx('bad');
            }
            const win = word.split('').every((c) => got.has(c));
            if (win || wrong >= MAX) {
              over = true;
              if (win) { solved++; points += 10 + (MAX - wrong) * 3; ctx.sfx('win'); }
              render();
              msg.textContent = win ? F.tt({ de: 'Geschafft!', en: 'Solved!' }) : F.tt({ de: `Das Wort war: ${word}`, en: `The word was: ${word}` });
              await ctx.wait(win ? 900 : 1800);
              next();
            } else render();
          });
          pad.appendChild(b);
        });
        ctx.el.appendChild(fig); ctx.el.appendChild(shown); ctx.el.appendChild(msg); ctx.el.appendChild(pad);
        render();
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
