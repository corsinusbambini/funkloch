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
      const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:8px;max-width:340px;margin:12px auto;touch-action:manipulation"></div>`);
      const btns = deck.map((_, i) => {
        const b = F.h('<button style="aspect-ratio:1;min-width:0;padding:0;min-height:48px;border:2.5px solid var(--ink);border-radius:12px;font-size:30px;line-height:1;cursor:pointer;color:var(--ink);font-family:inherit;box-shadow:var(--shadow)"></button>');
        b.onclick = () => tap(i);
        board.appendChild(b);
        return b;
      });
      ctx.el.appendChild(board);

      const hide = (b) => { b.textContent = ''; b.style.background = 'var(--c-memory)'; };
      const show = (b, i) => { b.textContent = deck[i]; b.style.background = 'var(--card)'; };
      btns.forEach(hide);
      const info = () => { ctx.setInfo(F.tt({ de: `Versuche: ${tries}`, en: `Tries: ${tries}` })); ctx.setScore(found); };
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
          [a, b].forEach((k) => { btns[k].disabled = true; btns[k].style.background = 'var(--c-spatial)'; });
          if (found === P) {
            busy = true;
            await ctx.wait(700);
            const score = Math.max(1, Math.round(P * 10 - Math.max(0, tries - P) * 3));
            ctx.finish({ score, display: F.tt({ de: `${tries} Versuche`, en: `${tries} tries` }), quality: Math.min(1, P / tries + 0.1) });
          }
          return;
        }
        busy = true; ctx.sfx('bad');
        await ctx.wait(850);
        if (ctx.dead) return;
        hide(btns[a]); hide(btns[b]);
        busy = false;
      }
    },
  });
})();
