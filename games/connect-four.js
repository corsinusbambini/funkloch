/* Connect Four: two players take turns dropping discs. Four in a row wins the round. */
(function () {
  const F = Funkloch;
  const COLS = 7, ROWS = 6;

  // Returns the winning four cells (as indices) or null.
  function findFour(g, who) {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        for (const [dx, dy] of [[1, 0], [0, 1], [1, 1], [1, -1]]) {
          const cells = [];
          for (let k = 0; k < 4; k++) {
            const a = x + dx * k, b = y + dy * k;
            if (a < 0 || a >= COLS || b < 0 || b >= ROWS || g[b * COLS + a] !== who) break;
            cells.push(b * COLS + a);
          }
          if (cells.length === 4) return cells;
        }
      }
    }
    return null;
  }

  F.registerGame({
    id: 'connect-four', skill: 'duo', added: '2026-10-22', glyph: '🔴', players: 2, maxPlayers: 2,
    name: { de: 'Vier gewinnt', en: 'Connect Four' },
    desc: { de: 'Ihr wechselt euch ab: tippe auf eine Spalte, dein Stein fällt nach unten. Wer zuerst vier Steine in einer Reihe hat (waagrecht, senkrecht oder diagonal), gewinnt die Runde. Wer zuerst 2 Runden hat, gewinnt.', en: 'Take turns: tap a column and your disc drops down. First to get four in a row (across, up or diagonal) wins the round. First to 2 rounds wins.' },
    modes: F.partyModes([2]),
    noLevel: true, formatBest: () => '🔴',
    start(ctx) {
      F.partyMatch(ctx, {
        n: 2, win: 2,
        async round(api) {
          const root = api.board.root;
          const quit = root.querySelector('.party-quit');
          if (quit) { quit.style.left = '24px'; quit.style.width = '36px'; quit.style.height = '36px'; }
          const g = Array(COLS * ROWS).fill(-1);
          let turn = (api.roundNo - 1) % 2, done = false, moves = 0, drop = () => {};
          const board = F.h(`<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(92vw,330px);z-index:32;display:grid;grid-template-columns:repeat(${COLS},minmax(0,1fr));gap:4px;padding:6px;border:2.5px solid var(--ink);border-radius:14px;background:var(--paper-2);box-shadow:var(--shadow);touch-action:none"></div>`);
          const cells = [];
          for (let x = 0; x < COLS; x++) {
            const col = F.h('<div style="display:flex;flex-direction:column;gap:4px;min-width:0"></div>');
            for (let y = 0; y < ROWS; y++) {
              const c = F.h('<div style="aspect-ratio:1;min-width:0;border:2px solid var(--ink);border-radius:50%;background:var(--card)"></div>');
              col.appendChild(c);
              cells[y * COLS + x] = c;
            }
            col.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); drop(x); });
            board.appendChild(col);
          }
          root.appendChild(board);
          ctx.onCleanup(() => board.remove());

          const status = () => api.zones.forEach((z, i) => {
            z.body.innerHTML = `<div class="pz-big" style="font-size:26px">${done ? '' : i === turn ? F.tt({ de: 'Du bist dran!', en: 'Your turn!' }) : F.tt({ de: 'Warte …', en: 'Wait …' })}</div>`;
            z.el.style.opacity = !done && i !== turn ? '.55' : '';
          });
          status();
          return new Promise((res) => {
            const finish = async (w, line) => {
              done = true;
              if (line) line.forEach((i) => { cells[i].style.outline = '4px solid var(--ink)'; });
              status();
              await ctx.wait(1100);
              board.remove();
              api.zones.forEach((z) => (z.el.style.opacity = ''));
              res(w);
            };
            drop = (x) => {
              if (done) return;
              let y = ROWS - 1;
              while (y >= 0 && g[y * COLS + x] !== -1) y--;
              if (y < 0) { ctx.sfx('bad'); return; }
              g[y * COLS + x] = turn; moves++;
              cells[y * COLS + x].style.background = F.playerColor(turn);
              ctx.sfx('tap');
              const line = findFour(g, turn);
              if (line) return finish(turn, line);
              if (moves === COLS * ROWS) return finish(null);
              turn = 1 - turn;
              status();
            };
          });
        },
      });
    },
  });
})();
