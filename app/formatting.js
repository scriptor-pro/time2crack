// ============================================================
// VULNERABILITIES
// ============================================================
function getVulns(pw) {
  const v = [];
  if (isCommon(pw)) v.push({ t: t("vCommon"), l: "critical" });
  if (hasKBPattern(pw)) v.push({ t: t("vKeyboard"), l: "critical" });
  if (pw.length < 8) v.push({ t: t("vShort"), l: "critical" });
  if (hasSequence(pw)) v.push({ t: t("vSequence"), l: "warn" });
  if (hasRepeat(pw)) v.push({ t: t("vRepeat"), l: "warn" });
  if (hasDate(pw)) v.push({ t: t("vDate"), l: "warn" });
  const { types } = getCharset(pw);
  if (types <= 1) v.push({ t: t("v1Type"), l: "critical" });
  if (types >= 4) v.push({ t: t("vDiversity"), l: "ok" });
  if (pw.length >= 16) v.push({ t: t("vGreatLen"), l: "ok" });
  else if (pw.length >= 12) v.push({ t: t("vGoodLen"), l: "ok" });
  return v;
}

// ============================================================
// FORMATTING
// ============================================================
function fmtBig(n) {
  if (!isFinite(n)) return "∞";
  if (n >= 1e18) return n.toExponential(1).replace("+", "");
  if (n >= 1e15) return (n / 1e15).toFixed(1) + " " + t("quadrillion");
  if (n >= 1e12) return (n / 1e12).toFixed(1) + " " + t("trillion");
  if (n >= 1e9) return (n / 1e9).toFixed(1) + " " + t("billion");
  if (n >= 1e6) return (n / 1e6).toFixed(1) + " " + t("million");
  if (n >= 1e3) return (n / 1e3).toFixed(1) + " " + t("thousand");
  return Math.round(n).toString();
}

function fmtDuration(s) {
  if (s === null) return { text: t("na"), ok: false, na: true };
  if (!isFinite(s) || s > 1e18) {
    // Display exact value instead of generic message
    const years = Math.floor(s / 31557600);
    const yearStr = fmtBig(years) + " " + (state.lang === "fr" ? "d'années" : " years");
    return { text: yearStr, ok: false, inf: true };
  }
  if (s < 0.01) return { text: t("instant"), ok: true, instant: true };
  if (s < 1) return { text: t("lessSec"), ok: true, instant: true };
  const tot = Math.floor(s);
  const y = Math.floor(tot / 31557600),
    mo = Math.floor((tot % 31557600) / 2629800),
    d = Math.floor((tot % 2629800) / 86400),
    h = Math.floor((tot % 86400) / 3600),
    mi = Math.floor((tot % 3600) / 60),
    se = tot % 60;
  const p = [];
   if (y > 0) {
     const yearPart = y === 1 ? t("yr") : t("yrs");
     const separator = state.lang === "fr" ? "d'" : " ";
     p.push(fmtBig(y) + " " + separator + yearPart);
   }
  if (mo > 0) p.push(mo + " " + t("mo"));
  if (d > 0) p.push(d + " " + (d === 1 ? t("day") : t("days")));
  if (h > 0) p.push(h + " h");
  if (mi > 0 && y === 0) p.push(mi + " min");
  if (se > 0 && y === 0 && mo === 0) p.push(se + " s");
  return { text: p.slice(0, 3).join(", "), ok: true };
}

function fmtDate(s) {
  if (s === null || !isFinite(s) || s > 3.15576e15) return null;
  const d = new Date(Date.now() + s * 1000);
  return isNaN(d.getTime())
    ? null
    : d.toLocaleDateString(state.lang === "fr" ? "fr-FR" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
}

function fmtSpeed(r) {
  return r === 0 ? "—" : fmtBig(r) + " H/s";
}

function confidenceText(value) {
  const v = Number.isFinite(value) ? value : 0;
  let level;
  if (v >= 0.85) level = state.lang === "fr" ? "élevée" : "high";
  else if (v >= 0.65) level = state.lang === "fr" ? "moyenne" : "medium";
  else level = state.lang === "fr" ? "faible" : "low";
  return state.lang === "fr"
    ? ` Confiance de l'estimation : <strong>${level}</strong>.`
    : ` Estimate confidence: <strong>${level}</strong>.`;
}

