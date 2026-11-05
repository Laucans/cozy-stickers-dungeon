
/* =========================================================
   Victoires, comme dans Civilization : cinq chemins pour devenir
   le Grand Maître du Val. Les donjons rivaux (et le Baron) font
   la course ; si l'un d'eux gagne avant toi, une nouvelle ère
   commence, et tu gardes tout ce que tu as bâti.
   ========================================================= */
const VICTORIES = [
  { id: 'legende', ico: '🌟', name: 'Victoire de Légende', short: 'Ton château devient un mythe.', rival: 'ombrelune' },
  { id: 'terreur', ico: '⚔️', name: 'Victoire de Terreur', short: 'Le Val tremble, mais personne ne meurt.', rival: 'septbieres' },
  { id: 'voisinage', ico: '🗳️', name: 'Victoire de Bon Voisinage', short: 'Le Conseil du Val te nomme Protecteur.', rival: 'baron' },
  { id: 'menagerie', ico: '🐾', name: 'Victoire de la Grande Ménagerie', short: 'Le bestiaire le plus complet du Val.', rival: 'moussues' },
  { id: 'secrets', ico: '🗝️', name: 'Victoire des Secrets', short: 'Tu perces le mystère du Val.', rival: 'morgrave' },
];
const VIC_BY = Object.fromEntries(VICTORIES.map(v => [v.id, v]));
const MENAGERIE_SP = SPECIES_ORDER.slice();
// la Ménagerie compte les créatures installées (5 nuits au château) : 85 % d'entre elles épanouies suffisent, un nouveau venu ne casse pas la série
const MEN_HAPPY = .85, menSettled = () => S.creatures.filter(c => !isOut(c) && S.night - (c.joined || 1) >= 5);
const mythic = () => GLOW_LV[GLOW_LV.length - 1][0];   // le seuil de la Légende : Mythique, le dernier niveau de la notoriété
const BARON = { id: 'baron', name: 'Le Baron Pâlichon', emo: '🎩' };
const racer = id => id === 'baron' ? BARON : RIVALS.find(r => r.id === id);
const raceGoal = id => (VICTORIES.find(v => v.rival === id) || {}).id;
function vicState() {
  if (!S.vic) S.vic = { won: {}, era: 1, master: null, race: { ombrelune: 0, septbieres: 0, moussues: 0, morgrave: 0, baron: 0 }, vassals: {}, door: {}, siege: 0, votes: 0, gw: {}, requests: [], happy: 0, croisade: null, proj: null, seen: {}, councils: 0 };
  return S.vic;
}
const isVassal = id => !!(S.vic && S.vic.vassals[id] >= 3);
// le tribut d'un vassal, chaque nuit
const VASSAL_TRIBUTE = { g: 1, s: 1 };
// le point « troisième étage, puis rentrer » : une seule fois par rival (v.door[rival] = la nuit où il a été pris) ; ensuite, seul son boss le fait plier
// une ancienne sauvegarde n'a pas v.door : un rival à 1 point l'a forcément pris par l'étage (le boss en vaut 2)
function vicDoor() { const v = vicState(); if (!v.door) { v.door = {}; RIVALS.forEach(r => { if ((v.vassals[r.id] || 0) % 2 === 1) v.door[r.id] = 0; }); } return v.door; }
const doorTaken = id => vicDoor()[id] != null;
const allVassals = () => RIVALS.every(r => isVassal(r.id));

/* ---------- bonne volonté des villages, villes et cité ---------- */
const GW0 = { village: 30, ville: 20, cite: 10 };
const VOICES = { village: 1, ville: 2, cite: 3 };
const gwOf = s => { const v = vicState(); return v.gw[s.id] != null ? v.gw[s.id] : GW0[s.kind] || 20; };
function addGw(s, n) { const v = vicState(); v.gw[s.id] = clamp(Math.round(gwOf(s) + n), 0, 100); }
const settlements = () => world().sites.filter(s => SITE_KINDS[s.kind].rank);
// le lieu habité le plus proche d'une cible de raid : c'est lui qui t'en veut
function nearestSettlement(site) { return settlements().slice().sort((a, b) => hdist(a.q, a.r, site.q, site.r) - hdist(b.q, b.r, site.q, site.r))[0]; }

/* ---------- requêtes des villages ---------- */
const REQ = {
  percepteur: { text: 'Le percepteur du bailli nous saigne. Envoie une créature lui faire une belle frayeur.', kind: 'send', nights: 1, tag: 'ruse', gw: 20, rw: { g: 3 } },
  vache: { text: 'La vache de la mère Pichenette s’est sauvée dans les bois. Tu nous la ramènes ?', kind: 'send', nights: 1, gw: 18, rw: { s: 2 } },
  fete: { text: 'C’est la fête et il nous manque un musicien. Un Ménestrel ou une Harpie ferait l’affaire.', kind: 'send', nights: 1, need: ['menestrel', 'harpie'], gw: 25, rw: { h: 2 } },
  moutons: { text: 'Des loups rôdent autour des moutons. Prête-nous un bon gardien (garde 2 ou plus) pendant deux nuits.', kind: 'send', nights: 2, guard: 2, gw: 25, rw: { g: 2 } },
  fantome: { text: 'Un fantôme hante le moulin et fait pleurer les enfants. Un des tiens pourrait lui parler ?', kind: 'send', nights: 1, need: ['fantome', 'vampire', 'liche', 'sorciere', 'squelette'], gw: 22, rw: { h: 1 } },
  pont: { text: 'Le pont s’est effondré. Un peu de bois, et on le rebâtit en ton honneur.', kind: 'pay', cost: { s: 4 }, gw: 15 },
  grain: { text: 'Le grenier est vide avant l’hiver. Cinq pièces d’or nous sauveraient.', kind: 'pay', cost: { g: 5 }, gw: 15 },
  heros: { text: 'Des apprentis héros parlent de « libérer » ton château. Donne-leur une bonne leçon : repousse une invasion.', kind: 'repel', gw: 20 },
};
const openReqs = () => vicState().requests.filter(q => q.st !== 'done');
const reqAt = siteId => openReqs().find(q => q.site === siteId);
function reqCandidates(q) { const R = REQ[q.req]; return S.creatures.filter(c => !isOut(c) && (!R.need || R.need.includes(c.sp)) && (!R.guard || guardOf(c) >= R.guard)); }
function newRequest(out) {
  const v = vicState(); if (openReqs().length >= 2) return;
  const free = settlements().filter(s => siteKnown(s) && gwOf(s) < 100 && !reqAt(s.id)); if (!free.length) return;
  const s = pick(free), keys = Object.keys(REQ).filter(k => !REQ[k].need || S.creatures.some(c => REQ[k].need.includes(c.sp))), k = pick(keys);
  v.requests.push({ id: 'q' + S.seq++, req: k, site: s.id, n: S.night, until: S.night + (REQ[k].kind === 'repel' ? 10 : 6), st: 'open' });
  if (v.requests.length > 12) v.requests = v.requests.slice(-12);
  out.push(['📜', `${s.name} t’adresse une requête : « ${REQ[k].text} » (voir la carte)`, 'ev']);
}
function reqReward(q, s, out, k = 1) {
  const R = REQ[q.req], rw = R.rw || {}; addGw(s, Math.round(R.gw * k)); q.st = 'done';
  if (rw.g) S.gold += rw.g; if (rw.s) S.mat += rw.s; if (rw.h) S.hype += rw.h;
  const t = `Requête accomplie pour ${s.name} : bonne volonté +${Math.round(R.gw * k)}${rw.g ? `, +${rw.g} 💰` : ''}${rw.s ? `, +${rw.s} 🪵` : ''}${rw.h ? `, +${rw.h} 💬` : ''}.`;
  addLog(t, 'good'); if (out) out.push(['🤝', t, 'good']); return t;
}
CMD.request = a => {
  const q = openReqs().find(x => x.id === a.id); if (!q) return 'Cette requête n’est plus d’actualité';
  const R = REQ[q.req], s = siteById(q.site); if (!s) return 'Lieu inconnu';
  if (R.kind === 'pay') { if (!canAfford(R.cost)) return `Il te faut ${costText(R.cost)}`; pay(R.cost); reqReward(q, s); return null; }
  if (R.kind !== 'send' || q.st !== 'open') return 'Rien à envoyer';
  const c = critter((a.team || [])[0]); if (!c || isOut(c)) return 'Choisis qui part';
  if (!reqCandidates(q).includes(c)) return R.need ? `Il faut : ${R.need.map(k => SPECIES[k] ? SPECIES[k].name : k).join(' ou ')}` : 'Il faut un gardien plus solide';
  if (S.raid) S.raid.team = S.raid.team.filter(id => id !== c.id);
  c.raid = true; c.away = R.nights; c.awayUntil = S.night + R.nights; c.post = null; c.expe = { gid: 'x' + S.seq++, site: null, req: q.id, n: S.night }; critterLeave(c.id);
  q.st = 'sent'; addLog(`${c.name} part aider ${s.name}.`, 'ev'); return null;
};
// retour d'une créature partie aider un village (appelé par worldDawn)
function reqDawn(team, e, out) {
  const q = vicState().requests.find(x => x.id === e.req), c = team[0]; if (!q) return;
  const s = siteById(q.site), R = REQ[q.req], pool = Math.max(1, diceOf(c) + ((SPECIES[c.sp] || {}).tag === R.tag ? 1 : 0) + (R.guard && guardOf(c) >= R.guard ? 1 : 0) + (R.need ? 1 : 0)), roll = rollPool(pool);
  if (roll.res !== 'fail') { const t = reqReward(q, s, null, roll.res === 'partial' ? .7 : 1); gainXP(c, 1, out); addLoy(c, 3); out.push(['🤝', `${c.name} revient de ${s.name} (dés : ${roll.dice.join(', ')}). ${t}`, 'good']); }
  else { addGw(s, 5); q.st = 'done'; c.mood = clamp(c.mood - 1, 0, 5); out.push(['💨', `${c.name} n’a pas réussi à aider ${s.name} (dés : ${roll.dice.join(', ')}). Ils apprécient quand même l’effort : bonne volonté +5.`, 'bad']); }
}

