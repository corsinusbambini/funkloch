/* The companion doodle: drawn as SVG from species + seed + progress. */
(function () {
  const F = Funkloch;

  // Body outline, eye line, mouth line, top of head and where the antenna sits (viewBox 0 0 200 200).
  const SPECIES = {
    blob: {
      body: 'M55,165 C40,95 70,60 100,60 C130,60 160,95 145,165 Q100,182 55,165 Z',
      eyes: [84, 116, 110], eyeR: 6, mouthY: 132, topY: 62, earX: [52, 148], ant: [126, 66], feet: 170,
    },
    inkdrop: {
      body: 'M100,34 C120,70 152,98 152,128 A52,52 0 0 1 48,128 C48,98 80,70 100,34 Z',
      eyes: [84, 116, 122], eyeR: 6, mouthY: 143, topY: 52, earX: [50, 150], ant: [118, 66], feet: 178,
    },
    cat: {
      body: 'M52,92 L58,48 L84,72 Q100,67 116,72 L142,48 L148,92 C162,125 152,170 100,170 C48,170 38,125 52,92 Z',
      eyes: [82, 118, 108], eyeR: 6, mouthY: 126, topY: 70, earX: [47, 153], ant: [130, 64], feet: 172,
      extra: (ink) => `<path d="M100,120 l-5,-4 h10 z" fill="${ink}"/>
        <g stroke="${ink}" stroke-width="2" stroke-linecap="round" fill="none">
          <path d="M64,124 L42,120"/><path d="M64,130 L44,134"/><path d="M136,124 L158,120"/><path d="M136,130 L156,134"/></g>`,
    },
    axolotl: {
      body: 'M50,120 C50,80 75,68 100,68 C125,68 150,80 150,120 C150,155 128,170 100,170 C72,170 50,155 50,120 Z',
      eyes: [78, 122, 108], eyeR: 6, mouthY: 128, topY: 70, earX: [50, 150], ant: [128, 74], feet: 172,
      behind: (ink, c) => `<g stroke="${c.cheek}" stroke-width="7" stroke-linecap="round" fill="none">
          <path d="M56,92 Q36,74 30,62"/><path d="M52,106 Q28,100 18,92"/><path d="M53,122 Q30,126 22,122"/>
          <path d="M144,92 Q164,74 170,62"/><path d="M148,106 Q172,100 182,92"/><path d="M147,122 Q170,126 178,122"/></g>`,
    },
    owl: {
      body: 'M58,170 C40,140 42,80 60,62 L66,40 L84,58 Q100,54 116,58 L134,40 L140,62 C158,80 160,140 142,170 Q100,182 58,170 Z',
      eyes: [82, 118, 96], eyeR: 7, mouthY: 122, topY: 58, earX: [45, 155], ant: [132, 50], feet: 174, owl: true,
      extra: (ink, c, stage) => `<ellipse cx="100" cy="142" rx="30" ry="24" fill="${stage >= 2 ? 'rgba(255,255,255,.45)' : 'none'}" stroke="${ink}" stroke-width="2" stroke-dasharray="${stage === 0 ? '4 3' : '0'}"/>
        <circle cx="82" cy="96" r="15" fill="${stage >= 2 ? 'rgba(255,255,255,.55)' : 'none'}" stroke="${ink}" stroke-width="2"/>
        <circle cx="118" cy="96" r="15" fill="${stage >= 2 ? 'rgba(255,255,255,.55)' : 'none'}" stroke="${ink}" stroke-width="2"/>
        <path d="M95,110 L105,110 L100,119 Z" fill="${stage >= 2 ? '#F2B84B' : 'none'}" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`,
    },
  };
  F.SPECIES = Object.keys(SPECIES);

  const PALETTES = [
    { body: '#FFC9B0', cheek: '#FF9A9A' }, { body: '#B9E6C9', cheek: '#6FBF8C' }, { body: '#CFC2F2', cheek: '#A08BE0' },
    { body: '#B5D8F5', cheek: '#7FB2E5' }, { body: '#FFE08A', cheek: '#F2A94B' }, { body: '#F8C3DD', cheek: '#EE8FBC' },
    { body: '#A8E0D6', cheek: '#5FBFAE' },
  ];
  F.PERSONALITIES = ['cheeky', 'shy', 'dramatic'];

  // Art style grows with total XP.
  F.STAGE_XP = [0, 120, 450, 1300];
  F.buddyStage = (xp = F.totalXp()) => (xp >= F.STAGE_XP[3] ? 3 : xp >= F.STAGE_XP[2] ? 2 : xp >= F.STAGE_XP[1] ? 1 : 0);

  // Traits unlock per skill.
  F.TRAIT_XP = 60;
  F.TRAITS = ['memory', 'math', 'chem', 'focus', 'spatial', 'logic'];
  F.buddyTraits = () => F.TRAITS.filter((s) => (F.data.xp[s] || 0) >= F.TRAIT_XP);

  F.SHOP = [
    { id: 'flower', slot: 'side', price: 30, icon: '🌸' },
    { id: 'leaf', slot: 'side', price: 30, icon: '🍃' },
    { id: 'bow', slot: 'side', price: 45, icon: '🎀' },
    { id: 'scarf', slot: 'neck', price: 70, icon: '🧣' },
    { id: 'party', slot: 'top', price: 60, icon: '🥳' },
    { id: 'crown', slot: 'top', price: 150, icon: '👑' },
    { id: 'shades', slot: 'eyes', price: 80, icon: '😎' },
    { id: 'phones', slot: 'ears', price: 90, icon: '🎧' },
    { id: 'wings', slot: 'back', price: 120, icon: '🕊️' },
  ];

  const ACC = {
    flower: (x, y) => `<g transform="translate(${x},${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-9" rx="6" ry="9" fill="#F8A5C8" stroke="currentColor" stroke-width="1.6" transform="rotate(${a})"/>`).join('')}<circle r="5" fill="#FFD66B" stroke="currentColor" stroke-width="1.6"/></g>`,
    leaf: (x, y) => `<g transform="translate(${x},${y}) rotate(-30)"><path d="M0,10 C-12,0 -8,-16 0,-20 C8,-16 12,0 0,10 Z" fill="#8FD18F" stroke="currentColor" stroke-width="1.8"/><path d="M0,10 L0,-16" stroke="currentColor" stroke-width="1.5"/></g>`,
    bow: (x, y) => `<g transform="translate(${x},${y})"><path d="M0,0 L-15,-9 L-15,9 Z M0,0 L15,-9 L15,9 Z" fill="#F07C8C" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle r="4" fill="#F07C8C" stroke="currentColor" stroke-width="1.8"/></g>`,
    party: (x, y) => `<g transform="translate(${x},${y})"><path d="M-17,4 L0,-38 L17,4 Z" fill="#B5D8F5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M-10,-12 L8,-4 M-5,-26 L5,-22" stroke="#F07C8C" stroke-width="3"/><circle cx="0" cy="-40" r="5" fill="#FFD66B" stroke="currentColor" stroke-width="1.6"/></g>`,
    crown: (x, y) => `<g transform="translate(${x},${y})"><path d="M-22,4 L-22,-16 L-11,-6 L0,-22 L11,-6 L22,-16 L22,4 Z" fill="#FFD66B" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="0" cy="-6" r="3" fill="#F07C8C"/></g>`,
  };

  const pick = (seed) => F.rng(seed);

  /**
   * opts: { species, seed, mood: happy|cheer|sad|sleep|cover|wow, stage, traits, wearing, cls, sketchy }
   */
  F.companionSVG = function (opts = {}) {
    const c = F.data.companion || {};
    const species = opts.species || c.species || 'blob';
    const sp = SPECIES[species];
    const seed = opts.seed != null ? opts.seed : c.seed || 1;
    const r = pick(seed);
    const pal = PALETTES[Math.floor(r() * PALETTES.length)];
    const stage = opts.stage != null ? opts.stage : F.buddyStage();
    const traits = opts.traits || (F.data.companion ? F.buddyTraits() : []);
    const wearing = opts.wearing || F.data.wearing || [];
    const mood = opts.mood || 'happy';
    const ink = 'currentColor';
    const [ex1, ex2, ey] = sp.eyes;
    const er = sp.eyeR * (traits.includes('memory') ? 1.35 : 1);
    const sw = stage === 0 ? 2 : 3;

    const fill = stage === 0 ? 'none' : stage === 1 ? 'var(--card)' : pal.body;
    const dash = stage === 0 ? 'stroke-dasharray="5 3"' : '';
    let s = `<svg class="companion ${opts.cls || ''}" viewBox="0 0 200 200" style="color:${stage === 0 ? 'var(--ink-soft)' : 'var(--ink)'}">`;

    if (sp.behind) s += sp.behind(ink, stage >= 2 ? pal : { cheek: stage === 0 ? 'none' : 'var(--ink-faint)' });
    if (traits.includes('focus')) {
      const [ax, ay] = sp.ant;
      s += `<path d="M${ax},${ay + 8} Q${ax + 6},${ay - 10} ${ax + 12},${ay - 22}" fill="none" stroke="${ink}" stroke-width="2.5"/>
        <circle cx="${ax + 12}" cy="${ay - 26}" r="7" fill="#FFD66B" stroke="${ink}" stroke-width="2"/>`;
    }
    if (wearing.includes('wings')) {
      const y0 = species === 'axolotl' ? 150 : species === 'inkdrop' ? 135 : 125;
      const wing = 'M0,0 C-14,-30 -34,-44 -50,-46 C-44,-34 -46,-26 -38,-18 C-42,-10 -38,-2 -30,4 C-30,12 -18,16 -8,14 Z';
      const feathers = 'M-12,-6 C-24,-14 -32,-24 -40,-34 M-10,2 C-22,-2 -30,-8 -34,-14';
      const w = `<path d="${wing}" fill="#FFFFFF" fill-opacity=".92" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/><path d="${feathers}" fill="none" stroke="${ink}" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>`;
      s += `<g transform="translate(${sp.earX[0] + 10},${y0})">${w}</g><g transform="translate(${sp.earX[1] - 10},${y0}) scale(-1,1)">${w}</g>`;
    }
    // feet
    s += `<ellipse cx="80" cy="${sp.feet}" rx="13" ry="6" fill="${stage >= 2 ? pal.cheek : 'none'}" stroke="${ink}" stroke-width="${sw}" ${dash}/>
      <ellipse cx="120" cy="${sp.feet}" rx="13" ry="6" fill="${stage >= 2 ? pal.cheek : 'none'}" stroke="${ink}" stroke-width="${sw}" ${dash}/>`;
    s += `<path d="${sp.body}" fill="${fill}" stroke="${ink}" stroke-width="${sw}" stroke-linejoin="round" ${dash}/>`;
    if (stage === 0) s += `<path d="${sp.body}" fill="none" stroke="${ink}" stroke-width="1" opacity=".45" transform="translate(2.5,-2) rotate(1.2 100 110)"/>`;
    if (stage === 3) {
      // watercolour blooms
      const r2 = pick(seed + 7);
      for (let i = 0; i < 5; i++) s += `<circle cx="${70 + r2() * 60}" cy="${95 + r2() * 60}" r="${10 + r2() * 14}" fill="${pal.cheek}" opacity=".22"/>`;
    }
    if (sp.extra) s += sp.extra(ink, pal, stage);
    if (stage >= 2) s += `<circle cx="${ex1 - 8}" cy="${ey + 16}" r="7" fill="${pal.cheek}" opacity=".85"/><circle cx="${ex2 + 8}" cy="${ey + 16}" r="7" fill="${pal.cheek}" opacity=".85"/>`;

    // eyes
    if (mood === 'cover') {
      s += `<ellipse cx="${ex1}" cy="${ey}" rx="16" ry="11" fill="${stage >= 2 ? pal.body : 'var(--card)'}" stroke="${ink}" stroke-width="2.5"/>
        <ellipse cx="${ex2}" cy="${ey}" rx="16" ry="11" fill="${stage >= 2 ? pal.body : 'var(--card)'}" stroke="${ink}" stroke-width="2.5"/>`;
    } else if (mood === 'sleep') {
      s += `<path d="M${ex1 - 7},${ey} q7,5 14,0 M${ex2 - 7},${ey} q7,5 14,0" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>
        <text x="150" y="58" font-size="22" fill="${ink}" font-family="inherit">z</text><text x="164" y="40" font-size="16" fill="${ink}" font-family="inherit">z</text>`;
    } else if (mood === 'cheer') {
      s += `<path d="M${ex1 - 7},${ey + 3} q7,-9 14,0 M${ex2 - 7},${ey + 3} q7,-9 14,0" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>`;
    } else {
      const rr = mood === 'wow' ? er * 1.3 : er;
      s += `<circle cx="${ex1}" cy="${ey}" r="${rr}" fill="${ink}"/><circle cx="${ex2}" cy="${ey}" r="${rr}" fill="${ink}"/>`;
      if (stage >= 1) s += `<circle cx="${ex1 + rr * 0.35}" cy="${ey - rr * 0.35}" r="${rr * 0.32}" fill="#fff"/><circle cx="${ex2 + rr * 0.35}" cy="${ey - rr * 0.35}" r="${rr * 0.32}" fill="#fff"/>`;
    }
    if (traits.includes('math') && mood !== 'cover') {
      const gr = Math.max(13, er + 7);
      s += `<g fill="none" stroke="${ink}" stroke-width="2.5"><circle cx="${ex1}" cy="${ey}" r="${gr}"/><circle cx="${ex2}" cy="${ey}" r="${gr}"/>
        <path d="M${ex1 + gr},${ey} Q100,${ey - 6} ${ex2 - gr},${ey}"/></g>`;
    }
    if (traits.includes('chem')) {
      s += `<rect x="64" y="${ey - 36}" width="72" height="16" rx="8" fill="#9ED8DB" stroke="${ink}" stroke-width="2.5"/>
        <circle cx="86" cy="${ey - 28}" r="5" fill="#fff" opacity=".7"/><circle cx="114" cy="${ey - 28}" r="5" fill="#fff" opacity=".7"/>`;
    }
    // mouth
    const my = sp.mouthY;
    if (mood === 'cheer' || mood === 'wow') s += `<path d="M90,${my - 2} Q100,${my + 16} 110,${my - 2} Z" fill="${ink}"/>`;
    else if (mood === 'sad') s += `<path d="M90,${my + 6} Q100,${my - 4} 110,${my + 6}" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`;
    else if (mood === 'sleep') s += `<circle cx="100" cy="${my + 2}" r="3.5" fill="none" stroke="${ink}" stroke-width="2"/>`;
    else s += `<path d="M90,${my} Q100,${my + 10} 110,${my}" fill="none" stroke="${ink}" stroke-width="2.5" stroke-linecap="round"/>`;

    if (traits.includes('spatial')) s += `<path d="M66,140 l4,9 l10,1 l-8,6 l3,10 l-9,-6 l-9,6 l3,-10 l-8,-6 l10,-1 z" fill="#FFE08A" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>`;
    const neck = wearing.includes('scarf');
    if (neck) s += `<path d="M62,${my + 16} Q100,${my + 32} 138,${my + 16} L138,${my + 28} Q100,${my + 44} 62,${my + 28} Z" fill="#F28C6B" stroke="${ink}" stroke-width="2.2"/>
      <path d="M122,${my + 32} L130,${my + 58} L116,${my + 58} Z" fill="#F28C6B" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>`;
    else if (traits.includes('logic')) s += `<path d="M100,${my + 24} L86,${my + 16} L86,${my + 32} Z M100,${my + 24} L114,${my + 16} L114,${my + 32} Z" fill="#CFC2F2" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>`;
    if (wearing.includes('shades')) {
      const lens = (cx) => `<rect x="${cx - 14}" y="${ey - 10}" width="28" height="21" rx="9" fill="#33405A" fill-opacity=".62" stroke="${ink}" stroke-width="2.4"/><path d="M${cx - 8},${ey - 5} l6,-1" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".7"/>`;
      s += `<g>${lens(ex1)}${lens(ex2)}<path d="M${ex1 + 14},${ey - 3} Q100,${ey - 8} ${ex2 - 14},${ey - 3}" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M${ex1 - 14},${ey - 3} l-8,-3 M${ex2 + 14},${ey - 3} l8,-3" stroke="${ink}" stroke-width="2.2" stroke-linecap="round"/></g>`;
    }
    if (wearing.includes('phones')) {
      const [lx, rx] = sp.earX, cy = sp.topY - 5, c1 = (cy - 0.25 * (ey - 4)) / 0.75;
      const band = `M${lx},${ey - 4} C${lx - 7},${c1} ${rx + 7},${c1} ${rx},${ey - 4}`;
      const cup = (cx) => `<rect x="${cx - 9}" y="${ey - 12}" width="18" height="30" rx="9" fill="#7FB2E5" stroke="${ink}" stroke-width="2.4"/><rect x="${cx - 4}" y="${ey - 6}" width="8" height="18" rx="4" fill="#fff" opacity=".35"/>`;
      s += `<g><path d="${band}" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round"/><path d="${band}" fill="none" stroke="#7FB2E5" stroke-width="3.6" stroke-linecap="round"/>${cup(lx)}${cup(rx)}</g>`;
    }
    // accessories
    const side = wearing.find((w) => ['flower', 'leaf', 'bow'].includes(w));
    if (side) s += ACC[side](200 - sp.ant[0] - 4, sp.ant[1] + 2);
    const top = wearing.find((w) => ['party', 'crown'].includes(w));
    if (top) s += ACC[top](100, sp.topY + (species === 'inkdrop' ? 16 : 4));
    return s + '</svg>';
  };

  // Ink blot for hatching; cracks grows 0..3.
  F.blotSVG = (cracks = 0) => {
    let s = `<svg class="hatch-blot" viewBox="0 0 200 200" style="color:var(--ink)">
      <path d="M100,28 C128,30 150,44 160,70 C178,78 182,104 168,120 C176,146 158,170 130,170 C116,186 86,184 74,170 C46,172 28,150 36,126 C20,108 26,80 46,72 C52,46 74,26 100,28 Z" fill="currentColor"/>
      <circle cx="176" cy="54" r="7" fill="currentColor"/><circle cx="22" cy="152" r="9" fill="currentColor"/><circle cx="168" cy="172" r="5" fill="currentColor"/><circle cx="40" cy="40" r="4" fill="currentColor"/>`;
    const lines = ['M100,60 L92,90 L108,108 L96,138', 'M60,100 L84,104 L92,90', 'M140,96 L118,112 L108,108 L124,140'];
    for (let i = 0; i < cracks; i++) s += `<path d="${lines[i]}" fill="none" stroke="var(--paper)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`;
    return s + '</svg>';
  };

  F.buddyLine = (kind) => {
    const c = F.data.companion;
    if (kind === 'greet') return F.t('greet.' + ((c && c.personality) || 'cheeky'));
    return F.t('react.' + kind);
  };
})();
