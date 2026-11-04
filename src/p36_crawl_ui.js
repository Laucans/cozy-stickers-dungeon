
/* =========================================================
   L'expédition à l'écran : la page change. En haut, l'arène
   (ton équipe à gauche, les ennemis à droite, avec ce qu'ils
   préparent) ; en bas, ta main de cartes, l'énergie, la pioche.
   Avant de partir, on remplit le sac avec les cartes du château ;
   entre les salles, la carte du donjon, les repos, les mystères,
   les récompenses, et toujours le bouton pour rentrer.
   ========================================================= */
// les cibles d'expédition : les donjons rivaux (bouton Raid), la Forêt enchantée et les Grottes (carte du Val)
const crawlDgOf = k => RAIDS[k] ? (RAIDS[k].dg || RAIDS[k].rival) : null;
const CRAWL_SITES = ['foret', 'grotte', 'ruines'];
function ensureCrawlSites() {
  if (typeof S === 'undefined' || !S || !S.started) return;
  let w; try { w = world(); } catch (e) { return; }
  w.sites.forEach(s => { if (CRAWL_SITES.includes(s.expe) && !RAIDS['x_' + s.id]) RAIDS['x_' + s.id] = { name: s.name, emo: CRAWL_DG[s.expe].emo, tier: 0, risk: 1, tag: (EXPE_SITES[s.expe] || {}).tag || 'ruse', reward: { g: 0 }, hype: 1, menace: 0, dg: s.expe, site: s.id, desc: CRAWL_DG[s.expe].desc }; });
}
const isCrawlTarget = k => { if (!RAIDS[k] && /^x_/.test(k || '')) ensureCrawlSites(); const d = crawlDgOf(k); return !!(d && CRAWL_DG[d]); };
// soumettre un rival : un boss vaincu vaut 2 points ; le troisième étage atteint, puis rentrer sans fuir, 1 point (3 points : vassal)
function crawlVictory(dg, R, lines) {
  if (!CRAWL_DG[dg] || CRAWL_DG[dg].site) return;
  const v = vicState(), door = R.floor >= CRAWL_FLOORS && (R.won || 0) >= 2 && R.done !== 'wipe' && R.done !== 'fled', pts = R.done === 'boss' ? 2 : door ? 1 : 0, r = racer(dg);   // 1 point : atteindre le troisième étage et rentrer en bon ordre, sans fuir un combat
  if (!pts && !isVassal(dg) && R.done !== 'wipe') lines.push(['🛡️', `${r.name} ne cède rien : il faut atteindre le troisième étage avec au moins deux combats gagnés, puis rentrer sans fuir (1 point), ou vaincre le boss (2 points).`, '']);
  if (S.world) S.world.hit[dg] = S.night + (pts ? 6 : 3);
  if (!pts || isVassal(dg)) return;
  v.vassals[dg] = Math.min(3, (v.vassals[dg] || 0) + pts); v.race[dg] = Math.max(0, (v.race[dg] || 0) - 6 * pts);
  if (S.nem && S.nem.id === dg) { S.nem.pres = Math.max(6, S.nem.pres - 4 * pts); if (typeof facTick === 'function') facTick('nem', -2 * pts); }
  if (isVassal(dg)) { lines.push(['🏳️', `Reddition ! ${r.name} : te voilà suzerain. Un tribut chaque nuit.`, 'good']); addLog(`Vassal : ${r.name}.`, 'ev'); }
  else lines.push(['🏴', `${r.name} vacille : ${v.vassals[dg]}/3 vers la vassalité, et il recule dans la course.`, 'good']);
}
// la Forêt, les Grottes et les Ruines : leurs trésors (un artefact, une rencontre) et le temps qu'il faut pour y retourner
function crawlSiteResult(key, R, team, lines) {
  const tg = RAIDS[key]; if (!tg || !tg.site || !R.path || !R.path.length) return;   // rentré avant la première salle : rien ne se passe, le lieu reste ouvert
  const s = siteById(tg.site), X = EXPE_SITES[tg.dg] || {}; if (!s) return;
  S.world.cd[s.id] = S.night + 5; S.stats.expeditions = (S.stats.expeditions || 0) + 1;
  discover(discAround(s.q, s.r, 2), 'expédition');
  if (R.done === 'wipe') return;
  if (R.done === 'boss' && Math.random() < .6) { const a = giveArtefact(randomArtefact(X.arts) || randomArtefact(), 'expédition'); if (a) lines.push(['🏺', `Dans les profondeurs de ${s.name}, l’équipe trouve un artefact : ${FURN[a].name}.`, 'good']); }
  if ((R.done === 'boss' || (R.floor >= 3 && Math.random() < .3)) && X.meet && !worldMet(X.meet)) { S.world.met[X.meet] = S.night; lines.push(['🤝', `Une rencontre : ${SPECIES[X.meet].name}, qui viendra s’installer si ton château rayonne à ${SPECIES[X.meet].glow} ✨ et lui offre sa pièce.`, 'good']); }
  team.forEach(c => addLoy(c, R.done === 'boss' ? 4 : 2));
}

/* ---------- la vue « à plat » d'un combat : de quoi l'afficher ici, ou chez un autre Maître ---------- */
function intentVM(B, f, it, leg) {
  if (!it) return null;
  const tg = it.t && B.party.find(c => c.id === it.t && !c.ko), w = f.st.weak || 0, v = Math.max(0, (it.v || 0) - w), name = actName(it), el = ACT_EL[it.k] || (FOE_ELEM[f.k] || {}).el;
  const num = { atk: v, execute: v, smash: v, grab: v, drain: v, multi: `${v}×${it.n}`, throw: `${v}×${it.n}`, swarm: `${v}×${it.n}`, aoe: `${v} à tous`, tailall: `${v} à tous`, roots: `${v} à tous`, shatter: `${v} à tous`, souldrain: `${v} à tous`, block: it.v, heal: it.v, round: it.v, serve: it.v, buff: `+${it.v}`, fear: `+${it.v}`, fearall: `+${it.v} à tous`, poison: it.v, poisonall: `${it.v} à tous`, toxic: `${it.v} à tous`, steal: 'vol', summon: 'renforts', spawn: 'renfort', cocoon: '2 tours', petrify: '2 tours', decree: '−1 énergie' }[it.k];
  const cls = DMG_K.includes(it.k) || it.k === 'steal' ? 'hurt' : ['fear', 'fearall', 'stun', 'poison', 'poisonall', 'toxic', 'cocoon', 'petrify', 'blind', 'charm', 'decree'].includes(it.k) ? 'curse' : 'calm';
  const special = !!(ELITE_ACT[it.k] || LEG_ACT[it.k]);
  return { ik: INT_IK[it.k] || 'question', num: num == null ? '' : String(num), tgt: tg ? tg.name : '', cls, leg: !!leg, special, name: special ? name : '', el: DMG_K.includes(it.k) && el ? el : '',
    title: `${leg ? '⚡ Action légendaire : ' : special ? '★ Action d’élite : ' : ''}${name}${num != null && num !== '' ? ' (' + num + ')' : ''}${tg ? ' → ' + tg.name : ''}${DMG_K.includes(it.k) && el ? ' · ' + ELEM[el][1] : ''}` };
}
function figVM(B, o, side) {
  const foe = side === 'foe', E = elemOf(o), P = foe && o.pow ? ELITE_POW[o.pow] : null, C = foe ? CRAWL_EN[o.k] : null;
  return { id: foe ? o.uid : o.id, side, name: o.name, sp: o.sp || '', k: o.k || '', emo: o.emo || '', hp: Math.max(0, o.hp), max: o.max, block: o.block || 0, stress: o.stress || 0, down: foe ? o.hp <= 0 : !!o.ko,
    boss: !!o.boss, elite: !!o.elite, phase: o.phase || 1, st: stList(o), stunned: !!(o.st && o.st.stun),
    intent: foe && B && o.hp > 0 ? (o.st.stun ? { ik: 'dizzy', num: 'sonné', cls: 'calm', title: 'Il perd sa prochaine action', tgt: '' } : intentVM(B, o, o.st.confuse ? null : o.int, false)) : null,
    leg: foe && B && o.hp > 0 && !o.st.stun && o.lint ? intentVM(B, o, o.lint, true) : null,
    pow: P ? { ik: POW_IK[o.pow] || 'spark', name: P.name, desc: powDesc(o.pow) } : null, legN: C && C.leg ? Math.min(3, (B && B.np) || 1) : 0, p2: C && C.p2 ? BOSS_P2[C.p2] : '',
    vuln: E.vuln || [], res: E.res || [], imm: E.imm || [], nofear: !!E.nofear };
}
function cardVM(B, c, p, R) {
  const D = cardDef(c), me = B ? B.owner(c) : R ? R.party.find(x => x.id === c.owner) : null, el = cardEl(c, me);
  return { uid: c.uid, src: c.src, key: c.key, up: !!c.up, name: cardName(c), ik: cardIk(D, el), cost: B ? B.costOf(c) : D.cost || 0, base: D.cost || 0, text: cardText(c, me, B), why: B ? B.why(c, p) : '',
    kind: cardKind(D), el: el || '', ex: !!D.exhaust, tgt: D.tgt, osp: me ? me.sp : '', oname: me ? me.name : '', src2: c.src === 'castle' ? castleSrc(c.key) : '', art: c.src === 'castle' ? castleKey(c.key) : '' };
}
function battleVM(B, opts = {}) {
  return { turn: B.turn, np: B.np, party: B.party.map(o => figVM(B, o, 'ally')), foes: B.foesL.filter(f => f.hp > 0).map(f => figVM(B, f, 'foe')),
    hands: B.hands.map((H, p) => H.map(c => cardVM(B, c, p))), nrg: B.nrg.slice(), draw: B.draw.length, disc: B.disc.length, exh: B.exh.length, trap: B.trap, decoy: B.decoy,
    env: B.env.map((e, i) => { const D = cardDef(e.c); return { i, key: e.key, used: e.used, name: e.used ? D.name : '', prop: D.prop, x: e.x, y: e.y }; }),
    log: B.ev.filter(e => e.cls !== 'card' && e.cls !== 'foe' && e.cls !== 'leg').slice(-3).map(e => ({ t: e.t, c: e.cls })), ready: opts.ready || [], names: opts.names || [] };
}

/* ---------- réafficher sans tout reconstruire ----------
   Le combat se réaffiche après chaque geste : on compare avec ce qui est déjà là et on ne touche
   qu'aux morceaux qui changent. Les images ne se rechargent pas, les animations continuent, et les
   effets du moment (chiffres, éclats, bannières) restent jusqu'à leur fin. */
