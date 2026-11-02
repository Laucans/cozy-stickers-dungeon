
/* =========================================================
   Atelier du Maître — Économie, Bac à sable, Rendu, Idées,
   Atelier IA, Données
   ========================================================= */
function cell(t, k, f, type = 'num', o = {}) {
  const v = getv(t, k, f), b = `${t}|${k}|${f}|${type}`;
  const input = type === 'text' ? `<input type="text" value="${esc(v ?? '')}" data-b="${b}">` : type === 'sel' ? `<select data-b="${b}">${o.opts.map(([val, lab]) => `<option value="${esc(val)}"${String(v ?? '') === String(val) ? ' selected' : ''}>${esc(lab)}</option>`).join('')}</select>` : `<input type="number" step="${o.step || 1}" value="${v ?? ''}" data-b="${b}">`;
  return `<td class="${isChanged(t, k, f) ? 'chg' : ''}">${input}</td>`;
}
const row = (label, value, tone = '') => `<li class="${tone}"><span>${label}</span><b>${value}</b></li>`;

/* ---------- Économie ---------- */
ADMIN_TABS.eco = body => {
  body.innerHTML = `<h2>Équilibrage</h2>
    <h3>Constantes du jeu</h3><div class="afgrid">${fld('CONST', 0, 'CAL_MAX', 'Calamité : taille de l’horloge', 'num', { min: 3, max: 20 })}${fld('CONST', 0, 'MENACE_MAX', 'Menace : taille de l’horloge', 'num', { min: 2, max: 20 })}${fld('CONST', 0, 'START_GOLD', 'Or de départ', 'num', { min: 0 })}${fld('CONST', 0, 'START_MAT', 'Matériaux de départ', 'num', { min: 0 })}${fld('CONST', 0, 'WORK', 'Travaux de base par nuit', 'num', { min: 0, max: 12 })}</div>
    <h3>Paliers</h3><div class="tscroll"><table class="atable"><thead><tr><th>Palier</th><th>Pièces</th><th>Notoriété</th><th>Espèces</th><th>Or</th><th>Matériaux</th></tr></thead><tbody>${[1, 2, 3].map(i => `<tr><th>${i}</th>${cell('TIERS', i, 'need.rooms')}${cell('TIERS', i, 'need.hype')}${cell('TIERS', i, 'need.species')}${cell('TIERS', i, 'cost.g')}${cell('TIERS', i, 'cost.s')}</tr>`).join('')}</tbody></table></div>
    <h3>Cibles de raid</h3><div class="tscroll"><table class="atable"><thead><tr><th>Cible</th><th>Palier</th><th>Risque</th><th>Spécialité</th><th>Or</th><th>Mat.</th><th>Notoriété</th><th>Menace</th></tr></thead><tbody>${Object.keys(RAIDS).map(k => `<tr>${cell('RAIDS', k, 'name', 'text')}${cell('RAIDS', k, 'tier')}${cell('RAIDS', k, 'risk')}${cell('RAIDS', k, 'tag', 'sel', { opts: Object.entries(TAGS) })}${cell('RAIDS', k, 'reward.g')}${cell('RAIDS', k, 'reward.s')}${cell('RAIDS', k, 'hype')}${cell('RAIDS', k, 'menace')}</tr>`).join('')}</tbody></table></div>
    <h3>Aventuriers</h3><div class="tscroll"><table class="atable"><thead><tr><th></th><th>Nom</th><th>Courage</th></tr></thead><tbody>${HEROES.map(h => `<tr><th><img class="th mini" alt="" src="${thumb('hero', h.k)}"></th>${cell('HEROES', h.k, 'name', 'text')}${cell('HEROES', h.k, 'c')}</tr>`).join('')}</tbody></table></div>
    <p class="hint">Taille d’une bande : 2 + palier (+1 au-delà de 10 de notoriété), 5 au maximum. Courage : somme des héros + 2 × palier + notoriété ÷ 5.</p>
    <h2>Analyse du château <button type="button" class="sbtn" data-act="tab" data-arg="eco">Actualiser</button></h2><div id="analysis">${analysisHTML()}</div>`;
};
function analysisHTML() {
  const parts = { gold: [], mat: [], hype: [] };
  builtRooms().forEach(r => ['gold', 'mat', 'hype'].forEach(k => { const v = rstat(r, k); if (v) parts[k].push(`${ROOMS[r.t].name} ${v}`); }));
  homeCreatures().forEach(c => ['gold', 'mat', 'hype'].forEach(k => { const v = (SPECIES[c.sp][k] || 0) * mult(c); if (v) parts[k].push(`${c.name} ${v}`); }));
  const tot = k => sumRooms(k) + sumCrit(k), cd = calamityDelta(), pp = partyPreview();
  let plan = null; try { plan = planInvasion(); } catch (e) {}
  const dmg = plan ? plan.steps.reduce((a, s) => a + s.dmg, 0) : 0;
  const hungry = hungrySet(), amb = ambiance();
  const team = [...homeCreatures()].filter(c => SPECIES[c.sp].dice).sort((a, b) => SPECIES[b.sp].dice - SPECIES[a.sp].dice).slice(0, 3).map(c => c.id);
  return `<div class="cols">
    <section><h3>Prochaine aube</h3><ul class="kvl">${row('💰 Or', `+${tot('gold') + S.prisoners * 4}`)}${row('🪵 Matériaux', `+${tot('mat')}`)}${row('🔥 Notoriété', `+${tot('hype')}`)}${row('🔨 Travaux', `${CONSTS.WORK + sumCrit('build')} segments`)}</ul>
      <p class="hint">Or : ${parts.gold.join(', ') || '—'}<br>Matériaux : ${parts.mat.join(', ') || '—'}<br>Notoriété : ${parts.hype.join(', ') || '—'}</p></section>
    <section><h3>Bien-être</h3><ul class="kvl">${row('🍲 Repas', `${eaters()}/${foodCap()}`, eaters() > foodCap() ? 'bad' : '')}${row('🛏️ Lits', `${S.creatures.length}/${beds()}`, S.creatures.length >= beds() ? 'warn' : '')}${row('🕯️ Ambiance', amb)}${row('🌀 Calamité', `${S.calamity}/${CAL_MAX} (${cd.d >= 0 ? '+' : ''}${cd.d} cette nuit)`, cd.d > 0 ? 'bad' : '')}</ul><p class="hint">${cd.parts.join(' · ') || 'Aucune pression.'}</p></section>
    <section><h3>Prochaine invasion</h3><ul class="kvl">${row('⚔️ Menace', `${S.menace}/${MENACE_MAX}`)}${row('Bande', `${pp.size} héros, ~${pp.courage} courage`)}${row('Dégâts de tes défenses', dmg, dmg >= pp.courage ? 'good' : 'bad')}${row('Verdict', dmg >= pp.courage ? 'repoussée' : 'le Cœur serait pillé', dmg >= pp.courage ? 'good' : 'bad')}</ul>
      <p class="hint">${plan ? plan.steps.map(s => `${esc(s.label)} −${s.dmg}`).join(' · ') : 'Aucun chemin vers le Cœur.'}</p></section>
    <section><h3>Raids avec ta meilleure équipe</h3><ul class="kvl">${Object.keys(RAIDS).map(k => { const b = raidBreakdown(k, team); return row(`${RAIDS[k].emo} ${esc(RAIDS[k].name)}${RAIDS[k].tier > S.tier ? ' 🔒' : ''}`, `${Math.max(0, b.pool)} dé${b.pool > 1 ? 's' : ''}`); }).join('')}</ul><p class="hint">${team.length ? 'Équipe : ' + team.map(id => esc(S.creatures.find(c => c.id === id).name)).join(', ') : 'Personne ne peut partir en raid.'}</p></section>
  </div>
  <h3>Humeurs</h3><div class="tscroll"><table class="atable ro"><thead><tr><th>Créature</th><th>Humeur</th><th>Visée</th><th>Ce qui compte</th></tr></thead><tbody>${S.creatures.map(c => { const mf = moodFactors(c, hungry, amb); return `<tr><td>${esc(c.name)} <small class="hint">${SPECIES[c.sp].name}</small></td><td>${c.mood}/5</td><td>${mf.target}/5</td><td class="hint">${mf.f.filter(x => x[1]).map(x => `${x[1] > 0 ? '+' : ''}${x[1]} ${esc(x[0])}`).join(' · ')}</td></tr>`; }).join('')}</tbody></table></div>`;
}

