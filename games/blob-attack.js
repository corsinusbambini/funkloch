/* Blob Attack (classic arcade shooter): slide your finger to move the cannon, it shoots by itself.
   A troop of blobs marches side to side and steps down. Clear 2 waves before they reach the ground. 3 hearts. */
(function () {
  const F = Funkloch;
  const COLS = 5, WAVES = 2, LIVES = 3, AW = 38, CW = 56, RH = 46;

  const blob = (kind) => {
    const col = ['var(--c-fun)', 'var(--c-chem)', 'var(--accent)', 'var(--c-math)'][kind % 4];
    const legs = kind % 2 ? '<path d="M10,32 l-3,8 M20,34 l0,7 M30,34 l0,7 M40,32 l3,8" />' : '<path d="M12,34 q-4,5 -8,4 M38,34 q4,5 8,4 M22,35 l-2,6 M30,35 l2,6" />';
    const horns = kind % 3 === 0 ? '<path d="M14,10 l-4,-8 M36,10 l4,-8" />' : kind % 3 === 1 ? '<path d="M25,6 l0,-6 M20,8 l-5,-5 M30,8 l5,-5" />' : '<path d="M16,9 q-6,-6 -9,-2 M34,9 q6,-6 9,-2" />';
    return `<svg viewBox="0 0 50 44" width="100%" height="100%" style="display:block;overflow:visible" aria-hidden="true"><g fill="none" style="stroke:var(--ink)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${legs}${horns}
      <path d="M7,30 C4,14 14,7 25,7 C36,7 46,14 43,30 C40,36 10,36 7,30 Z" style="fill:${col}"/></g>
      <circle cx="18" cy="21" r="5" style="fill:#fff;stroke:var(--ink)" stroke-width="2"/><circle cx="32" cy="21" r="5" style="fill:#fff;stroke:var(--ink)" stroke-width="2"/>
      <circle cx="19" cy="22" r="2.2" style="fill:var(--ink)"/><circle cx="33" cy="22" r="2.2" style="fill:var(--ink)"/>
      <path d="M19,29 q6,4 12,0" fill="none" style="stroke:var(--ink)" stroke-width="2.2" stroke-linecap="round"/></svg>`;
  };
  const CANNON = `<svg viewBox="0 0 50 50" width="100%" height="100%" style="display:block;overflow:visible" aria-hidden="true">
    <rect x="20" y="2" width="10" height="20" rx="3" style="fill:var(--card);stroke:var(--ink)" stroke-width="2.8"/>
    <path d="M5,44 C5,30 14,24 25,24 C36,24 45,30 45,44 Z" style="fill:var(--c-focus);stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/>
    <circle cx="25" cy="35" r="5" style="fill:var(--card);stroke:var(--ink)" stroke-width="2.4"/><path d="M11,34 q3,-6 9,-7" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".7"/></svg>`;

  F.registerGame({
    id: 'blob-attack', skill: 'focus', added: '2026-11-18', glyph: '👾',
    name: { de: 'Blob-Angriff', en: 'Blob Attack' },
    desc: {
      de: 'Ziehe deinen Finger links und rechts, um die Kanone zu bewegen. Sie schiesst von selbst. Die Blobs marschieren hin und her und rücken immer näher. Treffe alle Blobs in 2 Wellen, bevor sie den Boden erreichen. Ihre Bomben kosten ein Herz (3 Herzen).',
      en: 'Slide your finger left and right to move the cannon. It shoots by itself. The blobs march back and forth and come closer and closer. Hit all the blobs in 2 waves before they reach the ground. Their bombs cost a heart (3 hearts).',
    },
    start(ctx) {
      const r = ctx.rng, lvl = Math.min(10, Math.max(0, ctx.level || 0));
      const W = Math.min(350, Math.max(300, (ctx.el.clientWidth || 342)));
      const H = Math.max(380, Math.min(580, (window.innerHeight || 740) - 255));
      const ROWS = lvl >= 4 ? 4 : 3, GW = (COLS - 1) * CW + AW, CANW = 44, CANH = 44;
      const bombPlan = Array.from({ length: 400 }, () => r());

      ctx.el.innerHTML = '';
      const field = F.h(`<div class="sketch" style="position:relative;overflow:hidden;height:${H}px;margin:6px 0 0;background:var(--c-focus);box-shadow:var(--shadow);touch-action:none;user-select:none;-webkit-user-select:none"></div>`);
      field.appendChild(F.h(`<svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none"><g style="fill:var(--ink)" opacity=".2"><circle cx="12" cy="14" r="1"/><circle cx="70" cy="9" r="1.2"/><circle cx="40" cy="38" r="1"/><circle cx="88" cy="46" r="1.2"/><circle cx="22" cy="62" r="1"/><circle cx="60" cy="70" r="1"/></g><path d="M0,97 q12,-3 25,0 t25,0 t25,0 t25,0" fill="none" style="stroke:var(--ink)" stroke-width=".9" opacity=".5"/></svg>`));
      const cannon = F.h(`<div style="position:absolute;left:0;top:0;width:${CANW}px;height:${CANH}px;will-change:transform;pointer-events:none">${CANNON}</div>`);
      field.appendChild(cannon);
      const status = F.h(`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:14px"><span class="ba-hearts" style="display:flex;gap:4px"></span><span class="ba-wave" style="font-size:24px"></span><span class="ba-num" style="font-size:26px;min-width:84px;text-align:right"></span></div>`);
      ctx.el.append(field, status);
      const heartsEl = status.querySelector('.ba-hearts'), waveEl = status.querySelector('.ba-wave'), numEl = status.querySelector('.ba-num');
      ctx.setInfo(F.esc(F.tt({ de: 'Ziehe den Finger: die Kanone schiesst selbst', en: 'Slide your finger: the cannon shoots by itself' })));

      let lives = LIVES, wave = 0, killed = 0, over = false, raf = 0, last = 0, clock = 0, cx = W / 2, target = W / 2, fireCd = 0.3, bombCd = 1.6, bi = 0, hitCd = 0;
      let aliens = [], bullets = [], bombs = [], fx = 20, fy = 30, dir = 1, pause = 0, dropped = 0;
      const hearts = () => { heartsEl.innerHTML = Array.from({ length: LIVES }, (_, i) => `<svg viewBox="0 0 24 22" width="28" height="26" aria-hidden="true"><path d="M12,20 C2,12 3,3 9,3 C11,3 12,5 12,6 C12,5 13,3 15,3 C21,3 22,12 12,20 Z" style="fill:${i < lives ? 'var(--bad)' : 'var(--paper-2)'};stroke:var(--ink)" stroke-width="2"/></svg>`).join(''); };
      const upd = () => { waveEl.textContent = F.tt({ de: `Welle ${wave}/${WAVES}`, en: `Wave ${wave}/${WAVES}` }); numEl.textContent = `👾 ${killed}`; };
      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };
      hearts();

      function newWave() {
        wave++; fx = 20; fy = 26; dir = 1; dropped = 0;
        aliens.forEach((a) => a.el.remove()); bullets.forEach((b) => b.el.remove()); bombs.forEach((b) => b.el.remove());
        aliens = []; bullets = []; bombs = [];
        for (let rr = 0; rr < ROWS; rr++) for (let c = 0; c < COLS; c++) {
          const el = F.h(`<div class="pop-in" style="position:absolute;left:0;top:0;width:${AW}px;height:${AW * 0.88}px;will-change:transform;pointer-events:none">${blob(rr + wave)}</div>`);
          field.appendChild(el); aliens.push({ c, r: rr, el, alive: true });
        }
        upd(); pause = 0.9;
      }
      const aim = (e) => { const rc = field.getBoundingClientRect(); target = Math.max(CANW / 2, Math.min(rc.width - CANW / 2, e.clientX - rc.left)); };
      field.addEventListener('pointerdown', (e) => { e.preventDefault(); aim(e); try { field.setPointerCapture(e.pointerId); } catch (x) {} });
      field.addEventListener('pointermove', (e) => { if (e.buttons || e.pointerType === 'touch') aim(e); });
      const mk = (css, html) => { const el = F.h(`<div style="position:absolute;left:0;top:0;will-change:transform;pointer-events:none;${css}">${html || ''}</div>`); field.appendChild(el); return el; };

      function frame(ts) {
        if (over || ctx.dead) return;
        const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts;
        clock += dt; hitCd = Math.max(0, hitCd - dt);
        const fw = field.clientWidth || W, cy = H - CANH - 6;
        cx += (target - cx) * Math.min(1, dt * 14);
        cannon.style.transform = `translate(${(cx - CANW / 2).toFixed(1)}px,${cy}px) rotate(${((target - cx) * 0.2).toFixed(1)}deg)`;
        const alive = aliens.filter((a) => a.alive);
        if (pause > 0) pause -= dt;
        else {
          const speed = (46 + wave * 14 + lvl * 3) * (1 + (aliens.length - alive.length) / aliens.length * 1.6);
          fx += dir * speed * dt;
          const minC = Math.min(...alive.map((a) => a.c)), maxC = Math.max(...alive.map((a) => a.c));
          const left = fx + minC * CW, right = fx + maxC * CW + AW;
          if ((dir > 0 && right > fw - 8) || (dir < 0 && left < 8)) { dir = -dir; fy += 20; dropped++; fx += dir * 2; }
        }
        for (const a of alive) a.el.style.transform = `translate(${(fx + a.c * CW).toFixed(1)}px,${(fy + a.r * RH + Math.sin(clock * 5 + a.c) * 2).toFixed(1)}px)`;
        // shooting
        fireCd -= dt;
        if (fireCd <= 0 && pause <= 0) { fireCd = 0.42; bullets.push({ x: cx, y: cy, el: mk('width:8px;height:18px;border-radius:5px;margin-left:-4px;background:var(--ink);box-shadow:0 0 0 2px var(--card)') }); ctx.sfx('tick'); }
        for (const b of bullets) {
          b.y -= 560 * dt; b.el.style.transform = `translate(${b.x.toFixed(1)}px,${b.y.toFixed(1)}px)`;
          for (const a of alive) {
            if (!a.alive) continue;
            const ax = fx + a.c * CW, ay = fy + a.r * RH;
            if (b.x > ax - 3 && b.x < ax + AW + 3 && b.y < ay + AW * 0.88 && b.y + 18 > ay) {
              a.alive = false; b.dead = true; killed++; a.el.remove(); ctx.sfx('good'); ctx.setScore(killed * 2); pop(numEl); upd();
              const puff = mk(`width:40px;height:40px;margin:-4px 0 0 -2px;left:${ax}px;top:${ay}px;font-size:30px;text-align:center`, '💥'); puff.classList.add('pop-in'); ctx.wait(300).then(() => puff.remove());
              break;
            }
          }
          if (b.y < -20) b.dead = true;
          if (b.dead) b.el.remove();
        }
        bullets = bullets.filter((b) => !b.dead);
        // bombs
        bombCd -= dt;
        const left2 = aliens.filter((a) => a.alive);
        if (bombCd <= 0 && pause <= 0 && left2.length) {
          bombCd = Math.max(0.55, 1.5 - wave * 0.25 - lvl * 0.05) * (0.7 + bombPlan[bi++ % 400] * 0.6);
          const a = left2[Math.floor(bombPlan[bi++ % 400] * left2.length)];
          bombs.push({ x: fx + a.c * CW + AW / 2, y: fy + a.r * RH + AW, el: mk('width:16px;height:16px;margin-left:-8px;border-radius:50%;background:var(--accent);border:2.5px solid var(--ink)') });
        }
        for (const b of bombs) {
          b.y += (210 + wave * 25) * dt; b.el.style.transform = `translate(${b.x.toFixed(1)}px,${b.y.toFixed(1)}px)`;
          if (Math.abs(b.x - cx) < CANW / 2 - 4 && b.y + 16 > cy + 8 && b.y < cy + CANH) {
            b.dead = true;
            if (hitCd <= 0) { lives--; hitCd = 0.8; ctx.sfx('bad'); hearts(); field.classList.remove('flash-bad'); void field.offsetWidth; field.classList.add('flash-bad'); pop(cannon); if (lives <= 0) { over = true; end(false); return; } }
          }
          if (b.y > H) b.dead = true;
          if (b.dead) b.el.remove();
        }
        bombs = bombs.filter((b) => !b.dead);
        // outcome
        const still = aliens.filter((a) => a.alive);
        if (!still.length) {
          if (wave >= WAVES) { over = true; end(true); return; }
          ctx.sfx('win'); F.cheer(8); newWave();
        } else if (fy + Math.max(...still.map((a) => a.r)) * RH + AW > cy - 4) { over = true; end(false); return; }
        raf = requestAnimationFrame(frame);
      }
      ctx.onCleanup(() => { over = true; cancelAnimationFrame(raf); });
      async function end(win) {
        if (win) { ctx.sfx('win'); F.cheer(14); } else ctx.sfx('bad');
        await ctx.wait(800);
        ctx.finish({
          score: killed * 2 + (win ? 20 + lives * 5 : 0),
          detail: F.tt({ de: `${killed} Blobs getroffen, Welle ${wave}`, en: `${killed} blobs hit, wave ${wave}` }),
          levelDelta: win && lives >= 2 ? 1 : killed < 8 ? -1 : 0,
          quality: Math.min(1, killed / (COLS * ROWS * WAVES)), ink: 3 + Math.round(killed / 2),
        });
      }
      newWave();
      raf = requestAnimationFrame(frame);
    },
  });
})();
