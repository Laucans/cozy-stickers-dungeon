
/* =========================================================
   Intrigues : de longues histoires, rares, avec une créature.
   Quatre chapitres, parfois un choix, et au bout quelque chose
   d'unique : une créature qui évolue, un trésor, une salle ou
   un piège que personne d'autre n'a. Trois au plus par partie,
   jamais deux à la fois, et il faut du temps pour en voir une.
   ========================================================= */
const SAGA_FROM = 8, SAGA_GAP = 12, SAGA_MAX = 3, SAGA_CHANCE = .18;
const SAGAS = {
  egouts: { sp: ['gobelin'], ico: '👑', name: 'Le Trône des Égouts', reward: { evo: 'roi' },
    hook: c => `${c.name} a trouvé un trône rouillé au fond des égouts. Il·elle s’y est assis·e… et depuis, se prend pour un roi.`,
    ch: [
      { t: 'Un trône à redresser', x: () => 'Le trône est tout tordu. Il faut une Forge pour le remettre d’aplomb.', need: { room: 'forge' } },
      { t: 'Faire ses preuves', x: c => `Un roi doit savoir piller : réussis un raid avec ${c.name} dans l’équipe.`, need: { raid: 1 } },
      { t: 'Des sujets', x: () => 'Pas de roi sans sujets : il faut 3 gobelins au château.', need: { sp: ['gobelin', 3] } },
      { t: 'Le couronnement', x: () => 'Tout est prêt. Grand banquet, ou couronnement à la Taverne ?', choice: [
        { t: 'Grand banquet', cost: { g: 15 }, fx: 'feast', then: 'toutes les créatures +1 ❤️' },
        { t: 'Couronnement à la Taverne', need: { room: 'taverne' }, fx: 'hype', n: 3, then: '+3 🔥' }] },
    ] },
  grandpiege: { sp: ['kobold'], ico: '⚙️', name: 'Les Plans du Grand Piège', reward: { def: 'grandpiege' },
    hook: c => `${c.name} griffonne des plans toute la nuit en marmonnant « clac… CLAC… GRAND CLAC ». Il·elle prépare quelque chose.`,
    ch: [
      { t: 'L’atelier secret', x: c => `${c.name} doit travailler 3 nuits d’affilée, posté·e à l’Atelier.`, need: { post: ['atelier', 3] } },
      { t: 'Les essais', x: () => 'Il faut 3 pièges ou verrous dans tes couloirs pour tester les mécanismes.', need: { traps: 3 } },
      { t: 'Le premier clac', x: () => 'Un de tes pièges doit mettre un héros (ou un sbire) K.O.', need: { trapko: 1 } },
      { t: 'Le montage', x: () => 'Il ne manque que de la ferraille : 6 🪵.', pay: { s: 6 } },
    ] },
  grandemare: { sp: ['crapaud'], ico: '🐸', name: 'Le Chant de la Grande Mare', reward: { room: 'maresacree' },
    hook: c => `${c.name} entend un chant venu de la forêt : une très vieille mare l’appelle, paraît-il.`,
    ch: [
      { t: 'Une mare à soi', x: () => 'Creuse une Mare dans les Jardins.', need: { room: 'mare' } },
      { t: 'Le grand calme', x: () => 'La mare n’aime pas l’agitation : garde la Calamité à 4 ou moins pendant 3 nuits.', need: { calm: [4, 3] } },
      { t: 'Le chœur', x: c => `4 créatures ravies (4 ❤️ ou plus) doivent chanter avec ${c.name}.`, need: { happy: [4, 4] } },
      { t: 'La nuit des lucioles', x: () => 'Il faut attendre deux nuits que les lucioles reviennent.', need: { wait: 2 } },
    ] },
  gigue: { sp: ['squelette'], ico: '🎻', name: 'La Gigue des Os', reward: { art: 'violon' },
    hook: c => `${c.name} a retrouvé un vieil archet coincé dans ses côtes. Il lui manque un violon… et une fête.`,
    ch: [
      { t: 'Le bois qui chante', x: () => 'Un Caveau, pour trouver du bois de cercueil bien sec.', need: { room: 'caveau' } },
      { t: 'La répétition', x: c => `${c.name} doit répéter 2 nuits d’affilée, posté·e au Caveau.`, need: { post: ['caveau', 2] } },
      { t: 'La fête', x: () => '5 créatures ravies, et la gigue peut commencer.', need: { happy: [5, 4] } },
      { t: 'Le grand bal', x: () => 'Le violon est prêt. On invite le village, ou on danse entre nous ?', choice: [
        { t: 'Inviter le village', fx: 'gw', n: 12, then: 'bonne volonté +12 au village le plus proche' },
        { t: 'Bal privé', fx: 'hype', n: 3, then: '+3 🔥' }] },
    ] },
  lunenoire: { sp: ['sorciere'], ico: '🌑', name: 'Le Grimoire de la Lune Noire', reward: { evo: 'lunenoire' },
    hook: c => `${c.name} a trouvé un grimoire dont les pages ne se lisent qu’à la lune noire. Il·elle veut le déchiffrer.`,
    ch: [
      { t: 'Les premières pages', x: c => `${c.name} doit étudier 3 nuits d’affilée, posté·e au Laboratoire.`, need: { post: ['labo', 3] } },
      { t: 'L’encre d’étoile', x: () => 'L’encre d’étoile coûte cher : 12 💰.', pay: { g: 12 } },
      { t: 'L’épreuve', x: c => `${c.name} doit défendre le château lors d’une invasion ou d’un sabotage.`, need: { fight: 1 } },
      { t: 'La lune noire', x: () => 'Trois nuits, et la lune sera noire.', need: { wait: 3 } },
    ] },
  mamie: { sp: ['troll'], ico: '🍲', name: 'La Recette de Mamie Troll', reward: { art: 'chaudronmamie' },
    hook: c => `${c.name} pleure dans sa soupe : il·elle a oublié la recette de Mamie Troll.`,
    ch: [
      { t: 'La cuisine de Mamie', x: () => 'Il faut un Chaudron dans une Cuisine.', need: { furn: ['chaudron', 1] } },
      { t: 'L’ingrédient secret', x: c => `Réussis un raid avec ${c.name} : ça lui reviendra en route.`, need: { raid: 1 } },
      { t: 'Le palais', x: c => `${c.name} doit atteindre le niveau 3 (un palais de connaisseur).`, need: { lvl: 3 } },
      { t: 'La soupe', x: () => 'La recette est retrouvée ! Une grande soupe pour tous, ou on garde le secret ?', choice: [
        { t: 'Soupe pour tout le monde', fx: 'feast', then: 'toutes les créatures +1 ❤️' },
        { t: 'Garder le secret', fx: 'gold', n: 10, then: '+10 💰 (des voisins paient pour goûter)' }] },
    ] },
  ancetres: { sp: ['orque'], ico: '⚒️', name: 'La Forge des Ancêtres', reward: { room: 'forgeancetres' },
    hook: c => `${c.name} a rêvé de ses ancêtres, qui forgeaient sous la montagne. Il·elle veut rallumer leur feu.`,
    ch: [
      { t: 'Une grande forge', x: () => 'Colle deux Forges l’une à l’autre pour en faire une grande salle.', need: { big: 'forge' } },
      { t: 'Le métal des héros', x: c => `${c.name} doit mettre 2 ennemis K.O. (on fondra leurs épées).`, need: { ko: 2 } },
      { t: 'Le charbon', x: () => 'Le feu des ancêtres a faim : 8 🪵.', pay: { s: 8 } },
      { t: 'Le premier coup de marteau', x: () => 'Deux nuits pour que le feu prenne.', need: { wait: 2 } },
    ] },
  bal: { sp: ['fantome'], ico: '👻', name: 'Le Grand Bal des Spectres', reward: { evo: 'spectre' },
    hook: c => `${c.name} reçoit une invitation qui tremble : le Grand Bal des Spectres. Il·elle n’a rien à se mettre.`,
    ch: [
      { t: 'Une salle digne', x: c => `${c.name} doit hanter la Bibliothèque 2 nuits d’affilée (poste).`, need: { post: ['bibli', 2] } },
      { t: 'Les portraits', x: () => 'Les spectres adorent les portraits : 2 Tableaux au château.', need: { furn: ['tableau', 2] } },
      { t: 'La renommée', x: () => 'Le château doit être célèbre : 15 🔥 de notoriété.', need: { hype: 15 } },
      { t: 'Le bal', x: () => 'Deux nuits de valse, jusqu’à l’aube.', need: { wait: 2 } },
    ] },
};
function sagaState() { return S.sagas || (S.sagas = { done: [], cur: null, offer: null, last: 0, rooms: [], defs: [] }); }
const sagaOf = c => { const s = S.sagas; if (!s || !c) return null; if (s.cur && s.cur.c === c.id) return { st: s.cur, k: s.cur.id, active: true }; if (s.offer && s.offer.c === c.id) return { st: s.offer, k: s.offer.id, offer: true }; return null; };
const sagaChap = st => SAGAS[st.id] && SAGAS[st.id].ch[st.i];
const sagaAction = ch => !!ch && !!(ch.pay || ch.choice);
// le petit sticker 📖 : une intrigue proposée, un nouveau chapitre pas encore lu, ou un choix qui t'attend
function sagaReady(c) { const o = sagaOf(c); if (!o) return false; return o.offer || !o.st.seen || sagaAction(sagaChap(o.st)); }
const trapsOnPath = () => (S.defs || []).filter(d => DEFS[d.t] && !DEFS[d.t].block && !DEFS[d.t].alarm && !DEFS[d.t].post).length;   // (il n'y a plus de chemin des héros : tous les pièges comptent)
function sagaNeedMet(c, need, st) {
  if (need.room) return builtCount(need.room) > 0;
  if (need.big) return maxGroup(need.big) >= 2;
  if (need.furn) return countItem(need.furn[0]) >= need.furn[1];
  if (need.sp) return countSp(need.sp[0]) >= need.sp[1];
  if (need.lvl) return (c.lvl || 1) >= need.lvl;
  if (need.hype) return S.hype >= need.hype;
  if (need.traps) return trapsOnPath() >= need.traps;
  if (need.happy) return S.creatures.filter(o => !isOut(o) && o.mood >= need.happy[1]).length >= need.happy[0];
  const goal = need.post ? need.post[1] : need.calm ? need.calm[1] : need.wait || need.raid || need.fight || need.ko || need.trapko || 1;
  return (st.cnt || 0) >= goal;
}
function sagaProgress(c, need, st) {
  if (need.post) return `${Math.min(st.cnt || 0, need.post[1])}/${need.post[1]} nuits`;
  if (need.calm) return `${Math.min(st.cnt || 0, need.calm[1])}/${need.calm[1]} nuits calmes`;
  if (need.wait) return `${Math.min(st.cnt || 0, need.wait)}/${need.wait} nuits`;
  if (need.raid || need.fight || need.ko || need.trapko) { const g = need.raid || need.fight || need.ko || need.trapko; return `${Math.min(st.cnt || 0, g)}/${g}`; }
  if (need.sp) return `${countSp(need.sp[0])}/${need.sp[1]}`;
  if (need.furn) return `${countItem(need.furn[0])}/${need.furn[1]}`;
  if (need.lvl) return `niveau ${c.lvl || 1}/${need.lvl}`;
  if (need.hype) return `${S.hype}/${need.hype} 🔥`;
  if (need.traps) return `${trapsOnPath()}/${need.traps} pièges`;
  if (need.happy) return `${S.creatures.filter(o => !isOut(o) && o.mood >= need.happy[1]).length}/${need.happy[0]} ravies`;
  return '';
}
const sagaRewardText = k => { const r = SAGAS[k].reward; return r.evo ? `une évolution unique : ${EVOS[r.evo].title} (${EVOS[r.evo].desc.replace(/\.$/, '')})` : r.art ? `un trésor unique : ${FURN[r.art].name}` : r.room ? `une salle unique : ${ROOMS[r.room].name}` : `un piège unique : ${DEFS[r.def].name}`; };

