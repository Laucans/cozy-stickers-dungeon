/* =========================================================
   Atelier du Maître : les expéditions en cartes
   Les cartes (château, espèces, base, décor) avec leur aperçu,
   les monstres, les élites et leurs capacités, les boss, les
   donjons et la difficulté générale. Mêmes réglages que le
   reste de l'atelier : enregistrés pour tous ou dans ce
   navigateur, chaque fiche se réinitialise.
   ========================================================= */
Object.assign(TABLES, { CASTLE_CARDS, CRAWL_SK, CARD_BASE, ENV_CARDS, CRAWL_EN, FOE_ELEM, ELITE_POW, CRAWL_DG });
Object.assign(BASE, structuredClone({ CASTLE_CARDS, CRAWL_SK, CARD_BASE, ENV_CARDS, CRAWL_EN, FOE_ELEM, ELITE_POW, CRAWL_DG, CRAWL_TUNE }));
// la difficulté générale : un seul objet, comme les réglages de rendu
const entryOfCrawl = entryOf; entryOf = function (t, k) { return t === 'CRAWL_TUNE' ? CRAWL_TUNE : entryOfCrawl(t, k); };
const baseOfCrawl = baseOf; baseOf = function (t, k) { return t === 'CRAWL_TUNE' ? BASE.CRAWL_TUNE : baseOfCrawl(t, k); };
const applyOverridesCrawl = applyOverrides;
applyOverrides = function (...a) { const r = applyOverridesCrawl(...a); Object.keys(CRAWL_TUNE).forEach(k => delete CRAWL_TUNE[k]); Object.assign(CRAWL_TUNE, clone(BASE.CRAWL_TUNE), clone((OVR.CRAWL_TUNE && OVR.CRAWL_TUNE._) || {})); return r; };
// deux champs de plus : une paire « valeur, tours » et une liste d'actions de monstre (une par ligne : « atk 4 », « multi 4 2 », « summon sq »)
const fldCrawl = fld;
fld = function (t, k, f, label, type = 'num', o = {}) {
  if (type !== 'pair' && type !== 'acts') return fldCrawl(t, k, f, label, type, o);
  const v = getv(t, k, f), b = `${t}|${k}|${f}|${type}`, chg = isChanged(t, k, f) ? ' chg' : '';
  const txt = type === 'pair' ? (v ? [v[0], v[1]].join(', ') : '') : (v || []).map(a => a.join(' ')).join('\n');
  const input = type === 'pair' ? `<input type="text" value="${esc(txt)}" placeholder="${esc(o.ph || 'valeur, tours')}" data-b="${b}">` : `<textarea rows="${o.rows || 4}" spellcheck="false" data-b="${b}">${esc(txt)}</textarea>`;
  return `<label class="af${chg}${type === 'acts' ? ' wide' : ''}"><span>${esc(label)}</span>${input}</label>`;
};
const parseFieldCrawl = parseField;
parseField = function (el, type) {
  if (type === 'pair') { const n = el.value.split(/[,; ]+/).filter(Boolean).map(Number); return n.length === 2 && n.every(x => !isNaN(x)) ? n : undefined; }
  if (type === 'acts') {
    const L = el.value.split('\n').map(l => l.trim()).filter(Boolean).map(l => l.split(/\s+/).map(x => /^-?\d+(\.\d+)?$/.test(x) ? +x : x));
    if (L.length) return L;
    const [t, k, f] = (el.dataset.b || '').split('|'), b = baseOf(t, k); return b && b[f] ? clone(b[f]) : undefined;   // vide : on revient aux actions d'origine (un monstre sans action planterait)
  }
  return parseFieldCrawl(el, type);
};

ATABS.splice(2, 0, ['crawl', 'Expéditions', '🃏']);
ADMIN.crawl = { cat: 'castle', key: null };
const CRAWL_CATS = [['castle', 'Cartes du château', 'CASTLE_CARDS'], ['sp', 'Cartes des espèces', 'CRAWL_SK'], ['base', 'Cartes de base', 'CARD_BASE'], ['env', 'Cartes du décor', 'ENV_CARDS'],
  ['foe', 'Monstres', 'CRAWL_EN'], ['elite', 'Élites', 'CRAWL_EN'], ['boss', 'Boss', 'CRAWL_EN'], ['pow', 'Capacités', 'ELITE_POW'], ['dg', 'Donjons', 'CRAWL_DG'], ['tune', 'Difficulté', 'CRAWL_TUNE']];
