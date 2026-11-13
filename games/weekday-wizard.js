/* Weekday Wizard: which weekday is a given date? Calendar mental maths. */
(function () {
  const F = Funkloch;
  const DAYS = {
    de: ['Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag'],
    en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  };
  const SHORT = { de: ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'], en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] };
  const MONTHS = {
    de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  };
  const dim = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const wd = (y, m, d) => (new Date(Date.UTC(y, m, d)).getUTCDay() + 6) % 7; // 0 = Monday

  // doodle: a tear-off calendar page showing the asked date (month + year on top, big day number)
  function calendar(q, L, k) {
    const tilt = k % 2 ? -2.5 : 2;
    return `<svg class="motif" viewBox="0 0 250 222" width="282" height="250" style="transform:rotate(${tilt}deg);stroke:currentColor;stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round" aria-hidden="true">
      <path d="M22 40 L230 37 L233 207 L25 211 Z" style="fill:var(--paper-2)"/>
      <path d="M17 34 L226 31 L229 202 Q150 196 120 204 Q70 212 19 204 Z" style="fill:var(--card)"/>
      <path d="M17 34 L226 31 L227 82 L18 84 Z" style="fill:var(--c-math)"/>
      <path d="M28 46 q30 -6 60 -3" style="fill:none;stroke:#fff;stroke-opacity:.6;stroke-width:3"/>
      <text x="123" y="68" text-anchor="middle" style="font-size:24px;fill:var(--ink);stroke:none">${MONTHS[L][q.m]} ${q.y}</text>
      <text x="123" y="170" text-anchor="middle" style="font-size:78px;fill:var(--ink);stroke:none">${q.d}</text>
      <path d="M62 18 q-9 0 -9 11 q0 11 9 11" style="fill:none;stroke-width:3.2"/><path d="M186 18 q-9 0 -9 11 q0 11 9 11" style="fill:none;stroke-width:3.2"/>
      <circle cx="62" cy="40" r="4" style="fill:var(--paper)"/><circle cx="186" cy="40" r="4" style="fill:var(--paper)"/>
      <path d="M40 188 q40 4 80 -1" style="fill:none;stroke:var(--ink-faint);stroke-width:2"/>
    </svg>`;
  }

  function make(r, lvl) {
    const lo = lvl >= 4 ? 1900 : lvl >= 2 ? 1990 : 2020, hi = lvl >= 4 ? 2099 : lvl >= 2 ? 2040 : 2030;
    const y = r.int(lo, hi), m = r.int(0, 11), d = r.int(1, dim(y, m));
    return { y, m, d, ans: wd(y, m, d), key: `${y}-${m}-${d}` };
  }

  F.registerGame({
    id: 'weekday-wizard', skill: 'math', added: '2026-11-12', glyph: '📅',
    name: { de: 'Wochentag-Zauberer', en: 'Weekday Wizard' },
    desc: {
      de: 'Welcher Wochentag war oder ist das Datum? Rechne im Kopf: Wenn du einen Tag im Monat kennst (z.B. der 1. Januar), zähle in 7er-Schritten weiter. 10 Runden, je schneller, desto mehr Punkte.',
      en: 'Which weekday is, or was, this date? Work it out in your head: if you know one day of the month (e.g. 1 January), count on in steps of 7. 10 rounds, the faster the more points.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 10, TIME = 30000;
      let round = 0, correct = 0, points = 0;
      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points); ctx.setInfo(`${round} / ${ROUNDS}`);
        ctx.el.innerHTML = '';
        const q = ctx.fresh(() => make(r, ctx.level), (x) => x.key);
        const L = F.tt({ de: 'de', en: 'en' });
        const dateTxt = L === 'de' ? `${q.d}. ${MONTHS.de[q.m]} ${q.y}` : `${q.d} ${MONTHS.en[q.m]} ${q.y}`;
        ctx.el.appendChild(F.h(`<div class="pop-in" style="text-align:center">${calendar(q, L, round)}<div style="font-size:20px;color:var(--ink-soft);margin-top:2px">${F.tt({ de: 'Welcher Wochentag?', en: 'Which weekday?' })}</div></div>`));
        let answered = false;
        const tb = ctx.timer(ctx.el, TIME, () => pick(-1, null, optEl));
        const labels = SHORT[L].map((s) => `<span>${s}</span>`);
        const optEl = F.options(labels, (i, b, wrap) => pick(i, b, wrap), 'tall');
        // 4 + 3 buttons, the short second row centred: 8 half-tracks, every button spans two
        optEl.style.gridTemplateColumns = 'repeat(8, minmax(0, 1fr))';
        optEl.style.marginTop = '26px';
        Array.from(optEl.children).forEach((c, k) => { c.style.minWidth = '0'; c.style.padding = '4px'; c.style.gridColumn = k === 4 ? '2 / span 2' : 'span 2'; });
        const note = F.h('<div class="info-line" style="text-align:center;margin-top:10px;min-height:26px"></div>');
        async function pick(i, b, wrap) {
          if (answered) return;
          answered = true;
          const ms = tb.stop(), ok = i === q.ans;
          if (b) b.classList.add(ok ? 'right' : 'wrong', 'tap-pop');
          wrap.children[q.ans].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          if (ok) { correct++; points += 5 + Math.ceil((TIME - ms) / 4000); if (round < ROUNDS) F.cheer(8); }
          else { note.textContent = `${dateTxt}: ${DAYS[L][q.ans]}`; note.classList.add('pop-in'); }
          await ctx.wait(ok ? 600 : 2000);
          next();
        }
        ctx.el.appendChild(optEl);
        ctx.el.appendChild(note);
      }
      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${correct}/${ROUNDS} richtig`, en: `${correct}/${ROUNDS} right` }),
          levelDelta: correct >= 9 ? 1 : correct <= 4 ? -1 : 0,
          quality: correct / ROUNDS, ink: 3 + correct * 2,
        });
      }
      next();
    },
  });
})();