const MORPH_FX = new Set(['shake', 'flash', 'lunge-r', 'lunge-l', 'fall', 'shield', 'fury-in', 'enter', 'cheer', 'toss', 'reveal']);
const morphKeep = n => n.nodeType === 1 && /(^|\s)(fnum|fburst|fslash|cplay|cturn)(\s|$)/.test(n.getAttribute('class') || '');
const morphKey = n => n.nodeType === 1 ? n.getAttribute('data-fid') || n.getAttribute('data-uid') || '' : '';
const morphBase = v => v.split(/\s+/).filter(c => c && !MORPH_FX.has(c)).join(' ');
function morphNode(a, b) {
  if (a.nodeType !== 1) { if (a.nodeValue !== b.nodeValue) a.nodeValue = b.nodeValue; return; }
  for (const at of [...a.attributes]) if (!b.hasAttribute(at.name)) a.removeAttribute(at.name);
  for (const at of [...b.attributes]) {
    if (at.name === 'class') { if (morphBase(a.getAttribute('class') || '') !== morphBase(at.value)) { const fx = [...a.classList].filter(c => MORPH_FX.has(c)); a.setAttribute('class', at.value); fx.forEach(c => a.classList.add(c)); } continue; }
    if (a.getAttribute(at.name) !== at.value) a.setAttribute(at.name, at.value);
  }
  morphKids(a, b);
}
function morphKids(a, b) {
  const old = [...a.childNodes].filter(n => !morphKeep(n)), nu = [...b.childNodes], keyed = new Map(), used = new Set();
  old.forEach(n => { const k = morphKey(n); if (k) keyed.set(k, n); });
  const fin = nu.map((nb, i) => {
    const k = morphKey(nb); let na = k ? keyed.get(k) : old[i];
    if (na && (used.has(na) || na.nodeType !== nb.nodeType || na.nodeName !== nb.nodeName || (!k && morphKey(na)))) na = null;
    if (!na) return nb;
    used.add(na); morphNode(na, nb); return na;
  });
  old.forEach(n => { if (!used.has(n)) n.remove(); });
  let cur = a.firstChild;
  for (const n of fin) { while (cur && cur !== n && morphKeep(cur)) cur = cur.nextSibling; if (cur === n) { cur = cur.nextSibling; continue; } a.insertBefore(n, cur); }
}
function morphHTML(box, html) {
  const t = document.createElement('template'); t.innerHTML = html;
  if (typeof iconizeTree === 'function') [...t.content.childNodes].forEach(iconizeTree);
  morphKids(box, t.content);
}

/* ---------- l'affichage : figurines, cartes, secret du décor ---------- */
const crawlFace = o => foeImg(o);
const stList = o => [o.st.stun && ['dizzy', '', 'Immobilisé·e'], o.st.poison && ['poison', o.st.poison, 'Empoisonné·e'], o.st.song && ['up', '+' + o.st.song, 'Force en plus'], o.st.evade && ['feather', '', 'Esquivera la prochaine attaque'], o.st.taunt && ['target', '', 'Attire les coups'], o.st.weak && ['down', '−' + o.st.weak, 'Frappe moins fort'], o.st.confuse && ['psy', '', 'Embrouillé'], o.st.mist && ['cloud', o.st.mist, 'Changé en brume'], o.stress >= STRESS_MAX && ['fear', '', 'Panique']].filter(Boolean);
const stHTML = L => (L || []).filter(x => Array.isArray(x) && ICON_DRAW[x[0]]).map(([k, n, t]) => `<span class="sti" title="${esc(String(t || ''))}">${gi(k)}${n !== '' && n != null ? esc(String(n)) : ''}</span>`).join('');
const safeKey = (tbl, k) => typeof k === 'string' && Object.prototype.hasOwnProperty.call(tbl, k) ? k : '';
const phaseDl = p => `animation-delay:-${((performance.now() / 1000) % p).toFixed(2)}s`;
function intentHTML(I) {
  if (!I) return '';
  return `<span class="fint ${I.cls}${I.leg ? ' leg' : ''}${I.special ? ' spe' : ''}" title="${esc(I.title || '')}">${I.leg ? gi('bolt', 'lg') : ''}${gi(I.ik)}${I.name ? `<em>${esc(I.name)}</em>` : ''}${I.num ? ` ${esc(I.num)}` : ''}${I.el && ELEM[I.el] ? `<span class="eli" title="${esc(ELEM[I.el][1])}">${gi(ELEM_IK[I.el])}</span>` : ''}${I.tgt ? ` <small>→ ${esc(I.tgt)}</small>` : ''}</span>`;
}
const elemBadges = f => {
  const one = (list, cls, lab) => list.filter(e => ELEM[e]).map(e => `<span class="eb ${cls}" title="${lab} : ${esc(ELEM[e][1])}">${gi(ELEM_IK[e])}${cls === 'v' ? '×2' : cls === 'r' ? '½' : '∅'}</span>`).join('');
  const h = one(f.vuln || [], 'v', 'Vulnérable') + one(f.res || [], 'r', 'Résiste') + one(f.imm || [], 'i', 'Immunisé'); return h ? `<div class="felem">${h}</div>` : '';
};
function figHTML(f, tgt) {
  const k = f.max ? f.hp / f.max : 0, img = foeImg({ k: safeKey(CRAWL_EN, f.k), sp: safeKey(CHAR, f.sp), emo: f.emo });
  return `<div class="fig ${f.side === 'foe' ? 'foe' : 'ally'}${f.down ? ' down' : ''}${tgt ? ' tg' : ''}${f.boss ? ' boss' : f.elite ? ' elite' : ''}${f.phase === 2 ? ' fury' : ''}${f.stunned ? ' stunned' : ''}" data-fid="${esc(f.id)}" ${tgt ? `data-a="tg" data-v="${esc(f.id)}" role="button" tabindex="0" aria-label="Cibler ${esc(f.name)}"` : ''}>
    ${f.side === 'foe' ? `<div class="fints">${intentHTML(f.intent)}${intentHTML(f.leg)}</div>` : `<span class="ffear${f.stress ? '' : ' zero'}" title="Peur ${f.stress}/${STRESS_MAX}${f.nofear ? ' (ne connaît pas la peur)' : ''}"><i style="width:${f.stress / STRESS_MAX * 100}%"></i></span>`}
    <div class="fspr idle"><i class="fshadow"></i>${f.boss ? '<i class="faura"></i>' : ''}${img}${f.boss ? `<span class="fcrown">${gi('crown')}</span>` : ''}</div>
    <div class="finfo"><div class="fhp" title="${f.hp}/${f.max} PV"><i style="width:${k * 100}%"></i><em>${f.hp}/${f.max}</em>${f.block ? `<b class="fblk" title="Parade">${gi('shield')}${f.block}</b>` : ''}</div>
    <div class="fst">${stHTML(f.st)}</div><div class="fnm">${esc(f.name)}</div>
    ${f.side === 'foe' ? `${f.pow ? `<div class="fpow" title="${esc(f.pow.desc)}">${gi(f.pow.ik)} ${esc(f.pow.name)}</div>` : ''}${f.legN ? `<div class="fpow leg" title="${esc(`Chaque tour, en plus de son action : ${f.legN} action${f.legN > 1 ? 's' : ''} légendaire${f.legN > 1 ? 's' : ''}. À mi-vie : ${f.p2}`)}">${gi('bolt')} ${f.phase === 2 ? 'Fureur !' : 'Légendaire'}</div>` : ''}${elemBadges(f)}` : ''}</div></div>`;
}
function cardArtVM(v) {
  // l'illustration seule : rien n'est posé dessus (le type et le propriétaire sont sur la ligne du dessous)
  const ik = ICON_DRAW[v.ik] ? v.ik : 'spark', big = `<img class="kbigimg" alt="" src="${iconURL(ik)}">`;
  if (v.src === 'castle') { const k = FURN[v.art] ? v.art : DEFS[v.art] ? v.art : ''; return k ? `<img class="kimg" alt="" src="${thumb(FURN[k] ? 'furn' : 'def', k, true)}">` : big; }
  if (v.src === 'env' && ENV_CARDS[v.key]) { const [kd, k] = ENV_CARDS[v.key].prop; return `<img class="kimg" alt="" src="${thumb(kd, k, true)}">`; }
  if (v.src === 'sp' && CHAR[v.key]) return `<img class="kimg sp" alt="" src="${thumb('char', v.key, true)}">`;
  return big;
}
function cardHTML(v, opts = {}) {
  const el = ELEM[v.el], who = v.oname ? esc(v.oname) : v.src2 ? esc(v.src2) : v.src === 'env' ? 'Le décor' : '', mini = v.src !== 'sp' && CHAR[v.osp] ? `<img class="kmini" alt="" src="${thumb('char', v.osp)}">` : '';
  return `<button type="button" class="kcard k-${esc(v.kind)} s-${esc(v.src)}${v.why ? ' off' : ''}${opts.sel ? ' sel' : ''}${v.up ? ' up' : ''}${opts.drawn ? ' drawn' : ''}" ${opts.a ? `data-a="${opts.a}" data-v="${esc(String(opts.v))}"` : ''} ${opts.pressed != null ? `aria-pressed="${opts.pressed}"` : ''} data-uid="${esc(v.uid || '')}" style="${opts.drawn ? `animation-delay:${opts.drawn * 70}ms` : ''}" title="${esc(v.name + ' : ' + v.text + (v.why ? ' (' + v.why + ')' : ''))}">
    <span class="khead"><span class="kcost${v.cost > v.base ? ' more' : ''}">${+v.cost}</span><b class="kname"><span>${esc(v.name.replace(/ \+$/, ''))}</span></b></span><span class="kart">${cardArtVM(v)}</span>
    <span class="ktype">${mini}${esc(CARD_TYPE[v.kind] || '')}${el ? ` · ${gi(ELEM_IK[v.el])} ${esc(el[1])}` : ''}${v.ex ? `<span class="kex" title="Une fois par combat">${gi('hourglass')}</span>` : ''}</span>
    <span class="ktext">${esc(v.text)}</span><span class="kwho">${who}</span></button>`;
}
// un détail du décor, un peu à l'écart : rien ne dit qu'il cache quelque chose, sauf un reflet de temps en temps
function envSecretHTML(e) {
  const [kd, k] = e.prop || [], ok = (kd === 'furn' && FURN[k]) || (kd === 'x' && XDRAW[k]); if (!ok) return '';
  return `<button type="button" class="csecret${e.used ? ' found' : ''}" data-a="secret" data-v="${+e.i}" data-fid="env${+e.i}" style="left:${clamp(+e.x || 50, 5, 95)}%;bottom:${clamp(+e.y || 3, 0, 20)}%" aria-label="${e.used ? esc(e.name) : 'Un détail du décor'}" ${e.used ? 'disabled' : ''}><img alt="" src="${thumb(kd, k, true)}"><i class="glint" aria-hidden="true"></i></button>`;
}
function arenaHTML(vm, st = {}) {
  const sel = st.sel, tmode = sel && !st.enemy ? sel.tgt : null, foeT = tmode === 'enemy', allyT = tmode === 'ally' || tmode === 'ko';
  return `<div class="clog2">${(vm.log || []).map(e => `<p class="${e.c === 'good' ? 'good' : e.c === 'bad' ? 'bad' : ''}">${esc(e.t)}</p>`).join('')}</div>
    <div class="side party">${vm.party.map(f => figHTML(f, allyT && (tmode === 'ko' ? f.down : !f.down))).join('')}</div>
    ${(vm.env || []).map(envSecretHTML).join('')}
    <div class="side foes">${vm.foes.map(f => figHTML(f, foeT)).join('')}</div>
    ${vm.trap ? `<span class="ctrap" title="Piège tendu : le prochain ennemi qui attaque le prend">${gi('trap')} ${+vm.trap}</span>` : ''}${vm.decoy ? `<span class="ctrap dec" title="Un leurre attend la prochaine attaque">${gi('pumpkin')}</span>` : ''}`;
}
function handHTML(vm, p, st = {}) {
  const H = (vm.hands && vm.hands[p]) || [], seen = st.seen || new Set(); let n = 0;
  const others = (vm.names || []).map((nm, q) => q === p ? '' : `<span class="pready${vm.ready[q] ? ' on' : ''}" title="${vm.ready[q] ? 'a fini son tour' : 'joue encore'}">${gi(vm.ready[q] ? 'flag' : 'cards')} ${esc(nm)} · ${+(vm.nrg[q] || 0)}${gi('energy')} · ${((vm.hands || [])[q] || []).length} cartes</span>`).filter(Boolean).join('');
  return `<div class="hz-left"><div class="energy${vm.nrg[p] ? '' : ' empty'}" title="Énergie"><b>${+(vm.nrg[p] || 0)}</b><small>/${ENERGY}</small></div><div class="piles" title="Pioche · défausse · mises de côté"><span class="pile"><i class="kback"></i>${+vm.draw}</span><span class="pile disc"><i class="kback"></i>${+vm.disc}</span>${vm.exh ? `<span class="pile ex" title="Mises de côté">${gi('hourglass')}${+vm.exh}</span>` : ''}</div></div>
    <div class="hand">${H.map((c, i) => cardHTML(c, { a: st.enemy || st.done ? 'noop' : 'card', v: c.uid, sel: st.sel && st.sel.uid === c.uid, drawn: seen.has(c.uid) ? 0 : ++n })).join('') || '<p class="hint">Plus de cartes en main.</p>'}</div>
    <div class="hz-btns">${others ? `<div class="others">${others}</div>` : ''}${st.sel ? '<button type="button" class="sbtn" data-a="cancel">Annuler</button>' : ''}<button type="button" class="sbtn pri endturn" data-a="end" ${st.enemy || st.done ? 'disabled' : ''}>${gi('hourglass')} ${st.done ? 'On attend les autres' : 'Fin du tour'}</button>${st.host ? `<button type="button" class="sbtn" data-a="auto" aria-label="${st.auto ? 'Reprendre la main' : 'Combat auto'}">${gi('gear')}<span class="lbl">${st.auto ? ' Reprendre la main' : ' Combat auto'}</span></button><button type="button" class="sbtn danger" data-a="flee" aria-label="Fuir" ${st.enemy ? 'disabled' : ''} title="${st.boss ? 'Fuir le boss : tout le butin est perdu, mais l’équipe rentre entière' : 'Fuir : la moitié du butin reste au donjon'}">${gi('flag')}<span class="lbl"> Fuir</span></button>` : ''}</div>`;
}
function battleHTML(vm, p, st) {
  const sel = st.sel, info = st.enemy ? `${gi('hourglass')} Au tour des ennemis…` : st.done ? `${gi('hourglass')} Ton tour est fini : les autres Maîtres jouent encore.` : sel ? `<b>${esc(sel.name)}</b> : ${esc(sel.text)} ${['enemy', 'ally', 'ko'].includes(sel.tgt) ? `Choisis ${sel.tgt === 'enemy' ? 'un ennemi' : sel.tgt === 'ko' ? 'une alliée K.O.' : 'une alliée'}.` : 'Touche-la encore pour la jouer.'}` : st.info ? esc(st.info) : `Tour ${+vm.turn} · joue tes cartes (touche-les${typeof TOUCHUI !== 'undefined' && TOUCHUI.on ? '' : ', ou 1 à 9'}), puis « Fin du tour ». Au-dessus des ennemis : ce qu’ils vont faire.`;
  return `<section class="arena">${arenaHTML(vm, st)}</section><p class="cinfo" aria-live="polite">${info}</p><section class="handzone">${handHTML(vm, p, st)}</section>`;
}

