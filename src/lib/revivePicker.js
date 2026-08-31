import { getStudyPlanState, getBlockTemplate } from "./studyPlan";

/**
 * Picks 3 problems for a /revive session: whatever pattern the study plan's
 * current day slot is on, so revive picks up where the user actually left
 * off rather than a random pattern. Falls back to Block 0's first pattern
 * (Arrays & Strings) if the plan hasn't produced a lesson-type day yet
 * (e.g. sitting on a review/mockOA slot), and tops up from any other
 * unused problem if the current pattern doesn't have 3 left — "a sensible
 * default mix" rather than returning fewer than 3.
 */
export function pickReviveProblems(problems) {
  const state = getStudyPlanState();
  const template = getBlockTemplate(state.blockIndex)[state.dayIndex];
  const pattern = template && template.type === "lesson" ? template.pattern : "Arrays & Strings";
  const usedIds = new Set(state.usedProblemIds);

  const primary = problems
    .filter((p) => p.pattern === pattern && !usedIds.has(p.id))
    .sort((a, b) => a.id - b.id);

  if (primary.length >= 3) return primary.slice(0, 3);

  const chosenIds = new Set(primary.map((p) => p.id));
  const filler = problems
    .filter((p) => !usedIds.has(p.id) && !chosenIds.has(p.id))
    .sort((a, b) => a.id - b.id);

  return [...primary, ...filler].slice(0, 3);
}
