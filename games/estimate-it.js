/* Estimate It: no calculator, no exact answer. Which of four numbers is closest to the result? */
(function () {
  const F = Funkloch;
  const QUESTIONS = 10;

  // round to 2 significant digits
  const sig2 = (x) => { const p = Math.pow(10, Math.max(0, Math.floor(Math.log10(Math.abs(x))) - 1)); return Math.round(x / p) * p; };
  const fmt = (n) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '’');

  F.registerGame({
    id: 'estimate-it', skill: 'math', added: '2026-11-16', glyph: '≈?',
    name: { de: 'Schätz-Meister', en: 'Estimate It' },
    desc: {
      de: 'Rechne nicht genau, sondern schätze! Du siehst eine Rechnung wie 38 × 21. Tippe die Zahl an, die dem Ergebnis am nächsten kommt. Die falschen Zahlen sind deutlich weiter weg. Es gibt 10 Fragen, mit möglichst vielen Treffern gewinnst du.',
      en: 'Do not calculate exactly, estimate! You see a sum like 38 × 21. Tap the number that is closest to the result. The wrong numbers are clearly further away. There are 10 questions: get as many right as you can.',
    },
    start(ctx) {
      const r = ctx.rng, lvl = Math.min(10, ctx.level || 0);
      let qi = 0, right = 0, streak = 0, points = 0, busy = false;

      function makeQ() {
        const kind = r.pick(lvl < 2 ? ['mul', 'add'] : lvl < 5 ? ['mul', 'add', 'div'] : ['mul', 'add', 'div', 'pct', 'mul3']);
        let text, exact;
        if (kind === 'mul') { const a = r.int(12, 29 + lvl * 7), b = r.int(6, 19 + lvl * 3); text = `${a} × ${b}`; exact = a * b; }
        else if (kind === 'mul3') { const a = r.int(110, 480), b = r.int(12, 49); text = `${a} × ${b}`; exact = a * b; }
        else if (kind === 'add') { const a = r.int(120, 480 + lvl * 40), b = r.int(120, 480 + lvl * 40), c = r.int(120, 480 + lvl * 40); text = `${a} + ${b} + ${c}`; exact = a + b + c; }
        else if (kind === 'div') { const b = r.int(7, 29), q = r.int(11, 60 + lvl * 8); const a = b * q + r.int(0, b - 1); text = `${a} ÷ ${b}`; exact = a / b; }
        else { const p = r.pick([15, 20, 35, 45, 60, 85]), a = r.int(12, 95) * 10 + r.int(0, 9); text = `${p} % ${F.tt({ de: 'von', en: 'of' })} ${a}`; exact = (p * a) / 100; }
        const good = sig2(exact);
        const opts = [good];
        const facs = r.shuffle([0.5, 0.65, 0.8, 1.25, 1.5, 2, 0.4, 3]);
        for (const f of facs) {
          if (opts.length >= 4) break;
          const v = sig2(exact * f);
          if (opts.some((o) => Math.abs(o - v) < exact * 0.14)) continue;
          if (v <= 0 || v === good) continue;
          opts.push(v);
        }
        return { text, exact, good, opts: r.shuffle(opts) };
      }

      function line(q, picked) {
        // little number line with the real answer pinned
        const all = q.opts.concat([q.exact]), lo = Math.min(...all), hi = Math.max(...all);
        const px = (v) => 24 + ((v - lo) / (hi - lo || 1)) * 272;
        let s = `<svg viewBox="0 0 320 70" style="width:100%;height:auto;display:block;overflow:visible" aria-hidden="true"><path d="M10,46 q50,-5 150,0 t150,-1" fill="none" style="stroke:var(--ink)" stroke-width="3" stroke-linecap="round"/>`;
        q.opts.forEach((v) => {
          const x = px(v), isG = v === q.good, isP = v === picked;
          s += `<circle cx="${x.toFixed(1)}" cy="46" r="6" style="fill:${isG ? 'var(--good)' : isP ? 'var(--bad)' : 'var(--paper-2)'};stroke:var(--ink)" stroke-width="2.4"/>`;
        });
        const x = px(q.exact);
        s += `<path d="M${x.toFixed(1)},38 l-9,-18 q9,-9 18,0 z" style="fill:var(--accent);stroke:var(--ink)" stroke-width="2.4" stroke-linejoin="round"/><circle cx="${x.toFixed(1)}" cy="17" r="2.6" style="fill:var(--ink)"/></svg>`;
        return s;
      }

      function next() {
        if (qi >= QUESTIONS) return end();
        qi++; busy = false;
        const q = ctx.fresh(makeQ, (x) => x.text);
        ctx.setInfo(`${qi} / ${QUESTIONS}`); ctx.setScore(points);
        ctx.el.innerHTML = '';
        const card = F.h(`<div class="sketch pop-in" style="padding:22px 12px 26px;margin:8px 0 16px;background:var(--c-math);box-shadow:var(--shadow);transform:rotate(-0.5deg);text-align:center">
          <svg class="motif" viewBox="0 0 120 26" width="120" height="26" aria-hidden="true" style="display:block;margin:-4px auto 2px;color:var(--ink)"><path d="M10,22 L110,22 M60,22 L60,8 M14,12 L106,8" fill="none" style="stroke:var(--ink)" stroke-width="2.6" stroke-linecap="round"/><path d="M6,12 q8,10 16,0 z M98,8 q8,10 16,0 z" style="fill:var(--card);stroke:var(--ink)" stroke-width="2" stroke-linejoin="round"/></svg>
          <div style="font-size:20px;color:var(--ink);opacity:.8">${F.esc(F.tt({ de: 'Ungefähr wie viel ist', en: 'Roughly, what is' }))}</div>
          <div style="font-size:${q.text.length > 12 ? 52 : 68}px;line-height:1.1;margin:4px 0;color:var(--ink);white-space:nowrap">${F.esc(q.text)}</div></div>`);
        const opts = F.h(`<div class="options" style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px"></div>`);
        const fb = F.h('<div style="min-height:120px;margin-top:16px"></div>');
        fb.innerHTML = `<svg viewBox="0 0 320 70" style="width:100%;height:auto;display:block;opacity:.55" aria-hidden="true"><path d="M10,46 q50,-5 150,0 t150,-1" fill="none" style="stroke:var(--ink-soft)" stroke-width="3" stroke-linecap="round" stroke-dasharray="2 7"/><text x="160" y="28" text-anchor="middle" font-size="26" style="fill:var(--ink-soft)">?</text></svg>`;
        const btns = q.opts.map((v) => {
          const b = F.h(`<button class="opt" style="min-width:0;min-height:128px;font-size:42px">≈ ${fmt(v)}</button>`);
          b.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (busy) return;
            busy = true;
            b.classList.remove('tap-pop'); void b.offsetWidth; b.classList.add('tap-pop');
            const ok = v === q.good;
            b.classList.add(ok ? 'right' : 'wrong');
            if (!ok) btns.forEach((x, i) => { if (q.opts[i] === q.good) x.classList.add('right'); });
            if (ok) { right++; streak++; points += 10 + Math.min(streak, 5) * 2; ctx.sfx('good'); b.classList.add('flash-ok'); if (streak === 5) F.cheer(8); }
            else { streak = 0; ctx.sfx('bad'); b.classList.add('flash-bad'); }
            ctx.setScore(points);
            fb.innerHTML = `${line(q, ok ? null : v)}<div style="text-align:center;font-size:18px;color:var(--ink-soft);margin-top:-4px">${F.esc(F.tt({ de: 'Genau: ', en: 'Exactly: ' }))}${fmt(q.exact)}${q.exact % 1 ? '…' : ''}</div>`;
            fb.classList.add('pop-in');
            ctx.wait(ok ? 1100 : 1700).then(next);
          });
          opts.appendChild(b);
          return b;
        });
        ctx.el.append(card, opts, fb);
      }

      function end() {
        const win = right >= 7;
        if (win) F.cheer(14);
        ctx.finish({
          score: points,
          detail: F.tt({ de: `${right} von ${QUESTIONS} nah dran`, en: `${right} of ${QUESTIONS} close` }),
          levelDelta: right >= 8 ? 1 : right <= 4 ? -1 : 0,
          quality: right / QUESTIONS, ink: 5 + Math.round(points / 8),
        });
      }
      next();
    },
  });
})();
