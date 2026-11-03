
/* =========================================================
   Raids à la Forged in the Dark : on choisit son approche
   (prudente, risquée, désespérée), et au moment de lancer les
   dés on peut pousser l'équipe (+1 dé, de la fatigue) ou
   accepter un pacte du diable (+1 dé, un prix annoncé).
   Trop de fatigue laisse une cicatrice : un trait pour la vie.
   ========================================================= */
const RAID_APPS = {
  prudente:   { ico: '🤫', name: 'Prudente', desc: 'Butin réduit (−40 %), mais un échec ne coûte rien : pas de Menace, personne ne boude.' },
  risquee:    { ico: '🎲', name: 'Risquée', desc: 'Le raid classique : butin normal, risques normaux.' },
  desesperee: { ico: '🔥', name: 'Désespérée', desc: 'Butin +50 % et +1 XP pour l’équipe… mais un échec renvoie quelqu’un sonné et affole le village. +1 fatigue.' },
};
const BARGAINS = [
  { t: '+2 Calamité', run: () => { S.calamity += 2; return '+2 Calamité.'; } },
  { t: '+1 Menace (on a laissé des traces)', run: () => { S.menace += 1; return '+1 Menace.'; } },
  { t: 'un·e membre de l’équipe rentrera sonné·e', run: team => { const c = pick(team); if (!c) return ''; c.hurt = Math.max(c.hurt || 0, S.night + 2); return `${c.name} rentrera sonné·e.`; } },
  { t: 'ton rival gagne 3 de prestige (il a tout vu)', run: () => { if (typeof nem === 'function' && S.nem) nem().pres += 3; return 'ton rival gagne 3 de prestige.'; } },
  { t: '4 💰 de pots-de-vin', run: () => { const g = Math.min(S.gold, 4); S.gold -= g; return `−${g} 💰.`; } },
  { t: 'le village le plus proche t’en veut (−8 bonne volonté)', run: () => { const s = typeof settlements === 'function' ? settlements().filter(siteKnown).sort((a, b) => hdist(a.q, a.r) - hdist(b.q, b.r))[0] : null; if (s) addGw(s, -8); return s ? `${s.name} : −8 bonne volonté.` : ''; } },
];
// la fatigue (0 à 6) : pousser coûte 2, une approche désespérée 1 ; on récupère 1 par nuit de repos
const FAT_MAX = 6, FAT_TIRED = 4;
const SCARS = {
  froussard:   { ico: '😰', name: 'Froussard·e', desc: '−1 en attaque au combat, mais +1 dé dans les raids de ruse : il·elle sait filer.' },
  tetebrulee:  { ico: '🔥', name: 'Tête brûlée', desc: '+1 dé dans tous les raids, mais −1 ❤️ de plus quand un raid échoue.' },
  rancunier:   { ico: '😤', name: 'Rancunier·e', desc: '+1 en attaque au combat : il·elle n’a rien oublié.' },
  insomniaque: { ico: '👁️', name: 'Insomniaque', desc: '+2 PV au combat (toujours aux aguets), mais récupère la fatigue deux fois moins vite.' },
};
const scarsOf = c => c.scars || [];
function addFat(c, n, lines) {
  if (!c) return;
  c.fat = Math.min(FAT_MAX, (c.fat || 0) + n); c.fatAt = S.night;
  if (c.fat >= FAT_MAX && scarsOf(c).length < 2) {
    const k = pick(Object.keys(SCARS).filter(x => !scarsOf(c).includes(x))); c.scars = [...scarsOf(c), k]; c.fat = 3;
    const t = `${c.name}, à bout de forces, en garde une cicatrice : ${SCARS[k].ico} ${SCARS[k].name} (${SCARS[k].desc})`;
    if (lines) lines.push(['🩹', t, 'bad']); else toast('🩹 ' + t); addLog(t, 'bad');
  }
}
// à l'aube : on souffle un peu (sauf si on s'est fatigué cette nuit)
function fatigueDawn() { S.creatures.forEach(c => { if (!c.fat || c.fatAt === S.night - 1) return; const rest = scarsOf(c).includes('insomniaque') ? (S.night % 2 ? 1 : 0) : 1; c.fat = Math.max(0, c.fat - rest); }); }

