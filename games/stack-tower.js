/* Stack Tower: tap to drop the sliding block; only the part that lands on the tower stays. */
(function () {
  const F = Funkloch;

  F.registerGame({
    id: 'stack-tower', skill: 'fun', added: '2026-10-31', glyph: '🏗️',
    name: { de: 'Turmbau', en: 'Stack Tower' },
    desc: {
      de: 'Ein Block gleitet hin und her. Tippe, um ihn fallen zu lassen. Nur der Teil, der auf dem Turm landet, bleibt liegen. Triffst du genau, bleibt der Block gleich breit. Baue den Turm so hoch du kannst (40 Stockwerke gewinnen).',
      en: 'A block slides back and forth. Tap to drop it. Only the part that lands on the tower stays. Land it exactly and the block keeps its width. Build the tower as high as you can (40 floors win).',
    },
    start(ctx) {
      const r = ctx.rng;
      const css = getComputedStyle(document.documentElement);
      const col = (n, d) => css.getPropertyValue(n).trim() || d;
      const INK = col('--ink', '#2B2522'), CARD = col('--card', '#FFFDF8');
      const PAL = ['--c-memory', '--c-math', '--c-spatial', '--c-focus', '--c-logic', '--c-fun', '--c-chem'].map((n) => col(n, '#F8C3DD'));
      const W = Math.min(340, window.innerWidth - 32) || 320, H = Math.round(W * 1.3);
      const BH = 24, WIN = 40, baseY = H - 20;
      const startPal = r.int ? r.int(0, PAL.length - 1) : Math.floor(r() * PAL.length);
      // tower: list of {x, w}; the base slab is wide, first moving block is narrower
      const tower = [{ x: (W - W * 0.62) / 2, w: W * 0.62 }];
      let cur = { w: tower[0].w }, t = r() * 4, speed = 120 + Math.min(10, ctx.level) * 10, dir = r() < 0.5 ? 1 : -1;
      let over = false, cam = 0, perfects = 0, drops = [], msg = '', msgT = 0;

      ctx.el.innerHTML = '';
      const cv = F.h(`<canvas style="display:block;margin:8px auto;border:3px solid var(--ink);border-radius:12px;background:var(--card);touch-action:none;width:${W}px;height:${H}px;box-shadow:var(--shadow)"></canvas>`);
      const dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = H * dpr;
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.font = 'bold 20px sans-serif'; g.textAlign = 'center';
      const info = F.h('<div class="info-line" style="text-align:center;min-height:26px"></div>');
      ctx.el.appendChild(cv); ctx.el.appendChild(info);
      info.textContent = F.tt({ de: 'Tippe, um den Block fallen zu lassen', en: 'Tap to drop the block' });

      const floors = () => tower.length - 1;
      const curX = () => {
        const span = Math.max(1, W - cur.w);
        const p = (t * speed / span) % 2;
        return (p <= 1 ? p : 2 - p) * span;
      };
      const rowY = (i) => baseY - (i + 1) * BH + cam;

      function block(x, y, w, i) {
        g.fillStyle = PAL[(startPal + i) % PAL.length]; g.strokeStyle = INK; g.lineWidth = 2.5;
        g.fillRect(x, y, w, BH - 2); g.strokeRect(x, y, w, BH - 2);
      }
      function draw() {
        g.clearRect(0, 0, W, H);
        g.fillStyle = INK; g.fillRect(0, baseY, W, 3);
        tower.forEach((b, i) => block(b.x, rowY(i), b.w, i));
        drops.forEach((d) => block(d.x, d.y, d.w, d.i));
        if (!over) block(curX(), rowY(tower.length), cur.w, tower.length);
        g.fillStyle = INK; g.fillText(String(floors()), W / 2, 28);
        if (msgT > 0) { g.fillText(msg, W / 2, 54); }
      }

      function drop() {
        if (over) return;
        const prev = tower[tower.length - 1], x = curX();
        const lo = Math.max(x, prev.x), hi = Math.min(x + cur.w, prev.x + prev.w);
        const ov = hi - lo;
        if (ov < 2) {
          drops.push({ x, y: rowY(tower.length), w: cur.w, i: tower.length, vy: 0 });
          return end(false);
        }
        let nx = lo, nw = ov;
        if (Math.abs(x - prev.x) < 4) { nx = prev.x; nw = prev.w; perfects++; msg = F.tt({ de: 'Perfekt!', en: 'Perfect!' }); msgT = 0.8; ctx.sfx('win'); }
        else {
          ctx.sfx('good');
          // the cut-off piece falls away
          if (x < lo) drops.push({ x, y: rowY(tower.length), w: lo - x, i: tower.length, vy: 0 });
          if (x + cur.w > hi) drops.push({ x: hi, y: rowY(tower.length), w: x + cur.w - hi, i: tower.length, vy: 0 });
        }
        tower.push({ x: nx, w: nw });
        cur = { w: nw };
        t = r() * 4; dir = -dir;
        speed = Math.min(300, speed + 5);
        ctx.setScore(floors());
        if (floors() >= WIN) return end(true);
        // scroll so the top stays visible
        const topY = baseY - (tower.length + 1) * BH;
        if (topY + cam < H * 0.35) cam += BH;
      }

      let last = performance.now(), raf = 0, camGoal = 0;
      function frame(now) {
        const dt = Math.min(0.05, (now - last) / 1000); last = now;
        if (!over) t += dt;
        if (msgT > 0) msgT -= dt;
        drops.forEach((d) => { d.vy += 900 * dt; d.y += d.vy * dt; });
        drops = drops.filter((d) => d.y < H + 40);
        draw();
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      ctx.onCleanup(() => cancelAnimationFrame(raf));
      cv.addEventListener('pointerdown', (e) => { e.preventDefault(); drop(); });

      async function end(won) {
        if (over) return;
        over = true;
        info.textContent = F.tt(won ? { de: 'Wolkenkratzer!', en: 'Skyscraper!' } : { de: 'Verfehlt!', en: 'Missed!' });
        ctx.sfx(won ? 'win' : 'bad');
        await ctx.wait(1200);
        const n = floors();
        ctx.finish({
          score: n, detail: F.tt({ de: `${n} Stockwerke, ${perfects}× perfekt`, en: `${n} floors, ${perfects}× perfect` }),
          levelDelta: n >= 20 ? 1 : n < 6 ? -1 : 0, quality: Math.min(1, n / 30), ink: 3 + Math.min(20, n),
        });
      }
    },
  });
})();
