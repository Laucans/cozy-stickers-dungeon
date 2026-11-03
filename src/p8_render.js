
/* =========================================================
   Moteur de rendu 2D isométrique : caméra, sols texturés, murs,
   tri en profondeur, éclairage dynamique, flammes, particules
   ========================================================= */
const $ = s => document.querySelector(s);
const cv = $('#cv'), ctx = cv.getContext('2d', { alpha: false });   // opaque : le navigateur n'a pas à le mélanger avec la page
const AU = 2;                                   // 1 unité d'art = 2 px monde (case = 128 px)
const WALL_FULL = 84, WALL_LOW = 22, RAMP_H = 132, RAMP_LOW = 34;
const WP = (x, y, z = 0) => [(x - y) * 64, (x + y) * 32 - z];
const toTile = (wx, wy) => [(wx / 64 + wy / 32) / 2, (wy / 32 - wx / 64) / 2];
const lerp2 = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
const CAM = { x: 0, y: 0, s: .6, min: .2, max: 1.9 };
// réglages du rendu (modifiables dans l'Atelier du Maître)
const TUNE = { ambient: .7, glow: .55, lightScale: 1, dust: 70, vignette: .55, particles: true, dbgGrid: false, dbgDoors: false, dbgLights: false, fps: false };
const V = { dpr: 1, w: 0, h: 0, dirty: true, walls: [], lights: [], flames: [], outside: [], hover: null, ghost: null, showPath: false,
  fx: [], parts: [], born: new Map(), flash: [], hit: null, courage: null, selected: null, insets: { t: 90, b: 170, l: 96, r: 24 } };
const ACT = new Map(), HEROS = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
const LCOL = { warm: '255,176,96', fire: '255,128,48', gold: '255,214,120', violet: '186,128,255', green: '120,255,170', moon: '150,185,255', red: '255,90,60' };
// dehors, on cadre la clairière (plus une lisière de forêt), pas toute la forêt
const BOUNDS = () => { if (Z === EXT) { const y0 = Math.max(0, H - extDepth() - 1.5); return { l: WP(0, H)[0] - 140, r: WP(W, y0)[0] + 140, t: WP(0, y0)[1] - 230, b: WP(W, H)[1] + 90 }; }
  return { l: WP(0, H)[0] - 120, r: WP(W, 0)[0] + 120, t: WP(0, 0)[1] - RAMP_H - 70, b: WP(W, H)[1] + 90 }; };

/* ---------- caméra ---------- */
// la finesse du rendu : un budget de pixels (un très grand écran dessine un peu moins fin), qui baisse tout seul
// si les images n'arrivent plus à temps, et remonte quand tout redevient fluide
const RQ = { max: 4.2e6, budget: 4.2e6, ema: 33, slow: 0, fast: 0 };
function renderQuality(gap) {
  if (gap > 250) return;   // un onglet caché, une pause : ça ne compte pas
  RQ.ema = RQ.ema * .9 + gap * .1;
  RQ.slow = RQ.ema > 46 ? RQ.slow + 1 : 0; RQ.fast = RQ.ema < 36 ? RQ.fast + 1 : 0;
  if (RQ.slow > 45 && RQ.budget > 8e5) { RQ.budget = Math.max(8e5, RQ.budget * .7); RQ.slow = 0; RQ.ema = 33; }
  else if (RQ.fast > 300 && RQ.budget < RQ.max) { RQ.budget = Math.min(RQ.max, RQ.budget * 1.2); RQ.fast = 0; }
}
function resize() {
  const r = cv.getBoundingClientRect();
  const w = Math.max(1, Math.round(r.width)), h = Math.max(1, Math.round(r.height));
  const dpr = Math.round(Math.max(Math.min(1, window.devicePixelRatio || 1), Math.min(2, window.devicePixelRatio || 1, Math.sqrt(RQ.budget / (w * h)))) * 20) / 20;
  if (w === V.w && h === V.h && dpr === V.dpr) return false;
  const first = !V.w; V.w = w; V.h = h; V.dpr = dpr; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  first ? fitCamera() : clampCam(); return true;
}
function computeInsets() {
  const g = id => document.getElementById(id), top = g('hudTop'), bld = g('hudBuild');
  const t = top && top.offsetParent ? top.getBoundingClientRect().bottom + 8 : 60, b = bld && bld.offsetParent ? V.h - bld.getBoundingClientRect().top + 8 : 100;
  V.insets = { t: Math.min(t, V.h * .2), b: Math.min(b, V.h * .2), l: 16, r: Math.min(56, V.w * .05) };
}
function fitCamera() {
  computeInsets();
  const b = BOUNDS(), I = V.insets, aw = Math.max(200, V.w - I.l - I.r), ah = Math.max(200, V.h - I.t - I.b);
  const s = Math.min(aw / (b.r - b.l), ah / (b.b - b.t));
  CAM.s = clamp(s, .12, 1.2); CAM.min = Math.min(.9 * CAM.s, .5);
  CAM.x = I.l + (aw - (b.r - b.l) * CAM.s) / 2 - b.l * CAM.s; CAM.y = I.t + (ah - (b.b - b.t) * CAM.s) / 2 - b.t * CAM.s;
}
function clampCam() {
  const b = BOUNDS(), s = CAM.s;
  CAM.x = clamp(CAM.x, V.w * .5 - (b.r + 200) * s, V.w * .5 - (b.l - 200) * s); CAM.y = clamp(CAM.y, V.h * .5 - (b.b + 160) * s, V.h * .5 - (b.t - 160) * s);
}
function zoomAt(px, py, f) { CAM.user = true; const ns = clamp(CAM.s * f, CAM.min, CAM.max), wx = (px - CAM.x) / CAM.s, wy = (py - CAM.y) / CAM.s; CAM.s = ns; CAM.x = px - wx * ns; CAM.y = py - wy * ns; clampCam(); }
const toScreen = (wx, wy) => [wx * CAM.s + CAM.x, wy * CAM.s + CAM.y];
const toWorld = (sx, sy) => [(sx - CAM.x) / CAM.s, (sy - CAM.y) / CAM.s];
function tileAtScreen(sx, sy) { const [wx, wy] = toWorld(sx, sy); return toTile(wx, wy); }

