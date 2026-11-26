import React from "react";
import { useI18n } from "../../../app/providers/hooks.js";

const TYPE_GLYPH = {
  story: <path d="M8.5 6.5h7v11l-3.5-2.6-3.5 2.6z" fill="#fff" stroke="none" />,
  task: <path d="m7.5 12.2 3 3 6-6.4" stroke="#fff" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />,
  bug: <circle cx="12" cy="12" r="4.2" fill="#fff" />,
};

export function TypeIcon({ type = "task", size = 16 }) {
  const { t } = useI18n();
  return (
    <svg className={`typeIcon typeIcon--${type}`} width={size} height={size} viewBox="0 0 24 24" role="img" aria-label={t(type)}>
      <title>{t(type)}</title>
      <rect x="1" y="1" width="22" height="22" rx="5" fill="currentColor" />
      {TYPE_GLYPH[type] ?? TYPE_GLYPH.task}
    </svg>
  );
}

const PRIORITY_GLYPH = {
  highest: "M6 13l6-5 6 5M6 18l6-5 6 5",
  high: "M6 15l6-6 6 6",
  medium: "M6 9.5h12M6 14.5h12",
  low: "M6 9l6 6 6-6",
};

export function PriorityIcon({ priority = "medium", size = 16 }) {
  const { t } = useI18n();
  return (
    <svg
      className={`priorityIcon priorityIcon--${priority}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      role="img"
      aria-label={`${t("priority")}: ${t(priority)}`}
    >
      <title>{`${t("priority")}: ${t(priority)}`}</title>
      <path d={PRIORITY_GLYPH[priority] ?? PRIORITY_GLYPH.medium} />
    </svg>
  );
}

export function StatusLozenge({ status }) {
  const { t } = useI18n();
  return <span className={`lozenge lozenge--${status}`}>{t(status)}</span>;
}
