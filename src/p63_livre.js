/* =========================================================
   Le Livre du Maître
   Un livre où l'on colle un sticker pour chaque moment marquant
   (les anciens hauts faits, et bien d'autres : premier du Val à
   atteindre un palier, boss vaincu, expédition sans un K.O.…).
   Chaque ère est un chapitre de 8 à 14 nuits, ouvert dans le
   livre. Les quatre donjons rivaux remplissent aussi le leur :
   à la fin du chapitre, premier = âge d'or (une relique d'ère,
   avec son pouvoir), dernier = âge sombre (un peu de notoriété
   perdue, et un pacte de développement à choisir parmi trois),
   l'or juste après le sombre = âge héroïque (deux reliques).
   Les stickers n'ont plus d'effet par eux-mêmes, mais certaines
   rencontres finissent autrement quand on les possède.
   ========================================================= */
const ERA_NAMES = ['du Réveil', 'des Lanternes', 'des Brumes', 'des Os dorés', 'du Grand Festin', 'des Chandelles', 'des Toiles', 'du Gel', 'des Crocs', 'des Grimoires', 'des Racines', 'du Tonnerre', 'des Masques', 'des Sorts perdus', 'des Cendres', 'de la Lune rousse', 'des Couronnes', 'des Murmures', 'des Champignons', 'du Chaudron', 'des Girouettes', 'des Clés rouillées', 'des Ronces', 'des Lucioles'];
const BOOK_LEN = [8, 14];   // la durée d'une ère, en nuits (réglable dans l'Atelier)
const ROMAN = n => ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX'][n] || String(n);
// les moments : les anciens hauts faits (sans leurs pouvoirs), et de nouveaux
const FIRSTS = [   // « premier du Val à… » : les rivaux peuvent te devancer
  { id: 'f_palier1', ico: '⭐', t: 'Premier du Val au Palier 1', d: 'Être le premier Maître du Val à atteindre le Palier 1.', test: () => S.tier >= 1, win: [9, 18] },
  { id: 'f_palier2', ico: '👑', t: 'Premier du Val au Palier 2', d: 'Être le premier à atteindre le Palier 2.', test: () => S.tier >= 2, win: [20, 36] },
  { id: 'f_palier3', ico: '🏰', t: 'Premier du Val au Palier 3', d: 'Être le premier à atteindre le Palier 3.', test: () => S.tier >= 3, win: [36, 60] },
  { id: 'f_boss', ico: '💀', t: 'Premier tombeur de boss', d: 'Être le premier à vaincre un boss d’expédition.', test: () => (S.stats.crawlBoss || 0) >= 1, win: [18, 34] },
  { id: 'f_rare', ico: '🦄', t: 'Premier à attirer une créature rare', d: 'Être le premier à accueillir une espèce rare.', test: () => Object.keys(S.album || {}).some(sp => SPECIES[sp] && SPECIES[sp].rare), win: [32, 56] },
  { id: 'f_dragon', ico: '🐉', t: 'Premier dragonnet du Val', d: 'Être le premier à attirer un dragonnet.', test: () => !!(S.album || {}).dragonnet, win: [24, 46] },
  { id: 'f_merveille', ico: '🏛️', t: 'Première Merveille du Val', d: 'Être le premier à bâtir une Merveille.', test: () => (S.stats.wonders || 0) >= 1, win: [20, 40] },
  { id: 'f_ambiance', ico: '🕯️', t: 'Le château le plus douillet', d: 'Être le premier à atteindre 40 d’Ambiance.', test: () => ambiance() >= 40, win: [26, 50] },
];
const MOMENTS = [
  ...FIRSTS.map(f => ({ ...f, pts: 3, first: true, cat: 'Premiers du Val' })),
  ...ACH.map(a => ({ id: a.id, ico: a.ico, t: a.name, d: a.desc, test: a.test, pts: ['archi', 'legende', 'rempart', 'collec', 'etages', 'epopee', 'fidele'].includes(a.id) ? 2 : 1, cat: a.cat, online: a.online })),
  { id: 'propre', ico: '✨', t: 'Sans une égratignure', d: 'Finir une expédition (au moins trois salles) sans aucun K.O.', pts: 2, cat: 'Profondeurs' },
  { id: 'boss3', ico: '☠️', t: 'Chasseur de boss', d: 'Vaincre trois boss d’expédition.', test: s => (s.stats.crawlBoss || 0) >= 3, pts: 2, cat: 'Profondeurs' },
  { id: 'grandesalle', ico: '🛋️', t: 'Une grande salle', d: 'Fusionner deux pièces du même type.', test: s => s.rooms.some(r => r.built && typeof mergeable === 'function' && mergeable(r) && groupSize(r) >= 2), pts: 1, cat: 'Bâtisseur' },
  { id: 'amb30', ico: '🔥', t: 'Un vrai cocon', d: 'Atteindre 30 d’Ambiance.', test: () => ambiance() >= 30, pts: 2, cat: 'Bâtisseur' },
  { id: 'deco40', ico: '🎨', t: 'Décorateur de génie', d: 'Coller 40 décorations.', test: s => s.stats.decor >= 40, pts: 2, cat: 'Bâtisseur' },
  { id: 'album16', ico: '📗', t: 'Un album bien rempli', d: 'Remplir 16 pages de l’album.', test: s => Object.keys(s.album).length >= 16, pts: 2, cat: 'Éleveur' },
  { id: 'album24', ico: '📚', t: 'L’album complet', d: 'Remplir tout l’album.', test: s => typeof MENAGERIE_SP !== 'undefined' && Object.keys(s.album).length >= MENAGERIE_SP.length, pts: 3, cat: 'Éleveur' },
  { id: 'pop30', ico: '🐾', t: 'Château grouillant', d: 'Héberger 30 créatures.', test: s => s.creatures.length >= 30, pts: 2, cat: 'Éleveur' },
  { id: 'fete', ico: '🎉', t: 'La première fête', d: 'Donner une Grande fête.', test: s => !!s.feteAt, pts: 1, cat: 'Éleveur' },
  { id: 'coup', ico: '🛡️', t: 'Coup déjoué', d: 'Déjouer le coup d’un rival.', test: s => (s.stats.coupsFoiled || 0) >= 1, pts: 2, cat: 'Stratège' },
  { id: 'forteresse', ico: '🏯', t: 'Forteresse', d: 'Repousser 10 invasions.', test: s => s.stats.repelled >= 10, pts: 2, cat: 'Stratège' },
  { id: 'crit3', ico: '🎯', t: 'La main heureuse', d: 'Obtenir trois critiques en raid.', test: s => (s.stats.crits || 0) >= 3, pts: 1, cat: 'Stratège' },
  { id: 'quete', ico: '📜', t: 'Au service du Val', d: 'Mener une quête du journal à bien.', test: s => (s.stats.questsRP || 0) >= 1, pts: 1, cat: 'Val' },
  { id: 'grandequete', ico: '🗡️', t: 'La grande quête', d: 'Vaincre le boss de la grande quête.', test: s => (s.stats.qboss || 0) >= 1, pts: 3, cat: 'Val' },
  { id: 'vassal', ico: '🏳️', t: 'Un premier vassal', d: 'Soumettre un donjon rival.', test: () => RIVALS.some(r => isVassal(r.id)), pts: 3, cat: 'Val' },
  { id: 'tresor', ico: '💎', t: 'Un trésor de dragon', d: 'Avoir 500 💰 en réserve.', test: s => s.gold >= 500, pts: 2, cat: 'Château' },
  { id: 'victoire', ico: '🏆', t: 'Une victoire du Val', d: 'Remporter l’une des cinq victoires.', test: s => (s.stats.victories || 0) >= 1, pts: 5, cat: 'Château' },
];
// les moments récurrents : chaque fois que ça arrive (avec un plafond par chapitre), pour que la course reste ouverte toute la partie
const RECUR = [
  { id: 'r_invasion', ico: '⚔️', t: 'Bande repoussée', pts: 1, cap: 3, v: s => s.stats.repelled || 0 },
  { id: 'r_boss', ico: '💀', t: 'Boss terrassé', pts: 2, cap: 2, v: s => s.stats.crawlBoss || 0 },
  { id: 'r_expe', ico: '🏰', t: 'Expédition menée', pts: 1, cap: 2, v: s => s.stats.crawls || 0 },
  { id: 'r_album', ico: '📒', t: 'Nouvelle page d’album', pts: 1, cap: 3, v: s => Object.keys(s.album || {}).length },
  { id: 'r_palier', ico: '⭐', t: 'Nouveau palier', pts: 2, cap: 1, v: s => s.tier || 0 },
  { id: 'r_crit', ico: '🎲', t: 'Raid critique', pts: 1, cap: 2, v: s => s.stats.crits || 0 },
  { id: 'r_envies', ico: '✦', t: 'Cinq envies comblées', pts: 1, cap: 2, v: s => Math.floor((s.stats.quests || 0) / 5) },
  { id: 'r_quete', ico: '📜', t: 'Quête du Val accomplie', pts: 1, cap: 2, v: s => s.stats.questsRP || 0 },
  { id: 'r_merveille', ico: '🏛️', t: 'Merveille agrandie', pts: 1, cap: 2, v: s => s.stats.wonders || 0 },
  { id: 'r_coup', ico: '🛡️', t: 'Coup déjoué', pts: 2, cap: 2, v: s => s.stats.coupsFoiled || 0 },
  { id: 'r_legende', ico: '🗿', t: 'Une légende de plus', pts: 2, cap: 2, v: s => s.creatures.filter(c => c.legend || c.evo).length },
  { id: 'r_artefact', ico: '🏺', t: 'Un artefact de plus', pts: 1, cap: 2, v: s => typeof artFound === 'function' ? artFound() : 0 },
  { id: 'r_vassal', ico: '🏳️', t: 'Un donjon soumis', pts: 3, cap: 2, v: () => RIVALS.filter(r => isVassal(r.id)).length },
  { id: 'r_fete', ico: '🎉', t: 'Une grande fête', pts: 1, cap: 1, v: s => s.feteAt || 0 },
];
const MOM_BY = Object.fromEntries([...MOMENTS, ...RECUR].map(m => [m.id, m]));
// les reliques d'ère (le pouvoir d'un ancien haut fait, gagné en âge d'or)
const RELICS_ERA = [
  { id: 'truelle', ico: '🧱', name: 'La Truelle bénie', pw: ['pierre'], d: '+1 segment de travaux chaque nuit.' },
  { id: 'plans', ico: '📐', name: 'Les Plans secrets', pw: ['archi'], d: 'Les pièces coûtent 1 💰 de moins.' },
  { id: 'oeil', ico: '🖼️', name: 'L’Œil de pie', pw: ['deco'], d: '+2 d’Ambiance.' },
  { id: 'cheminee', ico: '🕯️', name: 'Le Feu de cheminée', pw: ['cosy'], d: 'La Calamité monte d’un cran de moins chaque nuit.' },
  { id: 'paillasses', ico: '🛏️', name: 'Les Paillasses en rab', pw: ['accueil'], d: '+2 lits.' },
  { id: 'pheromones', ico: '🌸', name: 'Les Phéromones', pw: ['menagerie'], d: '+10 de réputation auprès de toutes les espèces.' },
  { id: 'serment', ico: '💞', name: 'Le Serment du château', pw: ['fidele'], d: 'Les risques de désertion sont divisés par deux.' },
  { id: 'carnet', ico: '📓', name: 'Le Carnet d’envies', pw: ['conteur'], d: '+1 💰 pour chaque envie comblée.' },
  { id: 'mentorat', ico: '🎓', name: 'Le Bâton du mentor', pw: ['chouchou'], d: '+1 XP à chaque gain d’expérience.' },
  { id: 'ballade', ico: '🎻', name: 'La Ballade héroïque', pw: ['epopee'], d: '+1 dé à tous les raids.' },
  { id: 'statue', ico: '🗿', name: 'La Statue au porche', pw: ['legende'], d: '+1 🔥 de notoriété chaque nuit.' },
  { id: 'huile', ico: '🫗', name: 'L’Huile à pièges', pw: ['repousse'], d: 'Tes pièges gagnent +1 en force.' },
  { id: 'sacoches', ico: '💰', name: 'Les Sacoches profondes', pw: ['pillard'], d: '+2 💰 de butin à chaque raid réussi.' },
  { id: 'trefle', ico: '🍀', name: 'Le Trèfle à quatre feuilles', pw: ['crit'], d: 'Une complication de raid sur deux est évitée.' },
  { id: 'coffre', ico: '🧰', name: 'Le Coffre du Maître', pw: ['palier1'], d: '+1 🪵 chaque nuit.' },
  { id: 'longuevue', ico: '🔭', name: 'La Longue-vue du Maître', pw: ['carto'], d: 'Tu vois une lieue plus loin sur la carte.' },
  { id: 'vitrines', ico: '🏺', name: 'Les Vitrines blindées', pw: ['collec'], d: 'Les héros ne peuvent plus voler d’artefacts.' },
  { id: 'montecharge', ico: '🪜', name: 'Le Monte-charge', pw: ['etages'], d: '+1 segment de travaux chaque nuit.' },
  { id: 'aimant', ico: '🧲', name: 'L’Aimant à monstres', pw: ['nuit20'], d: 'Les nouvelles créatures viennent plus volontiers.' },
];
const RELIC_BY = Object.fromEntries(RELICS_ERA.map(r => [r.id, r]));
// les pactes d'âge sombre : un vrai coup de pouce pour tout le chapitre suivant, contre une perte tout de suite
const PACTS = [
  { id: 'rangs', ico: '⚒️', name: 'Serrer les rangs', d: '+2 segments de travaux chaque nuit', pw: ['pierre', 'etages'], cost: '−25 % de notoriété', pay: () => { S.hype = Math.floor(S.hype * .75); } },
  { id: 'butin', ico: '🗡️', name: 'Tout pour le butin', d: '+1 dé et +2 💰 à chaque raid', pw: ['epopee', 'pillard'], cost: '+2 Menace', pay: () => { S.menace = Math.min(MENACE_MAX - 1, S.menace + 2); } },
  { id: 'portes', ico: '🚪', name: 'Portes ouvertes', d: 'les créatures viennent plus volontiers, +10 de réputation', pw: ['nuit20', 'menagerie'], cost: '−5 de loyauté pour toutes tes créatures', pay: () => { S.creatures.forEach(c => typeof addLoy === 'function' && addLoy(c, -5)); } },
  { id: 'guerre', ico: '🏗️', name: 'Économie de guerre', d: 'pièces 1 💰 moins chères, +1 🪵 chaque nuit', pw: ['archi', 'palier1'], cost: '−10 de bonne volonté dans chaque village', pay: () => { if (typeof settlements === 'function') settlements().forEach(s => addGw(s, -10)); } },
  { id: 'veillee', ico: '🔥', name: 'Veillées au coin du feu', d: '+2 d’Ambiance, la Calamité monte d’un cran de moins', pw: ['deco', 'cosy'], cost: '−20 % de ton or', pay: () => { S.gold = Math.floor(S.gold * .8); } },
  { id: 'ecole', ico: '📖', name: 'L’école du château', d: '+1 XP à chaque gain, rêves secrets confiés plus tôt', pw: ['chouchou', 'calins'], cost: '−15 💰 et −15 🪵', pay: () => { S.gold = Math.max(0, S.gold - 15); S.mat = Math.max(0, S.mat - 15); } },
];
const PACT_BY = Object.fromEntries(PACTS.map(p => [p.id, p]));
const AGES = { or: { ico: '🌟', name: 'Âge d’or' }, heroique: { ico: '⚜️', name: 'Âge héroïque' }, normal: { ico: '📜', name: 'Âge ordinaire' }, sombre: { ico: '🌑', name: 'Âge sombre' } };
const RIVAL_RATE = { base: 1.3, form: [.6, 1.4], spread: .3 };   // les points de moments d'un rival par nuit, sa forme du chapitre (réglés par simulation)

