import React from "react";
import { ThemeContext } from "./contexts.js";
import { readPref, writePref } from "../../shared/lib/storage.js";

function systemTheme() {
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = React.useState(() => readPref("theme", systemTheme(), ["dark", "light"]));
  const [dir, setDir] = React.useState(() => readPref("dir", "ltr", ["ltr", "rtl"]));

  React.useEffect(() => {
    writePref("theme", theme);
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  React.useEffect(() => {
    writePref("dir", dir);
    document.documentElement.dir = dir;
  }, [dir]);

  const value = React.useMemo(() => ({ theme, setTheme, dir, setDir }), [theme, dir]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
