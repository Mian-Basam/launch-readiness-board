import React from "react";
import { useActivity } from "../hooks/useActivity.js";
import { useI18n } from "../../../app/providers/hooks.js";
import { Icon } from "../../../shared/ui/Icon.jsx";
import { relativeTime } from "../../../shared/lib/visual.js";

function kindOf(text) {
  if (text.startsWith("Created")) return "create";
  if (text.startsWith("Deleted")) return "delete";
  if (text.startsWith("Moved") || text.startsWith("Started")) return "move";
  if (text.startsWith("Commented")) return "comment";
  if (text.startsWith("Assigned") || text.startsWith("Unassigned")) return "assign";
  return "edit";
}

export default function ActivityPanel() {
  const { t, lang } = useI18n();
  const q = useActivity();
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const now = q.dataUpdatedAt || 0;

  return (
    <section className="panel">
      <header className="panelHead">
        <h3 className="panelTitle">{t("activity")}</h3>
        <button
          type="button"
          className={`iconBtn iconBtn--sm ${q.isFetching && !q.isFetchingNextPage ? "spin" : ""}`}
          onClick={() => q.refetch()}
          disabled={q.isFetching}
          aria-label={t("refresh")}
          title={t("refresh")}
        >
          <Icon name="refresh" size={14} />
        </button>
      </header>

      {q.isPending ? (
        <div className="skeleton skeleton--card" />
      ) : items.length === 0 ? (
        <p className="muted">{t("noActivity")}</p>
      ) : (
        <ol className="timeline">
          {items.map((a) => (
            <li key={a.id} className={`timelineItem timelineItem--${kindOf(a.text)}`}>
              <span className="timelineDot" aria-hidden="true" />
              <span className="timelineText">{a.text}</span>
              <time className="timelineTs" dateTime={new Date(a.ts).toISOString()} title={new Date(a.ts).toLocaleString(lang)}>
                {relativeTime(a.ts, now, lang)}
              </time>
            </li>
          ))}
        </ol>
      )}

      {q.hasNextPage ? (
        <button
          type="button"
          className="btn btn--subtle btnBlock"
          onClick={() => q.fetchNextPage()}
          disabled={q.isFetchingNextPage}
        >
          {q.isFetchingNextPage ? "…" : t("loadMore")}
        </button>
      ) : null}
    </section>
  );
}
