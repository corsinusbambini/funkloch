/* What Changed?: study a grid of doodles, then spot the one that vanished or was swapped. */
(function () {
  const F = Funkloch;
  const POOL = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🐔', '🐧', '🐢', '🐙', '🦋', '🐝', '🍎', '🍌', '🍒', '🍕', '🎈', '⭐', '🌙', '🔔', '🎲', '🚲', '🎸', '🍩', '🌵', '🔑', '🧦'];
  const ROUNDS = 8;

  F.registerGame({
    id: 'what-changed', skill: 'memory', added: '2026-11-08', glyph: '🔍',
    name: { de: 'Was hat sich verändert?', en: 'What Changed?' },
    desc: {
      de: 'Merke dir das Bild aus Figuren. Dann wird es kurz verdeckt und ein Feld ist anders: weg oder ausgetauscht. Tippe das veränderte Feld an. 8 Runden, das Bild wird grösser und die Merkzeit kürzer.',
      en: 'Memorise the grid of doodles. Then it is covered briefly and one cell is different: gone or replaced. Tap the changed cell. 8 rounds; the grid grows and the study time shrinks.',
    },
    start(ctx) {
      const r = ctx.rng;
      const lvl = Math.max(0, Math.min(10, ctx.level || 0));
      let round = 0, right = 0, points = 0, over = false;

      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const cols = Math.min(4, 3 + (lvl + round >= 8 ? 1 : 0));
        const rows = Math.min(4, 2 + Math.floor((lvl + round) / 4) + 1);
        const n = cols * rows;
        const study = Math.max(1800, 4600 - lvl * 220 - round * 120);
        const puz = ctx.fresh(() => {
          const items = r.shuffle(POOL.slice()).slice(0, n);
          const at = Math.floor(r() * n);
          const vanish = r() < 0.5;
          let after;
          if (vanish) after = '';
          else { const spare = POOL.filter((p) => !items.includes(p)); after = r.pick(spare); }
          return { items, at, after };
        }, (p) => p.items.join('') + p.at + p.after);

        ctx.el.innerHTML = '';
        const head = F.h('<div class="info-line" style="min-height:26px"></div>');
        const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:8px;max-width:340px;margin:12px auto"></div>`);
        const cells = puz.items.map((it, i) => {
          const b = F.h('<button style="aspect-ratio:1;min-width:0;padding:0;min-height:64px;border:2.5px solid var(--ink);border-radius:14px;font-size:34px;line-height:1;background:var(--card);color:var(--ink);box-shadow:var(--shadow)"></button>');
          b.textContent = it;
          board.appendChild(b);
          return b;
        });
        const msg = F.h('<div class="info-line" style="min-height:24px"></div>');
        ctx.el.append(head, board, msg);
        head.textContent = F.tt({ de: 'Merk dir das Bild!', en: 'Memorise the picture!' });

        (async () => {
          await ctx.wait(study);
          if (over) return;
          cells.forEach((b) => { b.textContent = '❔'; b.style.opacity = '.55'; });
          await ctx.wait(900);
          cells.forEach((b, i) => { b.textContent = i === puz.at ? puz.after : puz.items[i]; b.style.opacity = ''; });
          head.textContent = F.tt({ de: 'Welches Feld ist anders?', en: 'Which cell is different?' });
          let done = false;
          cells.forEach((b, i) => {
            b.style.cursor = 'pointer';
            b.onclick = async () => {
              if (done) return; done = true;
              const ok = i === puz.at;
              if (ok) { right++; points += 10 + (study < 2600 ? 4 : 0); }
              ctx.sfx(ok ? 'good' : 'bad');
              b.style.background = ok ? 'var(--good)' : 'var(--bad)';
              if (!ok) cells[puz.at].style.outline = '4px dashed var(--accent)';
              msg.textContent = ok ? F.tt({ de: 'Richtig!', en: 'Right!' }) : F.tt({ de: 'Dieses Feld war anders.', en: 'That one was different.' });
              ctx.setScore(points);
              await ctx.wait(ok ? 700 : 1300);
              next();
            };
          });
        })();
      }
      function end() {
        over = true;
        ctx.finish({
          score: points, detail: F.tt({ de: `${right}/${ROUNDS} richtig`, en: `${right}/${ROUNDS} right` }),
          levelDelta: right >= 7 ? 1 : right < 4 ? -1 : 0, quality: right / ROUNDS, ink: 3 + right * 2,
        });
      }
      ctx.onCleanup(() => { over = true; });
      next();
    },
  });
})();
