
/* =========================================================
   Le monde autour du château : rayonnement, artefacts,
   la carte du Val en hexagones (brouillard de guerre, sites),
   d'où viennent les aventuriers, expéditions
   ========================================================= */

/* ---------- rayonnement ---------- */
const GLOW_LV = [[0, 'Obscur'], [20, 'Murmuré'], [45, 'Renommé'], [80, 'Illustre'], [130, 'Légendaire'], [200, 'Mythique']];
function glowParts() {
  const f = [], arts = S.furn.filter(x => FURN[x.t] && FURN[x.t].artefact);
  let a = 0; arts.forEach(x => { const r = roomAt(x.x, x.y, zOf(x)); a += FURN[x.t].glow * (r && r.t === 'reliquaire' ? 1.5 : 1); });
  if (arts.length) f.push([`${arts.length} artefact${arts.length > 1 ? 's' : ''} exposé${arts.length > 1 ? 's' : ''}`, Math.round(a)]);
  const tre = countItem('tasdor') * 3 + countItem('coffreor') * 2 + Math.min(10, Math.floor(S.gold / 25)); if (tre) f.push(['Trésors (tas d’or, coffres, réserves)', tre]);
  let rare = 0; S.creatures.forEach(c => { const d = SPECIES[c.sp] || {}; rare += d.rare ? 10 : d.tier >= 2 ? 4 : 0; }); if (rare) f.push(['Créatures rares', rare]);
  const leg = S.creatures.filter(c => c.legend).length * 5 + S.creatures.filter(c => c.lvl >= 5).length * 3; if (leg) f.push(['Légendes vivantes', leg]);
  if (S.tier) f.push([`Palier ${S.tier}`, S.tier * 8]);
  const fl = floorsDug(); if (fl) f.push([`${fl} étage${fl > 1 ? 's' : ''} en plus`, fl * 5]);
  if (S.size) f.push(['Remparts agrandis', S.size * 5]);
  const amb = Math.floor(ambiance() / 4); if (amb) f.push(['Ambiance', amb]);
  const hy = Math.min(25, Math.floor(S.hype / 3)); if (hy) f.push(['Notoriété', hy]);
  const ach = Object.keys(S.ach || {}).length; if (ach) f.push(['Hauts faits', ach]);
  return f;
}
const radiance = () => glowParts().reduce((a, x) => a + x[1], 0);
const glowLevel = (v = radiance()) => { let l = 0; GLOW_LV.forEach(([m], i) => { if (v >= m) l = i; }); return l; };
const glowRadius = (l = glowLevel()) => 2 + l;
// ce que le château voit de la carte autour de lui : son rayonnement, le belvédère, les gargouilles qui guettent
const visionRadius = () => Math.max(3, glowRadius()) + sumRooms('sight') + (S.creatures.some(c => SPECIES[c.sp].scout && !isOut(c)) ? 1 : 0) + (PW('carto') ? 1 : 0) + (typeof craftRank === 'function' && craftRank('bibli') >= 2 ? 1 : 0);

/* ---------- artefacts ---------- */
function ownedArtefacts() { return new Set([...S.furn.filter(f => FURN[f.t] && FURN[f.t].artefact).map(f => f.t), ...ARTEFACTS.filter(k => (S.free[k] || 0) > 0)]); }
function randomArtefact(pool = ARTEFACTS) { const own = ownedArtefacts(), left = pool.filter(k => !own.has(k)); return left.length ? pick(left) : null; }
function giveArtefact(k, how) { if (!k) return null; S.free[k] = (S.free[k] || 0) + 1; (S.world.found = S.world.found || {})[k] = S.night; addLog(`Artefact : ${FURN[k].name} (${how}).`, 'ev'); return k; }

