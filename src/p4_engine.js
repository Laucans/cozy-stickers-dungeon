
/* =========================================================
   Moteur : état, grille du château, portes, règles, économie, nuit
   ========================================================= */
// ?profil=nom : une partie (et une identité de Maître) séparée sur le même navigateur
const PROFILE = (() => { try { return (new URLSearchParams(location.search).get('profil') || '').replace(/[^a-z0-9_-]/gi, '').slice(0, 20); } catch (e) { return ''; } })();
const SAVE_KEY = 'cozy-stickers-dungeon-v2' + (PROFILE ? '-' + PROFILE : '');
let S = null, GRID = null, DOORS = null;

const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const nid = () => 'u' + (S.seq++);

function newState(name, theme) {
  S = {
    v: 2, seq: 1, name: name || 'Le Château de Minuit', theme: theme || 'forge', started: false,
    night: 1, gold: CONSTS.START_GOLD, mat: CONSTS.START_MAT, hype: 0, tier: 0, calamity: 0, menace: 0, prisoners: 0,
    rooms: [], furn: [], defs: [], creatures: [], raid: null,
    stats: { dug: 0, pets: 0, decor: 0, furn: 0, raidsWon: 0, repelled: 0, invasions: 0 },
    goals: {}, album: {}, free: { torche: 1, toile: 2, paillasse: 1 }, log: [], usedNames: [],
  };
  dirty();
  addRoom('porche', GATE.x, GATE.y, 1, 1, true);
  for (let y = HEART.y + HEART.h; y < GATE.y; y++) addRoom('couloir', GATE.x, y, 1, 1, true);
  addRoom('coeur', HEART.x, HEART.y, HEART.w, HEART.h, true);
  S.furn.push({ id: nid(), t: 'torche', x: HEART.x, y: HEART.y + 1 });
  addCreature('diablotin'); addCreature('diablotin');
  addLog('Le château s’éveille. Deux diablotins s’installent près du Cœur.', 'ev');
  upgradeState(S);
  return S;
}
function addRoom(t, x, y, w, h, built) {
  const r = { id: nid(), t, x, y, w, h, built: !!built, prog: 0 };
  S.rooms.push(r); dirty(); return r;
}
function addCreature(sp) {
  const free = NAMES.filter(n => !S.usedNames.includes(n));
  const name = free.length ? pick(free) : pick(NAMES) + ' ' + (S.creatures.length + 1);
  S.usedNames.push(name);
  const c = upgradeCreature({ id: nid(), sp, name, mood: 3, post: null, pet: 0, treat: 0, raid: false, sad: 0, joined: S.night });
  S.creatures.push(c); S.album[sp] = true; return c;
}
function addLog(text, tone) { S.log.unshift({ n: S.night, text, tone: tone || '' }); if (S.log.length > 40) S.log.length = 40; }

