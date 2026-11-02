
/* =========================================================
   Textures peintes procédurales (dessinées vues de dessus,
   puis projetées en isométrique par le moteur de rendu)
   ========================================================= */
function mk(w, h) { const c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function seedOf(s) { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function hex2(c) { const n = parseInt(c.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
function rgbHex(r, g, b) { return '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
function shade(c, f) {
  if (typeof c !== 'string' || c[0] !== '#') return c;
  let [r, g, b] = hex2(c);
  if (f >= 0) { r += (255 - r) * f; g += (255 - g) * f; b += (255 - b) * f; } else { r *= 1 + f; g *= 1 + f; b *= 1 + f; }
  return rgbHex(r, g, b);
}
function mixc(a, b, t) { const A = hex2(a), B = hex2(b); return rgbHex(A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t, A[2] + (B[2] - A[2]) * t); }
function hash(x, y, i = 0) { const s = Math.sin(x * 127.1 + y * 311.7 + i * 74.7) * 43758.5453; return s - Math.floor(s); }
function rr(g, x, y, w, h, r) { g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, h, r); else g.rect(x, y, w, h); }

function noiseCanvas(w, h, seed) {
  const R = rng(seed), c = mk(w, h), g = c.getContext('2d'), id = g.createImageData(c.width, c.height);
  for (let i = 0; i < c.width * c.height; i++) { const v = R() * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = v; id.data[i * 4 + 3] = 255; }
  g.putImageData(id, 0, 0); return c;
}
// grain organique : bruit à plusieurs échelles mélangé en « overlay »
function grunge(g, w, h, seed, amt = .22, cells = [90, 26, 6]) {
  g.save(); g.imageSmoothingEnabled = true; g.globalCompositeOperation = 'overlay';
  cells.forEach((cell, i) => { const n = noiseCanvas(Math.ceil(w / cell) + 3, Math.ceil(h / cell) + 3, seed + i * 977); g.globalAlpha = amt * (i === 2 ? .55 : 1); g.drawImage(n, -cell, -cell, n.width * cell, n.height * cell); });
  g.restore();
}
function edgeAO(g, w, h, d, a = .42) {
  [[0, 0, 0, d, 0, 0, w, d], [0, h, 0, h - d, 0, h - d, w, d], [0, 0, d, 0, 0, 0, d, h], [w, 0, w - d, 0, w - d, 0, d, h]].forEach(([x0, y0, x1, y1, rx, ry, rw, rh]) => {
    const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, `rgba(10,5,2,${a})`); gr.addColorStop(1, 'rgba(10,5,2,0)'); g.fillStyle = gr; g.fillRect(rx, ry, rw, rh);
  });
}

/* ---------- sols ---------- */
function texWood(wt, ht, T, seed, base = '#7e4f2e') {
  const Wp = Math.round(wt * T), Hp = Math.round(ht * T), c = mk(Wp, Hp), g = c.getContext('2d'), R = rng(seed), pw = T / 4;
  g.fillStyle = '#26150c'; g.fillRect(0, 0, Wp, Hp);
  for (let y = 0; y < Hp; y += pw) {
    let x = -R() * T * .8;
    while (x < Wp) {
      const len = T * (.9 + R() * 1.5), col = shade(base, (R() - .5) * .26);
      const gr = g.createLinearGradient(0, y, 0, y + pw); gr.addColorStop(0, shade(col, .1)); gr.addColorStop(.6, col); gr.addColorStop(1, shade(col, -.14));
      g.fillStyle = gr; g.fillRect(x + .8, y + .9, len - 1.6, pw - 1.8);
      g.save(); g.beginPath(); g.rect(x, y, len, pw); g.clip();
      for (let k = 0; k < 7; k++) {
        const yy = y + R() * pw, amp = .5 + R() * 1.5, ph = R() * 6, fr = .03 + R() * .04;
        g.beginPath(); for (let xx = x; xx <= x + len + 6; xx += 6) g.lineTo(xx, yy + Math.sin(xx * fr + ph) * amp);
        g.strokeStyle = R() < .6 ? `rgba(45,22,8,${.1 + R() * .12})` : `rgba(255,222,170,${.05 + R() * .08})`; g.lineWidth = .5 + R() * 1; g.stroke();
      }
      if (R() < .3) { const kx = x + len * (.2 + R() * .6), ky = y + pw * (.3 + R() * .4); for (let q = 3; q > 0; q--) { g.beginPath(); g.ellipse(kx, ky, q * 2.8, q * 1.2, 0, 0, 7); g.strokeStyle = `rgba(40,18,6,${.14 + .1 * q})`; g.lineWidth = .9; g.stroke(); } }
      g.restore();
      [[x + 5, y + pw * .28], [x + 5, y + pw * .72]].forEach(([nx, ny]) => { g.fillStyle = 'rgba(28,20,16,.85)'; g.beginPath(); g.arc(nx, ny, 1.4, 0, 7); g.fill(); g.fillStyle = 'rgba(255,230,190,.35)'; g.beginPath(); g.arc(nx - .5, ny - .5, .6, 0, 7); g.fill(); });
      x += len;
    }
  }
  grunge(g, Wp, Hp, seed, .2);
  return c;
}
function texFlag(wt, ht, T, seed, base = '#77716a', moss = false) {
  const Wp = Math.round(wt * T), Hp = Math.round(ht * T), c = mk(Wp, Hp), g = c.getContext('2d'), R = rng(seed), rh = T / 2.4;
  g.fillStyle = shade(base, -.6); g.fillRect(0, 0, Wp, Hp);
  for (let y = 0; y < Hp; y += rh) {
    let x = -R() * T * .4;
    while (x < Wp) {
      const sw = T * (.32 + R() * .45), col = shade(base, (R() - .5) * .26), gx = x + 1.6, gy = y + 1.6, gw = sw - 3.2, gh = rh - 3.2;
      rr(g, gx, gy, gw, gh, 3 + R() * 4);
      const gr = g.createLinearGradient(gx, gy, gx + gw, gy + gh); gr.addColorStop(0, shade(col, .14)); gr.addColorStop(1, shade(col, -.14)); g.fillStyle = gr; g.fill();
      g.lineWidth = 1.1; g.strokeStyle = 'rgba(255,245,225,.16)'; g.beginPath(); g.moveTo(gx + 2, gy + gh - 3); g.lineTo(gx + 2, gy + 2); g.lineTo(gx + gw - 3, gy + 2); g.stroke();
      g.strokeStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.moveTo(gx + gw - 1.5, gy + 3); g.lineTo(gx + gw - 1.5, gy + gh - 1.5); g.lineTo(gx + 3, gy + gh - 1.5); g.stroke();
      if (R() < .25) { let px = gx + gw * R(), py = gy + gh * R(); g.beginPath(); g.moveTo(px, py); for (let k = 0; k < 4; k++) { px += (R() - .5) * 14; py += (R() - .3) * 9; g.lineTo(px, py); } g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = .8; g.stroke(); }
      for (let k = 0; k < 5; k++) { g.fillStyle = `rgba(${R() < .5 ? '0,0,0' : '255,250,240'},.12)`; g.fillRect(gx + R() * gw, gy + R() * gh, 1.5, 1.5); }
      x += sw;
    }
  }
  if (moss) for (let i = 0; i < Wp * Hp / 700; i++) { g.fillStyle = `rgba(${80 + R() * 40},${120 + R() * 40},${50 + R() * 20},${.25 + R() * .3})`; g.beginPath(); g.arc(R() * Wp, R() * Hp, 1 + R() * 3, 0, 7); g.fill(); }
  grunge(g, Wp, Hp, seed, .22);
  return c;
}
function texChecker(wt, ht, T, seed, c1, c2) {
  const Wp = Math.round(wt * T), Hp = Math.round(ht * T), c = mk(Wp, Hp), g = c.getContext('2d'), R = rng(seed), s = T / 2;
  g.fillStyle = '#2a221d'; g.fillRect(0, 0, Wp, Hp);
  for (let j = 0; j * s < Hp; j++) for (let i = 0; i * s < Wp; i++) {
    const col = shade((i + j) % 2 ? c1 : c2, (R() - .5) * .1), x = i * s + 1.5, y = j * s + 1.5, w = s - 3;
    const gr = g.createLinearGradient(x, y, x + w, y + w); gr.addColorStop(0, shade(col, .16)); gr.addColorStop(.5, col); gr.addColorStop(1, shade(col, -.12));
    g.fillStyle = gr; g.fillRect(x, y, w, w);
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(x + 2, y + 2, w * .5, 1.6);
    if (R() < .15) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x + R() * w, y + R() * w, 1 + R() * 2.5, 0, 7); g.fill(); }
  }
  grunge(g, Wp, Hp, seed, .18);
  return c;
}
function texSoil(wt, ht, T, seed) {
  const Wp = Math.round(wt * T), Hp = Math.round(ht * T), c = mk(Wp, Hp), g = c.getContext('2d'), R = rng(seed);
  g.fillStyle = '#5a3a22'; g.fillRect(0, 0, Wp, Hp);
  const rw = T / 4;
  for (let x = rw / 2; x < Wp; x += rw) { const gr = g.createLinearGradient(x - rw / 2, 0, x + rw / 2, 0); gr.addColorStop(0, 'rgba(25,12,5,.55)'); gr.addColorStop(.5, 'rgba(140,95,60,.35)'); gr.addColorStop(1, 'rgba(25,12,5,.55)'); g.fillStyle = gr; g.fillRect(x - rw / 2, 0, rw, Hp); }
  for (let i = 0; i < Wp * Hp / 60; i++) { g.fillStyle = `rgba(${R() < .5 ? '30,15,5' : '160,120,80'},${.2 + R() * .3})`; g.fillRect(R() * Wp, R() * Hp, 1.5, 1.5); }
  for (let i = 0; i < Wp * Hp / 900; i++) { const x = Math.round(R() * (Wp / rw - .5)) * rw + rw / 2, y = R() * Hp; g.fillStyle = '#6aa04a'; g.beginPath(); g.ellipse(x - 2, y, 3, 1.6, -.5, 0, 7); g.ellipse(x + 2, y, 3, 1.6, .5, 0, 7); g.fill(); }
  g.strokeStyle = '#5b3a20'; g.lineWidth = 6; g.strokeRect(3, 3, Wp - 6, Hp - 6); g.strokeStyle = '#8a5a32'; g.lineWidth = 3; g.strokeRect(3, 3, Wp - 6, Hp - 6);
  grunge(g, Wp, Hp, seed, .2);
  return c;
}
function texCobble(Wp, Hp, T, seed, inside) {
  const c = mk(Wp, Hp), g = c.getContext('2d'), R = rng(seed), s = T / 5.2;
  g.fillStyle = '#2b2a27'; g.fillRect(0, 0, Wp, Hp);
  for (let y = 0, row = 0; y < Hp + s; y += s * .86, row++) for (let x = (row % 2) * s / 2 - s; x < Wp + s; x += s) {
    if (!inside(x, y)) continue;
    const rx = s * (.38 + R() * .12), ry = s * (.32 + R() * .1), cx = x + (R() - .5) * 3, cy = y + (R() - .5) * 3, col = shade('#6f695f', (R() - .5) * .3);
    const gr = g.createRadialGradient(cx - rx * .35, cy - ry * .4, 1, cx, cy, Math.max(rx, ry) * 1.2); gr.addColorStop(0, shade(col, .2)); gr.addColorStop(1, shade(col, -.25));
    g.fillStyle = gr; g.beginPath(); g.ellipse(cx, cy, rx, ry, R() * .6 - .3, 0, 7); g.fill();
  }
  for (let i = 0; i < Wp * Hp / 1400; i++) { const x = R() * Wp, y = R() * Hp; if (!inside(x, y)) continue; g.strokeStyle = `rgba(${90 + R() * 40},${130 + R() * 30},${55},.55)`; g.lineWidth = 1.2; for (let k = 0; k < 4; k++) { g.beginPath(); g.moveTo(x + k * 2, y); g.lineTo(x + k * 2 + (R() - .5) * 4, y - 4 - R() * 4); g.stroke(); } }
  return c;
}
function texGrass(Wp, Hp, seed) {
  const c = mk(Wp, Hp), g = c.getContext('2d'), R = rng(seed);
  g.fillStyle = '#34512a'; g.fillRect(0, 0, Wp, Hp);
  grunge(g, Wp, Hp, seed, .35, [140, 40, 8]);
  for (let i = 0; i < Wp * Hp / 55; i++) { const x = R() * Wp, y = R() * Hp, l = 3 + R() * 5; g.strokeStyle = R() < .5 ? `rgba(110,160,70,${.3 + R() * .3})` : `rgba(20,40,15,${.3 + R() * .3})`; g.lineWidth = .9; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - .5) * 3, y - l); g.stroke(); }
  for (let i = 0; i < Wp * Hp / 5000; i++) { g.fillStyle = ['#f3e9c8', '#f5d23a', '#e98aa6', '#a9c8f0'][Math.floor(R() * 4)]; g.beginPath(); g.arc(R() * Wp, R() * Hp, 1.6, 0, 7); g.fill(); }
  return c;
}
function carpet(g, x, y, w, h, col, seed) {
  const R = rng(seed);
  g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 8; rr(g, x, y, w, h, 6); g.fillStyle = shade(col, -.35); g.fill(); g.restore();
  rr(g, x + 6, y + 6, w - 12, h - 12, 4); g.fillStyle = '#d9a441'; g.fill();
  rr(g, x + 10, y + 10, w - 20, h - 20, 3); g.fillStyle = col; g.fill();
  g.save(); rr(g, x + 10, y + 10, w - 20, h - 20, 3); g.clip();
  const st = 26; g.strokeStyle = shade(col, .25); g.lineWidth = 2;
  for (let i = -h; i < w + h; i += st) { g.beginPath(); g.moveTo(x + i, y); g.lineTo(x + i + h, y + h); g.moveTo(x + i + h, y); g.lineTo(x + i, y + h); g.stroke(); }
  g.fillStyle = shade(col, -.25); g.beginPath(); g.ellipse(x + w / 2, y + h / 2, Math.min(w, h) * .22, Math.min(w, h) * .16, 0, 0, 7); g.fill();
  g.fillStyle = '#d9a441'; g.beginPath(); g.ellipse(x + w / 2, y + h / 2, Math.min(w, h) * .12, Math.min(w, h) * .08, 0, 0, 7); g.fill();
  g.restore();
  g.strokeStyle = '#e8d7a8'; g.lineWidth = 1.4; for (let i = x + 8; i < x + w - 8; i += 5) { g.beginPath(); g.moveTo(i, y); g.lineTo(i + (R() - .5) * 2, y - 6); g.moveTo(i, y + h); g.lineTo(i + (R() - .5) * 2, y + h + 6); g.stroke(); }
  grunge(g, w, h, seed + 5, .1);
}
function straw(g, Wp, Hp, seed) {
  const R = rng(seed);
  for (let i = 0; i < Wp * Hp / 160; i++) { const x = R() * Wp, y = R() * Hp, a = R() * 6, l = 5 + R() * 9; g.strokeStyle = `rgba(${220 + R() * 30},${180 + R() * 40},${80 + R() * 40},${.55 + R() * .35})`; g.lineWidth = .9 + R() * .6; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
}
function runes(g, cx, cy, r) {
  g.save(); g.strokeStyle = 'rgba(190,160,255,.55)'; g.lineWidth = 2.4;
  [1, .78].forEach(k => { g.beginPath(); g.arc(cx, cy, r * k, 0, 7); g.stroke(); });
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2, x = cx + Math.cos(a) * r * .89, y = cy + Math.sin(a) * r * .89; g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(-5, -4); g.lineTo(0, 5); g.lineTo(5, -4); g.moveTo(0, -6); g.lineTo(0, 2); g.stroke(); g.restore(); }
  g.beginPath(); for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2 - Math.PI / 2; g.lineTo(cx + Math.cos(a) * r * .7, cy + Math.sin(a) * r * .7); } g.closePath(); g.stroke();
  g.restore();
}

