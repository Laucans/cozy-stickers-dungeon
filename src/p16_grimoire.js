
/* =========================================================
   Grimoire du Maître : l'encyclopédie du jeu (façon Civilopédie)
   Articles de mécaniques écrits à la main + fiches générées depuis
   les données vivantes (elles suivent les réglages de l'Atelier)
   ========================================================= */
const WIKI_CAT = [['bases', 'Les bases'], ['build', 'Construire'], ['eco', 'Économie'], ['crea', 'Créatures'], ['danger', 'Dangers et raids'], ['ames', 'Âmes du château'], ['val', 'Le Val : carte et voisins'],
  ['room', 'Pièces'], ['furn', 'Meubles'], ['decor', 'Déco'], ['def', 'Pièges'], ['sp', 'Bestiaire'], ['hero', 'Aventuriers'], ['raid', 'Cibles de raid']];
const WIKI = {
  accueil: { cat: 'bases', t: 'Bienvenue dans le Grimoire', x: () => `<p>Ce grimoire explique tout le jeu. Chaque mot souligné mène à un autre article.</p>
    <ul><li>Nouveau venu ? Lis {c:but}, puis {c:nuit} et {c:construire}.</li><li>Tes créatures boudent ? Va voir {c:humeur} et {c:lits_repas}.</li><li>Des héros arrivent ? Lis {c:invasion} et {c:pieges}.</li><li>Tu veux du butin ? Tout est dans {c:raids}.</li><li>Une créature lorgne ailleurs ? Lis {c:loyaute} et {c:reputation}.</li><li>Tes créatures ont des demandes ? Voir {c:missions}. Tes exploits ? {c:hautsfaits}.</li><li>Jouer avec d’autres Maîtres : {c:val} et {c:partage}.</li></ul>
    <p>Les fiches des {cat:room|pièces}, {cat:furn|meubles}, {cat:def|pièges}, {cat:sp|créatures} et {cat:raid|cibles de raid} sont tirées des vraies valeurs du jeu.</p>` },
  but: { cat: 'bases', t: 'Le but du jeu', x: () => `<p>Tu es le Maître d’un petit château maléfique… et douillet. Tu colles des pièces, tu les meubles, et chaque pièce meublée attire de nouvelles créatures qui travaillent pour toi.</p>
    <p>Tes {c:raids|raids} rapportent de l’or et de la {c:ressources|notoriété}, mais la notoriété attire les aventuriers ({c:menace}). À toi de les décourager avec des {c:pieges|pièges} et des gardes.</p>
    <p>Objectif : atteindre le {c:paliers|Palier 3} pour rendre ton château légendaire. Ensuite, tu peux continuer à jouer librement.</p>` },
  controles: { cat: 'bases', t: 'Commandes', x: () => `<ul><li><b>Se déplacer</b> : fais glisser le château. Flèches du clavier aussi.</li><li><b>Zoomer</b> : molette, pincement, ou les boutons + et −. Le bouton ⤢ recadre tout le château.</li>
    <li><b>Coller un sticker</b> : touche une carte de la barre du bas, puis touche le château. À la souris, tu peux aussi glisser la carte. Sur téléphone : touche une fois pour viser, une seconde fois au même endroit pour coller.</li>
    <li><b>Tourner une pièce</b> : touche R ou le bouton ⟳. <b>Ranger le sticker</b> : Échap.</li><li><b>Voir une fiche</b> : touche une pièce, un meuble, un piège ou une créature. Un clic droit sur une carte de la barre ouvre sa page du Grimoire.</li>
    <li>Les chiffres en haut de l’écran mènent aussi au Grimoire.</li></ul>` },
  nuit: { cat: 'bases', t: 'Une nuit, cinq temps', x: () => `<p>Le jeu avance nuit par nuit, comme dans le jeu de rôle Wicked Ones. Le bouton <b>Finir la nuit</b> déroule les étapes dans l’ordre :</p>
    <ol><li><b>Rôder</b> : ton tour. Construis, meuble, donne des {c:postes|postes}, prépare un {c:raids|raid}. Rien ne presse.</li><li><b>Calamité</b> : l’horloge de {c:calamite|Calamité} avance selon le bien-être du château.</li>
    <li><b>Raid</b> : si un raid est prévu, ton équipe lance ses dés.</li><li><b>Contrecoup</b> : si l’horloge de {c:menace|Menace} est pleine, des aventuriers attaquent ({c:invasion}).</li>
    <li><b>Aube</b> : les chantiers avancent, les pièces produisent, les humeurs changent et de nouvelles créatures arrivent. La chronique résume la nuit.</li></ol>` },
  construire: { cat: 'build', t: 'Construire une pièce', x: () => `<p>Choisis une pièce dans l’onglet <b>Pièces</b> et colle-la contre le château. Elle coûte de l’or et des matériaux, puis démarre en <b>chantier</b>.</p>
    <p>Un chantier porte une horloge de 4, 6 ou 8 segments. À chaque {c:nuit|aube}, tes ouvriers en remplissent ${CONSTS.WORK}, plus 1 par diablotin et par orque (2 s’ils sont ravis). Le plus ancien chantier passe en premier.</p>
    <ul><li><b>Coup de pouce</b> : 2 or pour 1 segment tout de suite, depuis la fiche du chantier.</li><li><b>Décoller</b> une pièce terminée rend la moitié de son prix ; un chantier annulé est remboursé.</li><li>Les <b>couloirs</b> se posent instantanément et relient tout.</li></ul>
    <p>Voir aussi {c:regles}, {c:portes} et {c:meubler}.</p>` },
  regles: { cat: 'build', t: 'Règles de placement', x: () => `<ul><li>Une pièce doit <b>toucher</b> le château (une pièce ou un couloir) et rester dans les remparts.</li><li>La {room:tour} doit toucher les remparts.</li>
    <li>Certaines pièces veulent être <b>loin du porche</b> (en pas) : ${Object.keys(ROOMS).filter(k => ROOMS[k].far).map(k => `{room:${k}} ${ROOMS[k].far}`).join(', ')}.</li><li>Des pièces sont <b>uniques</b> ou demandent un {c:paliers|palier}. Chaque {c:themes|thème} offre sa pièce unique.</li>
    <li><b>Voisinage</b> : ${Object.keys(ROOMS).filter(k => ROOMS[k].syn).map(k => `{room:${k}} contre {room:${ROOMS[k].syn.adj}}`).join(', ')} donnent un bonus.</li></ul>` },
  portes: { cat: 'build', t: 'Portes et chemins', x: () => `<p>Une porte s’ouvre toute seule entre un couloir et sa voisine. Entre deux pièces collées, une seule porte s’ouvre, au milieu du mur commun.</p>
    <p>Créatures et aventuriers ne passent que par les portes. Les aventuriers prennent toujours <b>le plus court chemin</b> du porche au Cœur : le bouton <b>Chemin</b> l’affiche en pointillés dorés. Place tes {c:pieges|pièges} dessus, ou allonge le chemin en réorganisant tes couloirs.</p>` },
  meubler: { cat: 'build', t: 'Meubler', x: () => `<p>Les meubles donnent ses effets à une pièce : {furn:paillasse|lits}, {furn:chaudron|repas}, {furn:fourneau|or}, {furn:etagere|notoriété}… Chaque meuble va dans sa pièce ; la {cat:decor|déco} se pose partout, même dans les couloirs.</p>
    <ul><li>Une pièce <b>meublée</b> attire son espèce ({c:creatures}).</li><li>On peut meubler un chantier à l’avance : les effets démarrent quand il est terminé.</li><li>Décoller un meuble est <b>gratuit</b> : il retourne dans ta barre (badge vert ×N).</li>
    <li>Bougies, torches, fourneaux et cristaux <b>éclairent</b> la pièce.</li><li>La déco préférée d’une espèce rend ses membres plus heureux ({c:humeur}).</li></ul>` },
  themes: { cat: 'build', t: 'Thèmes de château', x: () => `<p>Choisi au début de la partie, le thème donne un bonus permanent et une pièce unique livrée meublée :</p><ul>${Object.entries(THEMES).map(([k, t]) => `<li><b>${esc(t.name)}</b> : ${esc(t.desc)} Pièce : {room:${t.room}}.</li>`).join('')}</ul>` },
  ressources: { cat: 'eco', t: 'Or, matériaux, notoriété', x: () => `<ul><li><b>Or</b> : pièces, meubles, paliers, friandises. Vient du {room:coeur} (+2 par nuit), des {c:raids|raids}, de la {room:forge}, du {room:tresor}, des rançons ({c:prisonniers}).</li>
    <li><b>Matériaux</b> : surtout pour bâtir. Viennent de la {room:atelier|l’Atelier}, des gobelins chapardeurs et des raids sur les fermes.</li>
    <li><b>Notoriété</b> : ta réputation maléfique. Elle débloque les {c:paliers|paliers}, mais au-delà de 3 elle remplit la {c:menace|Menace} de 1 chaque nuit, et elle renforce les aventuriers.</li></ul>` },
  ambiance: { cat: 'eco', t: 'Ambiance', x: () => `<p>L’Ambiance additionne la déco, certains meubles, certaines pièces et le bonus de quelques créatures.</p>
    <ul><li>Si elle atteint le nombre de créatures : +1 à l’{c:humeur|humeur} visée de chacune.</li><li>Sous la moitié du nombre de créatures : +1 {c:calamite|Calamité} par nuit (château lugubre).</li>
    <li>Elle fait venir les créatures plus volontiers : +3 % de chance par point, et une deuxième arrivée possible dès 8.</li><li>Elle donne son titre au château : ${TITLES.map(([m, n]) => `${esc(n)} (${m}+)`).join(', ')}.</li></ul>` },
  lits_repas: { cat: 'eco', t: 'Lits et repas', x: () => `<ul><li><b>Lits</b> : une nouvelle créature ne s’installe que s’il reste un lit libre. Les lits viennent des {furn:paillasse|paillasses}, {furn:litsup|lits superposés}, {furn:cercueil|cercueils}… et du Cœur (2).</li>
    <li><b>Repas</b> : chaque créature mange une ration par nuit (le troll deux). Le Cœur en fournit 3 ; ensuite il faut un {room:potager} ou une {room:cuisine} meublés.</li><li>Une créature affamée perd 2 à son humeur visée, et la faim ajoute +1 {c:calamite|Calamité}. Les dernières arrivées mangent en dernier.</li></ul>` },
  paliers: { cat: 'eco', t: 'Paliers', x: () => `<p>Monter de palier débloque des pièces, des meubles, des pièges et des créatures. Les bandes d’aventuriers grossissent aussi, et un diablotin de plus peut sortir du Cœur.</p>
    <ul>${TIERS.slice(1).map((t, i) => `<li><b>Palier ${i + 1}</b> : ${t.need.rooms} pièces terminées, ${t.need.hype} de notoriété${t.need.species ? `, ${t.need.species} espèces dans l’album` : ''}${t.need.trone ? ', une {room:trone} avec son trône' : ''} ; coûte ${costText(t.cost)}. Débloque : ${esc(t.unlock)}.</li>`).join('')}</ul>` },
  envies: { cat: 'eco', t: 'Envies du château', x: () => `<p>Les envies sont de petits objectifs affichés à droite de l’écran. Chacune comblée rapporte de l’or, des matériaux ou des stickers gratuits. Elles suivent l’ordre d’une bonne partie : ${GOALS.map(g => esc(g.text)).join(' · ')}.</p>` },
  creatures: { cat: 'crea', t: 'Accueillir des créatures', x: () => `<ul><li>Chaque espèce est attirée par une pièce <b>terminée et meublée</b>, deux par pièce de ce type. Les diablotins sortent du Cœur (2 + palier). L’araignée vient pour deux {furn:toile|toiles}.</li>
    <li>Il faut un {c:lits_repas|lit libre}, et parfois un {c:paliers|palier}.</li><li>À l’aube, une arrivée est tentée (60 % + 3 % par point d’{c:ambiance|Ambiance}). Une espèce jamais vue arrive à coup sûr : c’est une nouvelle page de l’album.</li>
    <li>Chaque espèce a une compétence ; la liste complète est dans le {cat:sp|bestiaire}.</li></ul>` },
  humeur: { cat: 'crea', t: 'Humeur', x: () => `<p>Chaque créature a de 0 à 5 cœurs. Chaque nuit, son humeur bouge d’un cran vers l’<b>humeur visée</b> :</p>
    <ul><li>Base 2 ; +1 si sa déco préférée est dans le château ; +1 si l’{c:ambiance|Ambiance} suffit ; +1 si elle est {c:postes|postée} dans sa pièce préférée ;</li><li>−2 si elle a faim ; −1 si une espèce rivale vit au château.</li></ul>
    <ul><li><b>Ravie (4-5)</b> : sa compétence compte double. <b>Boudeuse (0-1)</b> : compétence éteinte et un dé de moins en raid.</li><li>Caresse (1 fois par nuit) et friandise (1 or, 1 fois par nuit) donnent +1 tout de suite.</li><li>À 0 deux nuits de suite, elle quitte le château (les diablotins restent). Les créatures furieuses font monter la {c:calamite|Calamité}.</li></ul>` },
  postes: { cat: 'crea', t: 'Postes et défense', x: () => `<p>Depuis la fiche d’une créature, choisis son <b>poste</b>. Postée, elle reste dans cette pièce et la <b>défend</b> si des aventuriers la traversent : sa garde retire autant de courage. Dans sa pièce préférée (★), elle gagne +1 d’humeur visée.</p>
    <p>Les créatures <b>libres</b> se promènent et défendent toutes le Cœur en dernier rempart. Une créature en raid ne défend rien cette nuit-là.</p>` },
  calamite: { cat: 'danger', t: 'Calamité', x: () => `<p>Une horloge de ${CAL_MAX} segments (cadran rouge) qui mesure le désordre du château. À chaque nuit :</p>
    <ul><li><b>+1</b> si quelqu’un a faim ; <b>+1</b> par créature furieuse (2 au plus) ; <b>+1</b> si le château est lugubre ; <b>+1</b> par tranche de 5 créatures (promiscuité).</li><li><b>−1</b> par point d’apaisement : {room:labo}, {furn:alambic}, {sp:sorciere|sorcières}, {sp:crapaud|crapauds}… et le thème Abbaye maudite.</li>
    <li>Les complications de raid et un Cœur pillé l’augmentent aussi.</li></ul><p>Pleine, une catastrophe tombe au hasard (fête ruineuse, mur effondré, querelle, départ fracassant, rumeur au village) puis l’horloge repart de zéro.</p>` },
  menace: { cat: 'danger', t: 'Menace et contrecoup', x: () => `<p>Une horloge de ${MENACE_MAX} segments (cadran bleu) : à quel point le village a envie d’en découdre.</p>
    <ul><li>Chaque raid réussi l’augmente de la menace de sa cible ; un raid raté de 1.</li><li>Au-delà de 3 de notoriété : +1 chaque nuit.</li><li>Certaines catastrophes ({c:calamite}) l’augmentent de 2.</li></ul><p>Pleine, des aventuriers attaquent pendant le Contrecoup ({c:invasion}), puis elle repart de zéro. Une {room:tour} avec une {sp:gargouille} te montre la force de la prochaine bande.</p>` },
  invasion: { cat: 'danger', t: 'Invasions', x: () => `<ul><li><b>La bande</b> : 2 aventuriers + 1 par palier (+1 au-delà de 10 de notoriété), 5 au plus. <b>Courage</b> : la somme de leurs courages + 2 par palier + notoriété ÷ 5.</li>
    <li>Ils entrent par le porche et suivent le {c:portes|plus court chemin} jusqu’au Cœur.</li><li>En route, perdent du courage : la {room:tour} à leur arrivée, chaque {c:pieges|piège} traversé, chaque pièce gardée ({c:postes}), puis la défense du Cœur.</li>
    <li><b>Courage à 0</b> : ils fuient. +2 or par héros, +1 notoriété, +1 humeur pour tous, et un prisonnier si les {room:oubliettes} ont de la place.</li><li><b>Perdus</b> (énigme, faux trésor) : ils repartent bredouilles, +1 notoriété.</li>
    <li><b>Cœur atteint</b> : ils volent 3 + 2 × palier en or, +2 Calamité et −1 humeur pour tous.</li></ul>` },
  pieges: { cat: 'danger', t: 'Verrous, pièges et ruses', x: () => `<p>Ils se collent uniquement dans les <b>couloirs</b>, et ne servent que sur le chemin des aventuriers.</p>
    <ul><li><b>Verrous</b> : obstacles solides ({def:porte}, {def:sphinx}). +1 de force avec la Forteresse têtue.</li><li><b>Pièges</b> : dégâts ({def:trappe}, {def:hache}, {def:banane}). +1 de force par {sp:kobold} content (2 au plus).</li>
    <li><b>Ruses</b> : effets spéciaux. Le {def:leurre} et le {def:sphinx} peuvent perdre les héros ; la {def:cloche} donne +1 de garde à chaque créature libre au Cœur ; la peau de banane renforce la rencontre suivante.</li></ul>` },
  prisonniers: { cat: 'danger', t: 'Oubliettes et rançons', x: () => `<p>Chaque {furn:cage} des {room:oubliettes} garde un prisonnier. Quand tu repousses une bande, un héros finit en cage s’il reste de la place. À l’aube suivante, chaque prisonnier rapporte 4 or de rançon, puis rentre chez lui.</p>` },
  raids: { cat: 'danger', t: 'Raids et dés', x: () => `<p>Pendant ton tour, le bouton <b>Raid</b> envoie jusqu’à 3 créatures piller une {cat:raid|cible}. Le résultat tombe pendant la nuit.</p>
    <ul><li><b>Réserve de dés</b> : les dés de chaque créature, +1 si sa spécialité correspond à la cible, −1 si elle boude, + les bonus de pièces et de meubles ({room:planque}, {furn:fioles}, {furn:ratelier}…), − le risque de la cible.</li>
    <li>On lance tous les dés et on garde <b>le meilleur</b> : 6 = succès total ; 4-5 = succès avec une complication (puces, témoin, blessure) ; 1-3 = échec. Deux 6 = critique : butin ×1,5 et un sticker en prime. Sans dé : 2 dés, on garde le plus bas.</li>
    <li>Un succès rapporte le butin, de la notoriété et de la {c:menace|Menace}. L’équipe est absente pour la nuit.</li></ul>` },
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
  if (WIKI_CAT.slice(0, 7).some(([k]) => k === cat)) return Object.keys(WIKI).filter(k => WIKI[k].cat === cat).map(k => [k, WIKI[k].t]);
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
      ${(r.attracts || []).length ? `<h3>Attire</h3><p>${r.attracts.map(s => `{sp:${s}}`).join(', ')} (une fois meublée)</p>` : fans.length ? `<h3>Attire</h3><p>${fans.map(s => `{sp:${s}}`).join(', ')}</p>` : ''}
      <h3>Règles</h3><ul>${r.edge ? '<li>Doit toucher les remparts.</li>' : ''}${r.far ? `<li>À ${r.far} pas du porche au moins.</li>` : ''}${r.unique ? '<li>Unique.</li>' : ''}${r.open ? '<li>À ciel ouvert : entourée de haies.</li>' : ''}${r.syn ? `<li>Bonus si elle touche {room:${r.syn.adj}}.</li>` : ''}<li>Voir {c:regles} et {c:construire}.</li></ul>`;
  }
  if (kind === 'furn') {
    const f = FURN[key]; if (!f) return '<p>Article introuvable.</p>';
    const fans = SPECIES_ORDER.filter(s => SPECIES[s].likes === key), l = LIGHTS[key] || LIGHTS[f.sprite];
    return `<div class="whead">${fig(thumb('furn', key, true))}<div><h2>${esc(f.name)}</h2><p class="hint">${f.room === 'any' ? 'Déco, se pose partout' : `Meuble de la pièce {room:${f.room}}`} · ${costText(f.cost)}${f.tier ? ` · palier ${f.tier}` : ''}${f.unique ? ' · unique' : ''}</p></div></div>
      ${statRows(f) ? `<h3>Effets</h3><div>${statRows(f)}</div>` : '<p>Pur plaisir des yeux.</p>'}${l ? `<p>Éclaire autour de lui (rayon ${l[0]} cases).</p>` : ''}
      ${fans.length ? `<h3>Adoré par</h3><p>${fans.map(s => `{sp:${s}}`).join(', ')} : +1 à leur humeur visée.</p>` : ''}${key === 'toile' ? '<p>Deux toiles attirent une {sp:araignee}.</p>' : ''}<p>Voir {c:meubler}.</p>`;
  }
  if (kind === 'def') {
    const d = DEFS[key]; if (!d) return '<p>Article introuvable.</p>';
    return `<div class="whead">${fig(thumb('def', key, true))}<div><h2>${esc(d.name)}</h2><p class="hint">${d.kind} · force ${d.str} · ${costText(d.cost)}${d.tier ? ` · palier ${d.tier}` : ''}${d.needs ? ` · demande {room:${d.needs}}` : ''}</p></div></div><p>${esc(d.desc)}</p><p>Voir {c:pieges} et {c:invasion}.</p>`;
  }
  if (kind === 'sp') {
    const sp = SPECIES[key]; if (!sp) return '<p>Article introuvable.</p>';
    const has = S.album[key], st = ['guard', 'dice', 'build', 'gold', 'mat', 'hype', 'cal', 'amb', 'trap'].filter(k => sp[k]);
    const lab = { guard: 'Garde', dice: 'Dés de raid', build: 'Travaux', gold: 'Or / nuit', mat: 'Matériaux / nuit', hype: 'Notoriété / nuit', cal: 'Calamité −', amb: 'Ambiance', trap: 'Pièges +' };
    return `<div class="whead">${fig(thumb('char', key, true), has ? 'char' : 'char no')}<div><h2>${esc(sp.name)}</h2><p class="hint">${has ? 'Dans ton album' : 'Pas encore rencontrée'} · attirée par ${sp.from === 'coeur' ? 'le {room:coeur}' : sp.from ? `{room:${sp.from}} meublée` : 'deux {furn:toile|toiles}'}${sp.tier ? ` · palier ${sp.tier}` : ''}</p></div></div>
      <h3>${esc(sp.skill || 'Compétence')}</h3><p>${esc(sp.sd || '')}</p><div>${st.map(k => `<span class="tag2">${lab[k]} ${sp[k]}</span>`).join('')}${sp.tag ? `<span class="tag2">Spécialité : ${TAGS[sp.tag]}</span>` : ''}${sp.eats > 1 ? '<span class="tag2">Mange pour deux</span>' : ''}</div>
      <h3>Caractère</h3><ul>${sp.likes ? `<li>Adore : {furn:${sp.likes}}.</li>` : ''}${sp.rival ? `<li>Ne supporte pas : {sp:${sp.rival}}.</li>` : ''}<li>Voir {c:humeur} et {c:postes}.</li></ul>
      ${has && sp.lines ? `<h3>Répliques</h3><p class="lines">${sp.lines.map(l => `« ${esc(l)} »`).join('<br>')}</p>` : ''}`;
  }
  if (kind === 'hero') {
    const h = HEROES.find(x => x.k === key); if (!h) return '<p>Article introuvable.</p>';
    return `<div class="whead">${fig(thumb('hero', key, true), 'char')}<div><h2>${esc(h.name)}</h2><p class="hint">Aventurier · courage ${h.c}</p></div></div><p>Un aventurier du Val Douillet, plus brave que malin. Son courage s’ajoute à celui de sa bande lors d’une {c:invasion|invasion}.</p>`;
  }
  if (kind === 'raid') {
    const r = RAIDS[key]; if (!r) return '<p>Article introuvable.</p>';
    return `<div class="whead"><figure class="wfig emoji"><span class="emo">${r.emo}</span></figure><div><h2>${esc(r.name)}</h2><p class="hint">Cible de raid${r.tier ? ` · palier ${r.tier}` : ''} · spécialité ${TAGS[r.tag]}${r.risk ? ` · risque ${r.risk} (−${r.risk} dé)` : ''}</p></div></div>
      <p>${esc(r.desc)}</p><ul><li>Butin : ${costText(r.reward)}${r.bonus ? `, et un sticker {furn:${r.bonus}} en cas de succès total` : ''}.</li><li>+${r.hype} notoriété, +${r.menace} {c:menace|Menace}.</li></ul><p>Voir {c:raids}.</p>`;
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
