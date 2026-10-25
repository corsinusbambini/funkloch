/* Tic-Tac-Toe: two players pass the phone. Three in a row wins the round. */
(function () {
  const F = Funkloch;
  const LINES = [[0, 1, 2], [3, 4, 5], [6, 7, 8], [0, 3, 6], [1, 4, 7], [2, 5, 8], [0, 4, 8], [2, 4, 6]];

  F.registerGame({
    id: 'tic-tac-toe', skill: 'duo', added: '2026-10-25', glyph: '❌', players: 2, maxPlayers: 2,
    name: { de: 'Drei gewinnt', en: 'Tic-Tac-Toe' },
    desc: { de: 'Ihr wechselt euch ab: tippe auf ein leeres Feld und setze dein Zeichen. Wer zuerst drei in einer Reihe hat (waagrecht, senkrecht oder diagonal), holt den Punkt. Wer zuerst 3 Punkte hat, gewinnt.', en: 'Take turns: tap an empty square to place your mark. First to get three in a row (across, up or diagonal) wins the point. First to 3 points wins.' },
    modes: F.partyModes([2]),
    noLevel: true, formatBest: () => '❌',
    start(ctx) {
      F.partyMatch(ctx, {
        n: 2, win: 3,
        async round(api) {
          const root = api.board.root;
          const quit = root.querySelector('.party-quit');
          if (quit) { quit.style.left = '24px'; quit.style.width = '36px'; quit.style.height = '36px'; }
          const g = Array(9).fill(-1);
          let turn = (api.roundNo - 1) % 2, done = false, moves = 0, place = () => {};
          const board = F.h('<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(80vw,300px);z-index:32;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;padding:6px;border:2.5px solid var(--ink);border-radius:14px;background:var(--paper-2);box-shadow:var(--shadow);touch-action:manipulation"></div>');
          const cells = g.map((_, i) => {
            const c = F.h('<button style="aspect-ratio:1;min-width:0;padding:0;border:2.5px solid var(--ink);border-radius:12px;background:var(--card);font-size:44px;font-weight:bold;line-height:1;cursor:pointer;font-family:inherit"></button>');
            c.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); place(i); });
            board.appendChild(c);
            return c;
          });
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
            place = (i) => {
              if (done) return;
              if (g[i] !== -1) { ctx.sfx('bad'); return; }
              g[i] = turn; moves++;
              cells[i].textContent = turn === 0 ? '✕' : '○';
              cells[i].style.color = F.playerColor(turn);
              ctx.sfx('tap');
              const line = LINES.find((l) => l.every((k) => g[k] === turn));
              if (line) return finish(turn, line);
              if (moves === 9) return finish(null);
              turn = 1 - turn;
              status();
            };
          });
        },
      });
    },
  });
})();
