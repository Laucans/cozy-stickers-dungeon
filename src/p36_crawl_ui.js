
/* =========================================================
   L'expédition à l'écran : la carte des salles, le combat au
   tour par tour (tu vois ce que prépare chaque ennemi), les
   repos, les mystères, et toujours le bouton pour rentrer.
   ========================================================= */
const isCrawlTarget = k => !!(RAIDS[k] && RAIDS[k].rival && CRAWL_DG[RAIDS[k].rival]);
// soumettre un rival : un boss vaincu vaut 2 points, un troisième étage atteint en vaut 1 (3 points : vassal)
function crawlVictory(dg, R, lines) {
  const v = vicState(), pts = R.done === 'boss' ? 2 : R.floor >= 3 && R.done !== 'wipe' ? 1 : 0, r = racer(dg);
  if (S.world) S.world.hit[dg] = S.night + (pts ? 6 : 3);
  if (!pts || isVassal(dg)) return;
  v.vassals[dg] = Math.min(3, (v.vassals[dg] || 0) + pts); v.race[dg] = Math.max(0, (v.race[dg] || 0) - 6 * pts);
  if (S.nem && S.nem.id === dg) { S.nem.pres = Math.max(6, S.nem.pres - 4 * pts); if (typeof facTick === 'function') facTick('nem', -2 * pts); }
  if (isVassal(dg)) { lines.push(['🏳️', `Reddition ! ${r.name} : te voilà suzerain. Un tribut chaque nuit.`, 'good']); addLog(`Vassal : ${r.name}.`, 'ev'); }
  else lines.push(['🏴', `${r.name} vacille : ${v.vassals[dg]}/3 vers la vassalité, et il recule dans la course.`, 'good']);
}
const intentTxt = (B, f) => {
  const it = f.int; if (!it) return ''; const tg = it.t && B.party.find(c => c.id === it.t && !c.ko), to = tg ? ` → ${tg.name}` : '', w = f.st.weak || 0;
  return { atk: `⚔️ ${Math.max(0, it.v - w)}${to}`, multi: `🗡️ ${Math.max(0, it.v - w)}×${it.n}${to}`, aoe: `💥 ${Math.max(0, it.v - w)} à tous`, drain: `🩸 ${Math.max(0, it.v - w)}${to}`, block: `🛡️ ${it.v}`, heal: `💚 soigne ${it.v}`, buff: `📣 +${it.v} aux siens`, fear: `😱 +${it.v} peur${to}`, fearall: `😱 +${it.v} peur à tous`, stun: `💫 immobilise${to}`, poison: `☠️ ${it.v}${to}`, poisonall: `☠️ ${it.v} à tous`, steal: `👛 vol${to}`, summon: '📯 appelle des renforts' }[it.k] || '';
};
const crawlFace = o => o.sp ? imgThumb('char', o.sp) : `<span class="cemo">${o.emo || '👾'}</span>`;
function crawlCard(o, opts = {}) {
  const hpk = Math.max(0, o.hp) / o.max, st = [o.block ? `🛡️${o.block}` : '', o.st.stun ? '💫' : '', o.st.poison ? `☠️${o.st.poison}` : '', o.st.song ? `🎵+${o.st.song}` : '', o.st.evade ? '💨' : '', o.st.taunt ? '🗿' : '', o.st.weak ? `🥴−${o.st.weak}` : ''].filter(Boolean).join(' ');
  const fear = o.stress != null ? `<span class="cfear" title="Peur ${o.stress}/${STRESS_MAX}">${'😱'.repeat(0)}<i style="width:${o.stress / STRESS_MAX * 100}%"></i></span>` : '';
  return `<button type="button" class="ccard${o.ko || o.hp <= 0 ? ' down' : ''}${opts.active ? ' active' : ''}${opts.target ? ' tgt' : ''}${o.boss ? ' boss' : o.elite ? ' elite' : ''}" ${opts.target ? `data-a="tg" data-v="${opts.id}"` : 'tabindex="-1"'}>
    <span class="cface">${crawlFace(o)}</span><b>${esc(o.name)}</b><span class="chp"><i style="width:${hpk * 100}%"></i><em>${Math.max(0, o.hp)}/${o.max}</em></span>${fear}
    ${opts.intent ? `<span class="cint">${esc(opts.intent)}</span>` : ''}${st ? `<span class="cst">${st}</span>` : ''}</button>`;
}
async function runCrawl(report) {
  const tg = RAIDS[S.raid.target], dg = tg.rival, team = S.raid.team.map(critter).filter(Boolean), rv = racer(dg);
  if (!team.length || !CRAWL_DG[dg]) { S.raid = null; return; }
  const R = crawlNew(dg, team), lines = [];
  const m = openModal('<div id="crawlBody" class="crawl"></div>', { wide: true, noClose: true, label: 'Expédition' }), body = m.querySelector('#crawlBody');
  m.classList.add('crawlmodal');
  let pending = null; const wait = () => new Promise(res => { pending = res; });
  body.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const p = pending; pending = null; p && p({ a: b.dataset.a, v: b.dataset.v }); });
  const loot = () => `💰 ${R.loot.g}${R.loot.s ? ` · 🪵 ${R.loot.s}` : ''}${R.loot.items.length ? ` · 🎁 ${R.loot.items.length}` : ''}`;
  const head = () => `<div class="chead"><h2>${rv.emo} ${esc(tg.name)}</h2><span>Niveau ${String(R.lvl).replace('.', ',')} · Étage ${Math.min(R.floor, CRAWL_FLOORS)}/${CRAWL_FLOORS}${R.floor > CRAWL_FLOORS ? ' · le boss' : ` · salle ${R.step + 1}/${CRAWL_STEPS}`} · Butin : ${loot()}${(S.relics || []).length ? ` · ${S.relics.map(k => RELICS[k].ico).join('')}` : ''}</span></div>`;
  const partyRow = (B, active, tmode) => `<div class="crow party">${R.party.map(c => crawlCard(c, { active: active && active.id === c.id, target: tmode && (tmode === 'ally' ? !c.ko : tmode === 'ko' ? c.ko : false), id: c.id })).join('')}</div>`;
  const pathRow = () => `<div class="cpath">${R.path.map(k => `<span>${NODES[k].ico}</span>`).join('<i>›</i>')}${R.path.length ? '<i>›</i>' : ''}<span class="cur">?</span></div>`;
  // une carte de la salle suivante, puis le choix : continuer ou rentrer
  const mapView = (msg) => {
    body.innerHTML = `${head()}${pathRow()}${msg ? `<p class="cmsg">${msg}</p>` : `<p class="hint">${esc(CRAWL_DG[dg].desc)}</p>`}${partyRow()}
      <h3>${R.floor > CRAWL_FLOORS ? 'Le boss vous attend' : 'Où aller ?'}</h3><div class="cnodes">${R.choices.map((c, i) => `<button type="button" class="choice cnode" data-a="go" data-v="${i}"><span class="emo">${NODES[c.k].ico}</span><b>${NODES[c.k].name}</b><small>${{ combat: 'Des ennemis, du butin.', elite: 'Un ennemi coriace, un beau butin.', tresor: 'De l’or, peut-être un sticker.', repos: 'Soigner ou calmer l’équipe.', event: 'Une rencontre étrange : un choix à faire.', boss: `${esc(CRAWL_EN[CRAWL_DG[dg].boss].name)}. Vaincu, il te rapporte gros.` }[c.k]}</small></button>`).join('')}</div>
      <div class="mfoot"><button type="button" class="sbtn" data-a="retreat">🏃 Rentrer au château avec le butin</button></div>`;
  };
  // le combat
  const fight = async kind => {
    const B = crawlBattle(R, crawlFoes(R, kind)); let auto = false;
    const view = (active, sel) => {
      const S0 = active && sel && active.skills.find(s => s.key === sel), tmode = S0 && S0.tgt;
      body.innerHTML = `${head()}<div class="crow foes">${B.foesL.filter(f => f.hp > 0).map(f => crawlCard(f, { intent: intentTxt(B, f), target: tmode === 'enemy', id: f.uid })).join('')}</div>
        ${partyRow(B, active, tmode === 'ally' || tmode === 'ko' ? tmode : null)}
        ${active ? `<div class="cskills"><b>${esc(active.name)}</b>${S0 && tmode !== 'self' && tmode !== 'none' ? `<span class="hint"> : choisis ${tmode === 'enemy' ? 'un ennemi' : tmode === 'ko' ? 'une alliée K.O.' : 'une alliée'} (${esc(S0.name)})</span> <button type="button" class="sbtn" data-a="cancel">Annuler</button>` : `<div class="cskl">${active.skills.map(s => { const cd = active.cd[s.key] || 0, used = s.uses && (R.uses || {})[active.id + s.key] >= s.uses, noKo = s.tgt === 'ko' && !R.party.some(c => c.ko); return `<button type="button" class="choice csk${s.sig ? ' sig' : s.gear ? ' gear' : ''}" data-a="sk" data-v="${s.key}" ${cd || used || noKo ? 'disabled' : ''} title="${esc(s.desc)}"><span class="emo">${s.ico}</span><b>${esc(s.name)}</b><small>${cd ? `recharge ${cd}` : used ? 'épuisé' : esc(s.desc)}</small></button>`; }).join('')}</div>`}</div>` : ''}
        <div class="clog">${B.ev.slice(-6).map(e => `<p class="${e.cls}">${esc(e.t)}</p>`).join('')}</div>
        <div class="mfoot"><button type="button" class="sbtn danger" data-a="flee">🏳️ Fuir (perdre la moitié du butin)</button><button type="button" class="sbtn" data-a="auto">${auto ? '⏸️ Reprendre la main' : '🤖 Combat auto'}</button></div>`;
    };
    for (let guard = 0; guard < 80 && !B.over; guard++) {
      B.startTurn(); if (B.over) break;
      for (const me of B.mates()) {
        if (B.over || me.ko) continue;
        if (me.st.stun) { B.act(me, 'frapper', null); view(null); await sleep(500); continue; }
        if (auto) { const [k, t] = crawlPick(B, me); B.act(me, k, t); view(me); await sleep(350); continue; }
        let sel = null;
        for (;;) {
          view(me, sel); const ch = await wait();
          if (ch.a === 'flee') { B.flee(); break; }
          if (ch.a === 'auto') { auto = true; const [k, t] = crawlPick(B, me); B.act(me, k, t); break; }
          if (ch.a === 'cancel') { sel = null; continue; }
          if (ch.a === 'sk') { const S0 = me.skills.find(s => s.key === ch.v); if (!S0) continue; if (S0.tgt === 'self' || S0.tgt === 'none') { B.act(me, S0.key, me); break; } sel = S0.key; continue; }
          if (ch.a === 'tg' && sel) { const t = B.foesL.find(f => f.uid === ch.v) || R.party.find(c => c.id === ch.v); B.act(me, sel, t); break; }
        }
        sfx('bonk');
      }
      if (B.over) break;
      const n0 = B.ev.length; B.enemyTurn();
      for (let k = n0; k <= B.ev.length; k++) { view(null); await sleep(auto ? 120 : 260); }
      if (auto) { view(null); const ch = await Promise.race([wait(), sleep(250).then(() => null)]); if (ch && ch.a === 'auto') auto = false; if (ch && ch.a === 'flee') B.flee(); }
    }
    return B.over || 'lost';
  };
  const panel = async (text, buttons) => { body.innerHTML = `${head()}${pathRow()}<p class="cmsg">${text}</p>${partyRow()}<div class="cnodes">${buttons.map(([a, v, label]) => `<button type="button" class="choice cnode" data-a="${a}" data-v="${v}"><b>${label}</b></button>`).join('')}</div>`; return wait(); };
  let msg = null;
  for (;;) {
    mapView(msg); msg = null; const ch = await wait();
    if (ch.a === 'retreat') { R.done = 'retreat'; break; }
    const node = R.choices[+ch.v]; if (!node) continue; R.path.push(node.k); sfx('tick');
    if (['combat', 'elite', 'boss'].includes(node.k)) {
      const res = await fight(node.k);
      if (res === 'fled') { R.done = 'fled'; R.loot.g = Math.floor(R.loot.g / 2); R.loot.s = Math.floor(R.loot.s / 2); break; }
      if (res !== 'won') { R.done = 'wipe'; break; }
      const t = crawlWinLoot(R, node.k); sfx('chime');
      if (node.k === 'boss') { R.done = 'boss'; break; }
      msg = `Victoire ! ${t}`;
    } else if (node.k === 'tresor') { msg = crawlTreasure(R); sfx('chime'); }
    else if (node.k === 'repos') { const c2 = await panel('🔥 Un coin tranquille pour souffler. Que faire ?', [['rest', 'heal', '❤️ Soigner l’équipe (+35 % des PV)'], ['rest', 'calm', '😌 Se calmer (−4 de peur)']]); msg = crawlRest(R, c2.v); }
    else { const E = pick(CRAWL_EVENTS), c2 = await panel(`❓ ${esc(E.t)}`, E.a.map((a, i) => ['ev', i, esc(a[0])])); msg = E.a[+c2.v][1](R); }
    crawlAdvance(R);
  }
  // le retour
  crawlApply(R, team, lines); crawlVictory(dg, R, lines);
  body.innerHTML = `${head()}<h3>${R.done === 'boss' ? '👑 Victoire !' : R.done === 'wipe' ? '💀 Terrassés…' : '🏃 Retour au château'}</h3><ul class="chron">${lines.map(([e, t, tone]) => `<li class="${tone}"><span class="emo">${e}</span><span>${esc(t)}</span></li>`).join('')}</ul><div class="mfoot"><button type="button" class="sbtn pri" data-a="end">Rentrer</button></div>`;
  sfx(R.done === 'wipe' ? 'bad' : 'chime'); await wait();
  closeModal(true);
  report.push([rv.emo, `Expédition dans ${tg.name} (niveau ${String(R.lvl).replace('.', ',')}) : ${R.done === 'boss' ? 'le boss est vaincu !' : R.done === 'wipe' ? 'l’équipe est terrassée.' : R.done === 'fled' ? 'fuite, la moitié du butin perdue.' : 'retour avec le butin.'}`, R.done === 'wipe' || R.done === 'fled' ? 'bad' : 'good']);
  lines.forEach(l => report.push(l));
  addLog(`Expédition : ${tg.name}.`, R.done === 'wipe' ? 'bad' : 'good');
}
// la nuit : une expédition remplace les dés quand la cible est un donjon rival
const runRaidCrawl = runRaid;
runRaid = async function (report) { if (S.raid && S.raid.crawl && isCrawlTarget(S.raid.target)) return runCrawl(report); return runRaidCrawl(report); };
const raidPlanCrawl = CMD.raidPlan;
CMD.raidPlan = function (a) {
  if (!isCrawlTarget(a.target)) return raidPlanCrawl.call(this, a);
  const tg = RAIDS[a.target]; if (tg.tier > S.tier) return `Palier ${tg.tier} requis`;
  if (typeof isVassal === 'function' && isVassal(tg.rival)) return 'Déjà ton vassal';
  const team = [...new Set(a.team || [])].slice(0, 4).map(critter).filter(c => c && !injured(c) && (!isOut(c) || (S.raid && S.raid.team.includes(c.id) && !c.away)));
  if (!team.length) return 'Personne ne peut partir';
  cancelRaid(); S.raid = { target: a.target, team: team.map(c => c.id), crawl: true };
  team.forEach(c => { c.raid = true; critterLeave(c.id); });
  addLog(`Expédition prévue : ${tg.name}.`, 'ev'); return null;
};
// pour le simulateur : une expédition jouée par le joueur automatique
function simCrawlNight(report) {
  const tg = RAIDS[S.raid.target], dg = tg.rival, team = S.raid.team.map(critter).filter(Boolean);
  if (!team.length) return null;
  const R = crawlAuto(dg, team, { prudence: .5 }), lines = []; crawlApply(R, team, lines); crawlVictory(dg, R, lines);
  report.push(['🏰', `Expédition ${tg.name} (niv. ${R.lvl}) : ${R.done}`, R.done === 'wipe' ? 'bad' : 'good']); lines.forEach(l => report.push(l));
  return R.done;
}

