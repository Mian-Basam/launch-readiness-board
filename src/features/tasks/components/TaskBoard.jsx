import React from "react";
import { IssueCard, DRAG_MIME } from "./TaskCard.jsx";
import { InlineCreate } from "./InlineCreate.jsx";
import { PriorityIcon } from "./IssueIcons.jsx";
import {
  groupByStatus,
  groupIntoLanes,
  rankSort,
  sumPoints,
  STATUSES,
  WIP_LIMITS,
} from "../selectors/tasksSelectors.js";
import { useI18n } from "../../../app/providers/hooks.js";
import { Icon } from "../../../shared/ui/Icon.jsx";
import { Avatar } from "../../../shared/ui/Avatar.jsx";

function LaneTitle({ lane, groupBy }) {
  const { t } = useI18n();
  if (groupBy === "assignee") {
    return (
      <>
        <Avatar person={lane.person} size={22} label={t("unassigned")} />
        <span>{lane.person ? lane.person.name : t("unassigned")}</span>
      </>
    );
  }
  if (groupBy === "priority") {
    return (
      <>
        <PriorityIcon priority={lane.priority} />
        <span>{t(lane.priority)}</span>
      </>
    );
  }
  return <span>{lane.title ?? t("noRelease")}</span>;
}

export function TaskBoard({
  tasks,
  allTasks,
  groupBy,
  people,
  selectedId,
  onOpen,
  onUpdate,
  onCreate,
  canCreate,
  isFiltered,
}) {
  const { t } = useI18n();
  const [over, setOver] = React.useState(null);
  const [collapsed, setCollapsed] = React.useState(() => new Set());

  const lanes = React.useMemo(() => groupIntoLanes(tasks, groupBy, people), [tasks, groupBy, people]);
  const columnTotals = React.useMemo(() => groupByStatus(tasks), [tasks]);
  const wipTotals = React.useMemo(() => groupByStatus(allTasks), [allTasks]);
  const personFor = (id) => people.find((p) => p.id === id) ?? null;
  const grouped = groupBy !== "none";

  function toggleLane(key) {
    setCollapsed((s) => {
      const next = new Set(s);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function dropHandlers(status, lane) {
    const cellKey = `${lane.key}:${status}`;
    return {
      onDragOver: (e) => {
        if (!e.dataTransfer.types.includes(DRAG_MIME)) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (over !== cellKey) setOver(cellKey);
      },
      onDragLeave: (e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) setOver(null);
      },
      onDrop: (e) => {
        e.preventDefault();
        setOver(null);
        const id = e.dataTransfer.getData(DRAG_MIME);
        const task = allTasks.find((x) => x.id === id);
        if (!task) return;
        const patch = {};
        if (task.status !== status) patch.status = status;
        for (const [k, v] of Object.entries(lane.patch ?? {})) {
          if ((task[k] ?? null) !== v) patch[k] = v;
        }
        onUpdate(id, patch);
      },
    };
  }

  return (
    <div className="board" style={{ "--cols": STATUSES.length }}>
      <div className="boardHead">
        {STATUSES.map((status) => {
          const limit = WIP_LIMITS[status];
          const overLimit = limit != null && wipTotals[status].length > limit;
          return (
            <div key={status} className={`colHead ${overLimit ? "colHead--over" : ""}`}>
              <span className={`statusDot statusDot--${status}`} aria-hidden="true" />
              <span className="colHeadTitle">{t(status)}</span>
              <span className="count">{columnTotals[status].length}</span>
              {limit != null ? (
                <span className="wip" title={overLimit ? t("wipOver", { n: limit }) : undefined}>
                  {t("wipLimit", { n: limit })}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {lanes.length === 0 ? <div className="boardEmpty">{t("noMatches")}</div> : null}

      {lanes.map((lane) => {
        const isCollapsed = collapsed.has(lane.key);
        const byStatus = groupByStatus(rankSort(lane.tasks));
        const laneName = lane.person?.name ?? (lane.priority ? t(lane.priority) : lane.title) ?? t("unassigned");
        return (
          <div key={lane.key} className="lane">
            {grouped ? (
              <button
                type="button"
                className="laneHead"
                onClick={() => toggleLane(lane.key)}
                aria-expanded={!isCollapsed}
                aria-label={t(isCollapsed ? "expand" : "collapse", { name: laneName })}
              >
                <Icon name={isCollapsed ? "chevronRight" : "chevronDown"} size={14} className="flipRtl" />
                <LaneTitle lane={lane} groupBy={groupBy} />
                <span className="laneMeta">
                  {t("issues", { n: lane.tasks.length })} · {sumPoints(lane.tasks)} {t("pointsShort").toLowerCase()}
                </span>
              </button>
            ) : null}

            {!isCollapsed ? (
              <div className="laneRow">
                {STATUSES.map((status) => {
                  const cellKey = `${lane.key}:${status}`;
                  const cards = byStatus[status];
                  return (
                    <section
                      key={status}
                      className={`boardCol ${over === cellKey ? "boardCol--over" : ""}`}
                      aria-label={grouped ? `${t(status)} · ${laneName}` : t(status)}
                      {...dropHandlers(status, lane)}
                    >
                      {cards.map((task) => (
                        <IssueCard
                          key={task.id}
                          task={task}
                          assignee={personFor(task.assigneeId)}
                          selected={task.id === selectedId}
                          onOpen={onOpen}
                          onMove={(id, to) => onUpdate(id, { status: to })}
                        />
                      ))}
                      {cards.length === 0 && !grouped ? (
                        <div className="emptyCol">{isFiltered ? t("noMatches") : t("emptyColumn")}</div>
                      ) : null}
                      <InlineCreate
                        onCreate={(fields) => onCreate({ ...fields, status, ...(lane.patch ?? {}) })}
                        disabled={!canCreate}
                        disabledReason={t("createOffline")}
                      />
                    </section>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
