// Une expédition en cartes jouée à la main, en ligne de commande (chargé par sim/play.mjs dans la VM du jeu).
// Rien n'est gardé en mémoire entre deux commandes : on rejoue la graine et la liste des actions, puis on applique la nouvelle.
// Le château ne change qu'à la fin de l'expédition (butin, fatigue, expérience, vassalité), comme dans le jeu.
function cliCrawlRun(C) {
  Math.random = mulberry32(C.seed); CARD_UID = C.uid0;
  const key = S.raid.target, dg = crawlDgOf(key), team = S.raid.team.map(critter).filter(Boolean);
  const X = { R: crawlNew(dg, team, {}), B: null, phase: 'path', node: null, rewards: null, event: null, msg: [], err: null, team, key, dg, evFrom: 0 };
  C.actions.forEach((a, i) => { const last = i === C.actions.length - 1; if (last && X.B) X.evFrom = X.B.ev.length; const e = cliCrawlAct(X, a); if (last) X.err = e || null; });
  return X;
}
const CLI_NODE = { combat: 'combat', elite: 'élite (plus dur, meilleur butin)', boss: 'LE BOSS', tresor: 'trésor', repos: 'feu de camp (repos)', event: 'rencontre' };
function cliCrawlAct(X, a) {
  const R = X.R, w = a.split(/\s+/).filter(x => x !== 'cible' && x !== 'sur'), n = +w[1] - 1;   // « joue 2 cible 1 » ou « joue 2 1 »
  const endFight = () => {
    const B = X.B, kind = X.node.k;
    if (B.over === 'fled') { R.done = 'fled'; const k = .5; R.loot.g = Math.floor(R.loot.g * k); R.loot.s = Math.floor(R.loot.s * k); if (R.fledBoss) R.loot.items = []; X.phase = 'done'; return; }
    if (B.over !== 'won') { R.done = 'wipe'; X.phase = 'done'; return; }
    R.party.forEach(c => { c.block = 0; c.st = {}; }); X.msg.push(crawlWinLoot(R, kind));
    if (kind === 'boss') { R.done = 'boss'; X.phase = 'done'; return; }
    X.rewards = crawlRewards(R, 3); X.phase = 'reward';
  };
  const after = () => { crawlAdvance(R); X.phase = 'after'; };
  if (X.phase === 'done') return 'L’expédition est finie.';
  if (w[0] === 'rentrer') { if (X.phase !== 'after' && X.phase !== 'path') return 'On ne rentre qu’entre deux salles (en combat : fuir).'; R.done = 'retreat'; X.phase = 'done'; return null; }
  if (X.phase === 'path') {
    if (w[0] !== 'salle') return 'Choisis une salle : salle 1 ou salle 2 (ou rentrer).';
    const node = R.choices[n]; if (!node) return 'Salle inconnue.';
    X.node = node; R.path.push(node.k);
    if (['combat', 'elite', 'boss'].includes(node.k)) { X.B = crawlBattle(R, crawlFoes(R, node.k)); X.B.startTurn(); X.phase = 'battle'; if (X.B.over) endFight(); }
    else if (node.k === 'tresor') { X.msg.push(crawlTreasure(R)); after(); }
    else if (node.k === 'repos') X.phase = 'rest';
    else { X.event = pick(CRAWL_EVENTS); X.phase = 'event'; }
    return null;
  }
  if (X.phase === 'battle') {
    const B = X.B, foes = B.foes(), mates = B.mates();
    const tgt = (c, i) => { const D = cardDef(c); if (i == null || isNaN(i)) return null; return D.tgt === 'enemy' ? foes[i] : D.tgt === 'ally' ? mates[i] : D.tgt === 'ko' ? B.party.filter(p => p.ko)[i] : null; };
    if (w[0] === 'joue') { const c = B.hand[n]; if (!c) return 'Carte inconnue.'; const why = B.why(c); if (why) return why; B.play(c, tgt(c, +w[2] - 1)); }
    else if (w[0] === 'decor') { const e = B.env[n]; if (!e) return 'Pas de décor à ce numéro.'; const why = B.envWhy(n); if (why) return why; const D = cardDef(e.c); B.playEnv(n, D.tgt === 'enemy' ? foes[+w[2] - 1] : D.tgt === 'ally' ? mates[+w[2] - 1] : null); }
    else if (w[0] === 'fin') { B.endTurn(); B.enemyTurn(); if (!B.over) B.startTurn(); }
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
  L.push(`🃏 Expédition : ${tg.name || X.key} (niveau ${String(R.lvl).replace('.', ',')}) · étage ${Math.min(R.floor, CRAWL_FLOORS)}/${CRAWL_FLOORS}${R.floor > CRAWL_FLOORS ? ' · porte du boss' : `, salle ${R.step + 1}/${CRAWL_STEPS}`} · butin ${R.loot.g} 💰 ${R.loot.s} 🪵${R.loot.items.length ? ' + ' + R.loot.items.length + ' sticker(s)' : ''} · deck ${R.deck.length} cartes`);
  L.push('Équipe : ' + R.party.map((p, i) => `${i + 1}) ${p.name} (${SPECIES[p.sp] ? SPECIES[p.sp].name : p.sp}) ${p.ko ? 'K.O.' : `${p.hp}/${p.max} PV`}${p.block ? ` · parade ${p.block}` : ''} · peur ${p.stress}/${STRESS_MAX}${st(p) ? ' · ' + st(p) : ''}`).join(' | '));
  if (X.msg.length) L.push('— ' + X.msg.filter(Boolean).map(s => String(s).replace(/<[^>]+>/g, '')).join(' — '));
  if (B && (X.phase === 'battle' || X.evFrom < B.ev.length)) { const ev = B.ev.slice(X.evFrom).map(e => String(e.t).replace(/<[^>]+>/g, '')).filter(Boolean); if (ev.length) L.push('Ce qui vient de se passer : ' + ev.slice(-14).join(' · ')); }
  if (X.err) L.push('⚠️ ' + X.err);
  if (X.phase === 'path') L.push('Deux portes : ' + R.choices.map((c, i) => `salle ${i + 1} = ${CLI_NODE[c.k] || c.k}`).join(' · ') + ' (ou rentrer avec le butin)');
  if (X.phase === 'battle') {
    L.push(`Combat (${X.node.k}) · tour ${B.turn} · énergie ${B.energy} · pioche ${B.draw.length}, défausse ${B.disc.length}`);
    L.push('Ennemis : ' + B.foes().map((f, i) => { const it = f.st && f.st.stun ? 'sonné, il perd son action' : [f.st && f.st.confuse ? null : f.int, f.lint].filter(Boolean).map(x => intentVM(B, f, x, x === f.lint).title).join(' + '); const E = elemOf(f), el = [E.vuln && E.vuln.length ? 'vulnérable : ' + E.vuln.join(', ') : '', E.res && E.res.length ? 'résiste : ' + E.res.join(', ') : '', E.imm && E.imm.length ? 'immunisé : ' + E.imm.join(', ') : ''].filter(Boolean).join(' ; '); return `${i + 1}) ${f.name}${f.boss ? ' (boss)' : f.elite ? ' (élite)' : ''} ${f.hp}/${f.max} PV${el ? ' [' + el + ']' : ''}${f.block ? ` · parade ${f.block}` : ''}${st(f) ? ' · ' + st(f) : ''} · intention : ${it || '?'}`; }).join(' | '));
    L.push('Main : ' + B.hand.map((c, i) => { const me = B.owner(c), D = cardDef(c), why = B.why(c); return `${i + 1}) [${B.costOf(c)}] ${cardName(c)}${me ? ' (' + me.name + ')' : ''} → ${D.tgt || '—'} : ${String(cardText(c, me, B)).replace(/<[^>]+>/g, '').replace(/\{[^}|]*\|([^}]*)\}/g, '$1')}${why ? ' ⛔ ' + why : ''}`; }).join(' | '));
    if (B.env && B.env.length) L.push('Décor (gratuit, une fois) : ' + B.env.map((e, i) => `${i + 1}) ${cardName(e.c)}${e.used ? ' (utilisé)' : ''}`).join(' | '));
    L.push('Actions : joue <n° carte> [n° cible] · decor <n> [n° cible] · fin (fin du tour) · fuir');
  }
  if (X.phase === 'reward') L.push('Victoire ! Une carte à ajouter au deck : ' + X.rewards.map((c, i) => `${i + 1}) ${cardName(c)} : ${String(cardText(c, null, null)).replace(/<[^>]+>/g, '').replace(/\{[^}|]*\|([^}]*)\}/g, '$1')}`).join(' | ') + ' · prendre <n> ou passer');
  if (X.phase === 'rest') L.push('Feu de camp : repos soin (+30 % PV) · repos calme (−4 peur) · repos aiguiser (améliore la meilleure carte)');
  if (X.phase === 'event') L.push(`Rencontre : ${X.event.t} · ` + X.event.a.map((o, i) => `choix ${i + 1} = ${o[0]}${o[2] ? ' (' + o[2] + ')' : ''}`).join(' · '));
  if (X.phase === 'after') L.push(`Salle passée. ${R.floor > CRAWL_FLOORS ? 'La porte du boss est devant vous.' : ''} continuer ou rentrer (avec le butin) ?`);
  return L.join('\n');
}
// la fin : le château reçoit le résultat, et la nuit ne rejouera pas l'expédition
function cliCrawlFinish(X) {
  if (!X.R.path.length) { cancelRaid(); return '🏁 Expédition annulée avant la première salle : personne n’est parti, le lieu reste ouvert.'; }
  const lines = []; crawlApply(X.R, X.team, lines); crawlVictory(X.dg, X.R, lines); crawlSiteResult(X.key, X.R, X.team, lines);
  S.raid.played = true;
  const head = X.R.done === 'boss' ? 'le boss est vaincu !' : X.R.done === 'wipe' ? 'l’équipe est terrassée.' : X.R.done === 'fled' ? 'fuite (la moitié du butin reste là-bas).' : 'retour avec le butin.';
  return [`🏁 Expédition terminée : ${head} Butin rapporté : ${X.R.done === 'wipe' ? 0 : X.R.loot.g} 💰, ${X.R.done === 'wipe' ? 0 : X.R.loot.s} 🪵.`, ...lines.map(l => `${l[0]} ${String(l[1]).replace(/<[^>]+>/g, '')}`)].join('\n');
}
// le deck de l'expédition (pour choisir quoi aiguiser)
function cliCrawlDeck(X) { return 'Deck : ' + X.R.deck.map((c, i) => `${i + 1}) ${cardName(c)}${c.owner ? ' (' + ((X.R.party.find(p => p.id === c.owner) || {}).name || '?') + ')' : ''}`).join(' | '); }
