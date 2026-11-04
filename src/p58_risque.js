/* =========================================================
   Du risque : des choix qui peuvent mal tourner
   - Les cibles de raid deviennent vigilantes : piller toujours
     le même endroit coûte un dé par raid (elles oublient une
     nuit sur trois). Un succès partiel ne rapporte que les
     trois quarts et peut renvoyer un·e blessé·e ; un échec en
     approche risquée peut laisser quelqu'un aux mains des
     villageois (rançon ou évasion), toujours en désespérée.
   - Une envie qui attend pèse de plus en plus lourd, et une
     créature au bout du rouleau part vivre sa vie, même sans
     rival pour l'accueillir.
   ========================================================= */
const RAID_VIG_MAX = 4;
const raidVig = k => ((S.world && S.world.vig) || {})[k] || 0;
// la réserve de dés : la vigilance de la cible
const raidBreakdownVig = raidBreakdown;
raidBreakdown = function (targetId, teamIds) {
  const b = raidBreakdownVig(targetId, teamIds), v = raidVig(targetId);
  if (v) { b.pool -= v; b.rows.push([`Cible sur ses gardes (vigilance ${v})`, -v]); }
  return b;
};
const applyRaidRisk = applyRaid;
applyRaid = function (roll) {
  const k = S.raid && S.raid.target, app = (S.raid && S.raid.app) || 'risquee', team = S.raid ? S.raid.team.map(critter).filter(Boolean) : [];
  const g0 = S.gold, s0 = S.mat, lines = applyRaidRisk(roll);
  if (k && S.world) { S.world.vig = S.world.vig || {}; S.world.vig[k] = Math.min(RAID_VIG_MAX, (S.world.vig[k] || 0) + 1); }
  // un succès partiel : on file avec ce qu'on peut porter, et parfois avec un·e blessé·e
  if (roll.res === 'partial') {
    const cg = Math.floor(Math.max(0, S.gold - g0) * .25), cs = Math.floor(Math.max(0, S.mat - s0) * .25); S.gold -= cg; S.mat -= cs;
    if (cg || cs) lines.push(['🏃', `Il a fallu filer en vitesse : −${cg} 💰, −${cs} 🪵 laissés sur place.`, 'bad']);
    if (app !== 'prudente' && Math.random() < .35) { const c = pick(team); if (c) { c.hurt = Math.max(c.hurt || 0, S.night + 2); lines.push(['🤕', `${c.name} rentre blessé·e : 2 nuits au repos.`, 'bad']); } }
  }
  // un échec : quelqu'un peut rester aux mains des villageois
  if (roll.res === 'fail' && app !== 'prudente' && team.length && (app === 'desesperee' || Math.random() < .5)) {
    const c = pick(team); c.captive = S.night + 4; c.post = null;
    lines.push(['🪤', `${c.name} est pris·e par les villageois ! Rançon de ${captiveRansom(c)} 💰 (sa fiche), ou évasion dans 4 nuits.`, 'bad']);
    addLog(`${c.name} est retenu·e au village.`, 'bad');
  }
  return lines;
};
// la vigilance retombe : une nuit sur trois, chaque cible oublie un peu
const fatigueDawnVig = fatigueDawn;
fatigueDawn = function (...a) { const r = fatigueDawnVig(...a); if (S.world && S.world.vig && S.night % 3 === 0) Object.keys(S.world.vig).forEach(k => { S.world.vig[k]--; if (S.world.vig[k] <= 0) delete S.world.vig[k]; }); return r; };

/* ---------- les âmes : l'attention compte ---------- */
// une envie qui attend pèse de plus en plus lourd (au lieu d'un petit −4 au bout de 8 nuits)
const epaFactorsRisk = epaFactors;
epaFactors = function (c, hungry) {
  const r = epaFactorsRisk(c, hungry), q = c.quest && c.quest.st === 'active' ? c.quest : null;
  const i = r.f.findIndex(x => x[0] === 'Son envie attend depuis longtemps'); if (i >= 0) r.f.splice(i, 1);
  if (q) { const n = S.night - (q.n || S.night), pen = Math.min(30, Math.max(0, n - 4) * 3); if (pen) r.f.push([`Son envie attend depuis ${n} nuits`, -pen]); }
  r.target = clamp(r.f.reduce((a, x) => a + x[1], 0), 0, 100);
  return r;
};
// au bout du rouleau (loyauté sous 20) : elle part vivre sa vie, même sans rival qui l'attire
const soulsDawnRisk = soulsDawn;
soulsDawn = function (report) {
  const r = soulsDawnRisk(report);
  if (S.night >= 8 && !(S.tuto && S.tuto.on) && typeof desertMod === 'function' && desertMod() > 0) {
    const gone = S.creatures.filter(c => !isOut(c) && c.sp !== 'diablotin' && !c.legend && (c.loy == null ? 50 : c.loy) < 20 && S.night - (c.joined || 1) >= 6 && Math.random() < .2 * desertMod());
    gone.slice(0, 1).forEach(c => { S.creatures = S.creatures.filter(x => x !== c); report.push(['🧳', `${c.name} (${SPECIES[c.sp].name}) se sentait délaissé·e depuis trop longtemps : il·elle part vivre sa vie.`, 'bad']); addLog(`${c.name} est parti·e (délaissé·e).`, 'bad'); S.stats.deserted = (S.stats.deserted || 0) + 1; });
  }
  return r;
};
WIKI.risques = { cat: 'danger', t: 'Risques et conséquences', x: () => `<ul><li><b>Vigilance des cibles</b> : chaque raid sur un même lieu le met sur ses gardes (−1 dé par raid, ${RAID_VIG_MAX} au plus) ; il oublie un peu une nuit sur trois. Varie tes cibles.</li>
  <li><b>Six dés au plus</b> : on ne lance jamais plus de ${RAID_DICE_MAX} dés. Une grosse réserve garde son utilité (elle compense la vigilance et les cibles bien gardées), mais le 6 n’est jamais garanti.</li>
  <li><b>Succès partiel</b> : on file avec les trois quarts du butin, et parfois un·e blessé·e (2 nuits au repos).</li>
  <li><b>Échec</b> : en approche risquée, une fois sur deux, quelqu’un reste aux mains des villageois ; en désespérée, toujours. Rançon dans sa fiche, ou évasion au bout de 4 nuits. L’approche prudente ne risque rien.</li>
  <li><b>L’attention</b> : une envie qui attend fait baisser l’épanouissement de plus en plus (jusqu’à −30), donc la loyauté. Sous 20 de loyauté, une créature finit par partir vivre sa vie.</li></ul>` };
