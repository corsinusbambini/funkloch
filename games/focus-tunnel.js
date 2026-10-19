/* Focus Tunnel: keep your eyes on the marked dots while all of them move around. */
(function () {
  const F = Funkloch;
  F.registerGame({
    id: 'focus-tunnel', skill: 'focus', glyph: '◎',
    name: { de: 'Fokus-Tunnel', en: 'Focus Tunnel' },
    desc: {
      de: 'Ein paar Punkte leuchten kurz auf. Dann sehen alle gleich aus und flitzen herum. Wenn sie stehen bleiben, tippst du die markierten an. 5 Runden.',
      en: 'A few dots light up briefly. Then they all look the same and zip around. When they stop, tap the marked ones. 5 rounds.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 5;
      const nDots = Math.min(14, 6 + ctx.level);
      const nTargets = ctx.level < 4 ? 2 : ctx.level < 8 ? 3 : 4;
      const speed = 90 + ctx.level * 12;
      let round = 0, hits = 0, perfect = 0;
      const cv = F.h('<canvas class="card sketch" style="width:100%;height:400px;display:block;padding:0;touch-action:none"></canvas>');
      ctx.el.appendChild(cv);
      const g = cv.getContext('2d');
      let W = 0, H = 0;
      const css = getComputedStyle(document.documentElement);
      const C = { ink: css.getPropertyValue('--ink').trim(), card: css.getPropertyValue('--card').trim(), hi: css.getPropertyValue('--accent').trim(), good: css.getPropertyValue('--good').trim(), bad: css.getPropertyValue('--bad').trim() };
      const size = () => {
        const dpr = window.devicePixelRatio || 1;
        W = cv.clientWidth; H = cv.clientHeight;
        cv.width = W * dpr; cv.height = H * dpr;
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      size();
      const R = 15;
      let dots = [], phase = 'idle', raf = 0, picked = 0;
      ctx.onCleanup(() => cancelAnimationFrame(raf));

      const draw = () => {
        g.clearRect(0, 0, W, H);
        dots.forEach((d) => {
          g.beginPath();
          g.arc(d.x, d.y, R, 0, Math.PI * 2);
          let fill = C.card;
          if (phase === 'show' && d.target) fill = C.hi;
          if (d.state === 'hit') fill = C.good;
          if (d.state === 'miss') fill = C.bad;
          if (phase === 'reveal' && d.target && d.state !== 'hit') fill = C.hi;
          g.fillStyle = fill; g.fill();
          g.lineWidth = 2.5; g.strokeStyle = C.ink; g.stroke();
        });
      };
      function setup() {
        dots = [];
        size();
        if (W < 120 || H < 120) { W = Math.max(W, 300); H = Math.max(H, 400); }
        for (let tries = 0; dots.length < nDots; tries++) {
          const d = { x: r.int(R + 4, W - R - 4), y: r.int(R + 4, H - R - 4) };
          // give up on spacing after many tries instead of looping forever
          if (tries < 3000 && dots.some((o) => Math.hypot(o.x - d.x, o.y - d.y) < R * 3)) continue;
          const a = r() * Math.PI * 2;
          d.vx = Math.cos(a) * speed; d.vy = Math.sin(a) * speed; d.target = false; d.state = null;
          dots.push(d);
        }
        r.shuffle(dots).slice(0, nTargets).forEach((d) => (d.target = true));
      }
      function move(dt) {
        dots.forEach((d) => {
          const a = (r() - 0.5) * 2.2 * dt; // gentle wandering
          const c = Math.cos(a), s = Math.sin(a);
          [d.vx, d.vy] = [d.vx * c - d.vy * s, d.vx * s + d.vy * c];
          d.x += d.vx * dt; d.y += d.vy * dt;
          if (d.x < R) { d.x = R; d.vx = Math.abs(d.vx); } if (d.x > W - R) { d.x = W - R; d.vx = -Math.abs(d.vx); }
          if (d.y < R) { d.y = R; d.vy = Math.abs(d.vy); } if (d.y > H - R) { d.y = H - R; d.vy = -Math.abs(d.vy); }
        });
        // soft separation so dots don't sit on top of each other at the end
        for (let i = 0; i < dots.length; i++) for (let j = i + 1; j < dots.length; j++) {
          const a = dots[i], b = dots[j], dx = b.x - a.x, dy = b.y - a.y, dist = Math.hypot(dx, dy);
          if (dist > 0 && dist < R * 2.2) { const push = (R * 2.2 - dist) / 2, ux = dx / dist, uy = dy / dist; a.x -= ux * push; a.y -= uy * push; b.x += ux * push; b.y += uy * push; }
        }
      }
      async function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(hits);
        ctx.setInfo(F.tt({ de: `Runde ${round}/${ROUNDS} · merk dir ${nTargets} Punkte`, en: `Round ${round}/${ROUNDS} · watch ${nTargets} dots` }));
        setup(); picked = 0; phase = 'show'; draw();
        await ctx.wait(2200);
        phase = 'move';
        const moveMs = 4500 + ctx.level * 250;
        let last = performance.now(); const t0 = last;
        await new Promise((res) => {
          const step = (now) => {
            if (ctx.dead) return;
            const dt = Math.min(0.05, (now - last) / 1000); last = now;
            move(dt); draw();
            if (now - t0 < moveMs) raf = requestAnimationFrame(step); else res();
          };
          raf = requestAnimationFrame(step);
        });
        phase = 'pick';
        ctx.setInfo(F.tt({ de: `Tippe die ${nTargets} Punkte an!`, en: `Tap the ${nTargets} dots!` }));
      }
      cv.addEventListener('pointerdown', async (e) => {
        if (phase !== 'pick') return;
        const rect = cv.getBoundingClientRect();
        const x = e.clientX - rect.left, y = e.clientY - rect.top;
        let best = null, bd = R * 1.9;
        dots.forEach((d) => { const dd = Math.hypot(d.x - x, d.y - y); if (dd < bd && !d.state) { bd = dd; best = d; } });
        if (!best) return;
        picked++;
        if (best.target) { best.state = 'hit'; hits++; ctx.sfx('good'); } else { best.state = 'miss'; ctx.sfx('bad'); }
        draw();
        ctx.setScore(hits);
        if (!best.target || picked >= nTargets) {
          const clean = dots.filter((d) => d.target && d.state === 'hit').length === nTargets;
          if (clean) perfect++;
          phase = 'reveal'; draw();
          await ctx.wait(clean ? 700 : 1500);
          next();
        }
      });
      function end() {
        const max = ROUNDS * nTargets;
        ctx.finish({
          score: hits, display: `${hits} / ${max}`,
          detail: F.tt({ de: `${perfect} perfekte Runden`, en: `${perfect} perfect rounds` }),
          levelDelta: perfect >= 4 ? 1 : perfect <= 1 ? -1 : 0,
          quality: hits / max, ink: 4 + hits * 2,
        });
      }
      next();
    },
  });
})();
