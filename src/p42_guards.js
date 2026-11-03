/* =========================================================
   Les gardes : des créatures postées sur le chemin des héros
   Le poste de garde est à part de la pièce où une créature
   vit (son « poste » de travail, qui compte pour son humeur).
   Un nombre maximum de gardes ; le reste défend le Cœur.
   Le mode « Gardes » : on prend un sticker de créature sur le
   côté et on le colle sur une pièce du château.
   ========================================================= */
const guardCap = (s = S) => 3 + 2 * (s.tier || 0) + 2 * (s.rooms || []).filter(r => r.built && r.t === 'garde').length + ((s.craftRank && s.craftRank.guet) >= 2 ? 1 : 0) + ((s.craftRank && s.craftRank.guet) >= 3 ? 1 : 0);   // + le chemin de ronde et les meurtrières des sentinelles
const roomGuardCap = r => isHall(r) ? (S.craftRank && S.craftRank.guet >= 3 ? 3 : 2) : 1 + 2 * groupSize(r);   // un barrage de couloir : 2 ; une pièce : les places au premier rang d'un combat
const guardRoomOf = c => { const r = c && c.guard ? S.rooms.find(o => o.id === c.guard && o.built) : null; return r && guardable(r) ? r : null; };   // un couloir dont on a retiré le poste ne compte plus
const guardsOfRoom = r => { const ids = new Set(groupOf(r).rooms.map(o => o.id)); return S.creatures.filter(c => !isOut(c) && c.guard && ids.has(c.guard)); };
const guardCount = () => S.creatures.filter(c => !isOut(c) && guardRoomOf(c)).length;
const hallPost = r => !!r && (S.defs || []).some(d => d.x === r.x && d.y === r.y && zOf(d) === zOf(r) && (DEFS[d.t] || {}).post);
const guardable = r => !!r && r.built && r.t !== 'coeur' && !(ROOMS[r.t] || {}).out && !(ROOMS[r.t] || {}).stairs && (r.t !== 'couloir' || hallPost(r));   // une pièce, le porche, ou un couloir équipé d'un Poste de garde (un barrage)
Object.assign(CMD, {
  guard(a) {
    const c = critter(a.id); if (!c || isOut(c)) return 'Absent·e';
    if (!a.room) { c.guard = null; return null; }
    const r = S.rooms.find(x => x.id === a.room); if (!r || !r.built) return 'Pièce indisponible';
    if (r.t === 'coeur') return 'Le Cœur est défendu par toutes les créatures libres';
    if (!guardable(r)) return r.t === 'couloir' ? 'Un couloir ne se garde qu’avec un Poste de garde (Construire, onglet Pièges)' : 'Cette pièce ne se garde pas';
    if (c.guard !== r.id && !groupOf(r).rooms.some(o => o.id === c.guard)) {
      if (!guardRoomOf(c) && guardCount() >= guardCap()) return `Plus de poste de garde libre (${guardCap()} au plus) : retire d’abord un garde`;
      if (guardsOfRoom(r).length >= roomGuardCap(r)) return `${ROOMS[r.t].name} : ${roomGuardCap(r)} garde${roomGuardCap(r) > 1 ? 's' : ''} au plus`;
    }
    c.guard = r.id; return null;
  },
});
// le combat lit maintenant les postes de garde
guardsIn = function (e) { const ids = new Set(e.rooms); return S.creatures.filter(c => fitToFight(c) && c.guard && ids.has(c.guard) && guardRoomOf(c)); };
freeCrew = function () { return S.creatures.filter(c => fitToFight(c) && !guardRoomOf(c)); };
heartCrew = function (tactic) { return S.creatures.filter(c => fitToFight(c) && (tactic === 'cible' || !guardRoomOf(c))); };
// les vieilles parties : les créatures postées sur le chemin deviennent des gardes (dans la limite)
const upgradeStateGuards = upgradeState;
upgradeState = function (s) {
  s = upgradeStateGuards(s);
  if (s && s.creatures && !s.guardsV) {
    s.guardsV = 1; const cap = guardCap(s), per = {}; let n = 0;
    s.creatures.slice().sort((a, b) => guardOf(b) - guardOf(a)).forEach(c => {
      const r = c.post && (s.rooms || []).find(o => o.id === c.post && o.built && !(ROOMS[o.t] || {}).hall && o.t !== 'coeur' && o.t !== 'couloir');
      if (r && n < cap && (per[r.id] || 0) < 3) { c.guard = r.id; per[r.id] = (per[r.id] || 0) + 1; n++; }
    });
  }
  return s;
};
// une autre partie (chargée, nouvelle, visitée) : le mode Gardes ne reste pas ouvert par-dessus
const renderAllGuards = renderAll;
renderAll = function (...a) { if (GM.on && (GM.of !== S || (typeof VISIT !== 'undefined' && VISIT))) guardMode(false); return renderAllGuards(...a); };
// les places de garde sur le chemin des héros (une pièce : son premier rang ; un Poste de garde : 2)
const routeGuardCap = () => { const seen = new Set(); let n = 0; (heroRoute() || []).forEach(([x, y, z]) => { const r = roomAt(x, y, z || 0); if (!guardable(r)) return; const k = groupOf(r).rooms[0].id; if (seen.has(k)) return; seen.add(k); n += roomGuardCap(r); }); return n; };
const newStateGuards = newState;
newState = function (...a) { const r = newStateGuards(...a); if (S) { S.guardsV = 1; S.guardsV2 = 1; } return r; };
// les gardes postés dans un couloir sans Poste de garde rentrent défendre le Cœur (règle d'avant : tout couloir se gardait)
const upgradeStateHalls = upgradeState;
upgradeState = function (s) {
  s = upgradeStateHalls(s);
  if (s && s.creatures && !s.guardsV2) {
    s.guardsV2 = 1; let n = 0;
    s.creatures.forEach(c => { const r = c.guard && (s.rooms || []).find(o => o.id === c.guard); if (r && r.t === 'couloir' && !(s.defs || []).some(d => d.x === r.x && d.y === r.y && zOf(d) === zOf(r) && (DEFS[d.t] || {}).post)) { c.guard = null; n++; } });
    if (n && Array.isArray(s.log)) s.log.unshift({ n: s.night || 1, text: `🛡️ ${n} garde${n > 1 ? 's' : ''} posté${n > 1 ? 's' : ''} dans des couloirs rentre${n > 1 ? 'nt' : ''} au Cœur : un couloir ne se garde plus qu’avec un Poste de garde (onglet Pièges).`, tone: '' });
  }
  return s;
};

