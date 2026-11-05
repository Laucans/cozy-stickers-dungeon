
/* =========================================================
   Âmes du château : réputation par espèce, loyauté et
   épanouissement, désertions vers des châteaux plus attirants,
   missions personnelles, niveaux, hauts faits et pouvoirs
   ========================================================= */

/* ---------- mise à niveau des sauvegardes ---------- */
const STAT0 = { dug: 0, pets: 0, secrets: 0, dreams: 0, decor: 0, furn: 0, raidsWon: 0, repelled: 0, invasions: 0, quests: 0, legends: 0, crits: 0, visits: 0, gifts: 0, gbRecv: 0,
  coopNights: 0, migrantsIn: 0, skirmishWon: 0, calmNights: 0, deserted: 0, expeditions: 0 };
function upgradeCreature(c) {
  if (c.loy == null) c.loy = c.sp === 'diablotin' ? 60 : 50;
  if (c.epa == null) c.epa = 50;
  if (c.xp == null) c.xp = 0; if (!c.lvl) c.lvl = 1; if (c.story == null) c.story = 0;
  if (c.quest && !QT[c.quest.k]) delete c.quest;   // une ancienne demande qui n'existe plus (les câlins)
  else if (c.quest && c.quest.st === 'offered') c.quest.st = QT[c.quest.k].away ? 'ready' : 'active';
  return c;
}
function upgradeState(s) {
  if (!s) return s;
  s.stats = Object.assign({}, STAT0, s.stats || {});
  s.rep = s.rep || {}; s.ach = s.ach || {}; s.pwcd = s.pwcd || {}; s.waiting = s.waiting || []; s.desertLog = s.desertLog || [];
  s.opts = Object.assign({ desert: 'on' }, s.opts || {});
  s.val = Object.assign({ claimed: [], sent: {}, visited: [], pvp: true, inboxAt: 0 }, s.val || {});
  s.payAcc = s.payAcc || 0; s.payDebt = s.payDebt || 0; s.payWeek = s.payWeek || 0;   // la paie de chaque nuit (v29)
  if (!(s.amber >= 0)) s.amber = 0;   // l'Ambre 🟠 (une ancienne partie n'en a pas)
  (s.creatures || []).forEach(upgradeCreature);
  return s;
}
const critter = id => S.creatures.find(c => c.id === id);
const isOut = c => !!(c.raid || c.away || c.captive);
const decorIn = r => furnIn(r).filter(f => FURN[f.t] && FURN[f.t].room === 'any').length;
const addLoy = (c, n) => { c.loy = clamp(Math.round((c.loy == null ? 50 : c.loy) + n), 0, 100); };
const bar = (v, col, label) => `<span class="sbar" title="${esc(label || '')}"><i style="width:${clamp(v, 0, 100)}%;background:${col}"></i></span>`;
const stars = v => { const n = Math.round(clamp(v, 0, 100) / 20); return `<span class="stars" aria-label="${n} étoiles sur 5">${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span></span>`; };
function wpick(items, wf) { const ws = items.map(wf), tot = ws.reduce((a, b) => a + b, 0); let r = Math.random() * tot; for (let i = 0; i < items.length; i++) { r -= ws[i]; if (r <= 0) return items[i]; } return items[items.length - 1]; }