/* ---------- l'aube : une intrigue se présente (rarement), les chapitres avancent ---------- */
function sagaDawn(report) {
  if (!S.started) return;
  const s = sagaState(), out = [];
  // l'offre expire, ou la créature est partie
  if (s.offer && (!critter(s.offer.c) || S.night > s.offer.until)) { s.offer = null; s.last = S.night; }
  // l'intrigue en cours
  if (s.cur) {
    const st = s.cur, c = critter(st.c), K = SAGAS[st.id];
    if (!c) { out.push(['💔', `L’intrigue « ${K.name} » s’arrête là : son héros·héroïne a quitté le château.`, 'bad']); s.cur = null; s.last = S.night; }
    else {
      const ch = sagaChap(st), need = ch && ch.need;
      if (need && need.post) { const r = c.post && S.rooms.find(o => o.id === c.post && o.built); st.cnt = r && (r.t === need.post[0] || ROOMS[r.t].like === need.post[0]) && !isOut(c) ? (st.cnt || 0) + 1 : 0; }
      if (need && need.calm) st.cnt = S.calamity <= need.calm[0] ? (st.cnt || 0) + 1 : 0;
      if (need && need.wait) st.cnt = (st.cnt || 0) + 1;
      if (need && sagaNeedMet(c, need, st)) sagaAdvance(c, st, out);
    }
  }
  // une nouvelle intrigue ? rare : après la nuit 8, douze nuits après la précédente, trois par partie au plus
  else if (!s.offer && S.night >= SAGA_FROM && S.night - s.last >= SAGA_GAP && s.done.length < SAGA_MAX && !(S.tuto && S.tuto.on) && Math.random() < SAGA_CHANCE) {
    const cands = [];
    Object.entries(SAGAS).forEach(([k, K]) => { if (s.done.includes(k)) return; S.creatures.forEach(c => { if (K.sp.includes(c.sp) && !c.evo && (c.lvl || 1) >= 2 && c.mood >= 3 && !isOut(c) && !injured(c) && S.night - (c.joined || 1) >= 6) cands.push([k, c]); }); });
    if (cands.length) {
      const [k, c] = pick(cands), K = SAGAS[k];
      s.offer = { id: k, c: c.id, n: S.night, until: S.night + 5 };
      out.push(['📖', `Une intrigue s’offre à toi : « ${K.name} ». ${K.hook(c)} Ouvre la fiche de ${c.name} pour la suivre (elle est longue, mais rapporte ${sagaRewardText(k)}).`, 'ev']);
      addLog(`Intrigue : ${K.name} (${c.name}).`, 'ev');
    }
  }
  if (out.length) { report.push(['sec', 'Intrigues']); out.forEach(l => report.push(l)); }
}
function sagaAdvance(c, st, out) {
  const K = SAGAS[st.id], done = K.ch[st.i];
  st.i++; st.cnt = 0; st.seen = false;
  if (st.i >= K.ch.length) { sagaComplete(c, st, out); return; }
  const nx = K.ch[st.i];
  out.push([K.ico, `« ${K.name} », acte ${st.i}/${K.ch.length} réussi : ${done.t}. Suite : ${nx.t}. ${nx.x(c)}`, 'ev']);
}
function sagaComplete(c, st, out) {
  const s = sagaState(), K = SAGAS[st.id], R = K.reward; s.done.push(st.id); s.cur = null; s.last = S.night;
  S.stats.sagas = (S.stats.sagas || 0) + 1;
  let t;
  if (R.evo) { c.evo = R.evo; c.mood = 5; if (typeof addLoy === 'function') addLoy(c, 25); t = `${c.name} devient ${EVOS[R.evo].title} ! ${EVOS[R.evo].desc}`; }
  else if (R.art) { giveArtefact(R.art, 'intrigue'); t = `${c.name} t’offre ${FURN[R.art].name}, un trésor unique (onglet Trésors).`; }
  else if (R.room) { s.rooms.push(R.room); t = `Une salle unique se débloque : ${ROOMS[R.room].name} (onglet Pièces${ROOMS[R.room].out ? ', dans les Jardins' : ''}).`; }
  else if (R.def) { s.defs.push(R.def); S.free[R.def] = (S.free[R.def] || 0) + 1; t = `${DEFS[R.def].name} est prêt : il t’attend dans l’onglet Pièges (le premier est offert).`; }
  out.push(['🏆', `Intrigue achevée : « ${K.name} » ! ${t}`, 'good']);
  addLog(`Intrigue achevée : ${K.name}.`, 'ev'); ping(c, 'comble');
}
// les événements de la nuit qui font avancer un chapitre (raids, combats)
function sagaEvent(kind, data) {
  const s = S.sagas; if (!s || !s.cur) return;
  const st = s.cur, ch = sagaChap(st), need = ch && ch.need, c = critter(st.c); if (!need || !c || !need[kind]) return;
  if (kind === 'raid' && data.includes(c.id)) st.cnt = (st.cnt || 0) + 1;
  if (kind === 'fight' && data.includes(c.id)) st.cnt = (st.cnt || 0) + 1;
  if (kind === 'ko' && data[c.id]) st.cnt = (st.cnt || 0) + data[c.id];
  if (kind === 'trapko' && data > 0) st.cnt = (st.cnt || 0) + data;
}
const applyRaidBase = applyRaid;
applyRaid = function (roll) { const team = S.raid ? [...S.raid.team] : [], lines = applyRaidBase(roll); if (roll.res !== 'fail') sagaEvent('raid', team); return lines; };
const applyCombatBase = applyCombat;
applyCombat = function (plan, R, lines) {
  applyCombatBase(plan, R, lines);
  sagaEvent('fight', R.fought); sagaEvent('ko', R.kos);
  sagaEvent('trapko', R.ev.filter(b => b.k === 'trap').reduce((a, b) => a + b.hits.filter(h => h.ko).length, 0));
};

