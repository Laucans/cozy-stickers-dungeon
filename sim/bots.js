/* =========================================================
   IA scriptées : un socle commun (un joueur raisonnable) et
   une stratégie par victoire, plus deux repères.
   ========================================================= */
const BASE_ROOMS = ['dortoir', 'potager', 'cuisine', 'atelier', 'taverne', 'tour', 'bibli', 'labo', 'caveau', 'forge', 'oubliettes', 'salon', 'tresor', 'trone'];
const themeRoom = () => THEMES[S.theme].room;
const hasRoom = t => S.rooms.some(r => r.t === t);
const roomsOf = t => S.rooms.filter(r => r.t === t && r.built);
const fullRoom = r => (typeof furnCap === 'function' && furnCount(r) >= furnCap(r)) || cellsOf(r).every(([x, y]) => furnAt(x, y, zOf(r)));   // une pièce se remplit à moitié
// l'or de la paie : on le garde de côté la veille (dans les versions sans paie, rien ne change)
const payReserve = () => typeof payroll === 'function' && nightsToPay() <= 1 ? payroll() : 0;
function econ(o = {}) {
  const reserve = Math.max(o.reserve || 0, payReserve());
  if (!hasRoom('dortoir')) A.build('dortoir');
  roomsOf('dortoir').forEach(r => A.furnish(r, Math.max(0, S.gold - reserve)));
  if (foodCap() < eaters() + 2) { if (!hasRoom('potager')) A.build('potager'); else if (!hasRoom('cuisine') && S.gold > 6) A.build('cuisine'); ['potager', 'cuisine'].forEach(t => roomsOf(t).forEach(r => A.furnish(r, Math.max(0, S.gold - reserve)))); if (foodCap() < eaters() && roomsOf('potager').every(fullRoom) && roomsOf('cuisine').every(fullRoom) && S.gold > 8) A.build('potager'); }
  if (beds() - S.creatures.length < 2 && roomsOf('dortoir').every(fullRoom) && S.gold > 8) A.build('dortoir');
  if (!hasRoom(themeRoom()) && S.gold > 10) A.build(themeRoom());
  // le sticker préféré de chaque espèce présente
  new Set(S.creatures.map(c => (SPECIES[c.sp] || {}).likes)).forEach(t => { if (!t || !FURN[t] || hasItem(t)) return; const f = FURN[t]; if (f.room === 'any') { if (S.gold - reserve > (costOf('furn', t).g || 0) + 2) A.decorate(t); } else { const r = roomsOf(f.room).find(x => !fullRoom(x)); if (r) A.furnish(r, S.gold - reserve); } });
  // un peu d'ambiance
  if (ambiance() < S.creatures.length + 2 && S.gold - reserve > 4) A.decorate(pick(['torche', 'plante', 'tapis']));
  // artefacts en réserve : on les expose toujours
  ARTEFACTS.filter(k => (S.free[k] || 0) > 0).forEach(k => A.decorate(k, 99));
}
function grow(list, o = {}) {   // construit la prochaine pièce de la liste, puis meuble ce qui existe
  const reserve = Math.max(o.reserve || 0, payReserve());
  // une pièce incompatible au Rez peut aller à un autre étage déjà ouvert
  const okSomewhere = t => !availability('room', t) || (availability('room', t).clash && floorsOpen().some(z => z !== 0 && !withZ(z, () => availability('room', t))));
  const next = list.find(t => !hasRoom(t) && okSomewhere(t));
  if (next && S.gold - reserve >= (costOf('room', next).g || 0) + 3 && S.mat >= (costOf('room', next).s || 0)) A.build(next);
  S.rooms.filter(r => r.built && ROOMS[r.t].furn && !fullRoom(r)).sort(() => Math.random() - .5).slice(0, 2).forEach(r => A.furnish(r, Math.max(0, S.gold - reserve - 2)));
}
function defend(budget) {   // des pièges quand des héros approchent ; plus on est riche, plus on en pose
  const pp = partyPreview(), def = defenseScore();
  if (S.menace >= MENACE_MAX - 3 && def < pp.courage + 4) A.traps(Math.max(budget, Math.floor(S.gold * .3)));
}
function common(o = {}) {
  A.care(); A.quests();
  if (typeof sagaBotStep === 'function') sagaBotStep();   // les intrigues : on les suit, on paie, on choisit
  if (typeof qState === 'function') A.questStep();   // les quêtes du journal : on accepte, on livre, on choisit, on lance raids et expéditions
  if (tierStatus() && tierStatus().ok && S.gold - tierStatus().next.cost.g > (o.tierReserve || 0)) cmd('tierUp');
  econ(o); defend(o.trap || 10); A.posts(); A.cook(); A.chantier(o.chantierReserve || 60); A.wonder(o.wonderReserve || 200); A.fete(); A.spy();
  if (roomsOf('trone').length && !hasItem('trone')) A.placeItem('trone');   // palier 3 : le Trône dans sa salle
  const ex = expandStatus(); if (ex && ex.ok && SIM.noRoom && S.night - SIM.noRoom < 3 && S.gold > (ex.cost.g || 0) + 30) { cmd('expand'); SIM.noRoom = 0; }   // à l'étroit : on agrandit les remparts
}
function floors(wantUp, wantDown) {
  const fs = floorSet();
  if (wantDown && fs.size < Math.min(3, S.tier) && !S.rooms.some(r => r.t === 'escalier' && zOf(r) === 0) && S.gold > 10) A.build('escalier', 0);
  if (wantUp && fs.size < Math.min(3, S.tier) && !S.rooms.some(r => r.t === 'montee' && zOf(r) === 0) && S.gold > 10) A.build('montee', 0);
}
function buildOn(z, list) { if (!floorsOpen().includes(z)) return; const next = list.find(t => !S.rooms.some(r => r.t === t && zOf(r) === z) && !withZ(z, () => availability('room', t))); if (next && S.gold >= (costOf('room', next).g || 0) + 4) A.build(next, z); }
function outdoors(list) {   // les Jardins : un enclos après l'autre, et la forêt rachetée quand on manque de place
  if (typeof EXT === 'undefined') return;
  const next = list.find(t => !S.rooms.some(r => r.t === t) && !withZ(EXT, () => availability('room', t)));
  if (next && S.gold >= (costOf('room', next).g || 0) + 4) { const e = A.build(next, EXT); if (e && /pas de place/.test(e) && forestCost() && canAfford(forestCost())) cmd('foret'); }
  S.rooms.filter(r => r.built && zOf(r) === EXT && ROOMS[r.t].furn && !fullRoom(r)).forEach(r => A.furnish(r, S.gold - 2));
}
function expeditions(n = 2, pref) {
  if (A.free().length < 4) return;
  const sites = world().sites.filter(s => s.expe && siteKnown(s) && expeReady(s)).sort((a, b) => (pref ? pref(b) - pref(a) : 0) || hdist(a.q, a.r) - hdist(b.q, b.r));
  if (sites[0]) A.expedition(sites[0].id, n);
}
function raidFor(targets, minPool = 3) { if (S.raid) return; for (const t of targets) { if (!RAIDS[t] || !raidKnown(t) || RAIDS[t].tier > S.tier) continue; if (A.raidPool(t) >= minPool) { A.raid(t); return; } } }
const FARM = ['ferme', 'moulin', 'auberge', 'monastere', 'chateau'];