/* ---------- les étapes de chaque victoire ---------- */
const st = (text, done, finale) => ({ text, done: !!done, finale: !!finale });
function mapPct() { const w = world(); return Math.round(visibleSet().size / w.list.length * 100); }
const artFound = () => Object.keys((S.world && S.world.found) || {}).length;
const artPlaced = () => new Set(S.furn.filter(f => ARTEFACTS.includes(f.t)).map(f => f.t)).size;
const legendsHome = () => S.creatures.filter(c => c.legend).length;
const albumN = () => MENAGERIE_SP.filter(k => S.album[k]).length;
function vicStages(id) {
  const v = vicState();
  if (id === 'legende') { const g = radiance(), lv = GLOW_LV.slice(-3).map(x => x[0]); return [st(`Notoriété Illustre (${Math.min(g, lv[0])}/${lv[0]} 🔥)`, g >= lv[0] || v.croisade), st(`Notoriété Légendaire (${Math.min(g, lv[1])}/${lv[1]} 🔥)`, g >= lv[1] || v.croisade), st(`Notoriété Mythique (${Math.min(g, lv[2])}/${lv[2]} 🔥)`, g >= lv[2] || v.croisade),
    st(`Finale : repousser la Croisade des héros de Mirebrume (${v.croisade ? Math.min(3, v.croisade.done) : 0}/3)`, v.croisade && v.croisade.done >= 3, true)]; }
  if (id === 'terreur') return [...RIVALS.map(r => st(`Soumettre ${r.name} (${Math.min(3, v.vassals[r.id] || 0)}/3 points : boss 2 ; 3e étage et 2 combats gagnés 1, une seule fois${doorTaken(r.id) && !isVassal(r.id) ? ', déjà pris' : ''}${v.bossHp && v.bossHp[r.id] != null && !isVassal(r.id) ? ` ; son boss blessé : ${Math.round(v.bossHp[r.id] * 100)} % de ses PV` : ''})`, isVassal(r.id))), st(`Finale : le Siège de Mirebrume, aux cartes (${Math.min(3, v.siege)}/3 assauts réussis${v.siege < 3 ? `, prochain : ${siegeQ().name}` : ''})`, v.siege >= 3, true)];
  if (id === 'voisinage') return [5, 10, 15].map(n => st(`${n} voix au Conseil du Val (${Math.min(v.votes, n)}/${n})`, v.votes >= n)).concat([st(`Finale : 20 voix, et le Conseil te nomme Protecteur du Val (${Math.min(v.votes, 20)}/20)`, v.votes >= 20, true)]);
  if (id === 'menagerie') { const p = v.proj && v.proj.id === 'parade' ? v.proj : null; return [st(`Album complet (${albumN()}/${MENAGERIE_SP.length} espèces, rares comprises)`, albumN() >= MENAGERIE_SP.length || p), st(`5 légendes au château (${Math.min(5, legendsHome())}/5)`, legendsHome() >= 5 || p),
    st(`${Math.round(MEN_HAPPY * 100)} % de tes créatures installées épanouies (70 ou plus) trois nuits de suite, à 8 au moins (${Math.min(3, v.happy)}/3)`, v.happy >= 3 || p), st(`Finale : la Grande Parade, 4 nuits sans départ ni bouderie (${v.won.menagerie ? 4 : p ? p.prog : 0}/4)`, !!v.won.menagerie, true)]; }
  if (id === 'secrets') { const p = v.proj && v.proj.id === 'rituel' ? v.proj : null, m = mapPct(); return [st(`Dévoiler la carte (${Math.min(m, 90)}/90 %)`, m >= 90 || p), st(`Trouver les 12 artefacts (${Math.min(12, artFound())}/12)`, artFound() >= 12 || p),
    st(`Les exposer tous, avec un Reliquaire (${artPlaced()}/12${builtCount('reliquaire') ? '' : ', pas de Reliquaire'})`, (artPlaced() >= 12 && builtCount('reliquaire') > 0) || p), st(`Finale : le Rituel des Douze, 3 nuits sans perdre un artefact (${v.won.secrets ? 3 : p ? p.prog : 0}/3)`, !!v.won.secrets, true)]; }
  return [];
}
function vicPct(id) {
  const v = vicState(); if (v.won[id]) return 100;
  if (id === 'legende') return Math.round(Math.min(1, radiance() / mythic()) * 75 + (v.croisade ? Math.min(3, v.croisade.done) / 3 * 25 : 0));
  if (id === 'terreur') return Math.round(RIVALS.reduce((a, r) => a + Math.min(3, v.vassals[r.id] || 0), 0) / 12 * 75 + Math.min(3, v.siege) / 3 * 25);
  if (id === 'voisinage') return Math.round(Math.min(20, v.votes) / 20 * 100);
  const s = vicStages(id), p = v.proj && v.proj.id === (id === 'menagerie' ? 'parade' : 'rituel') ? v.proj : null;
  const part = id === 'secrets' ? [Math.min(1, mapPct() / 90), Math.min(1, artFound() / 12), Math.min(1, artPlaced() / 12) * (builtCount('reliquaire') ? 1 : .9)] : [Math.min(1, albumN() / MENAGERIE_SP.length), Math.min(1, legendsHome() / 5), Math.min(1, v.happy / 3)];
  return Math.round(s.slice(0, 3).reduce((a, x, i) => a + (x.done ? 1 : part[i] * .9), 0) / 3 * 75 + (p ? p.prog / p.need * 25 : 0));   // chaque étape compte déjà à moitié faite
}
// une grande finale qu'on lance soi-même : la Parade (ménagerie) ou le Rituel (secrets)
const PROJ = { parade: { vic: 'menagerie', name: 'la Grande Parade', need: 4, cost: { g: 20, s: 10 } }, rituel: { vic: 'secrets', name: 'le Rituel des Douze', need: 3, cost: { g: 15, s: 5 } } };
const projReady = k => !vicState().proj && !vicState().won[PROJ[k].vic] && vicStages(PROJ[k].vic).slice(0, 3).every(x => x.done);
CMD.project = a => {
  const P = PROJ[a.id]; if (!P) return 'Projet inconnu'; if (vicState().proj) return 'Un grand projet est déjà en cours';
  if (!projReady(a.id)) return 'Toutes les étapes ne sont pas encore franchies'; if (!canAfford(P.cost)) return `Il te faut ${costText(P.cost)}`;
  pay(P.cost); vicState().proj = { id: a.id, prog: 0, need: P.need, ids: S.creatures.map(c => c.id), n: S.night };
  addLog(`Début de ${P.name} !`, 'ev'); return null;
};

