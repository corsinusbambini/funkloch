/* Battleship (solo): find and sink the hidden fleet with as few shots as possible. */
(function () {
  const F = Funkloch;
  const N = 8;
  const FLEETS = [[3, 3, 2, 2], [4, 3, 3, 2, 2], [5, 4, 3, 3, 2]];

  function place(r, fleet) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const occ = new Array(N * N).fill(-1), ships = [];
      let okAll = true;
      for (let s = 0; s < fleet.length && okAll; s++) {
        let placed = false;
        for (let t = 0; t < 120 && !placed; t++) {
          const horiz = r() < 0.5, len = fleet[s];
          const x = Math.floor(r() * (horiz ? N - len + 1 : N)), y = Math.floor(r() * (horiz ? N : N - len + 1));
          const cells = [];
          for (let k = 0; k < len; k++) cells.push((horiz ? y : y + k) * N + (horiz ? x + k : x));
          if (cells.some((c) => touches(occ, c))) continue;
          cells.forEach((c) => { occ[c] = s; });
          ships.push(cells); placed = true;
        }
        if (!placed) okAll = false;
      }
      if (okAll) return { occ, ships };
    }
    // deterministic fallback: pack ships into every second row
    const occ = new Array(N * N).fill(-1), ships = [];
    let row = 0, col = 0;
    fleet.forEach((len, s) => {
      if (col + len > N) { row += 2; col = 0; }
      const cells = [];
      for (let k = 0; k < len; k++) cells.push(row * N + col + k);
      cells.forEach((c) => { occ[c] = s; });
      ships.push(cells); col += len + 1;
    });
    return { occ, ships };
  }
  function touches(occ, c) {
    const y = Math.floor(c / N), x = c % N;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && yy < N && xx >= 0 && xx < N && occ[yy * N + xx] >= 0) return true;
    }
    return false;
  }

  F.registerGame({
    id: 'battleship', skill: 'spatial', added: '2026-11-03', glyph: '🚢',
    name: { de: 'Schiffe versenken', en: 'Battleship' },
    desc: {
      de: 'Eine versteckte Flotte liegt im Meer. Tippe Felder an, um zu schiessen. Schiffe berühren sich nie, auch nicht diagonal. Versenke alle Schiffe mit möglichst wenigen Schüssen.',
      en: 'A hidden fleet lies in the sea. Tap squares to fire. Ships never touch, not even diagonally. Sink every ship with as few shots as possible.',
    },
    start(ctx) {
      const r = ctx.rng;
      const fleet = FLEETS[ctx.level >= 4 ? 2 : ctx.level >= 2 ? 1 : 0];
      const { occ, ships } = place(r, fleet);
      const state = new Array(N * N).fill(0); // 0 unknown, 1 water, 2 hit, 3 sunk
      const sunk = new Array(ships.length).fill(false);
      let shots = 0, over = false;

      ctx.el.innerHTML = '';
      const info = F.h('<div class="info-line" style="text-align:center;min-height:30px"></div>');
      const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${N},minmax(0,1fr));gap:3px;max-width:340px;margin:8px auto;touch-action:manipulation"></div>`);
      const btns = [];
      for (let i = 0; i < N * N; i++) {
        const b = F.h('<button style="aspect-ratio:1;min-width:0;min-height:0;padding:0;border:2.5px solid var(--ink);border-radius:8px;font-size:20px;line-height:1;cursor:pointer;color:var(--ink);background:var(--c-focus)"></button>');
        b.onclick = () => fire(i);
        board.appendChild(b); btns.push(b);
      }
      ctx.el.appendChild(info); ctx.el.appendChild(board);

      function draw() {
        state.forEach((s, i) => {
          const b = btns[i];
          b.textContent = s === 1 ? '·' : s === 2 ? '💥' : s === 3 ? '⚓' : '';
          b.style.background = s === 0 ? 'var(--c-focus)' : s === 1 ? 'var(--card)' : s === 2 ? 'var(--c-fun)' : 'var(--bad)';
          b.style.opacity = s === 1 ? '0.7' : '1';
          b.disabled = over || s !== 0;
        });
        const left = fleet.filter((_, k) => !sunk[k]).sort((a, b) => b - a);
        info.textContent = F.tt({ de: 'Übrig: ', en: 'Left: ' }) + (left.length ? left.map((l) => '▮'.repeat(l)).join('  ') : '–');
        ctx.setInfo(F.tt({ de: `${shots} Schüsse`, en: `${shots} shots` }));
      }

      function fire(i) {
        if (over || state[i] !== 0) return;
        shots++;
        if (occ[i] < 0) { state[i] = 1; ctx.sfx('tap'); } else {
          state[i] = 2;
          const k = occ[i];
          if (ships[k].every((c) => state[c] === 2)) {
            sunk[k] = true;
            ships[k].forEach((c) => {
              state[c] = 3;
              const y = Math.floor(c / N), x = c % N;
              for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                const yy = y + dy, xx = x + dx;
                if (yy >= 0 && yy < N && xx >= 0 && xx < N && state[yy * N + xx] === 0) state[yy * N + xx] = 1;
              }
            });
            ctx.sfx('good');
          } else ctx.sfx('good');
        }
        if (sunk.every(Boolean)) { over = true; draw(); return end(); }
        draw();
      }

      async function end() {
        await ctx.wait(700);
        const cells = ships.reduce((a, s) => a + s.length, 0);
        const score = Math.max(5, 100 - (shots - cells) * 2);
        ctx.finish({
          score, detail: F.tt({ de: `${shots} Schüsse`, en: `${shots} shots` }),
          levelDelta: shots <= cells + 18 ? 1 : shots >= cells + 38 ? -1 : 0,
          quality: Math.max(0.1, Math.min(1, 1 - (shots - cells) / 50)), ink: 4 + Math.max(0, Math.round((60 - shots) / 5)),
        });
      }
      draw();
    },
  });
})();
