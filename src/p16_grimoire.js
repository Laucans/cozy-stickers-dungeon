
/* =========================================================
   Grimoire du Maître : l'encyclopédie du jeu (façon Civilopédie)
   Articles de mécaniques écrits à la main + fiches générées depuis
   les données vivantes (elles suivent les réglages de l'Atelier)
   ========================================================= */
const WIKI_CAT = [['bases', 'Les bases'], ['build', 'Construire'], ['eco', 'Économie'], ['crea', 'Créatures'], ['danger', 'Dangers et raids'], ['ames', 'Âmes du château'], ['val', 'Le Val : carte et voisins'], ['vic', 'Victoires'],
  ['room', 'Pièces'], ['furn', 'Meubles'], ['decor', 'Déco'], ['def', 'Pièges'], ['sp', 'Bestiaire'], ['hero', 'Aventuriers'], ['raid', 'Cibles de raid']];
const WIKI = {
  accueil: { cat: 'bases', t: 'Bienvenue dans le Grimoire', x: () => `<p>Ce grimoire explique tout le jeu. Chaque mot souligné mène à un autre article.</p>
    <ul><li>Nouveau venu ? Lis {c:but}, puis {c:nuit} et {c:construire}.</li><li>Tes créatures boudent ? Va voir {c:humeur} et {c:lits_repas}.</li><li>Des héros arrivent ? Lis {c:invasion} et {c:pieges}.</li><li>Tu veux du butin ? Tout est dans {c:raids}.</li><li>Une créature lorgne ailleurs ? Lis {c:loyaute} et {c:reputation}.</li><li>Tes créatures ont des demandes ? Voir {c:missions}. Tes exploits ? {c:hautsfaits}.</li><li>Jouer avec d’autres Maîtres : {c:val} et {c:partage}.</li></ul>
    <p>Les fiches des {cat:room|pièces}, {cat:furn|meubles}, {cat:def|pièges}, {cat:sp|créatures} et {cat:raid|cibles de raid} sont tirées des vraies valeurs du jeu.</p>` },
  but: { cat: 'bases', t: 'Le but du jeu', x: () => `<p>Tu es le Maître d’un petit château maléfique… et douillet. Tu colles des pièces, tu les meubles, et chaque pièce meublée attire de nouvelles créatures qui travaillent pour toi.</p>
    <p>Tes {c:raids|raids} rapportent de l’or et du bouche-à-oreille, qui fait ta {c:notoriete|notoriété}, mais la notoriété attire les aventuriers ({c:menace}). À toi de les décourager avec des {c:pieges|pièges} et des créatures solides et reposées, qui se défendent d’elles-mêmes.</p>
    <p><b>Le but</b> : devenir le <b>Grand Maître du Val</b>, avant les donjons rivaux et le Baron Pâlichon, qui briguent le même titre. Cinq chemins y mènent ({c:victoires}) :</p>
    <ul><li>{c:v_legende|Légende} : porter la notoriété de ton château jusqu’à Mythique, puis repousser la croisade de Mirebrume.</li><li>{c:v_terreur|Terreur} : soumettre les quatre donjons rivaux en expédition, puis prendre Mirebrume en trois assauts.</li><li>{c:v_voisinage|Bon Voisinage} : gagner 20 voix au Conseil du Val grâce à la bonne volonté des villages.</li><li>{c:v_menagerie|Grande Ménagerie} : l’album complet, cinq légendes et des créatures épanouies, puis la Grande Parade.</li><li>{c:v_secrets|Secrets} : dévoiler la carte, trouver et exposer les douze artefacts, puis le Rituel des Douze.</li></ul>
    <p>Les {c:paliers|paliers} sont les marches du chemin : chacun débloque des pièces, des créatures et des étages, et le Palier 3 rend ton château légendaire, mais il ne fait gagner aucune victoire à lui seul. Une victoire remportée, tu peux viser les autres, pour la gloire.</p>` },
  controles: { cat: 'bases', t: 'Commandes', x: () => `<ul><li><b>Se déplacer</b> : fais glisser le château. Flèches du clavier aussi.</li><li><b>Zoomer</b> : molette ou pincement. Le bouton ⤢ (en bas à droite) recadre tout le château.</li>
    <li><b>Coller un sticker</b> : ouvre <b>Construire</b> (en bas à gauche, ou touche B), choisis une carte, puis touche le château. La grille n’apparaît que pendant que tu colles. À la souris, tu peux aussi glisser la carte. <b>Au doigt</b> : le sticker apparaît à un bon endroit ; fais-le glisser du doigt (deux doigts déplacent la vue), puis touche « Poser ici ».</li>
    <li><b>Tourner une pièce</b> : le bouton ⟳ (ou R au clavier). <b>Ranger le sticker</b> : le bouton ✕ (ou Échap).</li><li><b>Voir une fiche</b> : touche une pièce, un meuble, un piège ou une créature. Un clic droit sur une carte de la barre ouvre sa page du Grimoire.</li><li><b>Savoir ce que fait un bouton</b> : survole-le à la souris ; au doigt, garde le doigt appuyé dessus (appui long), sans rien déclencher. Ça marche aussi sur les cartes de construction et les compteurs.</li>
    <li>Les chiffres en haut de l’écran mènent aussi au Grimoire. Les pastilles à droite signalent ce qui demande ton attention ; tes créatures sont repliées derrière 🐾, en haut à gauche.</li></ul>` },
  nuit: { cat: 'bases', t: 'Une nuit, cinq temps', x: () => `<p>Le jeu avance nuit par nuit, comme dans le jeu de rôle Wicked Ones. Le bouton <b>Finir la nuit</b> déroule les étapes dans l’ordre :</p>
    <ol><li><b>Rôder</b> : ton tour. Construis, meuble, donne des {c:postes|postes}, prépare un {c:raids|raid}. Rien ne presse.</li><li><b>Calamité</b> : l’horloge de {c:calamite|Calamité} avance selon le bien-être du château.</li>
    <li><b>Raid</b> : si un raid est prévu, ton équipe lance ses dés.</li><li><b>Contrecoup</b> : si l’horloge de {c:menace|Menace} est pleine, des aventuriers attaquent ({c:invasion}).</li>
    <li><b>Aube</b> : les chantiers avancent, les pièces produisent, les humeurs changent et de nouvelles créatures arrivent. La chronique résume la nuit.</li></ol>` },
  construire: { cat: 'build', t: 'Construire une pièce', x: () => `<p>Choisis une pièce dans l’onglet <b>Pièces</b> et colle-la contre le château. Elle coûte de l’or et du bois, puis démarre en <b>chantier</b>.</p>
    <p>Un chantier porte une horloge de 4, 6 ou 8 segments. À chaque {c:nuit|aube}, tes ouvriers en remplissent ${CONSTS.WORK}, plus 1 par diablotin et par orque (2 s’ils sont ravis). Le plus ancien chantier passe en premier.</p>
    <ul><li>Une pièce ne se <b>meuble qu’une fois terminée</b> : on la bâtit, la nuit passe, puis on l’aménage.</li><li><b>Une pièce ne se remplit qu’à moitié</b> : un sticker (meuble ou déco) pour deux cases, arrondi au-dessus ; une grande salle additionne ses pièces. Pour loger plus de monde, bâtis un deuxième dortoir.</li><li><b>Renfort de nuit</b> : 2 or pour 1 segment de plus, posé à l’aube, depuis la fiche du chantier.</li><li><b>Décoller</b> une pièce terminée rend la moitié de son prix ; un chantier annulé est remboursé.</li><li>Les <b>couloirs</b> se posent instantanément et relient tout.</li></ul>
    <p>Voir aussi {c:regles}, {c:portes} et {c:meubler}.</p>` },
  regles: { cat: 'build', t: 'Règles de placement', x: () => `<ul><li>Une pièce doit <b>toucher</b> le château (une pièce ou un couloir) et rester dans les remparts.</li><li>La {room:tour} doit toucher les remparts.</li>
    <li>Certaines pièces veulent être <b>loin du porche</b> (en pas) : ${Object.keys(ROOMS).filter(k => ROOMS[k].far).map(k => `{room:${k}} ${ROOMS[k].far}`).join(', ')}.</li><li>Des pièces sont <b>uniques</b> ou demandent un {c:paliers|palier}. Chaque {c:themes|thème} offre sa pièce unique.</li>
    <li><b>Voisinage</b> : ${Object.keys(ROOMS).filter(k => ROOMS[k].syn).map(k => `{room:${k}} contre {room:${ROOMS[k].syn.adj}}`).join(', ')} donnent un bonus.</li></ul>` },
  portes: { cat: 'build', t: 'Portes et passages', x: () => `<p>Une porte s’ouvre toute seule entre un couloir et sa voisine. Entre deux pièces collées, une seule porte s’ouvre, au milieu du mur commun.</p>
    <p>Créatures et aventuriers ne passent que par les portes. En {c:invasion|invasion}, la bande ne cherche pas le plus court chemin : elle traverse quelques pièces tirées au hasard, puis le Cœur. Colle tes {c:pieges|pièges} dans les couloirs qui bordent tes pièces : ils frappent la bande quand elle y entre.</p>` },
  meubler: { cat: 'build', t: 'Meubler', x: () => `<p>Les meubles donnent ses effets à une pièce : {furn:paillasse|lits}, {furn:chaudron|repas}, {furn:fourneau|or}, {furn:etagere|bouche-à-oreille}… Chaque meuble va dans sa pièce : <b>touche la pièce</b>, sa fiche liste tout ce qu’on peut y coller, avec ses effets (grisé, avec la raison, s’il ne se pose pas encore), puis « Coller ici ». La {cat:decor|déco} et les trésors, eux, sont dans le bouton Construire et se posent partout, même dans les couloirs.</p>
    <ul><li>Une pièce <b>meublée</b> attire son espèce ({c:creatures}).</li><li>Une pièce se meuble <b>une fois terminée</b> : on la bâtit, on laisse passer la nuit, puis on l’aménage.</li><li>Décoller un meuble est <b>gratuit</b> : il reste offert (×N dans la fiche de la pièce) et se recolle sans rien payer.</li>
    <li>Bougies, torches, fourneaux et cristaux <b>éclairent</b> la pièce.</li><li>La déco préférée d’une espèce rend ses membres plus heureux ({c:humeur}).</li>
    <li>Chaque meuble et chaque déco donne aussi sa <b>carte</b> au combat : dans le sac des {c:expeditions|expéditions}, et dans les combats d’{c:invasion|invasion} de sa pièce (une bibliothèque fait piocher, une marmite empoisonne, un établi rafistole…). Un meuble <b>de qualité</b> (au moins ${FINE_PRICE} 💰+🪵, ou de palier 2) la donne déjà améliorée ✦. Sa fiche dit laquelle.</li></ul>` },
  themes: { cat: 'build', t: 'Thèmes de château', x: () => `<p>Choisi au début de la partie, le thème donne un bonus permanent et une pièce unique livrée meublée :</p><ul>${Object.entries(THEMES).map(([k, t]) => `<li><b>${esc(t.name)}</b> : ${esc(t.desc)} Pièce : {room:${t.room}}.</li>`).join('')}</ul>` },
  ressources: { cat: 'eco', t: 'Or, bois, notoriété', x: () => `<ul><li><b>Or</b> : pièces, meubles, paliers, achats en ville. Vient du {room:coeur} (+2 par nuit), des {c:raids|raids}, de la {room:forge}, du {room:tresor}, des rançons ({c:prisonniers}).</li>
    <li><b>Bois</b> 🪵 : surtout pour bâtir. Il vient de l’{room:atelier|Atelier} (ses {furn:etabli|établis}), de la {room:forge}, de la {room:mine} (ses {furn:wagonnet|wagonnets}), des gobelins chapardeurs et des raids sur les fermes.</li>
    <li><b>Notoriété</b> 🔥 : ce qu’on dit de ton château, son éclat plus le bouche-à-oreille. Elle débloque les {c:paliers|paliers}, mais dès ${NOTO.menace} elle remplit la {c:menace|Menace} de 1 chaque nuit, et elle renforce les aventuriers. Voir {c:notoriete}.</li></ul>` },
  ambiance: { cat: 'eco', t: 'Ambiance', x: () => `<p>L’Ambiance additionne la déco, certains meubles, certaines pièces et le bonus de quelques créatures.</p>
    <ul><li>Si elle atteint le nombre de créatures : +1 à l’{c:humeur|humeur} visée de chacune.</li><li>Sous la moitié du nombre de créatures : +1 {c:calamite|Calamité} par nuit (château lugubre).</li>
    <li>Elle fait venir les créatures plus volontiers : +3 % de chance par point, et une deuxième arrivée possible dès 8.</li><li>Elle donne son titre au château : ${TITLES.map(([m, n]) => `${esc(n)} (${m}+)`).join(', ')}.</li></ul>` },
  lits_repas: { cat: 'eco', t: 'Lits et repas', x: () => `<ul><li><b>Lits</b> : une nouvelle créature ne s’installe que s’il reste un lit libre. Les lits viennent des {furn:paillasse|paillasses}, {furn:litsup|lits superposés}, {furn:cercueil|cercueils}… et du Cœur (2).</li>
    <li><b>Repas</b> : chaque créature mange une ration par nuit (le troll deux). Le Cœur en fournit 3 ; ensuite il faut un {room:potager} ou une {room:cuisine} meublés.</li><li>Une créature affamée perd 2 à son humeur visée, et la faim ajoute +1 {c:calamite|Calamité}. Les dernières arrivées mangent en dernier.</li></ul>` },
  paliers: { cat: 'eco', t: 'Paliers', x: () => `<p>Le palier se monte au <b>Cœur du donjon</b> : touche-le (ou le bouton étoile en bas à droite) pour voir ce qu’il manque. Une étoile dorée brille au-dessus du Cœur quand tout est prêt.</p><p>Monter de palier débloque des pièces, des meubles, des pièges et des créatures. Les bandes d’aventuriers grossissent aussi, et un diablotin de plus peut sortir du Cœur.</p>
    <ul>${TIERS.slice(1).map((t, i) => `<li><b>Palier ${i + 1}</b> : ${t.need.rooms} pièces terminées, ${t.need.hype} de notoriété${t.need.species ? `, ${t.need.species} espèces dans l’album` : ''}${t.need.trone ? ', une {room:trone} avec son trône' : ''} ; coûte ${costText(t.cost)}. Débloque : ${esc(t.unlock)}.</li>`).join('')}</ul><p>L’{c:ambre|Ambre 🟠} ne se trouve qu’en expédition aux cartes : une bonne descente de temps en temps suffit.</p>` },
  ambre: { cat: 'eco', t: 'L’Ambre', x: () => { const D = typeof INV_DIFFS !== 'undefined' ? INV_DIFFS : {}, n = v => String(v).replace('.', ','); return `<p>Une résine dorée, vieille comme les collines, où dort parfois une petite bête. C’est la ressource rare du château : on ne la trouve <b>qu’en expédition aux cartes</b> (bouton Raids, onglet 🃏), dans les donjons rivaux, les lieux d’expédition et à Mirebrume. Ni raid aux dés, ni marché, ni héros vaincus n’en donnent.</p>
    <ul><li><b>Où la trouver</b> : ${AMBER_GAIN.combat} 🟠 par combat gagné, ${AMBER_GAIN.elite} sur une élite, ${AMBER_GAIN.boss} sur un boss ; et un éclat de ${AMBER_GAIN.deep} au fond du troisième étage, pour qui rentre en bon ordre (deux combats gagnés, sans fuir). Comme le reste du butin, la moitié reste au donjon dans une fuite, et une équipe terrassée n’en rapporte qu’un quart.</li>
    <li><b>La difficulté</b> récompense le risque : ${Object.values(D).map(d => `${d.ico} ${esc(d.name)} ×${n(d.amb || 1)}`).join(', ')} (arrondi à chaque combat).</li>
    <li><b>Le combat auto</b> : le manager prend aussi sa part de l’ambre (${Math.round(AUTO_FEE * 100)} %, arrondi : rien sur un petit combat). Mène les combats à la main pour tout garder.</li>
    <li><b>À quoi elle sert</b> : à tout ce qui est grand. Les {c:paliers|paliers} (${TIERS.slice(1).map((t, i) => `Palier ${i + 1} : ${t.cost.a}`).join(', ')}) ; chaque escalier qui ouvre un étage (${AMBER_COST.floor}) ; les {c:remparts|remparts} (${SIZE_COST.slice(1).map(c => c.a).join(' puis ')}) ; le Coin aménagé, second niveau des étagères (${AMBER_COST.shelf}) ; les {c:chantiers|grands chantiers} (${Object.values(CHANTIERS).map(C => `${esc(C.name)} : ${C.cost.a}`).join(', ')}) ; les {c:merveilles|Merveilles} (${AMBER_COST.wonder} au premier niveau, puis de plus en plus) ; le mécénat du Val (${AMBER_COST.mec.join(', ')} selon le niveau, un peu plus en ville et à la Cité).</li>
    <li>Les pièces, les meubles, la déco, les pièges et les premières étagères restent en or et en bois. L’ambre ne s’achète pas « tout en or ».</li></ul>
    <p>Une expédition de temps en temps suffit : une descente réussie en Normal rapporte à peu près de quoi monter au Palier 1.</p>`; } },
  envies: { cat: 'eco', t: 'Envies du château', x: () => `<p>Les envies sont de petits objectifs affichés à droite de l’écran. Chacune comblée rapporte de l’or, du bois ou des stickers gratuits. Elles suivent l’ordre d’une bonne partie : ${GOALS.map(g => esc(g.text)).join(' · ')}.</p>` },
  creatures: { cat: 'crea', t: 'Accueillir des créatures', x: () => `<ul><li>Chaque espèce est attirée par une pièce <b>terminée et meublée</b>, deux par pièce de ce type. Les diablotins sortent du Cœur (2 + palier). L’araignée vient pour deux {furn:toile|toiles}.</li>
    <li>Il faut un {c:lits_repas|lit libre}, et parfois un {c:paliers|palier}.</li><li>À l’aube, une arrivée est parfois tentée : environ une chance sur trois quand une espèce jamais vue attend sa pièce, moins sinon (un peu plus avec l’{c:ambiance|Ambiance}). Une espèce commune jamais vue, dont la pièce est prête, finit toujours par venir : au bout de 4 nuits au plus, même sans place d’accueil (il lui faut un lit libre). C’est une nouvelle page de l’album.</li>
    <li>Chaque espèce a une compétence ; la liste complète est dans le {cat:sp|bestiaire}. Quelle pièce ou quel décor attire quelle espèce : {c:bestiaire}.</li></ul>` },
  humeur: { cat: 'crea', t: 'Humeur', x: () => `<p>Chaque créature a de 0 à 5 cœurs. Chaque nuit, son humeur bouge d’un cran vers l’<b>humeur visée</b> :</p>
    <ul><li>Base 2 ; +1 si sa déco préférée est dans le château ; +1 si l’{c:ambiance|Ambiance} suffit ; +1 si elle est {c:postes|postée} dans sa pièce préférée ;</li><li>−2 si elle a faim ; −1 si une espèce rivale vit au château.</li></ul>
    <ul><li><b>Ravie (4-5)</b> : sa compétence compte double. <b>Boudeuse (0-1)</b> : compétence éteinte et un dé de moins en raid.</li><li>Une envie comblée ou un rêve réalisé font plaisir tout de suite ; la potion de bonne humeur (en ville) et le Grand festin donnent +1 à tout le monde.</li><li>À 0 deux nuits de suite, elle quitte le château (les diablotins restent). Les créatures furieuses font monter la {c:calamite|Calamité}.</li></ul>` },
  postes: { cat: 'crea', t: 'Postes et défense', x: () => `<p>Depuis la fiche d’une créature, choisis son <b>poste</b> : la pièce où elle vit et travaille. Dans sa pièce préférée (★), elle gagne +1 d’humeur visée. C’est aussi là qu’elle apprend son {c:artisanat|métier}.</p>
    <p><b>Le poste ne compte pas pour la défense</b>, et il n’y a rien à placer : quand une bande attaque ({c:invasion}), tes créatures se rangent d’elles-mêmes, <b>de la plus faible à la plus forte</b>, sans hasard. L’annonce de l’invasion montre qui défend quoi :</p>
    <ul><li><b>Au Cœur</b> : ta créature la plus forte (parmi celles qui ne sont pas épuisées), toujours ; quand chaque pièce du parcours a son défenseur, le surplus la rejoint (${INV_TUNE.heartCap} au plus), puis renforce les pièces. Elles se battent jusqu’au bout.</li>
    <li><b>Dans les pièces du parcours</b> : les autres, rangées de la plus faible à la plus forte. La première pièce reçoit les plus faibles, la suivante les suivantes, et ainsi de suite : ${INV_TUNE.teamMax} par pièce (+1 avec un {room:garde}, +1 si un {def:poste} borde la pièce, +1 avec le chemin de ronde des sentinelles). Un héros à terre, et la pièce tient : la bande ne la pille pas.</li>
    <li><b>Trop de créatures</b> pour les places : les plus faibles restent à l’abri. <b>Pas assez</b> : les dernières pièces du parcours n’ont personne ; c’est alors une rencontre, avec une créature qui ne défendait rien (épuisée, ou à l’abri), au hasard.</li>
    <li><b>La fatigue</b> (raids, expéditions) : <b>épuisée</b> (${typeof FAT_TIRED !== 'undefined' ? FAT_TIRED : 4} de fatigue), une créature se repose et ne défend aucune pièce. Au Cœur, une épuisée ne vient que s’il ne reste personne d’autre.</li>
    <li>Ravie (4 cœurs ou plus) : +1 en attaque ; boudeuse (1 cœur ou moins) : −1. Une {c:artisanat|sentinelle} (le guet, appris au {room:garde}) se bat mieux où qu’elle défende.</li>
    <li>Une créature en raid, en mission ou sonnée ne défend rien cette nuit-là.</li></ul>` },
  calamite: { cat: 'danger', t: 'Calamité', x: () => `<p>Une horloge de ${CAL_MAX} segments (cadran rouge) qui mesure le désordre du château. À chaque nuit :</p>
    <ul><li><b>+1</b> si quelqu’un a faim ; <b>+1</b> par créature furieuse (2 au plus) ; <b>+1</b> si le château est lugubre ; <b>+1</b> par tranche de 5 créatures (promiscuité).</li><li><b>−1</b> par point d’apaisement : {room:labo}, {furn:alambic}, {sp:sorciere|sorcières}, {sp:crapaud|crapauds}… et le thème Abbaye maudite.</li>
    <li>Les complications de raid et un Cœur pillé l’augmentent aussi.</li></ul><p>Pleine, une catastrophe tombe au hasard (fête ruineuse, mur effondré, querelle, départ fracassant, rumeur au village) puis l’horloge repart de zéro.</p>` },
  menace: { cat: 'danger', t: 'Menace et contrecoup', x: () => `<p>Une horloge de ${MENACE_MAX} segments (cadran bleu) : à quel point le village a envie d’en découdre.</p>
    <ul><li>Chaque raid réussi l’augmente de la menace de sa cible ; un raid raté de 1.</li><li>Dès ${NOTO.menace} de {c:notoriete|notoriété} : +1 chaque nuit.</li><li>Certaines catastrophes ({c:calamite}) l’augmentent de 2.</li></ul><p>Pleine, des aventuriers attaquent pendant le Contrecoup ({c:invasion}), puis elle repart de zéro. Une {room:tour} avec une {sp:gargouille} te montre la force de la prochaine bande.</p>` },
  // les invasions et leurs combats aux cartes : les articles complets sont écrits dans p70_invasion_ui.js
  invasion: { cat: 'danger', t: 'Invasions', x: () => `<p>Quand la {c:menace|Menace} est pleine, une bande d’aventuriers traverse quelques pièces de ton château, tirées au hasard, puis le Cœur. Tes défenseurs se rangent d’eux-mêmes, des plus faibles aux plus forts ; une pièce défendue : un {c:combat|combat aux cartes}. La bande ne fuit pas.</p>` },
  combat: { cat: 'danger', t: 'Le combat', x: () => `<p>Les combats d’invasion se jouent aux cartes, comme en {c:expeditions|expédition}, mais à l’envers : tes défenseurs (rangés des plus faibles aux plus forts, voir {c:invasion}) contre la bande, jusqu’au bout.</p>` },
  pieges: { cat: 'danger', t: 'Verrous, pièges et ruses', x: () => `<p>Ils se collent dans les <b>couloirs</b>, à tous les étages, contre une pièce. Quand la bande entre dans une pièce voisine, chacun la frappe <b>une fois par invasion</b> (sa force × ${String(INV_TUNE.trapK).replace('.', ',')} en dégâts) et donne sa carte aux combats de cette pièce. Un piège blesse un héros au hasard (la voleuse, ou le {c:nemesis|héros némésis}, désamorce le premier), un verrou fait moitié moins mal au barbare. La {def:barricade}, elle, ne blesse personne : la bande perd du temps à l’enfoncer et pille moitié moins d’or dans la pièce voisine. Le {def:poste} donne une place de défenseur de plus à la pièce qu’il borde ({c:postes}).</p>
    <ul><li><b>Verrous</b> : obstacles solides ({def:porte}, {def:sphinx}). +1 de force avec la Forteresse têtue.</li><li><b>Pièges</b> : dégâts ({def:trappe}, {def:hache}, {def:banane}). +1 de force par {sp:kobold} content (2 au plus).</li>
    <li><b>Ruses</b> : effets spéciaux, et aucune ne fait rebrousser chemin (la bande va toujours jusqu’au Cœur). Le {def:sphinx} retient un héros devant son énigme : il manque la pièce suivante (au Cœur, ou s’il est seul, il perd son premier tour). Avec le {def:leurre}, la bande se dispute le faux butin : tous ses héros perdent leur premier tour au combat suivant. Le {def:ressort} envoie toute la bande dans les douves : chaque héros prend ses dégâts. La {def:cloche}, où qu’elle soit, donne +1 énergie au premier tour du combat du Cœur.</li>
    <li><b>Collants</b> : la {def:banane}, la {def:herse}, la {def:machoire} et le Grand Piège clouent leur victime au sol : elle perd son premier tour au combat suivant.</li></ul>` },
  prisonniers: { cat: 'danger', t: 'Oubliettes et rançons', x: () => `<p>Chaque {furn:cage} des {room:oubliettes} garde un prisonnier. Quand tu repousses une bande, un héros finit en cage s’il reste de la place. À l’aube suivante, chaque prisonnier rapporte 4 or de rançon, puis rentre chez lui.</p>` },
  raids: { cat: 'danger', t: 'Raids et dés', x: () => `<p>Pendant ton tour, le bouton <b>Raids</b>, onglet <b>🎲 Raids aux dés</b>, envoie jusqu’à 3 créatures piller une {cat:raid|cible} : un village, une ferme, l’auberge, le monastère, le château du Baron, ou la cible d’une quête. Le résultat tombe pendant la nuit. Les donjons, les lieux d’expédition et Mirebrume se visitent dans l’autre onglet, <b>🃏 Expéditions aux cartes</b> ({c:expeditions}).</p>
    <ul><li><b>Réserve de dés</b> : les dés de chaque créature, +1 si sa spécialité correspond à la cible, −1 si elle boude, + les bonus de pièces et de meubles ({room:planque}, {furn:caisse}, {furn:fioles}, {furn:ratelier}…), − le risque de la cible.</li>
    <li>On lance tous les dés et on garde <b>le meilleur</b> : 6 = succès total ; 4-5 = succès avec une complication (puces, témoin, blessure) ; 1-3 = échec. Deux 6 = critique : butin ×1,5 et un sticker en prime. Sans dé : 2 dés, on garde le plus bas.</li>
    <li>Un succès rapporte le butin, du bouche-à-oreille et de la {c:menace|Menace}. L’équipe est absente pour la nuit.</li></ul>` },
};
const wikiKey = (kind, key) => kind === 'c' ? key : `${kind}:${key}`;
function wikiTitle(id) {
  const [kind, key] = id.includes(':') ? id.split(':') : ['c', id];
  if (kind === 'c') return WIKI[key] ? WIKI[key].t : key;
  if (kind === 'room') return (ROOMS[key] || {}).name || key; if (kind === 'furn') return (FURN[key] || {}).name || key; if (kind === 'def') return (DEFS[key] || {}).name || key;
  if (kind === 'sp') return (SPECIES[key] || {}).name || key; if (kind === 'hero') return ((HEROES.find(h => h.k === key)) || {}).name || key; if (kind === 'raid') return (RAIDS[key] || {}).name || key;
  return key;
}
function wikiText(s) {
  return s.replace(/\{(\w+):(\w+)(?:\|([^}]+))?\}/g, (m, kind, key, label) => kind === 'cat' ? `<a href="#" data-wikicat="${key}">${esc(label || key)}</a>` : `<a href="#" data-wiki="${wikiKey(kind, key)}">${esc(label || wikiTitle(wikiKey(kind, key)))}</a>`);
}
function wikiList(cat) {
  if (WIKI_CAT.slice(0, 8).some(([k]) => k === cat)) return Object.keys(WIKI).filter(k => WIKI[k].cat === cat).map(k => [k, WIKI[k].t]);
  if (cat === 'room') return Object.keys(ROOMS).filter(k => !(ROOMS[k].theme && ROOMS[k].theme !== S.theme)).map(k => ['room:' + k, ROOMS[k].name]);
  if (cat === 'furn') return FURN_ORDER.map(k => ['furn:' + k, FURN[k].name]);
  if (cat === 'decor') return DECOR_ORDER.map(k => ['furn:' + k, FURN[k].name]);
  if (cat === 'def') return DEF_ORDER.map(k => ['def:' + k, DEFS[k].name]);
  if (cat === 'sp') return SPECIES_ORDER.map(k => ['sp:' + k, S.album[k] ? SPECIES[k].name : SPECIES[k].name + ' ?']);
  if (cat === 'hero') return HEROES.map(h => ['hero:' + h.k, h.name]);
  return Object.keys(RAIDS).map(k => ['raid:' + k, RAIDS[k].name]);
}
const statRows = o => Object.keys(STAT_LABELS).filter(k => o[k]).map(k => `<span class="tag2">${STAT_LABELS[k][0]} ${o[k] > 0 ? '+' : ''}${o[k]} ${STAT_LABELS[k][1]}</span>`).join('');
function wikiArticle(id) {
  const [kind, key] = id.includes(':') ? id.split(':') : ['c', id];
  if (kind === 'c') { const w = WIKI[key] || WIKI.accueil; return `<h2>${esc(w.t)}</h2>${wikiText(w.x())}`; }
  const fig = (src, cls = '') => `<figure class="wfig ${cls}"><img alt="" src="${src}"></figure>`;
  if (kind === 'room') {
    const r = ROOMS[key]; if (!r) return '<p>Article introuvable.</p>';
    const furn = (r.furn || []).filter(k => FURN[k]), fans = SPECIES_ORDER.filter(s => SPECIES[s].from === key);
    return `<div class="whead">${fig(roomThumb(key))}<div><h2>${esc(r.name)}</h2><p class="hint">Pièce · ${r.size[0]}×${r.size[1]}${r.cost ? ` · ${costText(r.cost)}` : ''}${r.clock ? ` · chantier de ${r.clock} segments` : ''}${r.tier ? ` · palier ${r.tier}` : ''}${r.theme ? ` · pièce du thème ${esc(THEMES[r.theme].name)}` : ''}</p></div></div>
      <p>${esc(r.desc || '')}</p>${statRows(r) ? `<h3>Effets de base</h3><div>${statRows(r)}</div>` : ''}
      ${furn.length ? `<h3>Meubles</h3><p>${furn.map(k => `{furn:${k}}`).join(', ')}</p>` : ''}${r.preset ? `<h3>Livrée avec</h3><p>${r.preset.map(k => `{furn:${k}}`).join(', ')}</p>` : ''}
      ${(() => { const sp = ((r.attracts || []).length ? r.attracts : fans).filter(spSeen); return sp.length ? `<h3>Attire</h3><p>${sp.map(s => `{sp:${s}}`).join(', ')}</p>` : ''; })()}
      <h3>Règles</h3><ul>${r.edge ? '<li>Doit toucher les remparts.</li>' : ''}${r.far ? `<li>À ${r.far} pas du porche au moins.</li>` : ''}${r.unique ? '<li>Unique.</li>' : ''}${r.open ? '<li>À ciel ouvert : entourée de haies.</li>' : ''}${r.syn ? `<li>Bonus si elle touche {room:${r.syn.adj}}.</li>` : ''}<li>Voir {c:regles} et {c:construire}.</li></ul>`;
  }
  if (kind === 'furn') {
    const f = FURN[key]; if (!f) return '<p>Article introuvable.</p>';
    const fans = SPECIES_ORDER.filter(s => SPECIES[s].likes === key), l = LIGHTS[key] || LIGHTS[f.sprite];
    // ses cartes au combat (améliorées ✦ si c'est un meuble de qualité) et ce que les créatures y font
    const cards = typeof CASTLE_CARDS !== 'undefined' ? Object.keys(CASTLE_CARDS).filter(k => CASTLE_CARDS[k].from.includes(key)) : [], up = typeof fineSrc === 'function' && fineSrc(key);
    const acts = typeof ACTS !== 'undefined' ? [...new Set(Object.values(ACTS).filter(A => A.items && A.items.includes(key)).map(A => (A.verbs && A.verbs[key]) || A.verb))] : [];
    return `<div class="whead">${fig(thumb('furn', key, true))}<div><h2>${esc(f.name)}</h2><p class="hint">${f.artefact ? 'Trésor, se pose partout' : f.room === 'any' ? 'Déco, se pose partout' : `Meuble de la pièce {room:${f.room}}`}${f.cost ? ` · ${costText(f.cost)}` : ''}${f.tier ? ` · palier ${f.tier}` : ''}${f.unique ? ' · unique' : ''}</p></div></div>
      ${f.desc ? `<p>${esc(f.desc)}</p>` : ''}${statRows(f) ? `<h3>Effets</h3><div>${statRows(f)}</div>` : '<p>Pur plaisir des yeux.</p>'}${l ? `<p>Éclaire autour de lui (rayon ${l[0]} cases).</p>` : ''}
      ${cards.length && furnSeen(key) ? `<h3>Au combat</h3><ul>${cards.map(k => `<li>${CASTLE_CARDS[k].ico} <b>${esc(CASTLE_CARDS[k].name)}${up ? ' ✦' : ''}</b> : ${esc(cardText({ src: 'castle', key: k, up }))}</li>`).join('')}</ul><p class="hint">Dans le sac des {c:expeditions|expéditions}, et dans les combats d’{c:invasion|invasion} de sa pièce.${up ? ' Meuble de qualité : sa carte arrive déjà améliorée.' : ''}</p>` : ''}
      ${fans.filter(spSeen).length ? `<h3>Adoré par</h3><p>${fans.filter(spSeen).map(s => `{sp:${s}}`).join(', ')} : +1 à leur humeur visée.</p>` : ''}${key === 'toile' && spSeen('araignee') ? '<p>Deux toiles attirent une {sp:araignee}.</p>' : ''}<p>Voir {c:meubler}.</p>`;
  }
  if (kind === 'def') {
    const d = DEFS[key]; if (!d) return '<p>Article introuvable.</p>';
    return `<div class="whead">${fig(thumb('def', key, true))}<div><h2>${esc(d.name)}</h2><p class="hint">${d.kind} · force ${d.str} · ${costText(d.cost)}${d.tier ? ` · palier ${d.tier}` : ''}${d.needs ? ` · demande {room:${d.needs}}` : ''}</p></div></div><p>${esc(d.desc)}</p><p>Voir {c:pieges} et {c:invasion}.</p>`;
  }
  if (kind === 'sp') {
    const sp = SPECIES[key]; if (!sp) return '<p>Article introuvable.</p>';
    const has = S.album[key], st = ['guard', 'dice', 'build', 'gold', 'mat', 'hype', 'cal', 'amb', 'trap'].filter(k => sp[k]);
    const lab = { guard: 'Garde', dice: 'Dés de raid', build: 'Travaux', gold: 'Or / nuit', mat: 'Bois / nuit', hype: 'Bouche-à-oreille / nuit', cal: 'Calamité −', amb: 'Ambiance', trap: 'Pièges +' };
    return `<div class="whead">${fig(thumb('char', key, true), has ? 'char' : 'char no')}<div><h2>${esc(sp.name)}</h2><p class="hint">${has ? 'Dans ton album' : 'Pas encore rencontrée'} · attirée par ${sp.from === 'coeur' ? 'le {room:coeur}' : sp.from ? `{room:${sp.from}} meublée` : 'deux {furn:toile|toiles}'}${sp.tier ? ` · palier ${sp.tier}` : ''}</p></div></div>
      <h3>${esc(sp.skill || 'Compétence')}</h3><p>${esc(sp.sd || '')}</p><div>${st.map(k => `<span class="tag2">${lab[k]} ${sp[k]}</span>`).join('')}${sp.tag ? `<span class="tag2">Spécialité : ${TAGS[sp.tag]}</span>` : ''}${sp.eats > 1 ? '<span class="tag2">Mange pour deux</span>' : ''}</div>
      <h3>Caractère</h3><ul>${sp.likes ? `<li>Adore : {furn:${sp.likes}}.</li>` : ''}${sp.rival ? `<li>Ne supporte pas : {sp:${sp.rival}}.</li>` : ''}<li>Voir {c:humeur} et {c:postes}.</li></ul>
      ${has && sp.lines ? `<h3>Répliques</h3><p class="lines">${sp.lines.map(l => `« ${esc(l)} »`).join('<br>')}</p>` : ''}`;
  }
  if (kind === 'hero') {
    const h = HEROES.find(x => x.k === key); if (!h) return '<p>Article introuvable.</p>';
    const E = typeof CRAWL_EN !== 'undefined' && CRAWL_EN['h_' + key];
    return `<div class="whead">${fig(thumb('hero', key, true), 'char')}<div><h2>${esc(h.name)}</h2><p class="hint">Aventurier${E ? ` · ${E.hp} PV de base` : ''}</p></div></div><p>Un aventurier du Val Douillet, plus brave que malin. En invasion, tes défenseurs l’affrontent aux cartes : au-dessus de sa tête, tu vois toujours son prochain coup.${key === 'voleuse' ? ' La voleuse désamorce le premier piège de la bande.' : key === 'barbare' ? ' Le barbare enfonce les verrous : ils lui font moitié moins mal.' : ''} Ses PV et ses coups grandissent avec la force de tes meilleures créatures et le palier de ton château, et chaque pièce pillée rend la bande plus forte. Voir {c:combat|le combat}.</p>`;
  }
  if (kind === 'raid') {
    const r = RAIDS[key]; if (!r) return '<p>Article introuvable.</p>';
    // le Siège de Mirebrume ne se joue plus aux dés : trois assauts aux cartes, un par quartier
    if (r.siege && typeof SIEGE_Q !== 'undefined') return `<div class="whead"><figure class="wfig emoji"><span class="emo">${r.emo}</span></figure><div><h2>${esc(r.name)}</h2><p class="hint">Expédition en cartes · palier ${r.tier} · finale de la Victoire de Terreur</p></div></div>
      <p>${esc(r.desc)}</p><ul>${SIEGE_Q.map((q, i) => `<li><b>Assaut ${i + 1} : ${esc(q.name)}</b>. ${esc(q.desc)}</li>`).join('')}</ul>
      <ul><li>Chaque assaut est une expédition de 4 créatures : trois étages, puis le chef du quartier. Il ne compte que si le chef tombe ; les assauts réussis restent acquis.</li><li>Un assaut réussi : une rançon de ${costText(r.reward)}, +${r.hype} 💬, +${r.menace} {c:menace|Menace}.</li></ul><p>Voir {c:v_terreur} et {c:expeditions}.</p>`;
    return `<div class="whead"><figure class="wfig emoji"><span class="emo">${r.emo}</span></figure><div><h2>${esc(r.name)}</h2><p class="hint">Cible de raid${r.tier ? ` · palier ${r.tier}` : ''} · spécialité ${TAGS[r.tag]}${r.risk ? ` · risque ${r.risk} (−${r.risk} dé)` : ''}</p></div></div>
      <p>${esc(r.desc)}</p><ul><li>Butin : ${costText(r.reward)}${r.bonus ? `, et un sticker {furn:${r.bonus}} en cas de succès total` : ''}.</li><li>+${r.hype} 💬, +${r.menace} {c:menace|Menace}.</li></ul><p>Voir {c:raids}.</p>`;
  }
  return '<p>Article introuvable.</p>';
}
function openGrimoire(id = 'accueil') {
  UI.wiki = { id, hist: [], cat: null, q: '' };
  const m = openModal(`<div class="grim"><aside class="gnav"><input type="search" id="gq" placeholder="Chercher (ex. lits, menace, troll)" aria-label="Chercher dans le Grimoire"><div id="gcats"></div></aside><article class="gart" id="gart"></article></div>`, { wide: true, cls: 'grimoire', label: 'Grimoire' });
  const nav = () => {
    const q = UI.wiki.q.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
    $('#gcats').innerHTML = WIKI_CAT.map(([c, l]) => { const items = wikiList(c).filter(([, t]) => !q || t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().includes(q)); if (!items.length) return ''; const open = q || UI.wiki.cat === c || items.some(([i]) => i === UI.wiki.id);
      return `<details${open ? ' open' : ''} data-cat="${c}"><summary>${l} <small>${items.length}</small></summary>${items.map(([i, t]) => `<a href="#" data-wiki="${i}" class="${i === UI.wiki.id ? 'on' : ''}">${esc(t)}</a>`).join('')}</details>`; }).join('') || '<p class="hint">Rien trouvé.</p>';
  };
  const show = (nid, push = true) => { if (push && UI.wiki.id !== nid) UI.wiki.hist.push(UI.wiki.id); UI.wiki.id = nid; $('#gart').innerHTML = `${UI.wiki.hist.length ? '<button type="button" class="sbtn gback" data-wback>← Retour</button>' : ''}${wikiText(wikiArticle(nid))}`; $('#gart').scrollTop = 0; nav(); };
  m.addEventListener('click', e => {
    const a = e.target.closest('[data-wiki]'); if (a) { e.preventDefault(); show(a.dataset.wiki); return; }
    const c = e.target.closest('[data-wikicat]'); if (c) { e.preventDefault(); UI.wiki.cat = c.dataset.wikicat; const first = wikiList(c.dataset.wikicat)[0]; if (first) show(first[0]); return; }
    if (e.target.closest('[data-wback]')) { const p = UI.wiki.hist.pop(); if (p) show(p, false); }
  });
  m.querySelector('#gq').addEventListener('input', e => { UI.wiki.q = e.target.value; nav(); });
  show(id, false);
}
const CHIP_WIKI = { gold: 'ressources', mat: 'ressources', hype: 'ressources', amb: 'ambiance', beds: 'lits_repas', food: 'lits_repas', tier: 'paliers', night: 'nuit' };

// ce que le Grimoire révèle au fil de la partie : une espèce déjà accueillie, un meuble déjà posé une fois
const spSeen = s => !!(typeof S !== 'undefined' && S && S.album && S.album[s]);
const furnSeen = t => !!(typeof S !== 'undefined' && S && ((S.stats && S.stats.furnSeen && S.stats.furnSeen[t]) || (S.furn || []).some(f => f.t === t)));
const placeFurnSeen = placeFurn;
placeFurn = function (t) { const f = placeFurnSeen.apply(this, arguments); try { (S.stats.furnSeen = S.stats.furnSeen || {})[t] = 1; } catch (e) {} return f; };
