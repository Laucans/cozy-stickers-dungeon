// Résume sim/results.json (produit par run.mjs) : un tableau par IA, puis les signaux d'équilibrage.
// Usage : node sim/report.mjs [results.json] [> RAPPORT.md]   ·   --json pour la version machine
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2), asJSON = args.includes('--json');
const file = args.find(a => !a.startsWith('--')) || path.join(HERE, 'results.json');
const R = JSON.parse(fs.readFileSync(file, 'utf8'));
const VIC = ['legende', 'terreur', 'voisinage', 'menagerie', 'secrets'];
const GOAL = { legende: 'legende', terreur: 'terreur', voisinage: 'voisinage', menagerie: 'menagerie', secrets: 'secrets' };
const BOTS = [...new Set(R.map(r => r.bot))];

const q = (xs, p) => { if (!xs.length) return null; const s = [...xs].sort((a, b) => a - b); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const mean = xs => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
const pct = (a, b) => b ? Math.round(100 * a / b) : 0;
const f1 = x => x == null ? '–' : (Math.round(x * 10) / 10).toString().replace('.', ',');
const dist = xs => xs.length ? `${q(xs, .5)} (${q(xs, .1)}–${q(xs, .9)})` : '–';

const out = {};
for (const bot of BOTS) {
  const G = R.filter(r => r.bot === bot), n = G.length, goal = GOAL[bot];
  const o = out[bot] = { n, errors: G.filter(r => r.err).length, firstError: (G.find(r => r.err) || {}).err || null };
  o.goal = goal || null;
  if (goal) { const w = G.filter(r => r.wins[goal]).map(r => r.wins[goal]); o.goalRate = pct(w.length, n); o.goalNight = dist(w); o.goalNights = w; }
  o.wins = Object.fromEntries(VIC.map(v => { const w = G.filter(r => r.wins[v]).map(r => r.wins[v]); return [v, { rate: pct(w.length, n), night: dist(w) }]; }));
  o.nights = dist(G.map(r => r.night));
  // ères : une ère = un rival a gagné avant toi
  const firstEra = G.filter(r => r.eras.length).map(r => r.eras[0][0]);
  o.eraGames = pct(firstEra.length, n); o.firstEra = dist(firstEra); o.erasPerGame = f1(mean(G.map(r => r.eras.length)));
  const champs = {}; G.forEach(r => r.eras.forEach(([, c]) => { champs[c] = (champs[c] || 0) + 1; })); o.champions = champs;
  // un rival gagne-t-il AVANT ta victoire visée ?
  if (goal) o.eraBeforeGoal = pct(G.filter(r => r.eras.length && (!r.wins[goal] || r.eras[0][0] < r.wins[goal])).length, n);
  // invasions
  const inv = G.reduce((a, r) => a + r.inv, 0);
  o.inv = { perGame: f1(inv / n), per10: f1(mean(G.map(r => r.inv / r.night * 10))), repelled: pct(G.reduce((a, r) => a + r.inv_repelled, 0), inv), lost: pct(G.reduce((a, r) => a + r.inv_lost, 0), inv), robbed: pct(G.reduce((a, r) => a + r.inv_robbed, 0), inv),
    rank: [1, 2, 3].map(k => pct(G.reduce((a, r) => a + (r.invRank[k] || 0), 0), inv)) };
  const raids = G.reduce((a, r) => a + r.raids, 0); o.raids = { perGame: f1(raids / n), win: pct(G.reduce((a, r) => a + r.raidsWon, 0), raids) };
  o.calamities = f1(mean(G.map(r => r.calamities))); o.deserted = f1(mean(G.map(r => r.deserted))); o.desertGames = pct(G.filter(r => r.deserted).length, n);
  o.wages = f1(mean(G.map(r => r.wages || 0))); o.unpaid = f1(mean(G.map(r => r.unpaid || 0)));
  o.quests = f1(mean(G.map(r => r.quests))); o.ach = f1(mean(G.map(r => r.ach))); o.expeditions = f1(mean(G.map(r => r.expeditions || 0)));
  o.tier = Object.fromEntries([1, 2, 3].map(t => { const w = G.filter(r => r.tierAt[t]).map(r => r.tierAt[t]); return [t, { rate: pct(w.length, n), night: dist(w) }]; }));
  o.floors = Object.fromEntries([1, 2, 3].map(t => { const w = G.filter(r => r.floorsAt[t]).map(r => r.floorsAt[t]); return [t, { rate: pct(w.length, n), night: dist(w) }]; }));
  const rare = G.filter(r => r.firstRare).map(r => r.firstRare); o.rare = { rate: pct(rare.length, n), night: dist(rare) };
  // diagnostics (IA v2) : invasions détaillées, notoriété, calamité, missions bloquées, palier 3, album
  const IL = G.flatMap(r => r.invLog || []);
  const oc = x => x[4][0] === 'l' ? 'lost' : x[3] >= x[2] ? 'repelled' : 'robbed';
  o.invDetail = [1, 2, 3].map(k => { const L = IL.filter(x => x[1] === k); return { rank: k, n: L.length, courage: f1(mean(L.map(x => x[2]))), dmg: f1(mean(L.map(x => x[3]))), repelled: pct(L.filter(x => oc(x) === 'repelled').length, L.length), robbed: pct(L.filter(x => oc(x) === 'robbed').length, L.length) }; });
  const CR = IL.filter(x => x[5]); o.crusade = { n: CR.length, courage: f1(mean(CR.map(x => x[2]))), dmg: f1(mean(CR.map(x => x[3]))), repelled: pct(CR.filter(x => oc(x) === 'repelled').length, CR.length) };
  o.hype = f1(mean(G.map(r => r.hype || 0))); o.calDelta = f1(mean(G.map(r => r.calDelta || 0)));
  const tally = xs => { const t = {}; xs.forEach(x => { t[x] = (t[x] || 0) + 1; }); return Object.entries(t).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(', ') || '–'; };
  o.stuck = tally(G.flatMap(r => r.stuck || [])); o.tierMiss = tally(G.flatMap(r => r.tierMiss || [])); o.missing = tally(G.flatMap(r => r.album_missing || []));
  o.end = Object.fromEntries(['glow', 'crit', 'album', 'arts', 'map', 'gold', 'mat', 'votes', 'vassals', 'legends', 'floors', 'size', 'tier'].map(k => [k, f1(mean(G.map(r => r[k] || 0)))]));
  // courbes : moyenne aux nuits 10, 20… (sur les parties encore en cours)
  o.curve = {};
  for (let t = 10; t <= 150; t += 10) {
    const C = G.map(r => r.curve[t]).filter(Boolean); if (!C.length) continue;
    o.curve[t] = { n: C.length, glow: f1(mean(C.map(c => c.glow))), crit: f1(mean(C.map(c => c.crit))), album: f1(mean(C.map(c => c.album))), gold: f1(mean(C.map(c => c.gold))), tier: f1(mean(C.map(c => c.tier))),
      vic: VIC.map((v, i) => f1(mean(C.map(c => c.vic[i])))), raceMax: f1(mean(C.map(c => Math.max(...Object.values(c.race))))), baron: f1(mean(C.map(c => c.race.baron || 0))), votes: f1(mean(C.map(c => c.votes))),
      arts: f1(mean(C.map(c => c.arts))), map: f1(mean(C.map(c => c.map))), legends: f1(mean(C.map(c => c.legends))) };
  }
}
if (asJSON) { console.log(JSON.stringify(out, null, 1)); process.exit(0); }

const L = [];
const NAMES = { idle: 'Inactive (ne fait rien)', negligent: 'Négligente (jamais de soins)', casual: 'Tranquille (bâtit, soigne)', legende: 'Légende', terreur: 'Terreur', voisinage: 'Bon voisinage', menagerie: 'Ménagerie', secrets: 'Secrets' };
const N0 = R.length, MAX = Math.max(...R.map(r => r.night));
L.push(`# Équilibrage — ${N0} parties simulées`, '', `${BOTS.length} IA × ${out[BOTS[0]].n} parties, ${MAX} nuits maximum (une partie s'arrête quand l'IA gagne la victoire qu'elle vise). Médiane (10e–90e centile) entre parenthèses.`, '');
L.push('## Victoire visée', '', '| IA | Parties | Victoire visée gagnée | Nuit de victoire | Un rival gagne une ère avant | Erreurs |', '|---|---|---|---|---|---|');
BOTS.forEach(b => { const o = out[b]; L.push(`| ${NAMES[b] || b} | ${o.n} | ${o.goal ? o.goalRate + ' %' : '–'} | ${o.goal ? o.goalNight : '–'} | ${o.goal ? o.eraBeforeGoal + ' %' : o.eraGames + ' %'} | ${o.errors} |`); });
L.push('', '## Toutes les victoires (taux · nuit)', '', '| IA | ' + VIC.join(' | ') + ' |', '|---|' + VIC.map(() => '---').join('|') + '|');
BOTS.forEach(b => L.push(`| ${NAMES[b] || b} | ` + VIC.map(v => out[b].wins[v].rate ? `${out[b].wins[v].rate} % · ${out[b].wins[v].night}` : '–').join(' | ') + ' |'));
L.push('', '## Rivaux et ères', '', '| IA | Parties avec une ère | 1re ère (nuit) | Ères / partie | Champions |', '|---|---|---|---|---|');
BOTS.forEach(b => { const o = out[b]; L.push(`| ${NAMES[b] || b} | ${o.eraGames} % | ${o.firstEra} | ${o.erasPerGame} | ${Object.entries(o.champions).map(([k, v]) => k + ' ' + v).join(', ') || '–'} |`); });
L.push('', '## Invasions et raids', '', '| IA | Invasions / partie | / 10 nuits | Repoussées | Perdues | Pillées | Rang 1/2/3 | Raids / partie | Raids réussis |', '|---|---|---|---|---|---|---|---|---|');
BOTS.forEach(b => { const o = out[b]; L.push(`| ${NAMES[b] || b} | ${o.inv.perGame} | ${o.inv.per10} | ${o.inv.repelled} % | ${o.inv.lost} % | ${o.inv.robbed} % | ${o.inv.rank.join(' / ')} % | ${o.raids.perGame} | ${o.raids.win} % |`); });
L.push('', '## Progression', '', '| IA | Palier 1 | Palier 2 | Palier 3 | 1er étage | 2e étage | 3e étage | 1re créature rare |', '|---|---|---|---|---|---|---|---|');
const cell = x => x.rate ? `${x.night}${x.rate < 100 ? ` · ${x.rate} %` : ''}` : '–';
BOTS.forEach(b => { const o = out[b]; L.push(`| ${NAMES[b] || b} | ${cell(o.tier[1])} | ${cell(o.tier[2])} | ${cell(o.tier[3])} | ${cell(o.floors[1])} | ${cell(o.floors[2])} | ${cell(o.floors[3])} | ${cell(o.rare)} |`); });
L.push('', '## Âmes du château', '', '| IA | Calamités / partie | Désertions / partie | Parties avec désertion | Envies comblées | Hauts faits | Expéditions | Salaires versés | Impayés |', '|---|---|---|---|---|---|---|---|---|');
BOTS.forEach(b => { const o = out[b]; L.push(`| ${NAMES[b] || b} | ${o.calamities} | ${o.deserted} | ${o.desertGames} % | ${o.quests} | ${o.ach} | ${o.expeditions} | ${o.wages} | ${o.unpaid} |`); });
L.push('', '## Fin de partie (moyennes)', '', '| IA | Rayonnement | Créatures | Album | Artefacts | Carte % | Or | Bois | Voix | Vassaux | Légendes | Étages | Remparts |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|');
BOTS.forEach(b => { const e = out[b].end; L.push(`| ${NAMES[b] || b} | ${e.glow} | ${e.crit} | ${e.album} | ${e.arts} | ${e.map} | ${e.gold} | ${e.mat} | ${e.votes} | ${e.vassals} | ${e.legends} | ${e.floors} | ${e.size} |`); });
L.push('', '## Courbes (moyenne des parties encore en cours)', '');
BOTS.forEach(b => {
  const o = out[b]; L.push(`### ${NAMES[b] || b}`, '', '| Nuit | Parties | Rayonnement | Créatures | Album | Or | Palier | ' + VIC.map(v => v + ' %').join(' | ') + ' | Rival en tête % | Baron % | Voix |', '|---|---|---|---|---|---|---|' + VIC.map(() => '---').join('|') + '|---|---|---|');
  Object.entries(o.curve).forEach(([t, c]) => L.push(`| ${t} | ${c.n} | ${c.glow} | ${c.crit} | ${c.album} | ${c.gold} | ${c.tier} | ${c.vic.join(' | ')} | ${c.raceMax} | ${c.baron} | ${c.votes} |`));
  L.push('');
});
if (R.some(r => r.invLog)) {
  L.push('## Diagnostics', '', '### Invasions par rang (courage des héros contre dégâts infligés)', '', '| IA | Rang 1 : n · courage · dégâts | Rang 2 | Rang 3 | Croisade : n · courage · dégâts · repoussées |', '|---|---|---|---|---|');
  const dc = d => d.n ? `${d.n} · ${d.courage} · ${d.dmg}` : '–';
  BOTS.forEach(b => { const o = out[b]; L.push(`| ${NAMES[b] || b} | ${o.invDetail.map(dc).join(' | ')} | ${o.crusade.n ? `${o.crusade.n} · ${o.crusade.courage} · ${o.crusade.dmg} · ${o.crusade.repelled} %` : '–'} |`); });
  L.push('', '### Économie de l\'âme et blocages', '', '| IA | Notoriété finale | Calamité / nuit (fin) | Missions bloquées > 20 nuits | Palier 3 : ce qui manque | Espèces jamais vues |', '|---|---|---|---|---|---|');
  BOTS.forEach(b => { const o = out[b]; L.push(`| ${NAMES[b] || b} | ${o.hype} | ${o.calDelta} | ${o.stuck} | ${o.tierMiss} | ${o.missing} |`); });
  L.push('');
}
if (BOTS.some(b => out[b].errors)) { L.push('## Erreurs', ''); BOTS.filter(b => out[b].errors).forEach(b => L.push(`- **${b}** (${out[b].errors}) : \`${out[b].firstError.split('\n')[0]}\``)); }
console.log(L.join('\n'));
