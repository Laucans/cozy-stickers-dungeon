/* =========================================================
   Le Livre du Maître, dessiné : on le feuillette
   Une couverture de cuir qui s'ouvre, une double page de papier
   (une seule au téléphone), des pages qui tournent. Le livre
   raconte la partie dans l'ordre : page de titre, puis pour
   chaque ère une page de chapitre enluminée, ses moments en
   grands stickers collés (deux par page, avec leur illustration
   et leur légende), les rivaux en pense-bêtes dans la marge, et
   la page de fin du chapitre (le sceau de l'âge, la relique, le
   pacte). Au bout du livre : des pages blanches et des
   emplacements vides, sans dire comment les remplir.
   Et des familles de stickers à découvrir : le premier rêve
   secret exaucé de chaque espèce, chaque donjon vaincu, chaque
   quête du Val accomplie.
   ========================================================= */
// un sticker de famille : il porte lui-même son titre, son icône et son illustration
function bookEarnDyn(id, data, lines) {
  if (!S || !S.started) return null; const B = bookState(), c = bookCur(); if (!B || B.got[id]) return null;
  B.got[id] = S.night; const x = bookAdd(c, { id, night: S.night, pts: data.pts, t: data.t, ico: data.ico, cat: data.cat, sub: data.sub, art: data.art, d: data.d });
  const t = `Nouveau sticker dans le Livre : ${data.t} (+${data.pts}).`; addLog(t, 'ev'); if (lines) lines.push(['📖', t, 'good']);
  return x;
}
// le premier rêve secret exaucé d'une espèce
const secretsCheckBook = secretsCheck;
secretsCheck = function (lines) {
  const before = new Set(S.creatures.filter(c => { try { return ensureSecret(c).done; } catch (e) { return false; } }).map(c => c.id));
  const r = secretsCheckBook(lines);
  try { S.creatures.forEach(c => { if (before.has(c.id)) return; const d = ensureSecret(c); if (!d.done) return; const sp = SPECIES[c.sp];
    bookEarnDyn('reve:' + c.sp, { t: `Le rêve d’un ${sp.name.toLowerCase()}`, ico: '💭', cat: 'Rêves', pts: BOOK_DYN.reve, d: `Réaliser pour la première fois le rêve secret d’un·e ${sp.name.toLowerCase()}.`, sub: `${c.name} rêvait ${typeof dreamOf === 'function' ? dreamOf(d.label) : 'en secret'}`, art: { k: 'sp', key: c.sp } }, lines); }); } catch (e) { console.error(e); }
  return r;
};
// chaque quête du Val accomplie
const questCompleteBook = questComplete;
questComplete = function (q, out) {
  const r = questCompleteBook(q, out);
  try { const D = q.def || {}; bookEarnDyn('quete:' + q.id + ':' + (D.title || ''), { t: D.title || 'Une quête', ico: D.main ? '🗡️' : '📜', cat: 'Quêtes', pts: D.main ? BOOK_DYN.grandequete : BOOK_DYN.quete, d: D.main ? 'Mener la grande quête du Val jusqu’au bout.' : 'Accomplir cette quête du journal.', sub: D.giver ? `pour ${D.giver}` : '' }, out); } catch (e) { console.error(e); }
  return r;
};
// chaque donjon vaincu (son boss terrassé), et de quoi illustrer les stickers d'expédition
const crawlApplyBookUI = crawlApply;
crawlApply = function (R, team, lines) {
  try { if (S && S.book && R) { S.book.lastParty = (R.party || []).map(p => p.sp).filter(Boolean); if (R.done === 'boss' && CRAWL_DG[R.dg]) S.book.lastBoss = CRAWL_DG[R.dg].boss; } } catch (e) {}
  const r = crawlApplyBookUI(R, team, lines);
  try { if (R && R.path && R.path.includes('boss') && CRAWL_DG[R.dg]) { const bk = CRAWL_DG[R.dg].boss, E = CRAWL_EN[bk] || {}; bookEarnDyn('boss:' + bk, { t: `Face à ${E.name || 'un boss'}`, ico: '⚔️', cat: 'Donjons', pts: 1, d: `Affronter ${E.name || 'ce boss'} au bout d’une expédition.`, sub: R.done === 'boss' ? 'et il·elle est tombé·e' : R.done === 'wipe' ? 'l’équipe a mordu la poussière' : 'on a préféré s’enfuir', art: E.sp ? { k: 'char', key: E.sp } : null }, lines); } } catch (e) { console.error(e); }
  try { if (R && R.done === 'boss' && CRAWL_DG[R.dg]) { const E = CRAWL_EN[CRAWL_DG[R.dg].boss] || {}, key = S.raid && S.raid.target, place = (RAIDS[key] || {}).name || (typeof racer === 'function' && racer(R.dg) ? racer(R.dg).name : R.dg);
    bookEarnDyn('donjon:' + R.dg, { t: `Vainqueur de ${place}`, ico: CRAWL_DG[R.dg].emo || '🏰', cat: 'Donjons', pts: BOOK_DYN.donjon, d: `Vaincre le boss de ${place}.`, sub: E.name ? `${E.name} est tombé·e` : '', art: E.sp ? { k: 'char', key: E.sp } : null }, lines); } } catch (e) { console.error(e); }
  return r;
};
// le contexte d'un sticker (qui, quoi) pour l'illustrer et le légender
function bookCtx(id) {
  try {
    const B = S.book || {}, home = S.creatures.filter(c => !isOut(c)), newest = home.slice().sort((a, b) => (b.joined || 0) - (a.joined || 0))[0], star = home.slice().sort((a, b) => ((b.legend || b.evo) ? 9 : 0) + (b.lvl || 1) - ((a.legend || a.evo) ? 9 : 0) - (a.lvl || 1))[0];
    const spOf = c => c ? { art: { k: 'sp', key: c.sp }, sub: `${c.name}, ${SPECIES[c.sp].name.toLowerCase()}` } : {};
    if (id === 'f_dragon') { const c = home.find(x => x.sp === 'dragonnet'); return c ? spOf(c) : { art: { k: 'sp', key: 'dragonnet' } }; }
    if (id === 'f_rare') { const c = home.find(x => SPECIES[x.sp] && SPECIES[x.sp].rare); return spOf(c); }
    if (['r_album', 'menagerie', 'album16', 'album24', 'accueil', 'pop30', 'aimant'].includes(id)) return spOf(newest);
    if (['legende', 'r_legende', 'chouchou', 'fidele', 'epopee', 'calins', 'conteur'].includes(id)) return spOf(star);
    if (['f_boss', 'r_boss', 'boss3'].includes(id) && B.lastBoss) { const E = CRAWL_EN[B.lastBoss] || {}; return { art: E.sp ? { k: 'char', key: E.sp } : null, sub: E.name || '' }; }
    if (['propre', 'r_expe'].includes(id) && B.lastParty && B.lastParty.length) return { art: { k: 'sp', key: B.lastParty[0] }, sub: id === 'propre' ? 'Toute l’équipe rentre debout' : '' };
    if (['r_invasion', 'repousse', 'rempart', 'forteresse'].includes(id)) return { art: { k: 'hero', key: pick(['barbare', 'paladin', 'mage', 'voleuse', 'elfe']) }, sub: 'La bande détale !' };
    if (['r_palier', 'f_palier1', 'f_palier2', 'f_palier3', 'palier1', 'palier2'].includes(id)) return { art: { k: 'room', key: 'coeur' }, sub: `Palier ${S.tier}` };
    if (['r_coup', 'coup'].includes(id)) return { sub: 'Le rival rentre bredouille' };
  } catch (e) {}
  return {};
}

