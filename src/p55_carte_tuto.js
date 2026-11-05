/* =========================================================
   La visite guidée de la carte du Val
   La première fois qu'on ouvre la carte, Gribouille fait le
   tour : notoriété, d'où viennent les héros, marchands et
   caravanes, raids, expéditions et donjons, brouillard,
   factions. Chaque étape montre un vrai lieu de la carte.
   Le bouton 🎓 de la carte la relance ; fermer la carte la
   met en pause (elle reprend à la même étape).
   ========================================================= */
const MAPT = { on: false, i: 0 };
// le lieu visible le plus proche du château qui répond à la question
const mapSiteOf = pred => { const vis = mapVisible(); return allSites().filter(s => vis.has(s.i) && pred(s)).sort((a, b) => hdist(a.q, a.r) - hdist(b.q, b.r))[0] || null; };
const mapCaravanCell = () => { if (typeof activeCaravans !== 'function') return null; const vis = mapVisible(); for (const cv of activeCaravans()) { const c = caravanCell(cv); if (c && vis.has(c.i)) return c; } return null; };
// une case de brouillard au bord de ce qu'on voit, la plus proche du château
const mapFogEdge = () => {
  const w = world(), vis = mapVisible(); let best = null, bd = 1e9;
  w.list.forEach(c => { if (vis.has(c.i)) return; if (!HEX_DIRS.some(([dq, dr]) => { const n = w.cell(c.q + dq, c.r + dr); return n && vis.has(n.i); })) return; const d = hdist(c.q, c.r); if (d < bd) { bd = d; best = c; } });
  return best;
};
const MAP_TUTO = [
  { t: 'La carte du Val', x: 'Bienvenue dans le Val ! Ton château est au milieu, entouré de villages, de forêts et de donjons rivaux. Fais glisser la carte, pince (ou la molette) pour zoomer ; « ⌂ Mon château » te ramène chez toi.', focus: () => siteById('home'), wide: true },
  { t: 'Ta notoriété', x: 'Le cercle doré, c’est ta notoriété 🔥 : jusqu’où on parle de ton château. Elle grandit surtout avec son éclat (tes artefacts exposés, surtout au Reliquaire, tes trésors, tes créatures rares, tes légendes, tes paliers et tes étages), et un peu avec le bouche-à-oreille (raids, conteurs, fêtes). « D’où vient ma notoriété ? » détaille le compte.', focus: () => siteById('home'), wide: true, glow: '[data-m="glow"]', wiki: 'notoriete' },
  { t: 'D’où viennent les héros', x: 'Les villages et les villes dans ton cercle doré t’envoient leurs aventuriers. Plus ta notoriété porte loin, plus ils viennent de loin… et plus ils sont coriaces : les apprentis des villages, puis les aventuriers aguerris des villes, puis les champions de la cité.', focus: () => mapSiteOf(s => !!(SITE_KINDS[s.kind] || {}).rank) },
  { t: 'Les marchands', x: 'Chaque village a son épicerie-buvette, chaque ville son marché : touche-les pour acheter ce qui te manque. De temps en temps, une caravane de marchands roule aussi sur les routes : tu peux la piller (or et bois, mais les villages t’en veulent et la Menace monte) ou l’escorter (ils t’en seront reconnaissants).', focus: () => mapCaravanCell() || mapSiteOf(s => !!(SITE_KINDS[s.kind] || {}).shop), glow: '[data-m="town"], [data-cv]', wiki: 'caravanes' },
  { t: 'Les raids', x: 'Fermes, moulins, abbayes et donjons rivaux sont des cibles de raid : envoie jusqu’à 3 créatures les piller pendant la nuit, chacune avec ses dés. Le butin est bon, mais chaque raid fait monter la Menace… et les héros finiront par venir se venger.', focus: () => mapSiteOf(s => s.kind === 'raid') || mapSiteOf(s => s.kind === 'rival'), glow: '[data-m="raid"]', wiki: 'raids' },
  { t: 'Expéditions et donjons', x: 'Forêts, grottes, ruines, pics et lacs se visitent en expédition : 2 créatures partent quelques nuits et rapportent du butin, parfois un artefact ou une nouvelle amie. Les donjons, eux, se jouent en cartes, la nuit même : 4 créatures, trois étages et un boss au bout.', focus: () => mapSiteOf(s => !!(SITE_KINDS[s.kind] || {}).expe), glow: '[data-m="expe"]', wiki: 'expeditions' },
  { t: 'Le brouillard', x: 'Au-delà, c’est le brouillard : personne ne sait ce qu’il y a. Touche une case grise au bord de ce que tu vois pour y envoyer un éclaireur pendant une nuit. Ta notoriété, un Belvédère et les créatures qui guettent font aussi reculer le brouillard.', focus: () => mapFogEdge(), need: true, glow: '[data-m="scout"]' },   // une carte toute découverte : l'étape est sautée
  { t: 'Factions et territoires', x: 'Le Baron, les villages et ton rival avancent chacun leurs plans dans le Val. Sur ton château, « Factions et territoires » montre où ils en sont. Une cible de raid peut aussi devenir ton territoire : elle te rapporte chaque nuit, mais le village voisin t’en veut.', focus: () => siteById('home'), glow: '[data-m="factions"]', wiki: 'factions' },
  { t: 'À toi d’explorer !', x: 'Touche n’importe quel lieu pour voir ce qu’on peut y faire. Le bouton 🎓, en haut de la carte, relance cette visite ; le Grimoire (📖) explique tout en détail.', focus: () => siteById('home'), wide: true, end: true },
];
// la case montrée tombe dans la partie libre de l'écran : sous la barre du haut, hors du conseiller et du panneau
function mapTutoCenter(q, r, wide) {
  MAPV.cam.s = wide ? (MAPT.s0 || MAPV.cam.s) : clamp(Math.max(MAPT.s0 || 1, 1.3), .45, 2.6);   // le lieu montré, assez gros pour lire son nom
  const cvw = $('#wcv'); if (!cvw) return; const b = cvw.getBoundingClientRect(), w = b.width, h = b.height;
  const rel = el => { if (!el || el.hidden || !el.offsetParent) return null; const r2 = el.getBoundingClientRect(); return r2.width ? { l: r2.left - b.left, t: r2.top - b.top, r: r2.right - b.left, b: r2.bottom - b.top, w: r2.width } : null; };
  const top = rel(document.querySelector('#world .wtop')), pan = rel($('#wpanel')), adv = rel($('#advisor'));
  let x0 = 0, x1 = w, y0 = top ? top.b : 0, y1 = h;
  if (pan) { if (pan.w < w * .7) x1 = Math.min(x1, pan.l); else y1 = Math.min(y1, pan.t); }
  if (adv) { if (adv.w < (x1 - x0) * .7 && adv.r < (x0 + x1) / 2 + 60) x0 = Math.max(x0, adv.r); else if (adv.t > (y0 + y1) / 2 - 40) y1 = Math.min(y1, adv.t); else y0 = Math.max(y0, adv.b); }
  const [sx, sy] = hexXY(q, r, HS); MAPV.cam.x = (x0 + x1) / 2 - sx * MAPV.cam.s; MAPV.cam.y = (y0 + y1) / 2 - sy * MAPV.cam.s; mapClampCam();
}
function mapTutoShow() {
  let st = MAP_TUTO[MAPT.i]; if (!st || !MAPV.open) { mapTutoEnd(); return; }
  let f = null; try { f = st.focus && st.focus(); } catch (e) {}
  if (!f && st.need && MAP_TUTO[MAPT.i + 1]) { MAPT.i++; mapTutoShow(); return; }
  if (!f) f = siteById('home');
  document.body.classList.add('maptuto');
  advisorShow({ title: st.t, text: st.x, step: MAPT.i + 1, total: MAP_TUTO.length, wiki: st.wiki, cls: 'tuto maptuto',
    buttons: st.end ? [{ id: 'mtend', label: 'Terminer', pri: true }] : [{ id: 'mtnext', label: 'Suivant', pri: true }, { id: 'mtskip', label: 'Passer la visite' }] });
  if (f) { MAPV.sel = f; renderMapPanel(); mapTutoCenter(f.q, f.r, st.wide); }
  if (st.glow) document.querySelectorAll('#wpanel ' + st.glow.split(', ').join(', #wpanel ')).forEach(e => e.classList.add('tuto-glow'));
}
function mapTutoStart(again) {
  if (!MAPV.open || (typeof VISIT !== 'undefined' && VISIT) || (typeof COOP !== 'undefined' && COOP.role === 'guest')) return;
  if (again) MAPT.i = 0;
  if (!MAPT.on) MAPT.s0 = MAPV.cam.s;   // le zoom d'ouverture : la vue large de la visite
  MAPT.on = true; mapTutoShow();
}
function mapTutoEnd(pause) {
  const was = MAPT.on; MAPT.on = false; if (!pause) MAPT.i = 0;
  document.body.classList.remove('maptuto'); document.querySelectorAll('#wpanel .tuto-glow').forEach(e => e.classList.remove('tuto-glow'));
  if (was) advisorHide();
}
// la carte s'ouvre : la première fois, la visite commence ; fermée en route, elle reprend où on en était
const openWorldTuto = openWorld;
openWorld = function (...a) {
  const r = openWorldTuto(...a);
  if (MAPV.open && typeof uiPrefs === 'function' && !uiPrefs().mapTuto) setTimeout(() => { if (MAPV.open && !MAPT.on) mapTutoStart(false); }, 450);
  return r;
};
const closeWorldTuto = closeWorld;
closeWorld = function (...a) { if (MAPT.on) mapTutoEnd(true); return closeWorldTuto(...a); };
if (typeof document !== 'undefined' && document.getElementById) {
  const adv = document.getElementById('advisor');
  if (adv) adv.addEventListener('click', e => {
    const b = e.target.closest('[data-adv]'); if (!b) return; const act = b.dataset.adv;
    if (act === 'mtnext') { MAPT.i++; sfx('tick'); mapTutoShow(); }
    else if (act === 'mtend' || act === 'mtskip') { if (typeof uiPrefs === 'function') uiPrefs({ mapTuto: 1 }); mapTutoEnd(); if (act === 'mtskip') toast('Le bouton 🎓, en haut de la carte, relance la visite quand tu veux.'); }
  });
  // une fenêtre par-dessus (Grimoire, épicerie…) : Gribouille attend, puis revient sur la même étape
  setInterval(() => {
    if (!MAPT.on) return; const a = document.getElementById('advisor'), modal = document.querySelector('#modalRoot .modal');
    if (!MAPV.open) { mapTutoEnd(true); return; }
    if (modal) { if (a && !a.hidden) a.hidden = true; return; }
    if (a && a.hidden) mapTutoShow();
  }, 700);
}
