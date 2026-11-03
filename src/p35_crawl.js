
/* =========================================================
   Expéditions dans les donjons rivaux, façon Slay the Spire et
   Darkest Dungeon : une équipe de 4 créatures au plus, trois
   étages de salles au choix, des combats au tour par tour où
   l'on voit ce que prépare chaque ennemi, la peur qui monte,
   et après chaque salle, le choix : continuer, ou rentrer avec
   le butin. Le boss attend au bout du troisième étage.
   Ce fichier : les règles (sans affichage), jouables par le
   simulateur ; l'interface est dans p36_crawl_ui.js.
   ========================================================= */
const CRAWL_FLOORS = 3, CRAWL_STEPS = 3, STRESS_MAX = 10;
// le niveau du donjon monte avec ton palier et le temps : les rivaux, eux aussi, recrutent
// le niveau du donjon suit la renommée de tes champions (tes 4 meilleures créatures) : plus ils sont forts, plus le rival se prépare
const CRAWL_TUNE = { hpL: .35, dmgL: .8, hpF: .3, dmgF: 1, boss: 1.65, p0: 220, pk: 160 };
function crawlChampions() { return S.creatures.filter(c => !isOut(c)).map(c => crawler(c)).map(p => p.hp * p.atk).sort((a, b) => b - a).slice(0, 4).reduce((a, v) => a + v, 0); }
const crawlLevel = () => Math.round((1 + Math.max(0, (crawlChampions() - CRAWL_TUNE.p0) / CRAWL_TUNE.pk)) * 10) / 10;
// les ennemis : leurs actions tournent en boucle (on voit toujours la prochaine)
const CRAWL_EN = {
  sq:     { name: 'Squelette de garde', sp: 'squelette', hp: 12, acts: [['atk', 4], ['block', 5], ['atk', 5]], rise: 3 },
  spec:   { name: 'Spectre gémissant', sp: 'fantome', hp: 9, acts: [['fear', 3], ['atk', 3], ['fear', 3]] },
  aco:    { name: 'Acolyte nécromant', emo: '🧟', hp: 11, acts: [['heal', 5], ['atk', 3], ['summon', 'sq']] },
  chev:   { name: 'Chevalier d’os', emo: '💀', hp: 30, elite: 1, acts: [['atk', 8], ['block', 8], ['multi', 4, 2]] },
  ysolde: { name: 'Ysolde la nécromancienne', emo: '🧙‍♀️', hp: 70, boss: 1, acts: [['summon', 'sq'], ['aoe', 4], ['fearall', 3], ['drain', 9]] },
  gob:    { name: 'Gobelin pochtron', sp: 'gobelin', hp: 8, acts: [['atk', 4], ['atk', 3], ['steal', 3]] },
  orq:    { name: 'Orque videur', sp: 'orque', hp: 16, acts: [['atk', 6], ['block', 5], ['atk', 7]] },
  bra:    { name: 'Brasseur', emo: '🍺', hp: 10, acts: [['buff', 1], ['heal', 5], ['atk', 3]] },
  ogre:   { name: 'Ogre de la cave', emo: '👹', hp: 34, elite: 1, acts: [['atk', 10], ['stun'], ['aoe', 4]] },
  krouk:  { name: 'Krouk, baron gobelin', sp: 'gobelin', hp: 74, boss: 1, acts: [['buff', 2], ['multi', 3, 3], ['summon', 'gob'], ['atk', 12]] },
  crap:   { name: 'Crapaud baveux', sp: 'crapaud', hp: 10, acts: [['poison', 3], ['atk', 4]] },
  ara:    { name: 'Araignée des cavernes', sp: 'araignee', hp: 11, acts: [['stun'], ['atk', 5], ['atk', 4]] },
  cha:    { name: 'Champignon hurleur', emo: '🍄', hp: 8, acts: [['fearall', 2], ['block', 4]] },
  tis:    { name: 'Grande Tisseuse', sp: 'araignee', hp: 32, elite: 1, acts: [['stun'], ['multi', 3, 3], ['poison', 5]] },
  mere:   { name: 'Mère-Crapaud', sp: 'crapaud', hp: 72, boss: 1, acts: [['summon', 'crap'], ['poisonall', 3], ['atk', 11], ['heal', 9]] },
  bat:    { name: 'Chauve-souris', emo: '🦇', hp: 7, acts: [['drain', 3], ['drain', 4]] },
  garg:   { name: 'Gargouille de façade', sp: 'gargouille', hp: 14, acts: [['block', 7], ['atk', 6]] },
  vamp:   { name: 'Vampirette', sp: 'vampire', hp: 12, acts: [['fear', 3], ['drain', 5]] },
  maj:    { name: 'Majordome éternel', emo: '🎩', hp: 32, elite: 1, acts: [['buff', 2], ['atk', 7], ['block', 7]] },
  pale:   { name: 'Comte Pâlefroid', sp: 'vampire', hp: 76, boss: 1, acts: [['drain', 10], ['summon', 'bat'], ['fearall', 4], ['aoe', 5]] },
};
const CRAWL_DG = {
  morgrave:   { regs: ['sq', 'spec', 'aco'], elite: 'chev', boss: 'ysolde', relic: 'grimoireys', desc: 'Des morts qui ne restent pas couchés, et une peur qui colle aux os.' },
  septbieres: { regs: ['gob', 'orq', 'bra'], elite: 'ogre', boss: 'krouk', relic: 'chope', desc: 'Des brutes avinées qui frappent fort et se soignent à la bière.' },
  moussues:   { regs: ['crap', 'ara', 'cha'], elite: 'tis', boss: 'mere', relic: 'champi', desc: 'Poisons, toiles et spores : on s’y englue, on s’y empoisonne.' },
  ombrelune:  { regs: ['bat', 'garg', 'vamp'], elite: 'maj', boss: 'pale', relic: 'cape', desc: 'Des buveurs de sang qui guérissent en te mordant.' },
};
// les reliques : trouvées sur les boss, elles servent pour toutes les expéditions suivantes
const RELICS = {
  grimoireys: { ico: '📕', name: 'Grimoire d’Ysolde', desc: 'La première attaque de chaque combat fait +3 dégâts.' },
  chope:      { ico: '🍺', name: 'Chope de Krouk', desc: 'Après chaque combat, chaque créature récupère 3 PV.' },
  champi:     { ico: '🍄', name: 'Champignon de Mère-Crapaud', desc: 'La peur monte deux fois moins vite.' },
  cape:       { ico: '🦇', name: 'Cape d’Ombrelune', desc: 'La première attaque ennemie de chaque combat rate.' },
};
const hasRelic = k => !!(S.relics && S.relics.includes(k));
const NODES = { combat: { ico: '⚔️', name: 'Combat' }, elite: { ico: '💀', name: 'Élite' }, tresor: { ico: '💰', name: 'Trésor' }, repos: { ico: '🔥', name: 'Repos' }, event: { ico: '❓', name: 'Mystère' }, boss: { ico: '👑', name: 'Le boss' } };

