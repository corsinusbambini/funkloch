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
    { id: 'balloon', slot: 'held', price: 55, icon: '🎈' },
    { id: 'moustache', slot: 'face', price: 65, icon: '🥸' },
    { id: 'halo', slot: 'halo', price: 100, icon: '😇' },
    { id: 'freckles', slot: 'freckles', price: 40, icon: '🟤' },
    { id: 'eyepatch', slot: 'eyes', price: 50, icon: '🏴‍☠️' },
    { id: 'mushroom', slot: 'ground', price: 45, icon: '🍄' },
    { id: 'bandana', slot: 'brow', price: 55, icon: '🔴' },
    { id: 'plaster', slot: 'plaster', price: 35, icon: '🩹' },
    { id: 'butterfly', slot: 'flutter', price: 75, icon: '🦋' },
    { id: 'monocle', slot: 'monocle', price: 85, icon: '🧐' },
    { id: 'lollipop', slot: 'sweet', price: 40, icon: '🍭' },
    { id: 'sparkle', slot: 'sparkle', price: 65, icon: '✨' },
    { id: 'hearts', slot: 'hearts', price: 50, icon: '💕' },
    { id: 'medal', slot: 'medal', price: 75, icon: '🏅' },
    { id: 'snail', slot: 'critter', price: 60, icon: '🐌' },
    { id: 'bubbles', slot: 'bubbles', price: 45, icon: '🫧' },
    { id: 'notes', slot: 'music', price: 55, icon: '🎵' },
    { id: 'cloud', slot: 'weather', price: 50, icon: '☁️' },
    { id: 'sun', slot: 'sun', price: 55, icon: '☀️' },
    { id: 'bird', slot: 'bird', price: 60, icon: '🐦' },
    { id: 'bowtie', slot: 'tie', price: 50, icon: '🎩' },
    { id: 'chef', slot: 'top', price: 70, icon: '👨‍🍳' },
    { id: 'ball', slot: 'ball', price: 55, icon: '⚽' },
    { id: 'umbrella', slot: 'umbrella', price: 65, icon: '☂️' },
    { id: 'icecream', slot: 'icecream', price: 60, icon: '🍦' },
    { id: 'boots', slot: 'boots', price: 70, icon: '🥾' },
    { id: 'kite', slot: 'kite', price: 65, icon: '🪁' },
    { id: 'cupcake', slot: 'cake', price: 55, icon: '🧁' },
    { id: 'lantern', slot: 'lamp', price: 60, icon: '🏮' },
    { id: 'guitar', slot: 'guitar', price: 75, icon: '🎸' },
    { id: 'cactus', slot: 'plant', price: 50, icon: '🌵' },
    { id: 'books', slot: 'books', price: 55, icon: '📚' },
    { id: 'palette', slot: 'paint', price: 65, icon: '🎨' },
  ];

  const ACC = {
    flower: (x, y) => `<g transform="translate(${x},${y})">${[0, 72, 144, 216, 288].map((a) => `<ellipse cx="0" cy="-9" rx="6" ry="9" fill="#F8A5C8" stroke="currentColor" stroke-width="1.6" transform="rotate(${a})"/>`).join('')}<circle r="5" fill="#FFD66B" stroke="currentColor" stroke-width="1.6"/></g>`,
    leaf: (x, y) => `<g transform="translate(${x},${y}) rotate(-30)"><path d="M0,10 C-12,0 -8,-16 0,-20 C8,-16 12,0 0,10 Z" fill="#8FD18F" stroke="currentColor" stroke-width="1.8"/><path d="M0,10 L0,-16" stroke="currentColor" stroke-width="1.5"/></g>`,
    bow: (x, y) => `<g transform="translate(${x},${y})"><path d="M0,0 L-15,-9 L-15,9 Z M0,0 L15,-9 L15,9 Z" fill="#F07C8C" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><circle r="4" fill="#F07C8C" stroke="currentColor" stroke-width="1.8"/></g>`,
    party: (x, y) => `<g transform="translate(${x},${y})"><path d="M-17,4 L0,-38 L17,4 Z" fill="#B5D8F5" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M-10,-12 L8,-4 M-5,-26 L5,-22" stroke="#F07C8C" stroke-width="3"/><circle cx="0" cy="-40" r="5" fill="#FFD66B" stroke="currentColor" stroke-width="1.6"/></g>`,
    chef: (x, y) => `<g transform="translate(${x},${y})"><path d="M-17,-4 C-30,-6 -28,-26 -14,-24 C-12,-38 12,-38 14,-24 C28,-26 30,-6 17,-4 Z" fill="#FFFDF8" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/><path d="M-9,-8 C-12,-16 -11,-22 -7,-26 M4,-9 C2,-18 4,-24 8,-28" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".35"/><path d="M-14,-30 q4,-5 10,-5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".9"/><rect x="-18" y="-5" width="36" height="11" rx="3" fill="#E9E3D6" stroke="currentColor" stroke-width="2.2"/><path d="M-10,-1 h20" stroke="currentColor" stroke-width="1.3" opacity=".4"/></g>`,
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
    if (wearing.includes('eyepatch')) {
      const hx = sp.earX[0] + 6, hy = sp.topY + 10, ex = sp.earX[1] - 6;
      s += `<g><path d="M${hx},${ey - 14} L${ex},${ey - 26}" fill="none" stroke="${ink}" stroke-width="3" stroke-linecap="round"/>
        <path d="M${ex1 - 15},${ey - 6} Q${ex1 - 14},${ey - 17} ${ex1},${ey - 17} Q${ex1 + 15},${ey - 17} ${ex1 + 15},${ey - 4} Q${ex1 + 13},${ey + 14} ${ex1},${ey + 14} Q${ex1 - 14},${ey + 14} ${ex1 - 15},${ey - 6} Z" fill="#3A3340" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M${ex1 - 7},${ey - 8} q4,-4 9,-3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".5"/></g>`;
    }
    if (wearing.includes('phones')) {
      const [lx, rx] = sp.earX, cy = sp.topY - 5, c1 = (cy - 0.25 * (ey - 4)) / 0.75;
      const band = `M${lx},${ey - 4} C${lx - 7},${c1} ${rx + 7},${c1} ${rx},${ey - 4}`;
      const cup = (cx) => `<rect x="${cx - 9}" y="${ey - 12}" width="18" height="30" rx="9" fill="#7FB2E5" stroke="${ink}" stroke-width="2.4"/><rect x="${cx - 4}" y="${ey - 6}" width="8" height="18" rx="4" fill="#fff" opacity=".35"/>`;
      s += `<g><path d="${band}" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round"/><path d="${band}" fill="none" stroke="#7FB2E5" stroke-width="3.6" stroke-linecap="round"/>${cup(lx)}${cup(rx)}</g>`;
    }
    if (wearing.includes('balloon')) {
      const bx = Math.min(sp.earX[1] + 20, 176), bt = 62;
      s += `<path d="M${sp.earX[1] - 6},${sp.feet - 36} Q${bx - 14},${bt + 60} ${bx},${bt + 22}" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>
        <ellipse cx="${bx}" cy="${bt}" rx="15" ry="19" fill="#F07C8C" stroke="${ink}" stroke-width="2.2"/>
        <path d="M${bx - 4},${bt + 19} l4,6 l4,-6 z" fill="#F07C8C" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M${bx - 8},${bt - 8} q2,-6 7,-8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>`;
    }
    if (wearing.includes('moustache')) {
      const my2 = my - 5, half = 'M0,3 C-7,-6 -22,-7 -31,-1 C-35,3 -32,9 -26,8 C-22,4 -17,3 -11,5 C-6,6 -2,6 0,5';
      s += `<g transform="translate(100,${my2})" fill="#6B4A3A" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"><path d="${half} Z"/><path d="${half} Z" transform="scale(-1,1)"/></g>`;
    }
    if (wearing.includes('freckles')) {
      const dots = (cx, sgn) => [[0, 12], [sgn * 8, 8], [sgn * 8, 18], [sgn * 16, 13], [sgn * 2, 22]].map(([dx, dy]) => `<circle cx="${cx + dx}" cy="${ey + dy}" r="1.9"/>`).join('');
      s += `<g fill="#8A5238" stroke="none" opacity=".92">${dots(ex1 - 4, -1)}${dots(ex2 + 4, 1)}</g>`;
    }
    if (wearing.includes('mushroom')) {
      const mx = species === 'inkdrop' ? 26 : 28, my3 = sp.feet + 8;
      s += `<g transform="translate(${mx},${my3})"><path d="M-5,0 C-6,-8 -5,-12 -4,-14 L4,-14 C5,-12 6,-8 5,0 Z" fill="#FFF3DC" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M-17,-13 C-17,-33 17,-33 17,-13 Z" fill="#E8574F" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>
        <circle cx="-7" cy="-21" r="3" fill="#fff"/><circle cx="5" cy="-26" r="2.6" fill="#fff"/><circle cx="9" cy="-18" r="2" fill="#fff"/></g>`;
    }
    if (wearing.includes('bandana')) {
      const y1 = ey - 31, y2 = ey - 19, rx2 = sp.earX[1] - 2;
      s += `<g><clipPath id="bandana-clip-${species}"><path d="${sp.body}"/></clipPath>
        <g clip-path="url(#bandana-clip-${species})"><rect x="30" y="${y1}" width="140" height="${y2 - y1}" fill="#E8574F"/>
        ${[58, 76, 94, 112, 130, 148].map((x, i) => `<circle cx="${x}" cy="${y1 + (i % 2 ? 8.5 : 3.5)}" r="1.8" fill="#fff"/>`).join('')}
        <path d="M30,${y1} H170 M30,${y2} H170" stroke="${ink}" stroke-width="2.2"/></g>
        <path d="M${rx2},${y1 + 3} L${rx2 + 16},${y1 - 4} L${rx2 + 12},${y1 + 8} L${rx2 + 20},${y1 + 14} L${rx2 + 5},${y2 + 1} Z" fill="#E8574F" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/></g>`;
    }
    if (wearing.includes('plaster')) {
      const pxx = ex2 + 2, pyy = ey + 17;
      s += `<g transform="translate(${pxx},${pyy}) rotate(-28)"><rect x="-13" y="-5.5" width="26" height="11" rx="5.5" fill="#F3C9A0" stroke="${ink}" stroke-width="2"/>
        <rect x="-5" y="-5.5" width="10" height="11" fill="#E5AE7E" stroke="${ink}" stroke-width="1.4"/><circle cx="-9" cy="0" r="1" fill="${ink}" opacity=".5"/><circle cx="9" cy="0" r="1" fill="${ink}" opacity=".5"/></g>`;
    }
    if (wearing.includes('butterfly')) {
      const bx = Math.max(24, sp.earX[0] - 8), by = sp.topY + 30;
      const wing = (sg) => `<path d="M0,0 C${sg * 6},-16 ${sg * 20},-18 ${sg * 20},-8 C${sg * 20},-2 ${sg * 8},2 0,0 Z M0,0 C${sg * 8},2 ${sg * 16},8 ${sg * 12},14 C${sg * 8},18 ${sg * 2},10 0,0 Z" fill="#B58CF0" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>`;
      s += `<g transform="translate(${bx},${by}) rotate(-15)">${wing(-1)}${wing(1)}<ellipse cx="0" cy="2" rx="2.4" ry="8" fill="${ink}"/><path d="M0,-6 Q-3,-13 -7,-14 M0,-6 Q3,-13 7,-14" fill="none" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/><circle cx="-10" cy="-8" r="2.2" fill="#FFE08A"/><circle cx="10" cy="-8" r="2.2" fill="#FFE08A"/></g>`;
    }
    if (wearing.includes('monocle')) {
      const mr = er + 9, mx = ex2, chx = mx + mr * 0.7, chy = ey + mr * 0.7;
      s += `<g><circle cx="${mx}" cy="${ey}" r="${mr}" fill="#fff" fill-opacity=".22" stroke="#D9A82E" stroke-width="3.6"/><circle cx="${mx}" cy="${ey}" r="${mr}" fill="none" stroke="${ink}" stroke-width="1.2" opacity=".6"/>
        <path d="M${mx - mr * 0.55},${ey - mr * 0.45} q4,-5 9,-6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>
        <path d="M${chx},${chy} q8,10 2,20 q-6,10 2,20" fill="none" stroke="#D9A82E" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 2.5"/></g>`;
    }
    if (wearing.includes('lollipop')) {
      const lx = 134, ly = my + 30;
      s += `<g><path d="M106,${my + 6} L${lx - 4},${ly + 4}" fill="none" stroke="${ink}" stroke-width="5" stroke-linecap="round"/><path d="M106,${my + 6} L${lx - 4},${ly + 4}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>
        <circle cx="${lx}" cy="${ly}" r="14" fill="#F07C8C" stroke="${ink}" stroke-width="2.2"/>
        <path d="M${lx},${ly} m0,-2 a2,2 0 1 1 -2,2 a5,5 0 1 1 5,5 a9,9 0 1 1 -9,-9" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/></g>`;
    }
    if (wearing.includes('sparkle')) {
      const star = (x, y, k, f) => `<path transform="translate(${x},${y}) scale(${k})" d="M0,-10 Q1.5,-1.5 10,0 Q1.5,1.5 0,10 Q-1.5,1.5 -10,0 Q-1.5,-1.5 0,-10 Z" fill="${f}" stroke="${ink}" stroke-width="${1.6 / k}" stroke-linejoin="round"/>`;
      s += `<g>${star(26, 40, 1.15, '#FFE08A')}${star(44, 20, 0.7, '#FFF3C4')}${star(176, 26, 1, '#FFE08A')}${star(158, 12, 0.6, '#FFF3C4')}${star(184, 112, 0.7, '#FFF3C4')}${star(18, 100, 0.65, '#FFF3C4')}</g>`;
    }
    if (wearing.includes('hearts')) {
      const heart = (x, y, k, f) => `<path transform="translate(${x},${y}) scale(${k})" d="M0,8 C-14,-2 -10,-14 -4,-12 C-1,-11 0,-8 0,-7 C0,-8 1,-11 4,-12 C10,-14 14,-2 0,8 Z" fill="${f}" stroke="${ink}" stroke-width="${1.8 / k}" stroke-linejoin="round"/>`;
      const hx = Math.min(sp.earX[1] - 6, 150), hy = sp.topY - 8;
      s += `<g>${heart(hx, hy, 1.3, '#F07C8C')}${heart(hx + 24, hy - 16, 0.9, '#F8A5C8')}${heart(hx - 18, hy - 22, 0.7, '#F8A5C8')}</g>`;
    }
    if (wearing.includes('medal')) {
      const mx = 100, my4 = Math.min(my + 38, sp.feet - 14);
      s += `<g><path d="M${mx - 9},${my4 - 18} L${mx - 2},${my4 - 4} M${mx + 9},${my4 - 18} L${mx + 2},${my4 - 4}" fill="none" stroke="${ink}" stroke-width="8" stroke-linecap="round"/>
        <path d="M${mx - 9},${my4 - 18} L${mx - 2},${my4 - 4}" fill="none" stroke="#E8574F" stroke-width="4.4" stroke-linecap="round"/><path d="M${mx + 9},${my4 - 18} L${mx + 2},${my4 - 4}" fill="none" stroke="#5B8FD6" stroke-width="4.4" stroke-linecap="round"/>
        <circle cx="${mx}" cy="${my4 + 2}" r="10" fill="#FFD66B" stroke="${ink}" stroke-width="2.2"/><circle cx="${mx}" cy="${my4 + 2}" r="6" fill="none" stroke="${ink}" stroke-width="1.3" opacity=".55"/>
        <path d="M${mx},${my4 - 2} l1.8,3.4 l3.8,.6 l-2.8,2.6 l.7,3.8 l-3.5,-1.8 l-3.5,1.8 l.7,-3.8 l-2.8,-2.6 l3.8,-.6 z" fill="#fff" stroke="${ink}" stroke-width="0.9" stroke-linejoin="round"/></g>`;
    }
    if (wearing.includes('snail')) {
      const sx = 172, sy = sp.feet + 8;
      s += `<g transform="translate(${sx},${sy})"><path d="M-15,0 C-17,-6 -12,-8 -8,-8 L9,-8 C14,-8 16,-4 14,0 Z" fill="#F2D2A6" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M12,-7 L14,-16 M16,-6 L20,-14" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/><circle cx="14" cy="-17" r="1.8" fill="${ink}"/><circle cx="20.5" cy="-15" r="1.8" fill="${ink}"/>
        <circle cx="-3" cy="-14" r="10" fill="#F4A261" stroke="${ink}" stroke-width="2.2"/>
        <path d="M-3,-14 m0,-1 a1.5,1.5 0 1 1 -1.5,1.5 a4.5,4.5 0 1 1 4.5,4.5 a7.5,7.5 0 1 1 -7.5,-7.5" fill="none" stroke="${ink}" stroke-width="1.5" stroke-linecap="round" opacity=".7"/></g>`;
    }
    if (wearing.includes('bubbles')) {
      const bub = (x, y, r) => `<g><circle cx="${x}" cy="${y}" r="${r}" fill="#BFE6F5" fill-opacity=".35" stroke="${ink}" stroke-width="1.8"/><path d="M${x - r * 0.55},${y - r * 0.1} a${r * 0.6},${r * 0.6} 0 0 1 ${r * 0.5},${-r * 0.5}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/><circle cx="${x + r * 0.4}" cy="${y + r * 0.45}" r="${r * 0.12}" fill="#fff"/></g>`;
      const bx = Math.min(sp.earX[1] + 14, 178);
      s += `<g>${bub(bx, 64, 13)}${bub(bx - 14, 92, 8)}${bub(bx + 2, 114, 5.5)}${bub(24, 76, 7)}</g>`;
    }
    if (wearing.includes('notes')) {
      s += `<g transform="translate(24,134)"><path d="M-3,9 L-3,-14 M17,5 L17,-18" fill="none" stroke="${ink}" stroke-width="2.6" stroke-linecap="round"/>
        <path d="M-3,-14 L17,-18 L17,-11 L-3,-7 Z" fill="${ink}" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>
        <ellipse cx="-8" cy="10" rx="7" ry="5" transform="rotate(-20 -8 10)" fill="#F07C8C" stroke="${ink}" stroke-width="2"/>
        <ellipse cx="12" cy="6" rx="7" ry="5" transform="rotate(-20 12 6)" fill="#7FB2E5" stroke="${ink}" stroke-width="2"/>
        <path d="M-14,-4 q-4,-4 -2,-9 M-18,2 q-5,-2 -6,-7" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round" opacity=".45"/></g>`;
    }
    if (wearing.includes('cloud')) {
      s += `<g transform="translate(36,28)"><path d="M-20,8 C-27,8 -27,-4 -18,-4 C-18,-14 -4,-18 2,-10 C8,-16 22,-10 20,0 C28,0 28,8 20,8 Z" fill="#E4EDF7" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M-12,2 q3,-4 8,-3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".85"/>
        <path d="M-12,13 l-2,7 M0,13 l-2,7 M12,13 l-2,7" fill="none" stroke="#5B8FD6" stroke-width="2.6" stroke-linecap="round"/></g>`;
    }
    if (wearing.includes('sun')) {
      const sx = 166, sy = 36, rays = Array.from({ length: 8 }, (_, i) => { const a = i * Math.PI / 4; return `M${(Math.cos(a) * 17).toFixed(1)},${(Math.sin(a) * 17).toFixed(1)} L${(Math.cos(a) * 25).toFixed(1)},${(Math.sin(a) * 25).toFixed(1)}`; }).join(' ');
      s += `<g transform="translate(${sx},${sy}) rotate(-8)"><path d="${rays}" fill="none" stroke="${ink}" stroke-width="7" stroke-linecap="round"/><path d="${rays}" fill="none" stroke="#FFB84A" stroke-width="3.4" stroke-linecap="round"/>
        <circle r="13.5" fill="#FFD66B" stroke="${ink}" stroke-width="2.4"/><path d="M-8,-6 q3,-5 8,-5" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".8"/>
        <circle cx="-4.5" cy="-1" r="1.6" fill="${ink}"/><circle cx="4.5" cy="-1" r="1.6" fill="${ink}"/><path d="M-4.5,4.5 q4.5,4 9,0" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/></g>`;
    }
    if (wearing.includes('bird')) {
      const bx = Math.min(sp.earX[1] + 14, 172), by = sp.topY + 38;
      s += `<g transform="translate(${bx},${by}) scale(-1,1)"><path d="M-6,13 l-3,8 M2,13 l-1,8" fill="none" stroke="#E08A2E" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M13,-2 C20,-5 24,-3 25,0 C22,3 18,4 13,3 Z" fill="#F5A83A" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/>
        <path d="M-17,6 C-20,-6 -14,-16 -3,-16 C7,-16 14,-8 13,2 C12,12 2,15 -8,14 C-12,19 -18,21 -22,20 C-19,16 -17,11 -17,6 Z" fill="#7FB2E5" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M-6,0 C-1,-4 7,-2 8,4 C4,10 -4,10 -8,6 Z" fill="#A9CFF2" stroke="${ink}" stroke-width="1.6" stroke-linejoin="round"/>
        <circle cx="6" cy="-6" r="2.3" fill="${ink}"/><circle cx="6.8" cy="-6.8" r=".8" fill="#fff"/><path d="M-12,-9 q4,-6 9,-6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".75"/></g>`;
    }
    if (wearing.includes('ball')) {
      s += `<g transform="translate(57,178) rotate(-14) scale(1.25)"><ellipse cx="2" cy="13" rx="14" ry="3" fill="${ink}" opacity=".18"/><circle r="14" fill="#FFFDF8" stroke="${ink}" stroke-width="2.4"/>
        <path d="M0,-6 L5.7,-1.9 L3.5,4.9 L-3.5,4.9 L-5.7,-1.9 Z" fill="${ink}" stroke="${ink}" stroke-width="1" stroke-linejoin="round"/>
        <path d="M0,-6 L0,-13.5 M5.7,-1.9 L12.5,-4.5 M3.5,4.9 L8,10.8 M-3.5,4.9 L-8,10.8 M-5.7,-1.9 L-12.5,-4.5" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>
        <path d="M-9,-8 q4,-5 9,-5.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".9"/></g>`;
    }
    if (wearing.includes('umbrella')) {
      s += `<g transform="translate(40,114) rotate(-10)"><path d="M0,-2 L0,50 q0,8 -8,8 q-5,0 -5,-5" fill="none" stroke="${ink}" stroke-width="6" stroke-linecap="round"/><path d="M0,-2 L0,50 q0,8 -8,8 q-5,0 -5,-5" fill="none" stroke="#B5703F" stroke-width="2.8" stroke-linecap="round"/>
        <path d="M-28,-2 C-28,-26 28,-26 28,-2 C22,-8 18,-8 14,-2 C9,-8 5,-8 0,-2 C-5,-8 -9,-8 -14,-2 C-18,-8 -22,-8 -28,-2 Z" fill="#E8574F" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M0,-2 C-4,-12 -4,-20 0,-24 M0,-2 C4,-12 4,-20 0,-24 M-14,-2 C-18,-10 -18,-16 -14,-20 M14,-2 C18,-10 18,-16 14,-20" fill="none" stroke="${ink}" stroke-width="1.4" opacity=".4"/>
        <path d="M-18,-14 q5,-7 12,-8" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".7"/><path d="M0,-24 v-6" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/></g>`;
    }
    if (wearing.includes('icecream')) {
      const ix = Math.min(sp.earX[1] + 10, 166);
      s += `<g transform="translate(${ix},128) rotate(12)"><path d="M-11,0 L11,0 L0,40 Z" fill="#E3B069" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M-6,6 L6,18 M6,6 L-6,18 M-3,24 L3,30" fill="none" stroke="${ink}" stroke-width="1.3" opacity=".45" stroke-linecap="round"/>
        <path d="M-14,2 C-18,-8 -8,-12 0,-10 C8,-12 18,-8 14,2 C8,6 -8,6 -14,2 Z" fill="#8FD9C8" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M-11,-8 C-16,-20 -6,-28 0,-26 C8,-30 17,-20 11,-8 C4,-4 -5,-4 -11,-8 Z" fill="#F8A5C8" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
        <circle cx="0" cy="-31" r="4" fill="#E8574F" stroke="${ink}" stroke-width="1.8"/>
        <path d="M-7,-22 q3,-5 8,-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></g>`;
    }
    if (wearing.includes('boots')) {
      const by = sp.feet - 2;
      const boot = (cx, flip) => `<g transform="translate(${cx},${by}) scale(${flip},1)"><path d="M-9,-20 L7,-20 L7,-8 C16,-7 17,4 12,6 L-14,6 C-17,6 -16,-4 -9,-6 Z" fill="#F2C94C" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M-9,-20 L7,-20 L7,-16 L-9,-16 Z" fill="#E8574F" stroke="${ink}" stroke-width="2" stroke-linejoin="round"/>
        <path d="M-14,3 L12,3" stroke="${ink}" stroke-width="2" stroke-linecap="round" opacity=".5"/><path d="M-5,-13 v6" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></g>`;
      s += boot(80, 1) + boot(120, -1);
    }
    if (wearing.includes('kite')) {
      const kx = 36, ky = 42;
      s += `<path d="M${kx + 4},${ky + 26} C${kx + 14},${ky + 52} ${sp.earX[0] - 8},${ky + 50} ${sp.earX[0] + 6},${sp.feet - 52}" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/>
        <g transform="translate(${kx},${ky}) rotate(-18)"><path d="M0,-24 L17,0 L0,28 L-17,0 Z" fill="#E8574F" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M0,-24 L17,0 L0,0 Z" fill="#F2C94C"/><path d="M0,28 L-17,0 L0,0 Z" fill="#5B9BE0"/><path d="M0,-24 L17,0 L0,28 L-17,0 Z" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M0,-24 L0,28 M-17,0 L17,0" stroke="${ink}" stroke-width="1.6" opacity=".7"/>
        <path d="M0,28 q-6,6 0,11 q6,5 0,11 M-4,37 l8,-3 M-4,46 l8,-3" fill="none" stroke="${ink}" stroke-width="1.8" stroke-linecap="round"/><path d="M-8,-8 q3,-8 9,-10" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".75"/></g>`;
    }
    if (wearing.includes('cupcake')) {
      const cx = 164, cy = sp.feet + 5;
      s += `<g transform="translate(${cx},${cy}) rotate(6) scale(1.3)"><ellipse cx="0" cy="1" rx="21" ry="5" fill="#FFFDF8" stroke="${ink}" stroke-width="2"/>
        <path d="M-15,-14 L15,-14 L11,-1 L-11,-1 Z" fill="#E3A56B" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M-7,-14 L-5,-1 M0,-14 L0,-1 M7,-14 L5,-1" stroke="${ink}" stroke-width="1.4" opacity=".5" stroke-linecap="round"/>
        <path d="M-18,-14 C-22,-22 -12,-26 -7,-24 C-8,-33 8,-33 7,-24 C13,-26 22,-22 18,-14 C8,-11 -8,-11 -18,-14 Z" fill="#F8A5C8" stroke="${ink}" stroke-width="2.2" stroke-linejoin="round"/>
        <path d="M-9,-20 q5,-3 11,-2 M-4,-28 q3,-3 7,-2" fill="none" stroke="${ink}" stroke-width="1.4" opacity=".45" stroke-linecap="round"/>
        <circle cx="1" cy="-36" r="4.5" fill="#E8574F" stroke="${ink}" stroke-width="1.8"/><path d="M1,-40 q2,-6 6,-7" fill="none" stroke="${ink}" stroke-width="1.6" stroke-linecap="round"/>
        <path d="M-13,-21 q3,-5 8,-6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".85"/>
        <circle cx="-3" cy="-17" r="1.1" fill="#fff"/><circle cx="9" cy="-19" r="1.1" fill="#8FD9C8"/><circle cx="-10" cy="-16" r="1.1" fill="#F2C94C"/></g>`;
    }
    if (wearing.includes('lantern')) {
      const lx2 = Math.min(sp.earX[1] + 22, 176), ly2 = 132;
      s += `<g transform="translate(${lx2 - 2},${ly2 + 4}) rotate(8) scale(1.22)"><path d="M-9,-22 C-9,-38 9,-38 9,-22" fill="none" stroke="${ink}" stroke-width="2.4" stroke-linecap="round"/>
        <rect x="-8" y="-24" width="16" height="6" rx="2" fill="#7A5A44" stroke="${ink}" stroke-width="2"/>
        <path d="M-17,-8 C-19,-18 -10,-19 0,-19 C10,-19 19,-18 17,-8 C19,6 10,13 0,13 C-10,13 -19,6 -17,-8 Z" fill="#FFB84A" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M0,-19 C-9,-8 -9,4 0,13 M0,-19 C9,-8 9,4 0,13" fill="none" stroke="${ink}" stroke-width="1.5" opacity=".55"/>
        <ellipse cx="0" cy="-3" rx="6" ry="8" fill="#FFF0B8" opacity=".85"/>
        <rect x="-8" y="12" width="16" height="6" rx="2" fill="#7A5A44" stroke="${ink}" stroke-width="2"/>
        <path d="M0,18 v10 M-3,28 h6 M-2,28 l-1.5,6 M2,28 l1.5,6" fill="none" stroke="#E8574F" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M-12,-12 q2,-6 7,-7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></g>`;
    }
    if (wearing.includes('guitar')) {
      s += `<g transform="translate(52,152) rotate(-18) scale(0.95)"><rect x="-4.5" y="-70" width="9" height="46" rx="2" fill="#8B5E3C" stroke="${ink}" stroke-width="2.2"/>
        <rect x="-7" y="-82" width="14" height="14" rx="3" fill="#6E452B" stroke="${ink}" stroke-width="2.2"/><circle cx="-9" cy="-77" r="2" fill="#FFD66B"/><circle cx="9" cy="-71" r="2" fill="#FFD66B"/>
        <circle cx="0" cy="-12" r="13" fill="#E3A56B" stroke="${ink}" stroke-width="2.4"/><circle cx="0" cy="12" r="17" fill="#E3A56B" stroke="${ink}" stroke-width="2.4"/>
        <ellipse cx="0" cy="-1" rx="12.5" ry="9" fill="#E3A56B"/>
        <circle cx="0" cy="3" r="6" fill="${ink}"/><rect x="-8" y="19" width="16" height="4" rx="2" fill="#6E452B" stroke="${ink}" stroke-width="1.6"/>
        <path d="M-1.5,-60 L-1.5,19 M1.5,-60 L1.5,19" stroke="${ink}" stroke-width="1" opacity=".6"/>
        <path d="M-9,-16 q3,-7 9,-8 M-11,8 q-1,8 5,13" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/></g>`;
    }
    if (wearing.includes('cactus')) {
      const kx = Math.max(30, sp.earX[0] - 12), ky = sp.feet + 6;
      s += `<g transform="translate(${kx},${ky}) scale(1.15)"><path d="M-16,-2 L16,-2 L12,-26 L-12,-26 Z" fill="#D9825B" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
        <rect x="-18" y="-32" width="36" height="9" rx="3" fill="#E89A74" stroke="${ink}" stroke-width="2.4"/>
        <path d="M-8,-33 L-8,-58 C-8,-66 8,-66 8,-58 L8,-33 Z" fill="#7CC38A" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
        <path d="M-8,-46 L-15,-46 C-19,-46 -19,-56 -15,-56 L-14,-56 M8,-42 L15,-42 C19,-42 19,-52 15,-52" fill="none" stroke="${ink}" stroke-width="5.4" stroke-linecap="round"/>
        <path d="M-8,-46 L-15,-46 C-19,-46 -19,-56 -15,-56 M8,-42 L15,-42 C19,-42 19,-52 15,-52" fill="none" stroke="#7CC38A" stroke-width="2.4" stroke-linecap="round"/>
        <path d="M0,-36 L0,-62 M-4,-38 v-18 M4,-38 v-18" fill="none" stroke="${ink}" stroke-width="1.2" opacity=".35"/>
        <path d="M-5,-60 l-2,-3 M5,-60 l2,-3 M-12,-58 l-2,-2" stroke="${ink}" stroke-width="1.4" stroke-linecap="round"/>
        <circle cx="0" cy="-67" r="4.6" fill="#F07C8C" stroke="${ink}" stroke-width="1.8"/><circle cx="0" cy="-67" r="1.6" fill="#FFD66B"/>
        <path d="M-5,-54 q1,-6 3,-8" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>`;
    }
    if (wearing.includes('books')) {
      const bx = Math.min(sp.earX[1] + 6, 168), by = sp.feet + 8;
      s += `<g transform="translate(${bx},${by}) rotate(-4) scale(1.2)"><rect x="-22" y="-12" width="44" height="12" rx="2.5" fill="#5B9BE0" stroke="${ink}" stroke-width="2.4"/>
        <rect x="-22" y="-12" width="9" height="12" fill="#3F78B8" stroke="${ink}" stroke-width="2.4"/><path d="M-7,-6 h22" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/>
        <g transform="rotate(3 0 -18)"><rect x="-19" y="-25" width="38" height="12" rx="2.5" fill="#E8574F" stroke="${ink}" stroke-width="2.4"/><rect x="10" y="-25" width="9" height="12" fill="#C23B33" stroke="${ink}" stroke-width="2.4"/><path d="M-14,-19 h18" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>
        <g transform="rotate(-5 0 -31)"><rect x="-16" y="-38" width="32" height="12" rx="2.5" fill="#F2C94C" stroke="${ink}" stroke-width="2.4"/><rect x="-16" y="-38" width="8" height="12" fill="#D9A92B" stroke="${ink}" stroke-width="2.4"/><path d="M-3,-32 h14" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".7"/></g>
        <path d="M6,-38 v-10 l4,3 l4,-3 v10" fill="#7CC38A" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/></g>`;
    }
    if (wearing.includes('palette')) {
      const px = Math.max(42, sp.earX[0] - 8), py = 140;
      s += `<g transform="translate(${px},${py}) rotate(-14) scale(1.15)"><path d="M-26,-4 C-28,-22 -6,-30 12,-24 C30,-18 32,2 20,10 C14,14 8,8 2,12 C-4,18 -12,22 -20,16 C-26,12 -26,4 -26,-4 Z" fill="#E3A56B" stroke="${ink}" stroke-width="2.6" stroke-linejoin="round"/>
        <circle cx="-4" cy="2" r="4.6" fill="${ink}" opacity=".85"/>
        <circle cx="-17" cy="-9" r="5" fill="#E8574F" stroke="${ink}" stroke-width="1.6"/><circle cx="-6" cy="-17" r="5" fill="#F2C94C" stroke="${ink}" stroke-width="1.6"/><circle cx="7" cy="-15" r="5" fill="#7CC38A" stroke="${ink}" stroke-width="1.6"/><circle cx="17" cy="-4" r="5" fill="#5B9BE0" stroke="${ink}" stroke-width="1.6"/><circle cx="-18" cy="6" r="5" fill="#B08CE8" stroke="${ink}" stroke-width="1.6"/>
        <path d="M-20,-20 q6,-6 12,-6" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".7"/>
        <g transform="translate(24,-22) rotate(32)"><rect x="-2.6" y="-6" width="5.2" height="34" rx="2.4" fill="#5B9BE0" stroke="${ink}" stroke-width="2"/><rect x="-3" y="-14" width="6" height="9" fill="#C9C9C9" stroke="${ink}" stroke-width="1.8"/><path d="M-3,-14 C-3,-26 3,-26 3,-14 Z" fill="#E8574F" stroke="${ink}" stroke-width="1.8" stroke-linejoin="round"/></g></g>`;
    }
    if (wearing.includes('bowtie')) {
      const ty = Math.min(my + 24, sp.feet - 20);
      s += `<g transform="translate(100,${ty})"><path d="M0,0 L-24,-13 C-27,-5 -27,5 -24,13 Z M0,0 L24,-13 C27,-5 27,5 24,13 Z" fill="#E8574F" stroke="${ink}" stroke-width="2.4" stroke-linejoin="round"/>
        <circle cx="-15" cy="-3" r="2" fill="#fff"/><circle cx="-16" cy="5" r="2" fill="#fff"/><circle cx="15" cy="-3" r="2" fill="#fff"/><circle cx="16" cy="5" r="2" fill="#fff"/>
        <path d="M-20,-8 q6,-3 12,-1 M20,-8 q-6,-3 -12,-1" fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>
        <rect x="-6" y="-7" width="12" height="14" rx="4" fill="#C23B33" stroke="${ink}" stroke-width="2.4"/><path d="M-2,-4 v6" stroke="#fff" stroke-width="1.8" stroke-linecap="round" opacity=".6"/></g>`;
    }
    if (wearing.includes('halo')) {
      const hy = sp.topY - (species === 'inkdrop' ? 26 : species === 'owl' ? 16 : 14);
      s += `<g><ellipse cx="100" cy="${hy}" rx="21" ry="6.5" fill="none" stroke="${ink}" stroke-width="7" opacity=".9"/><ellipse cx="100" cy="${hy}" rx="21" ry="6.5" fill="none" stroke="#FFD66B" stroke-width="3.8"/></g>`;
    }
    // accessories
    const side = wearing.find((w) => ['flower', 'leaf', 'bow'].includes(w));
    if (side) s += ACC[side](200 - sp.ant[0] - 4, sp.ant[1] + 2);
    const top = wearing.find((w) => ['party', 'crown', 'chef'].includes(w));
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
