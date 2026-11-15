/* Lab Glassware: recognise lab equipment drawn in SVG, name it, and pick the right piece for a job. */
(function () {
  const F = Funkloch;
  const QUESTIONS = 10;
  const L = 'style="fill:var(--c-chem);stroke:none"';
  const G = 'fill="none" style="stroke:var(--ink)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"';
  const tick = (x, y0, n, dy, w) => Array.from({ length: n }, (_, i) => `M${x},${y0 + i * dy} l${w},0`).join(' ');

  const ITEMS = {
    beaker: { name: { de: 'Becherglas', en: 'Beaker' },
      svg: `<path d="M14,40 L46,40 L46,66 Q46,72 40,72 L20,72 Q14,72 14,66 Z" ${L}/><path d="M14,12 L14,66 Q14,72 20,72 L40,72 Q46,72 46,66 L46,12 M10,9 L14,12" ${G}/><path d="${tick(46, 24, 4, 10, -7)}" ${G} stroke-width="2"/>` },
    erlenmeyer: { name: { de: 'Erlenmeyerkolben', en: 'Erlenmeyer flask' },
      svg: `<path d="M14,56 L46,56 L51,68 Q52,73 47,73 L13,73 Q8,73 9,68 Z" ${L}/><path d="M24,6 L24,28 L8,68 Q6,74 12,74 L48,74 Q54,74 52,68 L36,28 L36,6 M21,6 L39,6" ${G}/><path d="M28,50 l4,0" ${G} stroke-width="2"/>` },
    tube: { name: { de: 'Reagenzglas', en: 'Test tube' },
      svg: `<path d="M23,40 L37,40 L37,66 Q37,75 30,75 Q23,75 23,66 Z" ${L}/><path d="M22,6 L22,66 Q22,76 30,76 Q38,76 38,66 L38,6 M19,6 L41,6" ${G}/>` },
    cylinder: { name: { de: 'Messzylinder', en: 'Graduated cylinder' },
      svg: `<path d="M21,34 L39,34 L39,67 L21,67 Z" ${L}/><path d="M20,6 L20,68 M40,6 L40,68 M20,6 L40,6 M11,74 Q11,68 20,68 L40,68 Q49,68 49,74 Z" ${G}/><path d="${tick(40, 14, 6, 9, -6)}" ${G} stroke-width="2"/>` },
    volumetric: { name: { de: 'Messkolben', en: 'Volumetric flask' },
      svg: `<path d="M11,56 L49,56 Q51,74 30,74 Q9,74 11,56 Z" ${L}/><path d="M26,4 L26,34 Q10,40 10,58 Q10,74 30,74 Q50,74 50,58 Q50,40 34,34 L34,4 M23,4 L37,4" ${G}/><path d="M24,16 L36,16" ${G} stroke-width="2.4"/>` },
    burette: { name: { de: 'Bürette', en: 'Burette' },
      svg: `<path d="M27,20 L33,20 L33,62 L27,62 Z" ${L}/><path d="M26,4 L26,64 M34,4 L34,64 M26,4 L34,4 M30,64 L30,70 M20,67 L40,67 M30,70 L30,77" ${G}/><path d="${tick(34, 12, 5, 10, -5)}" ${G} stroke-width="2"/>` },
    funnel: { name: { de: 'Trichter', en: 'Funnel' },
      svg: `<path d="M12,20 L48,20 L34,38 L26,38 Z" ${L}/><path d="M6,10 L54,10 L34,40 L34,70 L26,70 L26,40 Z" ${G}/><path d="M30,70 l-2,6" ${G} stroke-width="2.4"/>` },
    pipette: { name: { de: 'Pipette', en: 'Pipette' },
      svg: `<path d="M27,42 L33,42 L33,60 L30,72 L27,60 Z" ${L}/><path d="M22,14 a8,9 0 1 1 16,0 L34,20 L34,60 L30,74 L26,60 L26,20 Z" ${G}/><path d="${tick(34, 28, 3, 9, -5)}" ${G} stroke-width="2"/>` },
    roundbottom: { name: { de: 'Rundkolben', en: 'Round-bottom flask' },
      svg: `<path d="M10,52 L50,52 A20,20 0 0 1 10,52 Z" ${L}/><path d="M25,6 L25,30 A24,24 0 1 0 35,30 L35,6 M22,6 L38,6" ${G}/>` },
  };
  const IDS = Object.keys(ITEMS);
  const pic = (id, s) => `<svg viewBox="0 0 60 80" width="${s * 0.75}" height="${s}" style="display:block;color:var(--ink)" aria-hidden="true">${ITEMS[id].svg}</svg>`;

  // jobs per item; some contain generated numbers
  const JOBS = {
    beaker: [(r) => ({ de: 'Lösungen grob abmessen, mischen und umrühren', en: 'Roughly measure, mix and stir solutions' }), () => ({ de: 'Eine Flüssigkeit auf der Heizplatte erwärmen', en: 'Warm a liquid on the hot plate' })],
    erlenmeyer: [() => ({ de: 'Bei der Titration schwenken, ohne dass es spritzt', en: 'Swirl during a titration without splashing' }), () => ({ de: 'Eine Lösung mit enger Öffnung aufbewahren und schütteln', en: 'Keep and shake a solution with a narrow opening' })],
    tube: [() => ({ de: 'Kleine Proben für einen Schnelltest mischen', en: 'Mix small samples for a quick test' }), () => ({ de: 'Ein paar Tropfen im Gestell beobachten', en: 'Watch a few drops in the rack' })],
    cylinder: [(r) => { const v = r.pick([20, 30, 40, 60, 80]); return { de: `Etwa ${v} mL Flüssigkeit abmessen`, en: `Measure about ${v} mL of liquid` }; }],
    volumetric: [(r) => { const v = r.pick([100, 250, 500, 1000]); return { de: `Genau ${v}.0 mL Standardlösung ansetzen`, en: `Prepare exactly ${v}.0 mL of standard solution` }; }],
    burette: [() => ({ de: 'Massflüssigkeit tropfenweise und genau zugeben', en: 'Add titrant drop by drop, precisely' }), () => ({ de: 'Verbrauchtes Volumen bei der Titration ablesen', en: 'Read the volume used in a titration' })],
    funnel: [() => ({ de: 'Flüssigkeit in eine enge Öffnung füllen', en: 'Pour liquid into a narrow opening' }), () => ({ de: 'Mit Filterpapier einen Feststoff abfiltrieren', en: 'Filter off a solid using filter paper' })],
    pipette: [() => ({ de: 'Eine kleine Portion aufsaugen und umfüllen', en: 'Draw up a small portion and transfer it' })],
    roundbottom: [() => ({ de: 'Gleichmässig erhitzen, zum Beispiel bei einer Destillation', en: 'Heat evenly, for example in a distillation' })],
  };

  F.registerGame({
    id: 'lab-glassware', skill: 'chem', added: '2026-11-15', glyph: '🧫',
    name: { de: 'Glasgeräte', en: 'Lab Glassware' },
    desc: {
      de: 'Wie heisst dieses Laborgerät, und welches brauchst du wofür? Erkenne die gezeichneten Glasgeräte am Namen und finde das passende für jede Aufgabe. 10 Fragen: Mit möglichst vielen richtigen Antworten gewinnst du.',
      en: 'What is this piece of lab equipment called, and which one do you need for what? Recognise the drawn glassware by name and find the right one for each job. 10 questions: get as many right as you can to win.',
    },
    start(ctx) {
      const r = ctx.rng;
      let qi = 0, right = 0;
      const order = r.shuffle(IDS.concat(IDS)).slice(0, QUESTIONS);

      function next() {
        if (qi >= QUESTIONS) return end();
        const id = order[qi], kind = qi % 3 === 0 ? 'name' : qi % 3 === 1 ? 'pic' : 'use';
        qi++;
        ctx.setInfo(`${qi} / ${QUESTIONS}`); ctx.setScore(right * 10);
        const others = r.shuffle(IDS.filter((x) => x !== id)).slice(0, 3);
        const opts = r.shuffle([id].concat(others));
        let head, mk;
        if (kind === 'name') {
          head = `<span style="font-size:22px">${F.esc(F.tt({ de: 'Wie heisst dieses Gerät?', en: 'What is this called?' }))}</span>${pic(id, 130)}`;
          mk = (o) => `<span style="font-size:21px;line-height:1.2;padding:4px;word-break:normal;overflow-wrap:anywhere">${F.esc(F.tt(ITEMS[o].name))}</span>`;
        } else if (kind === 'pic') {
          head = `<span style="font-size:26px">${F.esc(F.tt(ITEMS[id].name))}</span>`;
          mk = (o) => pic(o, 104);
        } else {
          const job = r.pick(JOBS[id])(r);
          head = `<span style="font-size:21px;line-height:1.25">${F.esc(F.tt({ de: 'Was brauchst du dafür?', en: 'What do you need for this?' }))}<br><b>${F.esc(F.tt(job))}</b></span>`;
          mk = (o) => pic(o, 104);
        }
        ctx.el.innerHTML = '';
        const card = F.h(`<div class="card sketch pop-in" style="margin:6px 0 14px;padding:14px 12px;display:flex;align-items:center;justify-content:center;gap:16px;text-align:center;min-height:${kind === 'name' ? 170 : 110}px;background:var(--c-chem);transform:rotate(-0.5deg)">${head}</div>`);
        const box = F.h('<div class="options" style="grid-template-columns:repeat(2,minmax(0,1fr));gap:14px"></div>');
        let locked = false;
        opts.forEach((o) => {
          const b = F.h(`<button class="opt" style="min-width:0;padding:8px;display:flex;align-items:center;justify-content:center;min-height:${kind === 'name' ? 124 : 150}px">${mk(o)}</button>`);
          b.addEventListener('pointerdown', async (e) => {
            e.preventDefault();
            if (locked) return; locked = true;
            const ok = o === id;
            b.classList.add(ok ? 'flash-ok' : 'flash-bad'); ctx.sfx(ok ? 'good' : 'bad');
            if (ok) { right++; ctx.setScore(right * 10); } else [...box.children].forEach((x, i) => { if (opts[i] === id) x.classList.add('flash-ok'); });
            await ctx.wait(ok ? 650 : 1300);
            next();
          });
          box.appendChild(b);
        });
        ctx.el.append(card, box);
      }

      function end() {
        if (right >= 8) { ctx.sfx('win'); F.cheer(10); }
        ctx.finish({
          score: right * 10, detail: F.tt({ de: `${right} von ${QUESTIONS} richtig`, en: `${right} of ${QUESTIONS} right` }),
          levelDelta: right >= 9 ? 1 : right <= 4 ? -1 : 0, quality: right / QUESTIONS, ink: 3 + right * 2,
        });
      }
      next();
    },
  });
})();
