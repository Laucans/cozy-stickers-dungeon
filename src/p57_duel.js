/* =========================================================
   Les duels de cartes entre Maîtres
   Chaque Maître prépare une « garde de duel » : 3 champions et
   un sac de 6 cartes du château, dans une limite de poids égale
   pour tous (une carte ✦ pèse plus lourd). On défie la garde
   d'un autre Maître quand on veut (l'ordinateur la joue), ou on
   l'affronte en direct dans un salon chiffré, chacun sur son
   écran. Les récompenses ne rendent pas plus fort : une cote,
   des victoires, une place au classement.
   ========================================================= */
const DUEL = { TEAM: 3, BAG: 6, BUDGET: 26, TURN_S: 75, ROUNDS: 20, K: 24 };
const DU = { invites: [], live: null };
function duelState() { const s = typeof homeS === 'function' ? homeS() : S; s.duel = s.duel || { team: [], bag: [], r: 1000, w: 0, l: 0, d: 0, pub: 0 }; return s.duel; }
// pas de pot-de-vin ni de carte qui ne fait que calmer la peur : un duel n'a ni or à semer, ni peur
const duelUsable = k => { const D = CASTLE_CARDS[k]; return !!D && !D.bribe && !(D.calm != null && D.heal == null && D.blk == null && !D.draw && !D.buff && !D.nrg); };
const duelWeight = (k, up) => Math.max(1, Math.round(cardValue(CASTLE_CARDS[k]) * (up ? 1.35 : 1)));
const duelPower = c => { const p = crawler(c); return p.hp * p.atk; };
// un champion de duel : ses chiffres ramenés à une même échelle (un vieux château ne gagne pas par sa seule taille)
function duelFighterDoc(c) { const p = crawler(c); return { sp: c.sp, name: c.name, hp: clamp(Math.round(p.hp * .6), 12, 26), atk: clamp(Math.round(p.atk), 1, 4), guard: clamp(Math.round(p.guard || 0), 0, 12), up: (c.loy || 0) >= 70 ? 1 : 0, leg: c.evo || c.legend ? 1 : 0 }; }
function duelAutoTeam() { return S.creatures.filter(c => !isOut(c)).sort((a, b) => duelPower(b) - duelPower(a)).slice(0, DUEL.TEAM).map(c => c.id); }
function duelAutoBag() {
  const pool = castlePool().filter(duelUsable).map(k => ({ k, up: castleUp(k) })).map(o => ({ ...o, w: duelWeight(o.k, o.up), v: cardValue(CASTLE_CARDS[o.k]) * (o.up ? 1.35 : 1) })).sort((a, b) => b.v / b.w - a.v / a.w || b.v - a.v);
  const bag = []; let w = 0; pool.forEach(o => { if (bag.length < DUEL.BAG && w + o.w <= DUEL.BUDGET) { bag.push(o.k); w += o.w; } }); return bag;
}
const duelBagWeight = bag => bag.reduce((a, k) => a + (CASTLE_CARDS[k] ? duelWeight(k, castleUp(k)) : 0), 0);
// la garde telle qu'elle se joue et se publie : des chiffres déjà calculés, sans rien lire du château de l'autre
function duelMyGuard() {
  const st = duelState(), ids = st.team.filter(id => { const c = critter(id); return c && !isOut(c); }); duelAutoTeam().forEach(id => { if (ids.length < DUEL.TEAM && !ids.includes(id)) ids.push(id); }); const pick = ids.map(critter).filter(Boolean);   // moins de 3 choisis : on complète avec les plus forts
  const pool = castlePool(); let bag = st.bag.filter(k => pool.includes(k) && duelUsable(k)); if (!st.bag.length) bag = duelAutoBag();
  while (bag.length && duelBagWeight(bag) > DUEL.BUDGET) bag.pop();
  return { v: 1, master: NET.name || 'Maître', name: (homeS() || S).name, r: Math.round(st.r), team: pick.slice(0, DUEL.TEAM).map(duelFighterDoc), bag: bag.slice(0, DUEL.BAG).map(k => [k, castleUp(k) ? 1 : 0]) };
}
// une garde reçue du réseau : tout est borné et vérifié (espèces, cartes, poids)
function cleanGuard(o) {
  if (!o || typeof o !== 'object' || !Array.isArray(o.team)) return null;
  const team = o.team.slice(0, DUEL.TEAM).filter(e => e && SPECIES[e.sp]).map(e => ({ sp: e.sp, name: cleanName(e.name, 24) || SPECIES[e.sp].name, hp: clamp(Math.round(+e.hp || 16), 12, 26), atk: clamp(Math.round(+e.atk || 1), 1, 4), guard: clamp(Math.round(+e.guard || 0), 0, 12), up: e.up ? 1 : 0, leg: e.leg ? 1 : 0 }));
  if (!team.length) return null;
  const bag = []; let w = 0; (Array.isArray(o.bag) ? o.bag : []).slice(0, DUEL.BAG).forEach(x => { const k = Array.isArray(x) ? x[0] : x, up = Array.isArray(x) && x[1] ? 1 : 0; if (duelUsable(k) && !bag.some(b => b[0] === k)) { const ww = duelWeight(k, up); if (w + ww <= DUEL.BUDGET) { bag.push([k, up]); w += ww; } } });
  return { v: 1, master: cleanName(o.master, 24) || 'Maître', name: cleanName(o.name, 40) || 'Château', r: clamp(Math.round(+o.r || 1000), 100, 4000), team, bag };
}
// un adversaire d'entraînement : trois créatures et un sac tirés au sort, dans la même limite
function duelTrainingGuard() {
  const sps = shuffle(Object.keys(CRAWL_SK).filter(k => SPECIES[k])).slice(0, DUEL.TEAM), names = ['Bidule', 'Truc', 'Machin', 'Chose', 'Zigoto', 'Gugusse'];
  const keys = shuffle(Object.keys(CASTLE_CARDS).filter(duelUsable)), bag = []; let w = 0; keys.forEach(k => { const ww = duelWeight(k, 0); if (bag.length < DUEL.BAG && w + ww <= DUEL.BUDGET) { bag.push([k, 0]); w += ww; } });
  const mine = S && S.creatures ? duelMyGuard().team : [], avg = (f, d) => mine.length ? Math.round(mine.reduce((a, e) => a + e[f], 0) / mine.length) : d;   // à ta mesure : la moyenne de tes champions
  return { v: 1, master: 'Maître d’armes', name: 'La salle d’entraînement', r: 1000, team: sps.map((sp, i) => ({ sp, name: names[i], hp: avg('hp', 17), atk: avg('atk', 2), guard: avg('guard', 4), up: 0, leg: 0 })), bag };
}

