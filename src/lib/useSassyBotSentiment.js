import { useCallback, useEffect, useRef, useState } from "react";

// How long a tier-1 run reaction (cheer/annoyed/angry) holds before falling
// through to tier 2, per the "~3-4s" spec for active code-run reactions.
const RUN_REACTION_HOLD_MS = 3500;

const MOOD_TO_SENTIMENT = {
  idle: "idle",
  nudge: "sassy",
  sassy: "annoyed",
  savage: "angry",
};

/**
 * Computes the `sentiment` prop for <SassyBot>, blending three priority tiers
 * (tier 1 highest):
 *
 *  1. Active code-run reactions. `isExecuting` (continuous) drives 'thinking'
 *     for as long as a code-execution request is in flight. `reportRunResult(kind)`
 *     and `reportSolutionRevealedEarly()` are edge-triggered: call them once
 *     when a run finishes / a solution is revealed early, and the returned
 *     reaction holds for ~3-4s before falling through to tier 2. A new call
 *     while a reaction is still showing resets the timer and takes over
 *     immediately rather than queuing.
 *  2. Absence-based baseline, derived from the `moodState` you pass in (the
 *     same object `useMoodState()` already returns elsewhere in the app —
 *     pass that same value in rather than calling useMoodState() again here,
 *     since a second call would re-run its localStorage gap calculation).
 *  3. Local boredom. Only reachable when tier 2 resolves to 'idle'. Wire the
 *     returned `handleAutoSassy` to <SassyBot onAutoSassy>; it switches the
 *     sentiment to 'sassy' until the next tier-2 change.
 *
 * @param {{ mood: string } | null} moodState - value from useMoodState()
 * @param {{ isExecuting?: boolean }} [options]
 */
export function useSassyBotSentiment(moodState, { isExecuting = false } = {}) {
  const [runReaction, setRunReaction] = useState(null); // 'cheer' | 'annoyed' | 'angry' | null
  const [bored, setBored] = useState(false);
  const reactionTimer = useRef(null);

  const tier2Sentiment = moodState ? MOOD_TO_SENTIMENT[moodState.mood] || "idle" : "idle";

  // A real tier-2 change supersedes local boredom so it can re-arm from idle.
  useEffect(() => {
    setBored(false);
  }, [tier2Sentiment]);

  const reportRunResult = useCallback((kind) => {
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    setRunReaction(kind);
    reactionTimer.current = setTimeout(() => setRunReaction(null), RUN_REACTION_HOLD_MS);
  }, []);

  const reportSolutionRevealedEarly = useCallback(() => {
    reportRunResult("annoyed");
  }, [reportRunResult]);

  useEffect(() => () => reactionTimer.current && clearTimeout(reactionTimer.current), []);

  const handleAutoSassy = useCallback(() => {
    if (tier2Sentiment === "idle" && !isExecuting && !runReaction) setBored(true);
  }, [tier2Sentiment, isExecuting, runReaction]);

  let sentiment;
  if (isExecuting) sentiment = "thinking";
  else if (runReaction) sentiment = runReaction;
  else if (tier2Sentiment === "idle" && bored) sentiment = "sassy";
  else sentiment = tier2Sentiment;

  return { sentiment, reportRunResult, reportSolutionRevealedEarly, handleAutoSassy };
}
