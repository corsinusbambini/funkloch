/* Number Hideout (memory): pebbles with numbers sit on the field. Tap number 1 and all the others hide,
   now tap the rest in order from memory. Each success adds one more number. 3 hearts. */
(function () {
  const F = Funkloch;
  const COLS = 5, ROWS = 6, MAXK = 14;

  F.registerGame({
    id: 'number-hideout', skill: 'memory', added: '2026-11-18', glyph: '①②③',
    name: { de: 'Zahlen-Versteck', en: 'Number Hideout' },
    desc: {
      de: 'Kieselsteine mit Zahlen liegen auf dem Feld. Tippe die 1: Dann verstecken sich alle anderen Zahlen. Tippe die Steine nun der Reihe nach aus dem Gedächtnis an. Jede Runde kommt eine Zahl dazu. Du hast 3 Herzen, gewinne mit möglichst vielen Zahlen.',
      en: 'Pebbles with numbers lie on the field. Tap the 1 and all the other numbers hide. Now tap the pebbles in order from memory. Every round adds one number. You have 3 hearts, win by remembering as many numbers as you can.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = ctx.level || 0;
      let k = Math.min(8, 4 + Math.floor(lvl / 2)), best = 0, hearts = 3, rounds = 0, over = false;
      const t = (o) => F.esc(F.tt(o));
      const startK = k;

      const pebble = (n, hidden, i) => {
        const j = ((i * 7) % 5 - 2);
        return `<svg viewBox="0 0 60 60" style="width:100%;height:100%;display:block" aria-hidden="true">
          <path d="M${8 + j},32 C6,14 24,6 36,7 C52,8 56,24 53,38 C50,52 32,55 20,52 C10,50 8,42 ${8 + j},32 Z" style="fill:${hidden ? 'var(--paper-2)' : 'var(--c-memory)'};stroke:var(--ink)" stroke-width="2.8" stroke-linejoin="round"/>
          <path d="M15,22 q4,-9 13,-10" fill="none" style="stroke:var(--card)" stroke-width="3" stroke-linecap="round" opacity=".7"/>
          ${hidden ? '' : `<text x="31" y="40" text-anchor="middle" font-size="28" font-weight="700" style="fill:#2B2522">${n}</text>`}</svg>`;
      };

      function round() {
        if (over) return;
        rounds++;
        ctx.setScore(best); ctx.setInfo(`♥ ${hearts}   ·   ${k}`);
        ctx.el.innerHTML = '';
        const cellsIdx = r.shuffle([...Array(COLS * ROWS).keys()]).slice(0, k);
        const numAt = {}; cellsIdx.forEach((c, n) => { numAt[c] = n + 1; });
        let expect = 1, hiding = false, locked = false;
        const head = F.h(`<div style="display:flex;justify-content:space-between;align-items:center;margin:4px 6px 8px;font-size:22px"><span class="nh-hearts"></span><span style="color:var(--ink-soft)">${t({ de: 'Zahlen', en: 'Numbers' })}: <b style="color:var(--ink)">${k}</b></span></div>`);
        const hrt = () => head.querySelector('.nh-hearts').innerHTML = Array.from({ length: 3 }, (_, i) => `<svg width="30" height="28" viewBox="0 0 30 28" aria-hidden="true" style="margin-right:4px"><path d="M15,25 C3,16 2,8 8,5 C12,3 15,6 15,9 C15,6 18,3 22,5 C28,8 27,16 15,25 Z" style="fill:${i < hearts ? 'var(--accent)' : 'var(--paper-2)'};stroke:var(--ink)" stroke-width="2.2" stroke-linejoin="round"/></svg>`).join('');
        hrt();
        const card = F.h(`<div class="sketch pop-in" style="padding:10px;background:var(--card);box-shadow:var(--shadow);transform:rotate(-0.3deg)"></div>`);
        const grid = F.h(`<div style="display:grid;grid-template-columns:repeat(${COLS},minmax(0,1fr));gap:6px"></div>`);
        const btns = [];
        for (let c = 0; c < COLS * ROWS; c++) {
          const b = F.h(`<button style="width:100%;min-width:0;padding:0;aspect-ratio:1;border:none;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent"></button>`);
          if (numAt[c]) {
            b.innerHTML = pebble(numAt[c], false, c);
            b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(c, b); });
          } else b.disabled = true;
          btns.push(b); grid.appendChild(b);
        }
        card.appendChild(grid);
        const msg = F.h('<div class="info-line" style="text-align:center;min-height:46px;margin:10px 0 0;font-size:20px"></div>');
        msg.textContent = F.tt({ de: 'Merke dir die Zahlen und tippe die 1.', en: 'Remember the numbers, then tap the 1.' });
        ctx.el.append(head, card, msg);

        async function tap(c, b) {
          if (over || locked || b.dataset.done) return;
          const n = numAt[c];
          if (!hiding) {
            if (n !== 1) { ctx.sfx('tick'); b.classList.remove('flash-bad'); void b.offsetWidth; b.classList.add('flash-bad'); return; }
            hiding = true;
            cellsIdx.forEach((cc) => { if (cc !== c) btns[cc].innerHTML = pebble(0, true, cc); });
            msg.textContent = F.tt({ de: 'Weiter mit der 2 …', en: 'Now the 2 …' });
          }
          if (n === expect) {
            ctx.sfx('tap'); b.dataset.done = '1';
            b.innerHTML = pebble(n, false, c).replace('var(--c-memory)', 'var(--good)');
            b.firstElementChild.classList.add('tap-pop');
            b.style.opacity = '0.55';
            expect++;
            if (expect > k) {
              locked = true; best = Math.max(best, k); ctx.setScore(best); ctx.sfx('win');
              F.cheer(8);
              msg.textContent = F.tt({ de: 'Super! Eine Zahl mehr. ⭐', en: 'Great! One more number. ⭐' });
              await ctx.wait(900); if (over) return;
              if (k >= MAXK) return end();
              k++; round();
            }
          } else {
            locked = true; hearts--; ctx.sfx('bad'); hrt();
            b.classList.add('flash-bad');
            cellsIdx.forEach((cc) => { if (!btns[cc].dataset.done) btns[cc].innerHTML = pebble(numAt[cc], false, cc); });
            msg.textContent = F.tt({ de: 'Das war nicht die ' + expect + '. Schau dir die Zahlen nochmals an.', en: 'That was not the ' + expect + '. Look at the numbers again.' });
            await ctx.wait(1800); if (over) return;
            if (hearts <= 0) return end();
            if (k > 3 && best < k) k = Math.max(3, k - 0);
            round();
          }
        }
      }
      function end() {
        if (over) return; over = true;
        const score = best * 6 + (hearts * 3);
        ctx.finish({
          score, detail: F.tt({ de: `${best} Zahlen gemerkt`, en: `${best} numbers remembered` }),
          levelDelta: best >= startK + 3 ? 1 : best < startK ? -1 : 0,
          quality: Math.min(1, best / 10), ink: 3 + best,
        });
      }
      ctx.onCleanup(() => { over = true; });
      round();
    },
  });
})();