/* ---------- le moteur : deux camps, chacun ses cartes, à tour de rôle ---------- */
function duelSide(g, si) {
  const f = g.team.map((e, i) => ({ id: 'd' + si + i, uid: 'd' + si + i, side: si, sp: e.sp, hk: e.hk, emo: e.emo, ref: e.ref, name: e.name, hp: e.hp, max: e.max || e.hp, atk: e.atk, guard: e.guard || 0, block: 0, st: {}, ko: false, stress: 0 }));
  const deck = [];
  g.team.forEach((e, i) => {
    const id = f[i].id;
    if (e.cards) { e.cards.forEach(([src, k, up]) => deck.push(newCard(src, k, id, !!up))); return; }   // un jeu sur mesure (les héros, les mercenaires)
    deck.push(newCard('base', 'frappe', id), newCard('base', 'frappe', id), newCard('base', 'parade', id), CRAWL_SK[e.sp] ? newCard('sp', e.sp, id, !!e.up) : newCard('base', 'griffe', id)); if (e.leg) deck.push(newCard('base', 'legende', id));
  });
  g.bag.forEach(([k, up]) => { if (CASTLE_CARDS[k]) deck.push(newCard('castle', k, null, !!up)); });
  (g.extra || []).forEach(([src, k, up]) => deck.push(newCard(src, k, null, !!up)));
  return { name: g.name, master: g.master, r: g.r || 1000, f, draw: shuffle(deck), disc: [], exh: [], hand: [], nrg: 0, trap: 0, decoy: 0, first: true };
}
function duelNew(gA, gB, opt = {}) {
  const D = { sides: [duelSide(gA, 0), duelSide(gB, 1)], cur: 0, round: 1, over: null, log: [], seq: 0, routAt: opt.routAt || null, actCap: opt.actCap || null };
  const alive = si => D.sides[si].f.filter(o => !o.ko), fighters = () => D.sides[0].f.concat(D.sides[1].f);
  const say = (t, si) => { D.log.push({ t, s: si }); if (D.log.length > 40) D.log.shift(); };
  D.owner = c => c.owner ? fighters().find(o => o.id === c.owner) || null : null;
  D.costOf = c => Math.max(0, cardDef(c).cost || 0);
  D.dmgOf = (c, me) => { const K = cardDef(c); if (K.dmg == null) return 0; return Math.max(0, K.dmg + (K.atk && me ? me.atk * K.atk + (me.st.song || 0) : 0) + 3 * (c.up ? 1 : 0) - (K.hits > 1 && c.up ? 2 : 0) - (me && me.st.weak ? me.st.weak : 0)); };
  D.blkOf = (c, me) => { const K = cardDef(c); return K.blk == null ? 0 : K.blk + (K.grd && me ? Math.floor(me.guard / 2) : 0) + 3 * (c.up ? 1 : 0); };
  D.targets = (c, si) => { const K = cardDef(c); return K.tgt === 'enemy' ? alive(1 - si) : K.tgt === 'ally' ? alive(si) : K.tgt === 'ko' ? D.sides[si].f.filter(o => o.ko) : []; };
  D.why = (c, si) => {
    if (D.over != null) return 'Le duel est fini'; if (D.cur !== si) return 'Ce n’est pas ton tour';
    const me = D.owner(c), K = cardDef(c); if (me && me.ko) return `${me.name} est K.O.`; if (me && me.st.stun) return `${me.name} est immobilisé·e`;
    if (D.costOf(c) > D.sides[si].nrg) return 'Pas assez d’énergie';
    if (K.tgt === 'ko' && !D.sides[si].f.some(o => o.ko)) return 'Personne n’est K.O.';
    if (['enemy', 'allfoes', 'rnd'].includes(K.tgt) && !alive(1 - si).length) return 'Plus personne en face';
    return '';
  };
  const heal = (a, v) => { if (!a || a.ko || v <= 0) return; const h = Math.min(v, a.max - a.hp); a.hp += h; if (h) say(`${a.name} récupère ${h} PV.`, a.side); };
  const hit = (t, v, o = {}) => {
    if (!t || t.ko || v <= 0) return 0; const ts = D.sides[t.side];
    if (ts.decoy && !o.aoe) { ts.decoy = 0; say(`Le leurre prend le coup à la place de ${t.name}.`, t.side); return 0; }
    if (t.st.evade) { t.st.evade = 0; say(`${t.name} esquive !`, t.side); return 0; }
    const m = elemMul(o.el, t); if (m === 0) { say(`${t.name} ne craint pas ce coup (${ELEM[o.el] ? ELEM[o.el][1] : ''}).`, t.side); return 0; }
    let d = Math.floor(v * m); if (!o.pierce) { const ab = Math.min(t.block, d); t.block -= ab; d -= ab; }
    t.hp -= d; if (d > 0) say(`${t.name} perd ${d} PV${m > 1 ? ' (vulnérable !)' : m < 1 ? ' (résiste)' : ''}.`, 1 - t.side); else say(`La parade de ${t.name} tient.`, t.side);
    if (t.hp <= 0) { t.hp = 0; t.ko = true; t.block = 0; t.st = {}; say(`${t.name} est K.O. !`, 1 - t.side); }
    return d;
  };
  const draw = (si, n) => {
    const s = D.sides[si]; let got = 0;
    for (let tries = 0; got < n && tries < 80; tries++) {
      if (!s.draw.length) { if (!s.disc.length) break; s.draw = shuffle(s.disc); s.disc = []; }
      const c = s.draw.pop(), me = D.owner(c); if (me && me.ko) { s.exh.push(c); continue; }
      if (s.hand.length >= 10) { s.disc.push(c); got++; continue; } s.hand.push(c); got++;
    }
  };
  // un camp peut se débander avant d'être tout à fait à terre (une bande d'aventuriers fuit quand la moitié est K.O.)
  const routed = si => D.routAt && D.routAt[si] != null && D.sides[si].f.filter(o => o.ko).length >= D.routAt[si];
  D.check = () => { const a = alive(0).length && !routed(0), b = alive(1).length && !routed(1); if (!a && !b) D.over = 'draw'; else if (!b) D.over = 0; else if (!a) D.over = 1; return D.over; };
  D.play = (c, tid, si) => {
    const S0 = D.sides[si], O = D.sides[1 - si], i = S0.hand.indexOf(c); if (i < 0) return 'Carte absente';
    const why = D.why(c, si); if (why) return why;
    const K = cardDef(c), me = D.owner(c), up = c.up ? 1 : 0, el = cardEl(c, me);
    let T = null;
    if (['enemy', 'ally', 'ko'].includes(K.tgt)) { T = D.targets(c, si).find(o => o.id === tid) || null; if (!T) return 'Choisis une cible'; }
    if (K.tgt === 'enemy') { const tau = alive(1 - si).find(o => o.st.taunt); if (tau && tau !== T) { T = tau; say(`${tau.name} attire le coup.`, 1 - si); } }
    S0.nrg -= D.costOf(c); S0.hand.splice(i, 1); (K.exhaust ? S0.exh : S0.disc).push(c); D.seq++;
    say(`${me ? me.name : S0.name} joue ${cardName(c)}.`, si);
    // le piège de l'autre camp mord celle qui attaque
    if (K.dmg != null && O.trap > 0) { const vic = me && !me.ko ? me : pick(alive(si)); if (vic) { say('Un piège se referme !', 1 - si); hit(vic, O.trap, { pierce: true }); } O.trap = 0; }
    const foesT = K.tgt === 'allfoes' ? alive(1 - si) : K.tgt === 'enemy' && T ? [T] : [];
    const allyT = K.tgt === 'allies' ? alive(si) : K.tgt === 'ally' && T ? [T] : K.tgt === 'self' ? [me && !me.ko ? me : alive(si)[0]].filter(Boolean) : [];
    if (K.dmg != null && (!me || !me.ko)) {
      let v = D.dmgOf(c, me);
      if (K.fx === 'lowbonus' && T && T.hp <= T.max / 2) v += 5; if (K.fx === 'rage' && me && me.hp <= me.max / 2) v += 5; if (K.fx === 'surprise' && D.round === 1) v += 6;
      if (me && me.st.confuse) { me.st.confuse = 0; const all = alive(0).concat(alive(1)); say(`${me.name}, désorienté·e, frappe au hasard !`, 1 - si); hit(pick(all), v, { el }); }
      else if (K.tgt === 'rnd') { for (let h = 0; h < (K.hits || 1); h++) { const r = pick(alive(1 - si)); if (r) hit(r, v, { el, pierce: K.pierce }); } }
      else foesT.forEach(t => { let dealt = 0; for (let h = 0; h < (K.hits || 1); h++) dealt += hit(t, v, { el, pierce: K.pierce, aoe: K.tgt === 'allfoes' }); if (K.fx === 'drain' && me) heal(me, Math.floor(dealt / 2)); if (K.fx === 'devour' && me && t.ko) heal(me, 6); });
      if (K.splash) { const t2 = pick(alive(1 - si).filter(o => !foesT.includes(o))); if (t2) hit(t2, K.splash + up, { el, aoe: true }); }
    }
    foesT.forEach(t => {
      if (t.ko) return;
      if (K.poison) { t.st.poison = (t.st.poison || 0) + K.poison + up; say(`${t.name} est empoisonné·e.`, si); }
      if (K.stun) { t.st.stun = Math.max(t.st.stun || 0, K.stun); say(`${t.name} ne pourra pas jouer au prochain tour.`, si); }
      if (K.weak) { t.st.weak = Math.max(t.st.weak || 0, K.weak[0] + up); t.st.weakT = Math.max(t.st.weakT || 0, K.weak[1]); say(`${t.name} frappe ${K.weak[0] + up} de moins.`, si); }
      if (K.confuse) { t.st.confuse = 1; say(`${t.name} est désorienté·e.`, si); }
    });
    if (K.blk != null) { const b = D.blkOf(c, me); allyT.forEach(a => { a.block += b; }); if (allyT.length) say(`Parade ${b} pour ${allyT.length > 1 ? 'toute l’équipe' : allyT[0].name}.`, si); }
    if (K.heal != null) allyT.forEach(a => heal(a, K.heal + (K.tgt === 'allies' ? 1 : 3) * up));
    if (K.cure) allyT.forEach(a => { a.st.poison = 0; });
    if (K.buff) allyT.forEach(a => { a.st.song = (a.st.song || 0) + K.buff + up; say(`${a.name} : +${K.buff + up} de force.`, si); });
    if (K.evade) (allyT.length ? allyT : [me]).filter(Boolean).forEach(a => { a.st.evade = 1; });
    if (K.taunt) { const a = K.tgt === 'self' ? me : T || me; if (a && !a.ko) a.st.taunt = 1; }
    if (K.decoy) S0.decoy = 1;
    if (K.trap) { S0.trap += K.trap + 3 * up; say(`Un piège est tendu (${S0.trap}).`, si); }
    if (K.revive && T && T.ko) { T.ko = false; T.hp = Math.max(1, Math.round(T.max * (K.revive + .15 * up))); say(`${T.name} se relève !`, si); }
    if (K.nrg) S0.nrg += K.nrg + up;
    if (K.draw) draw(si, K.draw + (up ? 1 : 0));
    if (K.fx === 'risky' && T && Math.random() < 1 / 3) { T.st.poison = (T.st.poison || 0) + 2; say(`Le champignon était douteux : ${T.name} est empoisonné·e.`, 1 - si); }
    if (K.fx === 'wish') { const r = Math.random(); if (r < 1 / 3) alive(si).forEach(a => heal(a, 5)); else if (r < 2 / 3) draw(si, 2); else S0.nrg += 2; }
    D.check(); return '';
  };
  D.startTurn = si => {
    const s = D.sides[si], first = s.first, more = Math.max(0, Math.min(alive(si).length, (D.actCap && D.actCap[si]) || 9) - 3); s.nrg = ENERGY + more + (first && si === 1 ? 1 : 0); s.first = false;   // une grande équipe agit davantage : +1 énergie et +1 carte par combattant au-delà de 3   // premier tour : celui qui commence pioche une carte de moins, le second a 1 énergie de plus
    s.f.forEach(o => { if (o.ko) return; o.block = 0; o.st.taunt = 0; if (o.st.poison) { const p = o.st.poison; o.hp -= p; o.st.poison--; say(`${o.name} souffre du poison (−${p}).`, 1 - si); if (o.hp <= 0) { o.hp = 0; o.ko = true; o.st = {}; say(`${o.name} est K.O. !`, 1 - si); } } });
    draw(si, HAND_SIZE + more - (first && si === 0 ? 1 : 0)); D.turnAt = Date.now(); D.check(); D.seq++;
  };
  D.endTurn = si => {
    if (D.over != null || D.cur !== si) return; const s = D.sides[si];
    s.disc.push(...s.hand); s.hand = [];
    s.f.forEach(o => { if (o.st.stun) o.st.stun--; if (o.st.weakT) { o.st.weakT--; if (!o.st.weakT) o.st.weak = 0; } });
    D.cur = 1 - si; if (D.cur === 0) D.round++;
    if (D.round > DUEL.ROUNDS) { const pct = k => D.sides[k].f.reduce((a, o) => a + o.hp, 0) / D.sides[k].f.reduce((a, o) => a + o.max, 0); const a = pct(0), b = pct(1); D.over = Math.abs(a - b) < .02 ? 'draw' : a > b ? 0 : 1; say('Le temps est écoulé : on compte les PV.', 0); D.seq++; return; }
    D.startTurn(D.cur);
  };
  D.forfeit = si => { if (D.over == null) { D.over = 1 - si; say(`${D.sides[si].master} abandonne.`, 1 - si); D.seq++; } };
  D.startTurn(0);
  return D;
}
// ce que voit un camp : ses champions à gauche, ceux d'en face à droite, sa main en bas (la main d'en face reste cachée)
function duelVM(D, me) {
  const s = D.sides[me], o = D.sides[1 - me];
  return { turn: D.round, np: 1, party: s.f.map(f => figVM(null, f, 'ally')), foes: o.f.map(f => figVM(null, f, 'foe')), hands: [s.hand.map(c => cardVM(D, c, me))], nrg: [s.nrg],
    draw: s.draw.length, disc: s.disc.length, exh: s.exh.length, trap: s.trap, decoy: s.decoy, env: [], ready: [], names: [], oppHand: o.hand.length,
    log: D.log.slice(-3).map(e => ({ t: e.t, c: e.s === me ? 'good' : 'bad' })) };
}
// l'ordinateur joue un camp : la carte qui rapporte le plus par point d'énergie, tant qu'il y en a une qui vaut le coup
function duelAI(D, si) {
  const s = D.sides[si], foes = D.sides[1 - si].f.filter(o => !o.ko), mates = s.f.filter(o => !o.ko);
  const threat = foes.reduce((a, o) => a + (o.st.stun ? 0 : o.atk * 3 + 5), 0); let best = null;
  s.hand.forEach(c => {
    if (D.why(c, si)) return; const K = cardDef(c), me = D.owner(c), cost = D.costOf(c), up = c.up ? 1 : 0;
    (['enemy', 'ally', 'ko'].includes(K.tgt) ? D.targets(c, si) : [null]).forEach(t => {
      let v = 0;
      if (K.dmg != null) { const d = D.dmgOf(c, me), n = K.hits || 1, tgs = K.tgt === 'allfoes' ? foes : t ? [t] : foes.slice(0, 1); tgs.forEach(x => { const raw = d * n * elemMul(cardEl(c, me), x), eff = Math.max(0, raw - (K.pierce ? 0 : x.block)); v += Math.min(eff, x.hp) + (eff >= x.hp ? 8 + x.atk * 2 : 0); }); v += (K.splash || 0) * .8; }
      if (K.blk != null) v += Math.min(D.blkOf(c, me) * (K.tgt === 'allies' ? mates.length : 1), threat) * .8;
      if (K.heal != null) (K.tgt === 'allies' ? mates : t ? [t] : []).forEach(x => { v += Math.min(K.heal + 3 * up, x.max - x.hp); });
      if (K.stun) v += (t ? t.atk : 2) * 4 + 4; if (K.weak) v += (K.weak[0] + up) * K.weak[1] * 1.3 * (K.tgt === 'allfoes' ? foes.length : 1);
      if (K.poison) v += (K.poison + up) * 1.6; if (K.buff) v += (K.buff + up) * (K.tgt === 'allies' ? mates.length : 1) * 2.5;
      if (K.draw) v += K.draw * 2.5; if (K.nrg) v += K.nrg * 3.5; if (K.revive && t) v += 15; if (K.trap) v += (K.trap + 3 * up) * .7; if (K.evade || K.decoy) v += Math.min(8, threat * .4); if (K.taunt) v += 2;
      const r = v / (cost + .6); if (v >= 1.5 && (!best || r > best.r)) best = { c, t, r };
    });
  });
  if (!best) return false; D.play(best.c, best.t ? best.t.id : null, si); return true;
}
const eloGain = (r, ro, score) => Math.round(DUEL.K * (score - 1 / (1 + Math.pow(10, (ro - r) / 400))));
function duelRecord(score, oppR, how) {
  const st = duelState(), g = eloGain(st.r, oppR, score); st.r = clamp(st.r + g, 100, 4000);
  if (score === 1) st.w++; else if (score === 0) st.l++; else st.d++; save(); return g;
}

