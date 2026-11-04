/* =========================================================
   Les invasions aux cartes : le donjon à l'envers
   La bande traverse quelques pièces du château, tirées au hasard,
   puis le Cœur. Plus de gardes à poster : avant l'assaut, on tire
   au sort les défenseurs, rangés par palier de force (les plus
   faibles dans les premières pièces, les plus fortes à la fin) ;
   les 3 plus fortes, reposées, attendent au Cœur. Une pièce avec
   des défenseurs tirés : un combat aux cartes (le moteur des
   expéditions, retourné, avec les cartes que donne la pièce).
   Une pièce sans défenseurs : les créatures qui y travaillent
   agissent à leur idée. Chaque pièce pillée rend la bande plus
   forte… et plus riche à rattraper.
   ========================================================= */
// les héros, comme ennemis du combat aux cartes (leurs actions tournent, on voit toujours la prochaine)
Object.assign(CRAWL_EN, {
  h_paysan:  { name: 'Paysan en colère', hero: 'paysan', hp: 14, acts: [['atk', 5], ['atk', 4], ['block', 5]] },
  h_voleuse: { name: 'Voleuse', hero: 'voleuse', hp: 12, acts: [['execute', 6], ['multi', 2, 2], ['atk', 4]] },
  h_elfe:    { name: 'Archère elfe', hero: 'elfe', hp: 12, acts: [['multi', 3, 2], ['atk', 5], ['execute', 6]] },
  h_mage:    { name: 'Mage', hero: 'mage', hp: 10, acts: [['aoe', 3], ['atk', 6], ['stun']] },
  h_paladin: { name: 'Paladin', hero: 'paladin', hp: 19, acts: [['block', 6], ['heal', 5], ['atk', 5]] },
  h_barbare: { name: 'Barbare', hero: 'barbare', hp: 21, acts: [['smash', 7], ['atk', 6], ['block', 4]] },
});
if (typeof CRAWL_LOOK !== 'undefined') ['paysan', 'voleuse', 'elfe', 'mage', 'paladin', 'barbare'].forEach(k => { CRAWL_LOOK['h_' + k] = ['hero', k]; });
// les réglages (l'équilibrage se fait ici, par simulation)
const INV_TUNE = {
  lvlK: 1.3, lvl: -10, rank: 0, tier: 7, glow: 400, lvlMin: 2.2,   // le niveau de la bande : × celui des expéditions, + base, par rang, par palier, un point par tranche de rayonnement, jamais sous lvlMin (le rang pèse déjà par la taille et les héros de la bande)
  trapK: 2,          // un piège frappe comme au temps des couloirs, à l'échelle des cartes
  lootPct: .04, lootPctS: .03,   // ce qu'une pièce pillée leur rapporte : une part de ton or et de ton bois
  buff: 1,           // +1 aux coups de toute la bande par pièce pillée
  bounty: .4,        // la prime d'une bande repoussée : une part de ce qu'elle avait pillé (en plus de le récupérer), plus 2 💰 par héros et par rang
  evP: .25, evD: 9,   // dans une pièce sans défenseurs, une créature qui y travaille tente un mauvais coup : chance de base, dégâts de base (+ sa garde)
  turns: 14,         // un combat qui s'éternise : la bande force le passage
  rout: .2, rout3: .3,   // la bande détale quand cette part des siens est à terre, arrondie au-dessus (un héros dans une bande de 2 à 5, deux au-delà ; rang 3 : deux dans une bande de 4 à 6) ; au Cœur, jusqu'au bout
  roomCap: 4, heartCap: 3,   // combattants au plus, dans une pièce et au Cœur (le Cœur : les plus fortes, reposées)
  drawP: .12, teamMax: 2,    // le tirage des défenseurs d'une pièce : chaque créature de son palier de force y est prise avec cette chance (moins si elle est fatiguée), jusqu'à teamMax (+1 avec un Corps de garde, +1 si un Poste de garde borde la pièce)
  rondeP: .1,                // le chemin de ronde (savoir des sentinelles, rang 2) : +10 points de chance d'être tirée ; les meurtrières (rang 3) : une place de plus au Cœur
  rankHp: [1, .55, .55],   // les PV des héros selon le rang de la bande (1, 2, 3) : aux rangs 2 et 3, plus nombreux et mieux armés, chacun est un peu moins coriace (sinon le rang tranche tout)
};
const INV_ROOMS = t => t >= 3 ? 9 : t >= 2 ? 6 : 3;   // palier 1 : 3 pièces, palier 2 : 6, palier 3 et plus : 9 (puis le Cœur)
// la bande se prépare comme un donjon : à la force de tes meilleures créatures (le niveau des expéditions), plus son rang
const invLevel = plan => Math.round(Math.max(INV_TUNE.lvlMin || 1, crawlLevel() * INV_TUNE.lvlK + INV_TUNE.lvl + INV_TUNE.rank * ((plan.rank || 1) - 1) + INV_TUNE.tier * (S.tier || 0) + (typeof radiance === 'function' ? radiance() : 0) / INV_TUNE.glow + (plan.crusade ? .5 : 0)) * 10) / 10;
const invPower = c => { const p = crawler(c); return p.hp * p.atk; };
const invRoomOf = id => S.rooms.find(o => o.id === id);
// les pièces que la bande peut traverser (une grande salle compte une fois)
function invCandidates() {
  const seen = new Set(), out = [];
  builtRooms().forEach(r => { if (!guardable(r) || isHall(r)) return; const g = groupOf(r).rooms[0]; if (seen.has(g.id)) return; seen.add(g.id); out.push(g); });
  return out;
}
// l'ancienne règle des gardes postés (c.guard) : gardée pour les vieux appels, elle ne décide plus de la défense (voir invLineup)
const invGuards = r => r ? guardsOfRoom(r).filter(fitToFight).sort((a, b) => invPower(b) - invPower(a)).slice(0, INV_TUNE.roomCap) : [];
// qui défendrait le Cœur ce soir (un aperçu : les plus fortes des créatures reposées)
const invHeartCrew = () => invHeartPick(S.creatures.filter(fitToFight).sort((a, b) => invPower(a) - invPower(b)));
// le parcours : N pièces au hasard, puis le Cœur (la montée en force vient des paliers de défenseurs, pas de l'ordre des pièces)
function invRoute() {
  const pool = shuffle(invCandidates()).slice(0, INV_ROOMS(S.tier || 0));
  const h = heartRoom(); return [...pool.map(r => r.id), ...(h ? [h.id] : [])];
}

