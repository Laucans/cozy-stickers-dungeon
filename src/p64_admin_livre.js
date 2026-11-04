/* =========================================================
   Atelier du Maître : le Livre du Maître
   Les stickers du Livre (premiers du Val, moments, moments
   récurrents) avec leur aperçu, les reliques d'ère, les pactes
   d'âge sombre, et les réglages des ères (durée, noms) et de la
   course des rivaux. Les conditions et les effets restent écrits
   dans le jeu : ici, on règle ce que les joueurs lisent et voient,
   et les chiffres (points, plafonds, fenêtres, pouvoirs).
   ========================================================= */
const bookData = m => { const o = { t: m.t, d: m.d, ico: m.ico, pts: m.pts }; if (m.cap != null) o.cap = m.cap; if (m.win) o.win = m.win.slice(); return o; };
const BOOK_STICKERS = Object.fromEntries(Object.entries(MOM_BY).map(([k, m]) => [k, bookData(m)]));
const BOOK_RELICS = Object.fromEntries(RELICS_ERA.map(r => [r.id, { name: r.name, ico: r.ico, d: r.d, pw: r.pw.slice() }]));
const BOOK_PACTS = Object.fromEntries(PACTS.map(p => [p.id, { name: p.name, ico: p.ico, d: p.d, cost: p.cost }]));
const BOOK_TUNE = { base: RIVAL_RATE.base, form: RIVAL_RATE.form.slice(), spread: RIVAL_RATE.spread, lenMin: BOOK_LEN[0], lenMax: BOOK_LEN[1], names: ERA_NAMES.slice(), dyn: { ...BOOK_DYN } };
Object.assign(TABLES, { BOOK_STICKERS, BOOK_RELICS, BOOK_PACTS });
Object.assign(BASE, structuredClone({ BOOK_STICKERS, BOOK_RELICS, BOOK_PACTS, BOOK_TUNE }));
const entryOfBook = entryOf; entryOf = function (t, k) { return t === 'BOOK_TUNE' ? BOOK_TUNE : entryOfBook(t, k); };
const baseOfBook = baseOf; baseOf = function (t, k) { return t === 'BOOK_TUNE' ? BASE.BOOK_TUNE : baseOfBook(t, k); };
// après chaque réglage : les tables de l'atelier sont recopiées dans le Livre (ses moments gardent leurs conditions écrites dans le jeu)
function bookSyncAdmin() {
  Object.entries(TABLES.BOOK_STICKERS || {}).forEach(([k, v]) => { if (MOM_BY[k]) Object.assign(MOM_BY[k], clone(v)); const f = FIRSTS.find(x => x.id === k); if (f) Object.assign(f, clone(v)); });
  Object.entries(TABLES.BOOK_RELICS || {}).forEach(([k, v]) => { if (RELIC_BY[k]) Object.assign(RELIC_BY[k], clone(v)); });
  Object.entries(TABLES.BOOK_PACTS || {}).forEach(([k, v]) => { if (PACT_BY[k]) Object.assign(PACT_BY[k], clone(v)); });
  RIVAL_RATE.base = +BOOK_TUNE.base || 0; if (Array.isArray(BOOK_TUNE.form) && BOOK_TUNE.form.length === 2) RIVAL_RATE.form = BOOK_TUNE.form.slice(); RIVAL_RATE.spread = +BOOK_TUNE.spread || 0;
  if (Array.isArray(BOOK_TUNE.names) && BOOK_TUNE.names.length) ERA_NAMES.splice(0, ERA_NAMES.length, ...BOOK_TUNE.names);
  if (BOOK_TUNE.dyn) Object.keys(BOOK_DYN).forEach(k => { if (BOOK_TUNE.dyn[k] != null) BOOK_DYN[k] = +BOOK_TUNE.dyn[k]; });
  BOOK_LEN[0] = Math.max(3, +BOOK_TUNE.lenMin || 8); BOOK_LEN[1] = Math.max(BOOK_LEN[0], +BOOK_TUNE.lenMax || 14);
  if (typeof S !== 'undefined' && S && S.book) bookRecalcPw();
}
const applyOverridesBook = applyOverrides;
applyOverrides = function (...a) {
  const r = applyOverridesBook(...a);
  Object.keys(BOOK_TUNE).forEach(k => delete BOOK_TUNE[k]); Object.assign(BOOK_TUNE, clone(BASE.BOOK_TUNE), clone((OVR.BOOK_TUNE && OVR.BOOK_TUNE._) || {}));
  bookSyncAdmin(); return r;
};

