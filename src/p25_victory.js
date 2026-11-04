
/* =========================================================
   Victoires, comme dans Civilization : cinq chemins pour devenir
   le Grand Maître du Val. Les donjons rivaux (et le Baron) font
   la course ; si l'un d'eux gagne avant toi, une nouvelle ère
   commence, et tu gardes tout ce que tu as bâti.
   ========================================================= */
const VICTORIES = [
  { id: 'legende', ico: '✨', name: 'Victoire de Légende', short: 'Ton château devient un mythe.', rival: 'ombrelune' },
  { id: 'terreur', ico: '⚔️', name: 'Victoire de Terreur', short: 'Le Val tremble, mais personne ne meurt.', rival: 'septbieres' },
  { id: 'voisinage', ico: '🗳️', name: 'Victoire de Bon Voisinage', short: 'Le Conseil du Val te nomme Protecteur.', rival: 'baron' },
  { id: 'menagerie', ico: '🐾', name: 'Victoire de la Grande Ménagerie', short: 'Le bestiaire le plus complet du Val.', rival: 'moussues' },
  { id: 'secrets', ico: '🗝️', name: 'Victoire des Secrets', short: 'Tu perces le mystère du Val.', rival: 'morgrave' },
];
const VIC_BY = Object.fromEntries(VICTORIES.map(v => [v.id, v]));
const MENAGERIE_SP = SPECIES_ORDER.slice();
// la Ménagerie compte les créatures installées (5 nuits au château) : 85 % d'entre elles épanouies suffisent, un nouveau venu ne casse pas la série
const MEN_HAPPY = .85, menSettled = () => S.creatures.filter(c => !isOut(c) && S.night - (c.joined || 1) >= 5);
const BARON = { id: 'baron', name: 'Le Baron Pâlichon', emo: '🎩' };
const racer = id => id === 'baron' ? BARON : RIVALS.find(r => r.id === id);
const raceGoal = id => (VICTORIES.find(v => v.rival === id) || {}).id;
function vicState() {
  if (!S.vic) S.vic = { won: {}, era: 1, master: null, race: { ombrelune: 0, septbieres: 0, moussues: 0, morgrave: 0, baron: 0 }, vassals: {}, siege: 0, votes: 0, gw: {}, requests: [], happy: 0, croisade: null, proj: null, seen: {}, councils: 0 };
  return S.vic;
}
const isVassal = id => !!(S.vic && S.vic.vassals[id] >= 3);
const allVassals = () => RIVALS.every(r => isVassal(r.id));

/* ---------- bonne volonté des villages, villes et cité ---------- */
const GW0 = { village: 30, ville: 20, cite: 10 };
const VOICES = { village: 1, ville: 2, cite: 3 };
const gwOf = s => { const v = vicState(); return v.gw[s.id] != null ? v.gw[s.id] : GW0[s.kind] || 20; };
function addGw(s, n) { const v = vicState(); v.gw[s.id] = clamp(Math.round(gwOf(s) + n), 0, 100); }
const settlements = () => world().sites.filter(s => SITE_KINDS[s.kind].rank);
// le lieu habité le plus proche d'une cible de raid : c'est lui qui t'en veut
function nearestSettlement(site) { return settlements().slice().sort((a, b) => hdist(a.q, a.r, site.q, site.r) - hdist(b.q, b.r, site.q, site.r))[0]; }

