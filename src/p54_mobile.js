/* =========================================================
   Le téléphone : un doigt n'est pas une souris
   - Le « clic fantôme » : sur le château et sur la carte, un
     toucher agit dès que le doigt se lève ; le navigateur envoie
     ensuite un click au même endroit, qui tombait sur le panneau
     tout juste ouvert (et le refermait, ou touchait un de ses
     boutons). On l'avale.
   - En mode Gardes, toucher une pièce y poste la créature choisie
     au lieu d'ouvrir sa fiche.
   - La fiche « Nouvelle espèce » se ferme en touchant le château.
   ========================================================= */
const GHOST = { t: 0, x: 0, y: 0, el: null };
if (typeof addEventListener === 'function') {
  addEventListener('pointerup', e => { if (e.pointerType === 'mouse') return; GHOST.t = performance.now() + 600; GHOST.x = e.clientX; GHOST.y = e.clientY; GHOST.el = e.target; }, true);
  addEventListener('click', e => {
    if (performance.now() > GHOST.t || !GHOST.el) return;
    const born = GHOST.el.tagName === 'CANVAS' || !GHOST.el.isConnected;   // un toucher sur une toile (château, carte), ou un élément qui a disparu entre-temps
    if (!born || e.target === GHOST.el || Math.hypot(e.clientX - GHOST.x, e.clientY - GHOST.y) > 40) return;
    GHOST.t = 0; e.stopPropagation(); e.preventDefault();
  }, true);
}
const tapMobile = tap;
tap = function (e) {
  if (typeof GM !== 'undefined' && GM.on) return;   // le mode Gardes s'en charge (au click)
  if (typeof V !== 'undefined' && V.spotOn) { const b = document.querySelector('.spot #spGo'); if (b) b.click(); return; }
  return tapMobile(e);
};

/* ---------- la mise en page : les colonnes de gauche et de droite entre la barre du haut et le bas de l'écran ---------- */
function hudLayout() {
  if (typeof document === 'undefined' || !document.getElementById) return;
  const top = document.getElementById('hudTop'), lp = document.getElementById('leftPanel'), hb = document.getElementById('hudBuild'), nt = document.getElementById('notifs'), ha = document.getElementById('hudActions');
  if (!top) return;
  const tb = Math.round(top.getBoundingClientRect().bottom); document.documentElement.style.setProperty('--hudTopB', tb + 'px');
  // la colonne des créatures s'arrête au-dessus des étages (et de « Construire »)
  if (lp && hb && !lp.hidden) { const lt = lp.getBoundingClientRect().top, bt = hb.getBoundingClientRect().top; if (bt > lt) lp.style.maxHeight = Math.max(120, Math.round(bt - lt - 12)) + 'px'; }
  // les notifications s'arrêtent au-dessus de la mini-carte
  // feuille de construction ouverte : le conseiller se pose juste au-dessus (sinon il cache les onglets et les cartes qu'il demande de prendre)
  const sh = document.getElementById('hudBottom'), adv = document.getElementById('advisor');
  if (sh && !sh.hidden && sh.offsetParent) { const gh = sh.offsetParent.clientHeight, up = gh - sh.offsetTop, ah = adv && !adv.hidden ? adv.offsetHeight : 220; document.documentElement.style.setProperty('--sheetUp', Math.round(Math.max(0, Math.min(up + 10, gh - tb - ah - 8))) + 'px'); }
  if (nt && ha) { const lim = ha.getBoundingClientRect().top - 8; [...nt.children].forEach(n => { n.style.display = ''; }); [...nt.children].forEach(n => { if (n.getBoundingClientRect().bottom > lim) n.style.display = 'none'; }); }   // celles qui ne tiennent pas attendent leur tour (les plus urgentes sont en haut)
}
if (typeof addEventListener === 'function' && typeof document !== 'undefined') {
  addEventListener('resize', () => requestAnimationFrame(hudLayout));
  addEventListener('load', () => requestAnimationFrame(hudLayout));
  try { document.fonts && document.fonts.ready.then(() => requestAnimationFrame(hudLayout)); } catch (e) {}
  setInterval(() => { if (!document.hidden) hudLayout(); }, 2000);   // les compteurs qui grandissent peuvent faire passer la barre du haut sur deux lignes
  try { const ro = new ResizeObserver(() => requestAnimationFrame(hudLayout)); setTimeout(() => ['hudTop', 'hudBuild', 'hudActions', 'leftPanel', 'hudBottom', 'advisor'].forEach(id => { const e = document.getElementById(id); if (e) ro.observe(e); }), 0); } catch (e) {}
}
const renderAllMobile = renderAll;
renderAll = function (...a) { const r = renderAllMobile(...a); try { hudLayout(); } catch (e) {} return r; };

