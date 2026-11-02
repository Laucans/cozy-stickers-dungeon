
/* =========================================================
   Le Val des Maîtres : les châteaux des autres joueurs.
   Visites, livre d’or, cadeaux, escarmouches (avec bouclier),
   palmarès de saison, créatures qui changent de château.
   ========================================================= */
const VAL = { castles: new Map(), loading: false, loadedAt: 0, pubAt: 0, lastMap: '', mail: [], pending: [], open: false, tab: 'chateaux', sort: 'recent', q: '', board: 'hype', gb: null, inbox: null };
let VISIT = null;
const GB_LINES = ['Quel château douillet !', 'Tes pièges m’ont fait peur (c’est un compliment).', 'Superbe déco, je vole l’idée.', 'Tes créatures ont l’air si heureuses !', 'Ta taverne sent bon la bière tiède.',
  'J’ai croisé un gobelin très poli.', 'Ce couloir est un chef-d’œuvre de traîtrise.', 'Je repasserai pour le goûter.', 'Un château qui donne envie de se faire envahir.', 'Les aventuriers n’ont aucune chance !',
  'Quelle ambiance lugubre et chaleureuse.', 'Merci pour l’accueil, voisin !', 'J’adore ta salle du trône.', 'Ton potager est magnifique.', 'Bravo pour ta réputation !', 'À bientôt dans le Val !'];
