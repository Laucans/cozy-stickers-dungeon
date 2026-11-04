
/* =========================================================
   Interface : barre du haut, portraits, barre de construction,
   suivi des envies, placement, fiches
   ========================================================= */
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
const UI = { tab: 'room', hand: null, busy: false, phase: 'roder', prev: {}, tracker: true };
const PHASES = [['roder', 'Rôder'], ['calamite', 'Calamité'], ['raid', 'Raid'], ['contrecoup', 'Contrecoup'], ['aube', 'Aube']];
const STAT_LABELS = { gold: ['💰', 'or / nuit'], mat: ['🪵', 'matériaux / nuit'], hype: ['🔥', 'notoriété / nuit'], food: ['🍲', 'repas'], beds: ['🛏️', 'lits'],
  amb: ['🕯️', 'ambiance'], cal: ['🌿', 'calamité en moins'], guard: ['🛡️', 'garde'], harass: ['🪨', 'dégâts aux héros dès leur arrivée'], dice: ['🎲', 'dé de raid'], cells: ['⛓️', 'places de prison'],
  sight: ['🔭', 'cases de carte en vue'], glow: ['✨', 'rayonnement'] };
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
  const pr = payroll(), np = nightsToPay();
  const res = [['gold', 'Or', S.gold, `Or : construire, meubler, monter de palier… et payer tes créatures. Prochain jour de paie ${np === 0 ? 'à l’aube de cette nuit' : np === 1 ? 'à l’aube de la nuit prochaine' : `dans ${np} nuits`} : ${pr} 💰.`, np <= 1 && S.gold < pr], ['mat', 'Matériaux', S.mat, 'Matériaux : bâtir les pièces et les couloirs.'],
    ['hype', 'Notoriété', S.hype, 'Notoriété : débloque les paliers… et attire les aventuriers.'], ['glow', 'Éclat', radiance(), 'Rayonnement : artefacts, trésors, créatures rares… Plus ton château brille, plus les héros qui viennent sont forts, et plus la carte se dévoile.'],
    ['amb', 'Ambiance', ambiance(), 'Ambiance : meubles et déco douillets. Rend les créatures heureuses.'],
    (() => { const fc = typeof fameCap === 'function' ? fameCap() : bd, cap = Math.min(bd, fc); return ['beds', fc < bd ? 'Renommée' : 'Lits', `${n}/${cap}`, `Créatures / places. Une nouvelle créature ne s’installe que s’il reste un lit libre (${bd} lits) et si ton château est assez renommé (${fc} créatures au plus). Touche pour voir comment grandir.`, n >= cap]; })(), ['food', 'Repas', `${eat}/${food}`, 'Bouches à nourrir / repas produits.', eat > food]];
  const box = $('#res');
  if (box.children.length !== res.length) { box.innerHTML = ''; res.forEach(([k]) => { const c = el('div', 'res'); c.dataset.k = k; box.appendChild(c); }); }
  res.forEach(([k, label, val, tip, warn]) => {
    const c = box.querySelector(`[data-k="${k}"]`); c.className = 'res' + (warn ? ' warn' : ''); c.title = `${label} : ${tip}`;
    c.innerHTML = `${ico(k)}<span><b class="num">${val}</b><small>${label}</small></span>`;
    if (UI.prev[k] !== undefined && UI.prev[k] !== val) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); }
    UI.prev[k] = val;
  });
  $('#clocks').innerHTML =
    `<div class="dial" title="Calamité ${S.calamity}/${CAL_MAX} : la faim, la mauvaise humeur et la promiscuité la font monter. Pleine, une catastrophe arrive.">${clockSVG(CAL_MAX, Math.min(S.calamity, CAL_MAX), '#d9542f')}<span><small>Calamité</small><b class="num">${S.calamity}</b></span></div>` +
    `<div class="dial" title="Menace ${S.menace}/${MENACE_MAX} : tes raids et ta notoriété la font monter. Pleine, des aventuriers attaquent.">${clockSVG(MENACE_MAX, Math.min(S.menace, MENACE_MAX), '#5a86d0')}<span><small>Menace</small><b class="num">${S.menace}</b></span></div>`;
  const lau = S.vic ? Object.keys(S.vic.won).length : 0;
  $('#turn').innerHTML = `<b>🏛️ Nuit ${S.night}</b><small>Palier ${S.tier}${Z ? ' · ' + FLOOR_SHORT[Z] : ''}${lau ? ' · ' + '🌿'.repeat(lau) : ''}</small>`; $('#turn').title = 'Les victoires du Val (et la nuit en cours)';
  $('#phases').innerHTML = PHASES.map(([k, l], i) => (i ? '<i>›</i>' : '') + `<span class="${UI.phase === k ? 'on' : ''}">${l}</span>`).join('');
}

