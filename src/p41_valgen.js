/* =========================================================
   Le Val, tiré au sort à chaque nouvelle partie (version 2)
   Le relief vient d'un bruit fractal déformé, avec des crêtes
   pour les chaînes de montagnes ; la mer ronge un ou deux côtés
   (ou aucun), les creux deviennent des lacs, des rivières
   descendent des montagnes, forêts et marais poussent là où
   c'est humide. Puis chaque lieu se pose là où il a du sens
   (le moulin sur une rivière, la cité au bord de l'eau, la Mère
   des marais dans les marais…) et reçoit un nom tiré au sort.
   Les parties commencées avant gardent leur carte (genWorld).
   ========================================================= */
const WORLD_GEN = 2;
BIOMES.mer = { name: 'Mer', col: '#2f5b86', cost: 99, desc: 'La mer, grise et froide. Les héros y perdent leurs bottes, et les mouettes leur patience.' };
const newWorldState = seed => ({ seed: seed || 1 + Math.floor(Math.random() * 1e9), gen: WORLD_GEN, known: [], met: {}, cd: {}, hit: {}, found: {}, notes: 0 });

// des noms de lieux, assemblés au hasard (les anciens noms du Val en font partie)
const VAL_NAMES = {
  vOne: ['Montcouic', 'Moulinsec', 'Pétaouchnok', 'Tripatouille', 'Grosbidon', 'Ventrebleu', 'Bourrichon', 'Patatras', 'Clapotis', 'Gribouillis', 'Saint-Glinglin-du-Bas', 'Fouillis-le-Haut', 'Vieille-Galoche', 'Les Trois-Navets'],
  vHead: ['Trou', 'Patelin', 'Fouillis', 'Clapier', 'Bourbier', 'Croquant', 'Gratte', 'Bouillon', 'Hameau', 'Fond', 'Moulin', 'Pré', 'Saint-Glinglin', 'Sainte-Chaussette', 'Saint-Navet', 'Vieux-Sabot'],
  vLes: ['Choux', 'Navets', 'Galoches', 'Pantoufles', 'Grenouilles', 'Courges', 'Cornichons', 'Poireaux', 'Moutons', 'Biquettes', 'Pissenlits', 'Rutabagas', 'Tartines', 'Brouettes'],
  vSur: ['Bouse', 'Gadoue', 'Marmite', 'Brouette', 'Mare', 'Colline', 'Pente', 'Flaque', 'Vase'],
  foret: ['Bois-Murmure', 'Bois-Chuchote', 'Bois-Ronchon', 'Bois-Grimace', 'Bois-Lanterne', 'Bois-Ronfleur', 'Forêt des Lucioles', 'Forêt des Mille Yeux', 'Forêt des Champignons Vexés', 'Sylve-Soupir'],
  grotte: ['Grotte des Échos', 'Grotte Gouttière', 'Grotte des Ronflements', 'Grotte des Mille Pattes', 'Caverne Bavarde', 'Antre du Vieux Caillou', 'Grotte des Courants d’air', 'Gouffre Chuchoteur', 'Grotte Tintinnabulante'],
  ruines: ['Ruines de Vieille-Tour', 'Temple englouti', 'Abbaye effondrée', 'Tour tordue', 'Colonnes oubliées', 'Ruines de Castel-Branlant', 'Ruines de Pierre-Penchée', 'Palais des Courants d’air', 'Crypte du Roi Distrait'],
  lac: ['Lac des Brumes', 'Lac des Soupirs', 'Étang des Reflets', 'Lac des Brochets Ronchons', 'Étang de la Vase Dormante', 'Lac Miroir', 'Lac des Grenouilles Chanteuses'],
  pic: ['Pic du Vieux-Ronchon', 'Pic du Dragon Grincheux', 'Pic du Mal-Luné', 'Mont Courant-d’air', 'Dent du Vieux Lézard', 'Pic des Bourrasques'],
};
function valName(kind, R, used) {
  const pickR = L => L[Math.floor(R() * L.length)];
  for (let k = 0; k < 30; k++) {
    let n;
    if (kind === 'village') { const t = R(); n = t < .3 ? pickR(VAL_NAMES.vOne) : t < .68 ? `${pickR(VAL_NAMES.vHead)}-les-${pickR(VAL_NAMES.vLes)}` : `${pickR(VAL_NAMES.vHead)}-${R() < .7 ? 'sur' : 'sous'}-${pickR(VAL_NAMES.vSur)}`; }
    else n = pickR(VAL_NAMES[kind]);
    if (!used.has(n)) { used.add(n); return n; }
  }
  return kind + used.size;
}

