
/* =========================================================
   Combats : chaque bande vient avec un but (piller le Cœur,
   vider le trésor, enlever une créature, tout saccager). Tes
   créatures se battent avec leurs talents, les héros visent
   selon leur caractère, et le Cœur peut intervenir pendant la
   bataille (pouvoirs du Cœur). Une bande qui a perdu la moitié
   des siens prend la fuite.
   ========================================================= */
const HERO_FIGHT = {
  paysan:  { hp: 4, atk: 1, sk: 'Fourche', sd: 'Frappe au petit bonheur.', aim: 'random' },
  voleuse: { hp: 5, atk: 2, sk: 'Désamorce', sd: 'Désamorce le premier piège de la route, et achève les créatures amochées.', disarm: 1, aim: 'weak' },
  elfe:    { hp: 5, atk: 2, sk: 'Tir à l’arc', sd: 'Tire avant chaque combat, en visant d’abord les soigneuses.', first: 1, aim: 'healer' },
  mage:    { hp: 4, atk: 3, sk: 'Boule de feu', sd: 'Ses sorts touchent aussi une deuxième créature.', splash: 1, aim: 'weak' },
  paladin: { hp: 8, atk: 2, sk: 'Soins', sd: 'Après chaque échange, soigne 2 PV au plus amoché de la bande.', heal: 2, aim: 'strong' },
  barbare: { hp: 9, atk: 3, sk: 'Enfonceur', sd: 'Fonce sur la créature la plus forte ; les verrous lui font moitié moins mal.', smash: 1, aim: 'strong' },
};
const HERO_HP_M = { 1: 1, 2: 1.8, 3: 2.6 };   // les héros venus de loin sont plus coriaces
const HURT_NIGHTS = 1;   // une créature K.O. se repose une nuit : ni garde, ni raid
// chaque espèce a son talent de combat
const SP_FIGHT = {
  diablotin:  { sk: 'Esquive', sd: 'Esquive un coup sur quatre.', dodge: .25 },
  gobelin:    { sk: 'Coup bas', sd: '+2 dégâts contre un héros déjà amoché.', low: 2 },
  kobold:     { sk: 'Piège de poche', sd: 'Au début du combat, un piège surprise : 2 dégâts à un héros.', ptrap: 2 },
  crapaud:    { sk: 'Langue collante', sd: 'Au début du combat, colle un héros : il perd son premier coup.', stun1: 1 },
  gargouille: { sk: 'Statue', sd: 'Frappe la première, avant même les flèches.', first: 1 },
  menestrel:  { sk: 'Chanson de guerre', sd: 'Ses alliés frappent +1 pendant le combat.', song: 1 },
  troll:      { sk: 'Gros dur', sd: 'Les héros doivent le frapper d’abord (sauf l’archère et le mage) ; il récupère 1 PV par échange.', taunt: 1, regen: 1 },
  fantome:    { sk: 'Effroi', sd: 'Au début du combat, terrifie le héros le plus fort : il perd son premier coup.', fear: 1 },
  sorciere:   { sk: 'Potion', sd: 'Après chaque échange, soigne 2 PV à la créature la plus amochée.', heal: 2 },
  squelette:  { sk: 'Se relève', sd: 'La première fois qu’il tombe, il se relève avec 2 PV.', rise: 2 },
  orque:      { sk: 'Rage', sd: '+2 dégâts quand il a perdu la moitié de ses PV.', rage: 2 },
  araignee:   { sk: 'Toile', sd: 'Au début du combat, englue un héros : il perd ses deux premiers coups.', stun2: 1 },
  dragonnet:  { sk: 'Souffle', sd: 'Tous les deux échanges, 1 dégât à chaque héros.', breath: 1 },
  mimique:    { sk: 'Embuscade', sd: 'Son premier coup fait double dégât.', ambush: 1 },
  vampire:    { sk: 'Morsure', sd: 'Récupère la moitié des dégâts qu’il inflige.', drain: 1 },
  golem:      { sk: 'Peau de mousse', sd: 'Chaque coup reçu fait 1 dégât de moins.', armor: 1 },
  fee:        { sk: 'Crapaudification', sd: 'Au début du combat, change un héros en crapaud : il perd ses deux premiers coups.', stun2: 1 },
  liche:      { sk: 'Nécromancie', sd: 'Une fois par combat, relève une alliée tombée avec la moitié de ses PV.', necro: 1 },
  harpie:     { sk: 'Cri perçant', sd: 'Au début du combat, 1 dégât à chaque héros.', shriek: 1 },
  cocatrice:  { sk: 'Regard pétrifiant', sd: 'Au début du combat, pétrifie un héros : il perd ses deux premiers coups.', stun2: 1 },
  mandragore: { sk: 'Hurlement', sd: 'Au début du combat, tous les héros frappent 1 de moins.', howl: 1 },
  nixe:       { sk: 'Éclaboussure', sd: 'Ses coups éclaboussent un deuxième héros (1 dégât).', splash: 1 },
  goule:      { sk: 'Dévoreuse', sd: 'Récupère 3 PV quand elle met un héros K.O.', devour: 3 },
  nainsombre: { sk: 'Tête de fer', sd: 'Chaque coup reçu fait 1 dégât de moins (il a gardé son casque de forge).', armor: 1 },
};
// les pouvoirs du Cœur : à lancer pendant la bataille, juste avant un combat
const POWERS = {
  porte:      { ico: '🚪', name: 'Porte claquée', desc: 'Tes défenseurs frappent un échange gratuit avant que la bande réagisse.' },
  eboulement: { ico: '🪨', name: 'Éboulement', desc: '4 dégâts au héros le plus dangereux.' },
  seve:       { ico: '💚', name: 'Sève du Cœur', desc: 'Tes défenseurs gagnent 3 PV et frappent 1 de plus pendant ce combat.' },
  cri:        { ico: '😱', name: 'Cri du Cœur', desc: 'Pendant ce combat, les héros frappent 1 de moins.' },
  cloche:     { ico: '🔔', name: 'Sonner la cloche', desc: 'Les deux créatures disponibles les plus solides accourent se joindre à ce combat (elles ne pourront plus se battre ensuite).' },
  // les savoirs des alchimistes (voir les métiers)
  brume:      { ico: '🌫️', name: 'Brume soporifique', need: ['labo', 2], desc: 'Toute la bande s’assoupit : chaque héros perd son premier coup, et le plus dangereux ses deux premiers.' },
  elixir:     { ico: '⚗️', name: 'Élixir de bravoure', need: ['labo', 3], desc: 'Tes défenseurs gagnent 2 PV et frappent 2 de plus pendant ce combat.' },
};
// un geste du Cœur qu'on a le droit de jouer (ceux des alchimistes demandent leur savoir)
const powerOK = k => { const p = POWERS[k]; return !!p && (!p.need || (typeof craftRank === 'function' && craftRank(p.need[0]) >= p.need[1])); };
// les gestes du Maître pendant la balade de la bande, à tout moment (pas seulement avant un combat)
const STEP_ACTS = {
  or:     { ico: '👛', name: 'Semer de l’or', desc: 'Une bourse au milieu du couloir : souvent, un paysan ou une voleuse la ramasse et rentre chez lui ; sinon, la bande se la dispute et perd du temps.' },
  detour: { ico: '🚪', name: 'Claquer les portes', desc: 'Toutes les portes claquent : la bande se perd quelques pas et perd du temps avant l’aube.' },
};
const orCost = plan => 4 + 3 * (plan.rank || 1);
// l'énergie du Cœur : chaque geste en coûte une ; sans eux, la bande arrive à ses fins
function heartTokens() { return Math.min(4, 2 + Math.floor(S.tier / 2)) + (typeof chantierDone === 'function' && chantierDone('pontlevis') ? 1 : 0); }
const powerCharges = () => heartTokens();
const TACTICS = {
  postes:   { ico: '🛡️', name: 'Tenir les postes', desc: 'Chaque garde défend sa pièce (+1 : il·elle est chez soi) ; les créatures libres défendent ce que la bande vise.' },
  cible:    { ico: '🎯', name: 'Défendre leur cible', desc: 'Toutes les créatures, même postées ou à l’étage, accourent là où ils vont (celles qui viennent de loin arrivent essoufflées : −1). Personne sur la route : ils fouillent toutes les pièces qu’ils traversent, et autour de leur cible il n’y a pas de place pour tout le monde (2 en réserve).' },
  harceler: { ico: '🗡️', name: 'Harceler', desc: 'La moitié des créatures libres leur tend des embuscades en chemin (+1, et elles frappent les premières) ; elles n’arrivent pas à temps pour la défense finale.' },
  rancon:   { ico: '💰', name: 'Acheter leur départ', desc: 'Ils empochent l’or et rentrent chez eux. Ni butin ni gloire.' },
};
const INV_GOALS = {
  coeur:   { ico: '💔', name: 'Piller le Cœur', desc: 'Ils filent droit au Cœur.' },
  tresor:  { ico: '💰', name: 'Vider le trésor', desc: 'Ils visent ta Salle au trésor : s’ils l’atteignent, ils emportent beaucoup d’or.' },
  enlever: { ico: '🪤', name: 'Enlever une créature', desc: 'Ils veulent capturer une de tes créatures et l’emmener au village.' },
  saccage: { ico: '🔥', name: 'Tout saccager', desc: 'Ils veulent casser les meubles d’une pièce.' },
};
const FIGHT_LINES = ['Pas dans MA pièce !', 'On ne court pas dans le château !', 'Je vous préviens, je mords.', 'À l’attaque !', 'Essuyez vos bottes, d’abord !', 'Vous n’avez pas rendez-vous.'];
const KO_LINES = ['Aïe… petite pause.', 'Je… reviens… demain.', 'Ouille. Ouille ouille.', 'Je fais le mort. Enfin, plus que d’habitude.'];

function heroStats(h, rank, bonus) {
  const F = HERO_FIGHT[h.k] || HERO_FIGHT.paysan, m = HERO_HP_M[rank] || 1;
  return { hp: Math.max(1, Math.round(F.hp * m) + bonus), atk: F.atk + (rank - 1) };
}
// une créature au combat : sa garde fait ses PV et sa force ; l'humeur, le caractère et l'espèce comptent
function fighterOf(c, bonus = 0) {
  const g = guardOf(c), hp = 3 + 2 * g + ((c.lvl || 1) - 1), brawl = (c.pers || []).includes('bagarreur') ? 1 : 0;
  return { id: c.id, c, name: c.name, hp, max: hp, A: SP_FIGHT[c.sp] || {}, atk: Math.max(1, 1 + Math.floor(g / 2) + brawl + (c.mood >= 4 ? 1 : 0) - (c.mood <= 1 ? 1 : 0) + bonus) };
}
const ransomCost = plan => plan.party.length * 4 * (plan.rank || 1);
const captiveRansom = c => 6 + 3 * (c.lvl || 1);

