/* Color Grab: a colour name is shown in a misleading ink. First to tap the dot of the NAMED colour wins. */
(function () {
  const F = Funkloch;
  const COLS = [
    { de: 'ROT', en: 'RED', c: '#E05A5A' }, { de: 'BLAU', en: 'BLUE', c: '#4A86D8' }, { de: 'GRÜN', en: 'GREEN', c: '#3FA45F' },
    { de: 'GELB', en: 'YELLOW', c: '#E8B93A' }, { de: 'LILA', en: 'PURPLE', c: '#9A63C8' }, { de: 'ORANGE', en: 'ORANGE', c: '#EE8A3A' },
  ];
  F.registerGame({
    id: 'color-grab', skill: 'duo', added: '2026-10-19', glyph: '🎨', players: 2, maxPlayers: 4,
    name: { de: 'Farbgriff', en: 'Color Grab' },
    desc: {
      de: 'Ein Farbwort erscheint, aber oft in falscher Farbe geschrieben! Tipp so schnell du kannst den Punkt, der zum WORT passt. Wer zuerst richtig tippt, holt den Punkt, Falsch sperrt dich. Wer zuerst 5 hat, gewinnt.',
      en: 'A colour word appears, often written in the wrong colour! Quickly tap the dot matching the WORD. First correct tap wins the point, a wrong tap locks you out. First to 5 wins.',
    },
    modes: F.partyModes(),
    noLevel: true, formatBest: () => '🎨',
    start(ctx) {
      F.partyMatch(ctx, {
        n: +ctx.mode || 2, win: 5,
        async round(api) {
          const r = api.r;
          const target = r.pick(COLS);
          const ink = r.chance(0.8) ? r.pick(COLS.filter((c) => c !== target)) : target;
          const opts = [target, ...r.shuffle(COLS.filter((c) => c !== target)).slice(0, 3)];
          await api.countdown();
          api.all('');
          return api.race((z, i, ctl) => {
            z.body.innerHTML = `<div class="pz-big" style="font-size:40px;font-weight:bold;color:${ink.c}">${F.tt(target)}</div>`;
            // each player gets their own shuffle so nobody can copy a neighbour's position
            const order = r.shuffle(opts);
            const wrap = F.zoneOptions(order.map(() => '&nbsp;'), (k, b) => {
              if (!ctl.active()) return;
              if (order[k] === target) { b.classList.add('right'); ctl.correct(); } else { b.classList.add('wrong'); ctl.wrong(); }
            }, 2);
            [...wrap.children].forEach((b, k) => { b.style.background = order[k].c; b.style.minHeight = '64px'; });
            z.body.appendChild(wrap);
          }, 8000);
        },
      });
    },
  });
})();
