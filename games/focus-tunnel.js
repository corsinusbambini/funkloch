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
      // Wandering has its own generator: move() runs once per animation frame and frame rates differ between phones.
      // Drawing from ctx.rng there would shift the next round's dots, so the daily challenge would differ per phone.
      const wander = F.rng(Math.floor(r() * 4294967296));
      const nDots = Math.min(14, 6 + ctx.level);
      const nTargets = ctx.level < 4 ? 2 : ctx.level < 8 ? 3 : 4;
      const speed = 90 + ctx.level * 12;
      let round = 0, hits = 0, perfect = 0;
      const cv = F.h('<canvas class="card sketch" style="width:100%;height:400px;display:block;padding:0;touch-action:none"></canvas>');
      // status card below the board: a doodled eye, the rounds and the dots found this round
      const pip = (cls) => `<svg class="${cls}" viewBox="0 0 34 34" width="32" height="32" aria-hidden="true" style="display:block"><circle cx="17" cy="17" r="13" style="stroke-width:2.5"/><path d="M10 13a8 8 0 0 1 6-5" style="fill:none;stroke:#FFFFFF;stroke-width:2.5;stroke-linecap:round;opacity:0"/></svg>`;
      const panel = F.h(`<div class="card sketch alt" style="display:flex;align-items:center;gap:18px;margin-top:14px;padding:14px 18px">
        <svg viewBox="0 0 70 70" width="84" height="84" aria-hidden="true" style="flex:none;transform:rotate(-6deg)">
          <path d="M5 35C17 17 53 16 65 35 53 54 17 54 5 35z" style="fill:var(--card);stroke:var(--ink);stroke-width:3;stroke-linejoin:round"/>
          <circle cx="35" cy="35" r="13" style="fill:var(--c-focus);stroke:var(--ink);stroke-width:2.5"/>
          <circle cx="35" cy="35" r="6" style="fill:var(--ink)"/>
          <path d="M30 29a6 6 0 0 1 5-3" style="fill:none;stroke:#FFFFFF;stroke-width:2.5;stroke-linecap:round"/>
          <path d="M14 22l-5-6M26 16l-2-7M44 16l2-7M56 22l5-6" style="fill:none;stroke:var(--ink);stroke-width:2.5;stroke-linecap:round"/>
        </svg>
        <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px">
          <div><div style="font-size:18px;color:var(--ink-soft)">${F.tt({ de: 'Runden', en: 'Rounds' })}</div><div class="ft-rounds" style="display:flex;gap:4px;margin-top:4px">${Array.from({ length: ROUNDS }, () => pip('ft-r')).join('')}</div></div>
          <div><div style="font-size:18px;color:var(--ink-soft)">${F.tt({ de: 'Gefunden', en: 'Found' })}</div><div class="ft-found" style="display:flex;gap:4px;margin-top:4px">${Array.from({ length: nTargets }, () => pip('ft-f')).join('')}</div></div>
        </div>
      </div>`);
      ctx.el.appendChild(cv);
      ctx.el.appendChild(panel);
      const roundPips = [...panel.querySelectorAll('.ft-r')], foundPips = [...panel.querySelectorAll('.ft-f')];
      const roundState = [];
      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };
      const paintPip = (el, fill, stroke, dashed, shine) => {
        const c = el.firstChild;
        c.style.fill = fill; c.style.stroke = stroke; c.style.strokeDasharray = dashed ? '4 3' : '';
        el.lastChild.style.opacity = shine ? '.6' : '0';
      };
      const showPanel = () => {
        roundPips.forEach((el, i) => {
          const st = roundState[i];
          if (st === 'perfect') paintPip(el, 'var(--good)', 'var(--ink)', false, true);
          else if (st === 'miss') paintPip(el, 'var(--bad)', 'var(--ink)', false, true);
          else if (i === round - 1) paintPip(el, 'var(--card)', 'var(--accent)', false, false);
          else paintPip(el, 'none', 'var(--ink-faint)', true, false);
        });
        const found = dots.filter((d) => d.target && d.state === 'hit').length;
        foundPips.forEach((el, i) => {
          if (i < found) paintPip(el, 'var(--good)', 'var(--ink)', false, true);
          else paintPip(el, 'none', 'var(--ink-faint)', true, false);
        });
      };
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
        // faint tunnel rings in the background (pure decoration, fixed positions)
        g.save(); g.strokeStyle = C.ink; g.globalAlpha = 0.08; g.lineWidth = 2;
        for (let k = 1; k <= 5; k++) { g.beginPath(); g.arc(W / 2, H / 2, k * Math.min(W, H) * 0.1, 0, Math.PI * 2); g.stroke(); }
        g.restore();
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
          // shine stroke
          g.save(); g.globalAlpha = 0.65; g.strokeStyle = '#FFFFFF'; g.lineWidth = 2.5; g.lineCap = 'round';
          g.beginPath(); g.arc(d.x, d.y, R * 0.6, Math.PI * 1.05, Math.PI * 1.5); g.stroke(); g.restore();
          // tick or cross once picked
          if (d.state) {
            g.save(); g.strokeStyle = C.ink; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath();
            if (d.state === 'hit') { g.moveTo(d.x - 6, d.y + 1); g.lineTo(d.x - 1, d.y + 6); g.lineTo(d.x + 7, d.y - 5); }
            else { g.moveTo(d.x - 5, d.y - 5); g.lineTo(d.x + 5, d.y + 5); g.moveTo(d.x + 5, d.y - 5); g.lineTo(d.x - 5, d.y + 5); }
            g.stroke(); g.restore();
          }
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
          const a = (wander() - 0.5) * 2.2 * dt; // gentle wandering
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
        showPanel(); pop(roundPips[round - 1]);
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
        showPanel();
        if (best.target) pop(foundPips[Math.min(foundPips.length - 1, dots.filter((d) => d.target && d.state === 'hit').length - 1)]);
        if (!best.target || picked >= nTargets) {
          const clean = dots.filter((d) => d.target && d.state === 'hit').length === nTargets;
          if (clean) perfect++;
          roundState[round - 1] = clean ? 'perfect' : 'miss';
          showPanel(); pop(roundPips[round - 1]);
          if (clean && round < ROUNDS) F.cheer(8);
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