/* ---------- les animations et les bruitages ---------- */
function crawlAnimator(body, page) {
  const figEl = id => id == null ? null : body.querySelector(`[data-fid="${CSS.escape(String(id))}"]`);
  const num = (id, text, c, ik) => { const f = figEl(id); if (!f) return; const n = el('span', 'fnum ' + c, `${ik ? gi(ik) : ''}${esc(text)}`); f.appendChild(n); setTimeout(() => n.remove(), 1000); };
  const pulse = (id, c, ms = 340) => { const f = figEl(id); if (!f) return; f.classList.remove(c); void f.offsetWidth; f.classList.add(c); setTimeout(() => f.classList.remove(c), ms); };
  const burst = (id, kind, n = 9) => { const f = figEl(id); if (!f || matchMedia('(prefers-reduced-motion: reduce)').matches) return; const box = el('span', 'fburst ' + kind, ''); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + Math.random() * .5, d = 26 + Math.random() * 28; box.insertAdjacentHTML('beforeend', `<i style="--dx:${(Math.cos(a) * d).toFixed(0)}px;--dy:${(Math.sin(a) * d - 10).toFixed(0)}px"></i>`); } f.appendChild(box); setTimeout(() => box.remove(), 800); };
  const slash = (id, heavy) => { const f = figEl(id); if (!f) return; const s = el('span', 'fslash' + (heavy ? ' heavy' : ''), '<svg viewBox="0 0 100 100" aria-hidden="true"><path d="M12 80 Q50 10 92 22" /></svg>'); f.appendChild(s); setTimeout(() => s.remove(), 420); };
  const quake = (big) => { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; page.classList.remove('quake', 'quake2'); void page.offsetWidth; page.classList.add(big ? 'quake2' : 'quake'); setTimeout(() => page.classList.remove('quake', 'quake2'), 450); };
  const banner2 = (html, cls = '', ms = 1100) => { const a = body.querySelector('.arena'); if (!a) return; const b = el('div', 'cturn ' + cls, html); a.appendChild(b); setTimeout(() => b.remove(), ms); };
  const ELC = { feu: 'fire', froid: 'ice', foudre: 'zap', tonnerre: 'zap', acide: 'acid', poison: 'acid', necrotique: 'dark', radiant: 'holy', force: 'holy', psychique: 'dark' };
  const play = async (evs, q = 1) => {
    for (const e of evs) {
      const x = e.fx; if (!x) continue;
      if (x.k === 'env' && x.secret) { pulse('env' + x.idx, 'reveal', 900); burst('env' + x.idx, 'holy', 14); banner2(`${gi('spark')} Un secret !<small>${esc(e.t.replace(/^Un secret ! /, ''))}</small>`, 'secret', 1500); sfx('secret'); await sleep(650 * q); continue; }
      if (x.k === 'card' || x.k === 'env') { if (x.from) pulse(x.from, 'lunge-r', 320); if (x.k === 'env') { pulse('env' + x.idx, 'shake', 400); burst('env' + x.idx, 'dust', 10); } const a = body.querySelector('.arena'); if (a) { const b = el('div', 'cplay', `${gi(ICON_DRAW[x.ik] ? x.ik : 'cards')} ${esc(e.t)}`); a.appendChild(b); setTimeout(() => b.remove(), 900); } sfx('play'); await sleep(190 * q); }
      else if (x.k === 'act') { if (x.from) pulse(x.from, 'lunge-l', 340); if (x.leg) { banner2(`${gi('bolt')} ${esc(e.t)}`, 'leg', 1000); sfx('boss'); await sleep(420 * q); } else if (x.elite) { banner2(`${gi('skull')} ${esc(e.t)}`, 'elite', 900); await sleep(300 * q); } await sleep(220 * q); }
      else if (x.k === 'hit' || x.k === 'hurt') {
        const big = (x.v || 0) >= 10; pulse(x.to, 'shake'); pulse(x.to, 'flash', 220);
        if (x.v) { slash(x.to, big); burst(x.to, ELC[x.el] || 'spark', big ? 12 : 8); }
        num(x.to, x.v ? `−${x.v}${x.eff === 'vuln' ? ' ×2' : ''}` : x.eff === 'imm' ? 'Immunisé' : '🛡️', x.eff === 'vuln' ? 'crit' : x.v ? 'dmg' : 'blk');
        if (x.eff === 'res') num(x.to, 'Résiste', 'info'); if (x.eff === 'vuln') num(x.to, 'Vulnérable !', 'crit2');
        sfx(!x.v ? 'block' : big ? 'heavy' : 'slash'); if (big || x.eff === 'vuln') quake(big && x.k === 'hurt'); await sleep((x.k === 'hurt' ? 280 : 160) * q);
      }
      else if (x.k === 'heal' || x.k === 'fheal') { num(x.to, `+${x.v}`, 'heal'); burst(x.to, 'heal', 8); sfx('heal'); await sleep(140 * q); }
      else if (x.k === 'block' || x.k === 'fblock') { if (x.v) { num(x.to, `+${x.v}`, 'blk', 'shield'); pulse(x.to, 'shield', 500); sfx('block'); } await sleep(100 * q); }
      else if (x.k === 'down' || x.k === 'ko') { pulse(x.to, 'fall', 650); burst(x.to, 'smoke', 12); num(x.to, x.k === 'ko' ? 'K.O.' : '', 'dmg', 'skull'); sfx(x.k === 'ko' ? 'ko' : 'foeko'); await sleep(300 * q); }
      else if (x.k === 'miss') { num(x.to, 'Raté !', 'info'); sfx('miss'); await sleep(160 * q); }
      else if (x.k === 'stun' || x.k === 'pstun') { if (x.to) { num(x.to, '', 'info', 'dizzy'); burst(x.to, 'star', 6); } sfx('stun'); await sleep(150 * q); }
      else if (x.k === 'weak') { num(x.to, '', 'info', 'down'); sfx('stun'); await sleep(90 * q); }
      else if (x.k === 'fear' || x.k === 'panic') { num(x.to, x.k === 'panic' ? 'Panique !' : `+${x.v}`, 'curse', 'fear'); burst(x.to, 'dark', 6); sfx('fear'); await sleep(120 * q); }
      else if (x.k === 'calm') { if (x.v) num(x.to, `−${x.v}`, 'heal', 'calm'); await sleep(80 * q); }
      else if (x.k === 'buff' || x.k === 'fbuff') { if (x.to) num(x.to, '', 'info', 'up'); sfx('buff'); await sleep(110 * q); }
      else if (x.k === 'poison') { if (x.to) { num(x.to, '', 'curse', 'poison'); burst(x.to, 'acid', 7); } sfx('poison'); await sleep(130 * q); }
      else if (x.k === 'summon' || x.k === 'rise' || x.k === 'revive' || x.k === 'loyal') { if (x.to) { num(x.to, '', 'info', x.k === 'summon' ? 'horn' : 'spark'); burst(x.to, 'holy', 10); } sfx(x.k === 'summon' ? 'horn' : 'heal'); await sleep(240 * q); }
      else if (x.k === 'steal' || x.k === 'loot') { if (x.to) num(x.to, '−', 'curse', 'purse'); sfx('coin'); await sleep(160 * q); }
      else if (x.k === 'energy') { sfx('energy'); await sleep(60 * q); }
      else if (x.k === 'shuffle') { sfx('shuffle'); await sleep(120 * q); }
      else if (x.k === 'phase') { pulse(x.to, 'fury-in', 900); quake(true); banner2(`${gi('bolt')} Fureur légendaire !<small>${esc(e.t)}</small>`, 'leg big', 2200); sfx('boss'); await sleep(1300 * q); }
    }
  };
  return { play, banner: banner2, quake, figEl };
}
// une carte jouée s'envole vers l'arène
function flyCard(btn, arena) {
  if (!btn || !arena || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const r = btn.getBoundingClientRect(), a = arena.getBoundingClientRect(), c = btn.cloneNode(true);
  c.classList.add('flying'); c.removeAttribute('data-a'); Object.assign(c.style, { position: 'fixed', left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', margin: 0, zIndex: 95, pointerEvents: 'none' });
  document.body.appendChild(c);
  const dx = a.left + a.width / 2 - (r.left + r.width / 2), dy = a.top + a.height * .35 - (r.top + r.height / 2);
  const an = c.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: `translate(${dx * .7}px,${dy * .7}px) scale(1.15) rotate(-4deg)`, opacity: 1, offset: .55 }, { transform: `translate(${dx}px,${dy}px) scale(.6)`, opacity: 0 }], { duration: 480, easing: 'cubic-bezier(.3,.7,.3,1)' });
  an.onfinish = () => c.remove(); setTimeout(() => c.remove(), 700);
}

