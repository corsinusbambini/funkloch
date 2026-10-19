/* Screens: hatching, home, game runner, buddy, progress, settings. */
(function () {
  const F = Funkloch;
  const app = document.getElementById('app');
  const ACCENTS = ['#F28C6B', '#F2B84B', '#6FBF8C', '#5FBFAE', '#7FB2E5', '#A08BE0', '#EE8FBC'];
  const SKILL_ORDER = ['memory', 'math', 'logic', 'spatial', 'focus', 'chem', 'fun', 'duo'];
  const QUEST_INK = 15;
  let current = null; // running game context

  // ---------- Theme ----------
  F.applyTheme = () => {
    const d = document.documentElement, D = F.data;
    d.dataset.theme = D.theme; d.dataset.paper = D.paper; d.dataset.font = D.font;
    d.lang = D.lang;
    if (D.accent) d.style.setProperty('--accent', D.accent); else d.style.removeProperty('--accent');
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = getComputedStyle(d).getPropertyValue('--paper').trim() || '#FBF6EC';
  };

  // ---------- Quests ----------
  const ensureQuests = () => {
    if (F.data.quests && F.data.quests.date === F.today() && F.data.quests.items.every((q) => q.type !== 'play' || F.game(q.game))) return;
    const r = F.rng(F.daySeed('quests'));
    const pool = r.shuffle(F.games.filter((g) => g.id !== 'chaos' && g.players === 1));
    F.data.quests = {
      date: F.today(),
      items: [
        { type: 'play', game: pool[0].id, done: false },
        { type: 'play', game: pool[1].id, done: false },
        { type: 'chaos', n: r.int(8, 14), done: false },
      ],
    };
    F.save();
  };
  const questText = (q) => q.type === 'chaos' ? F.t('quest.chaos', { n: q.n }) : F.t('quest.play', { game: F.tt(F.game(q.game).name) });

  // ---------- Navigation ----------
  const nav = F.h('<nav class="nav"></nav>');
  document.body.appendChild(nav);
  const NAV = [['home', '✎'], ['buddy', '☺'], ['stats', '★'], ['settings', '⚙']];
  const drawNav = (on) => {
    nav.innerHTML = NAV.map(([id, ico]) => `<button data-go="${id}" class="${on === id ? 'on' : ''}"><span class="ico">${ico}</span>${F.t('nav.' + id)}</button>`).join('');
  };
  nav.addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });
  const showNav = (on) => { nav.classList.toggle('hidden', !on); app.classList.toggle('no-nav', !on); };

  function go(screen, arg) {
    if (current) { current.kill(); current = null; }
    window.scrollTo(0, 0);
    app.innerHTML = '';
    if (!F.data.companion) return hatch();
    const screens = { home, buddy, stats, settings, intro };
    (screens[screen] || home)(arg);
    if (screen !== 'intro') drawNav(screen);
  }
  F.go = go;

  const topbar = (title) => `<div class="topbar"><h1>${title}</h1><span class="ink-count sketch">${F.inkIcon}<b id="ink">${F.data.ink}</b></span></div>`;

  // ---------- Hatching ----------
  function hatch() {
    showNav(false);
    let taps = 0;
    const el = F.h(`<div class="center stack"><h2 style="margin-top:20px">${F.t('hatch.title')}</h2><div id="blot">${F.blotSVG(0)}</div><p class="muted" id="hint">${F.t('hatch.tap')}</p></div>`);
    app.appendChild(el);
    el.querySelector('#blot').addEventListener('pointerdown', () => {
      taps++;
      F.sfx(taps < 4 ? 'pop' : 'win');
      if (taps >= 4) return chooseSpecies();
      el.querySelector('#blot').innerHTML = F.blotSVG(taps);
      el.querySelector('.hatch-blot').classList.add('wiggle');
      el.querySelector('#hint').textContent = F.t(taps === 3 ? 'hatch.almost' : 'hatch.more');
    });
  }
  function chooseSpecies() {
    const seed = F.freshSeed();
    let chosen = 'blob';
    app.innerHTML = '';
    const el = F.h(`<div class="stack"><h2 class="center" style="margin-top:10px">${F.t('hatch.choose')}</h2><div class="species-grid"></div>
      <label class="field"><span id="nameq"></span><input type="text" maxlength="16" id="nm" placeholder="${F.t('hatch.namePh')}"></label>
      <button class="btn primary big" id="go">${F.t('hatch.go')}</button></div>`);
    const grid = el.querySelector('.species-grid');
    const draw = () => {
      grid.innerHTML = F.SPECIES.map((s) => `<div class="species-card sketch ${s === chosen ? 'on' : ''}" data-s="${s}">${F.companionSVG({ species: s, seed, stage: 2, traits: [], wearing: [], mood: s === chosen ? 'cheer' : 'happy' })}<div>${F.t('species.' + s)}</div></div>`).join('');
      el.querySelector('#nameq').textContent = F.t('hatch.name', { it: F.t('species.' + chosen) });
    };
    grid.addEventListener('click', (e) => { const c = e.target.closest('[data-s]'); if (c) { chosen = c.dataset.s; F.sfx('tap'); draw(); } });
    draw();
    el.querySelector('#go').addEventListener('click', () => {
      const name = el.querySelector('#nm').value.trim() || F.t('species.' + chosen);
      const r = F.rng(seed);
      F.data.companion = { species: chosen, seed, name, personality: r.pick(F.PERSONALITIES), born: Date.now() };
      F.save();
      F.sfx('win');
      go('home');
    });
    app.appendChild(el);
  }

  // ---------- Home ----------
  function home() {
    showNav(true);
    ensureQuests();
    const c = F.data.companion;
    const asleep = F.data.lastSeen && Date.now() - F.data.lastSeen > 10 * 3600e3;
    F.data.lastSeen = Date.now(); F.save();
    const el = F.h(`<div>${topbar('Funkloch')}
      <div class="companion-wrap"><div id="buddy">${F.companionSVG({ mood: asleep ? 'sleep' : 'happy' })}</div>
        <div class="bubble sketch" id="say">${F.esc(asleep ? F.t('react.sleep') : F.buddyLine('greet'))}</div></div>
      <button class="chaos-btn sketch" data-game="chaos"><span class="bolt">⚡</span><span><div class="t1">${F.t('home.chaos')}</div><div class="t2">${F.t('home.chaosSub')}</div></span></button>
      <div class="quests sketch alt"><h3>${F.t('home.quests')}</h3>${F.data.quests.items.map((q) => `<div class="quest ${q.done ? 'done' : ''}"><span class="box">${q.done ? '✓' : ''}</span><span class="grow">${questText(q)}</span><span class="muted">+${QUEST_INK}</span></div>`).join('')}</div>
      <div id="shelves"></div></div>`);
    const shelves = el.querySelector('#shelves');
    SKILL_ORDER.forEach((skill) => {
      const games = F.games.filter((g) => g.skill === skill && g.id !== 'chaos');
      if (!games.length) return;
      shelves.appendChild(F.h(`<div class="shelf-title"><span class="tag" style="background:var(--c-${skill})"></span>${F.t('skill.' + skill)}</div>`));
      const grid = F.h('<div class="game-grid"></div>');
      games.forEach((g) => {
        const gd = F.gameData(g.id);
        grid.appendChild(F.h(`<button class="game-card sketch" data-game="${g.id}">
          ${g.players === 2 ? '<span class="duo-tag">2</span>' : ''}
          <span class="glyph" style="background:var(--c-${skill})">${g.glyph}</span>
          <span><div class="name">${F.tt(g.name)}</div><div class="best">${!gd.plays ? '&nbsp;' : g.modes ? F.t('intro.played', { n: gd.plays }) : F.t('intro.best', { n: fmtBest(g, gd.best) })}</div></span></button>`));
      });
      shelves.appendChild(grid);
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-game]');
      if (b) { F.sfx('tap'); go('intro', b.dataset.game); }
    });
    el.querySelector('#buddy').addEventListener('click', () => {
      F.sfx('pop');
      el.querySelector('#buddy').innerHTML = F.companionSVG({ mood: 'cheer' });
      el.querySelector('#say').textContent = F.buddyLine('greet');
    });
    app.appendChild(el);
  }
  const fmtBest = (g, v) => (g.formatBest ? g.formatBest(v) : v);

  // ---------- Game intro + runner + result ----------
  function intro(id) {
    showNav(false);
    const g = F.game(id);
    const gd = F.gameData(id);
    const el = F.h(`<div class="intro stack">
      <div class="row spread"><button class="icon-btn" id="back" aria-label="back">←</button><span class="muted">${F.t('skill.' + g.skill)}</span><span style="width:44px"></span></div>
      <div class="glyph-lg" style="background:var(--c-${g.skill})">${g.glyph}</div>
      <h1>${F.tt(g.name)}</h1>
      <p>${F.tt(g.desc)}</p>
      ${g.modes ? `<h3>${F.t('intro.mode')}</h3>` + g.modes.map((m) => {
        const md = F.gameData(g.id + '@' + m.id);
        return `<button class="btn block mode-btn" data-mode="${m.id}" style="flex-direction:column;align-items:flex-start;text-align:left">
          <span style="font-size:22px">${F.tt(m.name)}</span><span class="muted" style="font-size:16px">${F.tt(m.desc)}${md.plays ? ' · ' + F.t('intro.best', { n: fmtBest(g, md.best) }) : ''}</span></button>`;
      }).join('') : `
      <p class="muted">${g.players === 2 ? F.t('intro.players2') + ' · ' : ''}${g.noLevel ? '' : F.t('intro.level', { n: gd.level }) + ' · '}${F.t('intro.best', { n: fmtBest(g, gd.best) })}</p>
      <div style="margin:20px 0">${F.companionSVG({ mood: 'happy', cls: 'sm' })}</div>
      <button class="btn primary big" id="start">${F.t('intro.start')}</button>`}</div>`);
    el.querySelector('#back').onclick = () => go('home');
    if (g.modes) el.querySelectorAll('[data-mode]').forEach((b) => (b.onclick = () => run(g, b.dataset.mode)));
    else el.querySelector('#start').onclick = () => run(g);
    app.appendChild(el);
  }

  const modeKey = (g, mode) => (mode ? g.id + '@' + mode : g.id);
  function run(g, mode) {
    app.innerHTML = '';
    showNav(false);
    const gd = F.gameData(modeKey(g, mode));
    const el = F.h(`<div><div class="game-top"><button class="icon-btn" id="quit" aria-label="quit">✕</button><span class="title">${F.tt(g.name)}</span><span class="score" id="score"></span></div>
      <div class="info-line" id="info"></div><div class="stage" id="stage"></div></div>`);
    app.appendChild(el);
    const cleanups = [];
    const ctx = {
      game: g, mode, el: el.querySelector('#stage'), level: gd.level, best: gd.best, dead: false,
      rng: F.rng(F.freshSeed()), t: F.tt, sfx: F.sfx,
      setScore: (v) => { el.querySelector('#score').textContent = v; },
      setInfo: (v) => { el.querySelector('#info').innerHTML = v; },
      fresh: (gen, keyOf, tries) => F.fresh(g.id, gen, keyOf, tries),
      wait: (ms) => new Promise((res) => setTimeout(() => { if (!ctx.dead) res(); }, ms)),
      timer: (parent, ms, onEnd) => { const tb = F.timerBar(parent, ms, () => { if (!ctx.dead) onEnd && onEnd(); }); cleanups.push(() => tb.stop()); return tb; },
      onCleanup: (fn) => cleanups.push(fn),
      kill() { if (ctx.dead) return; ctx.dead = true; cleanups.forEach((f) => { try { f(); } catch (e) {} }); },
      finish: (res) => { if (ctx.dead) return; ctx.kill(); current = null; result(g, res, mode); },
    };
    current = ctx;
    el.querySelector('#quit').onclick = () => go('home');
    try { g.start(ctx); } catch (e) { console.error(e); F.toast('Oops: ' + e.message); }
  }

  function result(g, res, mode) {
    const gd = F.gameData(modeKey(g, mode));
    if (mode) F.gameData(g.id).plays++;
    const score = res.score || 0;
    const isRecord = !res.noRecord && score > (gd.best || 0) && score > 0;
    const ink = Math.max(1, Math.round(res.ink != null ? res.ink : Math.min(40, score)));
    gd.plays++; F.data.plays++;
    if (isRecord) gd.best = score;
    const oldLevel = gd.level;
    if (res.levelDelta) gd.level = Math.max(1, Math.min(30, gd.level + res.levelDelta));
    F.data.ink += ink;
    F.data.xp[g.skill] = (F.data.xp[g.skill] || 0) + ink;
    const stageBefore = F.buddyStage(F.totalXp() - ink);
    // quests
    const doneNow = [];
    (F.data.quests ? F.data.quests.items : []).forEach((q) => {
      if (q.done || F.data.quests.date !== F.today()) return;
      if ((q.type === 'play' && q.game === g.id) || (q.type === 'chaos' && g.id === 'chaos' && (res.rounds || 0) >= q.n)) {
        q.done = true; F.data.ink += QUEST_INK; doneNow.push(q);
      }
    });
    F.save();
    const quality = res.quality != null ? res.quality : isRecord ? 1 : 0.5;
    const mood = quality >= 0.75 ? 'cheer' : quality >= 0.4 ? 'happy' : 'sad';
    const line = F.buddyLine(quality >= 0.75 ? 'good' : quality >= 0.4 ? 'ok' : 'bad');
    F.sfx(isRecord ? 'win' : 'good');
    app.innerHTML = '';
    const el = F.h(`<div class="intro stack pop-in">
      <h2>${F.tt(g.name)}</h2>
      <div class="result-score">${F.esc(res.display != null ? res.display : score)}</div>
      ${res.detail ? `<p class="muted">${res.detail}</p>` : ''}
      ${isRecord ? `<div><span class="badge-new">${F.t('res.record')}</span></div>` : ''}
      ${gd.level > oldLevel ? `<p>${F.t('res.levelUp', { n: gd.level })}</p>` : ''}
      <p>${F.inkIcon} ${F.t('res.earned', { n: ink })}</p>
      ${doneNow.map(() => `<p class="badge-new">${F.t('res.questDone', { n: QUEST_INK })}</p>`).join('')}
      ${F.buddyStage() > stageBefore ? `<p class="badge-new">${F.t('buddy.stage.' + F.buddyStage())}!</p>` : ''}
      <div class="companion-wrap" style="justify-content:center">${F.companionSVG({ mood })}<div class="bubble sketch" style="flex:0 1 auto">${F.esc(line)}</div></div>
      <button class="btn primary big" id="again">${F.t('res.again')}</button>
      <button class="btn block" id="home">${F.t('res.home')}</button></div>`);
    el.querySelector('#again').onclick = () => run(g, mode);
    el.querySelector('#home').onclick = () => go('home');
    app.appendChild(el);
  }

  // ---------- Buddy ----------
  function buddy() {
    showNav(true);
    const c = F.data.companion;
    const xp = F.totalXp(), stage = F.buddyStage();
    const next = F.STAGE_XP[stage + 1];
    const traits = F.buddyTraits();
    const el = F.h(`<div>${topbar(F.esc(c.name))}
      <div class="center" id="big">${F.companionSVG({ mood: 'happy', cls: 'lg' })}</div>
      <p class="center muted">${F.t('species.' + c.species)} · ${F.t('buddy.stage.' + stage)} · ${xp} XP${next ? '<br>' + F.t('buddy.next', { n: next }) : ''}</p>
      <h3 style="margin-top:18px">${F.t('buddy.traits')}</h3>
      <div class="card sketch">${F.TRAITS.map((s) => `<div class="rec-row"><span>${traits.includes(s) ? '✓' : '○'} ${F.t('trait.' + s)}</span><span class="muted">${traits.includes(s) ? F.t('skill.' + s) : F.t('buddy.traitHint', { skill: F.t('skill.' + s) })}</span></div>`).join('')}</div>
      <h3 style="margin-top:18px">${F.t('buddy.shop')}</h3>
      <div class="shop-grid">${F.SHOP.map((it) => {
        const owned = F.data.owned.includes(it.id), worn = F.data.wearing.includes(it.id);
        return `<div class="shop-item sketch ${worn ? 'worn' : ''}" data-item="${it.id}"><span class="ic">${it.icon}</span>${F.t('item.' + it.id)}<br><span class="muted">${owned ? F.t(worn ? 'buddy.off' : 'buddy.wear') : F.inkIcon + ' ' + it.price}</span></div>`;
      }).join('')}</div></div>`);
    el.querySelector('#big').onclick = () => { F.sfx('pop'); el.querySelector('#big').innerHTML = F.companionSVG({ mood: 'cheer', cls: 'lg' }); };
    el.querySelector('.shop-grid').addEventListener('click', (e) => {
      const b = e.target.closest('[data-item]'); if (!b) return;
      const it = F.SHOP.find((x) => x.id === b.dataset.item);
      if (!F.data.owned.includes(it.id)) {
        if (F.data.ink < it.price) { F.sfx('bad'); return F.toast(F.t('buddy.poor')); }
        F.data.ink -= it.price; F.data.owned.push(it.id); F.sfx('win');
      }
      if (F.data.wearing.includes(it.id)) F.data.wearing = F.data.wearing.filter((w) => w !== it.id);
      else {
        F.data.wearing = F.data.wearing.filter((w) => F.SHOP.find((x) => x.id === w).slot !== it.slot);
        F.data.wearing.push(it.id);
      }
      F.save(); go('buddy');
    });
    app.appendChild(el);
  }

  // ---------- Stats ----------
  function radarSVG() {
    const skills = ['memory', 'math', 'logic', 'spatial', 'focus', 'chem'];
    const cx = 170, cy = 150, R = 100;
    const pt = (i, f) => { const a = -Math.PI / 2 + (i * 2 * Math.PI) / skills.length; return [cx + Math.cos(a) * R * f, cy + Math.sin(a) * R * f]; };
    let s = `<svg class="radar" viewBox="0 0 340 300" style="color:var(--ink)">`;
    [0.33, 0.66, 1].forEach((f) => { s += `<polygon points="${skills.map((_, i) => pt(i, f).join(',')).join(' ')}" fill="none" stroke="var(--ink-faint)" stroke-width="1.5" stroke-dasharray="4 3"/>`; });
    const vals = skills.map((k) => 0.08 + 0.92 * (1 - Math.exp(-(F.data.xp[k] || 0) / 250)));
    s += `<polygon points="${vals.map((v, i) => pt(i, v).join(',')).join(' ')}" fill="var(--accent)" fill-opacity=".45" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>`;
    skills.forEach((k, i) => {
      const [x, y] = pt(i, 1.2);
      s += `<text x="${x}" y="${y + 5}" text-anchor="middle" font-size="16" fill="currentColor" font-family="inherit">${F.t('skill.' + k)}</text>`;
    });
    return s + '</svg>';
  }
  function stats() {
    showNav(true);
    const el = F.h(`<div>${topbar(F.t('stats.title'))}
      <div class="card sketch">${radarSVG()}<p class="center muted">${F.t('stats.plays', { n: F.data.plays })}</p></div>
      <h3 style="margin-top:18px">${F.t('stats.records')}</h3>
      <div class="card sketch alt">${F.games.flatMap((g) => (g.modes ? g.modes.map((m) => [g, g.id + '@' + m.id, F.tt(g.name) + ' · ' + F.tt(m.name)]) : [[g, g.id, F.tt(g.name)]])).map(([g, key, label]) => { const gd = F.gameData(key); return `<div class="rec-row"><span>${label}</span><span class="muted">${gd.plays ? fmtBest(g, gd.best) + ' · ' + gd.plays + '×' : F.t('stats.none')}</span></div>`; }).join('')}</div></div>`);
    app.appendChild(el);
  }

  // ---------- Settings ----------
  function settings() {
    showNav(true);
    const D = F.data;
    const seg = (key, values, label) => `<div class="field"><span>${label}</span><div class="seg" data-key="${key}">${values.map(([v, txt]) => `<button data-v="${v}" class="${String(D[key]) === String(v) ? 'on' : ''}">${txt}</button>`).join('')}</div></div>`;
    const el = F.h(`<div>${topbar(F.t('set.title'))}
      <div class="card sketch stack">
        ${seg('lang', [['de', 'Deutsch'], ['en', 'English']], F.t('set.lang'))}
        ${seg('theme', [['cozy', F.t('theme.cozy')], ['night', F.t('theme.night')]], F.t('set.theme'))}
        ${seg('paper', ['dots', 'lines', 'grid', 'plain'].map((p) => [p, F.t('paper.' + p)]), F.t('set.paper'))}
        ${seg('font', [['hand', F.t('font.hand')], ['clean', F.t('font.clean')]], F.t('set.font'))}
        <div class="field"><span>${F.t('set.accent')}</span><div class="row wrap" id="acc">${ACCENTS.map((c) => `<span class="swatch ${D.accent === c || (!D.accent && c === ACCENTS[0]) ? 'on' : ''}" data-c="${c}" style="background:${c}"></span>`).join('')}</div></div>
        ${seg('sound', [[true, F.t('set.on')], [false, F.t('set.off')]], F.t('set.sound'))}
      </div>
      <p class="muted" style="margin-top:14px">${F.t('set.install')}</p>
      <h3 style="margin-top:18px">${F.t('set.backup')}</h3>
      <div class="card sketch alt stack">
        <button class="btn block" id="exp">${F.t('set.export')}</button>
        <textarea id="io" placeholder="{ … }"></textarea>
        <button class="btn block" id="imp">${F.t('set.import')}</button>
        <button class="btn block ghost" id="reset" style="color:var(--bad)">${F.t('set.reset')}</button>
      </div></div>`);
    el.querySelectorAll('.seg').forEach((sg) => sg.addEventListener('click', (e) => {
      const b = e.target.closest('[data-v]'); if (!b) return;
      let v = b.dataset.v; if (v === 'true') v = true; if (v === 'false') v = false;
      D[sg.dataset.key] = v; F.save(); F.applyTheme(); F.sfx('tap'); go('settings');
    }));
    el.querySelector('#acc').addEventListener('click', (e) => { const s = e.target.closest('[data-c]'); if (!s) return; D.accent = s.dataset.c === ACCENTS[0] ? null : s.dataset.c; F.save(); F.applyTheme(); go('settings'); });
    el.querySelector('#exp').onclick = () => {
      const txt = JSON.stringify(F.data);
      el.querySelector('#io').value = txt;
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => F.toast(F.t('set.copied')), () => {});
    };
    el.querySelector('#imp').onclick = () => {
      try {
        const d = JSON.parse(el.querySelector('#io').value);
        if (!d || typeof d !== 'object' || !('games' in d)) throw 0;
        F.data = Object.assign(F.data, d); F.save(); F.applyTheme(); F.toast(F.t('set.importOk')); go('home');
      } catch (e) { F.toast(F.t('set.importBad')); }
    };
    el.querySelector('#reset').onclick = () => { if (confirm(F.t('set.confirmReset'))) { F.reset(); F.applyTheme(); go('home'); } };
    app.appendChild(el);
  }

  // ---------- Boot ----------
  F.load();
  F.applyTheme();
  go('home');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }
})();