/* ---------- l'état ---------- */
function bookState() {
  if (!S) return null;
  if (!S.book) {
    S.book = { ch: [], got: {}, firsts: {}, plan: {}, relics: [], pact: null, pw: {}, names: [], pending: null };
    // une ancienne partie : ses hauts faits forment le prologue
    const old = Object.keys(S.ach || {}).filter(k => MOM_BY[k]);
    if (old.length) { S.book.prologue = old.map(id => ({ id, night: S.ach[id] })); old.forEach(id => { S.book.got[id] = S.ach[id]; }); }
    FIRSTS.forEach(f => { S.book.plan[f.id] = Object.fromEntries(RIVALS.map(r => [r.id, f.win[0] + Math.floor(Math.random() * (f.win[1] - f.win[0] + 1))])); });
    bookOpenChapter(true);
  }
  return S.book;
}
const bookCur = () => { const B = bookState(); return B && B.ch[B.ch.length - 1]; };
const hasM = id => !!(S && S.book && S.book.got && S.book.got[id]);
function bookRecalcPw() { const B = S.book, pw = {}; B.relics.forEach(r => (RELIC_BY[r.id] || { pw: [] }).pw.forEach(k => { pw[k] = 1; })); if (B.pact && PACT_BY[B.pact.id]) PACT_BY[B.pact.id].pw.forEach(k => { pw[k] = 1; }); B.pw = pw; }
function bookOpenChapter(first) {
  const B = S.book, n = B.ch.length + 1, left = ERA_NAMES.filter(x => !B.names.includes(x));
  const name = first ? ERA_NAMES[0] : pick(left.length ? left : ERA_NAMES.slice(1)); B.names.push(name);
  const len = BOOK_LEN[0] + Math.floor(Math.random() * (BOOK_LEN[1] - BOOK_LEN[0] + 1));
  const live = RIVALS.filter(r => !isVassal(r.id)), F = RIVAL_RATE.form;
  B.ch.push({ n, name, from: S.night, to: S.night + len, mine: [], rivals: Object.fromEntries(live.map(r => [r.id, 0])), form: Object.fromEntries(live.map(r => [r.id, F[0] + Math.random() * (F[1] - F[0])])), rmom: [], age: null });
  if (!first) B.pending = Object.assign(B.pending || {}, { open: n });
}
/* ---------- les moments ---------- */
function bookEarn(id, night) {
  const B = bookState(), m = MOM_BY[id], c = bookCur(); if (!m || B.got[id]) return null;
  if (m.online && typeof netUsable === 'function' && !netUsable()) return null;
  const by = m.first && B.firsts[id] && B.firsts[id] !== 'moi' ? B.firsts[id] : null, pts = by ? 1 : m.pts;
  if (m.first && !by) B.firsts[id] = 'moi';
  B.got[id] = night || S.night; c.mine.push({ id, night: S.night, pts, after: by });
  return { m, pts, by };
}
function bookRecur() {
  const B = bookState(), c = bookCur(), out = []; B.cnt = B.cnt || {};
  RECUR.forEach(r => { let v = 0; try { v = r.v(S); } catch (e) {} const was = B.cnt[r.id]; B.cnt[r.id] = v; if (was == null || v <= was) return;
    const n = Math.min(v - was, Math.max(0, r.cap - c.mine.filter(x => x.id === r.id).length));
    for (let i = 0; i < n; i++) { c.mine.push({ id: r.id, night: S.night, pts: r.pts }); out.push({ m: r, pts: r.pts }); } });
  return out;
}
function bookCheck(report) {
  if (!S || !S.started) return []; const B = bookState(), out = bookRecur();
  MOMENTS.forEach(m => { if (B.got[m.id] || !m.test) return; let ok = false; try { ok = m.test(S); } catch (e) {} if (ok) { const r = bookEarn(m.id); if (r) out.push(r); } });
  out.forEach(r => { const t = `Nouveau sticker dans le Livre : ${r.m.t}${r.by ? ` (après ${racer(r.by).master})` : ''} (+${r.pts}).`; addLog(t, 'ev'); if (report) report.push(['📖', t, 'good']); });
  return out;
}
/* ---------- les rivaux remplissent leur chapitre ---------- */
function bookRivalsNight(out) {
  const B = bookState(), c = bookCur();
  RIVALS.forEach(r => {
    if (isVassal(r.id) || !(r.id in c.rivals)) return;
    const race = (vicState().race || {})[r.id] || 0, rate = RIVAL_RATE.base * ((c.form || {})[r.id] || 1) * (1 + race / 100) * (1 - RIVAL_RATE.spread / 2 + Math.random() * RIVAL_RATE.spread);
    c.rivals[r.id] += rate;
    FIRSTS.forEach(f => { if (B.firsts[f.id] || S.night < (B.plan[f.id] || {})[r.id]) return; B.firsts[f.id] = r.id; c.rivals[r.id] += 3; c.rmom.push({ who: r.id, id: f.id, night: S.night }); out.push(['📖', `${coupMasterB(r)} te devance : « ${f.t} » va dans la marge de son chapitre (le tien ne vaudra plus qu’1 point).`, 'bad']); });
  });
}
const coupMasterB = r => r.master.charAt(0).toUpperCase() + r.master.slice(1);
/* ---------- la fin d'un chapitre ---------- */
function bookTick(report) {
  if (!S || !S.started) return; const B = bookState(), out = [];
  bookRivalsNight(out);
  const c = bookCur();
  if (S.night >= c.to) {
    const mine = c.mine.reduce((a, x) => a + x.pts, 0), rs = Object.values(c.rivals), prev = B.ch[B.ch.length - 2];
    let age = !rs.length ? (mine >= 3 ? 'or' : 'normal') : rs.every(x => mine > x) ? 'or' : rs.every(x => mine < x) ? 'sombre' : 'normal';
    if (age === 'or' && prev && prev.age === 'sombre') age = 'heroique';
    c.age = age; c.score = mine; c.end = S.night;
    if (B.pact && B.pact.ch === c.n) B.pact = null;   // le pacte ne vaut que pour un chapitre
    out.push(['📖', `Fin du chapitre ${ROMAN(c.n)}, l’Ère ${c.name} : ${AGES[age].ico} ${AGES[age].name} (${Math.round(mine)} points, contre ${rs.length ? rs.map(x => Math.round(x)).join(', ') : 'personne'} pour les rivaux).`, age === 'sombre' ? 'bad' : 'good']);
    if (age === 'or' || age === 'heroique') {
      const pool = RELICS_ERA.filter(x => !B.relics.some(y => y.id === x.id)), got = [];
      for (let i = 0; i < (age === 'heroique' ? 2 : 1) && pool.length; i++) { const r = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; B.relics.push({ id: r.id, era: c.name, ch: c.n }); got.push(r); }
      c.relics = got.map(r => r.id); got.forEach(r => out.push([r.ico, `Relique d’ère : ${r.name}, de l’Ère ${c.name}. ${r.d}`, 'good']));
    }
    if (age === 'sombre') {
      const h = Math.floor(S.hype * .1); S.hype -= h; c.choices = shuffleB(PACTS.map(p => p.id)).slice(0, 3);
      out.push(['🌑', `Âge sombre : −${h} 🔥 notoriété. Un pacte t’attend dans le Livre pour le chapitre suivant.`, 'bad']);
      if (typeof headless === 'function' && headless()) bookPact(c.choices[0]);
      else B.pending = Object.assign(B.pending || {}, { pact: c.n });
    }
    bookOpenChapter(false);
    out.push(['📖', `Le Livre s’ouvre sur le chapitre ${ROMAN(bookCur().n)} : l’Ère ${bookCur().name} (${bookCur().to - bookCur().from} nuits).`, 'good']);
    bookRecalcPw();
  }
  if (out.length && report) { report.push(['sec', 'Le Livre du Maître']); out.forEach(l => report.push(l)); }
}
const shuffleB = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
function bookPact(id) {
  const B = bookState(), P = PACT_BY[id]; if (!P) return 'Pacte inconnu';
  const prev = B.ch.find(c => c.choices && !c.pact && c.age === 'sombre'); if (!prev || !prev.choices.includes(id)) return 'Aucun pacte à choisir';
  prev.pact = id; P.pay(); B.pact = { id, ch: bookCur().n }; if (B.pending) delete B.pending.pact; bookRecalcPw();
  addLog(`Pacte d’âge sombre : ${P.name}.`, 'ev'); return null;
}
CMD.pact = a => bookPact(a && a.id);
/* ---------- les crochets ---------- */
const dawnBook = dawn;
dawn = function (report) { const r = dawnBook(report); try { bookTick(report); bookCheck(report); } catch (e) { console.error(e); } return r; };
const afterChangeBook = afterChange;
afterChange = function () { try { if (!(typeof VISIT !== 'undefined' && VISIT) && !(typeof COOP !== 'undefined' && COOP.role === 'guest')) bookCheck().forEach((r, i) => setTimeout(() => { toast(`📖 Nouveau sticker : ${r.m.t}${r.by ? ` (après ${racer(r.by).master})` : ''}`); sfx('chime'); }, i * 900)); } catch (e) { console.error(e); } return afterChangeBook(); };
// les hauts faits n'existent plus à part : ce sont des stickers
checkAch = function () { return []; };
announceAch = function () {};
// une expédition propre : au moins trois salles et aucun K.O.
const crawlApplyBook = crawlApply;
crawlApply = function (R, team, lines) { const r = crawlApplyBook(R, team, lines); try { if (R && R.done !== 'wipe' && R.path && R.path.length >= 3 && R.party && !R.party.some(p => p.ko)) { const e = bookEarn('propre'); if (e) lines.push(['📖', `Nouveau sticker dans le Livre : ${e.m.t} (+${e.pts}).`, 'good']); } } catch (x) {} return r; };
/* ---------- des fins différentes quand on a le bon sticker ---------- */
const wrapEvB = (k, i, fn) => { const E = CRAWL_EVENTS.find(e => e.k === k); if (!E || !E.a[i]) return; const f0 = E.a[i][1]; E.a[i][1] = R => fn(R, f0); };
wrapEvB('coffre', 0, (R, f0) => { if (!hasM('crit')) return f0(R); const g = Math.round(6 * crawlDepthK(R) * CRAWL_GOLD); R.loot.g += g; return `📖 « Coup de maître » : ton œil repère le mécanisme. Le coffre s’ouvre sans piège : +${g} 💰.`; });
wrapEvB('osselets', 0, (R, f0) => { if (!hasM('pillard')) return f0(R); const b = Math.min(10, R.loot.g); if (!b) return f0(R); if (Math.random() < .75) { R.loot.g += b; return `📖 « Pillard » : tu connais ses tours. Gagné ! +${b} 💰.`; } R.loot.g -= b; return `Perdu… −${b} 💰. Même un pillard tombe sur plus tricheur que lui.`; });
wrapEvB('autel', 0, (R, f0) => { if (!hasM('zen')) return f0(R); R.party.forEach(c => { if (!c.ko) c.hp = Math.min(c.max, c.hp + 6); }); return '📖 « Zénitude » : ton calme apaise l’autel. +6 PV pour toute l’équipe.'; });
wrapEvB('fontaine', 0, (R, f0) => { if (!hasM('cosy')) return f0(R); const c = R.party.filter(x => !x.ko).sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; if (!c) return f0(R); c.hp = c.max; return `📖 « Nid douillet » : l’eau a le goût de chez toi. ${c.name} retrouve tous ses PV.`; });
wrapEvB('cage', 0, (R, f0) => { const t = f0(R); if (!hasM('epopee')) return t; R.freed = (R.freed || 0) + 1; return t + ' 📖 « Épopée » : il a reconnu ton blason et chantera deux fois plus fort.'; });
// les coups des rivaux, adoucis par certains stickers
{ const k0 = COUPS.septbieres.run; COUPS.septbieres.run = (r, out) => { if (!hasM('rempart')) return k0(r, out); const g = Math.min(S.gold, Math.ceil(kroukTake() / 2)); S.gold -= g; out.push(['🍺', `📖 « Inviolable » : ${coupMasterB(r)} se méfie de tes défenses et n’ose qu’une razzia éclair : −${g} 💰.`, 'bad']); };
  const m0 = COUPS.moussues.run; COUPS.moussues.run = (r, out) => { if (!hasM('fidele')) return m0(r, out); const c = S.creatures.filter(x => !isOut(x) && x.sp !== 'diablotin' && !x.legend && !x.evo).sort((a, b) => (a.loy == null ? 50 : a.loy) - (b.loy == null ? 50 : b.loy))[0]; if (c) { S.creatures = S.creatures.filter(x => x !== c); out.push(['🍄', `📖 « À la vie, à la mort » : tes créatures font bloc ; seul·e ${c.name} cède aux sirènes de ${r.master}.`, 'bad']); } };
  const y0 = COUPS.morgrave.run; COUPS.morgrave.run = (r, out) => { if (!hasM('collec')) return y0(r, out); out.push(['🗼', `📖 « Collectionneur » : tes vitrines connaissent les spectres. Ceux d’${r.master.replace(/^la nécromancienne /, '')} repartent bredouilles.`, 'good']); };
  const p0 = COUPS.ombrelune.run; COUPS.ombrelune.run = (r, out) => { if (!hasM('conteur') && !hasM('livredor')) return p0(r, out); if (typeof settlements === 'function') settlements().forEach(s => addGw(s, -5)); out.push(['🦇', `📖 « Conteur » : on connaît tes histoires dans le Val ; les rumeurs de ${r.master} prennent mal (−5 de bonne volonté seulement, et tes créatures n’y croient pas).`, 'bad']); };
}
/* ---------- le livre ---------- */
function bookStickerHTML(x, i, rival) {
  const m = MOM_BY[x.id]; if (!m) return '';
  return `<div class="lv-st${rival ? ' rv' : ''}${x.after ? ' after' : ''}" style="--rot:${((i * 37) % 9) - 4}deg"><span class="lv-ico">${iconize(m.ico)}</span><b>${esc(m.t)}</b><small>${rival ? esc(racer(x.who).master) + ' · ' : ''}nuit ${x.night}${x.pts != null ? ` · +${x.pts}` : ''}${x.after ? ` · après ${esc(racer(x.after).master)}` : ''}</small></div>`;
}
function bookPageHTML(c) {
  const B = S.book, live = c === bookCur(), mine = c.mine.reduce((a, x) => a + x.pts, 0), rows = Object.entries(c.rivals).sort((a, b) => b[1] - a[1]);
  const rank = [['moi', mine], ...rows].sort((a, b) => b[1] - a[1]);
  return `<div class="lv-page${B._anim === c.n ? ' open' : ''}"><div class="lv-chap">Chapitre ${ROMAN(c.n)}</div><h2 class="lv-title">L’Ère ${esc(c.name)}</h2>
    <p class="lv-dates">Nuits ${c.from} à ${c.to}${live ? ` · <b>en cours</b>, encore ${Math.max(0, c.to - S.night)} nuit${c.to - S.night > 1 ? 's' : ''}` : ` · ${AGES[c.age].ico} <b>${AGES[c.age].name}</b>`}</p>
    <div class="lv-stickers">${c.mine.length ? c.mine.map((x, i) => bookStickerHTML(x, i)).join('') : '<p class="hint">Aucun sticker pour l’instant. Les moments marquants viendront s’y coller : un palier, un boss, une espèce rare, une fête…</p>'}</div>
    <div class="lv-margin"><h4>${live ? 'La course du chapitre' : 'Le classement du chapitre'}</h4><ol>${rank.map(([w, p]) => `<li class="${w === 'moi' ? 'me' : ''}">${w === 'moi' ? `<b>${esc(S.name)}</b>` : `${racer(w).emo} ${esc(racer(w).name)}`} <span>${Math.round(p)} pts</span></li>`).join('')}</ol>
      ${live ? '<p class="hint">Premier à la fin du chapitre : âge d’or et une relique d’ère. Dernier : âge sombre, et un pacte à choisir.</p>' : ''}
      ${c.rmom.length ? `<div class="lv-rv">${c.rmom.map((x, i) => bookStickerHTML(x, i, true)).join('')}</div>` : ''}</div>
    ${c.relics && c.relics.length ? `<div class="lv-gain">${c.relics.map(id => `<p>${RELIC_BY[id].ico} <b>${esc(RELIC_BY[id].name)}</b> : ${esc(RELIC_BY[id].d)}</p>`).join('')}</div>` : ''}
    ${c.age === 'sombre' && c.choices && !c.pact ? `<div class="lv-gain dark"><h4>🌑 Un pacte pour le chapitre suivant</h4><p class="hint">Un vrai coup de pouce pendant tout le chapitre, contre une perte tout de suite.</p><div class="lv-pacts">${c.choices.map(id => { const P = PACT_BY[id]; return `<button type="button" class="sbtn" data-pact="${id}">${P.ico} <b>${esc(P.name)}</b><small>${esc(P.d)} · coût : ${esc(P.cost)}</small></button>`; }).join('')}</div></div>` : c.pact ? `<div class="lv-gain dark"><p>${PACT_BY[c.pact].ico} Pacte choisi : <b>${esc(PACT_BY[c.pact].name)}</b> (${esc(PACT_BY[c.pact].d)}).</p></div>` : ''}
  </div>`;
}
function bookCollectionHTML() {
  const B = S.book, cats = [...new Set(MOMENTS.filter(m => !m.online || (typeof netUsable === 'function' && netUsable())).map(m => m.cat))];
  return `<div class="lv-page"><div class="lv-chap">Fin du livre</div><h2 class="lv-title">La collection</h2>
    <h3>Reliques d’ère (${B.relics.length})</h3>${B.relics.length ? `<div class="lv-relics">${B.relics.map(r => `<p>${RELIC_BY[r.id].ico} <b>${esc(RELIC_BY[r.id].name)}</b>, de l’Ère ${esc(r.era)} : ${esc(RELIC_BY[r.id].d)}</p>`).join('')}</div>` : '<p class="hint">Aucune pour l’instant : finis un chapitre en tête de la course.</p>'}
    ${B.pact ? `<p>${PACT_BY[B.pact.id].ico} Pacte en cours : <b>${esc(PACT_BY[B.pact.id].name)}</b> (${esc(PACT_BY[B.pact.id].d)}), jusqu’à la fin du chapitre ${ROMAN(B.pact.ch)}.</p>` : ''}
    ${cats.map(cat => `<h3>${esc(cat)}</h3><div class="lv-stickers all">${MOMENTS.filter(m => m.cat === cat && (!m.online || (typeof netUsable === 'function' && netUsable()))).map((m, i) => { const by = m.first && B.firsts[m.id] && B.firsts[m.id] !== 'moi' ? B.firsts[m.id] : null; return B.got[m.id] ? bookStickerHTML({ id: m.id, night: B.got[m.id] }, i) : `<div class="lv-st off" style="--rot:${((i * 37) % 9) - 4}deg"><span class="lv-ico">${by ? iconize(m.ico) : '?'}</span><b>${esc(m.t)}</b><small>${esc(m.d)}${by ? ` · déjà pris par ${esc(racer(by).master)}` : ''}</small></div>`; }).join('')}</div>`).join('')}
    ${B.prologue ? `<h3>Prologue (avant le Livre)</h3><div class="lv-stickers">${B.prologue.map((x, i) => bookStickerHTML(x, i)).join('')}</div>` : ''}
  </div>`;
}
function openBook(focus) {
  const B = bookState(); if (!B) return;
  let i = typeof focus === 'number' ? focus - 1 : B.ch.length - 1; const N = B.ch.length + 1;   // la dernière page : la collection
  const m = openModal('<div class="livre" id="livre"></div>', { wide: true, label: 'Le Livre du Maître', cls: 'livrem' });
  const draw = () => {
    const box = m.querySelector('#livre');
    box.innerHTML = `<div class="lv-nav"><button type="button" class="sbtn small" data-lv="-1" ${i <= 0 ? 'disabled' : ''}>◀</button><span>📖 Le Livre du Maître · ${i < B.ch.length ? `chapitre ${ROMAN(i + 1)} sur ${ROMAN(B.ch.length)}` : 'la collection'}</span><button type="button" class="sbtn small" data-lv="1" ${i >= N - 1 ? 'disabled' : ''}>▶</button><button type="button" class="sbtn small" data-lv="col">Collection</button></div>${i < B.ch.length ? bookPageHTML(B.ch[i]) : bookCollectionHTML()}`;
    B._anim = null;
  };
  B._anim = typeof focus === 'number' ? focus : null; draw();
  m.addEventListener('click', e => {
    const n = e.target.closest('[data-lv]'), p = e.target.closest('[data-pact]');
    if (n) { i = n.dataset.lv === 'col' ? N - 1 : Math.max(0, Math.min(N - 1, i + +n.dataset.lv)); sfx('tick'); draw(); }
    if (p && !run('pact', { id: p.dataset.pact })) return;
    if (p) { sfx('chime'); toast(`${PACT_BY[p.dataset.pact].ico} Pacte : ${PACT_BY[p.dataset.pact].name}.`); afterChange(); draw(); }
  });
}
openAch = function () { openBook(); };
// le Livre s'ouvre de lui-même sur un nouveau chapitre (et sur le pacte à choisir), dès que la voie est libre
if (typeof setInterval === 'function' && typeof document !== 'undefined') setInterval(() => {
  try { if (!S || !S.started || !S.book || !S.book.pending || UI.busy || (typeof V !== 'undefined' && V.spotOn) || $('#modalRoot').children.length || (document.getElementById('world') && !document.getElementById('world').hidden) || document.body.classList.contains('crawling')) return;
    const P = S.book.pending; S.book.pending = P.pact ? { pact: P.pact } : null; save();
    if (P.pact) openBook(P.pact); else if (P.open) { sfx('chime'); openBook(P.open); }
  } catch (e) {} }, 900);