/* ---------- l'écran du duel (dans le décor de la taverne des Septbières) ---------- */
function duelScreen(o) {   // o : { D (local) | null, me, mode: 'ai'|'host'|'guest', act(a), oppName, myName, onEnd(res) }
  const page = openCrawlPage('septbieres'); page.classList.add('battle', 'duel'); page.setAttribute('aria-label', 'Duel de cartes');
  const top = page.querySelector('.cp-top'), body = page.querySelector('.cp-body'), seen = new Set();
  const ui = { sel: null, vm: null, cur: false, over: null, left: 0, done: false };
  const scr = { page, ui };
  scr.set = (vm, cur, over, left) => { ui.vm = vm; ui.cur = cur; ui.over = over; ui.left = left || 0; if (!cur) ui.sel = null; scr.render(); };
  scr.render = () => {
    const vm = ui.vm; if (!vm) { body.innerHTML = `<div class="cmap"><p class="cmsg2">${gi('hourglass')} ${esc(o.wait || 'On prépare le duel…')}</p></div>`; return; }
    morphHTML(top, `<span class="cp-emo">${gi('cards')}</span><div><h2>Duel : ${esc(o.myName)} contre ${esc(o.oppName)}</h2><span class="cp-meta">Tour ${+vm.turn} · ${ui.over ? 'fini' : ui.cur ? 'à toi de jouer' : 'au tour de ' + esc(o.oppName)}${ui.left && !ui.over ? ` · ${ui.left} s` : ''} · en face : ${+(vm.oppHand || 0)} cartes en main</span></div><button type="button" class="sbtn small dforfeit" data-a="forfeit">Abandonner</button>`);
    const sel = ui.sel && vm.hands[0].find(c => c.uid === ui.sel);
    morphHTML(body, battleHTML(vm, 0, { sel, enemy: !ui.cur || !!ui.over, done: false, host: false, seen }));
    vm.hands[0].forEach(c => seen.add(c.uid));
    const info = body.querySelector('.cinfo'); if (info && (!ui.cur || ui.over || !sel)) info.innerHTML = ui.over ? '' : !ui.cur ? `${gi('hourglass')} Au tour de ${esc(o.oppName)}…` : `${gi('cards')} À toi : joue tes cartes (touche-les), puis « Fin du tour ».`;
    crawlGround(page);
    if (ui.over && !ui.done) { ui.done = true; scr.end(ui.over); }
  };
  scr.end = res => {
    const txt = o.endText ? o.endText(res) : res === 'win' ? 'Victoire !' : res === 'lose' ? 'Défaite…' : 'Égalité', g = o.onEnd ? o.onEnd(res) : null;
    sfx(res === 'win' ? 'victory' : res === 'lose' ? 'bad' : 'chime');
    body.insertAdjacentHTML('beforeend', `<div class="dend"><h2 class="cp-end">${gi(res === 'win' ? 'crown' : res === 'lose' ? 'skull' : 'flag')} ${txt}</h2>${g != null ? `<p class="cmsg2">Ta cote : ${g >= 0 ? '+' : ''}${g} (${Math.round(duelState().r)})</p>` : ''}<div class="btnrow cp-foot"><button type="button" class="sbtn pri" data-a="close">${gi('door')} ${esc(o.closeLabel || 'Retour au château')}</button></div></div>`);
  };
  page.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b || b.disabled) return; const a = b.dataset.a, v = b.dataset.v, vm = ui.vm;
    if (a === 'close') { scr.close(); return; }
    if (a === 'forfeit') { if (ui.over) return; if (b.dataset.sure) { o.act({ a: 'forfeit' }); return; } b.dataset.sure = '1'; b.textContent = 'Sûr ? Abandonner'; setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = 'Abandonner'; } }, 3000); return; }
    if (!vm || !ui.cur || ui.over) return;
    if (a === 'card') {
      const c = vm.hands[0].find(x => x.uid === v); if (!c) return; if (c.why) { toast(c.why, true); sfx('bad'); return; }
      if (ui.sel === v) { if (!['enemy', 'ally', 'ko'].includes(c.tgt)) { ui.sel = null; o.act({ a: 'card', uid: v }); return; } }
      else { ui.sel = v; sfx('tick'); } scr.render();
    } else if (a === 'tg') { if (!ui.sel) return; const uid = ui.sel; ui.sel = null; o.act({ a: 'card', uid, t: v }); }
    else if (a === 'cancel') { ui.sel = null; scr.render(); }
    else if (a === 'end') { ui.sel = null; o.act({ a: 'end' }); }
  });
  scr.close = () => { if (o.onClose) o.onClose(); closeCrawlPage(); };
  scr.render();
  return scr;
}
// un duel contre l'ordinateur (une garde publiée, ou l'entraînement) : tout se joue ici
function duelVsAI(mine, theirs, opts = {}) {
  const D = duelNew(mine, theirs), me = 0, ai = 1; let timer = 0;
  const scr = duelScreen({ me, mode: 'ai', myName: mine.master, oppName: `${theirs.master} (${theirs.name})`,
    act: a => {
      if (a.a === 'forfeit') D.forfeit(me);
      else if (D.cur === me) { if (a.a === 'card') { const c = D.sides[me].hand.find(x => x.uid === a.uid); if (c) { const err = D.play(c, a.t, me); if (err) toast(err, true); else sfx('chime'); } } else if (a.a === 'end') D.endTurn(me); }
      sync();
    },
    onEnd: res => opts.onEnd ? opts.onEnd(res, D) : null, onClose: () => clearTimeout(timer) });
  const res = () => D.over == null ? null : D.over === 'draw' ? 'draw' : D.over === me ? 'win' : 'lose';
  function sync() {
    scr.set(duelVM(D, me), D.cur === me && D.over == null, res());
    if (D.over == null && D.cur === ai) { clearTimeout(timer); timer = setTimeout(aiStep, 750); }
  }
  function aiStep() { if (D.over != null || D.cur !== ai || !scr.page.isConnected) return; if (duelAI(D, ai)) { sfx('tick'); sync(); timer = setTimeout(aiStep, 700); } else { D.endTurn(ai); sync(); } }
  sync(); return D;
}