/* ---------- gagner, perdre une ère ---------- */
function winVictory(id, out) {
  const v = vicState(); if (v.won[id]) return;
  v.won[id] = S.night; v.justWon = id; S.stats.victories = (S.stats.victories || 0) + 1;
  const t = `${VIC_BY[id].name} ! ${S.name} entre au Panthéon du Val.`; addLog(t, 'ev'); if (out) out.push(['🏛️', t, 'good']);
  if (typeof pantheonPublish === 'function') pantheonPublish(id);
}
function newEra(champ, out) {
  const v = vicState(), r = racer(champ), goal = VIC_BY[raceGoal(champ)];
  v.era++; v.master = champ; v.eraNews = champ;
  Object.keys(v.race).forEach(k => { if (!isVassal(k)) v.race[k] = Math.round(Math.random() * 8); });
  const t = `Nouveau Grand Maître du Val : ${r.name}, par la ${goal.name.replace('Victoire', 'victoire')}. Les rivaux repartent de zéro ; tes progrès, eux, restent intacts.`;
  addLog(t, 'bad'); out.push(['👑', t, 'bad']);
}
function raceTick(out) {
  const v = vicState();
  RIVALS.forEach(r => {
    if (isVassal(r.id)) return;
    const before = v.race[r.id] || 0, slow = S.world && S.world.hit && S.world.hit[r.id] > S.night ? .4 : 1;
    v.race[r.id] = Math.min(100, before + (.8 + Math.random() * .6) * slow);
    [50, 75, 90].forEach(m => { if (before < m && v.race[r.id] >= m) out.push(['⚠️', `Course à la victoire : ${r.name} en est à ${m} % de la ${VIC_BY[raceGoal(r.id)].name.replace('Victoire', 'victoire')}.`, 'bad']); });
  });
  const champ = Object.keys(v.race).find(k => v.race[k] >= 100); if (champ) newEra(champ, out);
}
function council(out) {
  const v = vicState(), setts = settlements(); let mine = 0; const yes = [];
  setts.forEach(s => { if (gwOf(s) >= 60) { mine += VOICES[s.kind]; yes.push(s.name); } });
  const total = setts.reduce((a, s) => a + VOICES[s.kind], 0), before = v.votes; v.votes += mine; v.councils++;
  v.race.baron = Math.min(100, (v.race.baron || 0) + (total - mine) / 20 * 100 * .35);
  out.push(['🗳️', `Conseil du Val : ${mine} voix pour toi${yes.length ? ` (${yes.join(', ')})` : ''}, ${total - mine} pour le Baron Pâlichon. Tes voix : ${Math.min(v.votes, 20)}/20.`, mine ? 'good' : '']);
  if (before < 20 && v.votes >= 20) winVictory('voisinage', out);
}

/* ---------- chaque aube ---------- */
function victoryDawn(report) {
  if (!S.started) return;
  const v = vicState(), out = [];
  // vassaux : tribut
  const vas = RIVALS.filter(r => isVassal(r.id)); if (vas.length) { const g = VASSAL_TRIBUTE.g * vas.length, s = VASSAL_TRIBUTE.s * vas.length; S.gold += g; S.mat += s; out.push(['🪙', `Tes vassaux versent leur tribut : +${g} 💰, +${s} 🪵.`, 'good']); }
  // la bonne volonté retombe doucement ; les requêtes vieillissent ; parfois une nouvelle
  Object.keys(v.gw).forEach(k => { if (v.gw[k] > 40) v.gw[k]--; });
  v.requests.forEach(q => { if (q.st === 'open' && S.night > q.until) { q.st = 'done'; const s = siteById(q.site); if (s) { addGw(s, -5); out.push(['⌛', `${s.name} a attendu en vain : bonne volonté −5.`, 'bad']); } } });
  if (S.night >= 4 && Math.random() < .35) newRequest(out);
  if (S.night % 10 === 0) council(out);
  // ménagerie : tout le monde épanoui ?
  { const st = menSettled(); v.happy = st.length >= 8 && st.filter(c => (c.epa == null ? 50 : c.epa) >= 70).length >= Math.ceil(st.length * MEN_HAPPY) ? v.happy + 1 : 0; }
  // légende : à Mythique, la cité lève une croisade
  if (!v.croisade && !v.won.legende && radiance() >= mythic()) { v.croisade = { done: 0, n: S.night }; out.push(['📯', 'Mythique ! La cité de Mirebrume lève une croisade de héros légendaires contre ton château. Repousse-la trois fois pour entrer dans la légende.', 'ev']); }
  if (v.croisade && v.croisade.done < 3 && !v.won.legende) S.menace += 1;
  // grands projets
  const p = v.proj;
  if (p) {
    const P = PROJ[p.id]; let fail = '';
    if (p.id === 'parade') { const gone = p.ids.filter(id => !critter(id)); if (gone.length) fail = 'une créature a quitté le château'; else if (S.creatures.some(c => c.mood <= 1)) fail = 'une créature boude'; }
    else if (artPlaced() < 12) fail = 'un artefact a disparu des expositions';
    if (fail) { v.proj = null; out.push(['💔', `${P.name[0].toUpperCase() + P.name.slice(1)} est interrompu${p.id === 'parade' ? 'e' : ''} : ${fail}. Tu pourras recommencer.`, 'bad']); }
    else { p.prog++; out.push(['🎉', `${P.name[0].toUpperCase() + P.name.slice(1)} : nuit ${p.prog}/${p.need}.`, 'good']); if (p.prog >= p.need) { v.proj = null; winVictory(P.vic, out); } }
  }
  raceTick(out);
  // étapes franchies
  VICTORIES.forEach(V0 => !v.won[V0.id] && vicStages(V0.id).forEach((s, i) => { const k = V0.id + i; if (s.done && !v.seen[k] && !s.finale) { v.seen[k] = S.night; out.push([V0.ico, `${V0.name} : étape franchie, « ${s.text.replace(/ \(.*\)$/, '')} ».`, 'ev']); } }));
  if (out.length) { report.push(['sec', 'Victoires']); out.forEach(l => report.push(l)); }
}

