/* =========================================================
   Le fil rouge : huit chapitres pour découvrir le château
   Chaque étape a ses objectifs (une pastille 📜 à droite,
   son journal avec « Montre-moi ») et dévoile, une fois
   achevé, de nouveaux boutons : les pièges et la défense,
   puis le Raid et la carte, la renommée, les quêtes et le Val,
   la défense du Cœur aux cartes. Gribouille ouvre chaque
   chapitre ; le tutoriel pas à pas attend le chapitre de ses
   étapes. Une nouvelle partie avec « tutoriel » coché suit
   le fil ; les anciennes parties n'en ont pas.
   ========================================================= */
const FIL = [
  { id: 'reveil', t: 'Le réveil', intro: 'Le vieux château s’éveille. D’abord de quoi dormir et manger : des lits, des repas, et les premières créatures viendront d’elles-mêmes.',
    goals: [
      { id: 'dortoir', t: 'Bâtis un Dortoir', ok: () => S.rooms.some(r => r.t === 'dortoir'), show: () => { openBuild('room'); filGlow('.card[data-kind="room"][data-t="dortoir"]'); }, wiki: 'construire' },
      { id: 'lit', t: 'Pose un lit dans le Dortoir', ok: () => S.furn.some(f => FURN[f.t] && FURN[f.t].beds && roomAt(f.x, f.y) && roomAt(f.x, f.y).t === 'dortoir'), show: () => { const r = S.rooms.find(x => x.t === 'dortoir' && x.built); if (r) openRoom(r.id); else toast('Le Dortoir est encore en chantier : finis la nuit, puis touche-le.'); }, wiki: 'meubler' },
      { id: 'nuit', t: 'Finis ta première nuit', ok: () => S.night >= 2, show: () => filGlow('#btnNight'), wiki: 'nuit' },
      { id: 'crea', t: 'Accueille une nouvelle créature', ok: () => S.creatures.length >= 3, n: () => [Math.max(0, S.creatures.length - 2), 1], wiki: 'creatures' },
      { id: 'repas', t: 'Meuble un Potager ou une Cuisine', ok: () => hasFood(), show: () => { openBuild('room'); filGlow('.card[data-kind="room"][data-t="potager"]'); }, wiki: 'lits_repas' },
    ], reward: { g: 10, s: 15 }, unlock: 'les pièges et la défense du château' },
  { id: 'visiteurs', t: 'Les premiers visiteurs', intro: 'La rumeur court au village : un château s’éveille. Des aventuriers viendront chercher l’or du Cœur. Prépare-leur un accueil : un piège dans un couloir, contre une pièce. Tes créatures se défendront d’elles-mêmes : les plus fortes au Cœur, les autres tirées au sort dans les pièces. Dès que tout est en place, ils arrivent.',
    goals: [
      { id: 'piege', t: 'Pose un piège dans un couloir', ok: () => S.defs.length > 0, show: () => { openBuild('def'); }, wiki: 'pieges' },
      { id: 'bande', t: 'Affronte ta première bande d’aventuriers', ok: () => S.stats.invasions >= 1, wiki: 'invasion' },
    ], band: ['piege'], bandAfter: 3, reward: { g: 12, s: 15 }, unlock: 'le Raid et la carte du Val' },
  { id: 'pillage', t: 'Piller les environs', intro: 'Le Val regorge de fermes endormies et de moulins mal gardés. Ouvre la carte, choisis une cible, envoie une petite équipe. Mais un lieu pillé se méfie : varie tes cibles.',
    goals: [
      { id: 'carte', t: 'Ouvre la carte du Val', ok: () => !!filFlag('map'), show: () => filGlow('#minimap'), wiki: 'carte' },
      { id: 'raid', t: 'Réussis un raid', ok: () => S.stats.raidsWon >= 1, show: () => filGlow('#btnRaid'), wiki: 'raids' },
      { id: 'cibles', t: 'Pille ou explore deux lieux différents (raid ou expédition)', ok: () => Object.keys((S.fil && S.fil.tg) || {}).length >= 2, n: () => [Object.keys((S.fil && S.fil.tg) || {}).length, 2], show: () => { openWorld(); toast('Sur la carte : un éclaireur ou une rumeur au village dévoile de nouvelles cibles.'); }, wiki: 'risques' },
    ], reward: { g: 15, s: 20 }, unlock: 'la renommée et les hauts faits' },
  { id: 'ames', t: 'Des âmes à choyer', intro: 'Tes créatures ne sont pas des meubles : chacune a ses envies, ses rêves, son humeur. Comble-les et elles te le rendront. Et un château heureux grandit : vise le Palier 1, puis offre-leur une fête.',
    goals: [
      { id: 'envies', t: 'Comble 2 envies de tes créatures (leur fiche dit ce qu’elles veulent)', ok: () => (S.stats.quests || 0) >= 2, n: () => [S.stats.quests || 0, 2], show: () => toggleLeft(true), wiki: 'missions' },
      { id: 'palier', t: 'Atteins le Palier 1', ok: () => S.tier >= 1, show: () => openHeart(), wiki: 'paliers' },
      { id: 'fete', t: 'Donne une Grande fête (fiche du Cœur)', ok: () => !!S.feteAt, show: () => openHeart(), wiki: 'merveilles' },
    ], reward: { g: 20, s: 30 }, unlock: 'le journal des quêtes et le Val des Maîtres' },
  { id: 'val', t: 'Les gens du Val', intro: 'Les gens du Val ont toujours besoin de quelque chose : un objet fabriqué, une bête chassée, une escorte. Le journal des quêtes (le parchemin, à gauche) recueille leurs demandes. Et au village, avec une fausse moustache, on trouve de tout.',
    goals: [
      { id: 'qacc', t: 'Accepte une quête du journal', ok: () => { const Q = S.quests; return !!Q && (Q.cur.length > 0 || Q.done.length > 0); }, show: () => { toggleLeft(true); filGlow('#btnQuests'); }, wiki: 'quetes' },
      { id: 'qok', t: 'Mène une quête à bien', ok: () => (S.stats.questsRP || 0) >= 1, show: () => openQuests('cours'), wiki: 'quetes' },
      { id: 'ville', t: 'Achète quelque chose au village ou en ville', ok: () => (S.stats.shopped || 0) >= 1, show: () => openWorld(), wiki: 'ville' },
    ], reward: { g: 25, s: 30 }, unlock: 'la défense du Cœur aux cartes' },
  { id: 'profond', t: 'Les profondeurs', intro: 'Sous les collines dorment des donjons. Le bouton Raid te propose des expéditions en cartes : chaque créature y joue ses cartes. Et quand une bande atteint le Cœur, c’est toi qui le défends, aux cartes. Une répétition t’attend dans le journal.',
    goals: [
      { id: 'expe', t: 'Mène une expédition en cartes', ok: () => (S.stats.crawls || 0) >= 1, show: () => filGlow('#btnRaid'), wiki: 'expeditions' },
      { id: 'defc', t: 'Livre un combat d’invasion aux cartes (une vraie bande, ou une répétition)', ok: () => (S.stats.cardDefs || 0) >= 1, show: () => filDrill(), showLabel: '🃏 Répétition', wiki: 'invasion' },
    ], reward: { g: 30, s: 40 }, unlock: 'la dernière marche' },
  { id: 'gloire', t: 'Vers la gloire', intro: 'Ton château a fière allure. Vise plus haut : le Palier 2, une Merveille pour l’or qui dort, et l’une des cinq victoires du Val (touche la nuit en cours, en haut à droite).',
    goals: [
      { id: 'palier2', t: 'Atteins le Palier 2', ok: () => S.tier >= 2, show: () => openHeart(), wiki: 'paliers' },
      { id: 'merveille', t: 'Bâtis une Merveille (fiche du Cœur)', ok: () => (S.stats.wonders || 0) >= 1, show: () => openHeart(), wiki: 'merveilles' },
      { id: 'victoire', t: 'Regarde les cinq victoires', ok: () => !!filFlag('vic'), show: () => openVictories(), wiki: 'victoires' },
    ], reward: { g: 50, s: 50 }, unlock: 'ta propre légende' },
  { id: 'legende', t: 'Ta propre légende', intro: 'Tu connais tout le château. Choisis l’une des cinq victoires du Val et va jusqu’au bout : la nuit en cours (en haut à droite) montre où tu en es dans chacune. Les rivaux, eux, n’attendent pas.',
    goals: [
      { id: 'mi', t: 'Atteins 50 % dans une victoire du Val', ok: () => VICTORIES.some(v => vicPct(v.id) >= 50), n: () => [Math.max(...VICTORIES.map(v => vicPct(v.id))), 50], show: () => openVictories(), wiki: 'victoires' },
      { id: 'vic', t: 'Remporte une victoire du Val', ok: () => (S.stats.victories || 0) >= 1, show: () => openVictories(), wiki: 'victoires' },
    ], reward: { g: 100, s: 60 }, unlock: 'le Panthéon du Val' },
];
// ce que chaque chapitre dévoile : la fonction est libre dès que le joueur a atteint ce chapitre
const FIL_LOCKS = { def: 1, raid: 2, soc: 3, val: 4, cards: 5 };
// les étapes du tutoriel pas à pas qui attendent un chapitre
const FIL_STEP = { piege: 1, jetons: 1, raid: 2, horloges: 2, envies: 2, fin: 2 };
const FILU = { showing: false, ev: [], glow: null };
const filNew = () => ({ ch: 0, ok: {}, seen: 0, at: 1, f: {}, tg: {} });
const filOn = () => !!(S && S.fil && !S.fil.done);
const filLocked = k => filOn() && S.fil.ch < (FIL_LOCKS[k] || 0);
const filFlag = k => S && S.fil && S.fil.f && S.fil.f[k];
const filSet = k => { if (filOn()) { S.fil.f = S.fil.f || {}; S.fil.f[k] = 1; } };
const filCur = () => (filOn() ? FIL[S.fil.ch] : null);
const filTry = f => { try { return !!f(); } catch (e) { return false; } };
const filCount = g => { if (!g.n) return ''; try { const [a, b] = g.n(); return ` (${Math.min(a, b)}/${b})`; } catch (e) { return ''; } };
const filProgress = () => { const c = filCur(); return c ? [c.goals.filter(g => S.fil.ok[c.id + ':' + g.id]).length, c.goals.length] : [0, 0]; };

