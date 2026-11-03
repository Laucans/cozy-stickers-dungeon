/* =========================================================
   La renommée : combien de créatures ton château peut attirer
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
  ...[[15, 'On parle de toi au village'], [60, 'Ton nom court les tavernes'], [150, 'Les bardes chantent ton château'], [300, 'On vient de loin pour te voir'], [600, 'Une légende du Val'], [1200, 'Ton nom fait trembler les royaumes'], [2400, 'On écrit des livres sur toi']]
    .map(([v, t]) => ({ k: 'h' + v, fam: 'hype', ico: 'speech', t, need: `${v} de notoriété`, n: 2, v: () => [S.hype, v] })),
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
// les places : un lit libre ET assez de renommée
function homeCap() { return Math.min(beds(), fameCap()); }

// l'aube : les hauts faits atteints restent acquis (les places ne se perdent pas)
const dawnFame = dawn;
dawn = function (report) {
  const r = dawnFame(report);
  try {
    if (!S.fame) { S.fame = {}; FAME.forEach(f => { if (fameOK(f)) S.fame[f.k] = S.night; }); return r; }
    const got = FAME.filter(f => !S.fame[f.k] && fameOK(f)); got.forEach(f => { S.fame[f.k] = S.night; });
    if (got.length) { const n = got.reduce((a, f) => a + f.n, 0); report.push(['sec', 'Renommée'], ['🌟', `Ta renommée grandit : ${got.map(f => `« ${f.t} »`).join(', ')}. +${n} place${n > 1 ? 's' : ''} : ton château peut attirer jusqu’à ${fameCap()} créatures.`, 'good']); }
  } catch (e) { console.error(e); }
  return r;
};
// une nouvelle partie part de zéro (une vieille partie, elle, garde en silence ce qu'elle a déjà accompli)
const newStateFame = newState;
newState = function (...a) { const r = newStateFame(...a); if (S) S.fame = {}; return r; };

/* ---------- la fiche de la renommée (le compteur de créatures, en haut) ---------- */
function openFame() {
  const fc = fameCap(), bd = beds(), n = S.creatures.length, fams = [...new Set(FAME.map(f => f.fam))];
  const next = fams.map(k => FAME.find(f => f.fam === k && !fameGot(f))).filter(Boolean), got = FAME.filter(fameGot), gotN = got.reduce((a, f) => a + f.n, 0);
  const row = f => { const [a, b] = f.v(), p = clamp(a / b, 0, 1); return `<div class="famerow">${gi(f.ico)}<span><b>${esc(f.t)}</b><small>${esc(f.need)} · ${Math.min(Math.floor(a), b)}/${b}</small><i class="fbar"><i style="width:${Math.round(p * 100)}%"></i></i></span><em>+${f.n}</em></div>`; };
  openModal(`<h2>${gi('legend')} La renommée du château</h2>
    <p>Pour qu’une créature s’installe, il lui faut <b>un lit libre</b> (tu as ${bd} lits) et que ton château soit <b>assez renommé</b> pour l’attirer : <b>${fc} créatures au plus</b> pour l’instant. Tu en as ${n}.</p>
    <p class="hint">Chaque haut fait ajoute des places, pour toujours. Les œufs qui éclosent au château n’ont besoin que d’un lit.</p>
    <h3>${gi('target')} Prochains hauts faits</h3><div class="famelist">${next.map(row).join('') || '<p class="hint">Tu as tout accompli !</p>'}</div>
    <h3>${gi('check')} Déjà acquis (${FAME_BASE} au départ, +${gotN})</h3><p class="famegot">${got.length ? got.map(f => `<span class="tag2">${esc(f.t)} +${f.n}</span>`).join(' ') : '<span class="hint">Rien encore : le Cœur bat à peine.</span>'}</p>
    <div class="btnrow"><button class="sbtn" type="button" data-wiki-open="renommee">${gi('book')} Grimoire</button></div>`, { label: 'Renommée' });
}
const bindSoulsFame = bindSouls;
bindSouls = function () {
  bindSoulsFame();
  try { $('#res').addEventListener('click', e => { if (e.target.closest('[data-k="beds"]')) { e.stopPropagation(); if (!UI.busy) openFame(); } }, true); } catch (e) { console.error(e); }
};

TUTO_STEPS.push({ id: 'renommee', when: () => S.night > 1 && S.creatures.length >= fameCap() && fameCap() < beds(), t: 'Ta renommée a ses limites', x: 'Des lits ne suffisent plus : ton château n’est pas assez connu pour attirer de nouvelles créatures. Touche le compteur de créatures, en haut, pour voir les hauts faits qui ajoutent des places : notoriété, paliers, artefacts, grands chantiers, invasions repoussées…', wiki: 'renommee' });

WIKI.renommee = { cat: 'crea', t: 'La renommée (places au château)', x: () => `<p>Une nouvelle créature ne s’installe que s’il reste <b>un lit libre</b> et si ton château est <b>assez renommé</b> pour l’attirer. Au départ, ta renommée attire ${FAME_BASE} créatures ; chaque haut fait ajoute des places, pour toujours :</p>
  <ul>${[...new Set(FAME.map(f => f.fam))].map(k => { const l = FAME.filter(f => f.fam === k); return `<li>${l.map(f => `<b>${esc(f.t)}</b> (${esc(f.need)}) : +${f.n}`).join(' ; ')}</li>`; }).join('')}</ul>
  <p>Ta renommée actuelle : <b>${fameCap()}</b> créatures au plus. Touche le compteur de créatures, en haut, pour voir les prochains hauts faits. Les œufs qui éclosent au château n’ont besoin que d’un lit. Si ton château est plein, tu peux toujours renvoyer une créature depuis sa fiche.</p>` };
