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
        ctx.el.appendChild(F.h(`<div class="card sketch big-display pop-in" style="font-size:30px;letter-spacing:0;padding:18px 8px;min-height:100px;flex-direction:column;gap:6px;text-align:center"><span>${dateTxt}</span><span style="font-size:17px;color:var(--ink-soft)">${F.tt({ de: 'Welcher Wochentag?', en: 'Which weekday?' })}</span></div>`));
        let answered = false;
        const tb = ctx.timer(ctx.el, TIME, () => pick(-1, null, optEl));
        const labels = SHORT[L].map((s) => `<span style="font-size:22px">${s}</span>`);
        const optEl = F.options(labels, (i, b, wrap) => pick(i, b, wrap));
        optEl.style.gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
        Array.from(optEl.children).forEach((c) => { c.style.minWidth = '0'; c.style.padding = '4px'; });
        async function pick(i, b, wrap) {
          if (answered) return;
          answered = true;
          const ms = tb.stop(), ok = i === q.ans;
          if (b) b.classList.add(ok ? 'right' : 'wrong');
          wrap.children[q.ans].classList.add('right');
          ctx.sfx(ok ? 'good' : 'bad');
          if (ok) { correct++; points += 5 + Math.ceil((TIME - ms) / 4000); }
          else ctx.el.appendChild(F.h(`<div class="info-line" style="text-align:center;margin-top:8px">${dateTxt}: ${DAYS[L][q.ans]}</div>`));
          await ctx.wait(ok ? 600 : 2000);
          next();
        }
        ctx.el.appendChild(optEl);
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
