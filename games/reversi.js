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
    id: 'reversi', skill: 'logic', added: '2026-11-11', glyph: '⚪⚫',
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
      // Wooden frame around a felt board; the lines are the ink showing through 2px gaps.
      const frame = F.h('<div class="sketch" style="padding:9px;margin:6px 0 0;background:var(--c-memory);box-shadow:var(--shadow)"></div>');
      const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${N},minmax(0,1fr));gap:2px;padding:2px;background:var(--ink);border-radius:6px"></div>`);
      frame.appendChild(board);
      const cells = b.map((_, i) => {
        const c = F.h('<button style="aspect-ratio:1;min-width:0;padding:0;min-height:48px;border:0;border-radius:3px;background:var(--c-spatial);display:flex;align-items:center;justify-content:center;cursor:pointer"></button>');
        c.onclick = () => tap(i);
        board.appendChild(c);
        return c;
      });
      // Discs keep fixed dark/light colours in every theme ("you are dark"); both show on light and dark felt.
      const DARK = '#2B2522', LIGHT = '#FFFDF8';
      const disc = (p, size, extra = '') => `<svg viewBox="0 0 40 40" style="width:${size};height:${size};display:block" ${extra}>
        <circle cx="20" cy="21.5" r="16" style="fill:${DARK};opacity:.25"/>
        <circle cx="20" cy="19.5" r="16" style="fill:${p === ME ? DARK : LIGHT};stroke:var(--ink)" stroke-width="2.5"/>
        ${p === ME ? `<path d="M10,16 C11,11 15,8 20,7.5" style="fill:none;stroke:${LIGHT};opacity:.7" stroke-width="2.6" stroke-linecap="round"/>`
          : `<path d="M30,23 C29,28 25,31 20,31.5" style="fill:none;stroke:${DARK};opacity:.3" stroke-width="2.6" stroke-linecap="round"/>`}</svg>`;
      const tally = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px"></div>');
      const side = (p, label) => {
        const el = F.h(`<div class="card sketch" style="padding:12px 10px;display:flex;align-items:center;justify-content:center;gap:10px">${disc(p, '46px')}<div style="line-height:1.1;text-align:left"><div style="font-size:17px;color:var(--ink-soft)">${F.tt(label)}</div><b style="font-size:36px;font-weight:normal">2</b></div></div>`);
        tally.appendChild(el);
        return el.querySelector('b');
      };
      const meEl = side(ME, { de: 'Du', en: 'You' }), cpuEl = side(CPU, { de: 'Computer', en: 'Computer' });
      // Who is ahead, as a bar split dark | light.
      const bar = F.h(`<div style="display:flex;height:24px;margin-top:16px;border:2.5px solid var(--ink);border-radius:10px 14px 9px 12px;overflow:hidden;background:${LIGHT}"><div style="background:${DARK}"></div></div>`);
      ctx.el.append(info, frame, tally, bar);

      let prev = b.slice();
      function draw(hints) {
        cells.forEach((c, i) => {
          const v = b[i];
          let inner = '';
          if (v) inner = disc(v, '82%', `class="${prev[i] !== v ? 'tap-pop' : ''}"`);
          else if (hints && flips(b, i, ME).length) inner = '<svg viewBox="0 0 40 40" style="width:34%;height:34%;display:block"><circle cx="20" cy="20" r="14" style="fill:var(--accent);stroke:var(--ink)" stroke-width="3"/></svg>';
          c.innerHTML = inner;
          c.style.outline = v && i === last ? '3px dashed var(--accent)' : '';
          c.style.outlineOffset = '-4px';
        });
        prev = b.slice();
        const a = count(b, ME), d = count(b, CPU);
        meEl.textContent = a; cpuEl.textContent = d;
        bar.firstChild.style.width = `${Math.round((a / Math.max(1, a + d)) * 100)}%`;
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
