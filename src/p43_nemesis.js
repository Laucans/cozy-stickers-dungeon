/* =========================================================
   Le héros némésis, et les choix de l'aube
   Un aventurier nommé revient d'invasion en invasion : il prend
   des niveaux, apprend à désamorcer tes pièges, laisse des mots
   dans la chronique. Repoussé trois fois, il est à ta merci :
   le capturer, le corrompre (il te renseigne : +1 énergie au Cœur),
   ou le recruter (il change de camp).
   ========================================================= */
// les choix de l'aube : des fenêtres qui s'ouvrent après la chronique (le simulateur répond tout seul)
const DAWN_Q = [];
const headless = () => typeof SIM !== 'undefined';
function dawnChoice(open, auto) { if (headless() || typeof document === 'undefined') { try { auto && auto(); } catch (e) {} return; } DAWN_Q.push(open); }
const chronicleNem = chronicle;
chronicle = async function (...a) { await chronicleNem(...a); while (DAWN_Q.length) { try { await DAWN_Q.shift()(); } catch (e) { console.error(e); } } };
// une fenêtre de choix : chaque option [clé, icône, titre, détail, désactivée ?]
function choiceModal(title, text, opts) {
  return new Promise(res => {
    const m = openModal(`<h2>${title}</h2><p>${text}</p><div class="choices">${opts.map(([k, ik, t, d, off]) => `<button type="button" class="choice" data-ch="${k}" ${off ? 'disabled' : ''}><span class="emo">${gi(ik)}</span><b>${esc(t)}</b><span>${esc(d)}</span></button>`).join('')}</div>`, { noClose: true, label: title.replace(/<[^>]+>/g, '') });
    m.addEventListener('click', e => { const b = e.target.closest('[data-ch]'); if (!b || b.disabled) return; sfx('chime'); closeModal(true); res(b.dataset.ch); });
  });
}