/* ---------- le Grimoire ---------- */
WIKI.expeditions = { cat: 'danger', t: 'Expéditions dans les donjons', x: () => `<p>Les donjons rivaux ne se pillent pas aux dés : on y envoie une <b>expédition</b> de 4 créatures au plus, depuis le bouton Raid (cible : un donjon rival, dès le Palier 1). Elle se joue pendant la nuit, salle après salle, comme Slay the Spire ou Darkest Dungeon.</p>
  <ul><li><b>Trois étages</b> de 3 salles, puis le boss. À chaque pas, deux salles au choix : ${Object.entries(NODES).filter(([k]) => k !== 'boss').map(([, n]) => `${n.ico} ${n.name}`).join(', ')}.</li>
  <li><b>Après chaque salle</b>, tu continues ou tu rentres avec le butin. En plein combat, tu peux fuir (la moitié du butin reste au donjon). Si l’équipe est terrassée, tout est perdu et tout le monde rentre sonné.</li>
  <li><b>Le combat</b> : chaque créature agit à son tour (frapper, se protéger, sa capacité). Au-dessus de chaque ennemi, sa prochaine action : à toi de t’y préparer (se protéger, l’immobiliser, le tuer d’abord).</li>
  <li><b>La peur</b> monte avec les spectres, les K.O. et les cris ; à ${STRESS_MAX}, une créature panique et perd des tours. Au retour, la peur se change en fatigue (et parfois en cicatrice).</li>
  <li><b>Ton château fait ton équipe</b> : la garde et le niveau font les PV et la force ; chaque espèce a sa capacité (${Object.entries(CRAWL_SK).slice(0, 6).map(([k, s]) => `{sp:${k}} : ${esc(s.name)}`).join(', ')}…) ; tes meubles en apprennent d’autres (${CRAWL_GEAR.map(G => `${G.ico} ${esc(G.name)}`).join(', ')}) ; une créature fidèle (70 de loyauté) tient debout une fois avec 1 PV ; une légende ou une créature évoluée frappe un Coup de légende.</li>
  <li><b>Le niveau du donjon</b> suit la renommée de tes 4 meilleures créatures : les rivaux se préparent à tes champions.</li>
  <li><b>Les récompenses</b> : or et matériaux qui grossissent avec la profondeur, des stickers dans les trésors, et sur chaque boss une relique unique (${Object.values(RELICS).map(r => `${r.ico} ${esc(r.name)}`).join(', ')}). Soumettre un rival : un boss vaincu vaut 2 points, un troisième étage atteint 1 point ; à 3 points, il devient ton vassal.</li></ul>` };
TIPS.push({ id: 'crawl0', when: () => S.tier >= 1 && !(S.stats.crawls) && !(S.tuto && S.tuto.on), t: 'Les donjons rivaux t’attendent', x: 'Dès le Palier 1, le bouton Raid te propose une expédition dans un donjon rival : quatre créatures, trois étages, un boss, et à chaque salle le choix de continuer ou de rentrer avec le butin.', wiki: 'expeditions' });
