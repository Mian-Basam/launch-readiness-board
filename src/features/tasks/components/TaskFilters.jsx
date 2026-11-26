import React from "react";
import { useI18n } from "../../../app/providers/hooks.js";
import { Icon } from "../../../shared/ui/Icon.jsx";
import { Avatar } from "../../../shared/ui/Avatar.jsx";
import { TYPES, NO_FILTERS, hasActiveFilters } from "../selectors/tasksSelectors.js";

function MiniSelect({ label, value, onChange, children }) {
  const id = React.useId();
  return (
    <div className={`selectWrap ${value && value !== "none" ? "selectWrap--active" : ""}`}>
      <label htmlFor={id} className="srOnly">{label}</label>
      <select id={id} className="select" value={value} onChange={(e) => onChange(e.target.value)}>
        {children}
      </select>
    </div>
  );
}

export function TaskFilters({
  filters,
  onChange,
  facets,
  people,
  shown,
  total,
  view,
  onViewChange,
  groupBy,
  onGroupByChange,
  searchRef,
}) {
  const { t } = useI18n();
  const searchId = React.useId();
  const set = (patch) => onChange({ ...filters, ...patch });

  function toggleAssignee(id) {
    const has = filters.assignees.includes(id);
    set({ assignees: has ? filters.assignees.filter((x) => x !== id) : [...filters.assignees, id] });
  }

  return (
    <div className="toolbar">
      <div className="toolbarLeft">
        <div className="searchBox">
          <Icon name="search" className="searchIcon" />
          <label htmlFor={searchId} className="srOnly">{t("searchLabel")}</label>
          <input
            ref={searchRef}
            id={searchId}
            type="search"
            className="searchInput"
            value={filters.query}
            onChange={(e) => set({ query: e.target.value })}
            placeholder={t("search")}
          />
          <kbd className="kbd searchKbd" aria-hidden="true">/</kbd>
        </div>

        <div className="avatarFilter" role="group" aria-label={t("assignee")}>
          {people.map((p) => (
            <button
              key={p.id}
              type="button"
              className="avatarToggle"
              aria-pressed={filters.assignees.includes(p.id)}
              aria-label={t("filterBy", { name: p.name })}
              title={p.name}
              onClick={() => toggleAssignee(p.id)}
            >
              <Avatar person={p} size={30} />
            </button>
          ))}
          <button
            type="button"
            className="avatarToggle"
            aria-pressed={filters.assignees.includes("unassigned")}
            aria-label={t("filterBy", { name: t("unassigned") })}
            title={t("unassigned")}
            onClick={() => toggleAssignee("unassigned")}
          >
            <Avatar person={null} size={30} />
          </button>
        </div>

        <button
          type="button"
          className="chipToggle"
          aria-pressed={filters.onlyMine}
          onClick={() => set({ onlyMine: !filters.onlyMine })}
        >
          {t("onlyMine")}
        </button>

        <MiniSelect label={t("type")} value={filters.type} onChange={(v) => set({ type: v })}>
          <option value="">{t("allTypes")}</option>
          {TYPES.map((ty) => <option key={ty} value={ty}>{t(ty)}</option>)}
        </MiniSelect>

        <MiniSelect label={t("labels")} value={filters.label} onChange={(v) => set({ label: v })}>
          <option value="">{t("allLabels")}</option>
          {facets.labels.map((l) => <option key={l} value={l}>{l}</option>)}
        </MiniSelect>

        {hasActiveFilters(filters) ? (
          <button type="button" className="btn btn--subtle" onClick={() => onChange(NO_FILTERS)}>
            <Icon name="x" size={14} />
            {t("clearFilters")}
          </button>
        ) : null}
      </div>

      <div className="toolbarRight">
        <span className="toolbarCount">{t("showing", { n: shown, total })}</span>
        {view === "board" ? (
          <div className="inlineField">
            <span className="inlineFieldLabel" aria-hidden="true">{t("groupBy")}</span>
            <MiniSelect label={t("groupBy")} value={groupBy} onChange={onGroupByChange}>
              <option value="none">{t("groupNone")}</option>
              <option value="assignee">{t("groupAssignee")}</option>
              <option value="priority">{t("groupPriority")}</option>
              <option value="release">{t("groupRelease")}</option>
            </MiniSelect>
          </div>
        ) : null}
        <div className="viewSwitch" role="group" aria-label={t("view")}>
          <button type="button" aria-pressed={view === "board"} onClick={() => onViewChange("board")}>
            <Icon name="board" size={15} />
            {t("board")}
          </button>
          <button type="button" aria-pressed={view === "list"} onClick={() => onViewChange("list")}>
            <Icon name="list" size={15} />
            {t("list")}
          </button>
        </div>
      </div>
    </div>
  );
}
