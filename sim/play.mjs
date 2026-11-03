// Joue une partie pas à pas en ligne de commande (pour une IA comme Sonnet, ou pour toi).
//   node sim/play.mjs new  partie.json [graine] [thème]   → nouvelle partie
//   node sim/play.mjs state partie.json                     → état détaillé
//   node sim/play.mjs do   partie.json "build dortoir; furnish all; raid ferme"
//   node sim/play.mjs night partie.json [n]                → joue n nuits (soins et missions automatiques)
//   node sim/play.mjs help
import fs from 'node:fs';
import { createGame } from './engine.mjs';

const [cmd, file, ...rest] = process.argv.slice(2);
const HELP = `Actions (séparées par des points-virgules) :
  build <pièce> [étage]     construit une pièce là où elle tient (étage : 0, -1, -2, 1, 2)
  furnish <pièce|all> [or]  meuble les pièces de ce type (ou toutes) avec ce qui est utile, sans dépasser [or] si précisé
  decor <objet>             colle une déco (achetée si elle n'est pas en réserve) ou un artefact trouvé
  traps [budget]            pose des pièges sur le chemin des héros
  posts                     poste chaque créature dans sa pièce préférée
  raid <cible>              prépare un raid (équipe automatique) ; cibles : voir « Raids possibles »
  expe <lieu>               expédition de 2 créatures vers un lieu (id du lieu connu)
  scout                     envoie un éclaireur au bord du brouillard
  shop <lieu> <objet> [arg] achète en ville : rumeur, humeur, fidelite, tisane, oubli, tournee, merco, dossier, avis, carte, tresor, don, deco <clé>, artefact <clé>, rachat <clé>, recrue <espèce>
  request <id>              accomplit une requête de village (payer ou envoyer quelqu'un)
  tier | expand | foret     monte de palier | agrandit les remparts | rachète une parcelle de forêt (Jardins)
  (étage 9 = les Jardins, dehors : build poulailler 9)
  floorup | floordown       escalier vers le haut | vers le bas
  project parade|rituel     lance la finale de la Ménagerie ou des Secrets
  power brume|festin|rappel utilise un pouvoir de haut fait
  care | quests             pouvoirs (brume, festin, cloche) | envies et rêves connus : s'en occupe (et laisse partir à l'aventure)
  stock <lieu>              montre ce que vend un lieu
  (commande à part) node sim/play.mjs wiki [article]  → règles du jeu (le Grimoire en jeu)
Chaque nuit lancée avec « night » fait d'abord « care » et « quests » (et rappelle les gardes si des héros arrivent).`;
if (!cmd || cmd === 'help') { console.log(HELP); process.exit(0); }
const g = createGame();
if (cmd === 'wiki') {   // le Grimoire du jeu, en texte brut
  const key = file; g.ctx.__KEY = key || '';
  const W = JSON.parse(g.run(`JSON.stringify(Object.fromEntries(Object.entries(WIKI).map(([k, w]) => [k, { cat: w.cat, t: w.t, x: k === __KEY ? w.x() : '' }])))`));
  if (!key || !W[key]) { console.log((key ? `Article inconnu : ${key}\n\n` : '') + 'Articles :\n' + Object.entries(W).map(([k, w]) => `  ${k} — ${w.t}`).join('\n')); process.exit(0); }
  const txt = W[key].x.replace(/\{c:([\w-]+)\|([^}]+)\}/g, '$2 [wiki $1]').replace(/\{c:([\w-]+)\}/g, (m, k) => `${W[k] ? W[k].t : k} [wiki ${k}]`).replace(/\{\w+:[^|}]*\|([^}]+)\}/g, '$1').replace(/\{\w+:([\w-]+)\}/g, '$1').replace(/<li>/g, '\n • ').replace(/<\/p>|<br>|<\/h\d>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\n{3,}/g, '\n\n');
  console.log(`# ${W[key].t}\n\n${txt.trim()}`); process.exit(0);
}
const load = () => { const d = JSON.parse(fs.readFileSync(file, 'utf8')); g.ctx.__SAVE = d; g.run(`Math.random = mulberry32(__SAVE.seed + __SAVE.S.night * 1000 + (__SAVE.calls || 0)); S = upgradeState(__SAVE.S); SIM.m = __SAVE.m; Z = 0; WORLD = null; dirty(); world();`); return d; };
const store = d => { d.S = JSON.parse(g.run('JSON.stringify(S)')); d.m = JSON.parse(g.run('JSON.stringify(SIM.m)')); d.calls = (d.calls || 0) + 1; fs.writeFileSync(file, JSON.stringify(d)); };

