
/* =========================================================
   Le château partagé : plusieurs Maîtres dans le même château,
   en temps réel. L’hôte fait foi : les invités lui envoient leurs
   actions, il les vérifie et renvoie l’état du château à tous.
   Les messages sont chiffrés avec le code du salon.
   ========================================================= */
const COOP = { role: null, code: '', tag: '', key: null, sub: null, me: null, peers: new Map(), host: null, own: null, busy: false, rev: 0, snapTimer: 0,
  curT: 0, curKey: '', ready: false, armed: 0, timers: [], hostAt: 0, tokens: 6, tokT: 0 };
const COOP_COLORS = ['#ff9c3a', '#5ad1ff', '#c49bff', '#7fe07f', '#ff7aa8', '#ffd95a'];
const COOP_KIND = 25078, COOP_MAX = 5;
const CODE_ABC = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const newCode = () => Array.from(crypto.getRandomValues(new Uint8Array(6)), x => CODE_ABC[x % CODE_ABC.length]).join('');
const normCode = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
const coopLink = () => SITE_URL.replace(/\/$/, '/') + '?coop=' + COOP.code;
const hexRgb = h => { const n = parseInt(h.slice(1), 16); return `${n >> 16 & 255},${n >> 8 & 255},${n & 255}`; };
const plain = h => { try { return new DOMParser().parseFromString(String(h), 'text/html').body.textContent || ''; } catch (e) { return ''; } };

function coopBoot() {
  cv.addEventListener('pointermove', coopCursor);
  $('#coopbar').addEventListener('click', coopBarClick);
  $('#coopbar').addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.id === 'coopMsg') coopChat(); });
  let code = ''; try { code = normCode(new URLSearchParams(location.search).get('coop')); } catch (e) {}
  if (code.length === 6) setTimeout(() => { if (NET.name) coopJoin(code); else askMasterName(() => coopJoin(code)); }, 700);
}

/* ---------- transport ---------- */
async function coopSend(msg) {
  if (!COOP.role || !COOP.key) return;
  const now = performance.now(); COOP.tokens = Math.min(6, COOP.tokens + (now - COOP.tokT) / 220); COOP.tokT = now;
  if (msg.t === 'cur' && COOP.tokens < 2) return;
  COOP.tokens = Math.max(0, COOP.tokens - 1);
  try {
    const ev = sign(COOP_KIND, [['t', COOP.tag]], await seal(COOP.key, { ...msg, from: COOP.me.id }));
    NET_LIVE.forEach(u => relaySend(relay(u), ['EVENT', ev]));
  } catch (e) { console.error(e); }
}
async function coopOpen(code) {
  COOP.code = code; const k = await roomKeys(code); COOP.tag = k.tag; COOP.key = k.key;
  COOP.sub = netSub(NET_LIVE, () => [{ kinds: [COOP_KIND], '#t': [COOP.tag], since: nowS() - 10 }], coopRecv, null, 4000);
  COOP.timers.push(setInterval(coopTick, 4000));
}
async function coopRecv(ev) {
  if (!COOP.key) return;
  let m; try { m = await unseal(COOP.key, ev.content); } catch (e) { return; }
  if (!m || typeof m !== 'object' || !m.from || m.from === COOP.me.id) return;
  const p = COOP.peers.get(m.from); if (p) p.at = Date.now();
  if (COOP.role === 'host') coopHostMsg(m, ev.pubkey); else coopGuestMsg(m);
}
function coopTick() {
  const now = Date.now();
  coopSend({ t: 'ping', name: COOP.me.name, color: COOP.me.color, ready: COOP.ready });
  if (COOP.role === 'host') {
    let gone = false; COOP.peers.forEach((p, id) => { if (now - p.at > 30000) { COOP.peers.delete(id); gone = true; toast(`👋 ${p.name} a quitté ton château.`); } });
    if (gone) { coopSend({ t: 'peers', list: coopPeerList() }); renderCoopBar(); }
  } else if (COOP.role === 'guest' && now - COOP.hostAt > 35000) { toast(`Le château de ${COOP.host ? COOP.host.name : 'l’hôte'} ne répond plus. Retour chez toi.`, true); coopLeave(); }
}
const coopPeerList = () => [{ id: COOP.me.id, name: COOP.me.name, color: COOP.me.color, host: true }, ...[...COOP.peers.values()].map(p => ({ id: p.id, name: p.name, color: p.color, ready: p.ready }))];