// les objectifs : on coche ce qui est fait ; un chapitre complet donne sa récompense et ouvre le suivant
function filCheck(report) {
  if (!filOn()) return;
  let guard = 0;
  while (filOn() && guard++ < FIL.length) {
    const c = FIL[S.fil.ch];
    c.goals.forEach(g => { const k = c.id + ':' + g.id; if (!S.fil.ok[k] && filTry(g.ok)) { S.fil.ok[k] = S.night; FILU.ev.push({ k: 'goal', t: g.t }); } });
    if (!c.goals.every(g => S.fil.ok[c.id + ':' + g.id])) break;
    S.gold += c.reward.g || 0; S.mat += c.reward.s || 0;
    const line = `Étape ${S.fil.ch + 1} du fil rouge achevée : ${c.t} (+${costText(c.reward)}). Débloqué : ${c.unlock}.`;
    addLog(line, 'good'); if (report) report.push(['📜', line, 'good']);
    FILU.ev.push({ k: 'ch', t: c.t, reward: c.reward, unlock: c.unlock });
    S.fil.ch++; S.fil.at = S.night;
    if (S.fil.ch >= FIL.length) { S.fil.done = true; break; }
    filStart(S.fil.ch);
  }
}
// l'ouverture d'un chapitre
function filStart(i) {
  if (FIL[i].id === 'val' && typeof genSide === 'function' && typeof qState === 'function') {   // une quête attend au journal
    const Q = qState(); if (!Q.offers.some(o => !o.def.main && o.def.key === 'convoi')) { let def = null; try { def = QGEN.convoi(); def.id = 'g' + (Q.seq = (Q.seq || 0) + 1); } catch (e) { def = genSide(); } if (def) { Q.offers.push({ id: def.id, def, n: S.night, until: S.night + 8 }); Q.keys = (Q.keys || []).concat(def.key).slice(-12); } }
  }
}
// avant chaque nuit : pas d'aventuriers tant qu'on n'a pas appris à les recevoir, puis une première bande à heure fixe
const filBandDue = () => { if (!filOn()) return false; const c = FIL[S.fil.ch]; return !!c.band && !S.fil.ok[c.id + ':bande'] && (c.band.every(g => S.fil.ok[c.id + ':' + g]) || S.night >= (S.fil.at || 1) + c.bandAfter); };
function filNightStart() {
  if (!filOn()) return;
  if (S.fil.ch < 1) S.menace = Math.min(S.menace, MENACE_MAX - 2);
  if (filBandDue()) { S.menace = MENACE_MAX; S.fil.bandAt = S.night; }
}
// les crochets dans le jeu
const endNightFil = endNight;
endNight = async function (...a) { filNightStart(); return endNightFil(...a); };
const dawnFil = dawn;
dawn = function (report) { const r = dawnFil(report); try { filCheck(report); } catch (e) { console.error(e); } return r; };
const afterChangeFil = afterChange;
afterChange = function () { try { filCheck(); } catch (e) { console.error(e); } return afterChangeFil(); };
const applyRaidFil = applyRaid;
applyRaid = function (roll) { const k = S.raid && S.raid.target, lines = applyRaidFil(roll); if (filOn() && k && roll.res !== 'fail') S.fil.tg[k] = 1; return lines; };
// une expédition menée jusqu'à au moins une salle compte comme un lieu exploré
const crawlApplyFil = crawlApply;
crawlApply = function (R, team, lines) { const r = crawlApplyFil(R, team, lines); if (filOn() && R && R.path && R.path.length && R.done !== 'wipe' && S.raid && S.raid.target) S.fil.tg[S.raid.target] = 1; return r; };
const openWorldFil = openWorld;
openWorld = function (...a) { filSet('map'); return openWorldFil(...a); };
const openVictoriesFil = openVictories;
openVictories = function (...a) { filSet('vic'); return openVictoriesFil(...a); };
const shopFil = CMD.shop;
CMD.shop = a => { const r = shopFil(a); if (!r) S.stats.shopped = (S.stats.shopped || 0) + 1; return r; };
// la défense aux cartes attend son chapitre ; une défense jouée compte pour l'objectif
const defenseCardsFil = defenseCards;
defenseCards = function (ask, R, plan) {
  if (filLocked('cards')) return Promise.resolve(null);
  return defenseCardsFil(ask, R, plan).then(r => { if (r) S.stats.cardDefs = (S.stats.cardDefs || 0) + 1; return r; });
};
// les quêtes du Val attendent leur chapitre : pas d'offre au tableau avant
const questDawnFil = questDawn;
questDawn = function (report) {
  if (!filLocked('val')) return questDawnFil(report);
  const Q = qState(), m = Q.main, nx = Q.next; Q.main = S.night; Q.next = S.night + 1;
  try { return questDawnFil(report); } finally { Q.main = m; Q.next = Math.max(nx, Q.next); }
};
const questNotifsFil = questNotifs;
questNotifs = function (add) { if (!filLocked('val')) questNotifsFil(add); };
const valNotifsFil = valNotifs;
valNotifs = function (add) { if (!filLocked('val')) valNotifsFil(add); };
// la pastille du fil remplace les « Envies du château » tant qu'il court
const notifListFil = notifList;
notifList = function () {
  let L = notifListFil();
  if (!filOn()) return L;
  const st = S.tuto && S.tuto.on && TUTO_STEPS[S.tuto.i];
  L = L.filter(x => x.k !== 'goal' && !(x.k === 'tuto' && st && (FIL_STEP[st.id] || 0) > S.fil.ch) && !(filLocked('def') && x.k === 'men'));
  if (filBandDue()) L.unshift({ k: 'filband', ico: '⚔️', text: 'Une bande d’aventuriers arrive à la fin de cette nuit', act: () => { openGrimoire('invasion'); }, pri: 8, cls: 'bad' });
  const c = filCur(), [d, n] = filProgress();
  if (c && (S.ndis || {}).fil !== S.night) L.unshift({ k: 'fil', ico: '📜', text: `Étape ${S.fil.ch + 1} · ${c.t} (${d}/${n})`, act: () => openFil(), pri: 7, cls: 'goal fil' });
  return L.slice(0, 7);
};

