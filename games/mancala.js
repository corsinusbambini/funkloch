/* Mancala (Kalah style): sow stones around a wooden board against the computer. Most stones in your store wins. */
(function () {
  const F = Funkloch;
  // Board: 0-5 your pits (top to bottom), 6 your store, 7-12 computer pits (bottom to top), 13 computer store.
  const ME = 0, CPU = 1;
  const store = (p) => (p === ME ? 6 : 13);
  const pits = (p) => (p === ME ? [0, 1, 2, 3, 4, 5] : [7, 8, 9, 10, 11, 12]);
  const COLS = ['#E8574F', '#5B8FD6', '#F2C14E', '#6FBF8C', '#FFFDF8', '#B58BE0'];
  // Fixed little scatter for stones inside a pit (decoration only, no randomness needed).
  const SPOTS = [[0, 0], [-9, -6], [9, 5], [-8, 7], [9, -7], [0, -10], [1, 10], [-17, 0], [17, 0], [-17, -9], [17, -9], [-17, 9], [17, 9], [-9, 0], [9, 0]];

  function move(b0, i, p) {
    const b = b0.slice(), steps = [];
    let n = b[i], idx = i;
    b[i] = 0;
    const skip = store(1 - p);
    for (let g = 0; n > 0 && g < 200; g++) {
      idx = (idx + 1) % 14;
      if (idx === skip) continue;
      b[idx]++; n--; steps.push(idx);
    }
    let captured = 0;
    const own = pits(p).includes(idx);
    if (own && b[idx] === 1 && b[12 - idx] > 0) {
      captured = b[12 - idx] + 1;
      b[store(p)] += captured; b[idx] = 0; b[12 - idx] = 0;
    }
    return { b, steps, last: idx, extra: idx === store(p), captured };
  }
  const sideSum = (b, p) => pits(p).reduce((s, k) => s + b[k], 0);
  // When one side has no stones left, the other side keeps what is on their side.
  function sweep(b0) {
    const b = b0.slice();
    if (sideSum(b, ME) === 0 || sideSum(b, CPU) === 0) {
      [ME, CPU].forEach((p) => { b[store(p)] += sideSum(b, p); pits(p).forEach((k) => { b[k] = 0; }); });
      return { b, over: true };
    }
    return { b, over: false };
  }
  const legal = (b, p) => pits(p).filter((k) => b[k] > 0);

  // Minimax on the store difference (computer minus you); extra turns keep the same player.
  function search(b, p, depth) {
    const ms = legal(b, p);
    if (!ms.length || depth === 0) return b[13] - b[6];
    let best = p === CPU ? -Infinity : Infinity;
    for (const m of ms) {
      const o = move(b, m, p), s = sweep(o.b);
      const v = s.over ? s.b[13] - s.b[6] : search(s.b, o.extra ? p : 1 - p, depth - 1);
      best = p === CPU ? Math.max(best, v) : Math.min(best, v);
    }
    return best;
  }
  function cpuMove(b, r, level) {
    const ms = legal(b, CPU);
    if (level < 2 && r() < 0.4) return r.pick(ms);
    const depth = level < 2 ? 1 : level < 5 ? 3 : level < 8 ? 5 : 6;
    let best = [], bv = -Infinity;
    for (const m of ms) {
      const o = move(b, m, CPU), s = sweep(o.b);
      const v = s.over ? s.b[13] - s.b[6] : search(s.b, o.extra ? CPU : ME, depth - 1);
      if (v > bv) { bv = v; best = [m]; } else if (v === bv) best.push(m);
    }
    return r.pick(best);
  }

  F.registerGame({
    id: 'mancala', skill: 'logic', added: '2026-11-14', glyph: '🪨',
    name: { de: 'Steinchen-Mulde', en: 'Mancala' },
    desc: {
      de: 'Tippe auf eine deiner Mulden (links). Ihre Steine wandern einzeln gegen den Uhrzeigersinn weiter. Landet der letzte im eigenen Lager, darfst du nochmal. Landet er in einer leeren eigenen Mulde, kassierst du die gegenüber. Wer am Ende mehr Steine im Lager hat, gewinnt.',
      en: 'Tap one of your pits (left). Its stones are dropped one by one, going round the board. If the last one lands in your store, you play again. If it lands in an empty pit of yours, you capture the pit opposite. Whoever has more stones in their store at the end wins.',
    },
    start(ctx) {
      const r = ctx.rng, level = Math.max(0, ctx.level || 0);
      let b = [4, 4, 4, 4, 4, 4, 0, 4, 4, 4, 4, 4, 4, 0], over = false, busy = true, turns = 0, bigCapture = 0;
      ctx.onCleanup(() => { over = true; });
      ctx.el.innerHTML = '';
      const info = F.h('<div class="info-line" style="min-height:26px;font-size:18px"></div>');
      const frame = F.h('<div class="sketch" style="padding:10px;margin:6px 0 0;background:var(--c-math);box-shadow:var(--shadow);transform:rotate(-0.5deg)"></div>');
      const inner = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px 10px"></div>');
      frame.appendChild(inner);
      const stones = (n, w) => {
        const shown = Math.min(n, 15);
        let s = '';
        for (let k = 0; k < shown; k++) {
          const [dx, dy] = w ? [-w / 2 + 20 + (k % 14) * ((w - 40) / 13), (k % 2) * 9 - 4] : SPOTS[k];
          s += `<ellipse cx="${(w ? 0 : 0) + dx}" cy="${dy}" rx="6.2" ry="5.4" style="fill:${COLS[k % COLS.length]};stroke:var(--ink)" stroke-width="1.6"/><path d="M${dx - 3},${dy - 2} q2,-2.4 4.5,-1.6" style="fill:none;stroke:#fff" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`;
        }
        return s;
      };
      // One pit (or store) as a hand-drawn dent with stones and its count.
      const pitSVG = (n, w, h, isStore, mark) => {
        const cx = w / 2, cy = h / 2;
        const body = isStore
          ? `<rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="${h / 2 - 4}" style="fill:var(--paper-2);stroke:var(--ink)" stroke-width="3"/><path d="M14,${h * 0.3} q${w * 0.2},-6 ${w * 0.35},-2" style="fill:none;stroke:var(--ink)" stroke-width="2" opacity=".25" stroke-linecap="round"/>`
          : `<ellipse cx="${cx}" cy="${cy}" rx="${w / 2 - 3}" ry="${h / 2 - 3}" style="fill:var(--paper-2);stroke:var(--ink)" stroke-width="3"/><path d="M${cx - w / 2 + 14},${cy - 8} q10,-9 24,-9" style="fill:none;stroke:var(--ink)" stroke-width="2" opacity=".25" stroke-linecap="round"/>`;
        const sx = isStore ? cx - 18 : cx - 22;
        return `<svg viewBox="0 0 ${w} ${h}" style="width:100%;height:auto;display:block;overflow:visible">${body}
          <g transform="translate(${sx},${cy})">${stones(n, isStore ? w - 90 : 0)}</g>
          <text x="${w - 34}" y="${cy + 9}" text-anchor="middle" style="fill:var(--ink);font-size:${isStore ? 30 : 28}px;font-weight:700;font-family:inherit">${n}</text>
          ${mark ? `<text x="${w - 12}" y="${cy - 8}" text-anchor="middle" style="fill:var(--accent);stroke:var(--ink);stroke-width:.8;font-size:15px">★</text>` : ''}</svg>`;
      };
      const mkCell = (k) => {
        const c = F.h('<button style="border:0;background:transparent;padding:0;min-width:0;min-height:48px;cursor:pointer;display:block;width:100%"></button>');
        return c;
      };
      const cpuStore = F.h('<div style="grid-column:1/3"></div>');
      const myStore = F.h('<div style="grid-column:1/3"></div>');
      const cells = {};
      // Rows top to bottom: computer store, 6 rows (my pit | computer pit), my store.
      inner.appendChild(cpuStore);
      for (let row = 0; row < 6; row++) {
        const a = mkCell(row), c2 = mkCell(12 - row);
        cells[row] = a; cells[12 - row] = c2;
        a.onclick = () => tap(row);
        inner.append(a, c2);
      }
      inner.appendChild(myStore);
      const arrow = F.h(`<div style="display:flex;justify-content:space-between;font-size:16px;color:var(--ink-soft);padding:0 6px;margin-top:8px"><span>${F.esc(F.tt({ de: '▼ Du', en: '▼ You' }))}</span><span>${F.esc(F.tt({ de: 'Computer ▲', en: 'Computer ▲' }))}</span></div>`);
      ctx.el.append(info, frame, arrow);

      let prev = b.slice();
      function draw(hints, hot) {
        const ms = hints ? legal(b, ME) : [];
        for (let k = 0; k < 14; k++) {
          if (k === 6 || k === 13) continue;
          const c = cells[k], extra = hints && k < 6 && b[k] > 0 && ((k + b[k]) % 13 === 6);
          c.innerHTML = pitSVG(b[k], 160, 50, false, extra);
          c.style.opacity = k < 6 && hints && !ms.includes(k) ? '.55' : '1';
          if (k < 6 && hints && ms.includes(k)) c.style.filter = 'drop-shadow(0 0 0 var(--accent))';
          else c.style.filter = '';
          const svg = c.firstChild;
          if ((prev[k] !== b[k] && b[k] > prev[k]) || hot === k) { svg.classList.remove('tap-pop'); void svg.getBoundingClientRect(); svg.classList.add('tap-pop'); }
        }
        cpuStore.innerHTML = pitSVG(b[13], 330, 50, true);
        myStore.innerHTML = pitSVG(b[6], 330, 50, true);
        if (prev[6] !== b[6]) myStore.firstChild.classList.add('tap-pop');
        if (prev[13] !== b[13]) cpuStore.firstChild.classList.add('tap-pop');
        prev = b.slice();
        ctx.setScore(b[6] * 3);
      }

      async function play(i, p) {
        const o = move(b, i, p);
        // Animate: lift the stones, then drop them one by one.
        b[i] = 0; draw(false);
        for (const s of o.steps) {
          if (over) return null;
          b[s]++; ctx.sfx('tick'); draw(false, s);
          await ctx.wait(150);
        }
        if (over) return null;
        if (o.captured) {
          ctx.sfx('good');
          b = o.b; draw(false);
          bigCapture = Math.max(bigCapture, o.captured);
          info.textContent = F.tt({ de: `Gefangen: ${o.captured} Steine!`, en: `Captured ${o.captured} stones!` });
          await ctx.wait(600);
        } else b = o.b;
        const s = sweep(b);
        b = s.b; draw(false);
        return { extra: o.extra, over: s.over };
      }

      async function cpuTurn() {
        for (let g = 0; g < 40 && !over; g++) {
          if (!legal(b, CPU).length) break;
          info.textContent = F.tt({ de: 'Computer denkt …', en: 'Computer is thinking …' });
          await ctx.wait(700);
          if (over) return;
          const m = cpuMove(b, r, level);
          const res = await play(m, CPU);
          if (!res || over) return;
          if (res.over) return end();
          if (!res.extra) break;
          info.textContent = F.tt({ de: 'Computer darf nochmal.', en: 'Computer plays again.' });
          await ctx.wait(500);
        }
        if (over) return;
        busy = false;
        info.textContent = F.tt({ de: 'Du bist dran – tippe auf eine Mulde links.', en: 'Your turn – tap a pit on the left.' });
        draw(true);
      }

      async function tap(i) {
        if (over || busy || !b[i]) return;
        busy = true; turns++;
        const res = await play(i, ME);
        if (!res || over) return;
        if (res.over) return end();
        if (res.extra) {
          busy = false; ctx.sfx('good');
          info.textContent = F.tt({ de: 'Letzter Stein im Lager – nochmal!', en: 'Last stone in your store – again!' });
          draw(true);
          return;
        }
        cpuTurn();
      }

      function end() {
        if (over) return;
        over = true; draw(false);
        const a = b[6], d = b[13], win = a > d;
        ctx.sfx(win ? 'win' : 'bad');
        if (win) F.cheer(10);
        ctx.finish({
          score: a * 3 + (win ? 30 : 0),
          detail: F.tt({ de: `${a} : ${d} – ${win ? 'gewonnen!' : a === d ? 'unentschieden' : 'verloren'}`, en: `${a} : ${d} – ${win ? 'you win!' : a === d ? 'a draw' : 'you lose'}` }),
          levelDelta: win ? 1 : a < d - 6 ? -1 : 0,
          quality: Math.min(1, a / 30), ink: 3 + Math.round(a / 3) + (win ? 4 : 0),
        });
      }

      busy = false;
      info.textContent = F.tt({ de: 'Du bist dran – tippe auf eine Mulde links.', en: 'Your turn – tap a pit on the left.' });
      draw(true);
    },
  });
})();
