// Per-problem spaced-repetition tracking: trigger + core idea, stored per
// lesson in localStorage, on a 3/7/14/30-day schedule. Same "replace with a
// real backend later" posture as useMoodState — this is what you'd swap for
// a fetch to `/api/reviews` once the backend exists.

const STORAGE_PREFIX = "runtime_review_";
export const SCHEDULE_DAYS = [3, 7, 14, 30];

function key(lessonId) {
  return `${STORAGE_PREFIX}${lessonId}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function getReviewRecord(lessonId) {
  const raw = localStorage.getItem(key(lessonId));
  return raw ? JSON.parse(raw) : null;
}

/** Called the first time a problem is completed — tests passed, or solution revealed. */
export function recordCompletion(lessonId, { trigger, coreIdea, reason }) {
  const now = new Date();
  const record = {
    lessonId,
    trigger,
    coreIdea,
    reason, // 'tests-passed' | 'solution-revealed'
    firstCompletedAt: now.toISOString(),
    stage: 0,
    nextDueAt: addDays(now, SCHEDULE_DAYS[0]).toISOString(),
  };
  localStorage.setItem(key(lessonId), JSON.stringify(record));
  return record;
}

/** Called when a due review is marked done — advances to the next interval. */
export function advanceReview(lessonId) {
  const record = getReviewRecord(lessonId);
  if (!record) return null;
  const nextStage = Math.min(record.stage + 1, SCHEDULE_DAYS.length - 1);
  const now = new Date();
  const updated = {
    ...record,
    stage: nextStage,
    lastReviewedAt: now.toISOString(),
    nextDueAt: addDays(now, SCHEDULE_DAYS[nextStage]).toISOString(),
  };
  localStorage.setItem(key(lessonId), JSON.stringify(updated));
  return updated;
}

export function getDueReviews(lessonIds) {
  const now = new Date();
  return lessonIds
    .map((id) => getReviewRecord(id))
    .filter((r) => r && new Date(r.nextDueAt) <= now);
}

export function getUpcomingReviews(lessonIds) {
  const now = new Date();
  return lessonIds
    .map((id) => getReviewRecord(id))
    .filter((r) => r && new Date(r.nextDueAt) > now)
    .sort((a, b) => new Date(a.nextDueAt) - new Date(b.nextDueAt));
}
