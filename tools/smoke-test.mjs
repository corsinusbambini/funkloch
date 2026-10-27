/*
 * Smoke test: loads the app in a simulated browser (jsdom), starts every game in every mode,
 * taps randomly for a few seconds, runs every Chaos micro-game, and reports any errors.
 *
 *   cd tools && npm install && node smoke-test.mjs            (all games)
 *   node smoke-test.mjs tap-race pong                         (only these games)
 *
 * Exit code 0 = no problems found, 1 = problems found.
 */
import { JSDOM, ResourceLoader, VirtualConsole } from 'jsdom';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const only = process.argv.slice(2);
const RUN_MS = 3500;
const problems = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// --- static checks: every game file is listed in index.html and sw.js ---
const html = readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sw = readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
for (const s of scripts) {
  if (!existsSync(path.join(ROOT, s))) problems.push(`index.html loads missing file ${s}`);
  if (!sw.includes(`'${s}'`)) problems.push(`sw.js offline list is missing ${s}`);
}

// --- load the app ---
class LocalOnly extends ResourceLoader {
  fetch(url, options) { return url.startsWith('file:') ? super.fetch(url, options) : Promise.resolve(Buffer.from('')); }
}
const errors = [];
const vc = new VirtualConsole();
vc.on('error', (...a) => errors.push(a.map(String).join(' ')));
// "Not implemented" means jsdom lacks a browser feature, not that the app is broken.
vc.on('jsdomError', (e) => { const m = String(e && (e.stack || e.message || e)); if (!m.includes('Not implemented')) errors.push(m); });
const dom = new JSDOM(html, {
  url: pathToFileURL(path.join(ROOT, 'index.html')).href,
  runScripts: 'dangerously', resources: new LocalOnly(), pretendToBeVisual: true, virtualConsole: vc,
  beforeParse(w) {
    w.HTMLCanvasElement.prototype.getContext = function () {
      return new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => ((t[k] = v), true) });
    };
    if (!w.PointerEvent) {
      w.PointerEvent = class extends w.MouseEvent {
        constructor(type, init = {}) { super(type, init); this.pointerId = init.pointerId || 1; this.pointerType = init.pointerType || 'touch'; }
      };
    }
    w.Element.prototype.releasePointerCapture = () => {};
    w.Element.prototype.setPointerCapture = () => {};
    w.document.elementFromPoint = () => null;
    w.scrollTo = () => {};
    w.matchMedia = () => ({ matches: false, addEventListener() {}, removeEventListener() {} });
    w.addEventListener('error', (e) => errors.push(String(e.error && e.error.stack || e.message)));
    w.addEventListener('unhandledrejection', (e) => errors.push('Unhandled promise: ' + String(e.reason && (e.reason.stack || e.reason))));
  },
});
const w = dom.window;
await new Promise((r) => w.addEventListener('load', r));
await sleep(200);
const F = w.Funkloch;
if (!F || !F.games) { console.error('App did not load.', errors.join('\n')); process.exit(1); }
F.data.companion = { species: 'blob', seed: 7, name: 'Test', personality: 'cheeky' };
F.data.sound = false;

const take = () => errors.splice(0, errors.length);
const tapTargets = 'button, .opt, .tap-thing, .bub, .pzone, canvas, .species-card, [data-mode], .keypad button';
function randomTap() {
  const els = [...w.document.querySelectorAll(tapTargets)].filter((e) => !e.closest('.nav') && !e.matches('.party-quit, #quit, #back, .duel-quit') && !/✕/.test(e.textContent));
  if (!els.length) return;
  const el = els[Math.floor(Math.random() * els.length)];
  const o = { bubbles: true, cancelable: true, clientX: Math.random() * 300, clientY: Math.random() * 600, pointerId: 1 + Math.floor(Math.random() * 4) };
  el.dispatchEvent(new w.PointerEvent('pointerdown', o));
  el.dispatchEvent(new w.PointerEvent('pointermove', o));
  el.dispatchEvent(new w.PointerEvent('pointerup', o));
  el.dispatchEvent(new w.MouseEvent('click', o));
}

