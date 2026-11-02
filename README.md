# Cozy Stickers Dungeon

Un petit château maléfique… mais douillet. On colle des pièces, des meubles et des pièges comme des stickers, on accueille des créatures attachantes qui ont chacune leur caractère, leurs envies et leurs petites missions, et on décourage (un peu) les aventuriers du Val Douillet.

**Jouer : https://laucans.github.io/cozy-stickers-dungeon/** — dans le navigateur, sur ordinateur ou téléphone, sans compte.

## Ce qu’on y fait

- **Bâtir** un château en vue isométrique : pièces en chantier (horloges de projet), meubles, déco, verrous, pièges et ruses sur le chemin des héros. Règles d’aménagement inspirées du jeu de rôle *Wicked Ones* (Forged in the Dark).
- **Accueillir des créatures** : chaque pièce meublée attire son espèce. Humeur, postes, raids aux dés, invasions animées, calamités.
- **Les âmes du château** : réputation du château auprès de chaque espèce, loyauté et épanouissement de chaque créature, désertions possibles vers des châteaux mieux réputés (optionnelles), missions personnelles en trois chapitres avec expédition, niveaux et légendes.
- **Hauts faits** qui débloquent des pouvoirs permanents (et quelques pouvoirs à activer).
- **Étages et remparts** : un nouvel étage par palier, vers le haut (jardin suspendu, volière, belvédère) ou vers le bas (mine, reliquaire, lac souterrain), chacun avec ses stickers, ses bonus et ses créatures rares ; des remparts qu’on élargit.
- **Rayonnement** : artefacts, trésors, créatures rares et légendes font briller le château… et attirent des aventuriers de plus en plus loin, donc de plus en plus forts (apprentis des villages, aventuriers des villes, héros de la cité).
- **La carte du Val** : une carte en hexagones façon Civilization, avec brouillard de guerre et le cercle doré de ton rayonnement. Les héros repoussés perdent leurs carnets de route (la carte se dévoile), les éclaireurs explorent, les expéditions rapportent artefacts et rencontres rares. Villages, ville, cité, cibles de raid, donjons rivaux et châteaux des autres joueurs y apparaissent.
- **En ville** : bazar, apothicaire, taverne, Guilde des Aventuriers Patentés, cartographe et bureau de placement pour monstres, à visiter avec une fausse moustache.
- **Le Val des Maîtres** (en ligne) : visite les châteaux des autres joueurs, signe leur livre d’or, offre des cadeaux, tente des escarmouches (avec boucliers), grimpe au palmarès de la saison… et vois des créatures passer d’un château à l’autre selon la réputation de chacun.
- **Cinq victoires, comme dans Civilization** : Légende (rayonnement, puis une croisade à repousser), Terreur (vassaliser les quatre donjons rivaux, puis le siège de Mirebrume), Bon Voisinage (requêtes des villages et Conseil du Val), Grande Ménagerie (album complet, légendes, Grande Parade) et Secrets (carte, douze artefacts, Rituel). Les rivaux font la course : si l’un gagne avant toi, une nouvelle ère commence, sans partie perdue. Les victoires des joueurs entrent au Panthéon du Val.
- **Le château partagé** : jusqu’à 5 Maîtres dans le même château en temps réel, avec curseurs, discussion et vote de fin de nuit.
- Une interface épurée façon Civilization : l’essentiel en haut, des pastilles pour ce qui demande ton attention, la construction et les créatures repliées, une mini-carte.
- Un **Grimoire** façon Civilopédie, un **tutoriel** guidé et l’**Atelier du Maître** pour régler le jeu.

## Comment ça marche en ligne

Il n’y a ni serveur à nous ni compte à créer. Chaque joueur reçoit une clé de Maître, gardée dans son navigateur, et signe ses messages avec elle. Les châteaux publics, livres d’or, cadeaux et escarmouches sont publiés sur des relais publics du protocole [Nostr](https://nostr.com) (événements d’application, kind 30078). Le château partagé passe par des messages éphémères chiffrés avec le code du salon.

Conséquences : tout ce qui est publié dans le Val est **public** (nom de Maître, château, mots du livre d’or) ; la partie et la clé vivent dans le navigateur (vider les données du site les efface).

## Construire

Le jeu est un seul fichier HTML assemblé à partir de `src/` :

```sh
sh build.sh
```

- `docs/index.html` : la version web (GitHub Pages).
- `cozy-stickers-dungeon.html` : la version Artifact claude.ai (solo, sans le Val).

Astuce de test : `?profil=nom` ouvre une partie et une identité séparées sur le même navigateur (pratique pour essayer le château partagé avec deux onglets).

## Régler le jeu (Atelier du Maître)

Ouvre le jeu avec `?atelier` pour afficher l’Atelier (🛠️). Les modifications restent dans ton navigateur. Pour les publier pour tout le monde, exporte les réglages depuis l’Atelier : le fichier téléchargé (`cozy-stickers-dungeon-reglages.json`) devient `docs/tuning.json` dans ce dépôt.

## Crédits

Jeu original. Graphismes dessinés par le code (aucune image externe), polices Google Fonts (Andika, Grenze Gotisch, Patrick Hand), bibliothèque [nostr-tools](https://github.com/nbd-wtf/nostr-tools) pour les signatures.
