/* Balance It: set the coefficients so a generated reaction equation has the same atoms on both sides. */
(function () {
  const F = Funkloch;
  const SUBS = '₀₁₂₃₄₅₆₇₈₉';
  const sub = (n) => (n === 1 ? '' : String(n).split('').map((d) => SUBS[+d]).join(''));
  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const sp = (txt, f) => ({ txt, f });
  const O2 = sp('O₂', { O: 2 }), H2 = sp('H₂', { H: 2 }), CO2 = sp('CO₂', { C: 1, O: 2 }), H2O = sp('H₂O', { H: 2, O: 1 });
  const HCl = sp('HCl', { H: 1, Cl: 1 }), H2SO4 = sp('H₂SO₄', { H: 2, S: 1, O: 4 });
  const METALS = { Na: 1, K: 1, Mg: 2, Ca: 2, Zn: 2, Al: 3, Fe: 3 };

  const metal = (s) => sp(s, { [s]: 1 });
  const oxide = (s) => { const c = METALS[s], g = gcd(2, c); return sp(s + sub(2 / g) + 'O' + sub(c / g), { [s]: 2 / g, O: c / g }); };
  const chloride = (s) => sp(s + 'Cl' + sub(METALS[s]), { [s]: 1, Cl: METALS[s] });
  const hydroxide = (s) => { const c = METALS[s]; return sp(c > 1 ? `${s}(OH)${sub(c)}` : s + 'OH', { [s]: 1, O: c, H: c }); };
  const sulfate = (s) => {
    const c = METALS[s], g = gcd(2, c), a = 2 / g, b = c / g;
    return sp(s + sub(a) + (b > 1 ? '(SO₄)' + sub(b) : 'SO₄'), { [s]: a, S: b, O: 4 * b });
  };
  const hc = (x, y) => sp('C' + sub(x) + 'H' + sub(y), { C: x, H: y });

  // coefficient range the player can set; the solver searches the same range
  const MAXC = 24;
  function solve(left, right) {
    const all = left.concat(right), els = Array.from(new Set(all.reduce((a, s) => a.concat(Object.keys(s.f)), [])));
    const n = all.length, sign = all.map((_, i) => (i < left.length ? 1 : -1));
    let best = null, bestSum = 1e9;
    const c = new Array(n).fill(1);
    (function rec(i, sum) {
      if (sum >= bestSum) return;
      if (i === n) {
        for (const e of els) { let t = 0; for (let k = 0; k < n; k++) t += sign[k] * c[k] * (all[k].f[e] || 0); if (t !== 0) return; }
        best = c.slice(); bestSum = sum; return;
      }
      for (let v = 1; v <= MAXC; v++) { c[i] = v; rec(i + 1, sum + v); }
    })(0, 0);
    return best;
  }

  function makeReaction(r, lvl) {
    const kinds = ['comb', 'ox'];
    if (lvl >= 1) kinds.push('hcl');
    if (lvl >= 3) kinds.push('neut');
    const kind = r.pick(kinds);
    const easy = ['Mg', 'Na', 'Ca', 'K'], all = ['Mg', 'Na', 'Ca', 'K', 'Al', 'Zn', 'Fe'];
    if (kind === 'comb') {
      const xmax = lvl >= 3 ? 4 : lvl >= 1 ? 3 : 2;
      const x = r.int(1, xmax);
      const forms = [2 * x + 2];
      if (lvl >= 3 && x >= 2) forms.push(2 * x, 2 * x - 2);
      const y = r.pick(forms);
      return { left: [hc(x, y), O2], right: [CO2, H2O] };
    }
    if (kind === 'ox') {
      const m = r.pick(lvl >= 2 ? all : easy);
      return { left: [metal(m), O2], right: [oxide(m)] };
    }
    if (kind === 'hcl') {
      const m = r.pick(lvl >= 2 ? ['Na', 'K', 'Mg', 'Ca', 'Zn', 'Al'] : ['Na', 'K', 'Mg', 'Ca']);
      return { left: [metal(m), HCl], right: [chloride(m), H2] };
    }
    const m = r.pick(['Na', 'Mg', 'Ca', 'Al', 'Zn']);
    const acid = r.chance(0.5) ? HCl : H2SO4;
    return { left: [hydroxide(m), acid], right: [acid === HCl ? chloride(m) : sulfate(m), H2O] };
  }

  F.registerGame({
    id: 'balance-it', skill: 'chem', added: '2026-10-31', glyph: '⚖️',
    name: { de: 'Gleichung ausgleichen', en: 'Balance It' },
    desc: {
      de: 'Eine Reaktionsgleichung ist nicht ausgeglichen. Stelle mit + und − die Zahlen vor den Stoffen so ein, dass links und rechts gleich viele Atome stehen, und zwar mit den kleinstmöglichen Zahlen. 6 Reaktionen, je 90 Sekunden.',
      en: 'A reaction equation is not balanced. Use + and − to set the numbers in front of the substances so both sides have the same atoms, using the smallest possible numbers. 6 reactions, 90 seconds each.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 6, TIME = 90000;
      let round = 0, solved = 0, points = 0;

      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setScore(points);
        ctx.setInfo(`${round} / ${ROUNDS}`);
        const q = ctx.fresh(() => {
          const rx = makeReaction(r, ctx.level);
          const all = rx.left.concat(rx.right);
          return { rx, all, key: rx.left.map((s) => s.txt).join('+') + '>' + rx.right.map((s) => s.txt).join('+'), sol: solve(rx.left, rx.right) };
        }, (x) => x.key);
        const { rx, all, sol } = q, nl = rx.left.length;
        // start from a wrong state: all ones, but never already the answer
        const co = all.map(() => 1);
        if (co.every((v, i) => v === sol[i])) co[0] = 2;
        let done = false;
        ctx.el.innerHTML = '';
        const box = F.h('<div class="card sketch pop-in" style="padding:12px 10px 8px;display:flex;flex-direction:column;align-items:center;gap:4px"></div>');
        const eq = F.h('<div style="font-size:28px;display:flex;flex-wrap:wrap;gap:4px 8px;line-height:1.3;justify-content:center;text-align:center;min-height:72px;align-items:center;letter-spacing:1px"></div>');
        // Hand-drawn balance scale: level when every element is balanced, otherwise it tips to the side with more atoms.
        const scaleEl = F.h(`<svg class="motif" viewBox="0 0 240 70" width="220" height="64" aria-hidden="true" style="stroke:var(--ink);stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;fill:none">
          <path d="M120 22 L120 62 M96 64 C110 60 130 60 144 64" style="stroke-width:3"/>
          <g class="beam" style="transform-origin:120px 20px;transition:transform .3s ease-out"><path d="M42 20 C80 18 160 22 198 20" style="stroke-width:3.2"/></g>
          <circle cx="120" cy="20" r="5" style="fill:var(--accent)"/>
          <g class="pan-l" style="transition:transform .3s ease-out"><path d="M42 20 L28 44 M42 20 L56 44"/><path d="M22 44 C30 54 54 54 62 44 Z" style="fill:var(--c-chem)"/><path d="M36 44 L36 34 C36 30 40 30 40 34 L40 36 L46 44" style="stroke-width:2"/></g>
          <g class="pan-r" style="transition:transform .3s ease-out"><path d="M198 20 L184 44 M198 20 L212 44"/><path d="M178 44 C186 54 210 54 218 44 Z" style="fill:var(--c-fun)"/><path d="M192 44 L192 36 L204 36 L204 44" style="stroke-width:2"/></g>
        </svg>`);
        box.append(eq, scaleEl);
        const tilt = (l, rr, bal) => {
          const a = bal ? 0 : l > rr ? -7 : l < rr ? 7 : -3, dy = Math.round(Math.sin((a * Math.PI) / 180) * 78);
          scaleEl.querySelector('.beam').style.transform = `rotate(${a}deg)`;
          scaleEl.querySelector('.pan-l').style.transform = `translateY(${-dy}px)`;
          scaleEl.querySelector('.pan-r').style.transform = `translateY(${dy}px)`;
        };
        const chips = F.h('<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;margin:10px 0"></div>');
        const rows = F.h('<div style="display:flex;flex-direction:column;gap:8px"></div>');
        const msg = F.h('<div class="info-line" style="text-align:center;min-height:26px;margin-top:8px"></div>');
        const tb = ctx.timer(ctx.el, TIME, () => reveal());
        ctx.el.appendChild(box); ctx.el.appendChild(chips); ctx.el.appendChild(rows); ctx.el.appendChild(msg);
        const nums = [];

        function render() {
          let html = '';
          all.forEach((s, i) => {
            if (i === nl) html += '<span>→</span>'; else if (i > 0) html += '<span>+</span>';
            html += `<span>${co[i] > 1 ? co[i] + ' ' : ''}${s.txt}</span>`;
          });
          eq.innerHTML = html;
          const els = Array.from(new Set(all.reduce((a, s) => a.concat(Object.keys(s.f)), []))).sort();
          let sumL = 0, sumR = 0, allOk = true;
          chips.innerHTML = els.map((e) => {
            let l = 0, rr = 0;
            all.forEach((s, i) => { const v = co[i] * (s.f[e] || 0); if (i < nl) l += v; else rr += v; });
            const ok = l === rr;
            sumL += l; sumR += rr; allOk = allOk && ok;
            return `<span style="border:2.5px solid var(--ink);border-radius:10px;padding:3px 9px;font-size:18px;background:${ok ? 'var(--good)' : 'var(--card)'};color:${ok ? '#14301F' : 'var(--ink)'}">${e}: ${l} | ${rr}</span>`;
          }).join('');
          tilt(sumL, sumR, allOk);
          nums.forEach((n, i) => { n.textContent = co[i]; });
        }
        function check() {
          if (co.every((v, i) => v === sol[i])) return win();
          const bal = Array.from(new Set(all.reduce((a, x) => a.concat(Object.keys(x.f)), []))).every((e) => {
            let t = 0; all.forEach((x, i) => { t += (i < nl ? 1 : -1) * co[i] * (x.f[e] || 0); }); return t === 0;
          });
          msg.textContent = bal && co.reduce(gcd, 0) > 1 ? F.tt({ de: 'Ausgeglichen, aber kürzbar!', en: 'Balanced, but can be reduced!' }) : '';
        }
        all.forEach((s, i) => {
          // all four children stretch to the same height, so the row reads as one line
          const row = F.h(`<div class="card sketch" style="display:flex;align-items:stretch;gap:10px;padding:6px 12px"><div style="flex:1;font-size:26px;min-width:0;display:flex;align-items:center">${s.txt}</div></div>`);
          const mk = (label, d) => {
            const b = F.h(`<button class="btn" style="min-width:56px;min-height:${all.length <= 3 ? 66 : 56}px;padding:0;font-size:28px">${label}</button>`);
            b.addEventListener('pointerdown', (e) => {
              e.preventDefault();
              if (done) return;
              co[i] = Math.max(1, Math.min(MAXC, co[i] + d));
              ctx.sfx('tap'); render(); check();
              num.classList.remove('tap-pop'); void num.offsetWidth; num.classList.add('tap-pop');
            });
            return b;
          };
          const num = F.h('<div style="min-width:36px;font-size:30px;font-weight:bold;display:flex;align-items:center;justify-content:center">1</div>');
          nums.push(num);
          row.appendChild(mk('−', -1)); row.appendChild(num); row.appendChild(mk('+', 1));
          rows.appendChild(row);
        });
        render();

        async function win() {
          if (done) return;
          done = true;
          const ms = tb.stop();
          solved++; points += 10 + Math.max(0, Math.ceil((TIME - ms) / 10000));
          ctx.sfx('good'); ctx.setScore(points);
          msg.textContent = F.tt({ de: 'Ausgeglichen!', en: 'Balanced!' });
          msg.classList.add('pop-in');
          if (round < ROUNDS) F.cheer(8);
          await ctx.wait(900);
          next();
        }
        async function reveal() {
          if (done) return;
          done = true;
          co.splice(0, co.length, ...sol); render();
          ctx.sfx('bad');
          msg.textContent = F.tt({ de: 'Zeit um. So geht es:', en: "Time's up. Like this:" });
          await ctx.wait(2200);
          next();
        }
      }

      function end() {
        ctx.finish({
          score: points, detail: F.tt({ de: `${solved}/${ROUNDS} ausgeglichen`, en: `${solved}/${ROUNDS} balanced` }),
          levelDelta: solved >= 6 ? 1 : solved <= 3 ? -1 : 0,
          quality: solved / ROUNDS, ink: 3 + solved * 2,
        });
      }
      next();
    },
  });
})();
