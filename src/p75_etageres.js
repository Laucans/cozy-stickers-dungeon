/* =========================================================
   Les étagères en plus : une place de sticker de plus dans une pièce
   Une amélioration fait-main, dans la fiche de la pièce, payée
   surtout en bois (il s'entasse) : « Étagères en plus » (+1 place),
   puis « Coin aménagé » (+1 encore). Chaque pièce garde les
   siennes ; une grande salle additionne celles de ses pièces.
   Ni couloir, ni porche, ni escalier. Le champ r.shelf (0 à 2)
   vit dans la pièce : une vieille partie n'en a pas, c'est 0.
   ========================================================= */
const SHELF_TUNE = {
  max: 2,                                   // niveaux au plus, par pièce
  names: ['Étagères en plus', 'Coin aménagé'],
  s: priceK(6, 's'), sCell: priceK(2, 's'), sTier: priceK(3, 's'),   // le bois du premier niveau : base, par case de la pièce, par palier de la pièce (Bibliothèque : 1, Trésor : 2…), selon PRICE (p3)
  g: priceK(2, 'g'),                        // un peu d'or pour les clous
  k: 2,                                     // le second niveau coûte k fois le premier, et AMBER_COST.shelf d'Ambre 🟠 (p3) : le Coin aménagé est un « grand » ouvrage
  refund: .5,                               // une pièce décollée rend cette part de ses étagères, comme pour la pièce
};
const shelfLv = r => (r && r.shelf) || 0;
const shelfRoomOK = r => !!r && !isHall(r) && r.t !== 'porche' && !!ROOMS[r.t] && !ROOMS[r.t].stairs;
// les places en plus d'une pièce (une grande salle : celles de toutes ses pièces) ; lu par furnCap (p4)
const shelfBonus = r => groupOf(r).rooms.reduce((a, o) => a + shelfLv(o), 0);
// la pièce qui recevra les prochaines étagères : celle qu'on a touchée, sinon une autre de la grande salle
const shelfTarget = r => !shelfRoomOK(r) ? null : shelfLv(r) < SHELF_TUNE.max ? r : groupOf(r).rooms.filter(o => o.built && shelfLv(o) < SHELF_TUNE.max).sort((a, b) => shelfLv(a) - shelfLv(b))[0] || null;
const shelfCost = r => { const T = SHELF_TUNE, m = shelfLv(r) ? T.k : 1, c = { g: Math.round(T.g * m), s: Math.round((T.s + T.sCell * r.w * r.h + T.sTier * (ROOMS[r.t].tier || 0)) * m) }; if (shelfLv(r)) c.a = AMBER_COST.shelf; return c; };
const shelfName = lv => SHELF_TUNE.names[Math.min(lv, SHELF_TUNE.names.length - 1)];
function shelfWhy(r) {
  if (!r) return 'Pièce inconnue';
  if (!shelfRoomOK(r)) return 'Ni couloir, ni porche, ni escalier : seule une pièce s’aménage';
  if (!r.built) return 'Chantier en cours : la pièce s’aménage une fois terminée';
  const t = shelfTarget(r); if (!t) return groupSize(r) > 1 ? 'Toute la grande salle est déjà aménagée' : 'Déjà aménagée de fond en comble';
  const c = shelfCost(t); if (!canAfford(c)) return `Il te faut ${costText(c)}`;
  return '';
}
CMD.shelf = a => {
  const r = S.rooms.find(x => x.id === (a && a.id)), why = shelfWhy(r); if (why) return why;
  const t = shelfTarget(r), c = shelfCost(t), lv = shelfLv(t);
  pay(c); t.shelf = lv + 1; t.shelfPaid = { g: ((t.shelfPaid || {}).g || 0) + (c.g || 0), s: ((t.shelfPaid || {}).s || 0) + (c.s || 0), a: ((t.shelfPaid || {}).a || 0) + (c.a || 0) };
  S.stats.shelves = (S.stats.shelves || 0) + 1;
  addLog(`${ROOMS[t.t].name} : ${shelfName(lv)}, une place de sticker de plus (${furnCount(t)}/${furnCap(t)}).`, 'good'); return null;
};
// une pièce décollée rend la moitié de ses étagères, comme elle rend la moitié de son prix
const removeRoomShelf = removeRoom;
removeRoom = function (r) { const P = r && r.built && r.shelfPaid; if (P) { S.gold += Math.floor((P.g || 0) * SHELF_TUNE.refund); S.mat += Math.floor((P.s || 0) * SHELF_TUNE.refund); S.amber = (S.amber || 0) + Math.floor((P.a || 0) * SHELF_TUNE.refund); } return removeRoomShelf(r); };

