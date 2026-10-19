/* Code Breaker: a secret row of fruits. Guess it; ● = right fruit in the right place, ○ = right fruit in the wrong place. */
(function () {
  const F = Funkloch;
  const FRUITS = ['🍎', '🍋', '🍇', '🍊', '🥝', '🍑'];

  function feedback(secret, guess) {
    let black = 0;
    const sRest = [], gRest = [];
    secret.forEach((s, i) => { if (s === guess[i]) black++; else { sRest.push(s); gRest.push(guess[i]); } });
    let white = 0;
    gRest.forEach((g) => { const k = sRest.indexOf(g); if (k >= 0) { white++; sRest.splice(k, 1); } });
    return { black, white };
  }

  F.registerGame({
    id: 'code-breaker', skill: 'logic', added: '2026-10-19', glyph: '🍎?',
    name: { de: 'Code-Knacker', en: 'Code Breaker' },
    desc: {
      de: 'Ein geheimer Code aus Früchten! Tippe deinen Tipp und prüfe ihn. ● = richtige Frucht am richtigen Platz, ○ = richtige Frucht am falschen Platz. Knacke den Code, bevor die Versuche aus sind.',
      en: 'A secret code of fruits! Enter a guess and check it. ● = right fruit in the right place, ○ = right fruit in the wrong place. Crack the code before you run out of tries.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = ctx.level;
      const len = lvl >= 5 ? 5 : 4, kinds = lvl >= 3 ? 6 : 5, repeats = lvl >= 3, tries = len === 5 ? 10 : 8;
      const pool = FRUITS.slice(0, kinds);
      const secret = ctx.fresh(() => {
        if (repeats) return Array.from({ length: len }, () => r.pick(pool));
        return r.shuffle(pool).slice(0, len);
      }, (x) => x.join(''));
      const guess = Array(len).fill(null);
      let used = 0, over = false;
      ctx.setInfo(F.tt({ de: '● richtiger Platz · ○ falscher Platz', en: '● right place · ○ wrong place' }) + (repeats ? '' : ' · ' + F.tt({ de: 'jede Frucht nur einmal', en: 'each fruit once' })));
      ctx.setScore(`0 / ${tries}`);
      const wrap = F.h('<div style="display:flex;flex-direction:column;gap:10px;align-items:center;width:100%"></div>');
      const hist = F.h('<div style="width:100%;max-height:36vh;min-height:60px;overflow-y:auto;display:flex;flex-direction:column;gap:4px"></div>');
      const cur = F.h(`<div style="display:flex;gap:6px;justify-content:center"></div>`);
      const pal = F.h(`<div style="display:flex;gap:6px;justify-content:center;flex-wrap:wrap"></div>`);
      const go = F.h(`<button class="btn primary" style="min-height:52px;min-width:180px">${F.tt({ de: 'Prüfen', en: 'Check' })}</button>`);
      wrap.append(hist, cur, pal, go);
      ctx.el.innerHTML = '';
      ctx.el.appendChild(wrap);

      const slotBtns = guess.map((_, i) => {
        const b = F.h('<button class="opt" style="width:52px;min-height:52px;font-size:28px;padding:0"></button>');
        b.onclick = () => { if (!over) { guess[i] = null; draw(); } };
        cur.appendChild(b);
        return b;
      });
      pool.forEach((f) => {
        const b = F.h(`<button class="opt" style="width:48px;min-height:52px;font-size:28px;padding:0">${f}</button>`);
        b.onclick = () => {
          if (over) return;
          let k = guess.indexOf(null);
          if (k < 0) return;
          if (!repeats && guess.includes(f)) return;
          guess[k] = f; draw();
        };
        pal.appendChild(b);
      });
      function draw() {
        slotBtns.forEach((b, i) => { b.textContent = guess[i] || '＿'; });
        go.disabled = guess.includes(null);
        go.style.opacity = go.disabled ? 0.5 : 1;
      }
      go.onclick = async () => {
        if (over || guess.includes(null)) return;
        const g = guess.slice(), fb = feedback(secret, g);
        used++;
        ctx.setScore(`${used} / ${tries}`);
        hist.appendChild(F.h(`<div class="card" style="display:flex;justify-content:space-between;align-items:center;padding:4px 12px;font-size:26px"><span>${g.join(' ')}</span><span style="font-size:22px;letter-spacing:2px">${'●'.repeat(fb.black)}${'○'.repeat(fb.white)}${fb.black + fb.white === 0 ? '–' : ''}</span></div>`));
        hist.scrollTop = hist.scrollHeight;
        guess.fill(null); draw();
        const won = fb.black === len;
        if (!won && used < tries) { ctx.sfx('tick'); return; }
        over = true;
        ctx.sfx(won ? 'good' : 'bad');
        if (!won) {
          hist.appendChild(F.h(`<div class="card" style="padding:6px 12px;text-align:center;font-size:26px">${F.tt({ de: 'Lösung', en: 'Answer' })}: ${secret.join(' ')}</div>`));
          hist.scrollTop = hist.scrollHeight;
        }
        await ctx.wait(won ? 900 : 2200);
        ctx.finish({
          score: won ? (tries - used + 1) * 10 : 0,
          detail: won ? F.tt({ de: `Geknackt in ${used} Versuchen`, en: `Cracked in ${used} tries` }) : F.tt({ de: 'Nicht geknackt', en: 'Not cracked' }),
          levelDelta: won ? (used <= tries - 3 ? 1 : 0) : -1,
          quality: won ? Math.max(0.4, 1 - (used - 1) / tries) : 0.2, ink: won ? 6 + (tries - used) : 2,
        });
      };
      draw();
    },
  });
})();
