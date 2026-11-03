
/* =========================================================
   La vie du donjon. Chaque créature a un caractère (deux
   traits et une manie) et vaque à ses occupations avec les
   commodités du château, comme dans Dungeon Keeper : sieste,
   grignotage, forge, lecture, ménage, chamailleries…
   Et dehors, les Jardins : enclos, poules, forêt à racheter.
   ========================================================= */

/* ---------- caractères ---------- */
// test : ce qui épanouit le trait (état du château, jamais l'animation) ; acts : occupations préférées
const TRAITS = {
  marmotte:  { ico: '😴', name: 'Marmotte', desc: 'Dort n’importe où, n’importe quand.', acts: ['dormir', 'rever'], ok: 'Des lits en rab', test: () => beds() >= S.creatures.length + 2 },
  gourmand:  { ico: '🍗', name: 'Gourmand', desc: 'Pense au prochain repas pendant le repas.', acts: ['manger', 'poules'], ok: 'Un garde-manger qui déborde', ko: 'Le garde-manger est juste', test: (c, hungry) => !hungry.has(c.id) && foodCap() >= eaters() + 2 },
  studieux:  { ico: '📚', name: 'Rat de bibliothèque', desc: 'Lit tout, même les étiquettes des potions.', acts: ['lire', 'potion'], ok: 'Des grimoires à dévorer', ko: 'Rien à lire', test: () => countItem('etagere') + countItem('pupitre') + countItem('grimoire') >= 2 },
  fetard:    { ico: '🍺', name: 'Fêtard', desc: 'Toujours partant pour une chanson à boire.', acts: ['fete', 'musique', 'bavarder'], ok: 'Une taverne qui chante', ko: 'Pas de quoi trinquer', test: () => hasItem('biere') || hasItem('scene') },
  bagarreur: { ico: '⚔️', name: 'Bagarreur', desc: 'S’entraîne sur tout ce qui ne bouge pas, et sur le reste.', acts: ['entrainer', 'chamaille', 'garde'], ok: 'De quoi s’entraîner', ko: 'Rien à cogner', test: () => hasItem('ratelier') || hasItem('chaines') || hasItem('armure') },
  maniaque:  { ico: '🧹', name: 'Maniaque', desc: 'Range, astique, et soupire beaucoup.', acts: ['nettoyer', 'chantier'], ok: 'Pas un chantier en désordre', ko: 'Des chantiers partout', test: () => S.rooms.filter(r => !r.built).length <= 1 },
  radin:     { ico: '💰', name: 'Radin', desc: 'Compte ses pièces. Puis les tiennes.', acts: ['compter'], ok: 'De l’or à contempler', ko: 'Des coffres bien vides', test: () => hasItem('tasdor') || hasItem('coffreor') || S.gold >= 40 },
  bucolique: { ico: '🌿', name: 'Bucolique', desc: 'A besoin d’herbe, de fleurs et de ciel.', acts: ['jardiner', 'dehors', 'pecher', 'poules'], ok: 'Un coin de verdure', ko: 'Pas un brin d’herbe', test: () => S.rooms.some(r => r.built && (ROOMS[r.t].out || r.t === 'potager' || r.t === 'jardin')) },
  artiste:   { ico: '🎨', name: 'Artiste', desc: 'Admire, critique, et joue de l’orgue à trois heures du matin.', acts: ['admirer', 'musique'], ok: 'De belles choses à admirer', ko: 'Un château sans goût', test: () => ['tableau', 'cristal', 'orgue', 'tonnelle', 'fontaine', 'saule', ...ARTEFACTS].reduce((n, k) => n + countItem(k), 0) >= 2 },
  curieux:   { ico: '🔍', name: 'Curieux', desc: 'Ouvre toutes les portes, surtout celles qu’il ne faut pas.', acts: ['explorer', 'dehors'], ok: 'Des recoins à explorer', test: () => floorsDug() >= 1 || S.rooms.some(r => zOf(r) === EXT) },
  frileux:   { ico: '🧣', name: 'Frileux', desc: 'Toujours collé à une flamme.', acts: ['chauffer'], ok: 'Des flammes partout', ko: 'Il fait froid, ici', test: () => countItem('torche') + countItem('fourneau') + countItem('candelabre') + countItem('chaudron') >= 3 },
  bavard:    { ico: '💬', name: 'Bavard', desc: 'Raconte sa vie à qui veut, et surtout à qui ne veut pas.', acts: ['bavarder'], ok: 'Du monde à qui parler', ko: 'Personne à qui parler', test: () => S.creatures.length >= 6 },
  solitaire: { ico: '🌑', name: 'Solitaire', desc: 'Aime les coins calmes et les gens qui se taisent.', acts: ['rever', 'pecher', 'recueil'], ok: 'Un coin tranquille', test: () => ['caveau', 'bibli', 'reliquaire', 'belvedere', 'cimetiere', 'mare'].some(t => builtCount(t)) },
  farceur:   { ico: '🃏', name: 'Farceur', desc: 'Peaux de banane, seaux sur les portes : un artiste incompris.', acts: ['farce', 'poules'], ok: 'Des victimes à piéger', test: () => S.creatures.length >= 4 },
};
const TRAIT_ORDER = Object.keys(TRAITS);
// les traits qui reviennent souvent selon l'espèce
const SP_TRAITS = { diablotin: ['farceur', 'maniaque', 'bavard'], gobelin: ['radin', 'farceur', 'gourmand'], kobold: ['maniaque', 'curieux', 'radin'], crapaud: ['marmotte', 'bucolique', 'solitaire'],
  gargouille: ['solitaire', 'curieux', 'frileux'], menestrel: ['fetard', 'artiste', 'bavard'], troll: ['gourmand', 'marmotte', 'bagarreur'], fantome: ['curieux', 'solitaire', 'artiste'],
  sorciere: ['studieux', 'bucolique', 'bavard'], squelette: ['bagarreur', 'maniaque', 'frileux'], orque: ['bagarreur', 'gourmand', 'fetard'], araignee: ['artiste', 'solitaire', 'maniaque'],
  dragonnet: ['radin', 'frileux', 'marmotte'], mimique: ['radin', 'farceur', 'solitaire'], vampire: ['artiste', 'fetard', 'solitaire'], golem: ['marmotte', 'bucolique', 'solitaire'],
  fee: ['bucolique', 'artiste', 'farceur'], liche: ['frileux', 'studieux', 'radin'], harpie: ['artiste', 'bavard', 'fetard'], cocatrice: ['gourmand', 'farceur', 'curieux'],
  mandragore: ['bucolique', 'bavard', 'marmotte'], nixe: ['solitaire', 'bucolique', 'artiste'], goule: ['gourmand', 'frileux', 'studieux'], nainsombre: ['maniaque', 'radin', 'bagarreur'] };
// et les occupations de son métier
const SP_ACTS = { diablotin: ['chantier', 'nettoyer'], gobelin: ['dormir', 'compter'], kobold: ['forger', 'chantier'], crapaud: ['jardiner', 'pecher'], gargouille: ['garde'], menestrel: ['musique', 'fete'],
  troll: ['manger', 'dormir'], fantome: ['lire', 'explorer'], sorciere: ['potion', 'jardiner'], squelette: ['garde', 'recueil'], orque: ['forger', 'entrainer', 'chantier'], araignee: ['nettoyer', 'rever'],
  dragonnet: ['compter', 'chauffer'], mimique: ['compter', 'rever'], vampire: ['musique', 'admirer'], golem: ['chantier', 'forger'], fee: ['jardiner', 'admirer'], liche: ['lire', 'chauffer'],
  harpie: ['musique'], cocatrice: ['poules', 'manger'], mandragore: ['jardiner'], nixe: ['pecher'], goule: ['manger', 'recueil'], nainsombre: ['forger', 'chantier'] };