/* ---------- hauts faits & pouvoirs ---------- */
const ACH = [
  { id: 'pierre',    cat: 'Bâtisseur', ico: '🧱', name: 'Première pierre',        desc: 'Termine ta première pièce.',                   test: s => mainRoomsBuilt() >= 1,         pw: 'Truelle bénie',          pd: '+1 segment de travaux chaque nuit.' },
  { id: 'archi',     cat: 'Bâtisseur', ico: '📐', name: 'Architecte du chaos',    desc: 'Termine 8 pièces.',                            test: s => mainRoomsBuilt() >= 8,         pw: 'Plans secrets',          pd: 'Les pièces coûtent 1 💰 de moins.' },
  { id: 'deco',      cat: 'Bâtisseur', ico: '🖼️', name: 'Décorateur compulsif',   desc: 'Colle 15 décorations.',                        test: s => s.stats.decor >= 15,           pw: 'Œil de pie',             pd: '+2 Ambiance.' },
  { id: 'cosy',      cat: 'Bâtisseur', ico: '🕯️', name: 'Nid douillet',           desc: 'Atteins 15 d’Ambiance.',                       test: s => ambiance() >= 15,              pw: 'Feu de cheminée',        pd: 'La Calamité monte d’un cran de moins chaque nuit.' },
  { id: 'accueil',   cat: 'Éleveur',   ico: '🛏️', name: 'Comité d’accueil',       desc: 'Héberge 6 créatures.',                         test: s => s.creatures.length >= 6,       pw: 'Paillasses en rab',      pd: '+2 lits.' },
  { id: 'menagerie', cat: 'Éleveur',   ico: '📒', name: 'Ménagerie',              desc: 'Remplis 8 cases de l’album.',                  test: s => Object.keys(s.album).length >= 8, pw: 'Phéromones',          pd: '+10 de réputation auprès de toutes les espèces.' },
  { id: 'calins',    cat: 'Éleveur',   ico: '💭', name: 'Confident',              desc: 'Découvre 3 rêves secrets.',                     test: s => s.stats.secrets >= 3,          pw: 'Oreille attentive',      pd: 'Tes créatures te confient leur rêve secret dès 65 de loyauté (au lieu de 80).' },
  { id: 'fidele',    cat: 'Éleveur',   ico: '💞', name: 'À la vie, à la mort',    desc: 'Une créature atteint 90 de loyauté.',          test: s => s.creatures.some(c => c.loy >= 90), pw: 'Serment du château', pd: 'Les risques de désertion sont divisés par deux.' },
  { id: 'conteur',   cat: 'Missions',  ico: '📜', name: 'Conteur',                desc: 'Comble 5 envies de tes créatures.',            test: s => s.stats.quests >= 5,           pw: 'Carnet d’envies',        pd: '+1 💰 pour chaque envie comblée.' },
  { id: 'chouchou',  cat: 'Missions',  ico: '🌟', name: 'Chouchou',               desc: 'Une créature atteint le niveau 3.',            test: s => s.creatures.some(c => c.lvl >= 3), pw: 'Mentorat',           pd: '+1 XP à chaque gain d’expérience.' },
  { id: 'epopee',    cat: 'Missions',  ico: '🧭', name: 'Épopée',                 desc: 'Termine l’histoire d’une créature (3 chapitres).', test: s => s.stats.legends >= 1,      pw: 'Ballade héroïque',       pd: '+1 dé à tous les raids.' },
  { id: 'legende',   cat: 'Missions',  ico: '🗿', name: 'Légende vivante',        desc: 'Une créature atteint le niveau 5.',            test: s => s.creatures.some(c => c.lvl >= 5), pw: 'Statue au porche',   pd: '+1 💬 de bouche-à-oreille chaque nuit.' },
  { id: 'repousse',  cat: 'Stratège',  ico: '⚔️', name: 'Pas de quartier',        desc: 'Repousse une invasion.',                       test: s => s.stats.repelled >= 1,         pw: 'Pièges huilés',          pd: 'Tes pièges gagnent +1 en force.' },
  { id: 'rempart',   cat: 'Stratège',  ico: '🏰', name: 'Inviolable',             desc: 'Repousse 4 invasions.',                        test: s => s.stats.repelled >= 4,         pw: 'Brume du soir',          pd: 'Pouvoir : −3 Menace.', active: 'brume', cd: 4 },
  { id: 'pillard',   cat: 'Stratège',  ico: '💰', name: 'Pillard',                desc: 'Réussis 5 raids.',                             test: s => s.stats.raidsWon >= 5,         pw: 'Sacoches profondes',     pd: '+2 💰 de butin à chaque raid réussi.' },
  { id: 'crit',      cat: 'Stratège',  ico: '🎲', name: 'Coup de maître',         desc: 'Obtiens un critique en raid.',                 test: s => s.stats.crits >= 1,            pw: 'Trèfle à quatre feuilles', pd: 'Une complication de raid sur deux est évitée.' },
  { id: 'zen',       cat: 'Stratège',  ico: '🍵', name: 'Zénitude',               desc: 'Enchaîne 8 nuits sans Calamité.',              test: s => s.stats.calmNights >= 8,       pw: 'Grand festin',           pd: 'Pouvoir : toutes les créatures gagnent 1 ❤️.', active: 'festin', cd: 5 },
  { id: 'palier1',   cat: 'Château',   ico: '⭐', name: 'Ça prend forme',         desc: 'Atteins le Palier 1.',                         test: s => s.tier >= 1,                   pw: 'Coffre du Maître',       pd: '+1 🪵 chaque nuit.' },
  { id: 'palier2',   cat: 'Château',   ico: '👑', name: 'Seigneur des lieux',     desc: 'Atteins le Palier 2.',                         test: s => s.tier >= 2,                   pw: 'Cloche du rappel',       pd: 'Pouvoir : retient une créature tentée de partir (+25 loyauté).', active: 'rappel', cd: 3 },
  { id: 'carto',     cat: 'Château',   ico: '🗺️', name: 'Cartographe',            desc: 'Découvre 120 cases de la carte.',              test: s => !!s.world && s.world.known.length >= 120, pw: 'Longue-vue du Maître', pd: 'Tu vois une lieue plus loin sur la carte.' },
  { id: 'collec',    cat: 'Château',   ico: '🏺', name: 'Collectionneur',         desc: 'Expose 5 artefacts.',                          test: s => s.furn.filter(f => FURN[f.t] && FURN[f.t].artefact).length >= 5, pw: 'Vitrines blindées', pd: 'Les héros ne peuvent plus voler d’artefacts.' },
  { id: 'etages',    cat: 'Château',   ico: '🪜', name: 'Bâtisseur de tours',     desc: 'Ouvre deux étages, en haut ou en bas.',         test: s => floorsDug() >= 2,              pw: 'Monte-charge',           pd: '+1 segment de travaux chaque nuit.' },
  { id: 'nuit20',    cat: 'Château',   ico: '🌙', name: 'Increvable',             desc: 'Atteins la nuit 20.',                          test: s => s.night >= 20,                 pw: 'Aimant à monstres',      pd: 'Les nouvelles créatures viennent plus volontiers.' },
  { id: 'voisin',    cat: 'Val des Maîtres', online: true, ico: '🏮', name: 'Bon voisin',      desc: 'Visite 3 châteaux du Val.',         test: s => s.stats.visits >= 3,       pw: 'Lanterne de voyage',     pd: '+1 Ambiance.' },
  { id: 'genereux',  cat: 'Val des Maîtres', online: true, ico: '🎁', name: 'Cœur sur la main', desc: 'Offre 3 cadeaux.',                 test: s => s.stats.gifts >= 3,        pw: 'Corne d’abondance',      pd: 'Les cadeaux que tu reçois valent double.' },
  { id: 'livredor',  cat: 'Val des Maîtres', online: true, ico: '✍️', name: 'Célébrité locale', desc: 'Reçois 5 mots dans ton livre d’or.', test: s => s.stats.gbRecv >= 5,     pw: 'Bonne réputation',        pd: '+5 de réputation auprès de toutes les espèces.' },
  { id: 'coop',      cat: 'Val des Maîtres', online: true, ico: '🤝', name: 'Main dans la main', desc: 'Termine une nuit en château partagé.', test: s => s.stats.coopNights >= 1, pw: 'Pacte des Maîtres',    pd: '+1 segment de travaux chaque nuit.' },
  { id: 'aimant',    cat: 'Val des Maîtres', online: true, ico: '🧲', name: 'Chasseur de talents', desc: 'Accueille une créature venue d’un autre château.', test: s => s.stats.migrantsIn >= 1, pw: 'Bouche-à-oreille', pd: '+5 de réputation auprès de toutes les espèces.' },
  { id: 'escarmouche', cat: 'Val des Maîtres', online: true, ico: '🏹', name: 'Taquin',         desc: 'Réussis une escarmouche contre un voisin.', test: s => s.stats.skirmishWon >= 1, pw: 'Bannière de guerre', pd: '+1 dé aux escarmouches.' },
];
const ACH_BY = Object.fromEntries(ACH.map(a => [a.id, a]));
const PW = id => !!(S && S.book && S.book.pw && S.book.pw[id]);   // les pouvoirs viennent des reliques d'ère et des pactes du Livre du Maître (p63)
const pwRep = () => (PW('menagerie') ? 10 : 0) + (PW('livredor') ? 5 : 0) + (PW('aimant') ? 5 : 0);
const pwAmb = () => (PW('deco') ? 2 : 0) + (PW('voisin') ? 1 : 0);
const workPerNight = () => CONSTS.WORK + sumCrit('build') + (PW('pierre') ? 1 : 0) + (PW('coop') ? 1 : 0) + (PW('etages') ? 1 : 0);
function checkAch() {
  const done = [];
  if (!S || !S.ach) return done;
  for (const a of ACH) {
    if (S.ach[a.id]) continue;
    let ok = false; try { ok = a.test(S); } catch (e) {}
    if (ok) { S.ach[a.id] = S.night; done.push(a); addLog(`Haut fait : ${a.name} (pouvoir ${a.pw}).`, 'ev'); }
  }
  return done;
}
function announceAch(list) {
  list.forEach((a, i) => setTimeout(() => { toast(`🏆 Haut fait : ${a.name} → ${a.pw}`); sfx('chime'); }, i * 900));
}
TIPS.push(
  { id: 'nouveau2', when: () => S.night >= 3 && !(S.tuto && S.tuto.on), t: 'Les âmes du château', x: 'Chaque créature a sa loyauté, ses missions personnelles et ses niveaux. Ton château a une réputation auprès de chaque espèce et des hauts faits qui débloquent des pouvoirs : ⭐, 🏆 et 📜 dans la colonne de gauche (le bouton 🐾 la déplie si elle est rangée). Et « Le Val » te relie aux autres Maîtres !', wiki: 'reputation' },
  { id: 'quete1', when: () => S.creatures.some(c => c.quest && c.quest.st === 'active'), t: 'Des envies', x: 'Chaque créature déclare une envie (✦ sur sa fiche, liste 📜 à gauche). Comble-la : la récompense tombe toute seule (loyauté, expérience, cadeaux). Elle cache aussi un rêve secret : à toi de le découvrir.', wiki: 'missions' },
  { id: 'tente1', when: () => S.creatures.some(c => c.tempt), t: 'Quelqu’un lorgne ailleurs', x: 'Une créature (👀) trouve qu’un autre château reçoit mieux son espèce. Comble son envie ou réalise son rêve secret pour la retenir… ou améliore ta réputation (⭐ Réputation).', wiki: 'loyaute' },
  { id: 'haut1', when: () => Object.keys(S.ach || {}).length >= 1, t: 'Premier haut fait !', x: 'Chaque haut fait débloque un pouvoir permanent pour ton château. Retrouve-les tous dans 🏆 Hauts faits.', wiki: 'hautsfaits' },
);
const pwReady = a => !S.pwcd[a.active] || S.night >= S.pwcd[a.active];

/* ---------- réputation par espèce ---------- */
function repTarget(sp) {
  const d = SPECIES[sp]; if (!d) return { v: 0, f: [] };
  const f = [];
  if (d.from === 'coeur') f.push(['Né du Cœur du château', 25]);
  else if (d.fromDecor) { const ok = countItem('toile') >= d.fromDecor.toile; f.push([ok ? 'Toiles accueillantes' : 'Pas assez de toiles', ok ? 25 : 0]); }
  else if (d.from && ROOMS[d.from]) { const n = nestsOf(sp); f.push(n ? [`${ROOMS[d.from].name} meublée${n > 1 ? ' (' + n + ' pièces)' : ''}`, Math.min(32, 22 + (n - 1) * 5)] : [`Pas de ${ROOMS[d.from].name} meublée`, 0]); }
  if (d.likes && FURN[d.likes]) f.push(hasItem(d.likes) ? [`${itemName(d.likes)} au château`, 10] : [`Pas de ${itemName(d.likes)}`, 0]);
  const mates = S.creatures.filter(c => c.sp === sp && !c.away);
  if (mates.length) {
    const m = mates.reduce((a, c) => a + c.mood, 0) / mates.length, e = mates.reduce((a, c) => a + (c.epa == null ? 50 : c.epa), 0) / mates.length;
    f.push([`Humeur des siens (${m.toFixed(1)}/5)`, Math.round(m * 4)]);
    f.push([`Épanouissement des siens (${Math.round(e)})`, Math.round(e / 10)]);
  }
  const amb = ambiance(); f.push([`Ambiance ${amb}`, Math.min(15, Math.round(amb * .7))]);
  { const g = radiance(); if (g) f.push([`Notoriété ${g}`, d.rare ? Math.min(25, Math.floor(g / 6)) : Math.min(10, Math.floor(g / 5))]); }   // une rare y tient bien plus
  if (S.tier) f.push([`Palier ${S.tier}`, S.tier * 3]);
  if (d.rival && SPECIES[d.rival] && countSp(d.rival)) f.push([`Des ${SPECIES[d.rival].name.toLowerCase()}s rôdent`, -10]);
  const des = (S.desertLog || []).filter(x => x.sp === sp && S.night - x.n < 6).length; if (des) f.push(['Désertions récentes', -8 * des]);
  const pw = pwRep(); if (pw) f.push(['Pouvoirs du château', pw]);
  const art = ARTEFACTS.filter(k => FURN[k].repSp === sp && hasItem(k)); if (art.length) f.push([`${itemName(art[0])} exposé`, 12]);
  return { v: clamp(Math.round(f.reduce((a, x) => a + x[1], 0)), 0, 100), f };
}
const repOf = sp => (S.rep && S.rep[sp] != null) ? S.rep[sp] : repTarget(sp).v;
function updateRep() { SPECIES_ORDER.forEach(sp => { const t = repTarget(sp).v, cur = S.rep[sp]; S.rep[sp] = cur == null ? t : Math.round(cur * .6 + t * .4); }); }

