/* =========================================================
   L'écran des invasions aux cartes
   L'annonce (la bande, son parcours, acheter leur départ), puis
   la traversée du château sur l'écran des expéditions : chaque
   pièce a son décor (ses propres meubles), ses combats et ses
   rencontres ; à la fin, ce qu'elle laisse ou emporte.
   ========================================================= */
// le décor d'une pièce : ses meubles, posés comme ceux d'un donjon
const INV_SLOTS = [[7, 51, 1, 1], [20, 50, 1.1, 1], [80, 50, 1.1, 1], [93, 52, .95, 1], [33, 44, .85, 1], [67, 44, .85, 1], [4, 10, 1.1, 2], [96, 9, 1.05, 2]];
function invDecorOf(r) {
  const seen = new Set(), ts = []; (r ? groupOf(r).rooms : []).forEach(o => furnIn(o).forEach(f => { if (!seen.has(f.t) && FURN[f.t]) { seen.add(f.t); ts.push(f.t); } }));
  return { props: shuffle(ts).slice(0, INV_SLOTS.length).map((t, i) => ['furn', t, ...INV_SLOTS[i]]), lights: [[30, 46, '#ffcf7a'], [70, 46, '#ffcf7a']], windows: true };
}
if (typeof CRAWL_SKY !== 'undefined') CRAWL_SKY.chateau = '<rect width="1000" height="600" fill="#2b2018"/><g fill="#3a2b20">' + Array.from({ length: 9 }, (_, y) => Array.from({ length: 11 }, (_, x) => `<rect x="${x * 100 - (y % 2) * 50 + 4}" y="${y * 52 + 4}" width="92" height="44" rx="6"/>`).join('')).join('') + '</g><g fill="#1a120c"><path d="M180 330 V170 a70 70 0 0 1 140 0 V330z"/><path d="M680 330 V170 a70 70 0 0 1 140 0 V330z"/></g><g fill="#5a6a9a" opacity=".35"><path d="M196 322 V172 a54 54 0 0 1 108 0 V322z"/><path d="M696 322 V172 a54 54 0 0 1 108 0 V322z"/></g>';
function invDecor(page, info) { CRAWL_DECOR.chateau = invDecorOf(info.r); const d = page.querySelector('.cdecor'); if (d) d.innerHTML = decorHTML('chateau'); }
// le parcours, en pastilles : fait, en cours, à venir
function invTrack(I) {
  return `<div class="invtrack">${I.route.map((id, i) => { const r = invRoomOf(id), heart = r && r.t === 'coeur', g = r && !heart ? ((I.lineup && I.lineup.rooms[i]) || []).length : 0;
    return `<span class="it${i < I.idx ? ' done' : i === I.idx ? ' cur' : ''}${heart ? ' heart' : ''}"><i>${heart ? '❤️' : g ? '🛡️' : '👀'}</i>${esc(heart ? 'Cœur' : r ? ROOMS[r.t].name : '?')}${g ? ` <small>×${g}</small>` : ''}</span>`; }).join('<b class="itsep">›</b>')}</div>`;
}
const invFig = (o, side) => { try { return figHTML(figVM(null, o, side), false); } catch (e) { return `<div class="fig"><b>${esc(o.name)}</b> ${Math.max(0, o.hp)}/${o.max}</div>`; } };
const invHeroesRow = I => `<div class="cparty invheroes">${I.foes.map(f => invFig(f, 'foe')).join('')}</div>`;
const invDefRow = def => def.length ? `<div class="cparty">${def.map(c => invFig(crawler(c), 'ally')).join('')}</div>` : '';
const invLinesHTML = lines => lines.length ? `<ul class="chron invlines">${lines.map(l => `<li class="${l[2] || ''}">${l[0]} ${esc(l[1])}</li>`).join('')}</ul>` : '';
function invScreen(api, I, html, lines, buttons, def) {
  api.head();
  api.body.innerHTML = `<div class="cmap">${invTrack(I)}<p class="cmsg2">${html}</p>${invHeroesRow(I)}${def ? invDefRow(def) : ''}${invLinesHTML(lines || [])}
    <div class="btnrow cp-foot">${(buttons || []).map(([a, label, pri]) => `<button type="button" class="sbtn${pri ? ' pri' : ''}" data-a="${a}">${label}</button>`).join('')}</div></div>`;
}
async function invWaitFor(api, ...as) { for (;;) { const ch = await api.wait(); if (ch.p) continue; if (as.includes(ch.a)) return ch.a; } }
// la traversée, pièce après pièce
async function invRun(I, api) {
  const nextLbl = () => I.out || I.idx >= I.route.length - 1 ? 'Voir la fin' : 'Pièce suivante ▶';
  for (; I.idx < I.route.length && !I.out; I.idx++) {
    const info = invInfo(I, I.route[I.idx]); if (!info.r) continue;
    invDecor(api.page, info); api.page.classList.remove('battle');
    invScreen(api, I, `La bande entre dans <b>${esc(info.name)}</b>…`, [], [], info.def); sfx('door'); await sleep(900);
    const tl = invTraps(I, info); I.lines.push(...tl); if (tl.length) { invScreen(api, I, `Dans <b>${esc(info.name)}</b>, tes pièges les attendaient.`, tl, [], info.def); sfx('trap'); await sleep(1300); }
    if (I.out) break;
    if (info.def.length) {
      const who = info.def.map(c => esc(c.name)).join(', ');
      invScreen(api, I, info.heart ? `Le Cœur ! ${who} ${info.def.length > 1 ? 'défendent' : 'défend'} le château. Ici, la bande se bat jusqu’au bout.` : `Le sort a désigné ${who} pour défendre <b>${esc(info.name)}</b> : au combat ! Les cartes viennent de la pièce (ses meubles et les pièges qui la bordent).`, [], [['go', '⚔️ Jouer le combat', true], ['auto', '🤖 Combat auto']], info.def);
      const how = S.opts && S.opts.cardDef === 'auto' ? (await sleep(1100), 'auto') : await invWaitFor(api, 'go', 'auto'); api.ui.autoNext = how === 'auto';
      const R = invFightR(I, info); api.setR(R);
      const res = await api.fight('inv', invFoesForFight(I), B => invHook(I, B, info.heart));
      api.page.classList.remove('battle'); S.stats.cardDefs = (S.stats.cardDefs || 0) + 1;
      const l = invAfterFight(I, info, R, res); I.lines.push(...l);
      invScreen(api, I, res === 'won' ? `${gi('trophy')} La bande est repoussée !` : `La bande passe ${esc(info.name)}.`, l, [['next', nextLbl(), true]]); await invWaitFor(api, 'next');
    } else if (info.heart) {
      I.out = 'robbed'; const l = [['💔', 'Personne pour défendre le Cœur : la bande se sert.', 'bad']]; I.lines.push(...l);
      invScreen(api, I, 'Le Cœur est désert…', l, [['next', nextLbl(), true]]); await invWaitFor(api, 'next');
    } else {
      const l = invEvent(I, info); I.lines.push(...l); sfx(I.out ? 'chime' : 'tick');
      invScreen(api, I, `Personne n’a été tiré pour défendre <b>${esc(info.name)}</b>. Les créatures qui y travaillent agissent à leur idée…`, l, [['next', nextLbl(), true]]); await invWaitFor(api, 'next');
    }
  }
  if (!I.out) I.out = 'robbed';
  const T = { repelled: '🛡️ La bande est repoussée !', lost: '🌀 Ils rebroussent chemin', robbed: '💔 Le Cœur est pillé' }[I.out];
  api.head(); api.page.classList.remove('battle');
  api.body.innerHTML = `<div class="cmap"><h2 class="cp-end">${T}</h2>${invHeroesRow(I)}<p class="cmsg2">${I.out === 'robbed' ? 'Ils emportent ce qu’ils ont pillé en chemin, et se servent au Cœur.' : `Tout ce qu’ils avaient pillé reste au château${I.looted && !I.plan.party.some(h => h.minion) ? ', avec une prime : plus la bande était chargée, plus elle rapporte' : ''}.`}</p>
    <div class="btnrow cp-foot"><button type="button" class="sbtn pri" data-a="end">Retour au château</button></div></div>`;
  sfx(I.out === 'robbed' ? 'defeat' : 'victory'); await invWaitFor(api, 'end');
}
async function invPlay(plan) {
  const I = plan.I || invNew(plan);
  CRAWL_DECOR.chateau = invDecorOf(invRoomOf(I.route[0]));
  const R0 = { dg: 'chateau', np: 1, lvl: I.lvl, floor: 1, step: 0, party: [], deck: [], loot: I.bag, log: [], path: [], done: null };
  await runCrawl([], { dg: 'chateau', name: plan.foe || 'L’invasion du château', emo: '⚔️', team: [], R: R0,
    meta: () => `Pièce ${Math.min(I.idx + 1, I.route.length)}/${I.route.length} · ${invUp(I).length}/${I.foes.length} héros debout${I.pow ? ` · +${I.pow} à leurs coups` : ''}`,
    track: () => invTrack(I), run: api => invRun(I, api) });
  return invFinish(I);
}
// l'annonce : la bande, son parcours, et une seule question (les recevoir, ou acheter leur départ)
function invIntro(plan, o = {}) {
  if (typeof document === 'undefined') return Promise.resolve('fight');
  const I = plan.I = invNew(plan), cost = ransomCost(plan);
  const route = I.route.map(id => { const info = invInfo(I, id), r = info.r, heart = info.heart, d = info.def; if (!r) return '';
    return `<li class="${heart ? 'heart' : d.length ? 'guarded' : ''}"><b>${esc(heart ? 'Le Cœur' : ROOMS[r.t].name)}</b> <span class="hint">${d.length ? `${heart ? '❤️ ' : '🛡️ '}${d.map(c => esc(c.name)).join(', ')}` : heart ? 'personne pour le défendre !' : '👀 personne : une rencontre'}</span></li>`; }).join('');
    const tired = S.creatures.filter(c => fitToFight(c) && invTired(c));
  return new Promise(res => {
    const m = openModal(`<h2>${o.title || `⚔️ ${esc(plan.foe || 'Des aventuriers')} attaquent !`}</h2>
      <p class="hint">${o.sub ? o.sub + ' ' : ''}${plan.party.length} ${o.sub ? 'sbires' : `héros, une bande de rang ${plan.rank || 1}${plan.crusade ? ' (la croisade)' : ''}`}, niveau ${String(I.lvl).replace('.', ',')}.</p>
      <div class="hcards">${I.foes.map(f => `<div class="hcard">${f.sp ? imgThumb('char', f.sp) : imgThumb('hero', CRAWL_EN[f.k].hero)}<b>${esc(f.name)}</b><span class="hst">❤️ ${f.hp} · ⚔️ +${f.plus}</span><small>${esc(CRAWL_EN[f.k].name)}</small></div>`).join('')}</div>
      ${invLinesHTML(I.lines)}<h3>Leur parcours</h3><ol class="invroute">${route}</ol>
      <p class="hint">Tes défenseurs sont tirés au sort par palier de force : les plus faibles dans les premières pièces, les plus fortes à la fin ; les ${INV_TUNE.heartCap} plus fortes tiennent le Cœur. Une pièce avec des défenseurs : un combat aux cartes, avec les cartes qu’elle donne. Une pièce où personne n’est tiré : tes créatures y agissent à leur idée. Chaque pièce pillée rend la bande plus forte… et plus riche à rattraper. Au Cœur, elle se bat jusqu’au bout.${tired.length ? ` Épuisé·e${tired.length > 1 ? 's' : ''}, ${tired.map(c => esc(c.name)).join(', ')} se repose${tired.length > 1 ? 'nt' : ''}.` : ''}</p>
      <div class="btnrow"><button type="button" class="sbtn pri" data-inv="fight">⚔️ Les recevoir</button>${o.noRansom ? '' : `<button type="button" class="sbtn" data-inv="rancon" ${S.gold >= cost ? '' : 'disabled'}>💰 Acheter leur départ (${cost} 💰)</button>`}</div>`, { noClose: true, wide: true, cls: 'invintro', label: 'Une invasion' });
    m.addEventListener('click', e => { const b = e.target.closest('[data-inv]'); if (!b || b.disabled) return; closeModal(true); res(b.dataset.inv); });
  });
}
runInvasion = async function (report) {
  const plan = planInvasion(); sfx('horn'); V.invPath = null; V.invGoal = null;
  const ch = await invIntro(plan);
  if (ch === 'rancon') { const lines = payOff(plan); lines.forEach(l => report.push(l)); addLog('Tu as acheté le départ des aventuriers.', ''); renderAll(); await banner('💰 Marché conclu', esc(lines[0][1]), 1800); return; }
  const R = await invPlay(plan); plan.res = R; const I = R.inv2;
  report.push(['⚔️', `Invasion : ${I.route.length - 1} pièce${I.route.length > 2 ? 's' : ''} sur leur route, ${I.looted} pillée${I.looted > 1 ? 's' : ''}, ${I.fights} combat${I.fights > 1 ? 's' : ''}.`, R.outcome === 'robbed' ? 'bad' : 'good']);
  const lines = applyInvasion(plan, R.outcome); lines.forEach(l => report.push(l));
  addLog(R.outcome === 'robbed' ? 'Des héros ont pillé le Cœur.' : 'Invasion repoussée !', R.outcome === 'robbed' ? 'bad' : 'good');
  if (R.outcome !== 'robbed') sfx('chime');
  renderAll();
  await banner(R.outcome === 'robbed' ? '💔 Le Cœur est pillé' : R.outcome === 'lost' ? '🌀 Ils rebroussent chemin' : '🎉 Invasion repoussée !', lines[0] ? esc(lines[0][1]) : '', 2100);
};
// plus de chemin des héros à afficher
if (typeof V !== 'undefined') V.showPath = false;
/* ---------- le Grimoire ---------- */
if (typeof WIKI !== 'undefined') {
  WIKI.invasion = { cat: 'danger', t: 'Invasions', x: () => `<p>Quand la {c:menace|Menace} est pleine, une bande d’aventuriers attaque. Avant l’assaut, tu vois la bande, son niveau et son parcours. Une seule question : <b>les recevoir</b>, ou <b>acheter leur départ</b> (ils empochent l’or et rentrent chez eux, sans butin ni gloire).</p>
    <ul><li><b>Leur parcours</b> : ${INV_ROOMS(1)} pièces de ton château au palier 1, ${INV_ROOMS(2)} au palier 2, ${INV_ROOMS(3)} à partir du palier 3, tirées au hasard, puis <b>le Cœur</b>.</li>
    <li><b>Qui défend ?</b> Plus de gardes à poster : tes créatures se défendent d’elles-mêmes, <b>rangées par palier de force</b>. Avant l’assaut (tu le vois dans l’annonce), on tire au sort :
      <ul><li><b>le Cœur</b> : tes ${INV_TUNE.heartCap} créatures les plus fortes, toujours (parmi celles qui ne sont pas épuisées) ;</li>
      <li><b>les pièces</b> : les autres, rangées de la plus faible à la plus forte, sont découpées en autant de paliers que de pièces sur le parcours. La première pièce tire dans le palier le plus faible, la dernière dans le plus fort : la bande affronte des défenseurs de plus en plus coriaces. Chaque créature du palier y défend avec ${Math.round(INV_TUNE.drawP * 100)} % de chances, ${INV_TUNE.teamMax} au plus par pièce : +1 place si tu as bâti un {room:garde}, +1 si un {def:poste} borde la pièce ;</li>
      <li><b>toutes ne défendent pas</b> : une pièce peut ne tirer personne, et une créature ne défend qu’une pièce par invasion ;</li>
      <li><b>la fatigue</b> (raids, expéditions) compte : une créature fatiguée a moins de chances d’être tirée (−${Math.round(100 / invFatMax())} % de sa chance par point de fatigue) ; <b>épuisée</b> (${invFatMax()} de fatigue), elle se repose et ne défend aucune pièce. Au Cœur, une épuisée ne vient que s’il ne reste personne d’autre.</li></ul></li>
    <li><b>Une pièce avec des défenseurs</b> : un <b>combat aux cartes</b>, comme en {c:expeditions|expédition}, mais à l’envers : tes défenseurs contre la bande. Tu vois ce que chaque héros va faire. <b>Tes cartes dépendent de la pièce</b> : chaque défenseur apporte ses Frappes, sa Parade et la carte de son espèce ; la pièce ajoute les cartes de ses meubles et des pièges qui la bordent. Tu joues à la main, ou en combat auto (qui te rend la main si ça tourne mal).</li>
    <li><b>Une pièce où personne n’est tiré</b> : une rencontre. Les créatures qui y travaillent agissent <b>à leur idée</b>, selon leur caractère, leur loyauté et leur humeur : un piège de fortune, une farce, un coup de poing… ou se cacher, dormir, et même leur montrer où est l’or si elles t’en veulent. Puis la bande fouille.</li>
    <li><b>Une pièce pillée</b> : la bande emporte un peu de ton or et de ton bois, parfois un meuble, et <b>frappe plus fort</b> (+${INV_TUNE.buff} à tous ses coups par pièce). Ses blessures, elle les garde.</li>
    <li><b>Les pièges</b> posés dans les couloirs qui bordent une pièce frappent la bande quand elle y entre (une fois chacun ; la voleuse en désamorce un) et donnent leur carte aux combats de la pièce.</li>
    <li><b>Des héros à terre</b> : la bande fuit dès que ${[2, 3, 4, 5].map(n => `${Math.max(1, Math.ceil(n * INV_TUNE.rout))} sur ${n}`).join(', ')} de ses héros sont K.O. (${[3, 4, 5].map(n => `${Math.max(1, Math.ceil(n * INV_TUNE.rout3))} sur ${n}`).join(', ')} pour une bande de légende). <b>Tout ce qu’elle avait pillé reste au château</b>, avec une prime : plus elle était chargée, plus elle rapporte. Les K.O. finissent aux {room:oubliettes} s’il y a de la place.</li>
    <li><b>Au Cœur</b>, la bande se bat jusqu’au bout, contre tes ${INV_TUNE.heartCap} créatures les plus fortes (et le mercenaire, si tu l’as payé). S’il tombe, elle se sert, et repart avec tout ce qu’elle a pillé en chemin ; +2 Calamité.</li>
    <li>Une créature K.O. dans un combat perdu est sonnée : une nuit de repos, sans défense ni raid.</li></ul>` };
  WIKI.combat = { cat: 'danger', t: 'Le combat', x: () => `<p>Les combats d’invasion se jouent aux cartes, sur l’écran des {c:expeditions|expéditions}, dans le décor de la pièce. Chaque tour : 3 d’énergie, 5 cartes ; puis chaque héros fait ce qu’il annonçait (au-dessus de sa tête).</p>
    <ul>${['paysan', 'voleuse', 'elfe', 'mage', 'paladin', 'barbare'].map(k => { const E = CRAWL_EN['h_' + k]; return `<li><b>${esc(E.name)}</b> : ${E.hp} PV de base, ${E.acts.map(a => ({ atk: `frappe ${a[1]}`, multi: `${a[2]} coups de ${a[1]}`, aoe: `frappe tout le monde (${a[1]})`, execute: `achève la plus amochée (${a[1]})`, smash: `enfonce (${a[1]})`, block: `se protège (${a[1]})`, heal: `soigne la bande (${a[1]})`, stun: 'immobilise une créature' }[a[0]] || a[0])).join(', ')}.</li>`; }).join('')}</ul>
    <p>La bande grandit avec la force de tes meilleures créatures (comme un donjon) et avec ton palier ; une bande de rang plus élevé compte plus de héros. Chaque pièce pillée la rend plus forte.</p>` };
}

