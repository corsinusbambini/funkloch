/* Balloon Pump: pump your balloon, bank it before it pops. Biggest banked balloon wins the round. */
Funkloch.registerGame({
  id: 'balloon-pump', skill: 'duo', added: '2026-10-19', glyph: '🎈', players: 2, maxPlayers: 4,
  name: { de: 'Ballon-Pumpe', en: 'Balloon Pump' },
  desc: {
    de: 'Alle pumpen gleichzeitig ihren Ballon auf. Tipp auf SICHER, bevor er platzt! Jeder Ballon platzt an einer geheimen Stelle. Wer den grössten gesicherten Ballon hat, holt den Punkt. Wer zuerst 3 hat, gewinnt.',
    en: 'Everyone pumps their own balloon at the same time. Tap SAFE before it pops! Each balloon has a secret burst point. The biggest banked balloon wins the point. First to 3 wins.',
  },
  modes: Funkloch.partyModes(),
  noLevel: true, formatBest: () => '🎈',
  start(ctx) {
    const F = Funkloch;
    F.partyMatch(ctx, {
      n: +ctx.mode || 2, win: 3,
      async round(api) {
        const r = api.r, n = api.n;
        await api.countdown();
        const size = Array(n).fill(0), limit = Array.from({ length: n }, () => r.int(4, 22));
        const state = Array(n).fill('live'); // live | safe | popped
        let finishRound;
        const over = new Promise((res) => (finishRound = res));
        const check = () => { if (state.every((s) => s !== 'live')) finishRound(); };
        const draw = (z, i) => {
          const px = 30 + size[i] * 7;
          const s = state[i];
          z.body.innerHTML = s === 'popped'
            ? `<div class="pz-big" style="font-size:70px">💥</div><div class="pz-big" style="font-size:20px">${size[i]}</div>`
            : `<div style="height:170px;display:flex;align-items:flex-end;justify-content:center"><div style="font-size:${px}px;line-height:1;max-height:170px">🎈</div></div>` +
              `<div class="pz-big" style="font-size:26px">${s === 'safe' ? '🔒 ' : ''}${size[i]}</div>`;
          if (s === 'live') {
            const row = F.h('<div class="pz-opts" style="grid-template-columns:2fr 1fr"></div>');
            const pump = F.h(`<button class="opt" style="min-height:64px">${F.tt({ de: 'PUMPEN', en: 'PUMP' })}</button>`);
            const keep = F.h(`<button class="opt" style="min-height:64px">${F.tt({ de: 'SICHER', en: 'SAFE' })}</button>`);
            pump.addEventListener('pointerdown', (e) => {
              e.preventDefault(); e.stopPropagation();
              if (state[i] !== 'live') return;
              size[i]++;
              if (size[i] > limit[i]) { state[i] = 'popped'; size[i] = size[i] - 1; ctx.sfx('bad'); draw(z, i); check(); }
              else { ctx.sfx('tick'); draw(z, i); }
            });
            keep.addEventListener('pointerdown', (e) => {
              e.preventDefault(); e.stopPropagation();
              if (state[i] !== 'live' || size[i] === 0) return;
              state[i] = 'safe'; ctx.sfx('good'); draw(z, i); check();
            });
            row.append(pump, keep);
            z.body.appendChild(row);
          }
        };
        api.zones.forEach((z, i) => draw(z, i));
        const t = setTimeout(() => { state.forEach((s, i) => { if (s === 'live') state[i] = 'safe'; }); finishRound(); }, 25000);
        ctx.onCleanup(() => clearTimeout(t));
        await over;
        clearTimeout(t);
        if (ctx.dead) return null;
        // show final result: a still-pumping player at timeout counts as banked
        api.zones.forEach((z, i) => {
          if (state[i] !== 'popped') { z.body.innerHTML = `<div class="pz-big" style="font-size:60px">🎈</div><div class="pz-big">${size[i]}</div>`; }
        });
        const score = size.map((s, i) => (state[i] === 'popped' ? -1 : s));
        const best = Math.max(...score);
        const winners = score.map((s, i) => (s === best ? i : -1)).filter((i) => i >= 0);
        return best > 0 && winners.length === 1 ? winners[0] : null;
      },
    });
  },
});
