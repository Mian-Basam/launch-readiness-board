import { PEOPLE, ME_ID } from "./people.js";

// Fake websocket that randomly flips teammates online/offline and typing.
const listeners = new Set();

let state = {
  users: PEOPLE.map((p) => ({ ...p, online: p.id !== "u3", typing: false })),
};

function emit() {
  for (const cb of listeners) cb(state);
}

export function ws_subscribe(cb) {
  listeners.add(cb);
  cb(state);
  return () => listeners.delete(cb);
}

function patchRandomUser(fn) {
  const others = state.users.filter((u) => u.id !== ME_ID);
  const target = others[Math.floor(Math.random() * others.length)];
  state = { ...state, users: state.users.map((u) => (u.id === target.id ? fn(u) : u)) };
  emit();
}

let started = false;
export function ws_start() {
  if (started) return;
  started = true;
  setInterval(() => patchRandomUser((u) => ({ ...u, online: Math.random() > 0.2 })), 2600);
  setInterval(() => patchRandomUser((u) => ({ ...u, typing: u.online && Math.random() > 0.6 })), 1100);
}
