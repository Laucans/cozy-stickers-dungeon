// Sonde les combats d'invasion : pour chaque invasion d'une partie simulée, rejoue le même combat
// K fois avec chaque tactique (et sans pouvoirs du Cœur) et mesure l'incertitude, le poids des décisions et le déroulé.
// Usage : node sim/combat_probe.mjs [parties par IA = 8] [K = 40]   (CSD_SRC=dossier pour une autre version)
import { createGame } from './engine.mjs';

const N = +process.argv[2] || 8, K = +process.argv[3] || 40;
const BOTS = ['casual', 'legende', 'terreur', 'menagerie', 'voisinage'];
const g = createGame();
g.run(`globalThis.PROBE = []; const __simInv = simInvasion;
simInvasion = function (plan) {
  const tactics = typeof TACTICS !== 'undefined' ? Object.keys(TACTICS).filter(t => t !== 'rancon') : ['postes'];
  const off = typeof noPower !== 'undefined' ? noPower : undefined;
  const mc = (t, pol) => { const o = { rob: 0, lost: 0, rounds: 0, fights: 0, final: 0, hurt: 0, ko: 0, left: 0, firstBreak: 0, specials: 0 };
    for (let i = 0; i < ${K}; i++) { const R = resolveInvasion(plan, t, pol), ev = R.ev;
      if (R.outcome === 'robbed') o.rob++; if (R.outcome === 'lost') o.lost++;
      o.rounds += ev.filter(e => e.k === 'round' && e.n > 0).length; o.fights += ev.filter(e => e.k === 'engage').length;
      o.final += ev.some(e => e.k === 'engage' && (e.final || e.heart)) ? 1 : 0; o.hurt += R.hurt.length; o.ko += R.fallen.length;
      o.specials += R.moments != null ? R.moments : ev.reduce((a, e) => a + (e.hits || []).filter(h => h.heal).length, 0) + ev.filter(e => e.k === 'disarm').length;
      const max = R.party.reduce((a, h) => a + h.max, 0); o.left += max ? R.party.reduce((a, h) => a + h.hp, 0) / max : 0;
      const fe = ev.findIndex(e => e.k === 'engage'), nx = fe >= 0 ? ev.slice(fe + 1).find(e => ['engage', 'repelled', 'robbed', 'lost'].includes(e.k)) : null; o.firstBreak += nx && nx.k === 'repelled' ? 1 : 0; }
    Object.keys(o).forEach(k => o[k] /= ${K}); return o; };
  const rec = { night: S.night, rank: plan.rank || 1, n: plan.party.length, hp: plan.courage, crit: S.creatures.length, goal: plan.goal ? plan.goal.k : 'coeur', t: {} };
  tactics.forEach(t => { rec.t[t] = mc(t); });
  if (off) rec.np = mc('postes', off);
  PROBE.push(rec);
  return __simInv(plan);
};`);
const recs = [];
BOTS.forEach((bot, b) => { for (let i = 0; i < N; i++) { g.run(`PROBE.length = 0; simPlay(${JSON.stringify(bot)}, ${2000 + i * 7919 + b}, 150)`); recs.push(...JSON.parse(g.run('JSON.stringify(PROBE)')).map(r => ({ ...r, bot }))); } });

