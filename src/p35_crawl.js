
/* =========================================================
   Expéditions, façon Slay the Spire : une équipe de 4 créatures
   au plus, un deck de cartes tiré de ton château (les créatures
   de l'équipe, tes meubles, tes pièges), de l'énergie, une main
   de 5 cartes ; en face, des ennemis dont on voit toujours la
   prochaine action. Trois étages de salles au choix, le boss au
   bout, et après chaque salle le choix : continuer, ou rentrer
   avec le butin.
   Les donjons rivaux, la Forêt enchantée, les Grottes et le Siège
   de Mirebrume se font ainsi ; les raids aux dés restent pour les
   villages, les fermes et les autres lieux des humains.
   Ce fichier : les règles (sans affichage), jouables par le
   simulateur ; l'écran est dans p36_crawl_ui.js.
   ========================================================= */
const CRAWL_FLOORS = 3, CRAWL_STEPS = 3, STRESS_MAX = 10, HAND_SIZE = 5, ENERGY = 3, BAG_SIZE = 4;
// le niveau du donjon suit la renommée de tes champions (tes 4 meilleures créatures) : plus ils sont forts, plus le donjon se prépare
const CRAWL_GOLD = .75;   // l'or des expéditions (combats, trésors, coffres)
const CRAWL_TUNE = { hpL: .25, dmgL: .7, hpF: .65, dmgF: 3.5, boss: 1.2, p0: 220, pk: 160 };
function crawlChampions() { return S.creatures.filter(c => !isOut(c)).map(c => crawler(c)).map(p => p.hp * p.atk).sort((a, b) => b - a).slice(0, 4).reduce((a, v) => a + v, 0); }
const crawlLevel = () => Math.round((1 + Math.max(0, (crawlChampions() - CRAWL_TUNE.p0) / CRAWL_TUNE.pk)) * 10) / 10;
// un donjon rival grandit avec toi (+0,5 niveau par palier), se prépare après chaque défaite (+0,25 par point de vassalité pris chez lui), et tous se méfient d'un suzerain (+0,25 par vassal)
// le Siège de Mirebrume, lui, a son propre niveau, quartier par quartier (siegeLvl, p25)
const crawlResist = dg => { if (dg === 'cite' && typeof siegeLvl === 'function') return siegeLvl(); if (typeof vicState !== 'function' || typeof RIVALS === 'undefined' || !RIVALS.some(r => r.id === dg)) return 0; const v = vicState().vassals || {}; return .5 * (S.tier || 0) + .25 * (v[dg] || 0) + .25 * Object.keys(v).filter(k => typeof isVassal === 'function' && isVassal(k)).length; };

/* ---------- les ennemis : leurs actions tournent en boucle (on voit toujours la prochaine) ---------- */
const CRAWL_EN = {
  sq:     { name: 'Squelette de garde', sp: 'squelette', hp: 12, acts: [['atk', 4], ['block', 5], ['atk', 5]], rise: 3 },
  spec:   { name: 'Spectre gémissant', sp: 'fantome', hp: 7, acts: [['fear', 2], ['atk', 4], ['fear', 2]] },
  aco:    { name: 'Acolyte nécromant', emo: '🧟', hp: 11, acts: [['heal', 4], ['atk', 3], ['summon', 'sq']] },
  chev:   { name: 'Chevalier d’os', emo: '💀', hp: 30, elite: 1, pow: 'riposte', acts: [['atk', 8], ['block', 8], ['execute', 10], ['multi', 4, 2]] },
  ysolde: { name: 'Ysolde la nécromancienne', emo: '🧙‍♀️', hp: 56, boss: 1, acts: [['summon', 'sq'], ['aoe', 4], ['fearall', 2], ['drain', 9]], leg: [['raise', 'sq'], ['souldrain', 2]], rage: [['aoe', 6], ['drain', 12], ['summon', 'spec'], ['fearall', 3]], p2: 'necro' },
  gob:    { name: 'Gobelin pochtron', sp: 'gobelin', hp: 8, acts: [['atk', 4], ['atk', 3], ['steal', 3]] },
  orq:    { name: 'Orque videur', sp: 'orque', hp: 16, acts: [['atk', 6], ['block', 5], ['atk', 7]] },
  bra:    { name: 'Brasseur', emo: '🍺', hp: 10, acts: [['buff', 1], ['heal', 5], ['atk', 3]] },
  ogre:   { name: 'Ogre de la cave', emo: '👹', hp: 34, elite: 1, pow: 'rage', acts: [['atk', 10], ['smash', 10], ['aoe', 4]] },
  krouk:  { name: 'Krouk, baron gobelin', sp: 'gobelin', hp: 72, boss: 1, acts: [['buff', 1], ['multi', 3, 3], ['summon', 'gob'], ['atk', 12]], leg: [['round', 4], ['throw', 4, 2]], rage: [['multi', 4, 3], ['atk', 15], ['round', 6], ['throw', 6, 3]], p2: 'ivresse' },
  crap:   { name: 'Crapaud baveux', sp: 'crapaud', hp: 11, acts: [['poison', 2], ['atk', 4]] },
  ara:    { name: 'Araignée des cavernes', sp: 'araignee', hp: 13, acts: [['stun'], ['atk', 5], ['atk', 4]] },
  cha:    { name: 'Champignon hurleur', emo: '🍄', hp: 8, acts: [['fearall', 2], ['block', 4]] },
  tis:    { name: 'Grande Tisseuse', sp: 'araignee', hp: 32, elite: 1, pow: 'venin', acts: [['stun'], ['multi', 3, 3], ['cocoon', 2]] },
  mere:   { name: 'Mère-Crapaud', sp: 'crapaud', hp: 76, boss: 1, acts: [['summon', 'crap'], ['poisonall', 2], ['atk', 10], ['heal', 8]], leg: [['grab', 6], ['spawn', 'crap']], rage: [['toxic', 2], ['atk', 12], ['grab', 7], ['heal', 8]], p2: 'maree' },
  bat:    { name: 'Chauve-souris', emo: '🦇', hp: 9, acts: [['drain', 3], ['drain', 4]] },
  garg:   { name: 'Gargouille de façade', sp: 'gargouille', hp: 14, acts: [['block', 7], ['atk', 6]] },
  vamp:   { name: 'Vampirette', sp: 'vampire', hp: 13, acts: [['fear', 2], ['drain', 6]] },
  maj:    { name: 'Majordome éternel', emo: '🎩', hp: 32, elite: 1, pow: 'service', acts: [['buff', 2], ['atk', 7], ['serve', 6]] },
  pale:   { name: 'Comte Pâlefroid', sp: 'vampire', hp: 80, boss: 1, acts: [['drain', 9], ['summon', 'bat'], ['fearall', 2], ['aoe', 4]], leg: [['swarm', 2, 3], ['charm']], rage: [['drain', 12], ['swarm', 4, 3], ['aoe', 6], ['fearall', 3]], p2: 'brume' },
  // la Forêt enchantée
  lutin:  { name: 'Lutin farceur', emo: '🧝', hp: 9, acts: [['steal', 3], ['atk', 4], ['fear', 2]] },
  loup:   { name: 'Loup-garou', emo: '🐺', hp: 12, acts: [['atk', 5], ['multi', 3, 2], ['atk', 6]] },
  ronce:  { name: 'Ronces vivantes', emo: '🌿', hp: 14, acts: [['block', 6], ['poison', 2], ['atk', 5]] },
  vexe:   { name: 'Champignon vexé', emo: '🍄', hp: 8, acts: [['fearall', 2], ['poison', 2]] },
  chene:  { name: 'Vieux Chêne grincheux', emo: '🌳', hp: 38, elite: 1, pow: 'ecorce', acts: [['block', 8], ['atk', 9], ['roots', 4]] },
  reine:  { name: 'La Reine des Lucioles', emo: '🧚', hp: 72, boss: 1, acts: [['fearall', 3], ['summon', 'lutin'], ['aoe', 6], ['drain', 8]], leg: [['blind'], ['spawn', 'lutin']], rage: [['aoe', 8], ['drain', 10], ['blind'], ['fearall', 3]], p2: 'lucioles' },
  // les Grottes
  rat:    { name: 'Rat géant', emo: '🐀', hp: 10, acts: [['atk', 5], ['poison', 2]] },
  gelee:  { name: 'Gelée verdâtre', emo: '🟢', hp: 18, acts: [['block', 6], ['atk', 5], ['poison', 3]] },
  kobs:   { name: 'Kobold des profondeurs', sp: 'kobold', hp: 11, acts: [['atk', 6], ['steal', 4], ['atk', 5]] },
  golemc: { name: 'Golem de cristal', emo: '💎', hp: 44, elite: 1, pow: 'cristal', acts: [['block', 10], ['atk', 12], ['shatter', 6]] },
  basil:  { name: 'Le Basilic', emo: '🐍', hp: 92, boss: 1, acts: [['stun'], ['poisonall', 2], ['atk', 14], ['multi', 5, 3]], leg: [['petrify'], ['tailall', 4]], rage: [['multi', 6, 3], ['tailall', 7], ['petrify'], ['atk', 17]], p2: 'mue' },
  // les Ruines
  momie:   { name: 'Momie ensablée', emo: '🧟', hp: 13, acts: [['atk', 5], ['poison', 2], ['atk', 4]] },
  armure:  { name: 'Armure vide', emo: '⛑️', hp: 15, acts: [['block', 7], ['atk', 6], ['atk', 7]] },
  mimic:   { name: 'Coffre mimique', sp: 'mimique', hp: 11, acts: [['steal', 4], ['atk', 6], ['block', 4]] },
  follet:  { name: 'Feu follet', emo: '✨', hp: 7, acts: [['fear', 2], ['atk', 4], ['fearall', 1]] },
  gardien: { name: 'Gardien du sceau', emo: '🗿', hp: 36, elite: 1, pow: 'sceau', acts: [['smash', 13], ['block', 7], ['atk', 11], ['multi', 5, 2]] },
  roi:     { name: 'Le Roi sans Couronne', emo: '👑', hp: 70, boss: 1, acts: [['summon', 'armure'], ['atk', 11], ['fearall', 2], ['drain', 8]], leg: [['decree'], ['raise', 'momie']], rage: [['atk', 15], ['aoe', 6], ['decree'], ['drain', 11]], p2: 'couronne' },
};
const CRAWL_DG = {
  morgrave:   { regs: ['sq', 'spec', 'aco'], elite: 'chev', boss: 'ysolde', relic: 'grimoireys', desc: 'Des morts qui ne restent pas couchés, et une peur qui colle aux os.' },
  septbieres: { regs: ['gob', 'orq', 'bra'], elite: 'ogre', boss: 'krouk', relic: 'chope', desc: 'Des brutes avinées qui frappent fort et se soignent à la bière.' },
  moussues:   { regs: ['crap', 'ara', 'cha'], elite: 'tis', boss: 'mere', relic: 'champi', desc: 'Poisons, toiles et spores : on s’y englue, on s’y empoisonne.' },
  ombrelune:  { regs: ['bat', 'garg', 'vamp'], elite: 'maj', boss: 'pale', relic: 'cape', desc: 'Des buveurs de sang qui guérissent en te mordant.' },
  foret:      { regs: ['lutin', 'loup', 'ronce', 'vexe'], elite: 'chene', boss: 'reine', relic: 'gland', site: 1, emo: '🌲', desc: 'Les arbres y chuchotent, les lutins y chapardent, et la Reine des Lucioles n’aime pas les visiteurs.' },
  grotte:     { regs: ['rat', 'gelee', 'kobs', 'bat'], elite: 'golemc', boss: 'basil', relic: 'pierre', site: 1, emo: '🕳️', desc: 'Des galeries qui résonnent, des choses qui préfèrent le noir, et tout au fond, un regard qui pétrifie.' },
  ruines:     { regs: ['momie', 'armure', 'mimic', 'follet'], elite: 'gardien', boss: 'roi', relic: 'couronne', site: 1, emo: '🏛️', desc: 'Des pierres qui se souviennent, des armures sans personne dedans, et un roi qui cherche encore sa couronne.' },
};
// les élites : une capacité qui ne les quitte pas, et une action d'élite dans leur répertoire
const ELITE_POW = {   // v (et buff, max) : les chiffres de la capacité, réglables dans l'Atelier ; {v} dans la description est remplacé par sa valeur
  riposte: { ico: '🦴', name: 'Riposte', v: 3, desc: 'Qui le frappe prend {v} en retour.' },
  rage:    { ico: '😡', name: 'Rage', v: 1, max: 6, desc: '+{v} de force à chaque coup reçu (jusqu’à {max}).' },
  venin:   { ico: '☠️', name: 'Venin', v: 1, desc: 'Ses coups empoisonnent ({v}).' },
  service: { ico: '🎩', name: 'Service', v: 8, buff: 2, desc: 'Quand un allié tombe : +{v} parade et +{buff} force.' },
  ecorce:  { ico: '🌳', name: 'Écorce', v: 6, desc: '+{v} parade au début de chacun de ses tours.' },
  cristal: { ico: '💎', name: 'Cristal', v: 3, desc: 'Chaque coup reçu fait {v} de moins.' },
  sceau:   { ico: '🗿', name: 'Sceau', v: 8, desc: 'Aucun coup ne lui fait plus de {v} dégâts.' },
};
const powV = (k, f = 'v', d = 0) => { const P = ELITE_POW[k]; return P && typeof P[f] === 'number' ? P[f] : d; };
const powDesc = k => { const P = ELITE_POW[k]; return P ? String(P.desc || '').replace(/\{(\w+)\}/g, (m, f) => P[f] != null ? P[f] : m) : ''; };
// les boss : une action légendaire en plus à chaque tour, annoncée d'avance, et la fureur à mi-vie (un répertoire plus dur)
const BOSS_P2 = {
  necro:    'Ysolde relève deux squelettes et la peur gagne toute l’équipe (+2).',
  ivresse:  'Krouk vide un tonneau : +3 de force et 10 PV.',
  maree:    'Une marée toxique : poison 3 sur toute l’équipe.',
  brume:    'Le Comte se change en brume : les 2 prochaines attaques le traversent, et il reprend 12 PV.',
  lucioles: 'La danse des lucioles : tous les ennemis récupèrent 10 PV, et l’équipe a peur (+2).',
  mue:      'Le Basilic mue : il se débarrasse de tout (sonné, affaibli, poison) et gagne 20 de parade.',
  couronne: 'Le Roi retrouve sa couronne fantôme : +1 de force, une armure vide se relève pour le servir, et la peur gagne l’équipe (+1).',
};
// les reliques : trouvées sur les boss, elles servent pour toutes les expéditions suivantes
const RELICS = {
  grimoireys: { ico: '📕', name: 'Grimoire d’Ysolde', desc: 'La première attaque de chaque combat fait +3 dégâts.' },
  chope:      { ico: '🍺', name: 'Chope de Krouk', desc: 'Après chaque combat, chaque créature récupère 3 PV.' },
  champi:     { ico: '🍄', name: 'Champignon de Mère-Crapaud', desc: 'La peur monte deux fois moins vite.' },
  cape:       { ico: '🦇', name: 'Cape d’Ombrelune', desc: 'La première attaque ennemie de chaque combat rate.' },
  gland:      { ico: '🌰', name: 'Gland de la Reine', desc: 'Au premier tour de chaque combat, pioche 2 cartes de plus.' },
  pierre:     { ico: '🪨', name: 'Pierre-écho du Basilic', desc: '+1 énergie au premier tour de chaque combat.' },
  couronne:   { ico: '👑', name: 'Couronne fêlée du Roi', desc: 'Au premier tour de chaque combat, toute l’équipe gagne 5 de parade.' },
};
const hasRelic = k => !!(S.relics && S.relics.includes(k));
const NODES = { combat: { ico: '⚔️', name: 'Combat' }, elite: { ico: '💀', name: 'Élite' }, tresor: { ico: '💰', name: 'Trésor' }, repos: { ico: '🔥', name: 'Repos' }, event: { ico: '❓', name: 'Mystère' }, boss: { ico: '👑', name: 'Le boss' } };