/* ---------- le but de la bande, et la route qui y mène ---------- */
const fitToFight = c => !isOut(c) && !injured(c);
const groundRoom = r => !!r && r.built && zOf(r) === 0;
function goalTarget(goal) {
  if (!goal || goal.k === 'coeur') return heartRoom();
  if (goal.k === 'tresor') return S.rooms.find(r => r.t === 'tresor' && groundRoom(r));
  if (goal.k === 'enlever') { const c = critter(goal.c); if (!c) return null; const post = c.post && S.rooms.find(r => r.id === c.post && groundRoom(r) && !isHall(r)); return post || heartRoom(); }
  if (goal.k === 'saccage') return S.rooms.find(r => r.id === goal.room);
  return null;
}
const wreckable = r => S.furn.filter(f => !f.fixed && FURN[f.t] && !FURN[f.t].artefact && groupOf(r).rooms.some(o => inRoomZ(o, f)));
function pickGoal(o = {}) {
  const opts = [['coeur', 45]];
  if (S.rooms.some(r => r.t === 'tresor' && groundRoom(r))) opts.push(['tresor', 25]);
  const prey = S.creatures.filter(c => fitToFight(c) && c.sp !== 'diablotin' && (!c.post || S.rooms.some(r => r.id === c.post && zOf(r) === 0)));
  if (o.kidnap && prey.length) opts.push(['enlever', 20]);
  const wreck = S.rooms.filter(r => groundRoom(r) && !isHall(r) && r.t !== 'coeur' && r.t !== 'porche' && wreckable(r).length >= 2);
  if (wreck.length) opts.push(['saccage', o.wreck || 20]);
  const k = wpick(opts.map(x => x[0]), x => opts.find(y => y[0] === x)[1]), g = { k };
  if (k === 'enlever') { const c = prey.slice().sort((a, b) => (b.lvl || 1) - (a.lvl || 1) || guardOf(b) - guardOf(a))[0]; g.c = c.id; g.label = c.name; }
  else if (k === 'saccage') { const r = pick(wreck); g.room = r.id; g.label = ROOMS[r.t].name; }
  else g.label = k === 'tresor' ? 'la Salle au trésor' : 'le Cœur';
  return g;
}
// le plus court chemin vers une pièce donnée (les barricades le détournent)
function heroPathTo(room, extra) {
  if (!room || room === heartRoom()) return heroRoute(extra);
  return withZ(0, () => {
    const goal = (x, y) => { const r = roomAt(x, y); return r === room || sameGroup(r, room); }, wall = (x, y) => barred(x, y) || (extra && extra[0] === x && extra[1] === y);
    return bfs([GATE.x, GATE.y], goal, (x1, y1, x2, y2) => passable(x1, y1, x2, y2) && !wall(x2, y2)) || (extra ? null : bfs([GATE.x, GATE.y], goal));
  });
}
function encounters(path, target) {
  const out = [], tg = target || heartRoom(), tgRooms = tg ? groupOf(tg).rooms : [], seen = new Set(tgRooms.map(r => r.id));
  (path || []).forEach(([x, y, z], i) => {
    if (i === 0) return;
    const r = roomAt(x, y, z || 0), d = withZ(z || 0, () => defAt(x, y));
    if (d && DEFS[d.t] && !DEFS[d.t].post) { const f = DEFS[d.t]; out.push(f.block ? { i, k: 'smash', defId: d.id, label: f.name } : { i, k: 'def', defId: d.id, t: d.t, label: f.name, dmg: defStr(d) }); return; }
    if (r && isHall(r) && r.t !== 'porche' && !seen.has(r.id) && typeof guardRoomOf === 'function' && S.creatures.some(c => c.guard === r.id && guardRoomOf(c))) { seen.add(r.id); out.push({ i, k: 'room', rooms: [r.id], label: 'Barrage', entry: 0 }); return; }
    if (r && r.t === 'porche' && !seen.has(r.id) && typeof guardRoomOf === 'function' && S.creatures.some(c => c.guard === r.id && guardRoomOf(c))) { seen.add(r.id); out.push({ i, k: 'room', rooms: [r.id], label: 'Le porche', entry: 0 }); return; }
    if (r && !isHall(r) && !seen.has(r.id)) {
      const g = groupOf(r); g.rooms.forEach(o => seen.add(o.id));
      out.push({ i, k: 'room', rooms: g.rooms.map(o => o.id), label: ROOMS[r.t].name + (g.rooms.length >= 2 ? ' (' + sizeWord(g.rooms.length) + ')' : ''), entry: g.rooms.reduce((a, o) => a + rstat(o, 'guard'), 0) });
    }
  });
  if (tg) out.push({ i: path ? path.length - 1 : 0, k: 'goal', heart: tg === heartRoom(), rooms: tgRooms.map(o => o.id), label: tg === heartRoom() ? 'Le Cœur' : ROOMS[tg.t].name, entry: tgRooms.reduce((a, o) => a + rstat(o, 'guard'), 0) });
  return out;
}
// donne un but à la bande et calcule sa route
function assignGoal(p, o = {}) {
  let g = pickGoal(o), tg = goalTarget(g), path = tg ? heroPathTo(tg) : null;
  if (!path || !tg) { g = { k: 'coeur', label: 'le Cœur' }; tg = heartRoom(); path = heroPath(); }
  p.goal = g; p.target = tg ? tg.id : null; p.path = path; p.enc = withZ(0, () => encounters(path, tg));
  return p;
}
function guardsIn(e) { const ids = new Set(e.rooms); return S.creatures.filter(c => fitToFight(c) && ids.has(c.post)); }
// les créatures « libres » : sans poste, ou postées dans une pièce qui n'existe plus
function freeCrew() { const built = new Set(S.rooms.filter(r => r.built).map(r => r.id)); return S.creatures.filter(c => fitToFight(c) && (!c.post || !built.has(c.post))); }
function heartCrew(tactic) { const h = heartRoom(); return S.creatures.filter(c => fitToFight(c) && (tactic === 'cible' || !c.post || (h && c.post === h.id) || !S.rooms.some(r => r.id === c.post && r.built))); }

// la bande : chaque héros reçoit ses PV et sa force (le palier et la notoriété du château les endurcissent), puis un but
const planInvasionBase = planInvasion0;
planInvasion0 = function () {
  const p = planInvasionBase(), glow = typeof radiance === 'function' ? radiance() : 0, n = p.party.length || 1;
  const bonus = Math.round((S.tier * 2 + Math.floor(glow / 12)) / n), decoy = S.world && S.world.decoy ? .75 : 1;
  p.party.forEach(h => { const st = heroStats(h, p.rank || 1, bonus); h.hp = Math.max(1, Math.round(st.hp * decoy)); h.atk = st.atk; });
  p.courage = p.party.reduce((a, h) => a + h.hp, 0);
  assignGoal(p, { kidnap: (p.rank || 1) >= 2 });
  return p;
};
// la bande se prépare contre tes créatures et tes gardes, et en partie contre tes pièges et tes verrous (comptés à 60 %), sans compter
// l'énergie du Cœur : si tu laisses faire, elle réussit près de 9 fois sur 10 ; ce sont tes gestes (et tes pièges) qui la font échouer
const PREP_TARGET = { 1: .95, 2: .96, 3: .96 };
function prepareParty(p, target) {
  if (!p || !p.party.length) return p;
  const base = p.party.map(h => ({ hp: h.hp, atk: h.atk })), tgt = target || PREP_TARGET[p.rank || 1] || .5, N = 16;
  const apply = m => p.party.forEach((h, j) => { h.hp = Math.max(1, Math.round(base[j].hp * m)); h.atk = Math.max(base[j].atk, Math.round(base[j].atk * Math.pow(m, .75))); });
  const fail = m => { apply(m); p.bare = 'half'; let f = 0; try { for (let i = 0; i < N; i++) if (resolveInvasion(p, 'postes', noPower).outcome === 'robbed') f++; } finally { p.bare = false; } return f / N; };
  let m = 1;
  if (fail(1) < tgt) { let lo = 1, hi = 1.6; while (hi < 16 && fail(hi) < tgt) { lo = hi; hi *= 1.6; } for (let k = 0; k < 5; k++) { const mid = (lo + hi) / 2; if (fail(mid) < tgt) lo = mid; else hi = mid; } m = Math.min(16, Math.round((lo + hi) / 2 * 10) / 10); }
  apply(m); p.prep = m; p.courage = p.party.reduce((a, h) => a + h.hp, 0);
  return p;
}
const planInvasionOuter = planInvasion;
planInvasion = function () { return prepareParty(planInvasionOuter()); };
const partyPreviewBase = partyPreview;
partyPreview = function () {
  const p = partyPreviewBase(), glow = typeof radiance === 'function' ? radiance() : 0, avg = p.rank === 1 ? 4.5 : 6.2;
  p.courage = Math.round((p.size * avg * HERO_HP_M[p.rank] + S.tier * 2 + Math.floor(glow / 12)) * (S.world && S.world.decoy ? .75 : 1));
  return p;
};

