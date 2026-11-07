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
      const wrap = F.h('<div style="max-width:340px;margin:8px auto;text-align:center"></div>');
      const head = F.h('<div class="info-line" style="min-height:26px"></div>');
      const pan = F.h(`<div style="position:relative;height:150px;margin:6px 0">
        <div class="pf-pan" style="position:absolute;left:8%;right:8%;bottom:14px;height:34px;border:3px solid var(--ink);border-radius:50%;background:var(--ink-faint);box-shadow:var(--shadow)"></div>
        <div class="pf-cake" style="position:absolute;left:50%;bottom:34px;width:170px;height:46px;margin-left:-85px;border:3px solid var(--ink);border-radius:50%;transition:bottom .35s ease-out,transform .35s ease-out"></div>
      </div>`);
      const cake = pan.querySelector('.pf-cake');
      const gauge = F.h('<div style="position:relative;height:34px;border:3px solid var(--ink);border-radius:12px;overflow:hidden;margin:8px 0"><div class="pf-mark" style="position:absolute;top:0;bottom:0;width:6px;margin-left:-3px;background:var(--ink);border-radius:3px"></div></div>');
      const mark = gauge.querySelector('.pf-mark');
      const hint = F.h('<div class="info-line" style="min-height:24px;font-size:15px"></div>');
      const btn = F.h(`<button style="width:100%;min-height:64px;font-size:26px;border:3px solid var(--ink);border-radius:16px;background:var(--accent);color:#2B2522;box-shadow:var(--shadow);cursor:pointer;touch-action:manipulation"></button>`);
      btn.textContent = F.tt({ de: 'Wenden!', en: 'Flip!' });
      wrap.append(head, pan, gauge, hint, btn);
      ctx.el.appendChild(wrap);

      const colorOf = (x) => `hsl(38, 72%, ${Math.round(82 - 50 * Math.min(1, x))}%)`;
      const showHead = () => {
        head.textContent = F.tt({ de: `Pfannkuchen ${n + 1}/${TOTAL} · Seite ${side + 1}/2 · ${total} Pkt.`, en: `Pancake ${n + 1}/${TOTAL} · side ${side + 1}/2 · ${total} pts` });
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
        hint.textContent = burnt ? F.tt({ de: 'Verbrannt! 0 Punkte', en: 'Burnt! 0 points' })
          : F.tt({ de: golden ? `Goldrichtig! +${pts}` : (v < zone[0] ? `Noch roh. +${pts}` : `Schon dunkel. +${pts}`), en: golden ? `Golden! +${pts}` : (v < zone[0] ? `Still raw. +${pts}` : `A bit dark. +${pts}`) });
        cake.style.bottom = '110px'; cake.style.transform = 'rotateX(360deg)';
        await ctx.wait(380);
        cake.style.transition = 'none'; cake.style.transform = ''; cake.style.bottom = '34px';
        void cake.offsetWidth; cake.style.transition = 'bottom .35s ease-out,transform .35s ease-out';
        if (side === 0) { side = 1; }
        else { side = 0; n++; }
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
        hint.textContent = '';
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