/* ---------- les cartes ----------
   cost : énergie ; tgt : enemy (un ennemi), allfoes (tous), rnd (au hasard), ally (une alliée), allies (toute l'équipe), self, none, ko (une alliée K.O.)
   dmg (+ la force de la créature × atk), hits, blk (+ moitié de la garde si grd), heal, calm (peur en moins), cure (poison), buff (force pour le combat),
   stun (actions perdues), weak [v, tours] (frappe v de moins), poison, trap, draw, nrg, revive, evade, decoy, taunt, confuse, bribe,
   fear (peur en plus pour l'équipe : le prix), exhaust (une fois par combat) */
const CARD_BASE = {
  frappe:  { name: 'Frappe', ico: '⚔️', cost: 1, tgt: 'enemy', dmg: 3, atk: 1 },
  parade:  { name: 'Parade', ico: '🛡️', cost: 1, tgt: 'ally', blk: 5, grd: 1 },
  legende: { el: 'force', name: 'Coup de légende', ico: '🌟', cost: 2, tgt: 'enemy', dmg: 14 },
  griffe:  { name: 'Élan', ico: '🐾', cost: 1, tgt: 'enemy', dmg: 5, atk: 1 },
};
// le talent de chaque espèce devient sa carte
const CRAWL_SK = {
  diablotin: { name: 'Esquive', ico: '💨', cost: 0, tgt: 'self', evade: 1, draw: 1 },
  gobelin:   { el: 'perforant', name: 'Coup bas', ico: '🗡️', cost: 1, tgt: 'enemy', dmg: 2, atk: 1, fx: 'lowbonus', note: '+5 contre un ennemi déjà à moitié' },
  kobold:    { name: 'Piège à ressort', ico: '⚙️', cost: 1, tgt: 'none', trap: 8 },
  crapaud:   { name: 'Langue collante', ico: '👅', cost: 1, tgt: 'enemy', stun: 1 },
  gargouille:{ name: 'Statue', ico: '🗿', cost: 1, tgt: 'self', blk: 9, taunt: 1 },
  menestrel: { name: 'Chanson', ico: '🎵', cost: 1, tgt: 'allies', buff: 1, calm: 2 },
  troll:     { el: 'contondant', name: 'Coup de massue', ico: '🔨', cost: 2, tgt: 'enemy', dmg: 6, atk: 2 },
  fantome:   { name: 'Effroi', ico: '👻', cost: 1, tgt: 'enemy', weak: [3, 2] },
  sorciere:  { name: 'Potion de sorcière', ico: '🧪', cost: 1, tgt: 'ally', heal: 8 },
  squelette: { name: 'Mur d’os', ico: '🦴', cost: 1, tgt: 'ally', blk: 9 },
  orque:     { el: 'tranchant', name: 'Rage', ico: '😤', cost: 1, tgt: 'enemy', dmg: 3, atk: 1, fx: 'rage', note: '+5 si l’orque a perdu la moitié de ses PV' },
  araignee:  { name: 'Toile', ico: '🕸️', cost: 1, tgt: 'enemy', stun: 1 },
  dragonnet: { el: 'feu', name: 'Souffle', ico: '🔥', cost: 2, tgt: 'allfoes', dmg: 6 },
  mimique:   { el: 'perforant', name: 'Gueule', ico: '🪤', cost: 2, tgt: 'enemy', dmg: 4, atk: 2, fx: 'surprise', note: '+6 au premier tour d’un combat' },
  vampire:   { el: 'necrotique', name: 'Morsure', ico: '🩸', cost: 1, tgt: 'enemy', dmg: 3, atk: 1, fx: 'drain', note: 'récupère la moitié des dégâts' },
  golem:     { name: 'Rempart', ico: '🧱', cost: 2, tgt: 'allies', blk: 6 },
  fee:       { name: 'Crapaudification', ico: '🐸', cost: 2, tgt: 'enemy', stun: 2, exhaust: 1 },
  liche:     { name: 'Nécromancie', ico: '💀', cost: 2, tgt: 'ko', revive: .5, exhaust: 1 },
  harpie:    { el: 'tonnerre', name: 'Cri perçant', ico: '📢', cost: 1, tgt: 'allfoes', dmg: 2, weak: [1, 1] },
  cocatrice: { el: 'force', name: 'Regard pétrifiant', ico: '👁️', cost: 2, tgt: 'enemy', dmg: 4, stun: 1 },
  mandragore:{ name: 'Hurlement', ico: '🌱', cost: 1, tgt: 'allfoes', weak: [2, 2] },
  nixe:      { el: 'froid', name: 'Vague', ico: '🌊', cost: 1, tgt: 'enemy', dmg: 2, atk: 1, splash: 3 },
  goule:     { el: 'tranchant', name: 'Dévorer', ico: '🍖', cost: 1, tgt: 'enemy', dmg: 3, atk: 1, fx: 'devour', note: 'si l’ennemi tombe, la goule récupère 6 PV' },
  nainsombre:{ el: 'contondant', name: 'Coup d’enclume', ico: '🔨', cost: 2, tgt: 'enemy', dmg: 5, atk: 1, stun: 1 },
};
// ce que ton château met dans le sac : chaque carte vient d'un meuble (ou d'un piège) posé chez toi
const CASTLE_CARDS = {
  chou:      { name: 'Chou du potager', ico: '🥬', cost: 1, tgt: 'ally', heal: 6, from: ['choux'] },
  champi:    { name: 'Champignon douteux', ico: '🍄', cost: 0, tgt: 'ally', heal: 5, fx: 'risky', note: '1 fois sur 3, empoisonne (2)', from: ['champis'] },
  navet:     { name: 'Navet', ico: '🥕', cost: 0, tgt: 'ally', heal: 3, from: ['tonneau'] },
  ragout:    { name: 'Ragoût', ico: '🍲', cost: 2, tgt: 'allies', heal: 4, from: ['chaudron', 'chaudronmamie'] },
  jambon:    { name: 'Jambon pendu', ico: '🍖', cost: 1, tgt: 'ally', heal: 4, calm: 2, from: ['jambons', 'broche'] },
  festin:    { name: 'Festin', ico: '🍗', cost: 2, tgt: 'allies', heal: 7, exhaust: 1, from: ['banquet'] },
  serre:     { name: 'Légumes de serre', ico: '🥒', cost: 1, tgt: 'ally', heal: 8, from: ['serre', 'melon'] },
  miel:      { name: 'Miel', ico: '🍯', cost: 1, tgt: 'allies', heal: 2, cure: 1, from: ['ruche'] },
  poisson:   { name: 'Poisson frais', ico: '🐟', cost: 1, tgt: 'ally', heal: 6, from: ['barque', 'ponton'] },
  recette:   { name: 'Recette interdite', ico: '📕', cost: 1, tgt: 'ally', heal: 11, fear: 2, from: ['grimoire'] },
  lits:      { name: 'Sieste réparatrice', ico: '🛏️', cost: 1, tgt: 'allies', heal: 3, from: ['paillasse', 'litsup', 'baldaquin', 'grandlit', 'nid'] },
  // la basse-cour, le jardin des simples, la mare, le jardin suspendu, la volière
  oeuf:      { name: 'Œuf du jour', ico: '🥚', cost: 0, tgt: 'ally', heal: 3, calm: 1, from: ['nichoir', 'juchoir'] },   // les poules qui pondent (les mêmes que les œufs de la cuisine)
  poignee:   { name: 'Poignée de grain', ico: '🌾', cost: 0, tgt: 'enemy', weak: [2, 1], from: ['grain'] },   // en pleine figure
  cataplasme:{ name: 'Cataplasme d’herbes', ico: '🌿', cost: 1, tgt: 'ally', heal: 4, cure: 1, from: ['herbes'] },
  arrosage:  { el: 'froid', name: 'Douche froide', ico: '🚿', cost: 0, tgt: 'enemy', dmg: 2, weak: [1, 1], from: ['arrosoir'] },
  sarbacane: { el: 'perforant', name: 'Sarbacane de roseau', ico: '🎋', cost: 1, tgt: 'enemy', dmg: 2, poison: 2, from: ['roseaux'] },
  tonnelle:  { name: 'Sous la tonnelle', ico: '🌸', cost: 1, tgt: 'allies', heal: 1, calm: 2, from: ['tonnelle'] },
  nuee:      { el: 'perforant', name: 'Nuée d’oiseaux', ico: '🐦', cost: 1, tgt: 'rnd', dmg: 2, hits: 3, from: ['mangeoire'] },
  hallebarde:{ el: 'tranchant', name: 'Hallebarde', ico: '🔱', cost: 1, tgt: 'enemy', dmg: 8, from: ['ratelier'] },
  affute:    { name: 'Lame affûtée', ico: '⚒️', cost: 0, tgt: 'ally', buff: 2, from: ['enclume'] },
  // l'atelier : l'établi répare, la caisse à outils fournit de quoi taper ; la mine
  bricolage: { name: 'Rafistolage', ico: '🩹', cost: 1, tgt: 'ally', blk: 6, heal: 3, from: ['etabli', 'pedale'] },   // l'établi à pédale (de qualité) la donne améliorée
  cle:       { el: 'contondant', name: 'Clé à molette', ico: '🔧', cost: 0, tgt: 'enemy', dmg: 3, from: ['caisse'] },
  wagonnet:  { el: 'contondant', name: 'Wagonnet fou', ico: '🛒', cost: 2, tgt: 'enemy', dmg: 10, splash: 3, from: ['wagonnet'] },
  pioche:    { el: 'perforant', name: 'Coup de pioche', ico: '⛏️', cost: 1, tgt: 'enemy', dmg: 7, pierce: 1, from: ['filon'] },
  etai:      { name: 'Étayer', ico: '🪵', cost: 1, tgt: 'allies', blk: 3, from: ['etai'] },
  braises:   { el: 'feu', name: 'Braises', ico: '🔥', cost: 1, tgt: 'allfoes', dmg: 4, from: ['fourneau', 'hautfourneau'] },
  pilon:     { el: 'contondant', name: 'Marteau-pilon', ico: '🔨', cost: 2, tgt: 'enemy', dmg: 16, from: ['pilon'] },
  armure:    { name: 'Armure', ico: '🛡️', cost: 1, tgt: 'ally', blk: 9, from: ['armure'] },
  heaume:    { name: 'Heaume cabossé', ico: '⛑️', cost: 1, tgt: 'ally', blk: 7, taunt: 1, from: ['heaume'] },
  epeefaux:  { el: 'tonnerre', name: 'Épée qui chante faux', ico: '🎶', cost: 0, tgt: 'enemy', dmg: 5, weak: [1, 1], from: ['epeefaux'] },
  dent:      { el: 'perforant', name: 'Dent de dragon', ico: '🦷', cost: 2, tgt: 'enemy', dmg: 12, pierce: 1, from: ['dentdragon'] },
  cailloux:  { el: 'contondant', name: 'Volée de cailloux', ico: '🪨', cost: 1, tgt: 'rnd', dmg: 3, hits: 3, from: ['longuevue', 'perchoir'] },
  boulet:    { el: 'contondant', name: 'Boulet de catapulte', ico: '☄️', cost: 2, tgt: 'enemy', dmg: 11, splash: 4, from: ['catapulte'] },   // la catapulte, chère et encombrante, frappe fort et éclabousse
  vent:      { name: 'Vent tournant', ico: '🌬️', cost: 0, tgt: 'none', draw: 2, from: ['girouette'] },
  flammes:   { el: 'feu', name: 'Sort de flammes', ico: '✨', cost: 2, tgt: 'allfoes', dmg: 6, from: ['etagere', 'rayonnage'] },
  page:      { name: 'Page cornée', ico: '📖', cost: 0, tgt: 'none', draw: 1, from: ['pupitre'] },
  astro:     { name: 'Astrologie', ico: '🔭', cost: 0, tgt: 'none', draw: 1, nrg: 1, exhaust: 1, from: ['globe'] },
  sieste:    { name: 'Petite sieste', ico: '💤', cost: 1, tgt: 'allies', calm: 3, from: ['fauteuil', 'canape'] },
  potion:    { name: 'Potion du labo', ico: '⚗️', cost: 1, tgt: 'ally', heal: 7, from: ['alambic'] },
  brouet:    { el: 'acide', name: 'Brouet toxique', ico: '🫕', cost: 1, tgt: 'enemy', dmg: 3, poison: 3, from: ['marmite'] },
  fiole:     { el: 'acide', name: 'Fiole explosive', ico: '💥', cost: 1, tgt: 'enemy', dmg: 7, splash: 3, from: ['fioles'] },
  elixirvie: { name: 'Élixir de vie', ico: '🧉', cost: 1, tgt: 'ko', revive: .5, exhaust: 1, from: ['athanor'] },   // (la clé « elixir » est l'Élixir de bravoure du Labo, p71)
  chaines:   { name: 'Chaînes', ico: '⛓️', cost: 2, tgt: 'enemy', stun: 1, from: ['cage', 'chaines'] },
  ossements: { el: 'contondant', name: 'Pluie d’ossements', ico: '🦴', cost: 1, tgt: 'allfoes', dmg: 2, from: ['ossuaire'] },
  saule:     { name: 'Branches du saule', ico: '🌳', cost: 1, tgt: 'allfoes', weak: [1, 2], from: ['saule'] },
  escalier:  { name: 'Tenir l’escalier', ico: '🪜', cost: 1, tgt: 'ally', blk: 6, taunt: 1, from: ['colimacon', 'montee'] },
  ordre:     { name: 'Ordre du Maître', ico: '👑', cost: 0, tgt: 'none', nrg: 1, draw: 1, exhaust: 1, from: ['trone'] },
  banniere:  { name: 'Bannière', ico: '🚩', cost: 1, tgt: 'allies', buff: 1, from: ['banniere'] },
  chanson:   { name: 'Chanson à boire', ico: '🎤', cost: 1, tgt: 'allies', calm: 3, draw: 1, from: ['scene', 'piste'] },
  chope:     { name: 'Chope', ico: '🍺', cost: 0, tgt: 'none', nrg: 1, fear: 1, from: ['biere', 'comptoir'] },
  tournee:   { name: 'Tournée générale', ico: '🍻', cost: 1, tgt: 'ally', calm: 4, draw: 1, from: ['tablee'] },
  orgue:     { name: 'Orgue lugubre', ico: '🎹', cost: 1, tgt: 'allfoes', weak: [2, 1], from: ['orgue'] },
  torche:    { el: 'feu', name: 'Torche', ico: '🔦', cost: 0, tgt: 'enemy', dmg: 2, from: ['torche', 'candelabre', 'lustre'] },   // gratuite et facile à avoir : 2 ; le lustre (de qualité) la donne améliorée
  potdevin:  { name: 'Pot-de-vin', ico: '💰', cost: 1, tgt: 'enemy', bribe: 12, from: ['tasdor', 'coffreor', 'montagnedor'] },
  miroir:    { name: 'Miroir qui ment', ico: '🪞', cost: 1, tgt: 'enemy', confuse: 1, from: ['miroir'] },
  toile:     { name: 'Toile collante', ico: '🕸️', cost: 1, tgt: 'enemy', weak: [3, 1], from: ['toile'] },
  os:        { name: 'Os à ronger', ico: '🦴', cost: 0, tgt: 'ally', calm: 2, from: ['os'] },
  cristal:   { name: 'Éclat de cristal', ico: '💎', cost: 1, tgt: 'none', draw: 2, nrg: 1, exhaust: 1, from: ['cristal', 'cranecristal'] },
  epouvantail:{ name: 'Épouvantail', ico: '🎃', cost: 1, tgt: 'none', decoy: 1, from: ['epouvantail'] },
  chaussettes:{ name: 'Chaussettes propres', ico: '🧦', cost: 0, tgt: 'ally', calm: 2, draw: 1, from: ['coffre'] },
  cercueil:  { name: 'Faire le mort', ico: '⚰️', cost: 1, tgt: 'ally', blk: 11, from: ['cercueil', 'sarcophage', 'mausolee'] },
  harpe:     { name: 'Harpe ensorcelée', ico: '🎼', cost: 2, tgt: 'allfoes', weak: [3, 2], exhaust: 1, from: ['harpe'] },
  baton:     { el: 'foudre', name: 'Éclair de l’archimage', ico: '⚡', cost: 2, tgt: 'enemy', dmg: 11, from: ['baton'] },
  violon:    { name: 'Violon d’os', ico: '🎻', cost: 1, tgt: 'allies', buff: 2, exhaust: 1, from: ['violon'] },
  couronne:  { name: 'Couronne du Roi Gobelin', ico: '👑', cost: 0, tgt: 'none', nrg: 2, exhaust: 1, from: ['couronne'] },
  sablier:   { name: 'Sablier à l’envers', ico: '⏳', cost: 1, tgt: 'none', draw: 3, exhaust: 1, from: ['sablier'] },
  basilic:   { name: 'Œuf de basilic', ico: '🥚', cost: 2, tgt: 'enemy', stun: 2, exhaust: 1, from: ['oeufbasilic'] },
  pot:       { name: 'Saint Pot de Chambre', ico: '🏺', cost: 1, tgt: 'allies', heal: 4, calm: 2, exhaust: 1, from: ['potdechambre'] },
  nain:      { el: 'contondant', name: 'Nain de jardin maléfique', ico: '🧙', cost: 1, tgt: 'enemy', dmg: 5, weak: [2, 1], from: ['nain'] },
  the:       { name: 'Tasse de thé', ico: '🫖', cost: 1, tgt: 'allies', calm: 2, heal: 2, from: ['theiere'] },
  tapis:     { name: 'Tirer le tapis', ico: '🧶', cost: 1, tgt: 'enemy', stun: 1, exhaust: 1, from: ['tapis'] },
  plante:    { name: 'Coin de verdure', ico: '🪴', cost: 0, tgt: 'ally', calm: 3, from: ['plante'] },
  tarte:     { name: 'Tarte à la citrouille', ico: '🥧', cost: 1, tgt: 'ally', heal: 6, calm: 1, from: ['citrouille'] },
  portrait:  { name: 'Le portrait qui juge', ico: '🖼️', cost: 1, tgt: 'enemy', confuse: 1, from: ['tableau'] },
  banc:      { name: 'Pause sur le banc', ico: '🪑', cost: 1, tgt: 'ally', heal: 4, calm: 2, from: ['banc'] },
  voeu:      { name: 'Vœu au puits', ico: '🪙', cost: 1, tgt: 'none', fx: 'wish', note: 'au hasard : 5 PV à toute l’équipe, 2 cartes, ou 2 énergie', from: ['puits', 'fontaine'] },
  relique:   { name: 'Relique bénite', ico: '⛪', cost: 1, tgt: 'enemy', dmg: 7, el: 'radiant', from: ['vitrine', 'socle'] },
  glace:     { name: 'Eau glacée du lac', ico: '🧊', cost: 1, tgt: 'enemy', dmg: 6, el: 'froid', weak: [1, 1], from: ['nenuphar', 'barque'] },
  tombe:     { name: 'Malédiction de la tombe', ico: '🪦', cost: 1, tgt: 'enemy', dmg: 7, el: 'necrotique', from: ['tombe', 'mausolee'] },
  lanterne:  { name: 'Lanterne de guet', ico: '🏮', cost: 1, tgt: 'allfoes', dmg: 3, el: 'radiant', from: ['lanterne'] },
  // tes pièges
  trappe:    { name: 'Trappe à pics', ico: '🕳️', cost: 1, tgt: 'none', trap: 8, from: ['trappe', 'grandpiege'] },
  banane:    { name: 'Peau de banane', ico: '🍌', cost: 0, tgt: 'enemy', stun: 1, exhaust: 1, from: ['banane'] },
  hache:     { el: 'tranchant', name: 'Hache pendulaire', ico: '🪓', cost: 2, tgt: 'enemy', dmg: 13, from: ['hache'] },
  porte:     { name: 'Porte claquée', ico: '🚪', cost: 1, tgt: 'ally', blk: 8, from: ['porte'] },
  sphinx:    { name: 'Énigme du Sphinx', ico: '🦁', cost: 2, tgt: 'enemy', stun: 2, exhaust: 1, from: ['sphinx'] },
  leurre:    { name: 'Faux trésor', ico: '🎁', cost: 1, tgt: 'none', decoy: 1, from: ['leurre'] },
  cloche:    { name: 'Cloche d’alarme', ico: '🔔', cost: 0, tgt: 'none', draw: 2, from: ['cloche'] },
  barricade: { name: 'Barricade', ico: '🚧', cost: 2, tgt: 'allies', blk: 6, from: ['barricade'] },
};
// le décor du donjon : on peut s'en servir une fois par combat (un tonneau à faire sauter, un chandelier à faire tomber…)
const ENV_CARDS = {
  tonneau:    { name: 'Faire exploser le tonneau', ico: '💥', cost: 1, tgt: 'allfoes', dmg: 7, el: 'feu', backfire: 2, prop: ['furn', 'biere'] },
  chandelier: { name: 'Faire tomber le chandelier', ico: '🕯️', cost: 1, tgt: 'enemy', dmg: 11, el: 'contondant', stun: 1, prop: ['furn', 'candelabre'] },
  os:         { name: 'Avalanche d’os', ico: '🦴', cost: 1, tgt: 'allfoes', dmg: 4, el: 'contondant', prop: ['furn', 'ossuaire'] },
  cercueil:   { name: 'Se cacher dans le cercueil', ico: '⚰️', cost: 0, tgt: 'ally', blk: 9, prop: ['furn', 'cercueil'] },
  stele:      { name: 'Renverser la stèle', ico: '🪦', cost: 1, tgt: 'enemy', dmg: 9, el: 'contondant', prop: ['furn', 'tombe'] },
  tablee:     { name: 'Renverser la grande tablée', ico: '🪑', cost: 1, tgt: 'allies', blk: 5, prop: ['furn', 'tablee'] },
  jambon:     { name: 'Décrocher un jambon', ico: '🍖', cost: 0, tgt: 'ally', heal: 6, prop: ['furn', 'jambons'] },
  torche:     { name: 'Jeter la torche', ico: '🔥', cost: 0, tgt: 'enemy', dmg: 5, el: 'feu', prop: ['furn', 'torche'] },
  comptoir:   { name: 'Glisser une chope sur le comptoir', ico: '🍺', cost: 0, tgt: 'ally', calm: 3, prop: ['furn', 'comptoir'] },
  gaz:        { name: 'Gaz des marais', ico: '💨', cost: 1, tgt: 'allfoes', poison: 3, prop: ['furn', 'roseaux'] },
  nenuphar:   { name: 'Nénuphar glissant', ico: '🪷', cost: 0, tgt: 'enemy', weak: [3, 1], prop: ['furn', 'nenuphar'] },
  spores:     { name: 'Spores endormantes', ico: '🍄', cost: 1, tgt: 'enemy', stun: 1, prop: ['furn', 'champis'] },
  toile:      { name: 'Décrocher la toile', ico: '🕸️', cost: 1, tgt: 'allfoes', weak: [2, 1], prop: ['furn', 'toile'] },
  orgue:      { name: 'Jouer de l’orgue', ico: '🎹', cost: 1, tgt: 'allfoes', dmg: 4, el: 'tonnerre', fx: 'calmall', note: '−2 de peur pour toute l’équipe', prop: ['furn', 'orgue'] },
  portrait:   { name: 'Le portrait qui regarde', ico: '🖼️', cost: 0, tgt: 'enemy', confuse: 1, prop: ['furn', 'tableau'] },
  canape:     { name: 'Plonger derrière le canapé', ico: '🛋️', cost: 0, tgt: 'ally', blk: 7, prop: ['furn', 'canape'] },
  arbre:      { name: 'Secouer l’arbre (un nid de frelons !)', ico: '🐝', cost: 1, tgt: 'rnd', dmg: 3, hits: 3, el: 'perforant', prop: ['x', 'tree'] },
  pomme:      { name: 'Pomme de pin géante', ico: '🌲', cost: 0, tgt: 'enemy', dmg: 5, el: 'contondant', prop: ['x', 'pine'] },
  buisson:    { name: 'Se cacher dans les buissons', ico: '🌿', cost: 0, tgt: 'none', decoy: 1, prop: ['x', 'bush'] },
  rocher:     { name: 'Faire rouler le rocher', ico: '🪨', cost: 1, tgt: 'enemy', dmg: 10, el: 'contondant', splash: 3, prop: ['x', 'rock'] },
  cristal:    { name: 'Faire chanter le cristal', ico: '💎', cost: 1, tgt: 'allfoes', dmg: 5, el: 'tonnerre', prop: ['furn', 'cristal'] },
  etai:       { name: 'Faire tomber l’étai', ico: '🪵', cost: 1, tgt: 'allfoes', dmg: 7, el: 'contondant', backfire: 2, prop: ['furn', 'etai'] },
  wagonnet:   { name: 'Lancer le wagonnet', ico: '🛒', cost: 1, tgt: 'enemy', dmg: 13, el: 'contondant', prop: ['furn', 'wagonnet'] },
  filon:      { name: 'Gratter le filon doré', ico: '✨', cost: 0, tgt: 'none', loot: 5, prop: ['furn', 'filon'] },
  sarco:      { name: 'Ouvrir le sarcophage (quelle poussière !)', ico: '⚰️', cost: 1, tgt: 'allfoes', weak: [3, 1], prop: ['furn', 'sarcophage'] },
  armuredeco: { name: 'Faire tomber l’armure décorative', ico: '⛑️', cost: 1, tgt: 'enemy', dmg: 10, el: 'contondant', stun: 1, prop: ['furn', 'armure'] },
  trone:      { name: 'S’asseoir un instant sur le trône', ico: '👑', cost: 0, tgt: 'allies', calm: 3, prop: ['furn', 'trone'] },
  puits:      { name: 'Faire un vœu au vieux puits', ico: '🪙', cost: 0, tgt: 'ally', heal: 9, prop: ['furn', 'puits'] },
  lustre:     { name: 'Décrocher le grand lustre', ico: '🕯️', cost: 1, tgt: 'allfoes', dmg: 6, el: 'contondant', prop: ['furn', 'lustre'] },
};
const CRAWL_ENV = { morgrave: ['chandelier', 'os', 'cercueil', 'stele'], septbieres: ['tonneau', 'tablee', 'jambon', 'torche', 'comptoir'], moussues: ['gaz', 'nenuphar', 'spores', 'toile'], ombrelune: ['chandelier', 'orgue', 'portrait', 'canape'], foret: ['arbre', 'pomme', 'buisson', 'spores'], grotte: ['rocher', 'cristal', 'etai', 'wagonnet', 'filon'], ruines: ['sarco', 'armuredeco', 'trone', 'puits', 'lustre'] };
const cardDef = c => c.src === 'sp' ? CRAWL_SK[c.key] : c.src === 'base' ? CARD_BASE[c.key] : c.src === 'env' ? ENV_CARDS[c.key] : CASTLE_CARDS[c.key];
const cardKind = D => D.dmg != null || D.bribe ? 'atk' : D.blk != null || D.evade || D.decoy ? 'def' : D.heal != null || D.calm != null || D.revive ? 'heal' : 'skill';
const cardName = c => cardDef(c).name + (c.up ? ' +' : '');
// d'où vient une carte du château : le premier meuble ou piège qu'on a vraiment
// un meuble de qualité (au moins 6 💰+🪵, ou de palier 2) donne sa carte déjà améliorée (✦) : le grand lustre fait une meilleure torche que la torche
const srcPrice = k => { const c = (FURN[k] || DEFS[k] || {}).cost || {}; return (c.g || 0) + (c.s || 0); };
const srcTier = k => { const f = FURN[k], r = f && ROOMS[f.room]; return Math.max((f || DEFS[k] || {}).tier || 0, (r && r.tier) || 0); };
const fineSrc = k => !(FURN[k] && FURN[k].artefact) && (srcPrice(k) >= 6 || srcTier(k) >= 2);
const ownsSrc = k => hasItem(k) || S.defs.some(d => d.t === k);
const castleUp = k => !!CASTLE_CARDS[k] && CASTLE_CARDS[k].from.some(x => ownsSrc(x) && fineSrc(x));
const castleSrc = k => { const D = CASTLE_CARDS[k], f = D.from.find(x => ownsSrc(x) && fineSrc(x)) || D.from.find(ownsSrc) || D.from[0]; return FURN[f] ? FURN[f].name : DEFS[f] ? DEFS[f].name : ''; };
// les cartes que ton château peut mettre dans le sac
function castlePool() { return Object.keys(CASTLE_CARDS).filter(k => CASTLE_CARDS[k].from.some(f => hasItem(f) || S.defs.some(d => d.t === f))); }