/* ---------- la bataille, pas à pas : elle s'arrête avant chaque combat pour les pouvoirs du Cœur ---------- */
function newBattle(plan, tactic) {
  const party = plan.party.map((h, j) => ({ j, k: h.k, name: h.name, hp: h.hp, max: h.hp, atk: h.atk, F: h.F || HERO_FIGHT[h.k] || HERO_FIGHT.paysan, ko: false, stun: 0 }));
  return { ev: [], party, outcome: null, stop: 0, fought: [], hurt: [], kos: {}, fallen: [], lines: [], tactic, goal: plan.goal || { k: 'coeur', label: 'le Cœur' }, charges: plan.noPowers ? 0 : heartTokens(), used: [], moments: 0, queue: [], gold: 0 };
}
// ce que la bande fait dans les pièces qu'elle traverse (façon Donjon de Naheulbeuk)
const ROOM_EVENTS = {
  dortoir:   { sk: 'Petite sieste', run: X => { if (Math.random() < .5) { X.all(h => X.heal(h, 2)); X.time(3); return 'La bande fait une petite sieste dans tes lits (+2 PV chacun). Le paladin ronfle.'; } const h = X.any(); X.hurt(h, 1); return `${h.name} se fait mordre par les punaises de lit (−1).`; } },
  cuisine:   { sk: 'Casse-croûte', run: X => { if (Math.random() < .6) { X.all(h => X.heal(h, 2)); X.time(1); return 'Ils dévalisent le garde-manger (+2 PV chacun).'; } const h = X.any(); X.hurt(h, 3); return `${h.name} goûte la soupe du chaudron. Grave erreur (−3).`; } },
  taverne:   { sk: 'Tournée générale', run: X => { X.loot({ g: 2 }); if (Math.random() < .5) { X.all(h => X.buff(h, 1)); return 'Tournée générale ! Courage liquide (+1 en attaque), et 2 💰 piqués dans la caisse.'; } X.all(h => X.stun(h, 1)); X.time(2); return 'Une tournée de trop : ils titubent (chacun perd son prochain coup) et volent 2 💰.'; } },
  potager:   { sk: 'Ravage', run: X => { X.all(h => X.heal(h, 1)); return 'Ils piétinent ton potager en croquant tes carottes (+1 PV chacun).'; } },
  bibli:     { sk: 'Grimoire', run: X => { const h = X.find('mage') || X.any(); X.time(2); if (Math.random() < .5) { X.buff(h, 2); return `${h.name} lit un grimoire et apprend un sort (+2 en attaque).`; } X.hurt(h, 3); return `${h.name} lit un grimoire maudit à voix haute. Aïe (−3).`; } },
  labo:      { sk: 'Potion inconnue', run: X => { const h = X.any(), r = Math.random(); if (r < .3) { X.heal(h, 4); return `${h.name} boit une potion au hasard : délicieuse (+4).`; } if (r < .6) { X.hurt(h, 3); return `${h.name} boit une potion verte. Elle était verte pour une raison (−3).`; } if (r < .8) { X.stun(h, 2); return `${h.name} boit une potion et se change en crapaud pour un moment (perd deux coups).`; } X.buff(h, 2); return `${h.name} boit une potion de force (+2 en attaque).`; } },
  atelier:   { sk: 'Bricolage', run: X => { X.loot({ s: 2 }); if (X.find('barbare') && X.breakOne()) return 'Ils fouillent l’atelier (2 🪵), et le barbare casse un meuble « pour voir ».'; return 'Ils fouillent l’atelier et emportent 2 🪵.'; } },
  forge:     { sk: 'Armes neuves', run: X => { const h = X.any(); X.buff(h, 1); X.loot({ s: 1 }); return `${h.name} aiguise son arme sur ta meule (+1 en attaque) et empoche 1 🪵.`; } },
  tresor:    { sk: 'Le trésor !', run: X => { const v = X.find('voleuse'), g = 4 + 2 * S.tier + (v ? 4 : 0); X.loot({ g }); X.time(2); return `Le trésor ! Ils se remplissent les poches (${g} 💰${v ? ', la voleuse en tête' : ''}).`; } },
  caveau:    { sk: 'La frousse', run: X => { const h = X.find('paysan') || X.weakest(); if (h && Math.random() < .35) { X.flee(h); return `${h.name} entend un cercueil grincer et s’enfuit en hurlant.`; } X.all(o => X.hurt(o, 1)); return 'Un courant d’air glacé dans le Caveau : tout le monde frissonne (−1 chacun).'; } },
  oubliettes:{ sk: 'Les prisonniers', run: X => { if (S.prisoners > 0) { X.loot({ freed: S.prisoners }); return `Ils délivrent ${S.prisoners} prisonnier${S.prisoners > 1 ? 's' : ''} : adieu les rançons.`; } const h = X.any(); X.stun(h, 1); return `${h.name} se penche au-dessus des oubliettes… et tombe dedans. Il faut le repêcher (perd un coup).`; } },
  salon:     { sk: 'Le canapé', run: X => { X.all(h => X.heal(h, 1)); X.time(2); return 'Ils s’affalent dans les fauteuils de velours (+1 PV chacun, une heure de perdue).'; } },
  trone:     { sk: 'Le trône', run: X => { X.all(h => X.hurt(h, 1)); X.time(2); return 'Qui s’assoit sur le trône ? La dispute tourne à la bagarre (−1 chacun).'; } },
  tour:      { sk: 'La vue', run: X => { X.know(.3); return 'Du haut de la tour, ils repèrent enfin le chemin : ils iront plus droit au but.'; } },
  chapelle:  { sk: 'Prière', run: X => { X.all(h => X.heal(h, 2)); return 'Le paladin dit une prière (+2 PV chacun). Personne n’ose demander à qui.'; } },
  _:         { sk: 'Fouille', run: X => { X.loot({ g: 1 }); return 'Ils fouillent la pièce et trouvent 1 💰 sous un tapis.'; } },
};
const NAHEUL = ['C’est par où, la sortie ?', 'Qui a la carte ?', 'On aurait dû prendre à gauche.', 'Je sens qu’on approche. Ou pas.', 'On ouvre toutes les portes, c’est la règle.', 'C’est encore la faute de l’elfe.', 'Pause pipi ?', 'Ce couloir, on l’a déjà fait, non ?', 'Si on trouve un coffre, je le vois en premier.', 'Moi je dis, on fonce.', 'J’ai faim.', 'Chut ! J’ai entendu un truc.', 'Le plan, c’est qu’il n’y a pas de plan.', 'Il est où, le Cœur ? Derrière, peut-être ?'];
function* battleGen(plan, R) {
  const party = R.party, tactic = R.tactic, n = party.length, need = Math.ceil(n * (plan.rank === 3 ? 2 / 3 : .5));
  const alive = () => party.filter(h => !h.ko), broken = () => n - alive().length >= need, who = plan.foe || 'la bande';
  let sticky = 0, disarm = party.filter(h => h.F.disarm).length, alarm = false;
  const rank = plan.rank || 1, GREED = { voleuse: 4, paysan: 3, elfe: 2, barbare: 1, mage: 1, paladin: 0 };
  if (!R.walk) R.walk = [[GATE.x, GATE.y, 0]]; R.z = 0; R.loot = { g: 0, s: 0, furn: [], freed: 0 };
  const end = (out, i) => { R.outcome = out; R.stop = i; R.ev.push({ k: out, i }); };
  const hurtHero = (h, d, hits, by, sk) => {
    if (h.ko || d <= 0) return; h.hp -= d; const ko = h.hp <= 0;
    if (ko) { h.hp = 0; h.ko = true; R.fallen.push(h.j); if (by && by !== 'merc' && by !== 'power') R.kos[by] = (R.kos[by] || 0) + 1; }
    hits.push({ s: 'h', j: h.j, dmg: d, ko, by, sk }); if (sk) R.moments++;
    return ko;
  };
  // un combat : premier rang, relève (bornée), talents des deux camps
  const fight = (e, defs0, opt, pw) => {
    const cap = opt.cap, maxR = opt.maxR, koHere = [];
    const defs = defs0.sort((a, b) => (b.merc ? 1 : 0) - (a.merc ? 1 : 0) || b.atk - a.atk || b.hp - a.hp).slice(0, opt.keep || cap * 2);   // pas de place pour tout le monde
    defs.forEach((d, k) => { d.in = k < cap; });
    const up = () => defs.filter(d => d.hp > 0 && d.in);
    R.ev.push({ k: 'engage', i: e.i, final: !!opt.final, ambush: !!opt.ambush, heart: !!e.heart, label: e.label, cap, defs: up().map(d => ({ id: d.id, hp: d.hp, max: d.max, merc: !!d.merc })) });
    let heroMinus = 0, defPlus = 0, necroUsed = false;
    const song = () => up().some(d => d.A && d.A.song) ? 1 : 0;
    const heroAtk = h => Math.max(1, h.atk - heroMinus);
    const hitDef = (h, d, hits, dmg0) => {
      const A = d.A || {};
      if (A.dodge && Math.random() < A.dodge) { hits.push({ s: 'c', id: d.id, miss: 1, by: h.j, sk: A.sk }); R.moments++; return; }
      const dmg = Math.max(1, (dmg0 || heroAtk(h)) - (A.armor || 0)); d.hp -= dmg;
      if (d.hp > 0) { hits.push({ s: 'c', id: d.id, dmg, by: h.j, sk: A.armor ? A.sk : undefined }); return; }
      if (A.rise && !d.rose) { d.rose = true; d.hp = A.rise; hits.push({ s: 'c', id: d.id, dmg, rise: d.hp, by: h.j, sk: A.sk }); R.moments++; return; }
      const nec = !necroUsed && up().find(o => o !== d && o.A && o.A.necro);
      if (nec) { necroUsed = true; d.hp = Math.ceil(d.max / 2); hits.push({ s: 'c', id: d.id, dmg, rise: d.hp, by: h.j, sk: nec.A.sk, from: nec.id }); R.moments++; return; }
      d.hp = 0; if (d.c) koHere.push(d.id);
      hits.push({ s: 'c', id: d.id, dmg, ko: true, by: h.j });
    };
    const heroTarget = (h, not) => {
      const list = up().filter(d => d !== not); if (!list.length) return null;
      if (h.k !== 'elfe' && h.k !== 'mage') { const t = list.find(d => d.A && d.A.taunt); if (t) return t; }
      const aim = h.F.aim || 'strong';
      if (aim === 'random') return pick(list);
      if (aim === 'weak') return list.slice().sort((a, b) => a.hp - b.hp)[0];
      if (aim === 'healer') return list.find(d => d.A && (d.A.heal || d.A.necro)) || list.slice().sort((a, b) => a.hp - b.hp)[0];
      return list.slice().sort((a, b) => b.atk - a.atk || b.hp - a.hp)[0];
    };
    const defTarget = d => { const l = alive(); if (!l.length) return null; return (d.A && d.A.low) || Math.random() < .5 ? l.slice().sort((a, b) => a.hp - b.hp)[0] : pick(l); };
    const strikeHero = (d, h, hits) => {
      const A = d.A || {}; let dmg = d.atk + defPlus + song() + sticky, sk; sticky = 0;
      if (A.rage && d.hp < d.max / 2) { dmg += A.rage; sk = A.sk; }
      if (A.low && h.hp < h.max / 2) { dmg += A.low; sk = A.sk; }
      if (d.amb) { dmg *= 2; d.amb = false; sk = A.sk; }
      const ko = hurtHero(h, dmg, hits, d.id, sk);
      if (A.drain && dmg > 1) { const v = Math.min(Math.ceil(dmg / 2), d.max - d.hp); if (v > 0) { d.hp += v; hits.push({ s: 'c', id: d.id, heal: v, sk: A.sk }); R.moments++; } }
      if (ko && A.devour && d.hp < d.max) { const v = Math.min(A.devour, d.max - d.hp); d.hp += v; hits.push({ s: 'c', id: d.id, heal: v, sk: A.sk }); R.moments++; }
      if (A.splash) { const o = pick(alive().filter(x => x !== h)); if (o) hurtHero(o, 1, hits, d.id, A.sk); }
    };
    const join = hits => { let room = cap - up().length; for (const d of defs) { if (room <= 0) break; if (!d.in && d.hp > 0) { d.in = true; room--; hits.push({ s: 'join', id: d.id, hp: d.hp, max: d.max, merc: !!d.merc }); } } };
    // une créature K.O. n'est sonnée pour de bon que si son camp perd le combat
    const done = res => { if (res !== 'flee') koHere.forEach(id => { if (!R.hurt.includes(id)) R.hurt.push(id); }); R.rounds = (R.rounds || 0) + 1; return res; };
    const open = [];
    if (pw === 'seve') { up().forEach(d => { d.hp += 3; d.max += 3; }); defPlus += 1; open.push({ s: 'pw', p: 'seve' }); }
    if (pw === 'cri') { heroMinus += 1; open.push({ s: 'pw', p: 'cri' }); }
    if (pw === 'elixir') { up().forEach(d => { d.hp += 2; d.max += 2; }); defPlus += 2; open.push({ s: 'pw', p: 'elixir' }); }
    if (pw === 'brume') { const top = alive().slice().sort((a, b) => b.atk - a.atk || b.hp - a.hp)[0]; alive().forEach(h => { const v = h === top ? 2 : 1; h.stun = Math.max(h.stun || 0, v); open.push({ s: 'h', j: h.j, stun: v, sk: 'Brume soporifique' }); }); R.moments++; }
    if (pw === 'eboulement') { const h = alive().sort((a, b) => b.atk - a.atk || b.hp - a.hp)[0]; if (h) hurtHero(h, 4, open, 'power', 'Éboulement'); }
    up().forEach(d => {
      const A = d.A || {};
      if (A.ptrap) { const h = pick(alive()); if (h) hurtHero(h, A.ptrap, open, d.id, A.sk); }
      if (A.shriek) alive().forEach(h => hurtHero(h, A.shriek, open, d.id, A.sk));
      if (A.stun1 || A.stun2 || A.fear) {
        const l = alive().filter(h => !h.stun), h = A.fear ? l.sort((a, b) => b.atk - a.atk)[0] : pick(l);
        if (h) { h.stun = A.stun2 ? 2 : 1; open.push({ s: 'h', j: h.j, stun: h.stun, sk: A.sk, by: d.id }); R.moments++; }
      }
      if (A.howl) { heroMinus += 1; open.push({ s: 'sk', id: d.id, sk: A.sk }); R.moments++; }
      if (A.song) { open.push({ s: 'sk', id: d.id, sk: A.sk }); R.moments++; }
      if (A.ambush) d.amb = true;
    });
    if (open.length) R.ev.push({ k: 'round', i: e.i, n: 0, hits: open });
    if (broken() || !alive().length) return done('flee');
    const pre = [], firsts = pw === 'porte' || opt.ambush ? up() : up().filter(d => d.A && d.A.first);
    firsts.forEach(d => { const h = defTarget(d); if (h) strikeHero(d, h, pre); });
    if (pre.length) { R.ev.push({ k: 'round', i: e.i, n: 0, hits: pre, sk: pw === 'porte' ? 'Porte claquée' : opt.ambush ? 'Embuscade' : 'Statue' }); if (broken() || !alive().length) return done('flee'); }
    for (let rd = 1; rd <= maxR; rd++) {
      const hits = []; if (rd > 1) join(hits);
      up().forEach(d => { if (d.c && !R.fought.includes(d.id)) R.fought.push(d.id); });
      if (rd % 2 === 0) up().filter(d => d.A && d.A.breath).forEach(d => { alive().forEach(h => hurtHero(h, d.A.breath, hits, d.id, d.A.sk)); });
      if (rd === 1) alive().filter(h => h.F.first && !h.stun).forEach(h => { const d = heroTarget(h); if (d) hitDef(h, d, hits); });
      const standing = alive();
      for (const d of up()) { const h = defTarget(d); if (!h) break; strikeHero(d, h, hits); }
      for (const h of standing) {
        if (rd === 1 && h.F.first && !h.stun) continue;
        if (h.stun > 0) { h.stun--; hits.push({ s: 'h', j: h.j, stunned: 1 }); continue; }
        const d = heroTarget(h); if (!d) break; hitDef(h, d, hits);
        if (h.F.splash) { const d2 = heroTarget(h, d); if (d2) hitDef(h, d2, hits, Math.ceil(heroAtk(h) / 2)); }
      }
      if (broken() || !alive().length) { R.ev.push({ k: 'round', i: e.i, n: rd, hits }); return done('flee'); }
      for (const p of alive().filter(h => h.F.heal)) { const w = alive().filter(h => h.hp < h.max).sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; if (w) { const v = Math.min(p.F.heal, w.max - w.hp); w.hp += v; hits.push({ s: 'h', j: w.j, heal: v, by: p.j }); } }
      up().forEach(d => {
        const A = d.A || {};
        if (A.heal) { const w = up().filter(o => o.hp < o.max).sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; if (w) { const v = Math.min(A.heal, w.max - w.hp); w.hp += v; hits.push({ s: 'c', id: w.id, heal: v, by: d.id, sk: A.sk }); R.moments++; } }
        if (A.regen && d.hp < d.max) { d.hp += A.regen; hits.push({ s: 'c', id: d.id, heal: A.regen, sk: A.sk }); }
      });
      R.ev.push({ k: 'round', i: e.i, n: rd, hits });
      clock -= 1;
      if (!defs.some(d => d.hp > 0)) return done('won');
    }
    return done('push');
  };
  // les pièces : ce que la bande y fait quand personne ne l'en empêche
  const roomEvent = (r, i) => {
    const E = ROOM_EVENTS[r.t] || ROOM_EVENTS._, hits = [];
    const X = {
      any: () => pick(alive()), weakest: () => alive().slice().sort((a, b) => a.hp - b.hp)[0], find: k => alive().find(h => h.k === k),
      all: f => alive().forEach(f), heal: (h, v) => { const x = Math.min(v, h.max - h.hp); if (x > 0) { h.hp += x; hits.push({ s: 'h', j: h.j, heal: x }); } },
      hurt: (h, v) => hurtHero(h, v, hits, null), stun: (h, v) => { h.stun = Math.max(h.stun || 0, v); hits.push({ s: 'h', j: h.j, stun: v }); },
      buff: (h, v) => { h.atk += v; hits.push({ s: 'h', j: h.j, buff: v }); }, time: v => { clock -= v; },
      loot: o => { R.loot.g += o.g || 0; R.loot.s += o.s || 0; R.loot.freed += o.freed || 0; if (o.g || o.s) hits.push({ s: 'loot', g: o.g || 0, m: o.s || 0 }); },
      breakOne: () => { const f = wreckable(r).find(x => !R.loot.furn.includes(x.id)); if (!f) return false; R.loot.furn.push(f.id); hits.push({ s: 'break', fid: f.id, t: f.t }); return true; },
      flee: h => { h.ko = true; h.fled = true; hits.push({ s: 'h', j: h.j, fled: 1 }); }, know: v => { bias = Math.min(.95, bias + v); },
    };
    const text = E.run(X); R.moments++;
    R.ev.push({ k: 'visit', i, sk: E.sk, text, hits, room: r.id }); R.lines.push(['🚪', `${ROOMS[r.t].name} : ${text}`, '']);
  };
  // la Tour de guet bombarde la bande dès son arrivée
  const harass = sumRooms('harass');
  if (harass && n) {
    const hits = []; for (let k = 0; k < harass && alive().length; k++) hurtHero(alive()[k % alive().length], 1, hits, null);
    R.ev.push({ k: 'harass', i: 0, hits }); R.lines.push(['🪨', `La Tour de guet bombarde ${who} de cailloux : ${harass} dégât${harass > 1 ? 's' : ''}.`, 'good']);
    if (broken()) return end('repelled', 0);
  }
  // leur but, et la distance qui les en sépare (les barricades bloquent ; si elles bloquent tout, ils les enfonceront)
  const tg = S.rooms.find(r => r.id === plan.target) || heartRoom(); if (!tg) return end('lost', 0);
  // (le Cœur peut être à un autre étage : la distance passe par les escaliers)
  const tgSet = new Set(groupOf(tg).rooms.map(r => r.id)), tz = zOf(tg), links = stairLinks(), K = (x, y, z = 0) => ((z + 8) * H + y) * W + x;
  const distTo = avoid => { const d = new Map(), q = [];
    withZ(tz, () => { for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const r = roomAt(x, y); if (r && tgSet.has(r.id)) { d.set(K(x, y, tz), 0); q.push([x, y, tz]); } } });
    while (q.length) { const [x, y, z] = q.shift(), v = d.get(K(x, y, z));
      const nb = withZ(z, () => DIRS.map(([dx, dy]) => [x + dx, y + dy, z]).filter(([nx, ny]) => nx >= 0 && ny >= 0 && nx < W && ny < H && passable(nx, ny, x, y) && !(avoid && barred(nx, ny, z))));
      const s = links.get(x + ',' + y + ',' + z); if (s) nb.push(s);
      for (const c of nb) { const k = K(...c); if (d.has(k)) continue; d.set(k, v + 1); q.push(c); } }
    return d; };
  let dist = distTo(!plan.bare), smashOK = !!plan.bare; if (dist.get(K(GATE.x, GATE.y, 0)) == null) { dist = distTo(false); smashOK = true; }
  const D0 = dist.get(K(GATE.x, GATE.y, 0)); if (D0 == null) { R.lines.push(['🌀', 'Aucun chemin jusqu’à leur but : ils tournent en rond.', 'good']); return end('lost', 0); }
  let clock = Math.round(D0 * 2.5) + 12 + 2 * (plan.rank || 1);
  let bias = { 1: .45, 2: .55, 3: .7 }[plan.rank || 1] + (party.some(h => h.k === 'elfe' && !h.minion) ? .1 : 0);
  // qui défend quoi, selon la tactique
  const goalE = { k: 'goal', heart: tg === heartRoom(), rooms: [...tgSet], label: tg === heartRoom() ? 'Le Cœur' : ROOMS[tg.t].name, entry: [...tgSet].reduce((a, id) => a + rstat(S.rooms.find(r => r.id === id), 'guard'), 0) };
  const free = freeCrew().filter(c => !tgSet.has(c.guard)), ambushes = [];
  let finalCrew;
  if (tactic === 'cible') finalCrew = S.creatures.filter(fitToFight);
  else if (tactic === 'harceler') {
    // la moitié des libres (les plus vifs) part en embuscade ; les autres gardent leur cible
    const all = free.slice().sort((a, b) => guardOf(b) - guardOf(a)), pool = all.splice(0, Math.ceil(all.length / 2)), spots = Math.min(3, Math.ceil(pool.length / 3));
    for (let k = 0; k < spots; k++) { const grp = pool.splice(0, 3); if (grp.length) ambushes.push({ at: Math.max(2, Math.round(D0 * (k + 1) / (spots + 1))), crew: grp }); }
    finalCrew = [...guardsIn(goalE), ...pool, ...all];
  } else finalCrew = [...guardsIn(goalE), ...free];
  const tired = new Set(), seenRooms = new Set(), trapsDone = new Set(), visited = new Set([K(GATE.x, GATE.y, 0)]);
  let pos = [GATE.x, GATE.y, 0], lostSteps = 0;
  // un geste du Maître : la bourse fait fuir le plus cupide, les portes claquées les égarent
  const doStep = k => {
    const freeAct = k === 'detour' && !R.used.includes(k) && typeof chantierDone === 'function' && chantierDone('secrete');   // la pièce secrète : les portes claquent gratis
    if ((R.charges <= 0 && !freeAct) || R.used.includes(k) || !STEP_ACTS[k] || R.outcome) return false;
    let j = null;
    if (k === 'or') {
      const cost = orCost(plan); if (S.gold - R.gold < cost) return false; R.gold += cost;
      const h = Math.random() < .6 ? alive().filter(x => (GREED[x.k] || 0) >= 3).sort((a, b) => (GREED[b.k] || 0) - (GREED[a.k] || 0) || a.hp - b.hp)[0] : null;
      if (h) { h.ko = true; h.fled = true; j = h.j; R.lines.push(['👛', `Une bourse de ${cost} or au milieu du couloir : ${h.name} la ramasse et file.`, 'good']); }
      else { clock -= 3; R.lines.push(['👛', `Une bourse de ${cost} or au milieu du couloir : ${who} se la dispute et perd du temps.`, 'good']); }
    }
    else if (k === 'detour') { clock -= 3; lostSteps = 4; R.lines.push(['🚪', `Les portes claquent : ${who} se perd et perd du temps.`, 'good']); }
    if (!freeAct) R.charges--; R.used.push(k); R.ev.push({ k: 'act', a: k, i: R.walk.length - 1, j }); R.moments++;
    return true;
  };
  const runFight = function* (e, crew, opt) {
    const home = c => e.rooms && e.rooms.includes(c.post) && tactic !== 'cible' ? 1 : 0, far = c => tactic === 'cible' && opt.final && c.guard && !e.rooms.includes(c.guard) ? -1 : 0;
    const defs = crew.filter(c => fitToFight(c) && !tired.has(c.id)).map(c => fighterOf(c, (opt.final && alarm ? 1 : 0) + (opt.ambush ? 1 : home(c) + far(c))));
    if (opt.final && S.world && S.world.merc > S.night) defs.push({ id: 'merc', name: 'les Mercenaires', hp: 10, max: 10, atk: 2, merc: true, A: {} });
    if (opt.final && typeof nemAlly === 'function') { const al = nemAlly(); if (al) defs.push(al); }   // l'ancien héros némésis, passé de ton côté
    if (!defs.length) return null;
    // le combat décisif, à l'écran : le Maître peut le jouer aux cartes (sinon, le combat automatique ci-dessous)
    if (opt.final && R.live && typeof defenseCards === 'function') {
      const front = defs.slice().sort((a, b) => (b.merc ? 1 : 0) - (a.merc ? 1 : 0) || b.atk - a.atk || b.hp - a.hp).slice(0, 2 * (e.heart ? 5 : 2 + 2 * e.rooms.length));   // le premier rang et sa relève, comme au combat automatique
      const out = yield { ask: 'cards', e, label: e.label, defs: front, party: alive(), need: Math.max(1, need - (n - alive().length)) };
      if (out && out.res) {
        R.ev.push({ k: 'engage', i: e.i, final: true, heart: !!e.heart, label: e.label, cap: front.length, defs: front.map(d => ({ id: d.id, hp: d.hp, max: d.max, merc: !!d.merc })) });
        const hits = [];
        out.her.forEach(x => { const h = party[x.j]; if (!h || h.ko) return; if (x.ko) hurtHero(h, h.hp, hits, null); else if (h.hp > x.hp) { hits.push({ s: 'h', j: h.j, dmg: h.hp - x.hp }); h.hp = x.hp; } });
        out.def.forEach(x => { const d = front.find(o => o.id === x.id); if (!d) return; if (d.c && !R.fought.includes(d.id)) R.fought.push(d.id);
          if (x.ko) { hits.push({ s: 'c', id: d.id, dmg: d.hp, ko: 1 }); d.hp = 0; if (d.c && out.res !== 'flee' && !R.hurt.includes(d.id)) R.hurt.push(d.id); }
          else if (d.hp > x.hp) { hits.push({ s: 'c', id: d.id, dmg: d.hp - x.hp }); d.hp = x.hp; } });
        R.charges = 0; R.cards = true;
        R.ev.push({ k: 'round', i: e.i, n: 1, hits, sk: 'Aux cartes' });
        R.lines.push(['🃏', `${e.label} : défendu aux cartes. ${out.res === 'flee' ? 'La bande est repoussée !' : 'La bande l’emporte…'}`, out.res === 'flee' ? 'good' : 'bad']);
        return out.res;
      }
    }
    let pw = null;
    if (R.charges > 0) {
      while (R.queue.length) doStep(R.queue.shift());   // un geste demandé pendant la balade passe avant le combat
      pw = yield { ask: 'power', e, final: !!opt.final, label: e.label, defs: defs.map(d => ({ name: d.name, hp: d.hp, atk: d.atk })), party: alive().map(h => ({ name: h.name, hp: h.hp, max: h.max, atk: h.atk })) };
      if (pw && POWERS[pw] && powerOK(pw) && !R.used.includes(pw) && R.charges > 0) { R.charges--; R.used.push(pw); R.ev.push({ k: 'power', i: e.i, p: pw }); R.lines.push([POWERS[pw].ico, `Pouvoir du Cœur : ${POWERS[pw].name}.`, 'good']); } else pw = null;
    }
    if (pw === 'cloche') {   // les renforts : les plus solides de celles qui ne se battent pas ici
      const inFight = new Set(defs.map(d => d.id)), extra = S.creatures.filter(c => fitToFight(c) && !inFight.has(c.id) && !tired.has(c.id) && !R.hurt.includes(c.id)).sort((a, b) => guardOf(b) - guardOf(a)).slice(0, 2);
      extra.forEach(c => { const d = fighterOf(c, 0); defs.push(d); tired.add(c.id); }); if (extra.length) R.lines.push(['🔔', `La cloche sonne : ${extra.map(c => c.name).join(' et ')} accour${extra.length > 1 ? 'ent' : 't'}.`, 'good']);
    }
    const cap = opt.ambush ? 3 : opt.final ? (e.heart ? 5 : 2 + 2 * e.rooms.length) : 1 + 2 * e.rooms.length;
    const before = new Set(R.fallen), hurt0 = R.hurt.length, m0 = R.moments, res = fight(e, defs, { cap, keep: opt.final && tactic === 'cible' ? cap + 2 : cap * 2, maxR: opt.final ? 6 : opt.ambush ? 2 : 3, final: opt.final, ambush: opt.ambush }, pw);
    if (opt.ambush) defs.forEach(d => d.c && tired.add(d.id));
    const downH = R.fallen.filter(j => !before.has(j)).map(j => party[j].name), downC = R.hurt.slice(hurt0).map(id => (critter(id) || {}).name).filter(Boolean);
    const used = defs.filter(d => d.in), vs = used.map(d => d.name).join(', ') + (defs.length > used.length ? ` (et ${defs.length - used.length} en réserve)` : '');
    R.lines.push([opt.final ? (e.heart ? '🏰' : '🎯') : opt.ambush ? '🗡️' : '⚔️', `${opt.ambush ? 'Embuscade' : e.label} : ${vs} contre ${who}${opt.final && alarm ? ' (alarme)' : ''}.${R.moments > m0 ? ` ${R.moments - m0} coup${R.moments - m0 > 1 ? 's' : ''} d’éclat.` : ''}${downH.length ? ` K.O. : ${downH.join(', ')}.` : ''}${downC.length ? ` Sonné${downC.length > 1 ? 's' : '·e'} : ${downC.join(', ')}.` : ''}${res === 'push' && !opt.final ? ' Ils passent quand même.' : ''}`, downH.length ? 'good' : downC.length ? 'bad' : '']);
    return res;
  };
  // la balade : un pas après l'autre, tantôt vers leur but, tantôt au petit bonheur
  for (;;) {
    if (!alive().length) return end('repelled', R.walk.length - 1);
    // le Maître peut agir à chaque pas (le simulateur suit sa politique ; à l'écran, les boutons remplissent la file)
    if (R.stepPol) R.stepPol(R, { i: R.walk.length - 1, clock, left: dist.get(K(...pos)) ?? 0, alive: alive().length, need, rank });
    while (R.queue.length) { doStep(R.queue.shift()); if (broken()) return end('repelled', R.walk.length - 1); }
    if (R.live) yield { tick: 1 };
    while (R.queue.length) { doStep(R.queue.shift()); if (broken()) return end('repelled', R.walk.length - 1); }
    if (clock-- <= 0) { R.lines.push(['🌅', `Le jour se lève : ${who} rentre se coucher${R.loot.g || R.loot.s || R.loot.furn.length ? ', les poches pleines' : ', bredouille'}.`, 'good']); return end('lost', R.walk.length - 1); }
    const here = dist.get(K(...pos));
    const nb = DIRS.map(([dx, dy]) => [pos[0] + dx, pos[1] + dy, pos[2]]).filter(([x, y]) => x >= 0 && y >= 0 && x < W && y < H && passable(pos[0], pos[1], x, y) && (smashOK || !barred(x, y)));
    { const s = links.get(pos.join(',')); if (s) nb.push(s); }
    if (!nb.length) { R.lines.push(['🌀', 'Ils se perdent dans un cul-de-sac et rentrent chez eux.', 'good']); return end('lost', R.walk.length - 1); }
    let nx = null;
    if (lostSteps > 0) lostSteps--; else if (Math.random() < bias) nx = nb.filter(c => dist.has(K(...c)) && dist.get(K(...c)) < here).sort((a, b) => dist.get(K(...a)) - dist.get(K(...b)))[0] || null;
    if (!nx) { const fresh = nb.filter(c => !visited.has(K(...c))); nx = pick(fresh.length ? fresh : nb); }
    const z0 = pos[2]; pos = nx; visited.add(K(...pos)); R.walk.push(pos); const i = R.walk.length - 1;
    // un escalier : la bande change d'étage (le pas suivant se joue là-haut, ou là-dessous)
    if (pos[2] !== z0) { R.z = pos[2]; R.ev.push({ k: 'floor', i, z: pos[2] }); R.lines.push(['🪜', `${who[0].toUpperCase() + who.slice(1)} ${pos[2] > z0 ? 'monte' : 'descend'} : ${FLOOR_NAMES[pos[2]]}.`, '']); yield { floor: pos[2] }; continue; }
    if (Math.random() < .07) R.ev.push({ k: 'talk', i, j: pick(alive()).j, text: pick(NAHEUL) });
    // un piège, un verrou, une barricade
    const d = plan.bare === true ? null : defAt(pos[0], pos[1]), half = plan.bare === 'half';
    if (d && DEFS[d.t] && !trapsDone.has(d.id)) {
      trapsDone.add(d.id); const D = DEFS[d.t], label = D.name;
      if (D.block) { R.ev.push({ k: 'smash', i, defId: d.id }); R.smashed = d.id; R.lines.push(['🪓', `Aucun autre chemin : ${who} défonce ta ${label}.`, 'bad']); }
      else if (D.post) { /* un Poste de garde : le barrage (s'il y a des gardes) se joue juste après */ }
      else if (D.alarm) { alarm = true; R.ev.push({ k: 'alarm', i, defId: d.id }); R.lines.push(['🔔', 'La Cloche d’alarme sonne : les défenseurs de leur cible frappent plus fort (+1).', 'good']); }
      else {
        const thief = D.kind === 'piège' && disarm > 0 ? alive().find(h => h.F.disarm) : null;
        if (thief) { disarm--; R.ev.push({ k: 'disarm', i, defId: d.id, j: thief.j }); R.moments++; R.lines.push(['🗝️', `${thief.name} désamorce ta ${label}.`, 'bad']); }
        else {
          const h = pick(alive()); let dmg = defStr(d) + sticky; sticky = 0; if (half) dmg = Math.ceil(dmg * .6);
          if (D.kind === 'verrou' && h.F.smash) dmg = Math.ceil(dmg / 2);
          const hits = []; if (dmg > 0) hurtHero(h, dmg, hits, null);
          if (D.sticky) sticky = 1;
          R.ev.push({ k: 'trap', i, defId: d.id, hits }); R.lines.push(['⚔️', `${label} : −${dmg} PV à ${h.name}${h.ko ? ', K.O. !' : '.'}`, 'good']);
          if (broken()) return end('repelled', i);
          if (D.lost && Math.random() < D.lost * (half ? .6 : 1) * Math.pow(.4, R.lostN || 0)) { R.lines.push([D.kind === 'ruse' ? '🎭' : '🦁', D.lostLine || (D.kind === 'ruse' ? 'Ils filent avec le Faux trésor, ravis de leur butin.' : 'L’énigme du Sphinx les laisse secs : ils rentrent chez eux.'), 'good']); return end('lost', i); } if (D.lost) R.lostN = (R.lostN || 0) + 1;
        }
      }
    }
    // une embuscade (tactique « harceler »)
    if (ambushes.length && i >= ambushes[0].at) {
      const a = ambushes.shift(), res = yield* runFight({ i, k: 'ambush', label: 'Embuscade', rooms: [] }, a.crew, { ambush: true });
      if (res === 'flee') return end('repelled', i);
    }
    // une pièce
    const r = roomAt(pos[0], pos[1]);
    // un barrage : des gardes postés à un Poste de garde de couloir (ou au porche) arrêtent la bande au passage
    if (r && isHall(r) && !tgSet.has(r.id) && tactic !== 'cible' && !seenRooms.has(r.id)) {
      const gs = guardsIn({ rooms: [r.id] });
      if (gs.length) { seenRooms.add(r.id); const res = yield* runFight({ i, k: 'room', rooms: [r.id], label: r.t === 'porche' ? 'Le porche' : 'Barrage', entry: 0 }, gs, {}); if (res === 'flee') return end('repelled', i); }
      continue;
    }
    if (!r || isHall(r)) continue;
    if (tgSet.has(r.id)) {
      const e = { ...goalE, i };
      if (e.entry > 0) { const h = pick(alive()), hits = []; hurtHero(h, e.entry + sticky, hits, null); sticky = 0; R.ev.push({ k: 'entry', i, hits }); R.lines.push(['🛡️', `${e.label} : ses défenses font −${e.entry} PV à ${h.name}${h.ko ? ', K.O. !' : '.'}`, 'good']); if (broken()) return end('repelled', i); }
      const res = yield* runFight(e, finalCrew, { final: true });
      if (res == null) { R.lines.push(['💔', `Personne ne défend ${e.heart ? 'le Cœur' : e.label}.`, 'bad']); return end('robbed', i); }
      if (res === 'flee') return end('repelled', i);
      return end(res === 'won' ? 'robbed' : 'repelled', i);
    }
    const g = groupOf(r), gk = g.rooms[0].id; if (seenRooms.has(gk)) continue; seenRooms.add(gk);
    const e = { i, k: 'room', rooms: g.rooms.map(o => o.id), label: ROOMS[r.t].name + (g.rooms.length >= 2 ? ' (' + sizeWord(g.rooms.length) + ')' : ''), entry: g.rooms.reduce((a, o) => a + rstat(o, 'guard'), 0) };
    if (e.entry > 0) { const h = pick(alive()), hits = []; hurtHero(h, e.entry + sticky, hits, null); sticky = 0; R.ev.push({ k: 'entry', i, hits }); R.lines.push(['🛡️', `${e.label} : ses défenses font −${e.entry} PV à ${h.name}${h.ko ? ', K.O. !' : '.'}`, 'good']); if (broken()) return end('repelled', i); }
    const crew = tactic === 'cible' ? [] : guardsIn(e);
    if (crew.length) { const res = yield* runFight(e, crew, {}); if (res === 'flee') return end('repelled', i); }
    if (alive().length && Math.random() < (tactic === 'cible' ? 1 : .75)) { roomEvent(r, i); if (broken()) return end('repelled', i); }
  }
}
// le simulateur (et les sabotages joués sans toi) : garde ses pouvoirs pour le combat décisif, ou quand ça tourne mal
// un Maître attentif : la bourse tôt (un héros de moins), les portes quand la bande approche, les pouvoirs quand le combat tourne mal
function autoPower(ask, R) {
  const left = Object.keys(POWERS).filter(p => !R.used.includes(p) && powerOK(p)); if (!left.length || R.charges <= 0) return null;
  const heroes = ask.party.reduce((a, h) => a + h.hp + 3 * h.atk, 0), defs = ask.defs.reduce((a, d) => a + d.hp + 3 * d.atk, 0);
  if (!(ask.final || heroes > defs)) return null;
  const pref = ask.final ? ['elixir', 'seve', 'brume', 'cloche', 'eboulement', 'cri', 'porte'] : heroes > defs * 1.6 ? ['cloche', 'brume', 'eboulement', 'elixir', 'cri', 'porte', 'seve'] : ['eboulement', 'brume', 'cri', 'porte', 'elixir', 'seve', 'cloche'];
  return pref.find(p => left.includes(p)) || null;
}
function autoStep(R, o) {
  if (!R.used.includes('detour') && o.left <= 3 && typeof chantierDone === 'function' && chantierDone('secrete')) { R.queue.push('detour'); return; }
  if (R.charges <= 0) return;
  if (!R.used.includes('or') && o.i >= 1 && o.alive >= 2 && R.charges >= 2) R.queue.push('or');
  else if (!R.used.includes('detour') && o.left <= 3 && R.charges >= 2) R.queue.push('detour');
}
const noPower = () => null;
function resolveInvasion(plan, tactic, policy, stepPol) {
  const R = newBattle(plan, tactic || plan.tactic || 'postes'), g = battleGen(plan, R), step = v => withZ(R.z || 0, () => g.next(v));
  R.stepPol = stepPol !== undefined ? stepPol : policy === noPower ? null : autoStep;
  let r = step(); while (!r.done) r = step(r.value && r.value.floor != null ? null : (policy || autoPower)(r.value, R)); return R;
}