/* ---------- défier la garde d'un autre Maître (en différé) ---------- */
async function duelLoadGuard(pk) {
  const evs = await netQuery(NET_STORE, [{ kinds: [30078], authors: [pk], '#d': ['csd1:duel'], limit: 4 }]);
  const ev = evs.filter(e => e.pubkey === pk && safeVerify(e)).sort((a, b) => b.created_at - a.created_at)[0]; if (!ev) return null;
  try { return cleanGuard(JSON.parse(ev.content)); } catch (e) { return null; }
}
async function duelPublish() {
  if (!NET.ok) { toast('Le Val est hors ligne : la garde sera publiée plus tard.', true); return 0; }
  const g = duelMyGuard(), st = duelState();
  const n = await netPublish(NET_STORE, sign(30078, [['d', 'csd1:duel'], ['t', 'csd1-duel-garde'], ['alt', 'Garde de duel du jeu Cozy Stickers Dungeon']], JSON.stringify(g)));
  if (n) { st.pub = nowS(); save(); valPublish(true); } return n;
}
async function duelChallenge(pk) {
  if (!NET.ok) { toast('Il faut être en ligne pour défier un Maître.', true); return; }
  if (UI.busy || (typeof VISIT !== 'undefined' && VISIT) || COOP.role) { toast('Pas maintenant : finis d’abord ce que tu fais.', true); return; }
  toast('On va chercher sa garde de duel…');
  const theirs = await duelLoadGuard(pk); if (!theirs) { toast('Ce Maître n’a pas encore publié de garde de duel.', true); return; }
  if (!duelState().pub) duelPublish();   // pour qu'on puisse te rendre la pareille
  closeModal(true); if (typeof MAPV !== 'undefined' && MAPV.open) closeWorld();
  duelVsAI(duelMyGuard(), theirs, { onEnd: (res, D) => {
    const score = res === 'win' ? 1 : res === 'lose' ? 0 : .5, g = duelRecord(score, theirs.r, 'garde');
    valSend('duel', pk, { res, r: Math.round(duelState().r - g), rounds: D.round }).catch(() => {});
    addLog(`Duel contre la garde de ${theirs.master} : ${res === 'win' ? 'victoire' : res === 'lose' ? 'défaite' : 'égalité'}.`, res === 'lose' ? 'bad' : 'good'); return g;
  } });
}

