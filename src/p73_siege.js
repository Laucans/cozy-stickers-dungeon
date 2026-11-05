
/* =========================================================
   Le Siège de Mirebrume, aux cartes : la finale de la Terreur
   Trois quartiers, un par assaut (les règles et les textes :
   SIEGE_Q, p25). Leurs gardes, et les héros des croisades
   (p69), qui viennent tous de là ; une élite et un chef par
   quartier, avec action légendaire et fureur à mi-vie ; le
   décor de la cité, ses secrets, et les Clés de Mirebrume, la
   relique du dernier assaut. Le donjon « cite » prend le
   visage du quartier juste avant chaque assaut.
   ========================================================= */
// les gens de Mirebrume (names : le nom qu'ils donnent à leurs actions)
const MB_EN = {
  m_garde:   { name: 'Garde des remparts', emo: '💂', hp: 15, acts: [['atk', 5], ['block', 6], ['atk', 4]], names: { atk: 'Coup de pique' } },
  m_arbal:   { name: 'Arbalétrière des créneaux', emo: '🏹', hp: 10, acts: [['atk', 5], ['multi', 2, 2], ['block', 3]], names: { multi: 'Carreaux en rafale' } },
  m_crieur:  { name: 'Crieur de la Guilde', emo: '📯', hp: 10, acts: [['fearall', 1], ['atk', 4], ['block', 4]], names: { fearall: '« Oyez, oyez ! »', atk: 'Coup de cloche' } },
  m_palais:  { name: 'Garde du palais', emo: '💂', hp: 17, acts: [['block', 7], ['atk', 6], ['multi', 3, 2]], names: { multi: 'Moulinet de cérémonie' } },
  m_scribe:  { name: 'Percepteur des impôts', emo: '📜', hp: 11, acts: [['steal', 5], ['fear', 2], ['atk', 4]], names: { steal: 'Impôt sur les monstres', fear: 'Formulaire en trois exemplaires' } },
  // les élites : une par quartier
  m_bastion: { name: 'Sergent Bastion', emo: '🛡️', hp: 34, elite: 1, pow: 'muraille', acts: [['atk', 8], ['block', 8], ['smash', 10], ['multi', 4, 2]], names: { smash: 'Coup de bouclier' } },
  m_heros:   { name: 'Le Héros du Mois', emo: '🏅', hp: 32, elite: 1, pow: 'rage', acts: [['execute', 8], ['block', 6], ['atk', 8], ['multi', 3, 2]], names: { execute: 'Coup de grâce pour la gazette' } },
  m_lustrin: { name: 'Sire Lustrin, le Champion', emo: '🏆', hp: 36, elite: 1, pow: 'riposte', acts: [['atk', 10], ['block', 8], ['execute', 11], ['multi', 4, 3]], names: { execute: 'Botte secrète' } },
  // les chefs des quartiers
  m_capitaine: { name: 'La Capitaine Mâchicoulis', emo: '🪖', hp: 72, boss: 1, acts: [['block', 8], ['multi', 4, 2], ['summon', 'm_garde'], ['smash', 10]], leg: [['throw', 3, 2], ['stun']], rage: [['multi', 5, 2], ['smash', 12], ['tailall', 5], ['block', 10]], p2: 'herse',
    names: { smash: 'Coup de hallebarde', summon: 'Sonner le cor', throw: 'Volée de carreaux', stun: 'Filet lesté', tailall: 'Charge de la garde' } },
  m_guilde:  { name: 'Dame Guillemette', emo: '📋', hp: 52, boss: 1, acts: [['summon', 'h_voleuse'], ['multi', 3, 2], ['buff', 1], ['atk', 11]], leg: [['charm'], ['throw', 3, 2]], rage: [['multi', 4, 2], ['summon', 'h_barbare'], ['charm'], ['atk', 14]], p2: 'prime',
    names: { summon: 'Recruter un héros', buff: 'Prime de risque', charm: 'Contrat d’embauche', throw: 'Avalanche de parchemins' } },
  m_bourg:   { name: 'Le Bourgmestre Grandécharpe', emo: '🎖️', hp: 54, boss: 1, acts: [['fearall', 1], ['atk', 12], ['steal', 6], ['block', 8]], leg: [['decree'], ['throw', 3, 2]], rage: [['atk', 15], ['aoe', 5], ['steal', 8], ['drain', 9]], p2: 'tocsin',
    names: { fearall: 'Discours interminable', steal: 'Taxe exceptionnelle', decree: 'Arrêté municipal', throw: 'Médailles commémoratives', aoe: 'Feu d’artifice municipal', drain: 'Banquet aux frais de la cité' } },
};
const MB_ELEM = {
  m_garde: { el: 'tranchant', res: ['perforant', 'tranchant'], vuln: ['contondant', 'foudre'] }, m_arbal: { el: 'perforant', vuln: ['froid'] },   // des doigts gelés sur les créneaux
  m_crieur: { el: 'tonnerre', res: ['tonnerre'], vuln: ['psychique'] }, m_palais: { el: 'tranchant', res: ['perforant', 'tranchant'], vuln: ['contondant', 'foudre'] }, m_scribe: { el: 'psychique', vuln: ['feu'] },   // la paperasse, ça brûle
  m_bastion: { el: 'contondant', res: ['perforant'], vuln: ['acide', 'foudre'] }, m_heros: { el: 'tranchant', res: ['radiant'], vuln: ['psychique'] }, m_lustrin: { el: 'tranchant', res: ['tranchant', 'radiant'], vuln: ['necrotique'] },
  m_capitaine: { el: 'tranchant', res: ['perforant'], vuln: ['psychique'] }, m_guilde: { el: 'force', res: ['psychique'], vuln: ['necrotique'] }, m_bourg: { el: 'contondant', res: ['tonnerre'], vuln: ['psychique', 'acide'] },
};
// la capacité du Sergent Bastion (p35, B.hit)
const MB_POW = { muraille: { ico: '🧱', name: 'Muraille', v: 50, desc: 'Tant qu’un autre ennemi tient debout, il ne prend que {v} % des coups.' } };
// les secrets du décor de la cité
const MB_ENV = {
  poix:    { name: 'Renverser la poix bouillante', ico: '🫕', cost: 1, tgt: 'allfoes', dmg: 6, el: 'feu', prop: ['furn', 'chaudron'] },
  boulet:  { name: 'Tirer la catapulte des remparts', ico: '🪨', cost: 1, tgt: 'enemy', dmg: 12, el: 'contondant', prop: ['furn', 'catapulte'] },
  drapeau: { name: 'Faire tomber la bannière sur leurs têtes', ico: '🚩', cost: 0, tgt: 'enemy', stun: 1, prop: ['furn', 'banniere'] },
  affiche: { name: 'Coller un avis de recherche dans son dos', ico: '📜', cost: 0, tgt: 'enemy', confuse: 1, prop: ['furn', 'tableau'] },
  bassin:  { name: 'Pousser un garde dans la fontaine', ico: '⛲', cost: 0, tgt: 'enemy', dmg: 4, el: 'froid', stun: 1, prop: ['furn', 'fontaine'] },
};
Object.assign(CRAWL_EN, MB_EN); Object.assign(FOE_ELEM, MB_ELEM); Object.assign(ELITE_POW, MB_POW); Object.assign(ENV_CARDS, MB_ENV);
Object.assign(BOSS_P2, {
  herse:  'La herse s’abat derrière l’équipe : la Capitaine se retranche (+15 de parade), et l’équipe, coincée, a 1 énergie de moins au prochain tour.',
  prime:  'Dame Guillemette affiche ta tête au tableau des primes : tous les héros frappent plus fort (+2), et l’équipe a peur (+1).',
  tocsin: 'Le Bourgmestre fait sonner le tocsin : Sire Lustrin, le champion de la cité, accourt à son secours, tout essoufflé (à moitié de ses PV, et il lui faut un tour pour reprendre son souffle).',
});
Object.assign(RELICS, { cles: { ico: '🗝️', name: 'Clés de Mirebrume', desc: 'Au premier tour de chaque combat, les ennemis hésitent : leur premier coup fait 2 de moins.' } });
Object.assign(RELIC_IK, { cles: 'key' }); Object.assign(POW_IK, { muraille: 'bricks' }); Object.assign(DG_IK, { cite: 'castle' });
// le donjon de la cité : il prend le visage du quartier avant chaque assaut (citeSync)
CRAWL_DG.cite = { regs: SIEGE_Q[0].regs.slice(), elite: SIEGE_Q[0].elite, boss: SIEGE_Q[0].boss, relic: null, emo: '🏰', desc: SIEGE_Q[0].desc };
// l'Atelier les règle comme les autres (et les retrouve quand il réapplique ses réglages)
if (typeof BASE !== 'undefined' && BASE.CRAWL_EN) [['CRAWL_EN', MB_EN], ['FOE_ELEM', MB_ELEM], ['ELITE_POW', MB_POW], ['ENV_CARDS', MB_ENV], ['CRAWL_DG', { cite: CRAWL_DG.cite }]].forEach(([t, o]) => { if (BASE[t]) Object.assign(BASE[t], structuredClone(o)); });

