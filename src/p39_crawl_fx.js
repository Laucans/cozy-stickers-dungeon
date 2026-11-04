
/* =========================================================
   L'ambiance des expéditions : des ennemis dessinés comme les
   créatures du château, un décor par donjon (et ses petites
   bêtes, sa brume, ses lucioles), une ambiance sonore et des
   bruitages synthétisés, avec un peu d'écho de souterrain.
   ========================================================= */
// les ennemis qui ne sont pas une espèce du château : dessinés avec les mêmes pinceaux
const FOE_ART = {
  aco:    { sc: .95, skin: '#b9c9a8', body: '#2b2633', legs: '#1e1a24', hat: 'hood', hatc: '#3d2a52', eyes: 'glow', mouth: 'teeth', nose: 'small', item: 'scarfstaff' },
  chev:   { sc: 1.15, skin: '#ece6d6', body: '#7d8494', ribs: true, eyes: 'sockets', mouth: 'teeth', nose: 'none', hat: 'bucket', hatc: '#6d7484', cape: '#5a1f2a', item: 'sword' },
  ysolde: { sc: 1.12, skin: '#d9dfe9', body: '#2a1838', legs: '#1a0f26', cape: '#4a1640', hat: 'witch', hatc: '#160c22', hair: '#eef0f6', hairStyle: 'long', eyes: 'glow', mouth: 'smug', nose: 'long', item: 'scarfstaff' },
  bra:    { sc: 1.05, skin: '#e9b98f', body: '#6e4426', belly: '#e8d6a8', beard: '#8a4f24', hair: '#8a4f24', hairStyle: 'wild', nose: 'big', eyes: 'derp', iris: '#4a6a2a', mouth: 'grin', item: 'ladle' },
  ogre:   { sc: 1.45, skin: '#b9a477', body: '#5a3e2c', belly: '#dccb9e', nose: 'huge', mouth: 'tusks', eyes: 'derp', iris: '#c0302a', ears: 'small', hair: '#4a3a2a', hairStyle: 'spiky', item: 'ladle' },
  maj:    { sc: 1.02, skin: '#e9e3ef', body: '#18181f', legs: '#101016', collar: true, hair: '#cfcfd8', hairStyle: 'slick', eyes: 'normal', iris: '#8a1f2a', brow: true, mouth: 'smug', nose: 'long', item: 'cutlery' },
  lutin:  { sc: .72, skin: '#9fd06c', body: '#2f6f3a', hat: 'witch', hatc: '#c0402f', ears: 'big', eyes: 'derp', iris: '#e0a020', mouth: 'grin', nose: 'long', item: 'sack' },
  loup:   { sc: 1.08, skin: '#8d8f98', body: '#5d5f68', belly: '#c9c6bd', ears: 'pointy', nose: 'snout', eyes: 'glow', mouth: 'fangs', hair: '#6a6c74', hairStyle: 'wild', tail: '#6a6c74' },
  rat:    { sc: .7, skin: '#a09090', body: '#6a5a58', belly: '#d8c4c0', ears: 'big', nose: 'snout', eyes: 'normal', iris: '#c0202a', mouth: 'teeth', tail: '#d8a0a0' },
  golemc: { sc: 1.4, skin: '#a8dcec', body: '#6aa6c6', belly: '#d6f4ff', legs: '#5a8aa8', ears: 'small', hair: '#e0fbff', hairStyle: 'spiky', eyes: 'glow', nose: 'big', mouth: 'o' },
  reine:  { sc: 1.12, skin: '#fbe6c2', body: '#d9b44a', belly: '#fff0a8', legs: '#b8902a', wings: '#fff6c0', ears: 'pointy', hair: '#fffbe8', hairStyle: 'long', eyes: 'normal', iris: '#e0a020', brow: true, nose: 'small', mouth: 'smug', item: 'wand' },
  bat:    { sc: .62, skin: '#5a4a6a', body: '#3c2c4c', wings: '#2b1d3a', ears: 'pointy', eyes: 'glow', mouth: 'fangs', nose: 'small' },
  momie:  { sc: .98, skin: '#e6dabc', body: '#d6c8a2', legs: '#c4b48c', ribs: true, hat: 'hood', hatc: '#d6c8a2', eyes: 'glow', mouth: 'o', nose: 'none' },
  armure: { sc: 1.06, skin: '#1c1c26', body: '#8a92a4', belly: '#a8b0c0', legs: '#6c7486', hat: 'helmet', hatc: '#9aa2b4', eyes: 'glow', mouth: 'teeth', nose: 'none', item: 'sword' },
  roi:    { sc: 1.16, skin: '#cfe0f4', body: '#3a2a5a', legs: '#24183a', cape: '#7a1f2a', collar: true, hair: '#eef4ff', hairStyle: 'long', beard: '#eef4ff', eyes: 'glow', mouth: 'smug', nose: 'long', item: 'sword' },
};
// le dessin de chaque ennemi : sa propre allure, ou une espèce du château repeinte
const CRAWL_LOOK = {
  cha: ['char', 'mandragore', 'hue-rotate(250deg) saturate(1.4)'], vexe: ['char', 'mandragore', 'hue-rotate(320deg) saturate(1.7)'], ronce: ['char', 'mandragore', 'hue-rotate(45deg) brightness(.85) saturate(1.3)'],
  gelee: ['char', 'fantome', 'hue-rotate(85deg) saturate(4) brightness(.92)'], chene: ['x', 'tree', 'saturate(.9) brightness(.92)'], basil: ['char', 'dragonnet', 'hue-rotate(75deg) saturate(1.25)'],
  follet: ['char', 'fantome', 'hue-rotate(150deg) saturate(3) brightness(1.2)'], gardien: ['char', 'golem', 'grayscale(.7) sepia(.45) brightness(.95) contrast(1.05)'],
  krouk: ['char', 'gobelin', 'saturate(1.25) contrast(1.05)'], pale: ['char', 'vampire', 'brightness(.95) contrast(1.1)'], mere: ['char', 'crapaud', 'saturate(1.3)'], tis: ['char', 'araignee', 'brightness(.85) contrast(1.15)'],
};
function foeImg(o) {
  const L = o.k && CRAWL_LOOK[o.k], src = L ? thumb(L[0], L[1], true) : FOE_ART[o.k] ? thumb('foe', o.k, true) : o.sp ? thumb('char', o.sp, true) : null;
  return src ? `<img alt="" src="${src}"${L && L[2] ? ` style="filter:${L[2]} drop-shadow(0 5px 4px rgba(0,0,0,.55))"` : ''}>${o.k === 'chene' ? '<span class="treeface"><i></i><i></i></span>' : ''}` : `<span class="cemo">${esc(o.emo || '👾')}</span>`;
}

