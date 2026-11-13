/* Pi Runner: learn the digits of π, e, √2 and φ. Digits are calculated exactly, not stored. */
(function () {
  const F = Funkloch;
  const N = 600;
  const cache = {};

  const isqrt = (n) => {
    if (n < 2n) return n;
    let x = 1n << BigInt(Math.ceil(n.toString(2).length / 2) + 1);
    while (true) { const y = (x + n / x) >> 1n; if (y >= x) return x; x = y; }
  };
  const CONSTS = {
    pi: { label: 'π', calc() {
      const unity = 10n ** BigInt(N + 10);
      const atan = (x) => { const bx = BigInt(x), x2 = bx * bx; let t = unity / bx, sum = 0n, k = 1n, sign = 1n; while (t !== 0n) { sum += sign * (t / k); t /= x2; k += 2n; sign = -sign; } return sum; };
      return (4n * (4n * atan(5) - atan(239))).toString();
    } },
    e: { label: 'e', calc() {
      const unity = 10n ** BigInt(N + 10); let t = unity, sum = 0n, k = 0n;
      while (t !== 0n) { sum += t; k++; t /= k; }
      return sum.toString();
    } },
    sqrt2: { label: '√2', calc() { const u = 10n ** BigInt(N + 10); return isqrt(2n * u * u).toString(); } },
    phi: { label: 'φ', calc() { const u = 10n ** BigInt(N + 10); return ((u + isqrt(5n * u * u)) / 2n).toString(); } },
  };
  // Returns digits after the decimal point.
  // doodle: a circle rolled out once along a line is a bit more than 3 diameters long (that is pi)
  function rollMotif() {
    const d = 64, x0 = 30, y = 112;
    let ticks = '';
    for (let k = 1; k <= 3; k++) ticks += `<path d="M${x0 + k * d} ${y - 7} l0 14" style="fill:none"/><text x="${x0 + k * d}" y="${y + 28}" text-anchor="middle" style="font-size:18px;fill:var(--ink-soft);stroke:none">${k}</text>`;
    return `<svg class="motif" viewBox="0 0 300 146" width="300" height="146" style="transform:rotate(-2deg);stroke:currentColor;stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round" aria-hidden="true">
      <path d="M62 16 C82 15 96 30 95 48 C95 67 80 80 62 80 C43 81 29 66 29 48 C29 29 43 16 62 16 Z" style="fill:var(--c-memory)"/>
      <path d="M40 30 q8 -9 20 -10" style="fill:none;stroke:#fff;stroke-opacity:.6;stroke-width:3"/>
      <path d="M30 48 L94 48" style="fill:none;stroke-dasharray:5 5"/>
      <path d="M62 80 L62 96" style="fill:none;stroke:var(--ink-soft);stroke-dasharray:3 4"/>
      <path d="M${x0} ${y} q60 -3 ${Math.round(Math.PI * d)} 1" style="fill:none;stroke-width:3"/>
      <path d="M${x0} ${y - 7} l0 14" style="fill:none"/>${ticks}
      <circle cx="${x0 + Math.PI * d}" cy="${y}" r="6" style="fill:var(--accent)"/>
      <text x="${x0 + Math.PI * d + 30}" y="${y + 8}" text-anchor="middle" style="font-size:26px;fill:var(--ink);stroke:none">π</text>
      <path d="M118 40 q40 -24 80 6" style="fill:none;stroke:var(--ink-soft);stroke-dasharray:4 5"/><path d="M198 46 l-11 -2 m11 2 l-3 -11" style="fill:none;stroke:var(--ink-soft)"/>
    </svg>`;
  }
  const digitsOf = (id) => (cache[id] = cache[id] || CONSTS[id].calc().slice(1, N + 1));

  F.registerGame({
    id: 'pi-runner', skill: 'memory', glyph: 'π',
    name: { de: 'Pi-Läufer', en: 'Pi Runner' },
    desc: {
      de: 'Lerne π (oder e, √2, φ) Stück für Stück. Erst lernst du die Ziffern, dann tippst du sie aus dem Kopf und dein Freund rennt los. Jedes Mal kommen 5 neue Ziffern dazu.',
      en: 'Learn π (or e, √2, φ) bit by bit. First study the digits, then type them from memory while your buddy runs. Each time, 5 new digits are added.',
    },
    noLevel: true,
    formatBest: (v) => v + ' π',
    start(ctx) {
      const gd = F.gameData('pi-runner');
      gd.consts = gd.consts || {};
      ctx.setInfo(F.tt({ de: 'Welche Zahl?', en: 'Which number?' }));
      ctx.el.appendChild(F.h(rollMotif()));
      const wrap = F.h('<div class="stack" style="margin-top:14px"></div>');
      Object.entries(CONSTS).forEach(([id, c]) => {
        const rec = gd.consts[id] || 0;
        const b = F.h(`<button class="btn block" style="justify-content:space-between;min-height:88px;padding:0 22px"><span style="font-size:38px">${c.label}</span><span class="muted">${F.tt({ de: 'Rekord', en: 'Best' })}: ${rec}</span></button>`);
        b.onclick = () => study(id);
        wrap.appendChild(b);
      });
      ctx.el.appendChild(wrap);

      function study(id) {
        const all = digitsOf(id);
        const rec = gd.consts[id] || 0;
        const target = Math.min(N, Math.max(10, rec + 5));
        const lead = { pi: '3', e: '2', sqrt2: '1', phi: '1' }[id];
        ctx.setInfo(F.tt({ de: `Merk dir ${target} Nachkommastellen. Neue sind markiert.`, en: `Memorize ${target} decimals. New ones are highlighted.` }));
        let html = '';
        for (let i = 0; i < target; i++) {
          const isNew = i >= rec;
          html += `<span style="${isNew ? 'background:var(--c-math);color:var(--ink);border-radius:4px' : ''}">${all[i]}</span>`;
          if (i % 5 === 4) html += ' ';
        }
        // the doodle only while the list is short, so long records still fit on the screen
        const roomy = target <= 85; // long lists keep the old compact spacing, so they fit as long as before
        ctx.el.innerHTML = `${target <= 30 ? rollMotif() : ''}<div class="card sketch pop-in" style="font-size:30px;letter-spacing:2px;line-height:1.6;word-break:break-word;margin-top:${roomy ? 10 : 0}px">${CONSTS[id].label} = ${lead}.${html}</div>
          ${roomy ? `<div style="margin-top:16px">${trackHTML()}</div>` : ''}
          <button class="btn primary big block" id="ready" style="margin-top:${roomy ? 22 : 16}px;min-height:${roomy ? 72 : 0}px">${F.tt({ de: 'Bereit!', en: 'Ready!' })}</button>`;
        ctx.el.querySelector('#ready').onclick = () => runPhase(id, all, target, rec);
      }

      // the race track: hand-drawn hills behind a dashed path, a flag at the end and the buddy at the start
      function trackHTML() {
        return `<div class="card sketch" style="position:relative;height:150px;overflow:hidden;padding:0">
          <svg viewBox="0 0 320 110" preserveAspectRatio="none" style="position:absolute;left:0;bottom:0;width:100%;height:110px;stroke:var(--ink);stroke-width:2.2;stroke-linejoin:round;stroke-linecap:round" aria-hidden="true">
            <circle cx="40" cy="26" r="13" style="fill:var(--c-math)"/>
            <path d="M-4 84 Q50 40 110 70 Q170 30 240 66 Q285 44 330 62 L330 114 L-4 114 Z" style="fill:var(--paper-2)"/>
            <path d="M20 100 l14 -6 M120 102 l14 -6 M220 100 l14 -6" style="fill:none;stroke:var(--ink-faint)"/>
          </svg>
          <div style="position:absolute;left:10px;right:10px;bottom:22px;border-bottom:3px dashed var(--ink-faint)"></div>
          <div style="position:absolute;right:8px;bottom:24px;font-size:30px">⚑</div>
          <div id="runner" style="position:absolute;left:0;bottom:12px;transition:left .25s">${F.companionSVG({ mood: 'happy', cls: 'sm' })}</div></div>`;
      }

      function runPhase(id, all, target, rec) {
        let pos = 0, trips = 0, streak = 0, firstMiss = -1, locked = false;
        ctx.el.innerHTML = '';
        const track = F.h(trackHTML());
        const line = F.h('<div class="answer-line" style="font-size:30px;white-space:nowrap;overflow:hidden"></div>');
        const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', ''];
        const runner = track.querySelector('#runner');
        const shown = [];
        const draw = () => {
          line.innerHTML = (shown.length > 12 ? '…' : '') + shown.slice(-12).join('') + '_';
          runner.style.left = `calc(${(pos / target) * 82}% )`;
          ctx.setScore(pos);
          ctx.setInfo('♥'.repeat(3 - trips) + '♡'.repeat(trips) + ` &nbsp; ${pos}/${target}`);
        };
        const pad = F.keypad(async (k) => {
          if (locked || !k) return;
          if (k === all[pos]) {
            shown.push(k); pos++; if (firstMiss < 0) streak = pos;
            if (pos >= target) return done(true);
            draw();
          } else {
            ctx.sfx('bad'); trips++;
            if (firstMiss < 0) firstMiss = pos;
            runner.innerHTML = F.companionSVG({ mood: 'sad', cls: 'sm' });
            runner.classList.add('flash-bad');
            shown.push(`<span style="color:var(--bad)">${all[pos]}</span>`);
            pos++;
            draw();
            if (trips >= 3) { locked = true; await ctx.wait(900); return done(false); }
            locked = true; await ctx.wait(500); locked = false;
            runner.classList.remove('flash-bad');
            runner.innerHTML = F.companionSVG({ mood: 'happy', cls: 'sm' });
            if (pos >= target) done(false);
          }
        }, { keys });
        line.style.margin = '18px 30px 8px';
        pad.style.marginTop = '18px';
        pad.querySelectorAll('button').forEach((b) => { b.style.minHeight = '70px'; b.style.fontSize = '30px'; });
        ctx.el.append(track, line, pad);
        draw();

        function done(clean) {
          locked = true;
          const best = Math.max(rec, streak);
          const isRec = streak > rec;
          gd.consts[id] = best;
          ctx.finish({
            score: id === 'pi' ? streak : 0,
            noRecord: id !== 'pi',
            display: `${CONSTS[id].label}: ${streak}`,
            detail: (isRec ? F.tt({ de: 'Neuer Rekord für ', en: 'New record for ' }) + CONSTS[id].label + ' · ' : '') +
              F.tt({ de: `${streak} Ziffern fehlerfrei`, en: `${streak} digits without a mistake` }),
            quality: clean ? 1 : streak / target,
            ink: 3 + Math.min(35, Math.round(streak / 2) + (isRec ? 8 : 0)),
          });
        }
      }
    },
  });
})();
