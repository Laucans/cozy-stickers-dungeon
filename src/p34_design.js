
/* =========================================================
   Penser son donjon étage par étage : certaines pièces ne
   supportent pas d'être au même étage, et les créatures
   rivales se bagarrent quand elles vivent au même étage.
   ========================================================= */
const floorWord = z => z === 0 ? 'au Rez' : z === EXT ? 'dans les Jardins' : (FLOOR_NAMES[z] ? 'dans ' + FLOOR_NAMES[z].replace(/^Les /, 'les ').replace(/^La /, 'la ').replace(/^Le /, 'le ') : 'à l’étage');
// les rivaux qui vivent au même étage, par paire d'espèces
function rivalPairs() {
  const live = S.creatures.filter(c => !isOut(c)), out = {};
  live.forEach(c => { const r = (SPECIES[c.sp] || {}).rival; if (!r) return; live.forEach(o => { if (o.sp !== r || livingFloor(o) !== livingFloor(c)) return; const k = [c.sp, o.sp].sort().join('|') + '@' + livingFloor(c); (out[k] = out[k] || []).push([c, o]); }); });
  return out;
}
// à l'aube, parfois, une bagarre éclate
function designDawn(report) {
  if (!S.started || (S.tuto && S.tuto.on)) return;
  const pairs = rivalPairs(), keys = Object.keys(pairs); if (!keys.length) return;
  if (Math.random() > Math.min(.6, .22 * keys.length)) return;   // au plus une bagarre par nuit
  const [a, b] = pick(pairs[pick(keys)]); if (injured(a) || injured(b)) return;
  a.mood = clamp(a.mood - 1, 0, 5); b.mood = clamp(b.mood - 1, 0, 5);
  const loser = Math.random() < .5 ? a : b; loser.hurt = Math.max(loser.hurt || 0, S.night + 1); S.calamity += 1; S.stats.brawls = (S.stats.brawls || 0) + 1;
  report.push(['🥊', `Bagarre ${floorWord(livingFloor(a))} : ${a.name} (${SPECIES[a.sp].name}) et ${b.name} (${SPECIES[b.sp].name}) ne se supportent pas. ${loser.name} est sonné·e, les deux boudent (−1 ❤️), +1 Calamité. Poste l’un des deux à un autre étage pour les séparer.`, 'bad']);
  addLog(`Bagarre entre ${a.name} et ${b.name}.`, 'bad');
}
function designNotifs(add) {
  const keys = Object.keys(rivalPairs()); if (!keys.length) return;
  const [sp, z] = keys[0].split('@'), [s1, s2] = sp.split('|');
  add('rivals', '🥊', `${SPECIES[s1].name}s et ${SPECIES[s2].name}s se disputent ${floorWord(+z)}`, () => openGrimoire('voisinages'), 3, 'bad');
}
// la fiche d'une pièce dit avec qui elle ne s'entend pas
const openRoomClash = openRoom;
openRoom = function (id) {
  const r0 = openRoomClash(id), r = S.rooms.find(x => x.id === id); if (!r) return r0;
  const k = ROOMS[r.t].like || r.t, cl = ROOM_CLASH.filter(([a, b]) => a === k || b === k);
  const m = document.querySelector && document.querySelector('#modalRoot .modal'), h = m && m.querySelector('.cardhead');
  if (h && cl.length) h.insertAdjacentHTML('afterend', `<p class="hint">🚫 Jamais au même étage que : ${cl.map(([a, b, why]) => `<b>${esc(ROOMS[a === k ? b : a].name)}</b> (${esc(why)})`).join(', ')}.</p>`);
  return r0;
};
WIKI.voisinages = { cat: 'build', t: 'Voisins difficiles', x: () => `<p>Ton château se pense étage par étage.</p>
  <h3>Pièces incompatibles</h3><p>Elles ne peuvent pas être au même étage : il faut choisir laquelle garder au Rez, et monter (ou descendre) l’autre quand un nouvel étage s’ouvre.</p>
  <ul>${ROOM_CLASH.map(([a, b, why]) => `<li>{room:${a}} et {room:${b}} : ${esc(why)}.</li>`).join('')}</ul>
  <h3>Créatures rivales</h3><p>Ces espèces se détestent. Si elles vivent au même étage (celui de leur poste ; sans poste, le Rez), elles boudent (−1 d’humeur visée) et une bagarre peut éclater à l’aube : une des deux sonnée, les deux −1 ❤️, +1 Calamité. Poste l’une d’elles à un autre étage, ou n’attire pas les deux.</p>
  <ul>${[...new Set(Object.keys(SPECIES).filter(s => SPECIES[s].rival).map(s => [s, SPECIES[s].rival].sort().join('|')))].map(k => { const [a, b] = k.split('|'); return `<li>{sp:${a}} et {sp:${b}}</li>`; }).join('')}</ul>` };
TIPS.push({ id: 'clash0', when: () => S.night >= 3 && !(S.tuto && S.tuto.on), t: 'Des voisins difficiles', x: 'Certaines pièces ne supportent pas d’être au même étage (la Taverne et la Bibliothèque, la Cuisine et le Laboratoire…), et les créatures rivales se bagarrent si elles vivent au même étage. Pense ton château étage par étage.', wiki: 'voisinages' });
