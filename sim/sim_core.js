/* =========================================================
   Banc d'essai : le vrai moteur du jeu, sans affichage.
   Ce fichier est injecté APRÈS le code du jeu, dans le même
   contexte : il voit toutes ses fonctions et variables.
   ========================================================= */
var SIM = { m: null };
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// l'affichage n'existe pas ici : on neutralise les effets visuels qui accumuleraient des données
poof = function () {}; floatText = function () {}; say = function () {}; critterLeave = function () {}; toast = function () {}; sfx = function () {};

function simNewGame(seed, theme) {
  Math.random = mulberry32(seed);
  Z = 0; WORLD = null;
  newState('Château simulé', theme || pick(Object.keys(THEMES)));
  S.started = true; S.tuto = { on: false, done: true, i: 99 }; S.tipsOff = true;
  worldInit();
  SIM.m = { seed, theme: S.theme, wins: {}, eras: [], inv: 0, inv_repelled: 0, inv_lost: 0, inv_robbed: 0, invRank: { 1: 0, 2: 0, 3: 0 }, raids: 0, raidsWon: 0, calamities: 0, curve: {}, tierAt: {}, floorsAt: {}, firstRare: null };
  return S;
}
// une nuit, comme endNight() mais sans fenêtres ni animations
function simInvasion(plan) {
  if (S.opts && S.opts.cliTac === 'rancon' && typeof payOff === 'function') { payOff(plan); SIM.m.inv_bought = SIM.m.inv_bought || 0; return 'bought'; }   // la tactique « rançon » de la ligne de commande
  if (typeof resolveInvasion === 'function') { const R = resolveInvasion(plan, (S.opts && S.opts.cliTac) || 'postes'); plan.res = R; return R.outcome; }   // les vrais combats
  if (!plan.path) return 'lost';
  let courage = plan.courage;
  for (let idx = 0; idx < plan.path.length; idx++) for (const st of plan.steps.filter(s => s.i === idx)) {
    courage -= st.dmg;
    if (st.lost && Math.random() < st.lost) return 'lost';
    if (courage <= 0) return 'repelled';
  }
  return 'robbed';
}
function simNight() {
  const M = SIM.m, report = [];
  if (typeof filNightStart === 'function') filNightStart();
  const cd = calamityDelta(); S.calamity = Math.max(0, S.calamity + cd.d);
  if (S.calamity >= CAL_MAX) { const ev = pick(CALAMITIES.filter(c => c.when())); ev.run(); S.calamity = 0; S.stats.calmNights = 0; M.calamities++; } else S.stats.calmNights++;
  if (S.raid && S.raid.played) { /* expédition déjà jouée à la main (sim/crawl_cli.js) */ }
  else if (S.raid && S.raid.crawl && typeof simCrawlNight === 'function') { const o = simCrawlNight(report); M.crawls = (M.crawls || 0) + 1; if (o) M['crawl_' + o] = (M['crawl_' + o] || 0) + 1; }
  else if (S.raid) { const team = S.raid.team.map(critter).filter(Boolean); if (team.length) { const b = raidBreakdown(S.raid.target, S.raid.team), extra = typeof simRaidExtras === 'function' ? simRaidExtras(b, team, report) : 0, roll = rollPool(b.pool + extra), tg = RAIDS[S.raid.target]; report.push(['🎲', `Raid sur ${tg ? tg.name : S.raid.target} : ${b.pool} dés → ${roll.dice.join(', ')} (${roll.res === 'fail' ? 'échec' : roll.res === 'partial' ? 'réussite partielle' : roll.res === 'crit' ? 'critique' : 'réussite'})`, '']); applyRaid(roll).forEach(l => report.push(l)); M.raids++; if (roll.res !== 'fail') M.raidsWon++; } }
  if (S.hype >= 3) S.menace += 1;
  if (S.menace >= MENACE_MAX) { S.menace = 0; const plan = planInvasion(), out = simInvasion(plan); if (plan.res) { M.hurt = (M.hurt || 0) + plan.res.hurt.length; M.heroKO = (M.heroKO || 0) + plan.res.fallen.length; M.fought = (M.fought || 0) + plan.res.fought.length; } report.push(['⚔️', `Invasion : ${plan.party.length} héros (rang ${plan.rank || 1}), courage ${plan.courage} contre ${plan.steps.reduce((a, st) => a + st.dmg, 0)} de défense → ${out === 'repelled' ? 'repoussés' : out === 'lost' ? 'perdus en route' : 'le Cœur est pillé'}`, out === 'robbed' ? 'bad' : 'good']); applyInvasion(plan, out).forEach(l => report.push(l)); M.inv++; M['inv_' + out]++; M.invRank[plan.rank || 1]++; (M.invLog = M.invLog || []).push([S.night, plan.rank || 1, plan.courage, plan.steps.reduce((a, st) => a + st.dmg, 0), out, vicState().croisade && !vicState().won.legende ? 1 : 0]); }
  if (typeof rivalNightSim === 'function') { const o = rivalNightSim(report); if (o) { M.nemRaids = (M.nemRaids || 0) + 1; if (o === 'robbed') M.nemRobbed = (M.nemRobbed || 0) + 1; } }
  dawn(report);
  S.rooms.forEach(r => { delete r.justBuilt; });   // comme à la fin de la chronique dans le jeu
  checkGoals(); checkQuests(); checkAch();
  if (S.tier >= 3 && !S.won) S.won = true;
  V.parts.length = 0; V.fx.length = 0; V.flash.length = 0; V.born.clear(); S.log.length = Math.min(S.log.length, 20);
  const v = S.vic || {};
  if (v.justWon) { M.wins[v.justWon] = S.night; v.justWon = null; }
  if (v.eraNews) { M.eras.push([S.night, v.eraNews]); v.eraNews = null; }
  if (S.tier && !M.tierAt[S.tier]) M.tierAt[S.tier] = S.night;
  const fl = floorsDug(); if (fl && !M.floorsAt[fl]) M.floorsAt[fl] = S.night;
  if (!M.firstRare && S.creatures.some(c => SPECIES[c.sp] && SPECIES[c.sp].rare)) M.firstRare = S.night;
  if (S.night % 10 === 0) M.curve[S.night] = { glow: radiance(), crit: S.creatures.length, album: Object.keys(S.album).length, gold: S.gold, mat: S.mat, tier: S.tier, amb: ambiance(), vic: VICTORIES.map(x => vicPct(x.id)), race: { ...vicState().race }, votes: vicState().votes, vassals: RIVALS.filter(r => isVassal(r.id)).length, arts: artPlaced(), map: mapPct(), legends: legendsHome() };
  return report;
}
function simSummary() {
  const v = vicState(), M = SIM.m;
  const sg = S.sagas || { done: [] };
  return { ...M, sagas: sg.done.slice(), sagaCur: sg.cur ? sg.cur.id + ':' + sg.cur.i : null, evos: S.creatures.filter(c => c.evo).map(c => c.evo), nem: S.nem ? { id: S.nem.id, pres: Math.round(S.nem.pres), me: typeof myPres === 'function' ? myPres() : 0, snatched: S.nem.snatched, chWon: S.nem.chWon, chLost: S.nem.chLost } : null, night: S.night, glow: radiance(), tier: S.tier, crit: S.creatures.length, album: Object.keys(S.album).length, deserted: S.stats.deserted, quests: S.stats.quests, legends: S.stats.legends, ach: Object.keys(S.ach).length,
    votes: v.votes, vassals: RIVALS.filter(r => isVassal(r.id)).length, arts: artPlaced(), map: mapPct(), gold: S.gold, mat: S.mat, pct: Object.fromEntries(VICTORIES.map(x => [x.id, vicPct(x.id)])), race: { ...v.race }, expeditions: S.stats.expeditions, floors: floorsDug(), size: S.size || 0, wages: S.stats.wages || 0, unpaid: S.stats.unpaid || 0,
    hype: S.hype, album_missing: MENAGERIE_SP.filter(k => !S.album[k]), stuck: S.creatures.filter(c => c.quest && c.quest.st === 'active' && S.night - c.quest.n > 20).map(c => c.quest.k), tierMiss: tierStatus() ? tierStatus().rows.filter(r => !r.ok).map(r => r.text.replace(/ \(.*\)$/, '')) : [], calDelta: calamityDelta().d };
}

