/* Breakout: drag the paddle, bounce the ball, smash all bricks. */
(function () {
  const F = Funkloch;
  const COLS = 8;

  F.registerGame({
    id: 'breakout', skill: 'focus', added: '2026-10-30', glyph: '🧱',
    name: { de: 'Ausbruch', en: 'Breakout' },
    desc: {
      de: 'Ziehe den Schläger mit dem Finger hin und her und lass den Ball die Steine zerschlagen. Räume alle Steine ab, bevor du den Ball dreimal verlierst. Tippe zum Starten.',
      en: 'Drag the paddle left and right and let the ball smash the bricks. Clear all bricks before you lose the ball three times. Tap to launch.',
    },
    start(ctx) {
      const r = ctx.rng;
      const css = getComputedStyle(document.documentElement);
      const col = (n, d) => css.getPropertyValue(n).trim() || d;
      const INK = col('--ink', '#2B2522'), CARD = col('--card', '#FFFDF8'), DOT = col('--dot', '#E2D6C2');
      const ROWCOL = ['--c-memory', '--c-math', '--c-spatial', '--c-focus', '--c-logic', '--c-fun'].map((n) => col(n, '#F8C3DD'));
      const ROWS = Math.min(6, 3 + Math.floor(ctx.level / 3));
      const W = Math.min(340, Math.floor(Math.min(window.innerWidth - 32, 340))) || 320, H = Math.round(W * 1.25);
      const bw = W / COLS, bh = 20, top = 36;
      // generated brick wall: mirrored random holes, always at least a few bricks
      const bricks = [];
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS / 2; x++) {
          if (r.chance(0.22 + (y === 0 ? 0 : 0))) continue;
          bricks.push({ x, y, alive: true }); bricks.push({ x: COLS - 1 - x, y, alive: true });
        }
      }
      if (bricks.length < 8) for (let x = 0; x < COLS; x++) bricks.push({ x, y: 0, alive: true });
      const total = bricks.length;
      let left = total, lives = 3, hits = 0;

      ctx.el.innerHTML = '';
      const cv = F.h(`<canvas style="display:block;margin:8px auto;border:3px solid var(--ink);border-radius:12px;background:var(--card);touch-action:none;width:${W}px;height:${H}px;box-shadow:var(--shadow)"></canvas>`);
      const dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = H * dpr;
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const info = F.h('<div class="info-line" style="text-align:center;min-height:26px"></div>');
      ctx.el.appendChild(cv); ctx.el.appendChild(info);

      const PW = W * 0.24, PH = 12, PY = H - 26, R = 7;
      let px = W / 2, bx = px, by = PY - R, vx = 0, vy = 0, launched = false, over = false, pause = 0;
      const base = Math.min(W * 1.15, 250 + ctx.level * 10);
      const hud = () => { ctx.setScore(total - left); info.textContent = '❤'.repeat(lives) + (launched ? '' : '  ' + F.tt({ de: 'Tippe zum Starten', en: 'Tap to launch' })); };

      const move = (e) => {
        const rc = cv.getBoundingClientRect();
        px = Math.max(PW / 2, Math.min(W - PW / 2, (e.clientX - rc.left) * (W / rc.width)));
      };
      let sid = null;
      cv.addEventListener('pointerdown', (e) => {
        e.preventDefault(); sid = e.pointerId; move(e);
        if (!launched && !over) {
          launched = true;
          const a = (r() - 0.5) * 0.8;
          vx = Math.sin(a) * base; vy = -Math.cos(a) * base;
          hud();
        }
      });
      cv.addEventListener('pointermove', (e) => { if (e.pointerId === sid) move(e); });
      const up = (e) => { if (e.pointerId === sid) sid = null; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

      function draw() {
        g.clearRect(0, 0, W, H);
        bricks.forEach((b) => {
          if (!b.alive) return;
          g.fillStyle = ROWCOL[b.y % ROWCOL.length]; g.strokeStyle = INK; g.lineWidth = 2;
          g.fillRect(b.x * bw + 1.5, top + b.y * bh + 1.5, bw - 3, bh - 3);
          g.strokeRect(b.x * bw + 1.5, top + b.y * bh + 1.5, bw - 3, bh - 3);
        });
        g.fillStyle = DOT; g.strokeStyle = INK; g.lineWidth = 3;
        g.beginPath(); g.roundRect ? g.roundRect(px - PW / 2, PY, PW, PH, 6) : g.rect(px - PW / 2, PY, PW, PH); g.fill(); g.stroke();
        g.fillStyle = '#FFD66B';
        g.beginPath(); g.arc(launched ? bx : px, launched ? by : PY - R, R, 0, 7); g.fill(); g.stroke();
      }

      function lose() {
        lives--; launched = false; vx = vy = 0; pause = 500; ctx.sfx('bad');
        if (lives <= 0) return end(false);
        hud();
      }
      function step(dt) {
        if (!launched) { bx = px; by = PY - R; return; }
        // small sub-steps so a fast ball never tunnels through a brick
        const n = Math.ceil(Math.hypot(vx, vy) * dt / 4);
        for (let i = 0; i < n && launched && !over; i++) {
          bx += vx * dt / n; by += vy * dt / n;
          if (bx < R) { bx = R; vx = Math.abs(vx); }
          if (bx > W - R) { bx = W - R; vx = -Math.abs(vx); }
          if (by < R) { by = R; vy = Math.abs(vy); }
          if (vy > 0 && by + R >= PY && by + R <= PY + PH + 8 && Math.abs(bx - px) <= PW / 2 + R) {
            const off = Math.max(-1, Math.min(1, (bx - px) / (PW / 2)));
            const sp = Math.min(Math.hypot(vx, vy) * 1.02, base * 1.5), a = off * 1.0;
            vx = Math.sin(a) * sp; vy = -Math.cos(a) * sp; by = PY - R; ctx.sfx('tap');
          }
          if (by > H + R) return lose();
          for (const b of bricks) {
            if (!b.alive) continue;
            const x0 = b.x * bw, y0 = top + b.y * bh;
            if (bx + R > x0 && bx - R < x0 + bw && by + R > y0 && by - R < y0 + bh) {
              b.alive = false; left--; hits++; ctx.sfx('good'); ctx.setScore(total - left);
              const ox = Math.min(bx + R - x0, x0 + bw - (bx - R)), oy = Math.min(by + R - y0, y0 + bh - (by - R));
              if (ox < oy) vx = -vx; else vy = -vy;
              if (left === 0) return end(true);
              break;
            }
          }
        }
      }
      async function end(won) {
        if (over) return;
        over = true; launched = false; draw();
        info.textContent = F.tt(won ? { de: 'Alles abgeräumt!', en: 'All cleared!' } : { de: 'Ball verloren!', en: 'Out of balls!' });
        ctx.sfx(won ? 'win' : 'bad');
        await ctx.wait(1000);
        const cleared = total - left;
        ctx.finish({
          score: cleared + (won ? lives * 5 : 0), detail: F.tt({ de: `${cleared}/${total} Steine`, en: `${cleared}/${total} bricks` }),
          levelDelta: won ? (lives >= 2 ? 1 : 0) : (cleared < total / 2 ? -1 : 0),
          quality: cleared / total, ink: 3 + Math.round(cleared / 2),
        });
      }
      let raf = 0, last = performance.now();
      function frame(now) {
        if (ctx.dead || over) return;
        const dt = Math.min(0.033, (now - last) / 1000); last = now;
        if (pause > 0) pause -= dt * 1000; else step(dt);
        if (!over) { draw(); raf = requestAnimationFrame(frame); }
      }
      ctx.onCleanup(() => cancelAnimationFrame(raf));
      hud(); draw();
      raf = requestAnimationFrame(frame);
    },
  });
})();