/* ---------- l'équipe : tout vient de ton château ---------- */
// le talent de chaque espèce devient une capacité
const CRAWL_SK = {
  diablotin: { name: 'Esquive', ico: '💨', tgt: 'self', cd: 2, desc: 'Esquive la prochaine attaque.', run: (B, me) => { me.st.evade = 1; } },
  gobelin:   { name: 'Coup bas', ico: '🗡️', tgt: 'enemy', desc: '+3 dégâts contre un ennemi déjà amoché.', run: (B, me, t) => B.hit(me, t, me.atk + (t.hp < t.max / 2 ? 3 : 0) + B.up(me)) },
  kobold:    { name: 'Piège', ico: '⚙️', tgt: 'none', cd: 2, desc: 'Le prochain ennemi qui attaque prend 6 dégâts.', run: (B, me) => { B.trap += 6 + B.up(me); } },
  crapaud:   { name: 'Langue collante', ico: '👅', tgt: 'enemy', cd: 2, desc: 'L’ennemi perd sa prochaine action.', run: (B, me, t) => B.stun(t, 1) },
  gargouille:{ name: 'Statue', ico: '🗿', tgt: 'self', cd: 2, desc: 'Se protège de 8 et attire les coups.', run: (B, me) => { B.block(me, 8 + B.up(me)); me.st.taunt = 1; } },
  menestrel: { name: 'Chanson', ico: '🎵', tgt: 'none', cd: 2, desc: 'Toute l’équipe +1 en attaque pour ce combat, et −2 de peur.', run: (B, me) => { B.party.forEach(c => { if (!c.ko) { c.st.song = Math.min(3, (c.st.song || 0) + 1); B.calm(c, 2); } }); } },
  troll:     { name: 'Coup de massue', ico: '🔨', tgt: 'enemy', cd: 1, desc: 'Double dégâts.', run: (B, me, t) => B.hit(me, t, me.atk * 2 + B.up(me)) },
  fantome:   { name: 'Effroi', ico: '👻', tgt: 'enemy', cd: 2, desc: 'L’ennemi frappe 3 de moins pendant 2 tours.', run: (B, me, t) => { t.st.weak = 3; t.st.weakT = 2; } },
  sorciere:  { name: 'Potion', ico: '🧪', tgt: 'ally', desc: 'Soigne 6 PV.', run: (B, me, t) => B.heal(t, 6 + B.up(me)) },
  squelette: { name: 'Mur d’os', ico: '🦴', tgt: 'ally', desc: 'Protège une alliée de 7.', run: (B, me, t) => B.block(t, 7 + B.up(me)) },
  orque:     { name: 'Rage', ico: '😤', tgt: 'enemy', desc: 'Frappe ; +4 dégâts s’il a perdu la moitié de ses PV.', run: (B, me, t) => B.hit(me, t, me.atk + (me.hp < me.max / 2 ? 4 : 1) + B.up(me)) },
  araignee:  { name: 'Toile', ico: '🕸️', tgt: 'enemy', cd: 2, desc: 'L’ennemi perd sa prochaine action.', run: (B, me, t) => B.stun(t, 1) },
  dragonnet: { name: 'Souffle', ico: '🔥', tgt: 'none', cd: 1, desc: '3 dégâts à tous les ennemis.', run: (B, me) => B.foes().forEach(t => B.hit(me, t, 3 + B.up(me), true)) },
  mimique:   { name: 'Gueule', ico: '🪤', tgt: 'enemy', cd: 2, desc: 'Triple dégâts au premier tour d’un combat, double ensuite.', run: (B, me, t) => B.hit(me, t, me.atk * (B.turn === 1 ? 3 : 2) + B.up(me)) },
  vampire:   { name: 'Morsure', ico: '🩸', tgt: 'enemy', desc: 'Frappe et récupère la moitié des dégâts.', run: (B, me, t) => { const d = B.hit(me, t, me.atk + 1 + B.up(me)); B.heal(me, Math.ceil(d / 2)); } },
  golem:     { name: 'Rempart', ico: '🧱', tgt: 'none', cd: 2, desc: 'Protège toute l’équipe de 5.', run: (B, me) => B.party.forEach(c => { if (!c.ko) B.block(c, 5 + B.up(me)); }) },
  fee:       { name: 'Crapaudification', ico: '🐸', tgt: 'enemy', cd: 3, desc: 'L’ennemi perd ses deux prochaines actions.', run: (B, me, t) => B.stun(t, 2) },
  liche:     { name: 'Nécromancie', ico: '💀', tgt: 'ko', uses: 1, desc: 'Relève une alliée K.O. avec la moitié de ses PV (une fois par expédition).', run: (B, me, t) => B.revive(t, .5) },
  harpie:    { name: 'Cri perçant', ico: '📢', tgt: 'none', cd: 2, desc: '2 dégâts à tous les ennemis, qui frappent 1 de moins ce tour.', run: (B, me) => B.foes().forEach(t => { B.hit(me, t, 2 + B.up(me), true); t.st.weak = Math.max(t.st.weak || 0, 1); t.st.weakT = Math.max(t.st.weakT || 0, 1); }) },
  cocatrice: { name: 'Regard pétrifiant', ico: '👁️', tgt: 'enemy', cd: 2, desc: 'L’ennemi perd sa prochaine action.', run: (B, me, t) => B.stun(t, 1) },
  mandragore:{ name: 'Hurlement', ico: '🌱', tgt: 'none', cd: 3, desc: 'Tous les ennemis frappent 2 de moins pendant 2 tours.', run: (B, me) => B.foes().forEach(t => { t.st.weak = 2; t.st.weakT = 2; }) },
  nixe:      { name: 'Vague', ico: '🌊', tgt: 'enemy', desc: 'Frappe un ennemi, et 2 dégâts à un autre.', run: (B, me, t) => { B.hit(me, t, me.atk + B.up(me)); const o = B.foes().find(x => x !== t); if (o) B.hit(me, o, 2, true); } },
  goule:     { name: 'Dévorer', ico: '🍖', tgt: 'enemy', desc: 'Frappe ; si l’ennemi tombe, récupère 6 PV.', run: (B, me, t) => { B.hit(me, t, me.atk + 1 + B.up(me)); if (t.hp <= 0) B.heal(me, 6); } },
};
// ce que les meubles de ton château apprennent à l'équipe
const CRAWL_GEAR = [
  { key: 'coup', name: 'Coup puissant', ico: '💥', need: ['ratelier', 'armure', 'heaume', 'epeefaux'], who: c => guardOf(c) >= 2, tgt: 'enemy', cd: 2, desc: '+4 dégâts (appris au râtelier).', run: (B, me, t) => B.hit(me, t, me.atk + 4) },
  { key: 'fiole', name: 'Fiole de soin', ico: '⚗️', need: ['alambic', 'fioles', 'marmite'], who: () => true, tgt: 'ally', uses: 1, desc: 'Soigne 7 PV (une fois par expédition, préparée au laboratoire).', run: (B, me, t) => B.heal(t, 7) },
  { key: 'sort', name: 'Flammes', ico: '✨', need: ['grimoire', 'etagere', 'pupitre'], who: c => (SPECIES[c.sp] || {}).tag === 'magie', tgt: 'none', cd: 3, desc: '3 dégâts à tous les ennemis (appris dans les grimoires).', run: (B, me) => B.foes().forEach(t => B.hit(me, t, 3, true)) },
  { key: 'gnole', name: 'Remontant', ico: '🍻', need: ['biere', 'tablee'], who: () => true, tgt: 'ally', uses: 2, desc: 'Retire 4 de peur à une alliée (deux fois par expédition, servi à la taverne).', run: (B, me, t) => B.calm(t, 4) },
];
const BASIC_SK = {
  frapper: { name: 'Frapper', ico: '⚔️', tgt: 'enemy', desc: 'Frappe un ennemi.', run: (B, me, t) => B.hit(me, t, me.atk + B.up(me)) },
  garde:   { name: 'Se protéger', ico: '🛡️', tgt: 'self', desc: 'Encaisse les prochains coups.', run: (B, me) => B.block(me, me.guard + 3) },
};
function crawlSkills(c) {
  const out = [{ key: 'frapper', ...BASIC_SK.frapper }, { key: 'garde', ...BASIC_SK.garde }];
  if (CRAWL_SK[c.sp]) out.push({ key: 'sig', sig: 1, ...CRAWL_SK[c.sp] });
  CRAWL_GEAR.forEach(G => { if (G.need.some(hasItem) && G.who(c)) out.push({ key: G.key, gear: 1, ...G }); });
  if (c.evo || c.legend) out.push({ key: 'legende', name: 'Coup de légende', ico: '🌟', tgt: 'enemy', cd: 3, desc: '10 dégâts (une créature de légende).', run: (B, me, t) => B.hit(me, t, 10) });
  return out;
}
function crawler(c) {
  const g = guardOf(c), lv = c.lvl || 1, sp = SPECIES[c.sp] || {};
  const hp = 10 + 3 * g + 2 * (lv - 1) + (c.legend ? 5 : 0) + (c.evo ? 6 : 0) - ((c.fat || 0) >= 4 ? 4 : 0);
  const atk = 2 + Math.floor(g / 2) + (lv >= 3 ? 1 : 0) + (sp.tag === 'combat' && ['enclume', 'fourneau'].some(hasItem) ? 1 : 0);
  return { id: c.id, name: c.name, sp: c.sp, hp, max: hp, atk, guard: g, lv, block: 0, stress: 0, st: {}, skills: crawlSkills(c), cd: {}, uses: {}, ko: false, loyal: (c.loy || 0) >= 70, saved: false };
}

