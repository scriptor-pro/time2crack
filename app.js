// Time2Crack — homepage application (ES module).
// Source of app.min.js: edit this file, then run scripts/build-app.sh.
// Reconstructed on 2026-10-16 from the minified build (no readable source had been committed);
// local variable names are still the minifier's single letters.

import { calcCrackTime, ALGORITHMS, initMarkov, initPCFG } from "./core/calc.js";
import { rankToSeconds } from "./core/time.js";
import { AppConfig } from "./config.js";
import { cacheGet, cachePut } from "./core/idb-cache.js";
const isLangPage = /\/(fr|en|es|pt|de|it|tr|pl|nl)\//.test(window.location.pathname),
  basePath = isLangPage ? "../" : "./",
  LANG_NAMES = {
    fr: "Français",
    en: "English",
    es: "Español",
    pt: "Português",
    de: "Deutsch",
    it: "Italiano",
    tr: "Türkçe",
    pl: "Polski",
    nl: "Nederlands",
  },
  I = {
    fr: {
      dictDownloading: "Téléchargement du dictionnaire…",
      dictProcessing: "Traitement des mots…",
      dictLoaded: (e) => `✅ ${e} mots chargés`,
      dictError: (e) => `❌ Erreur: ${e}`,
      dictLoading: "Chargement du dictionnaire…",
      dictReady: (e) => `Prêt — dictionnaire ${e} mots chargé.`,
      initError: (e) => `Erreur critique : ${e}`,
      initErrorBottom: (e) => `Erreur d'initialisation : ${e}`,
      hibpChecking: "Vérification HIBP…",
      hibpFound: (e) => `⚠ Fuite détectée : ${e} fois`,
      hibpNotFound: "✓ Non trouvé dans HIBP",
      hibpUnavailable: "HIBP actuellement indisponible",
      tooltipSeeExplanations: "Voir explications",
      yes: "oui",
      no: "non",
      yesDate: (e) => `oui (${e})`,
      overUniverse: "> univers",
      underMs: "< 1 ms",
      bcryptCost: "coût",
      dateTokens: { D: "J", M: "M", Y: "A", month: "mois" },
      day: ["jour", "jours"],
      month: ["mois", "mois"],
      year: ["an", "ans"],
      century: ["siècle", "siècles"],
      millennium: ["millénaire", "millénaires"],
      profiles: {
        amateur: { name: "Amateur", desc: "Hacker hobbyiste, 1 GPU" },
        experienced: { name: "Standard", desc: "Attaquant compétent, 12 GPUs (industrie)" },
        professional: { name: "Pro", desc: "Infrastructure cloud, ~100 GPUs" },
        nation_state: { name: "État", desc: "Attaquant national, ~10k GPUs" },
      },
      bestAttackLabel: "⚡ Attaque la plus rapide",
      attacks: {
        brute: "Force brute",
        dictionary: "Dictionnaire",
        hybrid: "Hybride (dict + règles)",
        pcfg: "PCFG",
        markov: "Markov",
        mask: "Masque",
        combinator: "Combinator (passphrase)",
        date: "Date",
      },
      notInDict: "Non détecté comme mot courant",
      noBaseWord: "Mot de base absent du dictionnaire",
      noMutation: "Aucune mutation détectée",
      wordTooShort: "Mot trop court ou aucune mutation",
      notPassphrase: "Pas une passphrase multi-mots",
      lessThanTwoWords: "Moins de 2 mots détectés",
      noMaskPattern: "Pattern positionnel non reconnu",
      skeletonOOD: (e) => `Structure "${e}" hors-distribution`,
      pcfgNotLoaded: "Modèle non chargé ou structure rare",
      markovNotLoaded: "Modèle non chargé ou séquence improbable",
      notApplicable: "Non applicable",
      locale: "fr-FR",
    },
    en: {
      dictDownloading: "Downloading dictionary…",
      dictProcessing: "Processing words…",
      dictLoaded: (e) => `✅ ${e} words loaded`,
      dictError: (e) => `❌ Error: ${e}`,
      dictLoading: "Loading dictionary…",
      dictReady: (e) => `Ready — ${e} word dictionary loaded.`,
      initError: (e) => `Critical error: ${e}`,
      initErrorBottom: (e) => `Initialization error: ${e}`,
      hibpChecking: "Checking HIBP…",
      hibpFound: (e) => `⚠ Breach detected: ${e} times`,
      hibpNotFound: "✓ Not found in HIBP",
      hibpUnavailable: "HIBP currently unavailable",
      tooltipSeeExplanations: "See explanations",
      yes: "yes",
      no: "no",
      yesDate: (e) => `yes (${e})`,
      overUniverse: "> universe",
      underMs: "< 1 ms",
      bcryptCost: "cost",
      dateTokens: { D: "D", M: "M", Y: "Y", month: "month" },
      day: ["day", "days"],
      month: ["month", "months"],
      year: ["year", "years"],
      century: ["century", "centuries"],
      millennium: ["millennium", "millennia"],
      profiles: {
        amateur: { name: "Amateur", desc: "Hobbyist hacker, 1 GPU" },
        experienced: { name: "Standard", desc: "Skilled attacker, 12 GPUs (industry)" },
        professional: { name: "Pro", desc: "Cloud infrastructure, ~100 GPUs" },
        nation_state: { name: "Nation-state", desc: "State actor, ~10k GPUs" },
      },
      bestAttackLabel: "⚡ Fastest attack",
      attacks: {
        brute: "Brute force",
        dictionary: "Dictionary",
        hybrid: "Hybrid (dict + rules)",
        pcfg: "PCFG",
        markov: "Markov",
        mask: "Mask",
        combinator: "Combinator (passphrase)",
        date: "Date",
      },
      notInDict: "Not detected as common word",
      noBaseWord: "Base word not in dictionary",
      noMutation: "No mutation detected",
      wordTooShort: "Word too short or no mutation",
      notPassphrase: "Not a multi-word passphrase",
      lessThanTwoWords: "Fewer than 2 words detected",
      noMaskPattern: "No positional pattern recognized",
      skeletonOOD: (e) => `Structure "${e}" out of distribution`,
      pcfgNotLoaded: "Model not loaded or rare structure",
      markovNotLoaded: "Model not loaded or improbable sequence",
      notApplicable: "Not applicable",
      locale: "en-US",
    },
    nl: {
      dictDownloading: "Woordenboek downloaden…",
      dictProcessing: "Woorden verwerken…",
      dictLoaded: (e) => `✅ ${e} woorden geladen`,
      dictError: (e) => `❌ Fout: ${e}`,
      dictLoading: "Woordenboek laden…",
      dictReady: (e) => `Gereed — woordenboek met ${e} woorden geladen.`,
      initError: (e) => `Kritieke fout: ${e}`,
      initErrorBottom: (e) => `Initialisatiefout: ${e}`,
      hibpChecking: "HIBP controleren…",
      hibpFound: (e) => `⚠ Lek gedetecteerd: ${e} keer`,
      hibpNotFound: "✓ Niet gevonden in HIBP",
      hibpUnavailable: "HIBP momenteel niet beschikbaar",
      tooltipSeeExplanations: "Zie uitleggen",
      yes: "ja",
      no: "nee",
      yesDate: (e) => `ja (${e})`,
      overUniverse: "> universum",
      underMs: "< 1 ms",
      bcryptCost: "kosten",
      dateTokens: { D: "D", M: "M", Y: "J", month: "maand" },
      day: ["dag", "dagen"],
      month: ["maand", "maanden"],
      year: ["jaar", "jaren"],
      century: ["eeuw", "eeuwen"],
      millennium: ["millennium", "millennia"],
      profiles: {
        amateur: { name: "Amateur", desc: "Amateurhacker, 1 GPU" },
        experienced: { name: "Standard", desc: "Bekwame aanvaller, 12 GPUs (industrie)" },
        professional: { name: "Pro", desc: "Cloud-infrastructuur, ~100 GPUs" },
        nation_state: { name: "Staat", desc: "Statelijke aanvaller, ~10k GPUs" },
      },
      bestAttackLabel: "⚡ Snelste aanval",
      attacks: {
        brute: "Brute force",
        dictionary: "Woordenboek",
        hybrid: "Hybride (woordenboek + regels)",
        pcfg: "PCFG",
        markov: "Markov",
        mask: "Masker",
        combinator: "Combinator (wachtwoordzin)",
        date: "Datum",
      },
      notInDict: "Niet gedetecteerd als veelgebruikt woord",
      noBaseWord: "Basiswoord niet in woordenboek",
      noMutation: "Geen mutatie gedetecteerd",
      wordTooShort: "Woord te kort of geen mutatie",
      notPassphrase: "Geen wachtwoordzin met meerdere woorden",
      lessThanTwoWords: "Minder dan 2 woorden gedetecteerd",
      noMaskPattern: "Geen positiepatroon herkend",
      skeletonOOD: (e) => `Structuur "${e}" buiten verdeling`,
      pcfgNotLoaded: "Model niet geladen of zeldzame structuur",
      markovNotLoaded: "Model niet geladen of onwaarschijnlijke reeks",
      notApplicable: "Niet van toepassing",
      locale: "nl-NL",
    },
    pl: {
      dictDownloading: "Pobieranie słownika…",
      dictProcessing: "Przetwarzanie słów…",
      dictLoaded: (e) => `✅ ${e} słów załadowanych`,
      dictError: (e) => `❌ Błąd: ${e}`,
      dictLoading: "Wczytywanie słownika…",
      dictReady: (e) => `Gotowo — słownik z ${e} słowami załadowany.`,
      initError: (e) => `Błąd krytyczny: ${e}`,
      initErrorBottom: (e) => `Błąd inicjalizacji: ${e}`,
      hibpChecking: "Sprawdzanie HIBP…",
      hibpFound: (e) => `⚠ Wyciek wykryty: ${e} razy`,
      hibpNotFound: "✓ Nie znaleziono w HIBP",
      hibpUnavailable: "HIBP jest niedostępne",
      tooltipSeeExplanations: "Pokaż wyjaśnienia",
      yes: "tak",
      no: "nie",
      yesDate: (e) => `tak (${e})`,
      overUniverse: "> wszechświat",
      underMs: "< 1 ms",
      bcryptCost: "koszt",
      dateTokens: { D: "D", M: "M", Y: "R", month: "miesiąc" },
      day: { one: "dzień", few: "dni", many: "dni", other: "dnia" },
      month: { one: "miesiąc", few: "miesiące", many: "miesięcy", other: "miesiąca" },
      year: { one: "rok", few: "lata", many: "lat", other: "roku" },
      century: { one: "wiek", few: "wieki", many: "wieków", other: "wieku" },
      millennium: { one: "tysiąclecie", few: "tysiąclecia", many: "tysiącleci", other: "tysiąclecia" },
      profiles: {
        amateur: { name: "Amateur", desc: "Haker hobbystyczny, 1 GPU" },
        experienced: { name: "Standard", desc: "Doświadczony atakujący, 12 GPUs (przemysł)" },
        professional: { name: "Pro", desc: "Infrastruktura chmurowa, ~100 GPUs" },
        nation_state: { name: "Państwo", desc: "Aktor państwowy, ~10k GPUs" },
      },
      bestAttackLabel: "⚡ Najszybszy atak",
      attacks: {
        brute: "Brute force",
        dictionary: "Słownik",
        hybrid: "Hybrydowy (słownik + reguły)",
        pcfg: "PCFG",
        markov: "Markov",
        mask: "Maska",
        combinator: "Combinator (hasło wielowyrazowe)",
        date: "Data",
      },
      notInDict: "Nie wykryto jako słowo popularne",
      noBaseWord: "Słowo bazowe nie w słowniku",
      noMutation: "Brak mutacji",
      wordTooShort: "Słowo zbyt krótkie lub brak mutacji",
      notPassphrase: "Nie jest hasłem wielowyrazowym",
      lessThanTwoWords: "Mniej niż 2 słowa wykryte",
      noMaskPattern: "Brak rozpoznanego wzoru pozycyjnego",
      skeletonOOD: (e) => `Struktura "${e}" poza rozkładem`,
      pcfgNotLoaded: "Model nie załadowany lub rzadka struktura",
      markovNotLoaded: "Model nie załadowany lub mało prawdopodobna sekwencja",
      notApplicable: "Nie dotyczy",
      locale: "pl-PL",
    },
    tr: {
      dictDownloading: "Sözlük indiriliyor…",
      dictProcessing: "Kelimeler işleniyor…",
      dictLoaded: (e) => `✅ ${e} kelime yüklendi`,
      dictError: (e) => `❌ Hata: ${e}`,
      dictLoading: "Sözlük yükleniyor…",
      dictReady: (e) => `Hazır — ${e} kelimeli sözlük yüklendi.`,
      initError: (e) => `Kritik hata: ${e}`,
      initErrorBottom: (e) => `Başlatma hatası: ${e}`,
      hibpChecking: "HIBP kontrol ediliyor…",
      hibpFound: (e) => `⚠ İhlal algılandı: ${e} kez`,
      hibpNotFound: "✓ HIBP'de bulunamadı",
      hibpUnavailable: "HIBP şu anda kullanılamıyor",
      tooltipSeeExplanations: "Açıklamaları gör",
      yes: "evet",
      no: "hayır",
      yesDate: (e) => `evet (${e})`,
      overUniverse: "> evren",
      underMs: "< 1 ms",
      bcryptCost: "maliyet",
      dateTokens: { D: "G", M: "A", Y: "Y", month: "ay" },
      day: "gün",
      month: "ay",
      year: ["yıl", "yıl"],
      century: ["yüzyıl", "yüzyıl"],
      millennium: ["binyıl", "binyıl"],
      profiles: {
        amateur: { name: "Amatör", desc: "Amatör bilgisayar korsanı, 1 GPU" },
        experienced: { name: "Standart", desc: "Deneyimli saldırgan, 12 GPUs (endüstri)" },
        professional: { name: "Pro", desc: "Bulut altyapısı, ~100 GPUs" },
        nation_state: { name: "Devlet", desc: "Devlet aktörü, ~10k GPUs" },
      },
      bestAttackLabel: "⚡ En hızlı saldırı",
      attacks: {
        brute: "Kaba Kuvvet",
        dictionary: "Sözlük",
        hybrid: "Melez (sözlük + kurallar)",
        pcfg: "PCFG",
        markov: "Markov",
        mask: "Maske",
        combinator: "Kombinator (çok kelimeli)",
        date: "Tarih",
      },
      notInDict: "Yaygın kelime olarak algılanmadı",
      noBaseWord: "Temel kelime sözlükte değil",
      noMutation: "Mutasyon algılanmadı",
      wordTooShort: "Kelime çok kısa veya mutasyon yok",
      notPassphrase: "Çok kelimeli parola değil",
      lessThanTwoWords: "2'den az kelime algılandı",
      noMaskPattern: "Konum deseni tanınmadı",
      skeletonOOD: (e) => `Yapı "${e}" dışında`,
      pcfgNotLoaded: "Model yüklenmedi veya nadir yapı",
      markovNotLoaded: "Model yüklenmedi veya olasılık dışı dizi",
      notApplicable: "Uygulanabilir değil",
      locale: "tr-TR",
    },
    es: {
      dictDownloading: "Descargando diccionario…",
      dictProcessing: "Procesando palabras…",
      dictLoaded: (e) => `✅ ${e} palabras cargadas`,
      dictError: (e) => `❌ Error: ${e}`,
      dictLoading: "Cargando diccionario…",
      dictReady: (e) => `Listo — diccionario con ${e} palabras cargado.`,
      initError: (e) => `Error crítico: ${e}`,
      initErrorBottom: (e) => `Error de inicialización: ${e}`,
      hibpChecking: "Verificando HIBP…",
      hibpFound: (e) => `⚠ Filtración detectada: ${e} veces`,
      hibpNotFound: "✓ No encontrado en HIBP",
      hibpUnavailable: "HIBP actualmente no disponible",
      tooltipSeeExplanations: "Ver explicaciones",
      yes: "sí",
      no: "no",
      yesDate: (e) => `sí (${e})`,
      overUniverse: "> universo",
      underMs: "< 1 ms",
      bcryptCost: "coste",
      dateTokens: { D: "D", M: "M", Y: "A", month: "mes" },
      day: ["día", "días"],
      month: ["mes", "meses"],
      year: ["año", "años"],
      century: ["siglo", "siglos"],
      millennium: ["milenio", "milenios"],
      profiles: {
        amateur: { name: "Amateur", desc: "Hacker aficionado, 1 GPU" },
        experienced: { name: "Estándar", desc: "Atacante experimentado, 12 GPUs (industria)" },
        professional: { name: "Pro", desc: "Infraestructura en la nube, ~100 GPUs" },
        nation_state: { name: "Estado", desc: "Actor estatal, ~10k GPUs" },
      },
      bestAttackLabel: "⚡ Ataque más rápido",
      attacks: {
        brute: "Fuerza bruta",
        dictionary: "Diccionario",
        hybrid: "Híbrido (diccionario + reglas)",
        pcfg: "PCFG",
        markov: "Markov",
        mask: "Máscara",
        combinator: "Combinador (contraseña de frase)",
        date: "Fecha",
      },
      notInDict: "No detectado como palabra común",
      noBaseWord: "Palabra base no en diccionario",
      noMutation: "Sin mutación detectada",
      wordTooShort: "Palabra muy corta o sin mutación",
      notPassphrase: "No es una contraseña de múltiples palabras",
      lessThanTwoWords: "Menos de 2 palabras detectadas",
      noMaskPattern: "Sin patrón posicional reconocido",
      skeletonOOD: (e) => `Estructura "${e}" fuera de distribución`,
      pcfgNotLoaded: "Modelo no cargado o estructura rara",
      markovNotLoaded: "Modelo no cargado o secuencia improbable",
      notApplicable: "No aplica",
      locale: "es-ES",
    },
    pt: {
      dictDownloading: "Baixando dicionário…",
      dictProcessing: "Processando palavras…",
      dictLoaded: (e) => `✅ ${e} palavras carregadas`,
      dictError: (e) => `❌ Erro: ${e}`,
      dictLoading: "Carregando dicionário…",
      dictReady: (e) => `Pronto — dicionário com ${e} palavras carregado.`,
      initError: (e) => `Erro crítico: ${e}`,
      initErrorBottom: (e) => `Erro de inicialização: ${e}`,
      hibpChecking: "Verificando HIBP…",
      hibpFound: (e) => `⚠ Vazamento detectado: ${e} vezes`,
      hibpNotFound: "✓ Não encontrado em HIBP",
      hibpUnavailable: "HIBP indisponível no momento",
      tooltipSeeExplanations: "Ver explicações",
      yes: "sim",
      no: "não",
      yesDate: (e) => `sim (${e})`,
      overUniverse: "> universo",
      underMs: "< 1 ms",
      bcryptCost: "custo",
      dateTokens: { D: "D", M: "M", Y: "A", month: "mês" },
      day: ["dia", "dias"],
      month: ["mês", "meses"],
      year: ["ano", "anos"],
      century: ["século", "séculos"],
      millennium: ["milênio", "milênios"],
      profiles: {
        amateur: { name: "Amador", desc: "Hacker amador, 1 GPU" },
        experienced: { name: "Padrão", desc: "Atacante experiente, 12 GPUs (indústria)" },
        professional: { name: "Pro", desc: "Infraestrutura em nuvem, ~100 GPUs" },
        nation_state: { name: "Estado", desc: "Ator estatal, ~10k GPUs" },
      },
      bestAttackLabel: "⚡ Ataque mais rápido",
      attacks: {
        brute: "Força bruta",
        dictionary: "Dicionário",
        hybrid: "Híbrido (dicionário + regras)",
        pcfg: "PCFG",
        markov: "Markov",
        mask: "Máscara",
        combinator: "Combinador (frase-passe)",
        date: "Data",
      },
      notInDict: "Não detectado como palavra comum",
      noBaseWord: "Palavra base não em dicionário",
      noMutation: "Nenhuma mutação detectada",
      wordTooShort: "Palavra muito curta ou sem mutação",
      notPassphrase: "Não é uma frase-passe de múltiplas palavras",
      lessThanTwoWords: "Menos de 2 palavras detectadas",
      noMaskPattern: "Nenhum padrão posicional reconhecido",
      skeletonOOD: (e) => `Estrutura "${e}" fora da distribuição`,
      pcfgNotLoaded: "Modelo não carregado ou estrutura rara",
      markovNotLoaded: "Modelo não carregado ou sequência improvável",
      notApplicable: "Não se aplica",
      locale: "pt-BR",
    },
    de: {
      dictDownloading: "Wörterbuch wird heruntergeladen…",
      dictProcessing: "Wörter werden verarbeitet…",
      dictLoaded: (e) => `✅ ${e} Wörter geladen`,
      dictError: (e) => `❌ Fehler: ${e}`,
      dictLoading: "Wörterbuch wird geladen…",
      dictReady: (e) => `Bereit — Wörterbuch mit ${e} Wörtern geladen.`,
      initError: (e) => `Kritischer Fehler: ${e}`,
      initErrorBottom: (e) => `Initialisierungsfehler: ${e}`,
      hibpChecking: "HIBP wird überprüft…",
      hibpFound: (e) => `⚠ Verletzung erkannt: ${e}x`,
      hibpNotFound: "✓ Nicht in HIBP gefunden",
      hibpUnavailable: "HIBP ist derzeit nicht verfügbar",
      tooltipSeeExplanations: "Erklärungen anzeigen",
      yes: "ja",
      no: "nein",
      yesDate: (e) => `ja (${e})`,
      overUniverse: "> Universum",
      underMs: "< 1 ms",
      bcryptCost: "Kosten",
      dateTokens: { D: "T", M: "M", Y: "J", month: "Monat" },
      day: ["Tag", "Tage"],
      month: ["Monat", "Monate"],
      year: ["Jahr", "Jahre"],
      century: ["Jahrhundert", "Jahrhunderte"],
      millennium: ["Jahrtausend", "Jahrtausende"],
      profiles: {
        amateur: { name: "Amateur", desc: "Hobby-Hacker, 1 GPU" },
        experienced: { name: "Standard", desc: "Erfahrener Angreifer, 12 GPUs (Industrie)" },
        professional: { name: "Pro", desc: "Cloud-Infrastruktur, ~100 GPUs" },
        nation_state: { name: "Staat", desc: "Staatlicher Akteur, ~10k GPUs" },
      },
      bestAttackLabel: "⚡ Schnellster Angriff",
      attacks: {
        brute: "Brute-Force",
        dictionary: "Wörterbuch",
        hybrid: "Hybrid (Wörterbuch + Regeln)",
        pcfg: "PCFG",
        markov: "Markov",
        mask: "Maske",
        combinator: "Kombinator (Passphrase)",
        date: "Datum",
      },
      notInDict: "Nicht als häufiges Wort erkannt",
      noBaseWord: "Basiswort nicht im Wörterbuch",
      noMutation: "Keine Mutation erkannt",
      wordTooShort: "Wort zu kurz oder keine Mutation",
      notPassphrase: "Keine Passphrase mit mehreren Wörtern",
      lessThanTwoWords: "Weniger als 2 Wörter erkannt",
      noMaskPattern: "Kein positionelles Muster erkannt",
      skeletonOOD: (e) => `Struktur "${e}" außerhalb der Verteilung`,
      pcfgNotLoaded: "Modell nicht geladen oder seltene Struktur",
      markovNotLoaded: "Modell nicht geladen oder unwahrscheinliche Sequenz",
      notApplicable: "Nicht anwendbar",
      locale: "de-DE",
    },
    it: {
      dictDownloading: "Download del dizionario…",
      dictProcessing: "Elaborazione parole…",
      dictLoaded: (e) => `✅ ${e} parole caricate`,
      dictError: (e) => `❌ Errore: ${e}`,
      dictLoading: "Caricamento dizionario…",
      dictReady: (e) => `Pronto — dizionario con ${e} parole caricato.`,
      initError: (e) => `Errore critico: ${e}`,
      initErrorBottom: (e) => `Errore di inizializzazione: ${e}`,
      hibpChecking: "Verifica HIBP…",
      hibpFound: (e) => `⚠ Violazione rilevata: ${e} volte`,
      hibpNotFound: "✓ Non trovato in HIBP",
      hibpUnavailable: "HIBP attualmente non disponibile",
      tooltipSeeExplanations: "Vedi spiegazioni",
      yes: "sì",
      no: "no",
      yesDate: (e) => `sì (${e})`,
      overUniverse: "> universo",
      underMs: "< 1 ms",
      bcryptCost: "costo",
      dateTokens: { D: "G", M: "M", Y: "A", month: "mese" },
      day: ["giorno", "giorni"],
      month: ["mese", "mesi"],
      year: ["anno", "anni"],
      century: ["secolo", "secoli"],
      millennium: ["millennio", "millenni"],
      profiles: {
        amateur: { name: "Dilettante", desc: "Hacker dilettante, 1 GPU" },
        experienced: { name: "Standard", desc: "Attaccante esperto, 12 GPUs (industria)" },
        professional: { name: "Pro", desc: "Infrastruttura cloud, ~100 GPUs" },
        nation_state: { name: "Stato", desc: "Attore statale, ~10k GPUs" },
      },
      bestAttackLabel: "⚡ Attacco più veloce",
      attacks: {
        brute: "Forza bruta",
        dictionary: "Dizionario",
        hybrid: "Ibrido (dizionario + regole)",
        pcfg: "PCFG",
        markov: "Markov",
        mask: "Maschera",
        combinator: "Combinatore (passphrase)",
        date: "Data",
      },
      notInDict: "Non rilevato come parola comune",
      noBaseWord: "Parola base non nel dizionario",
      noMutation: "Nessuna mutazione rilevata",
      wordTooShort: "Parola troppo corta o nessuna mutazione",
      notPassphrase: "Non è una passphrase multi-parola",
      lessThanTwoWords: "Meno di 2 parole rilevate",
      noMaskPattern: "Nessun modello posizionale rilevato",
      skeletonOOD: (e) => `Struttura "${e}" al di fuori della distribuzione`,
      pcfgNotLoaded: "Modello non caricato o struttura rara",
      markovNotLoaded: "Modello non caricato o sequenza improbabile",
      notApplicable: "Non applicabile",
      locale: "it-IT",
    },
  };
