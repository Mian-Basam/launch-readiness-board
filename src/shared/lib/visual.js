// Deterministic colours and initials for avatars.
const HUES = [234, 262, 199, 160, 28, 340, 45, 290];

export function hueFor(text = "") {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return HUES[h % HUES.length];
}

export function initials(text = "") {
  const words = text.replace(/\(.*?\)/g, "").split(/[\s/]+/).filter(Boolean);
  return ((words[0]?.[0] ?? "") + (words[1]?.[0] ?? "")).toUpperCase() || "?";
}

export function relativeTime(ts, now = Date.now(), lang = "en") {
  const rtf = new Intl.RelativeTimeFormat(lang, { numeric: "auto" });
  const s = Math.round((ts - now) / 1000);
  if (Math.abs(s) < 60) return rtf.format(s, "second");
  const m = Math.round(s / 60);
  if (Math.abs(m) < 60) return rtf.format(m, "minute");
  const h = Math.round(m / 60);
  if (Math.abs(h) < 24) return rtf.format(h, "hour");
  return rtf.format(Math.round(h / 24), "day");
}
