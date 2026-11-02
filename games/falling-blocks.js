/* Falling Blocks (Tetris-style): move and turn falling pieces, complete rows to clear them. */
(function () {
  const F = Funkloch;
  const COLS = 10, ROWS = 16, WIN = 25;
  // piece shapes as [x,y] cells in their spawn rotation
  const SHAPES = [
    [[0, 1], [1, 1], [2, 1], [3, 1]], // I
    [[0, 0], [1, 0], [0, 1], [1, 1]], // O
    [[1, 0], [0, 1], [1, 1], [2, 1]], // T
    [[1, 0], [2, 0], [0, 1], [1, 1]], // S
    [[0, 0], [1, 0], [1, 1], [2, 1]], // Z
    [[0, 0], [0, 1], [1, 1], [2, 1]], // J
    [[2, 0], [0, 1], [1, 1], [2, 1]], // L
  ];
  const SIZES = [4, 2, 3, 3, 3, 3, 3];

  F.registerGame({
    id: 'falling-blocks', skill: 'spatial', added: '2026-11-02', glyph: '🧱',
    name: { de: 'Fallende Blöcke', en: 'Falling Blocks' },
    desc: {
      de: 'Klassische Blöcke fallen von oben. Schiebe und drehe sie mit den Tasten, so dass ganze Reihen voll werden. Volle Reihen verschwinden. Räume 25 Reihen ab, bevor der Turm oben anstösst.',
      en: 'Classic blocks fall from the top. Move and turn them with the buttons so rows get completely filled. Full rows disappear. Clear 25 rows before the stack reaches the top.',
    },
    start(ctx) {
      const r = ctx.rng;
      const css = getComputedStyle(document.documentElement);
      const col = (n, d) => css.getPropertyValue(n).trim() || d;
      const INK = col('--ink', '#2B2522'), DOT = col('--dot', '#E2D6C2');
      const PAL = ['--c-memory', '--c-math', '--c-logic', '--c-spatial', '--c-focus', '--c-chem', '--c-fun'].map((n) => col(n, '#F8C3DD'));
      const speed = Math.max(180, 650 - ctx.level * 35);
      const grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(-1));
      let bag = [], cur = null, next = 0, lines = 0, over = false;

      ctx.el.innerHTML = '';
      const cell = Math.floor(Math.min(window.innerWidth - 32, 300) / COLS) || 26;
      const W = cell * COLS, H = cell * ROWS;
      const cv = F.h(`<canvas style="display:block;margin:6px auto;border:3px solid var(--ink);border-radius:12px;background:var(--card);touch-action:none;width:${W}px;height:${H}px;box-shadow:var(--shadow)"></canvas>`);
      const dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = H * dpr;
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const info = F.h('<div class="info-line" style="text-align:center;min-height:26px"></div>');
      const pad = F.h('<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;max-width:340px;margin:4px auto;touch-action:manipulation"></div>');
      const mk = (sym, label, fn) => {
        const b = F.h(`<button aria-label="${label}" style="min-height:56px;min-width:0;padding:0;font-size:24px;border:3px solid var(--ink);border-radius:14px;background:var(--card);color:var(--ink);box-shadow:var(--shadow);cursor:pointer">${sym}</button>`);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!over) fn(); });
        pad.appendChild(b);
      };
      ctx.el.appendChild(cv); ctx.el.appendChild(info); ctx.el.appendChild(pad);

      function draw() {
        g.clearRect(0, 0, W, H);
        g.fillStyle = DOT;
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((x + y) % 2 === 0) g.fillRect(x * cell, y * cell, cell, cell);
        const block = (x, y, c, ghost) => {
          g.globalAlpha = ghost ? 0.3 : 1;
          g.fillStyle = PAL[c]; g.strokeStyle = INK; g.lineWidth = 2;
          g.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
          g.strokeRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
          g.globalAlpha = 1;
        };
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] >= 0) block(x, y, grid[y][x]);
        if (cur) {
          let gy = cur.y;
          while (fits(cur.cells, cur.x, gy + 1)) gy++;
          cur.cells.forEach(([cx, cy]) => block(cur.x + cx, gy + cy, cur.t, true));
          cur.cells.forEach(([cx, cy]) => block(cur.x + cx, cur.y + cy, cur.t));
        }
      }
      function fits(cells, x, y) {
        return cells.every(([cx, cy]) => {
          const gx = x + cx, gy = y + cy;
          return gx >= 0 && gx < COLS && gy < ROWS && (gy < 0 || grid[gy][gx] < 0);
        });
      }
      function spawn() {
        const t = next;
        if (!bag.length) bag = r.shuffle([0, 1, 2, 3, 4, 5, 6]);
        next = bag.pop();
        cur = { t, cells: SHAPES[t].map((c) => c.slice()), x: Math.floor((COLS - SIZES[t]) / 2), y: 0 };
        info.textContent = F.tt({ de: 'Nächster: ', en: 'Next: ' }) + ['▬', '■', '⊤', 'S', 'Z', 'J', 'L'][next] + '   ' + F.tt({ de: 'Reihen: ', en: 'Rows: ' }) + lines + '/' + WIN;
        if (!fits(cur.cells, cur.x, cur.y)) end(false);
      }
      function move(dx) {
        if (cur && fits(cur.cells, cur.x + dx, cur.y)) { cur.x += dx; draw(); }
      }
      function rotate() {
        if (!cur || cur.t === 1) return;
        const n = SIZES[cur.t];
        const rc = cur.cells.map(([x, y]) => [n - 1 - y, x]);
        for (const k of [0, -1, 1, -2, 2]) {
          if (fits(rc, cur.x + k, cur.y)) { cur.cells = rc; cur.x += k; ctx.sfx('tap'); draw(); return; }
        }
      }
      function lock() {
        cur.cells.forEach(([cx, cy]) => { const y = cur.y + cy; if (y >= 0) grid[y][cur.x + cx] = cur.t; });
        let cleared = 0;
        for (let y = ROWS - 1; y >= 0; y--) {
          if (grid[y].every((v) => v >= 0)) { grid.splice(y, 1); grid.unshift(new Array(COLS).fill(-1)); cleared++; y++; }
        }
        if (cleared) { lines += cleared; ctx.setScore(lines); ctx.sfx(cleared > 1 ? 'win' : 'good'); }
        cur = null;
        if (lines >= WIN) { draw(); return end(true); }
        spawn(); draw();
      }
      function down() {
        if (!cur) return;
        if (fits(cur.cells, cur.x, cur.y + 1)) { cur.y++; draw(); } else lock();
      }
      function drop() {
        if (!cur) return;
        while (fits(cur.cells, cur.x, cur.y + 1)) cur.y++;
        lock();
      }
      mk('◀', 'left', () => move(-1));
      mk('⟳', 'rotate', rotate);
      mk('▶', 'right', () => move(1));
      mk('▼', 'down', down);
      mk('⤓', 'drop', drop);

      const iv = setInterval(() => { if (!over) down(); }, speed);
      ctx.onCleanup(() => clearInterval(iv));

      async function end(won) {
        if (over) return;
        over = true; clearInterval(iv);
        draw();
        info.textContent = F.tt(won ? { de: 'Geschafft!', en: 'Cleared!' } : { de: 'Der Turm ist voll!', en: 'The stack is full!' });
        ctx.sfx(won ? 'win' : 'bad');
        await ctx.wait(1100);
        ctx.finish({
          score: lines, detail: F.tt({ de: `${lines} Reihen`, en: `${lines} rows` }),
          levelDelta: lines >= 15 ? 1 : lines < 4 ? -1 : 0, quality: Math.min(1, lines / WIN), ink: 3 + lines,
        });
      }
      ctx.setScore(0);
      bag = r.shuffle([0, 1, 2, 3, 4, 5, 6]);
      next = bag.pop();
      spawn(); draw();
    },
  });
})();
