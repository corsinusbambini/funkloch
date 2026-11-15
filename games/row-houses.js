/* Row Houses: memorise who lives in which coloured house on a little street, then answer questions about it. */
(function () {
  const F = Funkloch;
  const COLORS = ['#E8574F', '#F2B84B', '#5FAF7A', '#5B9BE0', '#A27BD8', '#F07FB0'];
  const CNAME = { de: ['Rot', 'Gelb', 'Grün', 'Blau', 'Violett', 'Rosa'], en: ['red', 'yellow', 'green', 'blue', 'purple', 'pink'] };
  const ANIMALS = ['🐱', '🐶', '🐰', '🐻', '🦊', '🐸', '🐧', '🐼', '🐯', '🐮', '🐷', '🐵', '🦁', '🐨', '🦉', '🐢'];
  const ROUNDS = 3, QS = 3;

  function street(n, houses, hidden, mark) {
    const W = 60, H = 104;
    const hs = houses.map((h, i) => {
      const x = i * W + 4, fill = hidden ? 'var(--paper-2)' : h.color;
      const lit = mark === i;
      return `<g class="${lit ? 'tap-pop' : ''}" style="transform-box:fill-box;transform-origin:center">
        <path d="M${x + 2},40 L${x + 2},96 L${x + 50},97 L${x + 50},40 Z" style="fill:${fill};stroke:var(--ink)" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M${x - 3},42 L${x + 26},12 L${x + 55},42 Z" style="fill:${hidden ? 'var(--card)' : 'var(--paper-2)'};stroke:var(--ink)" stroke-width="2.6" stroke-linejoin="round"/>
        <path d="M${x + 12},38 L${x + 26},24" style="stroke:var(--ink-soft)" stroke-width="2" stroke-linecap="round" fill="none"/>
        <rect x="${x + 10}" y="50" width="22" height="20" rx="4" style="fill:var(--card);stroke:var(--ink)" stroke-width="2.2"/>
        <text x="${x + 21}" y="66" text-anchor="middle" font-size="17" fill="currentColor" stroke="none">${hidden ? '' : h.animal}</text>
        <path d="M${x + 36},96 L${x + 36},72 Q${x + 41},66 ${x + 46},72 L${x + 46},96 Z" style="fill:var(--card);stroke:var(--ink)" stroke-width="2"/>
        ${hidden ? `<text x="${x + 26}" y="${H + 16}" text-anchor="middle" font-size="15" stroke="none" style="fill:var(--ink-soft)">${i + 1}</text>` : ''}
      </g>`;
    }).join('');
    return `<svg class="motif" viewBox="0 0 ${n * W + 8} ${H + 68}" style="width:100%;transform:rotate(-0.8deg)" fill="none" stroke-linecap="round">
      <g stroke-linejoin="round" style="stroke:var(--ink)" stroke-width="2.4"><circle cx="${n * W - 24}" cy="26" r="13" style="fill:#F2B84B;stroke:var(--ink)"/><path d="M${n * W - 24},4 v-4 M${n * W - 2},26 h4 M${n * W - 46},26 h-4 M${n * W - 40},10 l-3,-3 M${n * W - 8},10 l3,-3" fill="none"/>
        <path d="M18,40 q-12,0 -10,-9 q2,-8 12,-6 q4,-9 16,-6 q10,3 8,11 q10,2 6,10 Z" style="fill:var(--card);stroke:var(--ink)"/></g>
      <g transform="translate(0,46)"><path d="M2,${H + 1} C${n * 15},${H - 3} ${n * 40},${H + 4} ${n * W + 6},${H}" style="stroke:var(--ink)" stroke-width="3"/>${hs}</g></svg>`;
  }

  F.registerGame({
    id: 'row-houses', skill: 'memory', added: '2026-11-15', glyph: '🏘️',
    name: { de: 'Häuserreihe', en: 'Row Houses' },
    desc: {
      de: 'Eine kleine Strasse mit bunten Häusern: In jedem wohnt ein Tier. Merke dir Farben, Tiere und Reihenfolge, bevor die Häuser grau werden. Danach kommen Fragen, zum Beispiel „Wer wohnte im blauen Haus?“. In 3 Strassen mit je 3 Fragen gewinnst du mit möglichst vielen richtigen Antworten.',
      en: 'A little street of coloured houses, and an animal lives in each one. Remember the colours, the animals and their order before the houses turn grey. Then come questions like “Who lived in the blue house?”. Answer as many as you can across 3 streets with 3 questions each.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = ctx.level || 0;
      let round = 0, right = 0, asked = 0;

      function next() {
        if (round >= ROUNDS) return end();
        round++;
        const n = (lvl < 2 ? [4, 4, 5] : lvl < 6 ? [4, 5, 6] : [5, 6, 6])[round - 1];
        const cols = r.shuffle(COLORS).slice(0, n), ans = r.shuffle(ANIMALS).slice(0, n);
        const houses = cols.map((c, i) => ({ color: c, ci: COLORS.indexOf(c), animal: ans[i] }));
        ctx.setInfo(F.esc(F.tt({ de: `Strasse ${round} / ${ROUNDS}: merken!`, en: `Street ${round} / ${ROUNDS}: remember!` })));
        ctx.el.innerHTML = '';
        const scene = F.h(`<div class="sketch pop-in" style="padding:12px 8px 10px;margin:6px 0 12px;background:var(--c-memory);box-shadow:var(--shadow);transform:rotate(0.4deg)">${street(n, houses, false)}</div>`);
        const area = F.h('<div></div>');
        ctx.el.append(scene, area);
        const ms = n * 1700 + 1500;
        const ready = F.h(`<button class="btn primary big block" style="margin-top:14px">${F.esc(F.tt({ de: 'Ich habe sie mir gemerkt', en: 'I remember them' }))}</button>`);
        const tb = ctx.timer(area, ms, () => ask(0));
        area.appendChild(ready);
        ready.addEventListener('pointerdown', (e) => { e.preventDefault(); tb.stop(); ask(0); });

        function ask(qi) {
          if (ctx.dead) return;
          if (qi >= QS) return next();
          if (qi === 0) { scene.innerHTML = street(n, houses, true); scene.style.background = 'var(--paper)'; }
          ctx.setInfo(F.esc(F.tt({ de: `Strasse ${round} / ${ROUNDS} · Frage ${qi + 1} / ${QS}`, en: `Street ${round} / ${ROUNDS} · question ${qi + 1} / ${QS}` })));
          const h = r.pick(houses), hi = houses.indexOf(h);
          const kind = r.pick(['who', 'col', 'num']);
          let q = '', clue = '', opts = [], correct;
          const swatch = (c) => `<svg viewBox="0 0 44 44" width="44" height="44" aria-hidden="true"><path d="M5,22 L22,5 L39,22 L39,39 L5,39 Z" style="fill:${c};stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/></svg>`;
          if (kind === 'who') {
            q = { de: 'Wer wohnte im Haus mit dieser Farbe?', en: 'Who lived in the house with this colour?' };
            clue = swatch(h.color);
            const pool = r.shuffle(ans.filter((a) => a !== h.animal).concat(ANIMALS.filter((a) => !ans.includes(a)).slice(0, 2)));
            opts = r.shuffle([h.animal].concat(pool.slice(0, 3))).map((a) => ({ k: a, html: `<span style="font-size:42px">${a}</span>` }));
            correct = h.animal;
          } else if (kind === 'col') {
            q = { de: 'Welche Farbe hatte das Haus dieses Tiers?', en: 'What colour was this animal’s house?' };
            clue = `<span style="font-size:44px">${h.animal}</span>`;
            const pool = r.shuffle(COLORS.filter((c) => c !== h.color));
            opts = r.shuffle([h.color].concat(pool.slice(0, 3))).map((c) => ({ k: c, html: swatch(c) }));
            correct = h.color;
          } else {
            q = { de: 'In welchem Haus (von links) wohnte dieses Tier?', en: 'Which house (from the left) did this animal live in?' };
            clue = `<span style="font-size:44px">${h.animal}</span>`;
            const pool = r.shuffle([...Array(n).keys()].filter((i) => i !== hi));
            opts = r.shuffle([hi].concat(pool.slice(0, 3))).map((i) => ({ k: i, html: `<span style="font-size:36px">${i + 1}</span>` }));
            correct = hi;
          }
          area.innerHTML = '';
          const card = F.h(`<div class="card sketch pop-in" style="display:flex;align-items:center;justify-content:center;gap:14px;padding:12px;margin-bottom:12px;min-height:64px"><span style="font-size:19px;flex:1;min-width:0;text-align:left">${F.esc(F.tt(q))}</span>${clue}</div>`);
          const box = F.h('<div class="options tall"></div>');
          let locked = false;
          opts.forEach((o) => {
            const b = F.h(`<button class="opt" style="display:flex;align-items:center;justify-content:center;min-width:0;padding:0;min-height:96px">${o.html}</button>`);
            b.addEventListener('pointerdown', async (e) => {
              e.preventDefault();
              if (locked) return; locked = true; asked++;
              const ok = o.k === correct;
              b.classList.add(ok ? 'flash-ok' : 'flash-bad'); ctx.sfx(ok ? 'good' : 'bad');
              if (ok) { right++; ctx.setScore(right * 10); }
              else [...box.children].forEach((x, i) => { if (opts[i].k === correct) x.classList.add('flash-ok'); });
              scene.innerHTML = street(n, houses, false, hi); scene.style.background = 'var(--c-memory)';
              await ctx.wait(ok ? 900 : 1500);
              scene.innerHTML = street(n, houses, true); scene.style.background = 'var(--paper)';
              ask(qi + 1);
            });
            box.appendChild(b);
          });
          area.append(card, box);
        }
      }

      function end() {
        const total = ROUNDS * QS;
        if (right >= total - 1) { ctx.sfx('win'); F.cheer(10); }
        ctx.finish({
          score: right * 10,
          detail: F.tt({ de: `${right} von ${total} richtig`, en: `${right} of ${total} right` }),
          levelDelta: right >= total - 1 ? 1 : right <= 3 ? -1 : 0,
          quality: right / total, ink: 3 + right * 2,
        });
      }
      next();
    },
  });
})();
