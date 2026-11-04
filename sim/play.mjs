// Joue une partie pas à pas en ligne de commande (pour une IA comme Sonnet, ou pour toi).
//   node sim/play.mjs new  partie.json [graine] [thème] [fil]   → nouvelle partie (« fil » : avec le fil rouge des nouveaux joueurs)
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
  decor <objet> [pièce]     colle une déco (achetée si elle n'est pas en réserve) ou un artefact trouvé, dans une pièce de ce type si précisé
  traps [budget]            pose des pièges sur le chemin des héros (budget 8 par défaut)
  renvoyer <créature>       renvoie une créature du château (nom complet, numéro compris ; « oui » à la fin pour une légende)
  state                     réaffiche l'état (commande à part : node sim/play.mjs state <fichier>)
  post <créature> <pièce>   poste une créature précise dans une pièce de ce type (ex. post Navet taverne ; « aucun » retire le poste)
  posts                     poste chaque créature dans sa pièce préférée
  raid <cible> [approche] [Nom,Nom]  prépare un raid ; approche prudente | risquee | desesperee ; équipe au choix (noms séparés par des virgules), sinon automatique
  tactique <postes|cible|harceler|rancon>  la tactique de tes créatures face aux prochaines invasions (voir l'estimation dans l'état)
  (commande à part) node sim/play.mjs crawl <fichier> start <cible> [Nom,Nom]  → une expédition en cartes jouée À LA MAIN, carte par carte ;
      puis node sim/play.mjs crawl <fichier> <action> : salle <n>, joue <n° carte> [n° cible], decor <n> [n° cible], fin, fuir, prendre <n>, passer, repos soin|calme|aiguiser, choix <n>, continuer, rentrer
      (rentrer avant la première salle annule l'expédition sans délai sur le lieu ; « crawl <fichier> deck » montre le deck ; repos aiguiser <n° du deck>)
  annuler                   annule le raid ou l'expédition prévu·e
  livre                     le Livre du Maître : chapitre en cours (une ère), tes stickers, la course contre les rivaux, tes reliques
  espion [rival]            paie un espion pour déjouer le coup qu'un rival prépare (voir l'état)
  expe <lieu>               expédition vers un lieu (id du lieu connu, ou x_lieu ; r_rival = expédition dans un donjon rival). Une seule expédition ou un seul raid par nuit.
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
  journal                   quêtes du journal (le Val) : accepte les offres, livre, choisit, lance raids et expéditions demandés
  wonder <remparts|cave|galerie|archives> [or]  bâtit ou agrandit une Merveille (fiche du Cœur) ; « or » : tout payer en or (1 bois = 1,5 or)
  fete                      donne une Grande fête (toutes les 8 nuits)
  merveilles                montre les Merveilles, leur prochain niveau et leur coût (sans rien acheter), et le coût de la fête
  victoires                 montre l'avancée des cinq victoires
  fil                       le fil rouge (si la partie a été créée avec « fil ») : chapitre, objectifs
  drill                     répétition de défense du Cœur aux cartes (jouée par l'ordinateur des deux côtés)
  (commande à part) node sim/play.mjs wiki [article]  → règles du jeu (le Grimoire en jeu)
Chaque nuit lancée avec « night » fait d'abord « care » et « quests » (et rappelle les gardes si des héros arrivent).`;
if (!cmd || cmd === 'help') { console.log(HELP); process.exit(0); }
const g = createGame();
g.run(fs.readFileSync(new URL('./crawl_cli.js', import.meta.url), 'utf8'));   // l'expédition jouée à la main
if (cmd === 'wiki') {   // le Grimoire du jeu, en texte brut
  const key = file; g.ctx.__KEY = key || ''; g.run('simNewGame(1)');   // certains articles lisent la partie en cours
  const W = JSON.parse(g.run(`JSON.stringify(Object.fromEntries(Object.entries(WIKI).map(([k, w]) => [k, { cat: w.cat, t: w.t, x: k === __KEY ? w.x() : '' }])))`));
  if (!key || !W[key]) { console.log((key ? `Article inconnu : ${key}\n\n` : '') + 'Articles :\n' + Object.entries(W).map(([k, w]) => `  ${k} — ${w.t}`).join('\n')); process.exit(0); }
  const txt = W[key].x.replace(/\{c:([\w-]+)\|([^}]+)\}/g, '$2 [wiki $1]').replace(/\{c:([\w-]+)\}/g, (m, k) => `${W[k] ? W[k].t : k} [wiki ${k}]`).replace(/\{\w+:[^|}]*\|([^}]+)\}/g, '$1').replace(/\{\w+:([\w-]+)\}/g, '$1').replace(/<li>/g, '\n • ').replace(/<\/p>|<br>|<\/h\d>/g, '\n').replace(/<[^>]+>/g, '').replace(/&nbsp;|&#160;/g, ' ').replace(/\n{3,}/g, '\n\n');
  console.log(`# ${W[key].t}\n\n${txt.trim()}`); process.exit(0);
}
const load = () => { const d = JSON.parse(fs.readFileSync(file, 'utf8')); g.ctx.__SAVE = d; g.run(`Math.random = mulberry32(__SAVE.seed + __SAVE.S.night * 1000 + (__SAVE.calls || 0)); S = upgradeState(__SAVE.S); SIM.m = __SAVE.m; Z = 0; WORLD = null; dirty(); world(); if (typeof ensureCrawlSites === 'function') ensureCrawlSites(); if (typeof questSync === 'function') questSync();`); return d; };
const store = d => { d.S = JSON.parse(g.run('JSON.stringify(S)')); d.m = JSON.parse(g.run('JSON.stringify(SIM.m)')); d.calls = (d.calls || 0) + 1; fs.writeFileSync(file, JSON.stringify(d)); };