/* ---------- Bac à sable ---------- */
ADMIN_TABS.sandbox = body => {
  const sOpts = SPECIES_ORDER.map(k => `<option value="${k}">${esc(SPECIES[k].name)}</option>`).join('');
  body.innerHTML = `<h2>Bac à sable <small class="hint">agit sur ta partie en cours</small></h2>
    <h3>Ressources et horloges</h3><div class="afgrid">${[['gold', 'Or'], ['mat', 'Matériaux'], ['hype', 'Notoriété'], ['calamity', 'Calamité'], ['menace', 'Menace'], ['night', 'Nuit'], ['tier', 'Palier']].map(([k, l]) => `<label class="af"><span>${l}</span><input type="number" min="0" value="${S[k]}" data-s="${k}"></label>`).join('')}</div>
    <h3>Créatures</h3><div class="btnrow"><select class="sel" id="sbSp">${sOpts}</select><input type="number" class="sel" id="sbN" value="1" min="1" max="10" style="width:70px" aria-label="Nombre"><button type="button" class="sbtn pri" data-act="sbSpawn">Faire apparaître</button>
      <button type="button" class="sbtn" data-act="sbMood" data-arg="5">Tout le monde ravi</button><button type="button" class="sbtn" data-act="sbMood" data-arg="0">Tout le monde furieux</button><button type="button" class="sbtn danger" data-act="sbClear">Renvoyer tout le monde</button></div>
    <h3>Construction</h3><div class="btnrow"><button type="button" class="sbtn" data-act="sbBuild">Finir tous les chantiers</button><button type="button" class="sbtn" data-act="sbStickers">+5 de chaque sticker</button><button type="button" class="sbtn" data-act="sbAlbum">Remplir l'album</button><button type="button" class="sbtn" data-act="sbGoals">Valider toutes les envies</button></div>
    <h3>Événements</h3><div class="btnrow"><button type="button" class="sbtn pri" data-act="sbInvade">Lancer une invasion maintenant</button><button type="button" class="sbtn" data-act="sbNight">Finir la nuit</button><button type="button" class="sbtn" data-act="sbCalam">Déclencher une calamité</button></div>
    <h3>Sauvegarde de la partie</h3><div class="btnrow"><button type="button" class="sbtn" data-act="sbExport">Copier la sauvegarde</button><button type="button" class="sbtn" data-act="sbImport">Charger la sauvegarde collée</button><button type="button" class="sbtn danger" data-act="sbNew">Nouvelle partie</button></div>
    <textarea class="code" id="sbSave" rows="4" placeholder="Colle ici une sauvegarde (JSON) puis « Charger »."></textarea>`;
};
Object.assign(ACTIONS, {
  sbSpawn: () => spawnCreature($('#sbSp').value, clamp(+$('#sbN').value || 1, 1, 10)),
  sbMood: v => { S.creatures.forEach(c => { c.mood = +v; }); afterChange(); toast('Humeurs modifiées.'); },
  sbClear: (a, btn) => confirmBtn(btn, 'Sûr ? Tout le monde dehors', () => { S.creatures.forEach(c => critterLeave(c.id)); S.creatures = []; afterChange(); }),
  sbBuild: () => { S.rooms.forEach(r => { if (!r.built) { r.built = true; r.prog = ROOMS[r.t].clock; poof(r.x, r.y, r.w, r.h); } }); dirty(); afterChange(); toast('Tous les chantiers sont terminés.'); },
  sbStickers: () => { [...Object.keys(FURN), ...Object.keys(DEFS)].forEach(k => { S.free[k] = (S.free[k] || 0) + 5; }); afterChange(); toast('+5 de chaque meuble, déco et piège.'); },
  sbAlbum: () => { SPECIES_ORDER.forEach(k => { S.album[k] = true; }); afterChange(); },
  sbGoals: () => { GOALS.forEach(g => { S.goals[g.id] = true; }); afterChange(); },
  sbInvade: async () => { if (UI.busy) return; minimizeAdmin(); UI.busy = true; document.body.classList.add('busy'); const rep = []; try { await runInvasion(rep); } catch (e) { console.error(e); } UI.busy = false; document.body.classList.remove('busy'); save(); renderAll(); openModal(`<h2>Invasion de test</h2><ul class="chron">${rep.map(([e, t, tone]) => `<li class="${tone}"><span class="emo">${e}</span><span>${esc(t)}</span></li>`).join('')}</ul>`); },
  sbNight: () => { closeAdmin(); endNight(); },
  sbCalam: () => { const ev = pick(CALAMITIES.filter(c => c.when())), txt = ev.run(); addLog(txt, 'bad'); afterChange(); toast('💥 ' + txt, true); },
  sbExport: () => { const a = $('#sbSave'); a.value = JSON.stringify(S); copyText(a.value, a); },
  sbImport: () => { try { const s = JSON.parse($('#sbSave').value); if (!s || s.v !== 2 || !Array.isArray(s.rooms)) throw 0; S = s; resetActors(); dirty(); afterChange(); toast('Sauvegarde chargée.'); } catch (e) { toast('Ce texte n’est pas une sauvegarde valide.', true); } },
  sbNew: (a, btn) => confirmBtn(btn, 'Sûr ? Tout effacer', () => { wipe(); resetActors(); newState(); closeAdmin(); renderAll(); fitCamera(); openIntro(); }),
});
function bindSandboxFields() {
  $('#admin').addEventListener('change', e => { const k = e.target.dataset && e.target.dataset.s; if (!k) return; const v = Math.max(0, Math.round(+e.target.value || 0)); S[k] = k === 'tier' ? clamp(v, 0, 3) : k === 'night' ? Math.max(1, v) : v; afterChange(); });
}

