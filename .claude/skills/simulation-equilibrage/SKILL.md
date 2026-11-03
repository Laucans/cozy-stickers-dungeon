---
name: simulation-equilibrage
description: Lance des simulations ultra-rapides de Cozy Stickers Dungeon (IA scriptées, et joueurs Sonnet si besoin) pour mesurer l'équilibrage — victoires, ères des rivaux, invasions, économie, âmes des créatures — et comparer l'effet d'un changement de règles. À utiliser dès qu'on parle de simulation, d'équilibrage, de balance, de bots ou d'IA joueuses, ou avant/après une modification des règles du jeu.
---

# Simulation d'équilibrage — Cozy Stickers Dungeon

Le banc d'essai fait tourner **le vrai code du jeu** (`src/`) dans Node, sans affichage : une nuit simulée prend moins d'une milliseconde, une partie de 150 nuits moins d'une seconde. Tout est dans `sim/`, à la racine du projet.

| Fichier | Rôle |
|---|---|
| `sim/engine.mjs` | Charge les fichiers de `src/` (la liste `PARTS` de `build.sh`, sans `p15_start`) dans une VM Node avec un faux navigateur. `CSD_SRC=dossier` pour mesurer une autre copie des sources. |
| `sim/sim_core.js` | La nuit sans fenêtres (`simNight`), une nouvelle partie (`simNewGame(graine, thème)`), le résumé (`simSummary`), les actions de haut niveau `A.*` et l'état lisible `simState()`. |
| `sim/bots.js` | Les IA : `idle`, `negligent`, `casual`, `legende`, `terreur`, `voisinage`, `menagerie`, `secrets`, et `simPlay(ia, graine, nuitsMax)`. |
| `sim/run.mjs` | Lot parallèle (worker_threads) → `sim/results.json`. |
| `sim/report.mjs` | Agrège un fichier de résultats en tableaux Markdown (`--json` pour la version machine). |
| `sim/play.mjs` | Une partie pas à pas en ligne de commande, pour un joueur Sonnet ou pour toi, plus le Grimoire du jeu en texte (`wiki`). |

## 1. Lancer un lot et lire le rapport

```bash
node sim/run.mjs 60 150
node sim/report.mjs > sim/RAPPORT.md
```

- Arguments : parties par IA (60), nuits maximum (150). 480 parties prennent environ 90 s sur 9 cœurs.
- Une partie s'arrête dès que l'IA gagne la victoire qu'elle vise : les moyennes « fin de partie » mélangent donc des parties de longueurs différentes. Les courbes (nuit 10, 20…) ne comptent que les parties encore en cours.
- Graines : `1000 + i × 7919 + n° de l'IA`, donc deux lots identiques donnent les mêmes chiffres. Pour un vrai avant/après, garde les graines et ne change que les règles.

Sections du rapport : victoire visée (taux, nuit médiane et 10e–90e centiles), toutes les victoires, rivaux et ères, invasions et raids, progression (paliers, étages, première créature rare), âmes (calamités, désertions, missions, hauts faits, expéditions), fin de partie, courbes par IA, puis diagnostics (invasions par rang avec courage contre dégâts, croisade, notoriété finale, delta de calamité, missions bloquées, ce qui manque pour le palier 3, espèces jamais vues).

## 2. Mesurer l'effet d'un changement de règles

Le plus sûr : modifier une **copie** des sources et comparer, sans toucher au jeu.

```bash
cp -R src sim/src_test
```

Modifie `sim/src_test/…` (par exemple le gain du Baron au Conseil dans `p25_victory.js`), puis :

```bash
cp sim/results.json sim/results_avant.json
```

```bash
CSD_SRC=sim/src_test node sim/run.mjs 60 150
```

```bash
node sim/report.mjs sim/results_avant.json > sim/RAPPORT_avant.md
```

```bash
node sim/report.mjs > sim/RAPPORT_apres.md
```

Compare les deux rapports, puis supprime `sim/src_test`. Quand le changement est validé, reporte-le dans `src/` et relance un lot sans `CSD_SRC`. Même principe pour figer une version pendant qu'on modifie `src/` (exemple : `CSD_SRC=sim/src_v10`).

## 3. Les IA

