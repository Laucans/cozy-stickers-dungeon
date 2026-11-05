/* =========================================================
   L'aide en jeu
   - un « ? » à côté des mots des fiches (loyauté, humeur,
     salaire, réputation…) qui ouvre le Grimoire à la bonne page,
     avec un retour à la fiche d'où l'on vient ;
   - à la souris, une pastille qui nomme le bouton survolé.
   ========================================================= */
// les mots des fiches, et l'article du Grimoire qui les explique
const AIDE_TERMS = [
  [/^loyaute/, 'loyaute', 'la loyauté'], [/^epanouissement|epanouit/, 'loyaute', 'l’épanouissement'], [/^humeur/, 'humeur', 'l’humeur'],
  [/^experience|^niveau/, 'niveaux', 'les niveaux'], [/^salaire|jour de paie|^gages|ardoise/, 'paie', 'le salaire et les gages'], [/^postes?\b|^gardes?\b/, 'postes', 'les postes et la défense'],
  [/^combat/, 'combat', 'le combat'], [/^competence/, 'creatures', 'les compétences'], [/^caractere|^occupation/, 'caracteres', 'le caractère'],
  [/^reves? secrets?|^envies?\b/, 'missions', 'les envies et les rêves secrets'], [/^reputation/, 'reputation', 'la réputation'], [/^places? d.accueil|^accueil/, 'renommee', 'les places d’accueil'],
  [/^ambiance/, 'ambiance', 'l’ambiance'], [/^lits?\b|^repas/, 'lits_repas', 'les lits et les repas'], [/^calamite/, 'calamite', 'la Calamité'], [/^menace/, 'menace', 'la Menace'],
  [/^notoriete|^eclat|^bouche-a-oreille/, 'notoriete', 'la notoriété'], [/^emotions?\b/, 'emotions', 'les émotions'], [/^saisons?\b/, 'saisons', 'les saisons'],
  [/^artefacts?\b/, 'artefacts', 'les artefacts'], [/^paliers?\b/, 'paliers', 'les paliers'], [/^elements?\b/, 'elements', 'les éléments'], [/^merveilles?\b/, 'merveilles', 'les Merveilles'],
  [/^(grands? )?chantiers?\b/, 'chantiers', 'les grands chantiers'], [/^etages?\b/, 'etages', 'les étages'], [/^remparts?\b/, 'remparts', 'les remparts'], [/^quetes?\b/, 'quetes', 'les quêtes'],
  [/^factions?\b|^territoires?\b/, 'factions', 'les factions'], [/^oeufs?\b/, 'oeufs', 'les œufs'], [/^metiers?\b|^artisanat/, 'artisanat', 'les métiers'], [/^risques?\b/, 'risques', 'les risques'],
  [/^raids?\b/, 'raids', 'les raids'], [/^pieges?\b|^verrous?\b/, 'pieges', 'les pièges'], [/^invasions?\b/, 'invasion', 'les invasions'], [/^prisonniers?\b|^oubliettes?\b/, 'prisonniers', 'les prisonniers'],
  [/^intrigues?\b/, 'intrigues', 'les intrigues'], [/^cuisine|^garde-manger/, 'cuisine', 'la cuisine'],
  [/^(le )?concours/, 'concours', 'le concours du Val'], [/^(le )?mecenat|^embellissements?\b/, 'mecenat', 'le mécénat'], [/^caravanes?\b/, 'caravanes', 'les caravanes'],
];
const aideNorm = t => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^[^a-z]+/, '').trim();
const aideTerm = t => { const n = aideNorm(t); return AIDE_TERMS.find(([re]) => re.test(n)); };
const aideQ = (key, what) => `<button type="button" class="aideq" data-wiki-open="${key}" data-tip="Comprendre ${what}" aria-label="Comprendre ${what}, dans le Grimoire">?</button>`;
// les intitulés des fiches ouvertes reçoivent leur « ? » (une fois chacun)
function aideScan() {
  const m = document.querySelector('#modalRoot .modal'); if (!m || m.matches('.grimoire, .livrebook, .titlem')) return;
  m.querySelectorAll('dt, h3, summary').forEach(e => {
    if (e.dataset.aide) return; e.dataset.aide = '1';
    if (e.querySelector('[data-wiki-open]') || e.closest('.grim, .lvbook')) return;
    const T = aideTerm(e.textContent); if (T) e.insertAdjacentHTML('beforeend', aideQ(T[1], T[2]));
  });
}
// le Grimoire ouvert depuis une fiche garde un bouton pour y revenir
const openGrimoireAide = openGrimoire;
openGrimoire = function () {
  const ctx = typeof UI !== 'undefined' && UI.mctx && document.querySelector('#modalRoot .modal') ? UI.mctx.slice() : null;
  const r = openGrimoireAide.apply(this, arguments);
  try {
    let label = null, back = null;
    if (ctx && ctx[0] === 'creature') { const c = S.creatures.find(x => x.id === ctx[1]); if (c) { label = c.name; back = () => openCreature(c.id); } }
    else if (ctx && ctx[0] === 'room') { const rm = S.rooms.find(x => x.id === ctx[1]); if (rm && ROOMS[rm.t]) { label = ROOMS[rm.t].name; back = () => openRoom(rm.id); } }
    const g = document.querySelector('#modalRoot .grim');
    if (back && g) { const b = document.createElement('button'); b.type = 'button'; b.className = 'sbtn gtoback'; b.textContent = `← Retour à la fiche : ${label}`; b.addEventListener('click', () => { sfx('tick'); back(); }); g.insertAdjacentElement('beforebegin', b); }
  } catch (e) {}
  return r;
};