const FURN_KEYS = JSON.parse(g.run('JSON.stringify(Object.keys(FURN))'));
function act(line) {
  const [a, ...args] = line.trim().split(/\s+/); if (!a) return '';
  const q = JSON.stringify, z = args[1] != null ? +args[1] : 0;
  const run = e => { try { const r = g.run(e); return r == null ? 'ok' : (typeof r === 'object' ? JSON.stringify(r) : String(r)); } catch (err) { return 'erreur : ' + err.message; } };
  if (['raid', 'expe', 'scout', 'shop', 'stock', 'request'].includes(a)) g.run(`typeof filSet === 'function' && filSet('map')`);
  switch (a) {
    case 'build': return args[0] ? run(`A.build(${q(args[0])}, ${z}) || 'ok'`) : 'précise la pièce : build <pièce> [étage]';
    case 'furnish': { const cap = args[1] != null ? +args[1] : null, budget = cap == null ? 'S.gold' : `Math.max(0, S.gold - (${cap} - spent))`;
      return run(`(() => { let spent = 0, n = 0; const g0 = S.gold; for (const r of S.rooms.filter(r => r.built && ROOMS[r.t].furn && (${q(args[0])} === 'all' || r.t === ${q(args[0])}))) { if (${cap == null ? 'false' : `g0 - S.gold >= ${cap}`}) break; n += A.furnish(r, ${cap == null ? 'S.gold' : `Math.max(0, ${cap} - (g0 - S.gold))`}); } return n + ' meubles posés (' + (g0 - S.gold) + ' or dépensé)' + (n ? '' : ROOMS[${q(args[0])}] && !ROOMS[${q(args[0])}].furn ? ' : cette pièce est livrée meublée' : ''); })()`); }
    case 'decor': return FURN_KEYS.includes(args[0]) ? run(`A.decorate(${q(args[0])}, 99, ${q(args[1] || null)}) || 'ok'`) : `objet inconnu : ${args[0]} (une clé de déco, par exemple torche, plante, toile, tableau)`;
    case 'renvoyer': { const sure = args[args.length - 1] === 'oui', nm = (sure ? args.slice(0, -1) : args).join(' ').toLowerCase(); return run(`(() => { const c = S.creatures.find(x => x.name.toLowerCase() === ${q(nm)}); if (!c) return 'créature inconnue : ' + ${q(nm)} + ' (nom complet, avec son numéro s’il en a un)'; if ((c.legend || c.evo) && !${sure}) return c.name + ' est une légende : ajoute « oui » pour confirmer (renvoyer ' + c.name + ' oui)'; return cmd('fire', { id: c.id }) || c.name + ' (' + SPECIES[c.sp].name + ') renvoyé·e'; })()`); }
    case 'traps': return run(`A.traps(${+args[0] || 8}) + ' pièges posés'`);
    case 'post': return run(`(() => { const nm = ${q(args.slice(0, -1).join(' ').toLowerCase())}, c = S.creatures.find(x => x.name.toLowerCase() === nm); if (!c) return 'créature inconnue : ' + nm; if (${q(args[args.length - 1] || '')} === 'aucun') return cmd('post', { id: c.id, post: null }) || c.name + ' sans poste'; const rs = S.rooms.filter(r => r.built && r.t === ${q(args[args.length - 1] || '')}); if (!rs.length) return 'aucune pièce terminée de ce type : ' + ${q(args[args.length - 1] || '')}; for (const r of rs) { const e = cmd('post', { id: c.id, post: r.id }); if (!e) return c.name + ' posté·e : ' + ROOMS[r.t].name; } return cmd('post', { id: c.id, post: rs[0].id }); })()`);
    case 'posts': return run(`A.posts(), 'ok'`);
    case 'raid': if (args.length > 1) { const app = args.find(x => ['prudente', 'risquee', 'desesperee'].includes(x)) || null, names = args.slice(1).filter(x => x !== app).join(' '); return run(`(() => { const ids = ${q(names)} ? ${q(names)}.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).map(nm => (S.creatures.find(c => c.name.toLowerCase() === nm) || {}).id).filter(Boolean) : null; if (${q(names)} && !ids.length) return 'créatures inconnues : ' + ${q(names)}; if (!ids) { const e = A.raid(${q(args[0])}); if (e) return e; if (${q(app)} && S.raid) S.raid.app = ${q(app)}; return 'raid prévu (' + S.raid.app + ')'; } return cmd('raidPlan', { target: ${q(args[0])}, team: ids, app: ${q(app || 'risquee')} }) || 'prévu : ' + S.raid.team.map(id => critter(id).name).join(', ') + (S.raid.crawl ? ' (expédition)' : ' · approche ' + S.raid.app + ' · ' + Math.min(6, raidBreakdown(S.raid.target, S.raid.team).pool) + ' dés lancés') + (() => { const men = S.menace + (S.hype >= 3 ? 1 : 0) + (S.raid.crawl ? 0 : RAIDS[S.raid.target].menace || 0); return men >= MENACE_MAX ? ' ⚠️ Menace ' + Math.min(men, MENACE_MAX) + '/' + MENACE_MAX + ' : une bande arrivera sans doute cette nuit, sans cette équipe pour défendre.' : ' · Menace après le raid : ' + men + '/' + MENACE_MAX; })(); })()`); }
    return run(`A.raid(${q(args[0])}) || 'raid prévu : ' + S.raid.team.map(id => critter(id).name).join(', ') + ' (' + raidBreakdown(S.raid.target, S.raid.team).pool + ' dés)'`);
    case 'espion': return run(`(() => { const id = ${q(args[0] || '')} || (coupPending()[0] || [])[0]; return id ? (cmd('spy', { id }) || 'coup déjoué : ' + racer(id).master + ' rentre bredouille') : 'aucun coup en préparation'; })()`);
    case 'livre': return run(`(() => { const B = bookState(), c = bookCur(), mine = c.mine.reduce((a, x) => a + x.pts, 0); return 'Chapitre ' + ROMAN(c.n) + ', l’Ère ' + c.name + ' (nuits ' + c.from + ' à ' + c.to + ') · toi ' + Math.round(mine) + ' pts · ' + Object.entries(c.rivals).map(([k, v]) => racer(k).name + ' ' + Math.round(v)).join(', ') + ' · stickers du chapitre : ' + (c.mine.map(x => MOM_BY[x.id].t).join(', ') || 'aucun') + ' · chapitres passés : ' + B.ch.filter(x => x.age).map(x => ROMAN(x.n) + ' ' + AGES[x.age].name + (x.pact ? ' (pacte ' + PACT_BY[x.pact].name + ')' : '') + (x.relics && x.relics.length ? ' (relique ' + x.relics.map(id => RELIC_BY[id].name).join(', ') + ')' : '')).join(' ; ') + ' · reliques : ' + (B.relics.map(r => RELIC_BY[r.id].name + ' : ' + RELIC_BY[r.id].d).join(' ; ') || 'aucune'); })()`);
    case 'annuler': return run(`S.raid ? (cancelRaid(), 'raid ou expédition annulé·e') : 'rien de prévu'`);
    case 'tactique': { const t = { postes: 'postes', cible: 'cible', harceler: 'harceler', rancon: 'rancon', 'rançon': 'rancon' }[args[0]]; if (!t) return 'tactique postes | cible | harceler | rancon'; return run(`(S.opts = S.opts || {}, S.opts.cliTac = ${q(t)}, 'tactique des prochaines invasions : ' + TACTICS[${q(t)}].name)`); }
    case 'expe': { const id = (args[0] || '').replace(/^x_/, ''); if (/^r_/.test(id)) return run(`A.raid(${q(id)}) || 'expédition prévue contre le donjon rival'`); return run(`A.expedition(${q(id)}) || 'expédition partie'`); }
    case 'scout': return run(`A.scout() || 'éclaireur parti'`);
    case 'shop': return run(`A.shop(${q(args[0])}, ${q(args[1])}, ${q(args[2] || null)}) || 'acheté'`);
    case 'stock': return run(`(() => { const s = siteById(${q(args[0])}); if (!s) return 'lieu inconnu'; const st = shopStock(s); return { objets: (SHOPS[s.kind] || []).flatMap(x => x.items).map(i => i + (SHOP[i].price ? ' ' + shopPrice(s, i) + 'po' : '')), deco: st.deco, artefacts: (SHOPS[s.kind] || []).some(x => x.items.includes('artefact')) ? st.arts.map(k => k + ' ' + shopPrice(s, 'artefact', k) + 'po') : 'pas d’artefacts ici (seules les villes en vendent)', voles: st.stolen }; })()`);
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
    case 'journal': return run(`A.questStep(), (() => { const Q = qState(); return 'en cours : ' + (Q.cur.map(q => q.def.title + ' (' + ((qStep(q) || {}).k || 'fini') + ')').join(', ') || 'aucune') + ' ; au tableau : ' + (Q.offers.map(o => o.def.title).join(', ') || 'rien'); })()`);
    case 'wonder': return run(`cmd('wonder', { id: ${q(args[0])}, gold: ${args[1] === 'or'} }) || WONDERS[${q(args[0])}].name + ' niveau ' + wonderLv(${q(args[0])}) + ' (prochain : ' + costText(wonderCost(${q(args[0])})).replace(/<[^>]+>/g, '') + ')'`);
    case 'fete': return run(`cmd('fete') || 'la fête bat son plein'`);
    case 'merveilles': return run(`Object.entries(WONDERS).map(([k, W]) => k + ' (' + W.name + ') niv. ' + wonderLv(k) + ' → ' + W.desc(wonderLv(k) + 1) + ' : ' + wonderCost(k).g + ' or ' + wonderCost(k).s + ' bois (ou ' + wonderGold(k).g + ' or)').join(' · ') + ' · fête : ' + feteCost().g + ' or ' + feteCost().s + ' bois' + (feteWhy() ? ' (' + feteWhy() + ')' : ' (possible)')`);
    case 'victoires': return run(`(filSet('vic'), VICTORIES.map(v => v.name + ' ' + vicPct(v.id) + ' %').join(' · ') + ' · Ménagerie : ' + (() => { const st = menSettled(); return st.filter(c => (c.epa == null ? 50 : c.epa) >= 70).length + '/' + st.length + ' installées épanouies (il en faut ' + Math.ceil(st.length * MEN_HAPPY) + '), série ' + (S.vic ? S.vic.happy : 0) + '/3'; })())`);
    case 'fil': return run(`filText()`);
    case 'drill': return run(`(() => { const mine = duelMyGuard(); if (!mine.team.length) return 'personne en forme'; const avg = f => Math.round(mine.team.reduce((a, e) => a + e[f], 0) / mine.team.length);
      const heroes = { master: 'La bande de paille', name: 'Répétition', r: 0, bag: [], team: ['barbare', 'mage', 'paladin'].map(k => ({ hk: k, name: k, hp: Math.max(10, avg('hp')), max: Math.max(10, avg('hp')), atk: Math.max(1, avg('atk')), guard: 0, cards: HERO_DECK[k] })) };
      const D = duelNew(Object.assign({}, mine, { extra: HEART_CARDS.map(k => ['base', k, 0]) }), heroes); let gd = 0; while (D.over == null && gd++ < 300) { const si = D.cur; let k = 0; while (duelAI(D, si) && k++ < 30) {} if (D.over == null) D.endTurn(si); }
      if (D.over === 0) { S.stats.cardDefs = (S.stats.cardDefs || 0) + 1; return 'répétition gagnée'; } return 'répétition perdue'; })()`);
    default: return `action inconnue : ${a} (voir « help »)`;
  }
}
const FORECAST = `(() => { const rm = S.raid && !S.raid.crawl && RAIDS[S.raid.target] ? (RAIDS[S.raid.target].menace || 0) : 0;
  const due = S.menace + (S.hype >= 3 ? 1 : 0) + rm >= MENACE_MAX || (typeof filBandDue === 'function' && filBandDue()); if (!due) return '';
  const snap = JSON.stringify(S), rnd = Math.random, out = []; Math.random = mulberry32(S.night * 7919 + 13);
  const back = () => { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(snap)); WORLD = null; dirty(); };
  try { for (const t of ['postes', 'cible', 'harceler']) { const o = { repelled: 0, lost: 0, robbed: 0 }; let n = 0; for (let i = 0; i < 24; i++) { back(); const plan = planInvasion(); if (!plan || !plan.party || !plan.party.length) continue; n++; const R = resolveInvasion(plan, t); o[R.outcome] = (o[R.outcome] || 0) + 1; }
    if (n) out.push(TACTICS[t].name + ' : repoussée ' + Math.round(o.repelled / n * 100) + ' %, égarée ' + Math.round(o.lost / n * 100) + ' %, Cœur pillé ' + Math.round(o.robbed / n * 100) + ' %'); } } finally { back(); Math.random = rnd; }
  return out.length ? '\\n⚔️ Une bande arrivera sans doute cette nuit. Estimation sur 24 essais, selon ta tactique (actuelle : ' + TACTICS[(S.opts && S.opts.cliTac) || 'postes'].name + ') : ' + out.join(' · ') + '. Acheter leur départ (rancon) évite le combat contre de l’or.' : ''; })()`;
