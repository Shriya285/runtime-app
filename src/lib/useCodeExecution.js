import { useCallback, useRef, useState } from "react";
import { executeCode } from "./codeExecutor";

const RESULT_MARKER = "__RUNTIME_RESULTS__";

// Wraps the user's function with a driver that runs every test case inside
// the sandbox and prints one JSON line we can parse back out — one Judge0
// call per "Run tests" click instead of one per test case. Test-case data
// is passed through as a JSON string (parsed with JSON.parse/json.loads at
// runtime) rather than interpolated as source-language literals, so it
// works the same regardless of target language.
function buildDriverSource({ language, entryPoint, testCases }, userCode) {
  const testsJson = JSON.stringify(testCases);

  if (language === "python") {
    return [
      userCode,
      "",
      "import json",
      `__TESTS__ = json.loads(r'''${testsJson}''')`,
      "__results__ = []",
      "for __t in __TESTS__:",
      "    try:",
      `        __actual = ${entryPoint}(*__t["args"])`,
      '        __results__.append({"passed": __actual == __t["expected"], "actual": __actual, "expected": __t["expected"], "args": __t["args"], "error": None})',
      "    except Exception as __e:",
      '        __results__.append({"passed": False, "actual": None, "expected": __t["expected"], "args": __t["args"], "error": str(__e)})',
      `print(${JSON.stringify(RESULT_MARKER)} + json.dumps(__results__))`,
      "",
    ].join("\n");
  }

  // Default: JavaScript.
  return [
    userCode,
    "",
    `const __TESTS__ = JSON.parse(${JSON.stringify(testsJson)});`,
    "const __results__ = __TESTS__.map((t) => {",
    "  try {",
    `    const actual = ${entryPoint}(...t.args);`,
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
 * Owns real code-execution state, shared across whichever lesson is
 * currently active. `lastRunSummary` flips to a fresh object each time a
 * run completes (pass/fail/total) — the signal App.jsx watches to drive
 * useSassyBotSentiment's thinking/cheer/annoyed/angry reactions.
 *
 * `runTests(userCode, { language, entryPoint, testCases })` takes every
 * lesson-specific bit per call rather than at hook-creation time, since
 * more than one lesson can be active over the life of the app.
 */
export function useCodeExecution() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [lastRunSummary, setLastRunSummary] = useState(null);
  const [runtimeMs, setRuntimeMs] = useState(null);
  const [memoryBytes, setMemoryBytes] = useState(null);
  const [error, setError] = useState(null);
  const runIdRef = useRef(0);

  const runTests = useCallback(async (userCode, { language, entryPoint, testCases }) => {
    const runId = ++runIdRef.current;
    setIsLoading(true);
    setError(null);
    setLastRunSummary(null);

    const total = testCases.length;
    const failAll = (message) => {
      if (runId !== runIdRef.current) return; // superseded by a newer run
      setError(message);
      setResults(null);
      setLastRunSummary({ passed: 0, failed: total, total });
    };

    try {
      const source = buildDriverSource({ language, entryPoint, testCases }, userCode);
      const { stdout, stderr, wallTimeMs, memoryBytes: mem } = await executeCode({
        language,
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
  }, []);

  /** Clears run state — call when switching to a different lesson so its output panel doesn't show the last lesson's results. */
  const reset = useCallback(() => {
    runIdRef.current++; // invalidate any in-flight run
    setIsLoading(false);
    setResults(null);
    setLastRunSummary(null);
    setRuntimeMs(null);
    setMemoryBytes(null);
    setError(null);
  }, []);

  return { isLoading, results, lastRunSummary, runtimeMs, memoryBytes, error, runTests, reset };
}
