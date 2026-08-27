// The 15-day study plan: a fixed block shape (two lesson topics over 6
// days, a mock OA, two more topics, a review day, a mock OA) repeated with
// different pattern pairs each time. Progress advances by COMPLETION, not
// calendar date — "day 6" means the 6th slot cleared, so falling behind
// doesn't desync the plan. Everything here is pure/derivable except the
// small localStorage-backed state in the bottom section.

export const BLOCK_LENGTH = 15;

// Ordered list of patterns for blocks after the first (block 0's four —
// Two Pointers, Sliding Window, Binary Search, Trees & Recursion — are
// fixed and don't come from this list). Extend this (and re-run
// scripts/ingest-problems.js with a matching PATTERN_RULES entry) when you
// want a future block covering a pattern not ingested yet.
const FUTURE_PATTERN_CYCLE = ["Graphs", "Dynamic Programming"];

/**
 * The four topic patterns for a block's slots A/B/C/D (days 1-3, 4-6,
 * 8-10, 11-13). Block 0 is fixed; later blocks cycle through
 * FUTURE_PATTERN_CYCLE, 4 slots at a time, wrapping around — so with only
 * two future patterns ingested, block 1 is [Graphs, DP, Graphs, DP] (each
 * pattern gets two non-adjacent 3-day stretches, same total exposure block
 * 0's patterns got). Returns null if no future patterns are configured at
 * all, so callers can surface "nothing left to generate" instead of
 * fabricating content.
 */
function patternsForBlock(blockIndex) {
  if (blockIndex === 0) {
    return ["Two Pointers", "Sliding Window", "Binary Search", "Trees & Recursion"];
  }
  if (FUTURE_PATTERN_CYCLE.length === 0) return null;
  const offset = (blockIndex - 1) * 4;
  return [0, 1, 2, 3].map((i) => FUTURE_PATTERN_CYCLE[(offset + i) % FUTURE_PATTERN_CYCLE.length]);
}

/**
 * Builds the 15-entry day template for a block. A "lesson" day names one
 * pattern; a "mockOA" day names one or more {patterns, count} draws (the
 * day 15 mock pulls 2 from the block's own later patterns plus 1 "review"
 * problem from an earlier pattern, per spec); a "review" day has no
 * problem draw at all — it renders the existing spaced-repetition queue.
 */
export function generateBlock(blockIndex) {
  const patterns = patternsForBlock(blockIndex);
  if (!patterns) {
    throw new Error(
      "No further patterns configured for new blocks — add to FUTURE_PATTERN_CYCLE in studyPlan.js " +
        "and ingest problems for it (scripts/ingest-problems.js) before generating this block."
    );
  }
  const [a, b, c, d] = patterns;
  return [
    { day: 1, type: "lesson", pattern: a, count: 2 },
    { day: 2, type: "lesson", pattern: a, count: 2 },
    { day: 3, type: "lesson", pattern: a, count: 2 },
    { day: 4, type: "lesson", pattern: b, count: 2 },
    { day: 5, type: "lesson", pattern: b, count: 2 },
    { day: 6, type: "lesson", pattern: b, count: 2 },
    { day: 7, type: "mockOA", label: "Mock OA #1", draws: [{ patterns: [a, b], count: 3 }] },
    { day: 8, type: "lesson", pattern: c, count: 2 },
    { day: 9, type: "lesson", pattern: c, count: 2 },
    { day: 10, type: "lesson", pattern: c, count: 2 },
    { day: 11, type: "lesson", pattern: d, count: 2 },
    { day: 12, type: "lesson", pattern: d, count: 2 },
    { day: 13, type: "lesson", pattern: d, count: 2 },
    { day: 14, type: "review" },
    {
      day: 15,
      type: "mockOA",
      label: "Mock OA #2",
      draws: [
        { patterns: [c, d], count: 2 },
        { patterns: [a, b], count: 1 }, // review pull from an earlier pattern
      ],
    },
  ];
}

// Block 0 is fixed per spec, not generated — kept as a literal so it reads
// straightforwardly rather than through the generation function's wrapping.
export const BLOCK_0_TEMPLATE = generateBlock(0);

export function getBlockTemplate(blockIndex) {
  return blockIndex === 0 ? BLOCK_0_TEMPLATE : generateBlock(blockIndex);
}