// « de le comte » → « du comte »
const deM = m => /^le /i.test(m) ? 'du ' + m.slice(3) : /^les /i.test(m) ? 'des ' + m.slice(4) : 'de ' + m;
// châteaux rivaux du Val (gérés par le jeu, toujours présents)
const RIVALS = [
  { id: 'morgrave',  name: 'La Tour de Morgrave',        master: 'la nécromancienne Ysolde', emo: '🗼', likes: ['fantome', 'sorciere', 'squelette', 'vampire'], base: 34 },
  { id: 'septbieres', name: 'Le Fortin des Sept Bières', master: 'le baron gobelin Krouk',   emo: '🍺', likes: ['gobelin', 'orque', 'troll', 'menestrel'],    base: 32 },
  { id: 'moussues',  name: 'Les Grottes Moussues',       master: 'la vieille Mère-Crapaud',  emo: '🍄', likes: ['crapaud', 'araignee', 'kobold', 'diablotin'], base: 31 },
  { id: 'ombrelune', name: 'Le Manoir Ombrelune',        master: 'le comte Pâlefroid',       emo: '🦇', likes: ['vampire', 'gargouille', 'mimique', 'dragonnet'], base: 33 },
];
function rivalRep(r, sp) {
  const fav = r.likes.includes(sp), grow = Math.min(30, S.night * .75), wob = Math.round(Math.sin(S.night * .7 + (seedOf(r.id + sp) % 628) / 100) * 7);
  const hit = S.world && S.world.hit && S.world.hit[r.id] > S.night ? 15 : 0;
  if (S.vic && S.vic.vassals[r.id] >= 3) return 10;   // un vassal ne te dispute plus tes créatures
  const master = S.vic && S.vic.master === r.id ? 8 : 0;
  return clamp(Math.round((fav ? r.base + 8 : r.base - 18) + grow + wob - hit + master), 0, 92);
}
// le rival le plus attirant pour une espèce : châteaux du jeu + châteaux des autres joueurs (Val des Maîtres)
function bestRival(sp) {
  let best = null;
  RIVALS.forEach(r => { const v = rivalRep(r, sp); if (!best || v > best.v) best = { name: r.name, master: r.master, emo: r.emo, v }; });
  if (typeof valRivals === 'function') valRivals().forEach(o => { const v = (o.rep && +o.rep[sp]) || 0; if (v > best.v) best = { name: o.name, master: o.master, emo: '🏰', v, pk: o.pk }; });
  return best;
}

/* ---------- loyauté & épanouissement ---------- */
function epaFactors(c, hungry = hungrySet()) {
  const sp = SPECIES[c.sp] || {}, f = [['Un toit, un lit', 15], [`Humeur ${c.mood}/5`, c.mood * 10]];
  if (sp.likes && hasItem(sp.likes)) f.push([`${itemName(sp.likes)} au château`, 10]);
  const post = c.post && S.rooms.find(r => r.id === c.post);
  if (post && (post.t === sp.from || (ROOMS[post.t].attracts || []).includes(c.sp))) f.push(['Posté·e dans sa pièce rêvée', 10]);
  if (S.creatures.some(o => o !== c && o.sp === c.sp)) f.push(['Un·e ami·e de son espèce', 8]);
  if (c.questAt && S.night - c.questAt <= 3) f.push(['Envie comblée récemment', 15]);
  if (c.dream) f.push(['Son rêve secret s’est réalisé', 12]);
  if (c.unpaid && S.night - c.unpaid < PAY_EVERY) f.push(['Pas payé·e à la dernière paie', -15]);
  else if (c.paidAt && S.night - c.paidAt < PAY_EVERY) f.push(['Payé·e rubis sur l’ongle', 3]);
  if (c.lvl >= 3) f.push([`Niveau ${c.lvl}`, (c.lvl - 2) * 4]);
  if (hungry.has(c.id)) f.push(['Ventre vide', -20]);
  if (sp.rival && S.creatures.some(o => o.sp === sp.rival)) f.push([`Supporte mal les ${(SPECIES[sp.rival] || { name: '?' }).name}s`, -8]);
  if (c.quest && c.quest.st === 'active' && S.night - c.quest.n >= 8) f.push(['Son envie attend depuis longtemps', -4]);
  return { f, target: clamp(f.reduce((a, x) => a + x[1], 0), 0, 100) };
}
const loyDelta = c => { let d = Math.round((c.epa - 50) / 8); if (S.night - (c.joined || 1) < 3) d = Math.max(d, 1); return d; };
const loyWord = v => v >= 85 ? 'Dévoué·e corps et âme' : v >= 65 ? 'Fidèle' : v >= 45 ? 'Attaché·e' : v >= 25 ? 'Hésitant·e' : 'Prêt·e à partir';
const epaWord = v => v >= 80 ? 'Rayonnant·e' : v >= 60 ? 'Épanoui·e' : v >= 40 ? 'Ça va' : v >= 20 ? 'Morose' : 'Malheureux·se';

/* ---------- la paie ---------- */
// chaque créature a un salaire pour 5 nuits, mais elle en touche un peu chaque nuit, à l'aube (les gages du jour) :
// plus de gros coup tous les 5 nuits. Une nuit sans le sou, ce qui manque va sur l'ardoise ; au jour de paie (toutes les 5 nuits),
// on fait les comptes : si l'ardoise n'est pas soldée, les dernières venues repartent sans paie (−1 ❤️, −10 loyauté).
// Les diablotins, nés du Cœur, travaillent pour rien.
const PAY_EVERY = 5;
const salaryOf = c => { const d = SPECIES[c.sp] || {}; if (c.sp === 'diablotin') return 0; return 1 + (d.tier || 0) + (d.rare ? 2 : 0) + ((c.lvl || 1) >= 4 ? 1 : 0) + (c.legend ? 1 : 0); };
const payroll = () => S.creatures.filter(c => !c.away).reduce((a, c) => a + salaryOf(c), 0);   // la paie de 5 nuits
const payDebt = () => (S && S.payDebt) || 0;   // l'ardoise : les gages pas encore versés
const wageToday = () => Math.floor((S.payAcc || 0) + payroll() / PAY_EVERY + 1e-9);   // ce que coûteront les gages à la prochaine aube
const wageDue = () => wageToday() + payDebt();   // ce qu'il faut avoir en caisse à l'aube pour que tout le monde soit payé
const nightsToPay = () => (PAY_EVERY - S.night % PAY_EVERY) % PAY_EVERY;   // 0 : le jour de paie tombe à l'aube de cette nuit
function payday(report) {
  const acc = (S.payAcc || 0) + payroll() / PAY_EVERY, w = Math.floor(acc + 1e-9); S.payAcc = Math.max(0, acc - w);
  const owe = w + payDebt(), paid = Math.min(Math.max(0, S.gold), owe);
  S.gold -= paid; S.payDebt = owe - paid; S.payWeek = (S.payWeek || 0) + paid; S.stats.wages = (S.stats.wages || 0) + paid;
  if (S.night % PAY_EVERY !== 0) {
    if (owe) report.push(['💰', S.payDebt ? `Gages du jour : ${paid} 💰 versés sur ${owe}. Il manque ${S.payDebt} 💰, notés sur l’ardoise : à solder d’ici le jour de paie (dans ${nightsToPay()} nuit${nightsToPay() > 1 ? 's' : ''}).` : `Gages du jour : ${paid} 💰${owe > w ? ` (dont ${owe - w} de l’ardoise, soldée)` : ''}.`, S.payDebt ? 'bad' : '']);
    return;
  }
  // le jour de paie : on fait les comptes de la semaine
  const due = S.creatures.filter(c => !c.away && salaryOf(c) > 0).sort((a, b) => (a.joined || 1) - (b.joined || 1));   // les anciens d'abord
  const week = S.payWeek; S.payWeek = 0;
  if (!due.length) { S.payDebt = 0; return; }
  let debt = Math.min(S.payDebt, payroll()); const unpaid = [];
  for (let i = due.length - 1; i >= 0 && debt > 0; i--) { unpaid.push(due[i]); debt -= salaryOf(due[i]); }   // l'ardoise retombe sur les dernières venues
  const paid2 = due.filter(c => !unpaid.includes(c));
  paid2.forEach(c => { c.paidAt = S.night; addLoy(c, 2); });
  unpaid.forEach(c => { c.unpaid = S.night; c.mood = clamp(c.mood - 1, 0, 5); addLoy(c, -10); });
  S.pay = { night: S.night, paid: paid2.map(c => c.id), unpaid: unpaid.map(c => c.id) };
  S.stats.unpaid = (S.stats.unpaid || 0) + unpaid.length; S.payDebt = 0;   // l'ardoise est effacée : les impayées boudent à la place
  report.push(['sec', 'Jour de paie']);
  if (paid2.length) report.push(['💰', `Jour de paie : ${paid2.length} créature${paid2.length > 1 ? 's ont touché tous leurs' : ' a touché tous ses'} gages de la semaine (${week} 💰 versés en ${PAY_EVERY} nuits).`, 'good']);
  if (unpaid.length) { report.push(['😠', `Caisses vides ! L’ardoise n’est pas soldée : ${unpaid.length} créature${unpaid.length > 1 ? 's n’ont' : ' n’a'} pas été payée${unpaid.length > 1 ? 's' : ''} (−1 ❤️, −10 loyauté) : ${unpaid.slice(0, 5).map(c => c.name).join(', ')}${unpaid.length > 5 ? '…' : ''}.`, 'bad']); addLog(`Jour de paie : ${unpaid.length} créature(s) impayée(s).`, 'bad'); }
  else addLog(`Jour de paie : ${week} 💰 versés cette semaine.`, 'ev');
}