/* ---------- les sabotages du rival : ses sbires traversent le château de la même façon ---------- */
CRAWL_EN.h_sbire = { name: 'Sbire', hp: 12, acts: [['atk', 4], ['multi', 2, 2], ['block', 4]] };
const invNewBase = invNew;
invNew = function (plan) {
  const I = invNewBase(plan);
  plan.party.forEach((h, i) => { if (!h.minion) return; const f = crawlFoe('h_sbire', 1, i, I.lvl, 1); f.name = h.name || f.name; f.sp = h.k; f.j = i; I.foes[i] = f; });
  return I;
};
if (typeof rivalNight === 'function') rivalNight = async function (report) {
  if (!nemTonight()) return;
  if (report.some(l => l[0] === 'sec' && l[1] === 'Contrecoup')) { nem().next = S.night + 1; return; }   // déjà des héros cette nuit : les sbires attendent demain
  const plan = nemRaidPlan(), r = nemRival(), who = nemName(); plan.goal = { k: 'coeur' }; plan.route = invRoute();
  report.push(['sec', 'Sabotage']); sfx('horn');
  await invIntro(plan, { title: `${r.emo} Les sbires ${dN(who)} !`, sub: `${esc(r.name)} envoie ses sbires saboter ton château.`, noRansom: true });
  const R = await invPlay(plan); plan.res = R;
  const lines = []; applyNemRaid(plan, R, lines); invTakeBag(R, lines); lines.forEach(l => report.push(l));
  addLog(R.outcome === 'robbed' ? `Les sbires ${dN(who)} ont touché le Cœur.` : `Sabotage ${dN(who)} repoussé.`, R.outcome === 'robbed' ? 'bad' : 'good');
  renderAll(); sfx(R.outcome === 'robbed' ? 'bad' : 'chime');
  await banner(R.outcome === 'robbed' ? '🏴 Sabotage réussi…' : '🛡️ Sabotage repoussé !', lines[0] ? esc(lines[0][1]) : '', 2100);
};
if (typeof rivalNightSim === 'function') rivalNightSim = function (report) {
  if (!nemTonight()) return null;
  if (report.some(l => l[0] === '⚔️' && /^Invasion/.test(l[1]))) { nem().next = S.night + 1; return null; }
  const plan = nemRaidPlan(); plan.goal = { k: 'coeur' }; plan.route = invRoute(); const R = invResolve(plan); plan.res = R;
  const lines = []; applyNemRaid(plan, R, lines); invTakeBag(R, lines); lines.forEach(l => report.push(l));
  return R.outcome;
};

// des sbires qui touchent le Cœur emportent aussi ce qu'ils ont ramassé en chemin (repoussés, ils lâchent tout, sans prime)
function invTakeBag(R, lines) {
  const I = R && R.inv2; if (!I || R.outcome === 'repelled') return;
  const B = I.bag, g = Math.min(S.gold, B.g), s = Math.min(S.mat, B.s), n = B.items.length;
  S.gold -= g; S.mat -= s; if (n) { S.furn = S.furn.filter(f => !B.items.includes(f.id)); if (typeof dirty === 'function') dirty(); }
  const p = [g && `${g} 💰`, s && `${s} 🪵`, n && `${n} meuble${n > 1 ? 's' : ''}`].filter(Boolean).join(', ');
  if (p) lines.push(['🎒', `Ils repartent avec ce qu’ils ont ramassé en chemin : ${p}.`, 'bad']);
}