/* ---------- après la bataille : bosses, expérience, butin des héros selon leur but ---------- */
function applyCombat(plan, R, lines) {
  if (R.smashed) S.defs = S.defs.filter(d => d.id !== R.smashed);
  if (R.gold) S.gold = Math.max(0, S.gold - R.gold);   // la bourse semée dans le couloir
  const hurt = R.hurt.map(critter).filter(Boolean);
  hurt.forEach(c => { c.hurt = S.night + 1 + HURT_NIGHTS; });
  if (hurt.length) lines.push(['🤕', `${hurt.map(c => c.name).join(', ')} ${hurt.length > 1 ? 'sont sonnés' : 'est sonné·e'} : une nuit de repos, sans garde ni raid.`, 'bad']);
  R.fought.forEach(id => { const c = critter(id); if (c) gainXP(c, 1 + (R.kos[id] ? 1 : 0), lines); });
  S.stats.fights = (S.stats.fights || 0) + R.fought.length;
  S.stats.heroKO = (S.stats.heroKO || 0) + R.fallen.length;
  const L = R.loot; if (!L || !(L.g || L.s || L.furn.length || L.freed)) return;
  const keep = R.outcome === 'repelled' ? .5 : 1, g = Math.min(S.gold, Math.floor(L.g * keep)), m = Math.min(S.mat, Math.floor(L.s * keep)), freed = Math.min(S.prisoners, L.freed), nf = L.furn.length;
  S.gold -= g; S.mat -= m; S.prisoners -= freed; if (nf) { S.furn = S.furn.filter(f => !L.furn.includes(f.id)); dirty(); }
  const parts = [g && `${g} 💰`, m && `${m} 🪵`, nf && `${nf} meuble${nf > 1 ? 's' : ''} cassé${nf > 1 ? 's' : ''}`, freed && `${freed} prisonnier${freed > 1 ? 's' : ''} délivré${freed > 1 ? 's' : ''}`].filter(Boolean);
  if (parts.length) lines.push(['🎒', `Chapardé par ${plan.foe || 'la bande'} en chemin : ${parts.join(', ')}${keep < 1 && (L.g || L.s) ? ' (la moitié du butin, lâchée dans la fuite, est récupérée)' : ''}.`, 'bad']);
}
// ce que la bande emporte quand elle atteint son but (autre que le Cœur)
function goalEffects(goal, lines) {
  if (goal.k === 'tresor') { const g = Math.min(S.gold, 8 + 4 * S.tier); S.gold -= g; lines.push(['💰', `Ils vident ta Salle au trésor : −${g} 💰.`, 'bad']); }
  else if (goal.k === 'enlever') {
    const c = critter(goal.c);
    if (c) { c.captive = S.night + 4; c.post = null; S.creatures.forEach(o => { if (o !== c) o.mood = clamp(o.mood - 1, 0, 5); }); lines.push(['🪤', `Ils emmènent ${c.name} au village ! Paie sa rançon depuis sa fiche (${captiveRansom(c)} 💰), ou attends qu’il·elle s’évade (4 nuits). Les autres créatures, choquées : −1 ❤️.`, 'bad']); }
  } else if (goal.k === 'saccage') {
    const r = S.rooms.find(o => o.id === goal.room), victims = r ? wreckable(r).slice(0, 2) : [];
    S.furn = S.furn.filter(f => !victims.includes(f)); dirty();
    lines.push(['🔥', `Ils saccagent ${goal.label} : ${victims.length ? victims.map(f => FURN[f.t].name).join(' et ') + (victims.length > 1 ? ' partent' : ' part') + ' en miettes' : 'ils ne trouvent rien à casser'}.`, 'bad']);
  }
}
const applyInvasionBase = applyInvasion;
applyInvasion = function (plan, outcome) {
  const extra = []; if (plan.res) applyCombat(plan, plan.res, extra);
  const goal = plan.goal || { k: 'coeur' };
  if (outcome === 'robbed' && goal.k !== 'coeur') {
    const lines = []; S.stats.invasions++; S.calamity += 1; goalEffects(goal, lines); lines.push(['🌀', 'La nuit a été rude : +1 Calamité.', 'bad']);
    if (S.world) { S.world.next = null; S.world.decoy = false; }
    return [...lines, ...extra];
  }
  const lines = applyInvasionBase(plan, outcome);
  if (outcome === 'repelled' && plan.prep > 1.15) { const g = Math.round(plan.party.length * (plan.rank || 1) * (plan.prep - 1)); S.gold += g; lines.push(['🎒', `Une bande bien préparée laisse un beau butin : +${g} 💰 (armures, potions, provisions).`, 'good']); }
  return [...lines, ...extra];
};
function payOff(plan) {
  const cost = Math.min(S.gold, ransomCost(plan)); S.gold -= cost; S.stats.invasions++; S.stats.bribes = (S.stats.bribes || 0) + 1;
  if (S.world) { S.world.next = null; S.world.decoy = false; }
  return [['💰', `Tu achètes leur départ : −${cost} 💰. Ils repartent en sifflotant.`, '']];
}

