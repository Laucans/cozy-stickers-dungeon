
/* =========================================================
   Le palier se monte au Cœur du donjon : sa fiche montre ce
   qu'il manque pour grandir, et une étoile dorée brille
   au-dessus de lui quand tout est prêt.
   ========================================================= */
function heartTierHTML() {
  const st = tierStatus();
  if (!st) return `<div class="htier max"><h3>⭐ Palier ${S.tier} : le maximum</h3><p class="hint">Ton Cœur bat aussi fort qu’un Cœur peut battre. Bravo, Maître !</p>
    <div class="btnrow"><button class="sbtn" type="button" id="hFloors">🪜 Étages et remparts</button></div></div>`;
  const n = st.rows.filter(r => r.ok).length, k = st.rows.length;
  return `<div class="htier${st.ok ? ' ok' : ''}"><h3>⭐ Palier ${S.tier} → ${S.tier + 1}</h3>${st.ok ? `<div class="btnrow"><button class="sbtn pri" type="button" id="hTier">⭐ Monter au Palier ${S.tier + 1}</button></div>` : ''}
    <p class="hint">Le Cœur grandit avec ton château. Chaque palier débloque des stickers, un étage de plus… et des aventuriers plus coriaces.</p>
    <div class="hbar" role="progressbar" aria-valuemin="0" aria-valuemax="${k}" aria-valuenow="${n}"><i style="width:${Math.round(n / k * 100)}%"></i><span>${n}/${k} conditions</span></div>
    <ul class="req">${st.rows.map(r => `<li>${r.ok ? '✅' : '⬜'} ${esc(r.text)}</li>`).join('')}</ul>
    <p><b>Débloque :</b> ${esc(st.next.unlock)}, et un étage de plus.</p>
    <div class="btnrow">${st.ok ? '' : `<button class="sbtn pri" type="button" id="hTier" disabled>⭐ Monter au Palier ${S.tier + 1}</button>`}<button class="sbtn" type="button" id="hFloors">🪜 Étages et remparts</button></div></div>`;
}
function tierCelebrate() {
  const h = heartRoom(); if (h && Z === zOf(h)) { poof(h.x, h.y, h.w, h.h); floatText(h.x + h.w / 2, h.y + h.h / 2, `⭐ Palier ${S.tier}`, '#ffe07a'); }
  banner(`⭐ Palier ${S.tier} !`, 'Le Cœur grandit : de nouveaux stickers sont disponibles', 1800);
  // puis une vraie fiche : ce qui vient d'être débloqué, et ce qu'il faut pour la suite
  const T = TIERS[S.tier - 1];
  setTimeout(() => { if ($('#modalRoot').children.length || UI.busy) return; const st = tierStatus();
    openModal(`<h2>⭐ Palier ${S.tier} !</h2><p>Le Cœur grandit : <b>${esc(T ? T.unlock : 'de nouveaux stickers')}</b>, et un étage de plus. Ouvre « Construire » pour les voir.</p>${st ? `<h3>Pour le Palier ${S.tier + 1}</h3><ul class="req">${st.rows.map(r => `<li>${r.ok ? '✅' : '⬜'} ${esc(r.text)}</li>`).join('')}</ul>` : '<p>C’est le palier le plus haut : ton Cœur ne peut pas battre plus fort.</p>'}<div class="btnrow"><button class="sbtn pri" type="button" data-close>En avant !</button></div>`, { label: 'Nouveau palier' }); }, 1900);
}
// la fiche du Cœur commence par son palier
const openRoomHeart = openRoom;
openRoom = function (id) {
  const r0 = openRoomHeart(id), r = S.rooms.find(x => x.id === id);
  if (!r || r.t !== 'coeur' || (typeof VISIT !== 'undefined' && VISIT)) return r0;
  const m = document.querySelector('#modalRoot .modal'), h = m && m.querySelector('.cardhead'); if (!h) return r0;
  h.insertAdjacentHTML('afterend', iconize(heartTierHTML()));
  const go = m.querySelector('#hTier'), fl = m.querySelector('#hFloors');
  go && go.addEventListener('click', () => { if (!run('tierUp')) return; sfx('chime'); closeModal(); afterChange(); tierCelebrate(); });
  fl && fl.addEventListener('click', () => { closeModal(); openTier(); });
  return r0;
};
// tous les chemins mènent au Cœur : le bouton du bas, la pastille « Palier disponible »
function openHeart() {
  const h = heartRoom(); if (!h) return openTier();
  if (Z !== zOf(h)) setFloor(zOf(h));
  openRoom(h.id);
}
// l'étoile au-dessus du Cœur (et sur le bouton) quand le palier suivant est à portée
setInterval(() => {
  if (typeof S === 'undefined' || !S || !S.started) return;
  const st = tierStatus(), ready = !!(st && st.ok) && !(typeof VISIT !== 'undefined' && VISIT);
  V.tierReady = ready; const b = document.getElementById('btnTier'); if (b) b.classList.toggle('ready', ready);
}, 600);
const drawSceneHeart = drawScene;
drawScene = function (t) {
  drawSceneHeart(t);
  V.tierStar = null;
  if (!V.tierReady || UI.hand) return;
  const h = heartRoom(); if (!h || !h.built || Z !== zOf(h)) return;
  worldXf(); glowPath(footprint(h), '255,206,96', true, 1.05 + .35 * Math.abs(Math.sin(t / 520)));
  screenXf();
  const [sx, sy] = toScreen(...WP(h.x + h.w / 2, h.y + h.h / 2));
  const y = sy - clamp(150 * CAM.s, 60, 150), r = clamp(15 * CAM.s * 1.4, 11, 17);
  stickerAt(sx, y, r, { ch: '★', bg: '#e9b949', fg: '#4a2a08', bob: 1 }, t); V.tierStar = [sx, y, r];
};
// l'étoile se touche directement : le Cœur est souvent plein de diablotins
const tapHeart = tap;
tap = function (e) {
  const st = V.tierStar;
  if (st && !UI.busy && !UI.hand && !(typeof VISIT !== 'undefined' && VISIT)) {
    const b = cv.getBoundingClientRect();
    if (Math.hypot(e.clientX - b.left - st[0], e.clientY - b.top - st[1]) < st[2] + 12) { openHeart(); return; }
  }
  return tapHeart(e);
};