function t() {
  return I[AppConfig.lang];
}
function explainWhyNotApplicable(e, o, a) {
  const n = a.details[e],
    r = t();
  switch (e) {
    case "dictionary":
      return r.notInDict;
    case "hybrid":
      return o.dictionaryWord
        ? o.password === o.password.toLowerCase()
          ? r.noMutation
          : r.wordTooShort
        : r.noBaseWord;
    case "combinator":
      return o.looksPassphrase ? r.lessThanTwoWords : r.notPassphrase;
    case "mask":
      return r.noMaskPattern;
    case "pcfg":
      return n?.skeleton ? r.skeletonOOD(n.skeleton) : r.pcfgNotLoaded;
    case "markov":
      return r.markovNotLoaded;
    default:
      return r.notApplicable;
  }
}
async function loadDictionary(e = AppConfig.lang) {
  const o = document.getElementById("dict-loader"),
    a = document.getElementById("dict-loader-progress"),
    n = document.getElementById("dict-loader-text"),
    r = t();
  try {
    if (null !== AppConfig.dictWords && AppConfig.dictLang === e)
      return void console.log(`[Time2Crack] Dictionary already loaded for ${e}`);
    ((AppConfig.dictLoading = true),
      o.removeAttribute("hidden"),
      (a.style.width = "10%"),
      (a.style.backgroundColor = "#27ae60"),
      (n.textContent = r.dictDownloading));
    const t2 = `dict_${e}`,
      i = await cacheGet(t2);
    if (i) {
      (console.log(`[Time2Crack] Dictionary loaded from IndexedDB for ${e}`), (a.style.width = "95%"));
      const t3 = new Set(i);
      return (
        AppConfig.setDictionary(t3, e),
        await new Promise((e2) => setTimeout(e2, 200)),
        (a.style.width = "100%"),
        (n.textContent = r.dictLoaded(t3.size.toLocaleString(r.locale))),
        await new Promise((e2) => setTimeout(e2, 1e3)),
        o.setAttribute("hidden", ""),
        (a.style.width = "0%"),
        void (AppConfig.dictLoading = false)
      );
    }
    const s = `${e}.txt.gz`,
      d = await fetch(`${basePath}data/wordlists/${s}`);
    if (!d.ok) throw new Error(`HTTP ${d.status}`);
    a.style.width = "40%";
    const c = await d.arrayBuffer();
    let l;
    a.style.width = "55%";
    try {
      l = await new Response(
        ReadableStream.from([new Uint8Array(c)]).pipeThrough(new DecompressionStream("gzip")),
      ).text();
    } catch (t3) {
      console.warn("[Time2Crack] DecompressionStream not supported, falling back to .txt");
      const o2 = await fetch(`${basePath}data/wordlists/${e}.txt`);
      if (!o2.ok) throw new Error(`Fallback failed: HTTP ${o2.status}`);
      l = await o2.text();
    }
    ((a.style.width = "70%"), (n.textContent = r.dictProcessing));
    const u = l
        .split("\n")
        .map((e2) => e2.trim().toLowerCase())
        .filter((e2) => e2.length >= 3),
      m = new Set(u);
    (AppConfig.setDictionary(m, e),
      (a.style.width = "95%"),
      await cachePut(t2, u),
      console.log(`[Time2Crack] Dictionary saved to IndexedDB for ${e}`),
      await new Promise((e2) => setTimeout(e2, 200)),
      (a.style.width = "100%"),
      (n.textContent = r.dictLoaded(m.size.toLocaleString(r.locale))),
      await new Promise((e2) => setTimeout(e2, 1e3)),
      o.setAttribute("hidden", ""),
      (a.style.width = "0%"),
      (AppConfig.dictLoading = false));
  } catch (e2) {
    throw (
      (AppConfig.dictLoading = false),
      (n.textContent = r.dictError(e2.message)),
      (a.style.width = "0%"),
      (a.style.backgroundColor = "#e74c3c"),
      console.error("[Time2Crack] Dictionary load error:", e2),
      e2
    );
  }
}
async function lazyLoadModels(e = AppConfig.lang) {
  if (!AppConfig.markovLoaded || !AppConfig.pcfgLoaded || AppConfig.dictLang !== e)
    return AppConfig.modelsLoading
      ? (console.log("[Time2Crack] Models loading in progress, reusing Promise"),
        void (await AppConfig.modelsLoading))
      : ((AppConfig.modelsLoading = (async () => {
          try {
            console.log(`[Time2Crack] Starting lazy model loading for ${e}...`);
            const t2 = "en" === e ? "" : `-${e}`,
              o = `markov_${e}`,
              a = `pcfg_${e}`;
            let [n, r] = await Promise.all([cacheGet(o), cacheGet(a)]);
            if (n && r) console.log(`[Time2Crack] Models loaded from IndexedDB for ${e}`);
            else {
              const i = `${basePath}data/calibration/markov-ngrams${t2}.json`,
                s = `${basePath}data/calibration/pcfg-data${t2}.json`;
              (([n, r] = await Promise.all([
                fetch(i).then((e2) => {
                  if (!e2.ok) throw new Error(`Markov HTTP ${e2.status}`);
                  return e2.json();
                }),
                fetch(s).then((e2) => {
                  if (!e2.ok) throw new Error(`PCFG HTTP ${e2.status}`);
                  return e2.json();
                }),
              ])),
                await Promise.all([cachePut(o, n), cachePut(a, r)]),
                console.log(`[Time2Crack] Models saved to IndexedDB for ${e}`));
            }
            (initMarkov(n),
              initPCFG(r),
              (AppConfig.markovLoaded = true),
              (AppConfig.pcfgLoaded = true),
              console.log(`[Time2Crack] Models initialized for ${e}`));
          } catch (e2) {
            throw (
              console.warn("[Time2Crack] Models loading failed (optional):", e2.message),
              (AppConfig.modelsLoading = null),
              e2
            );
          }
        })()),
        AppConfig.modelsLoading);
  console.log(`[Time2Crack] Models already loaded for ${e}`);
}
const SECOND = 1,
  MINUTE = 60,
  HOUR = 3600,
  DAY = 86400,
  MONTH = 2592e3,
  YEAR = 31536e3,
  CENTURY = 100 * YEAR,
  MILLENIUM = 1e3 * YEAR;
