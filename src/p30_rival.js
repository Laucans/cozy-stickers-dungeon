
/* =========================================================
   Le rival : dès la première nuit, un des donjons du Val te
   tient tête. Il grandit avec toi, te dispute les créatures
   qui arrivent, te lance des défis et envoie ses sbires
   saboter ton château. Repousse-les, relève ses défis et
   (dès le Palier 1) pille-le pour le faire reculer.
   ========================================================= */
const NEM_SHORT = { morgrave: 'Ysolde', septbieres: 'Krouk', moussues: 'Mère-Crapaud', ombrelune: 'Pâlefroid' };
const NEM_DRIVE = { morgrave: 1.04, septbieres: 1, moussues: .96, ombrelune: 1.02 };
const NEM_TAUNTS = {
  morgrave: ['« Tes couloirs sentent le chou. Les miens sentent l’encens et la tombe fraîche. »', '« J’ai relevé trois squelettes cette nuit. Et toi, tu as… meublé ? »', '« Un jour, ton Cœur battra pour moi. »'],
  septbieres: ['« Krouk a plus de gobelins que toi a de chaises ! »', '« Viens boire une bière au Fortin… si tu oses. »', '« Mes orques s’ennuient. Je crois qu’ils vont venir te voir. »'],
  moussues: ['« Croâ. Ton château est bien sec. Trop sec. »', '« Mes crapauds chantent mieux que tes ménestrels. »', '« La mousse gagne toujours, mon petit. Toujours. »'],
  ombrelune: ['« Votre château manque cruellement de velours. »', '« Mes invités ne partent jamais. Les vôtres, si, paraît-il. »', '« Je passerai peut-être vous rendre visite. De nuit, évidemment. »'],
};
const DEFIS = {
  crit:  { t: n => `avoir ${n} créatures`, v: () => S.creatures.length, add: () => 2 },
  amb:   { t: n => `atteindre ${n} d’Ambiance`, v: () => ambiance(), add: () => 5 },
  rooms: { t: n => `avoir ${n} pièces terminées`, v: () => myRooms(), add: () => 2 },
  hype:  { t: n => `atteindre ${n} 🔥 de notoriété`, v: () => S.hype, add: () => 4 },
  lvl:   { t: n => `avoir une créature de niveau ${n}`, v: () => Math.max(1, ...S.creatures.map(c => c.lvl || 1)), add: () => 1, ok: () => S.creatures.length >= 3 },
  repel: { t: () => 'repousser une invasion', v: () => S.stats.repelled || 0, add: () => 1, ok: () => S.menace >= MENACE_MAX - 3 },
};
const myRooms = () => builtRooms().filter(r => !isHall(r) && !ROOMS[r.t].stairs && r.t !== 'coeur' && r.t !== 'porche').length;
function myPres() { return Math.round(ambiance() + 2 * S.creatures.length + 3 * S.tier + myRooms()); }
function nem() {
  if (!S.nem) {
    const r = pick(RIVALS);
    S.nem = { id: r.id, pres: Math.max(10, myPres() + 2), next: 7 + rnd(3), wins: 0, losses: 0, snatched: 0, chWon: 0, chLost: 0, ch: null, chNext: 3, news: [], since: S.night };
  }
  return S.nem;
}
const nemRival = () => RIVALS.find(r => r.id === nem().id) || RIVALS[0];
const nemName = () => NEM_SHORT[nem().id] || nemRival().master;
// « de Ysolde » → « d’Ysolde »
const dN = n => (/^[aeiouyhéèêàâîôûAEIOUYHÉÈÊÀÂÎÔÛ]/.test(n) ? 'd’' : 'de ') + n;
// un rival devenu vassal ne se bat plus : le plus coriace des autres prend la relève
function nemActive() {
  if (!S || !S.started) return false;
  const n = nem();
  if (typeof isVassal === 'function' && isVassal(n.id)) {
    const free = RIVALS.filter(r => !isVassal(r.id)); if (!free.length) return false;
    const v = vicState(), r = free.sort((a, b) => (v.race[b.id] || 0) - (v.race[a.id] || 0))[0];
    Object.assign(n, { id: r.id, pres: Math.max(n.pres, myPres()), next: S.night + 5 + rnd(3), ch: null, chNext: S.night + 2, since: S.night });
    nemNews(`${r.name} se pose en nouveau rival : « Ton ancien voisin s’est couché ? Pas moi. »`);
  }
  return true;
}
function nemNews(t) { const n = nem(); n.news.unshift([S.night, t]); if (n.news.length > 8) n.news.length = 8; }

