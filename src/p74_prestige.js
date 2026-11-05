/* =========================================================
   Le prestige du Val : de quoi faire de l'or et du bois qui
   dorment autre chose qu'un tas, et une décision à chaque saison.
   - Le mécénat : tu offres aux villages, villes et cité du Val
     des embellissements à trois niveaux (un lavoir, un kiosque,
     une grande halle…). Surtout du bois. En retour : leur bonne
     volonté, un souvenir à coller, un peu de notoriété, et au
     troisième niveau, un panier offert à chaque fête de saison.
   - Le concours du Val : à chaque saison, un thème (le confort,
     les frissons, la table, la veillée). Inscription et préparatifs
     avant la fête ; le jury rend son verdict le jour de la fête.
   Les deux vivent dans la fiche du Cœur, à côté des chantiers.
   ========================================================= */

/* ---------- le mécénat du Val ---------- */
const MECENAT = {
  village: [['Un lavoir tout neuf', 'Les lavandières chantent faux, mais elles chantent ton nom.'], ['Le kiosque à musique', 'Le dimanche, la fanfare joue sous ton blason. Un peu trop fort.'], ['La grande halle du marché', 'Les marchands t’envoient un panier à chaque fête de saison.']],
  ville: [['Des lanternes dans les rues', 'Plus personne ne se cogne aux réverbères la nuit. Enfin, moins.'], ['Le jardin public', 'Des allées, des massifs, et un banc à ton nom où personne n’ose s’asseoir.'], ['Le théâtre de marionnettes', 'On y joue tes exploits, en chaussettes. Les échevins t’envoient un panier à chaque fête de saison.']],
  cite: [['Les fontaines de la place', 'L’eau coule, les pigeons sont ravis, la Cité aussi.'], ['La bibliothèque publique', 'Une aile entière porte ton nom, gravé à l’envers par un apprenti.'], ['L’opéra des Ombres', 'Un opéra en ton honneur. La Cité t’envoie un panier à chaque fête de saison.']],
};
const MEC_BASE = [{ g: 15, s: 40 }, { g: 30, s: 90 }, { g: 60, s: 180 }].map(priceUp), MEC_K = { village: 1, ville: 1.3, cite: 1.6 }, MEC_NIGHTS = [2, 3, 4];
const MEC_GW = [6, 8, 10], MEC_GLOW = [1, 2, 4], MEC_HYPE = [1, 2, 3], MEC_GIFT = ['theiere', 'tableau', 'cristal'], MEC_BASKET = { village: 6, ville: 9, cite: 12 };
const mecState = () => (S.mecenat = S.mecenat || { cur: null, done: {} });
const mecLv = id => mecState().done[id] || 0;
const mecCost = s => { const lv = mecLv(s.id), b = MEC_BASE[lv], k = MEC_K[s.kind] || 1; return b ? { g: Math.round(b.g * k), s: Math.round(b.s * k), a: Math.round(AMBER_COST.mec[lv] * k) } : null; };   // a : l'Ambre 🟠 (AMBER_COST, p3)
const allGold = c => (c ? { g: (c.g || 0) + Math.ceil((c.s || 0) * 1.5), s: 0, a: c.a || 0 } : null);   // tout payer en or, quand c'est l'or qui dort (1 bois = 1,5 or, comme les Merveilles) ; l'ambre ne s'achète pas
const mecName = (s, lv) => ((MECENAT[s.kind] || MECENAT.village)[lv] || ['?'])[0];
const mecSites = () => (S.world ? settlements().filter(s => siteKnown(s)) : []);
function mecWhy(s, gold) {
  if (!s || !SITE_KINDS[s.kind] || !SITE_KINDS[s.kind].rank) return 'Lieu inconnu'; if (!siteKnown(s)) return 'Ce lieu n’est pas encore sur ta carte';
  const st = mecState(); if (mecLv(s.id) >= 3) return 'Déjà embelli de fond en comble';
  if (st.cur) { const c = siteById(st.cur.site); return `Un embellissement est déjà en cours (${c ? c.name : '?'})`; }
  if (S.tier < 1) return 'Palier 1'; const c = gold ? allGold(mecCost(s)) : mecCost(s); if (!canAfford(c)) return `Il te faut ${costText(c)}`; return '';
}
CMD.mecenat = a => {
  const s = siteById(a && a.id), w = mecWhy(s, a && a.gold); if (w) return w;
  const lv = mecLv(s.id), c = a.gold ? allGold(mecCost(s)) : mecCost(s); pay(c);
  mecState().cur = { site: s.id, lv, left: MEC_NIGHTS[lv], n: S.night };
  addLog(`Mécénat : tes créatures partent bâtir ${mecName(s, lv).replace(/^Un |^Une |^Le |^La |^Les |^L’/, m => m.toLowerCase())} à ${s.name}.`, 'ev'); return null;
};
const mecGlow = () => Object.values(mecState().done).reduce((a, lv) => a + MEC_GLOW.slice(0, lv).reduce((x, y) => x + y, 0), 0);
const mecBaskets = () => mecSites().filter(s => mecLv(s.id) >= 3);
const glowPartsMec = glowParts;
glowParts = function () { const f = glowPartsMec(); if (S && S.mecenat) { const g = mecGlow(); if (g) f.push([`Le mécénat du Val (${Object.values(S.mecenat.done).reduce((a, b) => a + b, 0)} embellissement${Object.values(S.mecenat.done).reduce((a, b) => a + b, 0) > 1 ? 's' : ''})`, g]); }
  const L = S && S.concours && S.concours.laurel; if (L && S.night < L.until) f.push([`Lauréat du concours : ${L.name}`, L.glow]); return f; };