| IA | Ce qu'elle fait |
|---|---|
| `idle` | Rien : la course des rivaux et les invasions à l'état brut. |
| `negligent` | Bâtit et pille comme `casual`, mais ne caresse, ne gâte, ne rassure jamais et ne gère pas les missions. Sert à vérifier que désertions et calamités existent. |
| `casual` | Joueur tranquille : bâtit la liste de base, meuble, soigne, pille une ferme toutes les 3 nuits. |
| `legende` | Rayonnement (étages, artefacts, expéditions, achats en ville), puis croisade avec pièges, mercenaire et faux avis de recherche. |
| `terreur` | Raids sur les rivaux puis siège de Mirebrume. |
| `voisinage` | Requêtes, dons, rumeurs, exploration pour gagner des voix au Conseil. |
| `menagerie` | Album complet (étages, décors qui attirent, expéditions), légendes, épanouissement, Grande Parade. |
| `secrets` | Carte, artefacts, Reliquaire, Rituel des Douze. |

Toutes (sauf `idle` et `negligent`) partagent `common()` : soins chaque nuit, missions intelligentes (`A.quests` accepte ce qui est faisable, s'en occupe, refuse le reste), palier dès que possible, économie (`econ`), pièges quand des héros approchent (`defend`, budget qui grandit avec l'or), gardes rappelés au Cœur et sur le chemin la nuit d'une invasion (`A.posts`), Trône posé pour le palier 3, remparts agrandis quand on manque de place.

Ajouter une IA : une fonction dans `BOTS` (`sim/bots.js`), son nom dans `BOTS` de `sim/run.mjs`, son libellé dans `NAMES` de `sim/report.mjs`, et sa victoire dans `BOT_GOAL` si elle en vise une.

## 4. Jouer pas à pas (joueur Sonnet ou humain)

```bash
node sim/play.mjs new partie.json 4242
```

```bash
node sim/play.mjs do partie.json "build dortoir; build potager; furnish all; posts"
```

```bash
node sim/play.mjs night partie.json 5
```

```bash
node sim/play.mjs wiki v_menagerie
```

- `furnish <pièce|all> [or]` accepte un plafond de dépense ; `build <pièce> 9` construit dans les Jardins (dehors) et `foret` rachète une parcelle de forêt pour les agrandir.
- `state` réaffiche l'état ; `help` liste les actions (build, furnish, decor, traps, posts, raid, expe, scout, shop, stock, request, tier, expand, floorup, floordown, project, power, care, quests).
- `night` fait d'abord les soins et les missions, rappelle les gardes si des héros arrivent, joue jusqu'à 10 nuits et s'arrête plus tôt si un raid est prévu.
- `wiki` sans argument liste les articles du Grimoire.

Pour faire jouer Sonnet, lance un agent avec l'outil Agent (`model: "sonnet"`, en arrière-plan), un fichier de partie par agent dans le dossier temporaire, et une consigne de ce type :

> Tu joues à Cozy Stickers Dungeon en ligne de commande, depuis la racine du projet. Commence par `node sim/play.mjs help`, puis lis `node sim/play.mjs wiki but`, `wiki victoires` et l'article de la victoire visée. Crée ta partie avec `node sim/play.mjs new <fichier> <graine>`. À chaque tour : lis l'état, donne quelques actions avec `do`, puis avance avec `night` (1 à 10 nuits). Objectif : <la victoire visée, ou la plus rapide possible>, en 150 nuits au plus. Ne modifie aucun fichier. À la fin, rends : la nuit de victoire (ou ta progression), ta stratégie en 5 lignes, ce qui t'a semblé trop facile ou trop dur, et les règles que tu as trouvées confuses.

Compare ensuite sa nuit de victoire aux repères des IA scriptées.

## 4 bis. Sondes : combats d'invasion et expéditions

Deux outils mesurent l'intérêt des combats, pas seulement qui gagne.

```bash
node sim/combat_probe.mjs 4 24
```

