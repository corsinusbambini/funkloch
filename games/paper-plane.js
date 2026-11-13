/* Paper Plane: tap to lift the plane, let it sink, and glide through the gaps between the clouds. */
(function () {
  const F = Funkloch;
  const WIN = 40;

  F.registerGame({
    id: 'paper-plane', skill: 'fun', added: '2026-11-02', glyph: '✈️',
    name: { de: 'Papierflieger', en: 'Paper Plane' },
    desc: {
      de: 'Dein Papierflieger sinkt langsam. Tippe, damit er einen Satz nach oben macht. Fliege durch die Lücken zwischen den Wolkensäulen. Berührst du eine Säule, Boden oder Decke, ist der Flug vorbei. 40 Lücken gewinnen.',
      en: 'Your paper plane sinks slowly. Tap to make it hop upwards. Fly through the gaps between the cloud pillars. Touching a pillar, the ground or the ceiling ends the flight. 40 gaps win.',
    },
    start(ctx) {
      const r = ctx.rng;
      const css = getComputedStyle(document.documentElement);
      const col = (n, d) => css.getPropertyValue(n).trim() || d;
      const INK = col('--ink', '#2B2522'), DOT = col('--dot', '#E2D6C2'), CARD = col('--card', '#FFFDF8');
      const PILLAR = col('--c-focus', '#B5D8F5'), PLANE = col('--c-fun', '#F8C3DD'), GRASS = col('--c-spatial', '#B9E6C9');
      const FONT = getComputedStyle(document.body).fontFamily || 'sans-serif';
      const W = Math.min(340, window.innerWidth - 32) || 320, H = Math.round(W * 1.35);
      const gap = Math.max(W * 0.38, W * 0.5 - ctx.level * 4), PW = 46, SPACING = W * 0.62;
      const speed = 110 + Math.min(10, ctx.level) * 5;
      const px = W * 0.28;
      let py = H / 2, vy = 0, over = false, started = false, score = 0, scroll = 0, ang = 0;
      const pillars = [];
      const addPillar = () => {
        const last = pillars.length ? pillars[pillars.length - 1].x : W * 0.9 - SPACING;
        const prevC = pillars.length ? pillars[pillars.length - 1].c : H / 2;
        const lo = gap / 2 + 24, hi = H - gap / 2 - 24;
        // keep the next gap reachable: at most ~40% of the screen away from the previous one
        const c = Math.max(lo, Math.min(hi, prevC + (r() * 2 - 1) * H * 0.4));
        pillars.push({ x: last + SPACING, c, passed: false });
      };
      for (let i = 0; i < 5; i++) addPillar();

      ctx.el.innerHTML = '';
      const cv = F.h(`<canvas style="display:block;margin:4px auto 0;border:3px solid var(--ink);border-radius:255px 14px 225px 14px / 14px 225px 14px 255px;background:var(--card);touch-action:none;width:${W}px;height:${H}px;box-shadow:var(--shadow)"></canvas>`);
      const dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = H * dpr;
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.font = `bold 34px ${FONT}`; g.textAlign = 'center';
      // hint goes into the free info line above the board
      const info = { set textContent(v) { ctx.setInfo(F.esc(v)); } };
      info.textContent = F.tt({ de: 'Tippe, um zu starten und zu hüpfen', en: 'Tap to start and hop' });
      // status: gaps flown as a progress track
      const status = F.h(`<div style="display:flex;align-items:center;gap:10px;max-width:${W}px;margin:12px auto 0">
        <svg viewBox="0 0 40 24" width="40" height="24" aria-hidden="true" style="flex:none;transform:rotate(-8deg)"><path d="M37 12L3 3l7 9-7 9z" style="fill:var(--c-fun);stroke:var(--ink);stroke-width:2.2;stroke-linejoin:round"/><path d="M37 12H10" style="fill:none;stroke:var(--ink);stroke-width:1.8"/></svg>
        <div style="flex:1;min-width:0;height:22px;border:2.5px solid var(--ink);border-radius:12px 16px 10px 14px;background:var(--card);overflow:hidden">
          <div class="pp-fill" style="height:100%;background:var(--c-focus);transform-origin:left;transform:scaleX(0);transition:transform .3s ease-out"></div></div>
        <span class="pp-num" style="font-size:22px;white-space:nowrap;display:inline-block">0 / ${WIN}</span>
      </div>`);
      const fillEl = status.querySelector('.pp-fill'), numEl = status.querySelector('.pp-num');
      const btn = F.h(`<button class="btn primary big" style="margin-top:12px;min-height:76px;touch-action:manipulation"></button>`);
      btn.textContent = F.tt({ de: 'Hoch!', en: 'Up!' });
      ctx.el.append(cv, status, btn);
      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };

      function draw() {
        g.clearRect(0, 0, W, H);
        g.fillStyle = DOT;
        for (let i = 0; i < 6; i++) {
          const cx = ((i * 97 - scroll * 0.3) % (W + 80) + W + 80) % (W + 80) - 40;
          g.beginPath(); g.ellipse(cx, 50 + (i * 71) % (H - 120), 30, 12, 0, 0, 7); g.fill();
        }
        g.fillStyle = PILLAR; g.strokeStyle = INK; g.lineWidth = 3; g.lineJoin = 'round';
        const rr = PW / 6; // puffy cloud edge, bulges less than the 9px hit margin
        pillars.forEach((p) => {
          const top = p.c - gap / 2, bot = p.c + gap / 2;
          g.beginPath(); g.moveTo(p.x, -4); g.lineTo(p.x, top);
          for (let k = 0; k < 3; k++) g.arc(p.x + rr * (2 * k + 1), top, rr, Math.PI, 0, true);
          g.lineTo(p.x + PW, -4); g.closePath(); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(p.x, H + 4); g.lineTo(p.x, bot);
          for (let k = 0; k < 3; k++) g.arc(p.x + rr * (2 * k + 1), bot, rr, Math.PI, 0, false);
          g.lineTo(p.x + PW, H + 4); g.closePath(); g.fill(); g.stroke();
          // soft shine strokes
          g.save(); g.globalAlpha = 0.5; g.strokeStyle = '#FFFFFF'; g.lineWidth = 2.5;
          g.beginPath(); g.moveTo(p.x + 8, top - 14); g.lineTo(p.x + 8, Math.max(0, top - 60)); g.stroke();
          g.beginPath(); g.moveTo(p.x + 8, bot + 14); g.lineTo(p.x + 8, Math.min(H, bot + 60)); g.stroke();
          g.restore();
        });
        // grass strip with pencil hatching at the floor
        g.fillStyle = GRASS; g.fillRect(0, H - 8, W, 8);
        g.save(); g.globalAlpha = 0.4; g.strokeStyle = INK; g.lineWidth = 1.2;
        for (let hx = -((scroll * 1) % 9); hx < W; hx += 9) { g.beginPath(); g.moveTo(hx, H); g.lineTo(hx + 6, H - 8); g.stroke(); }
        g.restore();
        g.fillStyle = INK; g.fillRect(0, H - 9, W, 2);
        // plane
        g.save(); g.translate(px, py); g.rotate(ang);
        g.fillStyle = PLANE; g.strokeStyle = INK; g.lineWidth = 2.5; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(16, 0); g.lineTo(-14, -11); g.lineTo(-8, 0); g.lineTo(-14, 11); g.closePath(); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(16, 0); g.lineTo(-8, 0); g.stroke();
        g.globalAlpha = 0.6; g.strokeStyle = '#FFFFFF'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(8, -3); g.lineTo(-9, -8); g.stroke();
        g.restore();
        g.fillStyle = INK; g.font = `bold 34px ${FONT}`; g.textAlign = 'center'; g.fillText(String(score), W / 2, 42);
      }

      function hit() {
        if (py < 10 || py > H - 12) return true;
        return pillars.some((p) => px + 12 > p.x && px - 12 < p.x + PW && Math.abs(py - p.c) > gap / 2 - 9);
      }
      let last = performance.now(), raf = 0;
      function frame(now) {
        const dt = Math.min(0.04, (now - last) / 1000); last = now;
        if (!over && started) {
          vy += 620 * dt; py += vy * dt;
          ang = Math.max(-0.5, Math.min(0.7, vy / 380));
          const dx = speed * dt;
          scroll += dx;
          pillars.forEach((p) => { p.x -= dx; });
          pillars.forEach((p) => {
            if (!p.passed && p.x + PW < px) {
              p.passed = true; score++; ctx.setScore(score); ctx.sfx('good');
              fillEl.style.transform = `scaleX(${Math.min(1, score / WIN)})`;
              numEl.textContent = `${score} / ${WIN}`; pop(numEl);
              if (score >= WIN) end(true);
              else if (score % 10 === 0) F.cheer(8);
            }
          });
          while (pillars.length && pillars[0].x < -PW - 4) pillars.shift();
          if (pillars.length < 5) addPillar();
          if (!over && hit()) end(false);
        } else if (!over) {
          py = H / 2 + Math.sin(now / 250) * 6; // bob while waiting
        }
        draw();
        raf = requestAnimationFrame(frame);
      }
      raf = requestAnimationFrame(frame);
      ctx.onCleanup(() => cancelAnimationFrame(raf));
      const hop = (e) => {
        e.preventDefault();
        if (over) return;
        if (!started) { started = true; info.textContent = ''; }
        vy = -230;
      };
      cv.addEventListener('pointerdown', hop);
      btn.addEventListener('pointerdown', (e) => { if (!over) pop(btn); hop(e); });

      async function end(won) {
        if (over) return;
        over = true;
        btn.disabled = true;
        info.textContent = F.tt(won ? { de: 'Super Flug!', en: 'Great flight!' } : { de: 'Bruchlandung!', en: 'Crash landing!' });
        ctx.sfx(won ? 'win' : 'bad');
        await ctx.wait(1100);
        ctx.finish({
          score, detail: F.tt({ de: `${score} Lücken`, en: `${score} gaps` }),
          levelDelta: score >= 20 ? 1 : score < 5 ? -1 : 0, quality: Math.min(1, score / 30), ink: 3 + Math.min(20, score),
        });
      }
      ctx.setScore(0);
    },
  });
})();