/* ---------- l'affichage ---------- */
function filApply() {
  if (typeof document === 'undefined' || !document.body) return;
  Object.keys(FIL_LOCKS).forEach(k => document.body.classList.toggle('fl-' + k, filLocked(k)));
}
function filGlow(sel, ms = 6000) {
  document.querySelectorAll('.fil-glow').forEach(e => e.classList.remove('fil-glow'));
  const L = [].concat(sel).map(s => document.querySelector(s)).filter(Boolean);
  L.forEach(e => { e.classList.add('fil-glow'); if (e.closest('#sheet')) e.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' }); });
  clearTimeout(FILU.glow); FILU.glow = setTimeout(() => L.forEach(e => e.classList.remove('fil-glow')), ms);
}
// ce qu'un chapitre achevé dévoile : les nouveaux boutons brillent un moment
const FIL_NEW = { 1: [], 2: ['#btnRaid', '#minimap'], 3: ['#btnCrit'], 4: ['#btnVal', '#btnCrit'] };
function openFil() {
  if (!S.fil) return;
  const ch = S.fil.done ? FIL.length : S.fil.ch;
  const rows = FIL.map((c, i) => {
    if (i < ch) return `<li class="fch ok"><b>✔ Étape ${i + 1} · ${esc(c.t)}</b></li>`;
    if (i > ch) return `<li class="fch lock"><b>🔒 Étape ${i + 1} · ${esc(c.t)}</b></li>`;
    return `<li class="fch cur"><b>Étape ${i + 1} · ${esc(c.t)}</b><p class="hint">${esc(c.intro)}</p><ul class="fgoals">${c.goals.map(g => { const ok = S.fil.ok[c.id + ':' + g.id]; return `<li class="${ok ? 'ok' : ''}"><span class="fck">${ok ? '✔' : '○'}</span><span class="ftx">${esc(g.t)}${ok ? '' : esc(filCount(g))}</span>${ok ? '' : `${g.show ? `<button type="button" class="sbtn small" data-fshow="${g.id}">${esc(g.showLabel || 'Montre-moi')}</button>` : ''}${g.wiki ? `<button type="button" class="sbtn small" data-fwiki="${g.wiki}" aria-label="Le Grimoire">📖</button>` : ''}`}</li>`; }).join('')}</ul>
      <p class="frw">Récompense : ${costText(c.reward)} · Débloque ${esc(c.unlock)}</p></li>`;
  }).join('');
  const m = openModal(`<h2>📜 Le fil rouge</h2><p class="hint">${S.fil.done ? 'Le fil rouge est bouclé : tout le château est à toi.' : 'Huit étapes pour découvrir le château, jusqu’à ta première victoire. Chaque étape achevée rapporte une récompense et dévoile de nouveaux boutons.'}</p>
    <ol class="filj">${rows}</ol>${S.fil.done ? '' : '<div class="btnrow"><button type="button" class="sbtn" id="filAll">Je connais déjà le jeu : tout débloquer</button></div>'}`, { label: 'Le fil rouge', cls: 'film' });
  m.addEventListener('click', e => {
    const s = e.target.closest('[data-fshow]'), w = e.target.closest('[data-fwiki]');
    if (s) { const g = filCur() && filCur().goals.find(x => x.id === s.dataset.fshow); closeModal(true); if (g && g.show) setTimeout(() => g.show(), 60); }
    else if (w) { closeModal(true); openGrimoire(w.dataset.fwiki); }
    else if (e.target.id === 'filAll') {
      if (!e.target.dataset.sure) { e.target.dataset.sure = 1; e.target.textContent = 'Sûr·e ? Touche encore pour tout débloquer'; return; }
      S.fil.done = true; S.fil.skip = true; save(); closeModal(true); filApply(); renderAll(); toast('Tout est débloqué. Le Grimoire (📖) garde chaque règle sous la main.');
    }
  });
}
// une petite répétition de défense aux cartes : tes champions contre une bande de mannequins à ta mesure
function filDrill() {
  if (typeof duelVsAI !== 'function' || typeof duelMyGuard !== 'function') return;
  const mine = duelMyGuard(); if (!mine.team.length) { toast('Il te faut au moins une créature en forme.', true); return; }
  const avg = f => Math.round(mine.team.reduce((a, e) => a + e[f], 0) / mine.team.length);
  const names = ['Mannequin barbare', 'Mannequin mage', 'Mannequin paladin'];
  const heroes = { master: 'La bande de paille', name: 'Répétition au Cœur', r: 0, bag: [], team: ['barbare', 'mage', 'paladin'].map((k, i) => ({ hk: k, name: names[i], hp: Math.max(10, avg('hp')), max: Math.max(10, avg('hp')), atk: Math.max(1, avg('atk')), guard: 0, cards: HERO_DECK[k] })) };
  const me = Object.assign({}, mine, { extra: HEART_CARDS.map(k => ['base', k, 0]) });
  duelVsAI(me, heroes, { onEnd: res => { if (res === 'win') { S.stats.cardDefs = (S.stats.cardDefs || 0) + 1; save(); toast('La bande de paille est repoussée ! Tu sais défendre le Cœur aux cartes.'); } } });
}
// Gribouille ouvre chaque chapitre ; il attend que la voie soit libre (pas de nuit, de fiche, de carte ni d'expédition en cours)
function filFree() {
  const wv = document.getElementById('world');
  return S && S.started && !UI.busy && !V.spotOn && !ADMIN.open && !VISIT && COOP.role !== 'guest' && !(wv && !wv.hidden) && !document.body.classList.contains('crawling') && !$('#modalRoot').children.length;
}
function filIntro() {
  const i = S.fil.ch, c = FIL[i];
  FILU.showing = true; TUTO.shown = null;
  advisorShow({ title: `Étape ${i + 1} · ${c.t}`, text: `${c.intro} Objectifs : ${c.goals.map(g => g.t.charAt(0).toLowerCase() + g.t.slice(1)).join(' ; ')}.`, buttons: [{ id: 'filgo', label: 'C’est parti !', pri: true }, { id: 'filjrn', label: '📜 Le journal' }], cls: 'tip' });
}
function filFinale() {
  FILU.showing = true; S.fil.fin = true; save();
  advisorShow({ title: 'Le fil rouge est bouclé !', text: 'Tu connais maintenant tout le château. La suite, c’est ton histoire : choisis l’une des cinq victoires du Val, et garde le Grimoire (📖) sous la main.', buttons: [{ id: 'filvic', label: 'Les victoires', pri: true }, { id: 'filgo', label: 'Merci, Gribouille' }], cls: 'tip' });
}
function filBind() {
  if (FILU.bound || !document.getElementById('advisor')) return; FILU.bound = true;
  $('#advisor').addEventListener('click', e => {
    const b = e.target.closest('[data-adv]'); if (!b || !/^fil/.test(b.dataset.adv)) return;
    FILU.showing = false; if (S.fil) { S.fil.seen = S.fil.done ? FIL.length : S.fil.ch; save(); } advisorHide();
    if (b.dataset.adv === 'filjrn') openFil(); else if (b.dataset.adv === 'filvic') openVictories();
    const L = FIL_NEW[S.fil && S.fil.ch]; if (b.dataset.adv === 'filgo' && L) filGlow(L, 5000);
    renderGoals();
  });
}
// le tutoriel pas à pas suit le fil : une étape d'un chapitre pas encore ouvert attend, et Gribouille passe d'abord par l'ouverture du chapitre
const tutoTickFil = tutoTick;
tutoTick = function () {
  if (!S || !S.fil) return tutoTickFil();
  filBind(); filApply();
  // les nouvelles du fil (objectifs cochés, chapitre achevé)
  if (FILU.ev.length && !UI.busy) { const ev = FILU.ev.splice(0); ev.forEach((x, i) => setTimeout(() => { if (x.k === 'goal') { toast(`📜 Objectif atteint : ${x.t}`); sfx('chime'); } else { toast(`📜 Étape achevée : ${x.t} ! +${costText(x.reward)}`); sfx('victory'); } }, i * 900)); renderGoals(); }
  if (FILU.showing) { const a = $('#advisor'); if (a && a.hidden) FILU.showing = false; else return; }
  if (S.fil.done) { if (!S.fil.fin && !S.fil.skip && filFree()) { filFinale(); return; } return tutoTickFil(); }
  if (S.fil.seen < S.fil.ch && filFree()) { filIntro(); return; }
  const st = S.tuto && S.tuto.on && TUTO_STEPS[S.tuto.i];
  if (st && (FIL_STEP[st.id] || 0) > S.fil.ch) {   // l'étape attend son chapitre : on range la bulle
    document.querySelectorAll('.tuto-glow').forEach(e => e.classList.remove('tuto-glow')); V.tutoCells = null;
    const adv = $('#advisor'); if (adv && !adv.hidden && adv.classList.contains('tuto')) advisorHide(); TUTO.shown = null;
    return;
  }
  return tutoTickFil();
};
// le premier mot de Gribouille annonce le fil
{ const st0 = TUTO_STEPS.find(s => s.id === 'intro'), x0 = st0 && st0.x;
  if (st0) Object.defineProperty(st0, 'x', { get: () => x0 + (filOn() ? ' Suis le fil rouge : la pastille 📜, à droite, donne tes objectifs ; chaque étape achevée dévoile une nouvelle partie du château.' : '') }); }
WIKI.filrouge = { cat: 'bases', t: 'Le fil rouge', x: () => `<p>Une nouvelle partie avec le tutoriel suit <b>huit étapes</b>, jusqu’à ta première victoire. Chacun a ses objectifs (la pastille 📜, à droite) ; achevé, il rapporte une récompense et dévoile de nouveaux boutons.</p><ol>${FIL.map(c => `<li><b>${c.t}</b> : ${c.goals.map(g => g.t.charAt(0).toLowerCase() + g.t.slice(1)).join(', ')}. Débloque ${c.unlock}.</li>`).join('')}</ol><p>Pas d’aventuriers avant la fin du premier chapitre ; la première bande arrive quand le piège et le garde sont en place (ou au bout de trois nuits). Le journal du fil permet de tout débloquer d’un coup.</p>` };
// le fil en texte (pour la partie en ligne de commande)
function filText() {
  if (!S.fil) return '';
  if (S.fil.done) return '📜 Fil rouge : bouclé. La suite : choisis ta victoire (wiki victoires, action victoires).';
  const c = filCur();
  return `📜 Fil rouge · étape ${S.fil.ch + 1}/${FIL.length} : ${c.t}\n${c.goals.map(g => `  [${S.fil.ok[c.id + ':' + g.id] ? 'x' : ' '}] ${g.t}${S.fil.ok[c.id + ':' + g.id] ? '' : filCount(g)}`).join('\n')}\n  Récompense : ${c.reward.g} or, ${c.reward.s} bois · débloque ${c.unlock}${filBandDue() ? '\n  ⚔️ Une bande d’aventuriers arrive à la fin de cette nuit.' : ''}`;
}