/* ---------- le duel en direct : un salon chiffré, l'hôte arbitre ---------- */
function duelRoom(code, onMsg) {
  const L = { code, me: rid(4), keys: null, sub: null, peerAt: Date.now(), closed: false, timers: [] };
  L.ready = roomKeys('duel:' + code).then(k => { L.keys = k; L.sub = netSub(NET_LIVE, () => [{ kinds: [COOP_KIND], '#t': [k.tag], since: nowS() - 10 }], async ev => {
    if (L.closed) return; let m; try { m = await unseal(L.keys.key, ev.content); } catch (e) { return; }
    if (!m || typeof m !== 'object' || !m.from || m.from === L.me) return; L.peerAt = Date.now(); onMsg(m);
  }, null, 4000); });
  L.send = async msg => { if (L.closed) return; await L.ready; try { const ev = sign(COOP_KIND, [['t', L.keys.tag]], await seal(L.keys.key, { ...msg, from: L.me })); NET_LIVE.forEach(u => relaySend(relay(u), ['EVENT', ev])); } catch (e) { console.error(e); } };
  L.close = () => { if (L.closed) return; L.send({ t: 'dbye' }); setTimeout(() => { L.closed = true; try { L.sub && L.sub.close(); } catch (e) {} }, 400); L.timers.forEach(clearInterval); if (DU.live === L) DU.live = null; };
  return L;
}
const duelCode = () => rid(3).toUpperCase();
// l'hôte : ouvre le salon, invite (ou donne le code), attend l'adversaire, puis arbitre chaque coup
function duelHost(pk, oppLabel) {
  if (!NET.ok) { toast('Il faut être en ligne pour un duel en direct.', true); return; }
  if (DU.live) { toast('Un duel est déjà en cours.', true); return; }
  const code = duelCode(), mine = duelMyGuard(); let D = null, scr = null, theirs = null, lastSeq = -1;
  const L = duelRoom(code, m => {
    if (m.t === 'dhello' && !D) { theirs = cleanGuard(m.g); if (!theirs) return; closeModal(true); start(); }
    else if (m.t === 'dact' && D && D.over == null) { if (m.a === 'forfeit') D.forfeit(1); else if (D.cur === 1) { if (m.a === 'card') { const c = D.sides[1].hand.find(x => x.uid === m.uid); if (c) D.play(c, typeof m.tv === 'string' ? m.tv : null, 1); } else if (m.a === 'end') D.endTurn(1); } sync(true); }
    else if (m.t === 'dbye' && D && D.over == null) { D.forfeit(1); sync(true); }
  });
  DU.live = L;
  if (pk) valSend('duelinv', pk, { code, exp: nowS() + 240 }).catch(() => {});
  openModal(`<h2>⚡ Duel en direct</h2><p>${pk ? `Invitation envoyée à <b>${esc(oppLabel || 'ce Maître')}</b>. ` : ''}Ton adversaire peut aussi entrer ce code dans l’Arène du Val :</p><p class="dcode">${esc(code)}</p><p class="hint">On attend qu’il arrive… (le salon se ferme si personne ne vient d’ici 4 minutes)</p><div class="btnrow"><button type="button" class="sbtn" data-close>Annuler</button></div>`, { label: 'Duel en direct' });
  const m0 = document.querySelector('#modalRoot .modal'); const obs = new MutationObserver(() => { if (!D && m0 && !m0.isConnected) { obs.disconnect(); L.close(); } }); obs.observe($('#modalRoot'), { childList: true });
  setTimeout(() => { if (!D && DU.live === L) { L.close(); closeModal(true); toast('Personne n’est venu : le salon est fermé.'); } }, 240000);
  const res = () => D.over == null ? null : D.over === 'draw' ? 'draw' : D.over === 0 ? 'win' : 'lose';
  const left = () => Math.max(0, Math.ceil(DUEL.TURN_S - (Date.now() - D.turnAt) / 1000));
  function start() {
    D = duelNew(mine, theirs); sfx('horn');
    scr = duelScreen({ me: 0, mode: 'host', myName: mine.master, oppName: theirs.master, act: a => { if (a.a === 'forfeit') D.forfeit(0); else if (D.cur === 0) { if (a.a === 'card') { const c = D.sides[0].hand.find(x => x.uid === a.uid); if (c) { const err = D.play(c, a.t, 0); if (err) toast(err, true); else sfx('chime'); } } else if (a.a === 'end') D.endTurn(0); } sync(true); },
      onEnd: r => { const g = duelRecord(r === 'win' ? 1 : r === 'lose' ? 0 : .5, theirs.r, 'direct'); addLog(`Duel en direct contre ${theirs.master} : ${r === 'win' ? 'victoire' : r === 'lose' ? 'défaite' : 'égalité'}.`, r === 'lose' ? 'bad' : 'good'); return g; },
      onClose: () => L.close() });
    L.send({ t: 'dstart', g: mine });
    sync(true);
    // l'horloge du tour, les nouvelles de l'autre, et l'état renvoyé de temps en temps (un message perdu se rattrape)
    L.timers.push(setInterval(() => {
      if (!D || D.over != null) return;
      if (left() <= 0) { D.endTurn(D.cur); sync(true); return; }
      if (Date.now() - L.peerAt > 30000) { D.forfeit(1); toast(`${theirs.master} a quitté le duel.`); sync(true); return; }
      sync(Date.now() % 3000 < 1000);
    }, 1000));
  }
  function sync(net) {
    if (!D || !scr) return;
    scr.set(duelVM(D, 0), D.cur === 0 && D.over == null, res(), left());
    if (net || D.seq !== lastSeq) { lastSeq = D.seq; const r = res(); L.send({ t: 'dstate', vm: duelVM(D, 1), cur: D.cur === 1 && D.over == null, over: r == null ? null : r === 'draw' ? 'draw' : r === 'win' ? 'lose' : 'win', left: left() }); }
  }
}
// l'invité : entre dans le salon, présente sa garde, et joue ce que l'hôte lui montre
function duelJoin(code, label) {
  code = String(code || '').trim().toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 6);
  if (code.length !== 6) { toast('Ce code ne ressemble pas à un code de duel (6 caractères).', true); return; }
  if (!NET.ok) { toast('Il faut être en ligne pour un duel en direct.', true); return; }
  if (DU.live) { toast('Un duel est déjà en cours.', true); return; }
  const mine = duelMyGuard(); let scr = null, theirs = null, tries = 0, recorded = false;
  const L = duelRoom(code, m => {
    if (m.t === 'dstart' && !scr) { theirs = cleanGuard(m.g) || { master: label || 'Maître', r: 1000 }; open(); }
    else if (m.t === 'dstate') { if (!scr) { theirs = theirs || { master: label || 'Maître', r: 1000 }; open(); } const vm = crawlSafeVM(m.vm || {}); vm.oppHand = clamp(+(m.vm && m.vm.oppHand) || 0, 0, 10); scr.set(vm, !!m.cur, ['win', 'lose', 'draw'].includes(m.over) ? m.over : null, clamp(+m.left || 0, 0, 999)); }
    else if (m.t === 'dbye' && scr && !scr.ui.over) { toast('Ton adversaire a quitté le duel.'); scr.set(scr.ui.vm, false, 'win'); }
  });
  DU.live = L; closeModal(true); if (typeof MAPV !== 'undefined' && MAPV.open) closeWorld();
  function open() {
    scr = duelScreen({ me: 0, mode: 'guest', myName: mine.master, oppName: (theirs && theirs.master) || label || 'Maître', wait: 'On rejoint le duel…', act: a => L.send({ t: 'dact', a: a.a, uid: a.uid, tv: a.t }),
      onEnd: r => { if (recorded) return null; recorded = true; const g = duelRecord(r === 'win' ? 1 : r === 'lose' ? 0 : .5, (theirs && theirs.r) || 1000, 'direct'); addLog(`Duel en direct contre ${(theirs && theirs.master) || 'un Maître'} : ${r === 'win' ? 'victoire' : r === 'lose' ? 'défaite' : 'égalité'}.`, r === 'lose' ? 'bad' : 'good'); return g; },
      onClose: () => L.close() });
  }
  const hello = setInterval(() => { if (scr || ++tries > 12 || L.closed) { clearInterval(hello); if (!scr && !L.closed) { L.close(); toast('Personne ne répond à ce code.', true); } return; } L.send({ t: 'dhello', g: mine }); }, 2500);
  L.send({ t: 'dhello', g: mine });
  L.timers.push(setInterval(() => { L.send({ t: 'dping' }); if (scr && !scr.ui.over && Date.now() - L.peerAt > 30000) { toast('La liaison avec ton adversaire est perdue.', true); scr.set(scr.ui.vm, false, 'draw'); } }, 4000));
}

