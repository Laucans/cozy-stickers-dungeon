
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
