
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
  barricade: g => {
    post(g, -.38, 0, 38); post(g, .38, 0, 38);
    box(g, 0, 0, .86, .09, 9, 3, PAL.wood, 'wood'); box(g, .02, 0, .82, .09, 9, 15, '#a06c3c', 'wood'); box(g, -.02, 0, .84, .09, 8, 27, PAL.wood, 'wood');
    const [a1, b1] = pt(-.34, -.07, 4), [a2, b2] = pt(.34, -.07, 36); ln(g, [[a1, b1], [a2, b2]], INK, 6.5); ln(g, [[a1, b1], [a2, b2]], '#8a5a30', 4.4);
    [[-.3, 9], [.3, 21], [-.1, 31], [.14, 8]].forEach(([x, z]) => ball(g, ...pt(x, -.06, z), 1.4, '#d4d8e0', .6));
    post(g, .3, -.12, 42); const [a, b] = pt(.3, -.12, 42); rrect(g, a - 16, b - 9, 32, 11, 2, PAL.cream, .9); g.fillStyle = INK; g.font = 'bold 6.5px Andika, sans-serif'; g.textAlign = 'center'; artText(g, 'DÉTOUR', a, b - 1.5);
  },
  // les pièges des artisans (rang 2 et 3)
  herse: g => {
    post(g, -.38, 0, 50, PAL.stone); post(g, .38, 0, 50, PAL.stone);
    [-.27, -.135, 0, .135, .27].forEach(x => { const [a1, b1] = pt(x, 0, 47), [a2, b2] = pt(x, 0, 12); ln(g, [[a1, b1], [a2, b2]], INK, 4.4); ln(g, [[a1, b1], [a2, b2]], '#55505e', 2.6); poly(g, [[a2 - 2.6, b2 - 1], [a2, b2 + 8], [a2 + 2.6, b2 - 1]], '#c9ced8', .8); });
    [40, 25].forEach(z => { const [a1, b1] = pt(-.31, 0, z), [a2, b2] = pt(.31, 0, z); ln(g, [[a1, b1], [a2, b2]], INK, 4.2); ln(g, [[a1, b1], [a2, b2]], '#625d6b', 2.4); });
    box(g, 0, 0, .86, .14, 6, 48, PAL.stone, 'stone'); ball(g, ...pt(0, .07, 51), 2.4, '#f0902a', .6);
  },
  meule: g => {
    poly(g, [pt(-.36, -.12, .5), pt(.36, -.12, .5), pt(.36, .12, .5), pt(-.36, .12, .5)], '#1e120c', 1);
    [-.17, .17].forEach(x => { const [a, b] = pt(x, 0, 0); g.beginPath(); g.arc(a, b - 1, 12.5, Math.PI, 0); g.closePath(); g.fillStyle = radial(g, a - 3, b - 9, 14, '#bfc4ce'); fi(g, g.fillStyle, 1.1); g.beginPath(); g.arc(a, b - 1, 7.5, Math.PI, 0); g.strokeStyle = 'rgba(40,30,40,.4)'; g.lineWidth = 1.2; g.stroke(); ball(g, a, b - 1, 2.2, '#55505e', .6); });
    const [a, b] = pt(0, 0, 0); [[-5, -17], [3, -21], [9, -14], [-1, -12]].forEach(([dx, dy]) => ball(g, a + dx, b + dy, 1.3, '#ffd27a', 0));
  },
  machoire: g => {
    const [a, b] = pt(0, 0, 0);
    ell(g, a, b, 20, 9, '#4a4652', 1); ell(g, a, b, 14, 5.5, '#1e120c', 0);
    for (let i = 0; i < 7; i++) { const t = Math.PI * (.12 + .76 * i / 6), x = a - Math.cos(t) * 14, y = b + Math.sin(t) * 5.5; poly(g, [[x - 2, y], [x, y - 5], [x + 2, y]], '#e3e6ec', .7); }
    g.beginPath(); g.moveTo(a - 18, b - 2); g.quadraticCurveTo(a, b - 31, a + 18, b - 2); g.lineTo(a + 13, b - 2); g.quadraticCurveTo(a, b - 22, a - 13, b - 2); g.closePath(); g.fillStyle = radial(g, a - 4, b - 16, 18, '#6a6572'); fi(g, g.fillStyle, 1.1);
    for (let i = 1; i < 6; i++) { const t = i / 6, x = a - 13 + 26 * t, y = b - 2 - 40 * t * (1 - t); poly(g, [[x - 2, y - 1], [x, y + 5], [x + 2, y - 1]], '#e3e6ec', .7); }
    ball(g, a, b, 3, '#f0902a', .8);
  },
  ressort: g => {
    poly(g, [pt(-.36, -.36, .5), pt(.36, -.36, .5), pt(.36, .36, .5), pt(-.36, .36, .5)], '#2a1c16', 1);
    const [a, b] = pt(0, 0, 0); for (let i = 0; i < 5; i++) ell(g, a, b - 3 - i * 4, 7, 2.6, i % 2 ? '#c9ced8' : '#9aa0aa', .7);
    poly(g, [pt(-.32, -.32, 27), pt(.32, -.32, 23), pt(.32, .32, 17), pt(-.32, .32, 21)], PAL.wood, 1);
    [[-.16, -.1], [.16, .1]].forEach(([x, y]) => ball(g, ...pt(x, y, 22), 1.4, '#d4d8e0', .6));
  },
  automate: g => {
    box(g, 0, 0, .44, .44, 8, 0, PAL.stone, 'stone');
    const [a, b] = pt(0, 0, 8);
    [-4.5, 4.5].forEach(dx => rrect(g, a + dx - 3, b - 13, 6, 13, 2, '#6f7684', 1));
    rrect(g, a - 10, b - 33, 20, 22, 5, '#9aa1ae', 1.1); ln(g, [[a - 6, b - 25], [a + 6, b - 25]], 'rgba(40,30,40,.35)', 1.2);
    ball(g, a, b - 39, 8, '#aeb5c2', 1.1); rrect(g, a - 5.5, b - 41, 11, 3, 1, '#2a2430', 0); ball(g, a - 2.5, b - 39.6, 1, '#f0902a', 0); ball(g, a + 2.5, b - 39.6, 1, '#f0902a', 0);
    ln(g, [[a + 9, b - 29], [a + 17, b - 41]], INK, 4.2); ln(g, [[a + 9, b - 29], [a + 17, b - 41]], '#8f96a3', 2.4); rrect(g, a + 12, b - 49, 13, 8, 2, '#6a4a32', 1);
    ln(g, [[a - 10, b - 25], [a - 17, b - 27]], INK, 2); ell(g, a - 19.5, b - 27.5, 3, 4.5, PAL.gold, .8);
  },
  poste: g => {
    box(g, 0, 0, .46, .38, 32, 0, PAL.wood, 'wood');
    const [da, db] = pt(.04, .19, 0); rrect(g, da - 6, db - 25, 12, 23, 5, '#1e120c', .8);
    const top = pt(0, 0, 54), A = pt(-.28, .24, 31), B = pt(.28, .24, 31), C = pt(.28, -.24, 31), D = pt(-.28, -.24, 31);
    poly(g, [D, A, top], '#a24a34', 1); poly(g, [B, C, top], '#6e2c20', 1); poly(g, [A, B, top], '#8a3a2a', 1); ball(g, ...top, 2.4, PAL.gold, .6);
    post(g, -.38, .14, 44); const [a, b] = pt(-.38, .14, 44);
    g.beginPath(); g.moveTo(a - 7, b + 2); g.lineTo(a + 7, b + 2); g.lineTo(a + 7, b + 9); g.quadraticCurveTo(a + 6, b + 16, a, b + 19); g.quadraticCurveTo(a - 6, b + 16, a - 7, b + 9); g.closePath(); g.fillStyle = radial(g, a, b + 8, 10, '#4a78c0'); fi(g, g.fillStyle, 1);
    ln(g, [[a, b + 4], [a, b + 16]], PAL.gold, 1.6); ln(g, [[a - 5, b + 8], [a + 5, b + 8]], PAL.gold, 1.6);
  },
  cloche: g => { post(g, -.26, 0, 46); post(g, .26, 0, 46); box(g, 0, 0, .6, .06, 4, 44, PAL.wood2); const [a, b] = pt(0, 0, 44); g.beginPath(); g.moveTo(a - 9, b + 20); g.quadraticCurveTo(a - 8, b + 4, a, b + 4); g.quadraticCurveTo(a + 8, b + 4, a + 9, b + 20); g.closePath(); g.fillStyle = radial(g, a, b + 12, 11, PAL.gold); fi(g, g.fillStyle, 1); ball(g, a, b + 21, 2.4, '#9a7420'); },
};
// tourné d'un quart (dans un couloir qui va dans l'autre sens) : en isométrique, c'est l'image retournée… sauf les écriteaux
let ART_TURN = false;
function artText(g, text, x, y) { if (!ART_TURN) return g.fillText(text, x, y); g.save(); g.translate(x, 0); g.scale(-1, 1); g.translate(-x, 0); g.fillText(text, x, y); g.restore(); }
['porte', 'barricade', 'hache', 'cloche', 'herse', 'automate'].forEach(k => { DDRAW[k + '~'] = g => { g.save(); g.scale(-1, 1); ART_TURN = true; try { DDRAW[k](g); } finally { ART_TURN = false; g.restore(); } }; });

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
  // caillou irrégulier à facette claire (coordonnées écran)
  const rock = (g, x, y, r, col, seed = 0, k = .62) => {
    const p = []; for (let i = 0; i < 7; i++) { const a = (i + hash(seed, i) * .5) / 7 * TAU, s = .8 + hash(i, seed) * .28; p.push([x + Math.cos(a) * r * s, y + Math.sin(a) * r * s * k]); }
    poly(g, p, col, .9); poly(g, [p[4], p[5], p[6], [x + r * .15, y - r * .05 * k]], shade(col, .22), 0);
  };
  // contour organique (tache) projeté au sol
  const blob = (g, r, seed, z = .3, n = 14) => { const P = []; for (let i = 0; i < n; i++) P.push(pc(i / n * TAU, r * (1 + (hash(i, seed) - .5) * .2), z)); const M = i => [(P[i % n][0] + P[(i + 1) % n][0]) / 2, (P[i % n][1] + P[(i + 1) % n][1]) / 2]; g.beginPath(); g.moveTo(...M(0)); for (let i = 1; i <= n; i++) g.quadraticCurveTo(...P[i % n], ...M(i)); g.closePath(); };
  // eau sombre aux bords moussus
  const pond = (g, r, seed) => {
    blob(g, r, seed, 0); g.fillStyle = radial(g, 0, 0, r * 45, '#46663a'); fi(g, g.fillStyle, 1);
    blob(g, r * .87, seed, .3); const gr = g.createRadialGradient(-5, -3, 1, 0, 0, r * 40); gr.addColorStop(0, '#2f6b7a'); gr.addColorStop(1, '#122f3a'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#0c1f26'; g.lineWidth = .9; g.stroke();
    [[-.12, -.16, 7], [.18, .1, 5], [-.2, .14, 4]].forEach(([x, y, w]) => { const [a, b] = pt(x, y, .3); g.beginPath(); g.ellipse(a, b, w, w * .42, 0, .25, Math.PI - .25); g.strokeStyle = 'rgba(170,230,250,.45)'; g.lineWidth = .8; g.stroke(); });
  };

  Object.assign(FDRAW, {
    /* ----- escaliers ----- */
    colimacon: g => {
      const top = 4, Ro = .49, Ri = .41, [hx, hy] = pt(0, 0, top), rx = Ri * 45, ry = Ri * 22.5;
      cyl(g, 0, 0, Ro, top, 0, '#8d8579');
      for (let i = 0; i < 16; i++) { const a = i / 16 * TAU + .15; ln(g, [pc(a, Ri + .005, top), pc(a, Ro - .01, top)], 'rgba(48,34,26,.5)', .8); }
      g.save(); g.beginPath(); g.ellipse(hx, hy, rx, ry, 0, 0, TAU); g.clip();
      let gr = g.createLinearGradient(0, hy - ry, 0, hy + ry); gr.addColorStop(0, '#3b322c'); gr.addColorStop(.5, '#171010'); gr.addColorStop(1, '#050303');
      g.fillStyle = gr; g.fillRect(hx - rx - 2, hy - ry - 2, rx * 2 + 4, ry * 2 + 4);
      for (let d = 4; d < 22; d += 4.5) { g.beginPath(); g.ellipse(hx, hy + d, rx, ry, 0, Math.PI, TAU); g.strokeStyle = `rgba(150,128,108,${Math.max(0, .26 - d * .011)})`; g.lineWidth = .8; g.stroke(); }
      // marches : de la gauche (au ras du sol) vers le fond puis la droite, en s'enfonçant dans le noir
      const N = 10, D = .4, h = 2.5, r0 = .19, r1 = Ri + .04, A = 3.25;
      const S = [...Array(N).keys()].map(k => ({ k, s: A + k * D, e: A + (k + 1) * D, z: top - (k + 1) * h })), front = st => Math.sin((st.s + st.e) / 2 + Q) > 0;
      const arc = (u, v, r, z) => { const p = []; for (let i = 0; i <= 6; i++) p.push(pc(u + (v - u) * i / 6, r, z)); return p; };
      const step = ({ k, s, e, z }) => {
        const col = mixc('#e6dcc6', '#2a201a', Math.min(1, k / (N - .5))), m = (s + e) / 2;
        if (Math.sin(s) - Math.cos(s) > 0) poly(g, [pc(s, r0, z), pc(s, r1, z), pc(s, r1, z - h), pc(s, r0, z - h)], shade(col, -.5), .6);
        if (Math.cos(e) - Math.sin(e) > 0) poly(g, [pc(e, r0, z), pc(e, r1, z), pc(e, r1, z - h), pc(e, r0, z - h)], shade(col, -.4), .6);
        if (Math.cos(m) + Math.sin(m) < 0) poly(g, [...arc(s, e, r0, z), ...arc(e, s, r0, z - h)], shade(col, -.3), .6);
        poly(g, [...arc(s, e, r1, z), ...arc(e, s, r0, z)], col, .7);
        ln(g, [pc(e, r0 + .01, z), pc(e, r1 - .02, z)], `rgba(255,244,222,${.65 * (1 - k / N)})`, .9);
      };
      S.filter(st => !front(st)).reverse().forEach(step);
      gr = g.createLinearGradient(hx - 2.4, 0, hx + 2.4, 0); gr.addColorStop(0, '#5f574f'); gr.addColorStop(.4, '#b0a698'); gr.addColorStop(1, '#3f3833');
      g.fillStyle = gr; g.fillRect(hx - 2.3, hy, 4.6, ry * 2 + 30);
      S.filter(front).reverse().forEach(step);
      g.restore();
      g.beginPath(); g.ellipse(hx, hy, rx, ry, 0, 0, TAU); g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke();
      const rr = (Ri + Ro) / 2, rz = top + 8.5, posts = [3.95, 4.62, 5.29, 5.96, 6.63];
      posts.slice().sort((p, q) => Math.sin(p + Q) - Math.sin(q + Q)).forEach(a => box(g, Math.cos(a) * rr, Math.sin(a) * rr, .03, .03, rz - top, top, PAL.wood2));
      const [cx, cy] = pt(0, 0, rz);
      g.beginPath(); g.ellipse(cx, cy, rr * 45, rr * 22.5, 0, posts[0] + Q, posts[4] + Q); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 3; g.stroke(); g.strokeStyle = PAL.wood; g.lineWidth = 1.5; g.stroke();
      cyl(g, 0, 0, .058, 1.5, top - .5, '#b0a698');
    },
    montee: g => {
      const N = 9, D = .6, h = 6.4, r0 = .065, r1 = .41, A = 2.74, zc = 70;
      disc(g, 0, 0, 0, .46, '#80786d');
      const arc = (b, r, z) => { const p = []; for (let i = 0; i <= 6; i++) p.push(pc(b - D * i / 6, r, z)); return p; };
      const S = [...Array(N).keys()].map(k => ({ k, b: A - k * D, z: (k + 1) * h }));
      const key = s => { const m = s.b - D / 2; return Math.cos(m) + Math.sin(m); };
      const rail = S.map(s => pc(s.b - D / 2, r1 - .04, s.z + 13));
      const step = ({ k, b, z }) => {
        const a = b - D, m = b - D / 2, col = mixc('#c99158', '#9a6638', k / N);
        if (Math.cos(m) + Math.sin(m) > -.3) poly(g, [...arc(b, r1, z), ...arc(b, r1, z - h).reverse()], shade(col, -.32), .7);
        if (Math.cos(b) - Math.sin(b) > 0) poly(g, [pc(b, r0, z), pc(b, r1, z), pc(b, r1, z - h), pc(b, r0, z - h)], shade(col, -.42), .7);
        if (Math.sin(a) - Math.cos(a) > 0) poly(g, [pc(a, r0, z), pc(a, r1, z), pc(a, r1, z - h), pc(a, r0, z - h)], shade(col, -.5), .7);
        poly(g, [...arc(b, r1, z), pc(a, r0, z), pc(b, r0, z)], col, .8);
        ln(g, [pc(b, r0 + .02, z), pc(b, r1 - .02, z)], 'rgba(255,240,210,.45)', .8);
        box(g, Math.cos(m) * (r1 - .04), Math.sin(m) * (r1 - .04), .03, .03, 13, z, PAL.wood2);
        if (k) { ln(g, [rail[k - 1], rail[k]], INK, 3); ln(g, [rail[k - 1], rail[k]], PAL.wood, 1.5); }
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
      poly(g, [pt(x0, y0, zt), pt(x1, y0, zt), pt(x1, y0 - .02, zt + 15), pt(x0, y0 - .02, zt + 15)], '#9c6436', 1);
      [x0 + .07, x0 + .15].forEach(x => ln(g, [pt(x, y0, zt + 1), pt(x, y0 - .02, zt + 14)], 'rgba(45,22,8,.4)', .8));
      ln(g, [pt(x0 + .02, y0, zt + 5), pt(x1 - .02, y0, zt + 5)], '#4a4850', 1.4);
      ball(g, ...pt((x0 + x1) / 2, y0, zt + 9.5), 1.5, '#8a8f99', .6);
    },

    /* ----- mine ----- */
    wagonnet: g => {
      for (let i = 0; i < 5; i++) box(g, -.4 + i * .2, 0, .07, .46, 2, 0, '#6e4b2e');
      [-.13, .13].forEach(y => box(g, 0, y, .98, .035, 2.2, 2, '#8d939e'));
      const wheel = (x, y) => { const [a, b] = pt(x, y, 7); vcirc(g, a, b, 4.8, 1, '#45424a', 1); ball(g, a, b, 1.5, '#9aa0aa', .6); };
      wheel(-.15, -.17); wheel(.15, -.17);
      const bx = .22, by = .14, tx = .27, ty = .19, z0 = 8, z1 = 25, W = z => [bx + (tx - bx) * (z - z0) / (z1 - z0), by + (ty - by) * (z - z0) / (z1 - z0)];
      poly(g, [pt(-tx, -ty, z1), pt(tx, -ty, z1), pt(tx, ty, z1), pt(-tx, ty, z1)], '#4a3424', .8);
      poly(g, [pt(-bx, by, z0), pt(bx, by, z0), pt(tx, ty, z1), pt(-tx, ty, z1)], PAL.wood, 1);
      poly(g, [pt(bx, -by, z0), pt(bx, by, z0), pt(tx, ty, z1), pt(tx, -ty, z1)], shade(PAL.wood, -.28), 1);
      [13.5, 19].forEach(z => { const [w, d] = W(z); ln(g, [pt(-w, d, z), pt(w, d, z), pt(w, -d, z)], 'rgba(45,22,8,.4)', .8); });
      [[pt(-bx + .03, by, z0), pt(-tx + .03, ty, z1)], [pt(bx, by, z0), pt(tx, ty, z1)], [pt(bx, -by + .03, z0), pt(tx, -ty + .03, z1)]].forEach(p => inkLn(g, p, '#5a5e68', 1.4));
      const R = []; for (let i = 0; i < 15; i++) { const x = -.2 + hash(i, 21) * .4, y = -.14 + hash(21, i) * .28, d = Math.hypot(x / .22, y / .16); R.push([x, y, 1 + 7 * Math.max(0, 1 - d * d) + hash(i, 8) * 2, 3 + hash(8, i) * 1.4, i]); }
      R.sort((p, q) => p[0] + p[1] + p[2] * .012 - (q[0] + q[1] + q[2] * .012)).forEach(([x, y, dz, r, i]) => { const [a, b] = pt(x, y, z1 + dz); if (i % 5 === 2) { rock(g, a, b, r * .8, '#f0c040', i, .8); ball(g, a - r * .25, b - r * .3, .7, '#fff8d8', 0); } else rock(g, a, b, r, ['#8e8a85', '#76726d', '#a29e98'][i % 3], i, .8); });
      inkLn(g, [pt(-tx, ty, z1), pt(tx, ty, z1), pt(tx, -ty, z1)], '#5a5e68', 1.4);
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
      [[-.34, .22, 4.4], [.3, .3, 3.8], [-.08, .36, 3.2], [.38, -.1, 3.4]].forEach(([x, y, r], i) => { const [a, b] = pt(x, y, 0); rock(g, a, b - r * .45, r, '#857b72', i + 3); });
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
      g.save(); blob(g, .46 * .87, 7, .3); g.clip();
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
      const n = 14, hw = t => .16 * Math.sqrt(Math.max(0, 1 - (t > 0 ? t * t : .62 * t * t))), X = t => .4 * t, Zg = t => 12 + 3.5 * Math.max(0, t) ** 2;
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
      const A = pt(-.06, -.02, 19), B = pt(.11, .36, 4), ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
      inkLn(g, [A, B], '#cf9a5e', 1.1);
      g.save(); g.translate(B[0] + Math.cos(ang) * 3, B[1] + Math.sin(ang) * 3); g.rotate(ang - Math.PI / 2); ell(g, 0, 0, 2, 4.2, '#cf9a5e', .9); g.restore();
      const [ox, oy] = pt(.02, .16, 12.4); ball(g, ox, oy, 1.3, '#5a5e68', .6);
    },

    /* ----- artefacts ----- */
    couronne: g => {
      plinth(g, 12);
      pillow(g, 12, .21, '#7d3c98');
      const [a, b] = pt(0, 0, 18), rx = 12, ry = 5.2, hb = 6.5, cr = '#c9c33e', cd = '#6d6a1e';
      g.save(); g.translate(a, b); g.rotate(-.13);
      g.beginPath(); g.ellipse(0, -hb, rx, ry, 0, Math.PI, TAU); g.lineTo(rx, 0); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI, true); g.closePath(); fi(g, cd, 1);
      [1.22, 1.5, 1.78].forEach(f => { const t = f * Math.PI, x = Math.cos(t) * rx, y = -hb + Math.sin(t) * ry; poly(g, [[x - 3.1, y + .5], [x, y - 7], [x + 3.1, y + .5]], shade(cr, -.3), .9); });
      g.beginPath(); g.ellipse(0, -hb, rx, ry, 0, 0, Math.PI); g.lineTo(-rx, 0); g.ellipse(0, 0, rx, ry, 0, Math.PI, 0, true); g.closePath();
      let gr = g.createLinearGradient(-rx, 0, rx, 0); gr.addColorStop(0, shade(cr, -.25)); gr.addColorStop(.3, shade(cr, .35)); gr.addColorStop(.6, cr); gr.addColorStop(1, shade(cr, -.4)); g.fillStyle = gr; fi(g, g.fillStyle, 1.1);
      ln(g, [[-6.5, -hb + ry * .82 + 1], [-5, ry * .82 - 1.5]], 'rgba(70,60,10,.6)', 1.1); ln(g, [[-5.4, -hb + ry * .82 + 1.2], [-4, ry * .82 - 1.8]], 'rgba(255,255,200,.55)', .7);
      ell(g, 0, -hb / 2 + ry * .97, 2.8, 2.1, '#d8384a', .8); ell(g, -8, -hb / 2 + ry * .72, 1.7, 1.4, '#4fbf7a', .7); ell(g, 8.5, -hb / 2 + ry * .7, 1.7, 1.4, '#4fbf7a', .7);
      [[.14, 8, .55], [.5, 10, 0], [.86, 8, 0]].forEach(([f, hgt, bend], i) => { const t = f * Math.PI, x = Math.cos(t) * rx, y = -hb + Math.sin(t) * ry; g.save(); g.translate(x, y); g.rotate(bend); poly(g, [[-3.3, .6], [0, -hgt], [3.3, .6]], cr, 1); ball(g, 0, -hgt, 1.7, i === 1 ? '#e0405a' : '#e9f0a0', .7); g.restore(); });
      g.restore();
    },
    epeefaux: g => {
      poly(g, [[-21, 4], [-23, -6], [-15, -16], [-3, -20], [10, -17], [20, -8], [21, 3], [8, 9], [-9, 9]], '#857e75', 1.2);
      poly(g, [[-15, -16], [-3, -20], [10, -17], [3, -12], [-9, -12]], '#a59d92', .8);
      poly(g, [[10, -17], [20, -8], [21, 3], [8, 9], [5, -3], [3, -12]], '#686158', .8);
      ln(g, [[-9, -12], [-12, -3], [-9, 8]], 'rgba(30,20,15,.35)', .9); ln(g, [[13, -4], [16, 2]], 'rgba(30,20,15,.3)', .8);
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
      note(g, 13, -47, .95, '#f5e3a0', .22);
      note(g, -17, -35, .8, '#b6dc6e', -.55);
      ln(g, [[-24, -44], [-22.5, -45.5], [-21, -44], [-19.5, -45.5]], '#b6dc6e', 1);
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
      inkLn(g, [[fx, fy + 2], [fx + .5, fy - 4]], '#cfd4dc', 1.2); rrect(g, fx - 2.5, fy - 6, 5.6, 2.2, 1, '#cfd4dc', .7);
      [-1.8, -.6, .6, 1.8].forEach(dx => { ln(g, [[fx + .3 + dx, fy - 5.3], [fx + .4 + dx * 1.05, fy - 9.6]], INK, 1.7); ln(g, [[fx + .3 + dx, fy - 5.3], [fx + .4 + dx * 1.05, fy - 9.6]], '#e4e8ee', .8); });
      g.beginPath(); g.moveTo(fx - 7, fy + 1); g.bezierCurveTo(fx - 12, fy - 4, fx - 5, fy - 7, fx - 9, fy - 13); g.strokeStyle = '#9dffc0'; g.lineWidth = 1; g.lineCap = 'round'; g.stroke();
      spark(g, fx + 9, fy - 8, 2.6, '#c6ffd8'); spark(g, fx - 4, fy - 14, 1.8, '#c6ffd8'); ball(g, fx + 5, fy - 14, 1, '#9dffc0', 0);
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
      [[-16.5, -5, -.5], [15.5, -3, .6], [-9, 2.5, -.25], [6, 3.5, .3]].forEach(([dx, dy, t]) => inkLn(g, [[a + dx - Math.cos(t) * 3, b + dy - Math.sin(t) * 3], [a + dx + Math.cos(t) * 3, b + dy + Math.sin(t) * 3]], '#d9b45a', .7));
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
      pillow(g, 10, .2, '#3f5aa8');
      const [a, b] = pt(0, 0, 15.5);
      g.beginPath(); g.moveTo(a + 10, b - 8.5); g.bezierCurveTo(a + 18.5, b - 10, a + 18, b - 1.5, a + 9.5, b - 2.5); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 4.2; g.stroke(); g.strokeStyle = PAL.gold; g.lineWidth = 2.2; g.stroke();
      g.beginPath(); g.moveTo(a - 10, b - 10); g.bezierCurveTo(a - 14.5, b - 6, a - 10, b + .5, a, b + .5); g.bezierCurveTo(a + 10, b + .5, a + 14.5, b - 6, a + 10, b - 10); g.ellipse(a, b - 10, 10, 4, 0, 0, Math.PI); g.closePath(); g.fillStyle = radial(g, a - 4, b - 7, 14, PAL.gold); fi(g, g.fillStyle, 1.1);
      ell(g, a, b - 10.5, 13.4, 5.3, '#f3cf62', 1.1); ell(g, a, b - 10.8, 10.2, 3.7, '#8a6418', .7); ell(g, a + 1.5, b - 10, 6.5, 1.8, '#6e4e10', 0);
      ln(g, [[a - 8, b - 6], [a - 8.5, b - 2.5]], 'rgba(255,250,220,.65)', 1.4); ln(g, [[a - 10, b - 12.5], [a - 5, b - 14.6]], 'rgba(255,250,220,.7)', 1);
      g.beginPath(); g.ellipse(a, b - 24, 9.5, 3, 0, 0, TAU); g.strokeStyle = INK; g.lineWidth = 3.6; g.stroke(); g.strokeStyle = '#ffe27a'; g.lineWidth = 2; g.stroke();
      g.beginPath(); g.ellipse(a, b - 24, 9.5, 3, 0, Math.PI * 1.1, Math.PI * 1.6); g.strokeStyle = '#fffbe6'; g.lineWidth = .8; g.stroke();
      spark(g, a - 15, b - 18, 3.4); spark(g, a + 15, b - 25, 3); spark(g, a + 4, b - 32, 2.4); spark(g, a - 7, b - 31, 1.8);
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
      g.beginPath(); g.moveTo(a - 11, b - 41); g.lineTo(a + 11, b - 41); g.lineTo(a + 11, b - 29); g.quadraticCurveTo(a + 3.5, b - 28, a, b - 24); g.quadraticCurveTo(a - 3.5, b - 28, a - 11, b - 29); g.closePath(); g.fillStyle = radial(g, a - 3, b - 35, 11, '#e9b84c'); fi(g, g.fillStyle, .7);
      g.beginPath(); g.moveTo(a - 11, b - 4); g.lineTo(a - 11, b - 6.5); g.quadraticCurveTo(a, b - 4.5, a + 11, b - 6.5); g.lineTo(a + 11, b - 4); g.closePath(); fi(g, '#e0b04a', .7);
      ln(g, [[a, b - 6], [a, b - 25]], '#d9a43e', 1.2);
      [[1.6, -13, .6], [-1.4, -16.5, .5], [1.2, -19.5, .45], [-2.2, -11, .5], [2.4, -29, .55], [-2.6, -27.5, .5]].forEach(([dx, dy, r]) => ball(g, a + dx, b + dy, r, '#c8962e', 0));
      g.restore();
      ln(g, [[a - 6, b - 37], [a - 7.5, b - 31]], 'rgba(255,255,255,.85)', 1.2); ln(g, [[a - 6.8, b - 14.5], [a - 7.2, b - 9]], 'rgba(255,255,255,.75)', 1);
      [-11, 11].forEach(dx => { inkLn(g, [[a + dx, b - 5], [a + dx, b - 40]], gd, 1.8); ball(g, a + dx, b - 22.5, 2, PAL.gold, .7); });
      plate(b - 44);
      ball(g, a, b - 47.5, 2.4, PAL.gold, .8);
    },

    /* ----- jardin et volière ----- */
    ruche: g => {
      [[-.17, -.17], [.17, -.17], [-.17, .17], [.17, .17]].forEach(([x, y]) => box(g, x, y, .045, .045, 13, 0, PAL.wood2));
      box(g, 0, 0, .5, .5, 3, 13, PAL.wood, 'wood');
      const [a, b] = pt(0, 0, 16);
      const dome = () => { g.beginPath(); g.moveTo(a - 13.5, b); g.bezierCurveTo(a - 14.5, b - 16, a - 8, b - 27, a, b - 27); g.bezierCurveTo(a + 8, b - 27, a + 14.5, b - 16, a + 13.5, b); g.ellipse(a, b, 13.5, 5.5, 0, 0, Math.PI); g.closePath(); };
      dome(); g.fillStyle = radial(g, a - 4, b - 16, 21, '#e2b85a'); fi(g, g.fillStyle, 1.2);
      g.save(); dome(); g.clip();
      for (let i = 1; i <= 6; i++) { const y = b - i * 4.1 + 2, w = 14.3 * Math.sqrt(Math.max(0, 1 - Math.pow((i * 4.1 - 2) / 27.5, 2.4))); g.beginPath(); g.ellipse(a, y, w, w * .4, 0, .06, Math.PI - .06); g.strokeStyle = 'rgba(120,78,20,.6)'; g.lineWidth = 1.1; g.stroke(); }
      g.restore();
      g.beginPath(); g.moveTo(a - 3.3, b + 5.2); g.lineTo(a - 3.3, b + 2.2); g.arc(a, b + 2.2, 3.3, Math.PI, 0); g.lineTo(a + 3.3, b + 5.2); g.closePath(); fi(g, '#2a1a0c', .8);
      ell(g, a, b - 27.5, 3, 1.6, '#c99a48', .8);
      const bee = (x, y, d = 1) => { ell(g, x - 1.2 * d, y - 2.6, 1.8, 2.4, '#eef6ff', .6); ell(g, x + .4 * d, y - 2.8, 1.5, 2.2, '#eef6ff', .6); ell(g, x, y, 3, 2.2, '#f2c230', .8); ln(g, [[x - .8, y - 1.8], [x - .8, y + 1.8]], INK, .9); ln(g, [[x + 1, y - 1.8], [x + 1, y + 1.8]], INK, .9); ball(g, x + 3.2 * d, y - .2, 1.2, INK, 0); };
      bee(a + 18, b - 30); bee(a - 19, b - 18, -1); bee(a + 8, b - 41);
    },
    tonnelle: g => {
      const Wd = '#9a6a3a', H = 46, lv = ['#3f7a35', '#4f8f3f', '#5fa64e', '#6db85a'];
      const leaf = (x, y, r, i) => ball(g, x, y, r, lv[i % 4], .9);
      const lf = (x, y, rot, s, i) => { g.save(); g.translate(x, y); g.rotate(rot); ell(g, 0, 0, 1.5 * s, 3 * s, lv[i % 4], .7); g.restore(); };
      const vine = (x, y) => { const [a, b] = pt(x, y, 0); inkLn(g, [[a, b - 2], [a - 2.2, b - 12], [a + 2.2, b - 22], [a - 1.8, b - 32], [a + 1.6, b - 42]], '#4a7a32', .9); [[-2.2, 7, -1], [2.4, 15, 1], [-2.4, 24, -1], [2.4, 32, 1], [-2, 40, -1]].forEach(([dx, dy, sd], i) => lf(a + dx + sd * 2, b - dy, sd * 1.1, 1.2, i)); };
      post(g, -.32, -.32, H, Wd); post(g, -.32, .32, H, Wd); post(g, .32, -.32, H, Wd);
      vine(.32, -.32);
      box(g, 0, -.32, .78, .07, 4, H, Wd, 'wood');
      post(g, .32, .32, H, Wd);
      box(g, 0, .32, .78, .07, 4, H, Wd, 'wood');
      [-.27, -.09, .09, .27].forEach(x => box(g, x, 0, .05, .8, 3, H + 4, shade(Wd, .12)));
      const F = []; for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { const n = i * 5 + j; F.push([-.33 + i * .165 + (hash(n, 11) - .5) * .06, -.33 + j * .165 + (hash(11, n) - .5) * .06, H + 7 + hash(n, 5) * 4, 3.6 + hash(5, n) * 2, n]); }
      F.sort((p, q) => p[0] + p[1] - q[0] - q[1]).forEach(([x, y, z, r, i]) => { const [a, b] = pt(x, y, z); leaf(a, b, r, i); if (i % 3 === 0) lf(a + r * .8, b + r * .5, .9, 1.1, i + 1); });
      [[-.2, -.1], [.1, -.22], [.05, .12], [-.25, .2], [.25, .05]].forEach(([x, y], i) => { const [a, b] = pt(x, y, H + 14); ball(g, a, b, 1.7, i % 2 ? '#e88ac0' : '#c77ae0', .6); ball(g, a, b, .6, '#fff2a0', 0); });
      vine(-.32, .32); vine(.32, .32);
      [[-.12, .34], [.16, .34]].forEach(([x, y]) => { const [a, b] = pt(x, y, H); ln(g, [[a, b], [a, b + 3]], '#3f6a2a', 1); [[0, 4.5], [-1.6, 6.8], [1.6, 6.8], [-.8, 9.1], [.8, 9.1], [0, 11.3]].forEach(([dx, dy]) => ball(g, a + dx, b + dy, 1.5, '#7a4ab0', .6)); lf(a + 3, b + 2.5, .9, 1.1, 1); });
    },
    fontaine: g => {
      cyl(g, 0, 0, .4, 11, 0, '#9a9286');
      disc(g, 0, 0, 9.6, .33, '#3f8fd0');
      const [w0, w1] = pt(0, 0, 9.6);
      [[9, 4], [13, 5.8]].forEach(([rx, ry]) => { g.beginPath(); g.ellipse(w0, w1, rx, ry, 0, 0, TAU); g.strokeStyle = 'rgba(220,245,255,.45)'; g.lineWidth = .8; g.stroke(); });
      cyl(g, 0, 0, .07, 13, 9.6, '#8f877b');
      const [a, b] = pt(0, 0, 22.5);
      g.beginPath(); g.moveTo(a - 8, b - 4.5); g.bezierCurveTo(a - 7.5, b + 1, a - 3, b + 2.2, a, b + 2.2); g.bezierCurveTo(a + 3, b + 2.2, a + 7.5, b + 1, a + 8, b - 4.5); g.closePath(); g.fillStyle = radial(g, a - 3, b - 2, 9, '#a8a092'); fi(g, g.fillStyle, 1);
      ell(g, a, b - 4.5, 8, 3.6, '#b8b0a2', 1); ell(g, a, b - 4.6, 6.4, 2.6, '#5fb0e6', .7);
      [[1.75], [.785], [-.18]].forEach(([t]) => { const [x0, y0] = pc(t, .165, 26.5), [x1, y1] = pc(t, .3, 9.6); g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo(x1, y0 - 1.5, x1, y1); g.lineCap = 'round'; g.strokeStyle = '#3f86bf'; g.lineWidth = 2.6; g.stroke(); g.strokeStyle = '#d4f1ff'; g.lineWidth = 1.2; g.stroke(); ell(g, x1, y1, 2.4, 1, '#e8f8ff', .5); });
      g.beginPath(); g.moveTo(a, b - 15); g.quadraticCurveTo(a + 2.2, b - 9, a, b - 5); g.quadraticCurveTo(a - 2.2, b - 9, a, b - 15); g.fillStyle = '#e4f6ff'; g.fill(); g.strokeStyle = '#4f8fbf'; g.lineWidth = .9; g.stroke();
      [[-3.2, -13, .8], [3.4, -12, .7], [-1.8, -17, .6], [2.2, -16.5, .55]].forEach(([dx, dy, r]) => ball(g, a + dx, b + dy, r, '#e4f6ff', .5));
    },
    nid: g => {
      const [a, b] = pt(0, 0, 0), straw = ['#d9b45a', '#6a4424', '#a87a3a', '#e8cc7a'];
      const strokes = (n, seed, cx, cy, rx, ry, r0) => { for (let i = 0; i < n; i++) { const t = hash(i, seed) * TAU, r = r0 + hash(seed, i) * (1 - r0), x = cx + Math.cos(t) * rx * r, y = cy + Math.sin(t) * ry * r, d = t + Math.PI / 2 + (hash(i, 2) - .5) * 1.3, l = 2.5 + hash(2, i) * 3; ln(g, [[x - Math.cos(d) * l, y - Math.sin(d) * l * .5], [x + Math.cos(d) * l, y + Math.sin(d) * l * .5]], straw[i % 4], .9); } };
      [[-24, -5, -1.2], [24, -8, 1.1], [-12, 6, -1.9], [16, 4, 1.8], [-4, -21, -.3]].forEach(([dx, dy, t]) => inkLn(g, [[a + dx - Math.cos(t) * 4, b + dy - Math.sin(t) * 2], [a + dx + Math.cos(t) * 3, b + dy + Math.sin(t) * 1.5]], '#7a5230', .9));
      g.beginPath(); g.ellipse(a, b - 3, 23, 11.5, 0, 0, Math.PI); g.lineTo(a - 22, b - 10); g.ellipse(a, b - 10, 22, 11, 0, Math.PI, 0, true); g.closePath(); g.fillStyle = radial(g, a - 6, b - 2, 24, '#7a5230'); fi(g, g.fillStyle, 1.2);
      g.save(); g.clip(); strokes(60, 13, a, b - 4, 23, 12, .55); g.restore();
      ell(g, a, b - 10, 22, 11, '#a8783e', 1.1);
      g.save(); g.beginPath(); g.ellipse(a, b - 10, 22, 11, 0, 0, TAU); g.clip(); strokes(60, 9, a, b - 10, 22, 11, .62); g.restore();
      g.beginPath(); g.ellipse(a, b - 11, 14.5, 6.4, 0, 0, TAU); g.fillStyle = radial(g, a + 3, b - 9, 15, '#5a3a1e'); fi(g, g.fillStyle, .9);
      const feather = (x, y, rot, col, s = 1) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); ell(g, 0, -7, 2.8, 7.5, col, .8); ln(g, [[0, 1], [0, -13]], shade(col, -.45), .7); g.restore(); };
      feather(a - 4, b - 9, 1.25, '#f6f0e4', .7); feather(a + 6, b - 12, -1.4, '#e8d6f0', .6);
      feather(a - 15, b - 13, -.9, '#f6f0e4'); feather(a + 15, b - 15, .8, '#7a8ad8'); feather(a + 3, b - 18, .2, '#e890b0', .9);
    },
    mangeoire: g => {
      box(g, 0, 0, .36, .07, 3, 0, PAL.wood2); box(g, 0, 0, .07, .36, 3, 0, PAL.wood2);
      [[-.05, .2], [.12, .15], [.18, -.04], [-.16, .1], [.02, .26]].forEach(([x, y], i) => { const [p, q] = pt(x, y, 0); ell(g, p, q, .9, .6, i % 2 ? '#d9b36a' : '#6a4a2a', 0); });
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
      g.save(); g.scale(.86, .86);
      const rays = (n, r1, r2, off, col) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = -Math.PI / 2 + off + i * Math.PI / n, r = i % 2 ? r2 : r1; p.push([Math.cos(a) * r, Math.sin(a) * r + 1]); } poly(g, p, col, 1.1); };
      rays(12, 19.5, 9, 0, '#f0a032'); rays(12, 14.5, 8.5, Math.PI / 12, '#ffd04a');
      ball(g, 0, 1, 9, '#ffe27a', 1.2); ball(g, -3, -2, 2.6, '#fffbe6', 0);
      g.restore();
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
      g.save(); g.scale(.84, .84);
      g.beginPath(); g.moveTo(10, 17); g.lineTo(10, 1); g.arc(15.5, 1, 5.5, Math.PI, 0); g.lineTo(21, 17); g.closePath(); g.fillStyle = '#241820'; fi(g, '#241820', 1.1);
      poly(g, [[-20, -14], [-12, -14], [-12, -7], [-4, -7], [-4, 0], [4, 0], [4, 7], [12, 7], [12, 16], [-20, 16]], '#9a9284', 1.2);
      for (let i = 0; i < 4; i++) {
        const x = -20 + i * 8, y = -14 + i * 7, c = mixc('#e2dacb', '#8a8276', i / 3.4);
        poly(g, [[x, y], [x + 8, y], [x + 12, y - 4], [x + 4, y - 4]], c, 1);
        if (i < 3) poly(g, [[x + 8, y], [x + 12, y - 4], [x + 12, y + 3], [x + 8, y + 7]], shade(c, -.38), 1);
      }
      ln(g, [[-18, 2], [-10, 2]], 'rgba(60,45,35,.35)', .9); ln(g, [[-16, 9], [-2, 9]], 'rgba(60,45,35,.35)', .9);
      g.restore();
    },
    town: g => {
      g.save(); g.scale(.82, .82);
      ell(g, 0, 14, 20, 4.5, '#8f877b', 1);
      rrect(g, -18, 0, 12, 13, 1, '#efe0c0', 1); poly(g, [[-19.5, 1], [-12, -8], [-4.5, 1]], '#c8413a', 1); rrect(g, -14.5, 5.5, 4, 7.5, 1.5, '#7a4a28', .8);
      rrect(g, 6, 1, 12, 12, 1, '#efe0c0', 1); poly(g, [[4.5, 2], [12, -7], [19.5, 2]], '#4f7fc8', 1); rrect(g, 9.5, 5, 4.5, 4, .8, '#ffd36a', .7);
      rrect(g, -5, -9, 10, 23, 1, '#d8c8a8', 1.1);
      g.beginPath(); g.moveTo(-3, 0); g.lineTo(-3, -4); g.arc(0, -4, 3, Math.PI, 0); g.lineTo(3, 0); g.closePath(); fi(g, '#3a2a30', .8);
      g.beginPath(); g.moveTo(-2.2, -.5); g.quadraticCurveTo(-2, -5, 0, -5); g.quadraticCurveTo(2, -5, 2.2, -.5); g.closePath(); g.fillStyle = radial(g, 0, -3, 3, PAL.gold); fi(g, g.fillStyle, .6);
      poly(g, [[-6.5, -9], [0, -21], [6.5, -9]], '#5a5478', 1.1); ln(g, [[0, -21], [0, -23.5]], INK, 1); ball(g, 0, -24, 1.4, PAL.gold, .6);
      rrect(g, -2, 7, 4, 7, 1.5, '#7a4a28', .8);
      g.restore();
    },
    expe: g => {
      g.save(); g.scale(.86, .86);
      inkLn(g, [[-15, 17], [11, -19]], '#9a6a3a', 2.4); ball(g, 11.5, -19.5, 2.6, '#7a4a28', .9);
      rrect(g, -10, -7, 20, 22, 6, '#a8683a', 1.2);
      rrect(g, -10, -7, 20, 9.5, 5, '#8a5228', 1.1);
      rrect(g, -6.5, 5, 13, 8, 3, '#8a5228', 1);
      ln(g, [[-4, 2.5], [-4, 5]], '#5a3a20', 1.4); ln(g, [[4, 2.5], [4, 5]], '#5a3a20', 1.4); ball(g, 0, 1.5, 1.6, PAL.gold, .7);
      rrect(g, -13, -16, 26, 9, 4.5, '#c8413a', 1.1);
      ln(g, [[-8, -13.5], [6, -13.5]], 'rgba(255,230,210,.5)', 1.2);
      ell(g, 13, -11.5, 2.8, 4.5, '#e07a6a', .9); g.beginPath(); g.arc(13, -11.5, 1.5, 0, Math.PI * 1.5); g.strokeStyle = '#8a2a22'; g.lineWidth = .8; g.stroke();
      ln(g, [[-7, -16.5], [-7, -6.5]], '#5a3a20', 1.6); ln(g, [[7, -16.5], [7, -6.5]], '#5a3a20', 1.6);
      g.restore();
    },
  });
}
/* ---------- ajouts : les Jardins du château (poulailler, jardin des simples, mare, petit cimetière, déco d'extérieur) ---------- */
{
  const TAU = Math.PI * 2;
  // tache organique au sol (centre et rayon en cases)
  const blob = (g, cx, cy, r, seed, z = .3, n = 12, k = .22) => {
    const P = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, q = r * (1 + (hash(i, seed) - .5) * k); P.push(pt(cx + Math.cos(a) * q, cy + Math.sin(a) * q, z)); }
    const M = i => [(P[i % n][0] + P[(i + 1) % n][0]) / 2, (P[i % n][1] + P[(i + 1) % n][1]) / 2];
    g.beginPath(); g.moveTo(...M(0)); for (let i = 1; i <= n; i++) g.quadraticCurveTo(...P[i % n], ...M(i)); g.closePath();
  };
  // flaque d'eau de mare, sans berge (se fond dans le sol d'eau de la Mare)
  const water = (g, cx, cy, r, seed) => {
    blob(g, cx, cy, r, seed, .2); const [wx, wy] = pt(cx, cy, .2), gr = g.createRadialGradient(wx - 5, wy - 3, 1, wx, wy, r * 44);
    gr.addColorStop(0, '#3d8098'); gr.addColorStop(.7, '#22526c'); gr.addColorStop(1, '#183c52'); g.fillStyle = gr; g.fill(); g.strokeStyle = 'rgba(170,225,245,.4)'; g.lineWidth = .8; g.stroke();
  };
  // rond dans l'eau
  const ripple = (g, x, y, w, a = .5) => { g.beginPath(); g.ellipse(x, y, w, w * .42, 0, .2, Math.PI - .2); g.strokeStyle = `rgba(175,232,250,${a})`; g.lineWidth = .8; g.stroke(); };
  // feuille ou brin effilé (coordonnées écran) : base (x, y), pointe (tx, ty), point de courbure (cx, cy), demi-largeur w à la base
  const blade = (g, x, y, tx, ty, cx, cy, w, col, lw = .7) => { g.beginPath(); g.moveTo(x - w, y); g.quadraticCurveTo(cx - w * .5, cy, tx, ty); g.quadraticCurveTo(cx + w * .5, cy, x + w, y); g.closePath(); fi(g, col, lw); };
  // touffe d'herbe
  const tuft = (g, x, y, s = 1, col = '#5f9440') => [[-2.4, 5, -2.2], [2.2, 5.4, 2.4], [-.8, 7.4, -1], [.9, 7, 1.2]].forEach(([dx, h, l], i) => blade(g, x + dx * s, y, x + (dx + l) * s, y - h * s, x + (dx + l * .3) * s, y - h * .55 * s, .95 * s, i % 2 ? col : shade(col, .14), .6));
  // coussinet de mousse (coordonnées écran)
  const moss = (g, x, y, r, seed, col = '#6e9a3a') => {
    const n = 9, P = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, q = r * (.72 + hash(i, seed) * .5); P.push([x + Math.cos(a) * q, y + Math.sin(a) * q * .55]); }
    const M = i => [(P[i % n][0] + P[(i + 1) % n][0]) / 2, (P[i % n][1] + P[(i + 1) % n][1]) / 2];
    g.beginPath(); g.moveTo(...M(0)); for (let i = 1; i <= n; i++) g.quadraticCurveTo(...P[i % n], ...M(i)); g.closePath();
    g.fillStyle = radial(g, x - r * .2, y - r * .3, r, col); g.fill(); g.strokeStyle = shade(col, -.5); g.lineWidth = .5; g.stroke();
    for (let i = 0; i < 4; i++) ball(g, x + (hash(i, seed + 7) - .5) * r * 1.1, y - r * .15 + (hash(seed + 7, i) - .5) * r * .45, r * .13, shade(col, .38), 0);
  };
  // œuf
  const egg = (g, x, y, s = 1, rot = .15) => { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(0, -5 * s); g.bezierCurveTo(3.3 * s, -5 * s, 3.7 * s, 2.5 * s, 0, 2.5 * s); g.bezierCurveTo(-3.7 * s, 2.5 * s, -3.3 * s, -5 * s, 0, -5 * s); g.fillStyle = radial(g, -1.1 * s, -2 * s, 5 * s, '#f6ecd8'); fi(g, g.fillStyle, .8); g.restore(); };
  // brins de paille épars (coordonnées écran)
  const straws = (g, x, y, n, rx, ry, seed, len = 3) => { for (let i = 0; i < n; i++) { const px = x + (hash(i, seed) - .5) * 2 * rx, py = y + (hash(seed, i) - .5) * 2 * ry, d = (hash(i, seed + 3) - .5) * 2.6, l = len * (.7 + hash(seed + 3, i) * .6); ln(g, [[px - Math.cos(d) * l, py - Math.sin(d) * l * .5], [px + Math.cos(d) * l, py + Math.sin(d) * l * .5]], ['#e3c46e', '#c9a040', '#f0da94'][i % 3], .9); } };
  // goutte d'eau
  const drop = (g, x, y, s = 1) => { g.beginPath(); g.moveTo(x, y - 3 * s); g.quadraticCurveTo(x + 2.1 * s, y + .2 * s, x, y + 1.5 * s); g.quadraticCurveTo(x - 2.1 * s, y + .2 * s, x, y - 3 * s); fi(g, '#8fd0f4', .6); ball(g, x - .5 * s, y - .1 * s, .45 * s, '#fff', 0); };
  // plume
  const feather = (g, x, y, rot, col, s = 1) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); ell(g, 0, -6, 2.6, 6.5, col, .8); ln(g, [[0, 1], [0, -11.5]], shade(col, -.45), .7); g.restore(); };
  // gribouillis gravé (liste de points écran)
  const scrawl = (g, p, a = .7) => ln(g, p, `rgba(38,28,22,${a})`, .8);

  Object.assign(FDRAW, {
    /* ----- poulailler ----- */
    nichoir: g => {
      const Wd = '#b27a45', Wd2 = '#7a4a28', x0 = -.31, x1 = .31, y0 = -.17, y1 = .17, z0 = 8, z1 = 27;
      straws(g, ...pt(.02, .12, 0), 16, 20, 7, 11);
      [[x0 + .04, y0 + .04], [x1 - .04, y0 + .04], [x0 + .04, y1 - .04], [x1 - .04, y1 - .04]].forEach(([x, y]) => box(g, x, y, .05, .05, z0, 0, Wd2));
      box(g, 0, 0, x1 - x0, y1 - y0, z1 - z0, z0, Wd, 'wood');
      poly(g, [pt(x1, y0, z1), pt(x1, y1, z1), pt(x1, 0, z1 + 10)], shade(Wd, -.3), .9);
      // deux pondoirs en façade : paille, un œuf, des brins qui pendent
      const nest = (xa, xb, i) => {
        const xm = (xa + xb) / 2, hw = (xb - xa) / 2, H = [pt(xa, y1, z0 + 3)];
        for (let k = 0; k <= 10; k++) { const t = Math.PI - k / 10 * Math.PI; H.push(pt(xm + Math.cos(t) * hw, y1, z1 - 9 + Math.sin(t) * 5)); }
        H.push(pt(xb, y1, z0 + 3));
        path(g, H); const [, ya, , yb] = bbox(H), gr = g.createLinearGradient(0, ya, 0, yb); gr.addColorStop(0, '#120a05'); gr.addColorStop(1, '#3e2814'); g.fillStyle = gr; g.fill(); g.lineWidth = 1; g.strokeStyle = shade(Wd, -.6); g.stroke();
        for (let k = 0; k < 6; k++) { const [p, q] = pt(xa + .025 + k * (xb - xa - .05) / 5, y1, z0 + 4 + hash(k, i) * 2.5); ln(g, [[p - 2.2, q + .6], [p + 2.2, q - 1.4]], ['#e3c46e', '#c9a040', '#f0da94'][k % 3], 1); }
        if (i === 0) { const [p, q] = pt(xm, y1, z0 + 5.5); egg(g, p - .4, q, .95); }
        for (let k = 0; k < 5; k++) { const [p, q] = pt(xa + .03 + k * (xb - xa - .06) / 4, y1, z0 + 3), d = hash(k + i * 5, 7); ln(g, [[p, q - 1.2], [p - 2.4 + d * 4.8, q + 2.6 + d * 3.4]], ['#e3c46e', '#f0da94', '#c9a040'][k % 3], 1); }
      };
      nest(-.26, -.04, 0); nest(.04, .26, 1);
      inkLn(g, [pt(-.29, y1 + .04, z0 + 2), pt(.29, y1 + .04, z0 + 2)], '#c48c54', 1.3);
      // toit à deux pentes, bardeaux rouges
      const ex = .37, ey = .25, zr = z1 - 1, zk = z1 + 12, at = (x, f) => pt(x, ey * (1 - f), zr + (zk - zr) * f);
      poly(g, [pt(-ex, -ey, zr), pt(ex, -ey, zr), pt(ex, 0, zk), pt(-ex, 0, zk)], '#8a3a2a', 1);
      poly(g, [pt(-ex, ey, zr), pt(ex, ey, zr), pt(ex, 0, zk), pt(-ex, 0, zk)], '#b8553c', 1);
      for (let r = 0; r < 3; r++) {
        const f0 = r / 3, f1 = (r + 1) / 3;
        if (r) ln(g, [at(-ex, f0), at(ex, f0)], 'rgba(80,25,15,.45)', .8);
        for (let k = 0; k < 6; k++) { const x = -ex + (k + (r % 2) * .5 + .25) * ex / 3; ln(g, [at(x, f0), at(x, f1)], 'rgba(80,25,15,.32)', .7); }
      }
      inkLn(g, [pt(ex, -ey, zr), pt(ex, 0, zk), pt(ex, ey, zr)], '#9a4632', 1.1);
      inkLn(g, [pt(-ex, 0, zk + .6), pt(ex, 0, zk + .6)], '#7a3426', 1.5);
      moss(g, ...at(-.22, .3), 3, 2);
      feather(g, ...pt(-.2, .36, 0), -1.25, '#d0743a', .62);
      feather(g, ...pt(.3, .3, 0), 1.1, '#f2ead8', .5);
    },
    grain: g => {
      const gold = '#d9b56c', mix = ['#f0cc66', '#b88a44', '#f6e2a8', '#8a6a3a'];
      const seeds = (n, seed, cx, cy, rx, ry, r0 = .62) => { for (let i = 0; i < n; i++) { const t = hash(i, seed) * TAU, r = Math.sqrt(hash(seed, i)); ell(g, cx + Math.cos(t) * rx * r, cy + Math.sin(t) * ry * r, r0 * 1.3, r0, mix[i % 4], 0); } };
      const [a, b] = pt(-.1, -.08, 0), [c, d] = pt(.16, .17, 0);
      // sac de toile ouvert
      const sack = () => { g.beginPath(); g.moveTo(a - 13, b); g.bezierCurveTo(a - 18, b - 9, a - 15.5, b - 19, a - 11, b - 25); g.quadraticCurveTo(a, b - 22, a + 11, b - 26); g.bezierCurveTo(a + 16, b - 19, a + 18.5, b - 8, a + 13.5, b); g.quadraticCurveTo(a, b + 5.5, a - 13, b); g.closePath(); };
      sack(); g.fillStyle = radial(g, a - 5, b - 14, 21, '#c8a064'); fi(g, g.fillStyle, 1.1);
      g.save(); sack(); g.clip();
      for (let i = -24; i < 26; i += 2.4) ln(g, [[a + i, b - 30], [a + i + 4, b + 6]], 'rgba(95,62,25,.15)', .55);
      for (let j = -30; j < 8; j += 2.4) ln(g, [[a - 20, b + j], [a + 20, b + j - 3]], 'rgba(95,62,25,.11)', .55);
      g.restore();
      ln(g, [[a + 4, b - 21], [a + 6.5, b - 12], [a + 4.5, b + 1.5]], 'rgba(95,62,25,.4)', .9); ln(g, [[a - 9, b - 19], [a - 11, b - 9]], 'rgba(95,62,25,.32)', .8);
      // pièce cousue et tampon délavé
      poly(g, [[a - 10.5, b - 12.5], [a - 4, b - 13.5], [a - 3.5, b - 6.5], [a - 10, b - 5.5]], '#a87a48', .8);
      for (let k = 0; k < 4; k++) ln(g, [[a - 9.6 + k * 1.8, b - 14.2 - k * .25], [a - 9.4 + k * 1.8, b - 12.4 - k * .25]], 'rgba(60,35,15,.6)', .5);
      g.beginPath(); g.arc(a + 6.5, b - 9, 3.8, 0, TAU); g.strokeStyle = 'rgba(165,50,40,.5)'; g.lineWidth = .8; g.stroke();
      ln(g, [[a + 6.5, b - 6.2], [a + 6.5, b - 11.8]], 'rgba(165,50,40,.5)', .7);
      [[-1, -10.4], [1, -10.4], [-1, -8.6], [1, -8.6]].forEach(([dx, dy]) => ln(g, [[a + 6.5, b + dy + 1], [a + 6.5 + dx * 1.7, b + dy - .4]], 'rgba(165,50,40,.5)', .7));
      // col roulé, grain, pelle plantée
      ell(g, a, b - 25, 12, 4.8, '#dcbc86', 1);
      ell(g, a, b - 25.4, 9.4, 3.5, '#4e351c', .7);
      g.beginPath(); g.moveTo(a - 9, b - 24.8); g.quadraticCurveTo(a, b - 31, a + 9, b - 25.6); g.quadraticCurveTo(a, b - 21.6, a - 9, b - 24.8); g.closePath(); g.fillStyle = radial(g, a - 2, b - 28, 9, gold); fi(g, g.fillStyle, .7);
      seeds(22, 8, a, b - 26.4, 7, 2.2);
      inkLn(g, [[a + 2.5, b - 28], [a + 8.5, b - 38.5]], '#8a5a32', 1.5);
      poly(g, [[a - 2.4, b - 27.6], [a + 3.6, b - 30.8], [a + 5.4, b - 27.2], [a + .2, b - 24.4]], '#aab3bb', .8);
      // le grain qui a coulé : traînée le long du sac et petit tas bosselé
      [[9.5, -22], [11.4, -17.5], [12.8, -13], [13.8, -8.5], [14.4, -4.5]].forEach(([dx, dy], i) => ell(g, a + dx, b + dy, .9, .6, mix[i % 4], .3));
      g.beginPath(); g.ellipse(c, d, 12.5, 5, 0, 0, Math.PI);
      [[-12.5, 0], [-8, -5.2], [-2.5, -7.8], [3, -7], [8, -4.4], [12.5, 0]].reduce((p, q) => { g.quadraticCurveTo(c + (p[0] + q[0]) / 2, d + Math.min(p[1], q[1]) - 1.6, c + q[0], d + q[1]); return q; });
      g.closePath(); g.fillStyle = radial(g, c - 3, d - 5, 13, gold); fi(g, g.fillStyle, .8);
      seeds(46, 21, c, d - 2.4, 10, 3.6);
      seeds(9, 34, c + 1, d + 3.5, 16, 4, .7);
      // une souris se sert
      const m = c + 13, n = d - 1.5;
      ln(g, [[m + 4, n + .5], [m + 8, n - 1], [m + 10, n + 1.5]], '#c89aa0', .8);
      ell(g, m + 1.5, n - 1.8, 4.2, 3, '#9d969c', .8); ball(g, m - 2.6, n - 3.2, 2.4, '#a8a2a8', .7);
      ball(g, m - 1.4, n - 5.6, 1.5, '#e8a8b4', .5); ball(g, m - 4.9, n - 2.9, .65, '#e07080', 0); ball(g, m - 3.3, n - 3.8, .55, INK, 0);
    },
    juchoir: g => {
      const Wd = '#a8743e', Wd2 = '#7a4a28';
      straws(g, ...pt(0, .1, 0), 10, 18, 7, 5);
      [[-.12, .14, 3], [.14, .06, 5], [.0, .3, 8]].forEach(([x, y, s]) => { const [p, q] = pt(x, y, 0); g.beginPath(); for (let k = 0; k < 7; k++) { const t = k / 7 * TAU, r = 1.5 + hash(k, s) * 1.1; g[k ? 'lineTo' : 'moveTo'](p + Math.cos(t) * r, q + Math.sin(t) * r * .5); } g.closePath(); fi(g, '#e9e4d6', .4); ell(g, p - .5, q - .2, .7, .45, '#7a6a52', 0); });
      box(g, -.26, -.32, .06, .06, 46, 0, Wd2); box(g, .26, -.32, .06, .06, 46, 0, Wd2);
      box(g, 0, -.32, .6, .05, 4, 42, Wd2);
      [-.24, .24].forEach(x => inkLn(g, [pt(x, .36, 0), pt(x, -.29, 44)], Wd, 2.4));
      [.18, .4, .62, .84].forEach(t => { const y = .36 - .65 * t, z = 44 * t + 1.8; inkLn(g, [pt(-.34, y, z), pt(.34, y, z)], '#c8925a', 2); });
      feather(g, ...pt(.1, -.07, 32), .9, '#d0743a', .5);
    },

    /* ----- jardin des simples ----- */
    herbes: g => {
      const Zs = 13, at = (x, y) => pt(x, y, Zs);
      box(g, 0, 0, .76, .76, Zs, 0, '#8e5c34', 'wood');
      poly(g, [at(-.33, -.33), at(.33, -.33), at(.33, .33), at(-.33, .33)], '#4a3020', .8);
      for (let i = 0; i < 22; i++) { const [p, q] = at(-.3 + hash(i, 2) * .6, -.3 + hash(2, i) * .6); ell(g, p, q, 1.3, .7, i % 2 ? '#35210f' : '#634330', 0); }
      const leaf = (x, y, rot, rx, ry, col, lw = .6) => { g.save(); g.translate(x, y); g.rotate(rot); ell(g, 0, 0, rx, ry, col, lw); g.restore(); };
      const P = {
        lavande: ([p, q]) => {
          [[-3.5, -3, -.9], [3.5, -3, .9], [0, -4.5, 0], [-1.8, -2, -.4]].forEach(([dx, dy, r]) => leaf(p + dx, q + dy, r, 1.2, 3.8, '#8faa86', .5));
          for (let k = 0; k < 9; k++) { const a = (k - 4) * .15, h = 17 + hash(k, 5) * 5, tx = p + Math.sin(a) * h + (k - 4) * .5, ty = q - Math.cos(a) * h; ln(g, [[p + (k - 4) * .5, q], [tx, ty]], '#6f8f52', .8); leaf(tx, ty, a, 1.5, 4, k % 3 ? '#9b7ad6' : '#b494ea'); }
        },
        romarin: ([p, q]) => { for (let k = 0; k < 6; k++) { const a = (k - 2.5) * .2, h = 14 + hash(k, 9) * 5, x0 = p + (k - 2.5) * .7, x1 = p + Math.sin(a) * h, y1 = q - Math.cos(a) * h; ln(g, [[x0, q], [x1, y1]], '#4a6a3a', 1); for (let j = 1; j < 6; j++) { const f = j / 6, mx = x0 + (x1 - x0) * f, my = q + (y1 - q) * f; leaf(mx - 1.2, my, -1.1, .55, 1.9, '#3f6a34', .3); leaf(mx + 1.2, my, 1.1, .55, 1.9, '#4f7a40', .3); } } },
        ciboulette: ([p, q]) => { for (let k = 0; k < 11; k++) { const a = (k - 5) * .085, h = 15 + hash(k, 3) * 7, tx = p + Math.sin(a) * h, ty = q - Math.cos(a) * h; ln(g, [[p + (k - 5) * .45, q], [tx, ty]], k % 2 ? '#4c9a3c' : '#5fae48', 1.1); if (k % 3 === 1) { ball(g, tx, ty - 1, 2.3, '#c79ae2', .6); ball(g, tx - .6, ty - 1.7, .65, '#f0dcff', 0); } } },
        sauge: ([p, q]) => [[-5, -.5, -1.4], [5, -1, 1.4], [-4.5, -4, -1.1], [4.5, -4, 1.1], [-2.2, -7.5, -.5], [2.6, -8, .5], [0, -10.5, 0], [0, -4, 0]].forEach(([dx, dy, r]) => { leaf(p + dx, q + dy, r, 2, 4.2, '#98ae8a'); }),
        persil: ([p, q]) => { [[-4, -3], [4, -3], [0, -2], [-2.4, -7], [2.6, -7], [0, -10], [-5, -7.5], [5, -7.5]].forEach(([dx, dy], i) => { ln(g, [[p + dx * .3, q], [p + dx, q + dy]], '#4f8f3a', .7); [[-1.1, 0], [1.1, 0], [0, -1.2]].forEach(([u, v]) => ball(g, p + dx + u, q + dy + v, 1.3, i % 2 ? '#4fa63e' : '#62b84c', .45)); }); },
        basilic: ([p, q]) => [[-4, -2], [4, -2], [0, -1], [-2.2, -6], [2.6, -6], [0, -9.5], [-5, -6.5], [5, -7]].forEach(([dx, dy], i) => { ell(g, p + dx, q + dy, 3.2, 2.4, i % 2 ? '#5fae44' : '#72c052', .6); ln(g, [[p + dx - 1.6, q + dy + .4], [p + dx + 1.4, q + dy - .3]], 'rgba(30,80,20,.45)', .5); }),
        belladone: ([p, q]) => { [[-3.5, -3.5, -.8], [3.5, -4, .8], [0, -7.5, 0], [-1, -2, -.2]].forEach(([dx, dy, r]) => leaf(p + dx, q + dy, r, 2.3, 4.4, '#3a6430')); [[-2, -5.6], [1.8, -6.6], [.2, -3.4], [2.8, -3]].forEach(([dx, dy]) => { ball(g, p + dx, q + dy, 1.6, '#2c1838', .6); ball(g, p + dx - .55, q + dy - .55, .5, '#fff', 0); }); },
      };
      [[-.19, -.19, 'lavande'], [.15, -.21, 'romarin'], [-.22, .13, 'sauge'], [-.03, -.03, 'ciboulette'], [.2, .0, 'persil'], [-.02, .22, 'belladone'], [.2, .2, 'basilic']]
        .sort((u, v) => u[0] + u[1] - v[0] - v[1]).forEach(([x, y, k]) => P[k](at(x, y)));
      // étiquette à tête de mort plantée devant la belladone (on ne la cueille pas)
      const [p, q] = at(-.2, .31);
      inkLn(g, [[p, q + 1], [p, q - 7]], '#c9ad7f', .8);
      rrect(g, p - 4, q - 12, 8, 5.5, 1, '#efe2c2', .7);
      ball(g, p, q - 9.6, 1.6, '#fbf8f1', .5); ball(g, p - .6, q - 9.8, .4, INK, 0); ball(g, p + .6, q - 9.8, .4, INK, 0);
    },
    melon: g => {
      blob(g, 0, 0, .42, 11, .3, 12, .16); g.fillStyle = radial(g, 0, 0, 22, '#6e4c2e'); fi(g, g.fillStyle, 1);
      straws(g, 0, 0, 30, 18, 8, 5, 2.6);
      const sprout = (p, q, s = 1) => { ln(g, [[p, q], [p + .3, q - 5 * s]], '#5a9a3a', 1.1); [-1, 1].forEach(sd => { g.save(); g.translate(p + .3 + sd * 2.5 * s, q - 5.6 * s); g.rotate(sd * .55); ell(g, 0, 0, 2.7 * s, 1.5 * s, '#7cc458', .6); g.restore(); }); };
      // cloche de verre : pousses dessous, verre teinté, reflets, buée
      const cloche = (x, y, s, seed) => {
        const [p, q] = pt(x, y, .5), R = 11 * s, Hh = 19 * s;
        sprout(p - 2 * s, q + .8 * s, s); sprout(p + 3.4 * s, q - 1.2 * s, .75 * s);
        const dome = () => { g.beginPath(); g.moveTo(p - R, q); g.bezierCurveTo(p - R, q - Hh * .72, p - R * .6, q - Hh, p, q - Hh); g.bezierCurveTo(p + R * .6, q - Hh, p + R, q - Hh * .72, p + R, q); g.ellipse(p, q, R, R * .42, 0, 0, Math.PI); g.closePath(); };
        dome(); const gr = g.createLinearGradient(p - R, 0, p + R, 0); gr.addColorStop(0, 'rgba(232,246,255,.5)'); gr.addColorStop(.38, 'rgba(205,234,250,.18)'); gr.addColorStop(1, 'rgba(150,190,215,.42)'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#4f6f86'; g.lineWidth = 1; g.stroke();
        g.beginPath(); g.ellipse(p, q, R, R * .42, 0, Math.PI, TAU); g.strokeStyle = 'rgba(79,111,134,.5)'; g.lineWidth = .7; g.stroke();
        g.beginPath(); g.moveTo(p - R * .64, q - Hh * .25); g.quadraticCurveTo(p - R * .68, q - Hh * .8, p - R * .18, q - Hh * .92); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1.5 * s; g.lineCap = 'round'; g.stroke();
        ln(g, [[p + R * .62, q - Hh * .5], [p + R * .5, q - Hh * .72]], 'rgba(255,255,255,.6)', 1);
        for (let i = 0; i < 6; i++) ball(g, p + (hash(i, seed) - .35) * R * 1.2, q - Hh * (.25 + hash(seed, i) * .45), .55, 'rgba(255,255,255,.55)', 0);
        ball(g, p, q - Hh - 1.5 * s, 2.4 * s, '#cfe6f2', .8);
      };
      cloche(-.25, -.02, .92, 3); cloche(.03, -.25, .86, 7);
      // un petit melon brodé qui n'a pas attendu
      const [m, n] = pt(.16, .19, 0);
      g.beginPath(); g.moveTo(m - 6, n - 2); g.bezierCurveTo(m - 11, n - 5, m - 6, n - 9, m - 9.5, n - 10.5); g.strokeStyle = '#4f8a32'; g.lineWidth = .9; g.stroke();
      ell(g, m + 6.5, n - 2.5, 6, 3.4, '#4f8f3a', .8); ln(g, [[m + 2, n - 2.4], [m + 10, n - 3]], 'rgba(20,60,15,.4)', .6);
      ell(g, m, n - 4.5, 7, 5.6, '#c3c66a', 1);
      [-4.5, -1.5, 1.5, 4.5].forEach(dx => { g.beginPath(); g.moveTo(m + dx * .45, n - 10); g.quadraticCurveTo(m + dx * 1.2, n - 4.5, m + dx * .45, n + 1); g.strokeStyle = '#6a8a3a'; g.lineWidth = 1; g.stroke(); });
      for (let i = 0; i < 6; i++) ball(g, m - 4 + hash(i, 4) * 8, n - 7.5 + hash(4, i) * 5.5, .45, 'rgba(255,250,220,.7)', 0);
      inkLn(g, [[m + .5, n - 9.8], [m + 1.5, n - 12]], '#6a7a32', 1);
    },
    arrosoir: g => {
      const Zc = '#a7b1b9', bx = -.08, by = .02, r = .17, h = 17;
      const [fx, fy] = pt(.31, -.02, 0);
      blob(g, .31, -.02, .15, 6, .1, 9, .55); g.fillStyle = 'rgba(52,96,120,.78)'; g.fill(); g.strokeStyle = 'rgba(175,225,250,.5)'; g.lineWidth = .7; g.stroke();
      ln(g, [[fx - 4, fy - .6], [fx + 1, fy - 1.2]], 'rgba(220,245,255,.55)', .9); ripple(g, fx + 1, fy + .4, 3.2, .7);
      // bec verseur et pomme
      const [s0, t0] = pt(bx + .1, by + .06, 4), [s1, t1] = pt(.3, -.04, 22), an = Math.atan2(t1 - t0, s1 - s0);
      inkLn(g, [[s0, t0], [s1, t1]], Zc, 2.4);
      g.save(); g.translate(s1, t1); g.rotate(an);
      poly(g, [[-1.2, -1.6], [3, -3.8], [3, 3.8], [-1.2, 1.6]], shade(Zc, -.08), .8);
      ell(g, 3.2, 0, 1.4, 3.8, '#8a949c', .8); [-2, 0, 2].forEach(d => ball(g, 3.5, d, .35, '#3a4048', 0));
      g.restore();
      // corps en zinc cabossé
      cyl(g, bx, by, r, h, 0, Zc);
      [2.5, h - 2.2].forEach(z => hoop(g, bx, by, r, z, '#7f8991'));
      const [cx, cy] = pt(bx, by, 0);
      ell(g, cx - 3.2, cy - 9.5, 3.2, 2.5, 'rgba(45,55,65,.3)', 0); g.beginPath(); g.ellipse(cx - 3.2, cy - 9.5, 3.2, 2.5, 0, .4, 2.3); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = .8; g.stroke();
      ell(g, cx + 4.5, cy - 4.5, 1.8, 1.4, 'rgba(45,55,65,.28)', 0);
      rrect(g, cx + 2.4, cy - 13.4, 4.4, 4, .6, '#98a2aa', .6); [[3.2, -12.6], [6, -12.6], [3.2, -10.2], [6, -10.2]].forEach(([dx, dy]) => ball(g, cx + dx, cy + dy, .35, '#5a626a', 0));
      // ouverture et anse
      const [tx, ty] = pt(bx, by, h); ell(g, tx - 2.5, ty - .2, 4.8, 2, '#353b42', .7);
      g.beginPath(); g.moveTo(tx - 6.2, ty - 1.4); g.bezierCurveTo(tx - 7.5, ty - 15, tx + 6.5, ty - 15, tx + 5.6, ty + 1.2); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 3.6; g.stroke(); g.strokeStyle = Zc; g.lineWidth = 1.8; g.stroke();
      // gouttes
      drop(g, s1 + 5.5, t1 + 7, .8); drop(g, s1 + 3, t1 + 13.5, .9); drop(g, s1 + 6, t1 + 18.5, .7);
      // un escargot fait la course
      const [ex, ey] = pt(-.3, .22, 0);
      g.beginPath(); g.moveTo(ex - 4, ey); g.quadraticCurveTo(ex - 1, ey - 2.6, ex + 3.5, ey - 1.2); g.lineTo(ex + 5, ey - 3.6); g.lineTo(ex + 4.6, ey - .4); g.quadraticCurveTo(ex, ey + 1, ex - 4, ey); g.closePath(); fi(g, '#cdbb9a', .6);
      ln(g, [[ex + 4.6, ey - 3], [ex + 5.6, ey - 5.4]], '#7a6a50', .5); ball(g, ex + 5.7, ey - 5.6, .5, INK, 0);
      ball(g, ex - .6, ey - 3.4, 2.9, '#c8884a', .7); g.beginPath(); g.arc(ex - .6, ey - 3.4, 1.6, 0, Math.PI * 1.6); g.strokeStyle = '#7a4a22'; g.lineWidth = .7; g.stroke();
    },

    /* ----- mare ----- */
    roseaux: g => {
      water(g, .02, .06, .34, 4);
      const [hx, hy] = pt(.02, -.02, .4);
      g.beginPath(); g.ellipse(hx, hy, 14, 5.6, 0, 0, TAU); g.fillStyle = radial(g, hx - 3, hy - 2, 14, '#5c5a34'); fi(g, g.fillStyle, .9);
      [[-13, 4, 4], [11, 5, 5], [-2, 7.5, 6], [16, -1, 3]].forEach(([dx, dy, w]) => ripple(g, hx + dx, hy + dy, w, .55));
      const reed = ([x, y, h, l, c, w = 1.7]) => { const [p, q] = pt(x, y, .5); blade(g, p, q, p + l, q - h, p + l * .15, q - h * .55, w, c, .7); };
      const cat = ([x, y, h, l]) => { const [p, q] = pt(x, y, .5), an = Math.atan2(l, h); inkLn(g, [[p, q], [p + l * .4, q - h * .5], [p + l, q - h]], '#7c9c4a', 1.1); g.save(); g.translate(p + l * .78, q - h * .74); g.rotate(an * .9); rrect(g, -2.3, -7, 4.6, 14, 2.3, '#6e4024', .8); ln(g, [[-1, -5], [-1, 4]], 'rgba(255,220,180,.35)', .8); g.restore(); };
      [[-.24, -.1, 38, -9, '#4a7230'], [-.1, -.22, 46, -4, '#557d34'], [.08, -.22, 42, 6, '#4a7230'], [.22, -.1, 36, 10, '#557d34']].forEach(reed);
      [[-.12, -.1, 52, -3], [.06, -.08, 58, 2], [.2, 0, 48, 6]].forEach(cat);
      [[-.2, .02, 34, -12, '#6a9a3e', 2], [0, -.04, 48, -2, '#6a9a3e', 2], [.16, .06, 40, 9, '#78a844', 2]].forEach(reed);
      [[-.26, .16, 22, -8, '#86b04c'], [-.06, .18, 27, -3, '#7aa848'], [.14, .18, 21, 6, '#86b04c'], [.28, .08, 18, 9, '#7aa848']].forEach(reed);
      // une libellule se pose
      const [dx, dy] = [-15, -47];
      [[-1, -.5], [1, -.35]].forEach(([s, r]) => { g.save(); g.translate(dx + 1.5, dy - .5); g.rotate(r * s); ell(g, 0, -3.2 * s, 1.3, 3.4, 'rgba(220,240,255,.75)', .5); g.rotate(.5 * s); ell(g, 0, -3 * s, 1.1, 3, 'rgba(220,240,255,.65)', .5); g.restore(); });
      inkLn(g, [[dx - 3, dy + 1.2], [dx + 4.5, dy - 1]], '#3a8ad0', 1.1); ball(g, dx + 5.2, dy - 1.2, 1.2, '#2a6ab0', .6);
    },
    ponton: g => {
      const D = 7, Wd = '#a8743e', Wd2 = '#6a4426';
      water(g, .16, .06, .34, 9);
      [[-.04, -.15], [.3, -.15]].forEach(([x, y]) => box(g, x, y, .05, .05, D, 0, Wd2));
      box(g, -.06, -.12, .82, .035, 2.4, D - 2.4, Wd2);
      [[-.04, .15], [.3, .15]].forEach(([x, y]) => { const [p, q] = pt(x, y, 0); ripple(g, p, q + 1, 4.2, .55); box(g, x, y, .05, .05, D, 0, Wd2); });
      box(g, -.06, .12, .82, .035, 2.4, D - 2.4, Wd2);
      for (let i = 0; i < 8; i++) box(g, -.43 + i * .1, 0, .088, .34, 2, D, i % 3 === 1 ? '#9a6838' : i % 3 === 2 ? '#b8844e' : Wd, 'wood');
      // seau (avec la seule prise de la journée)
      cyl(g, -.22, -.07, .075, 7, D + 2, '#8a5a32', '#3a2414'); hoop(g, -.22, -.07, .075, D + 4, '#4a4850');
      const [fp, fq] = pt(-.22, -.07, D + 9); poly(g, [[fp - 1, fq + 1], [fp + 1, fq - 4], [fp + 4.4, fq - 6], [fp + 2.6, fq - 2.6], [fp + 5, fq - 1]], '#8fb0c8', .7);
      // canne à pêche posée sur une fourche, ligne et bouchon
      inkLn(g, [pt(.27, -.06, D + 2), pt(.27, -.06, D + 7.4)], Wd2, .9); ln(g, [pt(.27, -.06, D + 7.2), pt(.25, -.07, D + 9.6)], Wd2, .8); ln(g, [pt(.27, -.06, D + 7.2), pt(.29, -.05, D + 9.8)], Wd2, .8);
      const A = pt(-.34, .1, D + 2.5), T = pt(.52, -.126, D + 10.3);
      inkLn(g, [A, T], '#c49058', 1); inkLn(g, [A, pt(-.22, .068, D + 3.6)], '#5a3a22', 1.6);
      const [ra, rb] = pt(-.2, .065, D + 3.6); g.beginPath(); g.arc(ra, rb + 1.4, 1.6, 0, TAU); g.strokeStyle = INK; g.lineWidth = 1.6; g.stroke(); g.strokeStyle = '#9aa0aa'; g.lineWidth = .8; g.stroke();
      const F = pt(.42, .25, .3);
      g.beginPath(); g.moveTo(...T); g.quadraticCurveTo(T[0] - 3, F[1] - 8, F[0], F[1] - 2); g.strokeStyle = 'rgba(240,240,230,.75)'; g.lineWidth = .6; g.stroke();
      ripple(g, F[0], F[1] + .8, 5, .6); ripple(g, F[0], F[1] + 1.4, 8, .3);
      g.beginPath(); g.arc(F[0], F[1] - 1.2, 1.9, Math.PI, 0); g.closePath(); fi(g, '#d8382a', .7); g.beginPath(); g.arc(F[0], F[1] - 1.2, 1.9, 0, Math.PI); g.closePath(); fi(g, '#fffaf0', .7);
    },

    /* ----- petit cimetière ----- */
    tombe: g => {
      const ST = '#8e8a84', xc = -.02, yc = -.14, U = 38, a = .2, th = .08;
      // stèle de travers : profil en arc, incliné, extrudé vers l'arrière
      const prof = [[-7, -3]]; for (let i = 0; i <= 12; i++) { const t = Math.PI - i / 12 * Math.PI; prof.push([Math.cos(t) * 7, 23 + Math.sin(t) * 7.5]); } prof.push([7, -3]);
      const W3 = (u, v, dy) => { const ur = u * Math.cos(a) + v * Math.sin(a), vr = Math.max(0, -u * Math.sin(a) + v * Math.cos(a)); return pt(xc + ur / U, yc + dy - vr * .0024, vr); };
      const F = prof.map(([u, v]) => W3(u, v, th / 2)), B = prof.map(([u, v]) => W3(u, v, -th / 2));
      path(g, B); g.fillStyle = shade(ST, -.42); g.fill();
      for (let i = 0; i < F.length - 1; i++) { const c = prof[i][1] > 22 && prof[i + 1][1] > 22 ? shade(ST, .06) : shade(ST, -.32); path(g, [F[i], F[i + 1], B[i + 1], B[i]]); g.fillStyle = c; g.fill(); g.strokeStyle = c; g.lineWidth = .5; g.stroke(); }
      g.beginPath(); B.slice(1, -1).forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](...p)); g.strokeStyle = shade(ST, -.62); g.lineWidth = 1; g.stroke();
      poly(g, F, ST, 1);
      const E = (u, v) => W3(u, v, th / 2 + .002);
      // R.I.P et gribouillis (dont un nom rayé)
      [[[-5.2, 19.6], [-5.2, 26], [-3.1, 26], [-2.5, 24.6], [-3.1, 23.2], [-5.2, 23.2]], [[-4, 23.2], [-2.5, 19.6]], [[-.6, 19.6], [-.6, 26]], [[1.4, 19.6], [1.4, 26], [3.4, 26], [4, 24.6], [3.4, 23.2], [1.4, 23.2]]].forEach(s => scrawl(g, s.map(([u, v]) => E(u, v)), .8));
      scrawl(g, [[-5, 16], [-3.5, 16.9], [-2, 15.4], [-.5, 16.6], [1, 15.5], [2.5, 16.5], [4.5, 15.8]].map(([u, v]) => E(u, v)), .6);
      scrawl(g, [[-4, 12], [-2.5, 12.8], [-1, 11.6], [.5, 12.6], [2, 11.8]].map(([u, v]) => E(u, v)), .6);
      scrawl(g, [[-4.4, 12.6], [2.6, 11.4]].map(([u, v]) => E(u, v)), .75);
      ln(g, [E(4.6, 27.5), E(3.2, 21), E(4.2, 17)], 'rgba(30,22,18,.5)', .7);
      // mousse sur l'arrondi et au pied
      [[-5.5, 26.5, 2.6, 1], [-2, 29.8, 2.2, 2], [4.6, 27.6, 2, 3], [-6.4, 2, 2.6, 4], [5.6, .6, 2, 5]].forEach(([u, v, r, s]) => moss(g, ...E(u, v), r, s));
      // tertre fraîchement retourné, touffes, et un locataire qui offre une pâquerette
      const [mx, my] = pt(.04, .16, 0), rot = Math.atan2(16, -32);
      g.beginPath(); g.ellipse(mx, my, 12, 5.4, rot, 0, TAU); g.fillStyle = radial(g, mx, my - 2, 12, '#6a5038'); fi(g, g.fillStyle, 1);
      g.beginPath(); g.ellipse(mx + .4, my - 1.6, 9.5, 3.8, rot, 0, TAU); g.fillStyle = '#76593e'; g.fill();
      g.beginPath(); g.ellipse(mx + .8, my - 2.8, 5.5, 2, rot, 0, TAU); g.fillStyle = '#82654a'; g.fill();
      [[-3, -2, 1.1, 1], [3, 1, .9, 2], [-6, 3, .8, 3], [5, -1.5, .7, 4]].forEach(([dx, dy, r]) => ell(g, mx + dx, my + dy - 2, r * 1.6, r, '#5a4230', 0));
      tuft(g, ...pt(-.24, -.06, 0), .9); tuft(g, ...pt(.26, -.2, 0), .8, '#557f3a'); tuft(g, ...pt(.24, .3, 0), .7);
      const hx = mx - 6, hy = my + 2.4;
      ell(g, hx, hy + .4, 3.2, 1.3, '#3e2e20', 0);
      inkLn(g, [[hx, hy], [hx + .6, hy - 4.5]], PAL.bone, 1.2);
      ell(g, hx + .8, hy - 6, 2.2, 1.7, PAL.bone, .7);
      [[-1.6, -1.2], [-.5, -2.1], [.8, -2.2], [1.9, -1.1]].forEach(([dx, dy]) => inkLn(g, [[hx + .8 + dx, hy - 7], [hx + .8 + dx * 1.3, hy - 7 + dy * 1.5]], PAL.bone, .55));
      ln(g, [[hx + 1.2, hy - 8], [hx + 2.6, hy - 15]], '#5a9a3a', .9);
      for (let k = 0; k < 7; k++) { const t = k / 7 * TAU; ell(g, hx + 2.6 + Math.cos(t) * 1.9, hy - 15.5 + Math.sin(t) * 1.4, 1.1, .7, '#fffaf0', .4); }
      ball(g, hx + 2.6, hy - 15.5, 1, '#f2c230', .4);
    },
    saule: g => {
      // voile de feuillage : dôme puis franges qui pendent (coordonnées écran)
      const vpath = (cx, w, top, y0, len, n, seed) => {
        g.beginPath(); g.moveTo(cx - w, y0);
        g.bezierCurveTo(cx - w * 1.05, top + (y0 - top) * .3, cx - w * .55, top, cx, top);
        g.bezierCurveTo(cx + w * .55, top, cx + w * 1.05, top + (y0 - top) * .3, cx + w, y0);
        for (let i = 0; i < n; i++) {
          const xa = cx + w - i * 2 * w / n, xb = xa - 2 * w / n, L = len * (.5 + hash(i, seed) * .9);
          g.quadraticCurveTo(xa - (xa - xb) * .12, y0 + L * .85, (xa + xb) / 2 + (hash(i, seed + 2) - .5) * 2, y0 + L);
          g.quadraticCurveTo(xb + (xa - xb) * .12, y0 + L * .85, xb, y0 + (i < n - 1 ? (hash(seed, i + 1) - .5) * 6 : 0));
        }
        g.closePath();
      };
      const veil = (cx, w, top, y0, len, n, col, seed, lines = '170,205,150') => {
        vpath(cx, w, top, y0, len, n, seed); g.fillStyle = radial(g, cx - w * .25, top + (y0 - top) * .35, w * 1.25, col); fi(g, g.fillStyle, 1.1);
        g.save(); vpath(cx, w, top, y0, len, n, seed); g.clip();
        for (let k = 0; k < n * 2; k++) { const x = cx - w + (k + .5) * w / n + (hash(k, seed + 5) - .5) * 2, y1 = y0 + len * 1.4; g.beginPath(); g.moveTo(x - 1, top + (y0 - top) * (.15 + hash(seed, k) * .3)); g.quadraticCurveTo(x + 1.5, (top + y1) / 2, x, y1); g.strokeStyle = `rgba(${lines},${.18 + hash(k, seed) * .2})`; g.lineWidth = .8; g.stroke(); }
        g.restore();
      };
      veil(2, 45, -104, -56, 34, 17, '#203a2c', 1);
      // racines et tronc noueux
      [[-6, 0, -17, 4], [6, 0, 16, 5], [0, 2, -5, 7]].forEach(([x, y, tx, ty]) => blade(g, x, y, tx, ty, (x + tx) / 2, y - 2, 3.4, '#4a3a2e', .9));
      g.beginPath(); g.moveTo(-8.5, 1.5); g.bezierCurveTo(-5.5, -9, -8, -22, -6, -34); g.lineTo(-15, -60); g.lineTo(-9.5, -62); g.lineTo(-1.5, -44); g.lineTo(3.5, -64); g.lineTo(9, -62); g.lineTo(5, -36); g.bezierCurveTo(7, -22, 5, -9, 9, 1.5); g.quadraticCurveTo(0, 4, -8.5, 1.5); g.closePath();
      g.fillStyle = radial(g, -3, -22, 26, '#5a4636'); fi(g, g.fillStyle, 1.1);
      [[[-4, -2], [-3, -13], [-5, -27]], [[2, -4], [3.5, -16], [2, -30]], [[-2, -40], [-6, -50]]].forEach(p => ln(g, p, 'rgba(20,12,8,.45)', .8));
      // un creux habité
      ell(g, 1, -24, 2.8, 3.8, '#120c08', .7); ell(g, .1, -24.6, .75, .55, '#ffd84a', 0); ell(g, 2, -24.6, .75, .55, '#ffd84a', 0);
      // rideaux qui pendent de la couronne, puis la couronne
      veil(-28, 17, -88, -42, 30, 9, '#2c4c34', 2);
      veil(29, 16, -86, -40, 32, 9, '#2c4c34', 3);
      veil(0, 33, -107, -80, 18, 13, '#365a3a', 4, '190,225,165');
    },
    mausolee: g => {
      const ST = '#8d8880', S2 = shade(ST, .1), yf = .25, zt = 32;
      box(g, 0, .02, .74, .7, 4, 0, shade(ST, -.16), 'stone');
      box(g, 0, -.04, .6, .58, zt - 4, 4, ST, 'stone');
      // lierre sur le flanc droit
      const ivy = [[.3, .2, 5], [.3, .14, 11], [.3, .19, 17], [.3, .12, 23], [.3, .17, 29]];
      ln(g, ivy.map(([x, y, z]) => pt(x + .004, y, z)), '#3f6a2e', .9);
      ivy.forEach(([x, y, z], i) => { const [p, q] = pt(x + .004, y, z); ell(g, p + (i % 2 ? 1.6 : -1.4), q - .4, 1.8, 1.3, i % 2 ? '#4f8a3a' : '#5f9a44', .5); });
      // porte en arc, grille, nuit verte derrière
      const door = [pt(-.12, yf, 4)]; for (let i = 0; i <= 12; i++) { const t = Math.PI - i / 12 * Math.PI; door.push(pt(Math.cos(t) * .12, yf, 20 + Math.sin(t) * 6.5)); } door.push(pt(.12, yf, 4));
      path(g, door); const [, d0, , d1] = bbox(door), gr = g.createLinearGradient(0, d0, 0, d1); gr.addColorStop(0, '#050a08'); gr.addColorStop(1, '#173a28'); g.fillStyle = gr; g.fill();
      for (let i = 0; i <= 6; i++) { const t = Math.PI - i / 6 * Math.PI; ln(g, [pt(Math.cos(t) * .12, yf, 20 + Math.sin(t) * 6.5), pt(Math.cos(t) * .16, yf, 20 + Math.sin(t) * 9.5)], 'rgba(40,30,25,.5)', .8); }
      g.beginPath(); door.slice(1, -1).forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](...p)); g.strokeStyle = shade(ST, -.55); g.lineWidth = 1.1; g.stroke();
      [-.08, -.04, 0, .04, .08].forEach(x => inkLn(g, [pt(x, yf + .004, 4.5), pt(x, yf + .004, 20 + Math.sqrt(1 - (x / .12) ** 2) * 6.5 - .8)], '#55535c', .7));
      inkLn(g, [pt(-.115, yf + .004, 13), pt(.115, yf + .004, 13)], '#55535c', .7);
      ball(g, ...pt(.05, yf + .01, 11), 1.1, '#c9a646', .4);
      [-.235, .235].forEach(x => box(g, x, yf + .015, .07, .04, zt - 4, 4, S2, 'stone'));
      ln(g, [pt(-.19, yf + .005, 29), pt(-.165, yf + .005, 25.5), pt(-.185, yf + .005, 23)], 'rgba(30,22,18,.6)', .8);
      // corniche à l'épitaphe illisible
      box(g, 0, -.04, .68, .66, 4, zt, S2, 'stone');
      scrawl(g, [-.2, -.14, -.08, -.02, .04, .1, .17].map((x, i) => pt(x, .292, zt + 1.6 + (i % 2) * 1.1)), .55);
      // toit à fronton, crâne dans l'oculus
      const yb = -.37, yp = .29, zr = zt + 4, zk = zr + 14, ex = .34;
      poly(g, [pt(0, yb, zk), pt(0, yp, zk), pt(ex, yp, zr), pt(ex, yb, zr)], shade(ST, -.3), 1);
      [.25, .5, .75].forEach(f => ln(g, [pt(ex * f, yb, zk - (zk - zr) * f), pt(ex * f, yp, zk - (zk - zr) * f)], 'rgba(30,22,18,.42)', .8));
      for (let k = 1; k < 7; k++) { const y = yb + (yp - yb) * k / 7; ln(g, [pt(.02, y, zk - 1), pt(ex - .02, y, zr + 1)], 'rgba(255,245,230,.16)', .7); }
      poly(g, [pt(-ex, yp, zr), pt(ex, yp, zr), pt(0, yp, zk)], S2, 1);
      const [oc, od] = pt(0, yp + .003, zr + 5.2);
      ell(g, oc, od, 3.7, 3.5, shade(ST, -.3), .8); ball(g, oc, od - .2, 2.3, PAL.bone, .6);
      ell(g, oc - .85, od - .4, .6, .7, INK, 0); ell(g, oc + .85, od - .4, .6, .7, INK, 0); ln(g, [[oc - .7, od + 1.5], [oc + .7, od + 1.5]], INK, .5);
      ball(g, ...pt(0, yp, zk + 1.6), 1.9, S2, .7);
      moss(g, ...pt(-.26, .29, zr + 1), 2.6, 5); moss(g, ...pt(.2, .0, zr + 6), 2.4, 6); moss(g, ...pt(-.31, .3, 4.5), 2.4, 7); moss(g, ...pt(.06, .33, 4.3), 2, 8);
      // bougie verdâtre sur la marche, lueur posée sur la pierre
      const [bx, by] = pt(.2, .31, 4);
      g.save(); g.globalCompositeOperation = 'source-atop'; const hg = g.createRadialGradient(bx, by - 12, 0, bx, by - 12, 15); hg.addColorStop(0, 'rgba(140,255,180,.55)'); hg.addColorStop(1, 'rgba(140,255,180,0)'); g.fillStyle = hg; g.fillRect(bx - 15, by - 27, 30, 30); g.restore();
      ell(g, bx, by, 3.6, 1.5, '#cde6bc', .6);
      rrect(g, bx - 1.7, by - 8, 3.4, 8, 1, '#b9dc9e', .8);
      [[-1.2, -6.5, 2.4], [1.1, -7.6, 3.4]].forEach(([dx, dy, l]) => ln(g, [[bx + dx, by + dy], [bx + dx, by + dy + l]], '#d8f0c8', .9));
      ln(g, [[bx, by - 8], [bx, by - 9.6]], INK, .6);
      g.beginPath(); g.moveTo(bx, by - 17); g.bezierCurveTo(bx + 2.8, by - 12.8, bx + 2.2, by - 9.6, bx, by - 9.4); g.bezierCurveTo(bx - 2.2, by - 9.6, bx - 2.8, by - 12.8, bx, by - 17); g.fillStyle = '#5fe39a'; fi(g, '#5fe39a', .7);
      g.beginPath(); g.moveTo(bx, by - 14); g.bezierCurveTo(bx + 1.3, by - 11.8, bx + 1, by - 10.2, bx, by - 10.1); g.bezierCurveTo(bx - 1, by - 10.2, bx - 1.3, by - 11.8, bx, by - 14); g.fillStyle = '#eafff2'; g.fill();
    },

    /* ----- déco d'extérieur ----- */
    banc: g => {
      const ST = '#9a948a';
      tuft(g, ...pt(-.3, .2, 0), .9); tuft(g, ...pt(.18, .24, 0), .8, '#557f3a');
      box(g, -.25, .02, .1, .24, 11, 0, shade(ST, -.08), 'stone'); box(g, .25, .02, .1, .24, 11, 0, shade(ST, -.08), 'stone');
      box(g, 0, .02, .76, .3, 4, 11, ST, 'stone');
      box(g, 0, -.11, .72, .06, 12, 15, shade(ST, .04), 'stone');
      // un cœur gravé, des initiales, de la mousse partout
      const [hx, hy] = pt(.12, -.077, 21);
      g.beginPath(); g.moveTo(hx, hy + 2.4); g.bezierCurveTo(hx - 3.4, hy, hx - 2.2, hy - 2.8, hx, hy - 1.2); g.bezierCurveTo(hx + 2.2, hy - 2.8, hx + 3.4, hy, hx, hy + 2.4); g.strokeStyle = 'rgba(50,40,32,.6)'; g.lineWidth = .8; g.stroke();
      scrawl(g, [pt(-.2, -.077, 20), pt(-.17, -.077, 22.5), pt(-.14, -.077, 19.6), pt(-.1, -.077, 22)], .5);
      moss(g, ...pt(-.3, -.11, 27), 2.8, 1); moss(g, ...pt(.08, -.11, 27.4), 2.4, 2); moss(g, ...pt(-.36, .14, 15), 2.6, 3); moss(g, ...pt(.3, .16, 14.6), 2.2, 4); moss(g, ...pt(-.25, .15, 4), 2.4, 5);
      // un pissenlit au pied
      const [p, q] = pt(.04, .26, 0); ln(g, [[p, q], [p + 1, q - 9]], '#5a9a3a', .8); ball(g, p + 1, q - 10, 2.2, '#f2d03a', .6);
      blade(g, p - 1, q, p - 5, q - 2.5, p - 3, q - 1, 1, '#6aa04a', .5); blade(g, p + 1, q, p + 5, q - 2, p + 3, q - 1, 1, '#6aa04a', .5);
    },
    puits: g => {
      const ST = '#8f877b', Wd = '#8a5a32', R0 = .33, zw = 17;
      tuft(g, ...pt(-.36, .24, 0), .9); tuft(g, ...pt(.3, .3, 0), .8, '#557f3a');
      cyl(g, 0, 0, R0, zw, 0, ST);
      const [cx, cy] = pt(0, 0, 0), RX = R0 * 45, RY = R0 * 22.5;
      [6, 11.5].forEach(z => { g.beginPath(); g.ellipse(cx, cy - z, RX, RY, 0, .04, Math.PI - .04); g.strokeStyle = 'rgba(35,25,18,.42)'; g.lineWidth = .8; g.stroke(); });
      [[0, 6, 0], [6, 11.5, .5], [11.5, zw, 0]].forEach(([z0, z1, off]) => { for (let k = 0; k < 6; k++) { const an = (k + off + .5) / 6 * Math.PI; if (an < .15 || an > Math.PI - .15) continue; const x = cx + Math.cos(an) * RX, y = cy + Math.sin(an) * RY; ln(g, [[x, y - z0 - .5], [x, y - z1 + .5]], 'rgba(35,25,18,.38)', .8); } });
      moss(g, cx - 9, cy + 3, 3, 1); moss(g, cx + 11, cy - 1, 2.4, 2);
      const [hx, hy] = pt(0, 0, zw);
      ell(g, hx, hy, RX * .74, RY * .74, '#0b1216', .9);
      g.beginPath(); g.ellipse(hx + 1.5, hy + 1.6, RX * .42, RY * .28, 0, 0, TAU); g.fillStyle = 'rgba(70,130,160,.45)'; g.fill();
      // poteaux, treuil, corde et seau suspendu
      const za = 44;
      box(g, -.31, 0, .06, .06, 46, zw - 1, Wd, 'wood');
      inkLn(g, [pt(-.31, 0, za), pt(.31, 0, za)], '#6e4426', 2.6);
      for (let i = 0; i < 4; i++) { const [p, q] = pt(-.07 + i * .045, 0, za); g.beginPath(); g.ellipse(p, q, 1.3, 2.6, 0, 0, TAU); g.strokeStyle = '#d8c08a'; g.lineWidth = 1; g.stroke(); }
      ln(g, [pt(.05, 0, za - 2), pt(.05, 0, 31)], INK, 2); ln(g, [pt(.05, 0, za - 2), pt(.05, 0, 31)], '#d8c08a', 1);
      const [sx, sy] = pt(.05, 0, 23);
      g.beginPath(); g.moveTo(sx - 4.4, sy - 8); g.bezierCurveTo(sx - 9, sy - 14, sx + 9, sy - 14, sx + 4.4, sy - 8); g.strokeStyle = INK; g.lineWidth = 1.8; g.stroke(); g.strokeStyle = '#9aa0aa'; g.lineWidth = .8; g.stroke();
      g.beginPath(); g.moveTo(sx - 4.4, sy - 8); g.lineTo(sx - 3.4, sy); g.ellipse(sx, sy, 3.4, 1.5, 0, Math.PI, 0, true); g.lineTo(sx + 4.4, sy - 8); g.closePath(); g.fillStyle = radial(g, sx - 1.5, sy - 4, 6, '#9a6a3a'); fi(g, g.fillStyle, .9);
      [-6, -2].forEach(dy => ln(g, [[sx - 4.2 + (dy + 8) * .125, sy + dy], [sx + 4.2 - (dy + 8) * .125, sy + dy]], '#4a4850', .9));
      ell(g, sx, sy - 8, 4.4, 1.9, '#3a2414', .8);
      box(g, .31, 0, .06, .06, 46, zw - 1, Wd, 'wood');
      inkLn(g, [pt(.31, 0, za), pt(.4, 0, za), pt(.4, 0, za - 6)], '#4a4850', 1.1); inkLn(g, [pt(.4, 0, za - 6), pt(.47, 0, za - 6)], Wd, 1.6);
      // petit toit en bardeaux
      const ex = .4, ey = .23, zr = 50, zk = 63, at = (x, f) => pt(x, ey * (1 - f), zr + (zk - zr) * f);
      poly(g, [pt(-ex, -ey, zr), pt(ex, -ey, zr), pt(ex, 0, zk), pt(-ex, 0, zk)], '#6e4630', 1);
      poly(g, [pt(ex, -ey, zr), pt(ex, ey, zr), pt(ex, 0, zk)], '#5a3a26', 1);
      poly(g, [pt(-ex, ey, zr), pt(ex, ey, zr), pt(ex, 0, zk), pt(-ex, 0, zk)], '#9a6a40', 1);
      for (let r = 0; r < 3; r++) { const f0 = r / 3, f1 = (r + 1) / 3; if (r) ln(g, [at(-ex, f0), at(ex, f0)], 'rgba(60,30,12,.45)', .8); for (let k = 0; k < 7; k++) { const x = -ex + (k + (r % 2) * .5 + .25) * ex * 2 / 7; ln(g, [at(x, f0), at(x, f1)], 'rgba(60,30,12,.32)', .7); } }
      inkLn(g, [pt(-ex, 0, zk + .6), pt(ex, 0, zk + .6)], '#5a3a26', 1.5);
      moss(g, ...at(-.2, .25), 2.8, 3); moss(g, ...at(.22, .55), 2.2, 4);
    },
    nain: g => {
      const [a, b] = pt(0, .02, 0);
      // socle de pierre moussu
      g.beginPath(); g.ellipse(a, b - 1.5, 12, 5.4, 0, 0, Math.PI); g.lineTo(a - 12, b - 4); g.ellipse(a, b - 4, 12, 5.4, 0, Math.PI, 0); g.closePath(); g.fillStyle = radial(g, a - 3, b - 2, 13, '#7f776c'); fi(g, g.fillStyle, 1);
      ell(g, a, b - 4, 12, 5.4, '#9a9286', 1); moss(g, a - 8, b - 3.4, 2.6, 2); moss(g, a + 9, b - 4.8, 2, 3);
      // bottes, manteau, ceinture
      ell(g, a - 4.2, b - 5.6, 3.6, 2.2, '#3a2a22', .9); ell(g, a + 3.8, b - 5.1, 3.6, 2.2, '#3a2a22', .9);
      g.beginPath(); g.moveTo(a - 7.5, b - 7); g.quadraticCurveTo(a - 9, b - 16, a - 5.5, b - 23); g.lineTo(a + 5.5, b - 23); g.quadraticCurveTo(a + 9, b - 16, a + 7.5, b - 7); g.quadraticCurveTo(a, b - 4.5, a - 7.5, b - 7); g.closePath(); g.fillStyle = radial(g, a - 3, b - 16, 12, '#3f66b4'); fi(g, g.fillStyle, 1);
      rrect(g, a - 8.3, b - 12.6, 16.6, 2.6, 1, '#4a2e1a', .8); rrect(g, a - 1.6, b - 13.1, 3.2, 3.6, .6, PAL.gold, .6);
      g.save(); g.translate(a - 7.4, b - 16.5); g.rotate(.5); ell(g, 0, 0, 2.4, 4, '#3a5ea8', .8); g.restore(); ball(g, a - 8.6, b - 13, 2, '#f2c29c', .7);
      // visage, barbe, moustache, nez
      ball(g, a, b - 27.5, 6, '#f2c29c', 1);
      g.beginPath(); g.moveTo(a - 6, b - 25); g.bezierCurveTo(a - 8, b - 19, a - 5, b - 13.5, a + .5, b - 11); g.bezierCurveTo(a + 5.5, b - 13.5, a + 8, b - 19, a + 6, b - 25); g.quadraticCurveTo(a, b - 22.5, a - 6, b - 25); g.closePath(); g.fillStyle = radial(g, a - 2, b - 20, 9, '#f3efe6'); fi(g, g.fillStyle, .9);
      [[-3, -17.5], [2.5, -16.5], [-.5, -14]].forEach(([dx, dy]) => { g.beginPath(); g.arc(a + dx, b + dy, 1.4, .3, Math.PI - .3); g.strokeStyle = 'rgba(140,130,115,.6)'; g.lineWidth = .6; g.stroke(); });
      ell(g, a - 2.3, b - 24.4, 2.7, 1.4, '#f6f2ea', .7); ell(g, a + 2.7, b - 24.4, 2.7, 1.4, '#f6f2ea', .7);
      g.beginPath(); g.moveTo(a - 1, b - 21.8); g.quadraticCurveTo(a + 2, b - 20.6, a + 3.8, b - 23.2); g.strokeStyle = INK; g.lineWidth = 1; g.lineCap = 'round'; g.stroke();
      ball(g, a + .3, b - 26, 2.5, '#ec8e74', .8); ball(g, a - .5, b - 26.8, .7, 'rgba(255,255,255,.7)', 0);
      // regard en dessous, lueur rouge
      ln(g, [[a - 4.8, b - 31.6], [a - 1.2, b - 29.8]], INK, 1.3); ln(g, [[a + 4.8, b - 31.6], [a + 1.6, b - 30]], INK, 1.3);
      ell(g, a - 2.6, b - 28.6, 1.1, .8, INK, 0); ell(g, a + 2.9, b - 28.6, 1.1, .8, INK, 0);
      ball(g, a - 2.3, b - 28.8, .4, '#ff5a40', 0); ball(g, a + 3.2, b - 28.8, .4, '#ff5a40', 0);
      // bonnet rouge
      g.beginPath(); g.moveTo(a - 7, b - 30); g.quadraticCurveTo(a - 5.5, b - 41, a + 1, b - 46); g.quadraticCurveTo(a + 5, b - 49, a + 9, b - 46.5); g.quadraticCurveTo(a + 5.5, b - 45.5, a + 5, b - 41); g.quadraticCurveTo(a + 6.5, b - 35, a + 7, b - 30); g.quadraticCurveTo(a, b - 32.5, a - 7, b - 30); g.closePath(); g.fillStyle = radial(g, a - 2, b - 38, 12, '#cc3328'); fi(g, g.fillStyle, 1);
      ln(g, [[a - 3.6, b - 33], [a - 2.4, b - 39.5]], 'rgba(255,235,225,.6)', 1.1);
      // minuscule fourche
      inkLn(g, [[a + 10.6, b - 13], [a + 11.4, b - 25]], '#8a5a32', .9);
      const fork = [[[a + 9.4, b - 29.6], [a + 9.6, b - 25.2], [a + 13.2, b - 25.2], [a + 13.4, b - 29.6]], [[a + 11.4, b - 25.2], [a + 11.4, b - 30.6]]];
      fork.forEach(p => ln(g, p, INK, 1.9)); fork.forEach(p => ln(g, p, '#b8bdc6', .7));
      g.save(); g.translate(a + 7.6, b - 18.6); g.rotate(-.7); ell(g, 0, 0, 2.4, 4, '#3a5ea8', .8); g.restore(); ball(g, a + 10.9, b - 17, 2, '#f2c29c', .7);
      ball(g, a + 4.5, b - 19, .8, 'rgba(255,255,255,.6)', 0);
    },
  });

  Object.assign(XDRAW, {
    // poule rousse, de trois quarts, tournée vers la droite (petite : la scène la réduit encore)
    poule: g => {
      const R = '#c86a32', R2 = '#9a4a22', Y = '#eaa83a';
      g.save(); g.scale(.86, .86);
      [[-2.4, 0], [2.6, -.4]].forEach(([x, y]) => { inkLn(g, [[x + .4, y - 5.5], [x, y]], Y, .9); [[-2.4, .4], [2.2, .6], [.4, 1.2]].forEach(([dx, dy]) => ln(g, [[x, y], [x + dx, y + dy]], shade(Y, -.3), .8)); });
      [[-9.5, -15.5, -.55, 5.4, '#6a2c16'], [-11.2, -12.6, -1, 4.6, '#7a3418'], [-8.6, -17.6, -.18, 4.4, '#5a2412']].forEach(([x, y, r, l, c]) => { g.save(); g.translate(x, y); g.rotate(r); ell(g, 0, 0, 2.4, l, c, .9); g.restore(); });
      ell(g, 0, -9, 10, 7.6, R, 1.1);
      g.save(); g.translate(-1.6, -9.6); g.rotate(-.15); ell(g, 0, 0, 6.2, 4.3, R2, .9); [-2, 0, 2].forEach(dx => ln(g, [[dx + 2.5, 1.6], [dx - .5, 3.6]], shade(R2, -.35), .7)); g.restore();
      [[6.2, -21.2, 1.5], [8.1, -22.2, 1.7], [10, -21.4, 1.4]].forEach(([x, y, r]) => ball(g, x, y, r, '#d83228', .7));
      ell(g, 6, -13.5, 4.5, 5.5, R, 0);
      ball(g, 8, -17.2, 4.5, R, 1);
      ell(g, 11.2, -13.8, 1.3, 2, '#d83228', .6);
      poly(g, [[11.8, -18.4], [15, -17], [11.8, -15.6]], '#f0b030', .7);
      ball(g, 9.6, -18.3, 1.3, '#fffaf0', .5); ball(g, 9.9, -18.2, .75, INK, 0);
      g.restore();
    },
    // souche d'arbre abattu (lisière défrichée)
    souche: g => {
      const B = '#6e4a2c', [bx, by] = pt(0, 0, 0);
      [[-13, 3.5, .3], [11.5, 5, -.5], [3, 7.6, 1.1]].forEach(([dx, dy, r]) => { g.save(); g.translate(bx + dx, by + dy); g.rotate(r); poly(g, [[-1.6, -.6], [1.6, -.8], [1.3, .6], [-1.4, .6]], '#c8995e', .5); g.restore(); });
      [[-8, -2, -13, -6], [7, -3, 13, -6]].forEach(([x, y, tx, ty]) => blade(g, bx + x, by + y, bx + tx, by + ty, bx + (x + tx) / 2, by + y - 2, 2.6, shade(B, -.2), .8));
      cyl(g, 0, 0, .2, 12, 0, B, '#dcb47c');
      [-6.5, -3.5, 0, 3.5, 6.5].forEach((dx, i) => { const yb = by + Math.sqrt(1 - (dx / 9) ** 2) * 4.5; ln(g, [[bx + dx, yb - 1], [bx + dx + (i % 2 ? .7 : -.5), yb - 10.5]], 'rgba(25,14,6,.45)', .8); });
      const [cx, cy] = pt(0, 0, 12), RX = 9, RY = 4.5;
      [.78, .55, .32].forEach(f => { g.beginPath(); g.ellipse(cx + .5, cy + .3, RX * f, RY * f, 0, 0, TAU); g.strokeStyle = 'rgba(150,95,40,.65)'; g.lineWidth = .7; g.stroke(); });
      ball(g, cx + .6, cy + .3, .9, '#8a5a2a', 0);
      ln(g, [[cx + .6, cy + .3], [cx + 5, cy + 1.6], [cx + 8, cy + 1.4]], 'rgba(70,40,15,.7)', .8);
      g.beginPath(); g.ellipse(cx, cy, RX, RY, 0, 0, TAU); g.strokeStyle = '#4e3018'; g.lineWidth = 1.6; g.stroke();
      [[-7, 2, -14, 5], [6, 3, 12, 6], [0, 4.5, -2, 8]].forEach(([x, y, tx, ty]) => blade(g, bx + x, by + y - 1, bx + tx, by + ty, bx + (x + tx) / 2 + 1, by + y, 2.4, B, .8));
      moss(g, bx - 6, by - 3.5, 2.6, 3);
      [[6.8, 2.2, 1], [9.6, 1, .72]].forEach(([dx, dy, s]) => { const x = bx + dx, y = by + dy; rrect(g, x - .75 * s, y - 2.6 * s, 1.5 * s, 2.8 * s, .6, '#efe2c8', .5); g.beginPath(); g.moveTo(x - 3 * s, y - 2.2 * s); g.quadraticCurveTo(x - 2.8 * s, y - 5.6 * s, x, y - 5.6 * s); g.quadraticCurveTo(x + 2.8 * s, y - 5.6 * s, x + 3 * s, y - 2.2 * s); g.quadraticCurveTo(x, y - 1.4 * s, x - 3 * s, y - 2.2 * s); g.closePath(); g.fillStyle = radial(g, x - .8 * s, y - 4.6 * s, 3 * s, '#d06a32'); fi(g, g.fillStyle, .6); [[-1.2, -4.2], [1, -4.6], [.2, -3.2]].forEach(([u, v]) => ball(g, x + u * s, y + v * s, .42 * s, '#fbefd8', 0)); });
    },
    // touffe de fougères du sous-bois
    fougere: g => {
      // fronde : contour festonné (une foliole par feston) et nervures claires
      const frond = (ang, L, col, droop, w) => {
        const x0 = Math.sin(ang) * 2, y0 = -1, dx = Math.sin(ang), dy = -Math.cos(ang);
        const P1 = [x0 + dx * L * .5, y0 + dy * L * .5 - L * .18], P2 = [x0 + dx * L, y0 + dy * L + L * droop];
        const Bz = t => { const u = 1 - t; return [u * u * x0 + 2 * u * t * P1[0] + t * t * P2[0], u * u * y0 + 2 * u * t * P1[1] + t * t * P2[1]]; };
        const N = 9, T = [[], []], Q = [[], []], R = [];
        for (let i = 0; i <= N; i++) {
          const t = .1 + i / N * .84, [x, y] = Bz(t), [x2, y2] = Bz(t + .02), l = Math.hypot(x2 - x, y2 - y) || 1, tx = (x2 - x) / l, ty = (y2 - y) / l, nx = -ty, ny = tx;
          const ww = w * 1.25 * Math.pow(Math.sin(Math.PI * Math.min(1, (t - .04) / .96)), .75), [xn, yn] = Bz(t + .42 / N);
          R.push([x, y]);
          [1, -1].forEach((sd, k) => { T[k].push([x + sd * nx * ww + tx * ww * .45, y + sd * ny * ww + ty * ww * .45]); Q[k].push([xn + sd * nx * ww * .5, yn + sd * ny * ww * .5]); });
        }
        const tip = Bz(1);
        g.beginPath(); g.moveTo(x0, y0);
        for (let i = 0; i <= N; i++) g.quadraticCurveTo(...T[0][i], ...Q[0][i]);
        g.lineTo(...tip); g.lineTo(...Q[1][N]);
        for (let i = N; i >= 0; i--) g.quadraticCurveTo(...T[1][i], ...(i ? Q[1][i - 1] : [x0, y0]));
        g.closePath(); const [bx0, by0, bx1, by1] = bbox([[x0, y0], tip, ...T[0], ...T[1]]), gr = g.createLinearGradient(bx0, by0, bx1, by1);
        gr.addColorStop(0, shade(col, .2)); gr.addColorStop(1, shade(col, -.15)); g.fillStyle = gr; g.fill(); g.lineWidth = .8; g.strokeStyle = shade(col, -.6); g.stroke();
        R.forEach(([x, y], i) => [0, 1].forEach(k => ln(g, [[x, y], [x + (T[k][i][0] - x) * .78, y + (T[k][i][1] - y) * .78]], `rgba(205,240,170,${.2 + i * .015})`, .7)));
        ln(g, [[x0, y0], ...R, tip], shade(col, .35), .8);
      };
      [[-.3, 25, '#335f2c', .08, 4.2], [.32, 24, '#335f2c', .08, 4], [0, 27, '#3a6a30', .05, 4.4]].forEach(f => frond(...f));
      [[-1.05, 23, '#447c36', .3, 4], [1.0, 22, '#447c36', .3, 3.8]].forEach(f => frond(...f));
      // une crosse qui se déroule
      g.beginPath(); g.moveTo(1, -1); g.quadraticCurveTo(3, -12, 1.5, -17); g.arc(3.4, -17.6, 1.9, Math.PI, Math.PI * 2.7); g.strokeStyle = '#2f5a28'; g.lineWidth = 2.4; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#7ab85a'; g.lineWidth = 1.2; g.stroke();
      [[-.68, 20, '#55923f', .42, 3.6], [.66, 19, '#55923f', .42, 3.4], [-1.5, 15, '#62a046', .45, 3], [1.45, 15, '#62a046', .45, 3]].forEach(f => frond(...f));
    },
  });

  Object.assign(LIGHTS, { mausolee: [1.4, 'green', .6] });
}
/* ---------- ajouts : grandes salles (stickers améliorés des pièces fusionnées) ---------- */
{
  const TAU = Math.PI * 2, AX = .4636;   // AX : angle écran des axes x (+AX) et y (−AX)
  // ellipse tournée (coordonnées écran)
  const oval = (g, x, y, rx, ry, rot, col, lw = 1) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fillStyle = isHex(col) ? radial(g, x, y, Math.max(rx, ry), col) : col; fi(g, g.fillStyle, lw); };
  // étincelle à quatre branches
  const spark = (g, x, y, r, col = '#fff4c4') => poly(g, [[x, y - r], [x + r * .26, y - r * .26], [x + r, y], [x + r * .26, y + r * .26], [x, y + r], [x - r * .26, y + r * .26], [x - r, y], [x - r * .26, y - r * .26]], col, .6);
  // cercle dans un plan vertical parallèle à l'axe x (u = 1) ou y (u = -1)
  const vpath = (g, cx, cy, R, u) => { g.beginPath(); for (let i = 0; i <= 28; i++) { const a = i / 28 * TAU, c = Math.cos(a) * R; g[i ? 'lineTo' : 'moveTo'](cx + c * .894 * u, cy + c * .447 - Math.sin(a) * R); } g.closePath(); };
  const vcirc = (g, cx, cy, R, u, col, lw = 1) => { vpath(g, cx, cy, R, u); g.fillStyle = isHex(col) ? radial(g, cx, cy, R, col) : col; fi(g, g.fillStyle, lw); };
  // halo peint seulement sur ce qui est déjà dessiné
  const halo = (g, x, y, r, rgb, a = .6) => { g.save(); g.globalCompositeOperation = 'source-atop'; const h = g.createRadialGradient(x, y, 0, x, y, r); h.addColorStop(0, `rgba(${rgb},${a})`); h.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = h; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); };
  // goutte (coordonnées écran)
  const drop = (g, x, y, s, col) => { g.beginPath(); g.moveTo(x, y - 3 * s); g.quadraticCurveTo(x + 2.2 * s, y + .3 * s, x, y + 1.6 * s); g.quadraticCurveTo(x - 2.2 * s, y + .3 * s, x, y - 3 * s); fi(g, col, .6); };
  // lettre Z de ronflement
  const zed = (g, x, y, s) => inkLn(g, [[x - s, y - s], [x + s, y - s], [x - s, y + s], [x + s, y + s]], '#eef2ff', Math.max(.9, s * .32));
  // pièce d'or vue de biais
  const coin = (g, x, y, s = 1, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.ellipse(0, .7 * s, 3.4 * s, 1.6 * s, 0, 0, Math.PI); g.lineTo(-3.4 * s, 0); g.ellipse(0, 0, 3.4 * s, 1.6 * s, 0, Math.PI, 0, true); g.closePath(); fi(g, '#a8781c', .5); ell(g, 0, 0, 3.4 * s, 1.6 * s, '#f2c94f', .6); ell(g, -.5 * s, -.2 * s, 2.1 * s, .8 * s, 'rgba(255,248,200,.55)', 0); g.restore(); };

  Object.assign(FDRAW, {
    /* ----- dortoir ----- */
    grandlit: g => {
      const Wd = '#8a5530', Wd2 = '#5e341c', x0 = -.44, x1 = .44, y0 = -.42, y1 = .42, zq = 17, xq = -.21;
      [[x1 - .05, y0 + .05], [x0 + .05, y1 - .05], [x1 - .05, y1 - .05]].forEach(([x, y]) => ball(g, ...pt(x, y, 2.6), 2.8, Wd2, .9));
      // tête de lit chantournée, crâne sculpté au milieu
      const crest = (x, col) => { const P = [pt(x, y0, 0)]; for (let i = 0; i <= 32; i++) { const y = y0 + (y1 - y0) * i / 32, k = (i % 8) / 8; P.push(pt(x, y, 30 + Math.sin(k * Math.PI) * 6 + (i >= 12 && i <= 20 ? Math.sin((i - 12) / 8 * Math.PI) * 5 : 0))); } P.push(pt(x, y1, 0)); poly(g, P, col, 1); };
      crest(x0, shade(Wd, -.35)); crest(x0 + .06, shade(Wd, -.18));
      [-.21, 0, .21].forEach(y => ln(g, [pt(x0 + .062, y, 4), pt(x0 + .062, y, 30)], 'rgba(40,20,8,.35)', .8));
      [y0 + .02, y1 - .02].forEach(y => { box(g, x0 + .03, y, .07, .07, 40, 0, Wd2, 'wood'); ball(g, ...pt(x0 + .03, y, 43), 3, PAL.gold, .8); });
      const [sa, sb] = pt(x0 + .065, 0, 36); ball(g, sa, sb, 3.4, PAL.bone, .8); ell(g, sa - 1.2, sb - .3, .9, 1.1, INK, 0); ell(g, sa + 1.2, sb - .3, .9, 1.1, INK, 0); ln(g, [[sa - 1, sb + 1.9], [sa + 1, sb + 1.9]], INK, .6);
      // cadre et matelas
      box(g, .03, 0, .82, .84, 9, 3, Wd, 'wood');
      box(g, .03, 0, .8, .8, 4, 12, '#eadfc4');
      // oreillers
      const Y = [-.305, -.1, .105, .31];
      Y.forEach(y => { const [a, b] = pt(-.31, y, 19); oval(g, a, b, 8.4, 4.4, -AX, '#f6efe0', .9); ln(g, [[a - 3, b - .2], [a + 3, b - .8]], 'rgba(150,130,100,.4)', .7); });
      // couverture en patchwork qui retombe sur les côtés
      const C = ['#b8433a', '#3f6aa8', '#d9a441', '#5f9a4f', '#8a5ab0', '#e8d8b8', '#c26a8a'], col = (i, j) => C[Math.floor(hash(i + 3, j + 5) * C.length)];
      const NX = 4, NY = 5, XS = i => xq + (x1 + .006 - xq) * i / NX, YS = j => y0 - .006 + (y1 - y0 + .012) * j / NY, yf = y1 + .006, xf = x1 + .006;
      for (let i = 0; i < NX; i++) { const z = 7 + hash(i, 2) * 2.5; poly(g, [pt(XS(i), yf, zq), pt(XS(i + 1), yf, zq), pt(XS(i + 1), yf, z), pt(XS(i), yf, z + .8)], shade(col(i, NY - 1), -.1), .7); }
      for (let j = 0; j < NY; j++) { const z = 7 + hash(j, 4) * 2.5; poly(g, [pt(xf, YS(j), zq), pt(xf, YS(j + 1), zq), pt(xf, YS(j + 1), z + .8), pt(xf, YS(j), z)], shade(col(NX - 1, j), -.3), .7); }
      for (let i = 0; i < NX; i++) for (let j = 0; j < NY; j++) poly(g, [pt(XS(i), YS(j), zq), pt(XS(i + 1), YS(j), zq), pt(XS(i + 1), YS(j + 1), zq), pt(XS(i), YS(j + 1), zq)], col(i, j), .6);
      g.save(); g.setLineDash([1.3, 1.3]); g.strokeStyle = 'rgba(255,248,230,.6)'; g.lineWidth = .6;
      for (let i = 1; i < NX; i++) { g.beginPath(); g.moveTo(...pt(XS(i), yf, zq)); g.lineTo(...pt(XS(i), YS(0), zq)); g.stroke(); }
      for (let j = 1; j < NY; j++) { g.beginPath(); g.moveTo(...pt(xq, YS(j), zq)); g.lineTo(...pt(xf, YS(j), zq)); g.lineTo(...pt(xf, YS(j), 9)); g.stroke(); }
      g.restore();
      ln(g, [pt(xq, y0, zq + .3), pt(xq, y1, zq + .3)], '#f3ead6', 2.2);
      // les dormeurs : têtes de gobelins assoupis, bonnets de nuit, bosses sous la couverture
      const SK = ['#7fae4a', '#93b85a', '#6f9e48', '#a0b860'], CAP = [['#c8413a', '#ffffff'], ['#3f6aa8', '#e9b949'], ['#5f9a4f', '#ffffff'], ['#8a5ab0', '#f6c0d8']];
      const ux = -.894, uy = -.447;
      Y.forEach((y, k) => {
        const [p, q] = pt(-.3, y, zq + 2.4), sk = SK[k], [cc, ch] = CAP[k];
        // oreilles pointues de part et d'autre
        [[1, 6.2, 2.4], [-1, 5.6, 1.8]].forEach(([sd, l, h]) => poly(g, [[p - 1.8 * sd, q - .4 - sd * .6], [p - (l + 1) * sd * .45 - 1, q - l * .25 * sd - h], [p - .4 * sd, q + 1.4]], shade(sk, -.08), .7));
        ball(g, p, q, 3.7, sk, .8);
        [-1.4, 1.4].forEach(dx => { g.beginPath(); g.arc(p + dx, q - .2, .9, .2, Math.PI - .2); g.strokeStyle = INK; g.lineWidth = .6; g.stroke(); });
        // bonnet couché vers l'arrière, pompon au bout
        const bx = p + .6, by = q - 2.2, tx = bx + ux * 10, ty = by + uy * 10 + 3.4;
        g.beginPath(); g.moveTo(bx - 3.8, by + 1.2); g.quadraticCurveTo(bx - 3.4, by - 4.6, tx, ty); g.quadraticCurveTo(bx + .4, by - 2.4, bx + 3.6, by - 1); g.closePath(); fi(g, cc, .8);
        ln(g, [[bx - 5.4, by - 1.6], [bx - 3.6, by - 3.2]], 'rgba(255,250,235,.4)', .9);
        g.beginPath(); g.moveTo(bx - 4.2, by + 1.6); g.quadraticCurveTo(bx, by - 1.2, bx + 4, by - .6); g.strokeStyle = INK; g.lineWidth = 2.6; g.lineCap = 'round'; g.stroke(); g.strokeStyle = ch; g.lineWidth = 1.5; g.stroke();
        ball(g, tx - .3, ty + .5, 1.9, ch, .7);
        // bosse du dormeur, deux pièces de tissu cousues
        const [a, b] = pt(.085, y, zq + 1.6), c1 = col(k, 9), c2 = col(9, k);
        g.save(); g.beginPath(); g.ellipse(a, b, 9.2, 3.8, AX, 0, TAU); g.clip();
        g.fillStyle = c1; g.fillRect(a - 12, b - 8, 24, 16); g.beginPath(); g.moveTo(a + 2, b - 9); g.lineTo(a + 14, b - 9); g.lineTo(a + 14, b + 9); g.lineTo(a - 4, b + 9); g.closePath(); g.fillStyle = c2; g.fill();
        const sh = g.createRadialGradient(a - 4, b - 3, 1, a, b, 11); sh.addColorStop(0, 'rgba(255,250,235,.5)'); sh.addColorStop(.5, 'rgba(255,250,235,0)'); sh.addColorStop(1, 'rgba(30,15,10,.4)'); g.fillStyle = sh; g.fillRect(a - 12, b - 8, 24, 16);
        g.setLineDash([1.3, 1.3]); ln(g, [[a + 2, b - 9], [a - 4, b + 9]], 'rgba(255,248,230,.65)', .6); g.setLineDash([]);
        g.restore();
        g.beginPath(); g.ellipse(a, b, 9.2, 3.8, AX, Math.PI * .82, TAU * .99); g.strokeStyle = shade(c1, -.6); g.lineWidth = .9; g.stroke();
      });
      // au bout du lit : un pied vert et un pied en chaussette trouée
      const [fa, fb] = pt(x1 + .035, .265, zq + 2.2);
      oval(g, fa, fb, 3.2, 4.4, -.25, '#7fae4a', .8); [-1.8, -.3, 1.3].forEach((dx, i) => ball(g, fa + dx, fb - 4 + i * .4, 1.25, '#8fbe58', .5));
      const [fc, fd] = pt(x1 + .035, .37, zq + 1.8);
      g.save(); g.beginPath(); g.ellipse(fc, fd, 3.3, 4.5, -.25, 0, TAU); g.clip(); g.fillStyle = '#f4ecdc'; g.fillRect(fc - 5, fd - 6, 10, 12); [-3, 0, 3].forEach(dy => ln(g, [[fc - 5, fd + dy + 1.2], [fc + 5, fd + dy - 1.2]], '#c8413a', 1.3)); g.restore();
      g.beginPath(); g.ellipse(fc, fd, 3.3, 4.5, -.25, 0, TAU); g.strokeStyle = '#6a2a20'; g.lineWidth = .8; g.stroke();
      ball(g, fc - .9, fd - 4.1, 1.35, '#8fbe58', .5);
      // ronflements
      [[-4, -40, 2.2], [2, -47, 2.9], [9.5, -55.5, 3.6]].forEach(([x, y, s]) => zed(g, x, y, s));
    },
    /* ----- cuisine ----- */
    broche: g => {
      const ST = '#8d8579', zt = 9, IR = '#4d4b52';
      box(g, 0, 0, .88, .88, zt, 0, ST, 'stone');
      // fosse de braises
      const P = [pt(-.33, -.33, zt), pt(.33, -.33, zt), pt(.33, .33, zt), pt(-.33, .33, zt)];
      path(g, P); let gr = g.createRadialGradient(0, -zt, 1, 0, -zt, 24); gr.addColorStop(0, '#ffd66a'); gr.addColorStop(.35, '#ef6a1e'); gr.addColorStop(.75, '#8a2410'); gr.addColorStop(1, '#2e100a'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#2a120c'; g.lineWidth = 1; g.stroke();
      // pierres du pourtour (arrière)
      const rim = (x, y, i) => { const [a, b] = pt(x, y, zt); ell(g, a, b - .6, 4.2, 2.2, ['#9d958a', '#857d72', '#aaa196'][i % 3], .8); };
      for (let i = 0; i < 6; i++) { rim(-.385, -.33 + i * .132, i); rim(-.33 + i * .132, -.385, i + 1); }
      // bûches croisées et braises
      const log = (p0, p1) => { inkLn(g, [p0, p1], '#6a4024', 3.4); ell(g, p1[0], p1[1], 1.9, 1.7, '#d8a060', .6); ln(g, [[(p0[0] * 2 + p1[0]) / 3, (p0[1] * 2 + p1[1]) / 3], [(p0[0] + p1[0] * 2) / 3, (p0[1] + p1[1] * 2) / 3]], '#ffb03a', .9); };
      log(pt(-.2, .1, zt + 1.5), pt(.18, -.08, zt + 2.5)); log(pt(.12, .18, zt + 1.5), pt(-.08, -.2, zt + 3)); log(pt(-.16, -.1, zt + 1.2), pt(.2, .12, zt + 2));
      for (let i = 0; i < 14; i++) { const [a, b] = pt(-.26 + hash(i, 5) * .52, -.26 + hash(5, i) * .52, zt + .5); ball(g, a, b, .9 + hash(i, 6) * .8, i % 3 ? '#ffb347' : '#fff1a8', 0); }
      halo(g, 0, -zt - 2, 20, '255,190,90', .55);
      // landiers de fer
      const [la, lb] = pt(-.36, .36, zt), [ra, rb] = pt(.36, -.36, zt), zs = 23;
      [[la, lb], [ra, rb]].forEach(([x, y]) => { inkLn(g, [[x - 3.5, y + 1.6], [x, y - 3], [x + 3.5, y + 1.6]], IR, 1.3); inkLn(g, [[x, y], [x, y - zs]], IR, 1.9); inkLn(g, [[x - 2.8, y - zs - 4], [x, y - zs + .5], [x + 2.8, y - zs - 4]], IR, 1.5); });
      // la broche et le cochon rôti, pomme dans le groin
      const sy = lb - zs - 1.2, cx = 1.5;
      inkLn(g, [[la - 4, sy], [cx - 20, sy]], '#aab0ba', 1.3);
      const C = '#c9782f';
      [[-8, 7, -13, 10.5], [-4, 7.6, -9.5, 11.5]].forEach(([x0, y0, x1, y1]) => inkLn(g, [[cx + x0, sy + y0], [cx + x1, sy + y1]], shade(C, -.12), 2.6));
      [[8, 7, 13.5, 10.5], [4.5, 7.8, 9.5, 11.6]].forEach(([x0, y0, x1, y1]) => inkLn(g, [[cx + x0, sy + y0], [cx + x1, sy + y1]], shade(C, -.12), 2.6));
      oval(g, cx + 1, sy + .4, 15, 9.2, 0, C, 1.1);
      ball(g, cx - 12.5, sy + 1, 7, C, 1);
      poly(g, [[cx - 14.5, sy - 4.6], [cx - 9.2, sy - 6.4], [cx - 15.4, sy - 11.4]], shade(C, -.15), .9);
      oval(g, cx - 18.6, sy + 2.2, 3, 3.6, -.2, '#d98a52', .9); [-1, 1].forEach(d => ell(g, cx - 19.6, sy + 2.2 + d * 1.2, .55, .7, '#5a2a14', 0));
      ball(g, cx - 19.8, sy + 6.6, 3.1, '#d8322e', .9); ball(g, cx - 20.8, sy + 5.4, .9, '#ffd0c0', 0); inkLn(g, [[cx - 19.6, sy + 3.6], [cx - 18.8, sy + 2.4]], '#6a4024', .6); oval(g, cx - 17.6, sy + 3, 1.6, .8, -.5, '#5f9a4f', .4);
      g.beginPath(); g.arc(cx - 13.4, sy - .6, 1.5, .25, Math.PI - .25); g.strokeStyle = INK; g.lineWidth = .8; g.stroke();
      [-5, 1.5, 8].forEach(x => { g.beginPath(); g.ellipse(cx + x, sy + .6, 1.7, 8.4, 0, -Math.PI / 2, Math.PI / 2); g.strokeStyle = '#5a3016'; g.lineWidth = 1.7; g.stroke(); g.strokeStyle = '#f1e4c8'; g.lineWidth = .8; g.stroke(); });
      ln(g, [[cx - 8, sy - 6.4], [cx - 1, sy - 8.4], [cx + 7, sy - 7.4]], 'rgba(255,240,200,.7)', 1.6);
      [[-2, -3], [5, -2], [10, 2], [-6, 3]].forEach(([x, y]) => ell(g, cx + x, sy + y, 1.1, .7, 'rgba(110,50,15,.45)', 0));
      g.beginPath(); g.moveTo(cx + 15.8, sy - 1); g.bezierCurveTo(cx + 19, sy - 3, cx + 19.5, sy + 1.5, cx + 17.5, sy + 1); g.bezierCurveTo(cx + 16, sy + .5, cx + 17, sy - 2, cx + 18.6, sy - 1.6); g.strokeStyle = shade(C, -.5); g.lineWidth = 2.2; g.stroke(); g.strokeStyle = C; g.lineWidth = 1.1; g.stroke();
      inkLn(g, [[cx + 18.5, sy], [ra + 6, sy]], '#aab0ba', 1.3);
      spark(g, cx + 4, sy - 11, 2.4);
      drop(g, cx - 2, sy + 13, .8, '#f2c050'); drop(g, cx + 6, sy + 15.5, .65, '#f2c050');
      // manivelle
      inkLn(g, [[ra + 6, sy], [ra + 6.5, sy + 6.5]], IR, 1.3); rrect(g, ra + 5.6, sy + 5.6, 5.4, 2.4, 1.1, '#8a5530', .7);
      // fumet
      [[-6, 0], [4, 1.4]].forEach(([dx, ph]) => { g.beginPath(); g.moveTo(cx + dx, sy - 12); g.bezierCurveTo(cx + dx - 3, sy - 15 - ph, cx + dx + 3, sy - 18, cx + dx, sy - 22 - ph); g.strokeStyle = 'rgba(255,250,240,.55)'; g.lineWidth = 1.1; g.lineCap = 'round'; g.stroke(); });
      // pierres du pourtour (avant)
      for (let i = 0; i < 6; i++) { rim(.385, -.33 + i * .132, i + 2); rim(-.33 + i * .132, .385, i + 3); }
    },
    banquet: g => {
      const x0 = -.48, x1 = .48, y0 = -.24, y1 = .24, zt = 18, zc = 8, CL = '#f3ead6', RU = '#a8282e', yf = y1 + .004, xf = x1 + .004;
      // pieds tournés sous la nappe
      [[x0 + .06, y0 + .06], [x1 - .06, y0 + .06], [x0 + .06, y1 - .06], [x1 - .06, y1 - .06]].forEach(([x, y]) => { box(g, x, y, .06, .06, zc, 0, '#5e341c'); ball(g, ...pt(x, y, 3.6), 2.3, '#7a4a28', .7); });
      // nappe brodée à festons, chemin de table rouge qui retombe
      poly(g, [pt(x0, y0, zt), pt(x1, y0, zt), pt(x1, y1, zt), pt(x0, y1, zt)], CL, 1);
      const scal = (P, n, col) => { g.beginPath(); g.moveTo(...P(0, zt)); g.lineTo(...P(1, zt)); g.lineTo(...P(1, zc)); for (let i = n - 1; i >= 0; i--) { const [ma, mb] = P((i + .5) / n, zc - 2.6), [ea, eb] = P(i / n, zc); g.quadraticCurveTo(ma, mb, ea, eb); } g.closePath(); const [x, y, X, Y] = bbox([P(0, zt), P(1, zc - 2)]); const gr = g.createLinearGradient(x, y, X, Y); gr.addColorStop(0, shade(col, .1)); gr.addColorStop(1, shade(col, -.16)); g.fillStyle = gr; fi(g, g.fillStyle, 1); };
      scal((t, z) => pt(x0 + (x1 - x0) * t, yf, z), 8, CL);
      scal((t, z) => pt(xf, y0 + (y1 - y0) * t, z), 4, shade(CL, -.2));
      g.save(); g.setLineDash([1.6, 1.2]); ln(g, [pt(x0 + .02, yf, zc + 2.6), pt(x1, yf, zc + 2.6), pt(xf, y0 + .02, zc + 2.6)], '#c9962f', .8); g.restore();
      poly(g, [pt(x0 + .03, -.07, zt + .2), pt(x1, -.07, zt + .2), pt(x1, .07, zt + .2), pt(x0 + .03, .07, zt + .2)], RU, .8);
      poly(g, [pt(xf + .002, -.07, zt), pt(xf + .002, .07, zt), pt(xf + .002, .07, zc - 3), pt(xf + .002, -.07, zc - 3)], shade(RU, -.25), .8);
      for (let i = 0; i <= 4; i++) { const [a, b] = pt(xf + .002, -.065 + i * .0325, zc - 3); ln(g, [[a, b], [a, b + 2.4]], PAL.gold, .8); }
      [-.055, .055].forEach(y => ln(g, [pt(x0 + .05, y, zt + .3), pt(x1 - .01, y, zt + .3)], 'rgba(233,185,73,.8)', .7));
      // assiettes
      [[-.37, .16], [-.06, .17], [.26, .17], [-.24, -.17], [.1, -.17], [.38, -.15]].forEach(([x, y]) => { const [a, b] = pt(x, y, zt); ell(g, a, b, 4.4, 2.1, '#e6e1d8', .7); ell(g, a, b - .2, 2.7, 1.2, '#f8f6f0', .4); });
      // les mets (dessinés à l'origine, posés puis triés de l'arrière vers l'avant)
      const jug = (col, liq) => () => {
        g.beginPath(); g.moveTo(3.2, -10.5); g.bezierCurveTo(8.5, -11, 8.5, -4, 3.6, -3.5); g.strokeStyle = shade(col, -.6); g.lineWidth = 3; g.lineCap = 'round'; g.stroke(); g.strokeStyle = col; g.lineWidth = 1.5; g.stroke();
        g.beginPath(); g.moveTo(-3.4, 0); g.bezierCurveTo(-7, -4, -6.2, -9, -3, -11); g.lineTo(-3.6, -13.4); g.lineTo(-6.6, -14.6); g.lineTo(3.6, -14); g.lineTo(3, -11); g.bezierCurveTo(6.2, -9, 7, -4, 3.4, 0); g.closePath();
        g.fillStyle = radial(g, -2, -7, 9, col); fi(g, g.fillStyle, .9);
        ell(g, -.5, -14.1, 3.3, 1.1, liq, .6);
        ln(g, [[-5.9, -6.5], [5.9, -6.5]], shade(col, -.35), .9); ln(g, [[-4.4, -9.5], [-5, -4]], 'rgba(255,250,235,.55)', 1);
      };
      const gigot = () => {
        ell(g, 0, 0, 11, 5, '#c3c7d0', .9); ell(g, 0, -.3, 8.6, 3.7, '#e2e5ea', .5);
        inkLn(g, [[-4, -5], [-10, -10]], PAL.bone, 2.1); ball(g, -10.6, -11.2, 1.6, PAL.bone, .6); ball(g, -11.6, -9.8, 1.5, PAL.bone, .6);
        g.beginPath(); g.moveTo(-6, -6.5); g.bezierCurveTo(-3, -11.5, 7, -9.4, 8.5, -4); g.bezierCurveTo(8.8, -.2, 2, 1.2, -1.5, -.8); g.bezierCurveTo(-4, -2.4, -5.2, -4.2, -6, -6.5); g.closePath(); g.fillStyle = radial(g, 1, -6, 10, '#a8582a'); fi(g, g.fillStyle, 1);
        ln(g, [[-3.4, -7.8], [1, -9.2], [5.4, -7.4]], 'rgba(255,225,170,.75)', 1.2);
        poly(g, [[-5, -4.8], [-6.6, -8.4], [-5.4, -7.6], [-5.6, -9.6], [-4.4, -7.8], [-3.6, -9], [-3.4, -6.4]], '#ffffff', .6);
        [[2, -6], [4.5, -4], [-1, -4], [6.5, -1.5]].forEach(([dx, dy]) => ball(g, dx, dy, .75, '#5f9a4f', 0));
        [[-7, 1.6], [7.5, 1.4]].forEach(([dx, dy]) => oval(g, dx, dy, 2.2, 1, .3, '#e8862a', .5));
      };
      const bread = () => { oval(g, 3, -1.2, 9, 2.2, -.38, '#d39a48', .8); [-2, 2, 6].forEach(d => ln(g, [[d, -.4 - d * .38], [d + 1.6, -2.4 - d * .38]], '#f3d9a0', .7)); oval(g, -2, -3, 5.6, 4.2, 0, '#c98a3a', .9); [-2, 0, 2].forEach(d => ln(g, [[-2 + d - 1.4, -5.6], [-2 + d + 1.2, -3]], '#f3d9a0', .8)); };
      const candles = () => {
        const go = PAL.gold; ell(g, 0, 0, 3.6, 1.7, go, .8); inkLn(g, [[0, -1], [0, -17]], go, 1.5);
        inkLn(g, [[0, -10], [-3.5, -10.5], [-5.8, -13.6]], go, 1.1); inkLn(g, [[0, -10], [3.5, -10.5], [5.8, -13.6]], go, 1.1);
        [[-5.8, 14], [5.8, 14], [0, 17]].forEach(([dx, h]) => { ell(g, dx, -h, 2.2, 1, go, .6); rrect(g, dx - 1.1, -h - 7, 2.2, 7, .8, '#f6efdf', .6); ln(g, [[dx - .5, -h - 6], [dx - .5, -h - 3.6]], '#ffffff', .6); ln(g, [[dx, -h - 7], [dx, -h - 8.2]], INK, .5); });
      };
      const fruit = () => {
        g.beginPath(); g.moveTo(-6, -4); g.quadraticCurveTo(0, 2, 6, -4); g.closePath(); fi(g, '#b8bcc6', .8); ell(g, 0, .8, 2.6, 1, '#9aa0aa', .6);
        ball(g, 3, -6, 2.6, '#c8382e', .7); ball(g, 3.8, -6.8, .7, '#ffd0c0', 0);
        [[-3, -7.5], [-1.2, -7.8], [-4, -6.1], [-2.2, -6.3], [-.4, -6.5], [-3.1, -4.8], [-1.3, -4.9], [-2.2, -3.5]].forEach(([dx, dy]) => ball(g, dx, dy, 1.3, '#6a3a8a', .5));
        ln(g, [[-2, -10.5], [-1.4, -9.1]], '#5a3a20', .8); oval(g, -.4, -10.5, 1.8, .9, -.3, '#5f9a4f', .4); ball(g, .8, -7.6, 2.2, '#8fbf4a', .7);
      };
      const cheese = () => {
        poly(g, [[-5, 0], [3, -1], [3, -4.6], [-5, -3.4]], '#e8b84a', .8); poly(g, [[-5, -3.4], [3, -4.6], [6, -3.6]], '#f6d878', .7); poly(g, [[3, -1], [6, -1.4], [6, -3.6], [3, -4.6]], '#d09a30', .7);
        [[-2.6, -1.6, .8], [.6, -2.4, .6], [-.8, -.8, .5]].forEach(([dx, dy, r]) => ell(g, dx, dy, r, r * .8, '#b8862a', 0));
        const mx = 7.6, my = -1.8;
        g.beginPath(); g.moveTo(mx + 2.4, my + .6); g.bezierCurveTo(mx + 6, my + 1.6, mx + 6.6, my - 2.4, mx + 8.2, my - 1.2); g.strokeStyle = '#a07a7a'; g.lineWidth = .7; g.stroke();
        oval(g, mx + .8, my - .6, 2.8, 2, -.2, '#9a96a0', .7); ball(g, mx - 1.4, my - 1.4, 1.7, '#a8a4ae', .6); ball(g, mx - .6, my - 3, 1.2, '#c9b0b8', .5); ball(g, mx - 3, my - 1, .6, '#e88a9a', 0); ball(g, mx - 1.9, my - 1.9, .4, INK, 0);
      };
      const cup = () => { ell(g, 0, 0, 2.2, 1, '#c9962f', .6); inkLn(g, [[0, -.5], [0, -3.4]], PAL.gold, .8); g.beginPath(); g.moveTo(-2.8, -7.4); g.quadraticCurveTo(-2.6, -3.2, 0, -3.2); g.quadraticCurveTo(2.6, -3.2, 2.8, -7.4); g.closePath(); g.fillStyle = radial(g, -1, -5.6, 4, PAL.gold); fi(g, g.fillStyle, .7); ell(g, 0, -7.4, 2.8, 1, '#7a1f3a', .5); };
      [[-.4, -.1, jug('#c9703a', '#6a1a2a'), .72], [-.16, .06, gigot, 1], [.05, -.09, candles, .92], [-.2, -.14, bread, .85], [.22, -.08, fruit, .9], [.18, .15, cheese, .9], [-.04, .17, cup, .9], [.32, .02, cup, .9], [.4, -.07, jug('#e6dcc4', '#7a1f3a'), .72]]
        .sort((p, q) => p[0] + p[1] - q[0] - q[1]).forEach(([x, y, f, k]) => { const [a, b] = pt(x, y, zt); g.save(); g.translate(a, b); g.scale(k, k); f(); g.restore(); });
    },
    /* ----- potager ----- */
    serre: g => {
      const xa = -.4, xb = .4, ya = -.33, yb = .33, z0 = 6, zw = 27, zr = 41, Wd = '#b07a46', GL = 'rgba(196,236,240,.2)';
      box(g, 0, 0, xb - xa + .04, yb - ya + .04, z0, 0, '#7a4e2c', 'wood');
      poly(g, [pt(xa + .02, ya + .02, z0), pt(xb - .02, ya + .02, z0), pt(xb - .02, yb - .02, z0), pt(xa + .02, yb - .02, z0)], '#4a3020', .6);
      for (let i = 0; i < 18; i++) { const [a, b] = pt(xa + .06 + hash(i, 11) * .7, ya + .06 + hash(11, i) * .56, z0); ell(g, a, b, 1.2, .6, '#6a4630', 0); }
      // parois du fond, vues à travers le verre
      const pane = (P, col = GL) => { path(g, P); g.fillStyle = col; g.fill(); };
      pane([pt(xa, ya, z0), pt(xa, yb, z0), pt(xa, yb, zw), pt(xa, 0, zr), pt(xa, ya, zw)], 'rgba(170,215,220,.22)');
      pane([pt(xa, ya, z0), pt(xb, ya, z0), pt(xb, ya, zw), pt(xa, ya, zw)], 'rgba(170,215,220,.22)');
      const bar = (p, q, w = 1, col = shade(Wd, -.08)) => inkLn(g, [p, q], col, w);
      const thin = (p, q) => ln(g, [p, q], 'rgba(110,70,38,.75)', 1);
      [-.2, 0, .2].forEach(x => thin(pt(x, ya, z0), pt(x, ya, zw))); [-.17, 0, .17].forEach(y => thin(pt(xa, y, z0), pt(xa, y, y ? zw + (zr - zw) * (1 - Math.abs(y) / yb) : zr)));
      thin(pt(xa, ya, zw), pt(xb, ya, zw)); thin(pt(xa, ya, zw), pt(xa, 0, zr)); thin(pt(xa, 0, zr), pt(xa, yb, zw));
      // plants de tomates sur tuteurs
      [[-.24, -.14], [.02, -.18]].forEach(([x, y], k) => {
        bar(pt(x, y, z0), pt(x, y, 34), .7, '#c8995e');
        for (let i = 0; i < 6; i++) { const [a, b] = pt(x, y, 10 + i * 4.2); oval(g, a + (i % 2 ? 3.4 : -3.4), b, 3.6, 1.9, i % 2 ? .5 : -.5, i % 2 ? '#5fa64e' : '#4f9440', .6); }
        [[2.4, 14], [-2.6, 20], [2, 26], [-1, 30]].forEach(([dx, z], i) => { if ((i + k) % 4 === 3) return; const [a, b] = pt(x, y, z); ball(g, a + dx, b, 2.1, '#d8382e', .6); ball(g, a + dx - .6, b - .7, .55, '#ffd0c0', 0); });
      });
      // le tournesol qui a percé le toit
      const sx = .08, sy = .06, [s0, t0] = pt(sx, sy, z0), [s1, t1] = pt(sx, sy, 56);
      const stem = (ya_, yb_) => inkLn(g, [[s0 + (s1 - s0) * ya_, t0 + (t1 - t0) * ya_], [s0 + (s1 - s0) * yb_ + 1, t0 + (t1 - t0) * yb_]], '#4f8a3a', 1.6);
      stem(0, .62);
      [[.25, -1], [.45, 1]].forEach(([f, sd]) => { const a = s0 + (s1 - s0) * f, b = t0 + (t1 - t0) * f; oval(g, a + sd * 4, b - 1.4, 4.4, 1.9, sd * .45, '#5fa64e', .6); });
      // salades et grosse citrouille au premier plan
      [[-.27, .14], [-.12, .22], [-.3, .26]].forEach(([x, y], i) => { const [a, b] = pt(x, y, z0); [[-2.2, 0], [2.2, 0], [0, -1.6], [0, .8]].forEach(([dx, dy], j) => oval(g, a + dx, b - 2.6 + dy, 3, 2.3, dx * .2, j % 2 ? '#8fcf5a' : '#7fbf4a', .6)); ball(g, a, b - 3.4, 1.8, '#b8e07a', .5); });
      { const [a, b] = pt(.2, .15, z0); oval(g, a + 4.5, b - 9.5, 4.6, 2.1, -.5, '#5fa64e', .6); oval(g, a, b - 5.2, 9.2, 6.4, 0, '#e8822a', 1); [-4.6, 0, 4.6].forEach(dx => { g.beginPath(); g.ellipse(a + dx * .9, b - 5.2, 2.4, 6, 0, -1.2, 1.2); g.strokeStyle = 'rgba(150,60,10,.5)'; g.lineWidth = .8; g.stroke(); }); inkLn(g, [[a + .4, b - 11], [a + 1.6, b - 13.6]], '#6a8a3a', 1.6); ln(g, [[a - 4.5, b - 9], [a - 1.5, b - 10.4]], 'rgba(255,240,200,.6)', 1.1); }
      // vitres avant : reflets
      const L = [pt(xa, yb, z0), pt(xb, yb, z0), pt(xb, yb, zw), pt(xa, yb, zw)], R = [pt(xb, ya, z0), pt(xb, yb, z0), pt(xb, yb, zw), pt(xb, 0, zr), pt(xb, ya, zw)];
      pane(L); pane(R, 'rgba(160,210,220,.26)');
      const glint = (p, q, w = 1.4, a = .55) => ln(g, [p, q], `rgba(255,255,255,${a})`, w);
      glint(pt(-.36, yb, 9), pt(-.27, yb, 24)); glint(pt(-.31, yb, 9), pt(-.27, yb, 15), .9, .4); glint(pt(.05, yb, 9), pt(.14, yb, 24), 1.2, .45); glint(pt(xb, -.3, 9), pt(xb, -.22, 26), 1.2, .5);
      // huisserie de bois, porte sur le pignon
      [-.2, 0, .2].forEach(x => bar(pt(x, yb, z0), pt(x, yb, zw)));
      bar(pt(xa, yb, 17), pt(xb, yb, 17), .9);
      [[ya, zw], [-.1, 22], [.1, 22], [yb, zw]].forEach(([y, z]) => bar(pt(xb, y, z0), pt(xb, y, z)));
      bar(pt(xb, -.1, 22), pt(xb, .1, 22)); bar(pt(xb, ya, 17), pt(xb, -.1, 17), .9); bar(pt(xb, .1, 17), pt(xb, yb, 17), .9);
      bar(pt(xb, 0, 22), pt(xb, 0, zr), .9); ball(g, ...pt(xb, .07, 12), 1, PAL.gold, .5);
      bar(pt(xa, yb, zw), pt(xb, yb, zw), 1.3); bar(pt(xa, yb, z0), pt(xa, yb, zw), 1.3); bar(pt(xb, yb, z0), pt(xb, yb, zw), 1.3); bar(pt(xb, ya, z0), pt(xb, ya, zw), 1.3);
      // toit vitré (pan avant), lucarne ouverte
      const ex = .03, RF = [pt(xa - ex, 0, zr), pt(xb + ex, 0, zr), pt(xb + ex, yb + ex, zw - 1.2), pt(xa - ex, yb + ex, zw - 1.2)];
      const zy = y => zr - (zr - zw + 1.2) * y / (yb + ex);
      pane(RF, 'rgba(200,238,244,.24)');
      const vx0 = -.04, vx1 = .2, vy0 = .02, vy1 = .17;
      path(g, [pt(vx0, vy0, zy(vy0)), pt(vx1, vy0, zy(vy0)), pt(vx1, vy1, zy(vy1)), pt(vx0, vy1, zy(vy1))]); g.fillStyle = 'rgba(40,60,40,.25)'; g.fill();
      glint(pt(-.34, .05, zy(.05)), pt(-.3, .3, zy(.3)), 1.5, .6); glint(pt(-.27, .05, zy(.05)), pt(-.25, .16, zy(.16)), 1, .45); glint(pt(.27, .04, zy(.04)), pt(.31, .28, zy(.28)), 1.3, .5);
      [-.2, vx0, vx1, .4].forEach(x => bar(pt(x, 0, zr), pt(x, yb + ex, zw - 1.2)));
      [xa - ex].forEach(x => bar(pt(x, 0, zr), pt(x, yb + ex, zw - 1.2), 1.3));
      bar(pt(vx0, vy1, zy(vy1)), pt(vx1, vy1, zy(vy1))); bar(pt(vx0, vy0, zy(vy0)), pt(vx1, vy0, zy(vy0)));
      // vantail soulevé
      poly(g, [pt(vx0, vy0, zy(vy0)), pt(vx1, vy0, zy(vy0)), pt(vx1, vy0 + .06, zy(vy0) + 12), pt(vx0, vy0 + .06, zy(vy0) + 12)], 'rgba(205,240,246,.5)', 0);
      [[vx0, vy0, vx0, vy0 + .06], [vx1, vy0, vx1, vy0 + .06]].forEach(([x, y, X, Y]) => bar(pt(x, y, zy(y)), pt(X, Y, zy(y) + 12), 1));
      bar(pt(vx0, vy0 + .06, zy(vy0) + 12), pt(vx1, vy0 + .06, zy(vy0) + 12), 1);
      glint(pt(vx0 + .04, vy0 + .01, zy(vy0) + 3), pt(vx0 + .1, vy0 + .05, zy(vy0) + 10), 1, .6);
      bar(pt(xa - ex, 0, zr + .6), pt(xb + ex, 0, zr + .6), 1.6, Wd);
      bar(pt(xa - ex, yb + ex, zw - 1.2), pt(xb + ex, yb + ex, zw - 1.2), 1.4, Wd);
      // la tête du tournesol, ravie de prendre l'air
      stem(.6, .97);
      oval(g, s0 + (s1 - s0) * .78 - 4, t0 + (t1 - t0) * .78, 3.8, 1.7, -.5, '#5fa64e', .6);
      const [hx, hy] = [s1 + 1, t1];
      for (let i = 0; i < 14; i++) { const a = i / 14 * TAU; g.save(); g.translate(hx + Math.cos(a) * 5.2, hy + Math.sin(a) * 4.8); g.rotate(a + Math.PI / 2); ell(g, 0, 0, 1.9, 3.4, i % 2 ? '#f6c83a' : '#ffd84a', .6); g.restore(); }
      ball(g, hx, hy, 4.2, '#7a4a20', .8); for (let i = 0; i < 7; i++) ball(g, hx - 2 + hash(i, 2) * 4, hy - 2 + hash(2, i) * 4, .5, '#4a2a10', 0);
      // girouette : un petit crapaud de fer
      ball(g, ...pt(xb + ex, 0, zr + 2.4), 1.8, PAL.gold, .6);
    },
    /* ----- taverne ----- */
    comptoir: g => {
      const OAK = '#8a5530', TOP = '#a8683a', zc = 22, zt = 25;
      // vaisselier du fond : bouteilles et chopes de rechange
      box(g, 0, -.41, .88, .1, 44, 0, '#5e341c', 'wood');
      box(g, 0, -.41, .92, .13, 3, 44, '#7a4a28');
      [27, 37].forEach((z, r) => {
        box(g, 0, -.33, .88, .07, 2, z - 2, OAK);
        let x = -.39; for (let i = 0; i < 9; i++) { const c = ['#3f7a4a', '#a8582a', '#7a2a3a', '#3a578f', '#c9a040'][(i * 3 + r) % 5], [a, b] = pt(x, -.34, z), h = 6 + hash(i, r) * 3; if ((i + r) % 4 === 1) { rrect(g, a - 2.2, b - 5.5, 4.4, 5.5, 1, '#b07a46', .6); ln(g, [[a - 2.2, b - 3.6], [a + 2.2, b - 3.6]], '#4d4b52', .6); } else { rrect(g, a - 1.8, b - h, 3.6, h, 1.4, c, .6); rrect(g, a - .7, b - h - 3, 1.4, 3.4, .5, shade(c, -.1), .5); if (i % 2) rrect(g, a - 1.4, b - h * .6, 2.8, 2.2, .3, '#f1e4c8', 0); ln(g, [[a - .9, b - h + 1], [a - .9, b - 1.5]], 'rgba(255,255,255,.4)', .6); } x += .085 + hash(r, i) * .02; }
      });
      // comptoir massif à panneaux, repose-pied de laiton
      box(g, 0, .08, .92, .3, 3, 0, '#4a2a16');
      box(g, 0, .08, .88, .28, zc - 3, 3, OAK, 'wood');
      const yf = .22 + .002;
      [[-.41, -.15], [-.13, .13], [.15, .41]].forEach(([u, v]) => { poly(g, [pt(u, yf, 6), pt(v, yf, 6), pt(v, yf, 18), pt(u, yf, 18)], shade(OAK, -.18), .7); ln(g, [pt(u + .01, yf, 6.4), pt(v - .01, yf, 6.4), pt(v - .01, yf, 17.4)], 'rgba(255,230,190,.35)', .7); const [ca, cb] = pt((u + v) / 2, yf, 12); oval(g, ca, cb, 3.2, 3.6, 0, shade(OAK, -.05), .6); });
      box(g, 0, .09, .96, .36, 3, zc, TOP, 'wood');
      ln(g, [pt(-.48, .27, zt + .2), pt(.48, .27, zt + .2)], 'rgba(255,235,200,.4)', 1);
      [-.36, 0, .36].forEach(x => ln(g, [pt(x, .22, 4.5), pt(x, .31, 4.5)], '#b8862a', 1.2));
      inkLn(g, [pt(-.46, .31, 4.5), pt(.46, .31, 4.5)], '#e0b040', 1.3);
      // tonneau couché sur son berceau, robinet qui goutte dans une chope
      const bx = -.29, y0 = -.05, y1 = .15, R = 8.5, zb = zt + 1.6 + R, BR = '#9a5f2d', a1 = -.8406;
      const P = (a, r = R) => [r * Math.cos(a) * .894, r * Math.cos(a) * .447 - r * Math.sin(a)];
      [y0 + .04, y1 - .04].forEach(y => box(g, bx, y, .22, .04, 3, zt, '#5e341c'));
      const B = pt(bx, y0, zb), F = pt(bx, y1, zb), [p1x, p1y] = P(a1), [p2x, p2y] = P(a1 + Math.PI), M = [(B[0] + F[0]) / 2, (B[1] + F[1]) / 2];
      vcirc(g, B[0], B[1], R, 1, shade(BR, -.25), .9);
      g.beginPath(); g.moveTo(B[0] + p1x, B[1] + p1y); g.quadraticCurveTo(M[0] + p1x * 1.12, M[1] + p1y * 1.12, F[0] + p1x, F[1] + p1y); g.lineTo(F[0] + p2x, F[1] + p2y); g.quadraticCurveTo(M[0] + p2x * 1.12, M[1] + p2y * 1.12, B[0] + p2x, B[1] + p2y); g.closePath();
      let gr = g.createLinearGradient(B[0] + p1x, B[1] + p1y, B[0] + p2x, B[1] + p2y); gr.addColorStop(0, shade(BR, -.3)); gr.addColorStop(.6, shade(BR, .15)); gr.addColorStop(1, shade(BR, -.1)); g.fillStyle = gr; fi(g, g.fillStyle, .9);
      [.25, .75].forEach(t => { const c = [B[0] + (F[0] - B[0]) * t, B[1] + (F[1] - B[1]) * t], k = 1 + Math.sin(t * Math.PI) * .1; g.beginPath(); for (let i = 0; i <= 14; i++) { const [dx, dy] = P(a1 + Math.PI * i / 14, R * k); g[i ? 'lineTo' : 'moveTo'](c[0] + dx, c[1] + dy); } g.strokeStyle = INK; g.lineWidth = 2.6; g.stroke(); g.strokeStyle = '#6f7480'; g.lineWidth = 1.3; g.stroke(); });
      vcirc(g, F[0], F[1], R, 1, shade(BR, .1), .9);
      vpath(g, F[0], F[1], R * .78, 1); g.strokeStyle = 'rgba(60,30,10,.45)'; g.lineWidth = .8; g.stroke();
      [-.45, .45].forEach(d => ln(g, [[F[0] + d * R * .8 * .894 - 1, F[1] + d * R * .8 * .447 - R * .55], [F[0] + d * R * .8 * .894 + 1, F[1] + d * R * .8 * .447 + R * .55]], 'rgba(60,30,10,.3)', .7));
      const [ta, tb] = [F[0] - 1, F[1] + 2.4];
      rrect(g, ta - 1.4, tb - 2, 2.8, 3, .8, '#d9a032', .7); rrect(g, ta - 1, tb + .4, 2, 3.4, .6, '#d9a032', .6); inkLn(g, [[ta - 2.6, tb - 3.6], [ta + 2.6, tb - 3.6]], '#d9a032', .9); ln(g, [[ta, tb - 2], [ta, tb - 3.6]], '#b8862a', .9);
      const [ma, mb] = pt(bx, .23, zt);
      ln(g, [[ta, tb + 4], [ta, mb - 8.8]], 'rgba(240,170,40,.9)', 1); drop(g, ta, tb + 7, .5, '#f2c050');
      cyl(g, bx, .23, .06, 8, zt, '#b07a46', '#fff6df'); hoop(g, bx, .23, .06, zt + 2); hoop(g, bx, .23, .06, zt + 6);
      // chopes alignées, mousse débordante
      const mug = (x, y, k) => { const [a, b] = pt(x, y, zt); g.beginPath(); g.moveTo(a + 2.6, b - 7); g.bezierCurveTo(a + 6.5, b - 7, a + 6.5, b - 2, a + 2.6, b - 2.4); g.strokeStyle = INK; g.lineWidth = 2.6; g.stroke(); g.strokeStyle = '#c9a060'; g.lineWidth = 1.2; g.stroke(); cyl(g, x, y, .06, 8.5, zt, '#c9a060', '#fff6df'); hoop(g, x, y, .06, zt + 2, '#6f7480'); [[-1.6, -9.6], [.4, -10.4], [2, -9.4]].forEach(([dx, dy]) => ball(g, a + dx, b + dy, 1.7, '#fff6df', .5)); if (k) { ln(g, [[a - 2.6, b - 9.5], [a - 2.9, b - 6.5]], '#fff6df', 1.3); } };
      [[-.08, .13, 1], [.06, .13, 0], [.2, .13, 1], [.34, .14, 0]].forEach(([x, y, k]) => mug(x, y, k));
      // pots de pourboires et pièces
      const [ja, jb] = pt(.36, -.02, zt);
      g.beginPath(); g.moveTo(ja - 3.6, jb - 9); g.lineTo(ja - 3.8, jb - 1); g.quadraticCurveTo(ja, jb + 1.6, ja + 3.8, jb - 1); g.lineTo(ja + 3.6, jb - 9); g.closePath(); g.fillStyle = 'rgba(200,236,240,.35)'; fi(g, g.fillStyle, .8);
      [[-1.8, -2.4], [1.4, -2], [-.2, -3.6], [-1.6, -5], [1.2, -5.4], [0, -6.6]].forEach(([dx, dy], i) => coin(g, ja + dx, jb + dy, .55, (i % 3 - 1) * .3));
      ell(g, ja, jb - 9, 3.6, 1.3, 'rgba(230,250,255,.4)', .7); ln(g, [[ja - 2.6, jb - 7.6], [ja - 2.8, jb - 2.4]], 'rgba(255,255,255,.7)', .9);
      [[.06, .24], [.12, .27]].forEach(([x, y], i) => { const [a, b] = pt(x, y, zt); coin(g, a, b, .55, i * .4); });
      // torchon sur le rebord
      poly(g, [pt(.23, .27, zt + .3), pt(.31, .27, zt + .3), pt(.31, .275, zt - 9), pt(.23, .275, zt - 8)], '#e9e2d0', .7);
      [-6, -3].forEach(dz => ln(g, [pt(.23, .278, zt + dz), pt(.31, .278, zt + dz - .3)], '#3f6aa8', .9));
    },
    piste: g => {
      const h = 5, e = .47, Wd = '#5e341c';
      box(g, 0, 0, e * 2, e * 2, h, 0, '#6a3a1e');
      // parquet ciré, taches de lumière colorées
      const T = [pt(-e, -e, h), pt(e, -e, h), pt(e, e, h), pt(-e, e, h)];
      for (let i = 0; i < 8; i++) { const y = -e + i * e / 4; poly(g, [pt(-e, y, h), pt(e, y, h), pt(e, y + e / 4, h), pt(-e, y + e / 4, h)], i % 2 ? '#c98a4a' : '#b67a3e', .5); const s = -e + hash(i, 3) * e * 1.6; ln(g, [pt(s, y + .003, h), pt(s, y + e / 4 - .003, h)], 'rgba(70,35,12,.45)', .6); }
      g.save(); path(g, T); g.clip();
      [[-.22, .16, '255,110,190'], [.2, -.12, '90,220,255'], [.16, .27, '255,230,90'], [-.18, -.22, '140,255,140'], [.33, .05, '200,140,255']].forEach(([x, y, c]) => { const [a, b] = pt(x, y, h); g.beginPath(); g.ellipse(a, b, 8, 4, 0, 0, TAU); g.fillStyle = `rgba(${c},.38)`; g.fill(); g.beginPath(); g.ellipse(a, b, 4, 2, 0, 0, TAU); g.fillStyle = `rgba(${c},.45)`; g.fill(); });
      const [ca, cb] = pt(0, 0, h); g.beginPath(); g.ellipse(ca, cb, 9, 4.5, 0, 0, TAU); g.fillStyle = 'rgba(255,255,255,.25)'; g.fill();
      ln(g, [pt(-.3, -.42, h), pt(.42, .3, h)], 'rgba(255,248,230,.22)', 5); ln(g, [pt(-.42, -.24, h), pt(.24, .42, h)], 'rgba(255,248,230,.16)', 2.5);
      g.restore();
      ln(g, [pt(-e, e, h), pt(e, e, h), pt(e, -e, h)], 'rgba(255,240,200,.5)', .9);
      // potence de guingois, lampions
      box(g, .41, -.41, .06, .06, 72, h, Wd, 'wood');
      const [pa, pb] = pt(.41, -.41, h + 70), [qa, qb] = pt(-.03, .03, h + 70);
      inkLn(g, [[pa + 2, pb], [qa - 1, qb]], '#7a4a28', 2.6);
      inkLn(g, [[pa, pb + 13], [pa - 12, pb]], '#7a4a28', 1.6);
      [[.29, '#e04a3a'], [.17, '#f2c83a'], [.07, '#5fbf5a']].forEach(([t, c], i) => {
        const [la, lb] = pt(t, -t, h + 70), d = 4 + i * 1.5; ln(g, [[la, lb + 1], [la, lb + d]], INK, .6);
        rrect(g, la - 1.4, lb + d - .6, 2.8, 1.2, .4, '#4d4b52', 0); oval(g, la, lb + d + 3.4, 2.6, 3.2, 0, c, .7);
        [-1, 1].forEach(s => { g.beginPath(); g.ellipse(la, lb + d + 3.4, 1.3, 3, 0, s > 0 ? -1.4 : 1.7, s > 0 ? 1.4 : 4.5); g.strokeStyle = 'rgba(80,30,10,.45)'; g.lineWidth = .5; g.stroke(); });
        ell(g, la - .8, lb + d + 2.4, .7, 1, 'rgba(255,255,230,.8)', 0);
      });
      // boule à facettes de bric et de broc
      const bx = qa, by = qb + 22, R = 8.4;
      ln(g, [[bx, qb], [bx, by - R - 1]], INK, .9); rrect(g, bx - 1.6, by - R - 2.2, 3.2, 2, .6, '#8a8f99', .5);
      ball(g, bx, by, R, '#aab3c2', 1);
      g.save(); g.beginPath(); g.arc(bx, by, R, 0, TAU); g.clip();
      for (let i = 0; i < 6; i++) for (let j = 0; j < 8; j++) {
        const f0 = -Math.PI / 2 + i * Math.PI / 6, f1 = f0 + Math.PI / 6, l0 = -Math.PI / 2 + j * Math.PI / 8, l1 = l0 + Math.PI / 8;
        const P = (f, l) => [bx + R * Math.cos(f) * Math.sin(l), by - R * Math.sin(f)];
        const k = hash(i, j, 3), col = k > .9 ? '#ff7ab0' : k > .82 ? '#7ae0ff' : k > .74 ? '#ffe27a' : k > .45 ? '#e8eef6' : k > .2 ? '#aab3c2' : '#7d8696';
        path(g, [P(f0, l0), P(f0, l1), P(f1, l1), P(f1, l0)]); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(40,46,60,.55)'; g.lineWidth = .4; g.stroke();
      }
      coin(g, bx + 3, by + 2.6, .6, -.3); ball(g, bx - 3.6, by - 1.4, 1.5, '#c8382e', .5); rrect(g, bx - 2, by + 4.2, 6, 1.6, .3, 'rgba(241,228,200,.9)', 0);
      const sh = g.createRadialGradient(bx - 3, by - 3, 1, bx, by, R * 1.1); sh.addColorStop(0, 'rgba(255,255,255,.55)'); sh.addColorStop(.4, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(20,24,40,.45)'); g.fillStyle = sh; g.fillRect(bx - R, by - R, R * 2, R * 2);
      g.restore();
      g.beginPath(); g.arc(bx, by, R, 0, TAU); g.strokeStyle = '#3a4050'; g.lineWidth = 1; g.stroke();
      g.save(); g.translate(bx - R + .6, by + 1); g.rotate(-.5); inkLn(g, [[0, 0], [-6, 0]], '#cfd4dc', .9); oval(g, -7.4, 0, 2, 1.3, 0, '#cfd4dc', .6); g.restore();
      [[-11, -5, 2.6], [10, -8, 3.2], [12, 6, 2], [-9, 9, 1.8], [2, -13, 1.6]].forEach(([dx, dy, r]) => spark(g, bx + dx, by + dy, r));
      // notes de musique et une babouche égarée
      [[-17, -42, 1, '#ffd76a', -.15], [16, -30, .8, '#9be0ff', .2]].forEach(([x, y, s, c, r]) => { g.save(); g.translate(x, y); g.rotate(r); g.scale(s, s); inkLn(g, [[2.6, -.6], [2.6, -10], [6.6, -6.2]], c, 1.3); g.rotate(-.42); ell(g, 0, 0, 3.3, 2.3, c, .9); g.restore(); });
      { const [a, b] = pt(-.28, .3, h); g.beginPath(); g.moveTo(a - 5, b); g.quadraticCurveTo(a - 5, b - 3.4, a, b - 3); g.quadraticCurveTo(a + 4, b - 2.6, a + 6.5, b - 4.6); g.quadraticCurveTo(a + 5.6, b + .4, a + 1, b + 1); g.closePath(); fi(g, '#c8413a', .8); ln(g, [[a - 3.6, b - 1.6], [a - .4, b - 1.8]], '#f2c83a', .8); }
      // lampions au ras de l'estrade
      for (let i = 0; i < 7; i++) { const t = -e + .07 + i * .135; [[t, e + .005], [e + .005, -t]].forEach(([x, y], k) => { if (k && i === 0) return; const [a, b] = pt(x, y, 2.6); ball(g, a, b, 1.25, ['#ff6a8a', '#ffd34a', '#6ad0ff', '#8aff8a'][(i + k) % 4], .5); ball(g, a - .4, b - .4, .4, '#ffffff', 0); }); }
    },
    /* ----- atelier ----- */
    pedale: g => {
      const x0 = -.42, x1 = .42, y0 = -.22, y1 = .12, zt = 20, Wd = '#8a5530';
      [[x0 + .04, y0 + .04], [x1 - .04, y0 + .04]].forEach(([x, y]) => box(g, x, y, .06, .06, zt, 0, shade(Wd, -.2)));
      box(g, 0, (y0 + y1) / 2, x1 - x0 - .06, .04, 3, 5, shade(Wd, -.1));
      [[x0 + .04, y1 - .04]].forEach(([x, y]) => box(g, x, y, .06, .06, zt, 0, shade(Wd, -.2)));
      box(g, 0, (y0 + y1) / 2, x1 - x0, y1 - y0, 4, zt, Wd, 'wood');
      box(g, x1 - .04, y1 - .04, .06, .06, zt, 0, shade(Wd, -.2));
      ln(g, [pt(x0, y1, zt + 4.2), pt(x1, y1, zt + 4.2)], 'rgba(255,235,200,.35)', .8);
      // étau de bois au bord de l'établi
      box(g, -.32, y1 + .02, .14, .05, 7, zt - 2, '#6a3c20', 'wood'); inkLn(g, [pt(-.32, y1 + .05, zt + 1), pt(-.32, y1 + .16, zt + 1)], '#8a8f99', 1); inkLn(g, [pt(-.37, y1 + .16, zt + 1), pt(-.27, y1 + .16, zt + 1)], '#8a8f99', .9);
      ball(g, ...pt(-.37, y1 + .16, zt + 1), .9, '#8a8f99', .4); ball(g, ...pt(-.27, y1 + .16, zt + 1), .9, '#8a8f99', .4);
      // la meule de grès dans son bâti, manivelle et bielle jusqu'à la pédale
      const gx = .24, gy = -.05, R = 12.5, zg = zt + 4 + R - 2;
      box(g, gx, gy - .1, .05, .04, zg - zt - 2, zt + 4, '#6a3c20', 'wood');
      box(g, gx, gy, .3, .15, 6, zt + 4, '#5e341c', 'wood');
      poly(g, [pt(gx - .14, gy - .065, zt + 10), pt(gx + .14, gy - .065, zt + 10), pt(gx + .14, gy + .065, zt + 10), pt(gx - .14, gy + .065, zt + 10)], '#4a6a7a', .6);
      const [ga, gb] = pt(gx, gy, zg);
      vcirc(g, ga, gb, R, 1, '#a39a8c', 1.1);
      vpath(g, ga, gb, R * .78, 1); g.strokeStyle = 'rgba(70,60,50,.35)'; g.lineWidth = .8; g.stroke();
      vpath(g, ga, gb, R, 1); g.save(); g.clip(); ln(g, [[ga - 7, gb - 8], [ga - 10.5, gb + 1]], 'rgba(255,250,235,.5)', 1.8); ln(g, [[ga + 2, gb + 6], [ga + 8, gb + 8]], 'rgba(60,50,40,.3)', 1); g.restore();
      poly(g, [pt(gx - .15, gy + .075, zt + 4), pt(gx + .15, gy + .075, zt + 4), pt(gx + .15, gy + .075, zt + 10), pt(gx - .15, gy + .075, zt + 10)], '#6a3c20', .8);
      const [ha, hb] = pt(gx, gy + .16, zg);
      inkLn(g, [[ga, gb], [ha, hb]], '#6f7480', 1.3); ball(g, ga, gb, 2.3, '#8a8f99', .7);
      box(g, gx, gy + .1, .05, .04, zg - zt - 2, zt + 4, '#7a4a28', 'wood');
      const [ka, kb] = [ha, hb + 6.5];
      inkLn(g, [[ha, hb], [ka, kb]], '#6f7480', 1.2); ball(g, ha, hb, 1.2, '#8a8f99', .5);
      // la pédale, la bielle de fer
      box(g, .08, .3, .05, .14, 2, 0, '#4a2a16');
      poly(g, [pt(.08, .24, 1.6), pt(.38, .24, 4.6), pt(.38, .36, 4.6), pt(.08, .36, 1.6)], '#a8683a', .9); [.16, .24, .32].forEach(x => ln(g, [pt(x, .25, 1.8 + (x - .08) * 10), pt(x, .35, 1.8 + (x - .08) * 10)], 'rgba(45,22,8,.4)', .6));
      const [pa, pb] = pt(gx, .3, 3.3); inkLn(g, [[pa, pb], [ka, kb]], '#5a5e68', .9); ball(g, ka, kb, 1.1, '#b8bcc6', .5); ball(g, pa, pb, 1, '#6f7480', .5);
      // une lame qu'on aiguise : gerbe d'étincelles
      const ct = Math.PI + .5, [ea, eb] = [ga + Math.cos(ct) * R * .894, gb + Math.cos(ct) * R * .447 - Math.sin(ct) * R];
      g.save(); g.translate(ea, eb); g.rotate(.18); poly(g, [[-11, -1.1], [-.4, -1.5], [1.4, 0], [-.4, 1.3], [-11, 1]], '#dfe3ea', .7); ln(g, [[-10, -.2], [-1, -.4]], 'rgba(255,255,255,.8)', .5); rrect(g, -16.4, -1.5, 5.6, 3, 1, '#7a3a2a', .6); rrect(g, -11.4, -2.6, 1.2, 5.2, .4, PAL.gold, .5); g.restore();
      [[-3, -4, -9, -12], [-2, -5, -4, -14], [-4, -2, -12, -7], [-3, -3, -11, -14]].forEach(([u, v, w, z]) => { ln(g, [[ea + u, eb + v], [ea + w, eb + z]], 'rgba(255,170,40,.55)', 2); ln(g, [[ea + u, eb + v], [ea + w, eb + z]], '#fff2a0', .8); });
      [[-9, -13, 2.6], [-4, -16, 1.8], [-13, -8, 2], [-11.5, -15.5, 1.4]].forEach(([dx, dy, r]) => spark(g, ea + dx, eb + dy, r, '#fff6c0'));
      // copeaux sur l'établi et en tas au sol
      const loop = (x, y, r, rot, i) => { g.beginPath(); g.ellipse(x, y, r, r * .62, rot, 0, TAU); g.strokeStyle = '#9a6a30'; g.lineWidth = 1.5; g.stroke(); g.strokeStyle = ['#f3d79a', '#e6bd7c', '#f8e4b4'][i % 3]; g.lineWidth = .8; g.stroke(); };
      [[-.3, -.04], [-.22, .04], [-.12, -.1], [-.36, .06]].forEach(([x, y], i) => { const [a, b] = pt(x, y, zt + 4.6); loop(a, b, 1.5, i, i); });
      for (let i = 0; i < 16; i++) { const t = hash(i, 9), u = hash(9, i), [a, b] = pt(-.36 + t * .24, .24 + u * .2, 1 + (1 - Math.abs(t - .5) * 2) * (1 - Math.abs(u - .5) * 2) * 3.5); loop(a, b, 1.3 + hash(i, 4) * .7, i * 1.3, i); }
    },
    /* ----- bibliothèque ----- */
    rayonnage: g => {
      const W = '#5e341c', W2 = '#7a4a28', yb = -.42, yf = -.2, xh = .45, H = 80, BK = ['#a8382f', '#33508a', '#56904a', '#d2992a', '#6c4aa8', '#7a3a22', '#2f6a6a'];
      box(g, 0, yb + .03, xh * 2, .06, H, 0, shade(W, -.2), 'wood');
      box(g, -xh + .02, (yb + yf) / 2, .04, yf - yb, H, 0, W, 'wood');
      const rows = [4, 19, 34, 49, 64];
      rows.forEach((z, r) => {
        box(g, 0, (yb + yf) / 2, xh * 2 - .06, yf - yb, 2.2, z - 2.2, W2);
        let x = -xh + .05;
        for (let i = 0; i < 14 && x < xh - .08; i++) {
          const k = hash(i, r + 7), w = .045 + k * .035, h = 9 + hash(r, i + 2) * 4.5, c = BK[Math.floor(hash(i + r, 3) * BK.length)], yy = yf - .03;
          if (r === 2 && i === 4) { const [a, b] = pt(x + .05, yy, z); ball(g, a, b - 4.6, 4.4, PAL.bone, .8); ell(g, a - 1.5, b - 5, 1.1, 1.3, INK, 0); ell(g, a + 1.5, b - 5, 1.1, 1.3, INK, 0); ln(g, [[a - 1.6, b - 1.6], [a + 1.6, b - 1.6]], INK, .6); x += .13; continue; }
          if (r === 4 && i === 2) { x += .12; continue; }
          if (r === 1 && i === 6) { const [a, b] = pt(x + .03, yy, z); rrect(g, a - 2, b - 7, 4, 7, 1.6, '#6fd09a', .6); rrect(g, a - .8, b - 9.4, 1.6, 2.6, .5, '#cfe9dc', .5); ln(g, [[a - .9, b - 6], [a - .9, b - 2]], 'rgba(255,255,255,.5)', .6); x += .08; continue; }
          if (hash(r, i, 5) > .86 && i > 2) { const [a, b] = pt(x, yy, z), q = h * .8; poly(g, [[a, b], [a + w * 32, b + w * 16], [a + w * 32 + q * .45, b + w * 16 - q], [a + q * .45, b - q]], c, .7); ln(g, [[a + q * .1, b - q * .25], [a + w * 32 + q * .1, b + w * 16 - q * .25]], PAL.gold, .6); x += w + .06; continue; }
          box(g, x + w / 2, yy, w, .04, h, z, c);
          [2.2, h - 2.4].forEach(dz => ln(g, [pt(x + .006, yy + .02, z + dz), pt(x + w - .006, yy + .02, z + dz)], 'rgba(240,200,90,.85)', .6));
          x += w + .006;
        }
      });
      box(g, 0, (yb + yf) / 2, xh * 2 - .06, yf - yb, 2.2, H - 2.2, W2);
      box(g, xh - .02, (yb + yf) / 2, .04, yf - yb, H, 0, W, 'wood');
      box(g, 0, (yb + yf) / 2 + .01, xh * 2 + .06, yf - yb + .06, 4, H, shade(W, .05), 'wood');
      ln(g, [pt(-xh - .03, yf + .04, H + 2), pt(xh + .03, yf + .04, H + 2)], 'rgba(233,185,73,.8)', .9);
      // toile d'araignée dans le coin
      const [wa, wb] = pt(-xh + .04, yf, H - .5);
      [[0, 9], [5, 8], [8.5, 4.5], [9.6, 0]].forEach(([dx, dy]) => ln(g, [[wa, wb], [wa + dx, wb + dy]], 'rgba(230,230,240,.7)', .5));
      [3.5, 6.5].forEach(r => { g.beginPath(); g.arc(wa, wb, r, 0, Math.PI / 2); g.strokeStyle = 'rgba(230,230,240,.6)'; g.lineWidth = .5; g.stroke(); });
      // chouette sculptée sur la corniche
      { const [a, b] = pt(0, (yb + yf) / 2, H + 4); oval(g, a, b - 6, 5.2, 6.4, 0, '#8a5a32', .9); oval(g, a, b - 4.4, 3.2, 3.6, 0, '#c99a62', .6); [-2.2, 2.2].forEach(dx => { ball(g, a + dx, b - 9, 2.2, '#f2e2a8', .6); ball(g, a + dx, b - 9, 1, INK, 0); poly(g, [[a + dx * 1.4, b - 11], [a + dx * 2.2, b - 14.6], [a + dx * .6, b - 11.8]], '#8a5a32', .6); }); poly(g, [[a - .8, b - 7.6], [a + .8, b - 7.6], [a, b - 6]], '#e9b949', .4); }
      // un grimoire s'est fait la malle
      { const [a, b] = pt(-.3, .02, 58), C = '#6c4aa8';
        g.save(); g.translate(a, b); g.rotate(-.2);
        poly(g, [[0, 0], [-7.5, -3.4], [-8.6, 2.4], [0, 4.6]], C, .8); poly(g, [[0, 0], [7.5, -3.4], [8.6, 2.4], [0, 4.6]], shade(C, -.15), .8);
        poly(g, [[0, -.6], [-6.4, -3.4], [-7.2, 1.4], [0, 3.6]], '#f3ecd4', .6); poly(g, [[0, -.6], [6.4, -3.4], [7.2, 1.4], [0, 3.6]], '#fbf6e2', .6);
        [-1.2, .2].forEach(dy => { ln(g, [[-1.5, dy], [-5.5, dy - 1.6]], 'rgba(80,60,50,.45)', .5); ln(g, [[1.5, dy], [5.5, dy - 1.6]], 'rgba(80,60,50,.45)', .5); });
        g.restore();
        [[-11, 2, -15, 1], [-11, 5, -14, 6]].forEach(([u, v, w, z]) => ln(g, [[a + u, b + v], [a + w, b + z]], 'rgba(255,255,255,.55)', .8));
        spark(g, a + 9, b - 6, 2.2, '#d6ffe6'); }
      // l'échelle appuyée
      const lad = x => [pt(x, .2, 0), pt(x, yf + .02, 70)];
      const L1 = lad(.3), L2 = lad(.4);
      for (let i = 1; i < 9; i++) { const t = i / 9, p = [L1[0][0] + (L1[1][0] - L1[0][0]) * t, L1[0][1] + (L1[1][1] - L1[0][1]) * t], q = [L2[0][0] + (L2[1][0] - L2[0][0]) * t, L2[0][1] + (L2[1][1] - L2[0][1]) * t]; inkLn(g, [p, q], '#c08a52', .7); }
      inkLn(g, L1, '#a8743e', 1.1); inkLn(g, L2, '#a8743e', 1.1);
    },
    globe: g => {
      const W = '#6a3c20', GO = '#e9b949', BR = '#d9a032', cy = -55;
      // pied tripode à griffes dorées
      const leg = th => { const [fa, fb] = pt(Math.cos(th) * .3, Math.sin(th) * .3, 0), [ta, tb] = pt(Math.cos(th) * .05, Math.sin(th) * .05, 13), [ma, mb] = pt(Math.cos(th) * .3, Math.sin(th) * .3, 12); g.beginPath(); g.moveTo(ta, tb); g.quadraticCurveTo(ma, mb, fa, fb - 2); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 4.2; g.stroke(); g.strokeStyle = W; g.lineWidth = 2.4; g.stroke(); g.strokeStyle = 'rgba(255,230,190,.3)'; g.lineWidth = .8; g.stroke(); ball(g, fa, fb - 1.4, 2.3, GO, .7); };
      const L = [Math.PI * .25, Math.PI * .25 + TAU / 3, Math.PI * .25 - TAU / 3].map(t => t + .5), front = t => Math.sin(t + Math.PI / 4) > 0;
      L.filter(t => !front(t)).forEach(leg);
      cyl(g, 0, 0, .07, 24, 10, W); hoop(g, 0, 0, .07, 14, BR); hoop(g, 0, 0, .07, 30, BR);
      L.filter(front).forEach(leg);
      const [ca, cb] = pt(0, 0, 34); ell(g, ca, cb, 5.5, 2.4, BR, .8);
      // anneaux : moitiés arrière
      const ring = (rx, ry, rot, a0, a1, col, w) => { g.beginPath(); g.ellipse(0, cy, rx, ry, rot, a0, a1); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = w + 2; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); g.strokeStyle = 'rgba(255,250,220,.45)'; g.lineWidth = w * .3; g.stroke(); };
      const ticks = (rx, ry, rot, a0, a1) => { for (let i = 0; i <= 24; i++) { const a = a0 + (a1 - a0) * i / 24, x = Math.cos(a) * rx, y = Math.sin(a) * ry, c = Math.cos(rot), s = Math.sin(rot); const X = x * c - y * s, Y = x * s + y * c; if (i % 2) ball(g, X, cy + Y, .5, '#7a4a10', 0); } };
      [[-24, -1], [24, -1]].forEach(([dx]) => { g.beginPath(); g.moveTo(0, cb - 2); g.quadraticCurveTo(dx * .9, cb - 2, dx * .86, cy + 2); g.strokeStyle = INK; g.lineWidth = 2.8; g.stroke(); g.strokeStyle = BR; g.lineWidth = 1.4; g.stroke(); });
      ring(22, 8.4, 0, Math.PI, TAU, '#8a5530', 2.6);
      ring(18.5, 6.4, -.42, Math.PI, TAU, GO, 2.2);
      ring(7.4, 20, -.28, Math.PI / 2, Math.PI * 1.5, BR, 1.8);
      // le globe des étoiles
      ball(g, 0, cy, 12.5, '#26386e', 1);
      g.save(); g.beginPath(); g.arc(0, cy, 12.5, 0, TAU); g.clip();
      g.beginPath(); g.ellipse(0, cy, 12.5, 4.2, -.28, 0, Math.PI); g.strokeStyle = 'rgba(233,185,73,.8)'; g.lineWidth = 1; g.stroke();
      ln(g, [[-7, cy - 4], [-3, cy - 7], [1, cy - 5], [4, cy - 8.5]], 'rgba(233,185,73,.7)', .5); ln(g, [[2, cy + 3], [6, cy + 1], [8, cy + 5]], 'rgba(233,185,73,.7)', .5);
      [[-7, -4, 1.4], [-3, -7, 1.2], [1, -5, 1.6], [4, -8.5, 1.1], [2, 3, 1.3], [6, 1, 1], [8, 5, 1.2], [-6, 5, 1], [-9, 1, .8], [5, -2, .7]].forEach(([x, y, r]) => spark(g, x, cy + y, r * 1.3, '#ffe27a'));
      g.beginPath(); g.arc(-3.5, cy + 4.5, 2.6, 0, TAU); g.arc(-2.4, cy + 3.8, 2.2, 0, TAU, true); g.fillStyle = '#f3e3a6'; g.fill();
      const sh = g.createRadialGradient(-4, cy - 5, 1, 0, cy, 13); sh.addColorStop(0, 'rgba(160,190,255,.4)'); sh.addColorStop(.5, 'rgba(160,190,255,0)'); sh.addColorStop(1, 'rgba(5,10,30,.5)'); g.fillStyle = sh; g.fillRect(-13, cy - 13, 26, 26);
      g.restore();
      // anneaux : moitiés avant, axe et soleil
      ring(7.4, 20, -.28, -Math.PI / 2, Math.PI / 2, BR, 1.8);
      ring(18.5, 6.4, -.42, 0, Math.PI, GO, 2.2); ticks(18.5, 6.4, -.42, .15, Math.PI - .15);
      ring(22, 8.4, 0, 0, Math.PI, '#8a5530', 2.6);
      g.beginPath(); g.ellipse(0, cy, 22, 8.4, 0, .1, Math.PI - .1); g.strokeStyle = GO; g.lineWidth = .7; g.stroke();
      const ax = Math.sin(.28), ay = Math.cos(.28);
      inkLn(g, [[ax * 25, cy + ay * 25], [-ax * 23, cy - ay * 23]], BR, 1);
      const [sx, sy] = [-ax * 26, cy - ay * 26];
      for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; poly(g, [[sx + Math.cos(a - .3) * 2.6, sy + Math.sin(a - .3) * 2.6], [sx + Math.cos(a) * 5.4, sy + Math.sin(a) * 5.4], [sx + Math.cos(a + .3) * 2.6, sy + Math.sin(a + .3) * 2.6]], '#ffd34a', .5); }
      ball(g, sx, sy, 3, '#ffc83a', .7);
      [[-25, -24, 3], [24, -12, 2.6], [-21, 6, 2.2], [17, -38, 2], [27, 4, 1.8]].forEach(([x, y, r]) => spark(g, x, cy + y + 10, r, '#ffe9a0'));
    },
    /* ----- laboratoire ----- */
    athanor: g => {
      const BK = '#9a4a34', CU = '#c7803f', r = .22, z0 = 6, z1 = 50, [cx, cy] = pt(0, 0, 0), rx = r * 45, ry = r * 22.5, fy = cy + ry;
      box(g, 0, 0, .64, .64, z0, 0, '#6d655c', 'stone');
      cyl(g, 0, 0, r, z1 - z0, z0, BK, shade(BK, -.2));
      // briques
      for (let z = z0 + 4.5, k = 0; z < z1 - 1; z += 4.5, k++) {
        g.beginPath(); g.ellipse(cx, cy - z, rx, ry, 0, .05, Math.PI - .05); g.strokeStyle = 'rgba(40,14,8,.4)'; g.lineWidth = .7; g.stroke();
        for (let j = 0; j < 7; j++) { const a = (j + (k % 2) * .5) / 7 * Math.PI + .1, x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; if (a < Math.PI - .05) ln(g, [[x, y - z], [x, y - z + 4.5]], 'rgba(40,14,8,.35)', .6); }
      }
      hoop(g, 0, 0, r + .005, 24, CU); hoop(g, 0, 0, r + .005, 42, CU);
      // gueule du foyer, hublot de l'œuf philosophal
      g.beginPath(); g.moveTo(cx - 5.5, fy - 8); g.lineTo(cx - 5.5, fy - 15); g.quadraticCurveTo(cx, fy - 22, cx + 5.5, fy - 15); g.lineTo(cx + 5.5, fy - 8); g.closePath();
      let gr = g.createLinearGradient(0, fy - 20, 0, fy - 8); gr.addColorStop(0, '#5a1408'); gr.addColorStop(.6, '#e8601e'); gr.addColorStop(1, '#ffd060'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#3a3a42'; g.lineWidth = 1.6; g.stroke();
      [[-3, -9.4], [0, -8.8], [2.8, -9.6]].forEach(([dx, dy]) => ball(g, cx + dx, fy + dy, 1.1, '#fff1a8', 0));
      const [wa, wb] = [cx + .5, fy - 33];
      ball(g, wa, wb, 4.6, '#3a3a42', .9); ball(g, wa, wb, 3.4, '#2a1030', 0); oval(g, wa, wb + .3, 1.7, 2.3, 0, '#e6c8ff', .5); halo(g, wa, wb, 5, '200,140,255', .7);
      [[0, -4.6], [4.6, 0], [0, 4.6], [-4.6, 0]].forEach(([dx, dy]) => ball(g, wa + dx, wb + dy, .7, CU, .3));
      // dôme de cuivre et cheminée
      g.beginPath(); g.ellipse(cx, cy - z1, rx + .6, ry + .3, 0, 0, Math.PI); g.ellipse(cx, cy - z1, rx + .6, 11, 0, Math.PI, TAU); g.closePath(); g.fillStyle = radial(g, cx - 3, cy - z1 - 6, 12, CU); fi(g, g.fillStyle, 1);
      ln(g, [[cx - 6, cy - z1 - 5], [cx - 2, cy - z1 - 9.5]], 'rgba(255,240,200,.6)', 1.1);
      cyl(g, 0, 0, .05, 12, z1 + 9, '#a8682e', '#3a2a20');
      poly(g, [[cx - 4.6, cy - z1 - 21], [cx + 4.6, cy - z1 - 21], [cx + 2, cy - z1 - 25], [cx - 2, cy - z1 - 25]], '#a8682e', .8);
      // cornue verte sur trépied (à gauche), ballon rose sur sa pierre (à droite)
      const [ta, tb] = pt(-.3, .18, 0);
      [[-4, 1], [3.6, 1.4], [-.4, -2]].forEach(([dx, dy]) => inkLn(g, [[ta + dx, tb + dy], [ta + dx * .4, tb - 10]], '#3a3a42', .9));
      ell(g, ta, tb - 10, 4, 1.6, '#3a3a42', .6);
      cyl(g, -.3, .18, .045, 3, 1, '#c7803f', '#5a3a20'); ln(g, [[ta, tb - 4], [ta, tb - 5.4]], INK, .6);
      const [ba, bb] = [ta, tb - 15.5];
      g.beginPath(); g.moveTo(ba + 2, bb - 4.4); g.quadraticCurveTo(ba + 6, bb - 13, cx - 8.4, fy - 26); g.strokeStyle = '#7aa0a8'; g.lineWidth = 3.4; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#d8f0f4'; g.lineWidth = 1.8; g.stroke();
      ball(g, ba, bb, 5.4, 'rgba(210,240,245,.55)', .9);
      g.save(); g.beginPath(); g.arc(ba, bb, 5.4, 0, TAU); g.clip(); g.fillStyle = '#4fcf7a'; g.fillRect(ba - 6, bb - .5, 12, 7); ell(g, ba, bb - .5, 5.4, 1.4, '#9af0b0', 0); g.restore();
      g.beginPath(); g.arc(ba, bb, 5.4, 0, TAU); g.strokeStyle = '#4a6a70'; g.lineWidth = .9; g.stroke();
      ln(g, [[ba - 3, bb - 2.6], [ba - 1.4, bb - 4]], 'rgba(255,255,255,.85)', 1); [[1.4, 1.6], [-1, 2.8]].forEach(([dx, dy]) => ball(g, ba + dx, bb + dy, .7, '#d8ffe4', 0));
      box(g, .36, -.02, .13, .13, 7, 0, '#857d72', 'stone');
      const [fa, fb] = pt(.36, -.02, 7), [qa, qb] = [fa, fb - 6];
      g.beginPath(); g.moveTo(qa + .4, qb - 9); g.lineTo(qa + .4, qb - 13); g.quadraticCurveTo(qa - 1, qb - 19, cx + 8.4, fy - 34); g.strokeStyle = '#7aa0a8'; g.lineWidth = 3; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#d8f0f4'; g.lineWidth = 1.5; g.stroke();
      ball(g, qa, qb, 5.6, 'rgba(210,240,245,.55)', .9);
      g.save(); g.beginPath(); g.arc(qa, qb, 5.6, 0, TAU); g.clip(); g.fillStyle = '#e860a8'; g.fillRect(qa - 6, qb - 1, 12, 8); ell(g, qa, qb - 1, 5.4, 1.4, '#ffb0dc', 0); g.restore();
      g.beginPath(); g.arc(qa, qb, 5.6, 0, TAU); g.strokeStyle = '#4a6a70'; g.lineWidth = .9; g.stroke();
      ln(g, [[qa - 3, qb - 2.8], [qa - 1.4, qb - 4.2]], 'rgba(255,255,255,.85)', 1); [[1.2, 2], [-1.6, 3.2]].forEach(([dx, dy]) => ball(g, qa + dx, qb + dy, .7, '#ffe0f0', 0));
      // fumées colorées, la dernière ricane
      const [sa, sb] = [cx, cy - z1 - 25];
      [[1, -3, 3.4, '#b99cf2'], [3.5, -9, 4.4, '#8fe0a8'], [1.5, -17, 5.6, '#f6a8d8']].forEach(([dx, dy, rr, c]) => { ball(g, sa + dx, sb + dy, rr, c, .8); ball(g, sa + dx - rr * .5, sb + dy + rr * .2, rr * .6, c, 0); });
      const [ka, kb] = [sa + 1.5, sb - 17];
      ell(g, ka - 2, kb - .8, 1.3, 1.6, '#5a2a5a', 0); ell(g, ka + 2, kb - .8, 1.3, 1.6, '#5a2a5a', 0); poly(g, [[ka - .5, kb + 1.2], [ka + .5, kb + 1.2], [ka, kb + .2]], '#5a2a5a', 0);
      [-1.6, 0, 1.6].forEach(dx => ln(g, [[ka + dx, kb + 2.6], [ka + dx, kb + 3.6]], '#5a2a5a', .6));
      spark(g, sa + 9, sb - 12, 2, '#f0e2ff'); spark(g, sa - 7, sb - 20, 1.6, '#e8fff0');
    },
    /* ----- forge ----- */
    hautfourneau: g => {
      const BR = '#a04a32', z0 = 5, z1 = 54, h0 = .4, h1 = .25, H = z => h0 + (h1 - h0) * (z - z0) / (z1 - z0), JT = 'rgba(40,14,8,.42)';
      box(g, 0, 0, .9, .9, z0, 0, '#6d655c', 'stone');
      poly(g, [pt(-h0, h0, z0), pt(h0, h0, z0), pt(h1, h1, z1), pt(-h1, h1, z1)], BR, 1);
      poly(g, [pt(h0, -h0, z0), pt(h0, h0, z0), pt(h1, h1, z1), pt(h1, -h1, z1)], shade(BR, -.3), 1);
      // appareil de briques
      for (let z = z0 + 4.1, k = 0; z < z1 - 1; z += 4.1, k++) {
        const h = H(z), hn = H(z + 4.1);
        ln(g, [pt(-h, h, z), pt(h, h, z), pt(h, -h, z)], JT, .7);
        for (let j = 0; j < 7; j++) { const f = (j + (k % 2) * .5 + .25) / 7 * 2 - 1; if (z + 4.1 < z1) { ln(g, [pt(f * h, h, z), pt(f * hn, hn, z + 4.1)], JT, .6); ln(g, [pt(h, -f * h, z), pt(hn, -f * hn, z + 4.1)], JT, .6); } }
      }
      [20, 40].forEach(z => { const h = H(z) + .006; inkLn(g, [pt(-h, h, z), pt(h, h, z), pt(h, -h, z)], '#4d4b52', 1.1); [-.6, 0, .6].forEach(f => { ball(g, ...pt(f * h, h, z), .8, '#8a8f99', .3); ball(g, ...pt(h, -f * h, z), .8, '#8a8f99', .3); }); });
      // la bouche rougeoyante
      const M = [pt(-.13, H(z0) + .004, z0)]; for (let i = 0; i <= 12; i++) { const t = Math.PI - i / 12 * Math.PI, z = 17 + Math.sin(t) * 7; M.push(pt(Math.cos(t) * .13, H(z) + .004, z)); } M.push(pt(.13, H(z0) + .004, z0));
      path(g, M); const [, m0, , m1] = bbox(M); let gr = g.createLinearGradient(0, m0, 0, m1); gr.addColorStop(0, '#7a1a08'); gr.addColorStop(.45, '#f0641e'); gr.addColorStop(1, '#ffe27a'); g.fillStyle = gr; g.fill();
      g.beginPath(); M.slice(1, -1).forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](...p)); g.strokeStyle = '#c8a888'; g.lineWidth = 2.6; g.stroke(); g.strokeStyle = '#3a2016'; g.lineWidth = .8; g.stroke();
      halo(g, ...pt(0, h0, 12), 18, '255,150,60', .45);
      // goulotte et coulée de métal en fusion
      const [sa, sb] = pt(0, h0 + .02, z0 + .5), [ea, eb] = pt(0, h0 + .1, z0 - .5);
      poly(g, [[sa - 3.4, sb - 1.2], [sa + 2.6, sb - 2.4], [ea + 2.6, eb - 2.4], [ea - 3.4, eb - 1.2]], '#5a5a62', .8);
      ln(g, [[sa - .4, sb - 1.8], [ea - .4, eb - 1.8]], '#ffb030', 1.6); ln(g, [[sa - .4, sb - 1.8], [ea - .4, eb - 1.8]], '#fff2a0', .6);
      const [ka, kb] = pt(0, h0 + .1, 0); ln(g, [[ea - .4, eb - 1.4], [ka - .4, kb - 3.5]], '#ffb030', 1.3);
      cyl(g, 0, h0 + .1, .045, 3.6, 0, '#4d4b52', '#ff9a30'); ball(g, ka - .6, kb - 4, .8, '#fff2a0', 0);
      // plateforme, cheminée de briques, braises
      poly(g, [pt(-h1, -h1, z1), pt(h1, -h1, z1), pt(h1, h1, z1), pt(-h1, h1, z1)], shade(BR, .1), 1);
      const ch = .13, zc = 94;
      poly(g, [pt(-ch, ch, z1), pt(ch, ch, z1), pt(ch, ch, zc), pt(-ch, ch, zc)], BR, 1);
      poly(g, [pt(ch, -ch, z1), pt(ch, ch, z1), pt(ch, ch, zc), pt(ch, -ch, zc)], shade(BR, -.3), 1);
      for (let z = z1 + 4.1, k = 0; z < zc - 1; z += 4.1, k++) { ln(g, [pt(-ch, ch, z), pt(ch, ch, z), pt(ch, -ch, z)], JT, .7); for (let j = 0; j < 3; j++) { const f = (j + (k % 2) * .5 + .25) / 3 * 2 - 1; if (z + 4.1 < zc) { ln(g, [pt(f * ch, ch, z), pt(f * ch, ch, z + 4.1)], JT, .6); ln(g, [pt(ch, -f * ch, z), pt(ch, -f * ch, z + 4.1)], JT, .6); } } }
      box(g, 0, 0, .32, .32, 4, zc, '#5a5a62');
      poly(g, [pt(-.12, -.12, zc + 4), pt(.12, -.12, zc + 4), pt(.12, .12, zc + 4), pt(-.12, .12, zc + 4)], '#ff9a30', .6);
      halo(g, ...pt(0, 0, zc + 4), 6, '255,240,160', .8);
      [[-5, -112, 1.8], [6, -108, 1.4], [1, -117, 1.2]].forEach(([x, y, r]) => spark(g, x, y + 8, r, '#ffd070'));
      // le chat roulé en boule, au chaud sur la corniche
      { const [a, b] = pt(-.05, .2, z1); oval(g, a, b - 2.6, 5.4, 3.2, 0, '#2e2a33', .8); g.beginPath(); g.moveTo(a + 4.6, b - 1); g.quadraticCurveTo(a + 2, b + 1.6, a - 3, b + .2); g.strokeStyle = '#1a171e'; g.lineWidth = 2.4; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#2e2a33'; g.lineWidth = 1.3; g.stroke();
        ball(g, a - 4, b - 3.4, 2.6, '#2e2a33', .8); poly(g, [[a - 6, b - 4.4], [a - 6.2, b - 7.6], [a - 4.2, b - 5.6]], '#2e2a33', .6); poly(g, [[a - 3.6, b - 5.6], [a - 2.2, b - 8], [a - 1.8, b - 4.8]], '#2e2a33', .6);
        [-.9, .9].forEach(d => { g.beginPath(); g.arc(a - 4 + d, b - 3.4, .6, .2, Math.PI - .2); g.strokeStyle = '#c9b0ff'; g.lineWidth = .5; g.stroke(); });
        zed(g, a + 2, b - 9, 1.4); }
    },
    pilon: g => {
      const IR = '#4d4b52', IR2 = '#5a5e68', zt = 77;
      box(g, 0, 0, .92, .62, 5, 0, '#5a5a62', 'stone');
      // bâti : colonnes et traverse
      box(g, -.34, -.02, .1, .14, zt - 5, 5, IR2);
      [16, 40, 64].forEach(z => ball(g, ...pt(-.29, .05, z), .9, '#8a8f99', .3));
      // enclume, lingot chauffé à blanc
      box(g, 0, 0, .3, .26, 8, 5, '#6a3c20', 'wood');
      box(g, 0, 0, .36, .17, 7, 13, '#545a66');
      poly(g, [pt(.18, -.06, 20), pt(.33, 0, 17), pt(.18, .06, 16)], '#545a66', .8);
      box(g, -.01, 0, .17, .08, 3, 20, '#ff8a2a');
      ln(g, [pt(-.08, .04, 23.2), pt(.07, .04, 23.2)], '#fff2a0', .8);
      halo(g, ...pt(0, 0, 21), 14, '255,150,60', .5);
      // le marteau-pilon levé
      const [ra, rb] = pt(0, 0, zt - 4), [rc, rd] = pt(0, 0, 54);
      inkLn(g, [[ra, rb], [rc, rd]], '#c9ccd4', 2.2);
      box(g, 0, 0, .3, .22, 17, 37, '#45454e');
      box(g, 0, 0, .22, .16, 4, 33, '#3a3a42');
      ln(g, [pt(-.15, .11, 52), pt(.15, .11, 52), pt(.15, -.11, 52)], 'rgba(255,255,255,.35)', .8);
      [[-.08, 46], [.08, 46]].forEach(([x, z]) => ball(g, ...pt(x, .115, z), 1, '#8a8f99', .4));
      // gerbe d'étincelles sur l'enclume
      const [ia, ib] = pt(0, .04, 24);
      [[-9, -4, 2.2], [8, -6, 2.6], [-5, -9, 1.6], [11, -1, 1.6], [3, -10, 1.4]].forEach(([dx, dy, r]) => spark(g, ia + dx, ib + dy, r, '#ffd070'));
      [[-3, -2, -8, -5], [3, -2, 9, -4], [0, -3, 2, -8]].forEach(([u, v, w, z]) => ln(g, [[ia + u, ib + v], [ia + w, ib + z]], '#ffc640', .8));
      box(g, .34, .02, .1, .14, zt - 5, 5, IR2);
      [16, 40, 64].forEach(z => ball(g, ...pt(.39, .05, z), .9, '#8a8f99', .3));
      box(g, 0, 0, .82, .17, 8, zt, IR);
      [-.3, -.1, .1, .3].forEach(x => ball(g, ...pt(x, .085, zt + 4), .9, '#8a8f99', .3));
      // cylindre à vapeur, manomètre dans le rouge
      cyl(g, 0, 0, .12, 14, zt + 8, '#7a7f8a', '#4d4b52'); hoop(g, 0, 0, .12, zt + 11, '#c7803f'); hoop(g, 0, 0, .12, zt + 19, '#c7803f');
      const [ga, gb] = pt(.09, .09, zt + 15);
      ball(g, ga, gb, 3.4, '#f1e4c8', .9);
      g.beginPath(); g.moveTo(ga, gb); g.arc(ga, gb, 2.8, -Math.PI * .25, Math.PI * .1); g.closePath(); g.fillStyle = '#d8322e'; g.fill();
      ln(g, [[ga, gb], [ga + 2.4, gb - .2]], INK, .7); ball(g, ga, gb, .5, INK, 0);
      [[-6, -16, 3], [-9.5, -20, 3.8], [-6, -25, 3.2]].forEach(([dx, dy, r]) => ball(g, ga + dx, gb + dy + 12, r, '#eef0f4', .7));
      // volant à rayons sur le flanc
      const [wa, wb] = pt(.45, .02, 45), R = 13;
      vcirc(g, wa, wb, R, -1, '#5a5e68', 1);
      vpath(g, wa, wb, R * .74, -1); g.fillStyle = '#3a3a42'; g.fill();
      for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + .3, c = Math.cos(a) * R * .76; inkLn(g, [[wa, wb], [wa - c * .894, wb + c * .447 - Math.sin(a) * R * .76]], '#6f7480', 1.2); }
      ball(g, wa, wb, 2.4, '#8a8f99', .7);
      vpath(g, wa, wb, R, -1); g.strokeStyle = 'rgba(255,255,255,.25)'; g.lineWidth = .8; g.stroke();
    },
    /* ----- caveau ----- */
    sarcophage: g => {
      const ST = '#a39a8a', x0 = -.21, x1 = .21, y0 = -.43, y1 = .43, zb = 4, zt = 22, LT = 'rgba(255,250,235,.45)', DK = 'rgba(40,30,20,.4)';
      box(g, 0, 0, .52, .98, zb, 0, '#6d655c', 'stone');
      box(g, 0, 0, x1 - x0, y1 - y0, zt - zb, zb, ST, 'stone');
      // arcades sculptées sur le flanc, crâne au milieu, chauve-souris au pied
      const xf = x1 + .003;
      [0, 1, 2].forEach(k => { const ya = y0 + .07 + k * .27, yb = ya + .2, A = [pt(xf, ya, 7)]; for (let i = 0; i <= 8; i++) { const t = Math.PI - i / 8 * Math.PI; A.push(pt(xf, (ya + yb) / 2 + Math.cos(t) * .1, 14 + Math.sin(t) * 4.5)); } A.push(pt(xf, yb, 7)); poly(g, A, shade(ST, -.42), .7); ln(g, [pt(xf, ya, 7.2), pt(xf, yb, 7.2)], LT, .8); });
      { const [a, b] = pt(xf, 0, 12); ball(g, a, b, 3.4, PAL.bone, .7); ell(g, a - 1.1, b - .4, .9, 1.1, INK, 0); ell(g, a + 1.3, b - .6, .9, 1.1, INK, 0); rrect(g, a - 1.5, b + 1.8, 3, 1.6, .4, PAL.bone, .5); }
      { const [a, b] = pt(0, y1 + .003, 13); poly(g, [[a, b + 2], [a - 3, b - 1], [a - 8, b - 2.4], [a - 6.4, b + 1], [a - 7.4, b + 3.4], [a - 3.6, b + 2.6], [a, b + 4.6], [a + 3.6, b + 2.6], [a + 7.4, b + 3.4], [a + 6.4, b + 1], [a + 8, b - 2.4], [a + 3, b - 1]], shade(ST, -.4), .6); ball(g, a, b, 1.6, shade(ST, -.4), .5); }
      // l'intérieur, noir et un peu vert
      const IN = [pt(x0 + .028, y0 + .028, zt), pt(x1 - .028, y0 + .028, zt), pt(x1 - .028, y1 - .028, zt), pt(x0 + .028, y1 - .028, zt)];
      path(g, IN); let gr = g.createLinearGradient(...pt(0, y0, zt), ...pt(0, y0 + .2, zt)); gr.addColorStop(0, '#050806'); gr.addColorStop(1, '#173a26'); g.fillStyle = gr; g.fill();
      halo(g, ...pt(.16, .05, zt), 10, '120,255,170', .35);
      [[.155, -.13], [.16, -.06]].forEach(([x, y]) => { const [a, b] = pt(x, y, zt - .5); ell(g, a, b, 1.3, 1, '#8affb0', 0); ball(g, a, b, .5, '#ffffff', 0); });
      // couvercle poussé de travers
      const th = .14, c = Math.cos(th), s = Math.sin(th), tx = -.12, ty = -.02, LX = .225, LY = .445, zl = zt + 4.5;
      const W = (u, v) => [u * c - v * s + tx, u * s + v * c + ty], K = [W(-LX, -LY), W(LX, -LY), W(LX, LY), W(-LX, LY)];
      for (let i = 0; i < 4; i++) { const p = K[i], q = K[(i + 1) % 4], nx = q[1] - p[1], ny = p[0] - q[0]; if (nx + ny > 0) poly(g, [pt(p[0], p[1], zt), pt(q[0], q[1], zt), pt(q[0], q[1], zl), pt(p[0], p[1], zl)], shade(ST, nx > ny ? -.28 : -.06), .9); }
      poly(g, K.map(([x, y]) => pt(x, y, zl)), shade(ST, .12), 1);
      // gisant sculpté : bordure, épée, crâne
      const P = (u, v) => { const [x, y] = W(u, v); return pt(x, y, zl + .1); };
      ln(g, [P(-.18, -.39), P(.18, -.39), P(.18, .39), P(-.18, .39), P(-.18, -.39)], DK, .7);
      ln(g, [P(-.17, -.38), P(.17, -.38), P(.17, .38)], LT, .6);
      inkLn(g, [P(0, -.16), P(0, .32)], '#c9c2b4', 1.2); inkLn(g, [P(-.08, -.1), P(.08, -.1)], '#c9c2b4', 1.2); ball(g, ...P(0, -.2), 1.3, '#c9c2b4', .5);
      { const [a, b] = P(0, -.29); ball(g, a, b - 1, 3.2, '#d8d0c0', .7); ell(g, a - 1.1, b - 1.3, .8, 1, 'rgba(40,30,20,.7)', 0); ell(g, a + 1.1, b - 1.3, .8, 1, 'rgba(40,30,20,.7)', 0); }
      ln(g, [P(.12, .1), P(.06, .2), P(.1, .27)], 'rgba(40,30,20,.45)', .7);
      // une main osseuse agrippe le bord
      { const [a, b] = pt(.17, .2, zt - 2.5); ell(g, a, b, 2.6, 3.4, PAL.bone, .6); }
      [.13, .17, .21, .25].forEach(y => { const [a, b] = pt(.165, y, zt - 1.5), xl = .165 - (.124 * (y + .429) / .881) - .02, [e, f] = pt(xl, y, zl + .5); inkLn(g, [[a, b], [e, f], [e - 1.8, f + 1.4]], PAL.bone, 1.1); ball(g, e, f, .9, PAL.bone, .4); });
      // mousse et bougie au coin du socle
      [[-.2, .43, zt], [.21, -.2, 10]].forEach(([x, y, z], i) => { const [a, b] = pt(x, y, z); for (let k = 0; k < 4; k++) ball(g, a + (hash(k, i) - .5) * 4, b + (hash(i, k) - .5) * 1.6, 1 + hash(k, i + 3) * .6, k % 2 ? '#6e9a3a' : '#5a8a32', 0); });
      const [ka, kb] = pt(.23, .45, zb);
      ell(g, ka, kb, 3, 1.3, '#4d4b52', .6); rrect(g, ka - 1.4, kb - 7, 2.8, 7, 1, '#ece2c8', .6); [[-1, -6, 2.2], [.8, -6.2, 3.4]].forEach(([dx, dy, l]) => ln(g, [[ka + dx, kb + dy], [ka + dx, kb + dy + l]], '#fffaf0', .8)); ln(g, [[ka, kb - 7], [ka, kb - 8.3]], INK, .5);
    },
    /* ----- salle au trésor ----- */
    montagnedor: g => {
      const GO = PAL.gold, TOPS = [[-29, 3], [-26, -8], [-21, -16], [-16, -21], [-11, -30], [-5, -39], [1, -45], [7, -41], [11, -34], [16, -26], [21, -18], [26, -8], [29, 3]];
      const top = x => { for (let i = 1; i < TOPS.length; i++) if (x <= TOPS[i][0]) { const [a, b] = TOPS[i - 1], [c, d] = TOPS[i]; return b + (d - b) * (x - a) / (c - a); } return 3; };
      const bot = x => 3 + 12 * Math.sqrt(Math.max(0, 1 - (x / 29) ** 2));
      const gem = (x, y, r, col) => { poly(g, [[x - r, y - r * .3], [x - r * .5, y - r], [x + r * .5, y - r], [x + r, y - r * .3], [x, y + r * .9]], col, .7); poly(g, [[x - r * .5, y - r], [x + r * .5, y - r], [x + r * .3, y - r * .45], [x - r * .3, y - r * .45]], shade(col, .45), 0); };
      // pièces éparpillées au sol, une qui roule
      [[-31, 8, .3], [-24, 14, -.2], [30, 9, .1], [22, 15, .4], [-12, 17, 0], [8, 18, -.3], [33, 2, .2]].forEach(([x, y, r]) => coin(g, x, y, .85, r));
      { g.save(); g.translate(36, 12); g.rotate(.15); ell(g, 0, -3.4, 1.3, 3.4, '#a8781c', .6); ell(g, .6, -3.4, 1.2, 3.4, '#f2c94f', .6); g.restore(); [[31, 13], [28.5, 13.6]].forEach(([x, y]) => ln(g, [[x, y], [x - 2, y + .3]], 'rgba(255,240,180,.6)', .7)); }
      // la montagne
      g.beginPath(); g.moveTo(...TOPS[0]); for (let i = 1; i < TOPS.length - 1; i++) { const [a, b] = TOPS[i], [c, d] = TOPS[i + 1]; g.quadraticCurveTo(a, b, (a + c) / 2, (b + d) / 2); } g.lineTo(...TOPS[TOPS.length - 1]); g.ellipse(0, 3, 29, 12, 0, 0, Math.PI); g.closePath();
      const gr = g.createRadialGradient(-7, -26, 3, 0, -10, 44); gr.addColorStop(0, '#fff0a8'); gr.addColorStop(.4, GO); gr.addColorStop(1, '#9a6a14'); g.fillStyle = gr; fi(g, g.fillStyle, 1.1);
      const C = []; for (let i = 0; i < 64; i++) { const x = -26 + hash(i, 13) * 52, t = top(x) + 3, b = bot(x) - 2; if (b <= t) continue; C.push([x, t + (b - t) * Math.pow(hash(13, i), .8), (hash(i, 14) - .5) * .9, .7 + hash(14, i) * .35]); }
      C.sort((p, q) => p[1] - q[1]).forEach(([x, y, r, s]) => coin(g, x, y, s, r));
      TOPS.slice(1, -1).forEach(([x, y], i) => coin(g, x + (i % 2 ? 1 : -1), y + 1.2, .8, (i % 3 - 1) * .5));
      // collier de perles
      for (let i = 0; i <= 12; i++) { const t = i / 12, x = -12 + t * 20, y = -33 + t * 15 + Math.sin(t * Math.PI) * 5; ball(g, x, y, 1.1, '#f6f2ea', .4); }
      // épée plantée, gemmes
      g.save(); g.translate(-17, -25); g.rotate(-.55); poly(g, [[-1.6, 0], [-1.4, 9], [1.4, 9], [1.6, 0]], '#cfd4dc', .7); rrect(g, -6, -1.6, 12, 2.6, 1.2, GO, .8); rrect(g, -1.3, -8.5, 2.6, 7, .8, '#7a3a2a', .7); ball(g, 0, -9.6, 2, '#d8384a', .7); g.restore();
      gem(-8, -12, 2.6, '#d8384a'); gem(11, -6, 2.4, '#3fbf6a'); gem(-20, -4, 2.2, '#4a78d8'); gem(5, -24, 2, '#b04ad8'); gem(16, 4, 2.2, '#d8384a');
      // la couronne de guingois
      g.save(); g.translate(16, -24); g.rotate(.32);
      g.beginPath(); g.ellipse(0, 0, 7.5, 3, 0, 0, Math.PI); g.lineTo(-7.5, -5); [[-5, -9], [-2.6, -5], [0, -10.5], [2.6, -5], [5, -9], [7.5, -5]].forEach(p => g.lineTo(...p)); g.closePath(); g.fillStyle = radial(g, -2, -4, 9, GO); fi(g, g.fillStyle, .9);
      [-5, 0, 5].forEach((x, i) => ball(g, x, i === 1 ? -10.5 : -9, 1.2, i === 1 ? '#d8384a' : '#f2f4a0', .5)); ell(g, 0, -1.6, 1.6, 1.2, '#3a7ad8', .5); ln(g, [[-6.6, -1], [6.6, -1]], 'rgba(150,100,20,.6)', .7);
      g.restore();
      // la coupe au sommet
      g.save(); g.translate(1, -45); g.rotate(-.28);
      ell(g, 0, 0, 4.4, 1.8, '#c9962f', .7); inkLn(g, [[0, -.6], [0, -6]], GO, 1.2); ball(g, 0, -3.4, 1.2, GO, .5);
      g.beginPath(); g.moveTo(-6, -14); g.quadraticCurveTo(-6, -6, 0, -6); g.quadraticCurveTo(6, -6, 6, -14); g.closePath(); g.fillStyle = radial(g, -2, -11, 8, GO); fi(g, g.fillStyle, .9);
      ell(g, 0, -14, 6, 2.1, '#f7dc86', .8); ell(g, 0, -14, 4.4, 1.3, '#a8781c', 0); ball(g, -2.4, -10, 1.2, '#3fbf6a', .4); ball(g, 2.4, -10, 1.2, '#d8384a', .4);
      g.restore();
      // un bout de queue de dragonnet dépasse du tas
      g.beginPath(); g.moveTo(22, -4); g.bezierCurveTo(28, -6, 31, -13, 27, -17); g.lineCap = 'round'; g.strokeStyle = '#5a1a14'; g.lineWidth = 4; g.stroke(); g.strokeStyle = '#d0503a'; g.lineWidth = 2.4; g.stroke();
      poly(g, [[27, -17], [23.2, -18.6], [27.4, -24], [30, -18.4]], '#d0503a', .8);
      [[-14, -40, 3.4], [12, -46, 2.6], [-24, -14, 2.4], [23, -30, 2.2], [-3, -20, 2]].forEach(([x, y, r]) => spark(g, x, y, r));
    },
    /* ----- salon pourpre ----- */
    lustre: g => {
      const IR = '#3a3a42', GO = PAL.gold, zr = 52, r = .37, zt = 90, PX = -.41, PY = .41;
      // portant de fer forgé sur son socle de pierre
      box(g, PX + .04, PY - .04, .2, .2, 7, 0, '#5a5a62', 'stone');
      box(g, PX, PY, .05, .05, zt - 7, 7, IR);
      for (let z = 12; z < zt - 2; z += 5) ln(g, [pt(PX - .02, PY + .025, z), pt(PX + .025, PY + .02, z + 3)], 'rgba(150,150,170,.45)', .6);
      ball(g, ...pt(PX, PY, zt + 2.5), 2.4, GO, .7);
      const [pa, pb] = pt(PX, PY, zt - 1), [qa, qb] = pt(0, 0, zt - 1);
      inkLn(g, [[pa, pb], [qa + 2, qb]], '#4d4b52', 1.8);
      g.beginPath(); g.moveTo(pa, pb + 13); g.bezierCurveTo(pa + 4, pb + 2, pa + 12, pb + 1, pa + 15, pb + 1); g.moveTo(pa + 6, pb + 1); g.bezierCurveTo(pa + 6, pb + 6, pa + 11, pb + 7, pa + 11, pb + 3.5); g.strokeStyle = INK; g.lineWidth = 2.6; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#5a5e68'; g.lineWidth = 1.2; g.stroke();
      // chaîne
      for (let i = 0; i < 5; i++) { g.beginPath(); g.ellipse(qa, qb + 2 + i * 3.2, i % 2 ? .8 : 1.5, 1.8, 0, 0, TAU); g.strokeStyle = INK; g.lineWidth = 1.8; g.stroke(); g.strokeStyle = '#8a8f99'; g.lineWidth = .8; g.stroke(); }
      // le lustre : couronne, chaînettes, cercle de bougies, pampilles de cristal
      const zc = zr + 16, [ca, cb] = pt(0, 0, zc), A = [0, 1, 2, 3, 4, 5].map(i => Math.PI / 4 + i * Math.PI / 3), fr = a => Math.cos(a) + Math.sin(a) > 0;
      const [ra, rb] = pt(0, 0, zr), RX = r * 45.2, RY = r * 22.6;
      const candle = a => { const [x, y] = pt(Math.cos(a) * r, Math.sin(a) * r, zr); ell(g, x, y - .6, 2.6, 1.2, GO, .6); rrect(g, x - 1.2, y - 8, 2.4, 7.4, .8, '#f6efdf', .6); ln(g, [[x - .5, y - 7], [x - .5, y - 4]], '#ffffff', .6); ln(g, [[x, y - 8], [x, y - 9.2]], INK, .5); };
      const drop = (a, k) => { const [x, y] = pt(Math.cos(a) * r, Math.sin(a) * r, zr - 1); ln(g, [[x, y], [x, y + 2.6 + k]], 'rgba(200,220,240,.8)', .5); g.beginPath(); g.moveTo(x, y + 2.4 + k); g.quadraticCurveTo(x + 2.2, y + 5.4 + k, x, y + 7 + k); g.quadraticCurveTo(x - 2.2, y + 5.4 + k, x, y + 2.4 + k); fi(g, '#cfe6f8', .6); ln(g, [[x - .6, y + 4.4 + k], [x - .4, y + 5.6 + k]], '#ffffff', .6); };
      const D = A.map(a => a + Math.PI / 6);
      [Math.PI / 4 + Math.PI / 2, Math.PI / 4 - Math.PI / 2, Math.PI * 1.25].forEach(a => { const [x, y] = pt(Math.cos(a) * r * .95, Math.sin(a) * r * .95, zr + 1); ln(g, [[ca, cb], [x, y]], '#8a8f99', .6); });
      g.beginPath(); g.ellipse(ra, rb, RX, RY, 0, Math.PI, TAU); g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke(); g.strokeStyle = IR; g.lineWidth = 2; g.stroke();
      D.filter(a => !fr(a)).forEach((a, i) => drop(a, i % 2));
      A.filter(a => !fr(a)).forEach(candle);
      inkLn(g, [[ca, cb - 3], [ra, rb + 10]], '#4d4b52', 1.4);
      ball(g, ca, cb - 4, 2, GO, .6); ell(g, ca, cb, 4, 1.6, IR, .7);
      ball(g, ra, rb, 3.4, '#4d4b52', .8); ball(g, ra, rb + 6, 2.2, GO, .6);
      g.beginPath(); g.moveTo(ra, rb + 8); g.quadraticCurveTo(ra + 3, rb + 12, ra, rb + 15.5); g.quadraticCurveTo(ra - 3, rb + 12, ra, rb + 8); fi(g, '#cfe6f8', .7); ln(g, [[ra - .8, rb + 10.5], [ra - .6, rb + 12.5]], '#ffffff', .7);
      g.beginPath(); g.ellipse(ra, rb, RX, RY, 0, 0, Math.PI); g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke(); g.strokeStyle = IR; g.lineWidth = 2; g.stroke(); g.strokeStyle = 'rgba(233,185,73,.8)'; g.lineWidth = .7; g.stroke();
      D.filter(fr).forEach((a, i) => drop(a, (i + 1) % 2));
      A.filter(fr).forEach(candle);
      [[-RX - 3, 2, 2.4], [RX + 2, -4, 2], [-6, RY + 12, 2.2], [9, RY + 9, 1.6]].forEach(([dx, dy, s]) => spark(g, ra + dx, rb + dy, s, '#eaf6ff'));
    },
    /* ----- tour de guet ----- */
    catapulte: g => {
      const Wd = '#9a6a3c', W2 = '#7a4a28', RS = .16, ZU = 40;
      // caillou irrégulier (coordonnées écran)
      const stone = (x, y, r, col, seed) => { const p = []; for (let i = 0; i < 8; i++) { const a = (i + hash(seed, i) * .5) / 8 * TAU, k = .82 + hash(i, seed) * .26; p.push([x + Math.cos(a) * r * k, y + Math.sin(a) * r * k * .82]); } poly(g, p, col, .9); ell(g, x - r * .3, y - r * .35, r * .32, r * .2, 'rgba(255,255,255,.3)', 0); };
      const wheel = (x, y) => { const [a, b] = pt(x, y, 7.4); vcirc(g, a, b, 7.4, 1, '#6a4428', 1); vpath(g, a, b, 5.4, 1); g.strokeStyle = 'rgba(40,20,8,.5)'; g.lineWidth = .7; g.stroke(); for (let i = 0; i < 4; i++) { const t = i / 4 * Math.PI + .3, c = Math.cos(t) * 5.4; ln(g, [[a - c * .894, b - c * .447 + Math.sin(t) * 5.4], [a + c * .894, b + c * .447 - Math.sin(t) * 5.4]], '#8a5a32', 1.1); } ball(g, a, b, 1.7, '#6f7480', .5); };
      wheel(-.29, -.235); wheel(.29, -.235);
      box(g, 0, -RS, .88, .07, 6, 6, Wd, 'wood');
      [-.37, .37].forEach(x => box(g, x, 0, .07, .38, 4, 7, W2));
      // écheveau de corde tordue au pivot
      inkLn(g, [pt(-.02, -.14, 12), pt(-.02, .14, 12)], '#e6d2a4', 3.4);
      for (let i = 0; i < 8; i++) { const y = -.12 + i * .034; ln(g, [pt(-.02, y, 13.6), pt(-.02, y + .03, 10.4)], 'rgba(120,90,40,.6)', .6); }
      // montant arrière et jambe de force
      box(g, .13, -RS, .065, .065, ZU - 12, 12, Wd, 'wood');
      inkLn(g, [pt(.15, -RS, ZU - 6), pt(.38, -RS, 12)], W2, 1.7);
      // treuil
      box(g, -.4, 0, .07, .36, 7, 12, W2);
      [-.2, .2].forEach(y => box(g, -.4, y, .05, .03, 9, 11, Wd));
      // le bras armé, cuillère et caillou à la mine renfrognée
      const [p0, q0] = pt(-.02, 0, 12), [p1, q1] = pt(-.32, 0, 23);
      ln(g, [pt(-.4, 0, 19), [p1 - 1, q1 + 1]], '#c9b88a', .9);
      inkLn(g, [[p0, q0], [p1, q1]], '#b07a46', 3.4);
      const [ba, bb] = [p1 - 2.6, q1 - 1.4];
      g.beginPath(); g.ellipse(ba, bb, 7, 3.1, -.2, 0, Math.PI); g.lineTo(ba - 7, bb + .4); g.closePath(); fi(g, '#8a5a32', .9);
      stone(ba, bb - 4, 6.4, '#8f8a85', 4);
      [[-2.2, -4.4, .3], [2, -4.6, -.3]].forEach(([dx, dy, r]) => { ln(g, [[ba + dx - 1.4, bb + dy - 1 - r * 2], [ba + dx + 1.4, bb + dy - 1 + r * 2]], INK, .8); ball(g, ba + dx, bb + dy + .6, .6, INK, 0); });
      g.beginPath(); g.arc(ba, bb - .6, 1.8, Math.PI * 1.15, Math.PI * 1.85); g.strokeStyle = INK; g.lineWidth = .7; g.stroke();
      g.beginPath(); g.ellipse(ba, bb, 7, 3.1, -.2, Math.PI, TAU); g.strokeStyle = '#5a3a20'; g.lineWidth = 1; g.stroke();
      // traverse de butée rembourrée
      box(g, .13, 0, .075, .4, 5, ZU - 4, Wd);
      const [ka, kb] = pt(.08, 0, ZU - 3); oval(g, ka, kb, 2.6, 6.4, .46, '#e3c46e', .8); [-2.4, 0, 2.4].forEach(d => ln(g, [[ka + d * .9 - 1.4, kb + d * .45 - .8], [ka + d * .9 + 1.4, kb + d * .45 + .8]], '#b08a3a', .6));
      // côté avant : longeron, montant, fanion
      box(g, 0, RS, .88, .07, 6, 6, Wd, 'wood');
      box(g, .13, RS, .065, .065, ZU - 12, 12, Wd, 'wood');
      inkLn(g, [pt(.15, RS, ZU - 6), pt(.38, RS, 12)], W2, 1.7);
      const [fa, fb] = pt(.13, RS, ZU);
      inkLn(g, [[fa, fb], [fa, fb - 14]], '#6a4428', .9);
      g.beginPath(); g.moveTo(fa, fb - 14); g.quadraticCurveTo(fa + 6, fb - 15, fa + 11, fb - 11); g.quadraticCurveTo(fa + 5, fb - 10.5, fa, fb - 8.5); g.closePath(); fi(g, '#c8413a', .8); ln(g, [[fa + 1.5, fb - 12.2], [fa + 6, fb - 12]], 'rgba(255,220,200,.6)', .7);
      [[-.4, .21]].forEach(([x, y]) => { const [a, b] = pt(x, y, 15); inkLn(g, [[a, b], [a + 1, b + 4]], '#6f7480', 1); rrect(g, a - .6, b + 3.4, 4.2, 1.8, .8, '#8a5a32', .5); });
      wheel(-.29, .235); wheel(.29, .235);
      // munitions en réserve
      [[-.1, .42, 4.4, 1], [.06, .44, 3.8, 2], [-.03, .39, 3.6, 3], [-.02, .42, 3.4, 5, 6]].forEach(([x, y, r, s, dz = 0]) => { const [a, b] = pt(x, y, dz); stone(a, b - r * .7, r, ['#8f8a85', '#7d7872', '#a29e98'][s % 3], s); });
    },
  });

  Object.assign(LIGHTS, { broche: [2.4, 'fire', 1], banquet: [2.2, 'warm', .8], piste: [2.2, 'violet', .6], globe: [1.6, 'gold', .5], athanor: [2.1, 'fire', .9], hautfourneau: [2.7, 'fire', 1.1], pilon: [1.8, 'fire', .75], sarcophage: [1.3, 'green', .5], montagnedor: [1.9, 'gold', .7], lustre: [2.9, 'warm', 1] });
  Object.assign(FLAMES, {
    broche: [[-.06, .07, 10, .5], [.07, -.05, 10, .46], [0, 0, 11, .58]],
    banquet: [[-.033, -.007, 38.6, .32], [.05, -.09, 41.4, .35], [.133, -.173, 38.6, .32]],
    athanor: [[.155, .155, 9.6, .52], [-.3, .18, 5.4, .24]],
    hautfourneau: [[0, .39, 6.6, .72], [-.07, .4, 6.2, .5], [.07, .4, 6.2, .5]],
    sarcophage: [[.23, .45, 12.4, .26]],
    lustre: [[.262, .262, 61.4, .3], [-.096, .357, 61.4, .3], [-.357, .096, 61.4, .3], [-.262, -.262, 61.4, .3], [.096, -.357, 61.4, .3], [.357, -.096, 61.4, .3]],
  });
}
/* ---------- ajouts : trésors d'intrigue (violon d'os, chaudron de Mamie Troll, le Grand Piège) ---------- */
{
  const TAU = Math.PI * 2, R2 = Math.SQRT1_2, ZK = 35.78;   // ZK : unités d'art verticales pour une case
  // ellipse tournée (coordonnées écran)
  const oval = (g, x, y, rx, ry, rot, col, lw = 1) => { g.beginPath(); g.ellipse(x, y, rx, ry, rot, 0, TAU); g.fillStyle = isHex(col) ? radial(g, x, y, Math.max(rx, ry), col) : col; fi(g, g.fillStyle, lw); };
  // étincelle à quatre branches
  const spark = (g, x, y, r, col = '#fff4c4') => poly(g, [[x, y - r], [x + r * .26, y - r * .26], [x + r, y], [x + r * .26, y + r * .26], [x, y + r], [x - r * .26, y + r * .26], [x - r, y], [x - r * .26, y - r * .26]], col, .6);
  // halo peint seulement sur ce qui est déjà dessiné
  const halo = (g, x, y, r, rgb, a = .6) => { g.save(); g.globalCompositeOperation = 'source-atop'; const h = g.createRadialGradient(x, y, 0, x, y, r); h.addColorStop(0, `rgba(${rgb},${a})`); h.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = h; g.fillRect(x - r, y - r, r * 2, r * 2); g.restore(); };
  // croche et double croche
  const nhead = (g, x, y, col) => { g.save(); g.translate(x, y); g.rotate(-.42); ell(g, 0, 0, 3.3, 2.3, col, .9); g.restore(); };
  const note = (g, x, y, s, col, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); inkLn(g, [[2.6, -.6], [2.6, -10], [6.6, -6.2]], col, 1.3); nhead(g, 0, 0, col); g.restore(); };
  const note2 = (g, x, y, s, col, rot = 0) => { g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s); inkLn(g, [[2.6, -.6], [2.6, -10.4], [10.6, -12.4], [10.6, -2.4]], col, 1.3); inkLn(g, [[2.8, -8.2], [10.4, -10.2]], col, 1); nhead(g, 0, 0, col); nhead(g, 8, -1.8, col); g.restore(); };
  // os : fût et deux têtes à chaque bout (coordonnées écran)
  const bone = (g, x0, y0, x1, y1, w = 1.4, col = PAL.bone) => { const l = Math.hypot(x1 - x0, y1 - y0) || 1, nx = -(y1 - y0) / l * w * .55, ny = (x1 - x0) / l * w * .55; inkLn(g, [[x0, y0], [x1, y1]], col, w); [[x0, y0], [x1, y1]].forEach(([x, y]) => { ball(g, x + nx, y + ny, w * .62, col, .5); ball(g, x - nx, y - ny, w * .62, col, .5); }); };
  // prisme vertical sur une base polygonale (sommets en sens horaire à l'écran) : faces visibles ombrées, dessus
  const prism = (g, P, z0, z1, col, top) => {
    P.forEach((p, i) => { const q = P[(i + 1) % P.length], nx = q[1] - p[1], ny = p[0] - q[0]; if (nx + ny > 1e-6) poly(g, [pt(p[0], p[1], z0), pt(q[0], q[1], z0), pt(q[0], q[1], z1), pt(p[0], p[1], z1)], shade(col, -.06 - .26 * Math.max(0, nx / (Math.abs(nx) + Math.abs(ny)))), .9); });
    poly(g, P.map(([x, y]) => pt(x, y, z1)), top || shade(col, .16), 1);
  };
  // enveloppe convexe d'un nuage de points (coordonnées écran)
  const hull = Pts => {
    const P = Pts.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const p of P) { while (lo.length > 1 && cr(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
    for (let i = P.length - 1; i >= 0; i--) { const p = P[i]; while (up.length > 1 && cr(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  };

  Object.assign(FDRAW, {
    /* ----- le Violon d'os ----- */
    violon: g => {
      const CW = '#4a2a30', BN = PAL.bone, BN2 = '#e2d6bc', GH = '#d2ecff', GL = '170,215,255', zt = 12.4;
      // socle : un petit cercueil verni, pieds en osselets
      const C = (a, b, k = 1) => [(a + b) * k * R2, (b - a) * k * R2];
      const HX = [[-.35, -.1], [-.15, -.175], [.35, -.115], [.35, .115], [-.15, .175], [-.35, .1]];
      [[.33, .1], [-.15, .16], [-.33, .085]].forEach(([a, b]) => ball(g, ...pt(...C(a, b), 1.7), 2.1, BN2, .7));
      prism(g, HX.map(([a, b]) => C(a, b)), 2.6, 9.6, CW);
      prism(g, HX.map(([a, b]) => C(a, b, 1.07)), 9.6, zt, shade(CW, .14), '#6e4650');
      ln(g, [3, 4, 5].map(i => pt(...C(...HX[i], 1.07), zt)), PAL.gold, .8);
      ln(g, [3, 4, 5].map(i => pt(...C(...HX[i], 1.07), 9.8)), 'rgba(233,185,73,.7)', .6);
      { const [fa, fb] = pt(...C(.1, .15), 6.1); bone(g, fa - 4, fb - 1.7, fa + 4, fb + 1.7, 1.15, BN2); bone(g, fa - 4, fb + 1.7, fa + 4, fb - 1.7, 1.15, BN2); ball(g, fa, fb, .9, PAL.gold, .4); }
      // coussin de velours
      const [ca, cb] = pt(0, 0, zt);
      oval(g, ca, cb - 1.2, 10.6, 4.3, 0, '#5d3a8e', .9);
      g.beginPath(); g.ellipse(ca, cb - 1.6, 8.6, 3, 0, .15, Math.PI - .15); g.strokeStyle = 'rgba(233,185,73,.8)'; g.lineWidth = .6; g.stroke();
      [-1, 1].forEach(sd => { ln(g, [[ca + sd * 10.4, cb - 1.2], [ca + sd * 11, cb + 1.4]], '#b8862a', .8); ball(g, ca + sd * 11, cb + 2, 1.2, PAL.gold, .5); });
      halo(g, ca, cb - 2, 15, GL, .28);
      // le violon, debout, un peu penché
      const th = -.1, k = 1.12, ox = ca + .6, oy = cb - 2.6, ct = Math.cos(th) * k, st = Math.sin(th) * k;
      const V = (x, y) => [ox + x * ct - y * st, oy + x * st + y * ct];
      const body = () => { g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(5, 0, 8.4, -2.6, 8.4, -6.6); g.bezierCurveTo(8.4, -9.4, 7.2, -10.8, 6.6, -11.6); g.quadraticCurveTo(4.6, -12.4, 4.5, -14); g.quadraticCurveTo(4.6, -15.6, 6.2, -16.6); g.bezierCurveTo(7.2, -17.6, 7.2, -21.2, 6.2, -22.6); g.bezierCurveTo(4.8, -24.6, 2.4, -25.2, 0, -25.2); g.bezierCurveTo(-2.4, -25.2, -4.8, -24.6, -6.2, -22.6); g.bezierCurveTo(-7.2, -21.2, -7.2, -17.6, -6.2, -16.6); g.quadraticCurveTo(-4.6, -15.6, -4.5, -14); g.quadraticCurveTo(-4.6, -12.4, -6.6, -11.6); g.bezierCurveTo(-7.2, -10.8, -8.4, -9.4, -8.4, -6.6); g.bezierCurveTo(-8.4, -2.6, -5, 0, 0, 0); g.closePath(); };
      g.save(); g.translate(ox, oy); g.rotate(th); g.scale(k, k);
      // éclisses, table en bois de cercueil vernie, filet d'os
      g.save(); g.translate(1.4, .8); body(); fi(g, '#3a140a', 1); g.restore();
      body(); let gr = g.createRadialGradient(-3, -17, 1, 0, -12, 17); gr.addColorStop(0, '#d0823f'); gr.addColorStop(.45, '#863e20'); gr.addColorStop(1, '#3a1409'); fi(g, gr, 1.1);
      g.save(); body(); g.clip(); for (let i = 0; i < 7; i++) { const x = -7 + i * 2.3 + hash(i, 8) * .8; ln(g, [[x, 0], [x + .9, -9], [x - .3, -17], [x + .6, -26]], 'rgba(30,8,2,.22)', .5); } g.restore();
      g.save(); g.translate(0, -12.6); g.scale(.86, .9); g.translate(0, 12.6); body(); g.restore(); g.strokeStyle = 'rgba(236,228,210,.8)'; g.lineWidth = .55; g.stroke();
      ln(g, [[-6.9, -4.2], [-7.3, -7.6], [-6.2, -10.2]], 'rgba(255,226,190,.5)', 1.1); ln(g, [[-5.4, -18.4], [-5.8, -21.6]], 'rgba(255,226,190,.45)', .9);
      // ouïes d'où filtre une lueur spectrale
      halo(g, 0, -12.6, 9, GL, .55);
      [1, -1].forEach(sd => {
        g.beginPath(); g.moveTo(2.3 * sd, -16.8); g.bezierCurveTo(3.7 * sd, -16.1, 2.8 * sd, -13.7, 3.4 * sd, -12.6); g.bezierCurveTo(4 * sd, -11.5, 3.1 * sd, -9.3, 4.5 * sd, -8.6);
        g.lineCap = 'round'; g.strokeStyle = '#1c0c1a'; g.lineWidth = 1.9; g.stroke(); g.strokeStyle = '#e8f6ff'; g.lineWidth = .8; g.stroke();
        ball(g, 2.2 * sd, -16.9, .9, GH, .55); ball(g, 4.6 * sd, -8.5, .9, GH, .55);
      });
      // cordier en vertèbre, chevalet d'os
      ball(g, 0, -.5, 1.2, BN, .6);
      poly(g, [[-1.1, -1.3], [1.1, -1.3], [2.3, -7], [-2.3, -7]], BN2, .7);
      rrect(g, -3.3, -8.4, 6.6, 1.7, .85, BN, .6);
      ln(g, [[0, -2], [0, -6.6]], 'rgba(110,90,60,.55)', .5);
      g.beginPath(); g.moveTo(-3.4, -11.9); g.lineTo(-3.1, -13.3); g.quadraticCurveTo(0, -14.6, 3.1, -13.3); g.lineTo(3.4, -11.9); g.lineTo(1.5, -11.9); g.quadraticCurveTo(0, -12.9, -1.5, -11.9); g.closePath(); fi(g, '#efe5cc', .6);
      // touche : un fémur
      g.beginPath(); g.moveTo(-1.9, -17.6); g.lineTo(-1.4, -36); g.lineTo(1.4, -36); g.lineTo(1.9, -17.6); g.closePath(); gr = g.createLinearGradient(-2, 0, 2, 0); gr.addColorStop(0, '#fbf6ea'); gr.addColorStop(.5, '#e6dcc4'); gr.addColorStop(1, '#b9ab8c'); fi(g, gr, .8);
      ball(g, -1.3, -17.8, 1.4, BN, .6); ball(g, 1.3, -17.8, 1.4, BN, .6);
      // cordes
      [-1.5, -.5, .5, 1.5].forEach(i => { const CS = [[i * 1.1, -7.8], [i * 1.4, -13.9], [i * .6, -36]]; ln(g, CS, 'rgba(150,205,255,.45)', 1.1); ln(g, CS, '#f2f8ff', .38); });
      // sillet, chevillier, chevilles en phalanges
      rrect(g, -1.6, -36.6, 3.2, 1, .4, '#2a1a14', 0);
      rrect(g, -1.9, -41.2, 3.8, 5, 1, CW, .7);
      [-37.8, -40].forEach(y => [-1, 1].forEach(sd => { inkLn(g, [[sd * 1.7, y], [sd * 5, y - .4]], BN2, .9); ball(g, sd * 5.4, y - .45, 1.05, BN, .5); }));
      // la volute : un petit crâne qui fait un clin d'œil
      const sy = -46.2;
      rrect(g, -3, sy + 2.6, 6, 3, 1.2, BN2, .7);
      [-1.5, 0, 1.5].forEach(dx => ln(g, [[dx, sy + 3.2], [dx, sy + 5.2]], 'rgba(90,70,45,.6)', .45));
      ball(g, 0, sy, 5, BN, .9);
      ell(g, -2.2, sy - 3, 1.5, .9, 'rgba(255,255,255,.65)', 0);
      g.beginPath(); g.arc(-1.9, sy + .6, 1.3, Math.PI * 1.15, Math.PI * 1.85); g.strokeStyle = '#2a1830'; g.lineWidth = .8; g.stroke();
      ell(g, 1.9, sy - .1, 1.4, 1.7, '#2a1830', 0); ball(g, 2.1, sy - .3, .65, GH, 0);
      poly(g, [[-.6, sy + 2.4], [.6, sy + 2.4], [0, sy + 1.3]], '#2a1830', 0);
      g.restore();
      // l'archet : une côte pour baguette, un crin de fantôme
      const be = .5, Dx = Math.cos(be), Dy = Math.sin(be), Nx = Dy, Ny = -Dx;
      const [cx, cy] = V(0, -15.4), T = [cx - Dx * 23, cy - Dy * 23], F = [cx + Dx * 15, cy + Dy * 15];
      const BP = t => { const o = 1.6 * t + 4.4 * t * (1 - t); return [T[0] + (F[0] - T[0]) * t + Nx * o, T[1] + (F[1] - T[1]) * t + Ny * o]; };
      inkLn(g, [T, F], '#f4f9ff', .75);
      const SP = []; for (let i = 0; i <= 12; i++) SP.push(BP(i / 12));
      inkLn(g, SP, '#ddd0b0', 1.05);
      ball(g, ...BP(0), 1.15, BN, .6);
      poly(g, [[F[0] - Dx * 3.4, F[1] - Dy * 3.4], [F[0] + Nx * 1.6 - Dx * 3.4, F[1] + Ny * 1.6 - Dy * 3.4], [F[0] + Nx * 1.6 + Dx * .4, F[1] + Ny * 1.6 + Dy * .4], [F[0] + Dx * .4, F[1] + Dy * .4]], '#3a2a24', .6);
      // la main de squelette qui joue toute seule, auriculaire levé
      g.save(); g.translate(F[0], F[1]); g.rotate(be * .45); g.scale(1.2, 1.2);
      g.beginPath(); g.moveTo(6.4, -7.4); g.bezierCurveTo(11, -10.6, 14.6, -6.4, 18.4, -9.6); g.bezierCurveTo(21.4, -12.2, 19.4, -15.6, 17.2, -14); g.bezierCurveTo(19.2, -13.4, 19.4, -11.4, 17.6, -10.8); g.bezierCurveTo(14.8, -3.4, 10.8, -1.4, 6.8, -2.6); g.closePath();
      gr = g.createLinearGradient(6, 0, 20, 0); gr.addColorStop(0, '#eef8ff'); gr.addColorStop(1, '#a8cff2'); fi(g, gr, .7);
      for (let i = 0; i < 7; i++) { const a = -1.3 + i / 6 * 2.6; oval(g, 7.6 + Math.cos(a) * .6, -4.9 + Math.sin(a) * 3.4, 1.5, 1.1, a, '#ffffff', .5); }
      bone(g, 3.6, -4, 7.4, -3.7, 1.05, BN2); bone(g, 3.4, -6.2, 7.2, -6, .95, BN2);
      oval(g, 1.8, -5, 3, 2.3, -.2, BN, .7);
      const fing = P => { inkLn(g, P, BN, .95); P.slice(1).forEach(([x, y]) => ball(g, x, y, .55, BN, .4)); };
      fing([[-.4, -5.8], [-2.6, -3.6], [-2.4, -1]]);
      fing([[1, -3.8], [-.8, -1.6], [-.2, .5]]);
      fing([[2.6, -3.4], [1.6, -1], [2.4, .7]]);
      fing([[4, -6.6], [5.4, -9.4], [4.6, -12]]);
      g.restore();
      // la gigue des os s'envole
      note(g, ox - 19, oy - 44, .95, GH, -.2);
      note2(g, ox + 10, oy - 58, .8, '#e4d4ff', .12);
      note(g, ox + 21, oy - 40, .72, '#fff1c8', .32);
      [[-23, -30, 2.2], [16, -48, 1.8], [-9, -62, 1.6], [25, -57, 1.4], [-26, -50, 1.3]].forEach(([dx, dy, r]) => spark(g, ox + dx, oy + dy, r, '#eaf6ff'));
    },
    /* ----- le Chaudron de Mamie Troll ----- */
    chaudronmamie: g => {
      const IR = '#3c3b46', zr = 37, SOUP = '#6fc23a';
      // profil du chaudron ventru : rayon (en cases) selon la hauteur
      const R = z => z <= 21 ? .47 * Math.sqrt(Math.max(0, 1 - ((z - 21) / 15) ** 2)) : .36 + .11 * Math.cos((z - 21) / 16 * Math.PI / 2);
      const SF = (a, z, dr = 0) => { const r = R(z) + dr; return [Math.cos(a) * r * 45.25, -z + Math.sin(a) * r * 22.6]; };
      const rg = (a, r) => [Math.cos(a) * r * 45.25, Math.sin(a) * r * 22.6];
      // lit de braises
      g.beginPath(); g.ellipse(0, .4, 21, 10.5, 0, 0, TAU); let gr = g.createRadialGradient(0, 1, 1, 0, .4, 21); gr.addColorStop(0, '#ffd66a'); gr.addColorStop(.3, '#f07a26'); gr.addColorStop(.65, '#8a2c12'); gr.addColorStop(1, '#3a1a10'); fi(g, gr, .9);
      // pierres du foyer (arrière)
      const stone = (a, i) => { const [x, y] = rg(a, .45); oval(g, x, y - 1.4, 4.6 + hash(i, 2) * 1.4, 2.8 + hash(2, i) * .7, (hash(i, 7) - .5) * .3, ['#8d8579', '#7b746a', '#9d958a'][i % 3], .8); };
      const RING = []; for (let i = 0; i < 15; i++) RING.push([i / 15 * TAU + .2, i]);
      RING.filter(([a]) => Math.sin(a) < .05).forEach(([a, i]) => stone(a, i));
      // bûches croisées
      const log = (p0, p1) => { inkLn(g, [p0, p1], '#6a4024', 3.6); ell(g, p1[0], p1[1], 2.1, 1.9, '#d8a060', .6); ell(g, p1[0], p1[1], 1, .9, '#b07040', 0); ln(g, [[(p0[0] * 2 + p1[0]) / 3, (p0[1] * 2 + p1[1]) / 3], [(p0[0] + p1[0] * 2) / 3, (p0[1] + p1[1] * 2) / 3]], '#ffb03a', .9); };
      log([-13, -4], [7, 5.6]); log([13, -4], [-8, 6]);
      for (let i = 0; i < 12; i++) ball(g, -13 + hash(i, 5) * 26, 1 + hash(5, i) * 7, .8 + hash(i, 6) * .7, i % 3 ? '#ffb347' : '#fff1a8', 0);
      // la marmite ventrue
      const P = []; for (let z = 6; z <= zr; z++) for (let i = 0; i < 48; i++) P.push(SF(i / 48 * TAU, z));
      path(g, hull(P)); gr = g.createRadialGradient(-10, -29, 2, -3, -21, 27); gr.addColorStop(0, '#8a8c9a'); gr.addColorStop(.32, IR); gr.addColorStop(1, '#121117'); g.fillStyle = gr; g.fill(); g.strokeStyle = '#100f14'; g.lineWidth = 1.1; g.lineJoin = 'round'; g.stroke();
      halo(g, 0, -4, 17, '255,140,50', .55);
      // cerclage riveté
      const band = []; for (let i = 0; i <= 24; i++) band.push(SF(i / 24 * Math.PI, 31.5, .006));
      inkLn(g, band, '#4d4c58', 1.5);
      for (let i = 1; i < 12; i++) ball(g, ...SF(i / 12 * Math.PI, 31.5, .009), .7, '#8a8c98', .3);
      // anses
      [0, Math.PI].forEach(a => { const [x, y] = SF(a, 31, .01), sd = Math.cos(a); rrect(g, x - 1.6 + sd * .4, y - 2, 3.2, 3, 1, '#4d4c58', .7); g.beginPath(); g.ellipse(x + sd * 2.8, y + 2.8, 2.2, 3.4, sd * .2, 0, TAU); g.strokeStyle = INK; g.lineWidth = 2.6; g.stroke(); g.strokeStyle = '#6a6c78'; g.lineWidth = 1.3; g.stroke(); });
      // le tablier à fleurs de Mamie, noué autour de la panse
      const A0 = Math.PI / 2 - .8, A1 = Math.PI / 2 + .8, za = 29, zb = 14.5, off = z => .012 + (za - z) / (za - zb) * .035;
      const AP = [];
      for (let i = 0; i <= 14; i++) AP.push(SF(A0 + (A1 - A0) * i / 14, za, off(za)));
      for (let k = 1; k <= 6; k++) { const z = za - (za - zb) * k / 6; AP.push(SF(A1 + .04 * k / 6, z, off(z))); }
      for (let i = 0; i <= 28; i++) { const [x, y] = SF(A1 + .04 - (A1 - A0 + .08) * i / 28, zb, off(zb)); AP.push([x, y + (i % 2 ? 1.1 : 0)]); }
      for (let k = 5; k >= 1; k--) { const z = za - (za - zb) * k / 6; AP.push(SF(A0 - .04 * k / 6, z, off(z))); }
      path(g, AP); g.fillStyle = '#ef8fb1'; g.fill();
      g.save(); path(g, AP); g.clip();
      for (let i = 0; i < 7; i++) for (let j = 0; j < 4; j++) {
        const a = A0 + (A1 - A0) * (i + .25 + (j % 2) * .5) / 7, z = za - 2.4 - j * 3.9, [x, y] = SF(a, z, off(z)), sq = Math.sin(a), c = (i + j) % 3 ? '#fffaf0' : '#ffe27a';
        for (let p = 0; p < 5; p++) { const q = p / 5 * TAU + i; ell(g, x + Math.cos(q) * 1.15 * sq, y + Math.sin(q) * 1.05, .75 * sq, .75, c, 0); }
        ball(g, x, y, .5, (i + j) % 3 ? '#f2b420' : '#e2507a', 0);
      }
      const sh = g.createLinearGradient(-20, 0, 20, 0); sh.addColorStop(0, 'rgba(70,10,40,.45)'); sh.addColorStop(.35, 'rgba(255,240,245,.12)'); sh.addColorStop(.6, 'rgba(70,10,40,0)'); sh.addColorStop(1, 'rgba(70,10,40,.5)'); g.fillStyle = sh; g.fillRect(-25, -40, 50, 45);
      g.restore();
      path(g, AP); g.strokeStyle = '#7a2a48'; g.lineWidth = .9; g.lineJoin = 'round'; g.stroke();
      // ceinture et gros nœud sur le flanc
      const WB = []; for (let i = 0; i <= 30; i++) WB.push(SF(-.16 + (Math.PI + .32) * i / 30, 29.8, .016));
      inkLn(g, WB, '#e2668f', 1.4);
      { const [x, y] = SF(.14, 29.8, .02); oval(g, x + 2.4, y - 2.4, 2.8, 1.7, -.6, '#ee7fa4', .8); oval(g, x + 2.8, y + 1.7, 2.6, 1.5, .5, '#ee7fa4', .8); inkLn(g, [[x + .8, y + .6], [x + 2.6, y + 6.8]], '#e2668f', 1.1); inkLn(g, [[x + .8, y + .6], [x + 4.8, y + 4.6]], '#e2668f', 1.1); ball(g, x + .8, y, 1.3, '#e2668f', .6); }
      // pattes
      [Math.PI / 2 + .98, Math.PI / 2 - .98].forEach(a => { const [x0, y0] = SF(a, 9.5), [x1, y1] = rg(a, .32); inkLn(g, [[x0, y0], [x1, y1 - 2]], '#2e2d36', 3.2); oval(g, x1, y1 - 1.2, 3, 1.6, 0, '#3c3b46', .8); });
      // la soupe déborde
      [[Math.PI / 2 + .55, 6.4], [Math.PI / 2 - .3, 4.2], [Math.PI / 2 - .98, 7.4]].forEach(([a, l]) => { const [x, y] = SF(a, zr - 1, .006); g.beginPath(); g.moveTo(x - 1.5, y - 1); g.lineTo(x - 1.1, y + l - 1.4); g.quadraticCurveTo(x, y + l + 1.6, x + 1.1, y + l - 1.4); g.lineTo(x + 1.5, y - 1); g.closePath(); fi(g, '#79cc3e', .7); ln(g, [[x - .5, y], [x - .4, y + l - 1.6]], 'rgba(230,255,200,.7)', .5); });
      // le bord épais et la soupe verte qui bouillonne
      cyl(g, 0, 0, .392, 2.8, zr - 1.4, '#4a4954', '#55545f');
      const sy = -(zr + 1.4), irx = .33 * 45.25, iry = .33 * 22.6;
      g.beginPath(); g.ellipse(0, sy, irx, iry, 0, 0, TAU); g.fillStyle = '#16151b'; g.fill();
      g.save(); g.beginPath(); g.ellipse(0, sy, irx, iry, 0, 0, TAU); g.clip();
      const qy = sy + 2.2; g.beginPath(); g.ellipse(0, qy, irx, iry, 0, 0, TAU); gr = g.createRadialGradient(-3, qy - 1.4, 1, 0, qy, irx); gr.addColorStop(0, '#c4f57a'); gr.addColorStop(.5, SOUP); gr.addColorStop(1, '#2f6e22'); g.fillStyle = gr; g.fill();
      g.beginPath(); g.ellipse(0, qy, irx - 1.4, iry - .8, 0, 0, TAU); g.strokeStyle = 'rgba(225,255,190,.5)'; g.lineWidth = 1.1; g.stroke();
      [[-6.5, -1.5, 2.2], [5.5, .8, 2], [9.5, -2.6, 1.8]].forEach(([x, y, r]) => { ell(g, x, qy + y, r, r * .5, '#f0882a', .6); ln(g, [[x - r * .5, qy + y], [x + r * .5, qy + y]], 'rgba(255,220,160,.7)', .4); });
      [[-9.5, 2.4, 1.1], [1.5, -3.2, 1.3], [4.2, 3.4, 1], [-2.8, 4.2, .9], [11, 1.4, 1.2], [-11.5, -1.2, .8]].forEach(([x, y, r]) => { ball(g, x, qy + y, r, '#a6e868', .5); ball(g, x - r * .35, qy + y - r * .35, r * .3, '#ffffff', 0); });
      g.beginPath(); g.ellipse(7.5, qy + 4.4, 2.6, 1.1, 0, 0, TAU); g.strokeStyle = 'rgba(225,255,190,.8)'; g.lineWidth = .6; g.stroke();
      // un œil qui flotte et qui regarde
      ball(g, .4, qy + 3.2, 2.7, '#fbf6ea', .7); ell(g, -.2, qy + 2.4, 1.3, 1.2, '#e2a82a', .4); ball(g, -.4, qy + 2.2, .58, INK, 0); ball(g, -.75, qy + 1.85, .3, '#ffffff', 0); ln(g, [[2.2, qy + 4.4], [2.9, qy + 3.4]], '#d0484a', .4); ln(g, [[2.6, qy + 2], [3, qy + 2.8]], '#d0484a', .35);
      g.restore();
      g.beginPath(); g.ellipse(0, sy, irx, iry, 0, 0, TAU); g.strokeStyle = '#121116'; g.lineWidth = .9; g.stroke();
      // la grosse carotte qui dépasse
      g.save(); g.translate(-6.4, qy + 1); g.rotate(-.5);
      [[-1.6, -21, -.5], [0, -23, 0], [1.8, -21, .5]].forEach(([dx, dy, r]) => { g.save(); g.translate(dx * .6, -17); g.rotate(r); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-2.6, dy * .4, 0, dy * .45 - 2); g.quadraticCurveTo(2.6, dy * .4, 0, 0); fi(g, '#4f9a3c', .8); g.restore(); });
      g.beginPath(); g.moveTo(-2.4, 0); g.lineTo(-3.6, -14.5); g.quadraticCurveTo(-3.6, -17.6, 0, -17.6); g.quadraticCurveTo(3.6, -17.6, 3.6, -14.5); g.lineTo(2.4, 0); g.closePath(); gr = g.createLinearGradient(-3.6, 0, 3.6, 0); gr.addColorStop(0, '#ffb060'); gr.addColorStop(.45, '#f07f22'); gr.addColorStop(1, '#b8501a'); fi(g, gr, 1);
      [-4, -8, -12].forEach((y, i) => ln(g, [[i % 2 ? -2.8 : -1, y], [i % 2 ? -.6 : 2.2, y - .5]], 'rgba(150,60,10,.6)', .6));
      g.restore();
      g.beginPath(); g.ellipse(-6.4, qy + 1, 3.6, 1.3, 0, 0, TAU); g.strokeStyle = 'rgba(225,255,190,.85)'; g.lineWidth = .7; g.stroke();
      // la louche géante
      const L0 = [6.6, qy - 1.6], L1 = [21.5, qy - 19.5];
      g.beginPath(); g.ellipse(L0[0], L0[1] + .6, 3.4, 1.3, 0, 0, TAU); g.strokeStyle = '#2a2a30'; g.lineWidth = 1.6; g.stroke(); g.strokeStyle = '#8a8c98'; g.lineWidth = .7; g.stroke();
      inkLn(g, [L0, [13.5, qy - 9.6], L1, [23.4, qy - 21.6], [23, qy - 23.6]], '#b5793f', 2.4);
      ln(g, [[L0[0] + .3, L0[1] - 2], [L1[0] - .9, L1[1] + .6]], 'rgba(255,230,190,.45)', .7);
      ball(g, 22.4, qy - 22.6, .6, '#3a2414', 0);
      // vapeur, et un cœur de Mamie
      [[-2.4, 0], [7.4, 1.6]].forEach(([dx, ph]) => { g.beginPath(); g.moveTo(dx, sy - 4); g.bezierCurveTo(dx - 3.4, sy - 8 - ph, dx + 3.4, sy - 11, dx, sy - 15 - ph); g.strokeStyle = 'rgba(255,255,255,.65)'; g.lineWidth = 1.3; g.lineCap = 'round'; g.stroke(); });
      { const hx = 2.6, hy = sy - 22; g.beginPath(); g.moveTo(hx, hy + 4); g.bezierCurveTo(hx - 7, hy - .5, hx - 4, hy - 7, hx, hy - 3.2); g.bezierCurveTo(hx + 4, hy - 7, hx + 7, hy - .5, hx, hy + 4); g.closePath(); fi(g, radial(g, hx - 1, hy - 1, 6, '#ffd6e2'), .8); ell(g, hx - 2.6, hy - 2.2, 1.1, .7, 'rgba(255,255,255,.8)', 0); }
      spark(g, -12, sy - 4, 2, '#eaffc8'); spark(g, 12.5, sy - 8, 1.6, '#eaffc8');
      // pierres du foyer (avant)
      RING.filter(([a]) => Math.sin(a) >= .05).forEach(([a, i]) => stone(a, i));
    },
  });

  Object.assign(DDRAW, {
    /* ----- le Grand Piège ----- */
    grandpiege: g => {
      const z0 = 9, RJ = .41, RH = .5, PB = 1.25, PF = .3;
      // point d'une mâchoire (demi-ellipse) : s = -1 arrière, +1 avant ; ph = ouverture ; t le long de l'arc ; dr vers l'extérieur ; m vers l'intérieur de la gueule
      const J = (s, ph, t, dr = 0, m = 0) => { const c = Math.cos(t) * (RJ + dr), sn = Math.sin(t) * (RH + dr), cp = Math.cos(ph), sp = Math.sin(ph), k = s * (cp * sn - sp * m) * R2; return pt(c * R2 + k, -c * R2 + k, z0 + (sp * sn + cp * m) * ZK); };
      // plate-forme de planches dépareillées
      box(g, 0, 0, .92, .92, 3, 0, '#4e3420');
      ['#9a6a3c', '#86562f', '#a8774a', '#7c4f2c', '#946640'].forEach((c, i) => { const y = -.37 + i * .185, l = i === 3 ? .78 : .9, x = i === 3 ? -.06 : 0; box(g, x, y, l, .17, 2.2, 3, c); [-1, 1].forEach(sd => ball(g, ...pt(x + sd * (l / 2 - .04), y, 5.25), .55, '#3a3a42', 0)); });
      // engrenages de récupération sur leur poteau (derrière, à droite)
      const gear = (x, y, z, Rr, n, col, rot = 0, miss = -1) => {
        const [cx, cy] = pt(x, y, z), Q = (a, r) => [cx + Math.cos(a) * r * .894, cy + Math.cos(a) * r * .447 - Math.sin(a) * r], N = n * 4, rim = [], dp = Math.min(3, Rr * .24);
        for (let i = 0; i < N; i++) { const a = rot + (i + .5) / N * TAU, out = (i % 4 === 1 || i % 4 === 2) && Math.floor(i / 4) !== miss; rim.push(Q(a, out ? Rr : Rr - dp)); }
        poly(g, rim.map(([a, b]) => [a + 2.2 * .894, b - 2.2 * .447]), shade(col, -.45), .9);
        poly(g, rim, col, 1);
        const vel = (a0, r0, r) => { const [hx, hy] = Q(a0, r0); g.beginPath(); for (let i = 0; i <= 20; i++) { const a = i / 20 * TAU; g[i ? 'lineTo' : 'moveTo'](hx + Math.cos(a) * r * .894, hy + Math.cos(a) * r * .447 - Math.sin(a) * r); } g.closePath(); };
        for (let k = 0; k < 4; k++) { vel(rot + k / 4 * TAU + .4, Rr * .52, Rr * .17); g.fillStyle = '#2a2420'; g.fill(); g.strokeStyle = shade(col, -.55); g.lineWidth = .7; g.stroke(); }
        vel(0, 0, Rr * .24); g.fillStyle = radial(g, cx, cy, Rr * .24, shade(col, .2)); fi(g, g.fillStyle, .8);
        ball(g, cx, cy, 1.2, '#4d4b52', .6);
        return Q;
      };
      box(g, .3, -.45, .08, .08, 27, 5, '#6a4428', 'wood');
      ball(g, ...pt(.3, -.45, 33), 1.3, '#4d4b52', .6);
      inkLn(g, [pt(.3, -.45, 30), pt(-.03, -.43, 31)], '#4d4b52', 1.4);
      gear(-.03, -.42, 31, 6.4, 7, '#8a8f99', .3);
      const Q = gear(.3, -.4, 22, 11.5, 10, '#c9a24a', 0, 2);
      // la manivelle à pommeau rouge
      { const [a, b] = Q(.55, 8), [c, d] = Q(0, 0); inkLn(g, [[c, d], [a, b]], '#4d4b52', 1.6); inkLn(g, [[a, b], [a - 3.4, b + 1.9]], '#8a5a32', 1.6); ball(g, a - 4, b + 2.3, 2.5, '#d8322e', .8); ball(g, a - 4.7, b + 1.6, .75, '#ffd0c0', 0); ball(g, c, d, 1.3, '#6f7480', .5); }
      // ressorts à boudin de part et d'autre
      const spring = (x, y, zA, zB, r, nC) => {
        const [a, b] = pt(x, y, 0), rx = r * 45.25, ry = r * 22.6, N = nC * 18;
        const coil = front => { g.beginPath(); let on = false; for (let i = 0; i <= N; i++) { const t = i / N * nC * TAU, z = zA + (zB - zA) * i / N, X = a + Math.cos(t) * rx, Y = b - z + Math.sin(t) * ry; if ((Math.sin(t) >= 0) === front) { g[on ? 'lineTo' : 'moveTo'](X, Y); on = true; } else on = false; } };
        coil(false); g.lineCap = 'round'; g.strokeStyle = INK; g.lineWidth = 2.6; g.stroke(); g.strokeStyle = '#5c616c'; g.lineWidth = 1.3; g.stroke();
        coil(true); g.strokeStyle = INK; g.lineWidth = 2.8; g.stroke(); g.strokeStyle = '#b8bfca'; g.lineWidth = 1.4; g.stroke(); g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = .5; g.stroke();
        ell(g, a, b - zB - .6, rx + .8, ry + .5, '#6f7480', .8);
      };
      // une mâchoire : bande d'acier rivetée, crocs à deux facettes
      const band = (s, ph) => {
        const A = []; for (let i = 0; i <= 28; i++) A.push(J(s, ph, i / 28 * Math.PI, .025)); for (let i = 28; i >= 0; i--) A.push(J(s, ph, i / 28 * Math.PI, -.055)); poly(g, A, '#7d838f', 1.1);
        const H = []; for (let i = 1; i < 28; i++) H.push(J(s, ph, i / 28 * Math.PI, .012)); ln(g, H, 'rgba(255,255,255,.4)', .8);
        for (let i = 1; i < 8; i++) ball(g, ...J(s, ph, i / 8 * Math.PI, -.03), .6, '#4d4b52', .3);
      };
      const teeth = (s, ph, n, Lr, Lm, brass = -9) => {
        const T = []; for (let i = 0; i < n; i++) T.push((i + .5) / n * Math.PI);
        T.sort((p, q) => (Math.abs(p - Math.PI / 2) - Math.abs(q - Math.PI / 2)) * -s);
        T.forEach(t => { const d = .5 / n * Math.PI * .92, b0 = J(s, ph, t - d), b1 = J(s, ph, t + d), mid = J(s, ph, t), tip = J(s, ph, t, -Lr, Lm), br = Math.abs(t - brass) < .01; poly(g, [b0, mid, tip], br ? '#f2cf6a' : '#f2f5f8', .7); poly(g, [mid, b1, tip], br ? '#b8862a' : '#9aa1ad', .7); });
      };
      // mâchoire arrière, dressée comme une gueule
      band(-1, PB); teeth(-1, PB, 9, .17, .03, 6.5 / 9 * Math.PI);   // une dent remplacée par un bout de laiton
      // une chaussette d'aventurier restée accrochée à un croc
      { const [tx, ty] = J(-1, PB, 2.5 / 9 * Math.PI, -.15, .03); g.save(); g.translate(tx, ty); g.rotate(.12);
        const sock = () => { g.beginPath(); g.moveTo(-1.7, -.4); g.lineTo(1.7, -.4); g.lineTo(1.7, 5.2); g.quadraticCurveTo(1.9, 6.3, 3.1, 6.5); g.lineTo(4.6, 6.7); g.quadraticCurveTo(6.1, 7.3, 5.5, 8.7); g.lineTo(.4, 8.7); g.quadraticCurveTo(-1.7, 8.5, -1.7, 6.2); g.closePath(); };
        sock(); g.save(); g.clip(); g.fillStyle = '#f4efe4'; g.fillRect(-3, -1, 10, 11); g.fillStyle = '#d8423a'; [1.3, 3.6, 5.9].forEach(y => g.fillRect(-3, y, 10, 1.2)); g.fillStyle = 'rgba(60,20,20,.18)'; g.fillRect(.6, -1, 3, 11); g.restore();
        sock(); g.strokeStyle = '#5a2620'; g.lineWidth = .8; g.lineJoin = 'round'; g.stroke(); ell(g, 3.8, 8, .9, .5, '#e8c8a8', 0);
        g.restore(); }
      spring(-RJ * R2 - .06, RJ * R2 + .06, 5, 19, .062, 6);
      spring(RJ * R2 + .06, -RJ * R2 - .06, 5, 19, .062, 6);
      // axe, plateau-gâchette et son appât
      inkLn(g, [J(1, 0, 0), J(1, 0, Math.PI)], '#4d4b52', 2.2);
      { const [a, b] = pt(0, 0, z0 + 2.6); inkLn(g, [[a, b + 3], [a, b]], '#4d4b52', 1.6); ell(g, a, b, 6, 2.8, '#7d838f', .8); ell(g, a - .4, b - .5, 2.7, 1.25, '#f2c94f', .6); ln(g, [[a - 1.8, b - .7], [a + .6, b - 1.1]], 'rgba(255,250,210,.8)', .5); spark(g, a + 3.2, b - 3.6, 2.4); }
      // mâchoire avant, couchée vers nous
      band(1, PF); teeth(1, PF, 8, .02, .17);
      spark(g, ...J(-1, PB, 4.5 / 9 * Math.PI, -.16, .03), 1.8, '#ffffff'); spark(g, ...J(1, PF, 5.5 / 8 * Math.PI, -.02, .16), 1.6, '#ffffff');
      // pivots
      [0, Math.PI].forEach(t => { const [a, b] = J(1, 0, t); ball(g, a, b, 3, '#6f7480', .9); ln(g, [[a - 1.5, b - .6], [a + 1.5, b + .6]], INK, .7); });
      // la pancarte « CLAC ! », clouée de travers sur un piquet ficelé
      const [sa, sb] = pt(-.1, .43, 0);
      inkLn(g, [[sa, sb], [sa + 1, sb - 36]], '#7a4a28', 1.6);
      [0, 1, 2].forEach(d => ln(g, [[sa - 1.2, sb - 8 - d * 1.6], [sa + 1.6, sb - 9.4 - d * 1.6]], '#e3c46e', .8));
      g.save(); g.translate(sa - 5, sb - 38); g.rotate(-.12);
      rrect(g, -14, -6, 28, 12, 2, '#dcc08e', .9);
      ln(g, [[-12, -1.4], [12, -2]], 'rgba(120,80,40,.3)', .6);
      g.font = 'bold 9px Andika, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 2; g.strokeStyle = 'rgba(60,20,10,.35)'; g.strokeText('CLAC !', 0, .5); g.fillStyle = '#c8302a'; g.fillText('CLAC !', 0, .5);
      ball(g, 11.4, -3.6, .7, '#5a5a62', .3); ball(g, -11.4, 3.4, .7, '#5a5a62', .3);
      g.restore();
    },
  });

  Object.assign(LIGHTS, { violon: [1.4, 'moon', .55], chaudronmamie: [2.1, 'fire', .9] });
  Object.assign(FLAMES, { chaudronmamie: [[.07, .305, 1, .5], [.245, .23, 1, .6], [.306, .056, 1, .46]] });
}