/* ---------- requêtes des villages ---------- */
const REQ = {
  percepteur: { text: 'Le percepteur du bailli nous saigne. Envoie une créature lui faire une belle frayeur.', kind: 'send', nights: 1, tag: 'ruse', gw: 20, rw: { g: 3 } },
  vache: { text: 'La vache de la mère Pichenette s’est sauvée dans les bois. Tu nous la ramènes ?', kind: 'send', nights: 1, gw: 18, rw: { s: 2 } },
  fete: { text: 'C’est la fête et il nous manque un musicien. Un Ménestrel ou une Harpie ferait l’affaire.', kind: 'send', nights: 1, need: ['menestrel', 'harpie'], gw: 25, rw: { h: 2 } },
  moutons: { text: 'Des loups rôdent autour des moutons. Prête-nous un bon gardien (garde 2 ou plus) pendant deux nuits.', kind: 'send', nights: 2, guard: 2, gw: 25, rw: { g: 2 } },
  fantome: { text: 'Un fantôme hante le moulin et fait pleurer les enfants. Un des tiens pourrait lui parler ?', kind: 'send', nights: 1, need: ['fantome', 'vampire', 'liche', 'sorciere', 'squelette'], gw: 22, rw: { h: 1 } },
  pont: { text: 'Le pont s’est effondré. Quatre matériaux, et on le rebâtit en ton honneur.', kind: 'pay', cost: { s: 4 }, gw: 15 },
  grain: { text: 'Le grenier est vide avant l’hiver. Cinq pièces d’or nous sauveraient.', kind: 'pay', cost: { g: 5 }, gw: 15 },
  heros: { text: 'Des apprentis héros parlent de « libérer » ton château. Donne-leur une bonne leçon : repousse une invasion.', kind: 'repel', gw: 20 },
};
const openReqs = () => vicState().requests.filter(q => q.st !== 'done');
const reqAt = siteId => openReqs().find(q => q.site === siteId);
function reqCandidates(q) { const R = REQ[q.req]; return S.creatures.filter(c => !isOut(c) && (!R.need || R.need.includes(c.sp)) && (!R.guard || guardOf(c) >= R.guard)); }
function newRequest(out) {
  const v = vicState(); if (openReqs().length >= 2) return;
  const free = settlements().filter(s => siteKnown(s) && gwOf(s) < 100 && !reqAt(s.id)); if (!free.length) return;
  const s = pick(free), keys = Object.keys(REQ).filter(k => !REQ[k].need || S.creatures.some(c => REQ[k].need.includes(c.sp))), k = pick(keys);
  v.requests.push({ id: 'q' + S.seq++, req: k, site: s.id, n: S.night, until: S.night + (REQ[k].kind === 'repel' ? 10 : 6), st: 'open' });
  if (v.requests.length > 12) v.requests = v.requests.slice(-12);
  out.push(['📜', `${s.name} t’adresse une requête : « ${REQ[k].text} » (voir la carte)`, 'ev']);
}
function reqReward(q, s, out, k = 1) {
  const R = REQ[q.req], rw = R.rw || {}; addGw(s, Math.round(R.gw * k)); q.st = 'done';
  if (rw.g) S.gold += rw.g; if (rw.s) S.mat += rw.s; if (rw.h) S.hype += rw.h;
  const t = `Requête accomplie pour ${s.name} : bonne volonté +${Math.round(R.gw * k)}${rw.g ? `, +${rw.g} 💰` : ''}${rw.s ? `, +${rw.s} 🪵` : ''}${rw.h ? `, +${rw.h} 🔥` : ''}.`;
  addLog(t, 'good'); if (out) out.push(['🤝', t, 'good']); return t;
}
CMD.request = a => {
  const q = openReqs().find(x => x.id === a.id); if (!q) return 'Cette requête n’est plus d’actualité';
  const R = REQ[q.req], s = siteById(q.site); if (!s) return 'Lieu inconnu';
  if (R.kind === 'pay') { if (!canAfford(R.cost)) return `Il te faut ${costText(R.cost)}`; pay(R.cost); reqReward(q, s); return null; }
  if (R.kind !== 'send' || q.st !== 'open') return 'Rien à envoyer';
  const c = critter((a.team || [])[0]); if (!c || isOut(c)) return 'Choisis qui part';
  if (!reqCandidates(q).includes(c)) return R.need ? `Il faut : ${R.need.map(k => SPECIES[k] ? SPECIES[k].name : k).join(' ou ')}` : 'Il faut un gardien plus solide';
  if (S.raid) S.raid.team = S.raid.team.filter(id => id !== c.id);
  c.raid = true; c.away = R.nights; c.awayUntil = S.night + R.nights; c.post = null; c.expe = { gid: 'x' + S.seq++, site: null, req: q.id, n: S.night }; critterLeave(c.id);
  q.st = 'sent'; addLog(`${c.name} part aider ${s.name}.`, 'ev'); return null;
};
// retour d'une créature partie aider un village (appelé par worldDawn)
function reqDawn(team, e, out) {
  const q = vicState().requests.find(x => x.id === e.req), c = team[0]; if (!q) return;
  const s = siteById(q.site), R = REQ[q.req], pool = Math.max(1, diceOf(c) + ((SPECIES[c.sp] || {}).tag === R.tag ? 1 : 0) + (R.guard && guardOf(c) >= R.guard ? 1 : 0) + (R.need ? 1 : 0)), roll = rollPool(pool);
  if (roll.res !== 'fail') { const t = reqReward(q, s, null, roll.res === 'partial' ? .7 : 1); gainXP(c, 1, out); addLoy(c, 3); out.push(['🤝', `${c.name} revient de ${s.name} (dés : ${roll.dice.join(', ')}). ${t}`, 'good']); }
  else { addGw(s, 5); q.st = 'done'; c.mood = clamp(c.mood - 1, 0, 5); out.push(['💨', `${c.name} n’a pas réussi à aider ${s.name} (dés : ${roll.dice.join(', ')}). Ils apprécient quand même l’effort : bonne volonté +5.`, 'bad']); }
}

