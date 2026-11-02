
/* =========================================================
   Atelier du Maître (mode administrateur) — socle
   Données de référence, réglages surchargés, sauvegarde (db partagée
   ou navigateur), droits, champs liés aux données, aperçu des sprites
   ========================================================= */
const ADMIN_KEY = 'cozy-stickers-dungeon-admin-v1';
const TABLES = { SPECIES, CHAR, HERO_ART, ROOMS, FURN, DEFS, RAIDS, LIGHTS };
const BASE_ROOM_ORDER = [...ROOM_ORDER];
const BASE = structuredClone({ SPECIES, CHAR, HERO_ART, ROOMS, FURN, DEFS, RAIDS, LIGHTS, HEROES, TIERS, TUNE, CONST: { CAL_MAX, MENACE_MAX, ...CONSTS } });
let OVR = {};
const ADMIN = { open: false, tab: 'sprites', cat: 'char', sel: { kind: 'char', key: 'gobelin' }, room: 'dortoir', db: null, user: null, sample: null, dl: null,
  allowed: !(window.claude && window.claude.use), mode: 'local', dirty: false, saved: '{}', ideas: [], gen: null, preview: null };
const ACTIONS = {};
const clone = o => o === undefined ? undefined : structuredClone(o);

/* ---------- lecture / écriture des réglages ---------- */
function entryOf(t, k) {
  if (t === 'HEROES') return HEROES.find(h => h.k === k);
  if (t === 'TIERS') return TIERS[+k];
  if (t === 'TUNE') return TUNE;
  if (t === 'CONST') return { CAL_MAX, MENACE_MAX, ...CONSTS };
  return TABLES[t] && TABLES[t][k];
}
function baseOf(t, k) {
  if (t === 'HEROES') return BASE.HEROES.find(h => h.k === k);
  if (t === 'TIERS') return BASE.TIERS[+k];
  if (t === 'TUNE' || t === 'CONST') return BASE[t];
  return BASE[t] && BASE[t][k];
}
const okey = (t, k) => (t === 'TUNE' || t === 'CONST') ? '_' : String(k);
function getv(t, k, f) { const e = entryOf(t, k); return e ? f.split('.').reduce((o, p) => o == null ? undefined : o[p], e) : undefined; }
function isChanged(t, k, f) { const o = OVR[t] && OVR[t][okey(t, k)]; return !!o && (o.__new || f.split('.')[0] in o); }
function setv(t, k, f, v, bool) {
  const parts = f.split('.'), root = parts[0];
  let val = v;
  if (parts.length > 1) { const cur = clone(getv(t, k, root)); val = cur && typeof cur === 'object' ? cur : {}; let o = val; parts.slice(1, -1).forEach(p => { o = o[p] = o[p] || {}; }); o[parts[parts.length - 1]] = v; }
  const key = okey(t, k); OVR[t] = OVR[t] || {}; const isNew = OVR[t][key] && OVR[t][key].__new; OVR[t][key] = OVR[t][key] || {};
  const b = baseOf(t, k), bv = b ? b[root] : undefined;
  const same = bool ? Boolean(bv) === Boolean(val) : JSON.stringify(bv === undefined ? null : bv) === JSON.stringify(val === undefined ? null : val);
  if (!isNew && b && same) delete OVR[t][key][root]; else OVR[t][key][root] = val === undefined ? null : val;
  if (!Object.keys(OVR[t][key]).length) delete OVR[t][key];
  if (!Object.keys(OVR[t]).length) delete OVR[t];
  scheduleApply();
}
function resetEntry(t, k) { if (OVR[t]) { delete OVR[t][okey(t, k)]; if (!Object.keys(OVR[t]).length) delete OVR[t]; } scheduleApply(true); }
function addEntry(t, k, obj) { OVR[t] = OVR[t] || {}; OVR[t][k] = { ...clone(obj), __new: true }; scheduleApply(true); }
const isCustom = (t, k) => !!(OVR[t] && OVR[t][k] && OVR[t][k].__new);

