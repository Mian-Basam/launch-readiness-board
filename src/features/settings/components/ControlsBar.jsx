import React from "react";
import { useI18n, useTheme } from "../../../app/providers/hooks.js";
import { Icon } from "../../../shared/ui/Icon.jsx";

export function ControlsBar() {
  const { theme, setTheme, dir, setDir } = useTheme();
  const { t } = useI18n();
  const next = theme === "dark" ? "light" : "dark";

  return (
    <div className="controls">
      <button
        type="button"
        className="iconBtn"
        onClick={() => setDir(dir === "ltr" ? "rtl" : "ltr")}
        aria-label={t("dirToggle")}
        title={`${t("rtl")}: ${dir.toUpperCase()}`}
      >
        <Icon name="swap" />
      </button>
      <button
        type="button"
        className="iconBtn"
        onClick={() => setTheme(next)}
        aria-label={t("themeToggle", { mode: next })}
        title={t("themeToggle", { mode: next })}
      >
        <Icon name={theme === "dark" ? "sun" : "moon"} />
      </button>
    </div>
  );
}