/* ---------- la page d'expédition (elle recouvre tout le château) ---------- */
function openCrawlPage(dg) {
  let p = document.getElementById('crawlPage'); if (p) p.remove();
  p = el('div', `cpage intro theme-${dg}`, `<div class="cdecor" aria-hidden="true">${decorHTML(dg)}</div><header class="cp-top"></header><main class="cp-body"></main><button type="button" class="cp-snd" title="Son" aria-label="Activer ou couper le son">${gi(SND.on ? 'sound' : 'mute')}</button>`); p.id = 'crawlPage';
  p.setAttribute('role', 'dialog'); p.setAttribute('aria-modal', 'true'); p.setAttribute('aria-label', 'Expédition');
  $('#game').appendChild(p); document.body.classList.add('crawling'); setTimeout(() => p.classList.remove('intro'), 380);
  const onRs = () => { if (!p.isConnected) return removeEventListener('resize', onRs); if (p.classList.contains('battle')) crawlGround(p); }; addEventListener('resize', onRs);
  p.querySelector('.cp-snd').addEventListener('click', e => { toggleSound(); e.currentTarget.innerHTML = gi(SND.on ? 'sound' : 'mute'); if (SND.on) crawlAmbience(dg); else stopCrawlAmbience(); });
  crawlAmbience(dg);
  return p;
}
function closeCrawlPage() { stopCrawlAmbience(); const p = document.getElementById('crawlPage'); if (p) { p.classList.add('out'); setTimeout(() => p.remove(), 260); } document.body.classList.remove('crawling'); }
// les figurines tiennent debout sur le sol du décor : la ligne du fond (où se posent les accessoires) se cale
// un peu au-dessus de leurs pieds, quelle que soit la taille de l'écran
function crawlGround(page) {
  const fi = page && page.querySelector('.arena .side .finfo'); if (!fi) return;
  const hz = Math.round(page.getBoundingClientRect().bottom - fi.getBoundingClientRect().top + Math.min(46, page.clientHeight * .045));
  if (hz > 40 && Math.abs((page._hz || 0) - hz) > 3) { page._hz = hz; page.style.setProperty('--hz', hz + 'px'); }
}
const crawlHead = (top, o) => { const L = o.loot; morphHTML(top, `<span class="cp-emo">${gi(DG_IK[o.dg] || 'skull')}</span><div><h2>${esc(o.name)}</h2><span class="cp-meta">${o.meta ? esc(o.meta) : ''}${L ? ` · Butin : ${gi('gold')}${+L.g || 0}${L.s ? ` ${gi('mat')}${+L.s}` : ''}${L.n ? ` ${gi('gift')}${+L.n}` : ''}` : ''}${(o.relics || []).filter(k => RELICS[k]).map(k => ` <span class="relic" title="${esc(RELICS[k].name + ' : ' + RELICS[k].desc)}">${gi(RELIC_IK[k])}</span>`).join('')}</span></div>`); };

