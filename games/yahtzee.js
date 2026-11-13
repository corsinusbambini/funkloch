/* Dice Poker (Würfelpoker): 13 rounds, roll five dice up to three times, fill every category once. */
(function () {
  const F = Funkloch;
  const CATS = [
    { id: 'n1', n: 1 }, { id: 'n2', n: 2 }, { id: 'n3', n: 3 }, { id: 'n4', n: 4 }, { id: 'n5', n: 5 }, { id: 'n6', n: 6 },
    { id: 'three', de: 'Dreierpasch', en: '3 of a kind' }, { id: 'four', de: 'Viererpasch', en: '4 of a kind' },
    { id: 'full', de: 'Full House', en: 'Full house' }, { id: 'small', de: 'Kleine Strasse', en: 'Small straight' },
    { id: 'large', de: 'Grosse Strasse', en: 'Large straight' }, { id: 'five', de: 'Fünfling', en: 'Five of a kind' },
    { id: 'chance', de: 'Chance', en: 'Chance' },
  ];
  const pipsAt = { 1: [[5, 5]], 2: [[2.5, 2.5], [7.5, 7.5]], 3: [[2.5, 2.5], [5, 5], [7.5, 7.5]], 4: [[2.5, 2.5], [7.5, 2.5], [2.5, 7.5], [7.5, 7.5]], 5: [[2.5, 2.5], [7.5, 2.5], [5, 5], [2.5, 7.5], [7.5, 7.5]], 6: [[2.5, 2.5], [7.5, 2.5], [2.5, 5], [7.5, 5], [2.5, 7.5], [7.5, 7.5]] };
  // Hand-drawn die: wobbly rounded square, pips with a tiny shine, slightly tilted (tilt from the index, no randomness).
  const dieSVG = (v, i, held) => `<svg viewBox="0 0 60 60" style="width:100%;height:100%;display:block;overflow:visible;transform:rotate(${(i % 2 ? 1 : -1) * (2 + (i % 3))}deg)">
    <path d="M14 4 Q30 2.5 46 4.5 Q56 5 55.5 15 Q57 30 55.5 45 Q55 55.5 45 55.5 Q30 57 15 55.5 Q4.5 55 4.5 45 Q3 30 4.5 15 Q5 4.5 14 4Z" fill="${held ? 'var(--c-math)' : 'var(--card)'}" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
    <path d="M12 12 Q18 8.5 26 9" fill="none" stroke="var(--ink-faint)" stroke-width="2.5" stroke-linecap="round"/>
    ${pipsAt[v].map(([x, y]) => `<circle cx="${x * 5 + 5}" cy="${y * 5 + 5}" r="5.2" fill="var(--ink)"/>`).join('')}
  </svg>`;

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
      case 'five': return max === 5 ? 50 : 0;
      case 'chance': return sum;
      default: return cnt[+id.slice(1)] * +id.slice(1);
    }
  }

  F.registerGame({
    id: 'yahtzee', skill: 'math', added: '2026-11-01', glyph: '⚂⚄',
    name: { de: 'Würfelpoker', en: 'Dice Poker' },
    desc: {
      de: 'Würfle bis zu dreimal und tippe Würfel zum Behalten. Dann trägst du das Ergebnis in eine Zeile ein – jede nur einmal. 13 Runden, versuche möglichst viele Punkte zu holen (ab 63 in der oberen Hälfte gibt es +35).',
      en: 'Roll up to three times and tap dice to keep them. Then write the result into one row – each only once. 13 rounds, collect as many points as you can (63+ in the top half gives +35).',
    },
    noLevel: true,
    start(ctx) {
      const r = ctx.rng;
      const filled = {};
      let dice = [1, 1, 1, 1, 1], held = [false, false, false, false, false], rolls = 0, round = 1, locked = false;
      let justRolled = false, justPicked = null;
      // Score sheet on top (a sketched paper card), dice and the roll button below in the thumb zone.
      const sheet = F.h('<div class="card sketch" style="padding:8px 8px 10px;transform:rotate(-0.4deg)"></div>');
      const sheetHead = F.h('<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;padding:0 4px 6px;font-size:17px;color:var(--ink-soft)"></div>');
      const grid = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px"></div>');
      sheet.append(sheetHead, grid);
      const msg = F.h('<div class="info-line" style="text-align:center;min-height:26px;margin-top:6px"></div>');
      const diceEl = F.h('<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;margin:2px 4px 10px"></div>');
      const rollBtn = F.h('<button class="btn primary block" style="min-height:56px;font-size:22px"></button>');
      ctx.el.append(sheet, msg, diceEl, rollBtn);
      const catName = (c) => (c.n ? F.tt({ de: `${c.n}er`, en: `${c.n}s` }) : F.tt(c));
      const upper = () => CATS.slice(0, 6).reduce((a, c) => a + (filled[c.id] || 0), 0);
      const total = () => Object.values(filled).reduce((a, b) => a + b, 0) + (upper() >= 63 ? 35 : 0);

      function render() {
        ctx.setScore(total()); ctx.setInfo(`${Math.min(round, 13)} / 13`);
        diceEl.innerHTML = '';
        dice.forEach((v, i) => {
          const b = F.h(`<button aria-label="${v}" style="min-width:0;padding:0;aspect-ratio:1;border:0;background:none;color:var(--ink);cursor:pointer;transition:transform .15s;transform:translateY(${held[i] ? -8 : 0}px);opacity:${rolls ? 1 : 0.4}">${dieSVG(v, i, held[i])}</button>`);
          b.onclick = () => { if (!rolls || locked) return; held[i] = !held[i]; ctx.sfx('tap'); render(); };
          diceEl.appendChild(b);
          if (justRolled && !held[i]) b.firstElementChild.classList.add('tap-pop');
        });
        justRolled = false;
        rollBtn.textContent = rolls === 0 ? F.tt({ de: 'Würfeln', en: 'Roll' }) : F.tt({ de: `Nochmal würfeln (${3 - rolls} übrig)`, en: `Roll again (${3 - rolls} left)` });
        rollBtn.disabled = rolls >= 3 || locked;
        const up = upper();
        sheetHead.innerHTML = `<span>${F.tt({ de: 'Oben', en: 'Top half' })}: <b style="color:var(--ink)">${up}</b> / 63${up >= 63 ? ' ✓ +35' : ''}</span><span>${F.tt({ de: 'Summe', en: 'Total' })}: <b style="color:var(--ink)">${total()}</b></span>`;
        grid.innerHTML = '';
        CATS.forEach((c, ci) => {
          const done = filled[c.id] !== undefined;
          const val = done ? filled[c.id] : rolls ? score(c.id, dice) : '';
          const last = ci === CATS.length - 1;
          const valCol = done ? 'var(--ink-soft)' : val ? 'var(--accent)' : 'var(--ink-soft)';
          const b = F.h(`<button class="opt" style="min-width:0;min-height:46px;padding:4px 10px;justify-content:space-between;gap:6px;border-width:2px;box-shadow:${done ? 'none' : 'var(--shadow)'};background:${done ? 'var(--paper-2)' : 'var(--card)'};color:${done ? 'var(--ink-soft)' : 'var(--ink)'};font-size:17px;${last ? 'grid-column:1 / -1;' : ''}${done ? 'text-decoration:line-through;text-decoration-color:var(--ink-faint)' : ''}"><span style="white-space:nowrap">${catName(c)}</span><b style="color:${valCol};text-decoration:none;font-size:19px">${val}</b></button>`);
          b.onclick = () => pick(c);
          grid.appendChild(b);
          if (justPicked === c.id) b.classList.add('tap-pop');
        });
        justPicked = null;
      }
      async function pick(c) {
        if (!rolls || locked || filled[c.id] !== undefined) return;
        locked = true;
        filled[c.id] = score(c.id, dice);
        ctx.sfx(filled[c.id] > 0 ? 'good' : 'bad');
        rolls = 0; held = [false, false, false, false, false]; round++;
        justPicked = c.id;
        msg.textContent = '';
        render();
        if (round > 13) return end();
        if (c.id === 'five' && filled[c.id] > 0) F.cheer(8);
        locked = false; render();
      }
      rollBtn.onclick = () => {
        if (rolls >= 3 || locked) return;
        dice = dice.map((v, i) => (held[i] && rolls ? v : r.int(1, 6)));
        rolls++; ctx.sfx('tap'); justRolled = true;
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
