/* Zen Garden: rake neat lines into the sand with your finger. Stones and moss are in the way. Relaxing, no timer. */
(function () {
  const F = Funkloch;
  const CELL = 14;

  F.registerGame({
    id: 'zen-garden', skill: 'fun', added: '2026-11-14', glyph: '🪷', noDaily: true,
    name: { de: 'Zen-Garten', en: 'Zen Garden' },
    desc: {
      de: 'Ein kleiner Steingarten, jedes Mal anders. Fahre mit dem Finger durch den Sand und ziehe schöne Rillen mit dem Rechen. Um die Steine herum darfst du Kreise ziehen. Wenn der Sand ganz geharkt ist (oder du genug hast), tippe auf «Fertig».',
      en: 'A little stone garden, different every time. Drag your finger through the sand and rake neat grooves. Draw circles around the stones if you like. When the sand is fully raked (or you have had enough), tap “Done”.',
    },
    start(ctx) {
      const r = ctx.rng;
      const css = getComputedStyle(document.documentElement);
      const col = (n, d) => css.getPropertyValue(n).trim() || d;
      const SAND = col('--paper-2', '#F4EBDA'), GROOVE = col('--ink-soft', '#8A7F70'), LIGHT = col('--card', '#FFFDF8');
      const W = Math.min(358, (window.innerWidth || 390) - 32) || 340;
      const H = Math.max(320, Math.min(500, (window.innerHeight || 740) - 300));
      const gc = Math.ceil(W / CELL), gr = Math.ceil(H / CELL);
      let over = false, done = false, covered = 0, strokes = 0;
      const seen = new Uint8Array(gc * gr);
      ctx.onCleanup(() => { over = true; });
      ctx.el.innerHTML = '';

      // Generated garden: 3-5 stones and 2 moss patches, never overlapping, tries are capped.
      const spots = [];
      const place = (rad) => {
        for (let t = 0; t < 60; t++) {
          const x = r.int(rad + 14, W - rad - 14), y = r.int(rad + 14, H - rad - 14);
          if (spots.every((s) => Math.hypot(s.x - x, s.y - y) > s.rad + rad + 18)) { const s = { x, y, rad }; spots.push(s); return s; }
        }
        return null;
      };
      const stones = [], moss = [];
      const nStone = r.int(3, 5);
      for (let k = 0; k < nStone; k++) { const rad = r.int(20, 34), s = place(rad); if (s) stones.push({ ...s, rot: r.int(-30, 30), sq: 0.7 + r() * 0.3, seed: r.int(1, 99) }); }
      for (let k = 0; k < 2; k++) { const rad = r.int(22, 30), s = place(rad); if (s) moss.push({ ...s }); }
      const blocked = (x, y) => spots.some((s) => Math.hypot(s.x - x, s.y - y) < s.rad * 0.95);
      for (let cy = 0; cy < gr; cy++) for (let cx = 0; cx < gc; cx++) if (blocked(cx * CELL + CELL / 2, cy * CELL + CELL / 2)) { seen[cy * gc + cx] = 2; }
      const free = seen.reduce((n, v) => n + (v === 0 ? 1 : 0), 0) || 1;

      const wrap = F.h(`<div class="sketch" style="position:relative;padding:0;margin:6px auto 0;width:${W}px;height:${H}px;overflow:hidden;background:${SAND};box-shadow:var(--shadow);transform:rotate(0.3deg)"></div>`);
      const cv = F.h(`<canvas style="display:block;touch-action:none;width:${W}px;height:${H}px"></canvas>`);
      const dpr = window.devicePixelRatio || 1;
      cv.width = W * dpr; cv.height = H * dpr;
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.lineCap = 'round';
      // A very light sand speckle (fixed pattern, decoration only).
      const speckle = () => { g.fillStyle = GROOVE; g.globalAlpha = 0.25; for (let k = 0; k < 90; k++) { const x = (k * 97.3) % W, y = (k * 61.7 + (k % 7) * 31) % H; g.fillRect(x, y, 1.6, 1.6); } g.globalAlpha = 1; };
      const clean = () => { g.clearRect(0, 0, W, H); g.fillStyle = SAND; g.fillRect(0, 0, W, H); speckle(); };
      clean();

      const stone = (s) => {
        const pts = Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2, wob = 0.86 + ((Math.sin(i * 3.1 + s.seed) + 1) / 2) * 0.22; return `${(Math.cos(a) * s.rad * wob).toFixed(1)},${(Math.sin(a) * s.rad * wob * s.sq).toFixed(1)}`; });
        return `<g transform="translate(${s.x},${s.y}) rotate(${s.rot})"><ellipse cx="3" cy="${s.rad * s.sq * 0.8}" rx="${s.rad}" ry="${s.rad * 0.25}" style="fill:var(--ink);opacity:.18"/>
          <polygon points="${pts.join(' ')}" style="fill:#9A9AA8;stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/>
          <path d="M${-s.rad * 0.55},${-s.rad * 0.25 * s.sq} q${s.rad * 0.25},${-s.rad * 0.4} ${s.rad * 0.7},${-s.rad * 0.38}" style="fill:none;stroke:#fff" stroke-width="3.2" stroke-linecap="round" opacity=".6"/>
          <path d="M${s.rad * 0.2},${s.rad * 0.3 * s.sq} l${s.rad * 0.3},${s.rad * 0.1}" style="fill:none;stroke:var(--ink)" stroke-width="2" stroke-linecap="round" opacity=".4"/></g>`;
      };
      const mossSVG = (s) => `<g transform="translate(${s.x},${s.y})"><ellipse rx="${s.rad}" ry="${s.rad * 0.7}" style="fill:#6FBF8C;stroke:var(--ink)" stroke-width="3"/>${[[-0.4, -0.1, 0.28], [0.15, -0.3, 0.25], [0.35, 0.1, 0.22], [-0.1, 0.25, 0.2]].map(([a, b, c]) => `<circle cx="${a * s.rad}" cy="${b * s.rad}" r="${c * s.rad}" style="fill:#8FD6A6;stroke:var(--ink)" stroke-width="1.8"/>`).join('')}<path d="M${-s.rad * 0.3},${s.rad * 0.1} l-2,-8 M${s.rad * 0.1},${s.rad * 0.2} l3,-9" style="fill:none;stroke:var(--ink)" stroke-width="1.8" stroke-linecap="round"/></g>`;
      const over_ = F.h(`<svg viewBox="0 0 ${W} ${H}" style="position:absolute;left:0;top:0;width:${W}px;height:${H}px;pointer-events:none">
        ${stones.map((s) => `<circle cx="${s.x}" cy="${s.y}" r="${s.rad + 14}" style="fill:none;stroke:var(--ink-soft)" stroke-width="2" stroke-dasharray="3 7" opacity=".5"/>`).join('')}
        ${moss.map(mossSVG).join('')}${stones.map(stone).join('')}</svg>`);
      wrap.append(cv, over_);

      const barW = Math.min(W, 358);
      const prog = F.h(`<div style="display:flex;align-items:center;gap:10px;max-width:${barW}px;margin:14px auto 0"><div style="flex:1;min-width:0;height:22px;border:2.5px solid var(--ink);border-radius:12px 16px 10px 14px;background:var(--card);overflow:hidden"><div class="zg-bar" style="height:100%;width:100%;background:var(--c-fun);transform-origin:left;transform:scaleX(0)"></div></div><span class="zg-pct" style="font-size:24px;min-width:64px;text-align:right">0 %</span></div>`);
      const row = F.h(`<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:${barW}px;margin:14px auto 0"></div>`);
      const smooth = F.h(`<button class="btn big" style="min-height:64px">${F.esc(F.tt({ de: 'Glätten', en: 'Smooth' }))}</button>`);
      const fin = F.h(`<button class="btn primary big" style="min-height:64px">${F.esc(F.tt({ de: 'Fertig', en: 'Done' }))}</button>`);
      row.append(smooth, fin);
      ctx.el.append(wrap, prog, row);
      const bar = prog.querySelector('.zg-bar'), pct = prog.querySelector('.zg-pct');
      ctx.setInfo(F.esc(F.tt({ de: 'Zieh mit dem Finger Rillen in den Sand', en: 'Drag your finger to rake grooves into the sand' })));

      const mark = (x, y) => {
        const c0 = Math.floor(x / CELL), r0 = Math.floor(y / CELL);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          const c = c0 + dx, rr = r0 + dy;
          if (c < 0 || rr < 0 || c >= gc || rr >= gr) continue;
          const k = rr * gc + c;
          if (seen[k] === 0 && Math.hypot(c * CELL + CELL / 2 - x, rr * CELL + CELL / 2 - y) < CELL * 1.25) { seen[k] = 1; covered++; }
        }
      };
      const update = () => {
        const p = Math.min(1, covered / free);
        bar.style.transform = `scaleX(${p})`; pct.textContent = `${Math.round(p * 100)} %`;
      };
      let last = null;
      const pos = (e) => { const b = cv.getBoundingClientRect(); return { x: (e.clientX - b.left) * (W / b.width), y: (e.clientY - b.top) * (H / b.height) }; };
      const rake = (a, b) => {
        const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy);
        if (len < 0.5) return;
        const nx = -dy / len, ny = dx / len;
        for (const o of [-9, 0, 9]) {
          g.globalAlpha = 0.5; g.strokeStyle = GROOVE; g.lineWidth = 3.4; g.beginPath(); g.moveTo(a.x + nx * o + 1, a.y + ny * o + 1.5); g.lineTo(b.x + nx * o + 1, b.y + ny * o + 1.5); g.stroke(); g.globalAlpha = 1;
          g.strokeStyle = LIGHT; g.lineWidth = 2; g.beginPath(); g.moveTo(a.x + nx * o - 0.5, a.y + ny * o - 0.5); g.lineTo(b.x + nx * o - 0.5, b.y + ny * o - 0.5); g.stroke();
        }
        for (let t = 0; t <= len; t += 5) mark(a.x + (dx * t) / len, a.y + (dy * t) / len);
        mark(b.x, b.y);
      };
      cv.addEventListener('pointerdown', (e) => { if (over || done) return; e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) {} last = pos(e); strokes++; });
      cv.addEventListener('pointermove', (e) => {
        if (!last || over || done) return;
        const p = pos(e);
        if (Math.hypot(p.x - last.x, p.y - last.y) < 3) return;
        rake(last, p); last = p; update();
      });
      const up = () => { last = null; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

      smooth.onclick = () => {
        if (over || done) return;
        for (let i = 0; i < seen.length; i++) if (seen[i] === 1) seen[i] = 0;
        covered = 0; clean(); update(); ctx.sfx('tick');
        wrap.classList.remove('pop-in'); void wrap.offsetWidth; wrap.classList.add('pop-in');
      };
      fin.onclick = async () => {
        if (over || done) return;
        const p = Math.min(1, covered / free);
        if (p < 0.25) {
          ctx.sfx('bad'); fin.classList.remove('flash-bad'); void fin.offsetWidth; fin.classList.add('flash-bad');
          ctx.setInfo(F.esc(F.tt({ de: 'Harke noch ein bisschen mehr Sand', en: 'Rake a bit more sand first' })));
          return;
        }
        done = true; ctx.sfx('win'); F.cheer(p > 0.8 ? 12 : 6);
        await ctx.wait(700);
        if (over) return;
        const score = Math.round(p * 100);
        ctx.finish({
          score,
          detail: F.tt({ de: `${score} % des Gartens geharkt, ${strokes} Striche`, en: `${score}% of the garden raked, ${strokes} strokes` }),
          levelDelta: 0, quality: Math.max(0.3, p), ink: 3 + Math.round(p * 6),
        });
      };
    },
  });
})();
