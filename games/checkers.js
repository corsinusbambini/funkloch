/* Checkers (classic board game) against the computer.
   Pieces move diagonally forward, jumping is a must (also several jumps in a row), a piece that reaches the far row becomes a king.
   You win when the computer has no pieces or no legal move left. */
(function () {
  const F = Funkloch;
  // piece codes: 1 your man, 2 your king, 3 computer man, 4 computer king
  const side = (p) => (p === 0 ? 0 : p < 3 ? 1 : 2);
  const isKing = (p) => p === 2 || p === 4;
  const dirsOf = (p) => (isKing(p) ? [[-1, -1], [1, -1], [-1, 1], [1, 1]] : side(p) === 1 ? [[-1, -1], [1, -1]] : [[-1, 1], [1, 1]]);
  const inB = (x, y) => x >= 0 && y >= 0 && x < 8 && y < 8;
  const lastRow = (s) => (s === 1 ? 0 : 7);

  function jumpSeqs(b, i, p, path, caps, out) {
    const x = i % 8, y = (i / 8) | 0;
    let more = false;
    for (const [dx, dy] of dirsOf(p)) {
      const mx = x + dx, my = y + dy, tx = x + 2 * dx, ty = y + 2 * dy;
      if (!inB(tx, ty)) continue;
      const mid = my * 8 + mx, to = ty * 8 + tx;
      if (b[mid] && side(b[mid]) !== side(p) && b[to] === 0) {
        more = true;
        const nb = b.slice(); nb[mid] = 0; nb[i] = 0;
        const promoted = !isKing(p) && ty === lastRow(side(p));
        const np = promoted ? p + 1 : p;
        nb[to] = np;
        if (promoted) out.push({ path: path.concat(to), caps: caps.concat(mid) });
        else jumpSeqs(nb, to, np, path.concat(to), caps.concat(mid), out);
      }
    }
    if (!more && caps.length) out.push({ path, caps });
  }
  function genSeqs(b, s) {
    const jumps = [], steps = [];
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (!p || side(p) !== s) continue;
      jumpSeqs(b, i, p, [i], [], jumps);
      const x = i % 8, y = (i / 8) | 0;
      for (const [dx, dy] of dirsOf(p)) {
        const nx = x + dx, ny = y + dy;
        if (inB(nx, ny) && b[ny * 8 + nx] === 0) steps.push({ path: [i, ny * 8 + nx], caps: [] });
      }
    }
    return jumps.length ? jumps : steps;
  }
  function applySeq(b, sq) {
    const nb = b.slice(), from = sq.path[0], to = sq.path[sq.path.length - 1];
    let p = nb[from];
    nb[from] = 0;
    sq.caps.forEach((c) => { nb[c] = 0; });
    if (!isKing(p) && ((to / 8) | 0) === lastRow(side(p))) p++;
    nb[to] = p;
    return nb;
  }
  function evalB(b) {
    let v = 0;
    for (let i = 0; i < 64; i++) {
      const p = b[i];
      if (!p) continue;
      const y = (i / 8) | 0, x = i % 8;
      const base = isKing(p) ? 5.2 : 3 + (side(p) === 2 ? y : 7 - y) * 0.12;
      const edge = x === 0 || x === 7 ? 0.15 : 0;
      v += side(p) === 2 ? base + edge : -(base + edge);
    }
    return v;
  }
  function pickCpu(b, r, lvl) {
    const seqs = genSeqs(b, 2);
    if (lvl < 2 && r() < 0.3) return r.pick(seqs);
    const depth = lvl < 2 ? 2 : lvl < 5 ? 3 : 4;
    let nodes = 0;
    const search = (bd, s, d, al, be) => {
      const ms = genSeqs(bd, s);
      if (!ms.length) return s === 2 ? -100 - d : 100 + d;
      if (d === 0 || nodes > 30000) return evalB(bd);
      let best = s === 2 ? -Infinity : Infinity;
      for (const m of ms) {
        nodes++;
        const v = search(applySeq(bd, m), 3 - s, d - 1, al, be);
        if (s === 2) { best = Math.max(best, v); al = Math.max(al, v); } else { best = Math.min(best, v); be = Math.min(be, v); }
        if (be <= al) break;
      }
      return best;
    };
    let best = [], bv = -Infinity;
    for (const m of seqs) {
      const v = search(applySeq(b, m), 1, depth - 1, -Infinity, Infinity);
      if (v > bv + 1e-9) { bv = v; best = [m]; } else if (Math.abs(v - bv) < 1e-9) best.push(m);
    }
    return r.pick(best);
  }
  const count = (b, s) => b.reduce((n, p) => n + (side(p) === s ? 1 : 0), 0);

  F.registerGame({
    id: 'checkers', skill: 'logic', added: '2026-11-18', glyph: '⛀⛂',
    name: { de: 'Dame', en: 'Checkers' },
    desc: {
      de: 'Spiele auf dem Brett gegen den Computer. Steine ziehen schräg vorwärts, Schlagen ist Pflicht (auch mehrere Sprünge hintereinander). Wer die letzte Reihe erreicht, wird Dame und darf auch rückwärts. Du gewinnst, wenn der Computer keinen Zug mehr hat.',
      en: 'Play on the board against the computer. Pieces move diagonally forward and jumping is a must (also several jumps in a row). Reach the far row to become a king that moves backwards too. You win when the computer has no move left.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = ctx.level || 0;
      const t = (o) => F.esc(F.tt(o));
      let b = new Array(64).fill(0);
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2 === 1) { if (y < 3) b[y * 8 + x] = 3; else if (y > 4) b[y * 8 + x] = 1; }
      let sel = -1, prefix = [], seqs = [], busy = false, over = false, plies = 0, quiet = 0, lastTo = -1, captured = 0;

      ctx.el.innerHTML = '';
      const card = F.h(`<div class="sketch pop-in" style="padding:8px;margin:6px 0 8px;background:var(--card);box-shadow:var(--shadow);transform:rotate(-0.4deg)"></div>`);
      const cells = [];
      for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
        const dark = (x + y) % 2 === 1, j = ((x * 7 + y * 13) % 5 - 2) * 0.5;
        cells.push(dark
          ? `<path d="M${x * 40 + j},${y * 40} L${x * 40 + 40},${y * 40 + j} L${x * 40 + 40 - j},${y * 40 + 40} L${x * 40},${y * 40 + 40 - j} Z" style="fill:var(--c-logic)"/><path d="M${x * 40 + 6},${y * 40 + 34} l10,-12 M${x * 40 + 14},${y * 40 + 36} l16,-20 M${x * 40 + 26},${y * 40 + 36} l10,-12" style="stroke:var(--ink)" stroke-width="1.4" opacity=".16" stroke-linecap="round"/>`
          : '');
      }
      const svg = F.h(`<svg viewBox="0 0 320 320" style="display:block;width:100%;height:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent">
        <rect x="0" y="0" width="320" height="320" style="fill:var(--paper-2)"/>${cells.join('')}
        <path d="M2,2 L318,1 L319,318 L1,319 Z" fill="none" style="stroke:var(--ink)" stroke-width="3.6" stroke-linejoin="round"/>
        <g class="ck-hint"></g><g class="ck-pcs"></g>
        ${Array.from({ length: 64 }, (_, i) => ((i % 8 + (i / 8 | 0)) % 2 ? `<rect data-i="${i}" x="${(i % 8) * 40}" y="${(i >> 3) * 40}" width="40" height="40" fill="transparent"/>` : '')).join('')}</svg>`);
      card.append(svg);
      const panel = F.h(`<div class="sketch" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:8px 12px;margin:2px 0 8px;background:var(--card);box-shadow:var(--shadow);transform:rotate(0.4deg)"><div class="ck-a" style="text-align:center;font-size:20px"></div><div class="ck-b" style="text-align:center;font-size:20px"></div></div>`);
      const msg = F.h('<div class="info-line" style="text-align:center;min-height:62px;margin:2px 0 4px;font-size:21px"></div>');
      ctx.el.append(card, panel, msg);
      const pcs = svg.querySelector('.ck-pcs'), hint = svg.querySelector('.ck-hint');
      const sg = (x) => F.h(`<svg>${x}</svg>`).firstElementChild;
      const crown = '<path d="M-8,4 L-9,-6 L-4,-1 L0,-8 L4,-1 L9,-6 L8,4 Z" style="fill:#FFD66B;stroke:var(--ink)" stroke-width="2" stroke-linejoin="round"/>';
      function disc(p) {
        const mine = side(p) === 1;
        const inner = mine
          ? `<circle r="15" style="fill:var(--accent);stroke:var(--ink)" stroke-width="2.8"/><circle r="9" fill="none" style="stroke:var(--ink)" stroke-width="1.6" opacity=".35"/><path d="M-8,-5 q4,-8 11,-6" fill="none" stroke="#fff" stroke-width="2.8" stroke-linecap="round" opacity=".6"/>`
          : `<circle r="15" style="fill:var(--ink);stroke:var(--ink)" stroke-width="2.8"/><circle r="9" fill="none" style="stroke:var(--card)" stroke-width="2.2" opacity=".8"/><path d="M-9,-6 q4,-7 10,-6" fill="none" style="stroke:var(--card)" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>`;
        return inner + (isKing(p) ? crown : '');
      }
      const legend = F.h(`<div style="display:flex;justify-content:center;flex-wrap:wrap;gap:8px 22px;margin:0 0 10px;font-size:18px;color:var(--ink-soft)"><span style="display:inline-flex;align-items:center;gap:8px"><svg width="28" height="28" viewBox="-14 -14 28 28" aria-hidden="true"><circle r="10" style="fill:var(--good);stroke:var(--ink)" stroke-width="2.4" stroke-dasharray="3 3"/></svg>${t({ de: 'dorthin darfst du', en: 'you can go here' })}</span><span style="display:inline-flex;align-items:center;gap:8px"><svg width="28" height="28" viewBox="-18 -18 36 36" aria-hidden="true">${disc(2)}</svg>${t({ de: 'Dame', en: 'king' })}</span></div>`);
      ctx.el.appendChild(legend);
      const chip = (p, n, lbl) => `<span style="display:inline-flex;align-items:center;gap:6px"><svg viewBox="-18 -18 36 36" width="30" height="30" aria-hidden="true">${disc(p)}</svg>${lbl} <b>${n}</b></span>`;
      function render() {
        pcs.innerHTML = '';
        const dest = nextSquares();
        b.forEach((p, i) => {
          if (!p) return;
          const cx = (i % 8) * 40 + 20, cy = (i >> 3) * 40 + 20;
          pcs.appendChild(sg(`<g transform="translate(${cx},${cy})"><g style="transform-box:fill-box;transform-origin:center" class="${i === lastTo ? 'tap-pop' : ''}">${disc(p)}${i === sel ? '<circle r="19" fill="none" style="stroke:var(--ink)" stroke-width="2.6" stroke-dasharray="5 4"/>' : ''}</g></g>`));
        });
        hint.innerHTML = dest.map((i) => `<circle cx="${(i % 8) * 40 + 20}" cy="${(i >> 3) * 40 + 20}" r="10" style="fill:var(--good);stroke:var(--ink)" stroke-width="2" stroke-dasharray="3 3" opacity=".9"/>`).join('');
        panel.querySelector('.ck-a').innerHTML = chip(1, count(b, 1), t({ de: 'Du', en: 'You' }));
        panel.querySelector('.ck-b').innerHTML = chip(3, count(b, 2), t({ de: 'Computer', en: 'Computer' }));
      }
      const say = (o) => { msg.textContent = F.tt(o); };
      const yourTurn = () => {
        seqs = genSeqs(b, 1);
        say(seqs.some((s) => s.caps.length) ? { de: 'Du musst schlagen! Tippe einen Stein, der springen kann.', en: 'You must jump! Tap a piece that can jump.' } : { de: 'Du bist dran: tippe einen Stein, dann ein grünes Feld.', en: 'Your turn: tap a piece, then a green square.' });
      };
      function nextSquares() {
        if (sel < 0 || over) return [];
        const k = prefix.length;
        return [...new Set(seqs.filter((s) => s.path[0] === sel && prefix.every((q, j) => s.path[j + 1] === q) && s.path.length > k + 1).map((s) => s.path[k + 1]))];
      }
      svg.addEventListener('pointerdown', (e) => {
        const c = e.target.closest && e.target.closest('[data-i]');
        if (!c) return;
        e.preventDefault();
        if (busy || over) return;
        tap(+c.getAttribute('data-i'));
      });
      function tap(i) {
        if (!prefix.length && side(b[i]) === 1) {
          if (!seqs.some((s) => s.path[0] === i)) {
            ctx.sfx('tick'); sel = -1; render();
            say(seqs.some((s) => s.caps.length) ? { de: 'Schlagen ist Pflicht: wähle einen Stein, der springen kann.', en: 'Jumping is a must: pick a piece that can jump.' } : { de: 'Dieser Stein kann nicht ziehen.', en: 'This piece cannot move.' });
            return;
          }
          sel = i; lastTo = -1; ctx.sfx('tap'); render(); return;
        }
        if (sel < 0 || !nextSquares().includes(i)) { ctx.sfx('tick'); return; }
        const k = prefix.length, match = seqs.filter((s) => s.path[0] === sel && prefix.every((q, j) => s.path[j + 1] === q) && s.path[k + 1] === i);
        const sq = match[0], cap = sq.caps[k];
        const from = k ? prefix[k - 1] : sel, p = b[from];
        b[from] = 0; b[i] = p;
        if (cap !== undefined) { b[cap] = 0; captured++; ctx.sfx('good'); ctx.setScore(captured); } else ctx.sfx('tap');
        prefix.push(i); lastTo = i;
        const done = match.some((s) => s.path.length === k + 2);
        if (!done) { sel = i; render(); say({ de: 'Noch ein Sprung! Tippe das nächste grüne Feld.', en: 'Jump again! Tap the next green square.' }); return; }
        const fin = match.find((s) => s.path.length === k + 2);
        const lastRowNow = ((i / 8) | 0) === lastRow(1);
        if (!isKing(p) && lastRowNow) { b[i] = p + 1; ctx.sfx('win'); }
        sel = -1; prefix = []; render();
        plies++; quiet = fin.caps.length || !isKing(p) ? 0 : quiet + 1;
        cpuTurn();
      }
      async function cpuTurn() {
        if (!genSeqs(b, 2).length) return finish(true);
        if (plies >= 120 || quiet >= 30) return finish(null);
        busy = true; say({ de: 'Der Computer überlegt …', en: 'The computer is thinking …' });
        await ctx.wait(600);
        if (over || ctx.dead) return;
        const m = pickCpu(b, r, lvl);
        let p = b[m.path[0]];
        for (let k = 0; k < m.path.length - 1; k++) {
          b[m.path[k]] = 0;
          if (m.caps[k] !== undefined) b[m.caps[k]] = 0;
          b[m.path[k + 1]] = p; lastTo = m.path[k + 1];
          if (k === m.path.length - 2 && !isKing(p) && ((lastTo / 8) | 0) === lastRow(2)) b[lastTo] = p + 1;
          ctx.sfx(m.caps.length ? 'bad' : 'tap'); render();
          if (k < m.path.length - 2) { await ctx.wait(380); if (over || ctx.dead) return; }
        }
        if (m.caps.length) { svg.classList.remove('flash-bad'); void svg.offsetWidth; svg.classList.add('flash-bad'); }
        plies++; quiet = m.caps.length || !isKing(p) ? 0 : quiet + 1;
        busy = false;
        yourTurn();
        if (!seqs.length) return finish(false);
        if (plies >= 120 || quiet >= 30) return finish(null);
      }
      async function finish(win) {
        over = true; busy = true; render();
        const mine = count(b, 1), theirs = count(b, 2);
        const res = win === null ? (mine > theirs ? true : mine < theirs ? false : null) : win;
        if (res === true) { ctx.sfx('win'); F.cheer(14); say({ de: 'Gewonnen! ⭐', en: 'You won! ⭐' }); }
        else { ctx.sfx('bad'); say(res === null ? { de: 'Unentschieden.', en: 'A draw.' } : { de: 'Der Computer hat gewonnen.', en: 'The computer won.' }); }
        await ctx.wait(1300);
        const score = (res === true ? 50 : res === null ? 20 : 5) + captured * 4 + mine * 2;
        ctx.finish({
          score,
          detail: F.tt({ de: `${captured} Steine geschlagen, ${mine} übrig`, en: `${captured} pieces captured, ${mine} left` }),
          levelDelta: res === true ? 1 : res === false ? -1 : 0,
          quality: res === true ? 1 : res === null ? 0.5 : 0.25, ink: 4 + Math.round(score / 8),
        });
      }
      ctx.onCleanup(() => { over = true; });
      ctx.setScore(0); ctx.setInfo(t({ de: 'Dame', en: 'Checkers' }));
      render(); yourTurn();
    },
  });
})();