/* ---------- Rendu ---------- */
ADMIN_TABS.render = body => {
  const floors = [['wood', 'taverne', 'Parquet'], ['straw', 'dortoir', 'Paille'], ['flag', 'couloir', 'Dalles'], ['checker', 'cuisine', 'Carrelage'], ['carpet', 'bibli', 'Tapis'], ['garden', 'potager', 'Potager'], ['magic', 'coeur', 'Runes']];
  body.innerHTML = `<h2>Rendu</h2>
    <h3>Lumière et atmosphère <small class="hint">appliqué en direct</small></h3><div class="afgrid">${fld('TUNE', 0, 'ambient', 'Pénombre', 'range', { min: 0, max: .95, step: .01 })}${fld('TUNE', 0, 'glow', 'Halo des lumières', 'range', { min: 0, max: 1.6, step: .02 })}${fld('TUNE', 0, 'lightScale', 'Portée des lumières', 'range', { min: .4, max: 2.2, step: .05 })}${fld('TUNE', 0, 'vignette', 'Vignettage', 'range', { min: 0, max: .9, step: .01 })}${fld('TUNE', 0, 'dust', 'Poussière (particules)', 'range', { min: 0, max: 220, step: 5 })}${fld('TUNE', 0, 'particles', 'Particules', 'bool')}</div>
    <h3>Débogage</h3><div class="afgrid">${fld('TUNE', 0, 'dbgGrid', 'Grille et coordonnées', 'bool')}${fld('TUNE', 0, 'dbgDoors', 'Portes', 'bool')}${fld('TUNE', 0, 'dbgLights', 'Rayons des lumières', 'bool')}${fld('TUNE', 0, 'fps', 'Images par seconde', 'bool')}</div>
    <p class="hint">Astuce : « Réduire » l'atelier pour voir le château pendant que tu règles.</p>
    <h3>Sols</h3><div class="gal">${floors.map(([f, t, l]) => { const c = roomTexture({ id: 'gal-' + f, t, w: 1, h: 1, built: true }); return `<figure><img alt="" src="${c.toDataURL()}"><figcaption>${l} <small>${f}</small></figcaption></figure>`; }).join('')}</div>
    <h3>Murs</h3><div class="gal">${[['full', 'Mur'], ['low', 'Muret'], ['ramp', 'Rempart'], ['hedge', 'Haie']].map(([k, l]) => `<figure><img alt="" src="${texWall(k, 0).toDataURL()}"><figcaption>${l} <small>${k}</small></figcaption></figure>`).join('')}</div>
    <h3>Couleurs de lumière</h3><div class="gal sw">${Object.entries(LCOL).map(([k, v]) => `<figure><span class="swatch" style="background:rgb(${v})"></span><figcaption>${k}</figcaption></figure>`).join('')}</div>
    <h3>Palette des objets</h3><div class="gal sw">${Object.entries(PAL).map(([k, v]) => `<figure><span class="swatch" style="background:${v}"></span><figcaption>${k} <small>${v}</small></figcaption></figure>`).join('')}</div>
    <h3>Icônes</h3><div class="gal ico">${Object.keys(ICON_DRAW).map(k => `<figure><img alt="" src="${iconURL(k)}"><figcaption>${k}</figcaption></figure>`).join('')}</div>`;
};

