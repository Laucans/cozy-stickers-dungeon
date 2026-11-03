
/* =========================================================
   Raids, invasions, nuit (Calamité → Raid → Contrecoup → Aube),
   aide, accueil, sons, commandes, démarrage
   ========================================================= */
function setPhase(k) { UI.phase = k; renderHUD(); coopCast('phase', { k }); }
function banner(text, sub, ms = 1300) { coopCast('banner', { text, sub, ms }); const b = el('div', 'banner', `${text}${sub ? `<small>${sub}</small>` : ''}`); $('#game').appendChild(b); return sleep(ms).then(() => b.remove()); }
function toast(text, bad) { const t = el('div', 'toast' + (bad ? ' bad' : ''), esc(text)); $('#toasts').appendChild(t); setTimeout(() => t.remove(), 3400); }

/* ---------- sons synthétisés ---------- */
const SND = { on: false, ctx: null };
function sfx(type) {
  if (!SND.on || !SND.ctx) return;
  try {
    const c = SND.ctx, t = c.currentTime;
    const tone = (f0, f1, dur, wave = 'sine', vol = .18, at = 0) => { const o = c.createOscillator(), g = c.createGain(); o.type = wave; o.frequency.setValueAtTime(f0, t + at); o.frequency.exponentialRampToValueAtTime(f1, t + at + dur); g.gain.setValueAtTime(vol, t + at); g.gain.exponentialRampToValueAtTime(.0008, t + at + dur); o.connect(g).connect(c.destination); o.start(t + at); o.stop(t + at + dur + .02); };
    const noise = (dur, f0, f1, vol = .2, at = 0) => { const n = Math.floor(c.sampleRate * dur), b = c.createBuffer(1, n, c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n); const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(); s.buffer = b; f.type = 'bandpass'; f.Q.value = 2; f.frequency.setValueAtTime(f0, t + at); f.frequency.exponentialRampToValueAtTime(f1, t + at + dur); g.gain.value = vol; s.connect(f).connect(g).connect(c.destination); s.start(t + at); };
    if (type === 'pop') { noise(.05, 900, 400, .15); tone(520, 160, .14, 'sine', .25); }
    else if (type === 'peel') noise(.28, 900, 5000, .22);
    else if (type === 'chime') [523, 659, 784].forEach((f, i) => tone(f, f, .5, 'triangle', .12, i * .09));
    else if (type === 'bad') tone(240, 110, .35, 'sawtooth', .07);
    else if (type === 'dice') for (let i = 0; i < 7; i++) noise(.03, 2500, 1800, .18, i * .06 + Math.random() * .03);
    else if (type === 'pet') { tone(480, 900, .14, 'sine', .14); tone(620, 1100, .16, 'sine', .1, .14); }
    else if (type === 'bonk') { tone(300, 90, .16, 'square', .08); noise(.06, 1200, 600, .15); }
    else if (type === 'tick') tone(1400, 1300, .04, 'square', .04);
    else if (type === 'horn') { tone(220, 220, .5, 'sawtooth', .06); tone(330, 330, .6, 'sawtooth', .05, .25); }
  } catch (e) {}
}
function toggleSound() {
  SND.on = !SND.on;
  if (SND.on && !SND.ctx) { try { SND.ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { SND.on = false; } }
  if (SND.ctx && SND.ctx.state === 'suspended') SND.ctx.resume();
  $('#btnSound').innerHTML = SND.on ? '🔊' : '🔈'; if (SND.on) sfx('pop');
}

/* ---------- raid ---------- */
function cancelRaid() { if (!S.raid) return; S.raid.team.forEach(id => { const c = S.creatures.find(x => x.id === id); if (c) { c.raid = false; c.back = true; } }); S.raid = null; }
function openRaid(pre) {
  if (UI.busy) return;
  const pk = typeof pre === 'string' && RAIDS[pre] ? pre : null;
  UI.raidSel = S.raid ? { target: pk || S.raid.target, team: new Set(S.raid.team), app: S.raid.app || 'risquee' } : { target: pk, team: new Set(), app: 'risquee' };
  const m = openModal('<div id="raidBody"></div>', { wide: true, label: 'Raid' });
  const draw = () => {
    const sel = UI.raidSel, crawl = !!(sel.target && typeof isCrawlTarget === 'function' && isCrawlTarget(sel.target)), cap = crawl ? 4 : 3;
    const crew = S.creatures.filter(c => (crawl || diceOf(c) > 0) && !c.away && !injured(c) && (!c.raid || sel.team.has(c.id)));
    const b = sel.target ? raidBreakdown(sel.target, [...sel.team]) : null;
    m.querySelector('#raidBody').innerHTML = `<h2>Raid sur le Val Douillet</h2>
      <p>Envoie jusqu’à 3 créatures piller les environs. Le raid se joue en fin de nuit : un dé par point d’équipe, on garde le meilleur. <b>6</b> succès total, <b>4-5</b> succès avec complication, <b>1-3</b> échec. Deux 6 : critique !</p>
      <h3>Cible</h3><p class="hint">D’autres cibles t’attendent sur la carte du Val : découvre-les pour pouvoir les piller.</p><div class="choices">${Object.entries(RAIDS).filter(([k]) => raidKnown(k)).map(([k, r]) => `<button type="button" class="choice" data-target="${k}" aria-pressed="${sel.target === k}" ${r.tier > S.tier ? 'disabled' : ''}><span class="emo">${r.emo}</span><b>${esc(r.name)}</b><span>${esc(r.desc)}</span><span>Butin ${costText(r.reward)} · +${r.hype} 🔥 · +${r.menace} Menace</span><span>${TAGS[r.tag]}${r.risk ? ` · bien gardée (−${r.risk} dé)` : ''}${r.tier > S.tier ? ` · 🔒 Palier ${r.tier}` : ''}</span></button>`).join('')}</div>
      <h3>Équipe (${sel.team.size}/${cap})</h3><div class="choices">${crew.length ? crew.map(c => { const sp = SPECIES[c.sp]; return `<button type="button" class="choice" data-mate="${c.id}" aria-pressed="${sel.team.has(c.id)}" ${!sel.team.has(c.id) && sel.team.size >= cap ? 'disabled' : ''}>${imgThumb('char', c.sp)}<b>${esc(c.name)}</b><span>${crawl ? (() => { const p = crawler(c); return `❤️ ${p.hp} · ⚔️ ${p.atk} · ${p.skills.filter(s => s.sig || s.gear || s.key === 'legende').map(s => s.ico).join('')}`; })() : `${sp.name} · ${diceOf(c)} 🎲 · ${TAGS[sp.tag] || '—'}`}</span>${hearts(c.mood)}</button>`; }).join('') : '<p class="hint">Personne ne peut partir : les diablotins sont trop petits. Attire des gobelins, gargouilles ou ménestrels.</p>'}</div>
      ${crawl ? `<h3>L’expédition</h3><p>${esc(CRAWL_DG[RAIDS[sel.target].rival].desc)} Niveau du donjon : <b>${String(crawlLevel()).replace('.', ',')}</b> (il suit la renommée de tes champions). Trois étages, un boss, et après chaque salle le choix de continuer ou de rentrer. Elle se joue cette nuit.</p>` : ''}
      ${!crawl && typeof RAID_APPS !== 'undefined' ? `<h3>Approche</h3><div class="choices">${Object.entries(RAID_APPS).map(([k, a]) => `<button type="button" class="choice" data-app="${k}" aria-pressed="${(sel.app || 'risquee') === k}"><span class="emo">${a.ico}</span><b>${esc(a.name)}</b><span>${esc(a.desc)}</span></button>`).join('')}</div>` : ''}
      ${b && !crawl ? `<h3>Réserve de dés</h3><div>${b.rows.map(([t, v]) => `<span class="tag2">${v >= 0 ? '+' : ''}${v} ${esc(t)}</span>`).join('')}</div><p class="odds">${oddsText(b.pool)}</p>` : ''}
      <div class="mfoot">${S.raid ? '<button class="sbtn danger" type="button" id="rCancel">Annuler le raid prévu</button>' : ''}<button class="sbtn" type="button" data-close>Plus tard</button><button class="sbtn pri" type="button" id="rGo" ${sel.target && sel.team.size ? '' : 'disabled'}>${crawl ? '🏰 Planifier l’expédition' : '🗺️ Planifier le raid'}</button></div>`;
  };
  draw();
  m.addEventListener('click', e => {
    const t = e.target.closest('[data-target]'), mt = e.target.closest('[data-mate]'), ap = e.target.closest('[data-app]');
    if (ap) { UI.raidSel.app = ap.dataset.app; sfx('tick'); draw(); }
    if (t && !t.disabled) { UI.raidSel.target = t.dataset.target; sfx('tick'); draw(); }
    else if (mt && !mt.disabled) { const id = mt.dataset.mate; UI.raidSel.team.has(id) ? UI.raidSel.team.delete(id) : UI.raidSel.team.add(id); sfx('tick'); draw(); }
    else if (e.target.closest('#rCancel')) { if (run('raidCancel')) { closeModal(); afterChange(); } }
    else if (e.target.closest('#rGo')) {
      if (!run('raidPlan', { target: UI.raidSel.target, team: [...UI.raidSel.team], app: UI.raidSel.app || 'risquee' })) return;
      sfx('chime'); closeModal(); afterChange();
      toast(`🗺️ L’équipe part vers ${RAIDS[S.raid.target].name}. Résultat à la fin de la nuit.`);
    }
  });
}
async function runRaid(report) {
  const tg = RAIDS[S.raid.target], team = S.raid.team.map(id => S.creatures.find(c => c.id === id)).filter(Boolean);
  if (!team.length) { S.raid = null; return; }
  const b = raidBreakdown(S.raid.target, S.raid.team), n = b.pool <= 0 ? 2 : b.pool;
  const m = openModal(`<h2>${tg.emo} Raid : ${esc(tg.name)}</h2><div class="team">${team.map(c => imgThumb('char', c.sp)).join('')}</div>
    <p>${team.map(c => esc(c.name)).join(', ')} ${team.length > 1 ? 'se faufilent' : 'se faufile'} dans la nuit…</p><p class="odds">${oddsText(b.pool)}</p>
    <div class="dice">${Array.from({ length: n }, () => '<div class="die">?</div>').join('')}</div><div id="rOut"></div>
    <div class="mfoot"><button class="sbtn pri" type="button" id="rRoll" data-focus>🎲 Lancer les dés</button></div>`, { noClose: true, label: 'Raid' });
  const btn = m.querySelector('#rRoll');
  await new Promise(res => btn.addEventListener('click', res, { once: true }));
  btn.disabled = true;
  const roll = rollPool(b.pool), dice = [...m.querySelectorAll('.die')];
  dice.forEach(d => d.classList.add('roll')); sfx('dice');
  for (let i = 0; i < 12; i++) { dice.forEach(d => d.textContent = 1 + rnd(6)); await sleep(70); }
  dice.forEach((d, i) => { d.classList.remove('roll'); d.textContent = roll.dice[i]; if (roll.dice[i] === 6) d.classList.add('six'); });
  const bi = roll.dice.indexOf(roll.best); if (dice[bi]) dice[bi].classList.add('best');
  const titles = { crit: '✨ Critique !', full: '🎉 Succès total !', partial: '😬 Succès… avec une complication', fail: '💨 Échec' };
  const lines = applyRaid(roll); sfx(roll.res === 'fail' ? 'bad' : 'chime');
  report.push([tg.emo, `${titles[roll.res]} (${roll.dice.join(', ')}) à ${tg.name}.`, roll.res === 'fail' ? 'bad' : 'good']); lines.forEach(l => report.push(l));
  addLog(`Raid ${tg.name} : ${titles[roll.res].replace(/^\S+ /, '')}`, roll.res === 'fail' ? 'bad' : 'good');
  m.querySelector('#rOut').innerHTML = `<p class="outcome">${titles[roll.res]}</p><ul class="chron">${lines.map(([e, t, tone]) => `<li class="${tone}"><span class="emo">${e}</span><span>${esc(t)}</span></li>`).join('')}</ul>`;
  btn.disabled = false; btn.textContent = 'Continuer'; renderHUD();
  await new Promise(res => btn.addEventListener('click', res, { once: true }));
  closeModal(true);
}

/* ---------- invasion animée ---------- */
async function runInvasion(report) {
  const plan = planInvasion(); sfx('horn');
  await banner('⚔️ Des aventuriers !', `${plan.party.map(h => esc(h.name)).join(' · ')}<br>Courage ${plan.courage}`, 2300);
  HEROS.length = 0; plan.party.forEach((h, i) => HEROS.push(newActor('hero' + i, 'hero', h.k, GATE.x + .5, H + 1.7)));
  let courage = plan.courage; V.courage = courage;
  const moveParty = (cx, cy, ms) => Promise.all(HEROS.map((a, i) => { a.walking = true; const o = (i - (HEROS.length - 1) / 2) * .18; return moveTo(a, cx + .5 + o, cy + .5 - o * .6 + (i % 2) * .1, ms); }));
  await moveParty(GATE.x, H, 800);
  let outcome = null, idx = 0; const path = plan.path;
  if (!path) outcome = 'lost';
  const hit = async (st, x, y) => {
    courage -= st.dmg; V.courage = Math.max(0, courage); sfx('bonk');
    floatText(x + .5, y + .5, `−${st.dmg} courage`, '#ffc4b4');
    if (st.defId) V.hit = { id: st.defId, t: performance.now() };
    if (st.dmg) say(pick(HEROS).id, pick(HERO_LINES.hit), 1700);
    report.push(['⚔️', `${st.label} : −${st.dmg} courage (reste ${Math.max(0, courage)}).`, st.dmg ? 'good' : '']);
    await sleep(850);
    if (st.lost && Math.random() < st.lost) { floatText(x + .5, y + .2, 'Perdus !'); say(HEROS[0].id, 'On est où, là ?', 1600); await sleep(600); return 'lost'; }
    return courage <= 0 ? 'repelled' : null;
  };
  if (path) for (idx = 0; idx < path.length; idx++) {
    const [x, y] = path[idx]; await moveParty(x, y, idx ? 440 : 520);
    for (const st of plan.steps.filter(s => s.i === idx)) { outcome = await hit(st, x, y); if (outcome) break; }
    if (outcome) break;
  }
  if (!outcome) outcome = 'robbed';
  if (outcome === 'robbed') { say(HEROS[0].id, pick(HERO_LINES.win), 1900); floatText(HEROS[0].x, HEROS[0].y, 'Pillage !', '#ffe07a'); sfx('bad'); await sleep(950); }
  else { say(HEROS[0].id, pick(HERO_LINES.flee), 1900); await sleep(550); }
  if (path) for (const [x, y] of path.slice(0, Math.min(idx, path.length - 1) + 1).reverse()) await moveParty(x, y, 190);
  await moveParty(GATE.x, H + 1, 520); HEROS.forEach(a => a.alpha = 0); await sleep(250);
  HEROS.length = 0; V.courage = null;
  const lines = applyInvasion(plan, outcome); lines.forEach(l => report.push(l));
  addLog(outcome === 'robbed' ? 'Des héros ont pillé le Cœur.' : 'Invasion repoussée !', outcome === 'robbed' ? 'bad' : 'good');
  if (outcome !== 'robbed') sfx('chime');
  renderAll();
  await banner(outcome === 'robbed' ? '💔 Le Cœur est pillé' : '🎉 Invasion repoussée !', lines[0] ? esc(lines[0][1]) : '', 2100);
}

/* ---------- nuit ---------- */
async function endNight() {
  if (UI.busy) return;
  if (typeof coopNightGate === 'function' && !coopNightGate()) return;
  dropSticker(); closeModal(true); if (UI.build) closeBuild(); setFloor(0);
  UI.busy = true; document.body.classList.add('busy'); $('#btnNight').disabled = true;
  const n = S.night, report = [];
  try {
    setPhase('calamite');
    const cd = calamityDelta(), before = S.calamity; S.calamity = Math.max(0, S.calamity + cd.d);
    report.push(['sec', 'Calamité'], ['🌀', `Horloge de Calamité : ${before} → ${Math.min(S.calamity, CAL_MAX)}${cd.parts.length ? ' (' + cd.parts.join(', ') + ')' : ''}.`, cd.d > 0 ? 'bad' : 'good']);
    renderHUD(); await banner('Calamité', cd.d > 0 ? `L’horloge avance de ${cd.d}` : 'Tout est calme', 1100);
    if (S.calamity >= CAL_MAX) { const ev = pick(CALAMITIES.filter(c => c.when())), txt = ev.run(); S.calamity = 0; report.push(['💥', 'Calamité ! ' + txt, 'bad']); addLog(txt, 'bad'); sfx('bad'); renderAll(); await banner('💥 Calamité !', esc(txt), 2400); S.stats.calmNights = 0; } else S.stats.calmNights++;
    setPhase('raid');
    if (S.raid) { report.push(['sec', 'Raid']); await runRaid(report); renderAll(); }
    setPhase('contrecoup');
    if (S.hype >= 3) S.menace += 1;
    renderHUD();
    if (S.menace >= MENACE_MAX) { S.menace = 0; renderHUD(); report.push(['sec', 'Contrecoup']); await runInvasion(report); }
    else await banner('Contrecoup', `Menace ${S.menace}/${MENACE_MAX} : pas d’aventuriers cette nuit`, 1100);
    if (typeof rivalNight === 'function') await rivalNight(report);
    setPhase('aube');
    dawn(report);
    const gd = checkGoals(); if (gd.length) report.push(['sec', 'Envies du château']);
    gd.forEach(g => { report.push(['✦', `${g.text} → ${rewardText(g.reward)}`, 'ev']); addLog(`Envie comblée : ${g.text}.`, 'ev'); });
    const ql = []; checkQuests(ql); if (ql.length) { report.push(['sec', 'Âmes du château']); ql.forEach(l => report.push(l)); }   // envies comblées par les arrivées de l'aube
    if (COOP.role === 'host') S.stats.coopNights++;
    const ad = checkAch(); if (ad.length) report.push(['sec', 'Hauts faits']);
    ad.forEach(a => report.push([a.ico, `${a.name} : pouvoir « ${a.pw} » débloqué. ${a.pd}`, 'ev']));
    S.rooms.forEach(r => { if (r.justBuilt) { delete r.justBuilt; poof(r.x, r.y, r.w, r.h); V.flash.push({ cells: cellsOf(r), t: performance.now() }); } });
    save(); renderAll();
    await chronicle(n, report);
  } catch (err) { console.error(err); toast('Oups, la nuit a trébuché. La partie continue.', true); }
  checkGoals().forEach(g => toast(`✦ Envie comblée : ${g.text}`));
  setPhase('roder'); UI.busy = false; document.body.classList.remove('busy'); $('#btnNight').disabled = false;
  renderAll(); save(); coopNightDone(); valAfterNight();
  if (S.tier >= 3 && !S.won) { S.won = true; save(); toast('👑 Palier 3 : ton château est légendaire… mais le Val n’a pas encore de Grand Maître. Vise une victoire (🏛️ en haut à droite).'); }
  if (typeof victoryAfterNight === 'function') victoryAfterNight();
}
function chronicle(n, report) {
  coopCast('chron', { n, report });
  const items = report.map(([e, t, tone], i) => e === 'sec' ? `<li class="sec">${esc(t)}</li>` : `<li class="${tone}" style="animation-delay:${Math.min(i, 14) * 50}ms"><span class="emo">${e}</span><span>${esc(t)}</span></li>`).join('');
  const m = openModal(`<h2>Chronique de la nuit ${n}</h2><p class="hint">${esc(S.name)} · ${esc(castleTitle())}</p><ul class="chron">${items}</ul>
    <div class="mfoot"><button class="sbtn pri" type="button" id="cNext" data-focus>🌙 Nuit ${S.night}</button></div>`, { noClose: true, label: 'Chronique' });
  sfx('chime');
  return new Promise(res => m.querySelector('#cNext').addEventListener('click', () => { closeModal(true); res(); }, { once: true }));
}

/* ---------- palier, aide, menu, accueil ---------- */
function openTier() {
  const st = tierStatus(), ex = expandStatus(), fl = floorSet().size;
  let html = st ? `<h2>⭐ Monter au Palier ${S.tier + 1}</h2><p>Un château plus grand attire des créatures plus puissantes… et des aventuriers plus coriaces.</p>
    <ul class="req">${st.rows.map(r => `<li>${r.ok ? '✅' : '⬜'} ${esc(r.text)}</li>`).join('')}</ul><p><b>Débloque :</b> ${esc(st.next.unlock)}, et un étage de plus.</p>
    <div class="btnrow"><button class="sbtn pri" type="button" id="tGo" ${st.ok ? '' : 'disabled'}>⭐ Monter de palier</button></div>`
    : `<h2>⭐ Palier ${S.tier}</h2><p>Ton château a atteint le palier maximal. Bravo, Maître !</p>`;
  html += `<h3>🪜 Étages (${fl}/${Math.min(3, S.tier)})</h3><p class="hint">Chaque palier permet d’ouvrir un étage : vers le haut avec l’<b>Escalier de la tour</b> (les Hauteurs, puis les Cimes : jardin suspendu, volière, belvédère), ou vers le bas avec l’<b>Escalier des caves</b> (les Caves, puis les Profondeurs : mine, reliquaire, lac souterrain). Chaque direction a ses stickers et attire ses propres créatures rares.</p>`;
  html += ex ? `<h3>🧱 Agrandir les remparts</h3><p>Le château passera à ${W + 2}×${H + 2} cases : une rangée de chaque côté et deux au fond, à tous les étages.</p>
    <ul class="req"><li>${S.tier >= ex.need ? '✅' : '⬜'} Palier ${ex.need}</li><li>${canAfford(ex.cost) ? '✅' : '⬜'} Payer ${costText(ex.cost)}</li></ul>
    <div class="btnrow"><button class="sbtn" type="button" id="tExp" ${ex.ok ? '' : 'disabled'}>🧱 Agrandir les remparts</button></div>` : '<h3>🧱 Remparts</h3><p class="hint">Les remparts sont au plus large.</p>';
  const m = openModal(html + '<div class="mfoot"><button class="sbtn" type="button" data-close>Plus tard</button></div>', { label: 'Palier' });
  m.querySelector('#tGo') && m.querySelector('#tGo').addEventListener('click', () => { if (!run('tierUp')) return; sfx('chime'); closeModal(); afterChange(); banner(`⭐ Palier ${S.tier} !`, 'De nouveaux stickers sont disponibles', 1800); });
  m.querySelector('#tExp') && m.querySelector('#tExp').addEventListener('click', () => { if (!run('expand')) return; sfx('chime'); closeModal(); afterChange(); CAM.user = false; fitCamera(); banner('🧱 Remparts agrandis !', `Le château fait maintenant ${W}×${H} cases`, 1800); });
}
function openHelp() {
  openModal(`<div class="help"><h2>Le manuel du Maître</h2>
    <p>Tu règnes sur un petit château maléfique (mais douillet). Colle des pièces, meuble-les, attire des créatures et décourage les aventuriers.</p>
    <h3>Se déplacer</h3><ul><li>Fais glisser le château pour te déplacer, zoome à la molette, au pincement ou avec les boutons + et −.</li><li>Sur téléphone, pour coller un sticker : touche une première fois pour viser, une seconde fois au même endroit pour coller.</li></ul>
    <h3>Une nuit, quatre temps</h3>
    <ul><li><b>Rôder</b> : ton tour. Colle des pièces, des meubles, de la déco et des pièges, donne des postes à tes créatures, prépare un raid.</li>
    <li><b>Calamité</b> : la faim, la mauvaise humeur, un château lugubre et la promiscuité font avancer l’horloge. Pleine (8), une catastrophe arrive.</li>
    <li><b>Raid</b> : ton équipe lance ses dés et on garde le meilleur. 6 : succès, 4-5 : succès avec complication, 1-3 : échec.</li>
    <li><b>Contrecoup</b> : raids et notoriété remplissent l’horloge de Menace. Pleine (6), des aventuriers débarquent.</li></ul>
    <p>À l’<b>aube</b>, les chantiers avancent, les pièces produisent, les humeurs changent et de nouvelles créatures arrivent.</p>
    <h3>Construire et aménager</h3>
    <ul><li>Une pièce doit toucher le château. Une porte s’ouvre toute seule entre deux pièces voisines.</li>
    <li>Chaque pièce démarre en chantier, avec une horloge de 4, 6 ou 8 segments. Tes ouvriers en remplissent 2 par nuit, plus un par diablotin ou orque.</li>
    <li>Les <b>meubles</b> donnent leurs effets à la pièce et l’éclairent : lits au Dortoir, chaudron en Cuisine, candélabres… Une pièce meublée attire son espèce.</li>
    <li>La Tour de guet touche les remparts ; le Caveau et le Trésor sont loin du porche. Bonus de voisinage : Cuisine contre Taverne, Forge contre Atelier.</li>
    <li>Les pièges se posent dans les couloirs, sur le chemin des héros (bouton « Chemin des héros »). Décoller un meuble est gratuit : il retourne dans ta barre.</li></ul>
    <h3>Créatures</h3>
    <ul><li>Comble leurs envies, pose la déco qu’elles aiment, donne-leur un poste dans leur pièce préférée. Ravies (4-5 ❤️), leur compétence compte double ; boudeuses (0-1), elle s’éteint.</li>
    <li>Une créature postée dans une pièce la défend. Les créatures libres défendent le Cœur.</li></ul>
    <p class="hint">Règles d’aménagement inspirées du jeu de rôle Wicked Ones (Forged in the Dark) : thèmes, horloges de projet, verrous et pièges, calamités et contrecoups.</p>
    <div class="mfoot"><button class="sbtn pri" type="button" data-close>C’est parti</button></div></div>`, { wide: true, label: 'Aide' });
}
function resetActors() { ACT.clear(); HEROS.length = 0; V.fx = []; V.born.clear(); V.parts = []; V.selected = null; }
function openMenu() {
  const guest = COOP.role === 'guest', des = S.opts.desert;
  const m = openModal(`<h2>Partie</h2><p>${guest ? 'Tu joues dans le château d’un autre Maître : ta propre partie t’attend, bien au chaud dans ce navigateur.' : 'Ta partie se sauvegarde toute seule dans ce navigateur, après chaque action et chaque nuit.'}</p>
    <div class="btnrow">${guest ? '' : '<button class="sbtn pri" type="button" id="mSaveNow">💾 Sauvegarder</button><button class="sbtn" type="button" id="mSlots">📂 Mes parties</button>'}<button class="sbtn" type="button" id="mTitle">🏠 Écran d’accueil</button></div>
    ${guest ? '' : `<div class="field"><label for="mName">Nom du château</label><input id="mName" maxlength="40" value="${esc(S.name)}"></div>`}
    <div class="btnrow">${guest ? '' : '<button class="sbtn pri" type="button" id="mSave">Renommer</button>'}<button class="sbtn" type="button" id="mLog">Chronique</button><button class="sbtn" type="button" id="mAch">🏆 Hauts faits</button><button class="sbtn" type="button" id="mRen">⭐ Renommée</button><button class="sbtn" type="button" id="mVal">🌐 Val des Maîtres</button></div>
    ${guest ? '' : `<h3>Désertions</h3><p class="hint">Une créature peu loyale peut partir pour un château qui reçoit mieux son espèce. Elle prévient toujours une nuit avant.</p>
    <div class="choices three" id="mDes">${[['on', '🧳 Activées', 'Les créatures délaissées peuvent partir.'], ['soft', '🍃 Douces', 'Deux fois moins de départs.'], ['off', '🛌 Désactivées', 'Personne ne part pour un autre château.']].map(([k, t, d]) => `<button type="button" class="choice" data-des="${k}" aria-pressed="${des === k}"><b>${t}</b><span>${d}</span></button>`).join('')}</div>`}
    <div class="btnrow">${guest ? '' : '<button class="sbtn" type="button" id="mTuto">Recommencer le tutoriel</button>'}<button class="sbtn" type="button" id="mTips">${S.tipsOff ? 'Réactiver les conseils' : 'Couper les conseils'}</button>${guest ? '' : '<button class="sbtn" type="button" id="mNew">🏰 Nouvelle partie</button>'}</div>`, { label: 'Partie' });
  const q = s => m.querySelector(s);
  q('#mSave') && q('#mSave').addEventListener('click', () => { if (run('rename', { name: q('#mName').value })) { closeModal(); afterChange(); } });
  q('#mLog').addEventListener('click', openJournal);
  q('#mAch').addEventListener('click', openAch);
  q('#mRen').addEventListener('click', openRenown);
  q('#mVal').addEventListener('click', () => openVal());
  q('#mDes') && q('#mDes').addEventListener('click', e => { const b = e.target.closest('[data-des]'); if (!b) return; S.opts.desert = b.dataset.des; sfx('tick'); save(); m.querySelectorAll('[data-des]').forEach(x => x.setAttribute('aria-pressed', x.dataset.des === S.opts.desert)); if (COOP.role === 'host') coopDirty(); });
  q('#mTuto') && q('#mTuto').addEventListener('click', () => { closeModal(); startTutorial(); });
  q('#mTips').addEventListener('click', () => { S.tipsOff = !S.tipsOff; save(); closeModal(); toast(S.tipsOff ? 'Gribouille gardera ses conseils pour lui.' : 'Gribouille te soufflera de nouveau des conseils.'); });
  q('#mNew') && q('#mNew').addEventListener('click', () => { if (slotIndex().list.length >= SLOTS_MAX) { closeModal(true); openTitle('load'); toast(`${SLOTS_MAX} parties au plus : supprimes-en une d’abord.`, true); return; } if (COOP.role) coopLeave(true); closeModal(true); openIntro(); });
  q('#mSaveNow') && q('#mSaveNow').addEventListener('click', () => { if (save()) { sfx('chime'); toast(`💾 « ${S.name} » sauvegardé (nuit ${S.night}).`); } });
  q('#mSlots') && q('#mSlots').addEventListener('click', () => { save(); openTitle('load'); });
  q('#mTitle').addEventListener('click', () => { if (COOP.role === 'guest') { coopLeave(); return; } save(); openTitle(); });
}
function openIntro() {
  let theme = 'forge';
  const back = S && S.started ? curSlot() : null;   // une partie en cours : elle reste rangée, on prépare un château neuf
  if (back != null) { save(); resetActors(); newState(); renderAll(); CAM.user = false; fitCamera(); }
  const m = openModal(`<h2>Bienvenue, Maître du Château</h2>
    <p>Sur sa colline, un petit château maléfique attend son maître. Colle des pièces, meuble-les comme un nid douillet, accueille des créatures attachantes et fais trembler (un peu) les aventuriers du Val Douillet.</p>
    <div class="field"><label for="iName">Nom de ton château</label><input id="iName" maxlength="40" value="Le Château de Minuit"></div>
    <h3>Thème du château</h3><div class="choices" id="iThemes">${Object.entries(THEMES).map(([k, t]) => `<button type="button" class="choice" data-theme="${k}" aria-pressed="${k === theme}"><span class="emo">${t.emo}</span><b>${esc(t.name)}</b><span>${esc(t.desc)}</span><span>Pièce unique : ${esc(ROOMS[t.room].name)}</span>${t.look ? `<span class="hint">🎨 ${esc(t.look)}</span>` : ''}</button>`).join('')}</div>
    <label class="tutochk"><input type="checkbox" id="iTuto" checked> Suivre le tutoriel avec Gribouille, le conseiller (recommandé)</label>
    <div class="mfoot"><button class="sbtn" type="button" id="iBack">← Retour</button><button class="sbtn" type="button" id="iHelp">📖 Le Grimoire</button><button class="sbtn pri" type="button" id="iGo" data-focus>🏰 Réveiller le château</button></div>`, { noClose: true, wide: true, label: 'Nouvelle partie' });
  m.querySelector('#iBack').addEventListener('click', () => { if (back != null) loadSlot(back); else openTitle(); });
  m.querySelector('#iThemes').addEventListener('click', e => { const b = e.target.closest('[data-theme]'); if (!b) return; theme = b.dataset.theme; S.theme = theme; V.dirty = true; sfx('tick'); m.querySelectorAll('[data-theme]').forEach(x => x.setAttribute('aria-pressed', x.dataset.theme === theme)); });
  m.querySelector('#iHelp').addEventListener('click', () => openGrimoire());
  m.querySelector('#iGo').addEventListener('click', () => {
    const name = m.querySelector('#iName').value.trim() || 'Le Château de Minuit';
    const tuto = m.querySelector('#iTuto').checked;
    useSlot(newSlotId()); resetActors(); newState(name, theme); S.started = true; S.tuto = { on: tuto, i: 0, asked: true }; TUTO.shown = null; TUTO.flags = {}; closeModal(true); renderAll(); save(); sfx('chime');
    banner(`🏰 ${esc(name)}`, `${THEMES[theme].emo} ${THEMES[theme].name}`, 1800);
    if (!tuto) setTimeout(() => toast('Commence par un Dortoir collé au couloir, puis meuble-le avec la Paillasse offerte.'), 1900);
  });
}

/* ---------- commandes ---------- */
function bindEvents() {
  $('#tabs').addEventListener('click', e => { const b = e.target.closest('[data-tab]'); if (!b) return; UI.tab = b.dataset.tab; sfx('tick'); renderSheet(); $('#sheet').scrollLeft = 0; });
  const sheet = $('#sheet');
  sheet.addEventListener('pointerdown', e => { const c = e.target.closest('.card'); if (!c || UI.busy) return; UI.press = { kind: c.dataset.kind, t: c.dataset.t, x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse', dragging: false }; });
  sheet.addEventListener('click', e => { const c = e.target.closest('.card'); if (!c || UI.busy || UI.suppress) return; if (UI.hand && UI.hand.kind === c.dataset.kind && UI.hand.t === c.dataset.t) { dropSticker(); return; } takeSticker(c.dataset.kind, c.dataset.t); });
  sheet.addEventListener('mouseover', e => { const c = e.target.closest('.card'); if (c && !UI.press) showTip(c); });
  sheet.addEventListener('mouseleave', () => showTip(null));
  sheet.addEventListener('wheel', e => { if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) { sheet.scrollLeft += e.deltaY; e.preventDefault(); } }, { passive: false });
  document.addEventListener('pointermove', e => {
    const p = UI.press;
    if (p && p.mouse && !p.dragging && Math.hypot(e.clientX - p.x, e.clientY - p.y) > 8) { UI.lastPt = { x: e.clientX, y: e.clientY, mouse: true }; showTip(null); if (takeSticker(p.kind, p.t)) { p.dragging = true; UI.dragging = true; } else UI.press = null; }
    if (UI.hand && UI.dragging) { UI.lastPt = { x: e.clientX, y: e.clientY, mouse: true }; updateGhost(UI.lastPt); }
  });
  document.addEventListener('pointerup', e => {
    const p = UI.press; UI.press = null;
    if (p && p.dragging) { UI.dragging = false; UI.suppress = true; setTimeout(() => { UI.suppress = false; }, 60); const a = anchorAt(e.clientX, e.clientY); if (a.inside && UI.hand) tryPlace(a, true); else dropSticker(); }
  });
  const PTR = new Map(); let drag = null;
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }), dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  cv.addEventListener('pointerdown', e => {
    if (UI.press && UI.press.dragging) return;
    try { cv.setPointerCapture(e.pointerId); } catch (err) {}
    PTR.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (PTR.size === 1) drag = { x: e.clientX, y: e.clientY, cx: CAM.x, cy: CAM.y, moved: false };
    else if (PTR.size === 2) { const [a, b] = [...PTR.values()], r = cv.getBoundingClientRect(); drag = { pinch: true, d: dist(a, b), s: CAM.s, m: mid(a, b), cx: CAM.x, cy: CAM.y, r, moved: true }; }
  });
  cv.addEventListener('pointermove', e => {
    const r = cv.getBoundingClientRect(); UI.lastPt = { x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse' };
    if (PTR.has(e.pointerId)) PTR.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (drag && drag.pinch && PTR.size >= 2) { const [a, b] = [...PTR.values()], m = mid(a, b), ns = clamp(drag.s * dist(a, b) / drag.d, CAM.min, CAM.max), wx = (drag.m.x - r.left - drag.cx) / drag.s, wy = (drag.m.y - r.top - drag.cy) / drag.s; CAM.s = ns; CAM.x = m.x - r.left - wx * ns; CAM.y = m.y - r.top - wy * ns; clampCam(); return; }
    if (drag && PTR.size === 1) { const dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (!drag.moved && Math.hypot(dx, dy) > 7) drag.moved = true; if (drag.moved) { CAM.user = true; CAM.x = drag.cx + dx; CAM.y = drag.cy + dy; clampCam(); cv.style.cursor = 'grabbing'; } return; }
    if (UI.hand) { if (e.pointerType === 'mouse') updateGhost(UI.lastPt); return; }
    const sx = e.clientX - r.left, sy = e.clientY - r.top, act = pickActor(sx, sy), [gx, gy] = tileAtScreen(sx, sy), tx = Math.floor(gx), ty = Math.floor(gy);
    V.hoverActor = act ? act.id : null; V.hover = !act && roomAt(tx, ty) ? [tx, ty] : null;
    V.hoverForest = !act && Z === EXT && tx >= 0 && tx < W && ty >= 0 && ty < H && !extOK(tx, ty) ? [tx, ty] : null;
    cv.style.cursor = act || V.hover || V.hoverForest ? 'pointer' : 'grab';
  });
  const up = e => {
    PTR.delete(e.pointerId); const d = drag;
    if (PTR.size === 0) drag = null; else { const [p] = [...PTR.values()]; drag = { x: p.x, y: p.y, cx: CAM.x, cy: CAM.y, moved: true }; }
    cv.style.cursor = '';
    if (!d || d.moved || d.pinch || e.type === 'pointercancel') return;
    tap(e);
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', () => { V.hover = null; V.hoverActor = null; if (!UI.dragging && UI.lastPt && UI.lastPt.mouse) V.ghost = null; });
  cv.addEventListener('wheel', e => { e.preventDefault(); const r = cv.getBoundingClientRect(); zoomAt(e.clientX - r.left, e.clientY - r.top, Math.exp(-e.deltaY * .0016)); }, { passive: false });
  $('#handbar').addEventListener('click', e => { if (e.target.closest('#btnRot')) rotateHand(); else if (e.target.closest('#btnDrop')) dropSticker(); });
  $('#portraits').addEventListener('click', e => { const b = e.target.closest('[data-crit]'); if (b) openCreature(b.dataset.crit); });
  $('#btnNight').addEventListener('click', endNight);
  $('#btnRaid').addEventListener('click', openRaid);
  $('#btnTier').addEventListener('click', () => { if (!UI.busy) openTier(); });
  $('#btnPath').addEventListener('click', e => { V.showPath = !V.showPath; e.currentTarget.classList.toggle('on', V.showPath); e.currentTarget.setAttribute('aria-pressed', V.showPath); sfx('tick'); });
  $('#btnBest').addEventListener('click', openBestiary);
  $('#floors').addEventListener('click', e => { const b = e.target.closest('[data-z]'); if (b) { setFloor(+b.dataset.z); sfx('tick'); } });
  $('#minimap').addEventListener('click', () => { if (!UI.busy) openWorld(); });
  $('#btnBuild').addEventListener('click', () => { if (!UI.busy) toggleBuild(); });
  $('#btnBuildClose').addEventListener('click', () => { dropSticker(); closeBuild(); });
  $('#btnCrit').addEventListener('click', () => { toggleLeft(); sfx('tick'); });
  $('#turn').addEventListener('click', () => { if (!UI.busy) openVictories(); });
  $('#notifs').addEventListener('click', e => {
    const x = e.target.closest('[data-nx]'); if (x) { e.stopPropagation(); (S.ndis = S.ndis || {})[x.dataset.nx] = S.night; if (x.dataset.nx === 'tip' && TUTO.pending) { (S.tips = S.tips || {})[TUTO.pending.id] = true; TUTO.pending = null; } save(); renderGoals(); return; }
    const b = e.target.closest('[data-n]'); if (!b || UI.busy) return; const f = UI.nacts && UI.nacts[b.dataset.n]; if (f) { sfx('tick'); f(); }
  });
  $('#zfit').addEventListener('click', () => { CAM.user = false; fitCamera(); });
  $('#btnHelp').addEventListener('click', () => openGrimoire());
  $('#btnMenu').addEventListener('click', () => { if (!UI.busy) openMenu(); });
  $('#btnSound').addEventListener('click', toggleSound);
  document.addEventListener('keydown', e => {
    if (e.target.matches('input, select, textarea')) return;
    if (e.key === 'Escape') { if ($('#modalRoot').children.length && !UI.modalNoClose) closeModal(); else if (UI.hand) dropSticker(); else if (UI.build) closeBuild(); }
    else if (e.key === 'b' || e.key === 'B') { if (!UI.busy) toggleBuild(); }
    else if (e.key === 'r' || e.key === 'R') rotateHand();
    else if (e.key === '+' || e.key === '=') zoomAt(V.w / 2, V.h / 2, 1.2);
    else if (e.key === '-') zoomAt(V.w / 2, V.h / 2, .83);
    else if ((e.key === 'j' || e.key === 'J') && !UI.busy) { setFloor(Z === EXT ? 0 : EXT); sfx('tick'); }
    else if (e.key === 'PageUp' || e.key === 'PageDown') { const fl = floorsOpen(), i = fl.indexOf(Z), j = i + (e.key === 'PageUp' ? -1 : 1); if (fl[j] != null) setFloor(fl[j]); e.preventDefault(); }
    else if (e.key.startsWith('Arrow') && !$('#modalRoot').children.length) { const d = 60; CAM.x += e.key === 'ArrowLeft' ? d : e.key === 'ArrowRight' ? -d : 0; CAM.y += e.key === 'ArrowUp' ? d : e.key === 'ArrowDown' ? -d : 0; clampCam(); }
  });
}
function tap(e) {
  if (UI.busy) return;
  if (typeof VISIT !== 'undefined' && VISIT) { visitTap(e); return; }
  const r = cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
  if (UI.hand) {
    if (UI.suppress) return;
    const a = anchorAt(e.clientX, e.clientY); UI.lastPt = { x: e.clientX, y: e.clientY, mouse: e.pointerType === 'mouse' };
    if (e.pointerType !== 'mouse') { const key = a.x + ',' + a.y; if (UI.touchAnchor !== key) { UI.touchAnchor = key; UI.ghostKey = null; updateGhost(UI.lastPt); if (V.ghost && V.ghost.ok) renderHand('Touche encore au même endroit pour coller.', 'ok'); return; } UI.touchAnchor = null; }
    if (a.inside) tryPlace(a, false); return;
  }
  const act = pickActor(sx, sy); if (act) { openCreature(act.id); return; }
  V.selected = null;
  const [gx, gy] = tileAtScreen(sx, sy), x = Math.floor(gx), y = Math.floor(gy);
  const f = furnAt(x, y); if (f) { openFurn(f.id); return; }
  const d = defAt(x, y); if (d) { openDef(d.id); return; }
  const rm = roomAt(x, y); if (rm) { openRoom(rm.id); return; }
  if (Z === EXT && x >= 0 && x < W && y >= 0 && y < H && !extOK(x, y)) openForest();
}

/* ---------- démarrage ---------- */
function boot(data) {
  const saved = (data && data.S) || load();
  if (saved) { S = upgradeState(saved); dirty(); } else newState();
  sortLimbo(); worldInit();
  document.querySelectorAll('img[data-ico]').forEach(i => { i.src = iconURL(i.dataset.ico); });
  if (uiPrefs().left) toggleLeft(true);
  bindEvents(); resize(); renderAll(); fitCamera();
  try { new ResizeObserver(() => { if (resize()) { if (CAM.user) clampCam(); else fitCamera(); } }).observe(cv); } catch (e) { addEventListener('resize', resize); }
  renderAll(); requestAnimationFrame(loop);
  bindAdmin(); bindSandboxFields(); initAdmin(); bindTutorial(); bindSouls();
  if (typeof initNet === 'function') initNet();
  if (!/[?&]coop=/.test(location.search)) openTitle(); else if (!S.started) openIntro();
  if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('17px "Patrick Hand"'), document.fonts.load('700 15px "Grenze Gotisch"')]).catch(() => {});
}
