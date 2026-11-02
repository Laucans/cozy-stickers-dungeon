# Cozy Stickers Dungeon

Un petit château maléfique… mais douillet. On colle des pièces, des meubles et des pièges comme des stickers, on accueille des créatures attachantes qui ont chacune leur caractère, leurs envies et leurs petites missions, et on décourage (un peu) les aventuriers du Val Douillet.

**Jouer : https://laucans.github.io/cozy-stickers-dungeon/** — dans le navigateur, sur ordinateur ou téléphone, sans compte.

## Ce qu’on y fait

- **Bâtir** un château en vue isométrique : pièces en chantier (horloges de projet), meubles, déco, verrous, pièges et ruses sur le chemin des héros. Règles d’aménagement inspirées du jeu de rôle *Wicked Ones* (Forged in the Dark).
- **Accueillir des créatures** : chaque pièce meublée attire son espèce. Humeur, postes, raids aux dés, invasions animées, calamités.
- **Les âmes du château** : réputation du château auprès de chaque espèce, loyauté et épanouissement de chaque créature, désertions possibles vers des châteaux mieux réputés (optionnelles), missions personnelles en trois chapitres avec expédition, niveaux et légendes.
- **Hauts faits** qui débloquent des pouvoirs permanents (et quelques pouvoirs à activer).
- **Le Val des Maîtres** (en ligne) : visite les châteaux des autres joueurs, signe leur livre d’or, offre des cadeaux, tente des escarmouches (avec boucliers), grimpe au palmarès de la saison… et vois des créatures passer d’un château à l’autre selon la réputation de chacun.
- **Le château partagé** : jusqu’à 5 Maîtres dans le même château en temps réel, avec curseurs, discussion et vote de fin de nuit.
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
