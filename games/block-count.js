/* Block Count: how many cubes are in the stack? Stacks rise toward the back, so every column top is visible. */
(function () {
  const F = Funkloch;
  const SIZES = [[2, 2, 3], [3, 2, 3], [3, 3, 3], [3, 3, 4], [4, 3, 4], [4, 4, 4], [4, 4, 5]];

  function makeStack(r, level) {
    const [W, D, H] = SIZES[Math.min(SIZES.length - 1, level - 1)];
    while (true) {
      const h = [];
      for (let x = 0; x < W; x++) {
        h.push([]);
        for (let y = 0; y < D; y++) {
          const cap = Math.min(H, x > 0 ? h[x - 1][y] : H, y > 0 ? h[x][y - 1] : H);
          h[x].push(x === 0 && y === 0 ? r.int(Math.max(1, H - 1), H) : r.int(Math.max(0, cap - 2), cap));
        }
      }
      const total = h.flat().reduce((a, b) => a + b, 0);
      if (total >= W * D) return { h, total };
    }
  }

  function stackSVG(h) {
    const s = 26, cw = s * 0.866, ch = s * 0.5;
    const P = (x, y, z) => [(x - y) * cw, (x + y) * ch - z * s];
    const cubes = [];
    h.forEach((col, x) => col.forEach((n, y) => { for (let z = 0; z < n; z++) cubes.push([x, y, z]); }));
    cubes.sort((a, b) => a[0] + a[1] - (b[0] + b[1]) || a[2] - b[2]);
    const pts = (arr) => arr.map((p) => p.map((v) => v.toFixed(1)).join(',')).join(' ');
    let minX = 1e9, minY = 1e9, maxX = -1e9, maxY = -1e9, body = '';
    cubes.forEach(([x, y, z]) => {
      const top = [P(x, y, z + 1), P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x, y + 1, z + 1)];
      const right = [P(x + 1, y, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x + 1, y, z)];
      const left = [P(x, y + 1, z + 1), P(x + 1, y + 1, z + 1), P(x + 1, y + 1, z), P(x, y + 1, z)];
      [top, right, left].flat().forEach(([px, py]) => { minX = Math.min(minX, px); maxX = Math.max(maxX, px); minY = Math.min(minY, py); maxY = Math.max(maxY, py); });
      body += `<polygon points="${pts(top)}" fill="#D9F2E2"/><polygon points="${pts(right)}" fill="#9FD8B4"/><polygon points="${pts(left)}" fill="#7CC497"/>`;
      body += `<g fill="none" stroke="#2B2522" stroke-width="1.8" stroke-linejoin="round"><polygon points="${pts(top)}"/><polygon points="${pts(right)}"/><polygon points="${pts(left)}"/></g>`;
    });
    const pad = 6;
    return `<svg viewBox="${minX - pad} ${minY - pad} ${maxX - minX + 2 * pad} ${maxY - minY + 2 * pad}" style="width:100%;max-height:260px;display:block">${body}</svg>`;
  }

  F.registerGame({
    id: 'block-count', skill: 'spatial', glyph: '3D',
    name: { de: 'Würfel zählen', en: 'Block Count' },
    desc: {
      de: 'Wie viele Würfel sind im Stapel? Würfel schweben nie: unter jedem Würfel liegt ein anderer, auch wenn du ihn nicht siehst. 8 Runden, schnell = mehr Punkte.',
      en: 'How many cubes are in the stack? Cubes never float: there is always a cube underneath, even if you can’t see it. 8 rounds, faster = more points.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 8;
      let round = 0, correct = 0, points = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const st = ctx.fresh(() => makeStack(r, ctx.level), (x) => x.h.flat().join(''));
        const seen = new Set([st.total]), opts = [st.total];
        r.shuffle([-2, -1, 1, 2, 3, -3]).forEach((d) => { const v = st.total + d; if (opts.length < 4 && v > 0 && !seen.has(v)) { seen.add(v); opts.push(v); } });
        const sh = r.shuffle(opts), ci = sh.indexOf(st.total);
        ctx.el.innerHTML = '';
        ctx.el.appendChild(F.h(`<div class="card sketch pop-in" style="margin-bottom:14px;background:var(--paper)">${stackSVG(st.h)}</div>`));
        const start = performance.now();
        ctx.el.appendChild(F.options(sh.map(String), async (i, b, wrap) => {
          const ok = i === ci, secs = (performance.now() - start) / 1000;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) wrap.children[ci].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          if (ok) { correct++; points += Math.max(3, Math.round(12 - secs)); }
          await ctx.wait(ok ? 600 : 1500);
          next();
        }));
      }
      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${correct}/${ROUNDS} richtig`, en: `${correct}/${ROUNDS} right` }),
          levelDelta: correct >= 7 ? 1 : correct <= 4 ? -1 : 0,
          quality: correct / ROUNDS, ink: 3 + correct * 2,
        });
      }
      next();
    },
  });
})();
