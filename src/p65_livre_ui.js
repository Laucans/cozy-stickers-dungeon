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
function lvArt(x, m) {
  const a = x.art;
  try { if (a && a.k === 'sp' && SPECIES[a.key]) return `<img alt="" src="${portrait(a.key)}">`; if (a && a.k === 'char') return `<img alt="" src="${thumb('char', a.key, true)}">`; if (a && a.k === 'hero') return `<img alt="" src="${thumb('hero', a.key, true)}">`; if (a && a.k === 'room') return `<img alt="" class="room" src="${roomThumb(a.key)}">`; } catch (e) {}
  return `<span class="lvs-emo">${iconize(esc(m.ico || '✨'))}</span>`;
}
function lvSticker(x, i, fresh, free) {
  const m = lvMeta(x), col = m.cat ? (LVCOL[m.cat] || '#a08a70') : '#8fa6b8', P = free && x.pos;
  return `<figure class="lvs${fresh ? ' fresh' : ''}${P ? ' free' : ''}" style="--rot:${P ? x.pos.r : [-4, 3, -2, 4, -3][i % 5]}deg; --col:${col}; --d:${.25 + i * .25}s${P ? `; left:${x.pos.x}%; top:${x.pos.y}%` : ''}"><div class="lvs-hold"><div class="lvs-die"><div class="lvs-art">${lvArt(x, m)}</div><i class="lvs-shine"></i></div><span class="lvs-tape a"></span><span class="lvs-tape b"></span>${x.n > 1 ? `<span class="lvs-count">×${x.n}</span>` : ''}</div>
    <figcaption><span class="lvs-night">Nuit ${x.night}${x.n > 1 && x.last !== x.night ? ` à ${x.last}` : ''}</span><b>${esc(m.t)}</b>${x.sub ? `<small>${esc(x.sub)}</small>` : ''}${x.after ? `<small class="lvs-after">après ${esc(racer(x.after).master)}</small>` : ''}${(x.d || m.d) ? `<small class="lvs-how">🔓 ${esc(x.d || m.d)}</small>` : ''}</figcaption></figure>`;
}
const lvRelic = (id, i, fresh) => { const r = RELIC_BY[id]; return r ? `<figure class="lvs relic${fresh ? ' fresh' : ''}" style="--rot:${i ? 3 : -3}deg; --col:#e9b949; --d:${.4 + i * .3}s"><div class="lvs-hold"><div class="lvs-die"><div class="lvs-art"><span class="lvs-emo">${iconize(esc(r.ico))}</span></div><i class="lvs-shine"></i></div><span class="lvs-tape a"></span><span class="lvs-tape b"></span></div><figcaption><span class="lvs-night">Relique d’ère</span><b>${esc(r.name)}</b><small>${esc(r.d)}</small></figcaption></figure>` : ''; };
function livrePages(fresh) {
  const B = bookState(), P = [], isNew = x => x.night > fresh;
  P.push({ k: 'garde', html: '<div class="lvp garde"></div>' });
  const stickers = B.ch.reduce((a, c) => a + c.mine.length, 0);
  P.push({ k: 'titre', html: `<div class="lvp titre"><div class="lv-frame"><div class="lv-orn">❦</div><h1>Le Livre du Maître</h1><p class="lv-castle">${esc(S.name)}</p><div class="lv-orn">❧</div><p class="lv-hand">Commencé à la nuit 1${B.ch.length > 1 ? `, ${B.ch.length} chapitres` : ''}${stickers ? `, ${stickers} sticker${stickers > 1 ? 's' : ''} collé${stickers > 1 ? 's' : ''}` : ''}.</p><p class="lv-hand small">Chaque ère est un chapitre. Finis-le devant les rivaux : âge d’or et relique.</p></div></div>` });
  if (B.prologue && B.prologue.length) for (let i = 0; i < B.prologue.length; i += 2) P.push({ k: 'prologue', html: `<div class="lvp st"><div class="lv-runhead">Prologue</div>${B.prologue.slice(i, i + 2).map((x, j) => lvSticker(x, i + j, false)).join('')}</div>` });
  B.ch.forEach(c => {
    const live = c === bookCur(), seal = c.age ? `<div class="lv-seal ${c.age}"><span>${AGES[c.age].ico}</span><b>${AGES[c.age].name}</b></div>` : '';
    P.push({ k: 'chap', n: c.n, html: `<div class="lvp chap"><div class="lv-orn">❦</div><div class="lv-chapn">Chapitre ${ROMAN(c.n)}</div><h2>L’Ère ${esc(c.name)}</h2><p class="lv-hand">Nuits ${c.from} à ${c.to}</p><div class="lv-orn">❧</div>${seal}${live && !c.mine.length ? '<p class="lv-hand small">Les pages de ce chapitre attendent leurs premiers stickers…</p>' : ''}</div>` });
    const stuck = c.mine.filter(x => x.stuck !== false && x.pos), pend = c.mine.filter(x => x.stuck === false), maxPg = stuck.reduce((a, x) => Math.max(a, x.pos.pg), -1);
    const nPg = maxPg + 1 + (live && pend.length ? 1 : 0);
    for (let pgi = 0; pgi < nPg; pgi++) { const on = stuck.filter(x => x.pos.pg === pgi).sort((a, b) => a.night - b.night);
      P.push({ k: 'st', n: c.n, pg: pgi, html: `<div class="lvp st free${on.length < 3 && live ? ' room' : ''}" data-ch="${c.n}" data-pg="${pgi}"><div class="lv-runhead">L’Ère ${esc(c.name)}</div>${on.map((x, q) => lvSticker(x, q, isNew(x), true)).join('')}${!on.length ? '<p class="lv-hand small lv-here">Colle un sticker ici</p>' : ''}</div>` }); }
    const notes = (c.rmom || []).map((x, j) => `<div class="lv-note" style="--rot:${j % 2 ? 4 : -5}deg">Nuit ${x.night} · ${esc(racer(x.who).master)} t’a devancé : « ${esc((MOM_BY[x.id] || {}).t || '')} »</div>`).join('');
    const mine = chapScore(c), rank = [['moi', mine], ...Object.entries(c.rivals)].sort((a, b) => b[1] - a[1]);
    const race = `<ol class="lv-race">${rank.map(([w, p]) => `<li class="${w === 'moi' ? 'me' : ''}">${w === 'moi' ? esc(S.name) : `${racer(w).emo} ${esc(racer(w).name)}`}<span>${Math.round(p)}</span></li>`).join('')}</ol>`;
    if (live) P.push({ k: 'suite', n: c.n, html: `<div class="lvp fin"><div class="lv-runhead">L’Ère ${esc(c.name)}</div><p class="lv-hand big">La suite s’écrit encore…</p><p class="lv-hand">Encore ${Math.max(0, c.to - S.night)} nuit${c.to - S.night > 1 ? 's' : ''} avant la fin du chapitre. La course :</p>${race}<p class="lv-hand small">Premier : âge d’or et une relique d’ère. Dernier : âge sombre, et un pacte à choisir.</p>${notes ? `<div class="lv-notes">${notes}</div>` : ''}</div>` });
    else {
      const pact = c.age === 'sombre' && c.choices && !c.pact ? `<div class="lv-pacts"><p class="lv-hand">Un pacte pour traverser l’âge sombre (tout le chapitre suivant) :</p>${c.choices.map(id => { const Pp = PACT_BY[id]; return `<button type="button" class="lv-pact" data-pact="${id}"><span class="lv-wax">${iconize(esc(Pp.ico))}</span><span><b>${esc(Pp.name)}</b><small>${esc(Pp.d)}</small><small class="cost">en échange : ${esc(Pp.cost)}</small></span></button>`; }).join('')}</div>`
        : c.pact ? `<div class="lv-pacts"><button type="button" class="lv-pact done" disabled><span class="lv-wax">${iconize(esc(PACT_BY[c.pact].ico))}</span><span><b>${esc(PACT_BY[c.pact].name)}</b><small>${esc(PACT_BY[c.pact].d)}</small></span></button></div>` : '';
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
  let pages = livrePages(fresh);
  const pick0 = () => {
    if (lvPending().length) { const k = pages.map((p, i) => [p, i]).filter(([p]) => p.k === 'st' && p.n === bookCur().n); if (k.length) return k[k.length - 1][1]; }
    const c = B.ch.find(x => x.n === n);
    if (c && (where === 'fin' || (c.age === 'sombre' && c.choices && !c.pact))) return pages.findIndex(p => p.k === 'fin' && p.n === n);
    if (n != null) return pages.findIndex(p => p.k === 'chap' && p.n === n);
    const live = pages.map((p, i) => [p, i]).filter(([p]) => p.n === bookCur().n && (p.k === 'st' || p.k === 'suite')); return live.length ? live[live.length - 1][1] : 1;
  };
  let at = pick0(); if (at < 0) at = 1;
  const m = openModal(`<div class="lvbook${single ? ' single' : ''}"><div class="lv-spread"></div><div class="lv-cover"><div class="lv-cover-in"><span>📖</span><b>Le Livre du Maître</b><small>${esc(S.name)}</small></div></div><div class="lv-ribbon"></div></div>
    <div class="lv-planche" hidden></div>
    <div class="lv-bar"><button type="button" class="lv-arrow" data-lvgo="-1" aria-label="Page précédente">◀</button><span class="lv-folio"></span><button type="button" class="lv-arrow" data-lvgo="1" aria-label="Page suivante">▶</button></div>`, { label: 'Le Livre du Maître', cls: 'livrebook', wide: true });
  LV = { idx: single ? at : at - (at % 2), single, m, anim: false, fresh };
  const book = m.querySelector('.lvbook'), spread = m.querySelector('.lv-spread'), folio = m.querySelector('.lv-folio'), planche = m.querySelector('.lv-planche');
  const pg = i => `<div class="lvpg-in">${(pages[i] || { html: '<div class="lvp blanc"></div>' }).html}</div>`;
  const last = () => LV.single ? pages.length - 1 : pages.length - 2;
  const drawPlanche = () => {
    const pend = lvPending(); planche.hidden = !pend.length; m.classList.toggle('withsheet', !!pend.length); if (!pend.length) return;
    planche.innerHTML = `<p class="lv-hand">${pend.length > 1 ? `${pend.length} stickers à coller` : 'Un sticker à coller'} : fais-${pend.length > 1 ? 'les' : 'le'} glisser sur une page de l’ère en cours, ou touche-${pend.length > 1 ? 'les' : 'le'}.</p><div class="lv-sheet">${pend.map((x, i) => `<div class="lv-peel" data-peel="${i}">${lvSticker(x, i, false)}</div>`).join('')}</div>${pend.length > 2 ? '<button type="button" class="sbtn small" data-lvall="1">Tout coller</button>' : ''}`;
  };
  const render = () => {
    spread.innerHTML = LV.single ? `<div class="lv-pg one">${pg(LV.idx)}</div>` : `<div class="lv-pg l">${pg(LV.idx)}</div><div class="lv-pg r">${pg(LV.idx + 1)}</div>`;
    m.querySelector('[data-lvgo="-1"]').disabled = LV.idx <= 0; m.querySelector('[data-lvgo="1"]').disabled = LV.idx >= last();
    folio.textContent = LV.single ? `page ${LV.idx + 1} sur ${pages.length}` : `pages ${LV.idx + 1}–${LV.idx + 2} sur ${pages.length}`;
    drawPlanche();
  };
  const rebuild = (focusPg) => { pages = livrePages(LV.fresh); if (focusPg != null) { const i = pages.findIndex(p => p.k === 'st' && p.n === bookCur().n && p.pg === focusPg); if (i >= 0) LV.idx = LV.single ? i : i - (i % 2); } LV.idx = Math.max(0, Math.min(LV.idx, last())); render(); };
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
  // coller : là où on lâche le sticker (une page de l'ère en cours, trois stickers au plus), ou à la prochaine place libre
  const stickAt = (x, page, cx, cy) => {
    const c = bookCur(), pgi = +page.dataset.pg, on = c.mine.filter(y => y.stuck !== false && y.pos && y.pos.pg === pgi).length;
    if (+page.dataset.ch !== c.n) { toast(`Ce sticker va dans le chapitre en cours : l’Ère ${c.name}.`, true); return false; }
    if (on >= 3) { toast('Cette page est pleine : tourne la page.', true); return false; }
    const r = page.getBoundingClientRect(), px = Math.max(24, Math.min(76, (cx - r.left) / r.width * 100)), py = Math.max(24, Math.min(78, (cy - r.top) / r.height * 100));
    x.pos = { pg: pgi, x: Math.round(px), y: Math.round(py), r: Math.round(Math.random() * 10 - 5) }; x.stuck = true; x.glued = S.night; return true;
  };
  const stuckFx = x => { sfx('pop'); save(); LV.fresh = Math.min(LV.fresh, x.night - 1); rebuild(x.pos.pg); setTimeout(() => sfx('chime'), 250); };
  const autoStick = x => { bookPlace(bookCur(), x); stuckFx(x); };
  let drag = null;
  planche.addEventListener('pointerdown', e => {
    const el = e.target.closest('[data-peel]'); if (!el || LV.anim) return; e.preventDefault();
    const x = lvPending()[+el.dataset.peel]; if (!x) return; const ghost = el.cloneNode(true); ghost.className = 'lv-ghost'; document.body.appendChild(ghost);
    drag = { x, el, ghost, sx: e.clientX, sy: e.clientY, moved: false }; el.classList.add('lifting');
    const mv = ev => { if (!drag) return; if (Math.hypot(ev.clientX - drag.sx, ev.clientY - drag.sy) > 8) drag.moved = true; ghost.style.left = ev.clientX + 'px'; ghost.style.top = ev.clientY + 'px'; const pgEl = document.elementsFromPoint(ev.clientX, ev.clientY).find(n => n.classList && n.classList.contains('lvp') && n.classList.contains('st')); spread.querySelectorAll('.lvp.hover').forEach(n => n.classList.remove('hover')); if (pgEl) pgEl.classList.add('hover'); };
    const up = ev => { removeEventListener('pointermove', mv); removeEventListener('pointerup', up); removeEventListener('pointercancel', up); const d = drag; drag = null; ghost.remove(); d.el.classList.remove('lifting'); spread.querySelectorAll('.lvp.hover').forEach(n => n.classList.remove('hover'));
      if (!d.moved) { autoStick(d.x); return; }   // un simple toucher : à la prochaine place libre
      const pgEl = document.elementsFromPoint(ev.clientX, ev.clientY).find(n => n.classList && n.classList.contains('lvp') && n.classList.contains('st') && !n.closest('.lv-leaf'));
      if (pgEl && stickAt(d.x, pgEl, ev.clientX, ev.clientY)) stuckFx(d.x); else if (!pgEl) sfx('tick'); };
    mv(e); addEventListener('pointermove', mv); addEventListener('pointerup', up); addEventListener('pointercancel', up);
  });
  render();
  // la couverture s'ouvre, puis on note ce qui a été lu
  requestAnimationFrame(() => requestAnimationFrame(() => book.classList.add('opened')));
  setTimeout(() => { const cv = m.querySelector('.lv-cover'); if (cv) cv.remove(); }, 1000);
  B.readNight = S.night; save();
  m.addEventListener('click', e => {
    const g = e.target.closest('[data-lvgo]'); if (g) { flip(+g.dataset.lvgo); return; }
    if (e.target.closest('[data-allstk]')) { closeModal(true); if (typeof openStickerBook === 'function') openStickerBook(); return; }
    if (e.target.closest('[data-lvall]')) { const c = bookCur(); lvPending().forEach(x => bookPlace(c, x)); sfx('pop'); save(); rebuild(); toast('📖 Tous les stickers sont collés.'); return; }
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