/* ---------- le concours du Val ---------- */
const concAvg = f => { const l = homeCreatures(); return l.length ? l.reduce((a, c) => a + f(c), 0) / l.length : 0; };
const CONCOURS = {
  printemps: { name: 'Le donjon le plus douillet', crit: 'le confort', what: 'l’ambiance pour chaque créature', ico: 'leaf', how: 'colle de la déco, agrandis la Cave à festins', score: () => clamp(Math.round((ambiance() / Math.max(4, homeCreatures().length) - 1) * 3), 0, 10) },
  ete: { name: 'Les plus beaux frissons', crit: 'les frissons', what: 'les pièges, et l’expérience de tes créatures', ico: 'trap', how: 'pose des pièges, fais grandir tes créatures', score: () => clamp(Math.round(S.defs.length * .6 + concAvg(c => c.lvl || 1) * 1.2 - 1), 0, 10) },
  automne: { name: 'La plus belle table', crit: 'la table', what: 'les repas en plus de ce que mangent tes créatures', ico: 'apple', how: 'meuble les potagers et les cuisines, cuisine un plat', score: () => clamp(Math.round((foodCap() - eaters()) / Math.max(4, eaters()) * 20), 0, 10) },
  hiver: { name: 'La veillée la plus chaleureuse', crit: 'la veillée', what: 'l’épanouissement de tes créatures', ico: 'campfire', how: 'caresses, friandises, envies comblées, une Grande fête', score: () => clamp(Math.round((concAvg(c => (c.epa == null ? 50 : c.epa)) - 55) / 4), 0, 10) },
};
const CONC_FROM = 11;   // dès la deuxième saison
const concFee = () => ({ g: 4 + 2 * (S.tier || 0) });
const concPrepCost = () => { const C = S.concours; return C && C.prep < 3 ? { s: Math.round([15, 30, 50][C.prep] * (1 + (S.tier || 0) * .5)) } : null; };
const concOpen = () => { const C = S && S.concours; return !!(C && !C.done && C.season === seasonIdx() && seasonDay() <= 4 && S.night >= CONC_FROM); };
const concDef = () => S.concours && CONCOURS[S.concours.k];
const concFete = () => S.night + Math.max(0, 5 - seasonDay());   // la nuit dont l'aube rend le verdict
const concRivalLevel = () => Math.round((3 + S.night / 25) * 10) / 10;   // les autres donjons du Val s'améliorent aussi
const concMine = () => { const D = concDef(); return D ? D.score() + (S.concours.prep || 0) : 0; };
CMD.concours = a => {
  const C = S.concours; if (!concOpen()) return 'Pas de concours ouvert en ce moment (un par saison, inscriptions jusqu’à la fête du 5e jour)';
  if (a && a.prep) { if (!C.in) return 'Inscris-toi d’abord'; const c = a.gold ? allGold(concPrepCost()) : concPrepCost(); if (!c) return 'Les préparatifs sont déjà au mieux (3/3)'; if (!canAfford(c)) return `Il te faut ${costText(c)}`; pay(c); C.prep++; addLog(`Concours : préparatifs ${C.prep}/3.`, 'ev'); return null; }
  if (C.in) return 'Déjà inscrit·e'; const f = concFee(); if (!canAfford(f)) return `Il te faut ${costText(f)}`; pay(f); C.in = true; addLog(`Inscription au concours : ${concDef().name}.`, 'ev'); return null;
};
function concAnnounce(report) {
  const Sn = season(), D = CONCOURS[Sn.k]; S.concours = { k: Sn.k, season: seasonIdx(), n: S.night, in: false, prep: 0, done: false, laurel: S.concours && S.concours.laurel || null };
  report.push(['📣', `Le concours du Val ${{ printemps: 'de printemps', ete: 'd’été', automne: 'd’automne', hiver: 'd’hiver' }[Sn.k]} : « ${D.name} ». Le jury jugera ${D.crit} (${D.what}), à l’aube de ${Sn.fete} (nuit ${concFete()}). Inscription au Cœur jusqu’à la nuit ${concFete() - 1} : ${costText(concFee())}, puis des préparatifs si tu veux mettre toutes les chances de ton côté.`, 'ev']);
}
function concJudge(report) {
  const C = S.concours, D = concDef(); C.done = true; if (!D) return;
  const names = RIVALS.map(r => r.name).sort(() => Math.random() - .5).slice(0, 3), lvl = concRivalLevel();
  const rivals = names.map(n => ({ n, v: Math.round((lvl + Math.random() * 3) * 10) / 10 }));
  if (!C.in) { const best = rivals.sort((a, b) => b.v - a.v)[0]; report.push(['🏅', `Le concours « ${D.name} » a eu lieu sans toi : ${best.n} l’emporte.`, '']); return; }
  const base = D.score(), mine = Math.round((base + C.prep + Math.random() * 2) * 10) / 10;
  const rank = 1 + rivals.filter(r => r.v > mine).length, tier = S.tier || 0; S.stats.concours = (S.stats.concours || 0) + 1;
  const L = homeCreatures(); L.forEach(c => { c.mood = clamp(c.mood + 1, 0, 5); });
  const score = `ton château ${String(mine).replace('.', ',')} (${base} pour ${D.crit}${C.prep ? ` +${C.prep} de préparatifs` : ''}), ${rivals.sort((a, b) => b.v - a.v).map(r => `${r.n} ${String(r.v).replace('.', ',')}`).join(', ')}`;
  if (rank === 1) {
    const g = 10 + 5 * tier; S.gold += g; S.hype += 3; S.free.cristal = (S.free.cristal || 0) + 1; C.laurel = { name: D.name, glow: 6, until: S.night + SEASON_LEN };
    S.stats.concoursWon = (S.stats.concoursWon || 0) + 1;
    report.push(['🏆', `Concours du Val, « ${D.name} » : premier prix ! (${score}). +${g} 💰, +3 💬 de bouche-à-oreille, un Cristal à coller, +6 de notoriété jusqu’au prochain concours, et tout le château fait la fête (+1 ❤️).`, 'good']); addLog(`Premier prix du concours : ${D.name}.`, 'good');
  } else if (rank === 2) {
    const g = 4 + 2 * tier; S.gold += g; C.laurel = { name: D.name + ' (2e prix)', glow: 3, until: S.night + SEASON_LEN };
    report.push(['🥈', `Concours du Val, « ${D.name} » : deuxième prix (${score}). +${g} 💰, +3 de notoriété jusqu’au prochain concours, et tout le monde est content (+1 ❤️).`, 'good']);
  } else report.push(['🎗️', `Concours du Val, « ${D.name} » : ${rank}e place (${score}). Pas de prix, mais tes créatures ont bien ri (+1 ❤️). ${D.how ? `La prochaine fois : ${D.how}.` : ''}`, '']);
}
// l'aube : l'annonce du concours au 1er jour de la saison, le verdict le jour de la fête ; les paniers et le mécénat
const dawnPrestige = dawn;
dawn = function (report) {
  const r = dawnPrestige(report), lines = [];
  const st = mecState();
  if (st.cur) { st.cur.left--; const s = siteById(st.cur.site);
    if (!s) st.cur = null;
    else if (st.cur.left <= 0) { const lv = st.cur.lv, nm = mecName(s, lv), txt = ((MECENAT[s.kind] || MECENAT.village)[lv] || [])[1] || ''; st.done[s.id] = lv + 1; st.cur = null; S.stats.mecenat = (S.stats.mecenat || 0) + 1;
      addGw(s, MEC_GW[lv]); S.hype += MEC_HYPE[lv]; const gift = MEC_GIFT[lv]; if (FURN[gift]) S.free[gift] = (S.free[gift] || 0) + 1; homeCreatures().forEach(c => { c.mood = clamp(c.mood + 1, 0, 5); });
      lines.push(['🎀', `${s.name} inaugure ${nm.charAt(0).toLowerCase() + nm.slice(1)} ! ${txt} Bonne volonté +${MEC_GW[lv]}, +${MEC_HYPE[lv]} 💬 de bouche-à-oreille, +${MEC_GLOW[lv]} de notoriété pour toujours, un sticker en souvenir (${FURN[gift] ? FURN[gift].name : '?'}), et tout le château est fier (+1 ❤️).`, 'good']); addLog(`Mécénat : ${nm} à ${s.name}.`, 'good'); }
    else lines.push(['🔨', `Mécénat : ${mecName(s, st.cur.lv)} à ${s.name}, encore ${st.cur.left} nuit${st.cur.left > 1 ? 's' : ''}.`, '']); }
  if (S.night >= CONC_FROM && seasonDay() === 1 && (!S.concours || S.concours.season !== seasonIdx() || S.concours.done)) concAnnounce(lines);
  if (seasonDay() === 5) {
    if (S.concours && !S.concours.done && S.concours.season === seasonIdx()) concJudge(lines);
    const b = mecBaskets(); if (b.length) { const g = b.reduce((a, s) => a + (MEC_BASKET[s.kind] || 6), 0); S.gold += g; lines.push(['🧺', `Pour la fête, ${b.map(s => s.name).join(', ')} t’envoie${b.length > 1 ? 'nt' : ''} un panier garni : +${g} 💰.`, 'good']); }
  }
  if (lines.length) { report.push(['sec', 'Le Val en fête']); lines.forEach(l => report.push(l)); }
  return r;
};
const upgradeStatePrestige = upgradeState;
upgradeState = function (s) { const r = upgradeStatePrestige(s); if (r) { r.mecenat = r.mecenat || { cur: null, done: {} }; if (r.concours === undefined) r.concours = null; } return r; };