/* ---------- l'expédition, jouée à l'écran (par l'hôte, à plusieurs si le château est partagé) ---------- */
let CRAWL_LIVE = null;
// SCN : un autre scénario qui réutilise cet écran (les invasions du château, p69) : il fournit ses salles, ses combats et sa fin
async function runCrawl(report, SCN) {
  if (!SCN && !S.raid) return;
  const key = SCN ? null : S.raid.target, tg = SCN ? { name: SCN.name, emo: SCN.emo } : RAIDS[key], dg = SCN ? SCN.dg : crawlDgOf(key), team = SCN ? SCN.team : S.raid.team.map(critter).filter(Boolean), DG = SCN ? { desc: SCN.desc || '' } : CRAWL_DG[dg];
  if (!SCN && (!team.length || !DG)) { S.raid = null; return; }
  const emo = tg.emo || DG.emo || '🏰', lines = [];
  // les Maîtres présents : l'hôte, puis les invités du château partagé
  const coop = !SCN && typeof COOP !== 'undefined' && COOP.role === 'host' && COOP.peers.size > 0, players = coop ? [COOP.me.id, ...[...COOP.peers.keys()].slice(0, 4)] : ['moi'];
  const names = coop ? [COOP.me.name, ...players.slice(1).map(id => (COOP.peers.get(id) || {}).name || 'Maître')] : [];
  const page = openCrawlPage(dg), top = page.querySelector('.cp-top'), body = page.querySelector('.cp-body'), A = crawlAnimator(body, page);
  page.classList.toggle('coop', coop);
  const ui = { pending: null, auto: false, touch: false, inbox: [], phase: null, secretReq: null };
  const wait = () => new Promise(res => { ui.pending = res; if (ui.inbox.length) { const m = ui.inbox.shift(); ui.pending = null; res(m); } });
  const send = v => { const p = ui.pending; if (p) { ui.pending = null; p(v); } else ui.inbox.push(v); };
  page.addEventListener('pointerdown', e => { ui.touch = e.pointerType !== 'mouse'; });
  page.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return;
    const now = performance.now(), quick = now - (ui.lastTap || 0) < 400; ui.lastTap = now;
    if (quick && (b.closest('.cp-foot') || b.dataset.a === 'retreat')) return;   // un double toucher ne vaut pas deux choix (le 2e tombait sur « Rentrer au château » de l'écran suivant)
    if (b.dataset.a === 'secret') { if (ui.pending) send({ a: 'secret', v: b.dataset.v, p: 0 }); else if (ui.phase === 'players') ui.secretReq = { p: 0, v: b.dataset.v }; return; }
    if (b.dataset.a === 'auto' && !ui.pending) { ui.auto = !ui.auto; sfx('tick'); b.innerHTML = ui.auto ? '⏸️<span class="lbl"> Reprendre la main</span>' : '🤖<span class="lbl"> Combat auto</span>'; return; }
    send({ a: b.dataset.a, v: b.dataset.v, p: 0, btn: b });
  });
  const onKey = e => {
    if (!ui.pending) return;
    const cards = [...page.querySelectorAll('.hand [data-a="card"]')];
    if (/^[1-9]$/.test(e.key) && cards[+e.key - 1]) { e.preventDefault(); send({ a: 'card', v: cards[+e.key - 1].dataset.v, p: 0, btn: cards[+e.key - 1] }); }
    else if ((e.key === 'e' || e.key === 'E') && page.querySelector('[data-a="end"]:not([disabled])')) { e.preventDefault(); send({ a: 'end', p: 0 }); }
    else if (e.key === 'Escape' && page.querySelector('[data-a="cancel"]')) { e.preventDefault(); send({ a: 'cancel', p: 0 }); }
  };
  document.addEventListener('keydown', onKey);
  // les actions des invités arrivent ici
  CRAWL_LIVE = { onGuest: (peerId, m) => { const p = players.indexOf(peerId); if (p <= 0) return; if (m.a === 'secret' && !ui.pending) { if (ui.phase === 'players') ui.secretReq = { p, v: String(m.v || '0') }; return; } send({ a: String(m.a || ''), v: String(m.v || ''), tv: String(m.tv || ''), p }); } };
  const cast = (o) => { if (coop) coopSend({ t: 'cw', dg, players, names, head: headObj(), ...o }); };
  let R = null;
  const headMeta = () => SCN ? SCN.meta() : R ? `Niveau ${String(R.lvl).replace('.', ',')}${coop ? ` · ${players.length} Maîtres` : ''} · ${R.floor > CRAWL_FLOORS ? 'le boss' : `étage ${R.floor}/${CRAWL_FLOORS}, salle ${R.step + 1}/${CRAWL_STEPS}`}` : 'Avant de partir';
  const headObj = () => ({ dg, name: tg.name, meta: headMeta(), loot: R ? { g: R.loot.g, s: R.loot.s, n: R.loot.items.length } : null, relics: S.relics || [] });
  const head = () => crawlHead(top, headObj());
  const waitCast = text => cast({ view: 'wait', text, party: R ? R.party.map(o => figVM(null, o, 'ally')) : [] });
  const partyRow = () => `<div class="cparty">${R.party.map(o => figHTML(figVM(null, o, 'ally'), false)).join('')}</div>`;
  page.classList.remove('battle');

  // 1. le sac : quelles cartes du château emporter ?
  const pool = SCN ? [] : castlePool(); let bag = crawlAutoBag(pool);
  if (pool.length > BAG_SIZE) {
    const pick0 = new Set(bag);
    waitCast(`${names[0] || 'L’hôte'} remplit le sac de l’expédition…`);
    for (;;) {
      head();
      body.innerHTML = `<div class="cmap"><p class="cmsg2">${esc(DG.desc)}</p>
        <h3>${gi('bag')} Le sac : choisis ${BAG_SIZE} cartes du château (${pick0.size}/${BAG_SIZE})</h3>
        <p class="hint cp-hint">Chaque créature apporte deux Frappes, une Parade et la carte de son espèce. Le reste vient de ton château : tes meubles et tes pièges (un meuble de qualité donne sa carte améliorée ✦). Après chaque combat gagné, tu pourras ajouter une carte au deck.</p>
        <div class="cdeck">${pool.map(k => cardHTML(cardVM(null, newCard('castle', k, null, castleUp(k)), 0, null), { a: 'bag', v: k, pressed: pick0.has(k) })).join('')}</div>
        <div class="btnrow cp-foot"><button type="button" class="sbtn pri" data-a="go" ${pick0.size ? '' : 'disabled'}>${gi('door')} Partir avec ce sac</button></div></div>`;
      const ch = await wait(); if (ch.p) continue;
      if (ch.a === 'go') break;
      if (ch.a === 'bag' && CASTLE_CARDS[ch.v]) { if (pick0.has(ch.v)) pick0.delete(ch.v); else if (pick0.size < BAG_SIZE) pick0.add(ch.v); else { pick0.delete([...pick0][0]); pick0.add(ch.v); } sfx('draw'); }
    }
    bag = [...pick0];
  }
  R = SCN ? SCN.R : crawlNew(dg, team, { bag, np: players.length });

  // 2. la carte du donjon : où aller ?
  const track = () => { if (SCN) return SCN.track ? SCN.track() : ''; const out = []; for (let f = 1; f <= CRAWL_FLOORS; f++) for (let s = 0; s < CRAWL_STEPS; s++) { const i = (f - 1) * CRAWL_STEPS + s, done = i < R.path.length, cur = i === R.path.length && R.floor <= CRAWL_FLOORS; out.push(`<span class="st${done ? ' done' : ''}${cur ? ' cur' : ''}" title="Étage ${f}, salle ${s + 1}">${done ? gi(NODE_IK[R.path[i]]) : cur ? '?' : ''}</span>${s === CRAWL_STEPS - 1 ? '<i class="sep"></i>' : ''}`); } out.push(`<span class="st boss${R.floor > CRAWL_FLOORS ? ' cur' : ''}" title="Le boss">${gi('crown')}</span>`); return `<div class="ctrack">${out.join('')}</div>`; };
  const NODE_TXT = { combat: 'Des ennemis, un peu de butin, une carte à gagner.', elite: 'Un ennemi d’élite et sa capacité redoutable : beau butin, belle carte.', tresor: 'De l’or, peut-être un sticker.', repos: 'Soigner, se calmer, ou aiguiser une carte.', event: 'Une rencontre étrange : un choix à faire.' };
  const mapView = msg => {
    head(); page.classList.remove('battle');
    const B0 = CRAWL_EN[DG.boss];
    body.innerHTML = `<div class="cmap">${track()}<p class="cmsg2">${msg || esc(DG.desc)}</p>${partyRow()}
      <h3>${R.floor > CRAWL_FLOORS ? 'Le boss vous attend' : 'Où aller ?'}</h3>${R.floor > CRAWL_FLOORS ? `<p class="cmsg2 warn">⚠️ ${esc(B0.name)} est redoutable. Terrassée, l’équipe ne rapporte qu’un quart du butin (${R.loot.g} 💰 en jeu) ; rentrer maintenant garde tout${CRAWL_DG[R.dg] && !CRAWL_DG[R.dg].site && typeof RIVALS !== 'undefined' && RIVALS.some(r => r.id === R.dg) ? ', et compte déjà 1 point contre ce rival' : ''}.</p>` : ''}
      <div class="cnodes2">${R.choices.map((c, i) => `<button type="button" class="cnode2${c.k === 'boss' ? ' boss' : ''}" data-a="go" data-v="${i}">${gi(NODE_IK[c.k], 'big')}<b>${NODES[c.k].name}</b><small>${c.k === 'boss' ? `${esc(B0.name)}. Chaque tour, une action légendaire en plus ; à mi-vie, la fureur. Vaincu, il rapporte gros, et une relique.` : NODE_TXT[c.k]}</small></button>`).join('')}</div>
      <div class="btnrow cp-foot"><button type="button" class="sbtn" data-a="deck">${gi('cards')} Le deck (${R.deck.length})</button><button type="button" class="sbtn" data-a="retreat">${gi('door')} Rentrer au château avec le butin</button></div></div>`;
    waitCast(`${names[0] || 'L’hôte'} choisit la prochaine salle…`);
  };
  const deckView = async (title, pickable) => {
    head();
    body.innerHTML = `<div class="cmap"><h3>${title}</h3><div class="cdeck">${R.deck.map((c, i) => cardHTML(cardVM(null, c, 0, R), { a: pickable && !c.up ? 'pick' : 'noop', v: i })).join('')}</div>
      <div class="btnrow cp-foot"><button type="button" class="sbtn" data-a="back">${pickable ? 'Ne rien aiguiser' : 'Retour'}</button></div></div>`;
    for (;;) { const ch = await wait(); if (ch.p) continue; if (ch.a === 'back') return null; if (ch.a === 'pick' && pickable) { const c = R.deck[+ch.v]; if (c && !c.up) return c; } }
  };
  const panel = async (text, buttons) => { head(); body.innerHTML = `<div class="cmap">${track()}<p class="cmsg2">${text}</p>${partyRow()}<div class="cnodes2">${buttons.map(([a, v, label, sub]) => `<button type="button" class="cnode2 small" data-a="${a}" data-v="${v}"><b>${label}</b>${sub ? `<small>${sub}</small>` : ''}</button>`).join('')}</div></div>`; for (;;) { const ch = await wait(); if (!ch.p) return ch; } };
  const rewardView = async kind => {
    const offer = crawlRewards(R, 3); if (!offer.length) return null;
    head();
    body.innerHTML = `<div class="cmap"><h3>${gi(kind === 'elite' ? 'skull' : 'trophy')} ${kind === 'elite' ? 'Élite vaincue !' : 'Victoire !'} Une carte pour le deck ?</h3><p class="hint cp-hint">Elle rejoint ta pioche pour la suite de l’expédition. Un deck plus gros, c’est aussi tes meilleures cartes moins souvent en main.</p>
      <div class="cdeck">${offer.map((c, i) => cardHTML(cardVM(null, c, 0, R), { a: 'rw', v: i })).join('')}</div>
      <div class="btnrow cp-foot"><button type="button" class="sbtn" data-a="skip">Passer</button></div></div>`;
    waitCast(`${names[0] || 'L’hôte'} choisit une carte pour le deck…`);
    for (;;) { const ch = await wait(); if (ch.p) continue; if (ch.a === 'skip') return null; if (ch.a === 'rw') { const c = offer[+ch.v]; if (c) { R.deck.push(c); sfx('chime'); return c; } } }
  };

  // 3. le combat : l'arène en haut, les mains en bas
  const fight = async (kind, foesIn, onB) => {
    const B = crawlBattle(R, foesIn || crawlFoes(R, kind)); if (onB) onB(B); ui.auto = !!ui.autoNext; ui.autoNext = false; ui.autoWarned = false; page.classList.add('battle');
    const st = { sel: null, info: '', seen: new Set(), host: true, boss: kind === 'boss' }, ready = Array(B.np).fill(false);
    let sentEv = 0, castT = null;
    const vmNow = enemy => battleVM(B, { p: 0, ready, names });
    const castBattle = (enemy, extra = {}) => { if (!coop) return; clearTimeout(castT); castT = setTimeout(() => { const vm = vmNow(enemy); cast({ view: 'battle', vm, ev: B.ev.slice(sentEv).map(e => ({ t: e.t, cls: e.cls, fx: e.fx })), enemy: !!enemy, ...extra }); sentEv = B.ev.length; }, 60); };
    const render = (enemy) => {
      head(); const vm = vmNow(enemy), selV = st.sel ? (st.sel.env != null ? { ...vm.env[st.sel.env], env: st.sel.env } : vm.hands[0].find(c => c.uid === st.sel.uid)) : null;
      morphHTML(body, battleHTML(vm, 0, { ...st, sel: selV, enemy, done: ready[0] && !enemy, auto: ui.auto })); crawlGround(page);
      vm.hands[0].forEach(c => st.seen.add(c.uid));
    };
    const doPlay = async (p, c, t, btn) => { const n1 = B.ev.length; if (btn && p === 0) flyCard(btn, body.querySelector('.arena')); const ok = c.env != null ? B.playEnv(c.env, t, p) : B.play(c, t, p); if (!ok) return; st.sel = null; render(); castBattle(false); await A.play(B.ev.slice(n1), ui.auto ? .5 : 1); };
    const doSecret = async (p, i) => { const e = B.env[i]; if (!e || e.used || B.over) return; const n1 = B.ev.length; if (!B.playEnv(i, null, p)) return; st.sel = null; render(); castBattle(false); await A.play(B.ev.slice(n1), 1); };
    // l'entrée du boss
    const boss = B.foesL.find(f => f.boss);
    render(); castBattle(false);
    if (boss) { A.figEl(boss.uid) && A.figEl(boss.uid).classList.add('enter'); sfx('boss'); A.banner(`${gi('crown')} ${esc(boss.name)}<small>Actions légendaires · fureur à mi-vie</small>`, 'leg big', 2000); A.quake(true); await sleep(1500); }
    else if (B.foesL.some(f => f.elite)) { const e = B.foesL.find(f => f.elite), P = ELITE_POW[e.pow]; A.banner(`${gi('skull')} ${esc(e.name)}${P ? `<small>${gi(POW_IK[e.pow])} ${esc(P.name)} : ${esc(powDesc(e.pow))}</small>` : ''}`, 'elite big', 1700); sfx('horn'); await sleep(1000); }
    for (let turn = 0; turn < 60 && !B.over; turn++) {
      const n0 = B.ev.length; B.startTurn(); st.sel = null; ready.fill(false); ui.phase = 'players'; ui.secretReq = null;
      if (ui.auto && !ui.autoWarned && B.party.reduce((a, c) => a + (c.ko ? 0 : c.hp / c.max), 0) / B.party.length < .45) { ui.auto = false; ui.autoWarned = true; st.info = '⚠️ Ça tourne mal : le combat auto te rend la main.'; }   // une fois par combat
      players.forEach((id, p) => { if (p > 0 && !COOP.peers.has(id)) ready[p] = true; });   // un Maître parti ne bloque personne
      render(); castBattle(false); A.banner(`${gi('swords')} Tour ${B.turn}${coop ? ' — à vous !' : ' — à toi !'}`, 'mine', 900); sfx('turn'); await A.play(B.ev.slice(n0), 1); if (B.over) break;
      // le tour des Maîtres : chacun joue sa main ; on passe aux ennemis quand tout le monde a fini
      for (let guard = 0; guard < 400 && !B.over && !ready.every(Boolean); guard++) {
        if (ui.secretReq) { const q = ui.secretReq; ui.secretReq = null; await doSecret(q.p, +q.v || 0); continue; }
        if (ui.auto && !ready[0]) { const o = crawlAutoPick(B, 0); if (o) { await doPlay(0, o.env != null ? { env: o.env } : o.c, o.t, null); continue; } ready[0] = true; render(); castBattle(false); continue; }
        render(); const ch = await wait(); st.info = '';
        const p = ch.p || 0; if (p >= B.np) continue;
        if (ch.a === 'auto' && p === 0) { ui.auto = true; st.sel = null; continue; }
        if (ch.a === 'end') { ready[p] = true; sfx('tick'); render(); castBattle(false); continue; }
        if (ch.a === 'flee' && p === 0) { B.flee(); break; }
        if (ch.a === 'cancel') { if (p === 0) st.sel = null; continue; }
        if (ch.a === 'secret') { await doSecret(p, +ch.v || 0); continue; }
        if (ready[p]) continue;
        // une carte (ou le décor) : les invités envoient tout d'un coup, l'hôte peut viser en deux temps
        const pickCard = () => ch.a === 'env' ? (B.env[+ch.v] ? { env: +ch.v, D: cardDef(B.env[+ch.v].c) } : null) : (() => { const c = B.hands[p].find(x => x.uid === ch.v); return c ? { c, D: cardDef(c) } : null; })();
        if (ch.a === 'card' || ch.a === 'env') {
          const o = pickCard(); if (!o) continue;
          const why = o.env != null ? B.envWhy(o.env, p) : B.why(o.c, p); if (why) { if (p === 0) { st.info = `🚫 ${o.D.name} : ${why}.`; sfx('bad'); } continue; }
          const T = o.env != null ? (o.D.tgt === 'enemy' ? B.foes() : o.D.tgt === 'ally' ? B.mates() : []) : B.targets(o.c), needT = ['enemy', 'ally', 'ko'].includes(o.D.tgt);
          if (p > 0) { const t = B.foesL.find(f => f.uid === ch.tv) || B.party.find(x => x.id === ch.tv) || T[0]; await doPlay(p, o.env != null ? { env: o.env } : o.c, t, null); continue; }
          const same = st.sel && (o.env != null ? st.sel.env === o.env : st.sel.uid === o.c.uid);
          if (same && (!needT || T.length === 1)) { await doPlay(0, o.env != null ? { env: o.env } : o.c, T[0] || null, ch.btn); continue; }
          if (same) { st.sel = null; continue; }
          if (needT && !(T.length === 1 && !ui.touch)) { st.sel = o.env != null ? { env: o.env } : { uid: o.c.uid }; continue; }
          if (ui.touch) { st.sel = o.env != null ? { env: o.env } : { uid: o.c.uid }; continue; }   // au doigt : on la montre d'abord
          await doPlay(0, o.env != null ? { env: o.env } : o.c, T[0] || null, ch.btn); continue;
        }
        if (ch.a === 'tg' && p === 0 && st.sel) {
          const t = B.foesL.find(f => f.uid === ch.v) || B.party.find(x => x.id === ch.v); if (!t) continue;
          const c = st.sel.env != null ? { env: st.sel.env } : B.hands[0].find(x => x.uid === st.sel.uid); if (!c) { st.sel = null; continue; }
          await doPlay(0, c, t, page.querySelector('.kcard.sel, .envo.sel')); continue;
        }
      }
      ui.phase = 'foes'; ui.secretReq = null;
      if (B.over) break;
      // la main part à la défausse, puis le tour des ennemis, un par un
      page.querySelectorAll('.hand .kcard').forEach((k, i) => { k.style.animationDelay = `${i * 40}ms`; k.classList.add('toss'); }); sfx('draw');
      await sleep(ui.auto ? 120 : 280);
      B.endTurn(); render(true); castBattle(true); A.banner(`${gi('skull')} Tour des ennemis`, 'foe', 800); sfx('eturn'); await sleep(ui.auto ? 250 : 650);
      B.enemyStart();
      for (const f of B.queue) { if (B.over) break; const n1 = B.ev.length; B.enemyAct(f); render(true); castBattle(true); await A.play(B.ev.slice(n1), ui.auto ? .5 : 1); await sleep(ui.auto ? 60 : 180); }
      B.enemyEnd();
    }
    ui.phase = null; ui.secretReq = null;
    R.party.forEach(c => { c.block = 0; c.st = {}; });
    const res = B.over || 'lost';
    if (res === 'won') { A.banner(`${gi('trophy')} Victoire !`, 'win big', 1600); sfx('victory'); A.figEl && body.querySelectorAll('.fig.ally:not(.down) .fspr').forEach(x => x.classList.add('cheer')); }
    else if (res === 'lost') { A.banner(`${gi('skull')} Terrassés…`, 'lose big', 1800); sfx('defeat'); }
    castBattle(false, { result: res }); await sleep(1500);
    return res;
  };

  // 4. la boucle des salles (ou le scénario qui a emprunté l'écran)
  let msg = null;
  if (SCN) {
    try { await SCN.run({ page, body, top, A, head, fight, partyRow, wait, ui, setR: r => { R = r; }, getR: () => R }); }
    finally { CRAWL_LIVE = null; document.removeEventListener('keydown', onKey); closeCrawlPage(); }
    return;
  }
  for (;;) {
    mapView(msg); msg = null; const ch = await wait(); if (ch.p) continue;
    if (ch.a === 'deck') { await deckView(`🃏 Le deck de l’expédition (${R.deck.length} cartes)`, false); continue; }
    if (ch.a === 'retreat') { R.done = 'retreat'; break; }
    const node = R.choices[+ch.v]; if (!node) continue; R.path.push(node.k); sfx('tick');
    if (['combat', 'elite', 'boss'].includes(node.k)) {
      const res = await fight(node.k);
      page.classList.remove('battle');
      if (res === 'fled') { R.done = 'fled'; const k = .5; R.loot.g = Math.floor(R.loot.g * k); R.loot.s = Math.floor(R.loot.s * k); if (R.fledBoss) R.loot.items = []; break; }
      if (res !== 'won') { R.done = 'wipe'; break; }
      const t = crawlWinLoot(R, node.k); sfx('coin');
      if (node.k === 'boss') { R.done = 'boss'; break; }
      const got = await rewardView(node.k);
      msg = `Victoire ! ${esc(t)}${got ? ` Nouvelle carte : ${esc(cardName(got))}.` : ''}`;
    } else if (node.k === 'tresor') { msg = esc(crawlTreasure(R)); sfx('coin'); }
    else if (node.k === 'repos') {
      waitCast('Un feu de camp : on souffle un peu…');
      const c2 = await panel(`${gi('campfire')} Un coin tranquille pour souffler. Que faire ?`, [['rest', 'heal', `${gi('heart', 'big')} Se soigner`, '+30 % des PV pour toute l’équipe'], ['rest', 'calm', `${gi('calm', 'big')} Se calmer`, '−4 de peur pour toutes'], ['rest', 'up', `${gi('anvil', 'big')} Aiguiser une carte`, 'elle devient plus forte (+)']]);
      if (c2.v === 'up') { const c = await deckView(`${gi('anvil')} Quelle carte aiguiser ?`, true); msg = esc(c ? crawlRest(R, 'up', c) : 'On repart sans rien aiguiser.'); } else { msg = esc(crawlRest(R, c2.v)); sfx('heal'); }
    }
    else { const E = pick(CRAWL_EVENTS); waitCast(E.t); const c2 = await panel(`${gi('question')} ${esc(E.t)}`, E.a.map((a, i) => ['ev', i, esc(a[0]), a[2] ? esc(a[2]) : ''])); msg = esc(E.a[+c2.v][1](R)); }
    crawlAdvance(R);
  }
  // 5. le retour
  crawlApply(R, team, lines); crawlVictory(dg, R, lines); crawlSiteResult(key, R, team, lines);
  head(); page.classList.remove('battle');
  body.innerHTML = `<div class="cmap"><h2 class="cp-end">${gi(R.done === 'boss' ? 'crown' : R.done === 'wipe' ? 'skull' : 'door')} ${R.done === 'boss' ? 'Victoire !' : R.done === 'wipe' ? 'Terrassés…' : 'Retour au château'}</h2><ul class="chron">${lines.map(([e, t, tone]) => `<li class="${tone}"><span class="emo">${iconize(e)}</span><span>${iconize(esc(t))}</span></li>`).join('')}</ul><div class="btnrow cp-foot"><button type="button" class="sbtn pri" data-a="end">Rentrer</button></div></div>`;
  sfx(R.done === 'wipe' ? 'defeat' : 'victory');
  cast({ view: 'end', text: lines[0] ? lines[0][1] : '' });
  for (;;) { const ch = await wait(); if (!ch.p && ch.a === 'end') break; }
  CRAWL_LIVE = null; document.removeEventListener('keydown', onKey); closeCrawlPage();
  report.push([emo, `Expédition dans ${tg.name} (niveau ${String(R.lvl).replace('.', ',')}) : ${R.done === 'boss' ? 'le boss est vaincu !' : R.done === 'wipe' ? 'l’équipe est terrassée.' : R.done === 'fled' ? 'fuite, la moitié du butin perdue.' : 'retour avec le butin.'}`, R.done === 'wipe' || R.done === 'fled' ? 'bad' : 'good']);
  lines.forEach(l => report.push(l));
  addLog(`Expédition : ${tg.name}.`, R.done === 'wipe' ? 'bad' : 'good');
}

