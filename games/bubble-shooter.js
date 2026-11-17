/* Bubble Shooter (classic arcade): aim with your finger, let go to shoot. Three or more bubbles of one colour pop,
   and bubbles that lose their hold fall too. Pop 50 bubbles with 30 shots before the wall comes down. */
(function () {
  const F = Funkloch;
  const R = 17, W = 340, H = R * 1.732, ROWS = 13, LOSE_ROW = 12, SY = 462, SX = W / 2, VH = 516;
  const SHOTS = 30, TARGET = 50;
  const COL = ['#E8574F', '#5B8FD6', '#F2C14E', '#6FBF8C', '#B58BE0'];

  F.registerGame({
    id: 'bubble-shooter', skill: 'focus', added: '2026-11-17', glyph: '🫧🫧',
    name: { de: 'Blasen-Schütze', en: 'Bubble Shooter' },
    desc: {
      de: 'Zeige mit dem Finger, wohin du zielst, und lass los, um zu schiessen. Drei oder mehr Blasen derselben Farbe platzen, und Blasen ohne Halt fallen mit. Triffst du nicht, rückt die Decke nach. Lass 50 Blasen platzen, bevor deine 30 Schüsse aufgebraucht sind.',
      en: 'Point with your finger and let go to shoot. Three or more bubbles of one colour pop, and bubbles that lose their hold fall with them. Miss too often and the ceiling comes down. Pop 50 bubbles before your 30 shots run out.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = Math.max(0, Math.min(10, ctx.level || 0));
      const K = lvl >= 1 ? 5 : 4, MISS = lvl >= 6 ? 4 : 5;
      let shift = 0, grid = [], shots = SHOTS, popped = 0, miss = 0, busy = false, over = false, raf = 0, aim = Math.PI / 2, aiming = false;
      const t = (o) => F.esc(F.tt(o));
      const off = (row) => (row + shift) & 1;
      const ncols = (row) => (off(row) ? 9 : 10);
      const cx = (row, c) => R + c * 2 * R + (off(row) ? R : 0);
      const cy = (row) => R + row * H;
      const set = (row, c, v) => { while (grid.length <= row) grid.push(new Array(ncols(grid.length)).fill(-1)); grid[row][c] = v; };
      const get = (row, c) => (row < 0 || row >= grid.length || c < 0 || c >= ncols(row) ? -2 : grid[row][c]);
      function nbrs(row, c) {
        const out = [[row, c - 1], [row, c + 1]];
        for (const rr of [row - 1, row + 1]) {
          if (rr < 0 || rr >= ROWS) continue;
          for (let k = 0; k < ncols(rr); k++) if (Math.abs(cx(rr, k) - cx(row, c)) < R * 1.2) out.push([rr, k]);
        }
        return out.filter(([a, b]) => b >= 0 && a >= 0 && a < ROWS && b < ncols(a));
      }
      const makeRow = (row) => { const a = []; for (let c = 0; c < ncols(row); c++) a.push(c > 0 && r() < 0.4 ? a[c - 1] : r.int(0, K - 1)); return a; };
      for (let row = 0; row < 7; row++) grid.push(makeRow(row));
      const present = () => { const s = new Set(); grid.forEach((rw) => rw.forEach((v) => { if (v >= 0) s.add(v); })); return [...s]; };
      const pickCol = () => { const p = present(); return p.length ? r.pick(p) : r.int(0, K - 1); };
      let cur = pickCol(), nxt = pickCol();

      ctx.el.innerHTML = '';
      const wrap = F.h(`<div class="sketch pop-in" style="padding:6px;margin:4px 0 6px;background:var(--paper-2);box-shadow:var(--shadow);transform:rotate(-0.3deg)"></div>`);
      const svg = F.h(`<svg viewBox="0 0 ${W} ${VH}" style="display:block;width:100%;height:auto;touch-action:none;-webkit-tap-highlight-color:transparent;user-select:none">
        <path d="M2,6 q${W / 8},-6 ${W / 4},0 t${W / 4},0 t${W / 4},0 t${W / 4},0" fill="none" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/>
        <path d="M0,${cy(LOSE_ROW) - R + 4} H${W}" stroke="var(--bad)" stroke-width="3" stroke-dasharray="9 7" opacity=".85"/>
        <g class="bs-bub"></g><g class="bs-fx"></g><g class="bs-aim"></g><g class="bs-shot"></g>
        <g class="bs-gun"></g></svg>`);
      wrap.appendChild(svg);
      const stat = F.h(`<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;text-align:center;font-size:20px;margin:2px 0"></div>`);
      ctx.el.append(wrap, stat);
      const gBub = svg.querySelector('.bs-bub'), gFx = svg.querySelector('.bs-fx'), gAim = svg.querySelector('.bs-aim'), gShot = svg.querySelector('.bs-shot'), gGun = svg.querySelector('.bs-gun');
      const sg = (x) => F.h(`<svg>${x}</svg>`).firstElementChild;
      const bubSVG = (v, rad) => `<circle r="${rad}" style="fill:${COL[v]};stroke:var(--ink)" stroke-width="2.6"/><path d="M${-rad * 0.55},${-rad * 0.1} a${rad * 0.6},${rad * 0.6} 0 0 1 ${rad * 0.5},${-rad * 0.5}" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;

      function render() {
        gBub.innerHTML = '';
        grid.forEach((rw, row) => rw.forEach((v, c) => { if (v >= 0) gBub.appendChild(sg(`<g transform="translate(${cx(row, c)},${cy(row)})">${bubSVG(v, R - 1)}</g>`)); }));
        const deg = 90 - (aim * 180) / Math.PI;
        gGun.innerHTML = '';
        gGun.appendChild(sg(`<g><ellipse cx="${SX}" cy="${SY + 22}" rx="46" ry="18" style="fill:var(--card);stroke:var(--ink)" stroke-width="3"/>
          <g transform="translate(${SX},${SY}) rotate(${deg})"><rect x="-10" y="-46" width="20" height="46" rx="6" style="fill:var(--c-focus);stroke:var(--ink)" stroke-width="3"/><rect x="-13" y="-52" width="26" height="12" rx="4" style="fill:var(--accent);stroke:var(--ink)" stroke-width="3"/></g>
          <g transform="translate(${SX},${SY})">${bubSVG(cur, R - 1)}</g>
          <g transform="translate(${SX - 78},${SY + 20}) scale(.7)">${bubSVG(nxt, R - 1)}</g>
          <text x="${SX - 78}" y="${SY + 46}" text-anchor="middle" font-size="14" style="fill:var(--ink-soft)">${t({ de: 'danach', en: 'next' })}</text></g>`));
        const dots = Array.from({ length: MISS }, (_, i) => `<span style="display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid var(--ink);margin:0 2px;background:${i < miss ? 'var(--bad)' : 'transparent'}"></span>`).join('');
        stat.innerHTML = `<div>🎯 <b style="font-weight:400">${shots}</b><div style="font-size:15px;color:var(--ink-soft)">${t({ de: 'Schüsse', en: 'shots' })}</div></div>
          <div>🫧 <b style="font-weight:400">${popped} / ${TARGET}</b><div style="font-size:15px;color:var(--ink-soft)">${t({ de: 'geplatzt', en: 'popped' })}</div></div>
          <div>${dots}<div style="font-size:15px;color:var(--ink-soft)">${t({ de: 'Decke', en: 'ceiling' })}</div></div>`;
        ctx.setScore(popped); ctx.setInfo(`${shots}`);
      }
      function aimAt(e) {
        const rect = svg.getBoundingClientRect();
        const k = rect.width ? W / rect.width : 1;
        const x = (e.clientX - rect.left) * k, y = (e.clientY - rect.top) * k;
        let a = Math.atan2(SY - y, x - SX);
        if (!isFinite(a)) a = Math.PI / 2;
        const lo = 0.2, hi = Math.PI - 0.2;
        aim = Math.max(lo, Math.min(hi, a));
        const len = 150;
        gAim.innerHTML = '';
        for (let i = 1; i <= 7; i++) {
          const d = 26 + i * 20;
          gAim.appendChild(sg(`<circle cx="${SX + Math.cos(aim) * d}" cy="${SY - Math.sin(aim) * d}" r="${i === 7 ? 4 : 3.2}" style="fill:var(--ink)" opacity="${1 - i * 0.1}"/>`));
        }
        void len; renderGunOnly();
      }
      function renderGunOnly() { render(); }
      svg.addEventListener('pointerdown', (e) => { e.preventDefault(); if (busy || over) return; aiming = true; try { svg.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } aimAt(e); });
      svg.addEventListener('pointermove', (e) => { if (aiming && !busy && !over) aimAt(e); });
      const release = (e) => { if (!aiming) return; aiming = false; if (busy || over) return; if (e && e.type === 'pointerup') aimAt(e); gAim.innerHTML = ''; shoot(); };
      svg.addEventListener('pointerup', release);
      svg.addEventListener('pointercancel', () => { aiming = false; gAim.innerHTML = ''; });

      function plan() {
        let x = SX, y = SY, vx = Math.cos(aim), vy = -Math.sin(aim);
        const pts = [[x, y]], cells = [];
        grid.forEach((rw, row) => rw.forEach((v, c) => { if (v >= 0) cells.push([cx(row, c), cy(row)]); }));
        for (let i = 0; i < 1400; i++) {
          x += vx * 3; y += vy * 3;
          if (x < R) { x = 2 * R - x; vx = -vx; pts.push([R, y]); } else if (x > W - R) { x = 2 * (W - R) - x; vx = -vx; pts.push([W - R, y]); }
          if (y <= R) { y = R; break; }
          if (cells.some(([bx, by]) => (bx - x) * (bx - x) + (by - y) * (by - y) < (2 * R - 3) * (2 * R - 3))) break;
        }
        pts.push([x, y]);
        let best = null, bd = 1e9;
        const rr = Math.round((y - R) / H);
        for (let row = Math.max(0, rr - 1); row <= Math.min(ROWS - 1, rr + 1); row++) for (let c = 0; c < ncols(row); c++) {
          if (get(row, c) !== -1 && grid[row] !== undefined && grid[row][c] !== undefined && grid[row][c] >= 0) continue;
          if (row < grid.length && grid[row][c] >= 0) continue;
          const d = (cx(row, c) - x) ** 2 + (cy(row) - y) ** 2;
          if (d < bd) { bd = d; best = [row, c]; }
        }
        return { pts, cell: best };
      }
      function shoot() {
        busy = true;
        const { pts, cell } = plan();
        const col = cur;
        cur = nxt; nxt = pickCol(); ctx.sfx('tap');
        const el = sg(`<g>${bubSVG(col, R - 1)}</g>`);
        gShot.innerHTML = ''; gShot.appendChild(el);
        let seg = 0, dist = 0, last = 0;
        const segLen = (i) => Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]);
        function frame(ts) {
          if (ctx.dead || over) return;
          const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016; last = ts;
          dist += 1100 * dt;
          while (seg < pts.length - 1 && dist >= segLen(seg)) { dist -= segLen(seg); seg++; }
          if (seg >= pts.length - 1) { gShot.innerHTML = ''; land(col, cell); return; }
          const L = segLen(seg) || 1, p = dist / L;
          el.setAttribute('transform', `translate(${pts[seg][0] + (pts[seg + 1][0] - pts[seg][0]) * p},${pts[seg][1] + (pts[seg + 1][1] - pts[seg][1]) * p})`);
          raf = requestAnimationFrame(frame);
        }
        raf = requestAnimationFrame(frame);
      }
      function fx(x, y, v, fall) {
        const el = sg(`<g transform="translate(${x},${y})"><g style="transform-box:fill-box;transform-origin:center">${bubSVG(v, R - 1)}</g></g>`);
        gFx.appendChild(el);
        const inner = el.firstChild;
        if (inner.animate) inner.animate(fall ? [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(160px)', opacity: 0 }] : [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.7)', opacity: 0 }], { duration: fall ? 450 : 280, easing: 'ease-in' });
        ctx.wait(500).then(() => el.remove());
      }
      async function land(col, cell) {
        shots--;
        if (!cell) cell = [0, 0];
        set(cell[0], cell[1], col);
        // find cluster
        const key = (a, b) => a * 20 + b, seen = new Set([key(...cell)]), stack = [cell], cl = [cell];
        while (stack.length) {
          const [a, b] = stack.pop();
          for (const [na, nb] of nbrs(a, b)) if (get(na, nb) === col && !seen.has(key(na, nb))) { seen.add(key(na, nb)); stack.push([na, nb]); cl.push([na, nb]); }
        }
        let gained = 0;
        if (cl.length >= 3) {
          cl.forEach(([a, b]) => { fx(cx(a, b), cy(a), grid[a][b], false); grid[a][b] = -1; });
          gained += cl.length; miss = 0;
          // drop floating
          const hold = new Set(), st2 = [];
          grid[0] && grid[0].forEach((v, c) => { if (v >= 0) { hold.add(key(0, c)); st2.push([0, c]); } });
          while (st2.length) { const [a, b] = st2.pop(); for (const [na, nb] of nbrs(a, b)) if (get(na, nb) >= 0 && !hold.has(key(na, nb))) { hold.add(key(na, nb)); st2.push([na, nb]); } }
          let fell = 0;
          grid.forEach((rw, a) => rw.forEach((v, b) => { if (v >= 0 && !hold.has(key(a, b))) { fx(cx(a, b), cy(a), v, true); grid[a][b] = -1; fell++; } }));
          gained += fell;
          popped += gained; ctx.sfx(cl.length >= 5 || fell ? 'win' : 'good');
        } else {
          miss++; ctx.sfx('tick');
          if (miss >= MISS) { miss = 0; addRow(); }
        }
        render();
        const bad = grid.some((rw, a) => a >= LOSE_ROW && rw.some((v) => v >= 0));
        const empty = !grid.some((rw) => rw.some((v) => v >= 0));
        if (bad) return end(false, 'wall');
        if (popped >= TARGET || empty) return end(true, empty ? 'clear' : 'target');
        if (shots <= 0) return end(false, 'shots');
        busy = false;
      }
      function addRow() {
        shift ^= 1;
        grid.unshift(makeRow(0));
        gAim.innerHTML = '';
        svg.classList.remove('flash-bad'); void svg.getBoundingClientRect(); svg.classList.add('flash-bad');
        ctx.sfx('bad');
      }
      async function end(win, why) {
        over = true; busy = true; render();
        if (win) { ctx.sfx('win'); F.cheer(14); } else ctx.sfx('bad');
        await ctx.wait(900);
        const score = popped * 3 + (win ? 30 + shots * 2 : 0);
        ctx.finish({
          score,
          detail: F.tt({ de: `${popped} Blasen geplatzt, ${shots} Schüsse übrig${why === 'wall' ? ', Wand erreicht' : ''}`, en: `${popped} bubbles popped, ${shots} shots left${why === 'wall' ? ', wall reached' : ''}` }),
          levelDelta: win ? 1 : popped < 18 ? -1 : 0,
          quality: Math.min(1, popped / TARGET), ink: 4 + Math.round(score / 10),
        });
      }
      ctx.onCleanup(() => { over = true; cancelAnimationFrame(raf); });
      render();
    },
  });
})();