/* ---------- la carte : génération ---------- */
const MAP_R = 10, SQ3 = Math.sqrt(3);
const HEX_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
const hdist = (q1, r1, q2 = 0, r2 = 0) => (Math.abs(q1 - q2) + Math.abs(q1 + r1 - q2 - r2) + Math.abs(r1 - r2)) / 2;
const BIOMES = {
  plaine: { name: 'Plaine', col: '#7fa356', cost: 1, desc: 'Des champs, des haies, des vaches qui regardent passer les aventuriers.' },
  lande: { name: 'Lande', col: '#9b8c5c', cost: 1, desc: 'Bruyère, vent et cailloux. On y croise surtout des moutons pessimistes.' },
  foret: { name: 'Forêt', col: '#4d7b3a', cost: 2, desc: 'Des arbres, des champignons, et des sentiers qui ne mènent nulle part.' },
  foretm: { name: 'Forêt enchantée', col: '#4d5f96', cost: 2, desc: 'Les arbres y chuchotent. Les champignons aussi, et ils ne sont pas aimables.' },
  colline: { name: 'Collines', col: '#a0935b', cost: 3, desc: 'Ça monte, ça descend. Les mollets des héros s’en souviennent.' },
  montagne: { name: 'Montagnes', col: '#8b8682', cost: 99, desc: 'Des pics infranchissables, sauf pour les chèvres et les dragons.' },
  marais: { name: 'Marais', col: '#62724f', cost: 4, desc: 'De la boue, des moustiques, et des crapauds qui chantent faux.' },
  lac: { name: 'Lac', col: '#3f709c', cost: 99, desc: 'De l’eau froide et profonde. Personne n’y nage, sauf ce qui y vit.' },
};
// les sites du Val : villages et villes (d'où partent les aventuriers), cibles de raid, donjons, lieux d'expédition
const SITE_KINDS = {
  chateau: { label: 'Ton château', ico: 'castle' },
  village: { label: 'Village', ico: 'village', rank: 1, shop: true, desc: 'Des paysans, une épicerie-buvette, et des apprentis héros qui rêvent de gloire. Ils viennent tenter leur chance quand ton château fait parler de lui.' },
  ville: { label: 'Ville', ico: 'town', rank: 2, shop: true, town: true, desc: 'Remparts, marchés, taverne et Guilde des Aventuriers Patentés. Ses aventuriers sont aguerris : ils viennent quand ton rayonnement atteint la ville.' },
  cite: { label: 'Cité', ico: 'city', rank: 3, shop: true, town: true, desc: 'La grande cité du Val et sa Guilde des Héros. Ses champions sont légendaires… et ne se déplacent que pour les châteaux qui rayonnent jusqu’à elle.' },
  raid: { label: 'Cible de raid', ico: 'raid' },
  rival: { label: 'Donjon rival', ico: 'dungeon' },
  joueur: { label: 'Donjon d’un Maître', ico: 'player' },
  foret: { label: 'Forêt enchantée', ico: 'forest', expe: true },
  grotte: { label: 'Grotte', ico: 'cave', expe: true },
  ruines: { label: 'Ruines', ico: 'ruins', expe: true },
  pic: { label: 'Pic du dragon', ico: 'peak', expe: true },
  lac: { label: 'Lac', ico: 'lake', expe: true },
};
const VILLAGE_NAMES = ['Trou-les-Choux', 'Patelin-sur-Bouse', 'Montcouic', 'Les Trois-Navets', 'Vieille-Galoche', 'Saint-Glinglin-du-Bas', 'Fouillis-le-Haut', 'Moulinsec'];
// expéditions : où l'on envoie ses créatures, ce qu'elles peuvent en rapporter, qui elles peuvent y rencontrer
const EXPE_SITES = {
  foret: { tag: 'magie', nights: 2, loot: { s: 3 }, arts: ['harpe', 'baton', 'miroir'], meet: 'fee', story: ['une nuit à danser avec les lucioles', 'une course-poursuite avec un champignon vexé'] },
  grotte: { tag: 'ruse', nights: 2, loot: { s: 4, g: 2 }, arts: ['cranecristal', 'oeufbasilic'], meet: 'golem', story: ['des pierres qui brillent dans le noir, rapportées en souvenir', 'trois jours perdus dans les échos (pour deux nuits d’absence)'] },
  ruines: { tag: 'ruse', nights: 2, loot: { g: 4 }, arts: ['couronne', 'sablier', 'potdechambre', 'heaume'], meet: 'liche', story: ['des fouilles sous l’œil d’une liche qui grelotte', 'un piège vieux de mille ans, heureusement rouillé'] },
  pic: { tag: 'combat', risk: 1, nights: 3, loot: { g: 6, h: 2 }, arts: ['dentdragon', 'epeefaux'], meet: 'harpie', story: ['l’ascension jusqu’au nid d’une harpie qui chante faux', 'une descente express, un vieux dragon aux trousses'] },
  lac: { tag: 'magie', nights: 2, loot: { cal: 2, s: 2 }, arts: ['miroir', 'grimoire'], story: ['une pêche aux poissons aveugles dans la brume', 'une longue conversation avec la brume, qui n’a rien répondu'] },
};
const vh = (x, y, s) => { const n = Math.sin(x * 127.1 + y * 311.7 + s * 74.7) * 43758.5453; return n - Math.floor(n); };
function vnoise(x, y, s) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi, u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = vh(xi, yi, s), b = vh(xi + 1, yi, s), c = vh(xi, yi + 1, s), d = vh(xi + 1, yi + 1, s);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
const fbm = (x, y, s) => vnoise(x, y, s) * .58 + vnoise(x * 2.1, y * 2.1, s + 9) * .29 + vnoise(x * 4.3, y * 4.3, s + 17) * .13;
let WORLD = null;
function genWorld(seed) {
  const R = rng(seed), list = [], at = new Map(), sk = seed % 997;
  for (let q = -MAP_R; q <= MAP_R; q++) for (let r = -MAP_R; r <= MAP_R; r++) {
    if (hdist(q, r) > MAP_R) continue;
    const x = SQ3 * (q + r / 2), y = 1.5 * r, e = fbm(x * .17 + sk, y * .17, 1), m = fbm(x * .2, y * .2 + sk, 2);
    const t = e < .33 ? 'lac' : e > .68 ? 'montagne' : e > .6 ? 'colline' : m > .62 && e < .45 ? 'marais' : m > .54 ? 'foret' : m < .38 ? 'lande' : 'plaine';
    const c = { q, r, i: list.length, t, e, m }; list.push(c); at.set(q + ',' + r, c);
  }
  const cell = (q, r) => at.get(q + ',' + r);
  const ring = (q, r, n) => list.filter(c => hdist(c.q, c.r, q, r) <= n);
  ring(0, 0, 1).forEach(c => { if (c.t === 'lac' || c.t === 'montagne' || c.t === 'marais') c.t = 'plaine'; });
  cell(0, 0).t = 'colline';
  const sites = [], used = new Set([0 + ',' + 0]);
  const add = (kind, c, o = {}) => { const s = { id: o.id || kind + sites.length, kind, name: o.name || SITE_KINDS[kind].label, q: c.q, r: c.r, i: c.i, ...o }; c.site = s; sites.push(s); used.add(c.q + ',' + c.r); return s; };
  add('chateau', cell(0, 0), { id: 'home', name: 'Ton château' });
  const far = (c, n) => sites.every(s => hdist(c.q, c.r, s.q, s.r) >= n);
  // place un site entre dmin et dmax cases, sur un bon terrain, loin des autres ; angle pour bien répartir
  const spot = (dmin, dmax, ok, ang, gap = 2) => {
    let cands = list.filter(c => { const d = hdist(c.q, c.r); return d >= dmin && d <= dmax && !used.has(c.q + ',' + c.r) && ok(c) && far(c, gap); });
    if (!cands.length) cands = list.filter(c => { const d = hdist(c.q, c.r); return d >= dmin && d <= dmax + 2 && !used.has(c.q + ',' + c.r) && c.t !== 'lac' && far(c, 1); });
    if (!cands.length) return null;
    if (ang != null) { const dA = c => { let d = Math.abs(Math.atan2(1.5 * c.r, SQ3 * (c.q + c.r / 2)) - ang) % (2 * Math.PI); return Math.min(d, 2 * Math.PI - d); }; cands.sort((a, b) => dA(a) - dA(b) + (R() - .5) * .3); return cands[0]; }
    return cands[Math.floor(R() * cands.length)];
  };
  const land = c => !['lac', 'montagne', 'marais'].includes(c.t);
  const a0 = R() * Math.PI * 2, names = VILLAGE_NAMES.slice().sort(() => R() - .5);
  const vill = [3, 4, 5, 6, 8].map((d, i) => { const c = spot(d, d + 1, land, a0 + i * 2 * Math.PI / 5); return c && add('village', c, { id: 'v' + i, name: names[i], rank: 1 }); }).filter(Boolean);
  const town = spot(6, 7, land, a0 + Math.PI * .45, 3); if (town) add('ville', town, { id: 'ville', name: 'Bourg-Ripaille', rank: 2 });
  const city = spot(9, 10, land, a0 + Math.PI * 1.35, 3); if (city) add('cite', city, { id: 'cite', name: 'Mirebrume', rank: 3 });
  const near = vill[0] || { q: 0, r: 0 };
  const raidSite = (k, dmin, dmax, ok = land) => { const c = spot(dmin, dmax, ok, null, 1); if (c) add('raid', c, { id: k, name: RAIDS[k].name, raid: k }); };
  { const c = spot(2, 2, x => land(x) && hdist(x.q, x.r, near.q, near.r) <= 3, null, 1) || spot(2, 3, land, null, 1); if (c) add('raid', c, { id: 'ferme', name: RAIDS.ferme.name, raid: 'ferme' }); }
  raidSite('moulin', 3, 4); raidSite('auberge', 4, 5); raidSite('monastere', 5, 7, x => land(x) && (x.t === 'colline' || x.t === 'lande' || R() < .3));
  { const c = town ? spot(1, 10, x => land(x) && hdist(x.q, x.r, town.q, town.r) === 2, null, 1) : null; if (c) add('raid', c, { id: 'chateau', name: RAIDS.chateau.name, raid: 'chateau' }); else raidSite('chateau', 6, 8); }
  RIVALS.forEach((rv, i) => { const c = spot(5, 9, land, a0 + Math.PI / 4 + i * Math.PI / 2, 3); if (c) add('rival', c, { id: rv.id, name: rv.name, rival: rv.id }); });
  const fo = spot(4, 8, c => c.t === 'foret' || c.t === 'plaine', a0 + Math.PI, 2); if (fo) { ring(fo.q, fo.r, 1).forEach(c => { if (c.t !== 'lac' && !c.site) c.t = 'foretm'; }); fo.t = 'foretm'; add('foret', fo, { id: 'foret', name: 'Bois-Murmure', expe: 'foret' }); }
  [['grotte', 'Grotte des Échos', 3, 6], ['grotte', 'Grotte Gouttière', 6, 9]].forEach(([k, n, a, b], i) => { const c = spot(a, b, x => x.t === 'colline' || x.t === 'lande' || x.t === 'foret', null, 2); if (c) add('grotte', c, { id: 'grotte' + i, name: n, expe: 'grotte' }); });
  [['Ruines de Vieille-Tour', 4, 7], ['Temple englouti', 7, 10]].forEach(([n, a, b], i) => { const c = spot(a, b, land, null, 2); if (c) add('ruines', c, { id: 'ruines' + i, name: n, expe: 'ruines' }); });
  const pk = spot(7, 10, c => c.t === 'montagne' || c.t === 'colline', null, 2); if (pk) { pk.t = 'montagne'; ring(pk.q, pk.r, 1).forEach(c => { if (!c.site && c.t !== 'lac' && R() < .6) c.t = 'montagne'; }); add('pic', pk, { id: 'pic', name: 'Pic du Vieux-Ronchon', expe: 'pic' }); }
  const lk = spot(3, 8, c => c.t === 'lac' || c.e < .4, null, 2); if (lk) { lk.t = 'lac'; add('lac', lk, { id: 'lac', name: 'Lac des Brumes', expe: 'lac' }); }
  // routes : chaque village et chaque ville a son chemin jusqu'au château (A*, montagnes et lacs infranchissables)
  const roads = new Map(), onRoad = new Set();
  const path = (from, to) => {
    const key = c => c.i, open = [[0, from]], g = new Map([[from.i, 0]]), prev = new Map();
    while (open.length) {
      open.sort((a, b) => a[0] - b[0]); const [, c] = open.shift(); if (c === to) break;
      for (const [dq, dr] of HEX_DIRS) { const n = cell(c.q + dq, c.r + dr); if (!n) continue; const tc = n === to ? 1 : onRoad.has(n.i) ? .5 : BIOMES[n.t].cost; if (tc >= 99) continue;
        const ng = g.get(c.i) + tc; if (ng < (g.has(n.i) ? g.get(n.i) : Infinity)) { g.set(n.i, ng); prev.set(n.i, c); open.push([ng + hdist(n.q, n.r, to.q, to.r), n]); } }
    }
    if (!prev.has(to.i) && to !== from) return null;
    const p = [to.i]; let c = to; while (c !== from) { c = prev.get(c.i); p.unshift(c.i); } return p;
  };
  sites.filter(s => SITE_KINDS[s.kind].rank).sort((a, b) => hdist(a.q, a.r) - hdist(b.q, b.r)).forEach(s => { const p = path(list[s.i], cell(0, 0)); if (p) { roads.set(s.id, p.slice().reverse()); p.forEach(i => onRoad.add(i)); } });
  return { seed, list, at, cell, sites, roads, onRoad };
}
function world() {
  if (!S.world) S.world = newWorldState();   // une nouvelle partie : un Val tiré au sort (version 2)
  if (!WORLD || WORLD.seed !== S.world.seed || (WORLD.gen || 1) !== (S.world.gen || 1)) { WORLD = S.world.gen === 2 ? genWorld2(S.world.seed) : genWorld(S.world.seed); WORLD.knownSet = null; }
  if (!WORLD.knownSet || WORLD.knownN !== S.world.known.length) { WORLD.knownSet = new Set(S.world.known); WORLD.knownN = S.world.known.length; }
  return WORLD;
}
const siteById = id => world().sites.find(s => s.id === id);
// une case est visible si on l'a découverte, ou si elle est à portée du château
function visibleSet() {
  const w = world(), vr = visionRadius(), set = new Set(w.knownSet);
  w.list.forEach(c => { if (hdist(c.q, c.r) <= vr) set.add(c.i); });
  return set;
}
const siteKnown = s => !!s && visibleSet().has(s.i);
function discover(idx, why) {
  const w = world(), vis = visibleSet(); let n = 0; const found = [];
  idx.forEach(i => { if (i == null || w.knownSet.has(i)) return; S.world.known.push(i); w.knownSet.add(i); n++; if (!vis.has(i) && w.list[i].site) found.push(w.list[i].site); });
  w.knownN = S.world.known.length; if (n && typeof mapDirty === 'function') mapDirty();
  found.forEach(s => addLog(`Carte : tu découvres ${s.name}${why ? ' (' + why + ')' : ''}.`, 'ev'));
  return { n, found };
}
const discAround = (q, r, n) => world().list.filter(c => hdist(c.q, c.r, q, r) <= n).map(c => c.i);
const worldMet = sp => !!(S.world && S.world.met && S.world.met[sp]);
// cibles de raid connues (il faut avoir découvert l'endroit sur la carte)
function raidKnown(k) { if (RAIDS[k] && RAIDS[k].siege) { const c = world().sites.find(x => x.kind === 'cite'); return typeof allVassals === 'function' && allVassals() && !!c && siteKnown(c); } const s = world().sites.find(x => x.raid === k || (RAIDS[k] && RAIDS[k].rival && x.rival === RAIDS[k].rival)); return !s || siteKnown(s); }
RIVALS.forEach(rv => { RAIDS['r_' + rv.id] = { name: rv.name, emo: rv.emo, tier: 1, risk: 2, tag: 'combat', reward: { g: 5, s: 2 }, hype: 3, menace: 1, rival: rv.id, desc: `Le donjon ${deM(rv.master)} : une expédition de 4 créatures, trois étages et un boss. De quoi le soumettre, et en rapporter une relique.` }; });