/* ---------- les créatures enlevées ---------- */
function captiveDawn(report) {
  S.creatures.forEach(c => { if (c.captive && S.night >= c.captive) { delete c.captive; c.back = true; c.mood = clamp(c.mood - 1, 0, 5); report.push(['🏃', `${c.name} s’est évadé·e du village et rentre au château, un peu secoué·e (−1 ❤️).`, '']); addLog(`${c.name} est revenu·e.`, 'good'); } });
}
CMD.ransomCaptive = function (a) { const c = critter(a.id); if (!c || !c.captive) return 'Pas prisonnier'; const cost = { g: captiveRansom(c) }; if (!canAfford(cost)) return 'Pas assez'; pay(cost); delete c.captive; c.back = true; addLog(`Rançon payée : ${c.name} rentre au château.`, 'good'); return null; };
const openCreatureCaptive = openCreature;
openCreature = function (id) {
  const r = openCreatureCaptive(id), c = critter(id); if (!c || !c.captive) return r;
  const m = document.querySelector && document.querySelector('#modalRoot .modal'), at = m && (m.querySelector('.bubble') || m.querySelector('h2'));
  if (at) {
    at.insertAdjacentHTML('afterend', `<div class="tempt"><p>🪤 <b>${esc(c.name)} est retenu·e au village</b> par des aventuriers. Il·elle s’évadera à l’aube de la nuit ${c.captive}… ou rentre tout de suite si tu paies la rançon.</p><div class="btnrow"><button class="sbtn pri" type="button" id="mRansom" ${canAfford({ g: captiveRansom(c) }) ? '' : 'disabled'}>Payer la rançon (${captiveRansom(c)} 💰)</button></div></div>`);
    m.querySelector('#mRansom').addEventListener('click', () => { if (!run('ransomCaptive', { id })) return; sfx('chime'); closeModal(true); afterChange(); toast(`🏃 ${c.name} rentre au château.`); });
  }
  return r;
};

