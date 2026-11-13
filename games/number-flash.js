/* Number Flash: a number flashes, you type it back. Length adapts (staircase). */
Funkloch.registerGame({
  id: 'number-flash', skill: 'memory', glyph: '1·2·3',
  name: { de: 'Zahlenblitz', en: 'Number Flash' },
  desc: {
    de: 'Eine Zahl blitzt kurz auf, danach tippst du sie ein. Richtig = eine Ziffer mehr, falsch = eine weniger. Tipp: merk dir die Ziffern in Gruppen. 3 Fehler und Schluss.',
    en: 'A number flashes briefly, then you type it in. Right = one digit more, wrong = one less. Tip: remember the digits in groups. 3 mistakes and you’re out.',
  },
  formatBest: (v) => Funkloch.tt({ de: v + ' Ziffern', en: v + ' digits' }),
  start(ctx) {
    const F = Funkloch, r = ctx.rng;
    let len = 3 + ctx.level, strikes = 0, round = 0, maxOk = 0, correct = 0;
    // doodle: a lightning bolt with two sparkles (a "flash"), kept away from the number
    const BOLT = `<svg class="motif" viewBox="0 0 200 88" width="200" height="88" style="transform:rotate(-4deg);stroke:currentColor;stroke-width:2.6;stroke-linejoin:round;stroke-linecap:round" aria-hidden="true">
      <path d="M108 4 L70 48 L96 48 L84 84 L132 34 L104 34 L120 4 Z" style="fill:var(--c-math)"/>
      <path d="M104 12 L88 31" style="fill:none;stroke:#fff;stroke-opacity:.6;stroke-width:3"/>
      <path d="M40 30 l0 18 M31 39 l18 0" style="fill:none;stroke:var(--accent);stroke-width:3"/>
      <path d="M160 52 l0 14 M153 59 l14 0" style="fill:none;stroke:var(--accent);stroke-width:3"/>
      <path d="M150 20 q6 -4 12 0 M48 66 q6 4 12 0" style="fill:none;stroke:var(--ink-soft)"/>
    </svg>`;
    const numSize = (n) => (n <= 6 ? 60 : n <= 9 ? 48 : n <= 12 ? 40 : 36);
    const bigKeys = (pad) => { pad.style.marginTop = '16px'; pad.querySelectorAll('button').forEach((b) => { b.style.minHeight = '70px'; b.style.fontSize = '30px'; }); };
    // a faded, inactive keypad while the number shows, so nothing jumps when it is time to type
    const ghostPad = () => {
      const pad = F.h('<div class="keypad" aria-hidden="true" style="opacity:.3"></div>');
      ['1', '2', '3', '4', '5', '6', '7', '8', '9', '⌫', '0', '✓'].forEach((k) => pad.appendChild(F.h(`<button disabled tabindex="-1">${k}</button>`)));
      bigKeys(pad);
      return pad;
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
      // the number itself stays plain; only its size follows the length so it never breaks mid-number
      ctx.el.innerHTML = `${BOLT}<div class="card sketch big-display pop-in" style="font-size:${numSize(len)}px;min-height:150px;margin-top:4px;padding:16px 8px">${digits}</div>`;
      ctx.el.appendChild(ghostPad());
      await ctx.wait(700 + 420 * len);
      ask(digits);
    }

    function ask(digits) {
      let typed = '';
      ctx.el.innerHTML = BOLT;
      const box = F.h('<div class="card sketch" style="min-height:150px;margin-top:4px;padding:12px 6px;display:flex;align-items:center;justify-content:center"></div>');
      const line = F.h(`<div class="answer-line" style="font-size:${numSize(digits.length)}px;margin:8px 6px;flex:1"></div>`);
      box.appendChild(line);
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
          line.classList.add('flash-ok'); // no cheer here: the next plain number appears right where the stars would fly
        } else {
          ctx.sfx('bad'); strikes++;
          line.innerHTML = `<span style="color:var(--bad)">${typed || '–'}</span><br><span style="font-size:26px">${digits}</span>`;
          line.classList.add('flash-bad');
          len = Math.max(3, len - 1);
        }
        await ctx.wait(typed === digits ? 600 : 1500);
        next();
      }
      bigKeys(pad);
      ctx.el.append(box, pad);
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
