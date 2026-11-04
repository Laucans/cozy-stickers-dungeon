/* =========================================================
   Les rivaux contre-attaquent
   À certains moments de leur course à la victoire, les quatre
   donjons rivaux préparent un coup contre ton château, annoncé
   trois nuits à l'avance : Krouk pille ta réserve d'or,
   Mère-Crapaud attire deux de tes créatures, Ysolde vole un
   artefact, Pâlefroid salit ta réputation. Deux parades : une
   expédition dans son donjon pendant le compte à rebours, ou un
   espion payé en or. Un rival qui gagne une ère exige en plus
   un tribut. Le premier coup de chaque rival tombe entre les
   nuits 15 et 35 : le milieu de partie a ses menaces.
   ========================================================= */
const COUP_DELAY = 3;
const coupSeuils = i => [18 + 6 * i, 55 + 5 * i, 82];   // les seuils de course qui déclenchent un coup (décalés d'un rival à l'autre)
const coupCost = () => 15 + 5 * (S.tier || 0) + 5 * ((vicState().spies) || 0);   // moins cher que la perte probable, un peu plus à chaque espion
const kroukTake = () => Math.max(Math.floor(S.gold * .25), 20 + 10 * (S.tier || 0));   // au moins 20 💰 (+10 par palier) ; ce qui manque se prend en bois
const coupMaster = r => r.master.charAt(0).toUpperCase() + r.master.slice(1);
const COUPS = {
  septbieres: { ico: '🍺', t: 'pillera ta réserve', loss: () => `${kroukTake()} 💰 (le quart de ton or, au moins ${20 + 10 * (S.tier || 0)} ; s’il manque de l’or, du bois)`,
    run: (r, out) => { const want = kroukTake(), g = Math.min(S.gold, want), s = Math.min(S.mat, Math.ceil((want - g) * 1.5)); S.gold -= g; S.mat -= s; out.push(['🍺', `${coupMaster(r)} et ses gobelins vident ta réserve : −${g} 💰${s ? `, −${s} 🪵` : ''}.`, 'bad']); } },
  moussues: { ico: '🍄', t: 'attirera deux de tes créatures', loss: () => 'deux créatures (ses espèces préférées d’abord, les moins fidèles ensuite)',
    run: (r, out) => { const pool = S.creatures.filter(c => !isOut(c) && c.sp !== 'diablotin' && !c.legend && !c.evo).sort((a, b) => (r.likes.includes(b.sp) ? 1 : 0) - (r.likes.includes(a.sp) ? 1 : 0) || (a.loy == null ? 50 : a.loy) - (b.loy == null ? 50 : b.loy)).slice(0, 2);
      if (!pool.length) { out.push(['🍄', `${coupMaster(r)} n’a trouvé personne à attirer chez elle.`, '']); return; }
      pool.forEach(c => { S.creatures = S.creatures.filter(x => x !== c); addLog(`${c.name} est parti·e chez ${r.master}.`, 'bad'); });
      out.push(['🍄', `${coupMaster(r)} a fait miroiter ses grottes : ${pool.map(c => `${c.name} (${SPECIES[c.sp].name})`).join(' et ')} ${pool.length > 1 ? 'partent' : 'part'} chez elle.`, 'bad']); } },
  morgrave: { ico: '🗼', t: 'volera un artefact', loss: () => S.furn.some(f => FURN[f.t] && FURN[f.t].artefact) || TREASURES.some(k => (S.free[k] || 0) > 0) ? 'un artefact (rachetable ensuite au brocanteur)' : 'une créature, enlevée contre rançon (tu n’as pas d’artefact)',
    run: (r, out) => {
      const placed = S.furn.filter(f => FURN[f.t] && FURN[f.t].artefact), res = TREASURES.filter(k => (S.free[k] || 0) > 0);
      if (placed.length || res.length) { let k; if (res.length) { k = pick(res); S.free[k]--; } else { const f = pick(placed); S.furn = S.furn.filter(x => x !== f); k = f.t; } (S.world.stolen = S.world.stolen || []).push(k); out.push(['🗼', `Les spectres d’${r.master.replace(/^la nécromancienne /, '')} emportent ${FURN[k].name} ! (le brocanteur pourra te le revendre)`, 'bad']); }
      else { const c = S.creatures.filter(x => !isOut(x) && x.sp !== 'diablotin').sort((a, b) => (b.lvl || 1) - (a.lvl || 1))[0]; if (c && typeof captiveRansom === 'function') { c.captive = S.night + 5; c.post = null; out.push(['🗼', `Des spectres enlèvent ${c.name} pour le compte de ${r.master} : rançon de ${captiveRansom(c)} 💰 (sa fiche), ou évasion dans 5 nuits.`, 'bad']); } else { const s = Math.floor(S.mat / 3); S.mat -= s; out.push(['🗼', `Une malédiction de ${r.master} fait pourrir ton bois : −${s} 🪵.`, 'bad']); } } } },
  ombrelune: { ico: '🦇', t: 'semera la zizanie chez toi', loss: () => 'une humeur de moins pour toutes tes créatures (et −5 de loyauté), et 15 de bonne volonté dans chaque village',
    run: (r, out) => { S.creatures.forEach(c => { if (!isOut(c)) { c.mood = clamp(c.mood - 1, 0, 5); if (typeof addLoy === 'function') addLoy(c, -5); } }); if (typeof settlements === 'function' && typeof addGw === 'function') settlements().forEach(s => addGw(s, -15)); out.push(['🦇', `${coupMaster(r)} répand des rumeurs dans tout le Val et jusque dans tes dortoirs : toutes tes créatures boudent un peu (−1 humeur, −5 loyauté), −15 de bonne volonté partout.`, 'bad']); } },
};
const coupState = () => { const v = vicState(); v.coups = v.coups || {}; v.coupN = v.coupN || {}; return v; };
const coupPending = () => Object.entries(coupState().coups);
// chaque nuit, avant la course : les coups arrivés à terme frappent, puis de nouveaux s'annoncent
function coupsTick(out) {
  const v = coupState();
  Object.entries(v.coups).forEach(([id, c]) => {
    if (S.night < c.at) return; const r = racer(id); delete v.coups[id];
    if (!r || isVassal(id)) return;
    COUPS[id].run(r, out); v.coupN[id] = (v.coupN[id] || 0) + 1; v.race[id] = Math.min(99, (v.race[id] || 0) + 3);
  });
  RIVALS.forEach((r, i) => {
    if (isVassal(r.id) || v.coups[r.id] || !COUPS[r.id]) return;
    const n = v.coupN[r.id] || 0, seuil = coupSeuils(i)[n]; if (seuil == null || (v.race[r.id] || 0) < seuil) return;
    v.coups[r.id] = { at: S.night + COUP_DELAY, n };
    out.push(['🗡️', `Un coup se prépare : dans ${COUP_DELAY} nuits, ${r.master} ${COUPS[r.id].t}. Parade : une expédition dans ${r.name}, ou un espion (${coupCost()} 💰).`, 'bad']);
  });
}
const raceTickCoups = raceTick;
raceTick = function (out) { try { coupsTick(out); } catch (e) { console.error(e); } return raceTickCoups(out); };
// une parade : un espion payé en or
CMD.spy = a => {
  const v = coupState(), c = v.coups[a && a.id]; if (!c) return 'Aucun coup en préparation';
  const cost = coupCost(); if (S.gold < cost) return `Il te faut ${cost} 💰`;
  S.gold -= cost; v.spies = (v.spies || 0) + 1; S.stats.coupsFoiled = (S.stats.coupsFoiled || 0) + 1; delete v.coups[a.id]; v.coupN[a.id] = (v.coupN[a.id] || 0) + 1;
  addLog(`Un espion déjoue le coup de ${racer(a.id).master}.`, 'good'); return null;
};
// l'autre parade : frapper son donjon pendant le compte à rebours (une expédition qui passe au moins une salle)
const crawlVictoryCoup = crawlVictory;
crawlVictory = function (dg, R, lines) {
  const v = coupState();
  if (v.coups[dg] && R && R.path && R.path.length && R.done !== 'wipe') { delete v.coups[dg]; S.stats.coupsFoiled = (S.stats.coupsFoiled || 0) + 1; v.coupN[dg] = (v.coupN[dg] || 0) + 1; lines.push(['🛡️', `Coup déjoué ! ${coupMaster(racer(dg))} doit panser ses plaies au lieu de comploter contre toi.`, 'good']); }
  return crawlVictoryCoup(dg, R, lines);
};
// une ère perdue coûte un tribut ; la nouvelle ère remet les coups à zéro
const newEraCoup = newEra;
newEra = function (champ, out) {
  const r0 = newEraCoup(champ, out), v = coupState();
  if (RIVALS.some(r => r.id === champ)) { const g = Math.floor(S.gold * .2), s = Math.floor(S.mat * .2); S.gold -= g; S.mat -= s; out.push(['👑', `Le nouveau Grand Maître exige un tribut : −${g} 💰, −${s} 🪵.`, 'bad']); }
  v.coups = {}; v.coupN = {};
  return r0;
};
// la fiche d'un coup : ce qui va arriver, et comment l'empêcher
function openCoup(id) {
  const v = coupState(), c = v.coups[id], r = racer(id); if (!c || !r) return;
  const n = Math.max(0, c.at - S.night), cost = coupCost(), key = 'r_' + id, known = RAIDS[key] && typeof raidKnown === 'function' && raidKnown(key);
  const m = openModal(`<h2>${COUPS[id].ico} ${esc(coupMaster(r))} prépare un coup</h2>
    <p>${n ? `Dans <b>${n} nuit${n > 1 ? 's' : ''}</b>` : '<b>Cette nuit</b>'}, ${esc(r.master)} ${esc(COUPS[id].t)} : tu perdrais ${esc(COUPS[id].loss())}.</p>
    <h3>Deux parades</h3><ul><li><b>Frapper le premier</b> : une expédition dans ${esc(r.name)} qui passe au moins une salle${known ? '' : ' (trouve d’abord son donjon sur la carte du Val)'}.</li><li><b>Un espion</b> : il sème la zizanie chez ${esc(r.master)}, pour ${cost} 💰 (le prix monte à chaque espion).</li></ul>
    <div class="btnrow"><button type="button" class="sbtn pri" id="cpSpy" ${S.gold >= cost ? '' : 'disabled'}>🕵️ Payer un espion (${cost} 💰)</button>${known && S.tier >= 1 ? '<button type="button" class="sbtn" id="cpGo">🏰 Préparer l’expédition</button>' : ''}<button type="button" class="sbtn" data-close>Plus tard</button></div>`, { label: 'Un coup se prépare' });
  const sp = m.querySelector('#cpSpy'); sp && sp.addEventListener('click', () => { if (run('spy', { id })) { sfx('chime'); closeModal(); afterChange(); toast(`🕵️ Ton espion déjoue le coup de ${r.master}.`); } });
  const go = m.querySelector('#cpGo'); go && go.addEventListener('click', () => { closeModal(); openRaid(key); });
}
const victoryNotifsCoup = victoryNotifs;
victoryNotifs = function (add) {
  victoryNotifsCoup(add);
  if (!S.started) return;
  coupPending().forEach(([id, c]) => { const r = racer(id), n = Math.max(0, c.at - S.night); if (r) add('coup' + id, COUPS[id].ico, `${coupMaster(r)} ${COUPS[id].t} ${n ? `dans ${n} nuit${n > 1 ? 's' : ''}` : 'cette nuit'}`, () => openCoup(id), 7, 'bad'); });
};
UNE_RULES.push([9, /coup se prépare|Coup déjoué|vident ta réserve|partent chez elle|part chez elle|emportent|répand des rumeurs|enlèvent|exige un tribut/]);
WIKI.coups = { cat: 'danger', t: 'Les rivaux contre-attaquent', x: () => `<p>Les quatre donjons rivaux font la course à la victoire. À certains moments de leur course (le premier vers le milieu de partie, puis vers 55 % et 82 %), chacun prépare un <b>coup</b> contre toi, annoncé ${COUP_DELAY} nuits à l’avance (une pastille rouge, à droite) :</p>
  <ul>${RIVALS.filter(r => COUPS[r.id]).map(r => `<li><b>${r.name}</b> (${r.master}) ${COUPS[r.id].t}.</li>`).join('')}</ul>
  <p><b>Deux parades</b> pendant le compte à rebours : une expédition dans son donjon qui passe au moins une salle, ou un espion payé en or (${coupCost()} 💰 aujourd’hui, un peu plus à chaque espion). Un rival devenu ton vassal ne complote plus.</p>
  <p>Si un rival devient Grand Maître du Val, il exige en plus un <b>tribut</b> : le cinquième de ton or et de ton bois.</p>` };
