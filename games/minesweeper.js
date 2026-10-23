/* Minesweeper: uncover every safe square without touching a mine. Numbers count the mines next to a square. */
(function () {
  const F = Funkloch;
  const SIZES = { easy: [6, 8, 7], normal: [7, 9, 11], hard: [7, 10, 16] }; // cols, rows, mines

  F.registerGame({
    id: 'minesweeper', skill: 'logic', added: '2026-10-23', glyph: '💣',
    name: { de: 'Minesweeper', en: 'Minesweeper' },
    desc: { de: 'Decke alle sicheren Felder auf, ohne eine Mine zu berühren. Eine Zahl sagt, wie viele Minen an das Feld grenzen. Mit 🚩 markierst du Minen. Das erste Feld ist immer sicher. Alle sicheren Felder offen = gewonnen.', en: 'Uncover every safe square without touching a mine. A number tells how many mines touch that square. Use 🚩 to mark mines. Your first tap is always safe. All safe squares open = you win.' },
    modes: [
      { id: 'easy', name: { de: 'Leicht', en: 'Easy' }, desc: { de: '6×8 Felder, 7 Minen', en: '6×8 squares, 7 mines' } },
      { id: 'normal', name: { de: 'Mittel', en: 'Medium' }, desc: { de: '7×9 Felder, 11 Minen', en: '7×9 squares, 11 mines' } },
      { id: 'hard', name: { de: 'Schwer', en: 'Hard' }, desc: { de: '7×10 Felder, 16 Minen', en: '7×10 squares, 16 mines' } },
    ],
    start(ctx) {
      const r = ctx.rng;
      const [W, H, M] = SIZES[ctx.mode] || SIZES.easy;
      const N = W * H;
      const nbrs = (i) => {
        const x = i % W, y = Math.floor(i / W), out = [];
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const a = x + dx, b = y + dy;
          if ((dx || dy) && a >= 0 && a < W && b >= 0 && b < H) out.push(b * W + a);
        }
        return out;
      };
      let mines = null, count = Array(N).fill(0);
      const open = Array(N).fill(false), flag = Array(N).fill(false);
      let flagMode = false, done = false, secs = 0, started = false;

      const place = (first) => {
        const safe = new Set([first, ...nbrs(first)]);
        const pool = r.shuffle(Array.from({ length: N }, (_, i) => i).filter((i) => !safe.has(i)));
        mines = new Set(pool.slice(0, M));
        mines.forEach((m) => nbrs(m).forEach((n) => count[n]++));
      };

      ctx.el.innerHTML = '';
      const bar = F.h('<div style="display:flex;gap:10px;justify-content:center;align-items:center;margin:8px auto;max-width:340px"></div>');
      const modeBtn = F.h('<button class="btn small" style="min-height:48px;flex:1"></button>');
      const left = F.h('<span style="font-size:22px;min-width:84px;text-align:center"></span>');
      bar.append(left, modeBtn);
      const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${W},minmax(0,1fr));gap:4px;max-width:340px;margin:8px auto;touch-action:manipulation"></div>`);
      const btns = [];
      for (let i = 0; i < N; i++) {
        const b = F.h('<button style="aspect-ratio:1;min-width:0;padding:0;min-height:44px;border:2.5px solid var(--ink);border-radius:10px;font-size:22px;line-height:1;cursor:pointer;color:var(--ink);background:var(--c-focus);font-family:inherit"></button>');
        b.onclick = () => tap(i);
        board.appendChild(b); btns.push(b);
      }
      ctx.el.append(bar, board);
      const COLS = ['', '#2E6FD0', '#2E9E5B', '#D9534F', '#6B3FA0', '#B8651B', '#1F9AA6', '#333', '#777'];

      function draw() {
        const flags = flag.filter(Boolean).length;
        left.textContent = `💣 ${M - flags}`;
        modeBtn.textContent = flagMode ? F.tt({ de: '🚩 Flaggen-Modus', en: '🚩 Flag mode' }) : F.tt({ de: '⛏ Aufdecken', en: '⛏ Dig' });
        ctx.setInfo(`⏱ ${secs}s`);
        btns.forEach((b, i) => {
          if (open[i]) {
            b.style.background = mines && mines.has(i) ? 'var(--bad)' : 'var(--card)';
            b.style.boxShadow = 'none';
            b.textContent = mines && mines.has(i) ? '💥' : count[i] || '';
            b.style.color = mines && mines.has(i) ? 'var(--ink)' : COLS[count[i]] || 'var(--ink)';
            b.style.fontWeight = 'bold';
          } else {
            b.style.background = 'var(--c-focus)';
            b.style.boxShadow = 'var(--shadow)';
            b.style.color = 'var(--ink)';
            b.textContent = flag[i] ? '🚩' : (done && mines && mines.has(i) ? '💣' : '');
          }
        });
      }
      modeBtn.onclick = () => { if (done) return; flagMode = !flagMode; ctx.sfx('tick'); draw(); };

      const iv = setInterval(() => { if (started && !done) { secs++; ctx.setInfo(`⏱ ${secs}s`); } }, 1000);
      ctx.onCleanup(() => clearInterval(iv));

      function flood(i) {
        const stack = [i];
        while (stack.length) {
          const c = stack.pop();
          if (open[c] || flag[c]) continue;
          open[c] = true;
          if (count[c] === 0) nbrs(c).forEach((n) => { if (!open[n]) stack.push(n); });
        }
      }
      async function end(won) {
        done = true;
        if (!won) mines.forEach((m) => { if (!flag[m]) open[m] = true; });
        draw();
        ctx.sfx(won ? 'good' : 'bad');
        const safeOpen = open.filter((o, i) => o && !mines.has(i)).length;
        await ctx.wait(1400);
        const score = won ? Math.max(10, M * 6 + 80 - secs) : safeOpen;
        ctx.finish({
          score, display: won ? F.tt({ de: `Geschafft in ${secs}s!`, en: `Cleared in ${secs}s!` }) : undefined,
          detail: won ? undefined : F.tt({ de: `Boom! ${safeOpen} von ${N - M} sicheren Feldern`, en: `Boom! ${safeOpen} of ${N - M} safe squares` }),
          quality: won ? 0.9 : Math.min(0.6, safeOpen / (N - M)), ink: won ? 8 + M : Math.round(safeOpen / 4),
        });
      }
      function tap(i) {
        if (done) return;
        if (flagMode) {
          if (open[i]) return;
          flag[i] = !flag[i]; ctx.sfx('tick'); return draw();
        }
        if (flag[i]) return;
        if (open[i]) {
          // chord: if the flags around match the number, open the other neighbours
          if (!count[i]) return;
          const ns = nbrs(i);
          if (ns.filter((n) => flag[n]).length !== count[i]) return;
          let boom = false;
          ns.forEach((n) => { if (!flag[n] && !open[n]) { if (mines.has(n)) { open[n] = true; boom = true; } else flood(n); } });
          draw();
          return boom ? end(false) : check();
        }
        if (!mines) { place(i); started = true; }
        if (mines.has(i)) { open[i] = true; return end(false); }
        ctx.sfx('tap');
        flood(i);
        draw();
        check();
      }
      function check() {
        if (open.filter(Boolean).length === N - M && !done) end(true);
      }
      draw();
    },
  });
})();