/* ---------- leur allure : dessinés avec les pinceaux des héros (bleu brume et or, les couleurs de la cité) ---------- */
Object.assign(FOE_ART, {
  m_garde:     { sc: 1.04, skin: '#efc49b', body: '#3d5a8a', belly: '#e2b44a', legs: '#2a3d5e', hat: 'helmet', hatc: '#9aa2b4', item: 'axe', eyes: 'derp', iris: '#4a6ab0', mouth: 'o', nose: 'big' },
  m_arbal:     { sc: .98, skin: '#e5b38a', body: '#3d5a8a', legs: '#2a3d5e', hat: 'feather', hatc: '#e2b44a', hair: '#6a3a1e', hairStyle: 'long', item: 'bow', eyes: 'normal', iris: '#3a5a8a', mouth: 'smug', nose: 'small' },
  m_crieur:    { sc: .92, skin: '#f0c8a0', body: '#a83a3a', belly: '#e2b44a', hat: 'feather', hatc: '#a83a3a', hair: '#8a5a2a', item: 'scarfstaff', eyes: 'derp', iris: '#6a4a2a', mouth: 'o', nose: 'big' },
  m_palais:    { sc: 1.04, skin: '#edbd8c', body: '#a83a3a', belly: '#e2b44a', legs: '#efe6d2', hat: 'helmet', hatc: '#e2b44a', item: 'axe', eyes: 'derp', iris: '#4a6ab0', mouth: 'o', nose: 'big' },
  m_scribe:    { sc: .9, skin: '#e9e3d6', body: '#3a3a44', legs: '#26262e', collar: true, hair: '#cfcfd8', hairStyle: 'slick', item: 'sack', eyes: 'normal', iris: '#4a4a5a', brow: true, mouth: 'smug', nose: 'long' },
  m_bastion:   { sc: 1.26, skin: '#e2a274', body: '#9aa2b4', belly: '#3d5a8a', legs: '#6c7486', hat: 'bucket', hatc: '#8a92a4', beard: '#5a3a1e', item: 'hammer', eyes: 'derp', iris: '#3a5a8a', mouth: 'grin', nose: 'big' },
  m_heros:     { sc: 1.1, skin: '#f4d4b2', body: '#e2b44a', belly: '#fff0c0', legs: '#b8902a', cape: '#a83a3a', hair: '#ffd86a', hairStyle: 'slick', item: 'sword', eyes: 'normal', iris: '#3a8ab0', brow: true, mouth: 'grin', nose: 'small' },
  m_lustrin:   { sc: 1.18, skin: '#f4d4b2', body: '#cfd6e4', belly: '#e2b44a', legs: '#9aa2b4', cape: '#3d5a8a', hat: 'helmet', hatc: '#eef2fa', item: 'sword', eyes: 'normal', iris: '#3a8ab0', brow: true, mouth: 'grin', nose: 'small' },
  m_capitaine: { sc: 1.12, skin: '#efc49b', body: '#2a3d5e', belly: '#e2b44a', legs: '#1c2a42', cape: '#8a1f2a', hat: 'feather', hatc: '#2a3d5e', hair: '#b8b8c0', hairStyle: 'long', item: 'axe', eyes: 'normal', iris: '#3a5a8a', brow: true, mouth: 'smug', nose: 'long' },
  m_guilde:    { sc: 1.08, skin: '#efc49b', body: '#5a2a6a', belly: '#e2b44a', legs: '#3a1a4a', cape: '#3d5a8a', collar: true, hair: '#c8502a', hairStyle: 'long', item: 'staff', eyes: 'normal', iris: '#6a4a2a', brow: true, mouth: 'smug', nose: 'long' },
  m_bourg:     { sc: 1.16, skin: '#f0c0a0', body: '#3d5a8a', belly: '#e2b44a', legs: '#2a3d5e', cape: '#a83a3a', collar: true, hat: 'feather', hatc: '#1c2a42', hair: '#d8d8e0', beard: '#d8d8e0', item: 'staff', eyes: 'derp', iris: '#4a4a5a', mouth: 'smug', nose: 'huge' },
});

