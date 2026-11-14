/* Mole Whack: moles pop out of 12 holes, tap them fast. Golden moles count triple, never tap the hedgehog. */
(function () {
  const F = Funkloch;
  const DUR = 40, LIVES = 3, TARGET = 24, COLS = 3, ROWS = 4;

  F.registerGame({
    id: 'mole-whack', skill: 'focus', added: '2026-11-14', glyph: '🔨',
    name: { de: 'Maulwurf-Treffer', en: 'Mole Whack' },
    desc: {
      de: 'Maulwürfe schauen aus den Löchern. Tippe sie schnell an, bevor sie wieder abtauchen! Der goldene Maulwurf zählt 3 Punkte. Tippe nie auf den Igel: Jeder Igel kostet ein Herz. Mit 24 Punkten in 40 Sekunden hast du gewonnen.',
      en: 'Moles peek out of the holes. Tap them quickly before they duck away! The golden mole is worth 3 points. Never tap the hedgehog: every hedgehog costs a heart. Reach 24 points within 40 seconds to win.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = Math.min(10, Math.max(0, ctx.level || 0));
      const upTime = Math.max(0.6, 1.15 - lvl * 0.05);

      // The whole round is planned up front from ctx.rng, so every phone sees the same moles on the same day.
      const plan = [], recent = [];
      for (let t = 0.6, n = 0; t < DUR - 1.2 && n < 200; n++) {
        let hole = r.int(0, COLS * ROWS - 1);
        for (let g = 0; g < 12 && recent.includes(hole); g++) hole = r.int(0, COLS * ROWS - 1);
        recent.push(hole); if (recent.length > 4) recent.shift();
        const u = r();
        const kind = u < 0.1 + lvl * 0.01 ? 'hog' : u > 0.93 ? 'gold' : 'mole';
        plan.push({ t, hole, dur: upTime * (0.85 + r() * 0.4), kind, state: 0, hitAt: 0 });
        t += Math.max(0.38, 0.8 - t * 0.006 - lvl * 0.02) + r() * 0.25;
      }

      ctx.el.innerHTML = '';
      const board = F.h(`<div class="sketch" style="padding:10px;margin:6px 0 0;background:var(--c-spatial);box-shadow:var(--shadow);transform:rotate(-0.4deg)"><div class="mw-grid" style="display:grid;grid-template-columns:repeat(${COLS},minmax(0,1fr));gap:4px 8px"></div></div>`);
      const grid = board.firstChild;
      const holes = [];
      const CR = 'clip-path:inset(0 0 0 0)';
      const critter = (kind) => kind === 'hog'
        ? `<g><path d="M18,66 C16,40 34,26 50,26 C68,26 84,40 82,66 Z" style="fill:#8A6A55;stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/>
            ${[22, 32, 42, 52, 62, 72].map((x, i) => `<path d="M${x},${46 - (i % 2) * 6} l${(i - 2.5) * 3},-14" style="stroke:var(--ink)" stroke-width="3.4" stroke-linecap="round"/>`).join('')}
            <ellipse cx="50" cy="56" rx="20" ry="14" style="fill:#F3D9B8;stroke:var(--ink)" stroke-width="2.6"/><circle cx="43" cy="52" r="2.6" style="fill:var(--ink)"/><circle cx="57" cy="52" r="2.6" style="fill:var(--ink)"/><ellipse cx="50" cy="59" rx="3.6" ry="2.6" style="fill:var(--ink)"/></g>`
        : `<g><path d="M20,68 C16,40 32,24 50,24 C68,24 84,40 80,68 Z" style="fill:${kind === 'gold' ? '#FFD66B' : '#8C6B52'};stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/>
            <path d="M28,38 q6,-9 16,-10" style="fill:none;stroke:#fff" stroke-width="3.2" stroke-linecap="round" opacity=".6"/>
            <ellipse cx="50" cy="52" rx="15" ry="12" style="fill:${kind === 'gold' ? '#FFF0B8' : '#D9B896'};stroke:var(--ink)" stroke-width="2.4"/>
            <ellipse cx="50" cy="48" rx="5" ry="3.6" style="fill:#E58BA0;stroke:var(--ink)" stroke-width="2"/>
            <circle cx="38" cy="38" r="3.4" style="fill:var(--ink)"/><circle cx="62" cy="38" r="3.4" style="fill:var(--ink)"/><circle cx="39" cy="37" r="1.1" style="fill:#fff"/><circle cx="63" cy="37" r="1.1" style="fill:#fff"/>
            <path d="M44,56 q6,5 12,0" style="fill:none;stroke:var(--ink)" stroke-width="2" stroke-linecap="round"/>
            <path d="M14,70 q-4,-8 4,-12 M86,70 q4,-8 -4,-12" style="fill:none;stroke:var(--ink)" stroke-width="3.4" stroke-linecap="round"/></g>`;
      for (let i = 0; i < COLS * ROWS; i++) {
        const b = F.h(`<button style="border:0;background:transparent;padding:0;min-width:0;min-height:48px;cursor:pointer;display:block;width:100%;aspect-ratio:1/0.94;-webkit-tap-highlight-color:transparent">
          <svg viewBox="0 0 100 94" style="width:100%;height:100%;display:block;overflow:visible">
            <defs><clipPath id="mwc${i}"><rect x="-10" y="-30" width="120" height="104"/></clipPath></defs>
            <ellipse cx="50" cy="74" rx="47" ry="19" style="fill:#B58B62;stroke:var(--ink)" stroke-width="3"/><ellipse cx="50" cy="70" rx="35" ry="11" style="fill:var(--ink)"/>
            <g clip-path="url(#mwc${i})"><g class="mw-c" style="transition:transform .15s ease-out;transform:translateY(70px)"></g></g>
            <path d="M14,70 C20,80 80,80 86,70 C76,76 24,76 14,70 Z" style="fill:#B58B62;stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/>
            <path d="M20,80 q6,3 14,2 M66,82 q8,1 14,-3" style="fill:none;stroke:var(--ink)" stroke-width="2" stroke-linecap="round" opacity=".35"/>
          </svg></button>`);
        const c = b.querySelector('.mw-c');
        grid.appendChild(b);
        holes.push({ b, c, ev: null });
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(i); });
      }
      const status = F.h(`<div style="display:flex;align-items:center;gap:10px;margin-top:14px">
        <span class="mw-hearts" style="display:flex;gap:4px;flex:none"></span>
        <div style="flex:1;min-width:0;height:22px;border:2.5px solid var(--ink);border-radius:12px 16px 10px 14px;background:var(--card);overflow:hidden"><div class="mw-time" style="height:100%;background:var(--c-focus);transform-origin:left"></div></div>
        <span class="mw-num" style="font-size:26px;white-space:nowrap;min-width:84px;text-align:right;display:inline-block">0 / ${TARGET}</span></div>`);
      ctx.el.append(board, status);
      const heartsEl = status.querySelector('.mw-hearts'), timeEl = status.querySelector('.mw-time'), numEl = status.querySelector('.mw-num');
      ctx.setInfo(F.esc(F.tt({ de: 'Tippe die Maulwürfe, nicht den Igel', en: 'Tap the moles, not the hedgehog' })));

      let score = 0, lives = LIVES, hits = 0, misses = 0, clock = 0, over = false, raf = 0, last = 0;
      const hearts = () => {
        heartsEl.innerHTML = Array.from({ length: LIVES }, (_, i) => `<svg viewBox="0 0 24 22" width="26" height="24"><path d="M12,20 C2,12 3,3 9,3 C11,3 12,5 12,6 C12,5 13,3 15,3 C21,3 22,12 12,20 Z" style="fill:${i < lives ? 'var(--bad)' : 'none'};stroke:${i < lives ? 'var(--ink)' : 'var(--ink-faint)'}" stroke-width="2.2" stroke-linejoin="round" ${i < lives ? '' : 'stroke-dasharray="3 3"'}/></svg>`).join('');
      };
      hearts();
      const popEl = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };
      const float = (h, txt, bad) => {
        const s = F.h(`<span style="position:absolute;left:50%;top:18%;transform:translateX(-50%);font-size:26px;font-weight:700;pointer-events:none;color:${bad ? 'var(--bad)' : 'var(--ink)'};text-shadow:0 0 4px var(--card),0 0 4px var(--card)">${txt}</span>`);
        h.b.style.position = 'relative'; h.b.appendChild(s); s.classList.add('pop-in');
        ctx.wait(500).then(() => s.remove());
      };

      function tap(i) {
        if (over) return;
        const h = holes[i], ev = h.ev;
        popEl(h.b.querySelector('svg'));
        if (!ev || ev.state !== 1) { ctx.sfx('tick'); return; }
        ev.state = 2; ev.hitAt = clock;
        if (ev.kind === 'hog') {
          lives--; ctx.sfx('bad'); hearts(); h.b.classList.remove('flash-bad'); void h.b.offsetWidth; h.b.classList.add('flash-bad');
          float(h, '−♥', true); h.c.style.transform = 'translateY(70px)';
          if (lives <= 0) { over = true; end(); }
        } else {
          const pts = ev.kind === 'gold' ? 3 : 1;
          score += pts; hits++; ctx.sfx('good'); ctx.setScore(score);
          numEl.textContent = `${score} / ${TARGET}`; popEl(numEl);
          float(h, `+${pts}`); h.c.style.transform = 'translateY(70px) scale(0.9)';
        }
      }

      function frame(ts) {
        if (over || ctx.dead) return;
        const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts;
        clock += dt;
        plan.forEach((ev) => {
          const h = holes[ev.hole];
          if (ev.state === 0 && clock >= ev.t && !h.ev) {
            ev.state = 1; h.ev = ev; h.c.innerHTML = critter(ev.kind); h.c.style.transform = 'translateY(0)';
          } else if (ev.state === 1 && clock >= ev.t + ev.dur) {
            ev.state = 3; if (ev.kind !== 'hog') misses++; h.c.style.transform = 'translateY(70px)';
            ctx.wait(200).then(() => { if (h.ev === ev) h.ev = null; });
          } else if (ev.state === 2 && clock >= ev.hitAt + 0.25) {
            ev.state = 4; if (h.ev === ev) h.ev = null;
          }
        });
        timeEl.style.transform = `scaleX(${Math.max(0, 1 - clock / DUR)})`;
        if (clock >= DUR) { over = true; end(); return; }
        raf = requestAnimationFrame(frame);
      }
      ctx.onCleanup(() => { over = true; cancelAnimationFrame(raf); });

      async function end() {
        const win = score >= TARGET;
        if (win) { ctx.sfx('win'); F.cheer(12); } else ctx.sfx('bad');
        await ctx.wait(700);
        ctx.finish({
          score,
          detail: F.tt({ de: `${hits} Maulwürfe getroffen, ${misses} entwischt`, en: `${hits} moles whacked, ${misses} got away` }),
          levelDelta: win && lives >= 2 ? 1 : score < 10 ? -1 : 0,
          quality: Math.min(1, score / TARGET), ink: 3 + Math.round(score / 2),
        });
      }
      raf = requestAnimationFrame(frame);
    },
  });
})();
