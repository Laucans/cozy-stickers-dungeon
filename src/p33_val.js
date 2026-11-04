
/* =========================================================
   Un Val qui réagit : des territoires à revendiquer, des
   horloges de faction (le Baron, les villages, ton rival)
   qui avancent selon tes actes, des héros qui reviennent
   avec une rancune, et des créatures qui grandissent en
   vivant selon leur nature.
   ========================================================= */

/* ---------- territoires : après un raid réussi, on peut planter son drapeau ---------- */
const CLAIMS = {
  ferme:     { g: 0, s: 1, food: 2, txt: '+1 🪵 et +2 repas chaque nuit' },
  moulin:    { g: 1, s: 0, food: 1, txt: '+1 💰 et +1 repas chaque nuit' },
  auberge:   { g: 2, s: 0, food: 0, txt: '+2 💰 chaque nuit' },
  monastere: { g: 1, s: 0, cal: 1, txt: '+1 💰 et −1 Calamité chaque nuit' },
};
const CLAIM_COST = { g: 5, s: 2 };
function claimsState() { return S.claims || (S.claims = { own: [], won: {} }); }
const claimCap = () => 1 + S.tier;
const ownClaim = k => !!(S.claims && S.claims.own.includes(k));
const claimFood = () => (S.claims ? S.claims.own.reduce((a, k) => a + ((CLAIMS[k] || {}).food || 0), 0) : 0);
function claimOK(k) {
  const C = claimsState(); if (!CLAIMS[k]) return 'Pas ici';
  if (ownClaim(k)) return 'Déjà à toi';
  if (!C.won[k]) return 'Il faut d’abord y réussir un raid';
  if (C.own.length >= claimCap()) return `${claimCap()} territoire${claimCap() > 1 ? 's' : ''} au plus (plus au palier suivant)`;
  if (!canAfford(CLAIM_COST)) return 'Pas assez';
  return null;
}
CMD.claim = function (a) {
  const err = claimOK(a.k); if (err) return err;
  pay(CLAIM_COST); claimsState().own.push(a.k); facTick('baron', 1);
  const s = world().sites.find(x => x.raid === a.k), near = s && nearestSettlement(s); if (near) addGw(near, -10);
  addLog(`Territoire revendiqué : ${RAIDS[a.k].name}.`, 'ev'); return null;
};
CMD.unclaim = function (a) { const C = claimsState(); if (!ownClaim(a.k)) return 'Pas à toi'; C.own = C.own.filter(k => k !== a.k); addLog(`Tu rends ${RAIDS[a.k].name}.`, ''); return null; };
function claimsDawn(out) {
  const C = S.claims; if (!C || !C.own.length) return;
  let g = 0, s = 0; C.own.forEach(k => { g += CLAIMS[k].g || 0; s += CLAIMS[k].s || 0; });
  S.gold += g; S.mat += s;
  if (g || s) out.push(['🏴', `Tes territoires (${C.own.map(k => RAIDS[k].name).join(', ')}) rapportent ${costText({ g, s })}.`, 'good']);
}
const calamityDeltaClaims = calamityDelta;
calamityDelta = function () { const r = calamityDeltaClaims(), c = S.claims ? S.claims.own.reduce((a, k) => a + ((CLAIMS[k] || {}).cal || 0), 0) : 0; if (c) { r.d -= c; r.parts.push(`−${c} territoire${c > 1 ? 's' : ''} paisible${c > 1 ? 's' : ''}`); } return r; };

