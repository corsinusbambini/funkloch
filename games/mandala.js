/* Mandala Maker: draw with your finger, every stroke is mirrored around the centre into a symmetric pattern. */
(function () {
  const F = Funkloch;

  F.registerGame({
    id: 'mandala', skill: 'fun', added: '2026-11-09', glyph: '❁',
    name: { de: 'Mandala-Zeichner', en: 'Mandala Maker' },
    desc: {
      de: 'Male mit dem Finger: Jeder Strich wird rundherum gespiegelt und ergibt ein Mandala. Wechsle Farbe und Pinsel, mit «Neu» startest du ein frisches Blatt. Kein Gewinnen, nur Entspannen. Tippe «Fertig», wenn du zufrieden bist.',
      en: 'Draw with your finger: every stroke is mirrored all around the centre into a mandala. Change colour and brush, tap "New" for a fresh sheet. No winning, just relaxing. Tap "Done" when you are happy.',
    },
    noLevel: true, noDaily: true,
    formatBest: (v) => v + ' ❁',
    start(ctx) {
      const r = ctx.rng;
      const css = getComputedStyle(document.documentElement);
      const col = (n, d) => css.getPropertyValue(n).trim() || d;
      const CARD = col('--card', '#FFFDF8'), FAINT = col('--ink-faint', '#C9BBA4');
      const FOLDS = [6, 8, 10, 12];
      let folds = r.pick(FOLDS), strokes = 0, sheets = 1, color = 0, width = 3;
      const hue0 = r.int(0, 359);
      const colors = [0, 1, 2, 3, 4].map((k) => `hsl(${(hue0 + k * 67) % 360},72%,58%)`);

      ctx.el.innerHTML = '';
      const size = Math.max(240, Math.min(340, window.innerWidth - 32));
      const cv = F.h(`<canvas style="display:block;margin:4px auto 0;border:3px solid var(--ink);border-radius:50%;background:var(--card);touch-action:none;width:${size}px;height:${size}px;box-shadow:var(--shadow)"></canvas>`);
      const dpr = window.devicePixelRatio || 1;
      cv.width = size * dpr; cv.height = size * dpr;
      const g = cv.getContext('2d');
      const C = size / 2;
      function blank() {
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.clearRect(0, 0, size, size);
        g.fillStyle = CARD; g.fillRect(0, 0, size, size);
        g.strokeStyle = FAINT; g.lineWidth = 1; g.setLineDash([3, 5]);
        for (let k = 0; k < folds; k++) {
          const a = (k * Math.PI * 2) / folds;
          g.beginPath(); g.moveTo(C, C); g.lineTo(C + Math.cos(a) * C, C + Math.sin(a) * C); g.stroke();
        }
        g.setLineDash([]);
      }
      blank();

      function seg(x0, y0, x1, y1) {
        g.lineCap = 'round'; g.lineJoin = 'round';
        g.strokeStyle = colors[color]; g.lineWidth = width;
        for (let k = 0; k < folds; k++) {
          for (const m of [1, -1]) {
            g.save();
            g.translate(C, C); g.rotate((k * Math.PI * 2) / folds); g.scale(1, m); g.translate(-C, -C);
            g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
            g.restore();
          }
        }
      }
      let last = null, pid = null;
      const pos = (e) => { const b = cv.getBoundingClientRect(); return [((e.clientX - b.left) / b.width) * size, ((e.clientY - b.top) / b.height) * size]; };
      cv.addEventListener('pointerdown', (e) => {
        e.preventDefault(); pid = e.pointerId; last = pos(e);
        try { cv.setPointerCapture(pid); } catch (_) { /* fine */ }
        seg(last[0], last[1], last[0] + 0.01, last[1]); strokes++; ctx.setScore(strokes);
      });
      cv.addEventListener('pointermove', (e) => {
        if (e.pointerId !== pid || !last) return;
        e.preventDefault();
        const p = pos(e); seg(last[0], last[1], p[0], p[1]); last = p;
      });
      const stop = (e) => { if (e.pointerId === pid) { last = null; pid = null; } };
      cv.addEventListener('pointerup', stop); cv.addEventListener('pointercancel', stop);

      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };
      // paint palette: colour blobs on a sketched card
      const bar = F.h('<div class="card sketch alt" style="display:flex;justify-content:center;gap:10px;margin:16px 0 0;padding:14px 10px"></div>');
      const sw = colors.map((c, i) => {
        const b = F.h(`<button aria-label="colour ${i + 1}" style="width:54px;height:54px;flex:none;border-radius:52% 48% 50% 46%;border:3px solid var(--ink);background:${c};cursor:pointer;padding:0;position:relative"><i style="position:absolute;left:22%;top:18%;width:34%;height:30%;border-top:3px solid #FFFFFF;border-radius:50%;opacity:.6"></i></button>`);
        b.onclick = () => { color = i; paint(); pop(b); };
        bar.appendChild(b);
        return b;
      });
      const bar2 = F.h('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:16px 0 0"></div>');
      const brush = F.h(`<button class="btn" style="min-height:76px;padding:4px 6px;display:flex;align-items:center;justify-content:center;gap:6px"></button>`);
      brush.onclick = () => { width = width === 3 ? 7 : width === 7 ? 1.5 : 3; paint(); pop(brush); };
      const fresh = F.h(`<button class="btn" style="min-height:76px;padding:4px 6px">${F.tt({ de: 'Neu', en: 'New' })}</button>`);
      fresh.onclick = () => {
        sheets++; folds = r.pick(FOLDS.filter((f) => f !== folds)); blank(); ctx.sfx('tick'); pop(fresh); pop(cv);
      };
      const done = F.h(`<button class="btn primary" style="min-height:76px;padding:4px 6px">${F.tt({ de: 'Fertig', en: 'Done' })}</button>`);
      done.onclick = () => ctx.finish({
        score: strokes, display: `${strokes} ❁`,
        detail: F.tt({ de: `${strokes} Striche · ${sheets} Blätter`, en: `${strokes} strokes · ${sheets} sheets` }),
        quality: strokes >= 20 ? 1 : 0.6, ink: Math.min(30, 3 + Math.floor(strokes / 3)),
      });
      bar2.append(brush, fresh, done);
      function paint() {
        sw.forEach((b, i) => { b.style.outline = i === color ? '4px solid var(--accent)' : 'none'; b.style.outlineOffset = '2px'; });
        const rr = width === 1.5 ? 3 : width === 3 ? 5.5 : 9;
        brush.innerHTML = `<span>${F.tt({ de: 'Pinsel', en: 'Brush' })}</span><svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" style="flex:none"><circle cx="12" cy="12" r="${rr}" style="fill:${colors[color]};stroke:var(--ink);stroke-width:2"/></svg>`;
      }
      paint();
      ctx.setScore(0);
      ctx.el.append(cv, bar, bar2);
    },
  });
})();