/* ---------- la fiche du Cœur ---------- */
// « … ou tout en or » : quand le bois manque, ou quand l'or déborde
const goldBtn = (c, data) => { const cg = allGold(c); return cg && canAfford(cg) && (!canAfford(c) || S.gold > 200) ? ` <button type="button" class="sbtn small" ${data} data-gold="1">… ou tout en or (${cg.g} 💰)</button>` : ''; };
function prestigeHTML() {
  const C = S.concours, D = concDef(), open = concOpen(), st = mecState(), sites = mecSites();
  const conc = !D || S.night < CONC_FROM ? `<p class="hint">Le premier concours sera annoncé au début de la deuxième saison (nuit ${CONC_FROM}).</p>`
    : open ? `<div class="addrow"><div class="arhead">${gi(D.ico)}<b>${esc(D.name)}</b><span class="arcost">inscriptions jusqu’à la nuit ${concFete() - 1}</span></div><p class="ardesc">Le jury juge ${esc(D.crit)} : ${esc(D.what)}. Ton château vaut aujourd’hui <b>${D.score()}/10</b>${C.prep ? ` +${C.prep} de préparatifs` : ''} ; les favoris du Val tournent autour de ${String(concRivalLevel() + 1.5).replace('.', ',')}. Pour grimper : ${esc(D.how)}.</p>
        ${C.in ? `<p class="ok">${gi('check')} Inscrit·e. Préparatifs ${C.prep}/3.</p>${concPrepCost() ? `<button type="button" class="sbtn${canAfford(concPrepCost()) ? ' pri' : ''}" data-conc="prep" ${canAfford(concPrepCost()) ? '' : 'disabled'}>${gi('build')} Préparatifs (+1 point) : ${costText(concPrepCost())}</button>${goldBtn(concPrepCost(), 'data-conc="prep"')}` : ''}`
          : `<button type="button" class="sbtn${canAfford(concFee()) ? ' pri' : ''}" data-conc="in" ${canAfford(concFee()) ? '' : 'disabled'}>${gi('trophy')} S’inscrire : ${costText(concFee())}</button>`}</div>`
    : `<p class="hint">${C && C.done ? 'Le jury a rendu son verdict. ' : ''}Prochain concours au début de la saison suivante (dans ${SEASON_LEN - seasonDay() + 1} nuit${SEASON_LEN - seasonDay() + 1 > 1 ? 's' : ''}).</p>`;
  const cur = st.cur && siteById(st.cur.site);
  const rows = sites.map(s => { const lv = mecLv(s.id), w = mecWhy(s), c = mecCost(s); return `<div class="addrow${lv >= 3 ? ' done' : w && !whyPoor(w) ? ' off' : ''}"><div class="arhead">${gi(s.kind === 'village' ? 'house' : 'castle')}<b>${esc(s.name)}</b><span class="arcost">${lv >= 3 ? 'embelli' : `${costHTML(c)} · ${MEC_NIGHTS[lv]} nuits`}</span></div><p class="ardesc">${'★'.repeat(lv)}${'☆'.repeat(3 - lv)} ${lv < 3 ? `Prochain : <b>${esc(mecName(s, lv))}</b> (bonne volonté +${MEC_GW[lv]}, +${MEC_GLOW[lv]} de notoriété, un ${FURN[MEC_GIFT[lv]].name}${lv === 2 ? ', et un panier à chaque fête' : ''}).` : `Un panier de ${MEC_BASKET[s.kind] || 6} 💰 à chaque fête de saison.`}</p>${lv < 3 ? `${w && !whyPoor(w) ? `<p class="arwhy">${gi('lock')} ${esc(w)}</p>` : ''}<button type="button" class="sbtn ${w ? '' : 'pri'}" data-mec="${s.id}" ${w ? 'disabled' : ''}>${gi('gift')} Offrir</button>${!st.cur && S.tier >= 1 ? goldBtn(c, `data-mec="${s.id}"`) : ''}` : ''}</div>`; }).join('');
  return `<div class="chsec"><h3>${gi('trophy')} Le concours du Val</h3><p class="hint">Un par saison, sur un thème. Inscription et préparatifs avant la fête du 5e jour ; un prix, c’est de l’or, un sticker et de la notoriété jusqu’au concours suivant.</p>${conc}
    <h3>${gi('gift')} Le mécénat du Val</h3><p class="hint">Offre aux lieux du Val des embellissements, surtout en bois : leur bonne volonté, un souvenir, de la notoriété, et au troisième, un panier à chaque fête. Un à la fois.</p>${cur ? `<p class="ok">${gi('hourglass')} En cours : <b>${esc(mecName(cur, st.cur.lv))}</b> à ${esc(cur.name)}, encore ${st.cur.left} nuit${st.cur.left > 1 ? 's' : ''}.</p>` : ''}
    <div class="addlist">${rows || '<p class="hint">Découvre d’abord des villages sur la carte.</p>'}</div></div>`;
}
const openRoomPrestige = openRoom;
openRoom = function (id) {
  openRoomPrestige(id);
  const r = S.rooms.find(x => x.id === id), m = document.querySelector('#modalRoot .modal'); if (!r || r.t !== 'coeur' || !m || (typeof VISIT !== 'undefined' && VISIT)) return;
  const box = el('div', 'hval', prestigeHTML()); m.querySelector('.mbody').appendChild(box); heartTabs(m);
  box.addEventListener('click', e => {
    const b = e.target.closest('[data-conc],[data-mec]'); if (!b || b.disabled) return;
    const keep = () => { const sc = m.scrollTop; openRoom(id); const m2 = document.querySelector('#modalRoot .modal'); if (m2) m2.scrollTop = sc; };
    if (b.dataset.conc && run('concours', { prep: b.dataset.conc === 'prep', gold: !!b.dataset.gold })) { sfx('chime'); afterChange(); keep(); }
    if (b.dataset.mec && run('mecenat', { id: b.dataset.mec, gold: !!b.dataset.gold })) { sfx('chime'); afterChange(); toast('🎀 Tes créatures partent bâtir, les bras chargés de planches.'); keep(); }
  });
};
// la fiche du Cœur en onglets : elle devenait très longue (palier, chantiers, Merveilles et fête, concours et mécénat)
function heartTabs(m) {
  const body = m.querySelector('.mbody'), head = body && body.querySelector('.cardhead'); if (!head || body.querySelector('.htabs')) return;
  const wrapOf = re => { const s = [...body.querySelectorAll('.htier .chsec')].find(x => re.test((x.querySelector('h3') || {}).textContent || '')); return s && s.parentElement !== body.querySelector('.htier') ? s.parentElement : s; };
  const T = [['coeur', '❤️ Le Cœur', null], ['chantiers', '🏗️ Chantiers', wrapOf(/chantiers/i)], ['merveilles', '🏛️ Merveilles et fête', wrapOf(/Merveilles/)], ['val', '🎀 Le Val', body.querySelector('.hval')]].filter(x => x[0] === 'coeur' || x[2]);
  if (T.length < 2) return;
  const panes = {}; T.forEach(([k]) => { panes[k] = el('div', 'hpane'); panes[k].dataset.pane = k; });
  T.forEach(([k, , n]) => { if (n) panes[k].appendChild(n); });
  [...body.children].filter(c => c !== head && !c.classList.contains('hpane')).forEach(c => panes.coeur.appendChild(c));
  const bar = el('div', 'tabs htabs', T.map(([k, lab]) => `<button type="button" role="tab" data-htab="${k}">${lab}</button>`).join('')); bar.setAttribute('role', 'tablist');
  head.after(bar); let prev = bar; T.forEach(([k]) => { prev.after(panes[k]); prev = panes[k]; });
  const show = k => { if (!panes[k]) k = 'coeur'; UI.heartTab = k; T.forEach(([j]) => { panes[j].hidden = j !== k; bar.querySelector(`[data-htab="${j}"]`).setAttribute('aria-selected', String(j === k)); }); };
  bar.addEventListener('click', e => { const b = e.target.closest('[data-htab]'); if (b) { sfx('tick'); show(b.dataset.htab); m.scrollTop = 0; } });
  show(UI.heartTab || 'coeur');
}
// une pastille : le concours attend ton inscription ; du bois qui dort et un lieu à embellir
const valNotifsPrestige = valNotifs;
valNotifs = function (add) {
  valNotifsPrestige(add);
  const heart = () => { const h = heartRoom(); if (h) openRoom(h.id); };
  if (concOpen() && !S.concours.in && seasonDay() <= 4) add('conc', '🏆', `Concours du Val : « ${concDef().name} », inscriptions jusqu’à la nuit ${concFete() - 1} (touche le Cœur)`, heart, 2);
  else if (!mecState().cur && S.mat >= 120 && mecSites().some(s => !mecWhy(s))) add('mec', '🎀', 'Ton bois dort : offre un embellissement à un village (touche le Cœur)', heart, 1);
};