Rejoue chaque invasion de parties simulées (`casual`, `legende`, `terreur`, `menagerie`, `voisinage`) 24 fois par tactique, et sans pouvoirs du Cœur. Mesures : part d'invasions « gagnées d'avance » (< 5 % de risque) ou « tendues » (30–70 %), poids de la tactique (écart entre la meilleure et la pire, et laquelle gagne selon le but de la bande), effet des pouvoirs, combats et échanges par invasion, coups d'éclat (talents), créatures sonnées. Repères (version 15) : 40 % gagnées d'avance, 24 % tendues, la tactique change l'issue de plus de 15 points dans 58 % des invasions, les pouvoirs divisent les échecs par deux.

```bash
node sim/crawl_probe.mjs 2 30
```

Prend des châteaux simulés aux nuits 15, 30, 50 et 80, envoie leurs 4 meilleures créatures dans chaque donjon (les quatre rivaux, la Forêt enchantée, la Grotte : des expéditions en cartes, deck tiré de l'équipe et du château, sac choisi automatiquement) avec un joueur prudent (rentre sous 55 % de PV, ne tente le boss qu'à 80 %, fuit un combat perdu) et un joueur audacieux. Mesures : boss vaincu, équipe terrassée, retraite, fuite, salles franchies, or rapporté. `CRAWL_JS="CRAWL_EN.krouk.hp = 60"` exécute un réglage d'essai avant la sonde ; `CRAWL_TUNE_JSON='{"hpL":.3}'` remplace des réglages de `CRAWL_TUNE` le temps d'un essai. Repères (version 15, `CRAWL_TUNE` : boss ×1,65, +30 % de PV par étage) : prudent 17–29 % de boss, 6–9 % terrassées, le reste en retraite ou en fuite ; audacieux 23–37 % de boss, 14–15 % terrassées. Les reliques des boss rendent les expéditions suivantes plus faciles (la sonde part de châteaux sans relique).

## 5. Repères (version 10 du jeu, lot v2 : 8 IA × 60 parties, 150 nuits)

Voir `sim/RAPPORT.md` pour le détail ; les chiffres clés servent de point de comparaison après un changement de règles.

| Mesure | Repère v2 | Lecture |
|---|---|---|
| Victoire visée (taux · nuit médiane) | Terreur 92 % · 43 ; Légende 93 % · 52 ; Secrets 100 % · 64 ; Voisinage 100 % · 80 ; Ménagerie 32 % · 81 | Terreur la plus rapide, Ménagerie la plus dure. |
| Légende « sans le vouloir » | `casual` 100 % · 61 ; `negligent` 100 % · 78 | Le rayonnement monte tout seul : la Légende vient en jouant normalement. |
| Ère du Baron | nuit 60 dans 100 % des parties sans stratégie | Le Conseil donne au Baron un rythme fixe ; il remet les autres rivaux à zéro. |
| Invasions repoussées | 93–100 % pour les IA qui rappellent leurs gardes ; croisade 29–45 % pour `legende`/`secrets` | La défense du Cœur grandit avec le nombre de créatures, le courage des héros plafonne. |
| Raids réussis | 99–100 % | Le risque des raids est presque nul avec 3–4 dés. |
| Or · bois · notoriété en fin (`casual`) | ~3 400 · ~6 100 · ~4 300 | Pas de dépense de fin de partie ; la notoriété ne redescend jamais. |
| Calamités · désertions | 0 · 0 (soins) ; `negligent` : 0 calamité, 1,2 désertion par partie | L'apaisement (jusqu'à −70/nuit) écrase la promiscuité. |
| Missions réussies | `casual` ~64 par partie | Une mission acceptée ne s'abandonne pas : si elle devient impossible, l'emplacement reste bloqué. |
| Ménagerie bloquée par | 5 légendes (moitié des échecs) ; une seule créature sous 70 d'épanouissement sur 80–100 | Condition « toutes » fragile quand le château est grand. |

