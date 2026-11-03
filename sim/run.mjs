// Lance des centaines de parties simulées en parallèle et résume l'équilibrage.
// Usage : node sim/run.mjs [parties par IA = 60] [nuits max = 150]
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';
import { Worker, isMainThread, parentPort, workerData } from 'node:worker_threads';
import { fileURLToPath } from 'node:url';
import { createGame } from './engine.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const BOTS = ['idle', 'negligent', 'casual', 'legende', 'terreur', 'voisinage', 'menagerie', 'secrets'];

if (!isMainThread) {
  const g = createGame(), out = [];
  for (const job of workerData.jobs) out.push(g.run(`simPlay(${JSON.stringify(job.bot)}, ${job.seed}, ${job.max})`));
  parentPort.postMessage(JSON.parse(JSON.stringify(out)));
} else {
  const N = +process.argv[2] || 60, MAX = +process.argv[3] || 150, t0 = Date.now();
  const jobs = []; BOTS.forEach((bot, b) => { for (let i = 0; i < N; i++) jobs.push({ bot, seed: 1000 + i * 7919 + b, max: MAX }); });
  const cores = Math.max(1, Math.min(os.cpus().length - 1, 9)), slices = Array.from({ length: cores }, () => []);
  jobs.forEach((j, i) => slices[i % cores].push(j));
  const results = (await Promise.all(slices.map(s => new Promise((res, rej) => { const w = new Worker(fileURLToPath(import.meta.url), { workerData: { jobs: s } }); w.on('message', res); w.on('error', rej); })))).flat();
  fs.writeFileSync(path.join(HERE, 'results.json'), JSON.stringify(results));
  console.log(`${results.length} parties en ${((Date.now() - t0) / 1000).toFixed(1)} s (${cores} cœurs)`);
}
