/* Count Them: a scatter of doodles flashes up, then hides. Who counted the target right first? */
(function () {
  const F = Funkloch;
  const SETS = [['⭐', '🌙'], ['🍎', '🍋'], ['🐟', '🐙'], ['🌸', '🍀'], ['🔴', '🔵'], ['🐱', '🐶'], ['🎈', '🎁'], ['🍄', '🌰']];
  const COLS = 6, ROWS = 4;

  // Returns { target, other, k (number of targets), cells: [{x, y, t}], opts, correct }
  function makeScene(r, hard) {
    const [target, other] = r.shuffle(r.pick(SETS));
    const total = hard ? r.int(12, 16) : r.int(9, 13);
    const k = r.int(hard ? 5 : 4, hard ? 9 : 7);
    const spots = r.shuffle(Array.from({ length: COLS * ROWS }, (_, i) => i)).slice(0, total);
    const cells = spots.map((s, i) => ({ x: (s % COLS) * 100 / COLS + r.int(0, 3), y: Math.floor(s / COLS) * 100 / ROWS + r.int(0, 4), t: i < k ? target : other }));
    const set = new Set([k]);
    for (const d of r.shuffle([-2, -1, 1, 2])) { if (set.size >= 3) break; if (k + d >= 1) set.add(k + d); }
    const opts = r.shuffle([...set]);
    return { target, other, k, cells, opts, correct: opts.indexOf(k) };
  }

  F.registerGame({
    id: 'count-them', skill: 'duo', added: '2026-10-21', glyph: '🔢', players: 2, maxPlayers: 4,
    name: { de: 'Zähl mit!', en: 'Count Them' },
    desc: { de: 'Ein paar Zeichen blitzen kurz auf. Dann kommt die Frage: wie viele davon waren es? Wer zuerst die richtige Zahl tippt, holt den Punkt. Falsch = gesperrt. Wer zuerst 4 hat, gewinnt.', en: 'A scatter of doodles flashes up briefly. Then: how many of one kind were there? First to tap the right number wins the point. Wrong = locked out. First to 4 wins.' },
    modes: F.partyModes(),
    noLevel: true, formatBest: () => '🔢',
    start(ctx) {
      F.partyMatch(ctx, {
        n: +ctx.mode || 2, win: 4,
        async round(api) {
          const sc = makeScene(api.r, api.roundNo > 3);
          await api.countdown();
          const items = sc.cells.map((c) => `<span style="position:absolute;left:${c.x}%;top:${c.y}%;font-size:24px;line-height:1">${c.t}</span>`).join('');
          api.all(`<div class="pz-big" style="font-size:22px">${F.tt({ de: 'Zähl die', en: 'Count the' })} ${sc.target}</div><div style="position:relative;width:100%;max-width:320px;height:130px">${items}</div>`);
          await ctx.wait(api.roundNo > 3 ? 1800 : 2300);
          if (ctx.dead) return null;
          return api.race((z, i, ctl) => {
            z.body.innerHTML = `<div class="pz-big" style="font-size:26px">${F.tt({ de: 'Wie viele', en: 'How many' })} ${sc.target}?</div>`;
            z.body.appendChild(F.zoneOptions(sc.opts, (k, b) => {
              if (!ctl.active()) return;
              if (k === sc.correct) { b.classList.add('right'); ctl.correct(); } else { b.classList.add('wrong'); ctl.wrong(); }
            }, sc.opts.length));
          }, 10000);
        },
      });
    },
  });
})();
