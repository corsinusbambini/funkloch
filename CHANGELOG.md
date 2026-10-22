# Changelog

Newest first. One line per change: date · what · why.

- 2026-10-22 · Fixed iPhone zooming in when several players tap at once (e.g. Schnell-Zieher / Quick Draw) · Safari treats two fingers as a pinch; gesture and multi-finger touch events are now blocked app-wide
- 2026-10-22 · Lichter aus / Lights Out: hint button 🔍 marks a lamp to tap (−2 points) · owner got stuck and couldn't finish
- 2026-10-22 · Fixed page zooming in on iPhone when tapping fast (e.g. numbers in Mini-Sudoku) · iOS ignores the no-zoom viewport setting, double-tap zoom now off app-wide
- 2026-10-21 · Zähl mit! / Count Them (2–4 players) and Mini-Sudoku (solo logic) · count the flashed doodles and tap the number first; fill a generated 4×4 sudoku
- 2026-10-21 · Push notifications via ntfy on every app update (`.github/workflows/notify.yml`) · owner wants to know when games are added or fixed
- 2026-10-20 · Aussenseiter-Rennen / Odd One Race (2–4 players) and Lichter aus / Lights Out (solo logic) · tap the odd symbol first; switch all lamps off in few taps
- 2026-10-19 · Farbgriff / Color Grab and Ballon-Pumpe / Balloon Pump (2–4 players) · tap the named colour first; pump your balloon and bank it before it pops
- 2026-10-19 · Heisse Kartoffel / Hot Potato (2–4 players) and Code-Knacker / Code Breaker (solo logic) · bomb with hidden fuse to pass on; crack a secret fruit code
- 2026-10-19 · Added multiplayer engine (2–4 players on one phone) and 6 games: Tap Race, Quick Draw, Stop It!, Brain Race, Tug of War, Doodle Pong · owner wants many 2/3/4-player games
- 2026-10-19 · Added smoke test (`tools/smoke-test.mjs`) and "NEW" badge on recently added games
- 2026-10-19 · Fixed Focus Tunnel freezing when its play area had no size yet
- 2026-10-19 · Number Flash plain numbers; difficulty modes for Fold & Punch and Make 24; Nonogram → What's Next?; Rotate It → Block Count
- 2026-10-19 · First version: 12 games, companion, themes, DE/EN, offline