/* =========================================================
   Actions de haut niveau (utilisées par les IA et par Sonnet)
   ========================================================= */
const A = {};
const free = () => S.creatures.filter(c => !isOut(c));
A.spot = (t, z = 0) => withZ(z, () => {
  const d = ROOMS[t]; if (!d) return null; const h = heartRoom(), hx = h.x + 1, hy = h.y + 1, root = z === 0 ? null : floorRoot(z); let best = null;
  for (const [w, hh] of [d.size, [d.size[1], d.size[0]]]) for (let y = 0; y + hh <= H; y++) for (let x = 0; x + w <= W; x++) {
    if (checkRoom(t, x, y, w, hh)) continue;
    const cx = x + w / 2, cy = y + hh / 2, ax = root ? root.x + .5 : hx, ay = root ? root.y + .5 : hy;
    const score = Math.abs(cx - ax) + Math.abs(cy - ay) + Math.random() * .6;
    if (!best || score < best.score) best = { x, y, w, h: hh, score };
  }
  return best;
});
A.build = (t, z = 0) => { let av = withZ(z, () => availability('room', t));
  if (av && av.clash) { const alt = floorsOpen().filter(f => f !== z).find(f => !withZ(f, () => availability('room', t))); if (alt != null) { z = alt; av = null; } }   // incompatible ici : on essaie un autre étage
  if (av) return av.reason || 'indisponible'; const s = A.spot(t, z); if (!s) { SIM.noRoom = S.night; return typeof EXT !== 'undefined' && z === EXT ? 'pas de place dehors (achète la forêt : foret)' : 'pas de place (agrandis les remparts : expand)'; } return cmd('place', { kind: 'room', t, x: s.x, y: s.y, w: s.w, h: s.h, z }); };