/* ---------- grille & portes ---------- */
const dirty = () => { GRID = null; DOORS = null; };
function grid() {
  if (GRID) return GRID;
  GRID = Array.from({ length: H }, () => Array(W).fill(null));
  for (const r of S.rooms) for (let dy = 0; dy < r.h; dy++) for (let dx = 0; dx < r.w; dx++) {
    const yy = r.y + dy, xx = r.x + dx; if (yy >= 0 && yy < H && xx >= 0 && xx < W) GRID[yy][xx] = r;
  }
  return GRID;
}
const roomAt = (x, y) => (y >= 0 && y < H && x >= 0 && x < W) ? grid()[y][x] : null;
const isHall = r => !!r && (r.t === 'couloir' || r.t === 'porche');
const DIRS = [[0,-1],[1,0],[0,1],[-1,0]];
const heartRoom = () => S.rooms.find(r => r.t === 'coeur');
const cellsOf = r => { const a = []; for (let dy = 0; dy < r.h; dy++) for (let dx = 0; dx < r.w; dx++) a.push([r.x + dx, r.y + dy]); return a; };
const edgeKey = (x1, y1, x2, y2) => (x1 < x2 || y1 < y2) ? `${x1},${y1},${x2},${y2}` : `${x2},${y2},${x1},${y1}`;
// une porte entre un couloir et sa voisine ; une seule porte (au milieu) entre deux pièces
function doors() {
  if (DOORS) return DOORS;
  DOORS = new Set(); const g = grid(); const pairs = new Map();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const a = g[y][x]; if (!a) continue;
    for (const [dx, dy] of [[1,0],[0,1]]) {
      const b = g[y + dy] && g[y + dy][x + dx]; if (!b || b === a) continue;
      const k = edgeKey(x, y, x + dx, y + dy);
      if (isHall(a) || isHall(b)) DOORS.add(k);
      else { const pk = a.id < b.id ? a.id + '|' + b.id : b.id + '|' + a.id; if (!pairs.has(pk)) pairs.set(pk, []); pairs.get(pk).push(k); }
    }
  }
  pairs.forEach(list => DOORS.add(list[Math.floor((list.length - 1) / 2)]));
  return DOORS;
}
function passable(x1, y1, x2, y2) {
  const a = roomAt(x1, y1), b = roomAt(x2, y2);
  if (!a || !b || !a.built || !b.built) return false;
  if (a === b) return true;
  return doors().has(edgeKey(x1, y1, x2, y2));
}
function bfs(from, goal, pass = passable) {
  const key = (x, y) => y * W + x;
  const prev = new Map([[key(from[0], from[1]), null]]); const q = [from];
  while (q.length) {
    const [x, y] = q.shift();
    if (goal(x, y)) { const p = []; let k = key(x, y); while (k !== null) { p.unshift([k % W, Math.floor(k / W)]); k = prev.get(k); } return p; }
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy, k = key(nx, ny);
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev.has(k) || !pass(x, y, nx, ny)) continue;
      prev.set(k, key(x, y)); q.push([nx, ny]);
    }
  }
  return null;
}
const heroPath = () => { const h = heartRoom(); return bfs([GATE.x, GATE.y], (x, y) => roomAt(x, y) === h); };
// distance (en pas) depuis le porche, sur tout le château y compris les chantiers
function gateDist() {
  const d = new Map(); const q = [[GATE.x, GATE.y]]; d.set(GATE.y * W + GATE.x, 0);
  while (q.length) {
    const [x, y] = q.shift(); const cur = d.get(y * W + x);
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy, k = ny * W + nx;
      if (d.has(k) || !roomAt(nx, ny)) continue;
      const a = roomAt(x, y), b = roomAt(nx, ny);
      if (a !== b && !doors().has(edgeKey(x, y, nx, ny))) continue;
      d.set(k, cur + 1); q.push([nx, ny]);
    }
  }
  return d;
}

/* ---------- objets ---------- */
const furnAt = (x, y) => S.furn.find(f => f.x === x && f.y === y);
const defAt = (x, y) => S.defs.find(d => d.x === x && d.y === y);
const inRoom = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;
const furnIn = r => S.furn.filter(f => inRoom(r, f.x, f.y));
const furnished = r => r.t === 'coeur' || furnIn(r).some(f => FURN[f.t].room !== 'any');
const builtRooms = () => S.rooms.filter(r => r.built);
const builtCount = t => S.rooms.filter(r => r.t === t && r.built).length;
const homeRooms = t => S.rooms.filter(r => r.t === t && r.built && furnished(r)).length;
const mainRoomsBuilt = () => S.rooms.filter(r => r.built && !isHall(r) && r.t !== 'coeur').length;
const homeCreatures = () => S.creatures.filter(c => !c.raid);
const countSp = sp => S.creatures.filter(c => c.sp === sp).length;
const hasItem = t => S.furn.some(f => f.t === t);
const countItem = t => S.furn.filter(f => f.t === t).length;

function neighborsTypes(r) {
  const set = new Set();
  for (const [x, y] of cellsOf(r)) for (const [dx, dy] of DIRS) { const o = roomAt(x + dx, y + dy); if (o && o !== r && o.built) set.add(o.t); }
  return set;
}
function rstat(r, key) {
  if (!r.built) return 0;
  const d = ROOMS[r.t]; let v = d[key] || 0;
  for (const f of furnIn(r)) v += FURN[f.t][key] || 0;
  if (d.syn && d.syn[key] && neighborsTypes(r).has(d.syn.adj)) v += d.syn[key];
  return v;
}
const sumRooms = key => builtRooms().reduce((a, r) => a + rstat(r, key), 0);
// humeur : 0-1 boudeur (compétence éteinte), 2-3 normal, 4-5 ravi (compétence ×2)
const mult = c => c.mood >= 4 ? 2 + (c.lvl >= 5 ? 1 : 0) : c.mood >= 2 ? 1 + (c.lvl >= 5 ? 1 : 0) : 0;
const sumCrit = key => homeCreatures().reduce((a, c) => a + (SPECIES[c.sp][key] || 0) * mult(c), 0);
const beds = () => sumRooms('beds') + (PW('accueil') ? 2 : 0);
const foodCap = () => sumRooms('food');
const eaters = () => S.creatures.reduce((a, c) => a + (c.away ? 0 : (SPECIES[c.sp].eats || 1)), 0);
function ambiance() { return sumRooms('amb') + sumCrit('amb') + (S.theme === 'enclave' ? 3 : 0) + pwAmb(); }
function castleTitle() { const a = ambiance(); let t = TITLES[0][1]; for (const [m, n] of TITLES) if (a >= m) t = n; return t; }
function hungrySet() {
  let left = foodCap(); const hungry = new Set();
  [...S.creatures].filter(c => !c.away).sort((a, b) => a.joined - b.joined).forEach(c => { const e = SPECIES[c.sp].eats || 1; if (left >= e) left -= e; else hungry.add(c.id); });
  return hungry;
}
const trapBonus = () => Math.min(2, S.creatures.filter(c => SPECIES[c.sp].trap && !c.raid && c.mood >= 2).length);
function defStr(d) {
  const f = DEFS[d.t]; let s = f.str;
  if (f.kind === 'verrou' && S.theme === 'bastion') s += 1;
  if (f.kind === 'piège') s += trapBonus() + (PW('repousse') ? 1 : 0);
  return s;
}

