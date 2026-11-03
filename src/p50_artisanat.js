/* =========================================================
   Les métiers (l'artisanat)
   Une créature apprend un métier là où on la poste (ou en
   montant la garde), nuit après nuit… si on ne l'envoie pas
   ailleurs (raid, expédition, combat). Apprenti·e, compagnon·ne,
   puis maître·sse : tant que ses gens travaillent, chaque métier
   a son effet, et il débloque pour toujours un savoir de rang 2,
   puis de rang 3.
   ========================================================= */
const CRAFT_LVLS = [{ n: 0, name: 'novice' }, { n: 6, name: 'apprenti·e' }, { n: 16, name: 'compagnon·ne' }, { n: 32, name: 'maître·sse' }];
const defNames = l => l.map(k => DEFS[k].name).join(', ');
// les métiers : où on l'apprend (une pièce, ou la garde), qui l'apprend (2 = né pour ça : deux fois plus vite),
// ce qu'il fait chaque nuit (selon les points de ses gens au travail), et ses savoirs de rang 2 et 3
const WORKSHOPS = {
  forge:   { room: 'forge', at: 'à la Forge', de: 'de la Forge', trade: 'forgeron·ne', team: 'Les forgerons', ico: 'anvil', sp: { nainsombre: 2, orque: 1, golem: 1 },
             live: () => `+${craftBonus('forge')} de force à tes verrous et tes pièges forgés (+1 tous les 3 points, +3 au plus)`,
             ranks: { 2: { t: 'Plans de rang 2', d: () => defNames(plansOf('forge', 2)) }, 3: { t: 'Plans de rang 3', d: () => defNames(plansOf('forge', 3)) } } },
  atelier: { room: 'atelier', at: 'à l’Atelier', de: 'de l’Atelier', trade: 'mécanicien·ne', team: 'Les mécaniciens', ico: 'gear', sp: { kobold: 2, gobelin: 1, diablotin: 1 },
             live: () => `+${craftBonus('atelier')} de force à tous tes pièges (+1 tous les 3 points, +3 au plus)`,
             ranks: { 2: { t: 'Plans de rang 2', d: () => defNames(plansOf('atelier', 2)) }, 3: { t: 'Plans de rang 3', d: () => defNames(plansOf('atelier', 3)) } } },
  bibli:   { room: 'bibli', at: 'à la Bibliothèque', de: 'de la Bibliothèque', trade: 'érudit·e', team: 'Les érudits', ico: 'bookopen', sp: { sorciere: 2, fantome: 2, liche: 2, vampire: 1 },
             live: () => `${bibliCells()} case${bibliCells() > 1 ? 's' : ''} du Val dévoilée${bibliCells() > 1 ? 's' : ''} chaque nuit (de vieilles cartes déchiffrées)`,
             ranks: { 2: { t: 'Les cartes annotées', d: () => 'tous les lieux du Val apparaissent sur la carte, et le château voit une case plus loin' }, 3: { t: 'Le bestiaire du Val', d: () => 'les créatures rares des lieux connus sont rencontrées d’office : elles viendront dès que ton château brillera assez' } } },
  taverne: { room: 'taverne', at: 'à la Taverne', de: 'de la Taverne', trade: 'conteur·se', team: 'Les conteurs', ico: 'music', sp: { menestrel: 2, harpie: 2, vampire: 1, gobelin: 1 },
             live: () => `+${taleHype()} notoriété chaque nuit (tes exploits, racontés et un peu enjolivés)`,
             ranks: { 2: { t: 'La chanson du château', d: () => '+2 places de renommée' }, 3: { t: 'La geste du Maître', d: () => '+3 places de renommée, et les visiteurs de la nuit passent plus souvent' } } },
  cuisine: { room: 'cuisine', at: 'à la Cuisine', de: 'de la Cuisine', trade: 'cuisinier·ère', team: 'Les cuisiniers', ico: 'food', sp: { troll: 2, goule: 2, gobelin: 1, diablotin: 1 },
             live: () => `+${bonusFoodCraft()} repas`,
             ranks: { 2: { t: 'Recette des Brochettes du troll', d: () => RECIPES.brochettes.desc }, 3: { t: 'Recette du Banquet du Maître', d: () => RECIPES.banquet.desc } } },
  labo:    { room: 'labo', at: 'au Laboratoire', de: 'du Laboratoire', trade: 'alchimiste', team: 'Les alchimistes', ico: 'potion', sp: { sorciere: 2, mandragore: 2, liche: 1, crapaud: 1 },
             live: () => `−${labCalm()} Calamité chaque nuit (−1 tous les 3 points)`,
             ranks: { 2: { t: 'Jeton du Cœur : Brume soporifique', d: () => POWERS.brume.desc }, 3: { t: 'Jeton du Cœur : Élixir de bravoure', d: () => POWERS.elixir.desc } } },
  // la garde : une créature postée sur le chemin des héros (mode Gardes) apprend le guet ; se battre à son poste, c'est son métier
  guet:    { guard: true, at: 'en montant la garde', de: 'des sentinelles', trade: 'sentinelle', team: 'Les sentinelles', ico: 'shield', sp: { gargouille: 2, squelette: 2, golem: 1, troll: 1, orque: 1, mimique: 1, nainsombre: 1 },
             live: () => 'chaque sentinelle se bat mieux à son poste : +2 PV par grade, une armure dès compagnon·ne, +1 en attaque en maître·sse',
             ranks: { 2: { t: 'Le chemin de ronde', d: () => '+1 garde au plus' }, 3: { t: 'Les meurtrières', d: () => '+1 garde au plus, et un barrage de couloir tient 3 gardes' } } },
};
function craftLvl(n) { let l = 0; CRAFT_LVLS.forEach((L, i) => { if (n >= L.n) l = i; }); return l; }
const craftOf = (c, w) => (c && c.craft && c.craft[w]) || 0;
const craftAff = (c, w) => (c && WORKSHOPS[w] && WORKSHOPS[w].sp[c.sp]) || 0;
const workshopType = r => { if (!r || !ROOMS[r.t]) return null; const k = Object.keys(WORKSHOPS).find(w => WORKSHOPS[w].room && (WORKSHOPS[w].room === r.t || WORKSHOPS[w].room === ROOMS[r.t].like)); return k || null; };
// le métier qu'une créature apprend en ce moment : la garde d'abord (si son espèce s'y prête), sinon la pièce où elle est postée
function metierOf(c) {
  if (!c) return null;
  if (c.guard && craftAff(c, 'guet') && typeof guardRoomOf === 'function' && guardRoomOf(c)) return 'guet';
  const r = c.post && S.rooms.find(o => o.id === c.post && o.built), w = workshopType(r); return w && craftAff(c, w) ? w : null;
}
const workshopOf = metierOf;
// ses gens au travail ce soir (ni partis, ni sonnés, ni boudeurs)
const artisansAt = w => S.creatures.filter(c => metierOf(c) === w && !isOut(c) && !injured(c) && c.mood >= 2);
const craftPoints = w => artisansAt(w).reduce((a, c) => a + craftLvl(craftOf(c, w)), 0);
const craftBonus = w => Math.min(3, Math.floor(craftPoints(w) / 3));
const bibliCells = () => { const p = craftPoints('bibli'); return p ? 1 + Math.floor(p / 2) : 0; };
const taleHype = () => Math.ceil(craftPoints('taverne') / 2);
function bonusFoodCraft() { try { return S && S.creatures ? craftPoints('cuisine') : 0; } catch (e) { return 0; } }
const labCalm = () => Math.min(3, Math.floor(craftPoints('labo') / 3));
// les savoirs : le meilleur rang jamais atteint dans chaque métier (ils restent, même si l'artisan s'en va)
function craftRank(w) { return (S && S.craftRank && S.craftRank[w]) || 1; }
const rankOfLvl = l => (l >= 3 ? 3 : l >= 2 ? 2 : 1);
const bestCraft = c => Math.max(0, ...Object.keys(WORKSHOPS).map(w => craftLvl(craftOf(c, w))));
const plansOf = (w, rk) => DEF_ORDER.filter(k => DEFS[k].needs === w && DEFS[k].rank === rk);