/* ---------- désertions ---------- */
const desertMod = () => S.opts.desert === 'off' ? 0 : (S.opts.desert === 'soft' ? .5 : 1) * (PW('fidele') ? .5 : 1);
function temptation(c) {
  if (c.sp === 'diablotin' || isOut(c) || c.legend || c.dream || desertMod() === 0) return null;
  if (S.night < 6 || (S.tuto && S.tuto.on) || S.night - (c.joined || 1) < 4 || c.loy >= 40) return null;
  const best = bestRival(c.sp), mine = repOf(c.sp);
  return best && best.v > mine + 5 ? best : null;
}
function desertChance(c, best) {
  const pull = (best.v - repOf(c.sp)) / 100, weak = (40 - c.loy) / 40, sad = 1 - (c.epa == null ? 50 : c.epa) / 100;
  return clamp((.12 + pull * .6) * (.4 + weak * .6) * (.5 + sad), 0, .45) * desertMod();
}

/* ---------- missions personnelles ---------- */
const EXPE = {
  diablotin: ['La braise de la boulangerie', 'rapporter une braise du four de la boulangère, la seule vraie flamme de l’enfer (selon lui)', 'revient avec une braise et trois croissants roussis', 'revient bredouille, le derrière roussi'],
  gobelin: ['La cuillère de mémé', 'récupérer la cuillère en argent de sa grand-mère, confisquée par le bailli', 'rentre en brandissant la cuillère… et le service à dessert complet', 's’est fait courser par les chiens du bailli'],
  kobold: ['Le coucou de l’horloger', 'voler les ressorts du coucou de l’horloger, pour un piège révolutionnaire', 'revient les poches pleines de ressorts et un sourire inquiétant', 's’est pris un coucou dans le nez'],
  crapaud: ['Le concours des marais', 'chanter au grand concours de coassements des marais', 'a remporté la médaille d’or (en fait, un bouchon doré)', 'a eu un chat dans la gorge. Un vrai chat'],
  gargouille: ['La veillée de la cathédrale', 'monter la garde une nuit entière sur la cathédrale voisine, pour l’honneur', 'n’a pas bougé d’un millimètre : les pigeons l’ont élue reine', 'a éternué. Sur l’évêque'],
  menestrel: ['Le tournoi de luth', 'gagner le tournoi de luth de la foire aux navets', 'a gagné, et revient avec une chanson flatteuse sur toi (pour une fois)', 'a cassé trois cordes et deux dents'],
  troll: ['La soupe du Gué', 'goûter la soupe légendaire de l’auberge du Gué. Toute la soupe', 'rapporte la recette… et le chaudron', 's’est fait chasser avant le dessert'],
  fantome: ['Le notaire', 'hanter la maison de son ancien notaire, qui lui doit encore trois écus', 'a récupéré les écus, avec les intérêts', 'le notaire ne croit pas aux fantômes. Vexant'],
  sorciere: ['La mandragore de pleine lune', 'cueillir une mandragore à minuit pile sans se faire hurler dessus', 'revient avec la mandragore… et sa cousine', 'a les oreilles qui sifflent encore'],
  squelette: ['Le tibia égaré', 'retrouver son tibia gauche, perdu en 1342 sur un champ de bataille', 'a retrouvé son tibia, et un fémur de rechange', 'a ramené un tibia de vache. Il fera avec'],
  orque: ['Le bras de fer', 'défier le forgeron du village au bras de fer', 'a gagné : le forgeron offre un tonneau pour se faire pardonner', 'a perdu. Il dit qu’il a glissé'],
  araignee: ['Le voile de la baronne', 'tisser en secret le voile de mariée de la baronne', 'a tissé un voile sublime, payé rubis sur l’ongle', 'a fait hurler la baronne. Comme d’habitude'],
  dragonnet: ['L’œuf de cristal', 'couver un œuf de cristal trouvé au sommet de la montagne', 'a fait éclore… un cristal tout neuf', 'couvait un caillou. Il est un peu déçu'],
  mimique: ['Le coffre du trésorier', 'se faire passer pour le coffre du trésorier royal', 'revient plein d’écus', 's’est fait vider de ses propres chaussettes'],
  vampire: ['Le bal du baron', 'assister incognito au bal masqué du Baron Pâlichon', 'a dansé toute la nuit et rapporte les secrets du baron', 'a trouvé le buffet à l’ail. Quelle horreur'],
  _: ['Une grande aventure', 'accomplir une quête très personnelle', 'revient grandi·e', 'revient un peu cabossé·e'],
};
const QT = {
  objet: { ico: '🎁', gen: c => { const it = (SPECIES[c.sp] || {}).likes; if (!it || !FURN[it]) return null; return { item: it, goal: countItem(it) + 1, title: `Un sticker ${itemName(it)} rien qu’à moi`, text: `Colle un nouveau sticker ${itemName(it)} dans le château.` }; },
    test: q => countItem(q.item) >= q.goal, prog: q => `${Math.min(countItem(q.item), q.goal)}/${q.goal}` },
  piece: { ico: '🏗️', gen: c => { const r = (SPECIES[c.sp] || {}).from; if (!r || !ROOMS[r] || ROOMS[r].fixed || ROOMS[r].unique || ROOMS[r].theme) return null; return { room: r, goal: homeRooms(r) + 1, title: `Une ${ROOMS[r].name} de plus`, text: `Construis et meuble une ${ROOMS[r].name} supplémentaire.` }; },
    test: q => homeRooms(q.room) >= q.goal, prog: q => `${Math.min(homeRooms(q.room), q.goal)}/${q.goal}` },
  deco: { ico: '🕯️', gen: c => { const p = c.post && S.rooms.find(r => r.id === c.post && r.built && !isHall(r)); if (!p) return null; return { roomId: p.id, goal: decorIn(p) + 2, title: 'Un nid douillet', text: `Ajoute 2 décorations dans la pièce « ${ROOMS[p.t].name} », là où je monte la garde.` }; },
    test: q => { const r = S.rooms.find(x => x.id === q.roomId); return !!r && decorIn(r) >= q.goal; }, prog: q => { const r = S.rooms.find(x => x.id === q.roomId); return r ? `${Math.min(decorIn(r), q.goal)}/${q.goal}` : 'pièce disparue'; } },
  ami: { ico: '🤝', gen: c => countSp(c.sp) < 3 && !(SPECIES[c.sp].tier > S.tier) ? { sp: c.sp, goal: countSp(c.sp) + 1, title: 'Un peu de compagnie', text: `Accueille un·e autre ${SPECIES[c.sp].name} au château.` } : null,
    test: q => countSp(q.sp) >= q.goal, prog: q => `${Math.min(countSp(q.sp), q.goal)}/${q.goal}` },
  poste: { ico: '🪑', gen: c => { const r = (SPECIES[c.sp] || {}).from; if (!r || !ROOMS[r] || ROOMS[r].fixed || !S.rooms.some(o => o.t === r && o.built)) return null; return { room: r, title: `Un poste : ${ROOMS[r].name}`, text: `Poste-moi dans une pièce « ${ROOMS[r].name} », c’est là que je me sens chez moi.` }; },
    test: (q, c) => { const p = c.post && S.rooms.find(o => o.id === c.post); return !!p && p.t === q.room; }, prog: (q, c) => { const p = c.post && S.rooms.find(o => o.id === c.post); return p ? ROOMS[p.t].name : 'pas de poste'; } },
  raid: { ico: '🗺️', gen: c => (SPECIES[c.sp].dice || 0) > 0 ? { goal: (c.raidsWon || 0) + 1, title: 'Ma part du butin', text: 'Emmène-moi dans un raid réussi.' } : null,
    test: (q, c) => (c.raidsWon || 0) >= q.goal, prog: () => '0/1' },
  garde: { ico: '🛡️', gen: c => ({ goal: (S.stats.repelled || 0) + 1, title: 'Défendre le château', text: 'Repousse une bande d’aventuriers pendant que je suis là.' }),
    test: q => (S.stats.repelled || 0) >= q.goal, prog: () => '0/1' },
  ravi: { ico: '💗', gen: c => c.mood < 5 ? { title: 'Être aux anges', text: 'Fais-moi atteindre 5 ❤️ d’humeur.' } : null, test: (q, c) => c.mood >= 5, prog: (q, c) => `${c.mood}/5 ❤️` },
  expe: { ico: '🧭', away: true, gen: c => { const e = EXPE[c.sp] || EXPE._; return { nights: 2, title: e[0], text: `Laisse-moi partir deux nuits pour ${e[1]}.` }; }, test: () => false, prog: () => '' },
};
const QCH = { 1: ['objet', 'poste', 'ravi', 'deco', 'ami'], 2: ['piece', 'raid', 'garde', 'objet', 'deco', 'ami'] };
function genQuest(c) {
  const ch = c.legend ? 4 : (c.story || 0) + 1;
  // l'aventure (chapitre 3, puis la légende) ne se présente qu'une fois le rêve secret réalisé
  if (ch >= 3 && (c.dream || c.legend)) return { k: 'expe', ch, st: 'ready', n: S.night, ...QT.expe.gen(c) };
  const ks = QCH[Math.min(ch, 2)].slice().sort(() => Math.random() - .5);
  for (const k of ks) { const q = QT[k].gen(c); if (q && !QT[k].test(q, c)) return { k, ch: Math.min(ch, 2), st: 'active', n: S.night, ...q }; }
  return null;
}
const questOf = c => c.quest && QT[c.quest.k] ? c.quest : null;
function questReward(q) {
  const extra = PW('conteur') ? 1 : 0;
  if (q.k !== 'expe') return q.ch === 1 ? { g: 2 + extra, loy: 12, xp: 2 } : { g: 3 + extra, loy: 15, xp: 3, gift: true };
  const r = q.res || 'partial', base = q.ch >= 4 ? .5 : 1;
  const t = { crit: { g: 6, h: 2, loy: 20, xp: 5, gift: true, rare: true }, full: { g: 4, h: 2, loy: 20, xp: 5, gift: true }, partial: { g: 2, h: 1, loy: 12, xp: 4 }, fail: { g: 0, h: 0, loy: 6, xp: 3 } }[r];
  return { g: Math.ceil(t.g * base) + extra, h: Math.ceil(t.h * base), loy: Math.ceil(t.loy * base), xp: Math.ceil(t.xp * base), gift: t.gift && base === 1, rare: t.rare };
}
function rewardLine(rw) {
  const p = []; if (rw.g) p.push(`+${rw.g} 💰`); if (rw.h) p.push(`+${rw.h} 💬`); if (rw.loy) p.push(`+${rw.loy} loyauté`); if (rw.xp) p.push(`+${rw.xp} XP`); if (rw.gift) p.push('un sticker cadeau'); if (rw.rare) p.push('un Cristal');
  return p.join(', ');
}
// envies comblées : la récompense tombe tout de suite, sans rien réclamer (lines : où raconter, sinon des bulles)
function checkQuests(lines) {
  const done = [];
  S.creatures.forEach(c => {
    const q = questOf(c); if (!q) return;
    let ok = q.st === 'done';   // retour d'aventure
    if (q.st === 'active' && !QT[q.k].away) { try { ok = QT[q.k].test(q, c); } catch (e) {} }
    if (ok) { grantEnvie(c, q, lines); done.push(c); }
  });
  if (typeof secretsCheck === 'function') secretsCheck(lines).forEach(c => done.push(c));
  return done;
}
function grantEnvie(c, q, lines) {
  const rw = questReward(q); S.gold += rw.g || 0; S.hype += rw.h || 0; addLoy(c, rw.loy || 0);
  if (q.res === 'fail') c.mood = clamp(c.mood - 1, 0, 5);
  if (rw.gift) { const k = (SPECIES[c.sp].likes && FURN[SPECIES[c.sp].likes]) ? SPECIES[c.sp].likes : pick(DECOR_ORDER); S.free[k] = (S.free[k] || 0) + 1; }
  if (rw.rare) S.free.cristal = (S.free.cristal || 0) + 1;
  gainXP(c, rw.xp || 0, lines);
  c.questAt = S.night; S.stats.quests++;
  let legend = false;
  if (q.k === 'expe') { c.lastExpe = S.night; if (!c.legend) { c.legend = true; legend = true; S.stats.legends++; addLog(`${c.name} entre dans la légende !`, 'ev'); } }
  if (q.ch <= 3) c.story = Math.max(c.story || 0, q.ch);
  delete c.quest;
  addLog(`Envie comblée : ${q.title} (${c.name}).`, 'good');
  const t = `${c.name} est comblé·e : « ${q.title} » (${rewardLine(rw)}).${legend ? ' Son histoire entre dans la légende !' : ''}`;
  if (lines) lines.push(['✨', t, 'good']); else { toast('✨ ' + t); sfx('chime'); }
}

