import React from "react";
import { ToastContext } from "./contexts.js";
import { useI18n } from "./hooks.js";

const DISMISS_MS = 4000;
let seq = 0;

export function ToastProvider({ children }) {
  const { t } = useI18n();
  const [toasts, setToasts] = React.useState([]);

  const dismiss = React.useCallback((id) => {
    setToasts((list) => list.filter((x) => x.id !== id));
  }, []);

  const notify = React.useCallback(
    (message, kind = "info") => {
      const id = ++seq;
      setToasts((list) => [...list.slice(-3), { id, message, kind }]);
      setTimeout(() => dismiss(id), DISMISS_MS);
    },
    [dismiss]
  );

  const value = React.useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toastRegion" role="status" aria-live="polite">
        {toasts.map((x) => (
          <div key={x.id} className={`toast toast--${x.kind}`}>
            <span>{x.message}</span>
            <button className="toastClose" onClick={() => dismiss(x.id)} aria-label={t("dismiss")}>
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
