/* Twenty-One: the classic card game against the dealer. Get closer to 21 than the dealer without going over. */
(function () {
  const F = Funkloch;
  const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
  const SUITS = [
    { s: '♠', red: false }, { s: '♥', red: true }, { s: '♦', red: true }, { s: '♣', red: false },
  ];
  const HANDS = 6;

  function total(cards) {
    let t = 0, aces = 0;
    cards.forEach((c) => { const r = c.r; if (r === 'A') { aces++; t += 11; } else if ('JQK'.includes(r) || r === '10') t += 10; else t += +r; });
    while (t > 21 && aces > 0) { t -= 10; aces--; }
    return t;
  }
  function deck(r) {
    const d = [];
    RANKS.forEach((rk) => SUITS.forEach((su) => d.push({ r: rk, s: su.s, red: su.red })));
    return r.shuffle(d);
  }
  function cardEl(c, hidden, tilt) {
    const base = 'flex:0 1 74px;min-width:0;height:108px;border:3px solid var(--ink);border-radius:9px 12px 9px 11px;box-shadow:2px 2px 0 var(--ink);box-sizing:border-box;';
    if (hidden) {
      return F.h(`<div class="pop-in" style="${base}background:var(--c-logic);transform:rotate(${tilt}deg);display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 40 60" width="38" height="56" fill="none" style="stroke:var(--ink)" stroke-width="2.5" stroke-linecap="round"><path d="M6,8 L34,52 M34,8 L6,52"/><circle cx="20" cy="30" r="9" style="fill:var(--card)"/></svg></div>`);
    }
    const col = c.red ? 'var(--bad)' : 'var(--ink)';
    return F.h(`<div class="pop-in" style="${base}background:var(--card);color:${col};transform:rotate(${tilt}deg);display:flex;flex-direction:column;align-items:center;justify-content:center;line-height:1">
      <div style="font-size:30px;font-weight:700">${c.r}</div><div style="font-size:36px;margin-top:2px">${c.s}</div></div>`);
  }

  F.registerGame({
    id: 'twenty-one', skill: 'math', added: '2026-11-13', glyph: '21♠',
    name: { de: 'Einundzwanzig', en: 'Twenty-One' },
    desc: {
      de: 'Das klassische Kartenspiel gegen die Bank: Ziehe Karten und komme näher an 21 als sie, ohne darüber zu gehen. Bube, Dame, König zählen 10, das Ass 1 oder 11. Die Bank zieht bis mindestens 17. Gewinne möglichst viele von 6 Runden.',
      en: 'The classic card game against the dealer: draw cards and get closer to 21 than they do without going over. Jack, queen and king count 10, the ace 1 or 11. The dealer draws until at least 17. Win as many of 6 hands as you can.',
    },
    start(ctx) {
      const r = ctx.rng;
      const stand = ctx.level >= 5 ? 18 : 17;
      let hand = 0, points = 0, wins = 0, busy = false;

      function next() {
        if (hand >= HANDS) return end();
        hand++;
        const d = deck(r);
        const you = [d.pop(), d.pop()], dealer = [d.pop(), d.pop()];
        ctx.setInfo(`${hand} / ${HANDS}`); ctx.setScore(points);
        ctx.el.innerHTML = '';
        const table = F.h('<div class="card sketch" style="margin:12px 0 14px;padding:14px 10px 18px;background:var(--c-spatial);transform:rotate(-.5deg)"></div>');
        const dLab = F.h(`<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:18px"><span>${F.tt({ de: 'Bank', en: 'Dealer' })}</span><span class="dt" style="font-size:26px">?</span></div>`);
        const dRow = F.h('<div style="display:flex;gap:8px;min-height:118px;align-items:center;justify-content:center;margin:6px 0 10px"></div>');
        const yLab = F.h(`<div style="display:flex;justify-content:space-between;align-items:baseline;font-size:18px"><span>${F.tt({ de: 'Du', en: 'You' })}</span><span class="yt" style="font-size:40px;line-height:1.1">0</span></div>`);
        const yRow = F.h('<div style="display:flex;gap:8px;min-height:118px;align-items:center;justify-content:center;margin:6px 0 2px;flex-wrap:nowrap"></div>');
        table.appendChild(dLab); table.appendChild(dRow); table.appendChild(yLab); table.appendChild(yRow);
        const msg = F.h('<div class="info-line" style="text-align:center;font-size:20px;min-height:30px"></div>');
        const row = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:8px"></div>');
        const hit = F.h(`<button class="btn primary big" style="min-height:76px;font-size:24px">${F.tt({ de: 'Karte', en: 'Hit' })}</button>`);
        const hold = F.h(`<button class="btn big" style="min-height:76px;font-size:24px">${F.tt({ de: 'Halten', en: 'Stand' })}</button>`);
        row.appendChild(hit); row.appendChild(hold);
        ctx.el.appendChild(table); ctx.el.appendChild(msg); ctx.el.appendChild(row);
        busy = false;

        const tilt = (i) => (i % 2 ? 2.5 : -2.5);
        function showYou() {
          yRow.innerHTML = '';
          you.forEach((c, i) => yRow.appendChild(cardEl(c, false, tilt(i))));
          table.querySelector('.yt').textContent = total(you);
        }
        function showDealer(reveal) {
          dRow.innerHTML = '';
          dealer.forEach((c, i) => dRow.appendChild(cardEl(c, !reveal && i === 1, tilt(i + 1))));
          table.querySelector('.dt').textContent = reveal ? total(dealer) : '?';
        }
        showYou(); showDealer(false);

        async function finish(res, text) {
          busy = true;
          const nat = you.length === 2 && total(you) === 21;
          let gain = 0;
          if (res === 'win') { gain = nat ? 15 : 10; wins++; ctx.sfx('win'); if (hand < HANDS) F.cheer(8); table.classList.add('flash-ok'); }
          else if (res === 'push') { gain = 4; ctx.sfx('tap'); }
          else { ctx.sfx('bad'); table.classList.add('flash-bad'); }
          points += gain; ctx.setScore(points);
          msg.textContent = text + (gain ? `  +${gain}` : '');
          await ctx.wait(1500);
          next();
        }
        async function dealerPlay() {
          showDealer(true);
          await ctx.wait(600);
          while (total(dealer) < stand) {
            dealer.push(d.pop()); ctx.sfx('tap'); showDealer(true);
            await ctx.wait(650);
          }
          const yt = total(you), dt = total(dealer);
          if (dt > 21) finish('win', F.tt({ de: 'Bank überkauft!', en: 'Dealer busts!' }));
          else if (yt > dt) finish('win', F.tt({ de: `${yt} schlägt ${dt}`, en: `${yt} beats ${dt}` }));
          else if (yt === dt) finish('push', F.tt({ de: 'Gleichstand', en: 'A tie' }));
          else finish('lose', F.tt({ de: `${dt} schlägt ${yt}`, en: `${dt} beats ${yt}` }));
        }
        hit.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (busy) return;
          you.push(d.pop()); ctx.sfx('tap'); showYou();
          const t = total(you);
          if (t > 21) { busy = true; finish('lose', F.tt({ de: 'Überkauft!', en: 'Bust!' })); }
          else if (t === 21) { busy = true; dealerPlay(); }
        });
        hold.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (busy) return;
          busy = true; dealerPlay();
        });
        if (total(you) === 21) { busy = true; dealerPlay(); }
      }

      function end() {
        ctx.finish({
          score: points,
          detail: F.tt({ de: `${wins} von ${HANDS} Runden gewonnen`, en: `${wins} of ${HANDS} hands won` }),
          levelDelta: wins >= 4 ? 1 : wins <= 1 ? -1 : 0,
          quality: wins / HANDS, ink: 3 + wins * 4,
        });
      }
      next();
    },
  });
})();
