
/* =========================================================
   Écran d'accueil : continuer, nouvelle partie, mes parties
   (charger, exporter, importer, supprimer), multijoueur
   (château partagé et Val des Maîtres)
   ========================================================= */
const TITLE = { view: 'main' };
const agoMs = t => { const d = (Date.now() - t) / 1000; return d < 90 ? 'à l’instant' : d < 3600 ? `il y a ${Math.round(d / 60)} min` : d < 86400 ? `il y a ${Math.round(d / 3600)} h` : `il y a ${Math.round(d / 86400)} j`; };
const slotsSorted = () => slotIndex().list.slice().sort((a, b) => b.at - a.at);
const playing = id => !!(S && S.started) && curSlot() === id && !(typeof VISIT !== 'undefined' && VISIT) && COOP.role !== 'guest';
const netWhy = () => NET.ok ? '' : NET.why === 'offline' ? 'Mode hors ligne : l’adresse de la page contient « horsligne ».' : NET.why === 'claude' ? 'Le multijoueur se joue sur la version en ligne du jeu.' : 'Ce navigateur ne peut pas se connecter au Val.';

function openTitle(view) {
  TITLE.view = typeof view === 'string' ? view : 'main';
  const m = openModal('<div id="titleBox"></div>', { noClose: true, wide: true, cls: 'titlem', label: 'Cozy Stickers Dungeon' });
  m.addEventListener('click', titleClick);
  m.addEventListener('change', e => { if (e.target.id === 'tImport') importSave(e.target.files && e.target.files[0]); });
  m.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'tCode') { const b = m.querySelector('[data-tt="join"]'); if (b) b.click(); } });
  renderTitle();
}
function renderTitle() {
  const box = $('#titleBox'); if (!box) return;
  const list = slotsSorted(), ix = slotIndex(), cur = list.find(x => playing(x.id)) || list[0];
  const head = `<div class="tlogo"><h1>Cozy Stickers Dungeon</h1><p>Un château maléfique… mais douillet</p></div>`;
  const file = '<input type="file" id="tImport" accept=".json,application/json" hidden>';
  if (TITLE.view === 'load') { box.innerHTML = head + slotsHTML(list) + file; return; }
  if (TITLE.view === 'multi') { box.innerHTML = head + multiHTML(); return; }
  box.innerHTML = head + `<div class="tmenu">
    ${cur ? `<button class="ttbtn pri" type="button" data-tt="play" data-id="${cur.id}" data-focus><b>▶ Continuer</b><small>${esc(cur.name)} · nuit ${cur.night} · palier ${cur.tier} · ${agoMs(cur.at)}</small></button>` : ''}
    <button class="ttbtn${cur ? '' : ' pri'}" type="button" data-tt="new"><b>🏰 Nouvelle partie</b><small>En solo, à ton rythme : choisis ton château et son style</small></button>
    <button class="ttbtn" type="button" data-tt="load" ${list.length ? '' : 'disabled'}><b>📂 Mes parties</b><small>${list.length ? `${list.length} partie${list.length > 1 ? 's' : ''} sauvegardée${list.length > 1 ? 's' : ''} dans ce navigateur` : 'Aucune partie pour l’instant'}</small></button>
    <button class="ttbtn" type="button" data-tt="multi"><b>🌐 Multijoueur</b><small>${NET.ok ? 'Château partagé avec tes amis, et le Val des Maîtres' : esc(netWhy())}</small></button>
  </div>
  <div class="trow"><button class="sbtn" type="button" data-tt="import">📥 Importer une sauvegarde</button><button class="sbtn" type="button" data-tt="grim">📖 Grimoire</button><button class="sbtn" type="button" data-tt="stickers">📚 Le Livre des stickers</button></div>${file}`;
}
function slotsHTML(list) {
  return `<h2>📂 Mes parties</h2><p class="hint">Chaque partie se sauvegarde toute seule, dans ce navigateur${PROFILE ? ` (profil « ${esc(PROFILE)} »)` : ''} : ${list.length}/${SLOTS_MAX} cases. Exporte un fichier pour la garder ailleurs ou la continuer sur un autre appareil.</p>
    <div class="slots">${list.map(x => { const on = playing(x.id), th = THEMES[x.theme] || {}; return `<div class="slot${on ? ' cur' : ''}"><span class="semo">${th.emo || '🏰'}</span><span class="slinfo"><b>${esc(x.name)}</b><small>Nuit ${x.night} · palier ${x.tier} · ${x.crit} créature${x.crit > 1 ? 's' : ''} · ${agoMs(x.at)}${on ? ' · en cours' : ''}</small></span>
      <span class="sbtns"><button class="sbtn pri" type="button" data-tt="play" data-id="${x.id}">▶ ${on ? 'Reprendre' : 'Jouer'}</button><button class="sbtn" type="button" data-tt="export" data-id="${x.id}" title="Télécharger un fichier de sauvegarde" aria-label="Exporter ${esc(x.name)}">💾</button><button class="sbtn danger" type="button" data-tt="del" data-id="${x.id}" title="Supprimer cette partie" aria-label="Supprimer ${esc(x.name)}">🗑️</button></span></div>`; }).join('') || '<p class="hint">Aucune partie pour l’instant.</p>'}</div>
    <div class="trow"><button class="sbtn" type="button" data-tt="back">← Retour</button><button class="sbtn" type="button" data-tt="new">🏰 Nouvelle partie</button><button class="sbtn" type="button" data-tt="import">📥 Importer une sauvegarde</button></div>`;
}
function multiHTML() {
  const back = '<div class="trow"><button class="sbtn" type="button" data-tt="back">← Retour</button></div>';
  if (!NET.ok) return `<h2>🌐 Multijoueur</h2><p>${esc(netWhy())}</p>${NET.why === 'offline' ? '<p class="hint">Retire « horsligne » de l’adresse de la page pour jouer avec les autres.</p>' : `<p>La version en ligne est ouverte à tous, sans compte : <a href="${SITE_URL}" target="_blank" rel="noopener">${SITE_URL}</a></p>`}${back}`;
  const ready = !!(S && S.started) && COOP.role !== 'guest' && !(typeof VISIT !== 'undefined' && VISIT);
  return `<h2>🌐 Multijoueur</h2>
    <div class="tmenu">
      <div class="tcard"><b>🤝 Château partagé</b><p class="hint">Jusqu’à 4 amis bâtissent avec toi dans le même château, en temps réel : curseurs, discussion, et chacun dit quand il est prêt à finir la nuit. Ton château reste le tien.</p>
        ${COOP.role === 'host' ? `<p>Ton château est ouvert : code <b>${esc(COOP.code)}</b>.</p>` : `<div class="btnrow"><button class="sbtn pri" type="button" data-tt="host" ${ready ? '' : 'disabled'}>Ouvrir ${ready ? `« ${esc(S.name)} »` : 'ma partie'} à mes amis</button></div>
        ${ready ? '' : '<p class="hint">Charge ou commence d’abord une partie : c’est elle que tu partageras.</p>'}`}
        <div class="joinrow"><input id="tCode" maxlength="7" placeholder="Code de 6 lettres" aria-label="Code du château d’un ami" autocomplete="off"><button class="sbtn" type="button" data-tt="join">Rejoindre un ami</button></div></div>
      <div class="tcard"><b>🏰 Le Val des Maîtres</b><p class="hint">Les châteaux de tous les joueurs : visites, livre d’or, cadeaux, escarmouches, palmarès et Panthéon des victoires. Ta partie en cours y apparaît toute seule.</p>
        <div class="btnrow"><button class="sbtn" type="button" data-tt="val" ${ready ? '' : 'disabled'}>Ouvrir le Val</button></div></div>
    </div>${back}`;
}
function titleClick(e) {
  const b = e.target.closest('[data-tt]'); if (!b || b.disabled) return;
  const k = b.dataset.tt, id = b.dataset.id; sfx('tick');
  if (k === 'play') { if (playing(id)) { closeModal(true); renderAll(); } else loadSlot(id); }
  else if (k === 'new') { if (slotIndex().list.length >= SLOTS_MAX) { toast(`${SLOTS_MAX} parties au plus : supprimes-en une d’abord.`, true); TITLE.view = 'load'; renderTitle(); return; } closeModal(true); openIntro(); }
  else if (k === 'load' || k === 'multi') { TITLE.view = k; renderTitle(); }
  else if (k === 'back') { TITLE.view = 'main'; renderTitle(); }
  else if (k === 'export') exportSave(id);
  else if (k === 'del') confirmBtn(b, 'Sûr ?', () => { deleteSlot(id); renderTitle(); });
  else if (k === 'import') { const f = $('#tImport'); if (f) { f.value = ''; f.click(); } }
  else if (k === 'grim') openGrimoire();
  else if (k === 'stickers' && typeof openStickerBook === 'function') openStickerBook();
  else if (k === 'host') { closeModal(true); coopHost(); }
  else if (k === 'join') { const v = normCode(($('#tCode') || {}).value); if (v.length !== 6) { toast('Le code fait 6 lettres ou chiffres.', true); return; } const go = () => coopJoin(v); if (NET.name) go(); else askMasterName(go); }
  else if (k === 'val') { closeModal(true); openVal(); }
}