/* ---------- l'équipe : ses PV et sa force viennent de la garde, du niveau, des légendes ---------- */
function crawler(c) {
  const g = guardOf(c), lv = c.lvl || 1, sp = SPECIES[c.sp] || {};
  const hp = 10 + 3 * g + 2 * (lv - 1) + (c.legend ? 5 : 0) + (c.evo ? 6 : 0) - ((c.fat || 0) >= 4 ? 4 : 0);
  const atk = 2 + Math.floor(g / 2) + (lv >= 3 ? 1 : 0) + (sp.tag === 'combat' && ['enclume', 'fourneau'].some(hasItem) ? 1 : 0);
  return { id: c.id, name: c.name, sp: c.sp, hp, max: hp, atk, guard: g, lv, block: 0, stress: 0, st: {}, ko: false, loyal: (c.loy || 0) >= 70, saved: false };
}
let CARD_UID = 1;
const newCard = (src, key, owner, up) => ({ uid: 'k' + (CARD_UID++), src, key, owner: owner || null, up: !!up });
// le deck de départ : deux Frappes, une Parade et la carte de son espèce par créature (améliorée si elle est fidèle), puis le sac
function crawlDeck(team, bag) {
  const out = [];
  team.forEach(c => {
    out.push(newCard('base', 'frappe', c.id), newCard('base', 'frappe', c.id), newCard('base', 'parade', c.id));
    out.push(CRAWL_SK[c.sp] ? newCard('sp', c.sp, c.id, (c.loy || 0) >= 70) : newCard('base', 'griffe', c.id));
    if (c.evo || c.legend) out.push(newCard('base', 'legende', c.id));
  });
  (bag || []).forEach(k => CASTLE_CARDS[k] && out.push(newCard('castle', k, null, castleUp(k))));
  return out;
}
// ce qu'une carte vaut « dans l'absolu » (le sac et les récompenses automatiques)
function cardValue(D) {
  const many = t => D.tgt === t ? 1 : 0, w = D.weak ? D.weak[0] * D.weak[1] : 0;
  const v = (D.dmg || 0) * (D.hits || 1) * (1 + 1.3 * many('allfoes')) + (D.atk ? 3 : 0) + (D.blk || 0) * (1 + 2 * many('allies')) + (D.heal || 0) * 1.1 * (1 + 2.5 * many('allies')) + (D.cure ? 3 : 0)
    + (D.calm || 0) * .7 * (1 + 1.5 * many('allies')) + (D.buff || 0) * (many('allies') ? 5 : 2.5) + (D.stun || 0) * 8 + w * 1.4 * (1 + many('allfoes')) + (D.poison || 0) * 1.5
    + (D.trap || 0) * .8 + (D.draw || 0) * 3 + (D.nrg || 0) * 4 + (D.revive ? 12 : 0) + (D.evade || D.decoy ? 6 : 0) + (D.taunt ? 2 : 0) + (D.splash || 0) * 1.5 + (D.bribe ? 9 : 0) + (D.confuse ? 7 : 0) + (D.fx ? (D.fx === 'risky' ? -1 : 4) : 0) - (D.fear || 0) * 1.5;   // un effet « risqué » (le champignon douteux) est un défaut, pas un bonus
  return v / ((D.cost || 0) + .7) * (D.exhaust ? .8 : 1);
}
// le sac automatique : les meilleures cartes du château, dont au moins un soin si possible
function crawlAutoBag(pool = castlePool()) {
  const val = k => cardValue(CASTLE_CARDS[k]) * (castleUp(k) ? 1.35 : 1), sorted = pool.slice().sort((a, b) => val(b) - val(a)), bag = sorted.slice(0, BAG_SIZE);
  const heal = sorted.find(k => CASTLE_CARDS[k].heal); if (heal && !bag.some(k => CASTLE_CARDS[k].heal) && bag.length) bag[bag.length - 1] = heal;
  return bag;
}

