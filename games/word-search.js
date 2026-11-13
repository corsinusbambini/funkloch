/* Word Search: find made-up words hidden in a letter grid. Tap the first and the last letter of a word. */
(function () {
  const F = Funkloch;
  const ONSET = ['b', 'd', 'f', 'g', 'h', 'k', 'l', 'm', 'n', 'p', 'r', 's', 't', 'v', 'w', 'z', 'br', 'tr', 'kl', 'st', 'fl', 'gr'];
  const VOW = ['a', 'e', 'i', 'o', 'u'];
  const CODA = ['', '', 'n', 'l', 'r', 's', 't', 'm'];
  const FILL = 'AAEEIIOOUUBDFGHKLMNPRSTVWZ';
  const N = 8;
  const COLS = ['var(--c-focus)', 'var(--c-fun)', 'var(--c-math)', 'var(--c-spatial)', 'var(--c-memory)', 'var(--c-logic)'];
  const DIRS_ALL = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];

  function makeWord(r) {
    for (let k = 0; k < 40; k++) {
      let w = '';
      const syl = r.int(2, 3);
      for (let i = 0; i < syl; i++) w += r.pick(ONSET) + r.pick(VOW) + (i === syl - 1 ? r.pick(CODA) : '');
      if (w.length >= 4 && w.length <= 7) return w.toUpperCase();
    }
    return 'BAKOL';
  }

  function build(r, lvl) {
    const count = lvl >= 4 ? 6 : 5;
    const dirs = lvl >= 4 ? DIRS_ALL : lvl >= 2 ? DIRS_ALL.slice(0, 3) : DIRS_ALL.slice(0, 2);
    for (let attempt = 0; attempt < 30; attempt++) {
      const grid = Array.from({ length: N * N }, () => '');
      const words = [];
      let ok = true;
      for (let wi = 0; wi < count && ok; wi++) {
        let placed = false;
        for (let tries = 0; tries < 60 && !placed; tries++) {
          const w = makeWord(r);
          const rev = w.split('').reverse().join('');
          if (words.some((o) => o.w.includes(w) || w.includes(o.w) || o.w === rev)) continue;
          const [dr, dc] = r.pick(dirs);
          const r0 = r.int(0, N - 1), c0 = r.int(0, N - 1);
          const r1 = r0 + dr * (w.length - 1), c1 = c0 + dc * (w.length - 1);
          if (r1 < 0 || r1 >= N || c1 < 0 || c1 >= N) continue;
          let fits = true;
          for (let i = 0; i < w.length; i++) {
            const g = grid[(r0 + dr * i) * N + c0 + dc * i];
            if (g && g !== w[i]) { fits = false; break; }
          }
          if (!fits) continue;
          for (let i = 0; i < w.length; i++) grid[(r0 + dr * i) * N + c0 + dc * i] = w[i];
          words.push({ w, r0, c0, r1, c1 });
          placed = true;
        }
        if (!placed) ok = false;
      }
      if (!ok) continue;
      for (let i = 0; i < grid.length; i++) if (!grid[i]) grid[i] = r.pick(FILL.split(''));
      return { grid, words };
    }
    return null;
  }

  // Doodled notepad with tape, used as the board frame.
  const tape = (side) => `<svg viewBox="0 0 60 22" width="54" height="20" style="position:absolute;top:-10px;${side}:14px;transform:rotate(${side === 'left' ? -6 : 5}deg);pointer-events:none"><path d="M2,4 L58,2 L56,19 L4,20 Z" style="fill:var(--c-math);stroke:var(--ink)" stroke-width="2" stroke-linejoin="round" opacity=".9"/><path d="M12,8 l20,-1 M12,14 l14,0" style="stroke:var(--ink-soft)" stroke-width="1.5" stroke-linecap="round"/></svg>`;

  // Pencil and magnifying glass doodle under the board.
  const PENCIL = `<svg class="motif" viewBox="0 0 260 110" style="width:100%;max-width:240px;margin-top:0;transform:rotate(1deg)" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <g style="transform:rotate(-14deg);transform-origin:70px 60px"><path d="M20,48 L150,48 L168,60 L150,72 L20,72 Z" style="fill:var(--c-math);stroke:var(--ink)" stroke-width="3.5"/><path d="M150,48 L168,60 L150,72 Z" style="fill:var(--card);stroke:var(--ink)" stroke-width="3"/><path d="M160,56 L168,60 L160,64" style="fill:var(--ink)" stroke="none"/><path d="M20,48 L8,50 L8,70 L20,72 Z" style="fill:var(--accent);stroke:var(--ink)" stroke-width="3.5"/><path d="M28,54 L140,54" style="stroke:var(--ink)" stroke-width="2" opacity=".35"/></g>
    <circle cx="200" cy="46" r="30" style="fill:var(--card);stroke:var(--ink)" stroke-width="4.5" fill-opacity=".7"/><path d="M178,36 q6,-12 20,-12" style="stroke:var(--ink)" stroke-width="3" opacity=".5"/><path d="M222,68 L248,98" style="stroke:var(--ink)" stroke-width="10"/><path d="M222,68 L248,98" style="stroke:var(--accent)" stroke-width="4"/>
    <text x="190" y="57" font-size="28" style="fill:var(--ink)" stroke="none">A</text></svg>`;

  F.registerGame({
    id: 'word-search', skill: 'focus', added: '2026-11-13', glyph: 'AB↘',
    name: { de: 'Wörter-Suchbild', en: 'Word Search' },
    desc: {
      de: 'Im Buchstabengitter verstecken sich erfundene Wörter, waagrecht, senkrecht oder schräg. Tippe den ersten und dann den letzten Buchstaben eines Wortes aus der Liste. Finde alle Wörter in 2 Gittern, mit möglichst wenigen Fehlgriffen.',
      en: 'Made-up words hide in a letter grid: across, down or diagonal. Tap the first and then the last letter of a word from the list. Find all words in 2 grids, with as few wrong guesses as you can.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 2;
      let round = 0, points = 0, found = 0, total = 0, wrongs = 0;

      function next() {
        if (round >= ROUNDS) return end();
        round++;
        const pz = ctx.fresh(() => build(r, ctx.level) || build(r, 1), (p) => p.words.map((x) => x.w).join(','));
        total += pz.words.length;
        const done = pz.words.map(() => false);
        let start = -1, busy = false;
        ctx.setInfo(`${round} / ${ROUNDS}`); ctx.setScore(points);
        ctx.el.innerHTML = '';
        const wrap = F.h('<div style="position:relative;margin:18px auto 14px;padding:8px;width:100%;max-width:370px;box-sizing:border-box;background:var(--card);border:3px solid var(--ink);border-radius:14px 18px 14px 16px;box-shadow:var(--shadow);transform:rotate(-.6deg)"></div>');
        wrap.innerHTML = tape('left') + tape('right');
        const inner = F.h('<div style="position:relative"></div>');
        const svg = F.h(`<svg viewBox="0 0 ${N * 10} ${N * 10}" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" fill="none" stroke-linecap="round"></svg>`);
        const grid = F.h(`<div style="position:relative;display:grid;grid-template-columns:repeat(${N},minmax(0,1fr));gap:0"></div>`);
        inner.appendChild(svg); inner.appendChild(grid); wrap.appendChild(inner);
        const cells = pz.grid.map((ch, i) => {
          const b = F.h(`<button style="min-width:0;padding:0;aspect-ratio:1;background:transparent;border:0;border-radius:10px;font-size:23px;line-height:1;color:var(--ink);cursor:pointer;transition:transform .12s">${ch}</button>`);
          b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(i); });
          grid.appendChild(b);
          return b;
        });
        const list = F.h('<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:10px;margin:8px 0 6px"></div>');
        const chips = pz.words.map((x) => {
          const c = F.h(`<span style="padding:6px 12px;font-size:19px;letter-spacing:1px;background:var(--card);border:2.5px solid var(--ink);border-radius:10px 14px 10px 12px">${x.w}</span>`);
          list.appendChild(c);
          return c;
        });
        const msg = F.h('<div class="info-line" style="text-align:center;min-height:24px"></div>');
        ctx.el.appendChild(wrap); ctx.el.appendChild(list); ctx.el.appendChild(msg); ctx.el.appendChild(F.h(PENCIL));
        const cen = (i) => [(i % N) * 10 + 5, Math.floor(i / N) * 10 + 5];
        function mark(i, on) {
          cells[i].style.background = on ? 'var(--accent)' : 'transparent';
          cells[i].style.transform = on ? 'scale(1.12)' : '';
        }
        function line(a, b, color, cls) {
          const [x1, y1] = cen(a), [x2, y2] = cen(b);
          svg.insertAdjacentHTML('beforeend', `<g class="${cls || ''}" style="transform-box:fill-box;transform-origin:center"><path d="M${x1},${y1} L${x2},${y2}" style="stroke:var(--ink)" stroke-width="8.6" opacity=".9"/><path d="M${x1},${y1} L${x2},${y2}" style="stroke:${color}" stroke-width="6.6"/></g>`);
        }
        async function tap(i) {
          if (busy || ctx.dead) return;
          if (start < 0) { start = i; mark(i, true); ctx.sfx('tap'); return; }
          if (start === i) { mark(i, false); start = -1; return; }
          const r1 = Math.floor(start / N), c1 = start % N, r2 = Math.floor(i / N), c2 = i % N;
          const dr = r2 - r1, dc = c2 - c1;
          if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) { mark(start, false); start = i; mark(i, true); ctx.sfx('tap'); return; }
          const len = Math.max(Math.abs(dr), Math.abs(dc)) + 1, sr = Math.sign(dr), sc = Math.sign(dc);
          let s = '';
          for (let k = 0; k < len; k++) s += pz.grid[(r1 + sr * k) * N + c1 + sc * k];
          const rs = s.split('').reverse().join('');
          const wi = pz.words.findIndex((x, k) => !done[k] && (x.w === s || x.w === rs));
          const a = start;
          if (wi >= 0) {
            done[wi] = true; found++; points += 10; ctx.setScore(points); ctx.sfx('good');
            mark(a, false);
            line(a, i, COLS[wi % COLS.length], 'tap-pop');
            chips[wi].style.background = COLS[wi % COLS.length];
            chips[wi].style.textDecoration = 'line-through';
            chips[wi].classList.add('tap-pop');
            start = -1;
            msg.textContent = '';
            if (done.every(Boolean)) {
              busy = true; ctx.sfx('win'); F.cheer(10);
              wrap.classList.add('flash-ok');
              await ctx.wait(1100);
              next();
            }
          } else {
            wrongs++; points = Math.max(0, points - 2); ctx.setScore(points); ctx.sfx('bad');
            const cb = cells[i], ca = cells[a];
            ca.style.background = 'var(--bad)'; cb.style.background = 'var(--bad)';
            msg.textContent = F.tt({ de: 'Das ist kein Wort aus der Liste', en: 'Not a word from the list' });
            start = -1; busy = true;
            await ctx.wait(350);
            busy = false; mark(a, false); mark(i, false); msg.textContent = '';
          }
        }
      }

      function end() {
        const clean = found === total;
        ctx.finish({
          score: points + (clean && wrongs === 0 ? 10 : 0),
          detail: F.tt({ de: `${found}/${total} Wörter, ${wrongs} Fehlgriffe`, en: `${found}/${total} words, ${wrongs} wrong guesses` }),
          levelDelta: clean && wrongs <= 2 ? 1 : wrongs >= 8 ? -1 : 0,
          quality: Math.max(0, found / total - wrongs * 0.03), ink: 4 + found * 2,
        });
      }
      next();
    },
  });
})();