// Forme du mot selon la langue : chaîne invariable, [singulier, pluriel] ou formes Intl.PluralRules
function plural(e, t2) {
  if ("string" == typeof t2) return t2;
  const o = new Intl.PluralRules(t().locale).select(e);
  return Array.isArray(t2) ? ("one" === o ? t2[0] : t2[1]) : (t2[o] ?? t2.other);
}
// Nombre au format de la langue ; au-delà d'un million : notation scientifique (2,3 × 10⁶)
const SUPERSCRIPT = "⁰¹²³⁴⁵⁶⁷⁸⁹";
function formatNumber(e, digits = 1) {
  const o = t().locale;
  if (e < 1e6) return e.toLocaleString(o, { maximumFractionDigits: digits });
  const a = Math.floor(Math.log10(e)),
    n = (e / 10 ** a).toLocaleString(o, { maximumFractionDigits: 1 });
  return `${n} × 10${[...String(a)].map((e2) => SUPERSCRIPT[e2]).join("")}`;
}
function formatSeconds(e) {
  const o = t();
  if (!isFinite(e) || e > 1e30) return o.overUniverse;
  if (e < 1e-3) return o.underMs;
  if (e < 1) return `${formatNumber(1e3 * e, 0)} ms`;
  if (e < 60) return `${formatNumber(e)} s`;
  if (e < 3600) return `${formatNumber(e / 60)} min`;
  if (e < DAY) return `${formatNumber(e / 3600)} h`;
  // Jours et au-delà : nombre entier + unité accordée (« 8 jours », « 2 mois »)
  const unit = (e2, t2) => {
    const a = Math.round(e2);
    return `${formatNumber(a, 0)} ${plural(a, t2)}`;
  };
  if (e < MONTH) return unit(e / DAY, o.day);
  if (e < YEAR) return unit(e / MONTH, o.month);
  if (e < CENTURY) return unit(e / YEAR, o.year);
  if (e < MILLENIUM) return unit(e / CENTURY, o.century);
  const a = e / MILLENIUM;
  return a < 1e6 ? unit(a, o.millennium) : `${formatNumber(a)} ${plural(5, o.millennium)}`;
}
// Format de date détecté, dans les lettres de la langue (« DDMonthNameYYYY » → « JJ mois AAAA »)
function formatDatePattern(e) {
  const o = t().dateTokens;
  return e
    .split(/(MonthName)/)
    .filter(Boolean)
    .map((e2) => ("MonthName" === e2 ? o.month : e2.replace(/[DMY]/g, (e3) => o[e3])))
    .join(" ");
}
function getAttackLabel(e) {
  return t().attacks[e] ?? e;
}
const ALGO_LABELS = {
    md5: "MD5",
    sha1: "SHA-1",
    sha256: "SHA-256",
    ntlm: "NTLM",
    bcrypt: "bcrypt",
    argon2: "Argon2id",
  },
  ATTACK_ORDER = ["brute", "dictionary", "hybrid", "combinator", "pcfg", "markov", "mask"];