/* ---------- les étapes de chaque victoire ---------- */
const st = (text, done, finale) => ({ text, done: !!done, finale: !!finale });
function mapPct() { const w = world(); return Math.round(visibleSet().size / w.list.length * 100); }
const artFound = () => Object.keys((S.world && S.world.found) || {}).length;
const artPlaced = () => new Set(S.furn.filter(f => ARTEFACTS.includes(f.t)).map(f => f.t)).size;
const legendsHome = () => S.creatures.filter(c => c.legend).length;
const albumN = () => MENAGERIE_SP.filter(k => S.album[k]).length;
function vicStages(id) {
  const v = vicState();
  if (id === 'legende') { const g = radiance(); return [st(`Rayonnement Illustre (${Math.min(g, 80)}/80 ✨)`, g >= 80 || v.croisade), st(`Rayonnement Légendaire (${Math.min(g, 130)}/130 ✨)`, g >= 130 || v.croisade), st(`Rayonnement Mythique (${Math.min(g, 200)}/200 ✨)`, g >= 200 || v.croisade),
    st(`Finale : repousser la Croisade des héros de Mirebrume (${v.croisade ? Math.min(3, v.croisade.done) : 0}/3)`, v.croisade && v.croisade.done >= 3, true)]; }
  if (id === 'terreur') return [...RIVALS.map(r => st(`Soumettre ${r.name} (${Math.min(3, v.vassals[r.id] || 0)}/3 points : boss 2, 3e étage sans fuir 1)`, isVassal(r.id))), st(`Finale : le Siège de Mirebrume (${Math.min(3, v.siege)}/3 assauts réussis)`, v.siege >= 3, true)];
  if (id === 'voisinage') return [5, 10, 15].map(n => st(`${n} voix au Conseil du Val (${Math.min(v.votes, n)}/${n})`, v.votes >= n)).concat([st(`Finale : 20 voix, et le Conseil te nomme Protecteur du Val (${Math.min(v.votes, 20)}/20)`, v.votes >= 20, true)]);
  if (id === 'menagerie') { const p = v.proj && v.proj.id === 'parade' ? v.proj : null; return [st(`Album complet (${albumN()}/${MENAGERIE_SP.length} espèces, rares comprises)`, albumN() >= MENAGERIE_SP.length || p), st(`5 légendes au château (${Math.min(5, legendsHome())}/5)`, legendsHome() >= 5 || p),
    st(`${Math.round(MEN_HAPPY * 100)} % de tes créatures installées épanouies (70 ou plus) trois nuits de suite, à 8 au moins (${Math.min(3, v.happy)}/3)`, v.happy >= 3 || p), st(`Finale : la Grande Parade, 4 nuits sans départ ni bouderie (${v.won.menagerie ? 4 : p ? p.prog : 0}/4)`, !!v.won.menagerie, true)]; }
  if (id === 'secrets') { const p = v.proj && v.proj.id === 'rituel' ? v.proj : null, m = mapPct(); return [st(`Dévoiler la carte (${Math.min(m, 90)}/90 %)`, m >= 90 || p), st(`Trouver les 12 artefacts (${Math.min(12, artFound())}/12)`, artFound() >= 12 || p),
    st(`Les exposer tous, avec un Reliquaire (${artPlaced()}/12${builtCount('reliquaire') ? '' : ', pas de Reliquaire'})`, (artPlaced() >= 12 && builtCount('reliquaire') > 0) || p), st(`Finale : le Rituel des Douze, 3 nuits sans perdre un artefact (${v.won.secrets ? 3 : p ? p.prog : 0}/3)`, !!v.won.secrets, true)]; }
  return [];
}
function vicPct(id) {
  const v = vicState(); if (v.won[id]) return 100;
  if (id === 'legende') return Math.round(Math.min(1, radiance() / 200) * 75 + (v.croisade ? Math.min(3, v.croisade.done) / 3 * 25 : 0));
  if (id === 'terreur') return Math.round(RIVALS.reduce((a, r) => a + Math.min(3, v.vassals[r.id] || 0), 0) / 12 * 75 + Math.min(3, v.siege) / 3 * 25);
  if (id === 'voisinage') return Math.round(Math.min(20, v.votes) / 20 * 100);
  const s = vicStages(id), p = v.proj && v.proj.id === (id === 'menagerie' ? 'parade' : 'rituel') ? v.proj : null;
  return Math.round(s.slice(0, 3).filter(x => x.done).length / 3 * 75 + (p ? p.prog / p.need * 25 : 0));
}
// une grande finale qu'on lance soi-même : la Parade (ménagerie) ou le Rituel (secrets)
const PROJ = { parade: { vic: 'menagerie', name: 'la Grande Parade', need: 4, cost: { g: 20, s: 10 } }, rituel: { vic: 'secrets', name: 'le Rituel des Douze', need: 3, cost: { g: 15, s: 5 } } };
const projReady = k => !vicState().proj && !vicState().won[PROJ[k].vic] && vicStages(PROJ[k].vic).slice(0, 3).every(x => x.done);
CMD.project = a => {
  const P = PROJ[a.id]; if (!P) return 'Projet inconnu'; if (vicState().proj) return 'Un grand projet est déjà en cours';
  if (!projReady(a.id)) return 'Toutes les étapes ne sont pas encore franchies'; if (!canAfford(P.cost)) return `Il te faut ${costText(P.cost)}`;
  pay(P.cost); vicState().proj = { id: a.id, prog: 0, need: P.need, ids: S.creatures.map(c => c.id), n: S.night };
  addLog(`Début de ${P.name} !`, 'ev'); return null;
};

