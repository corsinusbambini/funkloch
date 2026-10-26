/* Simon Says: watch the pads light up, then repeat the pattern. It grows by one every round. */
(function () {
  const F = Funkloch;
  const PADS = [
    { c: '#E8685F', s: '▲' }, { c: '#4F94E0', s: '●' },
    { c: '#E9B93A', s: '■' }, { c: '#4FB874', s: '★' },
  ];

  F.registerGame({
    id: 'simon', skill: 'memory', added: '2026-10-26', glyph: '🔴',
    name: { de: 'Simon sagt', en: 'Simon Says' },
    desc: { de: 'Schau zu, wie die Felder nacheinander aufleuchten, und tippe sie in derselben Reihenfolge nach. Jede Runde kommt ein Feld dazu. Je länger deine Kette, desto mehr Punkte.', en: 'Watch the pads light up one by one, then tap them in the same order. Each round adds one more pad. The longer your chain, the more points.' },
    start(ctx) {
      const r = ctx.rng;
      const seq = [];
      const gap = Math.max(260, 520 - ctx.level * 14);
      let listening = false, pos = 0, over = false;
      ctx.el.innerHTML = '';
      const status = F.h('<div class="info-line" style="text-align:center;font-size:22px;min-height:30px"></div>');
      const board = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:340px;margin:14px auto;touch-action:manipulation"></div>');
      const pads = PADS.map((p, i) => {
        const b = F.h(`<button aria-label="${p.s}" style="aspect-ratio:1;min-width:0;padding:0;min-height:96px;border:3px solid var(--ink);border-radius:22px;background:${p.c};color:#2B2522;font-size:44px;cursor:pointer;box-shadow:var(--shadow);opacity:.55;transition:opacity .08s,transform .08s">${p.s}</button>`);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(i); });
        board.appendChild(b);
        return b;
      });
      ctx.el.appendChild(status);
      ctx.el.appendChild(board);

      async function flash(i, ms) {
        pads[i].style.opacity = '1'; pads[i].style.transform = 'scale(1.06)';
        ctx.sfx('tap');
        await ctx.wait(ms);
        pads[i].style.opacity = ''; pads[i].style.transform = '';
      }
      async function show() {
        listening = false; pos = 0;
        seq.push(r.int(0, 3));
        // avoid three identical pads in a row so every chain stays readable
        const n = seq.length;
        if (n >= 3 && seq[n - 1] === seq[n - 2] && seq[n - 2] === seq[n - 3]) seq[n - 1] = (seq[n - 1] + r.int(1, 3)) % 4;
        ctx.setScore(n - 1);
        status.textContent = F.tt({ de: 'Schau genau …', en: 'Watch closely …' });
        await ctx.wait(650);
        for (const i of seq) { await flash(i, gap); await ctx.wait(120); }
        status.textContent = F.tt({ de: 'Du bist dran!', en: 'Your turn!' });
        listening = true;
      }
      async function tap(i) {
        if (!listening || over) return;
        if (i !== seq[pos]) {
          over = true; listening = false;
          ctx.sfx('bad');
          pads[seq[pos]].style.outline = '4px dashed var(--ink)';
          status.textContent = F.tt({ de: 'Falsch!', en: 'Oops!' });
          await ctx.wait(1100);
          return end();
        }
        flash(i, 160);
        pos++;
        if (pos === seq.length) {
          listening = false; ctx.sfx('good');
          ctx.setScore(seq.length);
          await ctx.wait(700);
          show();
        }
      }
      function end() {
        const len = seq.length - 1;
        ctx.finish({
          score: len, detail: F.tt({ de: `Kette von ${len}`, en: `Chain of ${len}` }),
          levelDelta: len >= 9 ? 1 : len < 4 ? -1 : 0,
          quality: Math.min(1, len / 10), ink: 2 + len,
        });
      }
      show();
    },
  });
})();