// la force d'un piège : le savoir-faire des forgerons et des mécaniciens au travail
const defStrCraft = defStr;
defStr = function (d) {
  const f = DEFS[d.t], s = defStrCraft(d); if (!f) return s;
  return s + (f.kind === 'verrou' || f.needs === 'forge' ? craftBonus('forge') : 0) + (f.kind === 'piège' ? craftBonus('atelier') : 0);
};
// les pièges de rang 2 et 3 : il faut les plans
const availabilityCraft = availability;
availability = function (kind, t) {
  const a = availabilityCraft(kind, t); if (a || kind !== 'def') return a;
  const d = DEFS[t]; return d && d.rank && WORKSHOPS[d.needs] && craftRank(d.needs) < d.rank ? { lock: true, reason: `Plans de rang ${d.rank}` } : a;
};
// les sentinelles : plus solides à leur poste
const fighterOfCraft = fighterOf;
fighterOf = function (c, bonus = 0) {
  const f = fighterOfCraft(c, bonus), l = c && c.guard && craftAff(c, 'guet') && typeof guardRoomOf === 'function' && guardRoomOf(c) ? craftLvl(craftOf(c, 'guet')) : 0;
  if (l) { f.hp += 2 * l; f.max += 2 * l; if (l >= 2) f.A = { ...f.A, armor: (f.A.armor || 0) + 1 }; if (l >= 3) f.atk += 1; }
  return f;
};
// les alchimistes : la Calamité recule
const calamityDeltaCraft = calamityDelta;
calamityDelta = function () { const r = calamityDeltaCraft(), k = labCalm(); if (k) { r.d -= k; r.parts.push(`−${k} alchimistes`); } return r; };

