/* Minefield: uncover every safe square without touching a mine. Numbers count the mines next to a square. */
(function () {
  const F = Funkloch;
  const SIZES = { easy: [6, 8, 7], normal: [7, 9, 11], hard: [7, 10, 16] }; // cols, rows, mines

  F.registerGame({
    id: 'minesweeper', skill: 'logic', added: '2026-10-23', glyph: '💣',
    name: { de: 'Minenfeld', en: 'Minefield' },
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
      // Drawn pieces: a little pennant flag and a round mine with spikes and a shine stroke.
      const FLAG = '<svg viewBox="0 0 40 40" style="width:70%;height:70%;display:block;margin:auto;overflow:visible"><path d="M12 35 L13 5" fill="none" stroke="var(--ink)" stroke-width="3.2" stroke-linecap="round"/><path d="M13 6 Q22 7 31 12 Q22 16 13.4 19Z" fill="var(--bad)" stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round"/><path d="M7 35.5 Q13 33 19 35.5" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/></svg>';
      const MINE = '<svg viewBox="0 0 40 40" style="width:72%;height:72%;display:block;margin:auto;overflow:visible"><path d="M20 3V9M20 31V37M3 20H9M31 20H37M8 8L12 12M28 28L32 32M32 8L28 12M8 32L12 28" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/><circle cx="20" cy="20" r="10.5" fill="var(--ink)"/><path d="M15 16 Q17 13.5 20 13.5" fill="none" stroke="var(--paper)" stroke-width="2.4" stroke-linecap="round"/></svg>';
      const frame = F.h('<div class="sketch" style="max-width:356px;margin:4px auto 12px;padding:7px;background:var(--paper-2);box-shadow:var(--shadow);transform:rotate(-0.4deg)"></div>');
      const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${W},minmax(0,1fr));gap:4px;touch-action:manipulation"></div>`);
      frame.appendChild(board);
      const btns = [];
      for (let i = 0; i < N; i++) {
        const b = F.h('<button style="aspect-ratio:1;min-width:0;padding:0;border:2.5px solid var(--ink);border-radius:10px 12px 9px 11px;font-size:24px;line-height:1;cursor:pointer;color:var(--ink);background:var(--c-focus);font-family:inherit;display:flex;align-items:center;justify-content:center"></button>');
        b.onclick = () => tap(i);
        board.appendChild(b); btns.push(b);
      }
      // Bottom bar in the thumb zone: mines left, then a two-part switch Dig | Flag.
      const bar = F.h('<div style="display:grid;grid-template-columns:76px minmax(0,1fr) minmax(0,1fr);gap:8px;align-items:center;max-width:356px;margin:0 auto"></div>');
      const left = F.h('<div style="display:flex;align-items:center;justify-content:center;gap:4px;font-size:24px;min-height:60px"></div>');
      const digBtn = F.h('<button class="btn" style="min-height:60px;min-width:0;padding:4px 6px;font-size:19px;white-space:nowrap"></button>');
      const flagBtn = F.h('<button class="btn" style="min-height:60px;min-width:0;padding:4px 6px;font-size:19px;white-space:nowrap"></button>');
      bar.append(left, digBtn, flagBtn);
      ctx.el.append(frame, bar);
      // Number chips: colour from the style variables, digit always in ink (readable in light and dark).
      const CHIP = ['', '--c-focus', '--c-spatial', '--c-memory', '--c-logic', '--c-fun', '--c-chem', '--c-math', '--dot'];
      const wasOpen = Array(N).fill(false);

      function draw() {
        const flags = flag.filter(Boolean).length;
        left.innerHTML = `<svg viewBox="0 0 40 40" width="26" height="26" aria-hidden="true">${MINE.slice(MINE.indexOf('>') + 1, -6)}</svg><b>${M - flags}</b>`;
        digBtn.innerHTML = '⛏ ' + F.tt({ de: 'Aufdecken', en: 'Dig' });
        flagBtn.innerHTML = '🚩 ' + F.tt({ de: 'Flagge', en: 'Flag' });
        [[digBtn, !flagMode], [flagBtn, flagMode]].forEach(([b, on]) => {
          b.style.background = on ? 'var(--c-math)' : 'var(--card)';
          b.style.borderWidth = on ? '3.5px' : '2.5px';
          b.style.transform = on ? 'translate(2px,2px)' : '';
          b.style.boxShadow = on ? '1px 1px 0 var(--ink)' : '';
        });
        ctx.setInfo(`⏱ ${secs}s`);
        btns.forEach((b, i) => {
          if (open[i]) {
            const boom = mines && mines.has(i);
            b.style.background = boom ? 'var(--bad)' : 'var(--card)';
            b.style.boxShadow = 'none';
            b.style.borderColor = boom ? 'var(--ink)' : 'var(--ink-faint)';
            b.style.fontWeight = 'bold';
            b.innerHTML = boom ? MINE : count[i] ? `<span style="display:flex;align-items:center;justify-content:center;width:76%;height:76%;border-radius:50% 45% 50% 42%;background:var(${CHIP[count[i]]});color:var(--ink)">${count[i]}</span>` : '';
            if (!wasOpen[i]) { b.classList.remove('pop-in'); void b.offsetWidth; b.classList.add('pop-in'); wasOpen[i] = true; }
          } else {
            b.style.background = 'var(--c-focus)';
            b.style.boxShadow = 'inset 3px 3px 0 rgba(255,255,255,.35), 2px 2px 0 var(--ink)';
            b.style.borderColor = 'var(--ink)';
            b.innerHTML = flag[i] ? FLAG : (done && mines && mines.has(i) ? MINE : '');
          }
        });
      }
      const setMode = (f) => { if (done || flagMode === f) return; flagMode = f; ctx.sfx('tick'); draw(); };
      digBtn.onclick = () => setMode(false);
      flagBtn.onclick = () => setMode(true);

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
        if (!won) { frame.classList.remove('flash-bad'); void frame.offsetWidth; frame.classList.add('flash-bad'); }
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