/* ---------- l'expédition : la carte, les salles, le butin ---------- */
function crawlNew(dg, team, opts = {}) {
  const R = { dg, np: Math.max(1, Math.min(5, opts.np || 1)), lvl: Math.round((crawlLevel() + crawlResist(dg) + (opts.lvlAdd || 0)) * 10) / 10, floor: 1, step: 0, party: team.map(c => crawler(c)), deck: crawlDeck(team, opts.bag || crawlAutoBag()), loot: { g: 0, s: 0, items: [] }, log: [], done: null, relic: null, path: [], seed: Math.floor(Math.random() * 1e9) };
  R.choices = crawlChoices(R); return R;
}
function crawlChoices(R) {
  if (R.floor > CRAWL_FLOORS) return [{ k: 'boss' }];
  const w = [['combat', 40], ['elite', R.floor > 1 || R.step > 0 ? 14 : 0], ['tresor', 14], ['repos', R.floor > 1 || R.step > 0 ? 14 : 0], ['event', 18]];
  const draw = () => wpick(w.filter(x => x[1] > 0).map(x => x[0]), k => w.find(x => x[0] === k)[1]);
  const a = draw(); let b = draw(), tries = 0; while (b === a && tries++ < 5) b = draw();
  // on n'évite pas tous les combats : l'une des deux portes mène toujours à des ennemis
  if (![a, b].some(k => k === 'combat' || k === 'elite')) b = 'combat';
  return [{ k: a }, { k: b }];
}
const crawlDepthK = R => 1 + .5 * (R.floor - 1);
function crawlAdvance(R) { R.step++; if (R.step >= CRAWL_STEPS) { R.step = 0; R.floor++; } R.choices = crawlChoices(R); }
// les ennemis d'une salle
function crawlFoes(R, kind) {
  const D = CRAWL_DG[R.dg], f = Math.min(R.floor, CRAWL_FLOORS), list = [];
  if (kind === 'boss') return [crawlFoe(D.boss, f, 0, R.lvl, R.np), crawlFoe(pick(D.regs), 1, 1, R.lvl, R.np)];   // le boss et un sbire (les sbires d'un boss ont la force du premier étage)
  else if (kind === 'elite') { list.push(D.elite); for (let i = 0; i < (f >= 2 ? 1 : 0) + (f >= 3 ? 1 : 0); i++) list.push(pick(D.regs)); }
  else { const n = f === 1 ? 2 : f === 2 ? 2 + (Math.random() < .5 ? 1 : 0) : 3; for (let i = 0; i < n; i++) list.push(pick(D.regs)); }
  for (let i = 1; i < (R.np || 1) && list.length < 4; i++) list.push(pick(D.regs));   // à plusieurs Maîtres : un ennemi de plus par Maître
  return list.map((k, i) => crawlFoe(k, f, i, R.lvl, R.np));
}
function crawlFoe(k, f, i, lvl = 1, np = 1) {
  const E = CRAWL_EN[k], T = CRAWL_TUNE, L = lvl - 1, F = E.boss ? 0 : f - 1;
  const hp = Math.round(E.hp * (1 + T.hpL * L) * (1 + T.hpF * F) * (E.boss ? T.boss : 1) * (1 + 1.4 * (np - 1)));   // à plusieurs : des ennemis plus coriaces, et qui frappent plus fort
  return { k, uid: k + '#' + i + '#' + Math.floor(Math.random() * 1e6), name: E.name, sp: E.sp, emo: E.emo, hp, max: hp, block: 0, st: {}, ai: Math.floor(Math.random() * E.acts.length), plus: Math.round(T.dmgL * L + T.dmgF * F + 2.5 * (np - 1)), buff: 0, elite: !!E.elite, boss: !!E.boss, rise: E.rise || 0, pow: E.pow || null, phase: 1, li: 0 };
}

/* ---------- les éléments, comme dans Donjons et Dragons : chaque coup a un type de dégâts ----------
   vulnérable : ×2 · résistant : moitié · immunisé : rien */