/* ---------- déménager le Cœur : il change d'étage (la bande le trouve toujours au bout de son parcours) ---------- */
const heartMoveCost = () => ({ g: 80 + 40 * (S.heartMoves || 0), s: 12 });
// les pièces d'un étage qui ne tiendraient plus à rien (ni au porche, ni au palier, ni au Cœur)
function orphanRooms(z) {
  const root = floorHome(z); if (!root) return 0;
  const occ = new Map(); S.rooms.filter(o => zOf(o) === z).forEach(o => cellsOf(o).forEach(([x, y]) => occ.set(y * W + x, o)));
  const [sx, sy] = cellsOf(root)[0], seen = new Set([sy * W + sx]), q = [[sx, sy]];
  while (q.length) { const [x, y] = q.shift(); for (const [dx, dy] of DIRS) { const k = (y + dy) * W + x + dx; if (x + dx < 0 || y + dy < 0 || x + dx >= W || y + dy >= H || seen.has(k) || !occ.has(k)) continue; seen.add(k); q.push([x + dx, y + dy]); } }
  return new Set([...occ.entries()].filter(([k]) => !seen.has(k)).map(([, o]) => o.id)).size;
}
function heartMoveCheck(x, y, z) {
  const h = heartRoom(); if (!h) return 'Pas de Cœur';
  if (z === EXT) return 'Le Cœur reste à l’abri des remparts';
  if (!floorsOpen().includes(z)) return 'Cet étage n’existe pas encore';
  if (z === zOf(h)) return 'Le Cœur est déjà à cet étage : choisis un autre étage';
  const err = withZ(z, () => checkRoom('coeur', x, y, 2, 2)); if (err) return err;
  // on essaie pour de vrai : les héros doivent pouvoir l'atteindre, et rien ne doit rester isolé derrière lui
  const o = { x: h.x, y: h.y, z: zOf(h) }; h.x = x; h.y = y; h.z = z; dirty();
  let route = null, lost = 0; try { route = heroRoute(); lost = orphanRooms(o.z); } finally { h.x = o.x; h.y = o.y; if (o.z) h.z = o.z; else delete h.z; dirty(); }
  if (!route) return 'Le Cœur doit rester relié au porche : relie-le aux escaliers par un couloir';
  if (lost) return `${lost} pièce${lost > 1 ? 's' : ''} ${floorWord(o.z)} ne tiendrai${lost > 1 ? 'ent' : 't'} plus qu’au Cœur : relie-les d’abord au reste`;
  return null;
}
Object.assign(CMD, {
  moveHeart(a) {
    const h = heartRoom(), x = a.x | 0, y = a.y | 0, z = a.z | 0, c = heartMoveCost();
    if (!canAfford(c)) return `Il te faut ${costText(c)}`;
    const err = heartMoveCheck(x, y, z); if (err) return err;
    pay(c); const dx = x - h.x, dy = y - h.y, items = S.furn.filter(f => inRoomZ(h, f));
    h.x = x; h.y = y; if (z) h.z = z; else delete h.z;
    items.forEach(f => { f.x += dx; f.y += dy; if (z) f.z = z; else delete f.z; });
    S.heartMoves = (S.heartMoves || 0) + 1; dirty();
    addLog(`Le Cœur déménage ${floorWord(z)}.`, 'ev');
    return null;
  },
});
function heartMoveHTML() {
  const h = heartRoom(), c = heartMoveCost(), fl = floorsOpen().filter(z => z !== zOf(h));
  return `<div class="hmove"><h3>🚚 Déménager le Cœur</h3><p class="hint">Il bat ${esc(floorWord(zOf(h)))}. Tu peux l’installer à un autre étage : où qu’il soit, la bande le trouve au bout de son parcours. Ses meubles le suivent, ses défenseurs aussi. Coût : <b>${costText(c)}</b>${S.heartMoves ? ` (+40 💰 à chaque déménagement)` : ''}.</p>
    ${fl.length ? `<div class="btnrow">${fl.map(z => `<button type="button" class="sbtn" data-mvz="${z}" ${canAfford(c) ? '' : 'disabled'}>${z > 0 ? '▲' : z < 0 ? '▼' : '⌂'} ${esc(FLOOR_NAMES[z])}</button>`).join('')}</div>` : '<p class="hint">Ouvre d’abord un autre étage avec un escalier.</p>'}</div>`;
}
const openRoomMove = openRoom;
openRoom = function (id) {
  const r0 = openRoomMove(id), r = S.rooms.find(x => x.id === id);
  if (!r || r.t !== 'coeur' || (typeof VISIT !== 'undefined' && VISIT) || (typeof COOP !== 'undefined' && COOP.role === 'guest')) return r0;
  const m = document.querySelector('#modalRoot .modal'), at = m && (m.querySelector('.htier') || m.querySelector('.cardhead')); if (!at) return r0;
  at.insertAdjacentHTML('afterend', iconize(heartMoveHTML()));
  m.querySelectorAll('[data-mvz]').forEach(b => b.addEventListener('click', () => {
    const z = +b.dataset.mvz; closeModal(); if (Z !== z) setFloor(z);
    UI.hand = { kind: 'room', t: 'coeur', w: 2, h: 2, move: true }; UI.touchAnchor = null; UI.ghostKey = null;
    cv.classList.add('placing'); renderSheet(); renderHand(); sfx('peel'); showTip(null);
  }));
  return r0;
};
// pendant le déménagement, le Cœur « en main » se pose comme une pièce, mais avec ses propres règles
const validateHeart = validate;
validate = function (a) { if (!UI.hand || !UI.hand.move) return validateHeart(a); const c = heartMoveCost(); return canAfford(c) ? heartMoveCheck(a.x, a.y, Z) : `Il te faut ${costText(c)}`; };
const tryPlaceHeart = tryPlace;
tryPlace = function (a, fromDrag) {
  if (!UI.hand || !UI.hand.move) return tryPlaceHeart(a, fromDrag);
  const err = validate(a); if (err) { toast(err, true); sfx('bad'); return; }
  if (!run('moveHeart', { x: a.x, y: a.y, z: Z })) return;
  dropSticker(); sfx('chime'); afterChange(); const h = heartRoom(); poof(h.x, h.y, 2, 2);
  banner('🚚 Le Cœur a déménagé', `Il bat désormais ${esc(floorWord(Z))}`, 1800);
};
const renderHandHeart = renderHand;
renderHand = function (msg, tone) { renderHandHeart(msg || (UI.hand && UI.hand.move ? `🚚 Déménagement du Cœur (${costText(heartMoveCost())}) : touche l’endroit où le poser, ${floorWord(Z)}. Il doit toucher un couloir relié aux escaliers.` : msg), tone); };
