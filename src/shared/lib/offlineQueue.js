const KEY = "ci_ops_offline_queue_v1";

export function loadQueue() {
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveQueue(queue) {
  try {
    localStorage.setItem(KEY, JSON.stringify(queue));
  } catch {
    // Storage unavailable: the queue still lives in memory for this session.
  }
}

export function makeJob(type, payload) {
  return { id: `${Date.now()}_${Math.random().toString(36).slice(2)}`, type, payload };
}

/**
 * Replays jobs in order. Stops at the first failure so later jobs never
 * overtake an earlier one (e.g. a rename followed by a move of the same task).
 */
export async function flushQueue(jobs, runJob) {
  const remaining = [...jobs];
  while (remaining.length > 0) {
    try {
      await runJob(remaining[0]);
      remaining.shift();
    } catch (error) {
      return { remaining, error };
    }
  }
  return { remaining, error: null };
}

/** Exponential backoff: 1s, 2s, 4s … capped at 30s. */
export function backoffDelay(attempt, base = 1000, max = 30000) {
  return Math.min(max, base * 2 ** attempt);
}
