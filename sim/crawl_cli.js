// Une expédition en cartes jouée à la main, en ligne de commande (chargé par sim/play.mjs dans la VM du jeu).
// Rien n'est gardé en mémoire entre deux commandes : on rejoue la graine et la liste des actions, puis on applique la nouvelle.
// Le château ne change qu'à la fin de l'expédition (butin, fatigue, expérience, vassalité), comme dans le jeu.
// C.v = 2 : les cartes gardent leur numéro pendant tout un tour, et les cibles leur numéro pendant tout le combat (une expédition commencée avant garde l'ancienne numérotation)
function cliCrawlRun(C) {
  Math.random = mulberry32(C.seed); CARD_UID = C.uid0;
  const key = S.raid.target, dg = crawlDgOf(key), team = S.raid.team.map(critter).filter(Boolean);
  const X = { R: crawlNew(dg, team, C.bag ? { bag: C.bag } : {}), B: null, phase: 'path', node: null, rewards: null, event: null, msg: [], info: [], err: null, team, key, dg, evFrom: 0, v2: (C.v || 1) >= 2, num: { key: '', map: {}, next: 1 }, bN: 0, bag: C.bag || null };
  C.actions.forEach((a, i) => { const last = i === C.actions.length - 1; if (last && X.B) X.evFrom = X.B.ev.length; X.last = last; if (last) X.info = []; cliNumSync(X); const e = cliCrawlAct(X, a); if (last) X.err = e || null; });
  cliNumSync(X);
  return X;
}
// la main numérotée : un numéro par carte, gardé jusqu'à la fin du tour (les cartes piochées en cours de tour prennent les suivants)
function cliNumSync(X) {
  if (!X.v2 || !X.B || X.phase !== 'battle') return;
  const k = X.bN + ':' + X.B.turn; if (X.num.key !== k) X.num = { key: k, map: {}, next: 1 };
  X.B.hand.forEach(c => { if (X.num.map[c.uid] == null) X.num.map[c.uid] = X.num.next++; });
}
const cliHand = X => X.v2 ? X.B.hand.map(c => [X.num.map[c.uid], c]).sort((a, b) => a[0] - b[0]) : X.B.hand.map((c, i) => [i + 1, c]);
const CLI_NODE = { combat: 'combat', elite: 'élite (plus dur, meilleur butin)', boss: 'LE BOSS', tresor: 'trésor', repos: 'feu de camp (repos)', event: 'rencontre' };
function cliCrawlAct(X, a) {
  const R = X.R, w = a.split(/\s+/).filter(x => x !== 'cible' && x !== 'sur'), n = +w[1] - 1;   // « joue 2 cible 1 » ou « joue 2 1 »
  const endFight = () => {
    const B = X.B, kind = X.node.k;
    if (B.over === 'fled') { R.done = 'fled'; const k = .5; R.loot.g = Math.floor(R.loot.g * k); R.loot.s = Math.floor(R.loot.s * k); if (R.fledBoss) R.loot.items = []; X.phase = 'done'; return; }
    if (B.over !== 'won') { R.done = 'wipe'; X.phase = 'done'; return; }
    R.party.forEach(c => { c.block = 0; c.st = {}; }); R.handFight = true; R.flawless = B.flawless(); X.msg.push(crawlWinLoot(R, kind));   // en ligne de commande, chaque combat est mené à la main
    if (kind === 'boss') { R.done = 'boss'; X.phase = 'done'; return; }
    X.rewards = crawlRewards(R, R.flawless ? 4 : 3, R.flawless); X.phase = 'reward';
  };
  const after = () => { crawlAdvance(R); X.phase = 'after'; };
  if (X.phase === 'done') return 'L’expédition est finie.';
  if (w[0] === 'rentrer') { if (X.phase !== 'after' && X.phase !== 'path') return 'On ne rentre qu’entre deux salles (en combat : fuir).'; R.done = 'retreat'; X.phase = 'done'; return null; }
  if (X.phase === 'path') {
    if (w[0] !== 'salle') return 'Choisis une salle : salle 1 ou salle 2 (ou rentrer).';
    const node = R.choices[n]; if (!node) return 'Salle inconnue.';
    X.node = node; R.path.push(node.k);
    if (['combat', 'elite', 'boss'].includes(node.k)) { X.B = crawlBattle(R, crawlFoes(R, node.k)); X.bN++; X.B.startTurn(); X.phase = 'battle'; if (X.B.over) endFight(); }
    else if (node.k === 'tresor') { X.msg.push(crawlTreasure(R)); after(); }
    else if (node.k === 'repos') X.phase = 'rest';
    else { X.event = pick(CRAWL_EVENTS); X.phase = 'event'; }
    return null;
  }
  if (X.phase === 'battle') {
    const B = X.B, foes = B.foes(), mates = B.mates();
    // v2 : les ennemis gardent leur numéro (ceux à terre aussi), les alliées celui de la ligne « Équipe »
    const pickFoe = i => { if (!X.v2) return { t: foes[i] }; const f = B.foesL[i]; return !f ? { e: 'Cible inconnue.' } : f.hp <= 0 ? { e: `${f.name} est déjà à terre : choisis une autre cible.` } : { t: f }; };
    const pickAlly = (i, ko) => { if (!X.v2) return { t: ko ? B.party.filter(p => p.ko)[i] : mates[i] }; const p = B.party[i]; return !p ? { e: 'Cible inconnue.' } : ko ? (p.ko ? { t: p } : { e: `${p.name} n’est pas K.O.` }) : p.ko ? { e: `${p.name} est K.O. : choisis une autre alliée.` } : { t: p }; };
    const tgt = (D, i) => { if (i == null || isNaN(i)) return { t: null }; return D.tgt === 'enemy' ? pickFoe(i) : D.tgt === 'ally' ? pickAlly(i) : D.tgt === 'ko' ? pickAlly(i, true) : { t: null }; };
    if (w[0] === 'joue') { const c = X.v2 ? (cliHand(X).find(([k]) => k === n + 1) || [])[1] : B.hand[n]; if (!c) return X.v2 ? `Pas de carte n° ${n + 1} dans ta main (déjà jouée ?) : vois la main ci-dessous.` : 'Carte inconnue.'; const why = B.why(c); if (why) return why; const T = tgt(cardDef(c), +w[2] - 1); if (T.e) return T.e; B.play(c, T.t); }
    else if (w[0] === 'decor') { const e = B.env[n]; if (!e) return 'Pas de décor à ce numéro.'; const why = B.envWhy(n); if (why) return why; const T = tgt(cardDef(e.c), +w[2] - 1); if (T.e) return T.e; B.playEnv(n, T.t); }
    else if (w[0] === 'fin') { const left = B.energy, playable = B.hand.filter(c => !B.why(c)).length; if (X.last && left > 0) X.info.push(`Tour fini avec ${left} énergie non dépensée${playable ? ` (${playable} carte${playable > 1 ? 's' : ''} encore jouable${playable > 1 ? 's' : ''})` : ''}.`); B.endTurn(); B.enemyTurn(); if (!B.over) B.startTurn(); }
    else if (w[0] === 'fuir') B.flee();
    else return 'En combat : joue <n> [cible], decor <n> [cible], fin, fuir.';
    if (B.over) endFight();
    return null;
  }
  if (X.phase === 'reward') { if (w[0] === 'prendre' && X.rewards[n]) R.deck.push(X.rewards[n]); else if (w[0] !== 'passer') return 'prendre <n> ou passer.'; after(); return null; }
  if (X.phase === 'rest') { const ww = w[0] === 'repos' ? w.slice(1) : w, how = { soin: 'heal', calme: 'calm', aiguiser: 'up' }[ww[0]]; if (!how) return 'repos soin | repos calme | repos aiguiser [n° de carte du deck]'; const card = how === 'up' && ww[1] ? R.deck[+ww[1] - 1] : null; if (how === 'up' && ww[1] && (!card || card.up)) return 'Carte à aiguiser introuvable ou déjà améliorée (vois « deck »).'; X.msg.push(crawlRest(R, how, card || undefined)); after(); return null; }
  if (X.phase === 'event') { const o = X.event.a[n]; if (!o) return 'choix 1 ou choix 2.'; X.msg.push(o[1](R) || ''); after(); return null; }
  if (X.phase === 'after') { if (w[0] !== 'continuer') return 'continuer ou rentrer.'; X.phase = 'path'; return null; }
  return 'Action inconnue.';
}
function cliCrawlText(X) {
  const R = X.R, B = X.B, L = [], st = o => Object.entries(o.st || {}).filter(([, v]) => v).map(([k, v]) => k + (v === true ? '' : ' ' + v)).join(', ');
  const tg = RAIDS[X.key] || {};
  const bossTxt = crawlPeekText(R, 'boss');
  L.push(`🃏 Expédition : ${tg.name || X.key} (niveau ${String(R.lvl).replace('.', ',')})${bossTxt ? ` · au bout : ${bossTxt}` : ''} · étage ${Math.min(R.floor, CRAWL_FLOORS)}/${CRAWL_FLOORS}${R.floor > CRAWL_FLOORS ? ' · porte du boss' : `, salle ${R.step + 1}/${CRAWL_STEPS}`} · butin ${R.loot.g} 💰 ${R.loot.s} 🪵${R.loot.a ? ' ' + R.loot.a + ' 🟠' : ''}${R.loot.items.length ? ' + ' + R.loot.items.length + ' sticker(s)' : ''} · deck ${R.deck.length} cartes`);
  L.push('Équipe : ' + R.party.map((p, i) => `${i + 1}) ${p.name} (${SPECIES[p.sp] ? SPECIES[p.sp].name : p.sp}) ${p.ko ? 'K.O.' : `${p.hp}/${p.max} PV`}${p.block ? ` · parade ${p.block}` : ''} · peur ${p.stress}/${STRESS_MAX}${st(p) ? ' · ' + st(p) : ''}`).join(' | '));
  if (X.msg.length) L.push('— ' + X.msg.filter(Boolean).map(s => String(s).replace(/<[^>]+>/g, '')).join(' — '));
  if (X.info && X.info.length) L.push('ℹ️ ' + X.info.join(' '));
  if (B && (X.phase === 'battle' || X.evFrom < B.ev.length)) { const ev = B.ev.slice(X.evFrom).map(e => String(e.t).replace(/<[^>]+>/g, '')).filter(Boolean); if (ev.length) L.push('Ce qui vient de se passer : ' + ev.slice(-14).join(' · ')); }
  if (X.err) L.push('⚠️ ' + X.err);
  if (X.phase === 'path') L.push('Deux portes : ' + R.choices.map((c, i) => `salle ${i + 1} = ${CLI_NODE[c.k] || c.k}${c.k === 'elite' || c.k === 'boss' ? ` [${crawlPeekText(R, c.k)}]` : ''}`).join(' · ') + ' (ou rentrer avec le butin)');
  if (X.phase === 'battle') {
    const cut = B.nrgCut && B.nrgCut.turn === B.turn ? ` (−${B.nrgCut.n} ce tour-ci : ${B.nrgCut.why || 'un effet ennemi'})` : '';
    L.push(`Combat (${X.node.k}) · tour ${B.turn} · énergie ${B.energy}/${ENERGY} restante${cut} · pioche ${B.draw.length}, défausse ${B.disc.length}`);
    L.push('Ennemis : ' + (X.v2 ? B.foesL.map((f, i) => [f, i]).filter(([f]) => f.hp > 0) : B.foes().map((f, i) => [f, i])).map(([f, i]) => { const it = f.st && f.st.stun ? 'sonné, il perd son action (un nouvel étourdissement se changerait en parade pour l’équipe)' : [f.st && f.st.confuse ? null : f.int, f.lint].filter(Boolean).map(x => intentVM(B, f, x, x === f.lint).title).join(' + '); const E = elemOf(f), el = [E.vuln && E.vuln.length ? 'vulnérable : ' + E.vuln.join(', ') : '', E.res && E.res.length ? 'résiste : ' + E.res.join(', ') : '', E.imm && E.imm.length ? 'immunisé : ' + E.imm.join(', ') : ''].filter(Boolean).join(' ; '); return `${i + 1}) ${f.name}${f.boss ? ' (boss)' : f.elite ? ' (élite)' : ''} ${f.hp}/${f.max} PV${el ? ' [' + el + ']' : ''}${f.block ? ` · parade ${f.block}` : ''}${st(f) ? ' · ' + st(f) : ''} · intention : ${it || '?'}`; }).join(' | '));
    L.push('Main : ' + cliHand(X).map(([i, c]) => { const me = B.owner(c), D = cardDef(c), why = B.why(c); return `${i}) [${B.costOf(c)}] ${cardName(c)}${me ? ' (' + me.name + ')' : ''} → ${D.tgt || '—'} : ${String(cardText(c, me, B)).replace(/<[^>]+>/g, '').replace(/\{[^}|]*\|([^}]*)\}/g, '$1')}${why ? ' ⛔ ' + why : ''}`; }).join(' | '));
    if (B.env && B.env.length) L.push('Décor (gratuit, une fois) : ' + B.env.map((e, i) => `${i + 1}) ${cardName(e.c)}${e.used ? ' (utilisé)' : ''}`).join(' | '));
    L.push('Actions : joue <n° carte> [n° cible] · decor <n> [n° cible] · fin (fin du tour) · fuir' + (X.v2 ? ' — les cartes gardent leur numéro jusqu’à la fin du tour ; ennemis et alliées gardent le leur pendant tout le combat' : ''));
  }
  if (X.phase === 'reward') L.push((R.flawless ? 'Victoire sans faute ! Une carte de plus au choix, la première déjà améliorée : ' : 'Victoire ! Une carte à ajouter au deck : ') + X.rewards.map((c, i) => `${i + 1}) ${cardName(c)} : ${String(cardText(c, null, null)).replace(/<[^>]+>/g, '').replace(/\{[^}|]*\|([^}]*)\}/g, '$1')}`).join(' | ') + ' · prendre <n> ou passer');
  if (X.phase === 'rest') L.push('Feu de camp : repos soin (+30 % PV) · repos calme (−4 peur) · repos aiguiser (améliore la meilleure carte)');
  if (X.phase === 'event') L.push(`Rencontre : ${X.event.t} · ` + X.event.a.map((o, i) => `choix ${i + 1} = ${o[0]}${o[2] ? ' (' + o[2] + ')' : ''}`).join(' · '));
  if (X.phase === 'after') L.push(`Salle passée. ${R.floor > CRAWL_FLOORS ? 'La porte du boss est devant vous.' : ''} continuer ou rentrer (avec le butin) ?`);
  return L.join('\n');
}
// la fin : le château reçoit le résultat, et la nuit ne rejouera pas l'expédition
function cliCrawlFinish(X) {
  if (!X.R.path.length) { cancelRaid(); return '🏁 Expédition annulée avant la première salle : personne n’est parti, le lieu reste ouvert.'; }
  const lines = [], got = crawlApply(X.R, X.team, lines); crawlVictory(X.dg, X.R, lines); crawlSiteResult(X.key, X.R, X.team, lines);
  S.raid.played = true;
  const head = X.R.done === 'boss' ? 'le boss est vaincu !' : X.R.done === 'wipe' ? 'l’équipe est terrassée.' : X.R.done === 'fled' ? (X.R.fledBoss ? 'fuite devant le boss (la moitié du butin et tous les stickers restent là-bas).' : 'fuite (la moitié du butin reste là-bas).') : 'retour avec le butin.';
  return [`🏁 Expédition terminée : ${head} Butin rapporté : ${got.g || 0} 💰, ${got.s || 0} 🪵, ${got.a || 0} 🟠 d’Ambre (tu en as ${S.amber || 0}).`, ...lines.map(l => `${l[0]} ${String(l[1]).replace(/<[^>]+>/g, '')}`)].join('\n');
}
// le deck de l'expédition (pour choisir quoi aiguiser)
function cliCrawlDeck(X) { return 'Deck : ' + X.R.deck.map((c, i) => `${i + 1}) ${cardName(c)}${c.owner ? ' (' + ((X.R.party.find(p => p.id === c.owner) || {}).name || '?') + ')' : ''}`).join(' | '); }
// en ligne de commande, le sort du héros némésis attend la commande « nemesis » (sans écran, les IA décident tout de suite)
if (typeof dawnChoice === 'function' && typeof nemMercy === 'function') { const dawnChoiceCli = dawnChoice; dawnChoice = function (open, auto) { if (open === nemMercy) return; return dawnChoiceCli(open, auto); }; }