function genWorld2(seed) {
  const R = rng(seed), list = [], at = new Map();
  const off = () => R() * 400, O = Array.from({ length: 10 }, off);
  const fe = .1 + R() * .06, fm = .12 + R() * .07;                         // la taille des reliefs change d'une partie à l'autre
  const style = R(), seaA = R() * Math.PI * 2, seaA2 = seaA + Math.PI * (.6 + R() * .8);
  const sea1 = style < .25 ? 0 : .5 + R() * .4, sea2 = style > .78 ? .4 + R() * .35 : 0;   // pas de mer, un rivage, ou deux
  for (let q = -MAP_R; q <= MAP_R; q++) for (let r = -MAP_R; r <= MAP_R; r++) {
    if (hdist(q, r) > MAP_R) continue;
    const x = SQ3 * (q + r / 2), y = 1.5 * r, d = hdist(q, r) / MAP_R, ang = Math.atan2(y, x);
    const X = x + (fbm(x * .08 + O[0], y * .08 + O[1], 3) - .5) * 7, Y = y + (fbm(x * .08 + O[2], y * .08 + O[3], 4) - .5) * 7;   // le monde se tord un peu
    let e = fbm(X * fe + O[4], Y * fe + O[5], 1);
    const ridge = 1 - Math.abs(2 * fbm(X * fe * 1.25 + O[6], Y * fe * 1.25 + O[7], 5) - 1);   // 1 sur les crêtes : des chaînes de montagnes
    e += Math.pow(ridge, 4) * .3;
    const coast = (A, amt) => amt ? amt * Math.max(0, Math.cos(ang - A)) * Math.max(0, d - .3) * 1.4 : 0;
    e -= coast(seaA, sea1) + coast(seaA2, sea2);
    const hill = Math.max(0, 1 - d * 3.5); e = e * (1 - hill) + .56 * hill;   // la colline du château, au milieu
    const c = { q, r, i: list.length, e, m: fbm(X * fm + O[8], Y * fm + O[9], 2), x, y, d: hdist(q, r) }; list.push(c); at.set(q + ',' + r, c);
  }
  const cell = (q, r) => at.get(q + ',' + r), nb = c => HEX_DIRS.map(([dq, dr]) => cell(c.q + dq, c.r + dr)).filter(Boolean);
  const ring = (q, r, n) => list.filter(c => hdist(c.q, c.r, q, r) <= n);
  const qt = (key, p) => { const s = list.map(c => c[key]).sort((a, b) => a - b); return s[Math.max(0, Math.min(s.length - 1, Math.floor(p * (s.length - 1))))]; };
  // l'eau : la mer touche le bord du monde ; les autres creux sont des lacs
  const hasSea = sea1 > 0, tWater = qt('e', hasSea ? .13 + R() * .12 : .045 + R() * .03), tLake = qt('e', .05);
  const low = c => c.e < tWater && c.d > 2;
  if (hasSea) { const st = list.filter(c => c.d === MAP_R && low(c)), seen = new Set(st.map(c => c.i)); while (st.length) { const c = st.pop(); c.t = 'mer'; nb(c).forEach(n => { if (!seen.has(n.i) && low(n)) { seen.add(n.i); st.push(n); } }); } }
  list.forEach(c => { if (!c.t && c.e < Math.min(tWater, tLake) && c.d > 2) c.t = 'lac'; });
  const water = c => c.t === 'mer' || c.t === 'lac';
  const tMount = qt('e', 1 - (.07 + R() * .05)), tHill = qt('e', 1 - (.17 + R() * .07));
  // les rivières : elles naissent en hauteur et descendent jusqu'à la mer, un lac ou le bord du monde
  const rivers = [], onRiver = new Set();
  const srcs = list.filter(c => !water(c) && c.e >= tHill && c.d >= 3).sort((a, b) => b.e - a.e), nR = 1 + Math.floor(R() * 3) + (hasSea ? 1 : 0);
  for (const s of srcs) {
    if (rivers.length >= nR) break;
    if (rivers.some(p => p.some(i => hdist(list[i].q, list[i].r, s.q, s.r) < 4))) continue;
    const p = [s.i], seen = new Set([s.i]); let c = s, end = false;
    for (let k = 0; k < 30 && !end; k++) {
      const opts = nb(c).filter(n => !seen.has(n.i) && n.d > 1).sort((a, b) => (a.e + R() * .015) - (b.e + R() * .015)), n = opts[0];
      if (!n || n.e > c.e + .015) { if (p.length >= 4 && c.d > 2 && !water(c)) { c.t = 'lac'; } break; }   // un creux : la rivière y fait un petit lac
      p.push(n.i); seen.add(n.i); c = n;
      if (water(n) || onRiver.has(n.i) || n.d === MAP_R) end = true;
    }
    if (p.length >= 4) { rivers.push(p); p.forEach(i => { if (!water(list[i])) { onRiver.add(i); list[i].river = 1; } }); }
  }
  // la terre : relief d'abord, puis l'humidité (plus forte au bord de l'eau)
  const wet = c => c.m + (c.river || nb(c).some(water) ? .06 : 0);
  list.forEach(c => { c.w = wet(c); });
  const land = list.filter(c => !water(c)), lq = p => { const s = land.map(c => c.w).sort((a, b) => a - b); return s[Math.floor(p * (s.length - 1))]; };
  // le climat du Val : boisé, sec, marécageux ou tempéré
  const clim = R(), fS = clim < .3 ? .36 + R() * .1 : clim < .55 ? .14 + R() * .06 : .22 + R() * .08, lS = clim >= .3 && clim < .55 ? .24 + R() * .1 : .07 + R() * .07, mS = clim > .85 ? .14 + R() * .06 : .05 + R() * .03;
  const tMarsh = lq(1 - mS), tForest = lq(1 - mS - fS), tLande = lq(lS), tLow = qt('e', clim > .85 ? .55 : .42);
  land.forEach(c => { c.t = c.e >= tMount ? 'montagne' : c.e >= tHill ? 'colline' : c.w >= tMarsh && c.e < tLow ? 'marais' : c.w >= tForest ? 'foret' : c.w <= tLande ? 'lande' : 'plaine'; });
  ring(0, 0, 1).forEach(c => { c.river = 0; if (['lac', 'mer', 'montagne', 'marais'].includes(c.t)) c.t = 'plaine'; }); cell(0, 0).t = 'colline';
  // on ne laisse pas un coin du Val coupé du château : un col traverse la montagne
  const passable = c => BIOMES[c.t].cost < 99, reach = () => { const S0 = new Set([cell(0, 0).i]), st = [cell(0, 0)]; while (st.length) { const c = st.pop(); nb(c).forEach(n => { if (!S0.has(n.i) && passable(n)) { S0.add(n.i); st.push(n); } }); } return S0; };
  for (let k = 0; k < 6; k++) {
    const rc = reach(), lost = list.filter(c => passable(c) && !rc.has(c.i)); if (lost.length < 3) break;
    const to = lost.sort((a, b) => a.d - b.d)[0], prev = new Map([[cell(0, 0).i, null]]), open = [[0, cell(0, 0)]], g = new Map([[cell(0, 0).i, 0]]);
    while (open.length) { open.sort((a, b) => a[0] - b[0]); const [, c] = open.shift(); if (c === to) break; nb(c).forEach(n => { if (water(n)) return; const ng = g.get(c.i) + (n.t === 'montagne' ? 6 : 1); if (ng < (g.has(n.i) ? g.get(n.i) : 1e9)) { g.set(n.i, ng); prev.set(n.i, c); open.push([ng + hdist(n.q, n.r, to.q, to.r), n]); } }); }
    if (!prev.has(to.i)) break; let c = to; while (c) { if (c.t === 'montagne') c.t = 'colline'; c = prev.get(c.i); }
  }
  const rc = reach();
  // les lieux, là où ils ont du sens
  const sites = [], used = new Set(), names = new Set();
  const add = (kind, c, o = {}) => { const s = { id: o.id || kind + sites.length, kind, name: o.name || SITE_KINDS[kind].label, q: c.q, r: c.r, i: c.i, ...o }; c.site = s; sites.push(s); used.add(c.i); return s; };
  add('chateau', cell(0, 0), { id: 'home', name: 'Ton château' });
  const far = (c, n) => sites.every(s => hdist(c.q, c.r, s.q, s.r) >= n), ok = c => rc.has(c.i) && passable(c);
  const nearWater = c => c.river || nb(c).some(water), coastal = c => nb(c).some(n => n.t === 'mer');
  const best = (dmin, dmax, pred, score, gap) => {
    for (let g2 = gap; g2 >= 1; g2--) for (const dd of [0, 1, 2]) {
      let b = null, bv = -1e9;
      list.forEach(c => { if (used.has(c.i) || c.d < Math.max(1, dmin - (dd > 1 ? 1 : 0)) || c.d > dmax + dd || !pred(c) || !far(c, g2)) return; const v = score(c) + R() * 1.4; if (v > bv) { bv = v; b = c; } });
      if (b) return b;
    }
    return null;
  };
  const angTo = c => Math.atan2(1.5 * c.r, SQ3 * (c.q + c.r / 2)), angGap = (c, L) => L.length ? Math.min(...L.map(o => { const a = Math.abs(angTo(c) - angTo(o)) % (2 * Math.PI); return Math.min(a, 2 * Math.PI - a); })) : Math.PI;
  // les villages (4 à 6), de plus en plus loin, au bord de l'eau quand c'est possible
  const nV = 4 + Math.floor(R() * 3), targets = [3, 4, 5, 6, 7, 8].slice(0, nV), vill = [];
  targets.forEach((t, i) => { const c = best(t - (i ? 1 : 0), t + (i ? 1 : 0), ok, c => (nearWater(c) ? 1.6 : 0) + (c.t === 'plaine' ? 1 : c.t === 'lande' || c.t === 'foret' ? .4 : 0) + angGap(c, vill) * .8, 3); if (c) vill.push(add('village', c, { id: 'v' + i, name: valName('village', R, names), rank: 1 })); });
  const town = best(5, 7, ok, c => (nearWater(c) ? 1.5 : 0) + (c.t === 'plaine' ? 1 : 0) + angGap(c, vill) * .5, 3); if (town) add('ville', town, { id: 'ville', name: 'Bourg-Ripaille', rank: 2 });
  const city = best(8, 10, ok, c => (coastal(c) ? 2 : nearWater(c) ? 1 : 0) + (c.t === 'plaine' ? 1 : 0) + (town ? hdist(c.q, c.r, town.q, town.r) * .15 : 0), 3); if (city) add('cite', city, { id: 'cite', name: 'Mirebrume', rank: 3 });
  // les cibles de raid des humains
  const near0 = vill[0] || { q: 0, r: 0 }, raid = (k, c) => c && add('raid', c, { id: k, name: RAIDS[k].name, raid: k });
  raid('ferme', best(2, 3, c => ok(c) && hdist(c.q, c.r, near0.q, near0.r) <= 3, c => (c.t === 'plaine' ? 1 : 0), 1));
  raid('moulin', best(3, 4, ok, c => (c.river ? 2.5 : nearWater(c) ? 1 : 0) + (c.t === 'plaine' ? .5 : 0), 1));
  raid('auberge', best(4, 5, ok, c => (c.t === 'plaine' || c.t === 'lande' ? .6 : 0), 1));
  raid('monastere', best(5, 7, ok, c => (c.t === 'colline' || c.t === 'lande' ? 1.5 : 0) + nb(c).filter(n => n.t === 'montagne').length * .3, 1));
  raid('chateau', (town && best(1, 10, c => ok(c) && hdist(c.q, c.r, town.q, town.r) === 2, () => 0, 1)) || best(6, 8, ok, () => 0, 1));
  // les quatre donjons rivaux, chacun sur un terrain à son goût, bien répartis
  const RIVAL_LAND = { morgrave: ['lande', 'colline'], septbieres: ['plaine'], moussues: ['marais', 'foret'], ombrelune: ['colline', 'foret'] }, rv = [];
  RIVALS.forEach(r => { const pref = RIVAL_LAND[r.id] || [], c = best(5, 9, ok, c => (pref.includes(c.t) ? 1.5 : 0) + (r.id === 'moussues' && nearWater(c) ? .8 : 0) + angGap(c, rv) * 1.2, 3); if (c) rv.push(add('rival', c, { id: r.id, name: r.name, rival: r.id })); });
  // les lieux d'expédition
  const fo = best(4, 8, c => ok(c) && c.t === 'foret', c => nb(c).filter(n => n.t === 'foret').length * .6, 2) || best(4, 8, ok, () => 0, 2);
  if (fo) { fo.t = 'foretm'; nb(fo).forEach(n => { if (!n.site && !water(n) && n.t !== 'montagne') n.t = 'foretm'; }); ring(fo.q, fo.r, 2).forEach(n => { if (!n.site && n.t === 'foret' && R() < .5) n.t = 'foretm'; }); add('foret', fo, { id: 'foret', name: valName('foret', R, names), expe: 'foret' }); }
  const nG = 2 + (R() < .3 ? 1 : 0) - (R() < .2 ? 1 : 0);
  for (let i = 0; i < nG; i++) { const c = best(i ? 5 : 3, i ? 10 : 6, c => ok(c) && (c.t === 'colline' || nb(c).some(n => n.t === 'montagne')), c => nb(c).filter(n => n.t === 'montagne' || n.t === 'colline').length * .4, 2) || best(i ? 5 : 3, 10, ok, () => 0, 2); if (c) add('grotte', c, { id: 'grotte' + i, name: valName('grotte', R, names), expe: 'grotte' }); }
  const nRu = 1 + (R() < .65 ? 1 : 0);
  for (let i = 0; i < nRu; i++) { const c = best(i ? 7 : 4, i ? 10 : 7, ok, c => (c.t === 'lande' || c.t === 'colline' ? 1 : 0) + (coastal(c) ? .8 : 0), 2); if (c) add('ruines', c, { id: 'ruines' + i, name: valName('ruines', R, names), expe: 'ruines' }); }
  let pk = list.filter(c => c.t === 'montagne' && !used.has(c.i) && c.d >= 6 && far(c, 2)).sort((a, b) => b.e - a.e)[0];
  if (!pk) { pk = best(6, 10, c => c.t === 'colline' || c.t === 'lande', c => c.e * 3, 2); if (pk) { pk.t = 'montagne'; nb(pk).forEach(n => { if (!n.site && !water(n) && R() < .5) n.t = 'montagne'; }); } }
  if (pk) add('pic', pk, { id: 'pic', name: valName('pic', R, names), expe: 'pic' });
  let lk = list.filter(c => c.t === 'lac' && !used.has(c.i) && c.d >= 3 && c.d <= 8 && far(c, 2)).sort((a, b) => nb(b).filter(water).length - nb(a).filter(water).length)[0];
  if (!lk) { lk = best(3, 8, c => !water(c) && c.t !== 'montagne', c => -c.e * 4, 2); if (lk) { lk.t = 'lac'; lk.river = 0; } }
  if (lk) add('lac', lk, { id: 'lac', name: valName('lac', R, names), expe: 'lac' });
  // les routes : chaque village et chaque ville a son chemin jusqu'au château (comme dans la version 1)
  const roads = new Map(), onRoad = new Set();
  const path = (from, to) => {
    const open = [[0, from]], g = new Map([[from.i, 0]]), prev = new Map();
    while (open.length) {
      open.sort((a, b) => a[0] - b[0]); const [, c] = open.shift(); if (c === to) break;
      for (const n of nb(c)) { const tc = n === to ? 1 : onRoad.has(n.i) ? .5 : BIOMES[n.t].cost; if (tc >= 99) continue; const ng = g.get(c.i) + tc; if (ng < (g.has(n.i) ? g.get(n.i) : Infinity)) { g.set(n.i, ng); prev.set(n.i, c); open.push([ng + hdist(n.q, n.r, to.q, to.r), n]); } }
    }
    if (!prev.has(to.i) && to !== from) return null;
    const p = [to.i]; let c = to; while (c !== from) { c = prev.get(c.i); p.unshift(c.i); } return p;
  };
  sites.filter(s => SITE_KINDS[s.kind].rank).sort((a, b) => hdist(a.q, a.r) - hdist(b.q, b.r)).forEach(s => { const p = path(list[s.i], cell(0, 0)); if (p) { roads.set(s.id, p.slice().reverse()); p.forEach(i => onRoad.add(i)); } });
  rivers.forEach(p => { for (let k = p.length - 1; k > 0; k--) { const t = list[p[k]].t; if (t !== 'mer' && t !== 'lac') break; if (list[p[k - 1]].t === 'mer' || list[p[k - 1]].t === 'lac') p.pop(); } });
  return { seed, gen: 2, list, at, cell, sites, roads, onRoad, rivers: rivers.filter(p => p.length >= 3), sea: hasSea };
}

