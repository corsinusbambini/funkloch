/* Hitori (classic number puzzle): shade cells so no number repeats in a row or column,
   shaded cells never touch, and all unshaded cells stay connected. */
(function () {
  const F = Funkloch;
  const PUZZLES = 3;

  function whitesConnected(N, black) {
    let start = -1, total = 0;
    for (let i = 0; i < N * N; i++) if (!black[i]) { total++; if (start < 0) start = i; }
    if (start < 0) return false;
    const seen = new Set([start]), stack = [start];
    while (stack.length) {
      const c = stack.pop(), x = c % N, y = Math.floor(c / N);
      [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= N || ny >= N) return;
        const n = ny * N + nx;
        if (!black[n] && !seen.has(n)) { seen.add(n); stack.push(n); }
      });
    }
    return seen.size === total;
  }

  // Latin square first, then shade some lonely cells and give each shaded cell a number that
  // copies a white cell in its row or column. A valid solution always exists.
  function makePuzzle(r, N, lvl) {
    const rows = r.shuffle([...Array(N).keys()]), cols = r.shuffle([...Array(N).keys()]);
    const sym = r.shuffle(Array.from({ length: N }, (_, i) => i + 1));
    const grid = [];
    for (let i = 0; i < N; i++) for (let j = 0; j < N; j++) grid.push(sym[(rows[i] + cols[j]) % N]);
    const want = Math.round(N * N * (0.2 + Math.min(lvl, 8) * 0.01));
    const black = new Array(N * N).fill(false);
    const order = r.shuffle([...Array(N * N).keys()]);
    let count = 0;
    for (const c of order) {
      if (count >= want) break;
      const x = c % N, y = Math.floor(c / N);
      const touch = (x > 0 && black[c - 1]) || (x < N - 1 && black[c + 1]) || (y > 0 && black[c - N]) || (y < N - 1 && black[c + N]);
      if (touch) continue;
      black[c] = true;
      if (!whitesConnected(N, black)) { black[c] = false; continue; }
      count++;
    }
    for (let c = 0; c < N * N; c++) {
      if (!black[c]) continue;
      const x = c % N, y = Math.floor(c / N), opts = [];
      for (let k = 0; k < N; k++) {
        if (k !== x && !black[y * N + k]) opts.push(grid[y * N + k]);
        if (k !== y && !black[k * N + x]) opts.push(grid[k * N + x]);
      }
      if (opts.length) grid[c] = r.pick(opts);
    }
    return { N, grid, black };
  }

  // Which rules are broken right now? shade = array of 0/1/2 (2 = marked as safe).
  function check(N, grid, shade) {
    const dup = new Set(), touch = new Set();
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) {
      const c = y * N + x;
      if (shade[c] === 1) {
        if (x < N - 1 && shade[c + 1] === 1) { touch.add(c); touch.add(c + 1); }
        if (y < N - 1 && shade[c + N] === 1) { touch.add(c); touch.add(c + N); }
        continue;
      }
      for (let k = x + 1; k < N; k++) if (shade[y * N + k] !== 1 && grid[y * N + k] === grid[c]) { dup.add(c); dup.add(y * N + k); }
      for (let k = y + 1; k < N; k++) if (shade[k * N + x] !== 1 && grid[k * N + x] === grid[c]) { dup.add(c); dup.add(k * N + x); }
    }
    const black = shade.map((s) => s === 1);
    const connected = whitesConnected(N, black);
    return { dup, touch, connected, ok: dup.size === 0 && touch.size === 0 && connected };
  }

  F.registerGame({
    id: 'hitori', skill: 'logic', added: '2026-11-16', glyph: '▪1▪',
    name: { de: 'Hitori', en: 'Hitori' },
    desc: {
      de: 'Färbe Felder dunkel, bis keine Zahl mehr zweimal in derselben Zeile oder Spalte steht. Dunkle Felder dürfen sich nicht berühren, und alle hellen Felder müssen zusammenhängen. Tippe einmal = dunkel, zweimal = sicher hell, dreimal = löschen. Löse 3 Rätsel.',
      en: 'Shade cells until no number appears twice in the same row or column. Shaded cells must not touch, and all light cells must stay connected. Tap once = shade, twice = marked safe, three times = clear. Solve 3 puzzles.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = ctx.level || 0;
      let round = 0, points = 0, checks = 0, solved = 0;
      const t0 = Date.now();

      function next() {
        if (round >= PUZZLES) return end();
        round++;
        const N = lvl >= 3 && round >= 2 ? 6 : 5;
        const pz = ctx.fresh(() => makePuzzle(r, N, lvl), (p) => p.grid.join(''));
        const shade = new Array(N * N).fill(0);
        let done = false, roundChecks = 0, showBad = false;
        ctx.setScore(points); ctx.setInfo(`${round} / ${PUZZLES}`);
        ctx.el.innerHTML = '';

        const board = F.h(`<div class="sketch pop-in" style="padding:16px 14px 16px;margin:8px 0 12px;background:var(--card);box-shadow:var(--shadow);transform:rotate(-0.4deg)"></div>`);
        board.appendChild(F.h(`<svg class="motif" viewBox="0 0 160 22" width="160" height="22" aria-hidden="true" style="display:block;margin:-6px auto 8px;color:var(--ink)">
          <path d="M8,13 q12,-9 24,0 t24,0 t24,0" fill="none" stroke="var(--ink-soft)" stroke-width="2.4" stroke-linecap="round"/>
          <g transform="rotate(-14 122 11)"><rect x="96" y="6" width="50" height="11" rx="2" style="fill:var(--c-logic);stroke:var(--ink)" stroke-width="2"/><path d="M96,6 L84,11.5 L96,17 Z" style="fill:var(--paper-2);stroke:var(--ink)" stroke-width="2" stroke-linejoin="round"/><path d="M88,10 l-4,1.5 l4,1.5" style="fill:var(--ink)"/><rect x="138" y="6" width="8" height="11" style="fill:var(--accent);stroke:var(--ink)" stroke-width="2"/></g></svg>`));
        const grid = F.h(`<div style="display:grid;grid-template-columns:repeat(${N},minmax(0,1fr));gap:8px"></div>`);
        board.appendChild(grid);
        const cells = [];
        const fs = N === 5 ? 34 : 30;
        for (let c = 0; c < N * N; c++) {
          const b = F.h(`<button style="width:100%;min-width:0;padding:0;aspect-ratio:1;font-size:${fs}px;line-height:1;border:2.5px solid var(--ink);border-radius:${c % 2 ? '10px 14px 10px 12px' : '14px 10px 13px 10px'};cursor:pointer;color:var(--ink);background:var(--paper-2);position:relative;-webkit-tap-highlight-color:transparent">${pz.grid[c]}</button>`);
          b.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (done) return;
            shade[c] = (shade[c] + 1) % 3;
            ctx.sfx(shade[c] === 1 ? 'tap' : 'tick');
            b.classList.remove('tap-pop'); void b.offsetWidth; b.classList.add('tap-pop');
            showBad = false;
            paint();
            if (check(N, pz.grid, shade).ok) win();
          });
          cells.push(b); grid.appendChild(b);
        }
        const msg = F.h('<div class="info-line" style="text-align:center;min-height:56px;margin:2px 0 12px;font-size:20px"></div>');
        const btnRow = F.h(`<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px"></div>`);
        const bCheck = F.h(`<button class="opt" style="min-width:0;min-height:92px;font-size:26px">${F.esc(F.tt({ de: '🔍 Prüfen', en: '🔍 Check' }))}</button>`);
        const bClear = F.h(`<button class="opt" style="min-width:0;min-height:92px;font-size:26px">${F.esc(F.tt({ de: '↺ Leeren', en: '↺ Clear' }))}</button>`);
        btnRow.append(bCheck, bClear);
        const legend = F.h(`<div style="display:flex;justify-content:center;gap:22px;margin:0 0 10px;font-size:18px;color:var(--ink-soft)"><span style="display:inline-flex;align-items:center;gap:8px"><svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><rect x="3" y="3" width="20" height="20" rx="5" style="fill:var(--ink)" transform="rotate(-4 13 13)"/></svg>${F.esc(F.tt({ de: 'dunkel', en: 'shaded' }))}</span><span style="display:inline-flex;align-items:center;gap:8px"><svg width="26" height="26" viewBox="0 0 26 26" aria-hidden="true"><circle cx="13" cy="13" r="10" fill="none" style="stroke:var(--good)" stroke-width="3.4"/></svg>${F.esc(F.tt({ de: 'sicher hell', en: 'safe' }))}</span></div>`);
        ctx.el.append(board, msg, legend, btnRow);
        msg.textContent = F.tt({ de: 'Tippe ein Feld: dunkel, sicher hell, leer', en: 'Tap a cell: shaded, safe, empty' });

        function paint() {
          const st = check(N, pz.grid, shade);
          cells.forEach((b, i) => {
            const s = shade[i];
            const bad = st.touch.has(i) || (showBad && st.dup.has(i));
            b.style.background = s === 1 ? (bad ? 'var(--bad)' : 'var(--ink)') : bad ? 'var(--bad)' : s === 2 ? 'var(--card)' : 'var(--paper-2)';
            b.style.color = s === 1 ? (bad ? 'var(--ink)' : 'var(--card)') : bad ? '#2a1f1f' : 'var(--ink)';
            b.style.opacity = s === 1 ? '0.9' : '1';
            b.style.transform = s === 1 ? 'rotate(' + (i % 3 - 1) * 1.5 + 'deg)' : '';
            b.style.boxShadow = s === 2 ? 'inset 0 0 0 3px var(--good)' : '';
            b.style.borderRadius = s === 2 ? '50%' : (i % 2 ? '10px 14px 10px 12px' : '14px 10px 13px 10px');
          });
        }
        bCheck.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (done) return;
          checks++; roundChecks++;
          const st = check(N, pz.grid, shade);
          showBad = true; paint();
          if (st.touch.size) { ctx.sfx('bad'); msg.textContent = F.tt({ de: 'Dunkle Felder dürfen sich nicht berühren.', en: 'Shaded cells must not touch.' }); }
          else if (st.dup.size) { ctx.sfx('bad'); msg.textContent = F.tt({ de: 'Rot markierte Zahlen stehen noch doppelt.', en: 'Red numbers still appear twice.' }); }
          else if (!st.connected) { ctx.sfx('bad'); msg.textContent = F.tt({ de: 'Die hellen Felder hängen nicht alle zusammen.', en: 'The light cells are not all connected.' }); }
          bCheck.classList.remove('tap-pop'); void bCheck.offsetWidth; bCheck.classList.add('tap-pop');
        });
        bClear.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (done) return;
          ctx.sfx('tick'); shade.fill(0); showBad = false; paint();
          msg.textContent = F.tt({ de: 'Neu angefangen', en: 'Fresh start' });
          bClear.classList.remove('tap-pop'); void bClear.offsetWidth; bClear.classList.add('tap-pop');
        });
        paint();

        async function win() {
          done = true; solved++;
          points += 20 + Math.max(0, 10 - roundChecks * 3);
          cells.forEach((b, i) => { b.style.boxShadow = shade[i] === 1 ? '' : 'inset 0 0 0 3px var(--good)'; });
          ctx.setScore(points); ctx.sfx('win');
          board.classList.add('flash-ok');
          msg.textContent = F.tt({ de: 'Gelöst! ⭐', en: 'Solved! ⭐' });
          F.cheer(round < PUZZLES ? 8 : 12);
          await ctx.wait(1100);
          next();
        }
      }

      function end() {
        const secs = Math.round((Date.now() - t0) / 1000);
        const score = points + Math.max(0, 15 - Math.floor(secs / 25));
        ctx.finish({
          score,
          detail: F.tt({ de: `${solved} Rätsel, ${checks}× geprüft, ${secs} s`, en: `${solved} puzzles, checked ${checks}×, ${secs} s` }),
          levelDelta: checks <= 2 ? 1 : checks > 8 ? -1 : 0,
          quality: Math.max(0.2, 1 - checks * 0.07), ink: 6 + Math.round(score / 5),
        });
      }
      next();
    },
  });
})();
