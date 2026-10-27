/* Badges (Abzeichen): earned automatically after a game. Each check(D, info) gets the save data and the finished game. */
(function () {
  const F = Funkloch;
  const sumPlays = (D, filter) => Object.entries(D.games).reduce((a, [id, gd]) => {
    const g = F.game(id.split('@')[0]);
    return a + (g && !id.includes('@') && filter(g) ? gd.plays || 0 : 0);
  }, 0);
  const playedSkill = (D, skill) => sumPlays(D, (g) => g.skill === skill) > 0;
  const differentGames = (D) => Object.keys(D.games).filter((id) => !id.includes('@') && D.games[id].plays > 0 && F.game(id)).length;

  F.BADGES = [
    { id: 'first', icon: '🎈', name: { de: 'Erstes Spiel', en: 'First game' }, desc: { de: '1 Runde gespielt', en: 'Played 1 round' }, check: (D) => D.plays >= 1 },
    { id: 'plays50', icon: '🎮', name: { de: 'Dranbleiber', en: 'Keeps going' }, desc: { de: '50 Runden gespielt', en: 'Played 50 rounds' }, check: (D) => D.plays >= 50 },
    { id: 'plays250', icon: '🏆', name: { de: 'Spielprofi', en: 'Game pro' }, desc: { de: '250 Runden gespielt', en: 'Played 250 rounds' }, check: (D) => D.plays >= 250 },
    { id: 'explorer', icon: '🧭', name: { de: 'Entdecker', en: 'Explorer' }, desc: { de: '20 verschiedene Spiele ausprobiert', en: 'Tried 20 different games' }, check: (D) => differentGames(D) >= 20 },
    { id: 'allround', icon: '🧠', name: { de: 'Allrounder', en: 'All-rounder' }, desc: { de: 'Gedächtnis, Rechnen, Logik, Räumlich, Fokus und Chemie gespielt', en: 'Played memory, maths, logic, spatial, focus and chemistry' }, check: (D) => ['memory', 'math', 'logic', 'spatial', 'focus', 'chem'].every((s) => playedSkill(D, s)) },
    { id: 'records10', icon: '📈', name: { de: 'Rekordjäger', en: 'Record hunter' }, desc: { de: '10 Rekorde aufgestellt', en: 'Set 10 records' }, check: (D) => (D.recordCount || 0) >= 10 },
    { id: 'party', icon: '🎉', name: { de: 'Partylöwe', en: 'Party animal' }, desc: { de: '10 Mehrspieler-Runden', en: '10 multiplayer rounds' }, check: (D) => sumPlays(D, (g) => g.players >= 2) >= 10 },
    { id: 'daily1', icon: '☀️', name: { de: 'Tagesstart', en: 'Daily start' }, desc: { de: 'Erste Tages-Challenge geschafft', en: 'First daily challenge done' }, check: (D) => Object.keys(D.daily || {}).length >= 1 },
    { id: 'daily10', icon: '📅', name: { de: 'Stammgast', en: 'Regular' }, desc: { de: '10 Tages-Challenges', en: '10 daily challenges' }, check: (D) => Object.keys(D.daily || {}).length >= 10 },
    { id: 'streak3', icon: '🔥', name: { de: 'Warmgelaufen', en: 'Warmed up' }, desc: { de: '3 Tage Serie', en: '3-day streak' }, check: () => F.dailyStreak() >= 3 },
    { id: 'streak7', icon: '🌟', name: { de: 'Eine Woche', en: 'One week' }, desc: { de: '7 Tage Serie', en: '7-day streak' }, check: () => F.dailyStreak() >= 7 },
    { id: 'streak30', icon: '👑', name: { de: 'Unaufhaltsam', en: 'Unstoppable' }, desc: { de: '30 Tage Serie', en: '30-day streak' }, check: () => F.dailyStreak() >= 30 },
    { id: 'collector', icon: '🛍️', name: { de: 'Sammler', en: 'Collector' }, desc: { de: '5 Sachen im Laden gekauft', en: 'Bought 5 shop items' }, check: (D) => (D.owned || []).length >= 5 },
    { id: 'watercolour', icon: '🎨', name: { de: 'Kunstwerk', en: 'Masterpiece' }, desc: { de: 'Dein Freund ist ein Aquarell', en: 'Your buddy became a watercolour' }, check: () => F.buddyStage() >= 3 },
    { id: 'nightowl', icon: '🦉', name: { de: 'Nachteule', en: 'Night owl' }, desc: { de: 'Zwischen 23 und 4 Uhr gespielt', en: 'Played between 11 pm and 4 am' }, check: (D, info) => info && (info.hour >= 23 || info.hour < 4) },
    { id: 'earlybird', icon: '🐦', name: { de: 'Frühaufsteher', en: 'Early bird' }, desc: { de: 'Zwischen 5 und 7 Uhr gespielt', en: 'Played between 5 and 7 am' }, check: (D, info) => info && info.hour >= 5 && info.hour < 7 },
  ];

  // Returns the badges earned just now (and stores them).
  F.checkBadges = (info) => {
    const D = F.data;
    D.badges = D.badges || {};
    const fresh = [];
    F.BADGES.forEach((b) => {
      if (D.badges[b.id]) return;
      let ok = false;
      try { ok = b.check(D, info); } catch (e) {}
      if (ok) { D.badges[b.id] = F.today(); fresh.push(b); }
    });
    return fresh;
  };
})();