/* ---------- coûts & disponibilité ---------- */
function costOf(kind, t) {
  if (kind === 'room') { const c = { ...ROOMS[t].cost }; if (S.theme === 'forge' && t !== 'couloir' && c.s) c.s = Math.max(1, c.s - 1); if (PW('archi') && t !== 'couloir' && c.g) c.g = Math.max(0, c.g - 1); return c; }
  if ((S.free[t] || 0) > 0) return {};
  return { ...(kind === 'def' ? DEFS[t].cost : FURN[t].cost) };
}
const canAfford = c => S.gold >= (c.g || 0) && S.mat >= (c.s || 0);
function pay(c) { S.gold -= c.g || 0; S.mat -= c.s || 0; }
function costText(c) { const p = []; if (c.g) p.push(c.g + ' 💰'); if (c.s) p.push(c.s + ' 🪵'); return p.length ? p.join(' ') : 'gratuit'; }
function availability(kind, t) {
  if (kind === 'room') {
    const d = ROOMS[t];
    if (d.theme && d.theme !== S.theme) return { hide: true };
    if (d.tier && S.tier < d.tier) return { lock: true, reason: 'Palier ' + d.tier };
    if (d.unique && S.rooms.some(r => r.t === t)) return { lock: true, reason: 'Unique' };
  } else if (kind === 'def') {
    const d = DEFS[t];
    if (d.tier && S.tier < d.tier) return { lock: true, reason: 'Palier ' + d.tier };
    if (d.needs && !builtCount(d.needs)) return { lock: true, reason: ROOMS[d.needs].name };
    if (d.unique && S.defs.some(x => x.t === t)) return { lock: true, reason: 'Unique' };
  } else {
    const f = FURN[t];
    if (f.tier && S.tier < f.tier) return { lock: true, reason: 'Palier ' + f.tier };
    if (f.room !== 'any' && !S.rooms.some(r => r.t === f.room)) return { lock: true, reason: ROOMS[f.room].name };
    if (f.unique && hasItem(t)) return { lock: true, reason: 'Unique' };
  }
  if (!canAfford(costOf(kind, t))) return { poor: true, reason: 'Pas assez' };
  return null;
}

/* ---------- placement ---------- */
function checkRoom(t, x, y, w, h) {
  const d = ROOMS[t];
  if (x < 0 || y < 0 || x + w > W || y + h > H) return 'Hors des remparts';
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) if (roomAt(x + dx, y + dy)) return 'Cet endroit est déjà occupé';
  const touching = [];
  for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) for (const [ax, ay] of DIRS) {
    const nx = x + dx + ax, ny = y + dy + ay;
    if (nx >= x && nx < x + w && ny >= y && ny < y + h) continue;
    if (roomAt(nx, ny)) touching.push([nx, ny]);
  }
  if (!touching.length) return 'Doit toucher une pièce ou un couloir du château';
  if (d.edge && !(x === 0 || y === 0 || x + w === W || y + h === H)) return 'Doit toucher les remparts';
  if (d.far) {
    const dist = gateDist(); let best = Infinity;
    touching.forEach(([nx, ny]) => { const v = dist.get(ny * W + nx); if (v !== undefined) best = Math.min(best, v + 1); });
    if (best < d.far) return `Trop près du porche : ${best === Infinity ? '?' : best} pas, il en faut ${d.far}`;
  }
  return null;
}
function checkFurn(t, x, y) {
  const r = roomAt(x, y), f = FURN[t];
  if (!r) return 'Un meuble se pose dans une pièce';
  if (r.t === 'porche') return 'Laisse le porche dégagé';
  if (furnAt(x, y)) return 'Il y a déjà quelque chose ici';
  if (f.room === 'any') { if (defAt(x, y)) return 'Un piège occupe déjà ce couloir'; return null; }
  if (r.t !== f.room) return `Ce meuble va dans : ${ROOMS[f.room].name}`;
  return null;
}
function checkDef(t, x, y) {
  const r = roomAt(x, y);
  if (!r || r.t !== 'couloir') return 'Les pièges se posent dans un couloir';
  if (defAt(x, y)) return 'Il y a déjà un piège ici';
  if (furnAt(x, y)) return 'Une déco occupe ce couloir';
  return null;
}
function useCost(kind, t) { if ((S.free[t] || 0) > 0) S.free[t]--; else pay(costOf(kind, t)); }
function placeRoom(t, x, y, w, h) {
  pay(costOf('room', t));
  const d = ROOMS[t]; const r = addRoom(t, x, y, w, h, !!d.instant);
  if (t === 'couloir') S.stats.dug++; else addLog(`Chantier lancé : ${d.name}.`);
  if (d.preset) d.preset.forEach((ft, i) => {
    const pos = i === 0 ? [r.x, r.y] : [r.x + r.w - 1, r.y + r.h - 1];
    S.furn.push({ id: nid(), t: ft, x: pos[0], y: pos[1], fixed: true });
  });
  return r;
}
function placeFurn(t, x, y) {
  useCost('furn', t);
  const f = { id: nid(), t, x, y }; S.furn.push(f);
  if (FURN[t].room === 'any') S.stats.decor++; else S.stats.furn++;
  return f;
}
function placeDef(t, x, y) { useCost('def', t); const d = { id: nid(), t, x, y }; S.defs.push(d); return d; }