/* ---------- textures des pièces (cache) ---------- */
const TEXT = 150;              // pixels de texture par case
const FLOOR_CACHE = new Map();
function roomTexture(r) {
  const key = `${r.id}:${r.t}:${r.w}x${r.h}`;
  if (FLOOR_CACHE.has(key)) return FLOOR_CACHE.get(key);
  const d = ROOMS[r.t], T = TEXT, seed = seedOf(r.id + r.t), Wp = r.w * T, Hp = r.h * T;
  let c;
  if (d.floor === 'wood') c = texWood(r.w, r.h, T, seed, '#7e4d2c');
  else if (d.floor === 'straw') { c = texWood(r.w, r.h, T, seed, '#8a6342'); straw(c.getContext('2d'), Wp, Hp, seed); }
  else if (d.floor === 'checker') c = texChecker(r.w, r.h, T, seed, shade(d.color, -.15), '#e8dcc2');
  else if (d.floor === 'carpet') { c = texWood(r.w, r.h, T, seed, '#6b4228'); carpet(c.getContext('2d'), T * .32, T * .32, Wp - T * .64, Hp - T * .64, shade(d.color, -.1), seed); }
  else if (d.floor === 'garden') c = texSoil(r.w, r.h, T, seed);
  else if (d.floor === 'magic') { c = texFlag(r.w, r.h, T, seed, '#3d3652'); runes(c.getContext('2d'), Wp / 2, Hp / 2, Math.min(Wp, Hp) * .4); }
  else c = texFlag(r.w, r.h, T, seed, r.t === 'couloir' || r.t === 'porche' ? '#6e6962' : '#76706a', r.t === 'caveau' || r.t === 'oubliettes');
  edgeAO(c.getContext('2d'), Wp, Hp, T * .2, isHall(r) ? .3 : .45);
  FLOOR_CACHE.set(key, c); return c;
}