/* ---------- les décors ---------- */
// des accessoires tirés des stickers du château : [sorte, sticker, gauche %, bas %, taille, plan (1 au fond, 2 devant)]
const CRAWL_DECOR = {
  morgrave:   { props: [['furn', 'tombe', 6, 52, .8, 1], ['furn', 'saule', 18, 50, 1.25, 1], ['furn', 'mausolee', 80, 50, 1.1, 1], ['furn', 'tombe', 93, 53, .8, 1], ['furn', 'cercueil', 3, 10, 1.1, 2], ['furn', 'ossuaire', 96, 9, 1, 2], ['furn', 'candelabre', 33, 40, .85, 1], ['furn', 'candelabre', 67, 40, .85, 1]], fx: { fog: 5, dust: 10 }, lights: [[33, 58, '150,230,255'], [67, 58, '150,230,255']] },
  septbieres: { props: [['furn', 'biere', 8, 50, 1.1, 1], ['furn', 'biere', 20, 52, 1, 1], ['furn', 'tablee', 78, 49, 1.1, 1], ['furn', 'jambons', 92, 54, .9, 1], ['furn', 'tonneau', 3, 10, 1.05, 2], ['furn', 'comptoir', 96, 9, 1.05, 2], ['furn', 'torche', 35, 46, .8, 1], ['furn', 'torche', 65, 46, .8, 1]], fx: { embers: 12, dust: 8 }, lights: [[35, 66, '255,170,80'], [65, 66, '255,170,80']] },
  moussues:   { props: [['furn', 'saule', 8, 49, 1.2, 1], ['furn', 'roseaux', 22, 50, .9, 1], ['furn', 'nenuphar', 78, 47, 1, 1], ['furn', 'roseaux', 91, 51, .9, 1], ['furn', 'champis', 3, 9, 1.05, 2], ['furn', 'champis', 97, 10, .95, 2], ['furn', 'toile', 50, 62, .9, 1]], fx: { fog: 6, fireflies: 10, bubbles: 7 }, lights: [] },
  ombrelune:  { props: [['furn', 'orgue', 12, 49, 1.15, 1], ['furn', 'tableau', 30, 62, .85, 1], ['furn', 'tableau', 70, 62, .85, 1], ['furn', 'canape', 86, 49, 1.05, 1], ['furn', 'candelabre', 3, 9, 1.05, 2], ['furn', 'candelabre', 97, 9, 1.05, 2]], fx: { bats: 4, dust: 8 }, lights: [[3, 32, '255,200,120'], [97, 32, '255,200,120']], windows: true },
  foret:      { props: [['x', 'pine', 4, 47, 1.35, 1], ['x', 'tree', 16, 46, 1.45, 1], ['x', 'tree', 84, 46, 1.45, 1], ['x', 'pine', 96, 47, 1.3, 1], ['x', 'bush', 30, 50, .9, 1], ['x', 'bush', 70, 50, .9, 1], ['furn', 'champis', 3, 9, 1, 2], ['x', 'rock', 97, 8, 1, 2]], fx: { fireflies: 14, leaves: 6 }, lights: [], moon: true },
  ruines:     { props: [['furn', 'mausolee', 6, 49, 1.1, 1], ['furn', 'armure', 20, 51, 1, 1], ['furn', 'sarcophage', 80, 49, 1.05, 1], ['furn', 'tombe', 93, 53, .8, 1], ['x', 'rock', 3, 9, 1.05, 2], ['furn', 'puits', 97, 9, .95, 2], ['furn', 'torche', 35, 46, .8, 1], ['furn', 'torche', 65, 46, .8, 1]], fx: { dust: 14, leaves: 4 }, lights: [[35, 66, '255,190,110'], [65, 66, '255,190,110']], moon: true },
  grotte:     { props: [['x', 'rock', 6, 48, 1.3, 1], ['furn', 'cristal', 20, 51, 1, 1], ['furn', 'etai', 78, 49, 1.1, 1], ['furn', 'cristal', 91, 52, .95, 1], ['furn', 'wagonnet', 3, 9, 1.05, 2], ['furn', 'filon', 97, 9, 1, 2]], fx: { drips: 8, sparkles: 10 }, lights: [[20, 66, '150,200,255'], [91, 66, '150,200,255']], stalactites: true },
};
const CRAWL_SKY = {
  morgrave: '<path d="M0 360 Q120 300 240 360 T480 360 T720 360 T1000 350 V600 H0Z" fill="#0d1a1c"/><g fill="#132629" stroke="#1f3a3e" stroke-width="6"><path d="M120 360 V170 Q200 90 280 170 V360"/><path d="M440 360 V140 Q500 70 560 140 V360"/><path d="M720 360 V170 Q800 90 880 170 V360"/></g>',
  septbieres: '<g fill="#2a170b"><rect x="0" y="0" width="1000" height="60"/><rect x="0" y="120" width="1000" height="26"/></g><g fill="#3a2212">' + [60, 260, 460, 660, 860].map(x => `<rect x="${x}" y="0" width="34" height="380"/>`).join('') + '</g>',
  moussues: '<path d="M0 330 C150 280 260 340 400 300 S650 320 780 290 1000 320 1000 320 V600 H0Z" fill="#0e2414"/><path d="M0 380 C200 340 320 400 520 360 S820 390 1000 360 V600 H0Z" fill="#0a1a0e"/>',
  ombrelune: '<g fill="#1d1230">' + [0, 200, 400, 600, 800].map(x => `<rect x="${x + 4}" y="0" width="192" height="380" rx="4" fill="none" stroke="#2c1c46" stroke-width="3"/>`).join('') + '</g>',
  foret: '<path d="M0 340 L60 250 L110 330 L170 220 L240 330 L300 240 L370 335 L430 230 L500 330 L560 250 L630 335 L700 235 L770 330 L830 245 L900 335 L960 255 L1000 300 V600 H0Z" fill="#0b2214"/><path d="M0 380 L80 300 L150 375 L230 290 L320 380 L400 300 L480 380 L560 295 L650 380 L740 305 L820 380 L900 300 L1000 370 V600 H0Z" fill="#081a0f"/>',
  ruines: '<path d="M0 365 Q250 335 500 352 T1000 346 V600 H0Z" fill="#15110c"/><g fill="#211b14" stroke="#30281d" stroke-width="5"><rect x="90" y="150" width="56" height="215"/><rect x="78" y="134" width="80" height="18"/><path d="M300 365 V120 H356 V196 L340 212 L356 228 V365Z"/><path d="M610 365 V196 L628 178 L648 194 V365Z"/><rect x="840" y="112" width="56" height="253"/><rect x="828" y="96" width="80" height="18"/><path d="M146 160 Q223 80 300 160" fill="none"/><path d="M896 150 Q960 98 1000 120" fill="none"/></g>',
  grotte: '<path d="M0 0 H1000 V40 L960 120 L930 40 L880 160 L840 40 L790 100 L740 40 L690 170 L640 40 L600 110 L540 40 L490 150 L440 40 L400 95 L350 40 L300 175 L250 40 L200 120 L150 40 L100 140 L60 40 L20 90 L0 40Z" fill="#0c1220"/><path d="M0 360 Q200 330 400 355 T800 345 T1000 355 V600 H0Z" fill="#0a0f1a"/>',
};
function decorHTML(dg) {
  const D = CRAWL_DECOR[dg] || CRAWL_DECOR.morgrave, rnd = (a, b) => a + Math.random() * (b - a);
  const prop = ([kind, key, x, y, s, layer]) => `<img class="dprop l${layer}" alt="" src="${thumb(kind, key, true)}" style="left:${x}%;bottom:${y}%;--s:${s};--pb:${Math.round((y - 50) * 3)}px">`;
  const parts = [];
  Object.entries(D.fx || {}).forEach(([k, n]) => { for (let i = 0; i < n; i++) parts.push(`<i class="px ${k}" style="--x:${rnd(2, 98).toFixed(1)}%;--y:${rnd(k === 'drips' ? 0 : 8, k === 'fog' ? 45 : 85).toFixed(1)}%;--d:${rnd(k === 'fog' ? 18 : 4, k === 'fog' ? 34 : 11).toFixed(1)}s;--dl:-${rnd(0, 12).toFixed(1)}s;--s:${rnd(.6, 1.4).toFixed(2)}"></i>`); });
  return `<div class="dsky"><svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${CRAWL_SKY[dg] || ''}</svg></div>
    ${D.moon ? '<i class="dmoon"></i>' : ''}${D.windows ? '<i class="dwin w1"></i><i class="dwin w2"></i>' : ''}
    <div class="dfloor"></div>${(D.lights || []).map(([x, y, c]) => `<i class="dlight" style="left:${x}%;bottom:${y}%;--lc:${c}"></i>`).join('')}
    ${D.props.map(prop).join('')}<div class="dpx">${parts.join('')}</div><i class="dvig"></i>`;
}

