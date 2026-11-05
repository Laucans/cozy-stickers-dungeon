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
      invScreen(api, I, info.heart ? `Le Cœur ! ${who} ${info.def.length > 1 ? 'défendent' : 'défend'} le château. Ici, la bande se bat jusqu’au bout.` : `${who} ${info.def.length > 1 ? 'défendent' : 'défend'} <b>${esc(info.name)}</b> : au combat ! Un héros à terre, et la pièce tient. Les cartes viennent de la pièce (ses meubles et les pièges qui la bordent).`, [], [['go', '⚔️ Jouer le combat', true], ['auto', '🤖 Combat auto']], info.def);
      const how = S.opts && S.opts.cardDef === 'auto' ? (await sleep(1100), 'auto') : await invWaitFor(api, 'go', 'auto'); api.ui.autoNext = how === 'auto';
      if (info.heart) I.heartHp = invHpLeft(I);
      const R = invFightR(I, info); api.setR(R);
      let res = await api.fight('inv', invFoesForFight(I), B => invHook(I, B, info.heart));
      api.page.classList.remove('battle'); S.stats.cardDefs = (S.stats.cardDefs || 0) + 1;
      const l = invAfterFight(I, info, R, res); I.lines.push(...l); res = I.res || res;
      invScreen(api, I, res === 'won' ? `${gi('trophy')} La bande est repoussée !` : res === 'held' ? `${gi('shield')} ${esc(invCap(info.name))} tient bon : la bande passe son chemin sans rien piller.` : `La bande passe ${esc(info.name)}.`, l, [['next', nextLbl(), true]]); await invWaitFor(api, 'next');
    } else if (info.heart) {
      I.out = 'robbed'; I.heartHp = invHpLeft(I); invRec(I, info).kind = 'empty'; const l = [['💔', 'Personne pour défendre le Cœur : la bande se sert.', 'bad']]; I.lines.push(...l);
      invScreen(api, I, 'Le Cœur est désert…', l, [['next', nextLbl(), true]]); await invWaitFor(api, 'next');
    } else {
      const l = invEvent(I, info); I.lines.push(...l); sfx(I.out ? 'chime' : 'tick');
      invScreen(api, I, `Plus personne pour défendre <b>${esc(info.name)}</b> : une rencontre. Les créatures qui ne défendent rien agissent à leur idée…`, l, [['next', nextLbl(), true]]); await invWaitFor(api, 'next');
    }
  }
  if (!I.out) I.out = 'robbed';
  const T = { repelled: '🛡️ La bande est repoussée !', lost: '🌀 Ils rebroussent chemin', robbed: '💔 Le Cœur est pillé' }[I.out];
  api.head(); api.page.classList.remove('battle');
  api.body.innerHTML = `<div class="cmap"><h2 class="cp-end">${T}</h2>${invHeroesRow(I)}<p class="cmsg2">${I.out === 'robbed' ? 'Ils emportent ce qu’ils ont pillé en chemin, et se servent au Cœur.' : `Tout ce qu’ils avaient pillé reste au château${I.looted && !I.plan.party.some(h => h.minion) ? ', avec une prime : plus la bande était chargée, plus elle rapporte' : ''}.`}</p>
    <h3>Pièce par pièce</h3>${invLinesHTML(invSummary(I, I.out))}
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
// la force des deux camps et l'estimation (des invasions jouées d'avance en combat auto, avec les défenseurs rangés)
function invForceHTML(I, F, B) {
  const pct = Math.round(100 * F.rob), n = F.n || 1;
  return `<h3>La force des deux camps</h3><ul class="chron invlines">
    <li>⚔️ <b>La bande</b> : ${B.band.n} héros, ${B.band.hp} ❤️ en tout, environ ${B.band.hit} par coup${I.lines.length ? ' (cailloux compris)' : ''}.</li>
    <li class="${B.heart.names.length ? '' : 'bad'}">❤️ <b>Ton Cœur</b> : ${B.heart.names.length ? `${B.heart.names.map(esc).join(', ')} — ${B.heart.hp} ❤️ en tout, ${String(B.heart.atk).replace('.', ',')} en attaque` : 'personne pour le défendre !'}.</li>
    <li>🛡️ <b>Les pièces</b> : ${B.rooms} défendue${B.rooms > 1 ? 's' : ''} sur ${B.roomsN} (${B.defs} créature${B.defs > 1 ? 's' : ''}) ; ailleurs, des rencontres.</li>
    <li class="${pct >= 20 ? 'bad' : pct < 8 ? 'good' : ''}">🎲 <b>Estimation</b> : sur ${n} invasions jouées d’avance en combat auto, le Cœur tombe ${F.robbed} fois (${pct} %) : risque ${invRiskWord(F.rob)}. Jouer les combats à la main fait souvent mieux.</li></ul>`;
}
// avant l'assaut, depuis la pastille « Des aventuriers approchent » : ce qui arrive, qui tiendrait le Cœur, et les leviers
function openInvPrep() {
  const pp = partyPreview(), heart = invHeartCrew(), adv = invAdvice(null, 6), lvl = invLevel({ rank: pp.rank || 1, origin: pp.origin }), hp = heart.reduce((a, c) => a + crawler(c).hp, 0);
  const m = openModal(`<h2>⚔️ Des aventuriers approchent</h2>
    <p class="hint">Menace ${S.menace}/${MENACE_MAX} : une bande attaquera ${S.menace >= MENACE_MAX - 1 ? 'sans doute à la fin de cette nuit' : 'bientôt'}${pp.origin && pp.origin.name ? `, partie de ${esc(pp.origin.name)}` : ''} : environ ${pp.size} héros de rang ${pp.rank || 1}${pp.origin && pp.origin.crusade ? ' (la croisade : elle ne se vend pas)' : ''}, niveau ${String(lvl).replace('.', ',')} (il grandit avec ton château : ses créatures, ton palier, tes champions).</p>
    <ul class="chron invlines"><li class="${heart.length ? '' : 'bad'}">❤️ <b>Au Cœur, ce soir</b> : ${heart.length ? `${heart.map(c => esc(c.name)).join(', ')} (${hp} ❤️), tes créatures les plus fortes parmi les reposées` : 'personne !'}.</li></ul>
    ${adv.length ? `<h3>Pour bien les recevoir</h3>${invLinesHTML(adv.map(a => [a[0], a[1], '']))}` : '<p class="hint">Rien à redire : ton château est prêt.</p>'}
    <div class="btnrow"><button type="button" class="sbtn" data-a="wiki">📖 Le Grimoire : les invasions</button><button type="button" class="sbtn pri" data-a="ok">Compris</button></div>`, { wide: true, cls: 'invintro', label: 'Une bande approche' });
  m.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (!b) return; closeModal(true); if (b.dataset.a === 'wiki') openGrimoire('invasion'); });
}
if (typeof notifList === 'function') { const notifListInv = notifList; notifList = function () { const n = notifListInv(); n.forEach(x => { if (x.k === 'men') { x.act = () => openInvPrep(); x.text = 'Des aventuriers approchent : prépare ta défense'; } }); return n; }; }
// l'annonce : la bande, son parcours, et une seule question (les recevoir, ou acheter leur départ)
function invIntro(plan, o = {}) {
  if (typeof document === 'undefined') return Promise.resolve('fight');
  const I = plan.I = invNew(plan), cost = ransomCost(plan), ban = o.noRansom ? '' : invRansomBan(plan), F = invForecast(plan, I), Bal = invBalance(I), adv = invAdvice(I);
  const route = I.route.map(id => { const info = invInfo(I, id), r = info.r, heart = info.heart, d = info.def; if (!r) return '';
    return `<li class="${heart ? 'heart' : d.length ? 'guarded' : ''}"><b>${esc(heart ? 'Le Cœur' : ROOMS[r.t].name)}</b> <span class="hint">${d.length ? `${heart ? '❤️ ' : '🛡️ '}${d.map(c => esc(c.name)).join(', ')}` : heart ? 'personne pour le défendre !' : '👀 personne : une rencontre'}</span></li>`; }).join('');
    const tired = S.creatures.filter(c => fitToFight(c) && invTired(c)), spare = (I.lineup.spare || []).map(critter).filter(Boolean);
  return new Promise(res => {
    const m = openModal(`<h2>${o.title || `⚔️ ${esc(plan.foe || 'Des aventuriers')} attaquent !`}</h2>
      <p class="hint">${o.sub ? o.sub + ' ' : ''}${plan.party.length} ${o.sub ? 'sbires' : `héros, une bande de rang ${plan.rank || 1}${plan.crusade ? ' (la croisade)' : ''}`}, niveau ${String(I.lvl).replace('.', ',')}.</p>
      <div class="hcards">${I.foes.map(f => `<div class="hcard">${f.sp ? imgThumb('char', f.sp) : imgThumb('hero', CRAWL_EN[f.k].hero)}<b>${esc(f.name)}</b><span class="hst">❤️ ${f.hp} · ⚔️ +${f.plus}</span><small>${esc(CRAWL_EN[f.k].name)}</small></div>`).join('')}</div>
      ${invLinesHTML(I.lines)}${invForceHTML(I, F, Bal)}<h3>Leur parcours</h3><ol class="invroute">${route}</ol>
      <p class="hint">Tes défenseurs se rangent d’eux-mêmes, sans hasard : les ${invHeartN()} plus fortes tiennent le Cœur ; les autres vont de la plus faible à la plus forte, la première pièce du parcours d’abord. Une pièce avec des défenseurs : un combat aux cartes, avec les cartes qu’elle donne ; un héros à terre, et la pièce tient (elle n’est pas pillée). Une pièce sans défenseur : une rencontre. Chaque pièce pillée rend la bande plus forte… et plus riche à rattraper. Elle ne fuit pas : elle va jusqu’au Cœur, à moins que tous ses héros tombent.${spare.length ? ` À l’abri (pas de place pour elles) : ${spare.map(c => esc(c.name)).join(', ')}.` : ''}${tired.length ? ` Épuisé·e${tired.length > 1 ? 's' : ''}, ${tired.map(c => esc(c.name)).join(', ')} se repose${tired.length > 1 ? 'nt' : ''}.` : ''}</p>
      ${adv.length ? `<h3>Tes leviers, pour cette fois ou la prochaine</h3>${invLinesHTML(adv.map(a => [a[0], a[1], '']))}` : ''}<p class="hint">Tout est expliqué dans le Grimoire, article <b>Invasions</b>.</p>
      <div class="btnrow"><button type="button" class="sbtn pri" data-inv="fight">⚔️ Les recevoir</button>${o.noRansom ? '' : ban ? `<button type="button" class="sbtn" disabled title="${esc(ban)}">💰 ${esc(ban)}</button>` : `<button type="button" class="sbtn" data-inv="rancon" ${S.gold >= cost ? '' : 'disabled'}>💰 Acheter leur départ (${cost} 💰${S.gold >= cost ? '' : `, il t’en manque ${cost - S.gold}`})</button>`}</div>`, { noClose: true, wide: true, cls: 'invintro', label: 'Une invasion' });
    m.addEventListener('click', e => { const b = e.target.closest('[data-inv]'); if (!b || b.disabled) return; closeModal(true); res(b.dataset.inv); });
  });
}
runInvasion = async function (report) {
  const plan = planInvasion(); sfx('horn'); V.invPath = null; V.invGoal = null;
  const ch = await invIntro(plan);
  if (ch === 'rancon' && !invRansomBan(plan)) { const lines = payOff(plan); lines.forEach(l => report.push(l)); addLog('Tu as acheté le départ des aventuriers.', ''); renderAll(); await banner('💰 Marché conclu', esc(lines[0][1]), 1800); return; }
  const R = await invPlay(plan); plan.res = R; const I = R.inv2;
  report.push(['⚔️', `Invasion : ${I.route.length - 1} pièce${I.route.length > 2 ? 's' : ''} sur leur route, ${I.looted} pillée${I.looted > 1 ? 's' : ''}, ${I.fights} combat${I.fights > 1 ? 's' : ''} aux cartes.`, R.outcome === 'robbed' ? 'bad' : 'good']);
  invSummary(I, R.outcome).forEach(l => report.push(l));
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
  WIKI.invasion = { cat: 'danger', t: 'Invasions', x: () => `<p>Quand la {c:menace|Menace} est pleine, une bande d’aventuriers attaque. Une pastille « Des aventuriers approchent » te prévient la veille : touche-la pour voir qui tiendrait le Cœur et ce qui manque à ta défense. Avant l’assaut, l’annonce montre la bande, son parcours, la force des deux camps et une <b>estimation</b> (${INV_TUNE.trials} invasions jouées d’avance en combat auto, avec tes défenseurs déjà rangés). Puis une seule question : <b>les recevoir</b>, ou <b>acheter leur départ</b> (le prix est sur le bouton : ${ransomCost({ party: [1, 2, 3], rank: 1 })} 💰 pour 3 héros de rang 1, 4 💰 par héros et par rang ; ils empochent l’or et rentrent chez eux, sans butin ni gloire). <b>La croisade de Mirebrume ne se vend pas</b> : elle se combat ({c:v_legende}).</p>
    <ul><li><b>Une bande qui grandit avec toi</b> : son niveau suit ton château — le nombre de tes créatures (au-delà de ${INV_TUNE.crewCap}, il ne compte plus), ton palier et la force de tes champions — sans marche brutale d’un palier à l’autre. Elle compte un héros de plus au palier 1, et un autre quand ton château abrite ${INV_TUNE.bigBand} créatures ; les héros de rang 2 et 3 sont plus nombreux. Dès les premières bandes, un château négligé peut se faire piller.</li>
    <li><b>Leur parcours</b> : ${INV_ROOMS(1)} pièces de ton château au palier 1, ${INV_ROOMS(2)} au palier 2, ${INV_ROOMS(3)} à partir du palier 3, tirées au hasard (à tous les étages), puis <b>le Cœur</b>.</li>
    <li><b>Qui défend ?</b> Rien à poster ni à placer, et pas de hasard : tes créatures se rangent d’elles-mêmes, <b>de la plus faible à la plus forte</b>. L’annonce montre qui défend chaque pièce :
      <ul><li><b>le Cœur</b> : tes ${INV_TUNE.heartCap} créatures les plus fortes, toujours (parmi celles qui ne sont pas épuisées) ;</li>
      <li><b>les pièces</b> : les autres, de la plus faible à la plus forte : la première pièce du parcours reçoit les plus faibles, la suivante les suivantes, et ainsi de suite, ${INV_TUNE.teamMax} par pièce (+1 place avec un {room:garde}, +1 si un {def:poste} borde la pièce, +1 avec le chemin de ronde des sentinelles). S’il y a plus de créatures que de places, les plus faibles restent à l’abri ; s’il en manque, les dernières pièces n’ont personne ;</li>
      <li><b>le poste de travail</b> d’une créature n’y change rien : il compte pour son humeur et son métier, pas pour la défense ;</li>
      <li><b>épuisée</b> (${invFatMax()} de fatigue, après des raids ou des expéditions), une créature se repose et ne défend aucune pièce. Une créature en raid, en mission ou sonnée ne défend rien cette nuit-là.</li></ul></li>
    <li><b>Une pièce défendue</b> : un <b>combat aux cartes</b>, comme en {c:expeditions|expédition}, mais à l’envers ({c:combat}). Si un héros y tombe, <b>la pièce tient</b> : la bande renonce à la piller, même si tes défenseurs finissent à terre, et ses héros tombés restent à terre. Si tes défenseurs tombent sans faire tomber personne, elle pille la pièce.</li>
    <li><b>Une rencontre</b> (personne pour défendre la pièce) : une ou deux créatures qui ne défendaient rien (épuisées, ou restées à l’abri) croisent la bande et agissent <b>à leur idée</b>, selon leur caractère, leur loyauté et leur humeur : un piège de fortune, une farce, un coup de poing… ou se cacher, dormir, et même leur montrer où est l’or si elles t’en veulent. Puis la bande fouille.</li>
    <li><b>Une pièce pillée</b> : la bande emporte un peu de ton or et de ton bois, parfois un meuble, et <b>frappe plus fort</b> (+${INV_TUNE.buff} à tous ses coups par pièce). Ses blessures, elle les garde.</li>
    <li><b>Les pièges</b> posés dans les couloirs qui bordent une pièce frappent la bande quand elle y entre (une fois chacun ; la voleuse en désamorce un) et donnent leur carte aux combats de la pièce. Un bout de couloir (1 🪵) à la porte d’une pièce suffit pour y poser un piège.</li>
    <li><b>Pas de fuite</b> : la bande ne détale jamais, ni en plein combat ni entre deux pièces. Elle va jusqu’au Cœur, à moins que <b>tous ses héros</b> tombent en chemin : elle est alors repoussée, et <b>tout ce qu’elle avait pillé reste au château</b>, avec une prime : plus elle était chargée, plus elle rapporte. Les K.O. finissent aux {room:oubliettes} s’il y a de la place. Un combat qui dure plus de ${INV_TUNE.turns} tours : elle force le passage, vers l’avant.</li>
    <li><b>Au Cœur</b>, la bande se bat jusqu’au bout, contre tes ${INV_TUNE.heartCap} créatures les plus fortes (et le mercenaire, si tu l’as payé). S’il tombe, elle se sert (un bon tiers de ton or), et repart avec tout ce qu’elle a pillé en chemin ; +2 Calamité.</li>
    <li><b>À la fin</b>, un résumé pièce par pièce (aussi dans la chronique) : qui a défendu où, ce qui a été pillé ou repris, et, si le Cœur est tombé, pourquoi.</li></ul>
    <p><b>Tes leviers, avant l’assaut</b> :</p><ul><li><b>Du repos</b> : pas de raid ni d’expédition pour tes plus fortes la veille d’une invasion (épuisées ou parties, elles ne défendent pas).</li>
    <li><b>Des pièges</b> à la porte des pièces, à tous les étages.</li><li><b>Un repas de veille</b> ({c:cuisine}) : Poisson grillé, Gâteau au miel, Brochettes.</li>
    <li><b>Le guet</b> : un {room:garde} (une place de plus par pièce) et ses sentinelles ({c:artisanat}) ; <b>le Labo</b> (la Brume soporifique dans chaque combat) ; <b>un mercenaire</b> au Cœur (taverne d’une ville).</li>
    <li><b>Des créatures heureuses</b> : ravies, elles frappent plus fort ; fidèles, elles ne te trahissent pas dans les rencontres.</li><li><b>Plus de créatures</b> : chaque pièce du parcours a alors ses défenseurs.</li></ul>` };
  WIKI.combat = { cat: 'danger', t: 'Le combat', x: () => `<p>Les combats d’invasion se jouent aux cartes, sur l’écran des {c:expeditions|expéditions}, dans le décor de la pièce. Chaque tour : 3 d’énergie, 5 cartes ; puis chaque héros fait ce qu’il annonçait (au-dessus de sa tête). Tu joues à la main, ou en combat auto (qui te rend la main si ça tourne mal) ; les combats d’invasion n’ont pas de commission.</p>
    <ul>${['paysan', 'voleuse', 'elfe', 'mage', 'paladin', 'barbare'].map(k => { const E = CRAWL_EN['h_' + k]; return `<li><b>${esc(E.name)}</b> : ${E.hp} PV de base, ${E.acts.map(a => ({ atk: `frappe ${a[1]}`, multi: `${a[2]} coups de ${a[1]}`, aoe: `frappe tout le monde (${a[1]})`, execute: `achève la plus amochée (${a[1]})`, smash: `enfonce (${a[1]})`, block: `se protège (${a[1]})`, heal: `soigne la bande (${a[1]})`, stun: 'immobilise une créature' }[a[0]] || a[0])).join(', ')}.</li>`; }).join('')}</ul>
    <p><b>La bande ne fuit jamais.</b> Un combat se joue jusqu’au bout : jusqu’à ce que tes défenseurs ou tous ses héros soient à terre. <b>Dans une pièce</b>, un seul héros à terre suffit pour qu’elle tienne : la bande ne la pille pas, et passe à la suivante sans ses blessés. Un combat qui dure plus de ${INV_TUNE.turns} tours : elle force le passage vers la pièce suivante (et ne pille que la moitié, si personne n’est tombé) ; au Cœur, il tombe.</p>
    <p>La bande grandit avec ton château (tes créatures, ton palier, tes champions) ; une bande de rang plus élevé compte plus de héros. Chaque pièce pillée la rend plus forte. L’estimation de l’annonce joue l’invasion d’avance en combat auto : à la main, tu fais souvent mieux.</p>` };
}

// la rançon refusée par la croisade (la finale de la Légende se combat)
if (typeof payOff === 'function') { const payOffInv = payOff; payOff = function (plan) { const ban = invRansomBan(plan); return ban ? [['💰', ban, '']] : payOffInv(plan); }; }

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
