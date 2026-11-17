/* Shopping List (memory): study the list on the notepad, then find exactly those things at the market stall. */
(function () {
  const F = Funkloch;
  const ROUNDS = 4, TOTAL = 12;
  const POOL = ['🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍒', '🍑', '🥭', '🍍', '🥝', '🍅', '🥕', '🌽', '🥦', '🥒', '🧅', '🥔', '🍄', '🥐', '🍞', '🥨', '🧀', '🥚', '🥛', '🍯', '🍪', '🍫', '🍩', '🐟', '🍗', '🥖', '🌶️', '🥑', '🍆', '🧄', '🫑'];

  F.registerGame({
    id: 'shopping-list', skill: 'memory', added: '2026-11-17', glyph: '📝',
    name: { de: 'Einkaufszettel', en: 'Shopping List' },
    desc: {
      de: 'Merke dir den Einkaufszettel. Danach stehen am Marktstand viele Dinge: Tippe genau die, die auf dem Zettel standen. Drei falsche Griffe pro Runde sind erlaubt. Schaffe 4 Einkäufe mit möglichst wenig Fehlern.',
      en: 'Memorise the shopping list. Then the market stall shows lots of things: tap exactly the ones that were on the list. Three wrong grabs per round are allowed. Complete 4 shopping trips with as few mistakes as possible.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = Math.max(0, Math.min(8, ctx.level || 0));
      let round = 0, points = 0, mistakes = 0, perfect = 0;
      const t = (o) => F.esc(F.tt(o));
      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };

      function make(n) {
        const all = r.shuffle(POOL);
        const list = all.slice(0, n), others = all.slice(n, TOTAL);
        return { list, stall: r.shuffle(list.concat(others)) };
      }
      function pad(inner, rot) {
        const rings = Array.from({ length: 7 }, (_, i) => `<path d="M${22 + i * 44},6 v18" stroke="var(--ink)" stroke-width="5" stroke-linecap="round"/><ellipse cx="${22 + i * 44}" cy="24" rx="4" ry="3" style="fill:var(--paper-2);stroke:var(--ink)" stroke-width="2"/>`).join('');
        return F.h(`<div class="sketch pop-in" style="padding:6px 12px 14px;margin:6px 0 10px;background:var(--card);box-shadow:var(--shadow);transform:rotate(${rot}deg)">
          <svg class="motif" viewBox="0 0 330 30" width="100%" height="30" aria-hidden="true" style="display:block;margin:0 auto 4px">${rings}</svg>${inner}</div>`);
      }
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        const n = Math.min(7, 3 + Math.floor(lvl / 2) + (round - 1));
        const q = ctx.fresh(() => make(n), (o) => o.list.join('') + o.stall.join(''));
        ctx.setScore(points); ctx.setInfo(`${round} / ${ROUNDS}`);
        ctx.el.innerHTML = '';
        const showMs = Math.max(3200, 2600 + 1000 * n - lvl * 150);
        const L = n <= 3 ? [1, 112, 64] : n === 4 ? [1, 92, 56] : n <= 6 ? [2, 112, 64] : [2, 96, 56], cols = L[0], rowH = L[1], em = L[2];
        const rowsHTML = q.list.map((e, i) => `<div style="flex:0 0 ${cols === 1 ? 100 : 50}%;display:flex;align-items:center;justify-content:center;gap:12px;height:${rowH}px;box-sizing:border-box"><span style="font-size:24px;color:var(--ink-soft);min-width:26px;text-align:right">${i + 1}.</span><span style="font-size:${em}px;line-height:1">${e}</span><svg width="26" height="26" viewBox="0 0 22 22" aria-hidden="true"><rect x="2.5" y="2.5" width="17" height="17" rx="4" fill="none" style="stroke:var(--ink)" stroke-width="2.2"/></svg></div>`).join('');
        const paper = pad(`<div style="text-align:center;font-size:26px;margin:2px 0 4px;color:var(--ink)">${t({ de: 'Einkaufszettel', en: 'Shopping list' })}</div>
          <div style="display:flex;flex-wrap:wrap;justify-content:center;row-gap:0;background-image:repeating-linear-gradient(transparent 0 ${rowH - 1}px,var(--ink-faint) ${rowH - 1}px ${rowH}px);padding:0 2px">${rowsHTML}</div>`, -0.8);
        const bar = F.h(`<div style="height:22px;border:2.5px solid var(--ink);border-radius:12px 16px 10px 14px;background:var(--card);overflow:hidden;margin:4px 0 14px"><div class="sl-bar" style="height:100%;background:var(--c-memory);transform-origin:left;transition:transform ${showMs}ms linear"></div></div>`);
        const go = F.h(`<button class="btn primary big" style="width:100%;min-height:76px;font-size:26px">${t({ de: 'Ich hab’s! ✓', en: 'Got it! ✓' })}</button>`);
        ctx.el.append(paper, bar, go);
        const fill = bar.firstChild;
        requestAnimationFrame(() => requestAnimationFrame(() => { fill.style.transform = 'scaleX(0)'; }));
        let started = false;
        const begin = () => { if (started || ctx.dead) return; started = true; stall(q, n); };
        go.addEventListener('pointerdown', (e) => { e.preventDefault(); ctx.sfx('tap'); begin(); });
        ctx.wait(showMs).then(begin);
      }
      function stall(q, n) {
        ctx.el.innerHTML = '';
        const found = new Set(), wrong = new Set();
        let wr = 0, done = false;
        const head = F.h(`<div style="text-align:center;font-size:24px;margin:6px 0 8px">${t({ de: `Finde alle ${n} Dinge vom Zettel`, en: `Find all ${n} things from the list` })}</div>`);
        const awning = `<svg class="motif" viewBox="0 0 330 36" width="100%" height="36" aria-hidden="true" style="display:block;margin:0 auto -2px">${Array.from({ length: 6 }, (_, i) => `<path d="M${i * 55 + 2},4 h51 v14 a25.5,16 0 0 1 -51,0 Z" style="fill:${i % 2 ? 'var(--card)' : 'var(--c-memory)'};stroke:var(--ink)" stroke-width="2.6" stroke-linejoin="round"/>`).join('')}</svg>`;
        const box = F.h(`<div class="sketch pop-in" style="padding:8px 10px 12px;margin:0 0 10px;background:var(--paper-2);box-shadow:var(--shadow);transform:rotate(0.5deg)">${awning}<div class="sl-grid" style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:8px"></div></div>`);
        const grid = box.querySelector('.sl-grid');
        const stat = F.h(`<div style="display:flex;justify-content:space-between;align-items:center;font-size:22px;margin-top:2px"><span class="sl-f"></span><span class="sl-h"></span></div>`);
        ctx.el.append(head, box, stat);
        const upd = () => {
          stat.querySelector('.sl-f').textContent = `🧺 ${found.size} / ${n}`;
          stat.querySelector('.sl-h').innerHTML = Array.from({ length: 3 }, (_, i) => `<span style="opacity:${i < 3 - wr ? 1 : 0.25}">❤️</span>`).join(' ');
        };
        upd();
        q.stall.forEach((e, i) => {
          const b = F.h(`<button style="width:100%;min-width:0;padding:0;aspect-ratio:1;font-size:54px;line-height:1;border:2.5px solid var(--ink);border-radius:${i % 2 ? '10px 14px 10px 12px' : '14px 10px 13px 10px'};cursor:pointer;color:var(--ink);background:var(--card);position:relative;-webkit-tap-highlight-color:transparent;box-shadow:var(--shadow)">${e}</button>`);
          b.addEventListener('pointerdown', (ev) => {
            ev.preventDefault();
            if (done || found.has(e) || wrong.has(e)) return;
            pop(b);
            if (q.list.includes(e)) {
              found.add(e); ctx.sfx('good'); b.style.background = 'var(--good)';
              b.insertAdjacentHTML('beforeend', '<span class="pop-in" style="position:absolute;right:2px;top:-2px;font-size:20px">✓</span>');
              upd();
              if (found.size === n) finish(true);
            } else {
              wrong.add(e); wr++; mistakes++; ctx.sfx('bad'); b.style.background = 'var(--bad)'; b.style.opacity = '0.55';
              b.classList.remove('flash-bad'); void b.offsetWidth; b.classList.add('flash-bad');
              b.insertAdjacentHTML('beforeend', '<span style="position:absolute;right:2px;top:-2px;font-size:20px">✗</span>');
              upd();
              if (wr >= 3) finish(false);
            }
          });
          grid.appendChild(b);
        });
        async function finish(ok) {
          done = true;
          if (ok) {
            const gain = 10 + n * 2 + (wr === 0 ? 8 : 0);
            points += gain; if (wr === 0) perfect++;
            ctx.setScore(points); ctx.sfx('win'); F.cheer(wr === 0 ? 12 : 6);
            head.textContent = F.tt({ de: wr === 0 ? 'Alles richtig! ⭐' : 'Alles gefunden!', en: wr === 0 ? 'All correct! ⭐' : 'Found everything!' });
          } else {
            points += found.size * 2; ctx.setScore(points);
            head.textContent = F.tt({ de: 'Leider vergessen. Gesucht waren:', en: 'Forgotten. You needed:' });
            q.list.forEach((e) => {
              [...grid.children].forEach((b, i) => { if (q.stall[i] === e && !found.has(e)) { b.style.outline = '4px solid var(--good)'; b.style.outlineOffset = '-2px'; } });
            });
          }
          await ctx.wait(ok ? 1000 : 2000);
          next();
        }
      }
      function end() {
        ctx.finish({
          score: points,
          detail: F.tt({ de: `${perfect} von ${ROUNDS} Einkäufen ohne Fehler, ${mistakes} falsche Griffe`, en: `${perfect} of ${ROUNDS} trips without a mistake, ${mistakes} wrong grabs` }),
          levelDelta: perfect >= 3 ? 1 : mistakes > 6 ? -1 : 0,
          quality: Math.max(0.2, 1 - mistakes * 0.08), ink: 5 + Math.round(points / 8),
        });
      }
      next();
    },
  });
})();