// qui s'est battu cette nuit (une nuit ailleurs fait perdre la main ; une sentinelle, elle, apprend)
const applyInvasionCraft = applyInvasion;
applyInvasion = function (plan, outcome) {
  const l = applyInvasionCraft(plan, outcome);
  try { const R = plan && plan.res; if (R && R.fought) R.fought.forEach(id => { const c = critter(id); if (c) c.foughtN = S.night; }); } catch (e) { console.error(e); }
  return l;
};
// l'aube : chacun apprend à son poste ; parti, sonné ou au combat ailleurs, il perd un peu la main (un grade acquis reste)
const dawnCraft = dawn;
dawn = function (report) {
  const night = S.night, fought = new Set(S.creatures.filter(c => c.foughtN === night).map(c => c.id)), busy = new Set(S.creatures.filter(c => isOut(c) || injured(c) || fought.has(c.id) || c.fatAt === night).map(c => c.id));
  const r = dawnCraft(report);
  try { craftDawn(report, busy, fought); } catch (e) { console.error(e); }
  return r;
};
function craftDawn(report, busy, fought) {
  const ups = [], lines = [];
  S.creatures.forEach(c => {
    const w = metierOf(c); if (!w) return;
    const cr = (c.craft = c.craft || {}), n0 = cr[w] || 0, l0 = craftLvl(n0), atPost = w === 'guet' && fought.has(c.id) && !isOut(c);
    if (busy.has(c.id) && !atPost) { cr[w] = Math.max(CRAFT_LVLS[l0].n, n0 - 1); return; }
    if (c.mood < 2) return;
    cr[w] = n0 + craftAff(c, w) + (atPost ? 1 : 0); const l1 = craftLvl(cr[w]);
    if (l1 > l0) ups.push([c, w, l1]);
  });
  // les effets de chaque nuit : les érudits dévoilent la carte, les conteurs font parler de toi
  const cells = S.world ? bibliCells() : 0;
  if (cells) { const r = bibliReveal(cells); if (r && r.n) lines.push(`les érudits déchiffrent de vieilles cartes : ${r.n} case${r.n > 1 ? 's' : ''} du Val se dévoile${r.n > 1 ? 'nt' : ''}${r.found.length ? ` (tu découvres ${r.found.map(s => s.name).join(', ')})` : ''}`); }
  const th = taleHype(); if (th) { S.hype += th; lines.push(`les conteurs racontent tes exploits à la Taverne : +${th} notoriété`); }
  if (ups.length || lines.length) report.push(['sec', 'Métiers']);
  if (lines.length) report.push(['📚', lines.map(s => s[0].toUpperCase() + s.slice(1)).join('. ') + '.', '']);
  ups.forEach(([c, w, l]) => {
    const W = WORKSHOPS[w], rk = rankOfLvl(l);
    report.push(['🔨', `${c.name} passe ${CRAFT_LVLS[l].name} ${W.trade} ${W.at} ! Tant qu’il·elle y travaille : ${W.live()}.`, 'good']);
    addLog(`${c.name} : ${CRAFT_LVLS[l].name} ${W.trade}.`, 'ev');
    if (rk > craftRank(w)) {
      (S.craftRank = S.craftRank || {})[w] = rk; const R = W.ranks[rk];
      report.push(['📜', `Nouveau savoir ${W.de} (rang ${rk}) : ${R.t}, ${R.d()}. Il reste à toi, même si ${c.name} s’en va.`, 'good']);
      craftUnlock(w, rk, report);
      if (typeof toast === 'function' && !headless()) toast(`📜 Nouveau savoir ${W.de} : ${R.t} !`);
    }
  });
  // le bestiaire : les lieux connus livrent leurs créatures rares
  if (craftRank('bibli') >= 3 && S.world) bestiary(report);
}
// les érudits : des cases au bord de ce qu'on connaît
function bibliReveal(n) {
  const w = world(), vis = visibleSet(), edge = w.list.filter(c => !vis.has(c.i) && HEX_DIRS.some(([dq, dr]) => { const m = w.cell(c.q + dq, c.r + dr); return m && vis.has(m.i); }));
  if (!edge.length) return null;
  const out = []; for (let k = 0; k < n && edge.length; k++) out.push(edge.splice(Math.floor(Math.random() * edge.length), 1)[0].i);
  return discover(out, 'les érudits');
}
function bestiary(report) {
  const vis = visibleSet(); S.world.met = S.world.met || {};
  world().sites.forEach(s => { const X = s.expe && EXPE_SITES[s.expe]; if (!X || !X.meet || worldMet(X.meet) || !vis.has(s.i) || !SPECIES[X.meet]) return; S.world.met[X.meet] = S.night; report.push(['🤝', `Le bestiaire du Val : tes érudits savent où vit la ${SPECIES[X.meet].name} (${s.name}). Elle viendra s’installer quand ton château rayonnera à ${SPECIES[X.meet].glow} ✨.`, 'good']); });
}
// un savoir débloqué qui agit tout de suite
function craftUnlock(w, rk, report) {
  if (w === 'bibli' && rk === 2 && S.world) { const r = discover(world().sites.map(s => s.i), 'les cartes annotées'); if (r && r.found.length) report.push(['🗺️', `Les cartes annotées : ${r.found.map(s => s.name).join(', ')} apparai${r.found.length > 1 ? 'ssent' : 't'} sur la carte.`, 'good']); }
  if (w === 'bibli' && rk === 3 && S.world) bestiary(report);
}