/* ---------- barre de construction ---------- */
function sheetGroups() {
  if (UI.tab === 'room') return [[null, ROOM_ORDER.map(t => ['room', t])]];
  if (UI.tab === 'def') return [[null, DEF_ORDER.map(t => ['def', t])]];
  if (UI.tab === 'decor') return [[null, DECOR_ORDER.map(t => ['furn', t])]];
  if (UI.tab === 'arte') return [[null, TREASURES.filter(k => (S.free[k] || 0) > 0 || hasItem(k)).map(t => ['furn', t])]];
  UI.tab = 'room'; return [[null, ROOM_ORDER.map(t => ['room', t])]];   // les meubles se posent depuis la fiche de leur pièce
}
function renderSheet() {
  const sh = $('#sheet'); sh.innerHTML = '';
  document.querySelectorAll('#tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === UI.tab));
  for (const [title, items] of sheetGroups()) {
    if (title && items.every(([kind, t]) => { const a = availability(kind, t); return a && a.hide; })) continue;   // un groupe sans rien à montrer ici
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
  if (!sh.children.length) sh.appendChild(el('div', 'empty', Z === EXT ? (UI.tab === 'def' ? '<b>Pas de pièges dans les Jardins.</b> Ils se posent dans les couloirs du château, au rez-de-chaussée.' : UI.tab === 'arte' ? '<b>Les trésors s’exposent à l’intérieur.</b> Rentre au château pour les poser.' : '<b>Rien à poser dehors ici.</b>')
    : UI.tab === 'arte' ? '<b>Aucun artefact pour l’instant.</b> Les héros vaincus en abandonnent, les expéditions en rapportent, et les marchands de la ville en vendent (à prix d’or).' : '<b>Rien à poser ici.</b>'));
}
function tipHTML(kind, t) {
  let html = ''; const li = [], spn = k => SPECIES[k] ? SPECIES[k].name : k;
  if (kind === 'room') {
    const r = ROOMS[t], fans = SPECIES_ORDER.filter(s => SPECIES[s].from === t || (r.attracts || []).includes(s)), ups = (r.furn || []).filter(f => FURN[f] && FURN[f].size);
    html = `<b>${esc(r.name)}</b> <span class="hint">${r.size[0]}×${r.size[1]}${r.clock ? ` · chantier de ${r.clock} segments` : ' · posée tout de suite'}</span><p>${esc(r.desc || '')}</p>${statTags(r) ? `<div>${statTags(r)}</div>` : ''}`;
    if (fans.length) li.push(`🐾 Attire : ${fans.map(spn).join(', ')} (une fois meublée).`);
    if (r.preset) li.push(`📦 Livrée meublée : ${r.preset.map(f => FURN[f] ? FURN[f].name : f).join(', ')}.`);
    if (r.syn) { const k = Object.keys(r.syn).find(x => x !== 'adj'); li.push(`🤝 Si elle touche ${ROOMS[r.syn.adj].name} : ${STAT_LABELS[k] ? `${STAT_LABELS[k][0]} +${r.syn[k]} ${STAT_LABELS[k][1]}` : '+' + r.syn[k] + ' ' + k}.`); }
    if (typeof ROOM_CLASH !== 'undefined') { const cl = ROOM_CLASH.filter(([x, y]) => x === t || y === t); if (cl.length) li.push(`🚫 Jamais au même étage que : ${cl.map(([x, y, why]) => `${ROOMS[x === t ? y : x].name} (${why})`).join(', ')}.`); }
    if (ups.length) li.push(`🧩 Collée à une autre ${r.name} : grande salle, +1 Ambiance et stickers améliorés (${ups.map(f => FURN[f].name).join(', ')}).`);
    if (typeof ROOM_EVENTS !== 'undefined' && !isHall({ t }) && ROOM_EVENTS[t]) li.push(`🚪 Les héros qui la traversent : « ${ROOM_EVENTS[t].sk} ».`);
    if (r.edge) li.push('📐 Doit toucher les remparts.'); if (r.far) li.push(`📐 À ${r.far} pas du porche au moins.`); if (r.unique) li.push('⭐ Unique.');
    if (r.furn && !r.preset) li.push(`🪑 Meubles : ${r.furn.filter(f => FURN[f] && !FURN[f].size).map(f => FURN[f].name).join(', ')}.`);
    if (!isHall({ t })) { const n = r.size[0] * r.size[1]; li.push(`📦 Place : ${Math.ceil(n / 2)} sticker${n > 2 ? 's' : ''} au plus (un pour deux cases ; une grande salle additionne ses pièces).`); }
  } else if (kind === 'def') {
    const f = DEFS[t];
    html = `<b>${esc(f.name)}</b><span class="hint">${f.kind}${f.str ? ` · ${f.str} dégâts` : ''}</span><p>${esc(f.desc)}</p>`;
    if (f.kind === 'piège') li.push('🎯 Blesse un héros au hasard. La voleuse désamorce le premier piège de la route.');
    if (f.kind === 'verrou') li.push('🚪 Le barbare l’enfonce : moitié moins de dégâts pour lui.'); if (f.post) li.push('🛡️ Seul moyen de garder un couloir : 2 gardes au plus, ils arrêtent la bande ici.');
    if (f.lost) li.push(`🌀 ${Math.round(f.lost * 100)} % de chances que la bande renonce et rentre.`);
    if (f.sticky) li.push('🍌 La rencontre suivante frappe +1.'); if (f.alarm) li.push('🔔 Les défenseurs de leur cible frappent +1.'); if (f.block) li.push('🧱 Ferme le couloir : la bande fait un détour (montré en bleu quand tu la tiens).');
    li.push('📍 Se pose dans un couloir, sur le chemin des héros (à tous les étages qu’ils traversent pour atteindre le Cœur).');
    if (typeof CASTLE_CARDS !== 'undefined') { const k = Object.keys(CASTLE_CARDS).find(x => CASTLE_CARDS[x].from.includes(t)); if (k) li.push(`🃏 En expédition, une carte pour le sac : ${CASTLE_CARDS[k].ico} ${CASTLE_CARDS[k].name} (${cardText({ src: 'castle', key: k })})`); }
  } else {
    const f = FURN[t], fans = SPECIES_ORDER.filter(s => SPECIES[s].likes === t).map(spn);
    html = `<b>${esc(f.name)}</b><span class="hint">${f.room !== 'any' ? `pour : ${esc(ROOMS[f.room].name)}${f.size ? ` · sticker amélioré : ${f.size >= 3 ? 'salle immense (3 pièces collées)' : 'grande salle (2 pièces collées)'}` : ''}` : f.out ? 'déco des Jardins' : f.artefact ? 'trésor, partout' : 'déco, partout'}</span>${f.desc ? `<p>${esc(f.desc)}</p>` : ''}<div>${statTags(f)}</div>`;
    if (fans.length) li.push(`💛 Adoré par : ${fans.join(', ')} (humeur +1).`);
    if (t === 'toile') li.push('🕸️ Deux toiles attirent une Araignée.');
    if (typeof ACTS !== 'undefined') { const acts = Object.values(ACTS).filter(A => A.items && A.items.includes(t)).map(A => A.verb); if (acts.length) li.push(`🧸 Les créatures y viennent : ${acts.join(', ')}.`); }
    if (typeof CASTLE_CARDS !== 'undefined') { const k = Object.keys(CASTLE_CARDS).find(x => CASTLE_CARDS[x].from.includes(t)); if (k) li.push(`🃏 En expédition, une carte pour le sac : ${CASTLE_CARDS[k].ico} ${CASTLE_CARDS[k].name} (${cardText({ src: 'castle', key: k })})`); }
    if (f.unique) li.push('⭐ Unique.');
  }
  if (li.length) html += `<ul class="tipl">${li.map(x => `<li>${iconize(esc(x))}</li>`).join('')}</ul>`;
  const av = availability(kind, t); if (av && av.lock) html += `<p class="no">🔒 Nécessite : ${esc(av.reason)}</p>`;
  return html;
}
function showTip(card) {
  const tip = $('#tip'); if (!card) { tip.hidden = true; return; }
  tip.innerHTML = tipHTML(card.dataset.kind, card.dataset.t); tip.hidden = false;
  const r = card.getBoundingClientRect(), tw = tip.offsetWidth;
  tip.style.left = clamp(r.left + r.width / 2 - tw / 2, 8, innerWidth - tw - 8) + 'px'; tip.style.top = (r.top - tip.offsetHeight - 10 >= 8 ? r.top - tip.offsetHeight - 10 : Math.min(r.bottom + 10, innerHeight - tip.offsetHeight - 8)) + 'px';
}

/* ---------- portraits, envies ---------- */
function renderPortraits() {
  const box = $('#portraits'); box.innerHTML = '';
  [...S.creatures].sort((a, b) => SPECIES_ORDER.indexOf(a.sp) - SPECIES_ORDER.indexOf(b.sp)).forEach(c => {
    const sp = SPECIES[c.sp], post = c.post && S.rooms.find(r => r.id === c.post);
    const b = el('button', 'pt' + (V.selected === c.id ? ' on' : '') + (c.raid ? ' away' : '') + (c.tempt ? ' tempt' : '')); b.type = 'button'; b.dataset.crit = c.id;
    const q = c.quest, st = c.away ? '🧭' : c.raid ? '🗺️' : c.tempt ? '👀' : q && q.st === 'ready' ? '🧭' : post ? '📍' : '';
    b.title = `${c.name} · ${sp.name} · niv. ${c.lvl || 1} · ${c.away ? 'en mission' : c.raid ? 'en raid' : post ? 'poste : ' + ROOMS[post.t].name : 'libre, garde le Cœur'}${c.tempt ? ' · lorgne vers ' + c.tempt.name : ''}${q && q.st === 'offered' ? ' · a une demande' : ''}${q && q.st === 'done' ? ' · mission à réclamer' : ''}`;
    b.innerHTML = `<span class="ring"><img alt="" src="${portrait(c.sp)}"></span><span class="mood m${c.mood}"></span>${st ? `<span class="st">${st}</span>` : ''}${c.lvl > 1 ? `<span class="lv">${c.lvl}</span>` : ''}`;
    box.appendChild(b);
  });
  $('#critCount').textContent = S.creatures.length;
}
// ce qui demande l'attention du Maître : des pastilles à droite, comme les notifications de Civilization
function notifList() {
  const n = [], add = (k, ico, text, act, pri = 1, cls = '') => n.push({ k, ico, text, act, pri, cls });
  S.creatures.forEach(c => {
    if (c.tempt) add('tm' + c.id, '👀', `${c.name} lorgne vers ${c.tempt.name}`, () => openCreature(c.id), 6, 'bad');
    const q = questOf(c); if (q && q.st === 'ready' && !isOut(c)) add('qa' + c.id, '🧭', `${c.name} rêve d’aventure`, () => openCreature(c.id), 3);
  });
  { const pr = payroll(), np = nightsToPay(); if (pr && np <= 1) add('pay', '💰', `Jour de paie ${np === 0 ? 'à l’aube' : 'demain'} : ${pr} 💰${S.gold < pr ? ` (tu n’as que ${S.gold})` : ''}`, () => openGrimoire('paie'), S.gold < pr ? 6 : 2, S.gold < pr ? 'bad' : ''); }
  if (S.menace >= MENACE_MAX - 1) add('men', '⚔️', 'Des aventuriers approchent', () => { if (!V.showPath) $('#btnPath').click(); openGrimoire('invasion'); }, 6, 'bad');
  if (typeof guardCount === 'function' && S.menace >= MENACE_MAX - 2) { const gc = guardCount(), cap = Math.min(guardCap(), S.creatures.filter(c => !isOut(c)).length - 1, typeof routeGuardCap === 'function' ? routeGuardCap() : 99); if (gc < cap) add('guards', '🛡️', `Poste tes gardes sur leur chemin (${gc}/${cap})`, () => guardMode(true), 5, 'bad'); }
  if (typeof RECIPES !== 'undefined' && hasKitchen() && Object.keys(RECIPES).some(canCook) && Object.values(pantry()).reduce((a, b) => a + b, 0) >= 10) add('cook', '🍲', 'Le garde-manger déborde : cuisine !', () => cookModal(), 1);
  if (S.calamity >= CAL_MAX - 2) add('cal', '🌀', 'La Calamité gronde', () => openGrimoire('calamite'), 5, 'bad');
  if (eaters() > foodCap()) add('food', '🍽️', 'Des ventres vides', () => openGrimoire('lits_repas'), 5, 'bad');
  const st = tierStatus(); if (st && st.ok) add('tier', '⭐', `Palier ${S.tier + 1} disponible : touche le Cœur`, openHeart, 4);
  if (typeof fameCap === 'function' && S.night > 1 && S.creatures.length >= fameCap() && fameCap() < beds()) add('fame', '🌟', `Ta renommée n’attire plus personne (${S.creatures.length}/${fameCap()})`, () => openFame(), 2);
  if (S.night > 1 && S.creatures.length >= beds()) add('beds', '🛏️', 'Plus un lit de libre', () => { const r = roomForFurn(t => FURN[t].beds); if (r) openRoom(r.id); else { openBuild('room'); toast('Toutes tes chambres sont pleines : bâtis un autre Dortoir, puis touche-le pour y coller des lits.'); } }, 2);
  // des meubles offerts (butin, cadeaux, meubles décollés) attendent dans la fiche de leur pièce
  { const fr = Object.keys(S.free || {}).filter(k => S.free[k] > 0 && FURN[k] && !FURN[k].artefact && FURN[k].room !== 'any' && !TREASURES.includes(k)), r = fr.length && roomForFurn(t => fr.includes(t));
    if (r) add('freefurn', '🎁', `${fr.length > 1 ? `${fr.length} meubles offerts` : `${itemName(fr[0])} offert·e`} : touche ${ROOMS[r.t].name}`, () => openRoom(r.id), 2); }
  const arts = TREASURES.filter(k => (S.free[k] || 0) > 0); if (arts.length) add('art', '🏺', `${arts.length} artefact${arts.length > 1 ? 's' : ''} à exposer`, () => openBuild('arte'), 3);
  if (S.raid) add('raid', '🗺️', `Raid prévu : ${(RAIDS[S.raid.target] || {}).name || 'une cible lointaine'}`, () => openRaid(), 1);
  if (typeof VAL !== 'undefined' && VAL.unread) add('mail', '📬', `${VAL.unread} nouvelle${VAL.unread > 1 ? 's' : ''} du Val`, () => { VAL.unread = 0; openVal('courrier'); }, 2);
  const g = GOALS.find(x => !S.goals[x.id]); if (g && (S.ndis || {}).goal !== 'g:' + g.id) add('goal', '✦', `Envie : ${g.text}`, openMissions, 0, 'goal');
  const guest = typeof COOP !== 'undefined' && COOP.role === 'guest';
  if (TUTO.pending && !guest) add('tip', '💡', TUTO.pending.t, () => showPendingTip(), 1, 'hint');
  if (!guest && S.tuto && S.tuto.on && S.tuto.hid && TUTO_STEPS[S.tuto.i]) add('tuto', '🎓', `Tutoriel : ${TUTO_STEPS[S.tuto.i].t}`, () => { delete S.tuto.hid; TUTO.shown = null; save(); tutoTick(); }, 1, 'hint');
  if (typeof victoryNotifs === 'function') victoryNotifs(add);
  if (typeof rivalNotifs === 'function') rivalNotifs(add);
  if (typeof sagaNotifs === 'function') sagaNotifs(add);
  if (typeof valNotifs === 'function') valNotifs(add);
  if (typeof designNotifs === 'function') designNotifs(add);
  const dis = S.ndis || {};
  return n.filter(x => x.k === 'goal' || dis[x.k] !== S.night).sort((a, b) => b.pri - a.pri).slice(0, 7);
}
function renderGoals() {
  const box = $('#notifs'); if (!box) return;
  const list = notifList(); UI.nacts = {};
  box.innerHTML = list.map(x => { UI.nacts[x.k] = x.act; return `<button class="notif ${x.cls}" type="button" data-n="${x.k}" aria-label="${esc(x.text)}"><span class="nl">${iconize(esc(x.text))}</span><span class="ni emo">${iconize(x.ico)}</span><span class="nx" data-nx="${x.k}" title="${x.k === 'goal' ? 'Ranger cette Envie (la liste des Envies la garde)' : 'Masquer jusqu’à la prochaine nuit'}" aria-label="Masquer">✕</span></button>`; }).join('');
}
function renderQuests() {}
// tiroir de construction (bouton Construire) et panneau des créatures, repliés par défaut
function uiPrefs(o) { try { const p = JSON.parse(localStorage.getItem('csd-ui') || '{}'); if (o) { Object.assign(p, o); localStorage.setItem('csd-ui', JSON.stringify(p)); } return p; } catch (e) { return {}; } }
function openBuild(tab) {
  if (tab && typeof tab === 'string') UI.tab = tab === 'furn' ? 'room' : tab;
  const was = UI.build; UI.build = true; $('#hudBottom').hidden = false; $('#btnBuild').setAttribute('aria-expanded', 'true'); document.body.classList.add('building');
  renderSheet(); if (typeof tab === 'string') $('#sheet').scrollLeft = 0;
  if (!was) drawerShift(true);
}
function closeBuild() { UI.build = false; $('#hudBottom').hidden = true; $('#btnBuild').setAttribute('aria-expanded', 'false'); document.body.classList.remove('building'); showTip(null); drawerShift(false); }
// le tiroir couvre le bas de l'écran : on remonte la vue juste assez pour garder le château visible
function drawerShift(open) {
  if (!V.w || !cv) return;
  if (!open) { if (V.drawerDy) { CAM.y += V.drawerDy; V.drawerDy = 0; clampCam(); } return; }
  const dr = $('#hudBottom').getBoundingClientRect(), top = dr.top - cv.getBoundingClientRect().top, [, by] = toScreen(...WP(W, H));
  const over = by + 24 - top; if (over <= 0) return;
  const dy = Math.min(over, Math.max(0, top - V.h * .12)), y0 = CAM.y; CAM.y -= dy; clampCam(); V.drawerDy = y0 - CAM.y;
}
function toggleBuild() { if (UI.build) { dropSticker(); closeBuild(); } else openBuild(); sfx('tick'); }
function toggleLeft(on) { const p = $('#leftPanel'), v = on == null ? p.hidden : on; p.hidden = !v; $('#btnCrit').setAttribute('aria-expanded', v); uiPrefs({ left: v }); }
function renderHand(msg, tone) {
  const hb = $('#handbar');
  if (!UI.hand) { hb.hidden = true; return; }
  hb.hidden = false; const { kind, t } = UI.hand, rot = kind === 'room' && ROOMS[t].size[0] !== ROOMS[t].size[1];
  hb.innerHTML = `${imgThumb(kind, t, 'mini')}<span class="msg ${tone || ''}">${msg ? esc(msg) : `<b>${esc(itemName(t))}</b> en main (${costText(costOf(kind, t))}). Touche le château pour coller.`}</span>` +
    (rot ? '<button class="pill" id="btnRot" type="button">⟳ Tourner (R)</button>' : '') + `<button class="pill" id="btnInfo" type="button" aria-expanded="${UI.handInfo === true}">${gi('info')} Effets</button>` + '<button class="pill" id="btnDrop" type="button">✕ Ranger</button>' +
    (UI.handInfo === true ? `<div class="hinfo">${tipHTML(kind, t)}</div>` : '');
  const bi = hb.querySelector('#btnInfo'); if (bi) bi.onclick = () => { UI.handInfo = UI.handInfo !== true; sfx('tick'); renderHand(msg, tone); };
}
function renderAll() { V.dirty = true; renderHUD(); renderSheet(); renderPortraits(); renderGoals(); renderHand(); renderFloors(); syncActors(); if (typeof renderMinimap === 'function') renderMinimap(); }
// sélecteur d'étage (à côté du zoom) : n'apparaît qu'une fois un escalier construit
// sélecteur d'étage (à côté du zoom), plus les Jardins (dehors) toujours accessibles
function renderFloors() {
  const box = $('#floors'); if (!box) return;
  const fl = floorsOpen(); box.hidden = false;
  const btn = z => `<button type="button" data-z="${z}" aria-pressed="${z === Z}" title="${FLOOR_NAMES[z]}${z === EXT ? ' (touche J)' : ' (Page↑ / Page↓)'}">${z === EXT ? '🌳' : z > 0 ? '▲' : z < 0 ? '▼' : '⌂'} ${FLOOR_SHORT[z]}</button>`;
  box.innerHTML = '<span class="flab">Étage</span>' + fl.map(btn).join('') + btn(EXT);
}

/* ---------- placement ---------- */
function takeSticker(kind, t) {
  // un sticker du dehors emmène dans les Jardins (et inversement)
  const outside = kind === 'room' ? !!(ROOMS[t] && ROOMS[t].out) : kind === 'furn' && FURN[t] ? !!(FURN[t].out || (ROOMS[FURN[t].room] && ROOMS[FURN[t].room].out)) : false;
  if (outside && Z !== EXT) setFloor(EXT); else if (kind === 'room' && !outside && Z === EXT) setFloor(0);
  const av = availability(kind, t);
  if (av && av.lock) { toast(av.chantier ? `🔒 ${itemName(t)} : la pièce est encore en chantier. On la meublera à l’aube, une fois terminée.` : `🔒 ${itemName(t)} : nécessite ${av.reason}.`, true); sfx('bad'); return false; }
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
  const merge = !err && kind === 'room' && ROOMS[t] && mergeable({ t, built: true }) && cells.some(([x, y]) => DIRS.some(([dx, dy]) => { const o = roomAt(x + dx, y + dy); return o && o.t === t && o.built; }));
  const key = (err || 'ok') + (merge ? 'm' : ''); if (UI.ghostKey !== key) { UI.ghostKey = key; renderHand(err || (merge ? `Fusion ! Elle formera une grande salle avec sa voisine.` : 'Parfait, ça colle ici !'), err ? 'bad' : 'ok'); }
}
function tryPlace(a, fromDrag) {
  const err = validate(a);
  if (err) { toast(err, true); sfx('bad'); if (fromDrag) dropSticker(); return; }
  const { kind, t, w, h } = UI.hand;
  const e2 = cmd('place', { kind, t, x: a.x, y: a.y, w, h, z: Z });
  if (e2) { toast(e2, true); sfx('bad'); if (fromDrag) dropSticker(); return; }
  sfx('pop'); afterChange();
  const av = availability(kind, t);
  if (fromDrag || av || (kind === 'room' && t !== 'couloir')) dropSticker(); else { UI.ghostKey = null; renderSheet(); if (UI.lastPt) updateGhost(UI.lastPt); }
}
function afterChange() {
  if (typeof VISIT !== 'undefined' && VISIT) { renderAll(); return; }
  checkGoals().forEach(g => { toast(`✦ Envie comblée : ${g.text} → ${rewardText(g.reward)}`); sfx('chime'); addLog(`Envie comblée : ${g.text}.`, 'ev'); });
  checkQuests();   // envies et rêves comblés : récompense immédiate
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
function closeModal(silent) { $('#modalRoot').innerHTML = ''; UI.modalNoClose = false; UI.mctx = null; if (!silent && S && !S.started) setTimeout(typeof openTitle === 'function' ? openTitle : openIntro, 0); }
function confirmBtn(btn, label, action) {
  if (btn.dataset.armed) { action(); return; }
  btn.dataset.armed = '1'; const old = btn.innerHTML; btn.innerHTML = label;
  setTimeout(() => { if (btn.isConnected) { delete btn.dataset.armed; btn.innerHTML = old; } }, 3000);
}
function roomStats(r) { const o = {}; Object.keys(STAT_LABELS).forEach(k => { const v = rstat(r, k); if (v) o[k] = v; }); return o; }
// une pièce terminée, pas pleine, où l'on peut coller un meuble qui répond à « want »
function roomForFurn(want) {
  return S.rooms.filter(r => r.built && !isHall(r) && furnCount(r) < furnCap(r) && (ROOMS[r.t].furn || []).some(t => FURN[t] && want(t) && !(FURN[t].tier && S.tier < FURN[t].tier))).sort((a, b) => (zOf(a) === Z ? 0 : 1) - (zOf(b) === Z ? 0 : 1))[0] || null;
}
function openRoom(id) {
  const r = S.rooms.find(x => x.id === id); if (!r) return;
  if (typeof TUTO !== 'undefined') TUTO.flags.room = r.t;
  const d = ROOMS[r.t], grp = groupOf(r).rooms, items = grp.flatMap(furnIn), cap = furnCap(r);   // une grande salle : tous ses meubles
  const gn = groupSize(r), ups = (d.furn || []).filter(k => FURN[k].size);
  let html = `<div class="cardhead"><div class="portrait room">${imgThumb('room', r.t)}</div><div><h2>${esc(d.name)}${gn >= 2 ? ` <small class="tag2 gold">🧩 ${sizeWord(gn)}</small>` : ''}</h2><p class="hint">${esc(d.desc)}</p></div></div>`;
  if (ups.length || gn >= 2) html += `<p class="hint">🧩 ${gn >= 2 ? `${gn} pièces « ${esc(d.name)} » fusionnées (+${gn >= 3 ? 2 : 1} Ambiance).` : `Colle une autre pièce « ${esc(d.name)} » contre celle-ci : elles fusionnent en une grande salle.`}${ups.length ? ` Stickers améliorés : ${ups.map(k => `${gn >= FURN[k].size ? '✅' : '🔒'} ${esc(FURN[k].name)} (${FURN[k].size >= 3 ? '3 pièces' : '2 pièces'})`).join(', ')}.` : ''}</p>`;
  if (!r.built) html += `<div class="clockrow">${clockSVG(d.clock, r.prog, '#d9542f', 80)}<p>Chantier : ${r.prog}/${d.clock} segments. Chaque nuit, tes ouvriers en remplissent ${workPerNight()}, en commençant par le plus ancien chantier${r.boost ? `, plus ${r.boost} de renfort` : ''}. Tu pourras la meubler une fois terminée.</p></div>`;
  else if (!isHall(r)) html += `<h3>Effets</h3><div>${statTags(roomStats(r)) || '<span class="hint">Aucun effet pour l’instant : ajoute des meubles.</span>'}</div>`;
  if (d.syn) html += `<p class="hint">${neighborsTypes(r).has(d.syn.adj) ? '✅' : '➕'} Bonus si elle touche : ${ROOMS[d.syn.adj].name}.</p>`;
  if (d.attracts) html += `<p class="hint">Attire ${d.attracts.map(s => SPECIES[s].name + (SPECIES[s].tier && S.tier < SPECIES[s].tier ? ` (Palier ${SPECIES[s].tier})` : '')).join(' et ')} une fois meublée${furnished(r) ? ' ✅' : ''}.</p>`;
  if (d.stairs) { const z2 = zOf(r) + (r.land ? -d.stairs : d.stairs); html += `<p>${r.land ? 'Ce palier ramène' : r.built ? 'Cet escalier mène' : 'Une fois terminé, cet escalier mènera'} vers <b>${esc(FLOOR_NAMES[z2])}</b>.</p>${r.built ? `<div class="btnrow"><button class="sbtn pri" type="button" id="mGoFloor">${z2 > zOf(r) ? '▲ Monter' : '▼ Descendre'} : ${esc(FLOOR_NAMES[z2])}</button></div>` : ''}`; }
  else if (!isHall(r) && r.t !== 'porche') {
    html += `<h3>Meubles (${items.length}/${cap})</h3><div class="flist">${items.map(f => `<div class="frow">${imgThumb('furn', f.t)}<span><b>${esc(FURN[f.t].name)}</b><br>${statTags(FURN[f.t])}</span>${f.fixed ? '<span class="hint">fixe</span>' : `<button class="sbtn" type="button" data-unstick="${f.id}">Décoller</button>`}</div>`).join('') || '<p class="hint">Aucun meuble.</p>'}</div>`;
    // ce qu'on peut y coller : chaque sticker avec ses effets, et grisé (avec la raison) s'il ne se pose pas
    const can = (d.furn || []).filter(t => FURN[t]), full = furnCount(r) >= cap;
    const why = t => { const f = FURN[t], av = withZ(zOf(r), () => availability('furn', t)); if (!r.built) return 'Chantier en cours'; if (full) return `Pièce pleine (${furnCount(r)}/${cap})`; if (f.tier && S.tier < f.tier) return `Palier ${f.tier}`; if (f.size && groupSize(r) < f.size) return f.size >= 3 ? 'Salle immense (3 pièces collées)' : 'Grande salle (2 pièces collées)'; if (av && av.lock) return av.reason; if (av && av.poor || !canAfford(costOf('furn', t))) return `Il te faut ${costText(costOf('furn', t))}`; return ''; };
    if (can.length) html += `<h3>Ajouter${full ? ' <small class="hint">· pièce pleine</small>' : ''}</h3><div class="addlist">${can.map(t => { const no = why(t), f = FURN[t]; return `<div class="addrow${no ? ' off' : ''}">
      <div class="arhead">${imgThumb('furn', t, 'mini')}<b>${esc(f.name)}</b>${S.free[t] > 0 ? `<span class="arfree">${gi('gift')} offert ×${S.free[t]}</span>` : `<span class="arcost${canAfford(costOf('furn', t)) ? '' : ' no'}">${costText(costOf('furn', t))}</span>`}</div>
      <div class="artags">${statTags(f) || ''}</div><p class="ardesc">${esc(f.desc || '')}</p>
      ${no ? `<p class="arwhy">${gi('lock')} ${esc(no)}</p>` : ''}
      <details class="ardet"><summary>${gi('info')} Tous ses effets</summary><div class="ardetb">${tipHTML('furn', t)}</div></details>
      <button class="sbtn ${no ? '' : 'pri'}" type="button" data-take="${t}" ${no ? 'disabled' : ''}>${no ? 'Indisponible' : `${gi('pin')} Coller ici`}</button></div>`; }).join('')}</div>`;
  }
  if (r.t === 'coeur') { const def = homeCreatures().filter(c => !c.post || c.post === r.id); html += `<h3>Défenseurs du Cœur</h3><p>${def.length ? def.map(c => esc(c.name)).join(', ') : 'Personne !'} <span class="hint">(garde ${def.reduce((a, c) => a + guardOf(c), 0)})</span></p>`; }
  else if (!isHall(r)) { const posted = S.creatures.filter(c => c.post === r.id); html += `<h3>Postes</h3><p>${posted.length ? posted.map(c => esc(c.name)).join(', ') : '<span class="hint">Personne. Donne un poste ici depuis la fiche d’une créature : elle défendra la pièce.</span>'}</p>`; }
  html += '<div class="btnrow">';
  if (!r.built) html += `<button class="sbtn pri" id="mPush" type="button" ${S.gold >= 2 && r.prog + (r.boost || 0) < d.clock ? '' : 'disabled'}>🔨 Renfort de nuit : +1 segment à l’aube (2 💰)${r.boost ? ` · ${r.boost} prévu${r.boost > 1 ? 's' : ''}` : ''}</button>`;
  if (!d.fixed) html += `<button class="sbtn danger" id="mRemove" type="button">${r.built ? 'Décoller (rend la moitié)' : 'Annuler le chantier (remboursé)'}</button>`;
  html += `<button class="sbtn" type="button" data-wiki-open="room:${r.t}">📖 Grimoire</button></div>`;
  const m = openModal(html, { label: d.name }), q = s => m.querySelector(s); UI.mctx = ['room', id];
  m.addEventListener('click', e => {
    const u = e.target.closest('[data-unstick]'); if (u) { if (run('unstick', { id: u.dataset.unstick })) { sfx('peel'); afterChange(); openRoom(id); } return; }
    const tk = e.target.closest('[data-take]'); if (tk) { closeModal(); takeSticker('furn', tk.dataset.take); }
  });
  q('#mGoFloor') && q('#mGoFloor').addEventListener('click', () => { closeModal(); setFloor(zOf(r) + (r.land ? -d.stairs : d.stairs)); sfx('tick'); });
  q('#mRemove') && q('#mRemove').addEventListener('click', e => confirmBtn(e.currentTarget, 'Sûr ? Décoller', () => {
    if (!run('removeRoom', { id })) return;
    sfx('peel'); closeModal(); afterChange();
  }));
  q('#mPush') && q('#mPush').addEventListener('click', () => {
    if (!run('push', { id })) return; sfx('tick'); toast('🔨 Des bras en plus cette nuit : le segment sera posé à l’aube.');
    afterChange(); openRoom(id);
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
// l'envie du moment : elle se comble toute seule ; seule l'aventure demande ta décision
function questCard(c, q) {
  const T = QT[q.k], ch = q.ch <= 3 ? `Chapitre ${q.ch}/3 de son histoire` : 'Envie de légende', rw = questReward(q.k === 'expe' && !q.res ? { ...q, res: 'full' } : q);
  let h = `<div class="quest st-${q.st}" id="mEnvie"><div class="qh"><span class="emo">${T.ico}</span><span><small>✦ Son envie · ${ch}</small><b>${esc(q.title)}</b></span></div><p>« ${esc(q.text)} »</p>`;
  if (q.st === 'ready') h += `<p class="hint">Récompense : ${rewardLine(rw)} (selon le résultat de l’aventure), et son histoire entre dans la légende.</p><div class="btnrow"><button class="sbtn pri" type="button" data-q="qAccept">🧭 La laisser partir (2 nuits)</button></div>`;
  else if (q.st === 'active') h += `<p class="hint">Où ça en est : <b>${esc(T.prog(q, c))}</b> · Récompense, dès que c’est fait : ${rewardLine(rw)}.</p>`;
  else if (q.st === 'away') h += `<p class="hint">🧭 En route ! Retour à l’aube, avant la nuit ${c.awayUntil}.</p>`;
  return h + '</div>';
}
function openCreature(id) {
  const c = S.creatures.find(x => x.id === id); if (!c) return;
  if (typeof VISIT !== 'undefined' && VISIT) { openVisitCreature(id); return; }
  TUTO.flags.creature = true; V.selected = id; renderPortraits();
  const sp = SPECIES[c.sp], mf = moodFactors(c), ef = epaFactors(c), q = questOf(c), out = isOut(c);
  const line = c.away ? 'Je suis parti·e en mission, je reviens vite !' : c.tempt ? pick([`Il paraît qu’à ${c.tempt.name}, on choie les ${sp.name.toLowerCase()}s…`, 'Je réfléchis à mon avenir, c’est tout.', 'Rien. Je regardais par la fenêtre. Vers là-bas.'])
    : c.mood <= 1 ? pick(['Laisse-moi tranquille.', 'Je boude. Ça se voit pas ?', 'Il fait froid, j’ai faim, et personne ne m’aime.']) : q && q.st === 'ready' ? 'Dis, Maître… j’ai envie de partir à l’aventure. Juste deux nuits !' : q && q.st === 'active' && Math.random() < .5 ? `Tu sais ce qui me ferait plaisir ? ${q.title}.` : pick(sp.lines);
  const rooms = builtRooms().filter(r => !isHall(r) && !ROOMS[r.t].stairs);
  const opts = '<option value="">Libre (garde le Cœur)</option>' + rooms.map(r => { const fav = r.t === sp.from || (ROOMS[r.t].attracts || []).includes(c.sp); return `<option value="${r.id}" ${c.post === r.id ? 'selected' : ''}>${fav ? '★ ' : ''}${esc(ROOMS[r.t].name)}${zOf(r) ? ' · ' + FLOOR_SHORT[zOf(r)] : ''}</option>`; }).join('');
  const perks = [2, 3, 4, 5].filter(l => c.lvl >= l).map(l => LVL_PERK[l]);
  const m = openModal(`<div class="cardhead"><div class="portrait char"><img class="th" alt="" src="${thumb('char', c.sp, true)}"></div>
      <div><h2>${esc(c.name)}</h2><p><span class="tag2">${sp.name}</span><span class="tag2">Niv. ${c.lvl}</span>${c.legend ? '<span class="tag2 gold">🗿 Légende</span>' : ''}${sp.tag ? `<span class="tag2">${TAGS[sp.tag]}</span>` : ''}${c.away ? '<span class="tag2">🧭 en mission</span>' : c.raid ? '<span class="tag2">🗺️ en raid</span>' : ''}</p><div>${hearts(c.mood)} <span class="hint">${moodWord(c.mood)}</span></div></div></div>
    <div class="bubble" id="mLine">« ${esc(line)} »</div>
    ${c.tempt ? `<div class="tempt"><p>👀 <b>${esc(c.name)} lorgne vers ${esc(c.tempt.name)}</b> : là-bas, les ${esc(sp.name.toLowerCase())}s sont mieux reçus (${Math.round(c.tempt.v)} contre ${repOf(c.sp)} ici). Tant que sa loyauté reste sous 40, il·elle peut partir à l’aube. Pour la retenir : comble son envie, ou réalise son rêve secret.</p>
      <div class="btnrow">${PW('palier2') ? `<button class="sbtn" type="button" id="mRappel" ${pwReady(ACH_BY.palier2) ? '' : 'disabled'}>🔔 Cloche du rappel</button>` : ''}<button class="sbtn" type="button" id="mRenown">⭐ Renommée</button></div></div>` : ''}
    ${q ? questCard(c, q) : `<p class="hint" id="mEnvie">${c.legend ? '🗿 Son histoire est devenue légende. Il·elle repartira parfois à l’aventure.' : `Son histoire : chapitre ${c.story || 0}/3. ${(c.story || 0) >= 2 && !c.dream ? 'La suite (une aventure) viendra quand son rêve secret sera réalisé.' : 'Une nouvelle envie viendra bientôt.'}`}</p>`}
    ${typeof secretHTML === 'function' ? secretHTML(c) : ''}
    <dl class="kv">${typeof persHTML === 'function' ? persHTML(c) : ''}<dt>Compétence</dt><dd><b>${esc(sp.skill)}</b> : ${esc(sp.sd)}</dd>
      <dt>Combat</dt><dd>${(() => { const f = fighterOf(c); return `❤️ ${f.max} PV · ⚔️ ${f.atk}`; })()} · ${guardOf(c)} 🛡️ garde · ${diceOf(c)} 🎲 en raid${sp.eats > 1 ? ' · mange pour deux' : ''}${injured(c) ? '<br><span class="no">🤕 Sonné·e : se repose jusqu’à l’aube, ni garde ni raid.</span>' : ''}</dd>
      <dt>Salaire</dt><dd>${salaryOf(c) ? `${salaryOf(c)} 💰 tous les ${PAY_EVERY} nuits${c.unpaid && S.night - c.unpaid < PAY_EVERY ? ' · <span class="no">pas payé·e à la dernière paie</span>' : c.paidAt ? ' · payé·e à la dernière paie' : ''}` : 'Aucun : les diablotins travaillent pour le Cœur'}</dd>
      <dt>Poste</dt><dd><select class="sel" id="mPost" ${out ? 'disabled' : ''} aria-label="Poste de ${esc(c.name)}">${opts}</select></dd>
      <dt>Expérience</dt><dd>${c.lvl < 5 ? `${bar((c.xp - LVL_XP[c.lvl]) / (LVL_XP[c.lvl + 1] - LVL_XP[c.lvl]) * 100, '#8fb8ff', 'XP')} <span class="num">${c.xp}/${LVL_XP[c.lvl + 1]} XP</span>` : '<b>Niveau maximal</b>'}${perks.length ? `<br><span class="hint">${perks.map(esc).join(' · ')}</span>` : ''}</dd>
      <dt>Loyauté</dt><dd>${bar(c.loy, '#e9b949', 'Loyauté')} <b class="num">${c.loy}</b> <span class="hint">${loyWord(c.loy)}</span></dd>
      <dt>Épanouissement</dt><dd>${bar(c.epa, '#7fbf5a', 'Épanouissement')} <b class="num">${c.epa}</b> <span class="hint">${epaWord(c.epa)} · vise ${ef.target}</span></dd></dl>
    <h3>Humeur visée cette nuit : ${mf.target}/5</h3><div>${mf.f.map(([t, v]) => `<span class="tag2">${v > 0 ? '+' + v : v < 0 ? v : '·'} ${esc(t)}</span>`).join('')}</div>
    <details class="more"><summary>Ce qui l’épanouit (la loyauté suit l’épanouissement, nuit après nuit)</summary><div>${ef.f.map(([t, v]) => `<span class="tag2">${v > 0 ? '+' + v : v < 0 ? v : '·'} ${esc(t)}</span>`).join('')}</div></details>
    <div class="btnrow">
      <button class="sbtn" id="mTalk" type="button">💬 Discuter</button>
      <button class="sbtn" id="mFind" type="button" ${out ? 'disabled' : ''}>🔎 Voir</button>
      <button class="sbtn danger" id="mFire" type="button" ${out ? 'disabled' : ''}>👋 Renvoyer</button><button class="sbtn" type="button" data-wiki-open="sp:${c.sp}">📖 Grimoire</button></div>`, { label: c.name });
  UI.mctx = ['creature', id];
  const q2 = s => m.querySelector(s);
  const heartsFx = () => { const a = ACT.get(c.id); if (a) for (let i = 0; i < 3; i++) setTimeout(() => floatText(a.x + (Math.random() - .5) * .4, a.y, '♥', '#ff9cba'), i * 140); };
  const speak = l => { say(c.id, l); const b = $('#mLine'); if (b) b.textContent = '« ' + l + ' »'; };
  q2('#mTalk').addEventListener('click', () => { const l = pick(c.mood <= 1 ? ['…', 'Hmpf.', 'Va voir ailleurs si j’y suis.'] : sp.lines); q2('#mLine').textContent = '« ' + l + ' »'; say(c.id, l); sfx('tick'); });
  q2('#mFind').addEventListener('click', () => { closeModal(); focusActor(c.id); });
  q2('#mPost').addEventListener('change', e => { if (!run('post', { id, post: e.target.value || null })) return; sfx('tick'); const a = ACT.get(c.id); if (a) { a.tok++; a.walking = false; a.dur = 0; wanderOnce(a, true); } afterChange(); openCreature(id); });
  q2('#mFire').addEventListener('click', e => confirmBtn(e.currentTarget, 'Sûr ? Au revoir…', () => { if (!run('fire', { id })) return; closeModal(); critterLeave(c.id); V.selected = null; afterChange(); }));
  q2('#mRappel') && q2('#mRappel').addEventListener('click', () => { if (!run('power', { pw: 'rappel', id })) return; sfx('chime'); afterChange(); openCreature(id); speak('Cette cloche… elle me rappelle pourquoi je suis là.'); });
  q2('#mRenown') && q2('#mRenown').addEventListener('click', openRenown);
  m.addEventListener('click', e => {
    const b = e.target.closest('[data-q]'); if (!b || b.disabled) return;
    const k = b.dataset.q, qq = questOf(c), away = qq && QT[qq.k].away;
    if (!run(k, { id })) return;
    if (k === 'qAccept') { sfx('chime'); toast(`🧭 ${c.name} part à l’aventure. Retour dans 2 nuits.`); closeModal(); afterChange(); return; }
    afterChange(); openCreature(id);
  });
}
function focusActor(id) { const a = ACT.get(id); if (!a) return; if ((a.z || 0) !== Z) setFloor(a.z || 0); const [wx, wy] = WP(a.x, a.y), ts = Math.max(CAM.s, Math.min(1.1, CAM.max)); CAM.s = ts; CAM.x = V.w / 2 - wx * ts; CAM.y = V.h / 2 - (wy - 50) * ts; clampCam(); V.selected = id; say(id, pick(['Coucou chef !', 'Oui ?', 'J’ai rien fait !']), 2000); }
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
// icône du bouton Construire : un maillet et un sticker
ICON_DRAW.build = g => {
  g.save(); g.rotate(-.5); rrect(g, -3, -2, 6, 26, 2, '#a8683a'); rrect(g, -13, -16, 26, 13, 4, '#9aa0aa'); ln(g, [[-9, -9.5], [9, -9.5]], 'rgba(255,255,255,.5)', 1.6); g.restore();
  rrect(g, 4, 2, 14, 14, 3, '#f3e3c0'); ln(g, [[7, 9], [15, 9]], '#c99a4a', 1.6); ln(g, [[11, 5], [11, 13]], '#c99a4a', 1.6);
};
