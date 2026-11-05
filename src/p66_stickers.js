/* =========================================================
   Des stickers en abondance, et le Livre des stickers
   Bien plus de stickers qu'une partie ne peut en offrir, pour
   donner envie de rejouer : le premier arrivant et la première
   légende de chaque espèce, chaque élite terrassée (une fois,
   cinq fois), chaque classe de héros vaincue, les invasions
   marquantes, les choix des rencontres d'expédition (certains
   exclusifs : soigner le blessé ferme la bourse), chacune des
   cinq victoires du Val, chaque relique, chaque
   Merveille, chaque pacte, l'âge d'or de chaque ère.
   Sous chaque sticker collé : comment il a été débloqué.
   Le Livre des stickers garde tout ce qui a été découvert,
   toutes parties confondues (dans ce navigateur), et montre
   les emplacements vides sans dire comment les remplir.
   ========================================================= */
const META_KEY = 'csd-livre';
const metaLoad = () => { try { return JSON.parse(localStorage.getItem(META_KEY) || '{}') || {}; } catch (e) { return {}; } };
function metaAdd(x) {
  if (typeof headless === 'function' && headless()) return; if (!x || !x.id) return;
  try { const M = metaLoad(), m = MOM_BY[x.id] || {}; M.got = M.got || {}; const g = M.got[x.id];
    if (g) g.n = (g.n || 1) + 1; else M.got[x.id] = { t: x.t || m.t, ico: x.ico || m.ico, d: x.d || m.d, cat: x.cat || m.cat, art: x.art || null, sub: x.sub || '', night: x.night, castle: S.name, date: Date.now(), n: 1 };
    localStorage.setItem(META_KEY, JSON.stringify(M)); } catch (e) {}
}
const bookAddMeta = bookAdd;
bookAdd = function (c, x) { const r = bookAddMeta(c, x); metaAdd(x); return r; };
// un sticker de famille, avec son « comment » et son groupe exclusif
function stk(id, t, ico, cat, pts, d, o = {}) {
  if (!S || !S.started || !S.book) return null; const B = S.book; B.closed = B.closed || {};
  if (o.excl && B.closed[o.excl] && B.closed[o.excl] !== id) return null;   // un choix exclusif a déjà été fait dans cette partie
  const x = bookEarnDyn(id, { t, ico, cat, pts, sub: o.sub || '', art: o.art || null, d }, o.lines);
  if (x) { x.d = d; if (o.excl) B.closed[o.excl] = id;  }
  return x;
}
const spName = sp => (SPECIES[sp] || {}).name || sp;
/* ---------- les familles ---------- */
// à l'aube : premiers arrivants, légendes, reliques, Merveilles
function stkDawn(report) {
  if (!S.book) return;
  const B0 = S.book; if (!B0.startSp) B0.startSp = S.night <= 2 ? [...new Set(S.creatures.map(c => c.sp))] : ['diablotin'];   // les espèces du départ ne comptent pas comme une « première »
  S.creatures.forEach(c => {
    if (!B0.startSp.includes(c.sp)) stk('espece:' + c.sp, `Le premier ${spName(c.sp).toLowerCase()}`, '🐾', 'Éleveur', 1, `Accueillir pour la première fois un·e ${spName(c.sp).toLowerCase()}.`, { art: { k: 'sp', key: c.sp }, sub: c.name, lines: report });
    if (c.legend || c.evo || (c.lvl || 1) >= 5) stk('legende:' + c.sp, `La légende des ${spName(c.sp).toLowerCase()}s`, '🗿', 'Missions', 2, `Faire d’un·e ${spName(c.sp).toLowerCase()} une légende (niveau 5).`, { art: { k: 'sp', key: c.sp }, sub: c.name, lines: report });
  });
  (S.book.relics || []).forEach(r => { const R = RELIC_BY[r.id]; if (R) stk('relique:' + r.id, R.name, R.ico, 'Château', 2, `Finir un chapitre en âge d’or et recevoir cette relique d’ère.`, { sub: `de l’Ère ${r.era}`, lines: report }); });
  if (typeof WONDERS !== 'undefined') Object.entries(WONDERS).forEach(([k, W]) => { const L = wonderLv(k); if (L >= 1) stk('merveille:' + k, W.name, W.ico === 'shield' ? '🛡️' : W.ico === 'mug' ? '🍺' : W.ico === 'statue' ? '🗽' : '📚', 'Bâtisseur', 1, `Bâtir ${W.name}.`, { lines: report }); if (L >= 5) stk('merveille:' + k + ':5', `${W.name}, niveau 5`, '🏛️', 'Bâtisseur', 3, `Agrandir ${W.name} jusqu’au niveau 5.`, { lines: report }); });
}
const dawnStk = dawn;
dawn = function (report) { const r = dawnStk(report); try { stkDawn(report); } catch (e) { console.error(e); } return r; };
// l'âge d'or de chaque ère, et chaque pacte choisi
const bookTickStk = bookTick;
bookTick = function (report) {
  const B = S && S.book, before = B ? B.ch.length : 0; bookTickStk(report);
  try { if (B && B.ch.length > before) { const c = B.ch[before - 1]; if (c && (c.age === 'or' || c.age === 'heroique')) stk('or:' + c.name, `L’âge d’or de l’Ère ${c.name}`, '🌟', 'Âges', 3, `Finir l’Ère ${c.name} en tête de la course des rivaux.`, { lines: report }); if (c && c.age === 'heroique') stk('heroique', 'Un âge héroïque', '⚜️', 'Âges', 4, 'Finir un chapitre en âge d’or juste après un âge sombre.', { lines: report }); if (c && c.age === 'sombre') stk('sombre', 'Traverser l’âge sombre', '🌑', 'Âges', 1, 'Finir un chapitre derrière tous les rivaux.', { lines: report }); } } catch (e) { console.error(e); }
};
const cmdPactStk = CMD.pact;
CMD.pact = a => { const e = cmdPactStk(a); if (!e && PACT_BY[a.id]) stk('pacte:' + a.id, PACT_BY[a.id].name, PACT_BY[a.id].ico, 'Âges', 1, `Choisir ce pacte pour traverser un âge sombre.`); return e; };
// chaque victoire du Val a son sticker, chaque fois qu'elle est remportée (même la deuxième d'une partie)
const winVictoryStk = winVictory;
const vicStkD = id => `Remporter la ${VIC_BY[id].name.replace('Victoire', 'victoire')}.`;
winVictory = function (id, out) { const had = !!(S.vic && S.vic.won && S.vic.won[id]); winVictoryStk(id, out); try { if (!had && VIC_BY[id] && S.vic.won[id]) stk('vic:' + id, VIC_BY[id].name, VIC_BY[id].ico, 'Victoires', 5, vicStkD(id), { lines: out }); } catch (e) { console.error(e); } };
// les élites terrassées (une fois, puis cinq fois)
const crawlFoesStk = crawlFoes;
crawlFoes = function (R, kind) { const f = crawlFoesStk(R, kind); try { R._foes = f.map(x => x.k); } catch (e) {} return f; };
const crawlWinLootStk = crawlWinLoot;
crawlWinLoot = function (R, kind) {
  const r = crawlWinLootStk(R, kind);
  try { if (kind === 'elite') { const k = (R._foes || []).find(x => CRAWL_EN[x] && CRAWL_EN[x].elite); if (k) { const E = CRAWL_EN[k], st = (S.stats.eliteKills = S.stats.eliteKills || {}); st[k] = (st[k] || 0) + 1;
    const art = E.sp ? { k: 'char', key: E.sp } : null; stk('elite:' + k, `${E.name} terrassé·e`, E.emo || '💥', 'Profondeurs', 2, `Vaincre l’élite ${E.name} en expédition.`, { art });
    if (st[k] >= 5) stk('elite:' + k + ':5', `Le fléau des ${E.name}s`, '🏅', 'Profondeurs', 3, `Vaincre cinq fois l’élite ${E.name}.`, { art }); } } } catch (e) { console.error(e); }
  return r;
};
// les invasions : chaque classe de héros vaincue, les bandes marquantes
const HERO_NAMES = { paysan: 'paysan', voleuse: 'voleuse', elfe: 'archer elfe', mage: 'mage', paladin: 'paladin', barbare: 'barbare' };
const applyCombatStk = applyCombat;
applyCombat = function (plan, R, lines) {
  const r = applyCombatStk(plan, R, lines);
  try {
    if (!S.book) return r; const st = (S.stats.heroKind = S.stats.heroKind || {});
    (R.fallen || []).forEach(h => { const k = h && (h.k || (typeof h === 'number' && plan.party[h] && plan.party[h].k)); if (!k || !HERO_NAMES[k]) return; st[k] = (st[k] || 0) + 1;
      stk('heros:' + k, `Un ${HERO_NAMES[k]} à terre`, '🗡️', 'Invasions', 1, `Mettre K.O. un·e ${HERO_NAMES[k]} pendant une invasion.`, { art: { k: 'hero', key: k }, sub: h.name || '', lines });
      if (st[k] >= 10) stk('heros:' + k + ':10', `Dix ${HERO_NAMES[k]}s plus tard`, '🏆', 'Invasions', 2, `Mettre K.O. dix ${HERO_NAMES[k]}s au fil des invasions.`, { art: { k: 'hero', key: k }, lines }); });
    if (R.outcome === 'repelled') {
      if (!(R.hurt || []).length) stk('inv:intacte', 'Pas une égratignure', '✨', 'Invasions', 2, 'Repousser une invasion sans qu’aucune créature ne soit sonnée.', { lines });
      if ((plan.party || []).length >= 5 || (plan.rank || 0) >= 3) stk('inv:redoutable', 'Une bande redoutable', '🔥', 'Invasions', 3, 'Repousser une bande de cinq héros, ou venue de très loin.', { art: { k: 'hero', key: 'paladin' }, lines });
      if (S.vic && S.vic.croisade && S.vic.croisade.done) stk('inv:croisade', 'Les croisés en déroute', '⚔️', 'Invasions', 3, 'Repousser une bande de la croisade.', { art: { k: 'hero', key: 'paladin' }, lines });
    }
  } catch (e) { console.error(e); }
  return r;
};
// les rencontres d'expédition : chaque choix est un sticker, certains s'excluent
const EV_STK = {
  blesse: [['Âme charitable', '😇', 'Soigner l’aventurier blessé rencontré en expédition.', 'moral'], ['Détrousseur', '🪙', 'Prendre la bourse de l’aventurier blessé.', 'moral']],
  cage: [['Libérateur', '🔓', 'Libérer le prisonnier d’une cage en expédition.', 'cage'], ['Cœur de pierre', '🪨', 'Ignorer le prisonnier qui supplie.', 'cage']],
  miroir: [['Briseur de miroirs', '🪞', 'Briser le miroir qui montre ton château en ruines.', 'miroir'], ['Narcisse', '🔮', 'Regarder longtemps le miroir des ruines.', 'miroir']],
  champignons: [['Goûteur intrépide', '🍄', 'Goûter les champignons luisants.'], ['Cueilleur', '🧺', 'Cueillir les champignons pour le château.']],
  osselets: [['Joueur d’osselets', '🎲', 'Parier contre le gobelin aux osselets.'], ['Sage prudent', '🙅', 'Refuser la partie d’osselets.']],
  autel: [['Fidèle de l’autel', '🕯️', 'Prier devant l’autel aux bougies noires.'], null],
  fontaine: [['Eau de jouvence', '⛲', 'Boire à la fontaine du noir.'], ['Gourdes pleines', '🫗', 'Remplir les gourdes à la fontaine.']],
  marchand: [['Bon client', '🧪', 'Acheter une potion au marchand perdu.'], ['Bon samaritain', '🧭', 'Indiquer la sortie au marchand perdu.']],
  coffre: [['Ouvreur de coffres', '🗝️', 'Ouvrir le coffre trop bien en évidence.'], ['Méfiant', '🤨', 'Laisser le coffre là où il est.']],
  grimoire: [['Lecteur d’abîmes', '📖', 'Étudier une page de la bibliothèque engloutie.'], ['Repêcheur', '🎣', 'Repêcher les reliures de la bibliothèque engloutie.']],
  forge: [['Forgeron d’un soir', '⚒️', 'Aiguiser une carte sur l’enclume abandonnée.'], null],
  colporteur: [['Chineur', '🛍️', 'Acheter une carte au colporteur.'], null],
};
CRAWL_EVENTS.forEach(E => (EV_STK[E.k] || []).forEach((v, i) => { if (!v || !E.a[i]) return; const f0 = E.a[i][1]; E.a[i][1] = R => { const t = f0(R); try { stk(`ev:${E.k}:${i}`, v[0], v[1], 'Rencontres', 1, v[2], v[3] ? { excl: v[3] } : {}); } catch (e) {} return t; }; }));
/* ---------- le Livre des stickers : tout ce qui a été découvert, toutes parties confondues ---------- */
function stkCatalogSize() {
  const sp = SPECIES_ORDER.length, el = Object.keys(CRAWL_EN).filter(k => CRAWL_EN[k].elite).length, bo = Object.keys(CRAWL_EN).filter(k => CRAWL_EN[k].boss).length;
  return MOMENTS.filter(m => !m.online).length + RECUR.length + sp * 3 + el * 2 + bo + Object.keys(CRAWL_DG).length + 12 + 3 + Object.values(EV_STK).reduce((a, v) => a + v.filter(Boolean).length, 0) + VICTORIES.length + RELICS_ERA.length + PACTS.length + 8 + ERA_NAMES.length + 3;
}
function openStickerBook() {
  const M = metaLoad(), got = Object.entries(M.got || {}).filter(([id]) => id !== 'r_album' && id !== 'espece:diablotin').sort((a, b) => (a[1].date || 0) - (b[1].date || 0)), total = Math.max(stkCatalogSize(), got.length), single = innerWidth < 760;
  const P = ['<div class="lvp garde"></div>', `<div class="lvp titre"><div class="lv-frame"><div class="lv-orn">❦</div><h1>Le Livre des stickers</h1><p class="lv-castle">toutes tes parties</p><div class="lv-orn">❧</div><p class="lv-hand">${got.length} sticker${got.length > 1 ? 's' : ''} découvert${got.length > 1 ? 's' : ''} sur ${total}.</p><p class="lv-hand small">Chaque partie en révèle d’autres. Certains sont rares, d’autres s’excluent : il faudra rejouer pour tous les trouver.</p></div></div>`];
  const L = lvLayout(single);   // autant de stickers par page que l'écran en laisse la place
  for (let i = 0; i < got.length; i += L.cap) P.push(`<div class="lvp st grid" style="--cols:${L.cols}; --rows:${L.rows}; --stw:${L.w}px"><div class="lv-runhead">Le Livre des stickers</div>${got.slice(i, i + L.cap).map(([id, g], j) => { const vk = /^vic:/.test(id) && VIC_BY[id.slice(4)] ? id.slice(4) : null;   // les anciens « Première victoire : … » prennent le nom de leur victoire
    const x = { id, t: vk ? VIC_BY[vk].name : g.t, ico: g.ico, cat: g.cat, art: g.art, d: vk ? vicStkD(vk) : g.d, night: g.night, sub: g.n > 1 ? `trouvé ${g.n} fois` : `chez ${g.castle || '?'}` }; return lvSticker(x, j, false, false, lvJit(x)); }).join('')}</div>`);
  const slots = n => Array.from({ length: n }, (_, i) => `<div class="lv-slot" style="--rot:${[-3, 2, -1, 3, -2, 1][i % 6]}deg"><span>?</span></div>`).join('');
  P.push(`<div class="lvp blanc"><p class="lv-hand big">Encore ${Math.max(0, total - got.length)} stickers à découvrir…</p><div class="lv-slots">${slots(6)}</div><p class="lv-hand small">Personne ne sait vraiment ce qui les fait apparaître. Essaie des choses.</p></div>`);
  if (P.length % 2) P.push('<div class="lvp blanc"></div>'); P.push('<div class="lvp garde"></div>');
  const m = openModal(`<div class="lvbook${single ? ' single' : ''}"><div class="lv-spread"></div><div class="lv-cover"><div class="lv-cover-in"><span>📚</span><b>Le Livre des stickers</b><small>toutes tes parties</small></div></div><div class="lv-ribbon"></div></div><div class="lv-bar"><button type="button" class="lv-arrow" data-g="-1">◀</button><span class="lv-folio"></span><button type="button" class="lv-arrow" data-g="1">▶</button></div>`, { label: 'Le Livre des stickers', cls: 'livrebook', wide: true });
  let idx = 0, anim = false; const spread = m.querySelector('.lv-spread'), pg = i => `<div class="lvpg-in">${P[i] || '<div class="lvp blanc"></div>'}</div>`, last = single ? P.length - 1 : P.length - 2;
  const render = () => { spread.innerHTML = single ? `<div class="lv-pg one">${pg(idx)}</div>` : `<div class="lv-pg l">${pg(idx)}</div><div class="lv-pg r">${pg(idx + 1)}</div>`; m.querySelector('[data-g="-1"]').disabled = idx <= 0; m.querySelector('[data-g="1"]').disabled = idx >= last; m.querySelector('.lv-folio').textContent = `page ${idx + 1} sur ${P.length}`; };
  const flip = dir => { if (anim) return; const nx = idx + dir * (single ? 1 : 2); if (nx < 0 || nx > last) return; anim = true; sfx('tick'); const leaf = document.createElement('div');
    if (single) { leaf.className = `lv-leaf one ${dir > 0 ? 'fwd' : 'bwd'}`; leaf.innerHTML = `<div class="lv-face front">${pg(dir > 0 ? idx : nx)}</div><div class="lv-face back"><div class="lvpg-in"><div class="lvp blanc"></div></div></div>`; if (dir > 0) spread.querySelector('.lv-pg').innerHTML = pg(nx); }
    else if (dir > 0) { leaf.className = 'lv-leaf fwd'; leaf.innerHTML = `<div class="lv-face front">${pg(idx + 1)}</div><div class="lv-face back">${pg(nx)}</div>`; spread.querySelector('.lv-pg.r').innerHTML = pg(nx + 1); }
    else { leaf.className = 'lv-leaf bwd'; leaf.innerHTML = `<div class="lv-face front">${pg(idx)}</div><div class="lv-face back">${pg(nx + 1)}</div>`; spread.querySelector('.lv-pg.l').innerHTML = pg(nx); }
    spread.appendChild(leaf); requestAnimationFrame(() => requestAnimationFrame(() => leaf.classList.add('go'))); setTimeout(() => { idx = nx; render(); anim = false; }, 680); };
  render(); requestAnimationFrame(() => requestAnimationFrame(() => m.querySelector('.lvbook').classList.add('opened'))); setTimeout(() => { const cv = m.querySelector('.lv-cover'); if (cv) cv.remove(); }, 1000);
  m.addEventListener('click', e => { const g = e.target.closest('[data-g]'); if (g) flip(+g.dataset.g); });
  let sx = null; spread.addEventListener('pointerdown', e => { sx = e.clientX; }); spread.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) flip(dx < 0 ? 1 : -1); });
}
