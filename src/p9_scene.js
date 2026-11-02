
/* =========================================================
   Composition de la scène, marqueurs lumineux, bulles,
   vie des créatures, sélection, boucle d'animation
   ========================================================= */
const braziers = () => [[GATE.x - .5, H + .6], [GATE.x + 1.5, H + .6]];
// les remparts ont bougé (agrandissement) : textures à refaire, décor extérieur à replanter, créatures décalées
function onGeom(dx, dy) {
  TERRAIN = null; CAVE = null; ROOF = null; V.outside = []; V.dirty = true;
  [...ACT.values(), ...HEROS].forEach(a => { a.x += dx; a.y += dy; if (a.dur) { a.fx += dx; a.fy += dy; a.tx += dx; a.ty += dy; } });
  if (V.w) { if (CAM.user) clampCam(); else fitCamera(); }
}
// l'étage affiché est aussi l'étage de travail (Z)
function setFloor(z) {
  if (z === Z) return;
  Z = z; V.dirty = true; V.hover = null; V.ghost = null; V.hoverActor = null; UI.ghostKey = null; UI.touchAnchor = null;
  renderAll(); if (UI.hand && UI.lastPt) updateGhost(UI.lastPt);
}
// l'escalier (ou le palier) de l'étage z qui mène vers z + dir
const stairsToward = (z, dir) => S.rooms.find(r => zOf(r) === z && r.built && r.pair && (r.land ? ROOMS[r.t].stairs === -dir : ROOMS[r.t].stairs === dir));
const footprint = r => [WP(r.x, r.y), WP(r.x + r.w, r.y), WP(r.x + r.w, r.y + r.h), WP(r.x, r.y + r.h)];
const worldXf = () => ctx.setTransform(V.dpr * CAM.s, 0, 0, V.dpr * CAM.s, V.dpr * CAM.x, V.dpr * CAM.y);
const screenXf = () => ctx.setTransform(V.dpr, 0, 0, V.dpr, 0, 0);

function backDraw(t) {
  if (Z > 0) { [[WP(0, 0), WP(W, 0), false, W], [WP(0, 0), WP(0, H), true, H]].forEach(([A, B, side, n]) => { for (let i = 0; i < n; i++) rampart(ctx, lerp2(A, B, i / n), lerp2(A, B, (i + 1) / n), RAMP_LOW, side, 2); }); return; }
  if (Z < 0) { [[WP(0, 0), WP(W, 0), false, W], [WP(0, 0), WP(0, H), true, H]].forEach(([A, B, side, n]) => { for (let i = 0; i < n; i++) { const a = lerp2(A, B, i / n), b = lerp2(A, B, (i + 1) / n); texQuad(ctx, texWall('rock', i % 3), a, b, 150, side ? .35 : .1); } }); return; }
  tower(ctx, -.5, -.5, .62, 210, '#9c2f2a', t);
  [[WP(0, 0), WP(W, 0), false, W], [WP(0, 0), WP(0, H), true, H]].forEach(([A, B, side, n]) => {
    for (let i = 0; i < n; i++) rampart(ctx, lerp2(A, B, i / n), lerp2(A, B, (i + 1) / n), RAMP_H, side, 2);
    for (let i = 1; i < n; i += 3) { const p = lerp2(A, B, (i + .5) / n); ln(ctx, [[p[0], p[1] - RAMP_H * .5 + 8], [p[0], p[1] - RAMP_H * .5 - 4]], '#2a1c16', 5); ln(ctx, [[p[0], p[1] - RAMP_H * .5 + 8], [p[0], p[1] - RAMP_H * .5 - 4]], '#6a4a2a', 2.6); drawFlame(ctx, p[0], p[1] - RAMP_H * .5 - 6, 1.7, t, i * 3 + (side ? 1 : 0)); }
  });
}
function frontItems(list, t) {
  if (Z > 0) { for (let x = 0; x < W; x++) list.push({ d: x + H + .6, f: () => rampart(ctx, WP(x, H), WP(x + 1, H), RAMP_LOW * .7, false, 2) }); for (let y = 0; y < H; y++) list.push({ d: W + y + .6, f: () => rampart(ctx, WP(W, y), WP(W, y + 1), RAMP_LOW * .7, true, 2) }); return; }
  if (Z < 0) return;
  for (let x = 0; x < W; x++) if (x !== GATE.x) list.push({ d: x + H + .6, f: () => rampart(ctx, WP(x, H), WP(x + 1, H), RAMP_LOW, false, 2) });
  for (let y = 0; y < H; y++) list.push({ d: W + y + .6, f: () => rampart(ctx, WP(W, y), WP(W, y + 1), RAMP_LOW, true, 2) });
  list.push({ d: W - 1, f: () => tower(ctx, W + .5, -.5, .56, 175, '#9c2f2a', t) });
  list.push({ d: H - 1, f: () => tower(ctx, -.5, H + .5, .56, 175, '#9c2f2a', t) });
  list.push({ d: W + H + 1.4, f: () => tower(ctx, W + .45, H + .45, .5, 60, '#9c2f2a', t) });
  list.push({ d: GATE.x + H + .55, f: () => {
    tower(ctx, GATE.x - .02, H + .12, .22, 104, '#9c2f2a', t); tower(ctx, GATE.x + 1.02, H + .12, .22, 104, '#9c2f2a', t);
    const A = WP(GATE.x, H), B = WP(GATE.x + 1, H), hh = 78;
    texQuad(ctx, texWall('low', 1), [A[0], A[1] - hh], [B[0], B[1] - hh], 20, 0); capQuad(ctx, [A[0], A[1] - hh - 20], [B[0], B[1] - hh - 20], 0, [7, -3.5], '#a39886');
    for (let i = 1; i < 6; i++) { const p = lerp2(A, B, i / 6); ln(ctx, [[p[0], p[1] - hh], [p[0], p[1] - hh * .62]], '#1e1612', 3); ln(ctx, [[p[0], p[1] - hh], [p[0], p[1] - hh * .62]], '#5a5560', 1.4); }
    ln(ctx, [[A[0], A[1] - hh * .64], [B[0], B[1] - hh * .64]], '#5a5560', 2.4);
  } });
  braziers().forEach(([x, y]) => list.push({ d: x + y, f: () => { const [wx, wy] = WP(x, y); drawSprite(ctx, getSprite('x', 'brazier'), wx, wy, 1); drawFlame(ctx, wx, wy - 58, 2.1, t, x); } }));
}

