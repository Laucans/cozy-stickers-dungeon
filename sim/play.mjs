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
  furnish <pièce|all> [or]  meuble les pièces de ce type (ou toutes) avec ce qui est utile, sans dépasser [or] si précisé (dit pourquoi rien n'a été posé : pièce pleine, or)
  decor <objet> [pièce]     colle une déco (achetée si elle n'est pas en réserve) ou un artefact trouvé, dans une pièce de ce type si précisé ;
      sinon d'abord hors des dortoirs, potagers et cuisines. Une pièce prend un sticker pour deux cases ; un couloir n'a pas de limite (build couloir)
  traps [budget]            pose des pièges sur le chemin des héros (budget 8 par défaut)
  renvoyer <créature>       renvoie une créature du château (nom complet, numéro compris ; « oui » à la fin pour une légende)
  state                     réaffiche l'état (commande à part : node sim/play.mjs state <fichier>)
  post <créature> <pièce>   donne à une créature son poste de travail dans une pièce de ce type (ex. post Navet taverne ; « aucun » retire le poste)
  posts                     donne à chaque créature son poste de travail : l'atelier de son métier, sinon sa pièce préférée (humeur).
      Les postes ne changent rien à la défense : face à une bande, les défenseurs sont tirés au sort parmi les créatures présentes
  raid <cible> [approche] [Nom,Nom]  prépare un raid ; approche prudente | risquee | desesperee ; équipe au choix (noms séparés par des virgules), sinon automatique
  tactique <combat|rancon>  face aux prochaines invasions : combat (par défaut, la bande traverse le château et tes créatures se battent)
      ou rancon (tu achètes leur départ : 4 or par héros et par rang, au plus ton or — par exemple 12 or pour 3 héros de rang 1, 40 pour 5 héros de rang 2 ;
      le prix de la prochaine bande s'affiche dans l'état quand elle approche). Jamais contre la croisade de Mirebrume : elle se combat (la tactique attend la bande suivante)
      Après chaque invasion, la nuit affiche un résumé pièce par pièce (défenseurs, pièges, rencontres, butin) et, si le Cœur tombe, pourquoi
  (commande à part) node sim/play.mjs crawl <fichier> start <cible> [Nom,Nom] [sac=a,b,c,d]  → une expédition en cartes jouée À LA MAIN, carte par carte ;
      cible : x_lieu, r_rival, ou mirebrume (le Siège). sac= : jusqu'à 4 cartes du château (sans sac=, le sac est rempli tout seul ; la liste s'affiche au départ)
      puis node sim/play.mjs crawl <fichier> <action> : salle <n>, joue <n° carte> [n° cible], decor <n> [n° cible], fin, fuir, prendre <n>, passer, repos soin|calme|aiguiser, choix <n>, continuer, rentrer
      (les cartes gardent leur numéro jusqu'à la fin du tour, ennemis et alliées pendant tout le combat ; rentrer avant la première salle annule l'expédition sans délai sur le lieu ;
      « crawl <fichier> deck » montre le deck ; repos aiguiser <n° du deck>)
      En auto plus d'un tour sur deux (et en expédition lancée avec expe), le manager prend 25 % de l'or du combat ; à la main sans K.O., une carte de plus au choix, déjà améliorée ; un boss vaincu laisse un sticker.
      Les portes « élite » et « boss » annoncent qui attend derrière, avec ses PV. « élan → N » : le gros coup part au tour suivant (sonne l'ennemi, ou pare) ;
      un ennemi déjà sonné ne l'est pas deux fois (l'étourdissement devient de la parade) ; un soin fait reculer le poison et son surplus devient de la parade.
  annuler                   annule le raid ou l'expédition prévu·e
  livre                     le Livre du Maître : chapitre en cours (une ère), tes stickers, la course contre les rivaux, tes reliques
      (sans écran, le pacte d'un âge sombre est choisi tout seul : le premier proposé ; « livre » dit lequel)
  nemesis <capturer|corrompre|recruter>  décide du sort du héros némésis quand il est à ta merci (corrompre : 40 or)
  liberer <créature>        paie la rançon d'une créature enlevée (le prix est dans l'état)
  espion [rival]            paie un espion pour déjouer le coup qu'un rival prépare (voir l'état)
  expe <lieu>               expédition vers un lieu (id du lieu connu, ou x_lieu ; r_rival = expédition dans un donjon rival ; mirebrume = un assaut du Siège).
      Une seule expédition ou un seul raid par nuit. Les expéditions en cartes prévues ainsi se jouent en automatique pendant la nuit,
      à l'instinct (sans chercher les faiblesses ni le décor, et le manager prend 25 % de l'or) ; pour les jouer à la main : node sim/play.mjs crawl <fichier> start <cible>
  scout                     envoie un éclaireur au bord du brouillard
  shop <lieu> <objet> [arg] achète en ville : rumeur, humeur, fidelite, tisane, oubli, tournee, merco, dossier, avis, carte, tresor, don, deco <clé>, artefact <clé>, rachat <clé>, recrue <espèce>
  request <id>              accomplit une requête de village (payer ou envoyer quelqu'un)
  tier | expand | foret     monte de palier | agrandit les remparts | rachète une parcelle de forêt (Jardins)
  (étage 9 = les Jardins, dehors : build poulailler 9)
  floorup | floordown       escalier vers le haut | vers le bas
  project parade|rituel     lance la finale de la Ménagerie ou des Secrets
  power brume|festin|rappel utilise un pouvoir de haut fait
  care | quests             pouvoirs (brume, festin, cloche) | envies et rêves connus : s'en occupe (et laisse partir à l'aventure) ;
      quests achète des meubles et des décos, recrute, et peut bâtir la pièce qu'une créature réclame : ça coûte de l'or
  stock <lieu>              montre ce que vend un lieu
  journal                   quêtes du journal (le Val) : ce qui est au tableau, les quêtes en cours et ce qu'elles attendent ;
      journal accepter <n> | refuser <n> | choisir <n> <option> | payer <n> | abandonner <n> ; journal auto : accepte, livre, choisit
      la première option et lance raids et expéditions tout seul (l'ancien comportement)
  chantier [id]             les grands chantiers (fiche du Cœur, un à la fois) : sans id, la liste et leurs coûts ; avec id, lance le chantier
  mecenat [lieu] [or]       le mécénat du Val (dès le palier 1) : sans lieu, la liste ; avec l'id d'un village, d'une ville ou de la Cité,
      offre son prochain embellissement (surtout du bois ; « or » : tout payer en or, 1 bois = 1,5 or)
  concours [inscrire | preparer [or]]  le concours de la saison : sans argument, le thème, ta note et les favoris ;
      inscrire (un peu d'or) ; preparer (+1 point, 3 au plus, en bois, ou tout en or)
  caravane [pille | escorte | commerce [bois]]  la caravane qui passe sur les routes : sans argument, où elle en est ;
      commerce : elle t'achète du bois (2 🪵 pour 1 or, une charrette par caravane), et on peut encore l'escorter ensuite
  marchand [objet]          le marchand ambulant, la nuit de sa visite seulement : sans argument, ce qu'il vend ; avec la clé de l'objet, l'achète
  wonder <remparts|cave|galerie|archives> [or]  bâtit ou agrandit une Merveille (fiche du Cœur) ; « or » : tout payer en or (1 bois = 1,5 or)
  fete                      donne une Grande fête (toutes les 8 nuits)
  merveilles                montre les Merveilles, leur prochain niveau et leur coût (sans rien acheter), et le coût de la fête
  victoires                 montre l'avancée des cinq victoires
  (victoires, livre, journal, fil, merveilles, chantier, mecenat, concours, caravane, marchand, stock <lieu> et state marchent aussi hors de do :
   node sim/play.mjs victoires <fichier>)
L'état se termine par « À décider » : le concours, la caravane, le marchand, le journal, les chantiers en cours.
  fil                       le fil rouge (si la partie a été créée avec « fil ») : chapitre, objectifs
  drill                     répétition de défense du Cœur aux cartes (jouée par l'ordinateur des deux côtés)
  (commande à part) node sim/play.mjs wiki [article]  → règles du jeu (le Grimoire en jeu)
⚠️ Chaque nuit lancée avec « night » fait d'abord les soins automatiques : « care » (pouvoirs des hauts faits), puis « quests » sans construire de pièce
   (envies et rêves : meubles, décos, recrues… ce qui coûte de l'or). Ce qu'ils ont dépensé est affiché à chaque nuit (ligne 🤖).`;
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
// le Siège de Mirebrume : expe mirebrume, raid mirebrume (ou cite, siege…) le préparent ; il se joue en automatique la nuit, ou à la main avec crawl start mirebrume
const SIEGE_ALIAS = ['mirebrume', 'r_mirebrume', 'x_mirebrume', 'cite', 'r_cite', 'x_cite', 'siege', 'siège'];
function siegePlan(names) {
  const q = JSON.stringify;
  try { return String(g.run(`(() => { if (!RAIDS.mirebrume) return 'pas de Siège dans cette version';
    if (vicState().siege >= 3) return 'Mirebrume t’a déjà remis ses clés';
    const why = !allVassals() ? 'il faut d’abord soumettre les quatre donjons rivaux (' + RIVALS.filter(r => isVassal(r.id)).length + '/4 vassaux)' : !raidKnown('mirebrume') ? 'trouve d’abord Mirebrume sur la carte (scout, rumeur, carte)' : S.tier < RAIDS.mirebrume.tier ? 'il faut le Palier ' + RAIDS.mirebrume.tier : '';
    if (why) return 'Siège impossible : ' + why;
    const ids = ${q(names || '')} ? ${q(names || '')}.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).map(n => (S.creatures.find(c => c.name.toLowerCase() === n) || {}).id).filter(Boolean) : null;
    if (${q(names || '')} && !ids.length) return 'créatures inconnues : ' + ${q(names || '')};
    const e = ids ? cmd('raidPlan', { target: 'mirebrume', team: ids }) : A.raid('mirebrume', 4); if (e) return e;
    return 'assaut prévu : ' + siegeTitle() + ', niveau ' + String(Math.round((crawlLevel() + siegeLvl()) * 10) / 10).replace('.', ',') + ', avec ' + S.raid.team.map(id => critter(id).name).join(', ') + '. Il se jouera en automatique cette nuit ; pour le jouer à la main, annule (annuler) puis : node sim/play.mjs crawl <fichier> start mirebrume [Nom,Nom]'; })()`)); } catch (err) { return 'erreur : ' + err.message; }
}
function act(line) {
  const [a, ...args] = line.trim().split(/\s+/); if (!a) return '';
  const q = JSON.stringify, z = args[1] != null ? +args[1] : 0;
  const run = e => { try { const r = g.run(e); return r == null ? 'ok' : (typeof r === 'object' ? JSON.stringify(r) : String(r)); } catch (err) { return 'erreur : ' + err.message; } };
  if (['raid', 'expe', 'scout', 'shop', 'stock', 'request'].includes(a)) g.run(`typeof filSet === 'function' && filSet('map')`);
  switch (a) {
    case 'build': return args[0] ? run(`A.build(${q(args[0])}, ${z}) || 'ok'`) : 'précise la pièce : build <pièce> [étage]';
    case 'furnish': { const cap = args[1] != null ? +args[1] : null;
      if (!args[0]) return 'précise la pièce : furnish <pièce|all> [or]';
      return run(`(() => { let n = 0; const g0 = S.gold, all = ${q(args[0])} === 'all', rs = S.rooms.filter(r => r.built && ROOMS[r.t].furn && (all || r.t === ${q(args[0])})), why = [];
        if (!all && !ROOMS[${q(args[0])}]) return 'pièce inconnue : ' + ${q(args[0])};
        if (!all && !ROOMS[${q(args[0])}].furn) return 'cette pièce est livrée meublée';
        if (!rs.length) return 'aucune pièce terminée de ce type' + (S.rooms.some(r => r.t === ${q(args[0])}) ? ' (chantier en cours : elle se meuble une fois terminée, après la nuit)' : '');
        for (const r of rs) { if (${cap == null ? 'false' : `g0 - S.gold >= ${cap}`}) break; const k = A.furnish(r, ${cap == null ? 'S.gold' : `Math.max(0, ${cap} - (g0 - S.gold))`}, { fit: true }); n += k; if (!k && !all) why.push(A.furnWhy(r)); }
        return n + ' meubles posés (' + (g0 - S.gold) + ' or dépensé)' + (why.length ? ' · ' + [...new Set(why)].join(' · ') : ''); })()`); }
    case 'decor': return FURN_KEYS.includes(args[0]) ? run(`A.decorate(${q(args[0])}, 99, ${q(args[1] || null)}, { cli: true }) || 'ok'`) : `objet inconnu : ${args[0]} (une clé de déco, par exemple torche, plante, toile, tableau)`;
    case 'renvoyer': { const sure = args[args.length - 1] === 'oui', nm = (sure ? args.slice(0, -1) : args).join(' ').toLowerCase(); return run(`(() => { const c = S.creatures.find(x => x.name.toLowerCase() === ${q(nm)}); if (!c) return 'créature inconnue : ' + ${q(nm)} + ' (nom complet, avec son numéro s’il en a un)'; if ((c.legend || c.evo) && !${sure}) return c.name + ' est une légende : ajoute « oui » pour confirmer (renvoyer ' + c.name + ' oui)'; return cmd('fire', { id: c.id }) || c.name + ' (' + SPECIES[c.sp].name + ') renvoyé·e'; })()`); }
    case 'traps': return run(`A.traps(${+args[0] || 8}) + ' pièges posés'`);
    case 'post': return run(`(() => { const nm = ${q(args.slice(0, -1).join(' ').toLowerCase())}, c = S.creatures.find(x => x.name.toLowerCase() === nm); if (!c) return 'créature inconnue : ' + nm; if (${q(args[args.length - 1] || '')} === 'aucun') return cmd('post', { id: c.id, post: null }) || c.name + ' sans poste'; const rs = S.rooms.filter(r => r.built && r.t === ${q(args[args.length - 1] || '')}); if (!rs.length) return 'aucune pièce terminée de ce type : ' + ${q(args[args.length - 1] || '')}; for (const r of rs) { const e = cmd('post', { id: c.id, post: r.id }); if (!e) return c.name + ' posté·e : ' + ROOMS[r.t].name; } return cmd('post', { id: c.id, post: rs[0].id }); })()`);
    case 'posts': return run(`A.posts(), 'ok'`);
    case 'raid': if (SIEGE_ALIAS.includes((args[0] || '').toLowerCase())) return siegePlan(args.slice(1).filter(x => !['prudente', 'risquee', 'desesperee'].includes(x)).join(' '));
      if (args.length > 1) { const app = args.find(x => ['prudente', 'risquee', 'desesperee'].includes(x)) || null, names = args.slice(1).filter(x => x !== app).join(' '); return run(`(() => { const ids = ${q(names)} ? ${q(names)}.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).map(nm => (S.creatures.find(c => c.name.toLowerCase() === nm) || {}).id).filter(Boolean) : null; if (${q(names)} && !ids.length) return 'créatures inconnues : ' + ${q(names)}; if (!ids) { const e = A.raid(${q(args[0])}); if (e) return e; if (${q(app)} && S.raid) S.raid.app = ${q(app)}; return 'raid prévu (' + S.raid.app + ')'; } return cmd('raidPlan', { target: ${q(args[0])}, team: ids, app: ${q(app || 'risquee')} }) || 'prévu : ' + S.raid.team.map(id => critter(id).name).join(', ') + (S.raid.crawl ? ' (expédition)' : ' · approche ' + S.raid.app + ' · ' + Math.min(6, raidBreakdown(S.raid.target, S.raid.team).pool) + ' dés lancés') + (() => { const men = S.menace + (S.hype >= 3 ? 1 : 0) + (S.raid.crawl ? 0 : RAIDS[S.raid.target].menace || 0); return men >= MENACE_MAX ? ' ⚠️ Menace ' + Math.min(men, MENACE_MAX) + '/' + MENACE_MAX + ' : une bande arrivera sans doute cette nuit, sans cette équipe pour défendre.' : ' · Menace après le raid : ' + men + '/' + MENACE_MAX; })(); })()`); }
    return run(`A.raid(${q(args[0])}) || 'raid prévu : ' + S.raid.team.map(id => critter(id).name).join(', ') + ' (' + raidBreakdown(S.raid.target, S.raid.team).pool + ' dés)'`);
    case 'espion': return run(`(() => { const id = ${q(args[0] || '')} || (coupPending()[0] || [])[0]; return id ? (cmd('spy', { id }) || 'coup déjoué : ' + racer(id).master + ' rentre bredouille') : 'aucun coup en préparation'; })()`);
    case 'livre': return run(`(() => { const B = bookState(), c = bookCur(), mine = chapScore(c); return 'Chapitre ' + ROMAN(c.n) + ', l’Ère ' + c.name + ' (nuits ' + c.from + ' à ' + c.to + ') · toi ' + Math.round(mine) + ' pts · ' + Object.entries(c.rivals).map(([k, v]) => racer(k).name + ' ' + Math.round(v)).join(', ') + ' · stickers du chapitre : ' + (c.mine.map(x => x.t || (MOM_BY[x.id] || {}).t || x.id).join(', ') || 'aucun') + ' · chapitres passés : ' + B.ch.filter(x => x.age).map(x => ROMAN(x.n) + ' ' + AGES[x.age].name + (x.pact ? ' (pacte ' + PACT_BY[x.pact].name + ')' : '') + (x.relics && x.relics.length ? ' (relique ' + x.relics.map(id => RELIC_BY[id].name).join(', ') + ')' : '')).join(' ; ') + ' · reliques : ' + (B.relics.map(r => (RELIC_BY[r.id] || { name: r.id, d: '' }).name + ' : ' + (RELIC_BY[r.id] || { d: '' }).d).join(' ; ') || 'aucune') + (B.pact && PACT_BY[B.pact.id] ? ' · pacte en cours : ' + PACT_BY[B.pact.id].name + ' (sans écran, le pacte d’un âge sombre est choisi tout seul : le premier proposé)' : ''); })()`);
    case 'state': return 'l’état complet suit';
    case 'nemesis': case 'némésis': { const k = { capturer: 'jail', corrompre: 'spy', recruter: 'ally' }[(args[0] || '').toLowerCase()];
      return run(`(() => { const N = S.foeHero; if (!N) return 'pas encore de héros némésis'; const st = { active: 'court toujours (repoussé·e ' + (N.beaten || 0) + '/3 fois)', spy: 'travaille déjà pour toi', ally: 'défend déjà ton Cœur', captive: 'croupit déjà dans tes cachots' }[N.st];
        if (N.st !== 'mercy') return N.name + ' ' + (st || 'n’est pas à ta merci'); if (!${q(k || '')}) return N.name + ' est à ta merci : nemesis capturer (+5 notoriété, sa famille paie 4 or par nuit pendant 10 nuits) | corrompre (40 or : +1 énergie au premier tour du combat du Cœur, à chaque invasion) | recruter (il change de camp et défend ton Cœur)';
        if (${q(k || '')} === 'spy' && S.gold < 40) return 'il te faut 40 or pour le corrompre (tu en as ' + S.gold + ')'; nemDecide(${q(k || '')}); return N.name + ' : ' + { captive: 'aux cachots', spy: 'corrompu·e, il te renseigne', ally: 'recruté·e, il défend ton Cœur' }[N.st]; })()`); }
    case 'liberer': case 'libérer': { const nm = args.join(' ').toLowerCase(); return run(`(() => { const caps = S.creatures.filter(c => c.captive); if (!caps.length) return 'aucune créature enlevée'; const c = ${q(nm)} ? caps.find(x => x.name.toLowerCase() === ${q(nm)}) : caps[0]; if (!c) return 'pas de créature enlevée de ce nom (enlevées : ' + caps.map(x => x.name).join(', ') + ')'; const cost = captiveRansom(c), e = cmd('ransomCaptive', { id: c.id }); return e ? (e === 'Pas assez' ? 'il te faut ' + cost + ' or (tu en as ' + S.gold + ')' : e) : c.name + ' rentre au château (−' + cost + ' or)'; })()`); }
    case 'annuler': return run(`S.raid ? (cancelRaid(), 'raid ou expédition annulé·e') : 'rien de prévu'`);
    case 'tactique': { const t = { combat: 'combat', postes: 'combat', cible: 'combat', harceler: 'combat', rancon: 'rancon', 'rançon': 'rancon' }[args[0]]; if (!t) return 'tactique combat | rancon (les anciennes tactiques postes, cible et harceler n’existent plus : la bande traverse le château et tes créatures se battent)';
      return run(t === 'rancon' ? `(() => { S.opts = S.opts || {}; S.opts.cliTac = 'rancon'; const pp = partyPreview(), cost = ransomCost({ party: Array(pp.size).fill(0), rank: pp.rank || 1 });
        return 'tactique des prochaines invasions : acheter leur départ (4 or par héros et par rang, au plus ton or : la prochaine bande, environ ' + pp.size + ' héros de rang ' + (pp.rank || 1) + ', coûterait ' + Math.min(S.gold, cost) + ' or ; tu en as ' + S.gold + ')' + (pp.origin && pp.origin.crusade ? '. ⚠️ C’est la croisade de Mirebrume : elle ne se vend pas, tes créatures la combattront quand même' : ''); })()` : `(S.opts = S.opts || {}, delete S.opts.cliTac, 'tactique des prochaines invasions : combattre')`); }
    case 'expe': { if (SIEGE_ALIAS.includes((args[0] || '').toLowerCase())) return siegePlan(args.slice(1).join(' '));
      const id = (args[0] || '').replace(/^x_/, ''); if (/^r_/.test(id)) return run(`A.raid(${q(id)}) || 'expédition prévue contre le donjon rival : ' + S.raid.team.map(id => critter(id).name).join(', ') + '. Elle se jouera en automatique cette nuit ; pour la jouer à la main : node sim/play.mjs crawl <fichier> start ${id}'`); return run(`A.expedition(${q(id)}) || 'expédition partie'`); }
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
    case 'journal': { const sub = (args[0] || '').toLowerCase(), n = +args[1] || 0, o = +args[2] || 0;
      if (sub === 'auto') return run(`A.questStep(), (() => { const Q = qState(); return 'en cours : ' + (Q.cur.map(q => q.def.title + ' (' + ((qStep(q) || {}).k || 'fini') + ')').join(', ') || 'aucune') + ' ; au tableau : ' + (Q.offers.map(o => o.def.title).join(', ') || 'rien'); })()`);
      const verb = { accepter: ['offers', 'questAccept'], refuser: ['offers', 'questDecline'], choisir: ['cur', 'questChoose'], payer: ['cur', 'questPay'], livrer: ['cur', 'questPay'], abandonner: ['cur', 'questAbandon'] }[sub];
      if (sub && !verb) return 'journal | journal accepter <n> | refuser <n> | choisir <n> <option> | payer <n> | abandonner <n> | auto';
      if (verb) return run(`(() => { const Q = qState(), L = Q.${verb[0]}, q = L[${n} - 1]; if (!q) return 'pas de quête n° ${n} ${verb[0] === 'offers' ? 'au tableau' : 'en cours'} (voir : journal)';
        const e = cmd('${verb[1]}', { id: q.id, o: ${o} - 1 }); return e || '${{ accepter: 'quête acceptée', refuser: 'quête refusée', choisir: 'choix fait', payer: 'livré', livrer: 'livré', abandonner: 'quête abandonnée' }[sub]} : ' + q.def.title; })() + '\\n' + A.journalText()`);
      return run(`A.journalText()`); }
    case 'chantier': case 'chantiers': return args[0] ? run(`cmd('chantier', { id: ${q(args[0])} }) || 'grand chantier lancé : ' + CHANTIERS[${q(args[0])}].name + ' (' + CHANTIERS[${q(args[0])}].nights + ' nuits)'`)
      : run(`Object.entries(CHANTIERS).map(([k, C]) => k + ' (' + C.name + ') : ' + C.desc + ' · ' + (chantierDone(k) ? 'bâti' : costText(C.cost) + ', ' + C.nights + ' nuits' + (chantierWhy(k) ? ' — ' + chantierWhy(k) : ' — possible'))).join('\\n') + (chantierState().cur ? '\\nEn cours : ' + CHANTIERS[chantierState().cur.id].name + ', encore ' + chantierState().cur.left + ' nuit(s)' : '')`);
    case 'mecenat': case 'mécénat': return args[0] ? run(`(() => { const s = siteById(${q(args[0])}); const e = cmd('mecenat', { id: ${q(args[0])}, gold: ${args[1] === 'or'} }); return e || 'embellissement lancé : ' + mecName(s, mecState().cur.lv) + ' à ' + s.name + ' (' + mecState().cur.left + ' nuits)'; })()`)
      : run(`(() => { const L = mecSites(); if (!L.length) return 'aucun village connu'; return L.map(s => { const lv = mecLv(s.id), w = mecWhy(s), c = mecCost(s); return s.id + ' ' + s.name + ' [' + s.kind + '] ' + '★'.repeat(lv) + '☆'.repeat(3 - lv) + (lv >= 3 ? ' : embelli, un panier de ' + (MEC_BASKET[s.kind] || 6) + ' or à chaque fête' : ' : prochain « ' + mecName(s, lv) + ' » ' + costText(c) + ' (ou ' + allGold(c).g + ' or), ' + MEC_NIGHTS[lv] + ' nuits → bonne volonté +' + MEC_GW[lv] + ', +' + MEC_GLOW[lv] + ' rayonnement, un ' + FURN[MEC_GIFT[lv]].name + (lv === 2 ? ', et un panier à chaque fête' : '') + (w ? ' — ' + w : ' — possible')); }).join('\\n') + (mecState().cur ? '\\nEn cours : ' + mecName(siteById(mecState().cur.site), mecState().cur.lv) + ' à ' + siteById(mecState().cur.site).name + ', encore ' + mecState().cur.left + ' nuit(s)' : ''); })()`);
    case 'concours': { const sub = (args[0] || '').toLowerCase();
      if (sub === 'inscrire') return run(`cmd('concours') || 'inscrit·e au concours « ' + concDef().name + ' »'`);
      if (sub === 'preparer' || sub === 'préparer') return run(`cmd('concours', { prep: true, gold: ${args[1] === 'or'} }) || 'préparatifs ' + S.concours.prep + '/3 : ta note ' + concMine() + ' (favoris vers ' + String(concRivalLevel() + 1.5).replace('.', ',') + ')'`);
      if (sub) return 'concours | concours inscrire | concours preparer [or]';
      return run(`(() => { if (concOpen()) return A.pending().find(l => /Concours/.test(l)); const C = S.concours; return (C && C.done ? 'Le jury a rendu son verdict (voir la chronique). ' : '') + (S.night < CONC_FROM ? 'Le premier concours sera annoncé à la nuit ' + CONC_FROM + '.' : 'Prochain concours au début de la saison suivante, dans ' + (SEASON_LEN - seasonDay() + 1) + ' nuit(s).'); })()`); }
    case 'caravane': { const how = { pille: 'pille', piller: 'pille', escorte: 'escorte', escorter: 'escorte', commerce: 'commerce', commercer: 'commerce', vendre: 'commerce' }[(args[0] || '').toLowerCase()];
      if (args[0] && !how) return 'caravane | caravane pille | caravane escorte | caravane commerce [bois]';
      if (!how) return run(`(() => { const L = A.pending().filter(l => /Caravane/.test(l)); return L.length ? L.join('\\n') : 'aucune caravane sur les routes en ce moment (une passe de temps en temps)'; })()`);
      return run(`(() => { const cv = activeCaravans().find(x => !x.done); if (!cv) return 'aucune caravane sur les routes'; const m0 = S.mat, g0 = S.gold; const e = cmd('caravan', { id: cv.id, how: ${q(how)}, n: ${+args[1] || 0} }); if (e) return e;
        return ${q(how)} === 'commerce' ? 'marché conclu : ' + (m0 - S.mat) + ' 🪵 vendus pour ' + (S.gold - g0) + ' or (la caravane peut encore t’acheter ' + caravanBuys(cv) + ' 🪵)' : cv.done === 'pille' ? 'caravane pillée : ' + cv.res : cv.done === 'rate' ? 'le pillage tourne mal : ' + cv.res : 'caravane escortée : ' + cv.res; })()`); }
    case 'marchand': return args[0] ? run(`cmd('merchant', { k: ${q(args[0])} }) || 'acheté : ' + itemName(${q(args[0])}) + ' (dans ta réserve : decor ' + ${q(args[0])} + ' pour le coller)'`)
      : run(`merchantHere() ? A.pending().find(l => /Marchand/.test(l)) : 'pas de marchand ambulant cette nuit'`);
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
// les décisions en attente, par genre (pour arrêter « night » quand une nouvelle arrive)
const PENDING = () => JSON.parse(g.run(`JSON.stringify(typeof A.pending === 'function' ? A.pending().map(l => (l.match(/^(🏆|🛒 Caravane de [^(]+|🏪|📜 Journal : \\d+ quête\\(s\\) au tableau, [1-9]|🎀|🏗️)/) || [])[1]).filter(Boolean).map(k => ({ '🏆': 'concours', '🏪': 'marchand ambulant', '🎀': 'mécénat', '🏗️': 'chantier' })[k] || (/^🛒/.test(k) ? 'caravane' : 'étape de quête')) : [])`));
const FORECAST = `(() => { const rm = S.raid && !S.raid.crawl && RAIDS[S.raid.target] ? (RAIDS[S.raid.target].menace || 0) : 0;
  const due = S.menace + (S.hype >= 3 ? 1 : 0) + rm >= MENACE_MAX || (typeof filBandDue === 'function' && filBandDue()); if (!due) return '';
  const snap = JSON.stringify(S), rnd = Math.random, out = []; Math.random = mulberry32(S.night * 7919 + 13);
  const back0 = () => { Object.keys(S).forEach(k => delete S[k]); Object.assign(S, JSON.parse(snap)); WORLD = null; dirty(); };
  const back = () => { back0(); if (S.raid && S.raid.team) S.raid.team.forEach(id => { const c = critter(id); if (c && !c.raid) c.raid = 'prévu'; }); };   // l'équipe du raid prévu sera partie
  let n = 0, price = [], gold = S.gold, fights = 0; const o = { repelled: 0, lost: 0, robbed: 0 };
  try { for (let i = 0; i < 24; i++) { back(); const plan = planInvasion(); if (!plan || !plan.party || !plan.party.length) continue; n++; price.push(Math.min(S.gold, ransomCost(plan))); const R = typeof invResolve === 'function' ? invResolve(plan) : resolveInvasion(plan, 'postes'); o[R.outcome] = (o[R.outcome] || 0) + 1; fights += R.inv2 ? R.inv2.fights : 0; } } finally { back0(); Math.random = rnd; }
  if (!n) return ''; price.sort((a, b) => a - b); const lo = price[0], hi = price[price.length - 1], rancon = S.opts && S.opts.cliTac === 'rancon';
  let extra = '', ban = '';
  try { back(); Math.random = mulberry32(S.night * 7919 + 99); const plan = planInvasion(), I = invNew(plan), B = invBalance(I); ban = invRansomBan(plan);
    extra = '\\n   La bande : ' + B.band.n + ' héros, ' + B.band.hp + ' PV en tout, environ ' + B.band.hit + ' par coup, niveau ' + String(I.lvl).replace('.', ',') + ' · ton Cœur : ' + (B.heart.names.length ? B.heart.names.join(', ') + ' (' + B.heart.hp + ' PV, ' + String(B.heart.atk).replace('.', ',') + ' en attaque)' : 'personne !') + ' · parcours : ' + (I.route.length - 1) + ' pièces, combats aux cartes par invasion : ' + (fights / n).toFixed(1).replace('.', ',') + ' en moyenne.'
      + invAdvice(I, 5).map(a => '\\n   ' + a[0] + ' ' + a[1]).join('') + '\\n   (règles : wiki invasion)'; } catch (e) {} finally { back0(); Math.random = rnd; }
  return '\\n⚔️ Une bande arrivera sans doute cette nuit. Estimation sur ' + n + ' essais si tes créatures se battent (combat auto) : repoussée ' + Math.round(o.repelled / n * 100) + ' %' + (o.lost ? ', égarée ' + Math.round(o.lost / n * 100) + ' %' : '') + ', Cœur pillé ' + Math.round(o.robbed / n * 100) + ' %. '
    + (ban ? ban + (rancon ? ' — ta tactique « rançon » attendra la bande suivante.' : '') : 'Acheter leur départ (tactique rancon) : ' + (lo === hi ? lo : lo + ' à ' + hi) + ' or (tu en as ' + gold + ')' + (rancon ? ' — tactique actuelle : rançon, la bande sera payée.' : ' — tactique actuelle : combat.')) + extra; })()`;
// la veille : une bande approche (Menace presque pleine), ce qui manque à ta défense
const SOON = `(() => { if (S.menace < MENACE_MAX - 2 || typeof invAdvice !== 'function') return ''; const rm = S.raid && !S.raid.crawl && RAIDS[S.raid.target] ? (RAIDS[S.raid.target].menace || 0) : 0; if (S.menace + (S.hype >= 3 ? 1 : 0) + rm >= MENACE_MAX) return '';
  const adv = invAdvice(null, 4), heart = invHeartCrew(); return '\\n⚔️ Des aventuriers approchent (Menace ' + S.menace + '/' + MENACE_MAX + ') : au Cœur, ce soir, ' + (heart.length ? heart.map(c => c.name).join(', ') : 'personne') + '.' + adv.map(a => '\\n   ' + a[0] + ' ' + a[1]).join(''); })()`;
const ST = () => g.run('simState(true)') + g.run(FORECAST) + g.run(SOON) + g.run(`(typeof payroll === 'function' && payroll() ? (typeof wageDue === 'function' ? '\\n💰 Gages à l’aube : ' + wageDue() + ' or' + (payDebt() ? ' (dont ' + payDebt() + ' d’ardoise, à solder d’ici le jour de paie)' : '') + ' · paie de la semaine : ' + payroll() + ' or pour 5 nuits · jour de paie (les comptes) dans ' + nightsToPay() + ' nuit(s) · tu as ' + S.gold + ' or' : '\\nJour de paie dans ' + nightsToPay() + ' nuit(s) : ' + payroll() + ' or (tu en as ' + S.gold + ')') : '') + (typeof coupPending === 'function' ? coupPending().map(([id, c]) => '\\n🗡️ Coup en préparation : ' + racer(id).master + ' ' + COUPS[id].t + ' dans ' + Math.max(0, c.at - S.night) + ' nuit(s) (perte : ' + COUPS[id].loss() + '). Parade : expédition r_' + id + ' qui passe une salle, ou « espion ' + id + ' » (' + coupCost() + ' or).').join('') : '') + (typeof bookCur === 'function' && S.book ? (() => { const c = bookCur(), mine = chapScore(c), best = Math.max(0, ...Object.values(c.rivals)); return '\\n📖 Chapitre ' + ROMAN(c.n) + ', l’Ère ' + c.name + ' : encore ' + Math.max(0, c.to - S.night) + ' nuit(s) · toi ' + Math.round(mine) + ' pts, meilleur rival ' + Math.round(best) + ' pts (premier : âge d’or et relique ; dernier : âge sombre). Détail : action « livre ».'; })() : '') + (S.foeHero && S.foeHero.st === 'mercy' ? '\\n🗝️ ' + S.foeHero.name + ' est à ta merci : décide de son sort avec « nemesis capturer | corrompre | recruter ».' : '') + S.creatures.filter(c => c.captive).map(c => '\\n🪤 ' + c.name + ' est retenu·e au village : rançon ' + captiveRansom(c) + ' or (« liberer ' + c.name + ' »), ou évasion à l’aube de la nuit ' + c.captive + '.').join('') + (typeof siegeShut === 'function' && siegeShut() ? '\\n🚪 Mirebrume a fermé ses portes après ta fuite : prochain assaut possible à la nuit ' + siegeShut() + '.' : '') + (typeof A.pending === 'function' && A.pending().length ? '\\n\\nÀ décider :\\n' + A.pending().map(l => '  ' + l).join('\\n') : '') + (S.fil ? '\\n\\n' + filText() : '')`);
// les actions qu'on peut aussi lancer hors de « do » (node sim/play.mjs victoires <fichier>)
const ACTIONS = ['victoires', 'livre', 'journal', 'fil', 'merveilles', 'stock', 'state', 'nemesis', 'liberer', 'espion', 'chantier', 'chantiers', 'mecenat', 'concours', 'caravane', 'marchand'];
const KEY = /^\d+\. |^Le Cœur — |^Défenseurs :|^Bilan :|^Pourquoi|ne se vendent pas|ardoise|saison change|Jour de paie|caravane|marchand ambulant|barde|inspecteur|concours|Concours|Mécénat|inaugure|panier garni|C’est la |Grand chantier|Calamité|🤖|blessures|portes|Invasion :|Butin|Complication|Trophée|détalent|abandonnent|expédition|Expédition|🧭|Victoire|Grand Maître|ère|vassal|Reddition|Conseil|croisade|Croisade|Parade|Rituel|déserté|Calamité !|pillé|Les aventuriers|Les héros touchent|repouss|Chantier terminé|Chapitre|Quête|quête|sticker|Relique d’ère|Âge|Le Livre|coup se prépare|Coup déjoué|vident ta réserve|chez elle|emportent|rumeurs dans tout|enlèvent|tribut|rôdent dehors|quitte|part vivre|délaissé|chez lui|chez elle|impayé|Caisse|arrive|s’installe|artefact|Artefact|rencontre|requête|Requête|Palier/;
// l'expédition jouée à la main : la graine et les actions sont gardées dans le fichier de partie, le château ne change qu'à la fin
if (cmd === 'crawl') {
  const d = load(), words = rest.join(' ').trim();
  const show = () => { g.ctx.__C = d.crawl; return g.run('cliCrawlText(cliCrawlRun(__C))'); };
  if (words.startsWith('start')) {
    if (d.crawl) { console.log('Une expédition est déjà en cours :\n' + show()); process.exit(0); }
    const parts = words.split(/\s+/), bagArg = parts.find(x => /^sac=/.test(x)), [, target1, ...names] = parts.filter(x => x !== bagArg); const nm = names.join(' ');
    const target0 = SIEGE_ALIAS.includes((target1 || '').toLowerCase()) ? 'mirebrume' : target1;
    g.ctx.__T = target0 || ''; g.ctx.__N = nm; g.ctx.__BAG = bagArg ? bagArg.slice(4).split(',').map(x => x.trim()).filter(Boolean) : null;
    if (g.ctx.__BAG) { const bad = JSON.parse(g.run(`JSON.stringify((() => { const pool = castlePool(); if (__BAG.length > BAG_SIZE) return 'le sac prend ' + BAG_SIZE + ' cartes au plus'; const no = __BAG.filter(k => !pool.includes(k)); if (no.length) return 'pas dans ton château : ' + no.join(', ') + ' (cartes possibles : ' + pool.map(k => k + ' = ' + CASTLE_CARDS[k].name).join(', ') + ')'; if (new Set(__BAG).size < __BAG.length) return 'une carte du château ne va qu’une fois dans le sac'; return ''; })())`)); if (bad) { console.log('⚠️ Sac impossible : ' + bad); process.exit(0); } }
    const err = g.run(`(() => { let t = __T; if (!RAIDS[t] && RAIDS['x_' + t]) t = 'x_' + t; if (!RAIDS[t] && typeof ensureCrawlSites === 'function') { ensureCrawlSites(); if (!RAIDS[t] && RAIDS['x_' + t]) t = 'x_' + t; }
      if (!RAIDS[t] || !isCrawlTarget(t)) return 'cible d’expédition inconnue : ' + __T + ' (un site de « Lieux connus », x_lieu, r_rival ou mirebrume)';
      if (RAIDS[t].siege && !allVassals()) return 'le Siège de Mirebrume attend que les quatre donjons rivaux soient tes vassaux (' + RIVALS.filter(r => isVassal(r.id)).length + '/4)';
      let ids = __N ? __N.split(',').map(s => s.trim().toLowerCase()).filter(Boolean).map(n => (S.creatures.find(c => c.name.toLowerCase() === n) || {}).id).filter(Boolean) : free().map(c => [c, crawler(c)]).sort((a, b) => b[1].hp * b[1].atk - a[1].hp * a[1].atk).slice(0, 4).map(x => x[0].id);
      if (!ids.length) return 'personne ne peut partir';
      return cmd('raidPlan', { target: t, team: ids }) || null; })()`);
    if (err) { console.log('⚠️ ' + err); process.exit(0); }
    d.crawl = { seed: Math.floor(Math.random() * 1e9), uid0: JSON.parse(g.run('CARD_UID')), actions: [], v: 2, bag: g.ctx.__BAG || null };
    store(d); g.ctx.__C = d.crawl; console.log(show() + '\n' + g.run(`(() => { const X = cliCrawlRun(__C), pool = castlePool(), inBag = X.R.deck.filter(c => c.src === 'castle').map(c => c.key); return '🎒 Sac' + (__C.bag ? ' (choisi)' : ' (rempli tout seul ; pour choisir : crawl <fichier> start <cible> [Noms] sac=a,b,c,d)') + ' : ' + (inBag.map(k => k + ' = ' + CASTLE_CARDS[k].name).join(', ') || 'vide') + ' · cartes de ton château : ' + (pool.map(k => k + ' = ' + CASTLE_CARDS[k].name).join(', ') || 'aucune'); })()`)); process.exit(0);
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
    const auto = JSON.parse(g.run(`(() => { const g0 = S.gold, s0 = S.mat, f0 = S.furn.length; A.care(); A.quests({ noBuild: true }); const want = S.creatures.filter(c => { const q = questOf(c); return q && q.st === 'active' && q.k === 'piece'; }).map(c => c.name + ' : ' + ROOMS[questOf(c).room].name);
      return JSON.stringify({ g: g0 - S.gold, s: s0 - S.mat, f: S.furn.length - f0, want }); })()`));
    if (auto.g > 0 || auto.s > 0 || auto.f > 0) lines.push(`N${JSON.parse(g.run('S.night'))} 🤖 Soins automatiques (care, quests) : ${auto.f > 0 ? auto.f + ' sticker(s) posé(s), ' : ''}−${Math.max(0, auto.g)} or${auto.s > 0 ? ', −' + auto.s + ' bois' : ''}.`);
    if (auto.want.length && i === 0) lines.push(`N${JSON.parse(g.run('S.night'))} 🤖 Envies de pièce (rien n’est construit pour toi : build <pièce>) : ${auto.want.join(' ; ')}.`);
    const pend0 = PENDING();
    const rep = JSON.parse(g.run('JSON.stringify(simNight())'));
    rep.filter(l => l[0] !== 'sec' && KEY.test(l[1])).forEach(l => lines.push(`N${JSON.parse(g.run('S.night')) - 1} ${l[0]} ${l[1]}`));
    if (JSON.parse(g.run('S.raid ? 1 : 0'))) break;
    // une nouvelle décision vient d'arriver (marchand, caravane, concours, étape de quête à choisir) : on s'arrête pour te laisser décider
    const fresh = PENDING().filter(k => !pend0.includes(k));
    if (fresh.length && i < n - 1) { lines.push(`⏸️ Arrêt à la nuit ${JSON.parse(g.run('S.night'))} : une décision t’attend (${fresh.join(', ')}). Voir « À décider » plus bas.`); break; }
  }
  store(d); console.log(lines.slice(-70).join('\n') + '\n\n' + ST());
} else if (ACTIONS.includes(cmd) && file && fs.existsSync(file)) {
  const d = load(), line = [cmd, ...rest].join(' '), out = act(line);
  g.run('checkGoals(); checkQuests(); checkAch(); if (typeof filCheck === "function") filCheck();'); store(d); console.log(`> ${line} → ${out}` + (cmd === 'state' ? '\n\n' + ST() : ''));
} else if (ACTIONS.includes(cmd)) console.log(`⚠️ « ${cmd} » a besoin du fichier de partie : node sim/play.mjs ${cmd} <fichier>${cmd === 'stock' ? ' <lieu>' : ''} (ou node sim/play.mjs do <fichier> "${cmd}").`);
else console.log(`⚠️ Commande inconnue : ${cmd}. Les commandes : new, state, do, night, crawl, wiki, help ; les actions (build, furnish, raid…) passent par do : node sim/play.mjs do <fichier> "${cmd} …".\n\n` + HELP);