/* ---------- avant l'assaut : la bande, son but, ta tactique ---------- */
function heroCard(h) {
  const F = HERO_FIGHT[h.k] || HERO_FIGHT.paysan;
  return `<div class="hcard">${imgThumb(h.minion ? 'char' : 'hero', h.k)}<b>${esc(h.name)}</b><span class="hst">❤️ ${h.hp} · ⚔️ ${h.atk}</span>${h.minion ? '' : `<small><b>${esc(F.sk)}</b> : ${esc(F.sd)}</small>`}</div>`;
}
function defenseSummary(plan) {
  const enc = plan.enc || [], traps = enc.filter(e => e.k === 'def' && !DEFS[e.t].alarm).length, rooms = enc.filter(e => e.k === 'room' && guardsIn(e).length), goalE = enc.find(e => e.k === 'goal');
  const posted = goalE ? guardsIn(goalE).length : 0, free = freeCrew().filter(c => !goalE || !goalE.rooms.includes(c.guard)).length, hurt = S.creatures.filter(injured).length;
  return `Ils ne connaissent pas ton château : ils vont errer, ouvrir les portes et fouiller les pièces qu’ils traversent (le jour qui se lève les fera rentrer). Sur le chemin le plus court : <b>${traps}</b> piège${traps > 1 ? 's' : ''} ou verrou${traps > 1 ? 's' : ''}, <b>${rooms.length}</b> pièce${rooms.length > 1 ? 's' : ''} gardée${rooms.length > 1 ? 's' : ''}${rooms.length ? ` (${rooms.map(e => esc(e.label)).join(', ')})` : ''}. À leur cible : <b>${posted}</b> garde${posted > 1 ? 's' : ''} posté${posted > 1 ? 's' : ''}, et <b>${free}</b> créature${free > 1 ? 's' : ''} libre${free > 1 ? 's' : ''} pour les y attendre.${hurt ? ` ${hurt} sonnée${hurt > 1 ? 's' : ''} ne se battr${hurt > 1 ? 'ont' : 'a'} pas.` : ''}`;
}
function goalLine(plan) { const g = plan.goal || { k: 'coeur', label: 'le Cœur' }, G = INV_GOALS[g.k]; return `${G.ico} <b>Leur but : ${esc(G.name.toLowerCase())}</b>${g.k === 'enlever' ? ` (${esc(g.label)})` : g.k === 'saccage' ? ` (${esc(g.label)})` : ''}. ${esc(G.desc)}`; }
// combien de fois sur 20 la bande atteint son but, pour chaque tactique (tes pouvoirs lancés au bon moment)
// leurs chances, tactique par tactique : si tu laisses faire, et si tu dépenses l'énergie du Cœur au bon moment
const oddsRand = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
// les mêmes tirages avec et sans énergie : l'écart mesure vraiment son effet
function invOdds(plan, n = 20) { const out = {}, rnd = Math.random; try { Object.keys(TACTICS).filter(k => k !== 'rancon').forEach(k => { let f = 0, f0 = 0; for (let i = 0; i < n; i++) { Math.random = oddsRand(7919 * i + 17); if (resolveInvasion(plan, k, autoPower).outcome === 'robbed') f++; Math.random = oddsRand(7919 * i + 17); if (resolveInvasion(plan, k, noPower).outcome === 'robbed') f0++; } out[k] = Math.min(f, f0) / n; out[k + '0'] = f0 / n; }); } finally { Math.random = rnd; } return out; }
const oddsCls = v => v >= .45 ? 'bad' : v >= .2 ? 'mid' : 'good';
function chooseTactic(plan, opts = {}) {
  if (typeof document === 'undefined' || !document.body || !document.body.appendChild) return Promise.resolve('postes');
  const cost = ransomCost(plan), o = plan.origin, R = HERO_RANK[plan.rank || 1], ch = plan.noPowers ? 0 : powerCharges(), odds = invOdds(plan);
  V.invPath = null; V.invGoal = plan.target;
  const m = openModal(`<h2>${opts.title || '⚔️ Des aventuriers !'}</h2>
    <p class="hint">${opts.sub || `${esc(R.label)}${o && o.name ? ` venus de ${esc(o.name)}` : ''}. Ils fuient quand ${plan.rank === 3 ? 'les deux tiers' : 'la moitié'} d’entre eux ${plan.rank === 3 ? 'sont' : 'est'} K.O.`}</p>
    <p class="goalline">${goalLine(plan)}</p>
    ${plan.prep > 1.15 ? `<p class="hint">🛡️ Ils ont étudié ta défense : armures, potions et provisions (PV ×${String(plan.prep).replace('.', ',')}). Repousse-les, et leur équipement sera à toi.</p>` : ''}
    <div class="hcards">${plan.party.map(heroCard).join('')}</div>
    <p>${defenseSummary(plan)}</p>
    ${ch ? `<p class="hint">⚡ Le Cœur a <b>${ch} d’énergie</b> en réserve. Avant chaque combat : ${Object.keys(POWERS).filter(powerOK).map(k => `${POWERS[k].ico} ${esc(POWERS[k].name)}`).join(', ')}. À tout moment pendant leur balade : ${Object.values(STEP_ACTS).map(p => `${p.ico} ${esc(p.name)}`).join(', ')} (${orCost(plan)} or). <b>Sans tes gestes, ils arrivent presque toujours à leurs fins.</b></p>` : ''}
    <h3>Ta tactique</h3><p class="hint">🎲 Leurs chances d’atteindre leur but avec tes pièges et tes gardes, sans rien faire, puis en dépensant l’énergie du Cœur au bon moment :</p><div class="tactics">${Object.entries(TACTICS).filter(([k]) => k !== 'rancon' || !opts.noRansom).map(([k, t]) => `<button type="button" class="choice tactic" data-tac="${k}" ${k === 'rancon' && S.gold < cost ? 'disabled' : ''}><span class="emo">${t.ico}</span><b>${esc(t.name)}${k === 'rancon' ? ` (${cost} 💰)` : ''}</b><small>${esc(t.desc)}</small>${k !== 'rancon' ? `<em class="odds ${oddsCls(odds[k + '0'])}">Si tu laisses faire : ≈ ${Math.round(odds[k + '0'] * 100)} % pour eux</em><em class="odds ${oddsCls(odds[k])}">Avec l’énergie du Cœur : ≈ ${Math.round(odds[k] * 100)} %</em>` : ''}</button>`).join('')}</div>`, { noClose: true, wide: true, label: 'Invasion' });
  return new Promise(res => m.addEventListener('click', e => { const b = e.target.closest('[data-tac]'); if (!b || b.disabled) return; sfx('tick'); closeModal(true); res(b.dataset.tac); }));
}