const QUIRKS = ['Ronfle comme une forge.', 'A peur des poules.', 'Collectionne les dents (pas les siennes).', 'Parle à l’épouvantail.', 'Chante faux sous la pluie.', 'Mange les bougies quand personne ne regarde.',
  'Écrit des poèmes sur les rats.', 'Ne marche jamais sur les fissures.', 'Croit que le Cœur l’écoute.', 'Se brosse les dents avec un hérisson.', 'Range ses chaussettes par couleur de moisissure.',
  'Dit « bonjour » aux pièges.', 'Garde un caillou porte-bonheur. Il en a perdu quatre.', 'Rêve d’ouvrir une crêperie.', 'Compte les moutons, puis les mange.', 'Fait des grimaces aux portraits.',
  'Se croit très discret. Il ne l’est pas.', 'Tricote des bonnets pour les gargouilles.', 'Raconte toujours la même blague sur le paladin.', 'Dort la bouche ouverte.', 'Siffle quand il ment.', 'A un ami imaginaire : un héros, pour s’entraîner.'];
function rollPersonality(c) {
  const aff = SP_TRAITS[c.sp] || [], first = aff.length && Math.random() < .75 ? pick(aff) : pick(TRAIT_ORDER);
  let second = first; while (second === first) second = aff.length > 1 && Math.random() < .45 ? pick(aff) : pick(TRAIT_ORDER);
  c.pers = [first, second]; c.quirk = Math.floor(Math.random() * QUIRKS.length);
}
/* ---------- rêves secrets ---------- */
// chaque créature cache un rêve, tiré de son caractère ; t : f (un meuble), d (un piège), etage, poste, seul, dehors
const DREAMS = {
  marmotte:  [['f', 'baldaquin', 'un lit à baldaquin'], ['f', 'canape', 'un canapé de velours']],
  gourmand:  [['f', 'jambons', 'des jambons pendus à la cuisine'], ['f', 'melon', 'des cloches à melon'], ['f', 'ruche', 'une ruche bien pleine']],
  studieux:  [['f', 'fauteuil', 'un fauteuil moelleux pour lire'], ['f', 'pupitre', 'un pupitre à grimoires']],
  fetard:    [['f', 'scene', 'une estrade du barde'], ['f', 'orgue', 'un orgue lugubre']],
  bagarreur: [['d', 'hache', 'une hache pendulaire sur le chemin des héros'], ['f', 'ratelier', 'un râtelier d’armes']],
  maniaque:  [['f', 'coffre', 'un coffre à chaussettes pour tout ranger'], ['f', 'tapis', 'un beau tapis de plus']],
  radin:     [['f', 'tasdor', 'un tas d’or'], ['f', 'coffreor', 'un coffre-fort']],
  bucolique: [['f', 'banc', 'un banc moussu dans les Jardins'], ['f', 'saule', 'un saule pleureur'], ['dehors', 'mare', 'une mare dans les Jardins']],
  artiste:   [['f', 'tableau', 'un portrait d’ancêtre'], ['f', 'orgue', 'un orgue lugubre'], ['f', 'tonnelle', 'une tonnelle fleurie']],
  curieux:   [['etage', '', 'un étage de plus au château'], ['f', 'longuevue', 'une longue-vue pour regarder au loin']],
  frileux:   [['f', 'fourneau', 'un fourneau bien chaud'], ['f', 'candelabre', 'un candélabre de plus']],
  bavard:    [['f', 'tablee', 'une grande tablée pour bavarder'], ['poste', 'taverne', 'un poste à la Taverne']],
  solitaire: [['seul', '', 'une pièce rien qu’à soi (un poste où personne d’autre n’est)']],
  farceur:   [['d', 'leurre', 'un faux trésor pour berner les héros'], ['d', 'banane', 'une peau de banane géante de plus']],
};
const defCount = t => S.defs.filter(d => d.t === t).length;
const dreamMet = (c, d) => {
  if (d.t === 'f') return countItem(d.k) >= d.goal;
  if (d.t === 'd') return defCount(d.k) >= d.goal;
  if (d.t === 'etage') return floorsDug() >= d.goal;
  if (d.t === 'dehors') return S.rooms.some(r => r.t === d.k && r.built);
  const p = c.post && S.rooms.find(r => r.id === c.post && r.built);
  if (d.t === 'poste') return !!p && p.t === d.k;
  if (d.t === 'seul') return !!p && !isHall(p) && !S.creatures.some(o => o !== c && o.post === p.id);
  return false;
};
function rollSecret(c) {
  const cands = (c.pers || []).flatMap(k => DREAMS[k] || []).map(([t, k, label]) => ({ t, k, label, goal: t === 'f' ? countItem(k) + 1 : t === 'd' ? defCount(k) + 1 : t === 'etage' ? floorsDug() + 1 : 0 }))
    .filter(d => !(d.t === 'etage' && d.goal > 3) && !dreamMet(c, d));
  const sp = SPECIES[c.sp] || {}, like = sp.likes && FURN[sp.likes] ? sp.likes : 'cristal';
  c.secret = cands.length ? pick(cands) : { t: 'f', k: like, label: `un autre sticker ${FURN[like].name}`, goal: countItem(like) + 1 };
  c.secret.known = false;
}
const ensureSecret = c => { if (!c.secret || c.secret.pending || !c.secret.t) rollSecret(c); return c.secret; };
const dreamOf = l => /^des /.test(l) ? 'de ' + l.slice(4) : 'd’' + l;
const secretThreshold = () => PW('calins') ? 65 : 80;
function secretLine(c) {
  const d = ensureSecret(c);
  return d.done ? `💫 Rêve réalisé : ${d.label}` : d.known ? `💭 Rêve secret : ${d.label}` : '💭 Rêve secret : ???';
}
function secretHTML(c) {
  const d = ensureSecret(c);
  if (d.done) return `<p class="secret">💫 <b>Rêve réalisé</b> : ${esc(d.label)}. <span class="hint">Il·elle ne songera plus jamais à partir.</span></p>`;
  if (d.known) return `<p class="secret">💭 <b>Rêve secret</b> : ${esc(d.label)}. <span class="hint">Réalise-le : +25 loyauté, de l’expérience, un Cristal, et une fidélité à toute épreuve.</span></p>`;
  return `<p class="secret">💭 <b>Rêve secret</b> : ??? <span class="hint">Il·elle te le confiera à ${secretThreshold()} de loyauté (aujourd’hui ${c.loy}). Les ragots de la Taverne ou la diseuse des villes peuvent aussi le trahir… à moins que tu ne le réalises par hasard.</span></p>`;
}
function revealSecret(c, how, lines) {
  const d = c.secret; if (!d || d.known) return null;
  d.known = true; S.stats.secrets = (S.stats.secrets || 0) + 1;
  const t = how === 'ragot' ? `Ragot de taverne : il paraît que ${c.name} rêve en secret ${dreamOf(d.label)}.` : how === 'voyance' ? `Madame Irma lit dans le marc de bière : ${c.name} rêve en secret ${dreamOf(d.label)}.` : `${c.name} te confie son rêve secret : ${d.label}.`;
  addLog(t, 'ev'); if (lines) lines.push([how === 'ragot' ? '🍺' : how === 'voyance' ? '🔮' : '💭', t, 'ev']);
  return t;
}
// un rêve réalisé (qu'on le connaisse ou non)
function secretsCheck(lines) {
  const done = [];
  S.creatures.forEach(c => {
    const d = ensureSecret(c); if (d.done || isOut(c)) return;
    let ok = false; try { ok = dreamMet(c, d); } catch (e) {} if (!ok) return;
    const surprise = !d.known; d.known = true; d.done = true; c.dream = true; S.stats.dreams = (S.stats.dreams || 0) + 1; if (surprise) S.stats.secrets = (S.stats.secrets || 0) + 1;
    addLoy(c, 25); c.mood = clamp(c.mood + 1, 0, 5); S.free.cristal = (S.free.cristal || 0) + 1; gainXP(c, 5, lines); delete c.tempt;
    const t = `${surprise ? 'Surprise ! ' : ''}${c.name} rêvait en secret ${dreamOf(d.label)} : son rêve est réalisé (+25 loyauté, un Cristal). Il·elle ne partira plus jamais.`;
    addLog(t, 'good'); if (lines) lines.push(['💫', t, 'good']); else { toast('💫 ' + t); sfx('chime'); }
    done.push(c);
  });
  return done;
}
// à l'aube : les confidences des fidèles, et les ragots de la Taverne
function secretsDawn(out) {
  S.creatures.forEach(ensureSecret);
  const hidden = () => S.creatures.filter(c => !c.secret.known && !isOut(c));
  hidden().filter(c => c.loy >= secretThreshold()).forEach(c => revealSecret(c, 'confidence', out));
  const tav = S.rooms.some(r => r.t === 'taverne' && r.built && furnished(r));
  if (tav && hidden().length) {
    const chance = Math.min(.8, .3 + .15 * S.creatures.filter(c => c.sp === 'menestrel' && !isOut(c)).length + .05 * S.creatures.filter(c => (c.pers || []).includes('bavard')).length);
    if (Math.random() < chance) revealSecret(pick(hidden()), 'ragot', out);
  }
}
const _upgradeCreature0 = upgradeCreature;
upgradeCreature = function (c) { _upgradeCreature0(c); if (!Array.isArray(c.pers) || c.pers.length !== 2 || c.pers.some(k => !TRAITS[k])) rollPersonality(c); if (!c.secret) c.secret = { pending: true }; return c; };
// un trait comblé épanouit (+6) ; certains manques pèsent un peu (−3)
function persFactors(c, hungry) {
  return (c.pers || []).map(k => { const T = TRAITS[k]; if (!T) return null; let ok = false; try { ok = T.test(c, hungry); } catch (e) {} return ok ? [`${T.ico} ${T.ok}`, 6] : T.ko ? [`${T.ico} ${T.ko}`, -3] : null; }).filter(Boolean);
}
const _epaFactors0 = epaFactors;
epaFactors = function (c, hungry = hungrySet()) { const r = _epaFactors0(c, hungry); persFactors(c, hungry).forEach(x => r.f.push(x)); r.target = clamp(r.f.reduce((a, x) => a + x[1], 0), 0, 100); return r; };
// sur la fiche de la créature
function persHTML(c) {
  if (!c.pers) return '';
  const a = ACT.get(c.id), L = a && a.life, A = L && L.act && L.phase !== 'idle' ? ACTS[L.act] : null;
  return `<dt>Caractère</dt><dd>${c.pers.map(k => `<span class="tag2" title="${esc(TRAITS[k].desc)}">${TRAITS[k].ico} ${esc(TRAITS[k].name)}</span>`).join('')}<br><span class="hint">${esc(QUIRKS[c.quirk] || '')}${A ? ` En ce moment : ${esc(A.verb)}${L.where ? ' (' + esc(L.where) + ')' : ''}.` : ''}</span></dd>`;
}

