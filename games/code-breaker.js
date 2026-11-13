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
      // The code board: a drawn wooden board with the hidden code on top and one row per try.
      const rowH = tries > 8 ? 30 : 34;
      const hist = F.h('<div class="card sketch" style="width:100%;padding:8px 12px;background:var(--paper-2);display:flex;flex-direction:column;gap:2px;transform:rotate(-0.4deg)"></div>');
      const lockRow = F.h('<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding-bottom:6px;margin-bottom:4px;border-bottom:2.5px dashed var(--ink-faint)"></div>');
      hist.appendChild(lockRow);
      const shell = (i) => `<svg viewBox="0 0 40 40" width="44" height="44" style="display:block"><path d="M5,${30 + (i % 2)} C4,14 12,5 20,5 C29,5 36,13 35,${30 - (i % 2)} Z" style="fill:var(--c-logic);stroke:var(--ink)" stroke-width="2.5" stroke-linejoin="round"/><path d="M11,16 C13,11 16,9 19,9" style="fill:none;stroke:var(--card)" stroke-width="2.5" stroke-linecap="round"/><path d="M3,31 L37,31" style="stroke:var(--ink)" stroke-width="3" stroke-linecap="round"/><text x="20" y="27" text-anchor="middle" style="fill:var(--ink);font-size:16px;font-family:inherit">?</text></svg>`;
      function drawLock(reveal) {
        lockRow.innerHTML = secret.map((f, i) => (reveal
          ? `<span class="tap-pop" style="width:44px;height:44px;font-size:30px;line-height:44px;text-align:center">${f}</span>`
          : shell(i))).join('');
      }
      drawLock(false);
      const pegs = (fb) => {
        const out = [];
        for (let i = 0; i < len; i++) {
          const x = 8 + i * 15, kind = i < fb.black ? 2 : i < fb.black + fb.white ? 1 : 0;
          out.push(kind === 2 ? `<circle cx="${x}" cy="12" r="6" style="fill:var(--ink)"/><path d="M${x - 3},10 a3,3 0 0 1 3,-3" style="fill:none;stroke:var(--card)" stroke-width="1.6" stroke-linecap="round"/>`
            : kind === 1 ? `<circle cx="${x}" cy="12" r="6" style="fill:var(--card);stroke:var(--ink)" stroke-width="2"/>`
              : `<circle cx="${x}" cy="12" r="2.5" style="fill:var(--ink-faint)"/>`);
        }
        return `<svg viewBox="0 0 ${len * 15 + 2} 24" width="${len * 15 + 2}" height="24" style="display:block;flex:none">${out.join('')}</svg>`;
      };
      const rows = Array.from({ length: tries }, (_, k) => {
        const row = F.h(`<div style="display:flex;align-items:center;gap:8px;height:${rowH}px;padding:0 4px;border-radius:10px"><span style="width:24px;font-size:16px;color:var(--ink-soft);text-align:right">${k + 1}</span><span class="fr" style="flex:1;display:flex;gap:6px;justify-content:center"></span><span class="pg"></span></div>`);
        row.querySelector('.fr').innerHTML = Array(len).fill(`<span style="width:${rowH - 8}px;height:${rowH - 8}px;border:2px dashed var(--ink-faint);border-radius:50%"></span>`).join('');
        row.querySelector('.pg').innerHTML = pegs({ black: 0, white: 0 });
        hist.appendChild(row);
        return row;
      });
      const cur = F.h(`<div style="display:flex;gap:8px;justify-content:center"></div>`);
      const pal = F.h(`<div style="display:flex;gap:8px;justify-content:center;width:100%"></div>`);
      const go = F.h(`<button class="btn primary block" style="min-height:56px">${F.tt({ de: 'Prüfen', en: 'Check' })}</button>`);
      wrap.append(hist, cur, pal, go);
      ctx.el.innerHTML = '';
      ctx.el.appendChild(wrap);

      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };
      const slotBtns = guess.map((_, i) => {
        const b = F.h('<button class="opt" style="width:58px;min-height:58px;font-size:30px;padding:0"></button>');
        b.onclick = () => { if (!over && guess[i]) { guess[i] = null; ctx.sfx('tap'); pop(b); draw(); } };
        cur.appendChild(b);
        return b;
      });
      const palBtns = pool.map((f) => {
        const b = F.h(`<button class="opt" style="flex:0 1 58px;min-width:0;min-height:58px;font-size:30px;padding:0;background:var(--c-math)">${f}</button>`);
        b.onclick = () => {
          if (over) return;
          let k = guess.indexOf(null);
          if (k < 0) return;
          if (!repeats && guess.includes(f)) return;
          guess[k] = f; ctx.sfx('tap'); pop(slotBtns[k]); draw();
        };
        pal.appendChild(b);
        return b;
      });
      function draw() {
        slotBtns.forEach((b, i) => {
          b.textContent = guess[i] || '';
          b.style.borderStyle = guess[i] ? 'solid' : 'dashed';
          b.style.background = guess[i] ? 'var(--card)' : 'transparent';
          b.style.boxShadow = guess[i] ? '' : 'none';
        });
        palBtns.forEach((b, i) => { b.style.opacity = !over && !repeats && guess.includes(pool[i]) ? '0.4' : '1'; });
        rows.forEach((row, k) => { row.style.background = !over && k === used ? 'var(--card)' : ''; });
        go.disabled = guess.includes(null);
        go.style.opacity = go.disabled ? 0.5 : 1;
      }
      go.onclick = async () => {
        if (over || guess.includes(null)) return;
        const g = guess.slice(), fb = feedback(secret, g);
        const row = rows[used];
        used++;
        ctx.setScore(`${used} / ${tries}`);
        row.querySelector('.fr').innerHTML = g.map((f) => `<span style="width:${rowH - 4}px;text-align:center;font-size:${rowH - 10}px;line-height:${rowH - 4}px">${f}</span>`).join('');
        row.querySelector('.pg').innerHTML = pegs(fb);
        pop(row);
        guess.fill(null); draw();
        const won = fb.black === len;
        if (!won && used < tries) { ctx.sfx('tick'); return; }
        over = true;
        draw();
        drawLock(true);
        ctx.sfx(won ? 'good' : 'bad');
        row.style.background = won ? 'var(--good)' : '';
        if (!won) lockRow.classList.add('flash-bad');
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