const MASTER_IDEAS = ['Grumeleux', 'Pétoncle', 'Morvandiau', 'Sombrebise', 'Crochemoisi', 'Ténébrule', 'Fumerolle', 'Grisemine', 'Malencombre', 'Bougrelune', 'Ronchonnot', 'Cancrelune'];
const seasonId = (t = Date.now()) => new Date(t).toISOString().slice(0, 7);
const SEASON_NAME = id => { const [y, m] = id.split('-'); return ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'][+m - 1] + ' ' + y; };
const ONLINE_S = 420;
const dayId = () => new Date().toISOString().slice(0, 10);
// le château du joueur, même quand il visite un voisin ou joue chez un autre Maître
const homeS = () => VISIT ? VISIT.back : (COOP.role === 'guest' ? COOP.own : S);
function saveHome() { const st = homeS(); if (!st || !st.started) return; try { localStorage.setItem(SAVE_KEY, JSON.stringify(st)); } catch (e) {} }
const agoText = t => { const d = nowS() - t; return d < ONLINE_S ? 'en ligne' : d < 3600 ? `il y a ${Math.round(d / 60)} min` : d < 86400 ? `il y a ${Math.round(d / 3600)} h` : `il y a ${Math.round(d / 86400)} j`; };

function valBoot() {
  valLoad();
  setTimeout(() => valPublish(true), 2500);
  setInterval(() => { if (!document.hidden) valPublish(); if (VAL.pending.length && S && S.started && !VISIT && COOP.role !== 'guest') valFlush(); }, 60000);
  valInboxBoot();
}
function valAfterNight() { if (NET.ok) valPublish(true); }
function bindVal() {
  $('#btnVal').addEventListener('click', () => { if (!UI.busy) openVal(); });
  $('#visitbar').addEventListener('click', e => {
    const b = e.target.closest('[data-v]'); if (!b || !VISIT) return;
    const k = b.dataset.v, pk = VISIT.info.pk;
    if (k === 'home') leaveVisit(); else if (k === 'gb') openGuestbook(pk); else if (k === 'gift') openGift(pk); else if (k === 'raid') openSkirmish(pk);
  });
}

/* ---------- mon château, version publique ---------- */
function defenseScore() { try { return planInvasion().steps.reduce((a, s) => a + s.dmg, 0); } catch (e) { return 0; } }
function valSummary() {
  return { v: 1, master: NET.name || 'Maître anonyme', name: S.name, theme: S.theme, tier: S.tier, night: S.night, title: castleTitle(), amb: ambiance(), hype: S.hype,
    crit: S.creatures.length, sp: Object.keys(S.album).length, ach: Object.keys(S.ach).length, legends: S.stats.legends, def: defenseScore(),
    rep: Object.fromEntries(SPECIES_ORDER.map(sp => [sp, repOf(sp)])), pvp: !!S.val.pvp, season: seasonId(),
    top: [...S.creatures].sort((a, b) => (b.lvl || 1) - (a.lvl || 1) || b.loy - a.loy).slice(0, 3).map(c => [c.sp, c.name, c.lvl || 1]) };
}
function valMapDoc() {
  const idx = new Map(S.rooms.map((r, i) => [r.id, i]));
  return { v: 1, rooms: S.rooms.map(r => [r.t, r.x, r.y, r.w, r.h, r.built ? 1 : 0, r.prog || 0]), furn: S.furn.map(f => [f.t, f.x, f.y]), defs: S.defs.map(d => [d.t, d.x, d.y]),
    crit: S.creatures.filter(c => !isOut(c)).map(c => [c.sp, c.name, c.mood, c.lvl || 1, c.legend ? 1 : 0, c.post && idx.has(c.post) ? idx.get(c.post) : -1]) };
}
async function valPublish(force) {
  if (!NET.ok || VISIT || COOP.role === 'guest' || !S || !S.started) return 0;
  const now = Date.now(); if (!force && now - VAL.pubAt < 240000) return 0;
  VAL.pubAt = now;
  try {
    const sum = valSummary(), jobs = [netPublish(NET_STORE, sign(30078, [['d', 'csd1:castle'], ['t', 'csd1-val'], ['alt', 'Château du jeu Cozy Stickers Dungeon']], JSON.stringify(sum)))];
    const map = await packJSON(valMapDoc());
    if (map !== VAL.lastMap) { VAL.lastMap = map; jobs.push(netPublish(NET_STORE, sign(30078, [['d', 'csd1:map'], ['t', 'csd1-map'], ['alt', 'Plan d’un château de Cozy Stickers Dungeon']], map))); }
    VAL.castles.set(NET.pk, { ...cleanSummary(sum, { pubkey: NET.pk, created_at: nowS() }) });
    const [ok] = await Promise.all(jobs); return ok;
  } catch (e) { console.error(e); return 0; }
}

/* ---------- les châteaux du Val ---------- */
function cleanSummary(o, ev) {
  const num = (v, a, b) => clamp(Math.round(+v || 0), a, b), rep = {};
  if (o.rep && typeof o.rep === 'object') Object.keys(o.rep).slice(0, 60).forEach(k => { if (SPECIES[k]) rep[k] = num(o.rep[k], 0, 100); });
  return { pk: ev.pubkey, at: ev.created_at, master: cleanName(o.master, 24) || 'Maître anonyme', name: cleanName(o.name, 40) || 'Château sans nom', theme: THEMES[o.theme] ? o.theme : 'forge',
    tier: num(o.tier, 0, 3), night: num(o.night, 1, 99999), title: cleanName(o.title, 48), amb: num(o.amb, 0, 9999), hype: num(o.hype, 0, 99999), crit: num(o.crit, 0, 999), sp: num(o.sp, 0, 99),
    ach: num(o.ach, 0, 99), legends: num(o.legends, 0, 999), def: num(o.def, 0, 999), rep, pvp: !!o.pvp, season: cleanName(o.season, 8),
    top: (Array.isArray(o.top) ? o.top : []).slice(0, 3).filter(t => Array.isArray(t) && SPECIES[t[0]]).map(t => [t[0], cleanName(t[1], 24), num(t[2], 1, 5)]), me: ev.pubkey === NET.pk };
}
function valIngest(ev) {
  if (!ev || ev.kind !== 30078 || tagOf(ev, 'd') !== 'csd1:castle') return;
  const cur = VAL.castles.get(ev.pubkey); if (cur && cur.at >= ev.created_at) return;
  if (!safeVerify(ev)) return;
  let o; try { o = JSON.parse(ev.content); } catch (e) { return; }
  if (o && o.gone) { VAL.castles.delete(ev.pubkey); return; }
  if (o && typeof o === 'object') VAL.castles.set(ev.pubkey, cleanSummary(o, ev));
}
async function valLoad(force) {
  if (!NET.ok || VAL.loading || (!force && Date.now() - VAL.loadedAt < 45000)) return;
  VAL.loading = true; if (VAL.open) renderVal();
  const evs = await netQuery(NET_STORE, [{ kinds: [30078], '#t': ['csd1-val'], since: nowS() - 60 * 86400, limit: 500 }], 7000);
  evs.forEach(valIngest);
  VAL.loading = false; VAL.loadedAt = Date.now(); if (VAL.open) renderVal();
}
// les châteaux de joueurs qui comptent comme rivaux (actifs ces 30 derniers jours)
const valRivals = () => [...VAL.castles.values()].filter(c => !c.me && nowS() - c.at < 30 * 86400);

/* ---------- courrier : cadeaux, livre d’or, escarmouches, arrivants ---------- */
function valInboxBoot() {
  const since = Math.max(nowS() - 21 * 86400, ((S && S.val && S.val.inboxAt) || 0) - 3600);
  VAL.inbox = netSub(NET_STORE, () => [{ kinds: [30078], '#p': [NET.pk], since, limit: 300 }], ev => valMail(ev), () => {}, 8000);
}
function valFlush() { const p = VAL.pending; VAL.pending = []; p.forEach(valMail); }
function valMail(ev) {
  if (!ev || ev.pubkey === NET.pk || !S || !S.val) return;
  if (VISIT || COOP.role === 'guest' || !S.started) { if (VAL.pending.length < 200) VAL.pending.push(ev); return; }
  if (S.val.claimed.includes(ev.id) || !safeVerify(ev)) return;
  const t = tagOf(ev, 't'); if (!['csd1-gift', 'csd1-gb', 'csd1-raid', 'csd1-migr'].includes(t)) return;
  let o; try { o = JSON.parse(ev.content); } catch (e) { return; } if (!o || typeof o !== 'object') return;
  S.val.claimed.push(ev.id); if (S.val.claimed.length > 500) S.val.claimed.splice(0, 100);
  S.val.inboxAt = Math.max(S.val.inboxAt || 0, ev.created_at);
  const who = cleanName(o.m, 24) || 'Un Maître', castle = cleanName(o.from, 40) || 'un château voisin', fresh = nowS() - ev.created_at < 21 * 86400;
  let text = '';
  if (t === 'csd1-gift' && fresh) {
    const x = PW('genereux') ? 2 : 1;
    if (o.k === 'g') { const n = clamp(+o.n || 0, 0, 3) * x; S.gold += n; text = `🎁 ${who} (${castle}) t’offre ${n} 💰.`; }
    else if (o.k === 's') { const n = clamp(+o.n || 0, 0, 3) * x; S.mat += n; text = `🎁 ${who} (${castle}) t’offre ${n} 🪵.`; }
    else if (o.k === 'f' && FURN[o.t] && FURN[o.t].room === 'any') { S.free[o.t] = (S.free[o.t] || 0) + x; text = `🎁 ${who} (${castle}) t’offre un sticker ${FURN[o.t].name}${x > 1 ? ' (×2)' : ''}.`; }
  } else if (t === 'csd1-gb') {
    S.stats.gbRecv++; const l = GB_LINES[clamp(+o.l || 0, 0, GB_LINES.length - 1)];
    text = `✍️ ${who} (${castle}) a signé ton livre d’or : « ${l} »`;
  } else if (t === 'csd1-raid' && fresh) {
    const loot = clamp(+o.loot || 0, 0, 20);
    if (o.res === 'fail') { S.hype += 1; S.gold += 2; homeCreatures().forEach(c => addLoy(c, 2)); text = `🛡️ Ton château a repoussé l’escarmouche de ${who} (${castle}) ! +1 🔥, +2 💰.`; }
    else { const lost = Math.min(S.gold, Math.ceil(loot / 2), 4); S.gold -= lost; text = `🏹 ${who} (${castle}) a mené une escarmouche${lost ? ` et chapardé ${lost} 💰` : ''}. Un bouclier protège ton château pendant 12 h.`; }
  } else if (t === 'csd1-migr' && fresh && SPECIES[o.sp] && (S.waiting || []).length < 6) {
    S.waiting.push({ sp: o.sp, name: cleanName(o.name, 24) || pick(NAMES), lvl: clamp(+o.lvl || 1, 1, 5), xp: clamp(+o.xp || 0, 0, 99), story: clamp(+o.story || 0, 0, 3), legend: !!o.legend, loy: 45, from: castle });
    text = `🧳 ${cleanName(o.name, 24)} (${SPECIES[o.sp].name}) quitte ${castle} et frappe à ta porte : ta réputation l’attire ! Il·elle entrera dès qu’un lit sera libre.`;
  }
  VAL.mail.unshift({ id: ev.id, t, at: ev.created_at, text: text || `${who} t’a écrit.`, who, castle, pk: ev.pubkey });
  if (VAL.mail.length > 80) VAL.mail.length = 80;
  if (text) { toast(text); addLog(text.replace(/^\S+ /, ''), 'ev'); }
  clearTimeout(VAL.mt); VAL.mt = setTimeout(afterChange, 250);
  if (VAL.open && VAL.tab === 'courrier') renderVal();
}
async function valSend(t, pk, content) {
  const ev = sign(30078, [['d', `csd1:${t}:${rid(8)}`], ['t', 'csd1-' + t], ['p', pk], ['alt', 'Message du jeu Cozy Stickers Dungeon']], JSON.stringify({ ...content, m: NET.name || 'Maître anonyme', from: homeS().name }));
  return netPublish(NET_STORE, ev);
}
function valMigrate(c, best) { valSend('migr', best.pk, { sp: c.sp, name: c.name, lvl: c.lvl || 1, xp: c.xp || 0, story: c.story || 0, legend: !!c.legend }).catch(() => {}); }

/* ---------- visite d’un château voisin ---------- */
function visitState(m, c) {
  if (!m || !Array.isArray(m.rooms)) return null;
  const s = upgradeState({ v: 2, seq: 1, name: c.name, theme: c.theme, started: true, night: c.night, gold: 0, mat: 0, hype: c.hype, tier: c.tier, calamity: 0, menace: 0, prisoners: 0,
    rooms: [], furn: [], defs: [], creatures: [], raid: null, goals: {}, album: {}, free: {}, log: [], usedNames: [], rep: c.rep, tuto: { on: false, done: true }, tipsOff: true, tips: {} });
  const inside = (x, y) => Number.isInteger(x) && Number.isInteger(y) && x >= 0 && y >= 0 && x < W && y < H, used = new Set();
  m.rooms.slice(0, 160).forEach(r => {
    if (!Array.isArray(r)) return; const [t, x, y, w, h, b, p] = r;
    if (!ROOMS[t] || !inside(x, y) || !(w >= 1 && h >= 1 && w <= 3 && h <= 3 && x + w <= W && y + h <= H)) return;
    const cells = []; for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) cells.push((y + dy) * W + x + dx);
    if (cells.some(k => used.has(k))) return; cells.forEach(k => used.add(k));
    s.rooms.push({ id: 'v' + s.seq++, t, x, y, w, h, built: !!b, prog: clamp(+p || 0, 0, 20) });
  });
  const spots = new Set();
  (m.furn || []).slice(0, 400).forEach(f => { if (!Array.isArray(f)) return; const [t, x, y] = f; if (FURN[t] && inside(x, y) && !spots.has(y * W + x)) { spots.add(y * W + x); s.furn.push({ id: 'v' + s.seq++, t, x, y }); } });
  (m.defs || []).slice(0, 200).forEach(d => { if (!Array.isArray(d)) return; const [t, x, y] = d; if (DEFS[t] && inside(x, y) && !spots.has(y * W + x)) { spots.add(y * W + x); s.defs.push({ id: 'v' + s.seq++, t, x, y }); } });
  (m.crit || []).slice(0, 60).forEach(k => {
    if (!Array.isArray(k) || !SPECIES[k[0]]) return;
    const cr = upgradeCreature({ id: 'v' + s.seq++, sp: k[0], name: cleanName(k[1], 24) || '?', mood: clamp(+k[2] || 3, 0, 5), lvl: clamp(+k[3] || 1, 1, 5), legend: !!k[4], post: null, joined: 1 });
    const room = s.rooms[+k[5]]; if (room && room.built && !isHall(room)) cr.post = room.id;
    s.creatures.push(cr); s.album[cr.sp] = true;
  });
  if (!s.rooms.some(r => r.t === 'coeur')) return null;
  return s;
}
async function valVisit(pk) {
  const c = VAL.castles.get(pk); if (!c || c.me) return;
  if (COOP.role) { toast('Termine d’abord ta partie en château partagé.', true); return; }
  toast(`🏰 En route vers ${c.name}…`);
  const evs = await netQuery(NET_STORE, [{ kinds: [30078], authors: [pk], '#d': ['csd1:map'], limit: 4 }], 6000);
  const ev = evs.filter(safeVerify).sort((a, b) => b.created_at - a.created_at)[0];
  if (!ev) { toast('Le plan de ce château est introuvable pour l’instant. Réessaie plus tard.', true); return; }
  let st = null; try { st = visitState(await unpackJSON(ev.content), c); } catch (e) {}
  if (!st) { toast('Ce château est illisible (version différente ?).', true); return; }
  enterVisit(st, c);
}
function enterVisit(st, info) {
  if (VISIT) leaveVisit(true);
  if (UI.busy) return;
  closeModal(true); dropSticker(); showTip(null); advisorHide();
  VISIT = { back: S, info, cam: { x: CAM.x, y: CAM.y, s: CAM.s, user: CAM.user }, path: V.showPath };
  const me = S; if (!me.val.visited.includes(info.pk)) { me.val.visited.push(info.pk); me.stats.visits++; if (me.val.visited.length > 300) me.val.visited.shift(); }
  save();
  S = st; dirty(); resetActors(); V.dirty = true;
  document.body.classList.add('visiting');
  renderAll(); CAM.user = false; fitCamera(); renderVisitBar();
  banner(`🏰 ${esc(info.name)}`, `Château de ${esc(info.master)}`, 1600);
}
function leaveVisit(silent) {
  if (!VISIT) return;
  const v = VISIT; VISIT = null; S = v.back; dirty(); resetActors(); V.dirty = true; V.showPath = v.path;
  document.body.classList.remove('visiting'); $('#visitbar').hidden = true; closeModal(true);
  renderAll(); Object.assign(CAM, v.cam); clampCam();
  if (!silent) { announceAch(checkAch()); save(); valFlush(); }
}
function renderVisitBar() {
  const b = $('#visitbar'); if (!VISIT) { b.hidden = true; return; }
  const c = VISIT.info, pvp = c.pvp && S && VISIT.back.val.pvp;
  b.innerHTML = `<div class="vinfo"><b>${esc(c.name)}</b><span>Château de ${esc(c.master)} · Palier ${c.tier} · Nuit ${c.night} · ${c.crit} créature${c.crit > 1 ? 's' : ''} · Ambiance ${c.amb}</span></div>
    <div class="btnrow"><button class="sbtn" type="button" data-v="gb">✍️ Livre d’or</button><button class="sbtn" type="button" data-v="gift">🎁 Offrir</button>${pvp ? '<button class="sbtn" type="button" data-v="raid">🏹 Escarmouche</button>' : ''}<button class="sbtn pri" type="button" data-v="home">↩ Rentrer chez moi</button></div>`;
  b.hidden = false;
}
function visitTap(e) {
  const r = cv.getBoundingClientRect(), sx = e.clientX - r.left, sy = e.clientY - r.top;
  const act = pickActor(sx, sy); if (act) { openVisitCreature(act.id); return; }
  const [gx, gy] = tileAtScreen(sx, sy), rm = roomAt(Math.floor(gx), Math.floor(gy));
  if (rm && !isHall(rm)) { floatText(rm.x + rm.w / 2, rm.y + rm.h / 2, ROOMS[rm.t].name, '#ffe7b0'); sfx('tick'); }
}
function openVisitCreature(id) {
  const c = S.creatures.find(x => x.id === id); if (!c) return; const sp = SPECIES[c.sp];
  V.selected = id; say(id, pick(sp.lines), 2600);
  openModal(`<div class="cardhead"><div class="portrait char"><img class="th" alt="" src="${thumb('char', c.sp, true)}"></div><div><h2>${esc(c.name)}</h2><p><span class="tag2">${sp.name}</span><span class="tag2">Niv. ${c.lvl}</span>${c.legend ? '<span class="tag2 gold">🗿 Légende</span>' : ''}</p><div>${hearts(c.mood)}</div></div></div>
    <div class="bubble">« ${esc(pick(sp.lines))} »</div><p class="hint">Cette créature vit chez ${esc(VISIT.info.master)}. Si ton château reçoit mieux les ${esc(sp.name.toLowerCase())}s, qui sait… un jour, peut-être ?</p>`, { label: c.name });
}

