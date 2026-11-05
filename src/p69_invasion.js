/* =========================================================
   Les invasions aux cartes : le donjon à l'envers
   La bande traverse quelques pièces du château, tirées au hasard,
   puis le Cœur. Rien à poster : avant l'assaut, les défenseurs se
   rangent d'eux-mêmes, sans hasard, de la plus faible à la plus
   forte (les plus faibles dans la première pièce, les suivantes
   dans la suivante…), une par pièce d’abord, la plus forte
   au Cœur ; le surplus renforce le Cœur, puis les pièces. Une pièce défendue : un combat aux cartes (le moteur des
   expéditions, retourné, avec les cartes que donne la pièce).
   Une pièce sans défenseurs : une rencontre. La bande ne fuit
   plus : elle va jusqu'au Cœur, sauf si tous ses héros tombent.
   Chaque pièce pillée la rend plus forte… et plus riche à rattraper.
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
  lvl: 13.5, tier: .5, crew: .25, crewCap: 34, champ: .1, lvlMin: 2.2, crus: 10, rank: 0,   // le niveau de la bande grandit avec le château, sans marche : base, par palier, par créature (crewCap au plus), par niveau de tes champions (celui des expéditions), la croisade en plus (et la notoriété : fame) ; jamais sous lvlMin
                     // (sans fuite, la bande va plus loin, mais la défense est sûre : base 7,2 → 8,3, palier ,3 → ,5, créature ,28 → ,33, champions ,35 → ,1, croisade +6 → +10 ; voir aussi rooms et trapK ; la notoriété devient le moteur : créature ,33 → ,25)
  trapK: 2.5,        // un piège frappe comme au temps des couloirs, à l'échelle des cartes : sa force × trapK (2 avant la fin des fuites ; les textes disaient déjà × 2,5)
  lootPct: .04, lootPctS: .03,   // ce qu'une pièce pillée leur rapporte : une part de ton or et de ton bois
  buff: 1,           // +1 aux coups de toute la bande par pièce pillée
  bounty: .5,        // la prime d'une bande repoussée : une part de ce qu'elle avait pillé (en plus de le récupérer), plus 2 💰 par héros (×2 d'une ville, ×3 de la cité)
  evP: .25, evD: 9, evN: 2,   // dans une pièce sans défenseurs, une créature restée à l'abri (evN au plus) croise la bande et tente un mauvais coup : chance de base, dégâts de base (+ sa garde)
  turns: 14,         // un combat qui s'éternise : la bande force le passage (dans une pièce, elle pille moitié moins ; au Cœur, il tombe)
  hold: 1, holdStop: 0,   // un héros à terre dans une pièce défendue : la pièce tient (ni pillage, ni coups plus forts) ; holdStop : le combat s'arrête là et la bande passe (sinon, il va jusqu'au bout) ; plus de fuite : elle va jusqu'au Cœur, sauf si tous ses héros tombent
  roomCap: 4, heartCap: 3,   // combattants au plus, dans une pièce et au Cœur (le Cœur : les plus fortes, reposées)
  teamMax: 2,        // les places d'une pièce : teamMax défenseurs (+1 avec un Corps de garde, +1 si un Poste de garde borde la pièce, +1 avec le chemin de ronde), roomCap au plus
  ronde: 1,          // le chemin de ronde (savoir des sentinelles, rang 2) : une place de plus dans chaque pièce ; les meurtrières (rang 3) : une place de plus au Cœur
  rankHp: [1, .55, .55],   // les PV des héros selon le rang de la bande (1, 2, 3) : aux rangs 2 et 3, plus nombreux et mieux armés, chacun est un peu moins coriace (sinon le rang tranche tout)
  bigBand: 12,       // un héros de plus dans la bande quand le château compte autant de créatures
  rooms: [2, 2, 3, 3],   // les pièces du parcours, selon le palier (0, 1, 2, 3 et plus), avant le Cœur (avant : 3, 3, 4, 5 ; chaque pièce défendue est un combat, et la bande va au bout)
  trials: 24,        // l’estimation de l’annonce : autant d’invasions jouées d’avance en combat auto, avec tes défenseurs déjà rangés
  fame: .03,         // la notoriété (invFame : la jauge unique, éclat et bouche-à-oreille) attire des héros plus coriaces : fame × notoriété, en niveaux (+0,6 à 20, +3 à 100, +6 à 200)
  rodage: { size: [2, 2], lvl: [8, 11], dK: .6, rooms: [1, 2], crew: 12, hero: 'paysan' },   // les premières invasions de la partie : size héros au plus, niveau lvl au plus (+ dK × le décalage de la difficulté), rooms pièces avant le Cœur ;
                     // la toute première n'est que des villageois (hero, voir INV_VILLAGEOIS) ; ensuite, seulement tant que le château a moins de crew créatures. Les sabotages d'ici là sont aussi doux (pas plus de sbires que de héros)
};
const INV_VILLAGEOIS = ['Jacquot et sa fourche', 'Mathurin et son râteau', 'Berthe et son rouleau à pâtisserie'];   // la toute première bande : des villageois en colère, chacun son outil
const invNum = x => String(x).replace('.', ',');
if (typeof STAT_LABELS !== 'undefined' && STAT_LABELS.guard) STAT_LABELS.guard[1] = `garde (×${invNum(INV_TUNE.trapK)} dégâts au premier héros qui entre)`;   // le texte suit le réglage
const INV_ROOMS = t => INV_TUNE.rooms[Math.max(0, Math.min(INV_TUNE.rooms.length - 1, t || 0))];   // les pièces du parcours selon le palier (puis le Cœur)
// la notoriété qui attire les héros : le seul endroit où le moteur des invasions la lit
const invFame = () => Math.max(0, typeof radiance === 'function' ? radiance() : 0);
// le rodage : le rang de la prochaine invasion de la partie (0 : la toute première), tant qu'elle est encore douce ; -1 ensuite (plan : celui des sbires d'un sabotage, qui ne compte pas comme une invasion)
const invRodage = plan => { const R = INV_TUNE.rodage, k = (S && S.stats && S.stats.invasions) || 0, sab = !!(plan && plan.party && plan.party.some(h => h.minion)); return k < R.size.length && (S.creatures.length < R.crew || (k === 0 && !sab)) ? k : -1; };
// ce que l'annonce en dit, une fois la bande tirée (rien pour les sbires)
const invRodageText = plan => { if (!plan || !plan.party || !plan.party.length || plan.party.some(h => h.minion)) return ''; const n = plan.party.length, one = n === 1;
  if (plan.rodage === 0) return `${one ? 'Un villageois' : `${['', '', 'Deux', 'Trois', 'Quatre'][n] || n} villageois`} en colère pour commencer : ${invAnd(plan.party.map(h => h.name))}, ${one ? 'venu' : 'venus'} du village « voir ce qui se passe au château ». ${one ? 'Il n’est' : 'Ils ne sont'} pas bien ${one ? 'méchant' : 'méchants'} : tes créatures en viennent à bout si elles jouent bien leurs cartes (une Esquive ou une Parade quand un coup s’annonce, des Frappes le reste du temps). Les bandes suivantes grossiront avec ton château… et avec ta notoriété.`;
  return plan.rodage === 1 ? `Le bouche-à-oreille fait son œuvre : de vrais aventuriers cette fois, mais ils ne sont que ${n}. Les bandes suivantes viendront au complet.` : ''; };
// la bande grandit avec ta notoriété (invFame), et un peu avec le château : ton palier, le nombre de tes créatures et la force de tes champions (le niveau des expéditions), sans marche brutale
const invLevelParts = plan => { const T = INV_TUNE, n = Math.min(T.crewCap, S.creatures.length), cl = crawlLevel();
  const crus = !!(plan.crusade || (plan.origin && plan.origin.crusade));   // la croisade a sa propre marche (crus) : la notoriété n'y ajoute rien
  return { tier: T.tier * (S.tier || 0), crew: T.crew * n, champ: T.champ * Math.max(0, cl - 1), fame: crus ? 0 : T.fame * invFame(), rank: T.rank * ((plan.rank || 1) - 1), crus: crus ? T.crus : 0 }; };
// la difficulté de la partie (menu) : d décale le niveau de base des bandes (Normal = INV_TUNE.lvl), x celui des donjons d'expédition, amb multiplie l'Ambre qu'on y trouve (AMBER_GAIN, p35)
const INV_DIFFS = { facile: { name: 'Facile', ico: '🌱', d: -4, x: -3, amb: 1 }, normal: { name: 'Normal', ico: '⚔️', d: 0, x: -1.4, amb: 1 }, difficile: { name: 'Difficile', ico: '🔥', d: 2.5, x: .5, amb: 1.25 }, legende: { name: 'Légende', ico: '💀', d: 5, x: 2, amb: 1.5 } };
const DIFF_ORDER = ['facile', 'normal', 'difficile', 'legende'];
const diffLowKey = () => (typeof S !== 'undefined' && S && S.stats && S.stats.diffLow) || (S && S.opts && S.opts.diff) || 'normal';   // la plus basse difficulté jouée dans la partie (ce que retiennent le Panthéon et le palmarès)
const diffBadge = k => k && INV_DIFFS[k] ? ` <span class="dbadge" title="Difficulté : ${INV_DIFFS[k].name}">${INV_DIFFS[k].ico}</span>` : '';
const invDiff = () => INV_DIFFS[(typeof S !== 'undefined' && S && S.opts && S.opts.diff) || 'normal'] || INV_DIFFS.normal;
const invLevel = plan => { const P = invLevelParts(plan), T = INV_TUNE, lo = T.lvlMin || 1, k = P.crus ? -1 : invRodage(plan); let v = Math.max(lo, T.lvl + invDiff().d + P.tier + P.crew + P.champ + P.fame + P.rank + P.crus);
  if (k >= 0) v = Math.min(v, Math.max(lo, T.rodage.lvl[k] + T.rodage.dK * invDiff().d));   // le rodage : jamais plus fort que la bande ordinaire
  return Math.round(v * 10) / 10; };
const invPower = c => { const p = crawler(c); return p.hp * p.atk; };
const invRoomOf = id => S.rooms.find(o => o.id === id);
// les pièces que la bande peut traverser (une grande salle compte une fois)
function invCandidates() {
  const seen = new Set(), out = [];
  builtRooms().forEach(r => { if (!guardable(r) || isHall(r)) return; const g = groupOf(r).rooms[0]; if (seen.has(g.id)) return; seen.add(g.id); out.push(g); });
  return out;
}
// l'ancienne règle des gardes postés (c.guard) : gardée pour les vieux appels, elle ne décide plus de la défense (voir invLineup) ; le poste de travail (c.post) non plus
const invGuards = r => r ? guardsOfRoom(r).filter(fitToFight).sort((a, b) => invPower(b) - invPower(a)).slice(0, INV_TUNE.roomCap) : [];
// qui défendrait le Cœur ce soir (un aperçu : les plus fortes des créatures reposées)
const invHeartCrew = () => { try { const L = invLineup({ route: (S.rooms.filter(r => r.built && r.t !== 'coeur').slice(0, (INV_TUNE.rooms || [])[Math.min(3, S.tier || 0)] || 2).map(r => r.id)).concat((S.rooms.find(r => r.t === 'coeur') || {}).id) }); return L.heart.map(id => S.creatures.find(c => c.id === id)).filter(Boolean); } catch (e) { return invHeartPick(S.creatures.filter(fitToFight).sort((a, b) => invPower(a) - invPower(b))); } };   // ce que donnerait le rangement, sur un parcours type
// le parcours : N pièces au hasard, puis le Cœur (la montée en force vient des paliers de défenseurs, pas de l'ordre des pièces)
function invRoute() {
  const k = invRodage(), pool = shuffle(invCandidates()).slice(0, k >= 0 ? Math.min(INV_ROOMS(S.tier || 0), INV_TUNE.rodage.rooms[k]) : INV_ROOMS(S.tier || 0));
  const h = heartRoom(); return [...pool.map(r => r.id), ...(h ? [h.id] : [])];
}

/* ---------- les défenseurs : rangés de la plus faible à la plus forte, sans hasard ---------- */
// la fatigue des raids et des expéditions : épuisée (FAT_TIRED, 4), une créature se repose et ne défend pas
const invFatMax = () => (typeof FAT_TIRED !== 'undefined' ? FAT_TIRED : 4);
const invTired = c => (c.fat || 0) >= invFatMax();
const invHeartN = () => INV_TUNE.heartCap + (typeof craftRank === 'function' && craftRank('guet') >= 3 ? 1 : 0);
// les places d'une pièce : teamMax, +1 avec un Corps de garde bâti, +1 si un Poste de garde borde la pièce, +1 avec le chemin de ronde (roomCap au plus)
const invHasPost = r => !!r && invTrapsNear(r).some(d => DEFS[d.t] && DEFS[d.t].post);
const invSeats = r => Math.min(INV_TUNE.roomCap, INV_TUNE.teamMax + (builtCount('garde') > 0 ? 1 : 0) + (invHasPost(r) ? 1 : 0) + (typeof craftRank === 'function' && craftRank('guet') >= 2 ? INV_TUNE.ronde : 0));
// le Cœur : les plus fortes parmi les reposées ; une épuisée n'y va que s'il ne reste personne d'autre (pool trié du plus faible au plus fort)
function invHeartPick(pool) {
  const n = invHeartN(), rested = pool.filter(c => !invTired(c));
  return (rested.length ? rested : pool).slice(-n).reverse();
}
// le rangement : d’abord une créature par pièce (les plus faibles dans les premières), la plus forte au Cœur ; s’il en reste, le Cœur se renforce (invHeartN au plus), puis les pièces (invSeats) ; le reste, les plus faibles, à l’abri
function invLineup(I) {
  const pool = S.creatures.filter(fitToFight).sort((a, b) => invPower(a) - invPower(b) || (a.id < b.id ? -1 : 1)), rested = pool.filter(c => !invTired(c));
  const slots = I.route.map((id, k) => [id, k]).filter(([id]) => { const r = invRoomOf(id); return r && r.t !== 'coeur'; }), seats = slots.map(([id]) => invSeats(invRoomOf(id)));
  if (!rested.length) return { rooms: I.route.map(() => []), heart: pool.slice(-1).map(c => c.id), spare: [] };   // tout le monde est épuisé : la plus forte tient le Cœur quand même
  const n = rested.length, one = Math.min(slots.length, n - 1), hN = 1 + Math.min(invHeartN() - 1, n - 1 - one), extra = Math.min(seats.reduce((a, s) => a + s, 0) - one, n - hN - one);
  const heart = rested.slice(n - hN).reverse(), on = rested.slice(n - hN - one - extra, n - hN);   // ceux qui défendent les pièces, du plus faible au plus fort
  const cnt = slots.map((_, j) => j < one ? 1 : 0); let left = extra;
  for (let j = 0; left > 0 && j < slots.length * 4; j++) { const k = j % slots.length; if (cnt[k] && cnt[k] < seats[k]) { cnt[k]++; left--; } }
  const rooms = I.route.map(() => []); let p = 0;
  slots.forEach(([, k], j) => { rooms[k] = on.slice(p, p + cnt[j]).map(c => c.id); p += cnt[j]; });
  return { rooms, heart: heart.map(c => c.id), spare: rested.slice(0, n - hN - one - extra).map(c => c.id) };
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
  const I = { plan, lvl: invLevel(plan), route: plan.route || invRoute(), idx: 0, ev: [], guardHit: new Set(), bag: { g: 0, s: 0, items: [] }, pow: 0, looted: 0, fights: 0, rec: [], tired: S.creatures.filter(c => fitToFight(c) && invTired(c)).map(c => c.name), meal: !!(S.meal && (S.meal.hp || S.meal.atk || S.meal.tok)), away: S.creatures.filter(c => c.raid || c.away).map(c => c.name), sprung: new Set(), disarmed: false, out: null, lines: [], hurt: new Set(), fought: new Set(), kos: {}, log: [] };
  I.foes = plan.party.map((h, i) => { const k = CRAWL_EN['h_' + h.k] ? 'h_' + h.k : 'h_paysan', f = crawlFoe(k, 1, i, I.lvl, 1); f.name = String(h.name || f.name).replace(/ de légende$/, ''); f.j = i; if (S.world && S.world.decoy) { f.hp = f.max = Math.max(1, Math.round(f.hp * .75)); } return f; });
  const rh = (INV_TUNE.rankHp || [])[Math.min(3, Math.max(1, plan.rank || 1)) - 1] || 1; if (rh !== 1) I.foes.forEach(f => { f.hp = f.max = Math.max(1, Math.round(f.hp * rh)); });
  I.lineup = invLineup(I); I.g0 = I.lineup.rooms.filter(l => l.length).length; I.h0 = I.lineup.heart.length;
  return I;
}
const invUp = I => I.foes.filter(f => f.hp > 0);
const invDown = I => !invUp(I).length;   // plus un héros debout : la bande est repoussée (elle ne fuit plus)
// les héros présents dans la pièce en cours : sans celui que le Sphinx a retenu (f.lag : l'index de la pièce qu'il manque), sauf s'il est le dernier debout
const invHere = I => { const up = invUp(I), h = up.filter(f => f.lag !== I.idx); return h.length ? h : up; };
// qui défend une pièce : les créatures rangées là (au Cœur, ses défenseuses), encore aptes et pas K.O. dans cette invasion
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
function invFoesForFight(I) { const up = invHere(I); up.forEach(f => { f.block = 0; f.st = f.stunNext ? { stun: 1 } : {}; f.stunNext = 0; f.buff = I.pow; f.ai = Math.floor(Math.random() * CRAWL_EN[f.k].acts.length); }); return up; }
// dans le combat : la bande ne fuit jamais. Un héros à terre dans une pièce : elle renonce à la piller (la pièce tient) et passe à la suivante,
// sans ses blessés ; tous ses héros à terre : elle est repoussée. Un combat trop long : elle force le passage (en avant, jamais en arrière)
function invHook(I, B, heart) {
  const ko0 = I.koF = I.foes.filter(f => f.hp <= 0).length;
  const chk = B.check; B.check = () => { if (!B.over && !heart && invUp(I).length && INV_TUNE.hold && INV_TUNE.holdStop && I.foes.filter(f => f.hp <= 0).length > ko0) B.over = 'held'; return chk(); };   // au Cœur, la bande se bat jusqu'au bout
  const st = B.startTurn; B.startTurn = () => { st(); if (!B.over && B.turn > INV_TUNE.turns) B.over = 'push'; };
}
function invAfterFight(I, info, R, res) {
  if (!info.heart && INV_TUNE.hold && res !== 'won' && res !== 'held' && I.foes.filter(f => f.hp <= 0).length > (I.koF || 0)) res = 'held';   // un héros est tombé pendant le combat : la pièce tient, même si ses défenseurs finissent à terre
  if (res === 'won' && !info.heart && invUp(I).length) res = 'held';   // ceux de la pièce sont à terre, mais le héros resté à la traîne (Sphinx) rattrape la bande : la pièce tient
  I.res = res; I.fights++; { const rc = invRec(I, info); rc.kind = 'fight'; rc.def = info.def.map(c => c.name); rc.res = res; rc.koH = I.foes.filter(f => f.hp <= 0 && !f.koSeen).length; rc.koD = R.party.filter(p => p.ko).length; if (info.heart) { rc.hpIn = I.heartHp; rc.powIn = I.pow; } }
  const ko = I.foes.filter(f => f.hp <= 0 && !f.koSeen); ko.forEach(f => { f.koSeen = true; const p = pick(R.party.filter(x => !x.ko)) || pick(R.party); if (p && critter(p.id)) I.kos[p.id] = (I.kos[p.id] || 0) + 1; }); I.log.push({ heart: info.heart, n: info.def.length, res, pow: I.pow });
  R.party.forEach(p => { I.fought.add(p.id); if (p.ko && res !== 'won') I.hurt.add(p.id); });
  if (res === 'won') { I.out = 'repelled'; return [['🛡️', `Dans ${info.name}, ${info.def.map(c => c.name).join(', ')} ${info.def.length > 1 ? 'mettent' : 'met'} à terre le dernier héros debout : la bande est repoussée !`, 'good']]; }
  if (res === 'held') { const n = info.def.length > 1, down = R.party.every(p => p.ko); return [['🛡️', `${info.def.map(c => c.name).join(', ')} ${down ? `${n ? 'tombent' : 'tombe'}, mais ${n ? 'tiennent' : 'tient'}` : n ? 'tiennent' : 'tient'} ${info.name} : un héros reste à terre, la bande renonce à la piller et file vers la pièce suivante.`, 'good']]; }
  if (info.heart) { I.out = 'robbed'; return [['💔', 'Le Cœur tombe : la bande se sert.', 'bad']]; }
  const L = invLoot(I, info, res === 'push' ? .5 : 1); invRec(I, info).loot = L;
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
  const out = [], hp0 = invHpLeft(I), ko0 = invUp(I).length;
  invTrapsNear(info.r).forEach(d => {
    const D = DEFS[d.t]; if (!D || I.out || I.sprung.has(d.id) || !D.str) return; I.sprung.add(d.id);
    const up = invHere(I); if (!up.length) return;
    if (!I.disarmed && D.kind === 'piège' && (I.nemDis || up.some(f => f.k === 'h_voleuse'))) { I.disarmed = true; out.push(['🗝️', `${I.nemDis ? 'Le héros némésis' : 'La voleuse'} désamorce ${D.name}.`, '']); return; }
    const dmgOf = f => Math.max(1, Math.round(defStr(d) * INV_TUNE.trapK * (f.k === 'h_barbare' && D.kind === 'verrou' ? .5 : 1)));
    if (D.spring) {   // le Plancher à ressort : toute la bande part dans les douves
      const hits = up.map(f => { const dmg = dmgOf(f); f.hp = Math.max(0, f.hp - dmg); return { f, dmg }; }); I.ev.push({ k: 'trap', t: d.t, id: d.id, hits: hits.map(h => ({ ko: h.f.hp <= 0 })) });
      out.push(['🪤', `Boing ! ${D.name} envoie toute la bande dans les douves : ${hits.map(h => `−${h.dmg} PV à ${h.f.name}${h.f.hp <= 0 ? ' (K.O. !)' : ''}`).join(', ')}.`, 'good']); return;
    }
    const f = pick(up), dmg = dmgOf(f);
    f.hp = Math.max(0, f.hp - dmg); if (D.sticky) f.stunNext = 1; I.ev.push({ k: 'trap', t: d.t, id: d.id, hits: [{ ko: f.hp <= 0 }] });
    out.push(['🪤', `${D.name} : −${dmg} PV à ${f.name}${f.hp <= 0 ? ' (K.O. !)' : D.sticky ? ' (il reste à terre : il perdra son premier tour)' : ''}.`, 'good']);
    if (D.bait) { const rest = invUp(I); rest.forEach(x => { x.stunNext = 1; }); if (rest.length) out.push(['💰', rest.length > 1 ? 'La bande se dispute le faux butin : tous ses héros perdront leur premier tour au prochain combat.' : `${rest[0].name} s’attarde sur le faux butin : il perdra son premier tour au prochain combat.`, 'good']); }
    if (D.lag && f.hp > 0) {   // le Sphinx : un héros reste planté devant l'énigme et manque la pièce suivante (au Cœur, ou s'il est seul : son premier tour)
      const nx = invRoomOf(I.route[I.idx + 1]), alone = invUp(I).length < 2;
      if (nx && nx.t !== 'coeur' && !alone) { f.lag = I.idx + 1; out.push(['🗿', `${f.name} reste planté devant l’énigme du Sphinx : la bande passe la pièce suivante sans lui.`, 'good']); }
      else { f.stunNext = 1; out.push(['🗿', `${f.name} cherche encore la réponse de l’énigme : il perdra son premier tour au prochain combat.`, 'good']); }
    }
  });
  // la garde de la pièce et de ses meubles (Corps de garde, armure, râtelier…) : un coup au premier héros qui entre
  const gs = groupOf(info.r).rooms.reduce((a, o) => a + (rstat(o, 'guard') || 0), 0), up2 = invHere(I);
  if (gs > 0 && up2.length && !I.out && !I.guardHit.has(info.r.id)) { I.guardHit.add(info.r.id); const f = up2[0], dmg = Math.round(gs * INV_TUNE.trapK); f.hp = Math.max(0, f.hp - dmg); out.push(['🛡️', `${info.name.charAt(0).toUpperCase() + info.name.slice(1)} se défend : −${dmg} PV à ${f.name}${f.hp <= 0 ? ' (K.O. !)' : ''}.`, 'good']); }
  if (!I.out && invDown(I)) { I.out = 'repelled'; out.push(['🛡️', 'Plus un héros debout : la bande est repoussée !', 'good']); }
  if (out.length) { const rc = invRec(I, info); rc.trapD = hp0 - invHpLeft(I); rc.trapKO = ko0 - invUp(I).length; rc.trapN = out.filter(l => l[0] === '🪤').length; rc.disarm = out.some(l => l[0] === '🗝️'); rc.guard = out.some(l => l[0] === '🛡️' && /se défend/.test(l[1])); if (I.out) rc.end = I.out; }
  return out;
}
// une pièce sans défenseurs : une rencontre. Une ou deux créatures qui ne défendent rien (épuisées, ou restées à l'abri) croisent la bande,
// au hasard (leur poste n'y est pour rien), et agissent à leur idée (caractère, loyauté, humeur) ; chacune n'en croise qu'une par invasion
function invEvent(I, info) {
  const away = new Set(I.lineup ? [...I.lineup.heart, ...I.lineup.rooms.flat()] : []), met = I.met || (I.met = new Set());   // une défenseuse est à son poste de combat
  const out = [], crew = shuffle(S.creatures.filter(c => fitToFight(c) && !away.has(c.id) && !met.has(c.id))).slice(0, INV_TUNE.evN);
  crew.forEach(c => met.add(c.id));
  let k = 1, hidden = false;
  crew.forEach(c => {
    if (I.out) return; const has = t => (c.pers || []).includes(t), loy = c.loy || 0;
    if (has('marmotte') && Math.random() < .5) { out.push(['💤', `${c.name} dort à poings fermés et ne voit rien passer.`, '']); return; }
    if (loy < 25 && Math.random() < .4) { k += .5; out.push(['😒', `${c.name} regarde ailleurs… et leur montre même où est rangé l’or.`, 'bad']); return; }
    if (has('radin') && !hidden) { hidden = true; out.push(['🪙', `${c.name} cache l’or sous son matelas.`, 'good']); }
    const p = Math.min(.75, INV_TUNE.evP + loy / 300 + ((c.mood || 0) - 2) * .05 + (has('farceur') ? .2 : 0) + (has('curieux') || has('maniaque') ? .06 : 0) - (has('solitaire') ? .1 : 0));
    const up = invHere(I); if (!up.length) return;
    if (Math.random() < p) {
      const f = pick(up), d = Math.round((INV_TUNE.evD + guardOf(c)) * (has('bagarreur') ? 1.5 : 1));
      f.hp = Math.max(0, f.hp - d); I.fought.add(c.id);
      out.push(['🪤', `${c.name} ${has('bagarreur') ? 'leur tombe dessus à bras raccourcis' : has('farceur') ? 'leur joue un tour de sa façon' : 'leur tend un piège de fortune'} : −${d} PV à ${f.name}${f.hp <= 0 ? ' (K.O. !)' : ''}.`, 'good']);
    } else out.push(['🫣', `${c.name} se cache et les laisse passer.`, '']);
  });
  if (!crew.length) out.push(['👀', `Personne dans ${info.name} : la bande fouille tranquillement.`, '']);
  { const rc = invRec(I, info); rc.kind = 'event'; rc.ev = out.slice(); }
  if (!I.out && invDown(I)) { I.out = 'repelled'; out.push(['🛡️', 'Plus un héros debout : la bande est repoussée !', 'good']); invRec(I, info).end = 'repelled'; return out; }
  if (I.out) { invRec(I, info).end = I.out; return out; }
  const L = invLoot(I, { ...info, half: hidden }, k); invRec(I, info).loot = L; out.push(['🎒', `${info.name.charAt(0).toUpperCase() + info.name.slice(1)} est pillé·e. ${invLootText(L)}`, 'bad']);
  return out;
}
// une pièce, sans écran : pièges, puis combat (joué par l'ordinateur) ou rencontre
function invRoomAuto(I, info) {
  I.lines.push(...invTraps(I, info)); if (I.out) return;
  if (info.def.length) {
    if (info.heart) I.heartHp = invHpLeft(I);
    const R = invFightR(I, info), B = crawlBattle(R, invFoesForFight(I)); invHook(I, B, info.heart);
    for (let g = 0; g < 60 && !B.over; g++) { B.startTurn(); if (B.over) break; crawlAutoTurn(B); if (B.over) break; B.endTurn(); B.enemyTurn(); }
    I.lines.push(...invAfterFight(I, info, R, B.over || 'push'));
  } else if (info.heart) { I.out = 'robbed'; I.heartHp = invHpLeft(I); invRec(I, info).kind = 'empty'; I.lines.push(['💔', 'Personne pour défendre le Cœur : la bande se sert.', 'bad']); }
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

/* ---------- le carnet de l'invasion, et son résumé (écran de fin, chronique, ligne de commande) ---------- */
const invHpLeft = I => I.foes.reduce((a, f) => a + Math.max(0, f.hp), 0);
const invHpMax = I => I.foes.reduce((a, f) => a + f.max, 0);
// ce qui s'est passé dans la pièce en cours : pièges, combat ou rencontre, butin
function invRec(I, info) { const k = I.idx, L = I.rec || (I.rec = []); return L[k] || (L[k] = { k, name: info.name, heart: !!info.heart, kind: 'event', def: [], res: null, loot: null, ev: [] }); }
const invAnd = l => l.length > 1 ? l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1] : l[0] || '';
const invCap = t => t.charAt(0).toUpperCase() + t.slice(1);
const invLootBits = L => !L ? '' : [L.g && `${L.g} 💰`, L.s && `${L.s} 🪵`, L.item && FURN[L.item.t] && FURN[L.item.t].name].filter(Boolean).join(', ');
// une ligne par pièce, puis les défenseurs, le bilan et, si le Cœur est tombé, pourquoi
function invSummary(I, outcome) {
  const out = [], rec = (I.rec || []).filter(Boolean), out0 = outcome || I.out;
  rec.forEach((rc, i) => {
    const bits = [];
    if (rc.trapN) bits.push(`🪤 ${rc.trapN > 1 ? rc.trapN + ' pièges' : 'un piège'} : −${rc.trapD} PV${rc.trapKO ? `, ${rc.trapKO} héros K.O.` : ''}`);
    else if (rc.guard && rc.trapD) bits.push(`🛡️ la pièce se défend : −${rc.trapD} PV`);
    if (rc.disarm) bits.push('🗝️ un piège désamorcé');
    if (rc.kind === 'fight') {
      const who = invAnd(rc.def);
      bits.push(`⚔️ ${who} : ${rc.res === 'won' ? 'le dernier héros tombe, la bande est repoussée' : rc.res === 'held' ? `la pièce tient (${rc.koH || 1} héros à terre)` : rc.heart ? 'le Cœur tombe' : rc.res === 'push' ? 'le combat s’éternise, la bande force le passage' : `${rc.def.length > 1 ? 'tombent' : 'tombe'}${rc.koH ? ` (${rc.koH} héros à terre)` : ''}`}`);
    } else if (rc.kind === 'empty') bits.push('personne pour le défendre');
    else if (!rc.trapN || rc.loot || rc.ev.length) { const acts = rc.ev.filter(l => l[0] !== '👀' && l[0] !== '🛡️').map(l => l[1].replace(/\.$/, '')); bits.push(acts.length ? `👀 rencontre : ${acts.slice(0, 2).join(' ; ')}` : '👀 personne pour la défendre, la bande fouille'); }
    if (rc.end === 'repelled' && rc.kind !== 'fight') bits.push('plus un héros debout, la bande est repoussée');
    if (rc.loot && invLootBits(rc.loot)) bits.push(`pillée : ${invLootBits(rc.loot)}`);
    out.push([rc.heart ? '❤️' : '▫️', `${rc.heart ? 'Le Cœur' : `${i + 1}. ${invCap(rc.name)}`} — ${bits.join(' ; ') || 'rien à signaler'}.`, rc.heart && out0 === 'robbed' ? 'bad' : rc.kind === 'fight' && rc.res !== 'won' && rc.res !== 'held' ? 'bad' : '']);
  });
  const fought = [...I.fought].map(critter).filter(Boolean).map(c => c.name);
  out.push(['🛡️', `Défenseurs : ${fought.length ? `${fought.length} créature${fought.length > 1 ? 's' : ''} ${fought.length > 1 ? 'se sont battues' : 's’est battue'} (${invAnd(fought.slice(0, 8))}${fought.length > 8 ? '…' : ''})` : 'personne ne s’est battu'}${I.tired && I.tired.length ? ` ; épuisée${I.tired.length > 1 ? 's' : ''}, ${invAnd(I.tired.slice(0, 5))} ${I.tired.length > 1 ? 'se reposaient' : 'se reposait'}` : ''}.`, '']);
  const nf = rec.filter(r => r.kind === 'fight').length, ne = rec.filter(r => r.kind === 'event' && r.ev.length).length, down = I.foes.filter(f => f.hp <= 0).length;
  out.push(['📋', `Bilan : ${nf} combat${nf > 1 ? 's' : ''} aux cartes, ${ne} rencontre${ne > 1 ? 's' : ''}, ${I.looted} pièce${I.looted > 1 ? 's' : ''} pillée${I.looted > 1 ? 's' : ''}, ${down} héros à terre sur ${I.foes.length}${invLootBits({ g: I.bag.g, s: I.bag.s }) ? ` ; leur sac : ${invLootBits({ g: I.bag.g, s: I.bag.s })}${I.bag.items.length ? `, ${I.bag.items.length} meuble${I.bag.items.length > 1 ? 's' : ''}` : ''} (${out0 === 'robbed' ? 'perdu' : 'repris'})` : ''}.`, out0 === 'robbed' ? 'bad' : 'good']);
  if (out0 === 'robbed') { const why = invWhy(I); if (why.length) out.push(['❓', `Pourquoi c’est perdu : ${why.join(' ; ')}.`, 'bad']); }
  return out;
}
// les raisons d'un Cœur pillé, de la plus parlante à la moins parlante (trois au plus)
function invWhy(I) {
  const out = [], h = (I.rec || []).find(r => r && r.heart), hp = I.heartHp != null ? I.heartHp : invHpLeft(I), mx = invHpMax(I) || 1;
  if (!h || h.kind === 'empty') out.push('personne n’a pu défendre le Cœur (épuisées, sonnées ou parties)');
  else out.push(`la bande est arrivée au Cœur avec ${Math.round(100 * hp / mx)} % de ses PV${h.powIn ? ` et +${h.powIn} à ses coups (${h.powIn} pièce${h.powIn > 1 ? 's' : ''} pillée${h.powIn > 1 ? 's' : ''} en chemin)` : ''}`);
  if (I.tired && I.tired.length) out.push(`${I.tired.length} créature${I.tired.length > 1 ? 's' : ''} épuisée${I.tired.length > 1 ? 's' : ''} n’${I.tired.length > 1 ? 'ont' : 'a'} pas défendu`);
  { const bare = I.lineup ? I.route.filter((id, k) => { const r = invRoomOf(id); return r && r.t !== 'coeur' && !(I.lineup.rooms[k] || []).length; }).length : 0; if (bare) out.push(`${bare > 1 ? `${bare} pièces` : 'une pièce'} du parcours sans défenseur (pas assez de créatures reposées)`); }
  if (I.away && I.away.length) out.push(`${invAnd(I.away.slice(0, 4))}${I.away.length > 4 ? '…' : ''} ${I.away.length > 1 ? 'étaient parties' : 'était partie'} (raid, expédition ou mission)`);
  const bare = I.route.map(invRoomOf).filter(r => r && r.t !== 'coeur' && !invTrapsNear(r).some(d => DEFS[d.t] && DEFS[d.t].str));
  if (bare.length) out.push(`aucun piège ne bordait ${bare.length > 1 ? `${bare.length} des ${I.route.length - 1} pièces` : 'une des pièces'} du parcours`);
  if (h && h.kind === 'fight' && out.length < 3 && !I.meal && invMealsReady().length) out.push(`pas de repas de veille pour les défenseurs (${invMealsReady().map(k => RECIPES[k].name).join(', ')} : de quoi cuisiner)`);
  return out.slice(0, 3);
}