/* ---------- horloges de faction ---------- */
const FAC = {
  baron: { ico: '🎩', name: 'Le Baron Pâlichon', projects: { milice: 'Lever une milice' }, why: 'Avance quand tu pilles les environs ou tiens des territoires. Recule quand tes créatures humilient ses aventuriers.' },
  val:   { ico: '🌾', name: 'Les villages du Val', projects: { fete: 'Préparer la fête des moissons', battue: 'Organiser une battue aux monstres', calme: 'Vaquer à leurs occupations' }, why: 'Selon leur bonne volonté : la fête si elle est haute, la battue si tu les as trop pillés.' },
  nem:   { ico: '🏴', name: 'Ton rival', projects: { tour: 'Élever une tour noire', bal: 'Donner un bal masqué', armee: 'Recruter une armée de sbires', pacte: 'Signer un pacte avec la Lune' }, why: 'Avance chaque nuit. Recule quand tu pilles sa tour, repousses ses sbires ou relèves ses défis.' },
};
function facState() {
  if (!S.fac) S.fac = { baron: { p: 'milice', v: 0, max: 6 }, val: { p: 'calme', v: 0, max: 6 }, nem: { p: 'tour', v: 0, max: 8 }, patrol: 0 };
  return S.fac;
}
function facTick(k, n) { const f = facState()[k]; if (!f) return; f.v = clamp(f.v + n, 0, f.max); }
function facDawn(out) {
  const F = facState(), C = claimsState();
  // le Baron
  if (C.own.length && S.night % 3 === 0) facTick('baron', C.own.length);
  if (F.baron.v >= F.baron.max) {
    if (C.own.length) { const k = pick(C.own); C.own = C.own.filter(x => x !== k); out.push(['🎩', `La milice du Baron Pâlichon reprend ${RAIDS[k].name}. Ton drapeau finit dans la rivière.`, 'bad']); }
    else { F.patrol = S.night + 4; out.push(['🎩', 'La milice du Baron patrouille dans le Val : −1 dé à tes raids pendant 4 nuits.', 'bad']); }
    F.baron.v = 0; F.baron.max = Math.min(10, F.baron.max + 1);
  }
  // les villages : la fête ou la battue, selon leur humeur
  const setts = typeof settlements === 'function' ? settlements().filter(siteKnown) : [];
  const avg = setts.length ? setts.reduce((a, s) => a + gwOf(s), 0) / setts.length : 30;
  const anger = setts.length ? setts.reduce((a, s) => a + Math.min(0, gwOf(s) - (GW0[s.kind] || 20)), 0) / setts.length : 0;   // ce que tu leur as fait, pas leur méfiance de départ
  const want = avg >= 50 ? 'fete' : anger <= -10 ? 'battue' : 'calme';
  if (F.val.p !== want) { F.val.p = want; F.val.v = 0; if (want !== 'calme') out.push(['🌾', want === 'fete' ? 'Les villages t’apprécient : ils préparent la fête des moissons (et tu es invité·e).' : 'Les villages en ont assez de toi : ils organisent une battue aux monstres.', want === 'fete' ? 'good' : 'bad']); }
  else if (want !== 'calme') facTick('val', 1);
  if (F.val.v >= F.val.max) {
    if (F.val.p === 'fete') { S.gold += 6; S.mat += 3; S.creatures.forEach(c => { c.mood = clamp(c.mood + 1, 0, 5); }); out.push(['🎉', 'Fête des moissons ! Les villages t’envoient leurs restes : +6 💰, +3 🪵, et toutes tes créatures +1 ❤️.', 'good']); }
    else { S.menace += 2; S.calamity += 1; out.push(['🔦', 'La battue aux monstres rôde autour du château : +2 Menace, +1 Calamité.', 'bad']); }
    F.val.v = 0;
  }
  // le grand œuvre de ton rival
  if (typeof nemActive === 'function' && nemActive()) {
    facTick('nem', 1);
    if (F.nem.v >= F.nem.max) {
      const n = nem(), v = vicState(), done = FAC.nem.projects[F.nem.p];
      n.pres += 6; v.race[n.id] = Math.min(99, (v.race[n.id] || 0) + 5);
      out.push(['🏴', `${nemName()} achève son projet (« ${done.toLowerCase()} ») : +6 de prestige et un bond dans la course à la victoire.`, 'bad']);
      F.nem.p = pick(Object.keys(FAC.nem.projects).filter(k => k !== F.nem.p)); F.nem.v = 0;
    }
  }
}
// les patrouilles du Baron gênent les raids
const raidBreakdownFac = raidBreakdown;
raidBreakdown = function (targetId, teamIds) { const b = raidBreakdownFac(targetId, teamIds); if (S.fac && S.fac.patrol > S.night) { b.pool -= 1; b.rows.push(['Patrouilles du Baron', -1]); } return b; };
// raids : un succès ouvre le droit de revendiquer ; piller fait avancer le Baron, piller le rival fait reculer son œuvre
const applyRaidFac = applyRaid;
applyRaid = function (roll) {
  const key = S.raid && S.raid.target, tg = RAIDS[key], lines = applyRaidFac(roll);
  if (tg && roll.res !== 'fail') {
    if (CLAIMS[key]) { const C = claimsState(); if (!C.won[key]) lines.push(['🏴', `Tu pourras revendiquer ${tg.name} comme territoire (depuis la carte du Val).`, 'ev']); C.won[key] = S.night; }
    if (!tg.rival && !tg.siege) facTick('baron', 1);
    if (tg.rival && S.nem && tg.rival === S.nem.id) { facTick('nem', -2); lines.push(['🏴', `Le projet de ${nemName()} prend du retard (−2 sur son horloge).`, 'good']); }
  }
  return lines;
};
const applyNemRaidFac = applyNemRaid;
applyNemRaid = function (plan, R, lines) {
  applyNemRaidFac(plan, R, lines);
  if (R.outcome !== 'robbed') facTick('nem', -1);
  else { const C = claimsState(); if (C.own.length && Math.random() < .5) { const k = pick(C.own); C.own = C.own.filter(x => x !== k); lines.push(['🏴', `Les sbires de ${nemName()} plantent leur drapeau sur ${RAIDS[k].name} : tu perds ce territoire.`, 'bad']); } }
};
const applyInvasionFac = applyInvasion;
applyInvasion = function (plan, outcome) { const lines = applyInvasionFac(plan, outcome); if (outcome === 'repelled') facTick('baron', -1); return lines; };