function applyOverrides() {
  for (const t of Object.keys(TABLES)) { const live = TABLES[t]; Object.keys(live).forEach(k => delete live[k]); Object.entries(BASE[t]).forEach(([k, v]) => { live[k] = clone(v); }); }
  HEROES.splice(0, HEROES.length, ...clone(BASE.HEROES)); TIERS.splice(0, TIERS.length, ...clone(BASE.TIERS));
  Object.assign(TUNE, clone(BASE.TUNE)); CAL_MAX = BASE.CONST.CAL_MAX; MENACE_MAX = BASE.CONST.MENACE_MAX; ['START_GOLD', 'START_MAT', 'WORK'].forEach(c => { CONSTS[c] = BASE.CONST[c]; });
  for (const [t, entries] of Object.entries(OVR)) for (const [k, fields] of Object.entries(entries || {})) {
    if (!fields) continue;
    if (t === 'TUNE') Object.assign(TUNE, fields);
    else if (t === 'CONST') { if (fields.CAL_MAX) CAL_MAX = fields.CAL_MAX; if (fields.MENACE_MAX) MENACE_MAX = fields.MENACE_MAX; ['START_GOLD', 'START_MAT', 'WORK'].forEach(c => { if (fields[c] != null) CONSTS[c] = fields[c]; }); }
    else if (t === 'HEROES') { const h = HEROES.find(x => x.k === k); if (h) Object.assign(h, clone(fields)); }
    else if (t === 'TIERS') { const ti = TIERS[+k]; if (ti) Object.assign(ti, clone(fields)); }
    else if (TABLES[t]) { if (TABLES[t][k] && !fields.__new) Object.assign(TABLES[t][k], clone(fields)); else if (fields.__new) TABLES[t][k] = clone(fields); }
  }
  SPECIES_ORDER.splice(0, SPECIES_ORDER.length, ...Object.keys(SPECIES));
  ROOM_ORDER.splice(0, ROOM_ORDER.length, ...BASE_ROOM_ORDER.filter(k => ROOMS[k]), ...Object.keys(ROOMS).filter(k => !BASE_ROOM_ORDER.includes(k) && !ROOMS[k].fixed));
  FURN_ORDER.splice(0, FURN_ORDER.length, ...Object.keys(FURN).filter(k => FURN[k].room !== 'any'));
  DECOR_ORDER.splice(0, DECOR_ORDER.length, ...Object.keys(FURN).filter(k => FURN[k].room === 'any'));
  DEF_ORDER.splice(0, DEF_ORDER.length, ...Object.keys(DEFS));
  Object.entries(FURN).forEach(([k, f]) => { const r = ROOMS[f.room]; if (r) { r.furn = r.furn || []; if (!r.furn.includes(k)) r.furn.push(k); } });
  Object.values(ROOMS).forEach(r => { if (r.furn) r.furn = r.furn.filter(k => FURN[k] && FURN[k].room !== 'any'); });
  sortLimbo();
  if (ADMIN.gen) CHAR.__gen = ADMIN.gen.art;
  SPR.clear(); THUMBS.clear(); FLOOR_CACHE.clear(); dirty(); V.dirty = true;
}
// éléments d'une partie dont le type n'existe pas (ou plus) : mis de côté, puis rendus quand leur type revient
function sortLimbo() {
  if (!S) return;
  const L = S.limbo || (S.limbo = {}), ok = { creatures: c => SPECIES[c.sp], furn: f => FURN[f.t], defs: d => DEFS[d.t], rooms: r => ROOMS[r.t] };
  for (const k of Object.keys(ok)) { const all = [...(S[k] || []), ...(L[k] || [])]; S[k] = all.filter(ok[k]); L[k] = all.filter(x => !ok[k](x)); }
  dirty();
}
let applyTimer = 0;
function scheduleApply(rerender) {
  ADMIN.dirty = JSON.stringify(OVR) !== ADMIN.saved;
  clearTimeout(applyTimer);
  applyTimer = setTimeout(() => { applyOverrides(); renderAll(); refreshAdminChrome(); if (rerender && ADMIN.open) renderAdminTab(); else if (ADMIN.onApply) ADMIN.onApply(); }, 140);
}

