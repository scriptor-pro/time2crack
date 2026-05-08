(function () {
  const input = document.getElementById("password-input");
  const resetBtn = document.getElementById("reset-btn");

  const heroTime = document.getElementById("hero-time");
  const heroNote = document.getElementById("hero-note");
  const matrixBody = document.getElementById("matrix-body");

  const algoCells = {
    md5: document.getElementById("t-md5"),
    sha1: document.getElementById("t-sha1"),
    sha256: document.getElementById("t-sha256"),
    ntlm: document.getElementById("t-ntlm"),
    bcrypt: document.getElementById("t-bcrypt"),
    argon2: document.getElementById("t-argon2"),
  };

  const ALGOS = [
    { key: "md5", name: "MD5", rate: 168.9e9 * 12, salted: false },
    { key: "sha1", name: "SHA-1", rate: 50.86e9 * 12, salted: false },
    { key: "sha256", name: "SHA-256", rate: 22.68e9 * 12, salted: false },
    { key: "ntlm", name: "NTLM", rate: 288.5e9 * 12, salted: false },
    { key: "bcrypt", name: "bcrypt", rate: 184000 * 12, salted: true },
    { key: "argon2", name: "Argon2id", rate: 800, salted: true },
  ];

  const ATTACK_INFO = {
    brute: {
      title: "Brute force",
      text: "Teste systematiquement toutes les combinaisons. La longueur et la diversite font exploser le cout.",
      source: "https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/wheeler",
    },
    dict: {
      title: "Dictionnaire",
      text: "Teste de grandes listes de mots connus/fuites. Tres efficace contre des mots habituels.",
      source: "https://haveibeenpwned.com/",
    },
    hybrid: {
      title: "Hybride",
      text: "Ajoute des mutations frequentes aux mots du dictionnaire (majuscules, chiffres, substitutions).",
      source: "https://gist.github.com/Chick3nman/32e662a5bb63bc4f51b847bb422222fd",
    },
    mask: {
      title: "Mask",
      text: "Cible les structures previsibles (Mot+Annee, Majuscule+digits, etc.).",
      source: "https://www.usenix.org/conference/usenixsecurity16/technical-sessions/presentation/wheeler",
    },
    markov: {
      title: "Markov",
      text: "Priorise les sequences statistiquement probables observees dans les fuites reelles.",
      source: "https://arxiv.org/abs/2010.12269",
    },
    pcfg: {
      title: "PCFG",
      text: "Explore d'abord les structures grammaticales de mots de passe les plus frequentes.",
      source: "https://arxiv.org/abs/2010.12269",
    },
  };

  const ATTACK_ORDER = [
    { key: "brute", label: "Brute force" },
    { key: "dict", label: "Dictionnaire" },
    { key: "hybrid", label: "Hybride" },
    { key: "mask", label: "Mask" },
    { key: "rainbow", label: "Rainbow table" },
    { key: "cred", label: "Credential stuffing" },
    { key: "spray", label: "Password spraying" },
    { key: "markov", label: "Markov" },
    { key: "pcfg", label: "PCFG" },
    { key: "combi", label: "Combinator" },
  ];

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "n/a";
    if (seconds < 1e-6) return "quasi instantane";
    if (seconds < 1) return "< 1 s";
    if (seconds < 60) return `${Math.round(seconds)} s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} h`;
    if (seconds < 31557600) return `${Math.round(seconds / 86400)} j`;
    if (seconds < 3155760000) return `${(seconds / 31557600).toFixed(1)} ans`;
    return `${seconds.toExponential(2)} s`;
  }

  function analyzePassword(pw) {
    const lower = /[a-z]/.test(pw);
    const upper = /[A-Z]/.test(pw);
    const digit = /\d/.test(pw);
    const symbol = /[^a-zA-Z0-9]/.test(pw);
    const len = pw.length;
    const charset = (lower ? 26 : 0) + (upper ? 26 : 0) + (digit ? 10 : 0) + (symbol ? 33 : 0);
    const combos = len ? Math.pow(Math.max(charset, 2), len) : 0;

    const common = /^(password|123456|123456789|qwerty|azerty|admin|welcome|letmein|iloveyou)$/i.test(pw);
    const dictLike = /[a-z]{4,}/i.test(pw);
    const structure = /^[A-Z]?[a-z]{3,}\d{1,4}[!@#$%^&*]?$/.test(pw);
    const kbPat = /(qwerty|azerty|asdf|zxcv|12345)/i.test(pw);
    const seq = /(0123|1234|2345|abcd|bcde|cdef|fedc|4321)/i.test(pw);
    const repeat = /(.)\1{2,}/.test(pw);
    const date = /(?:19|20)\d{2}|\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}/.test(pw);
    const passphrase = /[a-z]{4,}.+[a-z]{4,}/i.test(pw);

    return {
      len,
      charset,
      combos,
      common,
      dictLike,
      structure,
      kbPat,
      seq,
      repeat,
      date,
      passphrase,
    };
  }

  function attemptsByAttack(info, algo) {
    const dictBase = 14e9;
    const maskBase = 1e8;
    const markovBase = Math.max(1e7, info.combos * 0.01);
    const pcfgBase = Math.max(5e7, info.combos * 0.05);

    return {
      brute: info.combos,
      dict: info.common ? 1000 : dictBase,
      hybrid: info.dictLike ? dictBase * 1000 : Number.POSITIVE_INFINITY,
      mask: info.structure || info.kbPat || info.seq || info.date ? maskBase : Number.POSITIVE_INFINITY,
      rainbow: !algo.salted && info.common ? 1 : Number.POSITIVE_INFINITY,
      cred: info.common ? 100 : Number.POSITIVE_INFINITY,
      spray: info.common ? 1000 : Number.POSITIVE_INFINITY,
      markov: info.seq || info.repeat || info.structure ? markovBase : Number.POSITIVE_INFINITY,
      pcfg: info.structure ? pcfgBase : Number.POSITIVE_INFINITY,
      combi: info.passphrase ? 5e10 : Number.POSITIVE_INFINITY,
    };
  }

  function computeMatrix(pw) {
    const info = analyzePassword(pw);
    const rows = ATTACK_ORDER.map((attack) => {
      const row = { key: attack.key, label: attack.label, byAlgo: {} };
      for (const algo of ALGOS) {
        const attempts = attemptsByAttack(info, algo)[attack.key];
        const seconds = attempts / algo.rate;
        row.byAlgo[algo.key] = seconds;
      }
      return row;
    });

    const bestByAlgo = {};
    for (const algo of ALGOS) {
      let best = { seconds: Number.POSITIVE_INFINITY, attack: "-" };
      for (const row of rows) {
        const sec = row.byAlgo[algo.key];
        if (sec < best.seconds) best = { seconds: sec, attack: row.label };
      }
      bestByAlgo[algo.key] = best;
    }

    let globalBest = { seconds: Number.POSITIVE_INFINITY, attack: "-", algo: "-" };
    for (const algo of ALGOS) {
      const best = bestByAlgo[algo.key];
      if (best.seconds < globalBest.seconds) {
        globalBest = { seconds: best.seconds, attack: best.attack, algo: algo.name };
      }
    }

    return { rows, bestByAlgo, globalBest };
  }

  function renderMatrix(rows) {
    while (matrixBody.firstChild) matrixBody.removeChild(matrixBody.firstChild);

    for (const row of rows) {
      const tr = document.createElement("tr");
      const attackCell = document.createElement("td");
      attackCell.textContent = row.label;
      tr.appendChild(attackCell);

      for (const algo of ALGOS) {
        const td = document.createElement("td");
        td.textContent = formatTime(row.byAlgo[algo.key]);
        tr.appendChild(td);
      }
      matrixBody.appendChild(tr);
    }
  }

  function render(pw) {
    const effectivePw = pw && pw.length ? pw : "DemoPassphrase2026!";

    const model = computeMatrix(effectivePw);
    heroTime.textContent = formatTime(model.globalBest.seconds);
    heroNote.textContent = `Dominant: ${model.globalBest.attack} sur ${model.globalBest.algo}.`;

    for (const algo of ALGOS) {
      const best = model.bestByAlgo[algo.key];
      algoCells[algo.key].textContent = `${formatTime(best.seconds)} (${best.attack})`;
    }

    renderMatrix(model.rows);
  }

  function bindAttackChips() {
    const chips = Array.from(document.querySelectorAll(".attack-chip"));
    const title = document.getElementById("attack-title");
    const text = document.getElementById("attack-text");
    const sourceLink = document.getElementById("attack-source-link");

    chips.forEach((chip) => {
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.setAttribute("aria-selected", "false"));
        chip.setAttribute("aria-selected", "true");

        const info = ATTACK_INFO[chip.dataset.key];
        if (!info) return;

        title.textContent = info.title;
        text.textContent = info.text;
        sourceLink.href = info.source;
      });
    });
  }

  resetBtn.addEventListener("click", () => {
    input.value = "";
    render("");
    input.focus();
  });

  input.addEventListener("input", () => render(input.value));

  bindAttackChips();
  render("");
})();
