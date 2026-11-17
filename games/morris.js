/* Nine Men's Morris (classic board game) against the computer.
   Place 9 stones each, then slide them along the lines. Three in a row = mill = remove a stone of the other side.
   You win when the computer has only 2 stones left or cannot move. */
(function () {
  const F = Funkloch;
  const S = [132, 90, 48], C = 160;
  const OFF = [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]];
  const XY = [];
  for (let r = 0; r < 3; r++) for (let p = 0; p < 8; p++) XY.push([C + OFF[p][0] * S[r], C + OFF[p][1] * S[r]]);
  const ADJ = XY.map((_, i) => {
    const r = i >> 3, p = i & 7, a = [r * 8 + ((p + 1) % 8), r * 8 + ((p + 7) % 8)];
    if (p & 1) { if (r > 0) a.push((r - 1) * 8 + p); if (r < 2) a.push((r + 1) * 8 + p); }
    return a;
  });
  const MILLS = [];
  for (let r = 0; r < 3; r++) for (const k of [0, 2, 4, 6]) MILLS.push([r * 8 + k, r * 8 + ((k + 1) % 8), r * 8 + ((k + 2) % 8)]);
  for (const p of [1, 3, 5, 7]) MILLS.push([p, 8 + p, 16 + p]);
  const MILLS_OF = XY.map((_, i) => MILLS.filter((m) => m.includes(i)));
  const inMill = (b, i, pl) => MILLS_OF[i].some((m) => m.every((j) => b[j] === pl));
  const count = (b, pl) => b.reduce((s, v) => s + (v === pl ? 1 : 0), 0);
  const total = (st, pl) => count(st.b, pl) + st.hand[pl];
  const canFly = (st, pl) => st.hand[pl] === 0 && count(st.b, pl) === 3;
  const targetsFrom = (st, i, pl) => (canFly(st, pl) ? st.b.map((v, k) => (v === 0 ? k : -1)).filter((k) => k >= 0) : ADJ[i].filter((k) => st.b[k] === 0));
  const removable = (b, opp) => {
    const all = b.map((v, k) => (v === opp ? k : -1)).filter((k) => k >= 0);
    const free = all.filter((k) => !inMill(b, k, opp));
    return free.length ? free : all;
  };

  function genMoves(st, pl) {
    const opp = 3 - pl, base = [];
    if (st.hand[pl] > 0) st.b.forEach((v, i) => { if (v === 0) base.push({ from: -1, to: i }); });
    else st.b.forEach((v, i) => { if (v === pl) targetsFrom(st, i, pl).forEach((t) => base.push({ from: i, to: t })); });
    const out = [];
    for (const m of base) {
      const b = st.b.slice();
      if (m.from >= 0) b[m.from] = 0;
      b[m.to] = pl;
      if (inMill(b, m.to, pl) && count(b, opp) > 0) removable(b, opp).forEach((j) => out.push({ from: m.from, to: m.to, rem: j }));
      else out.push({ from: m.from, to: m.to, rem: -1 });
    }
    return out;
  }
  function apply(st, m, pl) {
    const b = st.b.slice(), hand = st.hand.slice();
    if (m.from >= 0) b[m.from] = 0; else hand[pl]--;
    b[m.to] = pl;
    if (m.rem >= 0) b[m.rem] = 0;
    return { b, hand };
  }
  const lost = (st, pl) => total(st, pl) < 3 || (st.hand[pl] === 0 && !genMoves(st, pl).length);
  function evalSt(st) {
    let v = (total(st, 2) - total(st, 1)) * 14;
    const mob = (pl) => st.b.reduce((s, x, i) => s + (x === pl ? ADJ[i].filter((k) => st.b[k] === 0).length : 0), 0);
    v += (mob(2) - mob(1)) * 0.8;
    MILLS.forEach((m) => {
      const c2 = m.filter((j) => st.b[j] === 2).length, c1 = m.filter((j) => st.b[j] === 1).length;
      if (c2 === 3) v += 4; if (c1 === 3) v -= 4;
      if (c2 === 2 && c1 === 0) v += 3; if (c1 === 2 && c2 === 0) v -= 3;
    });
    return v;
  }
  function pickCpu(st, r, level) {
    let nodes = 0;
    const search = (s, pl, depth, al, be) => {
      if (total(s, pl) < 3) return pl === 2 ? -1000 - depth : 1000 + depth;
      if (depth === 0 || nodes > 40000) return evalSt(s);
      const ms = genMoves(s, pl);
      if (!ms.length) return pl === 2 ? -1000 - depth : 1000 + depth;
      ms.sort((a, b) => (b.rem >= 0) - (a.rem >= 0));
      let best = pl === 2 ? -Infinity : Infinity;
      for (const m of ms) {
        nodes++;
        const v = search(apply(s, m, pl), 3 - pl, depth - 1, al, be);
        if (pl === 2) { best = Math.max(best, v); al = Math.max(al, v); } else { best = Math.min(best, v); be = Math.min(be, v); }
        if (be <= al) break;
      }
      return best;
    };
    const ms = genMoves(st, 2);
    if (level < 2 && r() < 0.35) return r.pick(ms);
    const depth = level < 2 ? 1 : level < 5 ? 2 : 3;
    let best = [], bv = -Infinity;
    for (const m of ms) {
      const v = search(apply(st, m, 2), 1, depth - 1, -Infinity, Infinity);
      if (v > bv + 1e-9) { bv = v; best = [m]; } else if (Math.abs(v - bv) < 1e-9) best.push(m);
    }
    return r.pick(best);
  }

  F.registerGame({
    id: 'morris', skill: 'logic', added: '2026-11-17', glyph: '⚙️',
    name: { de: 'Mühle', en: "Nine Men's Morris" },
    desc: {
      de: 'Setze abwechselnd mit dem Computer je 9 Steine, danach schiebst du sie entlang der Linien. Drei Steine in einer Reihe sind eine Mühle: Dann darfst du einen Stein des Gegners wegnehmen. Du gewinnst, wenn der Computer nur noch 2 Steine hat oder nicht mehr ziehen kann.',
      en: 'Take turns with the computer placing 9 stones each, then slide them along the lines. Three stones in a row make a mill: you may remove one of the opponent’s stones. You win when the computer has only 2 stones left or cannot move.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = ctx.level || 0;
      let st = { b: new Array(24).fill(0), hand: [0, 9, 9] };
      let sel = -1, targets = [], remSet = [], busy = false, over = false, plies = 0, lastTo = -1, captured = 0;
      const t = (o) => F.esc(F.tt(o));

      ctx.el.innerHTML = '';
      const card = F.h(`<div class="sketch pop-in" style="padding:10px 10px 8px;margin:6px 0 8px;background:var(--card);box-shadow:var(--shadow);transform:rotate(-0.4deg)"></div>`);
      const hands = F.h(`<div class="sketch" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:10px 12px;margin:2px 0 10px;background:var(--card);box-shadow:var(--shadow);transform:rotate(0.4deg)"><div class="mo-h1" style="text-align:center"></div><div class="mo-h2" style="text-align:center"></div></div>`);
      const grain = Array.from({ length: 9 }, (_, i) => `<path d="M${14 + (i % 3) * 8},${20 + i * 33} q${70 + (i % 4) * 20},${-8 + (i % 3) * 6} ${150 + (i % 5) * 18},${(i % 2) * 5}" fill="none" stroke="var(--ink)" stroke-width="1.6" opacity=".09" stroke-linecap="round"/>`).join('');
      const lines = [0, 1, 2].map((q) => { const s = S[q], a = C - s, z = C + s; return `<path d="M${a},${a + 1} L${z},${a - 1} L${z + 1},${z} L${a},${z + 1} Z" fill="none" stroke="var(--ink)" stroke-width="3.6" stroke-linejoin="round" stroke-linecap="round"/>`; }).join('')
        + [[C, C - S[0], C, C - S[2]], [C, C + S[2], C, C + S[0]], [C - S[0], C, C - S[2], C], [C + S[2], C, C + S[0], C]].map((l) => `<path d="M${l[0]},${l[1]} L${l[2]},${l[3]}" stroke="var(--ink)" stroke-width="3.6" stroke-linecap="round"/>`).join('');
      const svg = F.h(`<svg viewBox="0 0 320 320" style="display:block;width:100%;height:auto;touch-action:manipulation;-webkit-tap-highlight-color:transparent">
        <rect x="3" y="3" width="314" height="314" rx="16" style="fill:var(--paper-2);stroke:var(--ink)" stroke-width="3"/>${grain}${lines}
        ${XY.map((p) => `<circle cx="${p[0]}" cy="${p[1]}" r="5.5" style="fill:var(--ink)"/>`).join('')}
        <g class="mo-hint"></g><g class="mo-pcs"></g>
        ${XY.map((p, i) => `<circle data-i="${i}" cx="${p[0]}" cy="${p[1]}" r="24" fill="transparent" style="cursor:pointer"/>`).join('')}</svg>`);
      card.append(svg);
      const msg = F.h('<div class="info-line" style="text-align:center;min-height:66px;margin:4px 0 6px;font-size:21px"></div>');
      ctx.el.append(card, hands, msg);
      const pcs = svg.querySelector('.mo-pcs'), hint = svg.querySelector('.mo-hint');

      const sg = (x) => F.h(`<svg>${x}</svg>`).firstElementChild;
      function pieceSVG(pl, size, extra) {
        const inner = pl === 1
          ? `<circle r="19" style="fill:var(--accent);stroke:var(--ink)" stroke-width="3"/><path d="M-10,-6 q5,-9 14,-7" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" opacity=".65"/>`
          : `<circle r="19" style="fill:var(--ink);stroke:var(--ink)" stroke-width="3"/><circle r="11" fill="none" style="stroke:var(--card)" stroke-width="2.6" opacity=".85"/><path d="M-11,-9 q5,-7 12,-7" fill="none" style="stroke:var(--card)" stroke-width="2.6" stroke-linecap="round" opacity=".5"/>`;
        return extra === 'raw' ? inner : `<svg viewBox="-22 -22 44 44" width="${size}" height="${size}" aria-hidden="true">${inner}</svg>`;
      }
      const handHTML = (pl, name) => {
        const n = st.hand[pl], on = count(st.b, pl);
        return `<div style="display:flex;align-items:center;justify-content:center;gap:6px;font-size:22px">${pieceSVG(pl, 30)} ${name}</div>
          <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:2px;min-height:22px;margin:4px 0 2px">${Array.from({ length: n }, () => pieceSVG(pl, 20)).join('')}</div>
          <div style="font-size:17px;color:var(--ink-soft)">${n ? t({ de: `${n} zu setzen`, en: `${n} to place` }) + ' · ' : ''}${t({ de: `${on} im Spiel`, en: `${on} on board` })}</div>`;
      };
      function render() {
        pcs.innerHTML = '';
        st.b.forEach((v, i) => {
          if (!v) return;
          const g = sg(`<g transform="translate(${XY[i][0]},${XY[i][1]})"><g style="transform-box:fill-box;transform-origin:center" class="${i === lastTo ? 'tap-pop' : ''}">${pieceSVG(v, 0, 'raw')}${i === sel ? '<circle r="25" fill="none" style="stroke:var(--ink)" stroke-width="3" stroke-dasharray="5 4"/>' : ''}</g></g>`);
          pcs.appendChild(g);
        });
        hint.innerHTML = targets.map((i) => `<circle cx="${XY[i][0]}" cy="${XY[i][1]}" r="15" style="fill:var(--good);stroke:var(--ink)" stroke-width="2.4" stroke-dasharray="4 3" opacity=".8"/>`).join('')
          + remSet.map((i) => `<circle cx="${XY[i][0]}" cy="${XY[i][1]}" r="26" fill="none" style="stroke:var(--bad)" stroke-width="4"/>`).join('');
        hands.querySelector('.mo-h1').innerHTML = handHTML(1, t({ de: 'Du', en: 'You' }));
        hands.querySelector('.mo-h2').innerHTML = handHTML(2, t({ de: 'Computer', en: 'Computer' }));
      }
      const say = (o) => { msg.textContent = F.tt(o); };
      const yourTurnMsg = () => say(st.hand[1] > 0 ? { de: 'Du bist dran: setze einen Stein auf einen Punkt.', en: 'Your turn: place a stone on a point.' } : canFly(st, 1) ? { de: 'Du hast nur noch 3 Steine: du darfst springen! Tippe einen Stein.', en: 'Only 3 stones left: you can jump! Tap a stone.' } : { de: 'Tippe einen Stein und dann einen freien Nachbarpunkt.', en: 'Tap a stone, then a free neighbouring point.' });

      svg.addEventListener('pointerdown', (e) => {
        const c = e.target.closest && e.target.closest('[data-i]');
        if (!c) return;
        e.preventDefault();
        if (busy || over) return;
        tapPoint(+c.getAttribute('data-i'));
      });

      function tapPoint(i) {
        if (remSet.length) {
          if (!remSet.includes(i)) { ctx.sfx('tick'); return; }
          st.b[i] = 0; captured++; remSet = []; ctx.sfx('good'); ctx.setScore(captured);
          lastTo = -1; render(); return endHuman();
        }
        if (st.hand[1] > 0) {
          if (st.b[i] !== 0) { ctx.sfx('tick'); return; }
          st.b[i] = 1; st.hand[1]--; return afterHumanMove(i);
        }
        if (st.b[i] === 1) { sel = i; targets = targetsFrom(st, i, 1); ctx.sfx('tap'); lastTo = -1; render(); if (!targets.length) say({ de: 'Dieser Stein steckt fest.', en: 'This stone is stuck.' }); return; }
        if (sel >= 0 && targets.includes(i)) { st.b[sel] = 0; st.b[i] = 1; sel = -1; targets = []; return afterHumanMove(i); }
        ctx.sfx('tick');
      }
      function afterHumanMove(i) {
        lastTo = i; sel = -1; targets = []; ctx.sfx('tap');
        if (inMill(st.b, i, 1) && count(st.b, 2) > 0) {
          remSet = removable(st.b, 2); render(); ctx.sfx('win');
          say({ de: 'Mühle! 🎉 Tippe einen roten Stein des Computers, um ihn wegzunehmen.', en: 'Mill! 🎉 Tap a red-ringed computer stone to remove it.' });
          return;
        }
        render(); endHuman();
      }
      async function endHuman() {
        plies++;
        if (lost(st, 2)) return finish(true);
        if (plies >= 150) return finish(null);
        busy = true; say({ de: 'Der Computer überlegt …', en: 'The computer is thinking …' });
        await ctx.wait(650);
        if (over || ctx.dead) return;
        const m = pickCpu(st, r, lvl);
        if (m.from >= 0) st.b[m.from] = 0; else st.hand[2]--;
        st.b[m.to] = 2; lastTo = m.to; ctx.sfx('tap'); render();
        if (m.rem >= 0) {
          await ctx.wait(450);
          if (over || ctx.dead) return;
          st.b[m.rem] = 0; ctx.sfx('bad'); lastTo = -1; render();
          say({ de: 'Mühle des Computers: einer deiner Steine ist weg.', en: 'Computer mill: one of your stones is gone.' });
          svg.classList.remove('flash-bad'); void svg.offsetWidth; svg.classList.add('flash-bad');
          await ctx.wait(500);
        }
        plies++; busy = false;
        if (over || ctx.dead) return;
        if (lost(st, 1)) return finish(false);
        if (plies >= 150) return finish(null);
        yourTurnMsg();
      }
      async function finish(win) {
        over = true; busy = true; render();
        const mine = total(st, 1), theirs = total(st, 2);
        const res = win === null ? (mine > theirs ? true : mine < theirs ? false : null) : win;
        if (res === true) { ctx.sfx('win'); F.cheer(14); say({ de: 'Gewonnen! ⭐', en: 'You won! ⭐' }); }
        else { ctx.sfx('bad'); say(res === null ? { de: 'Unentschieden.', en: 'A draw.' } : { de: 'Der Computer hat gewonnen.', en: 'The computer won.' }); }
        await ctx.wait(1300);
        const score = (res === true ? 50 : res === null ? 20 : 5) + captured * 4 + mine * 2;
        ctx.finish({
          score,
          detail: F.tt({ de: `${captured} Steine erobert, ${mine} übrig`, en: `${captured} stones captured, ${mine} left` }),
          levelDelta: res === true ? 1 : res === false ? -1 : 0,
          quality: res === true ? 1 : res === null ? 0.5 : 0.25, ink: 4 + Math.round(score / 8),
        });
      }
      ctx.onCleanup(() => { over = true; });
      ctx.setScore(0); ctx.setInfo(t({ de: 'Mühle', en: 'Morris' }));
      render(); yourTurnMsg();
    },
  });
})();
