/* Kniffel / Yahtzee: 13 rounds, roll five dice up to three times, fill every category once. */
(function () {
  const F = Funkloch;
  const CATS = [
    { id: 'n1', n: 1 }, { id: 'n2', n: 2 }, { id: 'n3', n: 3 }, { id: 'n4', n: 4 }, { id: 'n5', n: 5 }, { id: 'n6', n: 6 },
    { id: 'three', de: 'Dreierpasch', en: '3 of a kind' }, { id: 'four', de: 'Viererpasch', en: '4 of a kind' },
    { id: 'full', de: 'Full House', en: 'Full house' }, { id: 'small', de: 'Kleine Strasse', en: 'Small straight' },
    { id: 'large', de: 'Grosse Strasse', en: 'Large straight' }, { id: 'yahtzee', de: 'Kniffel', en: 'Yahtzee' },
    { id: 'chance', de: 'Chance', en: 'Chance' },
  ];
  const pipsAt = { 1: [[5, 5]], 2: [[2.5, 2.5], [7.5, 7.5]], 3: [[2.5, 2.5], [5, 5], [7.5, 7.5]], 4: [[2.5, 2.5], [7.5, 2.5], [2.5, 7.5], [7.5, 7.5]], 5: [[2.5, 2.5], [7.5, 2.5], [5, 5], [2.5, 7.5], [7.5, 7.5]], 6: [[2.5, 2.5], [7.5, 2.5], [2.5, 5], [7.5, 5], [2.5, 7.5], [7.5, 7.5]] };
  const dieSVG = (v) => `<svg viewBox="0 0 10 10" style="width:100%;height:100%;display:block">${pipsAt[v].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="0.85" fill="currentColor"/>`).join('')}</svg>`;

  function score(id, dice) {
    const cnt = [0, 0, 0, 0, 0, 0, 0];
    dice.forEach((d) => cnt[d]++);
    const sum = dice.reduce((a, b) => a + b, 0);
    const runLen = () => { let best = 0, cur = 0; for (let v = 1; v <= 6; v++) { cur = cnt[v] > 0 ? cur + 1 : 0; best = Math.max(best, cur); } return best; };
    const max = Math.max(...cnt);
    switch (id) {
      case 'three': return max >= 3 ? sum : 0;
      case 'four': return max >= 4 ? sum : 0;
      case 'full': return (cnt.includes(3) && cnt.includes(2)) || max === 5 ? 25 : 0;
      case 'small': return runLen() >= 4 ? 30 : 0;
      case 'large': return runLen() >= 5 ? 40 : 0;
      case 'yahtzee': return max === 5 ? 50 : 0;
      case 'chance': return sum;
      default: return cnt[+id.slice(1)] * +id.slice(1);
    }
  }

  F.registerGame({
    id: 'yahtzee', skill: 'math', added: '2026-11-01', glyph: '⚂⚄',
    name: { de: 'Kniffel', en: 'Yahtzee' },
    desc: {
      de: 'Würfle bis zu dreimal und tippe Würfel zum Behalten. Dann trägst du das Ergebnis in eine Zeile ein – jede nur einmal. 13 Runden, versuche möglichst viele Punkte zu holen (ab 63 in der oberen Hälfte gibt es +35).',
      en: 'Roll up to three times and tap dice to keep them. Then write the result into one row – each only once. 13 rounds, collect as many points as you can (63+ in the top half gives +35).',
    },
    noLevel: true,
    start(ctx) {
      const r = ctx.rng;
      const filled = {};
      let dice = [1, 1, 1, 1, 1], held = [false, false, false, false, false], rolls = 0, round = 1, locked = false;
      const diceEl = F.h('<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:8px;margin:6px 0"></div>');
      const rollBtn = F.h('<button class="btn block"></button>');
      const msg = F.h('<div class="info-line" style="text-align:center;min-height:24px"></div>');
      const grid = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:8px"></div>');
      ctx.el.append(diceEl, msg, rollBtn, grid);
      const catName = (c) => (c.n ? F.tt({ de: `${c.n}er`, en: `${c.n}s` }) : F.tt(c));
      const upper = () => CATS.slice(0, 6).reduce((a, c) => a + (filled[c.id] || 0), 0);
      const total = () => Object.values(filled).reduce((a, b) => a + b, 0) + (upper() >= 63 ? 35 : 0);

      function render() {
        ctx.setScore(total()); ctx.setInfo(`${Math.min(round, 13)} / 13`);
        diceEl.innerHTML = '';
        dice.forEach((v, i) => {
          const b = F.h(`<button style="min-width:0;padding:6px;aspect-ratio:1;border:3px solid var(--ink);border-radius:12px;background:${held[i] ? 'var(--accent)' : 'var(--card)'};color:var(--ink);box-shadow:var(--shadow);cursor:pointer">${rolls ? dieSVG(v) : ''}</button>`);
          b.onclick = () => { if (!rolls || locked) return; held[i] = !held[i]; ctx.sfx('tap'); render(); };
          diceEl.appendChild(b);
        });
        rollBtn.textContent = rolls === 0 ? F.tt({ de: 'Würfeln', en: 'Roll' }) : F.tt({ de: `Nochmal würfeln (${3 - rolls} übrig)`, en: `Roll again (${3 - rolls} left)` });
        rollBtn.disabled = rolls >= 3 || locked;
        rollBtn.style.opacity = rollBtn.disabled ? '.4' : '1';
        grid.innerHTML = '';
        CATS.forEach((c) => {
          const done = filled[c.id] !== undefined;
          const val = done ? filled[c.id] : rolls ? score(c.id, dice) : '';
          const b = F.h(`<button style="min-width:0;min-height:48px;padding:4px 8px;display:flex;justify-content:space-between;align-items:center;gap:4px;border:2px solid var(--ink);border-radius:12px;background:${done ? 'var(--paper-2)' : 'var(--card)'};color:var(--ink);font-family:inherit;font-size:16px;cursor:pointer;${done ? 'opacity:.6' : ''}"><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${catName(c)}</span><b style="${done ? '' : 'color:var(--accent)'}">${val}</b></button>`);
          b.onclick = () => pick(c);
          grid.appendChild(b);
        });
      }
      async function pick(c) {
        if (!rolls || locked || filled[c.id] !== undefined) return;
        locked = true;
        filled[c.id] = score(c.id, dice);
        ctx.sfx(filled[c.id] > 0 ? 'good' : 'bad');
        rolls = 0; held = [false, false, false, false, false]; round++;
        render();
        if (round > 13) return end();
        locked = false; render();
      }
      rollBtn.onclick = () => {
        if (rolls >= 3 || locked) return;
        dice = dice.map((v, i) => (held[i] && rolls ? v : r.int(1, 6)));
        rolls++; ctx.sfx('tap');
        msg.textContent = '';
        if (rolls === 3) { held = [false, false, false, false, false]; msg.textContent = F.tt({ de: 'Wähle jetzt eine Zeile.', en: 'Now pick a row.' }); }
        render();
      };
      async function end() {
        const t = total();
        await ctx.wait(500);
        ctx.finish({
          score: t, detail: F.tt({ de: `Obere Hälfte: ${upper()}${upper() >= 63 ? ' (+35 Bonus)' : ''}`, en: `Top half: ${upper()}${upper() >= 63 ? ' (+35 bonus)' : ''}` }),
          quality: Math.min(1, t / 250), ink: 3 + Math.round(t / 20),
        });
      }
      render();
    },
  });
})();
