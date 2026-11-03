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
  if (nt && ha) { const lim = ha.getBoundingClientRect().top - 8; [...nt.children].forEach(n => { n.style.display = ''; }); [...nt.children].forEach(n => { if (n.getBoundingClientRect().bottom > lim) n.style.display = 'none'; }); }   // celles qui ne tiennent pas attendent leur tour (les plus urgentes sont en haut)
}
if (typeof addEventListener === 'function' && typeof document !== 'undefined') {
  addEventListener('resize', () => requestAnimationFrame(hudLayout));
  addEventListener('load', () => requestAnimationFrame(hudLayout));
  try { document.fonts && document.fonts.ready.then(() => requestAnimationFrame(hudLayout)); } catch (e) {}
  setInterval(() => { if (!document.hidden) hudLayout(); }, 2000);   // les compteurs qui grandissent peuvent faire passer la barre du haut sur deux lignes
  try { const ro = new ResizeObserver(() => requestAnimationFrame(hudLayout)); setTimeout(() => ['hudTop', 'hudBuild', 'hudActions', 'leftPanel'].forEach(id => { const e = document.getElementById(id); if (e) ro.observe(e); }), 0); } catch (e) {}
}
const renderAllMobile = renderAll;
renderAll = function (...a) { const r = renderAllMobile(...a); try { hudLayout(); } catch (e) {} return r; };