/* ---------- la course au prestige : il grandit avec toi ---------- */
function rivalDawn(report) {
  if (!nemActive()) return;
  const n = nem(), r = nemRival(), who = nemName(), out = [];
  if (!n.shown) {   // la première aube : on le présente, et sa tour apparaît sur la carte
    n.shown = 1; const s = world().sites.find(x => x.rival === r.id);
    if (s) discover(discAround(s.q, s.r, 1), 'ton rival');
    out.push(['🏴', `Ton rival : ${r.name}, ${deM(r.master)}. Il te dispute les créatures du Val, te lancera des défis et enverra ses sbires. Touche son blason, en haut, pour le surveiller.`, 'ev']);
  }
  const target = myPres() * (NEM_DRIVE[n.id] || 1) + 6 + (n.wins - n.losses) * 1.5 + (n.chLost - n.chWon) * .8;
  n.pres = Math.max(6, Math.round((n.pres + clamp((target - n.pres) * .22 + (Math.random() - .35) * 1.6, -2, 4)) * 10) / 10);
  // les défis
  const ch = n.ch, D = ch && DEFIS[ch.k];
  if (D && D.v() >= ch.goal) {
    const g = 5 + 2 * S.tier; S.gold += g; S.mat += 2; n.pres = Math.max(6, n.pres - 3); n.chWon++; n.ch = null; n.chNext = S.night + 7 + rnd(4);
    const v = vicState(); v.race[r.id] = Math.max(0, (v.race[r.id] || 0) - 3);
    out.push(['🏆', `Défi relevé : ${D.t(ch.goal)} ! ${who} enrage. +${g} 💰, +2 🪵, et ${r.name} recule dans la course.`, 'good']);
    nemNews(`${who} a perdu son défi et boude dans sa tour.`);
  } else if (D && S.night + 1 > ch.until) {
    n.pres += 2; n.chLost++; n.ch = null; n.chNext = S.night + 6 + rnd(4);
    const v = vicState(); v.race[r.id] = Math.min(99, (v.race[r.id] || 0) + 2);
    out.push(['🏴', `Défi perdu : tu n’as pas réussi à ${D.t(ch.goal)} à temps. ${who} s’en vante dans tout le Val.`, 'bad']);
    nemNews(`${who} se vante d’avoir gagné son défi.`);
  }
  if (!n.ch && S.night + 1 >= n.chNext && !(S.tuto && S.tuto.on)) {
    const keys = Object.keys(DEFIS).filter(k => !DEFIS[k].ok || DEFIS[k].ok()), k = pick(keys), Dk = DEFIS[k], goal = Dk.v() + Dk.add();
    n.ch = { k, goal, until: S.night + 6 };
    out.push(['📯', `${who} te lance un défi : ${Dk.t(goal)} d’ici la nuit ${S.night + 6}. À la clé : de l’or, et un rival qui recule.`, 'ev']);
  }
  // le sabotage de la nuit prochaine est annoncé (ses sbires ne savent pas se taire)
  if (S.night === n.next) out.push(['⚔️', `Rumeur : les sbires ${dN(who)} attaqueront ton château cette nuit ! Pose tes pièges et garde tes créatures reposées.`, 'bad']);
  else if (S.night + 1 === n.next) out.push(['⚔️', `Rumeur : les sbires ${dN(who)} préparent un sale coup pour la nuit prochaine.`, 'bad']);
  if (Math.random() < .25 && S.night >= 3) nemNews(`${who} : ${pick(NEM_TAUNTS[n.id] || ['« Bientôt, le Val sera à moi. »'])}`);
  if (out.length) { report.push(['sec', 'Ton rival']); out.forEach(l => report.push(l)); }
}

