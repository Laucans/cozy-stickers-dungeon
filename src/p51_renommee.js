/* =========================================================
   L'accueil : combien de créatures ton château peut attirer
   Des lits ne suffisent pas : il faut qu'on parle de toi. Chaque
   haut fait (notoriété, paliers, artefacts, grands chantiers,
   invasions repoussées, némésis, Guide, artisans, légendes…)
   ajoute des places, pour toujours. Les œufs qui éclosent au
   château, eux, n'ont besoin que d'un lit.
   ========================================================= */
const FAME_BASE = 5;
const artefactsFound = () => ARTEFACTS.filter(k => hasItem(k) || (S.free && S.free[k] > 0)).length;
const chantiersDone = () => (S.chantiers && S.chantiers.done ? Object.keys(S.chantiers.done).length : 0);
const albumCount = () => Object.keys(S.album || {}).filter(k => S.album[k]).length;
// chaque haut fait : sa famille (on n'affiche que le prochain de chaque famille), ce qu'il faut, et les places gagnées
const FAME = [
  ...[[25, 'On parle de toi au village', 15], [60, 'Ton nom court les tavernes'], [110, 'Les bardes chantent ton château', 150], [150, 'On vient de loin pour te voir', 300], [200, 'Une légende du Val', 600], [250, 'Ton nom fait trembler les royaumes', 1200], [320, 'On écrit des livres sur toi', 2400]]   // la notoriété unique (le troisième nombre : l'ancienne clé, celle des sauvegardes)
    .map(([v, t, old]) => ({ k: 'h' + (old || v), fam: 'hype', ico: 'fire', t, need: `${v} 🔥 de notoriété`, n: 2, v: () => [radiance(), v] })),
  ...[1, 2, 3].map(v => ({ k: 't' + v, fam: 'tier', ico: 'tier', t: `Palier ${v}`, need: `monter au palier ${v} (touche le Cœur)`, n: 2, v: () => [S.tier || 0, v] })),
  ...[[1, 'Un premier artefact'], [4, 'Une petite collection'], [8, 'Un vrai musée'], [12, 'Le trésor du Val']].map(([v, t]) => ({ k: 'a' + v, fam: 'arte', ico: 'crystal', t, need: v > 1 ? `${v} artefacts trouvés` : 'trouver un artefact (carte, expéditions, ruines)', n: 2, v: () => [artefactsFound(), v] })),
  ...[[1, 'Un grand chantier achevé'], [3, 'Trois grands chantiers'], [5, 'Tous les grands chantiers']].map(([v, t]) => ({ k: 'c' + v, fam: 'chant', ico: 'build', t, need: `${v} grand${v > 1 ? 's' : ''} chantier${v > 1 ? 's' : ''} achevé${v > 1 ? 's' : ''} (fiche du Cœur)`, n: 2, v: () => [chantiersDone(), v] })),
  ...[[30, 'Un château douillet', 1], [80, 'Un château où il fait bon vivre', 2], [150, 'Le plus douillet du Val', 2]].map(([v, t, n]) => ({ k: 'amb' + v, fam: 'amb', ico: 'heart', t, need: `${v} d’ambiance`, n, v: () => [ambiance(), v] })),
  ...[[1, 'Une invasion repoussée', 1], [5, 'Cinq invasions repoussées', 1], [15, 'Le château imprenable', 2]].map(([v, t, n]) => ({ k: 'r' + v, fam: 'repel', ico: 'shield', t, need: v > 1 ? `${v} invasions repoussées` : 'repousser une invasion', n, v: () => [(S.stats && S.stats.repelled) || 0, v] })),
  { k: 'nem', fam: 'nem', ico: 'crown', t: 'Le némésis à genoux', need: 'repousser trois fois le héros némésis et décider de son sort', n: 2, v: () => [S.foeHero && !['active', 'mercy'].includes(S.foeHero.st) ? 1 : 0, 1] },
  { k: 'guide', fam: 'guide', ico: 'book', t: 'Quatre étoiles au Guide', need: '4 étoiles au Guide des Donjons Douillets', n: 2, v: () => [S.guide ? S.guide.stars : 0, 4] },
  ...[[2, 'La chanson du château', 2], [3, 'La geste du Maître', 3]].map(([v, t, n]) => ({ k: 'conte' + v, fam: 'conte', ico: 'music', t, need: `un·e ${v === 3 ? 'maître·sse' : 'compagnon·ne'} conteur·se à la Taverne`, n, v: () => [typeof craftRank === 'function' ? craftRank('taverne') : 1, v] })),
  { k: 'maitre', fam: 'maitre', ico: 'anvil', t: 'Un·e maître·sse dans son métier', need: 'qu’une créature devienne maître·sse dans son métier (les métiers)', n: 2, v: () => [typeof bestCraft === 'function' ? Math.max(0, ...S.creatures.map(bestCraft)) : 0, 3] },
  ...[[1, 'Une créature légendaire'], [5, 'Cinq légendes']].map(([v, t]) => ({ k: 'leg' + v, fam: 'leg', ico: 'legend', t, need: v > 1 ? `${v} créatures légendaires` : 'qu’une créature devienne légende', n: 2, v: () => [S.creatures.filter(c => c.legend).length, v] })),
  ...[[1, 'Une quête accomplie', 1], [3, 'Trois quêtes accomplies', 2]].map(([v, t, n]) => ({ k: 'qd' + v, fam: 'quest', ico: 'scroll', t, need: v > 1 ? `${v} quêtes du journal accomplies` : 'accomplir une quête du journal', n, v: () => [typeof questsDone === 'function' ? questsDone() : 0, v] })),
  { k: 'qver', fam: 'qver', ico: 'skull', t: 'Un boss légendaire terrassé', need: 'vaincre le boss au bout de la grande quête', n: 3, v: () => [(S.stats && S.stats.qboss) ? 1 : 0, 1] },
  { k: 'alb12', fam: 'alb', ico: 'bookopen', t: 'Un album bien rempli', need: '12 espèces dans l’album', n: 2, v: () => [albumCount(), 12] },
];
const fameOK = f => { const [a, b] = f.v(); return a >= b; };
const fameGot = f => !!(S.fame && S.fame[f.k]) || fameOK(f);
function fameCap() { return FAME_BASE + FAME.reduce((a, f) => a + (fameGot(f) ? f.n : 0), 0); }
// les places : un lit libre ET une place d'accueil
function homeCap() { return Math.min(beds(), fameCap()); }

