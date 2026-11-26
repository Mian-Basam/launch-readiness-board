import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api_listTasks,
  api_getSprint,
  api_createTask,
  api_updateTask,
  api_addComment,
  api_deleteTask,
  api_resetDemo,
} from "../services/tasksApi.js";
import { applyJob } from "../selectors/tasksSelectors.js";
import { useI18n, useSync, useToast } from "../../../app/providers/hooks.js";
import { ME_ID } from "../../../mocks/people.js";

export const TASKS_KEY = ["tasks"];
export const ACTIVITY_KEY = ["activity"];
export const SPRINT_KEY = ["sprint"];

export function useTasksQuery() {
  return useQuery({ queryKey: TASKS_KEY, queryFn: api_listTasks });
}

export function useSprintQuery() {
  return useQuery({ queryKey: SPRINT_KEY, queryFn: api_getSprint, staleTime: Infinity });
}

function useInvalidateBoard() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: TASKS_KEY });
    qc.invalidateQueries({ queryKey: ACTIVITY_KEY });
  };
}

/**
 * Optimistic mutation for one job type: applies the change to the cache immediately,
 * rolls back and shows a toast on failure, and refetches tasks + activity afterwards.
 */
function useOptimisticTaskMutation(type, mutationFn, { errorKey, successKey }) {
  const qc = useQueryClient();
  const invalidate = useInvalidateBoard();
  const { notify } = useToast();
  const { t } = useI18n();

  return useMutation({
    mutationFn,
    onMutate: async (payload) => {
      await qc.cancelQueries({ queryKey: TASKS_KEY });
      const prev = qc.getQueryData(TASKS_KEY);
      qc.setQueryData(TASKS_KEY, (old = []) => applyJob(old, { type, payload }));
      return { prev };
    },
    onError: (_err, payload, ctx) => {
      if (ctx?.prev) qc.setQueryData(TASKS_KEY, ctx.prev);
      notify(t(typeof errorKey === "function" ? errorKey(payload) : errorKey), "error");
    },
    onSuccess: () => {
      if (successKey) notify(t(successKey), "success");
    },
    onSettled: invalidate,
  });
}

/**
 * All issue actions for the board. While online they hit the API optimistically;
 * while offline they're queued (and shown via applyPendingJobs) until reconnect.
 */
export function useTaskActions() {
  const qc = useQueryClient();
  const { isOnline, enqueueJob } = useSync();
  const { notify } = useToast();
  const { t } = useI18n();
  const invalidate = useInvalidateBoard();

  const createM = useMutation({
    mutationFn: api_createTask,
    onSuccess: (task) => notify(t("createdToast", { id: task.id }), "success"),
    onError: () => notify(t("createFailed"), "error"),
    onSettled: invalidate,
  });
  const updateM = useOptimisticTaskMutation("update", api_updateTask, {
    errorKey: (payload) => ("title" in payload.patch ? "renameFailed" : "updateFailed"),
  });
  const commentM = useOptimisticTaskMutation("comment", api_addComment, {
    errorKey: "commentFailed",
  });
  const deleteM = useOptimisticTaskMutation("delete", api_deleteTask, {
    errorKey: "deleteFailed",
    successKey: "deletedToast",
  });
  const resetM = useMutation({
    mutationFn: api_resetDemo,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: SPRINT_KEY });
      notify(t("resetDone"), "success");
    },
    onSettled: invalidate,
  });

  function run(type, mutation, payload) {
    if (isOnline) {
      mutation.mutate(payload);
    } else {
      enqueueJob(type, payload);
      notify(t("savedOffline"), "info");
    }
  }

  function update(id, patch) {
    if (!patch || Object.keys(patch).length === 0) return;
    run("update", updateM, { id, patch });
  }

  return {
    create: (payload, options) => createM.mutate(payload, options),
    update,
    move: (id, status) => update(id, { status }),
    comment: (id, text) =>
      run("comment", commentM, {
        id,
        comment: { id: `c${Date.now()}`, authorId: ME_ID, text, ts: Date.now() },
      }),
    remove: (id) => run("delete", deleteM, { id }),
    resetDemo: () => resetM.mutate(),
    isCreating: createM.isPending,
    isOnline,
  };
}
