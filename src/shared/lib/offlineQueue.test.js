import { describe, it, expect, vi } from "vitest";
import { loadQueue, saveQueue, makeJob, flushQueue, backoffDelay } from "./offlineQueue.js";

describe("queue storage", () => {
  it("round-trips through localStorage", () => {
    const job = makeJob("rename", { id: "lr-1", title: "x" });
    saveQueue([job]);
    expect(loadQueue()).toEqual([job]);
  });

  it("recovers from corrupt or non-array data", () => {
    localStorage.setItem("ci_ops_offline_queue_v1", "{not json");
    expect(loadQueue()).toEqual([]);
    localStorage.setItem("ci_ops_offline_queue_v1", '{"a":1}');
    expect(loadQueue()).toEqual([]);
  });

  it("gives every job a unique id", () => {
    const ids = new Set(Array.from({ length: 50 }, () => makeJob("status", {}).id));
    expect(ids.size).toBe(50);
  });
});

describe("flushQueue", () => {
  it("runs every job in order when all succeed", async () => {
    const seen = [];
    const jobs = [makeJob("a", {}), makeJob("b", {})];
    const res = await flushQueue(jobs, async (j) => seen.push(j.type));
    expect(seen).toEqual(["a", "b"]);
    expect(res).toEqual({ remaining: [], error: null });
  });

  it("stops at the first failure and keeps it plus later jobs", async () => {
    const jobs = [makeJob("a", {}), makeJob("b", {}), makeJob("c", {})];
    const run = vi.fn(async (j) => {
      if (j.type === "b") throw new Error("boom");
    });
    const res = await flushQueue(jobs, run);
    expect(run).toHaveBeenCalledTimes(2);
    expect(res.remaining.map((j) => j.type)).toEqual(["b", "c"]);
    expect(res.error.message).toBe("boom");
  });
});

describe("backoffDelay", () => {
  it("doubles each attempt and caps", () => {
    expect([0, 1, 2, 3].map((a) => backoffDelay(a))).toEqual([1000, 2000, 4000, 8000]);
    expect(backoffDelay(20)).toBe(30000);
  });
});
