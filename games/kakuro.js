/* Cross Sums (Kakuro, classic number puzzle): fill the white cells with 1-9 so that every run of cells adds up to the
   number in its clue and no digit repeats inside a run. Puzzles are generated; any filling that obeys the clues wins. */
(function () {
  const F = Funkloch;
  const PUZZLES = 2;

  function makePuzzle(r, N) {
    // 1 = white, 0 = black. Row 0 and column 0 hold the clues.
    let w = new Array(N * N).fill(1);
    for (let i = 0; i < N; i++) { w[i] = 0; w[i * N] = 0; }
    for (let i = 0; i < N * N; i++) if (w[i] && r() < 0.1) w[i] = 0;
    for (let pass = 0; pass < 20; pass++) {
      let changed = false;
      for (const horiz of [true, false]) {
        for (let a = 0; a < N; a++) {
          let run = [];
          const flush = () => {
            if (run.length === 1 || run.length > 4) { w[run[run.length > 4 ? 4 : 0]] = 0; changed = true; }
            run = [];
          };
          for (let b = 0; b < N; b++) {
            const i = horiz ? a * N + b : b * N + a;
            if (w[i]) run.push(i); else flush();
          }
          flush();
        }
      }
      if (!changed) break;
    }
    const whites = []; for (let i = 0; i < N * N; i++) if (w[i]) whites.push(i);
    if (whites.length < (N === 5 ? 11 : 18)) return null;
    // runs
    const runs = [];
    for (const horiz of [true, false]) for (let a = 0; a < N; a++) {
      let run = [];
      const flush = () => { if (run.length >= 2) runs.push({ horiz, cells: run, start: horiz ? run[0] - 1 : run[0] - N }); run = []; };
      for (let b = 0; b < N; b++) { const i = horiz ? a * N + b : b * N + a; if (w[i]) run.push(i); else flush(); }
      flush();
    }
    if (whites.some((c) => runs.filter((q) => q.cells.includes(c)).length < 2)) return null;
    // fill with backtracking
    const val = new Array(N * N).fill(0);
    let steps = 0;
    const runsOf = (c) => runs.filter((q) => q.cells.includes(c));
    const place = (k) => {
      if (k === whites.length) return true;
      if (++steps > 4000) return false;
      const c = whites[k], rs = runsOf(c);
      for (const d of r.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
        if (rs.some((q) => q.cells.some((o) => val[o] === d))) continue;
        val[c] = d;
        if (place(k + 1)) return true;
        val[c] = 0;
      }
      return false;
    };
    if (!place(0)) return null;
    runs.forEach((q) => { q.sum = q.cells.reduce((s, c) => s + val[c], 0); });
    return { N, w, runs, whites, sol: val };
  }

  function evaluate(pz, cur) {
    const bad = new Set(); let complete = true;
    for (const q of pz.runs) {
      const vals = q.cells.map((c) => cur[c]);
      const seen = new Set();
      vals.forEach((v, k) => { if (v) { if (seen.has(v)) { bad.add(q.cells[k]); vals.forEach((u, j) => { if (u === v) bad.add(q.cells[j]); }); } seen.add(v); } });
      if (vals.every((v) => v)) { if (vals.reduce((a, b) => a + b, 0) !== q.sum) q.cells.forEach((c) => bad.add(c)); } else complete = false;
    }
    return { bad, ok: complete && bad.size === 0 };
  }

  F.registerGame({
    id: 'kakuro', skill: 'math', added: '2026-11-18', glyph: '▨Σ',
    name: { de: 'Kreuzsummen', en: 'Cross Sums' },
    desc: {
      de: 'Fülle die hellen Felder mit Ziffern von 1 bis 9. Die Zahl im dunklen Feld sagt, wie viel die Ziffern daneben (oder darunter) zusammen ergeben müssen. In einer Reihe darf keine Ziffer doppelt stehen. Löse 2 Rätsel.',
      en: 'Fill the empty cells with digits 1 to 9. The number in a dark cell tells what the digits next to it (or below it) must add up to. No digit may repeat inside a run. Solve 2 puzzles.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = ctx.level || 0;
      let round = 0, points = 0, solved = 0;
      const t0 = Date.now();
      const t = (o) => F.esc(F.tt(o));

      function next() {
        if (round >= PUZZLES) return end();
        round++;
        const N = lvl >= 3 && round === 2 ? 6 : 5;
        let pz = null;
        for (let tries = 0; tries < 60 && !pz; tries++) pz = makePuzzle(r, N);
        if (!pz) pz = makePuzzle(r, 5) || { N: 5, w: [], runs: [], whites: [], sol: [] };
        const pzN = pz.N;
        const cur = new Array(pzN * pzN).fill(0);
        let sel = pz.whites[0], done = false;
        ctx.setScore(points); ctx.setInfo(`${round} / ${PUZZLES}`);
        ctx.el.innerHTML = '';
        const card = F.h(`<div class="sketch pop-in" style="padding:10px;margin:6px 0 10px;background:var(--card);box-shadow:var(--shadow);transform:rotate(-0.4deg)"></div>`);
        const grid = F.h(`<div style="display:grid;grid-template-columns:repeat(${pzN},minmax(0,1fr));gap:4px"></div>`);
        card.appendChild(grid);
        const cells = [];
        const clueAt = (i) => {
          const across = pz.runs.find((q) => q.horiz && q.start === i), down = pz.runs.find((q) => !q.horiz && q.start === i);
          return { across, down };
        };
        for (let i = 0; i < pzN * pzN; i++) {
          let b;
          if (pz.w[i]) {
            b = F.h(`<button style="width:100%;min-width:0;padding:0;aspect-ratio:1;font-size:30px;line-height:1;border:2.5px solid var(--ink);border-radius:${i % 2 ? '8px 11px 8px 10px' : '11px 8px 10px 8px'};cursor:pointer;color:var(--ink);background:var(--paper-2);-webkit-tap-highlight-color:transparent"></button>`);
            b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (done) return; sel = i; ctx.sfx('tick'); b.classList.remove('tap-pop'); void b.offsetWidth; b.classList.add('tap-pop'); paint(); });
          } else {
            const { across, down } = clueAt(i);
            b = F.h(`<div style="position:relative;aspect-ratio:1;min-width:0;border-radius:6px;overflow:hidden;background:${across || down ? 'var(--ink)' : 'var(--ink-faint)'}">
              ${across || down ? `<svg viewBox="0 0 10 10" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%"><path d="M0,0 L10,10" style="stroke:var(--card)" stroke-width=".35" vector-effect="non-scaling-stroke"/></svg>` : ''}
              ${across ? `<span style="position:absolute;right:4px;top:2px;font-size:17px;line-height:1.1;color:var(--card);font-weight:700">${across.sum}</span>` : ''}
              ${down ? `<span style="position:absolute;left:4px;bottom:2px;font-size:17px;line-height:1.1;color:var(--card);font-weight:700">${down.sum}</span>` : ''}</div>`);
          }
          cells.push(b); grid.appendChild(b);
        }
        const msg = F.h('<div class="info-line" style="text-align:center;min-height:52px;margin:0 0 8px;font-size:20px"></div>');
        const pad = F.h(`<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px"></div>`);
        const keys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
        keys.forEach((d) => {
          const k = F.h(`<button class="opt" style="min-width:0;min-height:72px;font-size:30px;padding:0">${d === 0 ? '⌫' : d}</button>`);
          k.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (done || sel == null) return;
            cur[sel] = d; ctx.sfx(d ? 'tap' : 'tick');
            k.classList.remove('tap-pop'); void k.offsetWidth; k.classList.add('tap-pop');
            cells[sel].classList.remove('tap-pop'); void cells[sel].offsetWidth; cells[sel].classList.add('tap-pop');
            paint();
            const ev = evaluate(pz, cur);
            if (ev.ok) win();
            else if (pz.whites.every((c) => cur[c])) msg.textContent = F.tt({ de: 'Rot markierte Felder stimmen noch nicht.', en: 'Red cells are not right yet.' });
            else msg.textContent = '';
          });
          pad.appendChild(k);
        });
        ctx.el.append(card, msg, pad);
        msg.textContent = F.tt({ de: 'Tippe ein leeres Feld, dann eine Ziffer.', en: 'Tap an empty cell, then a digit.' });

        function paint() {
          const ev = evaluate(pz, cur);
          pz.whites.forEach((c) => {
            const b = cells[c];
            b.textContent = cur[c] || '';
            const bad = ev.bad.has(c) && (cur[c]);
            b.style.background = bad ? 'var(--bad)' : c === sel ? 'var(--c-math)' : 'var(--paper-2)';
            b.style.color = bad ? '#2a1f1f' : c === sel ? '#2B2522' : 'var(--ink)';
            b.style.boxShadow = c === sel ? 'inset 0 0 0 3px var(--ink)' : '';
          });
        }
        paint();
        async function win() {
          done = true; solved++;
          points += 25;
          pz.whites.forEach((c) => { cells[c].style.background = 'var(--good)'; cells[c].style.color = '#1f2a22'; cells[c].style.boxShadow = ''; });
          card.classList.add('flash-ok');
          ctx.setScore(points); ctx.sfx('win');
          msg.textContent = F.tt({ de: 'Gelöst! ⭐', en: 'Solved! ⭐' });
          F.cheer(round < PUZZLES ? 8 : 12);
          await ctx.wait(1200);
          next();
        }
      }
      function end() {
        const secs = Math.round((Date.now() - t0) / 1000);
        const score = points + Math.max(0, 20 - Math.floor(secs / 15));
        ctx.finish({
          score,
          detail: F.tt({ de: `${solved} Rätsel, ${secs} s`, en: `${solved} puzzles, ${secs} s` }),
          levelDelta: secs < 150 ? 1 : secs > 400 ? -1 : 0,
          quality: Math.max(0.3, Math.min(1, 1.2 - secs / 500)), ink: 6 + Math.round(score / 5),
        });
      }
      ctx.onCleanup(() => { /* nothing running */ });
      next();
    },
  });
})();