/* ---------- l'expédition : la carte, les salles, le butin ---------- */
function crawlNew(dg, team, seed) {
  const R = { dg, lvl: crawlLevel(), floor: 1, step: 0, party: team.map(c => crawler(c)), loot: { g: 0, s: 0, items: [] }, log: [], done: null, relic: null, seed: seed || Math.floor(Math.random() * 1e9), path: [] };
  R.choices = crawlChoices(R); return R;
}
function crawlChoices(R) {
  if (R.floor > CRAWL_FLOORS) return [{ k: 'boss' }];
  const w = [['combat', 40], ['elite', R.floor > 1 || R.step > 0 ? 14 : 0], ['tresor', 14], ['repos', R.floor > 1 || R.step > 0 ? 14 : 0], ['event', 18]];
  const draw = () => wpick(w.filter(x => x[1] > 0).map(x => x[0]), k => w.find(x => x[0] === k)[1]);
  const a = draw(); let b = draw(), tries = 0; while (b === a && tries++ < 5) b = draw();
  return [{ k: a }, { k: b }];
}
const crawlDepthK = R => 1 + .5 * (R.floor - 1);
function crawlAdvance(R) { R.step++; if (R.step >= CRAWL_STEPS) { R.step = 0; R.floor++; } R.choices = crawlChoices(R); }
// les ennemis d'une salle
function crawlFoes(R, kind) {
  const D = CRAWL_DG[R.dg], f = Math.min(R.floor, CRAWL_FLOORS), list = [];
  if (kind === 'boss') list.push(D.boss, pick(D.regs));
  else if (kind === 'elite') { list.push(D.elite); for (let i = 0; i < (f >= 2 ? 1 : 0) + (f >= 3 ? 1 : 0); i++) list.push(pick(D.regs)); }
  else { const n = f === 1 ? 2 : f === 2 ? 2 + (Math.random() < .5 ? 1 : 0) : 3; for (let i = 0; i < n; i++) list.push(pick(D.regs)); }
  return list.map((k, i) => crawlFoe(k, f, i, R.lvl));
}
function crawlFoe(k, f, i, lvl = 1) {
  const E = CRAWL_EN[k], T = CRAWL_TUNE, L = lvl - 1, F = E.boss ? 0 : f - 1;
  const hp = Math.round(E.hp * (1 + T.hpL * L) * (1 + T.hpF * F) * (E.boss ? T.boss : 1));
  return { k, uid: k + '#' + i + '#' + Math.floor(Math.random() * 1e6), name: E.name, sp: E.sp, emo: E.emo, hp, max: hp, block: 0, st: {}, ai: Math.floor(Math.random() * E.acts.length), plus: Math.round(T.dmgL * L + T.dmgF * F), buff: 0, elite: !!E.elite, boss: !!E.boss, rise: E.rise || 0 };
}