ATABS.splice(3, 0, ['livre', 'Livre', '📖']);
ADMIN.livre = { cat: 'premiers', key: null };
const LIVRE_CATS = [['premiers', 'Premiers du Val', 'BOOK_STICKERS'], ['moments', 'Moments', 'BOOK_STICKERS'], ['recur', 'Moments récurrents', 'BOOK_STICKERS'], ['reliques', 'Reliques d’ère', 'BOOK_RELICS'], ['pactes', 'Pactes d’âge sombre', 'BOOK_PACTS'], ['reglages', 'Ères et rivaux', 'BOOK_TUNE']];
const livreKeys = cat => cat === 'premiers' ? FIRSTS.map(f => f.id) : cat === 'moments' ? MOMENTS.filter(m => !m.first).map(m => m.id) : cat === 'recur' ? RECUR.map(r => r.id) : cat === 'reliques' ? Object.keys(BOOK_RELICS) : cat === 'pactes' ? Object.keys(BOOK_PACTS) : ['_'];
// l'aperçu d'un sticker, tel qu'il sera collé dans le Livre
const livreSticker = k => typeof lvSticker === 'function' ? `<div class="lvp-prev">${lvSticker({ id: k, night: 12, pts: (BOOK_STICKERS[k] || {}).pts }, 0, false)}</div>` : '';
const PW_HELP = () => ACH.filter(a => !a.active && !a.online).map(a => `<span><code>${a.id}</code> ${esc(a.pd)}</span>`).join('');
function livreDetail() {
  const st = ADMIN.livre, c = st.cat, k = st.key;
  if (c === 'premiers' || c === 'moments' || c === 'recur') {
    const m = MOM_BY[k] || {}, a = typeof ACH_BY !== 'undefined' ? ACH_BY[k] : null, rel = a ? RELICS_ERA.find(r => r.pw.includes(k)) : null;
    const how = c === 'premiers' ? `Les rivaux le prennent entre les nuits ${(m.win || [])[0]} et ${(m.win || [])[1]} (chacun tire sa nuit). Te faire devancer : ton sticker ne vaut plus qu’1 point.`
      : c === 'recur' ? `Gagné à chaque fois (jusqu’à ${m.cap} par chapitre).` : a ? `Un ancien haut fait. Son ancien pouvoir (« ${esc(a.pw)} ») ${rel ? `est devenu la relique d’ère « ${esc(rel.name)} »` : 'a disparu'}.` : 'Un moment unique.';
    return `<div class="cprev"><div class="lv-prev">${livreSticker(k)}</div><div class="cval"><b>${esc(m.d || '')}</b><small>${how}</small><small>La condition elle-même est écrite dans le jeu ; ici, on règle ce que le joueur lit et ce que ça rapporte.</small></div></div>
      <h3>Le sticker</h3><div class="afgrid">${fld('BOOK_STICKERS', k, 't', 'Titre', 'text')}${fld('BOOK_STICKERS', k, 'ico', 'Icône (émoji)', 'text')}${fld('BOOK_STICKERS', k, 'pts', 'Points pour la course du chapitre', 'num', { min: 0, max: 10 })}
      ${c === 'recur' ? fld('BOOK_STICKERS', k, 'cap', 'Plafond par chapitre', 'num', { min: 1, max: 9 }) : ''}${c === 'premiers' ? fld('BOOK_STICKERS', k, 'win', 'Les rivaux le prennent entre les nuits', 'pair', { ph: 'de, à' }) : ''}${fld('BOOK_STICKERS', k, 'd', 'Description (la condition, pour le joueur)', 'area')}</div>`;
  }
  if (c === 'reliques') {
    const r = BOOK_RELICS[k] || {};
    return `<div class="cprev"><div class="lv-gain" style="min-width:220px"><p>${iconize(esc(r.ico || '?'))} <b>${esc(r.name)}</b>, de l’Ère des Lanternes</p><p>${esc(r.d)}</p></div><div class="cval"><b>Une relique d’ère</b><small>Gagnée en âge d’or (deux en âge héroïque), au hasard parmi celles que le joueur n’a pas encore.</small></div></div>
      <h3>La relique</h3><div class="afgrid">${fld('BOOK_RELICS', k, 'name', 'Nom', 'text')}${fld('BOOK_RELICS', k, 'ico', 'Icône (émoji)', 'text')}${fld('BOOK_RELICS', k, 'd', 'Ce qu’elle fait (texte du joueur)', 'area')}${fld('BOOK_RELICS', k, 'pw', 'Pouvoirs (une clé par ligne)', 'lines', { rows: 2 })}</div>
      <p class="hint">Pouvoirs possibles :</p><div class="acthelp">${PW_HELP()}</div>`;
  }
  if (c === 'pactes') {
    const p = BOOK_PACTS[k] || {}, P = PACT_BY[k] || {};
    return `<div class="cprev"><div class="lv-gain dark" style="min-width:240px"><p>${iconize(esc(p.ico || '?'))} <b>${esc(p.name)}</b></p><p>${esc(p.d)}</p><p class="hint">coût : ${esc(p.cost)}</p></div><div class="cval"><b>Un pacte d’âge sombre</b><small>Trois pactes tirés au sort sont proposés après un âge sombre ; celui choisi vaut pour tout le chapitre suivant. Pouvoirs : ${(P.pw || []).join(', ')}.</small></div></div>
      <h3>Le pacte</h3><div class="afgrid">${fld('BOOK_PACTS', k, 'name', 'Nom', 'text')}${fld('BOOK_PACTS', k, 'ico', 'Icône (émoji)', 'text')}${fld('BOOK_PACTS', k, 'd', 'Ce qu’il donne (texte du joueur)', 'area')}${fld('BOOK_PACTS', k, 'cost', 'Ce qu’il coûte (texte du joueur)', 'text')}</div>
      <p class="hint">Le coût lui-même (notoriété, Menace, or…) est appliqué par le jeu ; garde le texte d’accord avec lui.</p>`;
  }
  const T = BOOK_TUNE, len = ((+T.lenMin || 8) + (+T.lenMax || 14)) / 2, fm = Array.isArray(T.form) ? (T.form[0] + T.form[1]) / 2 : 1;
  const at = race => Math.round(T.base * fm * (1 + race / 100) * len);
  return `<div class="cprev"><div class="cval"><b>La course d’un chapitre</b><small>Un rival marque ${T.base} point par nuit × sa forme du chapitre (tirée entre ${(T.form || [])[0]} et ${(T.form || [])[1]}) × (1 + sa course à la victoire ÷ 100), à ±${Math.round(T.spread * 50)} % près chaque nuit, plus 3 points par « premier du Val » qu’il prend.</small>
      <small>Sur un chapitre moyen (${len} nuits) : environ <b>${at(0)}</b> points au début de la partie, <b>${at(50)}</b> à mi-course, <b>${at(90)}</b> en fin de course. Repère : un joueur actif marque 15 à 30 points par chapitre.</small></div></div>
    <h3>Les rivaux</h3><div class="afgrid">${fld('BOOK_TUNE', '_', 'base', 'Points par nuit', 'num', { min: 0, step: .1 })}${fld('BOOK_TUNE', '_', 'form', 'Forme du chapitre (de, à)', 'pair', { ph: '0.6, 1.4' })}${fld('BOOK_TUNE', '_', 'spread', 'Hasard de chaque nuit (part)', 'num', { min: 0, max: 1, step: .05 })}</div>
    <h3>Les familles de stickers (points)</h3><div class="afgrid">${fld('BOOK_TUNE', '_', 'dyn.reve', 'Premier rêve exaucé d’une espèce', 'num', { min: 0 })}${fld('BOOK_TUNE', '_', 'dyn.donjon', 'Un donjon vaincu', 'num', { min: 0 })}${fld('BOOK_TUNE', '_', 'dyn.quete', 'Une quête du Val', 'num', { min: 0 })}${fld('BOOK_TUNE', '_', 'dyn.grandequete', 'La grande quête', 'num', { min: 0 })}</div>
    <h3>Les ères</h3><div class="afgrid">${fld('BOOK_TUNE', '_', 'lenMin', 'Durée la plus courte (nuits)', 'num', { min: 3, max: 30 })}${fld('BOOK_TUNE', '_', 'lenMax', 'Durée la plus longue (nuits)', 'num', { min: 3, max: 40 })}${fld('BOOK_TUNE', '_', 'names', 'Noms des ères (« l’Ère … » ; le premier sert au chapitre I)', 'lines', { rows: 8 })}</div>`;
}
ADMIN_TABS.livre = body => {
  const st = ADMIN.livre, cat = LIVRE_CATS.find(c => c[0] === st.cat) || LIVRE_CATS[0], keys = livreKeys(cat[0]);
  if (!keys.includes(st.key)) st.key = keys[0];
  const row = k => {
    const chg = OVR[cat[2]] && OVR[cat[2]][k] ? ' · modifié' : '';
    if (cat[2] === 'BOOK_STICKERS') { const m = BOOK_STICKERS[k]; return `<button type="button" class="rrow${k === st.key ? ' on' : ''}" data-act="livrePick" data-arg="${k}"><span class="emo cico">${iconize(esc(m.ico))}</span><span><b>${esc(m.t)}</b><small>+${m.pts}${m.cap ? ` · ${m.cap} par chapitre` : ''}${chg}</small></span></button>`; }
    const E = TABLES[cat[2]][k]; return `<button type="button" class="rrow${k === st.key ? ' on' : ''}" data-act="livrePick" data-arg="${k}"><span class="emo cico">${iconize(esc(E.ico))}</span><span><b>${esc(E.name)}</b><small>${esc(E.d).slice(0, 46)}${chg}</small></span></button>`;
  };
  const solo = cat[0] === 'reglages';
  body.innerHTML = `<div class="chips crawlcats">${LIVRE_CATS.map(([k, l]) => `<button type="button" class="pill${k === cat[0] ? ' on' : ''}" data-act="livreCat" data-arg="${k}">${esc(l)}</button>`).join('')}</div>
    <div class="adm-split${solo ? ' solo' : ''}">${solo ? '' : `<aside class="adm-list rooms">${keys.map(row).join('')}</aside>`}<div class="adm-detail"><div id="livreDetail">${livreDetail()}</div>
    <h3>Actions</h3><div class="btnrow"><button type="button" class="sbtn" data-act="livreReset">Réinitialiser cette fiche</button></div></div></div>`;
  // une valeur change : l'aperçu suit sans perdre le champ en cours
  ADMIN.onApply = () => { const d = document.getElementById('livreDetail'); if (!d) return; const prev = d.querySelector('.cprev'); if (!prev) return; const tmp = document.createElement('div'); tmp.innerHTML = livreDetail(); const np = tmp.querySelector('.cprev'); if (np) prev.replaceWith(np); };
};
Object.assign(ACTIONS, {
  livreCat: k => { ADMIN.livre.cat = k; ADMIN.livre.key = null; renderAdminTab(); },
  livrePick: k => { ADMIN.livre.key = k; renderAdminTab(); },
  livreReset: () => { const st = ADMIN.livre, cat = LIVRE_CATS.find(c => c[0] === st.cat); if (!cat) return; resetEntry(cat[2], cat[2] === 'BOOK_TUNE' ? '_' : st.key); renderAdminTab(); },
});
