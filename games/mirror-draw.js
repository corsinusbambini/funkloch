/* Mirror Draw: half of a pattern is given. Tap cells to draw the other half as a mirror image (or turned upside down). */
(function () {
  const F = Funkloch;
  const N = 6, ROUNDS = 6;

  const KINDS = {
    lr: { de: 'Spiegele das Muster nach rechts.', en: 'Mirror the pattern to the right.', src: (r, c) => [r, N - 1 - c], given: (r, c) => c < N / 2 },
    tb: { de: 'Spiegele das Muster nach unten.', en: 'Mirror the pattern downwards.', src: (r, c) => [N - 1 - r, c], given: (r, c) => r < N / 2 },
    rot: { de: 'Drehe das Muster auf den Kopf (180°).', en: 'Turn the pattern upside down (180°).', src: (r, c) => [N - 1 - r, N - 1 - c], given: (r, c) => r < N / 2 },
  };

  F.registerGame({
    id: 'mirror-draw', skill: 'spatial', added: '2026-11-14', glyph: '🪞',
    name: { de: 'Spiegelbild', en: 'Mirror Draw' },
    desc: {
      de: 'Eine Hälfte des Musters ist schon gemalt. Tippe Felder an, um die andere Hälfte als Spiegelbild zu malen (oder das Muster auf den Kopf gestellt). Drücke dann auf «Fertig». Gewonnen hast du, wenn möglichst viele der 6 Bilder ohne Fehler sind.',
      en: 'One half of a pattern is already drawn. Tap cells to paint the other half as a mirror image (or the pattern turned upside down), then press “Done”. You win by getting as many of the 6 pictures as possible without a single mistake.',
    },
    start(ctx) {
      const r = ctx.rng, level = Math.max(0, ctx.level || 0);
      let round = 0, perfect = 0, totalErr = 0, over = false, locked = false;
      ctx.onCleanup(() => { over = true; });
      const kinds = level < 2 ? ['lr'] : level < 4 ? ['lr', 'tb'] : ['lr', 'tb', 'rot'];
      const dens = Math.min(0.62, 0.36 + level * 0.03);

      ctx.el.innerHTML = '';
      const head = F.h(`<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin-top:6px;min-height:64px"><svg viewBox="0 0 50 60" width="44" height="52" style="flex:none;transform:rotate(-10deg)"><ellipse cx="25" cy="21" rx="19" ry="18" style="fill:var(--card);stroke:var(--ink)" stroke-width="3"/><path d="M12,14 q5,-8 14,-8" style="fill:none;stroke:var(--accent)" stroke-width="3.5" stroke-linecap="round"/><path d="M22,39 L20,56 q5,3 10,0 L28,39" style="fill:var(--c-spatial);stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/></svg><div class="md-kind" style="font-size:21px;line-height:1.2;text-align:left;flex:0 1 270px"></div></div>`);
      const wrap = F.h('<div class="sketch" style="position:relative;padding:10px;margin:4px 0 0;background:var(--card);box-shadow:var(--shadow);transform:rotate(0.4deg)"></div>');
      const grid = F.h(`<div style="display:grid;grid-template-columns:repeat(${N},minmax(0,1fr));gap:4px;position:relative"></div>`);
      const axis = F.h('<svg viewBox="0 0 100 100" preserveAspectRatio="none" style="position:absolute;left:10px;top:10px;right:10px;bottom:10px;width:calc(100% - 20px);height:calc(100% - 20px);pointer-events:none;overflow:visible"></svg>');
      wrap.append(grid, axis);
      const row = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:20px"></div>');
      const reset = F.h(`<button class="btn big" style="min-height:72px">${F.esc(F.tt({ de: 'Leeren', en: 'Clear' }))}</button>`);
      const done = F.h(`<button class="btn primary big" style="min-height:72px">${F.esc(F.tt({ de: 'Fertig', en: 'Done' }))}</button>`);
      row.append(reset, done);
      ctx.el.append(head, wrap, row);
      const kindEl = head.querySelector('.md-kind');

      let pat, kind, mine, cells;
      function paint(i) {
        const c = cells[i], r0 = Math.floor(i / N), c0 = i % N;
        const g = kind.given(r0, c0);
        const on = g ? pat[i] : mine[i];
        c.style.background = on ? 'var(--c-spatial)' : g ? 'var(--paper-2)' : 'var(--card)';
        c.style.borderStyle = g ? 'solid' : 'dashed';
        c.innerHTML = on ? '<svg viewBox="0 0 40 40" style="width:70%;height:70%;display:block"><path d="M8,26 q2,-14 14,-16 q10,2 10,14 q-6,8 -16,6 q-6,-1 -8,-4 Z" style="fill:var(--card);opacity:.55"/><path d="M12,12 q6,-5 14,-2" style="fill:none;stroke:var(--ink);opacity:.55" stroke-width="2.2" stroke-linecap="round"/></svg>' : '';
      }
      function setup() {
        const key = kinds[r.int(0, kinds.length - 1)];
        kind = KINDS[key];
        const nGiven = (N * N) / 2;
        // Generate the given half: roughly `dens` of the cells filled, never empty.
        pat = new Array(N * N).fill(false); mine = new Array(N * N).fill(false);
        let filled = 0;
        for (let i = 0; i < N * N; i++) if (kind.given(Math.floor(i / N), i % N) && r() < dens) { pat[i] = true; filled++; }
        for (let i = 0, g = 0; filled < 5 && i < 200; i++) { const k = r.int(0, N * N - 1); if (kind.given(Math.floor(k / N), k % N) && !pat[k]) { pat[k] = true; filled++; } g++; }
        // Fill the target half from the mirror rule.
        for (let i = 0; i < N * N; i++) {
          const rr = Math.floor(i / N), cc = i % N;
          if (!kind.given(rr, cc)) { const [sr, sc] = kind.src(rr, cc); pat[i] = pat[sr * N + sc]; }
        }
        grid.innerHTML = '';
        cells = pat.map((_, i) => {
          const c = F.h('<button style="aspect-ratio:1/1.12;min-width:0;padding:0;min-height:48px;border:2.5px solid var(--ink);border-radius:9px 12px 8px 11px;display:flex;align-items:center;justify-content:center;cursor:pointer"></button>');
          const rr = Math.floor(i / N), cc = i % N;
          if (!kind.given(rr, cc)) c.onclick = () => tap(i);
          else c.style.cursor = 'default';
          grid.appendChild(c);
          return c;
        });
        cells.forEach((_, i) => paint(i));
        kindEl.textContent = F.tt(kind);
        // Axis drawing: dashed mirror line, or a turning arrow for the 180° kind.
        const acc = 'style="fill:none;stroke:var(--accent)"';
        axis.innerHTML = key === 'lr' ? `<path d="M50,-2 L50,102" ${acc} stroke-width="1.6" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>`
          : key === 'tb' ? `<path d="M-2,50 L102,50" ${acc} stroke-width="1.6" stroke-dasharray="5 3" vector-effect="non-scaling-stroke"/>`
            : '<g style="fill:var(--accent);stroke:var(--ink)"><circle cx="50" cy="50" r="5"/></g>';
        axis.style.opacity = '.95';
        ctx.setInfo(F.esc(F.tt({ de: `Bild ${round + 1} von ${ROUNDS}`, en: `Picture ${round + 1} of ${ROUNDS}` })));
        wrap.classList.remove('pop-in'); void wrap.offsetWidth; wrap.classList.add('pop-in');
      }
      function tap(i) {
        if (over || locked) return;
        mine[i] = !mine[i]; ctx.sfx('tick'); paint(i);
        cells[i].classList.remove('tap-pop'); void cells[i].offsetWidth; cells[i].classList.add('tap-pop');
      }
      reset.onclick = () => {
        if (over || locked) return;
        mine.fill(false); cells.forEach((_, i) => paint(i));
      };
      done.onclick = async () => {
        if (over || locked) return;
        locked = true;
        let err = 0;
        cells.forEach((c, i) => {
          if (kind.given(Math.floor(i / N), i % N)) return;
          if (mine[i] !== pat[i]) {
            err++;
            c.classList.add('flash-bad');
            if (!mine[i]) { c.style.background = 'var(--c-spatial)'; c.style.opacity = '.45'; c.style.borderColor = 'var(--bad)'; }
            else c.style.borderColor = 'var(--bad)';
          } else if (mine[i]) c.classList.add('flash-ok');
        });
        totalErr += err;
        if (!err) { perfect++; ctx.sfx('good'); F.cheer(5); } else ctx.sfx('bad');
        ctx.setScore(perfect * 10);
        kindEl.textContent = err ? F.tt({ de: `${err} Fehler – so wäre es richtig.`, en: `${err} mistake${err > 1 ? 's' : ''} – this is how it should look.` }) : F.tt({ de: 'Perfekt!', en: 'Perfect!' });
        await ctx.wait(err ? 1700 : 900);
        if (over) return;
        round++;
        if (round >= ROUNDS) return end();
        locked = false; setup();
      };

      function end() {
        over = true;
        const win = perfect >= 4;
        ctx.sfx(win ? 'win' : 'bad');
        ctx.finish({
          score: perfect * 10 + Math.max(0, 12 - totalErr),
          detail: F.tt({ de: `${perfect} von ${ROUNDS} Bildern fehlerfrei, ${totalErr} Fehler`, en: `${perfect} of ${ROUNDS} pictures without mistakes, ${totalErr} mistakes` }),
          levelDelta: perfect >= 5 ? 1 : perfect <= 1 ? -1 : 0,
          quality: perfect / ROUNDS, ink: 3 + perfect * 2,
        });
      }
      setup();
    },
  });
})();