/* ---------- les pages ---------- */
const LVCOL = { 'Premiers du Val': '#e9b949', 'Bâtisseur': '#c98b4a', 'Éleveur': '#7fbf5a', 'Missions': '#b48ad9', 'Stratège': '#e06a5a', 'Château': '#6aa0e0', 'Profondeurs': '#4fb3a9', 'Val': '#e9894a', 'Val des Maîtres': '#d77fa8', 'Rêves': '#c49bff', 'Donjons': '#8f6ad0', 'Quêtes': '#d9a441' };
const lvMeta = x => MOM_BY[x.id] || { t: x.t || x.id, ico: x.ico || '✨', cat: x.cat };
// les dessins du jeu (meubles, pièces) pour les stickers qui n'ont pas de créature ou de héros à montrer
const ART_OF = { pierre: ['furn', 'caisse'], archi: ['room', 'atelier'], deco: ['furn', 'tableau'], cosy: ['furn', 'candelabre'], accueil: ['furn', 'paillasse'], conteur: ['furn', 'theiere'], zen: ['furn', 'theiere'], rempart: ['furn', 'armure'], forteresse: ['furn', 'armure'], pillard: ['furn', 'tasdor'], tresor: ['furn', 'tasdor'], crit: ['furn', 'cristal'], crit3: ['furn', 'cristal'], carto: ['furn', 'longuevue'], collec: ['furn', 'epeefaux'], nuit20: ['furn', 'citrouille'], grandesalle: ['room', 'taverne'], amb30: ['furn', 'candelabre'], f_ambiance: ['furn', 'candelabre'], deco40: ['furn', 'tapis'], fete: ['furn', 'chaudron'], r_fete: ['furn', 'chaudron'], quete: ['furn', 'caisse'], r_quete: ['furn', 'caisse'], f_merveille: ['room', 'coeur'], r_merveille: ['room', 'coeur'], r_artefact: ['furn', 'epeefaux'], r_envies: ['furn', 'plante'], etages: ['room', 'tour'] };
function lvArt(x, m) {
  const a = x.art || (ART_OF[x.id] ? { k: ART_OF[x.id][0], key: ART_OF[x.id][1] } : null);
  try { if (a && a.k === 'furn' && FURN[a.key]) return `<img alt="" src="${thumb('furn', a.key, true)}">`; } catch (e) {}
  try { if (a && a.k === 'sp' && SPECIES[a.key]) return `<img alt="" src="${portrait(a.key)}">`; if (a && a.k === 'char') return `<img alt="" src="${thumb('char', a.key, true)}">`; if (a && a.k === 'hero') return `<img alt="" src="${thumb('hero', a.key, true)}">`; if (a && a.k === 'room' && ROOMS[a.key]) return `<img alt="" class="room" src="${roomThumb(a.key)}">`; } catch (e) {}
  return `<span class="lvs-emo">${iconize(esc(m.ico || '✨'))}</span>`;
}
// la rareté d'un sticker : commun, rare (reflet holographique), légendaire (or et éclats)
const lvRarity = (x, m) => { const id = x.id || '', p = m.pts || x.pts || 1; return /^(vic:|heroique|or:|legende:)/.test(id) || p >= 4 ? 'leg' : /^(elite:.*:5|heros:.*:10|merveille:.*:5|donjon:|relique:|inv:redoutable|inv:croisade|boss:)/.test(id) || p >= 3 ? 'rare' : 'com'; };
const LV_SHAPES = ['ecu', 'rond', 'etoile', 'blason'];
function lvSticker(x, i, fresh, free, J) {
  const m = lvMeta(x), col = m.cat ? (LVCOL[m.cat] || '#a08a70') : '#8fa6b8', P = free && x.pos, rar = lvRarity(x, m), shape = LV_SHAPES[[...(x.id || 'x')].reduce((a, ch) => a + ch.charCodeAt(0), 0) % LV_SHAPES.length];
  const spark = rar === 'leg' ? '<i class="lvx-spark s1">✦</i><i class="lvx-spark s2">✦</i><i class="lvx-spark s3">✧</i>' : '';
  return `<figure class="lvs ${rar}${fresh ? ' fresh' : ''}${P ? ' free' : ''}" style="--rot:${P ? x.pos.r : J ? J.r : [-4, 3, -2, 4, -3][i % 5]}deg; --col:${col}; --d:${J && J.d != null ? J.d : .25 + i * .25}s${P ? `; left:${x.pos.x}%; top:${x.pos.y}%` : ''}${J ? `; translate:${J.dx}px ${J.dy}px` : ''}"><div class="lvs-hold"><div class="lvs-die"><div class="lvx-cut"><div class="lvx-badge ${shape}"><i class="lvx-rays"></i><i class="lvx-foil"></i></div><div class="lvs-art">${lvArt(x, m)}</div><div class="lvx-ribbon"><span>${esc(m.t)}</span></div></div>${spark}</div>${x.n > 1 ? `<span class="lvs-count">×${x.n}</span>` : ''}</div>
    <figcaption><span class="lvs-night">Nuit ${x.night}${x.n > 1 && x.last !== x.night ? ` à ${x.last}` : ''}${rar !== 'com' ? ` · <b class="lvx-rar ${rar}">${rar === 'leg' ? 'légendaire' : 'rare'}</b>` : ''}</span>${x.sub ? `<small>${esc(x.sub)}</small>` : ''}${x.after ? `<small class="lvs-after">après ${esc(racer(x.after).master)}</small>` : ''}${(x.d || m.d) ? `<small class="lvs-how">🔓 ${esc(x.d || m.d)}</small>` : ''}</figcaption></figure>`;
}
const lvRelic = (id, i, fresh) => { const r = RELIC_BY[id]; return r ? `<figure class="lvs relic${fresh ? ' fresh' : ''}" style="--rot:${i ? 3 : -3}deg; --col:#e9b949; --d:${.4 + i * .3}s"><div class="lvs-hold"><div class="lvs-die"><div class="lvs-art">${lvArt({ id: 'relique:' + id }, r)}</div></div></div><figcaption><span class="lvs-night">Relique d’ère</span><b>${esc(r.name)}</b><small>${esc(r.d)}</small></figcaption></figure>` : ''; };
// combien de stickers tiennent sur une page : dépend de la taille de la page, donc de l'écran
function lvLayout(single, W, H) {
  if (!W) { W = single ? Math.min(470, innerWidth * .94) : Math.min(1100, innerWidth * .96) / 2; H = W * 1.36; }
  const fit = w => { const cols = Math.max(1, Math.floor((W - (single ? 36 : 56)) / (w + 26))), rows = Math.max(1, Math.floor((H - 58) / (w + 86))); return { cols, rows, cap: Math.min(12, cols * rows), w }; };
  let w = Math.round(Math.max(110, Math.min(200, innerHeight * .21))), L = fit(w);
  while (L.cap < 2 && w > 104) { w -= 8; L = fit(w); }   // au moins deux par page quand c'est possible
  return L;
}
// chaque sticker a sa petite inclinaison et son décalage, toujours les mêmes
const lvJit = (x, d) => { const h = [...String(x.id || 'x')].reduce((a, ch) => (a * 31 + ch.charCodeAt(0)) >>> 0, 7); return { r: (h % 11) - 5, dx: ((h >> 4) % 17) - 8, dy: ((h >> 9) % 13) - 6, d }; };
// des stickers retirés du jeu, qu'on ne montre plus dans les parties déjà commencées (« Nouvelle page d'album », le premier d'une espèce du départ)
const lvHidden = id => id === 'r_album' || (/^espece:/.test(id || '') && ((S && S.book && S.book.startSp) || ['diablotin']).includes(id.slice(7)));
function livrePages(fresh, L, nu) {
  L = L || lvLayout(innerWidth < 760); nu = nu || new Set();
  const B = bookState(), P = [], isNew = x => nu.has(x) || x.night > fresh;
  P.push({ k: 'garde', html: '<div class="lvp garde"></div>' });
  const stickers = B.ch.reduce((a, c) => a + c.mine.filter(x => !lvHidden(x.id)).length, 0);
  P.push({ k: 'titre', html: `<div class="lvp titre"><div class="lv-frame"><div class="lv-orn">❦</div><h1>Le Livre du Maître</h1><p class="lv-castle">${esc(S.name)}</p><div class="lv-orn">❧</div><p class="lv-hand">Commencé à la nuit 1${B.ch.length > 1 ? `, ${B.ch.length} chapitres` : ''}${stickers ? `, ${stickers} sticker${stickers > 1 ? 's' : ''} collé${stickers > 1 ? 's' : ''}` : ''}.</p><p class="lv-hand small">Chaque ère est un chapitre. Finis-le devant les rivaux : âge d’or et relique.</p></div></div>` });
  const pro = (B.prologue || []).filter(x => !lvHidden(x.id));
  for (let i = 0; i < pro.length; i += L.cap) P.push({ k: 'prologue', html: `<div class="lvp st grid" style="--cols:${L.cols}; --rows:${L.rows}; --stw:${L.w}px"><div class="lv-runhead">Prologue</div>${pro.slice(i, i + L.cap).map((x, j) => lvSticker(x, j, false, false, lvJit(x))).join('')}</div>` });
  B.ch.forEach(c => {
    const live = c === bookCur(), seal = c.age ? `<div class="lv-seal ${c.age}">${lvAgeArt(c)}<b>${AGES[c.age].name}</b></div>` : '';
    P.push({ k: 'chap', n: c.n, html: `<div class="lvp chap"><div class="lv-orn">❦</div><div class="lv-chapn">Chapitre ${ROMAN(c.n)}</div>${lvEraSticker(c.name, c.n)}<p class="lv-hand">Nuits ${c.from} à ${c.to}</p>${seal}${live && !c.mine.length ? '<p class="lv-hand small">Les pages de ce chapitre attendent leurs premiers stickers…</p>' : ''}</div>` });
    const all = c.mine.filter(x => x.stuck !== false && !lvHidden(x.id)).map((x, o) => [x, o]).sort((a, b) => a[0].night - b[0].night || a[1] - b[1]).map(a => a[0]);
    for (let i = 0, pgi = 0; i < all.length; i += L.cap, pgi++) { const on = all.slice(i, i + L.cap); let k = 0;
      P.push({ k: 'st', n: c.n, pg: pgi, on, html: `<div class="lvp st grid" style="--cols:${L.cols}; --rows:${L.rows}; --stw:${L.w}px"><div class="lv-runhead">L’Ère ${esc(c.name)}</div>${on.map((x, q) => { const nw = isNew(x); return lvSticker(x, q, nw, false, lvJit(x, nw ? (L.d0 || .25) + (k++) * .5 : null)); }).join('')}</div>` }); }
    const notes = (c.rmom || []).map((x, j) => `<div class="lv-note" style="--rot:${j % 2 ? 4 : -5}deg">Nuit ${x.night} · ${esc(racer(x.who).master)} t’a devancé : « ${esc((MOM_BY[x.id] || {}).t || '')} »</div>`).join('');
    const mine = chapScore(c), rank = [['moi', mine], ...Object.entries(c.rivals)].sort((a, b) => b[1] - a[1]);
    const race = `<ol class="lv-race">${rank.map(([w, p]) => `<li class="${w === 'moi' ? 'me' : ''}">${w === 'moi' ? esc(S.name) : `${racer(w).emo} ${esc(racer(w).name)}`}<span>${Math.round(p)}</span></li>`).join('')}</ol>`;
    if (live) P.push({ k: 'suite', n: c.n, html: `<div class="lvp fin"><div class="lv-runhead">L’Ère ${esc(c.name)}</div><p class="lv-hand big">La suite s’écrit encore…</p><p class="lv-hand">Encore ${Math.max(0, c.to - S.night)} nuit${c.to - S.night > 1 ? 's' : ''} avant la fin du chapitre. La course :</p>${race}<p class="lv-hand small">Premier : âge d’or et une relique d’ère. Dernier : âge sombre, et un pacte à choisir.</p>${notes ? `<div class="lv-notes">${notes}</div>` : ''}</div>` });
    else {
      const pact = c.age === 'sombre' && c.choices && !c.pact ? `<div class="lv-pacts"><p class="lv-hand">Un pacte pour traverser l’âge sombre (tout le chapitre suivant) :</p>${c.choices.map(id => { const Pp = PACT_BY[id]; return `<button type="button" class="lv-pact" data-pact="${id}"><span class="lv-wax">${lvArt({ id: 'pacte:' + id }, Pp)}</span><span><b>${esc(Pp.name)}</b><small>${esc(Pp.d)}</small><small class="cost">en échange : ${esc(Pp.cost)}</small></span></button>`; }).join('')}</div>`
        : c.pact ? `<div class="lv-pacts"><button type="button" class="lv-pact done" disabled><span class="lv-wax">${lvArt({ id: 'pacte:' + c.pact }, PACT_BY[c.pact])}</span><span><b>${esc(PACT_BY[c.pact].name)}</b><small>${esc(PACT_BY[c.pact].d)}</small></span></button></div>` : '';
      P.push({ k: 'fin', n: c.n, html: `<div class="lvp fin"><div class="lv-runhead">L’Ère ${esc(c.name)}</div><p class="lv-hand big">Fin du chapitre ${ROMAN(c.n)}</p>${seal}${race}${notes ? `<div class="lv-notes">${notes}</div>` : ''}${(c.relics || []).map((id, i) => lvRelic(id, i, c.end > fresh)).join('')}${pact}</div>` });
    }
  });
  // au bout du livre : des pages blanches, des emplacements vides, sans dire comment les remplir
  const offline = typeof netUsable === 'function' && !netUsable();
  const left = MOMENTS.filter(m => !B.got[m.id] && !(m.online && offline) && !(m.first && B.firsts[m.id] && B.firsts[m.id] !== 'moi')).length + SPECIES_ORDER.filter(sp => !B.got['reve:' + sp]).length + Object.keys(CRAWL_DG).filter(d => !B.got['donjon:' + d]).length;
  const slots = n => Array.from({ length: n }, (_, i) => `<div class="lv-slot" style="--rot:${[-3, 2, -1, 3, -2, 1][i % 6]}deg"><span>?</span></div>`).join('');
  P.push({ k: 'blanc', html: `<div class="lvp blanc"><p class="lv-hand big">Les pages suivantes sont blanches…</p><div class="lv-slots">${slots(6)}</div><p class="lv-hand">Encore ${left} stickers à découvrir dans cette partie, et des quêtes à écrire. Qui sait ce qui les fera apparaître ?</p><button type="button" class="sbtn small" data-allstk="1">📚 Le Livre des stickers (toutes tes parties)</button></div>` });
  P.push({ k: 'reliques', html: `<div class="lvp blanc"><p class="lv-hand big">Le coffret des reliques</p>${B.relics.length ? `<div class="lv-relics">${B.relics.map((r, i) => lvRelic(r.id, i, false)).join('')}</div>` : ''}<div class="lv-slots small">${slots(Math.min(6, RELICS_ERA.length - B.relics.length))}</div><p class="lv-hand small">${B.relics.length} relique${B.relics.length > 1 ? 's' : ''} sur ${RELICS_ERA.length}.${B.pact ? ` Pacte en cours : ${esc(PACT_BY[B.pact.id].name)}.` : ''}</p></div>` });
  if (P.length % 2) P.push({ k: 'blanc2', html: '<div class="lvp blanc"></div>' });
  P.push({ k: 'garde', html: '<div class="lvp garde"></div>' });
  return P;
}
/* ---------- le livre ---------- */
let LV = null;
const lvPending = () => { const c = bookCur(); return c ? c.mine.filter(x => x.stuck === false) : []; };
function openBook(n, where) {
  const B = bookState(); if (!B) return;
  const fresh = B.readNight == null ? 0 : B.readNight, single = innerWidth < 760;
  // les stickers gagnés depuis la dernière fois se collent d'eux-mêmes, à la suite du chapitre
  const nu = new Set(lvPending()); nu.forEach(x => { x.stuck = true; x.glued = S.night; });
  let L = lvLayout(single); L.d0 = 1.05; let pages = livrePages(fresh, L, nu);
  const pick0 = () => {
    if (nu.size) { const i = pages.findIndex(p => p.k === 'st' && p.on.some(x => nu.has(x))); if (i >= 0) return i; }
    const c = B.ch.find(x => x.n === n);
    if (c && (where === 'fin' || (c.age === 'sombre' && c.choices && !c.pact))) return pages.findIndex(p => p.k === 'fin' && p.n === n);
    if (n != null) return pages.findIndex(p => p.k === 'chap' && p.n === n);
    const live = pages.map((p, i) => [p, i]).filter(([p]) => p.n === bookCur().n && (p.k === 'st' || p.k === 'suite')); return live.length ? live[live.length - 1][1] : 1;
  };
  let at = pick0(); if (at < 0) at = 1; clearTimeout(LVA.t);
  const m = openModal(`<div class="lvbook${single ? ' single' : ''}"><div class="lv-spread"></div><div class="lv-cover"><div class="lv-cover-in"><span>📖</span><b>Le Livre du Maître</b><small>${esc(S.name)}</small></div></div><div class="lv-ribbon"></div></div>
    <div class="lv-bar"><button type="button" class="lv-arrow" data-lvgo="-1" aria-label="Page précédente">◀</button><span class="lv-folio"></span><button type="button" class="lv-arrow" data-lvgo="1" aria-label="Page suivante">▶</button></div>`, { label: 'Le Livre du Maître', cls: 'livrebook', wide: true });
  LV = { idx: single ? at : at - (at % 2), single, m, anim: false, fresh };
  const book = m.querySelector('.lvbook'), spread = m.querySelector('.lv-spread'), folio = m.querySelector('.lv-folio');
  const pg = i => `<div class="lvpg-in">${(pages[i] || { html: '<div class="lvp blanc"></div>' }).html}</div>`;
  const last = () => LV.single ? pages.length - 1 : pages.length - 2;
  const render = () => {
    spread.innerHTML = LV.single ? `<div class="lv-pg one">${pg(LV.idx)}</div>` : `<div class="lv-pg l">${pg(LV.idx)}</div><div class="lv-pg r">${pg(LV.idx + 1)}</div>`;
    m.querySelector('[data-lvgo="-1"]').disabled = LV.idx <= 0; m.querySelector('[data-lvgo="1"]').disabled = LV.idx >= last();
    folio.textContent = LV.single ? `page ${LV.idx + 1} sur ${pages.length}` : `pages ${LV.idx + 1}–${LV.idx + 2} sur ${pages.length}`;
  };
  const rebuild = () => { L.d0 = .25; pages = livrePages(LV.fresh, L); LV.idx = Math.max(0, Math.min(LV.idx, last())); render(); };
  const flip = (dir, to) => {
    if (LV.anim) return; const step = LV.single ? 1 : 2, nx = to != null ? to : LV.idx + dir * step; if (nx < 0 || nx > last() || nx === LV.idx) return;
    LV.anim = true; sfx('tick');
    const leaf = document.createElement('div');
    if (LV.single) {
      if (dir > 0) { leaf.className = 'lv-leaf one fwd'; leaf.innerHTML = `<div class="lv-face front">${pg(LV.idx)}</div><div class="lv-face back"><div class="lvpg-in"><div class="lvp blanc"></div></div></div>`; spread.querySelector('.lv-pg').innerHTML = pg(nx); }
      else { leaf.className = 'lv-leaf one bwd'; leaf.innerHTML = `<div class="lv-face front">${pg(nx)}</div><div class="lv-face back"><div class="lvpg-in"><div class="lvp blanc"></div></div></div>`; }
    } else if (dir > 0) { leaf.className = 'lv-leaf fwd'; leaf.innerHTML = `<div class="lv-face front">${pg(LV.idx + 1)}</div><div class="lv-face back">${pg(nx)}</div>`; spread.querySelector('.lv-pg.r').innerHTML = pg(nx + 1); }
    else { leaf.className = 'lv-leaf bwd'; leaf.innerHTML = `<div class="lv-face front">${pg(LV.idx)}</div><div class="lv-face back">${pg(nx + 1)}</div>`; spread.querySelector('.lv-pg.l').innerHTML = pg(nx); }
    spread.appendChild(leaf); requestAnimationFrame(() => requestAnimationFrame(() => leaf.classList.add('go')));
    setTimeout(() => { LV.idx = nx; render(); LV.anim = false; }, 680);
  };
  render();
  // la vraie taille de la page (sous la couverture encore fermée) : on remet en page si elle diffère de l'estimation
  { const pe = spread.querySelector('.lvp'); if (pe && pe.clientWidth) { const L2 = lvLayout(LV.single, pe.clientWidth, pe.clientHeight); if (L2.cap !== L.cap || L2.cols !== L.cols || L2.w !== L.w) { L = Object.assign(L2, { d0: L.d0 }); pages = livrePages(fresh, L, nu); at = pick0(); if (at < 0) at = 1; LV.idx = LV.single ? at : at - (at % 2); render(); } } }
  // le bruit des stickers qui se collent, un par un, une fois la couverture ouverte
  [...nu].slice(0, 6).forEach((x, k) => setTimeout(() => { if (m.isConnected) sfx(k ? 'pop' : 'chime'); }, (L.d0 + k * .5 + .35) * 1000));
  // la couverture s'ouvre, puis on note ce qui a été lu
  requestAnimationFrame(() => requestAnimationFrame(() => book.classList.add('opened')));
  setTimeout(() => { const cv = m.querySelector('.lv-cover'); if (cv) cv.remove(); }, 1000);
  B.readNight = S.night; save();
  m.addEventListener('click', e => {
    const g = e.target.closest('[data-lvgo]'); if (g) { flip(+g.dataset.lvgo); return; }
    if (e.target.closest('[data-allstk]')) { closeModal(true); if (typeof openStickerBook === 'function') openStickerBook(); return; }
    const p = e.target.closest('[data-pact]');
    if (p) { if (!run('pact', { id: p.dataset.pact })) return; sfx('chime'); toast(`${PACT_BY[p.dataset.pact].ico} Pacte : ${PACT_BY[p.dataset.pact].name}.`); afterChange(); rebuild(); return; }
    // toucher le bord d'une page la tourne
    const r = e.target.closest('.lv-pg'); if (!r || e.target.closest('button')) return; const box = r.getBoundingClientRect(), xx = (e.clientX - box.left) / box.width;
    if (LV.single) { if (xx > .7) flip(1); else if (xx < .3) flip(-1); } else if (r.classList.contains('r') && xx > .65) flip(1); else if (r.classList.contains('l') && xx < .35) flip(-1);
  });
  // glisser du doigt sur le livre
  let sx = null; spread.addEventListener('pointerdown', e => { sx = e.clientX; }); spread.addEventListener('pointerup', e => { if (sx == null) return; const dx = e.clientX - sx; sx = null; if (Math.abs(dx) > 50) flip(dx < 0 ? 1 : -1); });
  const key = e => { if (!m.isConnected) { removeEventListener('keydown', key); return; } if (e.key === 'ArrowRight') { e.preventDefault(); flip(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); flip(-1); } };
  addEventListener('keydown', key);
}
openAch = function () { openBook(); };
/* ---------- le livre s'ouvre de lui-même quand un sticker est gagné, dès que le joueur a les mains libres ---------- */
const LVA = { t: 0 };
// une nouvelle espèce attend d'être présentée (p37) : son sticker ne doit pas la dévoiler avant
const lvArrivalPending = () => !!(S && S.spotted && S.creatures.some(o => !S.spotted.includes(o.sp) && !isOut(o) && !injured(o)));
const lvBusy = () => !S || !S.started || lvArrivalPending() || (typeof V !== 'undefined' && V.spotOn) || $('#modalRoot').children.length || UI.hand || UI.busy || UI.dragging || document.querySelector('.cpage') || (typeof MAPV !== 'undefined' && MAPV.open) || (typeof ADMIN !== 'undefined' && ADMIN.open) || (typeof VISIT !== 'undefined' && VISIT) || (typeof COOP !== 'undefined' && COOP.role === 'guest') || document.hidden;
function lvAutoSoon(ms = 900) { if (typeof headless === 'function' && headless()) return; clearTimeout(LVA.t); LVA.t = setTimeout(lvAutoTry, ms); }
function lvAutoTry() { if (!S || !S.book || !lvPending().length) return; if (lvBusy()) { LVA.t = setTimeout(lvAutoTry, 1200); return; } openBook(); }
const bookAddLv = bookAdd;
bookAdd = function (c, x) { const r = bookAddLv.apply(this, arguments); try { if (r && r.stuck === false) lvAutoSoon(); } catch (e) {} return r; };
const closeModalLv = closeModal;
closeModal = function () { const r = closeModalLv.apply(this, arguments); try { if (S && S.book && lvPending().length) lvAutoSoon(700); } catch (e) {} return r; };
