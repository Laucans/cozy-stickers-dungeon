/* =========================================================
   La musique
   Des petites boucles composées à la volée (aucun fichier son),
   une par moment du jeu, qui passent de l'une à l'autre en fondu :
   - le château : ré mineur, trois temps lents, tapis de cordes,
     boîte à musique, basse pincée, tocs de bois, feu qui crépite ;
   - le donjon (expédition, hors combat) : mi phrygien, lent,
     bourdon grave, notes rares, gouttes d'eau ;
   - le combat (expédition ou invasion) : la mineur, rythmé,
     basse qui avance, petits tambours, riff de boîte à musique ;
   - le boss : ré mineur, plus vif, accords cuivrés.
   La mélodie change d'un tour à l'autre pour ne pas lasser. Tout
   suit le bouton du son ; la musique se coupe dans le menu.
   ========================================================= */
const MUS = { on: true, playing: false, theme: null, next: 0, bar: 0, timer: null, out: null, switching: false };
try { if (typeof uiPrefs === 'function' && uiPrefs().music === false) MUS.on = false; } catch (e) {}
const musHz = n => 440 * Math.pow(2, (n - 69) / 12);
// chaque thème : tempo, temps par mesure, accords, basses, mélodies (en croches, 0 = silence), et sa façon de jouer
const MUS_THEMES = {
  chateau: { bpm: 70, beats: 3, vol: .42, pad: .018, box: .07, bass: 'pluck', perc: 'wood', fire: true, drip: .22, parts: ['mel', 'light', 'harp', 'low'],
    ch: [[62, 65, 69, 72], [58, 62, 65, 69], [65, 69, 72, 76], [60, 64, 67, 70], [62, 65, 69, 72], [55, 58, 62, 65], [58, 62, 65, 69], [60, 64, 67, 70]], root: [50, 46, 53, 48, 50, 43, 46, 48],
    mel: [[81, 0, 77, 0, 74, 76], [77, 0, 74, 0, 70, 0], [81, 0, 84, 0, 81, 79], [79, 0, 76, 0, 72, 0], [74, 77, 81, 0, 86, 0], [82, 0, 79, 0, 74, 0], [77, 0, 74, 77, 82, 0], [76, 0, 79, 0, 84, 0]] },
  donjon: { bpm: 56, beats: 4, vol: .34, pad: .022, box: .05, bass: 'drone', perc: 'thump', drip: .55, parts: ['mel', 'harp', 'low', 'rest'],
    ch: [[64, 67, 71], [65, 69, 72], [64, 67, 71], [62, 65, 69], [64, 67, 71], [60, 64, 67], [59, 62, 66], [64, 67, 71]], root: [40, 41, 40, 38, 40, 36, 35, 40],
    mel: [[76, 0, 0, 0, 77, 0, 0, 0], [76, 0, 0, 0, 72, 0, 0, 0], [71, 0, 0, 0, 0, 0, 72, 0], [74, 0, 0, 0, 69, 0, 0, 0], [76, 0, 79, 0, 77, 0, 0, 0], [76, 0, 0, 0, 72, 0, 0, 0], [71, 0, 0, 0, 74, 0, 72, 0], [71, 0, 0, 0, 0, 0, 0, 0]] },
  combat: { bpm: 92, beats: 4, vol: .4, pad: .01, box: .06, bass: 'drive', perc: 'drums', parts: ['mel', 'mel', 'harp', 'light'],
    ch: [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 56, 59], [57, 60, 64], [53, 57, 60], [50, 53, 57], [52, 56, 59]], root: [45, 41, 43, 40, 45, 41, 38, 40],
    mel: [[81, 0, 76, 0, 72, 76, 81, 0], [77, 0, 72, 0, 69, 72, 77, 0], [79, 0, 74, 0, 71, 74, 79, 83], [80, 0, 76, 0, 71, 0, 68, 0], [81, 0, 84, 0, 81, 76, 72, 0], [77, 0, 81, 0, 77, 72, 69, 0], [74, 0, 77, 0, 81, 0, 79, 77], [76, 0, 80, 0, 83, 0, 0, 0]] },
  boss: { bpm: 100, beats: 4, vol: .42, pad: .012, box: .06, bass: 'drive', perc: 'drums', stab: true, parts: ['mel', 'mel', 'harp', 'mel'],
    ch: [[62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64], [62, 65, 69], [58, 62, 65], [55, 58, 62], [57, 61, 64]], root: [38, 46, 43, 45, 38, 46, 43, 45],
    mel: [[74, 77, 81, 77, 74, 0, 69, 0], [70, 74, 77, 74, 70, 0, 74, 0], [67, 70, 74, 70, 79, 0, 77, 0], [76, 0, 73, 0, 69, 0, 73, 76], [86, 0, 81, 0, 77, 0, 74, 0], [82, 0, 77, 0, 74, 0, 70, 0], [79, 0, 74, 0, 70, 74, 79, 82], [81, 0, 0, 0, 73, 0, 76, 0]] },
};
function musGraph() {
  const c = SND.ctx; if (MUS.out && MUS.out.context === c) return;
  const out = c.createGain(), dry = c.createGain(), wet = c.createGain(), conv = c.createConvolver(), comp = c.createDynamicsCompressor(), pad = c.createBiquadFilter(), lofi = c.createBiquadFilter(), sat = c.createWaveShaper();
  const len = Math.floor(c.sampleRate * 2.2), ir = c.createBuffer(2, len, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
  conv.buffer = ir; dry.gain.value = .8; wet.gain.value = .35; out.gain.value = 0;
  pad.type = 'lowpass'; pad.frequency.value = 700; pad.connect(out);
  // lo-fi : les aigus coupés, une saturation douce, puis la réverbération
  lofi.type = 'lowpass'; lofi.frequency.value = 1900; lofi.Q.value = .4;
  const curve = new Float32Array(1024); for (let i = 0; i < 1024; i++) { const x = i / 511.5 - 1; curve[i] = Math.tanh(1.6 * x) / Math.tanh(1.6); } sat.curve = curve;
  // le flottement de la bande : une ligne à retard dont la longueur ondule à peine (tout le mix flotte de quelques cents)
  const dl = c.createDelay(.05), wow = c.createOscillator(), wowG = c.createGain(); dl.delayTime.value = .012; wow.frequency.value = .45; wowG.gain.value = .0011; wow.connect(wowG).connect(dl.delayTime); wow.start();
  out.connect(dl).connect(lofi).connect(sat); sat.connect(dry).connect(comp); sat.connect(conv).connect(wet).connect(comp); comp.connect(c.destination);
  // le souffle du vinyle : un bruit sourd, très bas, et ses petits craquements
  const n = c.sampleRate * 2, b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * .5 + (Math.random() < .0004 ? (Math.random() - .5) * 6 : 0);
  const hiss = c.createBufferSource(), hf = c.createBiquadFilter(), hg = c.createGain(); hiss.buffer = b; hiss.loop = true; hf.type = 'bandpass'; hf.frequency.value = 1200; hf.Q.value = .5; hg.gain.value = .012; hiss.connect(hf).connect(hg).connect(out); hiss.start();
  MUS.out = out; MUS.pad = pad;
}
/* ---------- les instruments ---------- */
const musOsc = (type, f, t, dur, peak, dest, att = .01, det = 0) => { const c = SND.ctx, o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.value = f; o.detune.value = det; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + att); g.gain.exponentialRampToValueAtTime(.0001, t + dur); o.connect(g).connect(dest); o.start(t); o.stop(t + dur + .05); return o; };
function musPad(ch, t, dur, v) {
  const c = SND.ctx;
  ch.forEach(n => [-6, 6].forEach(det => { const o = c.createOscillator(), g = c.createGain(); o.type = 'triangle'; o.frequency.value = musHz(n - 12); o.detune.value = det;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + .7); g.gain.setValueAtTime(v, t + Math.max(.8, dur - .3)); g.gain.linearRampToValueAtTime(0, t + dur + .4);
    o.connect(g).connect(MUS.pad); o.start(t); o.stop(t + dur + .5); }));
}
const musBox = (n, t, v) => [[1, 1], [2, .1]].forEach(([h, a]) => musOsc('sine', musHz(n - 12) * h, t, 1.3 / h, v * a, MUS.out, .012));   // un piano électrique feutré (lo-fi), une octave plus bas
let MUS_NOISE = null;
const musNoise = () => { const c = SND.ctx; if (MUS_NOISE && MUS_NOISE.c === c) return MUS_NOISE.b; const n = Math.floor(c.sampleRate * .5), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1; MUS_NOISE = { c, b }; return b; };
function musHit(t, f, q, v, dur, type = 'bandpass') {
  const c = SND.ctx, s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain();
  s.buffer = musNoise(); fl.type = type; fl.frequency.value = f; fl.Q.value = q;
  g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  s.connect(fl).connect(g).connect(MUS.out); s.start(t, Math.random() * .4); s.stop(t + dur + .02);
}
function musThump(t, v = .12, f0 = 110) { const c = SND.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(42, t + .18); g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(.0001, t + .32); o.connect(g).connect(MUS.out); o.start(t); o.stop(t + .35); }
function musDrip(t) { const c = SND.ctx, o = c.createOscillator(), g = c.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(900 + Math.random() * 200, t); o.frequency.exponentialRampToValueAtTime(380, t + .13); g.gain.setValueAtTime(.012, t); g.gain.exponentialRampToValueAtTime(.0001, t + .18); o.connect(g).connect(MUS.out); o.start(t); o.stop(t + .2); }
function musStab(ch, t) {   // les accords cuivrés du boss
  const c = SND.ctx, f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.setValueAtTime(900, t); f.frequency.exponentialRampToValueAtTime(320, t + .35); f.connect(MUS.out);
  ch.forEach(n => musOsc('sawtooth', musHz(n - 12), t, .45, .02, f, .02));
}
/* ---------- une mesure ---------- */
function musBar(T, i, t) {
  const beat = 60 / T.bpm, e8 = beat / 2, bar = T.beats * beat, k = i % 8, part = T.parts[Math.floor(i / 8) % T.parts.length], ch = T.ch[k], r = T.root[k];
  musPad(ch, t, bar, T.pad);
  // la basse
  if (T.bass === 'pluck') { musOsc('triangle', musHz(r), t, beat * 1.8, .06, MUS.out, .02); if (Math.random() < .6) musOsc('triangle', musHz(r + 7), t + 2 * beat, beat * 1.6, .04, MUS.out, .02); }
  else if (T.bass === 'drone') musOsc('sine', musHz(r), t, bar + .3, .07, MUS.out, .6);
  else [0, 0, 12, 0, 7, 0, 12, 7].forEach((d, j) => musOsc('triangle', musHz(r + d), t + j * e8, e8 * .9, j % 2 ? .035 : .055, MUS.out, .008));
  // la mélodie, selon le tour
  const mel = T.mel[k];
  const sw = j => j * e8 + (j % 2 ? e8 * .18 : 0) + (Math.random() - .5) * .012;
  if (part === 'mel' || part === 'light') mel.forEach((n, j) => { if (n && (part === 'mel' || Math.random() < .7)) musBox(n, t + sw(j), part === 'light' ? T.box * .8 : T.box); });
  else if (part === 'harp') { const pat = T.beats === 3 ? [0, 1, 2, 1, 2, 1] : [0, 1, 2, 1, 0, 1, 2, 1]; pat.forEach((x, j) => musBox(ch[x] + (ch[3] && j % 4 === 3 ? ch[3] - ch[x] : 0) + 12, t + sw(j), T.box * .6)); }
  else if (part === 'low') mel.forEach((n, j) => { if (n && j % 2 === 0 && Math.random() < .8) musBox(n - 12, t + sw(j), T.box * .7); });
  // le rythme
  if (T.perc === 'wood' && part !== 'harp') for (let b = 1; b < T.beats; b++) if (Math.random() < .55) musHit(t + b * beat, 850, 4, .03, .07);   // un toc de bois étouffé
  if (T.perc === 'thump') { musThump(t, .09, 90); if (Math.random() < .4) musThump(t + 2 * beat, .05, 80); }
  if (T.perc === 'drums') for (let b = 0; b < T.beats; b++) { if (b % 2 === 0) musThump(t + b * beat, .12); else musHit(t + b * beat, 1100, 1, .05, .14); if (Math.random() < .7) musHit(t + b * beat + e8 * 1.18, 3500, 1.5, .008, .03); }   // grosse caisse, caisse claire étouffée, charleston discret (balancé)
  if (T.stab) musStab(ch, t);
  // le décor : le feu, les gouttes
  if (T.fire) for (let n = 1 + Math.floor(Math.random() * 3); n > 0; n--) musHit(t + Math.random() * bar, 1400, .8, .006 + Math.random() * .006, .02);   // le feu, sourd
  if (T.drip && Math.random() < T.drip) musDrip(t + Math.random() * bar);
  return bar;
}
function musTick() {
  if (!MUS.playing || MUS.switching || !SND.ctx) return;
  const c = SND.ctx, T = MUS_THEMES[MUS.theme]; if (!T) return; if (MUS.next < c.currentTime) MUS.next = c.currentTime + .05;
  try { while (MUS.next < c.currentTime + 1.2) MUS.next += musBar(T, MUS.bar++, MUS.next); } catch (e) {}
}
const musRamp = (v, s) => { try { const c = SND.ctx, g = MUS.out.gain; g.cancelScheduledValues(c.currentTime); g.setValueAtTime(g.value, c.currentTime); g.linearRampToValueAtTime(v, c.currentTime + s); } catch (e) {} };
function musStart(theme) {
  if (MUS.playing || !SND.ctx) return;
  try { musGraph(); MUS.theme = theme; MUS.bar = 0; MUS.playing = true; MUS.next = SND.ctx.currentTime + .1; musRamp(musLevel(theme), 3); MUS.timer = setInterval(musTick, 200); musTick(); } catch (e) {}
}
function musStop() { if (!MUS.playing) return; MUS.playing = false; clearInterval(MUS.timer); musRamp(0, 1.2); }
// d'un thème à l'autre : on baisse, on change, on remonte
function musSwitch(theme) {
  if (MUS.switching) return; MUS.switching = true; musRamp(0, .7);
  setTimeout(() => { MUS.theme = theme; MUS.bar = 0; MUS.next = SND.ctx.currentTime + .05; MUS.switching = false; musRamp(musLevel(theme), 1.2); musTick(); }, 750);
}
// le moment du jeu : un combat (un boss ?), une expédition, une invasion, ou le château
function musWanted() {
  const page = document.getElementById('crawlPage');
  if (!page) return 'chateau';
  if (page.classList.contains('battle')) return page.querySelector('.faura') ? 'boss' : 'combat';
  return page.classList.contains('theme-chateau') ? 'chateau' : 'donjon';
}
const musLevel = theme => (MUS_THEMES[theme] || {}).vol * (theme === 'chateau' && document.getElementById('crawlPage') ? .6 : 1);
function musWatch() {
  const want = SND.on && MUS.on && !!SND.ctx && !document.hidden, theme = want ? musWanted() : null;
  if (!want) { if (MUS.playing) musStop(); return; }
  if (!MUS.playing) musStart(theme);
  else if (theme !== MUS.theme) musSwitch(theme);
}
function musToggle() { MUS.on = !MUS.on; try { uiPrefs({ music: MUS.on }); } catch (e) {} musWatch(); return MUS.on; }
if (typeof document !== 'undefined' && typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext) && typeof setInterval === 'function') setInterval(musWatch, 700);
