import React from "react";
import { useI18n } from "../../../app/providers/hooks.js";
import { Icon } from "../../../shared/ui/Icon.jsx";
import { TYPES } from "../selectors/tasksSelectors.js";

/** "+ Create issue" at the bottom of a column: type a summary and press Enter. */
export function InlineCreate({ onCreate, disabled, disabledReason }) {
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [type, setType] = React.useState("task");
  const inputRef = React.useRef(null);

  function submit() {
    const trimmed = title.trim();
    if (!trimmed || disabled) return;
    onCreate({ title: trimmed, type });
    setTitle("");
    inputRef.current?.focus();
  }

  if (!open) {
    return (
      <button
        type="button"
        className="inlineCreateBtn"
        onClick={() => setOpen(true)}
        disabled={disabled}
        title={disabled ? disabledReason : undefined}
      >
        <Icon name="plus" size={14} />
        {t("createIssue")}
      </button>
    );
  }

  return (
    <div
      className="inlineCreate"
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget) && !title.trim()) setOpen(false);
      }}
    >
      <textarea
        ref={inputRef}
        className="inlineCreateInput"
        autoFocus
        rows={2}
        value={title}
        aria-label={t("summary")}
        placeholder={t("createPlaceholder")}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            submit();
          } else if (e.key === "Escape") {
            e.stopPropagation();
            setTitle("");
            setOpen(false);
          }
        }}
      />
      <div className="inlineCreateBar">
        <select className="miniSelect" value={type} onChange={(e) => setType(e.target.value)} aria-label={t("type")}>
          {TYPES.map((ty) => (
            <option key={ty} value={ty}>
              {t(ty)}
            </option>
          ))}
        </select>
        <span className="inlineCreateHint">{t("createHint")}</span>
        <button type="button" className="miniBtn miniBtn--primary" onClick={submit} disabled={!title.trim() || disabled}>
          {t("create")}
        </button>
      </div>
    </div>
  );
}
