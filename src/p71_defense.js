/* =========================================================
   L'ancienne défense, rebranchée sur les invasions aux cartes
   Chaque bonus garde sa promesse, traduite dans le nouveau
   système : harcèlement dès l'arrivée, mercenaire au Cœur, repas,
   sentinelles (le guet) et humeur pour les défenseurs (le poste
   de travail n'y compte plus), et ce que préparait le Cœur (pont-levis, espion,
   fête, gâteau, Remparts, cloche) en énergie au premier tour du
   combat du Cœur. (Le Corps de garde et les Postes de garde
   donnent des places de défenseurs : voir invSeats, p69.)
   ========================================================= */
// les pièges forgés et mécaniques donnent eux aussi leur carte
if (typeof CASTLE_CARDS !== 'undefined') [['porte', 'herse'], ['trappe', 'meule'], ['trappe', 'machoire'], ['trappe', 'automate'], ['leurre', 'ressort']].forEach(([k, t]) => { const C = CASTLE_CARDS[k]; if (C && !C.from.includes(t)) C.from.push(t); });
const INV_BOOST = { harassK: 2.5, mealHp: 5, guetHp: 3, guetBlk: 4, foeHp: 1.25, nemHp: 1.35, tokMax: 3, secret: .15 };
// la pièce secrète (voir invNew, plus bas) : la bande s'y perd et tourne en rond, chaque héros y laisse secret × ses PV, sans tomber
// (avant, elle sautait une pièce ; sans fuite, chaque pièce défendue use la bande : une pièce de moins l'aurait aidée)
// à l'arrivée : la Tour de guet, le Belvédère, la catapulte… font pleuvoir les cailloux ; les héros rancuniers et le némésis sont plus coriaces
const invNewDef = invNew;
invNew = function (plan) {
  const I = invNewDef(plan);
  plan.party.forEach((h, i) => { const f = I.foes[i]; if (!f) return; const k = h.nem ? INV_BOOST.nemHp : h.foe ? INV_BOOST.foeHp : 1; if (k > 1) { f.hp = f.max = Math.round(f.hp * k); } if (h.nem) I.nemDis = true; });
  if (typeof chantierDone === 'function' && chantierDone('secrete')) { let n = 0; invUp(I).forEach(f => { const d = Math.min(f.hp - 1, Math.round(f.max * INV_BOOST.secret)); f.hp -= d; n += d; }); if (n) I.lines.push(['🗝️', `La bibliothèque pivote : la bande se perd dans la pièce secrète et tourne en rond (−${n} PV en tout).`, 'good']); }
  const hz = typeof sumRooms === 'function' ? sumRooms('harass') : 0;
  if (hz > 0) {
    let left = Math.round(hz * INV_BOOST.harassK), n = 0;
    while (left > 0 && invUp(I).length) { const f = pick(invUp(I)), d = Math.min(left, 5); f.hp = Math.max(1, f.hp - d); left -= d; n += d; }   // les cailloux blessent, sans mettre K.O.
    if (n) I.lines.push(['🏹', `Tes guetteurs les accueillent à coups de cailloux : −${n} PV pour la bande, avant même la première pièce.`, 'good']);
  }
  return I;
};
// au Cœur, le mercenaire se joint aux défenseuses (qui défend où : invLineup, p69)
const invInfoDef = invInfo;
invInfo = function (I, id) {
  const info = invInfoDef(I, id); if (!info.r) return info;
  if (info.heart && S.world && S.world.merc > S.night && SPECIES.orque) info.def = [...info.def, { id: 'merc', name: 'Le mercenaire', sp: 'orque', lvl: 3, loy: 50, mood: 3, pers: [], merc: true }];
  return info;
};
// les défenseurs : repas de la nuit, sentinelles (métier du guet : toute créature qui défend et en a le grade), humeur (plus de bonus « chez soi » : le poste ne compte pas)
const invFightRDef = invFightR;
invFightR = function (I, info) {
  const R = invFightRDef(I, info);
  R.heart = !!info.heart;
  R.party.forEach(p => {
    const c = critter(p.id); if (!c) return;
    const up = (dh, da) => { p.hp += dh; p.max += dh; p.atk = Math.max(1, p.atk + da); };
    if (S.meal && S.meal.hp) up(INV_BOOST.mealHp, 0);
    if (S.meal && S.meal.atk) up(0, S.meal.atk);
    const l = typeof craftAff === 'function' && craftAff(c, 'guet') ? craftLvl(craftOf(c, 'guet')) : 0;
    if (l) { up(INV_BOOST.guetHp * l, l >= 3 ? 1 : 0); if (l >= 2) p.blk0 = (p.blk0 || 0) + INV_BOOST.guetBlk; }
    if ((c.mood || 0) >= 4) up(0, 1); else if ((c.mood || 0) <= 1) up(0, -1);
  });
  return R;
};
// ce que le Cœur a préparé (pont-levis, espion, fête…) : chaque bonus au-delà de la base donne +1 énergie au premier tour du combat du Cœur
function invBonusTokens() {
  const base = Math.min(4, 2 + Math.floor((S.tier || 0) / 2)), bell = (S.defs || []).some(d => DEFS[d.t] && DEFS[d.t].alarm) ? 1 : 0;
  return Math.max(0, Math.min(INV_BOOST.tokMax, (typeof heartTokens === 'function' ? heartTokens() : base) - base + bell));
}
const invHookDef = invHook;
invHook = function (I, B, heart) {
  invHookDef(I, B, heart);
  const tok = heart ? invBonusTokens() : 0, st = B.startTurn;
  B.startTurn = () => { st(); if (B.turn !== 1) return; if (tok) { B.nrg[0] += tok; B.log(`+${tok} énergie : le Cœur s’est préparé (pont-levis, alarme, provisions…).`, 'good', { k: 'buff' }); } B.party.forEach(p => { if (p.blk0 && !p.ko) p.block += p.blk0; }); };
};
// le mercenaire n'est pas une créature du château : ni expérience, ni repos, ni intrigue
const invFinishDef = invFinish;
invFinish = function (I) { const R = invFinishDef(I); R.fought = R.fought.filter(id => critter(id)); R.hurt = R.hurt.filter(id => critter(id)); Object.keys(R.kos).forEach(id => { if (!critter(id)) delete R.kos[id]; }); return R; };

