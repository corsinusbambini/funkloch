/* Breathing Bubble (fun, relaxing): hold your finger on the pad to inflate the bubble while it breathes in,
   keep it still while it holds, let go while it breathes out. Stay inside the dotted ring. */
(function () {
  const F = Funkloch;
  const CYCLES = 5, RMIN = 42, RMAX = 108, TOL = 15;
  const PATTERNS = [[4, 2, 5], [4, 4, 4], [5, 2, 6], [4, 3, 6]];

  F.registerGame({
    id: 'breathing-bubble', skill: 'fun', added: '2026-11-17', glyph: '🌬️', noDaily: true,
    name: { de: 'Atem-Blase', en: 'Breathing Bubble' },
    desc: {
      de: 'Ein ruhiges Spiel zum Durchatmen. Halte den Finger auf die Fläche, damit die Blase wächst, solange der gepunktete Ring grösser wird. Beim Halten bleibst du still, beim Ausatmen lässt du los. Bleibe mit der Blase im Ring: Je genauer, desto mehr Punkte. 5 Atemzüge.',
      en: 'A calm game to breathe along with. Hold your finger on the pad to grow the bubble while the dotted ring gets bigger. Keep still while it holds, let go while it breathes out. Keep the bubble inside the ring: the closer, the more points. 5 breaths.',
    },
    start(ctx) {
      const r = ctx.rng;
      const [tin, thold, tout] = r.pick(PATTERNS), trest = 1.2, cyc = tin + thold + tout + trest;
      const t = (o) => F.esc(F.tt(o));
      let clock = 0, rp = RMIN, press = false, ok = 0, tot = 0, raf = 0, last = 0, over = false, lastCycle = 0, perfect = 0, cycOk = 0, cycTot = 0;
      const ease = (x) => x * x * (3 - 2 * x);
      const target = (c) => (c < tin ? RMIN + (RMAX - RMIN) * ease(c / tin) : c < tin + thold ? RMAX : c < tin + thold + tout ? RMAX - (RMAX - RMIN) * ease((c - tin - thold) / tout) : RMIN);
      const phase = (c) => (c < tin ? 0 : c < tin + thold ? 1 : c < tin + thold + tout ? 2 : 3);
      const WORDS = [{ de: 'Atme ein …', en: 'Breathe in …' }, { de: 'Halte …', en: 'Hold …' }, { de: 'Atme aus …', en: 'Breathe out …' }, { de: 'Ruhe …', en: 'Rest …' }];

      ctx.el.innerHTML = '';
      const stars = Array.from({ length: 7 }, (_, i) => `<path transform="translate(${[30, 268, 52, 250, 150, 20, 280][i]},${[34, 50, 250, 262, 18, 150, 160][i]}) scale(${0.5 + (i % 3) * 0.2})" d="M0,-8 Q1,-1 8,0 Q1,1 0,8 Q-1,1 -8,0 Q-1,-1 0,-8 Z" style="fill:var(--c-fun);stroke:var(--ink)" stroke-width="2" opacity=".8"/>`).join('');
      const card = F.h(`<div class="sketch pop-in" style="padding:8px;margin:4px 0 8px;background:var(--card);box-shadow:var(--shadow);transform:rotate(-0.4deg)">
        <svg viewBox="0 0 300 300" style="display:block;width:100%;height:auto" aria-hidden="true">${stars}
          <circle class="bb-ring" cx="150" cy="150" r="${RMIN}" fill="none" style="stroke:var(--ink-soft)" stroke-width="4" stroke-dasharray="3 9" stroke-linecap="round"/>
          <g class="bb-b"><circle class="bb-c" cx="150" cy="150" r="${RMIN}" style="fill:var(--c-fun);stroke:var(--ink)" stroke-width="4" fill-opacity=".85"/>
          <path class="bb-h" d="M120,130 a36,36 0 0 1 24,-20" fill="none" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity=".7"/></g>
          <text class="bb-w" x="150" y="293" text-anchor="middle" font-size="26" style="fill:var(--ink)"></text></svg></div>`);
      const pad = F.h(`<button class="btn primary big" style="width:100%;min-height:150px;font-size:26px;touch-action:none;-webkit-user-select:none;user-select:none"></button>`);
      const prog = F.h(`<div style="text-align:center;font-size:20px;color:var(--ink-soft);margin-top:10px"></div>`);
      ctx.el.append(card, pad, prog);
      const ring = card.querySelector('.bb-ring'), circ = card.querySelector('.bb-c'), word = card.querySelector('.bb-w'), hl = card.querySelector('.bb-h');
      const setPad = () => { pad.innerHTML = press ? `✋ ${t({ de: 'Halte … und atme ein', en: 'Hold … breathing in' })}` : `☁️ ${t({ de: 'Gedrückt halten = einatmen', en: 'Press and hold = breathe in' })}`; pad.style.transform = press ? 'translate(2px,2px)' : ''; };
      setPad();
      const down = (e) => { e.preventDefault(); if (!press) { press = true; setPad(); ctx.sfx('tick'); } };
      const up = (e) => { if (e) e.preventDefault(); if (press) { press = false; setPad(); } };
      pad.addEventListener('pointerdown', down); pad.addEventListener('pointerup', up); pad.addEventListener('pointercancel', up); pad.addEventListener('pointerleave', up);
      ctx.setInfo(`1 / ${CYCLES}`);

      function frame(ts) {
        if (over || ctx.dead) return;
        const dt = Math.min(0.05, last ? (ts - last) / 1000 : 0.016); last = ts;
        clock += dt;
        const n = Math.floor(clock / cyc), c = clock - n * cyc;
        if (n >= CYCLES) return end();
        if (n !== lastCycle) { // a breath is complete
          if (cycTot && cycOk / cycTot >= 0.7) { perfect++; ctx.sfx('good'); F.cheer(4); }
          lastCycle = n; cycOk = 0; cycTot = 0; ctx.setInfo(`${n + 1} / ${CYCLES}`);
        }
        const rate = (RMAX - RMIN) / Math.max(2.5, tin);
        rp = Math.max(RMIN, Math.min(RMAX + 10, rp + (press ? rate * 1.1 : -(RMAX - RMIN) / Math.max(2.5, tout) * 1.1) * dt));
        const tr = target(c), good = Math.abs(rp - tr) < TOL;
        if (c < cyc - 0.2) { tot += dt; cycTot += dt; if (good) { ok += dt; cycOk += dt; } }
        ring.setAttribute('r', tr.toFixed(1)); circ.setAttribute('r', rp.toFixed(1));
        circ.style.fill = good ? 'var(--good)' : 'var(--c-fun)';
        hl.setAttribute('d', `M${(150 - 0.62 * rp).toFixed(1)},${(150 - 0.15 * rp).toFixed(1)} a${(0.64 * rp).toFixed(1)},${(0.64 * rp).toFixed(1)} 0 0 1 ${(0.36 * rp).toFixed(1)},${(-0.5 * rp).toFixed(1)}`);
        word.textContent = F.tt(WORDS[phase(c)]);
        prog.textContent = `${Math.round(100 * ok / Math.max(0.1, tot))} %`;
        raf = requestAnimationFrame(frame);
      }
      async function end() {
        over = true; press = false;
        const pct = Math.round(100 * ok / Math.max(0.1, tot));
        ctx.sfx('win'); F.cheer(10);
        word.textContent = F.tt({ de: 'Gut gemacht 🌿', en: 'Well done 🌿' });
        await ctx.wait(900);
        ctx.finish({
          score: pct,
          detail: F.tt({ de: `${perfect} von ${CYCLES} Atemzügen im Ring`, en: `${perfect} of ${CYCLES} breaths inside the ring` }),
          levelDelta: 0, quality: Math.max(0.2, pct / 100), ink: 3 + Math.round(pct / 15),
        });
      }
      ctx.onCleanup(() => { over = true; cancelAnimationFrame(raf); });
      raf = requestAnimationFrame(frame);
    },
  });
})();
