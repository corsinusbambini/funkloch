/* Dots and Boxes: take turns drawing a line between two dots. Close a box to own it and go again. */
(function () {
  const F = Funkloch;
  const D = 4;            // dots per side -> 3x3 boxes
  const B = D - 1, GAP = 80, PAD = 24, SIZE = PAD * 2 + GAP * B;
  const NS = 'http://www.w3.org/2000/svg';

  F.registerGame({
    id: 'dots-boxes', skill: 'duo', added: '2026-10-23', glyph: '🔲', players: 2, maxPlayers: 4,
    name: { de: 'Käsekästchen', en: 'Dots and Boxes' },
    desc: { de: 'Ihr wechselt euch ab: tippe zwischen zwei Punkte, um eine Linie zu ziehen. Wer ein Kästchen schliesst, bekommt es und darf nochmal. Wer am Ende die meisten Kästchen hat, gewinnt die Runde. Wer zuerst 2 Runden hat, gewinnt.', en: 'Take turns: tap between two dots to draw a line. Close a box to claim it and go again. Most boxes wins the round. First to 2 rounds wins.' },
    modes: F.partyModes(),
    noLevel: true, formatBest: () => '🔲',
    start(ctx) {
      const n = +ctx.mode || 2;
      let play = () => {};
      F.partyMatch(ctx, {
        n, win: 2,
        async round(api) {
          const root = api.board.root;
          // edges: horizontal h(y,x) y<D,x<B ; vertical v(y,x) y<B,x<D
          const hOwn = Array(D * B).fill(false), vOwn = Array(B * D).fill(false);
          const box = Array(B * B).fill(-1);
          const owned = Array(n).fill(0);
          let turn = (api.roundNo - 1) % n, done = false, drawn = 0;
          const total = D * B * 2;

          const wrap = F.h('<div style="position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:min(88vw,300px);z-index:32;touch-action:none"></div>');
          const svg = document.createElementNS(NS, 'svg');
          svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
          svg.style.cssText = 'width:100%;display:block;background:var(--paper-2);border:2.5px solid var(--ink);border-radius:14px;box-shadow:var(--shadow);color:var(--ink)';
          wrap.appendChild(svg);
          root.appendChild(wrap);
          ctx.onCleanup(() => wrap.remove());
          const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); svg.appendChild(e); return e; };

          const boxEls = [];
          for (let y = 0; y < B; y++) for (let x = 0; x < B; x++) {
            boxEls[y * B + x] = el('rect', { x: PAD + x * GAP + 6, y: PAD + y * GAP + 6, width: GAP - 12, height: GAP - 12, rx: 8, fill: 'none' });
          }
          const edges = []; // {line, hit, own:[arr,idx], boxes:[...]}
          const mk = (horiz, y, x) => {
            const x1 = PAD + x * GAP, y1 = PAD + y * GAP, x2 = horiz ? x1 + GAP : x1, y2 = horiz ? y1 : y1 + GAP;
            const line = el('line', { x1, y1, x2, y2, stroke: 'var(--ink-faint)', 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-dasharray': '2 9' });
            const hit = el('line', { x1, y1, x2, y2, stroke: 'transparent', 'stroke-width': 34, 'stroke-linecap': 'round' });
            const arr = horiz ? hOwn : vOwn, idx = horiz ? y * B + x : y * D + x;
            // boxes touching this edge
            const bs = [];
            if (horiz) { if (y > 0) bs.push((y - 1) * B + x); if (y < B) bs.push(y * B + x); }
            else { if (x > 0) bs.push(y * B + x - 1); if (x < B) bs.push(y * B + x); }
            const e = { line, arr, idx, bs };
            hit.addEventListener('pointerdown', (ev) => { ev.preventDefault(); ev.stopPropagation(); play(e); });
            edges.push(e);
          };
          for (let y = 0; y < D; y++) for (let x = 0; x < B; x++) mk(true, y, x);
          for (let y = 0; y < B; y++) for (let x = 0; x < D; x++) mk(false, y, x);
          for (let y = 0; y < D; y++) for (let x = 0; x < D; x++) el('circle', { cx: PAD + x * GAP, cy: PAD + y * GAP, r: 7, fill: 'var(--ink)' });

          const full = (b) => {
            const x = b % B, y = Math.floor(b / B);
            return hOwn[y * B + x] && hOwn[(y + 1) * B + x] && vOwn[y * D + x] && vOwn[y * D + x + 1];
          };
          const status = () => api.zones.forEach((z, i) => {
            z.body.innerHTML = `<div class="pz-big" style="font-size:${done ? 30 : 24}px">${done ? owned[i] : i === turn ? F.tt({ de: 'Du bist dran!', en: 'Your turn!' }) : owned[i] + ' 🔲'}</div>`;
            z.el.style.opacity = !done && i !== turn ? '.55' : '';
          });
          status();

          return new Promise((res) => {
            const finish = async () => {
              done = true; status();
              await ctx.wait(1200);
              wrap.remove();
              api.zones.forEach((z) => (z.el.style.opacity = ''));
              const best = Math.max(...owned);
              const ws = owned.map((v, i) => (v === best ? i : -1)).filter((i) => i >= 0);
              res(ws.length === n ? null : ws);
            };
            play = (e) => {
              if (done || e.arr[e.idx]) return;
              e.arr[e.idx] = true; drawn++;
              e.line.setAttribute('stroke', F.playerColor(turn));
              e.line.setAttribute('stroke-width', 7);
              e.line.removeAttribute('stroke-dasharray');
              let got = 0;
              e.bs.forEach((b) => {
                if (box[b] === -1 && full(b)) {
                  box[b] = turn; owned[turn]++; got++;
                  boxEls[b].setAttribute('fill', F.playerColor(turn));
                  boxEls[b].setAttribute('fill-opacity', '.55');
                }
              });
              ctx.sfx(got ? 'good' : 'tap');
              if (drawn === total) return finish();
              if (!got) turn = (turn + 1) % n;
              status();
            };
          });
        },
      });
    },
  });
})();
