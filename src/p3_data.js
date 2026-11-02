/* =========================================================
   COZY STICKERS DUNGEON — données du château
   Règles d'aménagement inspirées de Wicked Ones :
   thèmes, pièces construites via des horloges de projet,
   verrous / pièges / ruses sur le chemin des aventuriers,
   cycle Rôder → Calamité → Raid → Contrecoup.
   ========================================================= */
// taille du château : 12×12 au départ, agrandie de 2 à chaque extension des remparts (voir syncGeom)
let W = 12, H = 12;
const GATE = { x: 6, y: 11 };
// étages : un nouvel étage par palier, vers le haut (les Hauteurs, les Cimes) ou vers le bas (les Caves, les Profondeurs)
const DEPTH_MAX = 2, HEIGHT_MAX = 2;
const FLOOR_NAMES = { 2: 'Les Cimes', 1: 'Les Hauteurs', 0: 'Rez-de-chaussée', '-1': 'Les Caves', '-2': 'Les Profondeurs' };
const FLOOR_SHORT = { 2: 'Cimes', 1: 'Hauteurs', 0: 'Rez', '-1': 'Caves', '-2': 'Profondeurs' };
const HEART = { x: 5, y: 1, w: 2, h: 2 };
let CAL_MAX = 8, MENACE_MAX = 6;
const CONSTS = { START_GOLD: 10, START_MAT: 8, WORK: 2 };

