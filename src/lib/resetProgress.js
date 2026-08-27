// A full, consistent reset — not a scoped one. The first version only
// cleared the study plan's own keys, leaving the hand-built lessons'
// spaced-repetition records (and everything else) stale: the streak would
// reset but the skill path would still show "Two Pointers done", which is
// exactly the kind of half-reset inconsistency this exists to avoid.
//
// Every key this app writes uses a "runtime_" prefix, so clearing all of
// them is a safe, complete wipe — nothing here is scoped to app.
export function resetAllProgress() {
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith("runtime_")) keysToRemove.push(key);
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
}