/* ---------- occupations ---------- */
// need : le besoin comblé ; items : les meubles dont on se sert ; fx : petits effets ; pose : attitude ; dur : secondes
const ACTS = {
  dormir:    { verb: 'fait la sieste', need: 'energie', items: ['paillasse', 'litsup', 'baldaquin', 'cercueil', 'canape', 'nid', 'mausolee'], fx: 'z', pose: 'sleep', dur: [16, 28], onIt: true },
  manger:    { verb: 'grignote', need: 'faim', items: ['chaudron', 'tonneau', 'jambons', 'tablee', 'choux', 'champis', 'barque', 'ruche', 'mangeoire', 'melon', 'nichoir', 'grain'], fx: 'miam', pose: 'eat', dur: [6, 11] },
  fete:      { verb: 'trinque', need: 'fun', items: ['biere', 'tablee', 'scene'], fx: 'note', pose: 'dance', dur: [8, 14] },
  musique:   { verb: 'joue de la musique', need: 'fun', items: ['orgue', 'scene', 'harpe'], fx: 'note', pose: 'dance', dur: [8, 13] },
  lire:      { verb: 'lit un grimoire', need: 'fun', items: ['etagere', 'pupitre', 'fauteuil', 'grimoire'], fx: 'page', pose: 'read', dur: [10, 18] },
  entrainer: { verb: 's’entraîne', need: 'travail', items: ['ratelier', 'armure', 'chaines', 'heaume', 'epeefaux'], fx: 'hit', pose: 'work', dur: [6, 11] },
  forger:    { verb: 'tape sur l’enclume', need: 'travail', items: ['enclume', 'fourneau', 'etabli', 'caisse', 'wagonnet', 'filon', 'etai'], fx: 'spark', pose: 'work', dur: [8, 13] },
  potion:    { verb: 'touille une potion', need: 'travail', items: ['alambic', 'marmite', 'fioles'], fx: 'bubble', pose: 'work', dur: [8, 13] },
  compter:   { verb: 'compte les pièces d’or', need: 'fun', items: ['tasdor', 'coffreor', 'coffre', 'trone', 'sablier'], fx: 'coin', pose: 'read', dur: [6, 11] },
  admirer:   { verb: 'admire les belles choses', need: 'fun', items: ['tableau', 'cristal', 'tonnelle', 'fontaine', 'vitrine', 'socle', 'nenuphar', 'saule', 'puits', 'nain', 'banniere', ...ARTEFACTS], fx: 'sparkle', dur: [5, 9] },
  chauffer:  { verb: 'se réchauffe près du feu', need: 'confort', items: ['torche', 'fourneau', 'candelabre', 'chaudron', 'etai', 'lanterne'], fx: 'ember', dur: [6, 11] },
  jardiner:  { verb: 'jardine', need: 'travail', items: ['choux', 'champis', 'epouvantail', 'herbes', 'melon', 'arrosoir', 'ruche', 'tonnelle'], fx: 'leaf', pose: 'work', dur: [8, 13] },
  pecher:    { verb: 'pêche', need: 'fun', items: ['ponton', 'barque', 'roseaux', 'nenuphar'], fx: 'drop', pose: 'read', dur: [12, 20] },
  poules:    { verb: 'court après les poules', need: 'fun', rooms: ['poulailler'], fx: 'feather', pose: 'dance', dur: [5, 9] },
  recueil:   { verb: 'se recueille', need: 'confort', items: ['tombe', 'mausolee', 'cercueil', 'ossuaire'], fx: 'wisp', pose: 'read', dur: [8, 13] },
  nettoyer:  { verb: 'fait le ménage', need: 'travail', any: true, fx: 'dust', pose: 'work', dur: [6, 11] },
  chantier:  { verb: 'travaille au chantier', need: 'travail', site: true, fx: 'hammer', pose: 'work', dur: [8, 14] },
  garde:     { verb: 'monte la garde', need: 'travail', guard: true, dur: [12, 22] },
  flaner:    { verb: 'flâne', need: 'fun', wander: true, dur: [3, 7] },
  dehors:    { verb: 'prend l’air', need: 'confort', outside: true, fx: 'leaf', dur: [8, 14] },
  bavarder:  { verb: 'bavarde', need: 'social', social: 'ami', fx: 'chat', pose: 'chat', dur: [6, 11] },
  chamaille: { verb: 'se chamaille', need: 'social', social: 'rival', fx: 'puff', pose: 'shake', dur: [3, 5] },
  farce:     { verb: 'prépare une farce', need: 'fun', social: 'cible', fx: 'farce', dur: [3, 5] },
  rever:     { verb: 'rêvasse dans son coin', need: 'confort', quiet: true, fx: 'dots', pose: 'read', dur: [10, 16] },
  explorer:  { verb: 'explore le château', need: 'fun', explore: true, fx: 'q', dur: [4, 7] },
  lorgner:   { verb: 'regarde vers la route', need: 'confort', gate: true, fx: 'dots', dur: [6, 10] },
  paie:      { verb: 'vient chercher sa paie', need: 'fun', pay: true, fx: 'coin', pose: 'eat', dur: [4, 7] },
  grogne:    { verb: 'réclame sa paie', need: 'social', pay: true, fx: 'puff', pose: 'shake', dur: [3, 5] },
};
const NEEDS = { energie: .2, faim: .28, fun: .33, travail: .26, confort: .2, social: .28 };   // usure par seconde
const NEED_TRAIT = { marmotte: { energie: 1.5 }, gourmand: { faim: 1.6 }, fetard: { fun: 1.4, social: 1.2 }, bavard: { social: 1.7 }, solitaire: { social: .4, confort: 1.3 }, bagarreur: { travail: 1.3 }, maniaque: { travail: 1.5 }, frileux: { confort: 1.6 }, curieux: { fun: 1.3 }, studieux: { fun: 1.2 } };
function lifeOf(a) {
  if (!a.life) { const n = {}; Object.keys(NEEDS).forEach(k => { n[k] = 35 + Math.random() * 60; }); a.life = { n, act: null, phase: 'idle', until: 0, t: performance.now() }; }
  return a.life;
}