/* ---------- livre d’or, cadeaux ---------- */
async function openGuestbook(pk) {
  const c = VAL.castles.get(pk) || { name: 'ce château', master: '?' }, mine = pk === NET.pk, signedToday = S.val && (VISIT ? VISIT.back : S).val.sent['gb:' + pk] === dayId();
  const m = openModal(`<h2>✍️ Livre d’or</h2><p class="hint">${mine ? 'Les mots laissés par tes visiteurs.' : `Château ${esc(c.name)}, de ${esc(c.master)}.`}</p>
    ${mine ? '' : `<h3>Laisser un mot</h3>${signedToday ? '<p class="hint">Tu as déjà signé ce livre aujourd’hui. Reviens demain !</p>' : `<div class="gbpick" id="gbLines">${GB_LINES.map((l, i) => `<button type="button" class="choice" data-l="${i}" aria-pressed="${i === 0}"><span>${esc(l)}</span></button>`).join('')}</div>
    <h3>Avec un sticker</h3><div class="gbstk" id="gbStk">${DECOR_ORDER.map((k, i) => `<button type="button" class="s" data-k="${k}" aria-pressed="${i === 0}" title="${esc(FURN[k].name)}">${imgThumb('furn', k)}</button>`).join('')}</div>
    <div class="mfoot"><button class="sbtn pri" type="button" id="gbGo">✍️ Signer</button></div>`}`}
    <h3>Les derniers mots</h3><div class="gblist" id="gbList"><p class="hint">Chargement…</p></div>`, { wide: true, label: 'Livre d’or' });
  let line = 0, stk = DECOR_ORDER[0];
  m.addEventListener('click', async e => {
    const l = e.target.closest('[data-l]'); if (l) { line = +l.dataset.l; m.querySelectorAll('[data-l]').forEach(x => x.setAttribute('aria-pressed', x === l)); sfx('tick'); return; }
    const k = e.target.closest('[data-k]'); if (k) { stk = k.dataset.k; m.querySelectorAll('[data-k]').forEach(x => x.setAttribute('aria-pressed', x === k)); sfx('tick'); return; }
    if (e.target.closest('#gbGo')) {
      const btn = e.target.closest('#gbGo'); btn.disabled = true;
      const home = VISIT ? VISIT.back : S;
      const n = await valSend('gb', pk, { l: line, k: stk });
      if (!n) { toast('Les relais ne répondent pas. Réessaie dans un instant.', true); btn.disabled = false; return; }
      home.val.sent['gb:' + pk] = dayId(); sfx('chime'); toast('✍️ Mot laissé dans le livre d’or !'); openGuestbook(pk);
    }
  });
  const evs = await netQuery(NET_STORE, [{ kinds: [30078], '#t': ['csd1-gb'], '#p': [pk], limit: 40 }], 5000);
  const list = m.querySelector('#gbList'); if (!list || !list.isConnected) return;
  const rows = evs.filter(safeVerify).sort((a, b) => b.created_at - a.created_at).slice(0, 30).map(ev => { let o = {}; try { o = JSON.parse(ev.content); } catch (err) {} const k = FURN[o.k] && FURN[o.k].room === 'any' ? o.k : 'plante';
    return `<div class="gbrow">${imgThumb('furn', k)}<span><b>« ${esc(GB_LINES[clamp(+o.l || 0, 0, GB_LINES.length - 1)])} »</b><br><span class="hint">${esc(cleanName(o.m, 24) || 'Un Maître')}, de ${esc(cleanName(o.from, 40) || '?')} · ${agoText(ev.created_at)}</span></span></div>`; });
  list.innerHTML = rows.join('') || '<p class="hint">Personne n’a encore signé. Sois le premier !</p>';
}
function openGift(pk) {
  const c = VAL.castles.get(pk); if (!c) return;
  const home = VISIT ? VISIT.back : S, sent = home.val.sent, today = dayId(), nToday = Object.keys(sent).filter(k => k.startsWith('gift:') && sent[k] === today).length;
  const already = sent['gift:' + pk] === today, decor = DECOR_ORDER.filter(k => (home.free[k] || 0) > 0);
  const m = openModal(`<h2>🎁 Offrir un cadeau</h2><p>Pour ${esc(c.master)}, au ${esc(c.name)}. Un cadeau par voisin et trois par jour.</p>
    ${already ? '<p class="hint">Tu lui as déjà fait un cadeau aujourd’hui.</p>' : nToday >= 3 ? '<p class="hint">Tu as déjà offert trois cadeaux aujourd’hui. Reviens demain !</p>' : `<div class="choices">
      <button type="button" class="choice" data-g="g" ${home.gold >= 3 ? '' : 'disabled'}><span class="emo">💰</span><b>3 pièces d’or</b><span>Tu en as ${home.gold}.</span></button>
      <button type="button" class="choice" data-g="s" ${home.mat >= 3 ? '' : 'disabled'}><span class="emo">🪵</span><b>3 matériaux</b><span>Tu en as ${home.mat}.</span></button>
      ${decor.map(k => `<button type="button" class="choice" data-g="f" data-t="${k}">${imgThumb('furn', k)}<b>${esc(FURN[k].name)}</b><span>Un de tes stickers en réserve (×${home.free[k]}).</span></button>`).join('')}</div>`}`, { label: 'Cadeau' });
  m.addEventListener('click', async e => {
    const b = e.target.closest('[data-g]'); if (!b || b.disabled) return;
    m.querySelectorAll('[data-g]').forEach(x => { x.disabled = true; });
    const k = b.dataset.g, t = b.dataset.t, n = await valSend('gift', pk, k === 'f' ? { k, t, n: 1 } : { k, n: 3 });
    if (!n) { toast('Les relais ne répondent pas. Réessaie dans un instant.', true); closeModal(); return; }
    if (k === 'g') home.gold -= 3; else if (k === 's') home.mat -= 3; else home.free[t] = Math.max(0, (home.free[t] || 0) - 1);
    sent['gift:' + pk] = today; home.stats.gifts++; Object.keys(sent).forEach(x => { if (sent[x] !== today && x.startsWith('gift:')) delete sent[x]; });
    sfx('chime'); toast(`🎁 Cadeau envoyé à ${c.master} !`); closeModal();
    if (!VISIT) afterChange(); else saveHome();
  });
}

