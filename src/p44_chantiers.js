/* =========================================================
   Les grands chantiers du château
   Des projets de plusieurs nuits, chers, un à la fois : chacun
   débloque une règle pour toujours. De quoi dépenser l'or qui
   s'accumule en milieu de partie.
   ========================================================= */
const CHANTIERS = {
  serre:     { ico: 'leaf', name: 'La grande serre', desc: 'Des légumes toute l’année : +4 repas, même en hiver.', cost: { g: 45, s: 25, a: 3 }, nights: 4, tier: 0 },
  pontlevis: { ico: 'door', name: 'Le pont-levis', desc: 'Un vrai pont-levis à la porte : à chaque invasion, +1 énergie au premier tour du combat du Cœur.', cost: { g: 60, s: 30, a: 4 }, nights: 4, tier: 1 },
  secrete:   { ico: 'key', name: 'La pièce secrète', get desc() { return `Derrière une bibliothèque qui pivote : à chaque invasion, la bande s’y perd et tourne en rond ; chaque héros y laisse ${Math.round((typeof INV_BOOST !== 'undefined' ? INV_BOOST.secret : .15) * 100)} % de ses PV avant la première pièce.`; }, cost: { g: 50, s: 15, a: 4 }, nights: 3, tier: 1 },
  biblio:    { ico: 'book', name: 'La bibliothèque sans fond', desc: 'Chaque nuit, deux créatures y apprennent quelque chose : +1 expérience.', cost: { g: 70, s: 20, a: 5 }, nights: 5, tier: 1 },
  statue:    { ico: 'statue', name: 'La statue du Maître', desc: 'Toi, en pierre et en grand, dans la cour : +12 de notoriété.', cost: { g: 90, s: 40, a: 8 }, nights: 5, tier: 2 },
};
Object.values(CHANTIERS).forEach(C => { C.cost0 = C.cost; C.cost = priceUp(C.cost); });   // les prix suivent PRICE (p3) ; a : l'Ambre 🟠, qui ne la suit pas
const chantierState = () => (S.chantiers = S.chantiers || { cur: null, done: {} });
const chantierDone = k => !!(S && S.chantiers && S.chantiers.done && S.chantiers.done[k]);
function chantierWhy(k) {
  const C = CHANTIERS[k], st = chantierState(); if (!C) return 'Chantier inconnu';
  if (st.done[k]) return 'Déjà bâti'; if (st.cur) return `Un grand chantier est déjà en cours (${CHANTIERS[st.cur.id].name})`;
  if (S.tier < C.tier) return `Palier ${C.tier}`; if (!canAfford(C.cost)) return `Il te faut ${costText(C.cost)}`; return '';
}
CMD.chantier = a => { const w = chantierWhy(a.id); if (w) return w; pay(CHANTIERS[a.id].cost); chantierState().cur = { id: a.id, left: CHANTIERS[a.id].nights, n: S.night }; addLog(`Début du grand chantier : ${CHANTIERS[a.id].name}.`, 'ev'); return null; };
// l'avancement, à l'aube ; et la bibliothèque qui instruit
const dawnChantier = dawn;
dawn = function (report) {
  const r = dawnChantier(report), st = chantierState();
  if (st.cur) { st.cur.left--; if (st.cur.left <= 0) { const C = CHANTIERS[st.cur.id]; st.done[st.cur.id] = S.night; st.cur = null; report.push(['🏗️', `Grand chantier terminé : ${C.name} ! ${C.desc}`, 'good']); addLog(`Grand chantier terminé : ${C.name}.`, 'ev'); } else report.push(['🏗️', `Grand chantier : ${CHANTIERS[st.cur.id].name}, encore ${st.cur.left} nuit${st.cur.left > 1 ? 's' : ''}.`, '']); }
  if (chantierDone('biblio')) { const l = S.creatures.filter(c => !isOut(c)); for (let i = 0; i < 2 && l.length; i++) { const c = l.splice(Math.floor(Math.random() * l.length), 1)[0]; gainXP(c, 1, []); } }
  return r;
};
function bonusFoodChantier() { return chantierDone('serre') ? 4 : 0; }
const glowPartsChantier = glowParts;
glowParts = function () { const f = glowPartsChantier(); if (chantierDone('statue')) f.push(['La statue du Maître', 12]); return f; };
// la fiche du Cœur : les grands chantiers
function chantiersHTML() {
  const st = chantierState();
  return `<div class="chsec"><h3>${gi('build')} Les grands chantiers</h3><p class="hint">Un à la fois, sur plusieurs nuits : chacun change une règle pour toujours.</p>${st.cur ? `<p class="ok">${gi('hourglass')} En cours : <b>${esc(CHANTIERS[st.cur.id].name)}</b>, encore ${st.cur.left} nuit${st.cur.left > 1 ? 's' : ''}.</p>` : ''}
    <div class="addlist">${Object.entries(CHANTIERS).map(([k, C]) => { const w = chantierWhy(k), done = st.done[k]; return `<div class="addrow${done ? ' done' : w && !whyPoor(w) ? ' off' : ''}"><div class="arhead">${gi(C.ico)}<b>${esc(C.name)}</b><span class="arcost">${done ? 'bâti' : `${costHTML(C.cost)} · ${C.nights} nuits`}</span></div><p class="ardesc">${esc(C.desc)}</p>${done ? '' : `${w && !whyPoor(w) ? `<p class="arwhy">${gi('lock')} ${esc(w)}</p>` : ''}<button type="button" class="sbtn ${w ? '' : 'pri'}" data-chant="${k}" ${w ? 'disabled' : ''}>${gi('build')} Lancer le chantier</button>`}</div>`; }).join('')}</div></div>`;
}
const openRoomChantier = openRoom;
openRoom = function (id) {
  openRoomChantier(id);
  const r = S.rooms.find(x => x.id === id), m = document.querySelector('#modalRoot .modal'); if (!r || r.t !== 'coeur' || !m) return;
  const box = el('div', '', chantiersHTML()), foot = m.querySelector('.mbody .btnrow:last-child'); (foot ? foot.parentNode.insertBefore(box, foot) : m.querySelector('.mbody').appendChild(box));
  box.addEventListener('click', e => { const b = e.target.closest('[data-chant]'); if (!b || b.disabled) return; if (run('chantier', { id: b.dataset.chant })) { sfx('chime'); afterChange(); openRoom(id); } });
};
WIKI.chantiers = { cat: 'eco', t: 'Les grands chantiers', x: () => `<p>Dans la fiche du Cœur (touche-le), les <b>grands chantiers</b> : des projets de plusieurs nuits, chers (de l’{c:ambre|Ambre} en plus de l’or et du bois), un seul à la fois. Une fois bâti, chacun change une règle pour toujours.</p><ul>${Object.values(CHANTIERS).map(C => `<li><b>${esc(C.name)}</b> (${costText(C.cost)}, ${C.nights} nuits${C.tier ? `, palier ${C.tier}` : ''}) : ${esc(C.desc)}</li>`).join('')}</ul>` };