/* ---------- hôte ---------- */
async function coopHost() {
  if (!NET.ok || COOP.role || VISIT || !S.started) return;
  COOP.role = 'host'; COOP.me = { id: rid(4), name: NET.name || 'Maître', color: COOP_COLORS[0] }; COOP.rev = 0;
  await coopOpen(newCode());
  renderCoopBar(); sfx('chime');
  toast(`🤝 Château partagé ouvert ! Code ${COOP.code}`);
  if (VAL.open) renderVal();
}
function coopHostMsg(m, pk) {
  const p = COOP.peers.get(m.from);
  if (m.t === 'hello') {
    if (!p && COOP.peers.size >= COOP_MAX) { coopSend({ t: 'full', to: m.from }); return; }
    const used = new Set([COOP.me.color, ...[...COOP.peers.values()].map(x => x.color)]);
    const peer = p || { id: m.from, pk, name: cleanName(m.name, 24) || 'Maître', color: COOP_COLORS.find(c => !used.has(c)) || COOP_COLORS[1], at: Date.now(), ready: false };
    if (!p) { COOP.peers.set(m.from, peer); toast(`🤝 ${peer.name} entre dans ton château !`); sfx('chime'); }
    coopSend({ t: 'welcome', to: m.from, s: S, rev: ++COOP.rev, host: { id: COOP.me.id, name: COOP.me.name, color: COOP.me.color }, color: peer.color, busy: UI.busy });
    coopSend({ t: 'peers', list: coopPeerList() }); renderCoopBar();
    return;
  }
  if (!p) return;
  if (m.t === 'cmd') {
    if (UI.busy) { coopSend({ t: 'nack', to: m.from, err: 'La nuit est en cours, patience !' }); return; }
    const f = CMD[m.c]; if (!f || m.c === 'rename') return;
    let err = null; try { err = f(m.a || {}); } catch (e) { err = 'Action impossible'; }
    if (err) { coopSend({ t: 'nack', to: m.from, err }); coopDirty(); return; }
    afterChange(); coopDirty();
  } else if (m.t === 'cur') { Object.assign(p, { x: +m.x, y: +m.y, z: +m.z || 0, hand: Array.isArray(m.h) ? m.h : null, curAt: Date.now() }); }
  else if (m.t === 'ready') { p.ready = !!m.on; renderCoopBar(); coopSend({ t: 'peers', list: coopPeerList() }); if (m.on && [...COOP.peers.values()].every(x => x.ready)) toast('🌙 Tout le monde est prêt : lance la nuit quand tu veux !'); }
  else if (m.t === 'ping') { p.name = cleanName(m.name, 24) || p.name; p.ready = !!m.ready; }
  else if (m.t === 'chat') coopShowChat(p, m.text);
  else if (m.t === 'bye') { COOP.peers.delete(m.from); toast(`👋 ${p.name} a quitté ton château.`); coopSend({ t: 'peers', list: coopPeerList() }); renderCoopBar(); }
}
function coopDirty() { if (COOP.role !== 'host') return; clearTimeout(COOP.snapTimer); COOP.snapTimer = setTimeout(() => coopSend({ t: 'snap', s: S, rev: ++COOP.rev }), 250); }
function coopNightGate() {
  if (COOP.role === 'guest') {
    COOP.ready = !COOP.ready; coopSend({ t: 'ready', on: COOP.ready }); renderCoopBar(); sfx('tick');
    toast(COOP.ready ? '✋ Tu es prêt·e. L’hôte lancera la nuit.' : 'Tu n’es plus prêt·e.'); return false;
  }
  if (COOP.role === 'host') {
    const wait = [...COOP.peers.values()].filter(p => !p.ready);
    if (wait.length && Date.now() - COOP.armed > 5000) { COOP.armed = Date.now(); toast(`${wait.map(p => p.name).join(', ')} : pas encore prêt·e${wait.length > 1 ? 's' : ''}. Clique encore pour lancer la nuit quand même.`); return false; }
    COOP.armed = 0; clearTimeout(COOP.snapTimer); coopSend({ t: 'snap', s: S, rev: ++COOP.rev }); coopSend({ t: 'busy', on: true });
  }
  return true;
}
function coopNightDone() {
  if (COOP.role !== 'host') return;
  COOP.peers.forEach(p => { p.ready = false; });
  coopSend({ t: 'busy', on: false }); coopSend({ t: 'snap', s: S, rev: ++COOP.rev }); coopSend({ t: 'peers', list: coopPeerList() }); renderCoopBar();
}
function coopCast(t, o) { if (COOP.role === 'host') coopSend({ t, ...o }); }

