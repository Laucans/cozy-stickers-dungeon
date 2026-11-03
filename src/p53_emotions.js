/* =========================================================
   Les émotions des stickers
   Chaque créature (et chaque héros) a ses stickers d'émotion :
   douleur, heureux, triste, agacé, endormi, peur, K.O. Ce sont
   de vrais stickers (même liseré blanc), qui remplacent le
   sprite le temps de l'émotion : les yeux et la bouche changent,
   et un petit signe s'ajoute (des Z, une larme, une veine en
   colère, une étoile d'impact, des gouttes de sueur…).
   La clé d'un sticker d'émotion : « espèce~émotion ».
   ========================================================= */
const EMOS = ['pain', 'happy', 'sad', 'angry', 'sleep', 'scared', 'ko'];
let EMO = null, EMO_IN_HEAD = false, EMO_EYE_I = 0, EMO_EYES = [], EMO_HEAD = null;
const emoPt = (g, x, y) => { try { const p = g.getTransform().transformPoint(new DOMPoint(x, y)); return [p.x, p.y]; } catch (e) { return [x, y]; } };
const emoScale = g => { try { const T = g.getTransform(); return Math.hypot(T.a, T.b); } catch (e) { return 1; } };

// les yeux : fermés, plissés, en croix, écarquillés… (sad et angry gardent l'œil et ajoutent sourcil et paupière)
function emoBrow(g, x, y, s, side, e) {
  const d = side === 'l' ? 1 : -1;   // d : vers l'intérieur du visage
  if (e === 'angry') ln(g, [[x - d * 3.8 * s, y - 7.4 * s], [x + d * 3.4 * s, y - 4.6 * s]], INK, 2.3);
  else if (e === 'sad') ln(g, [[x - d * 3.8 * s, y - 5 * s], [x + d * 3.2 * s, y - 7.8 * s]], INK, 2);
  else if (e === 'scared') { g.beginPath(); g.arc(x, y - 4.2 * s, 3.6 * s, 1.15 * Math.PI, 1.85 * Math.PI); g.lineWidth = 1.9; g.strokeStyle = INK; g.stroke(); }
}
const eyeBase = eye;
eye = function (g, x, y, s, iris, look) {
  const e = EMO; if (!e) return eyeBase(g, x, y, s, iris, look);
  const side = EMO_EYE_I++ % 2 === 0 ? 'l' : 'r', d = side === 'l' ? 1 : -1;
  if (!EMO_IN_HEAD) EMO_EYES.push([...emoPt(g, x, y), emoScale(g) * s]);
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.strokeStyle = INK; g.lineWidth = 1.9;
  if (e === 'sleep') { g.beginPath(); g.arc(x, y - 1.6 * s, 3.4 * s, .18 * Math.PI, .82 * Math.PI); g.stroke(); ln(g, [[x + d * 3.1 * s, y + .3 * s], [x + d * 4.6 * s, y + 1.4 * s]], INK, 1.2); }
  else if (e === 'happy') { g.beginPath(); g.arc(x, y + 1.6 * s, 3.4 * s, 1.15 * Math.PI, 1.85 * Math.PI); g.lineWidth = 2.1; g.stroke(); }
  else if (e === 'pain') { g.beginPath(); g.moveTo(x - d * 3 * s, y - 3.2 * s); g.lineTo(x + d * 2.6 * s, y); g.lineTo(x - d * 3 * s, y + 3.2 * s); g.lineWidth = 2.1; g.stroke(); }
  else if (e === 'ko') { g.lineWidth = 1.9; ln(g, [[x - 2.8 * s, y - 2.8 * s], [x + 2.8 * s, y + 2.8 * s]], INK, 1.9); ln(g, [[x + 2.8 * s, y - 2.8 * s], [x - 2.8 * s, y + 2.8 * s]], INK, 1.9); }
  else if (e === 'scared') {
    g.beginPath(); g.ellipse(x, y, 4.1 * s, 4.9 * s, 0, 0, Math.PI * 2); g.fillStyle = '#fbf8f1'; g.fill(); g.lineWidth = 1.1; g.stroke();
    ball(g, x + d * .3 * s, y + .4 * s, 1.15 * s, '#120a08', 0); ball(g, x - .6 * s, y - .8 * s, .5 * s, '#fff', 0);
  } else {   // triste : le regard tombe ; agacé : une paupière lourde
    eyeBase(g, x, y, s, iris, e === 'sad' ? [.2 * d, 1.5] : [.6 * d, .6]);
    if (e === 'angry') { g.beginPath(); g.moveTo(x - 3.9 * s, y - (d > 0 ? 3.6 : 1.6) * s); g.lineTo(x + 3.9 * s, y - (d > 0 ? 1.6 : 3.6) * s); g.lineWidth = 1.8; g.stroke(); }
  }
  if (!EMO_IN_HEAD) emoBrow(g, x, y, s, side, e);
  g.restore();
};
// la bouche
function emoMouth(g, x, y, e, k = 1) {
  g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.translate(x, y); g.scale(k, k);
  if (e === 'happy') { g.beginPath(); g.moveTo(-5, -2.6); g.quadraticCurveTo(0, 6.5, 5, -2.6); g.closePath(); fi(g, '#6a2a2a', 1.2); ell(g, .5, 1.7, 2.2, 1.1, '#e0707a', 0); }
  else if (e === 'sad') { g.beginPath(); g.arc(0, 3, 3.8, 1.18 * Math.PI, 1.82 * Math.PI); g.lineWidth = 1.6; g.strokeStyle = INK; g.stroke(); }
  else if (e === 'angry') { rrect(g, -4.6, -2, 9.2, 3.6, 1.2, '#fffaf0', 1); ln(g, [[-4.4, -.2], [4.4, -.2]], INK, .7); ln(g, [[-5.6, 1.4], [-4.2, -1.6]], INK, 1.2); ln(g, [[5.6, 1.4], [4.2, -1.6]], INK, 1.2); }
  else if (e === 'pain') { g.beginPath(); g.moveTo(-5, -2); g.lineTo(5, -2); g.lineTo(4, 2.6); g.lineTo(-4, 2.6); g.closePath(); fi(g, '#fffaf0', 1.1); g.beginPath(); g.moveTo(-4, .3); for (let i = 0; i < 6; i++) g.lineTo(-4 + (i + 1) * 1.35, i % 2 ? .3 : -1); g.lineWidth = .8; g.strokeStyle = INK; g.stroke(); }
  else if (e === 'sleep') { ell(g, 1, -.5, 1.5, 1.8, '#5a2222', .9); }
  else if (e === 'scared') { g.beginPath(); g.moveTo(-4.5, 0); for (let i = 0; i < 6; i++) g.quadraticCurveTo(-4.5 + i * 1.5 + .75, i % 2 ? 1.6 : -1.6, -4.5 + (i + 1) * 1.5, 0); g.lineWidth = 1.4; g.strokeStyle = INK; g.stroke(); }
  else if (e === 'ko') { g.beginPath(); g.moveTo(-4, 0); for (let i = 0; i < 4; i++) g.quadraticCurveTo(-4 + i * 2 + 1, i % 2 ? 1.6 : -1.6, -4 + (i + 1) * 2, 0); g.lineWidth = 1.4; g.strokeStyle = INK; g.stroke(); ell(g, 2.2, 2.2, 1.7, 2.2, '#e0707a', .8); }
  g.restore();
}
// la tête des créatures « humanoïdes » : yeux et bouche d'émotion, sourcils, et l'ancre des petits signes
const headBase = head;
head = function (g, s, hx, hy) {
  if (!EMO) return headBase(g, s, hx, hy);
  const swap = ['sleep', 'happy', 'pain', 'ko', 'scared'].includes(EMO), glowy = s.eyes === 'glow' || s.eyes === 'sockets';
  EMO_IN_HEAD = true; EMO_EYE_I = 0;
  try { headBase(g, { ...s, mouth: s.hat === 'bucket' ? s.mouth : 'none', brow: false, eyes: swap && glowy ? 'normal' : s.eyes }, hx, hy); } finally { EMO_IN_HEAD = false; }
  if (s.hat !== 'bucket') {
    [[-4.6, 'l'], [4.6, 'r']].forEach(([dx, side]) => emoBrow(g, hx + dx, hy - 2, .95, side, EMO));
    emoMouth(g, hx + .5, hy + 8.5, EMO, s.beard ? .85 : 1);
  }
  EMO_HEAD = [...emoPt(g, hx, hy), emoScale(g)];
};
// le Fantôme a son propre visage (deux ovales sombres) : on le redessine pour l'émotion
const ghostEmo = SPECIALS.ghost;
SPECIALS.ghost = g => {
  ghostEmo(g); if (!EMO) return;
  g.save(); g.translate(0, -6); ell(g, 0, -30, 10.5, 9.5, '#e6eefe', 0);
  if (EMO === 'sad' || EMO === 'angry') { [-5, 5].forEach((x, i) => { ell(g, x, -33.4, 2.8, EMO === 'angry' ? 3.2 : 4, '#1e1830', 0); emoBrow(g, x, -33, .8, i ? 'r' : 'l', EMO); }); EMO_EYES.push([...emoPt(g, 0, -34), emoScale(g) * .8]); }
  else { EMO_EYE_I = 0; eye(g, -5, -34, .8, '#1e1830', [0, .3]); eye(g, 5, -34, .8, '#1e1830', [0, .3]); }
  emoMouth(g, 0, -25, EMO, .75); g.restore();
};
// les petits signes autour de la tête (dans le repère du sticker)
function emoSigns(g, x, y, k, e) {
  g.save(); g.translate(x, y); g.scale(k, k); g.lineCap = 'round'; g.lineJoin = 'round';
  const drop = (dx, dy, r, col) => { g.beginPath(); g.moveTo(dx, dy - r * 1.8); g.quadraticCurveTo(dx + r * 1.1, dy - r * .2, dx, dy + r); g.quadraticCurveTo(dx - r * 1.1, dy - r * .2, dx, dy - r * 1.8); fi(g, col, 1); ball(g, dx - r * .3, dy - r * .1, r * .28, 'rgba(255,255,255,.8)', 0); };
  const star = (dx, dy, r, col) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * .55 : r; g.lineTo(dx + Math.cos(a) * rr, dy + Math.sin(a) * rr); } g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = Math.min(.9, r * .2); g.strokeStyle = 'rgba(60,35,20,.85)'; g.stroke(); };   // un liseré fin : l'étoile reste jaune
  const heart = (dx, dy, r, col) => { g.beginPath(); g.moveTo(dx, dy + r); g.bezierCurveTo(dx - r * 1.6, dy - r * .1, dx - r * .8, dy - r * 1.4, dx, dy - r * .45); g.bezierCurveTo(dx + r * .8, dy - r * 1.4, dx + r * 1.6, dy - r * .1, dx, dy + r); fi(g, col, 1); };
  if (e === 'sleep') { g.font = '900 11px Andika, sans-serif'; g.textAlign = 'center'; [[15, -15, 1], [22, -24, .75]].forEach(([dx, dy, sc]) => { g.save(); g.translate(dx, dy); g.scale(sc, sc); g.lineWidth = 3; g.strokeStyle = INK; g.strokeText('Z', 0, 0); g.fillStyle = '#e6eeff'; g.fillText('Z', 0, 0); g.restore(); }); }
  else if (e === 'happy') { heart(16, -14, 4.2, '#ff7aa8'); heart(-17, -9, 3, '#ff9cbc'); star(12, -24, 2.6, '#ffe07a'); }
  else if (e === 'sad') { drop(-8, 5, 2.2, '#8fd0ff'); [[-6, -20], [0, -22], [6, -20]].forEach(([dx, dy]) => ln(g, [[dx, dy], [dx, dy + 4]], '#6a8ad0', 1.6)); }
  else if (e === 'angry') { g.save(); g.translate(14, -15); g.strokeStyle = INK; [[0, 1], [1, 0], [0, -1], [-1, 0]].forEach(([a, b]) => { g.beginPath(); g.moveTo(a * 1.5 + b * 3.6, b * 1.5 - a * 3.6); g.quadraticCurveTo(a * 4.5, b * 4.5, a * 1.5 - b * 3.6, b * 1.5 + a * 3.6); g.lineWidth = 3.6; g.strokeStyle = INK; g.stroke(); g.lineWidth = 2; g.strokeStyle = '#e8413a'; g.stroke(); }); g.restore(); }
  else if (e === 'pain') { star(-15, -13, 6.5, '#ffe07a'); star(-15, -13, 3.2, '#fffaf0'); drop(14, -8, 1.9, '#9fdcff'); }
  else if (e === 'scared') { drop(14, -10, 1.9, '#9fdcff'); drop(-14, -6, 1.5, '#9fdcff'); g.globalAlpha = .55; [-5, -1.5, 2, 5.5].forEach(dx => ln(g, [[dx, -13], [dx, -7]], '#5b6fd0', 1.3)); }
  else if (e === 'ko') { [[-11, -19], [0, -24], [11, -19]].forEach(([dx, dy], i) => star(dx, dy, i === 1 ? 3.6 : 2.8, '#ffe07a')); }
  g.restore();
}
// un sticker d'émotion : le dessin habituel, l'émotion par-dessus
const drawArtBase = drawArt;
drawArt = function (kind, key, g) {
  if (!(kind === 'char' || kind === 'hero' || kind === 'foe') || typeof key !== 'string' || !key.includes('~')) return drawArtBase(kind, key, g);
  const [k, e] = key.split('~'); if (!EMOS.includes(e)) return drawArtBase(kind, k, g);
  let T0 = null; try { T0 = g.getTransform(); } catch (err) {}
  EMO = e; EMO_EYE_I = 0; EMO_EYES = []; EMO_HEAD = null;
  try { drawArtBase(kind, k, g); } finally { EMO = null; }
  // l'ancre : la tête (humanoïdes), sinon les yeux (créatures dessinées à part), sinon le haut du sticker
  try {
    let ax = 0, ay = -50, sc = 1;
    if (T0) {
      const inv = T0.inverse(), base = Math.hypot(T0.a, T0.b), back = ([x, y]) => { const p = inv.transformPoint(new DOMPoint(x, y)); return [p.x, p.y]; };
      if (EMO_HEAD) { [ax, ay] = back(EMO_HEAD); sc = EMO_HEAD[2] / base; }
      else if (EMO_EYES.length) { const mx = EMO_EYES.reduce((a, p) => a + p[0], 0) / EMO_EYES.length, my = EMO_EYES.reduce((a, p) => a + p[1], 0) / EMO_EYES.length; [ax, ay] = back([mx, my]); ay += 2; sc = Math.max(.7, EMO_EYES[0][2] / base / .9); }
      g.save(); g.setTransform(T0); emoSigns(g, ax, ay, sc, e); g.restore();
    } else emoSigns(g, ax, ay, sc, e);
  } catch (err) { console.error('émotion', key, err); }
};