/* ---------- niveaux ---------- */
const LVL_XP = [0, 0, 3, 7, 12, 18];
const LVL_PERK = { 2: '+1 🛡️ en garde', 3: '+1 🎲 en raid', 4: 'ne boude plus jamais (humeur 2 minimum)', 5: 'sa compétence compte une fois de plus' };
const guardOf = c => ((SPECIES[c.sp] || {}).guard || 0) + (c.lvl >= 2 ? 1 : 0) + (c.evo && EVOS[c.evo] ? EVOS[c.evo].guard || 0 : 0);
const diceOf = c => { const d = (SPECIES[c.sp] || {}).dice || 0; return d > 0 ? d + (c.lvl >= 3 ? 1 : 0) + (c.evo && EVOS[c.evo] ? EVOS[c.evo].dice || 0 : 0) : 0; };
function gainXP(c, n, lines) {
  c.xp = (c.xp || 0) + n + (PW('chouchou') ? 1 : 0);
  while ((c.lvl || 1) < 5 && c.xp >= LVL_XP[(c.lvl || 1) + 1]) {
    c.lvl = (c.lvl || 1) + 1;
    const t = `${c.name} passe niveau ${c.lvl} : ${LVL_PERK[c.lvl]} !`;
    if (lines) lines.push(['🌟', t, 'good']); else toast('🌟 ' + t);
    addLog(t, 'good');
  }
}

/* ---------- l’aube des âmes ---------- */
function soulsDawn(report) {
  const out = [], hungry = hungrySet();
  // retours d’expédition
  S.creatures.forEach(c => {
    if (!c.away || c.expe || S.night + 1 < c.awayUntil) return;
    const q = questOf(c), sp = SPECIES[c.sp] || {}, e = EXPE[c.sp] || EXPE._;
    const pool = Math.max(1, diceOf(c) + Math.floor((c.lvl || 1) / 2) + (c.mood >= 4 ? 1 : 0)), roll = rollPool(pool);
    c.away = 0; c.awayUntil = 0; c.raid = false; c.back = true;
    if (q) { q.st = 'done'; q.res = roll.res; q.dice = roll.dice; }
    S.stats.expeditions++;
    out.push(['🧭', `${c.name} (${sp.name}) ${roll.res === 'fail' ? e[3] : e[2]}. (${roll.dice.join(', ')})`, roll.res === 'fail' ? '' : 'good']);
  });
  // épanouissement & loyauté
  S.creatures.forEach(c => {
    if (c.away) return;
    const t = epaFactors(c, hungry).target;
    c.epa = Math.round((c.epa == null ? 50 : c.epa) * .6 + t * .4);
    addLoy(c, loyDelta(c));
  });
  // tentations & désertions
  const leaving = [];
  S.creatures.forEach(c => {
    const best = temptation(c);
    if (!best) { if (c.tempt) { out.push(['🙂', `${c.name} renonce finalement à partir.`, 'good']); delete c.tempt; } return; }
    if (c.tempt && Math.random() < desertChance(c, best)) { leaving.push([c, best]); return; }
    if (!c.tempt) out.push(['👀', `${c.name} (${SPECIES[c.sp].name}) lorgne vers ${best.name} : là-bas, les ${SPECIES[c.sp].name.toLowerCase()}s sont mieux reçus (${Math.round(best.v)} contre ${repOf(c.sp)}). Comble son envie pour le·la retenir !`, 'bad']);
    c.tempt = { name: best.name, master: best.master, v: best.v, pk: best.pk || null, n: S.night };
  });
  leaving.forEach(([c, best]) => {
    S.creatures = S.creatures.filter(x => x !== c);
    S.desertLog.push({ sp: c.sp, n: S.night }); if (S.desertLog.length > 30) S.desertLog.shift();
    S.stats.deserted++;
    out.push(['🧳', `${c.name} (${SPECIES[c.sp].name}) est parti·e rejoindre ${best.name}${best.master ? ' ' + deM(best.master) : ''}.`, 'bad']);
    addLog(`${c.name} a déserté pour ${best.name}.`, 'bad');
    if (best.pk && typeof valMigrate === 'function') valMigrate(c, best);
  });
  // nouvelles envies : chaque créature présente cette nuit en déclare une (une nuit après la précédente)
  {
    const fresh = [];
    S.creatures.filter(c => !c.quest && !isOut(c) && (c.questAt == null || S.night - c.questAt >= 2) && (!c.legend || S.night - (c.lastExpe || 0) >= 5) && (c.questAt == null && S.night <= 2 || Math.random() < .4)).forEach(c => { const q = genQuest(c); if (q) { c.quest = q; fresh.push(c); } });
    if (fresh.length) out.push(['✦', fresh.length === 1 ? `${fresh[0].name} a une nouvelle envie : « ${fresh[0].quest.title} ».` : `${fresh.length} créatures ont de nouvelles envies (${fresh.slice(0, 3).map(c => c.name).join(', ')}${fresh.length > 3 ? '…' : ''}). Voir leurs fiches.`, 'ev']);
  }
  if (typeof secretsDawn === 'function') secretsDawn(out);
  checkQuests(out);
  if (out.length) { report.push(['sec', 'Âmes du château']); out.forEach(l => report.push(l)); }
}