/* ---------- le Grimoire ---------- */
WIKI.concours = { cat: 'val', t: 'Le concours du Val', x: () => `<p>À partir de la deuxième saison, chaque saison a son <b>concours</b>, annoncé dans la chronique le premier jour. Le jury rend son verdict le jour de la fête (5e nuit de la saison). Tout se passe dans la fiche du Cœur.</p>
  <ul>${Object.entries(CONCOURS).map(([k, D]) => `<li><b>${SEASONS.find(s => s.k === k).name} : « ${esc(D.name)} »</b>. Le jury juge ${esc(D.crit)} : ${esc(D.what)}, sur 10. Pour grimper : ${esc(D.how)}.</li>`).join('')}</ul>
  <p><b>S’inscrire</b> coûte un peu d’or (4 💰, +2 par palier). Les <b>préparatifs</b> (trois au plus, en bois ou tout en or, de plus en plus chers) ajoutent chacun 1 point. Le jury ajoute 0 à 2 points d’humeur. En face, trois donjons du Val, qui progressent au fil des nuits.</p>
  <p><b>Premier prix</b> : de l’or (10 💰, +5 par palier), +3 💬 de bouche-à-oreille, un Cristal à coller et +6 de notoriété jusqu’au concours suivant. <b>Deuxième prix</b> : un peu d’or et +3 de notoriété. Dans tous les cas, tes créatures s’amusent (+1 ❤️).</p>` };