// une phrase pour présenter le Val tiré au sort (sans rien dévoiler des lieux à découvrir)
function valSummary(w) {
  const dir = L => { if (!L.length) return ''; const x = L.reduce((a, c) => a + SQ3 * (c.q + c.r / 2), 0) / L.length, y = L.reduce((a, c) => a + 1.5 * c.r, 0) / L.length, a = Math.atan2(-y, x); return ['à l’est', 'au nord-est', 'au nord', 'au nord-ouest', 'à l’ouest', 'au sud-ouest', 'au sud', 'au sud-est'][((Math.round(a / (Math.PI / 4)) % 8) + 8) % 8]; };
  const n = t => w.list.filter(c => c.t === t).length, sea = w.list.filter(c => c.t === 'mer'), mts = w.list.filter(c => c.t === 'montagne'), tot = w.list.length;
  const parts = [];
  parts.push(sea.length ? `la mer ${dir(sea)}` : 'aucune mer à l’horizon');
  parts.push(w.rivers.length ? `${w.rivers.length} rivière${w.rivers.length > 1 ? 's' : ''}` : 'pas de rivière');
  if (mts.length) parts.push(`des montagnes ${dir(mts)}`);
  const landN = tot - sea.length - n('lac'), lush = (n('foret') + n('foretm')) / landN, wild = n('lande') / landN, wet2 = (n('marais') + n('lac')) / landN;
  parts.push(lush > .3 ? 'beaucoup de forêts' : wild > .18 ? 'de grandes landes' : wet2 > .09 ? 'des marais et des étangs' : 'des plaines bien vertes');
  return parts.join(', ');
}

