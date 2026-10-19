/* Fold & Punch: paper is folded, a hole is punched. Which pattern appears when unfolded? */
(function () {
  const F = Funkloch;
  const N = 4, O = 5, CS = 90 / N;
  const key = (cells) => cells.map((c) => c.join(',')).sort().join('|');
  const uniq = (cells) => { const m = {}; cells.forEach((c) => (m[c.join(',')] = c)); return Object.values(m); };
  const isH = (f) => f.d === 'L' || f.d === 'R';
  const reflect = (c, f) => (isH(f) ? [2 * f.mid - 1 - c[0], c[1]] : [c[0], 2 * f.mid - 1 - c[1]]);
  const reflectWrongAxis = (c, f) => (isH(f) ? [c[0], N - 1 - c[1]] : [N - 1 - c[0], c[1]]);

  function makePuzzle(r, level) {
    const reg = { x0: 0, x1: N, y0: 0, y1: N };
    const folds = [], regs = [Object.assign({}, reg)];
    const nf = level <= 2 ? 1 : level <= 5 ? 2 : 3;
    for (let i = 0; i < nf; i++) {
      const opts = [];
      if (reg.x1 - reg.x0 >= 2) opts.push('L', 'R');
      if (reg.y1 - reg.y0 >= 2) opts.push('T', 'B');
      const d = r.pick(opts), f = { d };
      if (isH(f)) { f.mid = (reg.x0 + reg.x1) / 2; if (d === 'L') reg.x0 = f.mid; else reg.x1 = f.mid; }
      else { f.mid = (reg.y0 + reg.y1) / 2; if (d === 'T') reg.y0 = f.mid; else reg.y1 = f.mid; }
      folds.push(f); regs.push(Object.assign({}, reg));
    }
    const cells = [];
    for (let x = reg.x0; x < reg.x1; x++) for (let y = reg.y0; y < reg.y1; y++) cells.push([x, y]);
    const np = level >= 4 && cells.length >= 2 ? 2 : 1;
    return { folds, regs, cells, punches: r.shuffle(cells).slice(0, np) };
  }
  function unfold(punches, folds, { skip = -1, wrongAxis = -1 } = {}) {
    let H = punches.map((c) => c.slice());
    for (let i = folds.length - 1; i >= 0; i--) {
      if (i === skip) continue;
      const fn = i === wrongAxis ? reflectWrongAxis : reflect;
      H = uniq(H.concat(H.map((c) => fn(c, folds[i]))));
    }
    return H.filter((c) => c[0] >= 0 && c[0] < N && c[1] >= 0 && c[1] < N);
  }

  const rectOf = (g) => `x="${O + g.x0 * CS}" y="${O + g.y0 * CS}" width="${(g.x1 - g.x0) * CS}" height="${(g.y1 - g.y0) * CS}"`;
  function stepSVG(reg, fold) {
    let s = `<svg viewBox="0 0 100 100" style="color:var(--ink)"><rect x="${O}" y="${O}" width="90" height="90" fill="none" stroke="var(--ink-faint)" stroke-dasharray="3 3" stroke-width="1.2"/>
      <rect ${rectOf(reg)} fill="var(--card)" stroke="currentColor" stroke-width="2"/>`;
    if (fold) {
      const midX = O + fold.mid * CS, midY = O + fold.mid * CS;
      const cy = O + ((reg.y0 + reg.y1) / 2) * CS, cx = O + ((reg.x0 + reg.x1) / 2) * CS;
      if (isH(fold)) {
        const q = ((reg.x1 - reg.x0) / 4) * CS;
        s += `<line x1="${midX}" y1="${O + reg.y0 * CS}" x2="${midX}" y2="${O + reg.y1 * CS}" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="5 3"/>`;
        const [a, b] = fold.d === 'L' ? [midX - q, midX + q] : [midX + q, midX - q];
        s += `<path d="M${a},${cy} Q${midX},${cy - 26} ${b},${cy}" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M${b},${cy} l${a < b ? -7 : 7},-6 M${b},${cy} l${a < b ? -2 : 2},-9" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`;
      } else {
        const q = ((reg.y1 - reg.y0) / 4) * CS;
        s += `<line x1="${O + reg.x0 * CS}" y1="${midY}" x2="${O + reg.x1 * CS}" y2="${midY}" stroke="var(--accent)" stroke-width="2.5" stroke-dasharray="5 3"/>`;
        const [a, b] = fold.d === 'T' ? [midY - q, midY + q] : [midY + q, midY - q];
        s += `<path d="M${cx},${a} Q${cx + 26},${midY} ${cx},${b}" fill="none" stroke="currentColor" stroke-width="2.5"/><path d="M${cx},${b} l6,${a < b ? -7 : 7} M${cx},${b} l9,${a < b ? -2 : 2}" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>`;
      }
    }
    return s + '</svg>';
  }
  const hole = (c) => `<circle cx="${O + (c[0] + 0.5) * CS}" cy="${O + (c[1] + 0.5) * CS}" r="${CS * 0.28}" fill="var(--paper)" stroke="currentColor" stroke-width="2"/>`;
  function punchedSVG(reg, punches) {
    return `<svg viewBox="0 0 100 100" style="color:var(--ink)"><rect x="${O}" y="${O}" width="90" height="90" fill="none" stroke="var(--ink-faint)" stroke-dasharray="3 3" stroke-width="1.2"/>
      <rect ${rectOf(reg)} fill="var(--card)" stroke="currentColor" stroke-width="2"/>${punches.map(hole).join('')}</svg>`;
  }
  function sheetSVG(holes) {
    let s = `<svg viewBox="0 0 100 100" style="color:var(--ink)"><rect x="${O}" y="${O}" width="90" height="90" fill="var(--card)" stroke="currentColor" stroke-width="2"/>`;
    for (let i = 1; i < N; i++) s += `<line x1="${O + i * CS}" y1="${O}" x2="${O + i * CS}" y2="${O + 90}" stroke="var(--ink-faint)" stroke-width="1"/><line x1="${O}" y1="${O + i * CS}" x2="${O + 90}" y2="${O + i * CS}" stroke="var(--ink-faint)" stroke-width="1"/>`;
    return s + holes.map(hole).join('') + '</svg>';
  }

  F.registerGame({
    id: 'fold-punch', skill: 'spatial', glyph: '✂',
    name: { de: 'Falten & Lochen', en: 'Fold & Punch' },
    desc: {
      de: 'Ein Blatt wird gefaltet (gestrichelte Linie, Pfeil) und dann gelocht. Wie sieht es aufgefaltet aus? 6 Rätsel.',
      en: 'A sheet is folded (dashed line, arrow), then a hole is punched. What does it look like unfolded? 6 puzzles.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 6;
      let round = 0, correct = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(correct);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const p = ctx.fresh(() => makePuzzle(r, ctx.level), (q) => q.folds.map((f) => f.d).join('') + key(q.punches));
        const answer = unfold(p.punches, p.folds);
        const ak = key(answer);
        const cands = [];
        p.folds.forEach((_, i) => { cands.push(unfold(p.punches, p.folds, { skip: i })); cands.push(unfold(p.punches, p.folds, { wrongAxis: i })); });
        p.cells.forEach((c) => { if (!p.punches.some((q) => q[0] === c[0] && q[1] === c[1])) cands.push(unfold([c].concat(p.punches.slice(1)), p.folds)); });
        cands.push(answer.map((c) => [N - 1 - c[0], c[1]]), answer.map((c) => [c[0], N - 1 - c[1]]));
        const seen = new Set([ak]), wrong = [];
        r.shuffle(cands).forEach((c) => { const k = key(c); if (c.length && !seen.has(k) && wrong.length < 3) { seen.add(k); wrong.push(c); } });
        while (wrong.length < 3) {
          const rnd = uniq(Array.from({ length: answer.length }, () => [r.int(0, N - 1), r.int(0, N - 1)]));
          const k = key(rnd); if (!seen.has(k)) { seen.add(k); wrong.push(rnd); }
        }
        const opts = r.shuffle([answer].concat(wrong));
        const correctIdx = opts.indexOf(answer);
        ctx.el.innerHTML = '';
        const steps = F.h(`<div class="card sketch" style="display:grid;grid-template-columns:repeat(${p.folds.length + 1},1fr);gap:6px;margin-bottom:14px"></div>`);
        p.folds.forEach((f, i) => steps.appendChild(F.h(`<div>${stepSVG(p.regs[i], f)}</div>`)));
        steps.appendChild(F.h(`<div>${punchedSVG(p.regs[p.folds.length], p.punches)}</div>`));
        const labels = opts.map((o) => F.h(`<div class="opt-svg" style="width:100%">${sheetSVG(o)}</div>`));
        const optEl = F.options(labels, async (i, b, wrap) => {
          const ok = i === correctIdx;
          b.classList.add(ok ? 'right' : 'wrong');
          if (!ok) wrap.children[correctIdx].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          if (ok) correct++;
          await ctx.wait(ok ? 700 : 1600);
          next();
        });
        ctx.el.append(steps, optEl);
      }
      function end() {
        ctx.finish({
          score: correct, display: `${correct} / ${ROUNDS}`,
          levelDelta: correct >= 5 ? 1 : correct <= 2 ? -1 : 0,
          quality: correct / ROUNDS, ink: 4 + correct * 3,
        });
      }
      next();
    },
  });
})();