/* ---------- ce que le joueur décide : suivre, payer, choisir ---------- */
function sagaAccept(id) {
  const s = sagaState(), o = s.offer; if (!o || o.c !== id) return 'Pas d’intrigue';
  s.cur = { id: o.id, c: o.c, i: 0, cnt: 0, n: S.night, seen: true }; s.offer = null; s.last = S.night;
  addLog(`Tu suis l’intrigue « ${SAGAS[o.id].name} ».`, 'ev'); return null;
}
function sagaQuit(id) { const s = sagaState(); if (!s.cur || s.cur.c !== id) return 'Pas d’intrigue'; addLog(`Intrigue abandonnée : ${SAGAS[s.cur.id].name}.`, 'bad'); s.cur = null; s.last = S.night; return null; }
function sagaDecline(id) { const s = sagaState(); if (!s.offer || s.offer.c !== id) return 'Pas d’intrigue'; s.offer = null; s.last = S.night; return null; }
function sagaPay(id) {
  const s = sagaState(), st = s.cur, c = critter(id); if (!st || st.c !== id || !c) return 'Pas d’intrigue';
  const ch = sagaChap(st); if (!ch || !ch.pay) return 'Rien à payer'; if (!canAfford(ch.pay)) return 'Pas assez';
  pay(ch.pay); const out = []; sagaAdvance(c, st, out); out.forEach(l => toast(`${l[0]} ${l[1]}`)); return null;
}
function sagaChoose(id, j) {
  const s = sagaState(), st = s.cur, c = critter(id); if (!st || st.c !== id || !c) return 'Pas d’intrigue';
  const ch = sagaChap(st), o = ch && ch.choice && ch.choice[j]; if (!o) return 'Choix inconnu';
  if (o.cost && !canAfford(o.cost)) return 'Pas assez'; if (o.need && !sagaNeedMet(c, o.need, st)) return 'Condition non remplie';
  if (o.cost) pay(o.cost);
  if (o.fx === 'feast') S.creatures.forEach(x => { x.mood = clamp(x.mood + 1, 0, 5); });
  if (o.fx === 'hype') S.hype += o.n;
  if (o.fx === 'gold') S.gold += o.n;
  if (o.fx === 'gw' && typeof nearestSettlement === 'function') { const near = settlements().filter(siteKnown).sort((a, b) => hdist(a.q, a.r) - hdist(b.q, b.r))[0]; if (near) addGw(near, o.n); }
  const out = []; sagaAdvance(c, st, out); out.forEach(l => toast(`${l[0]} ${l[1]}`)); return null;
}
Object.assign(CMD, {
  sagaAccept(a) { return sagaAccept(a.id); }, sagaDecline(a) { return sagaDecline(a.id); },
  sagaPay(a) { return sagaPay(a.id); }, sagaQuit(a) { return sagaQuit(a.id); }, sagaChoose(a) { return sagaChoose(a.id, a.j); },
});