// stats : gold 💰, mat 🪵, hype 🔥, food repas, beds lits, amb ambiance, cal calamité en moins,
// guard garde, harass harcèlement, dice dés de raid, cells places de prison
const ROOMS = {
  couloir:  { name: 'Couloir', size: [1,1], cost: { s: 1 }, instant: true, floor: 'flag', color: '#c9bfae',
              desc: 'Relie les pièces entre elles. Les pièges se posent dans les couloirs.' },
  porche:   { name: 'Porche', size: [1,1], fixed: true, floor: 'flag', color: '#c9bfae',
              desc: 'L’entrée du château. Les nouvelles recrues passent par ici… les aventuriers aussi.' },
  coeur:    { name: 'Cœur du château', size: [2,2], fixed: true, floor: 'magic', color: '#7b52b8', gold: 2, beds: 2, food: 3,
              desc: 'Le cristal qui fait battre ton château. Si des héros l’atteignent, ils pillent ton or. Les créatures sans poste le défendent.' },
  dortoir:  { name: 'Dortoir', size: [3,2], cost: { g: 3, s: 3 }, clock: 4, floor: 'straw', color: '#b9a4e6',
              furn: ['paillasse','litsup','baldaquin','coffre'], attracts: ['gobelin'], desc: 'Pose des lits pour loger tes créatures. Attire les Gobelins.' },
  cuisine:  { name: 'Cuisine', size: [2,2], cost: { g: 3, s: 2 }, clock: 4, floor: 'checker', color: '#f2c48d',
              furn: ['chaudron','tonneau','jambons'], syn: { adj: 'taverne', food: 2 }, attracts: ['troll'],
              desc: 'Nourrit ton petit monde. +2 repas si elle touche la Taverne. Attire les Trolls (Palier 1).' },
  potager:  { name: 'Potager', size: [2,2], cost: { g: 2, s: 2 }, clock: 4, floor: 'garden', open: true, color: '#9ccc7c',
              furn: ['choux','champis','epouvantail'], attracts: ['crapaud'], desc: 'Un carré de verdure à ciel ouvert. Attire les Crapauds.' },
  taverne:  { name: 'Taverne', size: [3,3], cost: { g: 5, s: 4 }, clock: 6, floor: 'wood', color: '#e0a96d', amb: 1,
              furn: ['biere','tablee','scene'], attracts: ['menestrel'], desc: 'Le cœur social du château. +1 Ambiance. Attire les Ménestrels.' },
  atelier:  { name: 'Atelier', size: [2,2], cost: { g: 4, s: 4 }, clock: 6, floor: 'wood', color: '#d9b38c',
              furn: ['etabli','caisse'], attracts: ['kobold'], desc: 'Débloque les pièges mécaniques. Attire les Kobolds.' },
  tour:     { name: 'Tour de guet', size: [2,2], cost: { g: 3, s: 3 }, clock: 4, edge: true, floor: 'flag', color: '#a8c6e8', harass: 1,
              furn: ['longuevue','perchoir'], attracts: ['gargouille'], desc: 'Doit toucher les remparts. Les héros arrivent déjà fatigués. Attire les Gargouilles.' },
  bibli:    { name: 'Bibliothèque', tier: 1, size: [3,2], cost: { g: 6, s: 4 }, clock: 8, floor: 'carpet', color: '#c27a5a',
              furn: ['etagere','pupitre','fauteuil'], attracts: ['fantome'], desc: 'Grimoires poussiéreux et fauteuils qui grincent. Attire les Fantômes.' },
  labo:     { name: 'Laboratoire', tier: 1, size: [2,2], cost: { g: 5, s: 3 }, clock: 6, floor: 'checker', color: '#8fd6c6',
              furn: ['alambic','marmite','fioles'], attracts: ['sorciere'], desc: 'Potions calmantes et fumées suspectes. Attire les Sorcières.' },
  caveau:   { name: 'Caveau', tier: 1, size: [2,2], cost: { g: 5, s: 5 }, clock: 8, far: 5, floor: 'flag', color: '#a99fc0',
              furn: ['cercueil','ossuaire'], attracts: ['squelette'], desc: 'Au calme, loin du porche (5 pas minimum). Attire les Squelettes.' },
  forge:    { name: 'Forge', tier: 1, size: [2,2], cost: { g: 6, s: 6 }, clock: 8, floor: 'flag', color: '#f2a477',
              furn: ['enclume','fourneau','ratelier'], syn: { adj: 'atelier', gold: 2 }, attracts: ['orque'],
              desc: '+2 💰 si elle touche l’Atelier. Attire les Orques.' },
  oubliettes: { name: 'Oubliettes', tier: 1, size: [2,2], cost: { g: 4, s: 4 }, clock: 6, far: 4, floor: 'flag', color: '#9aa1ad',
              furn: ['cage','chaines'], desc: 'Les héros repoussés y finissent. Chaque prisonnier rapporte 4 💰 de rançon à l’aube.' },
  tresor:   { name: 'Salle au trésor', tier: 2, size: [2,2], cost: { g: 8, s: 6 }, clock: 8, far: 7, floor: 'checker', color: '#f5d76e',
              furn: ['tasdor','coffreor'], attracts: ['dragonnet','mimique'], desc: 'Tout au fond (7 pas du porche). Attire Dragonnets et Mimiques.' },
  salon:    { name: 'Salon pourpre', tier: 2, size: [3,2], cost: { g: 6, s: 4 }, clock: 6, floor: 'carpet', color: '#d9779a', amb: 1,
              furn: ['canape','orgue','candelabre'], attracts: ['vampire'], desc: 'Velours, chandelles et orgue lugubre. Attire les Vampires.' },
  trone:    { name: 'Salle du trône', tier: 2, unique: true, size: [3,3], cost: { g: 12, s: 10 }, clock: 8, far: 6, floor: 'carpet', color: '#c8413a', hype: 1,
              furn: ['trone','banniere'], desc: 'Ton siège de Maître. Loin du porche (6 pas). Requise pour le Palier 3.' },
  // pièces de thème : livrées meublées
  fonderie: { name: 'Fonderie infernale', theme: 'forge', unique: true, size: [2,2], cost: { g: 6, s: 5 }, clock: 8, floor: 'flag', color: '#ff8f5e',
              mat: 2, gold: 1, preset: ['fourneau','enclume'], desc: 'Pièce de thème, livrée meublée. +2 🪵 et +1 💰 par nuit.' },
  chapelle: { name: 'Chapelle des murmures', theme: 'temple', unique: true, size: [2,2], cost: { g: 4, s: 3 }, clock: 6, floor: 'checker', color: '#c7b8f0',
              cal: 1, hype: 1, preset: ['candelabre','pupitre'], desc: 'Pièce de thème, livrée meublée. −1 Calamité et +1 🔥 par nuit.' },
  planque:  { name: 'Planque', theme: 'repaire', unique: true, size: [2,2], cost: { g: 4, s: 3 }, clock: 6, floor: 'wood', color: '#c9cf86',
              dice: 1, mat: 1, preset: ['caisse','coffre'], desc: 'Pièce de thème, livrée meublée. +1 dé aux raids, +1 🪵 par nuit.' },
  garde:    { name: 'Corps de garde', theme: 'bastion', unique: true, size: [2,2], cost: { g: 4, s: 4 }, clock: 6, floor: 'flag', color: '#b5c4d6',
              beds: 2, guard: 3, preset: ['ratelier','paillasse'], desc: 'Pièce de thème, livrée meublée. 2 lits, −3 courage aux héros qui la traversent.' },
  observatoire: { name: 'Observatoire', theme: 'enclave', unique: true, size: [2,2], cost: { g: 6, s: 4 }, clock: 8, floor: 'magic', color: '#8f9fe8',
              amb: 2, hype: 1, dice: 1, preset: ['longuevue','cristal'], desc: 'Pièce de thème, livrée meublée. +2 Ambiance, +1 🔥, +1 dé aux raids.' },
  // sous le château : un escalier ouvre l'étage du dessous (les héros n'y descendent jamais)
  escalier: { name: 'Escalier des caves', size: [1,1], cost: { g: 4, s: 6 }, clock: 4, floor: 'flag', color: '#8a8f9c', preset: ['colimacon'], stairs: -1,
              desc: 'Creuse un étage sous le château : les Caves, puis les Profondeurs. Un nouvel étage par palier, vers le haut ou vers le bas : à toi de choisir. Les héros ne quittent jamais le rez-de-chaussée.' },
  montee:   { name: 'Escalier de la tour', size: [1,1], cost: { g: 5, s: 5 }, clock: 4, floor: 'wood', color: '#b08a5a', preset: ['montee'], stairs: 1,
              desc: 'Monte un étage au-dessus du château : les Hauteurs, puis les Cimes. Un nouvel étage par palier, vers le haut ou vers le bas : à toi de choisir.' },
  jardin:   { name: 'Jardin suspendu', high: 1, size: [3,2], cost: { g: 5, s: 4 }, clock: 6, floor: 'garden', open: true, color: '#8fd47a', food: 1, amb: 1,
              furn: ['ruche','tonnelle','fontaine'], attracts: ['fee'], desc: 'En hauteur seulement. Des fleurs au-dessus des toits : +1 repas, +1 Ambiance. Attire la Fée grincheuse, une créature rare.' },
  voliere:  { name: 'Volière', high: 1, size: [2,2], cost: { g: 4, s: 4 }, clock: 6, floor: 'straw', color: '#d8c08a',
              furn: ['nid','mangeoire'], attracts: ['harpie','gargouille'], desc: 'En hauteur seulement. Le royaume des créatures ailées. Attire la Harpie mélomane (rare) et les Gargouilles.' },
  belvedere: { name: 'Belvédère', high: 2, size: [2,2], cost: { g: 6, s: 5 }, clock: 8, floor: 'flag', open: true, color: '#a8c6e8', harass: 2, sight: 2,
              furn: ['girouette','lanterne'], desc: 'Dans les Cimes seulement. On voit à des lieues : la carte se dévoile plus loin autour du château, et les héros reçoivent des cailloux dès l’approche (−2 courage).' },
  mine:     { name: 'Mine', deep: 1, size: [2,2], cost: { g: 4, s: 4 }, clock: 6, floor: 'rock', color: '#a08a6a', mat: 2,
              furn: ['wagonnet','filon','etai'], attracts: ['golem'], desc: 'Sous terre seulement. +2 🪵 par nuit, plus avec ses filons. Attire le Golem de mousse, une créature rare.' },
  reliquaire: { name: 'Reliquaire', deep: 1, size: [3,2], cost: { g: 8, s: 5 }, clock: 8, floor: 'carpet', color: '#c9a2e8', amb: 1,
              furn: ['vitrine','socle'], attracts: ['liche'], desc: 'Sous terre seulement. Les artefacts exposés ici rayonnent moitié plus. Attire la Liche frileuse, une créature rare.' },
  lac:      { name: 'Lac souterrain', deep: 2, size: [3,3], cost: { g: 6, s: 6 }, clock: 8, floor: 'water', color: '#5aa0c8', amb: 2, cal: 1,
              furn: ['nenuphar','barque'], attracts: ['crapaud'], desc: 'Dans les Profondeurs seulement. Une eau noire et paisible : −1 Calamité, +2 Ambiance, du poisson aveugle au menu. Les Crapauds adorent.' },
};
const ROOM_ORDER = ['couloir','dortoir','cuisine','potager','taverne','atelier','tour','fonderie','chapelle','planque','garde','observatoire','bibli','labo','caveau','forge','oubliettes','tresor','salon','trone','escalier','mine','reliquaire','lac','montee','jardin','voliere','belvedere'];