/* ---------- l'invasion animée ---------- */
const invT = ms => V.inv && V.inv.fast ? ms / 4 : ms;
function invFastBtn(on) {
  const old = document.getElementById('invFast'); if (old) old.remove(); if (!on) return;
  const b = el('button', 'sbtn invfast', '⏩ Accélérer'); b.id = 'invFast'; b.type = 'button';
  b.addEventListener('click', () => { V.inv.fast = !V.inv.fast; b.textContent = V.inv.fast ? '▶️ Vitesse normale' : '⏩ Accélérer'; sfx('tick'); });
  $('#game').appendChild(b);
}
// la caméra suit la bande de près pendant l'assaut, puis revient sur tout le château
function invCam(on) {
  clearInterval(V.invCamT); V.invCamT = null;
  if (!on) { CAM.user = false; fitCamera(); return; }
  const s1 = clamp(CAM.s * 1.7, CAM.s, Math.min(CAM.max, 1.25));
  V.invCamT = setInterval(() => {
    const L = HEROS.filter(a => !a.down && a.alpha !== 0); if (!L.length || document.hidden) return;
    const mx = L.reduce((a, h) => a + h.x, 0) / L.length, my = L.reduce((a, h) => a + h.y, 0) / L.length, [wx, wy] = WP(mx, my - .3);
    const s = CAM.s + (s1 - CAM.s) * .08, tx = V.w / 2 - wx * s, ty = V.h * .46 - wy * s;
    CAM.s = s; CAM.x += (tx - CAM.x) * .1; CAM.y += (ty - CAM.y) * .1; CAM.user = true;
  }, 16);
}
// avant un combat : la bataille s'arrête, tu peux lancer un pouvoir du Cœur
// les gestes de balade : une barre en bas de l'écran, toujours là pendant l'invasion
function actBar(R, plan) {
  const old = document.getElementById('actBar'); if (old) old.remove();
  const b = el('div', 'actbar panel', ''); b.id = 'actBar'; $('#game').appendChild(b);
  const draw = () => { b.innerHTML = `<span class="ab-tok" title="Énergie du Cœur">${gi('heart')}<b>${R.charges}</b></span>${Object.entries(STEP_ACTS).map(([k, A]) => { const no = R.charges <= 0 || R.used.includes(k) || R.queue.includes(k) || (k === 'or' && S.gold - R.gold < orCost(plan)); return `<button type="button" class="sbtn ab" data-act="${k}" ${no ? 'disabled' : ''} title="${esc(A.desc)}">${A.ico} ${esc(A.name)}${k === 'or' ? ` <small>${orCost(plan)} 💰</small>` : ''}</button>`; }).join('')}`; };
  b.addEventListener('click', e => { const x = e.target.closest('[data-act]'); if (!x || x.disabled) return; R.queue.push(x.dataset.act); sfx('tick'); draw(); });
  draw();
  return { refresh: draw, hide: h => { b.hidden = h; }, remove: () => b.remove() };
}
function askPower(ask, R) {
  return new Promise(res => {
    const old = document.getElementById('powBar'); if (old) old.remove();
    const left = Object.entries(POWERS).filter(([k]) => !R.used.includes(k) && powerOK(k));
    const bar = el('div', 'powbar panel', `<div class="pwhead"><b>⚡ Énergie du Cœur (${R.charges})</b><span>${esc(ask.label)} : ${ask.defs.length} défenseur${ask.defs.length > 1 ? 's' : ''} contre ${ask.party.length} héros${ask.final ? ' · <b>le combat décisif</b>' : ''}</span></div>
      <div class="pwbtns">${left.map(([k, p]) => `<button type="button" class="choice pw" data-pw="${k}"><span class="emo">${p.ico}</span><b>${esc(p.name)}</b><small>${esc(p.desc)}</small></button>`).join('')}<button type="button" class="sbtn pri pwgo" data-pw="">⚔️ Combattre sans rien dépenser</button></div>`);
    bar.id = 'powBar'; $('#game').appendChild(bar); sfx('tick');
    bar.addEventListener('click', e => { const b = e.target.closest('[data-pw]'); if (!b) return; bar.remove(); sfx(b.dataset.pw ? 'chime' : 'tick'); res(b.dataset.pw || null); });
  });
}
function enlist(id, x, y) {
  const a = ACT.get(id); if (!a || a.leaving) return null;
  a.tok++; a.walking = false; if (a.dur) { a.dur = 0; const r = a.res; a.res = null; r && r(); }
  a.fight = true; a.pose = null; if (a.life) { releaseSpot(a.life); a.life.phase = 'idle'; a.life.with = null; }
  const hz = V.heroZ || 0; if ((a.z || 0) !== hz) { a.z = hz; a.x = x; a.y = y; poof(x - .5, y - .5); }
  else moveTo(a, x, y, invT(420)).then(() => { a.walking = false; });
  return a;
}
function hitFx(a, txt, col) { if (!a) return; floatText(a.x - .45, a.y - .45, txt, col); a.hurtUntil = performance.now() + 280; }
const skFx = (a, sk) => { if (a && sk) floatText(a.x - .2, a.y - .9, sk + ' !', '#ffe07a'); };
async function playInvasion(plan, tactic, report) {
  V.inv = { fast: false }; invFastBtn(true); invCam(true);
  HEROS.length = 0;
  plan.party.forEach((h, j) => { const a = newActor('hero' + j, h.minion ? 'char' : 'hero', h.k, GATE.x + .5, H + 1.7); a.hp = h.hp; a.hpMax = h.hp; a.j = j; if (h.minion) { a.sc *= .92; a.foe = plan.rival || true; } HEROS.push(a); });
  const hero = j => HEROS[j], live = () => HEROS.filter(a => !a.down), enlisted = new Map();
  const moveParty = (cx, cy, ms) => { const L = live(); return Promise.all(L.map((a, k) => { a.walking = true; const o = (k - (L.length - 1) / 2) * .18; return moveTo(a, cx + .5 + o, cy + .5 - o * .6 + (k % 2) * .1, invT(ms)).then(() => { a.walking = false; }); })); };
  // tous à leur cible : on fait descendre ceux qui sont à l'étage
  if (tactic === 'cible') { const tg = S.rooms.find(r => r.id === plan.target) || heartRoom(), tz = zOf(tg); S.creatures.filter(fitToFight).forEach(c => { const a = ACT.get(c.id); if (a && (a.z || 0) !== tz) { const [x, y] = randCell(tg); a.tok++; a.walking = false; a.z = tz; a.x = x + .5; a.y = y + .5; } }); }
  await moveParty(GATE.x, H, 800);
  const R = newBattle(plan, tactic), gen = battleGen(plan, R); R.walk = [[GATE.x, GATE.y, 0]]; V.heroZ = 0; R.live = true; R.stepPol = null;
  const bar = actBar(R, plan);
  const path = R.walk; let at = -1, slot = 0;
  // un escalier : la bande disparaît et réapparaît à l'autre étage, et la caméra la suit
  const changeFloor = async ([x, y, z]) => { const L = live(); L.forEach(a => poof(a.x - .5, a.y - .5)); sfx('tick'); await sleep(invT(260)); V.heroZ = z; setFloor(z); L.forEach((a, k) => { a.x = x + .5 + (k - (L.length - 1) / 2) * .18; a.y = y + .5; }); poof(x, y); await sleep(invT(320)); };
  const walkTo = async idx => { for (let k = at + 1; k <= idx && k < path.length; k++) { if ((path[k][2] || 0) !== V.heroZ) await changeFloor(path[k]); else await moveParty(path[k][0], path[k][1], k ? 360 : 520); V.invPath = path.slice(0, k + 1); } at = Math.max(at, idx); };
  const tgRoom = () => S.rooms.find(r => r.id === plan.target) || heartRoom();
  const spot = i => { const [x, y] = path[Math.min(i, path.length - 1)], nx = path[i + 1] || (() => { const h = tgRoom(); return h ? [h.x + (h.w - 1) / 2, h.y + (h.h - 1) / 2] : [x, y]; })(); let dx = nx[0] - x, dy = nx[1] - y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; if (!dx && !dy) dy = -1; return { x: x + .5, y: y + .5, dx, dy }; };
  const place = (sp, id, k, hp, max) => { const o = ((k % 5) - 2) * .3, back = Math.floor(k / 5) * .3, a = enlist(id, sp.x + sp.dx * (.78 + back) - sp.dy * o, sp.y + sp.dy * (.78 + back) + sp.dx * o); if (a) { a.hp = hp; a.hpMax = max; a.flip = sp.dx - sp.dy > 0; enlisted.set(id, a); } return a; };
  const playHits = async (b, sp) => {
    if (b.sk) floatText(sp.x, sp.y - .8, b.sk + ' !', '#ffe07a');
    for (const t of b.hits) {
      if (t.s === 'pw') continue;
      if (t.s === 'sk') { skFx(enlisted.get(t.id), t.sk); await sleep(invT(260)); continue; }
      if (t.s === 'join') {
        if (t.merc) { floatText(sp.x + sp.dx * .8, sp.y + sp.dy * .8 - .4, '⚔️ Les Mercenaires !', '#ffe07a'); continue; }
        const a = place(sp, t.id, slot++, t.hp, t.max); if (a) say(a.id, 'Je prends la relève !', 1300); await sleep(invT(220)); continue;
      }
      if (t.s === 'h') {
        const a = hero(t.j); if (!a) continue;
        if (t.stunned) { floatText(a.x - .3, a.y - .7, '💫', '#cfe0ff'); await sleep(invT(90)); continue; }
        if (t.stun) { skFx(enlisted.get(t.by), t.sk); floatText(a.x - .45, a.y - .45, `💫 ${t.stun} tour${t.stun > 1 ? 's' : ''}`, '#cfe0ff'); a.hurtUntil = performance.now() + 400; sfx('tick'); await sleep(invT(380)); continue; }
        if (t.heal) { a.hp = Math.min(a.hpMax, a.hp + t.heal); floatText(a.x - .45, a.y - .45, `+${t.heal}`, '#9be38a'); const p = hero(t.by); if (p) p.hopUntil = performance.now() + 300; await sleep(invT(150)); continue; }
        const src = t.by === 'merc' || t.by === 'power' ? null : enlisted.get(t.by); if (src) src.hopUntil = performance.now() + 300;
        if (t.sk) skFx(src || a, t.sk);
        a.hp = Math.max(0, a.hp - t.dmg); hitFx(a, `−${t.dmg}`, '#ffb4a0'); sfx('bonk');
        if (t.ko) { a.down = true; a.pose = 'ko'; say(a.id, pick(['Je… reste là.', 'Dites à ma mère…', 'Pouce !']), 1300); }
      } else {
        const a = enlisted.get(t.id), src = hero(t.by); if (src && t.by != null) src.hopUntil = performance.now() + 300;
        if (!a) { if (t.id === 'merc' && t.dmg) floatText(sp.x + sp.dx * .8, sp.y + sp.dy * .8 - .3, `−${t.dmg}`, '#ffd27a'); continue; }
        if (t.miss) { floatText(a.x - .45, a.y - .45, 'Esquive !', '#cfe0ff'); await sleep(invT(160)); continue; }
        if (t.heal && !t.dmg) { a.hp = Math.min(a.hpMax, a.hp + t.heal); floatText(a.x - .45, a.y - .45, `+${t.heal}`, '#9be38a'); if (t.sk) skFx(enlisted.get(t.by) || a, t.sk); await sleep(invT(150)); continue; }
        a.hp = Math.max(0, a.hp - t.dmg); hitFx(a, `−${t.dmg}`, '#ffd27a');
        if (t.rise) { a.pose = 'ko'; await sleep(invT(320)); a.pose = null; a.hp = t.rise; skFx(enlisted.get(t.from) || a, t.sk || 'Debout'); sfx('chime'); }
        else if (t.ko) { a.pose = 'ko'; say(a.id, pick(KO_LINES), 1500); sfx('bad'); }
      }
      await sleep(invT(210));
    }
    await sleep(invT(300));
  };
  const playBeat = async b => {
    if (b.i > at) await walkTo(b.i);
    if (b.k === 'floor') { const a = live()[0]; if (a) say(a.id, pick(['Encore des escaliers…', 'Le Cœur est par là, je le sens.', 'Qui range son Cœur à un autre étage ?', 'Mes genoux…']), 1500); return; }
    const sp = spot(b.i), now = performance.now();
    if (b.k === 'harass') { floatText(sp.x, sp.y - .6, '🪨 Cailloux !', '#ffd27a'); sfx('bonk'); for (const t of b.hits) { const a = hero(t.j); hitFx(a, `−${t.dmg}`, '#ffb4a0'); a.hp = Math.max(0, a.hp - t.dmg); if (t.ko) { a.down = true; a.pose = 'ko'; } } await sleep(invT(700)); }
    else if (b.k === 'smash') { V.hit = { id: b.defId, t: now }; floatText(sp.x, sp.y, 'Crac ! La barricade cède', '#ffd27a'); sfx('bonk'); await sleep(invT(800)); }
    else if (b.k === 'alarm') { V.hit = { id: b.defId, t: now }; floatText(sp.x, sp.y, '🔔 Alarme !', '#ffe07a'); sfx('chime'); await sleep(invT(650)); }
    else if (b.k === 'disarm') { floatText(sp.x, sp.y, 'Désamorcé !', '#cfe0ff'); say(hero(b.j).id, 'Du travail d’amateur.', 1500); sfx('tick'); await sleep(invT(800)); }
    else if (b.k === 'trap' || b.k === 'entry') {
      if (b.defId) V.hit = { id: b.defId, t: now }; sfx('bonk');
      for (const t of b.hits) { const a = hero(t.j); a.hp = Math.max(0, a.hp - t.dmg); hitFx(a, `−${t.dmg}`, '#ffb4a0'); if (t.ko) { a.down = true; a.pose = 'ko'; say(a.id, 'Je… reste là.', 1400); } else if (Math.random() < .6) say(a.id, pick(HERO_LINES.hit), 1500); }
      await sleep(invT(850));
    }
    else if (b.k === 'talk') { const a = hero(b.j); if (a && !a.down) say(a.id, b.text, 1800); }
    else if (b.k === 'visit') {
      const a0 = live()[0]; floatText(sp.x, sp.y - .9, `🚪 ${b.sk} !`, '#ffe07a'); if (a0) say(a0.id, b.text.length > 70 ? b.sk + '…' : b.text, 2000); sfx('tick');
      for (const t of b.hits) {
        const a = t.j != null ? hero(t.j) : null;
        if (t.s === 'loot') floatText(sp.x + .2, sp.y - .5, `${t.g ? '−' + t.g + ' 💰 ' : ''}${t.m ? '−' + t.m + ' 🪵' : ''}`, '#ffd27a');
        else if (t.s === 'break') { floatText(sp.x, sp.y - .3, 'Crac !', '#ffb4a0'); sfx('bonk'); }
        else if (!a) continue;
        else if (t.heal) { a.hp = Math.min(a.hpMax, a.hp + t.heal); floatText(a.x - .45, a.y - .45, `+${t.heal}`, '#9be38a'); }
        else if (t.buff) floatText(a.x - .45, a.y - .45, `+${t.buff} ⚔️`, '#ffe07a');
        else if (t.stun) floatText(a.x - .45, a.y - .45, '💫', '#cfe0ff');
        else if (t.fled) { a.down = true; a.alpha = .35; floatText(a.x - .3, a.y - .6, 'Au secours !', '#cfe0ff'); }
        else if (t.dmg) { a.hp = Math.max(0, a.hp - t.dmg); hitFx(a, `−${t.dmg}`, '#ffb4a0'); if (t.ko) { a.down = true; a.pose = 'ko'; } }
        await sleep(invT(160));
      }
      await sleep(invT(900));
    }
    else if (b.k === 'power') { const P = POWERS[b.p]; floatText(sp.x, sp.y - 1, `${P.ico} ${P.name} !`, '#c9f0ff'); sfx('chime'); await sleep(invT(700)); }
    else if (b.k === 'act') {
      const P = STEP_ACTS[b.a]; floatText(sp.x, sp.y - 1, `${P.ico} ${P.name} !`, '#ffe07a'); sfx(b.a === 'or' ? 'coin' : 'bonk');
      if (b.a === 'or' && b.j != null) { const a = hero(b.j); if (a) { say(a.id, pick(['De l’or ! Je rentre, moi.', 'Chacun pour soi !', 'Ma retraite est faite !']), 1800); a.down = true; a.alpha = .35; } }
      else { const a = live()[0]; if (a) say(a.id, pick(['Qui a fermé cette porte ?', 'On est déjà passés par là…', 'C’est un labyrinthe !']), 1700); }
      await sleep(invT(800));
    }
    else if (b.k === 'engage') {
      slot = b.defs.length;
      if (b.ambush) floatText(sp.x, sp.y - .8, '🗡️ Embuscade !', '#ffe07a');
      b.defs.forEach((d, k) => { if (d.merc) { floatText(sp.x + sp.dx * .8, sp.y + sp.dy * .8 - .4, '⚔️ Les Mercenaires !', '#ffe07a'); return; } place(sp, d.id, k, d.hp, d.max); });
      const a0 = enlisted.get((b.defs.find(d => !d.merc) || {}).id); if (a0) say(a0.id, pick(FIGHT_LINES), 1500);
      await sleep(invT(560));
    }
    else if (b.k === 'round') await playHits(b, sp);
    else if (b.k === 'robbed') { const a = live()[0]; if (a) { say(a.id, pick(HERO_LINES.win), 1900); floatText(a.x, a.y, (INV_GOALS[(plan.goal || {}).k] || INV_GOALS.coeur).ico + ' Mission accomplie !', '#ffe07a'); } sfx('bad'); await sleep(invT(950)); }
    else { const a = live()[0]; if (a) say(a.id, b.k === 'lost' ? 'On est où, là ?' : pick(HERO_LINES.flee), 1900); await sleep(invT(600)); }
  };
  // la bataille avance par à-coups : on anime ce qui s'est passé, puis on demande un pouvoir avant chaque combat
  const step = v => withZ(R.z || 0, () => gen.next(v));
  let k = 0, r = step();
  for (;;) {
    for (; k < R.ev.length; k++) await playBeat(R.ev[k]);
    if (r.done) break;
    if (r.value && r.value.tick) { await walkTo(R.walk.length - 1); bar.refresh(); r = step(null); continue; }   // un pas : tes gestes passent au suivant
    bar.hide(true); const choice = r.value && r.value.ask === 'power' ? await askPower(r.value, R) : r.value && r.value.ask === 'cards' ? await defenseCards(r.value, R, plan) : null; bar.hide(false);
    r = step(choice); bar.refresh();
  }
  bar.remove();
  // les K.O. restent sur place : aux Oubliettes si la bande fuit, sinon ses amis les traînent
  const caught = R.outcome === 'repelled' ? Math.max(0, sumRooms('cells') - S.prisoners) : 0;
  HEROS.filter(a => a.down).forEach((a, kk) => { floatText(a.x - .3, a.y - .3, kk < caught ? '⛓️' : '…', '#cfe0ff'); });
  { const back = path.slice(0, Math.min(at, path.length - 1) + 1).reverse(), seen = new Set(); for (const [x, y, z] of back) { if ((z || 0) !== V.heroZ) break; const kk = y * W + x; if (seen.has(kk)) continue; seen.add(kk); await moveParty(x, y, 150); } }
  if (V.heroZ) { await changeFloor([GATE.x, GATE.y, 0]); }
  await moveParty(GATE.x, H + 1, 520); HEROS.forEach(a => a.alpha = 0); await sleep(invT(250));
  HEROS.length = 0; V.heroZ = 0; invFastBtn(false); invCam(false); V.invPath = null; V.invGoal = null;
  return { R, enlisted };
}
function releaseFighters(enlisted) {
  enlisted.forEach(a => { a.fight = false; a.hp = a.hpMax = null; a.hopUntil = a.hurtUntil = 0; a.pose = null; if (a.life) a.life.phase = 'idle'; });
}
const GOAL_DONE = { coeur: '💔 Le Cœur est pillé', tresor: '💰 Le trésor est vidé', enlever: '🪤 Une créature enlevée', saccage: '🔥 Une pièce saccagée' };
runInvasion = async function (report) {
  const plan = planInvasion(); sfx('horn');
  const tactic = await chooseTactic(plan);
  if (tactic === 'rancon') {
    const lines = payOff(plan); lines.forEach(l => report.push(l)); addLog('Tu as acheté le départ des aventuriers.', '');
    V.invPath = null; V.invGoal = null; renderAll(); await banner('💰 Marché conclu', esc(lines[0][1]), 1800); return;
  }
  plan.tactic = tactic;
  await banner('⚔️ À l’assaut !', `${plan.party.map(h => esc(h.name)).join(' · ')}<br>${(INV_GOALS[plan.goal.k] || INV_GOALS.coeur).ico} ${esc(INV_GOALS[plan.goal.k].name)} · ${TACTICS[tactic].ico} ${esc(TACTICS[tactic].name)}`, 1500);
  const { R, enlisted } = await playInvasion(plan, tactic, report); plan.res = R;
  R.lines.forEach(l => report.push(l));
  const outcome = R.outcome, lines = applyInvasion(plan, outcome); lines.forEach(l => report.push(l));
  releaseFighters(enlisted);
  addLog(outcome === 'robbed' ? `Des héros ont atteint leur but : ${INV_GOALS[plan.goal.k].name.toLowerCase()}.` : 'Invasion repoussée !', outcome === 'robbed' ? 'bad' : 'good');
  if (outcome !== 'robbed') sfx('chime');
  renderAll();
  await banner(outcome === 'robbed' ? (GOAL_DONE[plan.goal.k] || GOAL_DONE.coeur) : outcome === 'lost' ? '🌀 Ils rebroussent chemin' : '🎉 Invasion repoussée !', lines[0] ? esc(lines[0][1]) : '', 2100);
};

