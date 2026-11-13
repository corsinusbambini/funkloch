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
    id: 'falling-blocks', skill: 'spatial', added: '2026-11-02', glyph: '🟦',
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
      const PALN = ['--c-memory', '--c-math', '--c-logic', '--c-spatial', '--c-focus', '--c-chem', '--c-fun'];
      const PAL = PALN.map((n) => col(n, '#F8C3DD'));
      const speed = Math.max(180, 650 - ctx.level * 35);
      const grid = Array.from({ length: ROWS }, () => new Array(COLS).fill(-1));
      let bag = [], cur = null, next = 0, lines = 0, over = false;

      ctx.el.innerHTML = '';
      const cell = Math.floor(Math.min(window.innerWidth - 32, 300) / COLS) || 26;
      const W = cell * COLS, H = cell * ROWS;
      const cv = F.h(`<canvas style="display:block;margin:4px auto 0;border:3px solid var(--ink);border-radius:255px 14px 225px 14px / 14px 225px 14px 255px;background:var(--card);touch-action:none;width:${W}px;height:${H}px;box-shadow:var(--shadow)"></canvas>`);
      const dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = H * dpr;
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      // status: drawn preview of the next piece and a rows track
      const status = F.h(`<div style="display:flex;align-items:center;gap:8px;max-width:${W}px;margin:8px auto 0;min-height:34px">
        <span style="font-size:18px;color:var(--ink-soft);white-space:nowrap">${F.tt({ de: 'Nächster', en: 'Next' })}</span>
        <span class="fb-next" style="display:inline-flex;width:56px;height:30px;align-items:center;justify-content:center"></span>
        <div style="flex:1;min-width:0;height:20px;border:2.5px solid var(--ink);border-radius:12px 16px 10px 14px;background:var(--card);overflow:hidden">
          <div class="fb-fill" style="height:100%;background:var(--c-focus);transform-origin:left;transform:scaleX(0);transition:transform .3s ease-out"></div></div>
        <span class="fb-num" style="font-size:22px;white-space:nowrap;display:inline-block">0/${WIN}</span>
      </div>`);
      const nextEl = status.querySelector('.fb-next'), fillEl = status.querySelector('.fb-fill'), numEl = status.querySelector('.fb-num');
      const info = {
        set textContent(v) { ctx.setInfo(F.esc(v)); },
        show() {
          const cells = SHAPES[next], k = 12;
          const w = Math.max(...cells.map((c) => c[0])) + 1, h = Math.max(...cells.map((c) => c[1])) + 1;
          nextEl.innerHTML = `<svg viewBox="-2 -2 ${w * k + 4} ${h * k + 4}" width="${w * k + 4}" height="${h * k + 4}" aria-hidden="true">${cells.map(([x, y]) => `<rect x="${x * k}" y="${y * k}" width="${k}" height="${k}" rx="2" style="fill:var(${PALN[next]});stroke:var(--ink);stroke-width:2"/>`).join('')}</svg>`;
          fillEl.style.transform = `scaleX(${Math.min(1, lines / WIN)})`;
          numEl.textContent = `${lines}/${WIN}`;
        },
      };
      const pad = F.h('<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;max-width:340px;margin:8px auto 0;touch-action:manipulation"></div>');
      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };
      const ICON = {
        left: '<path d="M26 8L12 20l14 12" />',
        right: '<path d="M14 8l14 12-14 12" />',
        rotate: '<path d="M29 15a10 10 0 1 0 1 9" /><path d="M31 7v9h-9" />',
        down: '<path d="M8 14l12 14 12-14" />',
        drop: '<path d="M10 8l10 11 10-11" /><path d="M10 18l10 11 10-11" /><path d="M8 34h24" />',
      };
      const mk = (sym, label, fn) => {
        const b = F.h(`<button class="btn" aria-label="${label}" style="min-height:60px;min-width:0;padding:0;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true" style="fill:none;stroke:var(--ink);stroke-width:4;stroke-linecap:round;stroke-linejoin:round">${ICON[label]}</svg></button>`);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!over) { pop(b); fn(); } });
        pad.appendChild(b);
      };
      ctx.el.appendChild(cv); ctx.el.appendChild(status); ctx.el.appendChild(pad);

      function draw() {
        g.clearRect(0, 0, W, H);
        g.fillStyle = DOT;
        for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if ((x + y) % 2 === 0) g.fillRect(x * cell, y * cell, cell, cell);
        const block = (x, y, c, ghost) => {
          g.globalAlpha = ghost ? 0.3 : 1;
          g.fillStyle = PAL[c]; g.strokeStyle = INK; g.lineWidth = 2;
          g.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
          if (!ghost) {
            // shine stroke in the corner and a soft shadow edge, inside the same cell
            g.globalAlpha = 0.6; g.strokeStyle = '#FFFFFF'; g.lineWidth = 2.5; g.lineCap = 'round';
            g.beginPath(); g.moveTo(x * cell + 6, y * cell + cell - 9); g.lineTo(x * cell + 6, y * cell + 6); g.lineTo(x * cell + cell - 9, y * cell + 6); g.stroke();
            g.globalAlpha = 0.18; g.fillStyle = INK;
            g.fillRect(x * cell + 3, y * cell + cell - 6, cell - 6, 3);
            g.globalAlpha = 1; g.strokeStyle = INK; g.lineWidth = 2;
          }
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
        info.show();
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
        if (cleared) {
          lines += cleared; ctx.setScore(lines); ctx.sfx(cleared > 1 ? 'win' : 'good');
          info.show(); pop(numEl);
          if (lines < WIN && cleared > 1) F.cheer(8);
        }
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