const ST = () => g.run('simState(true)') + g.run(FORECAST) + g.run(`(typeof payroll === 'function' && payroll() ? '\\nJour de paie dans ' + nightsToPay() + ' nuit(s) : ' + payroll() + ' or (tu en as ' + S.gold + ')' : '') + (typeof coupPending === 'function' ? coupPending().map(([id, c]) => '\\n🗡️ Coup en préparation : ' + racer(id).master + ' ' + COUPS[id].t + ' dans ' + Math.max(0, c.at - S.night) + ' nuit(s) (perte : ' + COUPS[id].loss() + '). Parade : expédition r_' + id + ' qui passe une salle, ou « espion ' + id + ' » (' + coupCost() + ' or).').join('') : '') + (typeof bookCur === 'function' && S.book ? (() => { const c = bookCur(), mine = c.mine.reduce((a, x) => a + x.pts, 0), best = Math.max(0, ...Object.values(c.rivals)); return '\\n📖 Chapitre ' + ROMAN(c.n) + ', l’Ère ' + c.name + ' : encore ' + Math.max(0, c.to - S.night) + ' nuit(s) · toi ' + Math.round(mine) + ' pts, meilleur rival ' + Math.round(best) + ' pts (premier : âge d’or et relique ; dernier : âge sombre). Détail : action « livre ».'; })() : '') + (S.fil ? '\\n\\n' + filText() : '')`);
const KEY = /Raid sur|Invasion :|Butin|Complication|Trophée|détalent|abandonnent|expédition|Expédition|🧭|Victoire|Grand Maître|ère|vassal|Reddition|Conseil|croisade|Croisade|Parade|Rituel|déserté|Calamité !|pillé|Les aventuriers|Les héros touchent|repouss|Chantier terminé|Chapitre|Quête|quête|sticker|Relique d’ère|Âge|Le Livre|coup se prépare|Coup déjoué|vident ta réserve|chez elle|emportent|rumeurs dans tout|enlèvent|tribut|rôdent dehors|quitte|part vivre|délaissé|chez lui|chez elle|impayé|Caisse|arrive|s’installe|artefact|Artefact|rencontre|requête|Requête|Palier/;
// l'expédition jouée à la main : la graine et les actions sont gardées dans le fichier de partie, le château ne change qu'à la fin
if (cmd === 'crawl') {
  const d = load(), words = rest.join(' ').trim();
  const show = () => { g.ctx.__C = d.crawl; return g.run('cliCrawlText(cliCrawlRun(__C))'); };
  if (words.startsWith('start')) {
    if (d.crawl) { console.log('Une expédition est déjà en cours :\n' + show()); process.exit(0); }
    const [, target0, ...names] = words.split(/\s+/); const nm = names.join(' ');
    g.ctx.__T = target0 || ''; g.ctx.__N = nm;
    const err = g.run(`(() => { let t = __T; if (!RAIDS[t] && RAIDS['x_' + t]) t = 'x_' + t; if (!RAIDS[t] && typeof ensureCrawlSites === 'function') { ensureCrawlSites(); if (!RAIDS[t] && RAIDS['x_' + t]) t = 'x_' + t; }
      if (!RAIDS[t] || !isCrawlTarget(t)) return 'cible d’expédition inconnue : ' + __T + ' (un site de « Lieux connus », x_lieu ou r_rival)';
      let ids = __N ? __N.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).map(n => (S.creatures.find(c => c.name.toLowerCase() === n) || {}).id).filter(Boolean) : free().map(c => [c, crawler(c)]).sort((a, b) => b[1].hp * b[1].atk - a[1].hp * a[1].atk).slice(0, 4).map(x => x[0].id);
      if (!ids.length) return 'personne ne peut partir';
      return cmd('raidPlan', { target: t, team: ids }) || null; })()`);
    if (err) { console.log('⚠️ ' + err); process.exit(0); }
    d.crawl = { seed: Math.floor(Math.random() * 1e9), uid0: JSON.parse(g.run('CARD_UID')), actions: [] };
    store(d); console.log(show()); process.exit(0);
  }
  if (!d.crawl) { console.log('Aucune expédition en cours. Lance-la avec : node sim/play.mjs crawl <fichier> start <cible> [Nom,Nom]'); process.exit(0); }
  if (!words) { console.log(show()); process.exit(0); }
  if (words === 'deck') { g.ctx.__C = d.crawl; console.log(g.run('cliCrawlDeck(cliCrawlRun(__C))')); process.exit(0); }
  d.crawl.actions.push(words); g.ctx.__C = d.crawl;
  const res = JSON.parse(g.run(`(() => { const X = cliCrawlRun(__C); const out = { err: X.err, text: cliCrawlText(X), done: X.phase === 'done' }; if (!X.err && X.phase === 'done') out.fin = cliCrawlFinish(X); return JSON.stringify(out); })()`));
  if (res.err) { d.crawl.actions.pop(); fs.writeFileSync(file, JSON.stringify(d)); console.log(res.text); process.exit(0); }
  if (res.done) { d.crawl = null; store(d); console.log(res.text + '\n\n' + res.fin + '\n\n(L’expédition est jouée : avance maintenant avec night.)'); process.exit(0); }
  fs.writeFileSync(file, JSON.stringify(d)); console.log(res.text); process.exit(0);
}
if (cmd === 'new') {
  const seed = +rest[0] || Math.floor(Math.random() * 1e6);
  const fil = rest.includes('fil'), theme = rest[1] && rest[1] !== 'fil' ? rest[1] : null;
  g.run(`simNewGame(${seed}, ${theme ? JSON.stringify(theme) : 'null'}); ${fil ? 'S.fil = filNew();' : ''}`);
  const d = { seed }; store(d); console.log(ST());
} else if (cmd === 'state') { load(); console.log(ST()); }
else if (cmd === 'do') {
  const d = load(); const out = rest.join(' ').split(';').map(l => l.trim()).filter(Boolean).map(l => `> ${l} → ${act(l)}`);
  g.run('checkGoals(); checkQuests(); checkAch(); if (typeof filCheck === "function") filCheck();'); store(d); console.log(out.join('\n') + '\n\n' + ST());
} else if (cmd === 'night') {
  if (rest.slice(1).length || (rest[0] && isNaN(+rest[0]))) { console.log('⚠️ night ne prend qu’un nombre de nuits : les actions passent par « do <fichier> "…" ». Rien n’a été joué.'); process.exit(0); }
  const d = load(); if (d.crawl) { console.log('Une expédition est en cours : finis-la (node sim/play.mjs crawl <fichier> <action>) ou rentre (crawl <fichier> rentrer).'); process.exit(0); }
  const n = Math.max(1, Math.min(10, +rest[0] || 1)), lines = [];
  for (let i = 0; i < n; i++) {
    g.run(`A.care(); A.quests(); if (invasionSoon()) A.posts();`);
    const rep = JSON.parse(g.run('JSON.stringify(simNight())'));
    rep.filter(l => l[0] !== 'sec' && KEY.test(l[1])).forEach(l => lines.push(`N${JSON.parse(g.run('S.night')) - 1} ${l[0]} ${l[1]}`));
    if (JSON.parse(g.run('S.raid ? 1 : 0'))) break;
  }
  store(d); console.log(lines.slice(-30).join('\n') + '\n\n' + ST());
} else console.log(HELP);
