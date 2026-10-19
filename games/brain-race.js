/* Brain Race: the same quick question for everyone. First correct tap wins; a wrong tap locks you out. */
(function () {
  const F = Funkloch;
  const COLORS = [{ de: 'ROT', en: 'RED', c: '#E05A5A' }, { de: 'BLAU', en: 'BLUE', c: '#4A86D8' }, { de: 'GRÜN', en: 'GREEN', c: '#3FA45F' }, { de: 'GELB', en: 'YELLOW', c: '#D9A400' }];
  const ODD = [['b', 'd'], ['O', 'Q'], ['6', '9'], ['E', 'F'], ['M', 'N'], ['p', 'q'], ['☺', '☹'], ['△', '▽'], ['8', 'B'], ['C', 'G']];

  // Returns { q, labels, correct, cols, extra(html shown above options) }.
  function question(r, n) {
    const type = r.pick(['bigger', 'math', 'stroop', 'odd', 'dots', 'sum', 'math']);
    if (type === 'bigger') {
      const a = r.int(10, 999); let b; do { b = a + r.int(-30, 30); } while (b === a || b < 1);
      return { q: F.tt({ de: 'Grössere Zahl?', en: 'Bigger number?' }), labels: [a, b], correct: a > b ? 0 : 1 };
    }
    if (type === 'math') {
      const op = r.pick(['+', '×', '−']), x = r.int(2, op === '×' ? 12 : 50), y = r.int(2, op === '×' ? 12 : 30);
      const res = op === '+' ? x + y : op === '×' ? x * y : x - y, ok = r.chance(0.5);
      return { q: `${x} ${op} ${y} = ${ok ? res : res + r.pick([-2, -1, 1, 2, 10])}`, labels: ['✓', '✗'], correct: ok ? 0 : 1 };
    }
    if (type === 'stroop') {
      const w = r.pick(COLORS), ink = r.chance(0.5) ? w : r.pick(COLORS.filter((c) => c !== w));
      return { q: `<span style="color:${ink.c};font-size:34px">${F.tt(w)}</span><br><small>${F.tt({ de: 'Farbe = Wort?', en: 'Colour = word?' })}</small>`, labels: ['✓', '✗'], correct: w === ink ? 0 : 1 };
    }
    if (type === 'odd') {
      const [a, b] = r.pick(ODD), pos = r.int(0, 3);
      return { q: F.tt({ de: 'Welches ist anders?', en: 'Which one is different?' }), labels: [0, 1, 2, 3].map((i) => (i === pos ? b : a)), correct: pos, cols: n > 2 ? 2 : 4 };
    }
    if (type === 'sum') {
      const a = r.int(2, 20), b = r.int(2, 20), s = a + b;
      const opts = r.shuffle([s, s + r.pick([1, 2, 10]), s - r.pick([1, 2])]);
      return { q: `${a} + ${b} = ?`, labels: opts, correct: opts.indexOf(s), cols: 3 };
    }
    const k = r.int(4, 9), opts = r.shuffle([k, k + 1, k - 1]);
    const dots = Array.from({ length: k }, () => `<span style="position:absolute;left:${r.int(4, 86)}%;top:${r.int(6, 80)}%;width:14px;height:14px;border-radius:50%;background:var(--ink)"></span>`).join('');
    return { q: F.tt({ de: 'Wie viele Punkte?', en: 'How many dots?' }), labels: opts, correct: opts.indexOf(k), cols: 3, dots };
  }

  F.registerGame({
    id: 'brain-race', skill: 'duo', added: '2026-10-19', glyph: '⚡?', players: 2, maxPlayers: 4,
    name: { de: 'Hirn-Rennen', en: 'Brain Race' },
    desc: { de: 'Alle bekommen dieselbe Blitzfrage: rechnen, Farben, Punkte zählen, den Anderen finden. Wer zuerst richtig tippt, holt den Punkt. Falsch = gesperrt. Wer zuerst 5 hat, gewinnt.', en: 'Everyone gets the same quick question: maths, colours, counting dots, spotting the odd one. First correct tap wins the point. Wrong = locked out. First to 5 wins.' },
    modes: F.partyModes(),
    noLevel: true, formatBest: () => '⚡',
    start(ctx) {
      F.partyMatch(ctx, {
        n: +ctx.mode || 2, win: 5,
        round(api) {
          const q = question(api.r, api.n);
          // the dot pattern is shown identically in every zone (random positions must not differ per player)
          return api.race((z, i, ctl) => {
            z.body.innerHTML = `<div class="pz-big" style="font-size:26px">${q.q}</div>` +
              (q.dots ? `<div style="position:relative;width:100%;height:90px">${q.dots}</div>` : '');
            z.body.appendChild(F.zoneOptions(q.labels, (k, b) => {
              if (!ctl.active()) return;
              if (k === q.correct) { b.classList.add('right'); ctl.correct(); } else { b.classList.add('wrong'); ctl.wrong(); }
            }, q.cols || 2));
          }, 10000);
        },
      });
    },
  });
})();