/* ---------- décoller ---------- */
function removeCheck(r) {
  if (ROOMS[r.t].fixed) return 'Cette pièce fait partie du château, elle ne se décolle pas.';
  const occ = new Map(); S.rooms.filter(o => o !== r).forEach(o => cellsOf(o).forEach(([x, y]) => occ.set(y * W + x, o)));
  const start = cellsOf(heartRoom())[0]; const seen = new Set([start[1] * W + start[0]]); const q = [start];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [dx, dy] of DIRS) { const nx = x + dx, ny = y + dy, k = ny * W + nx; if (nx < 0 || nx >= W || ny < 0 || ny >= H || seen.has(k) || !occ.has(k)) continue; seen.add(k); q.push([nx, ny]); }
  }
  for (const k of occ.keys()) if (!seen.has(k)) return 'Cette pièce relie d’autres pièces au Cœur : décolle-les d’abord.';
  return null;
}
// les meubles retournent dans la planche ; la pièce rend la moitié de son prix (tout si chantier)
function removeRoom(r) {
  const c = costOf('room', r.t), k = r.built ? .5 : 1;
  S.gold += Math.floor((c.g || 0) * k); S.mat += Math.floor((c.s || 0) * k);
  S.furn = S.furn.filter(f => { if (!inRoom(r, f.x, f.y)) return true; if (!f.fixed) S.free[f.t] = (S.free[f.t] || 0) + 1; return false; });
  S.defs = S.defs.filter(d => { if (!inRoom(r, d.x, d.y)) return true; S.free[d.t] = (S.free[d.t] || 0) + 1; return false; });
  S.creatures.forEach(c => { if (c.post === r.id) c.post = null; });
  S.rooms = S.rooms.filter(o => o !== r); dirty();
}
function removeFurn(f) { if (!f.fixed) S.free[f.t] = (S.free[f.t] || 0) + 1; S.furn = S.furn.filter(x => x !== f); }
function removeDef(d) { S.free[d.t] = (S.free[d.t] || 0) + 1; S.defs = S.defs.filter(x => x !== d); }

/* ---------- paliers & envies ---------- */
function tierStatus() {
  const next = TIERS[S.tier + 1]; if (!next) return null;
  const n = next.need, rows = [];
  rows.push({ ok: mainRoomsBuilt() >= n.rooms, text: `${n.rooms} pièces terminées (${mainRoomsBuilt()})` });
  rows.push({ ok: S.hype >= n.hype, text: `${n.hype} 🔥 de notoriété (${S.hype})` });
  if (n.species) rows.push({ ok: Object.keys(S.album).length >= n.species, text: `${n.species} espèces dans l’album (${Object.keys(S.album).length})` });
  if (n.trone) rows.push({ ok: S.rooms.some(r => r.t === 'trone' && r.built) && hasItem('trone'), text: 'Une Salle du trône terminée avec son Trône' });
  rows.push({ ok: canAfford(next.cost), text: `Payer ${costText(next.cost)}` });
  return { next, rows, ok: rows.every(r => r.ok) };
}
function checkGoals() {
  const done = [];
  for (const g of GOALS) {
    if (S.goals[g.id] || !g.test(S)) continue;
    S.goals[g.id] = true; const rw = g.reward;
    if (rw.g) S.gold += rw.g; if (rw.s) S.mat += rw.s;
    if (rw.free) S.free[rw.free] = (S.free[rw.free] || 0) + rw.n;
    done.push(g);
  }
  return done;
}
const itemName = t => ((FURN[t] || DEFS[t] || ROOMS[t]) || { name: t }).name;
const rewardText = rw => rw.free ? `${rw.n}× ${itemName(rw.free)}` : costText(rw);