/** Selects up to `count` unused problems for one pattern, sorted by id (deterministic, not random). */
function pickFromPattern(problems, pattern, count, usedIds) {
  const pool = problems
    .filter((p) => p.pattern === pattern && !usedIds.has(p.id))
    .sort((a, b) => a.id - b.id);
  return pool.slice(0, count);
}

/**
 * Resolves a day-template entry into actual problems, given the already-
 * used set (mutated as a working copy the caller commits after). Lesson
 * days draw from one pattern; mock OA days draw from each of their
 * {patterns, count} groups in order, so the day-15 "review from an earlier
 * pattern" draw can't collide with its own day's main draw. If a pattern
 * runs out of unused problems, the returned list for that draw is simply
 * shorter than requested — callers should treat that as "content
 * exhausted, ingest more" rather than crash.
 */
export function resolveDayProblems(dayTemplate, problems, usedIds) {
  const working = new Set(usedIds);
  const assigned = [];

  const draws = dayTemplate.type === "lesson" ? [{ patterns: [dayTemplate.pattern], count: dayTemplate.count }] : dayTemplate.draws || [];

  for (const draw of draws) {
    const combinedPool = problems
      .filter((p) => draw.patterns.includes(p.pattern) && !working.has(p.id))
      .sort((a, b) => a.id - b.id);
    const picked = combinedPool.slice(0, draw.count);
    for (const p of picked) {
      working.add(p.id);
      assigned.push(p);
    }
  }

  return assigned;
}

// ---------------------------------------------------------------------
// Persisted plan state (localStorage) — current block/day pointer and the
// global used-problem set. Kept minimal; the actual per-day problem
// assignment is cached separately (below) so revisiting a day shows the
// same problems rather than re-rolling them.
// ---------------------------------------------------------------------

const STATE_KEY = "runtime_study_plan_state";
const ASSIGNMENTS_KEY = "runtime_study_plan_assignments";

function loadState() {
  const raw = localStorage.getItem(STATE_KEY);
  if (raw) return JSON.parse(raw);
  return { blockIndex: 0, dayIndex: 0, usedProblemIds: [] };
}

function saveState(state) {
  localStorage.setItem(STATE_KEY, JSON.stringify(state));
}

function loadAssignments() {
  const raw = localStorage.getItem(ASSIGNMENTS_KEY);
  return raw ? JSON.parse(raw) : {};
}

function saveAssignments(assignments) {
  localStorage.setItem(ASSIGNMENTS_KEY, JSON.stringify(assignments));
}

export function getStudyPlanState() {
  return loadState();
}

/**
 * The current day's full plan: template info plus the specific problems
 * assigned to it (computed and locked in on first visit, cached after).
 * Returns null once the block is complete (dayIndex has advanced past day
 * 15) — callers should check isBlockComplete()/show "Start next block"
 * before calling this.
 */
export function getCurrentDayPlan(problems) {
  const state = loadState();
  if (state.dayIndex >= BLOCK_LENGTH) return null;
  const template = getBlockTemplate(state.blockIndex)[state.dayIndex];
  const assignments = loadAssignments();
  const key = `${state.blockIndex}-${state.dayIndex}`;

  let assignedProblems;
  if (assignments[key]) {
    const ids = new Set(assignments[key]);
    assignedProblems = problems.filter((p) => ids.has(p.id));
  } else if (template.type === "review") {
    assignedProblems = [];
  } else {
    const usedIds = new Set(state.usedProblemIds);
    assignedProblems = resolveDayProblems(template, problems, usedIds);
    assignments[key] = assignedProblems.map((p) => p.id);
    saveAssignments(assignments);
    state.usedProblemIds = [...usedIds, ...assignedProblems.map((p) => p.id)];
    saveState(state);
  }

  return {
    blockIndex: state.blockIndex,
    dayIndex: state.dayIndex,
    dayNumber: template.day,
    template,
    assignedProblems,
  };
}

/** Marks the current day done and moves to the next slot. Advancing past day 15 makes isBlockComplete() true. */
export function advanceDay() {
  const state = loadState();
  state.dayIndex += 1;
  saveState(state);
  return state;
}

export function isBlockComplete() {
  const state = loadState();
  return state.dayIndex >= BLOCK_LENGTH;
}

/** Explicit action for the "Start next block" button — advances the block pointer and resets the day pointer. */
export function startNextBlock() {
  const state = loadState();
  state.blockIndex += 1;
  state.dayIndex = 0;
  saveState(state);
  return state;
}
