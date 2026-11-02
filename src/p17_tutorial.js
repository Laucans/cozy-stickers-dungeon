
/* =========================================================
   Conseiller : tutoriel pas à pas et conseils au bon moment
   (à la manière des conseillers de Civilization)
   ========================================================= */
const TUTO = { flags: {}, shown: null, cells: null, tip: null };
function setTab(t) { if (UI.tab !== t) { UI.tab = t; renderSheet(); } }
function suggestRoom(t) {
  const d = ROOMS[t]; if (!d) return null;
  const h = heartRoom(), hx = h.x + 1, hy = h.y + 1; let best = null;
  for (const [w, hh] of [d.size, [d.size[1], d.size[0]]]) for (let y = 0; y + hh <= H; y++) for (let x = 0; x + w <= W; x++) {
    if (checkRoom(t, x, y, w, hh)) continue;
    const dist = Math.abs(x + w / 2 - hx) + Math.abs(y + hh / 2 - hy); if (!best || dist < best.dist) best = { x, y, w, hh, dist };
  }
  if (!best) return null; const out = []; for (let dy = 0; dy < best.hh; dy++) for (let dx = 0; dx < best.w; dx++) out.push([best.x + dx, best.y + dy]); return out;
}
const cellsOfType = t => { const r = S.rooms.find(x => x.t === t); return r ? cellsOf(r) : null; };
const hasFood = () => S.furn.some(f => FURN[f.t] && FURN[f.t].food && FURN[f.t].room !== 'any');
const TUTO_STEPS = [
  { id: 'intro', t: 'Bienvenue, Maître !', x: 'Je suis Gribouille, ton vieux conseiller. Je vais t’apprendre à transformer ce tas de pierres en château douillet et redouté. Tu peux passer le tutoriel quand tu veux.', btn: 'next' },
  { id: 'camera', t: 'Regarde autour de toi', x: 'Fais glisser le château pour te déplacer, zoome avec la molette, le pincement ou les boutons + et −. Le bouton ⤢ recadre tout le château.', target: '.zoom', until: () => CAM.user, btn: 'next' },
  { id: 'dortoir', t: 'Ta première pièce', x: 'Tes créatures ont besoin de lits. Dans la barre du bas, onglet Pièces, prends le {room:dortoir} et colle-le sur les cases qui brillent, contre le couloir.', target: '.card[data-kind="room"][data-t="dortoir"]', enter: () => setTab('room'), cells: () => suggestRoom('dortoir'), until: () => S.rooms.some(r => r.t === 'dortoir') },
  { id: 'chantier', t: 'Un chantier', x: 'La pièce démarre en chantier : l’horloge rouge au-dessus se remplit pendant la nuit. Tes ouvriers posent quelques segments par nuit, plus encore avec des diablotins. Voir {c:construire}.', btn: 'next' },
  { id: 'meuble', t: 'Meuble-la', x: 'Une pièce vide ne sert à rien. Onglet Meubles : pose la {furn:paillasse} offerte (badge vert) dans le Dortoir. Chaque lit accueille une créature de plus, et un Dortoir meublé attire les gobelins.', target: '.card[data-kind="furn"][data-t="paillasse"]', enter: () => setTab('furn'), cells: () => cellsOfType('dortoir'), until: () => S.furn.some(f => FURN[f.t] && FURN[f.t].beds && roomAt(f.x, f.y) && roomAt(f.x, f.y).t === 'dortoir') },
  { id: 'repas', t: 'Pense aux repas', x: 'En haut, Repas compare les bouches à nourrir et les repas produits. Le Cœur nourrit 3 créatures ; ensuite il te faut un {room:potager} ou une {room:cuisine} meublés. Voir {c:lits_repas}.', target: '#res [data-k="food"]', until: hasFood, btn: 'later' },
  { id: 'nuit', t: 'Finis la nuit', x: 'Ton tour est fini ? Appuie sur Finir la nuit. Les chantiers avancent, les pièces produisent, et de nouvelles créatures arrivent à l’aube. Voir {c:nuit}.', target: '#btnNight', enter: () => { TUTO.night0 = S.night; }, until: () => S.night > (TUTO.night0 || S.night) && !UI.busy },
  { id: 'creature', t: 'Fais connaissance', x: 'Touche une créature dans le château, ou son portrait à gauche, pour ouvrir sa fiche : compétence, humeur, poste.', target: '#portraits', until: () => TUTO.flags.creature },
  { id: 'caresse', t: 'Un peu de tendresse', x: 'Caresse-la ! Ravie (4 ou 5 cœurs), une créature utilise sa compétence en double ; boudeuse, elle ne fait plus rien. Voir {c:humeur}.', target: '#mPet', until: () => S.stats.pets >= 1, btn: 'later' },
  { id: 'piege', t: 'Prépare l’accueil des héros', x: 'Les aventuriers viendront par le plus court chemin jusqu’au Cœur. Touche Chemin pour le voir, puis colle un piège (onglet Pièges) dans un couloir sur ce chemin. Voir {c:pieges}.', target: '#btnPath', enter: () => setTab('def'), until: () => S.defs.length > 0, btn: 'later' },
  { id: 'raid', t: 'Un petit raid ?', x: 'Le bouton Raid envoie jusqu’à 3 créatures piller les environs : un dé par point d’équipe, on garde le meilleur. Mais chaque raid réveille la Menace. Voir {c:raids}.', target: '#btnRaid', until: () => !!S.raid || S.stats.raidsWon > 0, btn: 'later' },
  { id: 'horloges', t: 'Surveille tes horloges', x: 'En haut : la {c:calamite|Calamité} (rouge) monte quand le château va mal, la {c:menace|Menace} (bleue) quand le village s’agace. Pleine, la Menace amène des aventuriers.', target: '#clocks', btn: 'next' },
  { id: 'envies', t: 'Tes envies', x: 'À droite, les Envies du château te guident et rapportent des récompenses. Vise le {c:paliers|Palier 1} pour débloquer de nouvelles pièces et créatures.', target: '#tracker', btn: 'next' },
  { id: 'fin', t: 'À toi de jouer !', x: 'Tout le reste est dans le Grimoire (bouton 📖) : chaque mécanique, pièce, meuble et créature. Je reviendrai te souffler des conseils au bon moment. Bonne nuit, Maître !', btn: 'end' },
];
const TIPS = [
  { id: 'faim', when: () => eaters() > foodCap(), t: 'Des ventres vides !', x: 'Tu as plus de bouches que de repas. Les affamés boudent et la Calamité monte. Meuble un {room:potager} ou une {room:cuisine}.', wiki: 'lits_repas' },
  { id: 'lits', when: () => S.night > 1 && S.creatures.length >= beds(), t: 'Plus un lit de libre', x: 'Plus aucune créature ne peut s’installer. Ajoute des lits : {furn:paillasse}, {furn:litsup}, {furn:cercueil}…', wiki: 'lits_repas' },
  { id: 'calam', when: () => S.calamity >= CAL_MAX - 2, t: 'La Calamité gronde', x: 'L’horloge de Calamité est presque pleine : une catastrophe va tomber. Nourris tout le monde, soigne l’Ambiance, ou construis un {room:labo}.', wiki: 'calamite' },
  { id: 'menace', when: () => S.menace >= MENACE_MAX - 2, t: 'Des héros approchent', x: 'La Menace est presque pleine : des aventuriers attaqueront bientôt. Regarde le Chemin des héros, pose des pièges dessus ou poste des gardes.', wiki: 'invasion' },
  { id: 'boude', when: () => S.creatures.some(c => c.mood <= 1), t: 'Quelqu’un boude', x: 'Une créature boude : sa compétence est éteinte. Ouvre sa fiche pour voir ce qui cloche, et offre-lui une caresse.', wiki: 'humeur' },
  { id: 'palier', when: () => { const s = tierStatus(); return !!(s && s.ok); }, t: 'Palier disponible', x: 'Tu remplis toutes les conditions du palier suivant ! Bouton Palier, en bas à droite.', wiki: 'paliers' },
  { id: 'raid1', when: () => S.stats.raidsWon >= 1, t: 'Premier butin', x: 'Bravo ! Garde un œil sur la Menace : chaque raid la fait monter.', wiki: 'raids' },
  { id: 'invasion1', when: () => S.stats.invasions >= 1, t: 'Ta première invasion', x: 'Les aventuriers perdent du courage à chaque piège, pièce gardée et défense du Cœur. À zéro, ils fuient en semant leur bourse.', wiki: 'invasion' },
  { id: 'album', when: () => Object.keys(S.album).length >= 4, t: 'Ton album se remplit', x: 'Chaque pièce meublée attire une espèce différente. Le bestiaire du Grimoire dit qui vient d’où.', wiki: 'creatures' },
];
function advisorShow(o) {
  const a = $('#advisor'); a.hidden = false; a.className = 'advisor' + (o.cls ? ' ' + o.cls : '');
  a.innerHTML = `<div class="adv-pic"><img alt="" src="${portrait('diablotin')}"></div><div class="adv-box"><div class="adv-head"><b>${esc(o.title)}</b>${o.step ? `<small>${o.step}/${o.total}</small>` : ''}</div>
    <div class="adv-text">${wikiText(esc(o.text).replace(/&amp;/g, '&'))}</div><div class="adv-btns">${(o.buttons || []).map(b => `<button type="button" class="sbtn${b.pri ? ' pri' : ''}" data-adv="${b.id}">${esc(b.label)}</button>`).join('')}${o.wiki ? `<button type="button" class="sbtn" data-adv="wiki" data-wid="${o.wiki}">📖 En savoir plus</button>` : ''}${o.skip ? '<button type="button" class="link" data-adv="skip">Passer le tutoriel</button>' : ''}</div></div>`;
}
function advisorHide() { const a = $('#advisor'); if (a) a.hidden = true; TUTO.tip = null; }
function showStep(st) {
  const i = TUTO_STEPS.indexOf(st), btns = [];
  if (st.btn === 'next') btns.push({ id: 'next', label: 'Suivant', pri: true });
  if (st.btn === 'later') btns.push({ id: 'next', label: 'Plus tard' });
  if (st.btn === 'end') btns.push({ id: 'end', label: 'Terminer', pri: true }, { id: 'grim', label: '📖 Ouvrir le Grimoire' });
  advisorShow({ title: st.t, text: st.x, step: i + 1, total: TUTO_STEPS.length, buttons: btns, skip: st.btn !== 'end', cls: 'tuto' });
}
function nextStep() { if (!S.tuto) return; S.tuto.i++; TUTO.shown = null; TUTO.cells = null; sfx('chime'); save(); tutoTick(); }
function startTutorial() { S.tuto = { on: true, i: 0, asked: true }; TUTO.shown = null; TUTO.flags = {}; save(); tutoTick(); }
function tutoTick() {
  document.querySelectorAll('.tuto-glow').forEach(e => e.classList.remove('tuto-glow'));
  V.tutoCells = null;
  if (!S || !S.started || UI.busy || ADMIN.open || VISIT || COOP.role === 'guest') { const a = $('#advisor'); if (a) a.hidden = true; return; }
  const T = S.tuto;
  if (T && T.on) {
    const st = TUTO_STEPS[T.i];
    if (!st) { T.on = false; T.done = true; save(); advisorHide(); return; }
    if ($('#modalRoot').children.length && !(st.target && document.querySelector('#modalRoot ' + st.target))) { $('#advisor').hidden = true; if (st.until) { let ok = false; try { ok = !!st.until(); } catch (e) {} if (ok) nextStep(); } return; }
    if (TUTO.shown !== st.id) { TUTO.shown = st.id; if (st.enter) st.enter(); TUTO.cells = st.cells ? st.cells() : null; showStep(st); }
    else if ($('#advisor').hidden) showStep(st);
    if (st.target) { const el = document.querySelector(st.target); if (el) el.classList.add('tuto-glow'); }
    V.tutoCells = TUTO.cells;
    let done = false; try { done = !!(st.until && st.until()); } catch (e) {}
    if (done) nextStep();
    return;
  }
  if (!T) { S.tuto = { on: false, i: 0, asked: true }; save(); if (S.night > 1) advisorShow({ title: 'Du nouveau au château !', text: 'Le Grimoire (📖) explique désormais toutes les mécaniques, et je peux te faire un tutoriel pas à pas. On y va ?', buttons: [{ id: 'start', label: 'Lancer le tutoriel', pri: true }, { id: 'ok', label: 'Non merci' }] }); return; }
  if (S.tipsOff || TUTO.tip || !$('#advisor').hidden || $('#modalRoot').children.length) return;
  const tip = TIPS.find(t => { if (S.tips && S.tips[t.id]) return false; try { return t.when(); } catch (e) { return false; } });
  if (tip) { S.tips = S.tips || {}; S.tips[tip.id] = true; save(); TUTO.tip = tip.id; advisorShow({ title: tip.t, text: tip.x, buttons: [{ id: 'ok', label: 'Compris', pri: true }], wiki: tip.wiki, cls: 'tip' }); }
}
function bindTutorial() {
  $('#advisor').addEventListener('click', e => {
    const a = e.target.closest('[data-wiki]'); if (a) { e.preventDefault(); openGrimoire(a.dataset.wiki); return; }
    const b = e.target.closest('[data-adv]'); if (!b) return;
    const act = b.dataset.adv;
    if (act === 'next') nextStep();
    else if (act === 'skip') { S.tuto.on = false; S.tuto.skipped = true; save(); advisorHide(); toast('Tutoriel passé. Tu peux le relancer depuis le menu ⚙️.'); }
    else if (act === 'end') { S.tuto.on = false; S.tuto.done = true; save(); advisorHide(); }
    else if (act === 'grim') { S.tuto.on = false; S.tuto.done = true; save(); advisorHide(); openGrimoire(); }
    else if (act === 'ok') advisorHide();
    else if (act === 'wiki') { advisorHide(); openGrimoire(b.dataset.wid); }
    else if (act === 'start') startTutorial();
  });
  $('#res').addEventListener('click', e => { const c = e.target.closest('[data-k]'); if (c && CHIP_WIKI[c.dataset.k]) openGrimoire(CHIP_WIKI[c.dataset.k]); });
  $('#clocks').addEventListener('click', e => { const d = e.target.closest('.dial'); if (d) openGrimoire(d === $('#clocks').firstElementChild ? 'calamite' : 'menace'); });
  $('#sheet').addEventListener('contextmenu', e => { const c = e.target.closest('.card'); if (!c) return; e.preventDefault(); openGrimoire(`${c.dataset.kind}:${c.dataset.t}`); });
  $('#modalRoot').addEventListener('click', e => { const b = e.target.closest('[data-wiki-open]'); if (b) openGrimoire(b.dataset.wikiOpen); });
  setInterval(tutoTick, 700);
}