/* ---------- poser un sticker au doigt ----------
   Au doigt, on ne voit pas sous son doigt et glisser déplaçait la vue. Désormais, avec un sticker en main :
   le sticker apparaît tout de suite à un bon endroit (dans la pièce qu'on meuble, la vue zoomée dessus),
   un doigt le fait glisser (il suit le doigt de loin, sans être caché), deux doigts déplacent et zooment la vue,
   et « Poser ici » (ou un toucher sur le sticker) le colle. Le tiroir des cartes s'efface le temps de poser. */
const TOUCHUI = { on: false };
if (typeof addEventListener === 'function' && typeof document !== 'undefined') addEventListener('pointerdown', e => {
  const t = e.pointerType !== 'mouse'; if (t === TOUCHUI.on) return;
  TOUCHUI.on = t; document.body.classList.toggle('touchy', t);
  if (t && UI.handInfo === undefined) UI.handInfo = false;   // au doigt, les effets se replient (un bouton les rouvre)
}, true);
// le point de l'écran qui pose le sticker à l'ancre (ax, ay)
function ghostPtAt(ax, ay) {
  const h = UI.hand, cx = h.kind === 'room' ? ax + h.w / 2 : ax + .5, cy = h.kind === 'room' ? ay + h.h / 2 : ay + .5;
  const [sx, sy] = toScreen(...WP(cx, cy)), r = cv.getBoundingClientRect(); return { x: r.left + sx, y: r.top + sy, mouse: false };
}
// le bon endroit le plus proche : dans la pièce qu'on meuble, sinon au milieu de l'écran
function findSpot(room) {
  const h = UI.hand; if (!h) return null;
  let cx, cy;
  if (room) { cx = room.x + room.w / 2; cy = room.y + room.h / 2; }
  else { const r = cv.getBoundingClientRect(), [gx, gy] = tileAtScreen(r.width / 2, r.height * .45); cx = gx; cy = gy; }
  const cand = []; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) cand.push([x, y, (x + .5 - cx) ** 2 + (y + .5 - cy) ** 2]);
  cand.sort((a, b) => a[2] - b[2]);
  for (const [x, y] of cand.slice(0, 500)) {
    const ax = h.kind === 'room' ? Math.round(x + .5 - h.w / 2) : x, ay = h.kind === 'room' ? Math.round(y + .5 - h.h / 2) : y;
    try { if (!validate({ inside: true, x: ax, y: ay })) return [ax, ay]; } catch (e) {}
  }
  return null;
}
// zoomer la vue sur une pièce (pour la meubler)
function focusRoom(r) {
  const s = clamp(Math.max(CAM.s, Math.min(CAM.max, CAM.s * 1.9)), CAM.min, CAM.max), [wx, wy] = WP(r.x + r.w / 2, r.y + r.h / 2);
  CAM.s = s; CAM.x = V.w * .5 - wx * s; CAM.y = V.h * .42 - wy * s; CAM.user = true; clampCam(); V.dirty = true;
}
const openRoomTouch = openRoom;
openRoom = function (id) { UI.lastRoom = id; return openRoomTouch(id); };
const takeStickerTouch = takeSticker;
takeSticker = function (kind, t) {
  const ok = takeStickerTouch(kind, t);
  if (ok && TOUCHUI.on && UI.hand) {
    document.body.classList.add('placing');
    const room = kind === 'furn' && UI.lastRoom ? S.rooms.find(o => o.id === UI.lastRoom && zOf(o) === Z && (o.t === FURN[t].room || ROOMS[o.t].like === FURN[t].room)) : null;
    if (room) focusRoom(room);
    const sp = findSpot(room); UI.gpt = sp ? ghostPtAt(sp[0], sp[1]) : (() => { const r = cv.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * .45, mouse: false }; })();
    UI.lastPt = UI.gpt; UI.ghostKey = null; updateGhost(UI.gpt); renderHand();
  }
  return ok;
};
const dropStickerTouch = dropSticker;
dropSticker = function () { dropStickerTouch(); try { document.body.classList.remove('placing'); } catch (e) {} UI.gpt = null; };
function putHere() { const g = V.ghost; if (!UI.hand || !g || !g.ok) { sfx('bad'); return; } const pt = ghostPtAt(g.ax, g.ay); tryPlace({ inside: true, x: g.ax, y: g.ay }, false); if (UI.hand) { UI.gpt = UI.lastPt = pt; UI.ghostKey = null; updateGhost(pt); renderHand(); } }
const rotateHandTouch = rotateHand;
rotateHand = function () { if (TOUCHUI.on && UI.hand && V.ghost) { const pt = ghostPtAt(V.ghost.ax, V.ghost.ay); UI.gpt = UI.lastPt = pt; } return rotateHandTouch(); };
const renderHandTouch = renderHand;
renderHand = function (msg, tone) {
  renderHandTouch(msg, tone);
  if (!UI.hand || !TOUCHUI.on) return;
  const hb = document.getElementById('handbar'); if (!hb) return;
  if (UI.hand.move && !UI.gpt) { document.body.classList.add('placing'); const sp = findSpot(null); UI.gpt = UI.lastPt = sp ? ghostPtAt(sp[0], sp[1]) : (() => { const r = cv.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height * .45, mouse: false }; })(); UI.ghostKey = null; updateGhost(UI.gpt); return renderHand(msg, tone); }
  if (!msg && !UI.hand.move) { const m = hb.querySelector('.msg'); if (m) m.innerHTML = `<b>${esc(itemName(UI.hand.t))}</b> (${costText(costOf(UI.hand.kind, UI.hand.t))}) : fais-le glisser du doigt, puis « Poser ici ».`; }
  const ok = !!(V.ghost && V.ghost.ok), b = el('button', 'pill put' + (ok ? ' ok' : ''), `${gi('check')} Poser ici`); b.id = 'btnPut'; b.type = 'button'; b.disabled = !ok; b.onclick = putHere;
  const drop = hb.querySelector('#btnDrop'); drop ? hb.insertBefore(b, drop) : hb.appendChild(b);
};
// le doigt sur le château, sticker en main : un doigt fait glisser le sticker, un second doigt rend la main à la vue (pincer, déplacer)
const TP = { id: null, pass: false };
if (typeof cv !== 'undefined' && cv && cv.addEventListener) {
  cv.addEventListener('pointerdown', e => {
    if (TP.pass || !UI.hand || e.pointerType === 'mouse') return;
    if (TP.id != null && TP.id !== e.pointerId) {   // un deuxième doigt : la vue reprend la main (on lui présente aussi le premier doigt)
      const first = TP.id; TP.id = null; TP.pass = true;
      try { cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: first, pointerType: 'touch', isPrimary: true, clientX: TP.lx, clientY: TP.ly })); } finally { TP.pass = false; }
      return;
    }
    e.stopImmediatePropagation(); e.preventDefault();
    const g = V.ghost ? ghostPtAt(V.ghost.ax, V.ghost.ay) : UI.gpt || { x: e.clientX, y: e.clientY - 60 };   // la vue a pu bouger (deux doigts) : on repart d'où est le sticker
    Object.assign(TP, { id: e.pointerId, x0: e.clientX, y0: e.clientY, lx: e.clientX, ly: e.clientY, gx0: g.x, gy0: g.y, moved: false });
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
  }, true);
  cv.addEventListener('pointermove', e => {
    if (TP.id !== e.pointerId) return; e.stopImmediatePropagation();
    TP.lx = e.clientX; TP.ly = e.clientY; const dx = e.clientX - TP.x0, dy = e.clientY - TP.y0;
    if (!TP.moved && Math.hypot(dx, dy) > 6) TP.moved = true;
    if (TP.moved) { UI.gpt = { x: TP.gx0 + dx, y: TP.gy0 + dy, mouse: false }; UI.lastPt = UI.gpt; updateGhost(UI.gpt); }
  }, true);
  const tpUp = e => {
    if (TP.id !== e.pointerId) return; e.stopImmediatePropagation(); TP.id = null;
    if (e.type !== 'pointerup' || TP.moved) return;
    // un toucher : sur le sticker, on le colle ; ailleurs, il vient sous le doigt
    const r = cv.getBoundingClientRect(), [gx, gy] = tileAtScreen(e.clientX - r.left, e.clientY - r.top), tx = Math.floor(gx), ty = Math.floor(gy);
    if (V.ghost && V.ghost.ok && V.ghost.cells.some(([x, y]) => x === tx && y === ty)) { putHere(); return; }
    UI.gpt = { x: e.clientX, y: e.clientY, mouse: false }; UI.lastPt = UI.gpt; updateGhost(UI.gpt); renderHand();
  };
  cv.addEventListener('pointerup', tpUp, true); cv.addEventListener('pointercancel', tpUp, true);
}