// l'aube : les hauts faits atteints restent acquis (les places ne se perdent pas)
const dawnFame = dawn;
dawn = function (report) {
  const r = dawnFame(report);
  try {
    if (!S.fame) { S.fame = {}; FAME.forEach(f => { if (fameOK(f)) S.fame[f.k] = S.night; }); return r; }
    const got = FAME.filter(f => !S.fame[f.k] && fameOK(f)); got.forEach(f => { S.fame[f.k] = S.night; });
    if (got.length) { const n = got.reduce((a, f) => a + f.n, 0); report.push(['sec', 'Accueil'], ['🌟', `Haut fait : ${got.map(f => `« ${f.t} »`).join(', ')}. +${n} place${n > 1 ? 's' : ''} d’accueil : ton château peut attirer jusqu’à ${fameCap()} créatures.`, 'good']); }
  } catch (e) { console.error(e); }
  return r;
};
// une nouvelle partie part de zéro (une vieille partie, elle, garde en silence ce qu'elle a déjà accompli)
const newStateFame = newState;
newState = function (...a) { const r = newStateFame(...a); if (S) S.fame = {}; return r; };

/* ---------- la fiche de l'accueil (le compteur de créatures, en haut) ---------- */
function openFame() {
  const fc = fameCap(), bd = beds(), n = S.creatures.length, fams = [...new Set(FAME.map(f => f.fam))];
  const next = fams.map(k => FAME.find(f => f.fam === k && !fameGot(f))).filter(Boolean), got = FAME.filter(fameGot), gotN = got.reduce((a, f) => a + f.n, 0);
  const row = f => { const [a, b] = f.v(), p = clamp(a / b, 0, 1); return `<div class="famerow">${gi(f.ico)}<span><b>${esc(f.t)}</b><small>${esc(f.need)} · ${Math.min(Math.floor(a), b)}/${b}</small><i class="fbar"><i style="width:${Math.round(p * 100)}%"></i></i></span><em>+${f.n}</em></div>`; };
  openModal(`<h2>${gi('legend')} L’accueil du château</h2>
    <p>Pour qu’une créature s’installe, il lui faut <b>un lit libre</b> (tu as ${bd} lits) et <b>une place d’accueil</b> : <b>${fc} créatures au plus</b> pour l’instant, une par haut fait accompli (ou deux, ou trois). Tu en as ${n}.</p>
    <p class="hint">Chaque haut fait ajoute des places, pour toujours. Les œufs qui éclosent au château n’ont besoin que d’un lit.</p>
    <h3>${gi('target')} Prochains hauts faits</h3><div class="famelist">${next.map(row).join('') || '<p class="hint">Tu as tout accompli !</p>'}</div>
    <h3>${gi('check')} Déjà acquis (${FAME_BASE} au départ, +${gotN})</h3><p class="famegot">${got.length ? got.map(f => `<span class="tag2">${esc(f.t)} +${f.n}</span>`).join(' ') : '<span class="hint">Rien encore : le Cœur bat à peine.</span>'}</p>
    <div class="btnrow"><button class="sbtn" type="button" data-wiki-open="renommee">${gi('book')} Grimoire</button></div>`, { label: 'Accueil' });
}
const bindSoulsFame = bindSouls;
bindSouls = function () {
  bindSoulsFame();
  try { $('#res').addEventListener('click', e => { if (e.target.closest('[data-k="beds"]')) { e.stopPropagation(); if (!UI.busy) openFame(); } }, true); } catch (e) { console.error(e); }
};