const crawlAdmKeys = cat => cat === 'castle' ? Object.keys(CASTLE_CARDS) : cat === 'sp' ? Object.keys(CRAWL_SK) : cat === 'base' ? Object.keys(CARD_BASE) : cat === 'env' ? Object.keys(ENV_CARDS)
  : cat === 'foe' ? Object.keys(CRAWL_EN).filter(k => !CRAWL_EN[k].elite && !CRAWL_EN[k].boss) : cat === 'elite' ? Object.keys(CRAWL_EN).filter(k => CRAWL_EN[k].elite) : cat === 'boss' ? Object.keys(CRAWL_EN).filter(k => CRAWL_EN[k].boss)
  : cat === 'pow' ? Object.keys(ELITE_POW) : cat === 'dg' ? Object.keys(CRAWL_DG) : ['_'];
const CARD_SRC = { castle: 'castle', sp: 'sp', base: 'base', env: 'env' };
const TGT_OPTS = [['enemy', 'Un ennemi'], ['allfoes', 'Tous les ennemis'], ['rnd', 'Ennemis au hasard'], ['ally', 'Une alliée'], ['allies', 'Toute l’équipe'], ['self', 'Elle-même'], ['none', 'Aucune cible'], ['ko', 'Une alliée K.O.']];
const elOpts = none => [...(none ? [['', none]] : []), ...Object.keys(ELEM).map(k => [k, ELEM[k][0] + ' ' + ELEM[k][1]])];
// le vocabulaire des actions de monstre
const ACT_HELP = { atk: 'attaque une créature (dégâts)', multi: 'plusieurs coups (dégâts, nombre)', aoe: 'frappe toute l’équipe', block: 'se protège (parade)', heal: 'soigne un allié', buff: '+ force',
  fear: 'peur sur une créature', fearall: 'peur sur toute l’équipe', poison: 'empoisonne', poisonall: 'empoisonne toute l’équipe', toxic: 'poison qui monte', stun: 'sonne une créature', steal: 'vole de l’or',
  summon: 'appelle un monstre (sa clé)', spawn: 'fait naître un monstre (sa clé)', raise: 'relève un mort (sa clé)', drain: 'vole des PV', ...(typeof ELITE_ACT !== 'undefined' ? ELITE_ACT : {}), ...(typeof LEG_ACT !== 'undefined' ? LEG_ACT : {}) };
const actHelpHTML = () => `<p class="hint">Une action par ligne : la clé, puis ses nombres (« atk 4 », « multi 4 2 », « summon sq »). Elles tournent en boucle, dans l’ordre.</p><div class="acthelp">${Object.entries(ACT_HELP).map(([k, d]) => `<span><code>${esc(k)}</code> ${esc(d)}</span>`).join('')}</div>`;
// les PV et le bonus de frappe d'un monstre selon le niveau d'expédition et l'étage (la même formule que le jeu)
const foeAt = (k, lvl, fl) => { const E = CRAWL_EN[k], T = CRAWL_TUNE, L = lvl - 1, F = E.boss ? 0 : fl - 1; return { hp: Math.round(E.hp * (1 + T.hpL * L) * (1 + T.hpF * F) * (E.boss ? T.boss : 1)), plus: Math.round(T.dmgL * L + T.dmgF * F) }; };
const foePic = (E, big) => E.sp && CHAR[E.sp] ? `<img alt="" class="${big ? 'cfoebig' : 'th'}" src="${thumb('char', E.sp, true)}">` : `<span class="emo ${big ? 'cfoebig' : ''}">${esc(E.emo || '❔')}</span>`;
const srcName = k => FURN[k] ? FURN[k].name : DEFS[k] ? DEFS[k].name : '?';