// la réserve de dés tient compte de la fatigue et des cicatrices
const raidBreakdownBase = raidBreakdown;
raidBreakdown = function (targetId, teamIds) {
  const b = raidBreakdownBase(targetId, teamIds), tg = RAIDS[targetId];
  teamIds.map(critter).filter(Boolean).forEach(c => {
    if ((c.fat || 0) >= FAT_TIRED) { b.pool -= 1; b.rows.push([`${c.name} épuisé·e`, -1]); }
    if (scarsOf(c).includes('tetebrulee')) { b.pool += 1; b.rows.push([`${c.name}, tête brûlée`, 1]); }
    if (scarsOf(c).includes('froussard') && tg && tg.tag === 'ruse') { b.pool += 1; b.rows.push([`${c.name} sait filer`, 1]); }
  });
  return b;
};
// et le combat aussi
const fighterOfBase = fighterOf;
fighterOf = function (c, bonus) {
  const f = fighterOfBase(c, bonus), sc = scarsOf(c);
  if (sc.includes('froussard')) f.atk = Math.max(1, f.atk - 1);
  if (sc.includes('rancunier')) f.atk += 1;
  if (sc.includes('insomniaque')) { f.hp += 2; f.max += 2; }
  if ((c.fat || 0) >= FAT_TIRED) { f.hp = Math.max(1, f.hp - 2); f.max = Math.max(1, f.max - 2); }
  return f;
};

// l'approche change ce que rapporte (ou coûte) le raid
const raidPlanCmd = CMD.raidPlan;
CMD.raidPlan = function (a) { const err = raidPlanCmd.call(this, a); if (!err && S.raid) S.raid.app = RAID_APPS[a.app] ? a.app : 'risquee'; return err; };
const applyRaidApp = applyRaid;
applyRaid = function (roll) {
  const app = (S.raid && S.raid.app) || 'risquee', team = S.raid ? S.raid.team.map(critter).filter(Boolean) : [];
  const g0 = S.gold, s0 = S.mat, men0 = S.menace, moods = team.map(c => c.mood);
  const lines = applyRaidApp(roll);
  if (app === 'prudente') {
    if (roll.res === 'fail') { S.menace = men0; team.forEach((c, i) => { c.mood = moods[i]; }); lines.push(['🤫', 'Approche prudente : ils se replient sans se faire voir. Ni Menace, ni bouderie.', 'good']); }
    else { const cg = Math.floor(Math.max(0, S.gold - g0) * .4), cs = Math.floor(Math.max(0, S.mat - s0) * .4); S.gold -= cg; S.mat -= cs; if (cg || cs) lines.push(['🤫', `Approche prudente : on n’a pas tout pris (−${cg} 💰, −${cs} 🪵).`, '']); }
  }
  if (app === 'desesperee') {
    team.forEach(c => addFat(c, 1, lines));
    if (roll.res === 'fail') { const c = pick(team); if (c) c.hurt = Math.max(c.hurt || 0, S.night + 2); S.menace += 1; lines.push(['🔥', `Approche désespérée : ${c ? c.name + ' rentre sonné·e, et ' : ''}le village est en émoi (+1 Menace).`, 'bad']); }
    else { const bg = Math.ceil(Math.max(0, S.gold - g0) * .5), bs = Math.ceil(Math.max(0, S.mat - s0) * .5); S.gold += bg; S.mat += bs; team.forEach(c => gainXP(c, 1, lines)); lines.push(['🔥', `Approche désespérée : butin +50 % (+${bg} 💰, +${bs} 🪵) et +1 XP pour l’équipe.`, 'good']); }
  }
  if (roll.res === 'fail') team.forEach(c => { if (scarsOf(c).includes('tetebrulee')) c.mood = clamp(c.mood - 1, 0, 5); });
  return lines;
};