/* ---------- raids ---------- */
function raidBreakdown(targetId, teamIds) {
  const tg = RAIDS[targetId]; const rows = []; let pool = 0;
  teamIds.forEach(id => {
    const c = S.creatures.find(x => x.id === id); if (!c) return;
    const sp = SPECIES[c.sp]; let d = diceOf(c); let why = `${c.name} (${sp.name}${c.lvl >= 3 && d ? ', niv. ' + c.lvl : ''})`;
    if (sp.tag && sp.tag === tg.tag) { d++; why += ` +1 ${TAGS[tg.tag]}`; }
    if (c.mood <= 1) { d = Math.max(0, d - 1); why += ' −1 boude'; }
    pool += d; rows.push([why, d]);
  });
  if (S.theme === 'repaire') { pool++; rows.push(['Repaire de brigands', 1]); }
  if (PW('epopee')) { pool++; rows.push(['Ballade héroïque', 1]); }
  const rd = sumRooms('dice'); if (rd) { pool += rd; rows.push(['Préparatifs (meubles et pièces)', rd]); }
  if (tg.risk) { pool -= tg.risk; rows.push(['Cible bien gardée', -tg.risk]); }
  return { pool, rows };
}
function oddsText(pool) {
  if (pool <= 0) return 'Aucun dé : on lance 2 dés et on garde le plus bas.';
  const six = 1 - Math.pow(5 / 6, pool), fail = Math.pow(1 / 2, pool);
  return `${pool} dé${pool > 1 ? 's' : ''} : ${Math.round(six * 100)} % de succès total, ${Math.round(fail * 100)} % d’échec.`;
}
function rollPool(pool) {
  const zero = pool <= 0, n = zero ? 2 : pool;
  const dice = Array.from({ length: n }, () => 1 + rnd(6));
  const best = zero ? Math.min(...dice) : Math.max(...dice);
  const sixes = dice.filter(d => d === 6).length;
  return { dice, best, zero, res: (!zero && sixes >= 2) ? 'crit' : best === 6 ? 'full' : best >= 4 ? 'partial' : 'fail' };
}
function applyRaid(roll) {
  const tg = RAIDS[S.raid.target]; const team = S.raid.team.map(id => S.creatures.find(c => c.id === id)).filter(Boolean);
  const lines = [];
  if (roll.res === 'fail') {
    S.menace += 1; team.forEach(c => { c.mood = clamp(c.mood - 1, 0, 5); addLoy(c, -2); });
    lines.push(['💨', 'Retour bredouille. L’équipe boude (−1 ❤️) et le village se méfie (+1 Menace).', 'bad']);
  } else {
    const m = roll.res === 'crit' ? 1.5 : 1, g = Math.ceil((tg.reward.g || 0) * m) + (PW('pillard') ? 2 : 0), s = Math.ceil((tg.reward.s || 0) * m);
    S.gold += g; S.mat += s; S.hype += tg.hype; S.menace += tg.menace; S.stats.raidsWon++; if (roll.res === 'crit') S.stats.crits++;
    team.forEach(c => { c.raidsWon = (c.raidsWon || 0) + 1; addLoy(c, 3); gainXP(c, 1, lines); });
    lines.push(['🎒', `Butin : ${costText({ g, s })}, +${tg.hype} 🔥 Notoriété, +${tg.menace} Menace.`, 'good']);
    if (tg.bonus && roll.res !== 'partial') { S.free[tg.bonus] = (S.free[tg.bonus] || 0) + 1; lines.push(['🎁', `Trophée : un sticker ${FURN[tg.bonus].name} gratuit !`, 'good']); }
    if (roll.res === 'crit') { const k = pick(['cristal','tableau','armure','citrouille']); S.free[k] = (S.free[k] || 0) + 1; lines.push(['✨', `Critique ! Butin ×1,5 et un sticker ${FURN[k].name} en prime.`, 'good']); }
    if (roll.res === 'partial' && PW('crit') && Math.random() < .5) lines.push(['🍀', 'Le trèfle à quatre feuilles vous évite la complication.', 'good']);
    else if (roll.res === 'partial') {
      const comp = pick(['cal','men','hurt']);
      if (comp === 'cal') { S.calamity += 1; lines.push(['🪳', 'Complication : ils ont ramené des puces. +1 Calamité.', 'bad']); }
      else if (comp === 'men') { S.menace += 1; lines.push(['👀', 'Complication : un témoin a tout vu. +1 Menace.', 'bad']); }
      else { const c = pick(team); c.mood = clamp(c.mood - 1, 0, 5); lines.push(['🤕', `Complication : ${c.name} s’est pris une fourche dans le derrière (−1 ❤️).`, 'bad']); }
    }
  }
  return lines;
}

