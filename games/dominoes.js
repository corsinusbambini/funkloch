/* Dominoes: classic double-six dominoes against the computer. Match the numbers at the ends of the chain; first to play all tiles wins. */
(function () {
  const F = Funkloch;
  const PIPS = {
    0: [], 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [3, 1], [1, 3], [3, 3]],
    5: [[1, 1], [3, 1], [2, 2], [1, 3], [3, 3]], 6: [[1, 1], [3, 1], [1, 2], [3, 2], [1, 3], [3, 3]],
  };
  const half = (v, ox) => PIPS[v].map(([x, y]) => `<circle cx="${ox + x * 10}" cy="${y * 10 + 0}" r="3.6" style="fill:var(--ink)"/>`).join('');
  // horizontal tile 100x50 (left value a, right value b); vertical = same tile rotated
  function tile(a, b, w, vert, cls = '') {
    const h = w / 2;
    const body = `<rect x="2" y="2" width="96" height="46" rx="9" style="fill:var(--card);stroke:var(--ink)" stroke-width="3.2"/>
      <path d="M50,8 L50,42" style="stroke:var(--ink-soft)" stroke-width="2.4" stroke-linecap="round"/>
      <g transform="translate(-0,5)">${half(a, 0)}</g><g transform="translate(0,5)">${half(b, 50)}</g>`;
    return vert
      ? `<svg class="${cls}" viewBox="0 0 50 100" width="${h}" height="${w}" style="display:block;overflow:visible"><g transform="translate(50,0) rotate(90)">${body}</g></svg>`
      : `<svg class="${cls}" viewBox="0 0 100 50" width="${w}" height="${h}" style="display:block;overflow:visible">${body}</svg>`;
  }
  const backTile = (w) => `<svg viewBox="0 0 50 100" width="${w}" height="${w * 2}" style="display:block"><rect x="2" y="2" width="46" height="96" rx="9" style="fill:var(--c-duo);stroke:var(--ink)" stroke-width="3.2"/><path d="M12,30 q13,-10 26,0 M12,50 q13,-10 26,0 M12,70 q13,-10 26,0" fill="none" style="stroke:var(--ink)" stroke-width="2.4" stroke-linecap="round"/></svg>`;
  const sum = (t) => t[0] + t[1];

  F.registerGame({
    id: 'dominoes', skill: 'fun', added: '2026-11-15', glyph: '•|••',
    name: { de: 'Domino', en: 'Dominoes' },
    desc: {
      de: 'Spiele gegen den Computer. Lege einen Stein mit passender Augenzahl an ein Ende der Kette. Hast du keinen, ziehst du aus dem Vorrat. Wer zuerst alle Steine los ist, gewinnt. Sind beide blockiert, gewinnt, wer weniger Augen übrig hat.',
      en: 'Play against the computer. Put a tile with a matching number of pips on one end of the chain. If you have none, draw from the pile. Whoever plays all tiles first wins. If both get stuck, the one with fewer pips left wins.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = ctx.level || 0;
      const all = [];
      for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) all.push([a, b]);
      const deck = r.shuffle(all);
      const hands = { me: deck.slice(0, 7), cpu: deck.slice(7, 14) };
      const pile = deck.slice(14);
      let chain = [], turn, over = false, passes = 0, sel = -1, busy = true;

      ctx.el.innerHTML = '';
      const cpuRow = F.h('<div style="display:flex;align-items:center;gap:6px;min-height:50px;margin-top:4px"></div>');
      const board = F.h(`<div class="sketch" style="margin:8px 0;padding:10px 8px;background:var(--c-spatial);box-shadow:var(--shadow);min-height:290px;transform:rotate(-0.4deg);position:relative;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" fill="none" stroke-linecap="round"><path d="M6,18 q8,-6 16,0 M70,90 q10,-6 20,0 M80,12 q6,6 12,0 M10,80 q8,6 16,0" style="stroke:var(--ink)" stroke-width="0.8" opacity=".25"/></svg><div class="dm-chain" style="display:flex;flex-wrap:wrap;gap:4px;justify-content:center;align-content:center;width:100%"></div></div>`);
      const chainEl = board.querySelector(".dm-chain");
      const msg = F.h('<div class="info-line" style="text-align:center;min-height:28px;font-size:19px"></div>');
      const handEl = F.h('<div style="display:flex;justify-content:center;gap:6px;margin-top:6px"></div>');
      const drawBtn = F.h(`<button class="btn block" style="margin-top:10px;min-height:52px">${F.esc(F.tt({ de: 'Stein ziehen', en: 'Draw a tile' }))}</button>`);
      ctx.el.append(cpuRow, board, msg, handEl, drawBtn);

      const leftV = () => chain[0][0], rightV = () => chain[chain.length - 1][1];
      const fits = (t) => !chain.length ? [] : [t.includes(leftV()) ? 'L' : '', t.includes(rightV()) ? 'R' : ''].filter(Boolean);
      const canPlay = (who) => hands[who].some((t) => !chain.length || fits(t).length);
      function place(t, side) {
        if (!chain.length) chain.push(t.slice());
        else if (side === 'R') chain.push(t[0] === rightV() ? [t[0], t[1]] : [t[1], t[0]]);
        else chain.unshift(t[1] === leftV() ? [t[0], t[1]] : [t[1], t[0]]);
      }
      function remove(who, t) { const i = hands[who].indexOf(t); if (i >= 0) hands[who].splice(i, 1); }

      let lastAdded = -1;
      function render() {
        // computer hand
        cpuRow.innerHTML = `<span style="font-size:16px;color:var(--ink-soft);margin-right:2px">🤖</span>` + hands.cpu.map(() => backTile(17)).join('') + `<span style="margin-left:auto;font-size:16px;color:var(--ink-soft)">${F.esc(F.tt({ de: 'Vorrat', en: 'Pile' }))}: ${pile.length}</span>`;
        // chain
        chainEl.innerHTML = '';
        const w = chain.length > 12 ? 44 : chain.length > 6 ? 52 : 62;
        const ghost = (side, v) => {
          const g = F.h(`<button style="min-width:${w}px;width:${w}px;height:${w / 2}px;min-height:0;padding:0;border:2.5px dashed var(--ink);border-radius:9px;background:var(--accent);color:#1b1b1b;font-size:18px;cursor:pointer" class="pop-in">${side === 'L' ? '◀' : '▶'} ${v}</button>`);
          g.addEventListener('pointerdown', (e) => { e.preventDefault(); if (sel >= 0 && !over && turn === 'me') play('me', hands.me[sel], side); });
          return g;
        };
        const t = sel >= 0 ? hands.me[sel] : null;
        const fs = t ? fits(t) : [];
        if (fs.length > 1 || (t && fs.length === 1)) { /* ghosts shown only when both ends */ }
        if (t && fs.length > 1) chainEl.appendChild(ghost('L', leftV()));
        chain.forEach((c, i) => { const d = F.h(`<div style="line-height:0">${tile(c[0], c[1], w, false, i === lastAdded ? 'pop-in' : '')}</div>`); chainEl.appendChild(d); });
        if (t && fs.length > 1) chainEl.appendChild(ghost('R', rightV()));
        // my hand
        handEl.innerHTML = '';
        const tw = hands.me.length > 7 ? 38 : 46;
        hands.me.forEach((tl, i) => {
          const ok = turn === 'me' && !over && (!chain.length || fits(tl).length);
          const b = F.h(`<button style="border:0;background:transparent;padding:0;min-width:0;line-height:0;cursor:pointer;opacity:${turn === 'me' && !ok ? 0.4 : 1};transform:${sel === i ? 'translateY(-12px)' : 'none'};transition:transform .15s;-webkit-tap-highlight-color:transparent;filter:${sel === i ? 'drop-shadow(0 0 0 var(--accent)) drop-shadow(0 3px 0 var(--accent))' : 'none'}">${tile(tl[0], tl[1], tw * 2, true)}</button>`);
          b.addEventListener('pointerdown', (e) => { e.preventDefault(); tapTile(i); });
          handEl.appendChild(b);
        });
        handEl.style.flexWrap = hands.me.length > 9 ? 'wrap' : 'nowrap';
        drawBtn.style.display = !over && turn === 'me' && !canPlay('me') ? '' : 'none';
        drawBtn.textContent = pile.length ? F.tt({ de: 'Stein ziehen', en: 'Draw a tile' }) : F.tt({ de: 'Passen', en: 'Pass' });
      }

      function tapTile(i) {
        if (over || busy || turn !== 'me') return;
        const t = hands.me[i], fs = chain.length ? fits(t) : ['R'];
        if (!fs.length) { ctx.sfx('bad'); const b = handEl.children[i]; b.classList.remove('flash-bad'); void b.offsetWidth; b.classList.add('flash-bad'); return; }
        ctx.sfx('tap');
        if (fs.length === 1 || leftV() === rightV()) return play('me', t, fs[0]);
        sel = sel === i ? -1 : i; render();
      }

      async function play(who, t, side) {
        remove(who, t); place(t, side); sel = -1; passes = 0;
        lastAdded = side === 'L' && chain.length > 1 ? 0 : chain.length - 1;
        ctx.sfx(who === 'me' ? 'good' : 'tick');
        render();
        if (!hands[who].length) return finish(who);
        await nextTurn(who === 'me' ? 'cpu' : 'me');
      }

      async function nextTurn(who) {
        turn = who; busy = who === 'cpu'; render();
        if (who === 'me') {
          msg.textContent = canPlay('me') ? F.tt({ de: 'Du bist dran: tippe einen Stein', en: 'Your turn: tap a tile' })
            : pile.length ? F.tt({ de: 'Kein passender Stein: ziehe einen', en: 'No matching tile: draw one' }) : F.tt({ de: 'Kein Zug möglich: passe', en: 'No move: pass' });
          return;
        }
        msg.textContent = F.tt({ de: 'Der Computer überlegt …', en: 'The computer is thinking …' });
        await ctx.wait(900);
        let guard = 0;
        while (!canPlay('cpu') && pile.length && guard++ < 30) { hands.cpu.push(pile.pop()); ctx.sfx('tick'); render(); await ctx.wait(450); }
        if (!canPlay('cpu')) return pass('cpu');
        const opts = hands.cpu.filter((t) => !chain.length || fits(t).length);
        let t;
        if (lvl < 2) t = r.pick(opts);
        else t = opts.slice().sort((a, b) => sum(b) - sum(a) + (a[0] === a[1] ? -0.5 : 0) * 0)[0];
        const fs = fits(t);
        const side = fs.length > 1 ? (lvl >= 2 && r.chance(0.5) ? 'L' : 'R') : fs[0] || 'R';
        busy = false; await play('cpu', t, side);
      }

      async function pass(who) {
        passes++;
        ctx.sfx('tick');
        msg.textContent = who === 'me' ? F.tt({ de: 'Du passt.', en: 'You pass.' }) : F.tt({ de: 'Der Computer passt.', en: 'The computer passes.' });
        if (passes >= 2) return finish(null);
        await ctx.wait(800);
        await nextTurn(who === 'me' ? 'cpu' : 'me');
      }

      drawBtn.addEventListener('pointerdown', async (e) => {
        e.preventDefault();
        if (over || busy || turn !== 'me') return;
        if (pile.length) { hands.me.push(pile.pop()); ctx.sfx('tap'); render(); if (canPlay('me')) { msg.textContent = F.tt({ de: 'Jetzt passt ein Stein', en: 'Now one fits' }); } return; }
        busy = true; await pass('me');
      });

      async function finish(winner) {
        over = true; busy = true; render();
        const pm = hands.me.reduce((s, t) => s + sum(t), 0), pc = hands.cpu.reduce((s, t) => s + sum(t), 0);
        const w = winner || (pm < pc ? 'me' : pc < pm ? 'cpu' : 'draw');
        const score = w === 'me' ? 20 + pc : w === 'draw' ? 10 : Math.max(2, 8 - Math.floor(pm / 5));
        msg.textContent = w === 'me' ? F.tt({ de: 'Gewonnen!', en: 'You win!' }) : w === 'draw' ? F.tt({ de: 'Unentschieden', en: 'A draw' }) : F.tt({ de: 'Der Computer gewinnt', en: 'The computer wins' });
        ctx.setScore(score);
        board.classList.add(w === 'me' ? 'flash-ok' : 'flash-bad');
        if (w === 'me') { ctx.sfx('win'); F.cheer(14); } else ctx.sfx('bad');
        await ctx.wait(1500);
        ctx.finish({
          score, detail: F.tt({ de: `Übrige Augen: du ${pm}, Computer ${pc}`, en: `Pips left: you ${pm}, computer ${pc}` }),
          levelDelta: w === 'me' ? 1 : w === 'cpu' ? -1 : 0, quality: w === 'me' ? 1 : w === 'draw' ? 0.5 : 0.2, ink: 4 + Math.round(score / 4),
        });
      }

      // the player with the highest double (else the highest tile) starts
      const best = (h) => h.reduce((m, t) => { const k = (t[0] === t[1] ? 100 : 0) + sum(t); return k > m.k ? { k, t } : m; }, { k: -1, t: null });
      const bm = best(hands.me), bc = best(hands.cpu);
      turn = bm.k >= bc.k ? 'me' : 'cpu';
      ctx.setScore(0); ctx.setInfo(F.esc(F.tt({ de: 'Der höchste Doppelstein beginnt', en: 'The highest double starts' })));
      render();
      (async () => {
        await ctx.wait(700);
        const st = turn === 'me' ? bm.t : bc.t;
        msg.textContent = turn === 'me' ? F.tt({ de: 'Du beginnst', en: 'You start' }) : F.tt({ de: 'Der Computer beginnt', en: 'The computer starts' });
        await ctx.wait(500);
        busy = false;
        if (turn === 'me') { sel = -1; render(); /* player starts with any tile: starting tile is forced */ await play('me', st, 'R'); }
        else await play('cpu', st, 'R');
      })();
    },
  });
})();
