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

# Boucles « plaisir de jeu »

Les testeurs jouent désormais le vrai jeu dans Chrome (nouveau joueur, ou partie avancée chargée depuis `sim/_perf_state.json`), et en ligne de commande avec les vraies décisions : expéditions jouées carte par carte (`node sim/play.mjs crawl …`, rejouées depuis une graine), équipe et approche des raids, tactique des invasions avec estimation de l'issue.

## Plaisir 1 — 2 testeurs Chrome, 2 en ligne de commande

| Testeur | Notes d'amusement | Remarques principales |
|---|---|---|
| Chrome, nouveau joueur (7 nuits) | 3 → 4 → 3 | Tutoriel : « Suivant » devient « Plus tard » au même endroit ; bouton de palier tout en bas ; diablotins absents du raid sans explication ; capture de l'unique raideur en début de partie ; toasts empilés ; envie de continuer : oui |
| Chrome, milieu de partie | expédition 4, défense aux cartes 4,5, tactique 2,5, global 4 | Boss : la défaite coûtait tout, sans avertissement ; le combat auto file à la défaite ; fiche du Cœur qui remonte ; aucune alerte quand l'invasion tombe le soir d'une expédition |
| Ligne de commande, décisions (Légende n41) | 3 → 2,5 → 3,5 → 2,5 | La tactique d'invasion guidée par l'estimation est la décision qui compte ; ennui après la victoire ; le fil rouge s'arrête trop tôt |
| Ligne de commande, expéditions (Terreur et Légende n68) | 2 → 3 → 4 → 3 → 4 → 4 (pic à 5) | 14 expéditions, 5 boss : les boss sont le meilleur du jeu ; le 3e étage s'atteint sans combat ; 4 rencontres qui reviennent en boucle ; le siège tombe en dés négatifs à cause de la vigilance |

Décisions :
- Tutoriel : « Passer cette étape » / « Ranger le conseil » à droite, à part du bouton principal ; bouton de palier en tête de la fiche du Cœur quand tout est prêt.
- Raid : les créatures trop petites pour piller sont nommées ; alerte quand l'invasion tombera le soir même (Menace avant et après le raid) ; pied de fenêtre toujours visible ; pas de capture avant la nuit 10.
- Premières arrivées : la garantie joue en 2 nuits tant que l'album est tout petit ; « personne n'est entré » dit pourquoi.
- Toasts : trois au plus à l'écran ; panneau d'effets du sticker en main replié par défaut.
- Expéditions : terrassée, l'équipe rapporte un quart du butin ; avertissement devant la porte du boss ; le combat auto rend la main quand l'équipe passe sous 45 % de PV ; rentrer avant la première salle n'impose aucun délai ; cinq nouvelles rencontres à choix (épurer le deck, parier, soigner ou détrousser, étudier…).
- Vassalité : 1 point au 3e étage seulement avec au moins deux combats gagnés (trois rendaient la Terreur trop rare chez les IA : 7/12) ; le Siège de Mirebrume échappe à la vigilance.
- Fil rouge : un 8e chapitre, « Ta propre légende », jusqu'à la première victoire.
- Chronique : l'issue des expéditions et des redditions passe « À la une ».

## Plaisir 2 — 1 testeur Chrome, 1 en ligne de commande

| Testeur | Notes d'amusement | Remarques principales |
|---|---|---|
| Chrome, nouveau joueur (12 nuits) | 3 → 3 → 4 → 4 | Raid avec cotes et « Pousser / Pacte » : très bon ; invasion lisible ; chapitre 3 bloqué (les expéditions ne comptaient pas comme lieu pillé) ; palier presque invisible ; envie de continuer : oui |
| Ligne de commande, Secrets (60 nuits, pas de victoire) | 3 → 3 → 2 → 3 → 2 → 3 | Barre des Secrets à 0 % malgré 88 % de carte ; boss qui gardaient tout le butin en cas de fuite ; résistances des ennemis invisibles en ligne de commande ; quelques rencontres sans vrai choix |

