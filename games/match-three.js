/* Match-3: swap two neighbouring fruits to line up 3 or more. Reach the target score before the moves run out. */
(function () {
  const F = Funkloch;
  const N = 6;
  const FRUITS = ['🍓', '🍋', '🍏', '🍊', '🍇'];

  F.registerGame({
    id: 'match-three', skill: 'focus', added: '2026-11-08', glyph: '🍓',
    name: { de: 'Drei gewinnt', en: 'Match-3' },
    desc: {
      de: 'Tippe eine Frucht und dann ihre Nachbarin, um sie zu tauschen. Drei oder mehr gleiche in einer Reihe verschwinden und es rutschen neue nach. Erreiche die Zielpunkte, bevor deine Züge aufgebraucht sind. Ketten geben mehr Punkte.',
      en: 'Tap a fruit, then a neighbour to swap them. Three or more of a kind in a row pop and new ones drop in. Reach the target score before your moves run out. Chain reactions score more.',
    },
    start(ctx) {
      const r = ctx.rng;
      const lvl = Math.max(0, Math.min(10, ctx.level || 0));
      const types = lvl >= 4 ? 5 : 4;
      const MOVES = 18;
      const target = 300 + lvl * 40;
      let g = [], score = 0, moves = MOVES, sel = -1, busy = false, over = false;

      const runs = (a) => {
        const hit = new Set();
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
          const v = a[y * N + x];
          if (v < 0) continue;
          if (x + 2 < N && a[y * N + x + 1] === v && a[y * N + x + 2] === v) { hit.add(y * N + x); hit.add(y * N + x + 1); hit.add(y * N + x + 2); }
          if (y + 2 < N && a[(y + 1) * N + x] === v && a[(y + 2) * N + x] === v) { hit.add(y * N + x); hit.add((y + 1) * N + x); hit.add((y + 2) * N + x); }
        }
        return hit;
      };
      const swapped = (a, i, j) => { const b = a.slice(); b[i] = a[j]; b[j] = a[i]; return b; };
      const neighbours = (i) => {
        const x = i % N, y = Math.floor(i / N), out = [];
        if (x + 1 < N) out.push(i + 1);
        if (y + 1 < N) out.push(i + N);
        return out;
      };
      const hasMove = (a) => a.some((_, i) => neighbours(i).some((j) => runs(swapped(a, i, j)).size > 0));
      const freshBoard = () => {
        for (let t = 0; t < 60; t++) {
          const a = [];
          for (let i = 0; i < N * N; i++) {
            let v, k = 0;
            do { v = Math.floor(r() * types); k++; }
            while (k < 20 && ((i % N >= 2 && a[i - 1] === v && a[i - 2] === v) || (i >= 2 * N && a[i - N] === v && a[i - 2 * N] === v)));
            a.push(v);
          }
          if (runs(a).size === 0 && hasMove(a)) return a;
        }
        return null;
      };

      ctx.el.innerHTML = '';
      // drawn motif: a little fruit basket
      const motif = F.h(`<svg class="motif" viewBox="0 0 300 64" width="320" height="68" aria-hidden="true" style="transform:rotate(1.2deg)">
        <g stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M112 30 Q150 -6 188 30" fill="none" stroke-width="4"/>
          <circle cx="128" cy="30" r="12" fill="var(--c-fun)"/><circle cx="150" cy="24" r="13" fill="var(--c-math)"/><circle cx="172" cy="30" r="12" fill="var(--c-spatial)"/>
          <path d="M150 11 q3 -6 9 -6" fill="none"/>
          <path d="M100 32 L200 32 L190 60 L110 60 Z" fill="var(--c-memory)"/>
          <path d="M106 42 L194 42 M110 51 L190 51 M126 32 L128 60 M150 32 L150 60 M174 32 L172 60" fill="none" stroke-width="1.6"/>
          <circle cx="60" cy="40" r="9" fill="var(--c-logic)"/><circle cx="72" cy="46" r="9" fill="var(--c-logic)"/><circle cx="62" cy="53" r="9" fill="var(--c-logic)"/>
          <path d="M242 30 l3 6 l6 1 l-4.5 4 l1.5 6 l-6 -3 l-5 3 l1 -6 l-4.5 -4 l6 -1 Z" fill="var(--c-math)"/>
        </g></svg>`);
      // drawn status: score meter on the left, moves as a big number in a round badge on the right
      const card = F.h('<div class="sketch" style="background:var(--card);box-shadow:var(--shadow);margin:6px 6px 14px;padding:8px 10px 8px 12px;display:flex;align-items:center;gap:12px;transform:rotate(-.5deg)"></div>');
      const left = F.h('<div style="flex:1;min-width:0"></div>');
      const info = F.h('<div style="font-size:19px;line-height:1.2"></div>');
      const bar = F.h('<div style="margin-top:5px;height:14px;border:2.5px solid var(--ink);border-radius:9px 12px 8px 11px;background:var(--paper-2);overflow:hidden"><div style="height:100%;width:100%;background:var(--good);transform-origin:left;transform:scaleX(0);transition:transform .25s"></div></div>');
      const fill = bar.firstChild;
      left.append(info, bar);
      const badge = F.h('<div style="flex:none;width:62px;height:62px;border:2.5px solid var(--ink);border-radius:50% 46% 52% 48%;background:var(--c-math);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1;color:var(--ink);transform:rotate(-4deg)"></div>');
      const movesEl = F.h('<span style="font-size:28px"></span>');
      badge.append(movesEl, F.h(`<span style="font-size:16px">${F.tt({ de: 'Züge', en: 'Moves' })}</span>`));
      card.append(left, badge);
      const frame = F.h('<div class="sketch alt" style="background:var(--paper-2);box-shadow:var(--shadow);padding:8px"></div>');
      const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${N},minmax(0,1fr));gap:4px;touch-action:manipulation"></div>`);
      frame.appendChild(board);
      const cells = [];
      for (let i = 0; i < N * N; i++) {
        const b = F.h(`<button style="aspect-ratio:1;min-width:0;padding:0;min-height:48px;border:2px solid var(--ink);border-radius:${i % 2 ? '13px 9px 12px 8px' : '9px 13px 8px 12px'};font-size:30px;line-height:1;background:var(--card);color:var(--ink);cursor:pointer;transition:transform .15s"></button>`);
        b.onclick = () => tap(i);
        board.appendChild(b); cells.push(b);
      }
      const msg = F.h('<div class="info-line" style="min-height:26px;font-size:19px;margin-top:8px"></div>');
      ctx.el.append(motif, card, frame, msg);

      // each fruit sits on its own soft tile colour (theme colours, so it works light and dark)
      const TILE = ['var(--c-fun)', 'var(--c-math)', 'var(--c-spatial)', 'var(--c-memory)', 'var(--c-logic)'];
      const prev = [];
      const pop = (b, cls) => { b.classList.remove('tap-pop', 'flash-bad'); void b.offsetWidth; b.classList.add(cls); };
      function draw(hit) {
        cells.forEach((b, i) => {
          const v = g[i];
          if (prev[i] !== v) { b.textContent = v >= 0 ? FRUITS[v] : ''; if (prev[i] !== undefined && v >= 0) pop(b, 'tap-pop'); prev[i] = v; }
          b.style.background = hit && hit.has(i) ? 'var(--accent)' : i === sel ? 'var(--card)' : v >= 0 ? TILE[v] : 'var(--card)';
          b.style.outline = i === sel ? '3px dashed var(--ink)' : '';
          b.style.transform = i === sel ? 'scale(1.08)' : '';
        });
        info.textContent = F.tt({ de: `Punkte ${score} / ${target}`, en: `Score ${score} / ${target}` });
        movesEl.textContent = moves;
        fill.style.transform = `scaleX(${Math.min(1, score / target)})`;
        ctx.setScore(score);
      }

      async function resolve() {
        let chain = 0;
        for (let guard = 0; guard < 40 && !over; guard++) {
          const hit = runs(g);
          if (!hit.size) break;
          chain++;
          score += hit.size * 10 * chain;
          ctx.sfx(chain > 1 ? 'good' : 'tick');
          msg.textContent = chain > 1 ? F.tt({ de: `Kette x${chain}!`, en: `Chain x${chain}!` }) : '';
          draw(hit);
          await ctx.wait(260);
          hit.forEach((i) => { g[i] = -1; });
          for (let x = 0; x < N; x++) {
            const col = [];
            for (let y = N - 1; y >= 0; y--) if (g[y * N + x] >= 0) col.push(g[y * N + x]);
            for (let y = N - 1, k = 0; y >= 0; y--, k++) g[y * N + x] = k < col.length ? col[k] : Math.floor(r() * types);
          }
          draw();
          await ctx.wait(220);
        }
      }

      async function tap(i) {
        if (busy || over) return;
        if (sel < 0) { sel = i; ctx.sfx('tick'); draw(); return; }
        if (sel === i) { sel = -1; draw(); return; }
        const d = Math.abs(sel - i);
        const adj = (d === 1 && Math.floor(sel / N) === Math.floor(i / N)) || d === N;
        if (!adj) { sel = i; ctx.sfx('tick'); draw(); return; }
        busy = true;
        const a = sel; sel = -1;
        const test = swapped(g, a, i);
        if (!runs(test).size) {
          g = test; draw(); ctx.sfx('bad');
          pop(cells[a], 'flash-bad'); pop(cells[i], 'flash-bad');
          await ctx.wait(250);
          g = swapped(g, a, i); draw();
          busy = false; return;
        }
        g = test; moves--; msg.textContent = '';
        await resolve();
        if (over) return;
        if (score >= target) return end(true);
        if (moves <= 0) return end(false);
        if (!hasMove(g)) {
          const nb = freshBoard();
          if (!nb) return end(score >= target);
          g = nb;
          msg.textContent = F.tt({ de: 'Keine Züge mehr – neu gemischt!', en: 'No moves left – reshuffled!' });
        }
        draw();
        busy = false;
      }

      async function end(win) {
        over = true; busy = true;
        const bonus = win ? moves * 20 : 0;
        score += bonus;
        draw();
        ctx.sfx(win ? 'win' : 'bad');
        msg.textContent = win ? F.tt({ de: `Geschafft! Restzüge-Bonus +${bonus}`, en: `Done! Leftover-move bonus +${bonus}` }) : F.tt({ de: 'Keine Züge mehr', en: 'Out of moves' });
        await ctx.wait(1300);
        ctx.finish({
          score, detail: F.tt({ de: `${score} von ${target} Punkten`, en: `${score} of ${target} points` }),
          levelDelta: win ? (moves >= 5 ? 1 : 0) : -1, quality: Math.min(1, score / target), ink: 3 + Math.round(score / 60),
        });
      }

      const b0 = freshBoard();
      if (!b0) { g = Array.from({ length: N * N }, (_, i) => (i % N + Math.floor(i / N) * 2) % types); } else g = b0;
      draw();
    },
  });
})();