/* ---------- le lancer : pousser, ou signer un pacte ---------- */
runRaid = async function (report) {
  const tg = RAIDS[S.raid.target], team = S.raid.team.map(critter).filter(Boolean);
  if (!team.length) { S.raid = null; return; }
  const app = RAID_APPS[S.raid.app || 'risquee'], b = raidBreakdown(S.raid.target, S.raid.team), deal = pick(BARGAINS);
  let push = false, bargain = false;
  const pool = () => b.pool + (push ? 1 : 0) + (bargain ? 1 : 0), canPush = team.some(c => (c.fat || 0) < FAT_MAX);
  const m = openModal(`<h2>${tg.emo} Raid : ${esc(tg.name)}</h2><div class="team">${team.map(c => imgThumb('char', c.sp)).join('')}</div>
    <p>${team.map(c => esc(c.name)).join(', ')} ${team.length > 1 ? 'se faufilent' : 'se faufile'} dans la nuit. Approche ${app.ico} <b>${esc(app.name.toLowerCase())}</b>.</p>
    <div class="raidx"><button type="button" class="choice rx" id="rPush" aria-pressed="false" ${canPush ? '' : 'disabled'}><b>💪 Pousser l’équipe</b><span>+1 🎲, chacun prend 2 de fatigue${team.some(c => (c.fat || 0) >= FAT_MAX - 2) ? ' (attention : à 6, une cicatrice)' : ''}.</span></button>
      <button type="button" class="choice rx" id="rDeal" aria-pressed="false"><b>😈 Pacte du diable</b><span>+1 🎲, mais ${esc(deal.t)}.</span></button></div>
    <p class="odds" id="rOdds"></p><div class="dice" id="rDice"></div><div id="rOut"></div>
    <div class="mfoot"><button class="sbtn pri" type="button" id="rRoll" data-focus>🎲 Lancer les dés</button></div>`, { noClose: true, label: 'Raid' });
  const q = s => m.querySelector(s);
  const show = () => { const n = pool() <= 0 ? 2 : pool(); q('#rOdds').textContent = oddsText(pool()); q('#rDice').innerHTML = Array.from({ length: n }, () => '<div class="die">?</div>').join(''); q('#rPush').setAttribute('aria-pressed', push); q('#rDeal').setAttribute('aria-pressed', bargain); };
  show();
  q('#rPush').addEventListener('click', () => { push = !push; sfx('tick'); show(); });
  q('#rDeal').addEventListener('click', () => { bargain = !bargain; sfx('tick'); show(); });
  const btn = q('#rRoll');
  await new Promise(res => btn.addEventListener('click', res, { once: true }));
  btn.disabled = true; q('#rPush').disabled = true; q('#rDeal').disabled = true;
  const roll = rollPool(pool()), dice = [...m.querySelectorAll('.die')];
  dice.forEach(d => d.classList.add('roll')); sfx('dice');
  for (let i = 0; i < 12; i++) { dice.forEach(d => d.textContent = 1 + rnd(6)); await sleep(70); }
  dice.forEach((d, i) => { d.classList.remove('roll'); d.textContent = roll.dice[i]; if (roll.dice[i] === 6) d.classList.add('six'); });
  const bi = roll.dice.indexOf(roll.best); if (dice[bi]) dice[bi].classList.add('best');
  const titles = { crit: '✨ Critique !', full: '🎉 Succès total !', partial: '😬 Succès… avec une complication', fail: '💨 Échec' };
  const pre = [];
  if (push) { team.forEach(c => addFat(c, 2, pre)); pre.unshift(['💪', `L’équipe s’est poussée (+1 🎲) : 2 de fatigue chacun.`, '']); }
  if (bargain) { const t = deal.run(team); pre.push(['😈', `Pacte du diable (+1 🎲) : ${t}`, 'bad']); }
  const lines = [...pre, ...applyRaid(roll)]; sfx(roll.res === 'fail' ? 'bad' : 'chime');
  report.push([tg.emo, `${titles[roll.res]} (${roll.dice.join(', ')}) à ${tg.name}.`, roll.res === 'fail' ? 'bad' : 'good']); lines.forEach(l => report.push(l));
  addLog(`Raid ${tg.name} : ${titles[roll.res].replace(/^\S+ /, '')}`, roll.res === 'fail' ? 'bad' : 'good');
  q('#rOut').innerHTML = `<p class="outcome">${titles[roll.res]}</p><ul class="chron">${lines.map(([e, t, tone]) => `<li class="${tone}"><span class="emo">${e}</span><span>${esc(t)}</span></li>`).join('')}</ul>`;
  btn.disabled = false; btn.textContent = 'Continuer'; renderHUD();
  await new Promise(res => btn.addEventListener('click', res, { once: true }));
  closeModal(true);
};
// pour le simulateur : un joueur pousse quand la réserve est maigre, signe un pacte quand elle est désespérée
function simRaidExtras(b, team, lines) {
  let extra = 0;
  if (b.pool <= 2 && team.every(c => (c.fat || 0) <= FAT_MAX - 3)) { team.forEach(c => addFat(c, 2, lines)); extra++; }
  if (b.pool + extra <= 1) { const d = pick(BARGAINS); d.run(team); extra++; }
  return extra;
}

