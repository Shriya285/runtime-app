// Resets the study-plan pointer and streak back to a real day-1 start.
// Scoped deliberately: it clears the study-plan's own state/assignment
// cache and the streak/last-visit pair, but leaves spaced-repetition
// review records, completion history, and per-lesson code alone — those
// represent real work already done on the two hand-built lessons (a
// separate system from the plan), not something "start over" should erase.
const KEYS_TO_CLEAR = ["runtime_study_plan_state", "runtime_study_plan_assignments", "runtime_last_visit"];

export function resetStudyPlanAndStreak() {
  for (const key of KEYS_TO_CLEAR) localStorage.removeItem(key);
  localStorage.setItem("runtime_streak", "1");
}
