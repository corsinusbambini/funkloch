/* Frogger: hop across busy lanes without getting hit. Reach the top 5 times. */
(function () {
  const F = Funkloch;
  const COLS = 9, ROWS = 9, GOAL = 5;
  // row 0 = goal, 4 = median (safe), 8 = start; the rest are traffic lanes
  const LANES = [1, 2, 3, 5, 6, 7];

  F.registerGame({
    id: 'frogger', skill: 'focus', added: '2026-11-05', glyph: '🐸',
    name: { de: 'Frosch über die Strasse', en: 'Frogger' },
    desc: {
      de: 'Hilf dem Frosch über die Strasse. Tippe die Pfeile oder wische, um zu hüpfen. Weiche den Autos aus. Schaffst du es 5 Mal nach oben, gewinnst du. Du hast 3 Leben.',
      en: 'Help the frog across the road. Tap the arrows or swipe to hop. Dodge the cars. Reach the top 5 times to win. You have 3 lives.',
    },
    start(ctx) {
      const r = ctx.rng;
      const css = getComputedStyle(document.documentElement);
      const col = (n, d) => css.getPropertyValue(n).trim() || d;
      const INK = col('--ink', '#2B2522'), CARD = col('--card', '#FFFDF8'), DOT = col('--dot', '#E2D6C2');
      const GOODC = col('--good', '#5FAF7A');
      const PAL = ['--c-memory', '--c-math', '--c-spatial', '--c-focus', '--c-logic', '--c-fun', '--c-chem'].map((n) => col(n, '#F8C3DD'));
      const lvl = Math.max(0, Math.min(10, ctx.level || 0));
      const baseSpeed = 1.0 + lvl * 0.1;

      // generate lanes: direction, speed (cells/s), car length, spacing, phase, colour
      const lanes = {};
      LANES.forEach((row, i) => {
        const len = r() < 0.3 ? 2 : 1;
        const gap = 3 + r.int(0, 2) - (lvl >= 6 ? 1 : 0);        // empty cells between cars (>= 2)
        const count = Math.max(2, Math.ceil((COLS + 2) / (len + gap)));
        const period = count * (len + gap);
        lanes[row] = {
          dir: (i + (r() < 0.5 ? 0 : 1)) % 2 ? 1 : -1, speed: baseSpeed * (0.7 + r() * 0.8), len, period,
          phase: r() * period, color: PAL[r.int(0, PAL.length - 1)], count,
        };
      });

      let frog = { c: 4, r: ROWS - 1 }, lives = 3, crossings = 0, over = false, t = 0, boost = 1, flash = 0;
      ctx.el.innerHTML = '';
      const size = Math.min(340, Math.floor(Math.min(window.innerWidth - 32, 340) / COLS) * COLS) || 306;
      const cell = size / COLS;
      const cv = F.h(`<canvas style="display:block;margin:8px auto;border:3px solid var(--ink);border-radius:12px;background:var(--card);touch-action:none;width:${size}px;height:${cell * ROWS}px;box-shadow:var(--shadow)"></canvas>`);
      const dpr = window.devicePixelRatio || 1;
      cv.width = size * dpr; cv.height = cell * ROWS * dpr;
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const info = F.h('<div class="info-line" style="text-align:center;min-height:26px"></div>');
      const pad = F.h('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-width:240px;margin:6px auto;touch-action:manipulation"></div>');
      pad.style.gridTemplateAreas = '". u ." "l d r"';
      const mk = (d, sym, area) => {
        const b = F.h(`<button aria-label="${d}" style="grid-area:${area};min-height:56px;min-width:0;padding:0;font-size:26px;border:3px solid var(--ink);border-radius:14px;background:var(--card);color:var(--ink);box-shadow:var(--shadow);cursor:pointer">${sym}</button>`);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); hop(d); });
        pad.appendChild(b);
      };
      mk('up', '▲', 'u'); mk('left', '◀', 'l'); mk('down', '▼', 'd'); mk('right', '▶', 'r');
      ctx.el.appendChild(cv); ctx.el.appendChild(info); ctx.el.appendChild(pad);

      const status = () => {
        info.textContent = F.tt({ de: `Geschafft: ${crossings}/${GOAL}   Leben: ${'❤️'.repeat(lives)}`, en: `Crossed: ${crossings}/${GOAL}   Lives: ${'❤️'.repeat(lives)}` });
      };

      const carsOf = (row) => {
        const L = lanes[row], out = [];
        for (let k = 0; k < L.count; k++) {
          let p = (L.phase + k * (L.len + (L.period / L.count - L.len)) + L.dir * L.speed * boost * t) % L.period;
          if (p < 0) p += L.period;
          out.push(p - L.len - 1); // slides across [-len-1, period-len-1)
        }
        return out;
      };
      const hit = () => {
        const L = lanes[frog.r];
        if (!L) return false;
        return carsOf(frog.r).some((x) => x + L.len - 0.15 > frog.c + 0.15 && x + 0.15 < frog.c + 0.85);
      };

      function hop(d) {
        if (over) return;
        const nf = { c: frog.c, r: frog.r };
        if (d === 'up') nf.r--; else if (d === 'down') nf.r++; else if (d === 'left') nf.c--; else nf.c++;
        if (nf.c < 0 || nf.c >= COLS || nf.r >= ROWS) return;
        frog = nf;
        if (frog.r === 0) return arrive();
        if (hit()) return crash();
      }
      let sx = 0, sy = 0, sid = null;
      cv.addEventListener('pointerdown', (e) => { e.preventDefault(); sx = e.clientX; sy = e.clientY; sid = e.pointerId; });
      cv.addEventListener('pointermove', (e) => {
        if (e.pointerId !== sid) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
        hop(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        sx = e.clientX; sy = e.clientY;
      });
      const up = (e) => { if (e.pointerId === sid) sid = null; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

      function arrive() {
        crossings++; ctx.setScore(crossings); ctx.sfx('good'); status();
        frog = { c: 4, r: ROWS - 1 };
        boost += 0.07;
        if (crossings >= GOAL) end(true);
      }
      function crash() {
        lives--; ctx.sfx('bad'); flash = 0.4;
        frog = { c: 4, r: ROWS - 1 };
        status();
        if (lives <= 0) end(false);
      }

      function draw() {
        g.clearRect(0, 0, size, cell * ROWS);
        for (let row = 0; row < ROWS; row++) {
          const y = row * cell;
          if (lanes[row]) { g.fillStyle = DOT; g.fillRect(0, y, size, cell); g.fillStyle = CARD; for (let i = 0; i < COLS; i += 2) g.fillRect(i * cell + cell * 0.35, y + cell * 0.46, cell * 0.3, 3); }
          else if (row === 0) { g.fillStyle = GOODC; g.globalAlpha = 0.35; g.fillRect(0, y, size, cell); g.globalAlpha = 1; }
        }
        g.strokeStyle = INK; g.lineWidth = 2.5;
        LANES.forEach((row) => {
          const L = lanes[row];
          carsOf(row).forEach((x) => {
            g.fillStyle = L.color;
            const px = x * cell + 2, py = row * cell + 4, w = L.len * cell - 4, h = cell - 8;
            g.beginPath(); g.roundRect ? g.roundRect(px, py, w, h, 7) : g.rect(px, py, w, h); g.fill(); g.stroke();
            g.fillStyle = INK; const hx = L.dir > 0 ? px + w - 7 : px + 7;
            g.beginPath(); g.arc(hx, py + 7, 2.5, 0, 7); g.arc(hx, py + h - 7, 2.5, 0, 7); g.fill();
          });
        });
        const fx = (frog.c + 0.5) * cell, fy = (frog.r + 0.5) * cell;
        g.fillStyle = flash > 0 ? col('--bad', '#E06A6A') : GOODC; g.strokeStyle = INK; g.lineWidth = 2.5;
        g.beginPath(); g.ellipse(fx, fy + 1, cell * 0.36, cell * 0.32, 0, 0, 7); g.fill(); g.stroke();
        g.fillStyle = CARD;
        [-1, 1].forEach((k) => { g.beginPath(); g.arc(fx + k * cell * 0.17, fy - cell * 0.2, cell * 0.12, 0, 7); g.fill(); g.stroke(); });
        g.fillStyle = INK;
        [-1, 1].forEach((k) => { g.beginPath(); g.arc(fx + k * cell * 0.17, fy - cell * 0.2, cell * 0.05, 0, 7); g.fill(); });
      }

      let last = performance.now();
      const iv = setInterval(() => {
        if (over) return;
        const now = performance.now(), dt = Math.min(0.08, (now - last) / 1000); last = now;
        t += dt; if (flash > 0) flash -= dt;
        if (hit()) crash();
        draw();
      }, 33);
      ctx.onCleanup(() => clearInterval(iv));
      ctx.setScore(0); status(); draw();

      async function end(won) {
        over = true; clearInterval(iv); draw();
        ctx.sfx(won ? 'win' : 'bad');
        info.textContent = F.tt(won ? { de: 'Geschafft, quak!', en: 'Made it, ribbit!' } : { de: 'Platt gefahren!', en: 'Splat!' });
        await ctx.wait(1100);
        ctx.finish({
          score: crossings, detail: F.tt({ de: `${crossings} von ${GOAL} Überquerungen, ${lives} Leben übrig`, en: `${crossings} of ${GOAL} crossings, ${lives} lives left` }),
          levelDelta: won ? (lives >= 2 ? 1 : 0) : -1, quality: Math.min(1, (crossings + lives * 0.2) / GOAL), ink: 3 + crossings * 3,
        });
      }
    },
  });
})();