/* ---------- invité ---------- */
async function coopJoin(code) {
  code = normCode(code);
  if (!NET.ok || code.length !== 6) { toast('Code de château invalide.', true); return; }
  if (COOP.role) { if (COOP.code === code) return; coopLeave(true); }
  if (VISIT) leaveVisit(true);
  if (UI.busy) { toast('Termine d’abord ta nuit en cours.', true); return; }
  save();
  COOP.role = 'joining'; COOP.me = { id: rid(4), name: NET.name || 'Maître', color: '#ffffff' }; COOP.rev = -1; COOP.hostAt = Date.now();
  await coopOpen(code);
  closeModal(true); renderCoopBar(); toast(`🤝 On frappe à la porte du château ${code}…`);
  let n = 0; const hello = () => { if (COOP.role !== 'joining') return; if (n++ >= 10) { toast('Aucun château ne répond à ce code. Vérifie-le, ou demande à ton ami de rouvrir son château.', true); coopLeave(true); return; } coopSend({ t: 'hello', name: COOP.me.name }); COOP.helloT = setTimeout(hello, 2500); };
  hello();
}
function coopGuestMsg(m) {
  if (m.t === 'welcome' || m.t === 'snap' || m.t === 'busy' || m.t === 'banner' || m.t === 'phase' || m.t === 'chron' || m.t === 'peers' || m.t === 'end' || (m.t === 'ping' && COOP.host && m.from === COOP.host.id)) COOP.hostAt = Date.now();
  if (m.t === 'full' && m.to === COOP.me.id && COOP.role === 'joining') { toast('Ce château est complet (5 Maîtres maximum).', true); coopLeave(true); return; }
  if (m.t === 'welcome' && m.to === COOP.me.id) {
    if (COOP.role !== 'joining') return;
    clearTimeout(COOP.helloT); COOP.role = 'guest'; COOP.host = m.host; COOP.me.color = m.color || '#5ad1ff';
    COOP.own = S; Z = 0; resetActors(); dropSticker(); closeModal(true); advisorHide();
    coopApply(m, true); CAM.user = false; fitCamera(); setGuestBusy(!!m.busy);
    document.body.classList.add('coop-guest'); renderCoopBar(); sfx('chime');
    banner(`🤝 ${esc(S.name)}`, `Château de ${esc(m.host.name)}`, 1800);
    return;
  }
  if (COOP.role !== 'guest') return;
  if (m.t === 'snap') coopApply(m);
  else if (m.t === 'nack' && m.to === COOP.me.id) { toast(cleanName(m.err, 120) || 'Action refusée', true); sfx('bad'); }
  else if (m.t === 'busy') setGuestBusy(!!m.on);
  else if (m.t === 'banner') banner(esc(plain(m.text)), esc(plain(m.sub)), clamp(+m.ms || 1200, 300, 4000));
  else if (m.t === 'phase' && PHASES.some(p => p[0] === m.k)) setPhase(m.k);
  else if (m.t === 'chron' && Array.isArray(m.report)) {
    if (COOP.own && COOP.own.stats) { COOP.own.stats.coopNights++; saveHome(); }
    const rows = m.report.slice(0, 80).filter(r => Array.isArray(r)).map(([e, t, tone]) => [String(e).slice(0, 8), String(t).slice(0, 300), ['good', 'bad', 'ev', ''].includes(tone) ? tone : '']);
    const items = rows.map(([e, t, tone]) => e === 'sec' ? `<li class="sec">${esc(t)}</li>` : `<li class="${tone}"><span class="emo">${esc(e)}</span><span>${esc(t)}</span></li>`).join('');
    openModal(`<h2>Chronique de la nuit ${clamp(+m.n || 1, 1, 99999)}</h2><p class="hint">${esc(S.name)} · château de ${esc(COOP.host.name)}</p><ul class="chron">${items}</ul><div class="mfoot"><button class="sbtn pri" type="button" data-close>Continuer</button></div>`, { label: 'Chronique' });
    COOP.ready = false; renderCoopBar();
  }
  else if (m.t === 'peers' && Array.isArray(m.list)) {
    COOP.peers.clear();
    m.list.slice(0, 8).forEach(p => { if (p && p.id && p.id !== COOP.me.id) COOP.peers.set(p.id, { id: p.id, name: cleanName(p.name, 24) || 'Maître', color: /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : '#ffffff', ready: !!p.ready, host: !!p.host, at: Date.now() }); });
    renderCoopBar();
  }
  else if (m.t === 'cur') { let p = COOP.peers.get(m.from); if (p) Object.assign(p, { x: +m.x, y: +m.y, z: +m.z || 0, hand: Array.isArray(m.h) ? m.h : null, curAt: Date.now() }); }
  else if (m.t === 'chat') { const p = COOP.peers.get(m.from); if (p) coopShowChat(p, m.text); }
  else if (m.t === 'end') { toast(`${COOP.host.name} a fermé son château partagé. Retour chez toi !`); coopLeave(); }
}
function setGuestBusy(on) { COOP.busy = on; UI.busy = on; document.body.classList.toggle('busy', on); $('#btnNight').disabled = on; if (on) { dropSticker(); } else setPhase('roder'); }
function coopApply(m, first) {
  if (!m.s || typeof m.s !== 'object' || !Array.isArray(m.s.rooms) || (!first && +m.rev <= COOP.rev)) return;
  COOP.rev = +m.rev || 0;
  const prev = S, ctx = UI.mctx, before = ctx ? coopCtxJSON(prev, ctx) : null;
  const s = upgradeState(m.s);
  if (!first && prev) { const old = new Set([...(prev.furn || []), ...(prev.defs || [])].map(o => o.id)), t = performance.now(); [...s.furn, ...s.defs].forEach(o => { if (!old.has(o.id)) V.born.set(o.id, t); }); }
  S = s; sortLimbo(); dirty(); V.dirty = true; renderAll();
  if (ctx && $('#modalRoot').children.length && !(document.activeElement && document.activeElement.matches('input, textarea, select'))) {
    const after = coopCtxJSON(S, ctx);
    if (after === null) closeModal(true); else if (after !== before) { if (ctx[0] === 'creature') openCreature(ctx[1]); else if (ctx[0] === 'room') openRoom(ctx[1]); }
  }
}
function coopCtxJSON(st, ctx) { const list = ctx[0] === 'creature' ? st.creatures : st.rooms, o = (list || []).find(x => x.id === ctx[1]); if (!o) return null; return JSON.stringify(o) + (ctx[0] === 'room' ? JSON.stringify((st.furn || []).filter(f => inRoom(o, f.x, f.y))) : '') + st.gold; }