function drawScene(t) {
  if (!S) return;
  if (V.dirty) rebuild();
  const dt = Math.min(.05, (t - (V.lastT || t)) / 1000); V.lastT = t;
  updateActors(t); updateParticles(dt, t);
  ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
  ctx.fillStyle = Z < 0 ? '#07050a' : '#0b0910'; ctx.fillRect(0, 0, cv.width, cv.height);
  if (Z > 0) { screenXf(); drawSky(t); }
  worldXf(); ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  const M = TERRAIN_M, tt = TERRAIN_T;
  if (Z > 0) { ctx.save(); ctx.transform(64 / tt, 32 / tt, -64 / tt, 32 / tt, ...WP(0, 0)); ctx.drawImage(roofTexture(), 0, 0); ctx.restore(); }
  else { ctx.save(); ctx.transform(64 / tt, 32 / tt, -64 / tt, 32 / tt, ...WP(-M, -M)); ctx.drawImage(Z < 0 ? caveTexture() : terrainTexture(), 0, 0); ctx.restore(); }
  const here = o => zOf(o) === Z, actors = [...ACT.values()].filter(a => (a.z || 0) === Z), heros = Z === 0 ? HEROS : [];
  for (const r of S.rooms) {
    if (!here(r)) continue;
    if (r.built) { ctx.save(); ctx.transform(64 / TEXT, 32 / TEXT, -64 / TEXT, 32 / TEXT, ...WP(r.x, r.y)); ctx.drawImage(roomTexture(r), 0, 0); ctx.restore(); }
    else { path(ctx, footprint(r)); ctx.fillStyle = 'rgba(200,170,120,.16)'; ctx.fill(); ctx.setLineDash([12, 9]); ctx.strokeStyle = 'rgba(245,230,195,.8)'; ctx.lineWidth = 2.6; ctx.stroke(); ctx.setLineDash([]); }
  }
  S.furn.forEach(f => { if (!here(f) || FURN[f.t].flat) return; const [x, y] = WP(f.x + .5, f.y + .5); shadowEll(ctx, x, y + 3, 36, 18, .34); });
  S.defs.forEach(d => { if (!here(d)) return; const [x, y] = WP(d.x + .5, d.y + .5); shadowEll(ctx, x, y + 3, 32, 16, .3); });
  [...actors, ...heros].forEach(a => { const [x, y] = WP(a.x, a.y); shadowEll(ctx, x, y + 1, 24 * a.sc, 12 * a.sc, .42 * (a.alpha == null ? 1 : a.alpha)); });
  backDraw(t);
  const list = [];
  V.walls.forEach(w => list.push({ d: w.d, f: () => drawWall(ctx, w, t) }));
  S.furn.forEach(f => here(f) && list.push({ d: f.x + f.y + (FURN[f.t].flat ? .6 : 1), f: () => { const [x, y] = WP(f.x + .5, f.y + .5), b = V.born.get(f.id), k = b ? Math.max(1, 1.3 - (t - b) / 800) : 1, r = roomAt(f.x, f.y); drawSprite(ctx, getSprite('furn', f.t), x, y, k, r && r.built ? 1 : .55); } }));
  S.defs.forEach(d => here(d) && list.push({ d: d.x + d.y + .95, f: () => { const [x, y] = WP(d.x + .5, d.y + .5), hit = V.hit && V.hit.id === d.id && t - V.hit.t < 500, b = V.born.get(d.id); drawSprite(ctx, getSprite('def', d.t), x + (hit ? Math.sin(t / 30) * 4 : 0), y, b ? Math.max(1, 1.3 - (t - b) / 800) : 1); } }));
  S.rooms.filter(r => !r.built && here(r)).forEach(r => list.push({ d: r.x + r.y + (r.w + r.h) / 2, f: () => { const [x, y] = WP(r.x + r.w / 2, r.y + r.h / 2); drawSprite(ctx, getSprite('x', 'scaffold'), x, y, Math.min(1.3, (r.w + r.h) / 3)); } }));
  if (heartRoom() && Z === 0) { const h = heartRoom(); list.push({ d: h.x + h.y + 2, f: () => drawCrystal(ctx, t) }); }
  V.flames.forEach(fl => list.push({ d: fl.d, f: () => drawFlame(ctx, fl.wx, fl.wy, fl.s, t, fl.seed) }));
  actors.forEach(a => list.push({ d: a.x + a.y, f: () => drawActor(ctx, a, t) }));
  heros.forEach(a => list.push({ d: a.x + a.y, f: () => drawActor(ctx, a, t) }));
  if (Z === 0) V.outside.forEach(o => list.push({ d: o.x + o.y, f: () => { const [x, y] = WP(o.x, o.y); drawSprite(ctx, getSprite('x', o.key), x, y, 1.2); } }));
  frontItems(list, t);
  list.sort((a, b) => a.d - b.d).forEach(it => it.f());
  drawLighting(t, lightList(t));
  worldXf(); drawParticles(ctx, t);
  drawOverlays(t);
  screenXf();
  const vg = ctx.createRadialGradient(V.w / 2, V.h / 2, Math.min(V.w, V.h) * .35, V.w / 2, V.h / 2, Math.max(V.w, V.h) * .75);
  vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, `rgba(0,0,0,${TUNE.vignette})`); ctx.fillStyle = vg; ctx.fillRect(0, 0, V.w, V.h);
  drawDebug(t);
}

