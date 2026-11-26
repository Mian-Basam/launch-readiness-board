export const STATUSES = ["todo", "inprogress", "review", "done"];
export const PRIORITIES = ["highest", "high", "medium", "low"];
export const TYPES = ["story", "task", "bug"];
/** Max issues per column before the column is flagged as over its limit. */
export const WIP_LIMITS = { inprogress: 3, review: 2 };

const keyNum = (id) => Number(String(id).split("-")[1]) || 0;
const priorityRank = (p) => {
  const i = PRIORITIES.indexOf(p);
  return i === -1 ? PRIORITIES.length : i;
};

export function groupByStatus(tasks) {
  const out = Object.fromEntries(STATUSES.map((s) => [s, []]));
  for (const t of tasks) {
    if (out[t.status]) out[t.status].push(t);
  }
  return out;
}

/** Board order inside a column: highest priority first, then oldest key. */
export function rankSort(tasks) {
  return [...tasks].sort(
    (a, b) => priorityRank(a.priority) - priorityRank(b.priority) || keyNum(a.id) - keyNum(b.id)
  );
}

export function nextStatus(status, step) {
  const i = STATUSES.indexOf(status);
  const j = Math.min(STATUSES.length - 1, Math.max(0, i + step));
  return STATUSES[j];
}

/** Applies one mutation to a task list without mutating it. */
export function applyJob(tasks, job) {
  const { type, payload } = job;
  const patchOne = (fn) => tasks.map((t) => (t.id === payload.id ? fn(t) : t));
  switch (type) {
    case "update":
      return patchOne((t) => ({ ...t, ...payload.patch }));
    case "comment":
      return patchOne((t) => ({ ...t, comments: [...(t.comments || []), payload.comment] }));
    case "delete":
      return tasks.filter((t) => t.id !== payload.id);
    // Job types written by older versions of the app.
    case "rename":
      return patchOne((t) => ({ ...t, title: payload.title }));
    case "status":
      return patchOne((t) => ({ ...t, status: payload.status }));
    default:
      return tasks;
  }
}

/** Overlays queued offline jobs on server data and flags the affected tasks as pending. */
export function applyPendingJobs(tasks, jobs) {
  if (jobs.length === 0) return tasks;
  const pendingIds = new Set(jobs.map((j) => j.payload.id));
  return jobs
    .reduce(applyJob, tasks)
    .map((t) => (pendingIds.has(t.id) ? { ...t, pending: true } : t));
}

export const NO_FILTERS = { query: "", assignees: [], onlyMine: false, type: "", label: "" };

export function hasActiveFilters(f) {
  return Boolean(f.query.trim() || f.assignees.length || f.onlyMine || f.type || f.label);
}

export function filterTasks(tasks, filters = NO_FILTERS, meId = null) {
  const { query = "", assignees = [], onlyMine = false, type = "", label = "" } = filters;
  const q = query.trim().toLowerCase();
  return tasks.filter((x) => {
    if (onlyMine && x.assigneeId !== meId) return false;
    if (assignees.length && !assignees.includes(x.assigneeId ?? "unassigned")) return false;
    if (type && x.type !== type) return false;
    if (label && !(x.labels || []).includes(label)) return false;
    if (!q) return true;
    const blob = [x.id, x.title, x.description, x.acceptance, x.release, x.team, ...(x.labels || []), x.type]
      .join(" ")
      .toLowerCase();
    return blob.includes(q);
  });
}

/** Distinct, sorted values for filter dropdowns and field suggestions. */
export function collectFacets(tasks) {
  const labels = new Set();
  const releases = new Set();
  const teams = new Set();
  for (const t of tasks) {
    for (const l of t.labels || []) labels.add(l);
    if (t.release) releases.add(t.release);
    if (t.team) teams.add(t.team);
  }
  const sorted = (s) => [...s].sort((a, b) => a.localeCompare(b));
  return { labels: sorted(labels), releases: sorted(releases), teams: sorted(teams) };
}

/**
 * Splits tasks into swimlanes. Each lane carries the patch that moving a card
 * into it should apply (e.g. dropping into "Jordan" assigns the issue to Jordan).
 */
export function groupIntoLanes(tasks, groupBy, people = []) {
  if (groupBy === "assignee") {
    const lanes = people
      .map((p) => ({
        key: p.id,
        title: p.name,
        person: p,
        patch: { assigneeId: p.id },
        tasks: tasks.filter((t) => t.assigneeId === p.id),
      }))
      .filter((l) => l.tasks.length > 0);
    const unassigned = tasks.filter((t) => !t.assigneeId || !people.some((p) => p.id === t.assigneeId));
    if (unassigned.length) {
      lanes.push({ key: "unassigned", title: null, person: null, patch: { assigneeId: null }, tasks: unassigned });
    }
    return lanes;
  }
  if (groupBy === "priority") {
    return PRIORITIES.map((p) => ({
      key: p,
      title: p,
      priority: p,
      patch: { priority: p },
      tasks: tasks.filter((t) => (t.priority || "medium") === p),
    })).filter((l) => l.tasks.length > 0);
  }
  if (groupBy === "release") {
    const names = [...new Set(tasks.map((t) => t.release || ""))].sort((a, b) =>
      a === "" ? 1 : b === "" ? -1 : a.localeCompare(b)
    );
    return names.map((r) => ({
      key: r || "none",
      title: r || null,
      patch: { release: r },
      tasks: tasks.filter((t) => (t.release || "") === r),
    }));
  }
  return [{ key: "all", title: null, patch: null, tasks }];
}

export function sumPoints(tasks) {
  return tasks.reduce((s, t) => s + (Number(t.points) || 0), 0);
}

/** Sorting for the list view. */
export function sortTasks(tasks, { key = "id", dir = "asc" } = {}, people = []) {
  const name = (id) => people.find((p) => p.id === id)?.name ?? "￿";
  const val = {
    id: (t) => keyNum(t.id),
    title: (t) => t.title.toLowerCase(),
    type: (t) => TYPES.indexOf(t.type),
    status: (t) => STATUSES.indexOf(t.status),
    assignee: (t) => name(t.assigneeId),
    priority: (t) => priorityRank(t.priority),
    points: (t) => (t.points == null ? -1 : Number(t.points)),
    updated: (t) => t.updatedAt || 0,
  }[key] ?? ((t) => keyNum(t.id));
  const sign = dir === "desc" ? -1 : 1;
  return [...tasks].sort((a, b) => {
    const va = val(a);
    const vb = val(b);
    if (va < vb) return -sign;
    if (va > vb) return sign;
    return keyNum(a.id) - keyNum(b.id);
  });
}
