import React from "react";
import { useSearchParams } from "react-router-dom";
import { useI18n, useSync } from "../../../app/providers/hooks.js";
import { Button } from "../../../shared/ui/Button.jsx";
import { Icon } from "../../../shared/ui/Icon.jsx";
import { Overlay } from "../../../shared/ui/Overlay.jsx";
import { ErrorBoundary } from "../../../shared/ui/ErrorBoundary.jsx";
import { readPref, writePref } from "../../../shared/lib/storage.js";
import { PEOPLE, ME_ID } from "../../../mocks/people.js";
import { PresenceBar } from "../../presence/components/PresenceBar.jsx";
import { useTasksQuery, useSprintQuery, useTaskActions } from "../../tasks/hooks/useTasks.js";
import {
  applyPendingJobs,
  filterTasks,
  collectFacets,
  hasActiveFilters,
  NO_FILTERS,
} from "../../tasks/selectors/tasksSelectors.js";
import { TaskBoard } from "../../tasks/components/TaskBoard.jsx";
import { TaskList } from "../../tasks/components/TaskList.jsx";
import { TaskComposer } from "../../tasks/components/TaskComposer.jsx";
import { TaskDetails } from "../../tasks/components/TaskDetails.jsx";
import { TaskFilters } from "../../tasks/components/TaskFilters.jsx";
import { BoardHeader } from "./BoardHeader.jsx";

const ActivityPanel = React.lazy(() => import("../../activity/components/ActivityPanel.jsx"));

const EMPTY = [];