/* ---------- avant l'assaut : l'estimation, la force des deux camps, des conseils ---------- */
// des invasions jouées d'avance en combat auto, avec les défenseurs déjà rangés (rien ne bouge au château)
function invForecast(plan, I, n = INV_TUNE.trials) {
  const o = { repelled: 0, lost: 0, robbed: 0, n: 0, fights: 0 }, rnd = Math.random;
  try {
    for (let i = 0; i < n; i++) {
      if (typeof oddsRand === 'function') Math.random = oddsRand(7919 * i + 31 * (S.night || 0) + 17);
      const P = { ...plan, I: null, res: null, party: plan.party.map(h => ({ ...h })), route: (I ? I.route : plan.route || []).slice() }, T = invNew(P);
      if (I && I.lineup) { T.lineup = I.lineup; T.g0 = I.g0; T.h0 = I.h0; }
      for (; T.idx < T.route.length && !T.out; T.idx++) { const info = invInfo(T, T.route[T.idx]); if (info.r) invRoomAuto(T, info); }
      o[T.out || 'robbed']++; o.n++; o.fights += T.fights;
    }
  } catch (e) { o.err = String(e); } finally { Math.random = rnd; }
  o.rob = o.n ? o.robbed / o.n : 0;
  return o;
}
const invRiskWord = p => p < .08 ? 'faible' : p < .2 ? 'réel' : p < .4 ? 'sérieux' : 'grand';
// la force des deux camps : la bande (PV, coups), tes défenseurs du Cœur et des pièces
function invBalance(I) {
  const hit = f => { const a = CRAWL_EN[f.k].acts.filter(x => x[1] && x[0] !== 'block' && x[0] !== 'heal'); return (a.length ? a.reduce((s, x) => s + x[1] * (x[0] === 'multi' ? x[2] || 2 : 1), 0) / a.length : 4) + (f.plus || 0); };
  const h = I.route.map(id => invInfo(I, id)).find(x => x.heart), heart = h ? h.def.map(c => { try { return crawler(c); } catch (e) { return { hp: 10, atk: 2 }; } }) : [];
  return { band: { n: I.foes.length, hp: invHpLeft(I), hit: Math.round(I.foes.reduce((s, f) => s + hit(f), 0) / Math.max(1, I.foes.length)) }, heart: { names: h ? h.def.map(c => c.name) : [], hp: heart.reduce((s, p) => s + p.hp, 0), atk: heart.length ? Math.round(heart.reduce((s, p) => s + p.atk, 0) / heart.length * 10) / 10 : 0 },
    rooms: I.lineup ? I.lineup.rooms.filter(l => l.length).length : 0, roomsN: I.route.length - 1, defs: I.lineup ? I.lineup.rooms.reduce((s, l) => s + l.length, 0) : 0 };
}
// les leviers à portée de main, du plus utile au moins utile (I : l'invasion annoncée, sinon le château tel qu'il est)
function invAdvice(I, max = 4) {
  const out = [], fit = S.creatures.filter(fitToFight), tired = fit.filter(invTired), hurt = S.creatures.filter(c => !isOut(c) && injured(c));
  if (tired.length) out.push(['😴', `${tired.length} créature${tired.length > 1 ? 's' : ''} épuisée${tired.length > 1 ? 's' : ''} (${invAnd(tired.slice(0, 4).map(c => c.name))}${tired.length > 4 ? '…' : ''}) ne défendr${tired.length > 1 ? 'ont' : 'a'} pas : pas de raid ni d’expédition pour elles la veille d’une invasion.`]);
  { const n = I ? I.route.length - 1 : INV_ROOMS(S.tier || 0), seats = invHeartN() + n * (INV_TUNE.teamMax + (builtCount('garde') > 0 ? 1 : 0)), ready = fit.filter(c => !invTired(c)).length;
    if (ready < seats) out.push(['🛡️', `${ready} créature${ready > 1 ? 's' : ''} prête${ready > 1 ? 's' : ''} à défendre pour environ ${seats} places (le Cœur, puis ${n} pièces) : les dernières pièces du parcours n’auront personne. Plus de créatures, ou moins de fatigue, et chaque pièce a ses défenseurs.`]); }
  if (hurt.length) out.push(['🤕', `${invAnd(hurt.slice(0, 3).map(c => c.name))} ${hurt.length > 1 ? 'sont sonnées' : 'est sonnée'} et ne défendr${hurt.length > 1 ? 'ont' : 'a'} rien cette nuit.`]);
  if (S.raid && S.raid.team && S.raid.team.length) { const t = S.raid.team.map(critter).filter(Boolean); if (t.length) out.push(['🗺️', `Ton ${S.raid.crawl ? 'expédition' : 'raid'} emmène ${invAnd(t.slice(0, 4).map(c => c.name))} : ${t.length > 1 ? 'ils ne défendront' : 'elle ne défendra'} pas le château cette nuit.`]); }
  const rooms = I ? I.route.map(invRoomOf).filter(r => r && r.t !== 'coeur') : invCandidates(), bare = rooms.filter(r => !invTrapsNear(r).some(d => DEFS[d.t] && DEFS[d.t].str));
  if (bare.length) out.push(['🪤', `${I ? 'Sur leur parcours, pas' : 'Pas'} de piège autour ${bare.length > 3 ? `de ${bare.length} pièces sur ${rooms.length}` : `de : ${invAnd(bare.map(r => ROOMS[r.t].name))}`}. Un piège posé dans un couloir qui borde une pièce frappe la bande à l’entrée et donne sa carte au combat.`]);
  if (builtCount('garde') === 0 && S.tier >= 1 && !availability('room', 'garde')) out.push(['🛡️', `Un Corps de garde (${costText(costOf('room', 'garde'))}) : une place de défenseur de plus dans chaque pièce, et le métier du guet pour tes sentinelles.`]);
  { const M = S.meal || {}, ready = invMealsReady(); if (ready.length && !(M.hp || M.atk || M.tok)) out.push(['🍲', `Pas de repas de veille, et de quoi cuisiner : ${ready.map(k => `${RECIPES[k].name} (${{ poisson: '+5 PV aux défenseurs', gateau: '+1 énergie au Cœur', brochettes: '+1 à leurs coups' }[k]})`).join(', ')}.`]); }
  if (!(S.world && S.world.merc > S.night) && typeof SHOPS !== 'undefined' && typeof settlements === 'function') { const t = settlements().find(s => siteKnown(s) && (SHOPS[s.kind] || []).some(sh => sh.items.includes('merco'))); if (t) out.push(['🗡️', `Un mercenaire (taverne de ${t.name}, ${typeof shopPrice === 'function' ? shopPrice(t, 'merco') : 10} 💰) défendrait le Cœur pendant 3 nuits.`]); }
  const sulky = fit.filter(c => (c.mood || 0) <= 1); if (sulky.length >= 2) out.push(['😠', `${sulky.length} créatures boudeuses frappent moins fort (−1) ; ravies (4 cœurs), elles frapperaient plus fort (+1).`]);
  if (typeof craftRank === 'function' && builtCount('labo') && craftRank('labo') < 2) out.push(['⚗️', 'Les alchimistes du Labo (rang 2) ajoutent une Brume soporifique à chaque combat d’invasion.']);
  return out.slice(0, max);
}
// les repas de veille qu'on peut cuisiner tout de suite
const invMealsReady = () => typeof RECIPES === 'undefined' || typeof hasKitchen !== 'function' || !hasKitchen() ? [] : ['poisson', 'gateau', 'brochettes'].filter(k => RECIPES[k] && canCook(k));
// la rançon : jamais contre la croisade de Mirebrume (la finale de la Légende se combat)
const invRansomBan = plan => plan && (plan.crusade || (plan.origin && plan.origin.crusade)) ? 'Les croisés de Mirebrume ne se vendent pas : la croisade se combat.' : '';

