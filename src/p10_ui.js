
/* =========================================================
   Interface : barre du haut, portraits, barre de construction,
   suivi des envies, placement, fiches
   ========================================================= */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
const UI = { tab: 'room', hand: null, busy: false, phase: 'roder', prev: {}, tracker: true };
const PHASES = [['roder', 'Rôder'], ['calamite', 'Calamité'], ['raid', 'Raid'], ['contrecoup', 'Contrecoup'], ['aube', 'Aube']];
const STAT_LABELS = { gold: ['💰', 'or / nuit'], mat: ['🪵', 'matériaux / nuit'], hype: ['🔥', 'notoriété / nuit'], food: ['🍲', 'repas'], beds: ['🛏️', 'lits'],
  amb: ['🕯️', 'ambiance'], cal: ['🌿', 'calamité en moins'], guard: ['🛡️', 'garde'], harass: ['🪨', 'courage retiré à l’arrivée'], dice: ['🎲', 'dé de raid'], cells: ['⛓️', 'places de prison'] };
const statTags = o => Object.keys(STAT_LABELS).filter(k => o[k]).map(k => `<span class="tag2">${STAT_LABELS[k][0]} ${o[k] > 0 ? '+' : ''}${o[k]} ${STAT_LABELS[k][1]}</span>`).join('');
const hearts = m => `<span class="hearts" aria-label="Humeur ${m} sur 5">${'❤️'.repeat(m)}<span class="off">${'🤍'.repeat(5 - m)}</span></span>`;
const moodWord = m => m >= 4 ? 'Ravi·e (compétence ×2)' : m >= 2 ? 'Content·e' : m === 1 ? 'Boudeur·se (compétence éteinte)' : 'Furieux·se (compétence éteinte)';
const imgThumb = (kind, key, cls = '') => `<img class="th ${cls}" alt="" src="${kind === 'room' ? roomThumb(key) : thumb(kind, key)}">`;
const ico = (k, cls = '') => `<img class="ico ${cls}" alt="" src="${iconURL(k)}">`;
function clockSVG(n, f, col, size = 38) {
  const r = 19, c = 24; let p = '';
  for (let i = 0; i < n; i++) { const a0 = i / n * 2 * Math.PI - Math.PI / 2, a1 = (i + 1) / n * 2 * Math.PI - Math.PI / 2;
    p += `<path d="M${c} ${c} L${(c + r * Math.cos(a0)).toFixed(2)} ${(c + r * Math.sin(a0)).toFixed(2)} A${r} ${r} 0 0 1 ${(c + r * Math.cos(a1)).toFixed(2)} ${(c + r * Math.sin(a1)).toFixed(2)} Z" fill="${i < f ? col : '#3a2a20'}" stroke="#140c08" stroke-width="1.6"/>`; }
  return `<svg viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true"><circle cx="24" cy="24" r="23" fill="#140c08" stroke="#c99a4a" stroke-width="2"/>${p}</svg>`;
}

/* ---------- barre du haut ---------- */
function renderHUD() {
  $('#dname').textContent = S.name; $('#dtitle').textContent = castleTitle();
  const food = foodCap(), eat = eaters(), bd = beds(), n = S.creatures.length;
  const res = [['gold', 'Or', S.gold, 'Or : construire, meubler, monter de palier.'], ['mat', 'Matériaux', S.mat, 'Matériaux : bâtir les pièces et les couloirs.'],
    ['hype', 'Notoriété', S.hype, 'Notoriété : débloque les paliers… et attire les aventuriers.'], ['amb', 'Ambiance', ambiance(), 'Ambiance : meubles et déco douillets. Rend les créatures heureuses.'],
    ['beds', 'Lits', `${n}/${bd}`, 'Créatures / lits. Sans lit libre, personne de nouveau ne s’installe.', n >= bd], ['food', 'Repas', `${eat}/${food}`, 'Bouches à nourrir / repas produits.', eat > food],
    ['tier', 'Palier', S.tier, 'Palier du château.'], ['night', 'Nuit', S.night, 'Nuit en cours.']];
  const box = $('#res');
  if (!box.children.length) res.forEach(([k]) => { const c = el('div', 'res'); c.dataset.k = k; box.appendChild(c); });
  res.forEach(([k, label, val, tip, warn]) => {
    const c = box.querySelector(`[data-k="${k}"]`); c.className = 'res' + (warn ? ' warn' : ''); c.title = tip;
    c.innerHTML = `${ico(k)}<span><b class="num">${val}</b><small>${label}</small></span>`;
    if (UI.prev[k] !== undefined && UI.prev[k] !== val) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
    UI.prev[k] = val;
  });
  const scout = S.creatures.some(c => SPECIES[c.sp].scout), pp = partyPreview();
  $('#clocks').innerHTML =
    `<div class="dial" title="Calamité : la faim, la mauvaise humeur et la promiscuité la font monter. Pleine, une catastrophe arrive.">${clockSVG(CAL_MAX, Math.min(S.calamity, CAL_MAX), '#d9542f')}<span><small>Calamité</small><b class="num">${S.calamity}/${CAL_MAX}</b></span></div>` +
    `<div class="dial" title="Menace : tes raids et ta notoriété la font monter. Pleine, des aventuriers attaquent.">${clockSVG(MENACE_MAX, Math.min(S.menace, MENACE_MAX), '#5a86d0')}<span><small>Menace${scout ? ` · ${pp.size} héros ~${pp.courage}` : ''}</small><b class="num">${S.menace}/${MENACE_MAX}</b></span></div>`;
  $('#phases').innerHTML = PHASES.map(([k, l], i) => (i ? '<i>›</i>' : '') + `<span class="${UI.phase === k ? 'on' : ''}">${l}</span>`).join('');
  const rn = $('#raidnote');
  if (S.raid) { const b = raidBreakdown(S.raid.target, S.raid.team); rn.innerHTML = `${RAIDS[S.raid.target].emo} Raid prévu : <b>${esc(RAIDS[S.raid.target].name)}</b> · ${Math.max(0, b.pool)} dé${b.pool > 1 ? 's' : ''}`; rn.hidden = false; }
  else rn.hidden = true;
}

