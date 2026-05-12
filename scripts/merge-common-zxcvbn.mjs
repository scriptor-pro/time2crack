import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, "..", "..");
const appPath = path.join(repoRoot, "v2/public/app.js");
const zxcvbnPath = path.join(repoRoot, "zxcvbn.txt");
const outDir = path.join(repoRoot, "data/corpus");
const outPath = path.join(outDir, "common-zxcvbn.txt");

function extractCommonList(source) {
  const match = source.match(/const COMMON = new Set\(\[([\s\S]*?)\n  \]\);/);
  if (!match) {
    throw new Error("Could not find COMMON set in app.js");
  }

  const items = [];
  const re = /"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = re.exec(match[1])) !== null) {
    items.push(JSON.parse(`"${m[1]}"`));
  }
  return items;
}

function mergeUnique(linesA, linesB) {
  const seen = new Set();
  const merged = [];

  for (const line of [...linesA, ...linesB]) {
    const value = line.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    merged.push(value);
  }

  return merged;
}

const appSource = fs.readFileSync(appPath, "utf8");
const common = extractCommonList(appSource);
const zxcvbn = fs
  .readFileSync(zxcvbnPath, "utf8")
  .split(/\r?\n/);

const merged = mergeUnique(common, zxcvbn);

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outPath, merged.join("\n") + "\n", "utf8");

console.log(`Wrote ${outPath}`);
console.log(`COMMON: ${common.length}`);
console.log(`zxcvbn: ${zxcvbn.filter((line) => line.trim()).length}`);
console.log(`merged: ${merged.length}`);
