/* Periodic Puzzle (chemistry): a cut-out of the periodic table with one hole, which element belongs in the hole?
   Plus questions about element families. Uses the element list of Element Duel (F.ELEMENTS). */
(function () {
  const F = Funkloch;
  const ROUNDS = 10;
  const FAM = { noble: 'var(--c-focus)', alkali: 'var(--c-fun)', alkaline: 'var(--c-duo)', halogen: 'var(--c-chem)', transition: 'var(--c-math)', metalloid: 'var(--c-spatial)', post: 'var(--c-logic)', nonmetal: 'var(--c-memory)' };
  const FAM_NAME = {
    noble: { de: 'ein Edelgas', en: 'a noble gas' }, alkali: { de: 'ein Alkalimetall', en: 'an alkali metal' },
    alkaline: { de: 'ein Erdalkalimetall', en: 'an alkaline earth metal' }, halogen: { de: 'ein Halogen', en: 'a halogen' },
  };
  // period (1-5) and group (1-18) of an atomic number up to 54
  function pos(z) {
    if (z <= 2) return [1, z === 1 ? 1 : 18];
    if (z <= 10) return [2, z <= 4 ? z - 2 : z + 8];
    if (z <= 18) return [3, z <= 12 ? z - 10 : z];
    if (z <= 36) return [4, z - 18];
    return [5, z - 36];
  }
  const zAt = (p, g) => {
    for (let z = 1; z <= 54; z++) { const q = pos(z); if (q[0] === p && q[1] === g) return z; }
    return 0;
  };

  F.registerGame({
    id: 'periodic-puzzle', skill: 'chem', added: '2026-11-18', glyph: '▦Z',
    name: { de: 'Periodensystem-Puzzle', en: 'Periodic Puzzle' },
    desc: {
      de: 'Ein Ausschnitt aus dem Periodensystem hat ein Loch (?). Welches Element gehört dorthin? Dazu kommen Fragen zu Elementfamilien wie Edelgase oder Halogene. 10 Fragen, du gewinnst mit möglichst vielen richtigen.',
      en: 'A cut-out of the periodic table has a hole (?). Which element belongs there? Plus questions about element families like noble gases or halogens. 10 questions, win by getting as many right as you can.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = ctx.level || 0;
      const EL = F.ELEMENTS.filter((e) => e.z <= 54);
      const byZ = {}; EL.forEach((e) => { byZ[e.z] = e; });
      const maxZ = lvl <= 1 ? 18 : lvl <= 3 ? 36 : 54;
      const pool = EL.filter((e) => e.z <= maxZ);
      let round = 0, correct = 0, points = 0, streak = 0;
      const hist = [];
      const nm = (e) => F.tt({ de: e.de, en: e.en });

      function tableQ(tries = 0) {
        const e = r.pick(pool.filter((x) => x.z > 2));
        const [p, g] = pos(e.z);
        let g0 = Math.max(1, Math.min(14, g - 2)), p0 = Math.max(2, Math.min(3, p - 1));
        if (p0 + 2 < p) p0 = p - 2;
        const cells = [];
        for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 5; dx++) {
          const z = zAt(p0 + dy, g0 + dx);
          cells.push({ z, target: z === e.z });
        }
        const shown = cells.filter((c) => c.z && !c.target).length;
        if (shown < (tries < 12 ? 7 : 4)) return tableQ(tries + 1);
        const near = pool.filter((o) => o.z !== e.z && !cells.some((c) => c.z === o.z) && Math.abs(o.z - e.z) <= 9);
        const wrong = r.shuffle(near).slice(0, 3);
        if (wrong.length < 3) return tableQ(tries + 1);
        const opts = r.shuffle([e].concat(wrong));
        return { kind: 'table', cells, p0, g0, labels: opts.map((o) => o.sym), ci: opts.indexOf(e), el: e };
      }
      function famQ() {
        const g = r.pick(Object.keys(FAM_NAME));
        const right = r.pick(pool.filter((o) => o.grp === g && o.z > 2));
        if (!right) return tableQ();
        const base = r.pick(pool.filter((o) => o.grp === g && o !== right && o.z > 1)) || null;
        if (!base) return tableQ();
        const wrong = r.shuffle(pool.filter((o) => o.grp !== g && o.z > 1)).slice(0, 3);
        const opts = r.shuffle([right].concat(wrong));
        return { kind: 'fam', g, base, labels: opts.map((o) => `${o.sym} · ${nm(o)}`), ci: opts.indexOf(right), el: right };
      }
      const question = () => (round % 5 === 2 || round % 5 === 4 ? famQ() : tableQ());

      function drawTable(q) {
        const W = 62, H = 70;
        let s = `<svg class="motif" viewBox="0 0 330 236" style="display:block;width:100%;max-width:340px;height:auto;margin:0 auto;color:var(--ink)" aria-hidden="true"><g transform="translate(10,10)">`;
        q.cells.forEach((c, i) => {
          const x = (i % 5) * W, y = ((i / 5) | 0) * (H + 6), j = ((i * 7) % 5 - 2) * 0.5;
          if (!c.z) { s += `<rect x="${x + 4}" y="${y + 4}" width="${W - 8}" height="${H - 8}" rx="8" fill="none" style="stroke:var(--ink-faint)" stroke-width="2" stroke-dasharray="4 5"/>`; return; }
          if (c.target) {
            s += `<g class="pp-hole"><path d="M${x + 3},${y + 3 + j} L${x + W - 3},${y + 3} L${x + W - 3 - j},${y + H - 3} L${x + 3},${y + H - 3} Z" style="fill:var(--card);stroke:var(--accent)" stroke-width="4" stroke-dasharray="7 5" stroke-linejoin="round"/><text x="${x + W / 2}" y="${y + H / 2 + 14}" text-anchor="middle" font-size="40" font-weight="700" style="fill:var(--accent)">?</text></g>`;
            return;
          }
          const e = byZ[c.z];
          s += `<path d="M${x + 3},${y + 3 + j} L${x + W - 3},${y + 3} L${x + W - 3 - j},${y + H - 3} L${x + 3},${y + H - 3} Z" style="fill:${FAM[e.grp] || 'var(--paper-2)'};stroke:var(--ink)" stroke-width="2.6" stroke-linejoin="round"/>
            <text x="${x + W / 2}" y="${y + H / 2 + 10}" text-anchor="middle" font-size="28" font-weight="700" style="fill:#2B2522">${e.sym}</text>`;
        });
        s += `</g></svg>`;
        return s;
      }

      function next() {
        if (round >= ROUNDS) return end();
        const q = ctx.fresh(question, (x) => x.kind + x.el.sym + (x.base ? x.base.sym : ''), 6);
        round++;
        ctx.setScore(points); ctx.setInfo(`${round} / ${ROUNDS}`);
        ctx.el.innerHTML = '';
        const prompt = q.kind === 'table'
          ? F.tt({ de: 'Welches Element gehört auf das ?', en: 'Which element goes on the ?' })
          : F.tt({ de: `${q.base.sym} ist ${FAM_NAME[q.g].de}. Welches andere Element gehört zur selben Familie?`, en: `${q.base.sym} is ${FAM_NAME[q.g].en}. Which other element is in the same family?` });
        const card = F.h(`<div class="card sketch pop-in" style="padding:14px 10px 12px;margin:8px 0 12px;transform:rotate(-0.5deg)"></div>`);
        card.appendChild(F.h(`<div style="font-size:22px;text-align:center;line-height:1.25;margin:0 0 8px;min-height:56px;display:flex;align-items:center;justify-content:center">${F.esc(prompt)}</div>`));
        if (q.kind === 'table') card.appendChild(F.h(drawTable(q)));
        else {
          const col = FAM[q.g];
          card.appendChild(F.h(`<svg class="motif" viewBox="0 0 300 190" style="display:block;width:100%;max-width:320px;height:auto;margin:0 auto" aria-hidden="true">
            <path d="M20,16 L282,12 L286,176 L16,182 Z" style="fill:${col};stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/>
            <circle cx="62" cy="38" r="6" style="fill:#fff" opacity=".6"/><circle cx="244" cy="110" r="9" style="fill:#fff" opacity=".4"/>
            <text x="150" y="116" text-anchor="middle" font-size="92" font-weight="700" style="fill:#2B2522">${q.base.sym}</text>
            <text x="150" y="156" text-anchor="middle" font-size="22" style="fill:#2B2522">${F.esc(nm(q.base))}</text></svg>`));
        }
        ctx.el.appendChild(card);
        let answered = false;
        const optEl = F.options(q.labels, async (i, b, wrap) => {
          if (answered) return;
          answered = true;
          const ok = i === q.ci;
          hist.push(ok);
          dots.innerHTML = dotHTML();
          b.classList.add(ok ? 'right' : 'wrong', ok ? 'tap-pop' : 'flash-bad');
          wrap.children[q.ci].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          if (ok) { correct++; streak++; points += 8 + Math.min(streak, 5) * 2; if (round < ROUNDS) F.cheer(6); } else streak = 0;
          if (q.kind === 'table') {
            const hole = card.querySelector('.pp-hole');
            if (hole) hole.innerHTML = `<rect x="3" y="3" width="56" height="64" rx="8" style="fill:var(--good);stroke:var(--ink)" stroke-width="3" transform="translate(${(q.cells.findIndex((c) => c.target) % 5) * 62},${((q.cells.findIndex((c) => c.target) / 5) | 0) * 76})"/><text x="${(q.cells.findIndex((c) => c.target) % 5) * 62 + 31}" y="${((q.cells.findIndex((c) => c.target) / 5) | 0) * 76 + 45}" text-anchor="middle" font-size="28" font-weight="700" style="fill:#2B2522">${q.el.sym}</text>`;
          }
          ctx.setScore(points);
          await ctx.wait(ok ? 800 : 1700);
          next();
        }, q.kind === 'table' ? 'tall' : 'tall');
        ctx.el.appendChild(optEl);
        dots = F.h('<div style="display:flex;justify-content:center;gap:8px;margin:18px 0 6px"></div>');
        dots.innerHTML = dotHTML();
        ctx.el.appendChild(dots);
      }
      let dots = null;
      const dotHTML = () => Array.from({ length: ROUNDS }, (_, k) => `<svg width="26" height="26" viewBox="-13 -13 26 26" aria-hidden="true"><circle r="9.5" style="fill:${k < hist.length ? (hist[k] ? 'var(--good)' : 'var(--bad)') : 'var(--card)'};stroke:var(--ink)" stroke-width="2.4"/>${k === hist.length ? '<circle r="4" style="fill:var(--accent)"/>' : ''}</svg>`).join('');
      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${correct}/${ROUNDS} richtig`, en: `${correct}/${ROUNDS} right` }),
          levelDelta: correct >= 9 ? 1 : correct <= 5 ? -1 : 0,
          quality: correct / ROUNDS, ink: 3 + correct * 2,
        });
      }
      next();
    },
  });
})();
