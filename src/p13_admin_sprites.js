
/* =========================================================
   Atelier du Maître — onglets Sprites et Pièces
   ========================================================= */
const slug = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'perso';
function uniqueKey(base, table) { let k = slug(base), i = 2; while (table[k]) k = slug(base) + i++; return k; }
const ART_OPTS = {
  ears: [['', 'aucune'], ['pointy', 'pointues'], ['big', 'grandes'], ['long', 'elfiques'], ['small', 'petites']],
  eyes: [['normal', 'normaux'], ['derp', 'qui louchent'], ['glow', 'lumineux'], ['sockets', 'orbites vides']],
  nose: [['small', 'petit'], ['big', 'gros'], ['huge', 'énorme'], ['long', 'crochu'], ['snout', 'museau'], ['none', 'aucun']],
  mouth: [['grin', 'sourire'], ['teeth', 'dents'], ['tusks', 'défenses'], ['fangs', 'crocs'], ['smug', 'moue'], ['o', 'bouche bée']],
  hat: [['', 'aucun'], ['wizard', 'mage'], ['witch', 'sorcière'], ['helmet', 'casque'], ['horned', 'casque à cornes'], ['bucket', 'heaume'], ['hood', 'capuche'], ['straw', 'paille'], ['feather', 'plume'], ['bandana', 'bandana']],
  hairStyle: [['', 'aucune'], ['spiky', 'en pétard'], ['slick', 'plaquée'], ['long', 'longue'], ['wild', 'sauvage']],
  item: [['', 'rien'], ['hammer', 'marteau'], ['sack', 'sac'], ['wrench', 'clé'], ['ladle', 'louche'], ['broom', 'balai'], ['lute', 'luth'], ['sword', 'épée'], ['axe', 'hache'], ['bow', 'arc'], ['staff', 'bâton'], ['dagger', 'dague'], ['pitchfork', 'fourche'], ['wand', 'baguette'], ['scarfstaff', 'bâton et écharpe'], ['cutlery', 'couverts et bavoir'], ['seashell', 'coquillage et algues']],
};
const COLOR_FIELDS = [['skin', 'Peau', 0], ['body', 'Corps', 0], ['belly', 'Ventre', 1], ['legs', 'Jambes', 1], ['iris', 'Iris', 1], ['hair', 'Cheveux', 1], ['beard', 'Barbe', 1], ['hatc', 'Chapeau', 1], ['cape', 'Cape', 1], ['wings', 'Ailes', 1], ['tail', 'Queue', 1], ['horns', 'Cornes', 1]];
const STAT_FIELDS = [['guard', 'Garde'], ['dice', 'Dés de raid'], ['eats', 'Mange (rations)'], ['build', 'Travaux / nuit'], ['gold', 'Or / nuit'], ['mat', 'Bois / nuit'], ['hype', 'Bouche-à-oreille / nuit'], ['cal', 'Calamité −'], ['amb', 'Ambiance'], ['trap', 'Bonus pièges']];
const FURN_STATS = [['beds', 'Lits'], ['food', 'Repas'], ['gold', 'Or / nuit'], ['mat', 'Bois / nuit'], ['hype', 'Bouche-à-oreille / nuit'], ['amb', 'Ambiance'], ['cal', 'Calamité −'], ['guard', 'Garde'], ['harass', 'Harcèlement'], ['dice', 'Dés de raid'], ['cells', 'Places de prison']];
const SPR_CATS = [['char', 'Créatures'], ['hero', 'Héros'], ['furn', 'Meubles'], ['decor', 'Déco'], ['def', 'Pièges'], ['x', 'Extérieur']];
function catItems(cat) {
  if (cat === 'char') return SPECIES_ORDER.map(k => ['char', k, SPECIES[k].name]);
  if (cat === 'hero') return HEROES.map(h => ['hero', h.k, h.name]);
  if (cat === 'furn') return FURN_ORDER.map(k => ['furn', k, FURN[k].name]);
  if (cat === 'decor') return DECOR_ORDER.map(k => ['furn', k, FURN[k].name]);
  if (cat === 'def') return DEF_ORDER.map(k => ['def', k, DEFS[k].name]);
  return Object.keys(XDRAW).map(k => ['x', k, { scaffold: 'Échafaudage', tree: 'Chêne', pine: 'Sapin', rock: 'Rocher', bush: 'Buisson', brazier: 'Brasero', poule: 'Poule', souche: 'Souche', fougere: 'Fougères' }[k] || k]);
}
const tableOfKind = kind => kind === 'char' ? 'SPECIES' : kind === 'hero' ? 'HEROES' : kind === 'furn' ? 'FURN' : kind === 'def' ? 'DEFS' : null;

