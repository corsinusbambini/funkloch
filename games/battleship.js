/* Battleship (solo): find and sink the hidden fleet with as few shots as possible. */
(function () {
  const F = Funkloch;
  const N = 8;
  const FLEETS = [[3, 3, 2, 2], [4, 3, 3, 2, 2], [5, 4, 3, 3, 2]];

  function place(r, fleet) {
    for (let attempt = 0; attempt < 60; attempt++) {
      const occ = new Array(N * N).fill(-1), ships = [];
      let okAll = true;
      for (let s = 0; s < fleet.length && okAll; s++) {
        let placed = false;
        for (let t = 0; t < 120 && !placed; t++) {
          const horiz = r() < 0.5, len = fleet[s];
          const x = Math.floor(r() * (horiz ? N - len + 1 : N)), y = Math.floor(r() * (horiz ? N : N - len + 1));
          const cells = [];
          for (let k = 0; k < len; k++) cells.push((horiz ? y : y + k) * N + (horiz ? x + k : x));
          if (cells.some((c) => touches(occ, c))) continue;
          cells.forEach((c) => { occ[c] = s; });
          ships.push(cells); placed = true;
        }
        if (!placed) okAll = false;
      }
      if (okAll) return { occ, ships };
    }
    // deterministic fallback: pack ships into every second row
    const occ = new Array(N * N).fill(-1), ships = [];
    let row = 0, col = 0;
    fleet.forEach((len, s) => {
      if (col + len > N) { row += 2; col = 0; }
      const cells = [];
      for (let k = 0; k < len; k++) cells.push(row * N + col + k);
      cells.forEach((c) => { occ[c] = s; });
      ships.push(cells); col += len + 1;
    });
    return { occ, ships };
  }
  function touches(occ, c) {
    const y = Math.floor(c / N), x = c % N;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const yy = y + dy, xx = x + dx;
      if (yy >= 0 && yy < N && xx >= 0 && xx < N && occ[yy * N + xx] >= 0) return true;
    }
    return false;
  }

  F.registerGame({
    id: 'battleship', skill: 'spatial', added: '2026-11-03', glyph: '🚢',
    name: { de: 'Schiffe versenken', en: 'Battleship' },
    desc: {
      de: 'Eine versteckte Flotte liegt im Meer. Tippe Felder an, um zu schiessen. Schiffe berühren sich nie, auch nicht diagonal. Versenke alle Schiffe mit möglichst wenigen Schüssen.',
      en: 'A hidden fleet lies in the sea. Tap squares to fire. Ships never touch, not even diagonally. Sink every ship with as few shots as possible.',
    },
    start(ctx) {
      const r = ctx.rng;
      const fleet = FLEETS[ctx.level >= 4 ? 2 : ctx.level >= 2 ? 1 : 0];
      const { occ, ships } = place(r, fleet);
      const state = new Array(N * N).fill(0); // 0 unknown, 1 water, 2 hit, 3 sunk
      const sunk = new Array(ships.length).fill(false);
      let shots = 0, over = false;

      ctx.el.innerHTML = '';
      // drawn motif: a paper boat on doodle waves with a spyglass
      const motif = F.h(`<svg class="motif" viewBox="0 0 300 74" width="340" height="84" aria-hidden="true" style="transform:rotate(-1.5deg)">
        <g fill="none" stroke="var(--ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M6 58 q12 -9 24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0 t24 0" />
          <path d="M40 68 q10 -6 20 0 t20 0 t20 0 M190 68 q10 -6 20 0 t20 0 t20 0" stroke="var(--ink-soft)" stroke-width="2"/>
          <path d="M104 50 L196 49 L182 63 L117 64 Z" fill="var(--c-focus)"/>
          <path d="M120 49 L150 14 L151 48" fill="var(--card)"/>
          <path d="M154 48 L156 22 L180 47" fill="var(--c-fun)"/>
          <path d="M126 56 L176 55" stroke-width="1.6" stroke-dasharray="4 5"/>
          <path d="M228 26 l34 -12 l5 13 l-34 12 Z" fill="var(--c-math)"/>
          <path d="M262 14 l9 -3 l5 13 l-9 3" fill="var(--card)"/>
          <path d="M240 34 l4 14 M248 31 l5 15"/>
          <path d="M34 22 l4 -9 l4 9 l9 1 l-7 6 l2 9 l-8 -5 l-8 5 l2 -9 l-7 -6 Z" fill="var(--c-math)"/>
        </g></svg>`);
      // drawn fleet: one hull per ship, sunk ones get crossed out
      const fleetBox = F.h('<div class="sketch" style="background:var(--card);box-shadow:var(--shadow);margin:8px auto 22px;padding:8px;display:flex;flex-direction:column;align-items:center;gap:4px;transform:rotate(.6deg)"></div>');
      const fleetLabel = F.h('<span style="font-size:18px;color:var(--ink-soft);white-space:nowrap"></span>');
      const fleetSvg = F.h('<span style="display:flex;align-items:center;justify-content:center;gap:8px;flex-wrap:nowrap;min-width:0"></span>');
      fleetBox.append(fleetLabel, fleetSvg);
      const seg = 12;
      const hull = (len, gone) => {
        const w = len * seg + 10;
        let s = `<svg viewBox="0 0 ${w} 26" width="${w}" height="26" style="display:block;flex:none;opacity:${gone ? 0.45 : 1}"><g stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round">`;
        s += `<path d="M2 9 L${w - 2} 9 L${w - 8} 21 L8 21 Z" fill="${gone ? 'var(--paper-2)' : 'var(--c-focus)'}"/>`;
        for (let k = 1; k < len; k++) s += `<path d="M${5 + k * seg} 11 L${5 + k * seg} 19" stroke-width="1.4"/>`;
        s += `<path d="M${w / 2 - 5} 9 L${w / 2 - 4} 3 L${w / 2 + 4} 3 L${w / 2 + 5} 9" fill="var(--card)"/>`;
        if (gone) s += `<path d="M3 4 L${w - 3} 24 M3 24 L${w - 3} 4" stroke="var(--bad)" stroke-width="3"/>`;
        return s + '</g></svg>';
      };
      const order = fleet.map((l, k) => k).sort((a, b) => fleet[b] - fleet[a]);
      // sea chart: letters on top, numbers on the left
      const chart = F.h('<div class="sketch" style="background:var(--paper-2);box-shadow:var(--shadow);padding:6px 8px 8px 4px"></div>');
      const top = F.h(`<div style="display:grid;grid-template-columns:20px repeat(${N},minmax(0,1fr));gap:3px;margin-bottom:2px"></div>`);
      top.appendChild(F.h('<span></span>'));
      for (let x = 0; x < N; x++) top.appendChild(F.h(`<span style="text-align:center;font-size:16px;line-height:1.1;color:var(--ink-soft)">${'ABCDEFGH'[x]}</span>`));
      const body = F.h(`<div style="display:grid;grid-template-columns:20px minmax(0,1fr);gap:3px"></div>`);
      const nums = F.h(`<div style="display:grid;grid-template-rows:repeat(${N},minmax(0,1fr));gap:3px"></div>`);
      for (let y = 0; y < N; y++) nums.appendChild(F.h(`<span style="display:flex;align-items:center;justify-content:center;font-size:16px;color:var(--ink-soft)">${y + 1}</span>`));
      const board = F.h(`<div style="display:grid;grid-template-columns:repeat(${N},minmax(0,1fr));gap:3px;touch-action:manipulation"></div>`);
      body.append(nums, board);
      chart.append(top, body);
      const btns = [];
      for (let i = 0; i < N * N; i++) {
        const b = F.h('<button style="aspect-ratio:1;min-width:0;min-height:0;padding:0;border:2px solid var(--ink);border-radius:7px 9px 6px 8px;line-height:0;cursor:pointer;color:var(--ink);background:var(--c-focus);overflow:hidden"></button>');
        b.onclick = () => fire(i);
        board.appendChild(b); btns.push(b);
      }
      ctx.el.append(motif, fleetBox, chart);

      // cell drawings (no ids, everything from the index, no randomness)
      const SW = '<svg viewBox="0 0 40 40" style="width:100%;height:100%;display:block">';
      const DARK = '#2B2522';
      const cellArt = (s, i) => {
        if (s === 0) {
          const o = (i * 7) % 3 * 4, x = (i * 5) % 2 * 4;
          return `${SW}<path d="M${4 + x} ${15 + o} q5 -4 10 0 t10 0" fill="none" stroke="var(--ink-soft)" stroke-width="2" stroke-linecap="round" opacity=".55"/></svg>`;
        }
        if (s === 1) return `${SW}<g fill="none" stroke="var(--ink-soft)" stroke-width="2" stroke-linecap="round"><circle cx="20" cy="21" r="4"/><path d="M11 13 l-3 -3 M29 13 l3 -3 M11 29 l-3 3 M29 29 l3 3" /></g></svg>`;
        if (s === 2) return `${SW}<g stroke="${DARK}" stroke-width="2" stroke-linejoin="round"><path d="M20 4 L24 14 L35 11 L28 20 L36 28 L25 27 L22 37 L17 28 L6 32 L12 22 L4 14 L15 15 Z" fill="var(--accent)"/><path d="M20 14 L22 19 L27 20 L22 23 L20 28 L18 23 L13 21 L18 19 Z" fill="var(--c-math)"/></g></svg>`;
        return `${SW}<g fill="none" stroke="${DARK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="20" cy="10" r="3.5"/><path d="M20 14 L20 33 M13 19 L27 19 M9 26 q3 8 11 7 q8 1 11 -7"/></g></svg>`;
      };
      const BG = ['var(--c-focus)', 'var(--paper)', 'var(--c-fun)', 'var(--bad)'];
      const shown = new Array(N * N).fill(-1);
      function draw() {
        state.forEach((s, i) => {
          const b = btns[i];
          if (shown[i] !== s) {
            b.innerHTML = cellArt(s, i);
            b.style.background = BG[s];
            if (shown[i] >= 0) { b.classList.remove('tap-pop'); void b.offsetWidth; b.classList.add('tap-pop'); }
            shown[i] = s;
          }
          b.disabled = over || s !== 0;
        });
        const left = fleet.filter((_, k) => !sunk[k]).length;
        fleetLabel.textContent = F.tt({ de: `Übrig ${left}`, en: `Left ${left}` });
        fleetSvg.innerHTML = order.map((k) => hull(fleet[k], sunk[k])).join('');
        ctx.setInfo(F.tt({ de: `${shots} Schüsse`, en: `${shots} shots` }));
      }

      function fire(i) {
        if (over || state[i] !== 0) return;
        shots++;
        if (occ[i] < 0) { state[i] = 1; ctx.sfx('tap'); } else {
          state[i] = 2;
          const k = occ[i];
          if (ships[k].every((c) => state[c] === 2)) {
            sunk[k] = true;
            ships[k].forEach((c) => {
              state[c] = 3;
              const y = Math.floor(c / N), x = c % N;
              for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
                const yy = y + dy, xx = x + dx;
                if (yy >= 0 && yy < N && xx >= 0 && xx < N && state[yy * N + xx] === 0) state[yy * N + xx] = 1;
              }
            });
            ctx.sfx('good');
            if (!sunk.every(Boolean)) F.cheer(8);
          } else ctx.sfx('good');
        }
        if (sunk.every(Boolean)) { over = true; draw(); return end(); }
        draw();
      }

      async function end() {
        await ctx.wait(700);
        const cells = ships.reduce((a, s) => a + s.length, 0);
        const score = Math.max(5, 100 - (shots - cells) * 2);
        ctx.finish({
          score, detail: F.tt({ de: `${shots} Schüsse`, en: `${shots} shots` }),
          levelDelta: shots <= cells + 18 ? 1 : shots >= cells + 38 ? -1 : 0,
          quality: Math.max(0.1, Math.min(1, 1 - (shots - cells) / 50)), ink: 4 + Math.max(0, Math.round((60 - shots) / 5)),
        });
      }
      draw();
    },
  });
})();
