/* Maze: a new hand-drawn maze every time. Drag your finger from the doodle to the flag and pick up the stars on the way. */
(function () {
  const F = Funkloch;
  const MAZES = 3, U = 40;
  const hash = (a, b) => { const v = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return v - Math.floor(v); };

  function build(r, cols, rows, loops) {
    // wallR[i]: wall on the right of cell i; wallD[i]: wall below cell i. Recursive backtracker, iterative.
    const n = cols * rows, wallR = new Array(n).fill(true), wallD = new Array(n).fill(true), seen = new Array(n).fill(false);
    const stack = [0]; seen[0] = true;
    for (let g = 0; stack.length && g < n * 8; g++) {
      const i = stack[stack.length - 1], x = i % cols, y = Math.floor(i / cols), nb = [];
      if (x > 0 && !seen[i - 1]) nb.push([i - 1, 'L']);
      if (x < cols - 1 && !seen[i + 1]) nb.push([i + 1, 'R']);
      if (y > 0 && !seen[i - cols]) nb.push([i - cols, 'U']);
      if (y < rows - 1 && !seen[i + cols]) nb.push([i + cols, 'D']);
      if (!nb.length) { stack.pop(); continue; }
      const [j, d] = r.pick(nb);
      if (d === 'R') wallR[i] = false; else if (d === 'L') wallR[j] = false; else if (d === 'D') wallD[i] = false; else wallD[j] = false;
      seen[j] = true; stack.push(j);
    }
    // A few extra openings so there is more than one way round.
    for (let k = 0; k < loops; k++) {
      const i = r.int(0, n - 1);
      if (r() < 0.5) { if (i % cols < cols - 1) wallR[i] = false; } else if (i + cols < n) wallD[i] = false;
    }
    return { cols, rows, wallR, wallD };
  }
  const open = (m, a, b) => {
    if (b === a + 1 && a % m.cols < m.cols - 1) return !m.wallR[a];
    if (b === a - 1 && b % m.cols < m.cols - 1) return !m.wallR[b];
    if (b === a + m.cols) return !m.wallD[a];
    if (b === a - m.cols) return !m.wallD[b];
    return false;
  };
  const nbrs = (m, i) => [i - 1, i + 1, i - m.cols, i + m.cols].filter((j) => j >= 0 && j < m.cols * m.rows && open(m, i, j));
  function bfs(m, from, to, maxLen) {
    const prev = new Map([[from, -1]]), q = [from];
    for (let h = 0; h < q.length; h++) {
      const i = q[h];
      if (i === to) break;
      for (const j of nbrs(m, i)) if (!prev.has(j)) { prev.set(j, i); q.push(j); }
    }
    if (!prev.has(to)) return null;
    const path = [];
    for (let k = to; k !== -1; k = prev.get(k)) path.unshift(k);
    return path.length - 1 <= maxLen ? path : null;
  }

  F.registerGame({
    id: 'maze', skill: 'spatial', added: '2026-11-14', glyph: '🧭',
    name: { de: 'Irrgarten', en: 'Maze' },
    desc: {
      de: 'Zieh den Finger vom Kritzelwesen unten links durch den Irrgarten zur Fahne oben rechts. Sackgasse? Zieh einfach zurück. Sterne am Weg geben Extrapunkte. Gewonnen hast du, wenn du alle 3 Irrgärten schaffst, am besten schnell und mit allen Sternen.',
      en: 'Drag your finger from the doodle at the bottom left through the maze to the flag at the top right. Dead end? Just drag back. Stars on the way give bonus points. You win by getting through all 3 mazes, ideally fast and with every star.',
    },
    start(ctx) {
      const r = ctx.rng, level = Math.max(0, ctx.level || 0);
      const cols = Math.min(9, 6 + Math.floor(level / 2)), rows = Math.min(12, Math.round(cols * 1.4));
      let idx = 0, over = false, total = 0, starsAll = 0, m, cur, trail, stars, got, t0, solved = false;
      ctx.onCleanup(() => { over = true; });
      ctx.el.innerHTML = '';
      const wrap = F.h('<div class="sketch" style="padding:8px;margin:6px 0 0;background:var(--card);box-shadow:var(--shadow);transform:rotate(-0.4deg)"></div>');
      const W = cols * U + 8, H = rows * U + 8;
      const svg = F.h(`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:auto;display:block;touch-action:none;user-select:none"></svg>`);
      wrap.appendChild(svg);
      const bar = F.h('<div style="display:flex;justify-content:space-between;align-items:center;margin-top:12px;font-size:22px"><span class="mz-n"></span><span class="mz-s" style="display:flex;gap:4px;align-items:center"></span></div>');
      ctx.el.append(wrap, bar);
      const nEl = bar.querySelector('.mz-n'), sEl = bar.querySelector('.mz-s');
      const cx = (i) => 4 + (i % cols) * U + U / 2, cy = (i) => 4 + Math.floor(i / cols) * U + U / 2;
      const vx = (c, rr) => 4 + c * U + (c > 0 && c < cols ? (hash(c, rr) - 0.5) * 3.2 : 0), vy = (c, rr) => 4 + rr * U + (rr > 0 && rr < rows ? (hash(rr + 9, c) - 0.5) * 3.2 : 0);
      const starPath = (x, y, R) => { let d = ''; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + k * Math.PI / 5, q = k % 2 ? R * 0.45 : R; d += `${k ? 'L' : 'M'}${(x + Math.cos(a) * q).toFixed(1)},${(y + Math.sin(a) * q).toFixed(1)}`; } return d + 'Z'; };

      function newMaze() {
        m = build(r, cols, rows, 2 + Math.floor(cols / 3));
        cur = (rows - 1) * cols; trail = [cur]; got = 0; solved = false;
        const exit = cols - 1, pool = [];
        for (let i = 0; i < cols * rows; i++) if (i !== cur && i !== exit && nbrs(m, i).length === 1) pool.push(i);
        stars = [];
        for (let k = 0; k < 3 && pool.length; k++) { const j = r.int(0, pool.length - 1); stars.push({ i: pool[j], on: true }); pool.splice(j, 1); }
        // Draw the static part: wobbly walls, flag, stars.
        let walls = '';
        const seg = (x1, y1, x2, y2) => { walls += `M${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} `; };
        seg(vx(0, 0), vy(0, 0), vx(cols, 0), vy(cols, 0)); seg(vx(cols, 0), vy(cols, 0), vx(cols, rows), vy(cols, rows));
        seg(vx(cols, rows), vy(cols, rows), vx(0, rows), vy(0, rows)); seg(vx(0, rows), vy(0, rows), vx(0, 0), vy(0, 0));
        for (let i = 0; i < cols * rows; i++) {
          const c = i % cols, rr = Math.floor(i / cols);
          if (c < cols - 1 && m.wallR[i]) seg(vx(c + 1, rr), vy(c + 1, rr), vx(c + 1, rr + 1), vy(c + 1, rr + 1));
          if (rr < rows - 1 && m.wallD[i]) seg(vx(c, rr + 1), vy(c, rr + 1), vx(c + 1, rr + 1), vy(c + 1, rr + 1));
        }
        // Gap in the border at the exit so it looks like a way out.
        const ex = cx(exit), ey = cy(exit);
        svg.innerHTML = `<rect x="4" y="4" width="${cols * U}" height="${rows * U}" style="fill:var(--paper-2);opacity:.55"/>
          <path d="M${cx(cur) - 14},${cy(cur) + 14} h28" style="stroke:var(--ink-faint)" stroke-width="3" stroke-dasharray="4 4"/>
          <g transform="translate(${ex},${ey})"><path d="M-8,14 L-8,-14" style="stroke:var(--ink)" stroke-width="3" stroke-linecap="round"/><path d="M-8,-14 L12,-8 L-8,-1 Z" style="fill:var(--bad);stroke:var(--ink)" stroke-width="2.5" stroke-linejoin="round"/></g>
          <path class="mz-trail" d="" style="fill:none;stroke:var(--accent)" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>
          ${stars.map((s, k) => `<path class="mz-star" data-k="${k}" d="${starPath(cx(s.i), cy(s.i), 11)}" style="fill:#FFD66B;stroke:var(--ink)" stroke-width="2" stroke-linejoin="round"/>`).join('')}
          <path d="${walls}" style="fill:none;stroke:var(--ink)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
          <g class="mz-me"><circle r="13" style="fill:var(--c-spatial);stroke:var(--ink)" stroke-width="3"/><circle cx="-4.5" cy="-2" r="2" style="fill:var(--ink)"/><circle cx="4.5" cy="-2" r="2" style="fill:var(--ink)"/><path d="M-4,4 q4,3.5 8,0" style="fill:none;stroke:var(--ink)" stroke-width="2" stroke-linecap="round"/></g>`;
        t0 = Date.now();
        refresh(true);
        wrap.classList.remove('pop-in'); void wrap.offsetWidth; wrap.classList.add('pop-in');
      }
      function refresh(first) {
        svg.querySelector('.mz-trail').setAttribute('d', trail.map((i, k) => `${k ? 'L' : 'M'}${cx(i)},${cy(i)}`).join(' '));
        const me = svg.querySelector('.mz-me');
        me.setAttribute('transform', `translate(${cx(cur)},${cy(cur)})`);
        if (!first) { me.classList.remove('tap-pop'); void me.getBoundingClientRect(); me.classList.add('tap-pop'); }
        nEl.textContent = F.tt({ de: `Irrgarten ${idx + 1} / ${MAZES}`, en: `Maze ${idx + 1} / ${MAZES}` });
        sEl.innerHTML = [0, 1, 2].map((k) => `<svg viewBox="0 0 24 24" width="26" height="26"><path d="${starPath(12, 12.5, 11)}" style="fill:${k < got ? '#FFD66B' : 'none'};stroke:var(--ink)" stroke-width="2" stroke-linejoin="round" ${k < got ? '' : 'stroke-dasharray="3 2.5"'}/></svg>`).join('');
      }
      function stepTo(j) {
        if (over || solved) return;
        const k = trail.indexOf(j);
        if (k >= 0) trail = trail.slice(0, k + 1); else trail.push(j);
        cur = j; ctx.sfx('tick');
        stars.forEach((s, q) => { if (s.on && s.i === j) { s.on = false; got++; ctx.sfx('good'); const el = svg.querySelector(`.mz-star[data-k="${q}"]`); if (el) el.style.display = 'none'; } });
        refresh();
        if (cur === cols - 1) win();
      }
      function pointerCell(e) {
        const b = svg.getBoundingClientRect();
        const x = ((e.clientX - b.left) / b.width) * W - 4, y = ((e.clientY - b.top) / b.height) * H - 4;
        const c = Math.floor(x / U), rr = Math.floor(y / U);
        return c >= 0 && rr >= 0 && c < cols && rr < rows ? rr * cols + c : -1;
      }
      let down = false;
      const move = (e) => {
        if (!down || over || solved) return;
        const t = pointerCell(e);
        if (t < 0 || t === cur) return;
        const path = bfs(m, cur, t, 4);
        if (path) for (let k = 1; k < path.length; k++) stepTo(path[k]);
      };
      svg.addEventListener('pointerdown', (e) => { e.preventDefault(); down = true; try { svg.setPointerCapture(e.pointerId); } catch (x) {} move(e); });
      svg.addEventListener('pointermove', move);
      svg.addEventListener('pointerup', () => { down = false; });
      svg.addEventListener('pointercancel', () => { down = false; });

      async function win() {
        solved = true;
        const sec = (Date.now() - t0) / 1000;
        const shortest = bfs(m, (rows - 1) * cols, cols - 1, 999).length - 1;
        const bonus = Math.max(0, Math.round(20 - sec / 3));
        const pts = 10 + got * 5 + bonus;
        total += pts; starsAll += got; ctx.setScore(total);
        ctx.sfx('win'); F.cheer(6);
        nEl.textContent = F.tt({ de: `Geschafft! +${pts}`, en: `Made it! +${pts}` });
        await ctx.wait(1100);
        if (over) return;
        idx++;
        if (idx >= MAZES) return end(shortest);
        newMaze();
      }
      function end() {
        over = true;
        ctx.finish({
          score: total,
          detail: F.tt({ de: `${starsAll} von ${MAZES * 3} Sternen gesammelt`, en: `${starsAll} of ${MAZES * 3} stars collected` }),
          levelDelta: starsAll >= 7 ? 1 : starsAll <= 3 ? -1 : 0,
          quality: Math.min(1, starsAll / (MAZES * 3) * 0.6 + 0.4), ink: 4 + starsAll * 2,
        });
      }
      newMaze();
    },
  });
})();