/* ---------- les sons : un peu d'écho, des bruitages, une ambiance par donjon ---------- */
const CAUD = { bus: null, wet: .3, amb: null };
function cBus() {
  const c = SND.ctx; if (!c) return null;
  if (CAUD.bus && CAUD.bus.c === c) return CAUD.bus;
  const input = c.createGain(), dry = c.createGain(), conv = c.createConvolver(), wet = c.createGain(), out = c.createGain();
  const len = Math.floor(c.sampleRate * 2.4), ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
  conv.buffer = ir; wet.gain.value = CAUD.wet; out.gain.value = .9;
  input.connect(dry).connect(out); input.connect(conv).connect(wet).connect(out); out.connect(c.destination);
  CAUD.bus = { c, input, wet }; return CAUD.bus;
}
// un son : une note qui glisse, un souffle filtré
function cTone(f0, f1, dur, wave = 'sine', vol = .15, at = 0, dest) {
  const c = SND.ctx, t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
  o.type = wave; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(.015, dur / 4)); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  o.connect(g).connect(dest || cBus().input); o.start(t); o.stop(t + dur + .05);
}
function cNoise(dur, f0, f1, vol = .15, at = 0, type = 'bandpass', q = 1.5, dest) {
  const c = SND.ctx, t = c.currentTime + at, n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(Math.max(30, f1), t + dur);
  g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + Math.min(.01, dur / 5)); g.gain.exponentialRampToValueAtTime(.0005, t + dur);
  s.connect(f).connect(g).connect(dest || cBus().input); s.start(t); s.stop(t + dur + .02);
}
const CSFX = {
  draw: () => cNoise(.09, 3500, 7000, .05, 0, 'highpass', .7),
  shuffle: () => { for (let i = 0; i < 9; i++) cNoise(.04, 4000, 6500, .045, i * .035, 'highpass', .7); },
  play: () => { cNoise(.22, 600, 4200, .08, 0, 'bandpass', 1.2); cTone(660, 990, .16, 'triangle', .05, .05); },
  slash: () => { cNoise(.16, 5200, 900, .13, 0, 'bandpass', 2); cTone(180, 70, .14, 'sine', .16, .03); },
  heavy: () => { cNoise(.26, 2500, 300, .18, 0, 'lowpass', .8); cTone(120, 40, .32, 'sine', .3, .01); cTone(90, 45, .25, 'square', .05, .02); },
  block: () => { cTone(820, 760, .25, 'sine', .08); cTone(1930, 1850, .18, 'sine', .05); cNoise(.05, 6000, 4000, .06, 0, 'highpass'); },
  heal: () => [880, 1109, 1319, 1760].forEach((f, i) => cTone(f, f * 1.01, .32, 'triangle', .045, i * .055)),
  poison: () => { for (let i = 0; i < 5; i++) { const f = 180 + Math.random() * 220; cTone(f, f * 1.9, .07, 'sine', .07, i * .06 + Math.random() * .02); } },
  fear: () => { cTone(620, 280, .7, 'sine', .05); cTone(640, 300, .7, 'sine', .04, .05); cNoise(.7, 900, 300, .04, 0, 'bandpass', 3); },
  stun: () => [1200, 900, 1300, 950].forEach((f, i) => cTone(f, f * .8, .09, 'triangle', .05, i * .07)),
  miss: () => cNoise(.18, 1200, 3800, .07, 0, 'bandpass', 1),
  buff: () => [392, 523, 659].forEach((f, i) => cTone(f, f, .25, 'square', .025, i * .06)),
  ko: () => { cTone(200, 55, .5, 'sawtooth', .06); cNoise(.2, 400, 120, .12, .05, 'lowpass'); },
  foeko: () => { cNoise(.35, 1800, 200, .1, 0, 'bandpass', 1); cTone(300, 90, .35, 'triangle', .07, .04); },
  coin: () => { cTone(1568, 1568, .12, 'square', .03); cTone(2093, 2093, .2, 'square', .03, .07); },
  energy: () => cTone(880, 1760, .12, 'triangle', .05),
  turn: () => { cTone(220, 218, 1.4, 'sine', .07); cTone(440, 436, 1.1, 'sine', .035); cTone(660, 655, .8, 'sine', .015); },
  eturn: () => { cTone(90, 45, .3, 'sine', .22); cTone(85, 42, .3, 'sine', .18, .22); },
  boss: () => { cTone(70, 48, 1.4, 'sawtooth', .07); cNoise(1.3, 300, 80, .12, 0, 'lowpass', .7); cTone(140, 95, 1.1, 'square', .025, .1); },
  victory: () => [523, 659, 784, 1047].forEach((f, i) => cTone(f, f, i === 3 ? .9 : .28, 'triangle', .08, i * .13)),
  secret: () => [1319, 1568, 1976, 2637].forEach((f, i) => cTone(f, f * 1.01, .4, 'sine', .05, i * .075)),
  defeat: () => [392, 311, 262, 196].forEach((f, i) => cTone(f, f * .98, .5, 'sawtooth', .035, i * .22)),
};
const sfxCrawl = sfx;
sfx = function (type) { if (CSFX[type]) { if (SND.on && SND.ctx) try { CSFX[type](); } catch (e) {} return; } return sfxCrawl(type); };
// l'ambiance d'un donjon : un bourdon grave, un souffle, et de temps en temps un bruit (goutte, grillon, grenouille, cloche…)
const CAMB = {
  morgrave:   { drone: [55, 82.4], noise: ['highpass', 2200, .012], wet: .45, ev: [[.08, () => cNoise(1.6, 400, 900, .025, 0, 'bandpass', 4)], [.04, () => cTone(330, 328, 3, 'sine', .03)]] },
  septbieres: { drone: [98, 147], noise: ['bandpass', 450, .02], wet: .25, ev: [[.12, () => cTone(2300 + Math.random() * 600, 2200, .12, 'sine', .025)], [.05, () => cNoise(.5, 300, 500, .03, 0, 'bandpass', 2)]] },
  moussues:   { drone: [65, 98], noise: ['lowpass', 700, .02], wet: .3, ev: [[.12, () => { cTone(140, 105, .14, 'square', .03); cTone(130, 100, .12, 'square', .025, .18); }], [.08, () => cTone(220, 420, .08, 'sine', .03)]] },
  ombrelune:  { drone: [73.4, 110, 146.8], noise: ['highpass', 3000, .006], wet: .4, ev: [[.18, () => cNoise(.03, 3000, 2500, .04, 0, 'bandpass', 6)], [.03, () => cTone(196, 195, 2.5, 'triangle', .02)]] },
  foret:      { drone: [110], noise: ['lowpass', 900, .025], wet: .15, ev: [[.2, () => { for (let i = 0; i < 3; i++) cTone(4200, 4100, .05, 'triangle', .012, i * .09); }], [.04, () => { cTone(410, 380, .3, 'sine', .035); cTone(400, 370, .4, 'sine', .035, .45); }]] },
  ruines:     { drone: [58, 87], noise: ['bandpass', 600, .02], wet: .5, ev: [[.07, () => cNoise(1.5, 500, 1400, .03, 0, 'bandpass', 3)], [.04, () => cTone(988, 984, 2.2, 'sine', .018)], [.1, () => cNoise(.08, 2000, 800, .03, 0, 'bandpass', 2)]] },
  grotte:     { drone: [49, 73.5], noise: ['lowpass', 260, .03], wet: .6, ev: [[.22, () => cTone(1500 + Math.random() * 400, 800, .07, 'sine', .045)], [.03, () => cNoise(1.2, 120, 60, .05, 0, 'lowpass', .7)]] },
};
function crawlAmbience(dg) {
  stopCrawlAmbience();
  const A = CAMB[dg]; if (!A || !SND.on || !SND.ctx) return;
  try {
    const c = SND.ctx, bus = cBus(), master = c.createGain(), t = c.currentTime;
    bus.wet.gain.setTargetAtTime(A.wet, t, .3);
    master.gain.setValueAtTime(.0001, t); master.gain.exponentialRampToValueAtTime(.9, t + 2.5); master.connect(bus.input);
    const lp = c.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.connect(master);
    const lfo = c.createOscillator(), lfoG = c.createGain(); lfo.frequency.value = .07; lfoG.gain.value = 180; lfo.connect(lfoG).connect(lp.frequency); lfo.start();
    const nodes = [lfo];
    A.drone.forEach((f, i) => { const o = c.createOscillator(), g = c.createGain(); o.type = i ? 'triangle' : 'sine'; o.frequency.value = f; o.detune.value = (i - .5) * 6; g.gain.value = .035 / A.drone.length * 2; o.connect(g).connect(lp); o.start(); nodes.push(o); });
    // le souffle : un bruit en boucle, filtré, qui va et vient
    const n = c.sampleRate * 3, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource(), nf = c.createBiquadFilter(), ng = c.createGain(), nl = c.createOscillator(), nlg = c.createGain();
    src.buffer = b; src.loop = true; nf.type = A.noise[0]; nf.frequency.value = A.noise[1]; nf.Q.value = .8; ng.gain.value = A.noise[2];
    nl.frequency.value = .11; nlg.gain.value = A.noise[2] * .7; nl.connect(nlg).connect(ng.gain); src.connect(nf).connect(ng).connect(master); src.start(); nl.start(); nodes.push(src, nl);
    const timer = setInterval(() => { if (!SND.on || document.hidden) return; A.ev.forEach(([p, f]) => { if (Math.random() < p) try { f(); } catch (e) {} }); }, 900);
    CAUD.amb = { master, nodes, timer };
  } catch (e) {}
}
function stopCrawlAmbience() {
  const A = CAUD.amb; if (!A) return; CAUD.amb = null; clearInterval(A.timer);
  try { const t = SND.ctx.currentTime; A.master.gain.cancelScheduledValues(t); A.master.gain.setTargetAtTime(.0001, t, .4); setTimeout(() => { A.nodes.forEach(n => { try { n.stop(); } catch (e) {} }); try { A.master.disconnect(); } catch (e) {} }, 1600); } catch (e) {}
}

/* ---------- les cartes : leur illustration ---------- */
const CARD_TYPE = { atk: 'Attaque', def: 'Défense', heal: 'Soin', skill: 'Ruse' };
const castleKey = k => { const D = CASTLE_CARDS[k]; return D.from.find(x => ownsSrc(x) && fineSrc(x)) || D.from.find(ownsSrc) || D.from[0]; };   // l'illustration : le meuble de qualité s'il y en a un
function cardArt(c, me) {
  const D = cardDef(c);
  if (c.src === 'castle') { const k = castleKey(c.key); return `<img class="kimg" alt="" src="${thumb(FURN[k] ? 'furn' : 'def', k, true)}"><span class="kbadge emo">${D.ico}</span>`; }
  if (c.src === 'sp') return `<img class="kimg sp" alt="" src="${thumb('char', c.key, true)}"><span class="kbadge emo">${D.ico}</span>`;
  return `<span class="kbig emo">${D.ico}</span>${me ? `<img class="kmini" alt="" src="${thumb('char', me.sp)}">` : ''}`;
}