/* ---------- des actions lisibles au doigt ----------
   À la souris, on survole un bouton pour savoir ce qu'il fait ; au doigt, jamais. Donc :
   des étiquettes sous les boutons du bas et de la colonne de gauche, le texte des 3 notifications les plus
   importantes, un appui long qui montre ce que fait n'importe quel bouton (sans le déclencher), et un petit
   rappel des gestes au premier toucher sur le château. */
const ACT_LABELS = { zfit: 'Cadrer', btnPath: 'Chemin', btnRaid: 'Raids', btnTier: 'Cœur', btnVal: 'Le Val', btnBest: 'Album', btnRen: 'Renom', btnAch: 'Exploits', btnQuests: 'Quêtes' };
function labelActs() { Object.entries(ACT_LABELS).forEach(([id, t]) => { const b = document.getElementById(id); if (b && !b.querySelector('.albl')) { const s = document.createElement('span'); s.className = 'albl'; s.textContent = t; b.appendChild(s); } }); }
// ce que fait chaque bouton, en une phrase (l'appui long au doigt)
const LP_HELP = {
  zfit: 'Recadrer : remet tout le château à l’écran.',
  btnRaid: 'Raids et expéditions, deux onglets : un raid aux dés pille un village, une ferme ou le Baron (résultat à la fin de la nuit) ; une expédition aux cartes part dans un donjon, un lieu d’expédition ou à Mirebrume (jouée cette nuit) et rapporte l’Ambre 🟠.',
  btnTier: 'Cœur du donjon : monter de palier, ouvrir des étages, agrandir les remparts, lancer un grand chantier.',
  btnVal: 'Le Val des Maîtres : les châteaux des autres joueurs, en ligne.',
  btnBest: 'Album : toutes les espèces que tu as accueillies, et celles qui manquent.',
  btnRen: 'Réputation : ce que pensent de toi les espèces (elle décide qui vient, et qui reste).',
  btnAch: 'Le Livre du Maître : tes moments marquants en stickers, un chapitre par ère.',
  btnQuests: 'Journal des quêtes : quêtes en cours, tableau des nouvelles quêtes, envies des créatures.',
  btnBuild: 'Construire : pièces, pièges, déco et trésors à coller sur le château.',
  btnNight: 'Finir la nuit : tes créatures travaillent, les raids partent, des héros attaquent peut-être… puis vient l’aube et sa chronique.',
  btnMenu: 'Menu : sauvegardes, nouvelle partie, réglages.',
  btnHelp: 'Le Grimoire : toutes les règles du jeu.',
  btnAdmin: 'L’Atelier du Maître : régler le jeu (outils avancés).',
  btnSound: 'Son : l’activer ou le couper.',
  btnCrit: 'Tes créatures : afficher ou replier la liste.',
};
// l'appui long : une bulle avec ce que fait l'élément touché
const LP = { t: null, x: 0, y: 0, suppress: 0, bubble: null, hideT: null };
function lpText(el) {
  if (el.classList.contains('notif')) { const n = el.querySelector('.nl'); return n ? n.textContent : ''; }
  if (el.id && LP_HELP[el.id]) return LP_HELP[el.id];
  if (el.closest('.minimap')) return 'Carte du Val : villages, villes, lieux à explorer et donjons rivaux.';
  const al = (el.getAttribute('aria-label') || '').trim(), ti = (el.getAttribute('title') || (el.dataset && el.dataset.tip) || '').trim(), s = ti.length > al.length ? ti : al;   // le texte le plus complet
  const res = el.closest('.res, .dial'); if (res && (res.title || res.dataset.tip)) return res.title || res.dataset.tip;
  return s;
}
function lpShow(el) {
  clearTimeout(LP.hideT);
  if (el.classList.contains('card') && typeof showTip === 'function') { showTip(el); LP.card = true; return; }
  const txt = lpText(el); if (!txt) return;
  let b = LP.bubble; if (!b) { b = LP.bubble = document.createElement('div'); b.className = 'lptip'; b.setAttribute('role', 'tooltip'); document.body.appendChild(b); }
  b.textContent = txt; b.hidden = false;
  const r = el.getBoundingClientRect(), w = Math.min(280, innerWidth - 24); b.style.maxWidth = w + 'px';
  const bw = b.offsetWidth, bh = b.offsetHeight, above = r.top - bh - 10 > 8;
  b.style.left = clamp(r.left + r.width / 2 - bw / 2, 12, innerWidth - bw - 12) + 'px'; b.style.top = (above ? r.top - bh - 10 : r.bottom + 10) + 'px';
  try { navigator.vibrate && navigator.vibrate(12); } catch (e) {}
}
function lpHide() { if (LP.bubble) LP.bubble.hidden = true; if (LP.card && typeof showTip === 'function') { showTip(null); LP.card = false; } }
if (typeof addEventListener === 'function' && typeof document !== 'undefined') {
  addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return; lpHide(); LP.fired = false;   // un nouveau geste : le click à venir est le sien
    const el = e.target && e.target.closest && e.target.closest('.card, .notif, button, [role=button], .res, .dial, [title], [aria-label]');
    if (!el || el === cv || el.tagName === 'CANVAS' || (typeof GM !== 'undefined' && GM.on && el.closest('#portraits')) || el.closest('#crawlPage .hand')) return;   // la main d'expédition a son propre appui : la carte grandit
    clearTimeout(LP.t); LP.x = e.clientX; LP.y = e.clientY;
    LP.t = setTimeout(() => { LP.t = null; if (!lpText(el) && !el.classList.contains('card')) return; lpShow(el); LP.fired = true; }, 480);
  }, true);
  addEventListener('pointermove', e => { if (LP.t && Math.hypot(e.clientX - LP.x, e.clientY - LP.y) > 10) { clearTimeout(LP.t); LP.t = null; } }, true);
  const lpEnd = () => { if (LP.t) { clearTimeout(LP.t); LP.t = null; } if ((LP.bubble && !LP.bubble.hidden) || LP.card) { clearTimeout(LP.hideT); LP.hideT = setTimeout(lpHide, 2200); } };
  addEventListener('pointerup', lpEnd, true); addEventListener('pointercancel', lpEnd, true);
  // après un appui long, le relâchement ne déclenche pas l'action
  addEventListener('click', e => { if (LP.fired) { LP.fired = false; e.stopPropagation(); e.preventDefault(); } }, true);   // seulement le click de ce geste-là, même gardé longtemps ; le toucher suivant passe
  addEventListener('contextmenu', e => { if (e.target && e.target.closest && e.target.closest('#game, #modalRoot')) e.preventDefault(); }, true);
  setTimeout(labelActs, 0);
}
// le premier toucher sur le château : un rappel des gestes (une seule fois)
const TOUCH_HELP = '<b>Au doigt</b><ul><li>Touche une pièce, un meuble ou une créature pour ouvrir sa fiche.</li><li>Un doigt déplace la vue, deux doigts zooment.</li><li>Appui long sur un bouton : ce qu’il fait.</li><li>Pour construire : choisis une carte, fais glisser le sticker du doigt, puis « Poser ici ».</li></ul>';
function touchHelp(force) {
  if (!force && (typeof uiPrefs !== 'function' || uiPrefs().touchHelp)) return;
  const adv = document.getElementById('advisor'); if (!force && adv && !adv.hidden) return;   // pas par-dessus Gribouille : il reviendra au prochain toucher
  if (typeof uiPrefs === 'function') uiPrefs({ touchHelp: 1 });
  const d = document.createElement('div'); d.className = 'touchhelp'; d.innerHTML = `${TOUCH_HELP}<button type="button" class="sbtn pri small">C’est noté</button>`;
  document.body.appendChild(d); const bye = () => { d.classList.add('out'); setTimeout(() => d.remove(), 300); };
  d.querySelector('button').addEventListener('click', bye); setTimeout(bye, 14000);
}
if (typeof cv !== 'undefined' && cv && cv.addEventListener) cv.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse' && S && S.started && !document.querySelector('#modalRoot .modal')) touchHelp(); }, true);
// au doigt, pas de raccourci clavier dans les boutons
const renderHandKbd = renderHand;
renderHand = function (msg, tone) { if (TOUCHUI.on && UI.handInfo == null) UI.handInfo = false;   // au doigt, le détail des effets reste replié (il cachait la moitié du château) : le bouton « Effets » l'ouvre
  renderHandKbd(msg, tone); if (TOUCHUI.on) { const r = document.getElementById('btnRot'); if (r) r.textContent = '⟳ Tourner'; } };