/* ---------- quand les jouer ---------- */
// créer les stickers d'émotion petit à petit, sans à-coup (un par image au plus)
const EMO_Q = new Set();
function emoReady(kind, key) {
  if (SPR.has(kind + ':' + key + '@' + SQ().toFixed(2))) return true;
  if (!EMO_Q.has(kind + '|' + key)) { EMO_Q.add(kind + '|' + key); if (EMO_Q.size === 1) setTimeout(emoPump, 30); }
  return false;
}
function emoPump() { const it = EMO_Q.values().next(); if (it.done) return; EMO_Q.delete(it.value); const [kind, key] = it.value.split('|'); try { getSprite(kind, key); } catch (e) {} if (EMO_Q.size) setTimeout(emoPump, 30); }
// une émotion passagère, déclenchée par un événement (envie comblée, rêve réalisé…)
function emote(id, e, ms = 2200) { const a = (typeof ACT !== 'undefined' && ACT.get(id)) || null; if (a) { a.emo = e; a.emoUntil = performance.now() + ms; } }
// ce que ressent une créature sur le château, en ce moment
function actorEmo(a, t) {
  if (a.kind !== 'char' && a.kind !== 'hero') return null;
  if (a.hurtUntil && t < a.hurtUntil + 380) return 'pain';
  if (a.emoUntil && t < a.emoUntil) return a.emo;
  const P = a.walking ? null : a.pose;
  if (P === 'ko' || a.down) return 'ko';
  if (P === 'sleep') return 'sleep';
  if (P === 'shake') return 'angry';
  if (P === 'dance') return 'happy';
  if (a.kind === 'hero') return null;
  const c = typeof critter === 'function' ? critter(a.id) : null; if (!c) return null;
  if (typeof HEROS !== 'undefined' && HEROS.length && !a.fight && (V.heroZ || 0) === Z) return 'scared';   // des héros dans le château
  if (injured(c)) return ((t / 1000 + a.ph * 5) % 6) < 2.2 ? 'pain' : 'sad';
  if (c.mood <= 0) return 'angry';
  if (c.mood <= 1) return 'sad';
  if (c.mood >= 4 && ((t / 1000 + a.ph * 7) % 9) < 1.7) return 'happy';   // un sourire de temps en temps
  return null;
}
const drawActorEmo = drawActor;
drawActor = function (c, a, t) {
  const e = actorEmo(a, t);
  if (!e || !emoReady(a.kind, a.key + '~' + e)) return drawActorEmo(c, a, t);
  const k0 = a.key; a.key = k0 + '~' + e;
  try { return drawActorEmo(c, a, t); } finally { a.key = k0; }
};
// les vignettes : l'humeur du moment
function moodEmo(c) { if (!c || isOut(c)) return null; if (injured(c)) return 'pain'; if (c.mood <= 0) return 'angry'; if (c.mood <= 1) return 'sad'; if (c.mood >= 4) return 'happy'; return null; }
const renderPortraitsEmo = renderPortraits;
renderPortraits = function () {
  renderPortraitsEmo();
  try { document.querySelectorAll('#portraits .pt').forEach(b => { const c = critter(b.dataset.crit), img = b.querySelector('.ring img'), e = moodEmo(c); if (!c || !img) return; const src = portrait(e ? c.sp + '~' + e : c.sp); if (img.getAttribute('src') !== src) img.src = src; }); } catch (e) { console.error(e); }
};
const openCreatureEmo = openCreature;
openCreature = function (id) {
  openCreatureEmo(id);
  try { const c = critter(id), e = moodEmo(c), img = document.querySelector('#modalRoot .modal .cardhead .portrait img'); if (c && e && img) img.src = thumb('char', c.sp + '~' + e, true); } catch (err) { console.error(err); }
};
// les envies comblées et les rêves réalisés : un grand sourire
const grantEnvieEmo = grantEnvie;
grantEnvie = function (c, ...r) { const out = grantEnvieEmo(c, ...r); try { if (c) emote(c.id, 'happy', 2600); } catch (e) {} return out; };

