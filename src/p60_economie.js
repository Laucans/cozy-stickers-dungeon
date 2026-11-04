/* =========================================================
   Dépenser son or et son bois
   - Les Merveilles : quatre grands ouvrages à niveaux, de plus
     en plus chers, sans fin. Remparts (des jetons du Cœur),
     Cave à festins (de l'ambiance), Galerie des statues (du
     rayonnement), Archives (de l'expérience chaque nuit).
   - La Grande fête : de l'or et du bois contre de la bonne
     humeur et de l'épanouissement pour quelques nuits.
   Les deux vivent dans la fiche du Cœur, avec les grands
   chantiers ; une pastille les rappelle quand l'or dort.
   ========================================================= */
const WONDERS = {
  remparts: { ico: 'shield', name: 'Les Remparts', desc: L => `+${Math.ceil(L / 2)} jeton${Math.ceil(L / 2) > 1 ? 's' : ''} du Cœur à chaque invasion (un de plus tous les deux niveaux)`, base: { g: 10, s: 60 }, k: 1.7 },
  cave:     { ico: 'mug', name: 'La Cave à festins', desc: L => `+${3 * L} d’ambiance`, base: { g: 15, s: 55 }, k: 1.6 },
  galerie:  { ico: 'statue', name: 'La Galerie des statues', desc: L => `+${8 * L} de rayonnement`, base: { g: 30, s: 50 }, k: 1.6 },
  archives: { ico: 'book', name: 'Les Archives', desc: L => `${L} créature${L > 1 ? 's' : ''} gagne${L > 1 ? 'nt' : ''} 1 d’expérience chaque nuit`, base: { g: 20, s: 55 }, k: 1.6 },
};
const wonderLv = k => ((S && S.wonders) || {})[k] || 0;
const wonderCost = k => { const W = WONDERS[k], m = Math.pow(W.k, wonderLv(k)); return { g: Math.round(W.base.g * m), s: Math.round(W.base.s * m) }; };
CMD.wonder = a => {
  const W = WONDERS[a && a.id]; if (!W) return 'Merveille inconnue'; const cost = wonderCost(a.id); if (!canAfford(cost)) return 'Pas assez';
  pay(cost); S.wonders = S.wonders || {}; S.wonders[a.id] = wonderLv(a.id) + 1; S.stats.wonders = (S.stats.wonders || 0) + 1;
  addLog(`${W.name} : niveau ${S.wonders[a.id]}.`, 'good'); return null;
};
// la Grande fête : une fois toutes les 8 nuits
const FETE_EVERY = 8, FETE_LAST = 5;
const feteCost = () => { const n = S.creatures.filter(c => !isOut(c)).length; return { g: 10 + n, s: 12 + Math.round(1.5 * n) }; };   // or et bois ; le bois grandit plus vite avec le château (c'est lui qui s'entasse)
const feteWhy = () => S.feteAt && S.night - S.feteAt < FETE_EVERY ? `La dernière fête est trop récente (encore ${FETE_EVERY - (S.night - S.feteAt)} nuit${FETE_EVERY - (S.night - S.feteAt) > 1 ? 's' : ''})` : !canAfford(feteCost()) ? 'Pas assez' : '';
CMD.fete = () => { const w = feteWhy(); if (w) return w; pay(feteCost()); S.feteAt = S.night; const L = S.creatures.filter(c => !isOut(c)); L.forEach(c => { c.mood = clamp(c.mood + 1, 0, 5); }); S.hype += Math.ceil(L.length / 3); addLog(`Grande fête au château : ${L.length} créatures en liesse.`, 'good'); return null; };
// les effets
const heartTokensW = heartTokens;
heartTokens = function () { return heartTokensW() + Math.ceil(wonderLv('remparts') / 2); };
const ambianceW = ambiance;
ambiance = function () { return ambianceW() + 3 * wonderLv('cave'); };
const glowPartsW = glowParts;
glowParts = function () { const f = glowPartsW(), L = wonderLv('galerie'); if (L) f.push([`La Galerie des statues (niv. ${L})`, 8 * L]); return f; };
const epaFactorsFete = epaFactors;
epaFactors = function (c, hungry) { const r = epaFactorsFete(c, hungry); if (S.feteAt && S.night - S.feteAt < FETE_LAST) { r.f.push(['Encore sous le charme de la Grande fête', 12]); r.target = clamp(r.f.reduce((a, x) => a + x[1], 0), 0, 100); } return r; };
const soulsDawnArchives = soulsDawn;
soulsDawn = function (report) {
  const r = soulsDawnArchives(report), L = wonderLv('archives');
  if (L) { const pool = S.creatures.filter(c => !isOut(c)); for (let i = 0; i < L && pool.length; i++) { const c = pool.splice(Math.floor(Math.random() * pool.length), 1)[0]; gainXP(c, 1, []); } }
  return r;
};
// la fiche du Cœur : les Merveilles et la fête
function wondersHTML() {
  const fw = feteWhy(), fc = feteCost();
  return `<div class="chsec"><h3>${gi('crown')} Les Merveilles</h3><p class="hint">De grands ouvrages qu’on agrandit sans fin, de plus en plus chers, payés surtout en bois : c’est là que dort le bois en trop.</p>
    <div class="addlist">${Object.entries(WONDERS).map(([k, W]) => { const L = wonderLv(k), c = wonderCost(k), ok = canAfford(c); return `<div class="addrow${ok ? '' : ' off'}"><div class="arhead">${gi(W.ico)}<b>${esc(W.name)}${L ? ` · niv. ${L}` : ''}</b><span class="arcost">${costText(c)}</span></div><p class="hint">${L ? esc(W.desc(L)) + ' · ' : ''}niveau ${L + 1} : ${esc(W.desc(L + 1))}</p><button type="button" class="sbtn small${ok ? ' pri' : ''}" data-wonder="${k}" ${ok ? '' : 'disabled'}>${L ? 'Agrandir' : 'Bâtir'}</button></div>`; }).join('')}</div>
    <h3>${gi('music')} La Grande fête</h3><p class="hint">${costText(fc)} : toutes les créatures +1 de bonne humeur, et ${FETE_LAST} nuits d’épanouissement en plus (+12). Une fois toutes les ${FETE_EVERY} nuits.</p>
    <div class="btnrow"><button type="button" class="sbtn${fw ? '' : ' pri'}" data-fete="1" ${fw ? 'disabled' : ''}>${fw ? esc(fw) : '🎉 Donner une grande fête'}</button></div></div>`;
}
const openRoomWonders = openRoom;
openRoom = function (id) {
  openRoomWonders(id);
  const r = S.rooms.find(x => x.id === id), m = document.querySelector('#modalRoot .modal'); if (!r || r.t !== 'coeur' || !m || (typeof VISIT !== 'undefined' && VISIT)) return;
  const box = el('div', '', wondersHTML()), foot = m.querySelector('.mbody .btnrow:last-child'); (foot ? foot.parentNode.insertBefore(box, foot) : m.querySelector('.mbody').appendChild(box));
  box.addEventListener('click', e => {
    const w = e.target.closest('[data-wonder]'), f = e.target.closest('[data-fete]');
    if (w && !w.disabled && run('wonder', { id: w.dataset.wonder })) { sfx('chime'); afterChange(); openRoom(id); }
    if (f && !f.disabled && run('fete')) { sfx('victory'); afterChange(); toast('🎉 La fête bat son plein ! Tout le monde est de bonne humeur.'); openRoom(id); }
  });
};
// une pastille quand l'or et le bois dorment
const valNotifsW = valNotifs;
valNotifs = function (add) {
  valNotifsW(add);
  if (S.night >= 12 && S.gold >= 250 && S.mat >= 250 && Object.keys(WONDERS).some(k => canAfford(wonderCost(k)))) add('wonder', '🏛️', 'Ton or dort : agrandis une Merveille (touche le Cœur)', () => { const h = heartRoom(); if (h) openRoom(h.id); }, 1);
};
WIKI.merveilles = { cat: 'eco', t: 'Les Merveilles et la Grande fête', x: () => `<p>Dans la fiche du Cœur, quatre <b>Merveilles</b> s’agrandissent sans fin ; chaque niveau coûte ${WONDERS.cave.k === 1.6 ? 'environ 60 % de plus' : 'davantage'} que le précédent.</p><ul>${Object.values(WONDERS).map(W => `<li><b>${W.name}</b> (${costText(W.base)} au premier niveau) : ${W.desc(1)} au niveau 1, ${W.desc(4)} au niveau 4.</li>`).join('')}</ul><p>La <b>Grande fête</b> (une fois toutes les ${FETE_EVERY} nuits) met tout le monde de bonne humeur et donne ${FETE_LAST} nuits d’épanouissement en plus : de quoi rattraper une créature qui se sent délaissée.</p>` };