/* ---------- sur la fiche de la créature ---------- */
function sagaCard(c) {
  if (c.evo && EVOS[c.evo]) return `<div class="saga done"><b>🏆 ${esc(EVOS[c.evo].title)}</b><p class="hint">${esc(EVOS[c.evo].desc)}</p></div>`;
  const o = sagaOf(c); if (!o) return '';
  const K = SAGAS[o.k];
  if (o.offer) return `<div class="saga offer"><b>${K.ico} Une intrigue : ${esc(K.name)}</b><p>${esc(K.hook(c))}</p>
    <p class="hint">Longue (${K.ch.length} actes) et rare, mais au bout : ${esc(sagaRewardText(o.k))}. L’offre tient jusqu’à la nuit ${o.st.until}.</p>
    <div class="btnrow"><button class="sbtn pri" type="button" data-saga="accept">📖 Suivre cette intrigue</button><button class="sbtn" type="button" data-saga="decline">Pas maintenant</button></div></div>`;
  const st = o.st, ch = sagaChap(st); if (!ch) return '';
  const prog = ch.need ? sagaProgress(c, ch.need, st) : '';
  return `<div class="saga"><b>${K.ico} ${esc(K.name)} · acte ${st.i + 1}/${K.ch.length}</b><p><b>${esc(ch.t)}</b> : ${esc(ch.x(c))}${prog ? ` <span class="tag2">${esc(prog)}</span>` : ''}</p>
    ${ch.pay ? `<div class="btnrow"><button class="sbtn pri" type="button" data-saga="pay" ${canAfford(ch.pay) ? '' : 'disabled'}>Payer ${costText(ch.pay)}</button></div>` : ''}
    ${ch.choice ? `<div class="btnrow">${ch.choice.map((x, j) => `<button class="sbtn${j ? '' : ' pri'}" type="button" data-saga="choose" data-j="${j}" ${(x.cost && !canAfford(x.cost)) || (x.need && !sagaNeedMet(c, x.need, st)) ? 'disabled' : ''}>${esc(x.t)}${x.cost ? ` (${costText(x.cost)})` : ''}<br><small>${esc(x.then)}</small></button>`).join('')}</div>` : ''}
    <p class="hint">Au bout : ${esc(sagaRewardText(o.k))}. <button class="linkbtn" type="button" data-saga="quit">Abandonner l’intrigue</button></p></div>`;
}
const openCreatureSaga = openCreature;
openCreature = function (id) {
  const c = critter(id), o = c && sagaOf(c); if (o && o.active) o.st.seen = true;
  const r = openCreatureSaga(id);
  const m = c && document.querySelector && document.querySelector('#modalRoot .modal'), html = c ? sagaCard(c) : '';
  if (m && html) {
    const anchor = m.querySelector('#mEnvie') || m.querySelector('.bubble');
    if (anchor) anchor.insertAdjacentHTML('afterend', html);
    m.querySelectorAll('[data-saga]').forEach(b => b.addEventListener('click', () => {
      const k = b.dataset.saga; if (k === 'quit' && !confirm('Abandonner cette intrigue ? Elle ne reviendra pas de sitôt.')) return;
      if (!run(k === 'accept' ? 'sagaAccept' : k === 'decline' ? 'sagaDecline' : k === 'pay' ? 'sagaPay' : k === 'quit' ? 'sagaQuit' : 'sagaChoose', { id, j: +b.dataset.j || 0 })) return;
      sfx(k === 'decline' || k === 'quit' ? 'tick' : 'chime'); afterChange(); openCreature(id);
    }));
  }
  return r;
};
function sagaNotifs(add) {
  const s = S.sagas; if (!s) return;
  if (s.offer) { const c = critter(s.offer.c); if (c) add('saga', '📖', `Une intrigue avec ${c.name}`, () => openCreature(c.id), 4, 'ev'); }
  if (s.cur) { const c = critter(s.cur.c), ch = sagaChap(s.cur); if (c && sagaAction(ch)) add('saga', '📖', `${SAGAS[s.cur.id].name} : à toi de jouer`, () => openCreature(c.id), 3, 'ev'); }
}
// dans « Les envies » : le journal des intrigues
const openMissionsSaga = openMissions;
openMissions = function () {
  const r = openMissionsSaga(), s = S.sagas, m = document.querySelector && document.querySelector('#modalRoot .modal');
  if (m && s && (s.cur || s.offer || s.done.length)) {
    const row = (k, txt) => `<li><span class="emo">${SAGAS[k].ico}</span><span><b>${esc(SAGAS[k].name)}</b> : ${txt}</span></li>`;
    const html = `<h3>📖 Intrigues</h3><ul class="chron">${s.offer ? row(s.offer.id, `proposée par ${esc((critter(s.offer.c) || {}).name || '?')}, jusqu’à la nuit ${s.offer.until}.`) : ''}${s.cur ? row(s.cur.id, `acte ${s.cur.i + 1}/${SAGAS[s.cur.id].ch.length} avec ${esc((critter(s.cur.c) || {}).name || '?')} (${esc(sagaChap(s.cur).t)}).`) : ''}${s.done.map(k => row(k, 'achevée.')).join('')}</ul>`;
    const foot = m.querySelector('.mfoot'); if (foot) foot.insertAdjacentHTML('beforebegin', html); else m.insertAdjacentHTML('beforeend', html);
  }
  return r;
};