/* ---------- l'Arène : ta garde, les Maîtres à défier, les duels entre amis, l'entraînement ---------- */
function duelArenaHTML() {
  const st = duelState(), mine = duelMyGuard(), teamIds = st.team.length ? st.team : duelAutoTeam(), bag = mine.bag.map(b => b[0]), w = duelBagWeight(bag);
  const crew = S.creatures.filter(c => !isOut(c)).sort((a, b) => duelPower(b) - duelPower(a)).slice(0, 18);
  const pool = castlePool().filter(duelUsable);
  const foes = typeof VAL !== 'undefined' && VAL.castles ? [...VAL.castles.values()].filter(c => !c.me && c.duel > 0).sort((a, b) => b.at - a.at).slice(0, 20) : [];
  return `<div class="darena">
    <h3>🃏 Ta garde de duel</h3><p class="hint">Cote <b>${Math.round(st.r)}</b> · ${st.w} victoire${st.w > 1 ? 's' : ''}, ${st.l} défaite${st.l > 1 ? 's' : ''}${st.d ? `, ${st.d} égalité${st.d > 1 ? 's' : ''}` : ''}. Quand un Maître défie ta garde, l’ordinateur la joue pour toi. En duel, les PV et la force de tes champions sont ramenés à une même échelle : c’est le choix des cartes qui compte.</p>
    <h4>Tes ${DUEL.TEAM} champions</h4><div class="dteam">${crew.map(c => { const on = teamIds.includes(c.id), f = duelFighterDoc(c); return `<button type="button" class="dmate${on ? ' on' : ''}" data-act="dteam" data-arg="${c.id}" aria-pressed="${on}"><img alt="" src="${thumb('char', c.sp)}"><b>${esc(c.name)}</b><small>${f.hp} PV · force ${f.atk}${f.up ? ' · ✦' : ''}</small></button>`; }).join('') || '<p class="hint">Pas encore de créature.</p>'}</div>
    <h4>Ton sac de duel : ${bag.length}/${DUEL.BAG} cartes, poids ${w}/${DUEL.BUDGET}</h4><div class="dbar"><i style="width:${Math.min(100, w / DUEL.BUDGET * 100)}%"></i></div>
    <p class="hint">Chaque carte pèse selon sa force (✦ plus lourd). Touche une carte pour la prendre ou la reposer.</p>
    <div class="dpick">${pool.map(k => { const up = castleUp(k), on = bag.includes(k); return `<div class="dpk${on ? ' on' : ''}">${cardHTML(cardVM(null, newCard('castle', k, null, up), 0, null), { a: 'noop', v: k, pressed: on })}<button type="button" class="sbtn small" data-act="dbag" data-arg="${k}">${on ? 'Reposer' : 'Prendre'} · poids ${duelWeight(k, up)}</button></div>`; }).join('') || '<p class="hint">Tes meubles et tes pièges donnent les cartes du sac.</p>'}</div>
    <div class="btnrow"><button type="button" class="sbtn" data-act="dauto">Garde automatique</button>${NET.ok ? `<button type="button" class="sbtn pri" data-act="dpub">📣 Publier ma garde</button>` : ''}<button type="button" class="sbtn" data-act="dtrain">🎯 S’entraîner</button></div>
    ${NET.ok ? `<h3>⚔️ Défier un Maître</h3><div class="dfoes">${foes.map(c => { const on = nowS() - c.at < ONLINE_S; return `<div class="dfoe"><span><b>${esc(c.master)}</b> · ${esc(c.name)}<small><i class="dot ${on ? 'on' : ''}"></i> cote ${c.duel}</small></span><button type="button" class="sbtn" data-act="dduel" data-arg="${c.pk}">🃏 Défier sa garde</button>${on ? `<button type="button" class="sbtn pri" data-act="dlive" data-arg="${c.pk}">⚡ En direct</button>` : ''}</div>`; }).join('') || '<p class="hint">Aucun Maître n’a encore publié de garde. Publie la tienne : les autres pourront te défier.</p>'}</div>
    <h3>🔗 Entre amis, en direct</h3><div class="btnrow"><button type="button" class="sbtn" data-act="dhost">Créer un duel (code)</button><input id="dcode" type="text" maxlength="6" placeholder="Code" aria-label="Code du duel" autocomplete="off"><button type="button" class="sbtn" data-act="djoin">Rejoindre</button></div>` : '<p class="hint">Hors ligne : seul l’entraînement est possible. Les duels contre les autres Maîtres se jouent sur la version en ligne.</p>'}
  </div>`;
}
function duelArenaClick(e) {
  const b = e.target.closest('[data-act]'); if (!b) return false; const k = b.dataset.act, arg = b.dataset.arg, st = duelState();
  if (k === 'dteam') { const cur = st.team.length ? st.team.filter(id => critter(id) && !isOut(critter(id))) : duelAutoTeam(), i = cur.indexOf(arg); if (i >= 0) cur.splice(i, 1); else { if (cur.length >= DUEL.TEAM) cur.shift(); cur.push(arg); } st.team = cur; save(); sfx('tick'); duelArenaRefresh(); return true; }
  if (k === 'dbag') { const cur = duelMyGuard().bag.map(x => x[0]), i = cur.indexOf(arg); if (i >= 0) cur.splice(i, 1); else { if (cur.length >= DUEL.BAG) { toast(`${DUEL.BAG} cartes au plus : repose-en une d’abord.`, true); return true; } if (duelBagWeight([...cur, arg]) > DUEL.BUDGET) { toast(`Trop lourd : le sac ne peut pas dépasser ${DUEL.BUDGET}.`, true); return true; } cur.push(arg); } st.bag = cur.length ? cur : ['__vide']; save(); sfx('tick'); duelArenaRefresh(); return true; }
  if (k === 'dauto') { st.team = []; st.bag = []; save(); sfx('tick'); duelArenaRefresh(); return true; }
  if (k === 'dpub') { b.disabled = true; duelPublish().then(n => { toast(n ? `📣 Ta garde de duel est publiée (${n} relais).` : 'Les relais ne répondent pas, réessaie.', !n); b.disabled = false; }); return true; }
  if (k === 'dtrain') { closeModal(true); duelVsAI(duelMyGuard(), duelTrainingGuard(), { onEnd: res => { addLog(`Entraînement aux cartes : ${res === 'win' ? 'victoire' : res === 'lose' ? 'défaite' : 'égalité'}.`, ''); return null; } }); return true; }
  if (k === 'dduel') { duelChallenge(arg); return true; }
  if (k === 'dlive') { const c = VAL.castles.get(arg); duelHost(arg, c ? c.master : ''); return true; }
  if (k === 'dhost') { duelHost(null); return true; }
  if (k === 'djoin') { const inp = document.getElementById('dcode'); duelJoin(inp ? inp.value : ''); return true; }
  return false;
}
function duelArenaRefresh() { const t = document.getElementById('duelArena'); if (t) t.innerHTML = duelArenaHTML(); }
function openArena() {
  if (UI.busy) return;
  const m = openModal(`<h2>🃏 L’Arène des cartes</h2><div id="duelArena">${duelArenaHTML()}</div>`, { wide: true, label: 'Arène des cartes' });
  m.addEventListener('click', e => { if (duelArenaClick(e)) e.stopPropagation(); });
}