/* ---------- quitter ---------- */
function coopLeave(silent) {
  if (!COOP.role) return;
  const was = COOP.role;
  if (was === 'host') coopSend({ t: 'end' }); else coopSend({ t: 'bye' });
  clearTimeout(COOP.helloT); clearTimeout(COOP.snapTimer); COOP.timers.forEach(clearInterval); COOP.timers = [];
  const sub = COOP.sub; setTimeout(() => sub && sub.close(), 600);
  Object.assign(COOP, { role: null, code: '', tag: '', key: null, sub: null, host: null, busy: false, ready: false, rev: 0 }); COOP.peers.clear();
  document.body.classList.remove('coop-guest');
  if (was === 'guest' || was === 'joining') {
    if (COOP.own) { S = COOP.own; COOP.own = null; Z = 0; dirty(); resetActors(); V.dirty = true; UI.busy = false; document.body.classList.remove('busy'); $('#btnNight').disabled = false; setPhase('roder'); closeModal(true); renderAll(); CAM.user = false; fitCamera(); if (!silent) toast('🏰 De retour dans ton château.'); }
    if (S && !S.started) setTimeout(openIntro, 300);
    valFlush();
  }
  try { const u = new URL(location.href); if (u.searchParams.has('coop')) { u.searchParams.delete('coop'); history.replaceState(null, '', u); } } catch (e) {}
  renderCoopBar(); if (VAL.open) renderVal();
}
addEventListener('pagehide', () => { if (COOP.role) coopSend({ t: COOP.role === 'host' ? 'end' : 'bye' }); });