/* ---------- marqueurs et textes (non éclairés) ---------- */
function glowPath(pts, col, closed = true, k = 1, dash) {
  const s = CAM.s; ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  if (dash) ctx.setLineDash(dash.map(v => v / s)), ctx.lineDashOffset = -performance.now() / 40 / s;
  [[11, .16], [5.5, .32], [2.2, .95]].forEach(([w, a]) => { ctx.beginPath(); ctx.moveTo(...pts[0]); pts.slice(1).forEach(p => ctx.lineTo(...p)); if (closed) ctx.closePath(); ctx.strokeStyle = `rgba(${col},${a})`; ctx.lineWidth = w * k / s; ctx.stroke(); });
  ctx.restore();
}
function drawOverlays(t) {
  worldXf();
  if (V.showPath && Z === 0) { const p = heroPath(); if (p && p.length > 1) { const pts = p.map(([x, y]) => WP(x + .5, y + .5)); glowPath(pts, '255,228,150', false, 1, [14, 10]); const [ex, ey] = pts[pts.length - 1]; ctx.beginPath(); ctx.ellipse(ex, ey, 26, 13, 0, 0, 7); ctx.strokeStyle = 'rgba(255,228,150,.9)'; ctx.lineWidth = 2 / CAM.s; ctx.stroke(); } }
  if (V.tutoCells && !V.ghost) V.tutoCells.forEach(([x, y]) => glowPath(footprint({ x, y, w: 1, h: 1 }), '255,205,110', true, .7 + .5 * Math.abs(Math.sin(t / 380))));
  if (V.hover && !V.ghost) { const r = roomAt(V.hover[0], V.hover[1]); if (r) glowPath(isHall(r) ? footprint({ x: V.hover[0], y: V.hover[1], w: 1, h: 1 }) : footprint(r), '255,205,110', true, .7); }
  if (V.ghost) {
    const col = V.ghost.ok ? '255,150,50' : '255,70,70';
    V.ghost.cells.forEach(([x, y]) => { path(ctx, footprint({ x, y, w: 1, h: 1 })); ctx.fillStyle = V.ghost.ok ? 'rgba(255,150,50,.12)' : 'rgba(255,60,60,.14)'; ctx.fill(); });
    const xs = V.ghost.cells.map(c => c[0]), ys = V.ghost.cells.map(c => c[1]), x0 = Math.min(...xs), y0 = Math.min(...ys);
    glowPath(footprint({ x: x0, y: y0, w: Math.max(...xs) - x0 + 1, h: Math.max(...ys) - y0 + 1 }), col, true, 1.1);
    if (V.ghost.kind !== 'room') { const [wx, wy] = WP(x0 + .5, y0 + .5); drawSprite(ctx, getSprite(V.ghost.kind, V.ghost.key), wx, wy, 1, .78); }
  }
  const sel = V.selected && ACT.get(V.selected) && (ACT.get(V.selected).z || 0) === Z ? ACT.get(V.selected) : null;
  [sel, V.hoverActor && ACT.get(V.hoverActor)].forEach((a, i) => { if (!a) return; const [x, y] = WP(a.x, a.y); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    [[36, .35, 5], [32, .95, 1.8]].forEach(([r, al, lw]) => { ctx.beginPath(); ctx.ellipse(x, y, r * a.sc, r * .5 * a.sc, 0, 0, 7); ctx.strokeStyle = `rgba(255,${i ? 230 : 196},${i ? 160 : 90},${al * (i ? .6 : 1)})`; ctx.lineWidth = lw / CAM.s; ctx.stroke(); });
    if (!i) for (let k = 0; k < 3; k++) { const an = t / 700 + k * 2.09, sx = x + Math.cos(an) * 32 * a.sc, sy = y + Math.sin(an) * 16 * a.sc; star(sx, sy, 5); }
    ctx.restore(); });
  V.flash = V.flash.filter(f => t - f.t < 650); V.flash.forEach(f => { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = (1 - (t - f.t) / 650) * .7; f.cells.forEach(([x, y]) => { path(ctx, footprint({ x, y, w: 1, h: 1 })); ctx.fillStyle = 'rgba(255,230,180,.6)'; ctx.fill(); }); ctx.restore(); });
  S.rooms.filter(r => !r.built && zOf(r) === Z).forEach(r => { const [x, y] = WP(r.x + r.w / 2, r.y + r.h / 2); clockAt(x, y - 120, 24, ROOMS[r.t].clock, r.prog); });
  if (COOP.role) drawPeersWorld(t);
  screenXf();
  if (V.hover && !V.ghost && !V.hoverActor) { const r = roomAt(V.hover[0], V.hover[1]); if (r && !isHall(r)) { const [sx, sy] = toScreen(...WP(r.x + r.w / 2, r.y + r.h / 2)); tag(sx, sy + 10, ROOMS[r.t].name); } }
  [...[...ACT.values()].filter(a => (a.z || 0) === Z), ...(Z === 0 ? HEROS : [])].forEach(a => {
    const [sx, sy] = toScreen(...WP(a.x, a.y)), top = sy - 112 * CAM.s * a.sc;
    if (a.badge) { ctx.font = `${Math.round(clamp(15 * CAM.s * 1.6, 11, 18))}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(a.badge, sx + 20 * CAM.s, top + 4); }
    if (a.bubble && t < a.bubble.until) bubble(sx, top - 6, a.bubble.text);
  });
  if (V.courage != null && HEROS.length) { const a = HEROS[0], [sx, sy] = toScreen(...WP(a.x, a.y)); tag(sx, sy - 128 * CAM.s - 18, `Courage ${V.courage}`, '#ffb4a0'); }
  V.fx = V.fx.filter(f => t - f.t0 < 1500);
  V.fx.forEach(f => { const k = (t - f.t0) / 1500, [sx, sy] = toScreen(...WP(f.x, f.y)); ctx.globalAlpha = Math.min(1, (1 - k) * 2); ctx.font = `800 ${Math.round(clamp(30 * CAM.s, 14, 22))}px "Grenze Gotisch", Georgia, serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = 4; ctx.strokeStyle = '#1a100c'; ctx.strokeText(f.text, sx, sy - 70 * CAM.s - k * 40); ctx.fillStyle = f.col || '#fff1d0'; ctx.fillText(f.text, sx, sy - 70 * CAM.s - k * 40); ctx.globalAlpha = 1; });
  if (COOP.role) drawPeersScreen(t);
}
function drawDebug(t) {
  V.fpsN = (V.fpsN || 0) + 1; if (!V.fpsT || t - V.fpsT > 1000) { V.fps = V.fpsN; V.fpsN = 0; V.fpsT = t; }
  if (!(TUNE.dbgGrid || TUNE.dbgDoors || TUNE.dbgLights || TUNE.fps)) return;
  worldXf(); ctx.save(); ctx.lineWidth = 1 / CAM.s;
  if (TUNE.dbgGrid) { ctx.strokeStyle = 'rgba(120,220,255,.45)'; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { path(ctx, footprint({ x, y, w: 1, h: 1 })); ctx.stroke(); const r = roomAt(x, y); if (r && r.built) { const [cx, cy] = WP(x + .5, y + .5); ctx.fillStyle = 'rgba(120,220,255,.35)'; ctx.beginPath(); ctx.arc(cx, cy, 4 / CAM.s, 0, 7); ctx.fill(); } } }
  if (TUNE.dbgDoors) doors().forEach(k => { const [x1, y1, x2, y2] = k.split(',').map(Number), [cx, cy] = WP((x1 + x2) / 2 + .5, (y1 + y2) / 2 + .5); ctx.fillStyle = '#7dff8a'; ctx.beginPath(); ctx.arc(cx, cy, 6 / CAM.s, 0, 7); ctx.fill(); });
  if (TUNE.dbgLights) lightList(t).forEach(l => { const [x, y] = WP(l.x, l.y), r = l.r * 128 * TUNE.lightScale; ctx.strokeStyle = `rgba(${LCOL[l.col] || '255,255,255'},.8)`; ctx.beginPath(); ctx.ellipse(x, y, r, r * .62, 0, 0, 7); ctx.stroke(); });
  ctx.restore(); screenXf();
  if (TUNE.dbgGrid) { ctx.font = '10px monospace'; ctx.fillStyle = 'rgba(200,240,255,.9)'; ctx.textAlign = 'center'; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const [sx, sy] = toScreen(...WP(x + .5, y + .5)); ctx.fillText(x + ',' + y, sx, sy + 12); } }
  if (TUNE.fps) { ctx.font = '700 13px monospace'; ctx.fillStyle = '#9dff9d'; ctx.textAlign = 'left'; ctx.fillText(`${V.fps || 0} i/s · ${V.lights.length} lumières · ${V.parts.length} particules · zoom ${CAM.s.toFixed(2)}`, 12, V.h - 12); }
}
function star(x, y, r) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, rr2 = i % 2 ? r * .35 : r; ctx.lineTo(x + Math.cos(a) * rr2 / CAM.s * .9, y + Math.sin(a) * rr2 / CAM.s * .9); } ctx.closePath(); ctx.fillStyle = 'rgba(255,236,170,.95)'; ctx.fill(); }
function clockAt(x, y, r, n, f) {
  ctx.save(); ctx.globalCompositeOperation = 'source-over';
  ctx.beginPath(); ctx.arc(x, y, r + 5, 0, 7); ctx.fillStyle = '#1e1410'; ctx.fill(); ctx.strokeStyle = '#c99a4a'; ctx.lineWidth = 2.4; ctx.stroke();
  for (let i = 0; i < n; i++) { const a0 = i / n * Math.PI * 2 - Math.PI / 2, a1 = (i + 1) / n * Math.PI * 2 - Math.PI / 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r, a0, a1); ctx.closePath(); ctx.fillStyle = i < f ? '#d9542f' : '#3a2a20'; ctx.fill(); ctx.strokeStyle = '#140c08'; ctx.lineWidth = 1.6; ctx.stroke(); }
  ctx.restore();
}
function tag(x, y, text, col = '#f2d48a') {
  ctx.font = '700 15px "Grenze Gotisch", Georgia, serif'; const w = ctx.measureText(text).width + 18, h = 22;
  rr(ctx, x - w / 2, y - h / 2, w, h, 7); ctx.fillStyle = 'rgba(24,16,12,.88)'; ctx.fill(); ctx.strokeStyle = '#b8873c'; ctx.lineWidth = 1.4; ctx.stroke();
  ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, y + 1);
}
function bubble(sx, sy, text) {
  ctx.font = '17px "Patrick Hand", "Comic Sans MS", cursive';
  const words = text.split(' '), lines = []; let cur = '';
  words.forEach(wd => { const tt = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tt).width > 190 && cur) { lines.push(cur); cur = wd; } else cur = tt; }); if (cur) lines.push(cur);
  const lh = 18, bw = Math.max(...lines.map(l => ctx.measureText(l).width)) + 18, bh = lines.length * lh + 10;
  const bx = clamp(sx - bw / 2, 6, V.w - bw - 6), by = sy - bh - 10;
  ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(bx, by, bw, bh, 10); else ctx.rect(bx, by, bw, bh); ctx.moveTo(sx - 6, by + bh); ctx.lineTo(sx, by + bh + 9); ctx.lineTo(sx + 6, by + bh);
  ctx.fillStyle = '#fbf3e0'; ctx.fill(); ctx.strokeStyle = '#2a1c16'; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = '#2a1c16'; ctx.textAlign = 'left'; ctx.textBaseline = 'top'; lines.forEach((l, i) => ctx.fillText(l, bx + 9, by + 5 + i * lh));
}

