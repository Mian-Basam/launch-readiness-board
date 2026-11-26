import { describe, it, expect, beforeEach, vi } from "vitest";
import { db, resetDb } from "../mocks/db.js";
import {
  server_listTasks,
  server_createTask,
  server_updateTask,
  server_addComment,
  server_deleteTask,
  server_activityPage,
  server_getSprint,
} from "./tasks.server.js";

beforeEach(() => resetDb());

describe("mock server", () => {
  it("seeds a sprint and ten issues", async () => {
    expect((await server_getSprint()).name).toBe("Sprint 14");
    expect((await server_listTasks()).tasks).toHaveLength(10);
  });

  it("assigns increasing keys and fills defaults", async () => {
    const { task: a } = await server_createTask({ title: "  First  " });
    const { task: b } = await server_createTask({ title: "Second", type: "bug", status: "inprogress", id: "HIJACK" });
    expect(a).toMatchObject({ id: "LR-111", title: "First", type: "task", status: "todo", priority: "medium", reporterId: "u4", release: "Release 2.7" });
    expect(b).toMatchObject({ id: "LR-112", type: "bug", status: "inprogress" });
  });

  it("rejects an empty summary", async () => {
    await expect(server_createTask({ title: "   " })).rejects.toThrow("summary");
  });

  it("returns copies so callers can't mutate the db", async () => {
    const { tasks } = await server_listTasks();
    tasks[0].title = "mutated";
    tasks[0].labels.push("x");
    expect(db.tasks[0].title).not.toBe("mutated");
    expect(db.tasks[0].labels).not.toContain("x");
  });

  it("updates only editable fields and logs a readable activity entry", async () => {
    await server_updateTask({ id: "LR-101", patch: { status: "inprogress", id: "nope", reporterId: "u2" } });
    const t = db.tasks.find((x) => x.id === "LR-101");
    expect(t.status).toBe("inprogress");
    expect(t.reporterId).toBe("u1");
    expect(db.activity[0].text).toBe("Moved LR-101 → In Progress");

    await server_updateTask({ id: "LR-101", patch: { assigneeId: "u2" } });
    expect(db.activity[0].text).toBe("Assigned LR-101 to Jordan Park");
  });

  it("skips no-op updates and unknown issues", async () => {
    const before = db.activity.length;
    expect(await server_updateTask({ id: "LR-101", patch: { status: "todo" } })).toEqual({ ok: false });
    expect(await server_updateTask({ id: "LR-999", patch: { status: "done" } })).toEqual({ ok: false });
    expect(db.activity.length).toBe(before);
  });

  it("can simulate a failure on summary edits only", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.01);
    await expect(server_updateTask({ id: "LR-101", patch: { title: "x" } })).rejects.toThrow("Simulated");
    await expect(server_updateTask({ id: "LR-101", patch: { priority: "low" } })).resolves.toEqual({ ok: true });
  });

  it("adds comments and deletes issues", async () => {
    await server_addComment({ id: "LR-101", comment: { id: "c9", authorId: "u4", text: " Looks good ", ts: 1 } });
    expect(db.tasks.find((x) => x.id === "LR-101").comments.at(-1).text).toBe("Looks good");
    await server_deleteTask({ id: "LR-101" });
    expect(db.tasks.some((x) => x.id === "LR-101")).toBe(false);
    expect(db.activity[0].text).toBe("Deleted LR-101");
  });

  it("persists to localStorage", async () => {
    await server_createTask({ title: "Persist me" });
    const saved = JSON.parse(localStorage.getItem("ci_ops_mock_db_v2"));
    expect(saved.tasks).toHaveLength(11);
  });

  it("paginates activity", async () => {
    for (let i = 0; i < 5; i++) await server_createTask({ title: `T${i}` });
    const p1 = await server_activityPage({ cursor: 0, limit: 4 });
    const p2 = await server_activityPage({ cursor: p1.nextCursor, limit: 4 });
    expect(p1.items).toHaveLength(4);
    expect(p2.items).toHaveLength(3);
    expect(p2.nextCursor).toBeNull();
  });
});