/* ---------- les décors des trois quartiers ---------- */
// une rangée de créneaux, de x0 à x1, posée en y
const mbCrenels = (x0, x1, y, w = 28, gap = 18, h = 22) => { let d = ''; for (let x = x0; x < x1; x += w + gap) d += ` H${x} V${y - h} H${Math.min(x1, x + w)} V${y}`; return d + ` H${x1}`; };
const mbTower = (x, w, top, roof) => `<path d="M${x} 380 V${top}${mbCrenels(x, x + w, top, 14, 10, 14).replace(/^ H\d+/, '')} V380Z"/>${roof ? `<path d="M${x - 8} ${top - 13} L${x + w / 2} ${top - 13 - roof} L${x + w + 8} ${top - 13}Z" fill="#2a2140"/>` : ''}<rect x="${x + w / 2 - 8}" y="${top + 40}" width="16" height="26" rx="8" fill="#f2c86a" opacity=".5"/>`;
const mbHouse = (x, w, top, peak) => `<path d="M${x} 400 V${top} L${x + w / 2} ${top - peak} L${x + w} ${top} V400Z"/>` + [.28, .62].map(k => `<rect x="${Math.round(x + w * k)}" y="${top + 26}" width="14" height="18" rx="2" fill="#f2c86a" opacity="${(.3 + (x % 7) / 20).toFixed(2)}"/>`).join('');
const SIEGE_ART = {
  remparts: {
    sky: `<g fill="#1b2232">${mbTower(90, 110, 170, 82)}${mbTower(445, 110, 140, 80)}${mbTower(800, 110, 170, 82)}</g><path d="M0 600 V310${mbCrenels(0, 1000, 310)} V600Z" fill="#141a26"/><g fill="#a83a3a"><path d="M145 75 V40 L172 48 L145 56Z"/><path d="M500 47 V12 L527 20 L500 28Z"/><path d="M855 75 V40 L882 48 L855 56Z"/></g>`,
    decor: { props: [['furn', 'banniere', 7, 52, 1, 1], ['furn', 'lanterne', 21, 50, .9, 1], ['furn', 'catapulte', 80, 49, 1.05, 1], ['furn', 'banniere', 93, 52, 1, 1], ['def', 'barricade', 3, 10, 1.05, 2], ['furn', 'ratelier', 97, 9, 1, 2], ['furn', 'torche', 35, 46, .8, 1], ['furn', 'torche', 65, 46, .8, 1]], fx: { fog: 3, embers: 6 }, lights: [[35, 66, '255,170,80'], [65, 66, '255,170,80']], moon: true },
    env: ['poix', 'boulet', 'drapeau', 'torche'],
  },
  guilde: {
    sky: `<g fill="#1a1f2e">${[[0, 120, 250, 60], [110, 110, 205, 54], [215, 150, 235, 70], [360, 120, 190, 58], [640, 130, 200, 62], [765, 120, 240, 60], [880, 120, 210, 56]].map(h => mbHouse(...h)).join('')}</g><g fill="#232a3c"><path d="M470 400 V170 L560 110 L650 170 V400Z"/><rect x="505" y="196" width="110" height="34" rx="4" fill="#3a2a1a"/><text x="560" y="219" text-anchor="middle" font-size="17" font-family="Georgia,serif" fill="#e2b44a" opacity=".85">GUILDE</text><rect x="540" y="250" width="40" height="60" rx="20" fill="#f2c86a" opacity=".55"/></g>`,
    decor: { props: [['furn', 'tablee', 9, 50, 1.05, 1], ['furn', 'biere', 22, 52, .95, 1], ['furn', 'tableau', 70, 62, .85, 1], ['furn', 'scene', 85, 49, 1, 1], ['furn', 'tonneau', 3, 10, 1.05, 2], ['furn', 'comptoir', 97, 9, 1.05, 2], ['furn', 'lanterne', 35, 46, .8, 1], ['furn', 'lanterne', 65, 46, .8, 1]], fx: { dust: 8, embers: 4 }, lights: [[35, 66, '255,200,120'], [65, 66, '255,200,120']] },
    env: ['tonneau', 'tablee', 'comptoir', 'affiche'],
  },
  palais: {
    sky: `<g fill="#1d1a2c"><rect x="0" y="96" width="1000" height="30"/><path d="M360 96 L500 30 L640 96Z"/>${[40, 150, 260, 370, 600, 710, 820, 930].map(x => `<rect x="${x}" y="126" width="34" height="260"/><rect x="${x - 6}" y="120" width="46" height="12" rx="3"/>`).join('')}</g><g fill="none" stroke="#2c2646" stroke-width="5">${[75, 185, 295, 635, 745, 855].map(x => `<path d="M${x + 6} 380 V200 Q${x + 40} 150 ${x + 74} 200 V380"/>`).join('')}</g><path d="M430 380 V230 Q500 150 570 230 V380Z" fill="#2a1f34"/><path d="M455 380 V245 Q500 190 545 245 V380Z" fill="#a83a3a" opacity=".55"/>`,
    decor: { props: [['furn', 'banniere', 6, 52, 1, 1], ['furn', 'armure', 19, 51, 1, 1], ['furn', 'trone', 82, 49, 1.1, 1], ['furn', 'banniere', 94, 52, 1, 1], ['furn', 'fontaine', 3, 9, 1, 2], ['furn', 'candelabre', 97, 9, 1.05, 2], ['furn', 'lustre', 35, 64, .8, 1], ['furn', 'lustre', 65, 64, .8, 1]], fx: { sparkles: 8, dust: 6 }, lights: [[35, 72, '255,215,140'], [65, 72, '255,215,140']], windows: true },
    env: ['lustre', 'trone', 'bassin', 'portrait'],
  },
};
// l'ambiance de la cité la nuit : une cloche au loin, une patrouille qui passe, un cor sur les remparts
CAMB.cite = { drone: [65.4, 98], noise: ['bandpass', 700, .014], wet: .35, ev: [[.06, () => { cTone(392, 390, 2.6, 'sine', .022); cTone(784, 780, 1.8, 'sine', .01); }], [.1, () => { for (let i = 0; i < 3; i++) cNoise(.05, 900, 500, .025, i * .32, 'bandpass', 3); }], [.03, () => { cTone(196, 196, .5, 'sawtooth', .012); cTone(294, 294, .7, 'sawtooth', .01, .3); }]] };
// le donjon « cite » prend le visage du quartier : ses ennemis, son chef, sa relique, son décor et ses secrets
function citeSync() {
  const q = siegeQ(), A = SIEGE_ART[q.id];
  Object.assign(CRAWL_DG.cite, { regs: q.regs.slice(), elite: q.elite, boss: q.boss, relic: q.relic, desc: q.desc });
  CRAWL_DECOR.cite = A.decor; CRAWL_SKY.cite = A.sky; CRAWL_ENV.cite = A.env.slice();
}
citeSync();
const crawlNewSiege = crawlNew;
crawlNew = function (dg, team, opts) { if (dg === 'cite') citeSync(); return crawlNewSiege(dg, team, opts); };
// au Palais, le troisième étage n'est que l'antichambre : la garde d'élite est déjà auprès du Bourgmestre, il n'y reste que des gardes du deuxième étage
const crawlFoesSiege = crawlFoes;
crawlFoes = function (R, kind) { if (R && R.dg === 'cite' && kind !== 'boss' && R.floor >= CRAWL_FLOORS && siegeQ().id === 'palais') return crawlFoesSiege(Object.assign({}, R, { floor: CRAWL_FLOORS - 1 }), kind); return crawlFoesSiege(R, kind); };
const openCrawlPageSiege = openCrawlPage;
openCrawlPage = function (dg) { if (dg === 'cite') citeSync(); return openCrawlPageSiege(dg); };

/* ---------- préparer un assaut ---------- */
const raidPlanSiege = CMD.raidPlan;
CMD.raidPlan = function (a) {
  const tg = a && RAIDS[a.target];
  if (tg && tg.siege) { if (vicState().siege >= 3) return 'Mirebrume t’a déjà remis ses clés'; if (!raidKnown(a.target)) return 'Il faut d’abord soumettre les quatre donjons rivaux, et trouver la cité sur la carte'; if (siegeShut()) return `Après ta fuite, Mirebrume a fermé ses portes : prochain assaut à la nuit ${siegeShut()}`; }
  return raidPlanSiege.call(this, a);
};
// une partie reprise avec un assaut prévu du temps des dés : il se joue désormais aux cartes
const runRaidSiege = runRaid;
runRaid = async function (report) { if (S.raid && RAIDS[S.raid.target] && RAIDS[S.raid.target].siege) S.raid.crawl = true; return runRaidSiege(report); };