// iPhone : pas de zoom de la page au pincement (Safari ignore parfois user-scalable=no)
if (typeof document !== 'undefined' && document.addEventListener) ['gesturestart', 'gesturechange'].forEach(t => document.addEventListener(t, e => { try { e.preventDefault(); } catch (err) {} }, { passive: false }));
// au doigt, l'étiquette d'une pastille s'affiche quelques secondes quand elle apparaît, puis seule l'icône reste (appui long pour la relire)
const NFRESH = new Map();
function notifFresh() {
  if (!TOUCHUI.on) return; const now = Date.now(), live = new Set();
  let shown = 0;   // trois étiquettes au plus à la fois (au chargement d'une grosse partie, sept étiquettes couvraient le château)
  document.querySelectorAll('#notifs .notif').forEach(n => { const k = n.dataset.n + '|' + (n.getAttribute('aria-label') || ''); live.add(k); if (!NFRESH.has(k)) NFRESH.set(k, now); const f = now - NFRESH.get(k) < 7000 && shown < 3 && n.style.display !== 'none'; if (f) shown++; n.classList.toggle('fresh', f); });
  [...NFRESH.keys()].forEach(k => { if (!live.has(k)) NFRESH.delete(k); });
}
const renderGoalsMobile = renderGoals;
renderGoals = function (...a) { const r = renderGoalsMobile(...a); try { notifFresh(); } catch (e) {} return r; };
if (typeof setInterval === 'function' && typeof document !== 'undefined') setInterval(() => { if (!document.hidden) try { notifFresh(); } catch (e) {} }, 1000);
// mode Gardes sur petit écran : l'explication se replie à partir de la troisième ouverture (le bouton « ? » la rouvre)
const guardModeMobile = guardMode;
guardMode = function (on) { if (on && !GM.on && typeof uiPrefs === 'function') uiPrefs({ ghN: (uiPrefs().ghN || 0) + 1 }); GM.help = false; return guardModeMobile(on); };
const guardHudMobile = guardHud;
guardHud = function () {
  guardHudMobile();
  const h = typeof document !== 'undefined' && document.getElementById && document.getElementById('guardHud'); if (!h || !GM.on || GM.sel) return;
  if (!(TOUCHUI.on || innerWidth <= 640) || typeof uiPrefs !== 'function' || (uiPrefs().ghN || 0) <= 2) return;
  const p = h.querySelector('p'), top = h.querySelector('.gh-top'); if (!p || !top) return;
  p.hidden = !GM.help;
  const q = document.createElement('button'); q.type = 'button'; q.className = 'sbtn'; q.textContent = GM.help ? '✕ Aide' : '? Aide'; q.setAttribute('aria-expanded', String(!!GM.help));
  q.addEventListener('click', () => { GM.help = !GM.help; guardHud(); }); top.insertBefore(q, top.querySelector('[data-gm="clear"]'));
};
// la main d'une expédition : sur grand écran, les cartes se resserrent pour tenir toutes (la carte survolée remonte) ;
// au doigt, la main défile et un repère dit combien de cartes attendent à droite
function fitHand() {
  const page = document.getElementById('crawlPage'), h = page && page.querySelector('.hand'); if (!h) return;
  const cards = [...h.querySelectorAll('.kcard')], small = innerWidth <= 760 || innerHeight <= 500;
  // les cartes se recouvrent juste ce qu'il faut pour que toute la main tienne (au doigt, l'écart reste de 8 px si elles tiennent déjà)
  // à l'ordinateur : de la place, les cartes s'écartent et grandissent (jusqu'à +20 %) ; trop de cartes, elles se recouvrent juste ce qu'il faut, et grandissent franchement au survol
  if (!small) {
    const n = cards.length, base = n ? parseFloat(getComputedStyle(cards[0]).width) || 128 : 128, gap = 6, avail = h.clientWidth - 28;   // la largeur CSS, sans le zoom ni le survol
    const z = n ? Math.max(1, Math.min(1.2, avail / (n * (base + 2 * gap)))) : 1, fits = n * (base + 2 * gap) <= avail;
    const m = fits || n < 2 ? gap : Math.max(-(base - Math.min(46, base * .36)) / 2, Math.floor((avail - n * base) / (n - 1) / 2));
    page.style.setProperty('--kz', fits ? z.toFixed(3) : '1'); page.style.setProperty('--hm', m + 'px'); h.classList.toggle('tight', !fits && n > 1);
  }
  else if (cards.length > 1) { const cw = cards[0].offsetWidth, n = cards.length, gap = small ? 4 : -6, avail = h.clientWidth - (small ? 20 : 28), m = n * cw + (n - 1) * 2 * gap > avail ? Math.max(-(cw - (small ? 22 : 40)) / 2, Math.floor((avail - n * cw) / (n - 1) / 2)) : gap; page.style.setProperty('--hm', m + 'px'); }
  let tag = page.querySelector(':scope > .hmore'); const hr = h.getBoundingClientRect(), hidden = small ? cards.filter(c => c.getBoundingClientRect().left > hr.right - 24).length : 0;
  if (!hidden) { if (tag) tag.remove(); return; }
  if (!tag) { tag = document.createElement('span'); tag.className = 'hmore'; tag.setAttribute('aria-hidden', 'true'); page.appendChild(tag); }
  tag.textContent = `+${hidden} ▸`; tag.style.left = Math.round(hr.right - 46) + 'px'; tag.style.top = Math.round(hr.top + 6) + 'px';
}
if (typeof setInterval === 'function' && typeof document !== 'undefined') setInterval(() => { if (!document.hidden && document.getElementById('crawlPage')) try { fitHand(); } catch (e) {} }, 300);
if (typeof addEventListener === 'function') addEventListener('scroll', e => { if (e.target && e.target.classList && e.target.classList.contains('hand')) try { fitHand(); } catch (x) {} }, true);