/* ---------- les fiches : la créature, la pièce, le piège ---------- */
function craftLine(c, w) {
  const n = craftOf(c, w), l = craftLvl(n), nx = CRAFT_LVLS[l + 1];
  return `${gi(WORKSHOPS[w].ico)} <b>${WORKSHOPS[w].trade}</b> : ${CRAFT_LVLS[l].name}${nx ? ` <small>(${n}/${nx.n})</small>` : ' <small>(au sommet de son art)</small>'}${craftAff(c, w) > 1 ? ' · <i>né·e pour ça</i>' : ''}`;
}
const whereOf = w => (WORKSHOPS[w].guard ? 'en garde (bouton bouclier)' : WORKSHOPS[w].at);
const openCreatureCraft = openCreature;
openCreature = function (id) {
  openCreatureCraft(id);
  const c = critter(id), m = document.querySelector('#modalRoot .modal'), post = m && m.querySelector('#mPost'); if (!c || !post || !post.closest('dd')) return;
  const ws = Object.keys(WORKSHOPS).filter(w => craftAff(c, w)); if (!ws.length) return;
  const here = metierOf(c);
  const hint = here ? (isOut(c) ? 'Partie : n’apprend rien en ce moment.' : c.mood < 2 ? 'Boude : n’apprend rien.' : `Apprend chaque nuit ${WORKSHOPS[here].at}, tant qu’on ne l’envoie pas ailleurs (raid, expédition, combat loin de son poste : la main se rouille un peu).`)
    : `Poste cette créature ${ws.map(whereOf).join(' ou ')} pour qu’elle apprenne le métier.`;
  post.closest('dd').after(el('dt', '', 'Métier'), el('dd', '', `${ws.map(w => craftLine(c, w)).join('<br>')}<br><span class="hint">${hint}</span>`));
};
function craftRoomHTML(w) {
  const W = WORKSHOPS[w], arts = S.creatures.filter(c => metierOf(c) === w), on = new Set(artisansAt(w).map(c => c.id)), pts = craftPoints(w), rk = craftRank(w);
  const who = Object.keys(W.sp).filter(sp => SPECIES[sp]).map(sp => `${SPECIES[sp].name}${W.sp[sp] > 1 ? ' (né·e pour ça)' : ''}`).join(', ');
  return `<h3>${gi(W.ico)} ${W.team} (${arts.length})</h3>
    ${arts.length ? `<ul class="craftlist">${arts.map(c => `<li class="${on.has(c.id) ? '' : 'off'}"><b>${esc(c.name)}</b> : ${CRAFT_LVLS[craftLvl(craftOf(c, w))].name}${craftLvl(craftOf(c, w)) < 3 ? ` <small>(${craftOf(c, w)}/${CRAFT_LVLS[craftLvl(craftOf(c, w)) + 1].n})</small>` : ''}${on.has(c.id) ? '' : ' · <span class="no">pas au travail</span>'}</li>`).join('')}</ul>` : `<p class="hint">Personne n’y apprend le métier de ${W.trade}. Poste ici (depuis la fiche d’une créature) : ${esc(who)}.</p>`}
    <p class="hint">Au travail ce soir : ${pts} point${pts > 1 ? 's' : ''} (apprenti·e 1, compagnon·ne 2, maître·sse 3) → ${W.live()}.</p>
    ${[2, 3].map(k => `<p>${gi(rk >= k ? 'check' : 'lock')} <b>Rang ${k} · ${esc(W.ranks[k].t)}</b>${rk >= k ? '' : ` <small>(un·e ${k === 3 ? 'maître·sse' : 'compagnon·ne'})</small>`} : ${esc(W.ranks[k].d())}.</p>`).join('')}`;
}
const openRoomCraft = openRoom;
openRoom = function (id) {
  openRoomCraft(id);
  const r = S.rooms.find(x => x.id === id), m = document.querySelector('#modalRoot .modal'), w = workshopType(r); if (!r || !m || !r.built || !w || !m.querySelector('.mbody')) return;
  m.querySelector('.mbody').appendChild(el('div', 'gsec', craftRoomHTML(w)));
};
const openDefCraft = openDef;
openDef = function (id) {
  openDefCraft(id);
  const d = S.defs.find(x => x.id === id), f = d && DEFS[d.t], m = document.querySelector('#modalRoot .modal'); if (!f || !m) return;
  const parts = []; if (f.kind === 'verrou' || f.needs === 'forge') { const b = craftBonus('forge'); if (b) parts.push(`+${b} grâce aux forgerons`); } if (f.kind === 'piège') { const b = craftBonus('atelier'); if (b) parts.push(`+${b} grâce aux mécaniciens de l’Atelier`); }
  const desc = m.querySelector('.mbody > p, .modal > p'); if (parts.length && desc) desc.after(el('p', 'hint', `${gi('hammer')} ${parts.join(' ; ')}.`));
};