/* ---------- le mode « Gardes » ---------- */
const GM = { on: false, sel: null, drag: null, hover: null };
function guardHud() {
  let h = document.getElementById('guardHud');
  if (!GM.on) { if (h) h.remove(); return; }
  if (!h) { h = el('div', 'guardhud panel', ''); h.id = 'guardHud'; $('#game').appendChild(h); h.addEventListener('click', e => { if (e.target.closest('[data-gm="close"]')) guardMode(false); if (e.target.closest('[data-gm="clear"]')) { S.creatures.forEach(c => { c.guard = null; }); afterChange(); sfx('peel'); guardHud(); } }); }
  const n = guardCount(), cap = guardCap(), sel = GM.sel && critter(GM.sel);
  h.innerHTML = `<div class="gh-top"><b>${gi('shield')} Les gardes <span class="gh-n${n >= cap ? ' full' : ''}">${n}/${cap}</span></b><button type="button" class="sbtn" data-gm="clear">Tout retirer</button><button type="button" class="sbtn pri" data-gm="close">Terminé</button></div>
    <p>${sel ? `<b>${esc(sel.name)}</b> : touche une pièce du château (ou un Poste de garde) pour l’y poster, ou sa vignette pour la libérer.` : 'Glisse une créature de la liste sur une pièce <b>du chemin des héros</b> (en doré) : elle y arrêtera la bande. Un couloir ne se garde qu’avec un <b>Poste de garde</b> (Construire, onglet Pièges) : un barrage de 2 gardes au plus. Remets-la sur la liste pour la retirer ; les créatures libres défendent le Cœur.'}</p>`;
}
function guardMode(on) {
  GM.on = !!on; GM.of = on ? S : null; GM.sel = null; GM.drag = null; GM.hover = null;
  document.body.classList.toggle('guarding', GM.on);
  const b = $('#btnGuards'); if (b) { b.classList.toggle('on', GM.on); b.setAttribute('aria-pressed', GM.on); }
  if (GM.on) { if (UI.build) closeBuild(); dropSticker(); V.guardPath = true; sfx('tick'); } else V.guardPath = false;
  guardHud(); renderPortraits();
}
// les vignettes des créatures : un bouclier pour celles qui montent la garde
const renderPortraitsGuards = renderPortraits;
renderPortraits = function () {
  renderPortraitsGuards();
  document.querySelectorAll('#portraits .pt').forEach(b => {
    const c = critter(b.dataset.crit); if (!c) return;
    b.classList.toggle('guard', !!guardRoomOf(c)); b.classList.toggle('gsel', GM.on && GM.sel === c.id);
    if (guardRoomOf(c) && !b.querySelector('.gbadge')) { const s = el('span', 'gbadge', gi('shield')); b.appendChild(s); }
    if (GM.on) { b.draggable = false; b.title = `${c.name} · ${guardRoomOf(c) ? 'garde : ' + ROOMS[guardRoomOf(c).t].name : 'libre, défend le Cœur'} — glisse-la sur une pièce`; }
  });
};
// la pièce visée : d'abord une pastille (elle flotte au-dessus de sa pièce), puis la case, puis la pièce gardable la plus proche (un couloir n'a qu'une case de large)
const roomAtScreen = (cx, cy) => {
  const b = cv.getBoundingClientRect(), px = cx - b.left, py = cy - b.top;
  let best = null, bd = 1e9; (GM.hits || []).forEach(h => { const d = Math.hypot(px - h.x, py - h.y); if (d < h.r && d < bd) { bd = d; best = h.room; } }); if (best) return best;
  const [fx, fy] = tileAtScreen(px, py), at = (x, y) => x >= 0 && y >= 0 && x < W && y < H ? roomAt(x, y) : null, r0 = at(Math.floor(fx), Math.floor(fy));
  if (r0 && guardable(r0)) return r0;
  let near = null, nd = .95; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = Math.floor(fx) + dx, y = Math.floor(fy) + dy, r = at(x, y), d = Math.hypot(fx - x - .5, fy - y - .5); if (r && guardable(r) && d < nd) { nd = d; near = r; } }
  return near || r0;
};
function guardDrop(id, room) {
  const c = critter(id); if (!c) return;
  if (!room) { if (c.guard) { run('guard', { id, room: null }); sfx('peel'); } }
  else { const err = CMD.guard({ id, room: room.id }); if (err) { toast(err, true); sfx('bad'); } else { sfx('chime'); poofRoom(room); toast(`🛡️ ${c.name} monte la garde : ${ROOMS[room.t].name}.`); } }
  afterChange(); guardHud(); renderPortraits();
}
const poofRoom = r => { try { poof(r.x, r.y, r.w, r.h); } catch (e) {} };
// glisser une vignette (souris ou doigt), ou la toucher puis toucher une pièce
function bindGuards() {
  const box = $('#portraits');
  box.addEventListener('pointerdown', e => {
    if (!GM.on) return; const b = e.target.closest('.pt'); if (!b) return;
    const c = critter(b.dataset.crit); if (!c || isOut(c)) return;
    e.preventDefault(); GM.drag = { id: c.id, pid: e.pointerId, x0: e.clientX, y0: e.clientY, moved: false, ghost: null };   // le doigt qui a pris le portrait, et lui seul
  });
  addEventListener('pointermove', e => {
    const d = GM.drag; if (!d || e.pointerId !== d.pid) return;
    if (!d.moved && Math.hypot(e.clientX - d.x0, e.clientY - d.y0) > 7) { d.moved = true; const c = critter(d.id); d.ghost = el('div', 'gghost', `<img alt="" src="${portrait(c.sp)}">`); document.body.appendChild(d.ghost); }
    if (d.ghost) { d.ghost.style.left = e.clientX + 'px'; d.ghost.style.top = e.clientY + 'px'; const t = document.elementFromPoint(e.clientX, e.clientY); GM.hover = t === cv ? roomAtScreen(e.clientX, e.clientY) : null; d.ghost.classList.toggle('ok', !!(GM.hover && !CMDcheck(d.id, GM.hover))); }
  });
  addEventListener('pointerup', e => {
    const d = GM.drag; if (!d || e.pointerId !== d.pid) return; GM.drag = null; if (d.ghost) d.ghost.remove(); GM.hover = null;
    if (!d.moved) { GM.sel = GM.sel === d.id ? null : d.id; sfx('tick'); guardHud(); renderPortraits(); return; }
    const t = document.elementFromPoint(e.clientX, e.clientY);
    if (t === cv) guardDrop(d.id, roomAtScreen(e.clientX, e.clientY));
    else if (t && t.closest('#portraits')) guardDrop(d.id, null);
  });
  box.addEventListener('click', e => { if (GM.on) { e.stopPropagation(); e.preventDefault(); } }, true);
  box.addEventListener('dragstart', e => { if (GM.on) e.preventDefault(); });   // pas de glisser-déposer natif de l'image : c'est nous qui gérons
  addEventListener('pointercancel', e => { const d = GM.drag; if (!d || e.pointerId !== d.pid) return; if (d.ghost) d.ghost.remove(); GM.drag = null; GM.hover = null; });
  // une créature choisie, puis une pièce touchée
  cv.addEventListener('click', e => {
    if (!GM.on) return; e.stopPropagation(); e.preventDefault();
    const r = roomAtScreen(e.clientX, e.clientY);
    if (GM.sel) { const id = GM.sel; GM.sel = null; if (r && guardRoomOf(critter(id)) && groupOf(r).rooms.some(o => o.id === critter(id).guard)) guardDrop(id, null); else guardDrop(id, r); }
    else if (r && guardable(r) && guardsOfRoom(r).length) { const c = guardsOfRoom(r)[0]; guardDrop(c.id, null); toast(`${c.name} quitte son poste de garde.`); }
  }, true);
  cv.addEventListener('pointermove', e => { if (GM.on && GM.sel) GM.hover = roomAtScreen(e.clientX, e.clientY); });
  const b = $('#btnGuards'); if (b) b.addEventListener('click', () => { if (!UI.busy) guardMode(!GM.on); });
}
const CMDcheck = (id, r) => { const c = critter(id); if (!c) return 'Absent·e'; const save = c.guard; const err = CMD.guard({ id, room: r.id }); c.guard = save; return err; };