/* ---------- en expédition : la vignette de chaque combattant change avec ce qu'il vit ---------- */
const foeImgEmo = foeImg;
foeImg = function (o) {
  const html = foeImgEmo(o), L = o.k && CRAWL_LOOK[o.k];
  const ek = L ? (L[0] === 'char' ? `char:${L[1]}` : '') : FOE_ART[o.k] ? `foe:${o.k}` : o.sp ? `char:${o.sp}` : '';   // un décor (l'arbre) n'a pas d'émotions
  if (!ek || !o.mood || !html.startsWith('<img')) return ek ? html.replace('<img ', `<img data-ek="${ek}" `) : html;
  const [kind, key] = ek.split(':'); return html.replace(/src="[^"]*"/, `src="${thumb(kind, key + '~' + o.mood, true)}"`).replace('<img ', `<img data-ek="${ek}" `);
};
const figHTMLEmo = figHTML;
figHTML = function (f, tgt) {
  const k = f.max ? f.hp / f.max : 1, mood = f.down ? 'ko' : f.stunned ? 'ko' : f.side !== 'foe' && f.stress >= STRESS_MAX * .6 ? 'scared' : k < .3 ? 'pain' : null;
  if (!mood) return figHTMLEmo(f, tgt);
  const imgBase = foeImg; foeImg = o => imgBase({ ...o, mood });
  try { return figHTMLEmo(f, tgt); } finally { foeImg = imgBase; }
};
const crawlAnimatorEmo = crawlAnimator;
crawlAnimator = function (body, page) {
  const A = crawlAnimatorEmo(body, page);
  const flash = (id, e, ms) => {
    const f = A.figEl(id), img = f && f.querySelector('.fspr img[data-ek]'); if (!img) return;
    const [kind, key] = img.dataset.ek.split(':'), keep = img.dataset.src0 || img.getAttribute('src'); img.dataset.src0 = keep;
    try { img.src = thumb(kind, key + '~' + e, true); } catch (err) { return; }
    if (ms) { clearTimeout(img._emoT); img._emoT = setTimeout(() => { if (img.isConnected) img.src = keep; }, ms); }
  };
  const play = async (evs, q = 1) => {
    for (const ev of evs) {
      const x = ev.fx;
      if (x && x.to != null) {
        if (x.k === 'hit' || x.k === 'hurt') { if (x.v) flash(x.to, 'pain', 650); }
        else if (x.k === 'down' || x.k === 'ko') flash(x.to, 'ko', 0);
        else if (x.k === 'fear' || x.k === 'panic') flash(x.to, 'scared', 900);
        else if (x.k === 'stun' || x.k === 'pstun') flash(x.to, 'ko', 900);
        else if (x.k === 'heal' || x.k === 'fheal' || x.k === 'buff' || x.k === 'fbuff' || x.k === 'revive' || x.k === 'calm') flash(x.to, 'happy', 800);
        else if (x.k === 'weak' || x.k === 'poison') flash(x.to, 'sad', 700);
      }
      await A.play([ev], q);
    }
  };
  return { ...A, play };
};

WIKI.emotions = { cat: 'crea', t: 'Les émotions des stickers', x: () => `<p>Chaque créature a ses stickers d’émotion, qui remplacent son sticker habituel le temps d’un instant :</p><ul><li><b>Douleur</b> quand elle prend un coup (et de temps en temps quand elle est sonnée) ; <b>K.O.</b> quand elle tombe.</li><li><b>Heureuse</b> quand elle est ravie (4 cœurs et plus), qu’elle danse ou qu’une envie est comblée.</li><li><b>Triste</b> quand elle broie du noir, <b>agacée</b> quand elle est furieuse ou qu’elle se chamaille.</li><li><b>Endormie</b> pendant la sieste, <b>apeurée</b> quand des héros rôdent dans le château.</li></ul><p>Sa vignette, dans la liste, montre son humeur du moment ; en expédition, chaque combattant grimace, sourit ou tombe K.O. au fil des coups.</p>` };
