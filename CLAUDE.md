# Funkloch — rules for anyone (human or agent) changing this repo

Funkloch is an offline brain-games app for Corsin's iPhone, used on the train where there is no internet.
It is plain HTML/CSS/JS served by GitHub Pages from `main` (every push to `main` goes live on his phone).
Read `README.md` for the file layout and the game API.

## Owner's decisions (do not undo)
- Bilingual: every visible text has `{ de, en }`. German is Swiss style (use "ss", never "ß", in German texts).
- Cozy hand-drawn look (Cozy Doodle / Night Notebook themes). Use the CSS variables in `css/style.css`, never hard-coded light-only colours for text.
- **No train theme** in content or design.
- **Touch only**: no shake, tilt, microphone, camera or vibration.
- **Fully offline**: no external libraries, APIs, images or fonts beyond what is already linked. Draw with SVG/CSS/canvas or emoji.
- **Never repeating**: content must be *generated* (seeded random via `ctx.rng`, `ctx.fresh(...)`), not read from a small fixed list.
- Number Flash shows plain numbers only. Nonogram and "Rotate It" were removed on purpose — don't bring them back.
- Fold & Punch and Make 24 have difficulty modes; keep them.
- He wants a **huge library**, especially many **2/3/4-player games on one phone** (see `js/party.js`).

## Adding a game (checklist)
1. New file `games/<id>.js` calling `Funkloch.registerGame({...})` with `id, skill, added: 'YYYY-MM-DD' (today), glyph, name{de,en}, desc{de,en}, start(ctx)`.
   - Solo games: `skill` one of memory | math | logic | spatial | focus | chem | fun. Use `ctx.level` + `levelDelta` for adaptive difficulty, or `modes` for explicit difficulty choice.
   - Multiplayer: `skill: 'duo', players: 2, maxPlayers: 4, modes: Funkloch.partyModes()` and build on `Funkloch.partyMatch(ctx, { n: +ctx.mode, win, round(api) })` (see `games/tap-race.js`, `games/brain-race.js`). Each player only ever touches their own zone.
   - Always end with `ctx.finish({ score, display?, detail?, quality, ink? })`. Use `ctx.wait()` (not raw `setTimeout`) and `ctx.onCleanup()` so quitting mid-game never leaves timers or overlays.
   - Never write an unbounded `while` loop that depends on random placement or screen size — cap the tries.
2. Add `<script src="games/<id>.js"></script>` to `index.html` (before `js/app.js`).
3. Add `'games/<id>.js'` to the `FILES` list in `sw.js` **and bump `VERSION`** (`funkloch-vN` → `funkloch-vN+1`) so installed phones update.
4. Tick the idea in `IDEAS.md` (or add it there as done) and add a line to `CHANGELOG.md`.
5. Run the smoke test (below). It must print `All good`.

Game descriptions: short, friendly, and they must say how to win. Design for 1–5 minute rounds, portrait, big tap targets (≥ 48px).

## Testing
```
cd tools && npm install && timeout 900 node smoke-test.mjs        # all games
timeout 300 node smoke-test.mjs <game-id> [<game-id> ...]           # just some
```
It loads the app in jsdom, starts every game in every mode, taps randomly, runs every Chaos micro-game,
and checks that every script is listed in `index.html` and `sw.js`. Exit code 0 = OK.
It cannot judge whether a game is *fun* or *correct* — read the code for logic bugs too
(wrong answer marked correct, duplicate options, unsolvable puzzles, text overflowing a 375px-wide phone).

## Commits
Small, descriptive commits straight to `main`, ending with the usual co-author line. Never force-push, never rewrite history,
never delete the owner's games unless broken beyond repair (then fix instead of delete when possible).