/* ---------- le tirage des défenseurs : par paliers de force ---------- */
// la fatigue des raids et des expéditions : épuisée (FAT_TIRED, 4), une créature se repose ; fatiguée, elle a moins de chances d'être tirée
const invFatMax = () => (typeof FAT_TIRED !== 'undefined' ? FAT_TIRED : 4);
const invTired = c => (c.fat || 0) >= invFatMax();
const invDrawP = c => invTired(c) ? 0 : Math.max(0, Math.min(1, (INV_TUNE.drawP + (typeof craftRank === 'function' && craftRank('guet') >= 2 ? INV_TUNE.rondeP : 0)) * (1 - (c.fat || 0) / invFatMax())));
const invHeartN = () => INV_TUNE.heartCap + (typeof craftRank === 'function' && craftRank('guet') >= 3 ? 1 : 0);
// les places d'une pièce : teamMax, +1 avec un Corps de garde bâti, +1 si un Poste de garde borde la pièce (roomCap au plus)
const invHasPost = r => !!r && invTrapsNear(r).some(d => DEFS[d.t] && DEFS[d.t].post);
const invSeats = r => Math.min(INV_TUNE.roomCap, INV_TUNE.teamMax + (builtCount('garde') > 0 ? 1 : 0) + (invHasPost(r) ? 1 : 0));
// le Cœur : les plus fortes parmi les reposées ; une épuisée n'y va que s'il ne reste personne d'autre (pool trié du plus faible au plus fort)
function invHeartPick(pool) {
  const n = invHeartN(), rested = pool.filter(c => !invTired(c));
  return (rested.length ? rested : pool).slice(-n).reverse();
}
// le tirage : le Cœur d'abord, puis les autres reposées découpées en autant de paliers contigus que de pièces (du plus faible au plus fort) ;
// pour la pièce i, chaque créature du palier i est prise avec sa chance (drawP, moins la fatigue), dans la limite des places.
// rooms[k] : les défenseurs tirés pour I.route[k] (vide pour le Cœur) ; une créature ne défend qu'une pièce par invasion.
function invLineup(I) {
  const pool = S.creatures.filter(fitToFight).sort((a, b) => invPower(a) - invPower(b) || (a.id < b.id ? -1 : 1));
  const heart = invHeartPick(pool), inHeart = new Set(heart.map(c => c.id));
  const rest = pool.filter(c => !inHeart.has(c.id) && !invTired(c));
  const slots = I.route.map((id, k) => [id, k]).filter(([id]) => { const r = invRoomOf(id); return r && r.t !== 'coeur'; });
  const rooms = I.route.map(() => []), n = slots.length;
  slots.forEach(([id, k], i) => {
    const tier = rest.slice(Math.floor(i * rest.length / n), Math.floor((i + 1) * rest.length / n)), seats = invSeats(invRoomOf(id));
    shuffle(tier.slice()).forEach(c => { if (rooms[k].length < seats && Math.random() < invDrawP(c)) rooms[k].push(c.id); });
  });
  return { rooms, heart: heart.map(c => c.id) };
}
// les pièges des couloirs qui bordent une pièce : ils frappent la bande à l'entrée, et donnent leur carte aux combats de la pièce
function invTrapsNear(r) {
  const cells = new Set(); groupOf(r).rooms.forEach(o => { for (let x = o.x; x < o.x + (o.w || 1); x++) for (let y = o.y; y < o.y + (o.h || 1); y++) cells.add(zOf(o) + ':' + x + ':' + y); });
  return (S.defs || []).filter(d => { const z = zOf(d); return [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]].some(([a, b]) => cells.has(z + ':' + (d.x + a) + ':' + (d.y + b))); });
}
// les cartes de la pièce : ses meubles et les pièges qui la bordent
function invRoomPool(r) {
  const kinds = new Set(); groupOf(r).rooms.forEach(o => furnIn(o).forEach(f => kinds.add(f.t))); invTrapsNear(r).forEach(d => kinds.add(d.t));
  return Object.keys(CASTLE_CARDS).filter(k => CASTLE_CARDS[k].from.some(x => kinds.has(x)));
}
const invRoomName = r => !r ? '?' : r.t === 'coeur' ? 'le Cœur du donjon' : ROOMS[r.t].name;

