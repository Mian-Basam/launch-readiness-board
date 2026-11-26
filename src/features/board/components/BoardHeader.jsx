import React from "react";
import { useI18n } from "../../../app/providers/hooks.js";
import { Button } from "../../../shared/ui/Button.jsx";
import { Icon } from "../../../shared/ui/Icon.jsx";
import { PresenceStack } from "../../presence/components/PresenceStack.jsx";
import { groupByStatus, sumPoints } from "../../tasks/selectors/tasksSelectors.js";

const DAY = 86400000;
const fmtDate = (ts, lang) => new Intl.DateTimeFormat(lang, { month: "short", day: "numeric" }).format(ts);

export function BoardHeader({ sprint, tasks, onCreate, onOpenActivity, onResetDemo }) {
  const { t, lang } = useI18n();
  const [now] = React.useState(() => Date.now());
  const g = groupByStatus(tasks);
  const total = sumPoints(tasks);
  const done = sumPoints(g.done);
  const active = sumPoints(g.inprogress) + sumPoints(g.review);
  const pct = (n) => (total ? (n / total) * 100 : 0);

  let daysText = "";
  if (sprint) {
    const days = Math.ceil((sprint.end - now) / DAY);
    daysText = days <= 0 ? t("sprintEnded") : days === 1 ? t("dayLeft") : t("daysLeft", { n: days });
  }

  return (
    <div className="boardHeader">
      <nav className="crumbs" aria-label="Breadcrumb">
        <span>{t("projects")}</span>
        <span aria-hidden="true">/</span>
        <span>{t("project")}</span>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t("board")}</span>
      </nav>

      <div className="boardHeaderRow">
        <div className="boardHeaderTitle">
          <h1 className="pageTitle">{sprint ? `LR ${sprint.name}` : t("board")}</h1>
          {sprint ? <p className="pageSub">{sprint.goal}</p> : null}
        </div>

        <div className="boardHeaderActions">
          {sprint ? (
            <span className="sprintDates" title={`${fmtDate(sprint.start, lang)} – ${fmtDate(sprint.end, lang)}`}>
              <Icon name="calendar" size={15} />
              {fmtDate(sprint.start, lang)} – {fmtDate(sprint.end, lang)}
              <span className="sprintDaysLeft">{daysText}</span>
            </span>
          ) : null}
          <PresenceStack />
          <button type="button" className="iconBtn" onClick={onResetDemo} aria-label={t("resetDemo")} title={t("resetDemo")}>
            <Icon name="reset" />
          </button>
          <Button variant="ghost" onClick={onOpenActivity}>
            <Icon name="activity" size={15} />
            {t("activity")}
          </Button>
          <Button onClick={onCreate} title="C">
            <Icon name="plus" size={15} />
            {t("create")}
          </Button>
        </div>
      </div>

      <div className="sprintProgress">
        <div
          className="progress"
          role="progressbar"
          aria-label={t("sprintProgress")}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(pct(done))}
        >
          <div className="progressSeg progressSeg--done" style={{ width: `${pct(done)}%` }} />
          <div className="progressSeg progressSeg--active" style={{ width: `${pct(active)}%` }} />
        </div>
        <span className="sprintProgressText">{t("pointsDone", { done, total })}</span>
      </div>
    </div>
  );
}