// meubles (room = pièce autorisée) et déco (room: 'any')
const FURN = {
  paillasse:  { name: 'Paillasse', room: 'dortoir', cost: { g: 1 }, beds: 1 },
  litsup:     { name: 'Lits superposés', room: 'dortoir', cost: { g: 2, s: 1 }, beds: 2 },
  baldaquin:  { name: 'Lit à baldaquin', room: 'dortoir', tier: 1, cost: { g: 4 }, beds: 2, amb: 1 },
  coffre:     { name: 'Coffre à chaussettes', room: 'dortoir', cost: { g: 1 }, amb: 1 },
  chaudron:   { name: 'Chaudron à ragoût', room: 'cuisine', cost: { g: 2, s: 1 }, food: 3 },
  tonneau:    { name: 'Tonneau de navets', room: 'cuisine', cost: { g: 1 }, food: 1 },
  jambons:    { name: 'Jambons pendus', room: 'cuisine', cost: { g: 2 }, food: 2, amb: 1 },
  choux:      { name: 'Carré de choux', room: 'potager', cost: { g: 1 }, food: 2 },
  champis:    { name: 'Champignons douteux', room: 'potager', cost: { g: 1 }, food: 2 },
  epouvantail:{ name: 'Épouvantail', room: 'potager', cost: { g: 1, s: 1 }, guard: 1, amb: 1 },
  biere:      { name: 'Tonneau de bière', room: 'taverne', cost: { g: 2, s: 1 }, gold: 1, amb: 1 },
  tablee:     { name: 'Grande tablée', room: 'taverne', cost: { g: 2, s: 2 }, food: 1, amb: 1 },
  scene:      { name: 'Estrade du barde', room: 'taverne', cost: { g: 3, s: 2 }, amb: 2, hype: 1 },
  etabli:     { name: 'Établi', room: 'atelier', cost: { g: 1, s: 2 }, mat: 1 },
  caisse:     { name: 'Caisse à outils', room: 'atelier', cost: { g: 1 }, mat: 1 },
  longuevue:  { name: 'Longue-vue', room: 'tour', cost: { g: 2 }, harass: 2 },
  perchoir:   { name: 'Perchoir de pierre', room: 'tour', cost: { g: 1, s: 1 }, harass: 1, amb: 1 },
  etagere:    { name: 'Étagère à grimoires', room: 'bibli', cost: { g: 2 }, hype: 1 },
  pupitre:    { name: 'Pupitre', room: 'bibli', cost: { g: 2 }, hype: 1, amb: 1 },
  fauteuil:   { name: 'Fauteuil moelleux', room: 'bibli', cost: { g: 2 }, amb: 2 },
  alambic:    { name: 'Alambic', room: 'labo', cost: { g: 3 }, cal: 1 },
  marmite:    { name: 'Marmite à potions', room: 'labo', cost: { g: 2, s: 1 }, cal: 1 },
  fioles:     { name: 'Étagère à fioles', room: 'labo', cost: { g: 2 }, dice: 1 },
  cercueil:   { name: 'Cercueil douillet', room: 'caveau', cost: { g: 1, s: 1 }, beds: 1 },
  ossuaire:   { name: 'Pile d’os', room: 'caveau', cost: { g: 1 }, amb: 1 },
  enclume:    { name: 'Enclume', room: 'forge', cost: { g: 1, s: 2 }, mat: 1 },
  fourneau:   { name: 'Fourneau', room: 'forge', cost: { g: 2, s: 2 }, gold: 1 },
  ratelier:   { name: 'Râtelier d’armes', room: 'forge', cost: { g: 2, s: 1 }, dice: 1, guard: 1 },
  cage:       { name: 'Cage', room: 'oubliettes', cost: { g: 2, s: 2 }, cells: 1 },
  chaines:    { name: 'Chaînes', room: 'oubliettes', cost: { g: 1 }, guard: 1 },
  tasdor:     { name: 'Tas d’or', room: 'tresor', cost: { g: 5 }, gold: 2 },
  coffreor:   { name: 'Coffre-fort', room: 'tresor', cost: { g: 3, s: 1 }, gold: 1 },
  canape:     { name: 'Canapé de velours', room: 'salon', cost: { g: 3 }, amb: 2, beds: 1 },
  orgue:      { name: 'Orgue lugubre', room: 'salon', cost: { g: 4, s: 2 }, amb: 2, hype: 1 },
  candelabre: { name: 'Candélabre', room: 'salon', cost: { g: 1 }, amb: 1 },
  trone:      { name: 'Trône', room: 'trone', unique: true, cost: { g: 6, s: 4 }, hype: 2 },
  banniere:   { name: 'Bannière', room: 'trone', cost: { g: 1 }, amb: 1 },
  // déco, partout
  torche:     { name: 'Torche', room: 'any', cost: { g: 1 }, amb: 1 },
  tapis:      { name: 'Tapis', room: 'any', cost: { g: 1 }, amb: 1, flat: true },
  plante:     { name: 'Plante en pot', room: 'any', cost: { g: 1 }, amb: 1 },
  os:         { name: 'Os à ronger', room: 'any', cost: { g: 1 }, amb: 1, flat: true },
  toile:      { name: 'Toile d’araignée', room: 'any', cost: { g: 1 }, amb: 1 },
  armure:     { name: 'Armure décorative', room: 'any', cost: { g: 2 }, amb: 1, guard: 1 },
  citrouille: { name: 'Citrouille', room: 'any', cost: { g: 2 }, amb: 2 },
  theiere:    { name: 'Service à thé', room: 'any', cost: { g: 2 }, amb: 2 },
  tableau:    { name: 'Portrait d’ancêtre', room: 'any', cost: { g: 3 }, amb: 2 },
  cristal:    { name: 'Cristal', room: 'any', cost: { g: 3 }, amb: 3 },
  // sous terre
  colimacon:  { name: 'Escalier en colimaçon', room: 'escalier', hidden: true, cost: {} },
  wagonnet:   { name: 'Wagonnet', room: 'mine', cost: { g: 2, s: 1 }, mat: 1 },
  filon:      { name: 'Filon doré', room: 'mine', cost: { g: 3 }, gold: 1, mat: 1 },
  etai:       { name: 'Étais et lanterne', room: 'mine', cost: { g: 1, s: 2 }, guard: 1, amb: 1 },
  vitrine:    { name: 'Vitrine', room: 'reliquaire', cost: { g: 3 }, amb: 1, hype: 1 },
  socle:      { name: 'Socle de velours', room: 'reliquaire', cost: { g: 2 }, amb: 1 },
  nenuphar:   { name: 'Nénuphars lumineux', room: 'lac', cost: { g: 2 }, amb: 2 },
  barque:     { name: 'Barque', room: 'lac', cost: { g: 2, s: 2 }, food: 2 },
  // en hauteur
  montee:     { name: 'Escalier montant', room: 'montee', hidden: true, cost: {} },
  ruche:      { name: 'Ruche', room: 'jardin', cost: { g: 2 }, food: 2 },
  tonnelle:   { name: 'Tonnelle fleurie', room: 'jardin', cost: { g: 2, s: 1 }, amb: 2 },
  fontaine:   { name: 'Fontaine', room: 'jardin', cost: { g: 3, s: 1 }, amb: 1, cal: 1 },
  nid:        { name: 'Nid géant', room: 'voliere', cost: { g: 1, s: 1 }, beds: 2 },
  mangeoire:  { name: 'Mangeoire', room: 'voliere', cost: { g: 1 }, food: 1, amb: 1 },
  girouette:  { name: 'Girouette', room: 'belvedere', cost: { g: 2, s: 1 }, harass: 1 },
  lanterne:   { name: 'Lanterne de guet', room: 'belvedere', cost: { g: 2 }, amb: 1, sight: 1 },
  // artefacts : trouvés, pillés, achetés… jamais en vente dans la barre. Ils font rayonner le château.
  couronne:     { name: 'Couronne du Roi Gobelin', room: 'any', artefact: true, glow: 8, hype: 1, repSp: 'gobelin', desc: 'Un peu trop grande, un peu cabossée. Les gobelins se prosternent devant elle.' },
  epeefaux:     { name: 'Épée qui chante faux', room: 'any', artefact: true, glow: 6, dice: 1, desc: 'Elle fredonne en combat. Faux. Les ennemis en perdent leurs moyens.' },
  grimoire:     { name: 'Grimoire des recettes interdites', room: 'any', artefact: true, glow: 6, food: 2, desc: 'Ragoût de mandragore, tarte aux araignées : interdit, mais nourrissant.' },
  oeufbasilic:  { name: 'Œuf de basilic', room: 'any', artefact: true, glow: 7, guard: 2, desc: 'Personne n’ose s’en approcher. On ne sait pas s’il va éclore.' },
  miroir:       { name: 'Miroir qui ment', room: 'any', artefact: true, glow: 5, amb: 2, desc: 'Il dit à tout le monde qu’il est magnifique. Le moral remonte.' },
  cranecristal: { name: 'Crâne de cristal', room: 'any', artefact: true, glow: 10, cal: 1, desc: 'Il chuchote des choses apaisantes, en ancien elfique.' },
  heaume:       { name: 'Heaume du chevalier Tamponné', room: 'any', artefact: true, glow: 5, guard: 2, desc: 'Cabossé par trente ans de portes mal ouvertes.' },
  potdechambre: { name: 'Le Saint Pot de Chambre', room: 'any', artefact: true, glow: 9, amb: 1, hype: 1, desc: 'Relique sacrée d’un roi oublié. Les pèlerins en parlent à voix basse.' },
  dentdragon:   { name: 'Dent de dragon', room: 'any', artefact: true, glow: 8, guard: 1, repSp: 'dragonnet', desc: 'Les dragonnets la trouvent rassurante. Les héros, beaucoup moins.' },
  baton:        { name: 'Bâton de l’archimage distrait', room: 'any', artefact: true, glow: 7, cal: 1, amb: 1, desc: 'Son propriétaire le cherche encore. Il a oublié où il l’a posé.' },
  harpe:        { name: 'Harpe ensorcelée', room: 'any', artefact: true, glow: 6, amb: 2, repSp: 'fee', desc: 'Elle joue toute seule des berceuses. Les fées adorent.' },
  sablier:      { name: 'Sablier à l’envers', room: 'any', artefact: true, glow: 7, gold: 1, desc: 'Le sable remonte. Le temps, c’est de l’argent : il en rapporte.' },
};
const FURN_ORDER = Object.keys(FURN).filter(k => FURN[k].room !== 'any' && !FURN[k].hidden);
const DECOR_ORDER = Object.keys(FURN).filter(k => FURN[k].room === 'any' && !FURN[k].artefact);
const ARTEFACTS = Object.keys(FURN).filter(k => FURN[k].artefact);