/* ---------- les choix d'autrefois, rebranchés ---------- */
// les savoirs du Labo : une carte de plus dans chaque combat d'invasion
Object.assign(CASTLE_CARDS, {
  brume: { name: 'Brume soporifique', ico: '🌫️', cost: 1, tgt: 'enemy', stun: 1, exhaust: true, from: [] },
  elixir: { name: 'Élixir de bravoure', ico: '🧪', cost: 1, tgt: 'allies', heal: 5, buff: 1, exhaust: true, from: [] },
});
// le némésis recruté défend le Cœur à tes côtés (sous ses traits de héros)
const invInfoAlly = invInfo;
invInfo = function (I, id) {
  const info = invInfoAlly(I, id), N = S.foeHero;
  if (info.heart && N && N.st === 'ally' && !info.def.some(c => c.id === 'nemally')) info.def = [...info.def, { id: 'nemally', name: N.name, sp: 'orque', lvl: Math.max(2, N.lvl || 1), loy: 80, mood: 4, pers: [], merc: true, heroK: CRAWL_EN['h_' + N.k] ? 'h_' + N.k : 'h_paladin' }];
  return info;
};
const invFightRBoost = invFightR;
invFightR = function (I, info) {
  const R = invFightRBoost(I, info), rank = typeof craftRank === 'function' ? craftRank('labo') : 0;
  if (rank >= 2) R.deck.push(newCard('castle', 'brume'));
  if (rank >= 3) R.deck.push(newCard('castle', 'elixir'));
  R.party.forEach(p => {
    const fake = info.def.find(c => c.id === p.id && c.heroK); if (fake) { p.k = fake.heroK; p.hp += 3 * fake.lvl; p.max += 3 * fake.lvl; }
    const c = critter(p.id); if (!c) return; const sc = c.scars || [];
    if (sc.includes('rancunier')) p.atk += 1;   // il·elle n'a rien oublié
    if (sc.includes('froussard')) p.atk = Math.max(1, p.atk - 1);
    if (sc.includes('insomniaque')) p.blk0 = (p.blk0 || 0) + 4;   // toujours aux aguets
  });
  return R;
};
// les aperçus (Guilde, carte, Atelier) : les PV de la bande à l'échelle des combats aux cartes
const partyPreviewV1 = partyPreview;
partyPreview = function () {
  const pp = partyPreviewV1(); try { const lvl = invLevel({ rank: pp.rank || 1 }); pp.courage = Math.round((pp.size || 1) * 14 * (1 + CRAWL_TUNE.hpL * (lvl - 1)) * (((INV_TUNE.rankHp || [])[Math.min(3, Math.max(1, pp.rank || 1)) - 1]) || 1) * (S.world && S.world.decoy ? .75 : 1)); pp.lvl = lvl; } catch (e) {}
  return pp;
};
// les escarmouches du Val : la défense publiée vient du vrai château (pièges, garde des pièces, guetteurs, créatures prêtes à défendre :
// +1 par créature apte et reposée, +1 de plus pour chacune de celles qui tiendraient le Cœur)
defenseScore = function () {
  try {
    const traps = (S.defs || []).filter(d => DEFS[d.t] && !DEFS[d.t].post && !DEFS[d.t].block).reduce((a, d) => a + defStr(d), 0);
    const rested = S.creatures.filter(c => fitToFight(c) && !invTired(c)).length;
    return Math.round(traps + sumRooms('guard') + sumRooms('harass') + rested + Math.min(rested, invHeartN()));
  } catch (e) { return 0; }
};