/* ---------- barre de construction ---------- */
function sheetGroups() {
  if (UI.tab === 'room') return [[null, ROOM_ORDER.map(t => ['room', t])]];
  if (UI.tab === 'def') return [[null, DEF_ORDER.map(t => ['def', t])]];
  if (UI.tab === 'decor') return [[null, DECOR_ORDER.map(t => ['furn', t])]];
  const by = {}; FURN_ORDER.forEach(t => { (by[FURN[t].room] = by[FURN[t].room] || []).push(['furn', t]); });
  return Object.keys(by).map(r => [ROOMS[r].name, by[r]]);
}
function renderSheet() {
  const sh = $('#sheet'); sh.innerHTML = '';
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === UI.tab));
  for (const [title, items] of sheetGroups()) {
    if (title) sh.appendChild(el('div', 'grp', `<span>${esc(title)}</span>`));
    for (const [kind, t] of items) {
      const av = availability(kind, t); if (av && av.hide) continue;
      const cost = costOf(kind, t), free = kind !== 'room' && S.free[t] > 0;
      const b = el('button', 'card' + (av && av.lock ? ' locked' : '') + (UI.hand && UI.hand.kind === kind && UI.hand.t === t ? ' sel' : ''));
      b.type = 'button'; b.dataset.kind = kind; b.dataset.t = t;
      b.innerHTML = `${free ? `<span class="free">×${S.free[t]}</span>` : ''}${av && av.lock ? `<span class="lock">🔒 ${esc(av.reason)}</span>` : ''}<span class="pv">${imgThumb(kind, t)}</span><span class="nm">${esc(itemName(t))}</span><span class="cost ${canAfford(cost) ? '' : 'no'}">${costText(cost)}</span>`;
      b.setAttribute('aria-label', `${itemName(t)}, ${costText(cost)}${av && av.lock ? ', nécessite ' + av.reason : ''}`);
      sh.appendChild(b);
    }
  }
}
function tipHTML(kind, t) {
  let html = '';
  if (kind === 'room') { const r = ROOMS[t]; html = `<b>${esc(r.name)}</b><span class="hint">${r.size[0]}×${r.size[1]}${r.clock ? ` · chantier de ${r.clock} segments` : ''}</span><p>${esc(r.desc)}</p>${r.furn ? `<p class="hint">Meubles : ${r.furn.map(f => FURN[f].name).join(', ')}.</p>` : ''}`; }
  else if (kind === 'def') { const f = DEFS[t]; html = `<b>${esc(f.name)}</b><span class="hint">${f.kind}${f.str ? ` · force ${f.str}` : ''}</span><p>${esc(f.desc)}</p>`; }
  else { const f = FURN[t], fans = SPECIES_ORDER.filter(s => SPECIES[s].likes === t).map(s => SPECIES[s].name); html = `<b>${esc(f.name)}</b><span class="hint">${f.room !== 'any' ? `pour : ${esc(ROOMS[f.room].name)}` : 'déco, partout'}</span><div>${statTags(f)}</div>${fans.length ? `<p class="hint">Adoré par : ${fans.join(', ')}.</p>` : ''}${t === 'toile' ? '<p class="hint">Deux toiles attirent une Araignée.</p>' : ''}`; }
  const av = availability(kind, t); if (av && av.lock) html += `<p class="no">🔒 Nécessite : ${esc(av.reason)}</p>`;
  return html;
}
function showTip(card) {
  const tip = $('#tip'); if (!card) { tip.hidden = true; return; }
  tip.innerHTML = tipHTML(card.dataset.kind, card.dataset.t); tip.hidden = false;
  const r = card.getBoundingClientRect(), tw = tip.offsetWidth;
  tip.style.left = clamp(r.left + r.width / 2 - tw / 2, 8, innerWidth - tw - 8) + 'px'; tip.style.top = (r.top - tip.offsetHeight - 10) + 'px';
}

