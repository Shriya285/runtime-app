// The three ways a problem gets marked complete. Shared so CompletionPrompt
// and WeeklyReportModal don't each hand-roll their own copy of this mapping
// and drift out of sync.
const REASONS = {
  "tests-passed": { label: "solved", promptLabel: "Tests passed — lock it in", color: "green" },
  "tests-passed-override": {
    label: "marked solved (partial pass)",
    promptLabel: "Marked as solved despite a few failures — lock it in",
    color: "cyan",
  },
  "solution-revealed": { label: "solution revealed", promptLabel: "Solution revealed — lock it in anyway", color: "blue" },
};

export function describeReason(reason) {
  return REASONS[reason] || REASONS["solution-revealed"];
}