/* ---------- il te dispute les nouvelles venues ---------- */
function nemSnatch(sp, report) {
  if (!nemActive() || S.night < 5 || (S.tuto && S.tuto.on)) return false;
  const n = nem(), r = nemRival(), gap = n.pres - myPres(); if (gap <= 2) return false;
  const chance = Math.min(.3, gap * .025 + (r.likes.includes(sp) ? .06 : 0)) * (S.album[sp] ? 1 : .5);
  if (Math.random() >= chance) return false;
  n.snatched++; n.pres += 1;
  report.push(['🏴', `Un·e ${SPECIES[sp].name} venait vers ton château… mais ${nemName()} l’a attiré·e chez ${r.name}. Son prestige dépasse le tien (${Math.round(n.pres)} contre ${myPres()}) : fais grandir ton château !`, 'bad']);
  nemNews(`${nemName()} a accueilli un·e ${SPECIES[sp].name} qui venait chez toi.`);
  return true;
}

/* ---------- ses sbires viennent saboter ton château ---------- */
function nemRaidPlan() {
  const n = nem(), r = nemRival(), cnt = clamp(2 + S.tier + (S.night >= 40 ? 1 : 0), 2, 5), lead = Math.max(0, n.pres - myPres());
  const likes = r.likes.filter(sp => SPECIES[sp]), who = nemName();
  const party = Array.from({ length: cnt }, (_, j) => {
    const sp = likes[(j + S.night) % likes.length], g = Math.min(4, SPECIES[sp].guard || 1);
    return { k: sp, name: `${SPECIES[sp].name} ${dN(who)}`, hp: 3 + 2 * g + 2 * S.tier + Math.floor(lead / 6), atk: 1 + Math.floor(g / 2) + (S.tier >= 2 ? 1 : 0), minion: true, F: {} };
  });
  const plan = { party, rank: 1, foe: `les sbires ${dN(who)}`, rival: r.id, courage: party.reduce((a, h) => a + h.hp, 0), steps: [] };
  return assignGoal(plan, { kidnap: false, wreck: 40 });   // (la préparation à ta défense n'a plus lieu d'être : les sbires traversent le château comme une bande, p70)   // des sbires : piller le Cœur, vider le trésor ou tout casser, et préparés à ta défense
}
function applyNemRaid(plan, R, lines) {
  const n = nem(), r = nemRival(), who = nemName(), v = vicState();
  applyCombat(plan, R, lines);
  if (R.outcome === 'robbed') {
    n.wins++; n.pres += 3; v.race[r.id] = Math.min(99, (v.race[r.id] || 0) + 4);
    if (plan.goal && plan.goal.k !== 'coeur') { const gl = []; goalEffects(plan.goal, gl); gl.forEach(l => lines.unshift(l)); lines.unshift(['🏴', `Les sbires ${dN(who)} ont atteint leur but. ${r.name} gagne du terrain dans la course.`, 'bad']); }
    else { const g = Math.min(S.gold, 4 + 2 * S.tier), m = Math.min(S.mat, 2); S.gold -= g; S.mat -= m; lines.unshift(['🏴', `Les sbires ${dN(who)} touchent le Cœur et filent avec ${g} 💰 et ${m} 🪵. ${r.name} gagne du terrain dans la course.`, 'bad']); }
    nemNews(`${who} fanfaronne : ses sbires ont touché ton Cœur.`);
  } else {
    const purse = 2 * plan.party.length + S.tier, room = Math.max(0, sumRooms('cells') - S.prisoners), caught = Math.min(room, R.fallen.length);
    S.gold += purse; S.prisoners += caught; n.losses++; n.pres = Math.max(6, n.pres - 3); v.race[r.id] = Math.max(0, (v.race[r.id] || 0) - 5);
    lines.unshift(['🛡️', `Les sbires ${dN(who)} détalent : +${purse} 💰, et ${r.name} recule dans la course.${caught ? ` ${caught} sbire${caught > 1 ? 's' : ''} aux Oubliettes : rançon à l’aube.` : ''}`, 'good']);
    nemNews(`${who} jure de se venger de l’accueil réservé à ses sbires.`);
  }
  S.stats.nemRaids = (S.stats.nemRaids || 0) + 1; if (R.outcome !== 'robbed') S.stats.nemRepelled = (S.stats.nemRepelled || 0) + 1;
  n.next = S.night + 8 + rnd(5);
}
const nemTonight = () => { if (!nemActive() || S.night < nem().next) return false; if (S.tuto && S.tuto.on) { nem().next = S.night + 2; return false; } return true; };   // jamais pendant le tutoriel
async function rivalNight(report) {
  if (!nemTonight()) return;
  if (report.some(l => l[0] === 'sec' && l[1] === 'Contrecoup')) { nem().next = S.night + 1; return; }   // déjà des héros cette nuit : les sbires attendent demain
  const plan = nemRaidPlan(), r = nemRival(), who = nemName();
  report.push(['sec', 'Sabotage']); sfx('horn');
  const tactic = await chooseTactic(plan, { title: `${r.emo} Les sbires ${dN(who)} !`, sub: `${esc(r.name)} envoie ses sbires saboter ton château. Ils fuient quand la moitié d’entre eux est K.O.`, noRansom: true });
  plan.tactic = tactic; const { R, enlisted } = await playInvasion(plan, tactic, report); plan.res = R;
  R.lines.forEach(l => report.push(l));
  const lines = []; applyNemRaid(plan, R, lines); lines.forEach(l => report.push(l));
  releaseFighters(enlisted); addLog(R.outcome === 'robbed' ? `Les sbires ${dN(who)} ont touché le Cœur.` : `Sabotage ${dN(who)} repoussé.`, R.outcome === 'robbed' ? 'bad' : 'good');
  renderAll(); sfx(R.outcome === 'robbed' ? 'bad' : 'chime');
  await banner(R.outcome === 'robbed' ? '🏴 Sabotage réussi…' : '🛡️ Sabotage repoussé !', esc(lines[0][1]), 2100);
}
function rivalNightSim(report) {
  if (!nemTonight()) return null;
  if (report.some(l => l[0] === '⚔️' && /^Invasion/.test(l[1]))) { nem().next = S.night + 1; return null; }
  const plan = nemRaidPlan(), R = resolveInvasion(plan, 'postes'); plan.res = R;
  const lines = []; applyNemRaid(plan, R, lines); lines.forEach(l => report.push(l));
  return R.outcome;
}

