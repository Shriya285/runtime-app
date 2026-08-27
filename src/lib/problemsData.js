// Lazy loader for src/data/problems.json (ingested by scripts/ingest-problems.js).
// Loaded via dynamic import rather than a static one so its ~4MB doesn't
// bloat the main JS bundle — it only downloads once something actually
// needs the study plan's problem pool.
let cached = null;

export async function loadProblems() {
  if (cached) return cached;
  const mod = await import("../data/problems.json");
  cached = mod.default.problems;
  return cached;
}