const ELEM = { acide: ['🧪', 'acide'], contondant: ['🔨', 'contondant'], froid: ['❄️', 'froid'], feu: ['🔥', 'feu'], force: ['✨', 'force'], foudre: ['⚡', 'foudre'], necrotique: ['💀', 'nécrotique'], perforant: ['🏹', 'perforant'], poison: ['☠️', 'poison'], psychique: ['🧠', 'psychique'], radiant: ['☀️', 'radiant'], tranchant: ['🗡️', 'tranchant'], tonnerre: ['🔊', 'tonnerre'] };
const PHYS = ['contondant', 'perforant', 'tranchant'];
// tes créatures : l'arme de leur Frappe, et ce qui leur fait peu ou beaucoup d'effet (nofear : ne connaît pas la peur)
const SP_ELEM = {
  diablotin: { atk: 'perforant', imm: ['feu'] }, gobelin: { atk: 'perforant' }, kobold: { atk: 'perforant', vuln: ['radiant'] }, crapaud: { atk: 'contondant', res: ['acide'] },
  gargouille: { atk: 'contondant', res: PHYS, imm: ['poison'], nofear: 1 }, menestrel: { atk: 'contondant', res: ['psychique'] }, troll: { atk: 'contondant', vuln: ['feu', 'acide'] },
  fantome: { atk: 'necrotique', res: PHYS, imm: ['poison', 'necrotique'], vuln: ['radiant'] }, sorciere: { atk: 'contondant', res: ['poison'] },
  squelette: { atk: 'tranchant', vuln: ['contondant'], imm: ['poison'], nofear: 1 }, orque: { atk: 'tranchant' }, araignee: { atk: 'perforant', res: ['poison'] },
  dragonnet: { atk: 'tranchant', imm: ['feu'] }, mimique: { atk: 'perforant', imm: ['acide'] }, vampire: { atk: 'perforant', res: ['necrotique'], vuln: ['radiant'] },
  golem: { atk: 'contondant', imm: ['poison', 'psychique'], nofear: 1 }, fee: { atk: 'force', res: ['psychique'] }, liche: { atk: 'necrotique', res: ['froid', 'necrotique'], imm: ['poison'], nofear: 1 },
  harpie: { atk: 'tranchant' }, cocatrice: { atk: 'perforant', res: ['poison'] }, mandragore: { atk: 'contondant', vuln: ['feu'] }, nixe: { atk: 'froid', res: ['froid'], vuln: ['foudre'] }, goule: { atk: 'tranchant', res: ['necrotique'], imm: ['poison'] },
  nainsombre: { atk: 'contondant', res: ['feu'] },
};
// les ennemis : le type de leurs coups (el), et leurs résistances, vulnérabilités, immunités
const FOE_ELEM = {
  sq: { el: 'tranchant', vuln: ['contondant'], imm: ['poison'] }, spec: { el: 'necrotique', res: PHYS, imm: ['necrotique', 'poison'], vuln: ['radiant'] }, aco: { el: 'necrotique', res: ['necrotique'], vuln: ['radiant'] },
  chev: { el: 'tranchant', vuln: ['contondant'], res: ['perforant'], imm: ['poison'] }, ysolde: { el: 'necrotique', res: ['necrotique', 'froid'], vuln: ['radiant'] },
  gob: { el: 'perforant' }, orq: { el: 'contondant' }, bra: { el: 'contondant', res: ['poison'], vuln: ['froid'] }, ogre: { el: 'contondant', res: ['contondant'], vuln: ['psychique'] }, krouk: { el: 'tranchant', res: ['poison'] },
  crap: { el: 'acide', res: ['acide'], vuln: ['froid'] }, ara: { el: 'perforant', res: ['poison'], vuln: ['feu'] }, cha: { el: 'psychique', imm: ['psychique'], vuln: ['feu'] }, tis: { el: 'perforant', res: ['poison'], vuln: ['feu'] }, mere: { el: 'acide', imm: ['acide'], res: ['poison'], vuln: ['froid'] },
  bat: { el: 'perforant', vuln: ['tonnerre'] }, garg: { el: 'contondant', res: PHYS, imm: ['poison'], vuln: ['tonnerre'] }, vamp: { el: 'necrotique', res: ['necrotique'], vuln: ['radiant'] }, maj: { el: 'tranchant', res: ['necrotique'], imm: ['poison'], vuln: ['radiant'] }, pale: { el: 'necrotique', res: ['necrotique', 'froid'], vuln: ['radiant'] },
  lutin: { el: 'perforant', vuln: ['froid'] }, loup: { el: 'tranchant', res: ['perforant'], vuln: ['feu'] }, ronce: { el: 'perforant', res: ['contondant', 'perforant'], vuln: ['feu', 'tranchant'] }, vexe: { el: 'poison', imm: ['poison'], vuln: ['feu'] }, chene: { el: 'contondant', res: ['contondant', 'perforant'], vuln: ['feu', 'tranchant'] }, reine: { el: 'radiant', res: ['radiant'], vuln: ['necrotique'] },
  rat: { el: 'perforant', res: ['poison'] }, gelee: { el: 'acide', imm: ['acide'], res: ['tranchant', 'perforant'], vuln: ['feu'] }, kobs: { el: 'perforant', vuln: ['radiant'] }, golemc: { el: 'contondant', imm: ['poison', 'psychique'], res: ['perforant', 'tranchant'], vuln: ['tonnerre', 'contondant'] }, basil: { el: 'perforant', imm: ['poison'], res: ['acide'], vuln: ['froid'] },
  momie: { el: 'necrotique', res: ['necrotique', 'poison'], vuln: ['feu'] }, armure: { el: 'tranchant', res: ['tranchant'], imm: ['poison', 'psychique'], vuln: ['contondant', 'foudre'] }, mimic: { el: 'perforant', imm: ['acide'], vuln: ['contondant'] },
  follet: { el: 'feu', imm: ['feu'], vuln: ['froid'] }, gardien: { el: 'contondant', res: ['tranchant'], imm: ['poison', 'psychique'], vuln: ['tonnerre'] }, roi: { el: 'necrotique', res: ['necrotique', 'froid'], imm: ['poison'], vuln: ['radiant'] },
};
// le type des actions spéciales (sinon : le type habituel de l'ennemi)
const ACT_EL = { souldrain: 'necrotique', shatter: 'force', tailall: 'contondant', swarm: 'perforant', throw: 'contondant', roots: 'contondant', grab: 'contondant', charm: 'psychique', smash: 'contondant', execute: null };
const elemOf = o => o.k ? (FOE_ELEM[o.k] || {}) : (SP_ELEM[o.sp] || {});
// ×2, ×½ ou ×0 selon la cible
function elemMul(el, t) { if (!el || !t) return 1; const E = elemOf(t); return (E.imm || []).includes(el) ? 0 : (E.vuln || []).includes(el) ? 2 : (E.res || []).includes(el) ? .5 : 1; }
// le type d'une carte : le sien, ou l'arme naturelle de la créature qui la joue
const cardEl = (c, me) => { const D = cardDef(c); return D.dmg == null ? null : D.el || (me ? (SP_ELEM[me.sp] || {}).atk : null) || (c.owner && D.atk ? 'contondant' : 'contondant'); };
/* ---------- les actions des ennemis ---------- */
const DMG_K = ['atk', 'multi', 'aoe', 'drain', 'execute', 'smash', 'roots', 'shatter', 'souldrain', 'throw', 'grab', 'swarm', 'tailall'];
const TGT_K = ['atk', 'multi', 'drain', 'fear', 'stun', 'poison', 'steal', 'smash', 'cocoon', 'grab'];
const SINGLE_K = ['atk', 'multi', 'drain', 'steal', 'execute', 'smash', 'grab', 'cocoon'];
// les actions d'élite (et légendaires) ont un nom, qu'on lit au-dessus de la tête de l'ennemi
const ELITE_ACT = { execute: 'Exécution', smash: 'Coup de massue', cocoon: 'Cocon', serve: 'Le thé est servi', roots: 'Racines', shatter: 'Éclatement' };
const LEG_ACT = { raise: 'Relever les morts', souldrain: 'Drain d’âme', round: 'Tournée générale', throw: 'Lancer de chopes', grab: 'Langue happeuse', spawn: 'Ponte', swarm: 'Nuée de chauves-souris', charm: 'Charme', blind: 'Lumière aveuglante', petrify: 'Regard pétrifiant', tailall: 'Queue fouettante', toxic: 'Marée toxique', mist: 'Brume', decree: 'Décret royal' };
const actName = it => it.nm || ELITE_ACT[it.k] || LEG_ACT[it.k] || ({ atk: 'attaque', multi: 'rafale', aoe: 'frappe tout le monde', drain: 'morsure', block: 'se protège', heal: 'soigne', buff: 'galvanise', fear: 'terrifie', fearall: 'terrifie l’équipe', stun: 'immobilise', poison: 'empoisonne', poisonall: 'nuage toxique', steal: 'chaparde', summon: 'appelle des renforts' }[it.k] || it.k);
// ce que fait une action : qui elle touche, et combien
function intentHits(it, mates) {
  if (!it) return []; const v = it.v || 0;
  if (['atk', 'drain', 'execute', 'smash', 'grab'].includes(it.k)) return [[it.t, v]];
  if (it.k === 'multi') return [[it.t, v * it.n]];
  if (['aoe', 'tailall', 'roots', 'shatter', 'souldrain'].includes(it.k)) return mates.map(c => [c.id, v]);
  if (it.k === 'throw' || it.k === 'swarm') return mates.map(c => [c.id, v * it.n / Math.max(1, mates.length)]);
  if (it.k === 'steal') return [[it.t, 2]];
  if (it.k === 'charm') return mates.map(c => [c.id, 6 / Math.max(1, mates.length)]);
  return [];
}
/* ---------- le combat : énergie, pioche, main, défausse ---------- */
function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
// le décor cache parfois un secret : un détail à toucher, gratuit, qui sert une fois (rare : on ne peut pas compter dessus)
const SECRET_CHANCE = { combat: .12, elite: .2, boss: .3 };
function crawlSecret(dg, foes) {
  const L = CRAWL_ENV[dg] || [], kind = foes.some(f => f.boss) ? 'boss' : foes.some(f => f.elite) ? 'elite' : 'combat';
  if (!L.length || Math.random() >= SECRET_CHANCE[kind]) return [];
  const k = pick(L); return [{ key: k, used: false, secret: true, c: newCard('env', k), x: Math.round((Math.random() < .5 ? 28 : 58) + Math.random() * 14), y: Math.round(1 + Math.random() * 5) }];   // posé au sol, entre les deux camps
}
function crawlBattle(R, foes) {
  const np = R.np || 1;
  const B = { R, np, party: R.party, foesL: foes, turn: 0, trap: 0, decoy: 0, firstHit: hasRelic('grimoireys'), capeUsed: false, ev: [], over: null, cur: 0, hands: Array.from({ length: np }, () => []), nrg: Array(np).fill(0), draw: shuffle(R.deck.slice()), disc: [], exh: [], queue: [], env: crawlSecret(R.dg, foes) };
  Object.defineProperty(B, 'hand', { get: () => B.hands[0], set: v => { B.hands[0] = v; } });
  Object.defineProperty(B, 'energy', { get: () => B.nrg[0], set: v => { B.nrg[0] = v; } });
  const say = (t, cls, fx) => B.ev.push({ t, cls, fx });
  B.log = say;
  B.foes = () => B.foesL.filter(f => f.hp > 0);
  B.mates = () => B.party.filter(c => !c.ko);
  B.owner = c => c.owner ? B.party.find(p => p.id === c.owner) : null;
  B.up = c => c.up ? 1 : 0;
  // les valeurs d'une carte, telles qu'elle les jouerait maintenant
  B.dmgOf = (c, me) => { const D = cardDef(c); if (D.dmg == null) return 0; return Math.max(0, D.dmg + (D.atk && me ? me.atk * D.atk + (me.st.song || 0) : 0) + 3 * B.up(c) - (D.hits > 1 && c.up ? 2 : 0) - (B.dazzleNow || 0)); };
  B.blkOf = (c, me) => { const D = cardDef(c); return D.blk == null ? 0 : D.blk + (D.grd && me ? Math.floor(me.guard / 2) : 0) + 3 * B.up(c); };
  B.healOf = c => { const D = cardDef(c); return D.heal == null ? 0 : D.heal + (D.tgt === 'allies' ? 1 : 3) * B.up(c); };
  B.costOf = c => { const D = cardDef(c), me = B.owner(c); return Math.max(0, (D.cost || 0) + (me && me.stress >= STRESS_MAX ? 1 : 0)); };
  // pourquoi une carte ne se joue pas (ou '' si elle se joue)
  B.why = (c, p = B.cur) => {
    const D = cardDef(c), me = B.owner(c);
    if (me && me.ko) return `${me.name} est K.O.`;
    if (me && me.st.stun) return `${me.name} est immobilisé·e`;
    if (B.costOf(c) > B.nrg[p]) return 'Pas assez d’énergie';
    if (D.tgt === 'ko' && !B.party.some(p => p.ko)) return 'Personne n’est K.O.';
    if (D.bribe && B.R.loot.g < D.bribe) return `Il faut ${D.bribe} or dans le butin`;
    if ((D.tgt === 'enemy' || D.tgt === 'allfoes' || D.tgt === 'rnd') && !B.foes().length) return 'Plus d’ennemis';
    return '';
  };
  B.targets = c => { const D = cardDef(c); return D.tgt === 'enemy' ? B.foes() : D.tgt === 'ally' ? B.mates() : D.tgt === 'ko' ? B.party.filter(p => p.ko) : []; };
  B.hit = (me, t, v, opt = {}) => {
    if (!t || t.hp <= 0) return 0;
    if (t.st.mist && !opt.aoe) { t.st.mist--; say(`Le coup traverse ${t.name}, changé en brume.`, 'bad', { k: 'miss', to: t.uid }); return 0; }
    let d = Math.max(0, v); if (B.firstHit && !opt.aoe) { d += 3; B.firstHit = false; }
    const mul = elemMul(opt.el, t), eff = mul === 0 ? 'imm' : mul > 1 ? 'vuln' : mul < 1 ? 'res' : '';
    d = Math.floor(d * mul);
    if (t.pow === 'cristal') d = Math.max(0, d - powV('cristal', 'v', 3));
    if (t.pow === 'sceau') d = Math.min(d, powV('sceau', 'v', 8));
    if (t.pow === 'muraille' && B.foes().some(o => o !== t)) d = Math.ceil(d * powV('muraille', 'v', 50) / 100);
    const ab = opt.pierce ? 0 : Math.min(t.block || 0, d); t.block -= ab; d -= ab; t.hp -= d;
    say(`${me ? me.name : 'Le château'} → ${t.name} : ${d ? '−' + d : 'paré'}${ab ? ` (${ab} encaissés)` : ''}${eff === 'vuln' ? ' — vulnérable !' : eff === 'res' ? ' — il résiste' : eff === 'imm' ? ' — immunisé' : ''}`, 'good', { k: 'hit', from: me ? me.id : null, to: t.uid, v: d, ab, el: opt.el, eff });
    if (t.hp <= 0) {
      if (t.rise && !t.rose) { t.rose = true; t.hp = t.rise; say(`${t.name} se relève !`, 'bad', { k: 'rise', to: t.uid }); }
      else { t.hp = 0; say(`${t.name} tombe.`, 'good', { k: 'down', to: t.uid }); B.foes().filter(o => o.pow === 'service').forEach(o => { const sv = powV('service', 'v', 8), sb = powV('service', 'buff', 2); o.block += sv; o.buff += sb; if (o.int && DMG_K.includes(o.int.k)) o.int.v += sb; say(`${o.name} venge son allié : +8 parade, +2 force.`, 'bad', { k: 'fbuff', to: o.uid }); }); }
      return d;
    }
    // les capacités d'élite
    if (d > 0 && t.pow === 'rage' && t.buff < powV('rage', 'max', 6)) { const rv = powV('rage', 'v', 1); t.buff += rv; if (t.int && DMG_K.includes(t.int.k)) t.int.v += rv; say(`${t.name} enrage : +${rv} de force.`, 'bad', { k: 'fbuff', to: t.uid }); }
    if (d > 0 && t.pow === 'riposte' && me && !me.ko) { say(`${t.name} riposte !`, 'bad', { k: 'act', from: t.uid, to: me.id }); B.hurt(t, me, powV('riposte', 'v', 3)); }
    // la fureur légendaire : à mi-vie, le boss change de visage
    if (t.boss && t.phase !== 2 && t.hp <= t.max / 2) B.enrage(t);
    return d;
  };
  B.enrage = f => {
    const E = CRAWL_EN[f.k]; f.phase = 2; f.ai = 0;
    say(`${f.name} entre en fureur légendaire ! ${BOSS_P2[E.p2] || ''}`, 'bad', { k: 'phase', to: f.uid });
    const fl = 1, add = k => { if (B.foes().length < 4 && CRAWL_EN[k]) { const n = crawlFoe(k, fl, B.foesL.length, R.lvl); B.foesL.push(n); B.intent(n); say(`${f.name} appelle ${n.name} !`, 'bad', { k: 'summon', to: n.uid }); } };
    if (E.p2 === 'necro') { add('sq'); add('sq'); B.mates().forEach(c => B.fear(c, 2)); }
    else if (E.p2 === 'ivresse') { f.buff += 3; f.hp = Math.min(f.max, f.hp + 10); }
    else if (E.p2 === 'maree') B.mates().forEach(c => B.poisonP(c, 3));
    else if (E.p2 === 'brume') { f.st.mist = 2; f.hp = Math.min(f.max, f.hp + 12); }
    else if (E.p2 === 'lucioles') { B.foes().forEach(o => { o.hp = Math.min(o.max, o.hp + 10); }); B.mates().forEach(c => B.fear(c, 2)); }
    else if (E.p2 === 'couronne') { f.buff += 1; add('armure'); B.mates().forEach(c => B.fear(c, 1)); }
    // les chefs des quartiers de Mirebrume (p73)
    else if (E.p2 === 'herse') { f.block += 15; B.nrgDebt = (B.nrgDebt || 0) + 1; }
    else if (E.p2 === 'prime') { B.foes().forEach(o => { o.buff += 2; [o.int, o.lint].forEach(it => { if (it && DMG_K.includes(it.k)) it.v += 2; }); }); B.mates().forEach(c => B.fear(c, 1)); }
    else if (E.p2 === 'tocsin') { const n0 = B.foesL.length; add('m_lustrin'); if (B.foesL.length > n0) { const ch = B.foesL[B.foesL.length - 1]; ch.hp = Math.ceil(ch.max / 2); ch.st.stun = 1; } }
    else if (typeof QBOSS_FX !== 'undefined' && QBOSS_FX[E.p2]) QBOSS_FX[E.p2](f, B, add);   // les boss des grandes quêtes
    else if (E.p2 === 'mue') { ['stun', 'weak', 'weakT', 'poison', 'confuse'].forEach(k => { delete f.st[k]; }); f.block += 20; }
    B.intent(f);
  };
  B.heal = (t, v) => { if (!t || t.ko) return 0; const x = Math.min(v, t.max - t.hp); t.hp += x; if (x) say(`${t.name} récupère ${x} PV.`, 'good', { k: 'heal', to: t.id, v: x }); return x; };
  B.block = (t, v) => { if (!t || t.ko) return; t.block = (t.block || 0) + v; say(`${t.name} se protège (${v}).`, '', { k: 'block', to: t.id, v }); };
  B.stun = (t, n) => { t.st.stun = Math.max(t.st.stun || 0, n); say(`${t.name} perd ${n > 1 ? 'ses deux prochaines actions' : 'sa prochaine action'}.`, 'good', { k: 'stun', to: t.uid }); };
  B.calm = (t, v) => { if (!t || t.ko) return; const x = Math.min(v, t.stress); t.stress -= x; if (x) say(`${t.name} se calme (−${x} peur).`, 'good', { k: 'calm', to: t.id, v: x }); };
  B.revive = (t, k) => { if (!t || !t.ko) return; t.ko = false; t.hp = Math.max(1, Math.round(t.max * k)); say(`${t.name} se relève !`, 'good', { k: 'revive', to: t.id }); B.exh.filter(c => c.owner === t.id).forEach(c => B.disc.push(c)); B.exh = B.exh.filter(c => c.owner !== t.id); };
  B.poisonP = (t, n) => { if (!t || t.ko) return; const m = elemMul('poison', t); if (!m) { say(`${t.name} est immunisé·e contre le poison.`, 'good', { k: 'miss', to: t.id }); return; } t.st.poison = (t.st.poison || 0) + Math.ceil(n * m); say(`${t.name} est empoisonné·e (${Math.ceil(n * m)}).`, 'bad', { k: 'poison', to: t.id }); };
  B.fear = (t, v) => {
    if (!t || t.ko || (SP_ELEM[t.sp] || {}).nofear) return; const g = hasRelic('champi') ? Math.ceil(v / 2) : v, was = t.stress; t.stress = Math.min(STRESS_MAX, t.stress + g);
    if (g) say(`${t.name} a peur (+${g}).`, 'bad', { k: 'fear', to: t.id, v: g });
    if (was < STRESS_MAX && t.stress >= STRESS_MAX) say(`${t.name} panique ! Ses cartes coûtent 1 de plus.`, 'bad', { k: 'panic', to: t.id });
  };
  B.hurt = (f, t, v, el) => {
    if (!t || t.ko) return 0;
    if (t.st.evade) { t.st.evade = 0; say(`${t.name} esquive !`, 'good', { k: 'miss', to: t.id }); return 0; }
    if (hasRelic('cape') && !B.capeUsed) { B.capeUsed = true; say(`La Cape d’Ombrelune détourne le coup de ${f.name}.`, 'good', { k: 'miss', to: t.id }); return 0; }
    const mul = elemMul(el, t), eff = mul === 0 ? 'imm' : mul > 1 ? 'vuln' : mul < 1 ? 'res' : '';
    let d = Math.floor(Math.max(0, v - (f.st.weak || 0)) * mul); const ab = Math.min(t.block || 0, d); t.block -= ab; d -= ab; t.hp -= d;
    say(`${f.name} → ${t.name} : ${d ? '−' + d : 'paré'}${ab ? ` (${ab} encaissés)` : ''}${eff === 'vuln' ? ' — vulnérable !' : eff === 'res' ? ' — résiste' : eff === 'imm' ? ' — immunisé·e' : ''}`, d ? 'bad' : '', { k: 'hurt', from: f.uid, to: t.id, v: d, ab, el, eff });
    if (d > 0 && f.pow === 'venin' && t.hp > 0) B.poisonP(t, powV('venin', 'v', 1));
    if (t.hp <= 0) {
      if (t.loyal && !t.saved) { t.saved = true; t.hp = 1; say(`${t.name}, fidèle jusqu’au bout, tient debout avec 1 PV !`, 'good', { k: 'loyal', to: t.id }); }
      else { t.hp = 0; t.ko = true; t.block = 0; say(`${t.name} est K.O. : ses cartes sont mises de côté.`, 'bad', { k: 'ko', to: t.id }); B.mates().forEach(c => B.fear(c, 2)); }
    }
    return d;
  };
  // piocher : les cartes d'une créature K.O. sont mises de côté (on en pioche une autre)
  B.drawN = (n, p = B.cur) => {
    const H = B.hands[p]; let burnt = 0;
    for (let k = 0, tries = 0; k < n && tries < 60; tries++) {
      if (!B.draw.length) { if (!B.disc.length) break; B.draw = shuffle(B.disc); B.disc = []; say('La défausse est mélangée dans la pioche.', '', { k: 'shuffle' }); }
      const c = B.draw.pop(), me = B.owner(c);
      if (me && me.ko) { B.exh.push(c); continue; }
      if (H.length >= 10) { B.disc.push(c); burnt++; k++; continue; }   // main pleine : la carte piochée en trop part à la défausse (et compte comme piochée)
      H.push(c); k++;
    }
    if (burnt) say(`Main pleine (10 cartes) : ${burnt > 1 ? `${burnt} cartes partent` : 'une carte part'} à la défausse.`, '', { k: 'shuffle' });
  };
  // la prochaine action de chaque ennemi, et sa cible
  B.mkInt = (f, a) => {
    const k = a[0], m = B.mates(); let tg = null;
    if (k === 'execute') tg = m.slice().sort((x, y) => x.hp - y.hp)[0];
    else if (k === 'petrify') tg = m.slice().sort((x, y) => y.atk * y.max - x.atk * x.max)[0];
    else if (TGT_K.includes(k)) tg = m.find(c => c.st.taunt) || pick(m);
    const nm = ((CRAWL_EN[f.k] || {}).names || {})[k];   // un ennemi peut donner son propre nom à une action (la volée de carreaux de la Capitaine est un « throw »)
    return { k, v: typeof a[1] === 'number' ? a[1] + (DMG_K.includes(k) ? f.plus + f.buff : 0) : a[1], n: a[2] || 1, t: tg ? tg.id : null, ...(nm ? { nm } : {}) };
  };
  B.intent = f => {
    const E = CRAWL_EN[f.k], acts = f.phase === 2 && E.rage ? E.rage : E.acts; f.int = B.mkInt(f, acts[f.ai % acts.length]);
    if (E.leg) { f.lint = B.mkInt(f, E.leg[f.li % E.leg.length]); f.lint2 = null; }
  };
  B.foes().forEach(B.intent);
  // une carte jouée
  B.play = (c, t, p = 0) => {
    if (B.over) return false;
    B.cur = p; const H = B.hands[p], i = H.indexOf(c); if (i < 0 || B.why(c, p)) return false;
    const D = cardDef(c), me = B.owner(c);
    if (D.tgt === 'enemy' && (!t || t.hp <= 0)) t = B.foes()[0];
    if (D.tgt === 'ally' && (!t || t.ko)) t = me && !me.ko ? me : B.mates()[0];
    if (D.tgt === 'ko' && (!t || !t.ko)) t = B.party.find(p => p.ko);
    if (D.tgt === 'self') t = me;
    B.nrg[p] -= B.costOf(c); H.splice(i, 1);
    say(`${me ? me.name + ' : ' : ''}${cardName(c)}`, 'card', { k: 'card', from: me ? me.id : null, card: c.key, ik: typeof cardIk === 'function' ? cardIk(D, cardEl(c, me)) : '', p });
    B.exec(c, D, me, t);
    (D.exhaust ? B.exh : B.disc).push(c);
    B.check(); return true;
  };
  // le secret du décor : il sert une fois, gratuitement, et vise tout seul au mieux
  B.envWhy = (i, p = B.cur) => { const e = B.env[i]; if (!e) return 'Introuvable'; if (e.used) return 'Déjà utilisé'; const D = cardDef(e.c); if (!e.secret && (D.cost || 0) > B.nrg[p]) return 'Pas assez d’énergie'; if ((D.tgt === 'enemy' || D.tgt === 'allfoes' || D.tgt === 'rnd') && !B.foes().length) return 'Plus d’ennemis'; return ''; };
  B.playEnv = (i, t, p = 0) => {
    if (B.over) return false; B.cur = p; if (B.envWhy(i, p)) return false;
    const e = B.env[i], D = cardDef(e.c);
    if (e.secret && (D.tgt === 'enemy' || D.tgt === 'ally') && (!t || t.hp <= 0 || t.ko)) t = crawlCardChoice(B, e.c).t;
    if (D.tgt === 'enemy' && (!t || t.hp <= 0)) t = B.foes()[0];
    if (D.tgt === 'ally' && (!t || t.ko)) t = B.mates().sort((a, b) => a.hp / a.max - b.hp / b.max)[0];
    if (!e.secret) B.nrg[p] -= D.cost || 0; e.used = true;
    say(e.secret ? `Un secret ! ${D.name}` : D.name, 'card', { k: 'env', idx: i, key: e.key, ik: typeof cardIk === 'function' ? cardIk(D, D.el) : '', p, secret: !!e.secret });
    B.noBackfire = !!e.secret; B.exec(e.c, D, null, t); B.noBackfire = false;
    B.check(); return true;
  };
  B.exec = (c, D, me, t) => {
    const up = B.up(c), foesT = D.tgt === 'allfoes' ? B.foes() : D.tgt === 'enemy' ? [t].filter(Boolean) : [], allyT = D.tgt === 'allies' ? B.mates() : (D.tgt === 'ally' || D.tgt === 'self') && t ? [t] : [];
    if (D.dmg != null) {
      let dmg = B.dmgOf(c, me);
      if (D.fx === 'lowbonus' && t && t.hp < t.max / 2) dmg += 5;
      if (D.fx === 'rage' && me && me.hp < me.max / 2) dmg += 5;
      if (D.fx === 'surprise' && B.turn === 1) dmg += 6;
      const el = cardEl(c, me);
      if (D.tgt === 'rnd') for (let h = 0; h < (D.hits || 1); h++) { const f = pick(B.foes()); if (f) B.hit(me, f, dmg, { el }); }
      else foesT.forEach(f => { for (let h = 0; h < (D.hits || 1) && f.hp > 0; h++) { const d = B.hit(me, f, dmg, { aoe: D.tgt === 'allfoes', pierce: D.pierce, el }); if (D.fx === 'drain' && me) B.heal(me, Math.ceil(d / 2)); } if (D.fx === 'devour' && me && f.hp <= 0) B.heal(me, 6); });
      if (D.splash) { const o = B.foes().filter(f => !foesT.includes(f)); const f = pick(o); if (f) B.hit(me, f, D.splash + up, { aoe: true, el }); }
      if (D.backfire && !B.noBackfire) { say('Ça éclabousse aussi l’équipe !', 'bad', { k: 'trap' }); B.mates().forEach(a => B.hurt({ name: D.name, uid: 'env', st: {} }, a, D.backfire, el)); }
    }
    if (D.blk != null) { const v = B.blkOf(c, me); allyT.forEach(a => B.block(a, v)); }
    if (D.heal != null) { const v = B.healOf(c); allyT.forEach(a => B.heal(a, v)); }
    if (D.cure) allyT.forEach(a => { if (a.st.poison) { a.st.poison = 0; say(`${a.name} n’est plus empoisonné·e.`, 'good', { k: 'calm', to: a.id, v: 0 }); } });
    if (D.calm != null) allyT.forEach(a => B.calm(a, D.calm + 2 * up));
    if (D.buff) allyT.forEach(a => { a.st.song = (a.st.song || 0) + D.buff + up; say(`${a.name} : +${D.buff + up} de force pour ce combat.`, 'good', { k: 'buff', to: a.id }); });
    if (D.taunt) { const a = D.tgt === 'self' ? me : t; if (a) { a.st.taunt = 1; say(`${a.name} attire les coups.`, '', { k: 'block', to: a.id, v: 0 }); B.foes().forEach(f => { if (f.int && f.int.t) f.int.t = a.id; }); } }
    if (D.evade && me) { me.st.evade = 1; say(`${me.name} se prépare à esquiver.`, 'good', { k: 'block', to: me.id, v: 0 }); }
    if (D.stun) foesT.forEach(f => f.hp > 0 && B.stun(f, D.stun));
    if (D.weak) foesT.forEach(f => { if (f.hp <= 0) return; f.st.weak = Math.max(f.st.weak || 0, D.weak[0] + up); f.st.weakT = Math.max(f.st.weakT || 0, D.weak[1]); say(`${f.name} frappe ${D.weak[0] + up} de moins.`, 'good', { k: 'weak', to: f.uid }); });
    if (D.poison) foesT.forEach(f => { const m = elemMul('poison', f); if (!m) { say(`${f.name} est immunisé contre le poison.`, 'bad', { k: 'miss', to: f.uid }); return; } f.st.poison = (f.st.poison || 0) + Math.ceil((D.poison + up) * m); say(`${f.name} est empoisonné (${Math.ceil((D.poison + up) * m)}).`, 'good', { k: 'poison', to: f.uid }); });
    if (D.loot) { B.R.loot.g += D.loot; say(`+${D.loot} or dans le butin.`, 'good', { k: 'loot' }); }
    if (D.fx === 'calmall') B.mates().forEach(a => B.calm(a, 2));
    if (D.trap) { B.trap += D.trap + 3 * up; say(`Un piège est tendu (${B.trap}).`, 'good', { k: 'trap' }); }
    if (D.decoy) { B.decoy += 1; say('Un leurre attirera la prochaine attaque.', 'good', { k: 'trap' }); }
    if (D.confuse && t && t.int) { t.st.confuse = 1; say(`${t.name} ne sait plus qui est qui : sa prochaine attaque frappe les siens.`, 'good', { k: 'stun', to: t.uid }); }
    if (D.bribe && t) { B.R.loot.g -= D.bribe; if (t.boss || t.elite) { t.st.stun = Math.max(t.st.stun || 0, 1); say(`${t.name} empoche l’or et regarde ailleurs un tour.`, 'good', { k: 'stun', to: t.uid }); } else { t.hp = 0; say(`${t.name} empoche l’or et s’en va.`, 'good', { k: 'down', to: t.uid }); } }
    if (D.revive) B.revive(t, D.revive + .15 * up);
    if (D.fx === 'risky' && t && Math.random() < 1 / 3) { say(`${t.name} devient tout·e vert·e.`, 'bad', { k: 'fear', to: t.id, v: 0 }); B.poisonP(t, 2); }
    if (D.fx === 'wish') { const r = Math.random(); if (r < 1 / 3) B.mates().forEach(a => B.heal(a, 5)); else if (r < 2 / 3) B.drawN(2); else { B.nrg[B.cur] += 2; say('Le vœu est exaucé : +2 énergie.', 'good', { k: 'trap' }); } }
    if (D.fear) { const a = me || pick(B.mates()); if (a) B.fear(a, D.fear); }
    if (D.nrg) { B.nrg[B.cur] += D.nrg + up; say(`+${D.nrg + up} énergie.`, 'good', { k: 'energy' }); }
    if (D.draw) B.drawN(D.draw + (up ? 1 : 0));
  };
  B.startTurn = () => {
    B.dazzleNow = B.dazzle || 0; B.dazzle = 0; if (B.dazzleNow) say(`Éblouie, l’équipe frappe ${B.dazzleNow} de moins ce tour-ci.`, 'bad', { k: 'trap' });
    B.turn++; for (let p = 0; p < B.np; p++) B.nrg[p] = Math.max(1, ENERGY + (B.turn === 1 && hasRelic('pierre') ? 1 : 0) - (B.nrgDebt || 0)); if (B.nrgDebt) say(`−${B.nrgDebt} énergie ce tour-ci.`, 'bad', { k: 'trap' }); B.nrgDebt = 0;
    B.party.forEach(c => { c.block = 0; if (c.st.taunt) c.st.taunt = 0; if (c.st.poison && !c.ko) { const d = Math.floor(c.st.poison * elemMul('poison', c)); c.hp -= d; c.st.poison--; say(`${c.name} souffre du poison (−${d}).`, 'bad', { k: 'hurt', to: c.id, v: d, ab: 0 }); if (c.hp <= 0) { c.hp = 0; c.ko = true; say(`${c.name} est K.O.`, 'bad', { k: 'ko', to: c.id }); } } });
    if (B.turn === 1 && hasRelic('couronne')) B.mates().forEach(c => B.block(c, 5));
    if (B.turn === 1 && hasRelic('cles') && B.foes().length) { B.foes().forEach(f => { f.st.weak = Math.max(f.st.weak || 0, 2); f.st.weakT = Math.max(f.st.weakT || 0, 1); }); say('Les Clés de Mirebrume tintent : les ennemis hésitent, et leur premier coup fait 2 de moins.', 'good', { k: 'trap' }); }
    for (let p = 0; p < B.np; p++) B.drawN(HAND_SIZE + (B.turn === 1 && hasRelic('gland') ? 2 : 0), p);
    B.check();
  };
  // fin du tour : la main part à la défausse, les immobilisées se dégourdissent
  B.endTurn = () => { B.hands.forEach(H => B.disc.push(...H.splice(0))); B.party.forEach(c => { if (c.st.stun) c.st.stun--; }); };
  // le tour des ennemis, un par un (l'écran les anime un à un ; le simulateur les enchaîne)
  B.enemyStart = () => { B.queue = B.foes().slice(); };
  B.enemyAct = f => {
    if (B.over || f.hp <= 0) return;
    f.block = 0;
    if (f.pow === 'ecorce') { const ev = powV('ecorce', 'v', 6); f.block += ev; say(`L’écorce de ${f.name} durcit (+${ev}).`, '', { k: 'fblock', to: f.uid, v: ev }); }
    if (f.st.poison) { const d = Math.floor(f.st.poison * elemMul('poison', f)); f.hp -= d; say(`${f.name} souffre du poison (−${d}).`, 'good', { k: 'hit', from: null, to: f.uid, v: d, ab: 0, el: 'poison' }); f.st.poison = Math.max(0, f.st.poison - 1); if (f.hp <= 0) { f.hp = 0; say(`${f.name} tombe.`, 'good', { k: 'down', to: f.uid }); B.check(); return; } }
    if (f.st.stun) { f.st.stun--; say(`${f.name} ne peut pas agir${f.lint ? ', ni ses actions légendaires' : ''}.`, 'good', { k: 'stun', to: f.uid }); f.ai++; B.intent(f); return; }
    B.doAct(f, f.int, false);
    if (f.weakTick !== B.turn && f.st.weakT) { f.st.weakT--; if (!f.st.weakT) f.st.weak = 0; }
    f.weakTick = B.turn;
    f.ai++;
    // les actions légendaires : une par tour, deux en fureur
    const E = CRAWL_EN[f.k];
    if (E.leg && !B.over && f.hp > 0) for (let i = 0; i < Math.min(3, B.np) && !B.over && f.hp > 0; i++) { const it = B.mkInt(f, E.leg[f.li % E.leg.length]); if (i === 0 && f.lint && f.lint.k === it.k) it.t = f.lint.t; if (i === 1 && f.lint2 && f.lint2.k === it.k) it.t = f.lint2.t; B.doAct(f, it, true); f.li++; }
    B.intent(f); B.check();
  };
  // une action ennemie (ordinaire, d'élite ou légendaire)
  B.doAct = (f, it, legend) => {
    const m = B.mates(); if (!m.length || !it) return;
    const taunter = m.find(c => c.st.taunt), single = SINGLE_K.includes(it.k);
    const tg = (single && taunter && it.k !== 'execute' && it.k !== 'petrify' ? taunter : null) || B.party.find(c => c.id === it.t && !c.ko) || (it.k === 'execute' ? m.slice().sort((a, b) => a.hp - b.hp)[0] : pick(m));
    say(`${f.name} : ${actName(it)}`, legend ? 'leg' : 'foe', { k: 'act', from: f.uid, to: tg ? tg.id : null, it: it.k, leg: !!legend, elite: !!ELITE_ACT[it.k] });
    const v = Math.max(0, (it.v || 0) - (f.st.weak || 0)), rnd = () => pick(B.mates());
    // un ennemi embrouillé frappe les siens
    if (!legend && f.st.confuse && ['atk', 'multi', 'drain', 'execute', 'smash'].includes(it.k)) { f.st.confuse = 0; const o = B.foes().find(x => x !== f) || f; B.hit(null, o, v * (it.k === 'multi' ? it.n : 1), { aoe: true }); return; }
    if (!legend && B.decoy && single) { B.decoy--; say(`${f.name} se jette sur le leurre !`, 'good', { k: 'miss', to: tg.id }); return; }
    if (B.trap && ['atk', 'multi', 'drain', 'execute', 'smash', 'grab'].includes(it.k)) { const d = B.trap; B.trap = 0; say(`Clac ! Le piège mord ${f.name}.`, 'good', { k: 'trap' }); B.hit(null, f, d, { aoe: true, el: 'perforant' }); if (f.hp <= 0) { B.check(); return; } }
    const el = ACT_EL[it.k] || (FOE_ELEM[f.k] || {}).el || 'contondant', hurtW = (t, x) => B.hurt({ ...f, st: { ...f.st, weak: 0 } }, t, x, el);   // la faiblesse est déjà comptée dans v
    const summon = (k, n = 1) => { for (let i = 0; i < n; i++) { if (B.foes().length >= 4 || !CRAWL_EN[k]) { f.block += 6; say(`${f.name} se protège (6).`, '', { k: 'fblock', to: f.uid, v: 6 }); return; } const x = crawlFoe(k, f.boss ? 1 : Math.min(R.floor, CRAWL_FLOORS), B.foesL.length, R.lvl); B.foesL.push(x); B.intent(x); say(`${f.name} appelle ${x.name} !`, 'bad', { k: 'summon', to: x.uid }); } };
    switch (it.k) {
      case 'atk': case 'execute': hurtW(tg, v); break;
      case 'multi': for (let i = 0; i < it.n; i++) hurtW(tg, v); break;
      case 'aoe': case 'tailall': B.mates().forEach(c => hurtW(c, v)); break;
      case 'drain': { const d = hurtW(tg, v); f.hp = Math.min(f.max, f.hp + d); break; }
      case 'block': f.block += it.v; say(`${f.name} se protège (${it.v}).`, '', { k: 'fblock', to: f.uid, v: it.v }); break;
      case 'heal': { const w = B.foes().sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; if (w) { const x = Math.min(it.v, w.max - w.hp); w.hp += x; say(`${f.name} soigne ${w.name} (+${x}).`, 'bad', { k: 'fheal', to: w.uid, v: x }); } break; }
      case 'buff': B.foes().forEach(o => { o.buff += it.v; }); say(`${f.name} galvanise les siens (+${it.v} en attaque).`, 'bad', { k: 'fbuff', to: f.uid }); break;
      case 'fear': B.fear(tg, it.v); break;
      case 'fearall': B.mates().forEach(c => B.fear(c, it.v)); break;
      case 'stun': tg.st.stun = 1; say(`${f.name} immobilise ${tg.name} : ses cartes ne se jouent pas au prochain tour.`, 'bad', { k: 'pstun', to: tg.id }); break;
      case 'poison': B.poisonP(tg, it.v); break;
      case 'poisonall': case 'toxic': say(`${f.name} crache un nuage toxique sur toute l’équipe.`, 'bad', { k: 'poison', to: null }); B.mates().forEach(c => B.poisonP(c, it.v)); break;
      case 'steal': { const g = Math.min(R.loot.g, it.v); R.loot.g -= g; hurtW(tg, 2); if (g) say(`${f.name} chipe ${g} or du butin !`, 'bad', { k: 'steal', to: tg.id }); break; }
      case 'summon': summon(it.v); break;
      case 'spawn': summon(it.v, 1); break;
      case 'smash': hurtW(tg, v); if (!tg.ko) { tg.st.stun = 1; say(`${tg.name} est assommé·e : ses cartes attendront.`, 'bad', { k: 'pstun', to: tg.id }); } break;
      case 'cocoon': tg.st.stun = 2; say(`${tg.name} est enfermé·e dans un cocon (2 tours).`, 'bad', { k: 'pstun', to: tg.id }); B.poisonP(tg, it.v); break;
      case 'serve': B.foes().forEach(o => { o.hp = Math.min(o.max, o.hp + it.v); o.buff += 2; }); say(`« Le thé est servi » : tous les ennemis récupèrent ${it.v} PV et +2 force.`, 'bad', { k: 'fbuff', to: f.uid }); break;
      case 'roots': B.mates().forEach(c => hurtW(c, v)); B.nrgDebt = (B.nrgDebt || 0) + 1; say('Des racines entravent l’équipe : −1 énergie au prochain tour.', 'bad', { k: 'pstun', to: null }); break;
      case 'shatter': B.mates().forEach(c => hurtW(c, v)); f.block = 0; break;
      case 'raise': { const dead = B.foesL.find(o => o.hp <= 0 && !o.boss && !o.raised); if (dead && !f.raisedOnce) { f.raisedOnce = true; dead.hp = Math.round(dead.max / 2); dead.raised = true; dead.st = {}; B.intent(dead); say(`${f.name} relève ${dead.name} !`, 'bad', { k: 'rise', to: dead.uid }); } else summon(it.v, 1); break; }
      case 'souldrain': { let sum = 0; B.mates().forEach(c => { sum += hurtW(c, v); }); sum = Math.ceil(sum / 2); f.hp = Math.min(f.max, f.hp + sum); if (sum) say(`${f.name} boit ${sum} PV d’âme.`, 'bad', { k: 'fheal', to: f.uid, v: sum }); break; }
      case 'round': B.foes().forEach(o => { o.hp = Math.min(o.max, o.hp + it.v); o.buff += 1; }); say(`Tournée générale : les ennemis récupèrent ${it.v} PV et +1 force.`, 'bad', { k: 'fbuff', to: f.uid }); break;
      case 'throw': for (let i = 0; i < it.n; i++) { const t = rnd(); if (t) hurtW(t, v); } break;
      case 'grab': hurtW(tg, v); if (!tg.ko) { tg.st.stun = 1; say(`${tg.name} est happé·e par la langue !`, 'bad', { k: 'pstun', to: tg.id }); } break;
      case 'swarm': { let sum = 0; for (let i = 0; i < it.n; i++) { const t = rnd(); if (t) sum += hurtW(t, v); } f.hp = Math.min(f.max, f.hp + Math.ceil(sum / 2)); break; }
      case 'charm': { const a = pick(B.mates()), b = pick(B.mates().filter(c => c !== a)); if (a && b) { say(`${a.name}, charmé·e, frappe ${b.name} !`, 'bad', { k: 'act', from: null, to: b.id }); B.hurt({ name: a.name, uid: a.id, st: {} }, b, a.atk + 2, (SP_ELEM[a.sp] || {}).atk); } break; }
      case 'blind': B.dazzle = 3; B.mates().forEach(c => B.fear(c, 1)); say('Une lumière aveuglante : au prochain tour, tes coups font 3 de moins.', 'bad', { k: 'pstun', to: null }); break;
      case 'petrify': tg.st.stun = 2; say(`${tg.name} est pétrifié·e : 2 tours sans ses cartes.`, 'bad', { k: 'pstun', to: tg.id }); break;
      case 'mist': f.st.mist = 2; break;
      case 'decree': B.nrgDebt = (B.nrgDebt || 0) + 1; B.mates().forEach(c => B.fear(c, 1)); say(`${it.nm ? `« ${it.nm} ! »` : '« Qu’on se prosterne ! »'} : −1 énergie au prochain tour, et la peur monte.`, 'bad', { k: 'pstun', to: null }); break;
    }
  };
  B.enemyEnd = () => { B.check(); };
  B.enemyTurn = () => { B.enemyStart(); for (const f of B.queue) { if (B.over) break; B.enemyAct(f); } B.enemyEnd(); };
  // la fuite : on quitte le donjon sur-le-champ, en lâchant la moitié du butin
  B.flee = () => { if (B.over) return; const boss = B.foes().some(f => f.boss); B.over = 'fled'; B.R.fledBoss = boss; B.party.forEach(c => { if (!c.ko) c.stress = Math.min(STRESS_MAX, c.stress + (boss ? 3 : 2)); }); say(boss ? 'L’équipe s’enfuit devant le boss en abandonnant tout le butin !' : 'L’équipe prend la fuite en lâchant une partie du butin !', 'bad', { k: 'flee' }); };
  B.check = () => {
    if (B.over) return true;
    if (!B.foes().length) { B.over = 'won'; return true; }
    if (!B.mates().length) { B.over = 'lost'; return true; }
    return false;
  };
  return B;
}

