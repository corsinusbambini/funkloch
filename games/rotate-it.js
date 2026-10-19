/* Rotate It: which shape is the original, only turned? The others are mirror images. */
(function () {
  const F = Funkloch;
  const norm = (cells) => {
    const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1]));
    return cells.map((c) => [c[0] - mx, c[1] - my]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  };
  const key = (cells) => norm(cells).map((c) => c.join(',')).join('|');
  const rot = (cells) => norm(cells.map(([x, y]) => [y, -x]));
  const mirror = (cells) => norm(cells.map(([x, y]) => [-x, y]));
  const rotN = (cells, n) => { let c = cells; for (let i = 0; i < n; i++) c = rot(c); return c; };
  const allRots = (cells) => [0, 1, 2, 3].map((n) => key(rotN(cells, n)));

  function makeShape(r, size) {
    while (true) {
      const set = new Map([['0,0', [0, 0]]]);
      while (set.size < size) {
        const base = r.pick([...set.values()]);
        const [dx, dy] = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
        const c = [base[0] + dx, base[1] + dy];
        set.set(c.join(','), c);
      }
      const cells = norm([...set.values()]);
      // must be chiral, otherwise the mirror image is also a valid rotation
      if (!allRots(cells).includes(key(mirror(cells)))) return cells;
    }
  }
  function shapeSVG(cells, tilt = 0) {
    const w = Math.max(...cells.map((c) => c[0])) + 1, h = Math.max(...cells.map((c) => c[1])) + 1;
    const s = 80 / Math.max(w, h, 3), ox = 50 - (w * s) / 2, oy = 50 - (h * s) / 2;
    return `<svg viewBox="0 0 100 100" style="color:var(--ink)"><g transform="rotate(${tilt} 50 50)">${cells.map(([x, y]) =>
      `<rect x="${ox + x * s + 1}" y="${oy + y * s + 1}" width="${s - 2}" height="${s - 2}" rx="3" fill="var(--c-spatial)" stroke="currentColor" stroke-width="2"/>`).join('')}</g></svg>`;
  }

  F.registerGame({
    id: 'rotate-it', skill: 'spatial', glyph: '⟲',
    name: { de: 'Dreh es!', en: 'Rotate It' },
    desc: {
      de: 'Oben siehst du eine Form. Unten ist sie einmal nur gedreht, die anderen sind gespiegelt. Finde die gedrehte, so schnell du kannst. 10 Runden.',
      en: 'A shape is shown on top. Below, one copy is only rotated, the others are mirrored. Find the rotated one as fast as you can. 10 rounds.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 10;
      let round = 0, correct = 0, points = 0;
      const size = Math.min(8, 4 + Math.ceil(ctx.level / 2));
      const t0 = performance.now();
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const shape = ctx.fresh(() => makeShape(r, size), key);
        const answer = rotN(shape, r.int(1, 3));
        const m = mirror(shape);
        const wrongs = [], seen = new Set([key(answer)]);
        r.shuffle([0, 1, 2, 3]).forEach((n) => { const w = rotN(m, n), k = key(w); if (!seen.has(k) && wrongs.length < 3) { seen.add(k); wrongs.push(w); } });
        while (wrongs.length < 3) { const w = makeShape(r, size), k = key(w); if (!seen.has(k) && !allRots(shape).includes(k)) { seen.add(k); wrongs.push(w); } }
        const opts = r.shuffle([answer].concat(wrongs));
        const ci = opts.indexOf(answer);
        const tilt = ctx.level >= 4 ? () => r.pick([0, 15, -15, 30, -30]) : () => 0;
        ctx.el.innerHTML = '';
        const target = F.h(`<div class="card sketch" style="width:150px;margin:0 auto 16px">${shapeSVG(shape)}</div>`);
        const start = performance.now();
        const optEl = F.options(opts.map((o) => F.h(`<div class="opt-svg" style="width:100%">${shapeSVG(o, tilt())}</div>`)), async (i, b, wrap) => {
          const ok = i === ci, secs = (performance.now() - start) / 1000;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) wrap.children[ci].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          if (ok) { correct++; points += Math.max(2, Math.round(12 - secs * 1.5)); }
          await ctx.wait(ok ? 450 : 1300);
          next();
        });
        ctx.el.append(target, optEl);
      }
      function end() {
        const secs = Math.round((performance.now() - t0) / 1000);
        ctx.finish({
          score: points, detail: F.tt({ de: `${correct}/${ROUNDS} richtig · ${secs} s`, en: `${correct}/${ROUNDS} right · ${secs} s` }),
          levelDelta: correct >= 9 ? 1 : correct <= 5 ? -1 : 0,
          quality: correct / ROUNDS, ink: 3 + correct * 2,
        });
      }
      next();
    },
  });
})();