// défenses posées dans les couloirs
const DEFS = {
  porte:   { name: 'Porte cloutée', kind: 'verrou', str: 2, cost: { g: 1, s: 2 }, desc: 'Verrou : les héros perdent 2 courage à l’enfoncer.' },
  banane:  { name: 'Peau de banane géante', kind: 'piège', str: 1, sticky: true, cost: { g: 1, s: 1 }, desc: 'Piège : −1 courage, et la rencontre suivante fait +1 (ils sont encore par terre).' },
  trappe:  { name: 'Trappe à pics', kind: 'piège', str: 3, needs: 'atelier', cost: { g: 2, s: 2 }, desc: 'Piège : −3 courage. Nécessite un Atelier.' },
  sphinx:  { name: 'Sphinx empaillé', kind: 'verrou', str: 2, lost: 0.3, tier: 1, cost: { g: 3, s: 1 }, desc: 'Verrou à énigme : −2 courage, et 30 % de chances que les héros sèchent et rentrent chez eux.' },
  hache:   { name: 'Hache pendulaire', kind: 'piège', str: 4, needs: 'atelier', tier: 1, cost: { g: 3, s: 3 }, desc: 'Piège : −4 courage. Nécessite un Atelier.' },
  leurre:  { name: 'Faux trésor', kind: 'ruse', str: 1, lost: 0.4, needs: 'bibli', cost: { g: 2, s: 1 }, desc: 'Ruse : −1 courage, 40 % de chances que les héros repartent avec le faux butin. Nécessite une Bibliothèque.' },
  cloche:  { name: 'Cloche d’alarme', kind: 'ruse', str: 0, alarm: true, unique: true, cost: { g: 2, s: 1 }, desc: 'Ruse : quand les héros la franchissent, chaque créature libre gagne +1 en garde au Cœur.' },
};
const DEF_ORDER = Object.keys(DEFS);

