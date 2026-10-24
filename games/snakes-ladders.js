/* Snakes and Ladders: roll the die, climb ladders, avoid snakes. First player to the last square wins. Board is generated each round. */
(function () {
  const F = Funkloch;
  const W = 6, H = 5, N = W * H;
  const NS = 'http://www.w3.org/2000/svg';
  const CELL = 50, SIZE_W = W * CELL, SIZE_H = H * CELL;

  // square 1..N -> centre point (snake-like numbering from the bottom left)
  const pos = (sq) => {
    const i = sq - 1, row = Math.floor(i / W), col = i % W;
    const x = row % 2 === 0 ? col : W - 1 - col;
    return [x * CELL + CELL / 2, (H - 1 - row) * CELL + CELL / 2];
  };

  function makeBoard(r) {
    const jumps = {}; // from -> to
    const used = new Set();
    const add = (from, to) => { jumps[from] = to; used.add(from); used.add(to); };
    let ladders = 0, snakes = 0, tries = 0;
    while ((ladders < 3 || snakes < 3) && tries++ < 400) {
      if (ladders < 3 && (snakes >= 3 || r.chance(0.5))) {
        const from = r.int(2, N - 8), to = from + r.int(5, 12);
        if (to < N && !used.has(from) && !used.has(to) && Math.floor((from - 1) / W) !== Math.floor((to - 1) / W)) { add(from, to); ladders++; }
      } else if (snakes < 3) {
        const from = r.int(9, N - 1), to = from - r.int(5, 12);
        if (to >= 2 && !used.has(from) && !used.has(to) && Math.floor((from - 1) / W) !== Math.floor((to - 1) / W)) { add(from, to); snakes++; }
      }
    }
    return jumps;
  }

  F.registerGame({
    id: 'snakes-ladders', skill: 'duo', added: '2026-10-24', glyph: '🐍', players: 2, maxPlayers: 4,
    name: { de: 'Schlangen und Leitern', en: 'Snakes and Ladders' },
    desc: { de: 'Wer dran ist, tippt auf den Würfel und zieht weiter. Leitern bringen dich hoch, Schlangen rutschen dich runter. Wer zuerst genau auf dem Feld 30 landet (zu hohe Zahl = bleibt stehen), gewinnt die Runde. Jede Runde hat ein neues Brett. Wer zuerst 2 Runden hat, gewinnt.', en: 'The active player taps the die and moves. Ladders lift you up, snakes slide you down. First to land exactly on square 30 (too high a roll = stay put) wins the round. Every round has a new board. First to 2 rounds wins.' },
    modes: F.partyModes(),
    noLevel: true, formatBest: () => '🐍',
    start(ctx) {
      const n = +ctx.mode || 2;
      F.partyMatch(ctx, {
        n, win: 2,
        async round(api) {
          const root = api.board.root, r = api.r;
          const jumps = makeBoard(r);
          const at = Array(n).fill(0); // 0 = before the board
          let turn = (api.roundNo - 1) % n, done = false, busy = false, rollFn = () => {};

          const wrap = F.h('<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(80vw,270px);z-index:32;touch-action:none;pointer-events:none"></div>');
          const svg = document.createElementNS(NS, 'svg');
          svg.setAttribute('viewBox', `0 0 ${SIZE_W} ${SIZE_H}`);
          svg.style.cssText = 'width:100%;display:block;background:var(--paper-2);border:2.5px solid var(--ink);border-radius:14px;box-shadow:var(--shadow);color:var(--ink)';
          wrap.appendChild(svg);
          root.appendChild(wrap);
          ctx.onCleanup(() => wrap.remove());
          const el = (tag, attrs, txt) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (txt != null) e.textContent = txt; svg.appendChild(e); return e; };

          for (let s = 1; s <= N; s++) {
            const [cx, cy] = pos(s);
            el('rect', { x: cx - CELL / 2 + 1, y: cy - CELL / 2 + 1, width: CELL - 2, height: CELL - 2, rx: 6, fill: s === N ? 'var(--good)' : (s % 2 ? 'var(--card)' : 'none'), 'fill-opacity': s === N ? '.5' : '1', stroke: 'var(--ink-faint)', 'stroke-width': 1.5 });
            el('text', { x: cx - CELL / 2 + 5, y: cy - CELL / 2 + 14, 'font-size': 12, fill: 'var(--ink-soft)', 'font-family': 'inherit' }, s === N ? '🏁' : s);
          }
          Object.keys(jumps).forEach((k) => {
            const from = +k, to = jumps[k], up = to > from;
            const [x1, y1] = pos(from), [x2, y2] = pos(to);
            const col = up ? 'var(--good)' : 'var(--bad)';
            if (up) {
              const dx = x2 - x1, dy = y2 - y1, len = Math.hypot(dx, dy) || 1, nx = -dy / len * 6, ny = dx / len * 6;
              el('line', { x1: x1 + nx, y1: y1 + ny, x2: x2 + nx, y2: y2 + ny, stroke: col, 'stroke-width': 3.5, 'stroke-linecap': 'round' });
              el('line', { x1: x1 - nx, y1: y1 - ny, x2: x2 - nx, y2: y2 - ny, stroke: col, 'stroke-width': 3.5, 'stroke-linecap': 'round' });
              for (let k2 = 1; k2 <= 2; k2++) { const f = k2 / 3; el('line', { x1: x1 + dx * f + nx, y1: y1 + dy * f + ny, x2: x1 + dx * f - nx, y2: y1 + dy * f - ny, stroke: col, 'stroke-width': 3 }); }
            } else {
              const mx = (x1 + x2) / 2 + (y2 - y1) * 0.18, my = (y1 + y2) / 2 - (x2 - x1) * 0.18;
              el('path', { d: `M${x1},${y1} Q${mx},${my} ${x2},${y2}`, fill: 'none', stroke: col, 'stroke-width': 5, 'stroke-linecap': 'round', 'stroke-dasharray': '9 4' });
              el('circle', { cx: x1, cy: y1, r: 6, fill: col, stroke: 'var(--ink)', 'stroke-width': 1.5 });
            }
          });
          const tokens = [];
          for (let i = 0; i < n; i++) {
            const g = document.createElementNS(NS, 'circle');
            g.setAttribute('r', 8); g.setAttribute('fill', F.playerColor(i)); g.setAttribute('stroke', 'var(--ink)'); g.setAttribute('stroke-width', 2);
            svg.appendChild(g); tokens.push(g);
          }
          const place = (i) => {
            const s = at[i];
            if (s === 0) { tokens[i].setAttribute('cx', 10 + i * 20); tokens[i].setAttribute('cy', SIZE_H + 0); tokens[i].style.display = 'none'; return; }
            const [cx, cy] = pos(s), o = [[-11, 8], [11, 8], [-11, -2], [11, -2]][i];
            tokens[i].style.display = '';
            tokens[i].setAttribute('cx', cx + o[0]); tokens[i].setAttribute('cy', cy + o[1] + 6);
          };
          tokens.forEach((_, i) => place(i));

          let lastRoll = 0;
          const status = () => api.zones.forEach((z, i) => {
            const mine = !done && i === turn;
            const where = at[i] ? `${at[i]}/${N}` : F.tt({ de: 'Start', en: 'Start' });
            z.body.innerHTML = '';
            const info = F.h(`<div style="font-size:20px">${done ? '' : mine ? '' : where}</div>`);
            z.body.appendChild(info);
            if (mine) {
              const b = F.h(`<button class="btn primary" style="min-height:60px;min-width:150px;font-size:26px">🎲 ${F.tt({ de: 'Würfeln', en: 'Roll' })}</button>`);
              b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); rollFn(i); });
              z.body.appendChild(b);
              z.body.appendChild(F.h(`<div style="font-size:18px">${where}</div>`));
            }
            z.el.style.opacity = !done && !mine ? '.6' : '';
          });
          status();

          return new Promise((res) => {
            rollFn = async (i) => {
              if (done || busy || i !== turn) return;
              busy = true;
              const d = r.int(1, 6);
              lastRoll = d;
              api.zones[i].body.innerHTML = `<div class="pz-big" style="font-size:56px">🎲 ${d}</div>`;
              ctx.sfx('tick');
              await ctx.wait(650);
              if (at[i] + d <= N) {
                at[i] += d; place(i); ctx.sfx('tap');
                await ctx.wait(450);
                if (jumps[at[i]]) {
                  const up = jumps[at[i]] > at[i];
                  at[i] = jumps[at[i]]; place(i); ctx.sfx(up ? 'good' : 'bad');
                  await ctx.wait(500);
                }
              } else ctx.sfx('bad');
              if (at[i] === N) {
                done = true; status();
                api.zones[i].body.innerHTML = '<div class="pz-big">🏁</div>';
                await ctx.wait(1000);
                wrap.remove();
                api.zones.forEach((z) => (z.el.style.opacity = ''));
                return res(i);
              }
              turn = (turn + 1) % n; busy = false;
              status();
            };
          });
        },
      });
    },
  });
})();
