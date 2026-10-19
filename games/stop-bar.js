/* Stop the Bar: a marker swings back and forth. Tap to stop it as close to the green middle as you can. */
Funkloch.registerGame({
  id: 'stop-bar', skill: 'duo', added: '2026-10-19', glyph: '⏸', players: 2, maxPlayers: 4,
  name: { de: 'Stopp!', en: 'Stop It!' },
  desc: { de: 'Ein Strich saust hin und her. Tipp auf dein Feld, um ihn möglichst genau in der grünen Mitte anzuhalten. Am nächsten dran = Punkt. Es wird immer schneller. Wer zuerst 5 hat, gewinnt.', en: 'A marker zips back and forth. Tap your zone to stop it as close to the green middle as possible. Closest = point. It keeps getting faster. First to 5 wins.' },
  modes: Funkloch.partyModes(),
  noLevel: true, formatBest: () => '⏸',
  start(ctx) {
    const F = Funkloch;
    F.partyMatch(ctx, {
      n: +ctx.mode || 2, win: 5,
      async round(api) {
        const speed = 0.7 + api.roundNo * 0.12; // sweeps per second
        const width = Math.max(6, 18 - api.roundNo * 1.5);
        const phase = api.zones.map(() => api.r());
        const stopped = api.zones.map(() => null);
        const markers = [];
        api.zones.forEach((z, i) => {
          z.body.innerHTML = `<div class="track"><div class="target" style="width:${width}%"></div><div class="marker"></div></div><div class="pz-note">${F.tt({ de: 'Tippen zum Stoppen', en: 'Tap to stop' })}</div>`;
          markers.push(z.body.querySelector('.marker'));
          z.el.onpointerdown = (e) => {
            e.preventDefault();
            if (stopped[i] != null || !running) return;
            stopped[i] = pos(i, performance.now());
            ctx.sfx('tap');
            z.body.querySelector('.pz-note').textContent = '✓';
          };
        });
        const t0 = performance.now();
        // triangle wave 0..1
        const pos = (i, now) => { const x = (((now - t0) / 1000) * speed + phase[i]) % 2; return x < 1 ? x : 2 - x; };
        let running = true;
        await new Promise((res) => {
          const step = (now) => {
            if (ctx.dead) return;
            markers.forEach((m, i) => { const p = stopped[i] != null ? stopped[i] : pos(i, now); m.style.left = p * 100 + '%'; });
            if (stopped.every((s) => s != null) || now - t0 > 6000) return res();
            requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        });
        running = false;
        api.zones.forEach((z, i) => {
          z.el.onpointerdown = null;
          const d = stopped[i] == null ? null : Math.abs(stopped[i] - 0.5);
          z.body.querySelector('.pz-note').textContent = d == null ? '–' : Math.round(d * 200) + ' %';
        });
        let best = null, bd = 2, tie = false;
        stopped.forEach((s, i) => {
          if (s == null) return;
          const d = Math.abs(s - 0.5);
          if (d < bd - 1e-4) { bd = d; best = i; tie = false; } else if (Math.abs(d - bd) < 1e-4) tie = true;
        });
        await ctx.wait(900);
        return tie ? null : best;
      },
    });
  },
});