/* ---------- Idées ---------- */
const IDEA_CATS = ['Créature', 'Pièce', 'Meuble', 'Mécanique', 'Graphisme', 'Interface', 'Histoire', 'Bug'];
const IDEA_ST = [['todo', 'À faire'], ['doing', 'En cours'], ['done', 'Fait']];
ADMIN_TABS.ideas = body => {
  const list = ADMIN.ideas;
  body.innerHTML = `<h2>Idées pour la suite</h2><p class="hint">${ADMIN.mode === 'db' ? 'Ces idées sont enregistrées avec le jeu : Claude peut les lire pour les réaliser.' : 'Ici, ces idées sont gardées dans ce navigateur.'}</p>
    <div class="ideaform"><input type="text" id="idT" maxlength="80" placeholder="Titre (ex. Une salle de bains pour les trolls)"><select class="sel" id="idC">${IDEA_CATS.map(c => `<option>${c}</option>`).join('')}</select><select class="sel" id="idP"><option value="2">Priorité moyenne</option><option value="3">Priorité haute</option><option value="1">Priorité basse</option></select>
      <textarea id="idB" rows="2" maxlength="600" placeholder="Détails : ce que ça change dans le jeu, à quoi ça ressemble…"></textarea><button type="button" class="sbtn pri" data-act="idAdd">Ajouter l'idée</button></div>
    <div class="ideas">${IDEA_ST.map(([st, lab]) => `<section><h3>${lab} <small class="hint">${list.filter(i => (i.status || 'todo') === st).length}</small></h3>${list.filter(i => (i.status || 'todo') === st).sort((a, b) => (b.prio || 2) - (a.prio || 2)).map(i => `<article class="idea p${i.prio || 2}"><b>${esc(i.title || '')}</b><small>${esc(i.cat || '')}</small><p>${esc(i.body || '')}</p><div class="btnrow">${IDEA_ST.filter(([s]) => s !== st).map(([s, l]) => `<button type="button" class="pill" data-act="idSt" data-arg="${i.id}|${s}">→ ${l}</button>`).join('')}<button type="button" class="pill" data-act="idDel" data-arg="${i.id}">Supprimer</button></div></article>`).join('') || '<p class="hint">Rien ici.</p>'}</section>`).join('')}</div>`;
};
Object.assign(ACTIONS, {
  idAdd: async () => { const title = $('#idT').value.trim(); if (!title) { toast('Donne un titre à ton idée.', true); return; } try { await ideaAdd({ title, body: $('#idB').value.trim(), cat: $('#idC').value, prio: +$('#idP').value, status: 'todo', at: Date.now() }); toast('Idée ajoutée.'); } catch (e) { toast('Impossible d’enregistrer l’idée.', true); } },
  idSt: async arg => { const [id, st] = arg.split('|'); try { await ideaUpd(id, { status: st }); } catch (e) { toast('Mise à jour impossible.', true); } },
  idDel: async (id, btn) => confirmBtn(btn, 'Sûr ?', async () => { try { await ideaDel(id); } catch (e) { toast('Suppression impossible.', true); } }),
});

