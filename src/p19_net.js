
/* =========================================================
   Réseau : identité de Maître et relais Nostr publics.
   Aucun compte ni serveur à entretenir : chaque joueur signe
   ses messages avec une clé gardée dans son navigateur.
   ========================================================= */
const NET_STORE = ['wss://nos.lol', 'wss://relay.primal.net', 'wss://nostr.mom', 'wss://relay.nostr.net'];
const NET_LIVE = ['wss://relay.snort.social', 'wss://relay.nostr.net', 'wss://nos.lol'];
const SITE_URL = 'https://laucans.github.io/cozy-stickers-dungeon/';
const ID_KEY = 'csd-identity-v1' + (PROFILE ? '-' + PROFILE : '');
const NET = { ok: false, why: '', sk: null, pk: '', name: '', relays: new Map(), seq: 0 };
const nowS = () => Math.floor(Date.now() / 1000);
const inClaude = () => !!(window.claude && window.claude.use);
const netUsable = () => NET.ok;
const bytesHex = b => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
const hexBytes = h => new Uint8Array(h.match(/../g).map(x => parseInt(x, 16)));
const b64 = u8 => { let s = ''; for (let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
const unb64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const rid = (n = 10) => bytesHex(crypto.getRandomValues(new Uint8Array(n)));
const cleanName = (v, n) => String(v == null ? '' : v).replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, n);

function initNet() {
  if (inClaude()) { NET.why = 'claude'; return; }
  if (/[?&]horsligne\b/.test(location.search)) { NET.why = 'offline'; return; }   // ?horsligne : jouer (ou tester) sans rien envoyer au Val
  if (!window.NostrTools || !window.WebSocket || !(window.crypto && crypto.subtle) || !window.isSecureContext) { NET.why = 'lib'; return; }
  try {
    let id = null; try { id = JSON.parse(localStorage.getItem(ID_KEY) || 'null'); } catch (e) {}
    if (!id || !/^[0-9a-f]{64}$/.test(id.sk || '')) { id = { sk: bytesHex(NostrTools.generateSecretKey()), name: '' }; localStorage.setItem(ID_KEY, JSON.stringify(id)); }
    NET.sk = hexBytes(id.sk); NET.pk = NostrTools.getPublicKey(NET.sk); NET.name = cleanName(id.name, 24);
    NET.ok = true;
  } catch (e) { NET.why = 'id'; console.error(e); return; }
  valBoot(); coopBoot();
}
function setMasterName(n) {
  NET.name = cleanName(n, 24);
  try { const id = JSON.parse(localStorage.getItem(ID_KEY)); id.name = NET.name; localStorage.setItem(ID_KEY, JSON.stringify(id)); } catch (e) {}
}

/* ---------- relais ---------- */
function relay(url) {
  let r = NET.relays.get(url); if (r) return r;
  r = { url, ws: null, open: false, q: [], subs: new Map(), pend: new Map(), wait: 1500, timer: 0 };
  NET.relays.set(url, r); relayConnect(r); return r;
}
function relayConnect(r) {
  let ws; try { ws = new WebSocket(r.url); } catch (e) { relayRetry(r); return; }
  r.ws = ws;
  ws.onopen = () => { r.open = true; r.wait = 1500; r.subs.forEach((s, id) => ws.send(JSON.stringify(['REQ', id, ...s.filters()]))); const q = r.q; r.q = []; q.forEach(m => ws.send(m)); };
  ws.onmessage = ev => { let m; try { m = JSON.parse(ev.data); } catch (e) { return; } relayMsg(r, m); };
  ws.onclose = () => { r.open = false; r.subs.forEach(s => s.end()); r.pend.forEach(p => p(false)); r.pend.clear(); relayRetry(r); };
  ws.onerror = () => {};
}
function relayRetry(r) { clearTimeout(r.timer); r.timer = setTimeout(() => relayConnect(r), r.wait); r.wait = Math.min(30000, r.wait * 2); }
function relaySend(r, m) { const s = JSON.stringify(m); if (r.open && r.ws.readyState === 1) r.ws.send(s); else if (r.q.length < 80) r.q.push(s); }
function relayMsg(r, m) {
  const s = r.subs.get(m[1]);
  if (m[0] === 'EVENT' && s && m[2]) s.onev(m[2], r.url);
  else if ((m[0] === 'EOSE' || m[0] === 'CLOSED') && s) s.end();
  else if (m[0] === 'OK') { const p = r.pend.get(m[1]); if (p) { r.pend.delete(m[1]); p(!!m[2], m[3]); } }
}
const relaysUp = urls => urls.filter(u => { const r = NET.relays.get(u); return r && r.open; }).length;

/* ---------- abonnements, requêtes, publications ---------- */
// filters : tableau, ou fonction qui le renvoie (recalculée à chaque reconnexion, pratique pour « since »)
function netSub(urls, filters, onev, oneose, ms = 5500) {
  const id = 'c' + (++NET.seq).toString(36) + rid(3), seen = new Set(), F = typeof filters === 'function' ? filters : () => filters;
  let left = urls.length, done = false;
  const fin = () => { if (!done) { done = true; clearTimeout(to); if (oneose) oneose(); } };
  const to = setTimeout(fin, ms);
  urls.forEach(u => {
    const r = relay(u); let ended = false;
    r.subs.set(id, { filters: F, onev: (ev, url) => { if (!ev.id || seen.has(ev.id)) return; seen.add(ev.id); if (seen.size > 4000) seen.clear(); onev(ev, url); }, end: () => { if (!ended) { ended = true; if (--left <= 0) fin(); } } });
    if (r.open && r.ws.readyState === 1) r.ws.send(JSON.stringify(['REQ', id, ...F()]));
  });
  return { close() { urls.forEach(u => { const r = NET.relays.get(u); if (r && r.subs.delete(id) && r.open) relaySend(r, ['CLOSE', id]); }); } };
}
function netQuery(urls, filters, ms = 6500) {
  return new Promise(res => { const out = []; let h = null, over = false; const end = () => { if (over) return; over = true; setTimeout(() => h && h.close(), 0); res(out); }; h = netSub(urls, filters, ev => out.push(ev), end, ms); });
}
function netPublish(urls, ev) {
  return Promise.all(urls.map(u => new Promise(res => {
    const r = relay(u), to = setTimeout(() => { r.pend.delete(ev.id); res(false); }, 8000);
    r.pend.set(ev.id, ok => { clearTimeout(to); res(ok); }); relaySend(r, ['EVENT', ev]);
  }))).then(a => a.filter(Boolean).length);
}
const sign = (kind, tags, content) => NostrTools.finalizeEvent({ kind, created_at: nowS(), tags, content }, NET.sk);
function safeVerify(ev) { try { return NostrTools.verifyEvent(ev); } catch (e) { return false; } }
const tagOf = (ev, k) => ((ev.tags || []).find(t => t[0] === k) || [])[1];

/* ---------- emballage : JSON compressé, chiffrement des salons ---------- */
async function packJSON(o) {
  const s = JSON.stringify(o);
  if (!window.CompressionStream) return 'j:' + s;
  const cs = new Blob([s]).stream().pipeThrough(new CompressionStream('deflate-raw'));
  return 'z:' + b64(new Uint8Array(await new Response(cs).arrayBuffer()));
}
async function unpackJSON(str) {
  if (typeof str !== 'string' || str.length > 400000) throw new Error('taille');
  if (str.startsWith('j:')) return JSON.parse(str.slice(2));
  if (str.startsWith('z:')) { const ds = new Blob([unb64(str.slice(2))]).stream().pipeThrough(new DecompressionStream('deflate-raw')); const txt = await new Response(ds).text(); if (txt.length > 2000000) throw new Error('taille'); return JSON.parse(txt); }
  throw new Error('format');
}
async function roomKeys(code) {
  const enc = new TextEncoder(), h = async s => new Uint8Array(await crypto.subtle.digest('SHA-256', enc.encode(s)));
  return { tag: bytesHex(await h('csd-room-tag:' + code)).slice(0, 24), key: await crypto.subtle.importKey('raw', await h('csd-room-key:' + code), 'AES-GCM', false, ['encrypt', 'decrypt']) };
}
async function seal(key, obj) {
  const iv = crypto.getRandomValues(new Uint8Array(12)), data = new TextEncoder().encode(await packJSON(obj));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, data)), all = new Uint8Array(12 + ct.length);
  all.set(iv); all.set(ct, 12); return b64(all);
}
async function unseal(key, str) {
  const raw = unb64(str), pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: raw.slice(0, 12) }, key, raw.slice(12));
  return unpackJSON(new TextDecoder().decode(pt));
}