/* ---------- le combat au tour par tour ---------- */
function crawlBattle(R, foes) {
  const B = { R, party: R.party, foesL: foes, turn: 0, trap: 0, firstHit: hasRelic('grimoireys'), capeUsed: false, ev: [], over: null };
  const say = (t, cls) => B.ev.push({ t, cls });
  B.log = say;
  B.foes = () => B.foesL.filter(f => f.hp > 0);
  B.mates = () => B.party.filter(c => !c.ko);
  B.up = me => me.lv >= 3 ? 1 : 0;   // un niveau 3 maîtrise mieux sa capacité
  B.hit = (me, t, v, aoe) => {
    let d = Math.max(0, v + (me.st.song || 0) - (me.st.weak || 0)); if (B.firstHit && !aoe) { d += 3; B.firstHit = false; }
    const ab = Math.min(t.block || 0, d); t.block -= ab; d -= ab; t.hp -= d;
    say(`${me.name} → ${t.name} : ${d ? '−' + d : 'paré'}${ab ? ` (${ab} encaissés)` : ''}`, 'good');
    if (t.hp <= 0) { if (t.rise && !t.rose) { t.rose = true; t.hp = t.rise; say(`${t.name} se relève !`, 'bad'); } else { t.hp = 0; say(`${t.name} tombe.`, 'good'); } }
    return d;
  };
  B.heal = (t, v) => { if (!t || t.ko) return; const x = Math.min(v, t.max - t.hp); t.hp += x; if (x) say(`${t.name} récupère ${x} PV.`, 'good'); };
  B.block = (t, v) => { t.block = (t.block || 0) + v; say(`${t.name} se protège (${v}).`, ''); };
  B.stun = (t, n) => { t.st.stun = Math.max(t.st.stun || 0, n); say(`${t.name} est immobilisé·e.`, 'good'); };
  B.calm = (t, v) => { t.stress = Math.max(0, t.stress - v); };
  B.revive = (t, k) => { if (!t || !t.ko) return; t.ko = false; t.hp = Math.max(1, Math.round(t.max * k)); say(`${t.name} se relève !`, 'good'); };
  B.fear = (t, v) => {
    if (t.ko) return; const g = hasRelic('champi') ? Math.ceil(v / 2) : v; const was = t.stress; t.stress = Math.min(STRESS_MAX, t.stress + g);
    if (was < STRESS_MAX && t.stress >= STRESS_MAX) say(`${t.name} panique ! (elle peut perdre ses tours)`, 'bad');
  };
  B.hurt = (f, t, v) => {
    if (t.ko) return 0; if (t.st.evade) { t.st.evade = 0; say(`${t.name} esquive !`, 'good'); return 0; }
    if (hasRelic('cape') && !B.capeUsed) { B.capeUsed = true; say(`La Cape d’Ombrelune détourne le coup de ${f.name}.`, 'good'); return 0; }
    let d = Math.max(0, v - (f.st.weak || 0)); const ab = Math.min(t.block || 0, d); t.block -= ab; d -= ab; t.hp -= d;
    say(`${f.name} → ${t.name} : ${d ? '−' + d : 'paré'}${ab ? ` (${ab} encaissés)` : ''}`, d ? 'bad' : '');
    if (t.hp <= 0) {
      if (t.loyal && !t.saved) { t.saved = true; t.hp = 1; say(`${t.name}, fidèle jusqu’au bout, tient debout avec 1 PV !`, 'good'); }
      else { t.hp = 0; t.ko = true; say(`${t.name} est K.O.`, 'bad'); B.mates().forEach(c => B.fear(c, 2)); }
    }
    return d;
  };
  // la prochaine action de chaque ennemi, et sa cible
  B.intent = f => {
    const E = CRAWL_EN[f.k], a = E.acts[f.ai % E.acts.length], k = a[0], m = B.mates();
    const tgt = ['atk', 'multi', 'drain', 'fear', 'stun', 'poison', 'steal'].includes(k) ? (B.mates().find(c => c.st.taunt) || pick(m)) : null;
    f.int = { k, v: typeof a[1] === 'number' ? a[1] + (['atk', 'multi', 'aoe', 'drain'].includes(k) ? f.plus + f.buff : 0) : a[1], n: a[2] || 1, t: tgt ? tgt.id : null };
  };
  B.foes().forEach(B.intent);
  B.startTurn = () => {
    B.turn++; B.party.forEach(c => { c.block = 0; if (c.st.poison && !c.ko) { c.hp -= 1; c.st.poison--; say(`${c.name} souffre du poison (−1).`, 'bad'); if (c.hp <= 0) { c.hp = 0; c.ko = true; say(`${c.name} est K.O.`, 'bad'); } } if (c.st.taunt) c.st.taunt = 0; });
    B.check();
  };
  // une créature agit
  B.act = (me, skill, target) => {
    if (B.over || me.ko) return;
    if (me.st.stun) { me.st.stun--; say(`${me.name} est immobilisé·e et ne fait rien.`, 'bad'); me.acted = true; return; }
    if (me.stress >= STRESS_MAX && Math.random() < .5) { say(`${me.name} tremble de peur et ne fait rien.`, 'bad'); me.acted = true; return; }
    const S0 = me.skills.find(s => s.key === skill) || me.skills[0];
    if ((me.cd[S0.key] || 0) > 0 || (S0.uses && (R.uses || {})[me.id + S0.key] >= S0.uses)) return;
    let t = target;
    if (S0.tgt === 'enemy' && (!t || t.hp <= 0)) t = B.foes()[0];
    if (S0.tgt === 'ally' && (!t || t.ko)) t = me;
    if (S0.tgt === 'self') t = me;
    if (S0.tgt === 'ko' && (!t || !t.ko)) t = B.party.find(c => c.ko);
    if (S0.tgt === 'ko' && !t) return;
    S0.run(B, me, t);
    if (S0.cd) me.cd[S0.key] = S0.cd + 1;
    if (S0.uses) { R.uses = R.uses || {}; R.uses[me.id + S0.key] = (R.uses[me.id + S0.key] || 0) + 1; }
    me.acted = true; B.check();
  };
  // le tour des ennemis
  B.enemyTurn = () => {
    if (B.over) return;
    for (const f of B.foes()) {
      f.block = 0;
      if (f.st.poison) { f.hp -= f.st.poison; say(`${f.name} souffre du poison (−${f.st.poison}).`, 'good'); f.st.poison = Math.max(0, f.st.poison - 1); if (f.hp <= 0) { f.hp = 0; continue; } }
      if (f.st.stun) { f.st.stun--; say(`${f.name} ne peut pas agir.`, 'good'); f.ai++; B.intent(f); continue; }
      const it = f.int, taunter = B.mates().find(c => c.st.taunt), single = ['atk', 'multi', 'drain', 'steal'].includes(it.k);
      const tg = (single && taunter) || B.party.find(c => c.id === it.t && !c.ko) || pick(B.mates());
      if (!tg && ['atk', 'multi', 'drain', 'fear', 'stun', 'poison', 'steal'].includes(it.k)) break;
      if (B.trap && ['atk', 'multi', 'drain'].includes(it.k)) { const d = B.trap; B.trap = 0; f.hp -= d; say(`Clac ! Le piège mord ${f.name} (−${d}).`, 'good'); if (f.hp <= 0) { f.hp = 0; continue; } }
      if (it.k === 'atk') B.hurt(f, tg, it.v);
      else if (it.k === 'multi') for (let i = 0; i < it.n; i++) B.hurt(f, tg, it.v);
      else if (it.k === 'aoe') B.mates().forEach(c => B.hurt(f, c, it.v));
      else if (it.k === 'drain') { const d = B.hurt(f, tg, it.v); f.hp = Math.min(f.max, f.hp + d); }
      else if (it.k === 'block') { f.block += it.v; say(`${f.name} se protège (${it.v}).`, ''); }
      else if (it.k === 'heal') { const w = B.foes().sort((a, b) => a.hp / a.max - b.hp / b.max)[0]; if (w) { const x = Math.min(it.v, w.max - w.hp); w.hp += x; say(`${f.name} soigne ${w.name} (+${x}).`, 'bad'); } }
      else if (it.k === 'buff') { B.foes().forEach(o => { o.buff += it.v; }); say(`${f.name} galvanise les siens (+${it.v} en attaque).`, 'bad'); }
      else if (it.k === 'fear') { B.fear(tg, it.v); say(`${f.name} terrifie ${tg.name} (+${it.v} de peur).`, 'bad'); }
      else if (it.k === 'fearall') { B.mates().forEach(c => B.fear(c, it.v)); say(`${f.name} glace le sang de toute l’équipe (+${it.v} de peur).`, 'bad'); }
      else if (it.k === 'stun') { tg.st.stun = 1; say(`${f.name} immobilise ${tg.name}.`, 'bad'); }
      else if (it.k === 'poison') { tg.st.poison = (tg.st.poison || 0) + it.v; say(`${f.name} empoisonne ${tg.name}.`, 'bad'); }
      else if (it.k === 'poisonall') { B.mates().forEach(c => { c.st.poison = (c.st.poison || 0) + it.v; }); say(`${f.name} crache un nuage toxique sur toute l’équipe.`, 'bad'); }
      else if (it.k === 'steal') { const g = Math.min(R.loot.g, it.v); R.loot.g -= g; B.hurt(f, tg, 2); if (g) say(`${f.name} chipe ${g} 💰 du butin !`, 'bad'); }
      else if (it.k === 'summon') { if (B.foes().length < 4 && CRAWL_EN[it.v]) { const n = crawlFoe(it.v, Math.min(R.floor, CRAWL_FLOORS), B.foesL.length, R.lvl); B.foesL.push(n); B.intent(n); say(`${f.name} appelle ${n.name} !`, 'bad'); } else { f.block += 6; say(`${f.name} se protège (6).`, ''); } }
      if (f.st.weakT) { f.st.weakT--; if (!f.st.weakT) f.st.weak = 0; }
      f.ai++; B.intent(f);
      if (B.check()) return;
    }
    B.party.forEach(c => { Object.keys(c.cd).forEach(k => { if (c.cd[k] > 0) c.cd[k]--; }); c.acted = false; });
    B.check();
  };
  // la fuite : on quitte le donjon sur-le-champ, en lâchant la moitié du butin
  B.flee = () => { if (B.over) return; B.over = 'fled'; B.party.forEach(c => { if (!c.ko) c.stress = Math.min(STRESS_MAX, c.stress + 2); }); say('L’équipe prend la fuite en lâchant une partie du butin !', 'bad'); };
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
  { k: 'autel', t: 'Un autel poussiéreux, couvert de bougies noires.', a: [['Prier', R => { if (Math.random() < .55) { R.party.forEach(c => { if (!c.ko) c.hp = Math.min(c.max, c.hp + 6); }); return 'Une douce chaleur : +6 PV pour toute l’équipe.'; } R.party.forEach(c => { if (!c.ko) c.stress = Math.min(STRESS_MAX, c.stress + 3); }); return 'Une voix d’outre-tombe ricane : +3 de peur pour toute l’équipe.'; }], ['Passer son chemin', () => 'On ne touche pas aux autels des autres.']] },
  { k: 'coffre', t: 'Un coffre fermé, un peu trop bien en évidence.', a: [['L’ouvrir', R => { if (Math.random() < .6) { const g = Math.round(10 * crawlDepthK(R)); R.loot.g += g; return `Il est plein : +${g} 💰.`; } const c = pick(R.party.filter(x => !x.ko)); if (c) c.hp = Math.max(1, c.hp - 6); return `C’était un piège : ${c ? c.name + ' perd 6 PV' : 'personne n’est touché'}.`; }], ['Le laisser', () => 'Trop beau pour être vrai.']] },
  { k: 'fontaine', t: 'Une fontaine qui glougloute dans le noir.', a: [['Boire', R => { const c = pick(R.party.filter(x => !x.ko)); if (!c) return 'Personne n’a soif.'; if (Math.random() < .65) { c.hp = c.max; return `${c.name} boit et se sent comme neuf (PV au maximum).`; } c.st.poison = (c.st.poison || 0) + 3; return `${c.name} boit… et devient tout vert (empoisonné).`; }], ['Remplir les gourdes', R => { R.party.forEach(c => { c.stress = Math.max(0, c.stress - 2); }); return 'L’eau fraîche apaise tout le monde (−2 de peur).'; }]] },
  { k: 'marchand', t: 'Un marchand ambulant, perdu depuis des semaines.', a: [['Acheter une potion (8 💰 du butin)', R => { if (R.loot.g < 8) return 'Pas assez dans le butin.'; R.loot.g -= 8; R.party.forEach(c => { if (!c.ko) c.hp = Math.min(c.max, c.hp + 8); }); return 'Une potion pour tous : +8 PV.'; }], ['Lui indiquer la sortie', R => { R.loot.g += 4; return 'Reconnaissant, il te laisse 4 💰.'; }]] },
  { k: 'cage', t: 'Une cage, et dedans, un prisonnier du donjon qui supplie.', a: [['Le libérer', R => { R.freed = (R.freed || 0) + 1; R.party.forEach(c => { c.stress = Math.max(0, c.stress - 1); }); return 'Il file en jurant de chanter tes louanges au village (bonne volonté).'; }], ['Ignorer', R => { R.party.forEach(c => { c.stress = Math.min(STRESS_MAX, c.stress + 1); }); return 'Ses cris vous suivent longtemps (+1 de peur).'; }]] },
];
function crawlTreasure(R) { const k = crawlDepthK(R), g = Math.round((7 + Math.random() * 6) * k), s = Math.random() < .5 ? Math.round(3 * k) : 0; R.loot.g += g; R.loot.s += s; let item = null; if (Math.random() < .2) { item = pick(FURN_ORDER.filter(t => !FURN[t].size && FURN[t].cost && (FURN[t].cost.g || 0) <= 4)); if (item) R.loot.items.push(item); } return `Un trésor : +${g} 💰${s ? `, +${s} 🪵` : ''}${item ? `, et un sticker ${FURN[item].name}` : ''}.`; }
function crawlRest(R, how) { if (how === 'calm') { R.party.forEach(c => { c.stress = Math.max(0, c.stress - 4); }); return 'Un feu de camp, des histoires idiotes : −4 de peur pour tous.'; } R.party.forEach(c => { if (!c.ko) c.hp = Math.min(c.max, c.hp + Math.round(c.max * .35)); }); return 'Un feu de camp et un bon somme : +35 % des PV pour tous.'; }
// le butin d'un combat gagné
function crawlWinLoot(R, kind) {
  const k = crawlDepthK(R), g = Math.round((kind === 'boss' ? 30 : kind === 'elite' ? 12 : 5) * k * (.8 + Math.random() * .4)), s = kind === 'combat' ? 0 : Math.round((kind === 'boss' ? 6 : 3) * k);
  R.loot.g += g; R.loot.s += s;
  if (hasRelic('chope')) R.party.forEach(c => { if (!c.ko) c.hp = Math.min(c.max, c.hp + 3); });
  if (kind === 'boss') { const rl = CRAWL_DG[R.dg].relic; if (!hasRelic(rl)) R.relic = rl; }
  return `Butin : +${g} 💰${s ? `, +${s} 🪵` : ''}.`;
}

