/* Gap Filler (spatial): a wall has a hole shaped like a pentomino. Pick the stone that fits it exactly;
   stones may be turned and flipped in your head. 8 holes. */
(function () {
  const F = Funkloch;
  const N = 8, G = 6;
  const SHAPES = {
    F: [[1, 0], [2, 0], [0, 1], [1, 1], [1, 2]], I: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], L: [[0, 0], [0, 1], [0, 2], [0, 3], [1, 3]],
    N: [[1, 0], [1, 1], [0, 2], [1, 2], [0, 3]], P: [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2]], T: [[0, 0], [1, 0], [2, 0], [1, 1], [1, 2]],
    U: [[0, 0], [2, 0], [0, 1], [1, 1], [2, 1]], V: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], W: [[0, 0], [0, 1], [1, 1], [1, 2], [2, 2]],
    X: [[1, 0], [0, 1], [1, 1], [2, 1], [1, 2]], Y: [[1, 0], [0, 1], [1, 1], [1, 2], [1, 3]], Z: [[0, 0], [1, 0], [1, 1], [1, 2], [2, 2]],
  };
  const KEYS = Object.keys(SHAPES);
  const norm = (c) => { const mx = Math.min(...c.map((p) => p[0])), my = Math.min(...c.map((p) => p[1])); return c.map((p) => [p[0] - mx, p[1] - my]); };
  const orient = (cells, k) => {
    let c = cells;
    for (let i = 0; i < (k & 3); i++) c = c.map(([x, y]) => [-y, x]);
    if (k & 4) c = c.map(([x, y]) => [-x, y]);
    return norm(c);
  };
  const dims = (c) => [Math.max(...c.map((p) => p[0])) + 1, Math.max(...c.map((p) => p[1])) + 1];

  F.registerGame({
    id: 'gap-filler', skill: 'spatial', added: '2026-11-17', glyph: '🧩',
    name: { de: 'Lückenfüller', en: 'Gap Filler' },
    desc: {
      de: 'In der Mauer fehlt ein Stück. Welcher der vier Steine passt genau in die Lücke? Du darfst ihn im Kopf drehen und umdrehen. Zwei falsche Tipps beenden die Runde. Finde bei 8 Lücken so viele passende Steine wie möglich.',
      en: 'A piece is missing from the wall. Which of the four stones fits the gap exactly? You may turn and flip it in your head. Two wrong taps end the round. Fill as many of the 8 gaps as you can.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = Math.max(0, Math.min(8, ctx.level || 0));
      let q = 0, points = 0, right = 0, wrongs = 0;
      const t = (o) => F.esc(F.tt(o));
      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };
      const brickPal = ['var(--c-spatial)', 'var(--card)'];

      function make() {
        const target = r.pick(KEYS);
        const others = r.shuffle(KEYS.filter((k) => k !== target)).slice(0, 3);
        const hole = orient(SHAPES[target], r.int(0, 7)), [w, h] = dims(hole);
        const ox = r.int(0, G - w), oy = r.int(0, G - h);
        const opts = r.shuffle([target].concat(others)).map((k) => ({ k, cells: orient(SHAPES[k], r.int(0, 7)) }));
        return { target, hole, ox, oy, opts };
      }
      function pieceSVG(cells, cs, fill) {
        const [w, h] = dims(cells), pad = 4;
        return `<svg viewBox="0 0 ${w * cs + pad * 2} ${h * cs + pad * 2}" style="width:${w * cs + pad * 2}px;height:${h * cs + pad * 2}px;max-width:100%" aria-hidden="true">${cells.map(([x, y], i) => `<rect x="${pad + x * cs + 1}" y="${pad + y * cs + 1}" width="${cs - 2}" height="${cs - 2}" rx="5" style="fill:${fill};stroke:var(--ink)" stroke-width="2.4" transform="rotate(${(i % 3 - 1) * 1.2} ${pad + x * cs + cs / 2} ${pad + y * cs + cs / 2})"/><path d="M${pad + x * cs + 6},${pad + y * cs + 8} q4,-4 9,-4" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".55"/>`).join('')}</svg>`;
      }

      function next() {
        if (q >= N) return end();
        q++;
        const d = ctx.fresh(make, (o) => o.target + o.hole.join(';') + o.ox + o.oy);
        const holeSet = new Set(d.hole.map(([x, y]) => (y + d.oy) * G + (x + d.ox)));
        ctx.setScore(points); ctx.setInfo(`${q} / ${N}`);
        ctx.el.innerHTML = '';
        const cs = 52;
        const cells = [];
        for (let i = 0; i < G * G; i++) {
          const x = i % G, y = Math.floor(i / G);
          const inHole = holeSet.has(i);
          cells.push(inHole
            ? `<rect class="gf-h" x="${x * cs + 3}" y="${y * cs + 3}" width="${cs - 6}" height="${cs - 6}" rx="6" style="fill:var(--paper);stroke:var(--ink)" stroke-width="3" stroke-dasharray="6 5"/>`
            : `<g><rect x="${x * cs + 3}" y="${y * cs + 3}" width="${cs - 6}" height="${cs - 6}" rx="6" style="fill:${brickPal[(x + y) % 2]};stroke:var(--ink)" stroke-width="2.4"/><path d="M${x * cs + 9},${y * cs + 12} q6,-5 14,-5" fill="none" stroke="var(--ink)" stroke-width="2" opacity=".2" stroke-linecap="round"/></g>`);
        }
        const board = F.h(`<div class="sketch pop-in" style="padding:10px;margin:6px 0 10px;background:var(--card);box-shadow:var(--shadow);transform:rotate(-0.4deg)"><svg class="gf-board" viewBox="0 0 ${G * cs} ${G * cs}" style="display:block;width:100%;max-width:300px;margin:0 auto;height:auto" aria-hidden="true">${cells.join('')}</svg></div>`);
        const prompt = F.h(`<div style="text-align:center;font-size:22px;margin:0 0 8px">${t({ de: 'Welcher Stein passt in die Lücke?', en: 'Which stone fits the gap?' })}</div>`);
        const opts = F.h('<div class="options" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:10px"></div>');
        ctx.el.append(board, prompt, opts);
        let done = false, wr = 0;
        d.opts.forEach((o) => {
          const b = F.h(`<button class="opt" style="min-width:0;min-height:96px;padding:6px">${pieceSVG(o.cells, 20, 'var(--c-spatial)')}</button>`);
          b.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (done || b.disabled) return;
            pop(b);
            if (o.k === d.target) {
              done = true; right++; points += 12 + (wr === 0 ? 4 : 0); ctx.setScore(points); ctx.sfx('good');
              b.classList.add('right');
              board.querySelectorAll('.gf-h').forEach((h) => { h.style.fill = 'var(--accent)'; h.style.strokeDasharray = 'none'; h.classList.add('pop-in'); });
              F.cheer(wr === 0 ? 5 : 2);
              ctx.wait(900).then(next);
            } else {
              wr++; wrongs++; ctx.sfx('bad'); b.disabled = true; b.classList.add('wrong');
              b.classList.remove('flash-bad'); void b.offsetWidth; b.classList.add('flash-bad');
              if (wr >= 2) {
                done = true;
                [...opts.children].forEach((c, i) => { if (d.opts[i].k === d.target) c.classList.add('right'); });
                ctx.wait(1500).then(next);
              }
            }
          });
          opts.appendChild(b);
        });
      }
      function end() {
        ctx.finish({
          score: points,
          detail: F.tt({ de: `${right} von ${N} Lücken gefüllt, ${wrongs} falsche Tipps`, en: `${right} of ${N} gaps filled, ${wrongs} wrong taps` }),
          levelDelta: right >= 7 ? 1 : right <= 3 ? -1 : 0,
          quality: right / N, ink: 4 + Math.round(points / 8),
        });
      }
      next();
    },
  });
})();