function renderContext(e) {
  const o = t();
  function a(e2, t2, o2) {
    const a2 = document.getElementById(e2);
    if (!a2) return;
    const n = document.createElement("span");
    ((n.className = `val-${o2}`), (n.textContent = t2), (a2.innerHTML = ""), a2.appendChild(n));
  }
  (a("ctx-len", String(e.len), "num"),
    a("ctx-cs", String(e.cs), "num"),
    a("ctx-dt", e.dt ? o.yesDate(formatDatePattern(e.datePattern?.format ?? e.datePattern)) : o.no, e.dt ? "warn" : "ok"),
    a("ctx-kb", e.kbPat ? o.yes : o.no, e.kbPat ? "warn" : "ok"),
    a("ctx-seq", e.seq ? o.yes : o.no, e.seq ? "warn" : "ok"),
    a("ctx-rep", e.rep ? o.yes : o.no, e.rep ? "warn" : "ok"),
    a("ctx-dict", e.dictWord ? o.yes : o.no, e.dictWord ? "warn" : "ok"),
    a("ctx-hybrid", e.hybridVuln ? o.yes : o.no, e.hybridVuln ? "warn" : "ok"),
    a("ctx-pass", e.looksPassphrase ? o.yes : o.no, e.looksPassphrase ? "warn" : "ok"));
}
function timeClass(e) {
  return e < 1 ? "time-instant" : e < 3600 ? "time-fast" : e < 31536e3 ? "time-moderate" : "time-strong";
}
function renderTable(e) {
  const t2 = document.querySelector("#results-table tbody"),
    { best_attack: o, rank: a, profile: n } = e,
    r = document.createDocumentFragment();
  let i = 0;
  for (const t3 of ATTACK_ORDER) {
    const s = getAttackLabel(t3),
      d = t3 === o,
      c = i % 2 == 1,
      l = a.details[t3]?.rank ?? null;
    if (null === l && "brute" !== t3) {
      const o2 = document.createElement("tr");
      o2.className = "not-applicable" + (c ? " attack-group-alt" : "");
      const n2 = document.createElement("td");
      n2.textContent = s;
      const d2 = document.createElement("td");
      d2.colSpan = 2;
      const l2 = document.createElement("em"),
        u = explainWhyNotApplicable(t3, e.context, a);
      ((l2.textContent = u),
        (l2.title = "Voir explications"),
        d2.appendChild(l2),
        o2.appendChild(n2),
        o2.appendChild(d2),
        r.appendChild(o2),
        i++);
      continue;
    }
    (ALGORITHMS.forEach((e2, t4) => {
      const o2 = document.createElement("tr");
      (c && o2.classList.add("attack-group-alt"), d && o2.classList.add("is-best-attack"));
      const a2 = document.createElement("td");
      ((a2.textContent = d ? `${s} ⚡` : s),
        a2.classList.add("attack-label"),
        t4 > 0 && a2.classList.add("attack-label-continuation"),
        o2.appendChild(a2));
      const i2 = document.createElement("td");
      ((i2.textContent = "bcrypt" === e2 ? `bcrypt (${t().bcryptCost} 5)` : (ALGO_LABELS[e2] ?? e2)), o2.appendChild(i2));
      const u = rankToSeconds(l, e2, n),
        m = document.createElement("td");
      ((m.textContent = formatSeconds(u)),
        (m.className = timeClass(u)),
        o2.appendChild(m),
        r.appendChild(o2));
    }),
      i++);
  }
  ((t2.innerHTML = ""), t2.appendChild(r));
}
async function sha1Hex(e) {
  const t2 = await crypto.subtle.digest("SHA-1", new TextEncoder().encode(e));
  return Array.from(new Uint8Array(t2))
    .map((e2) => e2.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase();
}
async function checkHIBP(e) {
  const t2 = await sha1Hex(e),
    o = t2.slice(0, 5),
    a = t2.slice(5),
    n = await fetch(`https://api.pwnedpasswords.com/range/${o}`, { headers: { "Add-Padding": "true" } });
  if (!n.ok) return null;
  const r = await n.text();
  for (const e2 of r.split("\n")) {
    const [t3, o2] = e2.trim().split(":");
    if (t3 === a) return parseInt(o2, 10);
  }
  return 0;
}
function renderHIBP(e, o) {
  const a = document.getElementById("hibp-badge"),
    n = t();
  switch (e) {
    case "pending":
      ((a.textContent = n.hibpChecking), (a.dataset.state = "pending"));
      break;
    case "found":
      const e2 = n.locale;
      ((a.textContent = n.hibpFound(o.toLocaleString(e2))), (a.dataset.state = "found"));
      break;
    case "not_found":
      ((a.textContent = n.hibpNotFound), (a.dataset.state = "not_found"));
      break;
    case "unavailable":
      ((a.textContent = n.hibpUnavailable), (a.dataset.state = "unavailable"));
      break;
    default:
      ((a.textContent = ""), (a.dataset.state = "hidden"));
  }
}
let currentProfile = "experienced";
function updateProfileDisplay() {
  const e = t().profiles[currentProfile];
  if (!e || !document.getElementById("profile-info-card")) return;
  ((document.getElementById("profile-info-name").textContent = e.name),
    (document.getElementById("profile-info-gpus").textContent =
      "amateur" === currentProfile
        ? "(1 GPU)"
        : "experienced" === currentProfile
          ? "(12 GPUs)"
          : "professional" === currentProfile
            ? "(~100 GPUs)"
            : "(~10k GPUs)"),
    (document.getElementById("profile-info-desc").textContent = e.desc));
}
function analyze(e) {
  const t2 = document.getElementById("results"),
    quick = document.getElementById("quick-result");
  if (!e) return (quick && (quick.hidden = true), void (t2 && (t2.hidden = true)));
  const o = performance.now(),
    a = calcCrackTime(e, { dictWords: AppConfig.dictWords, profile: currentProfile, lang: AppConfig.lang }),
    n = performance.now() - o,
    r = performance.now(),
    i = getAttackLabel(a.best_attack);
  const s = a.best_attack_seconds ?? null,
    d = null !== s ? formatSeconds(s) : "—",
    // Tant que le dictionnaire n'est pas chargé, le temps est provisoire (attaques sans dictionnaire)
    provisional = !AppConfig.dictWords,
    showTime = (el) => {
      ((el.textContent = d),
        (el.className = null !== s ? timeClass(s) : ""),
        el.classList.toggle("is-provisional", provisional),
        provisional ? (el.title = t().dictLoading) : el.removeAttribute("title"));
    };
  // Accueil : ligne « Ce mot de passe résistera : … » sous le champ
  quick && (showTime(document.getElementById("quick-result-time")), (quick.hidden = false));
  // Résultats en détail
  if (t2) {
    ((document.getElementById("best-attack-name").textContent = i),
      showTime(document.getElementById("best-attack-time")),
      renderContext(a.context),
      renderTable(a),
      (t2.hidden = false));
  }
  const c = performance.now() - r;
  const l = n + c;
  if (
    (console.log("%c[Time2Crack PROFILER]", "color: #00A3FF; font-weight: bold;"),
    console.log(`  Password: "${e}" (${e.length} chars)`),
    console.log(`  ├─ analyzePatterns:  ${a._profiler.timePatterns.toFixed(2)} ms`),
    console.log(`  ├─ estimateRank:     ${a._profiler.timeRank.toFixed(2)} ms`),
    console.log(`  ├─ rankToAllSeconds: ${a._profiler.timeTime.toFixed(2)} ms`),
    console.log(`  ├─ calcCrackTime():  ${n.toFixed(2)} ms (total algo)`),
    console.log(`  ├─ UI rendering:     ${c.toFixed(2)} ms`),
    console.log(`  └─ TOTAL:            ${l.toFixed(2)} ms`),
    console.log("  "),
    console.log(`  Best attack: ${a.best_attack} (${null !== s ? formatSeconds(s) : "N/A"})`),
    console.table({
      Patterns: {
        kbPat: a.context.kbPat,
        seq: a.context.seq,
        rep: a.context.rep,
        dt: a.context.dt,
        dictWord: a.context.dictWord,
        hybridVuln: a.context.hybridVuln,
        looksPassphrase: a.context.looksPassphrase,
      },
    }),
    !AppConfig.markovLoaded || !AppConfig.pcfgLoaded)
  ) {
    !a.context.dictWord &&
      !a.context.hybridVuln &&
      e.length > 8 &&
      (console.log(`[Time2Crack] Password looks random, lazy-loading models for ${AppConfig.lang}...`),
      lazyLoadModels(AppConfig.lang)
        .then(() => {
          // Modèles Markov/PCFG prêts : recalcul si le mot de passe n'a pas changé
          document.getElementById("pw-input")?.value === e && analyze(e);
        })
        .catch((e2) => {
        console.warn("[Time2Crack] Could not load probabilistic models:", e2.message);
      }));
  }
}
async function loadI18nJSON() {
  try {
    const e = await fetch(`${basePath}data/i18n.json`);
    if (!e.ok) throw new Error(`HTTP ${e.status}`);
    const t2 = await e.json();
    (Object.keys(t2).forEach((e2) => {
      (I[e2] || (I[e2] = {}), (I[e2].nav = t2[e2].nav || {}), (I[e2].page = t2[e2].page || {}));
    }),
      console.log("[Time2Crack] i18n.json loaded successfully"));
  } catch (e) {
    console.error("[Time2Crack] Failed to load i18n.json:", e.message);
  }
}
function updateStaticStrings() {
  const e = t(),
    o = e.nav || {},
    a = e.page || {},
    n = document.querySelector(".nav-home");
  n && (n.textContent = o.testPassword || "Test a password");
  const r = document.querySelector(".nav-generator");
  r && (r.textContent = o.generator || "Generate a password");
  const i = document.querySelector(".nav-faq");
  i && (i.textContent = o.faq || "FAQ");
  const s = document.querySelector(".nav-about");
  s && (s.textContent = o.about || "About");
  const d = document.getElementById("main-title");
  d && (d.textContent = a.title || "Test a password");
  const c = document.getElementById("main-hint");
  c && (c.textContent = a.hint || "Local analysis, secure, free • No passwords transmitted");
  const l = document.getElementById("how-it-works-link");
  (l && (l.textContent = a.howItWorks || "How it works? →"),
    updateProfileLabels(),
    updateBestAttackLabel(),
    (document.documentElement.lang = AppConfig.lang));
}
function updateProfileLabels() {
  const e = t().profiles || {};
  ["amateur", "experienced", "professional", "nation_state"].forEach((t2) => {
    const o = document.querySelector(`[data-profile="${t2}"]`);
    if (o && e[t2]) {
      const a = o.querySelector(".profile-btn__name");
      a && (a.textContent = e[t2].name);
    }
  });
}
function updateBestAttackLabel() {
  const e = t().bestAttackLabel || "⚡ Fastest attack",
    o = document.querySelector(".best-attack-label");
  o && (o.textContent = e);
}
async function init() {
  const e = document.getElementById("status"),
    o = document.getElementById("pw-input");
  (await loadI18nJSON(), updateStaticStrings());
  const a = t();
  // Le dictionnaire se charge en arrière-plan : le champ reste utilisable et le temps affiché est
  // provisoire jusqu'au recalcul, dès que le dictionnaire est prêt.
  ((e.textContent = a.dictLoading),
    loadDictionary(AppConfig.lang).then(
      () => {
        const t2 = AppConfig.dictWords ? AppConfig.dictWords.size.toLocaleString(a.locale) : "0";
        ((e.textContent = a.dictReady(t2)),
          setTimeout(() => {
            e.textContent = "";
          }, 3e3),
          o.value && analyze(o.value));
      },
      (t2) => {
        ((e.textContent = a.initError(t2.message)), console.error("[Time2Crack] Dictionary loading failed:", t2));
      },
    ),
    (document.documentElement.lang = AppConfig.lang),
    updateProfileDisplay());
  // Accueil → Résultats en détail : le mot de passe passe par la mémoire de l'onglet (sessionStorage),
  // jamais par l'adresse. La page de résultats le lit puis l'efface aussitôt.
  const PW_KEY = "time2crack-pw";
  document.getElementById("quick-result-more")?.addEventListener("click", () => {
    try {
      o.value && sessionStorage.setItem(PW_KEY, o.value);
    } catch {}
  });
  try {
    const t2 = sessionStorage.getItem(PW_KEY);
    null !== t2 && (sessionStorage.removeItem(PW_KEY), (o.value = t2));
  } catch {}
  o.focus();
  const n = document.getElementById("lang-toggle"),
    r = document.getElementById("lang-menu");
  if (n && r) {
    const e2 = () => {
      const e3 = !r.hidden;
      n.setAttribute("aria-expanded", e3);
    };
    (n.addEventListener("click", (t3) => {
      (t3.stopPropagation(),
        (r.hidden = !r.hidden),
        e2(),
        r.hidden || r.querySelector(".lang-menu__item")?.focus());
    }),
      r.querySelectorAll(".lang-menu__item").forEach((t3) => {
        t3.addEventListener("click", async (t4) => {
          const a2 = t4.target.dataset.lang;
          (r.querySelectorAll(".lang-menu__item").forEach((e3) => {
            e3.removeAttribute("aria-selected");
          }),
            t4.target.setAttribute("aria-selected", "true"),
            AppConfig.setLanguage(a2),
            (AppConfig.markovLoaded = false),
            (AppConfig.pcfgLoaded = false),
            (AppConfig.modelsLoading = null));
          const i2 = document.getElementById("lang-label");
          (i2 && (i2.textContent = LANG_NAMES[a2] || a2), updateStaticStrings());
          try {
            await loadDictionary(AppConfig.lang);
            const e3 = o.value;
            e3 && analyze(e3);
          } catch (e3) {
            console.error("[Time2Crack] Language switch error:", e3);
          }
          ((r.hidden = true), e2(), n.focus());
        });
      }),
      document.querySelector(`[data-lang="${AppConfig.lang}"]`)?.setAttribute("aria-selected", "true"));
    const t2 = document.getElementById("lang-label");
    (t2 && (t2.textContent = LANG_NAMES[AppConfig.lang] || AppConfig.lang),
      document.addEventListener("click", (t3) => {
        r.hidden || n.contains(t3.target) || r.contains(t3.target) || ((r.hidden = true), e2());
      }),
      document.addEventListener("keydown", (t3) => {
        "Escape" !== t3.key || r.hidden || ((r.hidden = true), e2(), n.focus());
      }));
  }
  document.querySelectorAll(".profile-btn").forEach((e2) => {
    e2.addEventListener("click", () => {
      (document.querySelectorAll(".profile-btn").forEach((e3) => {
        (e3.classList.remove("profile-btn--active"), e3.setAttribute("aria-pressed", "false"));
      }),
        e2.classList.add("profile-btn--active"),
        e2.setAttribute("aria-pressed", "true"),
        (currentProfile = e2.dataset.profile),
        updateProfileDisplay(),
        analyze(o.value));
    });
  });
  let i = null;
  // Statistiques Umami : un événement « password-tested » quand la saisie s'arrête 2 s.
  // Seul le nom de l'événement est envoyé : ni le mot de passe, ni sa longueur, ni le résultat.
  let tracked = "",
    trackTimer = null;
  o.addEventListener("input", () => {
    const e2 = o.value;
    clearTimeout(trackTimer);
    e2 &&
      (trackTimer = setTimeout(() => {
        o.value === e2 && e2 !== tracked && ((tracked = e2), window.umami?.track("password-tested"));
      }, 2e3));
    try {
      analyze(e2);
    } catch (e3) {
      console.error("[Time2Crack] analyze() failed:", e3);
    }
    (clearTimeout(i),
      e2
        ? (renderHIBP("pending"),
          (i = setTimeout(async () => {
            try {
              const t2 = await checkHIBP(e2);
              if (o.value !== e2) return;
              null === t2
                ? renderHIBP("unavailable")
                : t2 > 0
                  ? renderHIBP("found", t2)
                  : renderHIBP("not_found");
            } catch {
              if (o.value !== e2) return;
              renderHIBP("unavailable");
            }
          }, 500)))
        : renderHIBP("hidden"));
  });
  // Mot de passe transmis : analyse + HIBP. Champ vide : rien à afficher.
  o.value ? o.dispatchEvent(new Event("input")) : analyze("");
}
document.getElementById("pw-input")
  ? init().catch((e) => {
      const o = document.getElementById("status");
      (o && (o.textContent = t().initErrorBottom(e.message)),
        console.error("[Time2Crack] init() failed:", e));
    })
  : document.addEventListener(
      "headerLoaded",
      () => {
        init().catch((e) => {
          const o = document.getElementById("status");
          (o && (o.textContent = t().initErrorBottom(e.message)),
            console.error("[Time2Crack] init() failed:", e));
        });
      },
      { once: true },
    );
