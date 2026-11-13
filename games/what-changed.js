/* What Changed?: study a grid of doodles, then spot the one that vanished or was swapped. */
(function () {
  const F = Funkloch;
  const POOL = ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐵', '🐔', '🐧', '🐢', '🐙', '🦋', '🐝', '🍎', '🍌', '🍒', '🍕', '🎈', '⭐', '🌙', '🔔', '🎲', '🚲', '🎸', '🍩', '🌵', '🔑', '🧦'];
  const ROUNDS = 8;
  // drawn motif: a magnifying glass over a small framed picture
  const MOTIF = `<svg class="motif" viewBox="0 0 320 66" width="320" height="66" aria-hidden="true" style="transform:rotate(-1.4deg)">
    <g stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M70 8 L176 10 L174 60 L68 58 Z" fill="var(--c-memory)"/>
      <path d="M80 17 L166 18 L165 51 L79 50 Z" fill="var(--card)"/>
      <path d="M84 48 L104 30 L118 42 L130 32 L160 49" fill="none"/>
      <circle cx="146" cy="27" r="5" fill="var(--c-math)"/>
      <circle cx="226" cy="30" r="20" fill="var(--c-focus)" opacity=".85"/>
      <circle cx="226" cy="30" r="20" fill="none"/>
      <path d="M215 22 Q218 14 227 13" fill="none" stroke="var(--card)" stroke-width="3"/>
      <path d="M241 45 L262 62" stroke-width="8"/>
      <ellipse cx="28" cy="33" rx="9" ry="12" fill="var(--card)"/><ellipse cx="48" cy="32" rx="9" ry="12" fill="var(--card)"/><circle cx="31" cy="36" r="4" fill="var(--ink)"/><circle cx="51" cy="35" r="4" fill="var(--ink)"/>
      <path d="M284 20 l4 8 l8 1 l-6 5 l2 8 l-8 -4 l-7 4 l1 -8 l-6 -5 l8 -1 Z" fill="var(--c-math)"/>
    </g></svg>`;

  F.registerGame({
    id: 'what-changed', skill: 'memory', added: '2026-11-08', glyph: '👀',
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
        const card = F.h('<div class="sketch" style="background:var(--card);box-shadow:var(--shadow);margin:2px 6px 14px;padding:8px 12px;transform:rotate(-.6deg)"></div>');
        const head = F.h('<div style="text-align:center;font-size:22px;min-height:28px;line-height:1.2"></div>');
        const clock = F.h('<div style="height:12px;margin-top:6px;border:2.5px solid var(--ink);border-radius:8px 11px 7px 10px;background:var(--paper-2);overflow:hidden"><div style="height:100%;width:100%;background:var(--c-memory);transform-origin:left;transform:scaleX(1)"></div></div>');
        card.append(head, clock);
        // board size from the height budget, so 3×4 and 4×4 never push the page into scrolling
        const cell = Math.floor((400 - (rows - 1) * 8 - 20) / rows);
        const frame = F.h(`<div class="sketch" style="background:var(--paper-2);box-shadow:var(--shadow);padding:10px;margin:0 auto;max-width:${Math.min(358, cols * cell + (cols - 1) * 8 + 25)}px"></div>`);
        const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${cols},minmax(0,1fr));gap:8px"></div>`);
        frame.appendChild(board);
        const cells = puz.items.map((it, i) => {
          const b = F.h(`<button style="aspect-ratio:1;min-width:0;padding:0;min-height:64px;border:2.5px solid var(--ink);border-radius:${i % 2 ? '16px 11px 15px 10px' : '11px 16px 10px 15px'};font-size:${cols > 3 ? 38 : 44}px;line-height:1;background:var(--card);color:var(--ink);box-shadow:var(--shadow);display:flex;align-items:center;justify-content:center;overflow:hidden"></button>`);
          b.textContent = it;
          board.appendChild(b);
          return b;
        });
        const msg = F.h('<div class="info-line" style="min-height:26px;font-size:19px;margin-top:10px"></div>');
        ctx.el.append(F.h(MOTIF), card, frame, msg);
        head.textContent = F.tt({ de: 'Merk dir das Bild!', en: 'Memorise the picture!' });
        // drawn study clock: the bar shrinks over the study time (transform only)
        const bar = clock.firstElementChild;
        void bar.offsetWidth;
        bar.style.transition = `transform ${study}ms linear`;
        bar.style.transform = 'scaleX(0)';
        // drawn cover for the hidden moment: hatched card with a question mark
        const COVER = (i) => `<svg viewBox="0 0 40 40" style="width:100%;height:100%;display:block"><g stroke="var(--ink-faint)" stroke-width="2" stroke-linecap="round">${[0, 1, 2, 3, 4, 5, 6].map((k) => `<path d="M${-6 + k * 9 + (i % 2) * 3} 42 L${10 + k * 9 + (i % 2) * 3} -2"/>`).join('')}</g><circle cx="20" cy="20" r="10" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/><path d="M16.5 17 Q16.5 13 20 13 Q23.5 13 23.5 16.5 Q23.5 19 20 20 L20 22.5" fill="none" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round"/><circle cx="20" cy="26" r="1.5" fill="var(--ink)"/></svg>`;

        (async () => {
          await ctx.wait(study);
          if (over) return;
          cells.forEach((b, i) => { b.innerHTML = COVER(i); b.style.background = 'var(--paper)'; });
          head.textContent = F.tt({ de: 'Zugedeckt …', en: 'Covered …' });
          await ctx.wait(900);
          cells.forEach((b, i) => { b.textContent = i === puz.at ? puz.after : puz.items[i]; b.style.background = 'var(--card)'; b.classList.add('pop-in'); });
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
              b.classList.remove('pop-in'); void b.offsetWidth; b.classList.add(ok ? 'tap-pop' : 'flash-bad');
              if (ok && round < ROUNDS) F.cheer(8);
              if (!ok) { cells[puz.at].style.outline = '4px dashed var(--accent)'; cells[puz.at].style.outlineOffset = '2px'; }
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
