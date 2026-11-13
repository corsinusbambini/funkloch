/* Double Up: slide all tiles, equal tiles merge. Swipe or use the arrow buttons. */
(function () {
  const F = Funkloch;
  const SIZE = 4;
  // Tile colours from the style variables (readable in light and dark); big tiles get an accent rim.
  const TILE = ['--c-math', '--c-memory', '--c-fun', '--c-logic', '--c-focus', '--c-chem', '--c-spatial', '--c-duo'];
  const tileVar = (v) => `var(${TILE[(Math.log2(v) - 1) % TILE.length]})`;

  // Slide one line towards index 0; returns the new line, the points gained and where merges landed.
  function slide(line) {
    const v = line.filter(Boolean), out = [], merged = [];
    let gain = 0;
    for (let i = 0; i < v.length; i++) {
      if (v[i] === v[i + 1]) { merged.push(out.length); out.push(v[i] * 2); gain += v[i] * 2; i++; } else out.push(v[i]);
    }
    while (out.length < SIZE) out.push(0);
    return { out, gain, merged };
  }
  // dir: 0 left, 1 up, 2 right, 3 down
  function move(g, dir) {
    const n = g.slice();
    let gain = 0, moved = false;
    const merged = [];
    for (let k = 0; k < SIZE; k++) {
      const idx = [];
      for (let j = 0; j < SIZE; j++) {
        idx.push(dir === 0 ? k * SIZE + j : dir === 2 ? k * SIZE + (SIZE - 1 - j) : dir === 1 ? j * SIZE + k : (SIZE - 1 - j) * SIZE + k);
      }
      const res = slide(idx.map((i) => g[i]));
      gain += res.gain;
      res.merged.forEach((j) => merged.push(idx[j]));
      idx.forEach((i, j) => { if (n[i] !== res.out[j]) moved = true; n[i] = res.out[j]; });
    }
    return { g: n, gain, moved, merged };
  }
  const canMove = (g) => [0, 1, 2, 3].some((d) => move(g, d).moved);

  F.registerGame({
    id: 'game-2048', skill: 'logic', added: '2026-10-22', glyph: '×2',
    name: { de: 'Zahlen verdoppeln', en: 'Double Up' },
    desc: { de: 'Wische die Kacheln in eine Richtung. Gleiche Zahlen verschmelzen zur doppelten. Baue möglichst grosse Zahlen (Ziel: eine Kachel mit 2048), bis nichts mehr geht.', en: 'Swipe the tiles in one direction. Equal numbers merge into their double. Build the biggest numbers you can (goal: a 2048 tile) until no move is left.' },
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
      // A sketched tray holding the tiles; empty slots are faint dashed squares.
      const board = F.h(`<div class="sketch" style="display:grid;grid-template-columns:repeat(${SIZE},minmax(0,1fr));gap:9px;max-width:356px;margin:8px auto 18px;padding:10px;border-width:3px;background:var(--paper-2);touch-action:none;box-shadow:var(--shadow)"></div>`);
      const cells = g.map((_, i) => {
        const c = F.h(`<div style="aspect-ratio:1;min-width:0;padding:0;border:2.5px dashed var(--ink-faint);border-radius:${12 + (i % 3) * 2}px ${14 - (i % 2) * 3}px ${11 + (i % 2) * 3}px ${13 - (i % 3)}px;background:var(--card);display:flex;align-items:center;justify-content:center;font-size:34px;font-weight:bold;color:var(--ink);overflow:hidden"></div>`);
        board.appendChild(c);
        return c;
      });
      // Thumb pad: Done | ↑ | doodle, then ← ↓ →. Arrows are drawn strokes.
      const arrow = (rot) => `<svg viewBox="0 0 40 40" width="34" height="34" aria-hidden="true" style="transform:rotate(${rot}deg)"><path d="M20 33 Q19 20 20.5 8 M10 17 Q15 12 20.5 7 Q25.5 12 30 17.5" fill="none" stroke="var(--ink)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
      const pad = F.h(`<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-auto-rows:74px;gap:12px;max-width:310px;margin:0 auto"></div>`);
      const endBtn = F.h(`<button class="btn" style="min-height:0;min-width:0;padding:0;font-size:19px;background:var(--paper-2)">${F.tt({ de: 'Fertig', en: 'Done' })}</button>`);
      endBtn.onclick = () => end();
      const doodle = F.h(`<svg class="motif" viewBox="0 0 90 66" aria-hidden="true" style="width:100%;height:74px">
        <g transform="rotate(-8 24 30)"><rect x="8" y="16" width="30" height="30" rx="8" fill="var(--c-math)" stroke="var(--ink)" stroke-width="2.6"/><path d="M14 22 Q19 19 25 20" fill="none" stroke="var(--card)" stroke-width="2.2" stroke-linecap="round"/></g>
        <path d="M40 33 Q46 27 52 33" fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round"/><path d="M49 28 L52.5 33.5 L46.5 34" fill="none" stroke="var(--ink)" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
        <g transform="rotate(6 70 32)"><rect x="55" y="13" width="32" height="36" rx="9" fill="var(--c-memory)" stroke="var(--ink)" stroke-width="2.6"/><path d="M62 21 L77 37 M77 21 L62 37" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/></g></svg>`);
      [['end'], ['↑', 1, 0], ['doodle'], ['←', 0, -90], ['↓', 3, 180], ['→', 2, 90]].forEach(([lab, dir, rot]) => {
        if (lab === 'end') return pad.appendChild(endBtn);
        if (lab === 'doodle') return pad.appendChild(doodle);
        const b = F.h(`<button class="btn" aria-label="${lab}" style="min-height:0;min-width:0;padding:0">${arrow(rot)}</button>`);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); act(dir); });
        pad.appendChild(b);
      });
      ctx.el.appendChild(board);
      ctx.el.appendChild(pad);

      let merged = [];
      const replay = (el, cls) => { el.classList.remove('pop-in', 'tap-pop'); void el.offsetWidth; el.classList.add(cls); };
      function draw() {
        cells.forEach((c, i) => {
          const v = g[i];
          c.textContent = v || '';
          c.style.background = v ? tileVar(v) : 'var(--card)';
          c.style.border = v ? `${v >= 256 ? '3.5px solid var(--accent)' : '2.5px solid var(--ink)'}` : '2.5px dashed var(--ink-faint)';
          c.style.boxShadow = v ? 'inset 3px 3px 0 rgba(255,255,255,.3), 2px 2px 0 var(--ink)' : 'none';
          c.style.fontSize = v >= 1024 ? '24px' : v >= 128 ? '28px' : '34px';
          if (v && i === fresh) replay(c, 'pop-in');
          else if (v && merged.includes(i)) replay(c, 'tap-pop');
        });
        fresh = -1; merged = [];
        ctx.setScore(score);
        ctx.setInfo(F.tt({ de: 'Höchste: ', en: 'Best tile: ' }) + Math.max(...g));
      }
      function act(dir) {
        if (over) return;
        const m = move(g, dir);
        if (!m.moved) return;
        g = m.g; score += m.gain; merged = m.merged;
        addTile();
        ctx.sfx(m.gain ? 'good' : 'tick');
        if (!won && Math.max(...g) >= 2048) { won = true; F.cheer(8); F.toast(F.tt({ de: 'Kachel 2048 geschafft! 🎉', en: 'You built the 2048 tile! 🎉' })); }
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