/* ---------- branchements : raids, invasions, origine des héros ---------- */
function victoryAfterRaid(target, roll, lines) {
  const v = vicState(), tg = RAIDS[target], ok = roll.res !== 'fail';
  if (tg.rival && ok && !isVassal(tg.rival)) {
    v.vassals[tg.rival] = (v.vassals[tg.rival] || 0) + 1; v.race[tg.rival] = Math.max(0, (v.race[tg.rival] || 0) - 6);
    const r = racer(tg.rival);
    if (isVassal(tg.rival)) { lines.push(['🏳️', `Reddition ! ${r.name} : te voilà suzerain. Un tribut chaque nuit, et plus personne là-bas pour te disputer tes créatures.`, 'good']); addLog(`Vassal : ${r.name}.`, 'ev'); }
    else lines.push(['🏴', `Coup dur pour ${r.name} : ${v.vassals[tg.rival]}/3 vers la vassalité, et un recul dans la course.`, 'good']);
  }
  if (!tg.rival && !tg.siege) { const site = world().sites.find(x => x.raid === target), s = site && nearestSettlement(site); if (s) { addGw(s, ok ? -12 : -6); lines.push(['😠', `${s.name} n’apprécie pas : bonne volonté ${ok ? '−12' : '−6'}.`, 'bad']); } }
}
function victoryAfterInvasion(plan, outcome, lines) {
  const v = vicState();
  if (outcome === 'robbed') return;
  openReqs().filter(q => REQ[q.req].kind === 'repel').forEach(q => { const s = siteById(q.site); if (s) lines.push(['🤝', reqReward(q, s), 'good']); });
  if (plan.origin && plan.origin.crusade && v.croisade && !v.won.legende) { v.croisade.done++; lines.push(['📯', `La croisade de Mirebrume est repoussée (${Math.min(3, v.croisade.done)}/3) !`, 'good']); if (v.croisade.done >= 3) winVictory('legende', lines); }
}
RAIDS.mirebrume = { name: 'Siège de Mirebrume', emo: '🏰', tier: 2, risk: 0, tag: 'combat', reward: { g: 15, s: 5 }, hype: 5, menace: 3, siege: true, dg: 'cite', desc: 'La grande cité, en trois assauts aux cartes : les Remparts, la Ville basse et sa Guilde des Héros, puis le Palais. Un assaut ne compte que si le chef du quartier tombe ; au troisième, la cité te remet ses clés. Il faut d’abord que les quatre donjons rivaux soient tes vassaux.' };

/* ---------- le Siège de Mirebrume : trois assauts aux cartes ----------
   Chaque assaut est une expédition (p35) dans un quartier de la cité, plus dur que le
   précédent, avec son chef au bout. Seul le chef compte : rentrer avant, même du
   troisième étage, ne vaut rien. Les assauts réussis restent acquis (S.vic.siege).
   Les ennemis, les décors et la relique des quartiers : p73. */
