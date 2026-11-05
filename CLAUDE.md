# Cozy Stickers Dungeon — notes pour Claude

Un jeu web en français, sans dépendance, qui tient dans une seule page HTML : on bâtit un château de monstres douillet et on colle des stickers. Tous les textes du jeu sont en français, avec un ton cozy et drôle.

## Construire et vérifier
- **Sources** : `src/`. 75 fichiers numérotés `pNN_theme.js` et 3 fichiers HTML (`p1_head.html` contient le CSS).
- **Build** : `bash build.sh` concatène les fichiers JS dans l'ordre de la variable `PARTS` (`p15_start.js` toujours en dernier) et produit `docs/index.html`, la page servie par GitHub Pages. Il produit aussi `cozy-stickers-dungeon.html` (la copie publiée en artefact) et régénère `tools/CHAINES.md`.
- **Syntaxe**, à vérifier après chaque modification :
  ```bash
  sed -n '/<script>/,/<\/script>/p' docs/index.html | sed '1d;$d' > "$TMPDIR/csd.js" && node --check "$TMPDIR/csd.js"
  ```
- **Simulation** : le banc fait tourner le vrai code dans Node (`sim/`). Mode d'emploi dans `.claude/skills/simulation-equilibrage/SKILL.md`.
  - Ne lance pas de simulation complète (`node sim/run.mjs` avec toutes les IA) sans demande du joueur. Préfère des sondes ciblées : une IA, 12 à 24 parties, via `sim/engine.mjs` (`createGame().run(code)`, `simPlay(ia, graine, nuits)`).
  - Après tout lot de `run.mjs`, lance `cp sim/results_v11.json sim/results.json`.
- **Publication** : `sh deploy.sh "message"` publie sur GitHub Pages. Uniquement à la demande du joueur.

## ⚠️ Les chaînes d'enveloppes : à lire avant de modifier une fonction
Le jeu s'étend par **enveloppes** : un fichier plus tardif redéfinit une fonction globale en appelant l'ancienne version.

```js
const openRoomPrestige = openRoom;          // garde la version précédente
openRoom = function (id) {                  // la remplace
  openRoomPrestige(id);                     // l'appelle
  /* … ajoute son comportement … */
};
```

- **L'ordre compte.** C'est celui de `PARTS` dans `build.sh`. La version appelée en jeu est la **dernière**, et chacune appelle la précédente. `dawn` est enveloppée 15 fois, `openRoom` 9 fois, `applyInvasion` 9 fois, et 132 fonctions en tout.
- **Avant de modifier ou de déboguer une fonction**, ouvre **`tools/CHAINES.md`**. Il donne, pour chaque fonction enveloppée, le fichier et la ligne où elle naît, puis chaque enveloppe dans l'ordre. Corriger seulement la définition d'origine (`function openRoom` dans `p10_ui.js`) ne suffit souvent pas : une enveloppe plus tardive peut écraser ou annuler le comportement.
- **Les outils d'analyse statique** (graphify, recherche de définitions, « aller à la définition ») ne voient qu'une définition, et ne relient pas `openRoomPrestige` à `openRoom`. Pour le flux réel, complète toujours le graphe par `tools/CHAINES.md`.
- **Pour ajouter un comportement**, écris une nouvelle enveloppe dans le fichier du thème concerné, ou dans un nouveau fichier `src/pNN_….js` ajouté à `PARTS` avant `p15_start.js`. Nomme la variable d'origine `<fonction><Thème>`, comme `openRoomPrestige` ou `dawnStk`, sans réutiliser un nom existant.
- **Les commandes** (`CMD.x`), le Grimoire (`WIKI.x`) et les données (`ROOMS`, `FURN`, `CASTLE_CARDS`, `CRAWL_EN`…) sont aussi complétés ou remplacés par des fichiers plus tardifs. Cherche toutes les affectations, pas seulement la déclaration.
- `tools/CHAINES.md` est généré. Ne le modifie pas à la main : `node tools/chaines.mjs > tools/CHAINES.md`, ou relance le build.

## Repères dans le code
- **État de la partie** : l'objet global `S`. Les anciennes sauvegardes passent par `upgradeState` : tout nouveau champ s'y initialise.
- **Une nuit** : `dawn(report)`, enveloppée par presque tous les systèmes. Les actions du joueur passent par `CMD.<nom>`, et `run(nom, args)` dans l'interface.
- **Les expéditions et combats aux cartes** :
  - le moteur : `p35_crawl.js` (`crawlBattle`, `crawlAuto`, `crawlWinLoot`, `CASTLE_CARDS`, `cardValue`) ;
  - l'écran : `p36_crawl_ui.js` (`runCrawl`).
- **Les invasions** :
  - le moteur : `p69_invasion.js` (`INV_TUNE`, `invResolve`) ;
  - l'écran : `p70_invasion_ui.js` ;
  - les bonus : `p71_defense.js`.
- **Le livre et les stickers** :
  - les données : `p63_livre.js` ;
  - l'affichage : `p65_livre_ui.js` ;
  - les familles de stickers : `p66_stickers.js` ;
  - les dessins sur canvas : `p67_sticker_art.js`.
- **Le reste** :
  - les victoires : `p25_victory.js` (Siège de Mirebrume : `p73_siege.js`) ;
  - l'économie : `p60_economie.js` et `p74_prestige.js` ;
  - la musique : `p72_musique.js`.
- **En simulation** : `headless()` est vrai. Un effet d'affichage qui accumule des données doit être neutralisé en tête de `sim/sim_core.js`.

## Règles de travail
- **Tests dans le navigateur** :
  - utilise `docs/?horsligne` sur le serveur local de prévisualisation ;
  - ne laisse aucune donnée de test dans le localStorage : à la fin, va sur `/sim/` et supprime toutes les clés sauf `csd-ui` et `csd-saves-v1` ;
  - supprime `sim/_perf_state.json` après usage.
- **Main de cartes** : chaque carte est un seul plan, et rien ne déborde sur les autres cartes, badges compris.
- **Visuels** : dessins originaux (canvas ou SVG). Pas d'émoji comme seul visuel quand le reste a un vrai dessin.
- **Écriture du code** : comme le code autour, avec une densité de commentaires faible, en français et sur la même ligne.
- **Équilibrage** :
  - les valeurs réglables sont dans des constantes nommées (`INV_TUNE`, `AUTO_FEE`, `ART_RISE`, `WONDER_ART_LV`, `SITE_DEEP_ART`, `RIVAL_TUNE`, `SIEGE_TUNE`…) ;
  - un texte qui cite une valeur doit la lire dans sa constante.
