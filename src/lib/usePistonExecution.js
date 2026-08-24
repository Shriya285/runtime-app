import { useCallback, useRef, useState } from "react";
import { executeCode } from "./piston";

const RESULT_MARKER = "__RUNTIME_RESULTS__";

// Wraps the user's function with a driver that runs every test case inside
// the sandbox and prints one JSON line we can parse back out — one Piston
// call per "Run tests" click instead of one per test case.
function buildDriverSource(lesson, userCode) {
  return [
    userCode,
    "",
    `const __TESTS__ = ${JSON.stringify(lesson.testCases)};`,
    "const __results__ = __TESTS__.map((t) => {",
    "  try {",
    `    const actual = ${lesson.entryPoint}(...t.args);`,
    "    return { passed: JSON.stringify(actual) === JSON.stringify(t.expected), actual, expected: t.expected, args: t.args, error: null };",
    "  } catch (err) {",
    "    return { passed: false, actual: null, expected: t.expected, args: t.args, error: String((err && err.message) || err) };",
    "  }",
    "});",
    `console.log(${JSON.stringify(RESULT_MARKER)} + JSON.stringify(__results__));`,
    "",
  ].join("\n");
}

/**
 * Owns real Piston execution state for a lesson: loading, per-test results,
 * and a `lastRunSummary` that flips to a fresh object each time a run
 * completes (pass/fail/total) — the signal App.jsx watches to drive
 * useSassyBotSentiment's thinking/cheer/annoyed/angry reactions.
 */
export function usePistonExecution(lesson) {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [lastRunSummary, setLastRunSummary] = useState(null);
  const [runtimeMs, setRuntimeMs] = useState(null);
  const [memoryBytes, setMemoryBytes] = useState(null);
  const [error, setError] = useState(null);
  const runIdRef = useRef(0);

  const runTests = useCallback(
    async (userCode) => {
      const runId = ++runIdRef.current;
      setIsLoading(true);
      setError(null);
      setLastRunSummary(null);

      const total = lesson.testCases.length;
      const failAll = (message) => {
        if (runId !== runIdRef.current) return; // superseded by a newer run
        setError(message);
        setResults(null);
        setLastRunSummary({ passed: 0, failed: total, total });
      };

      try {
        const source = buildDriverSource(lesson, userCode);
        const { stdout, stderr, wallTimeMs, memoryBytes: mem } = await executeCode({
          language: lesson.language,
          source,
        });
        if (runId !== runIdRef.current) return;

        const markerLine = stdout.split("\n").find((line) => line.startsWith(RESULT_MARKER));
        if (!markerLine) {
          failAll(stderr || "No output — check for a syntax error in your code.");
          return;
        }

        const parsed = JSON.parse(markerLine.slice(RESULT_MARKER.length));
        setResults(parsed);
        setRuntimeMs(wallTimeMs);
        setMemoryBytes(mem);
        const passed = parsed.filter((r) => r.passed).length;
        setLastRunSummary({ passed, failed: parsed.length - passed, total: parsed.length });
      } catch (err) {
        failAll(err.message || "Execution failed.");
      } finally {
        if (runId === runIdRef.current) setIsLoading(false);
      }
    },
    [lesson]
  );

  return {
    isLoading,
    results,
    lastRunSummary,
    runtimeMs,
    memoryBytes,
    error,
    runTests,
    testCount: lesson.testCases.length,
  };
}