// meuble une pièce : priorité aux besoins (lits, repas), puis au sticker préféré des occupants, puis à l'ambiance
A.furnish = (r, budget = 99) => {
  const d = ROOMS[r.t]; if (!d.furn || !r) return 0; let n = 0;
  const cells = cellsOf(r).filter(([x, y]) => !furnAt(x, y, zOf(r)) && !defAt(x, y, zOf(r)));
  for (const [x, y] of cells) {
    const needBeds = beds() - S.creatures.length < 3, needFood = foodCap() < eaters() + 2;
    const opts = d.furn.filter(t => !withZ(zOf(r), () => availability('furn', t)) && canAfford(costOf('furn', t)));   // on regarde depuis l'étage de la pièce (dehors : les meubles du dehors)
    if (!opts.length || S.gold - (costOf('furn', opts[0]).g || 0) < 0) break;
    const liked = new Set(S.creatures.map(c => (SPECIES[c.sp] || {}).likes));
    const score = t => { const f = FURN[t], have = countItem(t); return (needBeds ? (f.beds || 0) * 4 : (f.beds || 0)) + (needFood ? (f.food || 0) * 3 : (f.food || 0)) + (f.gold || 0) * 2.5 + (f.mat || 0) * 2 + (f.amb || 0) * 1.5 + (f.hype || 0) * 1.5 + (f.dice || 0) + (f.guard || 0) * .5 + (f.cal || 0) * 1.5 + (f.cells || 0) + (f.harass || 0) + (liked.has(t) && !have ? 4 : 0) - have * .3; };
    const t = opts.sort((a, b) => score(b) - score(a))[0]; const c = costOf('furn', t);
    if ((c.g || 0) > budget) break;
    if (!cmd('place', { kind: 'furn', t, x, y, z: zOf(r) })) { n++; budget -= c.g || 0; } else break;
  }
  return n;
};
A.decorate = (t, budget = 6, roomT = null) => {   // pose un sticker de déco (ou un artefact en réserve) quelque part (dans une pièce de ce type si roomT)
  const spots = []; S.rooms.filter(r => r.built && (!roomT || r.t === roomT) && !ROOMS[r.t].fixed && !ROOMS[r.t].stairs).forEach(r => cellsOf(r).forEach(([x, y]) => { if (!furnAt(x, y, zOf(r)) && !defAt(x, y, zOf(r))) spots.push([x, y, zOf(r), r]); }));
  const pref = FURN[t] && FURN[t].artefact ? spots.filter(s => s[3].t === 'reliquaire').concat(spots.filter(s => s[2] !== 0), spots) : spots.filter(s => !isHall(s[3])).concat(spots);
  for (const [x, y, z] of pref) { const c = costOf('furn', t); if ((c.g || 0) > budget) return 'trop cher'; const e = cmd('place', { kind: 'furn', t, x, y, z }); if (!e) return null; }
  return 'pas de place';
};
A.traps = (maxSpend = 12) => {
  const p = heroPath() || []; let n = 0;
  const kinds = ['machoire', 'automate', 'meule', 'herse', 'hache', 'ressort', 'trappe', 'sphinx', 'porte', 'leurre', 'banane'].filter(t => DEFS[t] && !availability('def', t));
  for (const [x, y] of p.slice(1, -1)) {
    const r = roomAt(x, y, 0); if (!r || r.t !== 'couloir' || defAt(x, y, 0) || furnAt(x, y, 0)) continue;
    const t = kinds.find(k => canAfford(costOf('def', k)) && (costOf('def', k).g || 0) <= maxSpend); if (!t) break;
    if (!cmd('place', { kind: 'def', t, x, y, z: 0 })) { n++; maxSpend -= costOf('def', t).g || 0; }
  }
  // plus de case libre : on remplace le plus faible piège du chemin par un meilleur (les plans des artisans)
  for (let k = 0; k < 2; k++) {
    const best = kinds.find(t => DEFS[t].rank && canAfford(costOf('def', t)) && (costOf('def', t).g || 0) <= maxSpend); if (!best) break;
    const weak = S.defs.filter(d => DEFS[d.t] && !DEFS[d.t].block && !DEFS[d.t].alarm && !DEFS[d.t].unique && (d.z || 0) === 0 && p.some(([x, y]) => x === d.x && y === d.y) && DEFS[d.t].str < DEFS[best].str).sort((a, b) => DEFS[a.t].str - DEFS[b.t].str)[0]; if (!weak) break;
    const { x, y } = weak; if (cmd('removeDef', { id: weak.id })) break;
    if (!cmd('place', { kind: 'def', t: best, x, y, z: 0 })) { n++; maxSpend -= costOf('def', best).g || 0; } else break;
  }
  return n;
};
// pouvoirs de hauts faits ; dans les versions d'avant les envies (v10), aussi caresses, friandises, « rassurer » et récompenses à réclamer
const OLD_SOULS = () => typeof CMD.pet === 'function';
A.care = () => {
  if (OLD_SOULS()) {
    S.creatures.forEach(c => { if (isOut(c)) return; if (!c.pet) cmd('pet', { id: c.id }); if (c.tempt) { cmd('reassure', { id: c.id }); if (S.gold > 8) cmd('treat', { id: c.id }); } else if (c.mood <= 1 && S.gold > 6) cmd('treat', { id: c.id }); });
    S.creatures.forEach(c => { const q = questOf(c); if (q && q.st === 'done') cmd('qClaim', { id: c.id }); });
  }
  ACH.filter(a => a.active && PW(a.id) && pwReady(a)).forEach(a => {
    if (a.active === 'brume' && S.menace >= MENACE_MAX - 2) cmd('power', { pw: 'brume' });
    if (a.active === 'festin' && S.creatures.filter(c => c.mood <= 2).length >= 2) cmd('power', { pw: 'festin' });
    if (a.active === 'rappel') { const c = S.creatures.find(x => x.tempt); if (c) cmd('power', { pw: 'rappel', id: c.id }); }
  });
};
A.acceptQuests = (expe = true) => S.creatures.forEach(c => { const q = questOf(c); if (q && (q.st === 'offered' || q.st === 'ready') && (expe || !QT[q.k].away)) cmd('qAccept', { id: c.id }); });
const invasionSoon = () => S.menace + (S.hype >= 3 ? 1 : 0) + (S.raid && RAIDS[S.raid.target] ? RAIDS[S.raid.target].menace || 0 : 0) >= MENACE_MAX;
// les gardes : les plus costauds sur les pièces du chemin des héros (dans la limite), le reste défend le Cœur
A.guards = () => {
  if (typeof guardCap !== 'function') return;
  const route = []; (heroRoute() || []).forEach(([x, y, z]) => { const r = roomAt(x, y, z || 0); if (guardable(r) && !route.includes(r)) route.push(r); });
  S.creatures.forEach(c => { c.guard = null; }); if (!route.length) return;
  const crew = S.creatures.filter(fitToFight).sort((a, b) => guardOf(b) - guardOf(a)), n = Math.min(guardCap(), Math.floor(crew.length * .6));
  let k = 0; for (const c of crew.slice(0, n)) { for (let t = 0; t < route.length; t++) { const r = route[(k + t) % route.length]; if (!CMD.guard({ id: c.id, room: r.id })) { k = (k + t + 1) % route.length; break; } } }
};
// les grands chantiers quand l'or s'accumule ; la cuisine quand le garde-manger le permet ; les caravanes selon la stratégie
// les Merveilles : l'or et le bois en trop (au-delà d'une réserve) vont à la moins chère ; une fête quand quelqu'un se sent délaissé
A.wonder = (reserve = 200) => { if (typeof WONDERS === 'undefined') return; const k = Object.keys(WONDERS).map(x => [x, wonderCost(x)]).sort((a, b) => (a[1].g + a[1].s) - (b[1].g + b[1].s))[0]; if (k && S.gold - k[1].g >= reserve && S.mat - k[1].s >= reserve / 2) cmd('wonder', { id: k[0] }); };
A.spy = (reserve = 30) => { if (typeof coupPending !== 'function') return; coupPending().forEach(([id]) => { if (S.gold >= coupCost() + reserve) cmd('spy', { id }); }); };
A.fete = () => { if (typeof feteWhy === 'undefined' || feteWhy()) return; if (S.creatures.some(c => !isOut(c) && (c.loy == null ? 50 : c.loy) < 35) && S.gold - feteCost().g >= 40) cmd('fete'); };
A.chantier = (reserve = 60) => { if (typeof CHANTIERS === 'undefined' || chantierState().cur) return; const k = Object.keys(CHANTIERS).filter(x => !chantierWhy(x)).sort((a, b) => CHANTIERS[a].cost.g - CHANTIERS[b].cost.g)[0]; if (k && S.gold - CHANTIERS[k].cost.g >= reserve) cmd('chantier', { id: k }); };
A.cook = () => { if (typeof RECIPES === 'undefined' || !hasKitchen()) return; const order = [eaters() > foodCap() ? 'tourte' : null, invasionSoon() ? 'gateau' : null, invasionSoon() ? 'poisson' : null, S.calamity >= CAL_MAX - 3 ? 'ragout' : null, 'soupe'].filter(Boolean); for (const k of order) if (canCook(k)) { cmd('cook', { id: k }); return; } };
A.caravan = how => { if (typeof activeCaravans === 'undefined') return; const cv = activeCaravans().find(x => !x.done); if (cv && (how !== 'pille' || caravanOdds(cv) >= .5)) cmd('caravan', { id: cv.id, how }); };
A.posts = () => {   // chaque créature dans sa pièce préférée (humeur) ; les gardes, eux, se postent sur le chemin des héros
  A.guards();
  if (invasionSoon()) return;
  const path = new Set((heroPath() || []).map(([x, y]) => roomAt(x, y, 0)).filter(r => r && !isHall(r) && r.t !== 'coeur').map(r => r.id));
  S.creatures.forEach(c => { if (isOut(c) || (c.secret && c.secret.known && !c.secret.done && (c.secret.t === 'seul' || c.secret.t === 'poste'))) return; const sp = SPECIES[c.sp] || {}; const fav = S.rooms.find(r => r.built && !isHall(r) && (r.t === sp.from || (ROOMS[r.t].attracts || []).includes(c.sp)));
    const guardRoom = guardOf(c) >= 3 ? S.rooms.find(r => path.has(r.id)) : null; const met = typeof WORKSHOPS !== 'undefined' ? Object.keys(WORKSHOPS).filter(w => !WORKSHOPS[w].guard && craftAff(c, w) > 1).map(w => S.rooms.find(r => r.built && workshopType(r) === w)).find(Boolean) : null;   // né·e pour un métier : à son atelier
    const want = met || (guardRoom && Math.random() < .5 ? guardRoom : fav) || null;
    if ((want ? want.id : null) !== c.post) cmd('post', { id: c.id, post: want ? want.id : null }); });
  // les rivaux ne vivent pas au même étage : on en poste un à un autre étage s'il en existe un
  if (typeof rivalPairs === 'function') Object.keys(rivalPairs()).forEach(k => { const [pair, zz] = k.split('@'), sp = pair.split('|')[0], z0 = +zz;
    const rooms = S.rooms.filter(r => r.built && !isHall(r) && !ROOMS[r.t].stairs && zOf(r) !== z0 && zOf(r) !== EXT); if (!rooms.length) return;
    S.creatures.filter(c => c.sp === sp && !isOut(c) && livingFloor(c) === z0).forEach(c => cmd('post', { id: c.id, post: pick(rooms).id })); });
};
// les quêtes du journal : accepter (3 au plus), livrer, choisir la première option, cuisiner les plats, lancer raids et expéditions
A.questStep = () => {
  const Q = qState(); questSync();
  Q.offers.slice().forEach(o => { if (Q.cur.length < QUEST_MAX) cmd('questAccept', { id: o.id }); });
  Q.cur.slice().forEach(q => {
    const st = qStep(q); if (!st) return;
    if (st.k === 'pay') cmd('questPay', { id: q.id });
    else if (st.k === 'choice') cmd('questChoose', { id: q.id, o: 0 });
    else if (st.k === 'cook') Object.entries(st.dishes).forEach(([k, n]) => { if ((q.prog[k] || 0) < n) cmd('cook', { id: k }); });
    else if ((st.k === 'raid' || st.k === 'boss') && !S.raid) A.raid(st.target, 4);
  });
};
A.raid = (target, n = 3) => {
  const tg = RAIDS[target]; if (!tg || !raidKnown(target) || tg.tier > S.tier) return 'cible indisponible';
  if (typeof isCrawlTarget === 'function' && isCrawlTarget(target)) { const crew = free().map(c => [c, crawler(c)]).sort((a, b) => b[1].hp * b[1].atk - a[1].hp * a[1].atk).slice(0, 4).map(x => x[0]); return crew.length ? cmd('raidPlan', { target, team: crew.map(c => c.id) }) : 'personne'; }   // un donjon rival : une expédition
  const wants = c => { const q = questOf(c); return q && q.k === 'raid' && q.st === 'active' ? 3 : 0; };
  const crew = free().filter(c => diceOf(c) > 0).sort((a, b) => (diceOf(b) + wants(b) + ((SPECIES[b.sp].tag === tg.tag) ? 1 : 0)) - (diceOf(a) + wants(a) + ((SPECIES[a.sp].tag === tg.tag) ? 1 : 0))).slice(0, n);
  if (!crew.length) return 'personne'; const pool = raidBreakdown(target, crew.map(c => c.id)).pool;
  return cmd('raidPlan', { target, team: crew.map(c => c.id), app: pool <= 1 ? 'prudente' : pool >= 4 ? 'desesperee' : 'risquee' });
};
A.raidPool = (target, n = 3) => { const tg = RAIDS[target]; const crew = free().filter(c => diceOf(c) > 0).sort((a, b) => diceOf(b) - diceOf(a)).slice(0, n); return crew.length ? raidBreakdown(target, crew.map(c => c.id)).pool : -9; };
A.expedition = (siteId, n = 2) => { const s = siteById(siteId); if (!s) return 'lieu inconnu'; const X = EXPE_SITES[s.expe] || {};
  if (typeof CRAWL_SITES !== 'undefined' && CRAWL_SITES.includes(s.expe)) {   // la Forêt et les Grottes : une expédition en cartes, la nuit même (elle prend la place d'un raid)
    if (S.raid) return 'raid déjà prévu'; const crew = free().map(c => [c, crawler(c)]).sort((a, b) => b[1].hp * b[1].atk - a[1].hp * a[1].atk).slice(0, 4).map(x => x[0]);
    return crew.length >= 2 ? cmd('expe', { site: siteId, team: crew.map(c => c.id) }) : 'personne'; } const crew = free().filter(c => !(S.raid && S.raid.team.includes(c.id))).sort((a, b) => (diceOf(b) + ((SPECIES[b.sp] || {}).tag === X.tag ? 1 : 0)) - (diceOf(a) + ((SPECIES[a.sp] || {}).tag === X.tag ? 1 : 0))).slice(0, n); if (!crew.length) return 'personne'; return cmd('expe', { site: siteId, team: crew.map(c => c.id) }); };
