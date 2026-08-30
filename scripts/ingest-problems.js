// ONE-TIME ingestion script — not run at app runtime. Run manually with:
//   node scripts/ingest-problems.js
// to regenerate src/data/problems.json.
//
// Source: newfacade/LeetCodeDataset (github.com/newfacade/LeetCodeDataset),
// version v0.3.1 — the current version, confirmed by direct inspection to
// have the schema the dataset's own README documents (tags, starter_code,
// problem_description at top level); the older v0.1.0 file does NOT have
// those fields despite the README describing them, so don't drop the
// version pin here without re-checking.
//
// Real, verified facts about this dataset that shaped the code below:
//   - Python only. No JavaScript anywhere in it.
//   - Solutions are `class Solution:` methods, not plain functions —
//     entry_point looks like "Solution().twoSum". We store just the method
//     name and reconstruct `Solution().<name>` at execution time.
//   - `test` is a Python `check(candidate)` function whose body is a list
//     of `assert candidate(kw=val, ...) == expected` lines using keyword
//     args. Rather than parse these into a positional {args, expected}
//     shape (fragile — values can contain commas inside nested brackets),
//     we keep each assert's expression verbatim and eval() it at run time
//     with `candidate` bound to `Solution().<entryPoint>`. See
//     src/lib/useCodeExecution.js's dataset-problem driver branch.
//   - `prompt` is a fixed prelude (imports + ListNode/TreeNode/list_node/
//     tree_node/is_same_list/is_same_tree helpers) that assertions for
//     linked-list and tree problems depend on. It is NOT byte-identical
//     across every record (4 distinct variants exist in this dataset), so
//     each problem stores its own prelude rather than assuming one shared
//     constant — small duplication, but correctness over cleverness here.

import zlib from "node:zlib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = path.join(__dirname, "../src/data/problems.json");

const DATASET_VERSION = "v0.3.1";
const BASE_URL = `https://raw.githubusercontent.com/newfacade/LeetCodeDataset/main/data`;
const FILES = [`LeetCodeDataset-${DATASET_VERSION}-train.jsonl.gz`, `LeetCodeDataset-${DATASET_VERSION}-test.jsonl.gz`];

// How many problems to keep per pattern bucket. 24 rather than a tighter
// number because generateNextBlock() can land the same pattern in two of a
// block's four topic-slots when fewer than 4 unused patterns remain (e.g.
// block 2 has only Graphs + Dynamic Programming available) — that's 12
// lesson problems (2/day x 6 days) from ONE pattern before mock-OA/review
// draws even start, so 12 wasn't enough headroom. All 7 buckets comfortably
// support 24 in the raw dataset (the smallest, Sliding Window, has 142).
const PROBLEMS_PER_PATTERN = 24;

// Checked (in order) against each problem's tags; first match wins, so a
// problem tagged both "Two Pointers" and "Array" lands in Two Pointers, not
// duplicated into both buckets. Graphs/Dynamic Programming are here for
// generateNextBlock()'s future blocks, not the initial 15-day plan.
const PATTERN_RULES = [
  { pattern: "Two Pointers", tags: ["Two Pointers"] },
  { pattern: "Sliding Window", tags: ["Sliding Window"] },
  { pattern: "Binary Search", tags: ["Binary Search"] },
  { pattern: "Trees & Recursion", tags: ["Tree", "Binary Tree", "Binary Search Tree", "Recursion"] },
  { pattern: "Graphs", tags: ["Graph", "Union Find", "Topological Sort", "Shortest Path"] },
  { pattern: "Dynamic Programming", tags: ["Dynamic Programming"] },
  { pattern: "Arrays & Strings", tags: ["Array", "String"] },
];

const ENTRY_POINT_RE = /^Solution\(\)\.(\w+)$/;

function classifyPattern(tags) {
  for (const rule of PATTERN_RULES) {
    if (rule.tags.some((t) => tags.includes(t))) return rule.pattern;
  }
  return null;
}

function deriveTitle(taskId) {
  return taskId
    .split("-")
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
    .join(" ");
}

function cleanDescription(text) {
  return text.replace(/ /g, " ").trim();
}