/* ---------- les créatures sonnées se reposent ; celles qui se battent ne flânent pas ---------- */
const lifeTickBase = lifeTick;
lifeTick = function (a, force) { if (a.fight) return; return lifeTickBase(a, force); };
const planActBase = planAct;
planAct = function (c, a) {
  if (injured(c)) {
    const L = lifeOf(a), bed = findTarget(c, a, 'dormir', null);
    if (bed) return setGoal(a, L, 'dormir', bed);
    const q = findTarget(c, a, 'rever', null); if (q) return setGoal(a, L, 'rever', q);
  }
  return planActBase(c, a);
};

/* ---------- barres de vie ---------- */
function hpBar(sx, sy, hp, max, hero) {
  const w = clamp(30 * CAM.s * 1.5, 22, 40), h = 5, x = sx - w / 2, k = clamp(hp / max, 0, 1);
  ctx.fillStyle = 'rgba(20,12,10,.88)'; rr(ctx, x - 1.5, sy - 1.5, w + 3, h + 3, 3); ctx.fill();
  if (k > 0) { ctx.fillStyle = hero ? (k > .5 ? '#f0a43a' : k > .25 ? '#e0702a' : '#d23a2a') : (k > .5 ? '#72d35c' : k > .25 ? '#d9c43a' : '#d9542f'); rr(ctx, x, sy, w * k, h, 2); ctx.fill(); }
}

/* ---------- le chemin des héros, et le détour qu'une barricade imposerait ---------- */
function drawHeroPath(p, alpha, col) {
  if (!p || p.length < 2) return;
  const pts = p.map(([x, y]) => WP(x + .5, y + .5)); ctx.save(); ctx.globalAlpha = alpha; glowPath(pts, col, false, 1, [14, 10]);
  const [ex, ey] = pts[pts.length - 1]; ctx.beginPath(); ctx.ellipse(ex, ey, 26, 13, 0, 0, 7); ctx.strokeStyle = `rgba(${col},.9)`; ctx.lineWidth = 2 / CAM.s; ctx.stroke(); ctx.restore();
}
function pathOverlay() {
  if (V.invGoal) { const r = S.rooms.find(o => o.id === V.invGoal); if (r && zOf(r) === Z) groupOf(r).rooms.forEach(o => glowPath(footprint(o), '255,110,90', true, 1.1 + .4 * Math.abs(Math.sin(performance.now() / 400)))); }
  if (V.invPath) { drawHeroPath(V.invPath.filter(c => (c[2] || 0) === Z), 1, '255,150,120'); return; }   // pendant une invasion : le chemin que la bande a vraiment pris
  if (Z !== 0) return;
  const hand = false;   // plus de chemin des héros (les invasions traversent des pièces tirées au hasard, p69)
  if (!V.showPath && !hand) return;
  const p = heroPath(), g = V.ghost, D = hand && DEFS[UI.hand.t];
  const alt = D && D.block && g && g.ok ? heroPath([g.ax, g.ay]) : null;
  const same = alt && p && alt.length === p.length && alt.every(([x, y], i) => p[i][0] === x && p[i][1] === y);
  drawHeroPath(p, alt && !same ? .3 : 1, '255,228,150');
  if (alt && !same) drawHeroPath(alt, 1, '80,170,255');
}
const updateGhostBase = updateGhost;
updateGhost = function (pt) {
  updateGhostBase(pt);
  const g = V.ghost; if (!UI.hand || UI.hand.kind !== 'def' || !g || !g.ok || !(DEFS[UI.hand.t] || {}).block) return;
  const cur = heroPath(), alt = heroPath([g.ax, g.ay]); if (!cur || !alt) return;
  const key = 'blk' + g.ax + ',' + g.ay; if (UI.ghostKey === key) return; UI.ghostKey = key;
  const d = alt.length - cur.length, onPath = cur.some(([x, y]) => x === g.ax && y === g.ay);
  renderHand(!onPath ? 'Ce couloir n’est pas sur leur chemin pour l’instant : la barricade ne change rien.' : d > 0 ? `Détour : ${alt.length - 1} pas au lieu de ${cur.length - 1}. Le nouveau chemin s’affiche en bleu.` : 'Les héros passeront ailleurs, sans faire plus de chemin (chemin bleu).', 'ok');
};
