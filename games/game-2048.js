/* 2048: slide all tiles, equal tiles merge. Swipe or use the arrow buttons. */
(function () {
  const F = Funkloch;
  const SIZE = 4;
  const TILE = { 2: '#FFE08A', 4: '#FFC9B0', 8: '#F8C3DD', 16: '#CFC2F2', 32: '#B5D8F5', 64: '#A8E0D6', 128: '#B9E6C9', 256: '#F2B84B', 512: '#F28C6B', 1024: '#EE8FBC', 2048: '#FFD400' };

  // Slide one line towards index 0; returns the new line and the points gained.
  function slide(line) {
    const v = line.filter(Boolean), out = [];
    let gain = 0;
    for (let i = 0; i < v.length; i++) {
      if (v[i] === v[i + 1]) { out.push(v[i] * 2); gain += v[i] * 2; i++; } else out.push(v[i]);
    }
    while (out.length < SIZE) out.push(0);
    return { out, gain };
  }
  // dir: 0 left, 1 up, 2 right, 3 down
  function move(g, dir) {
    const n = g.slice();
    let gain = 0, moved = false;
    for (let k = 0; k < SIZE; k++) {
      const idx = [];
      for (let j = 0; j < SIZE; j++) {
        idx.push(dir === 0 ? k * SIZE + j : dir === 2 ? k * SIZE + (SIZE - 1 - j) : dir === 1 ? j * SIZE + k : (SIZE - 1 - j) * SIZE + k);
      }
      const res = slide(idx.map((i) => g[i]));
      gain += res.gain;
      idx.forEach((i, j) => { if (n[i] !== res.out[j]) moved = true; n[i] = res.out[j]; });
    }
    return { g: n, gain, moved };
  }
  const canMove = (g) => [0, 1, 2, 3].some((d) => move(g, d).moved);

  F.registerGame({
    id: 'game-2048', skill: 'logic', added: '2026-10-22', glyph: '2048',
    name: { de: '2048', en: '2048' },
    desc: { de: 'Wische die Kacheln in eine Richtung. Gleiche Zahlen verschmelzen zur doppelten. Baue möglichst grosse Zahlen (Ziel: 2048), bis nichts mehr geht.', en: 'Swipe the tiles in one direction. Equal numbers merge into their double. Build the biggest numbers you can (goal: 2048) until no move is left.' },
    noLevel: true,
    start(ctx) {
      const r = ctx.rng;
      let g = Array(SIZE * SIZE).fill(0), score = 0, over = false, won = false, fresh = -1;
      const addTile = () => {
        const free = g.map((v, i) => (v ? -1 : i)).filter((i) => i >= 0);
        if (!free.length) return;
        fresh = r.pick(free);
        g[fresh] = r.chance(0.9) ? 2 : 4;
      };
      addTile(); addTile();

      ctx.el.innerHTML = '';
      const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${SIZE},minmax(0,1fr));gap:8px;max-width:340px;margin:10px auto;padding:8px;border:2.5px solid var(--ink);border-radius:16px;background:var(--paper-2);touch-action:none;box-shadow:var(--shadow)"></div>`);
      const cells = g.map(() => {
        const c = F.h(`<div style="aspect-ratio:1;min-width:0;padding:0;border:2px solid var(--ink-faint);border-radius:12px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:26px;color:#2B2522;overflow:hidden"></div>`);
        board.appendChild(c);
        return c;
      });
      const pad = F.h(`<div style="display:grid;grid-template-columns:repeat(3,64px);grid-template-rows:repeat(2,56px);gap:8px;justify-content:center;margin:6px auto"></div>`);
      [['', 0], ['↑', 1], ['', 0], ['←', 0], ['↓', 3], ['→', 2]].forEach(([lab, dir]) => {
        if (!lab) { pad.appendChild(F.h('<span></span>')); return; }
        const b = F.h(`<button class="btn" style="min-height:56px;min-width:0;padding:0;font-size:28px">${lab}</button>`);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); act(dir); });
        pad.appendChild(b);
      });
      const endBtn = F.h(`<button class="btn small ghost" style="display:block;margin:6px auto">${F.tt({ de: 'Fertig', en: 'Done' })}</button>`);
      endBtn.onclick = () => end();
      ctx.el.appendChild(board);
      ctx.el.appendChild(pad);
      ctx.el.appendChild(endBtn);

      function draw() {
        cells.forEach((c, i) => {
          const v = g[i];
          c.textContent = v || '';
          c.style.background = v ? (TILE[v] || '#FFD400') : 'var(--card)';
          c.style.fontSize = v >= 1024 ? '20px' : v >= 128 ? '23px' : '26px';
          c.style.transform = i === fresh ? 'scale(.9)' : '';
        });
        ctx.setScore(score);
        ctx.setInfo(F.tt({ de: 'Höchste: ', en: 'Best tile: ' }) + Math.max(...g));
      }
      function act(dir) {
        if (over) return;
        const m = move(g, dir);
        if (!m.moved) return;
        g = m.g; score += m.gain;
        addTile();
        ctx.sfx(m.gain ? 'good' : 'tick');
        if (!won && Math.max(...g) >= 2048) { won = true; F.toast(F.tt({ de: '2048 geschafft! 🎉', en: 'You made 2048! 🎉' })); }
        draw();
        if (!canMove(g)) { over = true; ctx.wait(900).then(end); }
      }
      // Swipe: pointer down/up on the board.
      let sx = 0, sy = 0, tracking = false;
      board.addEventListener('pointerdown', (e) => { e.preventDefault(); sx = e.clientX; sy = e.clientY; tracking = true; });
      const up = (e) => {
        if (!tracking) return;
        tracking = false;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return;
        act(Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? 0 : 2) : (dy < 0 ? 1 : 3));
      };
      board.addEventListener('pointerup', up);
      board.addEventListener('pointercancel', () => { tracking = false; });
      function end() {
        if (ctx.dead) return;
        const top = Math.max(...g);
        ctx.finish({
          score, detail: F.tt({ de: `Höchste Kachel: ${top}`, en: `Best tile: ${top}` }),
          quality: Math.min(1, score / 4000), ink: 3 + Math.min(12, Math.round(score / 300)),
        });
      }
      draw();
    },
  });
})();