/* ---------- invasion ---------- */
function partyPreview() {
  const size = Math.min(5, 2 + S.tier + (S.hype >= 10 ? 1 : 0));
  return { size, courage: size * 2 + 1 + S.tier * 2 + Math.floor(S.hype / 5) };
}
function planInvasion() {
  const { size } = partyPreview(); const pool = [...HEROES]; const party = [];
  for (let i = 0; i < size; i++) party.push(pool.length ? pool.splice(rnd(pool.length), 1)[0] : pick(HEROES));
  const courage = party.reduce((a, h) => a + h.c, 0) + S.tier * 2 + Math.floor(S.hype / 5);
  const path = heroPath(); const steps = []; const h = heartRoom();
  const harass = sumRooms('harass');
  if (harass) steps.push({ i: 0, dmg: harass, label: 'La Tour de guet les bombarde de cailloux' });
  let sticky = 0, alarm = false; const seen = new Set();
  (path || []).forEach(([x, y], i) => {
    if (i === 0) return;
    const r = roomAt(x, y), d = defAt(x, y);
    if (d) { const f = DEFS[d.t]; steps.push({ i, dmg: defStr(d) + sticky, label: f.name, lost: f.lost || 0, defId: d.id }); sticky = f.sticky ? 1 : 0; if (f.alarm) alarm = true; return; }
    if (r && r !== h && !isHall(r) && !seen.has(r.id)) {
      seen.add(r.id);
      const guards = homeCreatures().filter(c => c.post === r.id);
      const dmg = guards.reduce((a, c) => a + guardOf(c), 0) + rstat(r, 'guard');
      if (dmg > 0) { steps.push({ i, dmg: dmg + sticky, label: `${ROOMS[r.t].name}${guards.length ? ' : ' + guards.map(c => c.name).join(', ') : ''}`, roomId: r.id }); sticky = 0; }
    }
  });
  const free = homeCreatures().filter(c => !c.post || c.post === h.id);
  const hd = free.reduce((a, c) => a + guardOf(c) + (alarm ? 1 : 0), 0) + rstat(h, 'guard');
  steps.push({ i: path ? path.length - 1 : 0, dmg: hd + sticky, label: free.length ? `Défense du Cœur (${free.length} créature${free.length > 1 ? 's' : ''})` : 'Le Cœur est sans défense', heart: true });
  return { party, courage, path, steps };
}
function applyInvasion(plan, outcome) {
  S.stats.invasions++; const n = plan.party.length; const lines = [];
  if (outcome !== 'robbed') {
    S.stats.repelled++; S.hype += 1;
    if (outcome === 'repelled') {
      S.gold += n * 2; lines.push(['🏃', `Les aventuriers détalent en semant leur bourse : +${n * 2} 💰, +1 🔥.`, 'good']);
      if (sumRooms('cells') > S.prisoners) { S.prisoners++; lines.push(['⛓️', `${pick(plan.party).name} finit aux Oubliettes. Rançon à l’aube !`, 'good']); }
      S.creatures.forEach(c => { if (!c.raid) { c.mood = clamp(c.mood + 1, 0, 5); addLoy(c, 2); gainXP(c, 1, lines); } });
    } else lines.push(['🌀', 'Les aventuriers abandonnent et rentrent tout penauds. +1 🔥.', 'good']);
  } else {
    const steal = Math.min(S.gold, 3 + 2 * S.tier);
    S.gold -= steal; S.calamity += 2; S.creatures.forEach(c => { c.mood = clamp(c.mood - 1, 0, 5); addLoy(c, -3); });
    lines.push(['💔', `Les héros touchent le Cœur et filent avec ${steal} 💰. +2 Calamité, toutes les créatures −1 ❤️.`, 'bad']);
  }
  return lines;
}

