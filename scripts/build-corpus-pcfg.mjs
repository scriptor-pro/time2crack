import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const siteRoot = path.resolve(scriptDir, "..");
const inputPath = path.join(siteRoot, "data/corpus/common-zxcvbn.txt");
const outputPath = path.join(siteRoot, "data/corpus/common-zxcvbn-pcfg.json");

function pcfgCharClass(ch) {
  if (/\p{L}/u.test(ch)) return "L";
  if (/\p{N}/u.test(ch)) return "D";
  return "S";
}

function pcfgLengthBucket(n) {
  return n >= 12 ? "12+" : String(n);
}

function tokenize(password) {
  const chars = [...password.normalize("NFC")];
  if (!chars.length) return [];

  const segments = [];
  let currentClass = pcfgCharClass(chars[0]);
  let len = 1;

  for (let i = 1; i < chars.length; i++) {
    const cls = pcfgCharClass(chars[i]);
    if (cls === currentClass) {
      len++;
      continue;
    }

    segments.push({ cls: currentClass, len });
    currentClass = cls;
    len = 1;
  }

  segments.push({ cls: currentClass, len });
  return segments;
}

function inc(map, key) {
  map.set(key, (map.get(key) || 0) + 1);
}

function mapToObject(map) {
  return Object.fromEntries([...map.entries()].sort(([a], [b]) => a.localeCompare(b, "en", { numeric: true })));
}

const text = fs.readFileSync(inputPath, "utf8");
const passwords = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const skeletons = new Map();
const shapes = new Map();
const segments = {
  L: new Map(),
  D: new Map(),
  S: new Map(),
};

for (const password of passwords) {
  const tokens = tokenize(password);
  if (!tokens.length) continue;

  const skeletonKey = tokens.map((t) => `${t.cls}${pcfgLengthBucket(t.len)}`).join("");
  const shapeKey = tokens.map((t) => t.cls).join("");

  inc(skeletons, skeletonKey);
  inc(shapes, shapeKey);

  for (const token of tokens) {
    inc(segments[token.cls], pcfgLengthBucket(token.len));
  }
}

const payload = {
  version: 1,
  source: "common-zxcvbn.txt",
  total_passwords: passwords.length,
  skeleton_total: passwords.length,
  threshold: 1,
  skeletons: mapToObject(skeletons),
  shapes: mapToObject(shapes),
  segments: {
    L: mapToObject(segments.L),
    D: mapToObject(segments.D),
    S: mapToObject(segments.S),
  },
};

fs.writeFileSync(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
console.log(`Wrote ${outputPath}`);
