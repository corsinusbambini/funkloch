/* Doodle Pong: 2 players, one paddle each, drag with your finger in your half. */
Funkloch.registerGame({
  id: 'pong', skill: 'duo', added: '2026-10-19', glyph: '◐', players: 2,
  name: { de: 'Kritzel-Pong', en: 'Doodle Pong' },
  desc: { de: 'Der Klassiker. Jeder zieht seinen Schläger mit dem Finger in seiner Hälfte. Der Ball wird mit jedem Treffer schneller. Wer zuerst 5 Punkte hat, gewinnt.', en: 'The classic. Each player drags their paddle with a finger in their half. The ball speeds up with every hit. First to 5 points wins.' },
  noLevel: true, formatBest: () => '◐',
  start(ctx) {
    const F = Funkloch, WIN = 5;
    const root = F.h('<div class="party" style="display:block"><canvas style="width:100%;height:100%;display:block;touch-action:none"></canvas><button class="icon-btn party-quit" aria-label="quit">✕</button></div>');
    document.body.appendChild(root);
    ctx.onCleanup(() => root.remove());
    root.querySelector('button').onclick = () => F.go('home');
    const cv = root.querySelector('canvas'), g = cv.getContext('2d');
    const css = getComputedStyle(document.documentElement);
    const INK = css.getPropertyValue('--ink').trim() || '#2B2522', FAINT = css.getPropertyValue('--ink-faint').trim() || '#ccc';
    let W = 0, H = 0;
    const size = () => { const dpr = window.devicePixelRatio || 1; W = cv.clientWidth; H = cv.clientHeight; cv.width = W * dpr; cv.height = H * dpr; g.setTransform(dpr, 0, 0, dpr, 0, 0); };
    size();
    window.addEventListener('resize', size);
    ctx.onCleanup(() => window.removeEventListener('resize', size));
    const PW = () => Math.max(70, W * 0.24), PH = 14, R = 10;
    const pad = [W / 2, W / 2]; // 0 = top player, 1 = bottom player
    const score = [0, 0];
    let ball, raf = 0, last = performance.now(), pause = 0;
    const serve = (dir) => {
      const a = (ctx.rng() - 0.5) * 0.9;
      const sp = Math.max(260, H * 0.42);
      ball = { x: W / 2, y: H / 2, vx: Math.sin(a) * sp, vy: Math.cos(a) * sp * dir };
      pause = 900;
    };
    serve(ctx.rng.chance(0.5) ? 1 : -1);

    const touches = new Map();
    const onMove = (e) => {
      const rect = cv.getBoundingClientRect();
      const y = e.clientY - rect.top, x = e.clientX - rect.left;
      if (!touches.has(e.pointerId)) touches.set(e.pointerId, y < H / 2 ? 0 : 1);
      pad[touches.get(e.pointerId)] = Math.max(PW() / 2, Math.min(W - PW() / 2, x));
    };
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); onMove(e); });
    cv.addEventListener('pointermove', (e) => { if (touches.has(e.pointerId)) onMove(e); });
    const up = (e) => touches.delete(e.pointerId);
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

    const drawText = (txt, x, y, rot) => { g.save(); g.translate(x, y); g.rotate(rot); g.fillText(txt, 0, 0); g.restore(); };
    function frame(now) {
      if (ctx.dead) return;
      const dt = Math.min(0.033, (now - last) / 1000); last = now;
      if (pause > 0) pause -= dt * 1000;
      else {
        ball.x += ball.vx * dt; ball.y += ball.vy * dt;
        if (ball.x < R) { ball.x = R; ball.vx = Math.abs(ball.vx); }
        if (ball.x > W - R) { ball.x = W - R; ball.vx = -Math.abs(ball.vx); }
        const topY = 40 + PH, botY = H - 40 - PH;
        const hit = (p, dir) => {
          const off = (ball.x - pad[p]) / (PW() / 2);
          if (Math.abs(off) > 1.15) return false;
          const sp = Math.min(Math.hypot(ball.vx, ball.vy) * 1.07, H * 1.4);
          const ang = off * 1.0;
          ball.vx = Math.sin(ang) * sp; ball.vy = Math.cos(ang) * sp * dir;
          F.sfx('tap');
          return true;
        };
        if (ball.vy < 0 && ball.y - R <= topY && ball.y - R > topY - PH - 12) { if (hit(0, 1)) ball.y = topY + R; }
        if (ball.vy > 0 && ball.y + R >= botY && ball.y + R < botY + PH + 12) { if (hit(1, -1)) ball.y = botY - R; }
        if (ball.y < -R || ball.y > H + R) {
          const scorer = ball.y < 0 ? 1 : 0;
          score[scorer]++;
          F.sfx(score[scorer] >= WIN ? 'win' : 'good');
          if (score[scorer] >= WIN) return end(scorer);
          serve(scorer === 1 ? -1 : 1);
        }
      }
      g.clearRect(0, 0, W, H);
      g.strokeStyle = FAINT; g.setLineDash([8, 8]); g.lineWidth = 3;
      g.beginPath(); g.moveTo(0, H / 2); g.lineTo(W, H / 2); g.stroke(); g.setLineDash([]);
      g.fillStyle = INK; g.font = '48px "Patrick Hand", cursive'; g.textAlign = 'center';
      drawText(String(score[0]), W - 40, H / 2 - 30, Math.PI);
      drawText(String(score[1]), 40, H / 2 + 60, 0);
      [[0, 40], [1, H - 40 - PH]].forEach(([p, y]) => {
        g.fillStyle = F.playerColor(p === 0 ? 0 : 1);
        g.strokeStyle = INK; g.lineWidth = 3;
        g.beginPath(); g.roundRect ? g.roundRect(pad[p] - PW() / 2, y, PW(), PH, 7) : g.rect(pad[p] - PW() / 2, y, PW(), PH); g.fill(); g.stroke();
      });
      g.beginPath(); g.arc(ball.x, ball.y, R, 0, Math.PI * 2); g.fillStyle = '#FFD66B'; g.fill(); g.strokeStyle = INK; g.stroke();
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);
    ctx.onCleanup(() => cancelAnimationFrame(raf));
    function end(w) {
      ctx.finish({ score: 0, noRecord: true, display: `${score[0]} : ${score[1]}`, detail: F.playerName(w) + F.tt({ de: ' gewinnt!', en: ' wins!' }), quality: 0.9, ink: 10 });
    }
  },
});