/* ---------- sauvegarde ---------- */
async function saveOverrides() {
  const js = JSON.stringify(OVR);
  if (ADMIN.mode === 'db' && ADMIN.db) {
    try { await ADMIN.db.doc('admin/tuning').set({ overrides: JSON.parse(js), updatedAt: Date.now(), format: 1 }); ADMIN.saved = js; ADMIN.dirty = false; toast('Réglages enregistrés : tous les joueurs les reçoivent.'); }
    catch (e) { toast(`Enregistrement refusé (${e && e.code || 'erreur'}). Tes modifications restent en brouillon.`, true); }
  } else { try { localStorage.setItem(ADMIN_KEY, js); } catch (e) {} ADMIN.saved = js; ADMIN.dirty = false; toast('Réglages enregistrés dans ce navigateur.'); }
  refreshAdminChrome();
}
function revertOverrides() { OVR = JSON.parse(ADMIN.saved || '{}'); ADMIN.dirty = false; applyOverrides(); renderAll(); if (ADMIN.open) renderAdmin(); }
async function initAdmin() {
  if (!(window.claude && window.claude.use)) {
    // version web : les réglages publiés viennent de tuning.json ; l’Atelier (?atelier) les modifie dans ce navigateur seulement
    ADMIN.mode = 'local';
    const web = !/^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
    ADMIN.allowed = !web || /[?&]atelier\b/.test(location.search) || location.hash === '#admin';
    let base = null; try { const r = await fetch('tuning.json', { cache: 'no-cache' }); if (r.ok) base = await r.json(); } catch (e) {}
    try {
      const raw = ADMIN.allowed ? localStorage.getItem(ADMIN_KEY) : null, o = raw ? JSON.parse(raw) : base;
      if (o && typeof o === 'object' && Object.keys(o).length) { OVR = o; ADMIN.saved = JSON.stringify(o); applyOverrides(); sortLimbo(); renderAll(); }
    } catch (e) {}
    loadLocalIdeas(); showAdminEntry(); return;
  }
  const use = n => Promise.resolve(window.claude.use(n)).catch(() => null);
  const [user, db, sample, dl] = await Promise.all([use('user'), use('db'), use('sample'), use('downloads')]);
  Object.assign(ADMIN, { user, db, sample, dl });
  ADMIN.allowed = user ? !!(await user.canEdit().catch(() => false)) : false;
  ADMIN.mode = db ? 'db' : 'local';
  if (db) {
    db.doc('admin/tuning').onSnapshot(snap => {
      const d = snap.exists ? snap.data() : null, o = d && d.overrides ? clone(d.overrides) : {}, js = JSON.stringify(o);
      if (js === ADMIN.saved) return;
      ADMIN.saved = js;
      if (ADMIN.dirty) { toast('Les réglages ont changé ailleurs : enregistre ou annule tes modifications.'); refreshAdminChrome(); return; }
      OVR = o; applyOverrides(); renderAll(); if (ADMIN.open) renderAdmin();
    }, () => {});
    if (ADMIN.allowed) db.collection('ideas').onSnapshot(qs => { ADMIN.ideas = qs.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => (b.at || 0) - (a.at || 0)); if (ADMIN.open && ADMIN.tab === 'ideas') renderAdminTab(); }, () => {});
  } else { try { const raw = localStorage.getItem(ADMIN_KEY); if (raw && ADMIN.allowed) { OVR = JSON.parse(raw); ADMIN.saved = raw; applyOverrides(); renderAll(); } } catch (e) {} loadLocalIdeas(); }
  showAdminEntry();
}
function showAdminEntry() { const b = $('#btnAdmin'); if (b) b.hidden = !ADMIN.allowed; if (ADMIN.allowed && location.hash === '#admin') openAdmin(); }
function loadLocalIdeas() { try { ADMIN.ideas = JSON.parse(localStorage.getItem(ADMIN_KEY + '-ideas') || '[]'); } catch (e) { ADMIN.ideas = []; } }
function saveLocalIdeas() { try { localStorage.setItem(ADMIN_KEY + '-ideas', JSON.stringify(ADMIN.ideas)); } catch (e) {} }
async function ideaAdd(o) { if (ADMIN.mode === 'db') await ADMIN.db.collection('ideas').add(o); else { ADMIN.ideas.unshift({ id: 'l' + Date.now(), ...o }); saveLocalIdeas(); renderAdminTab(); } }
async function ideaUpd(id, o) { if (ADMIN.mode === 'db') await ADMIN.db.doc('ideas/' + id).update(o); else { Object.assign(ADMIN.ideas.find(i => i.id === id) || {}, o); saveLocalIdeas(); renderAdminTab(); } }
async function ideaDel(id) { if (ADMIN.mode === 'db') await ADMIN.db.doc('ideas/' + id).delete(); else { ADMIN.ideas = ADMIN.ideas.filter(i => i.id !== id); saveLocalIdeas(); renderAdminTab(); } }
async function copyText(text, area) { try { await navigator.clipboard.writeText(text); toast('Copié dans le presse-papiers.'); } catch (e) { if (area) { area.focus(); area.select(); } toast('Copie bloquée : le texte est sélectionné, fais Ctrl+C.', true); } }
async function downloadText(name, text) {
  if (!ADMIN.dl && !(window.claude && window.claude.use)) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000); return; }
  if (!ADMIN.dl) { toast('Téléchargement indisponible ici : utilise « Copier ».', true); return; } try { await ADMIN.dl.save({ filename: name, data: text }); } catch (e) { if (e && e.code !== 'declined') toast('Téléchargement impossible : utilise « Copier ».', true); } }