/* ---------- curseurs, discussion ---------- */
function coopCursor(e) {
  if (COOP.role !== 'host' && COOP.role !== 'guest') return;
  const now = performance.now(); if (now - COOP.curT < 230) return;
  const r = cv.getBoundingClientRect(), [gx, gy] = tileAtScreen(e.clientX - r.left, e.clientY - r.top);
  const x = Math.round(gx * 4) / 4, y = Math.round(gy * 4) / 4, h = UI.hand ? [UI.hand.kind, UI.hand.t, UI.hand.w, UI.hand.h] : null, key = x + ',' + y + ',' + Z + ',' + (h ? h.join(':') : '');
  if (key === COOP.curKey) return; COOP.curT = now; COOP.curKey = key;
  coopSend({ t: 'cur', x, y, h, z: Z });
}
function coopShowChat(p, text) {
  const t = cleanName(text, 120); if (!t) return;
  p.say = { text: t, until: performance.now() + 5000 }; toast(`💬 ${p.name} : ${t}`); sfx('tick');
}
function coopChat() {
  const inp = $('#coopMsg'); if (!inp) return; const t = cleanName(inp.value, 120); if (!t) return;
  inp.value = ''; coopSend({ t: 'chat', text: t }); coopShowChat({ name: 'Toi' }, t);
}
const livePeers = () => [...COOP.peers.values()].filter(p => Number.isFinite(p.x) && Number.isFinite(p.y) && (p.z || 0) === Z && Date.now() - (p.curAt || 0) < 20000);
function drawPeersWorld(t) {
  livePeers().forEach(p => {
    const col = hexRgb(p.color), h = p.hand, tx = Math.floor(p.x), ty = Math.floor(p.y);
    if (h && h[0] === 'room') { const w = clamp(+h[2] || 1, 1, 3), hh = clamp(+h[3] || 1, 1, 3), x0 = Math.round(p.x - w / 2), y0 = Math.round(p.y - hh / 2); glowPath(footprint({ x: x0, y: y0, w, h: hh }), col, true, .8, [10, 8]); }
    else if (tx >= -1 && ty >= -1 && tx <= W && ty <= H) {
      glowPath(footprint({ x: tx, y: ty, w: 1, h: 1 }), col, true, .7);
      if (h && (h[0] === 'furn' ? FURN[h[1]] : h[0] === 'def' ? DEFS[h[1]] : null)) { const [wx, wy] = WP(tx + .5, ty + .5); drawSprite(ctx, getSprite(h[0], h[1]), wx, wy, 1, .45); }
    }
  });
}
function drawPeersScreen(t) {
  livePeers().forEach(p => {
    const [sx, sy] = toScreen(...WP(p.x, p.y)); ctx.save();
    ctx.beginPath(); ctx.arc(sx, sy, 6, 0, 7); ctx.fillStyle = p.color; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#140c08'; ctx.stroke();
    ctx.font = '700 12px Andika, sans-serif'; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    const label = p.name + (p.ready ? ' ✓' : ''), w = ctx.measureText(label).width + 12;
    ctx.fillStyle = 'rgba(20,12,8,.85)'; ctx.beginPath(); ctx.roundRect ? ctx.roundRect(sx + 9, sy - 9, w, 18, 9) : ctx.rect(sx + 9, sy - 9, w, 18); ctx.fill();
    ctx.fillStyle = p.color; ctx.fillText(label, sx + 15, sy);
    ctx.restore();
    if (p.say && t < p.say.until) bubble(sx, sy - 16, p.say.text);
  });
}

