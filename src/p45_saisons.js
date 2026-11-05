/* =========================================================
   Les saisons du Val : 10 nuits chacune
   Printemps (ambiance), été (marchés, héros en route), automne
   (récoltes), hiver (repas plus rares, héros plus rares). Une
   fête au milieu de chaque saison, avec son cadeau. La neige,
   les feuilles et les pétales tombent sur le château, et la
   carte du Val change de couleur.
   ========================================================= */
const SEASON_LEN = 10;
const SEASONS = [
  { k: 'printemps', name: 'Printemps', ico: 'leaf', fete: 'la Foire du Printemps', gift: 'plante', rule: '+2 ambiance : tout le monde a le moral.' },
  { k: 'ete', name: 'Été', ico: 'sun', fete: 'la Fête des Lucioles', gift: 'banc', rule: '+1 or par nuit (les marchés), mais les héros voyagent plus (la Menace monte un peu plus vite).' },
  { k: 'automne', name: 'Automne', ico: 'pumpkin', fete: 'la Nuit des Citrouilles', gift: 'citrouille', rule: '+2 repas : c’est la saison des récoltes.' },
  { k: 'hiver', name: 'Hiver', ico: 'cold', fete: 'la Veillée d’hiver', gift: 'torche', rule: '−3 repas (sauf avec la grande serre), mais les héros restent au coin du feu (la Menace monte moins vite).' },
];
const seasonIdx = (n = S && S.night || 1) => Math.floor((Math.max(1, n) - 1) / SEASON_LEN) % 4;
const season = (n) => SEASONS[seasonIdx(n)];
const seasonDay = (n = S.night) => (Math.max(1, n) - 1) % SEASON_LEN + 1;
function bonusFoodSeason() { const k = season().k; return k === 'automne' ? 2 : k === 'hiver' && !(typeof chantierDone === 'function' && chantierDone('serre')) ? -3 : 0; }
const ambianceSeason = ambiance;
ambiance = function () { return ambianceSeason() + (S && S.started && season().k === 'printemps' ? 2 : 0); };
// l'aube : la règle de la saison, la fête du 5e jour, le changement de saison
const dawnSeason = dawn;
dawn = function (report) {
  const r = dawnSeason(report), Sn = season(), d = seasonDay();
  if (Sn.k === 'ete') { S.gold += 1; if (S.night % 3 === 0) S.menace = Math.min(MENACE_MAX, S.menace + 1); }
  if (Sn.k === 'hiver' && S.night % 2 === 0 && S.menace > 0) S.menace--;
  if (d === 5) {
    const gift = Sn.gift && FURN[Sn.gift] ? Sn.gift : null; if (gift) S.free[gift] = (S.free[gift] || 0) + 1;
    let what = '';
    if (Sn.k === 'printemps') { S.gold += 8; what = '+8 or'; }
    else if (Sn.k === 'ete') { S.hype += 3; what = '+3 💬 de bouche-à-oreille'; }
    else if (Sn.k === 'automne') { S.bonusToken = 1; what = '+1 énergie au premier tour du combat du Cœur, à la prochaine invasion'; }
    else { S.creatures.forEach(c => { c.mood = Math.min(5, c.mood + 1); }); what = 'tout le monde se réchauffe (+1 humeur)'; }
    report.push(['🎉', `C’est ${Sn.fete} dans tout le Val : ${what}${gift ? `, et un sticker de saison offert (${FURN[gift].name})` : ''}.`, 'good']);
  }
  const nx = season(S.night + 1); if (nx.k !== Sn.k) { report.push([nx.k === 'hiver' ? '❄️' : nx.k === 'automne' ? '🍂' : nx.k === 'ete' ? '☀️' : '🌱', `La saison change : voici l’${nx.k === 'printemps' ? 'arrivée du printemps' : nx.k === 'ete' ? 'été' : nx.k === 'automne' ? 'automne' : 'hiver'}. ${nx.rule}`, 'ev']); if (typeof mapDirty === 'function') mapDirty(); }
  return r;
};
const heartTokensSeason = heartTokens;
heartTokens = function () { return heartTokensSeason() + (S.bonusToken ? 1 : 0); };
const applyInvasionSeason = applyInvasion;
applyInvasion = function (plan, outcome) { const l = applyInvasionSeason(plan, outcome); if (!plan.foe) S.bonusToken = 0; return l; };
// le bandeau du haut : la saison et son jour
const renderHUDSeason = renderHUD;
renderHUD = function () {
  renderHUDSeason();
  const t = document.getElementById('turn'); if (!t || !S || !S.started) return;
  let e = t.querySelector('.season'); if (!e) { e = el('small', 'season', ''); t.appendChild(e); }
  const Sn = season(), d = seasonDay(); e.innerHTML = `${gi(Sn.ico)} ${Sn.name} · ${d}/${SEASON_LEN}`; e.title = `${Sn.name}, nuit ${d} sur ${SEASON_LEN}. ${Sn.rule} Fête à la 5e nuit : ${Sn.fete}.`;
};
// ce qui tombe du ciel sur le château
const updateParticlesSeason = updateParticles;
updateParticles = function (dt, t) {
  updateParticlesSeason(dt, t);
  if (!TUNE.particles || !S || !S.started || Z === -1 || Z < 0) return;
  const k = season().k, n = V.parts.filter(p => p.k === 'snow' || p.k === 'leaf' || p.k === 'petal').length;
  if (k !== 'ete' && n < (k === 'hiver' ? 70 : 26)) {
    const [x0] = WP(0, H), [x1] = WP(W, 0), [, y0] = WP(0, 0);
    V.parts.push({ k: k === 'hiver' ? 'snow' : k === 'automne' ? 'leaf' : 'petal', x: x0 + Math.random() * (x1 - x0), y: y0 - 220 - Math.random() * 200, vx: (Math.random() - .3) * 12, vy: 14 + Math.random() * 18, life: 0, max: 12 + Math.random() * 8, rot: Math.random() * 6, col: k === 'automne' ? pick(['#d9822b', '#c0502a', '#e2b13c']) : k === 'printemps' ? pick(['#ffc6dc', '#fff0f6', '#ffd9a8']) : '#ffffff' });
  }
  V.parts.forEach(p => { if (p.k === 'snow' || p.k === 'leaf' || p.k === 'petal') { p.x += Math.sin(t / 700 + p.rot * 3) * dt * 9; p.rot += dt * (p.k === 'snow' ? .5 : 2); } });
};
const drawParticlesSeason = drawParticles;
drawParticles = function (c, t) {
  drawParticlesSeason(c, t);
  for (const p of V.parts) {
    if (p.k !== 'snow' && p.k !== 'leaf' && p.k !== 'petal') continue;
    const a = Math.min(1, p.life * 2, (p.max - p.life) * .6);
    c.globalAlpha = a * (p.k === 'snow' ? .85 : .9); c.fillStyle = p.col;
    if (p.k === 'snow') { c.beginPath(); c.arc(p.x, p.y, 2.2, 0, 7); c.fill(); }
    else { c.save(); c.translate(p.x, p.y); c.rotate(p.rot); c.beginPath(); c.ellipse(0, 0, p.k === 'leaf' ? 5 : 3.6, p.k === 'leaf' ? 2.6 : 2.2, 0, 0, 7); c.fill(); c.restore(); }
  }
  c.globalAlpha = 1;
};
// la carte du Val change de couleur : neige l'hiver, roux l'automne
function seasonTint(col, t) {
  if (!S || !S.started || t === 'mer' || t === 'lac') return col; const k = season().k;
  if (k === 'hiver') return mixCol(col, '#eef3f8', t === 'montagne' ? .55 : .45);
  if (k === 'automne' && (t === 'foret' || t === 'plaine')) return mixCol(col, t === 'foret' ? '#c26a2c' : '#b8a04a', .35);
  return col;
}
function mixCol(a, b, k) { const p = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)), A = p(a), B = p(b); return '#' + A.map((v, i) => Math.round(v + (B[i] - v) * k).toString(16).padStart(2, '0')).join(''); }
Object.assign(MART, {
  treeA: g => { rrect(g, -2.4, -11, 4.8, 11, 1.4, '#7a4a28', 1); mBlob(g, [[-7, -17, 7.5], [7, -17, 7.5], [0, -25, 9.5], [0, -15, 8]], '#d0782e'); ell(g, -3, -28, 3, 2, 'rgba(255,255,255,.35)', 0); },
  treeW: g => { rrect(g, -2.4, -11, 4.8, 11, 1.4, '#7a4a28', 1); mBlob(g, [[-7, -17, 7.5], [7, -17, 7.5], [0, -25, 9.5], [0, -15, 8]], '#5f8a6a'); [[-7, -21, 6], [7, -21, 6], [0, -30, 7]].forEach(([x, y, r]) => ell(g, x, y, r, r * .45, '#ffffff', .8)); },
  pineW: g => { rrect(g, -2.2, -8, 4.4, 8, 1.2, '#6a4024', 1); [[13, -6, -15], [10.5, -13, -22], [7.5, -20, -31]].forEach(([w, y0, y1]) => { poly(g, [[-w, y0], [w, y0], [0, y1]], '#3c6e50', 1.1); poly(g, [[-w * .45, y1 + (y0 - y1) * .45], [w * .45, y1 + (y0 - y1) * .45], [0, y1]], '#ffffff', .6); }); },
});
const mapArtSeason = mapArt;
mapArt = k => { const s = S && S.started ? season().k : ''; const alt = s === 'hiver' ? { tree: 'treeW', pine: 'pineW' }[k] : s === 'automne' ? { tree: 'treeA' }[k] : null; return mapArtSeason(alt || k); };
WIKI.saisons = { cat: 'bases', t: 'Les saisons', x: () => `<p>Le Val change de saison toutes les ${SEASON_LEN} nuits (le bandeau du haut indique laquelle, et sa nuit). Au milieu de chaque saison, une <b>fête</b> apporte un cadeau et un sticker de saison.</p><ul>${SEASONS.map(s => `<li><b>${s.name}</b> : ${esc(s.rule)} Fête : ${esc(s.fete)}.</li>`).join('')}</ul><p>La neige, les feuilles mortes et les pétales tombent sur le château, et la carte du Val se colore avec la saison.</p>` };