/* ---------- la fiche, les stickers, l'aube ---------- */
STATUS.fatigue = { ch: '😮‍💨', bg: '#8a7a5a', tip: 'Épuisé·e : −1 dé en raid et −2 PV au combat' };
const statusOfFat = statusOf;
statusOf = function (c) { const l = statusOfFat(c); if (c && (c.fat || 0) >= FAT_TIRED && !isOut(c)) l.splice(Math.min(l.length, 3), 0, 'fatigue'); return l; };
const openCreatureFat = openCreature;
openCreature = function (id) {
  const r = openCreatureFat(id), c = critter(id), m = c && document.querySelector && document.querySelector('#modalRoot .modal'), kv = m && m.querySelector('dl.kv');
  if (kv) kv.insertAdjacentHTML('beforeend', `<dt>Fatigue</dt><dd>${bar((c.fat || 0) / FAT_MAX * 100, (c.fat || 0) >= FAT_TIRED ? '#d9542f' : '#c9a24a', 'Fatigue')} <span class="num">${c.fat || 0}/${FAT_MAX}</span>${(c.fat || 0) >= FAT_TIRED ? ' <span class="no">épuisé·e</span>' : ''}<br><span class="hint">Pousser (+1 dé en raid) coûte 2 ; on récupère 1 par nuit de repos. À ${FAT_MAX}, une cicatrice.</span></dd>${scarsOf(c).length ? `<dt>Cicatrices</dt><dd>${scarsOf(c).map(k => `${SCARS[k].ico} <b>${esc(SCARS[k].name)}</b> : ${esc(SCARS[k].desc)}`).join('<br>')}</dd>` : ''}`);
  return r;
};
WIKI.raids2 = { cat: 'danger', t: 'Approches, pacte et fatigue', x: () => `<p>Trois décisions rendent un raid plus tendu :</p><ul>
  <li><b>L’approche</b>, en le planifiant : ${Object.values(RAID_APPS).map(a => `${a.ico} <b>${esc(a.name)}</b> (${esc(a.desc)})`).join(' ; ')}.</li>
  <li><b>Pousser l’équipe</b>, au moment de lancer : +1 dé, mais 2 de fatigue chacun. À ${FAT_TIRED} de fatigue, une créature est épuisée (−1 dé, −2 PV au combat). Elle récupère 1 par nuit de repos.</li>
  <li><b>Le pacte du diable</b>, au moment de lancer : +1 dé, contre un prix annoncé d’avance (Calamité, Menace, une créature sonnée, du prestige pour ton rival…). Il se paie quel que soit le résultat.</li>
  <li><b>Les cicatrices</b> : une créature qui atteint ${FAT_MAX} de fatigue en garde une pour la vie (deux au plus) : ${Object.values(SCARS).map(s => `${s.ico} ${esc(s.name)}`).join(', ')}. Rien de grave, mais elle change.</li></ul>` };