/* ---------- les autres salles ---------- */
const CRAWL_EVENTS = [
  { k: 'champignons', t: 'Un cercle de champignons qui luisent doucement dans le noir.', a: [['Les goûter', R => { const c = pick(R.party.filter(x => !x.ko)); if (!c) return 'Personne n’a faim.'; if (Math.random() < .6) { c.max += 5; c.hp += 5; return `${c.name} se sent pousser des ailes : +5 PV max pour l’expédition.`; } c.hp = Math.max(1, c.hp - 6); c.stress = Math.min(STRESS_MAX, c.stress + 2); return `${c.name} voit des choses (−6 PV, +2 de peur).`; }], ['Les cueillir pour le château', R => { const s = Math.round(3 * crawlDepthK(R)); R.loot.s += s; return `Une pleine besace : +${s} 🪵 au butin.`; }]] },
  { k: 'miroir', t: 'Un grand miroir qui montre ton château… en ruines.', a: [['Le briser', R => { const w = R.deck.slice().sort((a, b) => cardValue(cardDef(a)) - cardValue(cardDef(b)))[0]; if (w) R.deck.splice(R.deck.indexOf(w), 1); R.party.forEach(c => { c.stress = Math.max(0, c.stress - 2); }); return `Mille éclats : −2 de peur pour tous${w ? `, et ${cardName(w)} quitte le deck (il s’allège)` : ''}.`; }], ['Le regarder longtemps', R => { const n = [crawlBestUpgrade(R), null].map(() => { const c = crawlBestUpgrade(R); if (c) c.up = true; return c; }).filter(Boolean); R.party.forEach(c => { c.stress = Math.min(STRESS_MAX, c.stress + 3); }); return `Il vous montre comment faire mieux : ${n.map(cardName).join(' et ') || 'rien'} amélioré${n.length > 1 ? 'es' : 'e'}, mais +3 de peur pour tous.`; }]] },
  { k: 'osselets', t: 'Un gobelin joueur, assis sur un tonneau, propose une partie d’osselets.', a: [['Parier jusqu’à 10 💰 du butin', R => { const b = Math.min(10, R.loot.g); if (!b) return 'Ton butin est vide : il ricane et range ses osselets.'; if (Math.random() < .5) { R.loot.g += b; return `Gagné ! +${b} 💰 au butin.`; } R.loot.g -= b; return `Perdu… −${b} 💰. Il a sûrement triché.`; }], ['Décliner poliment', () => 'Il hausse les épaules et relance les osselets tout seul.']] },
  { k: 'blesse', t: 'Un aventurier blessé, adossé au mur, qui n’a plus la force de fuir.', a: [['Le soigner et le relâcher', R => { R.freed = (R.freed || 0) + 1; R.party.forEach(c => { c.stress = Math.max(0, c.stress - 2); }); return 'Il bredouille un merci : on parlera de toi au village (bonne volonté), et −2 de peur pour tous.'; }], ['Lui prendre sa bourse', R => { const g = Math.round(8 * crawlDepthK(R) * CRAWL_GOLD); R.loot.g += g; R.party.forEach(c => { c.stress = Math.min(STRESS_MAX, c.stress + 2); }); return `+${g} 💰 au butin. Personne n’en est très fier (+2 de peur).`; }]] },
  { k: 'grimoire', t: 'Une bibliothèque engloutie : des pages flottent dans l’eau noire.', a: [['Étudier une page', R => { const o = crawlRewards(R, 1)[0]; if (!o) return 'Rien de lisible.'; o.up = true; R.deck.push(o); R.party.forEach(c => { c.stress = Math.min(STRESS_MAX, c.stress + 1); }); return `${cardName(o)} rejoint le deck, déjà améliorée (+1 de peur : il faisait très noir).`; }], ['Repêcher les reliures', R => { const g = Math.round(5 * crawlDepthK(R) * CRAWL_GOLD); R.loot.g += g; return `Du cuir et des fermoirs d’argent : +${g} 💰.`; }]] },
  { k: 'autel', t: 'Un autel poussiéreux, couvert de bougies noires.', a: [['Prier', R => { if (Math.random() < .55) { R.party.forEach(c => { if (!c.ko) c.hp = Math.min(c.max, c.hp + 6); }); return 'Une douce chaleur : +6 PV pour toute l’équipe.'; } R.party.forEach(c => { if (!c.ko) c.stress = Math.min(STRESS_MAX, c.stress + 3); }); return 'Une voix d’outre-tombe ricane : +3 de peur pour toute l’équipe.'; }], ['Passer son chemin', () => 'On ne touche pas aux autels des autres.']] },
  { k: 'coffre', t: 'Un coffre fermé, un peu trop bien en évidence.', a: [['L’ouvrir', R => { if (Math.random() < .6) { const g = Math.round(6 * crawlDepthK(R) * CRAWL_GOLD); R.loot.g += g; return `Il est plein : +${g} 💰.`; } const c = pick(R.party.filter(x => !x.ko)); if (c) c.hp = Math.max(1, c.hp - 6); return `C’était un piège : ${c ? c.name + ' perd 6 PV' : 'personne n’est touché'}.`; }], ['Le laisser', () => 'Trop beau pour être vrai.']] },
  { k: 'fontaine', t: 'Une fontaine qui glougloute dans le noir.', a: [['Boire', R => { const c = R.party.filter(x => !x.ko).sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; if (!c) return 'Personne n’a soif.'; if (Math.random() < .65) { c.hp = c.max; return `${c.name} boit et se sent comme neuf (PV au maximum).`; } c.stress = Math.min(STRESS_MAX, c.stress + 3); return `${c.name} boit… et entend des voix (+3 de peur).`; }], ['Remplir les gourdes', R => { R.party.forEach(c => { c.stress = Math.max(0, c.stress - 2); }); return 'L’eau fraîche apaise tout le monde (−2 de peur).'; }]] },
  { k: 'marchand', t: 'Un marchand ambulant, perdu depuis des semaines.', a: [['Acheter une potion (8 💰 du butin)', R => { if (R.loot.g < 8) return 'Pas assez dans le butin.'; R.loot.g -= 8; R.party.forEach(c => { if (!c.ko) c.hp = Math.min(c.max, c.hp + 8); }); return 'Une potion pour tous : +8 PV.'; }], ['Lui indiquer la sortie', R => { R.loot.g += 3; return 'Reconnaissant, il te laisse 3 💰.'; }]] },
  { k: 'cage', t: 'Une cage, et dedans, un prisonnier du donjon qui supplie.', a: [['Le libérer', R => { R.freed = (R.freed || 0) + 1; R.party.forEach(c => { c.stress = Math.max(0, c.stress - 1); }); return 'Il file en jurant de chanter tes louanges au village (bonne volonté).'; }], ['Ignorer', R => { R.party.forEach(c => { c.stress = Math.min(STRESS_MAX, c.stress + 1); }); return 'Ses cris vous suivent longtemps (+1 de peur).'; }]] },
  { k: 'forge', t: 'Une enclume abandonnée, encore tiède. Quelqu’un forgeait ici il y a peu.', a: [['Aiguiser une carte', R => { const c = crawlBestUpgrade(R); if (!c) return 'Rien à aiguiser.'; c.up = true; return `${cardName(c)} : la carte est améliorée.`; }], ['Se méfier', R => { R.party.forEach(c => { c.stress = Math.max(0, c.stress - 1); }); return 'On ne touche à rien (−1 de peur).'; }]] },
  { k: 'colporteur', t: 'Un colporteur à la hotte pleine de bricoles, qui parle tout seul.', a: [['Lui donner 6 💰 du butin contre une carte', R => { if (R.loot.g < 6) return 'Pas assez dans le butin.'; const o = crawlRewards(R, 1)[0]; if (!o) return 'Il n’a rien qui te serve.'; R.loot.g -= 6; R.deck.push(o); return `Il te cède ${cardName(o)}.`; }], ['Le laisser parler', () => 'Il parle encore quand vous tournez au coin.']] },
];
// ce que chaque choix risque ou promet (affiché sous le bouton)
const EVENT_HINTS = {
  champignons: ['+5 PV max pour l’un… ou −6 PV et de la peur', 'du bois au butin'], miroir: ['retire la pire carte du deck, −2 peur', 'améliore 2 cartes, +3 peur pour tous'],
  osselets: ['double ou rien (10 💰 au plus)', 'rien'], blesse: ['bonne volonté au village, −2 peur', 'de l’or, +2 peur pour tous'], grimoire: ['une carte améliorée, +1 peur', 'de l’or'],
  autel: ['soin pour tous… ou de la peur', 'rien'], coffre: ['de l’or… ou un piège (−6 PV)', 'rien'], fontaine: ['le plus blessé guérit… ou prend peur', '−2 peur pour tous'],
  marchand: ['+8 PV pour tous (8 💰)', '+3 💰'], cage: ['bonne volonté au village, −1 peur', '+1 peur pour tous'], forge: ['améliore ta meilleure carte', '−1 peur pour tous'], colporteur: ['une carte au hasard (6 💰)', 'rien'],
};
CRAWL_EVENTS.forEach(E => (EVENT_HINTS[E.k] || []).forEach((h, i) => { if (E.a[i]) E.a[i][2] = h; }));