/* ---------- terrain : cour pavée intérieure, herbe et route dehors ---------- */
const TERRAIN_M = 3, TERRAIN_T = 80;
let TERRAIN = null;
function terrainTexture() {
  if (TERRAIN) return TERRAIN;
  const M = TERRAIN_M, T = TERRAIN_T, Wp = (W + 2 * M) * T, Hp = (H + 2 * M) * T;
  const c = texGrass(Wp, Hp, 77), g = c.getContext('2d'), R = rng(91);
  const inside = (x, y) => x > M * T - 4 && x < (M + W) * T + 4 && y > M * T - 4 && y < (M + H) * T + 4;
  g.drawImage(texCobble(Wp, Hp, T, 33, inside), 0, 0);
  // route depuis le porche
  const rx = (M + GATE.x) * T, ry = (M + H) * T;
  g.save(); g.beginPath(); g.moveTo(rx - 4, ry); g.bezierCurveTo(rx - 10, ry + T, rx + T * .4, ry + T * 2, rx + T * .1, Hp); g.lineTo(rx + T * 1.2, Hp); g.bezierCurveTo(rx + T * 1.4, ry + T * 2, rx + T * 1.1, ry + T, rx + T + 4, ry); g.closePath();
  g.fillStyle = '#7a5a3a'; g.fill(); g.clip(); grunge(g, Wp, Hp, 12, .35); for (let i = 0; i < 160; i++) { g.fillStyle = `rgba(${R() < .5 ? '40,25,12' : '170,140,100'},.4)`; g.beginPath(); g.arc(rx - 10 + R() * T * 1.4, ry + R() * T * M, 1 + R() * 2, 0, 7); g.fill(); } g.restore();
  // brume vers les bords
  const fog = g.createRadialGradient(Wp / 2, Hp / 2, Math.min(Wp, Hp) * .38, Wp / 2, Hp / 2, Math.max(Wp, Hp) * .62); fog.addColorStop(0, 'rgba(8,6,14,0)'); fog.addColorStop(1, 'rgba(8,6,14,.92)');
  g.fillStyle = fog; g.fillRect(0, 0, Wp, Hp);
  TERRAIN = c; return c;
}

