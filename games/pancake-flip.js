/* Pancake Flip: flip each side when it is golden, not raw and not burnt. */
(function () {
  const F = Funkloch;
  const TOTAL = 8;

  F.registerGame({
    id: 'pancake-flip', skill: 'fun', added: '2026-11-05', glyph: '🥞',
    name: { de: 'Pfannkuchen wenden', en: 'Pancake Flip' },
    desc: {
      de: 'Der Pfannkuchen brät, die Anzeige füllt sich. Tippe auf «Wenden», wenn der Zeiger im goldenen Bereich ist. Jede Seite gibt bis zu 100 Punkte, verbrannt gibt 0. Brate 8 Pfannkuchen mit zusammen mindestens 1000 Punkten.',
      en: 'The pancake sizzles and the gauge fills. Tap "Flip" when the marker is in the golden zone. Each side scores up to 100, burnt scores 0. Cook 8 pancakes for at least 1000 points together.',
    },
    start(ctx) {
      const r = ctx.rng;
      const lvl = Math.max(0, Math.min(10, ctx.level || 0));
      const fillSec = Math.max(1.8, 4.2 - lvl * 0.22);       // seconds from raw to burnt
      const zoneW = Math.max(0.12, 0.26 - lvl * 0.014);       // width of the golden zone
      let n = 0, side = 0, total = 0, v = 0, zone = [0, 0], busy = true, over = false, sideScores = [];

      ctx.el.innerHTML = '';
      const wrap = F.h('<div style="max-width:340px;margin:4px auto 0;text-align:center"></div>');
      // the round counter lives in the free info line above the stage
      const head = { set textContent(v) { ctx.setInfo(F.esc(v)); } };
      // eight little pancakes: done, current, still to come
      const plates = F.h('<div style="display:flex;justify-content:center;gap:6px;min-height:28px"></div>');
      const plateIcons = Array.from({ length: TOTAL }, () => {
        const el = F.h('<svg viewBox="0 0 36 22" width="36" height="22" aria-hidden="true" style="display:block"><ellipse cx="18" cy="12" rx="15" ry="7.5" style="stroke-width:2.2"/></svg>');
        plates.appendChild(el);
        return el;
      });
      // hand-drawn stove: pan with handle, burner and steam; the cake is a div on top so it can flip
      const pan = F.h(`<div style="position:relative;height:300px;margin:6px 0 0">
        <svg class="motif" viewBox="0 0 340 290" width="340" height="290" aria-hidden="true" style="position:absolute;left:50%;top:10px;margin-left:-170px;max-width:none">
          <g style="fill:none;stroke:var(--ink-faint);stroke-width:3;stroke-linecap:round">
            <path d="M140 92c-8-12 8-18 0-30s6-18 0-28"/><path d="M172 84c-8-12 8-18 0-30s6-18 0-28"/><path d="M204 92c-8-12 8-18 0-30s6-18 0-28"/>
          </g>
          <path d="M14 262c60-3 250-2 312 1" style="fill:none;stroke:var(--ink);stroke-width:3;stroke-linecap:round"/>
          <g style="stroke:var(--ink);stroke-width:1.4;opacity:.35">
            <path d="M24 284l14-18M50 284l14-18M76 284l14-18M102 284l14-18M128 284l14-18M154 284l14-18M180 284l14-18M206 284l14-18M232 284l14-18M258 284l14-18M284 284l14-18M310 284l14-18"/>
          </g>
          <path d="M96 258c8-14 140-15 150 1" style="fill:var(--bad);stroke:var(--ink);stroke-width:2.5;stroke-linejoin:round;opacity:.85"/>
          <path d="M262 224c26-4 52-6 70-3 4 1 4 9 0 10-18 3-44 2-70-1z" style="fill:var(--ink-soft);stroke:var(--ink);stroke-width:3;stroke-linejoin:round"/>
          <path d="M28 214c2-22 270-24 280-1 3 26-36 40-140 41C66 255 24 238 28 214z" style="fill:var(--ink-faint);stroke:var(--ink);stroke-width:3;stroke-linejoin:round"/>
          <path d="M44 212c6-14 238-15 248 0-8 14-238 15-248 0z" style="fill:var(--paper-2);stroke:var(--ink);stroke-width:2.2;stroke-linejoin:round"/>
          <path d="M60 236c30 8 90 10 150 6" style="fill:none;stroke:#FFFFFF;stroke-width:3;stroke-linecap:round;opacity:.45"/>
        </svg>
        <div class="pf-cake" style="position:absolute;left:50%;bottom:56px;width:190px;height:50px;margin-left:-95px;border:3px solid var(--ink);border-radius:50%;transition:transform .35s ease-out">
          <i style="position:absolute;left:20%;top:16%;width:38%;height:34%;border-top:3px solid #FFFFFF;border-radius:50%;opacity:.55"></i>
        </div>
      </div>`);
      const cake = pan.querySelector('.pf-cake');
      const gauge = F.h('<div style="position:relative;height:54px;border:3px solid var(--ink);border-radius:14px 18px 12px 16px;overflow:hidden;margin:6px 0 0;box-shadow:var(--shadow)"><div class="pf-mark" style="position:absolute;top:0;bottom:0;width:8px;margin-left:-4px;background:var(--ink);border-radius:4px"></div></div>');
      const mark = gauge.querySelector('.pf-mark');
      const hint = F.h('<div class="info-line" style="min-height:40px;font-size:24px;margin-top:8px;display:flex;align-items:center;justify-content:center"><span></span></div>');
      const hintText = hint.firstChild;
      const btn = F.h(`<button class="btn primary big" style="min-height:96px;font-size:32px;margin-top:6px;touch-action:manipulation"></button>`);
      btn.textContent = F.tt({ de: 'Wenden!', en: 'Flip!' });
      wrap.append(plates, pan, gauge, hint, btn);
      ctx.el.appendChild(wrap);
      const pop = (el) => { el.classList.remove('tap-pop'); void el.offsetWidth; el.classList.add('tap-pop'); };
      const showPlates = () => plateIcons.forEach((el, i) => {
        const e = el.firstChild;
        e.style.fill = i < n ? 'var(--c-math)' : i === n ? 'var(--card)' : 'none';
        e.style.stroke = i === n ? 'var(--accent)' : i < n ? 'var(--ink)' : 'var(--ink-faint)';
        e.style.strokeDasharray = i > n ? '4 3' : '';
      });
      const sideGolden = [];

      const colorOf = (x) => `hsl(38, 72%, ${Math.round(82 - 50 * Math.min(1, x))}%)`;
      const showHead = () => {
        head.textContent = F.tt({ de: `Pfannkuchen ${n + 1}/${TOTAL} · Seite ${side + 1}/2 · ${total} Pkt.`, en: `Pancake ${n + 1}/${TOTAL} · side ${side + 1}/2 · ${total} pts` });
        showPlates();
      };
      function newSide() {
        v = 0;
        const lo = 0.30 + r() * (0.62 - zoneW - 0.30);
        zone = [lo, lo + zoneW];
        const a = Math.round(zone[0] * 100), b = Math.round(zone[1] * 100);
        gauge.style.background = `linear-gradient(90deg, var(--ink-faint) 0%, var(--ink-faint) ${a}%, #E8B84A ${a}%, #E8B84A ${b}%, var(--bad) ${b}%, var(--bad) 100%)`;
        cake.style.background = colorOf(0);
        showHead();
      }
      const pointsAt = (x) => {
        if (x >= 1) return 0;
        const mid = (zone[0] + zone[1]) / 2, half = zoneW / 2;
        if (x >= zone[0] && x <= zone[1]) return Math.round(100 - 40 * Math.abs(x - mid) / half);
        if (x < zone[0]) return Math.round(35 * x / zone[0]);
        return Math.max(0, Math.round(35 * (1 - (x - zone[1]) / (1 - zone[1])) * 0.8));
      };

      async function flip(burnt) {
        if (busy || over) return;
        busy = true;
        const pts = burnt ? 0 : pointsAt(v);
        total += pts; sideScores.push(pts);
        ctx.setScore(total);
        const golden = v >= zone[0] && v <= zone[1];
        ctx.sfx(burnt ? 'bad' : golden ? 'good' : 'tick');
        hintText.textContent = burnt ? F.tt({ de: 'Verbrannt! 0 Punkte', en: 'Burnt! 0 points' })
          : F.tt({ de: golden ? `Goldrichtig! +${pts}` : (v < zone[0] ? `Noch roh. +${pts}` : `Schon dunkel. +${pts}`), en: golden ? `Golden! +${pts}` : (v < zone[0] ? `Still raw. +${pts}` : `A bit dark. +${pts}`) });
        hintText.style.color = burnt ? 'var(--bad)' : golden ? 'var(--ink)' : 'var(--ink-soft)';
        pop(hint); pop(btn);
        sideGolden[side] = golden && !burnt;
        cake.style.transform = 'translateY(-76px) rotateX(360deg)';
        await ctx.wait(380);
        cake.style.transition = 'none'; cake.style.transform = '';
        void cake.offsetWidth; cake.style.transition = 'transform .35s ease-out';
        if (side === 0) { side = 1; }
        else {
          side = 0; n++;
          if (n < TOTAL && sideGolden[0] && sideGolden[1]) F.cheer(8);
        }
        if (n >= TOTAL) return finish();
        newSide();
        await ctx.wait(250);
        busy = false;
      }
      btn.addEventListener('pointerdown', (e) => { e.preventDefault(); flip(false); });

      let last = performance.now();
      const iv = setInterval(() => {
        const now = performance.now(), dt = Math.min(0.1, (now - last) / 1000); last = now;
        if (busy || over) return;
        v += dt / fillSec;
        cake.style.background = colorOf(v);
        mark.style.left = Math.min(100, v * 100) + '%';
        if (v >= 1) flip(true);
      }, 33);
      ctx.onCleanup(() => clearInterval(iv));

      async function finish() {
        over = true; clearInterval(iv);
        const win = total >= 1000;
        ctx.sfx(win ? 'win' : 'bad');
        head.textContent = F.tt(win ? { de: 'Bestes Frühstück!', en: 'Best breakfast!' } : { de: 'Fertig serviert', en: 'Served up' });
        hintText.textContent = ''; showPlates();
        await ctx.wait(1000);
        ctx.finish({
          score: total, detail: F.tt({ de: `${total} Punkte von 1600`, en: `${total} points out of 1600` }),
          levelDelta: total >= 1100 ? 1 : total < 700 ? -1 : 0, quality: Math.min(1, total / 1400), ink: 3 + Math.round(total / 100),
        });
      }
      newSide();
      ctx.setScore(0);
      ctx.wait(500).then(() => { busy = false; });
    },
  });
})();