const pct = x => (x * 100).toFixed(0) + ' %', avg = (a, f) => a.length ? a.reduce((s, r) => s + f(r), 0) / a.length : 0;
const tac = Object.keys(recs[0] ? recs[0].t : {});
const band = (list, f) => { const b = [0, 0, 0, 0]; list.forEach(r => { const p = f(r); b[p < .05 ? 0 : p < .3 ? 1 : p <= .7 ? 2 : 3]++; }); return b.map(x => pct(x / Math.max(1, list.length))); };
const groups = { 'Toutes': recs, 'Rang 1': recs.filter(r => r.rank === 1), 'Rang 2': recs.filter(r => r.rank === 2), 'Rang 3': recs.filter(r => r.rank === 3), 'Nuits 1-30': recs.filter(r => r.night <= 30), 'Nuits 31-80': recs.filter(r => r.night > 30 && r.night <= 80), 'Nuits 81+': recs.filter(r => r.night > 80) };
console.log(`# Sonde des combats d'invasion\n\n${recs.length} invasions (${BOTS.join(', ')} ; ${N} parties chacune), chaque combat rejoué ${K} fois par tactique.\n`);
console.log('## L’issue est-elle jouée d’avance ? (chance que la bande atteigne son but, tactique « tenir les postes »)\n');
console.log('| Groupe | Invasions | < 5 % (gagnée d’avance) | 5–30 % | 30–70 % (tendue) | > 70 % (perdue d’avance) |\n|---|---|---|---|---|---|');
Object.entries(groups).forEach(([k, l]) => { const b = band(l, r => r.t.postes.rob); console.log(`| ${k} | ${l.length} | ${b.join(' | ')} |`); });
console.log('\n## La tactique compte-t-elle ?\n');
if (tac.length > 1) {
  const best = r => tac.reduce((a, t) => r.t[t].rob < r.t[a].rob ? t : a, tac[0]), spread = r => Math.max(...tac.map(t => r.t[t].rob)) - Math.min(...tac.map(t => r.t[t].rob));
  console.log(`- Écart moyen de chance d’échec entre la meilleure et la pire tactique : ${pct(avg(recs, spread))}`);
  console.log(`- Invasions où le choix change la chance d’échec de plus de 15 points : ${pct(recs.filter(r => spread(r) > .15).length / Math.max(1, recs.length))}`);
  const close = recs.filter(r => spread(r) > .05);
  tac.forEach(t => console.log(`- « ${t} » : échec ${pct(avg(recs, r => r.t[t].rob))}, créatures sonnées ${avg(recs, r => r.t[t].hurt).toFixed(2)}, échanges ${avg(recs, r => r.t[t].rounds).toFixed(1)} ; la meilleure dans ${pct(close.filter(r => best(r) === t).length / Math.max(1, close.length))} des invasions où le choix compte`));
}
if (recs[0] && recs[0].np) console.log(`\n## Les pouvoirs du Cœur\n\n- Échec avec les pouvoirs (joués par le simulateur) : ${pct(avg(recs, r => r.t.postes.rob))} ; sans : ${pct(avg(recs, r => r.np.rob))}\n- Invasions où les pouvoirs changent la chance d’échec de plus de 15 points : ${pct(recs.filter(r => Math.abs(r.np.rob - r.t.postes.rob) > .15).length / Math.max(1, recs.length))}`);
console.log('\n## Le déroulé (tactique « tenir les postes »)\n');
const P = r => r.t.postes;
console.log(`- Combats par invasion : ${avg(recs, r => P(r).fights).toFixed(2)} ; échanges par invasion : ${avg(recs, r => P(r).rounds).toFixed(2)} ; échanges par combat : ${(avg(recs, r => P(r).rounds) / Math.max(.01, avg(recs, r => P(r).fights))).toFixed(2)}`);
console.log(`- Invasions qui vont jusqu’au combat décisif (leur cible) : ${pct(avg(recs, r => P(r).final))} ; la bande fuit dès le premier combat : ${pct(avg(recs, r => P(r).firstBreak))}`);
console.log(`- PV restants à la bande en fin d’invasion : ${pct(avg(recs, r => P(r).left))} ; héros K.O. : ${avg(recs, r => P(r).ko).toFixed(2)} ; créatures sonnées : ${avg(recs, r => P(r).hurt).toFixed(2)}`);
console.log(`- Coups d’éclat (talents, soins, désamorçages…) par invasion : ${avg(recs, r => P(r).specials).toFixed(2)}`);
console.log(`- Taille de la bande : ${avg(recs, r => r.n).toFixed(1)} héros ; créatures au château : ${avg(recs, r => r.crit).toFixed(1)}`);
const goals = [...new Set(recs.map(r => r.goal))];
if (goals.length > 1) { console.log('\n## Selon le but de la bande\n\n| But | Part | Échec (postes) | Meilleure tactique (en moyenne) |\n|---|---|---|---|'); goals.forEach(k => { const l = recs.filter(r => r.goal === k); const bt = tac.reduce((a, t) => avg(l, r => r.t[t].rob) < avg(l, r => r.t[a].rob) ? t : a, tac[0]); console.log(`| ${k} | ${pct(l.length / recs.length)} | ${pct(avg(l, r => P(r).rob))} | ${bt} (${pct(avg(l, r => r.t[bt].rob))}) |`); }); }
console.log('\n## Par phase de jeu\n\n| Groupe | Échec | Combats | Échanges | Jusqu’au combat décisif | Fuite au 1er combat | PV restants |\n|---|---|---|---|---|---|---|');
Object.entries(groups).forEach(([k, l]) => console.log(`| ${k} | ${pct(avg(l, r => P(r).rob))} | ${avg(l, r => P(r).fights).toFixed(1)} | ${avg(l, r => P(r).rounds).toFixed(1)} | ${pct(avg(l, r => P(r).final))} | ${pct(avg(l, r => P(r).firstBreak))} | ${pct(avg(l, r => P(r).left))} |`));