/* ---------- murs en pierre de taille ---------- */
const WALL_CACHE = new Map();
function texWall(kind, k) {
  const key = kind + k; if (WALL_CACHE.has(key)) return WALL_CACHE.get(key);
  const R = rng(seedOf(key)), Wp = 144, Hp = kind === 'ramp' ? 264 : kind === 'full' ? 176 : 48;
  const c = mk(Wp, Hp), g = c.getContext('2d');
  if (kind === 'hedge') {
    g.fillStyle = '#2f4a22'; g.fillRect(0, 0, Wp, Hp);
    for (let i = 0; i < 260; i++) { const x = R() * Wp, y = R() * Hp, col = mixc('#3d6a2c', '#8ac260', R() * (1 - y / Hp * .7)); g.fillStyle = col; g.beginPath(); g.ellipse(x, y, 4 + R() * 3, 2.5 + R() * 2, R() * 3, 0, 7); g.fill(); }
  } else {
    const base = kind === 'ramp' ? '#6f6a64' : '#837b70', bh = kind === 'low' ? 24 : 34;
    g.fillStyle = shade(base, -.6); g.fillRect(0, 0, Wp, Hp);
    for (let y = 0, row = 0; y < Hp; y += bh, row++) {
      let x = row % 2 ? -R() * 40 : -R() * 20;
      while (x < Wp) {
        const bw = 34 + R() * 34, col = shade(base, (R() - .5) * .28 - (y / Hp) * .12);
        rr(g, x + 1.5, y + 1.5, bw - 3, bh - 3, 3);
        const gr = g.createLinearGradient(0, y, 0, y + bh); gr.addColorStop(0, shade(col, .16)); gr.addColorStop(1, shade(col, -.16)); g.fillStyle = gr; g.fill();
        g.fillStyle = 'rgba(255,248,230,.12)'; g.fillRect(x + 3, y + 2.5, bw - 7, 2);
        if (R() < .2) { g.fillStyle = 'rgba(0,0,0,.25)'; g.beginPath(); g.arc(x + R() * bw, y + R() * bh, 2 + R() * 3, 0, 7); g.fill(); }
        x += bw;
      }
    }
    if (kind !== 'low') for (let i = 0; i < 40; i++) { g.fillStyle = `rgba(${70 + R() * 30},${110 + R() * 30},50,${.2 + R() * .3})`; g.beginPath(); g.arc(R() * Wp, Hp - R() * R() * Hp * .5, 1 + R() * 3, 0, 7); g.fill(); }
    grunge(g, Wp, Hp, seedOf(key), .22, [60, 18, 5]);
    const ao = g.createLinearGradient(0, Hp * .55, 0, Hp); ao.addColorStop(0, 'rgba(0,0,0,0)'); ao.addColorStop(1, 'rgba(0,0,0,.45)'); g.fillStyle = ao; g.fillRect(0, 0, Wp, Hp);
  }
  WALL_CACHE.set(key, c); return c;
}