/* ---------- le joueur automatique (simulateur, et « combat auto ») ---------- */
function crawlPick(B, me) {
  const ok = s => !(me.cd[s.key] > 0) && !(s.uses && (B.R.uses || {})[me.id + s.key] >= s.uses);
  const sk = k => me.skills.find(s => s.key === k && ok(s)), any = f => me.skills.find(s => ok(s) && f(s));
  const foes = B.foes(), mates = B.mates(), hurt = mates.filter(c => c.hp < c.max * .45).sort((a, b) => a.hp - b.hp)[0];
  const danger = foes.map(f => ({ f, d: f.int ? (f.int.k === 'multi' ? f.int.v * f.int.n : f.int.k === 'aoe' ? f.int.v * mates.length : ['atk', 'drain'].includes(f.int.k) ? f.int.v : 0) : 0 })).sort((a, b) => b.d - a.d)[0];
  const ko = B.party.find(c => c.ko); const rv = any(s => s.tgt === 'ko'); if (ko && rv) return [rv.key, ko];
  if (hurt) { const h = any(s => s.tgt === 'ally' && /soin|Soigne|Potion|PV/.test(s.desc + s.name) && s.key !== 'garde'); if (h) return [h.key, hurt]; }
  const stress = mates.find(c => c.stress >= 7); if (stress) { const h = any(s => s.key === 'gnole'); if (h) return [h.key, stress]; }
  if (danger && danger.d >= 7) { const st = any(s => s.tgt === 'enemy' && /action/.test(s.desc)); if (st) return [st.key, danger.f]; }
  if (foes.length >= 3) { const a = any(s => s.tgt === 'none' && /tous les ennemis/.test(s.desc)); if (a) return [a.key, null]; }
  const team = any(s => s.tgt === 'none' && /équipe/.test(s.desc)); if (team && danger && danger.d >= 6) return [team.key, null];
  if (danger && danger.d >= 8 && me.guard >= 3) { const g = sk('garde'); if (g && me.hp < me.max * .6) return ['garde', me]; }
  const target = foes.slice().sort((a, b) => a.hp - b.hp)[0];
  const big = any(s => s.tgt === 'enemy' && !/action/.test(s.desc) && s.key !== 'frapper'); if (big) return [big.key, target];
  return ['frapper', target];
}
// une expédition jouée sans affichage, avec une prudence donnée (seuil de PV moyen pour continuer)
function crawlAuto(dg, team, opts = {}) {
  const R = crawlNew(dg, team), prudence = opts.prudence == null ? .55 : opts.prudence, cautious = prudence >= .5;
  for (;;) {
    const node = R.choices.find(c => c.k === 'repos' && R.party.some(p => p.hp < p.max * .6)) || R.choices.find(c => c.k === 'tresor') || R.choices.find(c => c.k !== 'elite') || R.choices[0];
    R.path.push(node.k);
    if (['combat', 'elite', 'boss'].includes(node.k)) {
      const B = crawlBattle(R, crawlFoes(R, node.k));
      const foeHp0 = B.foesL.reduce((a, f) => a + f.max, 0);
      for (let guard = 0; guard < 60 && !B.over; guard++) {
        B.startTurn(); if (B.over) break;
        const ma = B.mates(), avg = ma.reduce((a, c) => a + c.hp / c.max, 0) / R.party.length, foeHp = B.foes().reduce((a, f) => a + f.hp, 0);
        if (avg < (cautious ? .35 : .15) && foeHp > foeHp0 * .4) { B.flee(); break; }
        for (const me of B.mates()) { if (B.over) break; const [k, t] = crawlPick(B, me); B.act(me, k, t); } B.enemyTurn();
      }
      if (B.over === 'fled') { R.done = 'fled'; R.loot.g = Math.floor(R.loot.g / 2); R.loot.s = Math.floor(R.loot.s / 2); break; }
      if (B.over !== 'won') { R.done = 'wipe'; break; }
      crawlWinLoot(R, node.k);
      if (node.k === 'boss') { R.done = 'boss'; break; }
    } else if (node.k === 'tresor') crawlTreasure(R);
    else if (node.k === 'repos') crawlRest(R, R.party.some(c => c.stress >= 6) && R.party.every(c => c.hp > c.max * .7) ? 'calm' : 'heal');
    else { const E = pick(CRAWL_EVENTS); E.a[Math.random() < .6 ? 0 : 1][1](R); }
    crawlAdvance(R);
    const alive = R.party.filter(c => !c.ko), avg = alive.reduce((a, c) => a + c.hp / c.max, 0) / Math.max(1, R.party.length);
    const bossNext = R.floor > CRAWL_FLOORS;
    if (alive.length < R.party.length * .5 || avg < prudence || (bossNext && (avg < (cautious ? .8 : .5) || alive.length < R.party.length))) { R.done = 'retreat'; break; }
  }
  return R;
}
// au retour : fatigue (la peur se paie), bosses, expérience, butin
function crawlApply(R, team, lines) {
  const kept = R.done === 'wipe' ? 0 : 1, g = Math.round(R.loot.g * kept), s = Math.round(R.loot.s * kept);
  S.gold += g; S.mat += s; if (kept) R.loot.items.forEach(k => { S.free[k] = (S.free[k] || 0) + 1; });
  const deep = (R.floor - 1) * CRAWL_STEPS + R.step;
  team.forEach(c => {
    const p = R.party.find(x => x.id === c.id); if (!p) return;
    if (p.ko || R.done === 'wipe') c.hurt = Math.max(c.hurt || 0, S.night + 2);
    if (typeof addFat === 'function') { const f = Math.floor(p.stress / 3) + (R.done === 'wipe' ? 2 : 0); if (f) addFat(c, f, lines); }
    gainXP(c, 1 + Math.floor(deep / 3) + (R.done === 'boss' ? 2 : 0), lines);
  });
  if (R.relic && R.done === 'boss') { (S.relics = S.relics || []).push(R.relic); lines.push([RELICS[R.relic].ico, `Relique : ${RELICS[R.relic].name}. ${RELICS[R.relic].desc}`, 'good']); }
  if (kept && R.freed && typeof settlements === 'function') { const s0 = settlements().filter(siteKnown)[0]; if (s0) addGw(s0, 4 * R.freed); }
  S.stats.crawls = (S.stats.crawls || 0) + 1; if (R.done === 'boss') S.stats.crawlBoss = (S.stats.crawlBoss || 0) + 1;
  if (R.done === 'fled') lines.push(['🏃', 'Dans la fuite, la moitié du butin est restée au donjon.', 'bad']);
  lines.unshift([R.done === 'boss' ? '👑' : R.done === 'wipe' ? '💀' : '🏃', R.done === 'boss' ? `Le boss est vaincu ! Butin : ${costText({ g, s })}${R.loot.items.length ? ` et ${R.loot.items.length} sticker${R.loot.items.length > 1 ? 's' : ''}` : ''}.` : R.done === 'wipe' ? 'L’équipe est terrassée : tout le butin est perdu, et tout le monde rentre sonné.' : `L’équipe remonte de l’étage ${Math.min(R.floor, CRAWL_FLOORS)} avec ${costText({ g, s })}${R.loot.items.length ? ` et ${R.loot.items.length} sticker${R.loot.items.length > 1 ? 's' : ''}` : ''}.`, R.done === 'wipe' ? 'bad' : 'good']);
  return { deep, g, s };
}
