import { getMonday } from "./weekBoundary";

// Real "days practiced this week" tracking, replacing the old hardcoded
// "5/7 days" stat. Resets implicitly rather than through an explicit reset
// action: getWeekProgress() only ever counts dates within the current
// Monday-anchored week, so once a week rolls over, last week's dates just
// stop counting on their own.
const ACTIVITY_KEY = "runtime_activity_dates"; // JSON array of "YYYY-MM-DD"

function todayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

/** Call whenever the user does something that counts as "practiced today" (e.g. running tests). */
export function recordActivityToday() {
  const dates = new Set(JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]"));
  dates.add(todayKey());
  localStorage.setItem(ACTIVITY_KEY, JSON.stringify([...dates]));
}

export function getWeekProgress(now = new Date()) {
  const monday = getMonday(now);
  const dates = JSON.parse(localStorage.getItem(ACTIVITY_KEY) || "[]");
  const daysThisWeek = dates.filter((d) => new Date(`${d}T00:00:00`) >= monday).length;
  return { daysThisWeek, weekStart: monday };
}