/* ---------- chez un invité du château partagé : il voit l'expédition et joue sa main ---------- */
const CRAWL_G = { page: null, dg: null, p: -1, sel: null, seen: new Set(), vm: null, anim: null, queue: Promise.resolve() };
function crawlGuest(m) {
  if (!m || typeof m !== 'object' || !CRAWL_DG[m.dg]) return;
  if (m.view === 'end') { if (CRAWL_G.page) { CRAWL_G.page.querySelector('.cp-body').innerHTML = `<div class="cmap"><h2 class="cp-end">${gi('flag')} Fin de l’expédition</h2><p class="cmsg2">${esc(plain(m.text || ''))}</p><div class="btnrow cp-foot"><button type="button" class="sbtn pri" data-g="close">Rentrer</button></div></div>`; } return; }
  if (!CRAWL_G.page || !document.getElementById('crawlPage')) {
    CRAWL_G.page = openCrawlPage(m.dg); CRAWL_G.dg = m.dg; CRAWL_G.seen = new Set(); CRAWL_G.sel = null; CRAWL_G.anim = crawlAnimator(CRAWL_G.page.querySelector('.cp-body'), CRAWL_G.page);
    CRAWL_G.page.addEventListener('click', crawlGuestClick);
  }
  CRAWL_G.p = Array.isArray(m.players) ? m.players.indexOf(COOP.me.id) : -1;
  const page = CRAWL_G.page, body = page.querySelector('.cp-body'), h = m.head || {};
  crawlHead(page.querySelector('.cp-top'), { dg: m.dg, name: plain(String(h.name || 'Expédition')).slice(0, 60), meta: plain(String(h.meta || '')).slice(0, 160), loot: h.loot ? { g: +h.loot.g || 0, s: +h.loot.s || 0, n: +h.loot.n || 0 } : null, relics: Array.isArray(h.relics) ? h.relics : [] });
  if (m.view === 'wait') {
    page.classList.remove('battle'); CRAWL_G.vm = null;
    const party = Array.isArray(m.party) ? m.party.slice(0, 4) : [];
    body.innerHTML = `<div class="cmap"><p class="cmsg2">${gi('hourglass')} ${esc(plain(String(m.text || '')).slice(0, 200))}</p><div class="cparty">${party.map(f => figHTML(crawlSafeFig(f, 'ally'), false)).join('')}</div><p class="hint cp-hint">Pendant les combats, tu joues tes propres cartes.</p></div>`;
    return;
  }
  if (m.view === 'battle' && m.vm && CRAWL_G.p >= 0) {
    page.classList.add('battle');
    const vm = crawlSafeVM(m.vm), p = CRAWL_G.p;
    CRAWL_G.queue = CRAWL_G.queue.then(async () => {
      CRAWL_G.vm = vm;
      if (CRAWL_G.sel && !((vm.hands[p] || []).some(c => c.uid === CRAWL_G.sel.uid) || (CRAWL_G.sel.env != null && vm.env[CRAWL_G.sel.env] && !vm.env[CRAWL_G.sel.env].used))) CRAWL_G.sel = null;
      crawlGuestRender(!!m.enemy);
      const evs = (Array.isArray(m.ev) ? m.ev : []).slice(-40).map(e => ({ t: plain(String(e.t || '')).slice(0, 200), fx: e.fx && typeof e.fx === 'object' ? e.fx : null }));
      await CRAWL_G.anim.play(evs, .8);
      if (m.result === 'won') { CRAWL_G.anim.banner('🏆 Victoire !', 'win big', 1600); sfx('victory'); }
      else if (m.result === 'lost') { CRAWL_G.anim.banner('💀 Terrassés…', 'lose big', 1800); sfx('defeat'); }
    });
  }
}
const crawlSafeFig = (f, side) => ({ id: String(f.id || '').slice(0, 40), side, name: plain(String(f.name || '')).slice(0, 40), sp: safeKey(CHAR, f.sp), k: safeKey(CRAWL_EN, f.k), emo: String(f.emo || '').slice(0, 8), hp: +f.hp || 0, max: Math.max(1, +f.max || 1), block: +f.block || 0, stress: clamp(+f.stress || 0, 0, STRESS_MAX), down: !!f.down, boss: !!f.boss, elite: !!f.elite, phase: +f.phase || 1, st: (Array.isArray(f.st) ? f.st : []).slice(0, 9).filter(x => Array.isArray(x) && ICON_DRAW[x[0]]).map(([k, n, t]) => [k, String(n == null ? '' : n).slice(0, 4), plain(String(t || '')).slice(0, 40)]), stunned: !!f.stunned,
  intent: f.intent ? crawlSafeInt(f.intent) : null, leg: f.leg ? crawlSafeInt(f.leg) : null, pow: (() => { const k = f.pow && Object.keys(ELITE_POW).find(x => ELITE_POW[x].name === f.pow.name); return k ? { ik: POW_IK[k], name: ELITE_POW[k].name, desc: powDesc(k) } : null; })(), legN: clamp(+f.legN || 0, 0, 3), p2: plain(String(f.p2 || '')).slice(0, 160),
  vuln: (f.vuln || []).filter(e => ELEM[e]), res: (f.res || []).filter(e => ELEM[e]), imm: (f.imm || []).filter(e => ELEM[e]), nofear: !!f.nofear });
