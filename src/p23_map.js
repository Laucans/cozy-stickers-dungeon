
/* =========================================================
   La carte du Val : vue en hexagones façon Civilization,
   brouillard de guerre, champ de rayonnement du château,
   sites à visiter, piller ou explorer
   ========================================================= */
const MAPV = { open: false, cam: { x: 0, y: 0, s: 1 }, sel: null, layer: null, dirty: true, raf: 0, ptr: new Map(), drag: null };
const HS = 30, MAP_K = 2;   // rayon d'un hexagone au zoom 1 ; finesse du calque pré-dessiné
const RIVAL_COL = { morgrave: '#6c4aa8', septbieres: '#b8602a', moussues: '#4f8a3c', ombrelune: '#8e2333' };
const hexXY = (q, r, s) => [s * SQ3 * (q + r / 2), s * 1.5 * r];
function hexPath(g, x, y, s) { g.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 180 * (60 * i - 30); g.lineTo(x + s * Math.cos(a), y + s * Math.sin(a)); } g.closePath(); }
function hexRound(q, r) { const x = q, z = r, y = -x - z; let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z); const dx = Math.abs(rx - x), dy = Math.abs(ry - y), dz = Math.abs(rz - z); if (dx > dy && dx > dz) rx = -ry - rz; else if (dy > dz) ry = -rx - rz; else rz = -rx - ry; return [rx, rz]; }
function mapDirty() { MAPV.dirty = true; }

/* ---------- donjons des autres Maîtres (Val des Maîtres) placés sur ma carte ---------- */
function playerDungeons() {
  if (typeof valRivals !== 'function') return [];
  const w = world(), taken = new Set(w.sites.map(s => s.i)), out = [];
  valRivals().sort((a, b) => b.at - a.at).slice(0, 14).forEach(c => {
    const cands = w.list.filter(x => { const d = hdist(x.q, x.r); return d >= 4 && d <= 9 && !taken.has(x.i) && BIOMES[x.t].cost < 99; });
    if (!cands.length) return;
    const cell = cands[seedOf(c.pk + ':' + w.seed) % cands.length]; taken.add(cell.i);
    out.push({ id: 'p:' + c.pk, kind: 'joueur', name: c.name, master: c.master, q: cell.q, r: cell.r, i: cell.i, pk: c.pk, glow: c.glow || 0, tier: c.tier, pvp: c.pvp });
  });
  return out;
}
function mapVisible() {
  const vis = visibleSet(), visited = new Set(((typeof homeS === 'function' ? homeS() : S).val || {}).visited || []);
  playerDungeons().forEach(p => { if (visited.has(p.pk)) vis.add(p.i); });
  return vis;
}
const allSites = () => [...world().sites, ...playerDungeons()];

