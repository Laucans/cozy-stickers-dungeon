
/* =========================================================
   Art peint : primitives ombrées (dégradés, reflets, contours colorés),
   mobilier, pièges, décor extérieur, icônes
   Unités « art » : une case = 64 de large ; (0,0) = centre de la case au sol
   ========================================================= */
const INK = '#2a1c16';
const PAL = { wood: '#a8683a', wood2: '#7a4a28', iron: '#6f7480', gold: '#e9b949', straw: '#e3c46e', red: '#b83a33', blue: '#3a578f',
  stone: '#8f877b', green: '#5f9a4f', cream: '#f1e4c8', purple: '#7550b0', copper: '#c7803f', bone: '#ece4d2' };
const pt = (x, y, z = 0) => [(x - y) * 32, (x + y) * 16 - z];
let FLAT = false;   // aplats façon sticker (réservé aux personnages)
const isHex = c => typeof c === 'string' && c[0] === '#';
const outl = c => FLAT ? INK : isHex(c) ? shade(c, -.62) : INK;
const flw = lw => FLAT && lw ? Math.max(lw, 1.4) : lw;
function path(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
function bbox(pts) { let a = 1e9, b = 1e9, c = -1e9, d = -1e9; for (const [x, y] of pts) { if (x < a) a = x; if (y < b) b = y; if (x > c) c = x; if (y > d) d = y; } return [a, b, c, d]; }
function fi(g, col, lw = 1.1) { lw = flw(lw); g.fillStyle = col; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = outl(col); g.lineJoin = 'round'; g.lineCap = 'round'; g.stroke(); } }
function poly(g, pts, col, lw = 1.1) {
  path(g, pts); lw = flw(lw);
  if (isHex(col) && !FLAT) { const [x0, y0, x1, y1] = bbox(pts); const gr = g.createLinearGradient(x0, y0, x1 + (x1 - x0) * .2, y1); gr.addColorStop(0, shade(col, .22)); gr.addColorStop(.55, col); gr.addColorStop(1, shade(col, -.2)); g.fillStyle = gr; } else g.fillStyle = col;
  g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = outl(col); g.lineJoin = 'round'; g.stroke(); }
}
function radial(g, x, y, r, col) { if (FLAT) return col; const gr = g.createRadialGradient(x - r * .38, y - r * .42, r * .06, x, y, r * 1.15); gr.addColorStop(0, shade(col, .48)); gr.addColorStop(.45, col); gr.addColorStop(1, shade(col, -.34)); return gr; }
function ball(g, x, y, r, col, lw = 1) { lw = flw(lw); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fillStyle = isHex(col) ? radial(g, x, y, r, col) : col; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = outl(col); g.stroke(); } }
function ell(g, x, y, rx, ry, col, lw = 1) { lw = flw(lw); g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = isHex(col) ? radial(g, x, y, Math.max(rx, ry), col) : col; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = outl(col); g.stroke(); } }
function rrect(g, x, y, w, h, r, col, lw = 1) { lw = flw(lw); rr(g, x, y, w, h, r); if (isHex(col) && !FLAT) { const gr = g.createLinearGradient(x, y, x + w * .4, y + h); gr.addColorStop(0, shade(col, .25)); gr.addColorStop(1, shade(col, -.22)); g.fillStyle = gr; } else g.fillStyle = col; g.fill(); if (lw) { g.lineWidth = lw; g.strokeStyle = outl(col); g.stroke(); } }
function ln(g, pts, col, w) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.lineJoin = 'round'; g.stroke(); }
function inkLn(g, pts, col, w) { if (FLAT) { ln(g, pts, INK, w + 2.6); ln(g, pts, col, w); return; } ln(g, pts, outl(col), w + 2); ln(g, pts, col, w); ln(g, pts.map(([x, y]) => [x - w * .18, y - w * .18]), 'rgba(255,245,225,.28)', w * .35); }
function box(g, x, y, w, d, h, z, col, mat) {
  const x0 = x - w / 2, x1 = x + w / 2, y0 = y - d / 2, y1 = y + d / 2, tz = z + h;
  const L = [pt(x0, y1, z), pt(x1, y1, z), pt(x1, y1, tz), pt(x0, y1, tz)], R = [pt(x1, y0, z), pt(x1, y1, z), pt(x1, y1, tz), pt(x1, y0, tz)], T = [pt(x0, y0, tz), pt(x1, y0, tz), pt(x1, y1, tz), pt(x0, y1, tz)];
  const face = (p, c) => { path(g, p); if (FLAT) { g.fillStyle = c; g.fill(); return; } const [, b0, , b1] = bbox(p); const gr = g.createLinearGradient(0, b0, 0, b1); gr.addColorStop(0, shade(c, .1)); gr.addColorStop(1, shade(c, -.2)); g.fillStyle = gr; g.fill(); };
  face(L, col); face(R, shade(col, -.3)); path(g, T); g.fillStyle = shade(col, .2); g.fill();
  if ((mat === 'wood' || mat === 'stone') && h > 7) {
    const n = mat === 'wood' ? Math.max(1, Math.round(h / 8)) : Math.max(1, Math.round(h / 10));
    g.strokeStyle = mat === 'wood' ? 'rgba(45,22,8,.35)' : 'rgba(20,15,10,.35)'; g.lineWidth = .7;
    for (let i = 1; i <= n; i++) { const zz = z + h * i / (n + 1); g.beginPath(); g.moveTo(...pt(x0, y1, zz)); g.lineTo(...pt(x1, y1, zz)); g.lineTo(...pt(x1, y0, zz)); g.stroke(); }
  }
  g.lineJoin = 'round'; g.lineWidth = .9; g.strokeStyle = outl(col);
  [L, R, T].forEach(p => { path(g, p); g.stroke(); });
  g.strokeStyle = 'rgba(255,244,220,.55)'; g.lineWidth = .8; g.beginPath(); g.moveTo(...T[3]); g.lineTo(...T[2]); g.lineTo(...T[1]); g.stroke();
}
function cyl(g, x, y, r, h, z, col, top) {
  const [cx, cy] = pt(x, y, z), rx = r * 45, ry = r * 22.5;
  const gr = g.createLinearGradient(cx - rx, 0, cx + rx, 0);
  gr.addColorStop(0, shade(col, -.12)); gr.addColorStop(.26, shade(col, .3)); gr.addColorStop(.45, shade(col, .06)); gr.addColorStop(1, shade(col, -.42));
  g.beginPath(); g.moveTo(cx - rx, cy - h); g.lineTo(cx - rx, cy); g.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, true); g.lineTo(cx + rx, cy - h); g.closePath();
  g.fillStyle = gr; g.fill(); g.lineWidth = .9; g.strokeStyle = outl(col); g.stroke();
  g.beginPath(); g.ellipse(cx, cy - h, rx, ry, 0, 0, Math.PI * 2); g.fillStyle = isHex(top || col) ? radial(g, cx, cy - h, rx, top || shade(col, .18)) : top; g.fill(); g.stroke();
  g.beginPath(); g.ellipse(cx, cy - h, rx, ry, 0, .1, Math.PI - .1); g.strokeStyle = 'rgba(255,240,210,.4)'; g.lineWidth = .8; g.stroke();
}
function hoop(g, x, y, r, z, col = '#4d4b52') { const [cx, cy] = pt(x, y, z); g.beginPath(); g.ellipse(cx, cy, r * 45, r * 22.5, 0, 0, Math.PI); g.strokeStyle = outl(col); g.lineWidth = 2.6; g.stroke(); g.strokeStyle = col; g.lineWidth = 1.4; g.stroke(); }
function disc(g, x, y, z, r, col) { const [cx, cy] = pt(x, y, z); ell(g, cx, cy, r * 45, r * 22.5, col); }
function post(g, x, y, h, col = PAL.wood2, z = 0) { box(g, x, y, .07, .07, h, z, col); }
function cloth(g, pts, col) { poly(g, pts, col, 1); }