// la carte du Val en petit, pour la choisir avant de commencer : le relief, l'eau et le château (le reste est à découvrir)
function drawValPreview(cv, w) {
  const W2 = cv.clientWidth || 320, H2 = cv.clientHeight || 260, dpr = Math.min(2, devicePixelRatio || 1);
  cv.width = Math.round(W2 * dpr); cv.height = Math.round(H2 * dpr);
  const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W2, H2);
  const s = Math.min(W2 / (SQ3 * (2 * MAP_R + 1.2)), H2 / (3 * MAP_R + 2.4)), ox = W2 / 2, oy = H2 / 2, XY = c => { const [x, y] = hexXY(c.q, c.r, s); return [ox + x, oy + y]; };
  // les mêmes tuiles et les mêmes stickers que la carte du Val, en petit
  const cells = w.list.slice().sort((a, b) => a.r - b.r || a.q - b.q);
  cells.forEach(c => { const [x, y] = XY(c); mapTile(g, x, y, s, BIOMES[c.t].col, c); });
  const feats = []; cells.forEach(c => { if (c.t === 'montagne' || c.t === 'foret' || c.t === 'foretm' || c.t === 'colline') { const [x, y] = XY(c); feats.push(...mapFeatures(c, x, y, s * 1.25).slice(0, c.t === 'colline' ? 1 : 2)); } });
  feats.sort((a, b) => a.y - b.y).forEach(o => o.f(g));
  g.lineCap = 'round'; g.lineJoin = 'round';
  (w.rivers || []).forEach(p => { const P = p.map(i => XY(w.list[i])); g.beginPath(); g.moveTo(P[0][0], P[0][1]); for (let k = 1; k < P.length - 1; k++) g.quadraticCurveTo(P[k][0], P[k][1], (P[k][0] + P[k + 1][0]) / 2, (P[k][1] + P[k + 1][1]) / 2); g.lineTo(P[P.length - 1][0], P[P.length - 1][1]); g.strokeStyle = 'rgba(20,40,70,.7)'; g.lineWidth = Math.max(2.4, s * .42); g.stroke(); g.strokeStyle = '#6fa6dc'; g.lineWidth = Math.max(1.2, s * .24); g.stroke(); });
  const [hx, hy] = XY(w.cell(0, 0)), z = HS * MAP_K * .62, kk = s / z * 1.3; putSticker(g, siteSticker({ kind: 'chateau' }), hx, hy + s * .2 + z * .9 * kk, kk);
  const edge = g.createRadialGradient(ox, oy, s * MAP_R * 1.3, ox, oy, s * MAP_R * 1.9); edge.addColorStop(0, 'rgba(22,18,28,0)'); edge.addColorStop(1, 'rgba(22,18,28,.75)'); g.fillStyle = edge; g.fillRect(0, 0, W2, H2);
}