/* ---------- escarmouches ---------- */
async function skirmishShield(pk) {
  const evs = await netQuery(NET_STORE, [{ kinds: [30078], '#t': ['csd1-raid'], '#p': [pk], since: nowS() - 12 * 3600, limit: 30 }], 4500);
  return evs.filter(safeVerify).some(ev => { try { return JSON.parse(ev.content).res !== 'fail'; } catch (e) { return false; } });
}
async function openSkirmish(pk) {
  const c = VAL.castles.get(pk); if (!c || !VISIT) return;
  const home = VISIT.back;
  if (!home.val.pvp || !c.pvp) { toast('Un des deux châteaux est pacifique.', true); return; }
  if (home.val.skirmish === home.night) { toast('Une seule escarmouche par nuit. Tes troupes se reposent.', true); return; }
  const m = openModal('<h2>🏹 Escarmouche</h2><p class="hint">On vérifie que ce château n’est pas sous bouclier…</p>', { wide: true, label: 'Escarmouche' });
  if (await skirmishShield(pk)) { m.querySelector('.mbody').innerHTML = `<h2>🛡️ Bouclier actif</h2><p>${esc(c.name)} a déjà subi une escarmouche ces dernières heures : un bouclier le protège. Reviens plus tard !</p>`; return; }
  const crew = home.creatures.filter(x => diceOf(x) > 0 && !isOut(x)), sel = new Set();
  const draw = () => {
    if (!m.isConnected) return;
    const team = crew.filter(x => sel.has(x.id)), malus = Math.floor(c.def / 6);
    let pool = team.reduce((a, x) => a + diceOf(x), 0) + ((home.ach || {}).escarmouche ? 1 : 0) + (home.theme === 'repaire' ? 1 : 0) - malus;
    m.querySelector('.mbody').innerHTML = `<h2>🏹 Escarmouche chez ${esc(c.master)}</h2>
      <p>Une petite expédition taquine : tes créatures tentent de chaparder un peu d’or au ${esc(c.name)}. Leurs défenses comptent (force ${c.def} : −${malus} dé${malus > 1 ? 's' : ''}). Réussie, elle te rapporte de l’or et de la notoriété ; ratée, tes troupes rentrent vexées. Le château visé gagne un bouclier de 12 h.</p>
      <h3>Équipe (${sel.size}/3)</h3><div class="choices">${crew.map(x => `<button type="button" class="choice" data-mate="${x.id}" aria-pressed="${sel.has(x.id)}" ${!sel.has(x.id) && sel.size >= 3 ? 'disabled' : ''}>${imgThumb('char', x.sp)}<b>${esc(x.name)}</b><span>${SPECIES[x.sp].name} · ${diceOf(x)} 🎲</span>${hearts(x.mood)}</button>`).join('') || '<p class="hint">Personne ne peut partir.</p>'}</div>
      ${sel.size ? `<p class="odds">${oddsText(pool)}</p>` : ''}
      <div class="mfoot"><button class="sbtn" type="button" data-close>Plus tard</button><button class="sbtn pri" type="button" id="skGo" ${sel.size ? '' : 'disabled'}>🏹 Lancer l’escarmouche</button></div>`;
    m.dataset.pool = pool;
  };
  draw();
  m.addEventListener('click', async e => {
    const mt = e.target.closest('[data-mate]');
    if (mt && !mt.disabled) { sel.has(mt.dataset.mate) ? sel.delete(mt.dataset.mate) : sel.add(mt.dataset.mate); sfx('tick'); draw(); return; }
    if (!e.target.closest('#skGo')) return;
    const roll = rollPool(+m.dataset.pool), team = crew.filter(x => sel.has(x.id));
    const base = 4 + 2 * c.tier, loot = roll.res === 'crit' ? Math.ceil(base * 1.5) : roll.res === 'full' ? base : roll.res === 'partial' ? Math.ceil(base / 2) : 0;
    const lines = [];
    if (roll.res === 'fail') { team.forEach(x => { x.mood = clamp(x.mood - 1, 0, 5); }); home.menace += 1; lines.push('💨 Repoussés ! Tes troupes rentrent vexées (−1 ❤️) et le village jase (+1 Menace).'); }
    else { home.gold += loot; home.hype += roll.res === 'partial' ? 1 : 2; home.stats.skirmishWon++; team.forEach(x => { addLoy(x, 3); x.raidsWon = (x.raidsWon || 0) + 1; });
      lines.push(`🎒 Butin : +${loot} 💰, +${roll.res === 'partial' ? 1 : 2} 🔥.`); if (roll.res === 'partial') { const x = pick(team); x.mood = clamp(x.mood - 1, 0, 5); lines.push(`🤕 ${x.name} s’est pris un balai sur la tête (−1 ❤️).`); } }
    home.val.skirmish = home.night;
    valSend('raid', pk, { res: roll.res, loot }).catch(() => {});
    const titles = { crit: '✨ Coup de maître !', full: '🎉 Escarmouche réussie !', partial: '😬 Réussie… de justesse', fail: '💨 Échec' };
    sfx(roll.res === 'fail' ? 'bad' : 'chime');
    m.querySelector('.mbody').innerHTML = `<h2>${titles[roll.res]}</h2><div class="dice">${roll.dice.map(d => `<div class="die ${d === 6 ? 'six' : ''} ${d === roll.best ? 'best' : ''}">${d}</div>`).join('')}</div><ul class="chron">${lines.map(l => `<li><span>${esc(l)}</span></li>`).join('')}</ul><div class="mfoot"><button class="sbtn pri" type="button" data-close>Continuer</button></div>`;
    saveHome();
  });
}