/* ---------- coquille ---------- */
const ATABS = [['sprites', 'Sprites', '🎨'], ['rooms', 'Pièces', '🏰'], ['eco', 'Économie', '⚖️'], ['sandbox', 'Bac à sable', '🧪'], ['render', 'Rendu', '💡'], ['ideas', 'Idées', '📝'], ['ai', 'Atelier IA', '✨'], ['data', 'Données', '💾']];
const ADMIN_TABS = {};
function openAdmin() { if (!ADMIN.allowed) return; ADMIN.open = true; $('#admin').hidden = false; $('#adminFab').hidden = true; renderAdmin(); }
function closeAdmin() { ADMIN.open = false; ADMIN.preview = null; $('#admin').hidden = true; $('#adminFab').hidden = true; }
function minimizeAdmin() { ADMIN.open = false; ADMIN.preview = null; $('#admin').hidden = true; $('#adminFab').hidden = false; }
function renderAdmin() {
  $('#admin').innerHTML = `<div class="adm" role="dialog" aria-label="Atelier du Maître">
    <header class="adm-head"><div class="adm-title"><b>Atelier du Maître</b><small>Tout pour faire évoluer le château</small></div><span class="adm-status" id="admStatus"></span>
      <div class="adm-hbtns"><button class="sbtn pri" type="button" data-act="save">Enregistrer</button><button class="sbtn" type="button" data-act="revert">Annuler les modifications</button><button class="sbtn" type="button" data-act="min" title="Voir le château en gardant l'atelier sous la main">Réduire</button><button class="sbtn" type="button" data-act="close">Fermer</button></div></header>
    <nav class="adm-tabs" role="tablist">${ATABS.map(([k, l, e]) => `<button type="button" role="tab" data-act="tab" data-arg="${k}" aria-selected="${ADMIN.tab === k}"><span class="emo">${e}</span>${l}</button>`).join('')}</nav>
    <section class="adm-body" id="admBody"></section></div>`;
  refreshAdminChrome(); renderAdminTab();
}
function refreshAdminChrome() {
  const st = $('#admStatus'); if (!st) return;
  const n = countOverrides();
  st.className = 'adm-status' + (ADMIN.dirty ? ' warn' : '');
  st.textContent = ADMIN.dirty ? 'Brouillon non enregistré' : ADMIN.mode === 'db' ? `${n} réglage${n > 1 ? 's' : ''} partagé${n > 1 ? 's' : ''} avec tous les joueurs` : `${n} réglage${n > 1 ? 's' : ''} dans ce navigateur`;
}
function countOverrides() { let n = 0; Object.values(OVR).forEach(e => Object.values(e || {}).forEach(f => { n += f && f.__new ? 1 : Object.keys(f || {}).length; })); return n; }
function renderAdminTab() { ADMIN.preview = null; ADMIN.onApply = null; const b = $('#admBody'); if (!b) return; b.innerHTML = ''; b.scrollTop = 0; (ADMIN_TABS[ADMIN.tab] || ADMIN_TABS.sprites)(b); }

