/* Party engine: 2–4 players around one phone lying flat. Each player gets a screen zone facing them. */
(function () {
  const F = Funkloch;
  const COLORS = ['#F06A6A', '#5B9BE6', '#4FB874', '#E8B93A'];
  const NAMES = { de: ['Rot', 'Blau', 'Grün', 'Gelb'], en: ['Red', 'Blue', 'Green', 'Yellow'] };

  F.playerName = (i) => F.tt({ de: NAMES.de[i], en: NAMES.en[i] });
  F.playerColor = (i) => COLORS[i];
  // Ready-made difficulty "modes" for choosing the number of players.
  F.partyModes = (counts = [2, 3, 4]) => counts.map((n) => ({
    id: String(n),
    name: { de: `${n} Spieler`, en: `${n} players` },
    desc: { de: 'Ein Handy flach auf dem Tisch', en: 'One phone flat on the table' },
  }));

  // Full-screen board with one zone per player. Zones at the top end are rotated to face the player there.
  F.partyBoard = (ctx, n) => {
    const root = F.h(`<div class="party p${n}"></div>`);
    const zones = [];
    for (let i = 0; i < n; i++) {
      const flipped = n === 4 ? i < 2 : i === 0;
      const z = F.h(`<div class="pzone ${flipped ? 'flip' : ''}" style="--pc:${COLORS[i]}">
        <div class="pz-head"><span class="pz-name">${F.playerName(i)}</span><span class="pz-score">0</span></div><div class="pz-body"></div></div>`);
      root.appendChild(z);
      zones.push({ el: z, body: z.querySelector('.pz-body'), scoreEl: z.querySelector('.pz-score'), flipped });
    }
    const quit = F.h('<button class="icon-btn party-quit" aria-label="quit">✕</button>');
    quit.onclick = () => F.go('home');
    root.appendChild(quit);
    document.body.appendChild(root);
    ctx.onCleanup(() => root.remove());
    return { root, zones, n };
  };

  /**
   * Plays rounds until someone has `win` points.
   * round(api) must return a promise of the winner: a player index, an array of indices, or null.
   */
  F.partyMatch = (ctx, { n, win = 5, round, ink }) => {
    const board = F.partyBoard(ctx, n);
    const scores = Array(n).fill(0);
    const api = {
      board, zones: board.zones, n, r: ctx.rng, roundNo: 0, scores,
      all: (html) => board.zones.forEach((z) => (z.body.innerHTML = html)),
      async countdown() {
        for (const t of ['3', '2', '1']) { api.all(`<div class="pz-big">${t}</div>`); ctx.sfx('tick'); await ctx.wait(650); }
      },
      // First correct answer wins; a wrong answer locks that player for this round.
      race(setupZone, timeoutMs = 9000) {
        return new Promise((res) => {
          let done = false;
          const locked = Array(n).fill(false);
          const finish = (w) => { if (done) return; done = true; clearTimeout(t); res(w); };
          const t = setTimeout(() => { if (!ctx.dead) finish(null); }, timeoutMs);
          ctx.onCleanup(() => clearTimeout(t));
          board.zones.forEach((z, i) => setupZone(z, i, {
            correct: () => { if (!done && !locked[i]) finish(i); },
            wrong: () => {
              if (done || locked[i]) return;
              locked[i] = true; z.el.classList.add('lost'); ctx.sfx('bad');
              if (locked.every(Boolean)) finish(null);
            },
            active: () => !done && !locked[i],
          }));
        });
      },
    };
    async function next() {
      if (Math.max(...scores) >= win) return end();
      api.roundNo++;
      board.zones.forEach((z) => { z.el.classList.remove('won', 'lost'); z.body.innerHTML = ''; });
      const winner = await round(api);
      if (ctx.dead) return;
      const ws = winner == null ? [] : [].concat(winner);
      ws.forEach((i) => scores[i]++);
      board.zones.forEach((z, i) => { z.scoreEl.textContent = scores[i]; z.el.classList.toggle('won', ws.includes(i)); });
      ctx.sfx(ws.length ? 'good' : 'bad');
      await ctx.wait(1300);
      next();
    }
    function end() {
      const best = Math.max(...scores);
      const winners = scores.map((s, i) => (s === best ? i : -1)).filter((i) => i >= 0);
      ctx.finish({
        score: 0, noRecord: true, display: scores.join(' : '),
        detail: winners.map(F.playerName).join(' & ') + F.tt({ de: ' gewinnt!', en: ' wins!' }),
        quality: 0.9, ink: ink || 6 + n * 2,
      });
    }
    next();
  };

  // Option buttons inside a zone; onPick(index).
  F.zoneOptions = (labels, onPick, cols = 2) => {
    const wrap = F.h(`<div class="pz-opts" style="grid-template-columns:repeat(${cols},1fr)"></div>`);
    labels.forEach((lab, i) => {
      const b = F.h(`<button class="opt">${lab}</button>`);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); onPick(i, b); });
      wrap.appendChild(b);
    });
    return wrap;
  };
})();