ADMIN_TABS.sprites = body => {
  const items = catItems(ADMIN.cat);
  if (!items.some(([k, key]) => k === ADMIN.sel.kind && key === ADMIN.sel.key) && items[0]) ADMIN.sel = { kind: items[0][0], key: items[0][1] };
  body.innerHTML = `<div class="adm-split"><aside class="adm-list">
    <div class="adm-cats">${SPR_CATS.map(([k, l]) => `<button type="button" class="pill${ADMIN.cat === k ? ' on' : ''}" data-act="cat" data-arg="${k}">${l}</button>`).join('')}</div>
    <div class="adm-grid">${items.map(([kind, key, name]) => { const t = tableOfKind(kind); return `<button type="button" class="spc${ADMIN.sel.kind === kind && ADMIN.sel.key === key ? ' on' : ''}" data-act="pick" data-arg="${kind}|${key}"><img alt="" src="${thumb(kind, key)}"><b>${esc(name)}</b><small>${esc(key)}${t && isCustom(t, key) ? ' · créé' : ''}${t && OVR[t] && OVR[t][key] && !isCustom(t, key) ? ' · modifié' : ''}</small></button>`; }).join('')}</div>
    <p class="hint">${items.length} sprites. Tous sont dessinés par le code : aucune image externe.</p></aside>
    <div class="adm-detail" id="sprDetail"></div></div>`;
  renderSpriteDetail();
};
function prevBox() {
  return `<div class="prevbox"><canvas class="prev" id="admPrev"></canvas><div class="prevctl">
    <button type="button" class="pill" data-act="pv" data-arg="walk">🚶 Marcher</button><button type="button" class="pill" data-act="pv" data-arg="flip">↔ Retourner</button>
    <button type="button" class="pill" data-act="pv" data-arg="lit">💡 Pénombre</button><button type="button" class="pill" data-act="pv" data-arg="zin">＋</button><button type="button" class="pill" data-act="pv" data-arg="zout">−</button></div></div>`;
}
function artEditor(table, key) {
  const s = (table === 'CHAR' ? CHAR : HERO_ART)[key]; if (!s) return '';
  if (s.special) return `<h3>Apparence</h3><p class="hint">Silhouette spéciale (« ${esc(s.special)} ») dessinée à la main dans le code : couleurs non paramétrables ici. Duplique une créature humanoïde pour en créer une variante colorée.</p>`;
  return `<h3>Apparence</h3><div class="afgrid">${COLOR_FIELDS.map(([f, l, opt]) => fld(table, key, f, l, 'color', { opt })).join('')}</div>
    <div class="afgrid">${['ears', 'eyes', 'nose', 'mouth', 'hat', 'hairStyle', 'item'].map(f => fld(table, key, f, { ears: 'Oreilles', eyes: 'Yeux', nose: 'Nez', mouth: 'Bouche', hat: 'Coiffe', hairStyle: 'Coiffure', item: 'Objet' }[f], 'sel', { opts: ART_OPTS[f] })).join('')}
    ${fld(table, key, 'sc', 'Taille', 'range', { min: .6, max: 1.5, step: .02 })}${fld(table, key, 'brow', 'Sourcils froncés', 'bool')}${fld(table, key, 'ribs', 'Côtes (squelette)', 'bool')}${fld(table, key, 'collar', 'Col de cape', 'bool')}</div>`;
}
function renderSpriteDetail() {
  const box = $('#sprDetail'); if (!box) return;
  const { kind, key } = ADMIN.sel; let html = prevBox();
  if (kind === 'char') {
    const sp = SPECIES[key]; if (!sp) return;
    const rooms = [['', '(aucune)'], ['coeur', 'Cœur du château'], ...Object.keys(ROOMS).filter(k => !isHall({ t: k }) && k !== 'coeur').map(k => [k, ROOMS[k].name])];
    html += `<h2>${esc(sp.name)} <small class="hint">clé « ${esc(key)} »</small></h2>
      <h3>Identité</h3><div class="afgrid">${fld('SPECIES', key, 'name', 'Nom', 'text')}${fld('SPECIES', key, 'tier', 'Palier requis', 'num', { min: 0, max: 3 })}
      ${sp.fromDecor ? `<label class="af"><span>Attirée par</span><input type="text" value="2 Toiles d'araignée" disabled></label>` : fld('SPECIES', key, 'from', 'Attirée par la pièce', 'sel', { opts: rooms })}
      ${fld('SPECIES', key, 'likes', 'Déco adorée', 'sel', { opts: optsOf(FURN, '(rien)') })}${fld('SPECIES', key, 'rival', 'Rivale', 'sel', { opts: optsOf(SPECIES, '(aucune)') })}${fld('SPECIES', key, 'tag', 'Spécialité de raid', 'sel', { opts: [['', '(aucune)'], ...Object.entries(TAGS)] })}${fld('SPECIES', key, 'scout', 'Éclaireuse', 'bool')}</div>
      <h3>Statistiques</h3><div class="afgrid">${STAT_FIELDS.map(([f, l]) => fld('SPECIES', key, f, l, 'num', { min: 0, max: 9 })).join('')}</div>
      <h3>Compétence</h3><div class="afgrid">${fld('SPECIES', key, 'skill', 'Nom de la compétence', 'text')}${fld('SPECIES', key, 'sd', 'Description', 'area')}</div>
      <h3>Répliques <small class="hint">une par ligne</small></h3><div class="afgrid">${fld('SPECIES', key, 'lines', 'Ce qu’elle dit quand on discute', 'lines', { rows: 4 })}</div>
      ${artEditor('CHAR', key)}
      <h3>Actions</h3><div class="btnrow"><button type="button" class="sbtn pri" data-act="spawn" data-arg="${key}">Faire apparaître dans le château</button><button type="button" class="sbtn" data-act="resetSp" data-arg="${key}">Réinitialiser</button>${isCustom('SPECIES', key) ? `<button type="button" class="sbtn danger" data-act="delSp" data-arg="${key}">Supprimer cette créature</button>` : ''}</div>
      <div class="dup"><input type="text" id="dupName" placeholder="Nom d'une nouvelle créature (copie de ${esc(sp.name)})"><button type="button" class="sbtn" data-act="dupSp" data-arg="${key}">Dupliquer</button></div>`;
  } else if (kind === 'hero') {
    const h = HEROES.find(x => x.k === key); if (!h) return;
    html += `<h2>${esc(h.name)} <small class="hint">aventurier « ${esc(key)} »</small></h2><h3>Fiche</h3><div class="afgrid">${fld('HEROES', key, 'name', 'Nom', 'text')}${fld('HEROES', key, 'c', 'Courage', 'num', { min: 1, max: 9 })}</div>
      ${artEditor('HERO_ART', key)}<div class="btnrow"><button type="button" class="sbtn" data-act="resetHero" data-arg="${key}">Réinitialiser</button></div>`;
  } else if (kind === 'furn') {
    const f = FURN[key]; if (!f) return; const l = LIGHTS[key] || LIGHTS[f.sprite];
    html += `<h2>${esc(f.name)} <small class="hint">clé « ${esc(key)} »</small></h2>
      <h3>Fiche</h3><div class="afgrid">${fld('FURN', key, 'name', 'Nom', 'text')}${fld('FURN', key, 'room', 'Pièce', 'sel', { opts: [['any', 'Partout (déco)'], ...Object.keys(ROOMS).map(k => [k, ROOMS[k].name])] })}${fld('FURN', key, 'tier', 'Palier requis', 'num', { min: 0, max: 3 })}
      ${fld('FURN', key, 'cost.g', 'Coût en or', 'num', { min: 0 })}${fld('FURN', key, 'cost.s', 'Coût en bois', 'num', { min: 0 })}${fld('FURN', key, 'flat', 'Posé à plat', 'bool')}${fld('FURN', key, 'unique', 'Unique', 'bool')}
      ${isCustom('FURN', key) ? fld('FURN', key, 'sprite', 'Dessin utilisé', 'sel', { opts: Object.keys(FDRAW).map(k => [k, k]) }) : ''}</div>
      <h3>Effets</h3><div class="afgrid">${FURN_STATS.map(([s, lab]) => fld('FURN', key, s, lab, 'num', { min: 0, max: 9 })).join('')}</div>
      <h3>Lumière</h3>${LIGHTS[key] ? `<div class="afgrid">${fld('LIGHTS', key, '0', 'Rayon (cases)', 'num', { step: .1, min: .3, max: 6 })}${fld('LIGHTS', key, '1', 'Couleur', 'sel', { opts: Object.keys(LCOL).map(k => [k, k]) })}${fld('LIGHTS', key, '2', 'Intensité', 'num', { step: .05, min: 0, max: 1.5 })}</div>` : `<p class="hint">${l ? 'Hérite de la lumière de son dessin.' : 'Ce meuble n’éclaire pas.'}</p><button type="button" class="sbtn" data-act="addLight" data-arg="${key}">Ajouter une lumière</button>`}
      <h3>Actions</h3><div class="btnrow"><button type="button" class="sbtn" data-act="give" data-arg="${key}">+3 stickers gratuits</button><button type="button" class="sbtn" data-act="resetF" data-arg="${key}">Réinitialiser</button>${isCustom('FURN', key) ? `<button type="button" class="sbtn danger" data-act="delF" data-arg="${key}">Supprimer</button>` : ''}</div>
      <div class="dup"><input type="text" id="dupName" placeholder="Nom d'un nouveau meuble (même dessin)"><button type="button" class="sbtn" data-act="dupF" data-arg="${key}">Dupliquer</button></div>`;
  } else if (kind === 'def') {
    const d = DEFS[key]; if (!d) return;
    html += `<h2>${esc(d.name)} <small class="hint">clé « ${esc(key)} »</small></h2>
      <h3>Fiche</h3><div class="afgrid">${fld('DEFS', key, 'name', 'Nom', 'text')}${fld('DEFS', key, 'kind', 'Type', 'sel', { opts: [['verrou', 'Verrou'], ['piège', 'Piège'], ['ruse', 'Ruse']] })}${fld('DEFS', key, 'str', 'Force', 'num', { min: 0, max: 9 })}${fld('DEFS', key, 'lag', 'Énigme (un héros manque la pièce suivante)', 'bool')}${fld('DEFS', key, 'bait', 'Appât (toute la bande perd son 1er tour)', 'bool')}${fld('DEFS', key, 'spring', 'Ressort (frappe chaque héros)', 'bool')}
      ${fld('DEFS', key, 'needs', 'Pièce requise', 'sel', { opts: optsOf(ROOMS, '(aucune)') })}${fld('DEFS', key, 'tier', 'Palier requis', 'num', { min: 0, max: 3 })}${fld('DEFS', key, 'cost.g', 'Coût en or', 'num', { min: 0 })}${fld('DEFS', key, 'cost.s', 'Coût en bois', 'num', { min: 0 })}
      ${fld('DEFS', key, 'sticky', 'Collant (la victime perd son 1er tour)', 'bool')}${fld('DEFS', key, 'alarm', 'Alarme (+1 énergie au combat du Cœur)', 'bool')}${fld('DEFS', key, 'unique', 'Unique', 'bool')}${fld('DEFS', key, 'desc', 'Description', 'area')}</div>
      <div class="btnrow"><button type="button" class="sbtn" data-act="give" data-arg="${key}">+3 stickers gratuits</button><button type="button" class="sbtn" data-act="resetD" data-arg="${key}">Réinitialiser</button></div>`;
  } else html += `<h2>Décor extérieur <small class="hint">« ${esc(key)} »</small></h2><p class="hint">Décor posé automatiquement autour des remparts (arbres, rochers, braseros du porche, échafaudage des chantiers, souches et fougères de la forêt des Jardins, poules du poulailler). Pas de statistiques.</p>`;
  box.innerHTML = html;
  startPreview($('#admPrev'), kind, key);
  ADMIN.onApply = () => { document.querySelectorAll('.spc.on img').forEach(i => { i.src = thumb(ADMIN.sel.kind, ADMIN.sel.key); }); };
}
function spawnCreature(sp, n = 1) { for (let i = 0; i < n; i++) { const c = addCreature(sp); c.isNew = true; } afterChange(); toast(`${SPECIES[sp].name} arrive au château.`); }
Object.assign(ACTIONS, {
  cat: k => { ADMIN.cat = k; renderAdminTab(); },
  pick: arg => { const [kind, key] = arg.split('|'); ADMIN.sel = { kind, key }; document.querySelectorAll('.spc').forEach(b => b.classList.toggle('on', b.dataset.arg === arg)); renderSpriteDetail(); },
  pv: arg => { const p = ADMIN.preview; if (!p) return; if (arg === 'zin') p.zoom = Math.min(2.4, p.zoom * 1.2); else if (arg === 'zout') p.zoom = Math.max(.5, p.zoom / 1.2); else p[arg] = !p[arg]; },
  spawn: sp => spawnCreature(sp),
  resetSp: k => { resetEntry('SPECIES', k); resetEntry('CHAR', k); },
  delSp: k => { resetEntry('SPECIES', k); resetEntry('CHAR', k); ADMIN.sel = { kind: 'char', key: 'gobelin' }; },
  dupSp: k => {
    const name = ($('#dupName').value || '').trim(); if (!name) { toast('Donne un nom à la nouvelle créature.', true); return; }
    const key = uniqueKey(name, SPECIES), sp = clone(SPECIES[k]); delete sp.__new; sp.name = name;
    addEntry('SPECIES', key, sp); addEntry('CHAR', key, clone(CHAR[k] || CHAR.gobelin)); ADMIN.sel = { kind: 'char', key }; toast(`${name} est créée : ajuste ses couleurs et ses stats.`);
  },
  resetHero: k => { resetEntry('HEROES', k); resetEntry('HERO_ART', k); },
  addLight: k => { addEntry('LIGHTS', k, { 0: 1.6, 1: 'warm', 2: .7 }); },
  give: k => { S.free[k] = (S.free[k] || 0) + 3; afterChange(); toast(`+3 ${itemName(k)} dans ta barre de construction.`); },
  resetF: k => { resetEntry('FURN', k); resetEntry('LIGHTS', k); },
  delF: k => { resetEntry('FURN', k); resetEntry('LIGHTS', k); ADMIN.sel = { kind: 'furn', key: 'paillasse' }; },
  dupF: k => {
    const name = ($('#dupName').value || '').trim(); if (!name) { toast('Donne un nom au nouveau meuble.', true); return; }
    const key = uniqueKey(name, FURN), f = clone(FURN[k]); delete f.__new; f.name = name; f.sprite = FURN[k].sprite || k;
    addEntry('FURN', key, f); ADMIN.sel = { kind: 'furn', key }; ADMIN.cat = f.room === 'any' ? 'decor' : 'furn';
  },
  resetD: k => resetEntry('DEFS', k),
});

