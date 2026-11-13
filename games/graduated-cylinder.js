/* Graduated Cylinder: pour liquid into a measuring cylinder up to a given volume, reading the scale like in the lab. */
(function () {
  const F = Funkloch;
  const LIQ = ['#4DB8E8', '#F2B84B', '#7BD389', '#E58BB5', '#A98BE8'];
  const ROUNDS = 5;
  const TOP = 24, BOT = 312, H = BOT - TOP; // y range of the tube inside the viewBox

  function tube(max, v, liq, ok) {
    const per = H / max;
    const ticks = [];
    const minor = max <= 50 ? 1 : 2;
    for (let m = 0; m <= max; m += minor) {
      const y = BOT - m * per, big = m % 10 === 0, mid = m % 5 === 0;
      ticks.push(`<path d="M${big ? 58 : mid ? 64 : 70},${y.toFixed(1)} H80" stroke-width="${big ? 2.6 : 1.6}"/>`);
      if (big) ticks.push(`<text x="52" y="${(y + 5).toFixed(1)}" text-anchor="end" font-size="15" stroke="none" style="fill:var(--ink)">${m}</text>`);
    }
    const off = ((1 - v / max) * H).toFixed(1);
    return `<svg class="motif" viewBox="0 0 150 350" style="width:100%;max-width:168px;transform:rotate(-1deg);overflow:visible" fill="none" stroke-linecap="round" stroke-linejoin="round">
      <defs><clipPath id="gc-clip"><rect x="80" y="${TOP}" width="46" height="${H}" rx="2"/></clipPath></defs>
      <ellipse cx="103" cy="338" rx="46" ry="9" style="fill:var(--accent);stroke:var(--ink)" stroke-width="3"/>
      <rect x="92" y="${BOT}" width="22" height="22" style="fill:var(--card);stroke:var(--ink)" stroke-width="3"/>
      <rect x="80" y="${TOP}" width="46" height="${H}" rx="3" style="fill:var(--card);stroke:var(--ink)" stroke-width="3.5"/>
      <g clip-path="url(#gc-clip)"><g style="transform:translateY(${off}px);transition:transform .22s ease-out">
        <rect x="80" y="${TOP}" width="46" height="${H + 10}" fill="${liq}" opacity=".85"/>
        <path d="M80,${TOP} Q103,${TOP + 9} 126,${TOP}" fill="${liq}" style="stroke:var(--ink)" stroke-width="2" opacity=".9"/></g></g>
      <rect x="80" y="${TOP}" width="46" height="${H}" rx="3" style="stroke:var(--ink)" stroke-width="3.5"/>
      <path d="M86,${TOP + 10} V${BOT - 30}" stroke="#fff" stroke-width="4" opacity=".55"/>
      <path d="M72,${TOP - 4} H132 L126,${TOP + 4} H80 Z" style="fill:var(--card);stroke:var(--ink)" stroke-width="3"/>
      <g style="stroke:var(--ink)">${ticks.join('')}</g>
      ${ok ? '<path d="M138,140 l8,10 l16,-22" style="stroke:var(--good)" stroke-width="6"/>' : ''}</svg>`;
  }

  F.registerGame({
    id: 'graduated-cylinder', skill: 'chem', added: '2026-11-13', glyph: '🧪',
    name: { de: 'Messzylinder', en: 'Graduated Cylinder' },
    desc: {
      de: 'Fülle die Flüssigkeit mit den Tasten bis zur verlangten Menge in mL. Lies die Skala am Messzylinder genau ab, die Zahl der aktuellen Menge siehst du nicht. Tippe dann auf "Fertig". Je kleiner die Abweichung, desto mehr Punkte. 5 Aufträge.',
      en: 'Pour the liquid with the buttons up to the asked amount in mL. Read the scale on the cylinder carefully: the current amount is not shown as a number. Then tap "Done". The smaller your error, the more points. 5 orders.',
    },
    start(ctx) {
      const r = ctx.rng;
      const max = ctx.level >= 3 ? 100 : 50;
      let round = 0, points = 0, perfect = 0, close = 0;
      let last = -1;

      function next() {
        if (round >= ROUNDS) return end();
        round++;
        const target = ctx.fresh(() => {
          for (let k = 0; k < 20; k++) {
            const t = ctx.level >= 3 ? r.int(7, max - 6) : r.int(2, max / 5 - 1) * 5;
            if (t !== last) return t;
          }
          return 20;
        }, (t) => t);
        last = target;
        const liq = LIQ[(round * 2 + r.int(0, 1)) % LIQ.length];
        let v = 0, done = false;
        ctx.setInfo(`${round} / ${ROUNDS}`); ctx.setScore(points);
        ctx.el.innerHTML = '';
        const top = F.h('<div style="display:flex;gap:6px;align-items:flex-start;margin-top:6px"></div>');
        const left = F.h(`<div style="flex:0 0 168px">${tube(max, 0, liq, false)}</div>`);
        const right = F.h('<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:10px;padding-top:10px"></div>');
        right.innerHTML = `<div class="card sketch" style="text-align:center;padding:12px 6px;background:var(--c-chem);transform:rotate(1deg)">
          <div style="font-size:18px">${F.tt({ de: 'Fülle bis', en: 'Fill up to' })}</div>
          <div style="font-size:46px;line-height:1.1">${target}</div><div style="font-size:20px">mL</div></div>`;
        const msg = F.h('<div class="info-line" style="text-align:center;min-height:48px;font-size:17px"></div>');
        const pad = F.h('<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px"></div>');
        const steps = [10, 5, 1, -10, -5, -1];
        steps.forEach((d) => {
          const b = F.h(`<button style="min-width:0;padding:0;min-height:58px;font-size:21px;background:var(--${d > 0 ? 'card' : 'paper-2'});color:var(--ink);border:2.5px solid var(--ink);border-radius:12px 16px 12px 14px;box-shadow:var(--shadow);cursor:pointer">${d > 0 ? '+' : '−'}${Math.abs(d)}</button>`);
          b.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            if (done) return;
            const nv = Math.max(0, Math.min(max, v + d));
            b.classList.remove('tap-pop'); void b.offsetWidth; b.classList.add('tap-pop');
            if (nv === v) { ctx.sfx('bad'); return; }
            v = nv; ctx.sfx('tap');
            left.querySelector('g[clip-path] > g').style.transform = `translateY(${((1 - v / max) * H).toFixed(1)}px)`;
          });
          pad.appendChild(b);
        });
        right.appendChild(pad); right.appendChild(msg);
        top.appendChild(left); top.appendChild(right);
        const go = F.h(`<button class="btn primary big" style="width:100%;margin-top:10px;min-height:68px;font-size:24px">${F.tt({ de: 'Fertig', en: 'Done' })}</button>`);
        go.addEventListener('pointerdown', async (e) => {
          e.preventDefault();
          if (done) return;
          done = true;
          const err = Math.abs(v - target);
          const gain = err === 0 ? 20 : err <= 1 ? 14 : err <= 3 ? 8 : err <= 6 ? 3 : 0;
          points += gain; ctx.setScore(points);
          if (err === 0) perfect++;
          if (err <= 2) close++;
          left.innerHTML = tube(max, v, liq, err <= 1);
          msg.innerHTML = F.tt({ de: `Du: ${v} mL<br>Abweichung: ${err} mL`, en: `You: ${v} mL<br>Error: ${err} mL` }) + (gain ? ` · +${gain}` : '');
          if (err <= 1) { ctx.sfx('win'); F.cheer(8); right.firstElementChild.classList.add('flash-ok'); }
          else { ctx.sfx('bad'); right.firstElementChild.classList.add('flash-bad'); }
          await ctx.wait(1700);
          next();
        });
        ctx.el.appendChild(top); ctx.el.appendChild(go);
      }

      function end() {
        ctx.finish({
          score: points,
          detail: F.tt({ de: `${perfect} aufs mL genau, ${close} nah dran`, en: `${perfect} spot on, ${close} close` }),
          levelDelta: points >= 70 ? 1 : points < 30 ? -1 : 0,
          quality: Math.min(1, points / 90), ink: 3 + Math.round(points / 8),
        });
      }
      next();
    },
  });
})();