/* ---------- la bande : plus de chemin ni de but, le Cœur au bout des pièces ---------- */
// la taille de la bande suit le château : un héros de plus au palier 1, et un autre quand le château compte une douzaine de créatures
// (avant : dès 80 de notoriété, même dans un château presque vide)
const partyPreviewInv = partyPreview;
partyPreview = function () { const p = partyPreviewInv(), o = p.origin, rank = p.rank || 1, k = o && o.crusade ? -1 : invRodage(); p.size = Math.min(5, 1 + rank + (S.tier >= 1 ? 1 : 0) + (S.creatures.length >= INV_TUNE.bigBand ? 1 : 0)); if (k >= 0) { p.size = Math.min(p.size, INV_TUNE.rodage.size[k]); p.rodage = k; } return p; };
// le rodage (voir invRodage) : la toute première bande n'est que des villageois (rodage.hero, noms d'INV_VILLAGEOIS) ; les suivantes ne dépassent pas leur taille
planInvasion = function () { const p = planInvasionOuter(); p.goal = { k: 'coeur' }; p.prep = 1; p.v2 = true; p.crusade = !!(p.crusade || (p.origin && p.origin.crusade)); p.route = invRoute();
  const k = p.crusade ? -1 : invRodage(), R = INV_TUNE.rodage;
  if (k >= 0 && p.party.length) { p.rodage = k; p.party = p.party.slice(0, R.size[k]); if (k === 0) { const h = HEROES.find(x => x.k === R.hero) || HEROES[0]; p.party = Array.from({ length: R.size[0] }, (_, i) => ({ ...h, name: INV_VILLAGEOIS[i] || h.name, hp: p.party[0].hp, atk: p.party[0].atk })); p.foe = null; p.qband = null; p.bandName = null; } p.courage = p.party.reduce((a, h) => a + (h.hp || 0), 0); }
  return p; };
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
