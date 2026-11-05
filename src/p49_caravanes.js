/* =========================================================
   Les caravanes du Val
   De temps en temps, un convoi de marchands roule d'un village
   à un autre en passant par les routes (donc près de ton
   château). Sur la carte, touche-le : le piller (de l'or et des
   bois, mais les villages t'en veulent et la Menace monte)
   ou l'escorter (les villages t'en sont reconnaissants).
   ========================================================= */
const CARAVAN_NIGHTS = 3;
const caravans = () => (S.world.caravans = S.world.caravans || []);
const caravanCell = cv => { const w = world(), k = Math.min(cv.path.length - 1, Math.floor(clamp((S.night - cv.n) / CARAVAN_NIGHTS, 0, .999) * cv.path.length)); return w.list[cv.path[k]]; };
const activeCaravans = () => caravans().filter(cv => !cv.done && S.night - cv.n < CARAVAN_NIGHTS);
function spawnCaravan() {
  const w = world(), towns = settlements().filter(s => w.roads.has(s.id));
  if (towns.length < 2) return null;
  const a = pick(towns), b = pick(towns.filter(s => s !== a)), ra = w.roads.get(a.id), rb = w.roads.get(b.id); if (!ra || !rb) return null;
  const path = [...ra.slice().reverse(), ...rb.slice(1)];
  const cv = { id: 'cv' + (S.seq = (S.seq || 0) + 1), from: a.id, to: b.id, fromN: a.name, toN: b.name, n: S.night, path, guard: 2 + Math.floor(Math.random() * 3) + (S.tier || 0), done: null };
  caravans().push(cv); if (caravans().length > 6) caravans().shift(); return cv;
}
const dawnCaravan = dawn;
dawn = function (report) {
  const r = dawnCaravan(report);
  if (S.world && !activeCaravans().length && S.night >= 5 && Math.random() < .22) { const cv = spawnCaravan(); if (cv) { report.push(['🛒', `Une caravane de marchands part de ${cv.fromN} vers ${cv.toN} : elle passera par les routes du Val pendant ${CARAVAN_NIGHTS} nuits.`, 'ev']); if (typeof mapDirty === 'function') mapDirty(); } }
  return r;
};
// piller : la meilleure équipe (3 créatures) contre l'escorte du convoi ; escorter : une créature les accompagne une nuit
const raidCrew = () => S.creatures.filter(c => typeof fitToFight === 'function' ? fitToFight(c) : !isOut(c)).sort((a, b) => guardOf(b) - guardOf(a)).slice(0, 3);
const caravanOdds = cv => clamp(.35 + (raidCrew().reduce((a, c) => a + guardOf(c), 0) - cv.guard) * .06, .15, .9);
// commercer : la caravane achète ton bois en trop (2 🪵 pour 1 💰), jusqu'à ce que sa charrette soit pleine ; on peut encore l'escorter ensuite
const CARAVAN_RATE = 2;
const caravanBuys = cv => Math.max(0, 30 + 15 * (S.tier || 0) - (cv.sold || 0));
CMD.caravan = a => {
  const cv = caravans().find(x => x.id === a.id); if (!cv || cv.done || S.night - cv.n >= CARAVAN_NIGHTS) return 'Cette caravane est déjà loin';
  const towns = [cv.from, cv.to].map(id => world().sites.find(s => s.id === id)).filter(Boolean);
  if (a.how === 'pille') {
    const crew = raidCrew(); if (!crew.length) return 'Personne de disponible';
    if (Math.random() < caravanOdds(cv)) { const g = 10 + 4 * cv.guard, s = 4 + cv.guard; S.gold += g; S.mat += s; cv.done = 'pille'; cv.res = `+${g} or, +${s} bois`; towns.forEach(t => addGw(t, -12)); S.menace = Math.min(MENACE_MAX, S.menace + 2); addLog(`Caravane pillée (${cv.res}).`, 'ev'); }
    else { const c = crew[0]; c.hurt = S.night + 2; cv.done = 'rate'; cv.res = `${c.name} est sonné·e`; towns.forEach(t => addGw(t, -5)); addLog('Le pillage de la caravane tourne mal.', 'bad'); }
    S.stats.caravans = (S.stats.caravans || 0) + 1; return null;
  }
  if (a.how === 'commerce') {
    const room = caravanBuys(cv); if (!room) return 'Sa charrette est déjà pleine';
    const n = Math.min(room, S.mat, a.n ? Math.max(0, Math.floor(+a.n)) : room), g = Math.floor(n / CARAVAN_RATE); if (g < 1) return `Il te faut au moins ${CARAVAN_RATE} 🪵`;
    const used = g * CARAVAN_RATE; S.mat -= used; S.gold += g; cv.sold = (cv.sold || 0) + used; towns.forEach(t => addGw(t, 2)); S.stats.trade = (S.stats.trade || 0) + used;
    addLog(`Caravane : ${used} 🪵 de bois vendus pour ${g} or.`, 'ev'); return null;
  }
  if (a.how === 'escorte') { cv.done = 'escorte'; S.gold += 5; S.hype += 1; towns.forEach(t => addGw(t, 10)); cv.res = '+5 or, +1 💬 de bouche-à-oreille, les villages t’en sont reconnaissants'; addLog(`Caravane escortée jusqu’à ${cv.toN}.`, 'ev'); S.stats.escorts = (S.stats.escorts || 0) + 1; return null; }
  return 'Action inconnue';
};
// sur la carte : le convoi (un sticker qui se balance) et sa fiche
MART.wagon = g => { [[-9, 0], [9, 0]].forEach(([x, y]) => ball(g, x, y - 5, 5.5, '#7a4a28', 1)); rrect(g, -15, -20, 30, 13, 2.5, '#b8743a', 1.2); g.beginPath(); g.moveTo(-14, -20); g.quadraticCurveTo(0, -36, 14, -20); g.closePath(); fi(g, '#f1e4c8', 1.1); [-7, 0, 7].forEach(x => ln(g, [[x, -21], [x * .8, -30]], 'rgba(120,90,60,.5)', 1)); };
const drawMapCaravans = drawMap;
drawMap = function (t) {
  drawMapCaravans(t);
  const cvw = $('#wcv'), L = MAPV.layer; if (!cvw || !L || !S.world) return;
  const g = cvw.getContext('2d'), dpr = Math.min(2, devicePixelRatio || 1), k = MAPV.cam.s / MAP_K;
  g.setTransform(dpr * k, 0, 0, dpr * k, dpr * (MAPV.cam.x - L.ox * k), dpr * (MAPV.cam.y - L.oy * k));
  activeCaravans().forEach(cv => { const c = caravanCell(cv); if (!c || !L.vis.has(c.i)) return; const [x, y] = hexXY(c.q, c.r, L.s); putSticker(g, mapSticker('art:wagon', 56, 44, MART.wagon), L.ox + x, L.oy + y + L.s * .25 + Math.sin(t / 260) * 2, L.s / 60 * 1.1); });
};
const renderMapPanelCaravan = renderMapPanel;
renderMapPanel = function () {
  renderMapPanelCaravan();
  const sel = MAPV.sel, p = document.getElementById('wpanel') || document.querySelector('#world .wpanel'); if (!sel || !p) return;
  const cv = activeCaravans().find(x => { const c = caravanCell(x); return c && c.i === sel.i; }); if (!cv) return;
  const left = CARAVAN_NIGHTS - (S.night - cv.n), odds = Math.round(caravanOdds(cv) * 100);
  const box = el('div', 'cvsec', `<h3>${gi('door')} Une caravane de marchands</h3><p>De ${esc(cv.fromN)} vers ${esc(cv.toN)}, escortée par ${cv.guard} gardes ; elle aura quitté la route dans ${left} nuit${left > 1 ? 's' : ''}.</p>
    <div class="btnrow"><button type="button" class="sbtn danger" data-cv="pille">${gi('purse')} La piller (${odds} % de réussite)</button><button type="button" class="sbtn pri" data-cv="escorte">${gi('shield')} L’escorter</button>${(() => { const n = Math.min(caravanBuys(cv), S.mat), g = Math.floor(n / CARAVAN_RATE); return g >= 1 ? `<button type="button" class="sbtn" data-cv="commerce">${gi('scale')} Lui vendre ${g * CARAVAN_RATE} 🪵 contre ${g} 💰</button>` : ''; })()}</div><p class="hint">Piller : de l’or et du bois, mais les deux villages t’en veulent et la Menace monte de 2. Escorter : +5 or, +1 💬 de bouche-à-oreille, et les villages t’en sont reconnaissants (bon voisinage). Commercer : la caravane t’achète ton bois en trop (${CARAVAN_RATE} 🪵 pour 1 💰, ${caravanBuys(cv)} 🪵 au plus), et tu peux l’escorter ensuite.</p>`);
  p.appendChild(box);
  box.addEventListener('click', e => { const b = e.target.closest('[data-cv]'); if (!b) return; if (run('caravan', { id: cv.id, how: b.dataset.cv })) { sfx(b.dataset.cv === 'escorte' ? 'chime' : 'coin'); toast(b.dataset.cv === 'commerce' ? `Marché conclu : la caravane repart chargée de bois (${cv.sold} 🪵 vendus).` : `${cv.done === 'pille' ? 'Caravane pillée' : cv.done === 'rate' ? 'Le pillage tourne mal' : 'Caravane escortée'} : ${cv.res}.`, cv.done === 'rate'); afterChange(); mapDirty(); renderMapPanel(); } });
};
WIKI.caravanes = { cat: 'val', t: 'Les caravanes', x: () => `<p>De temps en temps, une <b>caravane de marchands</b> part d’un village vers un autre et roule sur les routes du Val pendant ${CARAVAN_NIGHTS} nuits (les routes passent près de ton château). Sur la carte, touche le convoi :</p><ul><li><b>La piller</b> : tes 3 créatures les plus costaudes contre son escorte. Réussi : de l’or et du bois, mais les deux villages t’en veulent et la Menace monte de 2. Raté : une créature rentre sonnée.</li><li><b>L’escorter</b> : +5 or, +1 💬 de bouche-à-oreille, et les deux villages t’en sont reconnaissants (utile pour la victoire de Bon Voisinage).</li><li><b>Commercer</b> : elle t’achète ton bois en trop, ${CARAVAN_RATE} 🪵 pour 1 💰 (30 🪵 au plus, +15 par palier), et les deux villages t’en savent un peu gré. On peut encore l’escorter ensuite.</li></ul>` };
