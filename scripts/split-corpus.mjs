// scripts/split-corpus.mjs
// Coupe un corpus « compte mot_de_passe » (format rockyou-withcount de SecLists)
// en deux moitiés indépendantes : entraînement et test.
//
// Chaque compte (utilisateur) est tiré au sort : un mot de passe vu c fois donne
// Binomiale(c, 0,5) occurrences à l'entraînement, le reste au test. Les modèles
// s'entraînent sur une moitié et le banc (scripts/bench-engine.mjs) les mesure sur
// l'autre : jamais sur les mêmes comptes.
//
// Usage : node scripts/split-corpus.mjs <corpus.txt> <dossier_sortie> [graine]
// Sortie : train.tsv et test.tsv (« compte<TAB>mot_de_passe », triés par compte décroissant).

import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

const [input, outDir, seedArg = '20261023'] = process.argv.slice(2);
if (!input || !outDir) {
  console.error('Usage : node scripts/split-corpus.mjs <corpus.txt> <dossier_sortie> [graine]');
  process.exit(1);
}

// Générateur pseudo-aléatoire reproductible (mulberry32).
let state = Number(seedArg) >>> 0;
function random() {
  state = (state + 0x6d2b79f5) >>> 0;
  let t = state;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// Binomiale(n, 0,5) : tirage exact jusqu'à 1 000, approximation normale au-delà.
function binomialHalf(n) {
  if (n <= 1000) {
    let k = 0;
    for (let i = 0; i < n; i++) if (random() < 0.5) k++;
    return k;
  }
  const u = 1 - random();
  const v = random();
  const z = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  return Math.max(0, Math.min(n, Math.round(n / 2 + z * Math.sqrt(n) / 2)));
}

const train = [];
const test = [];
let skipped = 0;

const rl = readline.createInterface({ input: fs.createReadStream(input, 'utf8'), crlfDelay: Infinity });
for await (const line of rl) {
  const m = line.match(/^\s*(\d+) (.+)$/);
  // Lignes vides, mal formées ou mal encodées (octets Latin-1 isolés dans rockyou).
  if (!m || m[2].includes('�') || m[2].includes('\t')) { skipped++; continue; }
  const count = Number(m[1]);
  const k = binomialHalf(count);
  if (k > 0) train.push([k, m[2]]);
  if (count - k > 0) test.push([count - k, m[2]]);
}

fs.mkdirSync(outDir, { recursive: true });
for (const [name, rows] of [['train', train], ['test', test]]) {
  rows.sort((a, b) => b[0] - a[0]);
  const out = fs.createWriteStream(path.join(outDir, `${name}.tsv`));
  for (const [c, pw] of rows) out.write(`${c}\t${pw}\n`);
  await new Promise((resolve) => out.end(resolve));
  console.log(`${name}: ${rows.length} mots de passe distincts`);
}
console.log(`lignes ignorées : ${skipped}`);