/* ---------- où faire quoi ---------- */
const RES = new Map();   // les places prises (un meuble, une personne)
const spotKey = (z, x, y) => z + ':' + x + ':' + y;
// une place est prise tant que la créature qui l'a réservée y va ou y est encore
const taken = key => { const id = RES.get(key); if (id == null) return false; const o = ACT.get(id); if (o && o.life && o.life.goal && o.life.goal.key === key) return true; RES.delete(key); return false; };
const usable = f => { const z = zOf(f); if (z === EXT && !roomAt(f.x, f.y, z)) return extOK(f.x, f.y); const r = roomAt(f.x, f.y, z); return !!r && r.built; };
const roomLabel = r => r ? ROOMS[r.t].name + (zOf(r) ? ' · ' + FLOOR_SHORT[zOf(r)] : '') : 'les Jardins';
const actorsIn = r => [...ACT.values()].filter(o => (o.z || 0) === zOf(r) && inRoom(r, Math.floor(o.x), Math.floor(o.y))).length;
// la cible : { z, x, y (case), px, py (position fine), where, key }
function pickNear(a, list) {
  if (!list.length) return null;
  const z = a.z || 0, d = o => (o.z === z ? 0 : 30) + Math.abs(o.x - a.x) + Math.abs(o.y - a.y);
  const s = list.sort((p, q) => d(p) - d(q)); return s[Math.floor(Math.random() * Math.min(3, s.length))];
}
function cellSpot(z, r, x, y, label) { return { z, x, y, px: x + .3 + Math.random() * .4, py: y + .3 + Math.random() * .4, where: label != null ? label : roomLabel(r) }; }
function findTarget(c, a, k, post) {
  const A = ACTS[k], here = a.z || 0;
  if (A.items) {
    const set = new Set(A.items), list = S.furn.filter(f => set.has(f.t) && usable(f) && !taken(spotKey(zOf(f), f.x, f.y)) && (!post || inRoomZ(post, f)))
      .map(f => ({ z: zOf(f), x: f.x, y: f.y, px: f.x + (A.onIt ? .55 : .5 + .32), py: f.y + (A.onIt ? .55 : .5 + .32), where: roomLabel(roomAt(f.x, f.y, zOf(f))) || 'les Jardins', key: spotKey(zOf(f), f.x, f.y) }));
    return pickNear(a, list);
  }
  if (A.rooms) { const rs = S.rooms.filter(r => r.built && A.rooms.includes(r.t) && (!post || r === post)); const r = pick(rs); if (!r) return null; const [x, y] = randCell(r); return cellSpot(zOf(r), r, x, y); }
  if (A.any) { const rs = builtRooms().filter(r => !isHall(r) && !ROOMS[r.t].stairs && (!post || r === post)); if (!rs.length) return null; const same = rs.filter(r => zOf(r) === here), r = pick(same.length && Math.random() < .75 ? same : rs); const [x, y] = randCell(r); return cellSpot(zOf(r), r, x, y); }
  if (A.site) {   // on travaille depuis une case voisine du chantier (un chantier ne se traverse pas)
    if (!(c.sp === 'diablotin' || (SPECIES[c.sp] || {}).build)) return null;
    const spots = [];
    S.rooms.filter(r => !r.built).forEach(r => { const z = zOf(r); cellsOf(r).forEach(([x, y]) => DIRS.forEach(([dx, dy]) => {
      const nx = x + dx, ny = y + dy; if (inRoom(r, nx, ny)) return; const n = roomAt(nx, ny, z), ok = z === EXT ? extOK(nx, ny) && (!n || n.built) : !!n && n.built;
      if (ok) spots.push({ z, x: nx, y: ny, px: nx + .5 - dx * .36, py: ny + .5 - dy * .36, where: 'chantier : ' + ROOMS[r.t].name });
    })); });
    return pickNear(a, spots);
  }
  if (A.guard) { if (guardOf(c) < 3) return null; const p = (heroPath() || []).filter(([x, y]) => isHall(roomAt(x, y, 0))); if (!p.length) return null; const [x, y] = pick(p); return cellSpot(0, null, x, y, 'le chemin des héros'); }
  if (A.wander) {
    let r = post; if (!r) { const rs = builtRooms().filter(o => zOf(o) === here && !ROOMS[o.t].stairs && (!isHall(o) || Math.random() < .2)); r = here === 0 && Math.random() < .4 ? heartRoom() : pick(rs) || heartRoom(); }
    if (!r && here === EXT) { const [x, y] = extCell(); return cellSpot(EXT, null, x, y, 'les Jardins'); }
    if (!r) return null; const [x, y] = randCell(r); return cellSpot(zOf(r), r, x, y);
  }
  if (A.outside) { const [x, y] = extCell(); return x == null ? null : cellSpot(EXT, null, x, y, 'les Jardins'); }
  if (A.quiet) { const rs = builtRooms().filter(r => !isHall(r) && !ROOMS[r.t].stairs && zOf(r) === here && actorsIn(r) === 0); const r = pick(rs); if (!r) return null; const [x, y] = randCell(r); return cellSpot(zOf(r), r, x, y); }
  if (A.explore) { const rs = builtRooms().filter(r => !isHall(r) && !ROOMS[r.t].stairs && zOf(r) !== here); const r = pick(rs); if (!r) return null; const [x, y] = randCell(r); return cellSpot(zOf(r), r, x, y); }
  if (A.gate) { if (!c.tempt) return null; return cellSpot(0, null, GATE.x, GATE.y, 'le porche'); }
  if (A.pay) { const r = S.rooms.find(o => o.t === 'tresor' && o.built) || heartRoom(); if (!r) return null; const [x, y] = randCell(r); return cellSpot(zOf(r), r, x, y); }
  return null;
}
// une case d'herbe libre dans les Jardins (de préférence près d'un banc, d'un puits…)
function extCell() {
  const d = extDepth(), deco = S.furn.filter(f => zOf(f) === EXT && FURN[f.t] && FURN[f.t].out);
  for (let i = 0; i < 30; i++) {
    const base = deco.length && Math.random() < .5 ? pick(deco) : null;
    const x = base ? base.x + Math.round(Math.random() * 2 - 1) : Math.floor(Math.random() * W), y = base ? base.y + Math.round(Math.random() * 2 - 1) : H - 1 - Math.floor(Math.random() * d);
    if (extOK(x, y) && !roomAt(x, y, EXT) && !furnAt(x, y, EXT)) return [x, y];
  }
  return extDoor();
}
// un partenaire pour bavarder, se chamailler ou subir une farce
function findPartner(c, a, kind) {
  const here = a.z || 0, sp = SPECIES[c.sp] || {};
  const rival = o => sp.rival === o.sp || (SPECIES[o.sp] || {}).rival === c.sp;
  const list = [...ACT.values()].filter(o => o !== a && !o.leaving && !o.walking && (o.z || 0) === here && Math.abs(o.x - a.x) + Math.abs(o.y - a.y) < 9).map(o => [o, critter(o.id)]).filter(([o, oc]) => {
    if (!oc || isOut(oc)) return false; const L = lifeOf(o); if (L.phase === 'go' || L.phase === 'wait' || (L.phase === 'do' && !['flaner', 'rever', 'dehors'].includes(L.act))) return false;
    if (kind === 'rival') return rival(oc) || ((c.pers || []).includes('bagarreur') && (oc.pers || []).includes('bagarreur'));
    return !rival(oc);
  });
  return list.length ? pick(list) : null;
}