/* ---------- héros récurrents : ceux qui s'enfuient reviennent, rancuniers ---------- */
const FOE_TITLES = ['le Revanchard', 'la Rancunière', 'le Tenace', 'l’Increvable', 'la Têtue', 'le Mauvais Perdant'];
function foesState() { return S.foes || (S.foes = []); }
const planInvasionFoe = planInvasion0;
planInvasion0 = function () {
  const p = planInvasionFoe(), foes = foesState().filter(f => !f.gone);
  if (foes.length && p.party.length && Math.random() < .55) {
    const f = pick(foes), j = p.party.length - 1, base = HEROES.find(h => h.k === f.k) || HEROES[0], st = heroStats(base, p.rank || 1, 0);
    const extra = 2 + 2 * f.lvl;
    p.party[j] = { ...base, name: `${f.name} ${f.title}`, foe: f.id, hp: st.hp + extra, atk: st.atk + (f.lvl >= 2 ? 1 : 0), lvl: f.lvl };
    p.courage = p.party.reduce((a, h) => a + h.hp, 0);
  }
  return p;
};
function foesAfter(plan, outcome, lines, room) {
  const R = plan.res; if (!R) return;
  const F = foesState(), caught = new Set(outcome === 'repelled' ? R.fallen.slice(0, room) : []);
  plan.party.forEach((h, j) => {
    const f = h.foe && F.find(x => x.id === h.foe); if (!f) return;
    f.n++; f.last = S.night; const down = R.fallen.includes(j);
    if (outcome === 'robbed') { f.lvl = Math.min(4, f.lvl + 1); lines.push(['😠', `${h.name} se vante dans tout le Val. Il·elle reviendra, plus fort·e.`, 'bad']); }
    else if (down && caught.has(j)) { f.gone = true; S.hype += 2; S.gold += 5 * f.lvl; lines.push(['🏆', `${h.name} finit aux Oubliettes et jure de prendre sa retraite : +2 🔥, +${5 * f.lvl} 💰. On ne le·la reverra plus.`, 'good']); }
    else if (down) { f.lvl = Math.min(4, f.lvl + 1); lines.push(['😤', `${h.name}, K.O., est ramené·e par ses amis. Sans Oubliettes pour le·la garder, il·elle reviendra.`, '']); }
    else lines.push(['😤', `${h.name} s’enfuit encore. On n’a pas fini de le·la voir.`, '']);
  });
  // un nouveau héros garde rancune
  if (outcome !== 'robbed' && F.filter(f => !f.gone).length < 2 && Math.random() < .3) {
    const cand = plan.party.map((h, j) => [h, j]).filter(([h, j]) => !h.foe && !h.minion && !R.fallen.includes(j));
    if (cand.length) {
      const [h] = pick(cand), base = (HEROES.find(x => x.k === h.k) || h).name, title = pick(FOE_TITLES);
      F.push({ id: 'f' + S.seq++, k: h.k, name: base, title, lvl: 1, n: 1, last: S.night });
      lines.push(['😠', `${base} s’enfuit en criant vengeance. On l’appellera désormais « ${base} ${title} ».`, 'bad']);
    }
  }
}
const applyInvasionFoe = applyInvasion;
applyInvasion = function (plan, outcome) { const room = Math.max(0, sumRooms('cells') - S.prisoners), lines = applyInvasionFoe(plan, outcome); foesAfter(plan, outcome, lines, room); return lines; };
// sur la carte du héros, avant l'assaut
const heroCardFoe = heroCard;
heroCard = function (h) { const html = heroCardFoe(h); if (!h.foe) return html; const f = foesState().find(x => x.id === h.foe); return html.replace('<div class="hcard">', `<div class="hcard foe" title="Déjà venu·e ${f ? f.n : 1} fois">`).replace('</b>', `</b><span class="tag2">🔁 ${f ? f.n + 1 : 2}e visite · rancune ${h.lvl || 1}</span>`); };