/* ---------- la fenêtre du Val ---------- */
function openVal(tab) {
  if (tab) VAL.tab = tab;
  if (!NET.ok) {
    openModal(`<h2>🌐 Le Val des Maîtres</h2><p>Le Val réunit les châteaux de tous les joueurs : visites, livre d’or, cadeaux, escarmouches, palmarès, créatures qui changent de château… et le <b>château partagé</b> pour bâtir à plusieurs.</p>
      ${NET.why === 'claude' ? `<p>Il se joue sur la version en ligne du jeu, ouverte à tous, sans compte : <a href="${SITE_URL}" target="_blank" rel="noopener">${SITE_URL}</a></p><p class="hint">Ta partie ici reste dans ce navigateur. Les hauts faits du Val se débloquent en ligne.</p>` : '<p class="no">Connexion au Val impossible dans ce navigateur (bibliothèque réseau introuvable ou page non sécurisée).</p>'}`, { label: 'Val des Maîtres' });
    return;
  }
  if (!NET.name) { askMasterName(() => openVal(tab)); return; }
  VAL.open = true; valLoad(); valPublish();
  const m = openModal('<div id="valBody"></div>', { wide: true, cls: 'valm', label: 'Val des Maîtres' });
  const obs = new MutationObserver(() => { if (!m.isConnected) { VAL.open = false; obs.disconnect(); } }); obs.observe($('#modalRoot'), { childList: true });
  m.addEventListener('click', valClick); m.addEventListener('input', e => { if (e.target.id === 'valQ') { VAL.q = e.target.value; renderValList(); } });
  m.addEventListener('change', e => { if (e.target.id === 'valSort') { VAL.sort = e.target.value; renderValList(); } if (e.target.id === 'valPvp') { S.val.pvp = e.target.checked; save(); valPublish(true); renderVal(); } });
  renderVal();
}
function askMasterName(then) {
  const idea = 'Maître ' + pick(MASTER_IDEAS);
  const m = openModal(`<h2>Ton nom de Maître</h2><p>Les autres Maîtres du Val te connaîtront sous ce nom. Pas besoin de compte : ta clé de Maître est gardée dans ce navigateur.</p>
    <div class="field"><label for="mnName">Nom</label><input id="mnName" maxlength="24" value="${esc(idea)}"></div><p class="hint">Évite ton vrai nom : tout ce qui est publié dans le Val est public.</p>
    <div class="mfoot"><button class="sbtn pri" type="button" id="mnGo" data-focus>Entrer dans le Val</button></div>`, { label: 'Nom de Maître' });
  const go = () => { const n = cleanName(m.querySelector('#mnName').value, 24); if (!n) return; setMasterName(n); sfx('chime'); closeModal(true); VAL.pubAt = 0; valPublish(true); then && then(); };
  m.querySelector('#mnGo').addEventListener('click', go);
  m.querySelector('#mnName').addEventListener('keydown', e => { if (e.key === 'Enter') go(); });
}
function renderVal() {
  const box = $('#valBody'); if (!box) return;
  const up = relaysUp(NET_STORE), n = valRivals().length, mail = VAL.mail.length;
  const tabs = [['chateaux', '🏰 Châteaux'], ['palmares', '🏆 Palmarès'], ['courrier', `📬 Courrier${mail ? ' (' + mail + ')' : ''}`], ['partage', '🤝 Château partagé']];
  box.innerHTML = `<h2>🌐 Le Val des Maîtres</h2>
    <p class="hint">Tu es <b>${esc(NET.name)}</b> <button class="link2" type="button" data-act="rename">changer</button> · ${up ? `${up} relais connecté${up > 1 ? 's' : ''}` : 'connexion aux relais…'} · ${n} château${n > 1 ? 'x' : ''} voisin${n > 1 ? 's' : ''} · saison de ${SEASON_NAME(seasonId())}</p>
    <div class="vtabs" role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${VAL.tab === k}">${l}</button>`).join('')}</div>
    <div id="valTab"></div>`;
  const t = box.querySelector('#valTab');
  if (VAL.tab === 'chateaux') {
    t.innerHTML = `<div class="vtools"><input id="valQ" type="search" placeholder="Chercher un château ou un Maître" value="${esc(VAL.q)}" aria-label="Chercher"><select id="valSort" class="sel" aria-label="Trier"><option value="recent" ${VAL.sort === 'recent' ? 'selected' : ''}>Les plus récents</option><option value="hype" ${VAL.sort === 'hype' ? 'selected' : ''}>Notoriété</option><option value="amb" ${VAL.sort === 'amb' ? 'selected' : ''}>Ambiance</option><option value="crit" ${VAL.sort === 'crit' ? 'selected' : ''}>Créatures</option></select><button class="sbtn" type="button" data-act="reload">↻</button></div><div class="vlist" id="valList"></div>
      <label class="tutochk"><input type="checkbox" id="valPvp" ${S.val.pvp ? 'checked' : ''}> Escarmouches entre voisins (décoche pour un château pacifique : on ne peut ni te viser, ni viser les autres)</label>`;
    renderValList();
  } else if (VAL.tab === 'palmares') t.innerHTML = renderBoard();
  else if (VAL.tab === 'courrier') {
    t.innerHTML = `<div class="btnrow"><button class="sbtn" type="button" data-act="mygb">✍️ Mon livre d’or</button><button class="sbtn" type="button" data-act="pub">📣 Publier mon château maintenant</button></div>
      <ul class="chron">${VAL.mail.map(x => `<li class="ev"><span class="emo">${agoText(x.at)}</span><span>${esc(x.text)}</span></li>`).join('') || '<li><span class="hint">Rien pour l’instant. Les cadeaux, les mots du livre d’or, les escarmouches et les créatures qui viennent te rejoindre arrivent ici.</span></li>'}</ul>`;
  } else t.innerHTML = coopPanelHTML();
}
function castleCard(c) {
  const on = nowS() - c.at < ONLINE_S;
  return `<div class="vcard ${c.me ? 'me' : ''}"><div class="vtop">${c.top.map(([sp]) => `<img class="th" alt="" src="${thumb('char', sp)}">`).join('')}</div>
    <div class="vtxt"><b>${esc(c.name)}</b><span>${esc(c.master)} · <i class="dot ${on ? 'on' : ''}"></i>${agoText(c.at)}</span>
    <span>${THEMES[c.theme].emo} Palier ${c.tier} · Nuit ${c.night} · ${c.crit} créature${c.crit > 1 ? 's' : ''} · 🕯️ ${c.amb} · 🔥 ${c.hype} · 🏆 ${c.ach}${c.pvp ? '' : ' · 🕊️ pacifique'}</span></div>
    <div class="vbtn">${c.me ? '<span class="tag2">C’est toi !</span>' : `<button class="sbtn pri" type="button" data-visit="${c.pk}">Visiter</button>`}</div></div>`;
}
function renderValList() {
  const box = $('#valList'); if (!box) return;
  const q = VAL.q.trim().toLowerCase(), key = { recent: 'at', hype: 'hype', amb: 'amb', crit: 'crit' }[VAL.sort] || 'at';
  const all = [...VAL.castles.values()].filter(c => !q || (c.name + ' ' + c.master).toLowerCase().includes(q)).sort((a, b) => b[key] - a[key] || b.at - a.at).slice(0, 80);
  box.innerHTML = all.map(castleCard).join('') || `<p class="hint">${VAL.loading ? 'On interroge les relais du Val…' : 'Aucun château trouvé pour l’instant. Invite tes amis à jouer !'}</p>`;
}
function renderBoard() {
  const season = seasonId(), list = [...VAL.castles.values()].filter(c => c.season === season || seasonId(c.at * 1000) === season);
  const cats = [['hype', '🔥 Notoriété'], ['amb', '🕯️ Ambiance'], ['crit', '🐾 Créatures'], ['ach', '🏆 Hauts faits'], ['legends', '🗿 Légendes']];
  const k = VAL.board, top = [...list].sort((a, b) => b[k] - a[k]).slice(0, 10);
  const leaders = SPECIES_ORDER.map(sp => { let best = null; list.forEach(c => { const v = c.rep[sp] || 0; if (!best || v > best.v) best = { c, v }; }); return best && best.v > 0 ? [sp, best] : null; }).filter(Boolean);
  return `<p class="hint">Saison de ${SEASON_NAME(season)} : ${list.length} château${list.length > 1 ? 'x' : ''} actif${list.length > 1 ? 's' : ''} ce mois-ci.</p>
    <div class="vtabs small">${cats.map(([c, l]) => `<button type="button" data-board="${c}" aria-selected="${k === c}">${l}</button>`).join('')}</div>
    <ol class="board">${top.map((c, i) => `<li class="${c.me ? 'me' : ''}"><span class="rk">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="who"><b>${esc(c.name)}</b><small>${esc(c.master)}</small></span><b class="num">${c[k]}</b>${c.me ? '' : `<button class="sbtn" type="button" data-visit="${c.pk}">Visiter</button>`}</li>`).join('') || '<li class="hint">Personne encore cette saison.</li>'}</ol>
    <h3>Les châteaux chouchous de chaque espèce</h3><div class="leaders">${leaders.map(([sp, b]) => `<div class="leader"><img class="th" alt="" src="${thumb('char', sp)}"><span><b>${esc(SPECIES[sp].name)}</b><small>${esc(b.c.name)} · ${b.v}</small></span></div>`).join('') || '<p class="hint">Pas encore de données.</p>'}</div>`;
}
function valClick(e) {
  const tb = e.target.closest('[data-tab]'); if (tb && tb.closest('.vtabs')) { VAL.tab = tb.dataset.tab; sfx('tick'); renderVal(); return; }
  const bd = e.target.closest('[data-board]'); if (bd) { VAL.board = bd.dataset.board; sfx('tick'); renderVal(); return; }
  const v = e.target.closest('[data-visit]'); if (v) { valVisit(v.dataset.visit); return; }
  const a = e.target.closest('[data-act]'); if (!a) { coopPanelClick(e); return; }
  const k = a.dataset.act;
  if (k === 'reload') valLoad(true);
  else if (k === 'rename') askMasterName(() => openVal());
  else if (k === 'mygb') openGuestbook(NET.pk);
  else if (k === 'pub') { a.disabled = true; valPublish(true).then(n => { toast(n ? `📣 Château publié sur ${n} relais.` : 'Les relais ne répondent pas. Réessaie dans un instant.', !n); a.disabled = false; }); }
  else coopPanelClick(e);
}

// retire ce château du Val : remplace la fiche publique et demande aux relais d’effacer les anciennes
async function valRetire() {
  if (!NET.ok) return 0;
  const a = d => `30078:${NET.pk}:${d}`;
  const gone = ['csd1:castle', 'csd1:map'].map(d => netPublish(NET_STORE, sign(30078, [['d', d], ['t', d === 'csd1:castle' ? 'csd1-val' : 'csd1-map']], JSON.stringify({ v: 1, gone: 1 }))));
  const del = netPublish(NET_STORE, sign(5, [['a', a('csd1:castle')], ['a', a('csd1:map')], ['k', '30078']], 'Château retiré du Val'));
  const r = await Promise.all([...gone, del]); VAL.castles.delete(NET.pk); return r;
}