const THEMES = {
  forge:   { name: 'Château-forge', emo: '🔥', room: 'fonderie', desc: 'Les pièces coûtent 1 🪵 de moins.' },
  temple:  { name: 'Abbaye maudite', emo: '🕯️', room: 'chapelle', desc: 'Chaque nuit, la Calamité monte d’un cran de moins.' },
  repaire: { name: 'Repaire de brigands', emo: '🗝️', room: 'planque', desc: '+1 dé à tous les raids.' },
  bastion: { name: 'Forteresse têtue', emo: '🛡️', room: 'garde', desc: 'Tes verrous gagnent +1 en force.' },
  enclave: { name: 'Tour arcanique', emo: '🔮', room: 'observatoire', desc: '+3 Ambiance, et les créatures viennent plus volontiers.' },
};

// tags de raid : pillage, ruse, combat, magie
const SPECIES = {
  diablotin: { name: 'Diablotin', from: 'coeur', build: 1, guard: 1, dice: 0, likes: 'torche', skill: 'Petites mains', sd: '+1 travaux par nuit sur les chantiers. Trop petit pour les raids.',
    lines: ['On bosse, chef ! Enfin, on fait semblant très fort.', 'J’ai repeint le couloir. En rouge. C’était pas de la peinture.', 'Une torche de plus et je chante toute la nuit.'] },
  gobelin:   { name: 'Gobelin', from: 'dortoir', mat: 1, guard: 1, dice: 1, tag: 'pillage', likes: 'os', rival: 'kobold', skill: 'Chapardeur', sd: '+1 🪵 par nuit (il « trouve » des trucs). +1 dé pour piller.',
    lines: ['C’est pas du vol, c’est de la redistribution.', 'Le dortoir sent les pieds. C’est parfait.', 'Un os à ronger et je signe pour dix ans.'] },
  kobold:    { name: 'Kobold', from: 'atelier', trap: 1, guard: 1, dice: 1, tag: 'ruse', likes: 'caisse', rival: 'gobelin', skill: 'Piégeur', sd: 'Tes pièges gagnent +1 en force (jusqu’à +2).',
    lines: ['Tu marches là, et… clac ! Hé hé.', 'Les gobelins ont encore piqué mes ressorts.', 'Une caisse à outils, c’est mieux qu’un anniversaire.'] },
  crapaud:   { name: 'Crapaud', from: 'potager', cal: 1, amb: 1, guard: 1, dice: 1, tag: 'magie', likes: 'plante', skill: 'Chant des marais', sd: '−1 Calamité et +1 Ambiance par nuit.',
    lines: ['Croâ… respire… tout va bien…', 'Les choux poussent mieux quand je chante faux.', 'Une plante verte, c’est la base du bien-être.'] },
  gargouille:{ name: 'Gargouille', from: 'tour', scout: true, guard: 2, dice: 2, tag: 'ruse', likes: 'perchoir', skill: 'Guetteuse', sd: 'Révèle la force des prochains héros. 2 dés en raid.',
    lines: ['Je vois des torches au village. Encore des « héros ».', 'Je fais la statue depuis trois siècles. Je suis très douée.', 'Un perchoir en pierre ? On se comprend.'] },
  menestrel: { name: 'Ménestrel', from: 'taverne', amb: 1, hype: 1, guard: 0, dice: 1, tag: 'ruse', likes: 'biere', skill: 'Chansons paillardes', sd: '+1 🔥 et +1 Ambiance par nuit. Ses chansons font le tour du village.',
    lines: ['J’ai écrit une ballade sur toi, Maître. Elle rime avec « crétin », mais c’est affectueux.', 'Trois accords et une bière, il ne m’en faut pas plus.', 'Qui veut entendre la complainte du nain qui avait perdu sa hache ?'] },
  troll:     { name: 'Troll', from: 'cuisine', tier: 1, eats: 2, guard: 4, dice: 2, tag: 'combat', likes: 'citrouille', rival: 'squelette', skill: 'Costaud', sd: 'Garde 4 et 2 dés en raid. Mange pour deux.',
    lines: ['C’est quand, la soupe ?', 'Le squelette ? Il croustille un peu.', 'Une citrouille ! On en fait un chapeau ou un dessert ?'] },
  fantome:   { name: 'Fantôme', from: 'bibli', tier: 1, hype: 1, guard: 2, dice: 1, tag: 'ruse', likes: 'tableau', rival: 'vampire', skill: 'Hanteur', sd: '+1 🔥 par nuit : le village raconte des histoires.',
    lines: ['Hou… pardon, réflexe.', 'Ce portrait me suit des yeux. Enfin, c’est moi qui le suis.', 'Le vampire se croit chez lui. C’est MOI qui hante ici.'] },
  sorciere:  { name: 'Sorcière', from: 'labo', tier: 1, cal: 1, guard: 1, dice: 1, tag: 'magie', likes: 'theiere', skill: 'Potions', sd: '−1 Calamité par nuit. Excellente pour les raids magiques.',
    lines: ['Une infusion de mandragore, mon chou ?', 'J’ai mis un peu de calme dans la soupe. Juste un peu.', 'Sans service à thé, la magie a un goût de vieux chaudron.'] },
  squelette: { name: 'Squelette', from: 'caveau', tier: 1, guard: 3, dice: 1, tag: 'combat', likes: 'os', rival: 'troll', skill: 'Sentinelle', sd: 'Garde 3 : un vrai mur d’os.',
    lines: ['Je monte la garde. J’ai que ça à faire depuis 300 ans.', 'Le troll m’a encore mangé une côte.', 'Clic-clac. Personne ne passe.'] },
  orque:     { name: 'Orque', from: 'forge', tier: 1, build: 1, guard: 3, dice: 2, tag: 'combat', likes: 'ratelier', rival: 'gobelin', skill: 'Gros bras', sd: '+1 travaux par nuit, garde 3 et 2 dés en raid.',
    lines: ['MOI TAPER. MOI CONSTRUIRE. MOI CONTENT.', 'Les gobelins, ça sert à rien. Sauf à lancer.', 'Un râtelier plein de haches. Comme à la maison.'] },
  araignee:  { name: 'Araignée', fromDecor: { toile: 2 }, mat: 1, amb: 1, guard: 2, dice: 1, tag: 'ruse', likes: 'tapis', skill: 'Tisseuse', sd: '+1 🪵 (de la soie) et +1 Ambiance par nuit. Attirée par 2 Toiles.',
    lines: ['Huit pattes, huit chaussons. C’est logique.', 'Je tricote un pull pour l’orque. Il ne le sait pas encore.', 'Tes toiles sont un peu mollassonnes. Je m’en occupe.'] },
  dragonnet: { name: 'Dragonnet', from: 'tresor', tier: 2, gold: 2, guard: 5, dice: 2, tag: 'combat', likes: 'cristal', skill: 'Couveur d’or', sd: '+2 💰 par nuit et garde 5.',
    lines: ['Je ne dors pas SUR l’or. Je le couve. Nuance.', 'Un cristal ? Pour moi ? Rrrrr.', 'Pfff… petit feu, petit feu.'] },
  mimique:   { name: 'Mimique', from: 'tresor', tier: 2, guard: 4, dice: 0, likes: 'coffreor', skill: 'Embuscade', sd: 'Garde 4. Les héros n’y voient que du feu.',
    lines: ['Je suis un coffre. Un coffre tout à fait normal.', 'Clac.', 'Ce coffre-fort est très séduisant.'] },
  vampire:   { name: 'Vampire', from: 'salon', tier: 2, hype: 1, guard: 2, dice: 2, tag: 'ruse', likes: 'tableau', rival: 'fantome', skill: 'Charisme', sd: '+1 🔥 par nuit et 2 dés en raid.',
    lines: ['Ce velours… exquis.', 'Le fantôme traverse mes murs sans frapper.', 'Un portrait de moi ? Je n’ai pas de reflet, hélas.'] },
  // créatures rares : il faut les avoir rencontrées sur la carte (site), et que le château rayonne assez (glow)
  golem:     { name: 'Golem de mousse', from: 'mine', rare: true, tier: 1, glow: 45, site: 'grotte', build: 2, guard: 5, dice: 1, tag: 'combat', likes: 'filon', skill: 'Bâtisseur de pierre', sd: '+2 travaux par nuit et garde 5. Ne dit presque rien.',
    lines: ['…', 'Mousse. Contente.', 'Pierre sur pierre. Lentement. Bien.'] },
  fee:       { name: 'Fée grincheuse', from: 'jardin', rare: true, tier: 2, glow: 80, site: 'foret', amb: 2, cal: 1, guard: 1, dice: 2, tag: 'magie', likes: 'harpe', rival: 'gobelin', skill: 'Enchantements', sd: '+2 Ambiance et −1 Calamité par nuit. 2 dés de magie en raid.',
    lines: ['Quoi, encore ? J’étais en train de bouder.', 'Ton lac est humide. C’est normal, mais quand même.', 'Si un gobelin me touche les ailes, je le change en navet.'] },
  liche:     { name: 'Liche frileuse', from: 'reliquaire', rare: true, tier: 2, glow: 110, site: 'ruines', hype: 2, guard: 4, dice: 3, tag: 'magie', likes: 'cranecristal', rival: 'fantome', skill: 'Nécromancie douillette', sd: '+2 🔥 par nuit, garde 4 et 3 dés de magie. Réclame une bouillotte.',
    lines: ['Mille ans de non-vie, et toujours ce courant d’air.', 'Tu n’aurais pas une bouillotte ?', 'Mes artefacts. MES artefacts. Bon, d’accord : tes artefacts.'] },
  harpie:    { name: 'Harpie mélomane', from: 'voliere', rare: true, tier: 1, glow: 45, site: 'pic', hype: 1, amb: 1, guard: 2, dice: 2, tag: 'ruse', likes: 'mangeoire', rival: 'gargouille', skill: 'Chant perçant', sd: '+1 🔥 et +1 Ambiance par nuit, 2 dés de ruse. Elle chante faux, mais très fort.',
    lines: ['Laaaaa ! Pardon, je m’échauffais.', 'Les gargouilles n’ont aucune oreille musicale.', 'Une mangeoire bien garnie, et je fais les chœurs.'] },
};
const SPECIES_ORDER = Object.keys(SPECIES);