/* ---------- portraits, envies ---------- */
function renderPortraits() {
  const box = $('#portraits'); box.innerHTML = '';
  [...S.creatures].sort((a, b) => SPECIES_ORDER.indexOf(a.sp) - SPECIES_ORDER.indexOf(b.sp)).forEach(c => {
    const sp = SPECIES[c.sp], post = c.post && S.rooms.find(r => r.id === c.post);
    const b = el('button', 'pt' + (V.selected === c.id ? ' on' : '') + (c.raid ? ' away' : '') + (c.tempt ? ' tempt' : '')); b.type = 'button'; b.dataset.crit = c.id;
    const q = c.quest, st = c.away ? '🧭' : c.raid ? '🗺️' : c.tempt ? '👀' : q && q.st === 'done' ? '✨' : q && q.st === 'offered' ? '❗' : post ? '📍' : '';
    b.title = `${c.name} · ${sp.name} · niv. ${c.lvl || 1} · ${c.away ? 'en mission' : c.raid ? 'en raid' : post ? 'poste : ' + ROOMS[post.t].name : 'libre, garde le Cœur'}${c.tempt ? ' · lorgne vers ' + c.tempt.name : ''}${q && q.st === 'offered' ? ' · a une demande' : ''}${q && q.st === 'done' ? ' · mission à réclamer' : ''}`;
    b.innerHTML = `<span class="ring"><img alt="" src="${portrait(c.sp)}"></span><span class="mood m${c.mood}"></span>${st ? `<span class="st">${st}</span>` : ''}${c.lvl > 1 ? `<span class="lv">${c.lvl}</span>` : ''}`;
    box.appendChild(b);
  });
  $('#critCount').textContent = S.creatures.length;
}
function renderGoals() {
  const ul = $('#goals'); ul.innerHTML = '';
  GOALS.filter(g => !S.goals[g.id]).slice(0, 3).forEach(g => ul.appendChild(el('li', '', `<span class="ck">✦</span><span>${esc(g.text)}</span><span class="rw">${esc(rewardText(g.reward))}</span>`)));
  const n = GOALS.filter(g => S.goals[g.id]).length;
  if (n === GOALS.length) ul.appendChild(el('li', '', '<span class="ck">👑</span><span>Toutes les envies sont comblées !</span>'));
  $('#goalCount').textContent = `${n}/${GOALS.length}`;
  $('#tracker').classList.toggle('closed', !UI.tracker);
  renderQuests();
}
function renderQuests() {
  const ul = $('#quests'); if (!ul) return;
  const qs = S.creatures.filter(c => questOf(c)).sort((a, b) => ({ done: 0, offered: 1, active: 2, away: 3 })[a.quest.st] - ({ done: 0, offered: 1, active: 2, away: 3 })[b.quest.st]);
  ul.innerHTML = qs.map(c => { const q = c.quest, T = QT[q.k], st = q.st === 'offered' ? 'nouvelle demande' : q.st === 'done' ? 'à réclamer !' : q.st === 'away' ? `retour nuit ${c.awayUntil}` : T.prog(q, c);
    return `<li class="q-${q.st}"><button type="button" data-crit="${c.id}"><span class="ck">${q.st === 'done' ? '✨' : q.st === 'offered' ? '❗' : T.ico}</span><span class="qt"><b>${esc(c.name)}</b> · ${esc(q.title)}<small>${esc(st)}</small></span></button></li>`; }).join('')
    || `<li class="none"><span class="hint">${S.night < 3 ? 'Tes créatures te confieront leurs envies dès la nuit 3.' : 'Pas de demande en ce moment.'}</span></li>`;
  $('#questCount').textContent = `${qs.length}/${questSlots()}`;
  requestAnimationFrame(placeZoom);
}
// les boutons de zoom se rangent sous le suivi des envies, quelle que soit sa hauteur
function placeZoom() { const z = $('.zoom'), tr = $('#tracker'); if (!z || !tr) return; z.style.top = innerWidth > 900 && tr.offsetParent ? Math.round(tr.getBoundingClientRect().bottom + 12) + 'px' : ''; }
addEventListener('resize', () => requestAnimationFrame(placeZoom));
function renderHand(msg, tone) {
  const hb = $('#handbar');
  if (!UI.hand) { hb.hidden = true; return; }
  hb.hidden = false; const { kind, t } = UI.hand, rot = kind === 'room' && ROOMS[t].size[0] !== ROOMS[t].size[1];
  hb.innerHTML = `${imgThumb(kind, t, 'mini')}<span class="msg ${tone || ''}">${msg ? esc(msg) : `<b>${esc(itemName(t))}</b> en main (${costText(costOf(kind, t))}). Touche le château pour coller.`}</span>` +
    (rot ? '<button class="pill" id="btnRot" type="button">⟳ Tourner (R)</button>' : '') + '<button class="pill" id="btnDrop" type="button">✕ Ranger</button>';
}
function renderAll() { V.dirty = true; renderHUD(); renderSheet(); renderPortraits(); renderGoals(); renderHand(); syncActors(); }