/* ---------- gagner, perdre une ère ---------- */
function winVictory(id, out) {
  const v = vicState(); if (v.won[id]) return;
  v.won[id] = S.night; v.justWon = id; S.stats.victories = (S.stats.victories || 0) + 1;
  const t = `${VIC_BY[id].name} ! ${S.name} entre au Panthéon du Val.`; addLog(t, 'ev'); if (out) out.push(['🏛️', t, 'good']);
  if (typeof pantheonPublish === 'function') pantheonPublish(id);
}
function newEra(champ, out) {
  const v = vicState(), r = racer(champ), goal = VIC_BY[raceGoal(champ)];
  v.era++; v.master = champ; v.eraNews = champ;
  Object.keys(v.race).forEach(k => { if (!isVassal(k)) v.race[k] = Math.round(Math.random() * 8); });
  const t = `Nouveau Grand Maître du Val : ${r.name}, par la ${goal.name.replace('Victoire', 'victoire')}. Une nouvelle ère commence (ère ${v.era}) ; tes progrès, eux, restent intacts.`;
  addLog(t, 'bad'); out.push(['👑', t, 'bad']);
}
function raceTick(out) {
  const v = vicState();
  RIVALS.forEach(r => {
    if (isVassal(r.id)) return;
    const before = v.race[r.id] || 0, slow = S.world && S.world.hit && S.world.hit[r.id] > S.night ? .4 : 1;
    v.race[r.id] = Math.min(100, before + (.8 + Math.random() * .6) * slow);
    [50, 75, 90].forEach(m => { if (before < m && v.race[r.id] >= m) out.push(['⚠️', `Course à la victoire : ${r.name} en est à ${m} % de la ${VIC_BY[raceGoal(r.id)].name.replace('Victoire', 'victoire')}.`, 'bad']); });
  });
  const champ = Object.keys(v.race).find(k => v.race[k] >= 100); if (champ) newEra(champ, out);
}
function council(out) {
  const v = vicState(), setts = settlements(); let mine = 0; const yes = [];
  setts.forEach(s => { if (gwOf(s) >= 60) { mine += VOICES[s.kind]; yes.push(s.name); } });
  const total = setts.reduce((a, s) => a + VOICES[s.kind], 0), before = v.votes; v.votes += mine; v.councils++;
  v.race.baron = Math.min(100, (v.race.baron || 0) + (total - mine) / 20 * 100 * .35);
  out.push(['🗳️', `Conseil du Val : ${mine} voix pour toi${yes.length ? ` (${yes.join(', ')})` : ''}, ${total - mine} pour le Baron Pâlichon. Tes voix : ${Math.min(v.votes, 20)}/20.`, mine ? 'good' : '']);
  if (before < 20 && v.votes >= 20) winVictory('voisinage', out);
}

/* ---------- chaque aube ---------- */
function victoryDawn(report) {
  if (!S.started) return;
  const v = vicState(), out = [];
  // vassaux : tribut
  const vas = RIVALS.filter(r => isVassal(r.id)); if (vas.length) { S.gold += vas.length; S.mat += vas.length; out.push(['🪙', `Tes vassaux versent leur tribut : +${vas.length} 💰, +${vas.length} 🪵.`, 'good']); }
  // la bonne volonté retombe doucement ; les requêtes vieillissent ; parfois une nouvelle
  Object.keys(v.gw).forEach(k => { if (v.gw[k] > 40) v.gw[k]--; });
  v.requests.forEach(q => { if (q.st === 'open' && S.night > q.until) { q.st = 'done'; const s = siteById(q.site); if (s) { addGw(s, -5); out.push(['⌛', `${s.name} a attendu en vain : bonne volonté −5.`, 'bad']); } } });
  if (S.night >= 4 && Math.random() < .35) newRequest(out);
  if (S.night % 10 === 0) council(out);
  // ménagerie : tout le monde épanoui ?
  { const st = menSettled(); v.happy = st.length >= 8 && st.filter(c => (c.epa == null ? 50 : c.epa) >= 70).length >= Math.ceil(st.length * MEN_HAPPY) ? v.happy + 1 : 0; }
  // légende : à Mythique, la cité lève une croisade
  if (!v.croisade && !v.won.legende && radiance() >= 200) { v.croisade = { done: 0, n: S.night }; out.push(['📯', 'Mythique ! La cité de Mirebrume lève une croisade de héros légendaires contre ton château. Repousse-la trois fois pour entrer dans la légende.', 'ev']); }
  if (v.croisade && v.croisade.done < 3 && !v.won.legende) S.menace += 1;
  // grands projets
  const p = v.proj;
  if (p) {
    const P = PROJ[p.id]; let fail = '';
    if (p.id === 'parade') { const gone = p.ids.filter(id => !critter(id)); if (gone.length) fail = 'une créature a quitté le château'; else if (S.creatures.some(c => c.mood <= 1)) fail = 'une créature boude'; }
    else if (artPlaced() < 12) fail = 'un artefact a disparu des expositions';
    if (fail) { v.proj = null; out.push(['💔', `${P.name[0].toUpperCase() + P.name.slice(1)} est interrompu${p.id === 'parade' ? 'e' : ''} : ${fail}. Tu pourras recommencer.`, 'bad']); }
    else { p.prog++; out.push(['🎉', `${P.name[0].toUpperCase() + P.name.slice(1)} : nuit ${p.prog}/${p.need}.`, 'good']); if (p.prog >= p.need) { v.proj = null; winVictory(P.vic, out); } }
  }
  raceTick(out);
  // étapes franchies
  VICTORIES.forEach(V0 => !v.won[V0.id] && vicStages(V0.id).forEach((s, i) => { const k = V0.id + i; if (s.done && !v.seen[k] && !s.finale) { v.seen[k] = S.night; out.push([V0.ico, `${V0.name} : étape franchie, « ${s.text.replace(/ \(.*\)$/, '')} ».`, 'ev']); } }));
  if (out.length) { report.push(['sec', 'Victoires']); out.forEach(l => report.push(l)); }
}

