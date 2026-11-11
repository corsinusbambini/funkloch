/* Receipt Recall (Kassenzettel): study a made-up shop receipt, then answer questions about it from memory. */
(function () {
  const F = Funkloch;
  const ITEMS = [
    { e: '🍎', de: 'Äpfel', en: 'Apples' }, { e: '🍌', de: 'Bananen', en: 'Bananas' }, { e: '🥖', de: 'Baguette', en: 'Baguette' },
    { e: '🧀', de: 'Käse', en: 'Cheese' }, { e: '🥛', de: 'Milch', en: 'Milk' }, { e: '🥚', de: 'Eier', en: 'Eggs' },
    { e: '🍫', de: 'Schoggi', en: 'Chocolate' }, { e: '☕', de: 'Kaffee', en: 'Coffee' }, { e: '🍝', de: 'Teigwaren', en: 'Pasta' },
    { e: '🍅', de: 'Tomaten', en: 'Tomatoes' }, { e: '🥕', de: 'Rüebli', en: 'Carrots' }, { e: '🍪', de: 'Guetzli', en: 'Cookies' },
    { e: '🧃', de: 'Saft', en: 'Juice' }, { e: '🍯', de: 'Honig', en: 'Honey' }, { e: '🧅', de: 'Zwiebeln', en: 'Onions' },
    { e: '🍓', de: 'Erdbeeren', en: 'Strawberries' }, { e: '🥔', de: 'Kartoffeln', en: 'Potatoes' }, { e: '🍦', de: 'Glace', en: 'Ice cream' },
    { e: '🧴', de: 'Seife', en: 'Soap' }, { e: '🪥', de: 'Zahnbürste', en: 'Toothbrush' }, { e: '🕯️', de: 'Kerze', en: 'Candle' },
    { e: '🔋', de: 'Batterien', en: 'Batteries' }, { e: '📓', de: 'Notizbuch', en: 'Notebook' }, { e: '🌻', de: 'Blumen', en: 'Flowers' },
    { e: '🥜', de: 'Nüsse', en: 'Nuts' }, { e: '🍋', de: 'Zitronen', en: 'Lemons' }, { e: '🥒', de: 'Gurke', en: 'Cucumber' },
    { e: '🍞', de: 'Brot', en: 'Bread' }, { e: '🧈', de: 'Butter', en: 'Butter' }, { e: '🍇', de: 'Trauben', en: 'Grapes' },
  ];
  const ROUNDS = 4, PER = 2;
  const fmt = (c) => 'CHF ' + (c / 100).toFixed(2);
  const name = (it) => `${it.e} ${F.tt({ de: it.de, en: it.en })}`;

  F.registerGame({
    id: 'receipt-recall', skill: 'memory', added: '2026-11-11', glyph: '🧾',
    name: { de: 'Kassenzettel', en: 'Receipt Recall' },
    desc: {
      de: 'Studiere einen Kassenzettel mit Artikeln und Preisen. Dann verschwindet er und du beantwortest zwei Fragen dazu: Was kostete was? Was fehlte? 4 Zettel, 8 Fragen, jede richtige Antwort zählt.',
      en: 'Study a shop receipt with items and prices. Then it disappears and you answer two questions about it: what cost what, what was missing? 4 receipts, 8 questions, every right answer scores.',
    },
    start(ctx) {
      const r = ctx.rng;
      const lvl = Math.max(0, Math.min(10, ctx.level || 0));
      let round = 0, right = 0, asked = 0, points = 0, over = false;
      ctx.onCleanup(() => { over = true; });

      function makeReceipt(n) {
        const items = r.shuffle(ITEMS.slice()).slice(0, n);
        const prices = [];
        for (let guard = 0; prices.length < n && guard < 400; guard++) {
          const p = r.int(16, 398) * 5;
          if (!prices.includes(p)) prices.push(p);
        }
        for (let k = 5; prices.length < n; k += 5) if (!prices.includes(k)) prices.push(k);
        return { lines: items.map((it, i) => ({ it, p: prices[i] })), n };
      }

      // Each question: { text, opts: [string], ok: index }
      function question(type, rc) {
        const L = rc.lines;
        const absent = ITEMS.filter((it) => !L.some((l) => l.it === it));
        if (type === 'price') {
          const t = r.pick(L);
          const set = [t.p];
          L.forEach((l) => { if (set.length < 4 && !set.includes(l.p) && r() < 0.6) set.push(l.p); });
          for (let guard = 0; set.length < 4 && guard < 100; guard++) {
            const q = Math.max(5, t.p + r.pick([-1, 1]) * r.int(1, 12) * 5 * (r() < 0.5 ? 1 : 4));
            if (!set.includes(q)) set.push(q);
          }
          for (let k = 5; set.length < 4; k += 5) if (!set.includes(k)) set.push(k);
          const opts = r.shuffle(set.slice());
          return { text: F.tt({ de: `Was kostete ${name(t.it)}?`, en: `How much was ${name(t.it)}?` }), opts: opts.map(fmt), ok: opts.indexOf(t.p) };
        }
        if (type === 'max' || type === 'min') {
          const sorted = L.slice().sort((a, b) => a.p - b.p);
          const t = type === 'max' ? sorted[sorted.length - 1] : sorted[0];
          const others = r.shuffle(L.filter((l) => l !== t).map((l) => l.it).concat(r.shuffle(absent.slice()).slice(0, 3)));
          const opts = r.shuffle([t.it].concat(others.slice(0, 3)));
          return {
            text: type === 'max' ? F.tt({ de: 'Welcher Artikel war am teuersten?', en: 'Which item was the most expensive?' }) : F.tt({ de: 'Welcher Artikel war am günstigsten?', en: 'Which item was the cheapest?' }),
            opts: opts.map(name), ok: opts.indexOf(t.it),
          };
        }
        if (type === 'count') {
          const set = [rc.n];
          for (const d of r.shuffle([-2, -1, 1, 2, 3])) if (set.length < 4 && rc.n + d >= 1) set.push(rc.n + d);
          const opts = set.sort((a, b) => a - b);
          return { text: F.tt({ de: 'Wie viele Artikel standen auf dem Zettel?', en: 'How many items were on the receipt?' }), opts: opts.map(String), ok: opts.indexOf(rc.n) };
        }
        // 'absent': three items were on the receipt, one was not.
        const miss = r.pick(absent);
        const three = r.shuffle(L.map((l) => l.it)).slice(0, 3);
        const opts = r.shuffle([miss].concat(three));
        return { text: F.tt({ de: 'Welcher Artikel stand NICHT auf dem Zettel?', en: 'Which item was NOT on the receipt?' }), opts: opts.map(name), ok: opts.indexOf(miss) };
      }

      async function next() {
        if (over) return;
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const n = Math.min(6, 3 + Math.floor(lvl / 3) + (round >= 3 ? 1 : 0));
        const rc = ctx.fresh(() => makeReceipt(n), (x) => x.lines.map((l) => l.it.e + l.p).join(''));
        const types = r.shuffle(['price', 'price', 'max', 'min', 'count', 'absent'].filter((t) => (t !== 'count' && t !== 'absent') || n >= 3)).filter((t, i, a) => a.indexOf(t) === i).slice(0, PER);
        const qs = types.map((t) => question(t, rc));

        ctx.el.innerHTML = '';
        const info = F.h('<div class="info-line" style="min-height:26px"></div>');
        const paper = F.h('<div style="max-width:300px;margin:10px auto;padding:14px 16px;background:var(--card);color:var(--ink);border:2.5px dashed var(--ink);border-radius:6px;box-shadow:var(--shadow)"></div>');
        paper.innerHTML = `<div style="text-align:center;font-size:20px;margin-bottom:8px">🧾 ${F.tt({ de: 'KASSENZETTEL', en: 'RECEIPT' })}</div>`
          + rc.lines.map((l) => `<div style="display:flex;justify-content:space-between;gap:10px;font-size:19px;padding:3px 0;border-bottom:1.5px dotted var(--ink-faint)"><span>${name(l.it)}</span><span style="white-space:nowrap">${fmt(l.p)}</span></div>`).join('');
        const go = F.h(`<button class="btn" style="display:block;margin:10px auto">${F.tt({ de: 'Bereit!', en: 'Ready!' })}</button>`);
        ctx.el.append(info, paper, go);
        info.textContent = F.tt({ de: 'Merk dir Artikel und Preise!', en: 'Memorise items and prices!' });
        let skip = false;
        go.onclick = () => { skip = true; };
        const study = Math.max(2500, n * (2300 - lvl * 90) + 1200);
        for (let t = 0; t < study && !skip && !over; t += 100) await ctx.wait(100);
        if (over) return;

        for (const q of qs) {
          if (over) return;
          ctx.el.innerHTML = '';
          const head = F.h('<div class="info-line" style="min-height:26px"></div>');
          const card = F.h('<div class="card" style="max-width:340px;margin:10px auto;padding:12px 14px;font-size:20px;text-align:center"></div>');
          card.textContent = q.text;
          const list = F.h('<div style="display:grid;gap:10px;max-width:340px;margin:12px auto"></div>');
          const msg = F.h('<div class="info-line" style="min-height:24px"></div>');
          head.textContent = `${round} / ${ROUNDS}`;
          let done = false;
          const btns = q.opts.map((o, i) => {
            const b = F.h('<button class="btn" style="min-height:52px;width:100%;font-size:20px"></button>');
            b.textContent = o;
            b.onclick = async () => {
              if (done || over) return; done = true; asked++;
              const ok = i === q.ok;
              if (ok) { right++; points += 10 + lvl; }
              ctx.sfx(ok ? 'good' : 'bad');
              b.style.background = ok ? 'var(--good)' : 'var(--bad)';
              b.style.color = 'var(--ink)';
              if (!ok) { btns[q.ok].style.outline = '4px dashed var(--accent)'; }
              msg.textContent = ok ? F.tt({ de: 'Richtig!', en: 'Right!' }) : F.tt({ de: 'Das war die richtige Antwort.', en: 'That was the right answer.' });
              ctx.setScore(points);
              await ctx.wait(ok ? 800 : 1400);
              resolveQ();
            };
            list.appendChild(b);
            return b;
          });
          ctx.el.append(head, card, list, msg);
          await new Promise((res) => { resolveQ = res; });
        }
        next();
      }
      let resolveQ = () => {};
      ctx.onCleanup(() => resolveQ());

      function end() {
        if (over) return;
        over = true;
        const tot = ROUNDS * PER;
        ctx.finish({
          score: points, detail: F.tt({ de: `${right}/${tot} richtig`, en: `${right}/${tot} right` }),
          levelDelta: right >= 7 ? 1 : right < 4 ? -1 : 0, quality: right / tot, ink: 3 + right * 2,
        });
      }
      next();
    },
  });
})();