Fichiers de référence : `sim/results_v1.json` (IA v1, sans gestion des missions ni alerte des gardes), `sim/results_v2.json` et `sim/RAPPORT.md` (IA v2, version 10 figée dans `sim/src_v10`), `sim/results_v3.json` et `sim/RAPPORT_v3.md` (version 11 : caractères des créatures, Jardins et 23 espèces ; l'IA `menagerie` bâtit les enclos du dehors et rachète la forêt).

Version 12 (envies déclarées et rêves secrets, plus de caresses) : `sim/results_v4.json` et `sim/RAPPORT_v4.md` (8 IA × 30 parties). Victoire visée : Terreur 97 % · 39, Légende 80 % · 44, Secrets 100 % · 50, Voisinage 100 % · 70, Ménagerie 10 % · 87 ; l'IA négligente perd une créature dans 37 % des parties. Dans cette version, `A.care` n'utilise plus que les pouvoirs, `A.quests` s'occupe des envies (et laisse partir à l'aventure) et `A.dreams` réalise les rêves secrets connus ; avec `CSD_SRC=sim/src_v10`, les IA retrouvent les caresses et les missions à accepter.

Version 13 (jour de paie tous les 5 nuits, arrivées ralenties, grandes salles) : `sim/results_v5.json` et `sim/RAPPORT_v5.md` (8 IA × 12 parties). Créatures de l'IA tranquille : 8 à la nuit 20, 12 à la nuit 30, 35 à la nuit 60 (contre 13, 22 et 44 avant). Salaires : environ 2 400 💰 versés sur 150 nuits par l'IA tranquille ; l'IA négligente laisse des impayés et perd une créature dans 42 % des parties. Victoire visée : Terreur 100 % · 51, Légende 83 % · 56, Secrets 100 % · 62, Voisinage 100 % · 80, Ménagerie 8 %. Les IA gardent l'or de la paie la veille (`payReserve`).

Version 14 (combat salle par salle, rival dès la première nuit, intrigues, raids à la Forged in the Dark, factions et territoires) : `sim/results_v6.json` et `sim/RAPPORT_v6.md` (8 IA × 40 parties, 150 nuits, 0 erreur). Victoire visée : Terreur 95 % · 48, Légende 100 % · 54, Secrets 100 % · 55, Voisinage 100 % · 70, Ménagerie 38 % · 104. Invasions pillées : 1 % (rang 1), 4 % (rang 2), 19 % (rang 3) ; par invasion, 2,5 héros K.O. et 0,4 créature sonnée. Sabotages du rival : une douzaine par partie chez les IA qui jouent longtemps, réussis 5 % (Tranquille) à 26 % (Secrets, qui défend peu). Intrigues achevées : environ 1 par partie de 150 nuits pour l'IA tranquille, aucune pour celles qui ne font pas ce qu'elles demandent (Mare, Forge, raids). Nouvelles mesures dans les résultats : `hurt`, `heroKO`, `fought` (combats), `nemRaids`, `nemRobbed`, `nem` (prestige, défis, créatures volées), `sagas`, `sagaCur`, `evos`.

Version 15 (invasions avec un but et une balade à la Naheulbeuk, pouvoirs du Cœur, talents de combat par espèce, bandes préparées à ta défense ; pièces incompatibles au même étage et bagarres de rivaux ; expéditions dans les donjons rivaux) : `sim/results_v9.json` et `sim/RAPPORT_v9.md` (8 IA × 20 parties, 0 erreur). Victoire visée : Terreur 100 % · 51, Légende 100 % · 56, Secrets 100 % · 55, Voisinage 100 % · 60 ; Ménagerie remontée à environ 25 % une fois l'IA corrigée (elle meuble les enclos depuis les Jardins, place les pièces incompatibles à un autre étage et sépare les rivaux d'étage). Invasions atteignant leur but contre une IA (tactique « tenir les postes ») : 6 % (rang 1), 23 % (rang 2), 35 % (rang 3) ; un joueur qui choisit sa tactique et ses pouvoirs fait mieux. Expéditions de l'IA Terreur : une dizaine par partie, boss vaincu 47 %, équipe terrassée 4 % (reliques accumulées). Réglages : `PREP_TARGET` (p28), `CRAWL_TUNE` (p35), `ROOM_CLASH` (p3).