const crawlSafeInt = I => ({ ik: ICON_DRAW[I.ik] ? I.ik : 'question', num: plain(String(I.num || '')).slice(0, 20), tgt: plain(String(I.tgt || '')).slice(0, 30), cls: ['hurt', 'curse', 'calm'].includes(I.cls) ? I.cls : 'calm', leg: !!I.leg, special: !!I.special, name: plain(String(I.name || '')).slice(0, 40), el: ELEM[I.el] ? I.el : '', title: plain(String(I.title || '')).slice(0, 160) });
function crawlSafeVM(v) {
  const card = c => ({ uid: String(c.uid || '').slice(0, 20), src: ['base', 'sp', 'castle', 'env'].includes(c.src) ? c.src : 'base', key: String(c.key || '').slice(0, 20), up: !!c.up, name: plain(String(c.name || '')).slice(0, 50), ik: ICON_DRAW[c.ik] ? c.ik : 'spark', cost: clamp(+c.cost || 0, 0, 9), base: clamp(+c.base || 0, 0, 9), text: plain(String(c.text || '')).slice(0, 300), why: plain(String(c.why || '')).slice(0, 80), kind: ['atk', 'def', 'heal', 'skill'].includes(c.kind) ? c.kind : 'skill', el: ELEM[c.el] ? c.el : '', ex: !!c.ex, tgt: ['enemy', 'ally', 'ko', 'allies', 'allfoes', 'rnd', 'self', 'none'].includes(c.tgt) ? c.tgt : 'none', osp: safeKey(CHAR, c.osp), oname: plain(String(c.oname || '')).slice(0, 30), src2: plain(String(c.src2 || '')).slice(0, 40), art: safeKey(FURN, c.art) || safeKey(DEFS, c.art) });
  return { turn: +v.turn || 1, np: clamp(+v.np || 1, 1, 5), party: (v.party || []).slice(0, 4).map(f => crawlSafeFig(f, 'ally')), foes: (v.foes || []).slice(0, 6).map(f => crawlSafeFig(f, 'foe')),
    hands: (v.hands || []).slice(0, 5).map(H => (H || []).slice(0, 10).map(card)), nrg: (v.nrg || []).slice(0, 5).map(x => clamp(+x || 0, 0, 20)), draw: +v.draw || 0, disc: +v.disc || 0, exh: +v.exh || 0, trap: +v.trap || 0, decoy: +v.decoy || 0,
    env: (v.env || []).slice(0, 2).map((e, i) => ({ i, key: safeKey(ENV_CARDS, e.key), used: !!e.used, name: plain(String(e.name || '')).slice(0, 60), prop: ENV_CARDS[e.key] ? ENV_CARDS[e.key].prop : null, x: clamp(+e.x || 50, 5, 95), y: clamp(+e.y || 3, 0, 20) })),
    log: (v.log || []).slice(-3).map(e => ({ t: plain(String(e.t || '')).slice(0, 160), c: e.c === 'good' || e.c === 'bad' ? e.c : '' })), ready: (v.ready || []).slice(0, 5).map(Boolean), names: (v.names || []).slice(0, 5).map(n => plain(String(n || '')).slice(0, 24)) };
}
function crawlGuestRender(enemy) {
  const vm = CRAWL_G.vm, p = CRAWL_G.p; if (!vm) return;
  const body = CRAWL_G.page.querySelector('.cp-body'), H = vm.hands[p] || [], s = CRAWL_G.sel;
  const selV = s ? H.find(c => c.uid === s.uid) : null;
  // l'énergie, côté invité : ce qu'il peut se permettre (l'hôte tranche)
  H.forEach(c => { if (!c.why && c.cost > (vm.nrg[p] || 0)) c.why = 'Pas assez d’énergie'; });
  morphHTML(body, battleHTML(vm, p, { sel: selV, enemy, done: vm.ready[p] && !enemy, seen: CRAWL_G.seen, host: false })); crawlGround(CRAWL_G.page);
  H.forEach(c => CRAWL_G.seen.add(c.uid));
}
function crawlGuestClick(e) {
  const g = e.target.closest('[data-g]'); if (g && g.dataset.g === 'close') { closeCrawlPage(); CRAWL_G.page = null; CRAWL_G.vm = null; return; }
  const b = e.target.closest('[data-a]'); if (!b || b.disabled || !CRAWL_G.vm) return;
  const vm = CRAWL_G.vm, p = CRAWL_G.p, a = b.dataset.a, H = vm.hands[p] || [];
  const out = o => { coopSend({ t: 'cwa', ...o }); sfx('play'); };
  if (a === 'end') { out({ a: 'end' }); vm.ready[p] = true; CRAWL_G.sel = null; crawlGuestRender(false); return; }
  if (a === 'cancel') { CRAWL_G.sel = null; crawlGuestRender(false); return; }
  if (a === 'secret') { out({ a: 'secret', v: String(+b.dataset.v || 0) }); return; }
  if (a === 'card' || a === 'env') {
    const o = a === 'env' ? vm.env[+b.dataset.v] : H.find(c => c.uid === b.dataset.v); if (!o || o.why) { if (o && o.why) toast(`🚫 ${o.name} : ${o.why}.`, true); return; }
    const needT = ['enemy', 'ally', 'ko'].includes(o.tgt), same = CRAWL_G.sel && (a === 'env' ? CRAWL_G.sel.env === +b.dataset.v : CRAWL_G.sel.uid === o.uid);
    if (needT || !same) { CRAWL_G.sel = a === 'env' ? { env: +b.dataset.v } : { uid: o.uid }; crawlGuestRender(false); return; }
    flyCard(b, CRAWL_G.page.querySelector('.arena')); out({ a, v: a === 'env' ? String(+b.dataset.v) : o.uid }); CRAWL_G.sel = null; return;
  }
  if (a === 'tg' && CRAWL_G.sel) { const s = CRAWL_G.sel; flyCard(CRAWL_G.page.querySelector('.kcard.sel, .envo.sel'), CRAWL_G.page.querySelector('.arena')); out({ a: s.env != null ? 'env' : 'card', v: s.env != null ? String(s.env) : s.uid, tv: b.dataset.v }); CRAWL_G.sel = null; crawlGuestRender(false); }
}

