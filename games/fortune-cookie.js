/* Fortune Cookie: crack three cookies with taps and read the made-up fortunes inside. Pure fun, no daily challenge. */
(function () {
  const F = Funkloch;
  // Parts are index-aligned: the same index means the same idea in German and English.
  const TIME = [
    { de: 'Morgen', en: 'Tomorrow' }, { de: 'Bald', en: 'Soon' }, { de: 'Diese Woche', en: 'This week' },
    { de: 'Heute Abend', en: 'Tonight' }, { de: 'Im Frühling', en: 'In spring' }, { de: 'Überraschend bald', en: 'Sooner than you think' },
  ];
  const DEEDS = [
    { de: 'findest du', en: 'you will find', obj: [
      { de: 'einen silbernen Löffel', en: 'a silver spoon' }, { de: 'einen glatten Kieselstein', en: 'a smooth pebble' },
      { de: 'ein vierblättriges Kleeblatt', en: 'a four-leaf clover' }, { de: 'einen vergessenen Schatz', en: 'a forgotten treasure' } ] },
    { de: 'triffst du', en: 'you will meet', obj: [
      { de: 'einen freundlichen Riesen', en: 'a friendly giant' }, { de: 'eine kluge Katze', en: 'a clever cat' },
      { de: 'einen alten Freund', en: 'an old friend' }, { de: 'eine lachende Wolke', en: 'a laughing cloud' } ] },
    { de: 'erhältst du', en: 'you will receive', obj: [
      { de: 'ein warmes Lächeln', en: 'a warm smile' }, { de: 'einen geheimen Brief', en: 'a secret letter' },
      { de: 'eine gute Nachricht', en: 'good news' }, { de: 'einen goldenen Stern', en: 'a golden star' } ] },
    { de: 'kostest du', en: 'you will taste', obj: [
      { de: 'einen Löffel Sonnenschein', en: 'a spoonful of sunshine' }, { de: 'ein Stück Mondkuchen', en: 'a slice of moon cake' },
      { de: 'einen Tropfen Glück', en: 'a drop of luck' }, { de: 'eine Wolke Zuckerwatte', en: 'a cloud of candy floss' } ] },
    { de: 'entdeckst du', en: 'you will discover', obj: [
      { de: 'einen versteckten Weg', en: 'a hidden path' }, { de: 'eine neue Lieblingsmelodie', en: 'a new favourite tune' },
      { de: 'ein Rätsel mit Happy End', en: 'a riddle with a happy end' }, { de: 'einen Regenbogen im Kaffee', en: 'a rainbow in your cup' } ] },
  ];
  const TIPS = [
    { de: 'Tipp: Wer zuerst lächelt, gewinnt.', en: 'Tip: whoever smiles first wins.' },
    { de: 'Tipp: Heute lohnt sich ein Umweg.', en: 'Tip: today a detour pays off.' },
    { de: 'Tipp: Zähle nicht die Wolken, zähle die Sterne.', en: "Tip: don't count clouds, count stars." },
    { de: 'Tipp: Ein Rätsel ist nur ein Freund in Verkleidung.', en: 'Tip: a puzzle is just a friend in disguise.' },
    { de: 'Tipp: Kleine Schritte kommen auch an.', en: 'Tip: small steps arrive too.' },
    { de: 'Tipp: Trinke ein Glas Wasser, dann denke weiter.', en: 'Tip: drink a glass of water, then keep thinking.' },
  ];
  const CRACKS = 5;
  const FILLC = '#EFC27D';

  function cookieSVG(taps, open) {
    const L = 'M24,104 C20,60 70,30 120,52 C112,80 118,104 120,128 C90,150 40,140 24,104 Z';
    const R = 'M216,104 C222,60 170,30 120,52 C112,80 118,104 120,128 C150,150 200,140 216,104 Z';
    const common = `style="fill:${FILLC};stroke:var(--ink)" stroke-width="4" stroke-linejoin="round"`;
    const cracks = ['M120,52 l-7,10 l6,6', 'M120,128 l6,-12 l-5,-8', 'M120,90 l-8,4 l5,8', 'M120,70 l9,5 l-4,9', 'M120,110 l-9,-3 l4,-9'];
    const shade = '<path d="M44,112 C60,134 90,138 104,126 M196,112 C180,134 150,138 136,126" fill="none" stroke="#B9823A" stroke-width="3" stroke-linecap="round" opacity=".55"/><path d="M40,86 C46,66 64,52 84,50" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/>';
    const wob = taps ? `animation:tappop .22s ease-out` : '';
    if (!open) {
      return `<svg class="motif" viewBox="0 0 240 170" style="width:100%;max-width:330px;transform:rotate(-2deg);${wob}" stroke-linecap="round">
        <ellipse cx="120" cy="158" rx="90" ry="8" style="fill:var(--ink)" opacity=".12"/>
        <path d="${L}" ${common}/><path d="${R}" ${common}/>${shade}
        <path d="${cracks.slice(0, taps).join(' ')}" fill="none" style="stroke:var(--ink)" stroke-width="3" stroke-linejoin="round"/></svg>`;
    }
    return `<svg class="motif" viewBox="-20 0 280 170" style="width:100%;max-width:330px;transform:rotate(-2deg)" stroke-linecap="round">
      <ellipse cx="120" cy="158" rx="105" ry="8" style="fill:var(--ink)" opacity=".12"/>
      <rect x="92" y="62" width="56" height="30" rx="3" style="fill:var(--card);stroke:var(--ink)" stroke-width="3" transform="rotate(-6 120 77)"/><path d="M100,72 h40 M100,80 h30" style="stroke:var(--ink-soft)" stroke-width="2" transform="rotate(-6 120 77)"/>
      <g style="transform:translate(-22px,6px) rotate(-10deg);transform-origin:70px 100px;transition:transform .3s ease-out"><path d="${L}" ${common}/></g>
      <g style="transform:translate(22px,6px) rotate(10deg);transform-origin:170px 100px;transition:transform .3s ease-out"><path d="${R}" ${common}/></g>
      <path d="M14,34 l6,6 m0,-6 l-6,6 M214,24 l7,0 m-3.5,-3.5 l0,7 M196,52 l5,5 m0,-5 l-5,5" style="stroke:var(--accent)" stroke-width="3" fill="none"/></svg>`;
  }

  F.registerGame({
    id: 'fortune-cookie', skill: 'fun', added: '2026-11-13', glyph: '🥠', noDaily: true, noLevel: true,
    name: { de: 'Glückskeks', en: 'Fortune Cookie' },
    desc: {
      de: 'Tippe 5 Mal auf den Keks, bis er aufbricht, und lies, was im Zettel steht. Drei Kekse, drei erfundene Prophezeiungen und je drei Glückszahlen. Gewonnen hast du, wenn du alle drei Zettel eingesammelt hast. Je höher die Glückszahlen, desto mehr Punkte.',
      en: 'Tap the cookie 5 times until it cracks open and read the slip inside. Three cookies, three made-up fortunes and three lucky numbers each. You win by collecting all three slips. The higher the lucky numbers, the more points.',
    },
    start(ctx) {
      const r = ctx.rng, ROUNDS = 3;
      let round = 0, points = 0;
      const slips = [];

      function fortune() {
        const time = r.pick(TIME), deed = r.pick(DEEDS), obj = r.pick(deed.obj), tip = r.pick(TIPS);
        return {
          de: `${time.de} ${deed.de} ${obj.de}. ${tip.de}`,
          en: `${time.en} ${deed.en} ${obj.en}. ${tip.en}`,
          nums: [r.int(1, 9), r.int(1, 9), r.int(1, 9)],
        };
      }

      function next() {
        if (round >= ROUNDS) return end();
        round++;
        ctx.setInfo(`${round} / ${ROUNDS}`); ctx.setScore(points);
        const fo = ctx.fresh(fortune, (f) => f.en);
        let taps = 0, open = false;
        ctx.el.innerHTML = '';
        const hint = F.h('<div class="info-line" style="text-align:center;font-size:20px;margin-top:10px"></div>');
        const pot = F.h('<button style="display:block;width:100%;margin:6px auto 0;padding:70px 0 6px;transition:padding .25s;background:transparent;border:0;cursor:pointer;text-align:center"></button>');
        const dots = F.h('<div style="display:flex;justify-content:center;gap:10px;margin:6px 0 10px"></div>');
        const slip = F.h('<div></div>');
        const btn = F.h(`<button class="btn primary big" style="display:none;margin:12px auto 0;width:100%;max-width:340px">${F.tt({ de: 'Zettel einsammeln', en: 'Collect the slip' })}</button>`);
        ctx.el.appendChild(hint); ctx.el.appendChild(pot); ctx.el.appendChild(dots); ctx.el.appendChild(slip); ctx.el.appendChild(btn);
        function paint() {
          pot.innerHTML = cookieSVG(taps, open);
          dots.innerHTML = Array.from({ length: CRACKS }, (_, i) =>
            `<svg viewBox="0 0 20 20" width="22" height="22"><circle cx="10" cy="10" r="7" style="fill:${i < taps ? 'var(--accent)' : 'var(--card)'};stroke:var(--ink)" stroke-width="2.4"/></svg>`).join('');
          hint.textContent = open ? F.tt({ de: 'Es ist aufgebrochen!', en: 'It cracked open!' })
            : F.tt({ de: `Tippe auf den Keks (${CRACKS - taps} noch)`, en: `Tap the cookie (${CRACKS - taps} to go)` });
        }
        pot.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (open) return;
          taps++; ctx.sfx(taps >= CRACKS ? 'win' : 'tap');
          if (taps >= CRACKS) {
            open = true; pot.style.paddingTop = '14px';
            const luck = fo.nums.reduce((a, b) => a + b, 0);
            points += luck; ctx.setScore(points);
            F.cheer(8);
            slip.innerHTML = `<div class="card sketch pop-in" style="margin:6px auto 0;max-width:350px;background:var(--card);padding:16px 16px 14px;transform:rotate(1deg)">
              <div style="font-size:21px;line-height:1.35;text-align:center">${F.esc(F.tt(fo))}</div>
              <div style="display:flex;justify-content:center;gap:12px;margin-top:12px">${fo.nums.map((n) => `<span style="width:46px;height:46px;border:3px solid var(--ink);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:24px;background:var(--c-math)">${n}</span>`).join('')}</div>
              <div class="muted" style="text-align:center;margin-top:8px;font-size:16px">${F.tt({ de: 'Glückszahlen', en: 'Lucky numbers' })}: +${luck}</div></div>`;
            btn.style.display = 'block';
          }
          paint();
        });
        btn.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          if (!open || btn.disabled) return;
          btn.disabled = true; slips.push(fo); ctx.sfx('good');
          next();
        });
        paint();
      }

      function end() {
        ctx.finish({
          score: points, noRecord: false,
          detail: F.tt({ de: `${slips.length} Zettel gesammelt`, en: `${slips.length} slips collected` }),
          quality: 0.9, ink: 8,
        });
      }
      next();
    },
  });
})();
