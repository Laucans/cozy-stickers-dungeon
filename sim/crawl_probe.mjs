// Équilibrage des expéditions en cartes : prend des châteaux simulés à différents moments de la partie,
// envoie les 4 meilleures créatures dans chaque donjon (rivaux, Forêt, Grotte), avec un joueur prudent et un joueur audacieux.
// Usage : node sim/crawl_probe.mjs [parties par IA = 3] [expéditions par château et par donjon = 40]
import { createGame } from './engine.mjs';
const N = +process.argv[2] || 3, M = +process.argv[3] || 40, BOTS = ['casual', 'terreur', 'menagerie', 'legende'], NIGHTS = [15, 30, 50, 80];
const g = createGame(), rows = [];
if (process.env.CRAWL_TUNE_JSON) g.run(`Object.assign(CRAWL_TUNE, ${process.env.CRAWL_TUNE_JSON})`);
if (process.env.CRAWL_JS) g.run(process.env.CRAWL_JS);   // pour essayer un réglage sans toucher au jeu (ex. CRAWL_JS="CRAWL_EN.krouk.hp = 60")
for (const bot of BOTS) for (let i = 0; i < N; i++) for (const night of NIGHTS) {
  const out = g.run(`(() => { simPlay(${JSON.stringify(bot)}, ${3000 + i * 7919}, ${night});
    const team = S.creatures.filter(c => !isOut(c) && !injured(c)).map(c => [c, crawler(c)]).sort((a, b) => (b[1].hp * b[1].atk) - (a[1].hp * a[1].atk)).slice(0, 4).map(x => x[0]);
    const res = {}; for (const dg of Object.keys(CRAWL_DG)) for (const [pol, pr] of [['prudent', .55], ['audacieux', .3]]) {
      const o = { boss: 0, wipe: 0, retreat: 0, fled: 0, deep: 0, g: 0 };
      for (let k = 0; k < ${M}; k++) { const R = crawlAuto(dg, team, { prudence: pr }); o[R.done]++; o.deep += (R.floor - 1) * CRAWL_STEPS + R.step; o.g += R.done === 'wipe' ? 0 : R.loot.g; }
      Object.keys(o).forEach(k => o[k] /= ${M}); res[dg + '|' + pol] = o; }
    return JSON.stringify({ lvl: crawlLevel(), night: S.night, tier: S.tier, crit: S.creatures.length, team: team.map(c => c.sp + (c.lvl || 1)).join(','), power: team.map(c => crawler(c)).reduce((a, p) => a + p.hp * p.atk, 0), res });
  })()`);
  rows.push({ bot, ...JSON.parse(out) });
}
const pct = x => (x * 100).toFixed(0) + ' %', avg = (l, f) => l.reduce((a, r) => a + f(r), 0) / Math.max(1, l.length);
console.log(`# Expéditions en donjon : ${rows.length} équipes, ${M} expéditions par équipe, par donjon et par style\n`);
for (const pol of ['prudent', 'audacieux']) {
  console.log(`\n## Joueur ${pol}\n\n| Moment | Équipes | Puissance | Boss vaincu | Équipe terrassée | Retraite | Fuite | Salles franchies | Or rapporté |\n|---|---|---|---|---|---|---|---|---|`);
  for (const n of NIGHTS) { const l = rows.filter(r => Math.abs(r.night - n) <= 2 || r.night === n); const all = l.flatMap(r => Object.entries(r.res).filter(([k]) => k.endsWith(pol)).map(([, v]) => v));
    console.log(`| Nuit ${n} (niv. ${avg(l, r => r.lvl).toFixed(1)}) | ${l.length} | ${avg(l, r => r.power).toFixed(0)} | ${pct(avg(all, v => v.boss))} | ${pct(avg(all, v => v.wipe))} | ${pct(avg(all, v => v.retreat))} | ${pct(avg(all, v => v.fled))} | ${avg(all, v => v.deep).toFixed(1)} | ${avg(all, v => v.g).toFixed(0)} |`); }
  console.log(`\n| Donjon | Boss vaincu | Terrassée | Retraite |\n|---|---|---|---|`);
  for (const dg of Object.keys(rows[0] ? Object.fromEntries(Object.keys(rows[0].res).map(k => [k.split('|')[0], 1])) : {})) { const all = rows.map(r => r.res[dg + '|' + pol]); console.log(`| ${dg} | ${pct(avg(all, v => v.boss))} | ${pct(avg(all, v => v.wipe))} | ${pct(avg(all, v => v.retreat))} |`); }
}
console.log('\nÉquipes (exemples) : ' + rows.filter((r, i) => i % 5 === 0).map(r => `n${r.night} ${r.team}`).join(' · '));
