/* =========================================================
   Les dessins des stickers du Livre
   Des stickers originaux, tracés au canevas dans le style du
   jeu (contour brun foncé, ombrages doux, reflets) pour tout
   ce qui n'a pas de dessin de créature, de meuble ou de pièce :
   âges, victoires, pactes, quêtes, reliques, rencontres,
   Merveilles, médaillons d'ère. Rendu une fois en 256 px, gardé
   en mémoire, découpé ensuite par le Livre (liseré blanc).
   ========================================================= */
const SKA = {}, SKA_CACHE = {};
const SK_INK = '#2a1a0c';
const skPath = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
const skFS = (g, fill, lw = 6) => { g.fillStyle = fill; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = SK_INK; g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } };
const skRG = (g, x, y, r, c1, c2) => { const gr = g.createRadialGradient(x - r * .3, y - r * .35, r * .08, x, y, r); gr.addColorStop(0, c1); gr.addColorStop(1, c2); return gr; };
const skLG = (g, x0, y0, x1, y1, a, b) => { const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, a); gr.addColorStop(1, b); return gr; };
const skCirc = (g, x, y, r, fill, lw = 6) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); skFS(g, fill, lw); };
const skRect = (g, x, y, w, h, r, fill, lw = 6) => { g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); skFS(g, fill, lw); };
const skStar = (g, cx, cy, n, r1, r2, fill, lw = 6, rot = -Math.PI / 2) => { const p = []; for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : r1, a = rot + i * Math.PI / n; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } skPath(g, p); skFS(g, fill, lw); };
const skShine = (g, x, y, w, h, a = .55) => { g.save(); g.globalAlpha = a; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, w, h, -.5, 0, Math.PI * 2); g.fill(); g.restore(); };
const skLine = (g, pts, w = 6, c = SK_INK) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.lineWidth = w; g.strokeStyle = c; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); };
const skSparkle = (g, x, y, r) => skStar(g, x, y, 4, r, r * .28, '#fff8d0', 3);
// un sceau de cire, un médaillon d'or : des fonds réutilisés
const skWax = (g, col = '#b5302a') => { const p = []; for (let i = 0; i < 18; i++) { const a = i * Math.PI / 9, r = 96 + (i % 2 ? 7 : -4); p.push([128 + Math.cos(a) * r, 128 + Math.sin(a) * r]); } skPath(g, p); skFS(g, skRG(g, 128, 128, 110, '#e8655a', col)); skCirc(g, 128, 128, 70, 'rgba(0,0,0,0)', 4); g.globalAlpha = .25; skCirc(g, 128, 128, 66, '#000', 0); g.globalAlpha = 1; skShine(g, 92, 84, 26, 12, .35); };
const skMedal = (g, c1 = '#ffe58a', c2 = '#c48a22') => { skStar(g, 128, 128, 16, 112, 100, skRG(g, 128, 128, 112, c1, c2)); skCirc(g, 128, 128, 84, skRG(g, 128, 128, 84, '#fff3c0', c2)); skCirc(g, 128, 128, 70, 'rgba(0,0,0,0)', 3); };
const skLaurel = (g, col = '#5fa24a') => { for (const s of [-1, 1]) for (let i = 0; i < 7; i++) { const a = Math.PI / 2 + s * (0.5 + i * .33), x = 128 + Math.cos(a) * 92, y = 136 + Math.sin(a) * 86; g.save(); g.translate(x, y); g.rotate(a + s * 1.2); g.beginPath(); g.ellipse(0, 0, 18, 9, 0, 0, Math.PI * 2); skFS(g, col, 4); g.restore(); } };

/* ---------- lot 1 : âges, victoires, pactes, quêtes, petits moments ---------- */
Object.assign(SKA, {
  age_or: g => { for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; skPath(g, [[128 + Math.cos(a - .14) * 70, 128 + Math.sin(a - .14) * 70], [128 + Math.cos(a) * 118, 128 + Math.sin(a) * 118], [128 + Math.cos(a + .14) * 70, 128 + Math.sin(a + .14) * 70]]); skFS(g, i % 2 ? '#ffd24a' : '#ffb02a', 5); } skCirc(g, 128, 128, 66, skRG(g, 128, 128, 66, '#fff6b0', '#f2a41f')); skLine(g, [[100, 140], [128, 156], [156, 140]], 6); skCirc(g, 106, 116, 7, SK_INK, 0); skCirc(g, 150, 116, 7, SK_INK, 0); skShine(g, 104, 96, 18, 8); },
  age_heroique: g => { skPath(g, [[128, 26], [214, 54], [206, 150], [128, 230], [50, 150], [42, 54]]); skFS(g, skLG(g, 0, 26, 0, 230, '#e8554a', '#8a1c1c')); for (const s of [-1, 1]) { skLine(g, [[128 - s * 70, 196], [128 + s * 66, 60]], 14); skLine(g, [[128 - s * 70, 196], [128 + s * 66, 60]], 7, '#dfe6ee'); skLine(g, [[128 - s * 52, 170], [128 - s * 30, 194]], 10, '#c9902a'); } skStar(g, 128, 118, 5, 34, 14, '#ffd24a', 5); skShine(g, 86, 66, 22, 9, .35); },
  age_sombre: g => { skCirc(g, 128, 128, 100, skRG(g, 128, 128, 100, '#5a4a7a', '#1f1830')); g.save(); g.beginPath(); g.arc(128, 128, 100, 0, Math.PI * 2); g.clip(); skCirc(g, 116, 120, 62, skRG(g, 110, 110, 62, '#fff3c8', '#d7c27a'), 5); skCirc(g, 146, 104, 58, skRG(g, 146, 104, 58, '#4a3c66', '#241a38'), 0); g.restore(); skCirc(g, 128, 128, 100, 'rgba(0,0,0,0)', 6); [[180, 70, 8], [196, 150, 6], [70, 196, 7], [168, 196, 5]].forEach(([x, y, r]) => skSparkle(g, x, y, r * 1.6)); },
  vic_legende: g => { skLaurel(g); skStar(g, 128, 120, 5, 70, 30, skRG(g, 128, 120, 70, '#fff6b0', '#f2a41f'), 6); skShine(g, 112, 94, 14, 7); },
  vic_terreur: g => { skLaurel(g, '#7a8a5a'); skPath(g, [[78, 92], [96, 60], [112, 86], [128, 52], [144, 86], [160, 60], [178, 92]]); skFS(g, skLG(g, 0, 50, 0, 92, '#ffe58a', '#c9902a'), 5); skCirc(g, 128, 140, 52, skRG(g, 128, 140, 52, '#fffaf0', '#cfc3a8')); skCirc(g, 108, 136, 13, SK_INK, 0); skCirc(g, 148, 136, 13, SK_INK, 0); skPath(g, [[122, 160], [128, 150], [134, 160]]); skFS(g, SK_INK, 0); skLine(g, [[106, 178], [150, 178]], 5); },
  vic_voisinage: g => { skLaurel(g, '#6aa04a'); skPath(g, [[128, 50], [176, 92], [166, 92], [166, 176], [90, 176], [90, 92], [80, 92]]); skFS(g, skLG(g, 0, 50, 0, 176, '#f4d9a8', '#c99a5a')); skPath(g, [[70, 98], [128, 46], [186, 98]]); skFS(g, '#c84a3a', 6); skRect(g, 114, 130, 28, 46, 6, '#7a4a2a'); skCirc(g, 128, 104, 14, '#ffd24a', 5); },
  vic_menagerie: g => { skLaurel(g, '#5fa24a'); skCirc(g, 128, 140, 34, skRG(g, 128, 140, 34, '#f7b98a', '#c9784a')); [[92, 98], [116, 82], [140, 82], [164, 98]].forEach(([x, y]) => skCirc(g, x, y, 15, skRG(g, x, y, 15, '#f7b98a', '#c9784a'))); skShine(g, 118, 128, 12, 6); },
  vic_secrets: g => { skLaurel(g, '#6a7ab0'); skLine(g, [[100, 160], [168, 92]], 16); skLine(g, [[100, 160], [168, 92]], 9, '#e8c26a'); skCirc(g, 92, 168, 26, skRG(g, 92, 168, 26, '#ffe58a', '#c9902a')); skCirc(g, 92, 168, 10, '#7a5a3a', 4); skLine(g, [[156, 104], [172, 120]], 9); skLine(g, [[144, 116], [158, 130]], 9); },
  vic_any: g => { skPath(g, [[70, 56], [186, 56], [176, 122], [150, 146], [106, 146], [80, 122]]); skFS(g, skLG(g, 70, 0, 186, 0, '#ffe58a', '#c9902a')); for (const s of [-1, 1]) { g.beginPath(); g.arc(128 + s * 66, 82, 22, 0, Math.PI * 2); g.lineWidth = 9; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 4; g.strokeStyle = '#e8c26a'; g.stroke(); } skRect(g, 116, 144, 24, 34, 4, '#c9902a'); skRect(g, 84, 176, 88, 26, 8, skLG(g, 0, 176, 0, 202, '#8a5a3a', '#5a3a22')); skShine(g, 104, 80, 14, 22, .45); },
  pac_rangs: g => { skWax(g); skRect(g, 120, 108, 16, 74, 5, '#9a6a3a', 5); skRect(g, 92, 84, 72, 30, 8, skLG(g, 0, 84, 0, 114, '#dfe6ee', '#8a96a6'), 5); },
  pac_butin: g => { skWax(g, '#8a2a20'); skPath(g, [[128, 64], [142, 84], [138, 150], [118, 150], [114, 84]]); skFS(g, skLG(g, 114, 0, 142, 0, '#f2f6fa', '#9aa6b6'), 5); skRect(g, 98, 148, 60, 12, 5, '#c9902a', 5); skRect(g, 121, 158, 14, 30, 4, '#7a4a2a', 4); },
  pac_portes: g => { skWax(g, '#7a3a8a'); g.beginPath(); g.moveTo(90, 186); g.lineTo(90, 116); g.arc(128, 116, 38, Math.PI, 0); g.lineTo(166, 186); g.closePath(); skFS(g, skLG(g, 0, 78, 0, 186, '#c99a5a', '#7a4a2a'), 5); skLine(g, [[128, 82], [128, 186]], 4); skCirc(g, 144, 140, 6, '#ffd24a', 3); },
  pac_guerre: g => { skWax(g, '#5a5a2a'); skCirc(g, 128, 128, 44, skRG(g, 128, 128, 44, '#dfe6ee', '#7a8696'), 6); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; g.save(); g.translate(128 + Math.cos(a) * 46, 128 + Math.sin(a) * 46); g.rotate(a); skRect(g, -8, -9, 16, 18, 3, '#9aa6b6', 4); g.restore(); } skCirc(g, 128, 128, 16, '#5a5a2a', 5); },
  pac_veillee: g => { skWax(g, '#a8451e'); skPath(g, [[128, 62], [160, 112], [154, 156], [128, 182], [102, 156], [96, 112]]); skFS(g, skLG(g, 0, 62, 0, 182, '#ffe07a', '#f06a1e')); skPath(g, [[128, 112], [144, 140], [128, 168], [112, 140]]); skFS(g, '#fff3b0', 4); },
  pac_ecole: g => { skWax(g, '#2a5a8a'); skPath(g, [[128, 90], [190, 74], [190, 168], [128, 184]]); skFS(g, '#f7eedb', 5); skPath(g, [[128, 90], [66, 74], [66, 168], [128, 184]]); skFS(g, '#efe2c4', 5); [[84, 104], [84, 124], [84, 144]].forEach(([x, y]) => skLine(g, [[x, y], [x + 30, y + 6]], 4, '#8a7a5e')); },
  quete: g => { skRect(g, 66, 70, 124, 120, 10, skLG(g, 0, 70, 0, 190, '#fbf1d8', '#e6d2a6')); for (const y of [62, 186]) { skRect(g, 56, y - 12, 144, 24, 12, skLG(g, 0, y - 12, 0, y + 12, '#e6d2a6', '#b8955a')); } [[84, 98], [84, 118], [84, 138]].forEach(([x, y]) => skLine(g, [[x, y], [x + 72, y]], 5, '#8a7a5e')); skCirc(g, 168, 168, 22, skRG(g, 168, 168, 22, '#e8655a', '#9a2a20')); skStar(g, 168, 168, 5, 9, 4, '#ffd24a', 2); },
  grandequete: g => { SKA.quete(g); skLine(g, [[70, 200], [196, 56]], 16); skLine(g, [[70, 200], [196, 56]], 8, '#e6edf4'); skLine(g, [[84, 170], [104, 190]], 13, '#c9902a'); skPath(g, [[150, 40], [160, 22], [170, 38], [182, 22], [190, 42]]); skFS(g, '#ffd24a', 4); },
  coup: g => { skPath(g, [[128, 40], [200, 64], [192, 148], [128, 214], [64, 148], [56, 64]]); skFS(g, skLG(g, 0, 40, 0, 214, '#7aa6e0', '#2a4a8a')); skLine(g, [[128, 40], [118, 96], [138, 130], [124, 214]], 6); skStar(g, 176, 70, 4, 22, 7, '#fff8d0', 4); skShine(g, 92, 82, 20, 9, .35); },
  vassal: g => { skLine(g, [[84, 214], [84, 40]], 14, SK_INK); skLine(g, [[84, 214], [84, 40]], 7, '#9a6a3a'); g.beginPath(); g.moveTo(88, 52); g.bezierCurveTo(130, 30, 150, 80, 200, 58); g.lineTo(200, 128); g.bezierCurveTo(150, 150, 130, 100, 88, 122); g.closePath(); skFS(g, skLG(g, 88, 0, 200, 0, '#ffffff', '#dcd6c8')); skCirc(g, 84, 38, 10, '#ffd24a', 5); },
  crit: g => { for (const [x, y, r] of [[96, 140, -.2], [160, 110, .25]]) { g.save(); g.translate(x, y); g.rotate(r); skRect(g, -44, -44, 88, 88, 16, skLG(g, -44, -44, 44, 44, '#ffffff', '#e2d8c2')); [[-22, -22], [22, -22], [-22, 0], [22, 0], [-22, 22], [22, 22]].forEach(([a, b]) => skCirc(g, a, b, 8, '#c8302a', 0)); g.restore(); } skSparkle(g, 200, 60, 16); skSparkle(g, 56, 74, 11); },
  intacte: g => { SKA.coup(g); },
});
SKA.intacte = g => { skPath(g, [[128, 40], [200, 64], [192, 148], [128, 214], [64, 148], [56, 64]]); skFS(g, skLG(g, 0, 40, 0, 214, '#9ae07a', '#2a8a4a')); skStar(g, 128, 124, 4, 46, 12, '#fff8d0', 5); skSparkle(g, 178, 62, 14); skSparkle(g, 80, 176, 10); skShine(g, 92, 82, 20, 9, .35); };
// les moments qui ont leur propre dessin (lot 5) : plus de créature prise au hasard (la plus récente, la star) ni de vignette sans rapport
const STK_ART = { accueil: 'mo_accueil', menagerie: 'mo_album8', album16: 'mo_album16', album24: 'mo_album24', pop30: 'mo_foule', aimant: 'mo_aimant', calins: 'mo_confident', fidele: 'mo_fidele', conteur: 'mo_conteur', r_envies: 'mo_envies', nuit20: 'mo_nuit20', f_merveille: 'mo_merveille', r_merveille: 'mo_merveille_up', crit: 'crit', crit3: 'mo_crit3', quete: 'quete', r_quete: 'quete', repousse: 'mo_repousse', r_invasion: 'mo_repousse', rempart: 'mo_rempart', forteresse: 'mo_forteresse' };
const STK_NOSUB = ['accueil', 'menagerie', 'album16', 'album24', 'pop30', 'aimant', 'calins', 'fidele', 'conteur', 'r_album'];   // leur ancienne légende « Nom, espèce » n'avait rien à voir
// la clé du dessin d'un sticker (null : il a déjà un vrai dessin du jeu)
function stkArtKey(id) {
  if (!id) return null; if (STK_ART[id]) return STK_ART[id];
  if (id === 'heroique') return 'age_heroique'; if (id === 'sombre') return 'age_sombre'; if (/^or:/.test(id)) return 'or_' + eraArtKey(id.slice(3));
  if (/^vic:/.test(id)) return 'vic_' + id.slice(4); if (id === 'victoire') return 'vic_any';
  if (/^pacte:/.test(id)) return 'pac_' + id.slice(6);
  if (/^quete:/.test(id)) return /grande|Colosse|boss/i.test(id) ? 'grandequete' : 'quete'; if (id === 'grandequete') return 'grandequete';
  if (id === 'coup' || id === 'r_coup') return 'coup'; if (id === 'vassal' || id === 'r_vassal') return 'vassal'; if (id === 'r_crit') return 'crit'; if (id === 'inv:intacte') return 'intacte';
  if (/^relique:/.test(id)) return 'rel_' + id.slice(8); if (/^ev:/.test(id)) return 'ev_' + id.slice(3).replace(':', '_'); if (/^merveille:/.test(id)) return 'mer_' + id.slice(10).replace(':5', '_5');
  if (['voisin', 'genereux', 'livredor', 'coop', 'escarmouche'].includes(id)) return 'val_' + id;
  return null;
}
function stkArt(key) {
  if (SKA_CACHE[key]) return SKA_CACHE[key];
  // l'âge d'or d'une ère : son dessin, posé sur un soleil d'or
  const f = SKA[key] || (/^or_era_/.test(key) && SKA[key.slice(3)] ? g => { SKA.age_or_back(g); g.translate(128, 132); g.scale(.74, .74); g.translate(-128, -128); SKA[key.slice(3)](g); } : null);
  if (!f || typeof document === 'undefined') return null;
  try { const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); f(g); SKA_CACHE[key] = typeof thumbURL === 'function' ? thumbURL(cv.toDataURL()) : cv.toDataURL(); return SKA_CACHE[key]; } catch (e) { return null; }
}
// le Livre prend ces dessins avant l'icône de secours
const lvArtSka = lvArt;
lvArt = function (x, m) { const k = !x.art && stkArtKey(x.id), u = k && stkArt(k); return u ? `<img alt="" src="${u}">` : lvArtSka(x, m); };