/* ---------- le blason du rival, en haut, et sa fiche ---------- */
function renderRivalChip() {
  if (!S || !S.started || typeof document === 'undefined' || !document.getElementById) return;
  const host = document.getElementById('clocks'); if (!host || !host.parentNode || !host.parentNode.insertBefore) return;
  let b = document.getElementById('rivalChip');
  if ((typeof VISIT !== 'undefined' && VISIT) || !nemActive()) { if (b && b.remove) b.remove(); return; }
  if (!b) { b = el('button', 'trival'); b.id = 'rivalChip'; b.type = 'button'; b.addEventListener('click', () => openRival()); host.parentNode.insertBefore(b, host.nextSibling); }
  const n = nem(), r = nemRival(), me = myPres(), share = Math.round(me / (me + n.pres) * 100), soon = n.next - S.night;
  b.className = 'trival' + (soon <= 1 ? ' alert' : '') + (share >= 50 ? ' ahead' : '');
  b.title = `Ton rival : ${r.name} (${nemName()}). Prestige : toi ${me}, lui ${Math.round(n.pres)}.${soon <= 1 ? ' Ses sbires attaquent cette nuit !' : ''}`;
  b.innerHTML = `<span class="rvemo">${r.emo}</span><span class="rvbar" aria-hidden="true"><i style="width:${share}%"></i></span>${soon <= 1 ? '<span class="rvwarn">⚔️</span>' : n.ch ? '<span class="rvwarn">📯</span>' : ''}`;
}
const renderHUDBase = renderHUD;
renderHUD = function () { renderHUDBase(); try { renderRivalChip(); } catch (e) { console.error(e); } };
function duelRow(label, a, b, hint) { const w = Math.round(a / Math.max(1, a + b) * 100); return `<div class="duel"><span class="dl">${label}</span><b class="num">${Math.round(a)}</b><span class="dbar"><i style="width:${w}%"></i></span><b class="num">${Math.round(b)}</b>${hint ? `<small>${hint}</small>` : ''}</div>`; }
function openRival() {
  if (!nemActive()) return;
  const n = nem(), r = nemRival(), who = nemName(), v = vicState(), soon = n.next - S.night, D = n.ch && DEFIS[n.ch.k];
  const mine = VICTORIES.map(x => vicPct(x.id)).reduce((a, b) => Math.max(a, b), 0);
  const site = world().sites.find(x => x.rival === r.id), canRaid = RAIDS['r_' + r.id] && raidKnown('r_' + r.id) && S.tier >= RAIDS['r_' + r.id].tier;
  const m = openModal(`<div class="cardhead"><div class="portrait rv">${r.emo}</div><div><h2>${esc(r.name)}</h2><p class="hint">Le donjon ${esc(deM(r.master))}, ton rival dans le Val. Il vise la ${esc(VIC_BY[raceGoal(r.id)].name.replace('Victoire', 'victoire'))}.</p></div></div>
    <div class="duels"><div class="duel head"><span></span><b>Toi</b><span></span><b>${esc(who)}</b></div>
      ${duelRow('Prestige', myPres(), n.pres, 'Ambiance, créatures, pièces et palier. S’il te dépasse, il te vole des créatures à l’aube.')}
      ${duelRow('Course à la victoire', mine, v.race[r.id] || 0, 'En %. S’il arrive à 100 avant toi, il devient Grand Maître du Val.')}
      ${duelRow('Sabotages repoussés', n.losses, n.wins, 'Ses sbires repoussés, contre ses coups réussis.')}
      ${duelRow('Défis', n.chWon, n.chLost, 'Défis relevés, contre défis perdus.')}</div>
    <h3>Ce qu’il prépare</h3><ul class="chron">
      <li class="${soon <= 1 ? 'bad' : ''}"><span class="emo">⚔️</span><span>${soon <= 0 ? 'Ses sbires attaquent <b>cette nuit</b>.' : soon === 1 ? 'Ses sbires attaquent <b>la nuit prochaine</b>.' : `Prochain sabotage : dans <b>${soon} nuits</b> (ses sbires bavardent dans les tavernes).`}</span></li>
      ${D ? `<li class="ev"><span class="emo">📯</span><span>Défi en cours : <b>${esc(D.t(n.ch.goal))}</b> d’ici la nuit ${n.ch.until} (tu en es à ${D.v()}).</span></li>` : ''}
      ${n.snatched ? `<li><span class="emo">🏴</span><span>Il t’a soufflé ${n.snatched} créature${n.snatched > 1 ? 's' : ''} qui venai${n.snatched > 1 ? 'ent' : 't'} chez toi.</span></li>` : ''}</ul>
    ${n.news.length ? `<h3>La gazette du Val</h3><ul class="chron">${n.news.slice(0, 4).map(([k, t]) => `<li><span class="emo">📰</span><span><small class="hint">Nuit ${k}</small> ${esc(t)}</span></li>`).join('')}</ul>` : ''}
    <p class="hint">Pour le faire reculer : repousse ses sbires, relève ses défis, et dès le Palier 1, pille sa tour (trois raids réussis et il devient ton vassal).</p>
    <div class="mfoot"><button class="sbtn" type="button" data-close>Fermer</button>${typeof openFactions === 'function' ? '<button class="sbtn" type="button" id="rvFac">📜 Factions</button>' : ''}${site ? '<button class="sbtn" type="button" id="rvMap">🗺️ Sur la carte</button>' : ''}<button class="sbtn pri" type="button" id="rvRaid" ${canRaid ? '' : 'disabled title="Palier 1 requis"'}>🏰 Expédition dans son donjon</button></div>`, { wide: true, label: 'Ton rival' });
  const q = s => m.querySelector(s);
  q('#rvRaid') && q('#rvRaid').addEventListener('click', () => { closeModal(true); openRaid('r_' + r.id); });
  q('#rvFac') && q('#rvFac').addEventListener('click', () => { closeModal(true); openFactions(); });
  q('#rvMap') && q('#rvMap').addEventListener('click', () => { closeModal(true); openWorld(site && site.id); });
}
function rivalNotifs(add) {
  if (!nemActive()) return;
  const n = nem(), soon = n.next - S.night, who = nemName();
  if (soon <= 0) add('nem', '🏴', `Les sbires ${dN(who)} attaquent cette nuit`, () => { openRival(); }, 6, 'bad');
  else if (soon === 1) add('nem', '🏴', `${who} prépare un sabotage pour demain`, openRival, 4, 'bad');
  if (n.ch) { const D = DEFIS[n.ch.k]; add('nemch', '📯', `Défi ${dN(who)} : ${D.t(n.ch.goal)} (${Math.max(0, n.ch.until - S.night)} nuit${n.ch.until - S.night > 1 ? 's' : ''})`, openRival, 3); }
}

