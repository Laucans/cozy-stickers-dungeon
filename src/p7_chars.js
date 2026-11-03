
/* =========================================================
   Personnages peints (grosses têtes, grands yeux, volumes ombrés)
   + cache de sprites (contour sombre unifié) + vignettes d'interface
   ========================================================= */
const CHAR = {
  diablotin: { sc: .78, skin: '#d9483f', body: '#a8322b', belly: '#ee8a6a', horns: '#f1e4c8', ears: 'pointy', eyes: 'derp', iris: '#f2c14e', mouth: 'grin', tail: '#a8322b', item: 'hammer' },
  gobelin:   { sc: .86, skin: '#86bd45', body: '#7d5f3d', ears: 'big', nose: 'big', eyes: 'derp', iris: '#e0a020', mouth: 'teeth', item: 'sack' },
  kobold:    { sc: .84, skin: '#df9446', body: '#62528a', ears: 'small', nose: 'snout', eyes: 'normal', iris: '#3a7a3a', mouth: 'grin', tail: '#df9446', item: 'wrench', hat: 'bandana', hatc: '#b83a33' },
  crapaud:   { special: 'toad' },
  gargouille:{ sc: .9, skin: '#9d9dad', body: '#82829a', wings: '#6c6c84', horns: '#d6d6de', ears: 'pointy', eyes: 'glow', mouth: 'fangs', nose: 'big' },
  menestrel: { sc: .95, skin: '#c9dfb8', body: '#8e4597', hat: 'feather', hatc: '#3a578f', eyes: 'derp', iris: '#5a3a8a', nose: 'long', mouth: 'grin', item: 'lute' },
  troll:     { sc: 1.3, skin: '#78a39c', body: '#6e5038', belly: '#e2d2ac', nose: 'huge', eyes: 'derp', iris: '#c9a020', mouth: 'tusks', ears: 'small', item: 'ladle', hair: '#3f6050', hairStyle: 'spiky' },
  fantome:   { special: 'ghost' },
  sorciere:  { sc: .95, skin: '#a3cc86', body: '#3a2b58', hat: 'witch', hatc: '#241d34', nose: 'long', eyes: 'normal', iris: '#b83a33', mouth: 'grin', item: 'broom', hair: '#c0402f', hairStyle: 'long' },
  squelette: { sc: .95, skin: '#ece6d6', body: '#ece6d6', ribs: true, eyes: 'sockets', mouth: 'teeth', nose: 'none', hat: 'helmet', hatc: '#8c7c56', item: 'sword' },
  orque:     { sc: 1.2, skin: '#6a954c', body: '#54432f', eyes: 'normal', iris: '#d03a2a', brow: true, mouth: 'tusks', nose: 'big', ears: 'pointy', hat: 'horned', hatc: '#6f7480', item: 'axe' },
  araignee:  { special: 'spider' },
  dragonnet: { special: 'dragon' },
  mimique:   { special: 'mimic' },
  vampire:   { skin: '#e2dcef', body: '#271f33', cape: '#8e2333', collar: true, hair: '#1b1626', hairStyle: 'slick', eyes: 'normal', iris: '#b8202a', brow: true, mouth: 'fangs', nose: 'small' },
};
const HERO_ART = {
  paladin: { sc: 1.02, skin: '#efc49b', body: '#b8bfca', hat: 'bucket', hatc: '#b8bfca', item: 'sword', cape: '#3a578f' },
  elfe:    { skin: '#f4d4b2', body: '#58924a', ears: 'long', hair: '#efc95e', hairStyle: 'long', item: 'bow', eyes: 'normal', iris: '#3a8a6a', mouth: 'smug' },
  mage:    { skin: '#efc49b', body: '#3a578f', hat: 'wizard', hatc: '#3a578f', beard: '#f1f1f1', item: 'staff', eyes: 'derp', iris: '#4a6ab0', nose: 'big' },
  voleuse: { skin: '#e5b38a', body: '#45434a', hat: 'hood', hatc: '#3a6446', item: 'dagger', eyes: 'normal', iris: '#6a4a2a', mouth: 'smug' },
  barbare: { sc: 1.15, skin: '#e2a274', body: '#7f532a', hair: '#c8502a', hairStyle: 'wild', beard: '#c8502a', item: 'axe', mouth: 'grin', eyes: 'derp', iris: '#3a6ab0' },
  paysan:  { skin: '#edbd8c', body: '#977149', hat: 'straw', hatc: '#e3c46e', item: 'pitchfork', eyes: 'derp', iris: '#6a4a2a', nose: 'big', mouth: 'o' },
};

