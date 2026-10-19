# Funkloch

Offline brain games with a doodle companion. Plain HTML/CSS/JS: no build step, no server code, no internet needed once installed.

## Put it on the iPhone
1. Host the `funkloch` folder on any HTTPS static host (e.g. GitHub Pages).
2. Open the URL in **Safari** → Share → **Add to Home Screen**.
3. Open it once from the home screen while online. After that it works in flight mode.

## Try it on the computer
```
python -m http.server 8742 --directory funkloch
```
Then open http://localhost:8742.

## Add a new game
1. Create `games/my-game.js`:
   ```js
   Funkloch.registerGame({
     id: 'my-game', skill: 'logic',          // memory | math | logic | spatial | focus | chem | fun | duo
     players: 1,                              // 2 = couples / pass-and-play
     glyph: '?!',                             // shown on the card
     name: { de: 'Mein Spiel', en: 'My Game' },
     desc: { de: '…', en: '…' },
     start(ctx) {
       // ctx.el = game area, ctx.rng = random generator, ctx.level = adaptive level,
       // ctx.fresh(gen) avoids recently seen content, ctx.wait(ms), ctx.timer(...), ctx.sfx('good')
       ctx.finish({ score: 10, levelDelta: +1, quality: 0.8 });
     },
   });
   ```
2. Add `<script src="games/my-game.js"></script>` to `index.html`.
3. Add `'games/my-game.js'` to the list in `sw.js` and bump `VERSION` (e.g. `funkloch-v2`) so phones pick up the update.

A new Chaos Mode micro-game goes into `games/chaos.js` with `Funkloch.registerMicro({ id, instr, setup(stage, api) })`.

## Files
- `js/core.js`: registry, seeded randomness, storage, language, sounds, UI helpers
- `js/i18n.js`: all German/English UI texts
- `js/companion.js`: the companion drawing (species, art stages, traits, shop items)
- `js/app.js`: screens (hatching, home, game runner, buddy, progress, settings)
- `games/*.js`: one file per game
- `sw.js`: offline cache
