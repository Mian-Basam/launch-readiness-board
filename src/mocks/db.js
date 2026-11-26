// In-memory mock database, persisted to localStorage so changes survive reloads.
const KEY = "ci_ops_mock_db_v2";
const LEGACY_KEYS = ["ci_ops_mock_db_v1"];
const DAY = 86400000;

function issue(n, fields, ageDays, now) {
  const createdAt = now - ageDays * DAY;
  return {
    id: `LR-${n}`,
    type: "task",
    priority: "medium",
    assigneeId: null,
    reporterId: "u1",
    points: null,
    release: "Release 2.7",
    team: "",
    labels: [],
    description: "",
    acceptance: "",
    comments: [],
    createdAt,
    updatedAt: createdAt + DAY / 2,
    ...fields,
  };
}

function seed() {
  const now = Date.now();
  return {
    sprint: {
      name: "Sprint 14",
      release: "Release 2.7",
      goal: "Ship Release 2.7 to 10% of customers with zero blocking bugs.",
      start: now - 6 * DAY,
      end: now + 8 * DAY,
    },
    tasks: [
      issue(101, {
        type: "story", priority: "high", status: "todo", assigneeId: "u1", points: 3,
        title: "Draft and approve release notes for Release 2.7",
        team: "Product Management", labels: ["docs", "launch"],
        description: "Collect merged changes since 2.6 and write customer-facing release notes.",
        acceptance: "Changelog reviewed by Support and Marketing, and published to the docs site.",
      }, 6, now),
      issue(102, {
        type: "task", priority: "highest", status: "review", assigneeId: "u2", points: 5,
        title: "Verify checkout flow on mobile + desktop (E2E)",
        team: "Quality Assurance", labels: ["testing", "blocking"],
        description: "Run the end-to-end checkout suite on iOS Safari, Android Chrome and desktop browsers.",
        acceptance: "Green test run with the report attached to this issue.",
        comments: [
          { id: "c1", authorId: "u4", text: "Safari payment fix is in progress (LR-104). Retest after it lands.", ts: now - DAY },
        ],
      }, 5, now),
      issue(103, {
        type: "task", priority: "high", status: "done", assigneeId: "u3", points: 3,
        title: "Review user-generated content rendering for XSS safety",
        team: "Security", labels: ["security"],
        description: "Audit every place that renders user-provided HTML or markdown.",
        acceptance: "XSS mitigations verified, with no unsafe HTML sinks left.",
      }, 6, now),
      issue(104, {
        type: "bug", priority: "highest", status: "inprogress", assigneeId: "u4", reporterId: "u2", points: 2,
        title: "Payment button unresponsive on Safari 17",
        team: "Engineering", labels: ["payments", "blocking"],
        description: "Tapping “Pay now” does nothing on Safari 17. The click handler never fires.",
        acceptance: "Payment completes on Safari 17 (macOS and iOS).",
      }, 3, now),
      issue(105, {
        type: "story", priority: "medium", status: "todo", assigneeId: "u4", points: 5,
        title: "Add in-app “What's new” banner",
        team: "Engineering", labels: ["launch", "ui"],
        description: "Show a dismissible banner that links to the 2.7 release notes.",
        acceptance: "Banner shows once per user and can be dismissed.",
      }, 4, now),
      issue(106, {
        type: "task", priority: "high", status: "inprogress", assigneeId: "u2", points: 3,
        title: "Load test checkout API at 3x peak traffic",
        team: "Quality Assurance", labels: ["performance"],
        description: "Replay production traffic at 3x volume against staging.",
        acceptance: "p95 latency under 400 ms and error rate under 0.1%.",
      }, 4, now),
      issue(107, {
        type: "bug", priority: "low", status: "todo", reporterId: "u2", points: 1,
        title: "Release notes page shows wrong version number",
        team: "Product Management", labels: ["docs"],
        description: "The header says 2.6 on the 2.7 notes page.",
      }, 2, now),
      issue(108, {
        type: "task", priority: "medium", status: "review", assigneeId: "u3", points: 2,
        title: "Rotate API keys for the payments provider",
        team: "Security", labels: ["security"],
        description: "Rotate the live keys before launch and update the secrets manager.",
      }, 3, now),
      issue(109, {
        type: "story", priority: "medium", status: "done", assigneeId: "u1", points: 2,
        title: "Prepare launch announcement email",
        team: "Product Management", labels: ["launch", "marketing"],
      }, 6, now),
      issue(110, {
        type: "task", priority: "high", status: "todo", assigneeId: "u4", points: 1,
        title: "Enable feature flag for 10% rollout",
        team: "Engineering", labels: ["rollout"],
        description: "Configure the rollout percentage and the kill switch.",
      }, 1, now),
    ],
    activity: [
      { id: "a2", text: "Moved LR-103 → Done", ts: now - 45000 },
      { id: "a1", text: "Started Sprint 14", ts: now - 6 * DAY },
    ],
  };
}

function load() {
  try {
    for (const k of LEGACY_KEYS) localStorage.removeItem(k);
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.tasks) && Array.isArray(parsed?.activity) && parsed?.sprint) return parsed;
    }
  } catch {
    // Storage unavailable or corrupt: fall back to seed data.
  }
  return seed();
}

export const db = load();

export function persist() {
  try {
    localStorage.setItem(KEY, JSON.stringify(db));
  } catch {
    // Storage unavailable: keep working in memory only.
  }
}

export function resetDb() {
  const fresh = seed();
  db.sprint = fresh.sprint;
  db.tasks = fresh.tasks;
  db.activity = fresh.activity;
  persist();
}

/** Monotonic key: one higher than the largest existing number, so keys never collide. */
export function nextTaskId() {
  const max = db.tasks.reduce((m, t) => Math.max(m, Number(t.id.split("-")[1]) || 0), 100);
  return `LR-${max + 1}`;
}