// au doigt, comme à une table de cartes : le doigt posé sur la main fait grandir la carte dessous ; on glisse pour passer d'une carte à l'autre,
// on lève le doigt pour la choisir (comme un toucher) ; lever le doigt loin au-dessus de la main annule
const HP = { id: null, card: null, rects: null, swallow: 0 };
function handPeek(card) {
  if (HP.card === card) return; if (HP.card) HP.card.classList.remove('peek', 'pl', 'pr'); HP.card = card || null;
  if (card) { const r = card.getBoundingClientRect(); card.classList.add('peek'); if (r.left < 70) card.classList.add('pl'); else if (r.right > innerWidth - 70) card.classList.add('pr'); }
}
// la carte sous le doigt, d'après la place des cartes au moment du toucher (la carte agrandie ne cache pas ses voisines)
const handCardAt = x => { const R = HP.rects || []; for (let i = R.length - 1; i >= 0; i--) if (x >= R[i].l && x <= R[i].r) return R[i].c; return null; };
if (typeof addEventListener === 'function' && typeof document !== 'undefined') {
  addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse') return; const c = e.target && e.target.closest && e.target.closest('#crawlPage .hand .kcard'); if (!c) return;
    const h = c.closest('.hand'); HP.id = e.pointerId; HP.top = h.getBoundingClientRect().top;
    HP.rects = [...h.querySelectorAll('.kcard')].map(k => { const r = k.getBoundingClientRect(); return { c: k, l: r.left, r: r.right }; });
    handPeek(c);
  }, true);
  addEventListener('pointermove', e => { if (HP.id !== e.pointerId) return; const c = handCardAt(e.clientX); if (c) handPeek(c); if (HP.card) HP.card.classList.toggle('drop', e.clientY < HP.top - 110); }, true);
  const hpEnd = e => {
    if (HP.id !== e.pointerId) return; HP.id = null; const c = HP.card, far = e.clientY < HP.top - 110; handPeek(null); HP.rects = null;
    HP.swallow = performance.now() + 700;   // le click du navigateur qui suit est ignoré : c'est nous qui choisissons la carte
    if (e.type === 'pointerup' && c && c.isConnected && !far && !c.disabled) c.click();
  };
  addEventListener('pointerup', hpEnd, true); addEventListener('pointercancel', hpEnd, true);
  addEventListener('click', e => { if (e.isTrusted && performance.now() < HP.swallow && e.target && e.target.closest && e.target.closest('#crawlPage .hand')) { HP.swallow = 0; e.stopPropagation(); e.preventDefault(); } }, true);
}