const FURN_KEYS = JSON.parse(g.run('JSON.stringify(Object.keys(FURN))'));
function act(line) {
  const [a, ...args] = line.trim().split(/\s+/); if (!a) return '';
  const q = JSON.stringify, z = args[1] != null ? +args[1] : 0;
  const run = e => { try { const r = g.run(e); return r == null ? 'ok' : (typeof r === 'object' ? JSON.stringify(r) : String(r)); } catch (err) { return 'erreur : ' + err.message; } };
  switch (a) {
    case 'build': return run(`A.build(${q(args[0])}, ${z}) || 'ok'`);
    case 'furnish': { const cap = args[1] != null ? +args[1] : null, budget = cap == null ? 'S.gold' : `Math.max(0, S.gold - (${cap} - spent))`;
      return run(`(() => { let spent = 0, n = 0; const g0 = S.gold; for (const r of S.rooms.filter(r => r.built && ROOMS[r.t].furn && (${q(args[0])} === 'all' || r.t === ${q(args[0])}))) { if (${cap == null ? 'false' : `g0 - S.gold >= ${cap}`}) break; n += A.furnish(r, ${cap == null ? 'S.gold' : `Math.max(0, ${cap} - (g0 - S.gold))`}); } return n + ' meubles posés (' + (g0 - S.gold) + ' or dépensé)' + (n ? '' : ROOMS[${q(args[0])}] && !ROOMS[${q(args[0])}].furn ? ' : cette pièce est livrée meublée' : ''); })()`); }
    case 'decor': return FURN_KEYS.includes(args[0]) ? run(`A.decorate(${q(args[0])}, 99) || 'ok'`) : `objet inconnu : ${args[0]} (une clé de déco, par exemple torche, plante, toile, tableau)`;
    case 'traps': return run(`A.traps(${+args[0] || 20}) + ' pièges posés'`);
    case 'posts': return run(`A.posts(), 'ok'`);
    case 'raid': return run(`A.raid(${q(args[0])}) || 'raid prévu : ' + S.raid.team.map(id => critter(id).name).join(', ') + ' (' + raidBreakdown(S.raid.target, S.raid.team).pool + ' dés)'`);
    case 'expe': return run(`A.expedition(${q(args[0])}) || 'expédition partie'`);
    case 'scout': return run(`A.scout() || 'éclaireur parti'`);
    case 'shop': return run(`A.shop(${q(args[0])}, ${q(args[1])}, ${q(args[2] || null)}) || 'acheté'`);
    case 'stock': return run(`(() => { const s = siteById(${q(args[0])}); if (!s) return 'lieu inconnu'; const st = shopStock(s); return { objets: (SHOPS[s.kind] || []).flatMap(x => x.items).map(i => i + (SHOP[i].price ? ' ' + shopPrice(s, i) + 'po' : '')), deco: st.deco, artefacts: st.arts.map(k => k + ' ' + shopPrice(s, 'artefact', k) + 'po'), voles: st.stolen }; })()`);
    case 'request': return run(`(() => { const r = openReqs().find(x => x.id === ${q(args[0])}); return r ? (A.request(r) || 'fait') : 'requête inconnue'; })()`);
    case 'tier': return run(`cmd('tierUp') || 'palier ' + S.tier`);
    case 'expand': return run(`cmd('expand') || 'remparts ' + W + 'x' + H`);
    case 'foret': return run(`typeof EXT === 'undefined' ? 'pas de Jardins dans cette version' : cmd('foret') || 'parcelle achetée : Jardins ' + W + '×' + extDepth()`);
    case 'floorup': return run(`A.floor(1) || 'escalier montant en chantier'`);
    case 'floordown': return run(`A.floor(-1) || 'escalier descendant en chantier'`);
    case 'project': return run(`cmd('project', { id: ${q(args[0])} }) || 'projet lancé'`);
    case 'power': return run(`cmd('power', { pw: ${q(args[0])}, id: (S.creatures.find(c => c.tempt) || {}).id }) || 'pouvoir utilisé'`);
    case 'care': return run(`A.care(), 'ok'`);
    case 'quests': case 'accept': return run(`A.quests(), 'ok'`);
    default: return `action inconnue : ${a} (voir « help »)`;
  }
}
const KEY = /Raid sur|Invasion :|Butin|Complication|Trophée|détalent|abandonnent|expédition|Expédition|🧭|Victoire|Grand Maître|ère|vassal|Reddition|Conseil|croisade|Croisade|Parade|Rituel|déserté|Calamité !|pillé|Les aventuriers|Les héros touchent|repouss|Chantier terminé|arrive|s’installe|artefact|Artefact|rencontre|requête|Requête|Palier/;
if (cmd === 'new') {
  const seed = +rest[0] || Math.floor(Math.random() * 1e6);
  g.run(`simNewGame(${seed}, ${rest[1] ? JSON.stringify(rest[1]) : 'null'})`);
  const d = { seed }; store(d); console.log(g.run('simState(true)'));
} else if (cmd === 'state') { load(); console.log(g.run('simState(true)')); }
else if (cmd === 'do') {
  const d = load(); const out = rest.join(' ').split(';').map(l => l.trim()).filter(Boolean).map(l => `> ${l} → ${act(l)}`);
  g.run('checkGoals(); checkQuests(); checkAch();'); store(d); console.log(out.join('\n') + '\n\n' + g.run('simState(true)'));
} else if (cmd === 'night') {
  const d = load(), n = Math.max(1, Math.min(10, +rest[0] || 1)), lines = [];
  for (let i = 0; i < n; i++) {
    g.run(`A.care(); A.quests(); if (invasionSoon()) A.posts();`);
    const rep = JSON.parse(g.run('JSON.stringify(simNight())'));
    rep.filter(l => l[0] !== 'sec' && KEY.test(l[1])).forEach(l => lines.push(`N${JSON.parse(g.run('S.night')) - 1} ${l[0]} ${l[1]}`));
    if (JSON.parse(g.run('S.raid ? 1 : 0'))) break;
  }
  store(d); console.log(lines.slice(-30).join('\n') + '\n\n' + g.run('simState(true)'));
} else console.log(HELP);