/* ---------- l'évolution se voit : couronne, croissant de lune, aura ---------- */
const drawActorSaga = drawActor;
drawActor = function (g, a, t) {
  const c = a.kind === 'char' && S && critter(a.id), E = c && c.evo && EVOS[c.evo];
  if (E && E.look === 'aura') { const [wx, wy] = WP(a.x, a.y); g.save(); g.globalCompositeOperation = 'lighter'; const p = .6 + .3 * Math.sin(t / 380 + a.ph); const gr = g.createRadialGradient(wx, wy - 14, 2, wx, wy - 14, 42); gr.addColorStop(0, `rgba(150,200,255,${.55 * p})`); gr.addColorStop(1, 'rgba(150,200,255,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(wx, wy - 14, 42, 34, 0, 0, 7); g.fill();
    g.globalCompositeOperation = 'source-over'; g.beginPath(); g.ellipse(wx, wy, 20, 9, 0, 0, 7); g.lineWidth = 2.2; g.strokeStyle = `rgba(110,160,255,${.55 + .35 * p})`; g.stroke();
    for (let i = 0; i < 3; i++) { const an = t / 700 + a.ph + i * 2.1, sx = wx + Math.cos(an) * 22, sy = wy - 30 + Math.sin(an) * 10; g.beginPath(); g.arc(sx, sy, 2.2, 0, 7); g.fillStyle = '#8fb8ff'; g.fill(); g.lineWidth = .8; g.strokeStyle = INK; g.stroke(); }
    g.restore(); }
  drawActorSaga(g, a, t);
  if (!E || E.look === 'aura') return;
  const s = getSprite(a.kind, a.key), k = AU / SQ() * 1.08 * ACTOR_K, [wx, wy] = WP(a.x, a.y);
  const bob = a.walking ? Math.abs(Math.sin(t / 95 + a.ph)) * 5 * (ACTOR_K + .2) : 0, top = wy - bob - s.ay * k;
  g.save(); g.translate(wx + (a.flip ? 1 : -1) * 2 * k, top + 9 * k);
  if (E.look === 'crown') {
    const w = 20, h = 12; g.beginPath(); g.moveTo(-w / 2, 0); g.lineTo(-w / 2, -h * .55); g.lineTo(-w / 4, -h * .2); g.lineTo(0, -h); g.lineTo(w / 4, -h * .2); g.lineTo(w / 2, -h * .55); g.lineTo(w / 2, 0); g.closePath();
    g.fillStyle = '#f2c230'; g.fill(); g.lineWidth = 1.4; g.strokeStyle = INK; g.stroke();
    [[-w / 2, -h * .55], [0, -h], [w / 2, -h * .55]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 2, 0, 7); g.fillStyle = '#e8557a'; g.fill(); });
    g.globalCompositeOperation = 'lighter'; g.globalAlpha = .4 + .3 * Math.sin(t / 300); g.beginPath(); g.arc(-2, -h * .5, 2.2, 0, 7); g.fillStyle = '#fff6c8'; g.fill();
  } else if (E.look === 'moon') {
    const y = -10 + Math.sin(t / 600 + a.ph) * 2, mx = 15; g.globalCompositeOperation = 'lighter'; g.beginPath(); g.arc(mx, y, 14, 0, 7); g.fillStyle = 'rgba(160,120,255,.22)'; g.fill(); g.globalCompositeOperation = 'source-over';
    g.beginPath(); g.arc(mx, y, 8.5, 0, 7); g.fillStyle = '#e4dcff'; g.fill(); g.lineWidth = 1.2; g.strokeStyle = INK; g.stroke(); g.beginPath(); g.arc(mx + 3.6, y - 2, 7, 0, 7); g.fillStyle = '#2a1f45'; g.fill();
  }
  g.restore();
};

