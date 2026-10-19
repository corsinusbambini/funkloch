/* Hot Potato: a bomb with a hidden fuse jumps between players. Tap to pass it on; whoever holds it when it blows loses. */
Funkloch.registerGame({
  id: 'hot-potato', skill: 'duo', added: '2026-10-19', glyph: '💣', players: 2, maxPlayers: 4,
  name: { de: 'Heisse Kartoffel', en: 'Hot Potato' },
  desc: {
    de: 'Eine Bombe mit geheimer Zündschnur springt von Feld zu Feld. Hast du sie, tippst du schnell, um sie weiterzugeben. Wer sie beim Knall hat, verliert die Runde, alle anderen bekommen einen Punkt. Wer zuerst 4 Punkte hat, gewinnt.',
    en: 'A bomb with a secret fuse jumps from zone to zone. If you have it, tap fast to pass it on. Whoever holds it when it blows loses the round and everyone else scores a point. First to 4 points wins.',
  },
  modes: Funkloch.partyModes(),
  noLevel: true, formatBest: () => '💣',
  start(ctx) {
    const F = Funkloch;
    F.partyMatch(ctx, {
      n: +ctx.mode || 2, win: 4,
      async round(api) {
        const r = api.r, n = api.n;
        let holder = r.int(0, n - 1), boom = false, passes = 0;
        const total = r.int(3500, 9000);
        const show = () => api.zones.forEach((z, i) => {
          z.body.innerHTML = i === holder
            ? `<div class="pz-big" style="font-size:96px">💣</div><div class="pz-big" style="font-size:24px">${F.tt({ de: 'Weitergeben!', en: 'Pass it on!' })}</div>`
            : `<div class="pz-big" style="font-size:44px;opacity:.5">😅</div>`;
        });
        api.zones.forEach((z, i) => {
          z.el.onpointerdown = (e) => {
            e.preventDefault();
            if (boom || i !== holder) return;
            const others = [...Array(n).keys()].filter((k) => k !== i);
            holder = r.pick(others); passes++;
            ctx.sfx('good');
            show();
          };
        });
        await api.countdown();
        show();
        let left = total;
        while (left > 0) {
          const step = left < 1500 ? 180 : left < 3500 ? 350 : 600;
          await ctx.wait(step);
          left -= step;
          ctx.sfx('tick');
        }
        boom = true;
        api.zones.forEach((z) => (z.el.onpointerdown = null));
        api.zones.forEach((z, i) => {
          z.body.innerHTML = i === holder
            ? `<div class="pz-big" style="font-size:96px">💥</div>`
            : `<div class="pz-big" style="font-size:60px">😎</div>`;
        });
        ctx.sfx('bad');
        return [...Array(n).keys()].filter((k) => k !== holder);
      },
    });
  },
});