const NAMES = ['Grumelot','Pustule','Brindille','Croûton','Mirabelle','Ronce','Gédéon','Biscotte','Moisi','Patafix','Ortie','Bougnette','Fripouille','Pétoche','Gribouille','Tartiflette','Navet','Chiffon','Grisou','Mélusine','Barnabé','Poussière','Clafoutis','Rillette','Zéphyrine','Bubulle','Torchon','Myrtille','Fourchette','Glouglou','Pistache','Caramel','Soupière','Vermicelle','Noisette','Grelot','Pompon','Cornichon','Praline','Tison'];

const RAIDS = {
  ferme:     { name: 'Ferme des Pommiers', emo: '🍎', tier: 0, risk: 0, tag: 'pillage', reward: { s: 3, g: 1 }, hype: 1, menace: 1, desc: 'Des sacs de grain et un chien qui dort.' },
  moulin:    { name: 'Moulin de la Bise', emo: '🌾', tier: 0, risk: 0, tag: 'ruse', reward: { g: 3, s: 1 }, hype: 1, menace: 2, desc: 'Le meunier cache sa cagnotte sous la meule.' },
  auberge:   { name: 'Auberge du Sanglier Ronchon', emo: '🍺', tier: 1, risk: 1, tag: 'combat', reward: { g: 6, s: 1 }, hype: 2, menace: 2, desc: 'Pleine d’aventuriers éméchés. Gare aux bagarres.' },
  monastere: { name: 'Monastère des Tisanes', emo: '⛪', tier: 1, risk: 1, tag: 'magie', reward: { g: 4, s: 2 }, hype: 3, menace: 3, bonus: 'theiere', desc: 'Des moines, des herbes et un service à thé légendaire.' },
  chateau:   { name: 'Château du Baron Pâlichon', emo: '🏰', tier: 2, risk: 2, tag: 'combat', reward: { g: 12, s: 4 }, hype: 4, menace: 3, bonus: 'tableau', desc: 'Le gros lot. Le baron a très peur du noir.' },
};
const TAGS = { pillage: 'Pillage', ruse: 'Ruse', combat: 'Combat', magie: 'Magie' };

