/* Tug of War: tap as fast as you can to pull the knot to your side. 1 vs 1 or 2 vs 2. */
Funkloch.registerGame({
  id: 'tug-of-war', skill: 'duo', added: '2026-10-19', glyph: '🪢', players: 2, maxPlayers: 4,
  name: { de: 'Seilziehen', en: 'Tug of War' },
  desc: { de: 'Jedes Tippen zieht den Knoten ein Stück zu dir. Wer ihn bis ganz zu sich zieht, gewinnt die Runde. Zu viert spielt oben gegen unten. Wer zuerst 3 Runden hat, gewinnt.', en: 'Every tap pulls the knot a bit towards you. Pull it all the way to win the round. With four players it’s top vs bottom. First to 3 rounds wins.' },
  modes: [
    { id: '2', name: { de: '2 Spieler', en: '2 players' }, desc: { de: '1 gegen 1', en: '1 vs 1' } },
    { id: '4', name: { de: '4 Spieler', en: '4 players' }, desc: { de: '2 gegen 2, oben gegen unten', en: '2 vs 2, top vs bottom' } },
  ],
  noLevel: true, formatBest: () => '🪢',
  start(ctx) {
    const F = Funkloch;
    const n = +ctx.mode || 2, GOAL = n === 4 ? 30 : 20;
    // team: -1 = top end, +1 = bottom end
    const teamOf = (i) => (n === 4 ? (i < 2 ? -1 : 1) : i === 0 ? -1 : 1);
    F.partyMatch(ctx, {
      n, win: 3,
      async round(api) {
        await api.countdown();
        let pos = 0, done = false;
        const knots = [];
        api.zones.forEach((z, i) => {
          z.body.innerHTML = `<div class="pz-big" style="font-size:22px">${F.tt({ de: 'Zieh!', en: 'Pull!' })}</div><div class="rope"><div class="knot"></div></div>`;
          knots.push([z.body.querySelector('.knot'), teamOf(i)]);
        });
        const draw = () => knots.forEach(([k, team]) => { k.style.top = 50 + ((pos * team) / GOAL) * 48 + '%'; });
        draw();
        return new Promise((res) => {
          api.zones.forEach((z, i) => {
            z.el.onpointerdown = (e) => {
              e.preventDefault();
              if (done) return;
              pos += teamOf(i);
              draw();
              if (Math.abs(pos) >= GOAL) {
                done = true;
                api.zones.forEach((zz) => (zz.el.onpointerdown = null));
                const side = Math.sign(pos);
                res(api.zones.map((_, k) => k).filter((k) => teamOf(k) === side));
              }
            };
          });
          ctx.onCleanup(() => (done = true));
        });
      },
    });
  },
});