// Drops assertions that expect a bare `None` return. Confirmed by hand on
// "Two Sum": its reference solution has no explicit "not found" branch, so
// it implicitly returns None on inputs with no valid pair — inputs that
// violate the real problem's own stated guarantee ("you may assume each
// input has exactly one solution"). The generated test suite includes
// these out-of-spec inputs anyway, so any solution using the more
// defensible `return []`/`return -1` convention for "not found" (as the
// prompt text's own examples do, and as any reasonable solution would)
// fails assertions that were never a real requirement. Dropping `== None`
// assertions can only stop unfairly failing an otherwise-correct solution
// — it can never make an incorrect one pass, since it's strictly removing
// a check rather than loosening one.
function extractAssertions(testCode) {
  return testCode
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("assert "))
    .map((line) => line.slice("assert ".length).trim())
    .filter(Boolean)
    .filter((expr) => !/==\s*None$/.test(expr));
}

// Problems whose real spec explicitly allows returning results in any
// order (3Sum, 4Sum, permutations, group-anagrams, N-Queens, palindrome
// partitioning, combination-sum-ii, accounts-merge) but whose ingested
// assertions do strict, order-sensitive list equality against one
// specific reference ordering. Verified empirically, not assumed: ran a
// deliberately-different-but-correct alternate implementation of each
// against its real assertions and confirmed high failure rates (e.g.
// 4Sum 34/90, group-anagrams 19/69, n-queens 4/8, 3sum 24/104,
// palindrome-partitioning 4/128) before adding it here. "permutations"
// was tested too and empirically already fine (itertools.permutations
// happens to match the reference order) but is included anyway for
// consistency with its own "any order" spec — the rewrite is a no-op
// when both sides already match.
//
// Fix: rewrite `EXPR == EXPECTED` to `__sorted_deep(EXPR) == __sorted_deep(EXPECTED)`
// — see the matching __sorted_deep helper embedded in
// src/lib/useCodeExecution.js's Python "assertions" driver. Recursively
// sorts nested lists by string representation so order at any depth stops
// mattering for comparison. One accepted tradeoff: this can't distinguish
// "this list's internal order is genuinely required" from "any order is
// fine" below the top level (e.g. accounts-merge's [name, ...emails]
// shape) — acceptable here since this is practice-app grading, not an
// adversarial judge, and the empirical re-check after applying this
// showed no regressions.
const ORDER_INSENSITIVE_PROBLEMS = new Set([
  "3sum",
  "4sum",
  "permutations",
  "permutations-ii",
  "group-anagrams",
  "n-queens",
  "palindrome-partitioning",
  "combination-sum",
  "combination-sum-ii",
  "accounts-merge",
]);

function toOrderInsensitive(expr) {
  const idx = expr.lastIndexOf(") == ");
  if (idx === -1) return expr; // doesn't match the expected shape — leave as-is rather than guess
  const callPart = expr.slice(0, idx + 1);
  const expectedPart = expr.slice(idx + 5);
  return `__sorted_deep(${callPart}) == __sorted_deep(${expectedPart})`;
}

// combination-sum's own test inputs include candidates with duplicate
// values twice (e.g. [2,5,2,1,2]) — the real "Combination Sum" problem
// requires distinct candidates, and the reference solution (which
// dedupes nothing, just sorts) produces literal duplicate combinations
// on those inputs, e.g. [1,1,1,2] appearing 3 times for one call. That's
// not a real target output, it's the reference leaking its own
// implementation quirk on an out-of-spec input — same root cause as the
// None-return issue, different shape. Drop assertions built on a
// duplicate-valued candidates list rather than try to "fix" an answer
// that was never well-defined to begin with.
function hasDuplicateCandidates(expr) {
  const match = /candidates\s*=\s*(\[[^\]]*\])/.exec(expr);
  if (!match) return false;
  try {
    const values = JSON.parse(match[1]);
    return new Set(values).size !== values.length;
  } catch {
    return false;
  }
}