/* ---------- humeur & calamité ---------- */
function moodFactors(c, hungry = hungrySet(), amb = ambiance()) {
  const sp = SPECIES[c.sp]; const f = [['Base', 2]];
  if (sp.likes) f.push(hasItem(sp.likes) ? [`${itemName(sp.likes)} dans le château`, 1] : [`Rêve d’un sticker ${itemName(sp.likes)}`, 0]);
  f.push(amb >= S.creatures.length ? ['Château douillet (Ambiance ≥ nombre de créatures)', 1] : ['Château un peu froid (Ambiance < nombre de créatures)', 0]);
  if (sp.from) {
    const post = c.post && S.rooms.find(r => r.id === c.post);
    const home = post && (post.t === sp.from || (ROOMS[post.t].attracts || []).includes(c.sp));
    f.push(home ? ['Posté·e dans sa pièce préférée', 1] : [`Aimerait un poste : ${ROOMS[sp.from].name}`, 0]);
  } else f.push(['Libre comme l’air', 1]);
  if (hungry.has(c.id)) f.push(['Ventre vide', -2]);
  if (sp.rival && S.creatures.some(o => o.sp === sp.rival)) f.push([`Supporte mal les ${SPECIES[sp.rival].name}s`, -1]);
  return { f, target: clamp(f.reduce((a, x) => a + x[1], 0), 0, 5) };
}
function calamityDelta() {
  const parts = []; let d = 0;
  const hungry = hungrySet().size; if (hungry) { d++; parts.push(`+1 ventres vides (${hungry})`); }
  const sulky = Math.min(2, S.creatures.filter(c => c.mood === 0).length); if (sulky) { d += sulky; parts.push(`+${sulky} créatures furieuses`); }
  if (ambiance() < Math.ceil(S.creatures.length / 2)) { d++; parts.push('+1 château lugubre'); }
  const crowd = Math.floor(S.creatures.length / 5); if (crowd) { d += crowd; parts.push(`+${crowd} promiscuité`); }
  const calm = sumRooms('cal') + sumCrit('cal'); if (calm) { d -= calm; parts.push(`−${calm} apaisement`); }
  if (S.theme === 'temple') { d--; parts.push('−1 Abbaye maudite'); }
  if (PW('cosy')) { d--; parts.push('−1 Feu de cheminée'); }
  return { d, parts };
}
const CALAMITIES = [
  { when: () => true, run: () => { const l = Math.min(3, S.gold); S.gold -= l; return `Les diablotins ont organisé une fête sauvage. −${l} 💰.`; } },
  { when: () => S.rooms.some(r => !r.built && r.prog > 0), run: () => { const r = S.rooms.find(r => !r.built && r.prog > 0); r.prog = Math.max(0, r.prog - 2); return `Un mur s’écroule sur le chantier ${ROOMS[r.t].name} : −2 segments.`; } },
  { when: () => S.creatures.length > 1, run: () => { S.creatures.forEach(c => c.mood = clamp(c.mood - 1, 0, 5)); return 'Grande querelle pour savoir qui a fini le fromage : toutes les créatures perdent 1 ❤️.'; } },
  { when: () => S.creatures.filter(c => c.sp !== 'diablotin' && !c.raid).length > 1, run: () => {
      const c = S.creatures.filter(c => c.sp !== 'diablotin' && !c.raid).sort((a, b) => a.mood - b.mood)[0];
      S.creatures = S.creatures.filter(x => x !== c); return `${c.name} (${SPECIES[c.sp].name}) fait sa valise en claquant la porte.`; } },
  { when: () => true, run: () => { S.menace += 2; return 'Un barde du village chante une chanson moqueuse sur ton château : +2 Menace.'; } },
];