/* ---------- mobilier (les flammes sont animées par le moteur) ---------- */
const FDRAW = {
  paillasse: g => { box(g, 0, 0, .7, .46, 6, 0, PAL.straw); for (let i = 0; i < 9; i++) { const [a, b] = pt(-.32 + i * .08, .23, 3); ln(g, [[a, b], [a + 3, b - 2.5]], '#b08a3a', .9); } box(g, -.25, 0, .17, .34, 5, 6, PAL.cream); cloth(g, [pt(-.12, -.22, 7), pt(.34, -.22, 7), pt(.34, .22, 7), pt(-.12, .22, 7)], '#8a6aa8'); },
  litsup: g => {
    post(g, -.31, -.19, 46); post(g, -.31, .19, 46);
    [0, 25].forEach(z => { box(g, 0, 0, .62, .38, 5, z + 4, PAL.wood, 'wood'); box(g, .03, 0, .52, .32, 4, z + 9, '#8fa6d8'); box(g, -.22, 0, .13, .26, 4, z + 12, PAL.cream); });
    post(g, .31, -.19, 46); post(g, .31, .19, 46);
  },
  baldaquin: g => {
    post(g, -.33, -.22, 52); post(g, -.33, .22, 52);
    box(g, 0, 0, .66, .44, 9, 0, PAL.wood, 'wood'); box(g, .03, 0, .56, .38, 5, 9, '#d98fb0'); box(g, -.23, 0, .14, .3, 4, 14, PAL.cream);
    post(g, .33, -.22, 52); post(g, .33, .22, 52); box(g, 0, 0, .72, .5, 5, 52, PAL.purple);
    for (let i = 0; i < 5; i++) { const [a, b] = pt(-.36 + i * .18, .25, 52); poly(g, [[a, b], [a + 11, b + 5.5], [a + 6, b + 12]], shade(PAL.purple, .2), .8); }
  },
  coffre: g => { box(g, 0, 0, .48, .32, 15, 0, PAL.wood, 'wood'); box(g, -.14, 0, .035, .33, 15.5, 0, PAL.gold); box(g, .14, 0, .035, .33, 15.5, 0, PAL.gold); ball(g, ...pt(0, .16, 9), 2.4, PAL.gold); const [s, t] = pt(.06, .16, 15); poly(g, [[s - 3, t], [s + 3, t], [s + 4, t + 9], [s + 9, t + 11], [s + 8, t + 14], [s - 2, t + 12]], '#d9607a', .9); },
  chaudron: g => { box(g, 0, 0, .5, .5, 3, 0, '#4a4440', 'stone'); cyl(g, 0, 0, .3, 18, 6, '#33333c'); disc(g, 0, 0, 24, .25, '#8a5a30'); [[-6, -2], [4, 1], [0, -5]].forEach(([dx, dy]) => { const [a, b] = pt(0, 0, 24); ball(g, a + dx, b + dy, 2.2, '#c08a52'); }); },
  tonneau: g => { cyl(g, 0, 0, .25, 28, 0, PAL.wood); hoop(g, 0, 0, .25, 7); hoop(g, 0, 0, .25, 21); const [a, b] = pt(0, 0, 30); ball(g, a - 4, b, 4, '#e7d4f0'); ball(g, a + 4, b - 1, 3.6, '#c9a3e0'); ln(g, [[a - 4, b - 4], [a - 5, b - 8]], PAL.green, 1.6); },
  jambons: g => { post(g, -.32, 0, 46); post(g, .32, 0, 46); box(g, 0, 0, .72, .06, 4, 44, PAL.wood2); [-.16, .14].forEach((x, i) => { const [a, b] = pt(x, 0, 44); ln(g, [[a, b], [a, b + 8]], INK, 1.1); ell(g, a, b + 17, 7, 10, i ? '#d0805f' : '#c06f50'); ball(g, a, b + 7, 2.4, PAL.bone); }); },
  choux: g => { box(g, 0, 0, .74, .74, 4, 0, '#6a4228', 'wood'); [[-.18, -.18], [.18, -.12], [-.12, .18], [.18, .2]].forEach(([x, y]) => { const [a, b] = pt(x, y, 9); ball(g, a, b, 7.5, '#7fbf5a'); ln(g, [[a - 3, b - 2], [a + 2, b + 3]], '#3f7a35', 1.1); }); },
  champis: g => {
    box(g, 0, 0, .74, .74, 4, 0, '#6a4228', 'wood');
    [[-.2, -.1, 1], [.16, -.16, .8], [0, .18, 1.1], [.22, .16, .7]].forEach(([x, y, s]) => { const [a, b] = pt(x, y, 4); rrect(g, a - 2 * s, b - 9 * s, 4 * s, 9 * s, 2, PAL.cream, .8); g.beginPath(); g.ellipse(a, b - 9 * s, 8 * s, 6 * s, 0, Math.PI, 0); g.closePath(); g.fillStyle = radial(g, a, b - 11 * s, 8 * s, '#9a5bd0'); fi(g, g.fillStyle, .9); ball(g, a - 3 * s, b - 12 * s, 1.3, '#fff', 0); ball(g, a + 3 * s, b - 11 * s, 1.1, '#fff', 0); });
  },
  epouvantail: g => {
    post(g, 0, 0, 48); box(g, 0, 0, .56, .05, 4, 36, PAL.wood2);
    const [a, b] = pt(0, 0, 38); poly(g, [[a - 10, b - 4], [a + 10, b - 4], [a + 13, b + 14], [a - 13, b + 14]], '#5a86bd');
    ball(g, a, b - 12, 9, PAL.straw); ln(g, [[a - 4, b - 13], [a - 2, b - 11]], INK, 1.3); ln(g, [[a + 2, b - 13], [a + 4, b - 11]], INK, 1.3); ln(g, [[a - 4, b - 8], [a + 4, b - 8]], INK, 1);
    poly(g, [[a - 13, b - 17], [a + 13, b - 17], [a + 4, b - 30], [a - 3, b - 30]], '#6b4a3a');
  },
  biere: g => { cyl(g, 0, 0, .25, 30, 0, '#9a5f2d'); hoop(g, 0, 0, .25, 8); hoop(g, 0, 0, .25, 22); box(g, 0, .27, .05, .08, 4, 10, PAL.iron); cyl(g, .05, -.02, .09, 10, 30, '#e9b949', '#fff6df'); },
  tablee: g => { [[-.32, -.16], [.32, -.16], [-.32, .16]].forEach(([x, y]) => post(g, x, y, 16)); box(g, 0, 0, .78, .44, 4, 16, PAL.wood, 'wood'); post(g, .32, .16, 16); box(g, 0, .36, .72, .12, 3, 8, PAL.wood2); cyl(g, -.15, -.05, .07, 8, 20, '#e9b949', '#fff6df'); cyl(g, .18, .05, .07, 8, 20, '#e9b949', '#fff6df'); disc(g, .02, -.08, 20.5, .1, PAL.cream); },
  scene: g => { box(g, 0, 0, .82, .62, 8, 0, '#94582b', 'wood'); const [a, b] = pt(0, 0, 8); ell(g, a - 2, b - 10, 8, 10, '#d0903c'); ball(g, a - 2, b - 11, 2.2, INK, 0); inkLn(g, [[a + 3, b - 17], [a + 14, b - 30]], '#7a4a28', 2.2); [[14, -18], [-14, -26]].forEach(([dx, dy]) => { ball(g, a + dx, b + dy, 3, '#2a1c16', 0); ln(g, [[a + dx + 2.5, b + dy], [a + dx + 2.5, b + dy - 10]], '#2a1c16', 1.4); }); },
  etabli: g => { [[-.32, -.18], [.32, -.18], [-.32, .18]].forEach(([x, y]) => post(g, x, y, 18)); box(g, 0, 0, .76, .44, 5, 18, PAL.wood, 'wood'); post(g, .32, .18, 18); const [a, b] = pt(-.1, 0, 23); poly(g, [[a - 10, b], [a + 6, b - 2], [a + 6, b - 7]], '#c8ccd4', .9); inkLn(g, [pt(.12, -.05, 24), pt(.25, .05, 24)], PAL.wood2, 2.2); box(g, .14, -.07, .1, .06, 4, 23, PAL.iron); },
  caisse: g => { box(g, 0, 0, .46, .36, 16, 0, PAL.wood, 'wood'); inkLn(g, [pt(-.08, 0, 16), pt(-.12, -.05, 31)], PAL.wood2, 2); poly(g, [pt(-.17, -.05, 31), pt(-.06, -.05, 33), pt(-.08, -.05, 27)], '#c8ccd4', .8); inkLn(g, [pt(.08, .02, 16), pt(.12, .02, 29)], '#b8bcc6', 1.8); ball(g, ...pt(.12, .02, 30), 3, '#b8bcc6'); },
  longuevue: g => { ln(g, [pt(0, 0, 28), pt(-.2, .15, 0)], INK, 2.4); ln(g, [pt(0, 0, 28), pt(.2, .12, 0)], INK, 2.4); ln(g, [pt(0, 0, 28), pt(0, -.2, 0)], INK, 2.4); inkLn(g, [pt(-.18, .05, 26), pt(.25, -.1, 38)], '#c9963f', 5); ball(g, ...pt(.26, -.1, 38), 3.4, '#8fc9f0'); },
  perchoir: g => { box(g, 0, 0, .3, .3, 30, 0, PAL.stone, 'stone'); box(g, 0, 0, .42, .42, 5, 30, shade(PAL.stone, .12)); },
  etagere: g => { box(g, 0, -.24, .74, .2, 50, 0, PAL.wood2, 'wood'); [8, 24, 40].forEach((z, row) => { let x = -.32; for (let i = 0; i < 6; i++) { const w = .07 + hash(i, row) * .05, h = 9 + hash(row, i) * 4; box(g, x + w / 2, -.13, w, .03, h, z, ['#a8382f', '#33508a', '#56904a', '#d2992a', '#6c4aa8'][(i + row) % 5]); x += w + .02; if (x > .3) break; } }); },
  pupitre: g => { post(g, 0, 0, 22); poly(g, [pt(-.2, -.12, 26), pt(.2, -.12, 26), pt(.2, .12, 20), pt(-.2, .12, 20)], PAL.wood); poly(g, [pt(-.17, -.08, 27.5), pt(0, -.08, 28), pt(0, .08, 23), pt(-.17, .08, 22)], PAL.cream, .8); poly(g, [pt(0, -.08, 28), pt(.17, -.08, 27.5), pt(.17, .08, 22), pt(0, .08, 23)], '#fffaf0', .8); },
  fauteuil: g => { box(g, 0, -.18, .44, .08, 30, 0, '#a8382f'); box(g, -.2, 0, .06, .44, 17, 0, '#8e2f28'); box(g, 0, .02, .36, .38, 11, 0, '#b8423a'); box(g, .2, 0, .06, .44, 17, 0, '#8e2f28'); },
  alambic: g => { box(g, -.1, 0, .3, .3, 7, 0, PAL.stone, 'stone'); ball(g, ...pt(-.1, 0, 22), 12, PAL.copper); inkLn(g, [pt(-.1, 0, 34), pt(-.05, 0, 42), pt(.22, .08, 22)], PAL.copper, 2.2); const [a, b] = pt(.24, .12, 0); ell(g, a, b - 8, 7, 8, '#6fd09a'); box(g, .24, .12, .05, .05, 8, 14, '#cfe9dc'); },
  marmite: g => { cyl(g, 0, 0, .24, 14, 4, '#33333c'); disc(g, 0, 0, 18, .19, '#9a5ed0'); [[-5, -1], [5, 0], [0, -4]].forEach(([dx, dy]) => { const [a, b] = pt(0, 0, 18); ball(g, a + dx, b + dy, 2, '#d6b3f2', .6); }); },
  fioles: g => { box(g, 0, -.2, .64, .2, 34, 0, PAL.wood2, 'wood'); [8, 22].forEach((z, r) => [-.2, 0, .2].forEach((x, i) => { const [a, b] = pt(x, -.08, z); ell(g, a, b - 4, 3.6, 4.5, ['#e0607a', '#6fd09a', '#8fa6d8', '#e9b949'][(i + r) % 4]); box(g, x, -.08, .03, .03, 4, z + 8, '#ddd'); })); },
  cercueil: g => { box(g, 0, 0, .38, .74, 11, 0, '#5e3f30', 'wood'); box(g, 0, 0, .34, .7, 3, 11, '#734e3c'); ln(g, [pt(0, -.2, 14.5), pt(0, .15, 14.5)], PAL.gold, 2); ln(g, [pt(-.09, -.08, 14.5), pt(.09, -.08, 14.5)], PAL.gold, 2); },
  ossuaire: g => { [[-.15, .05, 0], [.12, .1, 0], [0, -.1, 0], [-.02, .02, 9]].forEach(([x, y, z]) => { const [a, b] = pt(x, y, z + 6); ball(g, a, b, 6.5, PAL.bone); ell(g, a - 2.2, b - .5, 1.5, 1.8, INK, 0); ell(g, a + 2.2, b - .5, 1.5, 1.8, INK, 0); }); inkLn(g, [pt(-.3, .2, 1), pt(.05, .3, 1)], PAL.bone, 2.2); },
  enclume: g => { cyl(g, 0, 0, .2, 12, 0, PAL.wood); box(g, 0, 0, .4, .16, 9, 12, '#545a66'); poly(g, [pt(.2, -.05, 21), pt(.33, 0, 18), pt(.2, .05, 17)], '#545a66'); },
  fourneau: g => { box(g, 0, 0, .6, .5, 28, 0, '#9a4a34', 'stone'); const [a, b] = pt(0, .25, 4); g.beginPath(); g.moveTo(a - 8, b + 4); g.lineTo(a - 8, b - 8); g.quadraticCurveTo(a, b - 18, a + 8, b - 12); g.lineTo(a + 8, b); g.closePath(); g.fillStyle = '#2a120c'; g.fill(); box(g, .12, -.12, .14, .14, 18, 28, '#7f3e2c', 'stone'); },
  ratelier: g => { post(g, -.3, -.1, 36); post(g, .3, -.1, 36); box(g, 0, -.1, .66, .05, 4, 32, PAL.wood2); box(g, 0, -.1, .66, .05, 4, 10, PAL.wood2); [-.18, 0, .18].forEach((x, i) => { inkLn(g, [pt(x, -.04, 2), pt(x, -.04, 42)], i === 1 ? PAL.wood2 : '#d4d8e0', 2.2); if (i === 1) poly(g, [pt(x - .06, -.04, 40), pt(x + .06, -.04, 40), pt(x, -.04, 50)], '#d4d8e0', .8); }); },
  cage: g => { box(g, 0, 0, .52, .52, 3, 0, PAL.iron); [[-.26, -.26], [.26, -.26], [-.26, .26]].forEach(([x, y]) => inkLn(g, [pt(x, y, 3), pt(x, y, 40)], '#9aa0ab', 1.4)); box(g, 0, 0, .56, .56, 3, 40, PAL.iron); [[.26, .26], [0, .26], [.26, 0]].forEach(([x, y]) => inkLn(g, [pt(x, y, 3), pt(x, y, 40)], '#9aa0ab', 1.4)); },
  chaines: g => { post(g, 0, -.1, 42, PAL.stone); for (let i = 0; i < 4; i++) { const [a, b] = pt(.04, -.04, 36 - i * 7); g.beginPath(); g.ellipse(a + 2, b, 3, 4, 0, 0, Math.PI * 2); g.strokeStyle = INK; g.lineWidth = 2.6; g.stroke(); g.strokeStyle = '#a7adb8'; g.lineWidth = 1.2; g.stroke(); } },
  tasdor: g => { const [a, b] = pt(0, 0, 0); g.beginPath(); g.ellipse(a, b, 22, 11, 0, 0, Math.PI); g.lineTo(a - 22, b); g.quadraticCurveTo(a, b - 34, a + 22, b); g.fillStyle = radial(g, a, b - 10, 24, PAL.gold); fi(g, g.fillStyle, 1); for (let i = 0; i < 9; i++) ell(g, a - 14 + hash(i, 3) * 28, b - 4 - hash(3, i) * 14, 3.5, 1.8, '#ffe07a', .6); },
  coffreor: g => { poly(g, [pt(-.24, -.16, 15), pt(.24, -.16, 15), pt(.24, -.24, 30), pt(-.24, -.24, 30)], '#6e4226'); box(g, 0, 0, .48, .32, 15, 0, '#7e4e2a', 'wood'); box(g, 0, 0, .5, .05, 15.5, 0, PAL.gold); disc(g, 0, 0, 16, .17, PAL.gold); ball(g, ...pt(0, .16, 9), 2.4, PAL.gold); },
  canape: g => { box(g, 0, -.18, .74, .08, 28, 0, '#6f3780'); box(g, -.34, 0, .07, .44, 16, 0, '#5e2c6d'); box(g, 0, .02, .62, .38, 10, 0, '#84429a'); box(g, .34, 0, .07, .44, 16, 0, '#5e2c6d'); },
  orgue: g => { for (let i = 0; i < 6; i++) { const x = -.28 + i * .11, h = 52 - Math.abs(2.5 - i) * 6; cyl(g, x, -.24, .04, h, 26, i % 2 ? '#d9a32e' : '#e9b949'); } box(g, 0, -.1, .72, .3, 28, 0, '#523424', 'wood'); box(g, 0, .02, .64, .12, 3, 22, '#fffaf0'); },
  candelabre: g => { post(g, 0, 0, 38, PAL.gold); disc(g, 0, 0, 0, .12, PAL.gold); inkLn(g, [pt(-.16, 0, 38), pt(-.16, 0, 34), pt(.16, 0, 34), pt(.16, 0, 38)], PAL.gold, 1.8); [-.16, 0, .16].forEach(x => box(g, x, 0, .04, .04, 8, x ? 38 : 40, PAL.cream)); },
  trone: g => { box(g, 0, -.2, .5, .08, 58, 0, '#d9a32e'); box(g, 0, -.15, .36, .02, 40, 12, PAL.red); [-.2, .2].forEach(x => ball(g, ...pt(x, -.2, 62), 4, PAL.gold)); box(g, -.22, 0, .07, .44, 20, 0, '#d9a32e'); box(g, 0, .02, .38, .4, 14, 0, PAL.red); box(g, .22, 0, .07, .44, 20, 0, '#d9a32e'); },
  banniere: g => { post(g, 0, 0, 62); ball(g, ...pt(0, 0, 64), 3, PAL.gold); const [a, b] = pt(0, 0, 58); poly(g, [[a, b], [a + 18, b + 9], [a + 18, b + 36], [a + 9, b + 30], [a, b + 34]], PAL.red); ball(g, a + 9, b + 18, 4, PAL.gold); },
  torche: g => { post(g, 0, 0, 34, PAL.iron); cyl(g, 0, 0, .09, 5, 34, '#45454e'); },
  tapis: g => { poly(g, [pt(-.42, -.42, .5), pt(.42, -.42, .5), pt(.42, .42, .5), pt(-.42, .42, .5)], '#a8403a', 1); poly(g, [pt(-.3, -.3, .6), pt(.3, -.3, .6), pt(.3, .3, .6), pt(-.3, .3, .6)], '#d9a441', .8); poly(g, [pt(-.18, -.18, .7), pt(.18, -.18, .7), pt(.18, .18, .7), pt(-.18, .18, .7)], '#33508a', .8); },
  plante: g => { [[-12, -22, -.5], [12, -22, .5], [0, -30, 0], [-7, -27, -.25], [7, -27, .25]].forEach(([dx, dy, r]) => { const [a, b] = pt(0, 0, 12); g.save(); g.translate(a + dx * .55, b + dy * .5); g.rotate(r); ell(g, 0, 0, 4.5, 11, '#5fa64e', .9); g.restore(); }); cyl(g, 0, 0, .16, 13, 0, '#b8603a'); },
  os: g => { inkLn(g, [pt(-.2, .05, 2), pt(.2, -.05, 2)], PAL.bone, 3.2); [[-.22, .03], [-.18, .09], [.22, -.03], [.18, -.09]].forEach(([x, y]) => ball(g, ...pt(x, y, 2.5), 3, PAL.bone)); },
  toile: g => { post(g, -.3, -.3, 46); post(g, .3, -.3, 46); const [cx, cy] = pt(0, -.3, 30); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ln(g, [[cx, cy], [cx + Math.cos(a) * 18, cy + Math.sin(a) * 15]], '#cfcde0', 1.1); } [6, 11, 16].forEach(r => { g.beginPath(); for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI * 2; g[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * r, cy + Math.sin(a) * r * .85); } g.strokeStyle = '#cfcde0'; g.lineWidth = 1; g.stroke(); }); ball(g, cx + 5, cy + 3, 2.6, '#2a1c16', 0); },
  armure: g => { box(g, 0, 0, .3, .3, 4, 0, PAL.wood2); box(g, -.06, 0, .07, .1, 18, 4, '#aab2bf'); box(g, .06, 0, .07, .1, 18, 4, '#aab2bf'); box(g, 0, 0, .26, .14, 16, 22, '#b8c0cc'); const [a, b] = pt(0, 0, 46); ball(g, a, b, 8, '#b8c0cc'); ln(g, [[a - 5, b], [a + 5, b]], INK, 2); poly(g, [[a + 6, b + 10], [a + 18, b + 12], [a + 17, b + 26], [a + 11, b + 30], [a + 6, b + 24]], PAL.blue); },
  citrouille: g => { const [a, b] = pt(0, 0, 10); ell(g, a, b, 15, 11, '#e8822a'); ln(g, [[a - 6, b - 10], [a - 7, b + 10]], '#b8601a', 1.3); ln(g, [[a + 6, b - 10], [a + 7, b + 10]], '#b8601a', 1.3); inkLn(g, [[a, b - 10], [a + 2, b - 16]], '#5f9a4f', 2.4); poly(g, [[a - 7, b - 2], [a - 3, b - 6], [a - 2, b - 1]], '#3a1a0c', 0); poly(g, [[a + 7, b - 2], [a + 3, b - 6], [a + 2, b - 1]], '#3a1a0c', 0); poly(g, [[a - 6, b + 3], [a + 6, b + 3], [a, b + 7]], '#3a1a0c', 0); },
  theiere: g => { cyl(g, 0, 0, .22, 16, 0, PAL.wood2); const [a, b] = pt(0, 0, 16); ell(g, a - 1, b - 7, 8, 7, '#e3ecf6'); inkLn(g, [[a + 6, b - 7], [a + 13, b - 12]], '#e3ecf6', 2.2); ball(g, a - 1, b - 14, 2, '#e3ecf6'); ell(g, a - 13, b - 1, 3.5, 2.5, '#e3ecf6'); },
  tableau: g => { ln(g, [pt(-.12, .1, 0), pt(0, -.05, 46)], INK, 2.4); ln(g, [pt(.12, .1, 0), pt(0, -.05, 46)], INK, 2.4); const [a, b] = pt(0, .02, 30); rrect(g, a - 13, b - 16, 26, 30, 2, PAL.gold); rrect(g, a - 9, b - 12, 18, 22, 1, '#34445f'); ball(g, a, b - 3, 4.5, '#f0d2b2'); ell(g, a, b + 8, 7, 4, '#5a2a3a', .8); },
  cristal: g => { [[-.08, .05, 26, -.3], [.1, 0, 34, .15], [0, -.08, 20, .5]].forEach(([x, y, h, r]) => { const [a, b] = pt(x, y, 0); poly(g, [[a - 5, b], [a - 6, b - h * .7], [a + r * 6, b - h], [a + 6, b - h * .7], [a + 5, b]], '#a982ea', .9); ln(g, [[a - 2, b - 3], [a - 3, b - h * .6]], 'rgba(255,255,255,.6)', 1.2); }); },
};
// position des flammes animées (x, y, z en coordonnées d'art, échelle)
const FLAMES = { torche: [[0, 0, 40, 1.1]], candelabre: [[-.16, 0, 47, .55], [0, 0, 49, .55], [.16, 0, 47, .55]], fourneau: [[0, .25, 5, .8]], chaudron: [[-.08, .06, 2, .85], [.1, -.02, 2, .75]], alambic: [[-.1, .1, 7, .6]] };
// sources de lumière (rayon en cases, couleur, intensité)
const LIGHTS = { torche: [2.6, 'warm', 1], candelabre: [2.3, 'warm', .9], fourneau: [2.6, 'fire', 1.1], chaudron: [1.8, 'fire', .8], alambic: [1.4, 'green', .7], marmite: [1.2, 'violet', .6], scene: [2, 'warm', .6], cristal: [1.8, 'violet', .8], tasdor: [1.3, 'gold', .5], fioles: [1.1, 'violet', .4], orgue: [1.4, 'warm', .35], trone: [1.6, 'gold', .45] };

