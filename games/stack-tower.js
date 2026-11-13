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
      const INK = col('--ink', '#2B2522'), CARD = col('--card', '#FFFDF8'), DOT = col('--dot', '#E2D6C2'), FAINT = col('--ink-faint', '#CFC3B1');
      const SPATIAL = col('--c-spatial', '#B9E6C9');
      const FONT = getComputedStyle(document.body).fontFamily || 'sans-serif';
      const PAL = ['--c-memory', '--c-math', '--c-spatial', '--c-focus', '--c-logic', '--c-fun', '--c-chem'].map((n) => col(n, '#F8C3DD'));
      const W = Math.min(340, window.innerWidth - 32) || 320, H = Math.round(W * 1.3);
      const BH = 24, WIN = 40, baseY = H - 20;
      const startPal = r.int ? r.int(0, PAL.length - 1) : Math.floor(r() * PAL.length);
      // tower: list of {x, w}; the base slab is wide, first moving block is narrower
      const tower = [{ x: (W - W * 0.62) / 2, w: W * 0.62 }];
      let cur = { w: tower[0].w }, t = r() * 4, speed = 120 + Math.min(10, ctx.level) * 10, dir = r() < 0.5 ? 1 : -1;
      let over = false, cam = 0, perfects = 0, drops = [], msg = '', msgT = 0;

      ctx.el.innerHTML = '';
      const cv = F.h(`<canvas style="display:block;margin:4px auto 0;border:3px solid var(--ink);border-radius:255px 14px 225px 14px / 14px 225px 14px 255px;background:var(--card);touch-action:none;width:${W}px;height:${H}px;box-shadow:var(--shadow)"></canvas>`);
      const dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = H * dpr;
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.textAlign = 'center';
      // status: floors as a progress track, perfect drops as stars
      const status = F.h(`<div style="display:flex;align-items:center;gap:10px;max-width:${W}px;margin:12px auto 0">
        <div style="flex:1;min-width:0;height:22px;border:2.5px solid var(--ink);border-radius:12px 16px 10px 14px;background:var(--card);overflow:hidden">
          <div class="st-fill" style="height:100%;background:var(--c-spatial);transform-origin:left;transform:scaleX(0);transition:transform .3s ease-out"></div></div>
        <span class="st-num" style="font-size:22px;white-space:nowrap;display:inline-block">0 / ${WIN}</span>
        <span style="font-size:20px;white-space:nowrap;display:inline-flex;align-items:center;gap:3px"><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" style="fill:var(--c-math);stroke:var(--ink);stroke-width:1.8;stroke-linejoin:round"><path d="M12 2.5l2.8 6.1 6.6.7-4.9 4.5 1.4 6.6L12 17.1l-5.9 3.3 1.4-6.6-4.9-4.5 6.6-.7z"/></svg><span class="st-perf">0</span></span>
      </div>`);
      const fill = status.querySelector('.st-fill'), num = status.querySelector('.st-num'), perfEl = status.querySelector('.st-perf');
      const info = F.h('<div class="info-line" style="text-align:center;min-height:26px;margin-top:6px"></div>');
      const btn = F.h(`<button class="btn primary big" style="margin-top:6px;min-height:76px;touch-action:manipulation"></button>`);
      btn.textContent = F.tt({ de: 'Fallen lassen!', en: 'Drop it!' });
      ctx.el.append(cv, status, info, btn);
      info.textContent = F.tt({ de: 'Tippe, um den Block fallen zu lassen', en: 'Tap to drop the block' });
      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };

      const floors = () => tower.length - 1;
      const curX = () => {
        const span = Math.max(1, W - cur.w);
        const p = (t * speed / span) % 2;
        return (p <= 1 ? p : 2 - p) * span;
      };
      const rowY = (i) => baseY - (i + 1) * BH + cam;

      function block(x, y, w, i) {
        g.fillStyle = PAL[(startPal + i) % PAL.length]; g.strokeStyle = INK; g.lineWidth = 2.5;
        g.fillRect(x, y, w, BH - 2);
        // little windows and a shine stroke, drawn inside the same box
        g.fillStyle = INK; g.globalAlpha = 0.18;
        for (let wx = x + 8; wx + 8 < x + w - 4; wx += 18) g.fillRect(wx, y + 8, 8, 8);
        g.globalAlpha = 0.55; g.strokeStyle = '#FFFFFF'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(x + 5, y + 4); g.lineTo(x + Math.max(6, w * 0.45), y + 4); g.stroke();
        g.globalAlpha = 1; g.strokeStyle = INK; g.lineWidth = 2.5;
        g.strokeRect(x, y, w, BH - 2);
      }
      function cloud(x, y, s) {
        g.beginPath();
        g.arc(x, y, 12 * s, Math.PI * 0.5, Math.PI * 1.5);
        g.arc(x + 14 * s, y - 9 * s, 13 * s, Math.PI, Math.PI * 2);
        g.arc(x + 30 * s, y - 2 * s, 11 * s, Math.PI * 1.3, Math.PI * 0.5);
        g.closePath(); g.fill(); g.stroke();
      }
      function draw() {
        g.clearRect(0, 0, W, H);
        // sky doodles: fixed clouds that drift down as the tower grows
        g.fillStyle = DOT; g.strokeStyle = FAINT; g.lineWidth = 2;
        [[0.12, 80, 1], [0.6, 150, 0.8], [0.25, 250, 0.7], [0.7, 320, 1]].forEach(([fx, fy, s]) => {
          const y = ((fy + cam * 0.4) % (H + 60)) - 20;
          cloud(fx * W, y, s);
        });
        // ground with pencil hatching
        g.fillStyle = SPATIAL; g.fillRect(0, baseY, W, H - baseY);
        g.strokeStyle = INK; g.lineWidth = 1.2; g.globalAlpha = 0.35;
        for (let hx = -10; hx < W; hx += 9) { g.beginPath(); g.moveTo(hx, H); g.lineTo(hx + 12, baseY + 3); g.stroke(); }
        g.globalAlpha = 1;
        g.fillStyle = INK; g.fillRect(0, baseY, W, 3);
        tower.forEach((b, i) => block(b.x, rowY(i), b.w, i));
        drops.forEach((d) => block(d.x, d.y, d.w, d.i));
        if (!over) block(curX(), rowY(tower.length), cur.w, tower.length);
        g.fillStyle = INK; g.font = `bold 38px ${FONT}`; g.fillText(String(floors()), W / 2, 42);
        if (msgT > 0) { g.font = `bold 26px ${FONT}`; g.fillText(msg, W / 2, 72); }
      }

      function showStatus(perfect) {
        const n = floors();
        fill.style.transform = `scaleX(${Math.min(1, n / WIN)})`;
        num.textContent = `${n} / ${WIN}`;
        perfEl.textContent = String(perfects);
        pop(perfect ? perfEl.parentNode : num);
      }

      function drop() {
        if (over) return;
        info.textContent = '';
        const prev = tower[tower.length - 1], x = curX();
        const lo = Math.max(x, prev.x), hi = Math.min(x + cur.w, prev.x + prev.w);
        const ov = hi - lo;
        if (ov < 2) {
          drops.push({ x, y: rowY(tower.length), w: cur.w, i: tower.length, vy: 0 });
          return end(false);
        }
        let nx = lo, nw = ov, perfect = false;
        if (Math.abs(x - prev.x) < 4) { nx = prev.x; nw = prev.w; perfects++; perfect = true; msg = F.tt({ de: 'Perfekt!', en: 'Perfect!' }); msgT = 0.8; ctx.sfx('win'); }
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
        showStatus(perfect);
        if (floors() >= WIN) return end(true);
        if (perfect) F.cheer(8);
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
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); pop(btn); drop(); });

      async function end(won) {
        if (over) return;
        over = true;
        btn.disabled = true;
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