/* ---------- branchements : raids, invasions, origine des héros ---------- */
function victoryAfterRaid(target, roll, lines) {
  const v = vicState(), tg = RAIDS[target], ok = roll.res !== 'fail';
  if (tg.rival && ok && !isVassal(tg.rival)) {
    v.vassals[tg.rival] = (v.vassals[tg.rival] || 0) + 1; v.race[tg.rival] = Math.max(0, (v.race[tg.rival] || 0) - 6);
    const r = racer(tg.rival);
    if (isVassal(tg.rival)) { lines.push(['🏳️', `Reddition ! ${r.name} : te voilà suzerain. Un tribut chaque nuit, et plus personne là-bas pour te disputer tes créatures.`, 'good']); addLog(`Vassal : ${r.name}.`, 'ev'); }
    else lines.push(['🏴', `Coup dur pour ${r.name} : ${v.vassals[tg.rival]}/3 vers la vassalité, et un recul dans la course.`, 'good']);
  }
  if (tg.siege && roll.res === 'partial') lines.push(['🏰', 'Mirebrume tient bon : il faut un vrai succès (un 6) pour faire céder la cité.', '']);
  if (tg.siege && ok && roll.res !== 'partial') { v.siege++; lines.push(['🏰', `Assaut réussi contre Mirebrume (${Math.min(3, v.siege)}/3) !`, 'good']); if (v.siege >= 3) winVictory('terreur', lines); }
  if (!tg.rival && !tg.siege) { const site = world().sites.find(x => x.raid === target), s = site && nearestSettlement(site); if (s) { addGw(s, ok ? -12 : -6); lines.push(['😠', `${s.name} n’apprécie pas : bonne volonté ${ok ? '−12' : '−6'}.`, 'bad']); } }
}
function victoryAfterInvasion(plan, outcome, lines) {
  const v = vicState();
  if (outcome === 'robbed') return;
  openReqs().filter(q => REQ[q.req].kind === 'repel').forEach(q => { const s = siteById(q.site); if (s) lines.push(['🤝', reqReward(q, s), 'good']); });
  if (plan.origin && plan.origin.crusade && v.croisade && !v.won.legende) { v.croisade.done++; lines.push(['📯', `La croisade de Mirebrume est repoussée (${Math.min(3, v.croisade.done)}/3) !`, 'good']); if (v.croisade.done >= 3) winVictory('legende', lines); }
}
RAIDS.mirebrume = { name: 'Siège de Mirebrume', emo: '🏰', tier: 2, risk: 4, tag: 'combat', reward: { g: 15, s: 5 }, hype: 5, menace: 3, siege: true, desc: 'La grande cité. Trois assauts réussis et elle te remet ses clés. Il faut d’abord que les quatre donjons rivaux soient tes vassaux.' };

/* ---------- pastilles (notifications) ---------- */
function victoryNotifs(add) {
  if (!S.started) return; const v = vicState();
  openReqs().forEach(q => { const s = siteById(q.site); if (s && q.st === 'open') add('rq' + q.id, '📜', `${s.name} a une requête`, () => openWorld(s.id), 2); });
  Object.keys(PROJ).forEach(k => { if (projReady(k)) add('pj' + k, '🏛️', `${PROJ[k].name[0].toUpperCase() + PROJ[k].name.slice(1)} peut commencer`, openVictories, 4); });
  if (v.proj) add('pjrun', '🎉', `${PROJ[v.proj.id].name[0].toUpperCase() + PROJ[v.proj.id].name.slice(1)} : nuit ${v.proj.prog}/${v.proj.need}`, openVictories, 3);
  if (v.croisade && v.croisade.done < 3 && !v.won.legende) add('crois', '📯', `Croisade de Mirebrume : ${v.croisade.done}/3 repoussées`, openVictories, 4, 'bad');
  if (S.night % 10 >= 8) add('cons', '🗳️', `Conseil du Val dans ${10 - S.night % 10} nuit${10 - S.night % 10 > 1 ? 's' : ''}`, () => openVictories('voisinage'), 1);
  const hot = Object.keys(v.race).filter(k => !isVassal(k) && v.race[k] >= 75).sort((a, b) => v.race[b] - v.race[a])[0];
  if (hot) add('race', '⚠️', `Course : ${racer(hot).name} à ${Math.floor(v.race[hot])} % de la victoire`, openVictories, 5, 'bad');
}