/* ---------- la journée d'une créature ---------- */
function planAct(c, a) {
  const L0 = lifeOf(a);
  if (S.pay && S.night === S.pay.night + 1 && L0.payNight !== S.pay.night) {   // le lendemain de la paie
    L0.payNight = S.pay.night; const k = S.pay.paid.includes(c.id) ? 'paie' : S.pay.unpaid.includes(c.id) ? 'grogne' : null;
    if (k) { const t = findTarget(c, a, k, null); if (t) return setGoal(a, L0, k, t); }
  }
  const L = lifeOf(a), likes = new Set((c.pers || []).flatMap(k => (TRAITS[k] || {}).acts || [])), job = new Set(SP_ACTS[c.sp] || []);
  const post = c.post && S.rooms.find(r => r.id === c.post && r.built), from = (SPECIES[c.sp] || {}).from;
  const home = !post && from && ROOMS[from] && ROOMS[from].out ? S.rooms.find(r => r.t === from && r.built) : null;
  const atPost = post && Math.random() < .55 ? post : home && Math.random() < .4 ? home : null;
  const sulky = c.mood <= 1, opts = [];
  for (const k in ACTS) {
    const A = ACTS[k]; if ((k === 'lorgner' && !c.tempt) || A.pay) continue;
    let u = (100 - (L.n[A.need] == null ? 60 : L.n[A.need])) * (likes.has(k) ? 2 : 1) * (job.has(k) ? 1.6 : 1) + Math.random() * 30;
    if (k === 'flaner') u = 28 + Math.random() * 30;
    if (k === 'lorgner') u += 60;
    if (k === 'chantier' && job.has(k)) u += 40;
    if (sulky) u *= ['rever', 'chamaille', 'lorgner'].includes(k) ? 1.8 : .55;
    if (A.social && atPost) continue;
    opts.push([k, u]);
  }
  opts.sort((p, q) => q[1] - p[1]);
  for (const [k] of opts.slice(0, 6)) {
    const A = ACTS[k];
    if (A.social) { const p = findPartner(c, a, A.social); if (!p) continue; const [o, oc] = p; const PL = lifeOf(o);
      PL.phase = 'wait'; PL.until = performance.now() + 15000; PL.with = a.id; PL.act = k; o.pose = null;
      return setGoal(a, L, k, { z: o.z || 0, x: Math.floor(o.x), y: Math.floor(o.y), px: o.x - .42, py: o.y + .12, where: '' }, o.id); }
    const t = findTarget(c, a, k, atPost);
    if (t) return setGoal(a, L, k, t);
  }
  const t = findTarget(c, a, 'flaner', post || null); if (t) setGoal(a, L, 'flaner', t);
}
function setGoal(a, L, k, t, withId) {
  releaseSpot(L); L.act = k; L.goal = t; L.phase = 'go'; L.with = withId || null; L.where = t.where; L.tries = 0;
  if (t.key) RES.set(t.key, a.id);
}
function releaseSpot(L) { if (L.goal && L.goal.key && RES.get(L.goal.key) != null) RES.delete(L.goal.key); }
function startDo(c, a, L) {
  const A = ACTS[L.act], now = performance.now(), dur = (A.dur[0] + Math.random() * (A.dur[1] - A.dur[0])) * 1000;
  L.phase = 'do'; L.until = now + dur; a.pose = A.pose || null;
  if (L.with) { const o = ACT.get(L.with), OL = o && lifeOf(o); if (!o || !OL || OL.with !== a.id) { L.phase = 'idle'; a.pose = null; return; }
    OL.phase = 'do'; OL.until = L.until; o.pose = A.pose || null; a.flip = o.x - o.y < a.x - a.y; o.flip = !a.flip;
    if (L.act === 'farce') { o.hopUntil = now + 600; emitFx(o, 'bang'); } }
  emitFx(a, A.fx);
}
function finishAct(a, L) {
  const A = ACTS[L.act]; if (A) L.n[A.need] = Math.min(100, (L.n[A.need] || 0) + 55 + Math.random() * 30);
  if (A && A.social) L.n.social = Math.min(100, L.n.social + 40);
  releaseSpot(L); L.phase = 'idle'; L.goal = null; a.pose = null;
  if (L.with) { const o = ACT.get(L.with); if (o && o.life && o.life.with === a.id) { o.life.phase = 'idle'; o.life.with = null; o.pose = null; o.life.n.social = Math.min(100, o.life.n.social + 40); } L.with = null; }
}
// la prochaine porte à prendre pour aller de l'étage z vers l'étage tz
function hopFrom(z, tz) {
  if (z === EXT) return { cell: extDoor(), kind: 'in' };
  if (tz === EXT && z === 0) return { cell: [GATE.x, GATE.y], kind: 'out' };
  const goal = tz === EXT ? 0 : tz, dir = goal > z ? 1 : -1, st = stairsToward(z, dir);
  return st ? { cell: [st.x, st.y], kind: 'stairs', dir } : null;
}
async function goOut(a) { a.walking = true; await moveTo(a, GATE.x + .5, H + 1.3, 650); a.z = EXT; const [dx] = extDoor(); a.x = dx + .5; a.y = H + .25; await moveTo(a, dx + .5, H - .5, 600); a.walking = false; }
async function goIn(a) { a.walking = true; const [dx] = extDoor(); await moveTo(a, dx + .5, H + .25, 500); a.z = 0; a.x = GATE.x + .5; a.y = H + 1.3; await moveTo(a, GATE.x + .5, GATE.y + .5, 650); a.walking = false; }
function stepToward(c, a, L) {   // vrai tant qu'on est en route
  const g = L.goal, z = a.z || 0, [cx, cy] = cellOf(a);
  if (++L.tries > 40) { a.z = g.z; a.x = g.px; a.y = g.py; return false; }
  if (z !== g.z) {
    const h = hopFrom(z, g.z);
    if (!h) { a.z = g.z; a.x = g.px; a.y = g.py; return false; }
    if (cx === h.cell[0] && cy === h.cell[1]) {
      if (h.kind === 'stairs') { a.z = z + h.dir; return true; }
      (h.kind === 'out' ? goOut(a) : goIn(a)).then(() => lifeTick(a, true)); return true;
    }
    walkTo(a, z, h.cell[0], h.cell[1]); return true;
  }
  if (cx !== g.x || cy !== g.y) { walkTo(a, z, g.x, g.y); return true; }
  if (Math.abs(a.x - g.px) + Math.abs(a.y - g.py) > .08) { a.walking = true; moveTo(a, g.px, g.py, 320).then(() => { a.walking = false; lifeTick(a, true); }); return true; }
  return false;
}
function walkTo(a, z, tx, ty) {
  const p = withZ(z, () => bfs(cellOf(a), (x, y) => x === tx && y === ty));
  if (p && p.length > 1) walkPath(a, p).then(ok => { if (ok) lifeTick(a, true); });
  else { a.x = tx + .5; a.y = ty + .5; }   // pas de chemin (pièce isolée) : la créature se faufile quand même
}
function lifeTick(a, force) {
  const c = critter(a.id); if (!c || a.leaving || a.walking || a.dur || isOut(c)) return;
  const L = lifeOf(a), now = performance.now(), dt = Math.min(12, (now - L.t) / 1000); L.t = now;
  if (L.night !== S.night) { if (L.night != null && L.phase !== 'idle') finishAct(a, L); L.night = S.night; }   // une nouvelle nuit : on repart de zéro (le jour de paie d'abord)
  const mul = {}; (c.pers || []).forEach(k => Object.entries(NEED_TRAIT[k] || {}).forEach(([n, m]) => { mul[n] = (mul[n] || 1) * m; }));
  for (const k in NEEDS) L.n[k] = Math.max(0, L.n[k] - NEEDS[k] * (mul[k] || 1) * dt);
  if (L.phase === 'do') { if (now < L.until) { if (Math.random() < .75) emitFx(a, ACTS[L.act].fx); if (L.act === 'poules') scareHens(a); return; } finishAct(a, L); }
  if (L.phase === 'wait') { if (now < L.until) return; L.phase = 'idle'; L.with = null; }
  if (L.phase === 'go') {
    if (L.with) { const o = ACT.get(L.with); if (!o || o.leaving || !o.life || o.life.with !== a.id) { finishAct(a, L); return; } }
    if (stepToward(c, a, L)) return;
    startDo(c, a, L); return;
  }
  if (!force && Math.random() < .3) return;
  planAct(c, a);
}
wanderOnce = function (a, force) { try { lifeTick(a, force); } catch (e) { if (!V.lifeErr) { V.lifeErr = 1; console.error(e); } } };

