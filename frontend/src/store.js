/**
 * Frontend state.
 *
 * Everything lives in the browser for now — this module is the single seam
 * where the app will later read and write through the scheduler instead.
 */
import { invoke } from "@tauri-apps/api/core";

const KEY = "heavenly-restriction/manager";

const emptyState = () => ({ manager: null, sessions: [] });

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return {
      manager: parsed.manager ?? null,
      sessions: Array.isArray(parsed.sessions) ? parsed.sessions : [],
    };
  } catch {
    return emptyState();
  }
}

function write(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — the session still lives in memory */
  }
}

let state = read();
const listeners = new Set();



function commit(next) {
  state = next;
  write(state);
  invoke("set_sessions", { sessions: next.sessions })
    .catch((e) => console.error("[Error] scheduler rejected: ", e));
  for (const listener of listeners) listener(state);
}

export function getState() {
  return state;
}

export function subscribe(listener) {
  listeners.add(listener);

  /* Populate Rust Sessions on Startup */
  if (getState().manager) invoke("set_sessions", { sessions: getState().sessions });
  return () => listeners.delete(listener);
}

export function createManager(name) {
  commit({ manager: { name: name.trim(), createdAt: Date.now() }, sessions: [] });
}

export function addSession({ commands, startMinutes, isBlocking }) {
  const session = {
    id: `s_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    commands,
    startMinutes,
    isBlocking,
  };
  commit({ ...state, sessions: [...state.sessions, session] });
  return session;
}

export function removeSession(id) {
  commit({ ...state, sessions: state.sessions.filter((s) => s.id !== id) });
}

export function hasSessionAt(startMinutes) {
  return state.sessions.some((s) => s.startMinutes === startMinutes);
}




