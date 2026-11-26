import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { SyncContext } from "./contexts.js";
import { useI18n, useToast } from "./hooks.js";
import {
  loadQueue,
  saveQueue,
  makeJob,
  flushQueue,
  backoffDelay,
} from "../../shared/lib/offlineQueue.js";
import { runJob } from "../../features/tasks/services/tasksApi.js";

/**
 * Owns online/offline state and the offline job queue.
 * When online, queued jobs are replayed in order; on failure the replay is retried
 * with exponential backoff instead of waiting for the next offline→online flip.
 */
export function SyncProvider({ children }) {
  const qc = useQueryClient();
  const { t } = useI18n();
  const { notify } = useToast();

  const [isOnline, setIsOnline] = React.useState(() => navigator.onLine);
  const [queue, setQueue] = React.useState(loadQueue);
  const [attempt, setAttempt] = React.useState(0);
  const flushing = React.useRef(false);

  React.useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  React.useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  React.useEffect(() => {
    if (!isOnline || queue.length === 0 || flushing.current) return;

    const delay = attempt === 0 ? 0 : backoffDelay(attempt - 1);
    const timer = setTimeout(async () => {
      flushing.current = true;
      const { remaining, error } = await flushQueue(queue, runJob);
      flushing.current = false;

      const remainingIds = new Set(remaining.map((j) => j.id));
      const doneIds = new Set(queue.filter((j) => !remainingIds.has(j.id)).map((j) => j.id));
      setQueue((q) => q.filter((j) => !doneIds.has(j.id)));

      if (error) {
        setAttempt((a) => a + 1);
        notify(t("syncRetry", { s: Math.round(backoffDelay(attempt) / 1000) }), "error");
      } else {
        setAttempt(0);
        notify(t("synced"), "success");
      }
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["activity"] });
    }, delay);

    return () => clearTimeout(timer);
  }, [isOnline, queue, attempt, qc, notify, t]);

  const enqueueJob = React.useCallback((type, payload) => {
    setQueue((q) => [...q, makeJob(type, payload)]);
  }, []);

  const value = React.useMemo(
    () => ({ isOnline, queue, enqueueJob }),
    [isOnline, queue, enqueueJob]
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}
