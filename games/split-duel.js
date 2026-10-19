/* Split-Screen Duel: two players, one phone flat on the table. First correct tap wins the round. */
(function () {
  const F = Funkloch;
  const COLORS = [
    { de: 'ROT', en: 'RED', c: '#E05A5A' }, { de: 'BLAU', en: 'BLUE', c: '#4A86D8' },
    { de: 'GRÜN', en: 'GREEN', c: '#3FA45F' }, { de: 'GELB', en: 'YELLOW', c: '#E0B020' },
  ];
  const ODD = [['b', 'd'], ['O', 'Q'], ['6', '9'], ['E', 'F'], ['M', 'N'], ['p', 'q'], ['☺', '☹'], ['△', '▽'], ['8', 'B'], ['u', 'v']];

  // Each round: { q (html), labels, correct (index) } or { type:'green' }.
  function makeRound(r) {
    const type = r.pick(['green', 'bigger', 'math', 'stroop', 'odd', 'bigger', 'math']);
    if (type === 'green') return { type };
    if (type === 'bigger') {
      const a = r.int(10, 999); let b; do { b = a + r.int(-40, 40); } while (b === a || b < 1);
      return { q: F.tt({ de: 'Grössere Zahl!', en: 'Bigger number!' }), labels: [a, b], correct: a > b ? 0 : 1 };
    }
    if (type === 'math') {
      const x = r.int(2, 12), y = r.int(2, 12), right = r.chance(0.5);
      const shown = right ? x * y : x * y + r.pick([-2, -1, 1, 2, 10, -10]);
      return { q: `${x} × ${y} = ${shown}`, labels: ['✓', '✗'], correct: right ? 0 : 1 };
    }
    if (type === 'stroop') {
      const w = r.pick(COLORS), ink = r.chance(0.5) ? w : r.pick(COLORS.filter((c) => c !== w));
      return { q: `<span style="color:${ink.c};font-size:38px">${F.tt(w)}</span><br><small>${F.tt({ de: 'Farbe = Wort?', en: 'Colour = word?' })}</small>`, labels: ['✓', '✗'], correct: w === ink ? 0 : 1 };
    }
    const [a, b] = r.pick(ODD), pos = r.int(0, 3);
    return { q: F.tt({ de: 'Welches ist anders?', en: 'Which one is different?' }), labels: [0, 1, 2, 3].map((i) => (i === pos ? b : a)), correct: pos };
  }

  F.registerGame({
    id: 'split-duel', skill: 'duo', glyph: '⚔', players: 2,
    name: { de: 'Geteiltes Duell', en: 'Split-Screen Duel' },
    desc: {
      de: 'Legt das Handy flach zwischen euch. Jeder hat eine Bildschirmhälfte. Wer zuerst richtig tippt, holt den Punkt; falsch tippen = gesperrt. Wer zuerst 5 hat, gewinnt.',
      en: 'Lay the phone flat between you. Each player gets one half of the screen. First correct tap wins the point; a wrong tap locks you out. First to 5 wins.',
    },
    noLevel: true,
    formatBest: () => '⚔',
    start(ctx) {
      const r = ctx.rng, WIN = 5;
      const score = [0, 0];
      const root = F.h(`<div class="duel"><div class="duel-half top" data-p="0"></div><div class="duel-half" data-p="1"></div>
        <button class="icon-btn duel-quit" aria-label="quit">✕</button></div>`);
      document.body.appendChild(root);
      ctx.onCleanup(() => root.remove());
      root.querySelector('.duel-quit').onclick = () => F.go('home');
      const halves = [root.querySelector('[data-p="0"]'), root.querySelector('[data-p="1"]')];
      const names = [F.tt({ de: 'Oben', en: 'Top' }), F.tt({ de: 'Unten', en: 'Bottom' })];

      async function round() {
        if (score[0] >= WIN || score[1] >= WIN) return end();
        const rd = makeRound(r);
        const locked = [false, false];
        let over = false, greenAt = 0, timer = null;
        const finishRound = async (winner) => {
          if (over) return; over = true;
          clearTimeout(timer);
          if (winner != null) { score[winner]++; ctx.sfx('good'); }
          halves.forEach((h, p) => { h.style.background = winner === p ? 'var(--good)' : ''; });
          await ctx.wait(1000);
          halves.forEach((h) => (h.style.background = ''));
          round();
        };
        const wrong = (p) => {
          ctx.sfx('bad'); locked[p] = true; halves[p].style.background = 'var(--bad)';
          if (locked[0] && locked[1]) finishRound(null);
          else if (rd.type === 'green') finishRound(1 - p);
        };
        halves.forEach((h, p) => {
          h.style.background = '';
          h.innerHTML = `<div class="duel-score">${names[p]}: ${score[p]} · ${score[1 - p]}</div>`;
          if (rd.type === 'green') {
            const light = F.h(`<div style="width:140px;height:140px;border-radius:50%;border:3px solid var(--ink);background:var(--bad)"></div>`);
            const q = F.h(`<div class="q">${F.tt({ de: 'Tippen, wenn grün!', en: 'Tap when green!' })}</div>`);
            h.append(q, light);
            h.onpointerdown = (e) => {
              if (over || locked[p]) return;
              if (!greenAt) wrong(p); else finishRound(p);
            };
          } else {
            h.onpointerdown = null;
            const q = F.h(`<div class="q">${rd.q}</div>`);
            const opts = F.h('<div class="opts"></div>');
            rd.labels.forEach((lab, i) => {
              const b = F.h(`<button class="opt">${lab}</button>`);
              b.addEventListener('pointerdown', (e) => {
                e.preventDefault(); e.stopPropagation();
                if (over || locked[p]) return;
                if (i === rd.correct) finishRound(p); else wrong(p);
              });
              opts.appendChild(b);
            });
            h.append(q, opts);
          }
        });
        if (rd.type === 'green') {
          timer = setTimeout(() => {
            if (ctx.dead || over) return;
            greenAt = performance.now();
            halves.forEach((h) => { const l = h.querySelector('div[style*="border-radius:50%"]'); if (l) l.style.background = 'var(--good)'; });
            ctx.sfx('tick');
          }, 1200 + r() * 2800);
          ctx.onCleanup(() => clearTimeout(timer));
        }
      }
      function end() {
        const w = score[0] > score[1] ? 0 : 1;
        ctx.finish({
          score: 0, noRecord: true, display: `${score[0]} : ${score[1]}`,
          detail: F.tt({ de: `${names[w]} gewinnt!`, en: `${names[w]} wins!` }),
          quality: 0.9, ink: 10,
        });
      }
      round();
    },
  });
})();
