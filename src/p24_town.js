
/* =========================================================
   En ville : le Maître, déguisé (fausse moustache), fait ses
   emplettes. Épicerie-buvette des villages, bazar, apothicaire,
   taverne, Guilde des Aventuriers Patentés, cartographe,
   bureau de placement pour monstres
   ========================================================= */
const SHOP = {
  don: { name: 'Don pour la fête', ico: '🎪', price: 6, per: 1, desc: 'Une belle obole pour la prochaine fête : bonne volonté +10.' },
  rumeur: { name: 'Rumeurs de comptoir', ico: '🍺', price: 3, per: 1, desc: 'Contre une pinte, on te raconte où se trouve un endroit que tu ne connais pas encore.' },
  humeur: { name: 'Potion de bonne humeur', ico: '🧪', price: 6, per: 1, desc: 'Toutes tes créatures gagnent 1 ❤️. Goût framboise-soufre.' },
  fidelite: { name: 'Élixir de fidélité', ico: '💞', price: 8, per: 1, desc: '+12 loyauté pour toutes tes créatures. Ne surtout pas en boire soi-même.' },
  tisane: { name: 'Tisane anti-calamité', ico: '🌿', price: 6, per: 1, desc: '−3 Calamité. Camomille, valériane et une pincée de bave de crapaud.' },
  oubli: { name: 'Sirop d’oubli', ico: '🫗', price: 8, per: 1, desc: '−2 Menace : on en verse discrètement dans le puits du village.' },
  tournee: { name: 'Tournée générale', ico: '🍻', price: 6, per: 1, desc: '+2 🔥 : tout le monde boit à ta santé, sans savoir qui tu es.' },
  merco: { name: 'Mercenaire à la semaine', ico: '🗡️', price: 10, per: 3, desc: 'Un garde du corps défend ton Cœur pendant 3 nuits (+4 garde). Il ne pose aucune question, et ne répond à aucune non plus.' },
  tableau: { name: 'Consulter le tableau des quêtes', ico: '📋', price: 0, desc: 'Gratuit : qui part bientôt à l’assaut d’un château… comme le tien ?' },
  dossier: { name: 'Égarer ton dossier', ico: '🗂️', price: 8, per: 3, desc: '−3 Menace. Le greffier perd ton dossier sous une pile de formulaires B-52 en triple exemplaire.' },
  avis: { name: 'Faux avis de recherche', ico: '📜', price: 12, per: 4, desc: 'La prochaine bande d’aventuriers part avec 25 % de PV en moins : ils cherchent un dragon qui n’existe pas.' },
  carte: { name: 'Carte des environs', ico: '🗺️', price: 6, per: 1, desc: 'Dévoile les alentours de la ville et la route jusqu’à ton château.' },
  tresor: { name: 'Carte au trésor', ico: '❌', price: 12, per: 2, desc: 'Dévoile un lieu d’expédition encore inconnu. Le trésor, c’est toi qui vas le chercher.' },
  voyance: { name: 'La diseuse de bonne aventure', ico: '🔮', price: 10, per: 2, desc: 'Madame Irma lit dans le marc de bière : elle te révèle le rêve secret d’une de tes créatures (celle qui te le cache depuis le plus longtemps).' },
  recrue: { name: 'Recruter une créature', ico: '🐾', price: 0, per: 1, desc: 'Une créature au chômage, déjà dans ton album, rejoint ton château (il faut un lit libre).' },
  deco: { name: 'Sticker de déco', ico: '🪄', per: 0 },
  artefact: { name: 'Artefact', ico: '🏺', per: 0 },
  rachat: { name: 'Racheter un artefact volé', ico: '🔁', per: 0 },
  vendre: { name: 'Vendre un artefact', ico: '💰', per: 0 },
};
const SHOPS = {
  village: [{ id: 'epicerie', title: 'L’épicerie-buvette de la mère Pichenette', keeper: ['« On a de tout, sauf ce que vous cherchez. »', '« Une pinte et une rumeur ? C’est la formule du jour. »', '« Vous avez une drôle de moustache, vous. Elle tient avec quoi ? »'], items: ['rumeur', 'humeur', 'oubli', 'don'] }],
  ville: [
    { id: 'bazar', title: 'Le Bazar de Maître Bricabrac', keeper: ['« Tout est authentique, sauf ce qui ne l’est pas. »', '« Garantie trois jours, ou jusqu’à ce que ça casse. »', '« Celle-là, elle a appartenu à un roi. Ou à son cousin. Ou à son chien. »'], items: ['deco', 'artefact', 'rachat', 'vendre'] },
    { id: 'apo', title: 'L’Apothicairerie de Dame Fiolette', keeper: ['« Ne touchez pas au flacon vert. Ni au violet. Ni à rien, en fait. »', '« Effets secondaires : aucun. Enfin, presque aucun. »'], items: ['humeur', 'fidelite', 'tisane', 'oubli'] },
    { id: 'taverne', title: 'La Taverne du Gobelet Fêlé', keeper: ['« Ici, on paie d’abord, on raconte ensuite. »', '« Le barde ? Il est sous la table. Il chante mieux de là. »'], items: ['rumeur', 'tournee', 'merco', 'don', 'voyance'] },
    { id: 'guilde', title: 'La Guilde des Aventuriers Patentés', keeper: ['« Ticket numéro 4 312. Le guichet ferme dans cinq minutes. »', '« Formulaire B-52 en triple exemplaire, tamponné par le Grand Tamponneur. »'], items: ['tableau', 'dossier', 'avis'] },
    { id: 'carto', title: 'Le Cartographe Myope', keeper: ['« Le nord ? C’est par là. Ou par là. Passez-moi mes lunettes. »'], items: ['carte', 'tresor'] },
    { id: 'placement', title: 'Le Bureau de placement de Mme Grifouille', keeper: ['« Monstres sérieux, logés, nourris. Références exigées, mais personne n’en a. »'], items: ['recrue'] },
  ],
};
SHOPS.cite = SHOPS.ville.map(s => ({ ...s, title: s.id === 'bazar' ? 'Le Grand Bazar de Mirebrume' : s.id === 'guilde' ? 'La Guilde des Héros de Mirebrume' : s.id === 'carto' ? 'Le Cartographe Royal (moins myope)' : s.title }));
const TOWN_INTRO = {
  village: ['Tu arrives au village, une fausse moustache collée sous le nez. Les poules te regardent de travers.', 'Le village sent le foin et la soupe aux choux. Personne ne se doute de rien.'],
  ville: ['Tu passes la porte de Bourg-Ripaille avec ta plus belle fausse moustache. Le garde bâille.', 'Bourg-Ripaille grouille de marchands, de pickpockets et d’aventuriers qui parlent fort de leurs exploits.'],
  cite: ['Mirebrume la grande ! Des tours, des bannières, et des héros partout. Ta moustache tient, pour l’instant.'],
};
// déguisé ou pas, au-delà d'un certain rayonnement, on te reconnaît : les prix grimpent
function townMarkup(site) { const lv = glowLevel(), k = site.kind === 'cite' ? 1.2 : 1, spotted = lv >= (site.kind === 'village' ? 2 : 3); return { k: k * (spotted ? 1.2 : 1), spotted }; }
function shopStock(site) {
  const R = rng(seedOf(site.id + ':' + S.night + ':' + S.world.seed)), own = ownedArtefacts(), arts = ARTEFACTS.filter(k => !own.has(k)).sort(() => R() - .5);
  return { deco: DECOR_ORDER.slice().sort(() => R() - .5).slice(0, 3), arts: arts.slice(0, site.kind === 'cite' ? 2 : 1), stolen: (S.world.stolen || []).filter(k => !own.has(k)) };
}
function shopPrice(site, item, arg) {
  const m = townMarkup(site).k;
  if (item === 'deco') return Math.ceil(Math.max(2, (FURN[arg].cost.g || 1) * 1.5) * m);
  if (item === 'artefact') return Math.ceil((24 + FURN[arg].glow * 2) * m);
  if (item === 'rachat') return Math.ceil(20 * m);
  if (item === 'vendre') return -(12 + FURN[arg].glow);
  if (item === 'recrue') return Math.ceil((8 + ((SPECIES[arg] || {}).tier || 0) * 4) * m);
  return Math.ceil(SHOP[item].price * m);
}
const shopLeft = item => { const st = (S.world.shop || {})[item], per = SHOP[item].per; return !per || st == null || S.night >= st + per ? 0 : st + per - S.night; };
const recruitable = () => SPECIES_ORDER.filter(sp => S.album[sp] && !SPECIES[sp].rare && !(SPECIES[sp].tier > S.tier));
function shopBuy(a) {
  const site = siteById(a.site); if (!site || !SITE_KINDS[site.kind].shop || !siteKnown(site)) return 'Tu ne connais pas le chemin';
  const item = a.item, arg = a.arg, shops = SHOPS[site.kind] || [];
  if (!SHOP[item] || !shops.some(s => s.items.includes(item))) return 'Ce n’est pas vendu ici';
  if (shopLeft(item)) return `Revenez dans ${shopLeft(item)} nuit(s)`;
  const stock = shopStock(site);
  if (item === 'deco' && !stock.deco.includes(arg)) return 'Plus en stock';
  if (item === 'artefact' && !stock.arts.includes(arg)) return 'Déjà vendu';
  if (item === 'rachat' && !stock.stolen.includes(arg)) return 'Introuvable';
  if (item === 'vendre' && !(FURN[arg] && FURN[arg].artefact && (S.free[arg] || 0) > 0)) return 'Il faut l’avoir en réserve (pas exposé)';
  if (item === 'recrue') { if (!recruitable().includes(arg)) return 'Personne de cette espèce ne cherche du travail'; if (typeof fameCap === 'function' && fameCap() <= S.creatures.length) return 'Ton château n’est pas assez renommé pour une créature de plus'; if (beds() <= S.creatures.length) return 'Il faut un lit libre'; }
  const hidden = item === 'voyance' ? S.creatures.filter(c => typeof ensureSecret === 'function' && !ensureSecret(c).known && !isOut(c)).sort((x, y) => (x.joined || 1) - (y.joined || 1)) : [];
  if (item === 'voyance' && !hidden.length) return 'Aucune de tes créatures ne te cache de rêve';
  const price = item === 'tableau' ? 0 : shopPrice(site, item, arg); if (price > 0 && S.gold < price) return `Il te faut ${price} 💰`;
  const w = world();
  if (item === 'humeur') homeCreatures().forEach(c => { c.mood = clamp(c.mood + 1, 0, 5); });
  else if (item === 'fidelite') S.creatures.forEach(c => addLoy(c, 12));
  else if (item === 'tisane') S.calamity = Math.max(0, S.calamity - 3);
  else if (item === 'oubli') S.menace = Math.max(0, S.menace - 2);
  else if (item === 'dossier') S.menace = Math.max(0, S.menace - 3);
  else if (item === 'tournee') S.hype += 2;
  else if (item === 'don') addGw(site, 10);
  else if (item === 'merco') S.world.merc = S.night + 3;
  else if (item === 'avis') S.world.decoy = true;
  else if (item === 'rumeur' || item === 'tresor') {
    const vis = visibleSet(); let want = w.sites.filter(s => !vis.has(s.i) && (item === 'tresor' ? s.expe : s.kind !== 'chateau')).sort((x, y) => hdist(x.q, x.r, site.q, site.r) - hdist(y.q, y.r, site.q, site.r));
    if (item === 'rumeur') { const town = want.find(x => SITE_KINDS[x.kind].town); if (town && !w.sites.some(x => SITE_KINDS[x.kind].town && vis.has(x.i))) want = [town]; }
    const s = want[0];
    if (!s) return 'Tu connais déjà tous les endroits dont on parle ici';
    discover([...discAround(s.q, s.r, 1), ...(w.roads.get(s.id) || [])], item === 'rumeur' ? 'rumeurs de taverne' : 'carte au trésor'); a.found = s.name;
  }
  else if (item === 'carte') discover([...discAround(site.q, site.r, 2), ...(w.roads.get(site.id) || [])], 'carte du cartographe');
  else if (item === 'deco') S.free[arg] = (S.free[arg] || 0) + 1;
  else if (item === 'artefact') giveArtefact(arg, 'acheté en ville');
  else if (item === 'rachat') { S.world.stolen = S.world.stolen.filter(k => k !== arg); giveArtefact(arg, 'racheté au brocanteur'); }
  else if (item === 'vendre') { S.free[arg]--; addLog(`${FURN[arg].name} vendu au brocanteur.`); }
  else if (item === 'voyance') a.found = revealSecret(hidden[0], 'voyance');
  else if (item === 'recrue') { const c = addCreature(arg); c.isNew = true; c.loy = 45; addLog(`${c.name} (${SPECIES[arg].name}) recruté·e au bureau de placement.`, 'good'); }
  if (price) S.gold -= price;
  if (item !== 'don' && item !== 'vendre' && price > 0) addGw(site, 2);
  if (SHOP[item].per) (S.world.shop = S.world.shop || {})[item] = S.night;
  return null;
}
CMD.shop = shopBuy;
function openTown(siteId) {
  const site = siteById(siteId); if (!site || !SITE_KINDS[site.kind].shop) return;
  if (!siteKnown(site)) { toast('Tu ne connais pas encore le chemin.', true); return; }
  if (UI.busy) return;
  const mk2 = townMarkup(site), stock = shopStock(site), shops = SHOPS[site.kind], pp = partyPreview();
  const priceTag = (item, arg) => { const p = shopPrice(site, item, arg); return p < 0 ? `+${-p} 💰` : p ? `${p} 💰` : 'gratuit'; };
  const btn = (item, arg, label) => { const left = shopLeft(item), p = item === 'tableau' ? 0 : shopPrice(site, item, arg), poor = p > 0 && S.gold < p;
    return `<button class="sbtn ${item === 'tableau' ? '' : 'pri'}" type="button" data-buy="${item}" ${arg ? `data-arg="${arg}"` : ''} ${left || poor ? 'disabled' : ''}>${label || 'Acheter'} · ${priceTag(item, arg)}${left ? ` (dans ${left} nuit${left > 1 ? 's' : ''})` : ''}</button>`; };
  const row = (item, inner) => `<div class="srow"><span class="emo">${SHOP[item].ico}</span><span class="sdesc"><b>${esc(SHOP[item].name)}</b><br><span class="hint">${esc(SHOP[item].desc || '')}</span></span>${inner}</div>`;
  const itemHTML = item => {
    if (item === 'deco') return stock.deco.map(k => `<div class="srow">${imgThumb('furn', k)}<span class="sdesc"><b>${esc(FURN[k].name)}</b><br><span class="hint">Sticker de déco · ${statTags(FURN[k])}</span></span>${btn('deco', k)}</div>`).join('');
    if (item === 'artefact') return stock.arts.length ? stock.arts.map(k => `<div class="srow art">${imgThumb('furn', k)}<span class="sdesc"><b>${esc(FURN[k].name)}</b> <span class="tag2 gold">✨ ${FURN[k].glow}</span><br><span class="hint">${esc(FURN[k].desc)}</span></span>${btn('artefact', k)}</div>`).join('') : '<p class="hint">Pas d’artefact cette nuit : « Revenez demain, j’attends un arrivage. »</p>';
    if (item === 'rachat') return stock.stolen.map(k => `<div class="srow art">${imgThumb('furn', k)}<span class="sdesc"><b>${esc(FURN[k].name)}</b><br><span class="hint">« Trouvé sur un aventurier, ça vous dit quelque chose ? »</span></span>${btn('rachat', k, 'Racheter')}</div>`).join('');
    if (item === 'vendre') { const mine = ARTEFACTS.filter(k => (S.free[k] || 0) > 0); return mine.length ? mine.map(k => `<div class="srow">${imgThumb('furn', k)}<span class="sdesc"><b>Vendre : ${esc(FURN[k].name)}</b><br><span class="hint">Un artefact en réserve ne fait pas rayonner le château.</span></span>${btn('vendre', k, 'Vendre')}</div>`).join('') : ''; }
    if (item === 'recrue') { const sp = recruitable(); return row('recrue', '') + (sp.length ? `<div class="srecr">${sp.map(k => `<div class="srow">${imgThumb('char', k)}<span class="sdesc"><b>${esc(SPECIES[k].name)}</b><br><span class="hint">${esc(SPECIES[k].skill)}</span></span>${btn('recrue', k, 'Embaucher')}</div>`).join('')}</div>` : '<p class="hint">Ton album est vide : personne à recruter.</p>'); }
    if (item === 'tableau') return row('tableau', `<span class="sinfo">${pp.origin ? `<b>${pp.size} ${esc(HERO_RANK[pp.rank].label.toLowerCase())}</b> de ${esc(pp.origin.name)}, ~${pp.courage} PV au total${S.world.decoy ? ' (moins 25 % grâce à ton faux avis)' : ''}. Menace ${S.menace}/${MENACE_MAX}.` : 'Personne pour l’instant.'}</span>`);
    return row(item, btn(item));
  };
  const m = openModal(`<div class="town ${site.kind}"><h2>${site.kind === 'village' ? '🏪' : site.kind === 'ville' ? '🏙️' : '🏰'} ${esc(site.name)}</h2>
    <p class="hint">Bonne volonté ${gwOf(site)}/100 · ${esc(pick(TOWN_INTRO[site.kind]))}${mk2.spotted ? ' <b>Malheureusement, ton château rayonne tellement qu’on te reconnaît malgré la moustache : les prix grimpent de 20 %.</b>' : ''} Tu as ${S.gold} 💰.</p>
    ${(() => { const q = reqAt(site.id); if (!q) return ''; const R = REQ[q.req]; return `<section class="shop req"><h3>📜 Une requête de ${esc(site.name)}</h3><p class="keeper">« ${esc(R.text)} »</p>${R.kind === 'pay' ? `<div class="btnrow"><button class="sbtn pri" type="button" data-rqt="${q.id}" ${canAfford(R.cost) ? '' : 'disabled'}>🤝 Payer ${costText(R.cost)} · bonne volonté +${R.gw}</button></div>` : `<p class="hint">${R.kind === 'repel' ? 'Elle sera accomplie à la prochaine invasion repoussée.' : 'Envoie une de tes créatures depuis la carte du Val.'}</p>`}</section>`; })()}
    ${shops.map(sh => { const body = sh.items.map(itemHTML).join(''); return `<section class="shop"><h3>${esc(sh.title)}</h3><p class="keeper">${esc(pick(sh.keeper))}</p>${body}</section>`; }).join('')}
    <div class="mfoot"><button class="sbtn" type="button" data-close>↩ Repartir</button></div></div>`, { wide: true, cls: 'townm', label: site.name });
  m.addEventListener('click', e => {
    const rq = e.target.closest('[data-rqt]'); if (rq && !rq.disabled) { if (!run('request', { id: rq.dataset.rqt })) return; sfx('chime'); toast('🤝 Requête accomplie !'); afterChange(); if (MAPV.open) renderMapPanel(); openTown(siteId); return; }
    const b = e.target.closest('[data-buy]'); if (!b || b.disabled) return;
    const item = b.dataset.buy, arg = b.dataset.arg;
    if (item === 'tableau') { sfx('tick'); toast(pp.origin ? `📋 Sur le tableau : « Château maléfique à visiter. Récompense honnête. » Départ prévu de ${pp.origin.name}.` : '📋 Rien au tableau pour ton château.'); return; }
    const a = { site: siteId, item, arg }, err = cmd('shop', a); if (err) { toast(err, true); sfx('bad'); return; }
    sfx('chime');
    toast(item === 'rumeur' ? `🍺 « Paraît qu’il y a ${a.found || 'quelque chose'} par là-bas… » (voir la carte)` : item === 'tresor' ? `❌ La carte mène à ${a.found || 'un endroit'} !` : item === 'vendre' ? '💰 Vendu ! « Un plaisir de faire affaire. »' : item === 'recrue' ? '🐾 Ta nouvelle recrue part pour le château.' : item === 'voyance' ? `🔮 ${a.found}` : `✓ ${SHOP[item].name} : affaire conclue.`);
    afterChange(); if (MAPV.open) renderMapPanel(); openTown(siteId);
  });
}

