/* Funkloch core: registry, randomness, storage, language, sound, small UI helpers. */
(function () {
  const F = (window.Funkloch = {});

  // ---------- Registry ----------
  // A game is { id, skill, players, glyph, name:{de,en}, desc:{de,en}, start(ctx) }.
  F.games = [];
  F.micro = [];
  F.registerGame = (g) => F.games.push(Object.assign({ players: 1 }, g));
  F.registerMicro = (m) => F.micro.push(m);
  F.game = (id) => F.games.find((g) => g.id === id);

  F.SKILLS = ['memory', 'math', 'logic', 'spatial', 'focus', 'chem', 'fun', 'duo'];

  // ---------- Randomness ----------
  // Seeded generator so a seed (e.g. today's date) gives the same puzzle on two phones.
  F.rng = function (seed) {
    let a = seed >>> 0;
    const r = function () {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    r.int = (lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.chance = (p) => r() < p;
    r.shuffle = (arr) => {
      const a2 = arr.slice();
      for (let i = a2.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a2[i], a2[j]] = [a2[j], a2[i]];
      }
      return a2;
    };
    return r;
  };
  let seedCounter = 0;
  F.freshSeed = () => (Date.now() ^ Math.floor(Math.random() * 4294967296) ^ (++seedCounter * 2654435761)) >>> 0;
  F.hash = (str) => {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  };
  F.today = () => {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  };
  F.daySeed = (salt = '') => F.hash(F.today() + salt);

  // ---------- Storage ----------
  const KEY = 'funkloch.v1';
  const defaults = () => ({
    lang: (navigator.language || 'de').toLowerCase().startsWith('de') ? 'de' : 'en',
    theme: 'cozy', paper: 'dots', font: 'hand', accent: null, sound: true,
    companion: null, // { species, name, seed, personality, born }
    ink: 0, xp: {}, games: {}, owned: [], wearing: [],
    quests: null, plays: 0, history: {},
  });
  F.data = defaults();
  F.load = () => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) F.data = Object.assign(defaults(), JSON.parse(raw));
    } catch (e) { /* storage blocked: play without saving */ }
  };
  F.save = () => {
    try { localStorage.setItem(KEY, JSON.stringify(F.data)); } catch (e) {}
  };
  F.reset = () => { F.data = defaults(); F.save(); };
  F.gameData = (id) => (F.data.games[id] = F.data.games[id] || { plays: 0, best: 0, level: 1 });
  F.totalXp = () => Object.values(F.data.xp).reduce((a, b) => a + b, 0);

  // Remembers recently shown items per game so content doesn't repeat soon.
  F.fresh = (gameId, gen, keyOf = (x) => JSON.stringify(x), tries = 30, memory = 150) => {
    const hist = (F.data.history[gameId] = F.data.history[gameId] || []);
    let item;
    for (let i = 0; i < tries; i++) {
      item = gen();
      if (!hist.includes(keyOf(item))) break;
    }
    hist.push(keyOf(item));
    if (hist.length > memory) hist.splice(0, hist.length - memory);
    return item;
  };

  // ---------- Language ----------
  F.strings = { de: {}, en: {} };
  F.t = (key, vars) => {
    let s = (F.strings[F.data.lang] || {})[key];
    if (s == null) s = F.strings.en[key];
    if (s == null) return key;
    if (Array.isArray(s)) s = s[Math.floor(Math.random() * s.length)];
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));
    return s;
  };
  // Inline bilingual text: F.tt({de:'Hallo', en:'Hello'}) or a plain string.
  F.tt = (o, vars) => {
    if (o == null) return '';
    let s = typeof o === 'string' ? o : o[F.data.lang] != null ? o[F.data.lang] : o.en;
    if (vars) s = s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] != null ? vars[k] : ''));
    return s;
  };

  // ---------- Sound (tiny synthesized blips, no files needed) ----------
  let actx = null;
  const ensureAudio = () => {
    if (!actx) {
      try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) {}
    }
    if (actx && actx.state === 'suspended') actx.resume();
  };
  document.addEventListener('pointerdown', ensureAudio, { passive: true });
  const tone = (freq, dur, type = 'sine', vol = 0.15, slide = 0) => {
    if (!F.data.sound || !actx) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, actx.currentTime);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), actx.currentTime + dur);
    g.gain.setValueAtTime(vol, actx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.connect(g).connect(actx.destination);
    o.start();
    o.stop(actx.currentTime + dur);
  };
  F.sfx = (name) => {
    switch (name) {
      case 'tap': tone(520, 0.06, 'triangle', 0.08); break;
      case 'good': tone(660, 0.09, 'triangle'); setTimeout(() => tone(990, 0.12, 'triangle'), 80); break;
      case 'bad': tone(220, 0.25, 'sawtooth', 0.08, -80); break;
      case 'pop': tone(300 + Math.random() * 500, 0.07, 'square', 0.06, -200); break;
      case 'win': [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => tone(f, 0.16, 'triangle'), i * 110)); break;
      case 'tick': tone(900, 0.03, 'square', 0.04); break;
    }
  };

  // ---------- UI helpers ----------
  F.h = (html) => {
    const t = document.createElement('template');
    t.innerHTML = html.trim();
    return t.content.firstElementChild;
  };
  F.esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  F.toast = (msg, ms = 1800) => {
    const el = F.h(`<div class="toast sketch">${msg}</div>`);
    document.body.appendChild(el);
    setTimeout(() => el.remove(), ms);
  };
  F.wait = (ms) => new Promise((res) => setTimeout(res, ms));
  F.inkIcon = '<svg class="ink-drop" viewBox="0 0 16 20"><path d="M8 1C10 6 14 9 14 13A6 6 0 0 1 2 13C2 9 6 6 8 1Z" fill="currentColor"/></svg>';
  // Builds a list of option buttons; onPick(index, button) is called once.
  F.options = (labels, onPick, cls = '') => {
    const wrap = F.h(`<div class="options ${cls}"></div>`);
    let done = false;
    labels.forEach((lab, i) => {
      const b = F.h(`<button class="opt"></button>`);
      if (lab instanceof Node) b.appendChild(lab); else b.innerHTML = lab;
      b.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        if (done) return;
        done = true;
        onPick(i, b, wrap);
      });
      wrap.appendChild(b);
    });
    wrap.unlock = () => { done = false; };
    return wrap;
  };
  // Numeric keypad. onKey receives '0'-'9', '.', '⌫', or 'ok'.
  F.keypad = (onKey, { dot = false, ok = true, keys: custom = null } = {}) => {
    const keys = custom || ['1', '2', '3', '4', '5', '6', '7', '8', '9', dot ? '.' : '⌫', '0', ok ? 'ok' : '⌫'];
    if (!custom && dot && ok) keys.push('⌫');
    const pad = F.h('<div class="keypad"></div>');
    keys.forEach((k) => {
      const b = F.h(`<button>${k === 'ok' ? '✓' : k}</button>`);
      if (!k) b.style.visibility = 'hidden';
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); F.sfx('tap'); onKey(k); });
      pad.appendChild(b);
    });
    return pad;
  };
  // Countdown bar; returns { stop() }.
  F.timerBar = (parent, ms, onEnd) => {
    const bar = F.h('<div class="timer-bar"><div></div></div>');
    parent.appendChild(bar);
    const inner = bar.firstChild;
    const start = performance.now();
    let raf, stopped = false;
    const step = (now) => {
      if (stopped) return;
      const p = Math.min(1, (now - start) / ms);
      inner.style.transform = `scaleX(${1 - p})`;
      if (p >= 1) { stopped = true; onEnd && onEnd(); return; }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return {
      el: bar,
      stop() { stopped = true; cancelAnimationFrame(raf); return performance.now() - start; },
      elapsed: () => performance.now() - start,
    };
  };
})();
