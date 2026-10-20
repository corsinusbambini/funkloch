/* Odd One Out Race: a grid of look-alikes, one is different. First to tap it wins the point. */
(function () {
  const F = Funkloch;
  const PAIRS = [['b', 'd'], ['O', 'Q'], ['p', 'q'], ['E', 'F'], ['M', 'N'], ['C', 'G'], ['8', 'B'], ['☺', '☹'], ['△', '▽'], ['🍎', '🍅'], ['🌞', '🌝'], ['🐶', '🐺'], ['🔴', '🟠'], ['🟦', '🟪'], ['😀', '😃'], ['🐱', '🐯'], ['⬆️', '↗️'], ['🌙', '🌛'], ['🍋', '🧀'], ['🐸', '🐢']];

  // Returns { cells: [...labels], odd: index }
  function makeGrid(r, count) {
    let a, b;
    if (r.chance(0.3)) { // two digits with swapped order, e.g. 47 vs 74
      const x = r.int(1, 9); let y; do { y = r.int(1, 9); } while (y === x);
      a = `${x}${y}`; b = `${y}${x}`;
    } else [a, b] = r.shuffle(r.pick(PAIRS));
    const odd = r.int(0, count - 1);
    return { cells: Array.from({ length: count }, (_, i) => (i === odd ? b : a)), odd };
  }

  F.registerGame({
    id: 'odd-race', skill: 'duo', added: '2026-10-20', glyph: '🔍', players: 2, maxPlayers: 4,
    name: { de: 'Aussenseiter-Rennen', en: 'Odd One Race' },
    desc: { de: 'Alle sehen dasselbe Gitter aus fast gleichen Zeichen. Eines ist anders: wer es zuerst antippt, holt den Punkt. Falsch getippt = gesperrt. Wer zuerst 5 hat, gewinnt.', en: 'Everyone sees the same grid of look-alikes. One is different: first to tap it wins the point. Wrong tap = locked out. First to 5 wins.' },
    modes: F.partyModes(),
    noLevel: true, formatBest: () => '🔍',
    start(ctx) {
      F.partyMatch(ctx, {
        n: +ctx.mode || 2, win: 5,
        async round(api) {
          const count = api.n === 4 || api.roundNo <= 2 ? 9 : 12;
          const g = makeGrid(api.r, count);
          await api.countdown();
          return api.race((z, i, ctl) => {
            z.body.innerHTML = '';
            z.body.appendChild(F.zoneOptions(g.cells, (k, b) => {
              if (!ctl.active()) return;
              if (k === g.odd) { b.classList.add('right'); ctl.correct(); } else { b.classList.add('wrong'); ctl.wrong(); }
            }, 3));
          }, 12000);
        },
      });
    },
  });
})();