/* ---------- la chronique de l'aube : d'abord ce qui compte ----------
   Les 1 à 3 événements marquants de la nuit en grand (« À la une »), le détail replié en dessous. */
const UNE_RULES = [
  [10, /quitte|part vivre|est parti|pris·e par|retenu·e|capturé|désert|emport|filent avec|trahi/i],
  [9, /repouss|la bande|aux cartes|invasion|le Cœur/i],
  [7, /critique|victoire|légende|palier|nouvelle créature|arrive au château|rejoint|chantier terminé|quête accomplie|niveau \d+ !|évolue/i],
];
function uneOf(report) {
  const L = report.filter(x => x[0] !== 'sec').map(([e, t, tone], i) => { let s = tone === 'bad' ? 4 : tone === 'good' ? 2 : 1; UNE_RULES.forEach(([v, re]) => { if (re.test(t)) s = Math.max(s, v + (tone === 'bad' ? 1 : 0)); }); return { e, t, tone, s, i }; });
  return L.filter(x => x.s >= 4).sort((a, b) => b.s - a.s || a.i - b.i).slice(0, 3);
}
const chronicleHTMLUne = chronicleHTML;
chronicleHTML = function (n, report, sub, snap, now) {
  const html = chronicleHTMLUne(n, report, sub, snap, now), une = uneOf(report || []), lines = (report || []).filter(x => x[0] !== 'sec').length;
  if (!une.length || lines <= 4) return html;
  const top = `<section class="nc-une"><h3 class="nc-rib">${gi('news')}<span>À la une</span></h3>${une.map(x => `<div class="une ${x.tone === 'bad' ? 'bad' : x.tone === 'good' ? 'good' : ''}"><span class="emo">${iconize(esc(x.e))}</span><p>${iconize(esc(x.t))}</p></div>`).join('')}</section>`;
  return html.replace('<div class="nc-body">', `${top}<details class="nc-all"><summary>Tout le détail de la nuit (${lines} ligne${lines > 1 ? 's' : ''})</summary><div class="nc-body">`) + '</details>';
};
// les artefacts du Bazar : chaque achat renchérit les suivants
{ const wv = WIKI.ville && WIKI.ville.x; if (wv) WIKI.ville.x = () => wv() + `<p class="hint">Les artefacts en vente coûtent 25 % de plus pour chaque artefact déjà acheté (${(S && S.stats && S.stats.artBought) || 0} jusqu’ici) : les expéditions restent le meilleur moyen d’en trouver.</p>`; }