function crawlTreasure(R) { const k = crawlDepthK(R), g = Math.round((4 + Math.random() * 4) * k * CRAWL_GOLD), s = Math.random() < .5 ? Math.round(2 * k) : 0; R.loot.g += g; R.loot.s += s; let item = null; if (Math.random() < .2) { item = pick(FURN_ORDER.filter(t => !FURN[t].size && FURN[t].cost && (FURN[t].cost.g || 0) <= 4)); if (item) R.loot.items.push(item); } return `Un trésor : +${g} 💰${s ? `, +${s} 🪵` : ''}${item ? `, et un sticker ${FURN[item].name}` : ''}.`; }
// le repos : soigner, se calmer, ou aiguiser une carte
function crawlRest(R, how, card) {
  if (how === 'calm') { R.party.forEach(c => { c.stress = Math.max(0, c.stress - 4); }); return 'Un feu de camp, des histoires idiotes : −4 de peur pour tous.'; }
  if (how === 'up') { const c = card || crawlBestUpgrade(R); if (!c) return 'Rien à aiguiser.'; c.up = true; return `Au coin du feu, on aiguise ${cardDef(c).name} : la carte est améliorée.`; }
  R.party.forEach(c => { if (!c.ko) c.hp = Math.min(c.max, c.hp + Math.round(c.max * .3)); }); return 'Un feu de camp et un bon somme : +30 % des PV pour tous.';
}
const crawlBestUpgrade = R => R.deck.filter(c => !c.up && !(c.owner && (R.party.find(p => p.id === c.owner) || {}).ko)).sort((a, b) => cardValue(cardDef(b)) - cardValue(cardDef(a)))[0];
// les récompenses d'un combat : trois cartes au choix (du château, ou la carte d'une coéquipière)
function crawlRewards(R, n = 3) {
  const pool = castlePool().map(k => ['castle', k, null]);
  R.party.filter(p => !p.ko && CRAWL_SK[p.sp]).forEach(p => pool.push(['sp', p.sp, p.id]));
  const out = [], seen = new Set();
  for (let i = 0; i < 30 && out.length < n && pool.length; i++) { const [src, key, owner] = pick(pool), id = src + key + (owner || ''); if (seen.has(id)) continue; seen.add(id); out.push(newCard(src, key, owner, Math.random() < .15)); }
  return out;
}
// le butin d'un combat gagné
function crawlWinLoot(R, kind) {
  const k = crawlDepthK(R), g = Math.round((kind === 'boss' ? 18 : kind === 'elite' ? 8 : 3) * k * (.8 + Math.random() * .4) * CRAWL_GOLD), s = kind === 'combat' ? 0 : Math.round((kind === 'boss' ? 5 : 2) * k);
  R.loot.g += g; R.loot.s += s; R.won = (R.won || 0) + 1;
  if (hasRelic('chope')) R.party.forEach(c => { if (!c.ko) c.hp = Math.min(c.max, c.hp + 3); });
  if (kind === 'boss') { const rl = CRAWL_DG[R.dg].relic; if (!hasRelic(rl)) R.relic = rl; }
  return `Butin : +${g} 💰${s ? `, +${s} 🪵` : ''}.`;
}

/* ---------- le joueur automatique (simulateur, et « combat auto ») ---------- */
// les dégâts attendus sur chaque créature ce tour-ci
function crawlThreat(B) {
  const inc = {}, mates = B.mates(), taunter = mates.find(c => c.st.taunt); mates.forEach(c => { inc[c.id] = 0; });
  B.foes().forEach(f => {
    if (f.st.stun) return; const w = f.st.weak || 0;
    const its = [f.st.confuse ? null : f.int, f.lint, f.lint2].filter(Boolean);
    its.forEach(it => intentHits(it, mates).forEach(([id, x]) => { const to = taunter && SINGLE_K.includes(it.k) && it.k !== 'execute' ? taunter.id : id; if (to in inc) inc[to] += Math.max(0, x - w * (it.k === 'multi' ? it.n : 1)); }));
  });
  return inc;
}
const foeThreat = f => { if (f.st.stun) return 0; const mates = [1, 2, 3].map(i => ({ id: 'm' + i })), w = f.st.weak || 0;
  return [f.int, f.lint, f.lint2].filter(Boolean).reduce((a, it) => a + intentHits(it, mates).reduce((b, [, x]) => b + Math.max(0, x - w), 0) + (['fear', 'fearall', 'stun', 'poison', 'poisonall', 'toxic', 'cocoon', 'petrify', 'blind', 'decree'].includes(it.k) ? 4 : ['summon', 'spawn', 'raise'].includes(it.k) ? 5 : ['heal', 'buff', 'serve', 'round'].includes(it.k) ? 3 : 0), 0); };
