/* Rock Paper Scissors: everyone picks secretly in their own zone, then all picks are revealed. */
(function () {
  const F = Funkloch;
  const SYM = ['✊', '✋', '✌️']; // 0 rock, 1 paper, 2 scissors; k beats (k + 2) % 3
  const beats = (a, b) => (a + 2) % 3 === b;

  // Returns the winner indices of one reveal (reversed = the weaker hand wins), or [] for a draw.
  function judge(picks, reversed) {
    const kinds = new Set(picks);
    if (kinds.size !== 2) return [];
    const [x, y] = [...kinds];
    const strong = beats(x, y) ? x : y;
    const win = reversed ? (strong === x ? y : x) : strong;
    return picks.map((p, i) => (p === win ? i : -1)).filter((i) => i >= 0);
  }

  F.registerGame({
    id: 'rock-paper-scissors', skill: 'duo', added: '2026-10-26', glyph: '✊✋', players: 2, maxPlayers: 4,
    name: { de: 'Schere, Stein, Papier', en: 'Rock Paper Scissors' },
    desc: { de: 'Alle wählen heimlich in ihrem Feld Stein ✊, Papier ✋ oder Schere ✌️. Dann werden alle gleichzeitig aufgedeckt. Stein schlägt Schere, Schere schlägt Papier, Papier schlägt Stein. Manchmal gilt die Umkehr-Regel 🔄: dann gewinnt die schwächere Hand. Wer zuerst 4 Punkte hat, gewinnt.', en: 'Everyone secretly picks rock ✊, paper ✋ or scissors ✌️ in their own zone. Then all hands are revealed together. Rock beats scissors, scissors beat paper, paper beats rock. Sometimes the reverse rule 🔄 applies: then the weaker hand wins. First to 4 points wins.' },
    modes: F.partyModes(),
    noLevel: true, formatBest: () => '✊',
    start(ctx) {
      F.partyMatch(ctx, {
        n: +ctx.mode || 2, win: 4,
        async round(api) {
          const reversed = api.r.chance(0.3);
          const picks = Array(api.n).fill(-1);
          const rule = reversed ? F.tt({ de: '🔄 Umkehr: Schwächere Hand gewinnt', en: '🔄 Reverse: weaker hand wins' }) : F.tt({ de: 'Normale Regeln', en: 'Normal rules' });
          let reveal = false;
          const paint = (i) => {
            const z = api.zones[i];
            z.body.innerHTML = `<div style="font-size:15px">${rule}</div>`;
            if (reveal) {
              z.body.insertAdjacentHTML('beforeend', `<div class="pz-big" style="font-size:54px">${SYM[picks[i]]}</div>`);
            } else if (picks[i] >= 0) {
              z.body.insertAdjacentHTML('beforeend', `<div class="pz-big" style="font-size:26px">${F.tt({ de: 'Bereit ✓', en: 'Ready ✓' })}</div>`);
            } else {
              z.body.appendChild(F.zoneOptions(SYM, (k) => {
                if (picks[i] >= 0 || reveal) return;
                picks[i] = k; ctx.sfx('tap');
                paint(i);
                if (picks.every((p) => p >= 0)) go();
              }, 3));
            }
          };
          let go = () => {};
          const done = new Promise((res) => { go = res; });
          api.zones.forEach((_, i) => paint(i));
          await done;
          if (ctx.dead) return null;
          reveal = true;
          api.zones.forEach((_, i) => paint(i));
          return judge(picks, reversed);
        },
      });
    },
  });
})();
