/* Pyramid Solitaire (classic card game): remove pairs of free cards that add up to 13, kings go alone.
   Clear the whole pyramid to win. Deals are generated so that each one can be solved. */
(function () {
  const F = Funkloch;
  const DEALS = 2, ROWS = 7, CW = 48, CH = 74, STEP = 50, RSTEP = 47;
  const SUITS = ['♠', '♥', '♦', '♣'], RANK = (v) => ({ 1: 'A', 11: 'J', 12: 'Q', 13: 'K' }[v] || String(v));
  const idx = (i, j) => (i * (i + 1)) / 2 + j;
  const pos = [];
  for (let i = 0; i < ROWS; i++) for (let j = 0; j <= i; j++) pos.push([i, j]);
  const kids = (p) => { const [i, j] = pos[p]; return i === ROWS - 1 ? [] : [idx(i + 1, j), idx(i + 1, j + 1)]; };

  // Build a removal order first (bottom cards become free, cards that cover nothing left get free),
  // then give every pair of the plan ranks that add up to 13. The rest of the deck becomes the stock.
  function makeDeal(r) {
    for (let tries = 0; tries < 300; tries++) {
      const gone = new Array(28).fill(false), plan = [];
      let left = 28, kings = 0, ok = true;
      const free = () => gone.map((g, p) => (!g && kids(p).every((k) => gone[k]) ? p : -1)).filter((p) => p >= 0);
      for (let g = 0; g < 40 && left > 0; g++) {
        const f = free();
        if (left === 1) { plan.push([f[0]]); gone[f[0]] = true; left--; kings++; continue; }
        if (kings === 0 && left > 4 && f.length >= 1 && r() < 0.08) { const p = r.pick(f); plan.push([p]); gone[p] = true; left--; kings++; continue; }
        if (f.length < 2) { ok = false; break; }
        const [a, b] = r.shuffle(f);
        plan.push([a, b]); gone[a] = gone[b] = true; left -= 2;
      }
      if (!ok || left > 0 || kings !== 2) continue;
      const cnt = Array(14).fill(4), vals = new Array(28);
      let good = true;
      for (const g of plan) {
        if (g.length === 1) { if (cnt[13] < 1) { good = false; break; } cnt[13]--; vals[g[0]] = 13; continue; }
        const opts = [1, 2, 3, 4, 5, 6].filter((a) => cnt[a] > 0 && cnt[13 - a] > 0);
        if (!opts.length) { good = false; break; }
        const a = r.pick(opts); cnt[a]--; cnt[13 - a]--;
        if (r() < 0.5) { vals[g[0]] = a; vals[g[1]] = 13 - a; } else { vals[g[0]] = 13 - a; vals[g[1]] = a; }
      }
      if (!good) continue;
      const rest = [];
      for (let v = 1; v <= 13; v++) for (let c = 0; c < cnt[v]; c++) rest.push(v);
      const suitLeft = Array.from({ length: 14 }, () => r.shuffle([0, 1, 2, 3]));
      const mk = (v) => ({ v, s: suitLeft[v].pop() });
      const pyr = vals.map(mk);
      const stock = r.shuffle(rest).map(mk);
      return { pyr, stock };
    }
    return null;
  }
  function fallbackDeal(r) { // never expected; plain shuffle of a real deck
    const all = [];
    for (let v = 1; v <= 13; v++) for (let s = 0; s < 4; s++) all.push({ v, s });
    const d = r.shuffle(all);
    return { pyr: d.slice(0, 28), stock: d.slice(28) };
  }

  F.registerGame({
    id: 'pyramid-solitaire', skill: 'math', added: '2026-11-17', glyph: '🂡',
    name: { de: 'Pyramiden-Solitär', en: 'Pyramid Solitaire' },
    desc: {
      de: 'Tippe zwei freie Karten, die zusammen 13 ergeben (zum Beispiel 6 und 7). Ein König (13) geht allein weg. Eine Karte ist frei, wenn keine andere mehr auf ihr liegt. Ziehe neue Karten vom Stapel. Räume die ganze Pyramide ab, um zu gewinnen. 2 Runden.',
      en: 'Tap two free cards that add up to 13 (for example 6 and 7). A king (13) leaves alone. A card is free when no other card lies on it. Draw new cards from the pile. Clear the whole pyramid to win. 2 deals.',
    },
    start(ctx) {
      const r = ctx.rng;
      let deal = 0, points = 0, cleared = 0, undos = 0;
      const t = (o) => F.esc(F.tt(o));
      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };

      function nextDeal() {
        if (deal >= DEALS) return end();
        deal++;
        const d0 = ctx.fresh(() => makeDeal(r) || fallbackDeal(r), (x) => x.pyr.map((c) => c.v + '' + c.s).join(','));
        let pyr = d0.pyr.map((c) => ({ ...c, gone: false })), stock = d0.stock.map((c) => ({ ...c })), waste = [], recycles = 1, sel = null, over = false, removedPairs = 0;
        const hist = [];
        ctx.setInfo(`${deal} / ${DEALS}`); ctx.setScore(points);
        ctx.el.innerHTML = '';

        const W = STEP * 6 + CW;
        const felt = F.h(`<div class="sketch pop-in" style="padding:12px 0 8px;margin:6px 0 8px;background:var(--c-math);box-shadow:var(--shadow);transform:rotate(-0.3deg)"><div class="py-pyr" style="position:relative;width:${W}px;max-width:100%;height:${CH + RSTEP * 6}px;margin:0 auto"></div></div>`);
        const pyrEl = felt.firstChild;
        const low = F.h(`<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px"></div>`);
        const stockBtn = F.h(`<button class="py-stock" style="position:relative;width:${CW + 22}px;height:${CH + 22}px;padding:0;border:0;background:transparent;cursor:pointer;-webkit-tap-highlight-color:transparent"></button>`);
        const wasteEl = F.h(`<div class="py-waste" style="position:relative;width:${CW + 22}px;height:${CH + 22}px"></div>`);
        const side = F.h(`<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:8px"></div>`);
        const undoBtn = F.h(`<button class="opt" style="min-height:56px;font-size:21px;padding:4px 8px">↶ ${t({ de: 'Zurück', en: 'Undo' })}</button>`);
        const info = F.h(`<div style="font-size:18px;color:var(--ink-soft);text-align:center;min-height:46px"></div>`);
        side.append(undoBtn, info);
        low.append(stockBtn, side, wasteEl);
        const msg = F.h(`<div class="info-line" style="text-align:center;min-height:30px;font-size:20px"></div>`);
        ctx.el.append(felt, low, msg);

        const cardHTML = (c, w, h, extra, covered) => `<div style="width:${w}px;height:${h}px;box-sizing:border-box;position:relative;background:${covered ? 'var(--paper-2)' : 'var(--card)'};border:2.5px solid var(--ink);border-radius:8px 10px 8px 10px;color:${c.s === 1 || c.s === 2 ? 'var(--bad)' : 'var(--ink)'};box-shadow:2px 2px 0 var(--ink);line-height:1;${extra || ''}"><div style="position:absolute;left:4px;top:2px;font-size:${Math.round(w * 0.4)}px;text-align:center"><b style="font-weight:400;display:block">${RANK(c.v)}</b><span style="display:block;font-size:${Math.round(w * 0.3)}px">${SUITS[c.s]}</span></div><span style="position:absolute;right:4px;bottom:3px;font-size:${Math.round(w * 0.5)}px">${SUITS[c.s]}</span></div>`;
        const backHTML = (w, h) => `<div style="width:${w}px;height:${h}px;box-sizing:border-box;border:2.5px solid var(--ink);border-radius:8px 10px 8px 10px;background:repeating-linear-gradient(45deg,var(--accent) 0 6px,var(--card) 6px 12px);box-shadow:2px 2px 0 var(--ink)"></div>`;
        const isFree = (p) => !pyr[p].gone && kids(p).every((k) => pyr[k].gone);
        const wasteTop = () => waste[waste.length - 1];

        function snapshot() { hist.push({ pyr: pyr.map((c) => ({ ...c })), stock: stock.slice(), waste: waste.slice(), recycles, removedPairs }); if (hist.length > 60) hist.shift(); }
        function render() {
          pyrEl.innerHTML = '';
          const left0 = (W - (STEP * 6 + CW)) / 2;
          pyr.forEach((c, p) => {
            if (c.gone) return;
            const [i, j] = pos[p];
            const x = left0 + STEP * (3 - i / 2 + j) , y = i * RSTEP, free = isFree(p), s = sel && sel.kind === 'p' && sel.p === p;
            const el = F.h(`<button style="position:absolute;left:${x}px;top:${y}px;width:${CW}px;height:${CH}px;padding:0;border:0;background:transparent;cursor:pointer;z-index:${i};transform:translateY(${s ? -7 : 0}px);transition:transform .12s;-webkit-tap-highlight-color:transparent">${cardHTML(c, CW, CH, `${free ? '' : 'filter:saturate(.6);'}${s ? 'outline:4px solid var(--accent);outline-offset:1px;' : ''}`, !free)}</button>`);
            el.addEventListener('pointerdown', (e) => { e.preventDefault(); tapCard({ kind: 'p', p, c }, el); });
            pyrEl.appendChild(el);
          });
          stockBtn.innerHTML = stock.length ? `<div style="position:absolute;left:8px;top:8px">${backHTML(CW, CH)}</div><div style="position:absolute;left:3px;top:3px">${backHTML(CW, CH)}</div><div style="position:absolute;left:0;top:0">${backHTML(CW, CH)}</div><span style="position:absolute;right:0;bottom:-2px;font-size:19px;background:var(--card);border:2px solid var(--ink);border-radius:10px;padding:0 6px">${stock.length}</span>`
            : `<div style="width:${CW}px;height:${CH}px;border:2.5px dashed var(--ink-faint);border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:28px;color:var(--ink-soft)">${recycles > 0 && waste.length ? '↻' : '✕'}</div>`;
          const w = wasteTop(), ws = sel && sel.kind === 'w';
          wasteEl.innerHTML = '';
          if (w) {
            const el = F.h(`<button style="position:absolute;left:0;top:0;padding:0;border:0;background:transparent;cursor:pointer;transform:translateY(${ws ? -7 : 0}px);transition:transform .12s;-webkit-tap-highlight-color:transparent">${cardHTML(w, CW + 14, CH + 14, ws ? 'outline:4px solid var(--accent);outline-offset:1px;' : '')}</button>`);
            el.addEventListener('pointerdown', (e) => { e.preventDefault(); tapCard({ kind: 'w', c: w }, el); });
            wasteEl.appendChild(el);
          } else wasteEl.innerHTML = `<div style="width:${CW + 14}px;height:${CH + 14}px;border:2.5px dashed var(--ink-faint);border-radius:8px"></div>`;
          info.innerHTML = `${t({ de: 'Paare', en: 'Pairs' })}: <b style="font-weight:400;color:var(--ink)">${removedPairs}</b><br>${recycles > 0 ? '↻ ' + recycles + '×' : ''}`;
          undoBtn.style.opacity = hist.length ? 1 : 0.4;
        }
        function movesLeft() {
          const av = [];
          pyr.forEach((c, p) => { if (isFree(p)) av.push(c.v); });
          const w = wasteTop(); if (w) av.push(w.v);
          if (av.includes(13)) return true;
          for (let a = 0; a < av.length; a++) for (let b = a + 1; b < av.length; b++) if (av[a] + av[b] === 13) return true;
          return stock.length > 0 || (recycles > 0 && waste.length > 0);
        }
        async function removeCards(list) {
          snapshot();
          list.forEach((o) => { if (o.kind === 'p') pyr[o.p].gone = true; else waste.pop(); });
          sel = null; ctx.sfx('good'); render();
          if (pyr.every((c) => c.gone)) return win();
          if (!movesLeft()) return lose();
          msg.textContent = '';
        }
        function tapCard(o, el) {
          if (over) return;
          pop(el);
          if (o.kind === 'p' && !isFree(o.p)) { ctx.sfx('tick'); msg.textContent = F.tt({ de: 'Diese Karte ist noch verdeckt.', en: 'This card is still covered.' }); return; }
          if (o.c.v === 13) { removedPairs += 0; points += 5; ctx.setScore(points); cleared++; return removeCards([o]); }
          if (!sel) { sel = o; ctx.sfx('tap'); render(); msg.textContent = F.tt({ de: `Du brauchst eine ${13 - o.c.v}`, en: `You need a ${13 - o.c.v}` }); return; }
          if (sel.kind === o.kind && sel.p === o.p) { sel = null; render(); msg.textContent = ''; return; }
          if (sel.c.v + o.c.v === 13) {
            const pair = [sel, o]; removedPairs++; points += 10; ctx.setScore(points); cleared += 2;
            return removeCards(pair);
          }
          ctx.sfx('bad'); el.classList.remove('flash-bad'); void el.offsetWidth; el.classList.add('flash-bad');
          msg.textContent = F.tt({ de: `${RANK(sel.c.v)} + ${RANK(o.c.v)} ergibt ${sel.c.v + o.c.v}, nicht 13.`, en: `${RANK(sel.c.v)} + ${RANK(o.c.v)} makes ${sel.c.v + o.c.v}, not 13.` });
          sel = null; render();
        }
        stockBtn.addEventListener('pointerdown', (e) => {
          e.preventDefault(); if (over) return;
          pop(stockBtn);
          if (stock.length) { snapshot(); waste.push(stock.pop()); sel = null; ctx.sfx('tap'); render(); if (!movesLeft()) lose(); }
          else if (recycles > 0 && waste.length) { snapshot(); stock = waste.reverse(); waste = []; recycles--; sel = null; ctx.sfx('tick'); render(); msg.textContent = F.tt({ de: 'Stapel nochmals gemischt: ein Durchgang mehr.', en: 'Pile turned over for another pass.' }); }
          else ctx.sfx('tick');
        });
        undoBtn.addEventListener('pointerdown', (e) => {
          e.preventDefault(); if (over || !hist.length) return;
          const h = hist.pop(); pyr = h.pyr; stock = h.stock; waste = h.waste; recycles = h.recycles; removedPairs = h.removedPairs; sel = null; undos++; ctx.sfx('tick'); pop(undoBtn); render(); msg.textContent = '';
        });
        async function win() {
          over = true; points += 40 + stock.length; ctx.setScore(points); ctx.sfx('win'); F.cheer(14);
          felt.classList.add('flash-ok'); msg.textContent = F.tt({ de: 'Pyramide abgeräumt! ⭐', en: 'Pyramid cleared! ⭐' });
          await ctx.wait(1400); nextDeal();
        }
        async function lose() {
          over = true; ctx.sfx('bad'); msg.textContent = F.tt({ de: 'Keine Züge mehr. Nächste Runde …', en: 'No more moves. Next deal …' });
          felt.classList.add('flash-bad');
          await ctx.wait(1600); nextDeal();
        }
        render();
      }
      function end() {
        const won = points >= 100;
        ctx.finish({
          score: points,
          detail: F.tt({ de: `${cleared} Karten abgeräumt, ${undos}× zurück`, en: `${cleared} cards cleared, ${undos}× undo` }),
          levelDelta: points >= 150 ? 1 : points < 60 ? -1 : 0,
          quality: Math.min(1, points / 180), ink: 4 + Math.round(points / 12),
        });
        void won;
      }
      nextDeal();
    },
  });
})();