function shadeIn(g, shape, bb, dark = 'rgba(40,18,40,.26)', light = 'rgba(255,250,232,.16)') {
  if (FLAT) return;
  const [x0, y0, x1, y1] = bb, w = x1 - x0, h = y1 - y0;
  g.save(); shape(); g.clip();
  g.fillStyle = dark; g.beginPath(); g.ellipse(x1 + w * .08, y1 + h * .1, w * .72, h * .78, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = light; g.beginPath(); g.ellipse(x0 + w * .26, y0 + h * .18, w * .28, h * .18, -.5, 0, Math.PI * 2); g.fill();
  g.restore();
}
function eye(g, x, y, s, iris = '#5a3a2a', look = [.5, .7]) {
  g.beginPath(); g.ellipse(x, y, 3.7 * s, 4.5 * s, 0, 0, Math.PI * 2); g.fillStyle = '#fbf8f1'; g.fill(); g.lineWidth = 1; g.strokeStyle = INK; g.stroke();
  g.save(); g.beginPath(); g.ellipse(x, y, 3.7 * s, 4.5 * s, 0, 0, Math.PI * 2); g.clip();
  const ix = x + look[0] * s, iy = y + look[1] * s;
  g.beginPath(); g.ellipse(ix, iy, 2.6 * s, 3.2 * s, 0, 0, Math.PI * 2); g.fillStyle = radial(g, ix, iy, 3 * s, iris); g.fill();
  g.beginPath(); g.ellipse(ix, iy + .3 * s, 1.3 * s, 1.75 * s, 0, 0, Math.PI * 2); g.fillStyle = '#120a08'; g.fill();
  g.fillStyle = 'rgba(70,35,35,.2)'; g.fillRect(x - 4 * s, y - 4.8 * s, 8 * s, 2.2 * s);
  g.restore();
  g.fillStyle = '#fff'; g.beginPath(); g.arc(ix - .95 * s, iy - 1 * s, .95 * s, 0, Math.PI * 2); g.fill(); g.beginPath(); g.arc(ix + .9 * s, iy + 1.2 * s, .45 * s, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(x, y, 3.7 * s, 4.5 * s, 0, Math.PI * 1.08, Math.PI * 1.92); g.lineWidth = 1.7; g.strokeStyle = INK; g.stroke();
}
const HX = 12.5, HY = -21;
const METAL = '#cfd4dc';
const ITEMS = {
  hammer: g => { inkLn(g, [[HX - 1, HY + 6], [HX + 4, HY - 16]], PAL.wood2, 2.4); rrect(g, HX - 3, HY - 23, 14, 7, 2, '#868b96'); },
  sack: g => { ell(g, -15, -32, 9, 10, '#a8824f'); ln(g, [[-19, -40], [-11, -40]], INK, 1.4); },
  wrench: g => { inkLn(g, [[HX, HY + 4], [HX + 5, HY - 16]], '#a3a8b2', 2.8); g.beginPath(); g.arc(HX + 6, HY - 19, 4.5, 0, Math.PI * 2); g.lineWidth = 3.4; g.strokeStyle = INK; g.stroke(); g.lineWidth = 1.9; g.strokeStyle = '#a3a8b2'; g.stroke(); },
  ladle: g => { inkLn(g, [[HX - 2, HY + 6], [HX + 4, HY - 20]], '#a3a8b2', 2.2); ell(g, HX + 5, HY - 22, 6, 4, '#a3a8b2'); },
  broom: g => { inkLn(g, [[HX - 20, HY + 18], [HX + 8, HY - 26]], PAL.wood2, 2.4); poly(g, [[HX - 24, HY + 14], [HX - 14, HY + 20], [HX - 22, HY + 30], [HX - 31, HY + 24]], PAL.straw); },
  lute: g => { inkLn(g, [[HX - 2, HY - 2], [HX + 10, HY - 22]], PAL.wood2, 2.4); ell(g, HX - 4, HY + 2, 8, 9, '#cf8f3a'); ball(g, HX - 4, HY + 1, 2.2, INK, 0); },
  sword: g => { inkLn(g, [[HX + 1, HY + 4], [HX + 6, HY - 30]], METAL, 3); inkLn(g, [[HX - 4, HY - 2], [HX + 7, HY]], PAL.gold, 2); },
  axe: g => { inkLn(g, [[HX, HY + 8], [HX + 4, HY - 24]], PAL.wood2, 2.6); g.beginPath(); g.moveTo(HX + 3, HY - 26); g.quadraticCurveTo(HX + 18, HY - 28, HX + 16, HY - 12); g.lineTo(HX + 4, HY - 16); g.closePath(); g.fillStyle = radial(g, HX + 12, HY - 20, 10, METAL); fi(g, g.fillStyle, 1); },
  bow: g => { g.beginPath(); g.moveTo(HX + 2, HY - 24); g.quadraticCurveTo(HX + 16, HY - 2, HX + 2, HY + 18); g.lineWidth = 4.2; g.strokeStyle = INK; g.stroke(); g.lineWidth = 2.2; g.strokeStyle = PAL.wood; g.stroke(); ln(g, [[HX + 2, HY - 24], [HX + 2, HY + 18]], '#f4f4f4', .9); },
  staff: g => { inkLn(g, [[HX - 1, HY + 20], [HX + 3, HY - 38]], PAL.wood2, 2.4); ball(g, HX + 3, HY - 41, 5, '#7fc4f0'); },
  dagger: g => { inkLn(g, [[HX + 1, HY + 2], [HX + 5, HY - 12]], METAL, 2.4); inkLn(g, [[HX - 3, HY], [HX + 5, HY + 2]], PAL.wood2, 1.6); },
  pitchfork: g => { inkLn(g, [[HX - 1, HY + 20], [HX + 3, HY - 34]], PAL.wood2, 2.2); [-4, 0, 4].forEach(d => inkLn(g, [[HX + 3 + d, HY - 34], [HX + 3 + d * 1.1, HY - 44]], '#a3a8b2', 1.4)); inkLn(g, [[HX - 1, HY - 34], [HX + 7, HY - 34]], '#a3a8b2', 1.4); },
};
function hairShine(g, pts) { ln(g, pts, 'rgba(255,250,235,.35)', 1.4); }
function head(g, s, hx, hy) {
  const sk = s.skin;
  if (s.hat === 'hood') ell(g, hx, hy + 1, 16, 15.5, s.hatc);
  if (s.hair && s.hairStyle === 'long') poly(g, [[hx - 14, hy - 4], [hx + 14, hy - 4], [hx + 15, hy + 15], [hx - 15, hy + 15]], s.hair);
  if (s.ears === 'pointy') { poly(g, [[hx - 11, hy - 1], [hx - 23, hy - 9], [hx - 12, hy + 6]], sk); poly(g, [[hx + 11, hy - 1], [hx + 23, hy - 9], [hx + 12, hy + 6]], sk); }
  if (s.ears === 'big') { poly(g, [[hx - 10, hy - 3], [hx - 27, hy - 13], [hx - 22, hy + 3], [hx - 11, hy + 6]], sk); poly(g, [[hx + 10, hy - 3], [hx + 27, hy - 13], [hx + 22, hy + 3], [hx + 11, hy + 6]], sk); ln(g, [[hx - 13, hy], [hx - 22, hy - 7]], shade(sk, -.25), 1.2); ln(g, [[hx + 13, hy], [hx + 22, hy - 7]], shade(sk, -.25), 1.2); }
  if (s.ears === 'long') { poly(g, [[hx - 11, hy - 1], [hx - 21, hy - 17], [hx - 12, hy + 5]], sk); poly(g, [[hx + 11, hy - 1], [hx + 21, hy - 17], [hx + 12, hy + 5]], sk); }
  if (s.ears === 'small') { ball(g, hx - 12, hy, 4, sk); ball(g, hx + 12, hy, 4, sk); }
  ball(g, hx, hy, 13, sk, 1.2);
  shadeIn(g, () => { g.beginPath(); g.arc(hx, hy, 13, 0, Math.PI * 2); }, [hx - 13, hy - 13, hx + 13, hy + 13]);
  if (s.horns) { poly(g, [[hx - 8, hy - 9], [hx - 14, hy - 22], [hx - 3, hy - 12]], s.horns); poly(g, [[hx + 8, hy - 9], [hx + 14, hy - 22], [hx + 3, hy - 12]], s.horns); }
  if (s.hair && s.hairStyle === 'spiky') { poly(g, [[hx - 11, hy - 6], [hx - 8, hy - 17], [hx - 3, hy - 10], [hx, hy - 19], [hx + 4, hy - 10], [hx + 9, hy - 17], [hx + 11, hy - 6]], s.hair); hairShine(g, [[hx - 5, hy - 9], [hx - 1, hy - 14]]); }
  if (s.hair && s.hairStyle === 'slick') { g.beginPath(); g.arc(hx, hy, 13.4, Math.PI * 1.02, Math.PI * 1.98); g.lineTo(hx + 2, hy - 6); g.lineTo(hx, hy - 3); g.closePath(); fi(g, s.hair, 1); hairShine(g, [[hx - 8, hy - 8], [hx - 2, hy - 11]]); }
  if (s.hair && s.hairStyle === 'long') { g.beginPath(); g.arc(hx, hy, 13.4, Math.PI, 0); g.quadraticCurveTo(hx + 2, hy - 8, hx - 13.4, hy); g.fillStyle = radial(g, hx - 4, hy - 8, 14, s.hair); fi(g, g.fillStyle, 1); g.strokeStyle = outl(s.hair); hairShine(g, [[hx - 9, hy - 6], [hx - 3, hy - 11], [hx + 4, hy - 11]]); }
  if (s.hair && s.hairStyle === 'wild') { poly(g, [[hx - 15, hy + 3], [hx - 15, hy - 9], [hx - 8, hy - 17], [hx, hy - 19], [hx + 9, hy - 17], [hx + 16, hy - 9], [hx + 15, hy + 3], [hx + 10, hy - 6], [hx - 10, hy - 6]], s.hair); hairShine(g, [[hx - 9, hy - 10], [hx - 3, hy - 15]]); }
  const e = s.eyes || 'normal';
  if (s.hat !== 'bucket') {
    if (e === 'glow') { ell(g, hx - 4.6, hy - 2, 3.4, 2.2, '#ffe07a', 1); ell(g, hx + 4.6, hy - 2, 3.4, 2.2, '#ffe07a', 1); }
    else if (e === 'sockets') { ell(g, hx - 4.6, hy - 2, 3.4, 3.9, '#241812', .8); ell(g, hx + 4.6, hy - 2, 3.4, 3.9, '#241812', .8); ball(g, hx - 4.6, hy - 2, 1.1, '#ffd26a', 0); ball(g, hx + 4.6, hy - 2, 1.1, '#ffd26a', 0); }
    else if (e === 'derp') { eye(g, hx - 4.8, hy - 2, 1.1, s.iris, [.9, .8]); eye(g, hx + 4.8, hy - 2, .82, s.iris, [-.5, 1.2]); }
    else { eye(g, hx - 4.6, hy - 2, .95, s.iris, [.7, .8]); eye(g, hx + 4.6, hy - 2, .95, s.iris, [.7, .8]); }
    if (!s.ribs && e !== 'glow') { ell(g, hx - 8, hy + 4, 3, 1.7, 'rgba(235,110,120,.35)', 0); ell(g, hx + 8, hy + 4, 3, 1.7, 'rgba(235,110,120,.35)', 0); }
  }
  if (s.brow) { ln(g, [[hx - 9, hy - 9], [hx - 2, hy - 6]], INK, 2.2); ln(g, [[hx + 9, hy - 9], [hx + 2, hy - 6]], INK, 2.2); }
  if (s.beard) { poly(g, [[hx - 11, hy + 3], [hx + 11, hy + 3], [hx + 9, hy + 15], [hx, hy + 24], [hx - 9, hy + 15]], s.beard); hairShine(g, [[hx - 4, hy + 8], [hx - 2, hy + 16]]); }
  const n = s.nose || 'small', ns = shade(sk, -.12);
  if (n === 'big') ell(g, hx + 1, hy + 3.5, 4.4, 3.8, ns, 1.1);
  else if (n === 'huge') ell(g, hx + 1, hy + 4, 6.8, 5.2, ns, 1.1);
  else if (n === 'long') poly(g, [[hx - 1, hy], [hx + 10, hy + 7], [hx + 1, hy + 5]], ns, 1);
  else if (n === 'snout') { ell(g, hx + 2, hy + 5, 7.5, 4.6, shade(sk, .12), 1.1); ball(g, hx, hy + 4, .9, INK, 0); ball(g, hx + 4, hy + 4, .9, INK, 0); }
  else if (n === 'small') ln(g, [[hx + 1, hy + 2], [hx + 2, hy + 4]], shade(sk, -.4), 1.2);
  const m = s.mouth || 'grin', my = hy + 8.5;
  if (s.hat === 'bucket') { /* bouche cachée */ }
  else if (m === 'grin') { g.beginPath(); g.arc(hx, my - 3.5, 4.6, .2 * Math.PI, .8 * Math.PI); g.closePath(); g.fillStyle = '#6a2a2a'; g.fill(); g.strokeStyle = INK; g.lineWidth = 1.2; g.stroke(); ell(g, hx + .5, my + .2, 1.8, .9, '#e0707a', 0); }
  else if (m === 'teeth') { g.beginPath(); g.ellipse(hx, my - .5, 5.5, 3, 0, 0, Math.PI); g.closePath(); fi(g, '#fffaf0', 1); ln(g, [[hx - 2, my - .5], [hx - 2, my + 2]], INK, .7); ln(g, [[hx + 2, my - .5], [hx + 2, my + 2]], INK, .7); }
  else if (m === 'tusks') { ln(g, [[hx - 5, my], [hx + 5, my]], INK, 1.5); poly(g, [[hx - 5, my], [hx - 3, my], [hx - 4.5, my - 5]], '#fffaf0', .8); poly(g, [[hx + 5, my], [hx + 3, my], [hx + 4.5, my - 5]], '#fffaf0', .8); }
  else if (m === 'fangs') { g.beginPath(); g.arc(hx, my - 3, 4, .2 * Math.PI, .8 * Math.PI); g.strokeStyle = INK; g.lineWidth = 1.3; g.stroke(); poly(g, [[hx - 3, my - .2], [hx - 1.6, my], [hx - 2.4, my + 3]], '#fff', .6); poly(g, [[hx + 3, my - .2], [hx + 1.6, my], [hx + 2.4, my + 3]], '#fff', .6); }
  else if (m === 'smug') ln(g, [[hx - 3, my - 1], [hx + 4, my - 2]], INK, 1.4);
  else if (m === 'o') ell(g, hx + 1, my - .5, 2, 2.4, '#5a2222', .9);
  const hc = s.hatc;
  if (s.hat === 'wizard') { ell(g, hx, hy - 9, 18, 4.5, hc); poly(g, [[hx - 11, hy - 10], [hx + 11, hy - 10], [hx + 5, hy - 38]], hc); ball(g, hx + 1, hy - 20, 2, PAL.gold, .6); ball(g, hx + 4, hy - 28, 1.4, PAL.gold, .5); }
  else if (s.hat === 'witch') { ell(g, hx, hy - 9, 19, 4.5, hc); poly(g, [[hx - 10, hy - 10], [hx + 10, hy - 10], [hx + 6, hy - 27], [hx + 17, hy - 33], [hx + 1, hy - 29]], hc); ln(g, [[hx - 9, hy - 13], [hx + 9, hy - 13]], '#7550b0', 2.4); }
  else if (s.hat === 'helmet' || s.hat === 'horned') {
    g.beginPath(); g.arc(hx, hy - 2, 14, Math.PI, 0); g.closePath(); g.fillStyle = radial(g, hx - 4, hy - 9, 14, hc); fi(g, g.fillStyle, 1.1); rrect(g, hx - 1.6, hy - 3, 3.2, 9, 1, hc, .9);
    if (s.hat === 'horned') { poly(g, [[hx - 12, hy - 8], [hx - 22, hy - 22], [hx - 8, hy - 13]], PAL.cream); poly(g, [[hx + 12, hy - 8], [hx + 22, hy - 22], [hx + 8, hy - 13]], PAL.cream); }
  }
  else if (s.hat === 'bucket') { rrect(g, hx - 14, hy - 16, 28, 27, 5, hc, 1.1); ln(g, [[hx - 9, hy - 3], [hx + 9, hy - 3]], INK, 2.4); [-4, 0, 4].forEach(d => ball(g, hx + d, hy + 4, .9, INK, 0)); poly(g, [[hx - 2, hy - 22], [hx + 2, hy - 22], [hx + 4, hy - 14], [hx - 4, hy - 14]], PAL.red, .9); }
  else if (s.hat === 'hood') { g.beginPath(); g.arc(hx, hy, 15, Math.PI * 1.04, Math.PI * 1.96); g.lineWidth = 6; g.strokeStyle = INK; g.stroke(); g.lineWidth = 3.8; g.strokeStyle = hc; g.stroke(); }
  else if (s.hat === 'straw') { ell(g, hx, hy - 8, 21, 5.5, hc); ell(g, hx, hy - 13, 10, 6, hc); ln(g, [[hx - 9, hy - 10], [hx + 9, hy - 10]], PAL.red, 2); }
  else if (s.hat === 'feather') { ell(g, hx + 2, hy - 11, 14, 6, hc); g.beginPath(); g.moveTo(hx + 8, hy - 13); g.quadraticCurveTo(hx + 20, hy - 30, hx + 26, hy - 26); g.quadraticCurveTo(hx + 16, hy - 22, hx + 9, hy - 11); fi(g, PAL.red, 1); }
  else if (s.hat === 'bandana') { rrect(g, hx - 13, hy - 10, 26, 6, 3, hc, 1); poly(g, [[hx - 12, hy - 8], [hx - 21, hy - 4], [hx - 18, hy - 11]], hc, .9); }
}
function humanoid(g, s) {
  const k = s.sc || 1; g.save(); g.scale(k, k);
  const sk = s.skin, bd = s.body;
  if (s.cape) poly(g, [[-12, -35], [12, -35], [16, -3], [-16, -3]], s.cape);
  if (s.tail) { inkLn(g, [[6, -8], [18, -6], [22, -16]], s.tail, 2.8); poly(g, [[19, -18], [26, -21], [24, -13]], s.tail, .9); }
  if (s.wings) { poly(g, [[-6, -31], [-30, -46], [-25, -30], [-31, -22], [-8, -21]], s.wings); poly(g, [[6, -31], [30, -46], [25, -30], [31, -22], [8, -21]], s.wings); }
  const leg = s.legs || shade(bd, -.35);
  rrect(g, -9, -11, 7, 11, 3, leg); rrect(g, 2, -11, 7, 11, 3, leg);
  ell(g, -5.5, -1, 4.6, 2.2, shade(leg, -.2), .8); ell(g, 5.5, -1, 4.6, 2.2, shade(leg, -.2), .8);
  ell(g, 0, -21, 12.5, 12.5, bd, 1.2);
  shadeIn(g, () => { g.beginPath(); g.ellipse(0, -21, 12.5, 12.5, 0, 0, Math.PI * 2); }, [-12.5, -33.5, 12.5, -8.5]);
  if (s.belly) ell(g, 0, -18, 7, 6.5, s.belly, .8);
  if (s.ribs) { [-25, -21, -17].forEach(y => ln(g, [[-7, y], [7, y]], '#6a5a4a', 1.3)); ln(g, [[0, -31], [0, -12]], '#6a5a4a', 1.3); }
  ln(g, [[-6, -11], [0, -9], [6, -11]], 'rgba(30,15,10,.25)', 1.2);
  if (s.collar) { poly(g, [[-13, -32], [-4, -29], [-17, -46]], s.cape); poly(g, [[13, -32], [4, -29], [17, -46]], s.cape); }
  ball(g, -12.5, -21, 4.2, sk);
  if (s.item) ITEMS[s.item](g);
  ball(g, 12.5, -21, 4.2, sk);
  head(g, s, 0, -43);
  g.restore();
}
const SPECIALS = {
  ghost: g => {
    g.save(); g.translate(0, -6);
    g.beginPath(); g.moveTo(-14, -6); g.lineTo(-14, -32); g.arc(0, -32, 14, Math.PI, 0); g.lineTo(14, -6);
    for (let i = 0; i < 4; i++) { const x0 = 14 - i * 7; g.quadraticCurveTo(x0 - 1.5, 1, x0 - 3.5, -4); g.quadraticCurveTo(x0 - 5.5, -8, x0 - 7, -5); }
    g.closePath(); g.fillStyle = radial(g, -4, -34, 22, '#e8f0ff'); fi(g, g.fillStyle, 1.1);
    ell(g, -17, -26, 4, 6, '#e8f0ff'); ell(g, 17, -26, 4, 6, '#e8f0ff');
    ell(g, -5, -34, 2.8, 4.2, '#1e1830', 0); ell(g, 5, -34, 2.8, 4.2, '#1e1830', 0); ball(g, -5.8, -35.5, .9, '#fff', 0); ball(g, 4.2, -35.5, .9, '#fff', 0);
    ell(g, 0, -24, 3, 4, '#3a2a4a', .8); ell(g, -9, -29, 2.6, 1.4, 'rgba(160,170,255,.4)', 0); ell(g, 9, -29, 2.6, 1.4, 'rgba(160,170,255,.4)', 0);
    g.restore();
  },
  spider: g => {
    for (let i = 0; i < 4; i++) { const y = -18 + i * 4; [-1, 1].forEach(sd => { g.beginPath(); g.moveTo(sd * 8, y); g.quadraticCurveTo(sd * (22 + i * 2), y - 14, sd * (24 + i * 2), y + 16); g.lineWidth = 4.2; g.strokeStyle = INK; g.stroke(); g.lineWidth = 2.2; g.strokeStyle = '#4b3a5a'; g.stroke(); }); }
    ell(g, 0, -24, 15, 13, '#5b4670', 1.2); shadeIn(g, () => { g.beginPath(); g.ellipse(0, -24, 15, 13, 0, 0, Math.PI * 2); }, [-15, -37, 15, -11]);
    ell(g, 0, -13, 11, 9, '#4b3a5a', 1.1);
    eye(g, -4.5, -15, .85, '#d03a8a', [.5, .6]); eye(g, 4.5, -15, .85, '#d03a8a', [.3, .6]); ball(g, -9, -19, 1.8, '#fff', .7); ball(g, 9, -19, 1.8, '#fff', .7);
    poly(g, [[-3, -8], [-1, -8], [-2, -4]], '#fff', .7); poly(g, [[3, -8], [1, -8], [2, -4]], '#fff', .7);
    [[-6, -32], [2, -35], [8, -30]].forEach(([x, y]) => ln(g, [[x, y], [x + 1, y - 4]], INK, 1.1));
  },
  toad: g => {
    ell(g, -12, -3, 6, 3.5, '#5f9440'); ell(g, 12, -3, 6, 3.5, '#5f9440');
    ell(g, 0, -13, 18, 13, '#73ad52', 1.2); shadeIn(g, () => { g.beginPath(); g.ellipse(0, -13, 18, 13, 0, 0, Math.PI * 2); }, [-18, -26, 18, 0]);
    ell(g, 0, -9, 11, 6.5, '#e2ecaa', .8);
    [-8, 8].forEach(x => { ball(g, x, -25, 6.5, '#73ad52', 1.1); eye(g, x, -25.5, .85, '#c9a020', [.3, .5]); });
    g.beginPath(); g.arc(0, -19, 11, .15 * Math.PI, .85 * Math.PI); g.strokeStyle = INK; g.lineWidth = 1.5; g.stroke();
    ell(g, -10, -15, 2.4, 1.4, 'rgba(235,110,120,.45)', 0); ell(g, 10, -15, 2.4, 1.4, 'rgba(235,110,120,.45)', 0);
  },
  dragon: g => {
    inkLn(g, [[-8, -8], [-20, -6], [-26, -16]], '#ec8636', 3.6); poly(g, [[-27, -19], [-31, -12], [-23, -14]], '#c95f26', .9);
    poly(g, [[-4, -26], [-22, -42], [-18, -26], [-24, -20], [-4, -18]], '#c95f26');
    ell(g, 0, -16, 13, 11, '#ec8636', 1.2); shadeIn(g, () => { g.beginPath(); g.ellipse(0, -16, 13, 11, 0, 0, Math.PI * 2); }, [-13, -27, 13, -5]);
    ell(g, 3, -13, 7, 6, '#f2d36a', .8); ell(g, -6, -4, 4, 3, '#ec8636', 1); ell(g, 7, -4, 4, 3, '#ec8636', 1);
    poly(g, [[4, -40], [6, -48], [9, -41]], PAL.cream, .9); poly(g, [[11, -40], [15, -47], [15, -39]], PAL.cream, .9);
    ball(g, 9, -32, 10, '#ec8636', 1.2); ell(g, 17, -29, 7, 5, '#f29a56', 1); ball(g, 20, -30, .9, INK, 0);
    eye(g, 9, -34, .8, '#2a8a4a', [.6, .5]);
    ln(g, [[24, -32], [28, -36]], 'rgba(200,200,200,.6)', 2); ln(g, [[25, -28], [30, -29]], 'rgba(200,200,200,.6)', 2);
  },
  mimic: g => {
    box(g, 0, 0, .52, .36, 16, 0, '#7e4e2a', 'wood');
    poly(g, [pt(-.26, -.18, 16), pt(.26, -.18, 16), pt(.26, -.18, 36), pt(-.26, -.18, 36)], '#6e4226');
    poly(g, [pt(-.24, -.16, 16.5), pt(.24, -.16, 16.5), pt(.24, .16, 16.5), pt(-.24, .16, 16.5)], '#6e1a26', .8);
    for (let i = 0; i < 5; i++) { const [a, b] = pt(-.2 + i * .1, .17, 16); poly(g, [[a - 3, b], [a + 3, b], [a, b - 6]], '#fff', .7); }
    for (let i = 0; i < 4; i++) { const [a, b] = pt(-.15 + i * .1, -.17, 18); poly(g, [[a - 3, b], [a + 3, b], [a, b + 5]], '#fff', .7); }
    [-.12, .12].forEach(x => { const [a, b] = pt(x, -.18, 30); eye(g, a, b, .8, '#e9b949', [0, .4]); });
    poly(g, [pt(-.05, .02, 17), pt(.1, .1, 17), pt(.04, .2, 15)], '#e0607a', .8);
  },
};
function drawChar(g, s) { if (s.special) SPECIALS[s.special](g); else humanoid(g, s); }

/* ---------- cache de sprites ---------- */
const SPR = new Map();
const SQ = () => Math.min(3.4, 2 * (window.devicePixelRatio || 1));
// personnages : sticker plat (liseré blanc + ombre portée douce)
function stickerize(src, r) {
  const w = src.width, h = src.height, m = mk(w, h), mg = m.getContext('2d');
  for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; mg.drawImage(src, Math.cos(a) * r, Math.sin(a) * r); }
  const sh = mk(w, h), sg = sh.getContext('2d'); sg.drawImage(m, 0, 0); sg.globalCompositeOperation = 'source-in'; sg.fillStyle = 'rgba(20,10,8,.35)'; sg.fillRect(0, 0, w, h);
  mg.globalCompositeOperation = 'source-in'; mg.fillStyle = '#fffdf5'; mg.fillRect(0, 0, w, h);
  const out = mk(w, h), og = out.getContext('2d'); og.drawImage(sh, 0, r * .9); og.drawImage(m, 0, 0); og.drawImage(src, 0, 0); return out;
}
function outlined(src, r, col) {
  const w = src.width, h = src.height, m = mk(w, h), mg = m.getContext('2d');
  for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; mg.drawImage(src, Math.cos(a) * r, Math.sin(a) * r); }
  mg.globalCompositeOperation = 'source-in'; mg.fillStyle = col; mg.fillRect(0, 0, w, h);
  mg.globalCompositeOperation = 'source-over'; mg.drawImage(src, 0, 0); return m;
}
function cropSprite(c, ax, ay) {
  const g = c.getContext('2d'), w = c.width, h = c.height; let d;
  try { d = g.getImageData(0, 0, w, h).data; } catch (e) { return { img: c, ax, ay }; }
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[(y * w + x) * 4 + 3] > 6) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  if (x1 < 0) return { img: c, ax, ay };
  x0 = Math.max(0, x0 - 1); y0 = Math.max(0, y0 - 1);
  const o = mk(x1 - x0 + 3, y1 - y0 + 3); o.getContext('2d').drawImage(c, -x0, -y0);
  return { img: o, ax: ax - x0, ay: ay - y0 };
}
function drawArt(kind, key, g) {
  if (kind === 'furn') (FDRAW[key] || FDRAW[(FURN[key] || {}).sprite] || FDRAW.caisse)(g); else if (kind === 'def') (DDRAW[key] || DDRAW[(DEFS[key] || {}).sprite] || DDRAW.porte)(g); else if (kind === 'x') XDRAW[key](g);
  else if (kind === 'char') drawChar(g, CHAR[key] || CHAR.gobelin); else if (kind === 'hero') drawChar(g, HERO_ART[key] || HERO_ART.paladin); else if (kind === 'icon') ICON_DRAW[key](g);
}
// ppa = pixels réels par unité d'art ; ax/ay = position de l'ancre (pied ou centre de case) dans l'image
function getSprite(kind, key, ppa = SQ()) {
  const id = kind + ':' + key + '@' + ppa.toFixed(2);
  let s = SPR.get(id); if (s) return s;
  const bb = kind === 'icon' ? [-22, -24, 22, 22] : (kind === 'char' || kind === 'hero') ? [-42, -104, 42, 14] : kind === 'x' ? [-52, -130, 52, 32] : [-52, -110, 52, 32];
  const pad = 6, c = mk((bb[2] - bb[0] + pad * 2) * ppa, (bb[3] - bb[1] + pad * 2) * ppa), g = c.getContext('2d');
  g.setTransform(ppa, 0, 0, ppa, (pad - bb[0]) * ppa, (pad - bb[1]) * ppa);
  const person = kind === 'char' || kind === 'hero';
  FLAT = person;
  try { drawArt(kind, key, g); } catch (e) { console.error('dessin', kind, key, e); }
  FLAT = false;
  const o = kind === 'icon' ? c : person ? stickerize(c, Math.max(1.5, 2.4 * ppa)) : outlined(c, Math.max(1, .9 * ppa), 'rgba(24,14,10,.92)');
  s = cropSprite(o, (pad - bb[0]) * ppa, (pad - bb[1]) * ppa);
  SPR.set(id, s); return s;
}
const THUMBS = new Map();
function thumb(kind, key, big) {
  const id = kind + key + (big ? 'B' : '');
  if (!THUMBS.has(id)) THUMBS.set(id, getSprite(kind, key, big ? 3 : 1.7).img.toDataURL());
  return THUMBS.get(id);
}
function iconURL(key) { return thumb('icon', key, true); }
// portrait : tête et épaules seulement
function portrait(sp) {
  const id = 'portrait' + sp; if (THUMBS.has(id)) return THUMBS.get(id);
  const s = getSprite('char', sp, 3), h = Math.min(s.img.height, Math.round(s.img.width * 1.05));
  const c = mk(s.img.width, h); c.getContext('2d').drawImage(s.img, 0, 0);
  const url = c.toDataURL(); THUMBS.set(id, url); return url;
}
function roomThumb(t) {
  const id = 'room' + t; if (THUMBS.has(id)) return THUMBS.get(id);
  const d = ROOMS[t], [w, h] = d.size, tw = 34, th = 17, wh = d.open ? 4 : 14;
  const cw = (w + h) * tw / 2 + 10, ch = (w + h) * th / 2 + wh + 10, k = 2;
  const c = mk(cw * k, ch * k), g = c.getContext('2d'); g.scale(k, k);
  const ox = 5 + h * tw / 2, oy = 5 + wh, P2 = (x, y) => [ox + (x - y) * tw / 2, oy + (x + y) * th / 2];
  const tex = roomTexture({ id: 'thumb-' + t, t, w, h, built: true });
  g.save(); g.transform(tw / 2 / TEXT, th / 2 / TEXT, -tw / 2 / TEXT, th / 2 / TEXT, ox, oy); g.drawImage(tex, 0, 0); g.restore();
  if (t !== 'couloir') {
    const wt = texWall(d.open ? 'hedge' : 'full', 0), A = P2(0, 0), B = P2(w, 0), L = P2(0, h);
    g.save(); g.transform((B[0] - A[0]) / wt.width, (B[1] - A[1]) / wt.width, 0, wh / wt.height, A[0], A[1] - wh); g.drawImage(wt, 0, 0); g.restore();
    g.save(); g.transform((L[0] - A[0]) / wt.width, (L[1] - A[1]) / wt.width, 0, wh / wt.height, A[0], A[1] - wh); g.drawImage(wt, 0, 0); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(0, 0, wt.width, wt.height); g.restore();
  }
  path(g, [P2(0, 0), P2(w, 0), P2(w, h), P2(0, h)]); g.strokeStyle = 'rgba(20,12,8,.8)'; g.lineWidth = 1; g.stroke();
  const url = c.toDataURL(); THUMBS.set(id, url); return url;
}
/* ---------- ajouts : créatures rares (golem, fée, liche, harpie) ---------- */
Object.assign(ITEMS, {
  // baguette étoilée
  wand: g => {
    inkLn(g, [[HX - 1, HY + 5], [HX + 4, HY - 13]], '#7a4a28', 1.8);
    const cx = HX + 5, cy = HY - 17, p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 2.4 : 5.8; p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    poly(g, p, '#ffd84a', 1);
    [[HX + 13, HY - 23, 1.5], [HX - 2, HY - 25, 1.1]].forEach(([x, y, r]) => poly(g, [[x, y - r * 2], [x + r * .5, y - r * .5], [x + r * 2, y], [x + r * .5, y + r * .5], [x, y + r * 2], [x - r * .5, y + r * .5], [x - r * 2, y], [x - r * .5, y - r * .5]], '#fff6c8', .8));
  },
  // écharpe tricotée + bâton (liche frileuse)
  scarfstaff: g => {
    const wool = '#cf4a3a', cream = '#f1e4c8';
    g.beginPath(); g.moveTo(-12.5, -34); g.quadraticCurveTo(0, -29.5, 12.5, -34); g.lineTo(13, -27.5); g.quadraticCurveTo(0, -22.5, -13, -27.5); g.closePath(); fi(g, wool, 1.4);
    [-9, -5, -1, 3, 7, 11].forEach(x => ln(g, [[x, -32.2 + Math.abs(x) * .12], [x - .4, -25.6 + Math.abs(x) * .14]], 'rgba(110,25,15,.55)', .8));
    poly(g, [[2, -28.5], [9, -28.5], [10, -12], [3, -11.5]], wool, 1.4);
    [[-24, -21], [-17.5, -14.8]].forEach(([y0, y1]) => poly(g, [[2.3 + (y0 + 28.5) * .06, y0], [9.3 + (y0 + 28.5) * .06, y0], [9.3 + (y1 + 28.5) * .06, y1], [2.3 + (y1 + 28.5) * .06, y1]], cream, 1));
    [3.8, 6, 8.2].forEach(x => inkLn(g, [[x + .5, -11.8], [x + .8, -8.4]], wool, .9));
    ITEMS.staff(g);
  },
});
Object.assign(CHAR, {
  golem:  { sc: 1.3, skin: '#9fa29e', body: '#858a8d', belly: '#78a653', legs: '#6b6f73', ears: 'small', hair: '#5f9a3f', hairStyle: 'spiky', eyes: 'glow', nose: 'big', mouth: 'o' },
  fee:    { sc: .75, skin: '#f2d3ea', body: '#62b45a', belly: '#9ad47a', legs: '#4f8c47', wings: '#c6e9ff', ears: 'pointy', hair: '#f2c84b', hairStyle: 'long', eyes: 'normal', iris: '#8a4ab8', brow: true, nose: 'small', mouth: 'smug', item: 'wand' },
  liche:  { skin: '#dfe4ee', body: '#2c3f7c', legs: '#1e2b57', hat: 'wizard', hatc: '#2a2c5e', eyes: 'sockets', nose: 'none', mouth: 'teeth', item: 'scarfstaff' },
  harpie: { sc: 1.02, skin: '#e8c6a2', body: '#55408c', belly: '#8d79c9', legs: '#e3a53a', wings: '#45297a', hair: '#2a2036', hairStyle: 'wild', eyes: 'normal', iris: '#f0b42a', nose: 'long', mouth: 'smug', item: 'lute' },
});
/* ---------- ajouts : créatures des Jardins (cocatrice, mandragore, nixe, goule) ---------- */
Object.assign(ITEMS, {
  // couverts de gourmet et bavoir noué ; la goule est voûtée : la main droite et la tête, dessinées
  // juste après l'objet, descendent d'un cran (humanoid() restaure la transformation ensuite)
  cutlery: g => {
    const bib = '#fbf8f1';
    g.beginPath(); g.moveTo(-6, -31.5); g.quadraticCurveTo(0, -28.5, 6, -31.5); g.lineTo(8.6, -17); g.quadraticCurveTo(9, -10.4, 0, -10); g.quadraticCurveTo(-9, -10.4, -8.6, -17); g.closePath(); fi(g, bib, 1.2);
    ln(g, [[-7.6, -14], [-3, -12.4], [3, -12.4], [7.6, -14]], '#8fb0d8', 1.1);
    poly(g, [[1.6, -21], [4.4, -22.2], [5.6, -19.6], [3.8, -17.4], [4.6, -15.4], [2.6, -16.2], [1, -18.2]], '#b8402e', 0);
    ball(g, -3.4, -19.6, .9, '#b8402e', 0);
    inkLn(g, [[-6, -30.8], [-10.4, -33.4]], bib, 1);
    [[-1, -.5], [1, .45]].forEach(([s, r]) => { g.save(); g.translate(-11.2, -34); g.rotate(r); ell(g, s * 2.2, 0, 2.3, 1.4, bib, 1); g.restore(); });
    // couteau dans la main gauche (déjà dessinée) : lame au-dessus du poing, bout du manche dessous
    poly(g, [[-14, -24.6], [-11.4, -24.6], [-11.4, -36.5], [-12.8, -40], [-14, -37.6]], METAL, 1);
    ln(g, [[-12.2, -26], [-12.2, -35.5]], 'rgba(255,255,255,.7)', .7);
    inkLn(g, [[-12.6, -16.8], [-12.9, -13.6]], '#6a4630', 1.8);
    // fourchette dans la main droite (dessinée après, plus bas)
    inkLn(g, [[12.2, -11], [13.2, -31]], METAL, 1.6);
    rrect(g, 10, -33.6, 6.4, 2.8, 1.2, METAL, 1);
    [-2.3, 0, 2.3].forEach(d => inkLn(g, [[13.2 + d, -33.4], [13.3 + d * 1.15, -39.4]], METAL, 1));
    g.translate(0, 4.5);
  },
  // longues mèches ondulées, nageoires en guise d'oreilles, robe et mèches d'algues, coquillage (nixe)
  seashell: g => {
    const fin = '#7fd0bd', alg = '#4f9a48', alg2 = '#3a7a3c', hair = '#2b6a6c';
    [-1, 1].forEach(sd => {
      g.beginPath(); g.moveTo(sd * 8, -52); g.bezierCurveTo(sd * 17.5, -50, sd * 20.5, -42, sd * 17.6, -35.5); g.bezierCurveTo(sd * 15.4, -31.5, sd * 20.4, -28.5, sd * 18.8, -23.2);
      g.quadraticCurveTo(sd * 16.8, -20.6, sd * 14.8, -23.4); g.quadraticCurveTo(sd * 15.4, -27, sd * 12.6, -29.5); g.lineTo(sd * 8, -31); g.closePath(); fi(g, hair, 1.2);
      ln(g, [[sd * 17.2, -44], [sd * 17.8, -39.5]], 'rgba(255,250,235,.3)', 1.2);
    });
    [-1, 1].forEach(sd => {
      poly(g, [[sd * 9, -48], [sd * 21, -57.5], [sd * 20, -51.5], [sd * 25.5, -48.5], [sd * 21.5, -44.5], [sd * 24.5, -39.5], [sd * 10, -38]], fin, 1);
      [[20.5, -55], [23.5, -48.4], [22.5, -41]].forEach(([x, y]) => ln(g, [[sd * 11, -43], [sd * x, y]], '#3c9a88', .9));
    });
    for (let i = 0; i < 6; i++) { const x = -8.3 + i * 3.32, l = 5.5 + (i % 2) * 2.6, w = i % 2 ? 1 : -1; poly(g, [[x - 1.9, -13.4], [x + 1.9, -13.4], [x + 1.3 + w, -9.5], [x + .7, -12.4 + l + 2.4], [x - .5, -12.4 + l], [x - 1.4 - w * .6, -10]], i % 2 ? alg : alg2, 1); }
    [[-7.4, 1], [6.6, -1]].forEach(([x, s]) => inkLn(g, [[x, -31], [x - s * 1.6, -26.5], [x + s * .6, -21.5], [x - s * 1.1, -16.5]], alg, 1.6));
    // coquille Saint-Jacques tenue par la charnière, penchée vers l'extérieur
    g.save(); g.translate(14.2, -20.6); g.rotate(.6);
    g.beginPath(); g.moveTo(-2, 0); g.lineTo(-7.2, -7); g.arc(0, -7.5, 7.2, Math.PI * 1.03, Math.PI * 1.97); g.lineTo(2, 0); g.closePath(); fi(g, '#f6c8b6', 1.2);
    [-5, -2.5, 0, 2.5, 5].forEach(d => ln(g, [[0, -1], [d * 1.15, -12.8 + Math.abs(d) * .32]], '#d48e7e', .8));
    poly(g, [[-3.6, -2.8], [3.6, -2.8], [2.6, .6], [-2.6, .6]], '#eab4a2', 1);
    g.restore();
  },
});
Object.assign(SPECIALS, {
  // moitié coq, moitié serpent ; elle louche, d'où un regard pétrifiant qui rate toujours sa cible
  cockatrice: g => {
    const gold = '#eba640', red = '#de3a2c', green = '#5f9a40';
    const C = [[-2, -9], [-14, -4.5], [-25.5, -7.5], [-31, -18], [-26, -28.5], [-17.5, -28], [-16.5, -21.5]], S = [];
    for (let i = 0; i < C.length - 1; i++) { const p0 = C[Math.max(0, i - 1)], p1 = C[i], p2 = C[i + 1], p3 = C[Math.min(C.length - 1, i + 2)]; for (let k = 0; k < 6; k++) { const t = k / 6, t2 = t * t, t3 = t2 * t; S.push([0, 1].map(j => .5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t3))); } }
    S.push(C[C.length - 1]);
    const n = S.length, wd = i => 4.8 * Math.pow(1 - i / (n - 1), .75) + .5, N = S.map((p, i) => { const q = S[Math.min(n - 1, i + 1)], o = S[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1; return [-dy / l, dx / l]; });
    poly(g, [...S.map((p, i) => [p[0] + N[i][0] * wd(i), p[1] + N[i][1] * wd(i)]), ...S.map((p, i) => [p[0] - N[i][0] * wd(i), p[1] - N[i][1] * wd(i)]).reverse()], green, 1.2);
    ln(g, S.slice(0, n - 2).map((p, i) => [p[0] - N[i][0] * wd(i) * .45, p[1] - N[i][1] * wd(i) * .45]), '#c8de8c', 1.6);
    for (let i = 3; i < n - 3; i += 3) { const [x, y] = S[i], w = wd(i) * .8; ln(g, [[x + N[i][0] * w, y + N[i][1] * w], [x + N[i][0] * w * .2 + (S[i + 1][0] - x) * .8, y + N[i][1] * w * .2 + (S[i + 1][1] - y) * .8], [x - N[i][0] * w * .3, y - N[i][1] * w * .3]], '#3c7a2c', 1); }
    poly(g, [[-5, -24], [-9, -36], [-13, -33], [-11, -29.5], [-14.5, -28], [-8, -21]], '#b4561f', 1.1);
    [[-3, -4], [5, -3.5]].forEach(([x, y]) => { inkLn(g, [[x, y - 5], [x - .6, y + 3.4]], '#f0b030', 1.6); inkLn(g, [[x - 4, y + 4], [x - .6, y + 3.4], [x + 3, y + 4.2]], '#f0b030', 1.2); });
    ell(g, 6.6, -25, 5.6, 7.4, gold, 1.2);
    ell(g, 1, -16.5, 12.5, 10.5, gold, 1.2);
    ell(g, 6.8, -14.6, 6.4, 7.2, '#f8dc90', .8);
    g.beginPath(); g.moveTo(-1, -23); g.quadraticCurveTo(-7, -32.5, -14.5, -29.5); g.quadraticCurveTo(-11.6, -27.6, -15, -24.6); g.quadraticCurveTo(-11.2, -23.6, -13.6, -20); g.quadraticCurveTo(-9, -19.8, -9.6, -16.4); g.quadraticCurveTo(-5, -17, -2.5, -15); g.closePath(); fi(g, '#c8642a', 1.1);
    ln(g, [[-3.6, -20.6], [-11, -27]], 'rgba(90,30,10,.55)', .8); ln(g, [[-3.6, -18], [-10.6, -21.8]], 'rgba(90,30,10,.55)', .8);
    [[4.6, -41.5, 3], [8.8, -44.4, 3.5], [13.2, -43, 3], [16, -39.4, 2.4]].forEach(([x, y, r]) => ball(g, x, y, r, red, 1));
    ball(g, 10, -33.5, 9, gold, 1.2);
    ell(g, 17.4, -26.4, 2.4, 3.6, red, 1);
    poly(g, [[16.4, -35.8], [24.6, -32.6], [16.8, -29.8]], '#f4c247', 1); ln(g, [[17, -32.8], [22, -32.5]], 'rgba(120,70,10,.6)', .7);
    eye(g, 6.8, -35.4, .8, '#8a3ec8', [1.4, .5]); eye(g, 13.6, -36, .64, '#8a3ec8', [-1.5, .8]);
    ell(g, 4.4, -29.6, 2.4, 1.4, 'rgba(235,110,120,.45)', 0);
  },
  // racine qui braille : yeux plissés, larmes, bouche grande ouverte, bras en l'air
  mandrake: g => {
    g.save(); g.scale(.74, .74);
    const sk = '#cfa775', dk = '#9a6e44';
    [[-.95, 16, '#4f8f3f'], [-.48, 20, '#5fa64e'], [0, 22, '#6db85a'], [.46, 19, '#5fa64e'], [.92, 15, '#4f8f3f']].forEach(([a, L, c]) => { g.save(); g.translate(0, -45); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(-5.8, -L * .5, 0, -L); g.quadraticCurveTo(5.8, -L * .5, 0, 0); fi(g, c, 1.2); ln(g, [[0, -1.5], [0, -L * .78]], 'rgba(225,255,195,.55)', .8); g.restore(); });
    [[-1, -5.5], [1, 5.5]].forEach(([sd, x]) => { inkLn(g, [[x, -14], [x + sd * 1.8, -7], [x + sd * .6, -1]], sk, 3.2); inkLn(g, [[x + sd * .6, -1], [x + sd * 3.4, .4]], sk, 1.2); ln(g, [[x + sd * 1.6, -6], [x + sd * 4.6, -5.2]], dk, .8); });
    [-1, 1].forEach(sd => { inkLn(g, [[sd * 12, -25], [sd * 18, -30], [sd * 20.5, -38]], sk, 2.4); [[-2.2, -3.6], [.6, -4.4], [2.8, -2.2]].forEach(([dx, dy]) => inkLn(g, [[sd * 20.5, -38], [sd * (20.5 + dx), -38 + dy]], sk, 1)); });
    g.beginPath(); g.moveTo(0, -48); g.bezierCurveTo(10, -48, 16.5, -40, 16, -30); g.bezierCurveTo(15.5, -21, 10, -13, 5, -11); g.quadraticCurveTo(0, -9.5, -5, -11); g.bezierCurveTo(-10, -13, -15.5, -21, -16, -30); g.bezierCurveTo(-16.5, -40, -10, -48, 0, -48); g.closePath(); fi(g, sk, 1.2);
    [[-9, -16, 4], [6.5, -14.5, 4.5], [-12.5, -41, 3], [11, -42, 3.4]].forEach(([x, y, w]) => { g.beginPath(); g.arc(x, y - w, w, .35 * Math.PI, .65 * Math.PI); g.strokeStyle = dk; g.lineWidth = .9; g.stroke(); });
    [[15.8, -25, 19.6, -23.4], [14.6, -19, 17.6, -16.4], [-15.8, -26, -19.4, -24.8], [-14, -18, -17, -15.4]].forEach(([x0, y0, x1, y1]) => ln(g, [[x0, y0], [x1, y1]], INK, 1));
    [-1, 1].forEach(sd => ln(g, [[sd * 9.5, -37], [sd * 4.5, -34.2], [sd * 9.5, -31.4]], INK, 1.9));
    [-1, 1].forEach(sd => { const x = sd * 13.5, y = -38; g.beginPath(); g.moveTo(x - sd * 2, y + 2.6); g.quadraticCurveTo(x + sd * 2.6, y - .4, x + sd * 1.4, y - 3.2); g.quadraticCurveTo(x - sd * 1.6, y - .8, x - sd * 2, y + 2.6); fi(g, '#9ad8ff', 1); });
    ell(g, 0, -23.5, 6.6, 7.2, '#5a1c22', 1.2);
    ell(g, 0, -19.4, 4.2, 2.6, '#e0707a', 0);
    rrect(g, -1.7, -30.4, 3.4, 2.6, .8, '#fffaf0', .8);
    ell(g, -11.4, -27.5, 3, 1.7, 'rgba(235,110,120,.45)', 0); ell(g, 11.4, -27.5, 3, 1.7, 'rgba(235,110,120,.45)', 0);
    [-1, 1].forEach(sd => [[18.5, -45, 22.5, -49.5], [20.5, -40.5, 25.5, -41.5], [17, -50, 18.8, -55]].forEach(([x0, y0, x1, y1]) => ln(g, [[sd * x0, y0], [sd * x1, y1]], INK, 1.3)));
    g.restore();
  },
});
Object.assign(CHAR, {
  cocatrice:  { special: 'cockatrice', sc: .95 },
  mandragore: { special: 'mandrake', sc: .8 },
  nixe:       { sc: .96, skin: '#a9dcc6', body: '#3f8a62', legs: '#8ccbb4', hair: '#2b6a6c', hairStyle: 'wild', eyes: 'normal', iris: '#2c8fb0', nose: 'small', mouth: 'smug', item: 'seashell' },
  goule:      { sc: 1.02, skin: '#a0b296', body: '#4b4560', legs: '#35303f', ears: 'pointy', hair: '#2a2830', hairStyle: 'slick', eyes: 'normal', iris: '#e3c94a', brow: true, nose: 'long', mouth: 'smug', item: 'cutlery' },
});