/* ---------- la pastille au survol (souris seulement ; au doigt, c'est l'appui long) ---------- */
const HOVER_NAMES = {
  btnMenu: 'Partie et sauvegardes', turn: 'Les victoires du Val', btnAdmin: 'L’Atelier du Maître', adminFab: 'L’Atelier du Maître', btnSound: 'Le son', btnHelp: 'Le Grimoire des règles',
  btnCrit: 'Tes créatures', btnBest: 'L’album des espèces', btnRen: 'La réputation', btnAch: 'Le Livre du Maître', btnQuests: 'Le journal des quêtes',
  btnBuild: 'Construire', btnBuildClose: 'Fermer la construction', minimap: 'La carte du Val', zfit: 'Recadrer la vue',
  btnRaid: 'Raid et expéditions', btnTier: 'Le Cœur du donjon', btnVal: 'Le Val des Maîtres', btnNight: 'Finir la nuit',
};
const HV = { t: 0, el: null, tip: null };
const hvCap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
function hvText(el) {
  const nm = HOVER_NAMES[el.id];
  if (nm) { const h = (typeof LP_HELP !== 'undefined' && LP_HELP[el.id]) || '', i = h.indexOf(' : '); return [nm, i > 0 ? hvCap(h.slice(i + 3)) : '']; }
  const t = ((el.dataset && el.dataset.tip) || el.getAttribute('aria-label') || '').trim(); if (!t) return null;
  const i = t.indexOf(' : '); return i > 0 && i < 40 ? [t.slice(0, i), hvCap(t.slice(i + 3))] : [t, ''];
}
// le bouton ou la pastille de ressource survolé, s'il mérite une étiquette
function hvTarget(n) {
  const el = n && n.closest && n.closest('[id], .res, .dial, .aideq, [data-tip], [title], button, [role=button]'); if (!el || el.tagName === 'CANVAS' || el.closest('.card, .notif, .lvbook')) return null;
  if (el.hasAttribute('title')) { if (!el.dataset.tip) el.dataset.tip = el.getAttribute('title'); el.removeAttribute('title'); }   // pas de double infobulle
  if (HOVER_NAMES[el.id] || el.dataset.tip) return el;
  if ((el.tagName === 'BUTTON' || el.getAttribute('role') === 'button') && el.getAttribute('aria-label') && (el.textContent || '').replace(/[^A-Za-zÀ-ÿ]/g, '').length < 2) return el;   // un bouton sans texte : juste une icône
  return el.parentElement && el.parentElement !== document.body ? hvTarget(el.parentElement) : null;
}
function hvShow(el) {
  const T = hvText(el); if (!T || !el.isConnected) return;
  let b = HV.tip; if (!b) { b = HV.tip = document.createElement('div'); b.className = 'hovtip'; b.setAttribute('role', 'tooltip'); document.body.appendChild(b); }
  b.innerHTML = `<b>${esc(T[0])}</b>${T[1] ? `<small>${esc(T[1])}</small>` : ''}`; b.classList.toggle('long', !!T[1]); b.hidden = false;
  const r = el.getBoundingClientRect(), bw = b.offsetWidth, bh = b.offsetHeight, below = r.top < 140 || r.top - bh - 10 < 8;
  b.style.left = Math.max(8, Math.min(r.left + r.width / 2 - bw / 2, innerWidth - bw - 8)) + 'px'; b.style.top = (below ? r.bottom + 9 : r.top - bh - 9) + 'px';
}
function hvHide() { clearTimeout(HV.t); HV.el = null; if (HV.tip) HV.tip.hidden = true; }
function aideInit() {
  const mr = document.getElementById('modalRoot');
  if (mr && typeof MutationObserver !== 'undefined') { let q = 0; new MutationObserver(() => { if (!q) q = requestAnimationFrame(() => { q = 0; aideScan(); }); }).observe(mr, { childList: true, subtree: true }); }
  // un « ? » dans un titre repliable ouvre le Grimoire sans replier le titre
  document.addEventListener('click', e => { if (e.target.closest && e.target.closest('.aideq')) e.preventDefault(); }, true);
  addEventListener('pointerover', e => {
    if (e.pointerType !== 'mouse') return; const el = hvTarget(e.target); if (el === HV.el) return;
    hvHide(); if (!el) return; HV.el = el; HV.t = setTimeout(() => { if (HV.el === el) hvShow(el); }, 260);
  }, true);
  addEventListener('pointerout', e => { if (HV.el && !(e.relatedTarget && HV.el.contains(e.relatedTarget))) hvHide(); }, true);
  addEventListener('pointerdown', hvHide, true); addEventListener('wheel', hvHide, { passive: true, capture: true }); addEventListener('keydown', hvHide, true);
}
if (typeof document !== 'undefined' && typeof addEventListener === 'function' && typeof MutationObserver !== 'undefined') { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', aideInit); else aideInit(); }
