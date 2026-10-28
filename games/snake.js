/* Snake: steer the snake to the apples. Walls and your own tail end the game. */
(function () {
  const F = Funkloch;
  const N = 13;
  const DIRS = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

  F.registerGame({
    id: 'snake', skill: 'focus', added: '2026-10-28', glyph: '🐍',
    name: { de: 'Schlange', en: 'Snake' },
    desc: {
      de: 'Steuere die Schlange zu den Äpfeln. Wische über das Feld oder tippe die Pfeile. Jeder Apfel macht dich länger. Wand oder eigener Schwanz beenden das Spiel. Friss so viele Äpfel wie möglich.',
      en: 'Steer the snake to the apples. Swipe on the board or tap the arrows. Every apple makes you longer. Hitting a wall or your own tail ends the game. Eat as many apples as you can.',
    },
    start(ctx) {
      const r = ctx.rng;
      const css = getComputedStyle(document.documentElement);
      const col = (n, d) => css.getPropertyValue(n).trim() || d;
      const INK = col('--ink', '#2B2522'), CARD = col('--card', '#FFFDF8'), DOT = col('--dot', '#E2D6C2');
      const GOOD = col('--good', '#5FAF7A'), BAD = col('--bad', '#E06A6A');
      const speed = Math.max(95, 240 - ctx.level * 14);
      let snake = [[6, 6], [5, 6], [4, 6]], dir = 'right', queue = [], apple = null, eaten = 0, over = false, started = false;

      ctx.el.innerHTML = '';
      const size = Math.min(340, Math.floor(Math.min(window.innerWidth - 32, 340) / N) * N) || 312;
      const cell = size / N;
      const cv = F.h(`<canvas style="display:block;margin:8px auto;border:3px solid var(--ink);border-radius:12px;background:var(--card);touch-action:none;width:${size}px;height:${size}px;box-shadow:var(--shadow)"></canvas>`);
      const dpr = window.devicePixelRatio || 1;
      cv.width = size * dpr; cv.height = size * dpr;
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      const hint = F.h('<div class="info-line" style="text-align:center;min-height:26px"></div>');
      hint.textContent = F.tt({ de: 'Tippe einen Pfeil, um zu starten', en: 'Tap an arrow to start' });
      const pad = F.h('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;max-width:240px;margin:6px auto;touch-action:manipulation"></div>');
      const mk = (d, sym, area) => {
        const b = F.h(`<button aria-label="${d}" style="grid-area:${area};min-height:56px;min-width:0;padding:0;font-size:26px;border:3px solid var(--ink);border-radius:14px;background:var(--card);color:var(--ink);box-shadow:var(--shadow);cursor:pointer">${sym}</button>`);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); turn(d); });
        pad.appendChild(b);
      };
      pad.style.gridTemplateAreas = '". u ." "l d r"';
      mk('up', '▲', 'u'); mk('left', '◀', 'l'); mk('down', '▼', 'd'); mk('right', '▶', 'r');
      ctx.el.appendChild(cv); ctx.el.appendChild(hint); ctx.el.appendChild(pad);

      function turn(d) {
        if (over) return;
        started = true;
        hint.textContent = '';
        const last = queue.length ? queue[queue.length - 1] : dir;
        if (d === last) return;
        const a = DIRS[d], b = DIRS[last];
        if (a[0] + b[0] === 0 && a[1] + b[1] === 0) return; // no U-turn
        if (queue.length < 2) queue.push(d);
      }
      let sx = 0, sy = 0, sid = null;
      cv.addEventListener('pointerdown', (e) => { e.preventDefault(); sx = e.clientX; sy = e.clientY; sid = e.pointerId; });
      cv.addEventListener('pointermove', (e) => {
        if (e.pointerId !== sid) return;
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 18) return;
        turn(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'));
        sx = e.clientX; sy = e.clientY;
      });
      const up = (e) => { if (e.pointerId === sid) sid = null; };
      cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);

      function place() {
        const free = [];
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (!snake.some((s) => s[0] === x && s[1] === y)) free.push([x, y]);
        apple = free.length ? r.pick(free) : null;
      }
      function draw(dead) {
        g.clearRect(0, 0, size, size);
        g.fillStyle = DOT;
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if ((x + y) % 2 === 0) g.fillRect(x * cell, y * cell, cell, cell);
        if (apple) {
          g.fillStyle = BAD; g.strokeStyle = INK; g.lineWidth = 2;
          g.beginPath(); g.arc((apple[0] + 0.5) * cell, (apple[1] + 0.55) * cell, cell * 0.36, 0, 7); g.fill(); g.stroke();
          g.fillStyle = GOOD; g.fillRect((apple[0] + 0.5) * cell - 1, apple[1] * cell + 2, 3, cell * 0.2);
        }
        snake.forEach((s, i) => {
          g.fillStyle = dead ? BAD : GOOD; g.strokeStyle = INK; g.lineWidth = 2;
          const p = i === 0 ? 1 : 3;
          g.beginPath(); g.roundRect ? g.roundRect(s[0] * cell + p, s[1] * cell + p, cell - 2 * p, cell - 2 * p, 5) : g.rect(s[0] * cell + p, s[1] * cell + p, cell - 2 * p, cell - 2 * p);
          g.fill(); g.stroke();
        });
        const h = snake[0];
        g.fillStyle = INK;
        const d = DIRS[dir];
        [-1, 1].forEach((k) => {
          const ex = (h[0] + 0.5) * cell + (d[0] ? d[0] * cell * 0.15 : k * cell * 0.2);
          const ey = (h[1] + 0.5) * cell + (d[1] ? d[1] * cell * 0.15 : k * cell * 0.2);
          g.beginPath(); g.arc(ex, ey, cell * 0.08, 0, 7); g.fill();
        });
      }
      function step() {
        if (over || !started) return;
        if (queue.length) dir = queue.shift();
        const d = DIRS[dir], h = snake[0], nx = h[0] + d[0], ny = h[1] + d[1];
        const grow = apple && nx === apple[0] && ny === apple[1];
        const body = grow ? snake : snake.slice(0, -1); // tail moves away unless we grow
        if (nx < 0 || ny < 0 || nx >= N || ny >= N || body.some((s) => s[0] === nx && s[1] === ny)) return die();
        snake.unshift([nx, ny]);
        if (grow) {
          eaten++; ctx.setScore(eaten); ctx.sfx('good');
          place();
          if (!apple) return die(true);
        } else snake.pop();
        draw();
      }
      async function die(won) {
        over = true; clearInterval(iv);
        ctx.sfx(won ? 'good' : 'bad');
        draw(!won);
        hint.textContent = F.tt(won ? { de: 'Das Feld ist voll!', en: 'The board is full!' } : { de: 'Aua!', en: 'Ouch!' });
        await ctx.wait(1000);
        ctx.finish({
          score: eaten, detail: F.tt({ de: `${eaten} Äpfel`, en: `${eaten} apples` }),
          levelDelta: eaten >= 15 ? 1 : eaten < 5 ? -1 : 0,
          quality: Math.min(1, eaten / 20), ink: 2 + eaten,
        });
      }
      const iv = setInterval(step, speed);
      ctx.onCleanup(() => clearInterval(iv));
      ctx.setScore(0);
      place(); draw();
    },
  });
})();
