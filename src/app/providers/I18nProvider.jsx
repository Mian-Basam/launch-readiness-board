import React from "react";
import { translate } from "./i18n.js";
import { I18nContext } from "./contexts.js";

// The app is English-only. The dictionary still supports other languages,
// so switching back later is just a matter of making `lang` stateful again.
const LANG = "en";

export function I18nProvider({ children }) {
  React.useEffect(() => {
    document.documentElement.lang = LANG;
  }, []);

  const value = React.useMemo(
    () => ({ lang: LANG, t: (key, vars) => translate(LANG, key, vars) }),
    []
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