/* ---------- l'état d'une invasion ---------- */
function invNew(plan) {
  const I = { plan, lvl: invLevel(plan), route: plan.route || invRoute(), idx: 0, ev: [], guardHit: new Set(), bag: { g: 0, s: 0, items: [] }, pow: 0, looted: 0, fights: 0, sprung: new Set(), disarmed: false, out: null, lines: [], hurt: new Set(), fought: new Set(), kos: {}, log: [] };
  I.foes = plan.party.map((h, i) => { const k = CRAWL_EN['h_' + h.k] ? 'h_' + h.k : 'h_paysan', f = crawlFoe(k, 1, i, I.lvl, 1); f.name = String(h.name || f.name).replace(/ de légende$/, ''); f.j = i; if (S.world && S.world.decoy) { f.hp = f.max = Math.max(1, Math.round(f.hp * .75)); } return f; });
  const rh = (INV_TUNE.rankHp || [])[Math.min(3, Math.max(1, plan.rank || 1)) - 1] || 1; if (rh !== 1) I.foes.forEach(f => { f.hp = f.max = Math.max(1, Math.round(f.hp * rh)); });
  I.lineup = invLineup(I); I.g0 = I.lineup.rooms.filter(l => l.length).length; I.h0 = I.lineup.heart.length;
  I.rout = Math.max(1, Math.ceil(I.foes.length * ((plan.rank || 1) >= 3 ? INV_TUNE.rout3 : INV_TUNE.rout)));
  return I;
}
const invUp = I => I.foes.filter(f => f.hp > 0);
const invBroken = I => I.foes.filter(f => f.hp <= 0).length >= I.rout;
// qui défend une pièce : les créatures tirées pour elle (au Cœur, ses défenseuses), encore aptes et pas K.O. dans cette invasion
function invInfo(I, id) {
  const r = invRoomOf(id), heart = !!r && r.t === 'coeur', L = I.lineup || (I.lineup = invLineup(I)), k = I.route.indexOf(id);
  const ids = !r ? [] : heart ? L.heart : (L.rooms[k] || []);
  return { r, heart, def: ids.map(critter).filter(c => c && fitToFight(c) && !I.hurt.has(c.id)), name: invRoomName(r) };
}
// une équipe de défense pour le moteur des expéditions (le butin affiché, c'est celui de la bande)
function invFightR(I, info) {
  const team = info.def;
  return { dg: 'chateau', np: 1, lvl: I.lvl, floor: 1, step: 0, party: team.map(c => crawler(c)), deck: crawlDeck(team, crawlAutoBag(invRoomPool(info.r))), loot: I.bag, log: [], path: [], done: null };
}
// avant chaque combat : la bande garde ses blessures, mais pas ses parades ; ses coups grandissent avec le butin
function invFoesForFight(I) { const up = invUp(I); up.forEach(f => { f.block = 0; f.st = f.stunNext ? { stun: 1 } : {}; f.stunNext = 0; f.buff = I.pow; f.ai = Math.floor(Math.random() * CRAWL_EN[f.k].acts.length); }); return up; }
// dans le combat : la bande détale dès qu'assez des siens sont à terre ; un combat trop long, elle force le passage
function invHook(I, B, heart) {
  const chk = B.check; B.check = () => { if (!B.over && !heart && invBroken(I)) B.over = 'won'; return chk(); };   // au Cœur, la bande se bat jusqu'au bout
  const st = B.startTurn; B.startTurn = () => { st(); if (!B.over && B.turn > INV_TUNE.turns) B.over = 'push'; };
}
function invAfterFight(I, info, R, res) {
  I.fights++;
  const ko = I.foes.filter(f => f.hp <= 0 && !f.koSeen); ko.forEach(f => { f.koSeen = true; const p = pick(R.party.filter(x => !x.ko)) || pick(R.party); if (p && critter(p.id)) I.kos[p.id] = (I.kos[p.id] || 0) + 1; }); I.log.push({ heart: info.heart, n: info.def.length, res, pow: I.pow });
  R.party.forEach(p => { I.fought.add(p.id); if (p.ko && res !== 'won') I.hurt.add(p.id); });
  if (res === 'won') { I.out = 'repelled'; return [['🛡️', `Dans ${info.name}, ${info.def.map(c => c.name).join(', ')} ${info.def.length > 1 ? 'mettent' : 'met'} la bande en déroute !`, 'good']]; }
  if (info.heart) { I.out = 'robbed'; return [['💔', 'Le Cœur tombe : la bande se sert.', 'bad']]; }
  const L = invLoot(I, info, res === 'push' ? .5 : 1);
  return [[res === 'push' ? '🏃' : '⚔️', `${res === 'push' ? 'Le combat s’éternise : la bande force le passage' : `${info.def.map(c => c.name).join(', ')} ${info.def.length > 1 ? 'tombent' : 'tombe'}`} dans ${info.name}. ${invLootText(L)}`, 'bad']];
}
// la bande pille la pièce : or, bois, parfois un meuble… et elle en sort plus forte
function invLoot(I, info, k = 1) {
  const t = S.tier || 0, rank = I.plan.rank || 1;
  if (!info.half && invTrapsNear(info.r).some(d => DEFS[d.t] && DEFS[d.t].block)) info = { ...info, half: true };
  let g = Math.round(Math.max(2 + t, S.gold * INV_TUNE.lootPct) * k * (info.r.t === 'tresor' ? 2 : 1) * (info.half ? .5 : 1)), s = Math.round(Math.max(1 + t, S.mat * INV_TUNE.lootPctS) * k);
  g = Math.max(0, Math.min(g, S.gold - I.bag.g)); s = Math.max(0, Math.min(s, S.mat - I.bag.s)); I.bag.g += g; I.bag.s += s;
  let item = null; if (Math.random() < .35 * k) { const w = wreckable(info.r).filter(f => !I.bag.items.includes(f.id)); if (w.length) { item = pick(w); I.bag.items.push(item.id); } }
  I.pow += INV_TUNE.buff * k; I.looted++;
  return { g, s, item };
}
const invLootText = L => { const p = [L.g && `${L.g} 💰`, L.s && `${L.s} 🪵`, L.item && FURN[L.item.t] && FURN[L.item.t].name].filter(Boolean); return p.length ? `Ils emportent ${p.join(', ')}, et frappent plus fort.` : 'Rien à emporter, mais ils frappent plus fort.'; };
// les pièges qui bordent la pièce (chacun ne sert qu'une fois par invasion ; la voleuse en désamorce un)
function invTraps(I, info) {
  const out = [];
  invTrapsNear(info.r).forEach(d => {
    const D = DEFS[d.t]; if (!D || I.out || I.sprung.has(d.id) || (!D.str && !D.lost)) return; I.sprung.add(d.id);
    const up = invUp(I); if (!up.length) return;
    if (!I.disarmed && D.kind === 'piège' && (I.nemDis || up.some(f => f.k === 'h_voleuse'))) { I.disarmed = true; out.push(['🗝️', `${I.nemDis ? 'Le héros némésis' : 'La voleuse'} désamorce ${D.name}.`, '']); return; }
    const f = pick(up), dmg = Math.max(1, Math.round(defStr(d) * INV_TUNE.trapK * (f.k === 'h_barbare' && D.kind === 'verrou' ? .5 : 1)));
    f.hp = Math.max(0, f.hp - dmg); if (D.sticky) f.stunNext = 1; I.ev.push({ k: 'trap', t: d.t, id: d.id, hits: [{ ko: f.hp <= 0 }] });
    out.push(['🪤', `${D.name} : −${dmg} PV à ${f.name}${f.hp <= 0 ? ' (K.O. !)' : D.sticky ? ' (il reste à terre : il perdra son premier tour)' : ''}.`, 'good']);
    if (D.lost && Math.random() < D.lost * .6) { I.out = 'lost'; out.push(['🌀', D.lostLine || `${D.name} : la bande en a assez et rebrousse chemin !`, 'good']); }
  });
  // la garde de la pièce et de ses meubles (Corps de garde, armure, râtelier…) : un coup au premier héros qui entre
  const gs = groupOf(info.r).rooms.reduce((a, o) => a + (rstat(o, 'guard') || 0), 0), up2 = invUp(I);
  if (gs > 0 && up2.length && !I.out && !I.guardHit.has(info.r.id)) { I.guardHit.add(info.r.id); const f = up2[0], dmg = Math.round(gs * INV_TUNE.trapK); f.hp = Math.max(0, f.hp - dmg); out.push(['🛡️', `${info.name.charAt(0).toUpperCase() + info.name.slice(1)} se défend : −${dmg} PV à ${f.name}${f.hp <= 0 ? ' (K.O. !)' : ''}.`, 'good']); }
  if (!I.out && invBroken(I)) { I.out = 'repelled'; out.push(['🛡️', 'Trop de blessés : la bande détale !', 'good']); }
  return out;
}
// une pièce sans défenseurs tirés : les créatures qui y travaillent agissent à leur idée (caractère, loyauté, humeur)
function invEvent(I, info) {
  const away = new Set(I.lineup ? [...I.lineup.heart, ...I.lineup.rooms.flat()] : []);   // une créature tirée pour défendre ailleurs n'est pas là
  const out = [], ids = new Set(groupOf(info.r).rooms.map(o => o.id)), crew = S.creatures.filter(c => fitToFight(c) && c.post && ids.has(c.post) && !away.has(c.id));
  let k = 1, hidden = false;
  crew.forEach(c => {
    if (I.out) return; const has = t => (c.pers || []).includes(t), loy = c.loy || 0;
    if (has('marmotte') && Math.random() < .5) { out.push(['💤', `${c.name} dort à poings fermés et ne voit rien passer.`, '']); return; }
    if (loy < 25 && Math.random() < .4) { k += .5; out.push(['😒', `${c.name} regarde ailleurs… et leur montre même où est rangé l’or.`, 'bad']); return; }
    if (has('radin') && !hidden) { hidden = true; out.push(['🪙', `${c.name} cache l’or sous son matelas.`, 'good']); }
    const p = Math.min(.75, INV_TUNE.evP + loy / 300 + ((c.mood || 0) - 2) * .05 + (has('farceur') ? .2 : 0) + (has('curieux') || has('maniaque') ? .06 : 0) - (has('solitaire') ? .1 : 0));
    const up = invUp(I); if (!up.length) return;
    if (Math.random() < p) {
      const f = pick(up), d = Math.round((INV_TUNE.evD + guardOf(c)) * (has('bagarreur') ? 1.5 : 1));
      f.hp = Math.max(0, f.hp - d); I.fought.add(c.id);
      out.push(['🪤', `${c.name} ${has('bagarreur') ? 'leur tombe dessus à bras raccourcis' : has('farceur') ? 'leur joue un tour de sa façon' : 'leur tend un piège de fortune'} : −${d} PV à ${f.name}${f.hp <= 0 ? ' (K.O. !)' : ''}.`, 'good']);
    } else out.push(['🫣', `${c.name} se cache et les laisse passer.`, '']);
  });
  if (!crew.length) out.push(['👀', `Personne dans ${info.name} : la bande fouille tranquillement.`, '']);
  if (!I.out && invBroken(I)) { I.out = 'repelled'; out.push(['🛡️', 'Trop de blessés : la bande détale !', 'good']); return out; }
  if (I.out) return out;
  const L = invLoot(I, { ...info, half: hidden }, k); out.push(['🎒', `${info.name.charAt(0).toUpperCase() + info.name.slice(1)} est pillé·e. ${invLootText(L)}`, 'bad']);
  return out;
}
// une pièce, sans écran : pièges, puis combat (joué par l'ordinateur) ou rencontre
function invRoomAuto(I, info) {
  I.lines.push(...invTraps(I, info)); if (I.out) return;
  if (info.def.length) {
    const R = invFightR(I, info), B = crawlBattle(R, invFoesForFight(I)); invHook(I, B, info.heart);
    for (let g = 0; g < 60 && !B.over; g++) { B.startTurn(); if (B.over) break; crawlAutoTurn(B); if (B.over) break; B.endTurn(); B.enemyTurn(); }
    I.lines.push(...invAfterFight(I, info, R, B.over || 'push'));
  } else if (info.heart) { I.out = 'robbed'; I.lines.push(['💔', 'Personne pour défendre le Cœur : la bande se sert.', 'bad']); }
  else I.lines.push(...invEvent(I, info));
}
// le résultat, au format des invasions d'avant (les stickers, les sagas, le némésis, les quêtes le lisent)
function invFinish(I) {
  if (!I.out) I.out = 'robbed';
  return { outcome: I.out, fallen: I.foes.filter(f => f.hp <= 0).map(f => f.j), hurt: [...I.hurt], fought: [...I.fought], kos: I.kos, loot: { g: 0, s: 0, furn: [], freed: 0 }, gold: 0, smashed: null, ev: I.ev, lines: I.lines, charges: 0, used: [], cards: true, inv2: I };
}
function invResolve(plan) {
  const I = invNew(plan);
  for (; I.idx < I.route.length && !I.out; I.idx++) { const info = invInfo(I, I.route[I.idx]); if (info.r) invRoomAuto(I, info); }
  return invFinish(I);
}

