// Charge le vrai code du jeu (src/) dans une machine virtuelle Node, avec un faux navigateur.
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
// CSD_SRC=sim/src_v10 pour mesurer une version figée du jeu pendant qu'on modifie src/
const SRC = process.env.CSD_SRC ? path.resolve(process.env.CSD_SRC) : path.join(ROOT, 'src');
const FALLBACK = ['p3_data', 'p4_engine', 'p5_tex', 'p6_art', 'p7_chars', 'p8_render', 'p9_scene', 'p10_ui', 'p11_night', 'p12_admin', 'p13_admin_sprites', 'p14_admin_tools',
  'p16_grimoire', 'p17_tutorial', 'p18_souls', 'p19_net', 'p20_val', 'p21_coop', 'p22_world', 'p23_map', 'p24_town', 'p25_victory'];
// même liste que build.sh (sans p15_start, qui démarre l'interface) ; une partie absente de CSD_SRC est ignorée
const PARTS = (() => { try { const m = fs.readFileSync(path.join(ROOT, 'build.sh'), 'utf8').match(/PARTS="([^"]+)"/); if (m) return m[1].trim().split(/\s+/).map(f => path.basename(f, '.js')); } catch (e) {} return FALLBACK; })()
  .filter(p => p !== 'p15_start' && fs.existsSync(path.join(SRC, p + '.js')));

// un objet « n'importe quoi » : toute propriété, tout appel renvoie lui-même (pour le DOM et le canvas)
function makeStub() {
  const handler = {
    get(t, k) {
      if (k === Symbol.toPrimitive) return () => 0;
      if (k === Symbol.iterator) return function* () {};
      if (k === 'then') return undefined;
      if (k === 'length' || k === 'width' || k === 'height' || k === 'clientWidth' || k === 'clientHeight') return 0;
      return stub;
    },
    apply() { return stub; }, construct() { return stub; }, set() { return true; },
  };
  const stub = new Proxy(function () {}, handler);
  return stub;
}

export function createGame() {
  const stub = makeStub(), store = new Map();
  const storage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: k => store.delete(k), key: () => null, get length() { return store.size; } };
  const ctx = {
    console, document: stub, navigator: { userAgent: 'node-sim', clipboard: stub }, location: { search: '', hash: '', hostname: 'localhost', href: 'http://localhost/', pathname: '/' },
    history: stub, localStorage: storage, sessionStorage: storage, performance: { now: () => Date.now() }, requestAnimationFrame: () => 0, cancelAnimationFrame: () => {},
    setTimeout: () => 0, clearTimeout: () => {}, setInterval: () => 0, clearInterval: () => {}, addEventListener: () => {}, removeEventListener: () => {},
    devicePixelRatio: 1, innerWidth: 1280, innerHeight: 800, isSecureContext: false, Image: function () { return stub; }, ResizeObserver: function () { return { observe() {} }; },
    MutationObserver: function () { return { observe() {}, disconnect() {} }; }, DOMParser: function () { return { parseFromString: () => ({ body: { textContent: '' } }) }; },
    getComputedStyle: () => stub, fetch: () => Promise.reject(new Error('hors ligne')), crypto: globalThis.crypto, structuredClone, queueMicrotask, TextEncoder, TextDecoder, URL, URLSearchParams, Blob: function () { return stub; },
  };
  ctx.window = ctx; ctx.self = ctx; ctx.globalThis = ctx;
  vm.createContext(ctx);
  let code = PARTS.map(p => fs.readFileSync(path.join(SRC, p + '.js'), 'utf8')).join('\n;\n');
  code += '\n;\n' + fs.readFileSync(path.join(HERE, 'sim_core.js'), 'utf8') + '\n;\n' + fs.readFileSync(path.join(HERE, 'bots.js'), 'utf8');
  vm.runInContext(code, ctx, { filename: 'jeu.js' });
  return { ctx, run: expr => vm.runInContext(expr, ctx) };
}