/* ---------- placement ---------- */
function takeSticker(kind, t) {
  const av = availability(kind, t);
  if (av && av.lock) { toast(`🔒 ${itemName(t)} : nécessite ${av.reason}.`, true); sfx('bad'); return false; }
  if (av && av.poor) { toast(`Il te faut ${costText(costOf(kind, t))} pour ${itemName(t)}.`, true); sfx('bad'); return false; }
  const size = kind === 'room' ? ROOMS[t].size : [1, 1], keep = UI.hand && UI.hand.t === t ? UI.hand : null;
  UI.hand = { kind, t, w: keep ? keep.w : size[0], h: keep ? keep.h : size[1] }; UI.touchAnchor = null;
  cv.classList.add('placing'); renderSheet(); renderHand(); sfx('peel'); showTip(null);
  if (UI.lastPt && UI.lastPt.mouse) updateGhost(UI.lastPt);
  return true;
}
function dropSticker() { if (!UI.hand) return; UI.hand = null; V.ghost = null; UI.ghostKey = null; UI.touchAnchor = null; cv.classList.remove('placing'); renderSheet(); renderHand(); }
function rotateHand() { if (!UI.hand || UI.hand.kind !== 'room') return; [UI.hand.w, UI.hand.h] = [UI.hand.h, UI.hand.w]; sfx('tick'); if (UI.lastPt) updateGhost(UI.lastPt); }
function anchorAt(cx, cy) {
  const r = cv.getBoundingClientRect(), sx = cx - r.left, sy = cy - r.top, inside = sx >= 0 && sy >= 0 && sx <= r.width && sy <= r.height;
  const [gx, gy] = tileAtScreen(sx, sy);
  if (!UI.hand || UI.hand.kind !== 'room') return { inside, x: Math.floor(gx), y: Math.floor(gy) };
  return { inside, x: Math.round(gx - UI.hand.w / 2), y: Math.round(gy - UI.hand.h / 2) };
}
function validate(a) {
  const { kind, t, w, h } = UI.hand, av = availability(kind, t);
  if (av && av.lock) return `Nécessite : ${av.reason}`;
  if (av && av.poor) return `Il te faut ${costText(costOf(kind, t))}`;
  if (kind === 'room') return checkRoom(t, a.x, a.y, w, h);
  if (kind === 'def') return checkDef(t, a.x, a.y);
  return checkFurn(t, a.x, a.y);
}
function updateGhost(pt) {
  if (!UI.hand) return;
  const a = anchorAt(pt.x, pt.y); if (!a.inside) { V.ghost = null; return; }
  const err = validate(a), { kind, t, w, h } = UI.hand, cells = [];
  for (let dy = 0; dy < (kind === 'room' ? h : 1); dy++) for (let dx = 0; dx < (kind === 'room' ? w : 1); dx++) cells.push([a.x + dx, a.y + dy]);
  V.ghost = { cells, ok: !err, kind, key: t, ax: a.x, ay: a.y };
  const key = err || 'ok'; if (UI.ghostKey !== key) { UI.ghostKey = key; renderHand(err || 'Parfait, ça colle ici !', err ? 'bad' : 'ok'); }
}
function tryPlace(a, fromDrag) {
  const err = validate(a);
  if (err) { toast(err, true); sfx('bad'); if (fromDrag) dropSticker(); return; }
  const { kind, t, w, h } = UI.hand;
  const e2 = cmd('place', { kind, t, x: a.x, y: a.y, w, h });
  if (e2) { toast(e2, true); sfx('bad'); if (fromDrag) dropSticker(); return; }
  sfx('pop'); afterChange();
  const av = availability(kind, t);
  if (fromDrag || av || (kind === 'room' && t !== 'couloir')) dropSticker(); else { UI.ghostKey = null; renderSheet(); if (UI.lastPt) updateGhost(UI.lastPt); }
}
function afterChange() {
  if (typeof VISIT !== 'undefined' && VISIT) { renderAll(); return; }
  checkGoals().forEach(g => { toast(`✦ Envie comblée : ${g.text} → ${rewardText(g.reward)}`); sfx('chime'); addLog(`Envie comblée : ${g.text}.`, 'ev'); });
  checkQuests().forEach(c => { toast(`✨ ${c.name} : mission accomplie ! Réclame ta récompense.`); sfx('chime'); });
  announceAch(checkAch());
  renderAll(); save();
  if (COOP.role === 'host') coopDirty();
}
// lance une commande et signale l’erreur éventuelle
function run(name, a) { const err = cmd(name, a); if (err) { toast(err, true); sfx('bad'); return false; } return true; }

