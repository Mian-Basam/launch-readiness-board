import { db, persist, resetDb, nextTaskId } from "../mocks/db.js";
import { ME_ID, personById } from "../mocks/people.js";

// Simulated network latency (disabled under test) and a 20% failure rate on
// title edits, so the optimistic-rollback path can be seen in action.
const IS_TEST = import.meta.env.MODE === "test";
const sleep = (ms) => new Promise((r) => setTimeout(r, IS_TEST ? 0 : ms));
const maybeFail = () => Math.random() < 0.2;

const STATUS_LABEL = { todo: "To Do", inprogress: "In Progress", review: "In Review", done: "Done" };
const EDITABLE = [
  "title", "status", "type", "priority", "assigneeId", "points",
  "release", "team", "labels", "description", "acceptance",
];

let seq = 0;
function log(text) {
  db.activity.unshift({ id: `a${Date.now()}_${seq++}`, text, ts: Date.now() });
}

const clone = (t) => ({ ...t, labels: [...(t.labels || [])], comments: (t.comments || []).map((c) => ({ ...c })) });

function pickEditable(obj) {
  const out = {};
  for (const k of EDITABLE) if (k in obj) out[k] = obj[k];
  return out;
}

function describeChange(id, patch) {
  const keys = Object.keys(patch);
  if (keys.length === 1 && keys[0] === "status") return `Moved ${id} → ${STATUS_LABEL[patch.status] ?? patch.status}`;
  if (keys.length === 1 && keys[0] === "assigneeId") {
    const p = personById(patch.assigneeId);
    return p ? `Assigned ${id} to ${p.name}` : `Unassigned ${id}`;
  }
  if (keys.length === 1 && keys[0] === "title") return `Renamed ${id}`;
  return `Updated ${keys.join(", ")} on ${id}`;
}

export async function server_getSprint() {
  await sleep(150);
  return { ...db.sprint };
}

export async function server_listTasks() {
  await sleep(450);
  return { tasks: db.tasks.map(clone) };
}

export async function server_createTask(payload) {
  await sleep(350);
  const title = payload.title?.trim();
  if (!title) throw new Error("A summary is required");

  const now = Date.now();
  const task = {
    type: "task",
    status: "todo",
    priority: "medium",
    assigneeId: null,
    points: null,
    release: db.sprint?.release ?? "",
    team: "",
    labels: [],
    description: "",
    acceptance: "",
    ...pickEditable(payload),
    title,
    id: nextTaskId(),
    reporterId: ME_ID,
    comments: [],
    createdAt: now,
    updatedAt: now,
  };

  db.tasks.unshift(task);
  log(`Created ${task.id}`);
  persist();
  return { task: clone(task) };
}

export async function server_updateTask({ id, patch }) {
  await sleep(320);
  const clean = pickEditable(patch || {});
  if ("title" in clean && maybeFail()) {
    const err = new Error("Simulated server failure");
    err.code = "SIM_FAIL";
    throw err;
  }

  const t = db.tasks.find((x) => x.id === id);
  if (!t) return { ok: false };
  const changed = Object.fromEntries(
    Object.entries(clean).filter(([k, v]) => JSON.stringify(t[k]) !== JSON.stringify(v))
  );
  if (Object.keys(changed).length === 0) return { ok: false };

  Object.assign(t, changed, { updatedAt: Date.now() });
  log(describeChange(id, changed));
  persist();
  return { ok: true };
}

export async function server_addComment({ id, comment }) {
  await sleep(300);
  const t = db.tasks.find((x) => x.id === id);
  if (!t || !comment?.text?.trim()) return { ok: false };
  t.comments = [...(t.comments || []), { ...comment, text: comment.text.trim() }];
  t.updatedAt = Date.now();
  log(`Commented on ${id}`);
  persist();
  return { ok: true };
}

export async function server_deleteTask({ id }) {
  await sleep(300);
  const before = db.tasks.length;
  db.tasks = db.tasks.filter((x) => x.id !== id);
  if (db.tasks.length === before) return { ok: false };
  log(`Deleted ${id}`);
  persist();
  return { ok: true };
}

export async function server_resetDemo() {
  await sleep(200);
  resetDb();
  return { ok: true };
}

export async function server_activityPage({ cursor = 0, limit = 10 }) {
  await sleep(380);
  const end = cursor + limit;
  const items = db.activity.slice(cursor, end);
  const nextCursor = end < db.activity.length ? end : null;
  return { items, nextCursor };
}