/* ---------- vivre selon sa nature : un peu d'XP ---------- */
const NATURE = {
  bagarreur: c => c.foughtAt === S.night - 1 && 'a adoré la bagarre',
  studieux:  c => postedType(c, ['bibli', 'labo']) && Math.random() < .12 && 'a dévoré un grimoire',
  bucolique: c => postedType(c, ['potager', 'jardin', 'poulailler', 'simples', 'mare', 'maresacree']) && Math.random() < .12 && 'a fait pousser des merveilles',
  maniaque:  c => S.rooms.some(r => !r.built) && Math.random() < .08 && 'a surveillé le chantier de près',
  radin:     c => S.gold >= 40 && Math.random() < .08 && 'a recompté le trésor (deux fois)',
  artiste:   c => ambiance() >= 20 && Math.random() < .08 && 's’est inspiré·e du décor',
  fetard:    c => c.mood >= 4 && Math.random() < .06 && 'a mené la fête',
  farceur:   c => Math.random() < .05 && 'a réussi une farce mémorable',
  curieux:   c => Math.random() < .05 && 'a découvert un passage secret (qui ne mène nulle part)',
};
function postedType(c, types) { const r = c.post && S.rooms.find(o => o.id === c.post && o.built); return !!r && (types.includes(r.t) || types.includes(ROOMS[r.t].like)); }
function natureDawn(out) {
  const who = [];
  S.creatures.forEach(c => { if (isOut(c)) return; for (const k of c.pers || []) { const f = NATURE[k], why = f && f(c); if (why) { gainXP(c, 1, out); who.push(`${c.name} ${why}`); break; } } });
  if (who.length) out.push(['🌱', `Fidèles à leur nature : ${who.join(' ; ')}. +1 XP${who.length > 1 ? ' chacun' : ''}.`, 'good']);
}
const applyCombatNature = applyCombat;
applyCombat = function (plan, R, lines) { applyCombatNature(plan, R, lines); R.fought.forEach(id => { const c = critter(id); if (c) c.foughtAt = S.night; }); };

/* ---------- l'aube du Val ---------- */
function valDawn(report) {
  if (!S.started) return;
  const out = [];
  claimsDawn(out); facDawn(out); natureDawn(out);
  if (out.length) { report.push(['sec', 'Le Val']); out.forEach(l => report.push(l)); }
}

