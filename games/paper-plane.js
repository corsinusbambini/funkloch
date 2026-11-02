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
      const PILLAR = col('--c-focus', '#B5D8F5'), PLANE = col('--c-fun', '#F8C3DD');
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
      const cv = F.h(`<canvas style="display:block;margin:8px auto;border:3px solid var(--ink);border-radius:12px;background:var(--card);touch-action:none;width:${W}px;height:${H}px;box-shadow:var(--shadow)"></canvas>`);
      const dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = H * dpr;
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.font = 'bold 22px sans-serif'; g.textAlign = 'center';
      const info = F.h('<div class="info-line" style="text-align:center;min-height:26px"></div>');
      info.textContent = F.tt({ de: 'Tippe, um zu starten und zu hüpfen', en: 'Tap to start and hop' });
      ctx.el.appendChild(cv); ctx.el.appendChild(info);

      function draw() {
        g.clearRect(0, 0, W, H);
        g.fillStyle = DOT;
        for (let i = 0; i < 6; i++) {
          const cx = ((i * 97 - scroll * 0.3) % (W + 80) + W + 80) % (W + 80) - 40;
          g.beginPath(); g.ellipse(cx, 50 + (i * 71) % (H - 120), 30, 12, 0, 0, 7); g.fill();
        }
        g.fillStyle = PILLAR; g.strokeStyle = INK; g.lineWidth = 3;
        pillars.forEach((p) => {
          const top = p.c - gap / 2, bot = p.c + gap / 2;
          g.fillRect(p.x, -4, PW, top + 4); g.strokeRect(p.x, -4, PW, top + 4);
          g.fillRect(p.x, bot, PW, H - bot + 4); g.strokeRect(p.x, bot, PW, H - bot + 4);
        });
        g.fillStyle = INK; g.fillRect(0, H - 4, W, 4);
        // plane
        g.save(); g.translate(px, py); g.rotate(ang);
        g.fillStyle = PLANE; g.strokeStyle = INK; g.lineWidth = 2.5; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(16, 0); g.lineTo(-14, -11); g.lineTo(-8, 0); g.lineTo(-14, 11); g.closePath(); g.fill(); g.stroke();
        g.beginPath(); g.moveTo(16, 0); g.lineTo(-8, 0); g.stroke();
        g.restore();
        g.fillStyle = INK; g.fillText(String(score), W / 2, 30);
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
              if (score >= WIN) end(true);
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
      cv.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (over) return;
        if (!started) { started = true; info.textContent = ''; }
        vy = -230;
      });

      async function end(won) {
        if (over) return;
        over = true;
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