A.scout = () => { const w = world(), vis = visibleSet(); const edge = w.list.filter(c => !vis.has(c.i) && HEX_DIRS.some(([dq, dr]) => { const n = w.cell(c.q + dq, c.r + dr); return n && vis.has(n.i); })); if (!edge.length) return 'carte connue';
  const target = edge.sort((a, b) => (b.site ? 2 : 0) - (a.site ? 2 : 0) || hdist(a.q, a.r) - hdist(b.q, b.r) + (Math.random() - .5))[0]; const c = free().filter(x => !(S.raid && S.raid.team.includes(x.id))).sort((a, b) => diceOf(a) - diceOf(b))[0]; if (!c) return 'personne'; return cmd('scout', { hex: target.i, team: [c.id] }); };
A.shop = (siteId, item, arg) => cmd('shop', { site: siteId, item, arg });
A.knownTowns = () => world().sites.filter(s => SITE_KINDS[s.kind].shop && siteKnown(s));
A.request = (q) => { const R = REQ[q.req]; if (R.kind === 'pay') return cmd('request', { id: q.id }); if (R.kind === 'send' && q.st === 'open') { const c = reqCandidates(q).filter(x => !(S.raid && S.raid.team.includes(x.id)))[0]; if (!c) return 'personne'; return cmd('request', { id: q.id, team: [c.id] }); } return 'rien à faire'; };
A.floor = (dir) => { const z = dir > 0 ? Math.max(0, ...floorsOpen()) : Math.min(0, ...floorsOpen()); return A.build(dir > 0 ? 'montee' : 'escalier', z); };
A.free = free;
const roomFree = r => cellsOf(r).filter(([x, y]) => !furnAt(x, y, zOf(r)) && !defAt(x, y, zOf(r)));
A.placeIn = (r, t) => { for (const [x, y] of roomFree(r)) if (!cmd('place', { kind: 'furn', t, x, y, z: zOf(r) })) return null; return 'pas de place'; };
const furnAvail = t => withZ(typeof outdoorItem === 'function' && outdoorItem('furn', t) ? EXT : 0, () => availability('furn', t));   // un meuble du dehors se regarde depuis les Jardins
A.placeItem = t => { const f = FURN[t]; if (!f || furnAvail(t) || !canAfford(costOf('furn', t))) return 'indisponible'; if (f.room === 'any') return A.decorate(t, 999);
  const r = S.rooms.find(x => x.built && x.t === f.room && roomFree(x).length); return r ? A.placeIn(r, t) : 'pas de pièce'; };
