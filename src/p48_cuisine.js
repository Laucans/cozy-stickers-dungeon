/* =========================================================
   La cuisine
   Le potager, la mare, le poulailler, la ruche remplissent le
   garde-manger à chaque aube. Dans la fiche d'une Cuisine (ou
   d'une Taverne), on transforme les ingrédients en plats : de
   la bonne humeur, des repas, des défenseurs requinqués, de
   l'énergie pour le combat du Cœur, une Calamité qui recule.
   ========================================================= */
const INGR = { legume: { ico: 'cabbage', name: 'légumes', from: ['choux', 'serre', 'herbes', 'melon'] }, poisson: { ico: 'fish', name: 'poissons', from: ['barque', 'ponton'] }, oeuf: { ico: 'egg', name: 'œufs', from: ['nichoir', 'juchoir'] }, miel: { ico: 'honey', name: 'miel', from: ['ruche'] }, champi: { ico: 'mushroom', name: 'champignons', from: ['champis'] } };
const PANTRY_MAX = 12;
const RECIPES = {
  soupe:   { ico: 'teapot', name: 'Soupe du chaudron', need: { legume: 3 }, desc: 'Tout le château se réchauffe : +1 humeur pour chacun, tout de suite.' },
  tourte:  { ico: 'food', name: 'Tourte aux légumes', need: { legume: 2, oeuf: 1 }, desc: '+6 repas pendant 3 nuits.' },
  poisson: { ico: 'fish', name: 'Poisson grillé', need: { poisson: 2, legume: 1 }, desc: 'À la prochaine invasion, tes défenseurs ont +5 PV.' },
  gateau:  { ico: 'gift', name: 'Gâteau au miel', need: { oeuf: 2, miel: 1 }, desc: 'À la prochaine invasion : +1 énergie au premier tour du combat du Cœur.' },
  ragout:  { ico: 'mushroom', name: 'Ragoût de champignons douteux', need: { champi: 2, legume: 1 }, desc: 'Personne n’ose en reparler : la Calamité recule de 2.' },
  // les savoirs des cuisiniers (voir les métiers)
  brochettes: { ico: 'meat', name: 'Brochettes du troll', rank: 2, need: { poisson: 1, champi: 1, legume: 1 }, desc: 'À la prochaine invasion, tes défenseurs frappent 1 de plus.' },
  banquet:    { ico: 'crown', name: 'Banquet du Maître', rank: 3, need: { legume: 3, oeuf: 2, miel: 1, poisson: 1 }, desc: 'Tout le château est ravi (+2 humeur), +5 notoriété, et la Calamité recule de 1.' },
};
const recipeOK = k => !RECIPES[k].rank || (typeof craftRank === 'function' && craftRank('cuisine') >= RECIPES[k].rank);
const pantry = () => (S.pantry = S.pantry || { legume: 0, poisson: 0, oeuf: 0, miel: 0, champi: 0 });
const canCook = k => recipeOK(k) && Object.entries(RECIPES[k].need).every(([i, n]) => (pantry()[i] || 0) >= n);
const hasKitchen = () => S.rooms.some(r => r.built && (r.t === 'cuisine' || r.t === 'taverne'));
CMD.cook = a => {
  const R = RECIPES[a.id]; if (!R) return 'Recette inconnue'; if (!hasKitchen()) return 'Il faut une Cuisine ou une Taverne'; if (!canCook(a.id)) return 'Il manque des ingrédients';
  Object.entries(R.need).forEach(([i, n]) => { pantry()[i] -= n; });
  const M = (S.meal = S.meal || {});
  if (a.id === 'soupe') S.creatures.forEach(c => { if (!isOut(c)) c.mood = Math.min(5, c.mood + 1); });
  else if (a.id === 'tourte') M.feast = S.night + 3;
  else if (a.id === 'poisson') M.hp = 2;
  else if (a.id === 'gateau') M.tok = 1;
  else if (a.id === 'ragout') S.calamity = Math.max(0, S.calamity - 2);
  else if (a.id === 'brochettes') M.atk = 1;
  else if (a.id === 'banquet') { S.creatures.forEach(c => { if (!isOut(c)) c.mood = Math.min(5, c.mood + 2); }); S.hype += 5; S.calamity = Math.max(0, S.calamity - 1); }
  S.stats.cooked = (S.stats.cooked || 0) + 1; addLog(`Au menu : ${R.name}.`, 'ev'); return null;
};
function bonusFoodMeal() { return S.meal && S.meal.feast && S.night < S.meal.feast ? 6 : 0; }
const heartTokensMeal = heartTokens;
heartTokens = function () { return heartTokensMeal() + (S.meal && S.meal.tok ? 1 : 0); };
const fighterOfMeal = fighterOf;
fighterOf = function (c, bonus = 0) { const f = fighterOfMeal(c, bonus); if (S.meal && S.meal.hp) { f.hp += S.meal.hp; f.max += S.meal.hp; } if (S.meal && S.meal.atk) f.atk += S.meal.atk; return f; };
const applyInvasionMeal = applyInvasion;
applyInvasion = function (plan, outcome) { const l = applyInvasionMeal(plan, outcome); if (!plan.foe && S.meal) { S.meal.hp = 0; S.meal.tok = 0; S.meal.atk = 0; } return l; };
// l'aube : le garde-manger se remplit
const dawnCook = dawn;
dawn = function (report) {
  const r = dawnCook(report), P = pantry(); const got = [];
  Object.entries(INGR).forEach(([k, I]) => { const n = I.from.reduce((a, f) => a + (typeof countItem === 'function' ? countItem(f) : 0), 0); if (!n) return; const add = Math.min(n, PANTRY_MAX - P[k]); if (add > 0) { P[k] += add; got.push(`${add} ${I.name}`); } });
  if (got.length && hasKitchen()) report.push(['🧺', `Le garde-manger se remplit : ${got.join(', ')}.`, '']);
  return r;
};
function cookModal() {
  const P = pantry(), m = openModal(`<h2>${gi('food')} La cuisine</h2><p class="hint">Le garde-manger se remplit à chaque aube avec ce que produisent le potager, la mare, le poulailler et la ruche (${PANTRY_MAX} de chaque au plus).</p>
    <div class="pantry">${Object.entries(INGR).map(([k, I]) => `<span class="tag2">${gi(I.ico)} ${P[k] || 0} ${I.name}</span>`).join('')}</div>
    <div class="addlist">${Object.entries(RECIPES).map(([k, R]) => { const ok = canCook(k); return `<div class="addrow${ok ? '' : ' off'}"><div class="arhead">${gi(R.ico)}<b>${esc(R.name)}</b><span class="arcost">${Object.entries(R.need).map(([i, n]) => `${n} ${INGR[i].name}`).join(' + ')}</span></div><p class="ardesc">${esc(R.desc)}</p>${recipeOK(k) ? '' : `<p class="arwhy">${gi('lock')} Il faut un·e ${R.rank === 3 ? 'maître·sse' : 'compagnon·ne'} cuisinier·ère (les métiers).</p>`}<button type="button" class="sbtn ${ok ? 'pri' : ''}" data-cook="${k}" ${ok ? '' : 'disabled'}>${gi('food')} Cuisiner</button></div>`; }).join('')}</div>`, { label: 'Cuisine' });
  m.addEventListener('click', e => { const b = e.target.closest('[data-cook]'); if (!b || b.disabled) return; if (run('cook', { id: b.dataset.cook })) { sfx('heal'); toast(`🍲 ${RECIPES[b.dataset.cook].name} : ${RECIPES[b.dataset.cook].desc}`); afterChange(); cookModal(); } });
}
const openRoomCook = openRoom;
openRoom = function (id) {
  openRoomCook(id);
  const r = S.rooms.find(x => x.id === id), m = document.querySelector('#modalRoot .modal'); if (!r || !m || !r.built || (r.t !== 'cuisine' && r.t !== 'taverne')) return;
  const box = el('div', 'btnrow', `<button type="button" class="sbtn pri" data-cookopen="1">${gi('food')} Cuisiner (garde-manger : ${Object.values(pantry()).reduce((a, b) => a + b, 0)})</button>`), head = m.querySelector('.mbody .cardhead');
  (head ? head.after(box) : m.querySelector('.mbody').prepend(box));
  box.addEventListener('click', e => { if (e.target.closest('[data-cookopen]')) cookModal(); });
};
WIKI.cuisine = { cat: 'eco', t: 'La cuisine', x: () => `<p>À chaque aube, le <b>garde-manger</b> se remplit avec ce que produit le château : ${Object.values(INGR).map(I => `${I.name} (${I.from.filter(f => FURN[f]).map(f => `{furn:${f}}`).join(', ')})`).join(' ; ')}.</p><p>Dans la fiche d’une {room:cuisine} ou d’une {room:taverne}, le bouton <b>Cuisiner</b> transforme les ingrédients en plats :</p><ul>${Object.values(RECIPES).map(R => `<li><b>${esc(R.name)}</b> (${Object.entries(R.need).map(([i, n]) => `${n} ${INGR[i].name}`).join(' + ')}) : ${esc(R.desc)}</li>`).join('')}</ul>` };