const NEM_FIRST = ['Bertrand', 'Ysengrine', 'Gontran', 'Mélisande', 'Aldebert', 'Clotilde', 'Hugues', 'Pernelle', 'Thibaut', 'Rosalinde', 'Enguerrand', 'Bérangère'];
const NEM_SUR = ['le Tenace', 'la Rancunière', 'l’Obstiné', 'la Revancharde', 'le Têtu', 'la Mauvaise Perdante', 'le Bougon', 'l’Increvable', 'la Teigne', 'le Rancunier'];
const NEM_LINES = {
  win: ['« Ton château ? Une passoire. À la prochaine ! »', '« Je connais tes couloirs mieux que toi, maintenant. »', '« Merci pour le butin. Je reviendrai chercher la suite. »'],
  lose: ['« Ce n’est que partie remise ! »', '« Tu as eu de la chance. La prochaine fois, je viens avec une plus grosse épée. »', '« Je reviendrai… et j’aurai appris. »'],
  down: ['« Aïe. Bon. On en reparle ? »', '« Je… je reviendrai… peut-être. »', '« Ce n’est pas fini… enfin, presque. »'],
};
const nemOf = () => (S.foeHero && S.foeHero.st === 'active' ? S.foeHero : null);
const nemCrown = n => `${n.name} (niv. ${n.lvl})`;
// il prend la place d'un héros de la bande, en plus fort (avant que la bande se prépare : la difficulté reste réglée) ;
// il désamorce un piège dès le niveau 2
const planInvasion0Nem = planInvasion0;
planInvasion0 = function () {
  const p = planInvasion0Nem(), N = nemOf();
  if (N && p && p.party && p.party.length && !p.foe) {
    const old = p.party[p.party.length - 1], F = HERO_FIGHT[N.k] || HERO_FIGHT.paladin, k = 1.15 + .1 * N.lvl;
    const h = { ...(HEROES.find(x => x.k === N.k) || HEROES[0]), k: N.k, name: N.name, nem: true, hp: Math.max(4, Math.round(old.hp * k)), atk: (old.atk || 1) + Math.floor(N.lvl / 3), F: { ...F, disarm: N.lvl >= 2 ? Math.max(1, F.disarm || 0) : F.disarm } };
    p.party[p.party.length - 1] = h; p.nem = true; p.courage = p.party.reduce((a, x) => a + x.hp, 0);
  }
  return p;
};
// après l'invasion : elle naît dans une bande, grandit, et finit à ta merci
const applyInvasionNem = applyInvasion;
applyInvasion = function (plan, outcome) {
  const lines = applyInvasionNem(plan, outcome);
  try {
    if (plan.foe || !plan.party || !plan.party.length) return lines;
    if (!S.foeHero && S.night >= 6 && plan.party.some(h => !h.minion)) {
      const best = plan.party.filter(h => !h.minion).sort((a, b) => b.hp - a.hp)[0], first = pick(NEM_FIRST);
      S.foeHero = { name: `${first} ${pick(NEM_SUR)}`, k: best.k, lvl: 1, met: S.night, wins: 0, beaten: 0, st: 'active' };
      lines.push(['😠', `Parmi eux, ${S.foeHero.name} t’a dans le nez : « Je reviendrai, et la prochaine fois, ce château sera à moi ! » Ce héros sera de toutes les prochaines invasions, et il apprendra.`, 'bad']);
      return lines;
    }
    const N = nemOf(); if (!N || !plan.nem) return lines;
    const j = plan.party.findIndex(h => h.nem), R = plan.res, down = R && R.fallen && R.fallen.includes(j);
    if (outcome === 'robbed') { N.wins++; N.lvl = Math.min(6, N.lvl + 1); lines.push(['😠', `${N.name} ${pick(NEM_LINES.win)} (niveau ${N.lvl})`, 'bad']); }
    else if (outcome === 'repelled') {
      N.beaten++; lines.push(['💪', `${N.name} ${down ? 'est à terre' : 'est repoussé'} (${N.beaten}/3) ! ${pick(NEM_LINES.down)}`, 'good']);
      if (N.beaten >= 3) { N.st = 'mercy'; lines.push(['🗝️', `${N.name} est à ta merci. À toi de décider de son sort.`, 'ev']); dawnChoice(nemMercy, () => nemDecide(S.gold >= 40 ? 'spy' : 'ally')); }
    } else { N.lvl = Math.min(6, N.lvl + 1); lines.push(['😠', `${N.name} rebrousse chemin avec la bande : ${pick(NEM_LINES.lose)} (niveau ${N.lvl})`, '']); }
  } catch (e) { console.error(e); }
  return lines;
};
function nemDecide(k) {
  const N = S.foeHero; if (!N || N.st !== 'mercy') return;
  if (k === 'spy') { if (S.gold < 40) return; S.gold -= 40; N.st = 'spy'; addLog(`${N.name} travaille désormais pour toi : +1 énergie au premier tour du combat du Cœur, à chaque invasion.`, 'ev'); }
  else if (k === 'ally') { N.st = 'ally'; addLog(`${N.name} change de camp : il défendra ton Cœur à tes côtés.`, 'ev'); }
  else { N.st = 'captive'; N.ransom = 10; S.hype += 5; addLog(`${N.name} croupit dans tes cachots (+5 notoriété) ; sa famille paie une rançon chaque nuit.`, 'ev'); }
}
async function nemMercy() {
  const N = S.foeHero; if (!N || N.st !== 'mercy') return;
  const k = await choiceModal(`${gi('crown')} ${esc(N.name)} est à ta merci`, `Trois fois repoussé·e, ${esc(N.name)} ne fait plus le fier. Que fais-tu de ce héros ?`, [
    ['jail', 'lock', 'Le capturer', 'Aux cachots : +5 notoriété, et sa famille paie 4 or par nuit pendant 10 nuits.'],
    ['spy', 'eye', 'Le corrompre (40 or)', 'Il te renseigne sur chaque bande : +1 énergie au premier tour du combat du Cœur, à chaque invasion.', S.gold < 40],
    ['ally', 'shield', 'Le recruter', 'Il change de camp : il ne t’attaquera plus, et défendra ton Cœur à tes côtés.'],
  ]);
  nemDecide(k); renderAll(); save();
}
// ses effets : la rançon, et l'énergie de l'espion au combat du Cœur (p71)
const dawnNem = dawn;
dawn = function (report) {
  const r = dawnNem(report), N = S.foeHero;
  if (N && N.st === 'captive' && N.ransom > 0) { N.ransom--; S.gold += 4; report.push(['🔒', `La famille de ${N.name} paie sa rançon : +4 or (${N.ransom} nuit${N.ransom > 1 ? 's' : ''} encore).`, 'good']); }
  return r;
};
const heartTokensNem = heartTokens;
heartTokens = function () { return heartTokensNem() + (S.foeHero && S.foeHero.st === 'spy' ? 1 : 0); };
const nemAlly = () => { const N = S.foeHero; return N && N.st === 'ally' ? { id: 'nemally', name: N.name, hp: 10 + 3 * N.lvl, max: 10 + 3 * N.lvl, atk: 2 + Math.floor(N.lvl / 2), merc: true, A: {} } : null; };

WIKI.nemesis = { cat: 'danger', t: 'Le héros némésis', x: () => `<p>Un jour, parmi les aventuriers qui t’attaquent, un héros te prend en grippe. Il a un nom (${S.foeHero ? `<b>${esc(S.foeHero.name)}</b>` : 'tu le sauras bien assez tôt'}) et il revient à <b>chaque invasion</b>, à la place d’un des héros de la bande, avec 35 % de PV en plus.</p>
  <ul><li>Chaque invasion le fait monter d’un niveau (6 au plus), et il <b>désamorce</b> toujours le premier piège de la bande.</li><li>S’il gagne, il te nargue dans la chronique ; si une ruse fait rebrousser chemin à sa bande, il jure de revenir.</li>
  <li>Repoussé trois fois, il est <b>à ta merci</b> : le capturer (notoriété, rançon), le corrompre (+1 énergie au premier tour du combat du Cœur, à chaque invasion) ou le recruter (il change de camp, ne t’attaque plus et défend ton Cœur à tes côtés).</li></ul>` };