/* ---------- les parties ---------- */
function loadSlot(id) {
  const st = load(id); if (!st) { toast('Cette sauvegarde est illisible.', true); return false; }
  if (COOP.role) coopLeave(true);
  if (typeof VISIT !== 'undefined' && VISIT) leaveVisit(true);
  if (S && S.started) save();   // la partie en cours reste rangée dans sa case
  useSlot(id); resetActors(); S = upgradeState(st); Z = 0; WORLD = null; dirty(); sortLimbo(); worldInit();
  TUTO.shown = null; GLYPHS.length = 0; HENS.clear(); RES.clear(); V.outsideExt = null; V.extKey = ''; V.drawerDy = 0;
  closeModal(true); renderAll(); CAM.user = false; fitCamera(); sfx('chime');
  banner(`🏰 ${esc(S.name)}`, `Nuit ${S.night} · palier ${S.tier}`, 1500);
  return true;
}
function deleteSlot(id) {
  const was = playing(id); wipe(id);
  if (was) { const rest = slotsSorted(); useSlot(rest[0] ? rest[0].id : newSlotId()); resetActors(); newState(); renderAll(); CAM.user = false; fitCamera(); }
  toast('🗑️ Partie supprimée.');
}
function exportSave(id) {
  if (playing(id)) save();
  const st = load(id); if (!st) { toast('Cette sauvegarde est illisible.', true); return; }
  const slug = String(st.name || 'chateau').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase() || 'chateau';
  try {
    const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(st)], { type: 'application/json' })); a.download = `cozy-stickers-${slug}-nuit${st.night}.json`;
    document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    toast('💾 Fichier de sauvegarde téléchargé.');
  } catch (e) { toast('Le navigateur refuse le téléchargement.', true); }
}
function importSave(file) {
  if (!file) return;
  if (file.size > 4e6) { toast('Ce fichier est bien trop gros pour une sauvegarde.', true); return; }
  const rd = new FileReader();
  rd.onload = () => {
    let st = null; try { st = JSON.parse(rd.result); } catch (e) {}
    if (!st || st.v !== 2 || !Array.isArray(st.rooms) || !Array.isArray(st.creatures) || typeof st.night !== 'number') { toast('Ce fichier n’est pas une sauvegarde de Cozy Stickers Dungeon.', true); return; }
    const ix = slotIndex(); if (ix.list.length >= SLOTS_MAX) { toast(`${SLOTS_MAX} parties au plus : supprimes-en une d’abord.`, true); return; }
    st.started = true; st.name = String(st.name || 'Château importé').slice(0, 40);
    const id = newSlotId(); try { localStorage.setItem(slotKey(id), JSON.stringify(st)); } catch (e) { toast('Le navigateur manque de place pour cette partie.', true); return; }
    ix.list.unshift(slotMeta(id, st)); writeIndex(ix);
    toast(`📥 « ${st.name} » importé (nuit ${st.night}).`); TITLE.view = 'load'; renderTitle();
  };
  rd.onerror = () => toast('Lecture du fichier impossible.', true);
  rd.readAsText(file);
}

