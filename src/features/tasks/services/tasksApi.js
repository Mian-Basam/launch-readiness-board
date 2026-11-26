import {
  server_getSprint,
  server_listTasks,
  server_createTask,
  server_updateTask,
  server_addComment,
  server_deleteTask,
  server_resetDemo,
} from "../../../server/tasks.server.js";

export async function api_listTasks() {
  const res = await server_listTasks();
  return res.tasks;
}

export const api_getSprint = () => server_getSprint();

export async function api_createTask(payload) {
  const res = await server_createTask(payload);
  return res.task;
}

export const api_updateTask = (payload) => server_updateTask(payload);
export const api_addComment = (payload) => server_addComment(payload);
export const api_deleteTask = (payload) => server_deleteTask(payload);
export const api_resetDemo = () => server_resetDemo();

const jobRunners = {
  update: api_updateTask,
  comment: api_addComment,
  delete: api_deleteTask,
  // Job types written by older versions of the app.
  rename: ({ id, title }) => api_updateTask({ id, patch: { title } }),
  status: ({ id, status }) => api_updateTask({ id, patch: { status } }),
};

/** Executes a queued offline job against the API. */
export function runJob(job) {
  const run = jobRunners[job.type];
  if (!run) return Promise.resolve({ ok: false });
  return run(job.payload);
}
