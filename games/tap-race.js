/* Tap Race: tap your zone as fast as you can for a few seconds. Most taps wins the round. */
Funkloch.registerGame({
  id: 'tap-race', skill: 'duo', added: '2026-10-19', glyph: '👆', players: 2, maxPlayers: 4,
  name: { de: 'Tipp-Rennen', en: 'Tap Race' },
  desc: { de: 'Nach dem Countdown tippt jeder so schnell er kann auf sein Feld. Wer am meisten tippt, holt den Punkt. Wer zuerst 3 hat, gewinnt.', en: 'After the countdown everyone taps their zone as fast as they can. Most taps wins the point. First to 3 wins.' },
  modes: Funkloch.partyModes(),
  noLevel: true, formatBest: () => '👆',
  start(ctx) {
    const F = Funkloch;
    F.partyMatch(ctx, {
      n: +ctx.mode || 2, win: 3,
      async round(api) {
        const secs = api.r.pick([3, 4, 5]);
        await api.countdown();
        const taps = Array(api.n).fill(0);
        let live = true;
        api.zones.forEach((z, i) => {
          z.body.innerHTML = `<div class="pz-big">${F.tt({ de: 'TIPP!', en: 'TAP!' })}</div><div class="pz-big" style="font-size:54px">0</div>`;
          const cnt = z.body.lastChild;
          z.el.onpointerdown = (e) => { e.preventDefault(); if (!live) return; taps[i]++; cnt.textContent = taps[i]; };
        });
        await ctx.wait(secs * 1000);
        live = false;
        api.zones.forEach((z) => (z.el.onpointerdown = null));
        const best = Math.max(...taps);
        const winners = taps.map((t, i) => (t === best ? i : -1)).filter((i) => i >= 0);
        return best > 0 && winners.length === 1 ? winners[0] : null;
      },
    });
  },
});