Object.assign(WIKI, {
  paie: { cat: 'eco', t: 'Le jour de paie', x: () => `<p>Tous les <b>${PAY_EVERY} nuits</b>, à l’aube, c’est jour de paie : chaque créature vient chercher son or à la {room:tresor} (ou au Cœur s’il n’y en a pas). Les plus anciennes sont payées en premier.</p>
    <ul><li><b>Salaire</b> : 1 💰 pour une créature commune, +1 par {c:paliers|palier} de son espèce, +2 pour une créature rare, +1 au niveau 4 et +1 pour une légende. Les diablotins, nés du Cœur, travaillent pour rien.</li>
    <li><b>Payée</b> : +2 loyauté et un peu d’épanouissement jusqu’à la paie suivante.</li>
    <li><b>Impayée</b> (caisses vides) : −1 ❤️, −10 loyauté et −15 d’épanouissement jusqu’à la paie suivante. De quoi donner envie d’aller voir ailleurs…</li></ul>
    <p>Une pastille 💰 te prévient la veille. Le montant de la prochaine paie s’affiche aussi en survolant ton or, en haut de l’écran, et le salaire de chaque créature sur sa fiche.</p>` },
  fusion: { cat: 'build', t: 'Grandes salles (fusion)', x: () => `<p>Colle deux pièces <b>du même type</b> l’une contre l’autre : une fois les chantiers terminés, le mur qui les sépare tombe et elles ne font plus qu’<b>une grande salle</b>. Trois pièces ou plus : une <b>salle immense</b>.</p>
    <ul><li>Une grande salle donne <b>+1 Ambiance</b>, une salle immense <b>+2</b>. On y circule librement.</li>
    <li>Elle débloque des <b>stickers améliorés</b>, plus puissants, qu’on ne peut poser que dans une salle assez grande :</li></ul>
    <ul>${FURN_ORDER.filter(k => FURN[k].size).map(k => `<li>{furn:${k}} (${ROOMS[FURN[k].room].name}, ${FURN[k].size >= 3 ? 'salle immense' : 'grande salle'})</li>`).join('')}</ul>
    <p>Le Cœur, les couloirs, les escaliers et les pièces uniques ne fusionnent pas. Au moment de coller, le sticker te prévient s’il va fusionner.</p>` },
  parties: { cat: 'bases', t: 'Parties et sauvegardes', x: () => `<p>Au lancement, l’<b>écran d’accueil</b> propose : <b>Continuer</b> ta dernière partie, une <b>Nouvelle partie</b> en solo, <b>Mes parties</b> et le <b>Multijoueur</b>. On y revient depuis le menu ☰ (🏠 Écran d’accueil).</p>
    <ul><li>Chaque partie se <b>sauvegarde toute seule</b> dans ce navigateur, après chaque action et chaque nuit ; ☰ → 💾 Sauvegarder le fait aussi à la demande. ${SLOTS_MAX} parties au plus.</li>
    <li><b>Mes parties</b> : reprendre, exporter (💾 un fichier à garder ou à ouvrir sur un autre appareil), importer, supprimer.</li>
    <li><b>Multijoueur</b> (version en ligne) : ouvrir ta partie à tes amis ({c:partage|château partagé}), rejoindre un ami avec son code, ou ouvrir le {c:val|Val des Maîtres}.</li></ul>` },
});