/* ---------- pièges ---------- */
const DDRAW = {
  porte: g => { post(g, -.36, 0, 46, PAL.stone); post(g, .36, 0, 46, PAL.stone); box(g, 0, 0, .66, .1, 42, 0, PAL.wood, 'wood'); [12, 30].forEach(z => box(g, 0, 0, .67, .11, 3, z, PAL.iron)); [-.2, 0, .2].forEach(x => ball(g, ...pt(x, .06, 21), 1.7, '#d4d8e0', .6)); box(g, 0, 0, .82, .14, 5, 46, PAL.stone, 'stone'); },
  banane: g => { const [a, b] = pt(0, 0, 1); [[-14, 4], [12, 6], [-4, -8], [6, -6]].forEach(([dx, dy]) => { g.beginPath(); g.moveTo(a, b); g.quadraticCurveTo(a + dx * .5, b + dy * .5 - 4, a + dx, b + dy); g.quadraticCurveTo(a + dx * .6, b + dy * .5 + 3, a, b); g.fillStyle = radial(g, a, b, 14, '#f2d03a'); fi(g, g.fillStyle, 1); }); ball(g, a, b - 2, 3.5, '#7a5a22'); },
  trappe: g => { poly(g, [pt(-.36, -.36, .5), pt(.36, -.36, .5), pt(.36, .36, .5), pt(-.36, .36, .5)], '#1e120c', 1); [[-.18, -.1], [.1, -.18], [0, .05], [.18, .12], [-.12, .18]].forEach(([x, y]) => { const [a, b] = pt(x, y, 0); poly(g, [[a - 3, b], [a, b - 14], [a + 3, b]], '#c9ced8', .8); }); },
  sphinx: g => { box(g, 0, 0, .5, .3, 13, 0, '#cfa75e', 'stone'); box(g, .18, .05, .14, .2, 5, 0, '#bf9750'); const [a, b] = pt(-.16, 0, 22); poly(g, [[a - 10, b + 8], [a - 8, b - 10], [a + 8, b - 10], [a + 10, b + 8]], '#33508a'); ln(g, [[a - 9, b - 2], [a + 9, b - 2]], PAL.gold, 2); ln(g, [[a - 9, b + 4], [a + 9, b + 4]], PAL.gold, 2); ball(g, a, b - 2, 7, '#e2c088'); ball(g, a - 2.5, b - 3, 1.3, INK, 0); ball(g, a + 2.5, b - 3, 1.3, INK, 0); },
  hache: g => { post(g, -.34, 0, 54); post(g, .34, 0, 54); box(g, 0, 0, .76, .06, 4, 52, PAL.wood2); const [a, b] = pt(0, 0, 52); ln(g, [[a, b], [a + 8, b + 26]], INK, 1.8); g.beginPath(); g.moveTo(a + 2, b + 22); g.quadraticCurveTo(a + 20, b + 20, a + 16, b + 38); g.lineTo(a + 6, b + 30); g.closePath(); g.fillStyle = radial(g, a + 12, b + 28, 12, '#d4d8e0'); fi(g, g.fillStyle, 1); },
  leurre: g => { FDRAW.coffreor(g); post(g, .28, .2, 28); const [a, b] = pt(.28, .2, 28); rrect(g, a - 12, b - 9, 24, 11, 2, PAL.cream, .9); g.fillStyle = INK; g.font = 'bold 7px Andika, sans-serif'; g.textAlign = 'center'; g.fillText('VRAI', a, b - 1.5); },
  cloche: g => { post(g, -.26, 0, 46); post(g, .26, 0, 46); box(g, 0, 0, .6, .06, 4, 44, PAL.wood2); const [a, b] = pt(0, 0, 44); g.beginPath(); g.moveTo(a - 9, b + 20); g.quadraticCurveTo(a - 8, b + 4, a, b + 4); g.quadraticCurveTo(a + 8, b + 4, a + 9, b + 20); g.closePath(); g.fillStyle = radial(g, a, b + 12, 11, PAL.gold); fi(g, g.fillStyle, 1); ball(g, a, b + 21, 2.4, '#9a7420'); },
};

/* ---------- décor extérieur et chantier ---------- */
const XDRAW = {
  scaffold: g => {
    [[-.4, -.4], [.4, -.4], [-.4, .4]].forEach(([x, y]) => post(g, x, y, 54, '#9a6a3a'));
    box(g, 0, 0, .9, .9, 3, 26, '#b07a44', 'wood'); box(g, 0, 0, .9, .14, 3, 50, '#b07a44');
    post(g, .4, .4, 54, '#9a6a3a');
    box(g, -.12, .15, .32, .22, 9, 0, PAL.stone, 'stone'); box(g, -.1, .14, .26, .18, 7, 9, shade(PAL.stone, .1), 'stone');
    [0, 1, 2].forEach(i => box(g, .22, -.05 + i * .02, .5, .07, 3, i * 3, '#c08850'));
    cyl(g, .2, .25, .1, 10, 0, '#7a7f8a');
  },
  tree: g => {
    box(g, 0, 0, .14, .14, 34, 0, '#6a4528'); inkLn(g, [pt(0, 0, 30), pt(.12, -.05, 40)], '#6a4528', 3);
    [[0, 70, 26, '#2f5a2a'], [-14, 58, 20, '#3a6a30'], [15, 56, 21, '#34622d'], [-6, 82, 18, '#447a36'], [8, 76, 17, '#4d8a3c'], [0, 92, 13, '#5a9a44']].forEach(([dx, z, r, c]) => ball(g, dx, -z, r, c, 1.2));
  },
  pine: g => { box(g, 0, 0, .1, .1, 16, 0, '#5a3a22'); [[0, 16, 26], [0, 38, 21], [0, 58, 15], [0, 74, 9]].forEach(([dx, z, r]) => poly(g, [[-r, -z], [r, -z], [0, -z - r * 1.5]], '#2e5a34', 1.2)); },
  rock: g => { ell(g, 0, -6, 15, 9, '#7b766e'); ell(g, 8, -4, 8, 6, '#6c675f'); },
  bush: g => { [[-8, -8, 9], [7, -9, 10], [0, -15, 9]].forEach(([x, y, r]) => ball(g, x, y, r, '#3f7232', 1)); [[-3, -14], [5, -12]].forEach(([x, y]) => ball(g, x, y, 1.8, '#e98aa6', 0)); },
  brazier: g => { [[-.12, .08], [.12, .08], [0, -.12]].forEach(([x, y]) => inkLn(g, [pt(x, y, 0), pt(x * .5, y * .5, 22)], '#4a4a52', 1.8)); cyl(g, 0, 0, .18, 8, 20, '#3a3a42', '#1e1410'); },
};
const XFLAMES = { brazier: [[0, 0, 30, 1]] };