/* ---------- l'écran des victoires (le « classement » de Civilization) ---------- */
function openVictories(focus) {
  const v = vicState(), m = v.master ? racer(v.master) : null, laurels = Object.keys(v.won);
  const card = V0 => {
    const pct = vicPct(V0.id), stages = vicStages(V0.id), r = racer(V0.rival), rp = Math.floor(v.race[V0.rival] || 0), won = v.won[V0.id];
    const pk = V0.id === 'menagerie' ? 'parade' : V0.id === 'secrets' ? 'rituel' : null;
    return `<section class="vic ${won ? 'won' : ''} ${focus === V0.id ? 'focus' : ''}"><div class="vh"><span class="emo">${V0.ico}</span><span><b>${esc(V0.name)}</b><small>${esc(V0.short)}</small></span><span class="vp num">${pct} %</span></div>
      ${bar(pct, won ? '#7fbf5a' : '#e9b949', 'Progression')}
      <ul class="vst">${stages.map(s => { const ok = s.done || won; return `<li class="${ok ? 'ok' : ''} ${s.finale ? 'fin' : ''}">${ok ? '✅' : s.finale ? '🏁' : '⬜'} ${esc(s.text)}</li>`; }).join('')}</ul>
      ${won ? `<p class="vwon">🏛️ Remportée à la nuit ${won}.</p>` : pk && projReady(pk) ? `<div class="btnrow"><button class="sbtn pri" type="button" data-proj="${pk}">🎉 Lancer ${esc(PROJ[pk].name)} · ${costText(PROJ[pk].cost)}</button></div>` : ''}
      <p class="vrival">${isVassal(V0.rival) ? `${r.emo} Vassal : ${esc(r.name)}, hors course.` : `${r.emo} Rival : ${esc(r.name)} ${bar(rp, '#d9542f', 'Rival')} <b class="num">${rp} %</b>`}</p>
      <button class="link2" type="button" data-wiki-open="v_${V0.id}">📖 Comment l’emporter</button></section>`;
  };
  const md = openModal(`<h2>🏛️ Les victoires du Val</h2>
    <p class="hint">Ère ${v.era} · ${m ? `Grand Maître actuel : ${m.emo} ${esc(m.name)}` : 'Le Val attend encore son Grand Maître'} · ${laurels.length ? `Tes lauriers : ${laurels.map(k => VIC_BY[k].ico).join(' ')}` : 'Pas encore de laurier'}</p>
    <p>Cinq chemins mènent au titre de Grand Maître. Les donjons rivaux et le Baron font la course : si l’un d’eux gagne avant toi, une nouvelle ère commence, mais tu gardes tout ce que tu as bâti. Pille-les pour les ralentir.</p>
    <div class="vicgrid">${VICTORIES.map(card).join('')}</div>`, { wide: true, cls: 'vicm', label: 'Victoires' });
  md.addEventListener('click', e => { const b = e.target.closest('[data-proj]'); if (!b) return; if (!run('project', { id: b.dataset.proj })) return; sfx('chime'); banner('🎉 Le grand projet commence !', esc(PROJ[b.dataset.proj].name), 1800); afterChange(); openVictories(); });
  if (focus) setTimeout(() => { const f = md.querySelector('.vic.focus'); if (f) f.scrollIntoView({ block: 'center' }); }, 50);
}
function openVictoryFinale(id) {
  const V0 = VIC_BY[id], text = { legende: 'Les bardes de tout le Val chantent ton nom. Même les héros de Mirebrume racontent, à voix basse, la nuit où ils ont fui ton château.',
    terreur: 'Les quatre donjons rivaux te versent tribut, et Mirebrume t’a remis ses clés. Personne n’est mort : c’est ça, la vraie terreur douillette.',
    voisinage: 'Le Conseil du Val t’a nommé Protecteur. Les villageois t’apportent des tartes. Tu ne sais pas trop quoi en faire, mais c’est gentil.',
    menagerie: 'La Grande Parade a traversé le Val sous les vivats : gobelins, liches, fées et golems, tous fiers et épanouis. Aucun bestiaire n’égale le tien.',
    secrets: 'Les douze artefacts ont chanté ensemble. Le Val n’a plus de secret pour toi… ou presque.' }[id];
  openModal(`<div class="vfinale"><h2>🏛️ ${esc(V0.name)} !</h2><p class="big">${esc(text)}</p>
    <p>${esc(S.name)} devient le château du Grand Maître du Val, à la nuit ${S.night}, ère ${vicState().era}. ${netUsable() ? 'Ton nom est gravé au Panthéon du Val.' : ''}</p>
    <ul class="chron"><li><span class="emo">✨</span><span>Rayonnement ${radiance()}</span></li><li><span class="emo">🐾</span><span>${S.creatures.length} créatures, ${legendsHome()} légendes, album ${albumN()}/${MENAGERIE_SP.length}</span></li><li><span class="emo">🏆</span><span>${Object.keys(S.ach || {}).length} hauts faits · ${artPlaced()} artefacts exposés</span></li></ul>
    <p class="hint">Les autres victoires restent à prendre, pour la gloire.</p>
    <div class="mfoot"><button class="sbtn" type="button" id="vfAll">🏛️ Voir les victoires</button><button class="sbtn pri" type="button" data-close>🌙 Encore une nuit</button></div></div>`, { wide: true, label: V0.name });
  $('#vfAll').addEventListener('click', () => openVictories(id));
}
// à la fin de la nuit : une victoire, ou un nouveau Grand Maître ?
function victoryAfterNight() {
  const v = S.vic; if (!v) return;
  if (v.justWon) { const id = v.justWon; v.justWon = null; save(); sfx('chime'); openVictoryFinale(id); return; }
  if (v.eraNews) { const r = racer(v.eraNews); v.eraNews = null; save(); banner(`👑 ${esc(r.name)}`, `devient Grand Maître du Val. Une nouvelle ère commence !`, 2600); }
}