// aventuriers : archétypes maladroits
const HEROES = [
  { k: 'paladin', name: 'Sire Gontran', c: 3 },
  { k: 'elfe', name: 'Elwyna l’Archère', c: 2 },
  { k: 'mage', name: 'Maître Fulbert', c: 3 },
  { k: 'voleuse', name: 'Ginette la Furtive', c: 2 },
  { k: 'barbare', name: 'Brutus le Rugueux', c: 3 },
  { k: 'paysan', name: 'Jacquot et sa fourche', c: 1 },
];
const HERO_LINES = {
  hit:  ['Aïe ! Qui a mis ça là ?', 'On aurait dû rester à l’auberge.', 'C’est un donjon ou une brocante ?', 'Je réclame une pause !', 'Personne m’avait parlé de pièges !', 'C’est la faute du mage.', 'Ma cotte de mailles est toute neuve !'],
  flee: ['Repli stratégique !', 'Je retourne élever des chèvres !', 'On a dit qu’on revenait au niveau 5 !', 'Courez !', 'Chacun pour soi !'],
  win:  ['Le butin ! Enfin !', 'Facile, ce donjon.', 'On partage à parts égales… enfin presque.'],
};

const TIERS = [
  null,
  { need: { rooms: 3, hype: 2 }, cost: { g: 10, s: 4 }, unlock: 'Bibliothèque, Laboratoire, Caveau, Forge, Oubliettes, Lit à baldaquin, Sphinx empaillé, Hache pendulaire, Trolls' },
  { need: { rooms: 7, hype: 7, species: 5 }, cost: { g: 22, s: 10 }, unlock: 'Salle au trésor, Salon pourpre, Salle du trône, Dragonnets, Mimiques, Vampires' },
  { need: { rooms: 10, hype: 14, trone: true }, cost: { g: 35, s: 15 }, unlock: 'La gloire éternelle et un château légendaire' },
];

