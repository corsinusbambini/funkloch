/* Reversi (mini 6x6): flank the computer's discs to flip them. Most discs at the end wins. */
(function () {
  const F = Funkloch;
  const N = 6, ME = 1, CPU = 2;
  const DIRS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

  // Positional weights: corners are gold, squares next to corners are risky, edges are fine.
  const W = Array.from({ length: N * N }, (_, i) => {
    const x = i % N, y = Math.floor(i / N), ex = x === 0 || x === N - 1, ey = y === 0 || y === N - 1;
    const nx = x === 1 || x === N - 2, ny = y === 1 || y === N - 2;
    if (ex && ey) return 100;
    if ((ex && ny) || (ey && nx)) return -20;
    if (nx && ny) return -35;
    if (ex || ey) return 10;
    return 1;
  });

  function flips(b, i, p) {
    if (b[i]) return [];
    const x0 = i % N, y0 = Math.floor(i / N), out = [];
    for (const [dx, dy] of DIRS) {
      const line = [];
      let x = x0 + dx, y = y0 + dy;
      while (x >= 0 && y >= 0 && x < N && y < N && b[y * N + x] === 3 - p) { line.push(y * N + x); x += dx; y += dy; }
      if (line.length && x >= 0 && y >= 0 && x < N && y < N && b[y * N + x] === p) out.push(...line);
    }
    return out;
  }
  const moves = (b, p) => { const m = []; for (let i = 0; i < N * N; i++) if (flips(b, i, p).length) m.push(i); return m; };
  function play(b, i, p) {
    const f = flips(b, i, p), c = b.slice();
    c[i] = p; f.forEach((k) => { c[k] = p; });
    return c;
  }
  const count = (b, p) => b.reduce((s, v) => s + (v === p ? 1 : 0), 0);
  const posScore = (b) => b.reduce((s, v, i) => s + (v === CPU ? W[i] : v === ME ? -W[i] : 0), 0);

  // The computer's choice. Low levels often play greedily or randomly, high levels look one reply ahead.
  function cpuMove(b, r, level) {
    const ms = moves(b, CPU);
    if (level < 3 && r() < 0.35) return r.pick(ms);
    let best = [], bestV = -Infinity;
    for (const m of ms) {
      const nb = play(b, m, CPU);
      let v;
      if (level < 3) v = count(nb, CPU) * 2 + W[m];
      else if (level < 6) v = posScore(nb) + count(nb, CPU) * 0.5;
      else {
        const rep = moves(nb, ME);
        let worst = Infinity;
        if (!rep.length) worst = posScore(nb) + 10;
        for (const q of rep) worst = Math.min(worst, posScore(play(nb, q, ME)));
        v = worst;
      }
      if (v > bestV + 1e-9) { bestV = v; best = [m]; } else if (Math.abs(v - bestV) <= 1e-9) best.push(m);
    }
    return r.pick(best);
  }

  F.registerGame({
    id: 'reversi', skill: 'logic', added: '2026-11-11', glyph: '⚫',
    name: { de: 'Reversi', en: 'Reversi' },
    desc: {
      de: 'Du bist dunkel. Setze eine Scheibe so, dass sie helle Scheiben einklemmt, dann drehen sie um. Gewonnen hat, wer am Ende mehr Scheiben hat. Ecken sind Gold wert! Kleines 6×6-Feld gegen den Computer.',
      en: 'You are dark. Place a disc so it traps light discs between your discs and they flip. Whoever has more discs at the end wins. Corners are gold! Small 6×6 board against the computer.',
    },
    start(ctx) {
      const r = ctx.rng, level = Math.max(0, ctx.level || 0);
      let b = new Array(N * N).fill(0), over = false, busy = false, last = -1;
      const m0 = N / 2 - 1;
      b[m0 * N + m0] = CPU; b[(m0 + 1) * N + m0 + 1] = CPU; b[m0 * N + m0 + 1] = ME; b[(m0 + 1) * N + m0] = ME;
      ctx.onCleanup(() => { over = true; });

      ctx.el.innerHTML = '';
      const info = F.h('<div class="info-line" style="min-height:26px"></div>');
      const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${N},minmax(0,1fr));gap:4px;max-width:340px;margin:10px auto;padding:6px;border:2.5px solid var(--ink);border-radius:14px;background:var(--card)"></div>`);
      const cells = b.map((_, i) => {
        const c = F.h('<button style="aspect-ratio:1;min-width:0;padding:0;min-height:48px;border:2px solid var(--ink-faint);border-radius:10px;background:var(--c-logic);display:flex;align-items:center;justify-content:center;cursor:pointer"></button>');
        c.onclick = () => tap(i);
        board.appendChild(c);
        return c;
      });
      const tally = F.h('<div class="info-line" style="min-height:24px"></div>');
      ctx.el.append(info, board, tally);

      function draw(hints) {
        cells.forEach((c, i) => {
          const v = b[i];
          let inner = '';
          if (v) inner = `<span style="display:block;width:78%;aspect-ratio:1;border-radius:50%;border:2.5px solid var(--ink);background:${v === ME ? 'var(--ink)' : 'var(--card)'};${i === last ? 'outline:3px dashed var(--accent);outline-offset:1px;' : ''}"></span>`;
          else if (hints && flips(b, i, ME).length) inner = '<span style="display:block;width:26%;aspect-ratio:1;border-radius:50%;background:var(--accent);opacity:.8"></span>';
          c.innerHTML = inner;
        });
        const a = count(b, ME), d = count(b, CPU);
        tally.textContent = F.tt({ de: `Du: ${a} · Computer: ${d}`, en: `You: ${a} · Computer: ${d}` });
        ctx.setScore(a * 3);
      }

      async function cpuTurns() {
        // The computer plays; if you have no move it keeps playing.
        for (let guard = 0; guard < N * N && !over; guard++) {
          const cm = moves(b, CPU);
          if (!cm.length) break;
          info.textContent = F.tt({ de: 'Computer denkt …', en: 'Computer is thinking …' });
          await ctx.wait(650);
          if (over) return;
          const m = cpuMove(b, r, level);
          b = play(b, m, CPU); last = m;
          ctx.sfx('tick');
          draw(false);
          if (moves(b, ME).length) break;
          if (!moves(b, CPU).length) break;
          info.textContent = F.tt({ de: 'Du musst passen.', en: 'You have to pass.' });
          await ctx.wait(900);
        }
        if (over) return;
        if (!moves(b, ME).length) {
          if (!moves(b, CPU).length) return end();
          return cpuTurns();
        }
        busy = false;
        info.textContent = F.tt({ de: 'Du bist dran – tippe auf einen Punkt.', en: 'Your turn – tap a dot.' });
        draw(true);
      }

      async function tap(i) {
        if (over || busy || !flips(b, i, ME).length) return;
        busy = true;
        b = play(b, i, ME); last = i;
        ctx.sfx('good');
        draw(false);
        if (!moves(b, CPU).length) {
          if (!moves(b, ME).length) return end();
          info.textContent = F.tt({ de: 'Computer muss passen.', en: 'Computer has to pass.' });
          await ctx.wait(900);
          if (over) return;
          busy = false; info.textContent = F.tt({ de: 'Du bist dran – tippe auf einen Punkt.', en: 'Your turn – tap a dot.' });
          draw(true);
          return;
        }
        cpuTurns();
      }

      function end() {
        if (over) return;
        over = true;
        draw(false);
        const a = count(b, ME), d = count(b, CPU), win = a > d;
        ctx.sfx(win ? 'win' : 'bad');
        ctx.finish({
          score: a * 3 + (win ? 30 : 0),
          detail: F.tt({ de: `${a} : ${d} – ${win ? 'gewonnen!' : a === d ? 'unentschieden' : 'verloren'}`, en: `${a} : ${d} – ${win ? 'you win!' : a === d ? 'a draw' : 'you lose'}` }),
          levelDelta: win ? 1 : a < d ? -1 : 0,
          quality: Math.min(1, a / (N * N / 2 + 6)), ink: 3 + Math.round(a / 2) + (win ? 4 : 0),
        });
      }

      info.textContent = F.tt({ de: 'Du bist dran – tippe auf einen Punkt.', en: 'Your turn – tap a dot.' });
      draw(true);
    },
  });
})();