/* ---------- Grimoire et conseils : étages, rayonnement, carte, ville ---------- */
Object.assign(WIKI, {
  etages: { cat: 'build', t: 'Étages : vers le haut ou vers le bas', x: () => `<p>Chaque <b>palier</b> permet d’ouvrir un nouvel étage (trois au plus). À toi de choisir la direction :</p>
    <ul><li><b>Vers le haut</b> avec l’{room:montee} : les Hauteurs, puis les Cimes. Des terrasses à ciel ouvert où l’on bâtit {room:jardin}, {room:voliere} et {room:belvedere}. Créatures rares : la {sp:fee} et la {sp:harpie}.</li>
    <li><b>Vers le bas</b> avec l’{room:escalier} : les Caves, puis les Profondeurs. On y creuse {room:mine}, {room:reliquaire} et {room:lac}. Créatures rares : le {sp:golem} et la {sp:liche}.</li></ul>
    <p>Les pièces d’un étage doivent toucher le palier d’arrivée ou une autre pièce de l’étage. Les pièces à ciel ouvert (potager…) ne vont pas sous terre ; la tour de guet reste au rez-de-chaussée. La plupart des pièces classiques se construisent partout.</p>
    <p>Les héros ne quittent jamais le rez-de-chaussée : un étage est un abri sûr. Les pièges, eux, ne servent qu’au rez-de-chaussée. Change d’étage avec les boutons <b>Étage</b> de la barre de construction (ou Page↑ / Page↓).</p>` },
  remparts: { cat: 'build', t: 'Agrandir les remparts', x: () => `<p>Depuis la fenêtre du <b>Palier</b>, tu peux élargir le château : ${SIZE_COST.slice(1).map((c, i) => `${12 + 2 * (i + 1)}×${12 + 2 * (i + 1)} cases (Palier ${i + 1}, ${costText(c)})`).join(', puis ')}.</p><p>Une rangée s’ajoute de chaque côté et deux au fond, à tous les étages ; tout le château glisse d’autant, rien n’est perdu.</p>` },
  rayonnement: { cat: 'eco', t: 'Rayonnement', x: () => `<p>Le rayonnement (✨ en haut de l’écran) mesure l’éclat de ton château : ${GLOW_LV.map(([m, n]) => `${n} (${m})`).join(', ')}.</p>
    <ul><li>Il vient des {c:artefacts|artefacts} exposés, des trésors (tas d’or, coffres, or en réserve), des {c:rares|créatures rares}, des légendes, du palier, des {c:etages|étages}, des remparts, de l’ambiance, de la notoriété et des hauts faits.</li>
    <li>Ta renommée porte à 2 lieues, plus une par niveau d’éclat : c’est le cercle doré sur la {c:carte}.</li>
    <li><b>Les aventuriers viennent des villages et des villes de ce cercle</b> (et un peu au-delà). Plus il s’étend, plus ils viennent de loin… et plus ils sont forts : apprentis des villages, aventuriers aguerris des villes, héros de légende de la cité.</li>
    <li>En échange, les héros forts sèment plus d’or en fuyant, laissent plus souvent tomber un artefact, et leurs carnets de route dévoilent la carte.</li></ul>` },
  artefacts: { cat: 'eco', t: 'Artefacts', x: () => `<p>Des trésors uniques qui font rayonner le château et donnent un petit bonus. Ils ne s’achètent pas dans la barre : on les trouve.</p>
    <ul><li>Les héros repoussés en abandonnent parfois (surtout les forts).</li><li>Les {c:expeditions|expéditions} en rapportent.</li><li>Les bazars de la {c:ville} en vendent, à prix d’or.</li></ul>
    <p>Pose-les depuis l’onglet <b>Trésors</b> de la barre. Au {room:reliquaire}, ils rayonnent moitié plus. Attention : si des héros pillent le Cœur, ils emportent un artefact du rez-de-chaussée (on peut le racheter au brocanteur). Aux étages, rien ne craint.</p>
    <ul>${ARTEFACTS.map(k => `<li><b>${esc(FURN[k].name)}</b> (✨ ${FURN[k].glow}) : ${esc(FURN[k].desc)}</li>`).join('')}</ul>` },
  rares: { cat: 'crea', t: 'Créatures rares', x: () => `<p>Quatre créatures ne viennent qu’à trois conditions : les avoir <b>rencontrées en expédition</b>, que ton château <b>rayonne</b> assez, et leur offrir <b>leur pièce</b>, meublée.</p>
    <ul>${SPECIES_ORDER.filter(k => SPECIES[k].rare).map(k => { const d = SPECIES[k]; return `<li>{sp:${k}} : rencontre à ${esc(SITE_KINDS[d.site] ? SITE_KINDS[d.site].label.toLowerCase() : d.site)}, rayonnement ${d.glow}, pièce {room:${d.from}}.</li>`; }).join('')}</ul><p>Chaque créature rare fait rayonner ton château de 10.</p>` },
  carte: { cat: 'val', t: 'La carte du Val', x: () => `<p>Le bouton <b>Carte</b> montre ton château au milieu du Val, en hexagones. Le brouillard cache ce que tu ne connais pas ; le cercle doré, c’est ton {c:rayonnement}.</p><p>Chaque partie tire son propre Val : le relief, la mer (d’un côté, de deux, ou pas du tout), les lacs et les rivières qui descendent des montagnes, puis des lieux posés là où ils ont du sens (le moulin sur une rivière, la cité au bord de l’eau, les grottes au pied des montagnes) avec des noms tirés au sort. À la création, tu peux tirer un autre Val ou en reprendre un avec sa graine.</p>
    <ul><li><b>Villages, ville, cité</b> : c’est de là que partent les aventuriers. On peut y faire ses courses ({c:ville}).</li><li><b>Fermes, moulin, auberge, monastère, château du baron</b> : cibles de raid. Il faut les avoir découvertes pour les piller.</li>
    <li><b>Donjons</b> : les quatre rivaux du jeu (un raid réussi ternit leur réputation six nuits) et les châteaux des autres Maîtres du Val.</li><li><b>Forêt enchantée, grottes, ruines, pic du dragon, lac</b> : lieux d’{c:expeditions|expédition}.</li></ul>
    <p><b>Découvrir la carte</b> : les aventuriers repoussés perdent leurs carnets de route (la route depuis leur village apparaît), les éclaireurs explorent le bord du brouillard, la taverne vend des rumeurs, le cartographe des cartes, et le {room:belvedere} voit loin.</p>` },
  expeditions: { cat: 'val', t: 'Expéditions', x: () => `<p>Depuis la carte, envoie une ou deux créatures vers un lieu d’expédition connu. Elles partent ${Object.values(EXPE_SITES).map(x => x.nights).sort()[0]} à 3 nuits ; à leur retour, on lance un dé par point de raid de l’équipe (plus un si leur talent colle au lieu).</p>
    <ul><li>Réussite : or, matériaux, notoriété ou sérénité selon le lieu, parfois un {c:artefacts|artefact}, et la rencontre d’une {c:rares|créature rare}.</li><li>Échec : l’équipe rentre vexée. On peut y retourner après quelques nuits.</li>
    <li><b>Éclaireur</b> : touche une case de brouillard au bord de ce que tu connais ; une créature part une nuit et dévoile les environs.</li></ul>` },
  ville: { cat: 'val', t: 'En ville', x: () => `<p>Avec une fausse moustache, le Maître fait ses courses. Mais si ton château rayonne trop, on le reconnaît et les prix grimpent.</p>
    <ul><li><b>Épicerie-buvette des villages</b> : rumeurs (un lieu inconnu, souvent la ville), potions, sirop d’oubli.</li>
    <li><b>Bourg-Ripaille et Mirebrume</b> : le Bazar (déco, artefacts, rachat d’objets volés, vente), l’Apothicairerie (humeur, fidélité, calamité, menace), la Taverne (rumeurs, tournée générale, mercenaire, et la diseuse de bonne aventure qui révèle le {c:missions|rêve secret} d’une de tes créatures), la Guilde des Aventuriers (voir la prochaine bande, égarer ton dossier, faux avis de recherche), le Cartographe et le Bureau de placement (recruter une créature de ton album).</li></ul>` },
});
TIPS.push(
  { id: 'carte0', when: () => S.night >= 3 && !(S.tuto && S.tuto.on), t: 'La carte du Val', x: 'Ton château n’est pas seul : villages, villes, donjons rivaux, forêts enchantées… Ouvre la Carte (en bas à droite). Le cercle doré, c’est ta renommée : les aventuriers viennent de là.', wiki: 'carte' },
  { id: 'etage1', when: () => S.tier >= 1 && !floorsDug() && !S.rooms.some(r => ROOMS[r.t].stairs), t: 'Un étage de plus ?', x: 'Ton palier permet d’ouvrir un étage : l’Escalier de la tour monte vers des jardins suspendus et une volière, l’Escalier des caves descend vers une mine et un reliquaire. Chaque direction attire ses créatures rares.', wiki: 'etages' },
  { id: 'carnet1', when: () => S.world && S.world.notes >= 1, t: 'Des carnets de route !', x: 'Les aventuriers en fuite ont perdu leurs carnets : la route depuis leur village apparaît sur ta carte. Plus tu repousses de héros, plus le Val se dévoile.', wiki: 'carte' },
  { id: 'arte1', when: () => ARTEFACTS.some(k => (S.free[k] || 0) > 0), t: 'Un artefact !', x: 'Pose-le depuis l’onglet Trésors de la barre : il fera rayonner ton château. Au Reliquaire (sous terre), il brille moitié plus et ne craint pas les voleurs.', wiki: 'artefacts' },
  { id: 'rare1', when: () => S.world && Object.keys(S.world.met || {}).length > 0, t: 'Une rencontre rare', x: 'Ton expédition a croisé une créature rare. Elle viendra s’installer si ton château rayonne assez et lui offre sa pièce, meublée (voir le Grimoire).', wiki: 'rares' },
);