Décisions :
- Fil rouge : « Pille ou explore deux lieux différents » compte aussi les expéditions ; « Montre-moi » ouvre la carte.
- Palier : une fiche de célébration (ce qui est débloqué, ce qu'il faut pour le suivant).
- Victoires des Secrets et de la Ménagerie : la barre avance pas à pas (carte, artefacts, exposition ; album, légendes, série).
- Fuir un boss : on garde la moitié du butin (les stickers restent là-bas).
- Rencontres : la fontaine désaltère le plus blessé ; les osselets se jouent avec le butin qu'on a.
- Ligne de commande : résistances et faiblesses des ennemis affichées ; le stock d'un village ne liste plus d'artefacts invendables.

## Plaisir 3 — 1 testeur Chrome, 1 en ligne de commande

| Testeur | Notes d'amusement | Remarques principales |
|---|---|---|
| Chrome, milieu de partie | expédition 4,5, invasion 4, défense aux cartes 4, gestion 3,5, global 4 | Le combat auto rend bien la main (« Ça tourne mal ») ; l'avertissement devant le boss est clair ; les rencontres n'annoncent pas leur effet ; le tableau des tactiques donnait parfois « pire avec jetons » ; envie de continuer : oui |
| Ligne de commande, nouveau joueur (fil complet, Légende n42) | 3 → 2 → 3 → 4 → 5 | Le fil rouge porte jusqu'au chapitre 8 ; creux au chapitre 4 (« Comble 3 envies », 10 nuits) ; 650 💰 qui dorment en fin de partie ; la croisade est le meilleur moment |

Décisions :
- Rencontres : chaque choix annonce sa nature (« de l'or… ou un piège », « améliore 2 cartes, +3 peur »…).
- Tactiques d'invasion : avec et sans jetons sur les mêmes tirages, l'écart mesure vraiment l'effet des jetons.
- Fil rouge, chapitre 4 : 2 envies au lieu de 3.
- Merveilles : on peut les payer tout en or (1 bois = 1,5 or) quand c'est l'or qui dort.
- Ligne de commande : estimation d'invasion sur 24 essais ; `night` refuse des actions passées par erreur.

Évolution des notes d'amusement sur les trois boucles « plaisir » : globales de 3 à 4 dans le vrai jeu (Chrome), et des testeurs qui veulent tous « continuer la partie ». Points qui restent ouverts : le creux du milieu de partie (nuits 15-30) quand rien ne presse, la course des rivaux qui ne fait pas peur, la main de cartes qui se chevauche sur ordinateur (voulu, façon Hearthstone, mais le texte des cartes y est coupé).

Rapport des IA scriptées après les boucles « plaisir » : `sim/RAPPORT_v13.md` (Légende 100 % · 53, Secrets 100 % · 38, Voisinage 100 % · 40, Ménagerie 8 %, Terreur 7/12 avant le passage à deux combats gagnés, 11/12 · 71 après).

## Milieu de partie — les rivaux contre-attaquent

Demande : remplir le creux des nuits 15 à 30. Choix retenu : des rivaux menaçants (`src/p62_rivaux.js`).
- À certains seuils de leur course (le premier entre les nuits 15 et 35 selon le rival, puis vers 55 % et 82 %), chaque donjon rival annonce un coup trois nuits à l'avance : Krouk pille ta réserve (au moins 20 💰 + 10 par palier, du bois s'il manque l'or), Mère-Crapaud attire deux créatures, Ysolde vole un artefact (ou enlève une créature contre rançon), Pâlefroid sème la zizanie (−1 humeur et −5 loyauté pour tous, −15 de bonne volonté partout).
- Parades : une expédition dans son donjon qui passe au moins une salle, ou un espion (15 💰 + 5 par palier + 5 par espion déjà payé).
- Une ère perdue face à un donjon rival coûte un tribut (le cinquième de l'or et du bois).
- Les IA paient un espion quand elles en ont les moyens ; victoires inchangées (Légende 100 % · 52, Terreur 83 %, Voisinage 100 % · 50, Secrets 83 %).

Test Sonnet (45 nuits, première version des coups) : notes 3 de la nuit 10 à 35, puis 4 avec la croisade ; un seul coup sur quatre posait un vrai choix, car les pertes dépendaient trop de ce que le joueur possédait et l'espion coûtait plus que la perte. Les coups ont été durcis et l'espion rendu moins cher en conséquence.

Main de cartes à l'ordinateur : les cartes s'écartent et grandissent (jusqu'à +20 %) quand il y a de la place, se recouvrent juste ce qu'il faut sinon, grandissent nettement au survol, et la zone de la main occupe toute la largeur (elle ne pousse plus les boutons).

## Le Livre du Maître (ères courtes, façon frise de Civilization)

Demande : des ères courtes en compétition avec les rivaux, avec âge d'or (relique unique) et âge sombre (boost de développement contre une pénalité, au choix), annoncées par l'ouverture d'un chapitre dans un « Livre du Maître » où l'on colle des stickers de moments marquants ; les hauts faits fusionnent avec ces stickers et perdent leurs pouvoirs, mais changent l'issue de certains événements (`src/p63_livre.js`).
- Moments : 8 « premiers du Val » disputés aux rivaux (3 points, 1 si un rival t'a devancé), les anciens hauts faits et une vingtaine de nouveaux (1 à 5 points), et 14 moments récurrents plafonnés par chapitre (bande repoussée, boss terrassé, page d'album, quête, coup déjoué…) : sans eux, les premiers chapitres finissaient toujours en âge d'or et les derniers en âge sombre.
- Rivaux : 1,3 point par nuit × leur forme du chapitre (0,6 à 1,4) × (1 + course/100). Sur 37 chapitres simulés : 15 âges d'or ou héroïques, 10 ordinaires, 12 sombres ; l'IA passive perd la course, les actives la gagnent souvent.
- Reliques d'ère : 19 pouvoirs des anciens hauts faits (Truelle bénie, Sacoches profondes, Trèfle…). Pactes d'âge sombre : 6 (Serrer les rangs, Tout pour le butin, Portes ouvertes, Économie de guerre, Veillées, L'école du château).
- Fins alternatives : coffre, osselets, autel, fontaine et cage en expédition ; les quatre coups des rivaux.
- IA scriptées : victoires inchangées (Légende 100 % · 50, Terreur 83 % · 74, Voisinage 100 % · 40, Secrets 100 % · 43), aucune erreur.