/* ---------- la carte et la ville : bonne volonté, requêtes, vassaux, siège ---------- */
function settleHTML(s) {
  const gw = gwOf(s), q = reqAt(s.id), R = q && REQ[q.req];
  let h = `<h4>Bonne volonté ${bar(gw, gw >= 70 ? '#7fbf5a' : gw >= 60 ? '#e9b949' : '#c9a07a', 'Bonne volonté')} <span class="num">${gw}</span></h4>
    <p class="hint">À 60, ${esc(s.name)} vote pour toi au Conseil du Val (${VOICES[s.kind]} voix${VOICES[s.kind] > 1 ? '' : ''}). À 70, ses aventuriers te laissent tranquille. Piller les environs la fait baisser ; requêtes, dons et achats la font monter.</p>`;
  if (!q) return h + '<p class="hint">Pas de requête en ce moment.</p>';
  const rw = R.rw || {}, gains = [`bonne volonté +${R.gw}`, rw.g && `+${rw.g} 💰`, rw.s && `+${rw.s} 🪵`, rw.h && `+${rw.h} 🔥`].filter(Boolean).join(', ');
  h += `<h4>📜 Requête</h4><p>« ${esc(R.text)} »</p><p class="hint">Jusqu’à la nuit ${q.until} · ${gains}</p>`;
  if (R.kind === 'pay') h += `<div class="btnrow"><button class="sbtn pri" type="button" data-rq="${q.id}" ${canAfford(R.cost) ? '' : 'disabled'}>🤝 Payer ${costText(R.cost)}</button></div>`;
  else if (R.kind === 'send' && q.st === 'open') { const cands = reqCandidates(q); h += cands.length ? `<p class="hint">Qui y va ? (${R.nights} nuit${R.nights > 1 ? 's' : ''})</p>${teamPicker(1, cands)}<div class="btnrow"><button class="sbtn pri" type="button" data-rq="${q.id}">🤝 Envoyer</button></div>` : `<p class="no">Personne ne convient : ${R.need ? 'il faut ' + R.need.filter(k => SPECIES[k]).map(k => SPECIES[k].name).join(' ou ') : 'il faut une garde de 2 ou plus'}.</p>`; }
  else if (q.st === 'sent') h += '<p class="hint">Une de tes créatures est en route.</p>';
  else if (R.kind === 'repel') h += '<p class="hint">Elle sera accomplie à la prochaine invasion repoussée.</p>';
  return h;
}
function rivalHTML(rv) {
  if (isVassal(rv.id)) return '<p><b>🏳️ Ton vassal.</b> Tribut de 2 💰 et 1 🪵 chaque nuit ; hors de la course à la victoire ; ne te dispute plus tes créatures.</p>';
  const v = vicState(), goal = VIC_BY[raceGoal(rv.id)];
  return `<p class="hint">Dans la course à la ${goal.name.replace('Victoire', 'victoire')} : ${Math.floor(v.race[rv.id] || 0)} %. Raids réussis contre ce donjon : ${v.vassals[rv.id] || 0}/3 pour en faire ton vassal (chaque raid le fait aussi reculer).</p>`;
}
function citeHTML() {
  const v = vicState();
  if (allVassals()) return `<p><b>⚔️ Le Siège de Mirebrume est possible</b> (${Math.min(3, v.siege)}/3 assauts réussis).</p><div class="btnrow"><button class="sbtn" type="button" data-m="siege" ${S.tier >= 2 ? '' : 'disabled'}>🏰 Préparer un assaut${S.tier >= 2 ? '' : ' (Palier 2)'}</button></div>`;
  return '<p class="hint">Quand les quatre donjons rivaux seront tes vassaux, tu pourras assiéger la cité (victoire de Terreur).</p>';
}

