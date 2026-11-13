/* Simon Says: watch the pads light up, then repeat the pattern. It grows by one every round. */
(function () {
  const F = Funkloch;
  const PADS = [
    { c: '#E8685F', s: '▲' }, { c: '#4F94E0', s: '●' },
    { c: '#E9B93A', s: '■' }, { c: '#4FB874', s: '★' },
  ];

  F.registerGame({
    id: 'simon', skill: 'memory', added: '2026-10-26', glyph: '🌈',
    name: { de: 'Simon sagt', en: 'Simon Says' },
    desc: { de: 'Schau zu, wie die Felder nacheinander aufleuchten, und tippe sie in derselben Reihenfolge nach. Jede Runde kommt ein Feld dazu. Je länger deine Kette, desto mehr Punkte.', en: 'Watch the pads light up one by one, then tap them in the same order. Each round adds one more pad. The longer your chain, the more points.' },
    start(ctx) {
      const r = ctx.rng;
      const seq = [];
      const gap = Math.max(260, 520 - ctx.level * 14);
      let listening = false, pos = 0, over = false;
      ctx.el.innerHTML = '';
      // drawn motif: a rainbow over two little clouds
      const motif = F.h(`<svg class="motif" viewBox="0 0 300 70" width="350" height="82" aria-hidden="true" style="transform:rotate(-1deg)">
        <g stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none">
          ${PADS.map((p, k) => `<path d="M${78 + k * 12} 62 A${72 - k * 12} ${54 - k * 11} 0 0 1 ${222 - k * 12} 62" stroke="${p.c}" stroke-width="10"/>`).join('')}
          <path d="M73 62 A77 59 0 0 1 227 62 M119 62 A31 21 0 0 1 181 62"/>
          <path d="M52 64 q-14 0 -12 -12 q2 -10 14 -8 q4 -12 18 -8 q12 -2 14 10 q12 2 8 12 Z" fill="var(--card)"/>
          <path d="M210 64 q-12 0 -10 -11 q2 -9 13 -7 q4 -11 17 -7 q11 -2 13 9 q11 2 7 11 Z" fill="var(--card)"/>
          <path d="M262 18 l3 6 l6 1 l-4.5 4 l1.5 6 l-6 -3 l-5 3 l1 -6 l-4.5 -4 l6 -1 Z" fill="var(--c-math)"/>
        </g></svg>`);
      const card = F.h('<div class="sketch" style="background:var(--card);box-shadow:var(--shadow);margin:8px 6px 26px;padding:10px 12px;transform:rotate(.6deg)"></div>');
      const status = F.h('<div style="text-align:center;font-size:22px;min-height:28px;line-height:1.2"></div>');
      const prog = F.h('<div style="height:12px;margin-top:6px;border:2.5px solid var(--ink);border-radius:8px 11px 7px 10px;background:var(--paper-2);overflow:hidden"><div style="height:100%;width:100%;background:var(--c-memory);transform-origin:left;transform:scaleX(0);transition:transform .2s"></div></div>');
      card.append(status, prog);
      const setProg = (p) => { prog.firstElementChild.style.transform = `scaleX(${p})`; };
      const board = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;padding:0 4px;touch-action:manipulation"></div>');
      // drawn symbols with a shine stroke instead of plain text glyphs
      const SHAPE = [
        '<path d="M50 18 L82 76 L18 76 Z"/><path d="M40 52 L48 38" stroke="#fff" stroke-width="5" opacity=".7" fill="none"/>',
        '<circle cx="50" cy="50" r="30"/><path d="M32 42 Q36 28 50 26" stroke="#fff" stroke-width="5" opacity=".7" fill="none"/>',
        '<path d="M22 22 L78 23 L77 78 L23 77 Z"/><path d="M32 46 L32 33 L45 33" stroke="#fff" stroke-width="5" opacity=".7" fill="none"/>',
        '<path d="M50 14 L59 38 L85 39 L64 55 L72 80 L50 65 L28 80 L36 55 L15 39 L41 38 Z"/><path d="M38 46 L45 41" stroke="#fff" stroke-width="5" opacity=".7" fill="none"/>',
      ];
      const pads = PADS.map((p, i) => {
        const b = F.h(`<button aria-label="${p.s}" style="aspect-ratio:1;min-width:0;padding:0;min-height:96px;border:3px solid var(--ink);border-radius:${['26px 18px 24px 16px', '18px 26px 16px 24px', '18px 24px 16px 26px', '24px 16px 26px 18px'][i]};background:${p.c};color:#2B2522;cursor:pointer;box-shadow:var(--shadow);opacity:.55;transition:opacity .08s,transform .08s;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 100 100" style="width:52%;height:52%;display:block"><g fill="rgba(255,255,255,.35)" stroke="#2B2522" stroke-width="5" stroke-linejoin="round" stroke-linecap="round">${SHAPE[i]}</g></svg></button>`);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(i); });
        board.appendChild(b);
        return b;
      });
      ctx.el.append(motif, card, board);

      async function flash(i, ms) {
        pads[i].style.opacity = '1'; pads[i].style.transform = 'scale(1.06)';
        ctx.sfx('tap');
        await ctx.wait(ms);
        pads[i].style.opacity = ''; pads[i].style.transform = '';
      }
      async function show() {
        listening = false; pos = 0;
        seq.push(r.int(0, 3));
        // avoid three identical pads in a row so every chain stays readable
        const n = seq.length;
        if (n >= 3 && seq[n - 1] === seq[n - 2] && seq[n - 2] === seq[n - 3]) seq[n - 1] = (seq[n - 1] + r.int(1, 3)) % 4;
        ctx.setScore(n - 1);
        status.textContent = F.tt({ de: 'Schau genau …', en: 'Watch closely …' });
        setProg(0);
        await ctx.wait(650);
        for (let k = 0; k < seq.length; k++) { setProg((k + 1) / seq.length); await flash(seq[k], gap); await ctx.wait(120); }
        setProg(0);
        status.textContent = F.tt({ de: `Du bist dran! ${n} ${n === 1 ? 'Feld' : 'Felder'}`, en: `Your turn! ${n} ${n === 1 ? 'pad' : 'pads'}` });
        listening = true;
      }
      async function tap(i) {
        if (!listening || over) return;
        if (i !== seq[pos]) {
          over = true; listening = false;
          ctx.sfx('bad');
          pads[seq[pos]].style.outline = '4px dashed var(--ink)';
          pads[seq[pos]].style.outlineOffset = '3px';
          pads[i].classList.add('flash-bad');
          status.textContent = F.tt({ de: 'Falsch!', en: 'Oops!' });
          await ctx.wait(1100);
          return end();
        }
        flash(i, 160);
        pos++;
        setProg(pos / seq.length);
        if (pos === seq.length) {
          listening = false; ctx.sfx('good');
          status.textContent = F.tt({ de: 'Richtig!', en: 'Correct!' });
          F.cheer(8);
          ctx.setScore(seq.length);
          await ctx.wait(700);
          show();
        }
      }
      function end() {
        const len = seq.length - 1;
        ctx.finish({
          score: len, detail: F.tt({ de: `Kette von ${len}`, en: `Chain of ${len}` }),
          levelDelta: len >= 9 ? 1 : len < 4 ? -1 : 0,
          quality: Math.min(1, len / 10), ink: 2 + len,
        });
      }
      show();
    },
  });
})();