/* ---------- géométrie statique (recalculée quand le château change) ---------- */
function rebuild() {
  V.walls = computeWalls(); V.lights = []; V.flames = [];
  const L = (x, y, r, col, i, o = {}) => V.lights.push({ x, y, r, col, i, glow: o.glow ?? .3, flick: o.flick ?? 0, pulse: o.pulse, seed: hash(x, y, r) * 10 });
  for (const r of S.rooms) {
    if (!r.built || r.t === 'coeur' || zOf(r) !== Z) continue;
    if (isHall(r)) L(r.x + .5, r.y + .5, 1.25, 'warm', .3, { glow: 0 });
    else L(r.x + r.w / 2, r.y + r.h / 2, Math.max(r.w, r.h) * .8 + .6, 'warm', .55, { glow: .1 });
  }
  const h = heartRoom(); if (h && Z === zOf(h)) L(h.x + 1, h.y + 1, 4.2, 'violet', 1, { glow: .7, pulse: 1 });
  V.walls.forEach(w => {
    const mx = (w.x0 + w.x1) / 2, my = (w.y0 + w.y1) / 2, ox = w.face === 'W' ? .22 : 0, oy = w.face === 'N' ? .22 : 0;
    if (w.deco === 'torch') { L(mx + ox, my + oy, 2.6, 'fire', 1, { glow: .45, flick: 1 }); const p = lerp2(WP(w.x0, w.y0), WP(w.x1, w.y1), .5); V.flames.push({ wx: p[0], wy: p[1] - w.h * .62 - 4, s: 1.7, d: w.d + .02, seed: mx * 3 + my }); }
    if (w.deco === 'window') L(mx + ox * 2, my + oy * 2, 1.7, 'moon', .5, { glow: .2 });
  });
  S.furn.forEach(f => {
    if (zOf(f) !== Z) return;
    const r = roomAt(f.x, f.y); if (!r || !r.built) return;
    const l = LIGHTS[f.t] || LIGHTS[(FURN[f.t] || {}).sprite]; if (l) L(f.x + .5, f.y + .5, l[0], l[1], l[2], { glow: .4, flick: l[1] === 'fire' || l[1] === 'warm' ? 1 : 0 });
    (FLAMES[f.t] || FLAMES[(FURN[f.t] || {}).sprite] || []).forEach(([ax, ay, az, sc]) => { const [px, py] = pt(ax, ay, az), [bx, by] = WP(f.x + .5, f.y + .5); V.flames.push({ wx: bx + px * AU, wy: by + py * AU, s: sc * 1.9, d: f.x + f.y + 1.02, seed: f.x * 7 + f.y }); });
  });
  if (Z === 0) {
    for (let i = 1; i < W; i += 3) L(i + .5, .35, 2.3, 'fire', .85, { glow: .35, flick: 1 });
    for (let i = 1; i < H; i += 3) L(.35, i + .5, 2.3, 'fire', .85, { glow: .35, flick: 1 });
    braziers().forEach(([x, y]) => L(x, y, 2.8, 'fire', 1, { glow: .5, flick: 1 }));
  } else if (Z > 0) L(W / 2, H / 2, W * .75, 'moon', .5, { glow: 0 });
  if (Z === EXT && V.extKey !== W + ':' + extDepth()) {
    const R = rng(777), d = extDepth(), out = V.outsideExt = [], X = k => XDRAW[k] ? k : 'tree';
    const tree = (x, y, edge) => { const k = R(); out.push({ x, y, key: edge && k < .25 ? X('souche') : k < .42 ? 'tree' : k < .7 ? 'pine' : k < .84 ? 'bush' : k < .94 ? X('fougere') : 'rock' }); };
    for (let y = 0; y < H - d; y++) for (let x = 0; x < W; x++) if (R() < .85) tree(x + .3 + R() * .4, y + .3 + R() * .4, y === H - d - 1);
    for (let y = -3; y < H; y++) for (let x = -3; x < 0; x++) if (R() < .6) tree(x + R(), y + R());
    for (let y = -3; y < 0; y++) for (let x = 0; x < W + 3; x++) if (R() < .6) tree(x + R(), y + R());
    for (let y = 0; y < H - d - 1; y++) for (let x = W; x < W + 2.5; x++) if (R() < .55) tree(x + R(), y + R());
    for (let y = H - d - 1; y < H; y++) if (R() < .5) out.push({ x: W + .6 + R() * 1.2, y: y + R(), key: R() < .6 ? 'bush' : 'rock' });   // devant la clairière : rien qui cache le jardin
    V.extKey = W + ':' + extDepth();
  }
  if (!V.outside.length) {
    const R = rng(4242);
    for (let i = 0; i < 46; i++) {
      const side = i % 4; let x, y;
      if (side === 0) { x = -1.4 - R() * 2.2; y = -2 + R() * (H + 3); } else if (side === 1) { y = -1.4 - R() * 2.2; x = -2 + R() * (W + 3); }
      else if (side === 2) { x = W + .9 + R() * 2.2; y = -2 + R() * (H + 1); } else { y = H + .9 + R() * 2.2; x = -2 + R() * (W + 3); if (Math.abs(x - GATE.x - .5) < 1.6) continue; }
      const k = R(), back = x + y < (W + H) / 2 - 1; V.outside.push({ x, y, key: back ? (k < .45 ? 'tree' : k < .7 ? 'pine' : k < .86 ? 'bush' : 'rock') : (k < .55 ? 'bush' : 'rock') });
    }
  }
  V.dirty = false;
}
function computeWalls() {
  const out = [], D = doors();
  for (const r of S.rooms) {
    if (!r.built || r.t === 'porche' || zOf(r) !== Z) continue;
    const d = ROOMS[r.t]; let banner = false;
    for (const [x, y] of cellsOf(r)) {
      for (const [face, nx, ny, x0, y0, x1, y1, dep] of [['N', x, y - 1, x, y, x + 1, y, x + y + .5], ['W', x - 1, y, x, y, x, y + 1, x + y + .5], ['S', x, y + 1, x, y + 1, x + 1, y + 1, x + y + 1.5], ['E', x + 1, y, x + 1, y, x + 1, y + 1, x + y + 1.5]]) {
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const nb = roomAt(nx, ny); if (nb === r || sameGroup(r, nb)) continue;
        const ok = nb && nb.built;
        if (ok && isHall(nb) && isHall(r)) continue;
        if (ok && (face === 'S' || face === 'E')) continue;
        const door = ok && D.has(edgeKey(x, y, nx, ny));
        let kind = ok ? 'low' : (face === 'N' || face === 'W') ? 'full' : 'low';
        if (d.open || (ok && ROOMS[nb.t].open)) kind = 'hedge';
        if (d.out) { if (d.border === 'none') continue; kind = d.border || 'fence'; }   // dehors : clôture, haie ou grille
        const w = { face, x0, y0, x1, y1, d: dep, kind, door, h: kind === 'full' ? WALL_FULL : kind === 'hedge' ? 18 : kind === 'grille' ? 30 : kind === 'fence' ? 24 : WALL_LOW, v: Math.floor(hash(x, y, face.charCodeAt(0)) * 4), room: r };
        if (kind === 'full' && !door) {
          const k = hash(x * 3, y * 5, face.charCodeAt(0));
          if (isHall(r)) w.deco = (x + y) % 3 === 0 ? 'torch' : null;
          else if (!banner && r.t !== 'coeur') { w.deco = 'banner'; banner = true; }
          else w.deco = k < .34 ? 'torch' : k < .55 ? (Z < 0 ? 'torch' : 'window') : k < .72 && ['cuisine', 'labo', 'bibli', 'taverne', 'atelier'].includes(r.t) ? 'shelf' : k < .84 && ['forge', 'garde', 'trone', 'tour'].includes(r.t) ? 'shield' : null;
        }
        out.push(w);
      }
    }
  }
  return out;
}

