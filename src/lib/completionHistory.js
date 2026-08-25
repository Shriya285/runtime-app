import { getMonday } from "./weekBoundary";

// An append-only log of completion events, separate from spacedRepetition's
// per-lesson review record (which overwrites itself each time a lesson is
// re-completed, since it only tracks "when is this next due"). The weekly
// report needs actual history — what you solved and when — not just current
// scheduling state.
const HISTORY_KEY = "runtime_completion_history";

export function logCompletion(entry) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  history.push({ ...entry, completedAt: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function getCompletionsSince(startDate) {
  const history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  return history.filter((e) => new Date(e.completedAt) >= startDate);
}

export function getThisWeekCompletions(now = new Date()) {
  return getCompletionsSince(getMonday(now));
}