/* ---------- champs liés aux données ---------- */
function fld(t, k, f, label, type = 'num', o = {}) {
  const v = getv(t, k, f), b = `${t}|${k}|${f}|${type}`, chg = isChanged(t, k, f) ? ' chg' : '';
  let input;
  if (type === 'num') input = `<input type="number" step="${o.step || 1}"${o.min != null ? ` min="${o.min}"` : ''}${o.max != null ? ` max="${o.max}"` : ''} value="${v ?? ''}" data-b="${b}">`;
  else if (type === 'range') input = `<span class="rng"><input type="range" min="${o.min}" max="${o.max}" step="${o.step}" value="${v ?? 0}" data-b="${b}"><output>${v ?? 0}</output></span>`;
  else if (type === 'text') input = `<input type="text" value="${esc(v ?? '')}" data-b="${b}">`;
  else if (type === 'area') input = `<textarea rows="${o.rows || 2}" data-b="${b}">${esc(v ?? '')}</textarea>`;
  else if (type === 'lines') input = `<textarea rows="${o.rows || 3}" data-b="${b}">${esc((v || []).join('\n'))}</textarea>`;
  else if (type === 'color') input = `<span class="colw"><input type="color" value="${v || '#888888'}" data-b="${b}"${v ? '' : ' class="none"'}>${o.opt ? `<button type="button" class="mini" data-act="unset" data-arg="${b}" title="Retirer">×</button>` : ''}</span>`;
  else if (type === 'sel' || type === 'seln') input = `<select data-b="${b}">${o.opts.map(([val, lab]) => `<option value="${esc(val)}"${String(v ?? '') === String(val) ? ' selected' : ''}>${esc(lab)}</option>`).join('')}</select>`;
  else if (type === 'bool') input = `<input type="checkbox"${v ? ' checked' : ''} data-b="${b}">`;
  return `<label class="af${chg}${type === 'area' || type === 'lines' ? ' wide' : ''}${type === 'bool' ? ' chk' : ''}"><span>${esc(label)}</span>${input}</label>`;
}
function parseField(el, type) {
  if (type === 'num' || type === 'range' || type === 'seln') { const n = parseFloat(el.value); return isNaN(n) ? undefined : n; }
  if (type === 'bool') return el.checked;
  if (type === 'lines') return el.value.split('\n').map(s => s.trim()).filter(Boolean);
  if (type === 'sel') return el.value === '' ? undefined : el.value;
  return el.value;
}
const optsOf = (obj, none) => [...(none ? [['', none]] : []), ...Object.keys(obj).map(k => [k, (obj[k] && obj[k].name) || k])];