// le pacte attend dans une pastille tant qu'il n'est pas choisi
const victoryNotifsBook = victoryNotifs;
victoryNotifs = function (add) {
  victoryNotifsBook(add); if (!S.started || !S.book) return;
  const c = S.book.ch.find(x => x.age === 'sombre' && x.choices && !x.pact); if (c) add('pacte', '🌑', 'Âge sombre : choisis ton pacte dans le Livre', () => openBook(c.n), 6, 'bad');
  const cur = bookCur(); if (cur && cur.to - S.night <= 2) { const mine = cur.mine.reduce((a, x) => a + x.pts, 0), best = Math.max(0, ...Object.values(cur.rivals)); add('chap', '📖', `Fin du chapitre dans ${Math.max(0, cur.to - S.night)} nuit(s) : ${Math.round(mine)} pts contre ${Math.round(best)} pour le meilleur rival`, () => openBook(), 3, mine > best ? '' : 'bad'); }
};
UNE_RULES.push([9, /Fin du chapitre|Relique d’ère|Âge sombre|Le Livre s’ouvre/], [7, /Nouveau sticker|ce sticker va dans sa marge/]);
// le Grimoire
WIKI.hautsfaits = { cat: 'ames', t: 'Le Livre du Maître', x: () => `<p>Chaque moment marquant de ta partie devient un <b>sticker</b> collé dans le Livre du Maître (📖, à gauche) : un palier, un boss vaincu, une expédition sans un K.O., une espèce rare, une fête, un coup déjoué… Les anciens hauts faits en font partie. Ils n’ont plus de pouvoir par eux-mêmes, mais certaines rencontres finissent autrement quand tu les possèdes (« 📖 » dans le texte).</p>
  <p><b>Les « premiers du Val »</b> se disputent avec les rivaux : si l’un d’eux te devance, son sticker va dans sa marge, et le tien ne vaut plus qu’1 point.</p>
  <p><b>Chaque ère est un chapitre</b> de 8 à 14 nuits, avec son nom. Les quatre donjons rivaux remplissent aussi le leur. À la fin :</p>
  <ul><li>${AGES.or.ico} <b>Âge d’or</b> si tu finis devant tous : une <b>relique d’ère</b> unique, avec son pouvoir (${RELICS_ERA.slice(0, 4).map(r => r.name).join(', ')}…).</li><li>${AGES.sombre.ico} <b>Âge sombre</b> si tu finis derrière tous : −10 % de notoriété, et un <b>pacte</b> à choisir parmi trois : un vrai coup de pouce pendant tout le chapitre suivant, contre une perte tout de suite (${PACTS.map(p => p.name).join(', ')}).</li><li>${AGES.heroique.ico} <b>Âge héroïque</b> : un âge d’or juste après un âge sombre, deux reliques.</li><li>Sinon, un âge ordinaire.</li></ul>
  <p>Le titre de Grand Maître du Val reste une course à part, plus longue : voir {c:victoires}.</p>` };
WIKI.livre = WIKI.hautsfaits;
{ const t = TIPS.find(x => x.id === 'haut1'); if (t) { t.t = 'Ton premier sticker !'; t.x = 'Les moments marquants se collent dans le Livre du Maître (📖, à gauche). Chaque ère en est un chapitre : finis-le devant les rivaux pour gagner une relique d’ère.'; t.wiki = 'livre'; } }
if (typeof ACT_LABELS !== 'undefined') ACT_LABELS.btnAch = 'Livre';