/* ---------- Pièces ---------- */
ADMIN_TABS.rooms = body => {
  if (!ROOMS[ADMIN.room]) ADMIN.room = 'dortoir';
  const k = ADMIN.room, r = ROOMS[k];
  const list = Object.keys(ROOMS).map(key => `<button type="button" class="rrow${key === k ? ' on' : ''}" data-act="pickRoom" data-arg="${key}"><img alt="" src="${roomThumb(key)}"><span><b>${esc(ROOMS[key].name)}</b><small>${ROOMS[key].size[0]}×${ROOMS[key].size[1]}${ROOMS[key].tier ? ' · palier ' + ROOMS[key].tier : ''}${ROOMS[key].theme ? ' · thème' : ''}${isCustom('ROOMS', key) ? ' · créée' : OVR.ROOMS && OVR.ROOMS[key] ? ' · modifiée' : ''}</small></span></button>`).join('');
  const stats = [['gold', 'Or / nuit'], ['mat', 'Bois / nuit'], ['hype', 'Bouche-à-oreille / nuit'], ['food', 'Repas'], ['beds', 'Lits'], ['amb', 'Ambiance'], ['cal', 'Calamité −'], ['guard', 'Garde'], ['harass', 'Harcèlement'], ['dice', 'Dés de raid'], ['cells', 'Prison']];
  const synStat = r.syn ? Object.keys(r.syn).find(s => s !== 'adj') : null;
  body.innerHTML = `<div class="adm-split"><aside class="adm-list rooms">${list}</aside><div class="adm-detail">
    <div class="roomprev"><img alt="" src="${roomThumb(k)}"><div><h2>${esc(r.name)}</h2><p class="hint">clé « ${esc(k)} »${r.fixed ? ' · pièce fixe du château' : ''}</p><p class="hint">Meubles : ${(r.furn || []).map(f => FURN[f] ? FURN[f].name : f).join(', ') || 'aucun'} (le champ « Pièce » de chaque meuble décide de cette liste).</p></div></div>
    <h3>Construction</h3><div class="afgrid">${fld('ROOMS', k, 'name', 'Nom', 'text')}${fld('ROOMS', k, 'size.0', 'Largeur', 'num', { min: 1, max: 5 })}${fld('ROOMS', k, 'size.1', 'Profondeur', 'num', { min: 1, max: 5 })}
      ${fld('ROOMS', k, 'cost.g', 'Coût en or', 'num', { min: 0 })}${fld('ROOMS', k, 'cost.s', 'Coût en bois', 'num', { min: 0 })}${fld('ROOMS', k, 'clock', 'Horloge de chantier', 'seln', { opts: [[2, '2 segments'], [4, '4 segments'], [6, '6 segments'], [8, '8 segments'], [10, '10 segments']] })}
      ${fld('ROOMS', k, 'tier', 'Palier requis', 'num', { min: 0, max: 3 })}${fld('ROOMS', k, 'far', 'Distance mini. du porche', 'num', { min: 0, max: 14 })}${fld('ROOMS', k, 'edge', 'Doit toucher les remparts', 'bool')}${fld('ROOMS', k, 'unique', 'Unique', 'bool')}</div>
    <h3>Apparence</h3><div class="afgrid">${fld('ROOMS', k, 'floor', 'Sol', 'sel', { opts: [['wood', 'Parquet'], ['straw', 'Parquet et paille'], ['flag', 'Dalles'], ['checker', 'Carrelage'], ['carpet', 'Tapis'], ['garden', 'Terre cultivée'], ['magic', 'Dalles runiques']] })}${fld('ROOMS', k, 'color', 'Couleur (bannière, tapis)', 'color')}${fld('ROOMS', k, 'open', 'À ciel ouvert (haies)', 'bool')}</div>
    <h3>Effets de base <small class="hint">avant meubles</small></h3><div class="afgrid">${stats.map(([s, l]) => fld('ROOMS', k, s, l, 'num', { min: 0, max: 9 })).join('')}</div>
    ${r.syn ? `<h3>Bonus de voisinage</h3><div class="afgrid">${fld('ROOMS', k, 'syn.adj', 'Si elle touche', 'sel', { opts: optsOf(ROOMS) })}${fld('ROOMS', k, 'syn.' + synStat, 'Bonus (' + synStat + ')', 'num', { min: 0, max: 9 })}</div>` : ''}
    <h3>Attire</h3><div class="chips">${SPECIES_ORDER.map(s => `<button type="button" class="pill${(r.attracts || []).includes(s) ? ' on' : ''}" data-act="attract" data-arg="${s}">${esc(SPECIES[s].name)}</button>`).join('')}</div>
    <h3>Texte</h3><div class="afgrid">${fld('ROOMS', k, 'desc', 'Description', 'area', { rows: 3 })}</div>
    <h3>Actions</h3><div class="btnrow"><button type="button" class="sbtn" data-act="resetRoom" data-arg="${k}">Réinitialiser</button>${isCustom('ROOMS', k) ? `<button type="button" class="sbtn danger" data-act="delRoom" data-arg="${k}">Supprimer</button>` : ''}</div>
    ${r.fixed ? '' : `<div class="dup"><input type="text" id="dupName" placeholder="Nom d'une nouvelle pièce (copie de ${esc(r.name)})"><button type="button" class="sbtn" data-act="dupRoom" data-arg="${k}">Dupliquer</button></div>`}</div></div>`;
};
Object.assign(ACTIONS, {
  pickRoom: k => { ADMIN.room = k; renderAdminTab(); },
  attract: s => { const k = ADMIN.room, cur = [...(ROOMS[k].attracts || [])], i = cur.indexOf(s); if (i >= 0) cur.splice(i, 1); else cur.push(s); setv('ROOMS', k, 'attracts', cur.length ? cur : undefined); setTimeout(renderAdminTab, 180); },
  resetRoom: k => resetEntry('ROOMS', k),
  delRoom: k => { resetEntry('ROOMS', k); ADMIN.room = 'dortoir'; },
  dupRoom: k => {
    const name = ($('#dupName').value || '').trim(); if (!name) { toast('Donne un nom à la nouvelle pièce.', true); return; }
    const key = uniqueKey(name, ROOMS), r = clone(ROOMS[k]); delete r.__new; r.name = name; delete r.theme; delete r.preset; r.furn = [];
    addEntry('ROOMS', key, r); ADMIN.room = key; toast(`${name} ajoutée à la barre de construction. Duplique des meubles et règle leur « Pièce » pour la meubler.`);
  },
});
