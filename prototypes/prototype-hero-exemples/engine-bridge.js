import { calcCrackTime, rankToSeconds, initMarkov, initPCFG } from './core/calc.js';

const LANGS = new Set(['fr', 'en', 'es', 'pt', 'de', 'it', 'tr', 'pl', 'nl']);
const pathname = window.location.pathname;
const segments = pathname.split('/').filter(Boolean);
const lang = LANGS.has(segments[0]) ? segments[0] : 'fr';

let dictWords = null;
let modelsReady = false;
let activeProfile = 'experienced';
let renderTimer = null;

const $ = (id) => document.getElementById(id);

function formatSeconds(seconds) {
  if (!isFinite(seconds) || seconds < 0) return '—';
  if (seconds < 1e-6) return '< 1 µs';
  if (seconds < 1e-3) return `${Math.round(seconds * 1e6)} µs`;
  if (seconds < 1) return `${Math.round(seconds * 1000)} ms`;
  if (seconds < 60) return `${seconds.toFixed(seconds < 10 ? 1 : 0)} s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  if (mins < 60) return `${mins} min ${secs} s`;
  const hours = Math.floor(mins / 60);
  const remMins = mins % 60;
  if (hours < 24) return `${hours} h ${remMins} min`;
  const days = Math.floor(hours / 24);
  const remHours = hours % 24;
  return `${days} j ${remHours} h`;
}

function attackLabel(key) {
  return {
    brute: 'Force brute',
    dictionary: 'Dictionnaire',
    hybrid: 'Hybride',
    mask: 'Masque',
    markov: 'Markov',
    pcfg: 'PCFG',
    combinator: 'Combinateur',
  }[key] || key;
}

function profileSpeed(profile) {
  return {
    amateur: 1.5e9,
    experienced: 1.5e10,
    professional: 1.25e11,
    nation_state: 1.25e13,
  }[profile] || 1.5e10;
}

async function loadDictionary() {
  if (dictWords) return dictWords;
  const gzUrl = `./data/wordlists/${lang}.txt.gz`;
  let text = '';
  const resp = await fetch(gzUrl);
  if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
  const buf = await resp.arrayBuffer();
  try {
    const stream = new Response(ReadableStream.from([new Uint8Array(buf)]).pipeThrough(new DecompressionStream('gzip')));
    text = await stream.text();
  } catch {
    const plain = await fetch(`./data/wordlists/${lang}.txt`);
    if (!plain.ok) throw new Error(`Fallback HTTP ${plain.status}`);
    text = await plain.text();
  }
  dictWords = new Set(
    text
      .split('\n')
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line.length >= 3),
  );
  return dictWords;
}

async function loadModels() {
  if (modelsReady) return;
  const suffix = lang === 'en' ? '' : `-${lang}`;
  const [markovResp, pcfgResp] = await Promise.all([
    fetch(`./data/calibration/markov-ngrams${suffix}.json`),
    fetch(`./data/calibration/pcfg-data${suffix}.json`),
  ]);
  if (!markovResp.ok) throw new Error(`Markov HTTP ${markovResp.status}`);
  if (!pcfgResp.ok) throw new Error(`PCFG HTTP ${pcfgResp.status}`);
  initMarkov(await markovResp.json());
  initPCFG(await pcfgResp.json());
  modelsReady = true;
}

function setContext(context) {
  const yes = 'oui';
  const no = 'non';
  const set = (id, value) => {
    const el = $(id);
    if (el) el.textContent = value;
  };
  set('ctx-len', String(context.len));
  set('ctx-cs', String(context.cs));
  set('ctx-dt', context.dt ? yes : no);
  set('ctx-kb', context.kbPat ? yes : no);
  set('ctx-seq', context.seq ? yes : no);
  set('ctx-rep', context.rep ? yes : no);
  set('ctx-dict', context.dictWord ? yes : no);
  set('ctx-hybrid', context.hybridVuln ? yes : no);
  set('ctx-pass', context.looksPassphrase ? yes : no);
}

function setAttackTable(result) {
  const tbody = document.querySelector('#results-table tbody');
  if (!tbody) return;
  const entries = [
    ['brute', 'SHA-256'],
    ['dictionary', 'SHA-256'],
    ['hybrid', 'SHA-256'],
    ['mask', 'SHA-256'],
    ['markov', 'SHA-256'],
    ['pcfg', 'SHA-256'],
    ['combinator', 'SHA-256'],
  ];
  const speed = profileSpeed(activeProfile);
  tbody.innerHTML = entries.map(([attack, algo]) => {
    const rank = result.rank.details[attack]?.rank ?? null;
    const time = rank === null ? '—' : formatSeconds(rankToSeconds(rank, 'sha256', activeProfile));
    const isBest = attack === result.best_attack ? ' class="is-best-attack"' : '';
    return `<tr${isBest}><td>${attackLabel(attack)}</td><td>${algo}</td><td>${time}</td></tr>`;
  }).join('');

  const bestName = $('best-attack-name');
  const bestTime = $('best-attack-time');
  if (bestName) bestName.textContent = attackLabel(result.best_attack);
  if (bestTime) bestTime.textContent = result.best_attack_seconds === null ? '—' : formatSeconds(result.best_attack_seconds);
}

function render(password) {
  const results = $('results');
  const status = $('status');
  if (!results || !status) return;
  if (!password) {
    results.hidden = true;
    status.textContent = 'Entrez un mot de passe pour lancer l’analyse.';
    return;
  }
  try {
    const result = calcCrackTime(password, {
      dictWords,
      profile: activeProfile,
      lang,
    });
    status.textContent = result.best_attack === 'brute' ? 'Mot de passe faible.' : 'Analyse terminée.';
    results.hidden = false;
    setContext(result.context);
    setAttackTable(result);
    const profileName = $('profile-info-name');
    const profileGpus = $('profile-info-gpus');
    const profileDesc = $('profile-info-desc');
    if (profileName) profileName.textContent = activeProfile === 'amateur' ? 'Amateur' : activeProfile === 'experienced' ? 'Standard' : activeProfile === 'professional' ? 'Pro' : 'État';
    if (profileGpus) profileGpus.textContent = activeProfile === 'amateur' ? '1 GPU' : activeProfile === 'experienced' ? '12 GPU' : activeProfile === 'professional' ? '~100 GPU' : '~10k GPU';
    if (profileDesc) profileDesc.textContent = activeProfile === 'amateur' ? 'Attaquant opportuniste.' : activeProfile === 'experienced' ? 'Cluster GPU raisonnable.' : activeProfile === 'professional' ? 'Infrastructure dédiée.' : 'Capacité massive.';
  } catch (err) {
    status.textContent = `Erreur de calcul : ${err.message}`;
    results.hidden = true;
    console.error(err);
  }
}

async function init() {
  const input = $('pw-input');
  if (!input) return;
  try {
    const status = $('status');
    if (status) status.textContent = 'Chargement du moteur…';
    await loadDictionary();
    await loadModels();
    if (status) status.textContent = '';
  } catch (err) {
    const status = $('status');
    if (status) status.textContent = `Moteur indisponible : ${err.message}`;
    console.error(err);
    return;
  }

  const profileBtns = document.querySelectorAll('.profile-btn');
  profileBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      profileBtns.forEach((other) => {
        other.classList.remove('profile-btn--active');
        other.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('profile-btn--active');
      btn.setAttribute('aria-pressed', 'true');
      activeProfile = btn.dataset.profile || 'experienced';
      render(input.value);
    });
  });

  input.addEventListener('input', () => {
    clearTimeout(renderTimer);
    renderTimer = setTimeout(() => render(input.value), 0);
  });

  render(input.value);
}

init().catch((err) => console.error(err));