// sur le château : le chemin des héros en doré, et sur chaque pièce les vignettes de ses gardes
const drawOverlaysGuards = drawOverlays;
drawOverlays = function (t) {
  drawOverlaysGuards(t);
  if (!GM.on) return;
  const route = new Set(); try { (heroRoute() || []).forEach(([x, y, z]) => { const r = roomAt(x, y, z || 0); if (r && (z || 0) === Z) route.add(r.id); }); } catch (e) {}
  worldXf();
  S.rooms.forEach(r => { if (zOf(r) !== Z || !guardable(r)) return; if (route.has(r.id)) glowPath(footprint(r), '255,205,110', true, .8, [14, 10]); });
  const hov = GM.hover && guardable(GM.hover) ? GM.hover : null;
  if (hov) { const id = GM.drag ? GM.drag.id : GM.sel, bad = id && CMDcheck(id, hov); groupOf(hov).rooms.forEach(o => glowPath(footprint(o), bad ? '255,90,80' : '120,240,140', true, 1.2)); }
  screenXf();
  const seen = new Set(); GM.hits = [];
  S.rooms.forEach(r => {
    if (zOf(r) !== Z || !guardable(r)) return; const g = groupOf(r), k = g.rooms[0].id; if (seen.has(k)) return; seen.add(k);
    const gs = guardsOfRoom(r), cap = roomGuardCap(r), on = g.rooms.some(o => route.has(o.id)); if (!gs.length && !on) return;
    const cx = g.rooms.reduce((a, o) => a + o.x + o.w / 2, 0) / g.rooms.length, cy = g.rooms.reduce((a, o) => a + o.y + o.h / 2, 0) / g.rooms.length;
    const [sx, sy] = toScreen(...WP(cx, cy)), R = clamp(15 * CAM.s * 1.4, 11, 20);
    // un couloir libre : une petite pastille (ils se suivent en file, de grandes pastilles se chevaucheraient)
    if (!gs.length && isHall(r)) { const q = R * .62; ctx.beginPath(); ctx.arc(sx, sy, q + 2, 0, 7); ctx.fillStyle = '#fffdf5'; ctx.fill(); ctx.beginPath(); ctx.arc(sx, sy, q, 0, 7); ctx.fillStyle = '#e9b949'; ctx.fill(); const im = getSprite('icon', 'shield', 2).img, s = q * 1.25; ctx.drawImage(im, sx - s / 2, sy - s * im.height / im.width / 2, s, s * im.height / im.width); GM.hits.push({ x: sx, y: sy, r: q + 6, room: r }); return; }
    gs.slice(0, 3).forEach((c, i) => GM.hits.push({ x: sx + (i - (Math.min(3, gs.length) - 1) / 2) * R * 1.7, y: sy - R * 1.2, r: R + 4, room: r }));
    gs.slice(0, 3).forEach((c, i) => { const x = sx + (i - (Math.min(3, gs.length) - 1) / 2) * R * 1.7, y = sy - R * 1.2, img = portraitImg(c.sp);
      ctx.save(); ctx.beginPath(); ctx.arc(x, y, R + 2.5, 0, 7); ctx.fillStyle = '#fffdf5'; ctx.fill(); ctx.beginPath(); ctx.arc(x, y, R, 0, 7); ctx.fillStyle = '#3a2a24'; ctx.fill(); ctx.clip(); if (img) ctx.drawImage(img, x - R, y - R * 1.05, R * 2, R * 2.1); ctx.restore(); });
    const txt = `${gs.length}/${cap}`; ctx.font = `800 ${Math.round(R * .9)}px Andika, sans-serif`; const w = ctx.measureText(txt).width + R * 1.6;
    GM.hits.push({ x: sx, y: sy + R * .75, r: Math.max(w / 2, R * 1.2), room: r });
    rr(ctx, sx - w / 2, sy + R * .1, w, R * 1.3, R * .6); ctx.fillStyle = gs.length >= cap ? '#c8413a' : on ? '#e9b949' : 'rgba(30,22,18,.85)'; ctx.fill(); ctx.strokeStyle = '#fffdf5'; ctx.lineWidth = 2; ctx.stroke();
    const im = getSprite('icon', 'shield', 2).img, s = R * 1.1; ctx.drawImage(im, sx - w / 2 + R * .2, sy + R * .2, s, s * im.height / im.width);
    ctx.fillStyle = gs.length >= cap || on ? '#2a1c16' : '#fff3dc'; if (gs.length >= cap) ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(txt, sx + R * .45, sy + R * .78);
  });
};
// la fiche d'une pièce : ses gardes, et un bouton pour en poster
const openRoomGuards = openRoom;
openRoom = function (id) {
  openRoomGuards(id);
  const r = S.rooms.find(x => x.id === id), m = document.querySelector('#modalRoot .modal'); if (!r || !m || !guardable(r)) return;
  const gs = guardsOfRoom(r), box = el('div', 'gsec', `<h3>${gi('shield')} Gardes (${gs.length}/${roomGuardCap(r)})</h3><p>${gs.length ? gs.map(c => esc(c.name)).join(', ') : '<span class="hint">Personne ne garde cette pièce. Si les héros passent par ici, des gardes les y arrêtent.</span>'}</p><div class="btnrow"><button type="button" class="sbtn" data-gm="open">${gi('shield')} Placer des gardes (${guardCount()}/${guardCap()})</button></div>`);
  const foot = m.querySelector('.mbody .btnrow:last-child'); (foot ? foot.parentNode.insertBefore(box, foot) : m.querySelector('.mbody').appendChild(box));
  box.addEventListener('click', e => { if (e.target.closest('[data-gm="open"]')) { closeModal(); guardMode(true); } });
};
// la fiche d'une créature : son poste de garde
const openCreatureGuards = openCreature;
openCreature = function (id) {
  openCreatureGuards(id);
  const c = critter(id), m = document.querySelector('#modalRoot .modal'), post = m && m.querySelector('#mPost'); if (!c || !post) return;
  const dl = post.closest('dl'), rooms = builtRooms().filter(guardable);
  const opts = `<option value="">Aucun (défend le Cœur)</option>` + rooms.map(r => `<option value="${r.id}" ${c.guard === r.id ? 'selected' : ''}>${esc(ROOMS[r.t].name)}${zOf(r) ? ' · ' + FLOOR_SHORT[zOf(r)] : ''} (${guardsOfRoom(r).length}/${roomGuardCap(r)})</option>`).join('');
  const dt = el('dt', '', 'Garde'), dd = el('dd', '', `<select class="sel" id="mGuard" ${isOut(c) ? 'disabled' : ''} aria-label="Poste de garde de ${esc(c.name)}">${opts}</select> <span class="hint">${guardCount()}/${guardCap()} gardes</span>`);
  if (dl) { const at = post.closest('dd'); at.after(dt, dd); }
  dd.querySelector('select').addEventListener('change', e => { const err = CMD.guard({ id, room: e.target.value || null }); if (err) { toast(err, true); sfx('bad'); } else { sfx('tick'); afterChange(); } openCreature(id); });
};

const bindSoulsGuards = bindSouls;
bindSouls = function () { bindSoulsGuards(); try { bindGuards(); } catch (e) { console.error(e); } };