/* ---------- les aventuriers viennent des villages et des villes à portée de rayonnement ---------- */
function heroOrigin() {
  if (!S || !S.started) return null;
  const w = world(), reach = glowRadius() + 1, vc = S.vic;
  // la croisade de Mirebrume (victoire de Légende) : ce sont ses héros qui viennent
  if (vc && vc.croisade && vc.croisade.done < 3 && !vc.won.legende) { const c = w.sites.find(s => s.kind === 'cite'); if (c) return { id: c.id, name: c.name, rank: 3, q: c.q, r: c.r, crusade: true }; }
  // les villages qui t'aiment bien (bonne volonté 70 ou plus) n'envoient plus d'aventuriers
  const cands = w.sites.filter(s => s.rank && hdist(s.q, s.r) <= reach && !(typeof gwOf === 'function' && gwOf(s) >= 70));
  if (!cands.length) { const v = w.sites.filter(s => s.rank === 1).sort((a, b) => hdist(a.q, a.r) - hdist(b.q, b.r))[0]; return v ? { id: v.id, name: v.name, rank: 1, q: v.q, r: v.r } : { rank: 1, name: 'un hameau voisin' }; }
  let s = S.world.next && cands.find(x => x.id === S.world.next);
  if (!s) { const top = Math.max(...cands.map(x => x.rank)); s = Math.random() < .55 ? pick(cands.filter(x => x.rank === top)) : pick(cands); S.world.next = s.id; }
  return { id: s.id, name: s.name, rank: s.rank, q: s.q, r: s.r };
}
// après une invasion : carnets de route perdus (la carte se dévoile), artefacts abandonnés… ou volés
function worldAfterInvasion(plan, outcome, lines) {
  const o = plan.origin, w = world();
  if (outcome !== 'robbed') {
    if (o && o.id) {
      const road = w.roads.get(o.id) || [], d = discover([...road, ...discAround(o.q, o.r, 1)], 'carnets d’aventuriers');
      S.world.notes++;
      if (d.n) lines.push(['📜', `Dans leur fuite, ils perdent leurs carnets de route : la route depuis ${o.name} apparaît sur ta carte${d.found.length ? ` (${d.found.map(s => s.name).join(', ')})` : ''} !`, 'good']);
    }
    const ch = { 1: .08, 2: .3, 3: .6 }[plan.rank || 1];
    if (outcome === 'repelled' && Math.random() < ch) { const k = giveArtefact(randomArtefact(), 'abandonné par des héros'); if (k) lines.push(['🏺', `Un héros a laissé tomber un artefact : ${FURN[k].name} ! Il t’attend dans l’onglet Trésors.`, 'good']); }
  } else {
    const ground = PW('collec') ? [] : S.furn.filter(f => FURN[f.t] && FURN[f.t].artefact && zOf(f) === 0);
    if (ground.length) { const f = pick(ground); S.furn = S.furn.filter(x => x !== f); (S.world.stolen = S.world.stolen || []).push(f.t); lines.push(['🏺', `Ils emportent aussi ${FURN[f.t].name} ! On le reverra peut-être chez un brocanteur… Les artefacts gardés aux étages ne craignent rien.`, 'bad']); }
  }
  if (typeof victoryAfterInvasion === 'function') victoryAfterInvasion(plan, outcome, lines);
  S.world.next = null; S.world.decoy = false;
}
// un raid réussi contre un donjon rival ternit sa réputation
function worldAfterRaid(target, roll, lines) {
  const tg = RAIDS[target]; if (!tg) return;
  if (typeof victoryAfterRaid === 'function') victoryAfterRaid(target, roll, lines || []);
  if (tg.rival && roll.res !== 'fail') S.world.hit[tg.rival] = S.night + 6;
  const s = world().sites.find(x => x.raid === target || (tg.rival && x.rival === tg.rival)); if (s) discover(discAround(s.q, s.r, 1), 'raid');
}

