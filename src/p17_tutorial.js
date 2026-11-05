
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
  { id: 'intro', t: 'Bienvenue, Maître !', x: 'Je suis Gribouille, ton vieux conseiller. Je vais t’apprendre à transformer ce vieux château en repaire douillet et redouté. Tu peux passer le tutoriel quand tu veux. Et si je cache quelque chose, prends-moi par le visage et fais-moi glisser !', btn: 'next' },
  { id: 'camera', t: 'Regarde autour de toi', x: 'Fais glisser le château pour te déplacer, zoome avec la molette ou en pinçant l’écran. Le bouton ⤢, en bas à droite, recadre tout le château.', target: '#zfit', enter: () => { TUTO.flags.cam = false; TUTO.cam0 = { x: CAM.x, y: CAM.y, s: CAM.s }; }, until: () => { const c = TUTO.cam0; return !!TUTO.flags.cam || !!(c && (Math.abs(CAM.x - c.x) > 30 || Math.abs(CAM.y - c.y) > 30 || Math.abs(CAM.s - c.s) > .05)); }, btn: 'next' },
  { id: 'dortoir', t: 'Ta première pièce', x: 'Tes créatures ont besoin de lits. Le bouton Construire (en bas à gauche) ouvre tes stickers : onglet Pièces, prends le {room:dortoir} et colle-le sur les cases qui brillent, contre le couloir.', target: '.card[data-kind="room"][data-t="dortoir"]', enter: () => setTab('room'), cells: () => suggestRoom('dortoir'), until: () => S.rooms.some(r => r.t === 'dortoir') },
  { id: 'chantier', t: 'Un chantier', x: 'La pièce démarre en chantier : l’horloge rouge au-dessus se remplit pendant la nuit. Tes ouvriers posent quelques segments par nuit, plus encore avec des diablotins. On ne meuble une pièce qu’une fois terminée : il faut laisser passer la nuit. Voir {c:construire}.', btn: 'next' },
  { id: 'nuit', t: 'Finis la nuit', x: 'Ton tour est fini ? Appuie sur Finir la nuit : tes ouvriers bâtissent le Dortoir, les pièces produisent, et de nouvelles créatures arrivent à l’aube. Voir {c:nuit}.', target: '#btnNight', enter: () => { if (S.tuto.n0 == null) S.tuto.n0 = S.night; }, until: () => { if (S.tuto.n0 == null) S.tuto.n0 = S.night; return S.night > S.tuto.n0 && !UI.busy; } },
  { id: 'fiche', t: 'Ouvre ta pièce', get x() { return S.rooms.some(r => r.t === 'dortoir' && r.built) ? 'Le Dortoir est terminé ! Une pièce vide ne sert à rien. Touche-le (les cases qui brillent) : sa fiche s’ouvre, avec tout ce qu’on peut y coller.' : 'Le Dortoir n’est pas encore fini : finis une nuit de plus, puis touche-le pour ouvrir sa fiche.'; }, enter: () => { TUTO.flags.room = null; if (UI.build) closeBuild(); }, cells: () => cellsOfType('dortoir'), until: () => (TUTO.flags.room === 'dortoir' && S.rooms.some(r => r.t === 'dortoir' && r.built)) || S.furn.some(f => FURN[f.t] && FURN[f.t].beds && roomAt(f.x, f.y) && roomAt(f.x, f.y).t === 'dortoir') },
  { id: 'meuble', t: 'Meuble-la', x: 'Dans la fiche, la liste « Ajouter » montre chaque meuble avec ses effets (grisé s’il ne se pose pas encore). Prends la {furn:paillasse} offerte (« Coller ici »), puis colle-la sur une case du Dortoir. Chaque lit accueille une créature de plus, et un Dortoir meublé attire les gobelins dès l’aube suivante. (Fiche fermée ? Touche le Dortoir.)', target: '[data-take="paillasse"]', cells: () => cellsOfType('dortoir'), until: () => S.furn.some(f => FURN[f.t] && FURN[f.t].beds && roomAt(f.x, f.y) && roomAt(f.x, f.y).t === 'dortoir') },
  { id: 'repas', t: 'Pense aux repas', x: 'En haut, le bol 🍲 compare les bouches à nourrir et les repas produits. Le Cœur nourrit 3 créatures ; ensuite il te faut un {room:potager} ou une {room:cuisine} meublés. Voir {c:lits_repas}.', target: '#res [data-k="food"]', until: hasFood, btn: 'later' },
  { id: 'creature', t: 'Fais connaissance', x: 'Touche une créature dans le château, ou ouvre la liste de tes créatures (🐾, en haut à gauche), pour voir sa fiche : caractère, envies, humeur, poste.', target: '#btnCrit', until: () => TUTO.flags.creature },
  { id: 'caresse', t: 'Ses envies', x: 'Chaque créature déclare une envie (✦) : son sticker préféré, un poste dans sa pièce, un·e ami·e… Comble-la et la récompense tombe toute seule : loyauté, expérience, cadeaux. Elle cache aussi un rêve secret (💭) : elle te le confiera quand elle te fera confiance, à moins qu’un ragot de taverne ne le trahisse. Voir {c:missions}.', target: '#mEnvie', btn: 'next' },
  { id: 'piege', t: 'Prépare l’accueil des héros', x: 'Les aventuriers traverseront quelques pièces de ton château avant d’atteindre le Cœur. Ouvre Construire (en bas à gauche), onglet Pièges, et colle un piège dans un couloir, contre une pièce : il frappera la bande quand elle y entrera, et donnera sa carte aux combats de cette pièce. Voir {c:pieges}.', target: '#btnBuild', enter: () => setTab('def'), until: () => S.defs.length > 0, btn: 'later' },
  { id: 'gardes', gone: true, t: 'Poste des gardes', x: '', btn: 'next' },   // plus de gardes à poster : l'étape est sautée (gardée pour ne pas décaler les tutoriels en cours)
  { id: 'jetons', t: 'Pendant l’invasion', x: 'Quand des héros attaquent, ils traversent quelques pièces de ton château, tirées au hasard, puis le Cœur. Tes créatures se défendent d’elles-mêmes, sans rien à placer : les 3 plus fortes au Cœur, les autres rangées de la plus faible à la plus forte, les plus faibles dans la première pièce. Une pièce avec des défenseurs, c’est un combat aux cartes (les cartes viennent de la pièce). Une créature épuisée par les raids se repose : ménage-les avant une attaque. Voir {c:invasion}.', btn: 'next' },
  { id: 'raid', t: 'Un petit raid ?', x: 'Le bouton Raid (la carte au trésor, en bas à droite) envoie jusqu’à 3 créatures piller les environs : un dé par point d’équipe, on garde le meilleur. Mais chaque raid réveille la Menace. Voir {c:raids}.', target: '#btnRaid', until: () => !!S.raid || S.stats.raidsWon > 0, btn: 'later' },
  { id: 'horloges', t: 'Surveille tes horloges', x: 'En haut : la {c:calamite|Calamité} (rouge) monte quand le château va mal, la {c:menace|Menace} (bleue) quand le village s’agace. Pleine, la Menace amène des aventuriers. Et chaque nuit, tes créatures touchent leurs gages : garde un peu d’or pour elles.', target: '#clocks', btn: 'next' },
  { id: 'envies', t: 'Tes envies', x: 'À droite, les pastilles te signalent ce qui compte : les Envies du château (✦) qui rapportent des récompenses, les demandes de tes créatures, les dangers. Touche-les pour agir. Vise le {c:paliers|Palier 1} pour débloquer de nouvelles pièces et créatures.', target: '#notifs', btn: 'next' },
  { id: 'fin', t: 'À toi de jouer !', x: 'Tout le reste est dans le Grimoire (bouton 📖) : chaque mécanique, pièce, meuble et créature. Bientôt, tes créatures te confieront leurs missions, les Jardins (🌳 Dehors) attendent tes enclos, les victoires du Val se suivent en touchant la nuit en cours (en haut à droite), et le bouton 🏰 (en bas à droite) te mènera chez les autres Maîtres. Je reviendrai te souffler des conseils au bon moment. Bonne nuit, Maître !', btn: 'end' },
];
const TIPS = [
  { id: 'paie0', when: () => S.night >= 3 && nightsToPay() <= 1 && payroll() > 0, t: 'Bientôt le jour de paie', x: 'Chaque nuit, tes créatures touchent un peu de leur salaire (les diablotins travaillent pour rien). Si la caisse est vide, ça va sur l’ardoise ; tous les 5 nuits, au jour de paie, on fait les comptes : une créature impayée boude et perd de sa loyauté. Survole ton or, en haut, pour voir les gages et l’ardoise.', wiki: 'paie' },
  { id: 'fusion0', when: () => S.night >= 6 && S.rooms.filter(r => r.built && mergeable(r)).length >= 4 && !S.rooms.some(r => mergeable(r) && groupSize(r) >= 2), t: 'Des grandes salles', x: 'Colle deux pièces du même type l’une contre l’autre : elles fusionnent en une grande salle (+1 Ambiance) et débloquent des stickers améliorés, comme le Grand lit commun ou la Broche à rôtir géante.', wiki: 'fusion' },
  { id: 'faim', when: () => eaters() > foodCap(), t: 'Des ventres vides !', x: 'Tu as plus de bouches que de repas. Les affamés boudent et la Calamité monte. Meuble un {room:potager} ou une {room:cuisine}.', wiki: 'lits_repas' },
  { id: 'lits', when: () => S.night > 1 && S.creatures.length >= beds(), t: 'Plus un lit de libre', x: 'Plus aucune créature ne peut s’installer. Touche un Dortoir (ou une autre chambre) et colle-y des lits depuis sa fiche : {furn:paillasse}, {furn:litsup}, {furn:cercueil}…', wiki: 'lits_repas' },
  { id: 'calam', when: () => S.calamity >= CAL_MAX - 2, t: 'La Calamité gronde', x: 'L’horloge de Calamité est presque pleine : une catastrophe va tomber. Nourris tout le monde, soigne l’Ambiance, ou construis un {room:labo}.', wiki: 'calamite' },
  { id: 'menace', when: () => S.menace >= MENACE_MAX - 2, t: 'Des héros approchent', x: 'La Menace est presque pleine : des aventuriers attaqueront bientôt. Pose des pièges dans les couloirs qui bordent tes pièces, et évite d’épuiser tes créatures en raids : une créature épuisée ne défend pas, et tes plus fortes doivent être reposées pour tenir le Cœur.', wiki: 'invasion' },
  { id: 'boude', when: () => S.creatures.some(c => c.mood <= 1), t: 'Quelqu’un boude', x: 'Une créature boude : sa compétence est éteinte. Ouvre sa fiche pour voir ce qui cloche (faim, sticker préféré, poste), et comble son envie.', wiki: 'humeur' },
  { id: 'palier', when: () => { const s = tierStatus(); return !!(s && s.ok); }, t: 'Palier disponible', x: 'Tu remplis toutes les conditions du palier suivant ! Touche le Cœur du donjon (l’étoile dorée brille au-dessus) et monte de palier depuis sa fiche.', wiki: 'paliers' },
  { id: 'raid1', when: () => S.stats.raidsWon >= 1, t: 'Premier butin', x: 'Bravo ! Garde un œil sur la Menace : chaque raid la fait monter.', wiki: 'raids' },
  { id: 'invasion1', when: () => S.stats.invasions >= 1, t: 'Ta première invasion', x: 'Chaque pièce qu’ils pillent rend la bande plus forte… mais une bande repoussée rend tout ce qu’elle a pris, avec une prime. Elle ne fuit jamais : elle va jusqu’au Cœur, sauf si tous ses héros tombent en chemin. Un héros à terre dans une pièce, et la pièce tient : la bande ne la pille pas.', wiki: 'invasion' },
  { id: 'album', when: () => Object.keys(S.album).length >= 4, t: 'Ton album se remplit', x: 'Chaque pièce meublée attire une espèce différente. Le bestiaire du Grimoire dit qui vient d’où.', wiki: 'creatures' },
];
function advisorShow(o) {
  const a = $('#advisor'); a.hidden = false; a.className = 'advisor' + (o.cls ? ' ' + o.cls : '');
  a.innerHTML = `<div class="adv-pic" title="Fais-moi glisser pour voir ce que je cache (deux touchers : je reviens)"><img alt="" src="${portrait('diablotin')}"></div><span class="adv-grip" aria-hidden="true">✥</span><div class="adv-box"><div class="adv-head"><b>${esc(o.title)}</b>${o.step ? `<small>${o.step}/${o.total}</small>` : ''}</div>
    <div class="adv-text">${wikiText(esc(o.text).replace(/&amp;/g, '&'))}</div><div class="adv-btns">${(o.buttons || []).map(b => `<button type="button" class="sbtn${b.pri ? ' pri' : ''}${b.side ? ' side' : ''}" data-adv="${b.id}">${esc(b.label)}</button>`).join('')}${o.wiki ? `<button type="button" class="sbtn" data-adv="wiki" data-wid="${o.wiki}">📖 En savoir plus</button>` : ''}${o.skip ? '<button type="button" class="link" data-adv="skip">Passer le tutoriel</button>' : ''}</div></div>`;
  advPlace();
}
// Gribouille se déplace : on le prend par le visage, avec sa bulle, pour voir ce qu'il cache (deux touchers rapides le remettent à sa place)
const ADVM = { x: 0, y: 0, drag: null, tap: 0 };
function advPlace() {
  const a = $('#advisor'); if (!a) return;
  a.style.translate = ADVM.x || ADVM.y ? `${ADVM.x}px ${ADVM.y}px` : '';
  if (a.hidden || (!ADVM.x && !ADVM.y)) return;
  const p = a.querySelector('.adv-pic'), r = p && p.getBoundingClientRect(); if (!r || !r.width) return;
  const m = 6; let dx = 0, dy = 0;   // son visage reste toujours à l'écran, pour pouvoir le reprendre
  if (r.left < m) dx = m - r.left; else if (r.right > innerWidth - m) dx = innerWidth - m - r.right;
  if (r.top < m) dy = m - r.top; else if (r.bottom > innerHeight - m) dy = innerHeight - m - r.bottom;
  if (dx || dy) { ADVM.x += dx; ADVM.y += dy; a.style.translate = `${ADVM.x}px ${ADVM.y}px`; }
}
function advisorHide() { const a = $('#advisor'); if (a) a.hidden = true; TUTO.tip = null; TUTO.tipObj = null; }
function showStep(st) {
  const live = TUTO_STEPS.filter(s => !s.gone), i = live.indexOf(st), btns = [];
  if (st.btn === 'next') btns.push({ id: 'next', label: 'Suivant', pri: true });
  if (st.btn === 'later') btns.push({ id: 'next', label: 'Passer cette étape', side: true });
  if (st.btn === 'end') btns.push({ id: 'end', label: 'Terminer', pri: true }, { id: 'grim', label: '📖 Ouvrir le Grimoire' });
  if (!st.btn) btns.push({ id: 'hide', label: 'Ranger le conseil', side: true });   // l'étape attend une action : on peut la ranger (une pastille 🎓 la rouvre)
  advisorShow({ title: st.t, text: st.x, step: i + 1, total: live.length, buttons: btns, skip: st.btn !== 'end', cls: 'tuto' });
}
function nextStep() { if (!S.tuto) return; const hid = !!S.tuto.hid; S.tuto.i++; delete S.tuto.hid; delete S.tuto.n0; if (hid && TUTO_STEPS[S.tuto.i]) S.tuto.hid = TUTO_STEPS[S.tuto.i].id; TUTO.shown = null; TUTO.cells = null; sfx('chime'); save(); tutoTick(); }
function startTutorial() { S.tuto = { on: true, i: 0, asked: true }; TUTO.shown = null; TUTO.flags = {}; save(); tutoTick(); }
function tutoTick() {
  document.querySelectorAll('.tuto-glow').forEach(e => { if (!(typeof MAPT !== 'undefined' && MAPT.on && e.closest('#wpanel'))) e.classList.remove('tuto-glow'); });   // la visite de la carte garde son éclairage
  V.tutoCells = null;
  const wv = document.getElementById('world');
  if (!S || !S.started || UI.busy || ADMIN.open || VISIT || COOP.role === 'guest' || (wv && !wv.hidden) || document.body.classList.contains('crawling')) { const a = $('#advisor'); if (a && !(typeof MAPT !== 'undefined' && MAPT.on && wv && !wv.hidden)) a.hidden = true; return; }   // sur la carte, seule sa visite guidée parle
  if (TUTO.of !== S) { TUTO.of = S; TUTO.pending = null; TUTO.shown = null; TUTO.flags = {}; TUTO.tip = null; TUTO.tipObj = null; TUTO.cam0 = null; }
  const T = S.tuto;
  if (T && T.on) {
    if (TUTO.pending) { TUTO.pending = null; renderGoals(); }   // pas de conseil 💡 pendant le tutoriel
    while (TUTO_STEPS[T.i] && TUTO_STEPS[T.i].gone) T.i++;   // une étape retirée du jeu : on passe sans l'afficher
    const st = TUTO_STEPS[T.i];
    if (!st) { T.on = false; T.done = true; save(); advisorHide(); return; }
    if ($('#modalRoot').children.length && !(st.target && document.querySelector('#modalRoot ' + st.target))) { $('#advisor').hidden = true; if (st.until) { let ok = false; try { ok = !!st.until(); } catch (e) {} if (ok) nextStep(); } return; }
    if (T.hid === st.id) { $('#advisor').hidden = true; let ok = false; try { ok = !!(st.until && st.until()); } catch (e) {} if (ok) nextStep(); return; }   // rangée par le joueur : elle attend sans s'afficher
    if (TUTO.shown !== st.id) { TUTO.shown = st.id; if (st.enter) st.enter(); if (st.target && UI.build && innerWidth <= 640 && !document.querySelector('#hudBottom ' + st.target)) closeBuild(); TUTO.cells = st.cells ? st.cells() : null; showStep(st); }
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
  if (TUTO.pending) { const p = TUTO.pending; let ok = false; try { ok = !(S.tips && S.tips[p.id]) && p.when(); } catch (e) {} if (ok) return; TUTO.pending = null; renderGoals(); }
  // 12. une bulle de conseil cachée par la nuit, la carte ou une expédition revient ensuite
  if (TUTO.tip && TUTO.tipObj && $('#advisor').hidden) { const t = TUTO.tipObj; advisorShow({ title: t.t, text: t.x, buttons: [{ id: 'ok', label: 'Compris', pri: true }], wiki: t.wiki, cls: 'tip' }); TUTO.tip = t.id; return; }
  // 9. un nouveau conseil par nuit au plus, et pas celui qu'une pastille dit déjà
  if (S.tipN === S.night) return;
  const DUP = { faim: 'food', lits: 'beds', palier: 'tier', renommee: 'fame' };
  const tip = TIPS.find(t => { if (S.tips && S.tips[t.id]) return false; if (DUP[t.id] && document.querySelector(`#notifs [data-n="${DUP[t.id]}"]`)) return false; try { return t.when(); } catch (e) { return false; } });
  if (tip) { TUTO.pending = tip; renderGoals(); }
}
function bindTutorial() {
  { const adv = $('#advisor');
    adv.addEventListener('pointerdown', e => { const p = e.target.closest('.adv-pic'); if (!p) return; e.preventDefault(); try { p.setPointerCapture(e.pointerId); } catch (x) {} ADVM.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, x0: ADVM.x, y0: ADVM.y, moved: false }; });
    adv.addEventListener('pointermove', e => { const d = ADVM.drag; if (!d || e.pointerId !== d.id) return; const dx = e.clientX - d.x, dy = e.clientY - d.y; if (!d.moved && Math.hypot(dx, dy) > 6) { d.moved = true; adv.classList.add('moving'); } if (d.moved) { ADVM.x = d.x0 + dx; ADVM.y = d.y0 + dy; advPlace(); } });
    const up = e => { const d = ADVM.drag; if (!d || e.pointerId !== d.id) return; ADVM.drag = null; adv.classList.remove('moving'); if (d.moved || e.type !== 'pointerup') return; const now = performance.now(); if (now - ADVM.tap < 380) { ADVM.x = ADVM.y = 0; ADVM.tap = 0; advPlace(); sfx('tick'); } else ADVM.tap = now; };
    adv.addEventListener('pointerup', up); adv.addEventListener('pointercancel', up);
    addEventListener('resize', () => requestAnimationFrame(advPlace)); }
  $('#advisor').addEventListener('click', e => {
    const a = e.target.closest('[data-wiki]'); if (a) { e.preventDefault(); openGrimoire(a.dataset.wiki); return; }
    const b = e.target.closest('[data-adv]'); if (!b) return;
    const act = b.dataset.adv;
    if (act === 'next') nextStep();
    else if (act === 'skip') { S.tuto.on = false; S.tuto.skipped = true; save(); advisorHide(); toast('Tutoriel passé. Tu peux le relancer depuis le menu ☰.'); }
    else if (act === 'end') { S.tuto.on = false; S.tuto.done = true; save(); advisorHide(); }
    else if (act === 'grim') { S.tuto.on = false; S.tuto.done = true; save(); advisorHide(); openGrimoire(); }
    else if (act === 'ok') advisorHide();
    else if (act === 'hide') { const st = S.tuto && TUTO_STEPS[S.tuto.i]; if (st) { S.tuto.hid = st.id; save(); } advisorHide(); if (typeof renderGoals === 'function') renderGoals(); toast('Gribouille attend : la pastille 🎓, à droite, rouvre le tutoriel.'); }
    else if (act === 'wiki') { advisorHide(); openGrimoire(b.dataset.wid); }
    else if (act === 'start') startTutorial();
  });
  $('#res').addEventListener('click', e => { const c = e.target.closest('[data-k]'); if (c && c.dataset.k === 'glow') { if (!UI.busy) openRadiance(); return; } if (c && CHIP_WIKI[c.dataset.k]) openGrimoire(CHIP_WIKI[c.dataset.k]); });
  $('#clocks').addEventListener('click', e => { const d = e.target.closest('.dial'); if (d) openGrimoire(d === $('#clocks').firstElementChild ? 'calamite' : 'menace'); });
  $('#sheet').addEventListener('contextmenu', e => { const c = e.target.closest('.card'); if (!c) return; e.preventDefault(); if (typeof TOUCHUI !== 'undefined' && TOUCHUI.on) return; openGrimoire(`${c.dataset.kind}:${c.dataset.t}`); });
  $('#modalRoot').addEventListener('click', e => { const b = e.target.closest('[data-wiki-open]'); if (b) openGrimoire(b.dataset.wikiOpen); });
  $('#zfit').addEventListener('click', () => { TUTO.flags.cam = true; });
  setInterval(() => { if (ADVM.x || ADVM.y) advPlace(); }, 700);
  setInterval(tutoTick, 700);
}
function showPendingTip() {
  const tip = TUTO.pending; if (!tip) return;
  TUTO.pending = null; (S.tips = S.tips || {})[tip.id] = true; S.tipN = S.night; save(); TUTO.tip = tip.id; TUTO.tipObj = tip;
  advisorShow({ title: tip.t, text: tip.x, buttons: [{ id: 'ok', label: 'Compris', pri: true }], wiki: tip.wiki, cls: 'tip' }); renderGoals();
}