/* ---------- pouvoirs actifs ---------- */
function usePower(id, a) {
  const ach = ACH.find(x => x.active === id); if (!ach || !PW(ach.id)) return 'Pouvoir verrouillé';
  if (!pwReady(ach)) return `Disponible à la nuit ${S.pwcd[id]}`;
  if (id === 'brume') { if (S.menace <= 0) return 'La Menace est déjà à zéro'; S.menace = Math.max(0, S.menace - 3); addLog('Brume du soir : −3 Menace.', 'ev'); }
  else if (id === 'festin') { homeCreatures().forEach(c => { c.mood = clamp(c.mood + 1, 0, 5); }); addLog('Grand festin : tout le monde se régale.', 'ev'); }
  else if (id === 'rappel') { const c = a && critter(a.id); if (!c || !c.tempt) return 'Personne n’est tenté de partir'; addLoy(c, 25); delete c.tempt; addLog(`Cloche du rappel : ${c.name} reste.`, 'ev'); }
  S.pwcd[id] = S.night + ach.cd;
  return null;
}

/* ---------- commandes (toutes les actions qui modifient la partie) ---------- */
const CMD = {
  place(a) { return withZ(zOK(a.z) ? a.z : Z, () => CMD.place0(a)); },
  place0(a) {
    const { kind, t } = a, x = a.x | 0, y = a.y | 0, w = a.w | 0 || 1, h = a.h | 0 || 1;
    if (Z !== 0 && Z !== EXT && !S.rooms.some(r => zOf(r) === Z)) return 'Cet étage n’existe pas encore';
    if (!(kind === 'room' ? ROOMS[t] : kind === 'def' ? DEFS[t] : kind === 'furn' ? FURN[t] : null)) return 'Sticker inconnu';
    const av = availability(kind, t);
    if (av && av.hide) return 'Indisponible pour ce château';
    if (av && av.lock) return `Nécessite : ${av.reason}`;
    if (av && av.poor) return `Il te faut ${costText(costOf(kind, t))}`;
    if (kind === 'room') { const z = ROOMS[t].size; if (!((w === z[0] && h === z[1]) || (w === z[1] && h === z[0]))) return 'Taille invalide'; }
    const err = kind === 'room' ? checkRoom(t, x, y, w, h) : kind === 'def' ? checkDef(t, x, y) : checkFurn(t, x, y);
    if (err) return err;
    if (kind === 'room') { const r = placeRoom(t, x, y, w, h); V.flash.push({ cells: cellsOf(r), t: performance.now() }); poof(x, y, w, h); if (t !== 'couloir') floatText(x + w / 2, y + h / 2, `Chantier : ${ROOMS[t].clock} segments`); }
    else if (kind === 'def') { const d = placeDef(t, x, y); V.born.set(d.id, performance.now()); poof(x + .2, y + .2, .6, .6); }
    else { const f = placeFurn(t, x, y); V.born.set(f.id, performance.now()); poof(x + .2, y + .2, .6, .6); const fd = FURN[t], main = ['beds', 'food', 'amb', 'gold', 'mat', 'hype'].find(k => fd[k]); if (main) floatText(x + .5, y + .5, `+${fd[main]} ${STAT_LABELS[main][0]}`); }
    return null;
  },
  unstick(a) { const f = S.furn.find(x => x.id === a.id); if (!f) return 'Déjà décollé'; if (f.fixed) return 'Ce meuble est fixé à la pièce'; removeFurn(f); return null; },
  removeDef(a) { const d = S.defs.find(x => x.id === a.id); if (!d) return 'Déjà décollé'; removeDef(d); return null; },
  removeRoom(a) {
    const r = S.rooms.find(x => x.id === a.id); if (!r) return 'Déjà décollée';
    const err = removeCheck(r); if (err) return err;
    poof(r.x, r.y, r.w, r.h); removeRoom(r); addLog(`${ROOMS[r.t].name} décollé.`); return null;
  },
  // renfort de nuit : des bras en plus, payés tout de suite, qui posent leur segment à l'aube (la nuit reste nécessaire)
  push(a) {
    const r = S.rooms.find(x => x.id === a.id); if (!r || r.built) return 'Ce chantier est terminé';
    if (r.prog + (r.boost || 0) >= ROOMS[r.t].clock) return 'Assez de renforts pour finir ce chantier à l’aube'; if (S.gold < 2) return 'Il te faut 2 💰';
    S.gold -= 2; r.boost = (r.boost || 0) + 1; return null;
  },
  post(a) {
    const c = critter(a.id); if (!c || isOut(c)) return 'Absent·e';
    if (a.post) { const r = S.rooms.find(x => x.id === a.post); if (!r || !r.built || isHall(r)) return 'Pièce indisponible'; }
    c.post = a.post || null; return null;
  },
  fire(a) { const c = critter(a.id); if (!c || isOut(c)) return 'Absent·e'; S.creatures = S.creatures.filter(x => x !== c); addLog(`${c.name} a été renvoyé·e.`); return null; },
  // l'envie d'aventure : la seule qui demande une décision (la créature part deux nuits)
  qAccept(a) {
    const c = critter(a.id), q = c && questOf(c); if (!q || q.st !== 'ready') return 'Pas d’aventure en vue';
    if (isOut(c)) return 'Absent·e'; if (S.raid) S.raid.team = S.raid.team.filter(id => id !== c.id);
    c.raid = true; c.away = q.nights; c.awayUntil = S.night + q.nights; c.post = null; q.st = 'away'; critterLeave(c.id); addLog(`${c.name} part à l’aventure : ${q.title}.`, 'ev');
    return null;
  },
  raidPlan(a) {
    const tg = RAIDS[a.target]; if (!tg) return 'Cible inconnue'; if (tg.tier > S.tier) return `Palier ${tg.tier} requis`;
    const team = [...new Set(a.team || [])].slice(0, 3).map(critter).filter(c => c && diceOf(c) > 0 && !injured(c) && (!isOut(c) || (S.raid && S.raid.team.includes(c.id) && !c.away)));
    if (!team.length) return 'Personne ne peut partir';
    cancelRaid(); S.raid = { target: a.target, team: team.map(c => c.id) };
    team.forEach(c => { c.raid = true; say(c.id, pick(['En route !', 'On ramène quoi, chef ?', 'Je prends mon sac.']), 1800); critterLeave(c.id); });
    addLog(`Raid prévu : ${tg.name}.`, 'ev'); return null;
  },
  raidCancel() { cancelRaid(); return null; },
  tierUp() { const st = tierStatus(); if (!st || !st.ok) return 'Conditions non remplies'; pay(st.next.cost); S.tier++; addLog(`Le château atteint le Palier ${S.tier} !`, 'ev'); return null; },
  power(a) { return usePower(a.pw, a); },
  expand() { return expandCastle(); },
  rename(a) { const n = String(a.name || '').trim().slice(0, 40); if (!n) return 'Nom vide'; S.name = n; return null; },
};
// exécute une commande : en solo tout de suite, en château partagé elle passe aussi par l’hôte
function cmd(name, a = {}) {
  if (typeof VISIT !== 'undefined' && VISIT) return 'Tu es en visite chez un voisin : rien ne se touche !';
  const f = CMD[name]; if (!f) return 'Action inconnue';
  const role = typeof COOP !== 'undefined' ? COOP.role : null;
  if (role === 'guest') {
    if (COOP.busy) return 'La nuit se joue chez l’hôte, patience…';
    if (name === 'rename') return 'Seul l’hôte peut renommer son château';
    const err = f(a); if (err) return err;
    coopSend({ t: 'cmd', c: name, a }); return null;
  }
  const err = f(a);
  if (!err && role === 'host') coopDirty();
  return err;
}