A.questDoable = (c, q) => {
  if (q.k === 'objet') { const f = FURN[q.item]; return !!f && !furnAvail(q.item) && (f.room === 'any' || S.rooms.some(r => r.built && r.t === f.room && roomFree(r).length)); }
  if (q.k === 'deco') { const r = S.rooms.find(x => x.id === q.roomId); return !!r && roomFree(r).length >= q.goal - decorIn(r); }
  if (q.k === 'piece') return !availability('room', q.room) && !!A.spot(q.room);
  if (q.k === 'ami') return recruitable().includes(q.sp) && A.knownTowns().some(s => s.kind !== 'village');
  if (q.k === 'raid') return diceOf(c) > 0 && Object.keys(RAIDS).some(k => raidKnown(k) && RAIDS[k].tier <= S.tier);
  return true;   // être aux anges, défendre, poste, expédition : ça vient avec le temps
};
// rêves secrets connus : on les réalise quand c'est simple (un meuble, un piège, un poste)
A.dreams = () => S.creatures.forEach(c => {
  const d = c.secret; if (!d || !d.known || d.done || isOut(c)) return;
  if (d.t === 'f') A.placeItem(d.k);
  else if (d.t === 'd') A.traps(99);
  else if (d.t === 'poste') { const r = S.rooms.find(o => o.t === d.k && o.built); if (r) cmd('post', { id: c.id, post: r.id }); }
  else if (d.t === 'seul') { const r = S.rooms.find(o => o.built && !isHall(o) && o.t !== 'coeur' && !ROOMS[o.t].stairs && !S.creatures.some(x => x.post === o.id)); if (r) cmd('post', { id: c.id, post: r.id }); }
});
A.quests = () => {
  S.creatures.forEach(c => {
    const q = questOf(c); if (!q) return;
    if (q.st === 'offered') { cmd(A.questDoable(c, q) ? 'qAccept' : 'qDecline', { id: c.id }); return; }   // v10
    if (q.st === 'ready') { cmd('qAccept', { id: c.id }); return; }   // l'aventure : on la laisse partir
    if (q.st !== 'active') return;
    if (q.k === 'objet') A.placeItem(q.item);
    else if (q.k === 'deco') { const r = S.rooms.find(x => x.id === q.roomId); for (let i = 0; r && i < 3 && decorIn(r) < q.goal; i++) { const t = DECOR_ORDER.find(k => !availability('furn', k) && canAfford(costOf('furn', k))); if (!t || A.placeIn(r, t)) break; } }
    else if (q.k === 'piece') { const mine = S.rooms.filter(r => r.t === q.room); const todo = mine.find(r => !r.built || !furnished(r)); if (!todo) A.build(q.room); else if (todo.built) A.furnish(todo, S.gold); }
    else if (q.k === 'ami') { const s = A.knownTowns().find(x => x.kind !== 'village'); if (s) A.shop(s.id, 'recrue', q.sp); }
    else if (q.k === 'ravi' && c.mood < 5 && S.gold > 4 && OLD_SOULS()) cmd('treat', { id: c.id });
    else if (q.k === 'poste') { const r = S.rooms.find(o => o.t === q.room && o.built); if (r) cmd('post', { id: c.id, post: r.id }); }
  });
  if (typeof secretsCheck === 'function') A.dreams();
  checkQuests();
};