// The dataset's prelude sometimes imports third-party packages the Judge0
// sandbox doesn't have installed (confirmed: `sortedcontainers` — 6
// problems' preludes import it unconditionally, none of their actual
// solutions use it, and it crashes every one of them with
// ModuleNotFoundError before the solution code even runs, regardless of
// what's submitted). Two-part fix: strip the dead import from every
// prelude, and as a safety net for future re-ingestion, exclude any record
// whose solution genuinely references a symbol from an unavailable
// package instead of shipping a prelude that would crash on import.
const UNAVAILABLE_PACKAGES = [{ pattern: /^from sortedcontainers import .*\n?/m, symbols: ["SortedList", "SortedDict", "SortedSet"] }];

function sanitizePrelude(prelude) {
  let result = prelude;
  for (const { pattern } of UNAVAILABLE_PACKAGES) result = result.replace(pattern, "");
  return result;
}

function usesUnavailablePackage(solutionCode) {
  return UNAVAILABLE_PACKAGES.some(({ symbols }) => symbols.some((s) => solutionCode.includes(s)));
}

function finalizeStarterCode(starterCode) {
  const trimmed = starterCode.replace(/\s+$/, "");
  return `${trimmed}\n        pass\n`;
}

async function fetchJsonlGz(filename) {
  const url = `${BASE_URL}/${filename}`;
  console.log(`Fetching ${url} ...`);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const decompressed = zlib.gunzipSync(buf).toString("utf-8");
  return decompressed
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

async function main() {
  const allRecords = [];
  for (const file of FILES) {
    const records = await fetchJsonlGz(file);
    console.log(`  -> ${records.length} records`);
    allRecords.push(...records);
  }
  console.log(`Total records fetched: ${allRecords.length}`);

  const byPattern = new Map(PATTERN_RULES.map((r) => [r.pattern, []]));
  let skippedNoEntryMatch = 0;
  let skippedIncomplete = 0;
  let skippedNoPattern = 0;

  for (const rec of allRecords) {
    if (!rec.tags || !rec.starter_code || !rec.problem_description || !rec.test || !rec.completion) {
      skippedIncomplete++;
      continue;
    }
    const match = ENTRY_POINT_RE.exec(rec.entry_point || "");
    if (!match) {
      skippedNoEntryMatch++;
      continue;
    }
    const pattern = classifyPattern(rec.tags);
    if (!pattern) {
      skippedNoPattern++;
      continue;
    }
    let testAssertions = extractAssertions(rec.test);
    if (rec.task_id === "combination-sum") {
      testAssertions = testAssertions.filter((expr) => !hasDuplicateCandidates(expr));
    }
    if (ORDER_INSENSITIVE_PROBLEMS.has(rec.task_id)) {
      testAssertions = testAssertions.map(toOrderInsensitive);
    }
    if (testAssertions.length === 0) {
      skippedIncomplete++;
      continue;
    }
    if (usesUnavailablePackage(rec.completion)) {
      skippedIncomplete++;
      continue;
    }

    byPattern.get(pattern).push({
      id: rec.question_id,
      taskId: rec.task_id,
      title: deriveTitle(rec.task_id),
      pattern,
      difficulty: rec.difficulty,
      description: cleanDescription(rec.problem_description),
      entryPoint: match[1],
      pythonPrelude: sanitizePrelude(rec.prompt),
      starterCode: finalizeStarterCode(rec.starter_code),
      solutionCode: rec.completion,
      testCases: testAssertions,
    });
  }

  console.log(`Skipped: ${skippedIncomplete} incomplete, ${skippedNoEntryMatch} non-simple entry_point, ${skippedNoPattern} unmatched pattern`);

  const problems = [];
  for (const [pattern, list] of byPattern) {
    list.sort((a, b) => a.id - b.id);
    const deduped = [];
    const seenIds = new Set();
    for (const p of list) {
      if (seenIds.has(p.id)) continue;
      seenIds.add(p.id);
      deduped.push(p);
      if (deduped.length >= PROBLEMS_PER_PATTERN) break;
    }
    console.log(`${pattern}: ${deduped.length} problems (of ${list.length} available)`);
    problems.push(...deduped);
  }

  const output = {
    sourceDataset: `newfacade/LeetCodeDataset ${DATASET_VERSION}`,
    generatedAt: new Date().toISOString(),
    problems,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2));
  console.log(`\nWrote ${problems.length} problems to ${OUTPUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