/* ---------- la bande : plus de chemin ni de but, le Cœur au bout des pièces ---------- */
planInvasion = function () { const p = planInvasionOuter(); p.goal = { k: 'coeur' }; p.prep = 1; p.v2 = true; p.crusade = !!(p.crusade || (p.origin && p.origin.crusade)); p.route = invRoute(); return p; };
// à la fin : le butin de la bande revient au château si elle est repoussée (avec une prime), sinon elle l'emporte
const applyInvasionV1 = applyInvasion;
applyInvasion = function (plan, outcome) {
  const lines = applyInvasionV1(plan, outcome), I = plan.res && plan.res.inv2; if (!I || outcome === 'bought') return lines;
  const B = I.bag, parts = (g, s, n) => [g && `${g} 💰`, s && `${s} 🪵`, n && `${n} meuble${n > 1 ? 's' : ''}`].filter(Boolean).join(', ');
  if (outcome === 'repelled') {
    const bonus = I.looted ? Math.round(INV_TUNE.bounty * B.g + 2 * I.foes.length * (plan.rank || 1)) : 0;
    if (B.g || B.s || B.items.length) lines.push(['🎒', `Tout ce qu’ils avaient pillé reste au château (${parts(B.g, B.s, B.items.length)}).`, 'good']);
    if (bonus) { S.gold += bonus; lines.push(['💰', `Une bande gavée de butin, ça rapporte : +${bonus} 💰 de prime.`, 'good']); }
  } else {
    const g = Math.min(S.gold, B.g), s = Math.min(S.mat, B.s), n = B.items.length;
    S.gold -= g; S.mat -= s; if (n) { S.furn = S.furn.filter(f => !B.items.includes(f.id)); if (typeof dirty === 'function') dirty(); }
    if (g || s || n) lines.push(['🎒', `Ils repartent avec ce qu’ils ont pillé en chemin : ${parts(g, s, n)}.`, 'bad']);
  }
  return lines;
};