/* ---------- petits dessins de la carte ---------- */
function mTree(g, x, y, r, magic) {
  ln(g, [[x, y + r * .2], [x, y + r * 1.2]], '#4a3020', r * .28);
  const col = magic ? '#6a7ad8' : '#3e6e30'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fillStyle = radial(g, x, y, r, col); g.fill(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(15,20,10,.55)'; g.stroke();
  if (magic) { g.fillStyle = 'rgba(200,230,255,.9)'; for (let k = 0; k < 2; k++) { g.beginPath(); g.arc(x + (k ? r * .4 : -r * .5), y - r * .6 + k * r * .5, r * .12, 0, 7); g.fill(); } }
}
function mPeak(g, x, y, s, snow = true) {
  g.beginPath(); g.moveTo(x - s * .6, y); g.lineTo(x, y - s); g.lineTo(x + s * .6, y); g.closePath();
  const gr = g.createLinearGradient(x - s * .6, 0, x + s * .6, 0); gr.addColorStop(0, '#a8a29a'); gr.addColorStop(.5, '#8a847c'); gr.addColorStop(1, '#5e5852'); g.fillStyle = gr; g.fill(); g.lineWidth = 1.2; g.strokeStyle = 'rgba(20,14,10,.6)'; g.stroke();
  if (snow) { g.beginPath(); g.moveTo(x - s * .2, y - s * .66); g.lineTo(x, y - s); g.lineTo(x + s * .2, y - s * .66); g.lineTo(x + s * .07, y - s * .7); g.lineTo(x - s * .05, y - s * .62); g.closePath(); g.fillStyle = '#f2f0ea'; g.fill(); }
}
function mBump(g, x, y, s, col) { g.beginPath(); g.ellipse(x, y, s, s * .55, 0, Math.PI, 0); g.fillStyle = radial(g, x, y - s * .3, s, col); g.fill(); g.lineWidth = 1; g.strokeStyle = 'rgba(30,20,10,.35)'; g.stroke(); }
function mHouse(g, x, y, s, roof = '#b8402a') {
  g.fillStyle = '#e8d8b0'; g.fillRect(x - s * .5, y - s * .5, s, s * .5); g.strokeStyle = '#2a1c16'; g.lineWidth = 1.2; g.strokeRect(x - s * .5, y - s * .5, s, s * .5);
  g.beginPath(); g.moveTo(x - s * .62, y - s * .48); g.lineTo(x, y - s * 1.05); g.lineTo(x + s * .62, y - s * .48); g.closePath(); g.fillStyle = roof; g.fill(); g.stroke();
  g.fillStyle = '#5a3a22'; g.fillRect(x - s * .1, y - s * .28, s * .2, s * .28);
}
function mTower(g, x, y, s, roof, body = '#9a9488') {
  g.fillStyle = body; g.fillRect(x - s * .28, y - s * 1.1, s * .56, s * 1.1); g.strokeStyle = '#2a1c16'; g.lineWidth = 1.2; g.strokeRect(x - s * .28, y - s * 1.1, s * .56, s * 1.1);
  g.beginPath(); g.moveTo(x - s * .38, y - s * 1.08); g.lineTo(x, y - s * 1.75); g.lineTo(x + s * .38, y - s * 1.08); g.closePath(); g.fillStyle = roof; g.fill(); g.stroke();
  g.fillStyle = '#ffcf7a'; g.fillRect(x - s * .07, y - s * .78, s * .14, s * .2);
}
function mFlag(g, x, y, s, col) { ln(g, [[x, y], [x, y - s]], '#2a1c16', 1.4); g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * .55, y - s * .82); g.lineTo(x, y - s * .64); g.closePath(); g.fillStyle = col; g.fill(); g.strokeStyle = '#2a1c16'; g.lineWidth = 1; g.stroke(); }
function mWall(g, x, y, w, h, col = '#8f887c') { g.fillStyle = col; g.fillRect(x - w / 2, y - h, w, h); g.strokeStyle = '#2a1c16'; g.lineWidth = 1.2; g.strokeRect(x - w / 2, y - h, w, h); for (let i = -w / 2; i < w / 2 - 2; i += 6) g.fillRect(x + i, y - h - 3, 3, 3); }
function siteIcon(g, s, x, y, k) {
  const z = HS * MAP_K * .62 * k;
  if (s.kind === 'chateau') { mWall(g, x, y + z * .3, z * 1.6, z * .7, '#9a9488'); mTower(g, x - z * .62, y + z * .3, z * .9, '#9c2f2a'); mTower(g, x + z * .62, y + z * .3, z * .9, '#9c2f2a'); mTower(g, x, y + z * .1, z * 1.2, '#9c2f2a'); mFlag(g, x, y - z * 1.9, z * .7, '#e9b949'); return; }
  if (s.kind === 'village') { mHouse(g, x - z * .45, y + z * .3, z * .7, '#b8602a'); mHouse(g, x + z * .4, y + z * .2, z * .62, '#a8382f'); mHouse(g, x, y - z * .05, z * .75, '#c08a3a'); return; }
  if (s.kind === 'ville') { mWall(g, x, y + z * .4, z * 2, z * .6); mHouse(g, x - z * .5, y - z * .1, z * .6, '#a8382f'); mHouse(g, x + z * .5, y - z * .1, z * .6, '#3a578f'); mTower(g, x, y - z * .1, z * .9, '#3a578f', '#c9c0b0'); return; }
  if (s.kind === 'cite') { mWall(g, x, y + z * .5, z * 2.6, z * .7, '#b8b0a2'); [-.9, .9].forEach(dx => mTower(g, x + dx * z, y + z * .5, z * .95, '#3a578f', '#c9c0b0')); mTower(g, x, y + z * .1, z * 1.5, '#e9b949', '#ddd4c4'); mHouse(g, x - z * .45, y - z * .05, z * .5, '#a8382f'); mHouse(g, x + z * .45, y - z * .05, z * .5, '#a8382f'); return; }
  if (s.kind === 'raid') {
    const k2 = s.raid;
    if (k2 === 'ferme') { mHouse(g, x, y + z * .2, z * .9, '#a8382f'); g.fillStyle = '#e3c46e'; g.beginPath(); g.ellipse(x + z * .65, y + z * .15, z * .28, z * .2, 0, 0, 7); g.fill(); g.stroke(); }
    else if (k2 === 'moulin') { mTower(g, x, y + z * .3, z * .8, '#7a4a28', '#e8d8b0'); const cx = x, cy = y - z * .45; g.strokeStyle = '#5a3a22'; g.lineWidth = 2.4; for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + .4; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * z * .75, cy + Math.sin(a) * z * .75); g.stroke(); } }
    else if (k2 === 'auberge') { mHouse(g, x, y + z * .3, z * 1, '#7a4a28'); ln(g, [[x + z * .55, y - z * .2], [x + z * .55, y + z * .3]], '#2a1c16', 1.4); g.fillStyle = '#e9b949'; g.fillRect(x + z * .45, y - z * .12, z * .3, z * .2); }
    else if (k2 === 'monastere') { mHouse(g, x - z * .2, y + z * .3, z * .9, '#6a5a8a'); mTower(g, x + z * .55, y + z * .3, z * .7, '#6a5a8a', '#d8d0c0'); }
    else { mWall(g, x, y + z * .35, z * 1.6, z * .6, '#a8a090'); mTower(g, x - z * .6, y + z * .35, z * .9, '#3a578f'); mTower(g, x + z * .6, y + z * .35, z * .9, '#3a578f'); mFlag(g, x, y - z * .3, z * .6, '#3a578f'); }
    return;
  }
  if (s.kind === 'rival') { const col = RIVAL_COL[s.rival] || '#6c4aa8'; mTower(g, x, y + z * .4, z * 1.25, '#2e2638', '#4a4452'); mTower(g, x + z * .55, y + z * .45, z * .8, '#2e2638', '#4a4452'); mFlag(g, x, y - z * 1.8, z * .7, col); return; }
  if (s.kind === 'joueur') { mTower(g, x, y + z * .4, z * 1.1, '#3a578f', '#8f887c'); mTower(g, x - z * .5, y + z * .45, z * .75, '#3a578f', '#8f887c'); mFlag(g, x, y - z * 1.55, z * .7, '#e9b949'); return; }
  if (s.kind === 'foret') { mTree(g, x, y - z * .2, z * .55, true); g.fillStyle = 'rgba(190,220,255,.9)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + (vh(i, 1, 3) - .5) * z * 1.6, y - z * .8 + vh(i, 2, 3) * z, 1.6, 0, 7); g.fill(); } return; }
  if (s.kind === 'grotte') { mBump(g, x, y + z * .4, z * .95, '#8a7a5a'); g.beginPath(); g.ellipse(x, y + z * .4, z * .38, z * .5, 0, Math.PI, 0); g.fillStyle = '#120c0a'; g.fill(); return; }
  if (s.kind === 'ruines') { [-.55, 0, .55].forEach((dx, i) => { const h = z * (.6 + vh(i, 4, 7) * .6); g.fillStyle = '#c9c0ae'; g.fillRect(x + dx * z - z * .13, y + z * .4 - h, z * .26, h); g.strokeStyle = '#2a1c16'; g.lineWidth = 1.1; g.strokeRect(x + dx * z - z * .13, y + z * .4 - h, z * .26, h); }); g.fillStyle = '#b0a690'; g.fillRect(x - z * .8, y + z * .32, z * 1.6, z * .12); return; }
  if (s.kind === 'pic') { mPeak(g, x, y + z * .5, z * 1.4); g.fillStyle = '#7a2a2a'; g.beginPath(); g.moveTo(x + z * .2, y - z * .55); g.quadraticCurveTo(x + z * .8, y - z * .95, x + z * .95, y - z * .5); g.quadraticCurveTo(x + z * .6, y - z * .6, x + z * .2, y - z * .55); g.fill(); return; }
  if (s.kind === 'lac') { g.fillStyle = 'rgba(220,230,255,.35)'; for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(x + (i - 1) * z * .4, y - z * .1 * i, z * .6, z * .18, 0, 0, 7); g.fill(); } g.beginPath(); g.ellipse(x, y + z * .2, z * .3, z * .16, 0, 0, 7); g.fillStyle = '#4f7a3a'; g.fill(); return; }
}
function mLabel(g, text, x, y, size, col = '#f3e3c0') {
  g.font = `800 ${size}px "Grenze Gotisch", Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'top';
  g.lineWidth = size * .28; g.strokeStyle = 'rgba(20,12,8,.92)'; g.fillStyle = col; richText(g, text, x, y, size, true);
}

/* ---------- calque statique (refait quand la carte se dévoile) ---------- */
/* ---------- la carte en stickers ----------
   Les cases sont des tuiles épaisses, comme un plateau de jeu de société ; arbres, montagnes, collines, roseaux,
   bruyère et lieux sont de petits autocollants (liseré blanc, ombre douce), et les noms des étiquettes en papier. */
const MSTK = new Map();
// un sticker dessiné une fois : dessin en unités de plan, origine au milieu du bas
function mapSticker(key, w, h, draw, border = 3) {
  let st = MSTK.get(key); if (st) return st;
  const k = 2, pad = border + 5, c = mk((w + pad * 2) * k, (h + pad * 2) * k), g = c.getContext('2d');
  g.setTransform(k, 0, 0, k, (pad + w / 2) * k, (pad + h) * k);
  try { draw(g); } catch (e) { console.error('sticker', key, e); }
  st = { img: stickerize(c, border * k), ax: (pad + w / 2) * k, ay: (pad + h) * k, k }; MSTK.set(key, st); return st;
}
const putSticker = (g, st, x, y, sc) => g.drawImage(st.img, x - st.ax * sc / st.k, y - st.ay * sc / st.k, st.img.width * sc / st.k, st.img.height * sc / st.k);
const mBlob = (g, P, col) => { P.forEach(([x, y, r]) => ball(g, x, y, r + 1.3, outl(col), 0)); P.forEach(([x, y, r]) => ball(g, x, y, r, col, 0)); };
const MART = {
  tree: g => { rrect(g, -2.4, -11, 4.8, 11, 1.4, '#7a4a28', 1); mBlob(g, [[-7, -17, 7.5], [7, -17, 7.5], [0, -25, 9.5], [0, -15, 8]], '#4f9a4a'); ell(g, -3, -28, 3, 2, 'rgba(255,255,255,.35)', 0); },
  magic: g => { rrect(g, -2.4, -11, 4.8, 11, 1.4, '#5a3a5a', 1); mBlob(g, [[-7, -17, 7.5], [7, -17, 7.5], [0, -25, 9.5], [0, -15, 8]], '#6f7fe0'); [[-6, -24], [5, -18], [1, -30]].forEach(([x, y]) => ball(g, x, y, 1.6, '#e8f4ff', 0)); },
  pine: g => { rrect(g, -2.2, -8, 4.4, 8, 1.2, '#6a4024', 1); [[13, -6, -15], [10.5, -13, -22], [7.5, -20, -31]].forEach(([w, y0, y1]) => poly(g, [[-w, y0], [w, y0], [0, y1]], '#3c7a46', 1.1)); },
  mountain: g => {
    poly(g, [[-25, 0], [-8, -30], [9, 0]], '#8e8880', 1.2); poly(g, [[-9, 0], [9, -40], [27, 0]], '#aaa49b', 1.2);
    poly(g, [[3.5, -28], [9, -40], [14.5, -28], [11, -30], [8, -26], [6, -30]], '#f6f3ec', .9); poly(g, [[-12, -22], [-8, -30], [-4, -22], [-7, -24]], '#f0ede6', .8);
    ln(g, [[9, -40], [14, -14], [11, 0]], 'rgba(40,30,25,.25)', 2);
  },
  hill: g => { g.beginPath(); g.ellipse(0, 0, 19, 12, 0, Math.PI, 0); g.closePath(); fi(g, radial(g, -4, -6, 18, '#b4a463'), 1.1); [[-8, -6], [3, -9], [10, -4]].forEach(([x, y]) => { ln(g, [[x, y], [x - 1.5, y - 4]], '#6f8a3a', 1.4); ln(g, [[x, y], [x + 1.5, y - 4]], '#6f8a3a', 1.4); }); },
  reeds: g => { ell(g, 0, -2.5, 16, 5, '#4f7f86', 1); [[-8, -3, -20], [-3, -3, -24], [3, -3, -22], [8, -3, -18]].forEach(([x, y0, y1]) => { inkLn(g, [[x, y0], [x + 1, y1]], '#5d8a3a', 1.6); ell(g, x + 1, y1 + 1, 1.8, 3.6, '#7a4a28', .8); }); },
  heather: g => { ell(g, 0, -2, 11, 3.5, '#5d7a3a', .9); [[-6, -5, 3.2], [0, -8, 3.6], [6, -5, 3.2], [-2, -3, 2.6], [4, -2, 2.4]].forEach(([x, y, r]) => ball(g, x, y, r, '#b06ac8', .8)); },
  flower: g => { ln(g, [[0, 0], [0, -6]], '#4f8a3a', 1.6); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2; ball(g, Math.cos(a) * 2.6, -8 + Math.sin(a) * 2.6, 2, '#ffffff', .6); } ball(g, 0, -8, 1.8, '#f2c230', .5); },
  rock: g => { g.beginPath(); g.moveTo(-10, 0); g.quadraticCurveTo(-11, -9, -3, -11); g.quadraticCurveTo(8, -12, 10, -3); g.lineTo(10, 0); g.closePath(); fi(g, radial(g, -3, -6, 11, '#9a968e'), 1.1); },
};
function mapArt(k) { return mapSticker('art:' + k, 56, 44, MART[k]); }
// une tuile épaisse : la tranche sombre dessous, le dessus dégradé, un liseré clair
function mapTile(g, x, y, s, col, cell) {
  const base = col ? (typeof seasonTint === 'function' ? seasonTint(col, cell.t) : col) : '#2b2338', v = (vh(cell.q, cell.r, 5) - .5) * .1;
  hexPath(g, x, y + s * .1, s * .93); g.fillStyle = shade(base, -.45); g.fill();
  hexPath(g, x, y, s * .93); const gr = g.createLinearGradient(x, y - s, x, y + s); gr.addColorStop(0, shade(base, .14 + v)); gr.addColorStop(1, shade(base, -.1 + v)); g.fillStyle = gr; g.fill();
  g.lineWidth = Math.max(1, s * .03); g.strokeStyle = col ? 'rgba(255,250,235,.3)' : 'rgba(255,255,255,.05)'; g.stroke();
}
// le relief d'une case : quelques stickers (du fond vers l'avant)
function mapFeatures(cell, x, y, s) {
  const R = rng(cell.i * 7 + 3), out = [], sc = s / 60, at = (dx, dy, k, art) => out.push({ y: y + dy * s, f: g => putSticker(g, mapArt(art), x + dx * s, y + dy * s, sc * k) });
  if (cell.t === 'foret' || cell.t === 'foretm') { const P = [[-.34, -.12], [.3, -.18], [-.02, .1], [.36, .3], [-.36, .32]]; P.slice(0, 3 + Math.floor(R() * 2.2)).forEach(([dx, dy]) => at(dx + (R() - .5) * .12, dy + (R() - .5) * .1, .92 + R() * .25, cell.t === 'foretm' ? 'magic' : R() < .45 ? 'pine' : 'tree')); }
  else if (cell.t === 'montagne') { at(-.05, .38, 1.2, 'mountain'); }
  else if (cell.t === 'colline') { at(-.22, .1, 1, 'hill'); at(.26, .36, .85, 'hill'); }
  else if (cell.t === 'marais') { at(-.1, .3, .9, 'reeds'); }
  else if (cell.t === 'lande') { at(-.28, .05, .85, 'heather'); at(.25, .3, .75, 'heather'); if (R() < .35) at(.05, -.2, .7, 'rock'); }
  else if (cell.t === 'plaine') { if (R() < .45) at((R() - .5) * .7, (R() - .3) * .5, .8, 'flower'); if (R() < .25) at((R() - .5) * .7, (R() - .2) * .5, .75, 'flower'); }
  return out;
}
const waves = (g, x, y, s, R, n, a) => { g.strokeStyle = `rgba(235,245,255,${a})`; g.lineWidth = Math.max(1.2, s * .035); g.lineCap = 'round'; for (let k = 0; k < n; k++) { const px = x + (R() - .5) * s * 1.05, py = y + (R() - .5) * s * .8, w = s * .14; g.beginPath(); g.moveTo(px - w, py); g.quadraticCurveTo(px - w / 2, py - w * .55, px, py); g.quadraticCurveTo(px + w / 2, py - w * .55, px + w, py); g.stroke(); } };
// un lieu : son dessin devient un sticker (mis en cache par sorte)
function siteSticker(st) { const z = HS * MAP_K * .62; return mapSticker('site:' + st.kind + ':' + (st.raid || st.rival || ''), z * 3.6, z * 3.9, g => { g.translate(0, -z * .9); siteIcon(g, st, 0, 0, 1); }, 3.5); }
// le nom d'un lieu : une étiquette de papier
function mTag(g, text, x, y, size, gold, placed) {
  g.font = `800 ${size}px "Grenze Gotisch", Georgia, serif`; const w = g.measureText(text).width + size * 1.1, h = size * 1.4;
  if (placed) {   // deux lieux voisins : l'étiquette se décale pour ne pas couvrir l'autre
    const hit = yy => placed.some(r => x - w / 2 < r[2] && x + w / 2 > r[0] && yy < r[3] && yy + h > r[1]);
    for (const dy of [0, h + 3, -(h + 3), 2 * (h + 3)]) if (!hit(y + dy)) { y += dy; break; }
    placed.push([x - w / 2, y, x + w / 2, y + h]);
  }
  rr(g, x - w / 2 + 2, y + 3, w, h, h * .4); g.fillStyle = 'rgba(10,6,4,.4)'; g.fill();
  rr(g, x - w / 2, y, w, h, h * .4); g.fillStyle = gold ? '#ffe7a0' : '#fff6e2'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#2a1c16'; g.stroke();
  g.fillStyle = '#2a1c16'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y + h / 2 + 1);
}
function mapLayer() {
  const w = world(), vis = mapVisible(), s = HS * MAP_K, pad = s * 2;
  const W2 = Math.ceil(SQ3 * s * (2 * MAP_R + 1) + pad * 2), H2 = Math.ceil(s * (3 * MAP_R + 2) + pad * 2), ox = W2 / 2, oy = H2 / 2;
  const c = mk(W2, H2), g = c.getContext('2d');
  g.fillStyle = '#16121c'; g.fillRect(0, 0, W2, H2);
  const cells = w.list.slice().sort((a, b) => a.r - b.r || a.q - b.q), XY = cell => { const [hx, hy] = hexXY(cell.q, cell.r, s); return [ox + hx, oy + hy]; };
  const sites = allSites(), siteAt = new Set(sites.map(st => st.i));
  // 1. les tuiles (celles du brouillard restent sombres)
  cells.forEach(cell => { const [x, y] = XY(cell), on = vis.has(cell.i); mapTile(g, x, y, s, on ? BIOMES[cell.t].col : null, cell); if (on && (cell.t === 'lac' || cell.t === 'mer')) waves(g, x, y, s, rng(cell.i * 7 + 3), cell.t === 'mer' ? 3 : 2, cell.t === 'mer' ? .4 : .35); });
  // 2. rivières (un ruban bordé de blanc) et routes (des points de couture), seulement là où on les voit
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
  (w.rivers || []).forEach(p => {
    const P = p.map(i => { const cl = w.list[i], [x, y] = XY(cl); return [x + (vh(cl.q, cl.r, 8) - .5) * s * .4, y + (vh(cl.q, cl.r, 9) - .5) * s * .35, vis.has(i)]; });
    for (let k = 0; k < P.length - 1; k++) {
      if (!P[k][2] || !P[k + 1][2]) continue;
      const a = k ? [(P[k - 1][0] + P[k][0]) / 2, (P[k - 1][1] + P[k][1]) / 2] : P[0], b = k + 1 < P.length - 1 ? [(P[k][0] + P[k + 1][0]) / 2, (P[k][1] + P[k + 1][1]) / 2] : P[k + 1], wd = s * (.11 + .11 * k / P.length);
      [['#fffdf5', wd + s * .09], ['#5f9ad6', wd], ['rgba(225,242,255,.55)', wd * .3]].forEach(([col, lw]) => { g.beginPath(); g.moveTo(a[0], a[1]); g.quadraticCurveTo(P[k][0], P[k][1], (P[k][0] + b[0]) / 2, (P[k][1] + b[1]) / 2); g.lineTo(b[0], b[1]); g.strokeStyle = col; g.lineWidth = lw; g.stroke(); });
    }
  });
  g.setLineDash([s * .14, s * .12]);
  w.roads.forEach(p => { for (let k = 1; k < p.length; k++) { const A = w.list[p[k - 1]], B = w.list[p[k]]; if (!vis.has(A.i) || !vis.has(B.i)) continue; const [x1, y1] = XY(A), [x2, y2] = XY(B);
    g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.strokeStyle = 'rgba(40,26,14,.7)'; g.lineWidth = s * .11; g.stroke(); g.strokeStyle = '#f3dfae'; g.lineWidth = s * .055; g.stroke(); } });
  g.restore();
  // 3. le relief en stickers, du fond vers l'avant
  const feats = []; cells.forEach(cell => { if (!vis.has(cell.i) || siteAt.has(cell.i)) return; const [x, y] = XY(cell); feats.push(...mapFeatures(cell, x, y, s)); });
  feats.sort((a, b) => a.y - b.y).forEach(o => o.f(g));
  // 4. le brouillard : quelques nuages sur les tuiles inconnues, et une lisière adoucie
  const fogR = rng(w.seed + 5);
  cells.forEach(cell => { if (vis.has(cell.i)) return; const [x, y] = XY(cell); for (let k = 0; k < 2; k++) { const px = x + (fogR() - .5) * s, py = y + (fogR() - .5) * s * .8, rr2 = s * (.45 + fogR() * .4); const gr = g.createRadialGradient(px, py, 0, px, py, rr2); gr.addColorStop(0, 'rgba(90,78,118,.32)'); gr.addColorStop(1, 'rgba(90,78,118,0)'); g.fillStyle = gr; g.beginPath(); g.arc(px, py, rr2, 0, 7); g.fill(); } });
  cells.forEach(cell => { if (!vis.has(cell.i)) return; const [hx, hy] = XY(cell); HEX_DIRS.forEach(([dq, dr]) => { const n = w.cell(cell.q + dq, cell.r + dr); if (n && !vis.has(n.i)) { const [nx, ny] = XY(n), mx = (hx + nx) / 2, my = (hy + ny) / 2; const gr = g.createRadialGradient(mx, my, 0, mx, my, s * .5); gr.addColorStop(0, 'rgba(30,24,40,.5)'); gr.addColorStop(1, 'rgba(30,24,40,0)'); g.fillStyle = gr; g.beginPath(); g.arc(mx, my, s * .5, 0, 7); g.fill(); } }); });
  // 5. les lieux en stickers, puis leurs étiquettes
  const shown = sites.filter(st => vis.has(st.i)).sort((a, b) => XY(a)[1] - XY(b)[1]), z = HS * MAP_K * .62;
  shown.forEach(st => { const [x, y] = XY(st), k = st.kind === 'cite' ? 1.2 : st.kind === 'chateau' ? 1.25 : 1; putSticker(g, siteSticker(st), x, y + s * .1 + z * .9 * k, k); });
  const placed = []; shown.forEach(st => { const [x, y] = XY(st); mTag(g, st.name, x, y + s * .52, st.kind === 'village' || st.kind === 'raid' ? 17 : 20, st.kind === 'chateau', placed); });
  // bord du monde
  const edge = g.createRadialGradient(ox, oy, s * MAP_R * 1.2, ox, oy, s * MAP_R * 1.85); edge.addColorStop(0, 'rgba(10,8,14,0)'); edge.addColorStop(1, 'rgba(10,8,14,.95)'); g.fillStyle = edge; g.fillRect(0, 0, W2, H2);
  // contour du champ de rayonnement (bords des cases à portée)
  const fr = glowRadius(), seg = [];
  w.list.forEach(cell => { if (hdist(cell.q, cell.r) > fr) return; const [hx, hy] = hexXY(cell.q, cell.r, s); HEX_DIRS.forEach(([dq, dr]) => { if (hdist(cell.q + dq, cell.r + dr) <= fr) return; const [nx, ny] = hexXY(cell.q + dq, cell.r + dr, s), mx = (hx + nx) / 2, my = (hy + ny) / 2, dx = ny - hy, dy = -(nx - hx), L = Math.hypot(dx, dy), e = s / SQ3; seg.push([ox + mx + dx / L * e, oy + my + dy / L * e, ox + mx - dx / L * e, oy + my - dy / L * e]); }); });
  MAPV.layer = { c, ox, oy, s, seg, vis, fr }; MAPV.dirty = false;
  return MAPV.layer;
}

/* ---------- fenêtre de la carte ---------- */
function mapDom() {
  let box = $('#world'); if (box) return box;
  box = el('div', 'world'); box.id = 'world'; box.hidden = true;
  box.innerHTML = `<canvas id="wcv" aria-label="Carte du Val"></canvas>
    <div class="wtop panel"><b>🗺️ La carte du Val</b><span id="wglow"></span><span class="wbtns"><button class="pill" type="button" data-w="center">⌂ Mon château</button><button class="pill" type="button" data-w="in" aria-label="Zoomer sur la carte">+</button><button class="pill" type="button" data-w="out" aria-label="Dézoomer la carte">−</button><button class="pill" type="button" data-w="help" aria-label="Le Grimoire : comment lire la carte du Val">📖</button><button class="pill on" type="button" data-w="close">↩ Retour au château</button></span></div>
    <aside class="wpanel panel" id="wpanel"></aside>`;
  $('#game').appendChild(box);
  const wcv = box.querySelector('#wcv');
  box.querySelector('.wtop').addEventListener('click', e => { const b = e.target.closest('[data-w]'); if (!b) return; const k = b.dataset.w;
    if (k === 'close') closeWorld(); else if (k === 'center') { MAPV.sel = siteById('home'); mapCenter(0, 0); renderMapPanel(); } else if (k === 'in') mapZoom(1.25); else if (k === 'out') mapZoom(.8); else if (k === 'help') openGrimoire('carte'); });
  box.querySelector('#wpanel').addEventListener('click', mapPanelClick);
  wcv.addEventListener('pointerdown', e => { try { wcv.setPointerCapture(e.pointerId); } catch (x) {} MAPV.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY }); if (MAPV.ptr.size === 1) MAPV.drag = { x: e.clientX, y: e.clientY, cx: MAPV.cam.x, cy: MAPV.cam.y, moved: false }; else if (MAPV.ptr.size === 2) { const [a, b] = [...MAPV.ptr.values()]; MAPV.drag = { pinch: Math.hypot(a.x - b.x, a.y - b.y), s: MAPV.cam.s, moved: true }; } });
  wcv.addEventListener('pointermove', e => {
    if (MAPV.ptr.has(e.pointerId)) MAPV.ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const d = MAPV.drag; if (!d) return;
    if (d.pinch && MAPV.ptr.size >= 2) { const [a, b] = [...MAPV.ptr.values()]; mapZoomTo(d.s * Math.hypot(a.x - b.x, a.y - b.y) / d.pinch, (a.x + b.x) / 2, (a.y + b.y) / 2); return; }
    const dx = e.clientX - d.x, dy = e.clientY - d.y; if (!d.moved && Math.hypot(dx, dy) > (e.pointerType === 'mouse' ? 6 : 14)) d.moved = true; if (d.moved) { MAPV.cam.x = d.cx + dx; MAPV.cam.y = d.cy + dy; }
  });
  const up = e => { MAPV.ptr.delete(e.pointerId); const d = MAPV.drag; if (MAPV.ptr.size === 0) MAPV.drag = null; if (d && !d.moved && !d.pinch && e.type === 'pointerup') mapClick(e); };
  wcv.addEventListener('pointerup', up); wcv.addEventListener('pointercancel', up);
  wcv.addEventListener('wheel', e => { e.preventDefault(); mapZoomTo(MAPV.cam.s * Math.exp(-e.deltaY * .0016), e.clientX, e.clientY); }, { passive: false });
  document.addEventListener('keydown', e => { if (MAPV.open && e.key === 'Escape' && !$('#modalRoot').children.length) closeWorld(); });
  return box;
}
function mapZoomTo(ns, px, py) { const r = $('#wcv').getBoundingClientRect(), s0 = MAPV.cam.s; ns = clamp(ns, .45, 2.6); const wx = (px - r.left - MAPV.cam.x) / s0, wy = (py - r.top - MAPV.cam.y) / s0; MAPV.cam.s = ns; MAPV.cam.x = px - r.left - wx * ns; MAPV.cam.y = py - r.top - wy * ns; }
function mapZoom(f) { const r = $('#wcv').getBoundingClientRect(); mapZoomTo(MAPV.cam.s * f, r.left + r.width / 2, r.top + r.height / 2); }
function mapCenter(q, r) { const cvw = $('#wcv'), [x, y] = hexXY(q, r, HS), wide = innerWidth > 760; MAPV.cam.x = cvw.clientWidth / 2 - x * MAPV.cam.s - (wide ? 160 : 0); MAPV.cam.y = cvw.clientHeight * (wide ? .5 : .3) - y * MAPV.cam.s; }
function openWorld(focusId) {
  if (VISIT) { toast('La carte, c’est chez toi : rentre d’abord de ta visite.', true); return; }
  world(); const box = mapDom(); box.hidden = false; MAPV.open = true; MAPV.dirty = true; closeModal(true); dropSticker();
  const cvw = $('#wcv'), vr = Math.max(4, visionRadius());
  MAPV.cam.s = clamp(Math.min(cvw.clientWidth / (SQ3 * HS * (2 * vr + 3)), cvw.clientHeight / (1.5 * HS * (2 * vr + 3))), .5, 1.6);
  const f = focusId && allSites().find(s => s.id === focusId); MAPV.sel = f || siteById('home'); mapCenter(MAPV.sel.q, MAPV.sel.r);
  renderMapPanel(); sfx('peel');
  cancelAnimationFrame(MAPV.raf); const loop = t => { if (!MAPV.open) return; MAPV.raf = requestAnimationFrame(loop); drawMap(t); }; MAPV.raf = requestAnimationFrame(loop);
  if (typeof tutoTip === 'function') {}
}
function closeWorld() { MAPV.open = false; cancelAnimationFrame(MAPV.raf); const b = $('#world'); if (b) b.hidden = true; sfx('tick'); }
function drawMap(t) {
  const cvw = $('#wcv'); if (!cvw) return;
  const dpr = Math.min(2, devicePixelRatio || 1), w = cvw.clientWidth, h = cvw.clientHeight;
  if (cvw.width !== Math.round(w * dpr) || cvw.height !== Math.round(h * dpr)) { cvw.width = Math.round(w * dpr); cvw.height = Math.round(h * dpr); }
  const L = MAPV.dirty || !MAPV.layer ? mapLayer() : MAPV.layer, g = cvw.getContext('2d'), k = MAPV.cam.s / MAP_K;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#0d0a12'; g.fillRect(0, 0, cvw.width, cvw.height);
  g.setTransform(dpr * k, 0, 0, dpr * k, dpr * (MAPV.cam.x - L.ox * k), dpr * (MAPV.cam.y - L.oy * k));
  g.imageSmoothingEnabled = true; g.drawImage(L.c, 0, 0);
  // champ de rayonnement : lueur dorée qui respire
  const pulse = .55 + .45 * Math.sin(t / 700);
  g.save(); g.lineCap = 'round';
  [[14, `rgba(255,200,90,${.12 * pulse})`], [6, `rgba(255,214,120,${.35 + .2 * pulse})`], [2.4, 'rgba(255,240,190,.95)']].forEach(([lw, col]) => { g.strokeStyle = col; g.lineWidth = lw; g.beginPath(); L.seg.forEach(([x1, y1, x2, y2]) => { g.moveTo(x1, y1); g.lineTo(x2, y2); }); g.stroke(); });
  g.restore();
  const w0 = world(), s = L.s, XY = c => { const [x, y] = hexXY(c.q, c.r, s); return [L.ox + x, L.oy + y]; };
  // route des prochains aventuriers, si on la connaît et que la Menace monte
  const nx = S.world.next && siteById(S.world.next);
  if (nx && S.menace >= MENACE_MAX - 2 && L.vis.has(nx.i)) { const p = w0.roads.get(nx.id) || []; g.save(); g.setLineDash([8, 9]); g.lineDashOffset = -t / 40; g.strokeStyle = 'rgba(255,90,70,.9)'; g.lineWidth = 3.4; g.beginPath(); p.forEach((i, j) => { const [x, y] = XY(w0.list[i]); j ? g.lineTo(x, y) : g.moveTo(x, y); }); g.stroke(); g.restore(); }
  // expéditions en cours
  const groups = new Map(); S.creatures.forEach(c => { if (c.expe) { const a = groups.get(c.expe.gid) || []; a.push(c); groups.set(c.expe.gid, a); } });
  groups.forEach(team => { const e = team[0].expe, cell = e.site ? siteById(e.site) : w0.list[e.hex]; if (!cell) return; const [x, y] = XY(cell); team.forEach((c, j) => { const img = portraitImg(c.sp); if (img) { const sz = s * .7, bx = x - s * .55 + j * s * .5, by = y - s * 1.25 + Math.sin(t / 300 + j) * 3; g.save(); g.beginPath(); g.arc(bx + sz / 2, by + sz / 2, sz / 2, 0, 7); g.fillStyle = '#2a1c16'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#e9b949'; g.stroke(); g.clip(); g.drawImage(img, bx, by, sz, sz); g.restore(); } }); });
  // sélection
  if (MAPV.sel) { const [x, y] = XY(MAPV.sel); g.save(); hexPath(g, x, y, s * .96); g.strokeStyle = `rgba(255,255,255,${.6 + .4 * Math.sin(t / 250)})`; g.lineWidth = 4; g.stroke(); g.restore(); }
  $('#wglow').textContent = `✨ ${GLOW_LV[glowLevel()][1]} (${radiance()}) · renommée sur ${L.fr} lieues`;
}
const PIMG = {};
function portraitImg(sp) { if (PIMG[sp]) return PIMG[sp].complete ? PIMG[sp] : null; const im = new Image(); im.src = portrait(sp); PIMG[sp] = im; return null; }
function mapClick(e) {
  const r = $('#wcv').getBoundingClientRect(), x = (e.clientX - r.left - MAPV.cam.x) / MAPV.cam.s, y = (e.clientY - r.top - MAPV.cam.y) / MAPV.cam.s;
  const [q, rr2] = hexRound((SQ3 / 3 * x - y / 3) / HS, (2 / 3 * y) / HS), cell = world().cell(q, rr2); if (!cell) return;
  const vis = mapVisible(), st = vis.has(cell.i) ? allSites().find(s => s.i === cell.i) : null;
  MAPV.sel = st || cell; sfx('tick'); renderMapPanel();
}

/* ---------- panneau d'informations et d'actions ---------- */
function renderMapPanel() {
  const p = $('#wpanel'); if (!p) return;
  const sel = MAPV.sel, w = world(), vis = mapVisible(); if (!sel) { p.innerHTML = ''; return; }
  const cell = w.list[sel.i], known = vis.has(sel.i), d = hdist(sel.q, sel.r), inField = d <= glowRadius();
  const where = `<p class="hint">${d ? `À ${d} lieue${d > 1 ? 's' : ''} du château · ` : ''}${BIOMES[cell.t] && known ? BIOMES[cell.t].name : 'Brouillard'}${inField && d ? ' · dans ton rayonnement ✨' : ''}</p>`;
  if (!known) {
    const edge = HEX_DIRS.some(([dq, dr]) => { const n = w.cell(sel.q + dq, sel.r + dr); return n && vis.has(n.i); });
    p.innerHTML = `<h3>🌫️ Terres inconnues</h3>${where}<p>Personne ne sait ce qu’il y a là-bas. Les aventuriers que tu repousses perdent parfois leurs carnets de route ; tes éclaireurs, eux, reviennent toujours (enfin, presque).</p>
      ${edge ? `<h4>Envoyer un éclaireur</h4><p class="hint">Une créature part une nuit et dévoile les environs (2 lieues autour de ce point).</p>${teamPicker(1)}<div class="btnrow"><button class="sbtn pri" type="button" data-m="scout">🔭 Envoyer en éclaireur</button></div>` : '<p class="hint">Trop loin pour un éclaireur : explore d’abord plus près du bord du brouillard.</p>'}`;
    return;
  }
  if (!sel.kind) { p.innerHTML = `<h3>${esc(BIOMES[cell.t].name)}</h3>${where}<p>${esc(BIOMES[cell.t].desc)}</p>${cell.river ? '<p class="hint">Une rivière coule ici, des montagnes vers l’eau.</p>' : ''}${w.onRoad.has(sel.i) ? '<p class="hint">Une route passe par ici.</p>' : ''}`; return; }
  const K = SITE_KINDS[sel.kind] || {}; let h = `<h3>${esc(sel.name)}</h3><p><span class="tag2">${esc(K.label || sel.kind)}</span></p>${where}`;
  if (sel.kind === 'chateau') {
    const lv = glowLevel(), nxt = GLOW_LV[lv + 1];
    h += `<p><b>Rayonnement : ${GLOW_LV[lv][1]}</b> (${radiance()}${nxt ? ` / ${nxt[0]} pour « ${nxt[1]} »` : ''}). Ta renommée porte à <b>${glowRadius()} lieues</b> : les villages et villes dans ce cercle doré t’envoient leurs aventuriers.</p>`;
    const o = heroOrigin(); if (o) h += `<p class="hint">Prochains aventuriers attendus : ${HERO_RANK[o.rank].label.toLowerCase()} de ${esc(o.name)}.</p>`;
    h += `<div class="btnrow"><button class="sbtn pri" type="button" data-m="glow">✨ D’où vient mon rayonnement ?</button></div>`;
  } else if (K.rank) {
    const reach = d <= glowRadius() + 1;
    h += `<p>${esc(K.desc)}</p><p>${reach ? `✨ Ta renommée est arrivée jusqu’ici : ${HERO_RANK[sel.rank].label.toLowerCase()} pourraient venir tenter leur chance.` : `Ils n’ont pas encore entendu parler de toi (il faudrait rayonner jusqu’à ${d - 1} lieues).`}</p>
      <div class="btnrow"><button class="sbtn pri" type="button" data-m="town">${sel.kind === 'village' ? '🏪 Aller à l’épicerie-buvette' : sel.kind === 'ville' ? '🏙️ Entrer en ville' : '🏰 Entrer dans la cité'}</button></div>${settleHTML(sel)}${sel.kind === 'cite' ? citeHTML() : ''}`;
  } else if (sel.kind === 'raid' || sel.kind === 'rival') {
    const key = sel.raid || 'r_' + sel.rival, tg = RAIDS[key];
    if (sel.kind === 'rival') { const rv = RIVALS.find(r => r.id === sel.rival); h += `<p>Le donjon de ${esc(rv.master)}. Sa réputation : ${rv.likes.filter(s => SPECIES[s]).map(s => `${SPECIES[s].name} <b>${rivalRep(rv, s)}</b> <span class="hint">(toi : ${repOf(s)})</span>`).join(' · ')}.${S.world.hit[rv.id] ? ` <b>Il a perdu de sa superbe</b> jusqu’à la nuit ${S.world.hit[rv.id]}.` : ''}${isVassal(rv.id) ? '' : ' Tes créatures peu loyales pourraient être tentées d’y partir.'}</p>${rivalHTML(rv)}`; }
    h += `<p>${esc(tg.desc)}</p><p class="hint">Butin ${costText(tg.reward)} · +${tg.hype} 🔥 · +${tg.menace} Menace · ${TAGS[tg.tag]}${tg.risk ? ` · bien gardé (−${tg.risk} dé)` : ''}${tg.tier > S.tier ? ` · 🔒 Palier ${tg.tier}` : ''}</p>
      <div class="btnrow"><button class="sbtn pri" type="button" data-m="raid" ${tg.tier > S.tier || (sel.rival && isVassal(sel.rival)) ? 'disabled' : ''}>🗺️ Préparer un raid</button></div>`;
  } else if (sel.kind === 'joueur') {
    h += `<p>Le château de <b>${esc(sel.master)}</b>, un autre Maître du Val. Rayonnement ${sel.glow || 0}, palier ${sel.tier || 0}.</p><div class="btnrow"><button class="sbtn pri" type="button" data-m="visit">🏰 Lui rendre visite</button></div>`;
  } else if (K.expe && typeof CRAWL_SITES !== 'undefined' && CRAWL_SITES.includes(sel.expe)) {
    const X = EXPE_SITES[sel.expe], ready = expeReady(sel), D = CRAWL_DG[sel.expe], planned = S.raid && S.raid.target === 'x_' + sel.id;
    h += `<p>${esc(D.desc)}</p><p class="hint">🃏 Une expédition en cartes, jouée cette nuit : 4 créatures au plus, trois étages, et le boss (${esc(CRAWL_EN[D.boss].name)}). On en rapporte de l’or, des matériaux, parfois un artefact (${X.arts.map(k => FURN[k].name).join(', ')})${X.meet ? `, et au bout, une rencontre : ${SPECIES[X.meet].name}` : ''}. Niveau ${String(crawlLevel()).replace('.', ',')}.${S.raid && !planned ? ' <b>Elle remplace le raid prévu cette nuit.</b>' : ''}</p>
      ${planned ? '<p class="ok">✅ Expédition prévue cette nuit.</p>' : ready ? `${teamPicker(4)}<div class="btnrow"><button class="sbtn pri" type="button" data-m="expe">🃏 Partir cette nuit</button></div>` : `<p class="no">On y retourne dans ${S.world.cd[sel.id] - S.night} nuit(s).</p>`}`;
  } else if (K.expe) {
    const X = EXPE_SITES[sel.expe], ready = expeReady(sel), meet = X.meet && SPECIES[X.meet];
    h += `<p>${esc({ foret: 'Une forêt où les arbres chuchotent et où les lucioles ont des opinions.', grotte: 'Une grotte qui résonne, pleine de pierres brillantes… et de choses qui préfèrent le noir.', ruines: 'Les restes d’une tour très ancienne. Des trésors, des pièges rouillés, et une liche qui grelotte.', pic: 'Le pic d’un vieux dragon ronchon. Dangereux, mais on y trouve des merveilles.', lac: 'Un lac noyé de brume, calme et mystérieux.' }[sel.expe])}</p>
      <p class="hint">Expédition de ${expeNights(sel)} nuit${expeNights(sel) > 1 ? 's' : ''} (2 créatures au plus, ${TAGS[X.tag]} conseillé${X.risk ? ', danger élevé' : ''}). On peut en rapporter ${[X.loot.g && 'de l’or', X.loot.s && 'des matériaux', X.loot.h && 'de la notoriété', X.loot.cal && 'de la sérénité'].filter(Boolean).join(', ')}, parfois un artefact (${X.arts.map(k => FURN[k].name).join(', ')})${meet ? `, et rencontrer une créature rare : ${meet.name}${worldMet(X.meet) ? ' (déjà rencontrée ✅)' : ''}` : ''}.</p>
      ${ready ? `${teamPicker(2)}<div class="btnrow"><button class="sbtn pri" type="button" data-m="expe">🧭 Lancer l’expédition</button></div>` : `<p class="no">On y retourne dans ${S.world.cd[sel.id] - S.night} nuit(s).</p>`}`;
  }
  p.innerHTML = h;
}
function teamPicker(max, list) {
  const crew = list || S.creatures.filter(c => !isOut(c)); MAPV.team = (MAPV.team || []).filter(id => crew.some(c => c.id === id)).slice(0, max); MAPV.max = max;
  return `<div class="wteam">${crew.map(c => `<button type="button" class="wmate" data-mate="${c.id}" aria-pressed="${MAPV.team.includes(c.id)}" title="${esc(c.name)} · ${esc(SPECIES[c.sp].name)} · ${diceOf(c)} 🎲"><img alt="" src="${thumb('char', c.sp)}"><span>${esc(c.name)}</span></button>`).join('') || '<p class="hint">Personne de disponible.</p>'}</div>`;
}
function mapPanelClick(e) {
  const mt = e.target.closest('[data-mate]');
  if (mt) { const id = mt.dataset.mate, t = MAPV.team || []; if (t.includes(id)) MAPV.team = t.filter(x => x !== id); else { t.push(id); MAPV.team = t.slice(-MAPV.max); } sfx('tick'); renderMapPanel(); return; }
  const rq = e.target.closest('[data-rq]');
  if (rq && !rq.disabled) { if (!run('request', { id: rq.dataset.rq, team: MAPV.team || [] })) return; sfx('chime'); toast('🤝 C’est noté ! Le village s’en souviendra.'); MAPV.team = []; afterChange(); renderMapPanel(); return; }
  const b = e.target.closest('[data-m]'); if (!b || b.disabled) return;
  const k = b.dataset.m, sel = MAPV.sel;
  if (k === 'glow') openRadiance();
  else if (k === 'town') openTown(sel.id);
  else if (k === 'raid') { closeWorld(); openRaid(sel.raid || 'r_' + sel.rival); }
  else if (k === 'siege') { closeWorld(); openRaid('mirebrume'); }
  else if (k === 'visit') { closeWorld(); valVisit(sel.pk); }
  else if (k === 'expe' || k === 'scout') {
    if (!(MAPV.team || []).length) { toast('Choisis qui part.', true); sfx('bad'); return; }
    if (!run(k, k === 'expe' ? { site: sel.id, team: MAPV.team } : { hex: sel.i, team: MAPV.team })) return;
    sfx('chime'); toast(k === 'expe' ? (typeof CRAWL_SITES !== 'undefined' && CRAWL_SITES.includes(sel.expe) ? `🃏 Expédition prévue cette nuit : ${sel.name}.` : `🧭 Expédition en route vers ${sel.name} !`) : '🔭 Ton éclaireur s’enfonce dans le brouillard…'); MAPV.team = []; afterChange(); renderMapPanel();
  }
}

/* ---------- le rayonnement en détail ---------- */
function openRadiance() {
  const v = radiance(), lv = glowLevel(v), nxt = GLOW_LV[lv + 1], parts = glowParts(), pp = partyPreview();
  openModal(`<h2>✨ Rayonnement : ${GLOW_LV[lv][1]}</h2>
    <div class="glowbar">${GLOW_LV.map(([m, n], i) => `<span class="${i <= lv ? 'on' : ''}">${n}<small>${m}</small></span>`).join('')}</div>
    <p>Ton château rayonne à <b>${v}</b>${nxt ? ` (encore ${nxt[0] - v} pour « ${nxt[1]} »)` : ''}. Sa renommée porte à <b>${glowRadius(lv)} lieues</b> sur la carte.</p>
    <h3>Ce qui le fait briller</h3><div>${parts.map(([t, n]) => `<span class="tag2">+${n} ${esc(t)}</span>`).join('') || '<span class="hint">Pas grand-chose pour l’instant…</span>'}</div>
    <p class="hint">Pour rayonner : expose des <b>artefacts</b> (moitié plus au Reliquaire), entasse des trésors, accueille des <b>créatures rares</b>, fais naître des légendes, monte de palier, ouvre des étages.</p>
    <h3>Ce que ça change</h3><ul><li>Les aventuriers viennent de plus loin, donc de plus fort : villages (${HERO_RANK[1].label.toLowerCase()}), puis villes, puis la cité. Prochaine bande : <b>${pp.size} ${HERO_RANK[pp.rank].label.toLowerCase()}</b>${pp.origin ? ` de ${esc(pp.origin.name)}` : ''}, ~${pp.courage} PV au total.</li>
    <li>Plus ils sont forts, plus ils sèment d’or en fuyant, et plus ils laissent tomber d’artefacts et de carnets de route.</li><li>Les créatures rares exigent un rayonnement minimum (Golem et Harpie 45, Fée 80, Liche 110).</li><li>La carte se dévoile autour du château, aussi loin que porte ta renommée.</li></ul>
    <div class="btnrow"><button class="sbtn pri" type="button" id="rgMap">🗺️ Voir la carte</button><button class="sbtn" type="button" data-wiki-open="rayonnement">📖 Grimoire</button></div>`, { wide: true, label: 'Rayonnement' }).querySelector('#rgMap').addEventListener('click', () => { closeModal(); if (!MAPV.open) openWorld(); });
}

/* ---------- mini-carte (en bas à droite, comme dans Civilization) ---------- */
let MM_SIG = '';
function renderMinimap() {
  const c = $('#mmcv'); if (!c || !S || !S.started || VISIT || !c.clientWidth) return;
  const w = world(), vis = mapVisible(), fr = glowRadius(), vr = Math.max(4, visionRadius() + 1), W2 = c.clientWidth, H2 = c.clientHeight;
  const sig = [w.seed, vis.size, fr, vr, W2, H2, S.world.known.length].join(':'); if (sig === MM_SIG) return; MM_SIG = sig;
  const dpr = Math.min(2, devicePixelRatio || 1); c.width = Math.round(W2 * dpr); c.height = Math.round(H2 * dpr);
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.fillStyle = '#16121c'; g.fillRect(0, 0, W2, H2);
  const s = Math.min(W2 / (SQ3 * (2 * vr + 1)), H2 / (3 * vr + 2)), ox = W2 / 2, oy = H2 / 2, XY = cc => { const [x, y] = hexXY(cc.q, cc.r, s); return [ox + x, oy + y]; };
  w.list.forEach(cell => { const [x, y] = XY(cell); if (x < -s || x > W2 + s || y < -s || y > H2 + s) return; hexPath(g, x, y, s + .4); g.fillStyle = vis.has(cell.i) ? BIOMES[cell.t].col : '#2a2236'; g.fill(); });
  g.strokeStyle = '#6aa2d8'; g.lineWidth = 1.4;
  (w.rivers || []).forEach(p => { for (let k = 1; k < p.length; k++) { if (!vis.has(p[k - 1]) || !vis.has(p[k])) continue; const [x1, y1] = XY(w.list[p[k - 1]]), [x2, y2] = XY(w.list[p[k]]); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); } });
  g.strokeStyle = 'rgba(217,183,122,.85)'; g.lineWidth = 1;
  w.roads.forEach(p => { for (let k = 1; k < p.length; k++) { if (!vis.has(p[k - 1]) || !vis.has(p[k])) continue; const [x1, y1] = XY(w.list[p[k - 1]]), [x2, y2] = XY(w.list[p[k]]); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); } });
  g.strokeStyle = 'rgba(255,214,120,.95)'; g.lineWidth = 1.5; g.beginPath();
  w.list.forEach(cell => { if (hdist(cell.q, cell.r) > fr) return; const [hx, hy] = hexXY(cell.q, cell.r, s); HEX_DIRS.forEach(([dq, dr]) => { if (hdist(cell.q + dq, cell.r + dr) <= fr) return; const [nx, ny] = hexXY(cell.q + dq, cell.r + dr, s), mx = (hx + nx) / 2, my = (hy + ny) / 2, dx = ny - hy, dy = -(nx - hx), L = Math.hypot(dx, dy), e = s / SQ3; g.moveTo(ox + mx + dx / L * e, oy + my + dy / L * e); g.lineTo(ox + mx - dx / L * e, oy + my - dy / L * e); }); });
  g.stroke();
  allSites().forEach(st => { if (!vis.has(st.i)) return; const [x, y] = XY(st); g.fillStyle = st.kind === 'chateau' ? '#ffd86a' : SITE_KINDS[st.kind].rank ? '#f3e3c0' : st.kind === 'rival' || st.kind === 'joueur' ? '#c49bff' : st.kind === 'raid' ? '#ff9a7a' : '#8fd4ff'; g.beginPath(); g.arc(x, y, st.kind === 'chateau' ? 3.4 : 2.3, 0, 7); g.fill(); g.lineWidth = 1; g.strokeStyle = 'rgba(20,12,8,.8)'; g.stroke(); });
}
addEventListener('resize', () => requestAnimationFrame(() => { MM_SIG = ''; renderMinimap(); }));