/* ---------- le Grimoire et les conseils ---------- */
WIKI.rival = { cat: 'val', t: 'Ton rival', x: () => `<p>Dès la première nuit, un des donjons du Val devient ton rival attitré. Son blason, en haut de l’écran, montre qui mène : la barre se remplit de ton côté quand ton prestige dépasse le sien.</p>
  <ul><li><b>Prestige</b> : Ambiance + 2 par créature + 1 par pièce + 3 par palier. Le rival grandit en même temps que toi, un peu plus vite s’il gagne.</li>
  <li><b>Créatures volées</b> : s’il a nettement plus de prestige que toi, il attire parfois chez lui une créature qui venait vers ton château.</li>
  <li><b>Défis</b> : il te met régulièrement au défi (avoir tant de créatures, tant d’Ambiance…) avant une nuit donnée. Relevé : or, matériaux, et il recule dans la course à la victoire.</li>
  <li><b>Sabotages</b> : toutes les 8 à 12 nuits, ses sbires traversent ton château comme une bande d’aventuriers : quelques pièces, puis le Cœur ({c:invasion}). La rumeur te prévient la veille, et pas question d’acheter leur départ.</li>
  <li><b>Le faire reculer</b> : repousser ses sbires, relever ses défis, et dès le Palier 1, piller sa tour. Trois raids réussis et il devient ton vassal ; un autre rival prend alors sa place.</li></ul>` };
TIPS.push({ id: 'rival0', when: () => S.night >= 2 && !(S.tuto && S.tuto.on), t: 'Ton rival te surveille', x: 'Le blason en haut de l’écran, c’est ton rival : il te dispute les créatures, te lance des défis et enverra ses sbires. Touche-le pour voir qui mène.', wiki: 'rival' });
