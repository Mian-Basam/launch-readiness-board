// localStorage can throw (private mode, blocked site data), so every access is guarded.
export function readPref(key, fallback, allowed) {
  try {
    const v = localStorage.getItem(key);
    if (v && (!allowed || allowed.includes(v))) return v;
  } catch {
    // ignore
  }
  return fallback;
}

export function writePref(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}