const SIEGE_Q = [
  { id: 'remparts', name: 'les Remparts', hold: 'Les Remparts tiennent bon', fall: 'Les Remparts sont à toi', chef: 'la Capitaine Mâchicoulis', lvl: 0,
    regs: ['m_garde', 'm_arbal', 'h_paysan'], elite: 'm_bastion', boss: 'm_capitaine', relic: null,
    desc: 'Des créneaux, des arbalètes, des gardes qui comptent les moutons pour rester éveillés, et la Capitaine Mâchicoulis, qui n’a jamais dormi de sa vie. Elle le dit à tout le monde.' },
  { id: 'guilde', name: 'la Ville basse', hold: 'La Ville basse tient bon', fall: 'La Guilde des Héros capitule', chef: 'Dame Guillemette', who: 'Dame Guillemette, la maîtresse de la Guilde des Héros', lvl: 0,
    regs: ['h_voleuse', 'h_mage', 'm_crieur', 'h_paysan', 'm_crieur'], elite: 'm_heros', boss: 'm_guilde', relic: null,
    desc: 'Des ruelles pavées, des tavernes pleines d’aventuriers, ton portrait sur chaque avis de recherche, et la Guilde des Héros, où Dame Guillemette distribue les quêtes… et les primes.' },
  { id: 'palais', name: 'le Palais', hold: 'Le Palais tient bon', fall: 'Le Palais est à toi', chef: 'le Bourgmestre Grandécharpe', lvl: .5,
    regs: ['m_palais', 'h_paladin', 'm_scribe'], elite: 'm_lustrin', boss: 'm_bourg', relic: 'cles',
    desc: 'Des tapis rouges, des lustres, des gardes en culotte bouffante, et au fond de la salle du trône, le Bourgmestre Grandécharpe, qui prépare un très, très long discours.' },
];
// le quartier du prochain assaut (une vieille partie à 1 ou 2 assauts reprend au bon quartier)
const siegeStep = () => Math.min(SIEGE_Q.length - 1, Math.max(0, Math.floor((S && S.vic && S.vic.siege) || 0)));
const siegeQ = () => SIEGE_Q[siegeStep()];
// le niveau d'un assaut : la force de tes champions (crawlLevel), plus celui des donjons rivaux au même moment (la moyenne de leur crawlResist, p35 :
// le palier, les points déjà pris chez eux, la méfiance envers un suzerain), plus celui du quartier (le Palais se prépare davantage)
const SIEGE_TUNE = { cd: 3, flee: 1, regen: .03 };   // cd : un assaut fui ferme les portes (pas d'assaut avant S.night + cd) ; flee : Menace en plus ; regen : la part de PV qu'un chef blessé reprend chaque nuit
const siegeLvl = () => RIVALS.reduce((a, r) => a + crawlResist(r.id), 0) / RIVALS.length + siegeQ().lvl;
// après une fuite, la cité ferme ses portes : pas d'assaut avant cette nuit-là
const siegeShut = () => { const v = vicState(); return v.siegeCd && S.night < v.siegeCd ? v.siegeCd : 0; };
const siegeTitle = () => `Mirebrume, ${siegeQ().name} (assaut ${siegeStep() + 1}/3)`;
// un assaut est rentré : seul le chef du quartier compte (appelé par crawlVictory, p36)
function siegeAssault(R, lines) {
  const v = vicState(), q = siegeQ(), tg = RAIDS.mirebrume;
  if (v.siege >= 3) return;
  if (R.done !== 'boss') {
    const why = R.done === 'wipe' ? ' L’équipe a été repoussée jusqu’aux portes.' : R.fledBoss ? ` L’équipe a fui devant ${q.chef}.` : R.floor > CRAWL_FLOORS ? ' Arriver jusqu’à sa porte ne suffit pas.' : R.floor >= CRAWL_FLOORS ? ' Atteindre le troisième étage ne suffit pas.' : '';
    lines.push(['🏰', `${q.hold} : à Mirebrume, un assaut ne compte que si ${q.chef} tombe.${why} Le quartier se reprépare pour le prochain assaut${v.siege ? ` ; ${v.siege > 1 ? `tes ${v.siege} assauts réussis restent acquis` : 'ton premier assaut réussi reste acquis'}` : ''}.`, 'bad']);
    // fuir a un prix : la moitié du butin reste là-bas (comme partout), la cité ferme ses portes une nuit et sonne l'alarme dans le Val
    if (R.done === 'fled') { v.siegeCd = S.night + SIEGE_TUNE.cd; S.menace += SIEGE_TUNE.flee; lines.push(['🚪', `Ta fuite fait le tour de Mirebrume : la cité ferme ses portes (pas d’assaut avant la nuit ${v.siegeCd}) et sonne l’alarme dans le Val (+${SIEGE_TUNE.flee} Menace).`, 'bad']); }
    return;
  }
  v.siege++; v.siegeCd = 0; if (v.bossHp) delete v.bossHp['cite_' + q.id]; S.gold += tg.reward.g || 0; S.mat += tg.reward.s || 0; S.hype += tg.hype; S.menace += tg.menace;
  lines.push(['🏰', `${q.fall} : ${q.chef} rend les armes. Assaut réussi contre Mirebrume (${v.siege}/3) ! Rançon : ${costText(tg.reward)}, +${tg.hype} 💬, +${tg.menace} Menace.`, 'good']);
  addLog(`Mirebrume, assaut réussi (${v.siege}/3) : ${q.fall.toLowerCase()}.`, 'ev');
  if (v.siege >= 3) winVictory('terreur', lines);
  else { const n = SIEGE_Q[v.siege]; lines.push(['🗺️', `Prochain assaut : ${n.name}, où t’attend ${n.who || n.chef}.`, '']); }
}
// la fiche de l'assaut, dans l'écran des raids (p11)
function siegeFiche() {
  const v = vicState(), q = siegeQ(), B = (typeof CRAWL_EN !== 'undefined' && CRAWL_EN[q.boss]) || {}, tg = RAIDS.mirebrume;
  const lvl = Math.round((crawlLevel() + siegeLvl()) * 10) / 10;
  return `<h3>L’assaut ${siegeStep() + 1}/3 : ${esc(q.name[0].toUpperCase() + q.name.slice(1))}</h3><p>${esc(q.desc)}</p>
    <p>Une expédition aux cartes : chaque créature apporte ses cartes, et ton château remplit le sac (meubles, pièges). Trois étages, puis ${esc(q.who || q.chef)}${B.p2 && BOSS_P2[B.p2] ? `, avec ses actions légendaires et sa fureur à mi-vie` : ''}. <b>L’assaut ne compte que si ${esc(q.chef)} tombe</b> : rentrer avant, même du troisième étage, ne vaut rien ici. Niveau de l’assaut : <b>${String(lvl).replace('.', ',')}</b> (comme dans un donjon rival : il suit la force de tes champions, ton palier et tes vassaux, et chaque quartier se défend à sa façon). Elle se joue cette nuit.</p>
    <p class="hint">Fuir un assaut coûte cher : la moitié du butin reste là-bas, la cité ferme ses portes ${SIEGE_TUNE.cd - 1 > 1 ? SIEGE_TUNE.cd - 1 + ' nuits' : 'une nuit'} et sonne l’alarme (+${SIEGE_TUNE.flee} Menace). Rentrer entre deux salles, lui, ne coûte rien… mais ne compte pas non plus. Le chef garde ses blessures d’un assaut à l’autre (il n’en reprend que ${Math.round(SIEGE_TUNE.regen * 100)} % par nuit)${typeof rivalBossHp === 'function' && rivalBossHp('cite') < 1 ? ` : il lui reste ${Math.round(rivalBossHp('cite') * 100)} % de ses PV` : ''}.${siegeShut() ? ` <b>Portes fermées : prochain assaut à la nuit ${siegeShut()}.</b>` : ''}</p>
    <p class="hint">Assauts réussis : ${v.siege}/3 (ils restent acquis). Chacun rapporte une rançon de ${costText(tg.reward)}, +${tg.hype} 💬 et +${tg.menace} Menace${q.relic && typeof RELICS !== 'undefined' && RELICS[q.relic] ? ` ; le dernier, une relique : ${esc(RELICS[q.relic].name)}` : ''}.</p>`;
}

/* ---------- pastilles (notifications) ---------- */
function victoryNotifs(add) {
  if (!S.started) return; const v = vicState();
  openReqs().forEach(q => { const s = siteById(q.site); if (s && q.st === 'open') add('rq' + q.id, '📜', `${s.name} a une requête`, () => openWorld(s.id), 2); });
  Object.keys(PROJ).forEach(k => { if (projReady(k)) add('pj' + k, '🏛️', `${PROJ[k].name[0].toUpperCase() + PROJ[k].name.slice(1)} peut commencer`, openVictories, 4); });
  if (v.proj) add('pjrun', '🎉', `${PROJ[v.proj.id].name[0].toUpperCase() + PROJ[v.proj.id].name.slice(1)} : nuit ${v.proj.prog}/${v.proj.need}`, openVictories, 3);
  if (v.croisade && v.croisade.done < 3 && !v.won.legende) add('crois', '📯', `Croisade de Mirebrume : ${v.croisade.done}/3 repoussées`, openVictories, 4, 'bad');
  if (S.night % 10 >= 8) add('cons', '🗳️', `Conseil du Val dans ${10 - S.night % 10} nuit${10 - S.night % 10 > 1 ? 's' : ''}`, () => openVictories('voisinage'), 1);
  const hot = Object.keys(v.race).filter(k => !isVassal(k) && v.race[k] >= 75).sort((a, b) => v.race[b] - v.race[a])[0];
  if (hot) add('race', '⚠️', `Course : ${racer(hot).name} à ${Math.floor(v.race[hot])} % de la victoire`, openVictories, 5, 'bad');
}