const BOTS = {
  // ne fait rien : la course des rivaux et les invasions à l'état brut
  idle() {},
  // bâtit et pille comme « tranquille », mais ne s'occupe jamais de ses créatures (ni caresses, ni friandises, ni missions)
  negligent() { if (tierStatus() && tierStatus().ok) cmd('tierUp'); econ(); defend(10); grow(BASE_ROOMS); if (S.night % 3 === 0) raidFor(FARM, 3); },
  // joueur tranquille : bâtit, meuble, caresse, pille un peu les fermes
  casual() { common(); grow(BASE_ROOMS); if (S.night % 3 === 0) raidFor(FARM, 3); },
  legende() {
    common({ trap: 14 }); grow(BASE_ROOMS, { reserve: 4 });
    floors(S.tier >= 2, true); buildOn(-1, ['reliquaire', 'mine']); buildOn(1, ['voliere', 'jardin']); buildOn(-2, ['lac']); buildOn(2, ['belvedere']);
    S.rooms.filter(r => r.built && zOf(r) !== 0 && ROOMS[r.t].furn && !fullRoom(r)).forEach(r => A.furnish(r, S.gold - 4));
    roomsOf('tresor').forEach(r => A.furnish(r, S.gold - 4));
    expeditions(2, s => ((EXPE_SITES[s.expe] || {}).arts || []).filter(k => !ownedArtefacts().has(k)).length + (EXPE_SITES[s.expe].meet && !worldMet(EXPE_SITES[s.expe].meet) ? 2 : 0));
    A.knownTowns().filter(s => s.kind !== 'village').forEach(s => { const st = shopStock(s); st.arts.concat(st.stolen).forEach(k => { const item = st.stolen.includes(k) ? 'rachat' : 'artefact'; if (S.gold > shopPrice(s, item, k) + 12) A.shop(s.id, item, k); }); });
    if (S.night % 4 === 0) raidFor(['ferme', 'moulin', 'auberge'], 3);
    if (vicState().croisade && vicState().croisade.done < 3) { A.traps(Math.max(30, Math.floor(S.gold * .5))); if (invasionSoon()) { const t = A.knownTowns().find(x => x.kind !== 'village'); if (t) { A.shop(t.id, 'merco'); A.shop(t.id, 'avis'); } } }
  },
  terreur() {
    common({ trap: 12 }); A.caravan('pille'); grow(['dortoir', 'potager', 'atelier', 'cuisine', 'tour', 'forge', 'labo', 'caveau', 'taverne', 'oubliettes', 'bibli', 'salon', 'tresor', 'trone'], { reserve: 2 });
    ['forge', 'labo'].forEach(t => roomsOf(t).forEach(r => A.furnish(r, S.gold)));
    // le Siège de Mirebrume : une expédition par nuit (les dés n'y comptent plus), avec les 4 créatures les plus solides qui ne sont pas blessées
    if (!S.raid && raidKnown('mirebrume') && S.tier >= RAIDS.mirebrume.tier) { const crew = A.free().filter(c => !injured(c)).map(c => [c, crawler(c)]).sort((a, b) => b[1].hp * b[1].atk - a[1].hp * a[1].atk).slice(0, 4).map(x => x[0].id); if (crew.length >= 4) cmd('raidPlan', { target: 'mirebrume', team: crew }); }
    const rivals = RIVALS.filter(r => !isVassal(r.id)).map(r => 'r_' + r.id).sort((a, b) => A.raidPool(b) - A.raidPool(a));
    raidFor(rivals, 4); raidFor([...rivals, 'chateau', 'auberge', 'ferme', 'moulin'], 3);
    if (allVassals()) { const c = world().sites.find(s => s.kind === 'cite'); if (c && !siteKnown(c)) A.scout(); }
    else if (S.night % 5 === 0) A.scout();
  },
  voisinage() {
    common({ trap: 10 }); A.caravan('escorte'); grow(BASE_ROOMS, { reserve: 8 });
    const setts = settlements().filter(s => siteKnown(s));
    openReqs().filter(q => q.st === 'open').forEach(q => A.request(q));
    const low = setts.filter(s => gwOf(s) < 72).sort((a, b) => VOICES[b.kind] - VOICES[a.kind] || gwOf(a) - gwOf(b))[0];
    if (low && S.gold > 10) A.shop(low.id, 'don');
    const vill = setts.find(s => s.kind === 'village'); if (vill && setts.length < 7 && S.gold > 8) A.shop(vill.id, 'rumeur');
    if (setts.length < 7 && S.night % 2 === 0) A.scout();
  },
  menagerie() {
    common({ trap: 12, tierReserve: 0 }); grow(BASE_ROOMS, { reserve: 2 });
    floors(true, true); buildOn(-1, ['mine', 'reliquaire']); buildOn(1, ['jardin', 'voliere']); buildOn(-2, ['lac']); buildOn(2, ['belvedere']);
    S.rooms.filter(r => r.built && zOf(r) !== 0 && ROOMS[r.t].furn && !fullRoom(r)).forEach(r => A.furnish(r, S.gold - 2));
    outdoors(['poulailler', 'simples', 'mare', 'cimetiere']);
    expeditions(2, s => { const X = EXPE_SITES[s.expe] || {}; return X.meet && !worldMet(X.meet) ? 5 : ((X.arts || []).some(k => !ownedArtefacts().has(k)) ? 1 : 0); });
    if (S.creatures.filter(c => c.mood <= 2).length > 2 && S.gold > 10) { const t = A.knownTowns().find(s => s.kind !== 'village') || A.knownTowns()[0]; if (t) A.shop(t.id, 'humeur'); }
    Object.entries(SPECIES).filter(([k, d]) => d.fromDecor && !S.album[k]).forEach(([k, d]) => Object.entries(d.fromDecor).forEach(([t, n]) => { for (let i = 0; i < 4 && countItem(t) < n; i++) if (A.placeItem(t)) break; }));
    // château plein (renommée ou lits) alors qu'une espèce jamais vue pourrait venir : on renvoie un doublon
    if (typeof homeCap === 'function' && S.creatures.length >= homeCap() && SPECIES_ORDER.some(sp => !S.album[sp] && nestsOf(sp) && rareOK(sp) && !(SPECIES[sp].tier && S.tier < SPECIES[sp].tier))) {
      const by = {}; S.creatures.forEach(c => { (by[c.sp] = by[c.sp] || []).push(c); });
      const dup = Object.values(by).filter(l => l.length >= 3).flat().filter(c => !c.legend && !isOut(c) && !questOf(c)).sort((a, b) => (a.lvl || 1) - (b.lvl || 1))[0]; if (dup) cmd('fire', { id: dup.id });
    }
    if (projReady('parade') && canAfford(PROJ.parade.cost)) cmd('project', { id: 'parade' });
    if (S.night % 5 === 0) A.scout();
  },
  secrets() {
    common({ trap: 12 }); grow(BASE_ROOMS, { reserve: 6 });
    floors(false, true); buildOn(-1, ['reliquaire', 'reliquaire', 'mine']); if (roomsOf('reliquaire').length && roomsOf('reliquaire').length < 2 && S.gold > 20) A.build('reliquaire', -1);
    A.scout(); if (S.night % 2 === 0) A.scout();
    expeditions(2, s => ((EXPE_SITES[s.expe] || {}).arts || []).filter(k => !ownedArtefacts().has(k)).length);
    A.knownTowns().forEach(s => { if (s.kind === 'village') { if (S.gold > 10) A.shop(s.id, 'rumeur'); return; } A.shop(s.id, 'carte'); if (S.gold > 30) A.shop(s.id, 'tresor'); const st = shopStock(s); st.arts.concat(st.stolen).forEach(k => { const item = st.stolen.includes(k) ? 'rachat' : 'artefact'; if (S.gold > shopPrice(s, item, k) + 8) A.shop(s.id, item, k); }); });
    if (projReady('rituel') && canAfford(PROJ.rituel.cost)) cmd('project', { id: 'rituel' });
  },
};
const BOT_GOAL = { legende: 'legende', terreur: 'terreur', voisinage: 'voisinage', menagerie: 'menagerie', secrets: 'secrets' };
// une partie complète : jusqu'à la victoire visée (ou la nuit max)
function simPlay(bot, seed, maxNights, theme) {
  simNewGame(seed, theme); const goal = BOT_GOAL[bot]; let err = null;
  while (S.night < maxNights) {
    try { BOTS[bot](); } catch (e) { err = err || String(e && e.stack || e).slice(0, 300); }
    simNight();
    if (goal && S.vic && S.vic.won[goal]) break;
  }
  return { bot, ...simSummary(), err };
}