WIKI.mecenat = { cat: 'eco', t: 'Le mécénat du Val', x: () => `<p>Dans la fiche du Cœur, dès le palier 1 : offre aux villages, villes et à la Cité que tu connais des <b>embellissements</b>, trois par lieu, de plus en plus beaux. Tes créatures les bâtissent en quelques nuits, un à la fois. C’est surtout du bois : de quoi faire quelque chose du tas qui grandit.</p>
  <ul>${['village', 'ville', 'cite'].map(k => `<li><b>${{ village: 'Un village', ville: 'Une ville', cite: 'La Cité' }[k]}</b> : ${MECENAT[k].map((x, i) => `${i ? x[0].charAt(0).toLowerCase() + x[0].slice(1) : x[0]} (${costText({ g: Math.round(MEC_BASE[i].g * MEC_K[k]), s: Math.round(MEC_BASE[i].s * MEC_K[k]), a: Math.round(AMBER_COST.mec[i] * MEC_K[k]) })})`).join(', puis ')}.</li>`).join('')}</ul>
  <p>Quand c’est l’or qui dort, on peut tout payer en or (1 bois = 1,5 or), sauf l’{c:ambre|Ambre}, qui ne s’achète pas.</p><p>À chaque inauguration : la bonne volonté du lieu (+${MEC_GW.join(', +')}), du bouche-à-oreille, de la notoriété pour toujours (+${MEC_GLOW.join(', +')}), un sticker en souvenir, et tout le château est fier (+1 ❤️). Au troisième embellissement, le lieu t’envoie un <b>panier garni</b> à chaque fête de saison (${MEC_BASKET.village} 💰 pour un village, ${MEC_BASKET.ville} pour une ville, ${MEC_BASKET.cite} pour la Cité).</p>` };