/* ---------- l'écran des victoires (le « classement » de Civilization) ---------- */
function openVictories(focus) {
  const v = vicState(), m = v.master ? racer(v.master) : null, laurels = Object.keys(v.won);
  const card = V0 => {
    const pct = vicPct(V0.id), stages = vicStages(V0.id), r = racer(V0.rival), rp = Math.floor(v.race[V0.rival] || 0), won = v.won[V0.id];
    const pk = V0.id === 'menagerie' ? 'parade' : V0.id === 'secrets' ? 'rituel' : null;
    return `<section class="vic ${won ? 'won' : ''} ${focus === V0.id ? 'focus' : ''}"><div class="vh"><span class="emo">${V0.ico}</span><span><b>${esc(V0.name)}</b><small>${esc(V0.short)}</small></span><span class="vp num">${pct} %</span></div>
      ${bar(pct, won ? '#7fbf5a' : '#e9b949', 'Progression')}
      <ul class="vst">${stages.map(s => { const ok = s.done || won; return `<li class="${ok ? 'ok' : ''} ${s.finale ? 'fin' : ''}">${ok ? '✅' : s.finale ? '🏁' : '⬜'} ${esc(s.text)}</li>`; }).join('')}</ul>
      ${won ? `<p class="vwon">🏛️ Remportée à la nuit ${won}.</p>` : pk && projReady(pk) ? `<div class="btnrow"><button class="sbtn pri" type="button" data-proj="${pk}">🎉 Lancer ${esc(PROJ[pk].name)} · ${costText(PROJ[pk].cost)}</button></div>` : ''}
      <p class="vrival">${isVassal(V0.rival) ? `${r.emo} Vassal : ${esc(r.name)}, hors course.` : `${r.emo} Rival : ${esc(r.name)} ${bar(rp, '#d9542f', 'Rival')} <b class="num">${rp} %</b>`}</p>
      <button class="link2" type="button" data-wiki-open="v_${V0.id}">📖 Comment l’emporter</button></section>`;
  };
  const md = openModal(`<h2>🏛️ Les victoires du Val</h2>
    <p class="hint">${typeof bookCur === 'function' && bookCur() ? `Chapitre ${ROMAN(bookCur().n)}, l’Ère ${esc(bookCur().name)}` : ''} · ${m ? `Grand Maître actuel : ${m.emo} ${esc(m.name)}` : 'Le Val attend encore son Grand Maître'} · ${laurels.length ? `Tes lauriers : ${laurels.map(k => VIC_BY[k].ico).join(' ')}` : 'Pas encore de laurier'}</p>
    <p>Cinq chemins mènent au titre de Grand Maître. Les donjons rivaux et le Baron font la course : si l’un d’eux gagne avant toi, il devient Grand Maître et la course repart de zéro, mais tu gardes tout ce que tu as bâti (moins un tribut si c’est un donjon rival : le cinquième de ton or et de ton bois). En chemin, les rivaux préparent aussi des coups contre toi : {c:coups}. Pille-les pour les ralentir.</p>
    <div class="vicgrid">${VICTORIES.map(card).join('')}</div>`, { wide: true, cls: 'vicm', label: 'Victoires' });
  md.addEventListener('click', e => { const b = e.target.closest('[data-proj]'); if (!b) return; if (!run('project', { id: b.dataset.proj })) return; sfx('chime'); banner('🎉 Le grand projet commence !', esc(PROJ[b.dataset.proj].name), 1800); afterChange(); openVictories(); });
  if (focus) setTimeout(() => { const f = md.querySelector('.vic.focus'); if (f) f.scrollIntoView({ block: 'center' }); }, 50);
}
function openVictoryFinale(id) {
  const V0 = VIC_BY[id], text = { legende: 'Les bardes de tout le Val chantent ton nom. Même les héros de Mirebrume racontent, à voix basse, la nuit où ils ont fui ton château.',
    terreur: 'Les quatre donjons rivaux te versent tribut, et Mirebrume t’a remis ses clés. Personne n’est mort : c’est ça, la vraie terreur douillette.',
    voisinage: 'Le Conseil du Val t’a nommé Protecteur. Les villageois t’apportent des tartes. Tu ne sais pas trop quoi en faire, mais c’est gentil.',
    menagerie: 'La Grande Parade a traversé le Val sous les vivats : gobelins, liches, fées et golems, tous fiers et épanouis. Aucun bestiaire n’égale le tien.',
    secrets: 'Les douze artefacts ont chanté ensemble. Le Val n’a plus de secret pour toi… ou presque.' }[id];
  openModal(`<div class="vfinale"><h2>🏛️ ${esc(V0.name)} !</h2><p class="big">${esc(text)}</p>
    <p>${esc(S.name)} devient le château du Grand Maître du Val, à la nuit ${S.night}${typeof bookCur === 'function' && bookCur() ? `, au chapitre ${ROMAN(bookCur().n)} du Livre` : ''}. ${netUsable() ? 'Ton nom est gravé au Panthéon du Val.' : ''}</p>
    <ul class="chron"><li><span class="emo">🔥</span><span>Notoriété ${radiance()}</span></li><li><span class="emo">🐾</span><span>${S.creatures.length} créatures, ${legendsHome()} légendes, album ${albumN()}/${MENAGERIE_SP.length}</span></li><li><span class="emo">🏆</span><span>${Object.keys(S.ach || {}).length} hauts faits · ${artPlaced()} artefacts exposés</span></li></ul>
    <p class="hint">Les autres victoires restent à prendre, pour la gloire.</p>
    <div class="mfoot"><button class="sbtn" type="button" id="vfAll">🏛️ Voir les victoires</button><button class="sbtn pri" type="button" data-close>🌙 Encore une nuit</button></div></div>`, { wide: true, label: V0.name });
  $('#vfAll').addEventListener('click', () => openVictories(id));
}
// à la fin de la nuit : une victoire, ou un nouveau Grand Maître ?
function victoryAfterNight() {
  const v = S.vic; if (!v) return;
  if (v.justWon) { const id = v.justWon; v.justWon = null; save(); sfx('chime'); openVictoryFinale(id); return; }
  if (v.eraNews) { const r = racer(v.eraNews); v.eraNews = null; save(); banner(`👑 ${esc(r.name)}`, `devient Grand Maître du Val. La course repart de zéro !`, 2600); }
}

