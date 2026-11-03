
/* =========================================================
   Petits stickers d'état au-dessus des créatures : on voit
   d'un coup d'œil qui a une nouvelle envie (!), qui vient
   d'être comblé (❤), qui menace de partir (💢), qui est
   sonné (🤕)… Ils disparaissent quand on ouvre la fiche
   ou quand la situation change.
   ========================================================= */
const STATUS = {
  captive: { ch: '🪤', bg: '#5a4a3a', tip: 'Retenu·e au village : paie la rançon ou attends son évasion' },
  part:   { ch: '💢', bg: '#d9452f', tip: 'Fâché·e : lorgne vers un rival et peut partir à l’aube', shake: 1 },
  saga:   { ch: '📖', bg: '#7a4bd1', tip: 'Son intrigue attend la suite', bob: 1 },
  envie:  { ch: '!', bg: '#f2c230', fg: '#3a2408', tip: 'Nouvelle envie', bob: 1 },
  ready:  { ch: '🧭', bg: '#3f8fd9', tip: 'Prêt·e à partir à l’aventure', bob: 1 },
  comble: { ch: '❤', bg: '#e8557a', tip: 'Envie comblée !' },
  secret: { ch: '?', bg: '#9b6bff', tip: 'Rêve secret découvert' },
  niveau: { ch: '★', bg: '#f5b83a', fg: '#3a2408', tip: 'Niveau gagné' },
  blesse: { ch: '🤕', bg: '#6d7f99', tip: 'Sonné·e : se repose une nuit' },
  paie:   { ch: '💰', bg: '#b8452f', tip: 'Pas payé·e à la dernière paie' },
  boude:  { ch: '☁', bg: '#7d6f86', tip: 'Boude' },
  faim:   { ch: '🍖', bg: '#b0662a', tip: 'Ventre vide' },
};
// les petits événements récents (envie comblée, niveau, secret) : visibles le jour même et le lendemain
function ping(c, k) { if (c) (c.ping = c.ping || {})[k] = S.night; }
const pinged = (c, k) => c.ping && c.ping[k] != null && S.night - c.ping[k] <= 1;
let STATUS_HUNGRY = { t: 0, set: new Set() };
function statusOf(c) {
  if (c && c.captive) return ['captive'];
  if (!c || isOut(c)) return [];
  const now = performance.now(); if (now - STATUS_HUNGRY.t > 1500) STATUS_HUNGRY = { t: now, set: hungrySet() };
  const q = c.quest, out = [];
  if (c.tempt) out.push('part');
  if (typeof sagaReady === 'function' && sagaReady(c)) out.push('saga');
  if (q && q.st === 'active' && !q.seen) out.push('envie');
  if (q && q.st === 'ready') out.push('ready');
  if (pinged(c, 'comble')) out.push('comble');
  if (pinged(c, 'secret')) out.push('secret');
  if (pinged(c, 'niveau')) out.push('niveau');
  if (injured(c)) out.push('blesse');
  if (c.unpaid && S.night - c.unpaid < 2) out.push('paie');
  if (STATUS_HUNGRY.set.has(c.id)) out.push('faim');
  if (c.mood <= 1 && !c.tempt) out.push('boude');
  return out;
}
const STATUS_FONT = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
function stickerAt(x, y, r, S0, t, born) {
  const k = born ? clamp((t - born) / 260, 0, 1) : 1, pop = k < 1 ? .4 + .6 * k + Math.sin(k * Math.PI) * .25 : 1;
  const bob = S0.bob ? Math.sin(t / 260) * 2.4 : 0, sh = S0.shake ? Math.sin(t / 45) * 1.6 : 0, R = r * pop;
  ctx.save(); ctx.translate(x + sh, y - bob);
  ctx.beginPath(); ctx.arc(1.2, 2, R + 2.2, 0, 7); ctx.fillStyle = 'rgba(10,6,4,.45)'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, R + 2.2, 0, 7); ctx.fillStyle = '#fbf3e0'; ctx.fill();
  ctx.beginPath(); ctx.arc(0, 0, R, 0, 7); ctx.fillStyle = S0.bg; ctx.fill();
  ctx.beginPath(); ctx.arc(-R * .3, -R * .35, R * .45, 0, 7); ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fill();
  const plain = /^[!?★❤☁]$/.test(S0.ch);
  ctx.font = plain ? `900 ${Math.round(R * 1.45)}px Georgia, serif` : `${Math.round(R * 1.15)}px ${STATUS_FONT}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = S0.fg || '#fff'; ctx.fillText(S0.ch, 0, plain ? R * .08 : R * .06);
  ctx.restore();
}
function drawStatus(a, sx, top, t) {
  if (a.foe) { const r = RIVALS.find(o => o.id === a.foe); if (r) stickerAt(sx + 12 * CAM.s, top - 18, clamp(9 * CAM.s * 1.5, 8, 13), { ch: r.emo, bg: '#4a2a5a' }, t, 0); return; }
  if (a.kind !== 'char' || a.fight || a.leaving) return;
  const c = critter(a.id); if (!c) return;
  const list = statusOf(c).slice(0, 2), key = list.join(',');
  if (a.stKey !== key) { a.stKey = key; a.stBorn = t; }
  const r = clamp(9 * CAM.s * 1.5, 8, 13);
  list.forEach((k, i) => stickerAt(sx + (i ? -r * 1.9 : r * .9) + 6 * CAM.s, top - 4 - (i ? 0 : r * .3), i ? r * .82 : r, STATUS[k], t, a.stBorn));
}

/* ---------- ce qui les fait apparaître ---------- */
const grantEnvieBase = grantEnvie;
grantEnvie = function (c, q, lines) { const r = grantEnvieBase(c, q, lines); ping(c, 'comble'); return r; };
const gainXPBase = gainXP;
gainXP = function (c, n, lines) { const l0 = c.lvl || 1; const r = gainXPBase(c, n, lines); if ((c.lvl || 1) > l0) ping(c, 'niveau'); return r; };
const revealSecretBase = revealSecret;
revealSecret = function (c, how, lines) { const r = revealSecretBase(c, how, lines); ping(c, 'secret'); return r; };
// ouvrir la fiche, c'est en prendre connaissance : la nouvelle envie est vue, les petits événements s'effacent
const openCreatureBase = openCreature;
openCreature = function (id) { const c = critter(id); if (c && !(typeof VISIT !== 'undefined' && VISIT)) { if (c.quest) c.quest.seen = 1; delete c.ping; } return openCreatureBase(id); };
const openMissionsBase = openMissions;
openMissions = function () { S.creatures.forEach(c => { if (c.quest) c.quest.seen = 1; }); return openMissionsBase(); };
// et sur les portraits de gauche aussi
const renderPortraitsBase = renderPortraits;
renderPortraits = function () {
  renderPortraitsBase();
  document.querySelectorAll('#portraits .pt').forEach(b => {
    const c = critter(b.dataset.crit), k = c && statusOf(c)[0]; if (!k) return;
    const s0 = b.querySelector('.st'); if (s0) s0.remove();
    const S0 = STATUS[k], s = el('span', 'stk' + (S0.bob ? ' bob' : '') + (S0.shake ? ' shake' : ''), S0.ch); s.style.background = S0.bg; if (S0.fg) s.style.color = S0.fg;
    b.appendChild(s); b.title = `${S0.tip} · ${b.title}`;
  });
};

/* ---------- le Grimoire ---------- */
WIKI.etats = { cat: 'crea', t: 'Les petits stickers d’état', x: () => `<p>Au-dessus de chaque créature (et sur son portrait), un petit sticker rond signale ce qui la travaille. Ouvre sa fiche pour en savoir plus : les nouveautés s’effacent alors.</p>
  <ul>${Object.values(STATUS).map(s => `<li><span class="stk inl" style="background:${s.bg};${s.fg ? 'color:' + s.fg : ''}">${s.ch}</span> ${esc(s.tip)}</li>`).join('')}</ul>` };