TUTO_STEPS.push({ id: 'artisans', when: () => S.creatures.some(c => Object.keys(WORKSHOPS).some(w => craftAff(c, w) > 1 && (WORKSHOPS[w].guard || builtCount(WORKSHOPS[w].room) > 0))), t: 'Les métiers', x: 'Certaines créatures apprennent un métier là où on les poste (depuis leur fiche) : un {sp:nainsombre} à la {room:forge}, une {sp:sorciere} à la {room:bibli} ou au {room:labo}, un {sp:troll} à la {room:cuisine}, un {sp:menestrel} à la {room:taverne}… et une {sp:gargouille} en montant la garde. Nuit après nuit, elles progressent : leur métier agit tant qu’elles travaillent, et chaque grade de compagnon ou de maître débloque un savoir pour toujours. Un raid, une expédition ou un combat loin de son poste fait perdre un peu la main.', wiki: 'artisanat' });

WIKI.artisanat = { cat: 'crea', t: 'Les métiers (artisanat)', x: () => `<p>Certaines créatures apprennent un métier là où on les poste (dans leur fiche, « Poste »), ou en montant la garde (mode Gardes). Chaque nuit passée à travailler (sans bouder) fait progresser : <b>apprenti·e</b> (${CRAFT_LVLS[1].n} points), <b>compagnon·ne</b> (${CRAFT_LVLS[2].n}), <b>maître·sse</b> (${CRAFT_LVLS[3].n}). Les créatures nées pour un métier apprennent deux fois plus vite. Une nuit ailleurs (raid, expédition, combat loin de son poste, ou sonnée) fait perdre un point, mais jamais un grade acquis ; une sentinelle qui se bat à son poste, elle, apprend encore plus.</p>
  <p>Tant qu’ils travaillent, les gens d’un métier comptent 1 (apprenti·e), 2 (compagnon·ne) ou 3 points (maître·sse) chacun. Un·e compagnon·ne débloque le savoir de rang 2, un·e maître·sse celui de rang 3 : ils restent à toi pour toujours.</p>
  <ul>${Object.values(WORKSHOPS).map(W => `<li><b>${W.trade[0].toUpperCase() + W.trade.slice(1)}</b>, ${W.guard ? 'en montant la garde' : `à la {room:${W.room}}`} : ${Object.keys(W.sp).filter(sp => SPECIES[sp]).map(sp => `{sp:${sp}}${W.sp[sp] > 1 ? ' (né·e pour ça)' : ''}`).join(', ')}.<br>Au travail : ${W.live()}.<br>Rang 2, ${esc(W.ranks[2].t)} : ${esc(W.ranks[2].d())}. Rang 3, ${esc(W.ranks[3].t)} : ${esc(W.ranks[3].d())}.</li>`).join('')}</ul>` };