/* ---------- vie des créatures ---------- */
async function walkPath(a, p, ms = 430) {
  const tok = ++a.tok; a.walking = true; a.jx = (Math.random() - .5) * .44; a.jy = (Math.random() - .5) * .44;
  for (let i = 1; i < p.length; i++) { if (tok !== a.tok) return false; const last = i === p.length - 1; await moveTo(a, p[i][0] + .5 + (last ? a.jx : 0), p[i][1] + .5 + (last ? a.jy : 0), ms); }
  if (tok === a.tok) a.walking = false; return tok === a.tok;
}
const cellOf = a => [Math.floor(a.x), Math.floor(a.y)];
const randCell = r => { const c = cellsOf(r); return c[rnd(c.length)]; };
function wanderOnce(a, force) {
  const c = S.creatures.find(x => x.id === a.id); if (!c || a.walking || a.leaving || a.dur) return;
  if (!force && Math.random() > .3) return;
  const z = a.z || 0;
  withZ(z, () => {
    const [cx, cy] = cellOf(a), here = roomAt(cx, cy);
    if (!here || !here.built) { const root = z === 0 ? heartRoom() : floorRoot(z); if (!root) a.z = 0; const [x, y] = randCell(root || heartRoom()); a.x = x + .5; a.y = y + .5; return; }
    if (!force && rstat(here, 'beds') && Math.random() < .2) { if (z === Z) floatText(a.x, a.y - .2, 'z', '#cfe0ff'); return; }
    const post = c.post && S.rooms.find(r => r.id === c.post && r.built);
    const rooms = builtRooms().filter(r => !isHall(r) && !ROOMS[r.t].stairs && zOf(r) === z);
    const room = post || (Math.random() < .45 || !rooms.length ? (z === 0 ? heartRoom() : pick(rooms) || floorRoot(z)) : pick(rooms));
    if (zOf(room) !== z) {
      // changer d'étage : on file à l'escalier, on le prend, et la balade continue à l'étage d'à côté
      const dir = zOf(room) > z ? 1 : -1, st = stairsToward(z, dir);
      if (!st) { a.z = zOf(room); const [x, y] = randCell(room); a.x = x + .5; a.y = y + .5; return; }
      if (cx === st.x && cy === st.y) { a.z = z + dir; return; }
      const p = bfs([cx, cy], (x, y) => x === st.x && y === st.y);
      if (p && p.length > 1) walkPath(a, p).then(ok => { if (ok) a.z = z + dir; }); else a.z = z + dir;
      return;
    }
    const target = randCell(room), p = bfs([cx, cy], (x, y) => x === target[0] && y === target[1]);
    if (p && p.length > 1) walkPath(a, p);
    else if (p) moveTo(a, cx + .5 + (Math.random() - .5) * .5, cy + .5 + (Math.random() - .5) * .5, 600);
  });
}
function moodBadge(c) { if (c.tempt) return '👀'; if (c.quest && c.quest.st === 'done') return '✨'; if (c.quest && c.quest.st === 'offered') return '❗'; return c.mood >= 5 ? '💗' : c.mood <= 0 ? '💢' : c.mood === 1 ? '💧' : ''; }
function syncActors() {
  const here = new Set(S.creatures.filter(c => !c.raid).map(c => c.id));
  for (const [id, a] of ACT) if (!here.has(id) && !a.leaving) { a.tok++; ACT.delete(id); }
  for (const c of S.creatures) {
    if (c.raid) continue;
    let a = ACT.get(c.id);
    if (!a) {
      if (c.isNew || c.back) {
        delete c.isNew; delete c.back;
        a = newActor(c.id, 'char', c.sp, GATE.x + .5, H + 1.6); ACT.set(c.id, a);
        (async () => { a.walking = true; await moveTo(a, GATE.x + .5, GATE.y + .5, 1100); a.walking = false; wanderOnce(a, true); })();
      } else { const post = c.post && S.rooms.find(r => r.id === c.post && r.built), home = post || heartRoom(), [x, y] = randCell(home); a = newActor(c.id, 'char', c.sp, x + .5 + (Math.random() - .5) * .4, y + .5 + (Math.random() - .5) * .4); a.z = zOf(home); ACT.set(c.id, a); }
    }
    a.badge = moodBadge(c);
  }
}
async function critterLeave(id) {
  const a = ACT.get(id); if (!a) return;
  if (a.z) { ACT.delete(id); return; }
  a.leaving = true; a.tok++; a.dur = 0;
  const p = bfs(cellOf(a), (x, y) => x === GATE.x && y === GATE.y);
  if (p) await walkPath(a, p, 260);
  a.walking = true; await moveTo(a, GATE.x + .5, H + 1.6, 800); a.alpha = 0; await sleep(150); ACT.delete(id);
}
function say(id, text, ms = 2800) { const a = ACT.get(id) || HEROS.find(h => h.id === id); if (a) a.bubble = { text, until: performance.now() + ms }; }
function floatText(x, y, text, col) { V.fx.push({ x, y, text, col, t0: performance.now() }); }
function pickActor(sx, sy) {
  const arr = [...ACT.values()].filter(a => !a.leaving && (a.z || 0) === Z).sort((p, q) => (q.x + q.y) - (p.x + p.y));
  for (const a of arr) { const [px, py] = toScreen(...WP(a.x, a.y)), k = CAM.s * a.sc; if (sx > px - 30 * k && sx < px + 30 * k && sy > py - 110 * k && sy < py + 10 * k) return a; }
  return null;
}
let lastFrame = 0;
function loop(now) {
  requestAnimationFrame(loop);
  if (document.hidden || now - lastFrame < 30) return;
  lastFrame = now; resize();
  try { drawScene(now); } catch (e) { if (!V.err) { V.err = 1; console.error(e); } }
}
setInterval(() => { if (!document.hidden && S) ACT.forEach(a => wanderOnce(a)); }, 900);
// filet de sécurité : si l'animation est suspendue (onglet en arrière-plan, aperçu), on redessine quand même de temps en temps
setInterval(() => { const now = performance.now(); if (S && !document.hidden && now - lastFrame > 240) { lastFrame = now; resize(); try { drawScene(now); } catch (e) {} } }, 250);
