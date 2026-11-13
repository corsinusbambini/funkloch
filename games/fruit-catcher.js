/* Fruit Catcher: slide the basket with your finger, catch falling fruit and dodge the stones. */
(function () {
  const F = Funkloch;
  const DUR = 45, LIVES = 3, TARGET = 30;

  F.registerGame({
    id: 'fruit-catcher', skill: 'focus', added: '2026-11-13', glyph: '🧺',
    name: { de: 'Obstfänger', en: 'Fruit Catcher' },
    desc: {
      de: 'Es regnet Obst! Schiebe den Korb mit dem Finger hin und her und fange so viele Früchte wie möglich. Der goldene Stern gibt 3 Punkte. Steine musst du ausweichen: Jeder Stein im Korb kostet ein Herz. Mit 30 Punkten in 45 Sekunden hast du gewonnen.',
      en: 'It is raining fruit! Slide the basket with your finger and catch as many pieces as you can. The golden star is worth 3 points. Dodge the stones: every stone in the basket costs a heart. Reach 30 points within 45 seconds to win.',
    },
    start(ctx) {
      const r = ctx.rng;
      const css = getComputedStyle(document.documentElement);
      const col = (n, d) => css.getPropertyValue(n).trim() || d;
      const INK = col('--ink', '#2B2522'), CARD = col('--card', '#FFFDF8'), HILL = col('--c-spatial', '#B9E6C9'), SKY = col('--paper-2', '#F4EBDA'), WOOD = col('--c-math', '#FFE08A');
      const FONT = getComputedStyle(document.body).fontFamily || 'sans-serif';
      const W = Math.min(350, window.innerWidth - 32) || 330;
      const H = Math.max(360, Math.min(560, (window.innerHeight || 740) - 270));
      const BW = 86, BY = H - 62;
      const baseV = 150 + Math.min(10, ctx.level) * 9;

      // The whole rain is planned up front from ctx.rng, so every phone sees the same fruit on the same day.
      const plan = [];
      for (let t = 0.7, n = 0; t < DUR - 1.6 && n < 200; n++) {
        const u = r();
        const type = u < 0.2 + Math.min(10, ctx.level) * 0.012 ? 'rock' : u > 0.94 ? 'star' : 'fruit';
        plan.push({ t, x: r.int(26, W - 26), type, kind: r.int(0, 3), v: baseV * (0.85 + r() * 0.5) + t * 2.4, y: -24, on: true, rot: r() * 6 });
        t += Math.max(0.36, 0.78 - t * 0.006) + r() * 0.28;
      }

      ctx.el.innerHTML = '';
      const cv = F.h(`<canvas style="display:block;margin:6px auto 0;border:3px solid var(--ink);border-radius:255px 14px 225px 14px / 14px 225px 14px 255px;background:var(--card);touch-action:none;width:${W}px;height:${H}px;box-shadow:var(--shadow)"></canvas>`);
      const dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = H * dpr;
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.font = `bold 22px ${FONT}`; g.textAlign = 'center';
      const status = F.h(`<div style="display:flex;align-items:center;gap:10px;max-width:${W}px;margin:12px auto 0">
        <span class="fc-hearts" style="display:flex;gap:4px;flex:none"></span>
        <div style="flex:1;min-width:0;height:22px;border:2.5px solid var(--ink);border-radius:12px 16px 10px 14px;background:var(--card);overflow:hidden"><div class="fc-time" style="height:100%;background:var(--c-focus);transform-origin:left"></div></div>
        <span class="fc-num" style="font-size:24px;white-space:nowrap;display:inline-block;min-width:78px;text-align:right">0 / ${TARGET}</span></div>`);
      ctx.el.append(cv, status);
      const heartsEl = status.querySelector('.fc-hearts'), timeEl = status.querySelector('.fc-time'), numEl = status.querySelector('.fc-num');
      ctx.setInfo(F.esc(F.tt({ de: 'Schiebe den Korb mit dem Finger', en: 'Slide the basket with your finger' })));

      let bx = W / 2, tx = W / 2, score = 0, lives = LIVES, caught = 0, stones = 0, clock = 0, over = false, squash = 0, raf = 0, last = 0;
      const pops = [];
      const hearts = () => {
        heartsEl.innerHTML = Array.from({ length: LIVES }, (_, i) => `<svg viewBox="0 0 24 22" width="26" height="24"><path d="M12,20 C2,12 3,3 9,3 C11,3 12,5 12,6 C12,5 13,3 15,3 C21,3 22,12 12,20 Z" style="fill:${i < lives ? 'var(--bad)' : 'none'};stroke:${i < lives ? 'var(--ink)' : 'var(--ink-faint)'}" stroke-width="2.2" stroke-linejoin="round" ${i < lives ? '' : 'stroke-dasharray="3 3"'}/></svg>`).join('');
      };
      hearts();
      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };

      function setTarget(e) { const b = cv.getBoundingClientRect(); tx = Math.max(BW / 2, Math.min(W - BW / 2, (e.clientX - b.left) * (W / b.width))); }
      cv.addEventListener('pointerdown', (e) => { e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} setTarget(e); });
      cv.addEventListener('pointermove', (e) => { setTarget(e); });

      function fruit(it) {
        g.save(); g.translate(it.x, it.y); g.scale(1.3, 1.3); g.lineWidth = 2.5; g.strokeStyle = INK; g.lineJoin = 'round';
        if (it.type === 'rock') {
          g.rotate(it.rot + clock * 1.5); g.fillStyle = '#8C8C98';
          g.beginPath(); g.moveTo(-15, 5); g.lineTo(-9, -12); g.lineTo(6, -14); g.lineTo(16, -2); g.lineTo(10, 12); g.lineTo(-8, 13); g.closePath(); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(-8, -6); g.lineTo(0, 0); g.lineTo(-2, 8); g.stroke();
        } else if (it.type === 'star') {
          g.rotate(clock * 2); g.fillStyle = '#FFD66B'; g.beginPath();
          for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? 7 : 16; g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); }
          g.closePath(); g.fill(); g.stroke();
        } else if (it.kind === 0 || it.kind === 1) {
          g.fillStyle = it.kind === 0 ? '#E8574F' : '#F2A33A';
          g.beginPath(); g.arc(0, 2, 14, 0, 7); g.fill(); g.stroke();
          g.strokeStyle = '#fff'; g.globalAlpha = .7; g.lineWidth = 3; g.beginPath(); g.arc(0, 2, 9, 3.6, 4.5); g.stroke(); g.globalAlpha = 1;
          g.strokeStyle = INK; g.lineWidth = 2.5; g.beginPath(); g.moveTo(0, -12); g.lineTo(2, -18); g.stroke();
          g.fillStyle = '#6FBF8C'; g.beginPath(); g.ellipse(7, -15, 6, 3, -0.5, 0, 7); g.fill(); g.stroke();
        } else if (it.kind === 2) {
          g.fillStyle = '#9ED86A';
          g.beginPath(); g.moveTo(0, -16); g.bezierCurveTo(8, -10, 8, -2, 15, 6); g.bezierCurveTo(16, 18, -16, 18, -15, 6); g.bezierCurveTo(-8, -2, -8, -10, 0, -16); g.closePath(); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(0, -16); g.lineTo(2, -22); g.stroke();
        } else {
          g.fillStyle = '#C23B5A';
          g.beginPath(); g.moveTo(-6, 6); g.quadraticCurveTo(-4, -8, 6, -16); g.moveTo(8, 8); g.quadraticCurveTo(8, -6, 6, -16); g.stroke();
          [[-6, 8], [8, 10]].forEach(([cx, cy]) => { g.beginPath(); g.arc(cx, cy, 8, 0, 7); g.fill(); g.stroke(); });
        }
        g.restore();
      }

      function basket() {
        g.save(); g.translate(bx, BY + 20); g.scale(1 + squash * 0.12, 1 - squash * 0.14);
        g.lineWidth = 3; g.strokeStyle = INK; g.fillStyle = WOOD; g.lineJoin = 'round';
        g.beginPath(); g.moveTo(-BW / 2, -18); g.lineTo(BW / 2, -18); g.lineTo(BW / 2 - 9, 24); g.lineTo(-BW / 2 + 9, 24); g.closePath(); g.fill(); g.stroke();
        g.lineWidth = 1.8; g.globalAlpha = .55;
        for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 15, -18); g.lineTo(i * 12, 24); g.stroke(); }
        for (let y = -6; y <= 14; y += 10) { g.beginPath(); g.moveTo(-BW / 2 + 3, y); g.lineTo(BW / 2 - 3, y); g.stroke(); }
        g.globalAlpha = 1; g.lineWidth = 3.5;
        g.beginPath(); g.ellipse(0, -18, BW / 2, 7, 0, 0, 7); g.fillStyle = CARD; g.fill(); g.stroke();
        g.restore();
      }

      function draw() {
        g.clearRect(0, 0, W, H);
        g.fillStyle = SKY; g.fillRect(0, H * 0.55, W, H);
        g.fillStyle = HILL; g.strokeStyle = INK; g.lineWidth = 3;
        g.beginPath(); g.moveTo(0, H - 36); g.bezierCurveTo(W * 0.25, H - 70, W * 0.55, H - 20, W, H - 52); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.fill(); g.stroke();
        g.lineWidth = 2; g.beginPath(); g.moveTo(24, H - 22); g.lineTo(28, H - 32); g.moveTo(W - 50, H - 16); g.lineTo(W - 46, H - 27); g.stroke();
        plan.forEach((it) => { if (it.on && clock >= it.t) fruit(it); });
        basket();
        pops.forEach((p) => { g.globalAlpha = Math.max(0, p.life / 0.7); g.fillStyle = p.col; g.strokeStyle = INK; g.lineWidth = 3; g.strokeText(p.txt, p.x, p.y); g.fillText(p.txt, p.x, p.y); g.globalAlpha = 1; });
      }

      function frame(ts) {
        if (over || ctx.dead) return;
        const dt = Math.min(0.033, last ? (ts - last) / 1000 : 0.016); last = ts;
        clock += dt;
        bx += Math.max(-1100 * dt, Math.min(1100 * dt, tx - bx));
        squash = Math.max(0, squash - dt * 5);
        plan.forEach((it) => {
          if (!it.on || clock < it.t) return;
          it.y += it.v * dt;
          if (it.y > BY - 4 && it.y < BY + 26 && Math.abs(it.x - bx) < BW / 2 + 6) {
            it.on = false; squash = 1;
            if (it.type === 'rock') {
              lives--; stones++; ctx.sfx('bad'); hearts(); cv.classList.remove('flash-bad'); void cv.offsetWidth; cv.classList.add('flash-bad');
              pops.push({ x: bx, y: BY - 20, txt: '−♥', col: '#E06A6A', life: 0.7 });
            } else {
              const pts = it.type === 'star' ? 3 : 1;
              score += pts; caught++; ctx.sfx('good'); ctx.setScore(score); numEl.textContent = `${score} / ${TARGET}`; pop(numEl);
              pops.push({ x: bx, y: BY - 20, txt: `+${pts}`, col: '#FFD66B', life: 0.7 });
            }
          } else if (it.y > H + 30) it.on = false;
        });
        pops.forEach((p) => { p.life -= dt; p.y -= 50 * dt; });
        for (let i = pops.length - 1; i >= 0; i--) if (pops[i].life <= 0) pops.splice(i, 1);
        timeEl.style.transform = `scaleX(${Math.max(0, 1 - clock / DUR)})`;
        draw();
        if (lives <= 0 || clock >= DUR) { over = true; end(); return; }
        raf = requestAnimationFrame(frame);
      }
      ctx.onCleanup(() => { over = true; cancelAnimationFrame(raf); });

      async function end() {
        const win = score >= TARGET;
        if (win) { ctx.sfx('win'); F.cheer(12); } else ctx.sfx('bad');
        await ctx.wait(700);
        ctx.finish({
          score, detail: F.tt({ de: `${caught} Früchte gefangen, ${stones} Steine`, en: `${caught} fruit caught, ${stones} stones` }),
          levelDelta: win && lives >= 2 ? 1 : score < 12 ? -1 : 0,
          quality: Math.min(1, score / TARGET), ink: 3 + Math.round(score / 2),
        });
      }
      draw();
      raf = requestAnimationFrame(frame);
    },
  });
})();
