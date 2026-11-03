
/* =========================================================
   Conseiller : tutoriel pas à pas et conseils au bon moment
   (à la manière des conseillers de Civilization)
   ========================================================= */
const TUTO = { flags: {}, shown: null, cells: null, tip: null };
function setTab(t) { openBuild(t); }
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
  { id: 'intro', t: 'Bienvenue, Maître !', x: 'Je suis Gribouille, ton vieux conseiller. Je vais t’apprendre à transformer ce vieux château en repaire douillet et redouté. Tu peux passer le tutoriel quand tu veux.', btn: 'next' },
  { id: 'camera', t: 'Regarde autour de toi', x: 'Fais glisser le château pour te déplacer, zoome avec la molette ou en pinçant l’écran. Le bouton ⤢, en bas à droite, recadre tout le château.', target: '#zfit', until: () => CAM.user, btn: 'next' },
  { id: 'dortoir', t: 'Ta première pièce', x: 'Tes créatures ont besoin de lits. Le bouton Construire (en bas à gauche) ouvre tes stickers : onglet Pièces, prends le {room:dortoir} et colle-le sur les cases qui brillent, contre le couloir.', target: '.card[data-kind="room"][data-t="dortoir"]', enter: () => setTab('room'), cells: () => suggestRoom('dortoir'), until: () => S.rooms.some(r => r.t === 'dortoir') },
  { id: 'chantier', t: 'Un chantier', x: 'La pièce démarre en chantier : l’horloge rouge au-dessus se remplit pendant la nuit. Tes ouvriers posent quelques segments par nuit, plus encore avec des diablotins. On ne meuble une pièce qu’une fois terminée : il faut laisser passer la nuit. Voir {c:construire}.', btn: 'next' },
  { id: 'nuit', t: 'Finis la nuit', x: 'Ton tour est fini ? Appuie sur Finir la nuit : tes ouvriers bâtissent le Dortoir, les pièces produisent, et de nouvelles créatures arrivent à l’aube. Voir {c:nuit}.', target: '#btnNight', enter: () => { TUTO.night0 = S.night; }, until: () => S.night > (TUTO.night0 || S.night) && !UI.busy },
  { id: 'fiche', t: 'Ouvre ta pièce', get x() { return S.rooms.some(r => r.t === 'dortoir' && r.built) ? 'Le Dortoir est terminé ! Une pièce vide ne sert à rien. Touche-le (les cases qui brillent) : sa fiche s’ouvre, avec tout ce qu’on peut y coller.' : 'Le Dortoir n’est pas encore fini : finis une nuit de plus, puis touche-le pour ouvrir sa fiche.'; }, enter: () => { TUTO.flags.room = null; if (UI.build) closeBuild(); }, cells: () => cellsOfType('dortoir'), until: () => (TUTO.flags.room === 'dortoir' && S.rooms.some(r => r.t === 'dortoir' && r.built)) || S.furn.some(f => FURN[f.t] && FURN[f.t].beds && roomAt(f.x, f.y) && roomAt(f.x, f.y).t === 'dortoir') },
  { id: 'meuble', t: 'Meuble-la', x: 'Dans la fiche, la liste « Ajouter » montre chaque meuble avec ses effets (grisé s’il ne se pose pas encore). Prends la {furn:paillasse} offerte (« Coller ici »), puis colle-la sur une case du Dortoir. Chaque lit accueille une créature de plus, et un Dortoir meublé attire les gobelins dès l’aube suivante. (Fiche fermée ? Touche le Dortoir.)', target: '[data-take="paillasse"]', cells: () => cellsOfType('dortoir'), until: () => S.furn.some(f => FURN[f.t] && FURN[f.t].beds && roomAt(f.x, f.y) && roomAt(f.x, f.y).t === 'dortoir') },
  { id: 'repas', t: 'Pense aux repas', x: 'En haut, le bol 🍲 compare les bouches à nourrir et les repas produits. Le Cœur nourrit 3 créatures ; ensuite il te faut un {room:potager} ou une {room:cuisine} meublés. Voir {c:lits_repas}.', target: '#res [data-k="food"]', until: hasFood, btn: 'later' },
  { id: 'creature', t: 'Fais connaissance', x: 'Touche une créature dans le château, ou ouvre la liste de tes créatures (🐾, en haut à gauche), pour voir sa fiche : caractère, envies, humeur, poste.', target: '#btnCrit', until: () => TUTO.flags.creature },
  { id: 'caresse', t: 'Ses envies', x: 'Chaque créature déclare une envie (✦) : son sticker préféré, un poste dans sa pièce, un·e ami·e… Comble-la et la récompense tombe toute seule : loyauté, expérience, cadeaux. Elle cache aussi un rêve secret (💭) : elle te le confiera quand elle te fera confiance, à moins qu’un ragot de taverne ne le trahisse. Voir {c:missions}.', target: '#mEnvie', btn: 'next' },
  { id: 'piege', t: 'Prépare l’accueil des héros', x: 'Les aventuriers viendront par le plus court chemin jusqu’au Cœur. Touche le bouton des empreintes (en bas à droite) pour le voir, puis colle un piège (Construire, onglet Pièges) dans un couloir sur ce chemin. Voir {c:pieges}.', target: '#btnPath', enter: () => setTab('def'), until: () => S.defs.length > 0, btn: 'later' },
  { id: 'gardes', t: 'Poste des gardes', x: 'Le bouton bouclier (en bas à droite) ouvre le mode Gardes : glisse une créature de la liste de gauche sur une pièce ou un couloir du chemin des héros (en doré). Elle y arrêtera la bande. Le nombre de gardes est limité ; les autres défendent le Cœur. Voir {c:postes}.', target: '#btnGuards', until: () => typeof guardCount === 'function' && guardCount() > 0, btn: 'later' },
  { id: 'jetons', t: 'Pendant l’invasion', x: 'Quand des héros attaquent, ne reste pas les bras croisés : tes jetons du Cœur servent à semer de l’or, claquer les portes, sonner la cloche ou provoquer un éboulement. Si tu laisses faire, la bande arrive presque toujours à ses fins ! Voir {c:invasion}.', btn: 'next' },
  { id: 'raid', t: 'Un petit raid ?', x: 'Le bouton Raid (la carte au trésor, en bas à droite) envoie jusqu’à 3 créatures piller les environs : un dé par point d’équipe, on garde le meilleur. Mais chaque raid réveille la Menace. Voir {c:raids}.', target: '#btnRaid', until: () => !!S.raid || S.stats.raidsWon > 0, btn: 'later' },
  { id: 'horloges', t: 'Surveille tes horloges', x: 'En haut : la {c:calamite|Calamité} (rouge) monte quand le château va mal, la {c:menace|Menace} (bleue) quand le village s’agace. Pleine, la Menace amène des aventuriers. Et tous les 5 nuits, c’est jour de paie : garde de l’or pour tes créatures.', target: '#clocks', btn: 'next' },
  { id: 'envies', t: 'Tes envies', x: 'À droite, les pastilles te signalent ce qui compte : les Envies du château (✦) qui rapportent des récompenses, les demandes de tes créatures, les dangers. Touche-les pour agir. Vise le {c:paliers|Palier 1} pour débloquer de nouvelles pièces et créatures.', target: '#notifs', btn: 'next' },
  { id: 'fin', t: 'À toi de jouer !', x: 'Tout le reste est dans le Grimoire (bouton 📖) : chaque mécanique, pièce, meuble et créature. Bientôt, tes créatures te confieront leurs missions, les Jardins (🌳 Dehors) attendent tes enclos, les victoires du Val se suivent en touchant la nuit en cours (en haut à droite), et le bouton 🏰 (en bas à droite) te mènera chez les autres Maîtres. Je reviendrai te souffler des conseils au bon moment. Bonne nuit, Maître !', btn: 'end' },
];
const TIPS = [
  { id: 'paie0', when: () => S.night >= 3 && nightsToPay() <= 1 && payroll() > 0, t: 'Bientôt le jour de paie', x: 'Tous les 5 nuits, tes créatures viennent chercher leur salaire (les diablotins travaillent pour rien). Garde assez d’or : une créature impayée boude et perd de sa loyauté. Survole ton or, en haut, pour voir le montant.', wiki: 'paie' },
  { id: 'fusion0', when: () => S.night >= 6 && S.rooms.filter(r => r.built && mergeable(r)).length >= 4 && !S.rooms.some(r => mergeable(r) && groupSize(r) >= 2), t: 'Des grandes salles', x: 'Colle deux pièces du même type l’une contre l’autre : elles fusionnent en une grande salle (+1 Ambiance) et débloquent des stickers améliorés, comme le Grand lit commun ou la Broche à rôtir géante.', wiki: 'fusion' },
  { id: 'faim', when: () => eaters() > foodCap(), t: 'Des ventres vides !', x: 'Tu as plus de bouches que de repas. Les affamés boudent et la Calamité monte. Meuble un {room:potager} ou une {room:cuisine}.', wiki: 'lits_repas' },
  { id: 'lits', when: () => S.night > 1 && S.creatures.length >= beds(), t: 'Plus un lit de libre', x: 'Plus aucune créature ne peut s’installer. Touche un Dortoir (ou une autre chambre) et colle-y des lits depuis sa fiche : {furn:paillasse}, {furn:litsup}, {furn:cercueil}…', wiki: 'lits_repas' },
  { id: 'calam', when: () => S.calamity >= CAL_MAX - 2, t: 'La Calamité gronde', x: 'L’horloge de Calamité est presque pleine : une catastrophe va tomber. Nourris tout le monde, soigne l’Ambiance, ou construis un {room:labo}.', wiki: 'calamite' },
  { id: 'menace', when: () => S.menace >= MENACE_MAX - 2, t: 'Des héros approchent', x: 'La Menace est presque pleine : des aventuriers attaqueront bientôt. Regarde le Chemin des héros, pose des pièges dessus ou poste des gardes.', wiki: 'invasion' },
  { id: 'boude', when: () => S.creatures.some(c => c.mood <= 1), t: 'Quelqu’un boude', x: 'Une créature boude : sa compétence est éteinte. Ouvre sa fiche pour voir ce qui cloche (faim, sticker préféré, poste), et comble son envie.', wiki: 'humeur' },
  { id: 'palier', when: () => { const s = tierStatus(); return !!(s && s.ok); }, t: 'Palier disponible', x: 'Tu remplis toutes les conditions du palier suivant ! Touche le Cœur du donjon (l’étoile dorée brille au-dessus) et monte de palier depuis sa fiche.', wiki: 'paliers' },
  { id: 'raid1', when: () => S.stats.raidsWon >= 1, t: 'Premier butin', x: 'Bravo ! Garde un œil sur la Menace : chaque raid la fait monter.', wiki: 'raids' },
  { id: 'invasion1', when: () => S.stats.invasions >= 1, t: 'Ta première invasion', x: 'Les pièges blessent les héros, tes gardes les combattent pièce par pièce, et le Cœur se défend en dernier. Quand la moitié de la bande est K.O., elle fuit en semant sa bourse.', wiki: 'invasion' },
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
    if (st.target) { const el = document.querySelector(st.target); if (el) { el.classList.add('tuto-glow'); const bd = el.closest('.backdrop'); if (bd) { bd.classList.add('tuto-side'); if (TUTO.scrolled !== st.id) { TUTO.scrolled = st.id; el.scrollIntoView({ block: 'end', behavior: 'smooth' }); } } } }   // dans une fiche : on amène l'élément sous les yeux, en bas, hors du conseiller
    V.tutoCells = TUTO.cells;
    let done = false; try { done = !!(st.until && st.until()); } catch (e) {}
    if (done) nextStep();
    return;
  }
  if (!T) { S.tuto = { on: false, i: 0, asked: true }; save(); if (S.night > 1) advisorShow({ title: 'Du nouveau au château !', text: 'Le Grimoire (📖) explique désormais toutes les mécaniques, et je peux te faire un tutoriel pas à pas. On y va ?', buttons: [{ id: 'start', label: 'Lancer le tutoriel', pri: true }, { id: 'ok', label: 'Non merci' }] }); return; }
  // les conseils ne s'imposent plus : ils attendent dans une pastille 💡, à droite
  if (S.tipsOff) { if (TUTO.pending) { TUTO.pending = null; renderGoals(); } return; }
  if (TUTO.pending) return;
  const tip = TIPS.find(t => { if (S.tips && S.tips[t.id]) return false; try { return t.when(); } catch (e) { return false; } });
  if (tip) { TUTO.pending = tip; renderGoals(); }
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
  $('#res').addEventListener('click', e => { const c = e.target.closest('[data-k]'); if (c && c.dataset.k === 'glow') { if (!UI.busy) openRadiance(); return; } if (c && CHIP_WIKI[c.dataset.k]) openGrimoire(CHIP_WIKI[c.dataset.k]); });
  $('#clocks').addEventListener('click', e => { const d = e.target.closest('.dial'); if (d) openGrimoire(d === $('#clocks').firstElementChild ? 'calamite' : 'menace'); });
  $('#sheet').addEventListener('contextmenu', e => { const c = e.target.closest('.card'); if (!c) return; e.preventDefault(); openGrimoire(`${c.dataset.kind}:${c.dataset.t}`); });
  $('#modalRoot').addEventListener('click', e => { const b = e.target.closest('[data-wiki-open]'); if (b) openGrimoire(b.dataset.wikiOpen); });
  setInterval(tutoTick, 700);
}
function showPendingTip() {
  const tip = TUTO.pending; if (!tip) return;
  TUTO.pending = null; (S.tips = S.tips || {})[tip.id] = true; save(); TUTO.tip = tip.id;
  advisorShow({ title: tip.t, text: tip.x, buttons: [{ id: 'ok', label: 'Compris', pri: true }], wiki: tip.wiki, cls: 'tip' }); renderGoals();
}
