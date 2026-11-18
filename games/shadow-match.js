/* Shadow Match (spatial): a coloured block shape is shown. Which of the four shadows is the same shape, just turned?
   Wrong shadows are mirrored or have one block moved. */
(function () {
  const F = Funkloch;
  const ROUNDS = 10;

  const norm = (cells) => {
    const mx = Math.min(...cells.map((c) => c[0])), my = Math.min(...cells.map((c) => c[1]));
    return cells.map((c) => [c[0] - mx, c[1] - my]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  };
  const key = (cells) => norm(cells).map((c) => c.join(',')).join(';');
  const rot = (cells) => norm(cells.map(([x, y]) => [-y, x]));
  const mirror = (cells) => norm(cells.map(([x, y]) => [-x, y]));
  const rots = (cells) => { const out = [norm(cells)]; for (let i = 0; i < 3; i++) out.push(rot(out[i])); return out; };
  const canon = (cells) => rots(cells).map(key).sort()[0];
  const connected = (cells) => {
    const set = new Set(cells.map((c) => c.join(','))), seen = new Set([cells[0].join(',')]), st = [cells[0]];
    while (st.length) { const [x, y] = st.pop(); [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dy]) => { const k = `${x + dx},${y + dy}`; if (set.has(k) && !seen.has(k)) { seen.add(k); st.push([x + dx, y + dy]); } }); }
    return seen.size === cells.length;
  };
  function randomShape(r, k) {
    const cells = [[0, 0]], has = (x, y) => cells.some((c) => c[0] === x && c[1] === y);
    for (let tries = 0; cells.length < k && tries < 200; tries++) {
      const [x, y] = r.pick(cells), [dx, dy] = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      if (!has(x + dx, y + dy)) cells.push([x + dx, y + dy]);
    }
    return norm(cells);
  }
  // one block taken off and put on somewhere else, still in one piece
  function tweak(r, cells) {
    for (let tries = 0; tries < 60; tries++) {
      const i = Math.floor(r() * cells.length);
      const rest = cells.filter((_, j) => j !== i);
      if (!connected(rest)) continue;
      const [x, y] = r.pick(rest), [dx, dy] = r.pick([[1, 0], [-1, 0], [0, 1], [0, -1]]);
      if (rest.some((c) => c[0] === x + dx && c[1] === y + dy) || (x + dx === cells[i][0] && y + dy === cells[i][1])) continue;
      return norm(rest.concat([[x + dx, y + dy]]));
    }
    return null;
  }
  function makeQuestion(r, k) {
    for (let tries = 0; tries < 60; tries++) {
      const base = randomShape(r, k);
      const w = Math.max(...base.map((c) => c[0])) + 1, h = Math.max(...base.map((c) => c[1])) + 1;
      if (w > 4 || h > 4 || (w < 3 && h < 3)) continue;
      const ca = canon(base), used = new Set([ca]), wrong = [];
      const mir = mirror(base);
      if (!used.has(canon(mir))) { used.add(canon(mir)); wrong.push(mir); }
      for (let t = 0; t < 30 && wrong.length < 3; t++) {
        const tw = tweak(r, r.pick([base, mir]));
        if (tw && !used.has(canon(tw))) { used.add(canon(tw)); wrong.push(tw); }
      }
      if (wrong.length < 3) continue;
      const turn = (s, avoid) => { const o = rots(s); let n = Math.floor(r() * 4); if (avoid && n === 0) n = 1 + Math.floor(r() * 3); return o[n]; };
      const shown = base;
      const opts = r.shuffle([{ cells: turn(base, true), ok: true }].concat(wrong.map((s) => ({ cells: turn(s, false), ok: false }))));
      return { shown, opts, ci: opts.findIndex((o) => o.ok), id: ca };
    }
    return null;
  }
  function draw(cells, style, size, i) {
    const w = Math.max(...cells.map((c) => c[0])) + 1, h = Math.max(...cells.map((c) => c[1])) + 1, S = 24;
    const box = 4 * S + 8;
    const ox = (box - w * S) / 2, oy = (box - h * S) / 2;
    const sq = cells.map(([x, y], j) => { const jj = ((x * 3 + y * 5 + j + i) % 3 - 1) * 0.7; return `<path d="M${ox + x * S + 1 + jj},${oy + y * S + 1} L${ox + x * S + S - 1},${oy + y * S + 1 - jj} L${ox + x * S + S - 1 + jj},${oy + y * S + S - 1} L${ox + x * S + 1},${oy + y * S + S - 1 + jj} Z" style="${style}" stroke-width="2.4" stroke-linejoin="round"/>`; }).join('');
    return `<svg viewBox="0 0 ${box} ${box}" width="${size}" height="${size}" style="display:block;margin:0 auto" aria-hidden="true">${sq}</svg>`;
  }

  F.registerGame({
    id: 'shadow-match', skill: 'spatial', added: '2026-11-18', glyph: '◧◨',
    name: { de: 'Schattenspiel', en: 'Shadow Match' },
    desc: {
      de: 'Oben siehst du eine farbige Figur aus Klötzchen. Welcher der vier Schatten ist dieselbe Figur, nur gedreht? Falsche Schatten sind gespiegelt oder haben ein verschobenes Klötzchen. 10 Fragen, gewinne mit möglichst vielen Treffern.',
      en: 'On top you see a coloured shape made of blocks. Which of the four shadows is the same shape, just turned? Wrong shadows are mirrored or have one block moved. 10 questions, win with as many hits as you can.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = ctx.level || 0;
      const k = lvl <= 1 ? 5 : lvl <= 4 ? 6 : 7;
      let round = 0, correct = 0, points = 0, streak = 0;
      const hist = [];
      const dotHTML = () => Array.from({ length: ROUNDS }, (_, i) => `<svg width="26" height="26" viewBox="-13 -13 26 26" aria-hidden="true"><circle r="9.5" style="fill:${i < hist.length ? (hist[i] ? 'var(--good)' : 'var(--bad)') : 'var(--card)'};stroke:var(--ink)" stroke-width="2.4"/>${i === hist.length ? '<circle r="4" style="fill:var(--accent)"/>' : ''}</svg>`).join('');

      function next() {
        if (round >= ROUNDS) return end();
        const q = ctx.fresh(() => makeQuestion(r, k) || makeQuestion(r, 5), (x) => x.id, 6);
        round++;
        ctx.setScore(points); ctx.setInfo(`${round} / ${ROUNDS}`);
        ctx.el.innerHTML = '';
        const card = F.h(`<div class="card sketch pop-in" style="padding:10px 10px 8px;margin:6px 0 12px;transform:rotate(-0.5deg);text-align:center"></div>`);
        card.appendChild(F.h(`<div style="font-size:21px;margin-bottom:2px">${F.esc(F.tt({ de: 'Welcher Schatten passt?', en: 'Which shadow fits?' }))}</div>`));
        card.appendChild(F.h(draw(q.shown, 'fill:var(--c-spatial);stroke:var(--ink)', 150, round)));
        ctx.el.appendChild(card);
        let answered = false;
        const labels = q.opts.map((o, i) => F.h(draw(o.cells, 'fill:var(--ink);stroke:var(--ink)', 110, i + round)));
        const wrap = F.options(labels, async (i, b, w) => {
          if (answered) return;
          answered = true;
          const ok = i === q.ci;
          hist.push(ok); dots.innerHTML = dotHTML();
          b.classList.add(ok ? 'right' : 'wrong', ok ? 'tap-pop' : 'flash-bad');
          w.children[q.ci].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          if (ok) { correct++; streak++; points += 8 + Math.min(streak, 5) * 2; if (round < ROUNDS) F.cheer(6); } else streak = 0;
          ctx.setScore(points);
          await ctx.wait(ok ? 800 : 1600);
          next();
        });
        wrap.classList.add('tall');
        wrap.querySelectorAll('.opt').forEach((b) => b.classList.add('opt-svg'));
        ctx.el.appendChild(wrap);
        const dots = F.h(`<div style="display:flex;justify-content:center;gap:8px;margin:16px 0 4px">${dotHTML()}</div>`);
        ctx.el.appendChild(dots);
      }
      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${correct}/${ROUNDS} richtig`, en: `${correct}/${ROUNDS} right` }),
          levelDelta: correct >= 9 ? 1 : correct <= 4 ? -1 : 0,
          quality: correct / ROUNDS, ink: 3 + correct * 2,
        });
      }
      next();
    },
  });
})();