/* ---------- icônes de l'interface ---------- */
const ICON_DRAW = {
  gold: g => { [[0, 10], [0, 4], [0, -2]].forEach(([x, y]) => ell(g, x, y, 13, 5.5, '#e9b949')); ell(g, 6, -6, 9, 9, '#f2c94f'); ln(g, [[3, -6], [9, -6]], '#a8781c', 1.6); ln(g, [[6, -9], [6, -3]], '#a8781c', 1.6); },
  mat: g => { [[-7, 4], [7, 4], [0, -6]].forEach(([x, y]) => { rrect(g, x - 9, y - 5, 18, 10, 4, '#a8683a'); ell(g, x + 8, y, 3, 5, '#e1b47a', .8); }); },
  hype: g => { g.beginPath(); g.moveTo(0, -16); g.bezierCurveTo(12, -4, 10, 8, 0, 12); g.bezierCurveTo(-10, 8, -12, -4, -4, -10); g.bezierCurveTo(-3, -4, 0, -4, 0, -16); g.fillStyle = radial(g, 0, 2, 14, '#e8622a'); fi(g, g.fillStyle, 1); g.beginPath(); g.moveTo(0, -4); g.bezierCurveTo(6, 2, 4, 9, 0, 10); g.bezierCurveTo(-4, 9, -6, 2, 0, -4); g.fillStyle = '#ffd36a'; g.fill(); },
  amb: g => { rrect(g, -6, -6, 12, 20, 3, '#f1e4c8'); ln(g, [[0, -6], [0, -10]], INK, 1.2); g.beginPath(); g.moveTo(0, -20); g.quadraticCurveTo(6, -12, 0, -9); g.quadraticCurveTo(-6, -12, 0, -20); g.fillStyle = '#ffb347'; fi(g, '#ffb347', .8); ell(g, 0, 15, 10, 3.5, '#9a6a3a'); },
  beds: g => { rrect(g, -15, -2, 30, 10, 3, '#a8683a'); rrect(g, -13, -6, 26, 7, 3, '#8fa6d8'); rrect(g, -13, -9, 9, 6, 3, '#f1e4c8'); rrect(g, -16, -12, 4, 22, 2, '#7a4a28'); },
  food: g => { g.beginPath(); g.ellipse(0, 0, 15, 5, 0, 0, Math.PI); g.lineTo(-15, 0); g.closePath(); g.fillStyle = radial(g, 0, 3, 15, '#a8683a'); fi(g, g.fillStyle, 1.2); g.beginPath(); g.ellipse(0, 0, 15, 5, 0, 0, Math.PI * 2); g.fillStyle = '#c97d3a'; fi(g, '#c97d3a', 1); ln(g, [[-4, -6], [-6, -12], [-3, -16]], 'rgba(255,255,255,.7)', 1.6); ln(g, [[4, -6], [6, -12], [3, -16]], 'rgba(255,255,255,.7)', 1.6); },
  tier: g => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 7 : 16; p.push([Math.cos(a) * r, Math.sin(a) * r + 1]); } poly(g, p, '#e9b949', 1.3); },
  night: g => { g.beginPath(); g.arc(0, 0, 14, 0, Math.PI * 2); g.arc(6, -5, 12, 0, Math.PI * 2, true); g.fillStyle = radial(g, -4, 2, 14, '#f3e3a6'); fi(g, g.fillStyle, 1.2); },
  raid: g => { poly(g, [[-16, -10], [-6, -14], [6, -10], [16, -14], [16, 12], [6, 16], [-6, 12], [-16, 16]], '#e6d2a4', 1.2); g.setLineDash([2, 2.5]); ln(g, [[-11, 8], [-4, 0], [3, 4], [9, -6]], '#a8382f', 1.6); g.setLineDash([]); ln(g, [[7, -9], [12, -4]], '#a8382f', 2.2); ln(g, [[12, -9], [7, -4]], '#a8382f', 2.2); },
  val: g => { ell(g, 0, 12, 17, 6, '#7fa24a'); rrect(g, -13, -4, 9, 16, 1.5, '#b7a690'); poly(g, [[-15, -4], [-8.5, -14], [-2, -4]], '#c8413a', 1); rrect(g, 3, -1, 10, 13, 1.5, '#c9b9a2'); poly(g, [[1, -1], [8, -11], [15, -1]], '#5a86d0', 1); ln(g, [[8, -11], [8, -18]], INK, 1.2); poly(g, [[8, -18], [15, -16], [8, -14]], '#e9b949', .8); ln(g, [[-8.5, 4], [-8.5, 8]], '#3a2a20', 2.2); ln(g, [[8, 5], [8, 9]], '#3a2a20', 2.2); },
  path: g => { [[-6, 4, -.3], [6, -6, .3]].forEach(([x, y, r]) => { g.save(); g.translate(x, y); g.rotate(r); ell(g, 0, 0, 4.5, 7.5, '#d6c3a0', 1); [-3, -1, 1, 3].forEach((dx, i) => ball(g, dx, -9 - (i % 2), 1.4, '#d6c3a0', .6)); g.restore(); }); },
  cal: g => { ball(g, 0, -2, 13, '#ece4d2'); ell(g, -5, -3, 3.5, 4, '#2a1c16', 0); ell(g, 5, -3, 3.5, 4, '#2a1c16', 0); rrect(g, -6, 8, 12, 6, 2, '#ece4d2', 1); },
  men: g => { inkLn(g, [[-12, 12], [10, -12]], '#d4d8e0', 3); inkLn(g, [[12, 12], [-10, -12]], '#d4d8e0', 3); ln(g, [[-14, 6], [-6, 14]], '#7a4a28', 3); ln(g, [[14, 6], [6, 14]], '#7a4a28', 3); },
};
/* ---------- ajouts : escaliers, mine, lac souterrain, jardin et musée des artefacts ---------- */
{
  const TAU = Math.PI * 2, Q = Math.PI / 4;
  // point d'un cercle horizontal (angle a, rayon r en cases) à la hauteur z
  const pc = (a, r, z = 0) => pt(Math.cos(a) * r, Math.sin(a) * r, z);
  // cercle dans un plan vertical parallèle à l'axe x (u = 1) ou y (u = -1) : roues
  const vcirc = (g, cx, cy, R, u, col, lw = 1) => { g.beginPath(); for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, c = Math.cos(a) * R; g[i ? 'lineTo' : 'moveTo'](cx + c * .894 * u, cy + c * .447 - Math.sin(a) * R); } g.closePath(); g.fillStyle = radial(g, cx, cy, R, col); fi(g, g.fillStyle, lw); };
  // socle de musée : base, fût, tablette
  const plinth = (g, h, col = '#8f877b', w = .34) => { box(g, 0, 0, w + .1, w + .1, 4, 0, shade(col, -.12), 'stone'); box(g, 0, 0, w, w, h - 8, 4, col, 'stone'); box(g, 0, 0, w + .07, w + .07, 4, h - 4, shade(col, .1)); };
  // coussin de velours rebondi à pompons dorés, posé à la hauteur z
  const pillow = (g, z, r = .18, col = '#a3283a', t = 5) => {
    const C = [pt(-r, r), pt(r, r), pt(r, -r), pt(-r, -r)], cp = (p, q) => [(p[0] + q[0]) * .69, (p[1] + q[1]) * .69], up = (p, zz) => [p[0], p[1] - zz], zt = z + t;
    g.beginPath(); g.moveTo(...up(C[0], zt)); g.quadraticCurveTo(...up(cp(C[0], C[1]), zt), ...up(C[1], zt)); g.quadraticCurveTo(...up(cp(C[1], C[2]), zt), ...up(C[2], zt));
    g.lineTo(...up(C[2], z + 1)); g.quadraticCurveTo(...up(cp(C[1], C[2]), z), ...up(C[1], z + 1)); g.quadraticCurveTo(...up(cp(C[0], C[1]), z), ...up(C[0], z + 1)); g.closePath(); fi(g, shade(col, -.32), 1);
    g.beginPath(); g.moveTo(...up(C[0], zt)); for (let i = 0; i < 4; i++) g.quadraticCurveTo(...up(cp(C[i], C[(i + 1) % 4]), zt), ...up(C[(i + 1) % 4], zt)); g.closePath(); g.fillStyle = radial(g, 0, -zt, r * 50, col); fi(g, g.fillStyle, 1);
    ell(g, 0, -zt - .4, 1.6, .9, shade(col, -.45), 0);
    [C[0], C[1], C[2]].forEach(p => { ln(g, [up(p, zt), up(p, zt - 2.6)], '#b8862a', 1); ball(g, p[0], p[1] - zt + 3.2, 1.5, PAL.gold, .6); });
  };
  // étincelle à quatre branches
  const spark = (g, x, y, r, col = '#fff4c4') => poly(g, [[x, y - r], [x + r * .26, y - r * .26], [x + r, y], [x + r * .26, y + r * .26], [x, y + r], [x - r * .26, y + r * .26], [x - r, y], [x - r * .26, y - r * .26]], col, .6);
  // croche
  const note = (g, x, y, s, col, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); inkLn(g, [[2.6, -.6], [2.6, -10], [6.6, -6.2]], col, 1.3); g.rotate(-.42); ell(g, 0, 0, 3.3, 2.3, col, .9); g.restore(); };
  // veine lumineuse
  const vein = (g, p, w = 2) => { ln(g, p, 'rgba(255,170,40,.5)', w * 2.6); ln(g, p, '#ffc640', w); ln(g, p, '#fff6c8', w * .4); };
  // tache d'eau sombre aux bords moussus
  const blob = (g, r, seed, z = .3, n = 14) => { const P = []; for (let i = 0; i < n; i++) P.push(pc(i / n * TAU, r * (1 + (hash(i, seed) - .5) * .2), z)); const M = i => [(P[i % n][0] + P[(i + 1) % n][0]) / 2, (P[i % n][1] + P[(i + 1) % n][1]) / 2]; g.beginPath(); g.moveTo(...M(0)); for (let i = 1; i <= n; i++) g.quadraticCurveTo(...P[i % n], ...M(i)); g.closePath(); };
  const pond = (g, r, seed) => {
    blob(g, r, seed, 0); g.fillStyle = radial(g, 0, 0, r * 45, '#557a3e'); fi(g, g.fillStyle, 1);
    blob(g, r * .84, seed, .3); const gr = g.createRadialGradient(-5, -3, 1, 0, 0, r * 40); gr.addColorStop(0, '#2f6b7a'); gr.addColorStop(1, '#122f3a'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#0c1f26'; g.lineWidth = .9; g.stroke();
    [[-.12, -.16, 7], [.18, .1, 5], [-.2, .14, 4]].forEach(([x, y, w]) => { const [a, b] = pt(x, y, .3); g.beginPath(); g.ellipse(a, b, w, w * .42, 0, .25, Math.PI - .25); g.strokeStyle = 'rgba(170,230,250,.45)'; g.lineWidth = .8; g.stroke(); });
  };

  Object.assign(FDRAW, {
    /* ----- escaliers ----- */
    colimacon: g => {
      const top = 4, Ro = .48, Ri = .39, [hx, hy] = pt(0, 0, top), rx = Ri * 45, ry = Ri * 22.5;
      cyl(g, 0, 0, Ro, top, 0, '#8d8579');
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + .15; ln(g, [pc(a, Ri + .005, top), pc(a, Ro - .01, top)], 'rgba(48,34,26,.5)', .8); }
      g.save(); g.beginPath(); g.ellipse(hx, hy, rx, ry, 0, 0, TAU); g.clip();
      let gr = g.createLinearGradient(0, hy - ry, 0, hy + ry); gr.addColorStop(0, '#5a5048'); gr.addColorStop(.5, '#231a16'); gr.addColorStop(1, '#080504');
      g.fillStyle = gr; g.fillRect(hx - rx - 2, hy - ry - 2, rx * 2 + 4, ry * 2 + 4);
      for (let d = 4; d < 22; d += 4.5) { g.beginPath(); g.ellipse(hx, hy + d, rx, ry, 0, Math.PI, TAU); g.strokeStyle = `rgba(160,140,118,${Math.max(0, .34 - d * .014)})`; g.lineWidth = .8; g.stroke(); }
      const N = 9, D = .58, h = 3.3, r0 = .065, r1 = Ri + .04, A = .95;
      const step = k => {
        const b = A - k * D, a = b - D, z = top - (k + 1) * h, col = mixc('#c2b8a6', '#140e0b', Math.min(1, k / (N - 2)));
        poly(g, [pc(a, r0, z), pc(a, r1, z), pc(a, r1, z - h), pc(a, r0, z - h)], shade(col, -.45), .6);
        const p = []; for (let i = 0; i <= 6; i++) p.push(pc(b - D * i / 6, r1, z)); p.push(pc(a, r0, z), pc(b, r0, z)); poly(g, p, col, .7);
        ln(g, [pc(a, r0 + .02, z), pc(a, r1 - .02, z)], `rgba(255,244,222,${.55 * (1 - k / N)})`, .9);
      };
      const ks = [...Array(N).keys()].reverse(), front = k => Math.sin(A - (k + .5) * D + Q) > .2;
      ks.filter(k => !front(k)).forEach(step);
      gr = g.createLinearGradient(hx - 3, 0, hx + 3, 0); gr.addColorStop(0, '#5f574f'); gr.addColorStop(.4, '#a39a8c'); gr.addColorStop(1, '#3f3833');
      g.fillStyle = gr; g.fillRect(hx - 2.9, hy, 5.8, ry * 2 + 30);
      ks.filter(front).forEach(step);
      g.restore();
      g.beginPath(); g.ellipse(hx, hy, rx, ry, 0, 0, TAU); g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke();
      const rr = (Ri + Ro) / 2, rz = top + 10, posts = [-.3, -1.12, -1.94, -2.76, -3.58];
      posts.slice().sort((p, q) => Math.sin(p + Q) - Math.sin(q + Q)).forEach(a => box(g, Math.cos(a) * rr, Math.sin(a) * rr, .035, .035, rz - top, top, PAL.wood2));
      const [cx, cy] = pt(0, 0, rz);
      g.beginPath(); g.ellipse(cx, cy, rr * 45, rr * 22.5, 0, posts[0] + Q, posts[4] + Q, true); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke(); g.strokeStyle = PAL.wood; g.lineWidth = 1.8; g.stroke();
      cyl(g, 0, 0, .062, 8, top, '#9a9184'); ball(g, ...pt(0, 0, top + 10.5), 2.8, PAL.wood);
    },
    montee: g => {
      const N = 9, D = .6, h = 6.4, r0 = .075, r1 = .41, A = 2.74, zc = 70;
      disc(g, 0, 0, 0, .46, '#80786d');
      const arc = (b, r, z) => { const p = []; for (let i = 0; i <= 6; i++) p.push(pc(b - D * i / 6, r, z)); return p; };
      const S = [...Array(N).keys()].map(k => ({ k, b: A - k * D, z: (k + 1) * h }));
      const key = s => { const m = s.b - D / 2; return Math.cos(m) + Math.sin(m); };
      const rail = [];
      const step = ({ k, b, z }) => {
        const a = b - D, m = b - D / 2, col = mixc('#c99158', '#9a6638', k / N);
        if (Math.cos(m) + Math.sin(m) > -.3) poly(g, [...arc(b, r1, z), ...arc(b, r1, z - h).reverse()], shade(col, -.32), .7);
        if (Math.cos(b) - Math.sin(b) > 0) poly(g, [pc(b, r0, z), pc(b, r1, z), pc(b, r1, z - h), pc(b, r0, z - h)], shade(col, -.42), .7);
        if (Math.sin(a) - Math.cos(a) > 0) poly(g, [pc(a, r0, z), pc(a, r1, z), pc(a, r1, z - h), pc(a, r0, z - h)], shade(col, -.5), .7);
        poly(g, [...arc(b, r1, z), pc(a, r0, z), pc(b, r0, z)], col, .8);
        ln(g, [pc(b, r0 + .02, z), pc(b, r1 - .02, z)], 'rgba(255,240,210,.45)', .8);
        box(g, Math.cos(m) * (r1 - .04), Math.sin(m) * (r1 - .04), .03, .03, 13, z, PAL.wood2);
        const pr = rail[k - 1], cur = pc(m, r1 - .04, z + 13); rail[k] = cur;
        if (pr) { ln(g, [pr, cur], INK, 3); ln(g, [pr, cur], PAL.wood, 1.5); }
      };
      const ord = S.slice().sort((p, q) => key(p) - key(q));
      ord.filter(s => key(s) < 0).forEach(step);
      cyl(g, 0, 0, r0, zc, 0, PAL.wood2);
      ord.filter(s => key(s) >= 0).forEach(step);
      // plafond et trappe ouverte, lumière de l'étage
      box(g, -.12, -.12, .5, .5, 4, zc, PAL.wood, 'wood');
      const x0 = -.31, x1 = -.08, y0 = -.31, y1 = -.08, zt = zc + 4;
      poly(g, [pt(x0, y0, zt), pt(x1, y0, zt), pt(x1, y1, zt), pt(x0, y1, zt)], '#ffcf6a', .9);
      const gr = g.createLinearGradient(...pt(x0, y0, zt), ...pt(x1, y1, zt)); gr.addColorStop(0, '#fff6cf'); gr.addColorStop(1, '#ffad42');
      path(g, [pt(x0, y0, zt), pt(x1, y0, zt), pt(x1, y1, zt), pt(x0, y1, zt)]); g.fillStyle = gr; g.fill();
      poly(g, [pt(x0, y0, zt), pt(x1, y0, zt), pt(x1, y0 - .02, zt + 19), pt(x0, y0 - .02, zt + 19)], '#9c6436', 1);
      [x0 + .07, x0 + .15].forEach(x => ln(g, [pt(x, y0, zt + 1), pt(x, y0 - .02, zt + 18)], 'rgba(45,22,8,.4)', .8));
      ln(g, [pt(x0 + .02, y0, zt + 5), pt(x1 - .02, y0, zt + 5)], '#4a4850', 1.4);
      ball(g, ...pt((x0 + x1) / 2, y0, zt + 12), 1.5, '#8a8f99', .6);
    },

    /* ----- mine ----- */
    wagonnet: g => {
      for (let i = 0; i < 5; i++) box(g, -.4 + i * .2, 0, .07, .46, 2, 0, '#6e4b2e');
      [-.13, .13].forEach(y => box(g, 0, y, .98, .035, 2.2, 2, '#8d939e'));
      const wheel = (x, y) => { const [a, b] = pt(x, y, 7); vcirc(g, a, b, 4.8, 1, '#45424a', 1); ball(g, a, b, 1.5, '#9aa0aa', .6); };
      wheel(-.15, -.17); wheel(.15, -.17);
      box(g, -.3, 0, .05, .12, 4, 9, PAL.iron);
      const bx = .22, by = .14, tx = .27, ty = .19, z0 = 8, z1 = 25, W = z => [bx + (tx - bx) * (z - z0) / (z1 - z0), by + (ty - by) * (z - z0) / (z1 - z0)];
      poly(g, [pt(-tx, -ty, z1), pt(tx, -ty, z1), pt(tx, ty, z1), pt(-tx, ty, z1)], '#4a3424', .8);
      poly(g, [pt(-bx, by, z0), pt(bx, by, z0), pt(tx, ty, z1), pt(-tx, ty, z1)], PAL.wood, 1);
      poly(g, [pt(bx, -by, z0), pt(bx, by, z0), pt(tx, ty, z1), pt(tx, -ty, z1)], shade(PAL.wood, -.28), 1);
      [13.5, 19].forEach(z => { const [w, d] = W(z); ln(g, [pt(-w, d, z), pt(w, d, z), pt(w, -d, z)], 'rgba(45,22,8,.4)', .8); });
      [[pt(-bx + .03, by, z0), pt(-tx + .03, ty, z1)], [pt(bx, by, z0), pt(tx, ty, z1)], [pt(bx, -by + .03, z0), pt(tx, -ty + .03, z1)]].forEach(p => inkLn(g, p, '#5a5e68', 1.4));
      const R = [[-.17, -.11, 3, 5], [.03, -.13, 4, 5.2], [.19, -.08, 2, 4.3], [-.2, .07, 2, 4.4], [-.05, -.01, 8, 6], [.13, .06, 4, 4.8], [-.07, .13, 2, 4.2], [.08, -.03, 11, 4.6]];
      R.sort((p, q) => p[0] + p[1] + p[2] * .02 - (q[0] + q[1] + q[2] * .02)).forEach(([x, y, dz, r], i) => { const [a, b] = pt(x, y, z1 + dz); ball(g, a, b, r, ['#8e8a85', '#76726d', '#a29e98'][i % 3], 1); });
      [[-.1, .06, 9, 2.6], [.16, .02, 8, 2.3], [.02, -.08, 14, 2.4]].forEach(([x, y, dz, r]) => { const [a, b] = pt(x, y, z1 + dz); poly(g, [[a - r, b], [a - r * .4, b - r], [a + r, b - r * .6], [a + r * .8, b + r * .5], [a - r * .2, b + r * .7]], PAL.gold, .8); ball(g, a - r * .3, b - r * .3, .8, '#fff8d8', 0); });
      inkLn(g, [pt(-tx, ty, z1), pt(tx, ty, z1), pt(tx, -ty, z1)], '#5a5e68', 1.4);
      box(g, .3, 0, .05, .12, 4, 9, PAL.iron);
      wheel(-.15, .17); wheel(.15, .17);
    },
    filon: g => {
      poly(g, [[-25, 3], [-27, -10], [-20, -26], [-8, -37], [5, -36], [15, -27], [24, -14], [25, 1], [12, 9], [-10, 9]], '#71665f', 1.2);
      poly(g, [[-20, -26], [-8, -37], [5, -36], [15, -27], [4, -21], [-9, -20]], '#8e837a', .8);
      poly(g, [[15, -27], [24, -14], [25, 1], [12, 9], [7, -6], [4, -21]], '#564d47', .8);
      ln(g, [[-9, -20], [-14, -4], [-10, 9]], 'rgba(30,20,15,.35)', .9);
      vein(g, [[-23, -12], [-15, -9], [-9, -16], [-1, -10], [6, -15], [13, -8], [21, -11]], 2);
      vein(g, [[-17, 1], [-9, 4], [-3, -2], [5, 2]], 1.6);
      vein(g, [[-6, -31], [0, -25], [8, -29]], 1.5);
      [[-9, -16, 2.8], [6, -15, 2.4], [-3, -2, 2.2], [0, -25, 2]].forEach(([x, y, r]) => { ball(g, x, y, r, '#ffcf4a', .8); ball(g, x - r * .35, y - r * .35, r * .35, '#fffbe0', 0); });
      poly(g, [[-30, 9], [-28, 1], [-20, -2], [-15, 5], [-20, 12]], '#857a72', 1);
      poly(g, [[7, 12], [10, 6], [17, 5], [20, 10], [14, 14]], '#7a6f68', 1);
      inkLn(g, [[22, 13], [4.5, -31]], '#8a5a32', 2.4);
      g.beginPath(); g.moveTo(-6, -23); g.quadraticCurveTo(4, -38, 17, -31); g.quadraticCurveTo(5, -31.5, -6, -23); g.closePath(); g.fillStyle = radial(g, 5, -31, 12, '#b9bec8'); fi(g, g.fillStyle, 1);
      rrect(g, 2.6, -32.6, 4, 4, 1, '#6f7480', .8);
    },
    etai: g => {
      [[-.34, .22, 3], [.3, .3, 2.6], [-.08, .36, 2.2], [.38, -.1, 2.4]].forEach(([x, y, r]) => { const [a, b] = pt(x, y, 0); ell(g, a, b - r * .6, r * 1.5, r, '#7d746b', .8); });
      const Wd = '#8a5a32';
      box(g, -.3, .3, .1, .1, 48, 0, Wd, 'wood'); box(g, .3, -.3, .1, .1, 48, 0, Wd, 'wood');
      poly(g, [[-16, -48], [-9, -48], [-16, -41]], shade(Wd, -.15), .8); poly(g, [[16, -48], [9, -48], [16, -41]], shade(Wd, -.3), .8);
      poly(g, [[-27, -57.5], [27, -57.5], [27, -55], [-27, -55]], shade(Wd, .25), .8);
      poly(g, [[-27, -55], [27, -55], [27, -47.5], [-27, -47.5]], Wd, 1);
      [-52.5, -50].forEach(y => ln(g, [[-25, y], [25, y + .3]], 'rgba(45,22,8,.35)', .7));
      for (let i = 0; i < 3; i++) { g.beginPath(); g.ellipse(0, -45.5 + i * 2.6, 1.2, 1.6, 0, 0, TAU); g.strokeStyle = INK; g.lineWidth = 1.6; g.stroke(); g.strokeStyle = '#9aa0aa'; g.lineWidth = .7; g.stroke(); }
      poly(g, [[-4.5, -36], [4.5, -36], [2, -39.5], [-2, -39.5]], '#4a4850', .8);
      const gr = g.createLinearGradient(0, -36, 0, -27); gr.addColorStop(0, '#fff3b8'); gr.addColorStop(1, '#ffa640'); rr(g, -4, -36, 8, 9, 1.5); g.fillStyle = gr; g.fill(); g.strokeStyle = INK; g.lineWidth = 1; g.stroke();
      [-1.4, 1.4].forEach(x => ln(g, [[x, -36], [x, -27]], '#4a4850', .8));
      rrect(g, -5, -27.5, 10, 2.2, 1, '#4a4850', .8);
    },

    /* ----- musée ----- */
    vitrine: g => {
      box(g, 0, 0, .54, .42, 13, 0, PAL.wood2, 'wood');
      box(g, 0, 0, .58, .46, 3, 13, PAL.wood);
      const x0 = -.25, x1 = .25, y0 = -.19, y1 = .19, z0 = 16, z1 = 42;
      poly(g, [pt(x0, y0, z0), pt(x1, y0, z0), pt(x1, y1, z0), pt(x0, y1, z0)], '#6a3a5e', .6);
      poly(g, [pt(x0, y0, z0), pt(x0, y1, z0), pt(x0, y1, z1), pt(x0, y0, z1)], '#43284a', .8);
      poly(g, [pt(x0, y0, z0), pt(x1, y0, z0), pt(x1, y0, z1), pt(x0, y0, z1)], '#53315a', .8);
      inkLn(g, [pt(x0, y0, z0), pt(x0, y0, z1)], '#c9962f', 1.1);
      const [a, b] = pt(0, .02, z0);
      ell(g, a, b - 1, 5, 2.1, '#c9962f', .8); rrect(g, a - 1, b - 8, 2, 7, 1, '#d9a32e', .6);
      g.beginPath(); g.moveTo(a - 6.5, b - 15); g.quadraticCurveTo(a - 6, b - 7, a, b - 7.5); g.quadraticCurveTo(a + 6, b - 7, a + 6.5, b - 15); g.closePath(); g.fillStyle = radial(g, a - 2, b - 12, 8, PAL.gold); fi(g, g.fillStyle, .9);
      ell(g, a, b - 15, 6.5, 2.2, '#f7dc86', .8); ell(g, a, b - 15, 4.8, 1.3, '#a8781c', 0);
      ball(g, a, b - 11, 1.5, '#e0405a', .5); spark(g, a + 6, b - 19, 2.8);
      const gl = p => { path(g, p); g.fillStyle = 'rgba(205,235,252,.2)'; g.fill(); };
      gl([pt(x0, y1, z0), pt(x1, y1, z0), pt(x1, y1, z1), pt(x0, y1, z1)]);
      gl([pt(x1, y0, z0), pt(x1, y1, z0), pt(x1, y1, z1), pt(x1, y0, z1)]);
      ln(g, [pt(x0 + .05, y1, z0 + 4), pt(x0 + .17, y1, z1 - 3)], 'rgba(255,255,255,.6)', 1.6);
      ln(g, [pt(x0 + .14, y1, z0 + 3), pt(x0 + .2, y1, z0 + 12)], 'rgba(255,255,255,.45)', 1);
      ln(g, [pt(x1, y1 - .05, z0 + 4), pt(x1, y1 - .15, z1 - 3)], 'rgba(255,255,255,.5)', 1.4);
      [[x0, y1], [x1, y0], [x1, y1]].forEach(([x, y]) => inkLn(g, [pt(x, y, z0), pt(x, y, z1)], '#d9a32e', 1.2));
      box(g, 0, 0, .58, .46, 4, z1, PAL.wood, 'wood'); ball(g, ...pt(0, 0, z1 + 6.5), 2.4, PAL.gold);
    },
    socle: g => {
      box(g, 0, 0, .44, .44, 5, 0, '#7f776c', 'stone');
      cyl(g, 0, 0, .15, 17, 5, '#a0978a');
      const [a, b] = pt(0, 0, 5);
      [-4.5, -1.5, 1.5, 4.5].forEach(dx => ln(g, [[a + dx, b + 1.6], [a + dx, b - 15.5]], 'rgba(60,45,35,.28)', .9));
      box(g, 0, 0, .4, .4, 4, 22, '#a39a8c', 'stone');
      ln(g, [pt(-.2, .2, 24), pt(.2, .2, 24), pt(.2, -.2, 24)], PAL.gold, 1.2);
      pillow(g, 26, .16, '#a3283a');
      const [c, d] = pt(0, 0, 31);
      poly(g, [[c - 6, d - 3], [c - 3.5, d - 6.5], [c + 3.5, d - 6.5], [c + 6, d - 3], [c, d + 4]], '#ffc83d', 1);
      poly(g, [[c - 3.5, d - 6.5], [c + 3.5, d - 6.5], [c + 2, d - 3], [c - 2, d - 3]], '#fff0a8', .6);
      ln(g, [[c - 6, d - 3], [c + 6, d - 3]], 'rgba(150,90,10,.5)', .7); ln(g, [[c - 2, d - 3], [c, d + 4], [c + 2, d - 3]], 'rgba(150,90,10,.45)', .7);
      spark(g, c + 6.5, d - 9, 3.2); spark(g, c - 7.5, d - 6, 2);
    },

    /* ----- lac souterrain ----- */
    nenuphar: g => {
      pond(g, .46, 7);
      g.save(); blob(g, .46 * .84, 7, .3); g.clip();
      [[-.14, .08, 15], [.14, -.06, 12], [.28, -.24, 13], [-.32, .22, 10]].forEach(([x, y, r]) => { const [a, b] = pt(x, y, 0), gr = g.createRadialGradient(a, b, 0, a, b, r); gr.addColorStop(0, 'rgba(150,255,210,.5)'); gr.addColorStop(1, 'rgba(150,255,210,0)'); g.fillStyle = gr; g.fillRect(a - r, b - r, r * 2, r * 2); });
      g.restore();
      [[-.14, .08, .12, .6], [.14, -.06, .1, 2.4], [.08, .22, .075, 4.1]].forEach(([x, y, r, na]) => {
        const [a, b] = pt(x, y, .6); g.beginPath(); g.moveTo(a, b); g.ellipse(a, b, r * 45, r * 22.5, 0, na + .38, na + TAU - .38); g.closePath(); g.fillStyle = radial(g, a, b, r * 45, '#4f9f48'); fi(g, g.fillStyle, .9);
        for (let i = 1; i < 6; i++) { const t = na + .38 + i / 6 * (TAU - .76); ln(g, [[a, b], [a + Math.cos(t) * r * 36, b + Math.sin(t) * r * 18]], 'rgba(30,70,30,.35)', .6); }
      });
      const flower = (x, y, s) => {
        const [a, b] = pt(x, y, 1.5);
        [...Array(8).keys()].map(i => i / 8 * TAU + .2).sort((p, q) => Math.sin(p) - Math.sin(q)).forEach(t => { g.save(); g.translate(a + Math.cos(t) * 3.4 * s, b + Math.sin(t) * 1.7 * s); g.rotate(t + Math.PI / 2); ell(g, 0, 0, 1.8 * s, 3.8 * s, '#ffd8f0', .6); g.restore(); });
        [-.7, -.25, .25, .7].forEach(t => { g.save(); g.translate(a + t * 3 * s, b - 2 * s); g.rotate(t * .7); ell(g, 0, 0, 1.6 * s, 3.4 * s, '#fff0fa', .6); g.restore(); });
        ball(g, a, b - 1.6 * s, 1.7 * s, '#f6ffa0', .6);
      };
      flower(-.14, .08, 1); flower(.14, -.06, .85);
      const shroom = ([x, y, s]) => { const [a, b] = pt(x, y, 0); rrect(g, a - 1.4 * s, b - 8 * s, 2.8 * s, 8 * s, 1.2 * s, '#d8f4ee', .7); g.beginPath(); g.ellipse(a, b - 8 * s, 5.5 * s, 4.4 * s, 0, Math.PI, 0); g.closePath(); g.fillStyle = radial(g, a, b - 10 * s, 6 * s, '#4fdcc8'); fi(g, g.fillStyle, .8); [[-2.2, -9.8], [1.8, -10.8], [.2, -8.9]].forEach(([dx, dy]) => ball(g, a + dx * s, b + dy * s, .75 * s, '#e8fff8', 0)); };
      [[.22, -.33, .75], [.3, -.24, 1], [.36, -.13, .65]].forEach(shroom);
      [[-.36, .18, .75], [-.29, .29, .55]].forEach(shroom);
    },
    barque: g => {
      pond(g, .48, 3);
      const n = 14, hw = t => .17 * Math.sqrt(Math.max(0, 1 - (t > 0 ? t * t : .62 * t * t))), X = t => .43 * t, Zg = t => 12 + 3.5 * Math.max(0, t) ** 2;
      const T = [...Array(n + 1).keys()].map(i => -1 + 2 * i / n);
      const Gn = T.map(t => pt(X(t), hw(t), Zg(t))), Gf = T.map(t => pt(X(t), -hw(t), Zg(t)));
      const Kn = T.map(t => pt(X(t) * .88, hw(t) * .42, 2.5 + 2 * Math.max(0, t) ** 2));
      const Fl = s => T.map(t => pt(X(t) * .88, s * hw(t) * .68, 5.5));
      path(g, [...Gn, ...Gf.slice().reverse()]); g.fillStyle = '#4e321e'; g.fill();
      g.save(); path(g, [...Gn, ...Gf.slice().reverse()]); g.clip();
      poly(g, [...Fl(1), ...Fl(-1).reverse()], '#9a6438', .6);
      [-.5, 0, .5].forEach(f => ln(g, T.slice(1, -1).map(t => pt(X(t) * .88, f * hw(t) * .68, 5.5)), 'rgba(45,22,8,.4)', .7));
      g.restore();
      inkLn(g, Gf, '#b07a46', 1.5);
      [-.45, .25].forEach(t => { const x = X(t), w = hw(t) * .96, z = Zg(t) - 3; poly(g, [pt(x - .035, -w, z), pt(x + .035, -w, z), pt(x + .035, w, z), pt(x - .035, w, z)], PAL.wood, .7); });
      poly(g, [...Gn, ...Kn.slice().reverse()], PAL.wood, 1.1);
      [.36, .7].forEach(f => ln(g, Gn.map((p, i) => [p[0] + (Kn[i][0] - p[0]) * f, p[1] + (Kn[i][1] - p[1]) * f]), 'rgba(45,22,8,.4)', .8));
      inkLn(g, Gn, '#c48c54', 1.8);
      const A = pt(-.2, -.06, 14), B = pt(.08, .36, 5), ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
      inkLn(g, [A, B], '#cf9a5e', 1.5);
      g.save(); g.translate(B[0] + Math.cos(ang) * 4, B[1] + Math.sin(ang) * 4); g.rotate(ang - Math.PI / 2); ell(g, 0, 0, 2.6, 5.5, '#cf9a5e', .9); g.restore();
    },

    /* ----- artefacts ----- */
    couronne: g => {
      plinth(g, 12);
      pillow(g, 12, .2, '#7d3c98');
      const [a, b] = pt(0, 0, 18.5), rx = 13.5, ry = 5.8, hb = 7, cr = '#c9c33e', cd = '#6d6a1e';
      g.save(); g.translate(a, b); g.rotate(-.13);
      g.beginPath(); g.ellipse(0, -hb, rx, ry, 0, Math.PI, TAU); g.lineTo(rx, 0); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI, true); g.closePath(); fi(g, cd, 1);
      [1.22, 1.5, 1.78].forEach(f => { const t = f * Math.PI, x = Math.cos(t) * rx, y = -hb + Math.sin(t) * ry; poly(g, [[x - 3.4, y + .5], [x, y - 8], [x + 3.4, y + .5]], shade(cr, -.3), .9); });
      g.beginPath(); g.ellipse(0, -hb, rx, ry, 0, 0, Math.PI); g.lineTo(-rx, 0); g.ellipse(0, 0, rx, ry, 0, Math.PI, 0, true); g.closePath();
      let gr = g.createLinearGradient(-rx, 0, rx, 0); gr.addColorStop(0, shade(cr, -.25)); gr.addColorStop(.3, shade(cr, .35)); gr.addColorStop(.6, cr); gr.addColorStop(1, shade(cr, -.4)); g.fillStyle = gr; fi(g, g.fillStyle, 1.1);
      ln(g, [[-6.5, -hb + ry * .82 + 1], [-5, ry * .82 - 1.5]], 'rgba(70,60,10,.6)', 1.1); ln(g, [[-5.4, -hb + ry * .82 + 1.2], [-4, ry * .82 - 1.8]], 'rgba(255,255,200,.55)', .7);
      ell(g, 0, -hb / 2 + ry * .97, 2.8, 2.1, '#d8384a', .8); ell(g, -8, -hb / 2 + ry * .72, 1.7, 1.4, '#4fbf7a', .7); ell(g, 8.5, -hb / 2 + ry * .7, 1.7, 1.4, '#4fbf7a', .7);
      [[.14, 9, .55], [.5, 11, 0], [.86, 9, 0]].forEach(([f, hgt, bend], i) => { const t = f * Math.PI, x = Math.cos(t) * rx, y = -hb + Math.sin(t) * ry; g.save(); g.translate(x, y); g.rotate(bend); poly(g, [[-3.6, .6], [0, -hgt], [3.6, .6]], cr, 1); ball(g, 0, -hgt, 1.9, i === 1 ? '#e0405a' : '#e9f0a0', .7); g.restore(); });
      g.restore();
    },
    epeefaux: g => {
      poly(g, [[-21, 4], [-23, -6], [-15, -16], [-3, -20], [10, -17], [20, -8], [21, 3], [8, 9], [-9, 9]], '#857e75', 1.2);
      poly(g, [[-15, -16], [-3, -20], [10, -17], [3, -12], [-9, -12]], '#a59d92', .8);
      poly(g, [[10, -17], [20, -8], [21, 3], [8, 9], [5, -3], [3, -12]], '#686158', .8);
      [[-13, -14, 3.5], [-18, -8, 2.6], [15, -11, 2.4]].forEach(([x, y, r]) => ell(g, x, y, r, r * .5, '#6a9a48', .7));
      ell(g, -2, -15, 4.2, 1.6, '#2a2220', 0);
      g.save(); g.translate(-2, -15); g.rotate(.07);
      poly(g, [[-2.6, 1], [-2.4, -24], [0, -26.5], [2.4, -24], [2.6, 1]], '#d6dce4', 1);
      ln(g, [[0, 0], [0, -23]], 'rgba(80,90,110,.45)', .9);
      [[-.2, -6], [.2, -14]].forEach(([x, y]) => { ball(g, x - .6, y, .9, '#56607a', 0); ln(g, [[x + .2, y], [x + .2, y - 3.4], [x + 1.4, y - 2.4]], '#56607a', .6); });
      rrect(g, -10, -29.5, 20, 3.6, 1.8, PAL.gold, 1); ball(g, -10.5, -27.7, 1.9, PAL.gold, .8); ball(g, 10.5, -27.7, 1.9, PAL.gold, .8);
      rrect(g, -1.9, -38.5, 3.8, 9.2, 1.2, '#7a3a2a', .9); [-36.5, -34, -31.5].forEach(y => ln(g, [[-1.8, y + 1], [1.8, y - .6]], 'rgba(30,10,5,.45)', .7));
      ball(g, 0, -41, 3, PAL.gold, .9);
      g.restore();
      note(g, 12, -40, .95, '#f5e3a0', .22);
      note(g, -16, -33, .8, '#b6dc6e', -.55);
      ln(g, [[-23, -42], [-21.5, -43.5], [-20, -42], [-18.5, -43.5]], '#b6dc6e', 1);
    },
    grimoire: g => {
      box(g, 0, 0, .36, .3, 4, 0, PAL.wood2, 'wood');
      box(g, 0, 0, .1, .1, 23, 4, PAL.wood, 'wood');
      box(g, 0, -.02, .16, .14, 4, 25, PAL.wood2);
      const zb = 38, zf = 29, Z = y => zb + (zf - zb) * (y + .16) / .32, c = (x, y, dz) => pt(x, y, Z(y) + dz);
      poly(g, [pt(-.26, -.16, zb), pt(.26, -.16, zb), pt(.26, .16, zf), pt(-.26, .16, zf)], '#93602f', 1);
      poly(g, [pt(-.26, .16, zf), pt(.26, .16, zf), pt(.26, .16, zf - 3), pt(-.26, .16, zf - 3)], '#6a3f22', .8);
      poly(g, [c(-.235, -.14, 1.5), c(.235, -.14, 1.5), c(.235, .145, 1.5), c(-.235, .145, 1.5)], '#6e3326', 1);
      poly(g, [c(-.215, .13, 1.5), c(.215, .13, 1.5), c(.215, .13, 6), c(-.215, .13, 6)], '#efe2c0', .7);
      [3, 4.5].forEach(dz => ln(g, [c(-.2, .13, dz), c(.2, .13, dz)], 'rgba(120,95,60,.45)', .5));
      const L = [c(-.215, -.13, 6.5), c(-.01, -.13, 5), c(-.01, .13, 5), c(-.215, .13, 6.5)], Rt = [c(.01, -.13, 5), c(.215, -.13, 6.5), c(.215, .13, 6.5), c(.01, .13, 5)];
      poly(g, L, '#f1ecd0', .7); poly(g, Rt, '#f7f3dc', .7);
      [L, Rt].forEach(p => { path(g, p); g.fillStyle = 'rgba(140,255,180,.2)'; g.fill(); });
      [-.09, -.05, -.01, .03, .07].forEach(y => { ln(g, [c(-.19, y, 6.2), c(-.04, y, 5.3)], 'rgba(80,60,50,.45)', .6); if (y < .02) ln(g, [c(.04, y, 5.3), c(.19, y, 6.2)], 'rgba(80,60,50,.45)', .6); });
      const [fa, fb] = c(.12, .07, 6); ell(g, fa, fb, 2.6, 1.6, '#5fbf5a', .6); ball(g, fa - 1.2, fb - 1.4, .8, '#5fbf5a', .4); ball(g, fa + 1.2, fb - 1.4, .8, '#5fbf5a', .4);
      const [fx, fy] = c(0, -.135, 5);
      inkLn(g, [[fx, fy + 2], [fx + .6, fy - 5]], '#cfd4dc', 1.3); rrect(g, fx - 3, fy - 7.4, 6.6, 2.6, 1.2, '#cfd4dc', .7);
      [-2.2, -.7, .8, 2.3].forEach(dx => { ln(g, [[fx + .3 + dx, fy - 6.5], [fx + .5 + dx * 1.05, fy - 12]], INK, 1.9); ln(g, [[fx + .3 + dx, fy - 6.5], [fx + .5 + dx * 1.05, fy - 12]], '#e4e8ee', .9); });
      ln(g, [[fx - 9, fy - 3], [fx - 11, fy - 8], [fx - 8.5, fy - 12]], '#9dffc0', 1); spark(g, fx + 9, fy - 9, 2.6, '#c6ffd8'); spark(g, fx - 6, fy - 14, 1.8, '#c6ffd8'); ball(g, fx + 5, fy - 15, 1, '#9dffc0', 0);
    },
    oeufbasilic: g => {
      plinth(g, 10, '#8f877b', .32);
      const [a, b] = pt(0, 0, 10);
      ell(g, a, b - 4, 16, 7.5, '#b68a3e', 1.1);
      ell(g, a, b - 8, 10.5, 4.2, '#5e4220', .8);
      ell(g, a, b - 13, 9, 12, '#7fbf55', 1.2);
      [[-4, -18, 1.6], [3, -21, 1.2], [5, -12, 1.8], [-2, -8, 1.3], [-6, -12, 1], [1, -15, .9], [-1, -23, .8]].forEach(([dx, dy, r]) => ell(g, a + dx, b + dy, r, r * .75, '#3e7a32', 0));
      ell(g, a - 3.5, b - 18, 2.2, 3.6, 'rgba(255,255,255,.4)', 0);
      ln(g, [[a + 1.5, b - 24.5], [a + 4, b - 21.5], [a + 2.5, b - 19], [a + 5.5, b - 16.5]], INK, 1);
      ell(g, a + 4.6, b - 20.6, 1.4, .9, '#ffd84a', .4); ln(g, [[a + 4.6, b - 21.3], [a + 4.6, b - 19.9]], INK, .5);
      g.beginPath(); g.ellipse(a, b - 4, 16, 7.5, 0, 0, Math.PI); g.ellipse(a, b - 8, 10.5, 4.2, 0, Math.PI, 0, true); g.closePath(); g.fillStyle = radial(g, a, b, 16, '#c99a48'); fi(g, g.fillStyle, 1);
      for (let i = 0; i < 22; i++) { const t = .06 + i / 22 * .88, an = t * Math.PI, rr2 = .8 + hash(i, 4) * .2, x = a + Math.cos(an) * 13.2 * rr2, y = b - 4.5 + Math.sin(an) * 5.6 * rr2, d = (hash(4, i) - .5) * 1.4; ln(g, [[x - 2.4, y - d], [x + 2.4, y + d]], i % 3 ? '#e3c46e' : '#7a5228', .9); }
    },
    miroir: g => {
      const [a, b] = pt(0, 0, 0), go = '#d9a32e';
      [-13, 13].forEach(dx => { ell(g, a + dx, b + .5, 5.5, 2.2, '#b8862a', .9); inkLn(g, [[a + dx, b], [a + dx, b - 33]], go, 2.6); ball(g, a + dx, b - 35, 2.4, PAL.gold, .8); });
      inkLn(g, [[a - 13, b - 4], [a + 13, b - 4]], go, 1.6);
      ell(g, a, b - 28, 11.5, 16.5, PAL.gold, 1.2);
      [[-11.5, 0], [11.5, 0]].forEach(([dx]) => ball(g, a + dx, b - 28, 1.8, '#b8862a', .7));
      [0, 1, 2, 3, 4, 5, 6, 7].forEach(i => { const t = i / 8 * TAU + .39; ball(g, a + Math.cos(t) * 10.2, b - 28 + Math.sin(t) * 15.1, .9, '#fff0b0', 0); });
      g.beginPath(); g.ellipse(a, b - 28, 8.6, 13.4, 0, 0, TAU); let gr = g.createLinearGradient(a - 8, b - 41, a + 8, b - 15); gr.addColorStop(0, '#eef4fb'); gr.addColorStop(.5, '#aebfd4'); gr.addColorStop(1, '#7d8fa8'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#7a5a1a'; g.lineWidth = 1; g.stroke();
      g.save(); g.beginPath(); g.ellipse(a, b - 28, 8.6, 13.4, 0, 0, TAU); g.clip();
      ln(g, [[a - 5.5, b - 30.5], [a - 2, b - 31.5]], 'rgba(55,35,90,.55)', 1.2); ln(g, [[a + 2, b - 31.5], [a + 5.5, b - 30.5]], 'rgba(55,35,90,.55)', 1.2);
      ln(g, [[a + 1.5, b - 34.5], [a + 5.5, b - 35.5]], 'rgba(55,35,90,.4)', .9);
      g.beginPath(); g.moveTo(a - 4.5, b - 24.5); g.quadraticCurveTo(a, b - 21, a + 5.5, b - 26); g.strokeStyle = 'rgba(55,35,90,.55)'; g.lineWidth = 1.2; g.lineCap = 'round'; g.stroke();
      ln(g, [[a - 9, b - 30], [a + 2, b - 44]], 'rgba(255,255,255,.75)', 2); ln(g, [[a - 9, b - 22], [a + 7, b - 42]], 'rgba(255,255,255,.4)', 1.2);
      g.restore();
      poly(g, [[a - 6, b - 43], [a - 2, b - 49], [a, b - 47], [a + 2, b - 49], [a + 6, b - 43], [a, b - 44.5]], PAL.gold, .9); ball(g, a, b - 49.5, 1.9, '#e0405a', .6);
      poly(g, [[a - 3, b - 12], [a + 3, b - 12], [a, b - 8]], PAL.gold, .8);
    },
    cranecristal: g => {
      box(g, 0, 0, .4, .4, 4, 0, '#2c2832');
      box(g, 0, 0, .32, .32, 11, 4, '#1e1b23', 'stone');
      box(g, 0, 0, .38, .38, 3, 15, '#2c2832');
      ln(g, [pt(-.19, .19, 16.5), pt(.19, .19, 16.5), pt(.19, -.19, 16.5)], PAL.gold, 1);
      const [a, b] = pt(0, 0, 18);
      ball(g, a, b - 16, 11, '#b99cf2', 1.1);
      ell(g, a - 4.2, b - 15, 3.4, 3.9, '#4c2c8c', .7); ell(g, a + 4.2, b - 15, 3.4, 3.9, '#4c2c8c', .7);
      ball(g, a - 4.2, b - 15, 1.4, '#ffd6ff', 0); ball(g, a + 4.2, b - 15, 1.4, '#ffd6ff', 0);
      poly(g, [[a - 1.6, b - 9.5], [a + 1.6, b - 9.5], [a, b - 12]], '#5c3a9c', .5);
      rrect(g, a - 5.5, b - 8, 11, 6, 2.4, '#c6aef6', .9);
      [-2.75, 0, 2.75].forEach(dx => ln(g, [[a + dx, b - 7.5], [a + dx, b - 2.5]], 'rgba(70,40,130,.6)', .7));
      ln(g, [[a - 8, b - 21], [a - 2, b - 25], [a + 5, b - 23]], 'rgba(255,255,255,.55)', .8); ln(g, [[a - 2, b - 25], [a - 1, b - 20], [a + 6, b - 19]], 'rgba(255,255,255,.3)', .7); ln(g, [[a + 9.5, b - 17], [a + 6, b - 19]], 'rgba(255,255,255,.3)', .7);
      ell(g, a - 5, b - 22, 2.4, 1.5, 'rgba(255,255,255,.7)', 0);
      spark(g, a + 10, b - 25, 3, '#f0e2ff');
    },
    heaume: g => {
      box(g, 0, 0, .36, .36, 4, 0, PAL.wood2, 'wood');
      box(g, 0, 0, .09, .09, 18, 4, PAL.wood, 'wood');
      const [a, b] = pt(0, 0, 21);
      g.beginPath(); g.moveTo(a - 12.5, b + 1); g.lineTo(a - 13.5, b - 14); g.quadraticCurveTo(a - 13.5, b - 22, a - 10, b - 25); g.quadraticCurveTo(a - 7.5, b - 22.5, a - 5, b - 28); g.quadraticCurveTo(a + 1, b - 32, a + 7, b - 30); g.quadraticCurveTo(a + 13.5, b - 26, a + 13.5, b - 14); g.lineTo(a + 12.5, b + 1); g.quadraticCurveTo(a, b + 5, a - 12.5, b + 1); g.closePath();
      g.fillStyle = radial(g, a - 4, b - 18, 19, '#bcc4cf'); fi(g, g.fillStyle, 1.2);
      ln(g, [[a + 1, b - 30], [a + .5, b - 17]], 'rgba(255,255,255,.4)', 1.4);
      rrect(g, a - 10.5, b - 16.5, 21, 3.6, 1.6, '#1a1820', .8);
      rrect(g, a - 1.6, b - 13, 3.2, 13.5, 1, '#9aa2ae', .8);
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) ball(g, a + 4.5 + i * 2.6, b - 8 + j * 3, .75, '#1a1820', 0);
      ell(g, a + 7, b - 22, 3.2, 2.4, 'rgba(60,66,80,.45)', 0); g.beginPath(); g.ellipse(a + 7, b - 22, 3.2, 2.4, 0, .2, 2.4); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = .8; g.stroke();
      [[-9, -6], [-9, -2]].forEach(([dx, dy]) => ball(g, a + dx, b + dy, .8, '#e8ecf2', .4));
      rrect(g, a - 2.5, b - 32.5, 5, 4, 1, '#8a8f99', .8);
      g.beginPath(); g.moveTo(a - 2, b - 31); g.bezierCurveTo(a - 6, b - 41, a - 2, b - 50, a + 6, b - 48); g.bezierCurveTo(a + 14, b - 47, a + 18, b - 40, a + 16, b - 33); g.bezierCurveTo(a + 13, b - 38, a + 9, b - 42, a + 5, b - 42); g.bezierCurveTo(a + 1, b - 42, a + 1, b - 37, a + 2, b - 31); g.closePath(); g.fillStyle = radial(g, a + 3, b - 43, 12, '#d0453a'); fi(g, g.fillStyle, 1);
      ln(g, [[a - 1, b - 34], [a + 1, b - 44], [a + 9, b - 45], [a + 14.5, b - 37]], 'rgba(255,205,195,.55)', .9);
    },
    potdechambre: g => {
      plinth(g, 10, '#8f877b', .34);
      pillow(g, 10, .19, '#3f5aa8');
      const [a, b] = pt(0, 0, 15.5);
      g.beginPath(); g.moveTo(a + 9.5, b - 12); g.bezierCurveTo(a + 19, b - 14, a + 19, b - 3, a + 8.5, b - 5); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 4.2; g.stroke(); g.strokeStyle = PAL.gold; g.lineWidth = 2.2; g.stroke();
      g.beginPath(); g.moveTo(a - 11, b - 13); g.bezierCurveTo(a - 12, b - 4, a - 8, b, a, b); g.bezierCurveTo(a + 8, b, a + 12, b - 4, a + 11, b - 13); g.ellipse(a, b - 13, 11, 4.4, 0, 0, Math.PI); g.closePath(); g.fillStyle = radial(g, a - 3, b - 9, 13, PAL.gold); fi(g, g.fillStyle, 1.1);
      ell(g, a, b - 13, 11.8, 4.9, '#f3cf62', 1.1); ell(g, a, b - 13.3, 9.4, 3.5, '#8a6418', .7);
      ln(g, [[a - 6.5, b - 8], [a - 7.5, b - 3.5]], 'rgba(255,250,220,.6)', 1.4);
      g.beginPath(); g.ellipse(a, b - 26, 9.5, 3, 0, 0, TAU); g.strokeStyle = INK; g.lineWidth = 3.6; g.stroke(); g.strokeStyle = '#ffe27a'; g.lineWidth = 2; g.stroke();
      g.beginPath(); g.ellipse(a, b - 26, 9.5, 3, 0, Math.PI * 1.1, Math.PI * 1.6); g.strokeStyle = '#fffbe6'; g.lineWidth = .8; g.stroke();
      spark(g, a - 14, b - 20, 3.4); spark(g, a + 14.5, b - 28, 3); spark(g, a + 4, b - 34, 2.4); spark(g, a - 7, b - 33, 1.8);
    },
    dentdragon: g => {
      plinth(g, 14, '#7f776c', .36);
      const [p, q] = pt(.03, .23, 7); rrect(g, p - 4, q - 2.5, 8, 4.4, 1, PAL.gold, .7);
      const [a, b] = pt(0, 0, 14);
      ell(g, a, b - 1.5, 9.5, 4, '#a8743a', 1);
      g.beginPath(); g.moveTo(a - 8, b - 3); g.bezierCurveTo(a - 12, b - 18, a - 8, b - 34, a + 6, b - 46); g.bezierCurveTo(a + 1, b - 33, a + 7, b - 18, a + 8, b - 3); g.closePath(); g.fillStyle = radial(g, a - 4, b - 22, 24, '#f2e9d2'); fi(g, g.fillStyle, 1.2);
      ln(g, [[a - 6, b - 9], [a - 7.5, b - 22], [a - 3, b - 35]], 'rgba(255,255,255,.65)', 1.3);
      ln(g, [[a + 3.5, b - 13], [a + 1.5, b - 18], [a + 3.5, b - 21]], 'rgba(120,95,60,.55)', .8);
      g.beginPath(); g.moveTo(a + 8.6, b - 9); g.ellipse(a, b - 9, 8.6, 3.2, 0, 0, Math.PI); g.lineTo(a - 8.8, b - 4); g.ellipse(a, b - 4, 8.8, 3.2, 0, Math.PI, 0, true); g.closePath(); g.fillStyle = radial(g, a - 3, b - 7, 10, '#c08440'); fi(g, g.fillStyle, 1);
      [-5, 0, 5].forEach(dx => ball(g, a + dx, b - 6.5 + (dx ? 2.4 : 3.2) - (dx ? .6 : 0), .9, '#f0c070', .4));
    },
    baton: g => {
      cyl(g, 0, 0, .17, 4, 0, '#b8863c');
      box(g, -.09, -.09, .035, .035, 20, 4, '#b8863c');
      const [ra, rb] = pt(0, 0, 22);
      g.beginPath(); g.ellipse(ra, rb, 4.6, 2.3, 0, Math.PI, TAU); g.strokeStyle = INK; g.lineWidth = 2.8; g.stroke(); g.strokeStyle = '#d9a84a'; g.lineWidth = 1.4; g.stroke();
      const [s0, t0] = pt(0, 0, 4);
      inkLn(g, [[s0 + 1, t0], [s0 - 1.2, t0 - 14], [s0 + 1.4, t0 - 28], [s0 - 1, t0 - 42], [s0 + 1.2, t0 - 54], [s0, t0 - 60]], '#6e4528', 3.2);
      [[1, 12, 1], [-1.2, 26, -1], [1.1, 40, 1], [-.8, 50, -1]].forEach(([dx, dy, sd]) => ball(g, s0 + dx + sd * 1.7, t0 - dy, 1.5, '#5a3820', .7));
      ln(g, [[s0 + 1, t0 - 33], [s0 + 6, t0 - 29]], INK, .7); rrect(g, s0 + 5, t0 - 30.5, 7, 5, 1, '#f1e4c8', .8); ln(g, [[s0 + 6.5, t0 - 28.5], [s0 + 10.5, t0 - 28.5]], 'rgba(60,40,30,.6)', .6); ln(g, [[s0 + 6.5, t0 - 27], [s0 + 9.5, t0 - 27]], 'rgba(60,40,30,.6)', .6);
      [[-1, [[s0 - 1, t0 - 59], [s0 - 6, t0 - 64], [s0 - 5, t0 - 71]]], [1, [[s0 + 1, t0 - 59], [s0 + 6, t0 - 65], [s0 + 4.5, t0 - 72]]]].forEach(([, p]) => inkLn(g, p, '#6e4528', 1.8));
      ball(g, s0, t0 - 66, 6.2, '#9b6bf2', 1.1); ball(g, s0 - 2, t0 - 68.5, 1.8, '#f3eaff', 0); ell(g, s0 + 1.5, t0 - 64, 2.6, 1.2, 'rgba(225,200,255,.5)', 0);
      inkLn(g, [[s0, t0 - 60], [s0 + 1.5, t0 - 63]], '#6e4528', 1.6);
      spark(g, s0 + 9, t0 - 72, 2.6, '#e8dcff'); spark(g, s0 - 9, t0 - 62, 2, '#e8dcff'); spark(g, s0 + 7, t0 - 58, 1.4, '#e8dcff');
      g.beginPath(); g.ellipse(ra, rb, 4.6, 2.3, 0, 0, Math.PI); g.strokeStyle = INK; g.lineWidth = 2.8; g.stroke(); g.strokeStyle = '#d9a84a'; g.lineWidth = 1.4; g.stroke();
    },
    harpe: g => {
      cyl(g, 0, 0, .19, 6, 0, '#7a4a28');
      const [a, b] = pt(0, 0, 6);
      const B = (p0, p1, p2, p3, t) => { const u = 1 - t; return [0, 1].map(k => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]); };
      const N0 = [a - 11, b - 43], N1 = [a - 2, b - 52], N2 = [a + 4, b - 30], N3 = [a + 14, b - 34], S0 = [a - 9, b - 1], S1 = [a + 14, b - 33];
      for (let i = 1; i <= 7; i++) { const [x, y] = B(N0, N1, N2, N3, i / 8.3), yb = S0[1] + (x - S0[0]) * (S1[1] - S0[1]) / (S1[0] - S0[0]); ln(g, [[x, y + 1], [x, yb - 1]], '#fff2b0', 1); }
      poly(g, [[a - 12, b], [a - 4, b - 1], [a + 16, b - 32], [a + 12, b - 35]], '#d39a2c', 1.1);
      [[a + 1, b - 9], [a + 7, b - 18]].forEach(([x, y]) => ell(g, x, y, 1.3, .9, '#6a4410', 0));
      inkLn(g, [[a - 11, b], [a - 12.5, b - 20], [a - 11, b - 43]], PAL.gold, 2.8);
      g.beginPath(); g.moveTo(...N0); g.bezierCurveTo(...N1, ...N2, ...N3); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 5; g.stroke(); g.strokeStyle = PAL.gold; g.lineWidth = 3; g.stroke(); g.strokeStyle = 'rgba(255,250,220,.5)'; g.lineWidth = 1; g.stroke();
      ball(g, a - 11, b - 44, 2.6, PAL.gold, .8); ball(g, a + 14.5, b - 34, 2.2, PAL.gold, .8); ell(g, a - 8, b, 6, 2.4, '#c9962f', .9);
      spark(g, a + 2, b - 27, 2.4); spark(g, a - 4, b - 17, 1.8); note(g, a + 18, b - 44, .7, '#fff0a0', .2);
    },
    sablier: g => {
      box(g, 0, 0, .34, .34, 6, 0, '#5e3d26', 'wood');
      const [a, b] = pt(0, 0, 6), gd = '#d9a32e';
      const plate = y => { g.beginPath(); g.moveTo(a - 12, y); g.lineTo(a - 12, y + 3); g.ellipse(a, y + 3, 12, 4.6, 0, Math.PI, 0, true); g.lineTo(a + 12, y); g.closePath(); g.fillStyle = radial(g, a - 4, y + 3, 14, shade(gd, -.15)); fi(g, g.fillStyle, 1); ell(g, a, y, 12, 4.6, shade(gd, .12), 1); };
      plate(b - 4);
      inkLn(g, [[a, b - 6], [a, b - 41]], gd, 1.6);
      const bulb = () => { g.beginPath(); g.moveTo(a - 8, b - 40); g.bezierCurveTo(a - 11, b - 33, a - 3, b - 26, a - 1.4, b - 22.5); g.bezierCurveTo(a - 3, b - 19, a - 11, b - 12, a - 8, b - 5); g.lineTo(a + 8, b - 5); g.bezierCurveTo(a + 11, b - 12, a + 3, b - 19, a + 1.4, b - 22.5); g.bezierCurveTo(a + 3, b - 26, a + 11, b - 33, a + 8, b - 40); g.closePath(); };
      bulb(); let gr = g.createLinearGradient(a - 9, 0, a + 9, 0); gr.addColorStop(0, '#f2f9fd'); gr.addColorStop(.5, '#d4e8f4'); gr.addColorStop(1, '#a9c4d8'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#5a7088'; g.lineWidth = .9; g.stroke();
      g.save(); bulb(); g.clip();
      g.beginPath(); g.moveTo(a - 11, b - 41); g.lineTo(a + 11, b - 41); g.lineTo(a + 11, b - 32); g.quadraticCurveTo(a + 4, b - 31, a, b - 25.5); g.quadraticCurveTo(a - 4, b - 31, a - 11, b - 32); g.closePath(); g.fillStyle = radial(g, a - 3, b - 36, 10, '#e8c46a'); fi(g, g.fillStyle, .7);
      g.beginPath(); g.moveTo(a - 11, b - 4); g.lineTo(a - 11, b - 7); g.quadraticCurveTo(a, b - 9.5, a + 11, b - 7); g.lineTo(a + 11, b - 4); g.closePath(); fi(g, '#e0b85a', .7);
      ln(g, [[a, b - 8.5], [a, b - 26]], '#d9a84a', 1.1);
      [[1.6, -13, .6], [-1.4, -16.5, .5], [1.2, -19.5, .45], [-2.2, -11, .5], [2.4, -29, .55], [-2.6, -27.5, .5]].forEach(([dx, dy, r]) => ball(g, a + dx, b + dy, r, '#c8962e', 0));
      g.restore();
      ln(g, [[a - 6, b - 37], [a - 7.5, b - 31]], 'rgba(255,255,255,.85)', 1.2); ln(g, [[a - 6.8, b - 14.5], [a - 7.2, b - 9]], 'rgba(255,255,255,.75)', 1);
      [-11, 11].forEach(dx => { inkLn(g, [[a + dx, b - 5], [a + dx, b - 40]], gd, 1.8); ball(g, a + dx, b - 22.5, 2, PAL.gold, .7); });
      plate(b - 44);
      ball(g, a, b - 47.5, 2.4, PAL.gold, .8);
    },

    /* ----- jardin et volière ----- */
    ruche: g => {
      [[-.15, -.15], [.15, -.15], [-.15, .15], [.15, .15]].forEach(([x, y]) => box(g, x, y, .045, .045, 13, 0, PAL.wood2));
      box(g, 0, 0, .44, .44, 3, 13, PAL.wood, 'wood');
      const [a, b] = pt(0, 0, 16);
      const dome = () => { g.beginPath(); g.moveTo(a - 15, b); g.bezierCurveTo(a - 16, b - 17, a - 9, b - 28, a, b - 28); g.bezierCurveTo(a + 9, b - 28, a + 16, b - 17, a + 15, b); g.ellipse(a, b, 15, 6, 0, 0, Math.PI); g.closePath(); };
      dome(); g.fillStyle = radial(g, a - 4, b - 16, 22, '#e2b85a'); fi(g, g.fillStyle, 1.2);
      g.save(); dome(); g.clip();
      for (let i = 1; i <= 6; i++) { const y = b - i * 4.2 + 2, w = 15.8 * Math.sqrt(Math.max(0, 1 - Math.pow((i * 4.2 - 2) / 28.5, 2.4))); g.beginPath(); g.ellipse(a, y, w, w * .4, 0, .06, Math.PI - .06); g.strokeStyle = 'rgba(120,78,20,.6)'; g.lineWidth = 1.1; g.stroke(); }
      g.restore();
      g.beginPath(); g.moveTo(a - 3.5, b + 5.7); g.lineTo(a - 3.5, b + 2.4); g.arc(a, b + 2.4, 3.5, Math.PI, 0); g.lineTo(a + 3.5, b + 5.7); g.closePath(); fi(g, '#2a1a0c', .8);
      ell(g, a, b - 28.5, 3, 1.6, '#c99a48', .8);
      const bee = (x, y, d = 1) => { ell(g, x - 1.2 * d, y - 2.6, 1.8, 2.4, '#eef6ff', .6); ell(g, x + .4 * d, y - 2.8, 1.5, 2.2, '#eef6ff', .6); ell(g, x, y, 3, 2.2, '#f2c230', .8); ln(g, [[x - .8, y - 1.8], [x - .8, y + 1.8]], INK, .9); ln(g, [[x + 1, y - 1.8], [x + 1, y + 1.8]], INK, .9); ball(g, x + 3.2 * d, y - .2, 1.2, INK, 0); };
      bee(a + 18, b - 30); bee(a - 19, b - 18, -1); bee(a + 8, b - 41);
    },
    tonnelle: g => {
      const Wd = '#9a6a3a', H = 46, lv = ['#3f7a35', '#4f8f3f', '#5fa64e', '#6db85a'];
      const leaf = (x, y, r, i) => ball(g, x, y, r, lv[i % 4], .9);
      const vine = (x, y) => { const [a, b] = pt(x, y, 0); ln(g, [[a, b - 2], [a - 2, b - 12], [a + 2, b - 22], [a - 1.5, b - 32], [a + 1.5, b - 42]], '#3f6a2a', 1.4); [[-2.5, 8], [2.5, 17], [-2.5, 27], [2.5, 37]].forEach(([dx, dy], i) => leaf(a + dx, b - dy, 2.6, i)); };
      post(g, -.32, -.32, H, Wd); post(g, -.32, .32, H, Wd); post(g, .32, -.32, H, Wd);
      box(g, 0, -.32, .78, .07, 4, H, Wd, 'wood');
      post(g, .32, .32, H, Wd);
      box(g, 0, .32, .78, .07, 4, H, Wd, 'wood');
      [-.27, -.09, .09, .27].forEach(x => box(g, x, 0, .05, .8, 3, H + 4, shade(Wd, .12)));
      const F = []; for (let i = 0; i < 26; i++) { const x = -.34 + hash(i, 11) * .68, y = -.34 + hash(11, i) * .68; F.push([x, y, H + 8 + hash(i, 5) * 5, 4 + hash(5, i) * 2.6, i]); }
      F.sort((p, q) => p[0] + p[1] - q[0] - q[1]).forEach(([x, y, z, r, i]) => { const [a, b] = pt(x, y, z); leaf(a, b, r, i); });
      [[-.2, -.1], [.1, -.22], [.05, .12], [-.25, .2], [.25, .05]].forEach(([x, y], i) => { const [a, b] = pt(x, y, H + 14); ball(g, a, b, 1.7, i % 2 ? '#e88ac0' : '#c77ae0', .6); ball(g, a, b, .6, '#fff2a0', 0); });
      vine(-.32, .32); vine(.32, .32);
      [[-.12, .34], [.16, .34]].forEach(([x, y]) => { const [a, b] = pt(x, y, H); ln(g, [[a, b], [a, b + 3]], '#3f6a2a', 1); [[0, 4.5], [-1.6, 6.8], [1.6, 6.8], [-.8, 9.1], [.8, 9.1], [0, 11.3]].forEach(([dx, dy]) => ball(g, a + dx, b + dy, 1.5, '#7a4ab0', .6)); leaf(a + 2.5, b + 2.5, 2.2, 1); });
    },
    fontaine: g => {
      cyl(g, 0, 0, .4, 11, 0, '#9a9286');
      disc(g, 0, 0, 9.6, .33, '#3f8fd0');
      const [w0, w1] = pt(0, 0, 9.6);
      [[9, 4], [13, 5.8]].forEach(([rx, ry]) => { g.beginPath(); g.ellipse(w0, w1, rx, ry, 0, 0, TAU); g.strokeStyle = 'rgba(220,245,255,.45)'; g.lineWidth = .8; g.stroke(); });
      cyl(g, 0, 0, .07, 14, 9.6, '#8f877b');
      cyl(g, 0, 0, .15, 3.5, 23, '#a39a8c');
      disc(g, 0, 0, 26.3, .12, '#5fb0e6');
      const [a, b] = pt(0, 0, 28.5);
      [[-1], [1]].forEach(([s]) => { const [ex, ey] = pc(s > 0 ? -.75 : 2.35, .24, 9.6); inkLn(g, [[a, b - 1], [a + s * 5, b - 7], [(a + ex) / 2 + s * 4, b - 3], [ex, ey]], '#bfe8ff', 1.3); ell(g, ex, ey, 2.6, 1.1, '#e8f8ff', .5); });
      const [fx, fy] = pc(.8, .24, 9.6); inkLn(g, [[a, b - 1], [a + .5, b - 6], [fx + 1, (b + fy) / 2 - 3], [fx, fy]], '#bfe8ff', 1.3); ell(g, fx, fy, 2.6, 1.1, '#e8f8ff', .5);
      ball(g, a, b - .5, 2.2, '#a39a8c', .8); ball(g, a - .6, b - 1.2, .7, '#e8f8ff', 0);
    },
    nid: g => {
      const [a, b] = pt(0, 0, 0);
      ell(g, a, b - 5, 23, 11.5, '#8a6034', 1.2);
      g.save(); g.beginPath(); g.ellipse(a, b - 5, 23, 11.5, 0, 0, TAU); g.clip();
      for (let i = 0; i < 70; i++) { const t = hash(i, 9) * TAU, r = .55 + hash(9, i) * .45, x = a + Math.cos(t) * 22 * r, y = b - 5 + Math.sin(t) * 11 * r, d = t + Math.PI / 2 + (hash(i, 2) - .5) * 1.2, l = 3 + hash(2, i) * 3; ln(g, [[x - Math.cos(d) * l, y - Math.sin(d) * l * .5], [x + Math.cos(d) * l, y + Math.sin(d) * l * .5]], ['#d9b45a', '#6a4424', '#a87a3a', '#e8cc7a'][i % 4], .9); }
      g.restore();
      ell(g, a, b - 9, 15.5, 6.6, '#5a3a1e', .9);
      [[-6, -9, 2.6], [3, -8, 2.2], [9, -10.5, 1.8], [-1, -11.5, 1.6]].forEach(([dx, dy, r]) => ball(g, a + dx, b + dy, r, '#f3ead8', .6));
      [[-24, -4, -1.2], [23, -6, 1.1], [-8, 6, -1.9], [14, 4, 1.8]].forEach(([dx, dy, t]) => ln(g, [[a + dx - Math.cos(t) * 4, b + dy - Math.sin(t) * 2], [a + dx + Math.cos(t) * 3, b + dy + Math.sin(t) * 1.5]], '#6a4424', 1.2));
      const feather = (x, y, rot, col) => { g.save(); g.translate(x, y); g.rotate(rot); ell(g, 0, -7, 2.8, 7.5, col, .8); ln(g, [[0, 1], [0, -13]], shade(col, -.45), .7); g.restore(); };
      feather(a - 14, b - 9, -.9, '#f6f0e4'); feather(a + 15, b - 11, .8, '#7a8ad8'); feather(a + 4, b - 14, .2, '#e890b0');
    },
    mangeoire: g => {
      box(g, 0, 0, .36, .07, 3, 0, PAL.wood2); box(g, 0, 0, .07, .36, 3, 0, PAL.wood2);
      [[-.05, .2], [.12, .15], [.18, -.04], [-.16, .1]].forEach(([x, y], i) => { const [p, q] = pt(x, y, 0); ball(g, p, q, 1, i % 2 ? '#d9b36a' : '#6a4a2a', .4); });
      box(g, 0, 0, .07, .07, 30, 3, PAL.wood, 'wood');
      box(g, 0, 0, .38, .32, 3, 33, PAL.wood2, 'wood');
      const zt = 36;
      [[-.16, -.13], [.16, -.13], [-.16, .13]].forEach(([x, y]) => box(g, x, y, .03, .03, 10, zt, PAL.wood2));
      const S = []; for (let i = 0; i < 26; i++) S.push([-.13 + hash(i, 3) * .26, -.1 + hash(3, i) * .2, i]);
      S.sort((p, q) => p[0] + p[1] - q[0] - q[1]).forEach(([x, y, i]) => { const r = Math.hypot(x / .14, y / .11), [p, q] = pt(x, y, zt + 3.2 * Math.max(0, 1 - r * r)); ball(g, p, q, 1.3, ['#d9b36a', '#8a5a2a', '#efd890', '#3a2a20'][i % 4], .5); });
      box(g, .16, .13, .03, .03, 10, zt, PAL.wood2);
      const zr = 46, zk = 55, ex = .23, ey = .21;
      poly(g, [pt(-ex, -ey, zr), pt(ex, -ey, zr), pt(ex, 0, zk), pt(-ex, 0, zk)], '#9a4a34', 1);
      poly(g, [pt(ex, -ey, zr), pt(ex, ey, zr), pt(ex, 0, zk)], '#8a6a4a', 1);
      poly(g, [pt(-ex, ey, zr), pt(ex, ey, zr), pt(ex, 0, zk), pt(-ex, 0, zk)], '#c0603f', 1);
      [.33, .66].forEach(f => ln(g, [pt(-ex, ey * (1 - f), zr + (zk - zr) * f), pt(ex, ey * (1 - f), zr + (zk - zr) * f)], 'rgba(70,25,15,.4)', .8));
    },
    girouette: g => {
      box(g, 0, 0, .28, .28, 6, 0, PAL.stone, 'stone');
      const [a, b] = pt(0, 0, 6), zc = 62;
      inkLn(g, [[a, b], [a, b - 74]], '#4a4850', 1.8);
      inkLn(g, [pt(-.24, 0, zc), pt(.24, 0, zc)], '#4a4850', 1.1); inkLn(g, [pt(0, -.24, zc), pt(0, .24, zc)], '#4a4850', 1.1);
      g.font = 'bold 7px Andika, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
      [[-.32, 0, 'N'], [0, -.32, 'E'], [.32, 0, 'S'], [0, .32, 'O']].forEach(([x, y, l]) => { const [p, q] = pt(x, y, zc); g.lineWidth = 2.6; g.strokeStyle = INK; g.strokeText(l, p, q); g.fillStyle = PAL.gold; g.fillText(l, p, q); });
      ball(g, a, b - 66, 2.4, PAL.gold, .8);
      const y0 = b - 76, iron = '#34323a';
      inkLn(g, [[a - 14, y0 + 1.5], [a + 13, y0 - 1]], iron, 1.2);
      poly(g, [[a + 18, y0 - 1.5], [a + 11, y0 - 5.5], [a + 12.5, y0 - 1.2], [a + 11.5, y0 + 3]], iron, .8);
      poly(g, [[a - 13, y0 + 1.4], [a - 19, y0 - 4], [a - 17, y0 + 1.6], [a - 19, y0 + 7]], iron, .8);
      const [x, y] = [a - 1, y0 - 6];
      poly(g, [[x, y + 2], [x - 3, y - 1], [x - 8, y - 4], [x - 12.5, y - 1.5], [x - 10, y + .5], [x - 8, y - .8], [x - 6, y + 1.4], [x - 3.5, y], [x, y + 3.5], [x + 3.5, y], [x + 6, y + 1.4], [x + 8, y - .8], [x + 10, y + .5], [x + 12.5, y - 1.5], [x + 8, y - 4], [x + 3, y - 1]], iron, .9);
      ell(g, x, y + .5, 2.6, 3.6, iron, .8); poly(g, [[x - 2.2, y - 2], [x - 2, y - 5.5], [x - .6, y - 2.8]], iron, .6); poly(g, [[x + 2.2, y - 2], [x + 2, y - 5.5], [x + .6, y - 2.8]], iron, .6);
      ball(g, x - .9, y - .4, .55, '#ffd84a', 0); ball(g, x + .9, y - .4, .55, '#ffd84a', 0);
    },
    lanterne: g => {
      box(g, 0, 0, .3, .3, 5, 0, PAL.stone, 'stone');
      box(g, 0, 0, .07, .07, 50, 5, '#45434b');
      box(g, 0, 0, .24, .24, 3, 55, '#3a383f');
      const s = .085, z0 = 58, z1 = 73;
      const L = [pt(-s, s, z0), pt(s, s, z0), pt(s, s, z1), pt(-s, s, z1)], R = [pt(s, -s, z0), pt(s, s, z0), pt(s, s, z1), pt(s, -s, z1)];
      [[L, '#fff4c4', '#ffb347'], [R, '#ffe9a0', '#ff9a36']].forEach(([p, c0, c1]) => { path(g, p); const [, y0, , y1] = bbox(p), gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, c0); gr.addColorStop(1, c1); g.fillStyle = gr; g.fill(); });
      [[-s, s], [s, s], [s, -s]].forEach(([x, y]) => inkLn(g, [pt(x, y, z0), pt(x, y, z1)], '#3a383f', 1.1));
      ln(g, [pt(-s, s, (z0 + z1) / 2), pt(s, s, (z0 + z1) / 2), pt(s, -s, (z0 + z1) / 2)], '#3a383f', .9);
      box(g, 0, 0, .26, .26, 2, z1, '#3a383f');
      poly(g, [pt(-.13, .13, z1 + 2), pt(.13, .13, z1 + 2), pt(0, 0, z1 + 11)], '#4a4850', .9);
      poly(g, [pt(.13, -.13, z1 + 2), pt(.13, .13, z1 + 2), pt(0, 0, z1 + 11)], '#2e2c34', .9);
      const [p, q] = pt(0, 0, z1 + 13.5); g.beginPath(); g.ellipse(p, q, 1.8, 2.4, 0, 0, TAU); g.strokeStyle = INK; g.lineWidth = 2.2; g.stroke(); g.strokeStyle = '#8a8f99'; g.lineWidth = 1; g.stroke();
    },
  });

  Object.assign(LIGHTS, { filon: [1.6, 'gold', .75], socle: [1.2, 'gold', .5], nenuphar: [1.8, 'green', .7], cranecristal: [1.6, 'violet', .7], baton: [1.5, 'violet', .7], grimoire: [1.2, 'green', .55], harpe: [1.2, 'gold', .5], etai: [1.7, 'warm', .65], potdechambre: [1.2, 'gold', .55], lanterne: [2.4, 'warm', .9], fontaine: [1.2, 'moon', .45] });
  Object.assign(FLAMES, { etai: [[0, 0, 28.5, .3]], lanterne: [[0, 0, 61.5, .42]] });

  Object.assign(ICON_DRAW, {
    glow: g => {
      const rays = (n, r1, r2, off, col) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + off + i * Math.PI / n, r = i % 2 ? r2 : r1; p.push([Math.cos(a) * r, Math.sin(a) * r + 1]); } poly(g, p, col, 1.1); };
      rays(12, 19.5, 9, 0, '#f0a032'); rays(12, 14.5, 8.5, Math.PI / 12, '#ffd04a');
      ball(g, 0, 1, 9, '#ffe27a', 1.2); ball(g, -3, -2, 2.6, '#fffbe6', 0);
    },
    map: g => {
      const P = [[-17, -12], [-6, -15], [5, -12], [16, -15], [16, 13], [5, 16], [-6, 13], [-17, 16]];
      poly(g, [P[0], P[1], P[6], P[7]], '#f1e0b4', 1.1); poly(g, [P[1], P[2], P[5], P[6]], '#d6bd88', 1.1); poly(g, [P[2], P[3], P[4], P[5]], '#f1e0b4', 1.1);
      ell(g, 10, -5, 4.5, 3.2, '#6aa6d8', .8);
      [[-12, -6, 2.6], [-8.5, -9, 2.2], [-13, -1, 2]].forEach(([x, y, r]) => ball(g, x, y, r, '#5f9a4f', .7));
      poly(g, [[0, -12], [1.1, -9.2], [3.8, -8.2], [1.1, -7.2], [0, -4.4], [-1.1, -7.2], [-3.8, -8.2], [-1.1, -9.2]], '#3a578f', .6);
      g.setLineDash([2.2, 2]); ln(g, [[-11, 10], [-5, 5], [1, 8], [5, 3], [8.5, 7]], '#b83a33', 1.6); g.setLineDash([]);
      ln(g, [[8, 5], [13, 10]], '#b83a33', 2.4); ln(g, [[13, 5], [8, 10]], '#b83a33', 2.4);
    },
    stairs: g => {
      for (let i = 0; i < 4; i++) {
        const x = -19 + i * 8, y = -11 + i * 7, c = mixc('#cfc6b6', '#6f675d', i / 3.5);
        poly(g, [[x, y], [x + 8, y], [x + 8, 16], [x, 16]], shade(c, -.1), 1);
        poly(g, [[x, y], [x + 8, y], [x + 13, y - 5], [x + 5, y - 5]], shade(c, .18), 1);
        poly(g, [[x + 8, y], [x + 13, y - 5], [x + 13, y + 2], [x + 8, y + 7]], shade(c, -.32), 1);
      }
    },
    town: g => {
      ell(g, 0, 14, 20, 4.5, '#8f877b', 1);
      rrect(g, -18, 0, 12, 13, 1, '#efe0c0', 1); poly(g, [[-19.5, 1], [-12, -8], [-4.5, 1]], '#c8413a', 1); rrect(g, -14.5, 5.5, 4, 7.5, 1.5, '#7a4a28', .8);
      rrect(g, 6, 1, 12, 12, 1, '#efe0c0', 1); poly(g, [[4.5, 2], [12, -7], [19.5, 2]], '#4f7fc8', 1); rrect(g, 9.5, 5, 4.5, 4, .8, '#ffd36a', .7);
      rrect(g, -5, -9, 10, 23, 1, '#d8c8a8', 1.1);
      g.beginPath(); g.moveTo(-3, 0); g.lineTo(-3, -4); g.arc(0, -4, 3, Math.PI, 0); g.lineTo(3, 0); g.closePath(); fi(g, '#3a2a30', .8);
      g.beginPath(); g.moveTo(-2.2, -.5); g.quadraticCurveTo(-2, -5, 0, -5); g.quadraticCurveTo(2, -5, 2.2, -.5); g.closePath(); g.fillStyle = radial(g, 0, -3, 3, PAL.gold); fi(g, g.fillStyle, .6);
      poly(g, [[-6.5, -9], [0, -21], [6.5, -9]], '#5a5478', 1.1); ln(g, [[0, -21], [0, -23.5]], INK, 1); ball(g, 0, -24, 1.4, PAL.gold, .6);
      rrect(g, -2, 7, 4, 7, 1.5, '#7a4a28', .8);
    },
    expe: g => {
      inkLn(g, [[-15, 17], [11, -19]], '#9a6a3a', 2.4); ball(g, 11.5, -19.5, 2.6, '#7a4a28', .9);
      rrect(g, -10, -7, 20, 22, 6, '#a8683a', 1.2);
      rrect(g, -10, -7, 20, 9.5, 5, '#8a5228', 1.1);
      rrect(g, -6.5, 5, 13, 8, 3, '#8a5228', 1);
      ln(g, [[-4, 2.5], [-4, 5]], '#5a3a20', 1.4); ln(g, [[4, 2.5], [4, 5]], '#5a3a20', 1.4); ball(g, 0, 1.5, 1.6, PAL.gold, .7);
      rrect(g, -13, -16, 26, 9, 4.5, '#c8413a', 1.1);
      ln(g, [[-8, -13.5], [6, -13.5]], 'rgba(255,230,210,.5)', 1.2);
      ell(g, 13, -11.5, 2.8, 4.5, '#e07a6a', .9); g.beginPath(); g.arc(13, -11.5, 1.5, 0, Math.PI * 1.5); g.strokeStyle = '#8a2a22'; g.lineWidth = .8; g.stroke();
      ln(g, [[-7, -16.5], [-7, -6.5]], '#5a3a20', 1.6); ln(g, [[7, -16.5], [7, -6.5]], '#5a3a20', 1.6);
    },
  });
}
