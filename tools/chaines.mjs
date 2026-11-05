// La carte des chaînes d'enveloppes : le jeu redéfinit souvent une fonction globale
// (`const openRoomBase = openRoom; openRoom = function (id) { openRoomBase(id); … }`).
// Une analyse statique ne voit que la dernière définition : ce script liste, pour chaque
// fonction enveloppée, où elle naît et, dans l'ordre d'exécution du build, chaque fichier
// qui la redéfinit. Usage : node tools/chaines.mjs > tools/CHAINES.md (lancé par build.sh).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const parts = (fs.readFileSync(path.join(root, 'build.sh'), 'utf8').match(/^PARTS="([^"]+)"/m) || [])[1].split(/\s+/).filter(f => f.endsWith('.js'));
const born = {}, chains = {};
const esc = s => s.replace(/[.$]/g, '\\$&');
for (const f of parts) {
  const L = fs.readFileSync(path.join(root, f), 'utf8').split('\n'), name = path.basename(f);
  L.forEach((l, i) => {
    const d = l.match(/^(?:async\s+)?function\s+(\w+)\s*\(/); if (d && !born[d[1]]) born[d[1]] = `${name}:${i + 1}`;
    const w = l.match(/^\s*const\s+(\w+)\s*=\s*([A-Za-z_$][\w$]*(?:\.[\w$]+)*)\s*;/); if (!w || w[1] === w[2]) return;
    const tgt = w[2], re = new RegExp(`(^|[\\s;{])${esc(tgt)}\\s*=\\s*(async\\s+)?(function\\b|\\(|[\\w$]+\\s*=>)`);
    for (let j = i; j < Math.min(L.length, i + 400); j++) if (re.test(L[j].replace(/^\s*const\s+\w+\s*=\s*[\w.$]+\s*;/, ''))) { (chains[tgt] = chains[tgt] || []).push(`${name}:${j + 1}`); break; }
  });
}
const rows = Object.entries(chains).sort((a, b) => b[1].length - a[1].length || a[0].localeCompare(b[0]));
const out = ['# Chaînes d’enveloppes (généré par `node tools/chaines.mjs`, ne pas modifier à la main)', '',
  `${rows.length} fonctions sont redéfinies par enveloppe. Ordre = ordre du build (\`PARTS\` de build.sh) : la **dernière** ligne est la version appelée en jeu, chacune appelle la précédente.`, '',
  '| Fonction | Naît dans | Enveloppes, dans l’ordre | n |', '|---|---|---|---|',
  ...rows.map(([k, v]) => `| \`${k}\` | ${born[k] || (k.includes('.') ? 'objet' : '?')} | ${v.join(' → ')} | ${v.length} |`)];
console.log(out.join('\n'));