/* ---------- fenêtres : hauts faits, réputation ---------- */
function openAch() {
  const n = ACH.filter(a => S.ach[a.id]).length, cats = [...new Set(ACH.map(a => a.cat))];
  const actives = ACH.filter(a => a.active && S.ach[a.id]);
  const pwHtml = actives.length ? actives.map(a => {
    const ready = pwReady(a), tempted = a.active === 'rappel' ? S.creatures.filter(c => c.tempt) : null;
    const btn = a.active === 'rappel'
      ? (tempted.length ? tempted.map(c => `<button class="sbtn" type="button" data-pw="rappel" data-id="${c.id}" ${ready ? '' : 'disabled'}>🔔 Retenir ${esc(c.name)}</button>`).join('') : '<span class="hint">Personne n’est tenté de partir.</span>')
      : `<button class="sbtn pri" type="button" data-pw="${a.active}" ${ready ? '' : 'disabled'}>⚡ Activer</button>`;
    return `<div class="pwrow"><span class="emo">${a.ico}</span><span><b>${esc(a.pw)}</b><br><span class="hint">${esc(a.pd)} Recharge : ${a.cd} nuits.${ready ? '' : ` Prêt à la nuit ${S.pwcd[a.active]}.`}</span></span><span class="btnrow">${btn}</span></div>`;
  }).join('') : '<p class="hint">Certains hauts faits débloquent des pouvoirs à activer (Brume du soir, Grand festin, Cloche du rappel).</p>';
  const m = openModal(`<h2>🏆 Hauts faits</h2><p class="hint">${n}/${ACH.length} débloqués. Chaque haut fait offre un pouvoir permanent à ton château.</p>
    <h3>Pouvoirs à activer</h3><div class="pwlist">${pwHtml}</div>
    ${cats.map(cat => `<h3>${esc(cat)}${cat === 'Val des Maîtres' && !netUsable() ? ' <small class="hint">(version en ligne)</small>' : ''}</h3><div class="achgrid">${ACH.filter(a => a.cat === cat).map(a => {
      const on = !!S.ach[a.id];
      return `<div class="ach ${on ? 'on' : ''}"><span class="emo">${on ? a.ico : '🔒'}</span><b>${esc(a.name)}</b><span>${esc(a.desc)}</span><span class="pw">${on ? '⚡' : '🎁'} ${esc(a.pw)} : ${esc(a.pd)}</span>${on ? `<small>Nuit ${S.ach[a.id]}</small>` : ''}</div>`;
    }).join('')}</div>`).join('')}`, { wide: true, label: 'Hauts faits' });
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-pw]'); if (!b || b.disabled) return;
    const err = cmd('power', { pw: b.dataset.pw, id: b.dataset.id });
    if (err) { toast(err, true); sfx('bad'); return; }
    sfx('chime'); toast('⚡ Pouvoir activé !'); afterChange(); openAch();
  });
}
function openRenown() {
  const known = SPECIES_ORDER.filter(sp => S.album[sp]), unknown = SPECIES_ORDER.filter(sp => !S.album[sp]);
  const row = sp => {
    const d = SPECIES[sp], v = repOf(sp), t = repTarget(sp), best = bestRival(sp), trend = t.v > v + 2 ? '↗' : t.v < v - 2 ? '↘' : '→';
    const mates = S.creatures.filter(c => c.sp === sp).length;
    return `<details class="reprow"><summary><img class="th" alt="" src="${thumb('char', sp)}"><span class="who"><b>${esc(d.name)}</b><span>${mates ? `${mates} au château` : 'aucun au château'}${best ? ` · rival : ${esc(best.name)} ${Math.round(best.v)}` : ''}</span></span>${stars(v)}<span class="num repv ${best && best.v > v ? 'low' : ''}">${v} <i>${trend}</i></span></summary>
      <div>${t.f.map(([l, n]) => `<span class="tag2">${n > 0 ? '+' + n : n < 0 ? n : '·'} ${esc(l)}</span>`).join('')}<p class="hint">Visée : ${t.v}. La réputation rejoint doucement sa visée à chaque aube.</p></div></details>`;
  };
  const vr = typeof valRivals === 'function' ? valRivals() : [];
  openModal(`<h2>⭐ Réputation</h2><p><b>Ce que pensent de toi les espèces</b> : chacune juge ton château sur 100.</p>
    <p>Ce qui compte : pièces qui lui plaisent, sticker préféré, humeur et épanouissement des siens, ambiance. Plus ta réputation est haute, plus elle vient volontiers… et moins ses membres sont tentés d’aller voir ailleurs.</p>
    <p class="hint">Une créature peu loyale (moins de 40) peut lorgner vers un château mieux réputé pour son espèce. Elle te prévient une nuit à l’avance : comble son envie ou réalise son rêve secret. Désertions : ${({ on: 'activées', soft: 'douces', off: 'désactivées' })[S.opts.desert]} (menu ⚙️).</p>
    <h3>Ta réputation</h3><div class="replist">${known.map(row).join('') || '<p class="hint">Accueille des créatures pour te faire une réputation.</p>'}</div>
    ${unknown.length ? `<p class="hint">${unknown.length} espèce${unknown.length > 1 ? 's' : ''} encore inconnue${unknown.length > 1 ? 's' : ''}.</p>` : ''}
    <h3>Les châteaux rivaux</h3><div class="rivals">${RIVALS.map(r => `<div class="rival"><span class="emo">${r.emo}</span><span><b>${esc(r.name)}</b><br><span class="hint">Tenu par ${esc(r.master)}. Prisé des ${r.likes.map(s => SPECIES[s] ? SPECIES[s].name.toLowerCase() + 's' : s).join(', ')}.</span></span></div>`).join('')}
    ${vr.length ? `<p class="hint">+ ${vr.length} château${vr.length > 1 ? 'x' : ''} de joueurs du Val des Maîtres.</p>` : ''}</div>`, { wide: true, label: 'Réputation' });
}
function bindSouls() {
  $('#btnRen').addEventListener('click', () => { if (!UI.busy) openRenown(); });
  $('#btnAch').addEventListener('click', () => { if (!UI.busy) openAch(); });
  $('#btnQuests').addEventListener('click', () => { if (!UI.busy) openMissions(); });
  bindVal(); updateRep();
}

