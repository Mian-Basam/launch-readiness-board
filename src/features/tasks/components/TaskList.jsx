import React from "react";
import { useI18n } from "../../../app/providers/hooks.js";
import { Icon } from "../../../shared/ui/Icon.jsx";
import { Avatar } from "../../../shared/ui/Avatar.jsx";
import { TypeIcon, PriorityIcon, StatusLozenge } from "./IssueIcons.jsx";
import { sortTasks } from "../selectors/tasksSelectors.js";
import { relativeTime } from "../../../shared/lib/visual.js";

const COLUMNS = [
  { key: "type", label: "type", className: "colType" },
  { key: "id", label: "key", className: "colKey" },
  { key: "title", label: "summary", className: "colSummary" },
  { key: "status", label: "status" },
  { key: "assignee", label: "assignee" },
  { key: "priority", label: "priority" },
  { key: "points", label: "pointsShort", className: "colNum" },
  { key: "updated", label: "updated" },
];

export function TaskList({ tasks, people, selectedId, onOpen }) {
  const { t, lang } = useI18n();
  const [sort, setSort] = React.useState({ key: "id", dir: "asc" });
  const rows = React.useMemo(() => sortTasks(tasks, sort, people), [tasks, sort, people]);
  const personFor = (id) => people.find((p) => p.id === id) ?? null;
  const [now] = React.useState(() => Date.now());

  function toggleSort(key) {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }

  if (rows.length === 0) return <div className="boardEmpty">{t("noMatches")}</div>;

  return (
    <div className="tableWrap">
      <table className="issueTable">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th
                key={c.key}
                className={c.className}
                aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
              >
                <button type="button" className="thBtn" onClick={() => toggleSort(c.key)}>
                  {t(c.label)}
                  <Icon
                    name={sort.key === c.key ? (sort.dir === "asc" ? "chevronUp" : "chevronDown") : "sort"}
                    size={12}
                    className={sort.key === c.key ? "" : "dim"}
                  />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((task) => {
            const person = personFor(task.assigneeId);
            return (
              <tr
                key={task.id}
                className={`${task.id === selectedId ? "rowSelected" : ""} ${task.pending ? "rowPending" : ""}`}
                onClick={() => onOpen(task.id)}
              >
                <td className="colType"><TypeIcon type={task.type} /></td>
                <td className="colKey"><span className="issueKey">{task.id}</span></td>
                <td className="colSummary">
                  <button type="button" className="rowLink" onClick={(e) => { e.stopPropagation(); onOpen(task.id); }}>
                    {task.title}
                  </button>
                </td>
                <td><StatusLozenge status={task.status} /></td>
                <td>
                  <span className="cellPerson">
                    <Avatar person={person} size={22} label={t("unassigned")} />
                    <span>{person ? person.name : t("unassigned")}</span>
                  </span>
                </td>
                <td>
                  <span className="cellPerson">
                    <PriorityIcon priority={task.priority} />
                    {t(task.priority || "medium")}
                  </span>
                </td>
                <td className="colNum">{task.points ?? "–"}</td>
                <td className="muted">{task.updatedAt ? relativeTime(task.updatedAt, now, lang) : "–"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