/* ---------- Atelier IA ---------- */
ADMIN_TABS.ai = body => {
  if (!ADMIN.sample) { body.innerHTML = `<h2>Atelier IA</h2><p>Décris une créature en une phrase et Claude invente sa fiche complète : compétence, statistiques, répliques et apparence.</p><p class="hint">Indisponible ici : cette fonction marche dans le jeu publié sur claude.ai, pour qui peut le modifier.</p>`; return; }
  const g = ADMIN.gen;
  body.innerHTML = `<h2>Atelier IA</h2><p>Décris une créature et Claude invente sa fiche : pièce qui l’attire, compétence, statistiques équilibrées, répliques et apparence. Tu peux ensuite la retoucher dans l’onglet Sprites.</p>
    <div class="ideaform"><textarea id="aiP" rows="3" maxlength="400" placeholder="Ex. : un champignon ronchon qui fait pousser des truffes dans le Potager et déteste les gobelins">${esc(ADMIN.genPrompt || '')}</textarea><button type="button" class="sbtn pri" data-act="aiGen" id="aiGo">✨ Inventer la créature</button></div>
    <div id="aiOut">${g ? `<div class="adm-split gen"><div>${prevBox()}</div><div><h2>${esc(g.sp.name)}</h2><p><b>${esc(g.sp.skill)}</b> : ${esc(g.sp.sd)}</p>
      <ul class="kvl">${row('Attirée par', esc((ROOMS[g.sp.from] || {}).name || g.sp.from))}${row('Garde / dés', `${g.sp.guard} / ${g.sp.dice}`)}${row('Spécialité', TAGS[g.sp.tag] || '—')}${row('Adore', esc(itemName(g.sp.likes)))}${['gold', 'mat', 'hype', 'cal', 'amb', 'build'].filter(k => g.sp[k]).map(k => row(k, '+' + g.sp[k])).join('')}</ul>
      <p class="hint">${g.sp.lines.map(l => '« ' + esc(l) + ' »').join('<br>')}</p><div class="btnrow"><button type="button" class="sbtn pri" data-act="aiAdd">Ajouter au jeu</button><button type="button" class="sbtn" data-act="aiGen">Une autre idée</button></div></div></div>` : ''}</div>`;
  if (g) startPreview($('#admPrev'), 'char', '__gen');
};
function normGen(o) {
  o = o || {}; const a = o.art || {};
  const n = (v, lo, hi, d = 0) => { v = Math.round(+v); return isNaN(v) ? d : clamp(v, lo, hi); };
  const one = (v, list, d) => list.includes(v) ? v : d, hex = v => /^#[0-9a-f]{6}$/i.test(v || '') ? v : null;
  const rooms = Object.keys(ROOMS).filter(k => !isHall({ t: k }));
  const sp = { name: String(o.name || 'Créature').slice(0, 24), from: one(o.from, rooms, 'dortoir'), tier: n(o.tier, 0, 2), guard: n(o.guard, 0, 5, 1), dice: n(o.dice, 0, 3, 1), tag: one(o.tag, Object.keys(TAGS), 'ruse'),
    likes: one(o.likes, Object.keys(FURN), 'torche'), skill: String(o.skill || 'Talent mystère').slice(0, 32), sd: String(o.sd || '').slice(0, 180), lines: (Array.isArray(o.lines) ? o.lines : []).map(String).filter(Boolean).slice(0, 4) };
  if (!sp.lines.length) sp.lines = ['…'];
  ['gold', 'mat', 'hype', 'cal', 'amb', 'build'].forEach(k => { const v = n(o[k], 0, 2); if (v) sp[k] = v; });
  if (+o.eats === 2) sp.eats = 2; if (o.rival && SPECIES[o.rival]) sp.rival = o.rival;
  const art = { sc: clamp(+a.sc || 1, .7, 1.35), skin: hex(a.skin) || '#86bd45', body: hex(a.body) || '#7d5f3d', ears: one(a.ears, ART_OPTS.ears.map(x => x[0]), ''), eyes: one(a.eyes, ART_OPTS.eyes.map(x => x[0]), 'normal'),
    nose: one(a.nose, ART_OPTS.nose.map(x => x[0]), 'small'), mouth: one(a.mouth, ART_OPTS.mouth.map(x => x[0]), 'grin'), hat: one(a.hat, ART_OPTS.hat.map(x => x[0]), ''), hairStyle: one(a.hairStyle, ART_OPTS.hairStyle.map(x => x[0]), ''), item: one(a.item, ART_OPTS.item.map(x => x[0]), '') };
  ['iris', 'hair', 'hatc', 'belly', 'cape', 'wings', 'tail', 'horns', 'beard'].forEach(k => { if (hex(a[k])) art[k] = a[k]; });
  if (art.hat && !art.hatc) art.hatc = '#6a4a8a'; if (art.hairStyle && !art.hair) art.hair = '#4a3020'; if (a.brow) art.brow = true;
  return { sp, art };
}
Object.assign(ACTIONS, {
  aiGen: async () => {
    const p = ($('#aiP') ? $('#aiP').value : ADMIN.genPrompt || '').trim(); if (!p) { toast('Décris d’abord ta créature.', true); return; }
    ADMIN.genPrompt = p; const btn = $('#aiGo'); if (btn) { btn.disabled = true; btn.textContent = 'Claude imagine…'; }
    const rooms = Object.keys(ROOMS).filter(k => !isHall({ t: k })).map(k => `${k} (${ROOMS[k].name})`).join(', ');
    const prompt = `Tu es game designer du jeu « Cozy Stickers Dungeon » : un château maléfique mais douillet, humour de fantasy parodique à la française. Invente UNE créature d'après la demande du joueur. Réponds uniquement en JSON avec ces champs :
{"name": nom court en français, "from": clé de la pièce qui l'attire parmi [${rooms}], "tier": 0 à 2, "guard": 0 à 5, "dice": 0 à 3, "tag": "pillage"|"ruse"|"combat"|"magie", "likes": clé d'un meuble ou d'une déco parmi [${Object.keys(FURN).join(', ')}], "rival": clé d'une espèce existante parmi [${SPECIES_ORDER.join(', ')}] ou null, "skill": nom de compétence, "sd": description de la compétence (une phrase), au plus deux bonus parmi "gold","mat","hype","cal","amb","build" (valeur 1 ou 2), "eats": 1 ou 2, "lines": 3 répliques drôles et courtes en français,
"art": {"sc": taille 0.7 à 1.35, "skin": couleur hex, "body": couleur hex, "iris": hex, "ears": ""|"pointy"|"big"|"long"|"small", "eyes": "normal"|"derp"|"glow"|"sockets", "nose": "small"|"big"|"huge"|"long"|"snout"|"none", "mouth": "grin"|"teeth"|"tusks"|"fangs"|"smug"|"o", "hat": ""|"wizard"|"witch"|"helmet"|"horned"|"bucket"|"hood"|"straw"|"feather"|"bandana", "hatc": hex, "hairStyle": ""|"spiky"|"slick"|"long"|"wild", "hair": hex, "item": ""|"hammer"|"sack"|"wrench"|"ladle"|"broom"|"lute"|"sword"|"axe"|"bow"|"staff"|"dagger"|"pitchfork", "belly": hex ou absent, "cape": hex ou absent, "wings": hex ou absent, "horns": hex ou absent, "beard": hex ou absent, "brow": true|false}}
Reste équilibré : plus une créature est forte, plus son palier est haut. Demande du joueur : ${p}`;
    try {
      const raw = await ADMIN.sample.json(prompt, { modelTier: 'default' });
      ADMIN.gen = normGen(raw); CHAR.__gen = ADMIN.gen.art; [...SPR.keys()].filter(k => k.includes('__gen')).forEach(k => SPR.delete(k)); renderAdminTab();
    } catch (e) {
      if (btn) { btn.disabled = false; btn.textContent = '✨ Inventer la créature'; }
      toast(e && e.code === 'rate_limited' ? 'Trop de demandes d’un coup : réessaie dans un moment.' : e && e.code === 'not_granted' ? 'L’accès à Claude n’est pas autorisé pour cette page.' : 'Claude n’a pas pu inventer la créature cette fois.', true);
    }
  },
  aiAdd: () => { const g = ADMIN.gen; if (!g) return; const key = uniqueKey(g.sp.name, SPECIES); addEntry('SPECIES', key, g.sp); addEntry('CHAR', key, g.art); delete CHAR.__gen; ADMIN.gen = null; ADMIN.tab = 'sprites'; ADMIN.cat = 'char'; ADMIN.sel = { kind: 'char', key }; renderAdmin(); toast(`${g.sp.name} rejoint le jeu. Pense à enregistrer.`); },
});