/* ---------- dans la fiche de la pièce, sous ses meubles ---------- */
function shelfHTML(r) {
  const t = shelfTarget(r), why = shelfWhy(r), n = shelfBonus(r), grp = groupSize(r) > 1;
  const have = n ? `<p class="ok">${gi('check')} ${grp ? `Grande salle : +${n} place${n > 1 ? 's' : ''} de sticker (les étagères de ses pièces s’additionnent).` : `${shelfName(shelfLv(r) - 1)} : +${n} place${n > 1 ? 's' : ''} de sticker.`}</p>` : '';
  if (!t) return `<div class="addrow done shelfrow"><div class="arhead">${gi('hammer')}<b>Aménagée de fond en comble</b></div>${have}</div>`;
  const lv = shelfLv(t), c = shelfCost(t);
  return `<div class="addrow shelfrow${why && !whyPoor(why) ? ' off' : ''}"><div class="arhead">${gi('hammer')}<b>${esc(shelfName(lv))}</b><span class="arcost">${costHTML(c)}</span></div>
    <p class="ardesc">${lv ? 'Un coin malin sous l’escalier, des crochets au plafond' : 'Des planches clouées au mur, quelques tasseaux'} : <b>une place de sticker de plus</b>${grp && t !== r ? ` (dans l’une des pièces de la grande salle : ${esc(ROOMS[t.t].name)})` : ''}. ${lv + 1}/${SHELF_TUNE.max} pour cette pièce${grp ? ' ; une grande salle additionne celles de ses pièces' : ''}.</p>
    ${have}${why && !whyPoor(why) ? `<p class="arwhy">${gi('lock')} ${esc(why)}</p>` : ''}
    <button class="sbtn ${why ? '' : 'pri'}" type="button" data-shelf="${r.id}" ${why ? 'disabled' : ''}>${gi('hammer')} Aménager (${costText(c)})</button></div>`;
}
const openRoomShelf = openRoom;
openRoom = function (id) {
  openRoomShelf(id);
  const r = S.rooms.find(x => x.id === id), m = document.querySelector('#modalRoot .modal'); if (!r || !m || !shelfRoomOK(r) || !r.built || (typeof VISIT !== 'undefined' && VISIT)) return;
  const list = m.querySelector('.flist'); if (!list) return;
  const box = el('div', 'addlist shelfbox', shelfHTML(r)); list.after(box);
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-shelf]'); if (!b || b.disabled) return;
    const sc = m.scrollTop; if (run('shelf', { id: b.dataset.shelf })) { sfx('chime'); afterChange(); toast('🔨 Toc toc toc : une place de plus pour un sticker.'); openRoom(id); const m2 = document.querySelector('#modalRoot .modal'); if (m2) m2.scrollTop = sc; }
  });
};

/* ---------- le Grimoire : l'article « Meubler » ---------- */
if (typeof WIKI !== 'undefined' && WIKI.meubler) {
  const meublerShelf = WIKI.meubler.x;
  WIKI.meubler.x = () => `${meublerShelf()}<p><b>Une pièce pleine ?</b> Une pièce prend un sticker pour deux cases (meubles et déco compris). Dans sa fiche, sous ses meubles, on peut l’<b>aménager</b>, surtout avec du bois : <b>${SHELF_TUNE.names[0]}</b> (+1 place), puis <b>${SHELF_TUNE.names[1]}</b> (+1 encore), ${SHELF_TUNE.max} fois au plus par pièce. Le prix suit la taille de la pièce et son palier : ${SHELF_TUNE.g} 💰 et ${SHELF_TUNE.s} 🪵, plus ${SHELF_TUNE.sCell} 🪵 par case et ${SHELF_TUNE.sTier} 🪵 par palier de la pièce (${costText(shelfCost({ t: 'cuisine', w: 2, h: 2 }))} pour une Cuisine) ; le second niveau coûte ${SHELF_TUNE.k} fois plus, et ${AMBER_COST.shelf} 🟠 d’{c:ambre|Ambre}. Une grande salle additionne les étagères de ses pièces. Pas de couloir, de porche ni d’escalier. Décoller la pièce rend la moitié de ce qu’elles ont coûté.</p>`;
}