/* ---------- les horloges et les territoires, en un coup d'œil ---------- */
function clockSVG(v, max, col = '#d9542f') {
  const r = 18, c = 22, seg = [...Array(max)].map((_, i) => { const a0 = i / max * Math.PI * 2 - Math.PI / 2, a1 = (i + 1) / max * Math.PI * 2 - Math.PI / 2, big = a1 - a0 > Math.PI ? 1 : 0; return `<path d="M${c},${c} L${c + r * Math.cos(a0)},${c + r * Math.sin(a0)} A${r},${r} 0 ${big} 1 ${c + r * Math.cos(a1)},${c + r * Math.sin(a1)} Z" fill="${i < v ? col : '#e8d6b0'}" stroke="#2a1c16" stroke-width="1.4"/>`; }).join('');
  return `<svg class="fclock" viewBox="0 0 44 44" width="44" height="44" aria-hidden="true">${seg}</svg>`;
}
function openFactions() {
  const F = facState(), C = claimsState(), row = (k, f, col) => { const D = FAC[k]; return `<div class="facrow">${clockSVG(f.v, f.max, col)}<div><b>${D.ico} ${esc(k === 'nem' && S.nem ? nemRival().name : D.name)}</b><br>${esc(D.projects[f.p] || '')} <span class="num">${f.v}/${f.max}</span><br><span class="hint">${esc(D.why)}</span></div></div>`; };
  const claimable = Object.keys(CLAIMS).filter(k => C.won[k] && !ownClaim(k));
  openModal(`<h2>📜 Les factions du Val</h2><p class="hint">Comme dans Wicked Ones : chaque faction poursuit un projet, sur une horloge qui avance selon tes actes. Quand elle est pleine, il se passe quelque chose.</p>
    <div class="facs">${row('baron', F.baron, '#8a3a6a')}${row('val', F.val, F.val.p === 'battue' ? '#d9542f' : '#6fae4a')}${nemActive() ? row('nem', F.nem, '#4a2a5a') : ''}</div>
    ${F.patrol > S.night ? `<p class="no">🎩 Les patrouilles du Baron gênent tes raids jusqu’à la nuit ${F.patrol} (−1 dé).</p>` : ''}
    <h3>🏴 Tes territoires (${C.own.length}/${claimCap()})</h3>${C.own.length ? `<ul class="chron">${C.own.map(k => `<li class="good"><span class="emo">${RAIDS[k].emo}</span><span><b>${esc(RAIDS[k].name)}</b> : ${esc(CLAIMS[k].txt)}.</span></li>`).join('')}</ul>` : '<p class="hint">Aucun pour l’instant.</p>'}
    <p class="hint">Réussis un raid sur une ferme, un moulin, une auberge ou un monastère, puis revendique-le depuis la carte du Val (${costText(CLAIM_COST)}). Le village voisin t’en voudra (−10 bonne volonté) et le Baron s’agacera.${claimable.length ? ` Tu peux revendiquer : ${claimable.map(k => esc(RAIDS[k].name)).join(', ')}.` : ''}</p>
    <div class="mfoot"><button class="sbtn" type="button" data-close>Fermer</button><button class="sbtn pri" type="button" id="facMap">🗺️ La carte du Val</button></div>`, { wide: true, label: 'Factions' }).querySelector('#facMap').addEventListener('click', () => { closeModal(true); openWorld(); });
}
// la carte : le drapeau sur tes territoires, et le bouton pour revendiquer
const siteIconClaim = siteIcon;
siteIcon = function (g, s, x, y, k) { siteIconClaim(g, s, x, y, k); if (s.kind === 'raid' && ownClaim(s.raid)) { const z = HS * MAP_K * .62 * k; mFlag(g, x + z * .7, y - z * .1, z * .9, '#e9b949'); } };
const renderMapPanelClaim = renderMapPanel;
renderMapPanel = function () {
  renderMapPanelClaim();
  const sel = MAPV.sel, p = $('#wpanel'); if (!p || !sel) return;
  if (sel.kind === 'raid' && CLAIMS[sel.raid]) {
    const k = sel.raid, err = claimOK(k);
    p.insertAdjacentHTML('beforeend', ownClaim(k) ? `<p class="good">🏴 Ton territoire : ${esc(CLAIMS[k].txt)}.</p><div class="btnrow"><button class="sbtn" type="button" data-m="unclaim">Rendre ce territoire</button></div>`
      : `<h4>🏴 Territoire</h4><p class="hint">À toi, il rapporterait ${esc(CLAIMS[k].txt)}. Coût ${costText(CLAIM_COST)} ; le village voisin t’en voudra et le Baron s’agacera.</p><div class="btnrow"><button class="sbtn pri" type="button" data-m="claim" ${err ? `disabled title="${esc(err)}"` : ''}>🏴 Revendiquer</button></div>${err ? `<p class="hint">${esc(err)}.</p>` : ''}`);
  }
  if (sel.kind === 'chateau') p.insertAdjacentHTML('beforeend', '<div class="btnrow"><button class="sbtn" type="button" data-m="factions">📜 Factions et territoires</button></div>');
};
const mapPanelClickClaim = mapPanelClick;
mapPanelClick = function (e) {
  const b = e.target.closest('[data-m]');
  if (b && !b.disabled && (b.dataset.m === 'claim' || b.dataset.m === 'unclaim')) { if (!run(b.dataset.m, { k: MAPV.sel.raid })) return; sfx('chime'); afterChange(); renderMapPanel(); if (typeof mapDirty === 'function') mapDirty(); return; }
  if (b && b.dataset.m === 'factions') { closeWorld(); openFactions(); return; }
  return mapPanelClickClaim(e);
};
function valNotifs(add) {
  const F = S.fac; if (!F) return;
  if (F.baron.v >= F.baron.max - 1) add('facb', '🎩', 'La milice du Baron est presque prête', openFactions, 3, 'bad');
  if (F.val.p === 'battue' && F.val.v >= F.val.max - 1) add('facv', '🔦', 'Une battue aux monstres se prépare', openFactions, 3, 'bad');
  if (F.nem && F.nem.v >= F.nem.max - 1 && S.nem) add('facn', '🏴', `${nemName()} va achever son projet`, openFactions, 3, 'bad');
}

