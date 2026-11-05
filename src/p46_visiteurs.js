/* =========================================================
   Les visiteurs de la nuit (pas hostiles)
   À l'aube, parfois : un marchand ambulant (des stickers moins
   chers), un barde (notoriété, bonne humeur), ou l'inspecteur
   du Guide des Donjons Douillets, qui note ton château et dont
   les étoiles font rayonner ta réputation.
   ========================================================= */
const VISITORS = {
  marchand: { ico: 'shop', name: 'Un marchand ambulant', w: 40 },
  barde: { ico: 'music', name: 'Un barde de passage', w: 30 },
  inspecteur: { ico: 'book', name: 'L’inspecteur du Guide des Donjons Douillets', w: 30 },
};
// la note du Guide : confort (ambiance), table (repas en plus), frissons (pièges et créatures prêtes à défendre)
function guideScore() {
  const comfort = clamp(Math.round(ambiance() / 9), 0, 5), table = clamp(foodCap() - eaters() + 2, 0, 5), thrill = clamp(Math.round((S.defs.length + Math.min(6, S.creatures.filter(c => fitToFight(c) && (c.fat || 0) < (typeof FAT_TIRED !== 'undefined' ? FAT_TIRED : 4)).length)) / 2), 0, 5);   // les pièges, et les créatures prêtes à défendre (6 au plus)
  return { comfort, table, thrill, stars: clamp(Math.round((comfort + table + thrill) / 3), 1, 5) };
}
const GUIDE_LINES = {
  1: '« Des courants d’air, une soupe tiède et pas un seul frisson. Je ne reviendrai pas. »',
  2: '« Un donjon honnête. Les lits grincent, mais les gobelins sont charmants. »',
  3: '« Une étape agréable : on y dort bien et on y a un peu peur. Je recommande. »',
  4: '« Un vrai bijou ! Les pièges sont délicieusement sournois et le ragoût, divin. »',
  5: '« Le donjon le plus douillet du Val. J’en ai encore des frissons… et l’estomac plein. »',
};
const glowPartsGuide = glowParts;
glowParts = function () { const f = glowPartsGuide(); if (S.guide && S.guide.stars) f.push([`Guide des Donjons Douillets (${'★'.repeat(S.guide.stars)})`, S.guide.stars * 3]); return f; };
function merchantOffer() {
  const pool = Object.keys(FURN).filter(k => { const f = FURN[k]; return !f.artefact && !f.saga && !f.size && !(f.tier && S.tier < f.tier) && f.cost && (f.cost.g || 0) >= 1 && (f.room === 'any' || S.rooms.some(r => r.built && r.t === f.room)); });
  const out = []; while (out.length < 3 && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  return out.map(k => ({ k, price: Math.max(1, Math.round(((FURN[k].cost.g || 0) + (FURN[k].cost.s || 0)) * .6)) }));
}
// le marchand reste devant la porte toute la nuit de sa visite (S.visit) : on peut lui acheter depuis sa fenêtre, ou plus tard (ligne de commande)
const merchantHere = () => (S.visit && S.visit.k === 'marchand' && S.visit.n === S.night ? S.visit.offer : null);
CMD.merchant = a => { const offer = merchantHere(); if (!offer) return 'Le marchand ambulant est reparti'; const o = offer.find(x => x.k === (a && a.k)); if (!o) return 'Il ne vend pas ça'; if (o.sold) return 'Déjà vendu'; if (S.gold < o.price) return 'Pas assez d’or';
  S.gold -= o.price; S.free[o.k] = (S.free[o.k] || 0) + 1; o.sold = true; addLog(`Acheté au marchand ambulant : ${itemName(o.k)} (${o.price} or).`, 'ev'); return null; };
async function merchantModal(offer) {
  for (;;) {
    const k = await choiceModal(`${gi('shop')} Un marchand ambulant`, `« Des stickers d’occasion, presque neufs, à prix d’ami ! » Ils iront dans ta barre, offerts (tu as ${S.gold} or).`, [...offer.map(o => [o.k, 'gift', `${itemName(o.k)} : ${o.price} or`, FURN[o.k].room === 'any' ? 'Déco : se pose partout.' : `Se pose dans : ${ROOMS[FURN[o.k].room] ? ROOMS[FURN[o.k].room].name : 'sa pièce'}.`, S.gold < o.price || o.sold]), ['bye', 'door', 'Merci, au revoir', 'Le marchand reprend la route.']]);
    if (k === 'bye') return;
    if (cmd('merchant', { k })) continue; sfx('coin'); renderAll(); save();
  }
}
async function guideModal(g) {
  await choiceModal(`${gi('book')} Le Guide des Donjons Douillets`, `L’inspecteur referme son carnet. <b>${'★'.repeat(g.stars)}${'☆'.repeat(5 - g.stars)}</b><br>${esc(GUIDE_LINES[g.stars])}<br><small>Confort ${g.comfort}/5 · Table ${g.table}/5 · Frissons ${g.thrill}/5. Chaque étoile ajoute 3 de rayonnement tant que la note tient.</small>`, [['ok', 'check', 'Merci, cher inspecteur', 'Il repart avec un sourire (et quelques biscuits).']]);
}
const dawnVisit = dawn;
dawn = function (report) {
  const r = dawnVisit(report);
  if (S.night >= 4 && Math.random() < (typeof craftRank === 'function' && craftRank('taverne') >= 3 ? .45 : .3)) {   // la geste du Maître attire du monde
    const keys = Object.keys(VISITORS).filter(k => k !== 'inspecteur' || !S.guide || S.night - S.guide.n >= 10), k = wpick(keys, x => VISITORS[x].w);
    if (k === 'barde') { S.hype += 2; S.creatures.forEach(c => { if (!isOut(c)) c.mood = Math.min(5, c.mood + 1); }); report.push(['🎵', `Un barde de passage chante les exploits de ${S.name} toute la nuit : +2 notoriété, et tout le monde a le sourire (+1 humeur).`, 'good']); }
    else if (k === 'inspecteur') {
      const g = guideScore(); S.guide = { stars: g.stars, n: S.night }; S.gold += g.stars * 3; S.hype += g.stars;
      report.push(['📖', `L’inspecteur du Guide des Donjons Douillets a passé la nuit ici : ${'★'.repeat(g.stars)} (+${g.stars * 3} or, +${g.stars} notoriété, +${g.stars * 3} rayonnement).`, 'good']);
      dawnChoice(() => guideModal(g));
    } else if (k === 'marchand') {
      const offer = merchantOffer(); if (offer.length) { S.visit = { k: 'marchand', n: S.night, offer }; report.push(['🏪', `Un marchand ambulant s’installe devant la porte pour la nuit : ${offer.map(o => `${itemName(o.k)} (${o.price} or)`).join(', ')}, à prix d’ami.`, 'ev']); dawnChoice(() => merchantModal(S.visit.offer)); }
    }
  }
  return r;
};
WIKI.visiteurs = { cat: 'val', t: 'Les visiteurs de la nuit', x: () => `<p>À l’aube, parfois, quelqu’un frappe à la porte, et ce n’est pas un héros :</p><ul><li><b>Le marchand ambulant</b> propose trois stickers à prix d’ami (ils vont dans ta barre).</li><li><b>Le barde</b> chante tes exploits : +2 notoriété, et tout le monde a le sourire.</li><li><b>L’inspecteur du Guide des Donjons Douillets</b> note ton château sur 5 étoiles : le confort (ambiance), la table (repas en plus des besoins) et les frissons (pièges et créatures prêtes à défendre). Chaque étoile rapporte de l’or et de la notoriété, et ajoute 3 de rayonnement jusqu’à sa prochaine visite.</li></ul>` };
