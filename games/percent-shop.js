/* Percent Shop: sale prices, price rises and "which deal is cheaper?" - pick the right answer. */
(function () {
  const F = Funkloch;
  const ITEMS = [
    { e: '👟', de: 'Turnschuhe', en: 'sneakers' }, { e: '🧥', de: 'Jacke', en: 'jacket' }, { e: '🎒', de: 'Rucksack', en: 'backpack' },
    { e: '📚', de: 'Bücher', en: 'books' }, { e: '🎧', de: 'Kopfhörer', en: 'headphones' }, { e: '🕰️', de: 'Uhr', en: 'watch' },
    { e: '🪴', de: 'Pflanze', en: 'plant' }, { e: '🍫', de: 'Schokolade', en: 'chocolate' }, { e: '🧸', de: 'Teddy', en: 'teddy bear' },
    { e: '🛋️', de: 'Sessel', en: 'armchair' }, { e: '🚲', de: 'Velo', en: 'bike' }, { e: '☕', de: 'Kaffeemaschine', en: 'coffee machine' },
  ];

  // doodle: a price tag on a string with a big %, next to a little shopping bag
  function tagMotif() {
    return `<svg class="motif" viewBox="0 0 280 104" width="280" height="104" style="transform:rotate(-3deg);stroke:currentColor;stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round" aria-hidden="true">
      <path d="M14 14 q30 -4 46 26" style="fill:none;stroke-width:2"/>
      <path d="M58 40 L96 14 L196 18 Q200 52 194 88 L95 90 Z" style="fill:var(--c-math)"/>
      <circle cx="78" cy="46" r="7" style="fill:var(--paper)"/>
      <path d="M104 26 q30 -5 60 -2" style="fill:none;stroke:#fff;stroke-opacity:.6;stroke-width:3"/>
      <text x="146" y="76" text-anchor="middle" style="font-size:46px;fill:var(--ink);stroke:none">%</text>
      <path d="M212 46 L268 44 L264 98 L216 99 Z" style="fill:var(--card)"/>
      <path d="M226 46 q2 -22 14 -22 q13 0 14 21" style="fill:none"/>
      <path d="M222 60 L258 59" style="fill:none;stroke:var(--accent);stroke-width:4"/>
    </svg>`;
  }

  function make(r, level) {
    const it = ITEMS[r.int(0, ITEMS.length - 1)];
    const pcts = level >= 4 ? [5, 10, 15, 20, 25, 30, 40, 50, 60, 75] : [10, 20, 25, 50];
    const price = r.int(1, level >= 4 ? 20 : 10) * 20;
    const pct = pcts[r.int(0, pcts.length - 1)];
    const kinds = level >= 2 ? ['sale', 'rise', 'save', 'which', 'what'] : ['sale', 'rise', 'save'];
    const kind = kinds[r.int(0, kinds.length - 1)];
    const amt = price * pct / 100;
    let q, ans, wrong = [];
    if (kind === 'sale') {
      q = { de: `${it.e} ${it.de} kostet CHF ${price}. Heute ${pct}% Rabatt. Neuer Preis?`, en: `${it.e} ${it.en}: CHF ${price}. Today ${pct}% off. New price?` };
      ans = price - amt; wrong = [price + amt, amt, price - amt / 2, price - 2 * amt];
    } else if (kind === 'rise') {
      q = { de: `${it.e} ${it.de} kostet CHF ${price}. Der Preis steigt um ${pct}%. Neuer Preis?`, en: `${it.e} ${it.en}: CHF ${price}. The price rises by ${pct}%. New price?` };
      ans = price + amt; wrong = [price - amt, amt, price + amt * 2, price + amt / 2];
    } else if (kind === 'save') {
      q = { de: `${it.e} ${it.de} kostet CHF ${price}. Mit ${pct}% Rabatt: Wie viele Franken sparst du?`, en: `${it.e} ${it.en}: CHF ${price}. With ${pct}% off, how many francs do you save?` };
      ans = amt; wrong = [price - amt, amt * 2, amt / 2, amt + 10, amt - 5];
    } else if (kind === 'what') {
      const part = amt;
      q = { de: `${it.e} ${it.de}: CHF ${price} statt CHF ${price + part}. Wie viel Prozent Rabatt ist das?`, en: `${it.e} ${it.en}: CHF ${price} instead of CHF ${price + part}. What percent is that?` };
      // percent off the old price (price + part): part / (price + part)
      const old = price + part, off = Math.round(part / old * 100);
      if (part * 100 % old !== 0) return null;
      ans = off; wrong = [Math.round(part / price * 100), off + 5, off - 5, off + 10, 100 - off];
      return finish(q, ans, wrong, '%');
    } else {
      const p2 = r.int(1, level >= 4 ? 20 : 10) * 20, pct2 = pcts[r.int(0, pcts.length - 1)];
      const a = price * (100 - pct) / 100, b = p2 * (100 - pct2) / 100;
      if (a === b) return null;
      q = { de: `${it.e} ${it.de}: Angebot A: CHF ${price} mit ${pct}% Rabatt. Angebot B: CHF ${p2} mit ${pct2}% Rabatt. Was ist billiger?`, en: `${it.e} ${it.en}: Deal A: CHF ${price} with ${pct}% off. Deal B: CHF ${p2} with ${pct2}% off. Which is cheaper?` };
      return { q, opts: [{ de: 'Angebot A', en: 'Deal A' }, { de: 'Angebot B', en: 'Deal B' }], right: a < b ? 0 : 1, key: q.en };
    }
    return finish(q, ans, wrong, 'CHF');
  }
  function finish(q, ans, wrong, unit) {
    const set = [...new Set(wrong.filter((v) => v > 0 && v !== ans && Number.isInteger(v)))];
    let k = 1;
    for (let i = 0; set.length < 3 && i < 20; i++, k++) { const v = ans + (k % 2 ? 1 : -1) * 5 * Math.ceil(k / 2); if (v > 0 && v !== ans && !set.includes(v)) set.push(v); }
    return { q, ans, set, unit, key: q.en };
  }

  F.registerGame({
    id: 'percent-shop', skill: 'math', added: '2026-11-07', glyph: '%',
    name: { de: 'Prozent-Laden', en: 'Percent Shop' },
    desc: {
      de: 'Im Laden gibt es Rabatte und Preiserhöhungen. Rechne den richtigen Preis, die Ersparnis oder das billigere Angebot aus und tippe die richtige Antwort. 10 Fragen, jede richtige gibt Punkte.',
      en: 'The shop has sales and price rises. Work out the right price, the saving or the cheaper deal and tap the correct answer. 10 questions, every correct one scores points.',
    },
    start(ctx) {
      const r = ctx.rng, TOTAL = 10;
      let n = 0, right = 0, streak = 0, score = 0, over = false;
      ctx.el.innerHTML = '';
      const tagEl = F.h(`<div>${tagMotif()}</div>`);
      const qEl = F.h('<div class="card sketch" style="font-size:26px;line-height:1.3;text-align:center;margin:6px 0 0;min-height:188px;display:flex;align-items:center;justify-content:center;color:var(--ink)"></div>');
      const opts = F.h('<div class="options tall" style="margin-top:22px"></div>');
      const fb = F.h('<div class="info-line" style="text-align:center;min-height:28px;margin-top:10px"></div>');
      ctx.el.appendChild(tagEl); ctx.el.appendChild(qEl); ctx.el.appendChild(opts); ctx.el.appendChild(fb);
      function next() {
        if (over) return;
        if (n >= TOTAL) return end();
        n++;
        ctx.setScore(score); ctx.setInfo(`${n} / ${TOTAL}`);
        const item = ctx.fresh(() => { for (let i = 0; i < 20; i++) { const m = make(r, ctx.level); if (m) return m; } return make(r, 1) || { q: { de: '10% von 100?', en: '10% of 100?' }, ans: 10, set: [1, 100, 20], unit: '', key: 'x' + n }; }, (x) => x.key);
        let labels, correct;
        if (item.opts) { labels = item.opts.map((o) => F.tt(o)); correct = item.right; }
        else {
          const all = r.shuffle([item.ans, ...item.set.slice(0, 3)]);
          labels = all.map((v) => (item.unit === '%' ? v + '%' : 'CHF ' + v)); correct = all.indexOf(item.ans);
        }
        qEl.textContent = F.tt(item.q); fb.textContent = '';
        qEl.classList.remove('pop-in'); void qEl.offsetWidth; qEl.classList.add('pop-in');
        opts.innerHTML = ''; let locked = false;
        labels.forEach((lab, i) => {
          const b = F.h(`<button class="opt" style="min-width:0;padding:6px">${lab}</button>`);
          b.onclick = async () => {
            if (locked || over) return; locked = true;
            b.classList.add('tap-pop');
            if (i === correct) {
              right++; streak++; score += 10 + Math.min(streak - 1, 5) * 2; ctx.sfx('good');
              b.classList.add('right'); fb.textContent = F.tt({ de: 'Richtig!', en: 'Correct!' });
              if (n < TOTAL) F.cheer(8);
            } else {
              streak = 0; ctx.sfx('bad'); b.classList.add('wrong');
              opts.children[correct].classList.add('right');
              fb.textContent = F.tt({ de: 'Leider falsch.', en: 'Not quite.' });
            }
            ctx.setScore(score);
            await ctx.wait(i === correct ? 700 : 1400); next();
          };
          opts.appendChild(b);
        });
      }
      function end() {
        ctx.finish({
          score, detail: F.tt({ de: `${right}/${TOTAL} richtig`, en: `${right}/${TOTAL} correct` }),
          levelDelta: right >= 9 ? 1 : right < 5 ? -1 : 0, quality: right / TOTAL, ink: 2 + right,
        });
      }
      ctx.onCleanup(() => { over = true; });
      next();
    },
  });
})();