function crawlCardDetail(cat, k) {
  const T = CRAWL_CATS.find(c => c[0] === cat)[2], D = TABLES[T][k], src = CARD_SRC[cat];
  const prev = up => { try { return cardHTML(cardVM(null, newCard(src, k, null, up), 0, null)); } catch (e) { return `<p class="no">Aperçu impossible : ${esc(e.message)}</p>`; } };
  const v = cardValue(D);
  let h = `<div class="cprev"><div>${prev(false)}<small>normale</small></div><div>${prev(true)}<small>améliorée ✦</small></div><div class="cval"><b>Valeur estimée : ${v.toFixed(1)}</b><small>dégâts, parade, soin… divisés par le coût (+0,7). Repères : Frappe ${cardValue(CARD_BASE.frappe).toFixed(1)}, Parade ${cardValue(CARD_BASE.parade).toFixed(1)}.</small>`;
  if (cat === 'castle') h += `<small>Vient de : ${(D.from || []).map(f => `<b>${esc(srcName(f))}</b> (${srcPrice(f)}${srcTier(f) ? ', palier ' + srcTier(f) : ''}${fineSrc(f) ? ' : de qualité, donne la carte ✦' : ''})`).join(' · ') || 'aucun meuble'}</small>`;
  h += `</div></div>`;
  h += `<h3>La carte</h3><div class="afgrid">${fld(T, k, 'name', 'Nom', 'text')}${fld(T, k, 'ico', 'Icône (émoji)', 'text')}${fld(T, k, 'cost', 'Coût en énergie', 'num', { min: 0, max: 5 })}${fld(T, k, 'tgt', 'Cible', 'sel', { opts: TGT_OPTS })}${fld(T, k, 'el', 'Élément des dégâts', 'sel', { opts: elOpts('Aucun (celui de la créature)') })}${fld(T, k, 'exhaust', 'Une fois par combat', 'bool')}</div>
    <h3>Attaque</h3><div class="afgrid">${fld(T, k, 'dmg', 'Dégâts', 'num', { min: 0 })}${fld(T, k, 'hits', 'Nombre de coups', 'num', { min: 1, max: 9 })}${fld(T, k, 'atk', '× force de la créature', 'num', { min: 0, max: 3 })}${fld(T, k, 'splash', 'Éclaboussure (un autre ennemi)', 'num', { min: 0 })}${fld(T, k, 'pierce', 'Traverse la parade', 'bool')}${fld(T, k, 'poison', 'Poison', 'num', { min: 0 })}${fld(T, k, 'stun', 'Sonne (actions perdues)', 'num', { min: 0, max: 3 })}${fld(T, k, 'weak', 'Affaiblit (valeur, tours)', 'pair')}${fld(T, k, 'confuse', 'Confusion', 'num', { min: 0, max: 3 })}${fld(T, k, 'bribe', 'Pot-de-vin (or)', 'num', { min: 0 })}</div>
    <h3>Défense et soin</h3><div class="afgrid">${fld(T, k, 'blk', 'Parade', 'num', { min: 0 })}${fld(T, k, 'grd', '+ moitié de la garde', 'bool')}${fld(T, k, 'heal', 'Soin', 'num', { min: 0 })}${fld(T, k, 'calm', 'Calme (peur en moins)', 'num', { min: 0 })}${fld(T, k, 'cure', 'Guérit le poison', 'num', { min: 0, max: 1 })}${fld(T, k, 'buff', 'Force pour le combat', 'num', { min: 0 })}${fld(T, k, 'revive', 'Relève une K.O. (part des PV)', 'num', { min: 0, max: 1, step: .05 })}${fld(T, k, 'evade', 'Esquive', 'bool')}${fld(T, k, 'decoy', 'Leurre', 'bool')}${fld(T, k, 'taunt', 'Attire les coups', 'bool')}${fld(T, k, 'trap', 'Piège tendu', 'num', { min: 0 })}</div>
    <h3>Ressources</h3><div class="afgrid">${fld(T, k, 'draw', 'Pioche', 'num', { min: 0, max: 5 })}${fld(T, k, 'nrg', 'Énergie', 'num', { min: 0, max: 3 })}${fld(T, k, 'fear', 'Peur pour l’équipe (le prix)', 'num', { min: 0 })}${fld(T, k, 'note', 'Note (effet spécial)', 'text')}</div>`;
  if (cat === 'castle') h += `<h3>Meubles qui la donnent</h3><div class="afgrid">${fld(T, k, 'from', 'Clés des meubles ou pièges (une par ligne)', 'lines', { rows: 3 })}</div>`;
  return h;
}
function crawlFoeDetail(cat, k) {
  const E = CRAWL_EN[k], lv = [[1, 1], [2, 2], [3, 3], [5, 3]].map(([l, f]) => { const a = foeAt(k, l, f); return `<span>niv. ${l}${E.boss ? '' : ', étage ' + f} : <b>${a.hp} PV</b>, coups +${a.plus}</span>`; }).join('');
  let h = `<div class="cprev foe"><div class="cfoe">${foePic(E, true)}<b>${esc(E.name)}</b></div><div class="cval"><b>${E.hp} PV de base</b><small class="lvls">${lv}</small><small>Dans : ${Object.keys(CRAWL_DG).filter(d => [...CRAWL_DG[d].regs, CRAWL_DG[d].elite, CRAWL_DG[d].boss].includes(k)).map(d => esc(d)).join(', ') || 'aucun donjon'}</small></div></div>`;
  h += `<h3>Le monstre</h3><div class="afgrid">${fld('CRAWL_EN', k, 'name', 'Nom', 'text')}${fld('CRAWL_EN', k, 'emo', 'Émoji (sans sprite)', 'text')}${fld('CRAWL_EN', k, 'sp', 'Sprite (espèce)', 'sel', { opts: optsOf(CHAR, 'Aucun (émoji)') })}${fld('CRAWL_EN', k, 'hp', 'PV de base', 'num', { min: 1 })}${cat === 'foe' ? fld('CRAWL_EN', k, 'rise', 'Se relève avec (PV)', 'num', { min: 0 }) : ''}${cat === 'elite' ? fld('CRAWL_EN', k, 'pow', 'Capacité', 'sel', { opts: optsOf(ELITE_POW, 'Aucune') }) : ''}${cat === 'boss' ? fld('CRAWL_EN', k, 'p2', 'Fureur à mi-vie', 'sel', { opts: [['', 'Aucune'], ...Object.keys(BOSS_P2).map(x => [x, x + ' : ' + BOSS_P2[x].slice(0, 60)])] }) : ''}</div>
    <h3>Ses actions</h3><div class="afgrid">${fld('CRAWL_EN', k, 'acts', 'Répertoire', 'acts')}${cat === 'boss' ? fld('CRAWL_EN', k, 'leg', 'Actions légendaires (une par tour, en plus)', 'acts', { rows: 2 }) + fld('CRAWL_EN', k, 'rage', 'Répertoire de fureur (à mi-vie)', 'acts') : ''}</div>${actHelpHTML()}
    <h3>Éléments</h3><div class="afgrid">${FOE_ELEM[k] ? `${fld('FOE_ELEM', k, 'el', 'Ses coups', 'sel', { opts: elOpts('Aucun') })}${fld('FOE_ELEM', k, 'vuln', 'Vulnérable à (×2)', 'lines', { rows: 2 })}${fld('FOE_ELEM', k, 'res', 'Résiste à (×½)', 'lines', { rows: 2 })}${fld('FOE_ELEM', k, 'imm', 'Immunisé contre', 'lines', { rows: 2 })}` : '<p class="hint">Pas d’éléments pour ce monstre.</p>'}</div>
    <p class="hint">Éléments possibles : ${Object.keys(ELEM).join(', ')}.</p>`;
  return h;
}
function crawlPowDetail(k) {
  const P = ELITE_POW[k];
  return `<div class="cprev"><div class="cval"><b>${esc(P.ico)} ${esc(P.name)}</b><small>${esc(powDesc(k))}</small><small>Portée par : ${Object.keys(CRAWL_EN).filter(x => CRAWL_EN[x].pow === k).map(x => esc(CRAWL_EN[x].name)).join(', ') || 'aucun monstre'}</small></div></div>
    <h3>La capacité</h3><div class="afgrid">${fld('ELITE_POW', k, 'name', 'Nom', 'text')}${fld('ELITE_POW', k, 'ico', 'Icône (émoji)', 'text')}${fld('ELITE_POW', k, 'v', 'Valeur', 'num', { min: 0 })}${P.buff != null ? fld('ELITE_POW', k, 'buff', 'Force gagnée', 'num', { min: 0 }) : ''}${P.max != null ? fld('ELITE_POW', k, 'max', 'Force au plus', 'num', { min: 0 }) : ''}${fld('ELITE_POW', k, 'desc', 'Description ({v}, {buff}, {max} : remplacés par leur valeur)', 'area', { rows: 2 })}</div>
    <p class="hint">L’effet lui-même est écrit dans le jeu ; ici, on règle ses chiffres et ce que les joueurs lisent.</p>`;
}
function crawlDgDetail(k) {
  const G = CRAWL_DG[k], en = s => Object.keys(CRAWL_EN).filter(x => s(CRAWL_EN[x])).map(x => [x, CRAWL_EN[x].name]);
  return `<div class="cprev"><div class="cval"><b>${esc(G.emo || '🏰')} ${esc(k)}</b><small>${esc(G.desc || '')}</small><small>Monstres : ${G.regs.map(x => esc((CRAWL_EN[x] || {}).name || x)).join(', ')} · élite : ${esc((CRAWL_EN[G.elite] || {}).name || '?')} · boss : ${esc((CRAWL_EN[G.boss] || {}).name || '?')}</small></div></div>
    <h3>Le donjon</h3><div class="afgrid">${fld('CRAWL_DG', k, 'regs', 'Monstres ordinaires (une clé par ligne)', 'lines', { rows: 4 })}${fld('CRAWL_DG', k, 'elite', 'Élite', 'sel', { opts: en(E => E.elite) })}${fld('CRAWL_DG', k, 'boss', 'Boss', 'sel', { opts: en(E => E.boss) })}${fld('CRAWL_DG', k, 'relic', 'Relique du boss', 'sel', { opts: optsOf(RELICS) })}${fld('CRAWL_DG', k, 'emo', 'Émoji', 'text')}${fld('CRAWL_DG', k, 'desc', 'Description', 'area', { rows: 2 })}</div>
    <p class="hint">Clés des monstres : ${Object.keys(CRAWL_EN).filter(x => !CRAWL_EN[x].elite && !CRAWL_EN[x].boss).join(', ')}.</p>`;
}
function crawlTuneDetail() {
  const rows = [[1, 1], [1, 3], [2, 2], [3, 3], [5, 3]].map(([l, f]) => { const T = CRAWL_TUNE, L = l - 1, F = f - 1; return `<tr><td>niv. ${l}</td><td>étage ${f}</td><td>×${((1 + T.hpL * L) * (1 + T.hpF * F)).toFixed(2)}</td><td>+${Math.round(T.dmgL * L + T.dmgF * F)}</td></tr>`; }).join('');
  return `<div class="cprev"><div class="cval"><b>Le niveau d’une expédition</b><small>Il vient de tes 4 meilleures créatures (PV × force) : (somme − ${CRAWL_TUNE.p0}) ÷ ${CRAWL_TUNE.pk} + 1. Ton château est au niveau ${typeof S !== 'undefined' && S && S.creatures ? crawlLevel() : '?'}.</small>
    <table class="ctune"><tr><th></th><th></th><th>PV des monstres</th><th>Leurs coups</th></tr>${rows}</table></div></div>
    <h3>Difficulté</h3><div class="afgrid">${fld('CRAWL_TUNE', '_', 'hpL', 'PV en plus par niveau (part)', 'num', { min: 0, step: .05 })}${fld('CRAWL_TUNE', '_', 'dmgL', 'Dégâts en plus par niveau', 'num', { min: 0, step: .1 })}${fld('CRAWL_TUNE', '_', 'hpF', 'PV en plus par étage (part)', 'num', { min: 0, step: .05 })}${fld('CRAWL_TUNE', '_', 'dmgF', 'Dégâts en plus par étage', 'num', { min: 0, step: .5 })}${fld('CRAWL_TUNE', '_', 'boss', 'PV des boss (×)', 'num', { min: .5, step: .05 })}${fld('CRAWL_TUNE', '_', 'p0', 'Force d’équipe du niveau 1', 'num', { min: 0, step: 10 })}${fld('CRAWL_TUNE', '_', 'pk', 'Force d’équipe par niveau', 'num', { min: 10, step: 10 })}</div>`;
}
function crawlAdmDetail() {
  const st = ADMIN.crawl, c = st.cat, k = st.key;
  if (CARD_SRC[c]) return crawlCardDetail(c, k);
  if (c === 'foe' || c === 'elite' || c === 'boss') return crawlFoeDetail(c, k);
  if (c === 'pow') return crawlPowDetail(k);
  if (c === 'dg') return crawlDgDetail(k);
  return crawlTuneDetail();
}
ADMIN_TABS.crawl = body => {
  const st = ADMIN.crawl, cat = CRAWL_CATS.find(c => c[0] === st.cat) || CRAWL_CATS[0], T = cat[2], keys = crawlAdmKeys(cat[0]);
  if (!keys.includes(st.key)) st.key = keys[0];
  const row = k => {
    const E = TABLES[T] ? TABLES[T][k] : null; if (!E) return '';
    const chg = OVR[T] && OVR[T][k] ? ' · modifié' : '';
    if (CARD_SRC[cat[0]]) return `<button type="button" class="rrow${k === st.key ? ' on' : ''}" data-act="crawlPick" data-arg="${k}"><span class="emo cico">${esc(E.ico || '🃏')}</span><span><b>${esc(E.name)}</b><small>coût ${E.cost || 0} · valeur ${cardValue(E).toFixed(1)}${chg}</small></span></button>`;
    if (T === 'CRAWL_EN') return `<button type="button" class="rrow${k === st.key ? ' on' : ''}" data-act="crawlPick" data-arg="${k}">${foePic(E)}<span><b>${esc(E.name)}</b><small>${E.hp} PV · ${E.acts.length} actions${chg}</small></span></button>`;
    if (T === 'ELITE_POW') return `<button type="button" class="rrow${k === st.key ? ' on' : ''}" data-act="crawlPick" data-arg="${k}"><span class="emo cico">${esc(E.ico)}</span><span><b>${esc(E.name)}</b><small>${esc(powDesc(k)).slice(0, 48)}${chg}</small></span></button>`;
    return `<button type="button" class="rrow${k === st.key ? ' on' : ''}" data-act="crawlPick" data-arg="${k}"><span class="emo cico">${esc(E.emo || '🏰')}</span><span><b>${esc(k)}</b><small>${esc((CRAWL_EN[E.boss] || {}).name || '')}${chg}</small></span></button>`;
  };
  const list = cat[0] === 'tune' ? '' : `<aside class="adm-list rooms">${keys.map(row).join('')}</aside>`;
  body.innerHTML = `<div class="chips crawlcats">${CRAWL_CATS.map(([k, l]) => `<button type="button" class="pill${k === cat[0] ? ' on' : ''}" data-act="crawlCat" data-arg="${k}">${esc(l)}</button>`).join('')}</div>
    <div class="adm-split${cat[0] === 'tune' ? ' solo' : ''}">${list}<div class="adm-detail"><div id="crawlDetail">${crawlAdmDetail()}</div>
    <h3>Actions</h3><div class="btnrow"><button type="button" class="sbtn" data-act="crawlReset">Réinitialiser cette fiche</button></div></div></div>`;
  // une valeur change : l'aperçu (la carte, les PV par niveau…) suit sans perdre le champ en cours
  ADMIN.onApply = () => { const d = document.getElementById('crawlDetail'); if (!d) return; const prev = d.querySelector('.cprev'); if (!prev) return; const tmp = document.createElement('div'); tmp.innerHTML = crawlAdmDetail(); const np = tmp.querySelector('.cprev'); if (np) prev.replaceWith(np); };
};
Object.assign(ACTIONS, {
  crawlCat: k => { ADMIN.crawl.cat = k; ADMIN.crawl.key = null; renderAdminTab(); },
  crawlPick: k => { ADMIN.crawl.key = k; renderAdminTab(); },
  crawlReset: () => { const st = ADMIN.crawl, cat = CRAWL_CATS.find(c => c[0] === st.cat); if (!cat) return; resetEntry(cat[2], cat[2] === 'CRAWL_TUNE' ? '_' : st.key); if (cat[2] === 'CRAWL_EN' && FOE_ELEM[st.key]) resetEntry('FOE_ELEM', st.key); },
});
