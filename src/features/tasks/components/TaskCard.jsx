import React from "react";
import { useI18n } from "../../../app/providers/hooks.js";
import { Icon } from "../../../shared/ui/Icon.jsx";
import { Avatar } from "../../../shared/ui/Avatar.jsx";
import { TypeIcon, PriorityIcon } from "./IssueIcons.jsx";
import { nextStatus } from "../selectors/tasksSelectors.js";

export const DRAG_MIME = "application/x-task-id";

export function IssueCard({ task, assignee, selected, onOpen, onMove }) {
  const { t } = useI18n();
  const [dragging, setDragging] = React.useState(false);

  function onDragStart(e) {
    e.dataTransfer.setData(DRAG_MIME, task.id);
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
    setDragging(true);
  }

  function onKeyDown(e) {
    if (!e.altKey || (e.key !== "ArrowRight" && e.key !== "ArrowLeft")) return;
    e.preventDefault();
    const rtl = document.documentElement.dir === "rtl";
    const step = (e.key === "ArrowRight") !== rtl ? 1 : -1;
    const to = nextStatus(task.status, step);
    if (to !== task.status) onMove(task.id, to);
  }

  const comments = task.comments?.length ?? 0;
  const cls = [
    "issueCard",
    selected && "issueCard--selected",
    task.pending && "issueCard--pending",
    dragging && "issueCard--dragging",
    task.status === "done" && "issueCard--done",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <article className={cls} draggable onDragStart={onDragStart} onDragEnd={() => setDragging(false)}>
      <button
        type="button"
        className="issueCardBtn"
        onClick={() => onOpen(task.id)}
        onKeyDown={onKeyDown}
        aria-keyshortcuts="Alt+ArrowLeft Alt+ArrowRight"
        aria-pressed={selected}
      >
        <span className="issueTitle">{task.title}</span>

        {task.release || task.labels?.length ? (
          <span className="issueTags">
            {task.release ? <span className="epicTag">{task.release}</span> : null}
            {task.labels?.slice(0, 2).map((l) => (
              <span key={l} className="label">
                {l}
              </span>
            ))}
            {task.labels?.length > 2 ? <span className="label">+{task.labels.length - 2}</span> : null}
          </span>
        ) : null}

        <span className="issueFoot">
          <TypeIcon type={task.type} />
          <span className="issueKey">{task.id}</span>
          {task.pending ? (
            <span className="pendingTag" title={t("pending")}>
              <Icon name="clock" size={12} />
              <span className="srOnly">{t("pending")}</span>
            </span>
          ) : null}
          <span className="issueFootEnd">
            {comments > 0 ? (
              <span className="metaIcon" title={t("commentsCount", { n: comments })}>
                <Icon name="message" size={13} />
                {comments}
              </span>
            ) : null}
            <PriorityIcon priority={task.priority} />
            {task.points != null && task.points !== "" ? (
              <span className="pointsBadge" title={t("points")}>
                {task.points}
              </span>
            ) : null}
            <Avatar person={assignee} size={22} label={t("unassigned")} />
          </span>
        </span>
      </button>
    </article>
  );
}