/* ---------- pour le simulateur : un joueur qui suit les intrigues ---------- */
function sagaBotStep() {
  const s = S.sagas; if (!s) return;
  if (s.offer) sagaAccept(s.offer.c);
  if (s.cur) { const ch = sagaChap(s.cur), c = critter(s.cur.c); if (!c || !ch) return;
    if (ch.pay && canAfford(ch.pay)) sagaPay(c.id);
    else if (ch.choice) { const j = ch.choice.findIndex(o => (!o.cost || canAfford(o.cost)) && (!o.need || sagaNeedMet(c, o.need, s.cur))); if (j >= 0) sagaChoose(c.id, j); } }
}

/* ---------- le Grimoire ---------- */
WIKI.intrigues = { cat: 'ames', t: 'Les intrigues', x: () => `<p>Rarement (après la nuit ${SAGA_FROM}, au plus une fois toutes les ${SAGA_GAP} nuits, ${SAGA_MAX} par partie), une créature aguerrie (niveau 2, de bonne humeur) te propose une <b>intrigue</b> : une longue histoire en 4 actes. Le sticker 📖 apparaît au-dessus d’elle ; tout se passe sur sa fiche.</p>
  <p>Chaque acte demande quelque chose de concret : une pièce, un poste tenu plusieurs nuits, un raid réussi avec elle, un combat, du calme, un paiement, ou un choix. Si elle quitte le château, l’intrigue s’arrête.</p>
  <p>Au bout, une récompense que tu n’auras nulle part ailleurs :</p><ul>${Object.values(SAGAS).map(K => { const r = K.reward; return `<li>${K.ico} <b>${esc(K.name)}</b> (${K.sp.map(sp => `{sp:${sp}}`).join(', ')}) : ${r.evo ? `évolution « ${esc(EVOS[r.evo].title)} »` : r.art ? `trésor « ${esc(FURN[r.art].name)} »` : r.room ? `salle « ${esc(ROOMS[r.room].name)} »` : `piège « ${esc(DEFS[r.def].name)} »`}.</li>`; }).join('')}</ul>` };
TIPS.push({ id: 'saga0', when: () => !!(S.sagas && (S.sagas.offer || S.sagas.cur)), t: 'Une intrigue !', x: 'Une créature te propose une longue histoire. C’est rare : suis-la jusqu’au bout pour une récompense unique (évolution, trésor, salle ou piège).', wiki: 'intrigues' });