const GOALS = [
  { id: 'dig',    text: 'Pose 2 nouveaux couloirs',          test: s => s.stats.dug >= 2,           reward: { s: 2 } },
  { id: 'dorm',   text: 'Construis un Dortoir',               test: s => s.rooms.some(r => r.t === 'dortoir'), reward: { g: 3 } },
  { id: 'bed',    text: 'Pose un lit dans le Dortoir',        test: s => s.furn.some(f => FURN[f.t].beds && roomAt(f.x, f.y) && roomAt(f.x, f.y).t === 'dortoir'), reward: { free: 'torche', n: 2 } },
  { id: 'pet',    text: 'Caresse une créature',               test: s => s.stats.pets >= 1,          reward: { free: 'plante', n: 1 } },
  { id: 'deco3',  text: 'Colle 3 décorations',                test: s => s.stats.decor >= 3,         reward: { g: 2 } },
  { id: 'night2', text: 'Termine ta première nuit',           test: s => s.night >= 2,               reward: { s: 2 } },
  { id: 'gob',    text: 'Accueille un Gobelin',               test: s => s.creatures.some(c => c.sp === 'gobelin'), reward: { free: 'os', n: 2 } },
  { id: 'raid1',  text: 'Réussis un raid',                    test: s => s.stats.raidsWon >= 1,      reward: { g: 3 } },
  { id: 'def1',   text: 'Pose un piège dans un couloir',      test: s => s.defs.length >= 1,         reward: { free: 'banane', n: 1 } },
  { id: 'tier1',  text: 'Atteins le Palier 1',                test: s => s.tier >= 1,                reward: { free: 'tapis', n: 2 } },
  { id: 'repel',  text: 'Repousse une bande d’aventuriers', test: s => s.stats.repelled >= 1,    reward: { g: 5 } },
  { id: 'amb10',  text: 'Atteins 10 d’Ambiance',          test: s => ambiance() >= 10,           reward: { free: 'tableau', n: 1 } },
  { id: 'album6', text: 'Remplis 6 cases de l’album',     test: s => Object.keys(s.album).length >= 6, reward: { g: 6 } },
  { id: 'tier2',  text: 'Atteins le Palier 2',                test: s => s.tier >= 2,                reward: { free: 'cristal', n: 1 } },
  { id: 'throne', text: 'Installe un Trône',                  test: s => s.furn.some(f => f.t === 'trone'), reward: { g: 10 } },
  { id: 'tier3',  text: 'Atteins le Palier 3',                test: s => s.tier >= 3,                reward: { g: 20 } },
];

const TITLES = [[0, 'Masure branlante'], [5, 'Manoir douillet'], [10, 'Château cosy'], [18, 'Forteresse des ténèbres moelleuses']];