/* ---------- aube ---------- */
function dawn(report) {
  let work = workPerNight();
  const sites = S.rooms.filter(r => !r.built);
  if (sites.length) report.push(['sec', 'Travaux']);
  for (const r of sites) {
    const need = ROOMS[r.t].clock - r.prog, take = Math.min(work, need);
    r.prog += take; work -= take;
    if (r.prog >= ROOMS[r.t].clock) { r.built = true; r.justBuilt = true; report.push(['🎉', `Chantier terminé : ${ROOMS[r.t].name} !`, 'good']); addLog(`${ROOMS[r.t].name} terminé.`, 'good'); }
    else if (take) report.push(['🔨', `${ROOMS[r.t].name} : ${r.prog}/${ROOMS[r.t].clock} segments.`, '']);
  }
  dirty();
  const gold = sumRooms('gold') + sumCrit('gold'), mat = sumRooms('mat') + sumCrit('mat') + (PW('palier1') ? 1 : 0), hype = sumRooms('hype') + sumCrit('hype') + (PW('legende') ? 1 : 0);
  const ransom = S.prisoners * 4;
  S.gold += gold + ransom; S.mat += mat; S.hype += hype;
  report.push(['sec', 'Récoltes']);
  report.push(['🌾', `+${gold} 💰, +${mat} 🪵${hype ? `, +${hype} 🔥` : ''}.`, 'good']);
  if (ransom) { report.push(['⛓️', `Rançons : +${ransom} 💰. Les prisonniers rentrent chez eux en jurant de ne rien dire.`, 'good']); S.prisoners = 0; }
  S.creatures.forEach(c => { if (c.raid && !c.away) { c.raid = false; c.back = true; } });
  S.raid = null;
  const hungry = hungrySet(), amb = ambiance(), leaving = [];
  S.creatures.forEach(c => {
    if (c.away) return;
    const t = moodFactors(c, hungry, amb).target;
    if (c.mood < t) c.mood++; else if (c.mood > t) c.mood--;
    if (c.lvl >= 4 && c.mood < 2) c.mood = 2;
    if (c.mood === 0) { c.sad++; if (c.sad >= 2 && c.sp !== 'diablotin') leaving.push(c); } else c.sad = 0;
  });
  if (hungry.size) report.push(['🍽️', `${hungry.size} créature${hungry.size > 1 ? 's ont' : ' a'} le ventre vide. Meuble une Cuisine ou un Potager.`, 'bad']);
  leaving.forEach(c => { S.creatures = S.creatures.filter(x => x !== c); report.push(['🧳', `${c.name} (${SPECIES[c.sp].name}) en a assez et quitte le château.`, 'bad']); addLog(`${c.name} est parti·e.`, 'bad'); });
  soulsDawn(report);
  report.push(['sec', 'Arrivées']);
  while (S.waiting.length && beds() - S.creatures.length > 0) {
    const w = S.waiting.shift(); if (!SPECIES[w.sp]) continue;
    const c = upgradeCreature({ ...w, id: nid(), mood: 3, post: null, pet: 0, treat: 0, raid: false, sad: 0, joined: S.night, isNew: true, quest: null, tempt: null });
    if (S.usedNames.includes(c.name)) c.name += ' ' + (S.creatures.length + 1);
    S.usedNames.push(c.name); S.creatures.push(c); S.album[c.sp] = true; S.stats.migrantsIn++;
    report.push(['🧳', `${c.name} (${SPECIES[c.sp].name}), venu·e de ${w.from || 'loin'}, pose ses valises chez toi !`, 'good']); addLog(`${c.name} arrive de ${w.from || 'loin'}.`, 'good');
  }
  const capOf = sp => { const d = SPECIES[sp]; return d.from === 'coeur' ? 2 + S.tier : d.fromDecor ? Math.floor(countItem('toile') / d.fromDecor.toile) : homeRooms(d.from) * 2; };
  const cands = () => SPECIES_ORDER.filter(sp => !(SPECIES[sp].tier && S.tier < SPECIES[sp].tier) && countSp(sp) < capOf(sp));
  let free = beds() - S.creatures.length; const arrived = [];
  const c0 = cands();
  if (!c0.length) report.push(['🕸️', 'Personne de nouveau. Meuble une pièce pour attirer son espèce.', '']);
  else if (free <= 0) report.push(['🛏️', `Des ${SPECIES[pick(c0)].name.toLowerCase()}s rôdent dehors, mais tous les lits sont pris.`, 'bad']);
  else {
    let chance = c0.some(sp => !S.album[sp]) ? 1 : Math.min(.95, .6 + amb * .03 + (S.theme === 'enclave' ? .15 : 0) + (PW('nuit20') ? .1 : 0));
    let tries = amb >= 8 ? 2 : 1;
    while (tries-- > 0 && free > 0) {
      if (Math.random() > chance) continue;
      chance = Math.min(chance, .5);
      const pool = cands(); if (!pool.length) break;
      const sp = wpick(pool, s => (S.album[s] ? 1 : 3) * (.4 + repOf(s) / 100)), c = addCreature(sp), d = SPECIES[sp]; c.isNew = true; free--; arrived.push(c);
      const why = repOf(sp) >= 70 ? `a entendu vanter ta réputation chez les ${d.name.toLowerCase()}s` : d.from === 'coeur' ? 'sort du Cœur en baillant' : d.fromDecor ? 'a suivi les toiles d’araignée' : `a entendu parler de ta pièce « ${ROOMS[d.from].name} »`;
      report.push(['🆕', `${c.name} (${d.name}) ${why} et s’installe !`, 'good']);
      addLog(`${c.name} (${d.name}) arrive.`, 'good');
    }
    if (!arrived.length) report.push(['🌫️', 'Des bruits de pas devant le porche… mais personne n’est entré.', '']);
  }
  S.night++;
  S.creatures.forEach(c => { c.pet = 0; c.treat = 0; });
  updateRep();
  return arrived;
}

/* ---------- sauvegarde ---------- */
function save() { if ((typeof VISIT !== 'undefined' && VISIT) || (typeof COOP !== 'undefined' && COOP.role === 'guest')) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) {} }
function load() { try { const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null'); if (s && s.v === 2 && Array.isArray(s.rooms)) return s; } catch (e) {} return null; }
function wipe() { try { localStorage.removeItem(SAVE_KEY); } catch (e) {} }
