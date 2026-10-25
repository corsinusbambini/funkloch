/* Chaos Mode: random 5-second micro-games from every category, getting faster. Modifiers and boss rounds. */
(function () {
  const F = Funkloch;
  const T = (de, en) => ({ de, en });
  const PI = '1415926535897932384626433832795028841971';
  const COLORS = [{ n: T('Rot', 'Red'), c: '#E05A5A' }, { n: T('Blau', 'Blue'), c: '#4A86D8' }, { n: T('Grün', 'Green'), c: '#3FA45F' }, { n: T('Gelb', 'Yellow'), c: '#E0B020' }, { n: T('Lila', 'Purple'), c: '#9B6BD6' }];
  const SMALL_EL = [['H', 'Wasserstoff', 'Hydrogen'], ['He', 'Helium', 'Helium'], ['C', 'Kohlenstoff', 'Carbon'], ['N', 'Stickstoff', 'Nitrogen'], ['O', 'Sauerstoff', 'Oxygen'], ['Na', 'Natrium', 'Sodium'], ['K', 'Kalium', 'Potassium'], ['Fe', 'Eisen', 'Iron'], ['Cu', 'Kupfer', 'Copper'], ['Ag', 'Silber', 'Silver'], ['Au', 'Gold', 'Gold'], ['Hg', 'Quecksilber', 'Mercury'], ['Pb', 'Blei', 'Lead'], ['S', 'Schwefel', 'Sulfur'], ['Cl', 'Chlor', 'Chlorine'], ['Ca', 'Calcium', 'Calcium'], ['Mg', 'Magnesium', 'Magnesium'], ['Zn', 'Zink', 'Zinc'], ['Sn', 'Zinn', 'Tin'], ['P', 'Phosphor', 'Phosphorus'], ['Si', 'Silicium', 'Silicon'], ['Mn', 'Mangan', 'Manganese']];
  const NOBLE = ['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn'], NOT_NOBLE = ['H', 'N', 'O', 'Cl', 'F', 'Na', 'C', 'S', 'Fe', 'Br', 'I', 'Li'];
  const ODD = [['b', 'd'], ['O', 'Q'], ['6', '9'], ['E', 'F'], ['M', 'N'], ['p', 'q'], ['☺', '☹'], ['△', '▽'], ['8', 'B'], ['C', 'G'], ['l', 'I']];
  const COLLECT = [['★', '💣'], ['🍓', '🥦'], ['☀', '☁'], ['♥', '✗'], ['🍪', '🧂']];
  // Only glyphs without any symmetry, so a mirrored copy can never look like a rotated one.
  const MIRROR_GLYPHS = ['R', 'F', 'G', 'J', 'L', 'P', '4', '7', '?', 'ß', 'e', 'r'];

  // Place n things at random non-overlapping spots (percent coordinates).
  const spots = (r, n, minD = 22) => {
    const out = [];
    for (let tries = 0; out.length < n && tries < 500; tries++) {
      const p = [r.int(4, 78), r.int(4, 78)];
      if (out.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > minD)) out.push(p);
    }
    return out;
  };
  const thing = (label, [x, y], size = 64) => F.h(`<div class="tap-thing" style="left:${x}%;top:${y}%;width:${size}px;height:${size}px">${label}</div>`);

  // ---------- micro-games ----------
  // setup(stage, api): api = { r, win(), lose(), choice(qHtml, labels, correctIdx, cls), round, time }
  const M = F.registerMicro;
  M({ id: 'flash3', instr: T('Merken!', 'Remember!'), choice: true, setup(st, a) {
    const n = a.round > 12 ? 5 : 4, d = String(a.r.int(10 ** (n - 1), 10 ** n - 1));
    st.innerHTML = `<div class="big-display">${d}</div>`;
    setTimeout(() => {
      if (a.over()) return;
      const swap = (s) => { const i = a.r.int(0, s.length - 2); return s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2); };
      const chg = (s) => { const i = a.r.int(1, s.length - 1); return s.slice(0, i) + ((+s[i] + a.r.int(1, 8)) % 10) + s.slice(i + 1); };
      const set = new Set([d]); const opts = [d];
      while (opts.length < 3) { const w = a.r.chance(0.5) ? swap(d) : chg(d); if (!set.has(w)) { set.add(w); opts.push(w); } }
      const sh = a.r.shuffle(opts);
      a.choice(F.tt(T('Welche war es?', 'Which was it?')), sh, sh.indexOf(d), 'one');
    }, 900);
  }, minTime: 4200 });
  M({ id: 'bigger', instr: T('Grössere Zahl!', 'Bigger number!'), choice: true, setup(st, a) {
    const dec = a.round > 8 && a.r.chance(0.5);
    const x = dec ? (a.r.int(100, 999) / 100) : a.r.int(10, 999);
    let y; do { y = dec ? +(x + a.r.int(-30, 30) / 100).toFixed(2) : x + a.r.int(-25, 25); } while (y === x || y <= 0);
    a.choice('', [x, y], x > y ? 0 : 1);
  } });
  M({ id: 'pi', instr: T('Echtes π?', 'Real π?'), choice: true, setup(st, a) {
    const len = 6 + Math.min(10, Math.floor(a.round / 3));
    const real = '3.' + PI.slice(0, len);
    const i = a.r.int(3, real.length - 1);
    const fake = real.slice(0, i) + ((+real[i] + a.r.int(1, 9)) % 10) + real.slice(i + 1);
    const sh = a.r.shuffle([real, fake]);
    a.choice('', sh, sh.indexOf(real), 'one');
  } });
  M({ id: 'truefalse', instr: T('Stimmt’s?', 'True?'), choice: true, setup(st, a) {
    const op = a.r.pick(['+', '×', '−']);
    const x = a.r.int(2, op === '×' ? 12 : 60), y = a.r.int(2, op === '×' ? 12 : 40);
    const res = op === '+' ? x + y : op === '×' ? x * y : x - y;
    const right = a.r.chance(0.5), shown = right ? res : res + a.r.pick([-10, -2, -1, 1, 2, 10]);
    a.choice(`<div class="big-display" style="font-size:40px">${x} ${op} ${y} = ${shown}</div>`, ['✓', '✗'], right ? 0 : 1);
  } });
  M({ id: 'half', instr: T('Die Hälfte!', 'Half it!'), choice: true, setup(st, a) {
    const x = a.r.int(6, 99) * 2 + (a.round > 10 && a.r.chance(0.4) ? 1 : 0);
    const h = x / 2;
    const opts = a.r.shuffle([h, h + a.r.pick([1, 2, 5, 10]), h - a.r.pick([1, 3, 5])]);
    a.choice(`<div class="big-display">${x}</div>`, opts, opts.indexOf(h));
  } });
  M({ id: 'percent', instr: T('Prozent!', 'Percent!'), choice: true, setup(st, a) {
    const p = a.r.pick([10, 20, 25, 50, 5, 75]), base = a.r.pick([40, 60, 80, 120, 200, 240, 300, 400, 500, 640]);
    const v = (p * base) / 100;
    const opts = a.r.shuffle([v, v * 2, v / 2 === v ? v + 5 : v + base / 10]);
    const uniq = [...new Set(opts)]; for (let k = 3; uniq.length < 3; k += 3) if (!uniq.includes(v + k)) uniq.push(v + k);
    a.choice(`<div class="big-display" style="font-size:38px">${p}% ${F.tt(T('von', 'of'))} ${base}</div>`, uniq, uniq.indexOf(v));
  } });
  M({ id: 'units', instr: T('Umrechnen!', 'Convert!'), choice: true, setup(st, a) {
    const k = a.r.pick([['L', 'mL', 1000], ['g', 'mg', 1000], ['kg', 'g', 1000], ['m', 'cm', 100], ['mL', 'µL', 1000], ['h', 'min', 60]]);
    const x = a.r.pick([0.2, 0.25, 0.5, 1.5, 2, 2.5, 3, 0.05, 0.75]);
    const v = +(x * k[2]).toFixed(3);
    const opts = a.r.shuffle([v, +(v * 10).toFixed(3), +(v / 10).toFixed(3)]);
    a.choice(`<div class="big-display" style="font-size:38px">${x} ${k[0]} = ? ${k[1]}</div>`, opts, opts.indexOf(v));
  } });
  M({ id: 'make10', instr: T('Ergibt 10!', 'Makes 10!'), setup(st, a) {
    const p = a.r.int(1, 9), nums = [p, 10 - p];
    while (nums.length < 6) { const n = a.r.int(1, 9); if (nums.slice(2).every((m) => m + n !== 10) && n + p !== 10 && n + (10 - p) !== 10 && n !== 5) nums.push(n); }
    let sel = null;
    spots(a.r, 6).forEach((pos, i) => {
      const n = a.r.shuffle(nums)[0];
      nums.splice(nums.indexOf(n), 1);
      const t = thing(n, pos); t.dataset.n = n;
      t.addEventListener('pointerdown', () => {
        if (sel === t) return;
        if (!sel) { sel = t; t.style.background = 'var(--c-math)'; return; }
        if (+sel.dataset.n + n === 10) { t.style.background = 'var(--good)'; a.win(); } else a.lose();
      });
      st.appendChild(t);
    });
  } });
  M({ id: 'mirror', instr: T('Spiegelbild!', 'Mirror image!'), choice: true, setup(st, a) {
    const g = a.r.pick(MIRROR_GLYPHS);
    const rots = a.r.shuffle([90, 180, 270, 0]).slice(0, 3);
    const mrot = a.r.pick([0, 0, 90, 180]);
    const items = rots.map((d) => `<span style="display:inline-block;transform:rotate(${d}deg)">${g}</span>`);
    items.push(`<span style="display:inline-block;transform:rotate(${mrot}deg) scaleX(-1)">${g}</span>`);
    const sh = a.r.shuffle(items.map((h, i) => ({ h, i })));
    a.choice(`<div class="big-display" style="font-size:60px">${g}</div>`, sh.map((x) => `<span style="font-size:40px">${x.h}</span>`), sh.findIndex((x) => x.i === 3));
  } });
  M({ id: 'symbol', instr: T('Welches Element?', 'Which element?'), choice: true, setup(st, a) {
    const e = a.r.pick(SMALL_EL);
    const opts = a.r.shuffle([e].concat(a.r.shuffle(SMALL_EL.filter((x) => x !== e)).slice(0, 3)));
    a.choice(`<div class="big-display" style="font-size:60px">${e[0]}</div>`, opts.map((o) => F.tt(T(o[1], o[2]))), opts.indexOf(e));
  } });
  M({ id: 'acidbase', instr: T('Sauer oder basisch?', 'Acid or base?'), choice: true, setup(st, a) {
    let ph; do { ph = a.r.int(0, 140) / 10; } while (ph > 6.4 && ph < 7.6);
    a.choice(`<div class="big-display">pH ${ph.toFixed(1)}</div>`, [F.tt(T('sauer', 'acid')), F.tt(T('basisch', 'base'))], ph < 7 ? 0 : 1);
  } });
  M({ id: 'noble', instr: T('Edelgas!', 'Noble gas!'), choice: true, setup(st, a) {
    const right = a.r.pick(NOBLE), opts = a.r.shuffle([right].concat(a.r.shuffle(NOT_NOBLE).slice(0, 3)));
    a.choice('', opts.map((o) => `<span style="font-size:34px">${o}</span>`), opts.indexOf(right));
  } });
  M({ id: 'inkcolor', instr: T('Farbe der Schrift!', 'Colour of the ink!'), choice: true, setup(st, a) {
    const word = a.r.pick(COLORS), ink = a.r.pick(COLORS.filter((c) => c !== word));
    const opts = a.r.shuffle([ink, word].concat(a.r.shuffle(COLORS.filter((c) => c !== ink && c !== word)).slice(0, 2)));
    a.choice(`<div class="big-display" style="color:${ink.c};font-size:56px">${F.tt(word.n).toUpperCase()}</div>`, opts.map((o) => F.tt(o.n)), opts.indexOf(ink));
  } });
  M({ id: 'collect', instr: T('Alle sammeln, nicht das Falsche!', 'Collect them, avoid the bad one!'), setup(st, a) {
    const [good, bad] = a.r.pick(COLLECT);
    a.setInstr(`${F.tt(T('Alle', 'All'))} ${good} · ${F.tt(T('kein', 'no'))} ${bad}`);
    const nGood = a.r.int(3, 4), pos = spots(a.r, nGood + 2);
    let left = nGood;
    pos.forEach((p, i) => {
      const isGood = i < nGood, t = thing(isGood ? good : bad, p);
      t.addEventListener('pointerdown', () => {
        if (!isGood) return a.lose();
        if (t.dataset.done) return;
        t.dataset.done = 1; t.style.opacity = '.25'; F.sfx('tap');
        if (--left === 0) a.win();
      });
      st.appendChild(t);
    });
  } });
  M({ id: 'catch', instr: T('Fang ihn!', 'Catch it!'), setup(st, a) {
    const t = thing('✦', [40, 40], 58);
    let x = 40, y = 40, vx = (a.r() < 0.5 ? -1 : 1) * (35 + a.round * 2), vy = (a.r() < 0.5 ? -1 : 1) * (28 + a.round * 2), last = performance.now();
    const step = (now) => {
      if (a.over()) return;
      const dt = (now - last) / 1000; last = now;
      x += vx * dt; y += vy * dt;
      if (x < 0 || x > 80) vx = -vx; if (y < 0 || y > 82) vy = -vy;
      x = Math.max(0, Math.min(80, x)); y = Math.max(0, Math.min(82, y));
      t.style.left = x + '%'; t.style.top = y + '%';
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
    t.addEventListener('pointerdown', (e) => { e.stopPropagation(); a.win(); });
    st.appendChild(t);
  } });
  M({ id: 'waiteyes', instr: T('Warte… tipp, wenn die Augen aufgehen!', 'Wait… tap when the eyes open!'), setup(st, a) {
    const c = F.h(`<div style="display:flex;justify-content:center;align-items:center;height:100%">${F.companionSVG({ mood: 'sleep', cls: 'lg' })}</div>`);
    let open = false;
    st.appendChild(c);
    setTimeout(() => { if (a.over()) return; open = true; c.innerHTML = F.companionSVG({ mood: 'wow', cls: 'lg' }); F.sfx('tick'); }, 900 + a.r() * 1800);
    st.addEventListener('pointerdown', () => (open ? a.win() : a.lose()));
  }, minTime: 4200 });
  M({ id: 'order', instr: T('Der Reihe nach!', 'In order!'), setup(st, a) {
    const n = a.round > 10 ? 5 : 4;
    const big = a.round > 15;
    const vals = big ? a.r.shuffle([...Array(30).keys()].map((x) => x + 1)).slice(0, n).sort((x, y) => x - y) : [...Array(n).keys()].map((x) => x + 1);
    let k = 0;
    a.r.shuffle(spots(a.r, n)).forEach((p, i) => {
      const t = thing(vals[i], p);
      t.addEventListener('pointerdown', () => {
        if (t.dataset.done) return;
        if (i !== k) return a.lose();
        t.dataset.done = 1; t.style.background = 'var(--good)'; F.sfx('tap'); k++;
        if (k === n) a.win();
      });
      st.appendChild(t);
    });
  } });
  M({ id: 'dots', instr: T('Wie viele Punkte?', 'How many dots?'), choice: true, setup(st, a) {
    const n = a.r.int(5, 9 + Math.min(6, a.round >> 2));
    spots(a.r, n, 14).forEach((p) => st.appendChild(F.h(`<div style="position:absolute;left:${p[0] + 5}%;top:${p[1] + 5}%;width:26px;height:26px;border-radius:50%;background:var(--ink)"></div>`)));
    setTimeout(() => {
      if (a.over()) return;
      st.innerHTML = '';
      const opts = a.r.shuffle([n, n + a.r.pick([1, 2]), n - a.r.pick([1, 2])]);
      a.choice('', opts, opts.indexOf(n));
    }, 1000);
  }, minTime: 4000 });
  M({ id: 'odd', instr: T('Finde den Anderen!', 'Find the odd one!'), setup(st, a) {
    const [x, y] = a.r.pick(ODD), n = a.round > 10 ? 16 : 9, cols = Math.sqrt(n), odd = a.r.int(0, n - 1);
    const g = F.h(`<div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:8px;height:100%"></div>`);
    for (let i = 0; i < n; i++) {
      const b = F.h(`<button class="opt" style="font-size:30px;min-height:0">${i === odd ? y : x}</button>`);
      b.addEventListener('pointerdown', () => (i === odd ? a.win() : a.lose()));
      g.appendChild(b);
    }
    st.appendChild(g);
  } });
  M({ id: 'beaker', instr: T('Halten bis zur Linie!', 'Hold to the line!'), setup(st, a) {
    const mark = a.r.int(35, 80);
    const wrap = F.h(`<div style="display:flex;flex-direction:column;align-items:center;gap:14px;height:100%">
      <div style="position:relative;width:120px;height:220px;border:3px solid var(--ink);border-top:none;border-radius:0 0 18px 18px;overflow:hidden;background:var(--card)">
        <div class="liq" style="position:absolute;left:0;right:0;bottom:0;height:0;background:#7FC8E8"></div>
        <div style="position:absolute;left:0;right:0;bottom:${mark}%;border-top:3px dashed var(--bad)"></div></div>
      <button class="btn primary" style="width:200px">${F.tt(T('Gedrückt halten', 'Press & hold'))}</button></div>`);
    const liq = wrap.querySelector('.liq'), btn = wrap.querySelector('button');
    let level = 0, filling = false, last = 0;
    const rate = 38 + a.round * 1.5;
    const step = (now) => {
      if (!filling || a.over()) return;
      level += ((now - last) / 1000) * rate; last = now;
      liq.style.height = Math.min(100, level) + '%';
      if (level >= 100) return a.lose();
      requestAnimationFrame(step);
    };
    btn.addEventListener('pointerdown', (e) => { e.preventDefault(); filling = true; last = performance.now(); requestAnimationFrame(step); });
    const release = () => { if (!filling) return; filling = false; Math.abs(level - mark) <= 6 ? a.win() : a.lose(); };
    btn.addEventListener('pointerup', release); btn.addEventListener('pointerleave', release); btn.addEventListener('pointercancel', release);
    st.appendChild(wrap);
  } });
  M({ id: 'wake', instr: T('Aufwecken! Hin und her wischen', 'Wake it up! Swipe back and forth'), setup(st, a) {
    const c = F.h(`<div style="display:flex;justify-content:center;align-items:center;height:100%;touch-action:none">${F.companionSVG({ mood: 'sleep', cls: 'lg' })}</div>`);
    let dist = 0, lx = null;
    const need = 900 + a.round * 20;
    c.addEventListener('pointermove', (e) => {
      if (lx != null) dist += Math.abs(e.clientX - lx);
      lx = e.clientX;
      if (dist > need) { c.innerHTML = F.companionSVG({ mood: 'cheer', cls: 'lg' }); a.win(); }
    });
    c.addEventListener('pointerup', () => (lx = null));
    st.appendChild(c);
  } });

  // ---------- engine ----------
  F.registerGame({
    id: 'chaos', skill: 'fun', glyph: '⚡',
    name: { de: 'Chaos-Modus', en: 'Chaos Mode' },
    desc: {
      de: 'Zufällige Mini-Spiele aus allen Bereichen, je ein paar Sekunden. Es wird immer schneller, ab und zu mit verrückten Regeln (gespiegelt, kopfüber, „Tipp das Falsche!“). Jede 10. Runde ist ein Boss. 3 Leben.',
      en: 'Random micro-games from every area, a few seconds each. It keeps getting faster, sometimes with crazy rules (mirrored, upside down, “tap the wrong one!”). Every 10th round is a boss. 3 lives.',
    },
    noLevel: true,
    start(ctx) {
      const r = ctx.rng;
      let lives = 3, round = 0, score = 0, wins = 0;
      const recent = [];
      const MODS = [
        { id: 'mirror', label: T('Gespiegelt!', 'Mirrored!') }, { id: 'upside', label: T('Kopfüber!', 'Upside down!') },
        { id: 'tiny', label: T('Winzig!', 'Tiny!') }, { id: 'opposite', label: T('Tipp das FALSCHE!', 'Tap the WRONG one!'), choiceOnly: true },
      ];
      const hearts = () => '♥'.repeat(lives) + '♡'.repeat(3 - lives);

      function next() {
        if (lives <= 0) return end();
        round++;
        const boss = round % 10 === 0;
        let micro;
        do { micro = r.pick(F.micro); } while (recent.includes(micro.id));
        recent.push(micro.id); if (recent.length > Math.min(6, F.micro.length - 1)) recent.shift();
        let mod = null;
        if (!boss && round > 5 && r.chance(Math.min(0.45, 0.15 + round * 0.01))) {
          const ok = MODS.filter((m) => !m.choiceOnly || micro.choice);
          mod = r.pick(ok);
        }
        const base = Math.max(2300, 5200 - round * 110);
        const time = Math.max(micro.minTime || 0, base) * (boss ? 1.6 : 1) * (mod && mod.id === 'opposite' ? 1.2 : 1);
        ctx.setScore(score);
        ctx.setInfo(`<span class="lives">${hearts()}</span> &nbsp; ${F.tt(T('Runde', 'Round'))} ${round}${boss ? ' · <b>BOSS ×2</b>' : ''}`);
        ctx.el.innerHTML = '';
        const instr = F.h(`<div class="micro-instr">${F.tt(micro.instr)}${mod ? `<br><span style="font-size:24px;color:var(--bad)">${F.tt(mod.label)}</span>` : ''}</div>`);
        const stage = F.h(`<div class="micro-stage card sketch ${mod && mod.id !== 'opposite' ? mod.id : ''}" style="padding:12px"></div>`);
        let over = false;
        const tb = ctx.timer(ctx.el, time, () => resolve(false));
        ctx.el.append(instr, stage);
        async function resolve(won) {
          if (over) return; over = true;
          tb.stop();
          if (won) { wins++; score += boss ? 2 : 1; ctx.sfx('good'); stage.classList.add('flash-ok'); }
          else { lives--; ctx.sfx('bad'); stage.classList.add('flash-bad'); }
          ctx.setScore(score);
          await ctx.wait(won ? 380 : 750);
          next();
        }
        const api = {
          r, round, time,
          over: () => over || ctx.dead,
          win: () => resolve(true), lose: () => resolve(false),
          setInstr: (h) => { instr.innerHTML = h + (mod ? `<br><span style="font-size:24px;color:var(--bad)">${F.tt(mod.label)}</span>` : ''); },
          choice(qHtml, labels, correct, cls = '') {
            if (qHtml) stage.appendChild(F.h(`<div>${qHtml}</div>`));
            const wrongPick = mod && mod.id === 'opposite';
            const opts = F.options(labels.map(String), (i, b) => {
              const ok = wrongPick ? i !== correct : i === correct;
              b.classList.add(ok ? 'right' : 'wrong');
              resolve(ok);
            }, cls);
            stage.appendChild(opts);
          },
        };
        try { micro.setup(stage, api); } catch (e) { console.error(micro.id, e); resolve(true); }
      }
      function end() {
        ctx.finish({
          score, rounds: wins,
          detail: F.tt({ de: `${wins} Mini-Spiele geschafft · Runde ${round}`, en: `${wins} micro-games won · round ${round}` }),
          quality: Math.min(1, wins / 20), ink: 3 + wins,
        });
      }
      next();
    },
  });
})();