/* ---------- la carte et la ville : bonne volonté, requêtes, vassaux, siège ---------- */
function settleHTML(s) {
  const gw = gwOf(s), q = reqAt(s.id), R = q && REQ[q.req];
  let h = `<h4>🤝 Bonne volonté ${bar(gw, gw >= 70 ? '#7fbf5a' : gw >= 60 ? '#e9b949' : '#c9a07a', 'Bonne volonté')} <span class="num">${gw}</span></h4>
    <p class="hint"><b>Ce que pense de toi ${esc(s.name)}</b>, sur 100. À 60, ${esc(s.name)} vote pour toi au Conseil du Val (${VOICES[s.kind]} voix, toutes les 10 nuits). À 70, ses aventuriers te laissent tranquille. Requêtes, dons (+10, un seul par nuit pour tout le Val) et achats (+2) la font monter ; piller les environs la fait baisser, et elle retombe de 1 par nuit au-dessus de 40.</p>`;
  if (!q) return h + '<p class="hint">Pas de requête en ce moment.</p>';
  const rw = R.rw || {}, gains = [`bonne volonté +${R.gw}`, rw.g && `+${rw.g} 💰`, rw.s && `+${rw.s} 🪵`, rw.h && `+${rw.h} 💬`].filter(Boolean).join(', ');
  h += `<h4>📜 Requête</h4><p>« ${esc(R.text)} »</p><p class="hint">Jusqu’à la nuit ${q.until} · ${gains}</p>`;
  if (R.kind === 'pay') h += `<div class="btnrow"><button class="sbtn pri" type="button" data-rq="${q.id}" ${canAfford(R.cost) ? '' : 'disabled'}>🤝 Payer ${costText(R.cost)}</button></div>`;
  else if (R.kind === 'send' && q.st === 'open') { const cands = reqCandidates(q); h += cands.length ? `<p class="hint">Qui y va ? (${R.nights} nuit${R.nights > 1 ? 's' : ''})</p>${teamPicker(1, cands)}<div class="btnrow"><button class="sbtn pri" type="button" data-rq="${q.id}">🤝 Envoyer</button></div>` : `<p class="no">Personne ne convient : ${R.need ? 'il faut ' + R.need.filter(k => SPECIES[k]).map(k => SPECIES[k].name).join(' ou ') : 'il faut une garde de 2 ou plus'}.</p>`; }
  else if (q.st === 'sent') h += '<p class="hint">Une de tes créatures est en route.</p>';
  else if (R.kind === 'repel') h += '<p class="hint">Elle sera accomplie à la prochaine invasion repoussée.</p>';
  return h;
}
function rivalHTML(rv) {
  if (isVassal(rv.id)) return `<p><b>🏳️ Ton vassal.</b> Tribut de ${costText(VASSAL_TRIBUTE)} chaque nuit ; hors de la course à la victoire ; ne te dispute plus tes créatures.</p>`;
  const v = vicState(), goal = VIC_BY[raceGoal(rv.id)];
  return `<p class="hint">Dans la course à la ${goal.name.replace('Victoire', 'victoire')} : ${Math.floor(v.race[rv.id] || 0)} %. Points de soumission : ${Math.min(3, v.vassals[rv.id] || 0)}/3 pour en faire ton vassal (son boss vaincu : 2 ; le troisième étage atteint avec deux combats gagnés, puis rentrer sans fuir : 1, une seule fois${doorTaken(rv.id) ? ', déjà pris' : ''}). Chaque coup porté le fait aussi reculer.</p>`;
}
function citeHTML() {
  const v = vicState();
  if (v.siege >= 3) return '<p><b>🗝️ Mirebrume t’a remis ses clés.</b> Les trois quartiers ont rendu les armes ; la cité se tient tranquille, et le Bourgmestre prépare un discours sur le sujet.</p>';
  if (allVassals()) { const q = siegeQ(); return `<p><b>⚔️ Le Siège de Mirebrume est possible</b> (${v.siege}/3 assauts réussis).</p><p class="hint">Prochain assaut : <b>${esc(q.name)}</b>, où t’attend ${esc(q.who || q.chef)}. Une expédition aux cartes de 4 créatures : trois étages, puis le chef du quartier. L’assaut ne compte que si le chef tombe ; le fuir ferme les portes de la cité ${SIEGE_TUNE.cd - 1 > 1 ? SIEGE_TUNE.cd - 1 + ' nuits' : 'une nuit'}.</p>${siegeShut() ? `<p class="hint">🚪 Après ta fuite, la cité a fermé ses portes : prochain assaut à la nuit ${siegeShut()}.</p>` : ''}<div class="btnrow"><button class="sbtn" type="button" data-m="siege" ${S.tier >= 2 && !siegeShut() ? '' : 'disabled'}>🏰 Préparer l’assaut${S.tier >= 2 ? '' : ' (Palier 2)'}</button></div>`; }
  return '<p class="hint">Quand les quatre donjons rivaux seront tes vassaux, tu pourras assiéger la cité, quartier par quartier (victoire de Terreur).</p>';
}

