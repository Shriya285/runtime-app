import { useEffect, useState } from "react";

const LAST_VISIT_KEY = "runtime_last_visit";
const STREAK_KEY = "runtime_streak";

function hoursBetween(a, b) {
  return Math.abs(b - a) / (1000 * 60 * 60);
}

function isSameCalendarDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Reads/writes localStorage to figure out:
 * - how long you were gone
 * - whether the streak survived
 * - what mood the bot should be in on this load
 *
 * This is a client-side approximation. The real source of truth for streak
 * should live in your MongoDB user doc once the backend exists — this hook
 * is what you'd replace with a fetch to `/api/streak` at that point.
 */
export function useMoodState() {
  const [state, setState] = useState(null);

  useEffect(() => {
    const now = new Date();
    const lastVisitRaw = localStorage.getItem(LAST_VISIT_KEY);
    const storedStreak = parseInt(localStorage.getItem(STREAK_KEY) || "47", 10);

    let mood = "idle";
    let gapHours = 0;
    let streak = storedStreak;
    let justReturned = false;

    if (lastVisitRaw) {
      const lastVisit = new Date(lastVisitRaw);
      gapHours = hoursBetween(lastVisit, now);
      justReturned = gapHours > 5; // treat >5h gap as "coming back", not just a page refresh

      if (justReturned) {
        if (gapHours >= 48) {
          mood = "savage";
          streak = 1; // streak broke, restarting
        } else if (gapHours >= 24) {
          mood = "sassy";
          streak = isSameCalendarDay(lastVisit, now) ? storedStreak : storedStreak; // unchanged, at risk
        } else if (gapHours >= 6) {
          mood = "nudge";
        } else {
          mood = "return_on_time";
          streak = storedStreak + (isSameCalendarDay(lastVisit, now) ? 0 : 1);
        }
      } else {
        mood = "idle";
      }
    } else {
      // first ever visit
      mood = "idle";
    }

    localStorage.setItem(LAST_VISIT_KEY, now.toISOString());
    localStorage.setItem(STREAK_KEY, String(streak));

    setState({ mood, gapHours: Math.round(gapHours), streak, justReturned });
  }, []);

  return state;
}