/* ---------- Données ---------- */
function diffLines() {
  const out = [];
  for (const [t, es] of Object.entries(OVR)) for (const [k, fs] of Object.entries(es || {})) {
    if (fs && fs.__new) { out.push(`Nouveau dans ${t} : « ${fs.name || k} » (clé ${k})`); continue; }
    const b = baseOf(t, k) || {};
    for (const [f, v] of Object.entries(fs || {})) out.push(`${t} › ${t === 'TUNE' || t === 'CONST' ? '' : k + ' › '}${f} : ${JSON.stringify(b[f])} → ${JSON.stringify(v)}`);
  }
  return out;
}
ADMIN_TABS.data = body => {
  const d = diffLines(), js = JSON.stringify(OVR, null, 2);
  body.innerHTML = `<h2>Données</h2>
    <h3>Tes réglages (${d.length})</h3>${d.length ? `<ul class="diff">${d.map(l => `<li>${esc(l)}</li>`).join('')}</ul>` : '<p class="hint">Aucun réglage : le jeu tourne avec ses valeurs d’origine.</p>'}
    <div class="btnrow"><button type="button" class="sbtn pri" data-act="dCopySum">Copier un résumé pour Claude</button><button type="button" class="sbtn" data-act="dCopy">Copier le JSON</button><button type="button" class="sbtn" data-act="dDl">Télécharger le JSON</button><button type="button" class="sbtn danger" data-act="dReset">Tout réinitialiser</button></div>
    <p class="hint">${ADMIN.mode === 'db' ? 'Une fois enregistrés, ces réglages sont stockés avec le jeu : tu peux simplement me demander de les intégrer au code.' : 'Ces réglages vivent dans ce navigateur : copie le résumé pour me le transmettre.'}</p>
    <textarea class="code" id="dJson" rows="8" spellcheck="false">${esc(js)}</textarea>
    <div class="btnrow"><button type="button" class="sbtn" data-act="dImport">Appliquer le JSON ci-dessus</button></div>
    <h3>Toutes les données du jeu</h3><p class="hint">Créatures, pièces, meubles, pièges, raids, héros et paliers tels qu’ils tournent en ce moment (valeurs d’origine + tes réglages).</p>
    <div class="btnrow"><button type="button" class="sbtn" data-act="dAll">Copier toutes les données</button></div>`;
};
Object.assign(ACTIONS, {
  dCopy: () => copyText(JSON.stringify(OVR, null, 2), $('#dJson')),
  dCopySum: () => { const t = `Réglages de l'Atelier du Maître pour Cozy Stickers Dungeon (${diffLines().length}) :\n- ${diffLines().join('\n- ')}\n\nJSON :\n${JSON.stringify(OVR)}`; const a = $('#dJson'); a.value = t; copyText(t, a); },
  dDl: () => downloadText('cozy-stickers-dungeon-reglages.json', JSON.stringify(OVR, null, 2)),
  dImport: () => { try { const o = JSON.parse($('#dJson').value); if (!o || typeof o !== 'object' || Array.isArray(o)) throw 0; OVR = o; scheduleApply(true); toast('Réglages appliqués. Enregistre pour les garder.'); } catch (e) { toast('Ce JSON n’est pas valide.', true); } },
  dReset: (a, btn) => confirmBtn(btn, 'Sûr ? Valeurs d’origine', () => { OVR = {}; scheduleApply(true); toast('Toutes les valeurs d’origine sont revenues. Enregistre pour l’appliquer à tous.'); }),
  dAll: () => { const data = { SPECIES, CHAR, HERO_ART, ROOMS, FURN, DEFS, RAIDS, HEROES, TIERS: TIERS.slice(1), LIGHTS, CONST: { CAL_MAX, MENACE_MAX, ...CONSTS } }; const t = JSON.stringify(data, null, 2); const a = $('#dJson'); a.value = t; copyText(t, a); },
});