/* ---------- expéditions ---------- */
const expeNights = s => (EXPE_SITES[s.expe] ? EXPE_SITES[s.expe].nights : 1) + (hdist(s.q, s.r) >= 8 ? 1 : 0);
function expeReady(s) { return !S.world.cd[s.id] || S.night >= S.world.cd[s.id]; }
function startExpedition(siteId, ids, scoutHex) {
  const w = world(), s = siteId ? siteById(siteId) : null, team = [...new Set(ids || [])].slice(0, 2).map(critter).filter(c => c && !isOut(c));
  if (!team.length) return 'Choisis au moins une créature';
  if (s) { if (!s.expe) return 'On ne part pas en expédition ici'; if (!siteKnown(s)) return 'Lieu inconnu'; if (!expeReady(s)) return `Encore ${S.world.cd[s.id] - S.night} nuit(s) avant d’y retourner`; }
  else { const c = w.list[scoutHex]; if (!c || visibleSet().has(c.i)) return 'Choisis une terre inconnue'; if (!HEX_DIRS.some(([dq, dr]) => { const n = w.cell(c.q + dq, c.r + dr); return n && visibleSet().has(n.i); })) return 'Trop loin : choisis une case au bord du brouillard'; team.length = 1; }
  const nights = s ? expeNights(s) : 1, gid = 'x' + S.seq++;
  team.forEach(c => { if (S.raid) S.raid.team = S.raid.team.filter(id => id !== c.id); c.raid = true; c.away = nights; c.awayUntil = S.night + nights; c.post = null; c.expe = { gid, site: s ? s.id : null, hex: s ? null : scoutHex, n: S.night }; critterLeave(c.id); });
  if (s) S.world.cd[s.id] = S.night + nights + 2;
  addLog(s ? `Expédition vers ${s.name} : ${team.map(c => c.name).join(', ')}.` : `${team[0].name} part en éclaireur dans le brouillard.`, 'ev');
  return null;
}
// au matin, les expéditions rentrent
function worldDawn(report) {
  if (!S.world) return;
  const out = [], groups = new Map();
  S.creatures.forEach(c => { if (c.expe && S.night + 1 >= c.awayUntil) { const g = groups.get(c.expe.gid) || []; g.push(c); groups.set(c.expe.gid, g); } });
  groups.forEach(team => {
    const e = team[0].expe, w = world();
    team.forEach(c => { c.away = 0; c.awayUntil = 0; c.raid = false; c.back = true; delete c.expe; });
    if (e.req) { if (typeof reqDawn === 'function') reqDawn(team, e, out); return; }
    if (!e.site) {   // éclaireur
      const c = w.list[e.hex], d = c ? discover(discAround(c.q, c.r, 2), 'éclaireur') : { n: 0, found: [] }, g = Math.random() < .3 ? 2 + rnd(3) : 0; S.gold += g;
      team.forEach(x => { gainXP(x, 1, out); addLoy(x, 2); });
      out.push(['🔭', `${team[0].name} revient de son exploration : ${d.n} case${d.n > 1 ? 's' : ''} découverte${d.n > 1 ? 's' : ''}${d.found.length ? `, dont ${d.found.map(s => s.name).join(', ')}` : ''}${g ? `, et ${g} 💰 trouvés dans un vieux sac` : ''}.`, 'good']);
      return;
    }
    const s = siteById(e.site), X = EXPE_SITES[s.expe] || {}, pool = Math.max(1, team.reduce((a, c) => a + diceOf(c) + ((SPECIES[c.sp] || {}).tag === X.tag ? 1 : 0) + (c.lvl >= 4 ? 1 : 0), 0) - (X.risk || 0));
    const roll = rollPool(pool), names = team.map(c => c.name).join(' et '), ok = roll.res !== 'fail', big = roll.res === 'crit' || roll.res === 'full';
    const gains = [];
    if (ok) {
      const k = roll.res === 'partial' ? .5 : roll.res === 'crit' ? 1.5 : 1, L = X.loot || {};
      const g = Math.ceil((L.g || 0) * k), m = Math.ceil((L.s || 0) * k), h = Math.ceil((L.h || 0) * k);
      S.gold += g; S.mat += m; S.hype += h; if (L.cal) S.calamity = Math.max(0, S.calamity - L.cal);
      if (g || m || h) gains.push(costText({ g, s: m }) + (h ? `, +${h} 🔥` : '')); if (L.cal) gains.push(`−${L.cal} Calamité`);
      if (big && (roll.res === 'crit' || Math.random() < .4)) { const a = giveArtefact(randomArtefact(X.arts) || randomArtefact(), 'expédition'); if (a) gains.push(`l’artefact « ${FURN[a].name} »`); }
      if (big && X.meet && !worldMet(X.meet)) { S.world.met[X.meet] = S.night; gains.push(`une rencontre : ${SPECIES[X.meet].name}, qui viendra s’installer si ton château rayonne à ${SPECIES[X.meet].glow} ✨ et lui offre sa pièce`); }
      team.forEach(c => { gainXP(c, 2, out); addLoy(c, 4); });
      if (roll.res === 'partial') { const c = pick(team); c.mood = clamp(c.mood - 1, 0, 5); }
    } else team.forEach(c => { c.mood = clamp(c.mood - 1, 0, 5); addLoy(c, -2); gainXP(c, 1, out); });
    S.stats.expeditions++;
    discover(discAround(s.q, s.r, 2), 'expédition');
    const pl = team.length > 1;
    out.push([ok ? '🧭' : '💨', `${names} ${pl ? 'reviennent' : 'revient'} de ${s.name} : ${pick(X.story || ['une drôle d’aventure'])} (dés : ${roll.dice.join(', ')}). ${ok ? (pl ? 'Ils rapportent : ' : 'Rapporte : ') + (gains.join(', ') || 'de bons souvenirs') + '.' : pl ? 'Bredouilles et vexés.' : 'Bredouille et vexé·e.'}`, ok ? 'good' : 'bad']);
  });
  if (out.length) { report.push(['sec', 'Expéditions']); out.forEach(l => report.push(l)); }
  // les rivaux attaqués retrouvent leur superbe ; les vols oubliés reviennent chez le brocanteur
  Object.keys(S.world.hit).forEach(k => { if (S.world.hit[k] <= S.night) delete S.world.hit[k]; });
}

/* ---------- commandes et migration des vieilles parties ---------- */
Object.assign(CMD, {
  expe(a) { return startExpedition(a.site, a.team); },
  scout(a) { return startExpedition(null, a.team, a.hex | 0); },
});
function worldInit() {
  if (!S || !S.started) return;
  const fresh = !S.world; world();
  if (fresh && S.night > 1) {   // partie commencée avant la carte : on offre les cibles de raid déjà connues
    const w = world(); discover(w.sites.filter(s => s.raid || (s.rank === 1 && hdist(s.q, s.r) <= 5)).flatMap(s => [s.i, ...(w.roads.get(s.id) || [])]));
  }
}