/* ---------- dessin du décor ---------- */
function texQuad(c, tex, A, B, h, dark) {
  c.save(); c.beginPath(); c.moveTo(A[0], A[1]); c.lineTo(B[0], B[1]); c.lineTo(B[0], B[1] - h); c.lineTo(A[0], A[1] - h); c.closePath(); c.clip();
  c.transform((B[0] - A[0]) / tex.width, (B[1] - A[1]) / tex.width, 0, h / tex.height, A[0], A[1] - h); c.drawImage(tex, 0, 0);
  if (dark) { c.fillStyle = `rgba(12,8,16,${dark})`; c.fillRect(0, 0, tex.width, tex.height); }
  c.restore();
}
function capQuad(c, a, b, h, off, col) { const p = [[a[0], a[1] - h], [b[0], b[1] - h], [b[0] + off[0], b[1] - h + off[1]], [a[0] + off[0], a[1] - h + off[1]]]; path(c, p); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(25,16,10,.75)'; c.lineWidth = 1.2; c.stroke(); }
// clôture de bois (poulailler) ou grille de fer (cimetière), avec un portillon ouvert
function drawFence(c, w) {
  const A = WP(w.x0, w.y0), B = WP(w.x1, w.y1), h = w.h, iron = w.kind === 'grille', ink = '#1e140e', col = iron ? '#3d3844' : '#8f6d46';
  const P = (u, z) => { const p = lerp2(A, B, u); return [p[0], p[1] - z]; };
  (w.door ? [[0, .28], [.72, 1]] : [[0, 1]]).forEach(([u0, u1]) => {
    [.34, .76].forEach(k => { ln(c, [P(u0, h * k), P(u1, h * k)], ink, iron ? 3 : 5); ln(c, [P(u0, h * k), P(u1, h * k)], iron ? '#55505e' : '#a8845a', iron ? 1.5 : 2.8); });
    const n = iron ? 5 : 2;
    for (let i = 0; i <= n; i++) {
      const u = u0 + (u1 - u0) * i / n, top = h * (iron ? 1 : .92 + (i % 2) * .1);
      ln(c, [P(u, -2), P(u, top)], ink, iron ? 2.6 : 6); ln(c, [P(u, -2), P(u, top)], col, iron ? 1.2 : 3.8);
      const tp = P(u, top);
      if (iron) { c.fillStyle = '#6a6274'; c.strokeStyle = ink; c.lineWidth = .8; c.beginPath(); c.moveTo(tp[0], tp[1] - 5); c.lineTo(tp[0] + 2.2, tp[1] + 1); c.lineTo(tp[0] - 2.2, tp[1] + 1); c.closePath(); c.fill(); c.stroke(); }
      else { c.fillStyle = '#b08a5e'; c.beginPath(); c.moveTo(tp[0] - 2, tp[1] + 1); c.lineTo(tp[0], tp[1] - 3); c.lineTo(tp[0] + 2, tp[1] + 1); c.closePath(); c.fill(); }
    }
  });
}
function drawWall(c, w, t) {
  if (w.kind === 'fence' || w.kind === 'grille') { drawFence(c, w); return; }
  const A = WP(w.x0, w.y0), B = WP(w.x1, w.y1), h = w.h, side = w.face === 'W' || w.face === 'E';
  const tex = texWall(w.kind === 'hedge' ? 'hedge' : w.kind === 'full' ? 'full' : 'low', w.v);
  const off = side ? [-7, -3.5] : [7, -3.5];
  const seg = (t0, t1) => {
    const a = lerp2(A, B, t0), b = lerp2(A, B, t1);
    texQuad(c, tex, A, B, h, side ? .3 : 0);
    capQuad(c, a, b, h, off, w.kind === 'hedge' ? '#4f8a3c' : curStyle().cap);
    c.strokeStyle = 'rgba(20,12,8,.6)'; c.lineWidth = 1; c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke();
  };
  if (w.door && w.kind !== 'full') {
    [[0, .2], [.8, 1]].forEach(([t0, t1]) => { const a = lerp2(A, B, t0), b = lerp2(A, B, t1); texQuad(c, tex, a, b, h, side ? .3 : 0); capQuad(c, a, b, h, off, w.kind === 'hedge' ? '#4f8a3c' : curStyle().cap); });
    return;
  }
  seg(0, 1);
  const P = (u, z) => { const p = lerp2(A, B, u); return [p[0], p[1] - z]; };
  if (w.door) {
    const m0 = P(.28, 0), m1 = P(.72, 0), t0 = P(.28, h * .58), t1 = P(.72, h * .58), top = P(.5, h * .86);
    c.beginPath(); c.moveTo(...m0); c.lineTo(...t0); c.quadraticCurveTo(top[0], top[1], ...t1); c.lineTo(...m1); c.closePath();
    const gr = c.createLinearGradient(0, top[1], 0, m0[1]); gr.addColorStop(0, '#120a07'); gr.addColorStop(1, '#2c1c12'); c.fillStyle = gr; c.fill();
    c.strokeStyle = '#4a3020'; c.lineWidth = 4; c.stroke(); c.strokeStyle = 'rgba(15,8,5,.9)'; c.lineWidth = 1.2; c.stroke();
  }
  if (w.deco === 'banner') {
    const col = ROOMS[w.room.t].color, p = [P(.36, h * .92), P(.64, h * .92), P(.64, h * .3), P(.5, h * .2), P(.36, h * .3)];
    path(c, p); const gr = c.createLinearGradient(0, p[0][1], 0, p[3][1]); gr.addColorStop(0, shade(col, -.2)); gr.addColorStop(1, shade(col, -.45)); c.fillStyle = gr; c.fill(); c.strokeStyle = '#d9a441'; c.lineWidth = 1.6; c.stroke();
    const e = P(.5, h * .62); c.beginPath(); c.arc(e[0], e[1], 5, 0, 7); c.fillStyle = '#e9b949'; c.fill(); c.strokeStyle = '#6a4a12'; c.lineWidth = 1; c.stroke();
    ln(c, [P(.33, h * .93), P(.67, h * .93)], '#5a3a22', 2.4);
  } else if (w.deco === 'window') {
    const p = [P(.38, h * .3), P(.62, h * .3), P(.62, h * .68), P(.56, h * .78), P(.5, h * .8), P(.44, h * .78), P(.38, h * .68)];
    path(c, p); const gr = c.createLinearGradient(0, p[4][1], 0, p[0][1]); gr.addColorStop(0, '#2b3a6e'); gr.addColorStop(1, '#5a6aa8'); c.fillStyle = gr; c.fill(); c.strokeStyle = '#3a2a1e'; c.lineWidth = 3; c.stroke();
    ln(c, [P(.5, h * .3), P(.5, h * .8)], '#3a2a1e', 2); ln(c, [P(.38, h * .52), P(.62, h * .52)], '#3a2a1e', 2);
    const s = P(.58, h * .66); c.fillStyle = 'rgba(255,250,220,.8)'; c.beginPath(); c.arc(s[0], s[1], 1.5, 0, 7); c.fill();
  } else if (w.deco === 'shelf') {
    ln(c, [P(.25, h * .55), P(.75, h * .55)], '#4a2e1a', 4); ln(c, [P(.25, h * .55), P(.75, h * .55)], '#8a5a32', 2);
    [.33, .45, .58, .68].forEach((u, i) => { const p = P(u, h * .55 + 7); ell(c, p[0], p[1], 4.5, 5.5, ['#b8603a', '#5f9a4f', '#d9a441', '#7550b0'][i], 1); });
  } else if (w.deco === 'shield') {
    const p = P(.5, h * .6); ell(c, p[0], p[1], 11, 13, '#8a8f9a', 1.4); ell(c, p[0], p[1], 6, 7.5, '#b83a33', 1); ln(c, [[p[0] - 16, p[1] - 14], [p[0] + 16, p[1] + 14]], '#c9ced8', 2.4); ln(c, [[p[0] + 16, p[1] - 14], [p[0] - 16, p[1] + 14]], '#c9ced8', 2.4);
  } else if (w.deco === 'torch') {
    const p = P(.5, h * .56); ln(c, [[p[0], p[1] + 6], [p[0], p[1] - 4]], '#2a1c16', 4); ln(c, [[p[0], p[1] + 6], [p[0], p[1] - 4]], '#6a4a2a', 2);
    c.beginPath(); c.ellipse(p[0], p[1] - 5, 4, 2, 0, 0, 7); c.fillStyle = '#3a3a42'; c.fill();
  }
}
function merlons(c, A, B, h, off, col, n) { for (let i = 0; i < n; i += 2) { const a = lerp2(A, B, i / n), b = lerp2(A, B, (i + 1) / n); const q = [[a[0], a[1] - h], [b[0], b[1] - h], [b[0], b[1] - h - 14], [a[0], a[1] - h - 14]]; path(c, q); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(20,12,8,.7)'; c.lineWidth = 1; c.stroke(); capQuad(c, [a[0], a[1] - 14], [b[0], b[1] - 14], h, off, '#9a907f'); } }
// palissade : des pieux taillés en pointe au lieu des créneaux
function stakes(c, A, B, h, col) {
  for (let i = 0; i < 4; i++) { const p = lerp2(A, B, (i + .5) / 4), q = [[p[0] - 6, p[1] - h], [p[0] + 6, p[1] - h], [p[0] + 6, p[1] - h - 10], [p[0], p[1] - h - 20], [p[0] - 6, p[1] - h - 10]]; path(c, q); c.fillStyle = col; c.fill(); c.strokeStyle = 'rgba(20,12,8,.7)'; c.lineWidth = 1.2; c.stroke(); }
}
function rampart(c, A, B, h, side, n) {
  const tex = texWall('ramp', 0), off = side ? [-14, -7] : [14, -7];
  const st = curStyle(); texQuad(c, tex, A, B, h, side ? .32 : .05); capQuad(c, A, B, h, off, st.capR);
  if (st.logs) stakes(c, A, B, h, side ? st.merl[0] : st.merl[1]); else merlons(c, A, B, h, off, side ? st.merl[0] : st.merl[1], n);
}
function tower(c, x, y, r, hgt, roof, t) {
  const [sx, sy] = WP(x, y); c.save(); c.translate(sx, sy); c.scale(AU, AU);
  const hh = hgt / AU; cyl(c, 0, 0, r, hh, 0, curStyle().tower);
  for (let z = 10; z < hh; z += 10) { const [cx, cy] = pt(0, 0, z); c.beginPath(); c.ellipse(cx, cy, r * 45, r * 22.5, 0, .15, Math.PI - .15); c.strokeStyle = 'rgba(30,20,12,.28)'; c.lineWidth = .8; c.stroke(); }
  const [wx, wy] = pt(0, r, hh * .62); rr(c, wx - 3.5, wy - 8, 7, 11, 3.5); c.fillStyle = '#ffcf7a'; c.fill(); c.strokeStyle = '#2a1c16'; c.lineWidth = 1; c.stroke();
  const [tx, ty] = pt(0, 0, hh), rx = r * 52;
  c.beginPath(); c.moveTo(tx - rx, ty); c.quadraticCurveTo(tx, ty + r * 30, tx + rx, ty); c.lineTo(tx, ty - r * 105); c.closePath();
  const gr = c.createLinearGradient(tx - rx, 0, tx + rx, 0); gr.addColorStop(0, shade(roof, .15)); gr.addColorStop(.4, roof); gr.addColorStop(1, shade(roof, -.45)); c.fillStyle = gr; c.fill(); c.strokeStyle = shade(roof, -.6); c.lineWidth = 1.2; c.stroke();
  for (let k = 1; k < 4; k++) { const yy = ty - r * 105 * (1 - k / 4), ww = rx * k / 4; c.beginPath(); c.moveTo(tx - ww, yy); c.quadraticCurveTo(tx, yy + r * 8 * k / 4, tx + ww, yy); c.strokeStyle = 'rgba(40,10,10,.35)'; c.lineWidth = .8; c.stroke(); }
  const fx = tx, fy = ty - r * 105; ln(c, [[fx, fy], [fx, fy - 16]], '#2a1c16', 1.6);
  const wv = Math.sin(t / 300 + x) * 2; c.beginPath(); c.moveTo(fx, fy - 16); c.quadraticCurveTo(fx + 8, fy - 16 + wv, fx + 15, fy - 13); c.lineTo(fx, fy - 9); c.closePath(); c.fillStyle = '#e9b949'; c.fill(); c.strokeStyle = '#6a4a12'; c.lineWidth = .8; c.stroke();
  c.restore();
}
function drawFlame(c, x, y, s, t, seed) {
  const f = Math.sin(t * .013 + seed) * .14 + Math.sin(t * .029 + seed * 2.3) * .09, h = 15 * s * (1 + f), w = 5.6 * s * (1 - f * .6), sway = Math.sin(t * .007 + seed) * 1.5 * s;
  const shape = (k) => { c.beginPath(); c.moveTo(x + sway * k, y - h * k); c.bezierCurveTo(x + w * 1.25 * k, y - h * .45 * k, x + w * k, y, x, y); c.bezierCurveTo(x - w * k, y, x - w * 1.25 * k, y - h * .45 * k, x + sway * k, y - h * k); };
  shape(1); let g = c.createLinearGradient(0, y - h, 0, y); g.addColorStop(0, 'rgba(255,80,20,0)'); g.addColorStop(.3, 'rgba(255,100,30,.85)'); g.addColorStop(1, 'rgba(255,170,60,1)'); c.fillStyle = g; c.fill();
  shape(.6); g = c.createLinearGradient(0, y - h * .6, 0, y); g.addColorStop(0, 'rgba(255,220,120,0)'); g.addColorStop(.4, 'rgba(255,230,140,.95)'); g.addColorStop(1, 'rgba(255,250,220,1)'); c.fillStyle = g; c.fill();
}
function drawCrystal(c, t) {
  const h = heartRoom(), [sx, sy] = WP(h.x + 1, h.y + 1), p = 1 + Math.sin(t / 420) * .04, lift = Math.sin(t / 600) * 4;
  c.save(); c.translate(sx, sy); c.scale(AU, AU);
  box(c, 0, 0, .7, .7, 8, 0, '#5a5470', 'stone'); box(c, 0, 0, .5, .5, 5, 8, '#6c6684', 'stone');
  c.translate(0, -16 - lift); c.scale(p, p);
  poly(c, [[0, -62], [17, -32], [11, -6], [0, 0], [-11, -6], [-17, -32]], '#a982ea', 1.6);
  poly(c, [[0, -62], [17, -32], [0, -26]], '#d6c2ff', .8); poly(c, [[0, -62], [-17, -32], [0, -26]], '#8a62d0', .8); poly(c, [[-11, -6], [0, -26], [11, -6], [0, 0]], '#7a52c0', .8);
  ln(c, [[-6, -42], [-9, -30]], 'rgba(255,255,255,.75)', 2);
  c.restore();
}

/* ---------- acteurs ---------- */
// créatures et héros : dessinés à un peu plus de la moitié de leur taille de sticker, pour que le château paraisse plus grand
const ACTOR_K = .55;
function newActor(id, kind, key, x, y) { return { id, kind, key, x, y, sc: (((kind === 'char' ? CHAR : HERO_ART)[key] || {}).sc || 1) * ACTOR_K, ph: Math.random() * 6, tok: 0, flip: false, walking: false, jx: 0, jy: 0 }; }
function moveTo(a, x, y, ms) { return new Promise(res => { const dx = (x - y) - (a.x - a.y); if (Math.abs(dx) > .01) a.flip = dx < 0; Object.assign(a, { fx: a.x, fy: a.y, tx: x, ty: y, t0: performance.now(), dur: ms, res }); }); }
function updateActors(now) {
  [...ACT.values(), ...HEROS].forEach(a => {
    if (!a.dur) return;
    const p = Math.min(1, (now - a.t0) / a.dur); a.x = a.fx + (a.tx - a.fx) * p; a.y = a.fy + (a.ty - a.fy) * p;
    if (p >= 1) { a.dur = 0; const r = a.res; a.res = null; r && r(); }
  });
}
// ciel des étages en hauteur : dégradé de nuit, étoiles, lune, nuages qui passent
const SKY_STARS = Array.from({ length: 140 }, (_, i) => [hash(i, 1), hash(i, 2), .4 + hash(i, 3) * 1.4, hash(i, 4) * 6]);
function drawSky(t) {
  const g = ctx, w = V.w, h = V.h, gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#0a0c24'); gr.addColorStop(.6, '#1b1f4a'); gr.addColorStop(1, '#3a2c52'); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  SKY_STARS.forEach(([x, y, r, ph]) => { g.globalAlpha = .45 + .45 * Math.sin(t / 900 + ph); g.fillStyle = '#fff6dc'; g.beginPath(); g.arc(x * w, y * h * .8, r, 0, 7); g.fill(); });
  g.globalAlpha = 1; const mx = w * .82, my = h * .16; g.fillStyle = 'rgba(255,240,200,.12)'; g.beginPath(); g.arc(mx, my, 60, 0, 7); g.fill();
  g.fillStyle = '#f6ecc8'; g.beginPath(); g.arc(mx, my, 26, 0, 7); g.fill(); g.fillStyle = '#1b1f4a'; g.beginPath(); g.arc(mx + 11, my - 7, 23, 0, 7); g.fill();
  for (let i = 0; i < 6; i++) { const x = ((t / 90 * (.4 + hash(i, 9) * .5) + hash(i, 7) * w * 1.6) % (w * 1.6)) - w * .3, y = h * (.12 + hash(i, 8) * .75); g.fillStyle = 'rgba(190,190,230,.08)'; [0, 1, 2].forEach(k => { g.beginPath(); g.ellipse(x + k * 46, y + (k % 2) * 8, 70, 22, 0, 0, 7); g.fill(); }); }
}
// attitudes : sieste (penché, souffle lent), travail (coups réguliers), repas, danse, chamaille (secoué), bavardage, lecture
function drawActor(c, a, t) {
  const [wx, wy] = WP(a.x, a.y), s = getSprite(a.kind, a.key), k = AU / SQ() * 1.08 * ACTOR_K, P = a.walking ? null : a.pose;
  let bob = a.walking ? Math.abs(Math.sin(t / 95 + a.ph)) * 5 : 0, breath = a.walking ? 1 : 1 + Math.sin(t / 520 + a.ph) * .018, rot = 0, dx = 0;
  if (P === 'sleep') { rot = -.2; breath = .93 + Math.sin(t / 900 + a.ph) * .03; }
  else if (P === 'work') bob = Math.abs(Math.sin(t / 130 + a.ph)) * 4;
  else if (P === 'eat') bob = Math.abs(Math.sin(t / 170 + a.ph)) * 2.2;
  else if (P === 'dance') { bob = Math.abs(Math.sin(t / 160 + a.ph)) * 7; rot = Math.sin(t / 320 + a.ph) * .12; }
  else if (P === 'shake') dx = Math.sin(t / 28) * 3;
  else if (P === 'chat') bob = Math.abs(Math.sin(t / 260 + a.ph)) * 1.6;
  else if (P === 'read') rot = Math.sin(t / 900 + a.ph) * .03;
  else if (P === 'ko') { rot = 1.3; breath = 1; }
  if (a.hurtUntil && t < a.hurtUntil) dx += Math.sin(t / 22) * 5;
  if (a.hopUntil && t < a.hopUntil) bob += Math.sin((a.hopUntil - t) / 600 * Math.PI) * 14;
  bob *= ACTOR_K + .2; dx *= ACTOR_K + .2;
  c.save(); c.globalAlpha = a.alpha == null ? 1 : a.alpha; c.translate(wx + dx, wy - bob); if (a.flip) c.scale(-1, 1); if (rot) c.rotate(rot); c.scale(k, k * breath);
  c.drawImage(s.img, -s.ax, -s.ay); c.restore();
}
function drawSprite(c, s, wx, wy, scale = 1, alpha = 1) { const k = AU / SQ() * scale; c.save(); c.globalAlpha = alpha; c.translate(wx, wy); c.scale(k, k); c.drawImage(s.img, -s.ax, -s.ay); c.restore(); }
function shadowEll(c, wx, wy, rx, ry, a = .38) { c.beginPath(); c.ellipse(wx, wy, rx, ry, 0, 0, 7); c.fillStyle = `rgba(10,5,8,${a})`; c.fill(); }

/* ---------- lumière ---------- */
const LIGHTMAP = mk(1, 1); let CARVE = null, GLOWS = {};
function lightList(t) {
  const out = V.lights.map(l => { let i = l.i, r = l.r; if (l.flick) { const f = Math.sin(t * .011 + l.seed) * .06 + Math.sin(t * .027 + l.seed * 3) * .05; i *= 1 + f; r *= 1 + f * .5; } if (l.pulse) { i *= .85 + Math.sin(t / 420) * .15; } return { ...l, i, r }; });
  if ((V.heroZ || 0) === Z) HEROS.forEach(a => out.push({ x: a.x, y: a.y, r: 2.7, col: 'fire', i: 1, glow: .45 }));
  ACT.forEach(a => out.push({ x: a.x, y: a.y, r: .95, col: 'warm', i: .62, glow: 0 }));
  ACT.forEach(a => { if (a.key === 'fantome') out.push({ x: a.x, y: a.y, r: 1.4, col: 'moon', i: .55, glow: .35 }); else if (a.key === 'diablotin' || a.key === 'dragonnet') out.push({ x: a.x, y: a.y, r: 1, col: 'red', i: .4, glow: .3 }); });
  return out;
}
function drawLighting(t, lights) {
  // l'ombre se calcule en petit (ce sont des dégradés très doux), puis s'étire sur l'écran
  const q = .36, lw = Math.ceil(cv.width * q), lh = Math.ceil(cv.height * q);
  if (LIGHTMAP.width !== lw || LIGHTMAP.height !== lh) { LIGHTMAP.width = lw; LIGHTMAP.height = lh; CARVE = null; }
  const g = LIGHTMAP.getContext('2d');
  if (!CARVE) { CARVE = g.createRadialGradient(0, 0, 0, 0, 0, 1); CARVE.addColorStop(0, 'rgba(0,0,0,1)'); CARVE.addColorStop(.38, 'rgba(0,0,0,.82)'); CARVE.addColorStop(1, 'rgba(0,0,0,0)'); }
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, lw, lh);
  g.fillStyle = Z < 0 ? `rgba(8,6,12,${Math.min(.86, TUNE.ambient + .05)})` : Z > 0 ? `rgba(16,18,44,${Math.max(.3, TUNE.ambient - .12)})` : `rgba(12,9,28,${TUNE.ambient})`; g.fillRect(0, 0, lw, lh);
  g.globalCompositeOperation = 'destination-out';
  const k = V.dpr * q; g.setTransform(k * CAM.s, 0, 0, k * CAM.s, k * CAM.x, k * CAM.y);
  const [cx, cy] = WP(W / 2, H / 2); g.save(); g.translate(cx, cy); g.scale(W * 70, W * 38); g.globalAlpha = Z < 0 ? .34 : .22; g.fillStyle = CARVE; g.fillRect(-1, -1, 2, 2); g.restore();
  for (const l of lights) { const [x, y] = WP(l.x, l.y); const r = l.r * 128 * TUNE.lightScale; g.save(); g.translate(x, y); g.scale(r, r * .62); g.globalAlpha = Math.min(1, l.i); g.fillStyle = CARVE; g.fillRect(-1, -1, 2, 2); g.restore(); }
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(LIGHTMAP, 0, 0, cv.width, cv.height);
  ctx.setTransform(V.dpr * CAM.s, 0, 0, V.dpr * CAM.s, V.dpr * CAM.x, V.dpr * CAM.y); ctx.globalCompositeOperation = 'lighter';
  for (const l of lights) {
    if (!l.glow) continue;
    if (!GLOWS[l.col]) { const gr = ctx.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, `rgba(${LCOL[l.col]},.85)`); gr.addColorStop(.35, `rgba(${LCOL[l.col]},.3)`); gr.addColorStop(1, `rgba(${LCOL[l.col]},0)`); GLOWS[l.col] = gr; }
    const [x, y] = WP(l.x, l.y), r = l.r * 128 * .85 * TUNE.lightScale; ctx.save(); ctx.translate(x, y - 10); ctx.scale(r, r * .62); ctx.globalAlpha = Math.min(1, l.glow * l.i * TUNE.glow); ctx.fillStyle = GLOWS[l.col]; ctx.fillRect(-1, -1, 2, 2); ctx.restore();
  }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
}

/* ---------- particules ---------- */
function updateParticles(dt, t) {
  if (TUNE.particles) V.flames.forEach(f => { if (Math.random() < .05) V.parts.push({ k: 'ember', x: f.wx + (Math.random() - .5) * 6, y: f.wy - 10, vx: (Math.random() - .5) * 12, vy: -24 - Math.random() * 30, life: 0, max: 1.2 + Math.random() }); });
  const dust = V.parts.filter(p => p.k === 'dust').length;
  if (TUNE.particles && dust < TUNE.dust) { const r = S.rooms.filter(r => r.built); if (r.length) { const rm = pick(r), [x, y] = WP(rm.x + Math.random() * rm.w, rm.y + Math.random() * rm.h); V.parts.push({ k: 'dust', x, y: y - Math.random() * 70, vx: (Math.random() - .5) * 5, vy: -2 - Math.random() * 4, life: 0, max: 5 + Math.random() * 5 }); } }
  const h = heartRoom(); if (h && Z === zOf(h) && Math.random() < .2) { const [x, y] = WP(h.x + 1 + (Math.random() - .5) * 1.2, h.y + 1 + (Math.random() - .5) * 1.2); V.parts.push({ k: 'spark', x, y: y - 20 - Math.random() * 60, vx: 0, vy: -14, life: 0, max: 1.4 }); }
  V.parts.forEach(p => { p.life += dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.k === 'ember') p.vx += Math.sin(t / 200 + p.y) * dt * 10; });
  V.parts = V.parts.filter(p => p.life < p.max);
}
function drawParticles(c, t) {
  c.globalCompositeOperation = 'lighter';
  for (const p of V.parts) {
    const k = p.life / p.max, a = Math.sin(k * Math.PI);
    if (p.k === 'ember') { c.fillStyle = `rgba(255,${140 + 80 * (1 - k) | 0},60,${a * .9})`; c.beginPath(); c.arc(p.x, p.y, 1.6, 0, 7); c.fill(); }
    else if (p.k === 'dust') { c.fillStyle = `rgba(255,236,200,${a * .22})`; c.beginPath(); c.arc(p.x, p.y, 1.3, 0, 7); c.fill(); }
    else if (p.k === 'spark') { c.fillStyle = `rgba(210,170,255,${a})`; c.beginPath(); c.arc(p.x, p.y, 1.8, 0, 7); c.fill(); }
    else if (p.k === 'poof') { c.fillStyle = `rgba(255,240,215,${a * .5})`; c.beginPath(); c.arc(p.x, p.y, 3 + k * 6, 0, 7); c.fill(); }
  }
  c.globalCompositeOperation = 'source-over';
}
function poof(x, y, w = 1, h = 1) { for (let i = 0; i < 26; i++) { const [px, py] = WP(x + Math.random() * w, y + Math.random() * h); V.parts.push({ k: 'poof', x: px, y: py, vx: (Math.random() - .5) * 40, vy: -10 - Math.random() * 30, life: 0, max: .7 + Math.random() * .4 }); } }