/* ---------- aperçu animé ---------- */
function startPreview(cvs, kind, key, o = {}) { ADMIN.preview = { cv: cvs, kind, key, walk: false, flip: false, lit: true, zoom: 1, ...o }; requestAnimationFrame(previewFrame); }
function previewFrame(t) {
  const p = ADMIN.preview; if (!p || !ADMIN.open || !p.cv.isConnected) return; requestAnimationFrame(previewFrame);
  const c = p.cv, dpr = Math.min(2, devicePixelRatio || 1), w = c.clientWidth, h = c.clientHeight; if (!w || !h) return;
  if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
  const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const bg = g.createRadialGradient(w / 2, h * .66, 10, w / 2, h * .66, w * .8); bg.addColorStop(0, '#3c2c20'); bg.addColorStop(1, '#0c090b'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  const s = Math.min(w / 320, h / 260) * p.zoom; g.save(); g.translate(w / 2, h * .72); g.scale(s, s);
  g.save(); g.transform(64 / TEXT, 32 / TEXT, -64 / TEXT, 32 / TEXT, 0, -64); g.drawImage(roomTexture({ id: 'adm-floor', t: 'taverne', w: 2, h: 2, built: true }), 0, 0); g.restore();
  shadowEll(g, 0, 2, 30, 15, .45);
  const person = p.kind === 'char' || p.kind === 'hero', spr = getSprite(p.kind, p.key), k = AU / SQ() * (person ? 1.08 : p.kind === 'x' ? 1.2 : 1);
  const bob = p.walk ? Math.abs(Math.sin(t / 95)) * 5 : 0, breath = person && !p.walk ? 1 + Math.sin(t / 520) * .018 : 1;
  g.save(); g.translate(0, -bob); if (p.flip) g.scale(-1, 1); g.scale(k, k * breath); g.drawImage(spr.img, -spr.ax, -spr.ay); g.restore();
  if (p.kind === 'furn') (FLAMES[p.key] || FLAMES[(FURN[p.key] || {}).sprite] || []).forEach(([ax, ay, az, sc], i) => { const [px, py] = pt(ax, ay, az); drawFlame(g, px * AU, py * AU, sc * 1.9, t, i * 3); });
  g.restore();
  if (p.lit) { const lg = g.createRadialGradient(w / 2, h * .62, Math.min(w, h) * .18, w / 2, h * .62, Math.max(w, h) * .7); lg.addColorStop(0, 'rgba(12,9,28,0)'); lg.addColorStop(1, `rgba(12,9,28,${TUNE.ambient})`); g.fillStyle = lg; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'lighter'; const gl = g.createRadialGradient(w / 2, h * .6, 0, w / 2, h * .6, w * .4); gl.addColorStop(0, 'rgba(255,176,96,.18)'); gl.addColorStop(1, 'rgba(255,176,96,0)'); g.fillStyle = gl; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'source-over'; }
}

/* ---------- événements de l'atelier (un seul écouteur délégué) ---------- */
function bindAdmin() {
  const root = $('#admin');
  const onField = e => {
    const el = e.target, b = el.dataset && el.dataset.b; if (!b) return;
    const [t, k, f, type] = b.split('|'); const v = parseField(el, type);
    if (type === 'range') { const out = el.parentElement.querySelector('output'); if (out) out.textContent = v; }
    if (type === 'color') el.classList.remove('none');
    setv(t, k, f, v, type === 'bool'); const lab = el.closest('.af'); if (lab) lab.classList.add('chg');
  };
  root.addEventListener('input', e => { if (e.target.type !== 'checkbox' && e.target.tagName !== 'SELECT') onField(e); });
  root.addEventListener('change', e => { if (e.target.type === 'checkbox' || e.target.tagName === 'SELECT') onField(e); });
  root.addEventListener('click', e => { const a = e.target.closest('[data-act]'); if (!a || !root.contains(a)) return; const fn = ACTIONS[a.dataset.act]; if (fn) fn(a.dataset.arg, a, e); });
  $('#btnAdmin').addEventListener('click', openAdmin);
  $('#adminFab').addEventListener('click', openAdmin);
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && ADMIN.open && !$('#modalRoot').children.length) closeAdmin(); });
}
Object.assign(ACTIONS, {
  tab: k => { ADMIN.tab = k; document.querySelectorAll('.adm-tabs [data-act="tab"]').forEach(b => b.setAttribute('aria-selected', b.dataset.arg === k)); renderAdminTab(); },
  save: () => saveOverrides(), revert: () => revertOverrides(), min: () => minimizeAdmin(), close: () => closeAdmin(),
  unset: arg => { const [t, k, f] = arg.split('|'); setv(t, k, f, undefined); setTimeout(renderAdminTab, 180); },
});