// la nuit : une expédition remplace les dés quand la cible est un donjon rival, la Forêt ou une Grotte
const runRaidCrawl = runRaid;
runRaid = async function (report) { if (S.raid && S.raid.crawl && isCrawlTarget(S.raid.target)) return runCrawl(report); return runRaidCrawl(report); };
const raidPlanCrawl = CMD.raidPlan;
CMD.raidPlan = function (a) {
  if (!isCrawlTarget(a.target)) return raidPlanCrawl.call(this, a);
  const tg = RAIDS[a.target]; if (tg.tier > S.tier) return `Palier ${tg.tier} requis`;
  if (tg.rival && typeof isVassal === 'function' && isVassal(tg.rival)) return 'Déjà ton vassal';
  if (tg.site) { const s = siteById(tg.site); if (!s || !siteKnown(s)) return 'Lieu inconnu'; if (!expeReady(s)) return `Encore ${S.world.cd[s.id] - S.night} nuit(s) avant d’y retourner`; }
  const team = [...new Set(a.team || [])].slice(0, 4).map(critter).filter(c => c && !injured(c) && (!isOut(c) || (S.raid && S.raid.team.includes(c.id) && !c.away)));
  if (!team.length) return 'Personne ne peut partir';
  cancelRaid(); S.raid = { target: a.target, team: team.map(c => c.id), crawl: true };
  team.forEach(c => { c.raid = true; critterLeave(c.id); });
  addLog(`Expédition prévue : ${tg.name}.`, 'ev'); return null;
};
// la Forêt et les Grottes, depuis la carte du Val : une expédition en cartes, jouée cette nuit
Object.assign(CMD, { crawlSite(a) { const s = siteById(a.site); if (!s || !CRAWL_SITES.includes(s.expe)) return 'Pas ici'; ensureCrawlSites(); return CMD.raidPlan({ target: 'x_' + s.id, team: a.team }); } });
const startExpeditionCrawl = startExpedition;
startExpedition = function (siteId, ids, scoutHex) { const s = siteId != null ? siteById(siteId) : null; if (s && CRAWL_SITES.includes(s.expe)) return CMD.crawlSite({ site: siteId, team: ids }); return startExpeditionCrawl(siteId, ids, scoutHex); };
// le château partagé : l'hôte reçoit les cartes jouées par ses invités, les invités reçoivent l'expédition
const coopHostMsgCrawl = coopHostMsg;
coopHostMsg = function (m, pk) { if (m && m.t === 'cwa') { if (CRAWL_LIVE && COOP.peers.has(m.from)) CRAWL_LIVE.onGuest(m.from, m); return; } return coopHostMsgCrawl(m, pk); };
const coopGuestMsgCrawl = coopGuestMsg;
coopGuestMsg = function (m) { if (m && m.t === 'cw') { if (COOP.role === 'guest' && COOP.host && m.from === COOP.host.id) { COOP.hostAt = Date.now(); crawlGuest(m); } return; } return coopGuestMsgCrawl(m); };
// une partie reprise avec une expédition prévue dans la Forêt ou une Grotte : on recrée sa cible avant d'afficher quoi que ce soit
const renderAllCrawl = renderAll;
renderAll = function () { if (typeof S !== 'undefined' && S && S.raid && S.raid.target && !RAIDS[S.raid.target]) ensureCrawlSites(); return renderAllCrawl(); };
// pour le simulateur : une expédition jouée par le joueur automatique
function simCrawlNight(report) {
  const key = S.raid.target, tg = RAIDS[key], dg = crawlDgOf(key), team = S.raid.team.map(critter).filter(Boolean);
  if (!team.length || !CRAWL_DG[dg]) return null;
  const R = crawlAuto(dg, team, { prudence: .5 }), lines = []; crawlApply(R, team, lines); crawlVictory(dg, R, lines); crawlSiteResult(key, R, team, lines);
  report.push(['🏰', `Expédition ${tg.name} (niv. ${R.lvl}) : ${R.done}`, R.done === 'wipe' ? 'bad' : 'good']); lines.forEach(l => report.push(l));
  return R.done;
}

/* ---------- le Grimoire ---------- */
WIKI.expeditions = { cat: 'danger', t: 'Expéditions en cartes', x: () => `<p>Les donjons rivaux, la Forêt enchantée, les Grottes et les Ruines ne se pillent pas aux dés : on y envoie une <b>expédition</b> de 4 créatures au plus (donjon rival : bouton Raid, dès le Palier 1 ; Forêt, Grottes et Ruines : depuis la carte du Val). Elle se joue pendant la nuit, sur un écran à part, comme Slay the Spire. Les raids aux dés restent pour les lieux des humains (fermes, moulins, auberges…).</p>
  <ul><li><b>Le deck vient de ton château.</b> Chaque créature apporte deux Frappes, une Parade et la carte de son espèce (${Object.entries(CRAWL_SK).slice(0, 5).map(([k, s]) => `{sp:${k}} : ${s.ico} ${esc(s.name)}`).join(', ')}…), améliorée si elle est fidèle (70 de loyauté) ; une légende ou une créature évoluée ajoute un Coup de légende. Avant de partir, tu remplis le <b>sac</b> avec ${BAG_SIZE} cartes tirées de tes meubles et de tes pièges : le ${CASTLE_CARDS.chou.ico} Chou du potager soigne, la ${CASTLE_CARDS.hallebarde.ico} Hallebarde du râtelier frappe, la ${CASTLE_CARDS.trappe.ico} Trappe à pics mord le prochain ennemi qui attaque… Un <b>meuble de qualité</b> (au moins 6 💰+🪵, ou de palier 2) donne sa carte déjà améliorée ✦ : le grand lustre fait une meilleure torche que la simple torche, la catapulte lance de vrais boulets.</li>
  <li><b>Le combat</b> : ${ENERGY} énergie et ${HAND_SIZE} cartes par tour. Une carte de créature se joue par elle (sa force s’ajoute à ses coups) ; si elle est K.O., ses cartes sont mises de côté ; immobilisée, ses cartes attendent ; en panique, elles coûtent 1 de plus. Au-dessus de chaque ennemi, sa prochaine action et sa cible : protège-la, immobilise-le, ou tue-le d’abord.</li>
  <li><b>Trois étages</b> de 3 salles, puis le boss. À chaque pas, deux salles au choix : ${Object.entries(NODES).filter(([k]) => k !== 'boss').map(([, n]) => `${n.ico} ${n.name}`).join(', ')}. Après chaque combat gagné, une carte à ajouter au deck (ou pas). Au repos : se soigner, se calmer, ou aiguiser une carte.</li>
  <li><b>Après chaque salle</b>, tu continues ou tu rentres avec le butin. En plein combat, tu peux fuir : la moitié du butin reste là-bas (et les stickers, si c’est le boss qu’on fuit). Si l’équipe est terrassée, tout est perdu et tout le monde rentre sonné.</li>
  <li><b>La peur</b> monte avec les spectres, les K.O. et les cris ; à ${STRESS_MAX}, une créature panique. Au retour, la peur se change en fatigue (et parfois en cicatrice).</li>
  <li><b>Les élites</b> ont une capacité qui ne les quitte pas (${Object.values(ELITE_POW).map(P => `${P.ico} ${esc(P.name)}`).join(', ')}) et une action d’élite redoutable dans leur répertoire. <b>Les boss</b> ont en plus une <b>action légendaire</b> à chaque tour, annoncée d’avance (⚡), et à mi-vie ils entrent en <b>fureur</b> : un coup d’éclat, et un répertoire plus dur. Un boss sonné perd aussi son action légendaire.</li>
  <li><b>Les secrets du décor</b> : de temps en temps (pas souvent !), un détail du décor cache quelque chose : un tonneau prêt à exploser, un chandelier mal accroché, un vieux puits à vœux… Rien ne le signale, sauf un petit reflet qui passe. Touche-le pendant le tour des Maîtres : il sert une fois, ne coûte pas d’énergie et vise tout seul au mieux. Le combat auto ne les cherche pas : c’est un coup de pouce pour les yeux attentifs, pas une carte sur laquelle compter.</li>
  <li><b>Les éléments</b> : chaque coup a un type de dégâts, comme dans Donjons et Dragons ; voir {c:elements}.</li>
  <li><b>À plusieurs Maîtres</b> (château partagé) : chacun tire sa propre main et joue ses cartes depuis son écran ; les ennemis attendent que tout le monde ait fini. En contrepartie, les monstres sont plus coriaces, plus nombreux, frappent plus fort, et les boss ont une action légendaire de plus par Maître.</li>
  <li><b>Le niveau</b> suit la renommée de tes 4 meilleures créatures : le donjon se prépare à tes champions.</li>
  <li><b>Les récompenses</b> : or et matériaux qui grossissent avec la profondeur, des stickers dans les trésors, et sur chaque boss une relique unique (${Object.values(RELICS).map(r => `${r.ico} ${esc(r.name)}`).join(', ')}). Dans la Forêt, les Grottes et les Ruines, des artefacts et une rencontre (la Fée grincheuse, le Golem de mousse, la Liche frileuse) ; il faut ensuite 5 nuits pour y retourner. Soumettre un rival : un boss vaincu vaut 2 points ; atteindre le troisième étage avec au moins deux combats gagnés, puis rentrer en bon ordre (sans fuir un combat), 1 point ; à 3 points, il devient ton vassal. Chaque point pris rend ce rival plus coriace.</li></ul>` };
WIKI.elements = { cat: 'danger', t: 'Les éléments', x: () => `<p>En expédition, chaque coup a un <b>type de dégâts</b>, comme dans Donjons et Dragons : ${Object.values(ELEM).map(([i, n]) => `${i} ${n}`).join(', ')}.</p>
  <ul><li><b>Vulnérable</b> : les dégâts sont doublés (×2, et un « Vulnérable ! » s’affiche). <b>Résistant</b> : moitié moins. <b>Immunisé</b> : rien du tout. Sous chaque ennemi, ses faiblesses et ses résistances.</li>
  <li><b>La Frappe</b> prend l’arme naturelle de la créature qui la joue : le troll et le golem cognent (contondant), le squelette et l’orque tranchent, le gobelin et le vampire percent, le fantôme et la liche frappent nécrotique, la fée frappe de force. Les cartes du château ont leur propre type : Braises et Sort de flammes (feu), Fiole explosive (acide), Éclair de l’archimage (foudre), Épée qui chante faux (tonnerre), Relique bénite (radiant), Eau glacée du lac (froid), Malédiction de la tombe (nécrotique)…</li>
  <li><b>Quelques repères</b> : les squelettes craignent le contondant et ignorent le poison ; les spectres résistent aux coups physiques et craignent le radiant ; les morts-vivants et les vampires craignent le radiant ; les plantes, les araignées et les loups-garous craignent le feu ; le Golem de cristal et les gargouilles craignent le tonnerre ; les crapauds et le Basilic craignent le froid ; dans les Ruines, les momies craignent le feu, les armures vides le contondant et la foudre, et le Roi sans Couronne le radiant (son Gardien du sceau, lui, n’encaisse jamais plus de 8 par coup : mieux vaut beaucoup de petits coups).</li>
  <li><b>Tes créatures aussi</b> : le squelette, le golem, la gargouille et la liche sont immunisés contre le poison et ne connaissent pas la peur ; le diablotin et le dragonnet ne craignent pas le feu ; le troll craint le feu et l’acide ; le fantôme et le vampire craignent le radiant.</li></ul>` };
TIPS.push({ id: 'crawl0', when: () => S.tier >= 1 && !(S.stats.crawls) && !(S.tuto && S.tuto.on), t: 'Expéditions en cartes', x: 'Dès le Palier 1, le bouton Raid te propose une expédition dans un donjon rival, et la carte du Val t’envoie dans la Forêt enchantée, les Grottes ou les Ruines : un combat en cartes, avec un deck fait de tes créatures et de ton château.', wiki: 'expeditions' });
