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
      const cv = F.h(`<canvas style="display:block;margin:4px auto 0;border:3px solid var(--ink);border-radius:255px 14px 225px 14px / 14px 225px 14px 255px;background:var(--card);touch-action:none;width:${size}px;height:${size}px;box-shadow:var(--shadow)"></canvas>`);
      const dpr = window.devicePixelRatio || 1;
      cv.width = size * dpr; cv.height = size * dpr;
      const g = cv.getContext('2d');
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      // hints go into the free info line above the board
      const hint = { set textContent(v) { ctx.setInfo(F.esc(v)); } };
      hint.textContent = F.tt({ de: 'Tippe einen Pfeil, um zu starten', en: 'Tap an arrow to start' });
      // status: a drawn apple with the number eaten
      const status = F.h(`<div style="display:flex;align-items:center;justify-content:center;gap:8px;margin:8px 0 0;min-height:36px">
        <svg viewBox="0 0 32 32" width="32" height="32" aria-hidden="true"><path d="M16 9c-3-3-11-2-11 7 0 7 5 13 8 13 1.5 0 2-.8 3-.8s1.5.8 3 .8c3 0 8-6 8-13 0-9-8-10-11-7z" style="fill:var(--bad);stroke:var(--ink);stroke-width:2;stroke-linejoin:round"/><path d="M16 9c0-3 1-5 3-6" style="fill:none;stroke:var(--ink);stroke-width:2;stroke-linecap:round"/><path d="M17 6c3-3 7-2 8 0-3 2-6 2-8 0z" style="fill:var(--good);stroke:var(--ink);stroke-width:1.6;stroke-linejoin:round"/><path d="M9 15c0-2 1-3.5 2.5-4" style="fill:none;stroke:#FFFFFF;stroke-width:2;stroke-linecap:round;opacity:.7"/></svg>
        <span class="sn-num" style="font-size:28px;display:inline-block">0</span></div>`);
      const numEl = status.querySelector('.sn-num');
      const pad = F.h('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;max-width:300px;margin:8px auto 0;touch-action:manipulation"></div>');
      const ROT = { up: -90, down: 90, left: 180, right: 0 };
      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };
      const mk = (d, area) => {
        const b = F.h(`<button class="btn" aria-label="${d}" style="grid-area:${area};min-height:76px;min-width:0;padding:0;display:flex;align-items:center;justify-content:center"><svg viewBox="0 0 40 40" width="40" height="40" aria-hidden="true" style="transform:rotate(${ROT[d]}deg)"><path d="M9 14h12V7l12 13-12 13v-7H9z" style="fill:var(--c-spatial);stroke:var(--ink);stroke-width:2.5;stroke-linejoin:round"/></svg></button>`);
        b.addEventListener('pointerdown', (e) => { e.preventDefault(); if (!over) pop(b); turn(d); });
        pad.appendChild(b);
      };
      pad.style.gridTemplateAreas = '". u ." "l d r"';
      mk('up', 'u'); mk('left', 'l'); mk('down', 'd'); mk('right', 'r');
      ctx.el.appendChild(cv); ctx.el.appendChild(status); ctx.el.appendChild(pad);

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
          const ax = (apple[0] + 0.5) * cell, ay = (apple[1] + 0.55) * cell;
          g.fillStyle = BAD; g.strokeStyle = INK; g.lineWidth = 2;
          g.beginPath(); g.arc(ax, ay, cell * 0.36, 0, 7); g.fill(); g.stroke();
          g.beginPath(); g.moveTo(ax, ay - cell * 0.3); g.lineTo(ax + cell * 0.06, apple[1] * cell + 2); g.stroke();
          g.fillStyle = GOOD; g.beginPath(); g.ellipse(ax + cell * 0.18, apple[1] * cell + cell * 0.14, cell * 0.14, cell * 0.07, -0.5, 0, 7); g.fill(); g.lineWidth = 1.5; g.stroke();
          g.strokeStyle = '#FFFFFF'; g.globalAlpha = 0.7; g.lineWidth = 2;
          g.beginPath(); g.arc(ax, ay, cell * 0.22, Math.PI * 1.05, Math.PI * 1.45); g.stroke();
          g.globalAlpha = 1;
        }
        // body: one thick rounded line through the cell centres, outlined in ink
        const cx = (s) => (s[0] + 0.5) * cell, cy = (s) => (s[1] + 0.5) * cell;
        g.lineCap = 'round'; g.lineJoin = 'round';
        const path = () => { g.beginPath(); snake.forEach((s, i) => (i ? g.lineTo(cx(s), cy(s)) : g.moveTo(cx(s), cy(s)))); };
        if (snake.length > 1) {
          path(); g.strokeStyle = INK; g.lineWidth = cell * 0.7 + 4; g.stroke();
          path(); g.strokeStyle = dead ? BAD : GOOD; g.lineWidth = cell * 0.7; g.stroke();
          // scale dots along the back
          g.fillStyle = INK; g.globalAlpha = 0.25;
          snake.forEach((s, i) => { if (i && i % 2 === 0) { g.beginPath(); g.arc(cx(s), cy(s), cell * 0.1, 0, 7); g.fill(); } });
          g.globalAlpha = 1;
        }
        const hd = snake[0];
        g.fillStyle = dead ? BAD : GOOD; g.strokeStyle = INK; g.lineWidth = 2;
        g.beginPath(); g.arc(cx(hd), cy(hd), cell * 0.46, 0, 7); g.fill(); g.stroke();
        g.strokeStyle = '#FFFFFF'; g.globalAlpha = 0.6; g.lineWidth = 2;
        g.beginPath(); g.arc(cx(hd), cy(hd), cell * 0.3, Math.PI * 1.1, Math.PI * 1.5); g.stroke();
        g.globalAlpha = 1;
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
          numEl.textContent = String(eaten); pop(numEl);
          place();
          if (!apple) return die(true);
          if (eaten % 5 === 0) F.cheer(8);
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