/* ---------- fenêtres ---------- */
function openModal(html, opts = {}) {
  closeModal(true);
  const bd = el('div', 'backdrop');
  bd.innerHTML = `<div class="modal ${opts.wide ? 'wide' : ''} ${opts.cls || ''}" role="dialog" aria-modal="true" aria-label="${esc(opts.label || 'Fenêtre')}">${opts.noClose ? '' : '<button class="x" type="button" aria-label="Fermer" data-close>✕</button>'}<div class="mbody">${html}</div></div>`;
  $('#modalRoot').appendChild(bd);
  bd.addEventListener('click', e => { if (!opts.noClose && (e.target === bd || e.target.closest('[data-close]'))) closeModal(); });
  const m = bd.querySelector('.modal');
  setTimeout(() => { const f = m.querySelector('[data-focus]') || m.querySelector('button:not(.x)'); if (f) f.focus({ preventScroll: true }); }, 30);
  UI.modalNoClose = !!opts.noClose; return m;
}
function closeModal(silent) { $('#modalRoot').innerHTML = ''; UI.modalNoClose = false; UI.mctx = null; if (!silent && S && !S.started) setTimeout(openIntro, 0); }
function confirmBtn(btn, label, action) {
  if (btn.dataset.armed) { action(); return; }
  btn.dataset.armed = '1'; const old = btn.innerHTML; btn.innerHTML = label;
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.innerHTML = old; } }, 3000);
}
function roomStats(r) { const o = {}; Object.keys(STAT_LABELS).forEach(k => { const v = rstat(r, k); if (v) o[k] = v; }); return o; }
function openRoom(id) {
  const r = S.rooms.find(x => x.id === id); if (!r) return;
  const d = ROOMS[r.t], items = furnIn(r);
  let html = `<div class="cardhead"><div class="portrait room">${imgThumb('room', r.t)}</div><div><h2>${esc(d.name)}</h2><p class="hint">${esc(d.desc)}</p></div></div>`;
  if (!r.built) html += `<div class="clockrow">${clockSVG(d.clock, r.prog, '#d9542f', 80)}<p>Chantier : ${r.prog}/${d.clock} segments. Chaque nuit, tes ouvriers en remplissent ${workPerNight()}, en commençant par le plus ancien chantier. Tu peux déjà le meubler.</p></div>`;
  else if (!isHall(r)) html += `<h3>Effets</h3><div>${statTags(roomStats(r)) || '<span class="hint">Aucun effet pour l’instant : ajoute des meubles.</span>'}</div>`;
  if (d.syn) html += `<p class="hint">${neighborsTypes(r).has(d.syn.adj) ? '✅' : '➕'} Bonus si elle touche : ${ROOMS[d.syn.adj].name}.</p>`;
  if (d.attracts) html += `<p class="hint">Attire ${d.attracts.map(s => SPECIES[s].name + (SPECIES[s].tier && S.tier < SPECIES[s].tier ? ` (Palier ${SPECIES[s].tier})` : '')).join(' et ')} une fois meublée${furnished(r) ? ' ✅' : ''}.</p>`;
  if (!isHall(r) && r.t !== 'porche') {
    html += `<h3>Meubles (${items.length}/${r.w * r.h})</h3><div class="flist">${items.map(f => `<div class="frow">${imgThumb('furn', f.t)}<span><b>${esc(FURN[f.t].name)}</b><br>${statTags(FURN[f.t])}</span>${f.fixed ? '<span class="hint">fixe</span>' : `<button class="sbtn" type="button" data-unstick="${f.id}">Décoller</button>`}</div>`).join('') || '<p class="hint">Aucun meuble.</p>'}</div>`;
    const can = (d.furn || []).filter(t => !(FURN[t].tier && S.tier < FURN[t].tier));
    if (can.length && items.length < r.w * r.h) html += `<h3>Ajouter</h3><div class="btnrow">${can.map(t => `<button class="sbtn" type="button" data-take="${t}">${imgThumb('furn', t, 'mini')} ${esc(FURN[t].name)} · ${costText(costOf('furn', t))}</button>`).join('')}</div>`;
  }
  if (r.t === 'coeur') { const def = homeCreatures().filter(c => !c.post || c.post === r.id); html += `<h3>Défenseurs du Cœur</h3><p>${def.length ? def.map(c => esc(c.name)).join(', ') : 'Personne !'} <span class="hint">(garde ${def.reduce((a, c) => a + guardOf(c), 0)})</span></p>`; }
  else if (!isHall(r)) { const posted = S.creatures.filter(c => c.post === r.id); html += `<h3>Postes</h3><p>${posted.length ? posted.map(c => esc(c.name)).join(', ') : '<span class="hint">Personne. Donne un poste ici depuis la fiche d’une créature : elle défendra la pièce.</span>'}</p>`; }
  html += '<div class="btnrow">';
  if (!r.built) html += `<button class="sbtn pri" id="mPush" type="button" ${S.gold >= 2 ? '' : 'disabled'}>🔨 Coup de pouce : +1 segment (2 💰)</button>`;
  if (!d.fixed) html += `<button class="sbtn danger" id="mRemove" type="button">${r.built ? 'Décoller (rend la moitié)' : 'Annuler le chantier (remboursé)'}</button>`;
  html += `<button class="sbtn" type="button" data-wiki-open="room:${r.t}">📖 Grimoire</button></div>`;
  const m = openModal(html, { label: d.name }), q = s => m.querySelector(s); UI.mctx = ['room', id];
  m.addEventListener('click', e => {
    const u = e.target.closest('[data-unstick]'); if (u) { if (run('unstick', { id: u.dataset.unstick })) { sfx('peel'); afterChange(); openRoom(id); } return; }
    const tk = e.target.closest('[data-take]'); if (tk) { closeModal(); takeSticker('furn', tk.dataset.take); }
  });
  q('#mRemove') && q('#mRemove').addEventListener('click', e => confirmBtn(e.currentTarget, 'Sûr ? Décoller', () => {
    if (!run('removeRoom', { id })) return;
    sfx('peel'); closeModal(); afterChange();
  }));
  q('#mPush') && q('#mPush').addEventListener('click', () => {
    if (!run('push', { id })) return; sfx('tick');
    const rr = S.rooms.find(x => x.id === id);
    if (!rr || rr.built) { toast(`🎉 ${d.name} est prêt !`); sfx('chime'); closeModal(); afterChange(); }
    else { afterChange(); openRoom(id); }
  });
}
function openFurn(id) {
  const f = S.furn.find(x => x.id === id); if (!f) return; const d = FURN[f.t], r = roomAt(f.x, f.y);
  const fans = SPECIES_ORDER.filter(s => SPECIES[s].likes === f.t).map(s => SPECIES[s].name);
  const m = openModal(`<div class="cardhead"><div class="portrait">${imgThumb('furn', f.t)}</div><div><h2>${esc(d.name)}</h2><p class="hint">Dans : ${esc(ROOMS[r.t].name)}${r.built ? '' : ' (en chantier)'}</p><div>${statTags(d)}</div></div></div>
    ${fans.length ? `<p>Adoré par : ${fans.join(', ')}.</p>` : ''}
    <div class="btnrow">${f.fixed ? '<span class="hint">Livré avec la pièce, il ne se décolle pas.</span>' : '<button class="sbtn" id="mRemove" type="button">Décoller (retourne dans ta planche)</button>'}${isHall(r) ? '' : '<button class="sbtn" id="mRoom" type="button">Voir la pièce</button>'}<button class="sbtn" type="button" data-wiki-open="furn:${f.t}">📖 Grimoire</button></div>`, { label: d.name });
  m.querySelector('#mRemove') && m.querySelector('#mRemove').addEventListener('click', () => { if (run('unstick', { id })) { sfx('peel'); closeModal(); afterChange(); } });
  m.querySelector('#mRoom') && m.querySelector('#mRoom').addEventListener('click', () => openRoom(r.id));
}
function openDef(id) {
  const d = S.defs.find(x => x.id === id); if (!d) return; const f = DEFS[d.t];
  const m = openModal(`<div class="cardhead"><div class="portrait">${imgThumb('def', d.t)}</div><div><h2>${esc(f.name)}</h2><p><span class="tag2">${f.kind}</span><span class="tag2">force ${defStr(d)}</span></p></div></div>
    <p>${esc(f.desc)}</p>${f.kind === 'piège' && trapBonus() ? `<p class="hint">+${trapBonus()} grâce à tes Kobolds.</p>` : ''}${f.kind === 'verrou' && S.theme === 'bastion' ? '<p class="hint">+1 grâce à la Forteresse têtue.</p>' : ''}
    <p class="hint">Les aventuriers prennent le plus court chemin du porche au Cœur. Active « Chemin des héros » pour vérifier que tes pièges sont dessus.</p>
    <div class="btnrow"><button class="sbtn" id="mRemove" type="button">Décoller (retourne dans ta planche)</button><button class="sbtn" type="button" data-wiki-open="def:${d.t}">📖 Grimoire</button></div>`, { label: f.name });
  m.querySelector('#mRemove').addEventListener('click', () => { if (run('removeDef', { id })) { sfx('peel'); closeModal(); afterChange(); } });
}
function questCard(c, q) {
  const T = QT[q.k], ch = q.ch <= 3 ? `Chapitre ${q.ch}/3 de son histoire` : 'Mission de légende', rw = questReward(q.k === 'expe' && !q.res ? { ...q, res: 'full' } : q);
  let h = `<div class="quest st-${q.st}"><div class="qh"><span class="emo">${T.ico}</span><span><small>${ch}</small><b>${esc(q.title)}</b></span></div><p>« ${esc(q.text)} »</p>`;
  if (q.st === 'offered') h += `<p class="hint">Récompense : ${rewardLine(rw)}${q.k === 'expe' ? ' (selon le résultat de l’expédition)' : ''}.</p><div class="btnrow"><button class="sbtn pri" type="button" data-q="qAccept">✔ Accepter${T.away ? ' : il·elle part 2 nuits' : ''}</button><button class="sbtn" type="button" data-q="qDecline">Pas maintenant</button></div>`;
  else if (q.st === 'active') h += `<p class="hint">En cours : <b>${esc(T.prog(q, c))}</b> · Récompense : ${rewardLine(rw)}.</p>`;
  else if (q.st === 'away') h += `<p class="hint">🧭 En route ! Retour à l’aube, avant la nuit ${c.awayUntil}.</p>`;
  else if (q.st === 'done') h += `<p><b>${q.res ? ({ crit: '✨ Triomphe !', full: '🎉 Réussite !', partial: '😅 À moitié réussie', fail: '💨 Raté… mais quelle aventure' })[q.res] + ` <span class="hint">(dés : ${(q.dice || []).join(', ')})</span>` : '🎉 Mission accomplie !'}</b></p><div class="btnrow"><button class="sbtn pri" type="button" data-q="qClaim">🎁 Réclamer : ${rewardLine(rw)}</button></div>`;
  return h + '</div>';
}
function openCreature(id) {
  const c = S.creatures.find(x => x.id === id); if (!c) return;
  if (typeof VISIT !== 'undefined' && VISIT) { openVisitCreature(id); return; }
  TUTO.flags.creature = true; V.selected = id; renderPortraits();
  const sp = SPECIES[c.sp], mf = moodFactors(c), ef = epaFactors(c), q = questOf(c), out = isOut(c);
  const line = c.away ? 'Je suis parti·e en mission, je reviens vite !' : c.tempt ? pick([`Il paraît qu’à ${c.tempt.name}, on choie les ${sp.name.toLowerCase()}s…`, 'Je réfléchis à mon avenir, c’est tout.', 'Rien. Je regardais par la fenêtre. Vers là-bas.'])
    : c.mood <= 1 ? pick(['Laisse-moi tranquille.', 'Je boude. Ça se voit pas ?', 'Il fait froid, j’ai faim, et personne ne m’aime.']) : q && q.st === 'offered' ? 'Dis, Maître… j’aurais une petite faveur à te demander.' : pick(sp.lines);
  const rooms = builtRooms().filter(r => !isHall(r));
  const opts = '<option value="">Libre (garde le Cœur)</option>' + rooms.map(r => { const fav = r.t === sp.from || (ROOMS[r.t].attracts || []).includes(c.sp); return `<option value="${r.id}" ${c.post === r.id ? 'selected' : ''}>${fav ? '★ ' : ''}${esc(ROOMS[r.t].name)}</option>`; }).join('');
  const perks = [2, 3, 4, 5].filter(l => c.lvl >= l).map(l => LVL_PERK[l]);
  const m = openModal(`<div class="cardhead"><div class="portrait char"><img class="th" alt="" src="${thumb('char', c.sp, true)}"></div>
      <div><h2>${esc(c.name)}</h2><p><span class="tag2">${sp.name}</span><span class="tag2">Niv. ${c.lvl}</span>${c.legend ? '<span class="tag2 gold">🗿 Légende</span>' : ''}${sp.tag ? `<span class="tag2">${TAGS[sp.tag]}</span>` : ''}${c.away ? '<span class="tag2">🧭 en mission</span>' : c.raid ? '<span class="tag2">🗺️ en raid</span>' : ''}</p><div>${hearts(c.mood)} <span class="hint">${moodWord(c.mood)}</span></div></div></div>
    <div class="bubble" id="mLine">« ${esc(line)} »</div>
    ${c.tempt ? `<div class="tempt"><p>👀 <b>${esc(c.name)} lorgne vers ${esc(c.tempt.name)}</b> : là-bas, les ${esc(sp.name.toLowerCase())}s sont mieux reçus (${Math.round(c.tempt.v)} contre ${repOf(c.sp)} ici). Tant que sa loyauté reste sous 40, il·elle peut partir à l’aube.</p>
      <div class="btnrow"><button class="sbtn pri" type="button" id="mReassure" ${c.reassured === S.night ? 'disabled' : ''}>💬 Rassurer (+${c.epa >= 50 ? 10 : 6} loyauté)${c.reassured === S.night ? ' (fait)' : ''}</button>${PW('palier2') ? `<button class="sbtn" type="button" id="mRappel" ${pwReady(ACH_BY.palier2) ? '' : 'disabled'}>🔔 Cloche du rappel</button>` : ''}<button class="sbtn" type="button" id="mRenown">⭐ Renommée</button></div></div>` : ''}
    ${q ? questCard(c, q) : `<p class="hint">${c.legend ? '🗿 Son histoire est devenue légende. Il·elle repartira parfois en mission.' : `Son histoire : chapitre ${c.story || 0}/3. ${S.night < 3 ? 'Ses envies viendront dès la nuit 3.' : 'Une demande viendra peut-être à l’aube.'}`}</p>`}
    <dl class="kv"><dt>Compétence</dt><dd><b>${esc(sp.skill)}</b> : ${esc(sp.sd)}</dd>
      <dt>Combat</dt><dd>${guardOf(c)} 🛡️ garde · ${diceOf(c)} 🎲 en raid${sp.eats > 1 ? ' · mange pour deux' : ''}</dd>
      <dt>Poste</dt><dd><select class="sel" id="mPost" ${out ? 'disabled' : ''} aria-label="Poste de ${esc(c.name)}">${opts}</select></dd>
      <dt>Expérience</dt><dd>${c.lvl < 5 ? `${bar((c.xp - LVL_XP[c.lvl]) / (LVL_XP[c.lvl + 1] - LVL_XP[c.lvl]) * 100, '#8fb8ff', 'XP')} <span class="num">${c.xp}/${LVL_XP[c.lvl + 1]} XP</span>` : '<b>Niveau maximal</b>'}${perks.length ? `<br><span class="hint">${perks.map(esc).join(' · ')}</span>` : ''}</dd>
      <dt>Loyauté</dt><dd>${bar(c.loy, '#e9b949', 'Loyauté')} <b class="num">${c.loy}</b> <span class="hint">${loyWord(c.loy)}</span></dd>
      <dt>Épanouissement</dt><dd>${bar(c.epa, '#7fbf5a', 'Épanouissement')} <b class="num">${c.epa}</b> <span class="hint">${epaWord(c.epa)} · vise ${ef.target}</span></dd></dl>
    <h3>Humeur visée cette nuit : ${mf.target}/5</h3><div>${mf.f.map(([t, v]) => `<span class="tag2">${v > 0 ? '+' + v : v < 0 ? v : '·'} ${esc(t)}</span>`).join('')}</div>
    <details class="more"><summary>Ce qui l’épanouit (la loyauté suit l’épanouissement, nuit après nuit)</summary><div>${ef.f.map(([t, v]) => `<span class="tag2">${v > 0 ? '+' + v : v < 0 ? v : '·'} ${esc(t)}</span>`).join('')}</div></details>
    <div class="btnrow">
      <button class="sbtn pri" id="mPet" type="button" ${c.pet || out ? 'disabled' : ''}>🤚 Caresser${c.pet ? ' (fait)' : ''}</button>
      <button class="sbtn" id="mTreat" type="button" ${c.treat || out || S.gold < 1 ? 'disabled' : ''}>🍪 Friandise (1 💰)</button>
      <button class="sbtn" id="mTalk" type="button">💬 Discuter</button>
      <button class="sbtn" id="mFind" type="button" ${out ? 'disabled' : ''}>🔎 Voir</button>
      <button class="sbtn danger" id="mFire" type="button" ${out ? 'disabled' : ''}>👋 Renvoyer</button><button class="sbtn" type="button" data-wiki-open="sp:${c.sp}">📖 Grimoire</button></div>`, { label: c.name });
  UI.mctx = ['creature', id];
  const q2 = s => m.querySelector(s);
  const heartsFx = () => { const a = ACT.get(c.id); if (a) for (let i = 0; i < 3; i++) setTimeout(() => floatText(a.x + (Math.random() - .5) * .4, a.y, '♥', '#ff9cba'), i * 140); };
  const speak = l => { say(c.id, l); const b = $('#mLine'); if (b) b.textContent = '« ' + l + ' »'; };
  q2('#mPet').addEventListener('click', () => { if (!run('pet', { id })) return; sfx('pet'); heartsFx(); afterChange(); openCreature(id); speak(pick(['Hiii, encore !', 'Rrrrr…', 'Bon, d’accord, j’aime bien ça.', 'Pas devant les autres !'])); });
  q2('#mTreat').addEventListener('click', () => { if (!run('treat', { id })) return; sfx('pet'); heartsFx(); afterChange(); openCreature(id); speak('Miam ! Croustillant.'); });
  q2('#mTalk').addEventListener('click', () => { const l = pick(c.mood <= 1 ? ['…', 'Hmpf.', 'Va voir ailleurs si j’y suis.'] : sp.lines); q2('#mLine').textContent = '« ' + l + ' »'; say(c.id, l); sfx('tick'); });
  q2('#mFind').addEventListener('click', () => { closeModal(); focusActor(c.id); });
  q2('#mPost').addEventListener('change', e => { if (!run('post', { id, post: e.target.value || null })) return; sfx('tick'); const a = ACT.get(c.id); if (a) { a.tok++; a.walking = false; a.dur = 0; wanderOnce(a, true); } afterChange(); openCreature(id); });
  q2('#mFire').addEventListener('click', e => confirmBtn(e.currentTarget, 'Sûr ? Au revoir…', () => { if (!run('fire', { id })) return; closeModal(); critterLeave(c.id); V.selected = null; afterChange(); }));
  q2('#mReassure') && q2('#mReassure').addEventListener('click', () => { if (!run('reassure', { id })) return; sfx('pet'); heartsFx(); afterChange(); openCreature(id); speak(pick(['Bon… d’accord, je reste encore un peu.', 'Tu tiens vraiment à moi ?', 'Personne ne m’avait jamais dit ça.'])); });
  q2('#mRappel') && q2('#mRappel').addEventListener('click', () => { if (!run('power', { pw: 'rappel', id })) return; sfx('chime'); afterChange(); openCreature(id); speak('Cette cloche… elle me rappelle pourquoi je suis là.'); });
  q2('#mRenown') && q2('#mRenown').addEventListener('click', openRenown);
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-q]'); if (!b || b.disabled) return;
    const k = b.dataset.q, qq = questOf(c), away = qq && QT[qq.k].away;
    if (!run(k, { id })) return;
    if (k === 'qAccept') { sfx('chime'); if (away) { toast(`🧭 ${c.name} part en mission. Retour dans 2 nuits.`); closeModal(); afterChange(); return; } speak('Merci, Maître ! Je savais que je pouvais compter sur toi.'); }
    else if (k === 'qClaim') { sfx('chime'); heartsFx(); toast(`🎁 Mission accomplie : ${qq.title}`); }
    else if (k === 'qDecline') { speak('Bon… une autre fois, peut-être.'); }
    afterChange(); openCreature(id);
  });
}
function focusActor(id) { const a = ACT.get(id); if (!a) return; const [wx, wy] = WP(a.x, a.y), ts = Math.max(CAM.s, Math.min(1.1, CAM.max)); CAM.s = ts; CAM.x = V.w / 2 - wx * ts; CAM.y = V.h / 2 - (wy - 50) * ts; clampCam(); V.selected = id; say(id, pick(['Coucou chef !', 'Oui ?', 'J’ai rien fait !']), 2000); }
function openBestiary() {
  const list = [...S.creatures].sort((a, b) => SPECIES_ORDER.indexOf(a.sp) - SPECIES_ORDER.indexOf(b.sp)).map(c => { const sp = SPECIES[c.sp], post = c.post && S.rooms.find(r => r.id === c.post); return `<button class="crow" type="button" data-crit="${c.id}"><img class="th" alt="" src="${thumb('char', c.sp)}"><span class="who"><b>${esc(c.name)}${c.legend ? ' 🗿' : ''}</b><span>${sp.name} · niv. ${c.lvl || 1} · ${c.away ? '🧭 en mission' : c.raid ? '🗺️ en raid' : post ? '📍 ' + esc(ROOMS[post.t].name) : 'libre'}${c.tempt ? ' · 👀 tenté·e' : ''}</span></span><span class="loy" title="Loyauté ${c.loy}">${bar(c.loy, '#e9b949', 'Loyauté')}</span>${hearts(c.mood)}</button>`; }).join('');
  const album = SPECIES_ORDER.map(k => `<button class="s ${S.album[k] ? '' : 'no'}" type="button" data-album="${k}" title="${S.album[k] ? SPECIES[k].name : '???'}"><img class="th" alt="" src="${thumb('char', k)}"></button>`).join('');
  const wait = (S.waiting || []).length ? `<p class="hint">🚪 À la porte : ${S.waiting.map(w => esc(w.name) + ' (' + esc((SPECIES[w.sp] || { name: '?' }).name) + ')').join(', ')}. Ils entreront dès qu’un lit se libère.</p>` : '';
  const m = openModal(`<h2>Bestiaire</h2><div class="btnrow"><button class="sbtn" type="button" id="bRenown">⭐ Renommée</button><button class="sbtn" type="button" id="bAch">🏆 Hauts faits</button></div><h3>Tes créatures (${S.creatures.length})</h3><div class="clist">${list || '<p class="hint">Personne pour l’instant.</p>'}</div>${wait}<h3>Album ${Object.keys(S.album).length}/${SPECIES_ORDER.length}</h3><div class="album">${album}</div>`, { wide: true, label: 'Bestiaire' });
  m.addEventListener('click', e => { if (e.target.closest('#bRenown')) { openRenown(); return; } if (e.target.closest('#bAch')) { openAch(); return; } const c = e.target.closest('[data-crit]'); if (c) { openCreature(c.dataset.crit); return; } const a = e.target.closest('[data-album]'); if (a) openSpecies(a.dataset.album); });
}
function openSpecies(k) {
  const sp = SPECIES[k], has = S.album[k], hint = sp.from ? (sp.from === 'coeur' ? 'le Cœur du château' : ROOMS[sp.from].name + ' meublée') : 'deux stickers Toile';
  openModal(`<div class="cardhead"><div class="portrait char ${has ? '' : 'no'}"><img class="th" alt="" src="${thumb('char', k, true)}"></div><div><h2>${has ? sp.name : '???'}</h2><p class="hint">Attiré par : ${esc(hint)}${sp.tier ? ` (Palier ${sp.tier})` : ''}</p></div></div>
    ${has ? `<p><b>${esc(sp.skill)}</b> : ${esc(sp.sd)}</p><p class="hint">Aime : ${itemName(sp.likes)}${sp.rival ? ` · Rival : ${SPECIES[sp.rival].name}` : ''}</p>` : '<p>Cette page de l’album est encore vide.</p>'}`, { label: 'Album' });
}
function openJournal() { openModal(`<h2>Chronique du château</h2><ul class="chron">${S.log.map(l => `<li class="${l.tone}"><span class="emo">N${l.n}</span><span>${esc(l.text)}</span></li>`).join('')}</ul>`, { wide: true, label: 'Chronique' }); }
