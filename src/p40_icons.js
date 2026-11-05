
/* =========================================================
   Des icônes dessinées au pinceau, comme les stickers (contour
   d'encre, dégradés), à la place des émojis : types de cartes,
   armes, éléments, intentions des ennemis, états, salles du
   donjon, reliques, boutons.
   ========================================================= */
{
  const TAU = Math.PI * 2;
  const star = (g, cx, cy, n, r1, r2, rot, col, lw = 1.1) => { const p = []; for (let i = 0; i < n * 2; i++) { const a = rot + i * Math.PI / n, r = i % 2 ? r2 : r1; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } poly(g, p, col, lw); };
  const shape = (g, f, col, lw = 1.2) => { g.beginPath(); f(); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = lw; g.strokeStyle = outl(typeof col === 'string' ? col : INK); g.lineJoin = 'round'; g.stroke(); };
  const glow = (g, x, y, r, rgb) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${rgb},.55)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); };
  const shine = (g, x, y, rx, ry) => ell(g, x, y, rx, ry, 'rgba(255,255,255,.55)', 0);
  // une épée : lame, garde, poignée, pommeau (dessinée la pointe vers le haut, puis tournée)
  const swordAt = (g, s, rot, tx = 0, ty = 0) => {
    g.save(); g.translate(tx, ty); g.rotate(rot); g.scale(s, s);
    poly(g, [[-3.2, 5], [-3.2, -14], [0, -20], [3.2, -14], [3.2, 5]], '#dfe3ea', 1.1); ln(g, [[0, 4], [0, -15]], 'rgba(120,130,150,.6)', 1);
    rrect(g, -8.5, 4.5, 17, 4, 1.8, '#e9b949', 1); rrect(g, -1.8, 8.4, 3.6, 8, 1.4, '#7a4a28', 1); ball(g, 0, 17.6, 2.6, '#e9b949', 1); g.restore();
  };
  const skullAt = (g, col = '#ece4d2', s = 1, tx = 0, ty = 0) => {
    g.save(); g.translate(tx, ty); g.scale(s, s);
    shape(g, () => { g.arc(0, -3, 13, Math.PI * .85, Math.PI * 2.15); g.lineTo(8, 9); g.lineTo(-8, 9); }, radial(g, 0, -3, 13, col));
    rrect(g, -6.5, 8, 13, 6, 2, col, 1); [-3.2, 0, 3.2].forEach(x => ln(g, [[x, 9], [x, 13]], 'rgba(42,28,22,.7)', .8));
    ell(g, -5, -2, 3.6, 4, INK, 0); ell(g, 5, -2, 3.6, 4, INK, 0); poly(g, [[0, 3], [-1.8, 6], [1.8, 6]], INK, 0); g.restore();
  };
  const flame = (g, s, col1, col2, tx = 0, ty = 0) => {
    g.save(); g.translate(tx, ty); g.scale(s, s);
    g.beginPath(); g.moveTo(0, -18); g.bezierCurveTo(13, -5, 12, 9, 0, 15); g.bezierCurveTo(-12, 9, -13, -3, -5, -11); g.bezierCurveTo(-4, -4, -1, -4, 0, -18); g.fillStyle = radial(g, 0, 4, 15, col1); fi(g, g.fillStyle, 1.2);
    g.beginPath(); g.moveTo(0, -6); g.bezierCurveTo(6, 1, 6, 8, 0, 11); g.bezierCurveTo(-6, 8, -6, 2, 0, -6); g.fillStyle = col2; g.fill(); g.restore();
  };
  const drop = (g, col, s = 1, tx = 0, ty = 0) => { g.save(); g.translate(tx, ty); g.scale(s, s); g.beginPath(); g.moveTo(0, -17); g.bezierCurveTo(9, -5, 13, 3, 12, 7); g.bezierCurveTo(11, 14, 5, 17, 0, 17); g.bezierCurveTo(-5, 17, -11, 14, -12, 7); g.bezierCurveTo(-13, 3, -9, -5, 0, -17); g.fillStyle = radial(g, 0, 6, 13, col); fi(g, g.fillStyle, 1.2); shine(g, -4, 4, 2.2, 4); g.restore(); };
  const heart = (g, col, s = 1, tx = 0, ty = 0) => { g.save(); g.translate(tx, ty); g.scale(s, s); g.beginPath(); g.moveTo(0, 15); g.bezierCurveTo(-19, 1, -14, -17, 0, -7); g.bezierCurveTo(14, -17, 19, 1, 0, 15); g.fillStyle = radial(g, -2, -2, 16, col); fi(g, g.fillStyle, 1.3); shine(g, -7, -6, 3, 2.2); g.restore(); };
  const arrowUp = (g, col, flip) => { g.save(); if (flip) g.scale(1, -1); poly(g, [[0, -18], [13, -3], [5, -3], [5, 15], [-5, 15], [-5, -3], [-13, -3]], col, 1.3); g.restore(); };
  const cloud = (g, col = '#e8eef6') => { [[-9, 3, 8], [9, 3, 8], [0, -3, 11], [-2, 6, 9], [6, 6, 8]].forEach(([x, y, r]) => ball(g, x, y, r, col, 0)); g.beginPath(); [[-9, 3, 8], [9, 3, 8], [0, -3, 11]].forEach(([x, y, r]) => { g.moveTo(x + r, y); g.arc(x, y, r, 0, TAU); }); g.strokeStyle = outl(col); g.lineWidth = 1.1; g.stroke(); [[-9, 3, 8], [9, 3, 8], [0, -3, 11], [-2, 6, 9], [6, 6, 8]].forEach(([x, y, r]) => ball(g, x, y, r - 1.2, col, 0)); };
  const bolt = (g, col = '#ffd84a', s = 1, tx = 0, ty = 0) => { g.save(); g.translate(tx, ty); g.scale(s, s); poly(g, [[3, -19], [-10, 3], [-1, 3], [-5, 19], [10, -4], [1, -4], [6, -19]], col, 1.3); g.restore(); };
  const text = (g, t, x, y, size, col) => { g.font = `900 ${size}px Georgia, serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3; g.strokeStyle = INK; g.strokeText(t, x, y); g.fillStyle = col; g.fillText(t, x, y); };
  Object.assign(ICON_DRAW, {
    // les armes et les types de cartes
    sword: g => swordAt(g, 1, Math.PI / 4),
    swords: g => { swordAt(g, .92, Math.PI / 4); swordAt(g, .92, -Math.PI / 4); },
    shield: g => { shape(g, () => { g.moveTo(-14, -15); g.quadraticCurveTo(0, -19, 14, -15); g.lineTo(14, -3); g.quadraticCurveTo(13, 9, 0, 18); g.quadraticCurveTo(-13, 9, -14, -3); }, radial(g, -3, -6, 18, '#4a7fc4'), 1.4); shape(g, () => { g.moveTo(-9, -11); g.quadraticCurveTo(0, -14, 9, -11); g.lineTo(9, -3); g.quadraticCurveTo(8, 6, 0, 12); g.quadraticCurveTo(-8, 6, -9, -3); }, 'rgba(255,255,255,.12)', 0); inkLn(g, [[0, -14], [0, 15]], '#e9b949', 2.4); inkLn(g, [[-11, -4], [11, -4]], '#e9b949', 2.4); },
    heart: g => heart(g, '#e2475a'),
    spark: g => { glow(g, 0, 0, 19, '190,140,255'); star(g, 0, 0, 4, 18, 5.5, -Math.PI / 2, '#a77be0', 1.2); star(g, 0, 0, 4, 8, 2.5, -Math.PI / 4, '#f3e6ff', 0); },
    legend: g => { glow(g, 0, 1, 20, '255,210,90'); star(g, 0, 1, 5, 18, 7.5, -Math.PI / 2, '#f2c94f', 1.3); shine(g, -4, -4, 3, 2); },
    claw: g => [[-9, 0], [0, -2], [9, 0]].forEach(([x, y]) => inkLn(g, [[x - 5, y - 13], [x - 1, y - 4], [x + 1, y + 6], [x - 1, y + 14]], '#efe6d6', 3)),
    axe: g => { inkLn(g, [[-12, 16], [9, -11]], '#8a5a30', 3.2); shape(g, () => { g.moveTo(2, -16); g.quadraticCurveTo(20, -14, 16, 4); g.lineTo(9, -3); g.lineTo(5, -12); }, radial(g, 10, -8, 12, '#dfe3ea')); },
    hammer: g => { inkLn(g, [[-11, 15], [5, -2]], '#8a5a30', 3.4); g.save(); g.translate(7, -6); g.rotate(-Math.PI / 4); rrect(g, -11, -6, 22, 12, 2.5, '#9aa3b0', 1.3); ln(g, [[-11, -1], [11, -1]], 'rgba(255,255,255,.35)', 1.2); g.restore(); },
    arrow: g => { inkLn(g, [[-13, 13], [9, -9]], '#b07a44', 2.4); poly(g, [[16, -16], [5, -12], [12, -5]], '#dfe3ea', 1.2); poly(g, [[-13, 13], [-18, 11], [-15, 6], [-10, 10]], '#c8413a', 1); poly(g, [[-13, 13], [-11, 18], [-6, 15], [-10, 10]], '#c8413a', 1); },
    slash: g => { shape(g, () => { g.moveTo(-15, 15); g.quadraticCurveTo(-6, -8, 16, -17); g.quadraticCurveTo(2, -4, -9, 17); }, radial(g, 0, 0, 18, '#dfe3ea'), 1.2); ln(g, [[-11, 12], [10, -12]], 'rgba(255,255,255,.6)', 1); rrect(g, -17, 13, 9, 4, 1.5, '#e9b949', 1); },
    // les éléments
    fire: g => flame(g, 1, '#ff7a2a', '#ffd84a'),
    cold: g => { [0, 1, 2].forEach(i => { const a = i * Math.PI / 3; const c = Math.cos(a), s = Math.sin(a); inkLn(g, [[-c * 17, -s * 17], [c * 17, s * 17]], '#bfe6ff', 2.6); [-1, 1].forEach(k => { const ex = c * 10 * k, ey = s * 10 * k; inkLn(g, [[ex, ey], [ex + (c * k * 4 - s * 4), ey + (s * k * 4 + c * 4)]], '#bfe6ff', 1.8); inkLn(g, [[ex, ey], [ex + (c * k * 4 + s * 4), ey + (s * k * 4 - c * 4)]], '#bfe6ff', 1.8); }); }); ball(g, 0, 0, 3.2, '#e8f6ff', 1); },
    bolt: g => { glow(g, 0, 0, 18, '255,220,90'); bolt(g); },
    thunder: g => { [9, 14, 19].forEach((r, i) => { g.beginPath(); g.arc(-8, 0, r, -Math.PI / 3.2, Math.PI / 3.2); g.strokeStyle = INK; g.lineWidth = 4.4 - i * .6; g.stroke(); g.strokeStyle = '#9fd0ff'; g.lineWidth = 2.4 - i * .4; g.stroke(); }); ball(g, -10, 0, 5, '#6f7480', 1.2); },
    acid: g => { drop(g, '#8fdc4a'); ball(g, 9, -10, 3, '#b8f07a', 1); ball(g, -10, -6, 2, '#b8f07a', 1); },
    poison: g => { ball(g, 0, 6, 11, '#62b84a', 1.3); rrect(g, -4, -12, 8, 9, 2, '#d8eef6', 1.1); rrect(g, -5.5, -17, 11, 5, 1.6, '#a8683a', 1.1); skullAt(g, '#f4f0e4', .38, 0, 7); ball(g, 7, -1, 1.8, '#c8f0a0', 0); },
    necro: g => { glow(g, 0, 0, 20, '150,90,220'); skullAt(g, '#d6c8ee'); ell(g, -5, -2, 1.6, 1.8, '#c08aff', 0); ell(g, 5, -2, 1.6, 1.8, '#c08aff', 0); },
    sun: g => { star(g, 0, 0, 12, 19, 12, 0, '#ffd23a', 1.1); ball(g, 0, 0, 10, '#fff1a0', 1.2); shine(g, -3, -3, 3, 2); },
    force: g => { glow(g, 0, 0, 20, '170,140,255'); ball(g, 0, 0, 12, '#8e6ae0', 1.3); star(g, 0, 0, 4, 9, 2.5, -Math.PI / 2, '#f1eaff', 0); shine(g, -4, -5, 3, 2); },
    psy: g => { ball(g, 0, 0, 16, '#f0a8d8', 1.3); g.beginPath(); for (let i = 0; i <= 60; i++) { const a = i / 60 * TAU * 2.2, r = 1 + i / 60 * 11; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } g.strokeStyle = '#7a2a6a'; g.lineWidth = 2; g.stroke(); },
    // les effets et les états
    boom: g => { star(g, 0, 0, 10, 19, 10, .2, '#ff8a3a', 1.3); star(g, 0, 0, 8, 11, 5, 0, '#ffe36a', 0); },
    blood: g => drop(g, '#d23a3a'),
    up: g => arrowUp(g, '#f08a3a'),
    down: g => arrowUp(g, '#8fa0c0', true),
    dizzy: g => { g.beginPath(); for (let i = 0; i <= 50; i++) { const a = i / 50 * TAU * 1.6, r = 2 + i / 50 * 9; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r * .7); } g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke(); g.strokeStyle = '#cfe0ff'; g.lineWidth = 1.8; g.stroke(); [[-13, -10], [13, -8], [0, -17]].forEach(([x, y]) => star(g, x, y, 5, 5.5, 2.4, -Math.PI / 2, '#ffe36a', .9)); },
    ghost: g => { shape(g, () => { g.moveTo(-13, 15); g.lineTo(-13, -3); g.arc(0, -3, 13, Math.PI, 0); g.lineTo(13, 15); g.lineTo(8, 11); g.lineTo(4, 15); g.lineTo(0, 11); g.lineTo(-4, 15); g.lineTo(-8, 11); }, radial(g, -2, -4, 16, '#e8eef8'), 1.3); ell(g, -5, -3, 2.6, 3.6, INK, 0); ell(g, 5, -3, 2.6, 3.6, INK, 0); ell(g, 0, 5, 3, 3.6, INK, 0); },
    horn: g => { shape(g, () => { g.moveTo(-15, 12); g.quadraticCurveTo(-12, -10, 12, -14); g.lineTo(15, -8); g.quadraticCurveTo(-4, -2, -8, 15); }, radial(g, 0, 0, 16, '#efe2c2'), 1.2); [[-11, 6], [-6, -4], [3, -10]].forEach(([x, y]) => ln(g, [[x - 2, y + 3], [x + 3, y - 1]], 'rgba(120,80,40,.6)', 1.2)); ell(g, 13.5, -11, 2.5, 4.5, '#5a3a20', 1); },
    purse: g => { ball(g, 0, 5, 12, '#a8683a', 1.3); poly(g, [[-6, -8], [6, -8], [3, -3], [-3, -3]], '#8a5a30', 1.1); ln(g, [[-5, -3], [5, -3]], '#e9b949', 1.6); ell(g, 7, 9, 5, 5, '#f2c94f', 1); text(g, '¤', 7, 9.5, 8, '#a8781c'); },
    web: g => { const R = 17; for (let i = 0; i < 8; i++) { const a = i / 8 * TAU; ln(g, [[0, 0], [Math.cos(a) * R, Math.sin(a) * R]], '#e8e8f0', 1.4); } [6, 11, 16].forEach(r => { g.beginPath(); for (let i = 0; i <= 8; i++) { const a = i / 8 * TAU; g[i ? 'lineTo' : 'moveTo'](Math.cos(a) * r, Math.sin(a) * r); } g.strokeStyle = '#e8e8f0'; g.lineWidth = 1.2; g.stroke(); }); ball(g, 6, 9, 3.4, '#3a2a3a', 1); },
    teapot: g => { ell(g, 0, 4, 13, 10, '#e9f0f6', 1.3); poly(g, [[11, 2], [19, -7], [17, -9], [10, -2]], '#e9f0f6', 1.1); g.beginPath(); g.arc(-14, 3, 6, Math.PI * .5, Math.PI * 1.5, false); g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke(); g.strokeStyle = '#e9f0f6'; g.lineWidth = 1.8; g.stroke(); ell(g, 0, -6, 7, 3, '#cfdbe6', 1); ball(g, 0, -10, 2.4, '#e9b949', 1); ln(g, [[-8, 6], [8, 6]], '#7fb0e0', 2); },
    root: g => { inkLn(g, [[0, -16], [0, 0], [-8, 9], [-13, 16]], '#8a5a30', 2.8); inkLn(g, [[0, 0], [7, 8], [10, 16]], '#8a5a30', 2.6); inkLn(g, [[-4, 5], [3, 15]], '#8a5a30', 2); ell(g, 6, -12, 6, 3.4, '#6fb84a', 1); ell(g, -6, -9, 5, 3, '#6fb84a', 1); },
    crystal: g => { poly(g, [[0, -19], [8, -7], [5, 14], [-5, 14], [-8, -7]], '#9fd8f0', 1.3); poly(g, [[0, -19], [3, -7], [0, 14], [-5, 14], [-8, -7]], 'rgba(255,255,255,.35)', 0); poly(g, [[-13, -2], [-8, 5], [-9, 15], [-14, 15], [-16, 5]], '#7ec0e0', 1.1); poly(g, [[13, 0], [17, 6], [15, 15], [11, 15], [10, 6]], '#7ec0e0', 1.1); },
    coffin: g => { poly(g, [[-6, -18], [6, -18], [11, -8], [7, 18], [-7, 18], [-11, -8]], '#8a5a30', 1.3); inkLn(g, [[0, -10], [0, 6]], '#e9b949', 2); inkLn(g, [[-5, -4], [5, -4]], '#e9b949', 2); },
    soul: g => flame(g, 1, '#9a7ae0', '#e0d0ff'),
    mug: g => { rrect(g, -11, -6, 18, 22, 3, '#a8683a', 1.3); [-6, 0].forEach(x => ln(g, [[x, -4], [x, 14]], 'rgba(60,30,10,.4)', 1.4)); g.beginPath(); g.arc(9, 4, 6, -Math.PI / 2, Math.PI / 2); g.strokeStyle = INK; g.lineWidth = 4.2; g.stroke(); g.strokeStyle = '#a8683a'; g.lineWidth = 2.4; g.stroke(); [[-8, -8, 5], [-1, -10, 6], [6, -8, 5]].forEach(([x, y, r]) => ball(g, x, y, r, '#fff8e6', 1)); },
    tongue: g => { g.beginPath(); g.moveTo(-14, -10); g.bezierCurveTo(8, -14, 14, 0, 4, 8); g.strokeStyle = INK; g.lineWidth = 9; g.lineCap = 'round'; g.stroke(); g.strokeStyle = '#f08aa8'; g.lineWidth = 6.4; g.stroke(); ball(g, 4, 9, 5.5, '#f08aa8', 1.2); ln(g, [[-10, -9], [2, -9]], 'rgba(255,255,255,.4)', 1.2); },
    egg: g => { ell(g, 0, 2, 12, 16, '#f4ead2', 1.3); [[-4, -4, 2.2], [5, 3, 2.6], [-2, 9, 2], [4, -9, 1.6]].forEach(([x, y, r]) => ell(g, x, y, r, r * .8, '#8fbf5a', 0)); },
    bat: g => { poly(g, [[0, -6], [-5, -2], [-18, -8], [-13, 4], [-6, 2], [0, 10], [6, 2], [13, 4], [18, -8], [5, -2]], '#4a3a5e', 1.3); ell(g, 0, -1, 5, 6, '#5a4a70', 1); poly(g, [[-4, -6], [-2, -11], [0, -6]], '#5a4a70', 1); poly(g, [[4, -6], [2, -11], [0, -6]], '#5a4a70', 1); ell(g, -2, -2, 1.2, 1.2, '#ff5a5a', 0); ell(g, 2, -2, 1.2, 1.2, '#ff5a5a', 0); },
    charm: g => { heart(g, '#f08ac0', .9, 0, 1); inkLn(g, [[-16, 14], [14, -14]], '#b07a44', 1.8); poly(g, [[17, -17], [9, -15], [15, -9]], '#e9b949', 1); },
    eye: g => { shape(g, () => { g.moveTo(-17, 0); g.quadraticCurveTo(0, -15, 17, 0); g.quadraticCurveTo(0, 15, -17, 0); }, '#f8f4ec', 1.3); ball(g, 0, 0, 7, '#5ab06a', 1); ell(g, 0, 0, 2, 5.5, INK, 0); shine(g, -2.5, -2.5, 1.6, 1.6); },
    cloud: g => cloud(g),
    feather: g => { shape(g, () => { g.moveTo(-12, 16); g.quadraticCurveTo(-10, -6, 12, -17); g.quadraticCurveTo(10, 4, -12, 16); }, radial(g, 0, 0, 16, '#d8f0ff'), 1.2); ln(g, [[-13, 17], [10, -14]], '#7a9ab0', 1.2); },
    target: g => { ball(g, 0, 0, 17, '#e85a4a', 1.3); ball(g, 0, 0, 11.5, '#f8f0e0', 0); ball(g, 0, 0, 6, '#e85a4a', 0); },
    leaf: g => { shape(g, () => { g.moveTo(-13, 14); g.quadraticCurveTo(-15, -12, 15, -15); g.quadraticCurveTo(13, 12, -13, 14); }, radial(g, 0, 0, 16, '#7ccf5a'), 1.3); ln(g, [[-12, 13], [12, -13]], '#3f7a2a', 1.3); },
    trap: g => { ell(g, 0, 8, 16, 6, '#6f7480', 1.3); [-1, 1].forEach(k => { shape(g, () => { g.moveTo(-15, 7); g.quadraticCurveTo(0, k * -16 + (k > 0 ? 0 : 0), 15, 7); }, k > 0 ? '#9aa3b0' : '#7f8794', 1.2); }); for (let i = -12; i <= 12; i += 4) poly(g, [[i - 1.8, 5], [i, -1], [i + 1.8, 5]], '#e8ecf0', .7); },
    pumpkin: g => { [-8, 8, 0].forEach(x => ell(g, x, 3, x ? 9 : 10, 13, '#f08a2a', 1.2)); rrect(g, -2, -14, 4, 6, 1.5, '#5f9a4f', 1); poly(g, [[-6, -1], [-3, -4], [-1, 0]], INK, 0); poly(g, [[6, -1], [3, -4], [1, 0]], INK, 0); poly(g, [[-6, 6], [6, 6], [3, 10], [0, 8], [-3, 10]], INK, 0); },
    skull: g => skullAt(g),
    // la carte du donjon et les boutons
    chest: g => { rrect(g, -16, -3, 32, 18, 2.5, '#a8683a', 1.3); shape(g, () => { g.moveTo(-16, -3); g.quadraticCurveTo(0, -18, 16, -3); }, radial(g, 0, -8, 16, '#b87a44'), 1.3); rrect(g, -16, -4, 32, 4, 1, '#e9b949', 1); rrect(g, -3, -6, 6, 9, 1.5, '#e9b949', 1); ball(g, -9, -10, 2.6, '#ffe36a', 0); ball(g, 8, -11, 2.2, '#ffe36a', 0); },
    campfire: g => { inkLn(g, [[-14, 15], [12, 8]], '#8a5a30', 3.6); inkLn(g, [[14, 15], [-12, 8]], '#7a4a28', 3.6); flame(g, .78, '#ff7a2a', '#ffd84a', 0, -3); },
    question: g => { ball(g, 0, 0, 17, '#f1e4c8', 1.3); text(g, '?', 0, 1.5, 26, '#7a4fb0'); },
    crown: g => { poly(g, [[-16, 12], [-16, -7], [-8, 2], [0, -13], [8, 2], [16, -7], [16, 12]], '#f2c94f', 1.4); rrect(g, -16, 9, 32, 6, 1.5, '#e9b949', 1); [[-16, -8], [0, -14], [16, -8]].forEach(([x, y]) => ball(g, x, y, 2.6, '#fff1a0', 1)); ball(g, 0, 4, 3.2, '#c8413a', 1); ball(g, -9, 6, 2.4, '#3a6fb0', 1); ball(g, 9, 6, 2.4, '#5f9a4f', 1); },
    cards: g => { g.save(); g.rotate(-.22); rrect(g, -13, -15, 18, 26, 3, '#7a4fb0', 1.2); g.restore(); g.save(); g.rotate(.14); rrect(g, -5, -14, 18, 26, 3, '#f1e4c8', 1.2); ln(g, [[-1, -9], [9, -9]], '#c8413a', 1.6); ln(g, [[-1, -5], [7, -5]], 'rgba(42,28,22,.5)', 1); g.restore(); },
    bag: g => { ball(g, 0, 5, 13, '#c7a26a', 1.3); poly(g, [[-7, -9], [7, -9], [4, -3], [-4, -3]], '#b08a50', 1.1); inkLn(g, [[-6, -3], [6, -3]], '#8a5a30', 1.6); ln(g, [[-5, 6], [5, 6]], 'rgba(90,60,20,.4)', 1.2); },
    anvil: g => { poly(g, [[-16, -6], [12, -6], [17, -10], [17, -4], [8, 2], [5, 9], [9, 14], [-9, 14], [-5, 9], [-8, 2], [-16, -1]], '#6f7480', 1.3); ln(g, [[-14, -5], [10, -5]], 'rgba(255,255,255,.35)', 1.2); },
    door: g => { rrect(g, -12, -16, 24, 32, 3, '#7a4a28', 1.3); shape(g, () => { g.moveTo(-6, -13); g.lineTo(9, -16); g.lineTo(9, 16); g.lineTo(-6, 13); }, radial(g, 0, 0, 14, '#c78a4a'), 1.2); ball(g, 5, 1, 1.6, '#e9b949', .8); },
    flag: g => { inkLn(g, [[-10, 17], [-10, -16]], '#8a5a30', 2.4); shape(g, () => { g.moveTo(-10, -15); g.quadraticCurveTo(0, -19, 14, -13); g.quadraticCurveTo(6, -6, 14, 1); g.quadraticCurveTo(2, -3, -10, 0); }, '#f8f6f0', 1.2); },
    hourglass: g => { rrect(g, -13, -17, 26, 4, 1.5, '#a8683a', 1); rrect(g, -13, 13, 26, 4, 1.5, '#a8683a', 1); shape(g, () => { g.moveTo(-10, -13); g.lineTo(10, -13); g.lineTo(2, 0); g.lineTo(10, 13); g.lineTo(-10, 13); g.lineTo(-2, 0); }, 'rgba(220,240,255,.6)', 1.2); poly(g, [[-6, 13], [6, 13], [0, 6]], '#e9c06a', 0); poly(g, [[-5, -9], [5, -9], [0, -3]], '#e9c06a', 0); },
    gear: g => { const p = []; for (let i = 0; i < 16; i++) { const a = i / 16 * TAU, r = i % 2 ? 13 : 17; p.push([Math.cos(a) * r, Math.sin(a) * r]); } poly(g, p, '#9aa3b0', 1.3); ball(g, 0, 0, 6, '#6f7480', 1.1); ball(g, 0, 0, 2.6, '#2a2f3a', 0); },
    trophy: g => { shape(g, () => { g.moveTo(-11, -15); g.lineTo(11, -15); g.quadraticCurveTo(11, 4, 0, 5); g.quadraticCurveTo(-11, 4, -11, -15); }, radial(g, -2, -8, 15, '#f2c94f'), 1.3); [-1, 1].forEach(k => { g.beginPath(); g.arc(k * 11, -8, 5, k > 0 ? -Math.PI / 2 : Math.PI / 2, k > 0 ? Math.PI / 2 : Math.PI * 1.5); g.strokeStyle = INK; g.lineWidth = 3.6; g.stroke(); g.strokeStyle = '#e9b949'; g.lineWidth = 2; g.stroke(); }); rrect(g, -2.5, 5, 5, 6, 1, '#e9b949', 1); rrect(g, -9, 11, 18, 5, 1.5, '#a8683a', 1); shine(g, -5, -10, 2, 4); },
    book: g => { rrect(g, -12, -16, 24, 30, 2.5, '#b83a33', 1.3); rrect(g, -12, 11, 24, 5, 1.5, '#f1e4c8', 1); inkLn(g, [[-6, -16], [-6, 11]], '#8a2a24', 1.4); star(g, 3, -3, 5, 6, 2.5, -Math.PI / 2, '#e9b949', .8); },
    mushroom: g => { rrect(g, -5, -1, 10, 16, 4, '#f1e4c8', 1.2); shape(g, () => { g.moveTo(-17, 2); g.quadraticCurveTo(-16, -17, 0, -17); g.quadraticCurveTo(16, -17, 17, 2); }, radial(g, -3, -9, 17, '#d8433a'), 1.3); [[-9, -7, 2.6], [1, -11, 3], [9, -5, 2.2]].forEach(([x, y, r]) => ell(g, x, y, r, r * .8, '#fff4e6', 0)); },
    acorn: g => { ell(g, 0, 5, 10, 12, '#b07a3a', 1.3); shape(g, () => { g.moveTo(-12, -2); g.quadraticCurveTo(0, -16, 12, -2); g.lineTo(-12, -2); }, radial(g, 0, -6, 12, '#7a5a30'), 1.3); inkLn(g, [[0, -10], [3, -16]], '#5a3a20', 1.8); },
    stone: g => { shape(g, () => { g.moveTo(-15, 8); g.quadraticCurveTo(-17, -10, -2, -14); g.quadraticCurveTo(15, -15, 16, 2); g.quadraticCurveTo(14, 15, 0, 15); g.quadraticCurveTo(-13, 15, -15, 8); }, radial(g, -3, -4, 17, '#9a9caa'), 1.3); ln(g, [[-5, -6], [0, 4], [5, -5]], '#bfe6ff', 2); },
    pine: g => { [[-16, 8, 16, 3], [-13, -2, 13, -9], [-9, -11, 9, -18]].forEach(([x0, y0, x1, y1]) => poly(g, [[x0, y0], [x1, y0], [0, y1 - 6]], '#3f8a4a', 1.2)); rrect(g, -3, 8, 6, 8, 1.2, '#7a4a28', 1); },
    gift: g => { rrect(g, -13, -5, 26, 20, 2, '#5a86d0', 1.3); rrect(g, -15, -10, 30, 7, 2, '#6f98e0', 1.2); inkLn(g, [[0, -10], [0, 15]], '#e9b949', 2.6); ell(g, -5, -13, 5, 3, '#e9b949', 1); ell(g, 5, -13, 5, 3, '#e9b949', 1); },
    sound: g => { rrect(g, -15, -6, 9, 12, 2, '#6f7480', 1.2); poly(g, [[-6, -6], [4, -15], [4, 15], [-6, 6]], '#9aa3b0', 1.2); [8, 13].forEach(r => { g.beginPath(); g.arc(2, 0, r, -Math.PI / 4, Math.PI / 4); g.strokeStyle = INK; g.lineWidth = 3.4; g.stroke(); g.strokeStyle = '#f1e4c8'; g.lineWidth = 1.8; g.stroke(); }); },
    mute: g => { rrect(g, -15, -6, 9, 12, 2, '#6f7480', 1.2); poly(g, [[-6, -6], [4, -15], [4, 15], [-6, 6]], '#9aa3b0', 1.2); inkLn(g, [[8, -6], [17, 6]], '#e85a4a', 2.4); inkLn(g, [[17, -6], [8, 6]], '#e85a4a', 2.4); },
    heal2: g => { heart(g, '#e2475a', .95); inkLn(g, [[0, -3], [0, 7]], '#fff8f0', 2.6); inkLn(g, [[-5, 2], [5, 2]], '#fff8f0', 2.6); },
    calm: g => { ball(g, 0, 0, 16, '#9fd0f0', 1.3); g.strokeStyle = INK; g.lineWidth = 1.8; g.lineCap = 'round'; [-6, 6].forEach(x => { g.beginPath(); g.arc(x, -3, 3.5, Math.PI * .15, Math.PI * .85); g.stroke(); }); g.beginPath(); g.arc(0, 4, 6, Math.PI * .15, Math.PI * .85); g.stroke(); },
    fear: g => { ball(g, 0, 0, 16, '#d8c8f0', 1.3); ell(g, -6, -3, 3.4, 4.4, '#fff', 1); ell(g, 6, -3, 3.4, 4.4, '#fff', 1); ball(g, -6, -2, 1.4, INK, 0); ball(g, 6, -2, 1.4, INK, 0); ell(g, 0, 8, 4, 5, INK, 0); drop(g, '#8fd0ff', .25, 13, -10); },
    energy: g => { ball(g, 0, 0, 16, '#f2b63a', 1.3); bolt(g, '#fff6c8', .62); },
    lock: g => { g.beginPath(); g.arc(0, -4, 8, Math.PI, 0); g.strokeStyle = INK; g.lineWidth = 5; g.stroke(); g.strokeStyle = '#9aa3b0'; g.lineWidth = 3; g.stroke(); rrect(g, -12, -4, 24, 19, 3, '#e9b949', 1.3); ball(g, 0, 4, 2.6, INK, 0); rrect(g, -1, 5, 2, 6, .8, INK, 0); },
    pin: g => { inkLn(g, [[0, 2], [0, 18]], '#9aa3b0', 2); ball(g, 0, -5, 10, '#e85a4a', 1.3); shine(g, -3, -8, 3, 2); },
    info: g => { ball(g, 0, 0, 16, '#5a86d0', 1.3); text(g, 'i', 0, 1, 22, '#fff'); },
  });
  // les icônes de l'interface : château, menus, Grimoire, chroniques, humeurs
  const medal = (g, col) => { poly(g, [[-9, -18], [-3, -18], [3, -4], [-3, -4]], '#d8433a', 1); poly(g, [[9, -18], [3, -18], [-3, -4], [3, -4]], '#4a7fc4', 1); ball(g, 0, 5, 11, col, 1.3); star(g, 0, 5, 5, 6, 2.6, -Math.PI / 2, shade(col, .35), .8); };
  const face = (g, col) => { ball(g, 0, 0, 16, col, 1.3); shine(g, -7, -9, 3, 2); };
  const arc = (g, x, y, r, a0, a1, w = 1.8, col = INK) => { g.beginPath(); g.arc(x, y, r, a0, a1); g.strokeStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.stroke(); };
  const tube = (g, f, col, w) => { g.beginPath(); f(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = w + 2.4; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke(); };
  const blob = (g, P, col) => { P.forEach(([x, y, r]) => ball(g, x, y, r + 1.2, outl(col), 0)); P.forEach(([x, y, r]) => ball(g, x, y, r, col, 0)); };
  Object.assign(ICON_DRAW, {
    castle: g => {
      [-12, 12].forEach(x => { rrect(g, x - 6, -10, 12, 26, 1.5, '#b9a58a', 1.2); [-4, 0, 4].forEach(d => rrect(g, x + d - 1.7, -14, 3.4, 5, .6, '#b9a58a', 1)); ball(g, x, -3, 1.7, '#3a2a4a', 0); });
      rrect(g, -8, -3, 16, 19, 1.5, '#d2bea0', 1.2); [-5, 0, 5].forEach(d => rrect(g, d - 1.8, -7, 3.6, 5, .6, '#d2bea0', 1));
      shape(g, () => { g.moveTo(-4, 16); g.lineTo(-4, 9); g.quadraticCurveTo(0, 3, 4, 9); g.lineTo(4, 16); }, '#5a3a24', 1);
      inkLn(g, [[12, -14], [12, -21]], '#7a4a28', 1.1); poly(g, [[12, -21], [19, -18.5], [12, -16]], '#e85a7a', .9);
    },
    bookopen: g => {
      shape(g, () => { g.moveTo(-19, -9); g.lineTo(-19, 14); g.quadraticCurveTo(-9, 11, 0, 16); g.quadraticCurveTo(9, 11, 19, 14); g.lineTo(19, -9); g.lineTo(0, -5); }, '#9a3a2e', 1.2);
      shape(g, () => { g.moveTo(0, -11); g.quadraticCurveTo(-8, -16, -17, -13); g.lineTo(-17, 10); g.quadraticCurveTo(-8, 7, 0, 12); }, '#fbf3e0', 1);
      shape(g, () => { g.moveTo(0, -11); g.quadraticCurveTo(8, -16, 17, -13); g.lineTo(17, 10); g.quadraticCurveTo(8, 7, 0, 12); }, '#efe0c0', 1);
      [-7, -3, 1, 5].forEach(y => { ln(g, [[-14, y - 3], [-3, y - 1]], 'rgba(90,60,40,.45)', 1); ln(g, [[3, y - 1], [14, y - 3]], 'rgba(90,60,40,.45)', 1); });
    },
    dice: g => {
      poly(g, [[0, -17], [15, -9], [0, -1], [-15, -9]], '#fbf3e0', 1.2); poly(g, [[-15, -9], [0, -1], [0, 17], [-15, 9]], '#e6d6b6', 1.2); poly(g, [[15, -9], [0, -1], [0, 17], [15, 9]], '#cdbb98', 1.2);
      ell(g, 0, -9, 2.8, 1.6, '#c8413a', 0); [[-11, -1], [-4, 9]].forEach(([x, y]) => ell(g, x, y, 1.7, 2.1, INK, 0)); [[4, -1], [7.5, 4], [11, 9]].forEach(([x, y]) => ell(g, x, y, 1.7, 2.1, INK, 0));
    },
    scroll: g => {
      rrect(g, -12, -13, 24, 26, 1, '#f1e4c8', 1.1); [-6, -2, 2].forEach(y => ln(g, [[-8, y], [8, y]], 'rgba(90,60,40,.5)', 1.1)); ln(g, [[-8, 6], [2, 6]], 'rgba(90,60,40,.5)', 1.1);
      [-14, 14].forEach(y => { ell(g, 0, y, 15, 3.6, '#e2cfa4', 1.1); ball(g, -15, y, 2.4, '#a8683a', 1); ball(g, 15, y, 2.4, '#a8683a', 1); }); ball(g, 7, 7, 3.4, '#c8413a', 1);
    },
    temple: g => { poly(g, [[-18, -8], [0, -18], [18, -8]], '#e6dcc8', 1.2); rrect(g, -17, -8, 34, 4, 1, '#d8ccb4', 1); [-12, -4, 4, 12].forEach(x => rrect(g, x - 2.4, -4, 4.8, 16, .8, '#efe6d6', 1)); rrect(g, -19, 12, 38, 5, 1, '#c8bca4', 1.1); },
    check: g => { ball(g, 0, 0, 16, '#4caf5a', 1.3); shine(g, -6, -8, 4, 2.4); inkLn(g, [[-8, 0], [-2, 7], [9, -7]], '#ffffff', 3.2); },
    box: g => { rrect(g, -13, -13, 26, 26, 5, '#f4ecd8', 1.4); rrect(g, -9, -9, 18, 18, 3, 'rgba(120,90,60,.12)', 0); },
    cross: g => { inkLn(g, [[-11, -11], [11, 11]], '#e0483a', 5); inkLn(g, [[11, -11], [-11, 11]], '#e0483a', 5); },
    plus: g => { ball(g, 0, 0, 16, '#4caf5a', 1.3); inkLn(g, [[0, -8], [0, 8]], '#ffffff', 3.4); inkLn(g, [[-8, 0], [8, 0]], '#ffffff', 3.4); },
    warn: g => { shape(g, () => { g.moveTo(0, -17); g.lineTo(17, 14); g.lineTo(-17, 14); }, radial(g, 0, 0, 18, '#f2c230'), 1.4); rrect(g, -1.8, -7, 3.6, 12, 1.6, INK, 0); ball(g, 0, 9.5, 2, INK, 0); },
    eyes: g => [-8, 8].forEach(x => { ell(g, x, 0, 7, 10, '#ffffff', 1.3); ball(g, x + 2.5, 2, 3.4, '#3a2a4a', 0); ball(g, x + 1.5, .5, 1.1, '#ffffff', 0); }),
    statue: g => {
      shape(g, () => { g.moveTo(-9, 17); g.lineTo(-11, -6); g.quadraticCurveTo(-11, -17, 0, -17); g.quadraticCurveTo(11, -17, 11, -6); g.lineTo(9, 17); }, radial(g, -2, -4, 18, '#a8aab8'), 1.3);
      rrect(g, -10, -8, 20, 3.2, 1.4, '#6f7280', 0); ell(g, -5.5, -3, 2.4, 1.2, '#4a4c5a', 0); ell(g, 5.5, -3, 2.4, 1.2, '#4a4c5a', 0); poly(g, [[0, -5], [-4, 6], [4, 6]], '#8a8c9a', 1); ln(g, [[-5, 11], [5, 11]], INK, 1.6);
      [-1, 1].forEach(k => [0, 1, 2].forEach(i => ell(g, k * (4 + i * 3.5), -15 + i * 1.6, 3, 1.8, '#f2c94f', .8)));
    },
    thought: g => { g.save(); g.translate(2, -4); g.scale(.95, .85); cloud(g, '#ffffff'); g.restore(); ball(g, -9, 11, 3.2, '#ffffff', 1.1); ball(g, -14, 16, 2, '#ffffff', 1); [-3, 2, 7].forEach(x => ball(g, x, -3, 1.5, '#9a8aa8', 0)); },
    speech: g => { shape(g, () => { g.moveTo(-8, -14); g.lineTo(8, -14); g.quadraticCurveTo(17, -14, 17, -4); g.quadraticCurveTo(17, 7, 8, 7); g.lineTo(-2, 7); g.lineTo(-11, 15); g.lineTo(-8, 7); g.quadraticCurveTo(-17, 7, -17, -4); g.quadraticCurveTo(-17, -14, -8, -14); }, '#ffffff', 1.3); [-7, 0, 7].forEach(x => ball(g, x, -3.5, 2, '#7a6a8a', 0)); },
    tophat: g => { ell(g, 0, 11, 18, 5, '#2e2a36', 1.2); rrect(g, -10, -15, 20, 26, 2.5, '#3a3444', 1.2); rrect(g, -10, 3, 20, 4.5, 1, '#c8413a', .9); shine(g, -6, -9, 2, 4); },
    bricks: g => [[-17, -14, 16], [1, -14, 16], [-17, -4, 7], [-8, -4, 16], [10, -4, 7], [-17, 6, 16], [1, 6, 16]].forEach(([x, y, w]) => rrect(g, x, y, w, 9, 1.2, '#c8643a', 1.1)),
    bandage: g => { g.save(); g.rotate(-Math.PI / 4); rrect(g, -18, -6, 36, 12, 6, '#f2c9a0', 1.2); rrect(g, -6, -5, 12, 10, 1.5, '#fbf3e0', .9); [[-3, -2], [3, -2], [-3, 2], [3, 2]].forEach(([x, y]) => ball(g, x, y, .8, '#d8b890', 0)); g.restore(); },
    save: g => { rrect(g, -15, -15, 30, 30, 3, '#4a6fb0', 1.3); rrect(g, -9, -15, 16, 10, 1, '#d8dee8', 1); rrect(g, 2, -13, 3, 6, .6, '#4a6fb0', 0); rrect(g, -10, 2, 20, 13, 1.5, '#fbf3e0', 1); [6, 10].forEach(y => ln(g, [[-7, y], [7, y]], 'rgba(90,60,40,.4)', 1)); },
    globe: g => {
      ball(g, 0, 0, 16, '#4a8fd0', 1.3); [[-5, -6, 6, 4], [6, 5, 5, 6], [-7, 8, 3, 2.4]].forEach(([x, y, rx, ry]) => ell(g, x, y, rx, ry, '#5ab04a', 0));
      g.beginPath(); g.ellipse(0, 0, 7, 16, 0, 0, TAU); g.moveTo(-16, 0); g.lineTo(16, 0); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 1; g.stroke(); shine(g, -6, -8, 4, 2.4);
    },
    quill: g => { rrect(g, -16, 6, 13, 11, 3, '#3a3444', 1.2); ell(g, -9.5, 6.5, 6, 1.8, '#1a1820', 0); shape(g, () => { g.moveTo(-7, 5); g.quadraticCurveTo(1, -16, 17, -18); g.quadraticCurveTo(12, -3, -7, 5); }, '#f8f6f0', 1.1); ln(g, [[-7, 5], [12, -14]], 'rgba(120,110,100,.6)', 1); },
    tree: g => { rrect(g, -3, 3, 6, 14, 1.5, '#7a4a28', 1.1); blob(g, [[-8, -2, 8], [8, -2, 8], [0, -9, 10], [0, 2, 8]], '#4f9a4a'); shine(g, -3, -13, 4, 2.4); },
    suitcase: g => { tube(g, () => { g.moveTo(-6, -8); g.lineTo(-6, -13); g.quadraticCurveTo(0, -16, 6, -13); g.lineTo(6, -8); }, '#7a4a28', 2.4); rrect(g, -17, -8, 34, 23, 3.5, '#b8743a', 1.3); [-10, 10].forEach(x => rrect(g, x - 1.6, -8, 3.2, 23, .5, '#7a4a28', 0)); rrect(g, -3, -2, 6, 4, 1, '#e9b949', .8); },
    meat: g => { g.save(); g.rotate(-Math.PI / 5); rrect(g, 5, -2.2, 12, 4.4, 2, '#f4ecd8', 1); ball(g, 17, -2.8, 2.8, '#f4ecd8', 1); ball(g, 17, 2.8, 2.8, '#f4ecd8', 1); ell(g, -4, 0, 12, 10, '#b8643a', 1.3); shine(g, -8, -4, 4, 2.4); g.restore(); },
    bulb: g => { glow(g, 0, -4, 20, '255,230,120'); ball(g, 0, -4, 12, '#ffe27a', 1.3); rrect(g, -5.5, 7, 11, 9, 2, '#9aa3b0', 1.1); [10, 13].forEach(y => ln(g, [[-5, y], [5, y]], 'rgba(60,60,70,.6)', 1)); ln(g, [[-3, -2], [0, 2], [3, -2]], '#e09a2a', 1.4); shine(g, -4, -9, 3, 2); },
    anger: g => [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([sx, sy]) => { g.save(); g.scale(sx, sy); inkLn(g, [[4, 15], [5, 5], [15, 4]], '#e8433a', 3.4); g.restore(); }),
    grumpy: g => { face(g, '#e8645a'); [-1, 1].forEach(k => { ln(g, [[k * 10, -7], [k * 3, -4]], INK, 2); ball(g, k * 5.5, 0, 2.1, INK, 0); }); arc(g, 0, 12, 6, Math.PI * 1.2, Math.PI * 1.8, 2); },
    oops: g => { face(g, '#f6c84a'); ball(g, -6, -4, 2.2, INK, 0); ball(g, 6, -4, 2.2, INK, 0); rrect(g, -8, 4, 16, 7, 2.5, '#ffffff', 1.1); ln(g, [[-8, 7.5], [8, 7.5]], 'rgba(60,40,30,.6)', .8); [-4, 0, 4].forEach(x => ln(g, [[x, 4], [x, 11]], 'rgba(60,40,30,.6)', .8)); drop(g, '#8fd0ff', .25, 13, -10); },
    shush: g => { face(g, '#f6c84a'); [-6, 6].forEach(x => arc(g, x, -2, 3, Math.PI * 1.1, Math.PI * 1.9, 1.6)); ell(g, 0, 8, 4, 2, '#c8413a', 0); rrect(g, -2.2, 1, 4.4, 15, 2.2, '#f2b080', 1.1); },
    devil: g => { [-1, 1].forEach(k => poly(g, [[k * 6, -10], [k * 15, -19], [k * 13, -5]], '#7a3ab0', 1.1)); ball(g, 0, 2, 15, '#9b5ad8', 1.3); [-1, 1].forEach(k => { ln(g, [[k * 10, -5], [k * 3, -2]], INK, 2); ball(g, k * 5.5, 2, 2, INK, 0); }); arc(g, 0, 5, 7, Math.PI * .15, Math.PI * .85, 2); shine(g, -6, -6, 3, 2); },
    frog: g => { ell(g, 0, 4, 16, 12, '#6cc04a', 1.3); [-8, 8].forEach(x => { ball(g, x, -8, 6, '#6cc04a', 1.2); ball(g, x, -8, 3.4, '#ffffff', 0); ball(g, x + .6, -7.4, 1.8, INK, 0); }); arc(g, 0, 3, 9, Math.PI * .2, Math.PI * .8, 1.6); ell(g, -10, 7, 2.4, 1.4, '#f29aa8', 0); ell(g, 10, 7, 2.4, 1.4, '#f29aa8', 0); },
    orb: g => { glow(g, 0, -3, 20, '190,140,255'); rrect(g, -10, 10, 20, 7, 2, '#a8683a', 1.2); ball(g, 0, -3, 14, '#9b6bff', 1.3); ell(g, 3, 1, 5, 3, 'rgba(255,220,255,.5)', 0); shine(g, -5, -9, 4, 2.6); },
    bone: g => { g.save(); g.rotate(-Math.PI / 4); const c = '#f1e8d6'; [[-12, -4], [-12, 4], [12, -4], [12, 4]].forEach(([x, y]) => ball(g, x, y, 4.6, c, 1.2)); rrect(g, -12, -3.5, 24, 7, 0, 'rgb(236,226,204)', 0); [-3.5, 3.5].forEach(y => ln(g, [[-8, y], [8, y]], outl(c), 1.2)); g.restore(); },
    hand: g => { const c = '#f2c290'; g.save(); g.rotate(-.25); [-7.5, -2.5, 2.5, 7.5].forEach((x, i) => rrect(g, x - 2.4, -16 + (i % 3 ? 0 : 4), 4.8, 16, 2.4, c, 1.1)); rrect(g, -10, -4, 20, 18, 7, c, 1.2); g.save(); g.translate(-10, 3); g.rotate(-.9); rrect(g, -2.4, -11, 4.8, 12, 2.4, c, 1.1); g.restore(); g.restore(); [9, 13].forEach(r => arc(g, 2, -2, r, -Math.PI * .45, -Math.PI * .2, 1.4, '#7a6a5a')); },
    torch: g => { glow(g, 5, -12, 14, '255,180,80'); g.save(); g.rotate(.35); rrect(g, -2.6, -2, 5.2, 19, 1.5, '#8a5a30', 1.1); rrect(g, -4.2, -5, 8.4, 5, 1.2, '#6f7480', 1); flame(g, .55, '#ff7a2a', '#ffd84a', 0, -12); g.restore(); },
    glove: g => { g.save(); g.rotate(-.3); rrect(g, -10, 5, 20, 12, 3, '#fbf3e0', 1.2); ln(g, [[-9, 10], [9, 10]], '#d8433a', 2); shape(g, () => { g.moveTo(-12, 6); g.quadraticCurveTo(-17, -16, 2, -16); g.quadraticCurveTo(17, -16, 15, -1); g.quadraticCurveTo(14, 7, 10, 7); }, radial(g, -2, -6, 16, '#d8433a'), 1.3); shape(g, () => { g.moveTo(-12, 4); g.quadraticCurveTo(-18, -4, -10, -8); g.quadraticCurveTo(-4, -6, -5, 4); }, '#c8332a', 1); ln(g, [[0, -8], [10, -8]], 'rgba(120,20,15,.5)', 1.2); shine(g, 0, -11, 5, 2.5); g.restore(); },
    mail: g => { rrect(g, -16, -11, 32, 22, 2.5, '#fbf3e0', 1.3); ln(g, [[-15, -10], [0, 2], [15, -10]], 'rgba(110,80,60,.7)', 1.4); ball(g, 0, 2, 3.2, '#c8413a', .9); },
    frame: g => { rrect(g, -17, -14, 34, 28, 2, '#c99a3a', 1.3); rrect(g, -12, -9, 24, 18, 1, '#9fd0f0', 1); poly(g, [[-12, 9], [-4, -1], [2, 5], [6, 1], [12, 9]], '#4f9a4a', 0); ball(g, 6, -4, 2.4, '#ffe27a', 0); },
    lantern: g => { glow(g, 0, 1, 20, '255,120,80'); rrect(g, -6, -16, 12, 4, 1, '#3a2a24', 1); rrect(g, -6, 13, 12, 4, 1, '#3a2a24', 1); ell(g, 0, 0, 14, 13, '#e0483a', 1.3); g.beginPath(); g.ellipse(0, 0, 7, 13, 0, 0, TAU); g.moveTo(0, -13); g.lineTo(0, 13); g.strokeStyle = 'rgba(110,20,10,.55)'; g.lineWidth = 1.1; g.stroke(); shine(g, -6, -5, 3, 2.4); },
    link: g => { g.save(); g.rotate(-Math.PI / 4); [-6, 6].forEach(x => { rr(g, x - 8, -5, 16, 10, 5); g.strokeStyle = INK; g.lineWidth = 5.4; g.stroke(); g.strokeStyle = '#9aa3b0'; g.lineWidth = 3; g.stroke(); }); g.restore(); },
    shop: g => { rrect(g, -15, -4, 30, 20, 1.5, '#d8b890', 1.2); rrect(g, -5, 4, 10, 12, 1, '#7a4a28', 1); rrect(g, 7, 2, 6, 5, .8, '#9fd0f0', .9); for (let i = 0; i < 5; i++) { const x = -17 + i * 6.8; g.beginPath(); g.moveTo(x, -15); g.lineTo(x + 6.8, -15); g.lineTo(x + 6.8, -6); g.arc(x + 3.4, -6, 3.4, 0, Math.PI); g.closePath(); fi(g, i % 2 ? '#fbf3e0' : '#e0483a', 1); } },
    cycle: g => [0, Math.PI].forEach(r => { g.save(); g.rotate(r); tube(g, () => g.arc(0, 0, 12, Math.PI * 1.1, Math.PI * 1.8), '#4caf5a', 3.4); const a = Math.PI * 1.8, x = Math.cos(a) * 12, y = Math.sin(a) * 12, tx = -Math.sin(a), ty = Math.cos(a); poly(g, [[x + tx * 7, y + ty * 7], [x - ty * 5, y + tx * 5], [x + ty * 5, y - tx * 5]], '#4caf5a', 1); g.restore(); }),
    trash: g => { rrect(g, -11, -9, 22, 25, 2.5, '#9aa3b0', 1.2); rrect(g, -4, -16, 8, 4, 1, '#6f7480', 1); rrect(g, -14, -13, 28, 5, 1.5, '#6f7480', 1.1); [-5, 0, 5].forEach(x => ln(g, [[x, -5], [x, 12]], 'rgba(40,40,50,.45)', 1.6)); },
    fast: g => { poly(g, [[-16, -12], [0, 0], [-16, 12]], '#5a86d0', 1.2); poly(g, [[-1, -12], [15, 0], [-1, 12]], '#5a86d0', 1.2); },
    pause: g => { rrect(g, -11, -14, 8, 28, 2, '#5a86d0', 1.2); rrect(g, 3, -14, 8, 28, 2, '#5a86d0', 1.2); },
    magnify: g => { inkLn(g, [[6, 6], [16, 16]], '#7a4a28', 4); ball(g, -3, -3, 11, 'rgba(200,235,255,.75)', 0); tube(g, () => g.arc(-3, -3, 11, 0, TAU), '#9aa3b0', 3); shine(g, -7, -7, 3, 2); },
    scale: g => { inkLn(g, [[0, -15], [0, 13]], '#c99a3a', 2.4); rrect(g, -8, 13, 16, 4, 1.5, '#c99a3a', 1); inkLn(g, [[-14, -10], [14, -10]], '#c99a3a', 2); [-12, 12].forEach(x => { ln(g, [[x, -10], [x - 5, 2]], INK, 1); ln(g, [[x, -10], [x + 5, 2]], INK, 1); shape(g, () => { g.moveTo(x - 7, 2); g.quadraticCurveTo(x, 9, x + 7, 2); }, '#e9b949', 1); }); ball(g, 0, -15, 2.2, '#e9b949', 1); },
    magnet: g => { tube(g, () => { g.moveTo(-10, 7); g.lineTo(-10, -2); g.arc(0, -2, 10, Math.PI, 0); g.lineTo(10, 7); }, '#d8433a', 7); rrect(g, -14, 6, 8, 8, 1, '#d8dee8', 1); rrect(g, 6, 6, 8, 8, 1, '#d8dee8', 1); },
    medal1: g => medal(g, '#f2c94f'), medal2: g => medal(g, '#c8ccd6'), medal3: g => medal(g, '#c88a4a'),
    tent: g => { inkLn(g, [[0, -15], [0, -20]], '#7a4a28', 1.2); poly(g, [[0, -20], [6, -18], [0, -16]], '#f2c230', .8); for (let i = 0; i < 4; i++) poly(g, [[0, -15], [-16 + i * 8, 14], [-8 + i * 8, 14]], i % 2 ? '#fbf3e0' : '#e0483a', 1); shape(g, () => { g.moveTo(-4, 14); g.quadraticCurveTo(0, 2, 4, 14); }, '#3a2a24', .8); },
    potion: g => { rrect(g, -3.5, -17, 7, 4, 1.2, '#a8683a', 1); rrect(g, -3, -14, 6, 8, 1, 'rgba(220,240,255,.85)', 1); ball(g, 0, 5, 12, 'rgba(220,240,255,.85)', 1.2); g.beginPath(); g.arc(0, 5, 10.5, Math.PI * .05, Math.PI * .95); g.closePath(); g.fillStyle = radial(g, 0, 8, 10, '#e85a9a'); g.fill(); ball(g, -3, 9, 1.6, '#ffd0e8', 0); shine(g, -5, 0, 2.4, 3.6); },
    wand: g => { inkLn(g, [[-14, 14], [5, -5]], '#3a3444', 2.6); ln(g, [[-14, 14], [-10, 10]], '#fbf3e0', 2.4); star(g, 9, -9, 5, 8, 3.4, -Math.PI / 2, '#f2c94f', 1); [[15, 4], [-3, -14]].forEach(([x, y]) => star(g, x, y, 4, 3.6, 1.1, 0, '#fff1a0', 0)); },
    sleep: g => { text(g, 'Z', -6, 7, 20, '#a8c8f8'); text(g, 'z', 6, -4, 15, '#a8c8f8'); text(g, 'z', 13, -13, 11, '#a8c8f8'); },
    broom: g => { inkLn(g, [[13, -17], [-2, 2]], '#a8683a', 2.6); shape(g, () => { g.moveTo(-5, -1); g.lineTo(2, 5); g.lineTo(-6, 18); g.lineTo(-18, 9); }, '#e9c46a', 1.2); [[-3, 4, -11, 15], [-7, 3, -15, 11]].forEach(([a, b, c, d]) => ln(g, [[a, b], [c, d]], 'rgba(150,100,40,.6)', 1)); rrect(g, -6, -3, 7, 4, 1, '#c8413a', .8); },
    mask: g => { shape(g, () => { g.moveTo(-15, -14); g.quadraticCurveTo(0, -18, 15, -14); g.quadraticCurveTo(16, 8, 0, 16); g.quadraticCurveTo(-16, 8, -15, -14); }, radial(g, -3, -5, 18, '#f2c94f'), 1.3); [-1, 1].forEach(k => ell(g, k * 6, -5, 3.6, 2.4, INK, 0)); arc(g, 0, 3, 6, Math.PI * .1, Math.PI * .9, 2.2); },
    news: g => { rrect(g, -15, -15, 30, 30, 2, '#f4ecd8', 1.2); rrect(g, -11, -11, 22, 5, 1, '#3a3444', 0); rrect(g, -11, -3, 9, 9, 1, '#9aa3b0', 0); [-2, 2, 6].forEach(y => ln(g, [[1, y - 1], [11, y - 1]], 'rgba(60,50,40,.55)', 1.2)); ln(g, [[-11, 10], [11, 10]], 'rgba(60,50,40,.55)', 1.2); },
    apple: g => { shape(g, () => { g.moveTo(0, -7); g.bezierCurveTo(10, -14, 19, -4, 14, 8); g.bezierCurveTo(10, 17, 3, 16, 0, 14); g.bezierCurveTo(-3, 16, -10, 17, -14, 8); g.bezierCurveTo(-19, -4, -10, -14, 0, -7); }, radial(g, -4, -2, 16, '#d8433a'), 1.3); inkLn(g, [[0, -7], [2, -15]], '#7a4a28', 1.6); ell(g, 7, -13, 5, 2.6, '#5ab04a', 1); shine(g, -7, -3, 2.6, 4); },
    clover: g => { inkLn(g, [[2, 4], [8, 18]], '#3f8a4a', 2); blob(g, [[-6, -6, 7], [6, -6, 7], [-6, 6, 7], [6, 6, 7]], '#5ab04a'); ln(g, [[-10, -10], [10, 10]], 'rgba(30,70,30,.5)', 1); ln(g, [[10, -10], [-10, 10]], 'rgba(30,70,30,.5)', 1); },
    bug: g => { [-1, 1].forEach(k => [-6, 0, 6].forEach(y => ln(g, [[k * 6, y], [k * 15, y + (y > 0 ? 6 : y < 0 ? -5 : 1)]], INK, 1.6))); ell(g, 0, 3, 9, 13, '#7a4a28', 1.3); ball(g, 0, -11, 5.5, '#5a3a24', 1.2); [-1, 1].forEach(k => ln(g, [[k * 2, -15], [k * 9, -20]], INK, 1.2)); ln(g, [[0, -6], [0, 15]], 'rgba(30,15,10,.55)', 1); shine(g, -4, -1, 2, 4); },
    banana: g => { shape(g, () => { g.moveTo(-15, -13); g.quadraticCurveTo(-21, 19, 15, 13); g.lineTo(16, 8); g.quadraticCurveTo(-6, 6, -10, -14); }, radial(g, -6, 2, 16, '#f2d03a'), 1.3); g.beginPath(); g.moveTo(-12, -9); g.quadraticCurveTo(-13, 12, 12, 10); g.strokeStyle = 'rgba(255,250,210,.7)'; g.lineWidth = 1.6; g.stroke(); rrect(g, -15, -17, 5, 5, 1.2, '#7a5a30', .9); ball(g, 16, 10.5, 1.8, '#5a3a20', 0); },
    music: g => { inkLn(g, [[-6, 10], [-6, -12], [12, -16], [12, 6]], '#7a4bd1', 2.4); ell(g, -10, 11, 5, 4, '#7a4bd1', 1); ell(g, 8, 7, 5, 4, '#7a4bd1', 1); },
    key: g => { g.save(); g.rotate(-Math.PI / 4); tube(g, () => g.arc(-10, 0, 6, 0, TAU), '#e9b949', 3.4); inkLn(g, [[-4, 0], [16, 0]], '#e9b949', 3.2); inkLn(g, [[11, 0], [11, 5]], '#e9b949', 2.6); inkLn(g, [[15, 0], [15, 4]], '#e9b949', 2.6); g.restore(); },
    inbox: g => { shape(g, () => { g.moveTo(-16, 2); g.lineTo(-11, 2); g.lineTo(-7, 8); g.lineTo(7, 8); g.lineTo(11, 2); g.lineTo(16, 2); g.lineTo(16, 15); g.lineTo(-16, 15); }, '#9aa3b0', 1.2); g.save(); g.translate(0, -7); g.scale(.62, .62); arrowUp(g, '#4caf5a', true); g.restore(); },
    folder: g => { shape(g, () => { g.moveTo(-17, -12); g.lineTo(-6, -12); g.lineTo(-3, -8); g.lineTo(17, -8); g.lineTo(17, 14); g.lineTo(-17, 14); }, '#d8a03a', 1.2); shape(g, () => { g.moveTo(-17, -3); g.lineTo(17, -3); g.lineTo(15, 14); g.lineTo(-15, 14); }, radial(g, 0, 2, 18, '#f2c25a'), 1.2); },
    house: g => { rrect(g, 7, -14, 5, 9, .8, '#9a6a4a', 1); rrect(g, -12, -2, 24, 18, 1.5, '#f1e4c8', 1.2); poly(g, [[-17, 0], [0, -16], [17, 0]], '#d8433a', 1.3); rrect(g, -4, 5, 8, 11, 1, '#8a5a30', 1); rrect(g, 5, 3, 5, 5, .8, '#9fd0f0', .9); },
    palette: g => { shape(g, () => { g.moveTo(0, -15); g.bezierCurveTo(14, -15, 19, -2, 15, 6); g.bezierCurveTo(12, 12, 5, 8, 4, 12); g.bezierCurveTo(3, 17, -2, 17, -6, 15); g.bezierCurveTo(-17, 10, -18, -15, 0, -15); }, radial(g, -2, -4, 18, '#d8b890'), 1.3); [['#d8433a', -8, -6], ['#f2c230', -1, -9], ['#4a8fd0', 7, -6], ['#4caf5a', 9, 2]].forEach(([c, x, y]) => ball(g, x, y, 3, c, .9)); ball(g, -6, 6, 3, 'rgba(60,40,30,.35)', 0); },
    clipboard: g => { rrect(g, -13, -14, 26, 31, 2.5, '#a8683a', 1.3); rrect(g, -10, -9, 20, 23, 1, '#fbf3e0', 1); rrect(g, -6, -17, 12, 6, 1.5, '#9aa3b0', 1); [-4, 1, 6].forEach(y => ln(g, [[-6, y], [7, y]], 'rgba(60,50,40,.5)', 1.2)); },
    ballot: g => { rrect(g, -6, -17, 12, 14, 1, '#fbf3e0', 1); ln(g, [[-3, -11], [-1, -8], [3, -14]], '#4caf5a', 1.6); rrect(g, -15, -5, 30, 21, 2, '#5a86d0', 1.3); rrect(g, -9, -6, 18, 3, 1, '#2a3a5a', 0); },
    heartoff: g => heart(g, '#e8e2ea'),
    // les cartes du château (Grimoire, infobulles)
    cabbage: g => { blob(g, [[-9, 3, 9], [9, 3, 9], [0, -5, 11], [0, 7, 10]], '#5aa84a'); ball(g, 0, 1, 9, '#b8e890', 1.1); [[-6, -6], [6, -6], [0, 9]].forEach(([x, y]) => ln(g, [[0, 1], [x, y]], 'rgba(60,120,50,.6)', 1.2)); shine(g, -4, -3, 3, 2); },
    carrot: g => { g.save(); g.rotate(Math.PI / 5); [[-4, -18], [0, -20], [4, -18]].forEach(([x, y]) => inkLn(g, [[0, -10], [x, y]], '#5ab04a', 2.2)); shape(g, () => { g.moveTo(-7, -9); g.quadraticCurveTo(0, -13, 7, -9); g.lineTo(1, 17); g.quadraticCurveTo(0, 18, -1, 17); }, radial(g, -2, -3, 15, '#f2852a'), 1.2); [-3, 2, 7].forEach(y => ln(g, [[-4, y], [-1, y + 1]], 'rgba(160,70,20,.6)', 1)); g.restore(); },
    honey: g => { ell(g, 0, 4, 14, 12, '#d8a03a', 1.3); rrect(g, -9, -12, 18, 6, 2, '#c8913a', 1.1); shape(g, () => { g.moveTo(-9, -7); g.quadraticCurveTo(-8, 2, -4, 0); g.quadraticCurveTo(-2, 5, 2, 0); g.quadraticCurveTo(6, 3, 9, -7); }, '#f2c230', 1); rrect(g, -4, 3, 8, 6, 1.5, '#fbf3e0', .8); shine(g, -8, 1, 2.4, 4); },
    fish: g => { poly(g, [[9, 0], [18, -8], [18, 8]], '#5a9ad0', 1.2); ell(g, -2, 0, 14, 9, '#7ab8e8', 1.3); ball(g, -9, -2, 2.2, '#ffffff', .8); ball(g, -9, -2, 1, INK, 0); arc(g, -5, 0, 6, -Math.PI * .3, Math.PI * .3, 1.2, 'rgba(40,80,120,.6)'); shine(g, -2, -5, 4, 1.8); },
    bee: g => { ell(g, -4, -9, 6, 4, 'rgba(220,240,255,.85)', 1); ell(g, 5, -9, 6, 4, 'rgba(220,240,255,.85)', 1); poly(g, [[11, 3], [17, 1], [11, 6]], '#3a2a24', 0); ell(g, 0, 3, 12, 9, '#f2c230', 1.3); [-3, 3].forEach(x => rrect(g, x - 1.6, -5, 3.2, 16, 1, '#3a2a24', 0)); ball(g, -8, 1, 1.6, INK, 0); },
  });
}
// les clés d'icône pour les éléments, les intentions, les états, les salles, les reliques, les donjons
const ELEM_IK = { acide: 'acid', contondant: 'hammer', froid: 'cold', feu: 'fire', force: 'force', foudre: 'bolt', necrotique: 'necro', perforant: 'arrow', poison: 'poison', psychique: 'psy', radiant: 'sun', tranchant: 'slash', tonnerre: 'thunder' };
const INT_IK = { atk: 'sword', multi: 'swords', aoe: 'boom', drain: 'blood', block: 'shield', heal: 'heart', buff: 'up', fear: 'fear', fearall: 'fear', stun: 'dizzy', poison: 'poison', poisonall: 'poison', steal: 'purse', summon: 'horn',
  execute: 'axe', smash: 'hammer', cocoon: 'web', serve: 'teapot', roots: 'root', shatter: 'crystal', raise: 'coffin', souldrain: 'soul', round: 'mug', throw: 'mug', grab: 'tongue', spawn: 'egg', swarm: 'bat', charm: 'charm', blind: 'sun', petrify: 'eye', tailall: 'boom', toxic: 'poison', mist: 'cloud', decree: 'crown', wind: 'warn', heavy: 'hammer' };
const NODE_IK = { combat: 'swords', elite: 'skull', tresor: 'chest', repos: 'campfire', event: 'question', boss: 'crown' };
const RELIC_IK = { grimoireys: 'book', chope: 'mug', champi: 'mushroom', cape: 'bat', gland: 'acorn', pierre: 'stone', couronne: 'crown' };
const POW_IK = { riposte: 'shield', rage: 'up', venin: 'poison', service: 'teapot', ecorce: 'root', cristal: 'crystal', sceau: 'lock' };
const DG_IK = { morgrave: 'skull', septbieres: 'mug', moussues: 'mushroom', ombrelune: 'bat', foret: 'pine', grotte: 'crystal', ruines: 'temple' };
// l'icône d'une carte : son arme (et son élément) si elle frappe, son effet principal sinon
function cardIk(D, el) {
  if (D === CARD_BASE.frappe || D === CARD_BASE.griffe) return D === CARD_BASE.griffe ? 'claw' : (el && ELEM_IK[el] && !PHYS.includes(el) ? ELEM_IK[el] : 'sword');
  if (D === CARD_BASE.parade) return 'shield'; if (D === CARD_BASE.legende) return 'legend';
  if (D.dmg != null) return el && ELEM_IK[el] && !PHYS.includes(el) ? ELEM_IK[el] : D.tgt === 'allfoes' || D.hits > 1 ? 'boom' : el === 'contondant' ? 'hammer' : el === 'perforant' ? 'arrow' : 'sword';
  if (D.revive) return 'heal2'; if (D.heal != null) return 'heart'; if (D.blk != null) return 'shield'; if (D.evade) return 'feather'; if (D.decoy) return 'pumpkin'; if (D.trap) return 'trap';
  if (D.stun) return 'dizzy'; if (D.weak) return 'down'; if (D.confuse) return 'psy'; if (D.bribe || D.loot) return 'purse'; if (D.poison) return 'poison'; if (D.buff) return 'up';
  if (D.calm != null) return 'calm'; if (D.nrg) return 'energy'; if (D.draw) return 'cards'; return 'spark';
}
// une icône dans le texte
const gi = (k, cls = '') => ICON_DRAW[k] ? `<img class="gi ${cls}" alt="" src="${iconURL(k)}">` : '';
// les émojis les plus courants deviennent des icônes dessinées, partout où on les affiche (chroniques, pastilles, infobulles…)
const EMO_IK = { '⚔️': 'swords', '🗡️': 'sword', '🛡️': 'shield', '❤️': 'heart', '💚': 'heart', '💔': 'heart', '✨': 'spark', '⭐': 'tier', '🌟': 'legend', '💥': 'boom', '🩸': 'blood', '💀': 'skull', '☠️': 'poison', '👻': 'ghost', '😱': 'fear', '💫': 'dizzy', '👛': 'purse', '📯': 'horn',
  '🔥': 'fire', '❄️': 'cold', '⚡': 'bolt', '🧪': 'poison', '☀️': 'sun', '🌀': 'psy', '🌫️': 'cloud', '💨': 'feather', '🎯': 'target', '🪤': 'trap', '🎃': 'pumpkin', '💰': 'gold', '🪵': 'mat', '🟠': 'amber', '🎁': 'gift', '👑': 'crown', '🃏': 'cards', '🎒': 'bag', '⚒️': 'anvil',
  '🚪': 'door', '🏳️': 'flag', '🏴': 'flag', '⏳': 'hourglass', '🏆': 'trophy', '📕': 'book', '🍺': 'mug', '🍻': 'mug', '🍄': 'mushroom', '🦇': 'bat', '🌰': 'acorn', '🪨': 'stone', '🌲': 'pine', '🔒': 'lock', '📌': 'pin', 'ℹ️': 'info', '🏃': 'door',
  '🌙': 'night', '🗺️': 'raid', '🔨': 'hammer', '🪓': 'axe', '🏹': 'arrow', '🐾': 'path', '🍲': 'food', '🛏️': 'beds', '🕯️': 'amb', '🥚': 'egg', '🫖': 'teapot', '👅': 'tongue', '💘': 'charm', '👁️': 'eye', '😌': 'calm', '💪': 'up', '🥴': 'down',
  '🪦': 'coffin', '⚰️': 'coffin', '💎': 'crystal', '🕸️': 'web', '🌱': 'root', '🧊': 'cold', '🔥': 'fire', '🎉': 'trophy', '🌾': 'food', '⛓️': 'lock', '🧭': 'map', '🔭': 'map', '🏺': 'gift', '🧩': 'build', '📐': 'map', '🪑': 'beds', '📦': 'gift', '🚫': 'lock', '🤝': 'hand', '🔔': 'horn', '🪜': 'stairs', '🚚': 'door' };
// le reste de l'interface : menus, château, Grimoire, humeurs, cartes des rivaux
Object.assign(EMO_IK, { '🏰': 'castle', '🏯': 'castle', '🗼': 'castle', '📖': 'bookopen', '📚': 'book', '📒': 'book', '📕': 'book', '🎲': 'dice', '📜': 'scroll', '🏛️': 'temple', '⛪': 'temple', '✅': 'check', '⬜': 'box', '❌': 'cross', '➕': 'plus',
  '⚠️': 'warn', '👀': 'eyes', '🗿': 'statue', '💭': 'thought', '💬': 'speech', '🎩': 'tophat', '🧱': 'bricks', '🚧': 'bricks', '🤕': 'bandage', '🩹': 'bandage', '💾': 'save', '🌐': 'globe', '✍️': 'quill', '📝': 'quill',
  '🌿': 'leaf', '🍃': 'leaf', '🌳': 'tree', '🧳': 'suitcase', '⚙️': 'gear', '🤖': 'gear', '🍖': 'meat', '🍗': 'meat', '🍽️': 'food', '💡': 'bulb', '😠': 'grumpy', '😡': 'grumpy', '😤': 'grumpy', '💢': 'anger', '🔮': 'orb',
  '🦴': 'bone', '📍': 'pin', '👋': 'hand', '✋': 'hand', '😬': 'oops', '📂': 'folder', '🗂️': 'folder', '🏠': 'house', '🎨': 'palette', '📋': 'clipboard', '🗳️': 'ballot', '🗝️': 'key', '🔑': 'key', '📥': 'inbox',
  '🤫': 'shush', '🔦': 'torch', '🥊': 'glove', '🍌': 'banana', '💛': 'heart', '💞': 'heart', '💗': 'heart', '💖': 'heart', '♥️': 'heart', '🤍': 'heartoff', '📬': 'mail', '✉️': 'mail', '🔊': 'sound', '🔈': 'mute', '🔇': 'mute',
  '🖼️': 'frame', '🏮': 'lantern', '📣': 'horn', '📢': 'horn', '🔗': 'link', '🏪': 'shop', '🏙️': 'town', '🔁': 'cycle', '🪙': 'gold', '🌑': 'night', '🌅': 'sun', '🗑️': 'trash', '🦁': 'claw', '⏩': 'fast', '⏸️': 'pause',
  '☁️': 'cloud', '🛠️': 'anvil', '🔧': 'hammer', '🐸': 'frog', '🎻': 'music', '🎹': 'music', '🎵': 'music', '🎶': 'music', '🎼': 'music', '🎤': 'music', '😈': 'devil', '🔎': 'magnify', '🔍': 'magnify', '🛌': 'beds', '🛋️': 'beds',
  '⚖️': 'scale', '🚶': 'path', '🍵': 'teapot', '🧲': 'magnet', '🏗️': 'build', '🙂': 'calm', '🕊️': 'feather', '🥇': 'medal1', '🥈': 'medal2', '🥉': 'medal3', '🎪': 'tent', '🫗': 'potion', '⚗️': 'potion', '🧉': 'potion',
  '🪄': 'wand', '⌛': 'hourglass', '🏁': 'flag', '🚩': 'flag', '😴': 'sleep', '💤': 'sleep', '😮‍💨': 'sleep', '🧹': 'broom', '🧣': 'cold', '🌊': 'cold', '🎭': 'mask', '📰': 'news', '😰': 'fear', '😨': 'fear', '❓': 'question',
  '🧸': 'charm', '🍎': 'apple', '🍀': 'clover', '🪳': 'bug', '🆕': 'spark', '🧠': 'psy', '🧙‍♀️': 'wand', '🧙': 'wand', '🪞': 'eye', '🧦': 'calm', '🌬️': 'feather', '🔱': 'arrow', '⛑️': 'shield', '🦷': 'claw', '🛒': 'chest',
  '🥬': 'cabbage', '🥒': 'cabbage', '🥕': 'carrot', '🍯': 'honey', '🐟': 'fish', '🐝': 'bee', '🪷': 'leaf', '🕳️': 'stone', '🟢': 'acid', '🧟': 'necro', '👹': 'grumpy', '🧝': 'charm', '🐺': 'claw', '🧚': 'spark', '🐀': 'claw', '🐍': 'poison', '👾': 'ghost' });
const EMO_RE = new RegExp('(' + Object.keys(EMO_IK).map(k => k.replace(/️/g, '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).sort((a, b) => b.length - a.length).join('|') + ')️?', 'gu');
const emoKey = m => { const k = EMO_IK[m] || EMO_IK[m.replace(/️/g, '')] || EMO_IK[m + '️']; return k && ICON_DRAW[k] ? k : null; };
const EMO_ONE = new RegExp(EMO_RE.source, 'u');
const iconize = html => String(html).replace(EMO_RE, m => { const k = emoKey(m); return k ? gi(k) : m; });
// un texte coupé en morceaux : du texte et des icônes
function emoParts(text) {
  text = String(text); const out = []; let last = 0;
  text.replace(EMO_RE, (m, _g, i) => { const k = emoKey(m); if (!k) return m; if (i > last) out.push(text.slice(last, i)); out.push({ k }); last = i + m.length; return m; });
  if (last < text.length) out.push(text.slice(last)); return out;
}
// sur la scène (canvas) : le texte et ses icônes dessinées, à l'alignement courant
function richWidth(c, text, sz) { return emoParts(text).reduce((w, p) => w + (typeof p === 'string' ? c.measureText(p).width : sz * 1.3), 0); }
function richText(c, text, x, y, sz, stroke) {
  if (!EMO_ONE.test(text)) { if (stroke) c.strokeText(text, x, y); c.fillText(text, x, y); return; }
  const parts = emoParts(text), al = c.textAlign, w = richWidth(c, text, sz), h = sz * 1.25;
  let cx = al === 'center' ? x - w / 2 : al === 'right' || al === 'end' ? x - w : x;
  const top = c.textBaseline === 'top' ? y - sz * .12 : c.textBaseline === 'middle' ? y - h / 2 : y - h * .82;
  c.textAlign = 'left';
  parts.forEach(p => {
    if (typeof p === 'string') { if (stroke) c.strokeText(p, cx, y); c.fillText(p, cx, y); cx += c.measureText(p).width; return; }
    const im = getSprite('icon', p.k, 2).img, sc = h / Math.max(im.width, im.height), iw = im.width * sc, ih = im.height * sc;
    c.drawImage(im, cx + (sz * 1.3 - iw) / 2, top + (h - ih) / 2, iw, ih); cx += sz * 1.3;
  });
  c.textAlign = al;
}
// dans les pages : tout émoji écrit dans un texte, d'où qu'il vienne, devient son sticker
const ICO_SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION|SELECT|TITLE|CANVAS|CODE|PRE|svg)$/;
function iconizeNode(n) {
  const s = n.nodeValue, p = n.parentNode; if (!s || !p || !EMO_ONE.test(s) || ICO_SKIP.test(p.nodeName) || (p.closest && p.closest('[data-noico],[contenteditable="true"]'))) return;
  const parts = emoParts(s); if (parts.length === 1 && typeof parts[0] === 'string') return;
  const fr = document.createDocumentFragment();
  parts.forEach(q => { if (typeof q === 'string') fr.appendChild(document.createTextNode(q)); else { const im = document.createElement('img'); im.className = 'gi'; im.alt = ''; im.draggable = false; im.src = iconURL(q.k); fr.appendChild(im); } });
  p.replaceChild(fr, n);
}
function iconizeTree(root) {
  if (!root) return; if (root.nodeType === 3) return iconizeNode(root); if (root.nodeType !== 1 || ICO_SKIP.test(root.nodeName)) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), L = []; while (w.nextNode()) if (EMO_ONE.test(w.currentNode.nodeValue)) L.push(w.currentNode);
  L.forEach(iconizeNode);
}
if (typeof document !== 'undefined' && typeof NodeFilter !== 'undefined' && document.body && document.body.nodeType === 1) {
  iconizeTree(document.body);
  new MutationObserver(R => R.forEach(r => { if (r.type === 'characterData') iconizeNode(r.target); else r.addedNodes.forEach(iconizeTree); })).observe(document.body, { childList: true, subtree: true, characterData: true });
}
