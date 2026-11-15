/* Star Dash: steer a little rocket with your finger, catch the stars and dodge the rocks. */
(function () {
  const F = Funkloch;
  const DUR = 45, LIVES = 3, TARGET = 14;

  const ROCK = `<svg viewBox="0 0 50 50" width="100%" height="100%" style="display:block"><path d="M10,18 L20,5 L36,7 L46,20 L42,38 L28,46 L12,42 L4,30 Z" style="fill:#9DA3AD;stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/><circle cx="20" cy="22" r="5" style="fill:#7C828C;stroke:var(--ink)" stroke-width="2"/><circle cx="33" cy="32" r="3.4" style="fill:#7C828C;stroke:var(--ink)" stroke-width="2"/><path d="M14,14 q4,-5 9,-5" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/></svg>`;
  const STAR = `<svg viewBox="0 0 50 50" width="100%" height="100%" style="display:block"><path d="M25,4 L31,18 L46,19 L34,29 L38,44 L25,36 L12,44 L16,29 L4,19 L19,18 Z" style="fill:#FFD66B;stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/><path d="M19,16 q3,-6 7,-8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/></svg>`;
  const SHIP = `<svg viewBox="0 0 50 64" width="100%" height="100%" style="display:block;overflow:visible"><path d="M25,2 C36,14 38,34 36,50 L14,50 C12,34 14,14 25,2 Z" style="fill:var(--card);stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/><circle cx="25" cy="26" r="7" style="fill:var(--c-focus);stroke:var(--ink)" stroke-width="2.6"/><path d="M14,40 L3,58 L15,52 Z M36,40 L47,58 L35,52 Z" style="fill:var(--accent);stroke:var(--ink)" stroke-width="2.6" stroke-linejoin="round"/><path d="M19,50 q6,12 12,0" style="fill:#F2B84B;stroke:var(--ink)" stroke-width="2.4" stroke-linejoin="round"/></svg>`;

  F.registerGame({
    id: 'star-dash', skill: 'focus', added: '2026-11-15', glyph: '🚀',
    name: { de: 'Sternenflug', en: 'Star Dash' },
    desc: {
      de: 'Ziehe deinen Finger links und rechts, um die kleine Rakete zu steuern. Fange die Sterne ein und weiche den Felsbrocken aus: Jeder Treffer kostet ein Herz. Mit 14 Sternen in 45 Sekunden hast du gewonnen.',
      en: 'Slide your finger left and right to steer the little rocket. Catch the stars and dodge the rocks: every hit costs a heart. Collect 14 stars within 45 seconds to win.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = Math.min(10, Math.max(0, ctx.level || 0));
      const W = Math.min(350, Math.max(300, (ctx.el.clientWidth || 342)));
      const H = Math.max(380, Math.min(580, (window.innerHeight || 740) - 235));
      const SZ = 40, SHIPW = 40, SHIPH = 52;

      // whole round planned up front from ctx.rng (same sky for every phone on the daily)
      const plan = [];
      for (let t = 0.7, n = 0; t < DUR - 1.5 && n < 300; n++) {
        const star = r() < 0.38;
        const fall = Math.max(1.35, 2.3 - lvl * 0.06 - t * 0.008) * (0.9 + r() * 0.25);
        plan.push({ t, x: 0.08 + r() * 0.84, star, speed: H / fall, el: null, y: -SZ, dead: false });
        t += Math.max(0.3, 0.72 - lvl * 0.025 - t * 0.006) + r() * 0.2;
      }

      ctx.el.innerHTML = '';
      const field = F.h(`<div class="sketch" style="position:relative;overflow:hidden;height:${H}px;margin:6px 0 0;background:var(--c-focus);box-shadow:var(--shadow);touch-action:none;user-select:none;-webkit-user-select:none"></div>`);
      field.appendChild(F.h(`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"><g style="fill:var(--ink)" opacity=".22"><circle cx="12" cy="14" r=".8"/><circle cx="40" cy="8" r=".6"/><circle cx="78" cy="20" r=".9"/><circle cx="62" cy="48" r=".6"/><circle cx="20" cy="62" r=".8"/><circle cx="90" cy="70" r=".7"/><circle cx="48" cy="84" r=".6"/></g></svg>`));
      const ship = F.h(`<div style="position:absolute;left:0;top:0;width:${SHIPW}px;height:${SHIPH}px;will-change:transform;pointer-events:none">${SHIP}</div>`);
      field.appendChild(ship);
      const status = F.h(`<div style="display:flex;align-items:center;gap:10px;margin-top:14px">
        <span class="sd-hearts" style="display:flex;gap:4px;flex:none"></span>
        <div style="flex:1;min-width:0;height:22px;border:2.5px solid var(--ink);border-radius:12px 16px 10px 14px;background:var(--card);overflow:hidden"><div class="sd-time" style="height:100%;background:var(--c-focus);transform-origin:left"></div></div>
        <span class="sd-num" style="font-size:26px;white-space:nowrap;min-width:84px;text-align:right;display:inline-block">⭐ 0 / ${TARGET}</span></div>`);
      ctx.el.append(field, status);
      const heartsEl = status.querySelector('.sd-hearts'), timeEl = status.querySelector('.sd-time'), numEl = status.querySelector('.sd-num');
      ctx.setInfo(F.esc(F.tt({ de: 'Ziehe den Finger: Sterne ja, Felsen nein', en: 'Slide your finger: stars yes, rocks no' })));

      let shipX = W / 2, target = W / 2, stars = 0, lives = LIVES, clock = 0, over = false, raf = 0, last = 0, hitCd = 0, dodged = 0;
      const hearts = () => {
        heartsEl.innerHTML = Array.from({ length: LIVES }, (_, i) => `<svg viewBox="0 0 24 22" width="26" height="24"><path d="M12,20 C2,12 3,3 9,3 C11,3 12,5 12,6 C12,5 13,3 15,3 C21,3 22,12 12,20 Z" style="fill:${i < lives ? 'var(--bad)' : 'none'};stroke:${i < lives ? 'var(--ink)' : 'var(--ink-faint)'}" stroke-width="2.2" stroke-linejoin="round" ${i < lives ? '' : 'stroke-dasharray="3 3"'}/></svg>`).join('');
      };
      hearts();
      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };
      const aim = (e) => {
        const rc = field.getBoundingClientRect();
        target = Math.max(SHIPW / 2, Math.min(rc.width - SHIPW / 2, e.clientX - rc.left));
      };
      field.addEventListener('pointerdown', (e) => { e.preventDefault(); aim(e); try { field.setPointerCapture(e.pointerId); } catch (x) {} });
      field.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') aim(e); });
      const float = (x, y, txt, bad) => {
        const s = F.h(`<span style="position:absolute;left:${x}px;top:${y}px;transform:translateX(-50%);font-size:26px;font-weight:700;pointer-events:none;color:${bad ? 'var(--bad)' : 'var(--ink)'};text-shadow:0 0 4px var(--card),0 0 4px var(--card)">${txt}</span>`);
        field.appendChild(s); s.classList.add('pop-in');
        ctx.wait(550).then(() => s.remove());
      };

      function frame(ts) {
        if (over || ctx.dead) return;
        const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts;
        clock += dt; hitCd = Math.max(0, hitCd - dt);
        const rcw = field.clientWidth || W;
        shipX += (target - shipX) * Math.min(1, dt * 14);
        const sy = H - SHIPH - 8;
        ship.style.transform = `translate(${(shipX - SHIPW / 2).toFixed(1)}px,${sy}px) rotate(${((target - shipX) * 0.25).toFixed(1)}deg)`;
        for (const o of plan) {
          if (o.dead) continue;
          if (!o.el) {
            if (clock < o.t) break;
            o.el = F.h(`<div style="position:absolute;left:0;top:0;width:${SZ}px;height:${SZ}px;will-change:transform;pointer-events:none">${o.star ? STAR : ROCK}</div>`);
            field.appendChild(o.el);
          }
          o.y += o.speed * dt;
          const ox = o.x * rcw;
          o.el.style.transform = `translate(${(ox - SZ / 2).toFixed(1)}px,${o.y.toFixed(1)}px) rotate(${((o.y * (o.star ? 0.3 : 0.5)) % 360).toFixed(0)}deg)`;
          const dx = ox - shipX, dy = (o.y + SZ / 2) - (sy + SHIPH / 2);
          if (Math.abs(dx) < (SZ + SHIPW) / 2 - 8 && Math.abs(dy) < (SZ + SHIPH) / 2 - 10) {
            o.dead = true; o.el.remove();
            if (o.star) {
              stars++; ctx.sfx('good'); ctx.setScore(stars * 3); numEl.textContent = `⭐ ${stars} / ${TARGET}`; pop(numEl); pop(ship); float(shipX, sy - 30, '+1');
            } else if (hitCd <= 0) {
              lives--; hitCd = 0.6; ctx.sfx('bad'); hearts(); field.classList.remove('flash-bad'); void field.offsetWidth; field.classList.add('flash-bad'); float(shipX, sy - 30, '−♥', true);
              if (lives <= 0) { over = true; end(); return; }
            }
          } else if (o.y > H + SZ) { o.dead = true; o.el.remove(); if (!o.star) dodged++; }
        }
        timeEl.style.transform = `scaleX(${Math.max(0, 1 - clock / DUR)})`;
        if (clock >= DUR) { over = true; end(); return; }
        raf = requestAnimationFrame(frame);
      }
      ctx.onCleanup(() => { over = true; cancelAnimationFrame(raf); });

      async function end() {
        const win = stars >= TARGET && lives > 0;
        if (win) { ctx.sfx('win'); F.cheer(12); } else ctx.sfx('bad');
        await ctx.wait(700);
        ctx.finish({
          score: stars * 3 + (win ? lives * 2 : 0),
          detail: F.tt({ de: `${stars} Sterne, ${dodged} Felsen ausgewichen`, en: `${stars} stars, ${dodged} rocks dodged` }),
          levelDelta: win && lives >= 2 ? 1 : stars < 6 ? -1 : 0,
          quality: Math.min(1, stars / TARGET), ink: 3 + stars,
        });
      }
      raf = requestAnimationFrame(frame);
    },
  });
})();
