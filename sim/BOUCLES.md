# Boucles d'amélioration (joueurs Sonnet + IA scriptées)

Chaque boucle : plusieurs joueurs Sonnet jouent une partie complète en ligne de commande (`sim/play.mjs`) et rendent leur avis ; on trie, on corrige, on mesure l'effet avec les IA scriptées (`node sim/run.mjs 12 120`), puis on relance.

## Boucle 1 — 5 joueurs (fil rouge, Terreur, Ménagerie, Légende, Bon voisinage)

| Joueur | Victoire | Remarques principales |
|---|---|---|
| Nouveau joueur (fil rouge) | Légende, nuit 46 | Chapitres 1-4 en 6 nuits ; chapitre 5 bloquant (quêtes à fabriquer, aucune commande pour poster une créature précise) ; `expe` perdue au rechargement |
| Terreur | nuit 25 | Expéditions rivales trop rentables et sûres (9/9, ~80 💰 par boss) ; dés de meubles sans plafond (siège à 6-8 dés) |
| Bon voisinage | nuit 39 (le plus tôt possible) | Mécanique une fois le déclin compris |
| Légende | nuit 43 | 8 pièges « ruse » égarent 95 % des bandes ; tas d'or (+3 rayonnement, +2 💰/nuit pour 5 💰) ; sirop d'oubli chaque nuit |
| Ménagerie | nuit 104 | Loterie des arrivées ; « toutes épanouies » oblige à renvoyer 20 créatures |

Décisions :
- Donjons rivaux : +0,5 niveau par point de vassalité pris chez eux, +0,25 par vassal possédé.
- Dés de « préparatifs » (meubles) plafonnés à 1 + palier.
- Les ruses s'usent : chaque nouvelle ruse sur le chemin a 0,4 fois les chances de la précédente.
- Sirop d'oubli : une fois toutes les 3 nuits.
- Rayonnement des trésors plafonné à +20 ; Galerie +8 / niveau, Cave +3 / niveau.
- Album : une espèce commune jamais vue, sa pièce prête, arrive en 4 nuits au plus (et le Grimoire dit vrai sur les chances d'arrivée).
- Ménagerie : 85 % des créatures installées (5 nuits) épanouies suffisent.
- Fil rouge : un convoi garanti au chapitre 5.
- Ligne de commande : `post`, `journal`, `wonder`, `fete`, `merveilles`, `victoires`, `fil`, `drill` ; sites d'expédition et cibles de quête recréés au chargement ; `wiki` lisible sans partie ; jour de paie affiché.

IA scriptées (12 × 120 nuits), avant → après : Terreur 46 → 43, Légende 53 → 51, Secrets 35 → 33, Voisinage 40 → 50, Ménagerie 0 % → 0 % (puis 2/12 avec la règle des 85 %).

## Boucle 2 — 4 joueurs (Terreur, Légende, Secrets, fil rouge)

| Joueur | Victoire | Remarques principales |
|---|---|---|
| Terreur | nuit 35 (au lieu de 25) | Fuir au 3e étage rapporte 1 point à chaque fois ; siège sans histoire (8-10 dés) |
| Secrets | nuit 29 | 8 artefacts sur 12 achetés au Bazar ; les expéditions financent tout |
| Nouveau joueur (fil rouge) | Légende, nuit 37 | Chapitres bouclés en 12 nuits, chapitre 5 fluide ; demande des compteurs (« 1/3 ») ; premier boss rival trop facile |
| Légende | nuit 49 (au lieu de 43) | Les invasions redeviennent une menace ; raids sans risque à 7-17 dés |

Constante des joueurs : l'or manque les nuits 1-10, puis déborde vers la nuit 20-25.

Décisions :
- On lance 6 dés au plus par raid.
- Siège de Mirebrume : un vrai succès (un 6) ; un succès partiel ne compte pas.
- Donjons rivaux : +0,5 niveau par palier.
- Raids de début de partie un peu plus rentables (ferme, moulin, auberge, monastère) ; or des expéditions −25 %.
- Chaque artefact acheté renchérit les suivants de 25 %.
- Fil rouge : compteurs d'avancement, objectif « garde » plus explicite.
- Essayé puis annulé : le point du 3e étage une seule fois par rival. L'expédition jouée automatiquement ne bat presque jamais le boss (0 à 5 %), la Terreur devenait impossible aux IA (0 %).

IA scriptées après la boucle 2 : Terreur 12/12 vers la nuit 47 (35-55), Légende 52, Voisinage 50, Secrets 83 % · 42, Ménagerie 25 % · 83.

## Boucle 3 — 4 joueurs (Terreur, Ménagerie, Secrets, Bon voisinage)

| Joueur | Victoire | Remarques principales |
|---|---|---|
| Terreur | nuit 33 | Toujours 1 point par « fuite » au 3e étage ; début trop serré |
| Secrets | nuit 36 (au lieu de 29) | 6 artefacts achetés, 6 trouvés : la hausse des prix change les choix ; le bois s'entasse |
| Bon voisinage | nuit 39 (plancher des Conseils) | Intéressant les 20 premières nuits, routine ensuite |
| Ménagerie | aucune en 120 nuits (22/24 espèces) | Plafond de renommée rempli de doublons : les dernières espèces restent dehors |

Décisions :
- Soumettre un rival : 1 point seulement en rentrant sans fuir (essai « porte du boss » puis assoupli en boucle 4).
- 16 💰 et 12 🪵 au départ (au lieu de 10 et 8).
- Merveilles et Grande fête payées surtout en bois (le bois s'entasse chez tous les joueurs).
- Garantie d'album même quand la renommée est au plafond (il faut un lit libre).
- Ligne de commande : `renvoyer`, sites d'expédition inconnus masqués, date réelle du Conseil.

IA scriptées après la boucle 3 : Légende 100 % · 57, Voisinage 100 % · 40, Secrets 100 % · 44, Ménagerie 17 %, Terreur 83 % · 98 (trop lente).

## Boucle 4 — 3 joueurs (Terreur, Ménagerie, fil rouge)

| Joueur | Victoire | Remarques principales |
|---|---|---|
| Terreur (règle « porte du boss ») | nuit 56 | 29 expéditions pour 12 points : tension réelle au début, frustration au milieu ; siège trop facile |
| Ménagerie | nuit 80 (au lieu de 104, puis échec) | Album complet à la nuit 68, 85 % atteignable ; `renvoyer` ne lisait que le premier mot du nom |
| Nouveau joueur (fil rouge) | Légende, nuit 43 | Départ « juste » ; le bois devient le goulot vers les nuits 15-26 ; la fête trop chère en bois tôt |

Décisions :
- Donjons rivaux : +0,25 niveau par point pris (au lieu de +0,5) ; 1 point en atteignant le 3e étage puis en rentrant sans fuir un combat.
- Siège de Mirebrume : risque 4 (au lieu de 3).
- Grande fête : 10 💰 + 1 par créature, 12 🪵 + 1,5 par créature.
- Récompenses du fil rouge un peu plus en bois qu'en or.
- Ligne de commande : noms complets pour `renvoyer` et `post`, confirmation pour renvoyer une légende, avancée des 85 % dans `victoires`.

IA scriptées, Terreur : 10/12 vers la nuit 80 (au lieu de 9/12 vers 105).

Rapport complet des IA scriptées après les 4 boucles : `sim/RAPPORT_v12.md` (Légende 100 % · 57, Secrets 100 % · 44, Voisinage 100 % · 40, Terreur 83 % · 78, Ménagerie 17 %).
