import React from "react";
import { Icon } from "./Icon.jsx";

/**
 * Accessible overlay used for both the centered modal and the side drawer.
 * Closes on Escape or backdrop click and returns focus to what opened it.
 */
export function Overlay({ variant = "modal", size, title, subtitle, onClose, closeLabel = "Close", headerExtra, focusFirstField = true, children }) {
  const titleId = React.useId();
  const panelRef = React.useRef(null);
  const onCloseRef = React.useRef(onClose);

  React.useLayoutEffect(() => {
    onCloseRef.current = onClose;
  });

  // Runs once on open: wire Escape, focus the first field, restore focus on close.
  React.useEffect(() => {
    const opener = document.activeElement;
    const onKey = (e) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("keydown", onKey);
    const first = focusFirstField
      ? panelRef.current?.querySelector("input, select, textarea")
      : null;
    (first ?? panelRef.current)?.focus();
    return () => {
      document.removeEventListener("keydown", onKey);
      if (opener instanceof HTMLElement && opener.isConnected) opener.focus();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on open
  }, []);

  return (
    <div className={`overlay overlay--${variant}`} onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className={`overlayPanel overlayPanel--${variant} ${size ? `overlayPanel--${size}` : ""}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="overlayHead">
          <div className="overlayHeadMain">
            <h2 id={titleId} className="overlayTitle">{title}</h2>
            {subtitle ? <p className="overlaySub">{subtitle}</p> : null}
          </div>
          {headerExtra}
          <button type="button" className="iconBtn overlayClose" onClick={onClose} aria-label={closeLabel}>
            <Icon name="x" />
          </button>
        </header>
        <div className="overlayBody">{children}</div>
      </div>
    </div>
  );
}
