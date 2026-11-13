/* Name & Face: study a few doodle faces with made-up names, then say whose name belongs to which face. */
(function () {
  const F = Funkloch;
  const SKIN = ['#F6D3B3', '#E8B48A', '#C98D63', '#9A6A47', '#FBE3C8'];
  const HAIRC = ['#3A2A22', '#B5651D', '#E8C25A', '#C04A3A', '#9A9AA6', '#6B4BC0'];
  const ON = ['B', 'D', 'F', 'G', 'H', 'K', 'L', 'M', 'N', 'P', 'R', 'S', 'T', 'V', 'Z'];
  const VO = ['a', 'e', 'i', 'o', 'u'];
  const ENDC = ['', '', 'n', 'l', 'r', 's', 'm'];
  const ROUNDS = 3;

  function makeName(r) {
    return r.pick(ON) + r.pick(VO) + r.pick(['b', 'd', 'k', 'l', 'm', 'n', 'r', 's', 't', 'z']) + r.pick(VO) + r.pick(ENDC);
  }

  // style 0..5 hair, acc 0..3: none, glasses, beanie, bow
  function face(f, size) {
    const sk = f.skin, hc = f.hair, st = f.style, ac = f.acc;
    const o = 'stroke:var(--ink)';
    let back = '', front = '';
    if (st === 1) back = `<path d="M18,50 C12,90 22,98 32,92 L34,50 Z M82,50 C88,90 78,98 68,92 L66,50 Z" style="fill:${hc};${o}" stroke-width="3" stroke-linejoin="round"/>`;
    if (st === 4) back = `<circle cx="14" cy="58" r="10" style="fill:${hc};${o}" stroke-width="3"/><circle cx="86" cy="58" r="10" style="fill:${hc};${o}" stroke-width="3"/>`;
    const cap = `<path d="M20,46 C16,14 84,14 80,46 C70,34 58,30 50,30 C42,30 30,34 20,46 Z" style="fill:${hc};${o}" stroke-width="3" stroke-linejoin="round"/>`;
    if (st === 0 || st === 1 || st === 4) front = cap;
    if (st === 2) front = [[28, 30], [42, 22], [58, 22], [72, 30], [22, 44], [78, 44]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="11" style="fill:${hc};${o}" stroke-width="3"/>`).join('') + `<path d="M26,44 C34,34 66,34 74,44 L72,36 C60,28 40,28 28,36 Z" style="fill:${hc}"/>`;
    if (st === 3) front = `<path d="M44,18 C44,8 50,6 52,12 C54,6 60,8 58,18" fill="none" style="${o}" stroke-width="3" stroke-linecap="round"/><path d="M20,46 C20,40 24,36 26,34 L24,48 Z M80,46 C80,40 76,36 74,34 L76,48 Z" style="fill:${hc};${o}" stroke-width="2.5"/>`;
    if (st === 5) front = `<path d="M20,46 L18,22 L34,32 L40,10 L50,28 L62,8 L66,30 L82,20 L80,46 C70,36 30,36 20,46 Z" style="fill:${hc};${o}" stroke-width="3" stroke-linejoin="round"/>`;
    let acc = '';
    if (ac === 1) acc = `<circle cx="36" cy="54" r="10" fill="none" style="${o}" stroke-width="3.2"/><circle cx="64" cy="54" r="10" fill="none" style="${o}" stroke-width="3.2"/><path d="M46,54 H54" style="${o}" stroke-width="3.2"/>`;
    if (ac === 2) acc = `<path d="M18,40 C18,6 82,6 82,40 Z" style="fill:#E8574F;${o}" stroke-width="3" stroke-linejoin="round"/><path d="M16,40 H84" style="${o}" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="8" r="6" style="fill:#fff;${o}" stroke-width="2.5"/>`;
    if (ac === 3) acc = `<g transform="translate(70,24)"><path d="M0,0 L-14,-9 L-14,9 Z M0,0 L14,-9 L14,9 Z" style="fill:#F07C8C;${o}" stroke-width="2.6" stroke-linejoin="round"/><circle r="4" style="fill:#F07C8C;${o}" stroke-width="2.6"/></g>`;
    const eyes = ac === 1 ? '<circle cx="36" cy="54" r="2.6"/><circle cx="64" cy="54" r="2.6"/>' : '<circle cx="36" cy="54" r="4"/><circle cx="64" cy="54" r="4"/>';
    const mouth = f.mouth ? '<path d="M38,76 Q50,90 62,76 Z" style="fill:var(--ink)" stroke-width="2" stroke-linejoin="round"/>' : '<path d="M38,76 Q50,86 62,76" fill="none" style="stroke:var(--ink)" stroke-width="3.2" stroke-linecap="round"/>';
    return `<svg viewBox="0 0 100 104" width="${size}" height="${size}" stroke-linecap="round">
      ${back}<ellipse cx="50" cy="60" rx="31" ry="34" style="fill:${sk};${o}" stroke-width="3.2"/>
      <circle cx="21" cy="62" r="5" style="fill:${sk};${o}" stroke-width="2.5"/><circle cx="79" cy="62" r="5" style="fill:${sk};${o}" stroke-width="2.5"/>
      ${front}<g style="fill:var(--ink)">${eyes}</g><circle cx="32" cy="68" r="5" fill="#F07C8C" opacity=".35"/><circle cx="68" cy="68" r="5" fill="#F07C8C" opacity=".35"/>${mouth}${acc}</svg>`;
  }

  F.registerGame({
    id: 'name-face', skill: 'memory', added: '2026-11-13', glyph: '🙂?',
    name: { de: 'Name & Gesicht', en: 'Name & Face' },
    desc: {
      de: 'Du lernst ein paar Gekritzel-Gesichter mit erfundenen Namen kennen. Präge dir ein, wer wie heisst, und tippe auf "Weiter". Dann erscheint ein Gesicht und du wählst den richtigen Namen. 3 Runden, je mehr Gesichter, desto schwerer.',
      en: 'You meet a few doodle faces with made-up names. Remember who is called what and tap "Next". Then a face appears and you pick the right name. 3 rounds, and the higher your level, the more faces you must remember.',
    },
    start(ctx) {
      const r = ctx.rng;
      const n = ctx.level >= 6 ? 6 : ctx.level >= 3 ? 5 : 4;
      let round = 0, right = 0, asked = 0, points = 0;

      function makeSet() {
        const faces = [], used = new Set(), names = new Set();
        for (let tries = 0; faces.length < n && tries < 200; tries++) {
          const f = { skin: r.pick(SKIN), hair: r.pick(HAIRC), style: r.int(0, 5), acc: r.int(0, 3), mouth: r.chance(0.35) };
          const key = f.style + '-' + f.acc;
          const nm = makeName(r);
          if (used.has(key) || names.has(nm) || [...names].some((x) => x[0] === nm[0])) continue;
          used.add(key); names.add(nm); f.name = nm; faces.push(f);
        }
        return faces;
      }

      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setInfo(`${round} / ${ROUNDS}`); ctx.setScore(points);
        const faces = ctx.fresh(makeSet, (fs) => fs.map((f) => f.name).join(','));
        study(faces);
      }

      function study(faces) {
        ctx.el.innerHTML = '';
        ctx.el.appendChild(F.h(`<div class="info-line" style="text-align:center;font-size:20px;margin-top:8px">${F.tt({ de: 'Präge dir die Namen ein', en: 'Remember the names' })}</div>`));
        const grid = F.h('<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:10px 0"></div>');
        faces.forEach((f, i) => {
          const c = F.h(`<div class="card sketch pop-in" style="padding:8px 4px 8px;text-align:center;background:var(--card);transform:rotate(${i % 2 ? 1 : -1}deg);animation-delay:${i * 60}ms">${face(f, n > 4 ? 100 : 128)}<div style="font-size:24px;margin-top:2px">${f.name}</div></div>`);
          grid.appendChild(c);
        });
        const btn = F.h(`<button class="btn primary big" style="width:100%;min-height:72px;font-size:24px">${F.tt({ de: 'Weiter', en: 'Next' })}</button>`);
        btn.addEventListener('pointerdown', (e) => { e.preventDefault(); ctx.sfx('tap'); quiz(faces); });
        ctx.el.append(grid, btn);
      }

      function quiz(faces) {
        const order = r.shuffle(faces.map((f, i) => i));
        let qi = 0;
        function ask() {
          if (qi >= order.length) return next();
          const f = faces[order[qi]];
          const others = r.shuffle(faces.filter((x) => x !== f)).slice(0, 3);
          const opts = r.shuffle([f].concat(others));
          ctx.el.innerHTML = '';
          ctx.setInfo(`${round} / ${ROUNDS} · ${qi + 1} / ${order.length}`);
          const card = F.h(`<div class="card sketch pop-in" style="margin:10px auto 14px;max-width:230px;padding:12px;text-align:center;background:var(--c-memory);transform:rotate(1deg)">${face(f, 170)}</div>`);
          ctx.el.appendChild(card);
          ctx.el.appendChild(F.h(`<div class="info-line" style="text-align:center;font-size:20px;margin-bottom:10px">${F.tt({ de: 'Wie heisst dieses Gesicht?', en: 'What is this face called?' })}</div>`));
          const ob = F.options(opts.map((o) => o.name), async (i, b, wrap) => {
            asked++;
            const ok = opts[i] === f;
            b.classList.add(ok ? 'right' : 'wrong');
            if (ok) { right++; points += 5; ctx.setScore(points); ctx.sfx('good'); card.classList.add('flash-ok'); }
            else {
              ctx.sfx('bad'); card.classList.add('flash-bad');
              [...wrap.children].forEach((c, k) => { if (opts[k] === f) c.classList.add('right'); });
            }
            await ctx.wait(ok ? 650 : 1300);
            qi++; ask();
          }, 'tall');
          ctx.el.appendChild(ob);
        }
        ask();
      }

      function end() {
        const q = right / Math.max(1, asked);
        ctx.finish({
          score: points, detail: F.tt({ de: `${right} von ${asked} Namen richtig`, en: `${right} of ${asked} names right` }),
          levelDelta: q >= 0.85 ? 1 : q < 0.45 ? -1 : 0, quality: q, ink: 3 + Math.round(points / 4),
        });
      }
      next();
    },
  });
})();
