import { describe, it, expect } from "vitest";
import {
  groupByStatus,
  rankSort,
  nextStatus,
  applyJob,
  applyPendingJobs,
  filterTasks,
  collectFacets,
  groupIntoLanes,
  sortTasks,
  sumPoints,
  hasActiveFilters,
  NO_FILTERS,
} from "./tasksSelectors.js";

const people = [
  { id: "u1", name: "Avery Chen" },
  { id: "u2", name: "Jordan Park" },
];

const tasks = [
  { id: "LR-1", title: "Write notes", type: "story", priority: "medium", status: "todo", assigneeId: "u1", points: 3, release: "R1", team: "PM", labels: ["docs"] },
  { id: "LR-2", title: "Run E2E", type: "task", priority: "highest", status: "review", assigneeId: "u2", points: 5, release: "R1", team: "QA", labels: ["testing", "blocking"] },
  { id: "LR-3", title: "XSS review", type: "bug", priority: "high", status: "done", assigneeId: null, points: null, release: "R2", team: "Security", labels: [] },
  { id: "LR-4", title: "Fix Safari", type: "bug", priority: "highest", status: "todo", assigneeId: "u2", points: 2, release: "", team: "Eng", labels: ["blocking"] },
];

describe("groupByStatus / rankSort / nextStatus", () => {
  it("buckets into all four workflow columns", () => {
    const g = groupByStatus([...tasks, { id: "x", status: "weird" }]);
    expect(Object.keys(g)).toEqual(["todo", "inprogress", "review", "done"]);
    expect(g.todo.map((t) => t.id)).toEqual(["LR-1", "LR-4"]);
    expect(g.inprogress).toEqual([]);
  });

  it("orders by priority, then key", () => {
    expect(rankSort(tasks).map((t) => t.id)).toEqual(["LR-2", "LR-4", "LR-3", "LR-1"]);
  });

  it("steps through statuses and clamps at the ends", () => {
    expect(nextStatus("todo", 1)).toBe("inprogress");
    expect(nextStatus("review", 1)).toBe("done");
    expect(nextStatus("done", 1)).toBe("done");
    expect(nextStatus("todo", -1)).toBe("todo");
  });
});

describe("applyJob / applyPendingJobs", () => {
  it("applies update, comment and delete without mutating input", () => {
    const updated = applyJob(tasks, { type: "update", payload: { id: "LR-1", patch: { status: "done", assigneeId: null } } });
    expect(updated[0]).toMatchObject({ status: "done", assigneeId: null, title: "Write notes" });
    expect(tasks[0].status).toBe("todo");

    const commented = applyJob(tasks, { type: "comment", payload: { id: "LR-2", comment: { id: "c", text: "hi" } } });
    expect(commented[1].comments).toEqual([{ id: "c", text: "hi" }]);

    expect(applyJob(tasks, { type: "delete", payload: { id: "LR-2" } })).toHaveLength(3);
  });

  it("still understands job types from older versions", () => {
    expect(applyJob(tasks, { type: "rename", payload: { id: "LR-1", title: "X" } })[0].title).toBe("X");
    expect(applyJob(tasks, { type: "status", payload: { id: "LR-1", status: "done" } })[0].status).toBe("done");
    expect(applyJob(tasks, { type: "nope", payload: {} })).toBe(tasks);
  });

  it("overlays queued jobs in order and flags them pending", () => {
    expect(applyPendingJobs(tasks, [])).toBe(tasks);
    const out = applyPendingJobs(tasks, [
      { type: "update", payload: { id: "LR-1", patch: { status: "review" } } },
      { type: "update", payload: { id: "LR-1", patch: { title: "Renamed" } } },
      { type: "delete", payload: { id: "LR-3" } },
    ]);
    expect(out).toHaveLength(3);
    expect(out[0]).toMatchObject({ status: "review", title: "Renamed", pending: true });
    expect(out[1].pending).toBeUndefined();
  });
});

describe("filterTasks", () => {
  const ids = (list) => list.map((t) => t.id);

  it("searches text, keys and labels case-insensitively", () => {
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, query: "xss" }))).toEqual(["LR-3"]);
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, query: "lr-2" }))).toEqual(["LR-2"]);
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, query: "BLOCKING" }))).toEqual(["LR-2", "LR-4"]);
  });

  it("filters by assignees (including unassigned), only-mine, type and label", () => {
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, assignees: ["u1", "unassigned"] }))).toEqual(["LR-1", "LR-3"]);
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, onlyMine: true }, "u2"))).toEqual(["LR-2", "LR-4"]);
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, type: "bug" }))).toEqual(["LR-3", "LR-4"]);
    expect(ids(filterTasks(tasks, { ...NO_FILTERS, type: "bug", label: "blocking" }))).toEqual(["LR-4"]);
  });

  it("knows when any filter is active", () => {
    expect(hasActiveFilters(NO_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...NO_FILTERS, onlyMine: true })).toBe(true);
    expect(hasActiveFilters({ ...NO_FILTERS, query: "  " })).toBe(false);
  });
});

describe("collectFacets / sumPoints", () => {
  it("returns sorted distinct labels, releases and teams", () => {
    expect(collectFacets(tasks)).toEqual({
      labels: ["blocking", "docs", "testing"],
      releases: ["R1", "R2"],
      teams: ["Eng", "PM", "QA", "Security"],
    });
  });

  it("sums story points, ignoring blanks", () => {
    expect(sumPoints(tasks)).toBe(10);
  });
});

describe("groupIntoLanes", () => {
  it("returns a single lane when not grouping", () => {
    const lanes = groupIntoLanes(tasks, "none", people);
    expect(lanes).toHaveLength(1);
    expect(lanes[0].patch).toBeNull();
  });

  it("groups by assignee with an Unassigned lane last, each carrying its patch", () => {
    const lanes = groupIntoLanes(tasks, "assignee", people);
    expect(lanes.map((l) => l.key)).toEqual(["u1", "u2", "unassigned"]);
    expect(lanes[1].tasks.map((t) => t.id)).toEqual(["LR-2", "LR-4"]);
    expect(lanes[2].patch).toEqual({ assigneeId: null });
  });

  it("groups by priority in priority order, skipping empty lanes", () => {
    expect(groupIntoLanes(tasks, "priority", people).map((l) => l.key)).toEqual(["highest", "high", "medium"]);
  });

  it("groups by release with 'no release' last", () => {
    expect(groupIntoLanes(tasks, "release", people).map((l) => l.key)).toEqual(["R1", "R2", "none"]);
  });
});

describe("sortTasks", () => {
  it("sorts by any column in either direction", () => {
    const ids = (list) => list.map((t) => t.id);
    expect(ids(sortTasks(tasks, { key: "priority", dir: "asc" }, people))).toEqual(["LR-2", "LR-4", "LR-3", "LR-1"]);
    expect(ids(sortTasks(tasks, { key: "points", dir: "desc" }, people))).toEqual(["LR-2", "LR-1", "LR-4", "LR-3"]);
    expect(ids(sortTasks(tasks, { key: "assignee", dir: "asc" }, people))).toEqual(["LR-1", "LR-2", "LR-4", "LR-3"]);
    expect(ids(sortTasks(tasks, { key: "status", dir: "asc" }, people))).toEqual(["LR-1", "LR-4", "LR-2", "LR-3"]);
  });
});