/* ---------- le Grimoire ---------- */
WIKI.factions = { cat: 'val', t: 'Factions et territoires', x: () => `<p><b>Les horloges de faction</b> : le Baron Pâlichon, les villages du Val et ton rival poursuivent chacun un projet. Ouvre-les depuis la fiche de ton rival ou depuis ton château, sur la carte.</p><ul>${Object.values(FAC).map(D => `<li>${D.ico} <b>${esc(D.name)}</b> : ${esc(D.why)}</li>`).join('')}</ul>
  <p><b>Les territoires</b> : après un raid réussi sur une ferme, un moulin, une auberge ou un monastère, tu peux le revendiquer depuis la carte (${costText(CLAIM_COST)}, ${claimCap()} au plus pour l’instant, un de plus par palier). Chaque territoire rapporte un peu chaque nuit : ${Object.entries(CLAIMS).map(([k, c]) => `${esc(RAIDS[k].name)} (${esc(c.txt)})`).join(', ')}. La milice du Baron ou les sbires de ton rival peuvent te le reprendre.</p>
  <p><b>Les héros récurrents</b> : un aventurier qui s’enfuit garde parfois rancune. Il revient plus coriace (25 % de PV en plus), avec un surnom. Mets-le K.O. avec des Oubliettes libres pour qu’il prenne sa retraite (et te rapporte gros).</p>
  <p><b>Leur nature</b> : une créature qui vit selon son caractère (le bagarreur qui se bat, la studieuse postée à la Bibliothèque…) gagne parfois 1 XP à l’aube.</p>` };
TIPS.push({ id: 'claim0', when: () => !!(S.claims && Object.keys(S.claims.won).length && !S.claims.own.length), t: 'Un territoire à prendre', x: 'Ton raid a réussi : tu peux revendiquer ce lieu comme territoire depuis la carte du Val. Il te rapportera chaque nuit… si le Baron te laisse faire.', wiki: 'factions' });
