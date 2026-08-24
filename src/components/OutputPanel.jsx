import React from "react";

const COLORS = {
  comment: "#565F89",
  fgDim: "#787C99",
  fg: "#C0CAF5",
  green: "#9ECE6A",
  red: "#F7768E",
  blue: "#7AA2F7",
  border: "#2E3244",
};

const FONTS = { mono: "'JetBrains Mono', monospace" };

function formatMemory(bytes) {
  if (bytes == null) return null;
  return `${(bytes / 1024).toFixed(0)}KB`;
}

// TODO(hints): when a test fails, this is where a "get a hint" affordance
// should go — nudge toward the bug (e.g. "check your loop's exit condition"),
// never reveal the fix outright, so it doesn't undercut the struggle-timer
// mechanic. Not implemented yet — future phase.
function HintStub() {
  return null;
}

export default function OutputPanel({ state, error, results, runtimeMs, memoryBytes, testCount }) {
  if (state === "idle") {
    return <span style={{ color: COLORS.comment }}>&gt; awaiting run&hellip;</span>;
  }

  if (state === "loading") {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: "10px", color: COLORS.fgDim }}>
        <div
          style={{
            width: "13px",
            height: "13px",
            border: `2px solid ${COLORS.border}`,
            borderTopColor: COLORS.blue,
            borderRadius: "50%",
            animation: "spin 0.7s linear infinite",
          }}
        />
        running your code&hellip;
      </div>
    );
  }

  if (state === "error") {
    return (
      <div style={{ color: COLORS.red, whiteSpace: "pre-wrap", fontFamily: FONTS.mono }}>
        &#10007; {error}
      </div>
    );
  }

  const passed = results.filter((r) => r.passed).length;
  const allPassed = passed === testCount;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
      {results.map((r, i) => (
        <div key={i} style={{ color: r.passed ? COLORS.green : COLORS.red }}>
          {r.passed ? "✓" : "✗"} test {i + 1} {r.passed ? "passed" : "failed"}
          {r.error
            ? ` — ${r.error}`
            : !r.passed
            ? ` — got ${JSON.stringify(r.actual)}, expected ${JSON.stringify(r.expected)}`
            : ""}
          {!r.passed && <HintStub />}
        </div>
      ))}
      <span style={{ color: COLORS.fg, marginTop: "4px" }}>
        {passed}/{testCount} passed
        {runtimeMs != null && ` · runtime ${runtimeMs}ms`}
        {formatMemory(memoryBytes) && ` · memory ${formatMemory(memoryBytes)}`}
        {allPassed && " · +40 XP"}
      </span>
      {/* TODO(complexity): once correctness is solid, this is where a
          Big-O / complexity grading pass would run against the same
          submission and report alongside pass/fail — not implemented yet. */}
    </div>
  );
}