/* ---------- les branchements : le Val, la carte, le courrier ---------- */
// le Val : un onglet Arène
const renderValDuel = renderVal;
renderVal = function () {
  renderValDuel(); const box = document.getElementById('valBody'); if (!box) return;
  const tabs = box.querySelector('.vtabs'); if (tabs && !tabs.querySelector('[data-tab="arene"]')) tabs.insertAdjacentHTML('beforeend', `<button type="button" role="tab" data-tab="arene" aria-selected="${VAL.tab === 'arene'}">🃏 Arène</button>`);
  if (VAL.tab === 'arene') { const t = box.querySelector('#valTab'); if (t) t.innerHTML = `<div id="duelArena">${duelArenaHTML()}</div>`; }
};
const valClickDuel = valClick;
valClick = function (e) {
  const d = e.target.closest('[data-duel]'); if (d) { duelChallenge(d.dataset.duel); return; }
  const l = e.target.closest('[data-duellive]'); if (l) { const c = VAL.castles.get(l.dataset.duellive); duelHost(l.dataset.duellive, c ? c.master : ''); return; }
  if (duelArenaClick(e)) return;
  return valClickDuel(e);
};
// la liste des châteaux : défier ceux qui ont une garde
const castleCardDuel = castleCard;
castleCard = function (c) {
  const h = castleCardDuel(c); if (c.me || !(c.duel > 0)) return h; const on = nowS() - c.at < ONLINE_S;
  return h.replace('<div class="vbtn">', `<div class="vbtn"><button class="sbtn" type="button" data-duel="${c.pk}" title="Défier sa garde de duel">🃏 Duel</button>${on ? `<button class="sbtn" type="button" data-duellive="${c.pk}" title="Le défier en direct">⚡</button>` : ''}`);
};
// le résumé publié dit si on a une garde (et sa cote)
const valSummaryDuel = valSummary;
valSummary = function () { const s = valSummaryDuel(); const st = homeS().duel; if (st && st.pub) s.duel = Math.round(st.r); return s; };
const cleanSummaryDuel = cleanSummary;
cleanSummary = function (o, ev) { const c = cleanSummaryDuel(o, ev); if (c) c.duel = clamp(Math.round(+o.duel || 0), 0, 4000); return c; };
// sur la carte : le château d'un autre Maître
const renderMapPanelDuel = renderMapPanel;
renderMapPanel = function () {
  renderMapPanelDuel(); const sel = MAPV.sel, p = document.getElementById('wpanel'); if (!p || !sel || sel.kind !== 'joueur' || !NET.ok) return;
  const c = VAL.castles.get(sel.pk), on = c && nowS() - c.at < ONLINE_S;
  p.insertAdjacentHTML('beforeend', `<h4>🃏 Aux cartes</h4><p class="hint">${c && c.duel ? `Sa garde de duel a une cote de ${c.duel}.` : 'Il n’a peut-être pas encore publié de garde de duel.'}</p><div class="btnrow"><button class="sbtn" type="button" data-m="duel">🃏 Défier sa garde</button>${on ? '<button class="sbtn pri" type="button" data-m="duellive">⚡ En direct</button>' : ''}</div>`);
};
const mapPanelClickDuel = mapPanelClick;
mapPanelClick = function (e) {
  const b = e.target.closest('[data-m]'); const sel = MAPV.sel;
  if (b && sel && sel.kind === 'joueur' && (b.dataset.m === 'duel' || b.dataset.m === 'duellive')) { if (b.dataset.m === 'duel') duelChallenge(sel.pk); else duelHost(sel.pk, sel.master); return; }
  return mapPanelClickDuel(e);
};
// le courrier : les résultats des défis contre ta garde, et les invitations en direct
const valMailDuel = valMail;
valMail = function (ev) {
  const t = ev && tagOf(ev, 't');
  if (t !== 'csd1-duel' && t !== 'csd1-duelinv') return valMailDuel(ev);
  if (!ev || ev.pubkey === NET.pk || !S || !S.val) return;
  if (VISIT || COOP.role === 'guest' || !S.started) { if (VAL.pending.length < 200) VAL.pending.push(ev); return; }
  if (S.val.claimed.includes(ev.id) || !safeVerify(ev)) return;
  let o; try { o = JSON.parse(ev.content); } catch (e) { return; } if (!o || typeof o !== 'object') return;
  S.val.claimed.push(ev.id); if (S.val.claimed.length > 500) S.val.claimed.splice(0, 100);
  const who = cleanName(o.m, 24) || 'Un Maître';
  if (t === 'csd1-duelinv') {
    const code = String(o.code || '').toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 6), exp = +o.exp || 0;
    if (code.length === 6 && exp > nowS() && ev.created_at > nowS() - 300) { DU.invites = DU.invites.filter(x => x.code !== code).concat([{ code, exp, m: who }]); toast(`⚡ ${who} te défie aux cartes en direct ! Touche la pastille ⚔️ pour le rejoindre.`); sfx('horn'); renderGoals(); }
    return;
  }
  const res = o.res === 'win' ? 0 : o.res === 'lose' ? 1 : .5, g = duelRecord(res, clamp(+o.r || 1000, 100, 4000), 'garde');
  const line = `🃏 ${who} a défié ta garde de duel : ${res === 1 ? 'ta garde a gagné' : res === 0 ? 'ta garde a perdu' : 'égalité'} (${g >= 0 ? '+' : ''}${g} à ta cote).`;
  VAL.mail.unshift({ at: ev.created_at, text: line }); VAL.unread = (VAL.unread || 0) + 1; addLog(line, res === 0 ? 'bad' : 'good'); save(); renderGoals();
};
// la pastille d'une invitation en direct (valable 4 minutes)
const valNotifsDuel = valNotifs;
valNotifs = function (add) {
  valNotifsDuel(add); DU.invites = DU.invites.filter(x => x.exp > nowS());
  DU.invites.slice(-2).forEach(x => add('duel' + x.code, '⚔️', `${x.m} te défie aux cartes en direct`, () => { DU.invites = DU.invites.filter(y => y.code !== x.code); duelJoin(x.code, x.m); }, 7, ''));
};
// hors ligne, la fenêtre du Val propose quand même l'entraînement
const openValDuel = openVal;
openVal = function (tab) {
  const r = openValDuel(tab);
  if (!NET.ok) { const m = document.querySelector('#modalRoot .modal .mbody'); if (m && !m.querySelector('[data-arena]')) { m.insertAdjacentHTML('beforeend', '<div class="btnrow"><button type="button" class="sbtn pri" data-arena="1">🃏 L’Arène des cartes (entraînement)</button></div>'); m.querySelector('[data-arena]').addEventListener('click', () => { closeModal(true); openArena(); }); } }
  return r;
};
// le lien ?duel=CODE rejoint directement un duel entre amis
if (typeof location !== 'undefined' && typeof URLSearchParams !== 'undefined') { const dc = new URLSearchParams(location.search).get('duel'); if (dc) setTimeout(() => { if (NET.ok) duelJoin(dc); }, 4000); }
WIKI.duels = { cat: 'val', t: 'Les duels de cartes', x: () => `<p>Dans l’<b>Arène</b> du Val (ou l’entraînement, hors ligne), deux Maîtres s’affrontent aux cartes, chacun avec <b>${DUEL.TEAM} champions</b> et un <b>sac de ${DUEL.BAG} cartes</b> du château dont le poids ne dépasse pas <b>${DUEL.BUDGET}</b> (chaque carte pèse selon sa force ; une carte ✦ d’un meuble de qualité pèse plus lourd). Les PV et la force des champions sont ramenés à une même échelle : un grand château a plus de choix, pas plus de puissance.</p>
  <ul><li><b>À tour de rôle</b> : 3 énergie et 5 cartes par tour (au premier tour, celui qui commence n’a que 4 cartes et le second a 1 énergie de plus). On gagne quand tous les champions d’en face sont K.O. Au bout de ${DUEL.ROUNDS} tours, on compte les PV.</li>
  <li><b>Contre une garde</b> : tu affrontes la garde publiée par un autre Maître, jouée par l’ordinateur ; il reçoit le résultat. Publie la tienne pour qu’on puisse te défier.</li>
  <li><b>En direct</b> : invite un Maître en ligne, ou donne un code à un ami ; chacun joue sur son écran, ${DUEL.TURN_S} secondes par tour.</li>
  <li><b>La cote</b> monte quand tu bats plus fort que toi et baisse quand tu perds contre plus faible. Les duels ne donnent ni or ni puissance : seulement la gloire.</li></ul>` };