/* ---------- petits effets : z, notes, miettes, étincelles… ---------- */
const GLYPHS = []; let GLYPH_T = 0;
function glyph(x, y, o) { if (GLYPHS.length > 180) GLYPHS.shift(); GLYPHS.push({ x, y, vx: 0, vy: -18, g: 0, t0: performance.now(), life: 1500, size: 14, col: '#fff', ...o }); }
function emitFx(a, kind) {
  if (!kind || (a.z || 0) !== Z || document.hidden) return;
  const [wx, wy] = WP(a.x, a.y), f = a.sc || 1, top = wy - 100 * f, R = Math.random;
  switch (kind) {
    case 'z': glyph(wx + 12, top + 18 * f, { ch: R() < .6 ? 'z' : 'Z', col: '#cfe0ff', vx: 9, vy: -13, size: 12 + R() * 5, grow: .6, life: 2300, ink: true }); break;
    case 'note': glyph(wx + (R() - .5) * 20 * f, top, { ch: R() < .5 ? '♪' : '♫', col: '#f2d48a', vx: (R() - .5) * 18 * f, vy: -24, size: 16, sway: 1, life: 1800, ink: true }); break;
    case 'miam': for (let i = 0; i < 3; i++) glyph(wx + (R() - .5) * 16 * f, top + 34 * f, { shape: 'dot', col: R() < .5 ? '#c8935a' : '#e8c48a', vx: (R() - .5) * 34 * f, vy: -22, g: 150, size: 2.3, life: 900 }); break;
    case 'page': glyph(wx + 10, top + 16 * f, { shape: 'paper', col: '#f4ead2', vx: 7, vy: -15, size: 5.5, vr: 2.2, life: 1500 }); break;
    case 'spark': for (let i = 0; i < 4; i++) V.parts.push({ k: 'ember', x: wx + (R() - .5) * 18 * f, y: wy - 30 * f, vx: (R() - .5) * 60 * f, vy: -40 - R() * 50, life: 0, max: .5 + R() * .5 }); break;
    case 'hit': glyph(wx + (R() - .5) * 22 * f, top + 22 * f, { ch: '✶', col: '#ffd27a', vx: (R() - .5) * 20 * f, vy: -10, size: 14, life: 650, ink: true }); break;
    case 'bubble': for (let i = 0; i < 2; i++) glyph(wx + (R() - .5) * 18 * f, wy - 42 * f, { shape: 'ring', col: '#9be38a', vx: (R() - .5) * 8 * f, vy: -24, size: 2.5 + R() * 3, life: 1400 }); break;
    case 'coin': glyph(wx + (R() - .5) * 14 * f, top + 24 * f, { shape: 'coin', col: '#f5d76e', vx: (R() - .5) * 22 * f, vy: -62, g: 170, size: 4.5, life: 1000 }); break;
    case 'sparkle': glyph(wx + (R() - .5) * 28 * f, top + (R() - .5) * 22 * f, { ch: '✦', col: '#fff4c8', vx: 0, vy: -8, size: 11 + R() * 5, life: 1300 }); break;
    case 'ember': for (let i = 0; i < 2; i++) V.parts.push({ k: 'ember', x: wx + (R() - .5) * 30 * f, y: wy - 22 * f, vx: (R() - .5) * 20 * f, vy: -20 - R() * 30, life: 0, max: .8 + R() * .6 }); break;
    case 'leaf': glyph(wx + (R() - .5) * 26 * f, top + 32 * f, { shape: 'leaf', col: R() < .5 ? '#7fbf5a' : '#a6d48a', vx: (R() - .5) * 22 * f, vy: -14, g: 12, size: 4.5, vr: 3, life: 1600 }); break;
    case 'drop': glyph(wx + 22, wy - 4 * f, { shape: 'ripple', col: 'rgba(170,215,240,.9)', size: 4, life: 1500, vx: 0, vy: 0 }); break;
    case 'feather': for (let i = 0; i < 2; i++) glyph(wx + (R() - .5) * 34 * f, wy - 26 * f, { shape: 'leaf', col: '#f6efe2', vx: (R() - .5) * 34 * f, vy: -22, g: 20, size: 4, vr: 4, life: 1800 }); break;
    case 'wisp': glyph(wx + (R() - .5) * 22 * f, wy - 22 * f, { shape: 'wisp', col: 'rgba(180,255,210,.75)', vx: (R() - .5) * 6 * f, vy: -18, size: 4.5, life: 2000 }); break;
    case 'dust': V.parts.push({ k: 'dust', x: wx + (R() - .5) * 30 * f, y: wy - 8 * f, vx: (R() - .5) * 10 * f, vy: -6, life: 0, max: 2 }); glyph(wx + (R() - .5) * 22 * f, wy - 24 * f, { ch: '✧', col: '#fff6dc', vx: 0, vy: -10, size: 11, life: 900 }); break;
    case 'hammer': for (let i = 0; i < 3; i++) V.parts.push({ k: 'ember', x: wx + (R() - .5) * 20 * f, y: wy - 26 * f, vx: (R() - .5) * 50 * f, vy: -30 - R() * 40, life: 0, max: .4 + R() * .4 }); if (R() < .4) V.parts.push({ k: 'poof', x: wx, y: wy - 6 * f, vx: (R() - .5) * 20 * f, vy: -10, life: 0, max: .6 }); break;
    case 'chat': glyph(wx + (a.flip ? -14 : 14), top + 6 * f, { ch: pick(['…', '!', '?', '♥', '…', '♪']), col: '#fbf3e0', vx: 0, vy: -10, size: 14, life: 1200, ink: true }); break;
    case 'puff': for (let i = 0; i < 5; i++) V.parts.push({ k: 'poof', x: wx + (R() - .5) * 26 * f, y: wy - 20 * f - R() * 20, vx: (R() - .5) * 50 * f, vy: -16, life: 0, max: .6 + R() * .3 }); glyph(wx, top, { ch: '✶', col: '#ff6a5a', vx: 0, vy: -16, size: 17, life: 900, ink: true }); break;
    case 'farce': glyph(wx + 12, top, { ch: '♪', col: '#9be38a', vx: 10, vy: -16, size: 14, life: 1200, ink: true }); break;
    case 'dots': glyph(wx + 14, top + 8 * f, { ch: '…', col: '#d8d0e6', vx: 0, vy: -6, size: 15, life: 1600, ink: true }); break;
    case 'q': glyph(wx + 6, top, { ch: '?', col: '#f2d48a', vx: 0, vy: -12, size: 17, life: 1300, ink: true }); break;
    case 'bang': glyph(wx, top, { ch: '!', col: '#ff8a7a', vx: 0, vy: -18, size: 19, life: 1000, ink: true }); break;
  }
}
function drawGlyphs(c, t) {
  const dt = Math.min(.05, (t - (GLYPH_T || t)) / 1000); GLYPH_T = t;
  for (let i = GLYPHS.length - 1; i >= 0; i--) {
    const g = GLYPHS[i], k = (t - g.t0) / g.life; if (k >= 1) { GLYPHS.splice(i, 1); continue; }
    g.vy += (g.g || 0) * dt; g.x += (g.vx + (g.sway ? Math.sin(t / 200 + g.t0) * 12 : 0)) * dt; g.y += g.vy * dt; g.rot = (g.rot || 0) + (g.vr || 0) * dt;
    const al = Math.min(1, (1 - k) * 2.2) * Math.min(1, k * 8), s = g.size * .8 * (1 + (g.grow || 0) * k);
    c.save(); c.globalAlpha = al * .92; c.translate(g.x, g.y); if (g.rot) c.rotate(g.rot);
    if (g.ch) { c.font = `700 ${s}px "Patrick Hand", "Comic Sans MS", sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; if (g.ink) { c.lineWidth = 3; c.lineJoin = 'round'; c.strokeStyle = 'rgba(26,16,12,.8)'; } c.fillStyle = g.col; richText(c, g.ch, 0, 0, s, !!g.ink); }
    else if (g.shape === 'dot' || g.shape === 'wisp') { c.fillStyle = g.col; c.beginPath(); c.arc(0, 0, s, 0, 7); c.fill(); }
    else if (g.shape === 'coin') { c.fillStyle = g.col; c.strokeStyle = '#7a5a12'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(0, 0, s, s * (.35 + .65 * Math.abs(Math.cos(t / 90))), 0, 0, 7); c.fill(); c.stroke(); }
    else if (g.shape === 'ring') { c.strokeStyle = g.col; c.lineWidth = 1.4; c.beginPath(); c.arc(0, 0, s, 0, 7); c.stroke(); }
    else if (g.shape === 'leaf') { c.fillStyle = g.col; c.beginPath(); c.ellipse(0, 0, s, s * .45, 0, 0, 7); c.fill(); }
    else if (g.shape === 'paper') { c.fillStyle = g.col; c.strokeStyle = 'rgba(40,30,20,.6)'; c.lineWidth = .8; c.fillRect(-s, -s * .7, s * 2, s * 1.4); c.strokeRect(-s, -s * .7, s * 2, s * 1.4); }
    else if (g.shape === 'ripple') { const r = s + k * 18; c.strokeStyle = g.col; c.lineWidth = 1.2; c.beginPath(); c.ellipse(0, 0, r, r * .45, 0, 0, 7); c.stroke(); }
    c.restore();
  }
}

/* ---------- les poules du poulailler ---------- */
const HENS = new Map();
function hensOf(r) {
  let hs = HENS.get(r.id);
  if (!hs) { hs = Array.from({ length: 3 }, () => ({ x: r.x + .3 + Math.random() * (r.w - .6), y: r.y + .3 + Math.random() * (r.h - .6), dur: 0, flip: Math.random() < .5, ph: Math.random() * 6, scared: 0 })); HENS.set(r.id, hs); }
  return hs;
}
function scareHens(a) {
  const r = roomAt(Math.floor(a.x), Math.floor(a.y), EXT); if (!r || r.t !== 'poulailler') return;
  const now = performance.now(), h = hensOf(r).sort((p, q) => Math.hypot(p.x - a.x, p.y - a.y) - Math.hypot(q.x - a.x, q.y - a.y))[0]; if (!h) return;
  h.scared = now + 1600; h.fx = h.x; h.fy = h.y; h.tx = clamp(h.x + (h.x - a.x) * 2 + (Math.random() - .5), r.x + .25, r.x + r.w - .25); h.ty = clamp(h.y + (h.y - a.y) * 2 + (Math.random() - .5), r.y + .25, r.y + r.h - .25); h.t0 = now; h.dur = 380;
  h.flip = (h.tx - h.ty) < (h.fx - h.fy);
  if (Math.abs(a.x - h.tx) + Math.abs(a.y - h.ty) > .3 && Math.random() < .7) { a.walking = true; moveTo(a, clamp(h.x, r.x + .2, r.x + r.w - .2), clamp(h.y, r.y + .2, r.y + r.h - .2), 420).then(() => { a.walking = false; }); }
}
function updateHens(t) {
  const live = new Set();
  for (const r of S.rooms) {
    if (r.t !== 'poulailler' || !r.built || zOf(r) !== EXT) continue; live.add(r.id);
    for (const h of hensOf(r)) {
      if (h.dur && t - h.t0 < h.dur) { const p = (t - h.t0) / h.dur; h.x = h.fx + (h.tx - h.fx) * p; h.y = h.fy + (h.ty - h.fy) * p; continue; }
      h.dur = 0;
      if (Math.random() < .01) { h.fx = h.x; h.fy = h.y; h.tx = r.x + .25 + Math.random() * (r.w - .5); h.ty = r.y + .25 + Math.random() * (r.h - .5); h.t0 = t; h.dur = 700 + Math.hypot(h.tx - h.fx, h.ty - h.fy) * 1100; h.flip = (h.tx - h.ty) < (h.fx - h.fy); }
    }
  }
  for (const k of HENS.keys()) if (!live.has(k)) HENS.delete(k);
}
function drawHen(h, t) {
  const [wx, wy] = WP(h.x, h.y), moving = h.dur && t - h.t0 < h.dur, peck = !moving && Math.sin(t / 260 + h.ph * 3) > .7 ? 3 : 0, hop = moving ? Math.abs(Math.sin(t / 70 + h.ph)) * 3 : 0;
  shadowEll(ctx, wx, wy + 1, 6, 3, .35);
  if (XDRAW.poule) { ctx.save(); ctx.translate(wx, wy - hop); if (h.flip) ctx.scale(-1, 1); ctx.rotate(peck ? .25 : 0); drawSprite(ctx, getSprite('x', 'poule'), 0, 0, .4); ctx.restore(); return; }
  ctx.save(); ctx.translate(wx, wy - hop); if (h.flip) ctx.scale(-1, 1); ctx.rotate(peck ? .3 : 0); ctx.scale(.65, .65);
  ctx.lineWidth = 1.6; ctx.strokeStyle = '#2a1a10';
  ctx.fillStyle = '#c8743a'; ctx.beginPath(); ctx.ellipse(0, -9, 9, 7, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(7, -16, 4.6, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#d63a2a'; ctx.beginPath(); ctx.arc(7.5, -21, 2.2, 0, 7); ctx.fill();
  ctx.fillStyle = '#e9b949'; ctx.beginPath(); ctx.moveTo(11, -17); ctx.lineTo(15, -15.5); ctx.lineTo(11, -14); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#1a100c'; ctx.beginPath(); ctx.arc(8.5, -17, .9, 0, 7); ctx.fill();
  ctx.fillStyle = '#a85a2a'; ctx.beginPath(); ctx.ellipse(-8, -12, 4, 6, -.5, 0, 7); ctx.fill(); ctx.stroke();
  ctx.restore();
}
// branché sur la scène : les poules se dessinent avec le reste, triées par profondeur
function lifeDrawList(list, t) {
  if (Z !== EXT) return;
  updateHens(t);
  HENS.forEach(hs => hs.forEach(h => list.push({ d: cellKey(h.x, h.y), f: () => drawHen(h, t) })));
}

/* ---------- la forêt à racheter ---------- */
CMD.foret = () => {
  const c = forestCost(); if (!c) return 'Toute la forêt est déjà à toi';
  if (!canAfford(c)) return `Il te faut ${costText(c)}`;
  pay(c); extState().n++; S.mat += 4; dirty();
  addLog(`Parcelle de forêt achetée : les Jardins font maintenant ${W}×${extDepth()} cases (+4 🪵).`, 'ev');
  return null;
};
function openForest() {
  const c = forestCost();
  const m = openModal(`<h2>🌲 La forêt du Baron</h2>
    <p>Derrière tes Jardins pousse la forêt du Baron Pâlichon. Son notaire, Maître Grattepapier, veut bien t’en céder une parcelle de deux rangées d’arbres, « sans poser de questions, et surtout sans y répondre ».</p>
    ${c ? `<p>Prix : <b>${costText(c)}</b>. Tes diablotins abattent les arbres : <b>+4 🪵</b>.</p>` : '<p>Toute la forêt jusqu’au fond des Jardins est à toi. Agrandis les remparts du château pour que les Jardins s’élargissent encore.</p>'}
    <p class="hint">Jardins : ${W} × ${extDepth()} cases défrichées.</p>
    <div class="mfoot"><button class="sbtn" type="button" data-close>Plus tard</button>${c ? `<button class="sbtn pri" type="button" id="fBuy" ${canAfford(c) ? '' : 'disabled'}>🪓 Acheter la parcelle (${costText(c)})</button>` : ''}</div>`, { label: 'La forêt' });
  const b = m.querySelector('#fBuy'); if (b) b.addEventListener('click', () => { if (!run('foret')) return; sfx('chime'); closeModal(); afterChange(); CAM.user = false; fitCamera(); banner('🪓 La forêt recule !', `Tes Jardins font maintenant ${W} × ${extDepth()} cases.`, 2200); });
}

/* ---------- Grimoire et conseils ---------- */
Object.assign(WIKI, {
  caracteres: { cat: 'ames', t: 'Caractères et occupations', x: () => `<p>Chaque créature a <b>deux traits de caractère</b> et une petite manie (voir sa fiche). Son caractère décide de ce qu’elle fait de ses nuits : sieste, grignotage, lecture, forge, fête à la taverne, ménage, bavardages… Elle se sert des meubles du château : plus il y a de commodités, plus le donjon vit.</p>
    <ul>${TRAIT_ORDER.map(k => `<li>${TRAITS[k].ico} <b>${TRAITS[k].name}</b> : ${TRAITS[k].desc} S’épanouit avec : ${TRAITS[k].ok.toLowerCase()}.</li>`).join('')}</ul>
    <p>Un trait comblé donne <b>+6 d’épanouissement</b> ; certains manques coûtent un peu (−3). Les rivaux se chamaillent quand ils se croisent, les diablotins filent aux chantiers, les costauds surveillent le chemin des héros, et une créature tentée de partir va regarder la route. Ce qu’elle fait en ce moment s’affiche sur sa fiche.</p>` },
  jardins: { cat: 'build', t: 'Les Jardins (dehors)', x: () => `<p>Derrière les remparts, un coin d’herbe t’appartient : les <b>Jardins</b>. Va les voir avec le bouton <b>🌳 Dehors</b> (à côté des étages) ou la touche <b>J</b>. Tes créatures y sortent par le portillon quand l’envie les prend.</p>
    <p>On y bâtit des enclos, sans couloir ni mur : {room:poulailler} (la {sp:cocatrice}), {room:simples} (la {sp:mandragore}), {room:mare} (la {sp:nixe}) et {room:cimetiere} (la {sp:goule}). Bancs, puits et nains de jardin se posent directement sur l’herbe.</p>
    <p>Au début, l’espace est limité à quatre rangées. Le reste, c’est la <b>forêt du Baron</b> : clique dessus pour en racheter une parcelle de deux rangées (de plus en plus chère, avec du bois en prime). Agrandir les remparts élargit aussi les Jardins.</p>
    <p>Les héros n’y viennent jamais, et les Jardins ne comptent pas comme un étage.</p>` },
});
TIPS.push(
  { id: 'jardins0', when: () => S.night >= 4 && !S.rooms.some(r => zOf(r) === EXT) && !(S.tuto && S.tuto.on), t: 'Les Jardins', x: 'Derrière les remparts, un coin d’herbe t’attend : bouton « 🌳 Dehors » (ou touche J). Poulailler, mare, jardin des simples et cimetière y attirent d’autres créatures, et la forêt se rachète pour agrandir.', wiki: 'jardins' },
  { id: 'caractere0', when: () => S.creatures.length >= 4 && !(S.tuto && S.tuto.on), t: 'Chacun son caractère', x: 'Ouvre la fiche d’une créature : ses traits de caractère disent ce qu’elle aime faire, et ce qui l’épanouit. Observe-les : elles se servent de tes meubles.', wiki: 'caracteres' },
);
