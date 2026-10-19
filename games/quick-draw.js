/* Quick Draw: tap when the light turns green. Too early, or on a fake colour, and you're out for the round. */
Funkloch.registerGame({
  id: 'quick-draw', skill: 'duo', added: '2026-10-19', glyph: '🚦', players: 2, maxPlayers: 4,
  name: { de: 'Schnell-Zieher', en: 'Quick Draw' },
  desc: { de: 'Warte, bis das Licht GRÜN wird, dann tippen! Zu früh oder bei einer falschen Farbe = raus für diese Runde. Wer zuerst 5 hat, gewinnt.', en: 'Wait for the light to turn GREEN, then tap! Too early or on a fake colour = out for this round. First to 5 wins.' },
  modes: Funkloch.partyModes(),
  noLevel: true, formatBest: () => '🚦',
  start(ctx) {
    const F = Funkloch;
    const FAKES = ['#5B9BE6', '#E8B93A', '#B07FE0'];
    F.partyMatch(ctx, {
      n: +ctx.mode || 2, win: 5,
      round(api) {
        let state = 'wait';
        const lights = [];
        const p = api.race((z, i, ctl) => {
          z.body.innerHTML = `<div class="light"></div><div>${F.tt({ de: 'Warten…', en: 'Wait…' })}</div>`;
          lights.push(z.body.firstChild);
          z.el.onpointerdown = (e) => { e.preventDefault(); if (!ctl.active()) return; state === 'go' ? ctl.correct() : ctl.wrong(); };
        }, 12000);
        (async () => {
          await ctx.wait(1200 + api.r() * 2600);
          if (api.roundNo >= 3 && api.r.chance(0.45)) {
            state = 'fake';
            const c = api.r.pick(FAKES);
            lights.forEach((l) => (l.style.background = c));
            await ctx.wait(700 + api.r() * 600);
            lights.forEach((l) => (l.style.background = 'var(--bad)'));
            state = 'wait';
            await ctx.wait(500 + api.r() * 1500);
          }
          state = 'go';
          lights.forEach((l) => (l.style.background = 'var(--good)'));
          ctx.sfx('tick');
        })();
        return p.then((w) => { api.zones.forEach((z) => (z.el.onpointerdown = null)); return w; });
      },
    });
  },
});