TIPS.push({ id: 'renommee', when: () => S.night > 1 && S.creatures.length >= fameCap() && fameCap() < beds(), t: 'Plus une place d’accueil', x: 'Des lits ne suffisent plus : il faut aussi une place d’accueil pour chaque créature. Touche le compteur de créatures, en haut, pour voir les hauts faits qui en ajoutent : notoriété, paliers, artefacts, grands chantiers, invasions repoussées…', wiki: 'renommee' });

WIKI.renommee = { cat: 'crea', t: 'Les places d’accueil', x: () => `<p>Une nouvelle créature ne s’installe que s’il reste <b>un lit libre</b> et <b>une place d’accueil</b>. Au départ, ton château en a ${FAME_BASE} ; chaque haut fait en ajoute, pour toujours :</p>
  <ul>${[...new Set(FAME.map(f => f.fam))].map(k => { const l = FAME.filter(f => f.fam === k); return `<li>${l.map(f => `<b>${esc(f.t)}</b> (${esc(f.need)}) : +${f.n}`).join(' ; ')}</li>`; }).join('')}</ul>
  <p>Tes places d’accueil aujourd’hui : <b>${fameCap()}</b> créatures au plus. Touche le compteur de créatures, en haut, pour voir les prochains hauts faits. Les œufs qui éclosent au château n’ont besoin que d’un lit. Si ton château est plein, tu peux toujours renvoyer une créature depuis sa fiche.</p>` };

/* ---------- le bestiaire « qui attire qui » : tiré des données (SPECIES, ROOMS.attracts, sites des rares) ---------- */
const roomWhere = t => { const r = ROOMS[t] || {}; return r.out ? 'dehors, aux Jardins' : r.high === 2 ? 'dans les Cimes' : r.high ? 'en hauteur' : r.deep === 2 ? 'dans les Profondeurs' : r.deep ? 'sous terre' : ''; };
const nestRooms = sp => Object.keys(ROOMS).filter(t => t !== 'coeur' && (SPECIES[sp].from === t || (ROOMS[t].attracts || []).includes(sp)));
WIKI.bestiaire = { cat: 'crea', t: 'Qui attire qui (bestiaire)', x: () => {
  const roomL = t => `{room:${t}|${esc(ROOMS[t].name)}}${roomWhere(t) ? ` (${roomWhere(t)})` : ''}${ROOMS[t].saga ? ' (née d’une intrigue)' : ''}`;
  const line = k => { const d = SPECIES[k], rooms = nestRooms(k), how = [];
    if (d.from === 'coeur') how.push(`sort du Cœur (${2} + ton palier, au plus)`);
    if (d.fromDecor) how.push(Object.entries(d.fromDecor).map(([f, n]) => `${n} {furn:${f}|${esc(FURN[f] ? FURN[f].name : f)}} n’importe où (une par lot de ${n})`).join(', '));
    if (rooms.length) how.push(rooms.map(roomL).join(' ou ') + (d.rare ? ', une par pièce' : ', deux par pièce'));
    const cond = [d.tier ? `Palier ${d.tier}` : '', d.rare ? `rare : la rencontrer d’abord en expédition (${esc(SITE_KINDS[d.site] ? SITE_KINDS[d.site].label.toLowerCase() : d.site)}), et ${d.glow} 🔥 de notoriété` : ''].filter(Boolean).join(' ; ');
    return `<li>{sp:${k}|${esc(d.name)}} : ${how.join(' ; ') || '?'}${cond ? ` — ${cond}` : ''}${d.likes && FURN[d.likes] ? `. Déco préférée : {furn:${d.likes}|${esc(FURN[d.likes].name)}}` : ''}.</li>`; };
  const byRoom = Object.keys(ROOMS).map(t => [t, SPECIES_ORDER.filter(k => nestRooms(k).includes(t))]).filter(([, l]) => l.length);
  return `<p>Chaque espèce vient pour <b>une pièce terminée et meublée</b> (au moins un meuble), deux créatures par pièce de ce type (une seule pour une rare), ou pour un décor. Il faut aussi un lit libre et une {c:renommee|place d’accueil} ; certaines attendent un {c:paliers|palier}, et les {c:rares|rares} une rencontre en expédition. Une espèce jamais vue se laisse tenter plus vite. Une fois là, sa <b>déco préférée</b> la rend plus heureuse ({c:humeur}). Attention aux {c:voisinages|voisins difficiles}.</p>
    <h3>Par espèce</h3><ul>${SPECIES_ORDER.map(line).join('')}</ul>
    <h3>Par pièce</h3><ul>${byRoom.map(([t, l]) => `<li>${roomL(t)} : ${l.map(k => `{sp:${k}|${esc(SPECIES[k].name)}}`).join(', ')}</li>`).join('')}<li>Les {furn:toile|Toiles d’araignée}, n’importe où : ${SPECIES_ORDER.filter(k => SPECIES[k].fromDecor).map(k => `{sp:${k}|${esc(SPECIES[k].name)}}`).join(', ')}</li></ul>` } };
