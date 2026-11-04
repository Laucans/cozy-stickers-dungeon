/* =========================================================
   Défendre le Cœur aux cartes
   Quand une bande d'aventuriers arrive au combat décisif, le
   Maître choisit : laisser faire ses créatures (le combat
   automatique), ou défendre lui-même, aux cartes. Chaque héros
   joue les cartes de sa classe (l'ordinateur les tient) ; tes
   défenseurs ont les leurs, plus les meubles du château, et
   les jetons du Cœur qui restent deviennent des cartes.
   La bande se débande quand la moitié est à terre, comme à
   l'automatique ; le résultat repart dans la nuit.
   ========================================================= */
const DEF_SCALE = 1.8;   // les PV des deux camps, pour qu'un combat dure quelques tours
const HERO_CARDS = {
  h_fourche:   { name: 'Coup de fourche', ico: '🔱', cost: 1, tgt: 'enemy', dmg: 2, atk: 1, el: 'perforant' },
  h_course:    { name: 'Prendre ses jambes à son cou', ico: '💨', cost: 0, tgt: 'self', evade: 1 },
  h_traitre:   { name: 'Coup en traître', ico: '🗡️', cost: 1, tgt: 'enemy', dmg: 2, atk: 1, el: 'perforant', fx: 'lowbonus', note: '+5 contre une créature déjà à moitié' },
  h_crochet:   { name: 'Crochetage', ico: '🗝️', cost: 0, tgt: 'none', draw: 1 },
  h_fleche:    { name: 'Flèche', ico: '🏹', cost: 1, tgt: 'enemy', dmg: 3, atk: 1, el: 'perforant' },
  h_pluie:     { name: 'Pluie de flèches', ico: '🎯', cost: 2, tgt: 'rnd', dmg: 3, hits: 3, el: 'perforant' },
  h_eclair:    { name: 'Éclair', ico: '⚡', cost: 1, tgt: 'enemy', dmg: 4, atk: 1, el: 'foudre' },
  h_feu:       { name: 'Boule de feu', ico: '🔥', cost: 2, tgt: 'allfoes', dmg: 3, atk: 1, el: 'feu' },
  h_sommeil:   { name: 'Sommeil', ico: '💤', cost: 1, tgt: 'enemy', stun: 1, exhaust: 1 },
  h_benit:     { name: 'Coup béni', ico: '✨', cost: 1, tgt: 'enemy', dmg: 2, atk: 1, el: 'radiant' },
  h_priere:    { name: 'Prière', ico: '🙏', cost: 1, tgt: 'ally', heal: 5 },
  h_bouclier:  { name: 'Bouclier sacré', ico: '🛡️', cost: 1, tgt: 'ally', blk: 6 },
  h_hache:     { name: 'Coup de hache', ico: '🪓', cost: 1, tgt: 'enemy', dmg: 4, atk: 1, el: 'tranchant' },
  h_rage:      { name: 'Rage du barbare', ico: '😤', cost: 1, tgt: 'self', buff: 2 },
  h_tourbillon:{ name: 'Tourbillon', ico: '🌀', cost: 2, tgt: 'allfoes', dmg: 2, atk: 1, el: 'tranchant' },
  // les jetons du Cœur, devenus cartes
  p_eboul:     { name: 'Éboulement', ico: '🪨', cost: 0, tgt: 'enemy', dmg: 8, exhaust: 1, el: 'contondant', note: 'un jeton du Cœur' },
  p_brume:     { name: 'Brume du Cœur', ico: '🌫️', cost: 1, tgt: 'allfoes', stun: 1, exhaust: 1, note: 'un jeton du Cœur' },
  p_elixir:    { name: 'Élixir du Cœur', ico: '🧪', cost: 1, tgt: 'allies', heal: 4, buff: 1, exhaust: 1, note: 'un jeton du Cœur' },
};
Object.assign(CARD_BASE, HERO_CARDS);
if (typeof BASE !== 'undefined' && BASE.CARD_BASE) Object.assign(BASE.CARD_BASE, structuredClone(HERO_CARDS));   // l'Atelier les règle comme les autres cartes
const HERO_DECK = {
  paysan:  [['base', 'h_fourche'], ['base', 'h_fourche'], ['base', 'parade'], ['base', 'h_course']],
  voleuse: [['base', 'h_traitre'], ['base', 'h_traitre'], ['base', 'parade'], ['base', 'h_crochet']],
  elfe:    [['base', 'h_fleche'], ['base', 'h_fleche'], ['base', 'parade'], ['base', 'h_pluie']],
  mage:    [['base', 'h_eclair'], ['base', 'h_feu'], ['base', 'h_sommeil'], ['base', 'parade']],
  paladin: [['base', 'h_benit'], ['base', 'h_benit'], ['base', 'h_bouclier'], ['base', 'h_priere']],
  barbare: [['base', 'h_hache'], ['base', 'h_hache'], ['base', 'h_rage'], ['base', 'h_tourbillon']],
};
const HEART_CARDS = ['p_eboul', 'p_brume', 'p_elixir'];
// les deux camps, tirés du combat qui allait se jouer
function defenseDocs(ask, R, plan, x = 1) {   // x : la force des héros, calibrée pour le combat aux cartes
  const sc = v => Math.max(1, Math.round(v * DEF_SCALE)), hx = v => Math.max(1, Math.round(v * DEF_SCALE * x)), ax = v => Math.max(1, Math.round(v * Math.sqrt(x)));
  const mine = { master: (typeof NET !== 'undefined' && NET.name) || 'Toi', name: S.name, r: 0, bag: (typeof crawlAutoBag === 'function' ? crawlAutoBag() : []).filter(k => typeof duelUsable !== 'function' || duelUsable(k)).map(k => [k, castleUp(k) ? 1 : 0]),
    extra: Array.from({ length: Math.min(3, R.charges || 0) }, (_, i) => ['base', HEART_CARDS[i % HEART_CARDS.length], 0]),
    team: ask.defs.map(d => d.c ? { ref: d.id, sp: d.c.sp, name: d.name, hp: sc(d.hp), max: sc(d.max || d.hp), atk: d.atk, guard: guardOf(d.c), up: (d.c.loy || 0) >= 70 ? 1 : 0, leg: d.c.evo || d.c.legend ? 1 : 0 }
      : { ref: d.id, emo: d.merc ? '⚔️' : '🛡️', name: d.name, hp: sc(d.hp), max: sc(d.max || d.hp), atk: d.atk, guard: 2, cards: [['base', 'frappe'], ['base', 'frappe'], ['base', 'parade']] }) };
  const heroes = { master: plan.foe ? String(plan.foe) : 'La bande', name: 'Les aventuriers', r: 0, bag: [],
    team: ask.party.map(h => HERO_FIGHT[h.k] ? { ref: h.j, hk: h.k, name: h.name, hp: hx(h.hp), max: hx(h.max), atk: ax(h.atk), guard: 0, cards: HERO_DECK[h.k] || HERO_DECK.paysan }
      : { ref: h.j, sp: SPECIES[h.k] ? h.k : 'gobelin', name: h.name, hp: hx(h.hp), max: hx(h.max), atk: ax(h.atk), guard: 2 }) };
  return { mine, heroes };
}
// la force des héros aux cartes : celle qui fait gagner tes défenseurs environ 7 fois sur 10 quand l'ordinateur joue des deux côtés
// (la bande avait été taillée pour tout ton château ; aux cartes, seuls le premier rang et sa relève se battent)
const DEF_TARGET = .72;
function defenseAIBattle(ask, R, plan, x) {
  const { mine, heroes } = defenseDocs(ask, R, plan, x), D = duelNew(mine, heroes, { routAt: [null, Math.max(1, ask.need || 1)], actCap: [5, null] });
  let guard = 0; while (D.over == null && guard++ < 300) { const si = D.cur; let k = 0; while (duelAI(D, si) && k++ < 30) {} if (D.over == null) D.endTurn(si); }
  return D.over === 0 || D.over === 'draw';
}
function defenseCalibrate(ask, R, plan) {
  const N = 10, rate = x => { let w = 0; for (let i = 0; i < N; i++) if (defenseAIBattle(ask, R, plan, x)) w++; return w / N; };
  let lo = .05, hi = 3; if (rate(hi) >= DEF_TARGET) return hi; if (rate(lo) < DEF_TARGET) return lo;
  for (let k = 0; k < 7; k++) { const mid = Math.sqrt(lo * hi); if (rate(mid) >= DEF_TARGET) lo = mid; else hi = mid; }
  return lo;
}
// la question au Maître, puis le combat (la promesse rend le résultat, ou rien pour l'automatique)
function defenseCards(ask, R, plan) {
  return new Promise(resolve => {
    if ((S.opts || {}).cardDef === 'auto' || !ask.defs || !ask.defs.length || !ask.party || !ask.party.length) { resolve(null); return; }
    const m = openModal(`<h2>🏰 ${esc(ask.label || 'Le Cœur')} : la bande arrive !</h2>
      <p><b>${ask.party.length} aventurier${ask.party.length > 1 ? 's' : ''}</b> (${ask.party.map(h => esc(h.name)).join(', ')}) contre <b>${ask.defs.length} défenseur${ask.defs.length > 1 ? 's' : ''}</b> (${ask.defs.map(d => esc(d.name)).join(', ')}).</p>
      <p class="hint">Aux cartes, c’est toi qui défends : chaque héros joue les cartes de sa classe, la bande fuit quand ${ask.need > 1 ? `${ask.need} des siens sont` : 'l’un des siens est'} à terre${R.charges ? `, et ${Math.min(3, R.charges) > 1 ? `${Math.min(3, R.charges)} de tes jetons du Cœur deviennent des cartes` : 'un de tes jetons du Cœur devient une carte'}` : ''}.</p>
      <label class="tutochk"><input type="checkbox" id="defAuto"> Ne plus demander : toujours laisser faire (le menu ☰ le remet)</label>
      <div class="btnrow"><button type="button" class="sbtn pri" id="defCards">🃏 Défendre aux cartes</button><button type="button" class="sbtn" id="defAutoBtn">⚡ Laisser faire</button></div>`, { label: 'Défense du Cœur', noClose: true });
    const go = cards => { if (m.querySelector('#defAuto').checked) { S.opts.cardDef = 'auto'; save(); } closeModal(true); if (!cards) { resolve(null); return; } play(); };
    m.querySelector('#defCards').addEventListener('click', () => go(true)); m.querySelector('#defAutoBtn').addEventListener('click', () => go(false));
    function play() {
      const x = defenseCalibrate(ask, R, plan), { mine, heroes } = defenseDocs(ask, R, plan, x), D = duelNew(mine, heroes, { routAt: [null, Math.max(1, ask.need || 1)], actCap: [5, null] }), me = 0, ai = 1; let timer = 0;   // la relève est là, mais on n'agit pas à plus de 5
      const res = () => D.over == null ? null : D.over === 'draw' ? 'draw' : D.over === me ? 'win' : 'lose';
      const scr = duelScreen({ me, mode: 'ai', myName: 'Tes défenseurs', oppName: heroes.master === 'La bande' ? 'la bande' : heroes.master, closeLabel: 'Continuer la nuit',
        endText: r => r === 'lose' ? 'La bande l’emporte…' : 'La bande est repoussée !',
        act: a => { if (a.a === 'forfeit') D.forfeit(me); else if (D.cur === me) { if (a.a === 'card') { const c = D.sides[me].hand.find(x => x.uid === a.uid); if (c) { const err = D.play(c, a.t, me); if (err) toast(err, true); else sfx('chime'); } } else if (a.a === 'end') D.endTurn(me); } sync(); },
        onClose: () => { clearTimeout(timer); const won = D.over === me || D.over === 'draw';
          resolve({ res: won ? 'flee' : 'won', def: D.sides[0].f.map(f => ({ id: f.ref, hp: Math.ceil(f.hp / DEF_SCALE), ko: f.ko })), her: D.sides[1].f.map(f => ({ j: f.ref, hp: Math.ceil(f.hp / DEF_SCALE), ko: f.ko })) }); } });
      function sync() { scr.set(duelVM(D, me), D.cur === me && D.over == null, res()); if (D.over == null && D.cur === ai) { clearTimeout(timer); timer = setTimeout(aiStep, 750); } }
      function aiStep() { if (D.over != null || D.cur !== ai || !scr.page.isConnected) return; if (duelAI(D, ai)) { sfx('tick'); sync(); timer = setTimeout(aiStep, 700); } else { D.endTurn(ai); sync(); } }
      sfx('horn'); sync();
    }
  });
}
// les héros dans l'arène : leur vrai sprite (et pas un émoji)
const figVMDef = figVM;
figVM = function (B, o, side) { const v = figVMDef(B, o, side); if (o && o.hk) v.hk = o.hk; return v; };
const figHTMLDef = figHTML;
figHTML = function (f, tgt) { const h = figHTMLDef(f, tgt); return f && f.hk && HERO_FIGHT[f.hk] ? h.replace(/(<div class="fspr idle"><i class="fshadow"><\/i>)[\s\S]*?(<\/div>)/, `$1<img alt="" src="${thumb('hero', f.hk, true)}">$2`) : h; };