/* ---------- outils de plus ---------- */
const skEll = (g, x, y, rx, ry, fill, lw = 6, rot = 0) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); skFS(g, fill, lw); };
// plusieurs formes d'un seul tenant : le cerne fait le tour de l'ensemble
const skUnion = (g, build, fill, lw = 6) => { build(); g.lineWidth = lw * 2; g.strokeStyle = SK_INK; g.lineJoin = 'round'; g.stroke(); g.fillStyle = fill; g.fill(); };
const skBlob = (g, parts, fill, lw = 6) => skUnion(g, () => { g.beginPath(); parts.forEach(([x, y, rx, ry]) => { g.moveTo(x + rx, y); g.ellipse(x, y, rx, ry || rx, 0, 0, Math.PI * 2); }); }, fill, lw);
const skGlow = (g, x, y, r, col) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
const skTxt = (g, t, x, y, px, fill = '#fff', lw = 5) => { g.save(); g.font = `bold ${px}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = lw; g.strokeStyle = SK_INK; g.strokeText(t, x, y); g.fillStyle = fill; g.fillText(t, x, y); g.restore(); };
const skFlame = (g, x, y, s = 1, c1 = '#fff3a0', c2 = '#f0761e') => { g.beginPath(); g.moveTo(x, y - 30 * s); g.bezierCurveTo(x + 18 * s, y - 10 * s, x + 16 * s, y + 10 * s, x, y + 12 * s); g.bezierCurveTo(x - 16 * s, y + 10 * s, x - 18 * s, y - 10 * s, x, y - 30 * s); skFS(g, skLG(g, 0, y - 30 * s, 0, y + 12 * s, c1, c2), Math.max(3, 5 * s)); };
// une scène dans un rond, dont le premier plan peut déborder
const skScene = (g, c1, c2, f, r = 100) => { g.save(); g.beginPath(); g.arc(128, 128, r, 0, Math.PI * 2); g.fillStyle = skLG(g, 0, 128 - r, 0, 128 + r, c1, c2); g.fill(); g.clip(); f(); g.restore(); g.beginPath(); g.arc(128, 128, r, 0, Math.PI * 2); g.lineWidth = 6; g.strokeStyle = SK_INK; g.stroke(); };
const skHeart = (g, x, y, s, fill, lw = 5) => { const t = y - s * .45; g.beginPath(); g.moveTo(x, t + s * .28); g.bezierCurveTo(x, t, x - s * .5, t, x - s * .5, t + s * .3); g.bezierCurveTo(x - s * .5, t + s * .6, x, t + s * .75, x, t + s); g.bezierCurveTo(x, t + s * .75, x + s * .5, t + s * .6, x + s * .5, t + s * .3); g.bezierCurveTo(x + s * .5, t, x, t, x, t + s * .28); g.closePath(); skFS(g, fill, lw); };
const skDuo = (g, pts, w, col) => { skLine(g, pts, w + 7); skLine(g, pts, w, col); };   // un trait cerné
const skBez = (p, t) => { const u = 1 - t; return [u * u * u * p[0][0] + 3 * u * u * t * p[1][0] + 3 * u * t * t * p[2][0] + t * t * t * p[3][0], u * u * u * p[0][1] + 3 * u * u * t * p[1][1] + 3 * u * t * t * p[2][1] + t * t * t * p[3][1]]; };
const skNote = (g, x, y, s = 1, col = '#3a2a6a') => { skEll(g, x, y, 11 * s, 8 * s, col, 4, -.4); skLine(g, [[x + 9 * s, y - 3 * s], [x + 9 * s, y - 38 * s], [x + 22 * s, y - 28 * s]], 5 * s); };
const skBone = (g, x, y, a, L, c1, c2) => { g.save(); g.translate(x, y); g.rotate(a); skUnion(g, () => { g.beginPath(); g.rect(-L, -10, 2 * L, 20); [[-L, -12], [-L, 12], [L, -12], [L, 12]].forEach(([cx, cy]) => { g.moveTo(cx + 16, cy); g.arc(cx, cy, 16, 0, Math.PI * 2); }); }, skLG(g, 0, -28, 0, 28, c1, c2)); g.restore(); };

/* ---------- lot 4 : une illustration par ère (ouverture de chapitre et médaillon d'âge d'or) ---------- */
Object.assign(SKA, {
  era_reveil: g => {
    skScene(g, '#ffe6a8', '#f59a6a', () => {
      for (let i = 0; i < 9; i++) { const a = Math.PI + (i + .5) * Math.PI / 9; skPath(g, [[128 + Math.cos(a - .11) * 56, 168 + Math.sin(a - .11) * 56], [128 + Math.cos(a) * 112, 168 + Math.sin(a) * 112], [128 + Math.cos(a + .11) * 56, 168 + Math.sin(a + .11) * 56]]); skFS(g, i % 2 ? '#ffd24a' : '#ffbf3a', 4); }
      skCirc(g, 128, 168, 50, skRG(g, 128, 168, 50, '#fff7b8', '#f6a623'), 5);
      skCirc(g, 110, 152, 6, SK_INK, 0); skLine(g, [[136, 150], [145, 156], [154, 150]], 4); skLine(g, [[114, 172], [128, 181], [142, 172]], 4);
      skCirc(g, 102, 166, 7, 'rgba(240,110,80,.45)', 0); skCirc(g, 156, 166, 7, 'rgba(240,110,80,.45)', 0);
      g.beginPath(); g.moveTo(14, 206); g.quadraticCurveTo(128, 168, 242, 206); g.lineTo(242, 256); g.lineTo(14, 256); g.closePath(); skFS(g, skLG(g, 0, 180, 0, 240, '#9ad56e', '#3f8a3a'), 5);
      [[72, 64], [92, 54]].forEach(([x, y]) => skLine(g, [[x - 8, y - 4], [x, y + 2], [x + 8, y - 4]], 3));
    });
    skRect(g, 26, 134, 42, 76, 4, skLG(g, 0, 134, 0, 210, '#e8d6b4', '#a8906a')); [30, 44, 58].forEach(x => skRect(g, x - 4, 120, 12, 16, 2, '#d8c4a0', 4));
    skRect(g, 38, 150, 16, 22, 8, '#ffd24a', 4); g.beginPath(); g.moveTo(38, 210); g.lineTo(38, 192); g.arc(47, 192, 9, Math.PI, 0); g.lineTo(56, 210); skFS(g, '#7a4a2a', 4);
    skTxt(g, 'z', 206, 70, 30, '#fff'); skTxt(g, 'z', 226, 46, 20, '#fff');
  },
  era_lanternes: g => {
    skScene(g, '#3a4a8e', '#1a2150', () => {
      [[40, 60], [200, 40], [214, 120], [56, 140], [150, 196]].forEach(([x, y]) => skSparkle(g, x, y, 7));
      skPath(g, [[28, 256], [28, 214], [52, 196], [76, 214], [76, 200], [104, 180], [132, 200], [132, 214], [170, 190], [206, 214], [228, 206], [228, 256]]); skFS(g, '#141a3a', 4);
      [[60, 212], [112, 204], [176, 210]].forEach(([x, y]) => skRect(g, x, y, 10, 12, 2, '#ffd27a', 3));
    });
    g.beginPath(); g.moveTo(10, 56); g.quadraticCurveTo(128, 112, 246, 56); g.lineWidth = 9; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 4; g.strokeStyle = '#a87a4a'; g.stroke();
    const lant = (x, y, w, h, c1, c2) => {
      skLine(g, [[x, y], [x, y + 10]], 4); skRect(g, x - w * .3, y + 8, w * .6, 10, 3, '#3a2a2a', 4);
      const cy = y + 18 + h / 2; skEll(g, x, cy, w / 2, h / 2, skRG(g, x, cy, w * .6, c1, c2));
      g.save(); g.globalAlpha = .45; [.55, .2].forEach(k => { g.beginPath(); g.ellipse(x, cy, w / 2 * k, h / 2, 0, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = SK_INK; g.stroke(); }); g.restore();
      skRect(g, x - w * .25, y + 16 + h, w * .5, 9, 3, '#3a2a2a', 4); skLine(g, [[x, y + 26 + h], [x, y + 44 + h]], 5, '#c8302a'); skShine(g, x - w * .2, cy - h * .22, w * .1, h * .14, .5);
    };
    lant(70, 76, 50, 58, '#ffb08a', '#c8302a'); lant(186, 76, 50, 58, '#fff0a0', '#e0a020'); lant(128, 84, 70, 82, '#ffe7a0', '#f07a1e');
  },
  era_brumes: g => {
    skScene(g, '#d2cbe8', '#7d78a8', () => {
      skCirc(g, 186, 64, 20, '#fff3c8', 4); skCirc(g, 196, 58, 17, '#cfc8e4', 0);
      skPath(g, [[128, 34], [168, 98], [88, 98]]); skFS(g, skLG(g, 0, 34, 0, 98, '#7a6ab0', '#3e3070'));
      skRect(g, 100, 96, 56, 140, 3, skLG(g, 100, 0, 156, 0, '#e2dace', '#988c7c')); skRect(g, 118, 116, 20, 28, 9, '#ffd27a', 4);
      [[48, 140, '#f3f0fa'], [24, 168, '#e3ddf1'], [40, 198, '#f7f5fc']].forEach(([x0, y, c]) => { g.beginPath(); g.moveTo(x0 - 60, y + 60); g.lineTo(x0 - 60, y); for (let x = x0 - 60; x < 270; x += 46) g.quadraticCurveTo(x + 23, y - 22, x + 46, y); g.lineTo(270, y + 60); g.closePath(); skFS(g, c, 4); });
    });
    skBlob(g, [[40, 186, 22], [64, 194, 18], [22, 200, 14]], '#f7f5fc', 3); skBlob(g, [[214, 170, 20], [234, 180, 14], [196, 182, 14]], '#f7f5fc', 3);
  },
  era_os_dores: g => {
    skBone(g, 128, 134, .75, 70, '#fff0a0', '#c9902a'); skBone(g, 128, 134, -.75, 70, '#fff0a0', '#c9902a');
    skUnion(g, () => { g.beginPath(); g.moveTo(170, 116); g.arc(128, 116, 42, 0, Math.PI * 2); g.rect(104, 130, 48, 34); }, skRG(g, 128, 116, 56, '#fffbe6', '#e8c46a'));
    skCirc(g, 112, 116, 11, '#3a2410', 0); skCirc(g, 144, 116, 11, '#3a2410', 0); skCirc(g, 115, 113, 3, '#ffe58a', 0); skCirc(g, 147, 113, 3, '#ffe58a', 0);
    skPath(g, [[128, 128], [121, 140], [135, 140]]); skFS(g, '#3a2410', 0); [116, 128, 140].forEach(x => skLine(g, [[x, 152], [x, 164]], 3));
    skPath(g, [[96, 82], [104, 62], [116, 78], [128, 56], [140, 78], [152, 62], [160, 82]]); skFS(g, skLG(g, 0, 56, 0, 82, '#ffe58a', '#d0901e'), 5);
    skShine(g, 108, 94, 14, 7); skSparkle(g, 210, 70, 14); skSparkle(g, 46, 196, 11); skSparkle(g, 204, 200, 9);
  },
  era_grand_festin: g => {
    skEll(g, 128, 184, 104, 34, skLG(g, 0, 150, 0, 218, '#ffffff', '#c8d6e4')); skEll(g, 128, 178, 80, 22, '#e6eef6', 4);
    [[54, 178, -.4], [202, 178, .4]].forEach(([x, y, r]) => { skEll(g, x, y, 22, 10, '#5fa24a', 4, r); }); skCirc(g, 70, 190, 9, '#e8402a', 4); skCirc(g, 188, 192, 9, '#e8402a', 4);
    for (const s of [-1, 1]) { skDuo(g, [[128 + s * 54, 128], [128 + s * 76, 90]], 8, '#fffaf0'); skCirc(g, 128 + s * 72, 84, 9, '#fffaf0', 4); skCirc(g, 128 + s * 84, 88, 9, '#fffaf0', 4); skEll(g, 128 + s * 52, 134, 22, 30, skRG(g, 128 + s * 52, 134, 30, '#f8c27a', '#a8541e'), 6, s * .5); }
    skEll(g, 128, 146, 64, 42, skRG(g, 128, 140, 70, '#f8c27a', '#a0501c')); skShine(g, 106, 126, 22, 9, .5);
    g.save(); g.globalAlpha = .35; [[108, 158], [130, 164], [150, 154]].forEach(([x, y]) => skLine(g, [[x - 8, y], [x + 8, y - 4]], 4)); g.restore();
    [[100, 72], [128, 60], [156, 72]].forEach(([x, y]) => skDuo(g, [[x, y + 24], [x + 8, y + 10], [x - 4, y - 2], [x + 4, y - 16]], 5, '#fff'));
  },
  era_chandelles: g => {
    skScene(g, '#4e3c62', '#211830', () => { [[88, 92], [136, 52], [182, 104]].forEach(([x, y]) => skGlow(g, x, y, 54, 'rgba(255,200,100,.55)')); }, 96);
    skEll(g, 128, 212, 92, 20, skLG(g, 0, 192, 0, 232, '#ffe58a', '#b8801e')); skEll(g, 128, 206, 70, 10, '#fff0b0', 3);
    [[70, 120, 36, 88], [108, 78, 42, 130], [158, 132, 34, 76]].forEach(([x, top, w, h]) => {
      skRect(g, x, top, w, h, 7, skLG(g, x, 0, x + w, 0, '#fffaf0', '#e2d2b0')); skEll(g, x + w * .28, top + 14, 6, 14, '#fffaf0', 4); skEll(g, x + w * .74, top + 10, 5, 9, '#fffaf0', 4);
      skLine(g, [[x + w / 2, top], [x + w / 2, top - 10]], 4); skFlame(g, x + w / 2, top - 14, .85); skEll(g, x + w / 2, top - 16, 4, 7, '#fff', 0);
    });
  },
  era_toiles: g => {
    skScene(g, '#6e5ea0', '#2a2246', () => {
      const cx = 108, cy = 96; g.save(); g.globalAlpha = .9; g.strokeStyle = '#f4f0ff'; g.lineWidth = 3;
      for (let i = 0; i < 10; i++) { const a = i * Math.PI / 5; g.beginPath(); g.moveTo(cx, cy); g.lineTo(cx + Math.cos(a) * 170, cy + Math.sin(a) * 170); g.stroke(); }
      [22, 44, 68, 96, 128].forEach(r => { g.beginPath(); for (let i = 0; i <= 10; i++) { const a = i * Math.PI / 5, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (!i) g.moveTo(x, y); else { const m = a - Math.PI / 10; g.quadraticCurveTo(cx + Math.cos(m) * r * .86, cy + Math.sin(m) * r * .86, x, y); } } g.stroke(); });
      g.restore(); [[60, 70], [150, 150]].forEach(([x, y]) => skCirc(g, x, y, 4, '#bfe6ff', 2));
    });
    skLine(g, [[178, 20], [178, 140]], 3, '#f4f0ff');
    for (const s of [-1, 1]) [[-6, 28, 12], [0, 34, 4], [8, 30, -6], [14, 24, -16]].forEach(([dy, dx, dy2]) => skDuo(g, [[178, 168 + dy], [178 + s * dx, 156 + dy + dy2 * .5], [178 + s * (dx + 12), 176 + dy + dy2]], 4, '#5a4080'));
    skCirc(g, 178, 176, 26, skRG(g, 178, 176, 26, '#9a7ac0', '#3a2a5a')); skCirc(g, 178, 146, 15, skRG(g, 178, 146, 15, '#9a7ac0', '#3a2a5a'));
    skCirc(g, 171, 144, 6, '#fff', 3); skCirc(g, 185, 144, 6, '#fff', 3); skCirc(g, 172, 145, 2.5, SK_INK, 0); skCirc(g, 186, 145, 2.5, SK_INK, 0); skLine(g, [[172, 154], [178, 158], [184, 154]], 3);
    skPath(g, [[178, 170], [186, 180], [178, 190], [170, 180]]); skFS(g, '#e8402a', 3); skShine(g, 168, 166, 8, 4, .4);
  },
  era_gel: g => {
    const hex = r => skPath(g, Array.from({ length: 6 }, (_, i) => [128 + Math.cos(i * Math.PI / 3 + Math.PI / 6) * r, 128 + Math.sin(i * Math.PI / 3 + Math.PI / 6) * r]));
    hex(78); skFS(g, skRG(g, 128, 128, 90, '#ffffff', '#bfe4fb'), 5);
    const arms = []; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 - Math.PI / 2, P = (r, d = 0) => [128 + Math.cos(a + d) * r, 128 + Math.sin(a + d) * r];
      arms.push([P(0), P(108)]); [[46, 30], [76, 22]].forEach(([r, l]) => { const b = P(r); for (const s of [-1, 1]) arms.push([b, [b[0] + Math.cos(a + s * .8) * l, b[1] + Math.sin(a + s * .8) * l]]); }); }
    [[18, SK_INK], [10, '#7cc4ef'], [4, '#ffffff']].forEach(([w, c]) => arms.forEach(p => skLine(g, p, w, c)));
    hex(20); skFS(g, '#e8f6ff', 4); skSparkle(g, 196, 62, 12); skSparkle(g, 62, 200, 9);
  },
  era_crocs: g => {
    skEll(g, 128, 132, 108, 80, skRG(g, 128, 120, 110, '#e8707a', '#a8303e'));
    g.save(); g.beginPath(); g.ellipse(128, 134, 88, 58, 0, 0, Math.PI * 2); g.fillStyle = '#3a0a16'; g.fill(); g.clip();
    skEll(g, 128, 184, 56, 30, skRG(g, 128, 180, 56, '#ff9aa8', '#d0506a'), 4); skLine(g, [[128, 162], [128, 186]], 3);
    const up = x => 134 - 58 * Math.sqrt(Math.max(0, 1 - ((x - 128) / 88) ** 2)), dn = x => 268 - up(x);
    [[60, 9, 22], [84, 11, 28], [108, 14, 46], [148, 14, 46], [172, 11, 28], [196, 9, 22]].forEach(([x, w, h]) => { skPath(g, [[x - w, up(x) - 6], [x, up(x) + h], [x + w, up(x) - 6]]); skFS(g, '#fffaf0', 4); });
    [[74, 9, 20], [100, 10, 22], [156, 10, 22], [182, 9, 20]].forEach(([x, w, h]) => { skPath(g, [[x - w, dn(x) + 6], [x, dn(x) - h], [x + w, dn(x) + 6]]); skFS(g, '#fffaf0', 4); });
    g.restore(); g.beginPath(); g.ellipse(128, 134, 88, 58, 0, 0, Math.PI * 2); g.lineWidth = 6; g.strokeStyle = SK_INK; g.stroke();
    skShine(g, 76, 84, 18, 8, .4); g.beginPath(); g.moveTo(150, 192); g.quadraticCurveTo(160, 220, 150, 232); g.quadraticCurveTo(140, 220, 150, 192); skFS(g, '#bfe6ff', 4);
  },
  era_grimoires: g => {
    skRect(g, 46, 172, 164, 34, 5, skLG(g, 0, 172, 0, 206, '#9a4aa8', '#5a2268')); skRect(g, 192, 176, 14, 26, 2, '#fbf3dc', 3); [74, 170].forEach(x => skLine(g, [[x, 174], [x, 204]], 4, '#e8b84a'));
    skRect(g, 60, 140, 140, 32, 5, skLG(g, 0, 140, 0, 172, '#3a8a6a', '#1e5240')); skRect(g, 64, 144, 12, 24, 2, '#fbf3dc', 3); skCirc(g, 160, 156, 8, '#e8b84a', 3);
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(128, 142); g.quadraticCurveTo(128 + s * 40, 126, 128 + s * 86, 134); g.lineTo(128 + s * 86, 76); g.quadraticCurveTo(128 + s * 40, 66, 128, 82); g.closePath(); skFS(g, '#7a3a1e', 5); }
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(128, 134); g.quadraticCurveTo(128 + s * 40, 116, 128 + s * 78, 124); g.lineTo(128 + s * 78, 70); g.quadraticCurveTo(128 + s * 40, 58, 128, 76); g.closePath(); skFS(g, skLG(g, 128, 0, 128 + s * 78, 0, '#efe2c0', '#fffaf0'), 5); [86, 98, 110].forEach(y => skLine(g, [[128 + s * 16, y - 2], [128 + s * 62, y + 2]], 3, '#9a8a6a')); }
    skStar(g, 128, 40, 4, 16, 5, '#fff3a0', 4); skStar(g, 82, 44, 4, 10, 3, '#c9b0ff', 3); skStar(g, 176, 50, 4, 12, 4, '#a0e8ff', 3);
    skTxt(g, 'ᚱ', 104, 30, 20, '#ffe58a', 4); skTxt(g, 'ᛟ', 154, 24, 18, '#ffe58a', 4);
  },
  era_racines: g => {
    [[[100, 186], [70, 196], [40, 192], [18, 210]], [[116, 194], [108, 212], [96, 224], [86, 236]], [[146, 194], [156, 212], [170, 222], [184, 236]], [[160, 184], [190, 196], [214, 190], [238, 200]]].forEach(p => { g.beginPath(); g.moveTo(...p[0]); g.bezierCurveTo(...p[1], ...p[2], ...p[3]); g.lineCap = 'round'; g.lineWidth = 24; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 13; g.strokeStyle = '#7a4e2a'; g.stroke(); });
    g.beginPath(); g.moveTo(80, 108); g.lineTo(84, 186); g.quadraticCurveTo(128, 206, 172, 186); g.lineTo(176, 108); g.closePath(); skFS(g, skLG(g, 80, 0, 176, 0, '#a8763e', '#5a3a1c'));
    g.save(); g.globalAlpha = .4; [[98, 128, 100, 180], [124, 134, 122, 192], [152, 124, 154, 184]].forEach(([a, b, c, d]) => skLine(g, [[a, b], [c, d]], 4)); g.restore();
    skEll(g, 128, 108, 48, 17, '#ecc88e'); g.save(); g.globalAlpha = .7; [[34, 12], [22, 8], [10, 4]].forEach(([rx, ry]) => { g.beginPath(); g.ellipse(128, 108, rx, ry, 0, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = '#b07a40'; g.stroke(); }); g.restore();
    skLine(g, [[142, 104], [150, 70]], 5, '#3f8a3a'); skEll(g, 134, 70, 16, 8, '#7ac85a', 4, .5); skEll(g, 166, 62, 18, 9, '#7ac85a', 4, -.5);
    skBlob(g, [[92, 186, 14, 9], [108, 192, 10, 7]], '#6ab04a', 3); skCirc(g, 196, 172, 10, '#e8402a', 4); skLine(g, [[196, 182], [196, 192]], 5, '#fffaf0'); [[192, 168], [200, 172]].forEach(([x, y]) => skCirc(g, x, y, 2.5, '#fff', 0));
  },
  era_tonnerre: g => {
    skPath(g, [[132, 112], [100, 168], [124, 168], [106, 232], [168, 148], [142, 148], [162, 112]]); skFS(g, skLG(g, 0, 112, 0, 232, '#fffbb0', '#f0b81e'));
    skBlob(g, [[82, 104, 34], [128, 80, 44], [176, 102, 34], [104, 122, 30], [152, 124, 30]], skLG(g, 0, 40, 0, 150, '#c2cbe6', '#6a7598'));
    skShine(g, 112, 66, 20, 9, .45); skCirc(g, 112, 104, 5, SK_INK, 0); skCirc(g, 146, 104, 5, SK_INK, 0); skLine(g, [[104, 92], [118, 98]], 4); skLine(g, [[154, 92], [140, 98]], 4);
    [[60, 156], [196, 150], [72, 196], [186, 196]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y - 14); g.quadraticCurveTo(x + 10, y + 4, x, y + 6); g.quadraticCurveTo(x - 10, y + 4, x, y - 14); skFS(g, '#7ec8f0', 4); });
  },
  era_masques: g => {
    [[188, 70, '#3ab0a0', -.5], [204, 86, '#f06aa0', -.15], [176, 58, '#ffd24a', -.85]].forEach(([x, y, c, r]) => { skEll(g, x, y - 26, 12, 44, c, 5, r); g.save(); g.translate(x, y - 26); g.rotate(r); skLine(g, [[0, 40], [0, -36]], 3); g.restore(); });
    skDuo(g, [[70, 150], [44, 230]], 7, '#e8b84a');
    g.beginPath(); g.moveTo(128, 104); g.bezierCurveTo(150, 86, 200, 80, 222, 94); g.bezierCurveTo(228, 132, 200, 162, 168, 158); g.bezierCurveTo(148, 156, 138, 142, 128, 142); g.bezierCurveTo(118, 142, 108, 156, 88, 158); g.bezierCurveTo(56, 162, 28, 132, 34, 94); g.bezierCurveTo(56, 80, 106, 86, 128, 104); g.closePath(); skFS(g, skLG(g, 0, 84, 0, 162, '#b878e8', '#4a2a8a'));
    skEll(g, 90, 120, 24, 13, '#1e1230', 5, .18); skEll(g, 166, 120, 24, 13, '#1e1230', 5, -.18);
    [[60, 104], [196, 104], [104, 146], [152, 146], [48, 128], [208, 128]].forEach(([x, y]) => skCirc(g, x, y, 4, '#ffd24a', 2)); skCirc(g, 128, 112, 10, '#ff6a8a', 4); skShine(g, 70, 96, 14, 6, .45);
  },
  era_sorts_perdus: g => {
    const sp = []; for (let t = 0; t < 3.4 * Math.PI; t += .2) { const r = 4 + t * 7.4; sp.push([176 + Math.cos(t + 2.4) * r, 92 + Math.sin(t + 2.4) * r]); }
    skLine(g, sp, 12); skLine(g, sp, 6, '#c9a8ff'); g.save(); g.globalAlpha = .6; skLine(g, sp, 2, '#fff'); g.restore();
    [[208, 172, 12, '#ffd24a'], [60, 70, 10, '#a0e8ff'], [100, 40, 7, '#ff9ad0'], [226, 120, 7, '#fff3a0']].forEach(([x, y, r, c]) => skStar(g, x, y, 5, r, r * .45, c, 4));
    g.save(); g.globalAlpha = .45; [[40, 120], [30, 160], [70, 30]].forEach(([x, y]) => skStar(g, x, y, 4, 7, 2, '#fff', 2)); g.restore();
    skDuo(g, [[54, 214], [148, 120]], 12, '#4a2a1a'); skLine(g, [[64, 204], [80, 188]], 6, '#c9902a'); skStar(g, 154, 114, 5, 28, 12, skRG(g, 154, 114, 28, '#fff8c0', '#f0a81e'), 5);
  },
  era_cendres: g => {
    skEll(g, 128, 198, 96, 24, skLG(g, 0, 176, 0, 222, '#b0aaa4', '#6e6862'));
    g.save(); g.globalAlpha = .9; skBlob(g, [[118, 76, 18], [138, 56, 14], [124, 34, 10]], '#c8c2bc', 3); skBlob(g, [[160, 92, 12], [172, 74, 9]], '#c8c2bc', 3); g.restore();
    skFlame(g, 128, 150, 1.1, '#ffe07a', '#e8461e'); skFlame(g, 106, 162, .6, '#ffc07a', '#c8361e'); skFlame(g, 152, 160, .65, '#ffc07a', '#c8361e');
    for (const [r, x] of [[.38, 128], [-.38, 128]]) { g.save(); g.translate(x, 178); g.rotate(r); skRect(g, -78, -15, 156, 30, 14, skLG(g, 0, -15, 0, 15, '#8a5a32', '#2e1c12')); skEll(g, (r > 0 ? 1 : -1) * 72, 0, 9, 14, '#d8a870', 4); g.restore(); }
    [[96, 186], [150, 190], [124, 196], [174, 182], [84, 176]].forEach(([x, y]) => skCirc(g, x, y, 5, '#ff7a2a', 2));
    [[100, 110], [158, 104], [142, 84]].forEach(([x, y]) => skCirc(g, x, y, 3.5, '#ffb03a', 2));
  },
  era_lune_rousse: g => {
    skScene(g, '#3c2a5e', '#1c1232', () => {
      [[48, 70], [70, 40], [210, 150], [196, 196], [40, 150]].forEach(([x, y]) => skSparkle(g, x, y, 6));
      skCirc(g, 146, 108, 74, skRG(g, 146, 108, 74, '#ffc48a', '#c8482a'), 5); [[124, 92, 14], [168, 128, 18], [150, 74, 8], [118, 136, 9]].forEach(([x, y, r]) => skCirc(g, x, y, r, 'rgba(150,40,20,.35)', 3));
      skPath(g, [[0, 256], [0, 214], [40, 200], [92, 212], [120, 200], [180, 212], [256, 196], [256, 256]]); skFS(g, '#120a20', 4);
      skLine(g, [[200, 204], [196, 168], [184, 156]], 6); skLine(g, [[197, 180], [212, 164]], 5);
    });
    const bx = 76, by = 168; g.beginPath(); g.moveTo(bx, by - 4);
    for (const s of [-1, 1]) { g.moveTo(bx, by - 4); g.quadraticCurveTo(bx + s * 26, by - 34, bx + s * 60, by - 22); g.quadraticCurveTo(bx + s * 50, by - 10, bx + s * 50, by + 2); g.quadraticCurveTo(bx + s * 40, by - 6, bx + s * 34, by + 8); g.quadraticCurveTo(bx + s * 22, by, bx, by + 12); }
    g.lineWidth = 12; g.strokeStyle = SK_INK; g.lineJoin = 'round'; g.stroke(); g.fillStyle = '#3a2440'; g.fill();
    skPath(g, [[bx - 9, by - 8], [bx - 12, by - 24], [bx - 2, by - 12], [bx + 2, by - 12], [bx + 12, by - 24], [bx + 9, by - 8], [bx + 9, by + 8], [bx - 9, by + 8]]); skFS(g, '#3a2440', 4);
    skCirc(g, bx - 4, by - 4, 2.5, '#ffd24a', 0); skCirc(g, bx + 4, by - 4, 2.5, '#ffd24a', 0);
  },
  era_couronnes: g => {
    skEll(g, 128, 200, 100, 28, skLG(g, 0, 172, 0, 228, '#b04a8a', '#5a1e4a')); [[34, 200], [222, 200]].forEach(([x, y]) => { skCirc(g, x, y + 4, 8, '#ffd24a', 4); skLine(g, [[x, y + 10], [x, y + 26]], 5, '#ffd24a'); });
    skPath(g, [[56, 160], [46, 84], [88, 124], [128, 64], [168, 124], [210, 84], [200, 160]]); skFS(g, skLG(g, 0, 64, 0, 160, '#fff0a0', '#d0901e'));
    skRect(g, 50, 152, 156, 36, 8, skLG(g, 0, 152, 0, 188, '#ffe58a', '#b8781a')); [[46, 78, 12], [128, 56, 14], [210, 78, 12]].forEach(([x, y, r]) => skCirc(g, x, y, r, skRG(g, x, y, r, '#fff8d0', '#e0a020')));
    [[88, 170, '#e8402a'], [128, 170, '#3a8ae8'], [168, 170, '#3ab85a']].forEach(([x, y, c]) => { skEll(g, x, y, 11, 9, c, 4); skCirc(g, x - 3, y - 3, 3, '#fff', 0); });
    skCirc(g, 128, 112, 12, '#e8402a', 4); skCirc(g, 124, 108, 3, '#fff', 0); skShine(g, 86, 116, 12, 22, .45); skSparkle(g, 212, 40, 12);
  },
  era_murmures: g => {
    g.beginPath(); g.moveTo(74, 206); g.lineTo(74, 112); g.arc(124, 112, 50, Math.PI, 0); g.lineTo(174, 206);
    [[162, 192, 150, 206], [138, 220, 124, 206], [112, 192, 100, 206], [88, 220, 74, 206]].forEach(([a, b, c, d]) => g.quadraticCurveTo(a, b, c, d)); g.closePath(); skFS(g, skLG(g, 0, 60, 0, 220, '#ffffff', '#d2c8f0'));
    skEll(g, 106, 112, 7, 11, SK_INK, 0); skEll(g, 140, 112, 7, 11, SK_INK, 0); skCirc(g, 108, 108, 2.5, '#fff', 0); skCirc(g, 142, 108, 2.5, '#fff', 0);
    skCirc(g, 94, 132, 8, 'rgba(240,120,160,.45)', 0); skCirc(g, 152, 132, 8, 'rgba(240,120,160,.45)', 0); skEll(g, 124, 138, 6, 8, '#5a3a5a', 3);
    skBlob(g, [[176, 140, 14, 10]], '#f2eefc', 3);
    [[[184, 118], [200, 104], [214, 112], [230, 96]], [[186, 146], [206, 146], [218, 160], [236, 156]]].forEach(p => { skLine(g, p, 10); skLine(g, p, 5, '#c9b8ff'); });
    skTxt(g, 'chut…', 196, 58, 26, '#efe6ff'); skShine(g, 100, 78, 16, 8, .5);
  },
  era_champignons: g => {
    skEll(g, 128, 206, 104, 22, skLG(g, 0, 184, 0, 228, '#8ad06a', '#3f8a3a'));
    const cap = (x, y, rx, ry, c1, c2) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, Math.PI, 0); g.quadraticCurveTo(x, y + ry * .35, x - rx, y); g.closePath(); skFS(g, skRG(g, x, y - ry * .5, rx, c1, c2)); };
    skRect(g, 176, 148, 18, 56, 8, '#f6ecd6', 5); cap(185, 152, 34, 28, '#c8a0f0', '#6a3aa8'); [[174, 136], [194, 132]].forEach(([x, y]) => skCirc(g, x, y, 5, '#fff', 3));
    skRect(g, 52, 170, 14, 36, 6, '#f6ecd6', 4); cap(59, 172, 24, 20, '#ffc07a', '#d0701e');
    g.beginPath(); g.moveTo(96, 118); g.quadraticCurveTo(88, 170, 92, 206); g.lineTo(132, 206); g.quadraticCurveTo(136, 170, 128, 118); g.closePath(); skFS(g, skLG(g, 92, 0, 132, 0, '#fffaf0', '#e2d2b0'));
    skCirc(g, 104, 160, 4, SK_INK, 0); skCirc(g, 122, 160, 4, SK_INK, 0); skLine(g, [[106, 172], [113, 177], [120, 172]], 3); skCirc(g, 98, 168, 5, 'rgba(240,120,120,.4)', 0); skCirc(g, 128, 168, 5, 'rgba(240,120,120,.4)', 0);
    cap(112, 124, 72, 60, '#ff8a6a', '#c8241e'); [[84, 96, 10], [120, 78, 12], [150, 104, 9], [100, 114, 6], [64, 116, 6], [140, 86, 5]].forEach(([x, y, r]) => skCirc(g, x, y, r, '#fffaf0', 3)); skShine(g, 92, 80, 16, 8, .45);
    [[30, 196], [222, 198]].forEach(([x, y]) => skLine(g, [[x - 8, y], [x - 4, y - 18], [x, y], [x + 4, y - 14], [x + 8, y]], 4, '#3f8a3a'));
  },
  era_chaudron: g => {
    skFlame(g, 100, 220, .7, '#ffe07a', '#e8461e'); skFlame(g, 128, 226, .85, '#ffe07a', '#e8461e'); skFlame(g, 156, 220, .7, '#ffe07a', '#e8461e');
    [[78, 196], [170, 196]].forEach(([x, y]) => skRect(g, x, y, 10, 18, 3, '#2a2a34', 4));
    skDuo(g, [[166, 112], [204, 42]], 7, '#9a6a3a'); skEll(g, 206, 40, 14, 9, '#9a6a3a', 4, -.5);
    skEll(g, 128, 156, 82, 60, skRG(g, 112, 136, 90, '#6a6a7e', '#16161e')); skShine(g, 82, 146, 10, 20, .3);
    skEll(g, 128, 110, 86, 20, skLG(g, 0, 90, 0, 130, '#8a8a9e', '#3a3a46')); skEll(g, 128, 110, 72, 13, skRG(g, 128, 108, 72, '#d8ff8a', '#3aa83a'), 4);
    g.beginPath(); g.moveTo(70, 112); g.quadraticCurveTo(66, 132, 72, 142); g.quadraticCurveTo(80, 132, 82, 116); skFS(g, '#7ad84a', 4);
    [[108, 86, 13], [146, 72, 10], [124, 50, 7], [162, 96, 7], [96, 60, 5]].forEach(([x, y, r]) => { skCirc(g, x, y, r, skRG(g, x, y, r, '#efffc0', '#5ac83a'), 4); skCirc(g, x - r * .35, y - r * .35, r * .25, '#fff', 0); });
  },
  era_girouettes: g => {
    skPath(g, [[52, 240], [128, 196], [204, 240]]); skFS(g, skLG(g, 0, 196, 0, 240, '#e8604a', '#a8301e')); skLine(g, [[90, 218], [166, 218]], 3);
    skDuo(g, [[128, 200], [128, 96]], 6, '#4a4a5a'); skDuo(g, [[72, 166], [184, 166]], 5, '#4a4a5a'); skTxt(g, 'O', 56, 166, 24, '#ffd24a'); skTxt(g, 'E', 200, 166, 24, '#ffd24a');
    skDuo(g, [[54, 128], [196, 128]], 6, '#3a3a4a'); skPath(g, [[192, 114], [218, 128], [192, 142]]); skFS(g, '#ffd24a', 5); skPath(g, [[54, 128], [38, 112], [48, 128], [38, 144]]); skFS(g, '#ffd24a', 4);
    [[-.9, 26], [-.5, 30], [-.1, 26]].forEach(([r, l]) => skEll(g, 98 + Math.cos(Math.PI + r) * 14, 86 + Math.sin(Math.PI + r) * 14, l, 9, '#d8a020', 4, r + Math.PI / 2 - .2));
    skEll(g, 124, 92, 30, 20, skRG(g, 120, 86, 30, '#fff0a0', '#d0901e')); skCirc(g, 152, 68, 14, skRG(g, 152, 68, 14, '#fff0a0', '#d0901e'));
    skBlob(g, [[146, 52, 6], [154, 50, 6], [161, 55, 5]], '#e8402a', 3); skPath(g, [[164, 66], [178, 70], [164, 74]]); skFS(g, '#f08a1e', 3); skEll(g, 160, 82, 4, 7, '#e8402a', 3); skCirc(g, 155, 65, 2.8, SK_INK, 0);
    skLine(g, [[118, 110], [118, 124]], 4); skLine(g, [[134, 110], [134, 124]], 4);
  },
  era_cles_rouillees: g => {
    g.beginPath(); g.arc(128, 62, 34, 0, Math.PI * 2); g.lineWidth = 15; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 7; g.strokeStyle = '#9a6a3a'; g.stroke();
    const key = (x, y, a, L, c1, c2) => { g.save(); g.translate(x, y); g.rotate(a);
      skUnion(g, () => { g.beginPath(); g.moveTo(20, 18); g.arc(0, 18, 20, 0, Math.PI * 2); g.rect(-7, 30, 14, L); g.rect(0, L + 6, 22, 12); g.rect(0, L - 14, 16, 10); }, skLG(g, -20, 0, 22, 0, c1, c2));
      skCirc(g, 0, 18, 8, '#3a1e0e', 4); g.save(); g.globalAlpha = .35; [[6, 50, 5], [-3, L * .6, 4], [12, L + 12, 3]].forEach(([a, b, r]) => skCirc(g, a, b, r, '#5a2a10', 0)); g.restore(); skShine(g, -8, 10, 4, 7, .5); g.restore(); };
    key(104, 86, .42, 96, '#e0985a', '#8a4a20'); key(152, 86, -.42, 88, '#c8a070', '#6a4a2a'); key(128, 92, 0, 112, '#e8a868', '#9a4a1e');
  },
  era_ronces: g => {
    const V1 = [[16, 196], [70, 112], [128, 236], [174, 138]], V2 = [[174, 138], [196, 96], [220, 112], [240, 66]], V3 = [[34, 84], [82, 50], [112, 140], [150, 104]];
    const vine = P => { g.beginPath(); g.moveTo(...P[0]); g.bezierCurveTo(...P[1], ...P[2], ...P[3]); g.lineCap = 'round'; g.lineWidth = 19; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 10; g.strokeStyle = '#5e7a34'; g.stroke(); };
    const thorns = P => { for (let i = 1; i < 10; i++) { const t = i / 10, [x, y] = skBez(P, t), [x2, y2] = skBez(P, t + .01), a = Math.atan2(y2 - y, x2 - x) + (i % 2 ? 1 : -1) * Math.PI / 2; skPath(g, [[x + Math.cos(a + 1.6) * 5, y + Math.sin(a + 1.6) * 5], [x + Math.cos(a) * 17, y + Math.sin(a) * 17], [x + Math.cos(a - 1.6) * 5, y + Math.sin(a - 1.6) * 5]]); skFS(g, '#c8d890', 3); } };
    [V3, V1, V2].forEach(P => { vine(P); thorns(P); });
    [[96, 150, .6], [204, 112, -.4], [60, 70, -.8]].forEach(([x, y, r]) => { skEll(g, x, y, 20, 10, '#7ab84a', 4, r); g.save(); g.translate(x, y); g.rotate(r); skLine(g, [[-14, 0], [14, 0]], 2.5); g.restore(); });
    const berry = (x, y, c) => { [[0, -10], [-9, -3], [9, -3], [-6, 7], [6, 7], [0, 0], [0, 13]].forEach(([a, b]) => skCirc(g, x + a, y + b, 7, skRG(g, x + a, y + b, 7, c[0], c[1]), 3)); skPath(g, [[x - 8, y - 16], [x, y - 22], [x + 8, y - 16], [x, y - 12]]); skFS(g, '#5fa24a', 3); };
    berry(150, 176, ['#8a5ab0', '#2a1240']); berry(186, 182, ['#8a5ab0', '#2a1240']); berry(118, 76, ['#ff8a8a', '#c8241e']);
  },
  era_lucioles: g => {
    skRect(g, 66, 66, 124, 152, 30, skLG(g, 0, 66, 0, 218, '#2a3a6e', '#121a3a'));
    [[100, 118], [150, 104], [126, 164], [92, 186], [160, 176], [140, 136]].forEach(([x, y], i) => { skGlow(g, x, y, 22, 'rgba(230,255,120,.55)'); skCirc(g, x, y, 5 + (i % 2) * 2, '#f8ffb0', 2); });
    g.save(); g.globalAlpha = .45; skRect(g, 78, 84, 12, 110, 6, '#fff', 0); skRect(g, 96, 80, 6, 40, 3, '#fff', 0); g.restore();
    skRect(g, 72, 46, 112, 26, 8, skLG(g, 0, 46, 0, 72, '#d8a060', '#8a5a2a')); skRect(g, 62, 64, 132, 12, 6, '#c8302a', 4); skLine(g, [[176, 70], [196, 92], [190, 100]], 5, '#c8302a');
    const fly = (x, y, r) => { skEll(g, x - 6, y - 8, 8, 5, 'rgba(230,240,255,.95)', 3, -.6); skEll(g, x + 6, y - 8, 8, 5, 'rgba(230,240,255,.95)', 3, .6); skEll(g, x, y, 6, 9, '#3a2a2a', 3); skCirc(g, x, y + 9, r, '#e8ff7a', 3); };
    fly(214, 74, 6); fly(40, 140, 5); fly(206, 196, 5);
  },
  era_any: g => {
    skRect(g, 66, 32, 124, 22, 8, skLG(g, 0, 32, 0, 54, '#c99a5a', '#7a4a2a')); skRect(g, 66, 202, 124, 22, 8, skLG(g, 0, 202, 0, 224, '#c99a5a', '#7a4a2a'));
    [80, 176].forEach(x => skDuo(g, [[x, 54], [x, 202]], 6, '#9a6a3a'));
    g.beginPath(); g.moveTo(92, 54); g.quadraticCurveTo(92, 110, 124, 128); g.quadraticCurveTo(92, 146, 92, 202); g.lineTo(164, 202); g.quadraticCurveTo(164, 146, 132, 128); g.quadraticCurveTo(164, 110, 164, 54); g.closePath(); skFS(g, 'rgba(220,240,255,.9)', 5);
    skPath(g, [[104, 88], [152, 88], [128, 122]]); skFS(g, '#f0c060', 3); skPath(g, [[100, 200], [128, 166], [156, 200]]); skFS(g, '#f0c060', 3); skLine(g, [[128, 128], [128, 168]], 3, '#f0c060');
  },
});
// le nom d'une ère donne la clé de son dessin : « des Os dorés » → era_os_dores
const eraSlug = n => String(n || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^(du|des|de la|de l['’]|d['’])\s*/, '').replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
const eraArtKey = n => (SKA['era_' + eraSlug(n)] ? 'era_' + eraSlug(n) : 'era_any');

/* ---------- lot 2 : les reliques d'ère, et les Merveilles ---------- */
const skWood = (g, y0, y1, a = '#c99a5a', b = '#7a4a2a') => skLG(g, 0, y0, 0, y1, a, b);
const skGold = (g, y0, y1) => skLG(g, 0, y0, 0, y1, '#fff0a0', '#c48a1e');
const skHalo = (g, x, y, rx, ry) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.lineWidth = 11; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 5; g.strokeStyle = '#ffe07a'; g.stroke(); };
const skRot = (g, x, y, a, f) => { g.save(); g.translate(x, y); g.rotate(a); f(); g.restore(); };
const skCoin = (g, x, y, r = 14) => { skCirc(g, x, y, r, skRG(g, x, y, r, '#fff6b0', '#d0901e'), 4); g.beginPath(); g.arc(x, y, r * .6, 0, Math.PI * 2); g.lineWidth = 2; g.strokeStyle = 'rgba(120,70,10,.6)'; g.stroke(); };
Object.assign(SKA, {
  rel_truelle: g => {
    [[40, 174, 70], [112, 174, 70], [76, 140, 70]].forEach(([x, y, w]) => { skRect(g, x, y, w, 32, 4, skLG(g, 0, y, 0, y + 32, '#e8806a', '#a8402a')); g.save(); g.globalAlpha = .3; skLine(g, [[x + 8, y + 10], [x + 24, y + 10]], 3, '#fff'); g.restore(); });
    skRot(g, 146, 112, -.7, () => { skPath(g, [[-8, -70], [42, 30], [-58, 30]]); skFS(g, skLG(g, -58, 0, 42, 0, '#f4f8fc', '#8a98aa')); skShine(g, -10, 0, 8, 26, .5); skDuo(g, [[-8, 30], [-8, 52]], 6, '#6a6a7a'); skRect(g, -20, 50, 24, 50, 10, skWood(g, 50, 100)); });
    skEll(g, 112, 132, 18, 8, '#d8d0c0', 4); skHalo(g, 176, 46, 34, 10); skSparkle(g, 218, 92, 12); skSparkle(g, 36, 120, 9);
  },
  rel_plans: g => {
    skRect(g, 56, 62, 150, 132, 4, skLG(g, 0, 62, 0, 194, '#5a8ad0', '#2a4a8a'));
    g.save(); g.globalAlpha = .25; for (let x = 72; x < 206; x += 16) skLine(g, [[x, 66], [x, 190]], 2, '#fff'); for (let y = 76; y < 194; y += 16) skLine(g, [[60, y], [202, y]], 2, '#fff'); g.restore();
    skLine(g, [[84, 172], [84, 120], [100, 120], [100, 104], [116, 104], [116, 120], [148, 120], [148, 96], [164, 96], [164, 120], [180, 120], [180, 172], [84, 172]], 4, '#eaf4ff'); skLine(g, [[124, 172], [124, 148], [140, 148], [140, 172]], 4, '#eaf4ff');
    skRect(g, 36, 56, 26, 144, 13, skLG(g, 36, 0, 62, 0, '#7aa6e8', '#2a4a8a')); skEll(g, 49, 56, 13, 6, '#cfe0f8', 4);
    skDuo(g, [[184, 30], [156, 146]], 5, '#c8ccd4'); skDuo(g, [[184, 30], [214, 140]], 5, '#c8ccd4'); skCirc(g, 184, 30, 10, '#ffd24a', 4); skPath(g, [[156, 146], [152, 160], [160, 148]]); skFS(g, '#8a8a9a', 3);
  },
  rel_oeil: g => {
    skDuo(g, [[30, 202], [226, 192]], 10, '#8a5a32'); skEll(g, 200, 182, 12, 6, '#7ab84a', 3, -.4);
    skPath(g, [[86, 150], [24, 186], [36, 198], [98, 166]]); skFS(g, skLG(g, 24, 0, 98, 0, '#3a5ab0', '#1a2244'));
    skEll(g, 116, 146, 52, 36, skRG(g, 110, 136, 52, '#4a4a5e', '#14141e')); skEll(g, 128, 160, 30, 20, '#f8f6f0', 4); skEll(g, 104, 140, 30, 18, skLG(g, 74, 0, 134, 0, '#4a7ad8', '#1a2a6a'), 4, -.2);
    skCirc(g, 160, 104, 30, skRG(g, 160, 104, 30, '#4a4a5e', '#14141e')); skPath(g, [[184, 98], [214, 108], [184, 116]]); skFS(g, '#4a4a54', 4);
    skCirc(g, 166, 98, 13, '#fff', 4); skCirc(g, 169, 98, 7, '#1a1a2a', 0); skCirc(g, 172, 95, 2.5, '#fff', 0);
    g.beginPath(); g.arc(216, 124, 12, 0, Math.PI * 2); g.lineWidth = 11; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 5; g.strokeStyle = '#ffd24a'; g.stroke(); skStar(g, 216, 112, 4, 7, 2, '#ff6a8a', 2); skSparkle(g, 232, 92, 9);
    [[106, 196], [128, 198]].forEach(([x, y]) => skLine(g, [[x, y - 30], [x, y]], 4));
  },
  rel_cheminee: g => {
    skRect(g, 40, 76, 176, 148, 6, skLG(g, 0, 76, 0, 224, '#d8ccb8', '#9a8a74'));
    g.save(); g.globalAlpha = .35; [[44, 104, 60], [110, 104, 50], [170, 104, 44], [44, 132, 34], [180, 132, 34], [44, 160, 30], [186, 160, 28], [44, 188, 30], [186, 188, 28]].forEach(([x, y, w]) => skRect(g, x, y, w, 24, 3, 'rgba(0,0,0,0)', 3)); g.restore();
    g.beginPath(); g.moveTo(78, 224); g.lineTo(78, 150); g.arc(128, 150, 50, Math.PI, 0); g.lineTo(178, 224); g.closePath(); skFS(g, skRG(g, 128, 200, 70, '#5a2a14', '#1e100a'));
    skFlame(g, 108, 196, .8, '#ffe07a', '#e8461e'); skFlame(g, 148, 196, .8, '#ffe07a', '#e8461e'); skFlame(g, 128, 186, 1.2);
    skRot(g, 128, 212, .12, () => skRect(g, -44, -8, 88, 16, 8, skWood(g, -8, 8, '#8a5a32', '#4a2a1a'))); skRot(g, 128, 212, -.12, () => skRect(g, -44, -8, 88, 16, 8, skWood(g, -8, 8, '#9a6a3a', '#5a3a22')));
    skRect(g, 26, 60, 204, 22, 6, skWood(g, 60, 82)); skRect(g, 50, 34, 14, 26, 4, '#fffaf0', 4); skFlame(g, 57, 26, .45); skRect(g, 192, 38, 14, 22, 4, '#fffaf0', 4); skFlame(g, 199, 30, .45);
    skCirc(g, 128, 46, 14, skRG(g, 128, 46, 14, '#fff6b0', '#d0901e'), 4); skLine(g, [[128, 46], [128, 38]], 3); skLine(g, [[128, 46], [134, 50]], 3);
  },
  rel_paillasses: g => {
    [[40, 168, '#e8c46a', '#b88a2a'], [50, 128, '#f0d07a', '#c09232'], [44, 88, '#e8c46a', '#b88a2a']].forEach(([x, y, a, b]) => {
      skRect(g, x, y, 168, 40, 18, skLG(g, 0, y, 0, y + 40, a, b)); g.save(); g.globalAlpha = .55; for (let i = x + 20; i < x + 160; i += 18) skLine(g, [[i, y + 6], [i + 4, y + 34]], 2.5, '#8a6a1e'); g.restore();
      [[x + 4, y + 20, -1], [x + 164, y + 18, 1]].forEach(([sx, sy, s]) => [[-8, 0], [-4, 6], [-10, -6]].forEach(([dx, dy]) => skLine(g, [[sx, sy + dy], [sx + s * 14, sy + dy + dx * .4]], 3, '#d8a83a')));
    });
    skEll(g, 168, 76, 34, 18, skRG(g, 168, 72, 34, '#ffffff', '#cfd8e8')); skLine(g, [[150, 70], [160, 76]], 3, '#9aa6ba');
    skTxt(g, 'z', 196, 44, 26, '#bfe6ff'); skTxt(g, 'z', 218, 24, 18, '#bfe6ff');
  },
  rel_pheromones: g => {
    skDuo(g, [[180, 100], [204, 84], [214, 60]], 4, '#c86a9a'); skCirc(g, 216, 52, 15, skRG(g, 216, 52, 15, '#ff9ac8', '#c8306a'));
    g.beginPath(); g.moveTo(128, 82); g.bezierCurveTo(200, 70, 206, 208, 128, 214); g.bezierCurveTo(50, 208, 56, 70, 128, 82); skFS(g, skRG(g, 112, 140, 90, '#ffd0e8', '#d84a8a'));
    g.save(); g.globalAlpha = .35; skLine(g, [[128, 90], [128, 206]], 3, '#fff'); skLine(g, [[84, 120], [172, 120]], 3, '#fff'); g.restore(); skShine(g, 96, 128, 10, 26, .55);
    skRect(g, 112, 62, 32, 24, 4, '#f0c0d8'); skPath(g, [[128, 18], [150, 48], [128, 64], [106, 48]]); skFS(g, skLG(g, 106, 0, 150, 0, '#f8e8ff', '#a87ad8')); skShine(g, 120, 40, 4, 8, .7);
    skHeart(g, 50, 70, 26, '#ff6a9a', 4); skHeart(g, 34, 120, 18, '#ff9ac0', 3); skHeart(g, 222, 150, 22, '#ff6a9a', 4); skHeart(g, 128, 150, 34, '#ff4a8a', 4);
  },
  rel_serment: g => {
    for (const [x, c1, c2] of [[104, '#fff0a0', '#c48a1e'], [150, '#f4f8fc', '#8a98aa']]) { g.beginPath(); g.arc(x, 62, 28, 0, Math.PI * 2); g.lineWidth = 17; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 9; g.strokeStyle = skLG(g, 0, 34, 0, 90, c1, c2); g.stroke(); }
    skHeart(g, 128, 156, 120, skRG(g, 110, 136, 90, '#ff8a9a', '#c8203a'), 6); skShine(g, 92, 122, 14, 8, .5);
    skPath(g, [[30, 150], [226, 138], [236, 166], [220, 178], [228, 194], [36, 202], [22, 186], [36, 176], [20, 162]]); skFS(g, skLG(g, 0, 138, 0, 202, '#fff6e0', '#e2c89a'), 5);
    skTxt(g, '♥ toujours ♥', 128, 172, 22, '#c8203a', 0);
  },
  rel_carnet: g => {
    skDuo(g, [[200, 40], [222, 190]], 11, '#ffd24a'); skPath(g, [[218, 186], [224, 210], [228, 184]]); skFS(g, '#f8d8b0', 3); skLine(g, [[197, 46], [203, 40]], 9, '#ff8aa0');
    skRot(g, 118, 128, -.08, () => {
      skRect(g, -70, -92, 140, 184, 12, skLG(g, -70, 0, 70, 0, '#d0623a', '#8a2a1e')); skRect(g, -58, -84, 128, 170, 8, '#fbf3dc', 3); skRect(g, -70, -92, 132, 184, 12, skLG(g, -70, 0, 70, 0, '#e0724a', '#9a3a22'));
      skRect(g, 44, -92, 14, 184, 3, '#5a2a14', 4); skRect(g, 40, -12, 28, 16, 6, '#c9902a', 4);
      skHeart(g, -8, -26, 54, '#ffd0dc', 5); skHeart(g, -8, -26, 30, '#ff6a8a', 0);
      skLine(g, [[-40, 40], [24, 40]], 4, '#fbe2b8'); skLine(g, [[-40, 56], [10, 56]], 4, '#fbe2b8');
      skPath(g, [[20, 92], [32, 92], [32, 128], [26, 120], [20, 128]]); skFS(g, '#3a8ae8', 4);
    });
  },
  rel_mentorat: g => {
    skDuo(g, [[70, 230], [158, 64]], 14, '#8a5a32'); g.save(); g.globalAlpha = .4; skLine(g, [[90, 192], [104, 166]], 4, '#5a3a1e'); g.restore();
    g.beginPath(); g.arc(170, 60, 24, Math.PI * .8, Math.PI * 2.2); g.lineWidth = 22; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 12; g.strokeStyle = '#8a5a32'; g.stroke();
    skPath(g, [[170, 34], [188, 60], [170, 86], [152, 60]]); skFS(g, skLG(g, 152, 0, 188, 0, '#c8f0ff', '#3a8ad8')); skShine(g, 164, 52, 4, 9, .7);
    skRot(g, 92, 126, -.25, () => { skPath(g, [[-46, -10], [0, -30], [46, -10], [0, 10]]); skFS(g, '#2a2a3a', 5); skRect(g, -24, -6, 48, 26, 6, '#3a3a4e'); skDuo(g, [[0, -10], [34, 0], [34, 30]], 3, '#ffd24a'); skCirc(g, 34, 34, 6, '#ffd24a', 3); });
    [[208, 120], [226, 90], [212, 160]].forEach(([x, y], i) => skStar(g, x, y, 4, 12 - i * 2, 4, '#fff3a0', 3)); skTxt(g, '+1', 46, 64, 28, '#a0e8a0');
  },
  rel_ballade: g => {
    skRot(g, 120, 140, -.65, () => {
      skRect(g, -9, -132, 18, 100, 4, skWood(g, -132, -32, '#8a5a32', '#4a2a1a')); skRot(g, 0, -132, -.5, () => { skRect(g, -10, -30, 20, 34, 5, '#6a4024'); [[-14, -22], [14, -22], [-14, -8], [14, -8]].forEach(([x, y]) => skCirc(g, x, y, 5, '#f8e8c8', 3)); });
      g.beginPath(); g.moveTo(0, -40); g.bezierCurveTo(56, -36, 66, 70, 0, 78); g.bezierCurveTo(-66, 70, -56, -36, 0, -40); skFS(g, skRG(g, -14, 10, 70, '#f0b060', '#9a5a1e'));
      skCirc(g, 0, 8, 18, '#3a1e0e', 4); g.save(); g.globalAlpha = .7; g.beginPath(); g.arc(0, 8, 23, 0, Math.PI * 2); g.lineWidth = 3; g.strokeStyle = '#ffd24a'; g.setLineDash([4, 4]); g.stroke(); g.restore();
      skRect(g, -16, 44, 32, 9, 3, '#4a2a1a', 3); [-5, 0, 5].forEach(x => skLine(g, [[x, -130], [x, 48]], 1.3, '#fff8e0')); skShine(g, -24, -8, 8, 20, .4);
    });
    skNote(g, 186, 92, 1.1, '#e8402a'); skNote(g, 214, 150, .85, '#3a6ad8'); skNote(g, 46, 92, .8, '#8a3ab0');
  },
  rel_statue: g => {
    skRect(g, 66, 166, 124, 52, 4, skLG(g, 0, 166, 0, 218, '#e8e2d6', '#a8a094')); skRect(g, 56, 206, 144, 18, 4, '#c8c0b2'); skRect(g, 56, 156, 144, 16, 4, '#d8d0c2');
    skEll(g, 98, 96, 26, 40, '#b8b4ac', 5, -.5); skEll(g, 158, 96, 26, 40, '#b8b4ac', 5, .5);
    skEll(g, 128, 124, 40, 36, skRG(g, 118, 110, 44, '#f0ece4', '#a8a298')); skCirc(g, 128, 80, 30, skRG(g, 120, 72, 32, '#f0ece4', '#a8a298'));
    skPath(g, [[104, 64], [96, 36], [114, 56]]); skFS(g, '#d8d2c6', 4); skPath(g, [[152, 64], [160, 36], [142, 56]]); skFS(g, '#d8d2c6', 4);
    skLine(g, [[114, 80], [122, 84]], 4); skLine(g, [[142, 80], [134, 84]], 4); skLine(g, [[118, 96], [128, 102], [138, 96]], 4); skPath(g, [[122, 99], [124, 106], [127, 100]]); skFS(g, '#fff', 2);
    skBlob(g, [[78, 158, 12, 7], [92, 160, 8, 6]], '#7ab84a', 3); skLaurel(g, '#e8b82a');
    skRect(g, 98, 182, 60, 22, 4, skGold(g, 182, 204)); skTxt(g, 'XIII', 128, 194, 15, '#5a3a1e', 0);
  },
  rel_huile: g => {
    [[60, 196, 8], [72, 222, 6]].forEach(([x, y, r]) => { g.beginPath(); g.moveTo(x, y - r * 2); g.quadraticCurveTo(x + r * 1.3, y + r * .4, x, y + r); g.quadraticCurveTo(x - r * 1.3, y + r * .4, x, y - r * 2); skFS(g, '#f0c040', 3); });
    skDuo(g, [[94, 132], [54, 176]], 10, '#9aa6b6'); skRect(g, 46, 172, 14, 10, 3, '#6a7686', 3);
    g.beginPath(); g.arc(186, 132, 30, -Math.PI * .6, Math.PI * .6); g.lineWidth = 19; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 10; g.strokeStyle = '#7a8696'; g.stroke();
    skEll(g, 140, 156, 60, 52, skRG(g, 128, 140, 64, '#e8eef6', '#6a7686')); skEll(g, 140, 104, 32, 10, '#9aa6b6'); skRect(g, 132, 82, 16, 22, 4, '#c8302a');
    skCirc(g, 138, 160, 26, '#ffd24a', 4); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; skCirc(g, 138 + Math.cos(a) * 26, 160 + Math.sin(a) * 26, 6, '#ffd24a', 3); } skCirc(g, 138, 160, 20, '#ffd24a', 0); skCirc(g, 138, 160, 8, '#a8701e', 3);
    skShine(g, 108, 128, 8, 18, .5);
  },
  rel_sacoches: g => {
    [[96, 52], [124, 40], [150, 50], [176, 62], [110, 66], [140, 64]].forEach(([x, y]) => skCoin(g, x, y + 16, 15));
    skRot(g, 128, 140, 0, () => {
      g.beginPath(); g.moveTo(-76, -50); g.lineTo(76, -50); g.quadraticCurveTo(92, 40, 64, 78); g.lineTo(-64, 78); g.quadraticCurveTo(-92, 40, -76, -50); g.closePath(); skFS(g, skLG(g, 0, -50, 0, 78, '#b8743a', '#6a3a1a'));
      g.save(); g.globalAlpha = .5; g.setLineDash([6, 6]); skLine(g, [[-66, -38], [-74, 44], [-58, 68]], 3, '#f0c890'); skLine(g, [[66, -38], [74, 44], [58, 68]], 3, '#f0c890'); g.restore();
      g.beginPath(); g.moveTo(-80, -54); g.lineTo(80, -54); g.lineTo(70, 8); g.quadraticCurveTo(0, 30, -70, 8); g.closePath(); skFS(g, skLG(g, 0, -54, 0, 20, '#c8844a', '#8a4a22'));
      skRect(g, -14, 2, 28, 34, 6, '#5a2a14', 4); skRect(g, -18, 8, 36, 20, 4, '#ffd24a', 4); skRect(g, -8, 13, 16, 10, 2, '#5a2a14', 0);
    });
    skCoin(g, 52, 212, 13); skCoin(g, 206, 206, 12); skCoin(g, 222, 182, 10); skSparkle(g, 214, 40, 11);
  },
  rel_trefle: g => {
    g.beginPath(); g.moveTo(128, 136); g.bezierCurveTo(130, 180, 150, 200, 176, 230); g.lineWidth = 16; g.strokeStyle = SK_INK; g.lineCap = 'round'; g.stroke(); g.lineWidth = 8; g.strokeStyle = '#4a9a3a'; g.stroke();
    for (let i = 0; i < 4; i++) skRot(g, 128, 120, i * Math.PI / 2 + Math.PI / 4, () => { skHeart(g, 0, -40, 72, skRG(g, 0, -40, 50, '#9ae07a', '#2e8a3a'), 5); g.save(); g.globalAlpha = .5; skLine(g, [[0, -8], [0, -62]], 3, '#e8ffd0'); g.restore(); });
    skCirc(g, 128, 120, 9, '#3a8a3a', 4); g.beginPath(); g.moveTo(92, 82); g.quadraticCurveTo(102, 98, 92, 104); g.quadraticCurveTo(82, 98, 92, 82); skFS(g, '#bfe8ff', 3);
    skSparkle(g, 210, 52, 14); skSparkle(g, 40, 196, 10); skSparkle(g, 220, 160, 8);
  },
  rel_coffre: g => {
    skRect(g, 44, 120, 168, 92, 8, skWood(g, 120, 212, '#a8683a', '#5a3218'));
    g.beginPath(); g.moveTo(44, 124); g.lineTo(44, 96); g.bezierCurveTo(44, 50, 212, 50, 212, 96); g.lineTo(212, 124); g.closePath(); skFS(g, skWood(g, 56, 124, '#b8784a', '#6a3a1e'));
    [64, 192].forEach(x => { skRect(g, x - 9, 120, 18, 92, 3, skGold(g, 120, 212), 4); g.beginPath(); g.moveTo(x - 9, 124); g.lineTo(x - 9, 82); g.lineTo(x + 9, 74); g.lineTo(x + 9, 124); skFS(g, skGold(g, 70, 124), 4); });
    skRect(g, 40, 116, 176, 12, 4, skGold(g, 116, 128), 4); skRect(g, 110, 112, 36, 46, 8, skGold(g, 112, 158)); skCirc(g, 128, 130, 6, '#3a1e0e', 0); skPath(g, [[124, 132], [132, 132], [130, 148], [126, 148]]); skFS(g, '#3a1e0e', 0);
    skCirc(g, 128, 82, 16, '#c8302a', 4); skTxt(g, 'M', 128, 83, 18, '#ffd24a', 3); skShine(g, 86, 76, 18, 7, .4); skSparkle(g, 222, 64, 12);
  },
  rel_longuevue: g => {
    skDuo(g, [[128, 150], [88, 230]], 6, '#7a4a2a'); skDuo(g, [[128, 150], [128, 232]], 6, '#7a4a2a'); skDuo(g, [[128, 150], [168, 230]], 6, '#7a4a2a');
    skRot(g, 126, 120, -.5, () => {
      skRect(g, -100, -15, 70, 30, 6, skLG(g, 0, -15, 0, 15, '#e8b860', '#9a6a1e')); skRect(g, -36, -21, 76, 42, 6, skLG(g, 0, -21, 0, 21, '#5a7ab0', '#2a3a6a')); skRect(g, 36, -28, 66, 56, 8, skLG(g, 0, -28, 0, 28, '#e8b860', '#9a6a1e'));
      [-34, 38, 100].forEach(x => skRect(g, x - 4, x > 90 ? -31 : x > 30 ? -31 : -24, 8, x > 30 ? 62 : 48, 3, '#ffe58a', 3)); skEll(g, 104, 0, 8, 28, skRG(g, 104, -8, 24, '#e8f8ff', '#5ab0e8'), 4); skShine(g, 60, -12, 16, 5, .5);
    });
    skCirc(g, 128, 150, 9, '#c9902a', 4); skStar(g, 214, 38, 5, 14, 6, '#fff3a0', 4); skSparkle(g, 186, 24, 8); skSparkle(g, 234, 74, 7);
  },
  rel_vitrines: g => {
    skRect(g, 46, 200, 164, 22, 5, skWood(g, 200, 222)); skRect(g, 46, 38, 164, 18, 5, skWood(g, 38, 56));
    skRect(g, 56, 56, 144, 144, 2, 'rgba(210,236,255,.92)', 5);
    g.beginPath(); g.moveTo(112, 92); g.quadraticCurveTo(96, 118, 106, 150); g.quadraticCurveTo(114, 178, 128, 182); g.quadraticCurveTo(142, 178, 150, 150); g.quadraticCurveTo(160, 118, 144, 92); g.closePath(); skFS(g, skLG(g, 100, 0, 156, 0, '#f0a868', '#9a4a1e'));
    skRect(g, 108, 80, 40, 14, 4, '#c8783a'); g.save(); g.globalAlpha = .55; skLine(g, [[106, 130], [150, 130]], 4, '#2a1a0c'); skLine(g, [[108, 146], [148, 146]], 4, '#2a1a0c'); g.restore(); [[118, 138], [138, 138]].forEach(([x, y]) => skCirc(g, x, y, 3.5, '#ffd24a', 0));
    g.save(); g.globalAlpha = .7; skLine(g, [[70, 70], [70, 120]], 6, '#fff'); skLine(g, [[84, 66], [84, 90]], 4, '#fff'); g.restore();
    g.beginPath(); g.arc(190, 176, 15, Math.PI, 0); g.lineWidth = 12; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 5; g.strokeStyle = '#c8ccd4'; g.stroke();
    skRect(g, 170, 174, 40, 34, 6, skGold(g, 174, 208)); skCirc(g, 190, 188, 5, '#3a1e0e', 0); skLine(g, [[190, 190], [190, 198]], 4, '#3a1e0e');
  },
  rel_montecharge: g => {
    skRect(g, 20, 30, 216, 18, 4, skWood(g, 30, 48)); skRect(g, 118, 44, 20, 22, 3, '#6a6a7a', 4);
    skCirc(g, 128, 78, 28, skRG(g, 128, 78, 28, '#c8ccd4', '#5a6070')); skCirc(g, 128, 78, 10, '#3a3a46', 4); for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; skLine(g, [[128 + Math.cos(a) * 12, 78 + Math.sin(a) * 12], [128 + Math.cos(a) * 22, 78 + Math.sin(a) * 22]], 3); }
    skDuo(g, [[100, 80], [100, 132]], 4, '#e8c890'); skDuo(g, [[156, 80], [156, 200]], 4, '#e8c890'); skDuo(g, [[100, 132], [80, 140]], 3, '#e8c890'); skDuo(g, [[100, 132], [120, 140]], 3, '#e8c890');
    skRect(g, 64, 138, 74, 64, 4, skWood(g, 138, 202, '#d8a060', '#8a5a2a')); skLine(g, [[64, 138], [138, 202]], 4); skLine(g, [[138, 138], [64, 202]], 4);
    skRect(g, 70, 112, 26, 26, 3, '#e8806a', 4); skRect(g, 98, 118, 34, 20, 3, '#e8806a', 4); skCirc(g, 156, 210, 12, '#7a7a8a', 4);
    skPath(g, [[200, 190], [200, 120], [188, 132], [212, 132], [200, 120]]); skFS(g, '#ffd24a', 4); skDuo(g, [[200, 120], [200, 196]], 6, '#ffd24a');
  },
  rel_aimant: g => {
    skRot(g, 100, 112, -.5, () => {
      g.beginPath(); g.moveTo(-50, 60); g.lineTo(-50, -10); g.arc(0, -10, 50, Math.PI, 0); g.lineTo(50, 60); g.lineTo(20, 60); g.lineTo(20, -10); g.arc(0, -10, 20, 0, Math.PI, true); g.lineTo(-20, 60); g.closePath(); skFS(g, skLG(g, -50, 0, 50, 0, '#ff6a5a', '#b8201e'));
      skRect(g, -50, 46, 30, 26, 2, skLG(g, 0, 46, 0, 72, '#f4f8fc', '#8a98aa')); skRect(g, 20, 46, 30, 26, 2, skLG(g, 0, 46, 0, 72, '#f4f8fc', '#8a98aa')); skShine(g, -36, -24, 6, 16, .5);
    });
    [[150, 116, 20], [162, 132, 32], [174, 148, 44]].forEach(([x, y, r], i) => { g.save(); g.globalAlpha = .8 - i * .2; g.beginPath(); g.arc(x - 40, y - 30, r, -.2, 1.2); g.lineWidth = 5; g.strokeStyle = '#ffd24a'; g.stroke(); g.restore(); });
    skBlob(g, [[186, 180, 34, 28], [166, 200, 12, 8], [206, 202, 12, 8]], skRG(g, 176, 170, 40, '#c8f0a0', '#5ab040'));
    skCirc(g, 174, 176, 8, '#fff', 3); skCirc(g, 196, 176, 8, '#fff', 3); skCirc(g, 172, 174, 3.5, SK_INK, 0); skCirc(g, 194, 174, 3.5, SK_INK, 0); skEll(g, 186, 194, 6, 4, '#5a2a2a', 0);
    skHeart(g, 218, 140, 20, '#ff6a8a', 3);
  },
  mer_remparts: g => {
    skRect(g, 50, 110, 156, 104, 2, skLG(g, 0, 110, 0, 214, '#e2d6c0', '#9a8a70')); for (let x = 50; x < 206; x += 26) skRect(g, x, 94, 16, 18, 2, '#d8ccb4', 4);
    g.beginPath(); g.moveTo(104, 214); g.lineTo(104, 168); g.arc(128, 168, 24, Math.PI, 0); g.lineTo(152, 214); g.closePath(); skFS(g, '#5a3a22'); g.save(); g.globalAlpha = .6; [112, 124, 136, 148].forEach(x => skLine(g, [[x, 150], [x, 214]], 3, '#2a1a0c')); g.restore();
    for (const x of [44, 212]) { skRect(g, x - 26, 84, 52, 132, 4, skLG(g, x - 26, 0, x + 26, 0, '#ece2ce', '#a8987e')); skPath(g, [[x - 32, 88], [x, 34], [x + 32, 88]]); skFS(g, skLG(g, 0, 34, 0, 88, '#5a7ad8', '#2a3a8a')); skRect(g, x - 7, 112, 14, 22, 7, '#ffd27a', 4); skDuo(g, [[x, 34], [x, 12]], 3, '#5a3a22'); skPath(g, [[x, 12], [x + 22, 18], [x, 24]]); skFS(g, '#e8402a', 3); }
    g.save(); g.globalAlpha = .3; [[70, 140], [168, 136], [80, 184], [176, 188]].forEach(([x, y]) => skRect(g, x, y, 22, 10, 2, 'rgba(0,0,0,0)', 3)); g.restore();
  },
  mer_cave: g => {
    skRot(g, 108, 112, 0, () => { skEll(g, 0, 0, 78, 64, skLG(g, 0, -64, 0, 64, '#c88a4a', '#6a3a1a')); [-44, 0, 44].forEach(x => { g.beginPath(); g.ellipse(x, 0, 10, 62, 0, 0, Math.PI * 2); g.lineWidth = 7; g.strokeStyle = '#4a4a54'; g.stroke(); }); skEll(g, 74, 0, 14, 50, '#e0b070', 5); skRect(g, 82, -6, 22, 12, 3, '#9aa6b6', 4); skRect(g, 96, -6, 8, 22, 2, '#9aa6b6', 3); });
    skRect(g, 132, 140, 70, 82, 10, skLG(g, 132, 0, 202, 0, '#ffd24a', '#d8901e')); g.save(); g.globalAlpha = .4; [150, 168, 186].forEach(x => skLine(g, [[x, 150], [x, 214]], 3, '#fff')); g.restore();
    g.beginPath(); g.arc(206, 180, 20, -Math.PI / 2, Math.PI / 2); g.lineWidth = 16; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 8; g.strokeStyle = '#e8eef6'; g.stroke();
    skBlob(g, [[142, 138, 16], [164, 130, 18], [188, 136, 16], [200, 146, 10], [150, 150, 10]], '#fffaf0'); skEll(g, 132, 160, 6, 14, '#fffaf0', 3);
    skRect(g, 30, 186, 78, 30, 4, skWood(g, 186, 216, '#8a5a32', '#4a2a1a'));
  },
  mer_galerie: g => {
    g.beginPath(); g.moveTo(32, 226); g.lineTo(32, 92); g.arc(128, 92, 96, Math.PI, 0); g.lineTo(224, 226); g.closePath(); skFS(g, skLG(g, 0, 0, 0, 226, '#b8304a', '#6a1428'));
    g.save(); g.globalAlpha = .35; [60, 92, 164, 196].forEach(x => skLine(g, [[x, 40], [x, 222]], 4, '#2a0a14')); g.restore();
    skRect(g, 86, 162, 84, 60, 4, skLG(g, 0, 162, 0, 222, '#f4f0ea', '#b8b0a4')); skRect(g, 78, 152, 100, 14, 4, '#e8e2d8');
    skEll(g, 128, 146, 46, 20, skRG(g, 128, 140, 46, '#f4f0ea', '#b8b0a4')); skRect(g, 114, 112, 28, 30, 6, '#e8e2d8'); skCirc(g, 128, 90, 30, skRG(g, 118, 80, 32, '#ffffff', '#b8b0a4'));
    skBlob(g, [[104, 72, 12], [116, 62, 12], [132, 58, 12], [148, 64, 12], [156, 78, 10]], '#e8e2d8', 4); skLine(g, [[116, 92], [124, 92]], 3); skLine(g, [[134, 92], [142, 92]], 3); skLine(g, [[124, 108], [134, 108]], 3);
    skLaurel(g, '#e8b82a'); skRect(g, 104, 180, 48, 18, 3, skGold(g, 180, 198));
  },
  mer_archives: g => {
    skRect(g, 36, 34, 184, 192, 6, skWood(g, 34, 226, '#9a6a3a', '#5a3a1e')); skRect(g, 48, 46, 160, 168, 2, '#3a2412', 4);
    [[48, 92], [48, 146], [48, 200]].forEach(([x, y]) => skRect(g, 44, y, 168, 12, 2, skWood(g, y, y + 12), 4));
    const book = (x, y, w, h, c) => { skRect(g, x, y - h, w, h, 2, c, 4); skLine(g, [[x + 3, y - h + 8], [x + w - 3, y - h + 8]], 2, '#ffd24a'); };
    [[52, 20, 40, '#c8302a'], [72, 16, 36, '#3a6ad8'], [88, 22, 42, '#3a9a5a'], [110, 18, 34, '#e8b82a'], [146, 20, 40, '#8a3ab0'], [166, 16, 38, '#c8302a']].forEach(([x, w, h, c]) => book(x, 92, w, h, c));
    [[60, 128], [86, 128], [112, 128]].forEach(([x, y]) => { skEll(g, x + 10, y + 4, 10, 14, '#f8eed6', 4); skCirc(g, x + 10, y + 4, 4, '#c9a06a', 2); }); skRot(g, 170, 130, -.3, () => { skRect(g, -24, -8, 48, 16, 8, '#f8eed6', 4); skCirc(g, 22, 0, 6, '#c9a06a', 3); });
    [[56, 22, 40, '#e8b82a'], [80, 18, 34, '#3a6ad8'], [100, 24, 44, '#c8302a'], [126, 18, 30, '#3a9a5a'], [150, 26, 40, '#8a3ab0']].forEach(([x, w, h, c]) => book(x, 200, w, h, c)); skRot(g, 196, 182, .3, () => book(-10, 18, 20, 36, '#5a8ad0'));
    skDuo(g, [[206, 52], [236, 226]], 5, '#c99a5a');
  },
});
// la Merveille au cinquième niveau : la même, dans une couronne de lauriers dorés
Object.keys(SKA).filter(k => /^mer_/.test(k)).forEach(k => { SKA[k + '_5'] = g => { skLaurel(g, '#e8b82a'); g.save(); g.translate(128, 118); g.scale(.78, .78); g.translate(-128, -128); SKA[k](g); g.restore(); skStar(g, 128, 220, 5, 18, 8, '#ffd24a', 4); }; });

/* ---------- lot 3 : les rencontres d'expédition, et les moments du Val ---------- */
const skChest = (g, open) => {
  skRect(g, 46, 124, 164, 88, 8, skWood(g, 124, 212, '#b8743a', '#5a3218'));
  [70, 186].forEach(x => skRect(g, x - 8, 124, 16, 88, 3, skLG(g, 0, 124, 0, 212, '#c8ccd4', '#6a7080'), 4));
  if (open) { g.beginPath(); g.moveTo(46, 124); g.lineTo(60, 60); g.bezierCurveTo(90, 30, 170, 30, 200, 60); g.lineTo(210, 124); g.closePath(); skFS(g, skLG(g, 0, 40, 0, 124, '#4a2412', '#2a140a')); }
  else { g.beginPath(); g.moveTo(46, 128); g.lineTo(46, 100); g.bezierCurveTo(46, 58, 210, 58, 210, 100); g.lineTo(210, 128); g.closePath(); skFS(g, skWood(g, 60, 128, '#c8844a', '#6a3a1e')); }
};
const skOwl = (g, x, y, s = 1) => {
  skEll(g, x, y + 18 * s, 50 * s, 58 * s, skRG(g, x, y, 60 * s, '#c89a6a', '#6a4a2a')); skEll(g, x, y + 34 * s, 30 * s, 34 * s, '#f0dcb8', 4);
  g.save(); g.globalAlpha = .45; [[-10, 22], [10, 22], [0, 34], [-12, 46], [12, 46]].forEach(([a, b]) => skLine(g, [[x + a * s - 5, y + b * s], [x + a * s, y + b * s + 5], [x + a * s + 5, y + b * s]], 2.5)); g.restore();
  skPath(g, [[x - 44 * s, y - 26 * s], [x - 34 * s, y - 56 * s], [x - 18 * s, y - 34 * s]]); skFS(g, '#8a6a42', 4); skPath(g, [[x + 44 * s, y - 26 * s], [x + 34 * s, y - 56 * s], [x + 18 * s, y - 34 * s]]); skFS(g, '#8a6a42', 4);
  [-1, 1].forEach(k => { skCirc(g, x + k * 20 * s, y - 12 * s, 18 * s, '#fff8e0', 4); skCirc(g, x + k * 20 * s, y - 12 * s, 9 * s, '#2a1a0c', 0); skCirc(g, x + k * 20 * s + 3, y - 15 * s, 3 * s, '#fff', 0); });
  skPath(g, [[x - 7 * s, y + 4 * s], [x + 7 * s, y + 4 * s], [x, y + 18 * s]]); skFS(g, '#f0a020', 3);
};
Object.assign(SKA, {
  ev_blesse_0: g => {
    skHalo(g, 128, 44, 46, 13);
    skHeart(g, 128, 140, 150, skRG(g, 108, 112, 110, '#ff9aa8', '#d02a46'), 6); skShine(g, 82, 102, 16, 9, .5);
    skRot(g, 128, 140, -.6, () => { skRect(g, -84, -16, 168, 32, 6, '#fffaf0', 5); g.save(); g.globalAlpha = .35; for (let x = -76; x < 84; x += 12) skLine(g, [[x, -14], [x + 6, 14]], 2, '#a89a80'); g.restore(); });
    skRot(g, 128, 140, .6, () => { skRect(g, -20, -16, 40, 32, 4, '#fffaf0', 5); skRect(g, -6, -11, 12, 22, 1, '#e8402a', 0); skRect(g, -11, -6, 22, 12, 1, '#e8402a', 0); });
    skSparkle(g, 218, 92, 12); skSparkle(g, 36, 186, 9);
  },
  ev_blesse_1: g => {
    skDuo(g, [[176, 60], [222, 18]], 7, '#c8ccd4'); skRot(g, 176, 60, -.82, () => skRect(g, -18, -6, 36, 12, 4, '#c9902a', 4)); skDuo(g, [[176, 60], [158, 78]], 9, '#5a3a22');
    g.beginPath(); g.moveTo(96, 92); g.bezierCurveTo(30, 120, 40, 214, 128, 214); g.bezierCurveTo(216, 214, 226, 120, 160, 92); g.closePath(); skFS(g, skRG(g, 116, 150, 100, '#c88a5a', '#6a3a1a'));
    skPath(g, [[96, 92], [104, 68], [118, 84], [128, 62], [138, 84], [152, 68], [160, 92]]); skFS(g, '#a8683a', 5); skDuo(g, [[94, 96], [162, 96]], 4, '#e8c890'); skDuo(g, [[160, 96], [182, 116]], 4, '#e8c890');
    skCoin(g, 120, 54, 13); skCoin(g, 140, 44, 11); skCoin(g, 60, 206, 13); skCoin(g, 84, 222, 11); skTxt(g, '?', 128, 156, 40, '#ffd24a');
  },
  ev_cage_0: g => {
    skRect(g, 114, 20, 28, 12, 4, '#9aa6b6', 4); g.beginPath(); g.arc(128, 36, 10, Math.PI, 0); g.lineWidth = 7; g.strokeStyle = SK_INK; g.stroke();
    skEll(g, 104, 198, 72, 16, '#9aa6b6'); g.save(); g.beginPath(); g.moveTo(32, 198); g.lineTo(32, 110); g.arc(104, 110, 72, Math.PI, 0); g.lineTo(176, 198); g.lineWidth = 7; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 3; g.strokeStyle = '#c8ccd4'; g.stroke();
    [56, 80, 104, 128, 152].forEach(x => { const t = 110 - Math.sqrt(Math.max(0, 72 * 72 - (x - 104) ** 2)); g.beginPath(); g.moveTo(x, t); g.lineTo(x, 198); g.lineWidth = 7; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 3; g.strokeStyle = '#c8ccd4'; g.stroke(); }); g.restore();
    skRot(g, 196, 150, .5, () => { skRect(g, -14, -46, 40, 92, 4, 'rgba(0,0,0,0)', 0); g.lineWidth = 7; g.strokeStyle = SK_INK; g.strokeRect(-6, -40, 34, 80); g.lineWidth = 3; g.strokeStyle = '#c8ccd4'; g.strokeRect(-6, -40, 34, 80); });
    skDuo(g, [[150, 108], [176, 92]], 3, '#ffd24a');
    skRot(g, 196, 66, -.3, () => { skEll(g, -16, -6, 22, 11, '#7ec8f0', 4, -.8); skEll(g, 0, 6, 22, 17, skRG(g, 0, 0, 24, '#bfe6ff', '#3a8ad8')); skEll(g, 14, -14, 18, 10, '#5aaee8', 4, .9); skCirc(g, 12, 2, 3, SK_INK, 0); skPath(g, [[20, 4], [32, 8], [20, 12]]); skFS(g, '#ffb03a', 3); });
    [[150, 40], [228, 120], [226, 28]].forEach(([x, y]) => skSparkle(g, x, y, 8));
  },
  ev_cage_1: g => {
    skHeart(g, 128, 130, 168, skRG(g, 104, 100, 120, '#c8c4bc', '#6a665e'), 6);
    g.save(); g.globalAlpha = .55; skLine(g, [[128, 92], [116, 122], [136, 148], [122, 176]], 4); skLine(g, [[116, 122], [92, 128]], 3); g.restore();
    [[86, 160, 10], [166, 112, 8], [150, 170, 6], [94, 106, 5]].forEach(([x, y, r]) => skCirc(g, x, y, r, 'rgba(60,56,50,.4)', 0));
    skBlob(g, [[64, 96, 16, 10], [80, 88, 12, 9], [176, 164, 12, 8]], '#6aa04a', 3); skShine(g, 74, 76, 14, 8, .4);
    skLine(g, [[100, 124], [112, 128]], 4); skLine(g, [[144, 128], [156, 124]], 4); skLine(g, [[114, 154], [142, 154]], 4);
  },
  ev_miroir_0: g => {
    skRot(g, 128, 128, -.6, () => {
      skRect(g, -12, 50, 24, 74, 8, skGold(g, 50, 124)); skCirc(g, 0, 128, 12, '#c8302a', 4);
      skEll(g, 0, -8, 62, 72, skGold(g, -80, 64)); skEll(g, 0, -8, 48, 58, skLG(g, -48, -60, 48, 50, '#e8f6ff', '#7ab0d8'), 4);
      skLine(g, [[-6, -14], [-30, -50], [-40, -54]], 4); skLine(g, [[-6, -14], [24, -40]], 4); skLine(g, [[-6, -14], [16, 30], [10, 44]], 4); skLine(g, [[-6, -14], [-38, 14]], 4); skLine(g, [[-6, -14], [36, 2]], 4);
      skCirc(g, 0, -80, 8, '#c8302a', 4);
    });
    [[200, 50, .4], [222, 90, -.6], [46, 210, .9], [196, 210, 0]].forEach(([x, y, r]) => skRot(g, x, y, r, () => { skPath(g, [[0, -12], [10, 6], [-8, 10]]); skFS(g, skLG(g, -8, -12, 10, 10, '#ffffff', '#8ac0e8'), 3); }));
    skStar(g, 172, 40, 4, 12, 3, '#fff8d0', 3);
  },
  ev_miroir_1: g => {
    skEll(g, 128, 120, 80, 100, skGold(g, 20, 220)); [[128, 18], [128, 222], [48, 120], [208, 120]].forEach(([x, y]) => skCirc(g, x, y, 12, skRG(g, x, y, 12, '#fff0a0', '#c48a1e'), 4));
    g.save(); g.beginPath(); g.ellipse(128, 120, 64, 84, 0, 0, Math.PI * 2); g.fillStyle = skLG(g, 0, 36, 0, 204, '#8a6ad0', '#2a1a4a'); g.fill(); g.clip();
    skCirc(g, 150, 80, 16, '#ffe0f0', 3); skPath(g, [[64, 210], [64, 150], [80, 150], [80, 138], [94, 146], [100, 128], [110, 140], [110, 120], [126, 120], [130, 150], [146, 140], [150, 160], [168, 152], [172, 132], [190, 140], [192, 210]]); skFS(g, '#1a1030', 3);
    [[92, 172], [150, 178]].forEach(([x, y]) => skRect(g, x, y, 8, 10, 1, '#5a3a8a', 0)); g.restore();
    g.beginPath(); g.ellipse(128, 120, 64, 84, 0, 0, Math.PI * 2); g.lineWidth = 5; g.strokeStyle = SK_INK; g.stroke();
    g.save(); g.globalAlpha = .45; skLine(g, [[84, 70], [104, 50]], 8, '#fff'); skLine(g, [[84, 92], [94, 82]], 6, '#fff'); g.restore(); skSparkle(g, 214, 40, 12); skSparkle(g, 36, 210, 9);
  },
  ev_champignons_0: g => {
    skGlow(g, 128, 110, 70, 'rgba(120,230,255,.6)');
    g.beginPath(); g.moveTo(108, 130); g.quadraticCurveTo(100, 180, 104, 218); g.lineTo(152, 218); g.quadraticCurveTo(156, 180, 148, 130); g.closePath(); skFS(g, skLG(g, 104, 0, 152, 0, '#f4fbff', '#b8d8e8'));
    g.beginPath(); g.ellipse(128, 132, 84, 70, 0, Math.PI, 0); g.lineTo(212, 132); g.quadraticCurveTo(128, 154, 44, 132); g.closePath(); skFS(g, skRG(g, 112, 90, 90, '#c8f8ff', '#2a8ac8'));
    g.save(); g.globalCompositeOperation = 'destination-out'; [[204, 106, 16], [196, 84, 14], [210, 126, 12]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }); g.restore();
    [[196, 84, 14], [204, 106, 16]].forEach(([x, y, r]) => { g.beginPath(); g.arc(x, y, r, Math.PI * .55, Math.PI * 1.45); g.lineWidth = 5; g.strokeStyle = SK_INK; g.stroke(); });
    [[92, 98, 9], [128, 80, 11], [158, 104, 7], [104, 120, 5]].forEach(([x, y, r]) => skCirc(g, x, y, r, '#f0ffff', 3));
    [[118, 168], [142, 168]].forEach(([x, y]) => { g.beginPath(); for (let t = 0; t < 12; t += .5) { const r = t * .7; g.lineTo(x + Math.cos(t) * r, y + Math.sin(t) * r); } g.lineWidth = 3; g.strokeStyle = SK_INK; g.stroke(); });
    skLine(g, [[118, 190], [128, 196], [138, 190]], 3); [[44, 52, '#ffd24a'], [214, 40, '#ff9ad0'], [40, 180, '#a0e8ff']].forEach(([x, y, c]) => skStar(g, x, y, 5, 12, 5, c, 3));
  },
  ev_champignons_1: g => {
    g.beginPath(); g.arc(128, 116, 66, Math.PI, 0); g.lineWidth = 17; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 8; g.strokeStyle = '#c8945a'; g.stroke();
    const cap = (x, y, rx, ry, c1, c2, dots) => { g.beginPath(); g.ellipse(x, y, rx, ry, 0, Math.PI, 0); g.quadraticCurveTo(x, y + ry * .35, x - rx, y); g.closePath(); skFS(g, skRG(g, x, y - ry * .5, rx, c1, c2), 5); if (dots) [[-.4, -.5], [.2, -.7], [.5, -.3]].forEach(([a, b]) => skCirc(g, x + a * rx, y + b * ry, rx * .12, '#fff', 2)); };
    [[96, 140, 30, 26, '#ff8a6a', '#c8241e', 1], [128, 128, 34, 30, '#f0c890', '#a8743a', 0], [164, 140, 28, 24, '#c8a0f0', '#6a3aa8', 1], [112, 150, 22, 18, '#ffc07a', '#d0701e', 0]].forEach(([x, y, rx, ry, a, b, d]) => { skRect(g, x - 7, y - 2, 14, 22, 5, '#f6ecd6', 4); cap(x, y, rx, ry, a, b, d); });
    g.beginPath(); g.moveTo(44, 144); g.lineTo(212, 144); g.lineTo(196, 214); g.quadraticCurveTo(128, 226, 60, 214); g.closePath(); skFS(g, skWood(g, 144, 220, '#e0aa6a', '#9a6030'));
    g.save(); g.globalAlpha = .45; [160, 180, 200].forEach(y => skLine(g, [[52 + (y - 144) * .2, y], [204 - (y - 144) * .2, y]], 3, '#5a3418')); for (let x = 66; x < 200; x += 16) skLine(g, [[x, 148], [x + (x < 128 ? 4 : -4), 214]], 2.5, '#5a3418'); g.restore();
    skRect(g, 40, 136, 176, 14, 7, skWood(g, 136, 150, '#d8a060', '#8a5a2a'), 5); skEll(g, 210, 196, 14, 8, '#5fa24a', 4, .5);
  },
  ev_osselets_0: g => {
    skCoin(g, 176, 186, 20); skCoin(g, 176, 170, 20); skCoin(g, 176, 154, 20); skCoin(g, 206, 196, 16);
    const oss = (x, y, r) => skRot(g, x, y, r, () => skUnion(g, () => { g.beginPath(); g.rect(-20, -9, 40, 18); [[-20, -8], [-20, 8], [20, -8], [20, 8]].forEach(([a, b]) => { g.moveTo(a + 10, b); g.arc(a, b, 10, 0, Math.PI * 2); }); }, skLG(g, 0, -18, 0, 18, '#fffaf0', '#d8ccb0'), 5));
    oss(64, 168, .3); oss(110, 196, -.5); oss(92, 138, 1.2); oss(140, 100, -.2);
    skRot(g, 70, 70, -.3, () => { skRect(g, -26, -26, 52, 52, 10, skLG(g, -26, -26, 26, 26, '#ffffff', '#e2d8c2')); [[-12, -12], [12, 12], [0, 0], [12, -12], [-12, 12]].forEach(([a, b]) => skCirc(g, a, b, 5, '#c8302a', 0)); });
    skSparkle(g, 212, 120, 12); skTxt(g, '×2', 214, 56, 32, '#ffd24a');
  },
  ev_osselets_1: g => { skDuo(g, [[34, 206], [222, 206]], 12, '#8a5a32'); skOwl(g, 128, 112, 1.2); skRot(g, 196, 206, 0, () => {}); skRect(g, 82, 196, 14, 16, 4, '#f0a020', 3); skRect(g, 160, 196, 14, 16, 4, '#f0a020', 3); skHalo(g, 128, 30, 34, 9); },
  ev_autel_0: g => {
    skRect(g, 46, 150, 164, 70, 6, skLG(g, 0, 150, 0, 220, '#8a8494', '#48424e')); skRect(g, 34, 136, 188, 20, 5, '#6a6474');
    g.save(); g.globalAlpha = .45; skLine(g, [[60, 180], [100, 180]], 3); skLine(g, [[150, 196], [196, 196]], 3); g.restore();
    skStar(g, 128, 186, 5, 22, 9, '#c8a0ff', 4); skGlow(g, 128, 186, 34, 'rgba(200,160,255,.5)');
    [[64, 92, 44], [110, 76, 60], [150, 98, 38], [184, 88, 48]].forEach(([x, top, h]) => { skRect(g, x - 10, top, 22, h, 5, skLG(g, x - 10, 0, x + 12, 0, '#4a4a5a', '#1a1a24')); skEll(g, x - 4, top + 10, 4, 9, '#4a4a5a', 3); skLine(g, [[x + 1, top], [x + 1, top - 8]], 3); skFlame(g, x + 1, top - 12, .6, '#f0e0ff', '#8a3ad8'); });
    g.save(); g.globalAlpha = .5; [[60, 40], [196, 50]].forEach(([x, y]) => skLine(g, [[x, y + 20], [x + 6, y + 8], [x - 2, y - 4], [x + 4, y - 16]], 4, '#b8a8d8')); g.restore();
  },
  ev_fontaine_0: g => {
    skEll(g, 128, 196, 100, 28, skLG(g, 0, 168, 0, 224, '#e2dace', '#9a8f80')); skEll(g, 128, 188, 84, 18, skRG(g, 128, 186, 84, '#c8f8ff', '#3aa8d8'), 4);
    skRect(g, 116, 108, 24, 80, 4, skLG(g, 116, 0, 140, 0, '#e8e0d4', '#a89c8a')); skEll(g, 128, 108, 46, 14, skLG(g, 0, 94, 0, 122, '#e8e0d4', '#a89c8a'));
    [[-1, 1], [1, 1]].forEach(([s]) => { g.beginPath(); g.moveTo(128, 70); g.quadraticCurveTo(128 + s * 50, 40, 128 + s * 74, 176); g.lineWidth = 13; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 6; g.strokeStyle = '#9ae8ff'; g.stroke(); });
    skDuo(g, [[128, 104], [128, 50]], 7, '#9ae8ff'); skCirc(g, 128, 44, 10, '#d8f8ff', 4);
    [[60, 64], [200, 70], [96, 30], [168, 30], [128, 150]].forEach(([x, y]) => skSparkle(g, x, y, 9)); skStar(g, 128, 186, 4, 10, 3, '#fff', 2);
  },
  ev_fontaine_1: g => {
    const gourd = (x, y, r, a, c1, c2) => skRot(g, x, y, a, () => { skDuo(g, [[-r * .9, -r * 1.2], [0, -r * 2], [r * .9, -r * 1.2]], 4, '#8a5a32'); skRect(g, -9, -r * 1.6, 18, r * .7, 4, '#d8a060', 4); skRect(g, -11, -r * 1.85, 22, 10, 3, '#5a3a22', 3); skCirc(g, 0, 0, r, skRG(g, 0, 0, r, c1, c2)); skShine(g, -r * .4, -r * .35, r * .18, r * .3, .5); skDuo(g, [[-r, 0], [r, 0]], 4, '#5a3a22'); });
    gourd(96, 146, 54, -.25, '#d8a060', '#7a4a1e'); gourd(170, 160, 42, .3, '#c88a4a', '#6a3a14');
    [[54, 76], [70, 98], [210, 92], [198, 70], [128, 216]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y - 12); g.quadraticCurveTo(x + 9, y + 4, x, y + 6); g.quadraticCurveTo(x - 9, y + 4, x, y - 12); skFS(g, '#7ec8f0', 3); });
  },
  ev_marchand_0: g => {
    g.beginPath(); g.moveTo(108, 70); g.lineTo(108, 100); g.bezierCurveTo(50, 116, 50, 214, 128, 216); g.bezierCurveTo(206, 214, 206, 116, 148, 100); g.lineTo(148, 70); g.closePath(); skFS(g, 'rgba(220,240,255,.95)');
    g.save(); g.beginPath(); g.moveTo(66, 150); g.bezierCurveTo(60, 214, 196, 214, 190, 150); g.quadraticCurveTo(128, 136, 66, 150); g.fillStyle = skLG(g, 0, 140, 0, 214, '#ff9ad8', '#c82a8a'); g.fill(); g.restore();
    [[104, 172, 7], [140, 186, 5], [120, 158, 4], [158, 166, 6]].forEach(([x, y, r]) => skCirc(g, x, y, r, 'rgba(255,255,255,.6)', 2));
    g.beginPath(); g.moveTo(108, 70); g.lineTo(108, 100); g.bezierCurveTo(50, 116, 50, 214, 128, 216); g.bezierCurveTo(206, 214, 206, 116, 148, 100); g.lineTo(148, 70); g.lineWidth = 6; g.strokeStyle = SK_INK; g.stroke();
    skRect(g, 102, 46, 52, 28, 6, skWood(g, 46, 74, '#d8a060', '#8a5a2a')); skShine(g, 86, 140, 8, 22, .55);
    skDuo(g, [[150, 84], [192, 100]], 3, '#c8302a'); skRot(g, 204, 106, .3, () => { skPath(g, [[-16, -12], [24, -12], [24, 12], [-16, 12], [-26, 0]]); skFS(g, '#fff6e0', 4); skTxt(g, '3', 6, 1, 18, '#ffd24a', 3); });
    skBlob(g, [[110, 34, 8], [126, 24, 10], [142, 32, 7]], '#ffd0f0', 3);
  },
  ev_marchand_1: g => {
    skCirc(g, 128, 128, 96, skRG(g, 128, 128, 96, '#fff0a0', '#c48a1e')); skCirc(g, 128, 128, 80, skRG(g, 118, 112, 90, '#fffaf0', '#e2d2b0'), 4);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 - Math.PI / 2, L = i % 2 ? 44 : 70; skPath(g, [[128 + Math.cos(a - .2) * 14, 128 + Math.sin(a - .2) * 14], [128 + Math.cos(a) * L, 128 + Math.sin(a) * L], [128 + Math.cos(a + .2) * 14, 128 + Math.sin(a + .2) * 14]]); skFS(g, i === 0 ? '#e8402a' : i % 2 ? '#c8b080' : '#3a4a6a', 3); }
    skCirc(g, 128, 128, 10, '#ffd24a', 4); skTxt(g, 'N', 128, 18, 26, '#e8402a'); skCirc(g, 128, 10, 0.1, '#000', 0);
    skShine(g, 94, 78, 20, 9, .5);
  },
  ev_coffre_0: g => {
    skGlow(g, 128, 110, 90, 'rgba(255,230,120,.7)'); skChest(g, true);
    [[96, 118], [122, 108], [150, 114], [172, 120], [110, 124], [138, 124]].forEach(([x, y]) => skCoin(g, x, y, 15)); skStar(g, 168, 96, 5, 14, 6, '#ff6a8a', 3); skEll(g, 88, 104, 10, 13, '#3ab8a0', 4);
    [[64, 50], [196, 46], [128, 26]].forEach(([x, y]) => skSparkle(g, x, y, 11));
    skRot(g, 196, 206, -.5, () => { g.beginPath(); g.arc(-28, 0, 14, 0, Math.PI * 2); g.lineWidth = 12; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 5; g.strokeStyle = '#ffd24a'; g.stroke(); skDuo(g, [[-14, 0], [30, 0]], 6, '#ffd24a'); skDuo(g, [[22, 0], [22, 12]], 5, '#ffd24a'); skDuo(g, [[30, 0], [30, 10]], 5, '#ffd24a'); });
  },
  ev_coffre_1: g => {
    skChest(g, false);
    g.beginPath(); g.moveTo(52, 128); for (let x = 52; x < 206; x += 22) { g.lineTo(x + 11, 150); g.lineTo(x + 22, 128); } g.closePath(); skFS(g, '#fffaf0', 4);
    skEll(g, 128, 112, 76, 16, '#3a0a16', 4); skEll(g, 128, 122, 30, 8, '#e8607a', 3);
    [[96, 88], [160, 88]].forEach(([x, y]) => { skEll(g, x, y, 15, 12, '#fff8d0', 4); skCirc(g, x + 3, y + 2, 6, '#2a1a0c', 0); skLine(g, [[x - 16, y - 18], [x + 14, y - 12]], 5); });
    skEll(g, 70, 200, 12, 8, '#a0d8ff', 3); skLine(g, [[200, 106], [212, 120]], 4); skTxt(g, '!', 222, 56, 40, '#ffd24a');
  },
  ev_grimoire_0: g => {
    [[64, 120, -1], [192, 120, 1], [128, 70, 0]].forEach(([x, y, s], i) => { g.beginPath(); g.moveTo(128 + s * 20, 150); g.bezierCurveTo(x, y + 60, x + s * 40, y, x + s * 10, y - 26); g.lineWidth = 22 - i * 2; g.strokeStyle = SK_INK; g.lineCap = 'round'; g.stroke(); g.lineWidth = 12 - i; g.strokeStyle = '#5a3a8a'; g.stroke(); [0.3, 0.55, 0.8].forEach(t => { const px = (1 - t) * (128 + s * 20) + t * (x + s * 10), py = (1 - t) * 150 + t * (y - 26); skCirc(g, px + s * 4, py, 3, '#c8a8ff', 0); }); });
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(128, 210); g.quadraticCurveTo(128 + s * 40, 192, 128 + s * 92, 200); g.lineTo(128 + s * 92, 150); g.quadraticCurveTo(128 + s * 40, 140, 128, 156); g.closePath(); skFS(g, skLG(g, 128, 0, 128 + s * 92, 0, '#d8ccb0', '#f8f0dc')); }
    skEll(g, 128, 160, 34, 18, '#fff8e0', 4); skCirc(g, 128, 160, 13, skRG(g, 128, 160, 13, '#c8a0ff', '#4a1a8a'), 0); skCirc(g, 128, 160, 6, '#120a1e', 0); skCirc(g, 132, 156, 2.5, '#fff', 0);
    skLine(g, [[94, 160], [100, 154]], 3); skLine(g, [[162, 160], [156, 154]], 3);
  },
  ev_grimoire_1: g => {
    g.beginPath(); g.moveTo(40, 230); g.quadraticCurveTo(80, 60, 212, 30); g.lineWidth = 15; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 7; g.strokeStyle = '#a8743a'; g.stroke();
    skDuo(g, [[212, 30], [176, 96]], 2.5, '#f8f0dc'); g.beginPath(); g.moveTo(176, 96); g.lineTo(176, 112); g.arc(166, 112, 10, 0, Math.PI); g.lineWidth = 9; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 4; g.strokeStyle = '#c8ccd4'; g.stroke();
    skRot(g, 160, 154, .25, () => { skRect(g, -44, -30, 88, 64, 6, skLG(g, 0, -30, 0, 34, '#3a7ab0', '#1a3a6a')); skRect(g, 36, -26, 8, 56, 2, '#f8f0dc', 3); g.save(); g.globalAlpha = .5; skRect(g, -30, -16, 50, 30, 4, 'rgba(0,0,0,0)', 3); g.restore(); skStar(g, -6, -2, 5, 11, 5, '#ffd24a', 3); });
    [[132, 198], [150, 214], [182, 204], [196, 228]].forEach(([x, y]) => { g.beginPath(); g.moveTo(x, y - 12); g.quadraticCurveTo(x + 8, y + 4, x, y + 6); g.quadraticCurveTo(x - 8, y + 4, x, y - 12); skFS(g, '#7ec8f0', 3); });
    skBlob(g, [[60, 150, 16, 10], [70, 168, 10, 7]], '#6ab0d8', 3); skEll(g, 92, 196, 18, 9, '#5fa24a', 3, -.4);
  },
  ev_forge_0: g => {
    skPath(g, [[44, 98], [212, 98], [212, 112], [176, 124], [168, 156], [196, 170], [196, 186], [60, 186], [60, 170], [88, 156], [80, 124], [26, 120]]); skFS(g, skLG(g, 0, 98, 0, 186, '#7a8496', '#2a303c'));
    skRect(g, 70, 182, 116, 34, 4, skWood(g, 182, 216, '#9a6a3a', '#5a3a1e')); skShine(g, 100, 104, 30, 4, .4);
    skRot(g, 136, 80, -.12, () => { skRect(g, -38, -26, 76, 52, 8, skLG(g, -38, -26, 38, 26, '#fff6c0', '#ff8a2a')); skRect(g, -30, -18, 60, 36, 4, 'rgba(0,0,0,0)', 3); skStar(g, 0, 0, 4, 12, 4, '#fff', 3); });
    skRot(g, 70, 54, -.7, () => { skDuo(g, [[0, 0], [0, 76]], 9, '#9a6a3a'); skRect(g, -26, -16, 52, 28, 5, skLG(g, 0, -16, 0, 12, '#c8ccd4', '#5a6070')); });
    [[180, 44], [204, 70], [196, 30], [220, 54], [176, 66]].forEach(([x, y], i) => skStar(g, x, y, 4, 9 - i, 3, i % 2 ? '#ffd24a' : '#ff8a2a', 2));
  },
  ev_colporteur_0: g => {
    skDuo(g, [[86, 66], [64, 30]], 5, '#7a4a2a'); skDuo(g, [[170, 66], [192, 30]], 5, '#7a4a2a');
    g.beginPath(); g.moveTo(70, 70); g.lineTo(186, 70); g.quadraticCurveTo(206, 150, 190, 214); g.lineTo(66, 214); g.quadraticCurveTo(50, 150, 70, 70); g.closePath(); skFS(g, skLG(g, 0, 70, 0, 214, '#5a9a5a', '#2a5a3a'));
    g.beginPath(); g.moveTo(64, 74); g.lineTo(192, 74); g.lineTo(186, 128); g.quadraticCurveTo(128, 146, 70, 128); g.closePath(); skFS(g, skLG(g, 0, 74, 0, 140, '#6aaa6a', '#3a6a4a')); skRect(g, 116, 118, 24, 24, 5, '#ffd24a', 4);
    skRot(g, 92, 52, -.3, () => { skRect(g, -14, -24, 28, 40, 3, '#fff6e0', 4); skCirc(g, 0, -4, 6, '#e8402a', 2); });
    skRot(g, 160, 52, .35, () => { skEll(g, 0, -10, 18, 12, '#c8ccd4'); skDuo(g, [[0, 0], [0, 36]], 4, '#8a8a9a'); });
    skRect(g, 194, 140, 30, 24, 6, '#c8784a', 4); skDuo(g, [[194, 140], [188, 120]], 3, '#5a3a22'); skCirc(g, 46, 168, 14, skRG(g, 46, 168, 14, '#ff9ad8', '#c82a8a'), 4); skRect(g, 41, 146, 10, 10, 2, '#a8743a', 3);
    [[96, 170], [158, 170]].forEach(([x, y]) => skCirc(g, x, y, 6, '#ffd24a', 3));
  },
  val_voisin: g => {
    skDuo(g, [[128, 226], [128, 44]], 10, '#8a5a32');
    [[96, 64, -1, '#e8b860', '#9a6a1e'], [164, 104, 1, '#c88a4a', '#7a4a1e'], [92, 146, -1, '#d8a060', '#8a5a2a']].forEach(([x, y, s, a, b]) => { skPath(g, [[128 - s * 6, y - 15], [x + s * 54, y - 15], [x + s * 74, y], [x + s * 54, y + 15], [128 - s * 6, y + 15]]); skFS(g, skLG(g, 0, y - 15, 0, y + 15, a, b), 5); skRect(g, x + s * 20 - 9, y - 9, 18, 18, 2, '#5a3a22', 0); skPath(g, [[x + s * 20 - 11, y - 7], [x + s * 20, y - 15], [x + s * 20 + 11, y - 7]]); skFS(g, '#c8302a', 0); });
    skDuo(g, [[128, 190], [168, 200]], 4, '#5a3a22'); skRect(g, 156, 196, 26, 10, 3, '#3a2a2a', 4);
    skRect(g, 154, 204, 30, 34, 10, skRG(g, 168, 220, 22, '#fff0a0', '#e8901e')); skRect(g, 156, 234, 26, 8, 3, '#3a2a2a', 4);
    skEll(g, 128, 230, 50, 9, '#7ab84a', 4);
  },
  val_genereux: g => {
    skRect(g, 56, 114, 144, 102, 8, skLG(g, 0, 114, 0, 216, '#ff8aa8', '#c82a5a')); skRect(g, 44, 92, 168, 30, 8, skLG(g, 0, 92, 0, 122, '#ffa0b8', '#d83a6a'));
    skRect(g, 116, 92, 24, 124, 2, skGold(g, 92, 216), 4); g.save(); g.globalAlpha = .35; [[76, 150], [170, 170], [90, 196], [176, 134]].forEach(([x, y]) => skStar(g, x, y, 5, 9, 4, '#fff', 0)); g.restore();
    [[-1], [1]].forEach(([s]) => { g.beginPath(); g.moveTo(128, 92); g.bezierCurveTo(128 + s * 20, 50, 128 + s * 70, 46, 128 + s * 56, 80); g.bezierCurveTo(128 + s * 46, 96, 128 + s * 20, 94, 128, 92); skFS(g, skGold(g, 50, 96)); skDuo(g, [[128 + s * 8, 98], [128 + s * 28, 132]], 7, '#ffd24a'); });
    skCirc(g, 128, 90, 12, skGold(g, 78, 102)); skHeart(g, 40, 64, 26, '#ff6a8a', 4); skHeart(g, 220, 70, 20, '#ff9ac0', 3); skSparkle(g, 214, 196, 11);
  },
  val_livredor: g => {
    skRot(g, 116, 140, -.08, () => { skRect(g, -78, -64, 156, 128, 10, skLG(g, 0, -64, 0, 64, '#fff0a0', '#c48a1e')); skRect(g, -66, -52, 132, 104, 6, 'rgba(0,0,0,0)', 3); skRect(g, -78, 52, 156, 14, 4, '#f8f0dc', 4); skStar(g, 0, -8, 5, 26, 11, '#fff8d0', 4); skTxt(g, 'LIVRE D’OR', 0, 34, 14, '#8a5a1e', 0); skShine(g, -46, -36, 16, 7, .5); });
    skRect(g, 176, 170, 40, 36, 8, skLG(g, 0, 170, 0, 206, '#4a4a6a', '#1a1a2a')); skEll(g, 196, 170, 20, 6, '#2a2a4a', 4);
    g.beginPath(); g.moveTo(196, 172); g.bezierCurveTo(200, 120, 220, 70, 240, 30); g.bezierCurveTo(232, 70, 214, 130, 196, 172); g.lineWidth = 3; g.stroke();
    g.beginPath(); g.moveTo(196, 172); g.quadraticCurveTo(192, 100, 236, 26); g.quadraticCurveTo(232, 110, 196, 172); skFS(g, skLG(g, 190, 0, 236, 0, '#ffffff', '#c8b8f0'), 4); skLine(g, [[196, 172], [230, 40]], 2.5);
  },
  val_coop: g => {
    for (const x of [58, 198]) { skRect(g, x - 30, 86, 60, 134, 4, skLG(g, x - 30, 0, x + 30, 0, '#ece2ce', '#a8987e')); [x - 30, x - 8, x + 14].forEach(bx => skRect(g, bx, 72, 16, 16, 2, '#d8ccb4', 4)); skRect(g, x - 9, 120, 18, 26, 9, '#ffd27a', 4); }
    skPath(g, [[180, 70], [180, 36], [206, 46], [180, 56]]); skFS(g, '#3a8ae8', 3); skPath(g, [[76, 70], [76, 36], [50, 46], [76, 56]]); skFS(g, '#e8402a', 3); skLine(g, [[180, 70], [180, 36]], 4); skLine(g, [[76, 70], [76, 36]], 4);
    g.beginPath(); g.moveTo(88, 150); g.quadraticCurveTo(128, 186, 168, 150); g.lineWidth = 12; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 5; g.strokeStyle = '#c99a5a'; g.stroke();
    for (let i = 1; i < 8; i++) { const t = i / 8, x = (1 - t) * (1 - t) * 88 + 2 * (1 - t) * t * 128 + t * t * 168, y = (1 - t) * (1 - t) * 150 + 2 * (1 - t) * t * 186 + t * t * 150; skRect(g, x - 4, y - 2, 8, 12, 2, '#9a6a3a', 3); }
    skHeart(g, 128, 112, 46, skRG(g, 120, 100, 30, '#ff9aa8', '#d02a46'), 5); skSparkle(g, 128, 66, 10);
  },
  val_escarmouche: g => {
    skCirc(g, 140, 120, 90, '#fff6e6'); skCirc(g, 140, 120, 70, '#e8402a', 5); skCirc(g, 140, 120, 50, '#fff6e6', 5); skCirc(g, 140, 120, 30, '#e8402a', 5); skCirc(g, 140, 120, 12, '#ffd24a', 4);
    skDuo(g, [[40, 214], [134, 128]], 7, '#c99a5a'); skEll(g, 140, 122, 14, 20, '#e8402a', 5, -.83);
    skRot(g, 46, 208, -.83, () => { [[-8, -14], [-8, 0], [-8, 14]].forEach(([a, b], i) => { skPath(g, [[a, b * .6], [a - 22, b - 6], [a - 26, b], [a - 4, b * .6 + 6]]); skFS(g, ['#3a8ae8', '#ffd24a', '#3a8ae8'][i], 3); }); });
    skTxt(g, 'plop !', 196, 34, 26, '#fff'); [[208, 70], [226, 90]].forEach(([x, y]) => skLine(g, [[x, y], [x + 12, y - 6]], 4));
  },
});
SKA.age_or_back = g => { for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8; skPath(g, [[128 + Math.cos(a - .16) * 80, 128 + Math.sin(a - .16) * 80], [128 + Math.cos(a) * 124, 128 + Math.sin(a) * 124], [128 + Math.cos(a + .16) * 80, 128 + Math.sin(a + .16) * 80]]); skFS(g, i % 2 ? '#ffd24a' : '#ffb02a', 5); } skCirc(g, 128, 128, 96, skRG(g, 128, 128, 96, '#fff6c0', '#f0b02a'), 6); };
SKA.age_normal = g => { skMedal(g, '#f0c890', '#8a5a2a'); skRot(g, 128, 128, .5, () => { g.beginPath(); g.moveTo(0, -62); g.bezierCurveTo(30, -40, 26, 20, 4, 50); g.lineTo(-4, 50); g.bezierCurveTo(-26, 20, -30, -40, 0, -62); skFS(g, skLG(g, -26, 0, 26, 0, '#ffffff', '#c8bca8'), 5); skLine(g, [[0, -50], [0, 64]], 4); }); skShine(g, 100, 86, 16, 7, .5); };

/* ---------- lot 5 : les moments qui collaient une créature au hasard ou une vignette sans rapport ---------- */
// une pantoufle vue de côté (la pointe à droite), son pompon sur le dessus
const skSlipper = (g, x, y, s, c1, c2, pom) => {
  g.beginPath(); g.moveTo(x - 28 * s, y - 4 * s); g.quadraticCurveTo(x - 30 * s, y + 8 * s, x - 18 * s, y + 8 * s); g.lineTo(x + 22 * s, y + 8 * s); g.quadraticCurveTo(x + 36 * s, y + 6 * s, x + 32 * s, y - 6 * s); g.quadraticCurveTo(x + 26 * s, y - 26 * s, x + 2 * s, y - 24 * s); g.quadraticCurveTo(x - 8 * s, y - 10 * s, x - 28 * s, y - 4 * s); g.closePath(); skFS(g, skLG(g, 0, y - 26 * s, 0, y + 8 * s, c1, c2), 5);
  skLine(g, [[x - 26 * s, y + 3 * s], [x + 30 * s, y + 3 * s]], 4 * s, 'rgba(255,255,255,.7)'); skCirc(g, x + 8 * s, y - 22 * s, 9 * s, pom, 4); skShine(g, x + 18 * s, y - 14 * s, 6 * s, 3 * s, .5);
};
// un album ouvert : n cases sur 8 portent un sticker
const skAlbum = (g, n) => {
  skRot(g, 128, 136, -.06, () => {
    g.scale(.92, .92); skRect(g, -112, -70, 224, 150, 12, skLG(g, 0, -70, 0, 80, '#8fd06a', '#3f8a3a'));
    [-1, 1].forEach(k => { g.beginPath(); g.moveTo(0, -56); g.quadraticCurveTo(k * 50, -66, k * 100, -58); g.lineTo(k * 100, 66); g.quadraticCurveTo(k * 50, 58, 0, 70); g.closePath(); skFS(g, k < 0 ? '#fbf3e0' : '#f4e8cc', 4); });
    skLine(g, [[0, -56], [0, 70]], 4);
    const C = ['#f2a65a', '#9ad0f0', '#e88ab4', '#b8e07a', '#c9a0f0', '#ffd24a', '#7ad0c0', '#f07a6a'];
    [[-72, -24], [-30, -24], [-72, 28], [-30, 28], [30, -24], [72, -24], [30, 28], [72, 28]].forEach(([x, y], i) => {
      if (i < n) { skCirc(g, x, y, 17, skRG(g, x, y, 17, '#fff', C[i]), 4); skCirc(g, x - 5, y - 2, 2.6, SK_INK, 0); skCirc(g, x + 5, y - 2, 2.6, SK_INK, 0); skLine(g, [[x - 4, y + 6], [x, y + 8], [x + 4, y + 6]], 2.5); }
      else { g.save(); g.setLineDash([5, 5]); skRect(g, x - 16, y - 16, 32, 32, 6, 'rgba(0,0,0,0)', 3); g.restore(); }
    });
  });
};
// une Merveille : un petit temple à colonnes, le ruban de l'inauguration
const skTemple = g => {
  skRect(g, 40, 196, 176, 22, 5, skLG(g, 0, 196, 0, 218, '#efe4cc', '#b8a888')); skRect(g, 52, 180, 152, 18, 4, '#e6dabe');
  [70, 104, 138, 172].forEach(x => { skRect(g, x - 1, 96, 16, 84, 3, skLG(g, x - 1, 0, x + 15, 0, '#fffaf0', '#c8bca0'), 5); });
  skRect(g, 50, 84, 156, 16, 4, '#e6dabe'); skPath(g, [[44, 86], [128, 38], [212, 86]]); skFS(g, skLG(g, 0, 38, 0, 86, '#ffe58a', '#d0901e')); skCirc(g, 128, 68, 9, '#fff3c0', 4);
  g.beginPath(); g.moveTo(34, 128); g.quadraticCurveTo(128, 150, 222, 128); g.lineWidth = 14; g.strokeStyle = SK_INK; g.stroke(); g.lineWidth = 8; g.strokeStyle = '#e8402a'; g.stroke();
  skEll(g, 112, 142, 16, 10, '#e8402a', 4, .5); skEll(g, 144, 142, 16, 10, '#e8402a', 4, -.5); skPath(g, [[122, 146], [110, 176], [124, 170], [128, 148]]); skFS(g, '#c8302a', 4); skPath(g, [[134, 146], [146, 176], [132, 170], [128, 148]]); skFS(g, '#c8302a', 4); skCirc(g, 128, 142, 8, '#ff6a50', 4);
};
// un dé, ses points
const skDie = (g, x, y, r, n, col = '#c8302a') => skRot(g, x, y, r, () => { skRect(g, -30, -30, 60, 60, 12, skLG(g, -30, -30, 30, 30, '#ffffff', '#e2d8c2')); ({ 1: [[0, 0]], 3: [[-15, -15], [0, 0], [15, 15]], 5: [[-15, -15], [15, -15], [0, 0], [-15, 15], [15, 15]], 6: [[-15, -16], [15, -16], [-15, 0], [15, 0], [-15, 16], [15, 16]] }[n] || []).forEach(([a, b]) => skCirc(g, a, b, 5.5, col, 0)); });
Object.assign(SKA, {
  // Comité d'accueil : le paillasson « Bienvenue », la guirlande, et des pantoufles de toutes les tailles
  mo_accueil: g => {
    g.beginPath(); g.moveTo(74, 140); g.lineTo(74, 86); g.arc(128, 86, 54, Math.PI, 0); g.lineTo(182, 140); g.closePath(); skFS(g, skWood(g, 32, 140, '#c8844a', '#6a3a1e'));
    [106, 128, 150].forEach(x => skLine(g, [[x, 44 + Math.abs(x - 128) * .5], [x, 140]], 3, 'rgba(42,26,12,.45)')); skCirc(g, 164, 108, 6, '#ffd24a', 3);
    g.beginPath(); g.moveTo(30, 40); g.quadraticCurveTo(128, 104, 226, 40); g.lineWidth = 4; g.strokeStyle = SK_INK; g.stroke();
    [.1, .26, .42, .58, .74, .9].forEach((t, i) => { const x = (1 - t) * (1 - t) * 30 + 2 * (1 - t) * t * 128 + t * t * 226, y = (1 - t) * (1 - t) * 40 + 2 * (1 - t) * t * 104 + t * t * 40; skPath(g, [[x - 12, y - 1], [x + 12, y - 1], [x, y + 22]]); skFS(g, ['#e8402a', '#ffd24a', '#5fa24a', '#3a8ae8', '#e88ab4', '#f0a020'][i], 3); });
    skRect(g, 26, 128, 204, 54, 12, skLG(g, 0, 128, 0, 182, '#e8b26a', '#b07a3a')); skRect(g, 36, 136, 184, 38, 8, 'rgba(0,0,0,0)', 3);
    skTxt(g, 'Bienvenue', 128, 156, 27, '#fff3c0', 6);
    [[54, 206, 1.1, '#ff9aa8', '#d0506a', '#fff'], [140, 210, .85, '#9ad0f0', '#3a7ad8', '#ffd24a'], [208, 214, .62, '#b8e07a', '#4f9a3a', '#fff']].forEach(([x, y, s, a, b, p]) => { skSlipper(g, x - 8 * s, y - 6 * s, s, a, b, p); skSlipper(g, x + 6 * s, y + 10 * s, s, a, b, p); });
  },
  mo_album8: g => { skAlbum(g, 4); skSparkle(g, 214, 58, 11); },
  mo_album16: g => {
    skRot(g, 128, 146, .07, () => { skRect(g, -102, -62, 204, 140, 12, '#2f6a2a'); [0, 1, 2].forEach(i => skRect(g, -94 + i * 3, -54 - i * 4, 188, 126, 6, '#f4e8cc', 3)); });
    skAlbum(g, 8); g.beginPath(); g.moveTo(178, 84); g.lineTo(178, 226); g.lineTo(187, 216); g.lineTo(196, 226); g.lineTo(196, 82); skFS(g, '#e8402a', 4); skSparkle(g, 36, 52, 11); skSparkle(g, 222, 46, 9);
  },
  mo_album24: g => {
    skRect(g, 64, 44, 140, 180, 10, '#f4e8cc'); skRect(g, 56, 36, 140, 180, 12, skLG(g, 0, 36, 0, 216, '#8fd06a', '#3f8a3a')); skRect(g, 56, 36, 22, 180, 8, skLG(g, 56, 0, 78, 0, '#5fa24a', '#2f6a2a'), 4);
    [[104, 70, '#f2a65a'], [170, 76, '#9ad0f0'], [98, 196, '#e88ab4'], [172, 190, '#c9a0f0']].forEach(([x, y, c]) => { skCirc(g, x, y, 13, skRG(g, x, y, 13, '#fff', c), 3); skCirc(g, x - 4, y - 1, 2, SK_INK, 0); skCirc(g, x + 4, y - 1, 2, SK_INK, 0); });
    skStar(g, 136, 132, 16, 52, 44, skRG(g, 136, 132, 52, '#ffe58a', '#c48a22'), 5); skCirc(g, 136, 132, 34, skRG(g, 136, 132, 34, '#fff3c0', '#e0a830'), 4);
    skLine(g, [[120, 132], [132, 144], [154, 118]], 8); skLine(g, [[120, 132], [132, 144], [154, 118]], 4, '#5fa24a');
    skSparkle(g, 214, 40, 13); skSparkle(g, 36, 120, 9); skSparkle(g, 222, 214, 10);
  },
  // Château grouillant : une foule de petites têtes devant le château
  mo_foule: g => {
    skScene(g, '#bfe0f8', '#f4e2c0', () => {
      skPath(g, [[70, 150], [70, 92], [62, 92], [62, 76], [74, 76], [74, 84], [86, 84], [86, 76], [98, 76], [98, 92], [158, 92], [158, 76], [170, 76], [170, 84], [182, 84], [182, 76], [194, 76], [194, 92], [186, 92], [186, 150]]); skFS(g, '#b8c0d8', 4);
      skPath(g, [[112, 92], [112, 54], [104, 54], [128, 22], [152, 54], [144, 54], [144, 92]]); skFS(g, '#c8d0e4', 4);
      const row = (y, r, cols, xs) => xs.forEach((x, i) => { const c = cols[i % cols.length]; if (i % 3 === 0) { skPath(g, [[x - r * .8, y - r * .5], [x - r * .5, y - r * 1.5], [x - r * .1, y - r * .8]]); skFS(g, c, 3); skPath(g, [[x + r * .8, y - r * .5], [x + r * .5, y - r * 1.5], [x + r * .1, y - r * .8]]); skFS(g, c, 3); } else if (i % 3 === 1) { skEll(g, x - r * .7, y - r * .7, r * .3, r * .45, c, 3, -.5); skEll(g, x + r * .7, y - r * .7, r * .3, r * .45, c, 3, .5); } skCirc(g, x, y, r, c, 3.5); skCirc(g, x - r * .32, y - r * .05, r * .2, '#fff', 0); skCirc(g, x + r * .32, y - r * .05, r * .2, '#fff', 0); skCirc(g, x - r * .3, y, r * .1, SK_INK, 0); skCirc(g, x + r * .34, y, r * .1, SK_INK, 0); });
      row(150, 13, ['#8a7ab0', '#6a9aa0', '#b08a6a'], [44, 70, 96, 122, 148, 174, 200, 226]);
      row(176, 17, ['#e88a5a', '#5fa24a', '#c9a0f0', '#3a8ae8'], [30, 64, 98, 132, 166, 200, 234]);
    });
    g.save(); g.beginPath(); g.rect(0, 0, 256, 256); g.clip();
    [[58, 218, '#f2c04a'], [128, 222, '#e8607a'], [198, 218, '#7ad0c0']].forEach(([x, y, c], i) => { if (i === 1) { skPath(g, [[x - 18, y - 16], [x - 10, y - 44], [x - 2, y - 20]]); skFS(g, '#fff3c0', 4); skPath(g, [[x + 18, y - 16], [x + 10, y - 44], [x + 2, y - 20]]); skFS(g, '#fff3c0', 4); } else { skEll(g, x - 20, y - 18, 9, 13, c, 4, -.5); skEll(g, x + 20, y - 18, 9, 13, c, 4, .5); } skCirc(g, x, y, 26, skRG(g, x, y, 26, '#fff', c), 5); skCirc(g, x - 8, y - 2, 4, SK_INK, 0); skCirc(g, x + 8, y - 2, 4, SK_INK, 0); skLine(g, [[x - 6, y + 10], [x, y + 14], [x + 6, y + 10]], 3); });
    g.restore();
  },
  // Chasseur de talents : un aimant qui attire une valise venue d'un autre château
  mo_aimant: g => {
    skRot(g, 92, 96, -.75, () => {
      g.beginPath(); g.moveTo(-50, 50); g.lineTo(-50, 0); g.arc(0, 0, 50, Math.PI, 0); g.lineTo(50, 50); g.lineTo(24, 50); g.lineTo(24, 0); g.arc(0, 0, 24, 0, Math.PI, true); g.lineTo(-24, 50); g.closePath(); skFS(g, skLG(g, -50, 0, 50, 0, '#7ab8f0', '#2a5aa8'));
      skRect(g, -50, 40, 26, 22, 3, '#e6eef6', 5); skRect(g, 24, 40, 26, 22, 3, '#e6eef6', 5); skShine(g, -30, -26, 14, 6, .5);
    });
    [[150, 120, 132, 108], [166, 106, 150, 92], [140, 140, 124, 130]].forEach(([a, b, c, d]) => skLine(g, [[a, b], [c, d]], 5, '#7ab8f0'));
    skRot(g, 182, 172, .18, () => {
      skRect(g, -16, -52, 32, 18, 8, 'rgba(0,0,0,0)', 6); skRect(g, -48, -38, 96, 72, 10, skLG(g, 0, -38, 0, 34, '#e8a05a', '#a8582a'));
      [-30, 30].forEach(x => skRect(g, x - 5, -38, 10, 72, 2, '#7a3a1a', 3)); skCirc(g, -8, -6, 13, '#fff3c0', 3); skStar(g, -8, -6, 5, 9, 4, '#e8402a', 2); skRect(g, 8, 8, 26, 16, 3, '#9ad0f0', 3);
    });
    skSparkle(g, 222, 92, 11); skSparkle(g, 40, 200, 9);
  },
  // Confident : une bulle de pensée, une lettre scellée d'un cœur
  mo_confident: g => {
    skBlob(g, [[128, 104, 76, 60], [72, 92, 40], [184, 92, 40], [96, 60, 36], [158, 58, 38], [128, 140, 54, 34]], skRG(g, 128, 96, 100, '#ffffff', '#d8ccf0'), 5);
    skCirc(g, 64, 182, 16, '#ece6f8', 5); skCirc(g, 42, 214, 10, '#ece6f8', 4); skCirc(g, 28, 236, 6, '#ece6f8', 3);
    skRot(g, 128, 104, -.08, () => {
      skRect(g, -48, -32, 96, 64, 6, skLG(g, 0, -32, 0, 32, '#fffaf0', '#efe2c4'), 5); skPath(g, [[-48, -32], [0, 6], [48, -32]]); skFS(g, 'rgba(0,0,0,0)', 4); skLine(g, [[-48, 32], [-14, 4]], 3); skLine(g, [[48, 32], [14, 4]], 3);
      skHeart(g, 0, 8, 30, skRG(g, -4, 0, 20, '#ff9aa8', '#d02a46'), 4);
    });
    skTxt(g, 'chut…', 196, 168, 22, '#fff', 5); skSparkle(g, 42, 52, 9);
  },
  // À la vie, à la mort : un cadenas en cœur, sa petite clé
  mo_fidele: g => {
    g.beginPath(); g.arc(128, 84, 40, Math.PI, 0); g.lineTo(168, 110); g.moveTo(88, 110); g.lineTo(88, 84); g.lineWidth = 22; g.strokeStyle = SK_INK; g.lineCap = 'round'; g.stroke(); g.lineWidth = 12; g.strokeStyle = '#c8ccd4'; g.stroke(); skShine(g, 104, 58, 10, 4, .6);
    skHeart(g, 128, 156, 140, skRG(g, 104, 126, 100, '#ff9aa8', '#c8203e'), 6); skShine(g, 82, 120, 16, 9, .5);
    skCirc(g, 128, 146, 13, SK_INK, 0); skPath(g, [[122, 150], [134, 150], [138, 176], [118, 176]]); skFS(g, SK_INK, 0);
    g.beginPath(); g.moveTo(196, 60); g.quadraticCurveTo(220, 100, 206, 150); g.lineWidth = 4; g.strokeStyle = '#e8402a'; g.stroke();
    skRot(g, 206, 170, .25, () => { skCirc(g, 0, -14, 12, skGold(g, -26, -2), 5); skCirc(g, 0, -14, 5, '#fff3c0', 3); skRect(g, -4, -2, 8, 36, 2, skGold(g, -2, 34), 4); skRect(g, 4, 20, 10, 6, 1, '#ffd24a', 3); skRect(g, 4, 28, 7, 5, 1, '#ffd24a', 3); });
    skSparkle(g, 48, 56, 11); skSparkle(g, 40, 206, 8);
  },
  // Conteur : un livre de contes ouvert, la lune et les étoiles qui en sortent
  mo_conteur: g => {
    [[56, 64, 16], [96, 42, 11], [168, 38, 12], [212, 76, 9]].forEach(([x, y, r]) => skStar(g, x, y, 5, r, r * .45, '#ffd24a', 3));
    g.beginPath(); g.arc(128, 84, 34, .6, Math.PI * 2 - .6); g.arc(146, 74, 26, Math.PI * 2 - .9, .9, true); g.closePath(); skFS(g, skRG(g, 120, 80, 40, '#fff6c0', '#f0c040'), 5);
    g.save(); g.globalAlpha = .5; [[80, 112], [104, 120], [152, 120], [176, 112]].forEach(([x, y]) => skCirc(g, x, y, 3, '#ffd24a', 0)); g.restore();
    skRect(g, 22, 132, 212, 96, 12, skLG(g, 0, 132, 0, 228, '#c8402a', '#7a1c14'));
    [-1, 1].forEach(k => { g.beginPath(); g.moveTo(128, 142); g.quadraticCurveTo(128 + k * 50, 124, 128 + k * 100, 134); g.lineTo(128 + k * 100, 214); g.quadraticCurveTo(128 + k * 50, 206, 128, 220); g.closePath(); skFS(g, k < 0 ? '#fbf3e0' : '#f4e8cc', 5); });
    skLine(g, [[128, 142], [128, 220]], 4);
    [[50, 154], [50, 172], [50, 190], [144, 154], [144, 172], [144, 190]].forEach(([x, y], i) => skLine(g, [[x, y], [x + (i % 3 === 2 ? 40 : 62), y]], 4, '#a8987a'));
  },
  // Cinq envies comblées : la liste, cinq coches, et l'étoile filante des vœux
  mo_envies: g => {
    skRot(g, 116, 140, -.08, () => {
      skRect(g, -66, -82, 132, 170, 10, skLG(g, 0, -82, 0, 88, '#fffaf0', '#efe2c4'));
      [-52, -22, 8, 38, 68].forEach(y => { skRect(g, -48, y - 11, 22, 22, 5, '#fff', 4); skLine(g, [[-44, y], [-37, y + 7], [-24, y - 10]], 7); skLine(g, [[-44, y], [-37, y + 7], [-24, y - 10]], 3.5, '#5fa24a'); skLine(g, [[-12, y], [46, y]], 4, '#a8987a'); });
    });
    g.beginPath(); g.moveTo(82, 34); g.quadraticCurveTo(150, 16, 196, 52); g.lineWidth = 12; g.strokeStyle = 'rgba(255,210,74,.55)'; g.lineCap = 'round'; g.stroke();
    skStar(g, 200, 58, 4, 34, 10, skRG(g, 200, 58, 34, '#fffbe0', '#f0b02a'), 5); skSparkle(g, 226, 120, 9); skSparkle(g, 44, 70, 8);
  },
  // Increvable : la nuit 20, comptée à la craie sur une ardoise, sous la lune
  mo_nuit20: g => {
    skScene(g, '#3a4a8e', '#1a2150', () => { [[56, 64], [96, 40], [200, 132], [40, 120], [150, 34]].forEach(([x, y]) => skSparkle(g, x, y, 6)); });
    g.beginPath(); g.arc(170, 74, 40, .5, Math.PI * 2 - .5); g.arc(190, 62, 32, Math.PI * 2 - .95, .95, true); g.closePath(); skFS(g, skRG(g, 160, 70, 46, '#fff6c0', '#e8c060'), 5);
    skCirc(g, 150, 76, 4, SK_INK, 0); skLine(g, [[146, 96], [156, 100], [164, 96]], 3.5);
    skRect(g, 28, 120, 200, 112, 10, skWood(g, 120, 232)); skRect(g, 40, 132, 176, 88, 5, skLG(g, 0, 132, 0, 220, '#3e4a44', '#25302a'), 4);
    [0, 1, 2, 3].forEach(i => { const x = 54 + i * 41; [0, 1, 2, 3].forEach(j => skLine(g, [[x + j * 7, 152], [x + j * 7 - 2, 198]], 4, '#f4f0e6')); skLine(g, [[x - 6, 188], [x + 28, 160]], 4, '#f4f0e6'); });
  },
  // une Merveille du Val : le petit temple et son ruban
  mo_merveille: g => { skTemple(g); skSparkle(g, 218, 52, 12); skSparkle(g, 38, 60, 9); },
  mo_merveille_up: g => {
    g.save(); g.translate(112, 136); g.scale(.82, .82); g.translate(-128, -128); skTemple(g); g.restore();
    skCirc(g, 196, 66, 32, skRG(g, 196, 66, 32, '#b8f08a', '#3f8a3a')); skPath(g, [[196, 44], [216, 66], [204, 66], [204, 88], [188, 88], [188, 66], [176, 66]]); skFS(g, '#fff', 4);
  },
  // La main heureuse : trois dés, trois six
  mo_crit3: g => {
    skStar(g, 128, 124, 12, 106, 70, skRG(g, 128, 124, 106, '#fff3a0', '#f0b02a'), 5);
    skDie(g, 88, 160, -.2, 6); skDie(g, 168, 160, .18, 6); skDie(g, 128, 98, .05, 6);
    skSparkle(g, 214, 62, 11); skSparkle(g, 40, 76, 9);
  },
  // Pas de quartier : le casque d'un héros qui s'envole, avec des étoiles
  mo_repousse: g => {
    [[60, 120, 34, 92], [52, 152, 20, 152], [66, 182, 32, 206]].forEach(([a, b, c, d]) => skLine(g, [[a, b], [c, d]], 6));
    skStar(g, 98, 148, 9, 46, 26, '#ffd24a', 5);
    skRot(g, 150, 126, .35, () => {
      g.beginPath(); g.moveTo(-58, 30); g.lineTo(-58, 0); g.bezierCurveTo(-58, -64, 58, -64, 58, 0); g.lineTo(58, 30); g.closePath(); skFS(g, skLG(g, -58, 0, 58, 0, '#f2f6fa', '#8a96a6'));
      skRect(g, -64, 22, 128, 18, 6, skLG(g, 0, 22, 0, 40, '#dfe6ee', '#8a96a6')); skRect(g, -6, -10, 12, 46, 3, '#5a6676', 4); [-30, 30].forEach(x => skRect(g, x - 16, 0, 32, 8, 3, SK_INK, 0));
      g.beginPath(); g.moveTo(0, -46); g.bezierCurveTo(-10, -86, 30, -100, 50, -82); g.bezierCurveTo(30, -74, 18, -60, 8, -44); skFS(g, '#e8402a', 5);
      skLine(g, [[20, -32], [28, -18], [18, -8]], 4);
    });
    [[196, 46], [222, 84], [176, 30]].forEach(([x, y], i) => skStar(g, x, y, 5, 13 - i * 2, 5, '#fff3a0', 4));
  },
  // Inviolable : le rempart, sa porte bardée, et les flèches qui n'ont rien percé
  mo_rempart: g => {
    skPath(g, [[24, 222], [24, 84], [24, 66], [52, 66], [52, 84], [72, 84], [72, 66], [100, 66], [100, 84], [156, 84], [156, 66], [184, 66], [184, 84], [204, 84], [204, 66], [232, 66], [232, 84], [232, 222]]); skFS(g, skLG(g, 0, 66, 0, 222, '#d8d0c0', '#988c7c'));
    g.save(); g.globalAlpha = .45; [[40, 108, 32], [176, 116, 40], [40, 168, 26], [188, 176, 30], [120, 100, 26]].forEach(([x, y, w]) => skRect(g, x, y, w, 16, 3, 'rgba(0,0,0,0)', 3)); g.restore();
    g.beginPath(); g.moveTo(84, 222); g.lineTo(84, 150); g.arc(128, 150, 44, Math.PI, 0); g.lineTo(172, 222); g.closePath(); skFS(g, skWood(g, 106, 222));
    [128].forEach(x => skLine(g, [[x, 108], [x, 222]], 4)); [142, 186].forEach(y => skRect(g, 84, y, 88, 10, 2, '#5a6676', 4)); [[96, 147], [160, 147], [96, 191], [160, 191]].forEach(([x, y]) => skCirc(g, x, y, 3, '#dfe6ee', 0));
    skCirc(g, 144, 166, 6, '#ffd24a', 3);
    [[66, 140, -.5], [196, 132, .4], [204, 196, -.3]].forEach(([x, y, a]) => skRot(g, x, y, a, () => { skDuo(g, [[0, 0], [-38, 0]], 4, '#c99a5a'); skPath(g, [[-38, 0], [-52, -9], [-48, 0], [-52, 9]]); skFS(g, '#f2f6fa', 3); skLine(g, [[2, -6], [-4, 6]], 3); }));
  },
  // Forteresse : le donjon, sa bannière, et le blason des dix bandes repoussées
  mo_forteresse: g => {
    skLine(g, [[128, 52], [128, 16]], 6); g.beginPath(); g.moveTo(130, 18); g.quadraticCurveTo(160, 10, 184, 24); g.quadraticCurveTo(160, 34, 130, 44); skFS(g, '#6aa0e0', 4);
    skPath(g, [[56, 226], [62, 78], [56, 78], [56, 52], [80, 52], [80, 64], [100, 64], [100, 52], [120, 52], [120, 64], [136, 64], [136, 52], [156, 52], [156, 64], [176, 64], [176, 52], [200, 52], [200, 78], [194, 78], [200, 226]]); skFS(g, skLG(g, 56, 0, 200, 0, '#c8c0b0', '#6e6658'));
    g.save(); g.globalAlpha = .4; [[74, 96, 28], [150, 110, 32], [82, 196, 30], [152, 204, 26]].forEach(([x, y, w]) => skRect(g, x, y, w, 14, 3, 'rgba(0,0,0,0)', 3)); g.restore();
    skRect(g, 120, 88, 16, 28, 8, '#2a1a0c', 0); skRect(g, 108, 196, 40, 30, 6, '#5a3a22', 4);
    skPath(g, [[128, 126], [180, 140], [174, 184], [128, 214], [82, 184], [76, 140]]); skFS(g, skLG(g, 0, 126, 0, 214, '#e8554a', '#8a1c1c'));
    skTxt(g, 'X', 128, 168, 44, '#ffe58a', 6); skSparkle(g, 220, 92, 11); skSparkle(g, 36, 112, 9);
  },
  // une expédition menée : l'entrée du donjon, la lanterne, des pas qui en reviennent
  mo_expe: g => {
    skPath(g, [[20, 214], [36, 112], [70, 64], [128, 46], [186, 64], [220, 112], [236, 214]]); skFS(g, skLG(g, 0, 46, 0, 214, '#a8a090', '#5e584e'));
    g.beginPath(); g.moveTo(82, 214); g.lineTo(82, 140); g.arc(128, 140, 46, Math.PI, 0); g.lineTo(174, 214); g.closePath(); skFS(g, skLG(g, 0, 94, 0, 214, '#1a1424', '#3a2e4a'));
    g.beginPath(); g.moveTo(10, 214); g.quadraticCurveTo(128, 196, 246, 214); g.quadraticCurveTo(128, 250, 10, 214); skFS(g, skLG(g, 0, 200, 0, 240, '#c8b088', '#8a7450'), 5);
    [[116, 178, .35, .5], [140, 196, .55, .7], [110, 220, .8, .95]].forEach(([x, y, s, a]) => { g.save(); g.globalAlpha = a; skEll(g, x, y, 9 * s / .6, 7 * s / .6, '#5a4630', 0); [-1, 0, 1].forEach(k => skCirc(g, x + k * 8 * s / .6, y - 10 * s / .6, 3.4 * s / .6, '#5a4630', 0)); g.restore(); });
    skLine(g, [[196, 96], [196, 74], [214, 74]], 5); skRect(g, 184, 96, 24, 8, 3, '#3a2a2a', 4); skRect(g, 182, 104, 28, 36, 6, skRG(g, 196, 120, 26, '#fff3a0', '#f0a020')); skRect(g, 184, 140, 24, 8, 3, '#3a2a2a', 4); skGlow(g, 196, 122, 40, 'rgba(255,220,120,.45)');
  },
});

/* ---------- l'ouverture d'un chapitre : un grand sticker, l'enseigne de l'ère en haut, son dessin en bas ---------- */
// le dessin recadré au plus près (sans marge transparente), pour que l'enseigne vienne se poser dessus
function stkArtTrim(key) {
  const ck = 'trim:' + key; if (SKA_CACHE[ck]) return SKA_CACHE[ck]; const f = SKA[key]; if (!f || typeof document === 'undefined') return null;
  try {
    const cv = document.createElement('canvas'); cv.width = cv.height = 256; const g = cv.getContext('2d'); f(g); const d = g.getImageData(0, 0, 256, 256).data;
    let x0 = 256, y0 = 256, x1 = 0, y1 = 0; for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) if (d[(y * 256 + x) * 4 + 3] > 24) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0) return stkArt(key); const w = x1 - x0 + 3, h = y1 - y0 + 3, o = document.createElement('canvas'); o.width = w; o.height = h; o.getContext('2d').drawImage(cv, x0 - 1, y0 - 1, w, h, 0, 0, w, h);
    SKA_CACHE[ck] = typeof thumbURL === 'function' ? thumbURL(o.toDataURL()) : o.toDataURL(); return SKA_CACHE[ck];
  } catch (e) { return stkArt(key); }
}
function lvEraSticker(name, n = 0) {
  const u = stkArtTrim(eraArtKey(name));
  return `<div class="lv-era" style="--rot:${n % 2 ? 2.5 : -2.5}deg"><div class="lv-era-cut"><div class="lv-era-sign"><i></i><small>L’Ère</small><b>${esc(name)}</b><i></i></div>${u ? `<img alt="" src="${u}">` : ''}</div></div>`;
}
// le sceau de l'âge, en bas de la page de chapitre
function lvAgeArt(c) { const k = c.age === 'or' ? 'or_' + eraArtKey(c.name) : 'age_' + c.age, u = stkArt(k); return u ? `<img alt="" src="${u}">` : `<span>${AGES[c.age].ico}</span>`; }
// dernier recours, quand un moment n'a ni dessin du jeu ni contexte (boss oublié, créature partie)
const STK_FALLBACK = { f_boss: 'age_heroique', r_boss: 'age_heroique', boss3: 'age_heroique', f_rare: 'vic_menagerie', f_dragon: 'vic_menagerie', r_expe: 'mo_expe', propre: 'mo_expe' };
const lvArtSka2 = lvArt;
lvArt = function (x, m) { const h = lvArtSka2(x, m); if (!/lvs-emo/.test(h)) return h; const u = stkArt(STK_FALLBACK[x.id] || 'vic_any'); return u ? `<img alt="" src="${u}">` : h; };
// un boss ou une élite sans espèce du château : son propre dessin d'expédition
const lvFoeArt = k => { const L = CRAWL_LOOK[k], src = L ? thumb(L[0], L[1], true) : FOE_ART[k] ? thumb('foe', k, true) : null; return src ? `<img alt="" src="${src}"${L && L[2] ? ` style="filter:${L[2]} drop-shadow(0 3px 2px rgba(0,0,0,.35))"` : ''}>` : ''; };
const lvArtFoe = lvArt;
lvArt = function (x, m) { const h = x.art && x.art.k === 'foe' && lvFoeArt(x.art.key); return h || lvArtFoe(x, m); };
// les stickers déjà gagnés, à l'affichage : leur propre dessin plutôt que la créature collée au hasard, et le boss retrouvé par son nom
const stkFoeKey = x => {
  const id = x.id || '', e = /^(?:boss|elite):([^:]+)/.exec(id), d = /^donjon:(.+)$/.exec(id);
  if (e) return CRAWL_EN[e[1]] ? e[1] : null; if (d) return (CRAWL_DG[d[1]] || {}).boss || null;
  return ['f_boss', 'r_boss', 'boss3'].includes(id) && x.sub ? Object.keys(CRAWL_EN).find(k => CRAWL_EN[k].name === x.sub) || null : null;
};
function stkFix(x) {
  if (!x || !x.id) return x;
  if (STK_ART[x.id]) return { ...x, art: null, sub: STK_NOSUB.includes(x.id) ? '' : x.sub };
  const k = !x.art && stkFoeKey(x); return k ? { ...x, art: { k: 'foe', key: k } } : x;
}