/* ---------- Grimoire : les âmes du château et le Val ---------- */
Object.assign(WIKI, {
  reputation: { cat: 'ames', t: 'Réputation par espèce', x: () => `<p>Ce que pensent de toi les espèces : chacune juge ton château sur 100 (⭐ Réputation, à gauche de l’écran). Ce qui compte :</p>
    <ul><li>la pièce qui l’attire, meublée (plus si tu en as plusieurs), et son sticker préféré ;</li><li>l’humeur et l’{c:loyaute|épanouissement} des siens au château ;</li><li>l’{c:ambiance}, la notoriété et le {c:paliers|palier} ;</li>
    <li>en moins : la présence de son espèce rivale, et les désertions récentes.</li></ul>
    <p>La réputation rejoint doucement sa visée à chaque aube. Une bonne réputation fait venir l’espèce plus souvent, et retient ceux qui sont déjà là : une créature ne lorgne vers un autre château que s’il reçoit mieux son espèce que toi. Voir {c:desertion} et {c:rivaux}.</p>` },
  loyaute: { cat: 'ames', t: 'Loyauté et épanouissement', x: () => `<p>Chaque créature a deux jauges sur 100, visibles sur sa fiche.</p>
    <ul><li><b>Épanouissement</b> : son bonheur profond. Il suit l’{c:humeur} (un toit, un lit, puis 10 points par cœur), son sticker préféré, un poste dans sa pièce rêvée, un·e ami·e de son espèce, une {c:missions|mission} réussie, une caresse… Il baisse avec la faim, un rival, une demande ignorée.</li>
    <li><b>Loyauté</b> : son attachement à toi. À chaque aube, elle monte si l’épanouissement dépasse 50 et baisse s’il est en dessous. Les envies comblées, les rêves réalisés, les raids réussis et les invasions repoussées la font grimper d’un coup.</li></ul>
    <p>Sous 40 de loyauté, une créature peut être tentée par un château mieux réputé : voir {c:desertion}.</p>` },
  desertion: { cat: 'ames', t: 'Désertions', x: () => `<p>Une créature peu loyale (moins de 40) peut lorgner vers un château qui reçoit mieux son espèce : un {c:rivaux|château rival} du jeu, ou le château d’un autre joueur du {c:val}. Elle prévient toujours <b>une nuit avant</b> (👀 sur son portrait).</p>
    <ul><li>Pour la retenir : combler son {c:missions|envie} (+12 à +20 loyauté), réaliser son rêve secret (+25, et elle ne partira plus jamais), ou améliorer ta {c:reputation}. Le pouvoir <b>Cloche du rappel</b> la retient à coup sûr.</li>
    <li>Le risque dépend de sa loyauté, de son épanouissement et de l’écart de réputation. Il n’y a jamais de départ avant la nuit 6, pendant le tutoriel, ni pendant les 4 premières nuits d’une recrue.</li>
    <li>Les diablotins, nés du Cœur, et les créatures entrées dans la légende ne partent jamais.</li></ul>
    <p>Les désertions sont <b>optionnelles</b> : menu ⚙️ → Désertions activées, douces (deux fois moins) ou désactivées. En ligne, une créature qui part pour le château d’un autre joueur frappe vraiment à sa porte !</p>` },
  missions: { cat: 'ames', t: 'Envies et rêves secrets', x: () => `<p>Chaque créature déclare une <b>envie</b> (✦ sur sa fiche, et la liste 📜 des envies) : son sticker préféré, un poste dans sa pièce, de la déco, un·e ami·e, une pièce de plus, un raid réussi… Comble-la : la récompense tombe aussitôt (or, bouche-à-oreille, stickers, {c:loyaute|loyauté}, expérience), sans rien réclamer.</p>
    <ol><li><b>Chapitres 1 et 2</b> de son histoire : des envies comblées. Une créature n’a pas toujours une envie : une nouvelle se déclare de temps en temps, au plus tôt deux nuits après la précédente.</li><li><b>Chapitre 3</b> : une fois son <b>rêve secret</b> réalisé, l’envie d’<b>aventure</b>, la seule qui demande ta décision. Laisse-la partir deux nuits ; à son retour, ses dés décident du résultat et son histoire entre dans la <b>légende</b> (une légende ne déserte jamais).</li></ol>
    <p>Chaque créature cache aussi un <b>rêve secret</b> (💭), tiré de son {c:caracteres|caractère} : un lit à baldaquin, un poste rien qu’à elle, un étage de plus… Réalisé, il rapporte gros (+25 loyauté, de l’expérience, un Cristal), et la créature ne songe plus jamais à partir. Pour le découvrir :</p>
    <ul><li><b>Par hasard</b> : tu le réalises sans le savoir, et la surprise est totale.</li><li><b>Les confidences</b> : à ${PW('calins') ? 65 : 80} de loyauté, elle te le confie.</li><li><b>Les ragots de la Taverne</b> : chaque nuit, une {room:taverne} meublée peut trahir un secret, plus souvent avec des Ménestrels et des bavards.</li><li><b>La diseuse de bonne aventure</b>, à la taverne des villes : contre quelques pièces, elle lit le rêve d’une de tes créatures dans le marc de bière.</li></ul>` },
  niveaux: { cat: 'ames', t: 'Niveaux et légendes', x: () => `<p>Les créatures gagnent de l’expérience avec leurs envies comblées, les raids réussis et les invasions repoussées.</p>
    <ul>${[2, 3, 4, 5].map(l => `<li><b>Niveau ${l}</b> (${LVL_XP[l]} XP) : ${LVL_PERK[l]}.</li>`).join('')}</ul><p>Une <b>légende</b> (histoire terminée) ne déserte jamais.</p>` },
  hautsfaits: { cat: 'ames', t: 'Hauts faits et pouvoirs', x: () => `<p>Chaque haut fait débloque un <b>pouvoir</b> permanent pour ton château (🏆 à gauche de l’écran). Certains pouvoirs s’activent à la demande, puis se rechargent pendant quelques nuits.</p>
    <ul>${ACH.map(a => `<li><b>${esc(a.name)}</b> : ${esc(a.desc)} → <i>${esc(a.pw)}</i> : ${esc(a.pd)}</li>`).join('')}</ul>` },
  rivaux: { cat: 'ames', t: 'Châteaux rivaux', x: () => `<p>Quatre châteaux voisins tenus par le jeu se disputent les créatures du Val. Leur réputation grandit doucement au fil des nuits :</p>
    <ul>${RIVALS.map(r => `<li><b>${esc(r.name)}</b>, ${esc(deM(r.master))} : prisé des ${r.likes.map(s => `{sp:${s}}`).join(', ')}.</li>`).join('')}</ul><p>En ligne, les châteaux des autres joueurs du {c:val} comptent aussi comme rivaux.</p>` },
  val: { cat: 'val', t: 'Le Val des Maîtres', x: () => `<p>La version en ligne du jeu (${SITE_URL}) réunit tous les joueurs, sans compte : ta clé de Maître est gardée dans ton navigateur.</p>
    <ul><li><b>Châteaux</b> : la liste des châteaux du Val, qui est en ligne, et un bouton pour les <b>visiter</b> (on regarde, on ne touche pas).</li>
    <li><b>Livre d’or</b> : laisse un mot gentil et un sticker, une fois par jour et par château.</li><li><b>Cadeaux</b> : offre 3 or, 3 bois ou un sticker de ta réserve. Un par voisin et trois par jour.</li>
    <li><b>Escarmouches</b> : voir {c:escarmouches}.</li><li><b>Palmarès</b> de la saison (le mois en cours) et château chouchou de chaque espèce.</li>
    <li><b>Créatures voyageuses</b> : une créature qui {c:desertion|déserte} peut rejoindre le château d’un autre joueur mieux réputé pour son espèce… et inversement !</li><li>Et le {c:partage|château partagé} pour jouer à plusieurs.</li></ul>
    <p class="hint">Tout ce qui est publié dans le Val (nom de Maître, château, mots) est public. Évite d’y mettre ton vrai nom.</p>` },
  partage: { cat: 'val', t: 'Le château partagé', x: () => `<p>Ouvre ton château à 4 amis au plus (🌐 Le Val → Château partagé) : tu obtiens un code à 6 lettres et un lien à leur envoyer.</p>
    <ul><li>Tout le monde colle des pièces, des meubles et des pièges, comble les envies des créatures, prépare des raids. L’hôte vérifie chaque action.</li>
    <li>On voit les curseurs des autres, le sticker qu’ils ont en main, et on peut discuter.</li><li>Les invités cliquent <b>Je suis prêt·e</b> ; l’hôte lance la nuit et chacun voit la chronique.</li>
    <li>La partie se joue dans le château de l’hôte. Les invités retrouvent le leur en partant, et gagnent le haut fait « Main dans la main ».</li></ul>` },
  escarmouches: { cat: 'val', t: 'Escarmouches et boucliers', x: () => `<p>En visite chez un voisin, tu peux lancer une <b>escarmouche</b> : jusqu’à 3 créatures tentent de chaparder un peu d’or. On lance un dé par point de raid de l’équipe, moins un dé par tranche de 6 de défense du château visé (pièges, garde des pièces et créatures prêtes à défendre).</p>
    <ul><li>Réussie : de l’or (selon le palier du voisin) et du bouche-à-oreille. Le voisin perd au plus 4 or.</li><li>Ratée : ton équipe rentre vexée, la Menace monte, et le voisin gagne de l’or et du bouche-à-oreille.</li>
    <li>Une escarmouche par nuit. Un château visité gagne un <b>bouclier</b> de 12 heures.</li><li>Un château <b>pacifique</b> (case à cocher dans le Val) ne peut ni viser, ni être visé.</li></ul>` },
});
// toutes les envies du château dans une fenêtre (sur téléphone, le suivi de droite est masqué)
function openMissions() {
  const cs = S.creatures.slice().sort((a, b) => (questOf(b) && questOf(b).st === 'ready' ? 1 : 0) - (questOf(a) && questOf(a).st === 'ready' ? 1 : 0)), goals = GOALS.filter(g => !S.goals[g.id]).slice(0, 4);
  const row = c => { const q = questOf(c), T = q && QT[q.k], st = !q ? (c.legend ? '🗿 légende' : 'pas d’envie pour l’instant') : q.st === 'ready' ? '🧭 rêve d’aventure : à toi de décider' : q.st === 'away' ? `🧭 en route, retour nuit ${c.awayUntil}` : `${T.ico} ${q.title} · ${T.prog(q, c)}`;
    const sec = typeof secretLine === 'function' ? secretLine(c) : '';
    return `<button class="crow" type="button" data-crit="${c.id}"><img class="th" alt="" src="${thumb('char', c.sp)}"><span class="who"><b>${esc(c.name)}</b><span>${esc(st)}</span>${sec ? `<span class="hint" style="display:block">${esc(sec)}</span>` : ''}</span></button>`; };
  const m = openModal(`<h2>📜 Les envies</h2>
    <h3>Tes créatures</h3><div class="clist">${cs.map(row).join('') || '<p class="hint">Personne pour l’instant.</p>'}</div>
    <h3>Envies du château</h3><ul class="chron">${goals.map(g => `<li class="ev"><span class="emo">✦</span><span>${esc(g.text)} <span class="hint">→ ${esc(rewardText(g.reward))}</span></span></li>`).join('') || '<li><span>Toutes les envies sont comblées !</span></li>'}</ul>
    <div class="btnrow"><button class="sbtn" type="button" data-wiki-open="missions">📖 Envies et rêves secrets</button><button class="sbtn" type="button" id="mqLog">Chronique</button></div>`, { wide: true, label: 'Envies' });
  m.addEventListener('click', e => { const c = e.target.closest('[data-crit]'); if (c) openCreature(c.dataset.crit); else if (e.target.closest('#mqLog')) openJournal(); });
}
