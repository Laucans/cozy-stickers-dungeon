/* =========================================================
   Les quêtes
   Un journal à part (le parchemin, dans la colonne de gauche).
   Les quêtes sont tirées au sort à chaque partie : la grande
   quête choisit son boss unique parmi cinq (et son repaire, sa
   bande de fidèles, sa liste de provisions…), et les quêtes
   secondaires s'assemblent à partir de modèles (commandes,
   chasses, défis, banquets, recherches, convois, envies d'une
   créature du château, petits dilemmes) avec des donneurs, des
   lieux, des objets, des bêtes et des bandes pris au hasard.
   Une quête tirée est enregistrée telle quelle dans la partie.
   ========================================================= */
const QUEST_MAX = 3, QUEST_UNIT = 3;   // 3 quêtes en même temps au plus ; une pièce fabriquée coûte 3 points de travail
const fillQ = (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v[k] != null ? v[k] : m));
const cap1 = s => (s ? s[0].toUpperCase() + s.slice(1) : s);
const rint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const shuffleQ = l => { const a = l.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const plQ = name => /^les /i.test(name), vbQ = (name, pl, sg) => (plQ(name) ? pl : sg);   // « les Chevaliers arrivent », « la Confrérie arrive »
const listFr = l => (l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' et ' + l[l.length - 1]);

/* ---------- les boss uniques : un seul par partie, au bout de la grande quête ---------- */
const QBOSSES = {
  basalte: { name: 'Grondefer, le Ver de Basalte', short: 'Grondefer', title: 'Le Ver de Basalte', lair: 'le Gouffre de Basalte', emo: '🗿', ico: 'skull',
    look: ['char', 'dragonnet', 'grayscale(.45) sepia(.55) hue-rotate(-18deg) brightness(.72) contrast(1.35)'], regs: ['rat', 'gelee', 'kobs', 'bat'], elite: 'golemc', relic: 'pierre',
    hp: 90, acts: [['atk', 13], ['aoe', 5], ['block', 12], ['multi', 6, 3]], leg: [['tailall', 5], ['stun']], rage: [['aoe', 8], ['atk', 18], ['multi', 7, 3], ['tailall', 7]],
    p2t: 'Grondefer se cuirasse de basalte (+18 de parade), une gelée de lave suinte de la roche, et la peur gagne l’équipe (+1).', p2: (f, B, add) => { f.block += 18; add('gelee'); B.mates().forEach(c => B.fear(c, 1)); },
    giver: 'Mémé Ortie, rebouteuse du marais', intro: 'Une vieille dame frappe au porche, un parapluie troué sous le bras. « Le sol tremble sous le Val, mon petit. Il y a mille ans, on a endormi là-dessous Grondefer, le Ver de Basalte. Il se réveille, et il a faim de châteaux. Toi seul·e as des créatures assez vilaines pour lui tenir tête. »',
    lore: ['pages déchiffrées', 'Un vieux grimoire parle de son repaire, mais plus personne ne sait le lire.', 'Les pages parlent d’un gouffre sous les collines… et d’une écaille qui ne craint qu’une chose : la braise.'],
    supplies: [['forge', 'pointes de braise'], ['labo', 'fioles ardentes'], ['cuisine', 'provisions de voyage'], ['atelier', 'grappins à vapeur']],
    band: { name: 'la Confrérie du Gouffre', goal: 'réveiller le Ver pour la gloire, et elle passe par ton château pour voler la carte du gouffre', heroes: ['Frère Pelle', 'Sœur Pioche', 'Gaspard le Fouisseur', 'Dame Lanterne'] },
    key: { name: 'Le Col des Frimas', emo: '🔑', x: 'La seule entrée du gouffre est gardée par des contrebandiers, au Col des Frimas. Il faut leur prendre la clé de la grille (un raid).', done: 'La clé rouillée tourne dans la grille du gouffre. Ça sent le soufre.' },
    lairDesc: 'Des galeries tièdes qui sentent la pierre chaude, des choses qui fuient la lumière, et tout au fond, un ver qui dort mal.', defeat: 'Grondefer s’effondre dans un nuage de cailloux et se rendort pour mille ans, la tête sur un oreiller de basalte.', outro: 'Mémé Ortie t’offre un thé (amer) et un trésor (brillant). Dans tout le Val, on raconte que ton château a fait taire la montagne.' },
  ronces: { name: 'Morgane-des-Ronces, la Reine Épine', short: 'la Reine Épine', title: 'La Reine Épine', lair: 'le Roncier Noir', emo: '🌲', ico: 'leaf',
    look: ['char', 'fee', 'hue-rotate(95deg) saturate(1.4) brightness(.78) contrast(1.15)'], regs: ['lutin', 'loup', 'ronce', 'vexe'], elite: 'chene', relic: 'gland',
    hp: 86, acts: [['aoe', 5], ['poisonall', 2], ['atk', 12], ['roots']], leg: [['roots'], ['poisonall', 1]], rage: [['aoe', 7], ['atk', 16], ['poisonall', 3], ['multi', 5, 3]],
    p2t: 'La Reine Épine fait jaillir les ronces : elle reprend 15 PV, un lutin sort des buissons, et l’équipe est empoisonnée (2).', p2: (f, B, add) => { f.hp = Math.min(f.max, f.hp + 15); add('lutin'); B.mates().forEach(c => B.poisonP(c, 2)); },
    giver: 'le Vieux Chêne qui parle', intro: 'Une nuit, un chêne s’arrache du sol et vient frapper au porche avec une branche. « Les ronces dévorent la forêt. Leur reine, Morgane-des-Ronces, veut couvrir tout le Val d’épines, ton château compris. Il faut l’arrêter avant le printemps prochain. »',
    lore: ['herbiers recopiés', 'Les vieux herbiers parlent d’une plante qui fait reculer les ronces. Mets tes créatures à la Bibliothèque pour les déchiffrer.', 'Les herbiers sont formels : la sève de l’Épine gèle au contact de l’argent, et elle déteste qu’on chante faux.'],
    supplies: [['forge', 'sécateurs d’argent'], ['labo', 'fioles de désherbant'], ['cuisine', 'galettes de voyage'], ['taverne', 'chansons très fausses']],
    band: { name: 'les Jardiniers de l’Épine', goal: 'planter des ronces jusque dans ton Cœur', heroes: ['Maître Sécateur', 'Dame Bouture', 'Frère Compost', 'Écuyer Rameau'] },
    key: { name: 'La Clairière aux Lucioles', emo: '🌲', x: 'Seules les lucioles connaissent le chemin du Roncier Noir. Il faut en capturer un plein bocal dans leur clairière (un raid).', done: 'Le bocal brille comme une lanterne : le chemin du Roncier s’illumine.' },
    lairDesc: 'Des sentiers qui se referment derrière toi, des lutins qui chapardent, et au cœur des épines, une reine qui ne pardonne rien.', defeat: 'La Reine Épine se fane d’un coup, et les ronces se changent en rosiers. Un peu piquants, mais polis.', outro: 'Le Vieux Chêne t’offre un gland d’or et la promesse de ne plus jamais frapper au porche à minuit.' },
  hydre: { name: 'L’Hydre des Tourbières', short: 'l’Hydre', title: 'L’Hydre des Tourbières', lair: 'les Tourbières Hurlantes', emo: '🐍', ico: 'poison',
    look: ['char', 'dragonnet', 'hue-rotate(95deg) saturate(1.3) brightness(.85)'], regs: ['crap', 'ara', 'cha'], elite: 'tis', relic: 'champi',
    hp: 92, acts: [['multi', 4, 3], ['poisonall', 2], ['atk', 12], ['drain', 8]], leg: [['tailall', 4], ['poisonall', 1]], rage: [['multi', 5, 4], ['poisonall', 3], ['atk', 15], ['tailall', 6]],
    p2t: 'Deux têtes repoussent à l’Hydre : elle reprend 20 PV et frappe plus fort (+2).', p2: (f, B, add) => { f.hp = Math.min(f.max, f.hp + 20); f.buff += 2; },
    giver: 'les pêcheurs des Tourbières', intro: 'Trois pêcheurs trempés jusqu’aux oreilles frappent au porche. « Une hydre ! Dans les tourbières ! Chaque fois qu’on lui coupe une tête, il en repousse deux, et elle a mangé notre barque, notre filet et le chapeau du curé. Toi, tu as des monstres. Elle, c’est un monstre. Vous allez vous comprendre. »',
    lore: ['récits de pêcheurs', 'Les vieux récits de pêcheurs parlent de l’Hydre, mais ils exagèrent tous. Il faut les trier à la Bibliothèque.', 'Un seul récit dit vrai : les têtes de l’Hydre ne repoussent pas si on les cautérise… et elle a horreur de la soupe aux orties.'],
    supplies: [['forge', 'tisonniers'], ['labo', 'antidotes'], ['cuisine', 'marmites de soupe aux orties'], ['atelier', 'barques à fond plat']],
    band: { name: 'les Chasseurs de Têtes', goal: 'voler ta carte des tourbières pour vendre les têtes de l’Hydre au marché', heroes: ['Sire Harpon', 'Dame Épuisette', 'Frère Bourbier', 'Écuyer Cuissarde'] },
    key: { name: 'Le Moulin Noyé', emo: '🐟', x: 'Le passeur qui connaît le chemin des tourbières s’est enfermé au Moulin Noyé. Il faut aller le chercher (un raid).', done: 'Le passeur, ravi d’être délivré, te trace le chemin sur une feuille de nénuphar.' },
    lairDesc: 'Une brume qui pique les yeux, des choses qui gargouillent sous la vase, et l’Hydre, qui compte et recompte ses têtes.', defeat: 'L’Hydre s’enfonce dans la vase en bougonnant de ses sept bouches, et les tourbières redeviennent (presque) calmes.', outro: 'Les pêcheurs t’offrent une barque neuve, un filet neuf, et le chapeau du curé, retrouvé dans l’estomac de la bête.' },
  ambre: { name: 'Le Colosse d’Ambre', short: 'le Colosse', title: 'Le Colosse d’Ambre', lair: 'la Carrière Oubliée', emo: '🦴', ico: 'statue',
    look: ['char', 'golem', 'sepia(1) saturate(2.4) hue-rotate(-12deg) brightness(1.05) contrast(1.1)'], regs: ['momie', 'armure', 'mimic', 'follet'], elite: 'gardien', relic: 'couronne',
    hp: 98, acts: [['atk', 14], ['block', 14], ['smash', 10], ['aoe', 4]], leg: [['shatter'], ['stun']], rage: [['atk', 18], ['aoe', 7], ['smash', 13], ['multi', 6, 3]],
    p2t: 'Le Colosse se recouvre d’ambre (+25 de parade) et une armure vide se relève pour le servir.', p2: (f, B, add) => { f.block += 25; add('armure'); },
    giver: 'Maître Burin, tailleur de pierre', intro: 'Un vieux tailleur de pierre arrive, couvert de poussière dorée. « Dans la Carrière Oubliée, le Colosse d’Ambre s’est remis en marche. Il ramasse tout ce qui brille, et ton château brille, Maître. Beaucoup trop. »',
    lore: ['plans du Colosse', 'Les plans du Colosse dorment dans de vieux rouleaux. Il faut les reconstituer à la Bibliothèque.', 'Les plans montrent un défaut : une fissure dans l’ambre, juste sous le menton. Il faut frapper là, et fort.'],
    supplies: [['forge', 'marteaux de carrier'], ['atelier', 'leviers à ressort'], ['labo', 'acides à ambre'], ['cuisine', 'gamelles de mineur']],
    band: { name: 'les Collectionneurs d’Ambre', goal: 'piller ton Trésor pour l’offrir au Colosse (ils l’adorent)', heroes: ['Sire Pépite', 'Dame Breloque', 'Frère Lingot', 'Écuyer Paillette'] },
    key: { name: 'La Forge des Nains Partis', emo: '🔑', x: 'Seul un marteau nain peut fendre l’ambre du Colosse, et le dernier est resté dans une forge abandonnée, gardée par des pillards (un raid).', done: 'Le marteau nain est lourd, noir, et il chante quand on le soulève. Parfait.' },
    lairDesc: 'Des galeries dorées, des statues qui ne sont peut-être pas des statues, et un colosse qui compte ses trésors en grondant.', defeat: 'Le Colosse d’Ambre se fige pour de bon, au beau milieu de la carrière. Les touristes viendront le voir.', outro: 'Maître Burin te taille une statue de ton château dans un éclat d’ambre. Elle brille presque autant que l’original.' },
  sanguin: { name: 'Le Comte Sanguin', short: 'le Comte', title: 'Le Comte Sanguin', lair: 'le Manoir Écarlate', emo: '🦇', ico: 'bat',
    look: ['char', 'vampire', 'hue-rotate(-25deg) saturate(1.7) contrast(1.15)'], regs: ['bat', 'garg', 'vamp'], elite: 'maj', relic: 'cape',
    hp: 88, acts: [['drain', 10], ['fearall', 2], ['atk', 13], ['charm']], leg: [['drain', 5], ['fearall', 1]], rage: [['drain', 14], ['aoe', 6], ['charm'], ['multi', 5, 3]],
    p2t: 'Le Comte boit un verre (de quoi ?) : il reprend 18 PV, et la peur gagne l’équipe (+2).', p2: (f, B, add) => { f.hp = Math.min(f.max, f.hp + 18); B.mates().forEach(c => B.fear(c, 2)); },
    giver: 'une chauve-souris qui parle', intro: 'Une chauve-souris se pose sur la fenêtre et s’éclaircit la gorge. « Mon ancien maître, le Comte Sanguin, prépare un grand bal au Manoir Écarlate. Le plat principal, c’est ton château. Je démissionne, et je viens te prévenir. »',
    lore: ['lettres du Comte', 'Le Comte écrit beaucoup, et mal. Il faut déchiffrer ses lettres à la Bibliothèque.', 'Les lettres trahissent le Comte : il ne supporte ni l’ail, ni le soleil, ni qu’on arrive en avance à ses bals.'],
    supplies: [['cuisine', 'tresses d’ail'], ['labo', 'fioles de lumière'], ['forge', 'pieux d’argent'], ['taverne', 'faux cartons d’invitation']],
    band: { name: 'les Invités du Bal', goal: 'emporter ton Cœur comme cadeau d’hôte pour le Comte', heroes: ['Sire Smoking', 'Dame Dentelle', 'Frère Chandelier', 'Écuyer Valse'] },
    key: { name: 'La Cave aux Grands Crus', emo: '🔑', x: 'Les cartons d’invitation du bal sont rangés dans la cave d’un marchand de vin. Il faut aller en voler un (un raid).', done: 'Le carton est parfumé à la rose et au vieux sang. Tu es invité·e. Enfin, ton équipe l’est.' },
    lairDesc: 'Des couloirs qui sentent la cire et le velours, des chauves-souris en livrée, et un comte qui danse seul dans la grande salle.', defeat: 'Le Comte Sanguin s’évanouit dans un nuage de chauves-souris en jurant qu’il reviendra « au prochain siècle ».', outro: 'La chauve-souris prend sa retraite dans ton château, et t’offre la cape du Comte, oubliée sur une chaise.' },
};
// chaque boss est un vrai donjon d'expédition (une phase de fureur à lui)
const QBOSS_FX = {};
Object.entries(QBOSSES).forEach(([k, B]) => {
  const id = 'qb_' + k;
  CRAWL_EN[id] = { name: B.name, emo: B.emo, hp: B.hp, boss: 1, acts: B.acts, leg: B.leg, rage: B.rage, p2: id };
  CRAWL_DG[id] = { regs: B.regs, elite: B.elite, boss: id, relic: B.relic, site: 1, emo: B.emo, desc: B.lairDesc };
  BOSS_P2[id] = B.p2t; QBOSS_FX[id] = B.p2; CRAWL_LOOK[id] = B.look;
});

/* ---------- les ingrédients des quêtes secondaires ---------- */
const QNAMES = { m: ['Anselme', 'Barnabé', 'Clodomir', 'Firmin', 'Gustave', 'Prosper', 'Pâlichon', 'Eudes', 'Bastien', 'Hector', 'Léopold', 'Fulbert', 'Gonzague', 'Octave'], f: ['Bertille', 'Hortense', 'Philomène', 'Albertine', 'Gertrude', 'Mélusine', 'Fiole', 'Rosalie', 'Eulalie', 'Capucine', 'Pétronille', 'Ursule', 'Clémence', 'Brunehaut'] };
const npc = () => { const g = Math.random() < .5 ? 'm' : 'f'; return { g, n: pick(QNAMES[g]), sir: g === 'm' ? pick(['Maître', 'Frère', 'Père', 'Sire']) : pick(['Dame', 'Sœur', 'Mère', 'Damoiselle']) }; };
const qPlace = (rank) => { try { const l = settlements().filter(s => !rank || s.rank === rank); const s = l.length ? pick(l) : null; return s ? { name: s.name, id: s.id } : { name: pick(['Saint-Glinglin', 'Trou-les-Cornichons', 'Montcouic']), id: null }; } catch (e) { return { name: 'Saint-Glinglin', id: null }; } };
const QITEMS = {
  forge: ['ferrures', 'lames de faux', 'clous de cercueil', 'fers à cheval (pour licorne)', 'grilles de cachot', 'chaudrons', 'chaînes décoratives', 'heaumes à redresser'],
  atelier: ['rouages', 'serrures à secret', 'boîtes à musique', 'jouets mécaniques', 'pièges à rats géants', 'ressorts', 'girouettes grinçantes', 'coucous qui mordent'],
  labo: ['potions de sommeil', 'philtres de courage', 'onguents contre les verrues', 'fioles de brume', 'sirops pour la toux (vraiment)', 'élixirs de beauté douteux', 'poudres à éternuer'],
  bibli: ['pages recopiées', 'cartes annotées', 'traductions de grimoires', 'lettres d’amour anonymes', 'arbres généalogiques', 'contrats en petits caractères', 'almanachs'],
  cuisine: ['tourtes', 'bocaux de confiture', 'saucissons', 'galettes de voyage', 'gâteaux de mariage', 'marmites de soupe', 'pâtés en croûte'],
  taverne: ['couplets', 'tonneaux de bière brune', 'chansons à boire', 'tours de cartes', 'spectacles de marionnettes', 'blagues (des bonnes)'],
};
const QBEASTS = [
  { n: 'la Bête du marais', emo: '🐸', d: 'Un crapaud grand comme une grange, qui mange les barques et les pêcheurs distraits.' },
  { n: 'le Loup-garou du moulin', emo: '🐺', d: 'Il hurle à la lune, il dévore les sacs de farine, et il a mauvaise haleine.' },
  { n: 'la Vouivre des Saules', emo: '🐍', d: 'Un serpent ailé qui collectionne tout ce qui brille, y compris les dents en or.' },
  { n: 'les Rats géants de la fromagerie', emo: '🐀', d: 'Gros comme des chiens, et ils ont mangé toute la tomme de l’année.' },
  { n: 'la Nuée de chauves-souris du clocher', emo: '🦇', d: 'Des milliers de chauves-souris qui sonnent les cloches à trois heures du matin.' },
  { n: 'le Champignon qui marche', emo: '🍄', d: 'Un champignon géant qui se promène la nuit et laisse des spores partout. Personne n’ose le manger.' },
  { n: 'le Brochet de l’étang', emo: '🐟', d: 'Un brochet si vieux et si gros qu’il a avalé le ponton. Et le pêcheur qui était dessus (on l’a récupéré).' },
];
const QBAND_A = ['Chevaliers', 'Compagnons', 'Pourfendeurs', 'Frères', 'Sœurs', 'Paladins', 'Gardiens'], QBAND_B = ['de la Pâquerette', 'de la Marmite', 'de la Rose Trémière', 'de la Chaussette Perdue', 'de la Lune Molle', 'de la Choucroute', 'de la Tartine Beurrée', 'de la Sainte Courgette', 'du Petit Pois'];
const QHERO_T = ['Sire', 'Dame', 'Frère', 'Sœur', 'Écuyer', 'Damoiselle'], QHERO_N = ['Bouton-d’Or', 'Myosotis', 'Pissenlit', 'Trèfle', 'Pâtisson', 'Rutabaga', 'Ciboulette', 'Persil', 'Navet', 'Cornichon', 'Radis', 'Coquelicot', 'Topinambour', 'Échalote'];
const qBand = () => { const nm = shuffleQ(QHERO_N); return { name: `les ${pick(QBAND_A)} ${pick(QBAND_B)}`, heroes: shuffleQ(QHERO_T).slice(0, rint(3, 4)).map((t, i) => `${t} ${nm[i]}`) }; };
// une étape de défense, de raid ou de boss : ses cibles sont enregistrées dans la quête
const qDefend = (band, delay, x, done) => ({ k: 'defend', t: cap1(band.name), delay, band, x, done });
let QSEQ = 0;
const qRaidKey = () => 'q_' + Date.now().toString(36).slice(-5) + (QSEQ++);

/* ---------- la grande quête (une par partie) ---------- */
function genMain() {
  const k = pick(Object.keys(QBOSSES)), B = QBOSSES[k];
  const sup = shuffleQ(B.supplies).slice(0, rint(2, 3)).map(([w, name]) => ({ w, name, n: 2 }));
  const steps = [
    { k: 'craft', t: 'Les vieux écrits', x: `« ${B.lore[1]} »`, items: [{ w: 'bibli', name: B.lore[0], n: 3 }], done: B.lore[2] },
    { k: 'craft', t: 'Les provisions', x: `${cap1(B.giver)} dresse une liste sur un torchon : « Pour affronter ${B.short}, il nous faut ${listFr(sup.map(s => s.name))}. On ne part pas les mains vides. »`, items: sup, done: 'Les sacs sont prêts. Ça sent le fer chaud, la poudre et le saucisson.' },
  ];
  const band = qDefend(B.band, rint(2, 4), `Un pigeon apporte un mot : ${B.band.name} ${vbQ(B.band.name, 'veulent', 'veut')} ${B.band.goal}. La bande arrive dans quelques nuits : ne la laisse pas atteindre le Cœur !`, `${cap1(B.band.name)} ${vbQ(B.band.name, 'repartent', 'repart')} en se frottant les bosses.`);
  const key = { k: 'raid', t: B.key.name, target: qRaidKey(), raid: { name: B.key.name, emo: B.key.emo, tier: 0, risk: 3, tag: 'combat', reward: { g: 5, s: 2 }, hype: 3, menace: 1, desc: B.key.x }, x: `${B.key.x} (bouton Raid, cible « ${B.key.name} »)`, done: B.key.done };
  steps.push(...(Math.random() < .5 ? [band, key] : Math.random() < .5 ? [key, band] : [Math.random() < .5 ? band : key]));
  steps.push({ k: 'boss', t: cap1(B.lair), target: qRaidKey(), raid: { name: cap1(B.lair), emo: B.emo, tier: 0, risk: 3, tag: 'combat', reward: { g: 0 }, hype: 6, menace: 0, dg: 'qb_' + k, desc: B.lairDesc }, x: `${cap1(B.lair)} s’ouvre enfin. Choisis ta meilleure équipe et va affronter ${B.name} (bouton Raid, cible « ${cap1(B.lair)} »). C’est le combat le plus dur du Val : si l’équipe doit fuir, elle pourra y retourner.`, done: B.defeat });
  return { main: true, boss: k, ico: B.ico, title: B.title, giver: B.giver, intro: B.intro, steps, reward: { g: 40, hype: 15, art: true, free: { cristal: 1 } }, outro: B.outro };
}

/* ---------- les quêtes secondaires : des modèles, assemblés au hasard ---------- */
const metierRooms = () => ['forge', 'atelier', 'labo', 'bibli', 'cuisine', 'taverne'].filter(w => builtCount(w) > 0);
const QDILEMMAS = [
  { t: 'La livraison', x: '{giver} attend, la plume levée. Comment livres-tu ?', o: [['Livrer honnêtement', 'Un bon prix.', { g: 18 }], ['Glisser une souris dans le colis', 'Moins d’or, mais tout le Val en rira.', { g: 6, hype: 8 }]] },
  { t: 'Le prix', x: '{giver} sort sa bourse. « Combien je vous dois ? »', o: [['Le prix fort', 'De l’or, beaucoup.', { g: 24 }], ['Un échange de recettes', 'La Calamité recule, et on parle de toi.', { cal: 3, hype: 3 }]] },
  { t: 'Le pourboire', x: '« Vous avez été parfaits. Je vous laisse un petit quelque chose ? »', o: [['De l’or, s’il vous plaît', 'Du sonnant et trébuchant.', { g: 14 }], ['Des matériaux pour le château', 'Des planches et des pierres.', { s: 12 }]] },
  { t: 'La fête', x: '{giver} veut fêter ça. « Vous venez ? Il y aura des crêpes. »', o: [['Tout le château y va', 'Tout le monde a le sourire.', { mood: 1, hype: 3 }], ['On garde nos distances', 'Un château maléfique a une réputation à tenir.', { hype: 7 }]] },
];
const dilemmaStep = giver => { const D = pick(QDILEMMAS); return { k: 'choice', t: D.t, x: fillQ(D.x, { giver }), opts: D.o.map(([t, d, fx]) => ({ t, d, fx })) }; };
const qReward = (steps, extra = {}) => {
  const tier = S.tier || 0, n = steps.length, R = { g: 6 + 5 * n + rint(0, 6) + 3 * tier, hype: 2 + n + rint(0, 3) };
  const r = Math.random();
  if (r < .08) R.art = true; else if (r < .3) R.s = rint(4, 8) + 2 * tier; else if (r < .45) R.mood = 1;
  return Object.assign(R, extra);
};
const QGEN = {
  // une commande à fabriquer
  commande() {
    const rooms = metierRooms(); if (!rooms.length) return null;
    const ws = shuffleQ(rooms).slice(0, Math.random() < .5 ? 1 : 2), items = ws.map(w => ({ w, name: pick(QITEMS[w]), n: rint(2, 3) + (S.tier >= 2 ? 1 : 0) })), names = listFr(items.map(i => i.name));
    const p = npc(), v = pick([
      { giver: `${p.sir} ${p.n}, ${p.g === 'f' ? 'intendante' : 'intendant'} du Baron`, title: 'La commande du Baron', intro: `Un petit personnage en perruque déroule un parchemin long comme un couloir : « Monseigneur le Baron souhaite des ${names}. Il paie bien. Il paie tard, mais il paie bien. »`, outro: 'Le Baron est content. Enfin, il ne s’est pas plaint, ce qui revient au même.' },
      { giver: `${p.sir} ${p.n}, ${p.g === 'f' ? 'marchande' : 'marchand'} de {ville}`, title: 'La foire de {ville}', intro: '« Ma boutique est vide et la foire commence bientôt ! Il me faut des ' + names + '. On partage les bénéfices ? »', outro: 'La foire de {ville} est un succès. Ton château y a même sa petite réputation.' },
      { giver: 'le bourgmestre de {ville}', title: 'La fête de {ville}', intro: '« Le village prépare sa fête et nous manquons de tout : des ' + names + '. Nous ne sommes pas riches, mais nous sommes reconnaissants. »', outro: '{ville} danse jusqu’à l’aube. On y boit même à ta santé (en baissant la voix).', gw: true },
    ]), pl = qPlace(), giver = fillQ(v.giver, { ville: pl.name });
    const steps = [{ k: 'craft', t: cap1(names), x: `Il faut fabriquer : ${names}. Poste des créatures ${listFr(ws.map(w => WORKSHOPS[w].at))} : elles y travailleront la nuit.`, items }];
    if (Math.random() < .6) steps.push(dilemmaStep(giver));
    return { ico: 'build', title: fillQ(v.title, { ville: pl.name }), giver, intro: fillQ(v.intro, { ville: pl.name }), steps, limit: 10 + 3 * items.reduce((a, i) => a + i.n, 0), reward: qReward(steps, v.gw ? { gw: 12 } : {}), outro: fillQ(v.outro, { ville: pl.name }), site: v.gw ? pl.id : null, key: 'commande' };
  },
  // une chasse : un raid sur une bête
  chasse() {
    if (!S.world) return null;
    const b = pick(QBEASTS), pl = qPlace(1), who = pick(['les pêcheurs de {v}', 'le bourgmestre de {v}', 'les bergers de {v}', 'la meunière de {v}', 'le garde champêtre de {v}']).replace('{v}', pl.name);
    const steps = [];
    if (Math.random() < .5) steps.push(Math.random() < .5 || !builtCount('forge') ? { k: 'wait', t: 'Sur la piste', n: rint(1, 2), x: `Tes créatures suivent les traces de ${b.n}. Ça sent fort, et ça va vers les collines.`, done: 'La piste s’arrête devant une tanière. Ça ronfle là-dedans.' } : { k: 'craft', t: 'Des pièges sur mesure', x: `« Il faudra des pièges solides. » Tes créatures postées à la Forge en fabriquent.`, items: [{ w: 'forge', name: 'pièges à grosse bête', n: 2 }], done: 'Les pièges claquent si fort qu’ils font peur aux forgerons eux-mêmes.' });
    const key = qRaidKey();
    steps.push({ k: 'raid', t: 'La chasse', target: key, raid: { name: cap1(b.n), emo: b.emo, tier: 0, risk: Math.min(4, 2 + Math.floor((S.tier || 0) / 2) + (Math.random() < .4 ? 1 : 0)), tag: 'combat', reward: { g: 5, s: 2 }, hype: 3, menace: 1, desc: b.d }, x: `Envoie une équipe costaude chasser ${b.n} (bouton Raid, cible « ${cap1(b.n)} »). ${b.d}`, done: `${cap1(b.n)} détale et ne revient pas.` });
    if (Math.random() < .4) steps.push({ k: 'choice', t: 'Et maintenant ?', x: `${cap1(b.n)} est coincé·e. Qu’en fais-tu ?`, opts: [{ t: 'La vendre au cirque', d: 'De l’or.', fx: { g: 15 } }, { t: 'La relâcher très loin', d: 'Tout le Val trouve ça très classe.', fx: { hype: 6, mood: 1 } }] });
    return { ico: 'swords', title: cap1(b.n), giver: who, intro: pick(['« Une bête terrorise le village. {d} On a pensé à toi : tu as des monstres, elle est un monstre, vous vous comprendrez. »', '« On ne dort plus. {d} Débarrasse-nous-en et le village te devra une fière chandelle. »']).replace('{d}', b.d), steps, limit: 12 + 2 * steps.length, reward: qReward(steps, { gw: 15 }), outro: `${cap1(pl.name)} respire enfin. On t’a offert un panier de victuailles, et on a cessé de fermer les volets quand tu passes.`, site: pl.id, key: 'chasse:' + b.n };
  },
  // un défi : une bande nommée annonce son arrivée
  defi() {
    const band = qBand(), steps = [], how = pick(['Un héraut sonne trois fois de la trompette (faux)', 'Une lettre parfumée est glissée sous la porte', 'Un pigeon voyageur très fatigué tombe dans la cour']);
    const prep = Math.random();
    if (prep < .3 && metierRooms().some(w => w === 'forge' || w === 'atelier')) { const w = builtCount('forge') ? 'forge' : 'atelier'; steps.push({ k: 'craft', t: 'Préparer l’accueil', x: 'Ils viendront bien armés. Tes créatures postées à la ' + ROOMS[w].name + ' préparent de quoi les recevoir.', items: [{ w, name: w === 'forge' ? 'chausse-trapes' : 'portes à ressort', n: 2 }], done: 'L’accueil est prêt. Il pique.' }); }
    else if (prep < .5) steps.push({ k: 'pay', t: 'Un espion', x: 'Un espion propose de te vendre leur plan d’attaque pour quelques pièces.', cost: { g: 6 + 2 * (S.tier || 0) }, done: 'Le plan est griffonné au dos d’une recette de crêpes, mais il est clair : ils viennent pour le Cœur.' });
    steps.push(qDefend(band, rint(3, 4), `${cap1(band.name)} arrivent dans quelques nuits. Poste tes gardes, pose tes pièges et garde tes jetons du Cœur pour l’assaut : ils sont venus pour gagner.`, `${cap1(band.name)} repartent en boitant, leur fierté un peu froissée.`));
    const tr = pick(DEF_ORDER.filter(k => !DEFS[k].rank && !DEFS[k].unique && !DEFS[k].saga && !DEFS[k].block && DEFS[k].kind !== 'ruse'));
    return { ico: 'swords', title: cap1(band.name), giver: pick(['un héraut en collants', 'une lettre parfumée', 'un pigeon voyageur']), intro: `${how} : « ${cap1(band.name)}, pourfendeurs de donjons, défient ton château ! Ils viendront bientôt. Prépare-toi à… être pourfendu ! »`, steps, limit: 10, reward: qReward(steps, { free: { [tr]: 1 } }), outro: `${cap1(band.name)} te laissent, beaux joueurs, un souvenir de leur passage : ${itemName(tr)}.`, key: 'defi' };
  },
  // un banquet à cuisiner
  banquet() {
    if (typeof hasKitchen !== 'function' || !hasKitchen()) return null;
    const has = i => (INGR[i].from || []).some(f => countItem(f) > 0);
    const dishes = shuffleQ(Object.keys(RECIPES).filter(k => !RECIPES[k].rank && Object.keys(RECIPES[k].need).every(has))).slice(0, 2); if (!dishes.length) return null;
    const p = npc(), c = S.creatures.length ? pick(S.creatures) : null, v = pick([
      { giver: `Chef ${p.n}, gobelin traiteur`, title: 'Le banquet des gobelins', intro: '« Mon cousin se marie ! Avec une gobeline ! Enfin, avec quelqu’un. Il me faut un banquet, et ma cuisine a brûlé. Encore. Je peux emprunter la tienne ? »' },
      { giver: 'les mariés de {ville}', title: 'Les noces de {ville}', intro: '« On se marie, et le traiteur s’est enfui avec la pièce montée. Il paraît que tes fourneaux sont les meilleurs du Val… »' },
      ...(c ? [{ giver: `${c.name} (${SPECIES[c.sp].name}), de ton château`, title: `L’anniversaire de ${c.name}`, intro: `${c.name} rougit (ou verdit) : « C’est mon anniversaire, Maître. Je voudrais un vrai repas, comme dans les livres. »`, crit: c.id }] : []),
    ]), pl = qPlace();
    const steps = [];
    if (Math.random() < .4) { const i = pick(['legume', 'oeuf', 'miel', 'poisson', 'champi'].filter(has)); if (i) steps.push({ k: 'pay', t: 'Les courses', x: `Il faut d’abord des ingrédients de ton garde-manger.`, cost: { [i]: 2 } }); }
    steps.push({ k: 'cook', t: 'Aux fourneaux', x: `Au menu : ${listFr(dishes.map(k => RECIPES[k].name))} (touche la Cuisine ou la Taverne, puis « Cuisiner »).`, dishes: Object.fromEntries(dishes.map(k => [k, 1])), done: 'Les plats fument. Quelqu’un a déjà goûté trois fois.' });
    return { ico: 'food', title: fillQ(v.title, { ville: pl.name }), giver: fillQ(v.giver, { ville: pl.name }), intro: fillQ(v.intro, { ville: pl.name }), steps, limit: 14, reward: qReward(steps, { mood: 1, crit: v.crit || null }), outro: 'Le repas a duré trois nuits. Quelqu’un a dansé sur la table, et tout ton château a eu sa part.', key: 'banquet' };
  },
  // une recherche à la Bibliothèque
  savoir() {
    if (!builtCount('bibli')) return null;
    const p = npc(), v = pick([
      { giver: `Frère ${pick(QNAMES.m)}, bibliothécaire distrait`, title: 'Le grimoire égaré', intro: '« J’ai prêté mon grimoire à quelqu’un. Ou à quelque chose. Il en reste des pages éparpillées dans ta bibliothèque, je le sens. Tu m’aides à le recopier ? Je paierai. En connaissances. »', item: 'pages recopiées' },
      { giver: `${p.sir} ${p.n}, archiviste de {ville}`, title: 'Les archives de {ville}', intro: '« Les souris ont mangé la moitié de nos archives. Il paraît que tes créatures savent lire. Enfin, certaines. »', item: 'registres reconstitués' },
      { giver: 'un fantôme qui cherche ses mémoires', title: 'Les mémoires du fantôme', intro: '« J’ai oublié qui j’étais. C’est très gênant pour un fantôme. Mes souvenirs sont quelque part dans tes livres… »', item: 'souvenirs retrouvés' },
    ]), pl = qPlace();
    const steps = [{ k: 'craft', t: 'À la Bibliothèque', x: 'Tes créatures postées à la Bibliothèque se mettent au travail (les érudits vont bien plus vite).', items: [{ w: 'bibli', name: v.item, n: rint(3, 4) }] }];
    steps.push(Math.random() < .5 ? { k: 'pay', t: 'La reliure', x: '« Il faut relier tout ça. Le relieur est un voleur, mais c’est le seul. »', cost: { g: 8 + 2 * (S.tier || 0) } } : { k: 'choice', t: 'Le secret', x: 'En recopiant, tes créatures découvrent un secret gênant sur le Baron. Que fais-tu ?', opts: [{ t: 'Le garder pour toi', d: 'Un secret, ça peut servir : de l’or, discrètement.', fx: { g: 16 } }, { t: 'Le crier sur les toits', d: 'Tout le Val en rit, et ton nom avec.', fx: { hype: 10 } }] });
    return { ico: 'book', title: fillQ(v.title, { ville: pl.name }), giver: fillQ(v.giver, { ville: pl.name }), intro: v.intro, steps, limit: 15, reward: qReward(steps, { reveal: 8, craftxp: ['bibli', 4] }), outro: 'Le Val n’a plus beaucoup de secrets pour toi : on t’a laissé des cartes annotées en remerciement.', key: 'savoir' };
  },
  // un convoi : livrer, puis attendre qu'il arrive
  convoi() {
    const pl = qPlace(), what = pick([['s', 'des matériaux', rint(8, 14)], ['g', 'de l’or (une avance)', rint(10, 16)]]), p = npc();
    const steps = [
      { k: 'pay', t: 'Le chargement', x: `« Le convoi part dès qu’il est plein. Il nous faut ${what[1]}. Je te rendrai le double, parole de ${p.g === 'f' ? 'marchande' : 'marchand'} ! »`, cost: { [what[0]]: what[2] } },
      { k: 'wait', t: 'La route', n: rint(2, 3), x: `Le convoi roule vers ${pl.name}. Les chariots grincent, les bœufs soupirent.`, done: `Le convoi arrive à ${pl.name} sans encombre (ou presque : une roue a fait la sieste).` },
    ];
    if (Math.random() < .4) steps.push(dilemmaStep(`${p.sir} ${p.n}`));
    return { ico: 'gift', title: `Le convoi pour ${pl.name}`, giver: `${p.sir} ${p.n}, ${p.g === 'f' ? 'marchande' : 'marchand'} ambulant${p.g === 'f' ? 'e' : ''}`, intro: `Une carriole s’arrête devant le porche. « Je monte un convoi vers ${pl.name}. Tu fournis la marchandise, je fournis les bœufs, on partage les bénéfices. Promis, je ne m’enfuis pas avec. »`, steps, limit: 12, reward: qReward(steps, { [what[0]]: what[2] * 2, gw: 8 }), outro: `${p.sir} ${p.n} a tenu parole : tu récupères le double de ta mise. Il·elle reviendra peut-être, avec d’autres idées.`, site: pl.id, key: 'convoi' };
  },
  // une créature du château a une envie de grandeur
  creature() {
    const cs = S.creatures.filter(c => !isOut(c) && (c.lvl || 1) >= 2); if (!cs.length) return null;
    const c = pick(cs), who = `${c.name} (${SPECIES[c.sp].name})`, rooms = metierRooms();
    const v = pick([
      ...(rooms.includes('taverne') ? [{ title: `La chanson de ${c.name}`, intro: `${who} se racle la gorge : « Maître, j’ai écrit une chanson. Il faudrait la répéter, et la chanter devant tout le Val. »`, steps: [{ k: 'craft', t: 'Les répétitions', x: 'Tes créatures postées à la Taverne répètent avec lui·elle.', items: [{ w: 'taverne', name: 'couplets', n: 3 }] }, { k: 'choice', t: 'Le grand soir', x: 'Le public tape du pied. Quelle version chante-t-il·elle ?', opts: [{ t: 'La version paillarde', d: 'On en parlera longtemps.', fx: { hype: 10 } }, { t: 'La version qui fait pleurer', d: 'Tout le château a le moral.', fx: { mood: 1, hype: 4 } }] }] }] : []),
      { title: `La revanche de ${c.name}`, intro: `${who} fulmine : « Les cousins de la vallée d’à côté se moquent de moi. Qu’ils viennent, je les attends ! »`, steps: [qDefend({ name: `les cousins de ${c.name}`, heroes: shuffleQ(QHERO_N).slice(0, 3).map(n => `Cousin ${n}`) }, rint(2, 3), `Les cousins de ${c.name} arrivent, la mine goguenarde. Repousse-les avec panache !`, `Les cousins repartent, beaucoup moins goguenards.`)] },
      { title: `Le cadeau de ${c.name}`, intro: `${who} est amoureux·se. « Je voudrais offrir quelque chose de beau. Quelque chose qui brille. Ou qui sent bon. Ou les deux. »`, steps: [{ k: 'pay', t: 'Le cadeau', x: 'Il faut de quoi faire un beau cadeau.', cost: { g: 6 + 2 * (S.tier || 0), s: 3 } }, { k: 'wait', t: 'Le rendez-vous', n: 1, x: `${c.name} est parti·e offrir son cadeau, un bouquet de fleurs fanées dans l’autre main.`, done: `${c.name} revient sur un petit nuage.` }] },
    ]);
    return { ico: 'heart', title: v.title, giver: `${who}, de ton château`, intro: v.intro, steps: v.steps, limit: 12, reward: qReward(v.steps, { crit: c.id, mood: 1 }), outro: `${c.name} rayonne : il·elle ne parle plus que de toi, de ton château, et de cette quête.`, key: 'creature:' + c.id };
  },
  // un petit dilemme
  dilemme() {
    const v = pick([
      { giver: 'un chaton qui parle', title: 'Le chaton du sorcier', intro: 'Un chaton noir entre par la chatière, s’assoit et dit : « Je suis le familier d’un sorcier, et je me suis perdu. Enfin, je l’ai perdu. C’est lui qui est perdu. »', steps: [{ k: 'wait', t: 'Les recherches', n: 2, x: 'Tes créatures cherchent le sorcier dans tout le Val. Le chaton supervise, depuis un coussin.', done: 'On a retrouvé le sorcier… coincé dans sa propre bouteille.' }, { k: 'choice', t: 'La bouteille', x: 'Le sorcier promet monts et merveilles si on le libère. Le chaton, lui, propose de rester.', opts: [{ t: 'Libérer le sorcier', d: 'Il paie sa dette en or.', fx: { g: 20 } }, { t: 'Garder le chaton', d: 'Le château a une mascotte : tout le monde est ravi.', fx: { mood: 1, hype: 5 } }] }] },
      { giver: 'une diseuse de bonne aventure', title: 'La boule de cristal', intro: 'Une diseuse de bonne aventure s’installe dans ta cour. « Je vois… je vois… un grand destin. Ou un grand dîner. La boule est un peu sale. »', steps: [{ k: 'pay', t: 'Croiser les doigts', x: '« Pour en voir plus, il faut croiser ma main. D’argent, de préférence. »', cost: { g: 8 } }, { k: 'choice', t: 'La prophétie', x: 'Elle voit deux avenirs. Lequel choisis-tu de croire ?', opts: [{ t: 'Celui où tu deviens riche', d: 'Elle te révèle où dort un vieux trésor.', fx: { g: 22 } }, { t: 'Celui où tu deviens célèbre', d: 'Elle raconte ta prophétie à tout le Val.', fx: { hype: 12 } }] }] },
      { giver: 'un nain en fuite', title: 'Le nain en fuite', intro: 'Un nain tout essoufflé se cache derrière ton porche. « On me poursuit ! Pour une histoire de dette ! Une toute petite ! Cachez-moi, je vous en prie ! »', steps: [{ k: 'choice', t: 'Les poursuivants', x: 'Des huissiers frappent au porche, le registre sous le bras.', opts: [{ t: 'Cacher le nain', d: 'Il te remercie en matériaux, et file à l’aube.', fx: { s: 14 } }, { t: 'Le livrer aux huissiers', d: 'Ils te versent une prime, et le nain te maudit (un peu).', fx: { g: 16, cal: -1 } }] }] },
      { giver: 'un troubadour sans le sou', title: 'La ballade du Maître', intro: '« Laissez-moi dormir dans votre grange, et je composerai la ballade de votre château ! Une ballade épique ! Avec des rimes ! »', steps: [{ k: 'wait', t: 'La composition', n: 2, x: 'Le troubadour compose dans ta grange. On l’entend chercher des rimes à « château » toute la nuit.', done: 'La ballade est prête. Elle rime avec « gâteau », « marteau » et, curieusement, « Baron rigolo ».' }, { k: 'choice', t: 'La première', x: 'Où chante-t-il la ballade ?', opts: [{ t: 'Sur la place du village', d: 'Tout le Val l’entend.', fx: { hype: 9 } }, { t: 'Rien que pour le château', d: 'Tes créatures adorent.', fx: { mood: 1, hype: 2 } }] }] },
    ]);
    return { ico: 'scroll', title: v.title, giver: v.giver, intro: v.intro, steps: v.steps, limit: 10, reward: qReward(v.steps), outro: 'Une drôle d’histoire, que tes créatures raconteront longtemps au coin du feu.', key: 'dilemme:' + v.title };
  },
};
// tirer une quête secondaire au hasard parmi celles qui ont du sens dans ce château, sans répéter les dernières
function genSide() {
  const Q = qState(), recent = new Set((Q.keys || []).slice(-6)), kinds = shuffleQ(Object.keys(QGEN));
  for (const k of kinds) {
    for (let t = 0; t < 3; t++) { let d = null; try { d = QGEN[k](); } catch (e) { console.error('quête', k, e); } if (d && !recent.has(d.key)) { d.id = 'g' + (Q.seq = (Q.seq || 0) + 1); return d; } }
  }
  return null;
}

/* ---------- l'état ---------- */
const qState = () => {
  const Q = (S.quests = S.quests || { offers: [], cur: [], done: [], next: 5, main: false, seq: 0, keys: [] });
  // une partie d'une version d'avant (quêtes écrites à la main) : on repart de zéro
  if (Q.cur.some(q => !q.def) || Q.offers.some(o => !o.def)) { Q.cur = Q.cur.filter(q => q.def); Q.offers = Q.offers.filter(o => o.def); }
  return Q;
};
const qStep = q => (q && q.def ? q.def.steps[q.i] : null);
function questsDone() { return S && S.quests ? S.quests.done.filter(d => d.ok).length : 0; }
const PANTRY_NAMES = { legume: 'légumes', poisson: 'poissons', oeuf: 'œufs', miel: 'miel', champi: 'champignons' };
// le travail d'une pièce pour une quête : chaque créature postée là (présente, pas boudeuse) donne 1 point, les gens de métier 1 + leur grade
function questProd(w) {
  return S.creatures.reduce((a, c) => {
    if (isOut(c) || injured(c) || c.mood < 2 || !c.post) return a;
    const r = S.rooms.find(o => o.id === c.post && o.built); if (!r || !(r.t === w || (ROOMS[r.t] && ROOMS[r.t].like === w))) return a;
    return a + 1 + (typeof craftAff === 'function' && craftAff(c, w) ? craftLvl(craftOf(c, w)) : 0);
  }, 0);
}
// les cibles de raid des quêtes : là tant que l'étape les demande
function questSync() {
  Object.keys(RAIDS).forEach(k => { if (RAIDS[k] && RAIDS[k].quest) delete RAIDS[k]; });
  if (typeof S === 'undefined' || !S || !S.quests) return;
  S.quests.cur.forEach(q => { const st = qStep(q); if (st && st.target && st.raid) RAIDS[st.target] = { ...st.raid, quest: true }; });
}

/* ---------- avancer ---------- */
function questStart(q) { const st = qStep(q); q.prog = {}; q.armed = false; q.at = st && st.k === 'wait' ? S.night + st.n : st && st.k === 'defend' ? S.night + (st.delay || 3) : null; questSync(); }
function questAdvance(q, out) {
  const D = q.def, st = qStep(q);
  if (st && st.done) out.push(['📜', `${D.title} : ${st.done}`, 'good']);
  q.i++;
  if (q.i >= D.steps.length) return questComplete(q, out);
  questStart(q); const nx = qStep(q);
  out.push(['📜', `${D.title}, étape ${q.i + 1} : ${nx.t}. ${nx.x}`, 'ev']);
}
function questApply(fx, got) {
  if (!fx) return;
  if (fx.g) { S.gold += fx.g; got.push(`+${fx.g} 💰`); }
  if (fx.s) { S.mat += fx.s; got.push(`+${fx.s} 🪵`); }
  if (fx.hype) { S.hype += fx.hype; got.push(`+${fx.hype} notoriété`); }
  if (fx.mood) { S.creatures.forEach(c => { if (!isOut(c)) c.mood = Math.min(5, c.mood + fx.mood); }); got.push(`+${fx.mood} humeur pour tous`); }
  if (fx.cal) { S.calamity = Math.max(0, S.calamity - fx.cal); got.push(fx.cal > 0 ? `la Calamité recule de ${fx.cal}` : `la Calamité monte de ${-fx.cal}`); }
}
function questComplete(q, out) {
  const D = q.def, R = D.reward || {}, Q = qState(), got = [];
  questApply(R, got);
  if (R.gw && q.site && typeof addGw === 'function') { const s = siteById(q.site); if (s) { addGw(s, R.gw); got.push(`${s.name} t’apprécie`); } }
  if (R.free) Object.entries(R.free).forEach(([k, n]) => { S.free[k] = (S.free[k] || 0) + n; got.push(`${n > 1 ? n + ' ' : ''}${itemName(k)} offert·e`); });
  if (R.art && S.world) { const a = giveArtefact(randomArtefact(), 'quête'); if (a) got.push(`un artefact : ${FURN[a].name}`); }
  if (R.reveal && S.world && typeof bibliReveal === 'function') { const r = bibliReveal(R.reveal); if (r && r.n) got.push(`${r.n} cases du Val dévoilées`); }
  if (R.craftxp) { const [w, n] = R.craftxp; S.creatures.filter(c => craftAff(c, w) && metierOf(c) === w).forEach(c => { (c.craft = c.craft || {})[w] = (c.craft[w] || 0) + n; }); }
  if (R.crit) { const c = critter(R.crit); if (c) { if (typeof addLoy === 'function') addLoy(c, 15); gainXP(c, 3, out); if (typeof emote === 'function') emote(c.id, 'happy', 3000); got.push(`${c.name} t’adore`); } }
  Q.cur = Q.cur.filter(x => x !== q); Q.done.push({ id: q.id, title: D.title, outro: D.outro, main: !!D.main, n: S.night, ok: true }); S.stats.questsRP = (S.stats.questsRP || 0) + 1;
  out.push(['🏆', `Quête accomplie : ${D.title} ! ${D.outro}${got.length ? ` (${got.join(', ')})` : ''}`, 'good']);
  addLog(`Quête accomplie : ${D.title}.`, 'ev'); questSync();
}
function questFail(q, why, out) {
  const Q = qState(); Q.cur = Q.cur.filter(x => x !== q); Q.done.push({ id: q.id, title: q.def.title, n: S.night, ok: false });
  if (q.def.main) { Q.main = S.night; Q.mainDef = q.def; Q.mainDef.steps.forEach(st => { if (st.target) st.target = qRaidKey(); }); }   // la grande quête reviendra au tableau
  out.push(['📜', `La quête « ${q.def.title} » échoue : ${why}.`, 'bad']); questSync();
}
// un événement (plat cuisiné, raid réussi, boss vaincu, bande repoussée) fait avancer les quêtes concernées
function questEvent(kind, key, out) {
  qState().cur.slice().forEach(q => {
    const st = qStep(q); if (!st || st.k !== kind) return;
    if (kind === 'cook') { if (!st.dishes[key]) return; q.prog[key] = (q.prog[key] || 0) + 1; if (Object.entries(st.dishes).every(([k, n]) => (q.prog[k] || 0) >= n)) questAdvance(q, out); }
    else if ((kind === 'raid' || kind === 'boss') && st.target === key) questAdvance(q, out);
    else if (kind === 'defend' && key === q.id) questAdvance(q, out);
  });
}
const questShow = out => { out.forEach(([, t, tone]) => addLog(t.replace(/<[^>]+>/g, ''), tone === 'bad' ? 'bad' : 'ev')); if (out.length && !headless() && typeof toast === 'function') toast(`📜 ${out[out.length - 1][1].slice(0, 160)}`); };

/* ---------- les commandes ---------- */
Object.assign(CMD, {
  questAccept(a) {
    const Q = qState(), o = Q.offers.find(x => x.id === a.id); if (!o || !o.def) return 'Cette quête n’est plus au tableau';
    if (Q.cur.length >= QUEST_MAX) return `${QUEST_MAX} quêtes en cours au plus`;
    const q = { id: o.id, def: o.def, i: 0, n: S.night, until: o.def.limit ? S.night + o.def.limit : null, prog: {}, site: o.def.site || null };
    Q.offers = Q.offers.filter(x => x !== o); Q.cur.push(q); questStart(q); addLog(`Quête acceptée : ${o.def.title}.`, 'ev'); return null;
  },
  questDecline(a) { const Q = qState(), o = Q.offers.find(x => x.id === a.id); if (!o) return 'Introuvable'; Q.offers = Q.offers.filter(x => x !== o); if (o.def.main) { Q.main = S.night; Q.mainDef = o.def; } return null; },
  questAbandon(a) { const q = qState().cur.find(x => x.id === a.id); if (!q) return 'Introuvable'; const out = []; questFail(q, 'tu l’as abandonnée', out); questShow(out); return null; },
  questPay(a) {
    const q = qState().cur.find(x => x.id === a.id), st = q && qStep(q); if (!st || st.k !== 'pay') return 'Rien à livrer';
    const err = CMDcheckPay(q); if (err) return err;
    const c = st.cost, P = typeof pantry === 'function' ? pantry() : {};
    S.gold -= c.g || 0; S.mat -= c.s || 0; Object.keys(PANTRY_NAMES).forEach(k => { if (c[k]) P[k] -= c[k]; });
    const out = []; questAdvance(q, out); questShow(out); return null;
  },
  questChoose(a) {
    const q = qState().cur.find(x => x.id === a.id), st = q && qStep(q); if (!st || st.k !== 'choice') return 'Rien à choisir';
    const o = st.opts[a.o]; if (!o) return 'Choix inconnu';
    const got = []; questApply(o.fx, got);
    const out = [['📜', `${q.def.title} : ${o.t}${got.length ? ` (${got.join(', ')})` : ''}.`, 'good']]; questAdvance(q, out); questShow(out); return null;
  },
});
// les plats cuisinés comptent pour les quêtes
const cookQuest = CMD.cook;
CMD.cook = a => { const err = cookQuest(a); if (!err) { const out = []; questEvent('cook', a.id, out); questShow(out); } return err; };
// un raid de quête réussi
const applyRaidQuest = applyRaid;
applyRaid = function (roll) { const k = S.raid && S.raid.target, tg = k && RAIDS[k], lines = applyRaidQuest(roll); if (tg && tg.quest && roll.res !== 'fail') questEvent('raid', k, lines); return lines; };
// le boss de la grande quête vaincu (en expédition)
const crawlSiteResultQuest = crawlSiteResult;
crawlSiteResult = function (key, R, team, lines) { crawlSiteResultQuest(key, R, team, lines); if (RAIDS[key] && RAIDS[key].quest && R && R.done === 'boss') { S.stats.qboss = (S.stats.qboss || 0) + 1; questEvent('boss', key, lines); } };
// une bande nommée : la prochaine invasion, quand l'étape « defend » est armée
const planInvasion0Quest = planInvasion0;
planInvasion0 = function () {
  const p = planInvasion0Quest(), q = S.quests && S.quests.cur.find(x => { const st = qStep(x); return st && st.k === 'defend' && x.armed; });
  if (p && q && p.party && p.party.length && !p.foe) {
    const st = qStep(q), names = st.band.heroes;
    while (p.party.length < names.length) p.party.push({ ...p.party[0] });
    p.party = p.party.slice(0, names.length).map((h, i) => ({ ...h, name: names[i], nem: false }));
    p.nem = false; p.qband = q.id; p.bandName = st.band.name; p.courage = p.party.reduce((a, h) => a + h.hp, 0);
  }
  return p;
};
const applyInvasionQuest = applyInvasion;
applyInvasion = function (plan, outcome) {
  const lines = applyInvasionQuest(plan, outcome);
  try {
    const q = plan && plan.qband && S.quests && S.quests.cur.find(x => x.id === plan.qband);
    if (q) { if (outcome === 'repelled') questEvent('defend', q.id, lines); else { q.armed = false; q.at = S.night + 4; lines.push(['📜', `${cap1(plan.bandName)} ${vbQ(plan.bandName, 'repartent, mais jurent', 'repart, mais jure')} de revenir dans 4 nuits.`, 'bad']); } }
  } catch (e) { console.error(e); }
  return lines;
};

/* ---------- l'aube : les offres, le travail, les délais ---------- */
const dawnQuest = dawn;
dawn = function (report) {
  const r = dawnQuest(report);
  try { questDawn(report); } catch (e) { console.error(e); }
  return r;
};
function questDawn(report) {
  const Q = qState(), out = [];
  // le travail de la nuit : chaque pièce fabrique ce qu'on lui demande
  Q.cur.slice().forEach(q => {
    const st = qStep(q); if (!st) return;
    if (st.k === 'craft') {
      st.items.forEach((it, i) => { const k = 'i' + i, need = it.n * QUEST_UNIT; if ((q.prog[k] || 0) < need) q.prog[k] = Math.min(need, (q.prog[k] || 0) + questProd(it.w)); });
      if (st.items.every((it, i) => (q.prog['i' + i] || 0) >= it.n * QUEST_UNIT)) questAdvance(q, out);
    } else if (st.k === 'wait' && S.night >= q.at) questAdvance(q, out);
    else if (st.k === 'defend' && !q.armed && S.night >= q.at) { q.armed = true; S.menace = MENACE_MAX; out.push(['⚔️', `${cap1(st.band.name)} ${vbQ(st.band.name, 'arrivent', 'arrive')} cette nuit ! Poste tes gardes et garde tes jetons du Cœur.`, 'bad']); }
  });
  // les délais
  Q.cur.slice().forEach(q => { if (q.until && S.night > q.until) questFail(q, 'le temps est écoulé', out); });
  // la grande quête : tirée au sort une fois par partie, proposée quand le château est prêt (et de nouveau 15 nuits après un refus ou un échec)
  Q.offers = Q.offers.filter(o => !o.until || o.until >= S.night);
  const mainDone = Q.done.some(d => d.main && d.ok), mainHere = Q.cur.some(q => q.def.main) || Q.offers.some(o => o.def.main);
  if (!mainDone && !mainHere && S.night >= 12 && (S.tier || 0) >= 1 && (Q.main === false || (typeof Q.main === 'number' && S.night >= Q.main + 15))) {
    const def = Q.mainDef || (Q.mainDef = genMain());
    Q.offers.unshift({ id: 'main', def, n: S.night }); Q.main = true; out.push(['📜', `Une grande quête t’attend au journal : ${def.title}. ${cap1(def.giver)} frappe à ta porte.`, 'ev']);
  }
  // les autres : de temps en temps, deux au plus au tableau
  if (S.night >= Q.next && Q.offers.filter(o => !o.def.main).length < 2 && Math.random() < .35) {
    const def = genSide();
    if (def) { Q.offers.push({ id: def.id, def, n: S.night, until: S.night + 8 }); Q.keys = (Q.keys || []).concat(def.key).slice(-12); Q.next = S.night + 4; out.push(['📜', `Nouvelle quête au journal : ${def.title} (${def.giver}).`, 'ev']); }
  }
  questSync();
  if (out.length) report.push(['sec', 'Quêtes'], ...out);
}

/* ---------- le journal ---------- */
const costTags = c => [c.g ? `${c.g} 💰` : '', c.s ? `${c.s} 🪵` : '', ...Object.keys(PANTRY_NAMES).filter(k => c[k]).map(k => `${c[k]} ${PANTRY_NAMES[k]}`)].filter(Boolean).join(' + ');
function rewardTags(R) {
  const t = []; if (R.g) t.push(`${R.g} 💰`); if (R.s) t.push(`${R.s} 🪵`); if (R.hype) t.push(`${R.hype} notoriété`); if (R.mood) t.push('+1 humeur pour tous');
  if (R.art) t.push('un artefact'); if (R.free) Object.keys(R.free).forEach(k => t.push(itemName(k))); if (R.gw) t.push('l’amitié d’un village'); if (R.reveal) t.push('des cartes du Val'); if (R.craftxp) t.push('du savoir pour tes érudits');
  if (R.crit) { const c = critter(R.crit); if (c) t.push(`l’amour de ${c.name}`); }
  return t.map(x => `<span class="tag2">${esc(x)}</span>`).join(' ');
}
const W_NAMES = items => [...new Set(items.map(it => WORKSHOPS[it.w] ? WORKSHOPS[it.w].team.toLowerCase().replace(/^les /, '') : ''))].filter(Boolean).join(', ');
function CMDcheckPay(q) { const st = qStep(q), c = st.cost, P = typeof pantry === 'function' ? pantry() : {}; if ((c.g || 0) > S.gold || (c.s || 0) > S.mat) return 'Pas assez d’or ou de matériaux'; if (Object.keys(PANTRY_NAMES).some(k => (c[k] || 0) > (P[k] || 0))) return 'Il manque des ingrédients au garde-manger'; return null; }
function stepHTML(q, st) {
  if (st.k === 'craft') return `<ul class="qitems">${st.items.map((it, i) => { const p = q.prog['i' + i] || 0, n = Math.min(it.n, Math.floor(p / QUEST_UNIT)), prod = questProd(it.w), W = WORKSHOPS[it.w];
    return `<li>${gi(W ? W.ico : 'build')}<span><b>${esc(cap1(it.name))}</b> ${n}/${it.n} <small>· ${ROOMS[it.w].name}${builtCount(it.w) ? (prod ? ` · ${prod} point${prod > 1 ? 's' : ''} de travail par nuit` : ' · <span class="no">personne n’y travaille</span>') : ' · <span class="no">à bâtir</span>'}</small><i class="fbar"><i style="width:${Math.round(Math.min(1, p / (it.n * QUEST_UNIT)) * 100)}%"></i></i></span></li>`; }).join('')}</ul>
    <p class="hint">Chaque nuit, les créatures postées dans ces pièces y travaillent : 1 point chacune, plus son grade pour les gens de métier (${W_NAMES(st.items)}). ${QUEST_UNIT} points font une pièce.</p>`;
  if (st.k === 'cook') return `<ul class="qitems">${Object.entries(st.dishes).map(([k, n]) => `<li>${gi(RECIPES[k].ico)}<span><b>${esc(RECIPES[k].name)}</b> ${Math.min(n, q.prog[k] || 0)}/${n}</span></li>`).join('')}</ul>${hasKitchen() ? '<div class="btnrow"><button type="button" class="sbtn pri" data-qcook="1">Cuisiner</button></div>' : '<p class="hint no">Il te faut une Cuisine ou une Taverne.</p>'}`;
  if (st.k === 'pay') { const err = CMDcheckPay(q); return `<div class="btnrow"><button type="button" class="sbtn ${err ? '' : 'pri'}" data-qpay="${q.id}" ${err ? 'disabled' : ''}>Livrer : ${costTags(st.cost)}</button></div>${err ? `<p class="hint no">${esc(err)}.</p>` : ''}`; }
  if (st.k === 'choice') return `<div class="choices">${st.opts.map((o, i) => `<button type="button" class="choice" data-qch="${q.id}" data-o="${i}"><span class="emo">${gi('scroll')}</span><b>${esc(o.t)}</b><span>${esc(o.d)}</span></button>`).join('')}</div>`;
  if (st.k === 'raid' || st.k === 'boss') { const T = st.raid || {}, planned = S.raid && S.raid.target === st.target; return `<div class="btnrow"><button type="button" class="sbtn pri" data-qraid="${st.target}">${gi('swords')} ${planned ? 'Équipe prête : voir le raid' : st.k === 'boss' ? 'Préparer l’expédition' : 'Préparer le raid'}</button></div><p class="hint">${esc(T.desc || '')}${planned ? ' Ton équipe part à la fin de la nuit.' : ''}</p>`; }
  if (st.k === 'defend') { const left = Math.max(0, (q.at || S.night) - S.night); return `<p class="${q.armed ? 'no' : 'hint'}">${q.armed ? `${gi('swords')} Ils attaquent à la fin de cette nuit !` : `${gi('hourglass')} Ils arrivent dans ${left} nuit${left > 1 ? 's' : ''}.`}</p><div class="btnrow"><button type="button" class="sbtn" data-qguard="1">${gi('shield')} Placer les gardes</button></div>`; }
  if (st.k === 'wait') { const left = Math.max(0, q.at - S.night); return `<p class="hint">${gi('hourglass')} Encore ${left} nuit${left > 1 ? 's' : ''}.</p>`; }
  return '';
}
function questCardHTML(q) {
  const D = q.def, left = q.until ? q.until - S.night : null;
  return `<article class="qcard${D.main ? ' main' : ''}"><header><span class="qico">${gi(D.ico)}</span><div><h3>${esc(D.title)}${D.main ? ' <span class="tag2 gold">Grande quête</span>' : ''}</h3><small>Donnée par ${esc(D.giver)}${left != null ? ` · <b class="${left <= 3 ? 'no' : ''}">encore ${left} nuit${left > 1 ? 's' : ''}</b>` : ''}</small></div></header>
    <ol class="qsteps">${D.steps.map((st, i) => i < q.i ? `<li class="done"><span class="qn">${gi('check')}</span><div><b>${esc(st.t)}</b>${st.done ? `<p>${esc(st.done)}</p>` : ''}</div></li>`
      : i === q.i ? `<li class="cur"><span class="qn">${i + 1}</span><div><b>${esc(st.t)}</b><p class="qstory">${esc(st.x)}</p>${stepHTML(q, st)}</div></li>`
      : `<li class="todo"><span class="qn">${i + 1}</span><div><b>${gi('lock')} ???</b></div></li>`).join('')}</ol>
    <footer><span>Récompense : ${rewardTags(D.reward)}</span><button type="button" class="sbtn danger small" data-qab="${q.id}">Abandonner</button></footer></article>`;
}
function offerHTML(o) {
  const D = o.def, left = o.until ? o.until - S.night : null, full = qState().cur.length >= QUEST_MAX;
  return `<article class="qcard offer${D.main ? ' main' : ''}"><header><span class="qico">${gi(D.ico)}</span><div><h3>${esc(D.title)}${D.main ? ' <span class="tag2 gold">Grande quête</span>' : ''}</h3><small>${esc(cap1(D.giver))} · ${D.steps.length} étape${D.steps.length > 1 ? 's' : ''}${D.limit ? ` · ${D.limit} nuits pour la finir` : ''}${left != null ? ` · reste au tableau ${left} nuit${left > 1 ? 's' : ''}` : ''}</small></div></header>
    <p class="qstory">${esc(D.intro)}</p><footer><span>Récompense : ${rewardTags(D.reward)}</span><span class="btnrow"><button type="button" class="sbtn" data-qdec="${o.id}">Refuser</button><button type="button" class="sbtn pri" data-qacc="${o.id}" ${full ? 'disabled' : ''}>${full ? `${QUEST_MAX} quêtes en cours` : 'Accepter'}</button></span></footer></article>`;
}
function enviesHTML() {
  const cs = S.creatures.filter(c => questOf(c)), sg = typeof sagaState === 'function' ? sagaState().cur : null, goals = GOALS.filter(g => !S.goals[g.id]).slice(0, 3);
  return `<p class="hint">Les petites envies de tes créatures et du château, à côté des grandes quêtes.</p>
    ${sg && SAGAS[sg.id] ? `<h3>${gi('scroll')} Intrigue en cours</h3><p><b>${esc(SAGAS[sg.id].name)}</b> (${esc((critter(sg.c) || {}).name || '?')}), acte ${sg.i + 1}/${SAGAS[sg.id].ch.length}.</p>` : ''}
    <h3>${gi('spark')} Les envies des créatures (${cs.length})</h3>${cs.length ? `<ul class="qenv">${cs.map(c => { const q = questOf(c); return `<li data-qcrit="${c.id}"><b>${esc(c.name)}</b> : ${esc(q.title || '')}${q.st === 'ready' ? ' · <span class="ok">prête à partir à l’aventure</span>' : q.st === 'away' ? ' · en route' : ''}</li>`; }).join('')}</ul>` : '<p class="hint">Personne n’a d’envie pour l’instant.</p>'}
    ${goals.length ? `<h3>${gi('castle')} Les envies du château</h3><ul class="qenv">${goals.map(g => `<li>${esc(g.text)}</li>`).join('')}</ul>` : ''}
    <div class="btnrow"><button type="button" class="sbtn" data-qmis="1">Voir toutes les envies</button></div>`;
}
function doneHTML() {
  const d = qState().done.slice().reverse();
  return d.length ? `<ul class="qdone">${d.map(x => `<li class="${x.ok ? '' : 'off'}">${gi(x.ok ? 'trophy' : 'cross')}<div><b>${esc(x.title || '?')}</b> <small>nuit ${x.n}${x.ok ? '' : ' · échouée'}</small>${x.ok && x.outro ? `<p>${esc(x.outro)}</p>` : ''}</div></li>`).join('')}</ul>` : '<p class="hint">Aucune quête terminée pour l’instant. Les histoires que tu vivras s’écriront ici.</p>';
}
function openQuests(tab) {
  if (typeof UI !== 'undefined' && UI.busy) return;
  const Q = qState(); questSync();
  tab = tab || (Q.offers.some(o => !o.seen) ? 'tableau' : Q.cur.length ? 'cours' : Q.offers.length ? 'tableau' : 'envies');
  if (tab === 'tableau') Q.offers.forEach(o => { o.seen = true; });
  const tabs = [['cours', `En cours (${Q.cur.length}/${QUEST_MAX})`], ['tableau', `Tableau (${Q.offers.length})`], ['envies', 'Envies'], ['finies', `Accomplies (${Q.done.filter(d => d.ok).length})`]];
  const body = tab === 'cours' ? (Q.cur.length ? Q.cur.map(questCardHTML).join('') : `<p class="hint">Aucune quête en cours. ${Q.offers.length ? 'Va voir le tableau !' : 'De nouvelles quêtes arrivent de temps en temps, avec les visiteurs et les villages.'}</p>`)
    : tab === 'tableau' ? (Q.offers.length ? Q.offers.map(offerHTML).join('') : '<p class="hint">Le tableau est vide. Des quêtes y arrivent de temps en temps, toujours différentes : une commande, une bête à chasser, une bande qui te défie, un banquet, un convoi, un petit dilemme…</p>')
    : tab === 'envies' ? enviesHTML() : doneHTML();
  const m = openModal(`<h2>${gi('scroll')} Le journal des quêtes</h2><div class="vtabs" role="tablist">${tabs.map(([k, t]) => `<button type="button" role="tab" data-qtab="${k}" aria-selected="${k === tab}">${t}</button>`).join('')}</div><div class="qjournal">${body}</div>`, { wide: true, label: 'Quêtes' });
  m.addEventListener('click', e => {
    const b = e.target.closest('button, li[data-qcrit]'); if (!b || b.disabled) return; const d = b.dataset;
    const act = (cmd, args, again = tab) => { if (run(cmd, args)) { sfx('chime'); afterChange(); openQuests(again); } };
    if (d.qtab) { sfx('tick'); openQuests(d.qtab); }
    else if (d.qacc) act('questAccept', { id: d.qacc }, 'cours');
    else if (d.qdec) act('questDecline', { id: d.qdec });
    else if (d.qpay) act('questPay', { id: d.qpay });
    else if (d.qch) act('questChoose', { id: d.qch, o: +d.o });
    else if (d.qab) confirmBtn(b, 'Sûr ? Elle sera perdue', () => act('questAbandon', { id: d.qab }));
    else if (d.qraid) { closeModal(true); openRaid(d.qraid); }
    else if (d.qcook) cookModal();
    else if (d.qguard) { closeModal(true); guardMode(true); }
    else if (d.qmis) openMissions();
    else if (d.qcrit) openCreature(d.qcrit);
  });
}
// ce qui demande ton attention : une nouvelle quête au tableau, un choix, une livraison, une bande qui arrive
function questNotifs(add) {
  const Q = qState(); let n = 0;
  const fresh = Q.offers.filter(o => !o.seen); if (fresh.length) { n += fresh.length; add('qoff', '📜', fresh.length > 1 ? `${fresh.length} nouvelles quêtes au journal` : `Nouvelle quête : ${fresh[0].def.title}`, () => openQuests('tableau'), 3); }
  Q.cur.forEach(q => {
    const st = qStep(q); if (!st) return; const T = q.def.title;
    if (st.k === 'choice' || (st.k === 'pay' && !CMDcheckPay(q))) { n++; add('qact' + q.id, '📜', `${T} : à toi de jouer`, () => openQuests('cours'), 3); }
    else if (st.k === 'defend' && q.at - S.night <= 1) { n++; add('qdef' + q.id, '⚔️', q.armed ? `${cap1(st.band.name)} ${vbQ(st.band.name, 'attaquent', 'attaque')} cette nuit` : `${cap1(st.band.name)} ${vbQ(st.band.name, 'arrivent', 'arrive')} demain`, () => openQuests('cours'), 5, 'bad'); }
    else if ((st.k === 'raid' || st.k === 'boss') && !(S.raid && S.raid.target === st.target)) { n++; add('qraid' + q.id, '⚔️', `${T} : ${st.k === 'boss' ? 'l’expédition t’attend' : 'le raid t’attend'}`, () => openQuests('cours'), 2); }
  });
  const b = typeof document !== 'undefined' && document.getElementById('btnQuests');
  if (b && b.querySelector) { let s = b.querySelector('.qbadge'); if (n && !s) { s = document.createElement('span'); s.className = 'qbadge'; b.appendChild(s); } if (s) { if (n) s.textContent = n; else s.remove(); } }
}
const sagaNotifsQuest = sagaNotifs;
sagaNotifs = function (add) { sagaNotifsQuest(add); try { questNotifs(add); } catch (e) { console.error(e); } };
// le parchemin de la colonne de gauche ouvre maintenant le journal
const bindSoulsQuest = bindSouls;
bindSouls = function () {
  bindSoulsQuest();
  try { const b = $('#btnQuests'), nb = b.cloneNode(true); nb.title = 'Le journal des quêtes'; nb.setAttribute('aria-label', 'Le journal des quêtes'); b.replaceWith(nb); nb.addEventListener('click', () => openQuests()); questSync(); } catch (e) { console.error(e); }
};
// une partie chargée : les cibles de raid des quêtes reviennent
const upgradeStateQuest = upgradeState;
upgradeState = function (s) { const r = upgradeStateQuest(s); setTimeout(questSync, 0); return r; };

TUTO_STEPS.push({ id: 'quetes', when: () => !!(S.quests && (S.quests.offers.length || S.quests.cur.length)), t: 'Le journal des quêtes', x: 'Une quête t’attend ! Touche le parchemin (colonne de gauche) pour ouvrir le journal. Chaque quête raconte une petite histoire, étape par étape, et elles changent à chaque partie : des choses à fabriquer (poste des créatures dans la bonne pièce), des plats à cuisiner, des livraisons, des choix, des bandes à repousser, des chasses… et, plus tard, une grande quête et son boss unique.', wiki: 'quetes' });

WIKI.quetes = { cat: 'bases', t: 'Les quêtes', x: () => `<p>Le <b>journal des quêtes</b> (le parchemin, dans la colonne de gauche) rassemble les grandes histoires du château. Les quêtes sont <b>tirées au sort à chaque partie</b> : des quêtes arrivent au <b>tableau</b> de temps en temps (${QUEST_MAX} en cours au plus), avec leurs donneurs, leurs lieux, leurs objets et leurs bêtes. Une quête se déroule étape par étape ; les étapes suivantes restent cachées jusqu’au bout.</p>
  <ul><li><b>Fabriquer une liste</b> : chaque nuit, les créatures postées dans la bonne pièce (Forge, Atelier, Bibliothèque, Laboratoire, Cuisine, Taverne) y travaillent : 1 point chacune, plus son grade pour les gens de ce {c:artisanat|métier}. ${QUEST_UNIT} points font une pièce.</li>
  <li><b>Cuisiner</b> des plats, <b>livrer</b> de l’or, des matériaux ou des ingrédients du garde-manger, <b>choisir</b> la suite de l’histoire, <b>attendre</b> qu’un convoi arrive.</li>
  <li><b>Missions de combat</b> : une chasse en raid (la cible n’apparaît dans le Raid que pendant l’étape), ou une bande nommée qui annonce son arrivée et attaque ton château : repousse-la (sinon, elle revient 4 nuits plus tard).</li>
  <li><b>La grande quête</b> : une par partie, tirée parmi cinq (${Object.values(QBOSSES).map(B => esc(B.name)).join(', ')}). Elle finit en expédition contre son boss unique, le combat le plus dur du Val ; l’équipe peut y retourner tant que la quête dure.</li></ul>
  <p>Les quêtes secondaires ont un délai ; la grande quête, non. Chaque quête accomplie rapporte de l’or, de la notoriété, parfois un artefact, et des places de {c:renommee|renommée}.</p>
  <p>Les <b>envies</b> des créatures et du château restent là aussi, dans l’onglet Envies du journal.</p>` };