function BoardSkeleton() {
  return (
    <div className="board" aria-hidden="true">
      <div className="laneRow">
        {[3, 2, 2, 1].map((n, i) => (
          <div key={i} className="boardCol">
            {Array.from({ length: n }, (_, j) => (
              <div key={j} className="skeleton skeleton--card" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function isTypingTarget(el) {
  return el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

export function BoardPage() {
  const { t } = useI18n();
  const { queue } = useSync();

  // The open issue lives in the URL (?issue=LR-102) so it can be linked and survives reloads.
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get("issue");
  const setSelectedId = React.useCallback(
    (id) =>
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        if (id) next.set("issue", id);
        else next.delete("issue");
        return next;
      }),
    [setSearchParams]
  );
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [activityOpen, setActivityOpen] = React.useState(false);
  const [filters, setFilters] = React.useState(NO_FILTERS);
  const [view, setView] = React.useState(() => readPref("view", "board", ["board", "list"]));
  const [groupBy, setGroupBy] = React.useState(() =>
    readPref("groupBy", "none", ["none", "assignee", "priority", "release"])
  );
  const deferredFilters = React.useDeferredValue(filters);
  const searchRef = React.useRef(null);

  const tasksQ = useTasksQuery();
  const sprintQ = useSprintQuery();
  const actions = useTaskActions();
  const serverTasks = tasksQ.data ?? EMPTY;

  // Server data + any changes still waiting in the offline queue.
  const tasks = React.useMemo(() => applyPendingJobs(serverTasks, queue), [serverTasks, queue]);
  const facets = React.useMemo(() => collectFacets(tasks), [tasks]);
  const visible = React.useMemo(() => filterTasks(tasks, deferredFilters, ME_ID), [tasks, deferredFilters]);
  const selectedTask = tasks.find((x) => x.id === selectedId) ?? null;

  const closeDetails = React.useCallback(() => setSelectedId(null), [setSelectedId]);
  const closeComposer = React.useCallback(() => setComposerOpen(false), []);
  const closeActivity = React.useCallback(() => setActivityOpen(false), []);
  const overlayOpen = Boolean(selectedTask || composerOpen || activityOpen);

  function changeView(v) {
    setView(v);
    writePref("view", v);
  }
  function changeGroupBy(g) {
    setGroupBy(g);
    writePref("groupBy", g);
  }

  // Keyboard shortcuts: "c" creates an issue, "/" focuses search.
  React.useEffect(() => {
    function onKey(e) {
      if (overlayOpen || e.metaKey || e.ctrlKey || e.altKey || isTypingTarget(e.target)) return;
      if (e.key === "c" || e.key === "C") {
        e.preventDefault();
        setComposerOpen(true);
      } else if (e.key === "/") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [overlayOpen]);

  function onDelete(id) {
    if (id === selectedId) setSelectedId(null);
    actions.remove(id);
  }

  function onResetDemo() {
    if (window.confirm(t("confirmReset"))) {
      setSelectedId(null);
      actions.resetDemo();
    }
  }

  let content;
  if (tasksQ.isPending && tasksQ.fetchStatus === "paused") {
    content = <div className="notice">{t("waitingForNetwork")}</div>;
  } else if (tasksQ.isPending) {
    content = (
      <>
        <span className="srOnly">{t("loading")}</span>
        <BoardSkeleton />
      </>
    );
  } else if (tasksQ.isError) {
    content = (
      <div className="notice notice--error" role="alert">
        <span>{t("loadFailed")}</span>
        <Button variant="ghost" onClick={() => tasksQ.refetch()}>
          <Icon name="refresh" size={14} />
          {t("retry")}
        </Button>
      </div>
    );
  } else if (view === "list") {
    content = <TaskList tasks={visible} people={PEOPLE} selectedId={selectedId} onOpen={setSelectedId} />;
  } else {
    content = (
      <TaskBoard
        tasks={visible}
        allTasks={tasks}
        groupBy={groupBy}
        people={PEOPLE}
        selectedId={selectedId}
        onOpen={setSelectedId}
        onUpdate={actions.update}
        onCreate={(fields) => actions.create(fields)}
        canCreate={actions.isOnline}
        isFiltered={hasActiveFilters(filters)}
      />
    );
  }

  return (
    <div className="page">
      <BoardHeader
        sprint={sprintQ.data}
        tasks={tasks}
        onCreate={() => setComposerOpen(true)}
        onOpenActivity={() => setActivityOpen(true)}
        onResetDemo={onResetDemo}
      />

      {!actions.isOnline ? (
        <div className="notice notice--warn">
          <Icon name="wifiOff" />
          {t("offlineHint")}
        </div>
      ) : null}

      <TaskFilters
        filters={filters}
        onChange={setFilters}
        facets={facets}
        people={PEOPLE}
        shown={visible.length}
        total={tasks.length}
        view={view}
        onViewChange={changeView}
        groupBy={groupBy}
        onGroupByChange={changeGroupBy}
        searchRef={searchRef}
      />

      {content}

      <p className="hint">
        {view === "board" ? `${t("moveHint")} ` : ""}
        {t("shortcuts")}
      </p>

      {selectedTask ? (
        <TaskDetails
          key={selectedTask.id}
          task={selectedTask}
          people={PEOPLE}
          meId={ME_ID}
          onClose={closeDetails}
          onUpdate={actions.update}
          onComment={actions.comment}
          onDelete={onDelete}
        />
      ) : null}

      {composerOpen ? (
        <TaskComposer
          onCreate={actions.create}
          isCreating={actions.isCreating}
          isOnline={actions.isOnline}
          onClose={closeComposer}
          people={PEOPLE}
          defaultRelease={sprintQ.data?.release}
          facets={facets}
        />
      ) : null}

      {activityOpen ? (
        <Overlay variant="drawer" title={t("teamActivity")} onClose={closeActivity} closeLabel={t("close")} focusFirstField={false}>
          <PresenceBar />
          <ErrorBoundary fallback={t("failed")} retryLabel={t("tryAgain")}>
            <React.Suspense fallback={<div className="skeleton skeleton--card" />}>
              <ActivityPanel />
            </React.Suspense>
          </ErrorBoundary>
        </Overlay>
      ) : null}
    </div>
  );
}
