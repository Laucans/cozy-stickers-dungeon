/* =========================================================
   Les œufs et les familles
   Deux créatures de la même espèce, heureuses et attachées au
   château, pondent parfois un œuf (bien plus souvent avec un
   Nid géant). Il éclôt trois nuits plus tard : un petit déjà au
   niveau 2, parfois d'une couleur rare. Né de parents légendaires,
   il est légende à son tour.
   ========================================================= */
const EGG_MAX = 3;
const eggState = () => (S.eggs = S.eggs || []);
const happyParent = c => !isOut(c) && !injured(c) && c.mood >= 4 && (c.lvl || 1) >= 2 && (c.loy == null || c.loy >= 60);
function eggPairs() {
  const by = {}; S.creatures.filter(happyParent).forEach(c => { (by[c.sp] = by[c.sp] || []).push(c); });
  return Object.values(by).filter(l => l.length >= 2).map(l => l.slice().sort((a, b) => (b.legend ? 1 : 0) - (a.legend ? 1 : 0) || (b.lvl || 1) - (a.lvl || 1)).slice(0, 2));
}
const dawnEggs = dawn;
dawn = function (report) {
  const r = dawnEggs(report), E = eggState();
  // les éclosions (s'il reste un lit)
  for (const e of E.slice()) {
    if (S.night < e.hatch) continue;
    if (S.creatures.length >= beds()) { if (!e.waitSaid) { e.waitSaid = 1; report.push(['🥚', `Un œuf de ${SPECIES[e.sp].name.toLowerCase()} est prêt à éclore… mais il n’y a plus un lit de libre.`, 'bad']); } continue; }
    E.splice(E.indexOf(e), 1);
    const c = addCreature(e.sp); c.lvl = Math.max(c.lvl || 1, 2); c.mood = 5; c.loy = 80; c.isNew = true; c.parents = [e.a, e.b];
    if (e.variant != null) c.variant = e.variant;
    if (e.legend) c.legend = true;
    S.stats.hatched = (S.stats.hatched || 0) + 1; if (c.variant != null) S.stats.variants = (S.stats.variants || 0) + 1;
    report.push(['🥚', `Un œuf éclot : ${c.name} est né·e, de ${e.na} et ${e.nb}${c.variant != null ? ', d’une couleur rare' : ''}${c.legend ? ' — une petite légende !' : ''}.`, 'good']); addLog(`Naissance : ${c.name}.`, 'ev');
  }
  // les pontes
  if (E.length < EGG_MAX) {
    const nest = typeof countItem === 'function' ? countItem('nid') : 0, P = eggPairs();
    for (const [a, b] of P) {
      if (E.length >= EGG_MAX || Math.random() >= (nest ? .07 : .025)) continue;
      const variant = Math.random() < .3 ? pick([40, 90, 150, 200, 260, 320]) : null;
      E.push({ sp: a.sp, a: a.id, b: b.id, na: a.name, nb: b.name, n: S.night, hatch: S.night + 3, variant, legend: !!(a.legend && b.legend) });
      report.push(['🥚', `${a.name} et ${b.name} ont pondu un œuf ! Il éclora dans trois nuits${nest ? ' (au chaud dans le Nid géant)' : ''}.`, 'good']);
      break;
    }
  }
  return r;
};
// une couleur rare : la créature et sa vignette changent de teinte
const drawActorEggs = drawActor;
drawActor = function (c, a, t) {
  const cr = a && a.kind === 'char' && critter(a.id), v = cr && cr.variant;
  if (v == null) return drawActorEggs(c, a, t);
  c.save(); try { c.filter = `hue-rotate(${v}deg) saturate(1.15)`; } catch (e) {} const r = drawActorEggs(c, a, t); c.restore(); return r;
};
const renderPortraitsEggs = renderPortraits;
renderPortraits = function () {
  renderPortraitsEggs();
  document.querySelectorAll('#portraits .pt').forEach(b => { const c = critter(b.dataset.crit), img = b.querySelector('.ring img'); if (c && img) img.style.filter = c.variant != null ? `hue-rotate(${c.variant}deg) saturate(1.15)` : ''; });
};
WIKI.oeufs = { cat: 'crea', t: 'Les œufs et les familles', x: () => `<p>Deux créatures de la <b>même espèce</b>, heureuses (4 cœurs ou plus), de niveau 2 au moins et attachées au château, pondent parfois un <b>œuf</b> à l’aube. Avec un {furn:nid} au château, c’est presque trois fois plus fréquent (mais ça reste rare). ${EGG_MAX} œufs au plus en même temps.</p>
  <ul><li>L’œuf éclot <b>trois nuits plus tard</b>, s’il reste un lit : un petit déjà au niveau 2, heureux et fidèle.</li><li>Un œuf sur trois donne une <b>couleur rare</b>.</li><li>Né de deux parents légendaires, le petit est une <b>légende</b> à son tour (de quoi aider la victoire de la Ménagerie).</li></ul>` };
