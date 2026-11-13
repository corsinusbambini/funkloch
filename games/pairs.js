/* Pairs (Memory): flip two cards at a time and find all matching pairs. Every deal uses different pictures. */
(function () {
  const F = Funkloch;
  const POOL = ['🍎', '🍌', '🍒', '🍇', '🍉', '🍓', '🥕', '🌽', '🍄', '🌵', '🌻', '🌷', '🐶', '🐱', '🐭', '🐸', '🐵', '🐔', '🐧', '🐢', '🐙', '🦋', '🐞', '🐝', '⭐', '🌙', '☀️', '☁️', '❄️', '🔥', '🎈', '🎁', '🔔', '🎲', '🎸', '⚽', '🚲', '✈️', '🏠', '🔑'];
  const SHAPES = { easy: [3, 4], normal: [4, 4], hard: [4, 5] };

  F.registerGame({
    id: 'pairs', skill: 'memory', added: '2026-10-25', glyph: '🃏',
    name: { de: 'Memory', en: 'Pairs' },
    desc: { de: 'Decke zwei Karten auf. Gleiche Bilder bleiben offen, sonst drehen sie sich wieder um. Finde alle Paare mit möglichst wenigen Versuchen. Jedes Mal sind andere Bilder dabei.', en: 'Flip two cards. Matching pictures stay up, otherwise they turn back. Find all pairs in as few tries as you can. The pictures are different every time.' },
    modes: [
      { id: 'easy', name: { de: 'Leicht', en: 'Easy' }, desc: { de: '3×4, 6 Paare', en: '3×4, 6 pairs' } },
      { id: 'normal', name: { de: 'Normal', en: 'Normal' }, desc: { de: '4×4, 8 Paare', en: '4×4, 8 pairs' } },
      { id: 'hard', name: { de: 'Schwer', en: 'Hard' }, desc: { de: '4×5, 10 Paare', en: '4×5, 10 pairs' } },
    ],
    start(ctx) {
      const r = ctx.rng;
      const [cols, rows] = SHAPES[ctx.mode] || SHAPES.normal;
      const N = cols * rows, P = N / 2;
      const deck = r.shuffle(r.shuffle(POOL.slice()).slice(0, P).flatMap((e) => [e, e]));
      let open = [], tries = 0, found = 0, busy = false;

      ctx.el.innerHTML = '';
      // drawn motif: two playing cards, one face down, one turned over
      const motif = F.h(`<svg class="motif" viewBox="0 0 300 62" width="${rows === cols ? 360 : 300}" height="${rows === cols ? 74 : 62}" aria-hidden="true">
        <g stroke="var(--ink)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
          <path d="M106 8 L146 4 L150 56 L110 60 Z" fill="var(--c-memory)"/>
          <path d="M114 14 L140 12 M115 24 L142 22 M116 34 L143 32 M117 44 L144 42" stroke="var(--ink-soft)" stroke-width="1.6" fill="none"/>
          <path d="M160 6 L200 10 L196 60 L156 56 Z" fill="var(--card)"/>
          <path d="M178 22 C186 14 194 24 178 40 C162 24 170 14 178 22 Z" fill="var(--c-fun)"/>
          <path d="M150 30 q4 -6 8 0" fill="none"/>
          <path d="M60 30 l4 8 l8 1 l-6 5 l2 8 l-8 -4 l-7 4 l1 -8 l-6 -5 l8 -1 Z" fill="var(--c-math)"/>
          <path d="M244 22 l3 6 l6 1 l-4.5 4 l1.5 6 l-6 -3 l-5 3 l1 -6 l-4.5 -4 l6 -1 Z" fill="var(--c-fun)"/><path d="M226 44 l6 0 M229 41 l0 6 M262 12 l5 0 M264.5 9.5 l0 5" fill="none" stroke="var(--ink-soft)"/>
        </g></svg>`);
      // drawn status: one little card per pair, filled in when found
      const status = F.h(`<div class="sketch" style="background:var(--card);box-shadow:var(--shadow);margin:8px 6px ${rows === cols ? 20 : 14}px;padding:6px 10px;display:flex;align-items:center;justify-content:center;gap:10px;transform:rotate(.5deg)"></div>`);
      const triesEl = F.h('<span style="font-size:20px;white-space:nowrap"></span>');
      const slots = F.h('<span style="display:flex;gap:3px;flex-wrap:nowrap"></span>');
      status.append(triesEl, slots);
      const cell = Math.floor((450 - (rows - 1) * 8 - 20) / rows);
      const frame = F.h(`<div class="sketch alt" style="background:var(--paper-2);box-shadow:var(--shadow);padding:10px;margin:0 auto;max-width:${Math.min(358, cols * cell + (cols - 1) * 8 + 25)}px"></div>`);
      const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:8px;touch-action:manipulation"></div>`);
      frame.appendChild(board);
      const btns = deck.map((_, i) => {
        const b = F.h(`<button style="aspect-ratio:1;min-width:0;padding:0;min-height:48px;border:2.5px solid var(--ink);border-radius:${i % 2 ? '14px 10px 13px 9px' : '10px 14px 9px 13px'};font-size:${cols > 3 ? 36 : 42}px;line-height:1;cursor:pointer;color:var(--ink);font-family:inherit;box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center;overflow:hidden"></button>`);
        b.onclick = () => tap(i);
        board.appendChild(b);
        return b;
      });
      ctx.el.append(motif, status, frame);

      // card back: hatching, a dashed inner frame and a spiral (same on every card, so the back gives no hints)
      const BACK = () => {
        const mid = '<circle cx="20" cy="20" r="8.5" fill="var(--card)"/><path d="M20 20 m1 -1 a1.5 1.5 0 1 1 -2 2 a3.5 3.5 0 1 1 4.5 -4 a5.5 5.5 0 1 1 -7.5 6.5" fill="none" stroke-linecap="round"/>';
        return `<svg viewBox="0 0 40 40" style="width:100%;height:100%;display:block"><g stroke="var(--ink)" stroke-width="1.3" stroke-linecap="round" opacity=".35">${[0, 1, 2, 3, 4, 5, 6].map((k) => `<path d="M${-8 + k * 8} 44 L${12 + k * 8} -4"/>`).join('')}</g><rect x="5" y="5" width="30" height="30" rx="5" fill="none" stroke="var(--ink)" stroke-width="1.4" stroke-dasharray="3 3" opacity=".6"/><g stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round">${mid}</g></svg>`;
      };
      const pop = (b, cls) => { b.classList.remove('tap-pop', 'flash-bad'); void b.offsetWidth; b.classList.add(cls); };
      const hide = (b) => { b.innerHTML = BACK();b.style.background = 'var(--c-memory)'; };
      const show = (b, i) => { b.textContent = deck[i]; b.style.background = 'var(--card)'; pop(b, 'tap-pop'); };
      btns.forEach(hide);
      const slot = (on) => `<svg viewBox="0 0 16 22" width="${P > 8 ? 14 : 16}" height="${P > 8 ? 19 : 22}" style="display:block;flex:none"><path d="M2 2 L14 3 L13 20 L1 19 Z" fill="${on ? 'var(--c-spatial)' : 'none'}" stroke="${on ? 'var(--ink)' : 'var(--ink-faint)'}" stroke-width="1.8" stroke-linejoin="round"/>${on ? '<path d="M4.5 11 L7 14 L11.5 7.5" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>' : ''}</svg>`;
      const info = () => {
        ctx.setInfo(F.tt({ de: `Versuche: ${tries}`, en: `Tries: ${tries}` })); ctx.setScore(found);
        triesEl.textContent = F.tt({ de: `Paare ${found}/${P}`, en: `Pairs ${found}/${P}` });
        slots.innerHTML = Array.from({ length: P }, (_, k) => slot(k < found)).join('');
      };
      info();

      async function tap(i) {
        if (busy || open.includes(i) || btns[i].disabled) return;
        open.push(i); show(btns[i], i); ctx.sfx('tap');
        if (open.length < 2) return;
        tries++; info();
        const [a, b] = open;
        open = [];
        if (deck[a] === deck[b]) {
          found++; info(); ctx.sfx('good');
          [a, b].forEach((k) => { btns[k].disabled = true; btns[k].style.background = 'var(--c-spatial)'; pop(btns[k], 'tap-pop'); });
          if (found === P) {
            busy = true;
            await ctx.wait(700);
            const score = Math.max(1, Math.round(P * 10 - Math.max(0, tries - P) * 3));
            ctx.finish({ score, display: F.tt({ de: `${tries} Versuche`, en: `${tries} tries` }), quality: Math.min(1, P / tries + 0.1) });
          }
          return;
        }
        busy = true; ctx.sfx('bad');
        [a, b].forEach((k) => pop(btns[k], 'flash-bad'));
        await ctx.wait(850);
        if (ctx.dead) return;
        hide(btns[a]); hide(btns[b]);
        busy = false;
      }
    },
  });
})();
