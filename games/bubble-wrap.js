/* Bubble Wrap: endless popping. Every sheet has a new pattern; rare golden and secret bubbles. */
(function () {
  const F = Funkloch;
  const PALS = [
    ['#FFC9B0', '#FFE08A', '#F8C3DD'], ['#B9E6C9', '#A8E0D6', '#B5D8F5'], ['#CFC2F2', '#F8C3DD', '#B5D8F5'],
    ['#FFE08A', '#F6A9A0', '#FFC9B0'], ['#E8E2D4', '#D9CFBE', '#F4EBDA'], ['#A8E0D6', '#FFE08A', '#F6A9A0'],
  ];
  const PATTERNS = [
    (x, y) => (x + y) % 3, (x, y) => y % 3, (x, y) => x % 3, (x, y) => (x * y) % 3,
    (x, y, w, h) => Math.min(2, Math.floor(Math.hypot(x - (w - 1) / 2, y - (h - 1) / 2) / 1.6)),
    (x, y) => ((x >> 1) + (y >> 1)) % 3, (x, y) => Math.abs(x - y) % 3,
  ];
  const SECRETS = ['☺', '♥', '✿', '★', '☼', '♪', '☁', '✎'];

  F.registerGame({
    id: 'bubble-wrap', skill: 'fun', glyph: '◌◌',
    name: { de: 'Luftpolsterfolie', en: 'Bubble Wrap' },
    desc: {
      de: 'Einfach ploppen. Unendlich viele Bögen, jeder sieht anders aus. Goldene Blasen geben Extra-Tinte, manche Blasen verstecken etwas. Hör auf, wann du willst.',
      en: 'Just pop. Endless sheets, each one looks different. Golden bubbles give extra ink, some bubbles hide something. Stop whenever you like.',
    },
    noLevel: true,
    formatBest: (v) => v + ' ◌',
    start(ctx) {
      const r = ctx.rng, COLS = 6, ROWS = 8;
      let popped = 0, gold = 0, secrets = 0, sheets = 0;
      const wrap = F.h('<div></div>');
      const done = F.h(`<button class="btn block" style="margin-top:16px">${F.tt({ de: 'Fertig', en: 'Done' })}</button>`);
      done.onclick = () => ctx.finish({
        score: popped, display: `${popped} ◌`,
        detail: F.tt({ de: `${sheets} Bögen · ${gold} golden · ${secrets} Geheimnisse`, en: `${sheets} sheets · ${gold} golden · ${secrets} secrets` }),
        quality: popped > 100 ? 1 : 0.6, ink: Math.min(40, 2 + Math.floor(popped / 10) + gold * 3 + secrets),
      });
      function sheet() {
        sheets++;
        const pal = r.pick(PALS), pat = r.pick(PATTERNS);
        const goldIdx = r.chance(0.6) ? r.int(0, COLS * ROWS - 1) : -1;
        const secretIdx = new Set(r.shuffle([...Array(COLS * ROWS).keys()]).slice(0, r.int(1, 3)));
        let left = COLS * ROWS;
        ctx.setInfo(F.tt({ de: `Bogen ${sheets}`, en: `Sheet ${sheets}` }));
        wrap.innerHTML = '';
        const grid = F.h(`<div class="bubbles card sketch" style="grid-template-columns:repeat(${COLS},1fr)"></div>`);
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
          const i = y * COLS + x;
          const isGold = i === goldIdx;
          const b = F.h(`<div class="bub" style="background:${isGold ? '#FFD66B' : pal[pat(x, y, COLS, ROWS)]}"></div>`);
          b.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (b.classList.contains('popped')) return;
            b.classList.add('popped');
            popped++; left--;
            ctx.setScore(popped);
            if (isGold) { gold++; ctx.sfx('win'); b.textContent = '✦'; F.toast(F.tt({ de: 'Goldene Blase! +3 Tinte', en: 'Golden bubble! +3 ink' }), 1200); }
            else if (secretIdx.has(i)) { secrets++; ctx.sfx('good'); b.textContent = r.pick(SECRETS); b.style.opacity = '1'; }
            else ctx.sfx('pop');
            if (left === 0) setTimeout(() => { if (!ctx.dead) sheet(); }, 450);
          });
          grid.appendChild(b);
        }
        wrap.appendChild(grid);
      }
      ctx.setScore(0);
      sheet();
      ctx.el.append(wrap, done);
    },
  });
})();