/* ---------- un état lisible (pour Sonnet et les journaux) ---------- */
function simState(full) {
  const v = vicState(), h = heroOrigin(), pp = partyPreview(), path = heroPath() || [];
  const crit = S.creatures.map(c => `${c.name}(${SPECIES[c.sp] ? SPECIES[c.sp].name : c.sp}, niv${c.lvl}, ❤${c.mood}, loy${c.loy}, épa${c.epa}${c.tempt ? ', TENTÉ' : ''}${c.legend ? ', légende' : ''}${c.away ? ', en mission' : c.raid ? ', en raid' : ''}${c.quest ? ', envie ' + c.quest.k + ':' + c.quest.st : ''}${c.secret && c.secret.known ? ', rêve ' + (c.secret.done ? 'réalisé' : c.secret.label) : ''})`);
  const rooms = {}; S.rooms.filter(r => !['couloir', 'porche'].includes(r.t)).forEach(r => { const k = ROOMS[r.t].name + (zOf(r) ? '@' + zOf(r) : '') + (r.built ? '' : ' (chantier ' + r.prog + '/' + ROOMS[r.t].clock + ')'); rooms[k] = (rooms[k] || 0) + 1; });
  const known = world().sites.filter(s => siteKnown(s) && s.kind !== 'chateau').map(s => `${s.id}:${s.name}[${s.kind}${s.expe ? ' expé' + (expeReady(s) ? '' : ' (recharge)') : ''}${SITE_KINDS[s.kind].rank ? ' bonne-volonté ' + gwOf(s) : ''}${s.raid && s.kind !== 'raid' ? ' raid' : ''}${s.rival ? ' raid r_' + s.rival + (isVassal(s.rival) ? ' VASSAL' : ' ' + (v.vassals[s.rival] || 0) + '/3') : ''}]`);
  const raids = Object.keys(RAIDS).filter(k => raidKnown(k) && RAIDS[k].tier <= S.tier && !(/^x_/.test(k) && RAIDS[k].site && !siteKnown(siteById(RAIDS[k].site)))).map(k => { if (typeof isCrawlTarget === 'function' && isCrawlTarget(k)) return `${k}(expédition en cartes)`; const p = A.raidPool(k); return `${k}(${p < 0 ? 'personne pour y aller' : 'dés ' + Math.min(6, p) + (p > 6 ? ' (réserve ' + p + ', 6 lancés au plus)' : '')})`; });
  const reqs = openReqs().map(q => `${q.id}:${siteById(q.site).name}:${q.req}(${REQ[q.req].kind}${q.st === 'sent' ? ', en cours' : ''})`);
  const lines = [
    `NUIT ${S.night} · palier ${S.tier} · or ${S.gold} · matériaux ${S.mat} · notoriété ${S.hype} · rayonnement ${radiance()} · ambiance ${ambiance()} · lits ${S.creatures.length}/${beds()} · repas ${eaters()}/${foodCap()} · calamité ${S.calamity}/${CAL_MAX} · menace ${S.menace}/${MENACE_MAX}`,
    `Prochains héros : ${pp.size} ${HERO_RANK[pp.rank].label} de ${h ? h.name : '?'}, courage ~${pp.courage} · défense actuelle (somme des dégâts sur le chemin) ${defenseScore()} · pièges ${S.defs.length}`,
    `Étages ${floorsOpen().join(',')} (max ${Math.min(3, S.tier)} en plus) · remparts ${12 + 2 * (S.size || 0)}×${12 + 2 * (S.size || 0)} · palier suivant : ${tierStatus() ? tierStatus().rows.map(r => (r.ok ? '✓' : '✗') + r.text).join(' ; ') : 'max'}`,
    `Pièces : ${Object.entries(rooms).map(([k, n]) => n > 1 ? k + '×' + n : k).join(', ') || 'aucune'}`,
    `Créatures (${S.creatures.length}) : ${crit.join(' ; ')}`,
    `Album ${Object.keys(S.album).length}/${MENAGERIE_SP.length} · artefacts en réserve : ${ARTEFACTS.filter(k => S.free[k] > 0).join(', ') || 'aucun'} · exposés ${artPlaced()}/12 · trouvés ${artFound()}/12 · carte ${mapPct()} %`,
    `Victoires (%) : ${VICTORIES.map(x => x.id + ' ' + vicPct(x.id)).join(' · ')} · gagnées : ${Object.keys(v.won).join(', ') || 'aucune'} · ère ${v.era} · rivaux : ${Object.entries(v.race).map(([k, p]) => k + ' ' + Math.floor(p) + '%').join(', ')} · voix ${v.votes}/20 · prochain Conseil à la fin de la nuit ${Math.ceil((S.night + 1) / 10) * 10 - 1}`,
    `Lieux connus : ${known.join(' ; ')}`,
    `Raids possibles : ${raids.join(', ') || 'aucun'} · requêtes : ${reqs.join(' ; ') || 'aucune'}${v.proj ? ' · projet en cours : ' + v.proj.id + ' ' + v.proj.prog + '/' + v.proj.need : ''}`,
  ];
  if (full) lines.push(`Pièces constructibles ici : ${ROOM_ORDER.filter(t => !availability('room', t)).join(', ')}`);
  return lines.join('\n');
}