// --- every game, every mode ---
const ids = new Set();
for (const g of F.games) {
  if (ids.has(g.id)) problems.push(`duplicate game id ${g.id}`);
  ids.add(g.id);
  for (const key of ['name', 'desc']) if (!g[key] || !g[key].de || !g[key].en) problems.push(`${g.id}: ${key} needs both de and en`);
  if (!F.SKILLS.includes(g.skill)) problems.push(`${g.id}: unknown skill "${g.skill}"`);
  if (only.length && !only.includes(g.id)) continue;
  const modes = g.modes ? g.modes.map((m) => m.id) : [null];
  for (const mode of modes) {
    const label = g.id + (mode ? `@${mode}` : '');
    take();
    try {
      F.go('intro', g.id);
      const btn = mode ? w.document.querySelector(`[data-mode="${mode}"]`) : w.document.querySelector('#start');
      if (!btn) { problems.push(`${label}: no start/mode button`); continue; }
      btn.click();
      const t0 = Date.now();
      while (Date.now() - t0 < RUN_MS) { randomTap(); await sleep(40); }
      F.go('home');
      await sleep(50);
      if (w.document.querySelector('.party, .duel')) problems.push(`${label}: full-screen overlay stays after quitting`);
    } catch (e) {
      problems.push(`${label}: ${e.stack || e}`);
    }
    take().forEach((e) => problems.push(`${label}: ${e}`));
    console.log(`checked ${label}`);
  }
}

// --- home screen tools and daily challenge ---
if (!only.length) {
  take();
  try {
    F.go('home');
    const search = w.document.querySelector('#search');
    search.value = 'zzzz-nothing';
    search.dispatchEvent(new w.Event('input'));
    if (w.document.querySelector('#nomatch').classList.contains('hidden')) problems.push('home: search for nonsense should show "nothing found"');
    search.value = '';
    search.dispatchEvent(new w.Event('input'));
    for (const f of ['solo', 'multi', 'new', 'fav', 'all']) w.document.querySelector(`#chips [data-f="${f}"]`).click();
    w.document.querySelector('[data-daily]').click();
    w.document.querySelector('#start').click();
    const t0 = Date.now();
    while (Date.now() - t0 < RUN_MS) { randomTap(); await sleep(40); }
    F.go('home');
    F.go('stats');
    F.go('home');
  } catch (e) {
    problems.push(`home/daily: ${e.stack || e}`);
  }
  take().forEach((e) => problems.push(`home/daily: ${e}`));
  console.log('checked home tools + daily challenge');
}

// --- every Chaos micro-game ---
if (!only.length || only.includes('chaos')) {
  for (const m of F.micro) {
    for (const round of [1, 12, 25]) {
      take();
      const st = w.document.createElement('div');
      st.className = 'micro-stage';
      w.document.body.appendChild(st);
      let res = null;
      const api = {
        r: F.rng(F.freshSeed()), round, time: 5000, over: () => res !== null,
        win() { res = res || 'win'; }, lose() { res = res || 'lose'; }, setInstr() {},
        choice(q, labels, correct) {
          if (!Array.isArray(labels) || labels.length < 2) problems.push(`micro ${m.id}: needs at least 2 options`);
          if (!(correct >= 0 && correct < labels.length)) problems.push(`micro ${m.id}: correct index ${correct} out of range`);
          if (new Set(labels.map(String)).size !== labels.length && m.id !== 'mirror') problems.push(`micro ${m.id}: duplicate options ${labels.join('/')}`);
        },
      };
      try { m.setup(st, api); } catch (e) { problems.push(`micro ${m.id}: ${e.stack || e}`); }
      await sleep(1200);
      for (let i = 0; i < 5; i++) randomTap();
      st.remove();
      take().forEach((e) => problems.push(`micro ${m.id}: ${e}`));
    }
  }
  console.log(`checked ${F.micro.length} micro-games`);
}

if (problems.length) {
  console.log(`\n${problems.length} PROBLEM(S):\n- ` + [...new Set(problems)].join('\n- '));
  process.exit(1);
}
console.log(`\nAll good: ${F.games.length} games, ${F.micro.length} micro-games, no errors.`);
process.exit(0);