Version 16 (expéditions en cartes façon Slay the Spire pour les donjons rivaux, la Forêt enchantée et les Grottes ; invasions calibrées contre un château sans pièges, Cœur pillé d'un bon tiers de son or ; Cœur déménageable à un autre étage, héros qui prennent les escaliers ; une pièce ne se remplit qu'à moitié, lits et repas plus généreux ; paliers plus chers, butin des raids et tribut des vassaux réduits) : `sim/results_v10.json` et `sim/RAPPORT_v10.md` (8 IA × 20 parties, 0 erreur). Victoire visée : Légende 100 % · 57, Terreur 95 % · 55, Voisinage 100 % · 60, Secrets 90 % · 43, Ménagerie 10 % · 137 (album à 22/23 en fin de partie). Invasions pillées par les IA qui se défendent : 16 à 25 % (5 % avant). Or en fin de partie : Tranquille ~240 (840 avant), Terreur ~900 (1 860 avant). Créatures de l'IA tranquille : ~37 en fin de partie (54 avant). Expéditions de l'IA Terreur : 10 par partie, boss vaincu 51 %, équipe terrassée 11 %, retraite 24 %, fuite 14 %. Sonde des expéditions (`CRAWL_TUNE` actuel) : joueur prudent, boss vaincu ~30 %, terrassé ~17 %, retraite ~45 %. Les IA comptent une pièce pleine quand elle atteint la moitié de ses cases (`fullRoom`) et bâtissent alors un deuxième dortoir ou potager ; `A.expedition` vers la Forêt ou une Grotte prépare une expédition en cartes de 4 créatures (elle prend la place d'un raid).

Version 17 (expéditions : élites avec capacité et action d'élite, boss avec action légendaire et fureur à mi-vie, éléments à la D&D, décor utilisable, fuite possible devant un boss contre tout le butin, expéditions à plusieurs Maîtres) : `sim/results_v11.json` et `sim/RAPPORT_v11.md` (8 IA × 20 parties, 0 erreur). Victoire visée : Légende 100 % · 62, Terreur 100 % · 57, Voisinage 100 % · 60, Secrets 90 % · 40, Ménagerie 15 %. Expéditions de l'IA Terreur : 9,5 par partie, boss vaincu ~50 %, presque jamais terrassée (elle fuit). Sonde `crawl_probe` (`CRAWL_TUNE` actuel) : joueur prudent, boss vaincu 15–40 % selon le moment, terrassé 1–4 %, fuite ~40 % ; joueur audacieux, boss 23–57 %, terrassé 11–15 %. À plusieurs Maîtres (`crawlAuto(dg, team, { np })`), la difficulté reste proche du solo (PV ennemis ×(1 + 1,4 par Maître en plus), +2,5 de force, un ennemi de plus, une action légendaire de plus).

Version 18 (Ruines en expédition de cartes ; décor devenu un secret rare, à toucher, que le combat auto ne joue pas ; icônes dessinées partout) : sonde `crawl_probe 2 25`, joueur prudent : boss vaincu 4–27 % selon le moment, terrassé 1–2 % ; audacieux : 8–45 %, terrassé 10–11 %. Par donjon (prudent · audacieux) : Ruines 15 % · 27 %, Forêt 17 % · 33 %, Grottes 19 % · 36 %, Morgrave 3 % · 7 % (le plus dur). Retirer le décor du combat auto a fait baisser le taux de boss d'environ un tiers par rapport à la version 17. Diagnostic utile : jouer un combat d'élite ou de boss isolé avec `crawlNew` + `crawlBattle(R, crawlFoes(R, 'boss'))` et `crawlAutoTurn` montre vite quelle capacité rend un boss trop dur (pour le Roi sans Couronne : la fureur qui ajoutait deux armures et +3 de force).

Version 19 (décisions pendant l'invasion, gardes postés, héros némésis, grands chantiers, saisons, visiteurs, œufs, cuisine, caravanes, artisanat et Nain sombre, renommée) : lot 8 IA × 10 parties, 150 nuits, 0 erreur (pas de fichier de résultats figé). Victoire visée : Légende 100 % · 53, Terreur 100 % · 52, Voisinage 100 % · 50, Secrets 100 % · 39, Ménagerie 10 à 30 % selon le lot (la plus dure, comme avant). Invasions (`inv_diag`, 3 IA × 90 nuits, 30 tirages par invasion) : sans aucun geste, la bande pille environ 89 % du temps ; avec les jetons du Cœur et les gestes de balade (`autoPower`, `autoStep`), environ 32 %. La bande se prépare contre les pièges comptés à 60 % (`plan.bare = 'half'`), sinon les pièges de rang 2 et 3 font retomber le « sans geste » vers 80 %. La renommée limite les arrivées (et les recrues) à partir du milieu de partie : Tranquille ~40 créatures à la nuit 100 au lieu de ~45 ; A/B sur 20 graines : Terreur 20/20 avec ou sans, Ménagerie 5/20 avec, 7/20 sans. Les IA postent les artisans dans leur pièce préférée (Forge, Atelier) et `A.traps` remplace le plus faible piège du chemin par un piège de rang 2 ou 3 dès que les plans sont là ; la Ménagerie renvoie un doublon quand le château est plein et qu'une espèce jamais vue pourrait venir.

Version 20 (les métiers : forgerons, mécaniciens, érudits, conteurs, cuisiniers, alchimistes, sentinelles ; jetons Brume soporifique et Élixir de bravoure) : lot 8 IA × 10 parties, 0 erreur. Victoire visée : Légende 100 % · 57, Terreur 100 % · 47, Voisinage 100 % · 50, Secrets 100 % · 39, Ménagerie 30 % · 125. `inv_diag` : sans geste 89 % pillées, tout 39 %. Au combat décisif (château de l'IA tranquille, nuit 30, un seul jeton) : rien 92 %, Sève 48 %, Brume 57 %, Cloche 59 %, Élixir 38 %. `sim/sim_core.js` : `A.posts` poste chaque créature née pour un métier dans sa pièce de métier quand elle existe.

Version 21 (journal des quêtes, `src/p52_quetes.js`) : `A.questStep()` (dans `common()`) accepte les offres (3 en cours au plus), livre, choisit la première option, cuisine les plats demandés et lance raids et expéditions de quête avec `A.raid`. Sur 120 nuits, les IA accomplissent 3 à 9 quêtes ; la grande quête bloque surtout à l'étape 2 (il faut Forge, Laboratoire et Cuisine) ou au boss. Grondefer (90 PV) : une équipe qui bat le Basilic 57 % du temps en `crawlAuto` bat Grondefer environ 30 % du temps. Depuis, les quêtes sont tirées au sort (`genMain` : une grande quête parmi cinq boss, `QBOSSES` ; `genSide` : huit modèles, `QGEN`) et enregistrées telles quelles dans `S.quests` ; sur 120 nuits, les IA accomplissent 15 à 24 quêtes secondaires.

Joueurs Sonnet (version 10, une partie chacun) : la victoire la plus rapide a été la Terreur à la nuit 30 (un raid de donjon par nuit, 12 réussites sur 12) ; la Ménagerie a été gagnée à la nuit 75, freinée surtout par les 5 légendes (21 nuits bloquée à 25 %). Leurs remarques : l'or déborde après la nuit 40, aucune menace sérieuse, missions imposées et impossibles à échanger.

## Limites à garder en tête

- Les IA soignent toutes leurs créatures chaque nuit (sauf `negligent`) : côté soins, c'est un joueur parfait.
- Pas de réseau : le Val, le château partagé et le Panthéon ne jouent pas.
- Les invasions sont résolues comme dans le jeu par `resolveInvasion` (combat salle par salle, PV des héros, limite de place, relève), avec la tactique « tenir les postes » et sans animation ; les sabotages du rival passent par `rivalNightSim`. Les IA ne posent pas de barricade et ne choisissent pas d'autre tactique : un joueur humain a plus d'outils qu'elles.
- Raids : `simRaidExtras` pousse l'équipe quand la réserve est maigre et signe un pacte du diable quand elle est désespérée ; `A.raid` choisit l'approche (prudente si 1 dé ou moins, désespérée à partir de 4). Intrigues : `sagaBotStep` (dans `common()`) accepte toute intrigue proposée, paie et choisit dès que possible. Les IA ne revendiquent pas de territoire.
- Un nouveau fichier `src/pXX_….js` est pris en compte automatiquement s'il est dans `PARTS` de `build.sh`. Un nouvel effet d'affichage qui accumule des données (particules, bulles…) doit être neutralisé en tête de `sim/sim_core.js`, comme `poof`, `floatText` ou `say`.