/* ---------- Grimoire et conseil ---------- */
Object.assign(WIKI, {
  victoires: { cat: 'vic', t: 'Les victoires du Val', x: () => `<p>Comme dans Civilization, plusieurs chemins mènent au titre de <b>Grand Maître du Val</b>. Ouvre l’écran des victoires en touchant la nuit en cours (🏛️, en haut à droite).</p>
    <ul>${VICTORIES.map(v => `<li>{c:v_${v.id}|${v.name}} : ${esc(v.short)}</li>`).join('')}</ul>
    <p>Chaque victoire a des étapes, puis une finale qui dure plusieurs nuits. Tu peux toutes les remporter, une à une, pour la gloire. Voir aussi {c:eres}.</p>` },
  eres: { cat: 'vic', t: 'La course des rivaux et les ères', x: () => `<p>Tu n’es pas seul à viser le titre. Chaque donjon rival poursuit une victoire : ${RIVALS.map(r => `${r.name} (${VIC_BY[raceGoal(r.id)].name.replace('Victoire ', '')})`).join(', ')}. Le Baron Pâlichon, lui, brigue les voix du Conseil du Val.</p>
    <ul><li>Leur avancée se voit sur l’écran des victoires ; une pastille ⚠️ t’avertit quand l’un d’eux approche du but.</li><li>Un raid réussi contre un rival le fait reculer et le ralentit quelques nuits. Un rival devenu ton vassal ne court plus.</li>
    <li>Si un rival gagne avant toi, il devient <b>Grand Maître</b> : les rivaux repartent de zéro, et tu gardes tout ce que tu as bâti (moins un tribut, si c’est un donjon rival). Pas de partie perdue, juste un rival qui fanfaronne.</li></ul>` },
  v_legende: { cat: 'vic', t: 'Victoire de Légende', x: () => `<p>Fais monter la notoriété de ton château jusqu’à <b>Mythique</b> (${mythic()} 🔥) : surtout son éclat (artefacts, trésors, créatures rares, légendes, étages…), et un peu le bouche-à-oreille. Voir {c:notoriete}.</p><p><b>Finale :</b> à Mythique, la cité de Mirebrume lève une croisade de héros légendaires. La Menace monte chaque nuit : repousse trois invasions de croisés et ton château entre dans la légende.</p><p><b>La croisade se combat</b> : les croisés ne se vendent pas (pas de rançon), et ce sont les bandes les plus coriaces du jeu (plusieurs niveaux au-dessus d’une bande ordinaire). Un Cœur pillé ne fait pas perdre les croisades déjà repoussées : la suivante revient vite. Prépare-les comme une vraie bataille : tes plus fortes reposées, des pièges à la porte des pièces, un repas de veille, un mercenaire au Cœur ({c:invasion}).</p>` },
  v_terreur: { cat: 'vic', t: 'Victoire de Terreur', x: () => `<p>Une domination douce : personne ne meurt. Mène des <b>expéditions</b> dans chacun des quatre donjons rivaux (sur la carte, dès le Palier 1) : vaincre le boss rapporte 2 points ; atteindre le troisième étage avec au moins deux combats gagnés, puis rentrer sans fuir un combat, 1 point, <b>une seule fois par rival</b>. Pour soumettre un rival, il faut donc vaincre son boss au moins une fois. Deux aides : ce point pris, tu connais le chemin, et tes expéditions suivantes chez ce rival vont <b>droit à la porte de son boss</b> ; et un boss <b>garde ses blessures</b> d’une expédition à l’autre (il n’en reprend que ${Math.round(RIVAL_TUNE.regen * 100)} % de ses PV par nuit) : même une fuite l’a entamé. À 3 points, le rival devient ton <b>vassal</b>, te verse ${costText(VASSAL_TRIBUTE)} par nuit, cesse de te disputer tes créatures et quitte la course.</p><p><b>Finale :</b> le Siège de Mirebrume (Palier 2, une fois les quatre rivaux soumis : bouton Raid, ou la cité sur la carte). Trois assauts, un par quartier, chacun plus dur que le précédent : ${SIEGE_Q.map((q, i) => `${i + 1}. ${q.name[0].toUpperCase() + q.name.slice(1)}, et ${q.who || q.chef}`).join(' ; ')}. Chaque assaut est une {c:expeditions|expédition} aux cartes de 4 créatures, avec le sac du château : trois étages, puis le chef du quartier, ses actions légendaires et sa fureur. <b>Un assaut ne compte que si le chef tombe</b> : rentrer avant, même du troisième étage, ne vaut rien ici, et le quartier se reprépare ; mais, comme les boss rivaux, son chef garde ses blessures (il n’en reprend que ${Math.round(SIEGE_TUNE.regen * 100)} % par nuit). Les assauts réussis restent acquis ; chacun rapporte une rançon (${costText(RAIDS.mirebrume.reward)}), +${RAIDS.mirebrume.hype} 💬 et +${RAIDS.mirebrume.menace} Menace. <b>Fuir un assaut</b> coûte la moitié du butin (comme partout), ferme les portes de la cité ${SIEGE_TUNE.cd - 1 > 1 ? SIEGE_TUNE.cd - 1 + ' nuits' : 'une nuit'} (pas d’assaut avant la nuit N+${SIEGE_TUNE.cd}, si tu as fui la nuit N) et sonne l’alarme dans le Val (+${SIEGE_TUNE.flee} Menace). Au troisième, la cité te remet ses clés${typeof RELICS !== 'undefined' && RELICS.cles ? ` (et une relique : ${RELICS.cles.ico} ${RELICS.cles.name}, ${RELICS.cles.desc.replace(/\.$/, '').replace(/^./, c => c.toLowerCase())})` : ''}.</p><p class="hint">Les donjons rivaux grandissent avec toi (+${String(RIVAL_TUNE.tier).replace('.', ',')} niveau par palier) ; chaque défaite rend un rival plus coriace (+${String(RIVAL_TUNE.pt).replace('.', ',')} niveau par point pris), et tous se méfient d’un suzerain (+${String(RIVAL_TUNE.vassal).replace('.', ',')} par vassal). Mirebrume aussi : ses assauts ont le niveau moyen des donjons rivaux au même moment (soumis, ils comptent chacun leurs trois points et tes quatre vassaux), et le Palais se prépare davantage (+${String(SIEGE_Q[2].lvl).replace('.', ',')}). Attention : piller fait monter la Menace, et piller les fermes, moulins et auberges fâche les villages ({c:v_voisinage}).</p>` },
  v_voisinage: { cat: 'vic', t: 'Victoire de Bon Voisinage', x: () => { const reqs = Object.values(REQ).map(r => r.gw), sets = (() => { try { return settlements(); } catch (e) { return []; } })(), total = sets.reduce((a, s) => a + VOICES[s.kind], 0), nk = k => sets.filter(s => s.kind === k).length;
    return `<p>Chaque village, la ville et la cité ont une <b>bonne volonté</b> envers toi, de 0 à 100 (visible sur la carte et en ville). Au départ : ${GW0.village} pour un village, ${GW0.ville} pour la ville, ${GW0.cite} pour la cité.</p>
    <ul><li><b>Ce qui la fait monter</b> : leurs <b>requêtes</b> (+${Math.min(...reqs)} à +${Math.max(...reqs)} ; une créature envoyée qui échoue rapporte quand même +5) ; un <b>don pour la fête</b> (+10, mais <b>un seul don par nuit, tous lieux confondus</b>) ; chaque <b>achat</b> payé sur place (+2, sauf le don et la vente d’un artefact) ; une caravane escortée (+10 pour les villes qu’elle relie) ; des prisonniers libérés en expédition.</li>
    <li><b>Ce qui la fait baisser</b> : piller une ferme, un moulin, une auberge… (−12 pour le lieu habité le plus proche, −6 si le raid échoue) ; une requête laissée sans réponse (−5) ; une caravane pillée (−12) ; certains coups des rivaux, comme les rumeurs d’Ombrelune (−15 partout).</li>
    <li><b>Avec le temps</b>, elle retombe de 1 chaque nuit tant qu’elle dépasse 40 (jamais en dessous de 40 par le seul temps qui passe).</li>
    <li>À <b>60</b>, le lieu vote pour toi au <b>Conseil du Val</b>, qui se réunit toutes les 10 nuits (à la fin des nuits 9, 19, 29…) : ${VOICES.village} voix par village, ${VOICES.ville} pour la ville, ${VOICES.cite} pour la cité.${total ? ` Dans ce Val (${nk('village')} village${nk('village') > 1 ? 's' : ''}, ${nk('ville')} ville${nk('ville') > 1 ? 's' : ''}, ${nk('cite')} cité), <b>${total} voix</b> sont en jeu à chaque Conseil, que tu connaisses les lieux ou non.` : ''}</li>
    <li>Toutes les voix que tu n’as pas vont au <b>Baron Pâlichon</b>, qui brigue le même titre : chacune le fait avancer dans la course (voir {c:eres}).</li>
    <li>À <b>70</b>, les aventuriers de ce lieu ne viennent plus t’attaquer (ceux des autres lieux, si).</li></ul><p><b>Victoire :</b> 20 voix cumulées, Conseil après Conseil.</p>`; } },
  v_menagerie: { cat: 'vic', t: 'Victoire de la Grande Ménagerie', x: () => `<p>Réunis le bestiaire le plus complet du Val : l’<b>album entier</b> (${MENAGERIE_SP.length} espèces, y compris les {c:rares|créatures rares}, donc des étages vers le haut ET vers le bas), <b>5 légendes</b> au château, et 85 % de tes créatures installées (5 nuits au château) <b>épanouies</b> (70 ou plus) trois nuits de suite, à 8 au moins : un nouveau venu ne casse pas la série.</p><p><b>Finale :</b> la Grande Parade (${costText(PROJ.parade.cost)}), quatre nuits pendant lesquelles aucune créature ne doit partir ni bouder.</p>` },
  v_secrets: { cat: 'vic', t: 'Victoire des Secrets', x: () => `<p>Perce le mystère du Val : dévoile <b>90 % de la carte</b>, trouve les <b>12 artefacts</b>, puis expose-les tous, avec au moins un {room:reliquaire}.</p><p><b>Finale :</b> le Rituel des Douze (${costText(PROJ.rituel.cost)}), trois nuits pendant lesquelles aucun artefact ne doit disparaître. Garde-les aux étages : les héros qui pillent le Cœur en volent.</p>` },
});
TIPS.push({ id: 'vic0', when: () => S.night >= 6 && !(S.tuto && S.tuto.on), t: 'Cinq chemins vers la victoire', x: 'Comme dans Civilization, tu peux devenir le Grand Maître du Val de cinq façons : Légende, Terreur, Bon Voisinage, Grande Ménagerie ou Secrets. Les donjons rivaux font la course. Touche la nuit en cours (🏛️, en haut à droite) pour voir où tu en es.', wiki: 'victoires' });