/* ---------- Grimoire et conseil ---------- */
Object.assign(WIKI, {
  victoires: { cat: 'vic', t: 'Les victoires du Val', x: () => `<p>Comme dans Civilization, plusieurs chemins mènent au titre de <b>Grand Maître du Val</b>. Ouvre l’écran des victoires en touchant la nuit en cours (🏛️, en haut à droite).</p>
    <ul>${VICTORIES.map(v => `<li>{c:v_${v.id}|${v.name}} : ${esc(v.short)}</li>`).join('')}</ul>
    <p>Chaque victoire a des étapes, puis une finale qui dure plusieurs nuits. Tu peux toutes les remporter, une à une, pour la gloire. Voir aussi {c:eres}.</p>` },
  eres: { cat: 'vic', t: 'La course des rivaux et les ères', x: () => `<p>Tu n’es pas seul à viser le titre. Chaque donjon rival poursuit une victoire : ${RIVALS.map(r => `${r.name} (${VIC_BY[raceGoal(r.id)].name.replace('Victoire ', '')})`).join(', ')}. Le Baron Pâlichon, lui, brigue les voix du Conseil du Val.</p>
    <ul><li>Leur avancée se voit sur l’écran des victoires ; une pastille ⚠️ t’avertit quand l’un d’eux approche du but.</li><li>Un raid réussi contre un rival le fait reculer et le ralentit quelques nuits. Un rival devenu ton vassal ne court plus.</li>
    <li>Si un rival gagne avant toi, il devient Grand Maître et <b>une nouvelle ère commence</b> : les rivaux repartent de zéro, et tu gardes tout ce que tu as bâti. Pas de partie perdue, juste un rival qui fanfaronne.</li></ul>` },
  v_legende: { cat: 'vic', t: 'Victoire de Légende', x: () => `<p>Fais rayonner ton château jusqu’à <b>Mythique</b> (200 ✨) : artefacts, trésors, créatures rares, légendes, étages… Voir {c:rayonnement}.</p><p><b>Finale :</b> à Mythique, la cité de Mirebrume lève une croisade de héros légendaires. La Menace monte chaque nuit : repousse trois invasions de croisés et ton château entre dans la légende.</p>` },
  v_terreur: { cat: 'vic', t: 'Victoire de Terreur', x: () => `<p>Une domination douce : personne ne meurt. Mène des <b>expéditions</b> dans chacun des quatre donjons rivaux (sur la carte, dès le Palier 1) : vaincre le boss rapporte 2 points ; atteindre le troisième étage puis rentrer sans fuir un combat, 1 point ; à 3 points, le rival devient ton <b>vassal</b>, te verse 2 💰 et 1 🪵 par nuit, cesse de te disputer tes créatures et quitte la course.</p><p><b>Finale :</b> le Siège de Mirebrume, une cible de raid très gardée (Palier 2). Trois assauts réussis (un 6 au meilleur dé : un succès partiel ne suffit pas) et la cité te remet ses clés.</p><p class="hint">Les donjons rivaux grandissent avec toi (+0,5 niveau par palier) ; chaque défaite rend un rival plus coriace (+0,25 niveau par point pris), et tous se méfient d’un suzerain (+0,25 par vassal). Attention : piller fait monter la Menace, et piller les fermes, moulins et auberges fâche les villages ({c:v_voisinage}).</p>` },
  v_voisinage: { cat: 'vic', t: 'Victoire de Bon Voisinage', x: () => `<p>Chaque village, la ville et la cité ont une <b>bonne volonté</b> envers toi (visible sur la carte et en ville). Elle monte avec leurs <b>requêtes</b> (envoyer une créature, payer un service, repousser une invasion), les dons pour la fête et tes achats ; elle baisse quand tu pilles leurs environs, et retombe doucement avec le temps.</p>
    <ul><li>À 60, le lieu vote pour toi au <b>Conseil du Val</b>, qui se réunit toutes les 10 nuits : 1 voix par village, 2 pour la ville, 3 pour la cité.</li><li>À 70, ses aventuriers ne viennent plus t’attaquer.</li></ul><p><b>Victoire :</b> 20 voix cumulées. Les voix que tu n’as pas vont au Baron Pâlichon, qui brigue le même titre.</p>` },
  v_menagerie: { cat: 'vic', t: 'Victoire de la Grande Ménagerie', x: () => `<p>Réunis le bestiaire le plus complet du Val : l’<b>album entier</b> (${MENAGERIE_SP.length} espèces, y compris les {c:rares|créatures rares}, donc des étages vers le haut ET vers le bas), <b>5 légendes</b> au château, et 85 % de tes créatures installées (5 nuits au château) <b>épanouies</b> (70 ou plus) trois nuits de suite, à 8 au moins : un nouveau venu ne casse pas la série.</p><p><b>Finale :</b> la Grande Parade (${costText(PROJ.parade.cost)}), quatre nuits pendant lesquelles aucune créature ne doit partir ni bouder.</p>` },
  v_secrets: { cat: 'vic', t: 'Victoire des Secrets', x: () => `<p>Perce le mystère du Val : dévoile <b>90 % de la carte</b>, trouve les <b>12 artefacts</b>, puis expose-les tous, avec au moins un {room:reliquaire}.</p><p><b>Finale :</b> le Rituel des Douze (${costText(PROJ.rituel.cost)}), trois nuits pendant lesquelles aucun artefact ne doit disparaître. Garde-les aux étages : les héros qui pillent le Cœur en volent.</p>` },
});
TIPS.push({ id: 'vic0', when: () => S.night >= 6 && !(S.tuto && S.tuto.on), t: 'Cinq chemins vers la victoire', x: 'Comme dans Civilization, tu peux devenir le Grand Maître du Val de cinq façons : Légende, Terreur, Bon Voisinage, Grande Ménagerie ou Secrets. Les donjons rivaux font la course. Touche la nuit en cours (🏛️, en haut à droite) pour voir où tu en es.', wiki: 'victoires' });