/* ---------- barre et panneau ---------- */
function renderCoopBar() {
  const b = $('#coopbar'), nb = $('#btnNight span');
  if (nb) nb.textContent = COOP.role === 'guest' ? (COOP.ready ? 'Prêt·e ✓' : 'Je suis prêt·e') : 'Finir la nuit';
  if (!COOP.role) { b.hidden = true; return; }
  const me = `<span class="peer" style="--c:${COOP.me.color}"><i></i>Toi${COOP.role === 'host' ? ' (hôte)' : COOP.ready ? ' ✓' : ''}</span>`;
  const others = [...COOP.peers.values()].map(p => `<span class="peer" style="--c:${p.color}"><i></i>${esc(p.name)}${p.host ? ' (hôte)' : p.ready ? ' ✓' : ''}</span>`).join('');
  b.innerHTML = COOP.role === 'joining' ? `<span>🤝 Connexion au château <b>${esc(COOP.code)}</b>…</span><button class="sbtn" type="button" data-coop="leave">Annuler</button>`
    : `<span class="ctitle">🤝 ${COOP.role === 'host' ? 'Ton château est partagé' : `Chez ${esc(COOP.host.name)}`}</span>${COOP.role === 'host' ? `<button class="pill" type="button" data-coop="copy" title="Copier le lien d’invitation">Code ${esc(COOP.code)} 🔗</button>` : ''}
      <span class="peers">${me}${others}</span><input id="coopMsg" maxlength="120" placeholder="Un petit mot…" aria-label="Message aux autres Maîtres"><button class="pill" type="button" data-coop="say">💬</button><button class="pill" type="button" data-coop="leave">${COOP.role === 'host' ? 'Fermer' : 'Rentrer'}</button>`;
  b.hidden = false;
}
function coopBarClick(e) {
  const b = e.target.closest('[data-coop]'); if (!b) return;
  const k = b.dataset.coop;
  if (k === 'leave') confirmBtn(b, COOP.role === 'host' ? 'Fermer ?' : 'Partir ?', () => coopLeave());
  else if (k === 'copy') copyText(coopLink());
  else if (k === 'say') coopChat();
}
function coopPanelHTML() {
  if (!NET.ok) return '<p class="no">Le château partagé a besoin de la version en ligne.</p>';
  const intro = '<p>Invite jusqu’à 4 amis dans ton château : vous collez des pièces, des meubles et des pièges ensemble, vous voyez les curseurs des autres, vous discutez, et chacun dit quand il est prêt à finir la nuit. Ton château reste le tien : tes amis retrouvent le leur en partant.</p>';
  if (COOP.role === 'host') return `${intro}<div class="coopcode"><span>Code du château</span><b>${esc(COOP.code)}</b><input readonly value="${esc(coopLink())}" aria-label="Lien d’invitation"></div>
    <div class="btnrow"><button class="sbtn pri" type="button" data-cp="copy">🔗 Copier le lien</button><button class="sbtn danger" type="button" data-cp="close">Fermer le château partagé</button></div><p class="hint">${COOP.peers.size} Maître${COOP.peers.size > 1 ? 's' : ''} avec toi.</p>`;
  if (COOP.role === 'guest') return `${intro}<p>Tu es dans le château de <b>${esc(COOP.host.name)}</b>.</p><div class="btnrow"><button class="sbtn" type="button" data-cp="close">↩ Rentrer chez moi</button></div>`;
  return `${intro}<div class="coopgrid"><div class="coopbox"><h3>Ouvrir mon château</h3><p class="hint">Tu deviens l’hôte : la partie se joue dans ton château, avec ta sauvegarde.</p><button class="sbtn pri" type="button" data-cp="host" ${S.started && !UI.busy ? '' : 'disabled'}>🤝 Ouvrir mon château</button></div>
    <div class="coopbox"><h3>Rejoindre un ami</h3><p class="hint">Entre le code à 6 lettres qu’il te donne (ou ouvre son lien).</p><div class="joinrow"><input id="coopCode" maxlength="7" placeholder="ABC234" aria-label="Code du château" autocomplete="off"><button class="sbtn pri" type="button" data-cp="join">Entrer</button></div></div></div>
    <p class="hint">Les messages passent par des relais publics, chiffrés avec le code du château : ne partage le code qu’avec tes amis.</p>`;
}
function coopPanelClick(e) {
  const b = e.target.closest('[data-cp]'); if (!b) return;
  const k = b.dataset.cp;
  if (k === 'host') coopHost();
  else if (k === 'join') { const v = normCode(($('#coopCode') || {}).value); if (v.length !== 6) { toast('Le code fait 6 caractères.', true); return; } coopJoin(v); }
  else if (k === 'copy') copyText(coopLink());
  else if (k === 'close') { coopLeave(); if (VAL.open) renderVal(); }
}