// la meilleure cible d'une carte, et ce qu'elle rapporterait
function crawlCardChoice(B, c) {
  const D = cardDef(c), me = B.owner(c), inc = crawlThreat(B), foes = B.foes(), mates = B.mates();
  const need = a => Math.max(0, (inc[a.id] || 0) - (a.block || 0)), lethal = a => need(a) >= a.hp;
  const evalFoe = (f, dmg) => { const eff = Math.min(dmg, f.hp + (f.block || 0)), kill = dmg >= f.hp + (f.block || 0); return Math.max(0, eff - (f.block || 0) * .5) + (kill ? 4 + foeThreat(f) * 1.6 : 0); };
  const dmg = B.dmgOf(c, me) + (D.fx === 'surprise' && B.turn === 1 ? 6 : 0) + (D.fx === 'rage' && me && me.hp < me.max / 2 ? 5 : 0);
  const targets = D.tgt === 'enemy' ? foes : D.tgt === 'ally' ? mates : D.tgt === 'ko' ? B.party.filter(p => p.ko) : [null];
  let best = null, bv = -1;
  for (const t of targets) {
    let v = 0;
    if (D.dmg != null) {
      if (D.tgt === 'allfoes') v += foes.reduce((a, f) => a + evalFoe(f, Math.floor(dmg * elemMul(cardEl(c, me), f))), 0);
      else if (D.tgt === 'rnd') v += dmg * (D.hits || 1) * .9;
      else if (t) v += evalFoe(t, Math.floor((dmg + (D.fx === 'lowbonus' && t.hp < t.max / 2 ? 5 : 0)) * elemMul(cardEl(c, me), t))) * (D.hits || 1);
      if (D.splash) v += Math.min(D.splash, 6);
    }
    if (D.blk != null) { const bl = B.blkOf(c, me), as = D.tgt === 'allies' ? mates : D.tgt === 'self' ? [me].filter(Boolean) : [t].filter(Boolean); v += as.reduce((a, x) => a + Math.min(bl, need(x)) * (lethal(x) ? 2.2 : 1.1), 0); }
    if (D.heal != null) { const h = B.healOf(c), as = D.tgt === 'allies' ? mates : [t].filter(Boolean); v += as.reduce((a, x) => a + Math.min(h, x.max - x.hp) * (x.hp < x.max * .4 ? 1.4 : .55), 0); }
    if (D.calm != null) { const as = D.tgt === 'allies' ? mates : [t].filter(Boolean); v += as.reduce((a, x) => a + Math.min(D.calm, x.stress) * (x.stress >= 7 ? 1.4 : .45), 0); }
    if (D.cure) v += mates.reduce((a, x) => a + (x.st.poison || 0) * 1.2, 0);
    if (D.buff) { const left = B.hands[B.cur].filter(o => o !== c && cardDef(o).dmg != null).length; v += (D.tgt === 'allies' ? mates.length : 1) * D.buff * (1 + left * .7); }
    if (D.stun && D.tgt === 'enemy' && t) v += t.st.stun ? 0 : foeThreat(t) * 1.4 * D.stun;
    if (D.weak) { const fs = D.tgt === 'allfoes' ? foes : [t].filter(Boolean); v += fs.reduce((a, f) => a + (f.int && ['atk', 'multi', 'aoe', 'drain'].includes(f.int.k) ? Math.min(D.weak[0], f.int.v) * (f.int.k === 'multi' ? f.int.n : f.int.k === 'aoe' ? mates.length : 1) * 1.1 : 0) + D.weak[0] * (D.weak[1] - 1) * .5, 0); }
    if (D.poison && t) v += D.poison * 1.5;
    if (D.trap) v += foes.some(f => f.int && !f.st.stun && ['atk', 'multi', 'drain'].includes(f.int.k)) ? Math.min(D.trap, 10) : 1;
    if (D.decoy) v += Math.max(0, ...foes.map(f => f.int && !f.st.stun && ['atk', 'multi', 'drain', 'steal'].includes(f.int.k) ? Math.max(0, f.int.v - (f.st.weak || 0)) * (f.int.n || 1) : 0)) * 1.1;
    if (D.evade && me) v += Math.min(inc[me.id] || 0, me.hp) * 1.1 + 1;
    if (D.taunt && D.tgt === 'self' && me) v += mates.length > 1 ? 2 : 0;
    if (D.confuse && t) v += foeThreat(t) * 1.3;
    if (D.bribe && t) v += t.boss || t.elite ? foeThreat(t) : t.hp + foeThreat(t) * 1.5;
    if (D.revive && t) v += 16;
    if (D.draw) v += D.draw * (B.nrg[B.cur] - B.costOf(c) > 0 ? 3 : 1.2);
    if (D.nrg) v += D.nrg * (B.hands[B.cur].length > 1 ? 4 : .5);
    if (D.loot) v += 3;
    if (D.fx === 'calmall') v += mates.reduce((a, x) => a + Math.min(2, x.stress) * .45, 0);
    if (D.fx === 'wish') v += 6;
    if (D.fear) v -= D.fear * 1.5;
    if (v > bv) { bv = v; best = t; }
  }
  return { t: best, v: bv };
}
// un tour entier, joué au mieux (glouton) : on joue la carte qui rapporte le plus par point d'énergie, tant qu'elle rapporte
function crawlAutoPick(B, p = 0) {
  B.cur = p;
  const opts = B.hands[p].filter(c => !B.why(c, p)).map(c => { const ch = crawlCardChoice(B, c), cost = B.costOf(c); return { c, t: ch.t, v: ch.v, r: ch.v / (cost + .6) }; });
  // le secret du décor ne se joue pas tout seul : il faut le trouver (et le toucher)
  return opts.filter(o => o.v >= 1.5).sort((a, b) => b.r - a.r)[0] || null;
}
const crawlAutoDo = (B, o, p = 0) => o.env != null ? B.playEnv(o.env, o.t, p) : B.play(o.c, o.t, p);
function crawlAutoTurn(B, p) { const ps = p == null ? [...Array(B.np).keys()] : [p]; for (const q of ps) for (let guard = 0; guard < 25 && !B.over; guard++) { const o = crawlAutoPick(B, q); if (!o) break; crawlAutoDo(B, o, q); } }
// une expédition jouée sans affichage, avec une prudence donnée (seuil de PV moyen pour continuer) ; push : seul le boss compte (le Siège), on y va même avec une créature à terre
function crawlAuto(dg, team, opts = {}) {
  const R = crawlNew(dg, team, opts), prudence = opts.prudence == null ? .55 : opts.prudence, cautious = prudence >= .5;
  for (;;) {
    const node = R.choices.find(c => c.k === 'repos' && R.party.some(p => p.hp < p.max * .6)) || R.choices.find(c => c.k === 'tresor') || R.choices.find(c => c.k !== 'elite') || R.choices[0];
    R.path.push(node.k);
    if (['combat', 'elite', 'boss'].includes(node.k)) {
      const B = crawlBattle(R, crawlFoes(R, node.k)), foeHp0 = B.foesL.reduce((a, f) => a + f.max, 0);
      for (let guard = 0; guard < 40 && !B.over; guard++) {
        B.startTurn(); if (B.over) break;
        const ma = B.mates(), avg = ma.reduce((a, c) => a + c.hp / c.max, 0) / R.party.length, foeHp = B.foes().reduce((a, f) => a + f.hp, 0);
        if (avg < (cautious ? .4 : .15) && foeHp > foeHp0 * .4) { B.flee(); break; }
        crawlAutoTurn(B); if (B.over) break;
        B.endTurn(); B.enemyTurn();
      }
      if (!B.over) B.over = 'lost';
      if (B.over === 'fled') { R.done = 'fled'; const k = .5; R.loot.g = Math.floor(R.loot.g * k); R.loot.s = Math.floor(R.loot.s * k); if (R.fledBoss) R.loot.items = []; break; }
      if (B.over !== 'won') { R.done = 'wipe'; break; }
      R.party.forEach(c => { c.block = 0; c.st = {}; });
      crawlWinLoot(R, node.k);
      if (node.k === 'boss') { R.done = 'boss'; break; }
      const rw = crawlRewards(R, 3).sort((a, b) => cardValue(cardDef(b)) - cardValue(cardDef(a)))[0]; if (rw && cardValue(cardDef(rw)) > 5) R.deck.push(rw);
    } else if (node.k === 'tresor') crawlTreasure(R);
    else if (node.k === 'repos') crawlRest(R, R.party.some(p => !p.ko && p.hp < p.max * .65) ? 'heal' : R.party.some(c => c.stress >= 6) ? 'calm' : 'up');
    else { const E = pick(CRAWL_EVENTS); E.a[Math.random() < .6 ? 0 : 1][1](R); }
    crawlAdvance(R);
    const alive = R.party.filter(c => !c.ko), avg = alive.reduce((a, c) => a + c.hp / c.max, 0) / Math.max(1, R.party.length);
    const bossNext = R.floor > CRAWL_FLOORS;
    if (alive.length < R.party.length * .5 || avg < prudence || (bossNext && !opts.push && (avg < (cautious ? .8 : .5) || alive.length < R.party.length))) { R.done = 'retreat'; break; }
  }
  return R;
}
// au retour : fatigue (la peur se paie), bosses, expérience, butin
function crawlApply(R, team, lines) {
  const kept = R.done === 'wipe' ? .25 : 1, g = Math.round(R.loot.g * kept), s = Math.round(R.loot.s * kept);   // terrassés : un quart du butin, ramassé dans la débandade
  S.gold += g; S.mat += s; if (R.done !== 'wipe') R.loot.items.forEach(k => { S.free[k] = (S.free[k] || 0) + 1; });
  const deep = (R.floor - 1) * CRAWL_STEPS + R.step;
  team.forEach(c => {
    const p = R.party.find(x => x.id === c.id); if (!p) return;
    if (p.ko || R.done === 'wipe') c.hurt = Math.max(c.hurt || 0, S.night + 2);
    if (typeof addFat === 'function') { const f = Math.floor(p.stress / 3) + (R.done === 'wipe' ? 2 : 0); if (f) addFat(c, f, lines); }
    gainXP(c, 1 + Math.floor(deep / 3) + (R.done === 'boss' ? 2 : 0), lines);
  });
  if (R.relic && R.done === 'boss') { (S.relics = S.relics || []).push(R.relic); lines.push([RELICS[R.relic].ico, `Relique : ${RELICS[R.relic].name}. ${RELICS[R.relic].desc}`, 'good']); }
  if (R.done !== 'wipe' && R.freed && typeof settlements === 'function') { const s0 = settlements().filter(siteKnown)[0]; if (s0) addGw(s0, 4 * R.freed); }
  S.stats.crawls = (S.stats.crawls || 0) + 1; if (R.done === 'boss') S.stats.crawlBoss = (S.stats.crawlBoss || 0) + 1;
  if (R.done === 'fled') lines.push(['🏃', R.fledBoss ? 'Face au boss, l’équipe a fui en laissant la moitié du butin et tous les stickers.' : 'Dans la fuite, la moitié du butin est restée au donjon.', 'bad']);
  lines.unshift([R.done === 'boss' ? '👑' : R.done === 'wipe' ? '💀' : '🏃', R.done === 'boss' ? `Le boss est vaincu ! Butin : ${costText({ g, s })}${R.loot.items.length ? ` et ${R.loot.items.length} sticker${R.loot.items.length > 1 ? 's' : ''}` : ''}.` : R.done === 'wipe' ? `L’équipe est terrassée : elle ne rapporte qu’un quart du butin (${costText({ g, s })}), et tout le monde rentre sonné.` : `L’équipe remonte de l’étage ${Math.min(R.floor, CRAWL_FLOORS)} ${g || s ? 'avec ' + costText({ g, s }) : 'les mains vides'}${R.loot.items.length ? ` et ${R.loot.items.length} sticker${R.loot.items.length > 1 ? 's' : ''}` : ''}.`, R.done === 'wipe' ? 'bad' : 'good']);
  return { deep, g, s };
}
// la description d'une carte, avec les valeurs qu'elle aurait jouée par « me » (ou dans l'absolu)
function cardText(c, me, B) {
  const D = cardDef(c), up = c.up ? 1 : 0, out = [];
  const dmg = D.dmg != null ? (B ? B.dmgOf(c, me) : D.dmg + (D.atk && me ? me.atk * D.atk : 0) + 3 * up - (D.hits > 1 && up ? 2 : 0)) : 0;
  const blk = D.blk != null ? (B ? B.blkOf(c, me) : D.blk + (D.grd && me ? Math.floor(me.guard / 2) : 0) + 3 * up) : 0;
  const heal = D.heal != null ? D.heal + (D.tgt === 'allies' ? 1 : 3) * up : 0;
  const who = { ally: 'une alliée', allies: 'toute l’équipe', self: 'elle-même', enemy: 'un ennemi', allfoes: 'tous les ennemis' }[D.tgt] || '';
  const el = D.dmg != null ? (D.el || (me ? (SP_ELEM[me.sp] || {}).atk : null)) : null, elw = el ? ' ' + ELEM[el][1] : '';
  if (D.dmg != null) out.push(D.tgt === 'allfoes' ? `${dmg}${elw} à tous les ennemis` : D.tgt === 'rnd' ? `${dmg}${elw}, ${D.hits} fois, au hasard` : `Inflige ${dmg}${elw}${D.hits > 1 ? ` ×${D.hits}` : ''}${!me && D.atk ? ' (+ sa force, selon son arme)' : ''}${D.pierce ? ', à travers la parade' : ''}`);
  if (D.splash) out.push(`${D.splash + up} à un autre ennemi`);
  if (D.blk != null) out.push(`Parade ${blk}${!me && D.grd ? ' (+ la moitié de sa garde)' : ''} pour ${who}`);
  if (D.heal != null) out.push(`Soigne ${heal} PV à ${who}`);
  if (D.cure) out.push('guérit le poison');
  if (D.calm != null) out.push(`−${D.calm + 2 * up} de peur pour ${who}`);
  if (D.buff) out.push(`+${D.buff + up} de force pour ce combat (${who})`);
  if (D.stun) out.push(`${D.tgt === 'allfoes' ? 'Les ennemis perdent' : 'L’ennemi perd'} ${D.stun > 1 ? `ses ${D.stun} prochaines actions` : 'sa prochaine action'}`);
  if (D.weak) out.push(`${D.tgt === 'allfoes' ? 'Tous les ennemis frappent' : 'L’ennemi frappe'} ${D.weak[0] + up} de moins${D.weak[1] > 1 ? ` pendant ${D.weak[1]} tours` : ' ce tour-ci'}`);
  if (D.poison) out.push(`Empoisonne (${D.poison + up})`);
  if (D.trap) out.push(`Le prochain ennemi qui attaque prend ${D.trap + 3 * up}`);
  if (D.decoy) out.push('La prochaine attaque ennemie frappe un leurre');
  if (D.evade) out.push('Esquive la prochaine attaque');
  if (D.taunt) out.push(D.tgt === 'self' ? 'attire les coups' : 'elle attire les coups');
  if (D.confuse) out.push('Sa prochaine attaque frappe les siens');
  if (D.bribe) out.push(`Paie ${D.bribe} or du butin : un ennemi ordinaire s’en va (un chef regarde ailleurs un tour)`);
  if (D.revive) out.push(`Relève une alliée K.O. (${Math.round((D.revive + .15 * up) * 100)} % de ses PV)`);
  if (D.nrg) out.push(`+${D.nrg + up} énergie`);
  if (D.draw) out.push(`Pioche ${D.draw + (up ? 1 : 0)}`);
  if (D.loot) out.push(`+${D.loot} or dans le butin`);
  if (D.note) out.push(D.note);
  if (D.backfire) out.push(`Attention : ${D.backfire} à toute l’équipe aussi`);
  if (D.fear) out.push(`+${D.fear} de peur pour ${me ? 'elle' : 'une créature'}`);
  if (D.exhaust) out.push('Une fois par combat');
  return out.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('. ') + '.';
}
// la description d'une carte d'espèce (fiches, grimoire, présentation des nouvelles venues)
Object.keys(CRAWL_SK).forEach(k => { Object.defineProperty(CRAWL_SK[k], 'desc', { get() { return cardText({ src: 'sp', key: k, up: false }); }, enumerable: false }); });
