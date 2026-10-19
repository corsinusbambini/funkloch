/* Number Flash: a number flashes, you type it back. Length adapts (staircase). */
Funkloch.registerGame({
  id: 'number-flash', skill: 'memory', glyph: '1·2·3',
  name: { de: 'Zahlenblitz', en: 'Number Flash' },
  desc: {
    de: 'Eine Zahl blitzt kurz auf, danach tippst du nur die Ziffern ein. Richtig = eine Ziffer mehr, falsch = eine weniger. Tipp: merk dir die Ziffern in Gruppen. 3 Fehler und Schluss.',
    en: 'A number flashes briefly, then you type just the digits. Right = one digit more, wrong = one less. Tip: remember the digits in groups. 3 mistakes and you’re out.',
  },
  formatBest: (v) => Funkloch.tt({ de: v + ' Ziffern', en: v + ' digits' }),
  start(ctx) {
    const F = Funkloch, r = ctx.rng;
    let len = 3 + ctx.level, strikes = 0, round = 0, maxOk = 0, correct = 0;
    const UNITS = ['mL', 'g', 'mg', 'mol/L', '°C', 'kg', 'µL', '%', 'L', 'nm'];
    const FORMATS = ['plain', 'chunk', 'code', 'decimal', 'pairs', 'phone'];

    const group = (d, sizes, sep) => {
      const out = []; let i = 0, k = 0;
      while (i < d.length) { const s = sizes[k % sizes.length]; out.push(d.slice(i, i + s)); i += s; k++; }
      return out.join(sep);
    };
    const show = (d, f) => {
      switch (f) {
        case 'chunk': return group(d, [3], ' ');
        case 'code': return group(d, [4, 2, 3], '-');
        case 'decimal': { const p = r.int(1, Math.max(1, d.length - 1)); return d.slice(0, p) + '.' + d.slice(p) + ' <small>' + r.pick(UNITS) + '</small>'; }
        case 'pairs': return group(d, [2], ' · ');
        case 'phone': return group(d, [3, 3, 2, 2], ' ');
        default: return d;
      }
    };
    const hearts = () => '♥'.repeat(3 - strikes) + '♡'.repeat(strikes);

    async function next() {
      if (strikes >= 3 || round >= 14) return end();
      round++;
      ctx.setScore(maxOk);
      ctx.setInfo(`${hearts()} &nbsp; ${F.tt({ de: 'Merk dir', en: 'Remember' })} ${len} ${F.tt({ de: 'Ziffern', en: 'digits' })}`);
      const digits = ctx.fresh(() => {
        let s = String(r.int(1, 9));
        while (s.length < len) s += r.int(0, 9);
        return s;
      });
      const fmt = len >= 5 ? r.pick(FORMATS) : 'plain';
      ctx.el.innerHTML = `<div class="card sketch big-display pop-in">${show(digits, fmt)}</div>`;
      await ctx.wait(700 + 420 * len);
      ask(digits);
    }

    function ask(digits) {
      let typed = '';
      ctx.el.innerHTML = '';
      const line = F.h('<div class="answer-line"></div>');
      const draw = () => { line.textContent = typed + '_'.repeat(Math.max(0, digits.length - typed.length)); };
      draw();
      let locked = false;
      const pad = F.keypad((k) => {
        if (locked) return;
        if (k === '⌫') typed = typed.slice(0, -1);
        else if (k === 'ok') return check();
        else if (typed.length < digits.length) typed += k;
        draw();
        if (typed.length === digits.length) check();
      });
      async function check() {
        locked = true;
        if (typed === digits) {
          ctx.sfx('good'); correct++; maxOk = Math.max(maxOk, len); len++;
          line.classList.add('flash-ok');
        } else {
          ctx.sfx('bad'); strikes++;
          line.innerHTML = `<span style="color:var(--bad)">${typed || '–'}</span><br><span style="font-size:26px">${digits}</span>`;
          line.classList.add('flash-bad');
          len = Math.max(3, len - 1);
        }
        await ctx.wait(typed === digits ? 600 : 1500);
        next();
      }
      ctx.el.append(line, pad);
    }

    function end() {
      const target = 3 + ctx.level;
      ctx.finish({
        score: maxOk,
        display: F.tt({ de: maxOk + ' Ziffern', en: maxOk + ' digits' }),
        detail: F.tt({ de: `${correct} richtig in ${round} Runden`, en: `${correct} right in ${round} rounds` }),
        levelDelta: maxOk >= target + 1 ? 1 : maxOk < target - 1 ? -1 : 0,
        quality: Math.min(1, maxOk / Math.max(target + 1, ctx.best || 0)),
        ink: 4 + correct * 2,
      });
    }
    next();
  },
});
