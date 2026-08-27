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

// How many problems to keep per pattern bucket. Chosen to comfortably cover
// the 15-day plan (6 lesson slots + mock-OA + review draw per pattern) with
// room to spare, without bundling the entire ~2900-problem corpus.
const PROBLEMS_PER_PATTERN = 12;

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

function extractAssertions(testCode) {
  return testCode
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("assert "))
    .map((line) => line.slice("assert ".length).trim())
    .filter(Boolean);
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
    const testAssertions = extractAssertions(rec.test);
    if (testAssertions.length === 0) {
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
      pythonPrelude: rec.prompt,
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