// les articles voisins renvoient au concours et au mécénat
{ const ws = WIKI.saisons && WIKI.saisons.x; if (ws) WIKI.saisons.x = () => ws() + `<p>À partir de la deuxième saison, chaque saison a aussi son {c:concours|concours du Val}, jugé le jour de la fête.</p>`; }
{ const wm = WIKI.merveilles && WIKI.merveilles.x; if (wm) WIKI.merveilles.x = () => wm() + `<p>Le bois qui s’entasse peut aussi aller au {c:mecenat|mécénat du Val} (des embellissements pour les villages), aux préparatifs du {c:concours|concours de la saison}, ou aux {c:caravanes|caravanes} qui l’achètent.</p>`; }
{ const wv = WIKI.visiteurs && WIKI.visiteurs.x; if (wv) WIKI.visiteurs.x = () => wv() + `<p>Le marchand ambulant reste devant la porte toute la nuit de sa visite : tu peux lui acheter quelque chose jusqu’à l’aube suivante.</p>`; }
TIPS.push({ id: 'concours0', when: () => concOpen() && !S.concours.in, t: 'Le concours du Val', x: 'Cette saison, le Val organise un concours ! Touche le Cœur pour voir le thème, ta note du moment, et t’inscrire avant la fête.', wiki: 'concours' });
