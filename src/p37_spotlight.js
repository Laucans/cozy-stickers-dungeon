
/* =========================================================
   Une nouvelle espèce s'installe : la caméra zoome sur elle
   et la suit pendant qu'elle franchit le porche, et une petite
   fiche, à droite, dit ce qu'elle sait faire.
   ========================================================= */
function spotFacts(c) {
  const sp = SPECIES[c.sp] || {}, F = SP_FIGHT[c.sp], X = typeof CRAWL_SK !== 'undefined' && CRAWL_SK[c.sp], rows = [];
  rows.push(`<li><b>${esc(sp.skill)}</b> : ${esc(sp.sd)}</li>`);
  rows.push(`<li>🛡️ Garde ${sp.guard || 0} · 🎲 ${sp.dice || 0} dé${(sp.dice || 0) > 1 ? 's' : ''} en raid${sp.tag ? ` · ${esc(TAGS[sp.tag])}` : ''}</li>`);
  if (F) rows.push(`<li>⚔️ Au combat : <b>${esc(F.sk)}</b>. ${esc(F.sd)}</li>`);
  if (X) rows.push(`<li>${X.ico} En expédition : <b>${esc(X.name)}</b>. ${esc(X.desc)}</li>`);
  if (sp.likes) rows.push(`<li>💛 Adore le sticker <b>${esc(itemName(sp.likes))}</b>${hasItem(sp.likes) ? ' (tu en as un !)' : ''}.</li>`);
  if (sp.from && ROOMS[sp.from]) rows.push(`<li>🏠 Attiré·e par : ${sp.from === 'coeur' ? 'le Cœur' : esc(ROOMS[sp.from].name)}. Y avoir son poste la rend plus heureuse.</li>`);
  if (sp.rival && SPECIES[sp.rival]) rows.push(`<li>🥊 Ne supporte pas les <b>${esc(SPECIES[sp.rival].name)}s</b> : pas au même étage !</li>`);
  if ((sp.eats || 1) > 1) rows.push('<li>🍖 Mange pour deux.</li>');
  return rows.join('');
}
// la caméra la garde au centre gauche (la fiche occupe la droite)
function spotCam(a) {
  clearInterval(V.spotCamT);
  if (!a) { V.spotCamT = null; CAM.user = false; fitCamera(); return; }
  const s1 = clamp(Math.max(CAM.s * 1.9, 1.15), CAM.s, Math.min(CAM.max, 1.6)), narrow = V.w < 720;
  V.spotCamT = setInterval(() => {
    if (document.hidden) return;
    const [wx, wy] = WP(a.x, a.y - .35), s = CAM.s + (s1 - CAM.s) * .07, tx = V.w * (narrow ? .5 : .38) - wx * s, ty = V.h * (narrow ? .3 : .52) - wy * s;
    CAM.s = s; CAM.x += (tx - CAM.x) * .09; CAM.y += (ty - CAM.y) * .09; CAM.user = true;
  }, 16);
}
async function spotlight(c) {
  const sp = SPECIES[c.sp] || {};
  V.spotOn = true; UI.busy = true; document.body.classList.add('busy');
  if (Z !== 0) setFloor(0);
  syncActors(); const a = ACT.get(c.id);
  const done = () => { (S.spotted = S.spotted || []).includes(c.sp) || S.spotted.push(c.sp); save(); };
  if (!a) { done(); V.spotOn = false; UI.busy = false; document.body.classList.remove('busy'); return; }
  // elle repart du dehors pour faire son entrée
  a.tok++; a.walking = false; a.dur = 0; a.fight = true; a.pose = null; a.z = 0; a.x = GATE.x + .5; a.y = H + 1.6; a.alpha = 1;
  spotCam(a); sfx('chime');
  const box = el('div', 'spot panel', `<small class="kick">✨ Nouvelle espèce au château</small>
    <div class="sphead"><span class="sppic"><img alt="" src="${thumb('char', c.sp, true)}"></span><div><h3>${esc(c.name)}</h3><b>${esc(sp.name)}</b>${sp.rare ? ' <span class="tag2 gold">rare</span>' : ''}</div></div>
    <p class="spquote">« ${esc(pick(sp.lines || ['…']))} »</p><ul>${spotFacts(c)}</ul>
    <div class="btnrow"><button type="button" class="sbtn pri" id="spGo">Bienvenue, ${esc(c.name)} !</button></div>`);
  box.setAttribute('role', 'dialog'); box.setAttribute('aria-label', `Nouvelle espèce : ${sp.name}`); $('#game').appendChild(box);
  const closed = new Promise(res => {
    const go = () => { document.removeEventListener('keydown', key); res(); };
    const key = e => { if (e.key === 'Escape' || e.key === 'Enter') go(); };
    box.querySelector('#spGo').addEventListener('click', go); document.addEventListener('keydown', key);
    setTimeout(() => box.querySelector('#spGo').focus({ preventScroll: true }), 50);
  });
  // l'entrée : jusqu'au porche, puis quelques pas vers le Cœur
  (async () => {
    a.walking = true; await moveTo(a, GATE.x + .5, GATE.y + .5, 1500); a.walking = false;
    poof(GATE.x, GATE.y); say(a.id, pick(['Bonjour, c’est ici le château ?', 'Il paraît qu’on mange bien, ici.', 'J’ai apporté mes chaussons.', 'Je viens pour l’annonce.']), 2600);
    const h = heartRoom(), [tx, ty] = h ? randCell(h) : [GATE.x, GATE.y], p = withZ(0, () => bfs([GATE.x, GATE.y], (x, y) => x === tx && y === ty));
    if (p && p.length > 1 && V.spotOn) await walkPath(a, p, 520);
    a.fight = false;   // ensuite, elle vit sa vie (et la caméra la suit)
  })();
  await closed;
  box.classList.add('out'); setTimeout(() => box.remove(), 250);
  a.fight = false; spotCam(null); done();
  V.spotOn = false; UI.busy = false; document.body.classList.remove('busy'); renderAll();
}
// on guette les nouvelles venues dès que le château est calme (après la chronique, après une rencontre…)
setInterval(() => {
  if (typeof S === 'undefined' || !S || !S.started || V.spotOn || UI.busy || document.hidden) return;
  if ((typeof VISIT !== 'undefined' && VISIT) || (typeof COOP !== 'undefined' && COOP.role === 'guest')) return;
  if (!S.spotted) { S.spotted = Object.keys(S.album || {}); return; }   // une partie déjà commencée : on ne présente que les prochaines
  if (document.querySelector('#modalRoot .modal') || document.getElementById('crawlBody')) return;
  const c = S.creatures.find(o => !S.spotted.includes(o.sp) && !isOut(o) && !injured(o));
  if (c) spotlight(c);
}, 1200);
